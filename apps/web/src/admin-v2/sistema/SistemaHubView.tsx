import { HubCard } from "../shell/HubCard";

/**
 * Admin V2 (PLAN-0024, RETROFIT-021) — hub de Sistema: nasceu como adapter/link puro pro
 * legado (`DECISION-013` regra #5); desde o `PLAN-0026`/`DECISION-014` cada tela vira
 * nativa onda a onda (mesmo padrão de `CadastrosHubView.tsx`) — o card muda de link externo
 * (`/admin#view`, deep-link por hash, ver `admin-shell/behavior.ts`) pra rota interna do V2
 * (`native: true`) só quando a tela correspondente é entregue. **Onda 10 (Testes) fechou o
 * hub inteiro** — as 6 telas navegáveis de Sistema já são nativas.
 *
 * Segurança fica desabilitada: não existe tela dedicada pra ela — é feature de backend
 * (AuditLog/RLS) sem UI própria. Nunca fabricado link falso — ver `DrillCard`/`AdminSidebar`
 * para o mesmo padrão.
 *
 * `PLAN-0033` — "Infra" saiu da lista de desabilitados: o widget de status (antes um modal
 * flutuante só do Admin legado, agora aposentado) foi portado pro próprio topbar do Admin V2
 * (`DockerStatusButton.tsx`, ícone no canto direito) — deixou de ser "não existe", só não é
 * uma tela dedicada dentro deste hub.
 */

const CARDS = [
  { icon: "palette", label: "Branding", href: "/admin-v2/sistema/branding", native: true },
  { icon: "article", label: "Textos das Páginas", href: "/admin-v2/sistema/textos-paginas", native: true },
  { icon: "view_agenda", label: "Seções", href: "/admin-v2/sistema/secoes", native: true },
  { icon: "photo_library", label: "Galeria de Mídias", href: "/admin-v2/sistema/galeria-midias", native: true },
  { icon: "chat", label: "WhatsApp / Integrações", href: "/admin-v2/sistema/whatsapp", native: true },
  { icon: "science", label: "Testes", href: "/admin-v2/sistema/testes", native: true },
];

const DISABLED_CARDS = [
  { icon: "security", label: "Segurança", disabledReason: "sem tela dedicada ainda" },
];

export function SistemaHubView() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-3xl font-bold text-forest">Sistema</h1>
        <p className="text-base text-stone-600 dark:text-stone-400">
          Acesso às telas de configuração — todas já nativas do Admin V2 (`PLAN-0026`).
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {CARDS.map((card) => (
          <HubCard key={card.href} icon={card.icon} label={card.label} href={card.href} native={card.native} />
        ))}
        {DISABLED_CARDS.map((card) => (
          <HubCard key={card.label} icon={card.icon} label={card.label} disabledReason={card.disabledReason} />
        ))}
      </div>
    </div>
  );
}
