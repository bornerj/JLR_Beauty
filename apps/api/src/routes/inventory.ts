import { Router, type Response } from "express";
import { z } from "zod";
import {
  requireStaff,
  requireManager,
  canAccessUnit,
  resolveUnitScope,
  type AuthRequest,
} from "../middleware/auth";
import prisma from "../lib/prisma";
import { logger } from "../utils/logger";
import { withDetail, formatZodDetail } from "../lib/routeHelpers";
import { MSG } from "../lib/messages";
import { applyStockMovement, applyStockAdjustment, StockError, MAX_MOVEMENT_QUANTITY } from "../lib/stockLedger";
import { releaseReservation } from "../lib/stockReservation";
import { recordAudit, type AuditAction } from "../lib/auditLog";
import { getSalesInsights, getInventoryOverview } from "../modules/admin/kpis";

/**
 * Rotas de estoque multi-unidade (PLAN-0020).
 * Escopo por papel imposto no servidor (S1/S2 — fail-closed):
 * - Leitura de estoque da própria unidade: qualquer staff.
 * - Movimentos (entrada/uso/perda/ajuste): gerente da unidade ou admin/master.
 * - Consulta cross-unit: read-only, só saldos (S7).
 */

const inventoryRouter = Router();

const movementSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(MAX_MOVEMENT_QUANTITY),
  unitCost: z.coerce.number().min(0).optional(),
  reason: z.string().max(200).optional(),
  note: z.string().max(2000).optional(),
});

const adjustSchema = z.object({
  /// AJUSTE define o saldo REAL alvo (inventário/contagem) — exige razão (S6).
  targetStock: z.coerce.number().int().min(0).max(MAX_MOVEMENT_QUANTITY),
  reason: z.string().min(3).max(200),
  note: z.string().max(2000).optional(),
});

const parseId = (value: string | string[] | undefined): number | null => {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const guardUnitAccess = (req: AuthRequest, unitId: number): boolean =>
  Boolean(req.user) && canAccessUnit(req, unitId);

type MovementKind = "entry" | "consumption" | "loss";

const MOVEMENT_CONFIG: Record<
  MovementKind,
  { type: "ENTRADA_COMPRA" | "USO_SALAO" | "PERDA"; audit: AuditAction; defaultReason: string }
> = {
  entry: { type: "ENTRADA_COMPRA", audit: "STOCK_ENTRY", defaultReason: "entrada de compra" },
  consumption: { type: "USO_SALAO", audit: "STOCK_CONSUMPTION", defaultReason: "uso no salao" },
  loss: { type: "PERDA", audit: "STOCK_LOSS", defaultReason: "perda/quebra" },
};

const handleMovement = async (
  req: AuthRequest,
  res: Response,
  kind: MovementKind
): Promise<void> => {
  const unitId = parseId(req.params.unitId);
  const productId = parseId(req.params.productId);
  if (!unitId || !productId) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }
  if (!guardUnitAccess(req, unitId)) {
    res.status(403).json({ message: MSG.FORBIDDEN });
    return;
  }
  const parsed = movementSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });
  if (!product) {
    res.status(404).json({ message: MSG.PRODUCT_NOT_FOUND });
    return;
  }

  const config = MOVEMENT_CONFIG[kind];
  try {
    const result = await prisma.$transaction((tx) =>
      applyStockMovement(tx, {
        productId,
        unitId,
        type: config.type,
        quantity: parsed.data.quantity,
        unitCost: parsed.data.unitCost ?? null,
        reason: parsed.data.reason || config.defaultReason,
        note: parsed.data.note ?? null,
        userId: req.user?.id ?? null,
      })
    );
    recordAudit(config.audit, {
      userId: req.user?.id,
      req,
      meta: { productId, unitId, quantity: parsed.data.quantity, balanceAfter: result.balanceAfter },
    });
    res.status(201).json({ ok: true, balanceAfter: result.balanceAfter });
  } catch (error) {
    if (error instanceof StockError) {
      res.status(400).json({ message: MSG.INVALID_PAYLOAD, ...withDetail(error.message) });
      return;
    }
    logger.error("Falha ao registrar movimento de estoque", {
      kind,
      productId,
      unitId,
      error: error instanceof Error ? error.message : "erro inesperado",
    });
    res.status(500).json({ message: MSG.SERVER_ERROR });
  }
};

