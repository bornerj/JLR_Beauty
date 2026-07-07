-- PLAN-0020: Estoque multi-unidade (ledger + reserva) + venda multicanal
--
-- 1) Enums novos (StockMovementType, SalesChannel, UnitKind, ReservationStatus)
-- 2) Colunas novas em Product, Unit, Order, OrderItem, User
-- 3) Tabelas novas: ProductStock (saldo autoritativo por unidade),
--    StockMovement (ledger auditável), StockReservation (reserva com TTL)
-- 4) Data migration: unidade "Loja Online", backfill de saldo global -> Loja Online,
--    backfill User.unitId a partir de Professional.unitId

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('ENTRADA_COMPRA', 'SAIDA_VENDA', 'USO_SALAO', 'PERDA', 'AJUSTE', 'DEVOLUCAO');

-- CreateEnum
CREATE TYPE "SalesChannel" AS ENUM ('SITE', 'APP', 'ADMIN', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "UnitKind" AS ENUM ('OWN', 'FRANCHISE');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('ACTIVE', 'CONFIRMED', 'RELEASED', 'EXPIRED');

-- AlterTable Product
ALTER TABLE "Product" ADD COLUMN "costPrice" DECIMAL(10,2),
ADD COLUMN "unitOfMeasure" TEXT,
ADD COLUMN "minStock" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "maxStock" INTEGER;

-- AlterTable Unit
ALTER TABLE "Unit" ADD COLUMN "kind" "UnitKind" NOT NULL DEFAULT 'OWN',
ADD COLUMN "isOnline" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable Order
ALTER TABLE "Order" ADD COLUMN "channel" "SalesChannel" NOT NULL DEFAULT 'SITE',
ADD COLUMN "soldByUserId" INTEGER,
ADD COLUMN "unitId" INTEGER;

-- AlterTable OrderItem
ALTER TABLE "OrderItem" ADD COLUMN "unitCost" DECIMAL(10,2);

-- AlterTable User
ALTER TABLE "User" ADD COLUMN "unitId" INTEGER;

-- CreateTable ProductStock
CREATE TABLE "ProductStock" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "unitId" INTEGER NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable StockMovement
CREATE TABLE "StockMovement" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "unitId" INTEGER NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "unitCost" DECIMAL(10,2),
    "reason" TEXT,
    "note" TEXT,
    "refOrderId" INTEGER,
    "createdByUserId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable StockReservation
CREATE TABLE "StockReservation" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "unitId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'ACTIVE',
    "channel" "SalesChannel" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "orderId" INTEGER,
    "createdByUserId" INTEGER,
    "confirmedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockReservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductStock_productId_unitId_key" ON "ProductStock"("productId", "unitId");
CREATE INDEX "ProductStock_unitId_idx" ON "ProductStock"("unitId");
CREATE INDEX "StockMovement_productId_createdAt_idx" ON "StockMovement"("productId", "createdAt");
CREATE INDEX "StockMovement_unitId_createdAt_idx" ON "StockMovement"("unitId", "createdAt");
CREATE INDEX "StockMovement_type_createdAt_idx" ON "StockMovement"("type", "createdAt");
CREATE INDEX "StockMovement_refOrderId_idx" ON "StockMovement"("refOrderId");
CREATE INDEX "StockReservation_status_expiresAt_idx" ON "StockReservation"("status", "expiresAt");
CREATE INDEX "StockReservation_productId_unitId_status_idx" ON "StockReservation"("productId", "unitId", "status");
CREATE INDEX "StockReservation_orderId_idx" ON "StockReservation"("orderId");
CREATE INDEX "Order_unitId_status_createdAt_idx" ON "Order"("unitId", "status", "createdAt");
CREATE INDEX "Order_soldByUserId_createdAt_idx" ON "Order"("soldByUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "ProductStock" ADD CONSTRAINT "ProductStock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductStock" ADD CONSTRAINT "ProductStock_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_refOrderId_fkey" FOREIGN KEY ("refOrderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StockReservation" ADD CONSTRAINT "StockReservation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockReservation" ADD CONSTRAINT "StockReservation_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockReservation" ADD CONSTRAINT "StockReservation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StockReservation" ADD CONSTRAINT "StockReservation_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_soldByUserId_fkey" FOREIGN KEY ("soldByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── Data migration ──────────────────────────────────────────────────────────

-- Unidade virtual "Loja Online" (idempotente)
INSERT INTO "Unit" ("name", "address", "kind", "isOnline", "hourStart", "hourFinish", "createdAt", "updatedAt")
SELECT 'Loja Online', NULL, 'OWN', true, '00:00', '23:59', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Unit" WHERE "isOnline" = true);

-- Saldo global atual dos produtos -> ProductStock na Loja Online
-- (decisão PLAN-0020 Onda 1: site continua mostrando disponibilidade; admin redistribui depois)
INSERT INTO "ProductStock" ("productId", "unitId", "stock", "reserved", "createdAt", "updatedAt")
SELECT p."id",
       (SELECT u."id" FROM "Unit" u WHERE u."isOnline" = true ORDER BY u."id" ASC LIMIT 1),
       p."stock", 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Product" p
WHERE NOT EXISTS (
  SELECT 1 FROM "ProductStock" ps
  WHERE ps."productId" = p."id"
    AND ps."unitId" = (SELECT u."id" FROM "Unit" u WHERE u."isOnline" = true ORDER BY u."id" ASC LIMIT 1)
);

-- Movimento inicial no ledger para rastrear a origem do saldo migrado
INSERT INTO "StockMovement" ("productId", "unitId", "type", "quantity", "balanceAfter", "reason", "createdAt")
SELECT ps."productId", ps."unitId", 'ENTRADA_COMPRA', ps."stock", ps."stock",
       'saldo inicial (migração PLAN-0020)', CURRENT_TIMESTAMP
FROM "ProductStock" ps
WHERE ps."stock" > 0
  AND NOT EXISTS (
    SELECT 1 FROM "StockMovement" sm
    WHERE sm."productId" = ps."productId" AND sm."unitId" = ps."unitId"
      AND sm."reason" = 'saldo inicial (migração PLAN-0020)'
  );

-- Staff: backfill User.unitId a partir do vínculo Professional existente
UPDATE "User" u
SET "unitId" = p."unitId"
FROM "Professional" p
WHERE p."userId" = u."id" AND p."unitId" IS NOT NULL AND u."unitId" IS NULL;
