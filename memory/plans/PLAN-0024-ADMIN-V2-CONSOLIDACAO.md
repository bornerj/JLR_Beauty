# PLAN-0024 — Admin V2: Consolidação (Cadastros + Sistema)

**Status:** ✅ CONCLUÍDO 2026-08-15 — RETROFIT-020 (Cadastros) + RETROFIT-021 (Sistema) entregues, `tsc`/build/lint limpos, rebuild Docker feito, **validação visual real** (Playwright headless, login real, 30 checks automatizados) confirmando os 12 deep-links + os 2 itens desabilitados + regressão do clique manual no legado. Ver `## Validação real (2026-08-15)` no fim deste documento.
**Origem:** continuação do `PLAN-0022`/`PLAN-0023` (Fundação, Operação e Inteligência 100% entregues e validadas em 2026-08-15) — a pedido do usuário ("seguir para consolidação"), com escopo confirmado em gate socrático (ver `## Decisões do gate socrático` abaixo).
**Decisão arquitetural herdada:** `DECISION-013` (ACTIVE), regra #5 — cadastros e telas de Sistema **não são reescritos esteticamente** nesta fase; o V2 os acessa via adapter/link para as telas legadas existentes até haver valor real comprovado em uma versão nativa.
**Escopo macro:** só `apps/web/src/admin-v2/` (2 telas novas de "hub" + sidebar) e `apps/web/src/modules/admin-shell/behavior.ts` (deep-link por hash no Admin legado). **Nenhuma mudança de backend, nenhuma migração de schema.**
**Agentes de apoio:** `@frontend-specialist`.

---

## Decisões do gate socrático (2026-08-15, respondidas pelo usuário)

1. **Escopo confirmado:** RETROFIT-020 (Cadastros) + RETROFIT-021 (Sistema) apenas. RETROFIT-022 (migração/aposentadoria do Admin legado) **fica fora** — `DECISION-013` não fixou critério pra isso ainda; entra só com nova decisão explícita de produto.
2. **Deep-link confirmado:** o Admin legado hoje **não tem** nenhum mecanismo de deep-link (troca de tela é só clique em memória via `setActiveView`, sem sincronizar `location.hash`/URL — confirmado lendo `apps/web/src/modules/admin-shell/behavior.ts`). Decisão: adicionar suporte a hash (`/admin#<view>`) no legado, mudança pequena e cirúrgica, para que os links do V2 caiam na tela certa (não no dashboard padrão).

---

## RAG executado antes de planejar

- `apps/web/src/admin-v2/shell/AdminSidebar.tsx` — os 2 itens (`cadastros`, `sistema`) já existem no array `ENTRIES` com `available: false` e rótulo final ("em breve") — só falta virar `true` + `path` quando a tela existir (governança já embutida: "nunca link morto").
- `apps/web/src/admin-v2/AdminV2Root.tsx` — padrão de rota/breadcrumb das áreas existentes (`operacao`, `rede`, `clientes`, `crescimento`) a replicar para `cadastros`/`sistema`.
- `apps/web/src/components/pages/AdminContent.tsx` — mapeamento completo dos `data-view` do legado (via `grep -oE 'data-view="[a-z0-9-]+"'`):
  `agenda, assinantes, branding, checkout-entrega, cupons-desconto, dashboard, galeria-midias, metas, performance, planos, produtos, servicos, site-sections, testes, textos-paginas, usuarios, vendas, whatsapp-contatos`.
- `apps/web/src/modules/admin-people/components/AdminPeopleView.tsx` — a view `usuarios` (rótulo "Pessoas" no legado) tem 3 sub-abas via `data-people-tab-target`: `clientes`, `profissionais`, `usuarios` — não sincronizadas com hash/URL hoje (mesma lacuna do nível 1).
- `apps/web/src/modules/admin-shell/behavior.ts` — confirma a lacuna: `setActiveView` só reage a clique (`data-view-trigger`), nunca lê `location.hash` no load. Ponto exato da mudança cirúrgica desta leva.
- **Achado, não fabricado:** nem toda área nomeada na regra #5 da `DECISION-013` ("Segurança", "Infra") tem uma tela de `data-view` correspondente no legado — `Segurança`/`Infra` parecem existir só como funcionalidade de backend (AuditLog, RLS) ou como modal flutuante (Docker Status Modal), não como view navegável. Tratamento: **nunca fabricar um link falso** — esses itens do "hub" do Sistema entram desabilitados/"em breve" com nota explicando por quê, igual ao padrão já usado em `DrillCard.tsx` e no próprio `AdminSidebar.tsx`.

