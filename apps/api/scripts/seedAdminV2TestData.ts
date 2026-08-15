import "dotenv/config";
import { Prisma } from "@prisma/client";
import prisma from "../src/lib/prisma";
import { logger } from "../src/utils/logger";
import { applyStockMovement, sellStockDirect, StockError } from "../src/lib/stockLedger";
import { appendOrderStatusHistory } from "../src/lib/fulfillmentUtils";
import { buildOrderPublicCode, toDecimalNumber } from "../src/lib/currencyUtils";
import { generateOrderHmac } from "../src/lib/hmacUtils";
import { recordAudit } from "../src/lib/auditLog";

/**
 * Massa de teste para validar o Admin V2 (PLAN-0022, Ondas 0-3) — pedido explícito do
 * usuário em 2026-08-13: 2 unidades franqueadas novas, estoque inicial ("pedidos de
 * compra") em todas as unidades, pedidos de venda (Order) cobrindo os 4 estados do board
 * operacional + fluxo de fulfillment, e agendamentos para pelo menos 2 profissionais por
 * unidade física.
 *
 * Reaproveita as MESMAS funções de negócio do fluxo real (não reinventa):
 * `applyStockMovement`/`sellStockDirect` (lib/stockLedger, PLAN-0020),
 * `appendOrderStatusHistory` (lib/fulfillmentUtils), `buildOrderPublicCode` +
 * `generateOrderHmac` (SEC-21). Só os timestamps de pedido são setados diretamente
 * (retroativos), porque nenhum endpoint real aceita data custom — é o único ponto onde
 * este script sai do caminho normal, e é proposital (precisa de pedidos "velhos" para
 * exercitar ATTENTION/STALLED/OVERDUE/gargalo).
 *
 * Idempotente: identidades (unidade por nome, profissional por email, produto por sku)
 * são as mesmas do `prisma/seed.ts`; pedidos/agendamentos de teste são marcados
 * (customerEmail "@teste.jlr.local" / notes "[SEED-ADMINV2]") e o script pula a geração
 * por unidade/profissional se a marca já existir em volume suficiente — rodar de novo não
 * duplica.
 */

const SEED_TAG = "[SEED-ADMINV2]";
const TEST_EMAIL_DOMAIN = "teste.jlr.local";
const ORDERS_PER_UNIT_TARGET = 8;
const APPOINTMENTS_PER_PROFESSIONAL_TARGET = 4;

const NOW = new Date();
const hoursAgo = (hours: number, from: Date = NOW): Date => new Date(from.getTime() - hours * 60 * 60 * 1000);
const minutesAfter = (base: Date, minutes: number): Date => new Date(base.getTime() + minutes * 60000);
const daysFromNow = (days: number): Date => new Date(NOW.getTime() + days * 24 * 60 * 60 * 1000);

// ─── Clientes fictícios reutilizados entre pedidos/agendamentos (gera recorrência real) ───

const TEST_CUSTOMERS = [
  { name: "Ana Beatriz Souza", phone: "11976543210", email: `ana.souza@${TEST_EMAIL_DOMAIN}` },
  { name: "Carla Mendes", phone: "11987654321", email: `carla.mendes@${TEST_EMAIL_DOMAIN}` },
  { name: "Fernanda Lima", phone: "11998765432", email: `fernanda.lima@${TEST_EMAIL_DOMAIN}` },
  { name: "Juliana Ramos", phone: "11965432109", email: `juliana.ramos@${TEST_EMAIL_DOMAIN}` },
  { name: "Patricia Alves", phone: "11954321098", email: `patricia.alves@${TEST_EMAIL_DOMAIN}` },
  { name: "Renata Costa", phone: "81988776655", email: `renata.costa@${TEST_EMAIL_DOMAIN}` },
  { name: "Simone Rocha", phone: "81977665544", email: `simone.rocha@${TEST_EMAIL_DOMAIN}` },
  { name: "Vanessa Teixeira", phone: "11943210987", email: `vanessa.teixeira@${TEST_EMAIL_DOMAIN}` },
] as const;

const customerAt = (index: number) => TEST_CUSTOMERS[index % TEST_CUSTOMERS.length];

// ─── 1) Unidades franqueadas novas ─────────────────────────────────────────────────────

