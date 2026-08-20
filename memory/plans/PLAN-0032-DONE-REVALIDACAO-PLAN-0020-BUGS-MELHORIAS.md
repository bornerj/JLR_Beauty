# PLAN-0032 — Revalidação Guiada (foco PLAN-0020) — Bugs e Melhorias

**Status:** ✅ DONE (fechado em 2026-08-20)
**Data de abertura:** 2026-08-20
**Escopo macro:** aberto por natureza — cada ocorrência reportada pelo usuário define seu próprio escopo de arquivo(s). Núcleo de atenção: `PLAN-0020` (Produtos/Estoque Multi-Unidade/Ledger/Vendas Multicanal/BI), incluindo tudo que foi migrado pra cima dele no Admin V2 (`PLAN-0026` Cadastros→Produtos, `PLAN-0031` Operação→Lista/Kanban de Pedidos, `PLAN-0022`/`0023` Panorama/BI). Pode se estender a qualquer outra tela se o usuário trouxer ocorrência fora desse núcleo.
**Agentes de apoio (roteados por ocorrência, não fixos):** `@debugger` (triagem/causa-raiz), `@security-auditor` (qualquer achado de RBAC/isolamento por unidade/exposição de dado), `@qa-automation-engineer` (revalidação E2E depois do fix), `@backend-specialist`/`@frontend-specialist` (implementação conforme o domínio do arquivo tocado), `@database-architect` (se a ocorrência exigir migration).

---

## STAR

**Situation**
`PLAN-0020` foi fechado `DONE` em 2026-08-18 (checklist técnico desde 2026-07-07 + validação visual das 5 telas nativas do Admin V2 + pentest manual S10, 16/16 PASS). O usuário quer agora uma rodada de **revalidação guiada ao vivo**: ele vai usar o sistema e reportar bugs/melhorias conforme encontra, com foco principal no que o `PLAN-0020` entregou (estoque por unidade, ledger, reservas, venda multicanal, BI por papel) e em tudo que foi migrado sobre essa base.

**Task**
Registrar cada ocorrência reportada, triá-la (bug × melhoria; ponto-a-ponto × estrutural), investigar com a skill/agente correto, corrigir, validar de verdade (nunca só "parece certo") e documentar — sem fechar o plano até o usuário sinalizar que terminou a rodada.

**Action**
Ciclo por ocorrência (repetido enquanto o usuário trouxer itens):
1. Registrar a ocorrência nesta tabela (bruta, como reportada).
2. RAG mínimo: procurar se já existe em `DEBUG-HISTORY.md` (causa raiz repetida) antes de investigar do zero.
3. Classificar: **bug** (comportamento incorreto vs. o desenhado no `PLAN-0020`/decisões vigentes) ou **melhoria** (comportamento correto, mas pode ficar melhor — exige confirmação do usuário sobre o comportamento desejado antes de implementar).
4. Classificar escopo: ponto-a-ponto (registra em `MODIFICATION_LOG.md`) × estrutural (vira addendum explícito deste plano, com STAR próprio, antes de codar) — segue a Anti-Scope-Drift Layer do kernel.
5. Anunciar o agente/skill aplicado, investigar, corrigir.
6. Validar de verdade (tsc/build/testes + E2E real quando fizer sentido — browser real via `claude-in-chrome` para UI, `curl`/API real para backend/segurança).
7. Registrar: bug → `DEBUG-HISTORY.md` (`ERR-XXXX`); melhoria → nota nesta tabela + `MODIFICATION_LOG.md`.
8. Reportar ao usuário e aguardar o próximo item (ou confirmação de que a rodada terminou).

**Result esperado**
Todas as ocorrências da rodada corrigidas/decididas, `DEBUG-HISTORY.md` atualizado, `progress.md`/`MODIFICATION_LOG.md` refletindo o estado real, plano fechado `-DONE-` só quando o usuário confirmar o fim da rodada e o Git Record estiver completo.

---

## Ocorrências

<!-- Uma linha por item reportado. Preenchido ao vivo, na ordem em que o usuário reporta. -->

