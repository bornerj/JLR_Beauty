import prisma from "../../../lib/prisma";
import { resolveAdminPeriodRange, type AdminPeriodInput } from "../../admin/kpis/period";
import { classifyCustomer } from "./classifier";
import type { CustomerFlow, CustomerFlowEntry, CustomerRawSignals, CustomerState } from "./types";

/**
 * Admin V2 (PLAN-0022, Onda 7) — Clientes como Fluxo de Relacionamento (RETROFIT-008).
 * Camada de acesso a dados: pedidos PAGO/CANCELADO + agendamentos não-cancelados/
 * cancelados + assinaturas inadimplentes, agrupados pelo proxy de identidade, depois
 * delega a classificação para `classifier.ts` (puro). Nenhuma escrita, nenhum campo
 * novo no `User`/`Customer` (100% derivado).
 *
 * PLAN-0027 Item 4 (`ERR-0058`): prioridade da chave trocada de `email > telefone > nome`
 * para **`telefone > email > nome`** — telefone normalizado (só dígitos) é a chave mais
 * estável entre as duas fontes reais: pedidos sempre têm e-mail (agrupavam por e-mail),
 * agendamentos não têm e-mail direto (`Appointment.clientId` fica `NULL` na prática, cai no
 * fallback telefone) — as duas nunca convergiam pra mesma chave pro mesmo cliente físico,
 * duplicando a contagem (8 clientes reais apareciam como 17). `unit-health/service.ts` e
 * `panorama/service.ts` implementam a mesma convenção de forma independente (comentário
 * antigo, não um import compartilhado) e **não foram alterados neste fix** — mesmo risco de
 * duplicação pode existir lá, mas está fora do que foi pedido; ver `PLAN-0027`.
 */

const identityKey = (email: string | null | undefined, phone: string | null | undefined, name: string | null | undefined): string =>
  (phone || "").replace(/\D/g, "") || (email || "").trim().toLowerCase() || (name || "").trim() || "(sem identificacao)";

type Accumulator = {
  name: string;
  email: string | null;
  phone: string | null;
  firstActivityAt: Date;
  lastActivityAt: Date;
  activityCountTotal: number;
  activityCountCurrentPeriod: number;
  activityCountPreviousPeriod: number;
  hasRecentCancellation: boolean;
  isSubscriptionDelinquent: boolean;
};

const ensureCustomer = (
  map: Map<string, Accumulator>,
  key: string,
  name: string,
  email: string | null,
  phone: string | null,
  activityAt: Date
): Accumulator => {
  const existing = map.get(key);
  if (existing) {
    // Preferir o registro mais recente para nome/e-mail/telefone exibidos (dado mais atual).
    if (activityAt >= existing.lastActivityAt) {
      existing.name = name;
      existing.email = email ?? existing.email;
      existing.phone = phone ?? existing.phone;
    }
    return existing;
  }
  const created: Accumulator = {
    name,
    email,
    phone,
    firstActivityAt: activityAt,
    lastActivityAt: activityAt,
    activityCountTotal: 0,
    activityCountCurrentPeriod: 0,
    activityCountPreviousPeriod: 0,
    hasRecentCancellation: false,
    isSubscriptionDelinquent: false,
  };
  map.set(key, created);
  return created;
};

const EMPTY_COUNTS: Record<CustomerState, number> = { NOVO: 0, ATIVO: 0, RECORRENTE: 0, EM_RISCO: 0, INATIVO: 0 };

