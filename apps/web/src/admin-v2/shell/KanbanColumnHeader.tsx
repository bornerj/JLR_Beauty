import type { ReactNode } from "react";

/**
 * Admin V2 (PLAN-0025, item 1) — cabeçalho de coluna dos kanban (Operação, Rede,
 * Crescimento). Antes, o cabeçalho não tinha fundo próprio (flutuava direto no fundo da
 * página) ou usava o mesmo `bg-white` dos cards abaixo — confundia visualmente onde a
 * coluna começava. Reusa os tokens já existentes do shell (`cream-sidebar`/`gold`), não
 * inventa cor nova (`DECISION-013` regra #6).
 */

export function KanbanColumnHeader({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-gold/30 bg-cream-sidebar px-3 py-2 dark:border-forest-green dark:bg-forest-green ${className}`}
    >
      {children}
    </div>
  );
}