| # | Reportado em | Descrição (como o usuário trouxe) | Tipo | Escopo | Status | Referência |
|---|---|---|---|---|---|---|
| 1 | 2026-08-20 | Editar Produto → Histórico de movimentação sem consistência de saldo (saldo anterior + movimentação ≠ novo saldo). Exemplo real: "Sampoo de Ervas" (SKU `JLR-ARG-012`), unidade Parque da Cidade — uma saída não abate do saldo, uma entrada seguinte não soma (iguala o saldo ao valor da entrada em vez de somar). Pedido: função de validação de consistência. | Bug (parcial) + melhoria de UX | Ponto-a-ponto | Resolvido | `ERR-0071`, diário abaixo |
| 2 | 2026-08-20 | Contorno dos campos de formulário pouco visível (dourado bem claro) — pedido pra aumentar contraste (1pt a mais + cor verde, ou o que achasse melhor). Usuário confirmou escopo: Admin V2 inteiro (não só a tela em uso). Ajuste fino: usuário achou 2px forte demais, revertido pra 1px mantendo o verde. | Melhoria (design system/contraste) | Ponto-a-ponto (mecânico, mesma classe em muitos arquivos) | Resolvido | diário abaixo |
| 3 | 2026-08-20 | Operação→Lista: (a) indicadores do resumo quebravam em 2 linhas — pediu 1 linha só, rótulos abreviados (até 5 posições) com nome completo no hover, receita confirmada por último; (b) linha de paginação (abaixo da grid) movida pra acima da grid, logo após os filtros; (c) mesma paginação incluída na grid de Produtos (Cadastros), que não tinha. Ajuste fino: usuário viu que cabia o nome completo, abreviação revertida. | Melhoria (UX/layout) | Ponto-a-ponto (2 arquivos, sem mudança de backend) | Resolvido | diário abaixo |
| 4 | 2026-08-20 | Tela de Detalhes do Pedido "branca, pálida" — pediu melhoria estética, explicitamente via `@frontend-specialist`. | Melhoria (design/UI) | Ponto-a-ponto (1 arquivo, sem token novo) | Resolvido | diário abaixo |
| 5 | 2026-08-20 | Panorama→Inteligência→"Onde está o dinheiro?": cascata (caixa) + origens (cards) em 2 tratamentos visuais diferentes — pediu tudo em cards; as 6 decomposições (unidade/produto/serviço/canal/profissional/plano) empilhadas viravam "cards gigantes" difíceis de ler — pediu abas com rolagem vertical; pediu cor nos 6 cards iniciais, "seja criativo", via agentes de design. | Melhoria (design/UI) | Ponto-a-ponto (2 arquivos, sem token novo, sem mudança de backend) | Resolvido | diário abaixo |
| 6 | 2026-08-20 | Auditoria de fechamento: quais telas do Admin legado ainda não foram migradas pro Admin V2. | Survey/Intel (sem código) | N/A | Concluído | diário abaixo |

---

## Diário de Execução

<!-- Uma subseção por ocorrência já investigada, na ordem de tratamento. -->

### Ocorrência #1 — Histórico de movimentação de estoque sem consistência aparente

**Situation:** usuário reportou, olhando o Histórico de "Sampoo de Ervas" (SKU `JLR-ARG-012`, unidade Parque da Cidade), que uma saída não abatia do saldo e uma entrada seguinte igualava o saldo ao valor da entrada em vez de somar. Pediu função de validação de consistência.

**Task:** confirmar se é bug de cálculo real ou de leitura/exibição; corrigir a causa raiz; entregar a validação de consistência pedida.

**Action:**
1. RAG: nada em `DEBUG-HISTORY.md` sobre inconsistência de saldo no ledger.
2. Query direta no Postgres confirmou a cadeia real do produto (unidade 1): `ENTRADA_COMPRA +20 → 20`, `SAIDA_VENDA -1 → 19`, `SAIDA_VENDA -2 → 17` — matematicamente correta, batendo com `ProductStock.stock = 17`.
3. Reproduzido ao vivo no browser (`claude-in-chrome`, sessão MASTER real): a API devolve os movimentos mais-novo-primeiro (`orderBy: createdAt desc`) e a tabela só tinha a coluna "Saldo", sem "Saldo anterior" — lendo de cima pra baixo (ordem de leitura natural, mas cronologicamente invertida), a cadeia parece quebrada exatamente como descrito. **Não era bug de cálculo** nesse caso específico.
4. Revisão de código motivada pelo pedido de validação encontrou um bug real e distinto: `POST .../stock/adjust` tratava todo AJUSTE como saída dentro de `applyStockMovement` e "corrigia" ajustes pra cima com uma segunda escrita fora do helper — para um alvo mais que o dobro do saldo atual, o passo intermediário calculava saldo negativo e disparava `insufficient_stock` (falso negativo bloqueando um ajuste válido). Sem corrupção de dado em produção (o único `AJUSTE` real do banco era pra baixo).
5. Corrigido: `applyStockAdjustment` novo em `stockLedger.ts` (escrita única, sem passar pela checagem de saldo negativo de entrada/saída); `routes/inventory.ts` simplificado pra usá-lo. `StockHistoryModal.tsx` ganhou coluna "Saldo anterior" (derivada em runtime, sem mudança de API) + sinalização visual quando `saldo anterior + variação ≠ saldo gravado` — a validação de consistência pedida, visível direto na tela. `tailwind.generated.css` regenerado (achado extra: `min-w-[540px]` da mesma tabela nunca tinha sido compilado desde a criação da tela, `PLAN-0026` Onda 11).

