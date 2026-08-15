import { Router } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireAdmin, resolveUnitScope, canAccessUnit, type AuthRequest } from "../middleware/auth";
import { logger } from "../utils/logger";
import { MSG } from "../lib/messages";
import { withDetail, formatZodDetail } from "../lib/routeHelpers";
import { getPanorama } from "../modules/intelligence/panorama/service";
import { getNetworkBoard, getUnitDiagnostic } from "../modules/intelligence/network/service";
import { getOrdersBoard, getOrdersFlow } from "../modules/intelligence/operational-orders/service";
import { getCapacityHeatmap, getSlotDetail } from "../modules/intelligence/capacity/service";
import { getPortfolioProducts } from "../modules/intelligence/portfolio/service";
import { getServicePerformance } from "../modules/intelligence/service-performance/service";
import { getCustomerFlow } from "../modules/intelligence/customers/service";
import { getSubscriptionHealth } from "../modules/intelligence/subscriptions/service";
import { getFranchisePipeline, moveLeadStage } from "../modules/intelligence/franchise-pipeline/service";
import { FRANCHISE_STAGES, type FranchiseStage } from "../modules/intelligence/franchise-pipeline/types";
import { recordAudit } from "../lib/auditLog";
import { getRadarBriefing } from "../modules/intelligence/radar/service";
import { getBottlenecksRanking } from "../modules/intelligence/gargalos/service";
import { getMoneyOverview } from "../modules/intelligence/money/service";
import { getUnitComparator } from "../modules/intelligence/comparator/service";
import { getInsightFeed } from "../modules/intelligence/insights/service";

/**
 * Admin V2 (PLAN-0022) — rotas novas sob /api/admin-v2/*, paralelas ao Admin legado.
 * Gate igual ao frontend (`RequireAdmin`): requireAdmin (ADMIN/MASTER). Ampliar o acesso
 * (MANAGER/PROFESSIONAL com escopo de unidade) é decisão de produto explícita — não deste
 * plano — ver DECISION-013 e a nota de escopo do PLAN-0022 §Onda 1.
 */

const adminV2Router = Router();

/**
 * Schemas Zod (SYSTEM.md — "Toda entrada deve ter schema Zod explicito"). Filtros opcionais
 * (unitIds, days/from/to) seguem tolerantes por design, mesmo comportamento de antes desta
 * leva: query mal formada vira filtro ignorado, nunca `400` — `.catch()` preserva isso sem
 * voltar a checagem manual de `typeof`. Campos obrigatórios (unitId único, date/hour do
 * slot, stage do PATCH) são validados a valer e devolvem `400` com o detalhe do Zod quando
 * inválidos — mesmo padrão de `routes/schedule.ts`.
 */
const unitIdsListSchema = z
  .string()
  .optional()
  .transform((raw) => {
    if (!raw || raw.trim() === "" || raw === "all") return undefined;
    const ids = raw
      .split(",")
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isFinite(value) && value > 0);
    return ids.length > 0 ? ids : undefined;
  })
  .catch(undefined);

const periodQuerySchema = z.object({
  days: z.coerce.number().finite().optional().catch(undefined),
  from: z.string().optional().catch(undefined),
  to: z.string().optional().catch(undefined),
});

const singleUnitIdQuerySchema = z.object({
  unitId: z.coerce.number().positive(),
});

const slotQuerySchema = z.object({
  unitId: z.coerce.number().positive(),
  date: z.string().min(1),
  hour: z.coerce.number().int().min(0).max(23),
});

const stageBodySchema = z.object({
  stage: z.enum(FRANCHISE_STAGES),
  /** PLAN-0025 (item 3) — opcional no contrato (não quebra clients que não mandem o campo);
   * a obrigatoriedade de preencher é imposta na UI (modal), não aqui. */
  reason: z.string().min(1).max(500).optional(),
});

/**
 * requireAdmin só deixa ADMIN/MASTER passarem, e resolveUnitScope sempre devolve "all"
 * para esses papéis. Mesmo assim nunca confiamos só no client (governança #3 do
 * PLAN-0022): se o gate de alguma destas rotas for ampliado numa onda futura, o filtro de
 * unidade pedido já sai cruzado contra o escopo real do usuário, sem precisar revisar isto.
 */
const resolveRequestedUnitIds = (req: AuthRequest): number[] | undefined => {
  const scope = resolveUnitScope(req);
  const requested = unitIdsListSchema.parse(req.query.unitIds);
  return scope.kind === "all" ? requested : (requested?.filter((id) => scope.unitIds.includes(id)) ?? scope.unitIds);
};

const parsePeriodQuery = (req: AuthRequest) => periodQuerySchema.parse(req.query);

