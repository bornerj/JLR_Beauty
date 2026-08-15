import { formatMinutes } from "../../shared/format";
import type { CustomerFlowEntry } from "../types";

/**
 * Admin V2 (PLAN-0022, Onda 7) — linha de cliente no fluxo (RETROFIT-008).
 * `reason` sempre visível — nunca um nome numa lista sem explicação (governança #6,
 * critério de aceitação explícito da onda: "mostra a lista com o motivo específico").
 */

const timeSince = (iso: string): string => {
  const minutes = Math.max(0, (Date.now() - new Date(iso).getTime()) / 60000);
  return formatMinutes(minutes);
};

export function CustomerRow({ customer }: { customer: CustomerFlowEntry }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-[#cfe7d1] bg-white p-3 dark:border-forest-green dark:bg-forest">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-forest">{customer.name}</p>
        <span className="text-sm text-stone-500 dark:text-stone-400">última atividade há {timeSince(customer.lastActivityAt)}</span>
      </div>
      <p className="text-sm text-stone-600 dark:text-stone-400">{[customer.email, customer.phone].filter(Boolean).join(" · ") || "sem contato registrado"}</p>
      <p className="text-xs font-medium text-forest">{customer.reason}</p>
      <p className="text-xs text-stone-500 dark:text-stone-400">
        {customer.activityCountTotal} atividade(s) no total · {customer.activityCountCurrentPeriod} neste período ·{" "}
        {customer.activityCountPreviousPeriod} no anterior
      </p>
    </div>
  );
}
