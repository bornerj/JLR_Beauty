# PLAN-0033 — Aposentar o Admin Legado (só sobra o Admin V2)

**Status:** 🟡 PLANNING — aguardando aprovação do usuário
**Data:** 2026-08-20
**Escopo macro:** `apps/web` (remoção de 24 módulos legados + rota + 2 arquivos de página, port do widget de status, fix do botão "← Admin", reescrita/remoção de 2 specs E2E acoplados ao DOM legado). **Zero mudança em `apps/api`** (backend confirmado 100% compartilhado, sem rota exclusiva do legado).
**Decisão que autoriza:** `DECISION-017` (supera `DECISION-013` regras #1 e #3).
**Agentes de apoio:** `@project-planner` (brainstorm já feito, ver `DECISION-017`), `@frontend-specialist` (port do widget + fix do topbar), `@qa-automation-engineer` (reescrita dos 2 specs E2E).

---

## STAR

**Situation**
O Admin V2 (`PLAN-0022` a `0031`) cobre nativamente 12 das 15 telas do menu do Admin legado. As 3 sem equivalente (Metas, Performance, Assinantes) nunca tiveram implementação real — zero API, zero model no schema (`PLAN-0032` ocorrência #6). RAG confirmou: zero import de código legado dentro do Admin V2, backend 100% compartilhado, só 1 ponto de acoplamento vivo (botão "← Admin") e 1 perda funcional real (widget de status de infra). O usuário decidiu aposentar o legado, com brainstorm de abordagem feito antes (3 opções, ver `DECISION-017` contexto) — escolheu a Opção A (remoção física direta, com branch de arquivo como rede de segurança), mais 2 ajustes (botão "← Voltar" pra SPA pública; widget de status portado como ícone pequeno).

**Task**
Remover fisicamente da base local tudo que é exclusivo do Admin legado (24 módulos, 1 rota, 2 arquivos de página), preservando o código integralmente numa branch de arquivo (local **e remota**, não só local), sem quebrar nenhuma funcionalidade real do Admin V2 nem deixar teste E2E órfão apontando pra uma rota que não existe mais.

**Action** — ondas abaixo.
**Result esperado** — base local ~80 arquivos mais enxuta, Docker buildando só o Admin V2, `archive/admin-legado` como rede de segurança completa no GitHub, nenhuma regressão no Admin V2.

---

## Inventário completo (RAG desta sessão)

### Removido — 24 módulos (`apps/web/src/modules/admin-*`), ~80 arquivos
`admin-branding` (3), `admin-checkout-delivery` (3), `admin-core` (2), `admin-dashboard` (3), `admin-discount-coupons` (3), `admin-goals` (3), `admin-kpis` (12), `admin-leads` (2 — já órfão do menu legado), `admin-media-gallery` (3), `admin-orders` (2), `admin-page-texts` (4), `admin-people` (4), `admin-performance` (3), `admin-plans` (3), `admin-products` (4), `admin-sales` (3), `admin-schedule` (4), `admin-section-toggles` (3), `admin-services` (4), `admin-shell` (2), `admin-subscribers` (4), `admin-tests` (4), `admin-whatsapp-contacts` (4).

### Removido — arquivos avulsos
- `apps/web/src/pages/Admin.tsx` (wrapper que monta `AdminContent` + as 23 "Islands")
- `apps/web/src/components/pages/AdminContent.tsx` (709 linhas, shell/menu do legado)

### Removido — rota
- `apps/web/src/app/App.tsx`: `<Route path="admin" .../>` e `<Route path="admin.html" .../>` (redirect). `/admin` passa a 404 direto (sem redirect permanente pro V2 — decisão explícita, Opção A).

### Portado, não removido
- `apps/web/src/modules/admin-docker-status/` (`DockerStatusModal.tsx`, `useDockerHealth.ts`) → realocado pra dentro de `apps/web/src/admin-v2/shell/`. Vira um botão pequeno (círculo com ícone `info` do Material Symbols) no canto direito do `AdminTopbar.tsx`, reusando a lógica de polling/estado já existente — só a UI de entrada muda (era uma barra com texto, vira ícone).

### Ajustado
- `apps/web/src/admin-v2/shell/AdminTopbar.tsx`: botão "← Admin" (`to="/admin"`) vira "← Voltar" (`to="/"`, SPA pública).
- `apps/web/e2e/flows.spec.ts`: bloco `test.describe("Admin flows", ...)` (linhas 142-566, 1 teste grande) — 100% acoplado a seletores do DOM legado (`.admin-sidebar`, `[data-view-trigger]`, `[data-run-tests]` etc.). Decidir na execução: reescrever contra o Admin V2 nativo, ou remover se a cobertura já existe em outro teste/onda anterior (várias ondas do Admin V2 já tiveram validação E2E real registrada no `MODIFICATION_LOG`).
- `apps/web/e2e/membership-grid.spec.ts`: `page.goto("/admin")` + `[data-view-trigger="planos"]` → reescrever pra `/admin-v2/cadastros/planos` (tela nativa já existe, `PLAN-0026`).

### Confirmado sem mudança
- `apps/api/**` inteiro — nenhuma rota exclusiva do legado encontrada; `routes/admin.ts`, `routes/subscriptions.ts` etc. são consumidos por Admin V2 também (`DECISION-014` regra #2).
- Todos os hubs/telas nativas do Admin V2 — zero import de `modules/admin-*` confirmado via grep.

---

## Onda 0 — Rede de segurança (antes de tocar em qualquer arquivo) ✅ CONCLUÍDA
- [x] `git status` limpo — commit `14d5531` (`DECISION-017`+`PLAN-0033`), pushado antes de prosseguir.
- [x] `git fetch` + confirmar `origin/main` == `HEAD` local — ambos em `14d5531`, sincronizado.
- [x] Criar branch `archive/admin-legado` a partir do `HEAD` atual (`14d5531`, ainda com tudo).
- [x] **Push da branch pro GitHub** — `git push origin archive/admin-legado` → `* [new branch] archive/admin-legado -> archive/admin-legado`.
- [x] Confirmado remotamente: `git ls-remote origin archive/admin-legado` → `14d5531` (idêntico ao local); `git ls-tree` na branch confirma `AdminContent.tsx`/`admin-goals`/etc. presentes.

## Onda 1 — Portar o widget de status de infra ✅ CONCLUÍDA
- [x] `useDockerHealth.ts` realocado pra `apps/web/src/admin-v2/shared/` (lógica idêntica, só endereço).
- [x] Componente novo `DockerStatusButton.tsx` (`admin-v2/shell/`): círculo com ícone `info`, borda vermelha (`state-critical`) se algum serviço offline, popover ao clicar com as 4 linhas (Nginx/API/Web/PostgreSQL) usando os tokens `state-healthy`/`state-critical`/`state-attention` (mesmo padrão de `admin-v2/shared/health.ts`) — sem depender do CSS do legado (`legacy.css` fica intocado, é usado também pelo menu público).
- [x] Inserido no `AdminTopbar.tsx`, canto direito, depois dos presets de período.
- [x] Validado ao vivo: popover abre mostrando os 4 serviços "Online" (confirma `docker ps` real); ícone renderiza certo.

## Onda 2 — Fix do botão "← Admin" ✅ CONCLUÍDA
- [x] `AdminTopbar.tsx`: texto "← Voltar", `to="/"`.
- [x] Validado ao vivo via JS (`href="/"`, texto "← Voltar" confirmados no DOM real).

## Onda 3 — Reescrever/retirar os 2 specs E2E acoplados ao legado ✅ CONCLUÍDA
- [x] `membership-grid.spec.ts`: reescrito contra `/admin-v2/cadastros/planos` (locators por role/texto, sem `data-*` do legado). Rodado ao vivo contra o Docker real: **PASS**.
- [x] `flows.spec.ts` bloco "Admin flows": criação de usuário/serviço/produto virou API direta (a verificação já era feita via API de qualquer forma); ajuste de estoque passou a usar o endpoint real do ledger (`stock/adjust`, não `PATCH /products/:id` — esse campo nunca existiu no schema). Bloco final de verificação por UI reescrito pras 3 telas nativas com equivalente real (Testes, Usuários, Lista de Pedidos); 2 sem equivalente (Assinantes, grid de agendamentos) removidas e documentadas inline (comentário no teste), não substituídas.
- [x] **Achados em cascata durante a execução real da suíte** (todos pré-existentes, nenhum causado pela reescrita — o teste não rodava há tempo): `POST /orders` sem `unitId` obrigatório (S2, `PLAN-0020`); 6 enums em inglês que deveriam ser PT-BR (`APROVADO`/`PENDENTE`/`ATIVA`/`CONFIRMADO`/`PAGO`/`CANCELADO`); `POST /appointments` exige profissional já vinculado ao serviço (`ProfessionalService`) **e** turno (`ProfessionalShift`) cobrindo o horário exato — o teste usava `new Date()` sem alinhar a nada disso. Todos corrigidos (autorização explícita do usuário pra investigar o bug de agendamento).
- [x] Suíte rodada de verdade contra o Docker ao vivo (`DATABASE_URL` apontando pro IP do container Postgres, já que não há porta publicada pro host — achado de ambiente, não de código): `membership-grid.spec.ts` PASS, `flows.spec.ts` "Admin flows" PASS, `flows.spec.ts` "franquias form" PASS. 1 falha remanescente **fora de escopo**, não tocada: "home cart and checkout flow" (carrinho do site público) — área não relacionada ao Admin legado nem ao bug de agendamento autorizado; registrada como achado separado, não corrigida aqui.

## Onda 4 — Remoção física ✅ CONCLUÍDA
- [x] Rota `/admin` e o redirect `admin.html` removidos de `App.tsx`.
- [x] `apps/web/src/pages/Admin.tsx` removido.
- [x] `apps/web/src/components/pages/AdminContent.tsx` removido.
- [x] Os 24 módulos legados removidos de `apps/web/src/modules/admin-*` — incluindo `admin-docker-status` (já 100% superado pela Onda 1, zero import restante confirmado via grep antes de apagar).
- [x] `tsc -b` (web) — **compilação limpa, zero import quebrado**, confirma o RAG original (Admin V2 nunca dependeu de nada do legado). Checagem extra: `grep` em `apps/web/src` e na infra (`nginx/`, `docker-compose.yml`, `Dockerfile`) não achou nenhuma referência viva restante (só 4 comentários históricos, documentação, sem efeito funcional).

## Onda 5 — Validação final ✅ CONCLUÍDA (com 2 achados fora de escopo documentados)
- [x] `npm run build` (web) — **901 KB** (era 1.435 KB antes da Onda 4 — **−534 KB, ~37% menor**; gzip 295→205 KB, ~30% menor); 301→215 módulos transformados.
- [x] Rebuild Docker (`web`) + `up -d --force-recreate` (2 rodadas — 1ª após a remoção física, 2ª após o achado extra abaixo).
- [x] Validação visual real via browser: Panorama, Operação (Kanban completo), Rede, Clientes, Crescimento (Pipeline), Cadastros (hub + Produtos), Sistema navegados — tudo renderizando normal. Botão "← Voltar" e ícone de status conferidos. `http://localhost/admin` → página em branco, `root` do React vazio (React Router sem rota correspondente); `HTTP 200` (comportamento normal de SPA — nginx serve o `index.html` pra qualquer rota, quem decide o que renderizar é o React Router do lado do cliente; não é um 404 de servidor, mas o efeito é o mesmo: nada do legado aparece).
- [x] **Achado extra corrigido**: o card "Infra" do hub de Sistema ainda dizia "hoje só como modal flutuante no Admin" (legado, agora inexistente) — desatualizado desde a Onda 1. Removido da lista de desabilitados (`SistemaHubView.tsx`) já que a função existe agora no próprio topbar do Admin V2.
- [x] `apps/api` `tsc -b` + `npm run test` — **167/167 PASS**, backend intocado, confirmado.
- [x] **Achado operacional**: dados de teste do `PLAN-0032`/`0033` (produtos "Produto E2E...", 2 pedidos vinculados) ficaram órfãos no banco real — `DELETE /products/:id` falha pra produto com histórico de estoque (`ERR-0053`, bug pré-existente conhecido, fora de escopo) e o `cleanup` do teste ignora esse erro silenciosamente. Limpo via SQL direto (2 rodadas, confirmado banco de volta a 9/9 produtos reais).
- [x] `npx playwright test` (suíte completa) — as 2 telas alvo da Onda 3 (`flows.spec.ts` "Admin flows", `membership-grid.spec.ts`) **PASS**. Achou uma 3ª falha (`order-dashboard-lifecycle.spec.ts`, mesma classe do `ERR-0072`, arquivo nunca tocado) — usuário autorizou corrigir também: `ERR-0073` registrado, corrigido (`unitId`, `initialStock`+`initialStockUnitId`, `markAsPaid: false`), **PASS** confirmado. **Suíte final: 4/5 verde.** 1 falha remanescente, pré-existente e genuinamente fora de escopo (não corrigida): `flows.spec.ts` "home cart and checkout flow" (carrinho do site público, nada a ver com Admin/pedidos/agendamento). Dados de teste (produtos com histórico de estoque, `ERR-0053` bloqueia `DELETE` via API) limpos do banco real via SQL direto após cada rodada de validação.

## Onda 6 — Memória e fechamento
- [ ] `DEBUG-HISTORY.md`: sem entrada nova esperada (não é bug fix) — só se algo quebrar na validação.
- [ ] `progress.md`: módulo "Admin legado" marcado `deprecated`/removido; nota de tamanho de bundle antes/depois.
- [ ] `MODIFICATION_LOG.md`: registro da execução completa.
- [ ] Git Record of Delivery preenchido; plano renomeado `-DONE-` só depois de commit **e** push confirmados.

---

## Riscos
- Teste E2E "Admin flows" pode cobrir alguma verificação de regra de negócio que nunca foi replicada nativamente (ex.: algum side-effect de criação de usuário) — mitigado pela Onda 3 rodar a suíte inteira antes de prosseguir pra remoção física, não depois.
- Se algo do Admin V2 depender de um import legado que o grep desta sessão não pegou (ex.: import dinâmico/lazy) — mitigado pelo `tsc -b` na Onda 4 (falha de compilação pega qualquer import quebrado) antes de partir pro build/Docker.
- Branch de arquivo desatualizada se algo mudar entre a Onda 0 e a Onda 4 — mitigado por criar a branch bem no início e não fazer nenhum outro commit não relacionado no meio do plano.

## Critérios de Aceitação
- [ ] `archive/admin-legado` existe local e remotamente, com o código completo do legado.
- [ ] `/admin` retorna 404; nenhuma rota, módulo ou import do legado sobra em `apps/web/src`.
- [ ] Widget de status de infra funcional dentro do Admin V2 (ícone pequeno, canto direito do topbar).
- [ ] Botão "← Voltar" leva pra SPA pública.
- [ ] `tsc -b`/build/testes (api+web) + suíte E2E limpos.
- [ ] Bundle do `web` menor que antes (medido).
- [ ] Nenhuma regressão visual/funcional no Admin V2 (validado ao vivo).

## Git Record of Delivery
- **Step 1 (Pre-commit review):** _preenchido no fechamento_
- **Step 2 (Commit authorization):** _pendente_
- **Step 3 (Commit confirmation):** _pendente_
- **Step 4 (Push authorization e resultado):** _pendente_
- **Push status:** PENDING
