import { HubCard } from "../shell/HubCard";

/**
 * Admin V2 (PLAN-0024, RETROFIT-020) — hub de Cadastros. Nasceu como adapter/link puro pro
 * legado (`DECISION-013` regra #5); desde o `PLAN-0026`/`DECISION-014` cada tela vira
 * nativa onda a onda — o card muda de link externo (`/admin#view`, deep-link por hash) pra
 * rota interna do V2 (`native: true`) só quando a tela correspondente é entregue. As duas
 * formas convivem até a lista inteira migrar.
 *
 * "Unidades" não entra: não existe `data-view` correspondente no Admin legado hoje
 * (unidades são geridas via seed/migration, não tela) — não fabricado link falso.
 */

const CARDS = [
  { icon: "inventory_2", label: "Produtos", href: "/admin#produtos" },
  { icon: "content_cut", label: "Serviços", href: "/admin-v2/cadastros/servicos", native: true },
  { icon: "card_membership", label: "Planos", href: "/admin-v2/cadastros/planos", native: true },
  { icon: "sell", label: "Cupons", href: "/admin-v2/cadastros/cupons", native: true },
  { icon: "local_shipping", label: "Entrega", href: "/admin-v2/cadastros/entrega", native: true },
  { icon: "groups", label: "Pessoas (Clientes/Profissionais/Usuários)", href: "/admin#usuarios" },
];

export function CadastrosHubView() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-3xl font-bold text-forest">Cadastros</h1>
        <p className="text-base text-stone-600 dark:text-stone-400">
          Acesso às telas de cadastro — algumas já nativas do Admin V2 (`PLAN-0026`), outras
          ainda apontando pro Admin legado enquanto sua onda não chega.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {CARDS.map((card) => (
          <HubCard key={card.href} icon={card.icon} label={card.label} href={card.href} native={card.native} />
        ))}
      </div>
    </div>
  );
}