const NEW_UNIT_SPECS = [
  {
    key: "FRANCO_DA_ROCHA",
    name: "Franco da Rocha",
    address: "Rua Doutor Almeida, 450 - Centro, Franco da Rocha - SP",
  },
  {
    key: "RECIFE",
    name: "Recife",
    address: "Av. Boa Viagem, 3200 - Boa Viagem, Recife - PE",
  },
] as const;

type UnitRow = { id: number; name: string; isOnline: boolean };

const ensureUnits = async (): Promise<Map<string, UnitRow>> => {
  const unitByKey = new Map<string, UnitRow>();

  // Unidades existentes (copiadas por nome, não por id — mais robusto a re-execução).
  const existingParque = await prisma.unit.findFirstOrThrow({ where: { name: { contains: "Parque" } } });
  const existingBirmann = await prisma.unit.findFirstOrThrow({ where: { name: { contains: "Birmann" } } });
  const existingOnline = await prisma.unit.findFirstOrThrow({ where: { isOnline: true } });
  unitByKey.set("PARQUE_DA_CIDADE", existingParque);
  unitByKey.set("BIRMANN_20", existingBirmann);
  unitByKey.set("LOJA_ONLINE", existingOnline);

  for (const spec of NEW_UNIT_SPECS) {
    const existing = await prisma.unit.findFirst({ where: { name: spec.name } });
    const unit =
      existing ??
      (await prisma.unit.create({
        data: {
          name: spec.name,
          address: spec.address,
          kind: "FRANCHISE",
          isOnline: false,
          // Mesmo horário de funcionamento copiado das unidades OWN existentes.
          hourStart: existingParque.hourStart,
          hourFinish: existingParque.hourFinish,
        },
      }));
    unitByKey.set(spec.key, unit);
  }

  logger.info("Unidades garantidas para massa de teste", {
    units: Array.from(unitByKey.entries()).map(([key, unit]) => ({ key, id: unit.id, name: unit.name })),
  });
  return unitByKey;
};

// ─── 2) Estoque inicial ("pedidos de compra" — ENTRADA_COMPRA) em todas as unidades ────

const ensureInitialStock = async (units: Map<string, UnitRow>): Promise<void> => {
  const products = await prisma.product.findMany({ select: { id: true, name: true, price: true, costPrice: true } });
  const masterUser = await prisma.user.findFirstOrThrow({ where: { role: "MASTER" }, orderBy: { id: "asc" } });

  for (const [key, unit] of units) {
    if (unit.isOnline) continue; // Loja Online já tem estoque real de outras sessões; segue abaixo com reforço leve.
    for (const product of products) {
      const existingStock = await prisma.productStock.findUnique({
        where: { productId_unitId: { productId: product.id, unitId: unit.id } },
      });
      if (existingStock && existingStock.stock > 0) continue; // não duplica entrada se já há saldo

      const quantity = 20 + Math.floor(Math.random() * 30); // 20-49 unidades
      const unitCost = product.costPrice ? toDecimalNumber(product.costPrice) : toDecimalNumber(product.price) * 0.4;
      await prisma.$transaction((tx) =>
        applyStockMovement(tx, {
          productId: product.id,
          unitId: unit.id,
          type: "ENTRADA_COMPRA",
          quantity,
          unitCost,
          reason: "estoque inicial — massa de teste PLAN-0022",
          note: `${SEED_TAG} entrada de compra para validação do Admin V2 (unidade ${unit.name})`,
          userId: masterUser.id,
        })
      );
      recordAudit("STOCK_ENTRY", {
        userId: masterUser.id,
        meta: { productId: product.id, unitId: unit.id, quantity, seed: true },
      });
    }
    logger.info("Estoque inicial garantido", { unit: unit.name, key });
  }

  // Loja Online: reforço leve só nos produtos ainda zerados, sem tocar no que já existe.
  const online = units.get("LOJA_ONLINE")!;
  for (const product of products) {
    const existingStock = await prisma.productStock.findUnique({
      where: { productId_unitId: { productId: product.id, unitId: online.id } },
    });
    if (existingStock && existingStock.stock > 0) continue;
    const quantity = 20 + Math.floor(Math.random() * 30);
    const unitCost = product.costPrice ? toDecimalNumber(product.costPrice) : toDecimalNumber(product.price) * 0.4;
    await prisma.$transaction((tx) =>
      applyStockMovement(tx, {
        productId: product.id,
        unitId: online.id,
        type: "ENTRADA_COMPRA",
        quantity,
        unitCost,
        reason: "estoque inicial — massa de teste PLAN-0022",
        note: `${SEED_TAG} entrada de compra para validação do Admin V2 (unidade ${online.name})`,
        userId: masterUser.id,
      })
    );
  }
};

