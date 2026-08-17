import { formatCurrencyBRL } from "../../../shared/format";
import type { Membership } from "../types";

/** Admin V2 (PLAN-0026, Onda 1) — cartão de exibição de um plano na lista. */

export function PlanCard({
  membership,
  onEdit,
  onDelete,
}: {
  membership: Membership;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[#cfe7d1] bg-white p-5 dark:border-forest-green dark:bg-forest">
      {membership.imageUrl && (
        <img
          src={membership.imageUrl}
          alt={membership.name}
          className="h-32 w-full rounded-lg object-cover"
        />
      )}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-forest">{membership.name}</p>
          <p className="text-xs text-stone-500 dark:text-stone-400">{membership.title}</p>
        </div>
        {membership.isFeatured && (
          <span className="flex-shrink-0 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-bold uppercase text-gold-accent">
            destaque
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-forest">{formatCurrencyBRL(Number(membership.price))}</p>
      {membership.description && (
        <p className="text-sm text-stone-600 dark:text-stone-400">{membership.description}</p>
      )}
      {membership.benefits && membership.benefits.length > 0 && (
        <ul className="flex flex-col gap-1 text-sm text-stone-600 dark:text-stone-400">
          {membership.benefits.map((benefit, index) => (
            <li key={index} className="flex items-start gap-1.5">
              <span aria-hidden="true">•</span>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
          {membership.status}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-full border border-primary/60 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/10"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-full border border-state-critical/50 px-3 py-1 text-xs font-semibold text-state-critical hover:bg-state-critical/10"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}
