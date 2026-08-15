import type { SubscriptionHealthEntry } from "../types";

/**
 * Admin V2 (PLAN-0022, Onda 8) — linha de assinatura na Saúde da Base (RETROFIT-009).
 * `reason` sempre visível — "Atenção" nunca é só um número, lista a causa específica
 * (cobrança falhou, uso caiu, inadimplente), mesmo padrão de `CustomerRow.tsx` (Onda 7).
 */

export function SubscriptionRow({ subscription }: { subscription: SubscriptionHealthEntry }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-[#cfe7d1] bg-white p-3 dark:border-forest-green dark:bg-forest">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-forest">{subscription.customerName || "(sem nome)"}</p>
        <span className="text-sm text-stone-500 dark:text-stone-400">{subscription.membershipName}</span>
      </div>
      <p className="text-sm text-stone-600 dark:text-stone-400">
        {[subscription.customerEmail, subscription.customerPhone].filter(Boolean).join(" · ") || "sem contato registrado"}
      </p>
      <p className="text-xs font-medium text-forest">{subscription.reason}</p>
      <p className="text-xs text-stone-500 dark:text-stone-400">
        {subscription.approvedPaymentsCurrentPeriod} cobrança(s) aprovada(s) neste período ·{" "}
        {subscription.approvedPaymentsPreviousPeriod} no anterior
      </p>
    </div>
  );
}