// ─── 3) Profissionais novos (Birmann 20, Franco da Rocha, Recife precisam de >=2) ──────

type RoleTag = "manicure" | "hair" | "esteticista";

const NEW_PROFESSIONAL_SPECS = [
  {
    key: "PATRICIA_ESTETICISTA",
    name: "Patricia Esteticista",
    unitKey: "BIRMANN_20",
    roleTag: "esteticista" as RoleTag,
    commissionProfileName: "Esteticista",
    weekdayMask: [1, 2, 3, 4, 5],
    hourStart: "09:00",
    hourFinish: "18:00",
  },
  {
    key: "JULIANA_CABELEIREIRA",
    name: "Juliana Cabeleireira",
    unitKey: "BIRMANN_20",
    roleTag: "hair" as RoleTag,
    commissionProfileName: "Cabeleireira",
    weekdayMask: [0, 1, 2, 3, 4, 5, 6],
    hourStart: "10:00",
    hourFinish: "19:00",
  },
  {
    key: "BEATRIZ_MANICURE",
    name: "Beatriz Manicure",
    unitKey: "FRANCO_DA_ROCHA",
    roleTag: "manicure" as RoleTag,
    commissionProfileName: "Manicure",
    weekdayMask: [1, 3, 5],
    hourStart: "08:00",
    hourFinish: "15:00",
  },
  {
    key: "DOUGLAS_CABELEIREIRO",
    name: "Douglas Cabeleireiro",
    unitKey: "FRANCO_DA_ROCHA",
    roleTag: "hair" as RoleTag,
    commissionProfileName: "Cabeleireira",
    weekdayMask: [0, 1, 2, 3, 4, 5, 6],
    hourStart: "08:00",
    hourFinish: "16:00",
  },
  {
    key: "LARISSA_ESTETICISTA",
    name: "Larissa Esteticista",
    unitKey: "RECIFE",
    roleTag: "esteticista" as RoleTag,
    commissionProfileName: "Esteticista",
    weekdayMask: [1, 2, 3, 4, 5],
    hourStart: "09:00",
    hourFinish: "18:00",
  },
  {
    key: "CAMILA_MANICURE",
    name: "Camila Manicure",
    unitKey: "RECIFE",
    roleTag: "manicure" as RoleTag,
    commissionProfileName: "Manicure",
    weekdayMask: [0, 1, 2, 3, 4, 5, 6],
    hourStart: "11:00",
    hourFinish: "19:00",
  },
] as const;

type ProfessionalRow = { id: number; unitId: number; roleTag: RoleTag; serviceIds: number[] };

const ensureProfessionalUser = async (key: string, name: string): Promise<number> => {
  const email = `profissional.${key.toLowerCase()}@jlr.local`;
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return existing.id;
  const created = await prisma.user.create({
    data: { name, email, role: "PROFESSIONAL" },
    select: { id: true },
  });
  return created.id;
};

/** Copia o conjunto de serviços de um profissional existente com o mesmo roleTag (regra do usuário: "o que faltar, copie dos registros que existem"). */
const resolveServiceIdsForRole = async (roleTag: RoleTag): Promise<number[]> => {
  if (roleTag === "manicure") {
    const template = await prisma.professional.findFirst({ where: { name: "Maria Manicure" } });
    if (template) {
      const links = await prisma.professionalService.findMany({ where: { professionalId: template.id } });
      if (links.length) return links.map((link) => link.serviceId);
    }
  }
  if (roleTag === "hair") {
    const template = await prisma.professional.findFirst({ where: { name: "Cicera Cabeleireira" } });
    if (template) {
      const links = await prisma.professionalService.findMany({ where: { professionalId: template.id } });
      if (links.length) return links.map((link) => link.serviceId);
    }
  }
  // Esteticista: nenhum profissional existente tem esse papel ainda — mesmo critério de
  // categoria usado em prisma/seed.ts para manicure/hair, aplicado às categorias de estética.
  const services = await prisma.service.findMany({
    where: {
      OR: [{ serviceStatus: null }, { serviceStatus: { name: { in: ["Ativo", "ACTIVE"] } } }],
      serviceCategory: { name: { in: ["Estética Corporal", "Estética Facial"] } },
    },
    select: { id: true },
  });
  return services.map((service) => service.id);
};