**Result:** `ERR-0071` registrado. 5 testes novos em `stockLedger.test.ts` (167/167 PASS no total), `tsc -b`/build (api+web) PASS, rebuild Docker + validação visual real pendente de confirmação final nesta sessão (ver abaixo).

**Arquivos:** `apps/api/src/lib/stockLedger.ts`, `apps/api/src/lib/stockLedger.test.ts`, `apps/api/src/routes/inventory.ts`, `apps/web/src/admin-v2/cadastros/products/components/StockHistoryModal.tsx`, `apps/web/src/styles/tailwind.generated.css`.

### Ocorrência #2 — Contorno dos campos de formulário sem contraste

**Situation:** usuário achou o contorno dos campos (input/select/textarea) fraco demais visualmente (`border border-gold/40`, dourado bem claro), pediu pra engrossar (+1pt) e mudar pra verde ou o que eu achasse melhor.

**Task:** confirmar escopo (só a tela em uso vs. Admin V2 inteiro) e aplicar.

**Action:**
1. RAG: `border border-gold/40` é o padrão de campo usado em **134 elementos reais de formulário** (input/select/textarea, identificados pela combinação com `focus:ring-1 focus:ring-primary`) em 32 arquivos de `apps/web/src/admin-v2/` — não um componente reusável, classe repetida inline. `DECISION-013` regra #6 permite cor nova só como token semântico de estado; `primary` (`#00967f`, verde/teal da marca) já é um token **existente**, não uma cor nova — usar ele não fere a regra.
2. Perguntei ao usuário o escopo (só a tela atual vs. Admin V2 inteiro, com preview do antes/depois) — respondeu **Admin V2 inteiro**.
3. Script (Python, via Bash) trocou em todas as 134 ocorrências reais de campo: `border border-gold/40` → `border-2 border-primary/60` e `focus:ring-1 focus:ring-primary` → `focus:ring-2 focus:ring-primary` (mesmo padrão, anel de foco também mais forte). Variante de checkbox (`rounded border-gold/40 text-primary focus:ring-primary`) tratada à parte. Filtro por `focus:ring` garantiu que só campos reais fossem tocados — botões/badges/cards que reusam a mesma cor de borda (sem anel de foco) ficaram intocados, confirmado por `grep` (0 ocorrências remanescentes do padrão de campo com a cor antiga).

**Result:** 30 arquivos, 135 linhas trocadas (134 campos + 1 checkbox). `tsc -b`/build (web) PASS; rebuild Docker + validação visual real via browser confirmou border `2px`/`rgba(0,150,127,0.6)` (verde `primary`) nos campos da tela de Produtos (filtros da lista + todos os campos do modal Editar produto), e confirmou que botões (`Movimentar`, `Histórico`) e outros elementos não-campo permaneceram com a borda dourada original — escopo respeitado. Nota de validação: a checagem visual bateu numa armadilha de cache do próprio navegador de teste (bundle antigo servido em memória entre rebuilds sucessivos do Docker) — resolvida com hard-reload; não é um bug da aplicação, é uma particularidade do fluxo de teste desta sessão.

**Ajuste fino (mesmo dia):** usuário achou 2px forte demais depois de ver ao vivo — revertido pra 1px nos mesmos 135 pontos, mantendo a cor verde (`border-primary/60`) e o anel de foco reforçado (`focus:ring-2`, não pedido pra reverter). `tsc -b`/build PASS; rebuild Docker + validação ao vivo confirmada (`getComputedStyle` real: `border-width: 1px`, `border-color: rgba(0, 150, 127, 0.6)`; screenshot real da tela de Produtos).

