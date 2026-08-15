-- CreateEnum
CREATE TYPE "FranchiseStage" AS ENUM ('INTERESSADO', 'QUALIFICADO', 'REUNIAO', 'PROPOSTA', 'NEGOCIACAO', 'CONTRATO', 'IMPLANTACAO');

-- DropIndex
DROP INDEX "Order_orderHmac_idx";

-- AlterTable
ALTER TABLE "FranchiseLead" ADD COLUMN     "estimatedValue" DECIMAL(10,2),
ADD COLUMN     "stage" "FranchiseStage" NOT NULL DEFAULT 'INTERESSADO',
ADD COLUMN     "stageChangedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "concierge_public_attempts" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "coupon_validation_attempts" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "FranchiseLeadStageHistory" (
    "id" SERIAL NOT NULL,
    "leadId" INTEGER NOT NULL,
    "fromStage" "FranchiseStage",
    "toStage" "FranchiseStage" NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FranchiseLeadStageHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FranchiseLeadStageHistory_leadId_changedAt_idx" ON "FranchiseLeadStageHistory"("leadId", "changedAt");

-- AddForeignKey
ALTER TABLE "FranchiseLeadStageHistory" ADD CONSTRAINT "FranchiseLeadStageHistory_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "FranchiseLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