const ensureProfessionals = async (units: Map<string, UnitRow>): Promise<Map<string, ProfessionalRow>> => {
  const commissionProfiles = await prisma.professionalCommissionProfile.findMany();
  const commissionProfileIdByName = new Map(commissionProfiles.map((profile) => [profile.name, profile.id]));

  // Profissionais existentes de Parque da Cidade — já cobrem "pelo menos 2" naquela unidade.
  const existing = await prisma.professional.findMany({
    where: { unitId: units.get("PARQUE_DA_CIDADE")!.id },
    include: { professionalServices: true },
  });
  const professionalByKey = new Map<string, ProfessionalRow>();
  for (const professional of existing) {
    professionalByKey.set(`EXISTING_${professional.id}`, {
      id: professional.id,
      unitId: professional.unitId!,
      roleTag: professional.specialties && JSON.stringify(professional.specialties).includes("Cabeleireira") ? "hair" : "manicure",
      serviceIds: professional.professionalServices.map((link) => link.serviceId),
    });
  }

  for (const spec of NEW_PROFESSIONAL_SPECS) {
    const unit = units.get(spec.unitKey)!;
    const userId = await ensureProfessionalUser(spec.key, spec.name);
    const commissionProfileId = commissionProfileIdByName.get(spec.commissionProfileName) ?? null;

    const existingProfessional = await prisma.professional.findFirst({ where: { name: spec.name } });
    const professional =
      existingProfessional ??
      (await prisma.professional.create({
        data: {
          name: spec.name,
          userId,
          unitId: unit.id,
          specialties: [spec.commissionProfileName],
          employmentStatus: "ACTIVE",
          startedAt: NOW,
          commissionProfileId,
        },
      }));

    const serviceIds = await resolveServiceIdsForRole(spec.roleTag);
    if (serviceIds.length) {
      await prisma.professionalService.createMany({
        data: serviceIds.map((serviceId) => ({ professionalId: professional.id, serviceId })),
        skipDuplicates: true,
      });
    }

    professionalByKey.set(spec.key, {
      id: professional.id,
      unitId: unit.id,
      roleTag: spec.roleTag,
      serviceIds,
    });

    // Escala: mesma janela usada no restante do projeto (56 dias), mas centrada em hoje
    // (35 dias passados + 21 futuros) para que a ocupação do período corrente (últimos 30
    // dias, usado pelo Health Score) e a agenda futura tenham dado real ao mesmo tempo.
    const shifts: Array<{
      professionalId: number;
      unitId: number;
      workDate: Date;
      hourStart: string;
      hourFinish: string;
      isActive: boolean;
      notes: string;
    }> = [];
    for (let offset = -35; offset <= 21; offset += 1) {
      const workDate = new Date(NOW);
      workDate.setHours(0, 0, 0, 0);
      workDate.setDate(workDate.getDate() + offset);
      const weekday = workDate.getDay();
      if (!(spec.weekdayMask as readonly number[]).includes(weekday)) continue;
      shifts.push({
        professionalId: professional.id,
        unitId: unit.id,
        workDate,
        hourStart: spec.hourStart,
        hourFinish: spec.hourFinish,
        isActive: true,
        notes: `${SEED_TAG} escala massa de teste`,
      });
    }
    if (shifts.length) {
      await prisma.professionalShift.createMany({ data: shifts, skipDuplicates: true });
    }
  }

  logger.info("Profissionais garantidos para massa de teste", {
    total: professionalByKey.size,
  });
  return professionalByKey;
};

// ─── 4) Pedidos (Order) — cobrindo os 4 estados do Board Operacional + fluxo real ──────

type OrderPlanItem = { productId?: number; serviceId?: number; quantity: number };

