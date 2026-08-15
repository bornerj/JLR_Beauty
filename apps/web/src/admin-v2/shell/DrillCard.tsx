import type { ReactNode } from "react";

/**
 * Admin V2 (PLAN-0022) — card-base com afordância de drill-down (governança #1 do plano:
 * "toda visão resumida permite drill-down"). Quando a tela de destino ainda não existe
 * (ondas futuras), o card fica com CTA desabilitado e "em breve" — nunca um link morto.
 */

export function DrillCard({
  title,
  action,
  onDrillDown,
  children,
}: {
  title: string;
  action?: string;
  onDrillDown?: () => void;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-[#cfe7d1] bg-white p-5 dark:border-forest-green dark:bg-forest">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">{title}</p>
      </div>
      {children}
      {action && (
        <div>
          {onDrillDown ? (
            <button
              type="button"
              onClick={onDrillDown}
              className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary/90"
            >
              {action} →
            </button>
          ) : (
            <button
              type="button"
              disabled
              title={`${action} — em breve`}
              className="cursor-not-allowed rounded-full border border-stone-200 px-3 py-1.5 text-sm font-semibold text-stone-500 dark:text-stone-400"
            >
              {action} · em breve
            </button>
          )}
        </div>
      )}
    </section>
  );
}
