import "dotenv/config";
import prisma from "../src/lib/prisma";
import { logger } from "../src/utils/logger";

const DRY_RUN_FLAG = "--dry-run";

/**
 * PLAN-0027 (Item 1) — backfill único: materializa em `Customer` os clientes que já
 * existiam (pedidos PAGO + agendamentos não-cancelados) antes de `syncCustomerFromContact`
 * (`src/lib/customerSync.ts`) existir. Sem isso, a tela nativa "Cadastro > Clientes"
 * continuaria mostrando 0 até o próximo pedido/agendamento novo.
 *
 * Mesma fonte/filtro usado por `modules/intelligence/customers/service.ts` (Panorama >
 * Clientes) para os registros COM telefone — a diferença é que aqui só entra quem tem
 * telefone (chave de `Customer`), então o total pode ficar menor que os "17" do
 * Panorama se algum desses vier só de assinatura inadimplente sem telefone.
 *
 * Idempotente: roda por telefone via upsert, pode ser re-executado sem duplicar.
 */

const sanitizePhone = (value: string): string => value.replace(/\D/g, "");

const main = async (): Promise<void> => {
  const dryRun = process.argv.includes(DRY_RUN_FLAG);

  const [paidOrders, activeAppointments] = await Promise.all([
    prisma.order.findMany({
      where: { status: "PAGO" },
      select: { customerName: true, customerEmail: true, customerPhone: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.appointment.findMany({
      where: { status: { not: "CANCELADO" } },
      select: { clientName: true, clientPhone: true, start: true },
      orderBy: { start: "asc" },
    }),
  ]);

  type Candidate = { phone: string; name: string; email: string | null };
  const byPhone = new Map<string, Candidate>();

  for (const order of paidOrders) {
    const phone = sanitizePhone(order.customerPhone || "");
    if (!phone) continue;
    byPhone.set(phone, {
      phone,
      name: (order.customerName || "").trim() || "(sem nome)",
      email: order.customerEmail?.trim().toLowerCase() || null,
    });
  }

  for (const appointment of activeAppointments) {
    const phone = sanitizePhone(appointment.clientPhone || "");
    if (!phone) continue;
    const existing = byPhone.get(phone);
    byPhone.set(phone, {
      phone,
      name: (appointment.clientName || "").trim() || "(sem nome)",
      email: existing?.email ?? null,
    });
  }

  const existingCustomers = await prisma.customer.findMany({ select: { phone: true } });
  const alreadyMaterialized = new Set(existingCustomers.map((c) => c.phone));
  const candidates = Array.from(byPhone.values());
  const toCreate = candidates.filter((c) => !alreadyMaterialized.has(c.phone));

  logger.info("Analise de backfill de Customer concluida", {
    pedidosPagosComTelefone: paidOrders.filter((o) => sanitizePhone(o.customerPhone || "")).length,
    agendamentosAtivosComTelefone: activeAppointments.filter((a) => sanitizePhone(a.clientPhone || "")).length,
    identidadesUnicasPorTelefone: candidates.length,
    jaMaterializados: alreadyMaterialized.size,
    aCriar: toCreate.length,
    dryRun,
  });

  if (!toCreate.length) {
    logger.info("Nada a fazer — nenhum cliente novo para materializar");
    return;
  }

  if (dryRun) {
    for (const candidate of toCreate) {
      logger.info("Candidato a materializar (dry-run)", candidate);
    }
    logger.info("Dry-run finalizado sem persistir alteracoes");
    return;
  }

  for (const candidate of toCreate) {
    await prisma.customer.upsert({
      where: { phone: candidate.phone },
      update: {},
      create: {
        phone: candidate.phone,
        name: candidate.name,
        email: candidate.email,
      },
    });
  }

  logger.info("Backfill de Customer concluido", { criados: toCreate.length });
};

main()
  .catch((error) => {
    logger.error("Falha no backfill de Customer a partir de pedidos/agendamentos", { error });
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