type OrderPlan = {
  label: string;
  status: "PENDENTE" | "PAGO";
  fulfillmentStatus: "PENDENTE" | "SEPARANDO" | "EMBALADO" | "DESPACHADO" | "ENVIADO" | "ENTREGUE";
  paidHoursAgo: number | null;
  fulfillmentNotes?: string;
  /** Minutos entre cada etapa do fulfillment, só para pedidos totalmente entregues (gera o Fluxo real). */
  stageGapsMinutes?: { separated: number; packed: number; dispatched: number; shipped: number; delivered: number };
};

const buildOrderPlans = (includeBlocked: boolean): OrderPlan[] => {
  const plans: OrderPlan[] = [
    { label: "entrou-agora", status: "PENDENTE", fulfillmentStatus: "PENDENTE", paidHoursAgo: null },
    { label: "pago-recente-1", status: "PAGO", fulfillmentStatus: "PENDENTE", paidHoursAgo: 2 },
    { label: "pago-recente-2", status: "PAGO", fulfillmentStatus: "SEPARANDO", paidHoursAgo: 6 },
    { label: "atencao-13h", status: "PAGO", fulfillmentStatus: "SEPARANDO", paidHoursAgo: 13 },
    { label: "parado-30h", status: "PAGO", fulfillmentStatus: "PENDENTE", paidHoursAgo: 30 },
    { label: "atrasado-80h", status: "PAGO", fulfillmentStatus: "EMBALADO", paidHoursAgo: 80 },
    {
      label: "entregue-normal",
      status: "PAGO",
      fulfillmentStatus: "ENTREGUE",
      paidHoursAgo: 120,
      stageGapsMinutes: { separated: 45, packed: 40, dispatched: 90, shipped: 120, delivered: 1440 },
    },
    {
      label: "entregue-com-gargalo",
      status: "PAGO",
      fulfillmentStatus: "ENTREGUE",
      paidHoursAgo: 168,
      // dispatched->shipped com 320min (>=240min = limiar de gargalo do classifier).
      stageGapsMinutes: { separated: 30, packed: 35, dispatched: 60, shipped: 320, delivered: 900 },
    },
  ];
  if (includeBlocked) {
    plans.push({
      label: "bloqueado-estoque",
      status: "PAGO",
      fulfillmentStatus: "PENDENTE",
      paidHoursAgo: 3,
      fulfillmentNotes: `[ESTOQUE] Produto sem previsão de reposição do fornecedor — resolver manualmente. ${SEED_TAG}`,
    });
  }
  return plans;
};

const pickOrderItems = (
  products: Array<{ id: number; price: Prisma.Decimal; costPrice: Prisma.Decimal | null }>,
  seedIndex: number
): OrderPlanItem[] => {
  const first = products[seedIndex % products.length];
  const second = products[(seedIndex + 3) % products.length];
  const items: OrderPlanItem[] = [{ productId: first.id, quantity: 1 + (seedIndex % 2) }];
  if (seedIndex % 2 === 0) items.push({ productId: second.id, quantity: 1 });
  return items;
};

