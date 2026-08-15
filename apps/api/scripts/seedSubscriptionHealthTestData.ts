import "dotenv/config";
import prisma from "../src/lib/prisma";
import { logger } from "../src/utils/logger";

/**
 * Massa de teste para Assinaturas como Saúde da Base (PLAN-0022, Onda 8) — pedido
 * explícito do usuário em 2026-08-14: clientes com assinaturas de planos diferentes,
 * 3 assinaturas por plano (`Membership`).
 *
 * Cobre as 4 causas que a Onda 8 promete listar em "Atenção" (cobrança recusada, uso
 * caiu, inadimplente) + Entrando/Saudável/Saindo, distribuídas pelos 3 planos reais do
 * banco (Silver/Gold/Platinum) — não hardcoded por id, resolvido por nome.
 *
 * Idempotente: identificados por `customerEmail` terminando em "@teste.jlr.local" (mesma
 * convenção de `seedAdminV2TestData.ts`/`seedFranchisePipelineTestData.ts`).
 */

const TEST_EMAIL_DOMAIN = "teste.jlr.local";
const NOW = new Date();
const daysAgo = (days: number): Date => new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);

type PaymentSpec = { status: "APROVADO" | "RECUSADO"; daysAgo: number };

type SubscriptionSpec = {
  membershipName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: "ATIVA" | "PENDENTE" | "CANCELADA" | "INADIMPLENTE";
  startedDaysAgo: number;
  cancelledDaysAgo?: number;
  payments: PaymentSpec[];
  /** Só para documentar a intenção — não é gravado em lugar nenhum, é conferido no comentário e no log final. */
  expectedState: string;
};

const SPECS: SubscriptionSpec[] = [
  // ─── Silver ───────────────────────────────────────────────────────────────────────────
  {
    membershipName: "Silver",
    customerName: "Helena Duarte Ramos",
    customerEmail: `helena.ramos@${TEST_EMAIL_DOMAIN}`,
    customerPhone: "11991234567",
    status: "ATIVA",
    startedDaysAgo: 120,
    payments: [
      { status: "APROVADO", daysAgo: 35 },
      { status: "APROVADO", daysAgo: 5 },
    ],
    expectedState: "SAUDAVEL — pagamentos em dia nos dois períodos",
  },
  {
    membershipName: "Silver",
    customerName: "Bruno Cassiano Melo",
    customerEmail: `bruno.melo@${TEST_EMAIL_DOMAIN}`,
    customerPhone: "11982345678",
    status: "ATIVA",
    startedDaysAgo: 5,
    payments: [{ status: "APROVADO", daysAgo: 5 }],
    expectedState: "ENTRANDO — assinatura iniciada neste período",
  },
  {
    membershipName: "Silver",
    customerName: "Sabrina Louise Prado",
    customerEmail: `sabrina.prado@${TEST_EMAIL_DOMAIN}`,
    customerPhone: "11973456789",
    status: "CANCELADA",
    startedDaysAgo: 200,
    cancelledDaysAgo: 10,
    payments: [
      { status: "APROVADO", daysAgo: 150 },
      { status: "APROVADO", daysAgo: 60 },
    ],
    expectedState: "SAINDO — cancelada dentro do período (conta no churn)",
  },

  // ─── Gold ─────────────────────────────────────────────────────────────────────────────
  {
    membershipName: "Gold",
    customerName: "Fabio Renato Xavier",
    customerEmail: `fabio.xavier@${TEST_EMAIL_DOMAIN}`,
    customerPhone: "21964567890",
    status: "ATIVA",
    startedDaysAgo: 200,
    payments: [
      { status: "APROVADO", daysAgo: 40 },
      { status: "APROVADO", daysAgo: 8 },
    ],
    expectedState: "SAUDAVEL",
  },
  {
    membershipName: "Gold",
    customerName: "Tatiane Bezerra Lopes",
    customerEmail: `tatiane.lopes@${TEST_EMAIL_DOMAIN}`,
    customerPhone: "21955678901",
    status: "ATIVA",
    startedDaysAgo: 90,
    payments: [
      { status: "APROVADO", daysAgo: 40 },
      { status: "RECUSADO", daysAgo: 3 },
    ],
    expectedState: "ATENCAO — cobrança recusada neste período",
  },
  {
    membershipName: "Gold",
    customerName: "Wesley Andrade Cruz",
    customerEmail: `wesley.cruz@${TEST_EMAIL_DOMAIN}`,
    customerPhone: "21946789012",
    status: "INADIMPLENTE",
    startedDaysAgo: 150,
    payments: [{ status: "APROVADO", daysAgo: 60 }],
    expectedState: "ATENCAO — inadimplente",
  },

  // ─── Platinum ─────────────────────────────────────────────────────────────────────────
  {
    membershipName: "Platinum",
    customerName: "Isabela Fontoura Reis",
    customerEmail: `isabela.reis@${TEST_EMAIL_DOMAIN}`,
    customerPhone: "31937890123",
    status: "ATIVA",
    startedDaysAgo: 150,
    payments: [
      { status: "APROVADO", daysAgo: 38 },
      { status: "APROVADO", daysAgo: 6 },
    ],
    expectedState: "SAUDAVEL",
  },
  {
    membershipName: "Platinum",
    customerName: "Leandro Siqueira Brito",
    customerEmail: `leandro.brito@${TEST_EMAIL_DOMAIN}`,
    customerPhone: "31928901234",
    status: "ATIVA",
    startedDaysAgo: 100,
    payments: [{ status: "APROVADO", daysAgo: 33 }],
    expectedState: "ATENCAO — sem cobrança aprovada neste período (última foi no anterior)",
  },
  {
    membershipName: "Platinum",
    customerName: "Mariana Cavalcante Dutra",
    customerEmail: `mariana.dutra@${TEST_EMAIL_DOMAIN}`,
    customerPhone: "31919012345",
    status: "PENDENTE",
    startedDaysAgo: 0,
    payments: [],
    expectedState: "ENTRANDO — aguardando ativação (pagamento pendente)",
  },
];

