import { HubCard } from "../shell/HubCard";

/**
 * Admin V2 (PLAN-0024, RETROFIT-020) — hub de Cadastros: adapter/link para as telas
 * legadas existentes (`DECISION-013` regra #5), sem reescrita estética nesta fase.
 * Nenhum dado buscado aqui — é navegação pura para o Admin legado, já na tela certa
 * via deep-link por hash (ver `apps/web/src/modules/admin-shell/behavior.ts`).
 *
 * "Unidades" não entra: não existe `data-view` correspondente no Admin legado hoje
 * (unidades são geridas via seed/migration, não tela) — não fabricado link falso.
 */

const CARDS = [
  { icon: "inventory_2", label: "Produtos", href: "/admin#produtos" },
  { icon: "content_cut", label: "Serviços", href: "/admin#servicos" },
  { icon: "card_membership", label: "Planos", href: "/admin#planos" },
  { icon: "sell", label: "Cupons", href: "/admin#cupons-desconto" },
  { icon: "local_shipping", label: "Entrega", href: "/admin#checkout-entrega" },
  { icon: "groups", label: "Pessoas (Clientes/Profissionais/Usuários)", href: "/admin#usuarios" },
];

export function CadastrosHubView() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-3xl font-bold text-forest">Cadastros</h1>
        <p className="text-base text-stone-600 dark:text-stone-400">
          Acesso direto às telas de cadastro do Admin — nenhuma reescrita nesta fase.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {CARDS.map((card) => (
          <HubCard key={card.href} icon={card.icon} label={card.label} href={card.href} />
        ))}
      </div>
    </div>
  );
}