adminV2Router.get("/admin-v2/panorama", requireAdmin, async (req: AuthRequest, res) => {
  try {
    const panorama = await getPanorama({ ...parsePeriodQuery(req), unitIds: resolveRequestedUnitIds(req) });
    res.json(panorama);
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro inesperado";
    if (message.startsWith("invalid_")) {
      res.status(400).json({ message: MSG.INVALID_PAYLOAD });
      return;
    }
    logger.error("Falha ao carregar panorama do admin v2", { error: message });
    res.status(500).json({ message: MSG.SERVER_ERROR });
  }
});

adminV2Router.get("/admin-v2/network", requireAdmin, async (req: AuthRequest, res) => {
  try {
    const board = await getNetworkBoard({ ...parsePeriodQuery(req), unitIds: resolveRequestedUnitIds(req) });
    res.json(board);
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro inesperado";
    if (message.startsWith("invalid_")) {
      res.status(400).json({ message: MSG.INVALID_PAYLOAD });
      return;
    }
    logger.error("Falha ao carregar mapa da rede do admin v2", { error: message });
    res.status(500).json({ message: MSG.SERVER_ERROR });
  }
});

adminV2Router.get("/admin-v2/network/units/:id", requireAdmin, async (req: AuthRequest, res) => {
  const unitId = Number(req.params.id);
  if (!Number.isFinite(unitId) || unitId <= 0) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }
  if (!canAccessUnit(req, unitId)) {
    res.status(403).json({ message: MSG.FORBIDDEN });
    return;
  }

  try {
    const diagnostic = await getUnitDiagnostic({ ...parsePeriodQuery(req), unitId });
    res.json(diagnostic);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      res.status(404).json({ message: MSG.UNIT_NOT_FOUND });
      return;
    }
    const message = error instanceof Error ? error.message : "erro inesperado";
    if (message.startsWith("invalid_")) {
      res.status(400).json({ message: MSG.INVALID_PAYLOAD });
      return;
    }
    logger.error("Falha ao carregar diagnostico da unidade (admin v2)", { error: message, unitId });
    res.status(500).json({ message: MSG.SERVER_ERROR });
  }
});

adminV2Router.get("/admin-v2/operations/orders", requireAdmin, async (req: AuthRequest, res) => {
  try {
    const board = await getOrdersBoard({ ...parsePeriodQuery(req), unitIds: resolveRequestedUnitIds(req) });
    res.json(board);
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro inesperado";
    if (message.startsWith("invalid_")) {
      res.status(400).json({ message: MSG.INVALID_PAYLOAD });
      return;
    }
    logger.error("Falha ao carregar board operacional de pedidos (admin v2)", { error: message });
    res.status(500).json({ message: MSG.SERVER_ERROR });
  }
});

adminV2Router.get("/admin-v2/operations/orders/flow", requireAdmin, async (req: AuthRequest, res) => {
  try {
    const flow = await getOrdersFlow({ ...parsePeriodQuery(req), unitIds: resolveRequestedUnitIds(req) });
    res.json(flow);
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro inesperado";
    if (message.startsWith("invalid_")) {
      res.status(400).json({ message: MSG.INVALID_PAYLOAD });
      return;
    }
    logger.error("Falha ao carregar fluxo operacional de pedidos (admin v2)", { error: message });
    res.status(500).json({ message: MSG.SERVER_ERROR });
  }
});

adminV2Router.get("/admin-v2/operations/agenda/capacity", requireAdmin, async (req: AuthRequest, res) => {
  const parsedQuery = singleUnitIdQuerySchema.safeParse(req.query);
  if (!parsedQuery.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsedQuery.error.issues)),
    });
    return;
  }
  const { unitId } = parsedQuery.data;
  if (!canAccessUnit(req, unitId)) {
    res.status(403).json({ message: MSG.FORBIDDEN });
    return;
  }

  try {
    const heatmap = await getCapacityHeatmap({ ...parsePeriodQuery(req), unitId });
    res.json(heatmap);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      res.status(404).json({ message: MSG.UNIT_NOT_FOUND });
      return;
    }
    const message = error instanceof Error ? error.message : "erro inesperado";
    if (message.startsWith("invalid_")) {
      res.status(400).json({ message: MSG.INVALID_PAYLOAD });
      return;
    }
    logger.error("Falha ao carregar mapa de capacidade da agenda (admin v2)", { error: message, unitId });
    res.status(500).json({ message: MSG.SERVER_ERROR });
  }
});