const main = async (): Promise<void> => {
  const existing = await prisma.subscription.count({
    where: { customerEmail: { endsWith: `@${TEST_EMAIL_DOMAIN}` } },
  });
  if (existing >= SPECS.length) {
    logger.info("Massa de teste de Assinaturas ja existe, pulando", { existing });
    return;
  }

  const memberships = await prisma.membership.findMany({ select: { id: true, name: true, price: true } });
  const membershipByName = new Map(memberships.map((m) => [m.name, m]));

  const summary: string[] = [];

  for (const spec of SPECS) {
    const alreadyExists = await prisma.subscription.findFirst({ where: { customerEmail: spec.customerEmail } });
    if (alreadyExists) continue;

    const membership = membershipByName.get(spec.membershipName);
    if (!membership) {
      logger.warn("Plano nao encontrado, pulando assinatura de teste", { membershipName: spec.membershipName, customer: spec.customerName });
      continue;
    }

    await prisma.subscription.create({
      data: {
        membershipId: membership.id,
        status: spec.status,
        customerName: spec.customerName,
        customerEmail: spec.customerEmail,
        customerPhone: spec.customerPhone,
        startedAt: daysAgo(spec.startedDaysAgo),
        cancelledAt: spec.cancelledDaysAgo !== undefined ? daysAgo(spec.cancelledDaysAgo) : null,
        payments: spec.payments.length
          ? {
              create: spec.payments.map((payment) => ({
                provider: "MANUAL",
                status: payment.status,
                amount: membership.price,
                paidAt: payment.status === "APROVADO" ? daysAgo(payment.daysAgo) : null,
                createdAt: daysAgo(payment.daysAgo),
              })),
            }
          : undefined,
      },
    });

    summary.push(`${spec.customerName} (${spec.membershipName}) → ${spec.expectedState}`);
  }

  logger.info("Massa de teste de Assinaturas criada", { total: summary.length, summary });
};

main()
  .catch((error) => {
    logger.error("Falha ao gerar massa de teste de Assinaturas", { error });
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