// Entrada por compra — gerente/admin
inventoryRouter.post(
  "/units/:unitId/products/:productId/stock/entry",
  requireManager,
  (req: AuthRequest, res) => void handleMovement(req, res, "entry")
);

// Baixa por uso interno no salão — qualquer staff da unidade
inventoryRouter.post(
  "/units/:unitId/products/:productId/stock/consumption",
  requireStaff,
  (req: AuthRequest, res) => void handleMovement(req, res, "consumption")
);

// Perda/quebra/vencimento — gerente/admin
inventoryRouter.post(
  "/units/:unitId/products/:productId/stock/loss",
  requireManager,
  (req: AuthRequest, res) => void handleMovement(req, res, "loss")
);

// Ajuste de inventário (define saldo alvo) — gerente/admin, exige razão (S6)
inventoryRouter.post(
  "/units/:unitId/products/:productId/stock/adjust",
  requireManager,
  async (req: AuthRequest, res) => {
    const unitId = parseId(req.params.unitId);
    const productId = parseId(req.params.productId);
    if (!unitId || !productId) {
      res.status(400).json({ message: MSG.INVALID_PAYLOAD });
      return;
    }
    if (!guardUnitAccess(req, unitId)) {
      res.status(403).json({ message: MSG.FORBIDDEN });
      return;
    }
    const parsed = adjustSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        message: MSG.INVALID_PAYLOAD,
        ...withDetail(formatZodDetail(parsed.error.issues)),
      });
      return;
    }
    try {
      const result = await prisma.$transaction((tx) =>
        applyStockAdjustment(tx, {
          productId,
          unitId,
          targetStock: parsed.data.targetStock,
          reason: parsed.data.reason,
          note: parsed.data.note ?? null,
          userId: req.user?.id ?? null,
        })
      );
      recordAudit("STOCK_ADJUST", {
        userId: req.user?.id,
        req,
        meta: {
          productId,
          unitId,
          targetStock: parsed.data.targetStock,
          reason: parsed.data.reason,
        },
      });
      res.status(201).json({ ok: true, balanceAfter: result.balanceAfter });
    } catch (error) {
      if (error instanceof StockError) {
        res.status(400).json({ message: MSG.INVALID_PAYLOAD, ...withDetail(error.message) });
        return;
      }
      logger.error("Falha ao ajustar estoque", {
        productId,
        unitId,
        error: error instanceof Error ? error.message : "erro inesperado",
      });
      res.status(500).json({ message: MSG.SERVER_ERROR });
    }
  }
);

// Histórico de movimentação do produto na unidade
inventoryRouter.get(
  "/units/:unitId/products/:productId/movements",
  requireStaff,
  async (req: AuthRequest, res) => {
    const unitId = parseId(req.params.unitId);
    const productId = parseId(req.params.productId);
    if (!unitId || !productId) {
      res.status(400).json({ message: MSG.INVALID_PAYLOAD });
      return;
    }
    if (!guardUnitAccess(req, unitId)) {
      res.status(403).json({ message: MSG.FORBIDDEN });
      return;
    }
    const movements = await prisma.stockMovement.findMany({
      where: { productId, unitId },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        type: true,
        quantity: true,
        balanceAfter: true,
        unitCost: true,
        reason: true,
        note: true,
        refOrderId: true,
        createdAt: true,
        createdBy: { select: { id: true, name: true } },
      },
    });
    res.json(movements);
  }
);

// Saldos da unidade (todos os produtos) — staff da unidade
inventoryRouter.get("/units/:unitId/inventory", requireStaff, async (req: AuthRequest, res) => {
  const unitId = parseId(req.params.unitId);
  if (!unitId) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }
  if (!guardUnitAccess(req, unitId)) {
    res.status(403).json({ message: MSG.FORBIDDEN });
    return;
  }
  const rows = await prisma.productStock.findMany({
    where: { unitId },
    orderBy: { productId: "asc" },
    select: {
      productId: true,
      stock: true,
      reserved: true,
      product: {
        select: { name: true, sku: true, price: true, minStock: true, maxStock: true },
      },
    },
  });
  res.json(
    rows.map((row) => ({
      productId: row.productId,
      name: row.product.name,
      sku: row.product.sku,
      price: row.product.price,
      stock: row.stock,
      reserved: row.reserved,
      available: row.stock - row.reserved,
      minStock: row.product.minStock,
      maxStock: row.product.maxStock,
      low: row.stock <= row.product.minStock,
      excess: row.product.maxStock !== null && row.stock >= row.product.maxStock,
    }))
  );
});

