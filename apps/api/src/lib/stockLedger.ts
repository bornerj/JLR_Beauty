import { Prisma, type StockMovementType } from "@prisma/client";

/**
 * Motor de estoque multi-unidade (PLAN-0020).
 *
 * Invariantes:
 * - `ProductStock` é o saldo autoritativo por unidade; `Product.stock` é o
 *   cache global (soma das unidades) e SÓ é escrito por este módulo.
 * - Todo movimento de estoque REAL gera uma linha em `StockMovement` (ledger).
 * - Concorrência: a linha de `ProductStock` é travada com SELECT ... FOR UPDATE
 *   dentro da transação chamadora (S5 — sem overselling).
 * - `quantity` é sempre positivo; a direção vem do `type`.
 */

const INBOUND_TYPES: StockMovementType[] = ["ENTRADA_COMPRA", "DEVOLUCAO"];

export const MAX_MOVEMENT_QUANTITY = 100000;

export type StockMovementInput = {
  productId: number;
  unitId: number;
  type: StockMovementType;
  quantity: number;
  unitCost?: number | null;
  reason?: string | null;
  note?: string | null;
  refOrderId?: number | null;
  userId?: number | null;
};

export class StockError extends Error {
  constructor(
    public readonly code:
      | "invalid_quantity"
      | "insufficient_stock"
      | "insufficient_available"
      | "product_stock_missing",
    message: string
  ) {
    super(message);
    this.name = "StockError";
  }
}

const assertQuantity = (quantity: number): void => {
  if (!Number.isInteger(quantity) || quantity <= 0 || quantity > MAX_MOVEMENT_QUANTITY) {
    throw new StockError("invalid_quantity", `quantidade invalida: ${quantity}`);
  }
};

/**
 * Garante a existência da linha (productId, unitId) e a trava com FOR UPDATE.
 * Retorna os saldos atuais já sob lock.
 */
export const lockProductStockRow = async (
  tx: Prisma.TransactionClient,
  productId: number,
  unitId: number
): Promise<{ id: number; stock: number; reserved: number }> => {
  await tx.productStock.upsert({
    where: { productId_unitId: { productId, unitId } },
    create: { productId, unitId, stock: 0, reserved: 0 },
    update: {},
  });
  const rows = await tx.$queryRaw<Array<{ id: number; stock: number; reserved: number }>>`
    SELECT "id", "stock", "reserved" FROM "ProductStock"
    WHERE "productId" = ${productId} AND "unitId" = ${unitId}
    FOR UPDATE
  `;
  const row = rows[0];
  if (!row) {
    throw new StockError("product_stock_missing", "registro de estoque nao encontrado");
  }
  return { id: Number(row.id), stock: Number(row.stock), reserved: Number(row.reserved) };
};

/** Recalcula o cache global Product.stock = soma dos saldos por unidade. */
export const syncProductGlobalStock = async (
  tx: Prisma.TransactionClient,
  productId: number
): Promise<void> => {
  await tx.$executeRaw`
    UPDATE "Product" p
    SET "stock" = COALESCE((SELECT SUM(ps."stock") FROM "ProductStock" ps WHERE ps."productId" = p."id"), 0)
    WHERE p."id" = ${productId}
  `;
};

/**
 * Aplica um movimento de estoque REAL: atualiza ProductStock da unidade,
 * grava a linha do ledger com balanceAfter e sincroniza o cache global.
 * Deve ser chamado DENTRO de uma transação.
 */