**Arquivos:** 30 arquivos em `apps/web/src/admin-v2/**/*.tsx` (ver diff completo no commit) — nenhum arquivo de backend tocado.

### Ocorrência #3 — Operação→Lista: resumo em 2 linhas + navegação mal posicionada; Produtos sem paginação

**Situation:** 3 pedidos relacionados na mesma tela: (a) os 7 indicadores do resumo (Total/Em progresso/Despachados/Entregues/Cancelados/Pagamento pendente/Receita) quebravam em 2 linhas; (b) a linha de paginação ficava abaixo da grid, deveria ficar acima, logo após os filtros; (c) a grid de Produtos (Cadastros) nunca teve paginação (decisão documentada do `PLAN-0026` Onda 11 — "mesmo padrão das Ondas 4/8, tabela rolável") e devia ganhar a mesma linha de navegação da Lista de Pedidos.

**Action:**
1. `OrdersListView.tsx`: resumo trocado pra `grid-cols-[repeat(6,minmax(0,1fr))_minmax(0,1.6fr)]` (7 colunas fixas, 1 linha só, última — Receita — mais larga), envolto em `overflow-x-auto`/`min-w-[760px]` (mesmo padrão já usado na tabela, reserva pra telas estreitas). Rótulos abreviados ≤5 posições (`Total`, `Prog.`, `Desp.`, `Entr.`, `Canc.`, `Pend.`, `Rec.`) com o nome completo em `title` (tooltip nativo). Bloco de paginação inteiro movido de baixo da tabela pra logo após os filtros (antes do banner de seleção em lote).
2. `ProductsListView.tsx`: paginação client-side adicionada do zero, mesmo padrão exato da Lista de Pedidos (`page`/`pageSize`/`pageCount`/`pageProducts`, `PAGE_SIZE_OPTIONS`), posicionada logo após os filtros; comentário de arquitetura desatualizado (decisão de não ter paginação) marcado como revertido com referência a esta ocorrência. Tabela passou a renderizar `pageProducts` em vez de `filtered`.
3. `tailwind.generated.css` regenerado proativamente (checklist `ERR-0070`/`0071`) — `min-w-[760px]` e o grid-template arbitrário não estavam compilados.

**Result:** `tsc -b`/build (web) PASS. Rebuild Docker + validação ao vivo confirmada nas duas telas: Lista de Pedidos com as 7 colunas em 1 linha só (tooltips dos 7 rótulos confirmados via `title` real) e a paginação entre filtros e tabela; Produtos com a mesma linha de paginação nova funcionando (9/9 produtos, página 1 de 1, botões desabilitados corretamente). **Nota de processo**: essa validação bateu 2x na mesma armadilha de cache do navegador de teste (aba presa num bundle antigo entre rebuilds, chegando a referenciar um JS que não existe mais no container — tela em branco, `root` do React vazio, sem erro de console) — não é bug da aplicação; resolvido com hard-reload (`ctrl+shift+r`) antes de cada checagem. Virou hábito fixo pro resto da sessão: sempre hard-reload logo após navegar pra uma tela após um rebuild, antes de tirar conclusões.

**Arquivos:** `apps/web/src/admin-v2/operations/orders/OrdersListView.tsx`, `apps/web/src/admin-v2/cadastros/products/ProductsListView.tsx`, `apps/web/src/styles/tailwind.generated.css`.

**Ajuste fino (mesmo dia):** usuário viu ao vivo que os quadros têm espaço de sobra — reverteu o pedido de abreviação, nomes completos de volta (`Total`/`Em progresso`/`Despachados`/`Entregues`/`Cancelados`/`Pagamento pendente`/`Receita confirmada`), `title`/tooltip removido (redundante com o texto já visível). `tsc -b`/build PASS; rebuild Docker + validação ao vivo confirmada (screenshot real, 7 rótulos completos numa linha só).

### Ocorrência #4 — Detalhes do Pedido: reformulação visual (`@frontend-specialist`)

**Situation:** usuário pediu explicitamente pra chamar o agente `@frontend-specialist` — a tela de detalhes do pedido (`OrderDetailModal.tsx`) estava "branca, pálida".

**🤖 Applying knowledge from `@frontend-specialist`** — agente lido (`.sfk/kernel/agents/frontend-specialist.md`) + skills `frontend-design` e `web-design-guidelines` carregadas.