// Resumo do estoque da unidade (KPIs)
inventoryRouter.get(
  "/units/:unitId/inventory/summary",
  requireStaff,
  async (req: AuthRequest, res) => {
    const unitId = parseId(req.params.unitId);
    if (!unitId) {
      res.status(400).json({ message: MSG.INVALID_PAYLOAD });
      return;
    }
    if (!guardUnitAccess(req, unitId)) {
      res.status(403).json({ message: MSG.FORBIDDEN });
      return;
    }
    const rows = await prisma.productStock.findMany({
      where: { unitId },
      select: {
        stock: true,
        reserved: true,
        product: { select: { price: true, minStock: true, maxStock: true } },
      },
    });
    let stockValue = 0;
    let outOfStock = 0;
    let lowStock = 0;
    let excessStock = 0;
    for (const row of rows) {
      stockValue += Number(row.product.price) * row.stock;
      if (row.stock <= 0) outOfStock += 1;
      else if (row.stock <= row.product.minStock) lowStock += 1;
      if (row.product.maxStock !== null && row.stock >= row.product.maxStock) excessStock += 1;
    }
    res.json({
      unitId,
      items: rows.length,
      stockValue: Math.round(stockValue * 100) / 100,
      outOfStock,
      lowStock,
      excessStock,
    });
  }
);