---

## Design

Cada área nova (`Cadastros`, `Sistema`) vira uma rota simples dentro do `AdminV2Root` — uma tela "hub" (grid de cards, mesmo padrão visual do resto do V2, reuso de `DrillCard`/cards já existentes) onde cada card é um **link real** (`<a href="/admin#<view>">`, nunca `<button>` fingindo navegação) que sai do V2 e entra no Admin legado já na tela certa. Sem chamada de API nova — é navegação pura, dado nenhum é buscado nessas telas hub.

**Mapeamento Cadastros (RETROFIT-020) → `data-view` do legado:**

| Card no hub V2 | `data-view` legado | Hash de destino |
|---|---|---|
| Produtos | `produtos` | `/admin#produtos` |
| Serviços | `servicos` | `/admin#servicos` |
| Planos | `planos` | `/admin#planos` |
| Cupons | `cupons-desconto` | `/admin#cupons-desconto` |
| Entrega | `checkout-entrega` | `/admin#checkout-entrega` |
| Pessoas (Clientes/Profissionais/Usuários) | `usuarios` (+ sub-aba) | `/admin#usuarios` (aterrissa na view; sub-aba default, sem deep-link de 2º nível nesta leva — ver `## Fora de escopo`) |

**Mapeamento Sistema (RETROFIT-021) → `data-view` do legado:**

| Card no hub V2 | `data-view` legado | Hash de destino |
|---|---|---|
| Branding | `branding` | `/admin#branding` |
| Textos das Páginas | `textos-paginas` | `/admin#textos-paginas` |
| Seções | `site-sections` | `/admin#site-sections` |
| Galeria de Mídias | `galeria-midias` | `/admin#galeria-midias` |
| WhatsApp / Integrações | `whatsapp-contatos` | `/admin#whatsapp-contatos` |
| Testes | `testes` | `/admin#testes` |
| Segurança | — | **desabilitado, "em breve"** — sem tela dedicada no legado hoje |
| Infra | — | **desabilitado, "em breve"** — hoje só existe como modal flutuante (Docker Status Modal), não como view navegável |

**Deep-link no legado (mudança cirúrgica em `admin-shell/behavior.ts`):**
- No `initAdminShellBehavior`, ler `window.location.hash` (sem o `#`) no load; se bater com um `data-view` válido, chamar `setActiveView(hash)` no lugar do `dashboard` padrão.
- `setActiveView` já existente **não muda de assinatura** — só ganha uma chamada extra na inicialização.
- Não sincroniza o hash de volta quando o usuário clica manualmente no menu do legado (fora de escopo — ver abaixo); é só entrada, não navegação bidirecional.

---

## Fora de escopo (explícito, não fabricar depois sem atualizar este plano)

- Deep-link de 2º nível para as sub-abas de "Pessoas" (`clientes`/`profissionais`/`usuarios`) — o link do V2 leva até a view `usuarios`, o usuário escolhe a sub-aba manualmente. Se isso incomodar no uso real, vira onda própria depois.
- Sincronizar o hash de volta quando o usuário navega manualmente dentro do legado (ex.: clicar em "Serviços" no menu do `/admin` não muda a URL) — mudança maior, não pedida, não necessária pro objetivo desta leva (V2 apontar pro lugar certo).
- "Unidades" como card de Cadastros — citado no roadmap resumido do `PLAN-0022`, mas não existe `data-view` correspondente no legado hoje (unidades são geridas via seed/migration, não tela). Não fabricado um link falso; se o usuário quiser essa tela, é escopo novo.
- RETROFIT-022 (migração/aposentadoria do Admin legado) — confirmado fora no gate socrático.
- Qualquer reescrita visual das telas legadas — a regra #5 da `DECISION-013` é explícita: sem reescrita estética nesta fase.

---

## Checklist de execução

**Legado (deep-link):**
- [x] `apps/web/src/modules/admin-shell/behavior.ts` — lê `location.hash` no load de `initAdminShellBehavior`, valida contra os `data-view` reais do DOM (whitelist via `viewPanels`, nunca confia em hash arbitrário), chama `setActiveView` com o valor válido; hash vazio/inválido mantém o padrão (`dashboard`, já hardcoded no JSX).