const createTestOrder = async (params: {
  unit: UnitRow;
  channel: "ADMIN" | "SITE";
  soldByUserId: number | null;
  plan: OrderPlan;
  items: OrderPlanItem[];
  products: Map<number, { id: number; name: string; price: Prisma.Decimal; costPrice: Prisma.Decimal | null }>;
  customer: (typeof TEST_CUSTOMERS)[number];
}): Promise<void> => {
  const { unit, channel, soldByUserId, plan, items, products, customer } = params;

  const total = items.reduce((acc, item) => {
    const product = products.get(item.productId!)!;
    return acc + toDecimalNumber(product.price) * item.quantity;
  }, 0);

  const createdAt =
    plan.paidHoursAgo !== null
      ? hoursAgo(plan.paidHoursAgo + 0.5) // pedido criado um pouco antes da confirmação de pagamento
      : hoursAgo(0.2);
  const paymentConfirmedAt = plan.paidHoursAgo !== null ? hoursAgo(plan.paidHoursAgo) : null;

  let separatedAt: Date | null = null;
  let packedAt: Date | null = null;
  let dispatchedAt: Date | null = null;
  let shippedAt: Date | null = null;
  let deliveredAt: Date | null = null;
  if (paymentConfirmedAt && plan.stageGapsMinutes) {
    separatedAt = minutesAfter(paymentConfirmedAt, plan.stageGapsMinutes.separated);
    packedAt = minutesAfter(separatedAt, plan.stageGapsMinutes.packed);
    dispatchedAt = minutesAfter(packedAt, plan.stageGapsMinutes.dispatched);
    shippedAt = minutesAfter(dispatchedAt, plan.stageGapsMinutes.shipped);
    deliveredAt = minutesAfter(shippedAt, plan.stageGapsMinutes.delivered);
  } else if (paymentConfirmedAt && plan.fulfillmentStatus === "EMBALADO") {
    // Pedido atrasado (OVERDUE) que já foi separado/embalado, mas travou aí.
    separatedAt = minutesAfter(paymentConfirmedAt, 90);
    packedAt = minutesAfter(separatedAt, 150);
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          publicCode: buildOrderPublicCode(),
          status: plan.status,
          fulfillmentStatus: plan.fulfillmentStatus,
          channel,
          soldByUserId,
          unitId: unit.id,
          total: new Prisma.Decimal(total),
          customerName: customer.name,
          customerEmail: customer.email,
          customerPhone: customer.phone,
          createdAt,
          paymentConfirmedAt,
          separatedAt,
          packedAt,
          dispatchedAt,
          shippedAt,
          deliveredAt,
          fulfillmentNotes: plan.fulfillmentNotes ?? null,
          items: {
            create: items.map((item) => {
              const product = products.get(item.productId!)!;
              return {
                productId: product.id,
                quantity: item.quantity,
                unitPrice: product.price,
                unitCost: product.costPrice,
              };
            }),
          },
        },
        select: { id: true, publicCode: true },
      });

      for (const item of items) {
        const product = products.get(item.productId!)!;
        await sellStockDirect(tx, {
          productId: product.id,
          unitId: unit.id,
          quantity: item.quantity,
          refOrderId: order.id,
          userId: soldByUserId,
          unitCost: product.costPrice ? toDecimalNumber(product.costPrice) : null,
        });
      }

      if (order.publicCode) {
        await tx.order.update({
          where: { id: order.id },
          data: { orderHmac: generateOrderHmac(order.id, order.publicCode) },
        });
      }

      if (plan.status === "PAGO") {
        await appendOrderStatusHistory(tx, {
          orderId: order.id,
          fromStatus: "PENDENTE",
          toStatus: "PAGO",
          source: "SEED_ADMIN_V2_TEST_DATA",
          note: `${SEED_TAG} pedido de teste (${plan.label})`,
        });
      }

      return order;
    });

    recordAudit("ORDER_MANUAL_SALE", {
      userId: soldByUserId ?? undefined,
      meta: { orderId: created.id, unitId: unit.id, total, seed: true, plan: plan.label },
    });
  } catch (error) {
    if (error instanceof StockError) {
      logger.warn("Pedido de teste pulado por falta de estoque", {
        unit: unit.name,
        plan: plan.label,
        error: error.message,
      });
      return;
    }
    throw error;
  }
};

const ensureOrders = async (units: Map<string, UnitRow>): Promise<void> => {
  const masterUser = await prisma.user.findFirstOrThrow({ where: { role: "MASTER" }, orderBy: { id: "asc" } });
  const productRows = await prisma.product.findMany({
    select: { id: true, name: true, price: true, costPrice: true },
  });
  if (productRows.length === 0) {
    throw new Error(
      "Nenhum produto encontrado — rode o seed base (npm run seed) antes deste script de massa de teste do Admin V2."
    );
  }
  const products = new Map(productRows.map((product) => [product.id, product]));

  let unitIndex = 0;
  for (const [key, unit] of units) {
    const existingTestOrders = await prisma.order.count({
      where: { unitId: unit.id, customerEmail: { endsWith: `@${TEST_EMAIL_DOMAIN}` } },
    });
    if (existingTestOrders >= ORDERS_PER_UNIT_TARGET) {
      logger.info("Pedidos de teste ja existem para a unidade, pulando", { unit: unit.name, existingTestOrders });
      unitIndex += 1;
      continue;
    }

    const includeBlocked = unitIndex % 2 === 0; // metade das unidades ganha o caso BLOCKED, para variar sem repetir em todas
    const plans = buildOrderPlans(includeBlocked);
    const channel = unit.isOnline ? "SITE" : "ADMIN";
    const soldByUserId = unit.isOnline ? null : masterUser.id;

    for (const [planIndex, plan] of plans.entries()) {
      const seedIndex = unitIndex * 10 + planIndex;
      const items = pickOrderItems(productRows, seedIndex);
      const customer = customerAt(unitIndex * 3 + planIndex);
      await createTestOrder({ unit, channel, soldByUserId, plan, items, products, customer });
    }

    logger.info("Pedidos de teste criados para a unidade", { unit: unit.name, key, count: plans.length });
    unitIndex += 1;
  }
};

