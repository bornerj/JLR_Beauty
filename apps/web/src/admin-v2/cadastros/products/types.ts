/**
 * Admin V2 (PLAN-0026, Onda 11) — tipos de Produtos, espelhando `Product`/`ProductCategory`/
 * `ProductStatus` (`schema.prisma`) e os schemas Zod de `apps/api/src/routes/catalog.ts`.
 * `price`/`costPrice` voltam do backend como `string | null` (`Prisma.Decimal.toJSON()`),
 * mesmo achado das Ondas 1/4/8. **Achado de RAG (corrigido depois de um E2E real)**:
 * `Product.stock` **é** um cache global corretamente mantido — `applyStockMovement`
 * (`lib/stockLedger.ts`) recalcula via `$executeRaw` (SQL bruto, `syncProductGlobalStock`)
 * a cada movimento, soma de `ProductStock` por unidade. A varredura inicial só checou
 * chamadas ORM (`.product.update(`) e não achou nada, levando à conclusão errada de que o
 * campo nunca era atualizado — corrigido depois de testar de verdade (criar produto,
 * registrar entrada+ajuste, conferir `product.stock` refletindo a soma real). A tela nativa
 * **mostra `Product.stock`** na tabela como "Estoque total" (soma entre unidades); o
 * detalhamento por unidade continua vindo de `/inventory/cross-unit`, sob demanda, no
 * form de edição.
 */

import type { ServiceCategoryStatus, ServiceStatusColor } from "../services/types";

export type ProductStatusColorValue = ServiceStatusColor;

export type ProductCategory = { id: number; name: string; status: ServiceCategoryStatus; createdAt: string; updatedAt: string };
export type ProductStatusOption = { id: number; name: string; color: ServiceStatusColor; createdAt: string; updatedAt: string };

export type Product = {
  id: number;
  name: string;
  description: string | null;
  sku: string | null;
  stock: number;
  price: string;
  costPrice: string | null;
  unitOfMeasure: string | null;
  minStock: number;
  maxStock: number | null;
  imageUrl: string | null;
  benefits: string[] | null;
  isFeatured: boolean;
  productCategory: { id: number; name: string } | null;
  productStatus: { id: number; name: string; color: ServiceStatusColor | null } | null;
  createdAt: string;
  updatedAt: string;
};

export type ProductInput = {
  name: string;
  description?: string;
  sku?: string;
  price: number;
  costPrice?: number;
  unitOfMeasure?: string;
  minStock?: number;
  maxStock?: number | null;
  imageUrl?: string;
  benefits?: string[];
  productCategoryId?: number;
  productStatusId?: number;
  isFeatured?: boolean;
  /** Só usado na criação — `PATCH` nunca mexe em estoque (regra do backend, PLAN-0020). */
  initialStock?: number;
  initialStockUnitId?: number;
};

export type InventoryUnit = { id: number; name: string; kind: string; isOnline: boolean };

export type CrossUnitStockRow = { unitId: number; unitName: string; isOnline: boolean; available: number };

export type StockMovementType = "ENTRADA_COMPRA" | "SAIDA_VENDA" | "USO_SALAO" | "PERDA" | "AJUSTE" | "DEVOLUCAO";

export type StockMovementRow = {
  id: number;
  type: StockMovementType;
  quantity: number;
  balanceAfter: number;
  unitCost: string | null;
  reason: string | null;
  note: string | null;
  refOrderId: number | null;
  createdAt: string;
  createdBy: { id: number; name: string } | null;
};

export type StockMovementKind = "entry" | "consumption" | "loss" | "adjust";

export type StockMovementInput =
  | { kind: "entry" | "consumption" | "loss"; quantity: number; unitCost?: number; reason?: string; note?: string }
  | { kind: "adjust"; targetStock: number; reason: string; note?: string };