adminV2Router.get("/admin-v2/operations/agenda/slots", requireAdmin, async (req: AuthRequest, res) => {
  const parsedQuery = slotQuerySchema.safeParse(req.query);
  if (!parsedQuery.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsedQuery.error.issues)),
    });
    return;
  }
  const { unitId, date, hour } = parsedQuery.data;
  if (!canAccessUnit(req, unitId)) {
    res.status(403).json({ message: MSG.FORBIDDEN });
    return;
  }

  try {
    const detail = await getSlotDetail({ ...parsePeriodQuery(req), unitId, date, hour });
    res.json(detail);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      res.status(404).json({ message: MSG.UNIT_NOT_FOUND });
      return;
    }
    const message = error instanceof Error ? error.message : "erro inesperado";
    if (message.startsWith("invalid_")) {
      res.status(400).json({ message: MSG.INVALID_PAYLOAD });
      return;
    }
    logger.error("Falha ao carregar detalhamento de horário da agenda (admin v2)", {
      error: message,
      unitId,
      date,
      hour,
    });
    res.status(500).json({ message: MSG.SERVER_ERROR });
  }
});

adminV2Router.get("/admin-v2/portfolio/products", requireAdmin, async (req: AuthRequest, res) => {
  try {
    const portfolio = await getPortfolioProducts({ ...parsePeriodQuery(req), unitIds: resolveRequestedUnitIds(req) });
    res.json(portfolio);
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro inesperado";
    if (message.startsWith("invalid_")) {
      res.status(400).json({ message: MSG.INVALID_PAYLOAD });
      return;
    }
    logger.error("Falha ao carregar portfolio de produtos (admin v2)", { error: message });
    res.status(500).json({ message: MSG.SERVER_ERROR });
  }
});

adminV2Router.get("/admin-v2/portfolio/services", requireAdmin, async (req: AuthRequest, res) => {
  try {
    const performance = await getServicePerformance({ ...parsePeriodQuery(req), unitIds: resolveRequestedUnitIds(req) });
    res.json(performance);
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro inesperado";
    if (message.startsWith("invalid_")) {
      res.status(400).json({ message: MSG.INVALID_PAYLOAD });
      return;
    }
    logger.error("Falha ao carregar performance de servicos (admin v2)", { error: message });
    res.status(500).json({ message: MSG.SERVER_ERROR });
  }
});

adminV2Router.get("/admin-v2/customers", requireAdmin, async (req: AuthRequest, res) => {
  try {
    const flow = await getCustomerFlow({ ...parsePeriodQuery(req), unitIds: resolveRequestedUnitIds(req) });
    res.json(flow);
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro inesperado";
    if (message.startsWith("invalid_")) {
      res.status(400).json({ message: MSG.INVALID_PAYLOAD });
      return;
    }
    logger.error("Falha ao carregar fluxo de clientes (admin v2)", { error: message });
    res.status(500).json({ message: MSG.SERVER_ERROR });
  }
});

// Sem `unitIds`: `Subscription` não tem `unitId` no schema (mesma nota da Onda 1) — rede
// inteira sempre, diferente de todas as outras rotas de lista do Admin V2.
adminV2Router.get("/admin-v2/subscriptions/health", requireAdmin, async (req: AuthRequest, res) => {
  try {
    const health = await getSubscriptionHealth(parsePeriodQuery(req));
    res.json(health);
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro inesperado";
    if (message.startsWith("invalid_")) {
      res.status(400).json({ message: MSG.INVALID_PAYLOAD });
      return;
    }
    logger.error("Falha ao carregar saude de assinaturas (admin v2)", { error: message });
    res.status(500).json({ message: MSG.SERVER_ERROR });
  }
});

adminV2Router.get("/admin-v2/growth/franchises/pipeline", requireAdmin, async (_req: AuthRequest, res) => {
  try {
    const pipeline = await getFranchisePipeline();
    res.json(pipeline);
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro inesperado";
    logger.error("Falha ao carregar pipeline de franquias (admin v2)", { error: message });
    res.status(500).json({ message: MSG.SERVER_ERROR });
  }
});