// ─── 5) Agendamentos — pelo menos 2 profissionais por unidade física ───────────────────

const ensureAppointments = async (
  units: Map<string, UnitRow>,
  professionals: Map<string, ProfessionalRow>
): Promise<void> => {
  const services = await prisma.service.findMany({ select: { id: true, durationMin: true } });
  const durationById = new Map(services.map((service) => [service.id, service.durationMin ?? 60]));

  let customerCursor = 0;
  for (const [key, professional] of professionals) {
    if (!professional.serviceIds.length) continue;

    const existingTestAppointments = await prisma.appointment.count({
      where: { professionalId: professional.id, notes: { contains: SEED_TAG } },
    });
    if (existingTestAppointments >= APPOINTMENTS_PER_PROFESSIONAL_TARGET) {
      logger.info("Agendamentos de teste ja existem para o profissional, pulando", {
        professionalId: professional.id,
        key,
      });
      continue;
    }

    // 3 atendimentos no passado recente (confirmados) + 1 no futuro proximo (pendente).
    const dayOffsets = [-9, -5, -2, 3];
    const hourSlots = ["10:00", "13:30", "16:00", "11:00"];

    for (let i = 0; i < dayOffsets.length; i += 1) {
      const baseDay = daysFromNow(dayOffsets[i]);
      const [hh, mm] = hourSlots[i].split(":").map(Number);
      const start = new Date(baseDay);
      start.setHours(hh, mm, 0, 0);

      const serviceId = professional.serviceIds[i % professional.serviceIds.length];
      const durationMin = durationById.get(serviceId) ?? 60;
      const end = minutesAfter(start, durationMin);
      const isFuture = dayOffsets[i] > 0;
      const customer = customerAt(customerCursor);
      customerCursor += 1;

      const existingSlot = await prisma.appointmentSlot.findUnique({
        where: {
          unitId_professionalId_slotStart: {
            unitId: professional.unitId,
            professionalId: professional.id,
            slotStart: start,
          },
        },
      });
      if (existingSlot) continue;

      await prisma.$transaction(async (tx) => {
        const appointment = await tx.appointment.create({
          data: {
            unitId: professional.unitId,
            professionalId: professional.id,
            serviceId,
            start,
            end,
            clientName: customer.name,
            clientPhone: customer.phone,
            status: isFuture ? "PENDENTE" : "CONFIRMADO",
            notes: `${SEED_TAG} agendamento de teste`,
          },
        });
        await tx.appointmentSlot.create({
          data: {
            appointmentId: appointment.id,
            unitId: professional.unitId,
            professionalId: professional.id,
            slotStart: start,
            slotEnd: end,
          },
        });
      });
    }

    logger.info("Agendamentos de teste criados para o profissional", { key, professionalId: professional.id });
  }
};

// ─── main ───────────────────────────────────────────────────────────────────────────────

const main = async (): Promise<void> => {
  logger.info("Iniciando geracao de massa de teste do Admin V2 (PLAN-0022)");

  const units = await ensureUnits();
  await ensureInitialStock(units);
  const professionals = await ensureProfessionals(units);
  await ensureOrders(units);
  await ensureAppointments(units, professionals);

  logger.info("Massa de teste do Admin V2 concluida", {
    units: units.size,
    professionals: professionals.size,
  });
};

main()
  .catch((error) => {
    logger.error("Falha ao gerar massa de teste do Admin V2", { error });
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
