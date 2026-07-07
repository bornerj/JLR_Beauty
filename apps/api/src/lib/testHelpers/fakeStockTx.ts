import { Prisma, type ReservationStatus, type SalesChannel, type StockMovementType } from "@prisma/client";

/**
 * Fake mínimo do `Prisma.TransactionClient`, cobrindo só os métodos que
 * `stockLedger.ts`/`stockReservation.ts` usam. Existe para testar as regras
 * de negócio (saldo, disponível, ledger, reserva) sem depender de um banco
 * Postgres real — o projeto ainda não tem infra de banco de testes.
 */

type ProductStockRow = { id: number; productId: number; unitId: number; stock: number; reserved: number };
type StockMovementRow = {
  id: number;
  productId: number;
  unitId: number;
  type: StockMovementType;
  quantity: number;
  balanceAfter: number;
  unitCost: Prisma.Decimal | null;
  reason: string | null;
  note: string | null;
  refOrderId: number | null;
  createdByUserId: number | null;
};
type ReservationRow = {
  id: number;
  productId: number;
  unitId: number;
  quantity: number;
  status: ReservationStatus;
  channel: SalesChannel;
  expiresAt: Date;
  orderId: number | null;
  createdByUserId: number | null;
  confirmedAt: Date | null;
  releasedAt: Date | null;
};
type ProductRow = { id: number; stock: number; costPrice: Prisma.Decimal | null };

export class FakeStockDb {
  productStockRows: ProductStockRow[] = [];
  movements: StockMovementRow[] = [];
  reservations: ReservationRow[] = [];
  products: ProductRow[] = [];
  private nextId = 1;

  seedProductStock(row: Omit<ProductStockRow, "id">): ProductStockRow {
    const full = { id: this.nextId++, ...row };
    this.productStockRows.push(full);
    return full;
  }

  seedProduct(row: Omit<ProductRow, "id"> & { id: number }): ProductRow {
    this.products.push(row);
    return row;
  }

  findRow(productId: number, unitId: number): ProductStockRow | undefined {
    return this.productStockRows.find((r) => r.productId === productId && r.unitId === unitId);
  }

  /** Objeto passado como `tx` — cast para `Prisma.TransactionClient` pelos testes. */
  get tx() {
    const db = this;
    return {
      productStock: {
        async upsert({ where, create }: any) {
          const existing = db.findRow(where.productId_unitId.productId, where.productId_unitId.unitId);
          if (existing) return existing;
          return db.seedProductStock(create);
        },
        async update({ where, data }: any) {
          const row = db.productStockRows.find((r) => r.id === where.id);
          if (!row) throw new Error("row not found");
          Object.assign(row, data);
          return row;
        },
      },
      stockMovement: {
        async create({ data }: any) {
          const movement: StockMovementRow = { id: db.nextId++, ...data };
          db.movements.push(movement);
          return { id: movement.id };
        },
      },
      stockReservation: {
        async create({ data }: any) {
          const reservation: ReservationRow = {
            id: db.nextId++,
            confirmedAt: null,
            releasedAt: null,
            orderId: data.orderId ?? null,
            createdByUserId: data.createdByUserId ?? null,
            ...data,
          };
          db.reservations.push(reservation);
          return { id: reservation.id };
        },
        async update({ where, data }: any) {
          const reservation = db.reservations.find((r) => r.id === where.id);
          if (!reservation) throw new Error("reservation not found");
          Object.assign(reservation, data);
          return reservation;
        },
        async findUnique({ where }: any) {
          return db.reservations.find((r) => r.id === where.id) ?? null;
        },
        async findMany({ where }: any) {
          return db.reservations.filter((r) => {
            if (where.orderId !== undefined && r.orderId !== where.orderId) return false;
            if (where.status?.in && !where.status.in.includes(r.status)) return false;
            if (where.status && typeof where.status === "string" && r.status !== where.status) return false;
            return true;
          });
        },
      },
      product: {
        async findUnique({ where }: any) {
          return db.products.find((p) => p.id === where.id) ?? null;
        },
      },
      async $queryRaw(_strings: TemplateStringsArray, productId: number, unitId: number) {
        const row = db.findRow(productId, unitId);
        return row ? [{ id: row.id, stock: row.stock, reserved: row.reserved }] : [];
      },
      async $executeRaw(_strings: TemplateStringsArray, productId: number) {
        const total = db.productStockRows
          .filter((r) => r.productId === productId)
          .reduce((sum, r) => sum + r.stock, 0);
        const product = db.products.find((p) => p.id === productId);
        if (product) product.stock = total;
        return 1;
      },
    };
  }
}