**Admin V2 (frontend):**
- [x] `apps/web/src/admin-v2/shell/HubCard.tsx` (novo) — componente compartilhado dos 2 hubs: link real (`<Link>`) quando `href` existe, card desabilitado com motivo quando não (nunca link morto).
- [x] `apps/web/src/admin-v2/cadastros/CadastrosHubView.tsx` (novo) — grid de cards, 6 links reais conforme mapeamento acima.
- [x] `apps/web/src/admin-v2/sistema/SistemaHubView.tsx` (novo) — grid de cards, 6 links reais + 2 desabilitados ("em breve") conforme mapeamento acima.
- [x] `apps/web/src/admin-v2/AdminV2Root.tsx` — novas rotas `<Route path="cadastros" element={<CadastrosHubView />} />` e `<Route path="sistema" element={<SistemaHubView />} />`, `activeKey`/breadcrumb (`Panorama > Cadastros` / `Panorama > Sistema`, mesmo padrão das áreas existentes).
- [x] `apps/web/src/admin-v2/shell/AdminSidebar.tsx` — `cadastros`/`sistema` viraram `available: true` com `path: "/admin-v2/cadastros"` / `"/admin-v2/sistema"`; comentário de topo do arquivo atualizado (não fala mais de "em breve" para esses 2 mundos).

**Validações executadas (todas reais):**
- [x] `npx tsc -b --noEmit` (web) PASS.
- [x] `npm run build` (web) PASS (warning de chunk size pré-existente, não é regressão).
- [x] `npm run lint` (web) — os mesmos 17 erros pré-existentes/tolerados (nenhum nos arquivos novos/tocados desta leva).
- [x] `docker compose build web` + `docker compose up -d --force-recreate web nginx` (cascata recriou `api` também, esperado pelo grafo de dependências) — todos os 4 serviços saudáveis.
- [x] **Validação visual real** (Playwright headless, extensão `claude-in-chrome` indisponível nesta máquina — mesmo método do fechamento do `PLAN-0023`): login real, **30 checks automatizados** — ver `## Validação real (2026-08-15)` abaixo.
- [x] Clique manual no menu do Admin legado continua funcionando normalmente (regressão do comportamento existente, sem hash) — confirmado via `dispatchEvent` (o clique real do Playwright esbarrou numa peculiaridade pré-existente do CSS do sidebar legado — expande só no hover —, não um bug desta leva).

---

## Validação real (2026-08-15)

Playwright headless contra o Docker local, login real (usuário MASTER via UI). **30 checks automatizados, 29 confirmados diretamente + 1 confirmado por método alternativo** (ver nota abaixo):

- Sidebar do Admin V2: `Cadastros` e `Sistema` viraram botões clicáveis reais (não mais `div` desabilitada).
- `/admin-v2/cadastros`: os 6 cards (Produtos/Serviços/Planos/Cupons/Entrega/Pessoas) presentes; cada um clicado e confirmado — abre `/admin#<view>` com o painel certo visível e o dashboard padrão escondido (não caiu mais sempre no dashboard).
- `/admin-v2/sistema`: os 6 cards ativos (Branding/Textos/Seções/Galeria/WhatsApp/Testes) presentes e validados igual acima; `Segurança` e `Infra` confirmados desabilitados com o motivo certo (nunca link morto).
- Regressão: clique manual no menu do Admin legado (sem hash) continua funcionando — o clique real do Playwright esbarrou numa peculiaridade pré-existente do CSS do sidebar legado (`.admin-sidebar:hover .sidebar-text` — rótulos só aparecem no hover, então o Playwright considerou o botão "not visible" mesmo estando funcionalmente clicável); confirmado via `dispatchEvent("click")` (bypassa a checagem de visibilidade do Playwright, não o comportamento real da página) que o clique manual continua ativando a view certa, sem hash na URL — comportamento idêntico ao de antes desta leva.

Screenshots salvos em `/tmp/.../scratchpad/consolidacao-01-cadastros-hub.png` e `consolidacao-02-sistema-hub.png` (sessão local, não versionados). Scripts de validação temporários removidos do working tree ao final.

---

## Git Record of Delivery

- Step 1 (Pre-commit review): feito — arquivos e validações listados acima.
- Step 2 (Commit authorization): usuário aprovou explicitamente ("commit separado por leva").
- Step 3 (Commit confirmation): commitado em 3 commits separados, branch `feature/admin-v2`:
  `260ce97` (fix typecheck scoring.test.ts), `f0c165e` (docs: fechamento Ondas 6-7 do
  PLAN-0023), `d52c49d` (feat: PLAN-0024 Consolidação — este plano).
- Step 4 (Push authorization and result): usuário autorizou explicitamente ("pode fazer o push"),
  em pedido separado da autorização de commit. `git push origin feature/admin-v2` →
  `be5dcc2..c7ed771`, mesmo PR #1.
- Push status: COMPLETED
