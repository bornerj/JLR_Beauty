import { HubCard } from "../shell/HubCard";

/**
 * Admin V2 (PLAN-0024, RETROFIT-021) — hub de Sistema: adapter/link para as telas
 * legadas existentes (`DECISION-013` regra #5), sem reescrita estética nesta fase.
 * Nenhum dado buscado aqui — é navegação pura para o Admin legado, já na tela certa
 * via deep-link por hash (ver `apps/web/src/modules/admin-shell/behavior.ts`).
 *
 * Segurança e Infra ficam desabilitadas: não existe `data-view` dedicada pra elas no
 * Admin legado hoje — Segurança é feature de backend (AuditLog/RLS) sem tela própria,
 * Infra só existe como modal flutuante (Docker Status Modal), não como view navegável.
 * Nunca fabricado link falso — ver `DrillCard`/`AdminSidebar` para o mesmo padrão.
 */

const CARDS = [
  { icon: "palette", label: "Branding", href: "/admin#branding" },
  { icon: "article", label: "Textos das Páginas", href: "/admin#textos-paginas" },
  { icon: "view_agenda", label: "Seções", href: "/admin#site-sections" },
  { icon: "photo_library", label: "Galeria de Mídias", href: "/admin#galeria-midias" },
  { icon: "chat", label: "WhatsApp / Integrações", href: "/admin#whatsapp-contatos" },
  { icon: "science", label: "Testes", href: "/admin#testes" },
];

const DISABLED_CARDS = [
  { icon: "security", label: "Segurança", disabledReason: "sem tela dedicada no Admin ainda" },
  { icon: "dns", label: "Infra", disabledReason: "hoje só como modal flutuante no Admin" },
];

export function SistemaHubView() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-3xl font-bold text-forest">Sistema</h1>
        <p className="text-base text-stone-600 dark:text-stone-400">
          Acesso direto às telas de configuração do Admin — nenhuma reescrita nesta fase.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {CARDS.map((card) => (
          <HubCard key={card.href} icon={card.icon} label={card.label} href={card.href} />
        ))}
        {DISABLED_CARDS.map((card) => (
          <HubCard key={card.label} icon={card.icon} label={card.label} disabledReason={card.disabledReason} />
        ))}
      </div>
    </div>
  );
}
