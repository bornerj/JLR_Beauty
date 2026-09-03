-- PLAN-0036: remoção do Stripe em favor do Mercado Pago.
-- StripeWebhookEvent vira PaymentWebhookEvent (genérico, com coluna
-- `provider`) — alinhado ao princípio de portabilidade SaaS já declarado em
-- sfk.toml. Confirmado antes desta migration (2026-09-02, via psql direto):
-- zero linhas em "Payment" com provider='STRIPE' e zero linhas em
-- "StripeWebhookEvent" em produção — a tabela é um ledger de idempotência
-- puramente operacional, sem valor histórico de negócio, por isso é
-- recriada do zero em vez de migrada linha a linha.

-- DropTable
DROP TABLE "StripeWebhookEvent";

-- CreateTable
CREATE TABLE "PaymentWebhookEvent" (
    "id" SERIAL NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "livemode" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PROCESSED',
    "errorMessage" TEXT,
    "payload" JSONB,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentWebhookEvent_provider_eventId_key" ON "PaymentWebhookEvent"("provider", "eventId");