export const getCustomerFlow = async (input: AdminPeriodInput & { unitIds?: number[] }): Promise<CustomerFlow> => {
  const range = resolveAdminPeriodRange(input);
  // "Atividade" é medida desde sempre (sem limite inferior de data) para achar
  // corretamente `firstActivityAt`/`lastActivityAt` reais — não só dentro do período
  // pedido, senão todo mundo pareceria "novo".
  const unitScope = input.unitIds && input.unitIds.length > 0 ? { in: input.unitIds } : undefined;

  const [paidOrders, cancelledOrders, activeAppointments, cancelledAppointments, delinquentSubscriptions] = await Promise.all([
    prisma.order.findMany({
      where: { status: "PAGO", ...(unitScope ? { unitId: unitScope } : {}) },
      select: { customerName: true, customerEmail: true, customerPhone: true, createdAt: true },
    }),
    prisma.order.findMany({
      where: { status: "CANCELADO", createdAt: { gte: range.from, lte: range.to }, ...(unitScope ? { unitId: unitScope } : {}) },
      select: { customerName: true, customerEmail: true, customerPhone: true },
    }),
    prisma.appointment.findMany({
      where: { status: { not: "CANCELADO" }, ...(unitScope ? { unitId: unitScope } : {}) },
      select: { clientName: true, clientPhone: true, start: true, client: { select: { email: true } } },
    }),
    prisma.appointment.findMany({
      where: { status: "CANCELADO", start: { gte: range.from, lte: range.to }, ...(unitScope ? { unitId: unitScope } : {}) },
      select: { clientName: true, clientPhone: true, client: { select: { email: true } } },
    }),
    // Subscription não tem unitId no schema (nota já registrada na Onda 1) — sinal de
    // rede inteira, não filtrável por unidade.
    prisma.subscription.findMany({
      where: { status: "INADIMPLENTE" },
      select: { customerName: true, customerEmail: true, customerPhone: true },
    }),
  ]);

  const customers = new Map<string, Accumulator>();
  // Placeholder para clientes que só aparecem via cancelamento/inadimplência (nunca
  // tiveram uma atividade real registrada): precisa ficar ANTES do período atual para
  // não virar "NOVO" por engano (governança #6 — nunca fabricar uma primeira atividade
  // que não existe). Fica fora do período anterior também, então não conta para
  // nenhuma contagem de atividade — só ativa o sinal de risco correspondente.
  const noActivityPlaceholder = new Date(range.previousFrom.getTime() - 1);

  for (const order of paidOrders) {
    const key = identityKey(order.customerEmail, order.customerPhone, order.customerName);
    const acc = ensureCustomer(customers, key, order.customerName || "(sem nome)", order.customerEmail, order.customerPhone, order.createdAt);
    acc.firstActivityAt = order.createdAt < acc.firstActivityAt ? order.createdAt : acc.firstActivityAt;
    acc.lastActivityAt = order.createdAt > acc.lastActivityAt ? order.createdAt : acc.lastActivityAt;
    acc.activityCountTotal += 1;
    if (order.createdAt >= range.from && order.createdAt <= range.to) acc.activityCountCurrentPeriod += 1;
    else if (order.createdAt >= range.previousFrom && order.createdAt <= range.previousTo) acc.activityCountPreviousPeriod += 1;
  }

  for (const appointment of activeAppointments) {
    const key = identityKey(appointment.client?.email, appointment.clientPhone, appointment.clientName);
    const acc = ensureCustomer(customers, key, appointment.clientName || "(sem nome)", appointment.client?.email ?? null, appointment.clientPhone, appointment.start);
    acc.firstActivityAt = appointment.start < acc.firstActivityAt ? appointment.start : acc.firstActivityAt;
    acc.lastActivityAt = appointment.start > acc.lastActivityAt ? appointment.start : acc.lastActivityAt;
    acc.activityCountTotal += 1;
    if (appointment.start >= range.from && appointment.start <= range.to) acc.activityCountCurrentPeriod += 1;
    else if (appointment.start >= range.previousFrom && appointment.start <= range.previousTo) acc.activityCountPreviousPeriod += 1;
  }

  for (const order of cancelledOrders) {
    const key = identityKey(order.customerEmail, order.customerPhone, order.customerName);
    // Um cancelamento sozinho não cria "atividade" (não é comparecimento/compra real),
    // mas ainda assim identifica o cliente — se ele nunca apareceu em mais nada, nasce
    // aqui mesmo, com contagens zeradas e o sinal de risco ligado.
    const acc = customers.get(key) ?? ensureCustomer(customers, key, order.customerName || "(sem nome)", order.customerEmail, order.customerPhone, noActivityPlaceholder);
    acc.hasRecentCancellation = true;
  }

  for (const appointment of cancelledAppointments) {
    const key = identityKey(appointment.client?.email, appointment.clientPhone, appointment.clientName);
    const acc =
      customers.get(key) ??
      ensureCustomer(customers, key, appointment.clientName || "(sem nome)", appointment.client?.email ?? null, appointment.clientPhone, noActivityPlaceholder);
    acc.hasRecentCancellation = true;
  }

  for (const subscription of delinquentSubscriptions) {
    const key = identityKey(subscription.customerEmail, subscription.customerPhone, subscription.customerName);
    const acc =
      customers.get(key) ??
      ensureCustomer(customers, key, subscription.customerName || "(sem nome)", subscription.customerEmail, subscription.customerPhone, noActivityPlaceholder);
    acc.isSubscriptionDelinquent = true;
  }

  const period = { currentFrom: range.from, currentTo: range.to, previousFrom: range.previousFrom, previousTo: range.previousTo };
  const counts: Record<CustomerState, number> = { ...EMPTY_COUNTS };

  const entries: CustomerFlowEntry[] = Array.from(customers.entries()).map(([key, acc]) => {
    const signals: CustomerRawSignals = {
      key,
      name: acc.name,
      email: acc.email,
      phone: acc.phone,
      firstActivityAt: acc.firstActivityAt,
      lastActivityAt: acc.lastActivityAt,
      activityCountTotal: acc.activityCountTotal,
      activityCountCurrentPeriod: acc.activityCountCurrentPeriod,
      activityCountPreviousPeriod: acc.activityCountPreviousPeriod,
      hasRecentCancellation: acc.hasRecentCancellation,
      isSubscriptionDelinquent: acc.isSubscriptionDelinquent,
    };
    const { state, reason } = classifyCustomer(signals, period);
    counts[state] += 1;
    return {
      key,
      name: acc.name,
      email: acc.email,
      phone: acc.phone,
      state,
      reason,
      firstActivityAt: acc.firstActivityAt.toISOString(),
      lastActivityAt: acc.lastActivityAt.toISOString(),
      activityCountTotal: acc.activityCountTotal,
      activityCountCurrentPeriod: acc.activityCountCurrentPeriod,
      activityCountPreviousPeriod: acc.activityCountPreviousPeriod,
    };
  });

  entries.sort((a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime());

  return {
    period: { from: range.from.toISOString(), to: range.to.toISOString(), days: range.days },
    counts,
    customers: entries,
  };
};