// RETROFIT-010b — única escrita do módulo (Kanban continua "usuário nunca arrasta": a
// mudança de etapa vem de um seletor explícito no card, não de drag-and-drop). Movimento
// livre entre qualquer par de etapas — ver justificativa em `moveLeadStage` (service.ts).
adminV2Router.patch("/admin-v2/growth/franchises/:id/stage", requireAdmin, async (req: AuthRequest, res) => {
  const leadId = Number(req.params.id);
  if (!Number.isFinite(leadId) || leadId <= 0) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }
  const parsedBody = stageBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsedBody.error.issues)),
    });
    return;
  }
  const stage: FranchiseStage = parsedBody.data.stage;
  const reason = parsedBody.data.reason;

  try {
    const pipeline = await moveLeadStage(leadId, stage, reason);
    recordAudit("FRANCHISE_LEAD_STAGE_CHANGE", { userId: req.user?.id, req, meta: { leadId, toStage: stage, reason } });
    res.json(pipeline);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      res.status(404).json({ message: MSG.FRANCHISE_LEAD_NOT_FOUND });
      return;
    }
    const message = error instanceof Error ? error.message : "erro inesperado";
    logger.error("Falha ao mover etapa de lead de franquia (admin v2)", { error: message, leadId });
    res.status(500).json({ message: MSG.SERVER_ERROR });
  }
});

// PLAN-0023 (Onda 1 / RETROFIT-011) — Radar Executivo. Sem `unitIds`: é um briefing de
// rede inteira, mesmo escopo do Panorama, não uma visão por unidade.
adminV2Router.get("/admin-v2/radar", requireAdmin, async (req: AuthRequest, res) => {
  try {
    const briefing = await getRadarBriefing(parsePeriodQuery(req));
    res.json(briefing);
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro inesperado";
    if (message.startsWith("invalid_")) {
      res.status(400).json({ message: MSG.INVALID_PAYLOAD });
      return;
    }
    logger.error("Falha ao carregar radar executivo (admin v2)", { error: message });
    res.status(500).json({ message: MSG.SERVER_ERROR });
  }
});

// PLAN-0023 (Onda 2 / RETROFIT-012) — Gargalos. Sem `unitIds`: rede inteira, mesmo
// escopo do Radar (Onda 1) — a Agenda (por unidade, Onda 4) é somada internamente.
adminV2Router.get("/admin-v2/gargalos", requireAdmin, async (req: AuthRequest, res) => {
  try {
    const ranking = await getBottlenecksRanking(parsePeriodQuery(req));
    res.json(ranking);
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro inesperado";
    if (message.startsWith("invalid_")) {
      res.status(400).json({ message: MSG.INVALID_PAYLOAD });
      return;
    }
    logger.error("Falha ao carregar ranking de gargalos (admin v2)", { error: message });
    res.status(500).json({ message: MSG.SERVER_ERROR });
  }
});

// PLAN-0023 (Onda 3 / RETROFIT-013) — "Onde está o dinheiro?". Sem `unitIds`: a
// decomposição por unidade já vem embutida em `byUnit` (rede inteira sempre, mesmo
// padrão do Radar e do Gargalos).
adminV2Router.get("/admin-v2/money", requireAdmin, async (req: AuthRequest, res) => {
  try {
    const overview = await getMoneyOverview(parsePeriodQuery(req));
    res.json(overview);
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro inesperado";
    if (message.startsWith("invalid_")) {
      res.status(400).json({ message: MSG.INVALID_PAYLOAD });
      return;
    }
    logger.error("Falha ao carregar visão financeira (admin v2)", { error: message });
    res.status(500).json({ message: MSG.SERVER_ERROR });
  }
});

// PLAN-0023 (Onda 4 / RETROFIT-014) — Comparador Visual de Unidades. Sem `unitIds`:
// compara sempre a rede inteira (mesmo padrão do Radar/Gargalos/Dinheiro) — filtrar pra
// menos de 2 unidades tornaria a própria tela sem sentido (nada a comparar).
adminV2Router.get("/admin-v2/comparator", requireAdmin, async (req: AuthRequest, res) => {
  try {
    const comparator = await getUnitComparator(parsePeriodQuery(req));
    res.json(comparator);
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro inesperado";
    if (message.startsWith("invalid_")) {
      res.status(400).json({ message: MSG.INVALID_PAYLOAD });
      return;
    }
    logger.error("Falha ao carregar comparador de unidades (admin v2)", { error: message });
    res.status(500).json({ message: MSG.SERVER_ERROR });
  }
});

// PLAN-0023 (Onda 6 / RETROFIT-018) — Insight Engine. Sem `unitIds`: consolida Radar +
// Gargalos + Comparador, todos já de rede inteira.
adminV2Router.get("/admin-v2/insights", requireAdmin, async (req: AuthRequest, res) => {
  try {
    const feed = await getInsightFeed(parsePeriodQuery(req));
    res.json(feed);
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro inesperado";
    if (message.startsWith("invalid_")) {
      res.status(400).json({ message: MSG.INVALID_PAYLOAD });
      return;
    }
    logger.error("Falha ao carregar feed de insights (admin v2)", { error: message });
    res.status(500).json({ message: MSG.SERVER_ERROR });
  }
});

export { adminV2Router };