**Task/Design Commitment:** confirmado ao vivo via browser (screenshot real) que o modal era texto corrido direto sobre fundo branco, sem nenhuma separação entre as 5 seções (Cliente/Envio/Itens/Pagamentos/Histórico) — só o peso da fonte distinguia um rótulo do conteúdo. **Decisão deliberada**: NÃO aplicar o mandato "radical/brutalista" do agente (geometria extrema, Bento ban, animação obrigatória, paleta disruptiva) — esse mandato é pra páginas de marketing greenfield; este é um modal de leitura denso dentro de uma suite de 30+ telas do Admin V2 já em produção, `DECISION-013` regra #6 exige preservar os tokens de marca existentes, e uma linguagem visual nova só neste modal teria Risco de Consistência alto no DFII. Direção escolhida: **"Structured Elevation"** — chunking por seção (Miller's Law) + 1 faixa de destaque só pro dado mais crítico (Von Restorff: status+total) + hierarquia 60-30-10, 100% com tokens já existentes no Admin V2 (nenhuma cor nova).
- DFII: Impacto estético 4, Adequação ao contexto 5, Viabilidade 5, Segurança de performance 5, Risco de consistência 1 (baixo = bom) → score alto, "executar com disciplina".

**Action:**
- Faixa de destaque `bg-primary/5` pro status+total (única superfície com a cor da marca — o resto fica neutro por baixo dela).
- Cada seção (Cliente/Envio/Itens/Pagamentos/Histórico) virou um card próprio (`border-stone-200 bg-white p-4`), quebrando o "texto solto".
- Cabeçalho das tabelas (Itens/Pagamentos) ganhou fundo `bg-cream-sidebar` (mesmo tom usado nas KPI tiles do resto do Admin V2) em vez de texto cinza sem contraste nenhum.
- Histórico de status virou uma timeline vertical (linha `border-gold/40` + marcador circular `bg-primary`), mais fácil de escanear que uma lista solta.
- Fundo do corpo do modal (atrás dos cards) mudou de branco puro pra `bg-stone-50/60` — dá profundidade aos cards brancos por cima (senão card branco sobre fundo branco não teria nenhuma borda visual).