export const applyStockMovement = async (
  tx: Prisma.TransactionClient,
  input: StockMovementInput
): Promise<{ balanceAfter: number; movementId: number }> => {
  assertQuantity(input.quantity);
  const row = await lockProductStockRow(tx, input.productId, input.unitId);
  const inbound = INBOUND_TYPES.includes(input.type);
  const delta = inbound ? input.quantity : -input.quantity;
  const balanceAfter = row.stock + delta;

  if (balanceAfter < 0) {
    throw new StockError(
      "insufficient_stock",
      `estoque insuficiente (saldo ${row.stock}, movimento ${delta})`
    );
  }

  await tx.productStock.update({
    where: { id: row.id },
    data: { stock: balanceAfter },
  });

  const movement = await tx.stockMovement.create({
    data: {
      productId: input.productId,
      unitId: input.unitId,
      type: input.type,
      quantity: input.quantity,
      balanceAfter,
      unitCost:
        input.unitCost !== undefined && input.unitCost !== null
          ? new Prisma.Decimal(input.unitCost)
          : null,
      reason: input.reason || null,
      note: input.note || null,
      refOrderId: input.refOrderId || null,
      createdByUserId: input.userId || null,
    },
    select: { id: true },
  });

  await syncProductGlobalStock(tx, input.productId);
  return { balanceAfter, movementId: movement.id };
};

/**
 * Venda direta (balcão): checa DISPONÍVEL (stock - reserved) sob lock e dá
 * baixa imediata (SAIDA_VENDA), sem reserva intermediária.
 */
export const sellStockDirect = async (
  tx: Prisma.TransactionClient,
  input: {
    productId: number;
    unitId: number;
    quantity: number;
    refOrderId?: number | null;
    userId?: number | null;
    unitCost?: number | null;
  }
): Promise<void> => {
  assertQuantity(input.quantity);
  const row = await lockProductStockRow(tx, input.productId, input.unitId);
  const available = row.stock - row.reserved;
  if (available < input.quantity) {
    throw new StockError(
      "insufficient_available",
      `disponivel insuficiente (disponivel ${available}, solicitado ${input.quantity})`
    );
  }
  await applyStockMovement(tx, {
    productId: input.productId,
    unitId: input.unitId,
    type: "SAIDA_VENDA",
    quantity: input.quantity,
    refOrderId: input.refOrderId,
    userId: input.userId,
    unitCost: input.unitCost,
    reason: "venda",
  });
};

/**
 * Ajusta o saldo REAL da unidade para um valor alvo (inventário/contagem física).
 * Ao contrário de `applyStockMovement` (que só conhece entrada/saída e bloqueia
 * saldo negativo), AJUSTE define o saldo diretamente — o alvo já vem validado
 * como >= 0 (Zod), então "estoque insuficiente" nunca se aplica aqui. Escreve o
 * `balanceAfter` correto de uma vez (sem escrita intermediária incorreta).
 *
 * ERR-0071: a implementação anterior (inline em `routes/inventory.ts`) chamava
 * `applyStockMovement` tratando todo AJUSTE como saída e "corrigia" ajustes pra
 * cima com uma segunda escrita — para aumentos grandes (targetStock > 2×saldo
 * atual), o passo intermediário calculava um saldo negativo e disparava
 * `insufficient_stock` mesmo sendo um ajuste válido.
 */
export const applyStockAdjustment = async (
  tx: Prisma.TransactionClient,
  input: {
    productId: number;
    unitId: number;
    targetStock: number;
    reason: string;
    note?: string | null;
    userId?: number | null;
  }
): Promise<{ balanceAfter: number; changed: boolean; movementId: number | null }> => {
  if (!Number.isInteger(input.targetStock) || input.targetStock < 0) {
    throw new StockError("invalid_quantity", `saldo alvo invalido: ${input.targetStock}`);
  }
  const row = await lockProductStockRow(tx, input.productId, input.unitId);
  const delta = input.targetStock - row.stock;
  if (delta === 0) {
    return { balanceAfter: row.stock, changed: false, movementId: null };
  }

  await tx.productStock.update({
    where: { id: row.id },
    data: { stock: input.targetStock },
  });

  const movement = await tx.stockMovement.create({
    data: {
      productId: input.productId,
      unitId: input.unitId,
      type: "AJUSTE",
      quantity: Math.abs(delta),
      balanceAfter: input.targetStock,
      reason: input.reason,
      note: input.note || null,
      createdByUserId: input.userId || null,
    },
    select: { id: true },
  });

  await syncProductGlobalStock(tx, input.productId);
  return { balanceAfter: input.targetStock, changed: true, movementId: movement.id };
};
