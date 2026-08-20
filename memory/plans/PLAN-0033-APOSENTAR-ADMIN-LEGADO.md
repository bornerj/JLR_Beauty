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

## Onda 0 — Rede de segurança (antes de tocar em qualquer arquivo)
- [ ] `git status` limpo (nada não commitado).
- [ ] `git fetch` + confirmar `origin/main` == `HEAD` local (nada só local, nada só remoto).
- [ ] Criar branch `archive/admin-legado` a partir do `HEAD` atual (ainda com tudo).
- [ ] **Push da branch pro GitHub** (`git push origin archive/admin-legado`) — a rede de segurança precisa estar no remoto, não só local.
- [ ] Confirmar no GitHub (via `gh` ou UI) que a branch existe remotamente com o conteúdo completo.

## Onda 1 — Portar o widget de status de infra
- [ ] Mover `useDockerHealth.ts` pra `apps/web/src/admin-v2/shell/` (ou `admin-v2/shared/`).
- [ ] Novo componente pequeno (`DockerStatusButton.tsx` ou similar): círculo com ícone `info`, cor conforme status (mesma lógica `online`/`offline`/`unknown` do `ERR-0069`), abre o modal existente (`DockerStatusModal.tsx`, também realocado) ao clicar.
- [ ] Inserir no `AdminTopbar.tsx`, canto direito.
- [ ] Validar ao vivo: status real (API/Postgres/nginx rodando) refletido no ícone; clique abre o modal com a informação certa.

## Onda 2 — Fix do botão "← Admin"
- [ ] `AdminTopbar.tsx`: texto "← Voltar", `to="/"`.
- [ ] Validar clique leva pra SPA pública.

## Onda 3 — Reescrever/retirar os 2 specs E2E acoplados ao legado
- [ ] `membership-grid.spec.ts`: reescrever contra `/admin-v2/cadastros/planos`.
- [ ] `flows.spec.ts` bloco "Admin flows": avaliar cobertura já existente no Admin V2 (ondas já validadas com E2E real, ver `MODIFICATION_LOG`); reescrever o que for cobertura única, remover o resto.
- [ ] Rodar a suíte E2E (`npx playwright test`) confirmando tudo verde antes de prosseguir.

## Onda 4 — Remoção física
- [ ] Remover a rota `/admin`/`admin.html` de `App.tsx`.
- [ ] Remover `apps/web/src/pages/Admin.tsx`.
- [ ] Remover `apps/web/src/components/pages/AdminContent.tsx`.
- [ ] Remover os 23 módulos legados restantes de `apps/web/src/modules/admin-*` (todos exceto `admin-docker-status`, já portado/esvaziado na Onda 1).
- [ ] `tsc -b` (web) — confirmar zero import quebrado.

## Onda 5 — Validação final
- [ ] `npm run build` (web) — confirmar bundle menor que antes (registrar tamanho antes/depois).
- [ ] Rebuild Docker (`web`) + `up -d --force-recreate`.
- [ ] Validação visual real via browser: Admin V2 inteiro navegado (Panorama, Operação, Rede, Clientes, Crescimento, Cadastros, Sistema) confirmando nada quebrado; botão "Voltar" e ícone de status conferidos; `/admin` confirmado 404.
- [ ] `apps/api` `tsc -b` + `npm run test` — confirmar 167/167 PASS sem mudança (backend intocado, checagem por precaução).
- [ ] `npx playwright test` — suíte E2E completa verde.

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
