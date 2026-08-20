import { useEffect, useRef, useState } from "react";
import { useDockerHealth, type DockerStatus, type ServiceStatus } from "../shared/useDockerHealth";

/**
 * Admin V2 (`PLAN-0033`) — porta o widget de status de infra do Admin legado
 * (`modules/admin-docker-status/DockerStatusModal.tsx`, aposentado), reusando `useDockerHealth`
 * sem mudança de lógica. Tratamento visual novo, pedido explícito do usuário: era uma barra
 * de LED + texto sempre visível; vira um botão pequeno (círculo com ícone `info`), canto
 * direito do topbar, que abre um popover só quando clicado — 100% tokens `state-*` já
 * existentes (mesmo padrão de `admin-v2/shared/health.ts`), sem CSS/classe nova do legado.
 */

const SERVICE_ROWS: [keyof DockerStatus, string][] = [
  ["nginx", "Nginx"],
  ["api", "API"],
  ["web", "Web"],
  ["postgres", "PostgreSQL"],
];

const STATUS_DOT_CLASS: Record<ServiceStatus, string> = {
  online: "bg-state-healthy",
  offline: "bg-state-critical",
  unknown: "bg-state-attention",
  loading: "bg-state-attention",
};

const STATUS_LABEL: Record<ServiceStatus, string> = {
  online: "Online",
  offline: "Offline",
  unknown: "Não verificado",
  loading: "Verificando…",
};

export function DockerStatusButton() {
  const { status, isLoading, anyOffline } = useDockerHealth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Status da infraestrutura"
        aria-label="Status da infraestrutura"
        aria-expanded={open}
        className={`flex h-7 w-7 items-center justify-center rounded-full border text-sm hover:bg-primary/10 ${
          anyOffline ? "border-state-critical text-state-critical" : "border-gold/60 text-forest"
        }`}
      >
        <span className="material-symbols-outlined text-base">info</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Status da infraestrutura"
          className="absolute right-0 top-9 z-50 w-56 rounded-xl border border-gold/50 bg-white p-3 shadow-2xl dark:border-forest-green dark:bg-forest"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">Infraestrutura</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar"
              className="flex h-5 w-5 items-center justify-center text-stone-500 hover:text-forest dark:text-stone-400"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            {SERVICE_ROWS.map(([key, label]) => {
              const s: ServiceStatus = isLoading ? "loading" : status[key];
              return (
                <div key={key} className="flex items-center gap-2 text-xs">
                  <span className={`h-2 w-2 rounded-full ${STATUS_DOT_CLASS[s]}`} aria-hidden="true" />
                  <span className="flex-1 font-medium text-forest">{label}</span>
                  <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">{STATUS_LABEL[s]}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