// Reservas da unidade (ativas/expiradas/etc.) — relatório PRD 2.4.1
inventoryRouter.get(
  "/units/:unitId/reservations",
  requireStaff,
  async (req: AuthRequest, res) => {
    const unitId = parseId(req.params.unitId);
    if (!unitId) {
      res.status(400).json({ message: MSG.INVALID_PAYLOAD });
      return;
    }
    if (!guardUnitAccess(req, unitId)) {
      res.status(403).json({ message: MSG.FORBIDDEN });
      return;
    }
    const statusFilter = String(req.query.status || "").toUpperCase();
    const validStatuses = ["ACTIVE", "CONFIRMED", "RELEASED", "EXPIRED"] as const;
    const status = (validStatuses as readonly string[]).includes(statusFilter)
      ? (statusFilter as (typeof validStatuses)[number])
      : undefined;
    const reservations = await prisma.stockReservation.findMany({
      where: { unitId, ...(status ? { status } : {}) },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        productId: true,
        quantity: true,
        status: true,
        channel: true,
        expiresAt: true,
        orderId: true,
        createdAt: true,
        product: { select: { name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
    res.json(reservations);
  }
);

// Liberação manual de reserva — gerente/admin da unidade (S11)
inventoryRouter.post(
  "/reservations/:reservationId/release",
  requireManager,
  async (req: AuthRequest, res) => {
    const reservationId = parseId(req.params.reservationId);
    if (!reservationId) {
      res.status(400).json({ message: MSG.INVALID_PAYLOAD });
      return;
    }
    const reservation = await prisma.stockReservation.findUnique({
      where: { id: reservationId },
      select: { id: true, unitId: true, status: true },
    });
    if (!reservation) {
      res.status(404).json({ message: "reserva nao encontrada" });
      return;
    }
    if (!guardUnitAccess(req, reservation.unitId)) {
      res.status(403).json({ message: MSG.FORBIDDEN });
      return;
    }
    const released = await prisma.$transaction((tx) =>
      releaseReservation(tx, reservationId, "RELEASED")
    );
    if (released) {
      recordAudit("STOCK_RESERVATION_RELEASE", {
        userId: req.user?.id,
        req,
        meta: { reservationId, unitId: reservation.unitId },
      });
    }
    res.json({ ok: true, released });
  }
);

// Consulta cross-unit: só saldos, sem dados financeiros (S7)
inventoryRouter.get("/inventory/cross-unit", requireStaff, async (req: AuthRequest, res) => {
  const productId = parseId(String(req.query.productId || ""));
  if (!productId) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD, ...withDetail("productId obrigatorio") });
    return;
  }
  const rows = await prisma.productStock.findMany({
    where: { productId },
    orderBy: { unitId: "asc" },
    select: {
      unitId: true,
      stock: true,
      reserved: true,
      unit: { select: { name: true, isOnline: true } },
    },
  });
  res.json(
    rows.map((row) => ({
      unitId: row.unitId,
      unitName: row.unit.name,
      isOnline: row.unit.isOnline,
      available: row.stock - row.reserved,
    }))
  );
});

// BI de vendas com recorte por papel imposto no servidor (S4 — fail-closed):
// PROFESSIONAL → só as próprias vendas; MANAGER → sua unidade;
// ADMIN/MASTER → filtros livres (unitId/sellerUserId opcionais).
inventoryRouter.get("/dashboard/sales-insights", requireStaff, async (req: AuthRequest, res) => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ message: MSG.UNAUTHORIZED });
    return;
  }
  const queryDays = typeof req.query.days === "string" ? Number(req.query.days) : undefined;
  const queryFrom = typeof req.query.from === "string" ? req.query.from : undefined;
  const queryTo = typeof req.query.to === "string" ? req.query.to : undefined;
  const queryUnitId = parseId(typeof req.query.unitId === "string" ? req.query.unitId : undefined);
  const querySellerId = parseId(
    typeof req.query.sellerUserId === "string" ? req.query.sellerUserId : undefined
  );

  let unitId: number | undefined;
  let sellerUserId: number | undefined;
  if (user.role === "PROFESSIONAL") {
    sellerUserId = user.id; // só as próprias vendas — sempre
    unitId = user.unitId ?? undefined;
  } else if (user.role === "MANAGER") {
    if (!user.unitId) {
      res.status(403).json({ message: MSG.FORBIDDEN, ...withDetail("usuario sem unidade") });
      return;
    }
    unitId = user.unitId; // sempre a própria unidade
    sellerUserId = querySellerId ?? undefined;
  } else {
    // ADMIN/MASTER
    if (queryUnitId && !canAccessUnit(req, queryUnitId)) {
      res.status(403).json({ message: MSG.FORBIDDEN });
      return;
    }
    unitId = queryUnitId ?? undefined;
    sellerUserId = querySellerId ?? undefined;
  }

  try {
    const insights = await getSalesInsights({
      days: Number.isFinite(queryDays) ? queryDays : undefined,
      from: queryFrom,
      to: queryTo,
      unitId,
      sellerUserId,
    });
    res.json(insights);
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro inesperado";
    if (message.startsWith("invalid_")) {
      res.status(400).json({ message: MSG.INVALID_PAYLOAD, ...withDetail(message) });
      return;
    }
    logger.error("Falha ao carregar sales-insights", { error: message });
    res.status(500).json({ message: MSG.SERVER_ERROR });
  }
});

// Visão de estoque por unidade + consolidado — gerente vê a sua; admin vê todas
inventoryRouter.get(
  "/dashboard/inventory-overview",
  requireManager,
  async (req: AuthRequest, res) => {
    const scope = resolveUnitScope(req);
    if (scope.kind === "units" && scope.unitIds.length === 0) {
      res.status(403).json({ message: MSG.FORBIDDEN, ...withDetail("usuario sem unidade") });
      return;
    }
    try {
      const overview = await getInventoryOverview(
        scope.kind === "all" ? undefined : scope.unitIds
      );
      res.json(overview);
    } catch (error) {
      logger.error("Falha ao carregar inventory-overview", {
        error: error instanceof Error ? error.message : "erro inesperado",
      });
      res.status(500).json({ message: MSG.SERVER_ERROR });
    }
  }
);

// Unidades visíveis ao usuário (para selects de estoque/venda)
inventoryRouter.get("/inventory/units", requireStaff, async (req: AuthRequest, res) => {
  const scope = resolveUnitScope(req);
  const units = await prisma.unit.findMany({
    where: scope.kind === "all" ? {} : { id: { in: scope.unitIds } },
    orderBy: { id: "asc" },
    select: { id: true, name: true, kind: true, isOnline: true },
  });
  res.json({ scope: scope.kind, units });
});

export { inventoryRouter };
