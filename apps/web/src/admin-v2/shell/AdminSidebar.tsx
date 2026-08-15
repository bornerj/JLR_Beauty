import { useNavigate } from "react-router-dom";

/**
 * Admin V2 (PLAN-0022) — sidebar de 7 "mundos" (RETROFIT-001), não módulos.
 * "Panorama" (Onda 1), "Rede" (Onda 2), "Operação" (Onda 3), "Clientes" (Onda 7) e
 * "Crescimento" (Onda 9) vêm do PLAN-0022. "Cadastros" e "Sistema" (RETROFIT-020/021,
 * PLAN-0024) são hubs de adapter/link pras telas legadas — sem reescrita estética
 * (`DECISION-013` regra #5). Todos os 7 "mundos" estão ativos agora; um item só volta
 * a ficar `available: false` ("em breve") se um novo mundo nascer sem tela ainda —
 * nunca como link morto.
 */

type SidebarEntry = {
  key: string;
  label: string;
  icon: string;
  available: boolean;
  path?: string;
};

const ENTRIES: SidebarEntry[] = [
  { key: "panorama", label: "Panorama", icon: "dashboard", available: true, path: "/admin-v2" },
  { key: "operacao", label: "Operação", icon: "bolt", available: true, path: "/admin-v2/operacao" },
  { key: "rede", label: "Rede", icon: "hub", available: true, path: "/admin-v2/rede" },
  { key: "clientes", label: "Clientes", icon: "groups", available: true, path: "/admin-v2/clientes" },
  { key: "crescimento", label: "Crescimento", icon: "trending_up", available: true, path: "/admin-v2/crescimento" },
  { key: "cadastros", label: "Cadastros", icon: "inventory_2", available: true, path: "/admin-v2/cadastros" },
  { key: "sistema", label: "Sistema", icon: "settings", available: true, path: "/admin-v2/sistema" },
];

export function AdminSidebar({ activeKey }: { activeKey: string }) {
  const navigate = useNavigate();
  return (
    <aside className="admin-v2-sidebar group flex-shrink-0 border-r border-gold/30 bg-cream-sidebar dark:bg-forest-green">
      <nav className="flex flex-col gap-1 p-3">
        {ENTRIES.map((entry) => {
          const isActive = entry.key === activeKey;
          if (!entry.available || !entry.path) {
            return (
              <div
                key={entry.key}
                title={`${entry.label} — em breve`}
                aria-disabled="true"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-stone-400 opacity-50 cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-xl">{entry.icon}</span>
                <span className="admin-v2-sidebar-label text-sm font-medium">{entry.label}</span>
                <span className="admin-v2-sidebar-label ml-auto text-[10px] uppercase tracking-wide">
                  em breve
                </span>
              </div>
            );
          }
          return (
            <button
              key={entry.key}
              type="button"
              onClick={() => navigate(entry.path as string)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                isActive ? "bg-primary/10 text-primary" : "text-forest hover:bg-primary/5"
              }`}
            >
              <span className="material-symbols-outlined text-xl">{entry.icon}</span>
              <span className="admin-v2-sidebar-label text-sm font-semibold">{entry.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