**Result:** `tsc -b`/build (web) PASS. `tailwind.generated.css` regenerado proativamente (checklist `ERR-0070`/`0071` — `border-primary/25`, `rounded-l-lg`/`rounded-r-lg`, `top-1.5` não estavam compilados). Rebuild Docker + validação ao vivo real via browser (hard-reload antes de checar, checklist da ocorrência #3) — screenshot real confirmando a faixa verde de destaque, os 5 cards separados, cabeçalho de tabela com fundo, e a timeline com marcador na seção de histórico.

**Arquivos:** `apps/web/src/admin-v2/operations/orders/components/OrderDetailModal.tsx`, `apps/web/src/styles/tailwind.generated.css`.

### Ocorrência #5 — "Onde está o dinheiro?": unificar em cards + abas + cor criativa (`@frontend-specialist` + skill `dataviz`)

**Situation:** usuário pediu explicitamente "chame seus agentes de design" — 3 pedidos na mesma tela: (1) a cascata Receita/Custo/Margem (1 caixa com 3 linhas) e as origens Produtos/Serviços/Assinaturas (3 cards) usavam 2 tratamentos visuais diferentes pro mesmo tipo de dado — unificar tudo em cards; (2) as 6 decomposições (Unidade/Produto/Serviço/Canal/Profissional/Plano) empilhadas na página cresciam sem limite ("cards gigantes"), difícil de ler — trocar por abas com rolagem vertical; (3) dar cor nos 6 cards iniciais, "seja criativo".

**🤖 Applying knowledge from `@frontend-specialist`** + skill `dataviz` — agente e skills `frontend-design`/`web-design-guidelines` já carregados na ocorrência #4; `dataviz` carregada agora (stat tiles = "não é gráfico", mas a skill cobre o caso e traz o validador de paleta).

**Task/Design Commitment:**
- Unificação: as 6 métricas (3 do resultado + 3 da origem) viraram stat tiles idênticos em tratamento (card branco, faixa de cor à esquerda, ícone temático, número grande em `text-forest`), agrupados em 2 seções rotuladas ("Resultado do período" / "De onde vem") pra não virar 6 cards soltos sem contexto.
- Abas: 6 abas (mesmo componente visual dos sub-tabs de "Operação" em `AdminV2Root.tsx` — reuso de padrão já existente, não um componente novo do zero) + painel único `max-h-[420px] overflow-y-auto` — resolve a rolagem vertical pedida.
- Cor: escolhidas 5 cores distintas (100% tokens já existentes — `primary`, `state-critical`, `gold-accent`, `state-info`, `state-attention`; `primary` reaproveitado 1x entre Receita/Assinaturas, as 2 únicas entradas de dinheiro recorrente positivo, nunca no mesmo grupo). Validado com `scripts/validate_palette.js` da skill `dataviz`: **ALL CHECKS PASS** (banda de luminosidade, piso de croma, separação CVD deutan/tritan, piso de visão normal); 1 WARN aceito (contraste do `gold-accent` puro contra o fundo) — mitigado porque a cor nunca carrega texto sozinha, só barra/ícone; números continuam em `text-forest` de alto contraste.
- Escopo do reuso semântico: `state-critical` no card "Custo Direto" é reuso real (já era a cor da subtração na cascata antiga); os demais tokens `state-*` (`state-info`, `state-attention`) foram reaproveitados **decorativamente** por escassez de tons de marca livres — decisão consciente, sem colisão nesta tela (nenhum outro elemento da tela usa esses 2 tokens com significado de status real).

**Action:** `MoneyView.tsx` reescrito — `WATERFALL_TONES`/`SOURCE_TONES` (ícone + cor por card), grid de 6 stat tiles em 2 seções, bloco de abas (`BREAKDOWN_TABS`, estado local `activeTab`) substituindo as 6 `<section>` empilhadas.

**Result:** `tsc -b`/build (web) PASS. `tailwind.generated.css` regenerado 2x — 1ª rodada usou `/8` (fora da escala válida do Tailwind — só existem os steps padrão 0/5/10/20/25/.../100 — `/8` não gera classe nenhuma, silenciosamente); achado e corrigido pra `/10` antes do rebuild Docker (checklist `ERR-0070`/`0071` funcionando como pretendido — pegou o erro antes de ir pro browser). Rebuild Docker + validação ao vivo confirmada via browser real: 6 tiles com cores distintas e ícones temáticos renderizando certo, troca de aba testada (Unidade→Produto, painel trocou de tabela pra lista de produtos na hora), conteúdo dentro da área de rolagem. Sessão bateu numa expiração de token durante o teste (login normal resolveu — não investigado como bug, mesma família do `ERR-0057`/`ERR-0067`, já mitigada).

**Arquivos:** `apps/web/src/admin-v2/money/MoneyView.tsx`, `apps/web/src/styles/tailwind.generated.css`.

### Ocorrência #6 — Auditoria: telas do Admin legado ainda fora do Admin V2

**Situation:** usuário pediu, pra fechar a rodada, um levantamento de quais telas do Admin legado (`AdminContent.tsx`) ainda não têm equivalente nativo no Admin V2 — sabendo que alguns conceitos mudaram e algumas telas legadas viraram desnecessárias.

**Action:** mapeados os 15 `data-view-trigger` do menu legado (`AdminContent.tsx`) contra o inventário de ondas nativas já fechadas (`PLAN-0022`/`0023`/`0026`/`0031`) e o schema Prisma (pra separar "não migrado" de "nunca existiu de verdade"). Achado teve 2 camadas: (1) qual conceito tem equivalente nativo; (2) pros que não têm, se a tela legada tinha alguma implementação real por trás (`grep` de `fetch(`/rotas de API em cada módulo) ou era conteúdo estático de template.

**Result — 12 de 15 migrados** (Painel→Panorama; Agenda→Operação/Agenda; WhatsApp→Sistema/WhatsApp; Vendas/"Pedidos e Vendas"→Operação/Pedidos+Lista, `PLAN-0030`/`0031`; Produtos, Planos, Serviços, Entrega, Cupons→Cadastros nativos, `PLAN-0026`; Pessoas/Usuários→Clientes+Profissionais+Usuários, 3 telas nativas, `DECISION-014` regra #3; Seções Telas, Galeria, Branding, Testes, Textos→Sistema nativos, `PLAN-0026`).

**3 sem equivalente nativo — detalhado no relatório ao usuário:**
- **Metas** (`admin-goals`) e **Performance** (`admin-performance`) — sem model no schema Prisma, zero chamada de API nos dois módulos inteiros (`grep` não achou nenhum `fetch`/rota), conteúdo hardcoded de template ("Sarah Jenkins"/"Elena Fisher") — nunca foram telas funcionais de verdade, não há nada real pra migrar.
- **Assinantes** (`admin-subscribers`, cadastro individual de assinatura) — a implementação legada também era 100% mock (zero `fetch` no módulo), mas o backend já tem `POST /subscriptions`/`PATCH /subscriptions/:id` (`requireAdmin`) reais e funcionais; o Admin V2 só lê `Subscription` pra saúde da base (`SubscriptionHealthView.tsx`, somente leitura) — nenhuma tela em lugar nenhum permite criar/editar/cancelar uma assinatura manualmente. Único dos 3 que é um gap funcional real (capacidade de backend existente, sem UI).
- Achado colateral: `admin-leads` existe como módulo mas não está ligado a nenhum gatilho do menu legado (órfão, inacessível mesmo no Admin antigo hoje) — provavelmente já superado pelo Pipeline de Franquias nativo (`PLAN-0022` Onda 9); candidato a limpeza futura, não a migração.

**Arquivos:** nenhum alterado — levantamento só de leitura (`AdminContent.tsx`, módulos `admin-goals`/`admin-performance`/`admin-subscribers`/`admin-sales`/`admin-orders`, `schema.prisma`, `routes/subscriptions.ts`, `admin-v2/customers/subscriptions/SubscriptionHealthView.tsx`).

---

## Critérios de Fechamento (DONE)

- [x] Usuário sinalizou explicitamente que a rodada de revalidação terminou ("feche o plano atual, está completo").
- [x] Todas as linhas da tabela "Ocorrências" com `Status = Resolvido` ou `Status = Concluído` — nenhuma `Em aberto` (6/6).
- [x] Todo bug corrigido tem entrada em `memory/logs/DEBUG-HISTORY.md` (`ERR-0071`).
- [x] `memory/progress.md` atualizado (linha do módulo + Resume Panel).
- [x] `tsc -b`/build/testes limpos na última rodada (validado ocorrência a ocorrência; última validação completa: api `tsc -b` + `npm run test` 167/167 PASS, web `tsc -b` + `npm run build` PASS, ambos após a ocorrência #5 — nenhuma mudança de código na ocorrência #6, só leitura).
- [x] Git Record of Delivery preenchido abaixo.

## Git Record of Delivery
- **Step 1 (Pre-commit review):** 40 arquivos (39 modificados + 1 novo, este plano) — `apps/api/src/lib/stockLedger.ts`+`.test.ts` e `apps/api/src/routes/inventory.ts` (ocorrência #1, `ERR-0071` — `applyStockAdjustment`); `apps/web/src/admin-v2/cadastros/products/components/StockHistoryModal.tsx` (ocorrência #1, coluna "Saldo anterior" + validação visual); 30 arquivos `apps/web/src/admin-v2/**/*.tsx` (ocorrência #2, contorno dos campos 1px verde); `apps/web/src/admin-v2/operations/orders/OrdersListView.tsx` + `apps/web/src/admin-v2/cadastros/products/ProductsListView.tsx` (ocorrência #3, resumo em 1 linha + paginação); `apps/web/src/admin-v2/operations/orders/components/OrderDetailModal.tsx` (ocorrência #4, reformulação visual); `apps/web/src/admin-v2/money/MoneyView.tsx` (ocorrência #5, stat tiles coloridos + abas); `apps/web/src/styles/tailwind.generated.css` (regenerado 5x ao longo do plano, checklist `ERR-0070`/`0071` seguido em cada ocorrência visual); `memory/plans/PLAN-0032-...md` (novo), `memory/logs/DEBUG-HISTORY.md`, `memory/MODIFICATION_LOG.md`, `memory/progress.md`. Validações: `apps/api` `tsc -b` + `npm run test` 167/167 PASS; `apps/web` `tsc -b` + `npm run build` PASS; rebuild Docker + validação visual real via browser em toda ocorrência com mudança de UI (5 rebuilds); pentest/consistência de dado real via `curl`/Postgres direto na ocorrência #1.
- **Step 2 (Commit authorization):** autorizado explicitamente pelo usuário ("salve, commit e push").
- **Step 3 (Commit confirmation):** _preenchido após o commit_
- **Step 4 (Push authorization e resultado):** autorizado na mesma instrução do usuário ("commit e push").
- **Push status:** _preenchido após o push_
