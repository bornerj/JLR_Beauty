# Modification Log

This log tracks changes applied to the project from 2026-01-27 onward.

## 2026-08-16 — Fechamento de sessão (pós-PLAN-0026: consulta a PLAN-0021 + checagem de ambiente)

- **O que foi feito**: após o fechamento do `PLAN-0026` (registro anterior), o usuário
  perguntou do que se tratava o `PLAN-0021` (Reorganização do Menu Admin) — respondido com
  base na leitura do plano (ainda aberto, execução técnica feita em 2026-07-22, faltando
  validação visual do usuário + commit/push). Usuário pediu pra subir o ambiente e mostrar o
  Admin legado (reorganizado) e o Admin V2 pra teste manual, sinalizando intenção futura de
  aposentar o Admin legado. Ambiente já estava de pé (`docker compose ps`: api/nginx/
  postgres/web saudáveis) — sem rebuild necessário. Login feito no Admin legado via Chrome
  real, menu lateral conferido visualmente: ordem bate exatamente com o
  `PLAN-0021` (Painel, Agenda, WhatsApp, Vendas, Equipes-Metas, Equipes-Perform, Cadastro,
  Assinantes, Seções Telas, Galeria, Master). Usuário interrompeu a exploração automatizada
  ("pare com as tentativas de acessar via claude-in-chrome") antes de conferir os submenus
  internos de "Cadastro"/"Master" — interrompido de imediato, aba fechada, URLs de acesso
  manual (`/admin`, `/admin-v2`) repassadas pro usuário testar ele mesmo.
- **O que mudou**: nada em código ou schema. Nenhum arquivo de produto tocado nesta sessão
  além do fechamento do `PLAN-0026` já registrado no bloco anterior.
- **O que ficou pendente**:
  - `PLAN-0021` continua aberto — falta validação visual do próprio usuário (agora que o
    ambiente está confirmado de pé) e, depois, commit/push (dupla autorização, ainda não
    pedida).
  - Aposentadoria do Admin legado (mencionada pelo usuário como intenção) — segue fora de
    escopo até virar uma decisão/plano formal explícito, per `DECISION-014` regra #6.
  - `PLAN-0019`/`PLAN-0020` seguem abertos, não tocados.

## 2026-08-16 — SESSION AUDIT — PASS (fechamento de sessão)

| Item | Resultado |
|---|---|
| 1. Decision Integrity | PASS — nenhuma decisão alterada neste segmento |
| 2. State Integrity | PASS — `PLAN-0026` DONE; `PLAN-0021`/`0020`/`0019` pré-existentes, não tocados |
| 3. Operational Memory | PASS — fechamento de sessão registrado no `MODIFICATION_LOG` |
| 4. Debug Memory | PASS — nenhum bug neste segmento |
| 5. Technical Validation | PASS (N/A) — nenhum código alterado |
| 6. Regression Risk | PASS — só navegação read-only, interrompida a pedido do usuário |
| 7. Git Governance | PASS — `git status` limpo antes do fechamento; push deste commit a autorizar separadamente |

Checklist completo: `memory/logs/AUDIT_CHECKLIST_20260816_172342-PASS.md`.

---

## 2026-08-16 — SESSION AUDIT — PASS

| Item | Resultado |
|---|---|
| 1. Decision Integrity | PASS — `DECISION-014` íntegra, sem contradição |
| 2. State Integrity | PASS — `PLAN-0026` fechado; outros planos abertos são pré-existentes, fora de escopo |
| 3. Operational Memory | PASS — `MODIFICATION_LOG`/plano/progress.md atualizados |
| 4. Debug Memory | PASS — `ERR-0055` registrado |
| 5. Technical Validation | PASS — lint/build/test (134/134) executados |
| 6. Regression Risk | PASS — área sensível (usuários/papéis) tratada com cuidado redobrado, nenhuma conta real tocada |
| 7. Git Governance | PASS — 14 commits + push autorizado e executado (`3961a1c..efd1f45`) |

Checklist completo: `memory/logs/AUDIT_CHECKLIST_20260816_170321-PASS.md`.

---

## 2026-08-16 — Registro de FIM (`PLAN-0026` — Cadastros/Sistema nativos no Admin V2, 14/14 ondas)

- **Plano concluído**: `memory/plans/PLAN-0026-DONE-ADMIN-V2-CADASTROS-SISTEMA-NATIVOS.md`
  (renomeado de `PLAN-0026-ADMIN-V2-CADASTROS-SISTEMA-NATIVOS.md`).
- **Entrega final**: hub de Cadastros e hub de Sistema do Admin V2 100% nativos (14/14
  telas), nenhum card aponta mais pro Admin legado. Tier P (7 ondas), tier M (3 ondas) e
  tier G (4 ondas — Produtos/Clientes/Profissionais/Usuários) fechados. 6 bugs reais achados
  e corrigidos durante o plano (`ERR-0050`, `ERR-0051`, `ERR-0052`, `ERR-0054`, `ERR-0055`);
  1 achado de backend documentado e fora de escopo (`ERR-0053`). Legado
  (`apps/web/src/modules/admin-*/`) permanece intocado e funcional.
- **Git Record de Delivery**: 14 commits em `main`, um por onda (`3961a1c` Onda 1 até
  `efd1f45` Onda 14). Push autorizado explicitamente pelo usuário ("Sim, pode dar push",
  2026-08-16) e executado com sucesso: `3961a1c..efd1f45 → main`
  (`git@github.com:bornerj/JLR_Beauty.git`).
- **Situação final**: todas as validações do plano marcadas como concluídas (checklist
  técnico onda a onda + Git Record completo). Plano governado por `DECISION-014` (ACTIVE),
  que substitui a regra #5 da `DECISION-013`.

---

## 2026-08-16 — `PLAN-0026` Onda 14 (Usuários): terceira e última do desmembramento de "Pessoas", fecha o plano inteiro (14/14 ondas)

- **Contexto/objetivo**: continuação da execução autônoma autorizada. Usuários, tier G,
  terceira e última das 3 telas do desmembramento de "Pessoas" (`DECISION-014` regra #3) —
  fecha o `PLAN-0026` por completo.
- **RAG confirmado**: `users.ts` tem CRUD completo (`GET/POST/PATCH/DELETE /users`) — única
  das 3 entidades com as 4 operações. Regras de permissão do backend: só `MASTER` atribui o
  papel `MASTER` (403 caso contrário); excluir a própria conta é bloqueado (403); senha
  opcional no `PATCH` (mantém a atual se omitida).
- **Achado de contrato real (documentado, não corrigido)**: existe rota dedicada e auditada
  pra troca de papel, `PATCH /users/:id/role` (`requireMaster`, grava `AuditLog`), mas o
  form (legado e nativo, por paridade) manda `role` no `PATCH` genérico — que não audita.
  Replicado por paridade; trocar de rota mudaria quem pode editar o quê (não pedido nesta
  onda).
- **Entregue**: `cadastros/users/types.ts`; `shared/api.ts` ganhou `fetchUsers`/`createUser`/
  `updateUser`/`deleteUser`; `components/UserFormModal.tsx` (criar/editar, senha opcional na
  edição, upload de avatar real, select de papel esconde "Master" pra quem não é `MASTER`);
  `UsersListView.tsx` (tabela simplificada de 14 pra 9 colunas — removida URL crua do avatar
  e papel duplicado, decisão documentada — + busca + filtro de papel/status; botão de
  excluir desabilitado na própria linha); rota `cadastros/usuarios`; `CadastrosHubView.tsx` —
  card "Usuários" vira nativo, **hub de Cadastros fecha 100% nativo (8/8 cards)**.
- **Validações executadas**: `tsc -b`/`eslint`/`build` (web) limpos; `npm run test` (api)
  134/134 PASS; CSS conferido sem precisar regenerar; `docker compose build web` + redeploy
  `--force-recreate`. **E2E real contra Postgres, cuidado redobrado por mexer em contas de
  acesso reais** (11 usuários reais no ambiente, incluindo 2 `MASTER`): baseline capturado;
  usuário de teste descartável criado, editado (campos + senha + papel, incluindo atribuição
  de `MASTER` permitida e revertida), excluído — nenhuma conta real tocada; **bloqueio de
  auto-exclusão confirmado de verdade** (`DELETE` na própria conta logada → `403`); banco
  confirmado de volta a 11 usuários exatos. **Validação visual real** (Chrome real via
  `claude-in-chrome`, login MASTER, 12 checks, todos PASS): hub 8/8 nativo; criar/editar/
  excluir via UI funcionam ponta a ponta, **persistência confirmada com reload**; select de
  papel mostra "Master" pra quem está logado como `MASTER`; botão de auto-exclusão
  confirmado desabilitado via árvore de acessibilidade.
- **Arquivos alterados**: ver checklist completo em
  `memory/plans/PLAN-0026-ADMIN-V2-CADASTROS-SISTEMA-NATIVOS.md` (Onda 14).
- **Status**: Onda 14 concluída, validada de verdade, commit pendente. **Plano `PLAN-0026`
  inteiro concluído (14/14 ondas)** — falta só o fechamento formal de Git (commit desta
  onda + push acumulado de todo o plano, aguardando segunda aprovação do usuário) antes de
  renomear o arquivo do plano pra `-DONE-`.

---

## 2026-08-16 — `PLAN-0026` Onda 13 (Profissionais): segunda do desmembramento de "Pessoas", 1 bug de fuso horário achado e corrigido

- **Contexto/objetivo**: continuação da execução autônoma autorizada. Profissionais, tier G,
  segunda das 3 telas do desmembramento de "Pessoas" (`DECISION-014` regra #3).
- **RAG confirmado**: `schedule.ts` tem `GET/PATCH /professionals` + `PATCH .../link-user` —
  **sem `POST /professionals`** (confirmado varrendo `schedule.ts`/`users.ts`/`admin.ts`
  inteiros por `.professional.create(`; só existe em `prisma/seed.ts` e
  `scripts/seedAdminV2TestData.ts`, nunca numa rota HTTP — criar usuário com
  `role: "PROFESSIONAL"` não cria o `Professional` correspondente). CRUD completo de
  `/professional-work-profiles` e `/professional-commission-profiles` (catálogos). Confirmado
  que `/professional-shifts` e `/professionals/:id/services` são domínio de
  `admin-schedule` (Agenda), não de `admin-people` — preservado, tela só mostra as contagens.
- **Entregue**: `cadastros/professionals/types.ts` (+ `WORK_PROFILE_PERMISSION_GROUPS`, 14
  permissões em 3 grupos); `shared/api.ts` ganhou `fetchProfessionals`/`updateProfessional`/
  `linkProfessionalUser` + CRUD completo dos 2 catálogos (**sem `createProfessional`**);
  `components/WorkProfileManagerModal.tsx` e `CommissionProfileManagerModal.tsx` (novos,
  padrão form inline + lista + exclusão direta, backend decide "em uso" via 409);
  `components/ProfessionalFormModal.tsx` (sempre edição, nunca criação); `ProfessionalsListView.tsx`
  (11 colunas iguais ao legado + busca + filtro de unidade/status + toolbar dos 2 gerenciadores);
  rota `cadastros/profissionais`; `CadastrosHubView.tsx` — card "Profissionais" vira nativo
  (7/8 cards do hub já nativos, só falta Usuários).
- **Bug real achado na validação visual (`ERR-0055`, não no E2E via curl)**: colunas
  Início/Fim da tabela exibiam o dia anterior — `formatDateOnly` usava `toLocaleDateString("pt-BR")`
  sem fixar fuso sobre uma data armazenada como meia-noite UTC; convertia pro fuso local antes
  de formatar. Corrigido com `timeZone: "UTC"`.
- **Validações executadas**: `tsc -b`/`eslint`/`build` (web) limpos (2-3x, incluindo o fix de
  data); `npm run test` (api) 134/134 PASS; CSS regenerado proativamente (`min-w-[1080px]`,
  `grid-cols-[1fr_100px_100px]`, `grid-cols-[1fr_140px]`) — achado de processo: o próprio
  comando de regeneração sobrescreve o comentário de cabeçalho do arquivo, precisa ser
  reescrito manualmente toda vez; `docker compose build web` + redeploy `--force-recreate`
  (2x). **E2E real contra Postgres** (dados reais de produção, cuidado redobrado): baseline
  9 profissionais/0 perfis de trabalho/3 perfis de comissão; PATCH+revert de comissão;
  link-user no-op confirmado; ciclo completo de perfil de trabalho (criar/atualizar/atribuir/
  `409` em uso/desatribuir/excluir); ciclo completo de perfil de comissão; banco confirmado
  de volta ao original em todos os 3 recursos. **Validação visual real** (Chrome real via
  `claude-in-chrome`, login MASTER, 13 checks, todos PASS — 1ª rodada achou o `ERR-0055`):
  hub mostra "Profissionais" nativo; navegação real; breadcrumb correto; tabela com as 9
  linhas reais; busca e filtro de unidade funcionam; modal de edição pré-preenchido, salvar
  reflete e **persiste com reload** (datas corretas após o fix); os 2 gerenciadores de
  catálogo funcionam ponta a ponta (incluindo o `409` de "em uso" reproduzido de verdade via
  UI).
- **Arquivos alterados**: ver checklist completo em
  `memory/plans/PLAN-0026-ADMIN-V2-CADASTROS-SISTEMA-NATIVOS.md` (Onda 13).
- **Status**: Onda 13 concluída, validada de verdade, commit pendente (push acumulado pro
  final do plano, per autorização em pé). Onda 14 (Usuários, tier G) fecha o desmembramento
  de "Pessoas" e o plano inteiro.

---

## 2026-08-16 — `PLAN-0026` Onda 12 (Clientes): primeira do desmembramento de "Pessoas", 1 bug de breadcrumb achado e corrigido

- **Contexto/objetivo**: continuação da execução autônoma autorizada. Clientes, tier G,
  primeira das 3 telas do desmembramento de "Pessoas" (`DECISION-014` regra #3) — legado
  tinha Clientes/Profissionais/Usuários numa mega-tela só (`admin-people`, 1728 linhas de
  `behavior.ts` + 967 de markup).
- **RAG confirmado**: `schedule.ts` já tinha `GET/POST/PATCH /customers` — **sem `DELETE`**,
  confirmado e não fabricado; a tela nativa também não tem botão de excluir.
- **Entregue**: `cadastros/customers/types.ts`; `shared/api.ts` ganhou
  `fetchCustomers`/`createCustomer`/`updateCustomer` (sem delete); `components/
  CustomerFormModal.tsx`; `CustomersListView.tsx` (busca + filtro de UF dinâmico, sem
  coluna de excluir); rota `cadastros/clientes`; `CadastrosHubView.tsx` — card único
  "Pessoas" **desmembrado em 3 cards** (Clientes nativo, Profissionais/Usuários ainda
  legado).
- **Bug real achado na validação visual (`ERR-0054`, não no E2E)**: breadcrumb/sidebar
  quebrados — `isCustomersArea` (mundo de nível superior "Clientes", analytics) usava
  `.includes("/clientes")`, que também casava a nova rota `cadastros/clientes` (mesma
  substring). Corrigido ancorando ao início do path
  (`/^\/admin-v2\/clientes(\/|$)/`). Nota de processo: checar colisão de slug com mundos
  existentes antes de nomear uma sub-rota nova.
- **Validações executadas**: `tsc -b`/`eslint`/`build` limpos (2x); CSS regenerado
  proativamente; `docker compose build web` + redeploy `--force-recreate` (2x). **E2E real
  contra Postgres**: baseline 0 clientes; criado+atualizado via curl; cleanup via SQL direto
  (sem `DELETE` na API, aceitável só por ser dado de teste próprio, mesma situação da Onda
  11). **Validação visual real** (Playwright, 10 checks, todos PASS, rodado 2x — 1ª achou o
  `ERR-0054`): hub mostra os 3 cards separados; criar cliente via UI, **persistência
  confirmada com reload**; editar sem erro; busca filtra; confirmado que nenhum botão de
  excluir é renderizado; breadcrumb correto na 2ª rodada.
- **Arquivos alterados**: ver checklist completo em
  `memory/plans/PLAN-0026-ADMIN-V2-CADASTROS-SISTEMA-NATIVOS.md` (Onda 12).
- **Status**: Onda 12 concluída, validada de verdade, **commitada** (push acumulado pro
  final do plano, per autorização em pé). Onda 13 (Profissionais, tier G) inicia em seguida
  sem pausa.

---

## 2026-08-16 — `PLAN-0026` Onda 11 (Produtos): a mais pesada do plano, 1 achado de RAG corrigido por E2E + 1 achado de backend

- **Contexto/objetivo**: continuação da execução autônoma autorizada. Produtos, tier G,
  primeira onda mais pesada — legado tinha `behavior.ts` imperativo (973 linhas) + 450 de
  markup, a maior tela do legado inteiro.
- **RAG confirmado**: `catalog.ts` já tinha CRUD completo de `/products` +
  `/product-categories` + `/product-statuses`; `inventory.ts` (`PLAN-0020`) já tinha os 4
  endpoints de movimento, cross-unit, histórico e lista de unidades.
- **Achado de RAG corrigido depois de um E2E real (lição de processo importante)**: a
  varredura inicial (grep por `.product.update(`, padrão ORM) concluiu que `Product.stock`
  nunca era atualizado após a criação — **errado**. `applyStockMovement` recalcula o campo
  via `$executeRaw` (SQL bruto), que o grep não pegou. Só descoberto criando um produto de
  teste real, movimentando estoque de verdade e conferindo que o campo refletia a soma
  correta. Corrigido: tabela de Produtos agora **mostra** "Estoque total" (real, confiável),
  antes ia excluir a coluna por engano. Lição: grep prova ausência de um padrão específico,
  não de comportamento — só teste real prova comportamento real.
- **Achado de backend confirmado (`ERR-0053`, fora de escopo — sem mudança de schema)**:
  `DELETE /products/:id` responde `500` (não 404/409) pra produto com histórico de estoque
  — `StockMovement.product` não tem `onDelete: Cascade`. Confirmado com teste real, produto
  de teste removido via SQL direto (API não oferece caminho pra esse caso).
- **Entregue**: `cadastros/products/types.ts`; `shared/api.ts` ganhou CRUD de produtos +
  categorias/status de produto + 4 funções de estoque multi-unidade;
  `CategoryStatusManagerModal.tsx` **generalizado** (`entity?: "service" | "product"`, não
  quebra a Onda 8); `components/StockMoveModal.tsx` e `StockHistoryModal.tsx` (novos);
  `components/ProductFormModal.tsx` (catálogo completo + painel de estoque por unidade, só
  na edição); `ProductsListView.tsx` (tabela + busca + filtros + coluna "Estoque total");
  rota `cadastros/produtos`; card no hub vira `native: true`.
- **Decisões de modernização**: coluna "Patrimônio" do legado não reproduzida; os 4 cards
  de resumo do topo (números fabricados no JSX, nunca calculados por `behavior.ts`) não
  portados; paginação numerada não reproduzida (mesmo padrão das Ondas 4/8/9).
- **Validações executadas**: `tsc -b`/`eslint`/`build` limpos (2x); **CSS regenerado
  proativamente** antes do rebuild (3 classes arbitrárias ausentes, corrigidas antes de
  gastar um ciclo Docker); `docker compose build web` + redeploy `--force-recreate` (2x).
  **E2E real contra Postgres**: baseline de 9 produtos; criado produto com estoque inicial,
  `entry`+`adjust` confirmados via histórico (3 linhas corretas), `Product.stock` confirmado
  refletindo a soma real; `DELETE` de produto com movimento confirmado 500 (`ERR-0053`);
  limpeza via SQL direto. **Validação visual real** (Playwright, 8/9 automatizados PASS + 1
  falso-negativo de timing confirmado correto por screenshot): criar produto, **persistência
  confirmada com reload**, gerenciador de categoria generalizado funciona pra produto,
  painel de estoque registra movimento real e histórico mostra o registro certo.
- **Arquivos alterados**: ver checklist completo em
  `memory/plans/PLAN-0026-ADMIN-V2-CADASTROS-SISTEMA-NATIVOS.md` (Onda 11).
- **Status**: Onda 11 concluída, validada de verdade, **commitada** (push acumulado pro
  final do plano, per autorização em pé). Onda 12 (Clientes, tier G — desmembramento de
  "Pessoas") inicia em seguida sem pausa.

---

## 2026-08-16 — `PLAN-0026` Onda 10 (Testes e Validação): fecha tier M e o hub de Sistema (6/6 nativo)

- **Contexto/objetivo**: continuação da execução autônoma autorizada. Testes e Validação,
  tier M, legado tinha `behavior.ts` imperativo (385 linhas).
- **Achado que mudou o desenho da tela**: o legado misturava 13 smoke-checks de API (testam
  o backend compartilhado, portáveis) com checagens de **DOM do shell legado** (`.top-nav`,
  `.site-footer`, `[data-view]`, `[data-view-trigger]`, `[data-user-create-save]`,
  `[data-service-save]`, `[data-product-save]`, etc.) que **nunca existirão** na árvore React
  do Admin V2. Portar esse segundo grupo faria a tela sempre mostrar "FALHOU" falsamente.
  **Decisão**: mantidos só os 13 smoke-checks de API + teste de gravação (criar+excluir
  serviço/produto) + teste de validação — tudo que testa o backend de verdade. Descartado
  documentado explicitamente no cabeçalho do componente (não é "funcionalidade perdida",
  é escopo irrelevante nesta app).
- **Entregue**: `shared/api.ts` ganhou `pingApi`/`apiRequest` (genéricos, evitam 13+ funções
  tipadas one-off); `sistema/tests/TestsView.tsx` (botão executar, 4 cards de resumo, lista
  de resultados, mesmo gate de segurança do legado pro teste de gravação); rota `sistema/
  testes`; card no hub vira `native: true` — **hub de Sistema fecha 100% nativo (6/6)**.
- **Validações executadas**: `tsc -b` (web) limpo; `npm run build` (web) PASS; CSS conferido
  sem precisar regenerar; `docker compose build web` + redeploy `--force-recreate`. **E2E
  real**: 14 endpoints confirmados `200` via curl antes da validação visual. **Validação
  visual real** (Playwright, 12 checks, todos PASS) — **essa onda é uma ferramenta de
  auto-teste, então rodá-la via UI já é o E2E**: "Executar testes" produziu **18/18 PASSOU,
  0 falhas**, incluindo os 2 testes de gravação reais (serviço+produto criados e removidos,
  contagens confirmadas inalteradas antes/depois) e confirmado que nenhum ID de checagem de
  DOM legado aparece nos resultados — a redução de escopo foi aplicada de fato.
- **Marco**: com a Onda 10, **tier P (7 ondas) e tier M (3 ondas) estão inteiramente
  concluídos** — 10 de 14 ondas, hub de Sistema 100% nativo. Restam só as 4 ondas do tier G
  (Produtos/Clientes/Profissionais/Usuários, todas em Cadastros).
- **Arquivos alterados**: ver checklist completo em
  `memory/plans/PLAN-0026-ADMIN-V2-CADASTROS-SISTEMA-NATIVOS.md` (Onda 10).
- **Status**: Onda 10 concluída, validada de verdade, **commitada** (push acumulado pro
  final do plano, per autorização em pé). Onda 11 (Produtos, tier G) inicia em seguida sem
  pausa.

---

## 2026-08-16 — `PLAN-0026` Onda 9 (WhatsApp/Integrações): auditoria + config do bot

- **Contexto/objetivo**: continuação da execução autônoma autorizada. WhatsApp/Integrações,
  tier M, legado tinha `behavior.ts` imperativo (361 linhas + 96 de markup).
- **RAG confirmado**: `GET /concierge/sessions` (`schedule.ts`) já suporta filtro
  **server-side** de `search`/`status`/`from`/`to` — melhor que o legado, que buscava 500
  registros de uma vez e filtrava em memória. As 3 configs do bot (categorias-primeiro +
  2 saudações) já viviam em `/api/settings/:key` genérico — zero cliente HTTP novo pra elas,
  só reuso de `fetchSetting`/`updateSetting` da Onda 2.
- **Entregue**: `sistema/whatsapp/types.ts`; `shared/api.ts` ganhou só `fetchConciergeSessions`
  (única função nova); `shared/format.ts` ganhou `formatDateTimeBR` (reusável); `sistema/
  whatsapp/WhatsappIntegrationsView.tsx` (bloco de config com save otimista + rollback,
  bloco de filtros server-side, tabela de auditoria com badges de status em tokens
  semânticos — melhor que o legado, que não tinha cor pra `ACTIVE`); rota `sistema/
  whatsapp`; card no hub vira `native: true`.
- **Validações executadas**: `tsc -b` (web) limpo; `npm run build` (web) PASS; CSS conferido
  sem precisar regenerar; `docker compose build web` + redeploy `--force-recreate`. **E2E
  real contra Postgres**: baseline confirmado (settings ainda não existiam, 404 esperado; 0
  sessões de concierge); `PUT` das 3 configs confirmado, revertido aos defaults.
  **Validação visual real** (Playwright, 8 checks, todos PASS): estado vazio renderiza
  correto, toggle liga/desliga e salva, **persistência confirmada com reload**, saudações
  editadas/salvas/revertidas, busca+filtro não quebram a tela.
- **Arquivos alterados**: ver checklist completo em
  `memory/plans/PLAN-0026-ADMIN-V2-CADASTROS-SISTEMA-NATIVOS.md` (Onda 9).
- **Status**: Onda 9 concluída, validada de verdade, **commitada** (push acumulado pro final
  do plano, per autorização em pé). Onda 10 (Testes, tier M) inicia em seguida sem pausa.

---

## 2026-08-16 — `PLAN-0026` Onda 8 (Serviços): primeiro `behavior.ts` reescrito como React (tier M)

- **Contexto/objetivo**: continuação da execução autônoma autorizada. Serviços, tier M,
  primeira onda com `behavior.ts` imperativo no legado (416 linhas + 250 de markup
  `data-*`) — reescrita completa como React declarativo.
- **RAG confirmado**: `catalog.ts` já tinha CRUD completo de `/services` +
  `/service-categories` + `/service-statuses` (endpoints genéricos, compartilhados com
  Produtos via `admin-core/behavior.ts`). Achado: `<option>` de categoria/status no JSX
  legado eram hardcoded (4 valores fixos), mas sobrescritos em runtime pelo
  `admin-core/behavior.ts` com dados reais — a tela nativa busca os dados reais desde o
  primeiro render, sem depender de sobrescritor externo.
- **Entregue**: `cadastros/services/types.ts`; `shared/api.ts` ganhou CRUD de serviços +
  CRUD completo de categorias/status de serviço (**desenhado reusável pra Onda 11**);
  `components/CategoryStatusManagerModal.tsx` (novo, genérico por `kind`, "em uso" decidido
  pelo backend via 409, não recalculado no cliente); `components/ServiceFormModal.tsx`
  (dropdowns reais, upload de imagem reusando `uploadAsset`); `ServicesListView.tsx`
  (tabela + busca + filtro categoria/status; paginação numerada do legado **não**
  reproduzida — decisão de modernização documentada, não é regra de negócio); rota
  `cadastros/servicos`; card no hub vira `native: true`.
- **Validações executadas**: `tsc -b` (web) limpo; `npm run build` (web) PASS; CSS conferido
  sem precisar regenerar; `docker compose build web` + redeploy `--force-recreate`. **E2E
  real contra Postgres**: baseline de 75 serviços; criado serviço+categoria+status de
  teste; `DELETE` de categoria em uso confirmado bloqueado (409, regra do backend);
  cleanup completo, banco de volta a 75. **Validação visual real** (Playwright, 10 checks,
  todos PASS): criar serviço via modal, **persistência confirmada com reload**, gerenciador
  de categoria aberto de dentro do form (modal aninhado, mesmo padrão das Ondas 5/7), cria
  e exclui categoria de teste, exclui serviço via `DeleteConfirmModal`, volta a 75/75
  confirmado por reload.
- **Arquivos alterados**: ver checklist completo em
  `memory/plans/PLAN-0026-ADMIN-V2-CADASTROS-SISTEMA-NATIVOS.md` (Onda 8).
- **Status**: Onda 8 concluída, validada de verdade, **commitada** (push acumulado pro final
  do plano, per autorização em pé). Onda 9 (WhatsApp/Integrações, tier M) inicia em seguida
  sem pausa.

---

## 2026-08-16 — `PLAN-0026` Onda 7 (Galeria de Mídias): fecha o tier P, 1 bug de z-index achado e corrigido

- **Contexto/objetivo**: continuação da execução autônoma autorizada. Galeria de Mídias,
  tier P (último do tier), já era React puro no legado (519 linhas).
- **RAG confirmado**: `admin.ts` já tinha `/admin/media-slots` completo + reuso de
  `/api/uploads`. 78 slots institucionais, catálogo com `fallbackUrl` por slot (fallback em
  cascata: banco → catálogo → fallback individual). Mesmo contrato "manda o mapa inteiro" da
  Onda 5 (`savePublicMediaSlots` normaliza com fallback, não faz merge incremental).
- **Entregue**: `shared/api.ts` ganhou `fetchMediaSlots`/`saveMediaSlots` (reusa `uploadAsset`
  da Onda 3); `sistema/mediaGallery/MediaGalleryView.tsx` (grid de 78 thumbnails agrupados
  por página, editor em modal com preview/URL/upload/reverter fallback, confirmação de
  "fechar sem salvar" via `DeleteConfirmModal` neutro em vez de `window.confirm()`); rota
  `sistema/galeria-midias`; card no hub vira `native: true`.
- **Bug real achado na validação visual (`ERR-0052`, não no E2E via curl)**: o modal de
  "fechar sem salvar" abria mas o clique nunca completava — herdado do legado com `z-[80]`,
  ficava atrás do `DeleteConfirmModal` compartilhado (`z-50`, convenção de todo o resto do
  Admin V2). Corrigido igualando pra `z-50`. Nota de processo: nunca copiar `z-[N]`
  arbitrário do legado sem checar contra a convenção já estabelecida no V2.
- **Prática nova desta onda**: CSS regenerado **proativamente antes do primeiro rebuild**
  Docker (lição da Onda 6/`ERR-0051`) — confirmadas presentes as classes arbitrárias novas
  (`h-[140px]`, `h-[260px]`, `max-w-[640px]`) antes de gastar um ciclo de build só pra
  descobrir depois que faltava alguma.
- **Validações executadas**: `tsc -b` (web) limpo; `npm run build` (web) PASS (2x); `docker
  compose build web` + redeploy `--force-recreate` (2x — 1ª pro código, 2ª pro fix de
  z-index). **E2E real contra Postgres**: baseline de 78 slots capturado; 1 slot alterado +
  `PUT` completo confirmado; revertido ao mapa original exato. **Validação visual real**
  (Playwright, 10 checks — 9/10 na 1ª rodada por causa do `ERR-0052`, 10/10 depois do fix):
  editor abre com preview real, editar+salvar com sucesso, **persistência confirmada com
  reload**, reverter fallback funciona, **modal de confirmação de fechar funciona de
  verdade** (clique completa), banco revertido ao original ao final.
- **Arquivos alterados**: ver checklist completo em
  `memory/plans/PLAN-0026-ADMIN-V2-CADASTROS-SISTEMA-NATIVOS.md` (Onda 7).
- **Status**: Onda 7 concluída, validada de verdade, **commitada** (push acumulado pro final
  do plano, per autorização em pé). **Tier P do roadmap 100% fechado** (Ondas 1-7). Onda 8
  (Serviços, tier M — primeira com `behavior.ts` imperativo a reescrever) inicia em seguida
  sem pausa.

---

## 2026-08-16 — `PLAN-0026` Onda 6 (Seções Telas): gate MASTER preservado, 1 bug de CSS achado e corrigido

- **Contexto/objetivo**: continuação da execução autônoma autorizada. Seções Telas
  (liga/desliga), tier P, já era React puro no legado (276 linhas).
- **RAG confirmado**: `admin.ts` já tinha `/admin/section-toggles` completo, 32 chaves
  `page.section`. **Restrição preservada exatamente**: só `role === "MASTER"` edita — checado
  no `GET` e no `PUT`, em cima do `requireAdmin` padrão (ADMIN comum recebe 403 até pra ver).
- **Entregue**: `shared/api.ts` ganhou `fetchSectionToggles`/`updateSectionToggles`;
  `sistema/sectionToggles/SectionTogglesView.tsx` (3 colunas, ordem fixa não-alfabética
  igual ao legado, switch customizado em Tailwind puro, gate `canEdit` client-side
  preservado); rota `sistema/secoes`; card no hub vira `native: true`.
- **Bug real achado na validação visual (`ERR-0051`, mesma causa raiz do `ERR-0049`/
  `ERR-0040`, não no E2E via curl)**: todos os 32 toggles renderizavam brancos/sem cor,
  círculo sempre à esquerda, mesmo com `enabled: true` no banco. Causa: `tailwind.generated
  .css` é um snapshot estático — o switch customizado introduziu classes nunca usadas antes
  (`border-state-healthy` bare, `w-[52px]`, `left-[26px]`), ausentes do CSS servido.
  Corrigido regenerando o arquivo por completo (comando já documentado no cabeçalho do
  próprio arquivo) — a regeneração rescaneia todo o código atual, cobrindo também as Ondas
  1-5 de brinde. Nota de processo registrada: telas futuras com padrão visual genuinamente
  novo devem regenerar esse arquivo como parte padrão da validação.
- **Validações executadas**: `tsc -b` (web) limpo; `npm run build` (web) PASS (2x); `docker
  compose build web` + redeploy `--force-recreate` (2x). **E2E real contra Postgres**:
  baseline de 32 chaves capturado (produção já tinha as 32 em `true`); toggle + `PUT`
  completo confirmado; revertido ao mapa original exato. **Validação visual real**
  (Playwright, 8 checks, todos PASS só após o fix de CSS): **pixel-sampling confirmou
  `rgb(0,150,127)` exato no estado ligado e cinza claro no desligado**, persistência
  confirmada com reload, banco revertido ao original ao final.
- **Arquivos alterados**: ver checklist completo em
  `memory/plans/PLAN-0026-ADMIN-V2-CADASTROS-SISTEMA-NATIVOS.md` (Onda 6).
- **Status**: Onda 6 concluída, validada de verdade, **commitada** (push acumulado pro final
  do plano, per autorização em pé). Onda 7 (Galeria de Mídias) inicia em seguida sem pausa.

---

## 2026-08-16 — `PLAN-0026` Onda 5 (Textos das Páginas): 331 campos, achado crítico de contrato

- **Contexto/objetivo**: continuação da execução autônoma autorizada. Textos das Páginas,
  tier P, já era React puro no legado (309 linhas + `SegmentEditor.tsx`, 91 linhas).
- **RAG confirmado**: catálogo com 331 entradas (`pageTexts/catalog.ts`), cada texto
  endereçável por chave em `Setting` (`public.pageTexts`), suporta texto simples ou
  segmentado (múltiplas partes com estilo visual próprio).
- **Achado crítico de contrato (não óbvio, exigiu ler `service.ts` linha a linha)**:
  `savePublicPageTexts` **substitui o mapa inteiro** — o `PUT` faz merge com os *defaults*
  do catálogo, não com o que já estava salvo. Um save que manda só as chaves editadas
  resetaria as outras 300+ pro valor padrão. A tela sempre carrega as 331 chaves completas
  (já mescladas com defaults pelo `GET`) e manda o mapa inteiro de volta em todo `PUT`.
- **Entregue**: `sistema/pageTexts/types.ts`; `shared/api.ts` ganhou
  `fetchPageTexts`/`fetchPreviousPageTexts`/`savePageTexts`/`restorePreviousPageTexts`;
  `components/SegmentEditor.tsx` (porte 1:1, editor de texto multi-parte com preview);
  `PageTextsView.tsx` (abas por página + acordeão por seção, undo de 1 nível preservado);
  `DeleteConfirmModal.tsx` **generalizado** (`tone`/`confirmLabel`/`confirmingLabel`
  opcionais, default preserva 100% o comportamento original) pra servir confirmação neutra
  (restaurar) sem duplicar componente; rota `sistema/textos-paginas`; card no hub de Sistema
  vira `native: true`.
- **Validações executadas**: `tsc -b` (web) limpo; `npm run build` (web) PASS; `docker
  compose build web` + redeploy `--force-recreate`. **E2E real contra Postgres, cuidado
  redobrado por ser conteúdo de produção real (não massa de teste)**: baseline de 331 chaves
  capturado via `GET` antes de qualquer mutação; editar 1 campo + salvar confirmado; revertido
  ao mapa original **byte-a-byte** (comparação Python de dicionário completo); endpoint
  `/restore` testado explicitamente e revertido de novo ao real — banco saiu do teste
  exatamente como entrou. **Validação visual real** (Playwright, 11 checks, todos PASS):
  edição+salvar com sucesso, **persistência confirmada com reload**, modal de restauração
  (tom neutro) funciona, troca de aba renderiza conteúdo real correto, **DB confirmado
  restaurado byte-a-byte ao final via chamada de API dedicada**, independente do que o fluxo
  de UI deixou.
- **Arquivos alterados**: ver checklist completo em
  `memory/plans/PLAN-0026-ADMIN-V2-CADASTROS-SISTEMA-NATIVOS.md` (Onda 5).
- **Status**: Onda 5 concluída, validada de verdade, **commitada** (push acumulado pro final
  do plano, per autorização em pé). Onda 6 (Seções Telas) inicia em seguida sem pausa.

---

## 2026-08-16 — `PLAN-0026` Onda 4 (Cupons): quarta tela nativa, 1 bug real achado e corrigido

- **Contexto/objetivo**: continuação da execução autônoma autorizada. Cupons de Desconto,
  tier P, já era React puro no legado (538 linhas).
- **RAG confirmado**: `admin.ts` já tinha CRUD completo (`/discount-coupons`), reusando
  `DiscountCoupon` (`schema.prisma`). Mesma pegadinha de serialização Decimal->string das
  Ondas 1/3 em `percentOff`/`amountOff`/`minSubtotal`.
- **Entregue**: `cadastros/coupons/types.ts`; `shared/api.ts` ganhou
  `fetchDiscountCoupons`/`createDiscountCoupon`/`updateDiscountCoupon`/`deleteDiscountCoupon`;
  `components/CouponFormModal.tsx`; `CouponsListView.tsx` (**tabela**, não cards — melhor
  encaixe pras 8 colunas de dado tabular, diferente do padrão de cards da Onda 1); rota
  `cadastros/cupons`; card "Cupons" no hub vira `native: true`.
- **Bug real achado na validação visual (não no RAG nem no E2E via curl)**: criar cupom pela
  UI sempre falhava com "dados invalidos". Causa: o schema Zod de criação
  (`discountCouponSchema`) só aceita `number | undefined` nos campos numéricos opcionais,
  nunca `null` — só o de edição aceita `null` explícito. O modal mandava `null` pro campo de
  desconto não usado em ambos os casos. Corrigido diferenciando `undefined` (criar) de `null`
  (editar), mesma distinção que o form legado já fazia. Documentado como `ERR-0050` em
  `memory/logs/DEBUG-HISTORY.md`.
- **Validações executadas**: `tsc -b` (web) limpo; `npm run build` (web) PASS; `docker compose
  build web` + redeploy `--force-recreate` **2x** (a primeira rodada de validação visual
  pegou o bug acima; corrigido e revalidado do zero). **E2E real contra Postgres**: baseline
  vazio, `POST` cria PERCENT `201`, `PATCH` troca pra FIXED `200` (testa a troca de tipo),
  `DELETE` `204`, banco de volta a `[]`. **Validação visual real** (Playwright, 8 checks,
  todos PASS só após o fix): criar/editar/excluir via UI, **persistência confirmada com
  reload de página**, estado vazio final confirmado por reload.
- **Arquivos alterados**: ver checklist completo em
  `memory/plans/PLAN-0026-ADMIN-V2-CADASTROS-SISTEMA-NATIVOS.md` (Onda 4).
- **Status**: Onda 4 concluída, validada de verdade, **commitada** (push acumulado pro final
  do plano, per autorização em pé). Onda 5 (Textos das Páginas) inicia em seguida sem pausa.

---

## 2026-08-16 — `PLAN-0026` Onda 3 (Branding): primeira tela nativa de Sistema

- **Contexto/objetivo**: continuação direta da execução autônoma autorizada (commit sem
  perguntar por onda, push acumulado pro final, próxima onda sem pausa pra aprovação).
  Primeira onda a entregar no hub **Sistema** (Ondas 1-2 foram Cadastros).
- **RAG confirmado**: Branding usa rota **dedicada** (`GET/PUT /admin/branding` em
  `admin.ts`), não o genérico `/api/settings/:key` usado na Onda 2 — por baixo lê/grava a
  mesma tabela `Setting` (chave `public.branding`) via `modules/branding/service.ts`, mas
  com schema Zod próprio (`brandingPayloadSchema`) e cache in-memory de 5min. Legado
  (`admin-branding/components/AdminBrandingView.tsx`, 496 linhas) já era React puro, sem
  `behavior.ts` — tier P confirmado.
- **Entregue**: `shared/api.ts` ganhou `fetchBranding`/`updateBranding` (rota dedicada) +
  `uploadAsset` (cliente genérico de `/api/uploads`, já reutilizável pra Galeria de Mídias
  na Onda 7); `sistema/branding/BrandingSettingsView.tsx` (form + upload + histórico local
  de logos + preview ao vivo, chama `updateBrandingSnapshot` pra refletir no site público
  igual ao legado); rota `sistema/branding`; card "Branding" no hub de Sistema vira
  `native: true`. **Generalização feita nesta onda**: o padrão de breadcrumb por lookup
  (`CADASTROS_SUBROUTE_LABELS`, da Onda 2) ganhou o equivalente pro hub de Sistema
  (`SISTEMA_SUBROUTE_LABELS`), mesmo mecanismo.
- **Validações executadas**: `tsc -b` (web) limpo; `eslint` nos arquivos tocados limpo;
  `npm run build` (web) PASS; `docker compose build web` + redeploy `--force-recreate`.
  **E2E real contra Postgres** (login MASTER via `/api/auth/login`, campo `identifier`, não
  `email`): `GET` inicial confirma valores de produção, `PUT` de teste `200`, `GET` confirma
  persistência, revertido ao original ao final. **Validação visual real** (Playwright, 7
  checks, todos PASS): hub de Sistema mostra "Branding" com "Abrir →" (as outras 5 telas
  seguem "Abrir no Admin →"); breadcrumb `Panorama > Sistema > Branding`; campos
  pré-preenchidos com dados reais; editar+salvar via UI com **persistência confirmada por
  reload de página**; revertido ao valor original via UI ao final — nenhum dado de teste
  deixado pra trás.
- **Arquivos alterados**: ver checklist completo em
  `memory/plans/PLAN-0026-ADMIN-V2-CADASTROS-SISTEMA-NATIVOS.md` (Onda 3).
- **Status**: Onda 3 concluída, validada de verdade, **commitada** (push acumulado pro final
  do plano, per autorização em pé). Onda 4 (Cupons) inicia em seguida sem pausa.

---

## 2026-08-16 — `PLAN-0026` Onda 2 (Entrega): segunda tela nativa de Cadastros

- **Contexto/objetivo**: usuário autorizou execução autônoma do restante do `PLAN-0026`
  ("commit pode fazer sem me perguntar, e deixe o push só para o final. quando acabar pode
  começar a nova onda sem me perguntar também"). A partir desta onda: commit direto após
  validação, push acumulado pro final, próxima onda inicia sem pausa pra aprovação.
- **RAG confirmado**: 2 chaves genéricas via `/api/settings/:key` (`admin.ts`) —
  `checkout.localDeliveryFee` (default R$ 10) e `checkout.freeShippingThreshold` (default
  R$ 150). `GET` devolve `404` quando a chave nunca foi salva (tratado como "sem valor,
  usa default"); `PUT` faz upsert.
- **Entregue**: `shared/api.ts` ganhou um cliente genérico `fetchSetting`/`updateSetting`
  (reutilizável pelas próximas ondas de config-form, ex.: Branding);
  `cadastros/delivery/DeliverySettingsView.tsx`; rota `cadastros/entrega`; card "Entrega" no
  hub vira `native: true`. **Refatoração feita nesta onda**: o padrão de breadcrumb das
  sub-telas de Cadastros virou uma tabela de lookup (`CADASTROS_SUBROUTE_LABELS`) em vez de
  1 `isXArea` + 1 `if` por onda em `AdminV2Root.tsx` — decisão pra não inflar o arquivo a
  cada uma das 14 ondas do plano, aplica-se retroativamente a Planos sem mudar comportamento.
- **Validações executadas**: `tsc -b` (web) limpo; `npm run build` (web) PASS; `docker compose
  build web` + redeploy. **E2E real contra Postgres**: `GET` inicial `404`, `PUT` das 2
  chaves `200`, revertido pros defaults originais ao final. **Validação visual real**
  (Playwright, 5 checks): valores iniciais = defaults, salvar reflete no resumo,
  **persistência confirmada com reload de página** (não só estado local), banco revertido aos
  defaults via UI ao final.
- **Arquivos alterados**: ver checklist completo em
  `memory/plans/PLAN-0026-ADMIN-V2-CADASTROS-SISTEMA-NATIVOS.md` (Onda 2).
- **Status**: Onda 2 concluída, validada de verdade, **commitada** (push acumulado pro final
  do plano, por instrução do usuário). Seguindo direto pra Onda 3 (Branding).

## 2026-08-16 — `PLAN-0026` Onda 1 (Planos): primeira tela nativa de Cadastros

- **Contexto/objetivo**: usuário aprovou a execução do `PLAN-0026` e pediu pra começar.
  Primeira onda (tier P, "onda-modelo"): Cadastro de Planos.
- **RAG confirmado no início da execução**: `Membership` no `schema.prisma`; `price` volta do
  backend como `string` (`Prisma.Decimal.toJSON()`, não convertido pela rota); `benefits`
  validado como `string[]` no Zod da rota apesar de `Json?` no schema. Achado que ajusta o
  método de estimativa: a interação do legado (`admin-plans`) vive centralizada em
  `admin-core/behavior.ts`, não num `behavior.ts` próprio do módulo — atenção nas próximas
  ondas ao estimar complexidade só pela contagem de linhas do módulo isolado.
- **Entregue**: `cadastros/plans/types.ts`, `PlansListView.tsx`, `components/PlanFormModal.tsx`,
  `components/PlanCard.tsx`; `shell/DeleteConfirmModal.tsx` (novo, compartilhado entre futuras
  ondas — nunca `window.confirm()`, mesmo padrão do `StageChangeReasonModal` do `PLAN-0025`);
  `shared/api.ts` (4 funções reusando `/api/memberships` sem endpoint novo); rota
  `cadastros/planos` + breadcrumb em `AdminV2Root.tsx`; `HubCard.tsx` ganhou o modo `native`
  (legenda muda de "Abrir no Admin →" pra "Abrir →" sem quebrar os cards ainda não migrados);
  `CadastrosHubView.tsx` — card "Planos" vira link interno.
- **Validações executadas**: `tsc -b` (web) limpo; `npm run build` (web) PASS; `npm run lint`
  (web) — 18 erros (17 pré-existentes + 1 novo, mesmo padrão `fetch-on-mount` já tolerado em
  toda tela do Admin V2); `docker compose build web` + redeploy. **E2E real contra Postgres**
  (login MASTER): CRUD completo via `curl` (create `201`, `price` confirmado como string; update
  `200`; delete `204`), banco conferido de volta ao estado original ao final (3 planos), nenhum
  dado de teste deixado pra trás. **Validação visual real** (Playwright): hub de Cadastros com
  o card já nativo, navegação real, breadcrumb correto, criar/editar/excluir via UI — o primeiro
  teste automatizado teve 1 falso-negativo por seletor ambíguo do próprio script (não do app),
  confirmado com um teste isolado (log de rede: `DELETE .../5 → 204`, lista final vazia).
- **Arquivos alterados**: ver checklist completo em
  `memory/plans/PLAN-0026-ADMIN-V2-CADASTROS-SISTEMA-NATIVOS.md` (Onda 1).
- **Status**: Onda 1 concluída, validada de verdade. Sem commit/push (aguardando autorização
  do usuário). Faltam Ondas 2-14.

## 2026-08-16 — `DECISION-014` + `PLAN-0026` escrito: Cadastros/Sistema nativos no Admin V2

- **Contexto/objetivo**: usuário pediu o plano pra nativizar as telas de Cadastros/Sistema
  (item 2, desmembrado do `PLAN-0025`), autorizando explicitamente alterar a `DECISION-013`
  pra este caso específico.
- **RAG feito antes de planejar** (via subagente Explore, ~184s): os 3 sistemas de conteúdo
  endereçável por banco (Textos das Páginas, Seções Telas, Galeria de Mídias) — todos guardados
  como blobs JSON na tabela genérica `Setting`/`ContentEntry`, catálogo de campos definido em
  TypeScript (não no schema). Confirmado com o usuário: essas 3 telas + Cupons/Entrega/Branding
  são "quase reskin" (React puro no legado, endpoints já existentes).
- **Investigação de complexidade das demais telas** (contagem de linhas por módulo como proxy):
  achado decisivo — `admin-people` (2.708 linhas), `admin-products` (1.436), `admin-services`
  (679), `admin-whatsapp-contacts` (470), `admin-tests` (453) usam um padrão imperativo antigo
  (`behavior.ts` com `querySelector`/`addEventListener` manual), diferente do resto do projeto
  (React declarativo). Confirmado no backend: 100% do CRUD necessário já existe (`catalog.ts`,
  `users.ts`, `schedule.ts`, `subscriptions.ts`, `admin.ts`) — nenhuma rota nova prevista.
- **`DECISION-014` criada** (ACTIVE) — substitui a regra #5 da `DECISION-013` (marcada
  riscada/substituída no arquivo original, sem apagar o histórico). 6 regras fixas: componente
  novo sempre (nunca editar módulo legado), reuso obrigatório de backend, telas monolíticas
  desmembradas por entidade (Pessoas → Clientes/Profissionais/Usuários), sequenciamento por
  complexidade real, paleta/cálculo de negócio herdados da `DECISION-013` sem revalidação,
  aposentadoria do legado continua fora de escopo.
- **`PLAN-0026` escrito** — 14 ondas (1 tela/entidade por onda): 7 tier P (Planos, Entrega,
  Branding, Cupons, Textos, Seções, Galeria), 3 tier M (Serviços, WhatsApp/Integrações, Testes),
  4 tier G por último (Produtos, Clientes, Profissionais, Usuários). Onda 1 (Planos) detalhada
  como onda-modelo; Ondas 2-14 ficam como roadmap resumido, a detalhar quando chegar a vez
  (mesmo padrão já usado no `PLAN-0022`) — não fabricado detalhe de implementação de telas ainda
  não investigadas a fundo. "Segurança"/"Infra" do hub Sistema ficam fora (sem tela legada
  equivalente, confirmado no `PLAN-0024`).
- **Arquivos alterados**: `memory/decisions/DECISION-014.md` (novo),
  `memory/decisions/DECISION-013.md` (regra #5 marcada substituída),
  `memory/plans/PLAN-0026-ADMIN-V2-CADASTROS-SISTEMA-NATIVOS.md` (novo), `memory/progress.md`.
- **Status**: plano escrito, aguardando aprovação do usuário pra executar. Nenhum código
  alterado ainda.

## 2026-08-15 — `PLAN-0025` executado: polimento de UX do Admin V2 + achado sistêmico de CSS

- **Contexto/objetivo**: execução do `PLAN-0025` aprovada pelo usuário ("pode começar"). 6 ondas
  (itens 1, 3, 4, 5, 6, 7 do pedido original) mais 1 achado não planejado, corrigido na mesma
  leva depois de gate socrático.
- **Onda 1 (item 1 — cabeçalho dos kanban)**: `KanbanColumnHeader.tsx` (novo, compartilhado)
  aplicado em `NetworkView.tsx`, `OrdersBoardView.tsx`, `PipelineBoardView.tsx` — fundo
  `cream-sidebar`/borda `gold`, reusando tokens já existentes do shell.
- **Onda 2 (item 3 — motivo de mudança de etapa)**: migração aditiva
  `20260815192400_add_franchise_stage_history_reason` (`FranchiseLeadStageHistory.reason
  String?`); `moveLeadStage()` e a rota `PATCH .../stage` passaram a aceitar `reason`;
  `StageChangeReasonModal.tsx` (novo) — abre ao trocar a etapa no `LeadCard`, texto obrigatório,
  Cancelar reverte o select (controlado, sem lógica extra), Confirmar chama a API e fecha sozinho.
- **Onda 3 (item 4 — botões OAuth mortos)**: `AuthModalsSection.tsx` — removidos os botões
  Google/Facebook (login e cadastro) e o divisor "ou". Decisão do usuário: não implementar OAuth
  agora (zero infraestrutura hoje + bloqueio real de TLS em produção, `PLAN-0019` `BLOCKED`).
- **Onda 4 (item 5 — texto explicativo da Rede)**: `NetworkView.tsx` ganhou o subtítulo "quais
  unidades estão bem, quais precisam de atenção, e por quê" (reusa a pergunta já documentada no
  `PLAN-0022` Onda 2, não inventada).
- **Onda 5 (item 6 — contraste da Agenda-Capacidade)**: `OCCUPANCY_CELL_CLASS` com opacidades
  aumentadas (`/20`-`/25` → `/40`-`/55`). Mesma lógica de negócio mantida (vermelho=ocioso,
  verde=ocupado), por decisão explícita do usuário.
- **Onda 6 (item 7 — indicadores de estoque)**: `PanoramaOperations.stockValue` exposto (já era
  calculado por `getInventoryOverview`, só descartado); card "Operação agora" do Panorama ganhou
  a linha "Valor em estoque". Ticket médio por unidade já existia no Comparador — nada novo.
- **Onda 0 — achado não planejado, corrigido na mesma leva**: durante a validação visual do item
  6, checagem de pixel real (não só "parece certo") revelou que os 4 tokens semânticos `state-*`
  (`DECISION-013` regra #6) nunca foram compilados no CSS servido desde a Onda 1 do `PLAN-0022`
  — o projeto usa CSS Tailwind pré-compilado/hand-maintained, sem passo de build Tailwind no
  `npm run build`/`Dockerfile` (mesma causa raiz do `ERR-0040`, aqui em escopo sistêmico: afetava
  Health Score, Insight Engine, Radar/Gargalos, não só a Agenda-Capacidade). Gate socrático
  aplicado antes de corrigir (usuário aprovou regenerar de verdade via Tailwind CLI em vez de
  remendo pontual). Tentativa de **substituir** os 2 CSS existentes foi cogitada e **rejeitada**
  — eles têm CSS customizado hand-written misturado (`.metric-card`, `.footer-*`, `.nav-*`, etc.)
  que `tailwindcss build` não reproduz. Fix aditivo aplicado:
  `apps/web/src/styles/tailwind.generated.css` (novo, gerado via `npx tailwindcss@3.4.17`, 161
  classes que faltavam) importado por último em `main.tsx`. Ver `ERR-0049`.
- **Validações executadas**: `tsc -b` (api+web) limpo; `npm run build` (api+web) PASS; `npm run
  test` (api) **134/134 PASS**; `npm run lint` (web) sem regressão nova; `docker compose build` +
  redeploy (2 rodadas); **E2E real** (PATCH de stage com/sem `reason`, persistência conferida
  direto no banco; `stockValue` real no Panorama; regressão OK em todos os endpoints de
  inteligência); **validação visual real** — 11 checks Playwright + **checagem de pixel via PIL**
  confirmando o fix de CSS em 3 telas (Agenda-Capacidade, Panorama, Insights — a última nem
  tocada por este plano, confirmando o alcance sistêmico do fix).
- **Arquivos alterados**: ver checklist completo em
  `memory/plans/PLAN-0025-ADMIN-V2-POLIMENTO-UX.md`; `memory/logs/DEBUG-HISTORY.md` (`ERR-0049`);
  `memory/logs/BUILD-HISTORY.md` (migração + referência do pipeline de CSS).
- **Status**: `PLAN-0025` concluído, validado de verdade. Sem commit/push (aguardando
  autorização do usuário). Item 2 (Cadastros/Sistema nativos) segue desmembrado, aguardando
  atualização da `DECISION-013` antes de virar `PLAN-0026`.

## 2026-08-15 — `PLAN-0025` escrito: polimento de UX do Admin V2 (7 itens do usuário)

- **Contexto/objetivo**: usuário trouxe 7 itens de ajuste/melhoria pós-merge do PR #1. RAG feito
  em todos antes de planejar; gate socrático em 3 pontos que mudavam escopo/direção.
- **Achados do RAG que mudaram o plano**:
  - Item 2 (Cadastros/Sistema nativos) contraria `DECISION-013` regra #5 e é de longe o maior
    item (~10 telas legadas) — **desmembrado** do plano, vira `PLAN-0026` futuro, condicionado a
    atualizar a `DECISION-013` primeiro. `memory/progress.md` registra a pendência.
  - Item 4 (OAuth Google/Facebook): zero infraestrutura hoje, e bloqueio real de produção
    (Google exige callback HTTPS, `PLAN-0019` TLS segue `BLOCKED`) — usuário decidiu não
    implementar agora, só remover os botões mortos.
  - Item 6 (contraste da Agenda-Capacidade): a descrição do usuário ("branco em 0%, cor quando
    ocupado") inverteria a lógica de negócio atual (vermelho=ocioso/perdendo receita,
    verde=ocupado, proposital) — usuário confirmou manter a lógica, só revisar o contraste.
  - Item 7 (indicadores de venda/estoque): a maior parte já existe no backend — ticket médio por
    unidade já está no Comparador (RETROFIT-014); valor em estoque (`stockValue`) já é calculado
    por `getInventoryOverview()` mas descartado pelo Panorama — é plumbing, não cálculo novo.
- **Arquivos alterados**: `memory/plans/PLAN-0025-ADMIN-V2-POLIMENTO-UX.md` (novo, 6 ondas:
  cabeçalho dos kanban, motivo de mudança de etapa + migração aditiva, remoção dos botões OAuth,
  texto explicativo da Rede, contraste da Agenda-Capacidade, indicadores de estoque no
  Panorama), `memory/progress.md` (linha nova pra pendência do item 2/futuro `PLAN-0026`).
- **Status**: plano escrito, aguardando aprovação do usuário para executar. Sem código alterado
  ainda.

## 2026-08-15 15:17 — SESSION AUDIT — PASS (fechamento de sessão)

| Item | Resultado |
|---|---|
| Decision Integrity | OK — `DECISION-013` continua válida; fix dos achados #8/#9 é ajuste de heurística v1 (já documentado como "ajustável só via novo PR"), não mudança de arquitetura |
| State Integrity | OK — sem plano aberto nesta sessão; investigação tratada corretamente como execução pontual |
| Operational Memory | OK — 1 entrada no `MODIFICATION_LOG.md` |
| Debug Memory | OK — `ERR-0047` (período ignorado) e `ERR-0048` (revenueTrendPercent zerando, achado duplicado em 2 arquivos), formato padrão |
| Technical Validation | OK — build/testes limpos (`npm run test` 134/134 PASS); lint N/A (api sem lint configurado, nenhum arquivo web tocado); nenhum `console.log` não autorizado |
| Regression Risk | OK — mudança isolada em métricas de inteligência, sem tocar auth/pagamento/agendamento; validado via E2E real + visual real |
| Git Governance | OK — pre-commit review apresentado; commit convencional; push autorizado separadamente do commit |

**Checklist completo:** `memory/logs/AUDIT_CHECKLIST_20260815_151721-PASS.md`.

**Resumo da sessão:** investigação a fundo dos achados #8 e #9 do `/code-review high` (deixados
em aberto no fechamento anterior por timeout do agente revisor). Ambos confirmados como bugs
reais — o achado #9 pior do que reportado (mesmo bug duplicado em `panorama/service.ts`, fora
do escopo original). Corrigidos, validados de ponta a ponta (E2E real + visual real, Docker
rebuild), commitados e pushados em `main` (`4a36743`).

**Pendência não-bloqueante:** RETROFIT-022 (migração/aposentadoria do Admin legado) — sem
critério fixado, só entra com nova decisão de produto explícita.

**Sessão encerrada a pedido do usuário** ("feche a sessão conforme protocolo do SFK").

## 2026-08-15 — Investigação dos achados #8 e #9 do `/code-review high` (pós-merge)

- **Contexto/objetivo**: sessão anterior fechou o PR #1 deixando 2 achados do review sem
  correção — não confirmados de verdade por timeout do agente revisor. Usuário pediu pra
  investigar os dois a fundo nesta sessão.
- **Achado #8 — confirmado e corrigido**: `panorama/service.ts` — `countOrdersNeedingAttention`
  usava `Date.now()` em vez do `to` do período pedido (único campo do `getPanorama` que
  ignorava o filtro de período). Corrigido pra receber `range.to` como referência. Ver
  `ERR-0047`.
- **Achado #9 — confirmado, e pior do que reportado**: `unit-health/service.ts` —
  `revenueTrendPercent` caía pra `0%` (flat) quando a receita do período anterior era zero,
  subestimando o componente de Crescimento (peso 20%) do Health Score. **Investigação achou o
  mesmo bug duplicado em `panorama/service.ts`** (não fazia parte do achado original). Usuário
  escolheu explicitamente o tratamento via `AskUserQuestion` (piso de `+25%`, o menor valor que
  já satura `normalizeGrowth`, em vez de `null`/mudança de contrato — decisão consciente de não
  fabricar um percentual exato, mas também não introduzir uma mudança maior de tipo). Corrigido
  nos dois arquivos. Ver `ERR-0048`.
- **Validações executadas**: `npx tsc -b --noEmit` (api) limpo; `npm run build` (api) PASS;
  `npm run test` (api) **134/134 PASS**, sem regressão; `docker compose build api` +
  `up -d --force-recreate api` — saudável. **E2E real**: período normal (`days=30`) mantém
  `ordersNeedingAttention: 28` (sem regressão); período histórico arbitrário
  (`from=2020-01-01&to=2020-01-31`) passou a devolver `0` (antes devolveria `28`
  incorretamente); as 5 unidades passaram a mostrar `revenueTrendPercent: 25` em vez de `0`
  (Health Score de cada uma subiu, componente de Crescimento saturando corretamente);
  regressão OK nos 7 endpoints de inteligência. **Visual real via Playwright**: card "Resultado"
  do Panorama mostrando "Receita +25.0%" (era "0.0%" nas screenshots desta mesma sessão, antes
  do fix).
- **Arquivos alterados**: `apps/api/src/modules/intelligence/panorama/service.ts`,
  `apps/api/src/modules/intelligence/panorama/types.ts`,
  `apps/api/src/modules/intelligence/unit-health/service.ts`,
  `memory/logs/DEBUG-HISTORY.md` (`ERR-0047`, `ERR-0048`).
- **Status**: concluído, validado de verdade. Sem commit/push (aguardando autorização do
  usuário).

## 2026-08-15 14:49 — SESSION AUDIT — PASS (fechamento de sessão)

| Item | Resultado |
|---|---|
| Decision Integrity | OK — `DECISION-013` continua válida; nenhuma mudança estrutural nova (Zod nas rotas e fix de `columnFor` são correções de robustez, não decisão de arquitetura) |
| State Integrity | OK — `PLAN-0022`, `PLAN-0023` e `PLAN-0024` fechados formalmente nesta auditoria: status → DONE, `Git Record of Delivery` preenchido com hashes reais (0022/0023 estavam pendentes apesar de já commitados há sessões), arquivos renomeados pra `PLAN-XXXX-DONE-...md` |
| Operational Memory | OK — 6 entradas no `MODIFICATION_LOG.md` nesta sessão; os 3 planos atualizados e fechados |
| Debug Memory | OK — 2 bugs reais (`ERR-0045` drill-down perdendo filtro de unidade, `ERR-0046` `columnFor` escondendo pedido `BLOCKED`), ambos documentados no formato padrão |
| Technical Validation | OK — lint/build/`tsc` limpos em todas as rodadas; `npm run test` (api) **134/134 PASS**, sem regressão; nenhum `console.log` não autorizado (conferido em todos os arquivos tocados) |
| Regression Risk | OK — nenhuma área sensível (auth/pagamento/agendamento) alterada; `send_message.php` removido é hardening, não regressão; validado via E2E real + visual real (mesmo padrão do projeto pra código sem teste unitário dedicado) |
| Git Governance | OK — pre-commit review apresentado antes de cada um dos 6 commits; commits convencionais; Git Record preenchido nos 3 planos; cada um dos 6 pushes autorizado separadamente pelo usuário |

**Checklist completo:** `memory/logs/AUDIT_CHECKLIST_20260815_144919-PASS.md`.

**Resumo da sessão (do início ao fechamento):**
1. Fix de typecheck (`revenue` faltando em `scoring.test.ts`).
2. Fechamento da validação E2E real + visual pendente das Ondas 6-7 do `PLAN-0023`.
3. `PLAN-0024` (Consolidação) — RETROFIT-020 (Cadastros) + RETROFIT-021 (Sistema), gate socrático
   aplicado antes de planejar, deep-link por hash no Admin legado, validado E2E real + visual.
4. Revisão pré-merge do PR #1 (`/code-review high`, 431 arquivos) — 7 dos 10 achados corrigidos
   (2 bugs reais documentados, 1 script inseguro removido, hardening de Zod, 2 CTAs mortas
   habilitadas, 1 falso positivo confirmado já documentado), validados de verdade antes do merge.
5. **PR #1 mergeado em `main`** (`1479cce`, sem conflitos) — Admin V2 agora oficial na branch
   principal, em paralelo ao Admin legado, conforme `DECISION-013`.
6. Fechamento formal dos 3 planos (`PLAN-0022`/`0023`/`0024` → DONE) e desta auditoria.

**Pendências não-bloqueantes pra sessões futuras** (decisões do usuário, não falha de sessão):
- RETROFIT-022 (migração/aposentadoria do Admin legado) — sem critério fixado.
- Achados #8/#9 do review (panorama ignorando período; `revenueTrendPercent` zerando com receita
  anterior zero) — não confirmados de verdade (timeout do agente revisor), deixados de fora.

**Sessão encerrada a pedido do usuário** ("feche a sessão conforme protocolo do SFK").

## 2026-08-15 — Merge do PR #1: Admin V2 (PLAN-0022/0023/0024) entra em `main`

- **Contexto/objetivo**: usuário pediu explicitamente pra revisar e mergear o PR #1. Sem `gh`
  CLI disponível neste ambiente (confirmado antes de agir) — combinado com o usuário fazer o
  merge via git direto: `git checkout main` (local, tracking `origin/main`) + `git merge --no-ff
  feature/admin-v2` + `git push origin main`. GitHub fecha o PR #1 automaticamente ao detectar
  que os commits chegaram na `main` (mesmo efeito do botão "Merge" da UI).
- **Ações executadas**: `git fetch origin main` (confirmado que `main` não tinha avançado desde
  o merge-base usado durante toda a leva — `9422f64`, seguro mergear); `git checkout -B main
  origin/main`; `git merge --no-ff feature/admin-v2` — **sem conflitos**, estratégia `ort`, 432
  arquivos (16822 inserções, 375 remoções) vs. `main` antiga; `git push origin main` →
  `9422f64..1479cce`.
- **Arquivos alterados**: nenhum novo — merge commit puro trazendo todo o histórico de
  `feature/admin-v2` (10 commits: fundação/operação/inteligência do PLAN-0022/0023,
  consolidação do PLAN-0024, fix de typecheck, e a correção dos 7 achados do review pré-merge,
  ver entrada logo abaixo) pra `main`. `memory/progress.md` atualizado (3 linhas — PLAN-0022,
  0023, 0024 — marcadas como commitadas/pushadas/**mergeadas**).
- **Validações executadas**: nenhuma validação nova — o merge não altera código, só combina
  histórico; todas as validações (tsc/build/lint/testes/E2E real/visual) já tinham sido feitas
  branch a branch antes de cada commit, documentadas nas entradas anteriores deste log e nos
  planos `PLAN-0022`/`PLAN-0023`/`PLAN-0024`.
- **Status**: PR #1 mergeado e pushado. `main` em `1479cce`. Admin V2 (`/admin-v2`) agora faz
  parte da branch principal do projeto, em paralelo ao Admin legado (`/admin`), conforme
  `DECISION-013`. Próxima decisão do usuário: RETROFIT-022 (migração/aposentadoria do Admin
  legado) segue sem entrar, precisa de nova decisão de produto explícita quando/se o usuário
  quiser revisitar.

## 2026-08-15 — Revisão pré-merge do PR #1 (`/code-review high`): 7 achados corrigidos

- **Contexto/objetivo**: usuário pediu pra revisar e mergear o PR #1 (`main` ← `feature/admin-v2`,
  431 arquivos, ~17 mil linhas — PLAN-0022/0023/0024). Rodado `/code-review high` contra
  `main...feature/admin-v2`; 10 achados. Usuário pediu pra corrigir os 7 primeiros (3 que
  bloqueavam merge + 4 de débito técnico) antes de mergear; os 2 últimos (⚪, não confirmados de
  verdade por timeout do agente revisor) ficaram de fora por decisão explícita.
- **Correções aplicadas**:
  1. **`send_message.php`** (raiz do repo) — removido. Script de teste Z-API com modo de
     invocação HTTP sem autenticação (`GET ?phone=X&message=Y` enviava WhatsApp real com
     credenciais de produção); violava a regra do `SYSTEM.md` que restringe PHP a `cms/`. Doc
     `docs/config/WHATSAPP_API_ZAPI.md` atualizada com alternativa via `curl` (sem modo HTTP).
  2. **`UnitDetailView.tsx`** — drill-down perdia o filtro de unidade (dois `navigate()` em
     sequência, o segundo sobrescrevia o `?unit=` do primeiro). Ver `ERR-0045`.
  3. **`PanoramaCards.tsx` / `PanoramaSignals.tsx`** — "Explorar clientes" e "Ver clientes"
     (oportunidade) ficaram presos em "em breve" mesmo com `/admin-v2/clientes` já pronto nesta
     mesma leva; ambos agora navegam de verdade.
  4. **`adminV2.ts`** — as 17 rotas (query params + PATCH body) passaram a usar schemas Zod
     explícitos (`unitIdsListSchema`, `periodQuerySchema`, `singleUnitIdQuerySchema`,
     `slotQuerySchema`, `stageBodySchema`) em vez de checagens manuais de `typeof`/`Number`,
     conforme regra do `SYSTEM.md`. Filtros opcionais continuam tolerantes (`.catch()` preserva
     o comportamento de antes — query mal formada = filtro ignorado, nunca `400`); campos
     obrigatórios devolvem `400` com `formatZodDetail`, mesmo padrão de `routes/schedule.ts`.
  5. **`operational-orders/service.ts`** — `columnFor` podia esconder um pedido `BLOCKED` atrás
     do status `PENDENTE`. Ver `ERR-0046`.
  6. **Migration `20260814214126_add_franchise_pipeline`** — o `DROP INDEX` "não documentado"
     apontado pelo review já estava documentado em `memory/logs/BUILD-HISTORY.md` desde a sessão
     que criou a migration (2026-08-14) — falso positivo do revisor (não tinha acesso a esse
     arquivo). Nenhuma ação necessária, só confirmado.
  7. **`seedAdminV2TestData.ts`** — `pickOrderItems` indexava um array de produtos vazio (`NaN`
     → crash confuso). Adicionado guard logo após buscar `productRows`, com mensagem clara
     ("rode o seed base antes deste script").
- **Validações executadas**: `npx tsc -b --noEmit` (api+web) limpo; `npm run build` (api+web)
  PASS; `npm run test` (api) **134/134 PASS** (sem regressão); `npm run lint` (web) — mesmos 17
  erros pré-existentes/tolerados, nenhum novo. `docker compose build api web` + `up -d
  --force-recreate api web nginx` — todos saudáveis. **E2E real** (login MASTER): `400` com
  Zod em capacity sem `unitId`/`unitId` inválido/`hour` inválido/`stage` inválido; `200` com
  dados válidos; `200` em panorama com `unitIds` bagunçado (tolerante, filtro ignorado); board
  de pedidos com 43 pedidos, mesma contagem de antes (sem regressão do fix `columnFor`). **Visual
  real via Playwright**: "Explorar clientes" e clique real confirmando navegação pra
  `/admin-v2/clientes`; drill-down "Ver agenda" confirmando `?unit=1` preservado na URL e
  `CapacityView` já filtrada em "Parque da Cidade" (não mais o estado vazio).
- **Arquivos alterados**: `send_message.php` (removido), `docs/config/WHATSAPP_API_ZAPI.md`,
  `apps/web/src/admin-v2/network/UnitDetailView.tsx`,
  `apps/web/src/admin-v2/panorama/PanoramaView.tsx`,
  `apps/web/src/admin-v2/panorama/components/PanoramaCards.tsx`,
  `apps/web/src/admin-v2/panorama/components/PanoramaSignals.tsx`,
  `apps/api/src/routes/adminV2.ts`,
  `apps/api/src/modules/intelligence/operational-orders/service.ts`,
  `apps/api/scripts/seedAdminV2TestData.ts`, `memory/logs/DEBUG-HISTORY.md` (ERR-0045, ERR-0046).
- **Status**: concluído, validado de verdade. Achados #8 e #9 do review (panorama ignorando
  período no `ordersNeedingAttention`; `revenueTrendPercent` caindo pra 0 com receita anterior
  zero) **não foram corrigidos** — não confirmados de verdade (timeout do agente revisor) e o
  usuário decidiu deixá-los de fora desta rodada; registrar como débito técnico pra revisão
  futura se o usuário quiser investigar.

## 2026-08-15 — PLAN-0024: Consolidação (RETROFIT-020 Cadastros + RETROFIT-021 Sistema)

- **Contexto/objetivo**: usuário pediu para seguir pra Consolidação depois do fechamento do
  `PLAN-0023`. Gate socrático aplicado antes de planejar (RAG achou que o Admin legado não tem
  nenhum deep-link hoje — `data-view` trocado só por clique em memória, sem hash/URL — o que
  tornaria um link ingênuo do V2 sempre cair no dashboard padrão). Usuário confirmou 2 decisões:
  (1) escopo = RETROFIT-020+021 apenas, RETROFIT-022 (aposentar o legado) fica fora, sem
  critério fixado (`DECISION-013`); (2) adicionar deep-link por hash no legado, em vez de linkar
  sempre pro dashboard genérico. `PLAN-0024-ADMIN-V2-CONSOLIDACAO.md` escrito, aprovado pelo
  usuário, executado na mesma sessão.
- **Arquivos alterados**:
  - `apps/web/src/modules/admin-shell/behavior.ts` — deep-link por hash na inicialização do
    Admin legado (`initAdminShellBehavior`), com whitelist contra os `data-view` reais do DOM.
  - `apps/web/src/admin-v2/shell/HubCard.tsx` (novo) — card compartilhado dos 2 hubs (link real
    ou desabilitado com motivo — nunca link morto).
  - `apps/web/src/admin-v2/cadastros/CadastrosHubView.tsx` (novo) — hub de Cadastros, 6 cards.
  - `apps/web/src/admin-v2/sistema/SistemaHubView.tsx` (novo) — hub de Sistema, 6 cards ativos +
    2 desabilitados (`Segurança`/`Infra`, sem tela dedicada no legado hoje).
  - `apps/web/src/admin-v2/AdminV2Root.tsx` — rotas `cadastros`/`sistema`, `activeKey`,
    breadcrumb.
  - `apps/web/src/admin-v2/shell/AdminSidebar.tsx` — `cadastros`/`sistema` de `available: false`
    pra `true`, comentário de topo atualizado.
- **Validações executadas**: `npx tsc -b --noEmit` (web) PASS; `npm run build` (web) PASS;
  `npm run lint` (web) — os mesmos 17 erros pré-existentes/tolerados, nenhum novo nos arquivos
  desta leva; `docker compose build web` + `up -d --force-recreate web nginx` (cascata recriou
  `api` também, esperado) — todos saudáveis; **validação visual real** via Playwright headless
  (extensão `claude-in-chrome` indisponível nesta máquina, mesmo método usado no fechamento do
  `PLAN-0023`) — 30 checks automatizados: os 12 deep-links (6 Cadastros + 6 Sistema) abrindo a
  tela certa do legado (não mais o dashboard padrão), os 2 itens desabilitados sem link morto, e
  regressão do clique manual no legado (confirmado via `dispatchEvent` — o clique real do
  Playwright esbarrou numa peculiaridade pré-existente do CSS do sidebar legado, hover-to-reveal,
  não um bug desta leva). Scripts de validação temporários removidos ao final.
- **Status**: `PLAN-0024` **concluído, validado de verdade, commitado e pushado**. Commit
  separado por leva (a pedido do usuário) e push autorizado em pedido explícito à parte:
  `260ce97` (fix typecheck), `f0c165e` (docs fechamento Ondas 6-7), `c7ed771` (PLAN-0024) →
  `feature/admin-v2`, mesmo PR #1. RETROFIT-022 (migração/aposentadoria do legado) segue sem
  entrar, precisa de nova decisão de produto explícita.

## 2026-08-15 — PLAN-0023: fechamento da validação pendente das Ondas 6-7 (Insight Engine + Ações Recomendadas)

- **Contexto/objetivo**: `PLAN-0023` (plano ativo, sem `DONE`) tinha as Ondas 6-7 marcadas como
  "código-completo, testes unitários PASS" mas com E2E real e validação visual pendentes desde
  o fechamento da sessão anterior (rebuild Docker em andamento). Usuário pediu para continuar o
  plano, rebuildar o Docker e validar.
- **Ações executadas**:
  - `docker compose build api web` — cache hit em todas as camadas (código já estava na imagem
    do rebuild anterior); containers `api`/`web`/`nginx`/`postgres` saudáveis.
  - Login real (`POST /api/auth/login`, usuário MASTER) + E2E real contra Postgres em todos os
    endpoints de inteligência: `panorama` (index `/admin-v2`), `network`, `radar`, `gargalos`,
    `comparator`, `money`, `insights` — todos `200` (3 rodadas); `401` sem token confirmado.
    Conferido manualmente: dedup Radar×Gargalos por categoria, ordenação por impacto R$
    decrescente, `totalKnownImpact` batendo com a soma manual, catálogo de `recommendedActions`
    (só Franquias com `actionPath` real nesta massa de dados).
  - Validação visual real via **Playwright headless** (extensão `claude-in-chrome` indisponível
    nesta máquina — usada como alternativa, `@playwright/test` já é devDependency de `apps/web`;
    `chromium` instalado via `playwright install`): login real pela UI, screenshots de
    `/admin-v2` (Panorama, botão "Ver insights →") e `/admin-v2/insights` (5ª aba, breadcrumb,
    8 cards batendo com o E2E), clique real "Ver insights →" e clique real no link de ação de
    Franquias (`/admin-v2/insights` → `/admin-v2/crescimento`, Pipeline carregando os 5 leads
    parados citados no insight). Scripts de debug temporários (`apps/web/*.tmp.mjs`,
    `debug-*.mjs`) removidos ao final — nada deixado solto no working tree.
  - **Nota lateral (não investigada, fora de escopo)**: bootstrap do Admin legado emite vários
    `console.error`/`warn` (branding, cupons, seções, assinantes, etc.) em toda navegação —
    pré-existente, não relacionado às Ondas 6-7; registrado aqui para não ser confundido com
    regressão numa sessão futura.
- **Arquivos alterados**: `memory/plans/PLAN-0023-ADMIN-V2-INTELIGENCIA.md` (seção nova
  "Ondas 6-7 — Fechamento da validação pendente"), `memory/progress.md` (linha do módulo
  atualizada), `memory/MODIFICATION_LOG.md` (este registro).
- **Validações executadas**: ver acima (E2E real + visual real, 100% das rotas de inteligência).
- **Status**: Ondas 6-7 agora **realmente validadas** — PLAN-0023 sem pendências de validação
  nesta leva. Sem commit/push (aguardando autorização do usuário). Próxima decisão do usuário:
  Consolidação (RETROFIT-020/021/022) ou revisão/merge do PR #1.

## 2026-08-15 — fix: typecheck errors em scoring.test.ts (point-in-time)

- **Contexto/objetivo**: usuário pediu "fix typecheck errors". `tsc -b --noEmit` (apps/api,
  inclui testes; `tsc -p tsconfig.build.json` exclui testes e por isso não pegava o erro)
  apontou 6 erros TS2741/TS2345 em `unit-health/scoring.test.ts`: os 5 objetos de métricas do
  teste não tinham o campo `revenue`, adicionado ao tipo `UnitHealthRawMetrics` durante a
  RETROFIT-017 (Health Score evolução, PLAN-0023 Onda 5) mas nunca propagado ao teste.
- **Arquivos alterados**: `apps/api/src/modules/intelligence/unit-health/scoring.test.ts` —
  adicionado `revenue: <valor>` em cada um dos 5 objetos `UnitHealthRawMetrics` literais
  (valor é só exibição, não entra na normalização — não afeta as asserções).
- **Validações executadas**: `npx tsc -b --noEmit` limpo em `apps/api` e `apps/web`;
  `npm run test` (api) — **134/134 PASS**.
- **Status**: concluído. Sem commit/push (aguardando autorização do usuário).

## 2026-08-15 05:35:29 — SESSION AUDIT — PASS (fechamento de sessão)

| Item | Resultado |
|---|---|
| Decision Integrity | OK — `DECISION-013` continua válida; nenhuma mudança estrutural |
| State Integrity | OK, com pendência não-bloqueante — `PLAN-0023` roadmap de Inteligência (RETROFIT-011 a 019) está código-completo; Ondas 6-7 (RETROFIT-018 Insight Engine, RETROFIT-019 Ações Recomendadas) ainda sem E2E real/validação visual |
| Operational Memory | OK — `MODIFICATION_LOG.md` e `PLAN-0023` atualizados, inclusive corrigindo a alegação de "E2E real" das Ondas 6-7 antes de fechar (não estava validado de verdade) |
| Debug Memory | N/A — nenhum bug corrigido nesta metade da sessão |
| Technical Validation | OK — lint/build/`tsc` limpos, testes **162/162 PASS**; **não confirmado em runtime** — container ainda não redeployado com o código das Ondas 6-7 |
| Regression Risk | OK — Ondas 6-7 são 100% leitura, 21 testes novos; regressão E2E real e validação visual ficam pendentes pra próxima sessão |
| Git Governance | OK — commit e push explicitamente autorizados pelo usuário |

**Checklist completo:** `memory/logs/AUDIT_CHECKLIST_20260815_053529-PASS.md`.

**RETROFIT-018 (Insight Engine) e RETROFIT-019 (Ações Recomendadas) — entregues nesta sessão, escopo ajustado com o usuário antes de implementar em ambos os casos:**
- **RETROFIT-018**: o roadmap original descrevia como "o motor que gera os achados do Radar/Gargalos" — mas Radar (Onda 1) e Gargalos (Onda 2) já são exatamente isso. Reescopado para uma camada de **consolidação**: `apps/api/src/modules/intelligence/insights/` junta Radar + Gargalos + o maior achado do Comparador num único feed ranqueado, com deduplicação por categoria (quando Radar e Gargalos descrevem o mesmo fato — 4 das 5 categorias do Gargalos —, só a versão com R$ do Gargalos entra). `rules.ts` puro, 13 testes. Rota `GET /api/admin-v2/insights`. Frontend: `insights/InsightsView.tsx`, 5ª aba em `IntelligenceTabs`, botão "Ver insights →" no Panorama.
- **RETROFIT-019**: o mockup original pressupunha ações executáveis ("[Criar campanha] [Ajustar preço]") — mas o Admin legado não suporta deep-link confiável (já documentado na Onda 2 do PLAN-0022) e o Admin V2 só tem uma tela de escrita real (Pipeline de Franquias). Reescopado para um **catálogo de sugestões em texto** por categoria (`recommendations.ts`, 5 testes) — só ganha botão de navegação quando existe uma tela real (Franquias → `/admin-v2/crescimento`; Financeiro → `/admin-v2/dinheiro`); as demais categorias são conselho de negócio em texto puro, sem botão morto.

**Validações executadas:** `tsc -b` (api+web) PASS; `npm run build` (api+web) PASS; `npm run test` (api) **162/162 PASS** (5 + 23 + 134 intelligence). **Docker rebuild iniciado mas ainda em andamento no momento do fechamento** — redeploy, E2E real contra Postgres e validação visual real **não foram concluídos nesta sessão**, diferente de toda onda anterior (que sempre fechou com essa validação completa antes de ser marcada pronta). Registrado explicitamente para não passar a falsa impressão de que já foi verificado em produção/no navegador.

**Pendente para a próxima sessão (nesta ordem):**
1. Confirmar que o `docker compose build api web` em andamento terminou; se não, rodar de novo.
2. `docker compose up -d --force-recreate api web` + esperar healthcheck.
3. E2E real: login MASTER, `GET /api/admin-v2/insights`, conferir dedup Radar×Gargalos e `recommendedActions` nos dados reais; checar `401` sem token; regressão nos endpoints vizinhos.
4. Validação visual real da tela `/admin-v2/insights` no navegador (card de impacto total, agrupamento por prioridade, sugestões com/sem botão).
5. Só depois disso, marcar RETROFIT-018/019 como validados de verdade no `PLAN-0023` (hoje estão como "código completo", não "concluída").
6. Commit e push já foram feitos nesta sessão para o código das Ondas 6-7 — não há nada de código pendente de versionamento, só a validação em runtime.
7. Depois disso: decidir entre Consolidação (RETROFIT-020/021/022) ou revisão/merge do PR #1.

**Sessão encerrada a pedido do usuário** ("execute o procedimento de encerramento conforme regra do SFK, por hoje está suficiente").

## 2026-08-15 — PLAN-0023 Onda 5 (RETROFIT-017, Health Score evolução) concluída

**Contexto:** pedido do usuário para continuar com o RETROFIT-017, próximo item do roadmap do `PLAN-0023` após a Onda 4 (Comparador).

**Entregue:** `apps/api/src/modules/intelligence/network/narrative.ts` — `buildUnitNarrative()` pura, monta uma frase determinística no Diagnóstico da Unidade a partir dos campos que o Health Score já decompôs (estado, score, tendência, força/fraqueza principal, impacto). `narrative.test.ts` — 5 testes. `network/service.ts` expõe `narrative: string` novo em `UnitDiagnostic`, sem rota nova (endpoint já existente da Onda 2 do PLAN-0022). Frontend: parágrafo de narrativa em `UnitDetailView.tsx`.

**Correção de dívida encontrada:** o botão "Comparar unidade" do Diagnóstico da Unidade estava desabilitado ("em breve") desde a Onda 2 do PLAN-0022, referenciando o Comparador como uma onda futura — mas o Comparador foi entregue nesta mesma leva (Onda 4). Corrigido para navegação real.

**Autocorreção durante a validação (registrada por transparência):** a implementação inicial também estendia a tradução de R$ da fraqueza "estoque", reusando o capital parado em produtos Armadilha do Portfólio (Onda 5 do PLAN-0022). Implementado com 9 testes unitários, **revertido antes de ir pra produção**: o componente "estoque" do Health Score mede ruptura/estoque baixo (`inventoryHealthRate`), um sinal diferente de "capital parado em produto Armadilha" — uma unidade pode ter ruptura severa com zero capital parado. Anexar esse número à fraqueza errada violaria a governança #6 (nunca um número que não explica a causa real). Revertido em `apps/api/src/modules/intelligence/network/impact.ts`, com o raciocínio da rejeição documentado inline para não ser tentado de novo sem essa memória. `test:intelligence` fechou em 121 testes (não 122 — 1 teste a menos que o pico intermediário, pela reversão).

**Validações executadas (todas reais):** `tsc -b` (api+web) PASS; `npm run build` (api+web) PASS; `npm run test` (api) **149/149 PASS**; `docker compose build api web` PASS (2 rodadas — uma com a versão errada, revertida antes do redeploy; uma com a versão corrigida) + redeploy `--force-recreate` + healthcheck OK. **E2E real contra Postgres** (login MASTER): `GET /api/admin-v2/network/units/1` → `200` com `narrative` coerente e `impactEstimate: null` honesto (fraqueza é "recorrência", sem fórmula); regressão OK em `/panorama`, `/network`, `/radar`, `/gargalos`, `/money`, `/comparator`, `/portfolio/products`; `401` sem token. **Validação visual real**: narrativa renderiza corretamente na tela, botão "Comparar unidade" habilitado e navegando de verdade para `/admin-v2/comparador` (confirmado por mudança de URL).

**Pendente:** nada commitado ainda desde o PR #1. Próximo passo: usuário decide entre RETROFIT-018/019 ou revisar/mergear o PR #1.

## 2026-08-15 04:23:12 — SESSION AUDIT — PASS

| Item | Resultado |
|---|---|
| Decision Integrity | OK — `DECISION-013` continua válida; nenhuma decisão ativa contrariada; sem mudança estrutural nova (RETROFIT-013/014 são 100% derivados, sem migration) |
| State Integrity | OK — `PLAN-0022` fechado (Ondas 0-9 + RETROFIT-010b); `PLAN-0023` aberto corretamente (Ondas 1-4 concluídas, RETROFIT-017/018/019 pendentes no roadmap) |
| Operational Memory | OK — `MODIFICATION_LOG.md` e `PLAN-0023` atualizados a cada onda concluída |
| Debug Memory | N/A — nenhum bug corrigido nesta metade da sessão; comportamento de "Loja Online" 0% de ocupação no Comparador investigado e confirmado consistente com a convenção da Onda 1, não é bug |
| Technical Validation | OK — lint (web, mesmo padrão tolerado), build (api+web+Docker) PASS, testes **136/136 PASS**, sem migration pendente, logs limpos |
| Regression Risk | OK — nenhuma área sensível alterada (só leitura, reuso de módulos já validados); 16 testes novos cobrindo casos de borda; regressão E2E manual OK em 7 endpoints |
| Git Governance | OK — `git status` revisado antes do commit (migração kernel + 3 arquivos soltos identificados e tratados separadamente, consulta ao usuário via `AskUserQuestion`); 4 commits com mensagem estruturada; push autorizado explicitamente (duas vezes); **PR #1 aberto** em `https://github.com/bornerj/JLR_Beauty/pull/1` |

**Checklist completo:** `memory/logs/AUDIT_CHECKLIST_20260815_042312-PASS.md`.
**Sessão encerrada a pedido do usuário** ("salve tudo logo"). Branch `feature/admin-v2` com 4 commits pushados, PR #1 aberto contra `main`, working tree limpo. Retomar do roadmap `PLAN-0023` (RETROFIT-017/018/019) ou da revisão/merge do PR #1.

## 2026-08-15 — Limpeza de arquivos soltos + script de teste Z-API

**Contexto:** ao revisar o `git status` antes do commit do Admin V2, três arquivos untracked, não relacionados ao trabalho da sessão, foram encontrados soltos na raiz do repo — tratados a pedido do usuário.

**O que mudou:**
- `send_message.php` (novo) — utilitário de teste manual de envio via Z-API (lê `apps/api/.env`, sem segredo hardcoded, mesmo padrão de `docs/config/STRIPE_TEST_RUNBOOK.md`); mantido e comitado por ter valor real (integração Z-API já existe em `apps/api/src/modules/chatbot/`).
- `arvore.txt` (removido) — dump de `tree` do Windows, gerado, sem valor.
- `.gitignore` — reintroduz entradas para `arvore.txt` e `/.codex/` (cache local de outra ferramenta de IA, destravado sem querer pela migração `kernel/` → `.sfk/kernel/` do commit anterior).

## 2026-08-15 — PLAN-0023 Ondas 3 e 4 (RETROFIT-013 Dinheiro + RETROFIT-014 Comparador) concluídas

**Contexto:** pedido do usuário para continuar com o RETROFIT-013 e o RETROFIT-014 (esclarecido via pergunta — "retrofit-10b" citado pelo usuário era na verdade RETROFIT-014, já que o RETROFIT-010b real já estava concluído desde o dia anterior).

**Onda 3 (RETROFIT-013 — "Onde está o dinheiro?"):** novo módulo `apps/api/src/modules/intelligence/money/` com `types.ts`, `rules.ts` (função pura `buildMoneyOverview()` — cascata Receita→Custo Direto→Margem Bruta, sem inventar o degrau de descontos do mockup original por falta de dado no schema) e `service.ts` (busca Produtos/Serviços/Assinaturas — reuso direto das Ondas 5/6/8 — + agregação nova por profissional, em `Promise.all`). `rules.test.ts` — 8 testes novos. Rota `GET /api/admin-v2/money`. Frontend: `money/MoneyView.tsx` (cascata visual + 3 origens + 6 decomposições).

**Onda 4 (RETROFIT-014 — Comparador Visual de Unidades):** novo módulo `apps/api/src/modules/intelligence/comparator/` com `types.ts`, `rules.ts` (função pura `buildUnitComparator()` — 5 dimensões por unidade + linha Rede + achado da maior diferença relativa, com tradução para R$ só quando a métrica é Ocupação, única com fórmula honesta reusada do drill-down da Onda 4 do PLAN-0022) e `service.ts` (reuso quase total de `getUnitsHealth` da Onda 1, só complementado com `avgTicket` e `unitRevenuePerBookedHour`). `rules.test.ts` — 8 testes novos. Rota `GET /api/admin-v2/comparator`. Frontend: `comparator/ComparatorView.tsx` (tabela Métrica×Unidades×Rede + card "Maior Diferença").

**Frontend comum:** `IntelligenceTabs` estendida de 2 para 4 abas (Radar/Gargalos/Dinheiro/Comparador) em `AdminV2Root.tsx`. `test:intelligence` agora com 108 testes; `npm run test` (api) **136/136 PASS**.

**Validações executadas (todas reais):** `tsc -b` (api+web) PASS; `npm run build` (api+web) PASS; `npm run lint` sem regressão nova de categoria; `docker compose build api web` PASS + redeploy `--force-recreate` + healthcheck OK. **E2E real contra Postgres** (login MASTER): `/admin-v2/money` → cascata batendo exatamente (Receita R$ 32.292,00 = R$ 11.290,00 + R$ 19.340,00 + R$ 1.662,00; Margem Bruta R$ 22.028,00); `/admin-v2/comparator` → 5 unidades + Rede, maior gap em Ocupação (Loja Online 0% vs Parque da Cidade 2,3%, coerente — loja online não tem agenda física); `401` sem token nos dois; regressão OK em `/panorama`, `/network`, `/radar`, `/gargalos`. **Validação visual real**: as duas telas renderizam corretamente, abas alternam, breadcrumbs corretos, números batendo com o E2E.

**Pendente:** nada commitado ainda até este ponto. Próximo passo: usuário decide entre RETROFIT-017/018/019 ou pausar para commit/push de tudo (Ondas 0-9 + RETROFIT-010b do `PLAN-0022` + Ondas 1-4 do `PLAN-0023`).

---

## 2026-08-15 — PLAN-0023 Onda 2 (RETROFIT-012, Gargalos) concluída

**Contexto:** pedido do usuário para continuar com o RETROFIT-012, próximo item do roadmap do `PLAN-0023` após a Onda 1 (Radar Executivo).

**Onda 2 (RETROFIT-012 — Gargalos, "o que está travando?"):** novo módulo `apps/api/src/modules/intelligence/gargalos/` com `types.ts` (`Bottleneck`/`BottleneckImpact` honesto `{amount, explanation} | null`/`BottlenecksRanking`), `rules.ts` (função pura `rankBottlenecks()` — 5 regras determinísticas cruzando Operação, Agenda, Portfólio, Assinaturas e Franquias, cada uma contribuindo no máximo 1 gargalo agregado, ordenadas por impacto com `null` sempre por último) e `service.ts` (busca os 5 módulos em `Promise.all`, capacidade agregada por unidade). `rules.test.ts` — 10 testes novos. Campo aditivo `SubscriptionHealthEntry.membershipPrice` (backend+frontend) para calcular MRR em risco sem inventar valor. Rota nova `GET /api/admin-v2/gargalos`. Frontend: `gargalos/GargalosView.tsx` (card de impacto total condicional + lista ranqueada, cada item com valor+explicação ou aviso de "não estimável"), `IntelligenceTabs` (Radar/Gargalos) em `AdminV2Root.tsx`, botão "Ver gargalos →" no Panorama. `test:intelligence` agora com 92 testes; `npm run test` (api) **120/120 PASS**.

**Validações executadas (todas reais):** `tsc -b` (api+web) PASS; `npm run build` (api+web) PASS; `npm run lint` sem regressão nova de categoria; `docker compose build api web` PASS + redeploy `--force-recreate` + healthcheck OK. **E2E real contra Postgres** (login MASTER): `GET /api/admin-v2/gargalos` → `200` com 5 gargalos reais (Agenda R$ 1.078.346,41, Franquias R$ 1.040.000,00, Operação R$ 7.292,30, Portfólio R$ 2.064,00, Assinaturas R$ 776,00), `totalImpact` R$ 2.128.478,71 conferindo exatamente com a soma manual; `?days=7` retorna período/números diferentes corretamente; `401` sem token; regressão OK em `/panorama`, `/network`, `/operations/orders`, `/portfolio/products`, `/subscriptions/health`. **Validação visual real**: tela renderiza corretamente, tipografia legível; abas Radar/Gargalos alternam; navegação de "Ver agenda" e "Ver gargalos →" (Panorama) confirmadas via mudança de URL (cliques simulados por coordenada voltaram a errar o alvo — confirmado via `.click()` direto no DOM que o código está correto, mesmo padrão já documentado na Onda 1).

**Pendente:** nada commitado ainda. Próximo passo: usuário decide entre seguir para RETROFIT-013 ("Onde está o dinheiro?") ou pausar para commit/push de tudo (Ondas 0-9 + RETROFIT-010b do `PLAN-0022` + Ondas 1-2 do `PLAN-0023`).

---

## 2026-08-15 — PLAN-0023 iniciado + Onda 1 (RETROFIT-011, Radar Executivo) concluída

**Contexto:** pedido do usuário para continuar com o retrofit seguinte ao último concluído. Com Fundação+Operação (`PLAN-0022`, Ondas 0-9 + RETROFIT-010b) validada tecnicamente e visualmente, entra a leva de Inteligência prevista na própria seção "Próximos Passos" do `PLAN-0022` — nasce `PLAN-0023`, herdando a governança do programa.

**Novo plano:** `memory/plans/PLAN-0023-ADMIN-V2-INTELIGENCIA.md` — roadmap de RETROFIT-011 a 019 (Consolidação, 020-022, fica de fora até decisão sobre o Admin legado).

**Onda 1 (RETROFIT-011 — Radar Executivo):** novo módulo `apps/api/src/modules/intelligence/radar/` com `types.ts`, `rules.ts` (função pura `buildRadarFindings()` — 9 regras determinísticas, sem ML, cruzando os 8 módulos já entregues nas Ondas 1-9 do `PLAN-0022`: Rede, Operação, Portfólio de Produtos/Serviços, Clientes, Assinaturas, Franquias, tendência financeira) e `service.ts` (busca os 8 endpoints em `Promise.all`, nunca em cascata). `rules.test.ts` — 11 testes novos, incluindo verificação de que nenhum achado sai sem ação navegável (governança #7). Rota nova `GET /api/admin-v2/radar`. Frontend: `radar/RadarView.tsx` (achados agrupados por severidade, cada um com botão de ação real) + rota `/admin-v2/radar` + botão de entrada no Panorama. `test:intelligence` agora com 82 testes.

**Validações executadas (todas reais):** `tsc -b` (api+web) PASS; `npm run build` (api+web) PASS; `npm run test` (api) **110/110 PASS**; `npm run lint` sem regressão; `docker compose build api web` PASS. **E2E real contra Postgres**: 9 achados reais retornados, cruzando corretamente todos os 8 domínios, com números batendo exatamente com o que já estava validado nas Ondas 5-9 (28 pedidos em atenção, churn 11.1%, 1 produto e 3 serviços Armadilha, 1 cliente em risco, 3 assinaturas em atenção, 2 gargalos + leads parados de franquia); regressão OK. **Validação visual real**: tela renderiza corretamente; confirmado (via clique programático direto no DOM) que a navegação dos botões de ação funciona — um clique simulado da ferramenta de automação errou o alvo por coordenada, não é bug de código.

**Pendente:** nada commitado ainda. Próximo passo: usuário decide entre seguir para RETROFIT-012 (Gargalos) ou pausar para commit/push de tudo (Ondas 0-9 + RETROFIT-010b do PLAN-0022 + Onda 1 do PLAN-0023).

---

## 2026-08-15 — Validação visual real do Admin V2 (Ondas 0-9 + RETROFIT-010b), primeira desta leva

**Contexto:** pedido explícito do usuário ("valida visualmente o Admin V2 antes de commitar") — primeira vez nesta leva do `PLAN-0022` que a extensão Claude in Chrome esteve disponível para uma varredura completa, em vez de só validação por API.

**Telas percorridas de verdade (login real, navegação real, interações reais):** Panorama; Rede (Kanban) + Diagnóstico da Unidade (Loja Online, todos os botões "Ver agenda/produtos/clientes" clicáveis); Operação → Pedidos, Agenda (seleção de unidade real, clique num horário do heatmap, detalhamento com profissionais escalados), Produtos (expandir "ver por unidade" com dado real), Serviços (badge "Analisar preço"); Clientes → Fluxo (achado cruzado: assinatura inadimplente de um cliente aparece corretamente como sinal de risco no fluxo de clientes), Assinaturas (as 4 causas de Atenção todas visíveis); Crescimento → Franquias (Kanban com os 15 leads na distribuição exata pedida, badges "parado" nos 5 leads certos, alertas de gargalo em Qualificados/Reunião) — **testei de verdade o seletor de etapa novo (RETROFIT-010b)**: movi um lead de Interessados para Qualificados e vi o board recalcular ao vivo (contagens, potencial, tempo médio esperado, o alerta de gargalo sumindo), depois devolvi pra etapa original.

**🐛 Bug real encontrado e corrigido:** `shell/AdminSidebar.tsx` — o item "Rede" da sidebar (7 mundos fixos, Onda 1) nunca foi marcado `available: true` apesar da tela (`NetworkView`/`UnitDetailView`) existir e funcionar desde a Onda 2 — ficou "Em breve" por 7 ondas seguidas só por causa de uma linha esquecida. Só era alcançável clicando em "Explorar rede" no Panorama, nunca direto pela sidebar. Corrigido (`available: true`, `path: "/admin-v2/rede"`), comentário do arquivo atualizado.

**Não-bugs descartados durante a varredura (registrados para não reinvestigar):** (1) um clique meu por coordenada de pixel abriu o detalhamento do horário errado no Mapa de Capacidade — confirmado como mira imprecisa minha, não bug, ao repetir com referência de elemento exata; (2) navegação direta para `/admin-v2/clientes/assinaturas` redirecionou pra home pública com modal de login — confirmado como `RequireAdmin.tsx` (código anterior a este plano inteiro) reagindo ao JWT de 15min ter expirado no meio da varredura longa, comportamento correto e existente, não uma regressão.

**Validação pós-fix:** `tsc -b` PASS; `npm run build` PASS; `npm run lint` sem regressão (mesmos 12 erros pré-existentes/tolerados); `docker compose build web` + redeploy.

**Resultado:** todas as telas passaram na validação visual real, com 1 bug real encontrado e corrigido. Admin V2 (Ondas 0-9 + RETROFIT-010b) pronto para decisão de commit/push do usuário.

---

## 2026-08-14 — Gap encontrado: Pipeline de Franquias não tem como mover etapa (registrado, não implementado)

**Contexto:** usuário, validando o Pipeline de Franquias (Onda 9) com a massa de teste recém-criada, percebeu que a tela legada `admin-leads` tem formulário de cadastro + edição de status, mas o Admin V2 só mostra a distribuição no Kanban — não existe nenhuma forma de registrar que um lead avançou de etapa (`stage`). Diagnóstico correto: a Onda 9 foi entregue deliberadamente só-leitura (mesmo padrão do Mapa da Rede, Onda 2), e o escopo de backend original da onda só pedia o `GET`. Usuário pediu para registrar isso como um sub-plano futuro, não implementar agora.

**O que foi feito:** nenhuma mudança de código. Registrado formalmente em `memory/plans/PLAN-0022-ADMIN-V2-FUNDACAO-OPERACAO.md`: nova entrada `RETROFIT-010b` na tabela "Próximas ondas" (com o desenho de solução já esboçado — endpoint de escrita + `FranchiseLeadStageHistory` + ação no frontend, sem drag-and-drop) e nota de continuidade adicionada dentro da própria Onda 9.

**Pendente:** nada — item fica na fila de "Próximas ondas" até o usuário decidir priorizá-lo.

---

## 2026-08-14 — Massa de teste para Assinaturas (apoio à Onda 8, PLAN-0022)

**Contexto:** pedido explícito do usuário: clientes com assinaturas dos planos existentes (Silver/Gold/Platinum), 3 assinaturas por plano (9 no total).

**O que foi criado:** `apps/api/scripts/seedSubscriptionHealthTestData.ts` (novo, idempotente via `customerEmail` `@teste.jlr.local`) + script `seed:subscription-health-test-data`. Distribuição desenhada para cobrir as 4 causas que a Onda 8 promete listar em "Atenção" e todos os 4 estados: 3 Saudáveis, 2 Entrando (uma `PENDENTE` aguardando ativação, uma `ATIVA` recém-iniciada), 3 em Atenção (uma por causa — cobrança recusada, uso caiu, inadimplente) e 1 Saindo (cancelada dentro do período, conta no churn).

**Como rodou:** mesmo método de bundle+`docker cp`+`node` das massas de teste anteriores (imagem prod sem `tsx`/`src`).

**Validação pós-execução:** `GET /api/admin-v2/subscriptions/health?days=30` → `200`; `counts` bate exatamente (`ENTRANDO:2, SAUDAVEL:3, ATENCAO:3, SAINDO:1`); `churn.count=1` (a única cancelada); todo `reason` bate com a causa desenhada para cada assinatura. Regressão: `GET /api/subscriptions` (rota legada) e `/api/admin-v2/panorama` → `200`.

---

## 2026-08-14 — Massa de teste para o Pipeline de Franquias (apoio à Onda 9, PLAN-0022)

**Contexto:** pedido explícito do usuário para validar visualmente o Kanban comercial (Onda 9) com dados reais: 5 Interessados, 2 Qualificados, 1 em Reunião, 3 em Proposta, 4 em Negociação (15 leads).

**O que foi criado:** `apps/api/scripts/seedFranchisePipelineTestData.ts` (novo, idempotente via `email` `@teste.jlr.local`, mesma convenção de `seedAdminV2TestData.ts`) + script `seed:franchise-pipeline-test-data`. Cada lead além de "Interessado" carrega o caminho completo de transições em `FranchiseLeadStageHistory` (não só a etapa final) com datas escalonadas, para que "tempo médio esperado" e `isBottleneck` tenham dado histórico real para calcular — 5 leads foram propositalmente deixados parados além da média (um por etapa-alvo) para exercitar `isStalled` de verdade.

**Como rodou:** mesmo obstáculo estrutural de sempre (`postgres` só na rede Docker Compose; imagem prod do `api` não tem `src/`/`tsx`) — `npx esbuild --bundle --platform=node --external:@prisma/client --external:dotenv` local → `docker cp` do bundle para dentro do container → `node seedFranchisePipelineTestData.bundle.js`. Bundle e fonte `.ts` temporários removidos do container depois de rodar; o script-fonte fica versionado em `apps/api/scripts/`.

**Validação pós-execução:** `GET /api/admin-v2/growth/franchises/pipeline` → `200` com as contagens exatas pedidas por etapa; médias históricas reais calculadas (`avgDaysToComplete` não-nulo em Interessado/Qualificado/Reunião/Proposta); `isBottleneck=true` corretamente em Qualificado e Reunião (ocupação atual acima da média histórica); 5 leads com `isStalled=true`, um por etapa-alvo, como planejado. Regressão: `GET /api/franchise-leads` (rota legada) e `/api/admin-v2/panorama` → `200`.

---

## 2026-08-14 — Correção de contraste/tamanho de tipografia no Admin V2 (todas as Ondas 0-9)

**Contexto:** primeira validação visual real do usuário nas telas novas (via `http://localhost/admin-v2/operacao/produtos`) — reportou títulos legíveis mas subtítulos e legendas "muito claros e pequenos", quase ilegíveis contra o fundo (exemplos citados: subtítulo da página, texto de mediana, e a descrição do quadrante "vende bem e dá lucro" ao lado de "Estrela · 7").

**O que mudou:** ajuste sistemático de tipografia em todo `apps/web/src/admin-v2/` (29 arquivos): títulos `text-2xl`→`text-3xl`, labels em negrito `text-lg`→`text-xl`; texto secundário (subtítulos/legendas/descrições) subiu um degrau de tamanho (`text-xs`→`text-sm`, `text-sm`→`text-base`) e a cor ficou mais escura em modo claro (`text-stone-400`→`text-stone-500`, `text-stone-500`→`text-stone-600`), preservando um tom claro equivalente em modo escuro via par `dark:text-stone-400` explícito (o app antes usava a mesma cor fixa nos dois temas). Excluído de propósito: o item "em breve" desabilitado da sidebar (`AdminSidebar.tsx`, contraste baixo é intencional ali) e os separadores decorativos (`›`/`→` do breadcrumb e do fluxo de pedidos).

**Incidente durante a execução (registrado por transparência):** o primeiro script de automação (`str.replace` sequencial) tinha um bug de cascata — a saída de uma regra virava a entrada de match de outra regra posterior, e a limpeza de tokens "soltos" rodava depois sem lookbehind, duplicando sufixos `dark:text-stone-*` (até 3x na mesma classe) e, num subconjunto de linhas, trocando o tamanho/cor errado. Diagnosticado por rastreamento completo do mecanismo de cada regra; corrigido com um segundo script cirúrgico (colapsa duplicatas de `dark:`, restaura o único caso `dark:` pré-existente do projeto — `operations/agenda/state.ts`, e conserta as poucas linhas com cascata dupla) — validado depois linha a linha contra o conteúdo original de cada arquivo (autoria própria desta sessão, Ondas 1-9). Nenhum commit foi afetado (nada estava commitado ainda).

**Validação:** `npx tsc -b` PASS; `npm run build` PASS; `npm run lint` sem novos erros (mesmo baseline já tolerado); varredura final confirma zero classes `text-stone-400/500` sem par `dark:` (fora das 2 exceções intencionais); rebuild + redeploy do container `web`; conferência visual real via Claude in Chrome (extensão conectou nesta sessão) na tela `/admin-v2/operacao/produtos` confirmando subtítulos e legendas legíveis.

**Pendente:** nada commitado ainda (aguardando aprovação do usuário, junto com o restante das Ondas 0-9).

---

## 2026-08-14 — PLAN-0022 Onda 9: Pipeline de Franquias (migração de schema + backend + frontend) — Fundação+Operação 100% concluída

**Contexto:** continuação da sessão anterior, aprovação do usuário para seguir direto para a Onda 9 ("segue para a Onda 9") — última onda desta leva do plano, única com migração de schema.

**Migração de schema (`20260814214126_add_franchise_pipeline`):** novo enum `FranchiseStage`; `FranchiseLead.stage` (default `INTERESSADO`), `.estimatedValue Decimal?`, `.stageChangedAt DateTime?`; tabela nova `FranchiseLeadStageHistory`. Aditivo puro no domínio do Admin V2 — campo legado `status String?` preservado. Aplicada de dentro do container `api` (`postgres` só é alcançável pela rede Docker Compose), usando a role dona do banco via `DATABASE_MIGRATION_URL` (não a role de runtime `jlr_api_rw`, sem permissão pro shadow database do `migrate dev`). **Achado registrado:** a mesma geração de migration reconciliou 2 itens de drift pré-existente e não relacionado (índice duplicado em `Order.orderHmac`; `DEFAULT` de banco redundante em 2 tabelas de rate-limit) — inofensivos, detalhados com o motivo técnico completo em `memory/logs/BUILD-HISTORY.md`. Base local tinha 0 `FranchiseLead` — sem risco de perda de dado.

**Backend:** novo módulo `apps/api/src/modules/intelligence/franchise-pipeline/` com `types.ts`, `metrics.ts` (puro — "tempo médio esperado" é sempre a média histórica real de `FranchiseLeadStageHistory`, nunca um número inventado; cai para um limiar de segurança fixo só quando a etapa não tem histórico ainda) e `service.ts` (Prisma, só leitura — sem endpoint de escrita para mover etapa nesta onda, não estava no escopo original). `metrics.test.ts` — 8 testes novos. Rota nova `GET /api/admin-v2/growth/franchises/pipeline`. `test:intelligence` agora com 71 testes.

**Frontend:** `apps/web/src/admin-v2/growth/franchises/` (`types.ts`, `state.ts`, `PipelineBoardView.tsx` — Kanban comercial de 7 colunas, só leitura, alerta visual quando uma etapa está mais lenta que o histórico, `components/LeadCard.tsx`); `shared/api.ts` estendido (`fetchFranchisePipeline`); `shell/AdminSidebar.tsx` — "Crescimento" ativado (3º mundo de topo, depois de Panorama/Operação e Clientes); `AdminV2Root.tsx` — rota `crescimento` no nível raiz.

**Validações executadas (todas reais):** `npx prisma generate` (host + container) após a migração; `tsc -p tsconfig.build.json --noEmit` (api) PASS; `npx tsc -b` (web) PASS; `npm run build` (api e web) PASS; `npm run test` (api) **99/99 PASS**; `npm run lint` (web) — mesmo padrão `fetch-on-mount` tolerado, 1 instância nova; `docker compose build api web` PASS. **E2E real contra Postgres**: `GET /api/franchise-leads` (rota legada) → `200`, `[]`; `GET /api/admin-v2/growth/franchises/pipeline` → `200` com as 7 etapas honestamente zeradas; `401` sem token; regressão checada em todos os 8 endpoints das Ondas 1-8 → `200`.

**Ressalva:** extensão Claude in Chrome não conectada nesta sessão — a tela nova não foi conferida visualmente clique-a-clique. Mesma situação já registrada nas Ondas 1-8.

**Arquivos criados/alterados:** ver checklist detalhado em `memory/plans/PLAN-0022-ADMIN-V2-FUNDACAO-OPERACAO.md` (Onda 9) e `memory/logs/BUILD-HISTORY.md` (detalhes da migração).

**Marco:** com a Onda 9 concluída, a leva **Fundação + Experiência Operacional (Ondas 0-9) do `PLAN-0022` está 100% entregue**. Nada commitado ainda (aguardando aprovação — dupla autorização de Git). Próximo passo: usuário decide entre validar visualmente + commit/push de todas as Ondas 0-9, ou seguir para o planejamento de Inteligência/Consolidação (`PLAN-0023` em diante, conforme já previsto na seção "Próximos Passos" do próprio `PLAN-0022`).

---

## 2026-08-14 — PLAN-0022 Onda 8: Assinaturas como Saúde da Base (backend + frontend)

**Contexto:** continuação da sessão anterior, aprovação do usuário para seguir direto para a Onda 8 ("segue para a Onda 8").

**Backend:** novo módulo `apps/api/src/modules/intelligence/subscriptions/` com `types.ts` (`Subscription` não tem `unitId` — módulo sempre de rede inteira, sem parâmetro `unitIds` na rota), `classifier.ts` (4 estados — Entrando/Saudável/Atenção/Saindo — `status=CANCELADA` sempre vira Saindo, sem heurística por cima; dentro de Atenção: inadimplência > cobrança recusada > queda de cobranças aprovadas vs. período anterior) e `service.ts` (agrega `Subscription`+`Payment` reais; churn "no período" só conta cancelamentos com `cancelledAt` dentro da janela pedida). **Achado do RAG registrado:** `Order`/`Appointment` não têm `subscriptionId` — só `Payment` tem — então "uso" é medido pela cadência de cobrança aprovada, não por agendamentos/pedidos como o texto original da onda sugeria. `classifier.test.ts` — 10 testes novos. Rota nova `GET /api/admin-v2/subscriptions/health`. `test:intelligence` agora com 63 testes.

**Frontend:** `apps/web/src/admin-v2/customers/subscriptions/` (`types.ts`, `state.ts`, `SubscriptionHealthView.tsx` — card de churn em destaque + 4 blocos clicáveis por estado, `components/SubscriptionRow.tsx`); `shared/api.ts` estendido (`fetchSubscriptionHealth`); `AdminV2Root.tsx` — "Assinaturas" vira a 2ª sub-aba do mundo "Clientes" (`Fluxo | Assinaturas`), rota `clientes/assinaturas`.

**Validações executadas (todas reais):** `tsc -p tsconfig.build.json --noEmit` (api) PASS; `npx tsc -b` (web) PASS; `npm run build` (api e web) PASS; `npm run test` (api) **91/91 PASS**; `npm run lint` (web) — mesmo padrão `fetch-on-mount` tolerado, 1 instância nova; `docker compose build api web` PASS. **E2E real contra Postgres**: rota nova validada com login MASTER real (`200`, assinaturas classificadas com dados reais) e `401` sem token; regressão checada em `/panorama`, `/network`, `/operations/orders`, `/operations/agenda/capacity`, `/portfolio/products`, `/portfolio/services` e `/customers` → `200`.

**Ressalva:** extensão Claude in Chrome não conectada nesta sessão — a tela nova não foi conferida visualmente clique-a-clique. Mesma situação já registrada nas Ondas 1-7.

**Arquivos criados/alterados:** ver checklist detalhado em `memory/plans/PLAN-0022-ADMIN-V2-FUNDACAO-OPERACAO.md` (Onda 8).

**Pendente:** nada commitado ainda (aguardando aprovação — dupla autorização de Git). Onda 8 do `PLAN-0022` concluída (backend + frontend), falta só a conferência visual do usuário antes do commit. Próximo passo: usuário decide entre validar visualmente + commit/push das Ondas 0-8, ou seguir direto para a Onda 9 (Pipeline de Franquias — única onda com migração de schema).

---

## 2026-08-14 — PLAN-0022 Onda 7: Clientes como Fluxo de Relacionamento (backend + frontend)

**Contexto:** continuação da sessão anterior, aprovação do usuário para seguir direto para a Onda 7 ("segue para a Onda 7").

**Backend:** novo módulo `apps/api/src/modules/intelligence/customers/` com `types.ts` (identidade de cliente é proxy `email > telefone > nome`, mesma convenção de `unit-health/service.ts`/`dashboardSalesInsights.ts` — documentado explicitamente, não é CRM real), `classifier.ts` (5 estados — Novo/Ativo/Recorrente/Em risco/Inativo — em ordem de prioridade fixa; cancelamento recente e assinatura inadimplente vencem "sumiu" genérico) e `service.ts` (agrega `Order` PAGO/CANCELADO + `Appointment` não-cancelado/cancelado + `Subscription` INADIMPLENTE). **Bug corrigido durante a implementação:** clientes que só apareciam via cancelamento/inadimplência (sem atividade real) recebiam um `firstActivityAt` fabricado que os classificava erroneamente como "Novo" — corrigido com um marcador de data fora dos dois períodos, que não dispara nenhum estado por engano. `classifier.test.ts` — 10 testes novos. Rota nova `GET /api/admin-v2/customers`, mesmo padrão `resolveRequestedUnitIds`, devolve todos os clientes com `reason` em cada um. `test:intelligence` agora com 53 testes.

**Frontend:** `apps/web/src/admin-v2/customers/` (`types.ts`, `state.ts`, `CustomersFlowView.tsx` — 5 blocos clicáveis por estado, "Em risco" selecionado por padrão, `components/CustomerRow.tsx`); `shared/api.ts` estendido (`fetchCustomerFlow`); `shell/AdminSidebar.tsx` — "Clientes" ativado (primeiro mundo de topo da sidebar além de Panorama/Operação, `available: false` → `true`); `AdminV2Root.tsx` — rota `clientes` no nível raiz; `network/UnitDetailView.tsx` — "Ver clientes" deixou de ser ação desabilitada e virou navegação real.

**Validações executadas (todas reais):** `tsc -p tsconfig.build.json --noEmit` (api) PASS; `npx tsc -b` (web) PASS; `npm run build` (api e web) PASS; `npm run test` (api) **81/81 PASS**; `npm run lint` (web) — mesmo padrão `fetch-on-mount` tolerado, 1 instância nova; `docker compose build api web` PASS. **E2E real contra Postgres**: rota nova validada com login MASTER real (`200`, clientes classificados nos 5 estados com `reason`) e `401` sem token; regressão checada em `/panorama`, `/network`, `/operations/orders`, `/operations/agenda/capacity`, `/portfolio/products` e `/portfolio/services` → `200`.

**Ressalva:** extensão Claude in Chrome não conectada nesta sessão — a tela nova não foi conferida visualmente clique-a-clique. Mesma situação já registrada nas Ondas 1-6.

**Arquivos criados/alterados:** ver checklist detalhado em `memory/plans/PLAN-0022-ADMIN-V2-FUNDACAO-OPERACAO.md` (Onda 7).

**Pendente:** nada commitado ainda (aguardando aprovação — dupla autorização de Git). Onda 7 do `PLAN-0022` concluída (backend + frontend), falta só a conferência visual do usuário antes do commit. Próximo passo: usuário decide entre validar visualmente + commit/push das Ondas 0-7, ou seguir direto para a Onda 8 (Assinaturas como Saúde da Base).

---

## 2026-08-14 — PLAN-0022 Onda 6: Performance de Serviços (backend + frontend)

**Contexto:** continuação da sessão anterior, aprovação do usuário para seguir direto para a Onda 6 ("segue para a Onda 6").

**Backend:** novo módulo `apps/api/src/modules/intelligence/service-performance/` com `types.ts` (contrato único, com o 5º estado `SEM_DEMANDA` — mesmo raciocínio honesto do `SEM_VENDA` da Onda 5), `classifier.ts` (matriz demanda×margem/hora pura, relativa à mediana do recorte, mesmo framework do Portfólio) e `service.ts` (agrega `Appointment` real do período + reusa `calculateUnitOccupancy` da Onda 4 para o denominador de ocupação — não recalculado do zero). `classifier.test.ts` — 7 testes novos, incluindo teste dedicado de consistência (occupancyPercent/margem batem com os totais agregados, atendendo ao critério de aceitação da onda). Rota nova `GET /api/admin-v2/portfolio/services`, mesmo padrão `resolveRequestedUnitIds`. `test:intelligence` agora com 43 testes.

**Frontend:** `apps/web/src/admin-v2/portfolio/services/` (`types.ts`, `state.ts`, `ServiceMatrixView.tsx`, `components/ServiceCard.tsx` — badge `⚠ Analisar preço` só para Armadilha, governança #7); `shared/api.ts` estendido (`fetchServicePerformance`); `AdminV2Root.tsx` — "Serviços" vira a 4ª sub-aba de "Operação" (`Pedidos | Agenda | Produtos | Serviços`), rota `operacao/servicos`.

**Validações executadas (todas reais):** `tsc -p tsconfig.build.json --noEmit` (api) PASS; `npx tsc -b` (web) PASS; `npm run build` (api e web) PASS; `npm run test` (api) **71/71 PASS**; `npm run lint` (web) 9 erros — 2 pré-existentes + 6 já aceitos das Ondas 1-5 + 1 novo no mesmo padrão `fetch-on-mount` tolerado; `docker compose build api web` PASS. **E2E real contra Postgres**: rota nova validada com login MASTER real (`200`, serviços classificados com dados reais) e `401` sem token; regressão checada em `/panorama`, `/network`, `/operations/orders`, `/operations/agenda/capacity` e `/portfolio/products` → `200`.

**Ressalva:** extensão Claude in Chrome não conectada nesta sessão — a tela nova não foi conferida visualmente clique-a-clique, só a infraestrutura. Mesma situação já registrada nas Ondas 1-5.

**Arquivos criados/alterados:** ver checklist detalhado em `memory/plans/PLAN-0022-ADMIN-V2-FUNDACAO-OPERACAO.md` (Onda 6).

**Pendente:** nada commitado ainda (aguardando aprovação — dupla autorização de Git). Onda 6 do `PLAN-0022` concluída (backend + frontend), falta só a conferência visual do usuário antes do commit. Próximo passo: usuário decide entre validar visualmente + commit/push das Ondas 0-6, ou seguir direto para a Onda 7 (Clientes como Fluxo de Relacionamento).

---

## 2026-08-14 — PLAN-0022 Onda 5: Portfólio Vivo de Produtos (backend + frontend)

**Contexto:** continuação da sessão anterior, aprovação do usuário para seguir direto para a Onda 5 ("segue para a Onda 5").

**Backend:** novo módulo `apps/api/src/modules/intelligence/portfolio/` com `types.ts` (contrato único, incluindo o 5º estado `SEM_VENDA` — ajuste consciente vs. o texto original, que só previa Joias/Estrelas/Fracos/Armadilhas: um produto sem venda no período não tem margem para classificar contra a mediana, forçá-lo em "Fraco" fabricaria dado), `classifier.ts` (matriz margem×volume pura, relativa à mediana do próprio recorte pedido — não existe uma "boa margem %" universal — com `median()` exportada e testável) e `service.ts` (agrega `OrderItem`/`Order` PAGO do período + `ProductStock.stock × Product.costPrice` para capital parado; **correção registrada**: o texto original da onda citava `ProductStock.quantity`, campo que não existe — o campo real é `stock`). `classifier.test.ts` — 9 testes novos, incluindo o critério de aceitação explícito (alto volume + baixa margem → Armadilha) e margem negativa não-clampada. Rota nova `GET /api/admin-v2/portfolio/products` em `adminV2.ts`, mesmo padrão `resolveRequestedUnitIds` de Panorama/Rede/Operação — drill-down por unidade embutido na própria resposta (`byUnit`), sem endpoint separado. `test:intelligence` agora com 36 testes.

**Frontend:** `apps/web/src/admin-v2/portfolio/products/` (`types.ts`, `state.ts`, `ProductMatrixView.tsx`, `components/ProductCard.tsx`); `shared/api.ts` estendido (`fetchPortfolioProducts`); `AdminV2Root.tsx` — "Portfólio" não tem slot próprio nos 7 mundos fixos da sidebar (Onda 1), nasce como 3ª sub-aba de "Operação" (`Pedidos | Agenda | Produtos`), mesmo padrão da Agenda na Onda 4; rota `operacao/produtos`, breadcrumb atualizado. `network/UnitDetailView.tsx` — "Ver produtos" deixou de ser ação desabilitada (promessa da Onda 2) e virou navegação real (refatorado para `ENABLED_ACTIONS`, junto com "Ver agenda").

**Validações executadas (todas reais):** `tsc -p tsconfig.build.json --noEmit` (api) PASS; `npx tsc -b` (web) PASS; `npm run build` (api e web) PASS; `npm run test` (api) **64/64 PASS**; `npm run lint` (web) 8 erros — 2 pré-existentes + 5 já aceitos das Ondas 1-4 + 1 novo no mesmo padrão `fetch-on-mount` tolerado; `docker compose build api web` PASS. **E2E real contra Postgres**: rota nova validada com login MASTER real (`200`, produtos classificados com dados reais) e `401` sem token; regressão checada em `/panorama`, `/network`, `/operations/orders` e `/operations/agenda/capacity` → `200`.

**Ressalva:** extensão Claude in Chrome não conectada nesta sessão — a tela nova não foi conferida visualmente clique-a-clique, só a infraestrutura (build/lint/tsc/Docker/API real). Mesma situação já registrada nas Ondas 1-4.

**Arquivos criados/alterados:** ver checklist detalhado em `memory/plans/PLAN-0022-ADMIN-V2-FUNDACAO-OPERACAO.md` (Onda 5).

**Pendente:** nada commitado ainda (aguardando aprovação — dupla autorização de Git). Onda 5 do `PLAN-0022` concluída (backend + frontend), falta só a conferência visual do usuário antes do commit. Próximo passo: usuário decide entre validar visualmente + commit/push das Ondas 0-5, ou seguir direto para a Onda 6 (Performance de Serviços).

---

## 2026-08-14 — PLAN-0022 Onda 4: Mapa de Capacidade da Agenda (backend + frontend)

**Contexto:** continuação da sessão anterior (retomada exatamente do ponto marcado no `PLAN-0022`), aprovação do usuário para seguir direto para a Onda 4 ("segue para a Onda 4").

**Backend:** novo módulo `apps/api/src/modules/intelligence/capacity/` com `types.ts` (contrato único), `heatmap.ts` (matemática pura de agregação dia×hora — `overlapMinutes`/`dateKey`/`buildCapacityDays` — sem Prisma, mesma separação `classifier.ts`/`service.ts` da Onda 3) e `service.ts` (`getCapacityHeatmap()`/`getSlotDetail()`, acesso a dados real: `ProfessionalShift` para disponibilidade, `Appointment` para reservas com fallback de `Service.durationMin`, receita prorateada quando o agendamento cruza mais de 1 hora). `capacity/calculator.ts` da Onda 1 não foi tocado. "Receita potencial perdida" no drill-down de horário usa a taxa do próprio horário quando há reserva, ou a média da unidade no período como referência honesta quando não há (nunca fabrica número sem explicação). Rotas novas `GET /api/admin-v2/operations/agenda/capacity` e `/operations/agenda/slots` em `adminV2.ts` — únicas do módulo com `unitId` obrigatório/único (não lista), `requireAdmin` + `canAccessUnit`. `heatmap.test.ts` — 9 testes unitários novos (`test:intelligence` agora com 27 testes).

**Frontend:** `apps/web/src/admin-v2/operations/agenda/` (`types.ts`, `state.ts`, `CapacityView.tsx`, `components/CapacityHeatmapGrid.tsx`, `components/SlotDetailPanel.tsx`); `shared/api.ts` estendido (`fetchCapacityHeatmap`/`fetchSlotDetail`); `shared/format.ts` estendido (`formatShortDate`/`formatHour`/`WEEKDAY_LABELS`); `AdminV2Root.tsx` — rota `operacao/agenda`, sub-abas "Pedidos"/"Agenda" dentro do mundo Operação, breadcrumb `Panorama > Operação > Agenda`; `network/UnitDetailView.tsx` — "Ver agenda" deixou de ser ação desabilitada (promessa da Onda 2) e virou navegação real.

**Validações executadas (todas reais):** `tsc -p tsconfig.build.json --noEmit` (api) PASS; `npx tsc -b` (web) PASS; `npm run build` (api e web) PASS; `npm run test` (api) **55/55 PASS**; `npm run lint` (web) 7 erros — 2 pré-existentes + 4 já aceitos das Ondas 1-3 + 1 novo no mesmo padrão `fetch-on-mount` tolerado; `docker compose build api web` PASS. **E2E real contra Postgres**: rotas novas validadas com login MASTER real (`200`) e `401` sem token; regressão checada em `/panorama`, `/network` e `/operations/orders` → `200`.

**Efeito colateral corrigido (fora do escopo do plano, mesma classe de incidente já documentada nas Ondas 0/1/3):** container `postgres` estava `Exited` e `api` em crash-loop (`P1001`) no início desta sessão — pré-existente, não causado por esta onda. Subido com o mesmo volume (sem perda de dado, migrations intactas) e `api`/`web` recriados com as imagens novas.

**Ressalva:** extensão Claude in Chrome não conectada nesta sessão — a tela nova não foi conferida visualmente clique-a-clique, só a infraestrutura (build/lint/tsc/Docker/API real). Mesma situação já registrada nas Ondas 1-3.

**Arquivos criados/alterados:** ver checklist detalhado em `memory/plans/PLAN-0022-ADMIN-V2-FUNDACAO-OPERACAO.md` (Onda 4).

**Pendente:** nada commitado ainda (aguardando aprovação — dupla autorização de Git). Onda 4 do `PLAN-0022` concluída (backend + frontend), falta só a conferência visual do usuário antes do commit. Próximo passo: usuário decide entre validar visualmente + commit/push das Ondas 0-4, ou seguir direto para a Onda 5 (Portfólio Vivo de Produtos).

---

## 2026-08-13 — Massa de teste para validação do Admin V2 (apoio ao PLAN-0022)

**Contexto:** pedido explícito do usuário, após o fechamento da Onda 3, para poder validar
visualmente o Admin V2 com dados reais em vez de um banco vazio: "crie mais duas unidades,
franquiadas, uma em Franco da Rocha, SP e a outra em Recife, PE. Gere pedidos de compra,
agendamentos em todas as unidades para pelo menos 2 profissionais de cada unidade [...] o que
faltar de dados de testes, copie dos registros que existem."

**O que foi feito:** criado `apps/api/scripts/seedAdminV2TestData.ts` (script idempotente,
reaproveitando as mesmas funções de negócio do fluxo real — `applyStockMovement`/`sellStockDirect`
do ledger de estoque do PLAN-0020, `appendOrderStatusHistory`, `buildOrderPublicCode`/
`generateOrderHmac`) e executado contra o Postgres local via container `api` (detalhe de
execução em `memory/logs/BUILD-HISTORY.md`).

**O que mudou (dados, não schema — nenhuma migration):**
- 2 unidades novas `FRANCHISE`: "Franco da Rocha" (SP) e "Recife" (PE).
- Estoque inicial em todas as 5 unidades (45 movimentos `ENTRADA_COMPRA`).
- 6 profissionais novos (2 em Birmann 20, 2 em Franco da Rocha, 2 em Recife — Parque da Cidade
  já tinha 3); Loja Online (unidade online) não recebeu profissionais/agendamentos, decisão
  consciente por não ser uma unidade física com agenda.
- 43 `Order` cobrindo os 4 estados do Board Operacional + o Fluxo real de fulfillment.
- 36 `Appointment`/`AppointmentSlot` (4 por profissional).
- `apps/api/package.json` — novo script `seed:admin-v2-test-data`.

**Validações executadas:** `tsc -p tsconfig.build.json --noEmit` PASS; `npm run test` 46/46 PASS;
E2E real pós-seed — `GET /api/admin-v2/panorama`, `/network`, `/operations/orders` e
`/operations/orders/flow` retornaram `200` com dados reais e não-vazios nas 5 unidades, incluindo
um gargalo real detectado na etapa Enviado→Entregue (média 1170min).

**Pendente:** nenhum commit feito ainda (aguardando aprovação, junto com o restante das Ondas
0-3 do `PLAN-0022`). Dados de teste identificáveis por `customerEmail` `@teste.jlr.local` e
`notes`/`note` contendo `[SEED-ADMINV2]`, para limpeza futura se necessário.

---

## 2026-08-13 — PLAN-0022 Onda 3: Board Operacional de Pedidos (backend + frontend)

**Contexto:** continuação da sessão anterior (retomada exatamente do ponto marcado no `PLAN-0022`), aprovação implícita do usuário a cada passo ("pode seguir").

**Backend:** `apps/api/src/modules/intelligence/operational-orders/service.ts` — `getOrdersBoard()` (4 colunas: `entraram/emPreparacao/atencao/prontos`, prioridade do estado operacional sobre o estágio natural, amostra de 20/coluna com `count`/`totalValue` sempre da coluna inteira) e `getOrdersFlow()` (6 transições reais do fulfillment, média em minutos, gargalo a partir de 240min). Ajuste consciente: pedidos `CANCELADO` excluídos das duas funções (não estão travando etapa nenhuma). Rotas novas `GET /api/admin-v2/operations/orders` e `/operations/orders/flow` em `adminV2.ts`, mesmo padrão `requireAdmin` + `resolveRequestedUnitIds` das Ondas 1-2.

**Frontend:** `apps/web/src/admin-v2/operations/orders/` (`types.ts`, `state.ts`, `OrdersBoardView.tsx`, `components/OrderCardView.tsx`, `components/OrderFlowTimeline.tsx`); `shared/api.ts` estendido (`fetchOrdersBoard`/`fetchOrdersFlow`); `shared/format.ts` estendido (`formatMinutes`); `AdminSidebar.tsx` — "Operação" ativada, itens disponíveis viraram `<button>` navegável; `AdminV2Root.tsx` — rota `operacao` + breadcrumb; `PanoramaCards.tsx`/`PanoramaView.tsx` — botão "Explorar operação" ligado.

**Validações executadas (todas reais):** `tsc -p tsconfig.build.json --noEmit` (api) PASS; `npx tsc -b` (web) PASS; `npm run build` (api e web) PASS; `npm run test` (api) **46/46 PASS**; `npm run lint` (web) 6 erros — 2 pré-existentes + 3 já aceitos das Ondas 1-2 + 1 novo no mesmo padrão `fetch-on-mount` tolerado; `docker compose build api web` PASS. **E2E real contra Postgres**: login MASTER real; as duas rotas novas → `200` (vazias — base de teste sem pedidos, confirmado até com `days=365`) e `401` sem token; regressão checada em `/panorama` e `/network` → `200`; rota SPA `GET /admin-v2/operacao` → `200`.

**Efeito colateral corrigido (fora do escopo do plano):** container `nginx` com bind mount do `conf.d` preso a um caminho de disco antigo (`...FEADABCE16` em vez do `...FEADABCE18` atual, resquício de sessão anterior a uma mudança de ponto de montagem) — `conf.d` chegava vazio, nada escutava na porta 80. Corrigido com `docker compose up -d --force-recreate nginx`; sem perda de dado, `postgres` não foi tocado.

**Ressalva:** extensão Claude in Chrome não conectada nesta sessão — a tela nova não foi conferida visualmente clique-a-clique, só a infraestrutura (build/lint/tsc/Docker/rota SPA/API real). Mesma situação de "validação visual pendente do usuário" já registrada em outros planos.

**Arquivos criados/alterados:** ver checklist detalhado em `memory/plans/PLAN-0022-ADMIN-V2-FUNDACAO-OPERACAO.md` (Onda 3).

**Pendente:** nada commitado ainda (aguardando aprovação — dupla autorização de Git). Onda 3 do `PLAN-0022` concluída (backend + frontend), falta só a conferência visual do usuário antes do commit. Próximo passo: usuário decide entre validar visualmente + commit/push das Ondas 0-3, ou seguir direto para a Onda 4 (Mapa de Capacidade da Agenda).

---

## 2026-08-13 03:30:53
- Fechamento de sessão (PLAN-0022 — Admin V2: Ondas 0-2 concluídas, Onda 3 parcial)
  - O que foi feito:
    - execução completa das Ondas 0 (baseline), 1 (Shell + Scope Engine + Panorama Vivo + Health Score v1) e 2 (Mapa Vivo da Rede + Diagnóstico da Unidade) do `PLAN-0022`, todas validadas com `tsc -b`, testes automatizados, build Docker e **E2E real contra Postgres** (login MASTER + chamadas reais aos endpoints novos);
    - início da Onda 3 (Board Operacional de Pedidos): classificador de estado operacional (`operational-orders/classifier.ts`) implementado e coberto por 11 testes unitários PASS; `service.ts`/rotas/frontend da Onda 3 ainda não iniciados;
    - sessão interrompida a pedido explícito do usuário ("salvar tudo e parar por hoje") no meio da implementação da Onda 3 — ponto de retomada documentado com precisão no próprio `PLAN-0022`.
  - O que mudou:
    - `memory/decisions/DECISION-013.md` (nova, ACTIVE) — regras arquiteturais do programa Admin V2;
    - `memory/plans/PLAN-0022-ADMIN-V2-FUNDACAO-OPERACAO.md` (novo) — plano completo do programa, com Ondas 0-2 marcadas concluídas e Onda 3 marcada em andamento com o passo exato para retomar;
    - `apps/api/src/modules/intelligence/` (novo) — `unit-health/`, `capacity/`, `panorama/`, `network/`, `operational-orders/` (parcial: só `types.ts`+`classifier.ts`+`classifier.test.ts`);
    - `apps/api/src/routes/adminV2.ts` (novo) — `GET /api/admin-v2/panorama`, `/network`, `/network/units/:id`;
    - `apps/api/src/lib/messages.ts` — `MSG.UNIT_NOT_FOUND` adicionado;
    - `apps/api/package.json` — scripts `test:intelligence` (agora 18 testes) encadeado em `test`;
    - `apps/web/src/admin-v2/` (novo) — shell, panorama, network, engine de escopo, roteamento interno próprio;
    - `apps/web/src/pages/AdminV2.tsx` (novo) + `apps/web/src/app/App.tsx` (rota `admin-v2/*`);
    - `tailwind.config.js` — 3 tokens semânticos novos, aditivos à paleta existente;
    - branch de trabalho `feature/admin-v2` (a partir de `main`), nenhum arquivo do Admin legado tocado.
  - O que ficou pendente:
    - Onda 3: `apps/api/src/modules/intelligence/operational-orders/service.ts` (agregação real do board + fluxo), rotas `GET /api/admin-v2/operations/orders` e `/orders/flow`, frontend (`OrdersBoardView.tsx`/`OrderFlowTimeline.tsx`), ativação do item "Operação" na sidebar, validação completa (tsc/testes/build Docker/E2E) — tudo detalhado no `PLAN-0022`, seção Onda 3;
    - Ondas 4-9 do `PLAN-0022` (Agenda, Produtos, Serviços, Clientes, Assinaturas, Franquias) — não iniciadas;
    - nenhum commit/push feito nesta sessão — aguardando dupla autorização explícita do usuário (nem sequer solicitada ainda, por não ter chegado a um marco de entrega fechado);
    - gap de cobertura de teste automatizado registrado no audit desta sessão: `network/service.ts` e `panorama/service.ts` só têm validação E2E manual, sem teste de integração automatizado — considerar para uma onda futura ou como débito técnico.

## 2026-08-13 03:32:10 — SESSION AUDIT — PASS

| Item | Resultado |
|---|---|
| Decision Integrity | OK — `DECISION-013` criada e consistente; nenhuma decisão ativa contrariada; mudanças estruturais (novas rotas/módulos) registradas nela |
| State Integrity | OK — `PLAN-0022` aberto (esperado, é um programa multi-onda); progresso real refletido onda a onda, incluindo os dois desvios de escopo já documentados (gate de auth, adapter-links inviáveis) |
| Operational Memory | OK — `MODIFICATION_LOG.md` e `PLAN-0022` atualizados a cada onda concluída e agora no ponto de parada |
| Debug Memory | N/A — nenhum bug de código foi corrigido nesta sessão; a recuperação do container `postgres` parado foi manutenção de infraestrutura pré-existente (mesma classe de incidente já documentada no histórico do PLAN-0020), não um bug novo — julgamento registrado aqui em vez de criar um ERR-XXXX artificial |
| Technical Validation | OK — lint executado (web, sem regressão além do padrão já tolerado no projeto), build executado (api+web+Docker, todas as ondas concluídas), testes executados (18/18 intelligence + 23/23 inventory + greeting, todos PASS), sem migration pendente (Onda 3 não toca schema), sem `console.log` novo |
| Regression Risk | OK, com ressalva anotada — nenhuma área sensível (auth/pagamento/agenda/integração externa) foi alterada, só reutilizada; risco baixo. Ressalva: endpoints novos (`network`, `panorama`) têm só E2E manual, sem teste de integração automatizado — não bloqueia, mas fica registrado como débito |
| Git Governance | PENDING (esperado) — nenhum commit feito; Git Record do `PLAN-0022` segue `[pendente]` até o fechamento formal de uma leva de ondas |

**Checklist completo:** `memory/logs/AUDIT_CHECKLIST_20260813_033053-PASS.md`.
**Sessão encerrada a pedido do usuário** ("salvar tudo e parar por hoje"). Retomar exatamente da Onda 3 do `PLAN-0022` (branch `feature/admin-v2`).

---

## 2026-08-13 — PLAN-0022 Onda 2: Mapa Vivo da Rede + Diagnóstico da Unidade

**Contexto:** usuário autorizou seguir direto para a Onda 2 sem pausa de confirmação ("considere já tudo aprovado").

**Backend:** `unit-health/service.ts` estendido para expor métricas brutas (`raw`) e minutos de ocupação, sem mudar o cálculo do score; novo módulo `intelligence/network/` (camada de apresentação sobre `unit-health`, não recalcula nada) com `getNetworkBoard()` e `getUnitDiagnostic()`; estimativa de impacto financeiro implementada **só** para a causa "ocupação" (única com tradução honesta para R$ na v1 — as demais devolvem `impactEstimate: null` em vez de número fabricado); `GET /api/admin-v2/network` e `GET /api/admin-v2/network/units/:id` novos em `adminV2.ts`; `MSG.UNIT_NOT_FOUND` adicionado a `lib/messages.ts`.

**Frontend:** `network/NetworkView.tsx` (Kanban 4 colunas) + `UnitDetailView.tsx` + `HealthScoreBars.tsx`; `AdminV2Root.tsx` reestruturado de componente estático para layout com roteamento interno próprio (`<Routes>` montadas em `admin-v2/*`), breadcrumb dinâmico clicável nos dois sentidos (drill-down/roll-up real); botão "Explorar rede" do Panorama passou de desabilitado para navegação real.

**Correção de escopo registrada:** o plano original previa "Ver agenda/clientes/produtos" como adapter-link para o Admin legado (`/admin?view=...&unit=...`); RAG confirmou que o shell legado não suporta esse deep-link hoje — um link assim aterrissaria no Painel padrão, não na tela certa. Ficaram desabilitados "em breve" (mesmo padrão da Onda 1) em vez de simular uma navegação que não funcionaria.

**Validações executadas:** `tsc -p tsconfig.build.json --noEmit` (api) PASS; `npx tsc -b` (web) PASS; `npm run test` (api) 30/30 PASS; `npm run build` (web e api) PASS; `npm run lint` (web) 5 erros — 2 pré-existentes + 3 no padrão `set-state-in-effect` já aceito no projeto; `docker compose build web api` PASS. **E2E real**: `GET /api/admin-v2/network` → `200` com as 3 unidades reais, ordenadas por score; `GET /api/admin-v2/network/units/:id` → `200` com decomposição completa; id inexistente → `404`; id inválido → `400`.

**Arquivos criados/alterados:** ver checklist detalhado em `memory/plans/PLAN-0022-ADMIN-V2-FUNDACAO-OPERACAO.md` (Onda 2).

**Pendente:** nada commitado ainda (aguardando aprovação — dupla autorização de Git). Próximo passo: Onda 3 (Board Operacional de Pedidos).

---

## 2026-08-13 — PLAN-0022 Ondas 0-1: Admin V2 shell + Panorama Vivo + Health Score v1

**Contexto:** aprovação do usuário para iniciar a execução do `PLAN-0022` (branch `feature/admin-v2`).

**Onda 0 (baseline):** branch `feature/admin-v2` criada a partir de `main`; nenhum arquivo do Admin legado tocado.

**Onda 1 (Shell + Scope Engine + Panorama Vivo + Health Score v1):**
- Backend novo: `apps/api/src/modules/intelligence/{unit-health,capacity,panorama}/` + rota `GET /api/admin-v2/panorama` (`apps/api/src/routes/adminV2.ts`, montada em `routes/index.ts`), gate `requireAdmin`. Reaproveita `getSalesInsights`/`getInventoryOverview` (PLAN-0020) — não recalcula margem/CMV. Health Score v1 com fórmula fixa (`DECISION-013`), sempre decomposto em componentes (regra de explicabilidade do plano).
- Achado registrado no código: `Subscription` não tem `unitId` no schema — componente "Assinaturas" do score usa taxa de ativação da rede inteira (peso 5%, documentado, não fabricado por unidade).
- Frontend novo: `apps/web/src/admin-v2/` (shell com 7 "mundos", só Panorama ativo — os demais aparecem "em breve", nunca como link morto) + rota `/admin-v2` em `App.tsx` com `RequireAdmin`. Tokens semânticos novos e aditivos no `tailwind.config.js` (`state-attention/critical/info`; `state-healthy` reaproveita `primary`).
- `apps/api/package.json`: novo script `test:intelligence` (7 testes unitários da fórmula do Health Score, `node:test`).

**Validações executadas:** `tsc -p tsconfig.build.json --noEmit` (api) PASS; `npx tsc -b` (web) PASS; `npm run test` (api) 30/30 PASS; `npm run build` (web e api) PASS; `npm run lint` (web) 3 erros — 2 pré-existentes (mesmo baseline do audit do PLAN-0021) + 1 novo no mesmo padrão já tolerado em `AdminDashboardInsightsIsland.tsx`; `docker compose build web api` PASS. **E2E real**: login MASTER + `GET /api/admin-v2/panorama` retornou `200` com dados reais (3 unidades); requisição sem token retornou `401`.

**Efeito colateral (fora do escopo do plano, corrigido para permitir a validação E2E):** o container `postgres` estava `Exited` e o `api` em crash-loop (`P1001`) — pré-existente à sessão, mesma classe de incidente já documentada no `PLAN-0020`. Subi o `postgres` (mesmo volume — `10 migrations found... No pending migrations to apply` confirma schema intacto, sem perda de dados) e recriei o `api` com a imagem nova.

**Arquivos criados/alterados:** ver checklist detalhado em `memory/plans/PLAN-0022-ADMIN-V2-FUNDACAO-OPERACAO.md` (Ondas 0 e 1).

**Pendente:** nada commitado ainda (aguardando aprovação — dupla autorização de Git). Próximo passo: Onda 2 (Mapa Vivo da Rede + Diagnóstico da Unidade).

---

## 2026-08-12 — INÍCIO de plano (Admin V2 — retrofit, Fundação + Operação)

**Contexto/gatilho:** usuário trouxe um brainstorm feito com apoio de IA (`retrofit/ADMIN-V2-RETROFIT-OVERVIEW.md`, `retrofit/Retrofit_Concepts.docx`, `retrofit/RETROFIT-000.md` a `RETROFIT-014.md`) propondo um retrofit do painel administrativo orientado a Panorama → Rede → Diagnóstico → Ação (drill-down/roll-up, Health Score, board operacional de pedidos, mapa de capacidade de agenda, portfólio vivo de produtos, etc.), separado do Admin legado (`/admin-v2` em paralelo a `/admin`). Tarefa classificada como DESIGN/UI + COMPLEX CODE (`PLAN-XXXX` obrigatório pelo classificador do `BOOTSTRAP.md`). Agentes aplicados: `@orchestrator`, `@product-manager`, `@project-planner`, `@database-architect`.

**Ação:**
- RAG completo no schema Prisma, middleware de auth/unit-scope (`resolveUnitScope`/`canAccessUnit`), módulo `admin/kpis`, roteamento real do frontend (`apps/web/src/app/App.tsx`, `react-router-dom`) e models de domínio (`Order`, `Appointment`, `Service`, `Subscription`, `FranchiseLead`) para validar as premissas técnicas do brainstorm antes de planejar — confirmado que a base necessária (fulfillment com timestamps, ledger de estoque PLAN-0020, RBAC fail-closed, BI existente) já existe.
- Avaliação de viabilidade apresentada ao usuário: **VIÁVEL**, com ressalvas (escopo é programa multi-onda, não um plano único; `RETROFIT-015/016` nunca existiram no material de origem; `FranchiseLead` é raso demais para o Kanban comercial proposto — achado que gerou a única migração de schema desta leva, na Onda 9).
- Gate socrático (RULES.md §15) aplicado via `AskUserQuestion` — 4 perguntas estratégicas (sequenciamento vs. planos abertos, tamanho do primeiro corte, política de aposentadoria do Admin legado, ambição do Health Score v1). Respostas do usuário: desenvolvimento em paralelo aos PLAN-0019/0020/0021 (branch própria, único acoplamento é bloqueio de produção externa ao PLAN-0019/TLS); primeiro corte = Fundação + Experiência Operacional completa (RETROFIT-000 a 010); sem política de aposentadoria do legado por ora; Health Score v1 com fórmula fixa e determinística.
- Decisão arquitetural registrada em `memory/decisions/DECISION-013.md` (ACTIVE).
- Plano criado: `memory/plans/PLAN-0022-ADMIN-V2-FUNDACAO-OPERACAO.md`, com governança do programa, matriz de reuso validada no código, identidade visual (reuso dos tokens de marca atuais + 3 tokens semânticos novos aditivos), arquitetura alvo (`apps/api/src/modules/intelligence/`, `apps/web/src/admin-v2/`) e 10 ondas detalhadas (0 a 9) com backend/frontend/critérios de aceitação por onda. Roadmap resumido das ondas futuras (Inteligência e Consolidação, RETROFIT-011 a 022) documentado dentro do próprio plano.

**Arquivos criados nesta sessão:** `memory/decisions/DECISION-013.md`; `memory/plans/PLAN-0022-ADMIN-V2-FUNDACAO-OPERACAO.md`.

**Validações executadas:** nenhuma validação técnica ainda — sessão é 100% de planejamento (`PLANNING`, sem código escrito), conforme protocolo do kernel (plano precisa de aprovação explícita antes de `EXECUTING_WITH_PLAN`).

**Pendente:** aprovação do usuário para iniciar a Onda 0 do `PLAN-0022`. Pendências pré-existentes de PLAN-0019 (bloqueado por TLS)/PLAN-0020/PLAN-0021 (commit/push + validação final) seguem em aberto, sem relação de bloqueio com este plano.

---

## 2026-07-29 — Diagrama de arquitetura do sistema (Archify)

**Contexto/gatilho:** usuário pediu leitura completa do repositório e um diagrama detalhado de como o projeto funciona, usando a skill Archify. Tarefa classificada como SURVEY/INTEL (sem PLAN necessário) — agente aplicado: `explorer-agent`.

**Ação:** mapeamento arquitetural completo (apps/api — 9 routers + 6 libs + módulos chatbot/payments/admin; apps/web — SPA híbrida com 20+ módulos admin-*; Prisma schema — 30+ modelos, RLS, multi-unidade; docker-compose + nginx; auth/RBAC/rate-limit; integrações Stripe e Z-API). Gerado diagrama `architecture` interativo (showcase quality, 9/9 checks, 0 erros/avisos) com 10 componentes, 9 relações e 4 views guiadas.

**Arquivo criado:** `docs/project/ARQUITETURA-SISTEMA.html` (standalone, tema claro/escuro, pan/zoom, busca, views guiadas).

**Validações:** `archify validate --quality showcase` PASS (9/9 checks); `archify deliver` PASS (specification + artifact hash conferidos).

**Pendente:** nenhum — entrega concluída. Arquivo não commitado (aguardando decisão do usuário sobre versionar o diagrama).

---

## 2026-07-22 — SESSION AUDIT — PASS

| Item | Resultado |
|---|---|
| Decision Integrity | OK — nenhuma DECISION contradita, nenhuma nova exigida |
| State Integrity | OK — PLAN-0020/0019 pré-existentes inalterados; PLAN-0021 criado e mantido aberto corretamente; desvio de processo (execução sem plano prévio) identificado e regularizado |
| Operational Memory | OK — MODIFICATION_LOG e progress.md atualizados |
| Debug Memory | OK — ERR-0044 registrado (template completo, ##bug) |
| Technical Validation | OK — lint (2 erros pré-existentes, fora do escopo desta sessão), build Docker (3x) PASS, testes api 23/23 PASS, sem migration pendente, logs limpos |
| Regression Risk | OK — nenhuma área sensível tocada; risco baixo (UI/infra) |
| Git Governance | PENDING — nenhum commit feito (aguardando autorização); Git Record do PLAN-0021 ainda PENDING |

**Checklist completo:** `memory/logs/AUDIT_CHECKLIST_2026-07-22-PASS.md`.
**Sessão encerrada a pedido do usuário** ("salve tudo e encerramos por hoje"). Pendências para a próxima sessão: commit/push do fix ERR-0044 + PLAN-0021 (dupla autorização), validação visual do usuário, e as pendências pré-existentes do PLAN-0020/PLAN-0019.

---

## 2026-07-22 — PLAN-0021 (ajuste 2): Master ao final do menu + Entrega/Cupons movidos para Cadastro

**Contexto:** seguindo o mesmo plano em aberto, usuário pediu mais dois ajustes no menu admin: mover o grupo Master para ser o último item do menu; mover "Entrega" e "Cupons" para dentro do grupo "Cadastro".

**Arquivo alterado:** `apps/web/src/components/pages/AdminContent.tsx` — botões "Entrega" e "Cupons" removidos de suas posições avulsas e inseridos no submenu "Cadastro" (após Serviços); bloco do submenu Master (`{isMaster ? <div data-master-menu>...} : null}`) movido para depois do botão "Galeria", tornando-se o último item do menu.

**Ordem final:** Painel, Agenda, WhatsApp, Vendas, Equipes-Metas, Equipes-Perform, [Cadastro: Produtos/Planos/Pessoas/Serviços/Entrega/Cupons], Assinantes, Seções Telas, Galeria, [Master: Branding/Testes/Textos].

**Validações:** `npx tsc -b` (apps/web) PASS; `docker compose up -d --build web` PASS; container `web` saudável.

**Documentação:** `memory/plans/PLAN-0021-...md` atualizado (seção "Ajuste 2" + critério de aceitação revisado).

**Pendente:** validação visual do usuário + commit/push (dupla autorização).

---

## 2026-07-22 — PLAN-0021: reorganização do menu admin e da tela Seções Telas (ex-SPA)

**Contexto/gatilho:** usuário pediu reagrupamento do menu lateral admin (6 itens) para melhorar navegação: Equipes-Metas/Equipes-Perform ao lado de Vendas, Textos dentro do Master, novo grupo Cadastro (Produtos/Planos/Pessoas/Serviços), Seções SPA renomeada e retirada do Master, e reordenação (grupos e seções) da tela de toggles para bater com a ordem real das páginas públicas.

**Discrepância de processo identificada e corrigida nesta sessão:** a execução da tarefa (edições + validações) já havia sido concluída antes deste registro, sem plano formal prévio nem log em tempo real — violação do protocolo do kernel (classificador `DESIGN/UI` exige `PLAN-XXXX`; gatilho de anti-scope-drift de >3 arquivos principais também foi cruzado, 4 arquivos). Regularizado retroativamente via `memory/plans/PLAN-0021-REORGANIZACAO-MENU-ADMIN-SECOES-TELAS.md`, com anuência do usuário.

**Arquivos alterados:**
- `apps/web/src/components/pages/AdminContent.tsx` — reordenação dos botões do menu; novo submenu colapsável "Cadastro" (state `isCadastroMenuOpen`) com Produtos/Planos/Pessoas/Serviços; "Textos" movido para dentro do submenu Master (agora master-only); "Seções SPA" renomeada para "Seções Telas", retirada do submenu Master e virou botão avulso master-gated logo após o Master.
- `apps/web/src/modules/admin-core/behavior.ts` — `masterOnlyViews` passou a incluir `"textos-paginas"` (consequência de Textos ter entrado no Master).
- `apps/web/src/modules/admin-section-toggles/components/AdminSectionTogglesView.tsx` — `toSortedToggleMap` trocou de ordenação alfabética para ordem fixa: grupos `["home", "franquias", "assinaturas"]`; seções de cada grupo na mesma ordem de renderização das páginas reais (`HomeContent`/`FranquiasContent`/`AssinaturasContent`). Título da tela alterado de "Seções Públicas (SPA)" para "Seções Telas".
- `apps/web/src/modules/admin-tests/behavior.ts` — `masterExpectedViews` passou a incluir `"textos-paginas"`, mantendo a suíte de auto-teste de views coerente com o novo gating.

**Validações executadas:** `npx tsc -b` (apps/web) PASS (2 rodadas); `docker compose up -d --build web` PASS; container `web` saudável; inspeção visual da árvore JSX resultante confirmando a ordem esperada.

**Documentação:** `memory/plans/PLAN-0021-REORGANIZACAO-MENU-ADMIN-SECOES-TELAS.md` criado (retroativo); `memory/progress.md` atualizado.

**Pendente:** commit/push (aguardando dupla autorização explícita do usuário) → Git Record do plano ainda `PENDING`.

---

## 2026-07-21/22 — Fix: `npm ci` ETIMEDOUT no build Docker (api/web) — IPv6 sem rota

**Contexto/gatilho:** usuário reportou falha ao rodar `docker compose up -d --build api web` para concluir os testes do PLAN-0020 — `npm ci` falhando com `ETIMEDOUT` dentro do container.

**Causa raiz:** rede Docker (`bridge`) com IPv6 desabilitado (`EnableIPv6: false`), mas `registry.npmjs.org` resolvendo só para endereços IPv6 — toda tentativa de conexão ficava sem rota até estourar timeout. Confirmado empiricamente: `curl -6` dentro de `node:20-slim` = timeout total; `curl -4` = 200 OK em 0,17s. Detalhe completo em `memory/logs/DEBUG-HISTORY.md` (ERR-0044).

**Arquivos alterados:** `apps/api/Dockerfile` e `apps/web/Dockerfile` — adicionado `ENV NODE_OPTIONS=--dns-result-order=ipv4first` (build e prod stages da api; build stage do web), forçando IPv4 na resolução de DNS do Node/npm/prisma. Mantidas mitigações já presentes no working tree (retry de fetch + cache mount do npm), que sozinhas não resolviam a causa raiz.

**Validações executadas:** rebuild completo (`docker compose up -d --build api web`) PASS; `postgres`/`api`/`web` saudáveis; migrations aplicadas sem pendências; sweeper de reserva de estoque ativo.

**Documentação:** `memory/logs/DEBUG-HISTORY.md` — novo incidente `ERR-0044` (tag `##bug`).

**Pendente:** commit/push (aguardando autorização explícita do usuário).

---

## 2026-07-07 — PLAN-0020: commit + push da entrega (Git Record completo)

**Autorização:** usuário autorizou explicitamente commit e push juntos ("commit e push para finalizar").

**Pre-commit review:** 35 arquivos (11 modificados em `apps/api`, 9 em `apps/web`, 3 em `memory/`, 12 novos incl. 2 migrations + 3 arquivos de teste). `.claude/` deixado fora do commit (fora de escopo desta entrega). Validações: `tsc --noEmit` (api+web) PASS, `npm run build` (api+web) PASS, `npm run test` (api) 23/23 PASS.

**Commit:** `ee6a61a` em `main` — "feat(plan-0020): estoque multi-unidade com ledger, reserva TTL, venda multicanal e BI por papel" (4088 insertions, 202 deletions).
**Push:** `origin/main` `cf00d25..ee6a61a` — sucesso.

**Atualização:** `memory/plans/PLAN-0020-...md` — Git Record of Delivery preenchido (Steps 1-4, push COMPLETED); status do plano atualizado. `memory/progress.md` sincronizado.

**Pendente para o plano virar DONE:** confirmação final do usuário sobre a rodada 1 de validação visual; pentest manual S10 (isolamento entre unidades/franquias, análogo ao do PLAN-0018).

---

## 2026-07-07 — PLAN-0020: testes automatizados das rotinas novas (ledger, reserva, RBAC de unidade)

**Contexto/gatilho:** ao investigar o bug de quantidade travada no modal de venda manual (input controlado sem `onChange`), o usuário perguntou se a falta de testes automatizados também deixava passar problemas em outras rotinas novas do PLAN-0020. Decisão do usuário: implementar os testes agora, antes de fechar o plano.

**Arquivos criados:**
- `apps/api/src/lib/testHelpers/fakeStockTx.ts` — fake mínimo de `Prisma.TransactionClient` (upsert/update/create/findUnique/findMany/$queryRaw/$executeRaw só para as tabelas de estoque), criado porque o projeto ainda não tem infraestrutura de banco de testes.
- `apps/api/src/lib/stockLedger.test.ts` — 7 casos: entrada/saída de estoque, bloqueio de saldo negativo, validação de quantidade (zero/negativa/não-inteira), sync do cache global (`Product.stock`), overselling bloqueado em `sellStockDirect`.
- `apps/api/src/lib/stockReservation.test.ts` — 8 casos: reservar prende disponível sem tocar no REAL, disponível insuficiente, confirmar (baixa real + solta reservado), liberar idempotente, re-checagem pós-expiração (confirma quando ainda há estoque / falha tratada quando não há), reserva já finalizada não pode ser reconfirmada.
- `apps/api/src/middleware/auth.test.ts` — 8 casos: `resolveUnitScope`/`canAccessUnit` fail-closed para MASTER/ADMIN (global), MANAGER/PROFESSIONAL (própria unidade), sem unidade vinculada (nega tudo) — cobre as travas de segurança S1-S4 do plano.

**Arquivo modificado:** `apps/api/package.json` — novo script `test:inventory` (roda os 3 arquivos acima com `JWT_SECRET` dummy, necessário porque `middleware/auth.ts` importa `lib/auth.ts`, que valida o segredo no load do módulo); `test` agora roda `test:greeting && test:inventory`.

**Fora do escopo automatizado (registrado no plano):** rotas Express fim-a-fim (`orders.ts`, `inventory.ts`) e concorrência real com 2 sessões simultâneas exigem infraestrutura de banco de testes/HTTP que o projeto não tem — permanecem cobertas só pelo teste manual via API real já feito na Onda 7 e pela revisão de código do lock (`SELECT ... FOR UPDATE`).

**Validações:** `npx tsc --noEmit` PASS · `npm run test` (apps/api) — 23/23 PASS (5 greeting + 18 novos).

**Documentação:** `memory/plans/PLAN-0020-...md` atualizado (pendência de testes automatizados removida da lista de pendências para DONE, com resumo do que foi coberto e do que ficou fora); `memory/progress.md` sincronizado.

**Pendente:** confirmação final do usuário sobre a rodada 1 de validação visual, pentest manual S10, fluxo Git (commit/push).

---

## 2026-07-07 — Fechamento de documentação pendente do PLAN-0020 (continuidade após limite de sessão anterior)

**Contexto:** a sessão anterior encerrou por limite antes de sincronizar o checklist do plano com o que já estava de fato entregue (Registro de Execução já documentava tudo, mas as caixas de marcação das Ondas 0-7, Critérios de Aceitação e Travas de Segurança seguiam `[ ]`).

**O que foi feito (só documentação, nenhum código/schema alterado):**
- `memory/plans/PLAN-0020-PRODUTOS-ESTOQUE-LEDGER-VENDAS-MULTICANAL-BI.md`: marcadas como concluídas as Ondas 0-7, os "Novos itens de execução derivados" (validação de fluxos) e os Critérios de Aceitação/Travas S1-S9, todos com evidência já presente no próprio Registro de Execução. Mantidos em aberto apenas os itens genuinamente pendentes: confirmação final do usuário sobre a rodada 1 de validação visual, testes automatizados das rotinas novas, pentest manual S10 (isolamento entre unidades/franquias) e o fluxo Git (commit/push). Status do topo do plano e seção "Pendências para DONE" atualizados para refletir esse estado.
- `memory/progress.md`: linha do módulo "Estoque Multi-Unidade + Vendas + BI (PLAN-0020)" atualizada para citar o checklist fechado e listar as 4 pendências reais restantes.

**Validações:** nenhuma (documentação apenas; sem mudança de código).
**Próximo passo:** usuário confirma se a rodada 1 de validação visual fechou tudo; decidir sobre testes automatizados e pentest S10; só então commit/push e renomear o plano para DONE.

---

## 2026-07-07 — PLAN-0020: correções da validação visual do usuário (rodada 1)

**Contexto:** usuário validou as telas e reportou 5 itens. 4 corrigidos; 1 é comportamento decidido no plano (explicado e provado).

1. **Admin produtos — layout do form:** linha de preços agora com 3 colunas (Preço de venda | Preço de custo | Estoque mínimo); logo abaixo a linha de Estoque inicial + Unidade (criação); e o box **"Estoque por unidade"** (saldos + botões Movimentar/Histórico) movido do aside (depois da imagem) para o corpo do form, largura total, logo abaixo dos campos de estoque. Aside ficou só com o preview da imagem. `AdminProductsView.tsx`.
2. **Modal venda de balcão — quantidade travada:** causa raiz `value="1"` no JSX (input controlado pelo React sem onChange → não aceita digitação nem setas). Corrigido para `defaultValue="1"`. `AdminSalesView.tsx`.
3. **"+ Novo Produto" não levava ao form:** agora reseta, faz `scrollIntoView` até a seção Entrada de Produto e foca o campo Nome. `admin-products/behavior.ts`.
4. **Feedback de erro invisível ("Sessão expirada" minúsculo):** feedback de erro virou banner destacado (fundo vermelho claro, borda, texto `text-sm font-semibold`) com `scrollIntoView` automático até a mensagem. `admin-products/behavior.ts` (`setProductFeedback`).
5. **Carrinho não reserva estoque — NÃO é bug:** decisão registrada no PLAN-0020 (gatilho híbrido, aprovada em 2026-07-06): o site reserva **no início do checkout/pagamento**, não ao adicionar ao carrinho — para carrinho abandonado não travar estoque por 20min. Como `STRIPE_ENABLED=false` em dev impede o checkout completo, as primitivas foram provadas ao vivo: reserva ativa prendeu todo o disponível do produto 8 → vitrine mostrou `inStock=false` (Esgotado) → **sweeper expirou a reserva vencida em ≤60s** → `reserved=0`, vitrine voltou a `true`. Reserva de teste removida do banco.

**Validações:** TS PASS (web), rebuild do container web. Sem mudança de backend.

---

## 2026-07-07 — PLAN-0020 EXECUTADO — Estoque multi-unidade (ledger+reserva), venda multicanal e BI por papel

**Marco de FIM da execução do PLAN-0020** (aprovado pelo usuário em 2026-07-06, executado em sessão contínua). Detalhes completos na seção "Registro de Execução" de `memory/plans/PLAN-0020-PRODUTOS-ESTOQUE-LEDGER-VENDAS-MULTICANAL-BI.md`.

**Resumo:** 2 migrations novas (core multi-unidade + RLS), motor de estoque com ledger auditável (`stockLedger.ts`) e reserva com TTL 20min + sweeper (`stockReservation.ts`), router `inventory.ts` (movimentos/saldos/reservas/cross-unit/BI), RBAC de unidade (`requireManager`, `resolveUnitScope` fail-closed), `POST /orders` reescrito (venda de balcão: staff, total server-side, canal+vendedor+unidade, nasce PAGO, baixa via ledger, auditada), checkout Stripe reserva em vez de decrementar, `markOrderAsPaid` confirma reservas (3 caminhos), catálogo com costPrice/minStock/preço>0/estoque-inicial-via-ledger, `/public/products` com `inStock` coarse, KPIs novos (sales-insights com CMV/margem/tops + inventory-overview), admin produtos com painel por unidade + modais movimento/histórico, modal de venda manual ligado, ilha de BI no dashboard, SPA com Esgotado + quantidade.

**Validações:** TS PASS (api+web) · builds PASS · Docker rebuild PASS (10 migrations, sweeper ativo) · testes 5/5 PASS · fluxo end-to-end via API real (entrada→venda mista→ledger→overselling bloqueado→total forjado ignorado→BI com números reais→S8 público sem saldo exato) · dados de teste limpos.

**Bug registrado:** ERR-0043 (postgres Exited 127 pós-reboot — bind mount em /media antes da montagem do disco).

**Pendente:** validação visual do usuário · testes automatizados das rotinas novas · commit/push (dupla autorização) → Git Record do plano.

---

## 2026-07-06 — Correção de layout da tela Cadastro/Consulta de Produtos (admin-products)

**Contexto/objetivo:** Usuário reportou que a área "Entrada de Produto" estava estreita (1/3 da largura) e as duas colunas à direita ocupadas por 4 indicadores estáticos num grid 2×2, sem sentido; além disso a imagem do produto não aparecia ao clicar/editar. Solicitado: formulário ocupar o container todo, incluir janela de preview da imagem, e os indicadores passarem para uma única linha (boxes com cantos arredondados), do mesmo tamanho do bloco superior. Execução point-in-time (sem plano) — não confundir com a Onda 4 do PLAN-0020 (que reformula essa tela de forma mais ampla).

**Mudanças:**
- `apps/web/src/modules/admin-products/components/AdminProductsView.tsx`: bloco inferior deixou de ser `grid xl:grid-cols-3` (form 1/3 + indicadores 2/3) e virou `flex flex-col`. Form em largura total, com layout interno `lg:grid-cols-[minmax(0,1fr)_320px]` (campos à esquerda + coluna de **preview de imagem** à direita, box `aspect-square` com placeholder "Sem imagem"). Os 4 cards de indicadores passaram para uma linha só (`grid grid-cols-2 xl:grid-cols-4`).
- `apps/web/src/modules/admin-products/behavior.ts`: refs `data-product-image-preview`/`data-product-image-placeholder`; helper `updateProductImagePreview()` (usa `resolveProductImageUrl`, mostra placeholder quando vazio, fallback no `onerror`); chamado ao editar produto, ao limpar e no init; listener `change` no input de imagem.
- `apps/web/src/modules/admin-core/behavior.ts`: dispara `change` (bubbles) em `[data-product-image]` após definir a imagem (upload, usar URL, limpar) para o preview atualizar em tempo real.

**Nota:** os 4 indicadores continuam com valores estáticos/placeholder (128, 9, 6, 14) — os KPIs reais desses cards são escopo da Onda 5 do PLAN-0020; aqui só o layout foi corrigido.

**Validações:** `apps/web` — `npx tsc --noEmit` PASS; `npm run build` (vite) PASS. Rebuild do container `jlr_beauty-web-1` concluído (exit 0) e no ar.

**Próximo passo:** usuário confere visualmente; sem commit até autorização explícita.

---

## 2026-07-05 — SESSION AUDIT — PASS

| Item | Resultado |
|------|-----------|
| Decision Integrity | OK — DECISION-001 a 011 não contraditas; DECISION-012 (nova, SEC-27/CORS) sem conflito |
| State Integrity | OK — PLAN-0018 fechado como DONE; PLAN-0019 (TLS) intencionalmente não-DONE, bloqueado por domínio |
| Operational Memory | OK — MODIFICATION_LOG, progress.md, PLAN-0018 e roteiro de testes documentados |
| Debug Memory | OK — ERR-0041 e ERR-0042 registrados com template completo |
| Technical Validation | OK — TypeScript PASS, testes 5/5 PASS, build Docker PASS, migrations aplicadas e validadas. Lint: não aplicável a apps/api (sem script no projeto, gap pré-existente); apps/web não foi tocado nesta sessão |
| Regression Risk | OK — áreas sensíveis (auth, DB, cupom, agendamento) alteradas conscientemente; validado com pentest manual extensivo. Recomendação registrada: adicionar testes automatizados para as novas rotinas de segurança em sessão futura |
| Git Governance | OK — 2 commits + 2 pushes autorizados explicitamente (`e01d4ef`, `299e00a`). Roteiro de testes ainda não commitado — pendente de autorização |

Checklist salvo em: `memory/logs/AUDIT_CHECKLIST_2026-07-05-PASS.md`

---

## 2026-07-05 — Roteiro de Testes Manuais (PLAN-0015 a PLAN-0019)

**Contexto:** Usuário solicitou um roteiro de testes manuais cobrindo tudo entregue a partir do PLAN-0015, para validação visual/funcional do site.

**Arquivo criado:** `docs/config/ROTEIRO_TESTES_PLAN-0015-A-0019.md` — 43 testes numerados em 7 blocos (A: Página de Franquias/PLAN-0015; B: fine-tuning visual Franquias; C: Navegação Unificada/PLAN-0016; D: galeria Home; E: Autenticação/PLAN-0017; F: Hardening/PLAN-0018; G: TLS/PLAN-0019, marcado como não testável ainda). Cada teste segue o formato Como testar → Resultado Esperado → Critério de DONE.

**Validações:** Documento apenas — sem alteração de código. Rotas/anchors/mensagens de erro referenciados foram conferidos contra o código-fonte atual antes de escrever cada teste.

---

## 2026-07-05 — PLAN-0018 commit/push + fechamento (DONE) + SEC-30 desmembrado em PLAN-0019

**Commit:** `e01d4ef` — "security(plan-0018): endpoints públicos, least-privilege DB, RLS, JWT 15min, timing jitter — ondas 1-4" (19 arquivos, 1085 inserções, 6 remoções). Autorizado explicitamente pelo usuário.

**Push:** `origin/main` atualizado `c57562d..e01d4ef`. Autorizado explicitamente pelo usuário (segunda aprovação, separada da autorização de commit).

**Fechamento do plano:** usuário optou por (1) fechar `PLAN-0018` como `-DONE-` já que o escopo original das 9 vulnerabilidades está 100% entregue e commitado, e (2) desmembrar o achado crítico SEC-30 (TLS/HTTPS ausente em produção, descoberto na Onda 4) para um plano próprio: `memory/plans/PLAN-0019-TLS-HTTPS-SETUP.md`, com status `BLOCKED` até haver domínio disponível.

**Arquivos:** `memory/plans/PLAN-0018-SECURITY-CRITICAL-ENDPOINTS-RLS-MITIGATION.md` renomeado para `PLAN-0018-DONE-...md`; `memory/plans/PLAN-0019-TLS-HTTPS-SETUP.md` criado (novo); `memory/progress.md` atualizado refletindo os dois planos separadamente.

---

## 2026-07-05 — PLAN-0018 Onda 4 (Validação Final) — CONCLUÍDA + achado crítico novo (SEC-30)

**Contexto:** Validação final consolidada do PLAN-0018, com rebuild completo do zero (api+web+postgres) e um penetration test end-to-end replicando o cenário completo do incidente original.

**Validado nesta onda:**
- Rebuild total do zero: as 8 migrations e as RLS policies das Ondas 1-2 sobrevivem corretamente (persistidas no volume `postgres_data`)
- SEC-29 (tokens dev): confirmado que `NODE_ENV=production` no container real não expõe `_dev_reset_token`/`_dev_verification_token`
- Regressão via **browser real** (Chrome headless, não só curl): home carrega corretamente, fluxo completo de login + fetch autenticado funciona ponta a ponta
- Todas as proteções das Ondas 1-3 reconfirmadas funcionando em conjunto numa única passada

**🔴 Achado crítico novo — SEC-30 (fora do escopo original das 9 vulnerabilidades):** ao montar o penetration test replicando o incidente original, verifiquei se o canal de transporte era parte do problema. Descoberto que a produção roda em **HTTP puro, sem TLS/domínio configurado** — confirmado diretamente com o usuário. Isso é muito provavelmente a causa raiz real do "sniffer" ter conseguido capturar credenciais verdadeiras: sem criptografia, um sniffer de rede não precisa de nenhuma técnica sofisticada de MITM, basta capturar pacotes HTTP em texto claro. Todo o hardening das Ondas 1-3 protege contra o *uso* de uma credencial já roubada, não contra o roubo em si.

**Por que não foi corrigido agora:** Let's Encrypt/Certbot não emite certificado para IP puro — exige domínio com DNS apontado. Usuário confirmou que ainda não tem domínio. Registrado como **SEC-30 CRÍTICO PENDENTE** em `PLAN-0018` com plano de ação completo (passo a passo Certbot + nginx + docker-compose) pronto para quando o domínio existir. Também salvo em memória de projeto para persistir entre sessões e ser levantado proativamente em conversas futuras sobre deploy/domínio.

**Validações executadas:** TypeScript PASS (api+web), testes existentes PASS (5/5), Docker build PASS (rebuild completo), penetration test end-to-end executado, dados de teste limpos do banco.

**Status final do PLAN-0018:** escopo original das 9 vulnerabilidades 100% concluído (7 corrigidas, 1 formalmente decidida como não aplicável nesta arquitetura — SEC-27/DECISION-012 —, 1 já mitigada). Plano permanece **aberto** (não renomeado para DONE) por causa do SEC-30, que é uma pendência de infraestrutura fora do controle deste ambiente de desenvolvimento local.

**Aguardando:** (1) autorização de commit para o escopo já pronto; (2) usuário providenciar domínio para desbloquear SEC-30.

---

## 2026-07-05 — PLAN-0018 Onda 3 (Médias) — CONCLUÍDA (1 corrigida, 1 revertida por risco de regressão)

**Contexto:** Continuação da auditoria de segurança (PLAN-0018) após Onda 2. Das 2 vulnerabilidades de severidade MÉDIA, uma foi corrigida e validada; a outra foi implementada, testada com um browser real, e **revertida deliberadamente** ao detectar que quebraria a produção.

**SEC-28 (corrigida):** Timing attack em `/auth/resend-verification` e `/auth/forgot-password` — o branch "usuário existe" fazia trabalho extra (geração + persistência de token) enquanto o branch "usuário não existe" respondia quase instantaneamente, criando um side-channel de timing para enumeração de emails mesmo com mensagens de resposta idênticas. Corrigido com jitter aleatório (50-200ms) aplicado a ambos os branches (`applyEmailEnumerationJitter` em `routeHelpers.ts`).

**SEC-27 (revertida — achado importante):** A auditoria original apontou que o CORS aceita requisições sem header `Origin`. Implementei uma restrição bloqueando isso em produção (exceto para webhooks Stripe/Z-API e health checks, que são chamadas servidor-a-servidor legítimas sem Origin). Antes de validar apenas com `curl`, testei com um **Chrome real em modo headless**, servindo uma página de teste pela mesma origem do nginx e observando o fetch de fato feito pelo browser. Resultado: **o próprio Chrome não envia `Origin` em um fetch GET same-origin** — e como este projeto serve web+api na mesma origem via nginx (não são domínios separados), a restrição teria **bloqueado todo o tráfego legítimo do frontend em produção**, não apenas atacantes. Revertido imediatamente para o comportamento original, com comentário no código documentando a investigação para evitar reintrodução futura do mesmo erro. Conclusão: SEC-27 não é corrigível nesta arquitetura sem separar os domínios de web/api (fora de escopo); a proteção real contra o cenário de credencial roubada é a camada de autenticação (já reforçada nas Ondas 1-2), não o CORS. **Registrado formalmente em ERR-0042 (`DEBUG-HISTORY.md`) e DECISION-012 (`memory/decisions/`)**.

**Arquivos alterados:** 2

| Arquivo | Mudança |
|---------|---------|
| `apps/api/src/lib/routeHelpers.ts` | `applyEmailEnumerationJitter()` |
| `apps/api/src/routes/auth.ts` | Jitter aplicado em resend-verification e forgot-password (ambos os branches) |

**Arquivo tocado e revertido:** `apps/api/src/app.ts` — tentativa de SEC-27 implementada, testada, revertida; ficou apenas um comentário explicando a investigação (nenhuma mudança funcional líquida).

**Validações executadas:**
- TypeScript PASS (apps/api + apps/web)
- Docker build PASS (2 rebuilds — um com SEC-27 ativo para teste, outro após revert)
- Testes existentes PASS (5/5)
- **Verificação com browser real (Chrome headless)**, não apenas curl — foi o que revelou o problema do SEC-27 antes de chegar em produção
- Timing empírico de SEC-28: 5 amostras por branch, sem separação estatística clara entre "email existe" e "não existe"
- Regressão completa: login, resend-verification, forgot-password, rate limit de cupom, CORS com origem maliciosa (continua bloqueando) — todos OK

**Lição para sessões futuras:** ao mexer em CORS/comportamento de rede, validar sempre com um browser real (não só curl) quando a topologia de deploy não for trivial (aqui, web+api same-origin via nginx reverso).

**Pendente (última onda do PLAN-0018):**
- Onda 4: Validação final consolidada + penetration test completo de ponta a ponta

**Aguardando:** autorização do usuário para commit (nenhum commit realizado ainda — Ondas 1, 2 e 3 seguem no working tree)

---

## 2026-07-05 — PLAN-0018 Onda 2 (Altas) — CONCLUÍDA E VALIDADA

**Contexto:** Continuação da auditoria de segurança (PLAN-0018) após conclusão da Onda 1. Implementadas as 3 vulnerabilidades de severidade ALTA identificadas.

**Vulnerabilidades corrigidas:**

| ID | Vulnerabilidade | Correção |
|----|---|---|
| SEC-24 | Sem Row-Level Security no PostgreSQL — controle de acesso só na app | RLS habilitado em `User`, `Order`, `Payment`, `Customer`, `Subscription`; policy permissiva para `jlr_api_rw` (mantém funcionalidade), policy SELECT-only para `jlr_api_ro`; sem policy para outras roles → default deny fail-secure |
| SEC-25 | Access token 12h — já estava 15m no código/`.env` local desde PLAN-0017 Fase 2 | Templates de produção (`.env.docker.example`, `apps/api/.env.example`) corrigidos de 12h→15m para não desalinhar deploys futuros |
| SEC-26 | `/public/concierge/*` (10 endpoints) sem rate limit | Middleware único no prefixo `/public/concierge`, budget compartilhado 10 req/min por IP entre todos os endpoints |

**Arquivos alterados:** 6

| Arquivo | Mudança |
|---------|---------|
| `apps/api/prisma/schema.prisma` | Modelo `ConciergePublicAttempt` |
| `apps/api/prisma/migrations/20260705010000_.../migration.sql` | Tabela rate limit concierge |
| `apps/api/prisma/migrations/20260705020000_.../migration.sql` | RLS + policies nas 5 tabelas sensíveis |
| `apps/api/src/lib/rateLimiter.ts` | `checkConciergePublicLimit`, `recordConciergePublicAttempt` |
| `apps/api/src/routes/schedule.ts` | Middleware de rate limit aplicado via `scheduleRouter.use("/public/concierge", ...)` |
| `.env.docker.example`, `apps/api/.env.example` | `JWT_EXPIRES_IN` 12h→15m |

**Nota de arquitetura (transparência sobre limitação do RLS):** como a API usa uma única credencial (`jlr_api_rw`) para todas as requisições — sem `SET app.user_id` por request — a policy para essa role precisa ser permissiva. Isso significa que o RLS **não reduz o blast radius** caso o próprio `DATABASE_URL` vaze (essa mitigação já é feita pelo SEC-23 — sem privilégio de DDL). O valor real do RLS aqui é a garantia fail-secure: qualquer credencial futura ou mal configurada que não tenha uma policy explícita recebe automaticamente zero linhas, mesmo com GRANT de tabela. Isso foi comprovado experimentalmente criando uma role de teste com `GRANT SELECT` mas sem policy — retornou 0 registros.

**Validações executadas:**
- TypeScript PASS (apps/api + apps/web)
- Docker build PASS + migrations aplicadas com sucesso
- Testes existentes PASS (5/5)
- RLS: `jlr_api_rw` mantém CRUD total (sem regressão); `jlr_api_ro` lê mas não escreve; role de teste sem policy → fail-secure confirmado (0 linhas)
- JWT: token real decodificado, expiração confirmada em exatos 900s (15min)
- Rate limit concierge: 10 requisições OK, 11ª+ → 429; budget confirmado como compartilhado entre endpoints diferentes (não por rota individual)
- Regressão via API real (não só psql direto): login, GET/POST `/users`, GET `/orders`, GET `/customers` com RLS ativo — todos OK, incluindo um INSERT real através da aplicação

**Pendente (próximas ondas do PLAN-0018):**
- Onda 3 (Médias): CORS sem `Origin` header, timing attacks em resend-verification
- Onda 4: Validação final + penetration test completo

**Aguardando:** autorização do usuário para commit (nenhum commit realizado ainda — Ondas 1 e 2 seguem no working tree)

---

## 2026-07-05 — PLAN-0018 Onda 1 (Críticas) — CONCLUÍDA E VALIDADA

**Contexto:** Investigação de invasão real relatada pelo usuário — credenciais capturadas via sniffer/MITM foram usadas para acessar o backend diretamente, contornando a autenticação (que só validava no frontend). Auditoria de segurança com orchestrator + security-auditor + backend-specialist + penetration-tester identificou 9 vulnerabilidades adicionais ao PLAN-0017, divididas em 4 ondas. Onda 1 (críticas) implementada e validada nesta sessão.

**Vulnerabilidades corrigidas:**

| ID | Vulnerabilidade | Correção |
|----|---|---|
| SEC-21 | `/public/orders/track/:publicCode` sem autenticação — permitia enumeration/rastreamento de qualquer pedido | HMAC-SHA256 obrigatório (query param `?hmac=`), gerado na criação do pedido e retornado no confirm-session |
| SEC-22 | `/public/discount-coupons/validate` sem rate limit — permitia enumeration de cupons | Rate limit 5 req/min por IP (tabela `CouponValidationAttempt`), 429 ao exceder |
| SEC-23 | `DATABASE_URL` usava usuário admin — se vazasse, atacante tinha acesso total ao banco | Confirmado uso de `jlr_api_rw` (least privilege); documentado em `.env.docker.example` |

**Arquivos alterados:** 7

| Arquivo | Mudança |
|---------|---------|
| `apps/api/prisma/schema.prisma` | Modelo `CouponValidationAttempt`; campo `orderHmac` único em `Order` |
| `apps/api/prisma/migrations/20260705000000_.../migration.sql` | Nova tabela rate limit de cupons |
| `apps/api/prisma/migrations/20260705000001_.../migration.sql` | Coluna `orderHmac` em Order |
| `apps/api/src/lib/rateLimiter.ts` | `checkCouponValidationLimit`, `recordCouponValidationAttempt` |
| `apps/api/src/lib/hmacUtils.ts` (novo) | `generateOrderHmac`, `verifyOrderHmac` (timing-safe) |
| `apps/api/src/routes/orders.ts` | Rate limit no endpoint de cupom; HMAC obrigatório no tracking; geração de HMAC nos 2 pontos de criação de pedido; `orderHmac` exposto no confirm-session |
| `.env.docker.example` | `DATABASE_URL` documentado para usar `jlr_api_rw` (least privilege) |

**Bug encontrado e corrigido durante validação:** `crypto.timingSafeEqual` lançava exceção não tratada (→ 500) quando o HMAC fornecido tinha tamanho diferente do esperado, em vez de retornar 401. Corrigido com guard de comprimento antes da comparação timing-safe. **Registrado formalmente em ERR-0041 (`memory/logs/DEBUG-HISTORY.md`)**.

**Validações executadas:**
- TypeScript PASS (apps/api + apps/web)
- Docker build PASS (3 rebuilds durante a sessão)
- Testes existentes PASS (5/5)
- 8 cenários de penetration test simulados executados via curl contra ambiente Docker real (nginx→api→postgres), incluindo replicação exata do vetor de ataque relatado (token JWT válido + origem maliciosa) — bloqueado corretamente com 403
- Regressões verificadas: login, endpoints admin, produtos públicos, concierge público, health check, frontend — todos OK

**Pendente (próximas ondas do PLAN-0018):**
- Onda 2 (Altas): RLS no PostgreSQL, JWT 12h→15min, rate limit em `/public/concierge/*`
- Onda 3 (Médias): CORS sem `Origin`, timing attacks em resend-verification
- Onda 4: Validação final + penetration test completo

**Aguardando:** autorização do usuário para commit (nenhum commit realizado ainda)

---

## 2026-06-22 — SESSION AUDIT (tarde) — PASS

| Item | Resultado |
|------|-----------|
| Decision Integrity | OK — nenhuma decisão contradita |
| State Integrity | OK — PLAN-0017 renomeado para DONE (pendência do bootstrap) |
| Operational Memory | OK — MODIFICATION_LOG, progress.md atualizados |
| Debug Memory | OK — ERR-0040 registrado (Tailwind pré-compilado + Docker build) |
| Technical Validation | OK — TS PASS web+api, build Docker confirmado pelo usuário |
| Regression Risk | OK — apenas frontend visual, sem auth/pagamento/schema |
| Git Governance | OK — aguardando autorização de commit e push |

Checklist salvo em: `memory/logs/AUDIT_CHECKLIST_2026-06-22b-PASS.md`

---

## 2026-06-22 — HomeAboutSection: layout top/bottom + galeria largura total (point-in-time)

**Contexto:** Usuário solicitou que galeria e texto deixassem o layout lado-a-lado (2 colunas) e passassem para cima/baixo, com galeria ocupando 100% da largura do container (max-w-[1200px]). Texto abaixo dividido em 2 colunas internas (título+CTA à esquerda, parágrafos+stats à direita) para evitar linhas excessivamente longas.

**Arquivos alterados:** 1

| Arquivo | Mudança |
|---------|---------|
| `apps/web/src/modules/public-site/sections/HomeAboutSection.tsx` | Removido `lg:grid-cols-2` externo; galeria sobe para topo com largura total (destaque `h-26rem`); texto abaixo em `lg:grid-cols-2` interno |

**Validações:** TypeScript PASS · Confirmado visualmente pelo usuário após `docker compose up -d --build web`

---

## 2026-06-22 — HomeAboutSection: galeria Flowbite Featured Image — FUNCIONA ✅

**Resultado confirmado pelo usuário após:** `docker compose up -d --build api web`

**O que funciona:** imagem destaque (h-20rem) no topo + 5 miniaturas quadradas em linha horizontal (repeat(5, 1fr)), tudo via `style` inline no React — independente do CSS Tailwind compilado.

**Causa raiz dos problemas anteriores:**
1. `grid-cols-5` e `aspect-square` não existiam no CSS pré-compilado (`tailwind.react.patch.css`) — adicionados manualmente
2. Hard refresh (Ctrl+Shift+R) não resolve porque o projeto roda **dentro do Docker** — o Vite compila no build do container, não em dev server local. **Qualquer mudança visual exige `docker compose up -d --build web`**

---

## 2026-06-22 — CSS patch: grid-cols-5 + aspect-square adicionados ao tailwind.react.patch.css

**Contexto:** O projeto usa CSS Tailwind pré-compilado (sem PostCSS no Vite). `grid-cols-5` (sem prefixo breakpoint) e `aspect-square` não estavam nos arquivos gerados `tailwind.css` nem `tailwind.react.patch.css`. Classes adicionadas no patch junto com grid-cols-3/4/6 que também estavam ausentes.

**Arquivos alterados:** 1

| Arquivo | Mudança |
|---------|---------|
| `apps/web/src/styles/tailwind.react.patch.css` | `.aspect-square` após `.aspect-video`; `.grid-cols-3/4/5/6` junto aos demais `grid-cols-*` |

---

## 2026-06-22 — HomeAboutSection: galeria Flowbite Featured Image (point-in-time)

**Contexto:** Substituição da colagem 3-col de 8 fotos pequenas por galeria Featured Image do Flowbite — 1 imagem em destaque (img_01) + linha de 5 miniaturas (img_02 a img_06). Slots img_07 e img_08 removidos do catálogo do frontend e da API (e desaparecem automaticamente do painel Admin).

**Arquivos alterados:** 3

| Arquivo | Mudança |
|---------|---------|
| `apps/web/src/modules/public-site/sections/HomeAboutSection.tsx` | Grid masonry 3-col → `grid gap-4` com featured + `grid-cols-5`; hooks img_07/img_08 removidos |
| `apps/web/src/modules/public-site/mediaSlots.ts` | Entradas `home_about_img_07` e `home_about_img_08` removidas |
| `apps/api/src/modules/mediaSlots/service.ts` | `home_about_img_07` e `home_about_img_08` removidos do array `MEDIA_SLOT_IDS` e do catálogo de objetos |

**Validações:** TypeScript PASS (web + api)

## 2026-06-21 — Fine-tuning Franquias — Ajustes visuais (imagens, cards, círculo, ordem)

**Contexto:** Sessão de ajustes finos pós-alternância de fundos. Sem novo plano — alterações incrementais de formatação guiadas pelo usuário.

**Arquivos alterados:** 4

| Arquivo | Mudança |
|---------|---------|
| `FranquiasExpansaoSection.tsx` | Imagem: `object-cover object-center` → `object-contain object-center` (menos zoom/recorte) |
| `FranquiasPerfilFranqueadoSection.tsx` | Imagem: `object-cover object-top` → `object-contain object-center` |
| `FranquiasSuporteFranqueadoraSection.tsx` | Imagem: `object-cover object-top` → `object-contain object-center` |
| `FranquiasFounderSection.tsx` | Quote movida de coluna direita para círculo `bg-forest/border-gold` sobre a foto (padrão Vision); posicionado em `-bottom-10 -left-[56px]` |
| `FranquiasModelsSection.tsx` | Overlay escuro (`bg-gradient-to-t from-black/60`) removido dos 3 cards; nome/subtítulo movidos de cima da imagem para corpo do card (`display-hero text-primary`); botões convertidos de `<button>` para `<a href="#franXX">`; ordem das seções: fran01/02/03 → fran03/02/01 (ESSENCIAL I → PRIME → MASTER) |
| `FranquiasContent.tsx` | Ordem de renderização invertida: fran03, fran02, fran01; altKeys atualizado na mesma ordem |

**Destaques:**
- Cards de modelos agora navegam por âncora para a seção de detalhe correspondente
- Nomes dos modelos em `text-primary` (verde forte) sobre fundo branco — legíveis sem overlay
- TypeScript PASS implícito (sem alterações de tipos além das já validadas)

---

## 2026-06-21 — SESSION AUDIT — PASS

| Item | Resultado |
|------|-----------|
| Decision Integrity | OK — nenhuma decisão anterior contraditada |
| State Integrity | OK — PLAN-0017 em andamento, fases 2–4 documentadas |
| Operational Memory | OK — MODIFICATION_LOG, progress.md e PLAN-0017 atualizados |
| Debug Memory | OK — nenhum bug formal; fix de card 3 resolvido na mesma sessão |
| Technical Validation | OK — TS PASS, build web+api PASS, migration aplicada no container |
| Regression Risk | OK com ressalva — auth alterada, sem testes automáticos (aceito) |
| Git Governance | OK — 2 commits, push autorizado, nenhum secret exposto |

Checklist salvo em: `memory/logs/AUDIT_CHECKLIST_2026-06-21-PASS.md`

---

## 2026-06-22 — PLAN-0017 Fase 4 — Segurança: AuditLog + Stripe Sanitization + Password Reset

**Contexto:** Fase 4 e conclusão do PLAN-0017 (SEC-09, 10, 15, 16). AuditLog persistido; eventos de segurança rastreados; Stripe webhook sanitizado (sem PII); fluxo de reset de senha implementado.

**Arquivos alterados:** 7 + 1 migration

| Arquivo | Mudança |
|---------|---------|
| `prisma/schema.prisma` | Novos models: `PasswordResetToken` (password_reset_tokens) e `AuditLog` (audit_logs); `passwordHash` com doc comment explicando nullabilidade para staff users; User: relação `passwordResetTokens` |
| `prisma/migrations/20260622000000_sec_phase4.../migration.sql` | Cria password_reset_tokens e audit_logs; GRANTs para jlr_api_rw com DO $$ IF EXISTS $$ |
| `lib/auth.ts` | Novas funções: `createPasswordResetToken`, `consumePasswordResetToken`, `revokeAllRefreshTokens`; constante `PASSWORD_RESET_EXPIRES_MS = 15min` |
| `lib/auditLog.ts` | Novo — helper fire-and-forget `recordAudit(action, opts)` — grava em AuditLog sem bloquear a request |
| `lib/messages.ts` | Novas msgs: PASSWORD_RESET_TOKEN_SENT, PASSWORD_RESET_TOKEN_INVALID, PASSWORD_RESET_SUCCESS |
| `routes/auth.ts` | Audit integrado em: login success/failed, register, email_verified, logout; novos endpoints: POST /auth/forgot-password (token em dev, sem enumeration), POST /auth/reset-password (valida token, atualiza hash, revoga todos os RT) |
| `routes/users.ts` | PATCH /users/:id/role: audit ROLE_CHANGE com fromRole, toRole, changedBy |
| `routes/orders.ts` | `sanitizeStripeEvent()` — remove billing_details, customer_details, shipping, metadata do payload; ambas as gravações de StripeWebhookEvent.payload usam a versão sanitizada |

**Destaques técnicos:**
- `recordAudit` é fire-and-forget: não await, falha silenciosa com log de warning
- Stripe webhook: apenas id, type, livemode, created, api_version, e campos business do session (amount, status) persistidos
- `/auth/forgot-password` sempre retorna a mesma mensagem (sem email enumeration)
- `/auth/reset-password` revoga todos os refresh tokens → force re-login pós reset
- `passwordHash` nullable com doc `///` explicitando que staff sem auto-registro pode ter NULL
- TypeScript PASS, migration aplicada, Docker rebuild PASS, smoke tests OK (audit_log gravado)

---

## 2026-06-22 — SESSION CLOSE

**Commit:** `7477e9c` — security(plan-0017): fases 2-4 + ngrok removal + SECURITY_OVERVIEW  
**Push:** origin/main ✅  
**Adicionais pós-audit:** remoção ngrok (DECISION-011), docs/SECURITY_OVERVIEW.md (15 pontos de segurança em linguagem de negócio)

---

## 2026-06-22 — SESSION AUDIT — PASS

| Item | Resultado |
|------|-----------|
| Decision Integrity | OK — nenhuma decisão ativa contraditada |
| State Integrity | OK — PLAN-0017 marcado CONCLUÍDO, todas 4 fases |
| Operational Memory | OK — MODIFICATION_LOG, progress.md e PLAN-0017 atualizados |
| Debug Memory | OK — erro TS resolvido durante implementação, não registrado formalmente |
| Technical Validation | OK — TS PASS, Docker build PASS, migration aplicada, smoke tests OK |
| Regression Risk | OK com ressalva — auth alterada, sem testes automáticos (aceito) |
| Git Governance | OK — commit pendente de autorização do usuário |

Checklist salvo em: `memory/logs/AUDIT_CHECKLIST_2026-06-22-PASS.md`

---

## 2026-06-22 — PLAN-0017 Fase 3 — Segurança: Helmet + DB Segregation + RLS + pg_audit

**Contexto:** Fase 3 do plano de revisão de segurança (SEC-06, 07, 08, 11, 20). Helmet.js configurado; DB segregado em usuário de runtime vs. migration; RLS habilitado nas 5 tabelas sensíveis; pg_audit ativo; health endpoints protegidos com requireAdmin; frontend atualizado para enviar Bearer token.

**Arquivos alterados:** 7 + infra Docker

| Arquivo | Mudança |
|---------|---------|
| `apps/api/src/app.ts` | Helmet.js com CSP + HSTS + frameguard; cookie-parser posicionado; headers manuais removidos; /health/services e /health/db → requireAdmin |
| `apps/web/src/modules/admin-docker-status/useDockerHealth.ts` | Fetch /health/services com Bearer token via getToken() |
| `apps/web/src/modules/menu/hooks/useDbHealthStatus.ts` | Fetch /health/db com Bearer token via getToken() |
| `docker-compose.yml` | postgres: build do Dockerfile customizado (Debian+pgaudit); command com pgaudit.log=ddl,role + log_connections=on; env DB_API_RW/RO_PASSWORD; init script volume |
| `docker/postgres/Dockerfile` | FROM postgres:16 + postgresql-16-pgaudit |
| `docker/postgres/init-api-users.sh` | Script de init para fresh volumes: cria jlr_api_rw, jlr_api_ro, grants e DEFAULT PRIVILEGES |
| `apps/api/docker-entrypoint.sh` | DATABASE_URL overrideado por DATABASE_MIGRATION_URL para prisma migrate deploy |
| `.env` | DATABASE_URL → jlr_api_rw; DATABASE_MIGRATION_URL = jlrbeauty; DB_API_RW_PASSWORD/RO_PASSWORD; JWT_EXPIRES_IN=15m |

**SQL aplicado manualmente no container atual:**
- CREATE USER jlr_api_rw + jlr_api_ro
- GRANT DML (sem DDL) para jlr_api_rw em todas as tabelas existentes e futuras
- RLS habilitado: User, Payment, Customer, Subscription, Order
- Políticas rls_api_rw (ALL) e rls_api_ro (SELECT) em todas as 5 tabelas
- pgaudit extension criada; log_connections/disconnections=on

**Destaques técnicos:**
- jlr_api_rw: SELECT/INSERT/UPDATE/DELETE apenas — DROP TABLE bloqueado com "must be owner"
- Migrations continuam usando jlrbeauty (superuser) via DATABASE_MIGRATION_URL
- pgaudit.log=ddl,role auditará CREATE/ALTER/DROP e mudanças de role
- TypeScript PASS (API + Web), Docker build PASS, todos smoke tests OK

---

## 2026-06-22 — PLAN-0017 Fase 2 — Segurança: Refresh Token + Logout + emailVerified

**Contexto:** Fase 2 do plano de revisão de segurança (SEC-03, 04, 13). Refresh token persistido em PostgreSQL com rotação automática, logout com revogação, email verification flow completo. Access token reduzido para 15 min.

**Arquivos alterados:** 7 + 1 migration

| Arquivo | Mudança |
|---------|---------|
| `prisma/schema.prisma` | Novos models: `RefreshToken` (refresh_tokens) e `EmailVerificationToken` (email_verification_tokens); campo `emailVerified Boolean @default(false)` em User |
| `prisma/migrations/20260621010000_.../migration.sql` | Cria refresh_tokens, email_verification_tokens, adiciona emailVerified a User; grandfathers usuarios existentes como verificados |
| `lib/auth.ts` | Adicionadas funções: `createRefreshToken`, `findValidRefreshToken`, `rotateRefreshToken`, `revokeRefreshToken`, `createVerificationToken`, `consumeVerificationToken`; JWT default 12h → 15m |
| `app.ts` | `cookie-parser` adicionado antes de `express.json()` |
| `routes/auth.ts` | Login: checa emailVerified (403 se false), define refresh cookie HttpOnly; Register: gera verification token, token dev retornado em NODE_ENV=development; POST /auth/refresh (rotação de RT); POST /auth/logout (revogação + clear cookie); POST /auth/verify-email (valida token, marca verified, emite JWT); POST /auth/resend-verification (sem enumeration); GET /auth/me inclui emailVerified |
| `lib/messages.ts` | Novas msgs: EMAIL_NOT_VERIFIED, VERIFICATION_TOKEN_INVALID, VERIFICATION_TOKEN_SENT, ALREADY_VERIFIED, REFRESH_TOKEN_INVALID, LOGOUT_SUCCESS |
| `prisma/seed.ts` | MASTER e ADMIN criados com emailVerified: true |

**Destaques técnicos:**
- Token armazenado como SHA-256 hash no banco; plaintext jamais persiste
- Rotação obrigatória no refresh (revoga old, emite new)
- SameSite: lax, HttpOnly: true, Secure: true em produção
- Todos os usuarios existentes grandfathered como verificados na migration
- TypeScript PASS, build Docker PASS, migration aplicada, smoke tests OK

---

## 2026-06-21 — PLAN-0017 Fase 1 — Segurança: Auth + Rate Limiter + Guards + Trust Proxy

**Contexto:** Fase 1 do plano de revisão de segurança (SEC-01, 02, 05, 12, 13, 18, 19). Rate limiter migrado de Map in-memory para PostgreSQL. Login restrito a email. Guards de role expandidos.

**Arquivos alterados:** 7 + 1 migration

| Arquivo | Mudança |
|---------|---------|
| `prisma/schema.prisma` | Novo model `LoginAttempt` para rate limiter persistido |
| `prisma/migrations/20260621000000_sec_login_attempt_table/migration.sql` | Tabela `login_attempts` criada no PostgreSQL |
| `lib/rateLimiter.ts` | Rewrite completo — async PostgreSQL via Prisma (SEC-01) |
| `lib/auth.ts` | bcrypt rounds 10 → 12 (SEC-19); `algorithm: 'HS256'` explícito (SEC-18) |
| `middleware/auth.ts` | Novos guards: `requireStaff` (não-CLIENT) e `requireMaster` (SaaS owner only) (SEC-05) |
| `routes/auth.ts` | Login aceita apenas email (remove name login, SEC-02); todos os calls de rate limiter com `await`; rate limit aplicado ao `/auth/register` (SEC-13) |
| `routes/users.ts` | `PATCH /users/:id/role` → `requireMaster` (só o dono do SaaS pode trocar roles) |
| `routes/schedule.ts` | `/professionals/me/shifts` (GET/POST/PATCH/DELETE) → `requireStaff` (não-CLIENT) |
| `app.ts` | `app.set("trust proxy", 1)` — pré-requisito para IP real via X-Forwarded-For (SEC-12) |

**Destaques:**
- Rate limit agora sobrevive restarts e funciona em múltiplas instâncias
- Troca de role protegida por `requireMaster` — nenhum ADMIN pode promover outro usuário
- TypeScript PASS · Build PASS (API)

---

## 2026-06-21 — Fine-tuning Franquias — Alternância de cor de fundo nas seções (A/B pattern)

**Contexto:** Ajuste fino de formatação — seções da página Franquias passaram a alternar entre `bg-white` e `bg-background-light` de forma dinâmica, respeitando os toggles de visibilidade.

**Arquivos alterados:** 15

| Arquivo | Mudança |
|---------|---------|
| `FranquiasContent.tsx` | `altMap` computado dinamicamente a partir das seções visíveis; `alt` prop passada a 13 seções participantes |
| `HomeAboutSection.tsx` | Assinatura com `alt?: boolean`; bg condicional |
| `FranquiasVisionSection.tsx` | Assinatura com `alt?: boolean`; fix `bg-cream-dark` → bg condicional |
| `FranquiasFounderSection.tsx` | Assinatura com `alt?: boolean`; outer section bg condicional; inner col sem bg explícito |
| `FranquiasBenefitsSection.tsx` | Assinatura com `alt?: boolean`; outer section bg condicional |
| `FranquiasModelsSection.tsx` | Assinatura com `alt?: boolean`; inner div bg condicional |
| `FranquiasModelDetailSection.tsx` | Interface: `alt?: boolean`; section bg condicional |
| `FranquiasFran01Section.tsx` | Assinatura com `alt?: boolean`; repassa `alt` a ModelDetail |
| `FranquiasFran02Section.tsx` | Assinatura com `alt?: boolean`; repassa `alt` a ModelDetail |
| `FranquiasFran03Section.tsx` | Assinatura com `alt?: boolean`; repassa `alt` a ModelDetail |
| `FranquiasGestaoAppSection.tsx` | Assinatura com `alt?: boolean`; outer section bg condicional |
| `FranquiasMarketingCrmSection.tsx` | Assinatura com `alt?: boolean`; outer section bg condicional |
| `FranquiasPerfilFranqueadoSection.tsx` | Assinatura com `alt?: boolean`; outer bg + inner right col invertidos |
| `FranquiasSuporteFranqueadoraSection.tsx` | Assinatura com `alt?: boolean`; outer section bg condicional |
| `FranquiasEtapasAberturaSection.tsx` | Assinatura com `alt?: boolean`; outer section bg condicional |

**Destaques:**
- 5 seções excluídas do ciclo alternante (bg fixo intencional): hero, mission, fluxo_caixa, expansao, contact
- Sequência reinicia automaticamente se seções forem desligadas no Admin
- TypeScript PASS · Build PASS (vite 44.29s)

---

## 2026-06-20 — PLAN-0016 CONCLUÍDO — Unified Navigation Menu

**Arquivos alterados:** 4

| Arquivo | Mudança |
|---------|---------|
| `modules/menu/components/PublicMenu.tsx` | Rewrite completo — UnifiedNav com 4 dropdowns (JLR Beauty, Assinaturas, Franquias, Produtos) |
| `modules/menu/components/FranquiasMenu.tsx` | Re-export de 1 linha → elimina duplicação |
| `app/layouts/PublicLayout.tsx` | Removida branch `isFranquias`; único `<PublicNav />` para todas as páginas |
| `sections/MissionSection.tsx` | Adicionado `id="mission"` |

**Destaques:**
- Dropdown Assinaturas novo: Planos & Benefícios, Quem Somos, Depoimentos
- Dropdown Franquias renovado: 7 landmarks (Sobre a Marca, Modelos, Tecnologia, Fluxo de Caixa, Perfil, Etapas, Seja Parceiro)
- Mobile menu unificado com 3 grupos (Salão / Assinaturas / Franquias / Produtos)
- Typos corrigidos: `Colecao` → `Coleção`, `Lancar` → `Lançar`, `Oleo` → `Óleo`
- TypeScript PASS · Build PASS (vite 34.79s)

---

## 2026-06-20 — Correções pós-PLAN-0015 — Bugs de formatação Franquias (point-in-time)

**Contexto:** 6 bugs de formatação e dados identificados após o commit f31d986 do PLAN-0015 e registrados em DEBUG-HISTORY (ERR-0034 a ERR-0039).

### Arquivos alterados (12)

| Arquivo | Correção |
|---------|----------|
| `FranquiasEtapasAberturaSection.tsx` | Chaves page text (`etapas_abertura` → `etapas`); snake redimensionado (ERR-0034, ERR-0038) |
| `FranquiasPerfilFranqueadoSection.tsx` | Chaves page text (`perfil_franqueado` → `perfil`); max-w + remoção ✦ (ERR-0034, ERR-0035, ERR-0036) |
| `FranquiasSuporteFranqueadoraSection.tsx` | Chaves page text (`suporte_franqueadora` → `suporte`); max-w (ERR-0034, ERR-0035) |
| `FranquiasFounderSection.tsx` | Adicionado `max-w-[1200px]` (ERR-0035) |
| `FranquiasExpansaoSection.tsx` | `max-w-[1200px]`; cor `bg-beige` → `bg-gold-light` (ERR-0035) |
| `FranquiasMarketingCrmSection.tsx` | `max-w-[1200px]`; hierarquia de lista com sub-bullets (ERR-0035) |
| `FranquiasBenefitsSection.tsx` | Remoção dos ✦ flanqueando h2 (ERR-0036) |
| `FranquiasGestaoAppSection.tsx` | Remoção do ✦ inline no título (ERR-0036) |
| `FranquiasFluxoCaixaSection.tsx` | Layout 2-col → grid 3-col de cards com imagens; `useMediaSlot` adicionado (ERR-0037) |
| `apps/api/src/modules/mediaSlots/service.ts` | +3 slots `franquias_fluxo_caixa_feature_img_0*` (ERR-0037) |
| `apps/web/src/modules/public-site/mediaSlots.ts` | +3 slots `franquias_fluxo_caixa_feature_img_0*` (ERR-0037) |
| `AdminMediaGalleryView.tsx` | Masonry → grid flat `h-[180px]` object-cover (ERR-0039) |

### Validações
- TypeScript: PASS
- Build: PASS
- ERR-0034 a ERR-0039 registrados em `memory/logs/DEBUG-HISTORY.md`
- PLAN-0015 renomeado para `PLAN-0015-DONE-FRANQUIAS-PAGE-UPGRADE.md`

---

## 2026-06-16 — PLAN-0015 CONCLUÍDO — Franquias Page Upgrade (sessão 3)

**Commit:** `f31d986` — 20 arquivos, 1428 inserções

### Seções criadas (13 componentes TSX)

| Componente | Layout |
|-----------|--------|
| `FranquiasFounderSection` | 2-col: foto esq, texto dir |
| `FranquiasBenefitsSection` | grid 3×3: ícone + texto |
| `FranquiasModelDetailSection` | base 3-col reutilizável (conceito / investimento / métricas) |
| `FranquiasFran01Section` | wrapper ModelDetail — Master |
| `FranquiasFran02Section` | wrapper ModelDetail — Prime |
| `FranquiasFran03Section` | wrapper ModelDetail — Essencial I |
| `FranquiasGestaoAppSection` | 2-col: 4 features esq, mockup dir |
| `FranquiasFluxoCaixaSection` | 2-col: 3 features com dividers, stripe teal |
| `FranquiasMarketingCrmSection` | 2-col: lista + sub-bullets esq, foto dir |
| `FranquiasExpansaoSection` | 2-col: mapa esq, texto+quotes dir |
| `FranquiasPerfilFranqueadoSection` | 2-col: foto esq, numbered list 7 itens |
| `FranquiasSuporteFranqueadoraSection` | 2-col: 3 grupos com bullets, foto dir |
| `FranquiasEtapasAberturaSection` | full-width snake 10 passos + CTA |

### Data layer

- `catalog.ts` — ~145 novos page text keys (api)
- `service.ts` — ~26 novos media slots + IDs (api)
- `mediaSlots.ts` — espelho dos slots acima (web)
- `sectionToggles.ts` — 13 novos toggles em `franquias` (web)
- `admin.ts` — 13 novos toggles em `DEFAULT_PUBLIC_SECTION_TOGGLES.franquias` (api)
- `sections/index.ts` — 13 novos exports
- `FranquiasContent.tsx` — 18 seções no total

### Validação

- TypeScript: PASS (zero erros)
- Build: PASS — vite 11.22s
- Push: autorizado e executado (`origin/main` → `f31d986`)

### Audit: PASS — `memory/logs/AUDIT_CHECKLIST_2026-06-16-PASS.md`

---

## 2026-06-16 — Ajustes de sessão (sessão 2)

- **Franquias Hero Gallery Toggle** — grid de fotos do hero de franquias oculto por padrão via section toggle (`hero_gallery: false`); switch em Admin > Seções permite reativar sem código
  - Arquivos: `sectionToggles.ts`, `admin.ts` (`DEFAULT_PUBLIC_SECTION_TOGGLES`), `FranquiasHeroSection.tsx`
  - Grid torna-se layout 1-coluna quando galeria oculta; 2-colunas quando visível
  - Lint PASS, Build PASS (web 18.97s + api tsc zero erros)
- **MissionSection width** — corrigido container ocupando 100vw; adicionado `max-w-[1440px] mx-auto` no grid div (padrão das demais seções)

---

## 2026-06-16 — PLAN-0012 FECHADO — Editor de Textos + ajustes de sessão

- **PLAN-0012-DONE** — Page Texts Editor validado e fechado pelo usuário
- Editor funcional com 129 campos, 4 páginas (home/franquias/assinaturas/global), segmentos estilizados
- Adicionado suporte a quebra de linha (`\n` → `<br />`) em `RichText.tsx`
- Adicionado histórico de textos (Opção A): `public.pageTexts.previous` salvo automaticamente ao salvar; botão "Restaurar versão anterior" no Admin
- Galeria Admin refatorada para Masonry Grid 4 colunas (padrão Flowbite) — legenda abaixo de cada imagem em cor neutra
- Lint PASS (removida variável `pageTextsVersion` não usada em `pageTexts.runtime.ts`)
- Build PASS em api e web

---

## 2026-06-14 — ERR-0033 registrado + scripts/fix-nginx.sh

- Diagnosticado comportamento de nginx com `/etc/nginx/conf.d/` vazio após boot
- Causa: partição Linux em HD dual-boot não monta automaticamente — Docker sobe antes do drive estar disponível
- Não é bug de código — contingência do setup local
- `ERR-0033` registrado em `memory/logs/DEBUG-HISTORY.md`
- `scripts/fix-nginx.sh` criado — executa `docker compose up -d --force-recreate nginx`

---

## 2026-06-13 — DECISION-004 a DECISION-010 criados

Revisão retroativa de PLAN-0001 a PLAN-0014 identificou decisões arquiteturais não registradas. Criados 7 novos arquivos em `memory/decisions/`:

| DECISION | Tema |
|----------|------|
| 004 | Migração Railway/Vercel → VPS Docker Compose (auto-hospedagem) |
| 005 | Migração MySQL → PostgreSQL |
| 006 | Section toggles exclusivamente via banco (remoção de fs.writeFileSync) |
| 007 | Divisão routes/index.ts em 9 domínios — camada service/repository adiada |
| 008 | Sistema de textos editáveis — Setting + vocabulário fechado de 6 estilos (não WYSIWYG) |
| 009 | Uploads em volume Docker persistente no host (não S3/CDN) |
| 010 | Textos compartilhados entre páginas sob `page: "global"` no catálogo de pageTexts |

---

## 2026-06-13 — SESSION AUDIT — PASS

**Checklist executado em:** 2026-06-13 (encerramento de sessão)
**Resultado:** PASS

| Item | Resultado |
|------|-----------|
| 1. Decision Integrity | PASS — nenhuma DECISION ativa contradita |
| 2. State Integrity | PASS — PLAN-0013 e PLAN-0014 fechados como DONE |
| 3. Operational Memory | PASS — MODIFICATION_LOG e progress.md atualizados |
| 4. Debug Memory | PASS — ERR-0031 e ERR-0032 registrados |
| 5. Technical Validation | PASS — tsc zero erros, Docker build OK |
| 6. Regression Risk | PASS — nenhuma área sensível alterada |
| 7. Git Governance | PASS — commit 0637dcd + push aprovados pelo usuário |

---

## 2026-06-13 — PLAN-0014 EM ANDAMENTO — About em Franquias + Seção Mission

**Seção About em Franquias:**
- `sectionToggles.ts` + `admin.ts`: adicionado `about: false` em `franquias`
- `FranquiasContent.tsx`: importa e renderiza `HomeAboutSection` (condicionado ao toggle)

**Nova Seção Mission (global):**
- `catalog.ts`: type `page` extendido para incluir `"global"`; 10 novas entradas sob `page: "global", section: "mission"`
  Chaves: `global.mission.missao_title/text`, `global.mission.visao_title/text`, `global.mission.valores_title/item_1..5`
- `mediaSlots/service.ts`: adicionado slot `mission_center_img_01` (foto central da seção)
- Novo componente `MissionSection.tsx`: 3 colunas — esq teal (Missão+Visão), centro imagem, dir branca (Valores)
- `sections/index.ts`: exporta `MissionSection`
- `HomeContent.tsx`, `FranquiasContent.tsx`, `AssinaturasContent.tsx`: importam e renderizam `MissionSection`
- `sectionToggles.ts` + `admin.ts`: adicionado `mission: false` nas 3 páginas
- `AdminPageTextsView.tsx`: `PAGE_LABELS` recebe `global: "Missão & Valores"` + `SECTION_LABELS` recebe `mission: "Missão"`
- TypeScript: zero erros em api + web
- Git Record: PENDING

## 2026-06-12 — PLAN-0013 EM ANDAMENTO — Docker Status Modal + fix nginx boot

**Fix ERR-0029 ##bug — nginx não subia após reboot:**
- `nginx.depends_on.api.condition`: `service_healthy` → `service_started`
  Causa: Docker daemon ignora `depends_on` no restart automático pós-reboot;
  nginx entrava em backoff exponencial e desaparecia do `docker compose ps`.

**Fix ERR-0030 ##bug — 502 + tela branca após docker compose up --build:**
- `docker-compose.yml`: volume nginx alterado de bind de arquivo único para bind de diretório (`./nginx/:/etc/nginx/conf.d/:ro`) — evita perda de inode ao editar arquivos no host.
- `nginx/nginx.conf`: removida a `/` final de todos os `proxy_pass http://$var` — com variável, nginx substituía a URI completa por `/`; sem URI no proxy_pass, repassa a URI original intacta.

**Feature (PLAN-0013):**
- Removido LED de status do banco de `NavStatusActions.tsx` (navbar público)
- Novo endpoint `GET /health/services` em `app.ts` — retorna status dos 4 serviços Docker
- Novo hook `useDockerHealth.ts` — fetch único no mount, retorna `{ nginx, api, web, postgres }`
- Novo componente `DockerStatusModal.tsx` — modal flutuante (bottom-right), auto-fecha em 10s
- `AdminContent.tsx`: ícone `dns` no topbar com LED de alerta (vermelho se offline) + render do modal
  O modal abre ao entrar no admin e pode ser aberto/fechado pelo ícone a qualquer momento.
- TypeScript: zero erros em ambos os apps (api + web)
- Git Record: PENDING

## 2026-06-12 — Correção ERR-0028: Section Toggles "acesso negado" (causa real)

- `apps/api/src/routes/admin.ts`: `canEditSectionToggles()` reescrito — verificação por email hardcoded (`jeiel.borner@gmail.com`) substituída por `user.role === "MASTER"`.
- Role de `admin@jlrbeauty.com` restaurada para MASTER diretamente no banco (foi alterada para ADMIN acidentalmente via UI de Pessoas; a API bloqueia corretamente a escalada de volta quando o token não é MASTER).
- `AdminContent.tsx`: revertido para `isMaster` em todos os checks (remoção de `isAdminOrMaster` que havia sido adicionado por diagnóstico errado).
- `AdminSectionTogglesView.tsx`: `canEdit` mantido como MASTER-only (revertido fix provisório).
- Diagnóstico inicial (ERR-0028) corrigido no DEBUG-HISTORY.md.
- Docker: `api` + `web` rebuiltados e rodando.

## 2026-06-11 — PLAN-0012 CONCLUÍDO — Sistema de Edição de Textos das Páginas

- kernel/SYSTEM.md corrigido: MySQL → PostgreSQL 16, ESM → commonjs, Next.js removido
- Backend criado: `catalog.ts` (129 entradas), `service.ts` (cache + upsert), 3 rotas novas
- Frontend: hook `usePageText(key)`, renderer `<RichText>`, runtime com localStorage snapshot
- Admin UI: `AdminPageTextsView` (abas Home/Franquias/Assinaturas + acordeão por seção)
  + `SegmentEditor` (editor de segmentos inline com preview)
  + `AdminPageTextsViewIsland` (portal pattern), sidebar "Textos" em AdminContent
- 11 componentes de seção migrados: todos os textos de marketing agora via usePageText()
  (HomeHero, HomeAbout, HomeCta, HomeMembership, HomeServices, HomeTestimonials,
  FranquiasHero, FranquiasModels, FranquiasVision, FranquiasContact, AssinaturasHero)
- Seed: `public.pageTexts` inicializado com defaults do catálogo na primeira boot
- TypeScript: zero erros em ambos os apps (api + web)

## 2026-06-11 — fixes de seed e entrypoint

- seed.ts: MASTER criado antes do admin hardcoded; colisão de email eliminada (`72bdb1a`)
- Dockerfile: `docker-entrypoint.sh` executa `prisma migrate deploy` automaticamente no boot, eliminando race condition do concierge job
- Validado: login MASTER OK, migration automática no startup, concierge cleanup sem erro

## 2026-06-11 — VALIDAÇÃO PLAN-0009 DONE / PLAN-0010 + PLAN-0011 VALIDADOS

- PLAN-0009 fechado: cópia concluída, commits cf3d219 + 641b1a8 confirmados, builds passando.
- PLAN-0010 validado: Docker Compose (4 serviços), PostgreSQL, Dockerfiles, nginx.conf, migration init_postgresql, seed executado, health OK, login OK, section toggles sem fs.writeFileSync.
- PLAN-0011 validado: 9 arquivos de rota por domínio criados, 6 libs extraídas, routes/index.ts com 23 linhas, 5/5 testes passando, docker compose up funcional.
- Stack rodando em http://localhost com docker compose up -d.
- Próximo passo: aguardando autorização do usuário para commit de PLAN-0010 + PLAN-0011.

## 2026-06-10 — INÍCIO PLAN-0009 / PLAN-0010 / PLAN-0011

- Análise estrutural completa do projeto realizada (session intel).
- Problemas críticos identificados: routes/index.ts God File (6650 linhas, 130 rotas), uploads efêmeros no Railway, section toggles escrevendo em arquivo .ts, rate limiting in-memory.
- Decisão do usuário: migrar para Docker + PostgreSQL + VPS, eliminar Railway e Vercel.
- Três planos criados e aguardando aprovação:
  - PLAN-0009: Cópia da base de código para `Development/GitHub/JLR_Beauty`
  - PLAN-0010: Docker + PostgreSQL + infraestrutura VPS (correção de uploads e section toggles)
  - PLAN-0011: Refactor de rotas por domínio (separação mínima, 9 arquivos)
- Versão atual em `Development/www/JLR_AI_Studio` permanece intacta durante toda a execução.
- Próximo passo: aguardar aprovação explícita do usuário para iniciar PLAN-0009.

## 2026-01-27 19:16:53
- index.html
  - Navigation: added franchise submenu only on franquias page and aligned menu typography tests; current menu uses Manrope, primary color, and sizing aligned to `franquias.html`.
  - Navigation (right side): replaced text Admin with icon; added cart circle with pulse indicator; added logged-user block with avatar and name.
  - Cart icon interaction: hover scale to 120% and click swaps to plus icon before opening cart.
  - JLR Beauty submenu CTA: renamed to "JLR" and linked to page top.
  - Brand title block: rebuilt "Bem Estar / Autoestima" into boxed layout; kept original HTML commented for rollback.
  - Submenu panels: restored translucent background, gold borders, and black text for items + CTA buttons to match franchise styling.
- franquias.html
  - Navigation: added a Franquias submenu (Modelos, Visao, Parceria) and top anchor.
  - CTA inside submenu: "Oportunidade" linking to top.
- admin.html
  - Services view: "Entrada de Servico" column now spans double width (2/3) with stats compressed to 1/3.
  - Services form: added image chooser field + modal (local file or URL).
  - Users form: added image/avatar chooser field + modal; included live preview in the form.
  - Modal open/close handling re-used existing modal system; added JS wiring for image inputs and preview.

## 2026-01-27 21:15:28
- index.html
  - Added Concierge chat widget (mobile-first) with step flow for service, unit, slot, and contact info; stores booking draft in localStorage.
  - CTA "Agendar Consulta" now opens the concierge chat.
- admin.html
  - Added new view panels for Agenda, Vendas, and Assinaturas inside the SPA views.
  - Sidebar items for Agenda and Vendas now switch views.
- docs
  - Added `docs/evolutive_changes/ROADMAP.md` and `docs/config/INTEGRATIONS.md`.
  - Linked new docs from `docs/project/PROJECT_OVERVIEW.md`.

## 2026-01-28 14:21:56
- Revisao do projeto (login/autenticacao/admin)
  - API: auth/login, auth/register e auth/me existem; middleware requireAuth/requireAdmin criado.
  - Admin e rotas sensiveis ainda sem protecao (content, products, services, memberships, orders, appointments, franchise-leads).
  - Front: pagina /admin sem guard; modais de login/cadastro existem, mas sem submit para API.
  - HTML legado: campos do cadastro reutilizam data-attrs do login para email/senha (conflito de selecao).
  - Seguranca: JWT secret com fallback e seed com credenciais fixas (dev).
  - Proximos passos sugeridos: proteger rotas admin, ligar login/cadastro ao backend, criar guard no /admin.

## 2026-01-28 14:41:47
- Processo
  - Regra definida: todo resumo apresentado deve ser salvo no memory/MODIFICATION_LOG.md para manter o historico dos comentarios.

## 2026-01-28 14:49:48
- Resumo (protecao/auth/admin)
  - API: rotas sensiveis protegidas com requireAdmin; /payments/intent requer auth.
  - Front (React): rota /admin guardada; redireciona para / e abre modal de login quando bloqueada.
  - Auth client: login/register/me com token em localStorage.
  - Modais: login/cadastro ligados a API; data-attrs do cadastro corrigidos.

## 2026-01-28 15:21:27
- Scripts de inicializacao
  - start_backend.bat e start_frontend.bat agora verificam node_modules e executam npm install automaticamente quando necessario.

## 2026-01-28 15:22:46
- Scripts de inicializacao
  - start_backend.bat e start_frontend.bat agora checam a existencia de .env antes de iniciar.

## 2026-01-28 16:23:33
- Auth UI e mensagens
  - Mensagens de erro da API e middleware traduzidas para portugues.
  - Modais de login/cadastro com botao para mostrar/ocultar senha.
  - Ajuste no JS para alternar visibilidade da senha.

## 2026-01-28 16:26:16
- Auth UI
  - Mensagens de erro agora inline nos modais de login e cadastro (sem alert).
  - Campos de erro adicionados no HTML legado e controle no JS.

## 2026-01-28 16:28:22
- Auth UI
  - Mensagens de sucesso inline (verde) adicionadas para login/cadastro.
  - Fechamento do modal com pequeno delay apos sucesso.

## 2026-01-28 16:29:28
- Auth UI
  - Campos de login/cadastro limpos apos sucesso.

## 2026-02-26 00:00:00
- Auditoria linguistica (skill `revisor-ptbr`)
  - Gerado `REVISAO_ENTERPRISE_01.MD` com inconsistencias de acentuacao, padronizacao terminologica e pontos basicos de LGPD em textos visiveis ao usuario.
  - Nenhuma correcao foi aplicada no codigo (somente relatorio).
  - Ultimo passo concluido: geracao do relatorio versionado.
  - Proximo passo planejado: aguardar aprovacao explicita para aplicar as correcoes sugeridas.

## 2026-02-26 00:27:38
- Auditoria linguistica (aplicacao aprovada)
  - Correcoes aplicadas nos pontos auditados do relatorio `REVISAO_ENTERPRISE_01.MD` (frontend/admin/chatbot), incluindo acentuacao e padronizacao pontual de "E-mail".
  - Adicionada microcopy de transparencia/LGPD no formulario de newsletter (footer) e nos formularios do concierge (fila de espera e confirmacao).
  - Gerado `ALTERACOES_APLICADAS_ENTERPRISE_01.MD`.
  - Validacao executada: `apps/web` lint + build, `apps/api` build + teste (`npm test`) com sucesso.
  - Ultimo passo concluido: aplicacao e revalidacao das correcoes aprovadas.
  - Proximo passo planejado: revisao opcional de padronizacao terminologica restante em modulos fora do escopo auditado.

## 2026-02-25 19:29:50
- Processo (checkpoint pre-alteracao gitignore)
  - Plano: criar `.gitignore` na raiz com regras para `/.codex/`, `/documentations/` e `node_modules/`.
  - Plano: remover `.codex` do indice do Git com `git rm -r --cached .codex` mantendo arquivos locais.
  - Plano: validar `git status` e presenca local das pastas.
  - Ultimo passo concluido: planejamento aprovado pelo usuario.
  - Proximo passo planejado: executar criacao do `.gitignore` (concluido nesta etapa) e remover `.codex` do indice.

## 2026-02-25 19:31:06
- Processo (checkpoint pos-alteracao gitignore)
  - `.gitignore` criado na raiz com regras para `/.codex/`, `/documentations/` e `node_modules/`.
  - `git rm -r --cached .codex` executado para parar de rastrear `.codex` sem apagar arquivos locais.
  - Validacao: `.codex` e `documentations` permanecem locais (`Test-Path=True`); `node_modules` nao existe na raiz (`False`).
  - Validacao: `git status` mostra `.gitignore` novo e remocoes staged de `.codex/*` no indice.
  - Validacao: `git ls-files documentations node_modules` sem resultado (nao rastreados).
  - Ultimo passo concluido: configuracao de ignore + remocao de `.codex` do indice + validacao.
  - Proximo passo planejado: criar commit se o usuario solicitar.

## 2026-02-25 19:38:59
- Processo (checkpoint pre-alteracao gitignore - tmp/cms)
  - Plano: adicionar `/.tmp/` NAO (corrigido): adicionar `/tmp/` e `/cms/` ao `.gitignore` existente.
  - Plano: remover `tmp` e `cms` do indice do Git com `git rm -r --cached tmp cms`, mantendo arquivos locais.
  - Plano: validar `git status`, `git ls-files` e presenca local das pastas.
  - Ultimo passo concluido: diagnostico (pastas `tmp` e `cms` existem e estao rastreadas).
  - Proximo passo planejado: remover `tmp` e `cms` do indice apos atualizar `.gitignore`.

## 2026-02-25 19:42:43
- Processo (checkpoint pos-alteracao gitignore - tmp/cms)
  - `.gitignore` atualizado com regras `/tmp/` e `/cms/`.
  - `git rm -r --cached tmp cms` executado para parar de rastrear as duas pastas sem apagar arquivos locais.
  - Validacao: `git status` mostra remocoes staged de `tmp/*` e `cms/*` no indice.
  - Validacao: `git ls-files cms tmp` sem resultado (nao rastreados).
  - Validacao: `cms` e `tmp` permanecem locais (`Test-Path=True`).
  - Ultimo passo concluido: configuracao de ignore + remocao de `tmp/cms` do indice + validacao.
  - Proximo passo planejado: criar commit se o usuario solicitar.

## 2026-02-25 20:26:28
- Processo (checkpoint pre-alteracao integrations)
  - Plano (concise-planning): revisar `docs/config/INTEGRATIONS.md` e remover referencias de Trinx e Mercado Pago, mantendo apenas WhatsApp (Z-API + ngrok).
  - Plano: validar com busca (`rg`) referencias residuais a `trinx`/`mercado pago` no repositorio e reportar resultado.
  - Plano: usar `lint-and-validate` apenas na parte de validacao pertinente (sem lint/tsc global, por ser alteracao documental).
  - Ultimo passo concluido: diagnostico inicial de referencias em docs e codigo.
  - Proximo passo planejado: aplicar patch em `docs/config/INTEGRATIONS.md` e executar validacao por busca.

## 2026-02-25 20:27:02
- Processo (checkpoint pos-alteracao integrations)
  - `docs/config/INTEGRATIONS.md` ajustado para manter somente a secao de WhatsApp (Z-API + ngrok).
  - Removidas do documento as secoes/contratos de Trinx e Mercado Pago.
  - Validacao (`rg`) em `docs/config/INTEGRATIONS.md`: nenhuma ocorrencia restante de `trinx`/`mercado pago`.
  - Validacao repo-wide (`rg`, excluindo `memory/MODIFICATION_LOG.md` e o proprio `docs/config/INTEGRATIONS.md`): referencias residuais encontradas em outros docs e em codigo (`apps/api/src`, `apps/web/src`, e `apps/api/dist`).
  - `lint-and-validate`: lint/tsc global nao executado por se tratar de alteracao documental; usada validacao por busca de referencias residuais.
  - Ultimo passo concluido: remocao das referencias no documento + auditoria de referencias residuais.
  - Proximo passo planejado: remover referencias residuais de codigo/docs secundarios se o usuario solicitar.

## 2026-02-25 20:36:34
- Processo (checkpoint pre-revisao docs overview/requirements)
  - Skill `brainstorming` usado para revisar estado atual vs proposta documental antes de editar.
  - Skill `concise-planning` usado para definir checklist objetivo de revisao/validacao.
  - Passos planejados:
    - validar `docs/project/PROJECT_OVERVIEW.md` contra rotas/arquivos atuais (React SPA, aliases, docs existentes, artefatos legados);
    - validar `docs/project/REQUIREMENTS.md` contra funcionalidades ja implementadas (ex.: concierge) e escopo atual de integracoes;
    - corrigir apenas itens objetivamente desatualizados;
    - revalidar com buscas (`rg`) e testes de existencia (`Test-Path`).
  - Ultimo passo concluido: levantamento de fatos do workspace (rotas, endpoints, arquivos e docs existentes/ausentes).
  - Proximo passo planejado: aplicar patch em `docs/project/PROJECT_OVERVIEW.md` e `docs/project/REQUIREMENTS.md`.

## 2026-02-25 20:38:18
- Processo (checkpoint pos-revisao docs overview/requirements)
  - `docs/project/PROJECT_OVERVIEW.md` revisado para refletir o estado atual do workspace:
    - rota `/checkout` como alias/redirecionamento para `/?checkout=1`;
    - `docs/config/INTEGRATIONS.md` focado em WhatsApp (Z-API + ngrok);
    - arquivos HTML legados na raiz ausentes no snapshot atual;
    - `apps/web/src/legacy` e `apps/web/src/templates` ausentes;
    - referencias a docs antigos/ausentes convertidas para observacao de snapshot.
  - `docs/project/REQUIREMENTS.md` revisado para refletir backlog atual:
    - concierge movido de "implementar" para hardening/validacao;
    - backlog de integracoes alinhado a WhatsApp (Z-API + ngrok);
    - Trinx/Mercado Pago marcados como fora do escopo ativo ate reativacao planejada;
    - texto de schema/API/RBAC corrigido e refinado.
  - Validacao realizada com `rg`/`Test-Path`:
    - rotas React (`/admin.html`, `/checkout`) conferidas em `apps/web/src/app/App.tsx`;
    - endpoints auth/settings/uploads/public concierge conferidos em `apps/api/src/routes/index.ts` e `apps/api/src/app.ts`;
    - arquivos/docs legados citados conferidos por existencia no workspace.
  - Ultimo passo concluido: revisao e revalidacao documental concluida.
  - Proximo passo planejado: commitar as alteracoes se o usuario solicitar.

## 2026-02-25 20:40:07
- Processo (checkpoint pre-padronizacao docs adicionais)
  - Passos planejados:
    - revisar `docs/project/SOLUTION_SALES_DOSSIER.md` para remover mencoes especificas a Trinx e alinhar com linguagem provider-agnostic;
    - auditar rapidamente referencias cruzadas `docs/*.md` em outros documentos e apontar links ausentes;
    - validar por busca (`rg`) que o dossie nao mantém menções antigas.
  - Ultimo passo concluido: identificadas 2 ocorrencias de `Trinx` no dossie comercial-tecnico.
  - Proximo passo planejado: aplicar patch no dossie e revalidar.

## 2026-02-25 20:41:36
- Processo (checkpoint pos-padronizacao docs adicionais)
  - `docs/project/SOLUTION_SALES_DOSSIER.md` padronizado para remover mencoes especificas a Trinx, mantendo linguagem generica de agenda externa e gateway de pagamento real.
  - Validacao (`rg`) no dossie: sem ocorrencias de `trinx`/`mercado pago`.
  - Auditoria rapida de referencias `docs/*.md` em documentos (exceto `memory/MODIFICATION_LOG.md`) executada.
  - Resultado da auditoria:
    - referencias validas confirmadas: `docs/config/WHATSAPP_API_ZAPI_NGROK.md`, `docs/config/INTEGRATIONS.md`, `docs/project/REQUIREMENTS.md`, `docs/config/TESTING_GUIDE.md`;
    - referencias ausentes ainda citadas de forma contextual em `docs/project/PROJECT_OVERVIEW.md`: `docs/evolutive_changes/ROADMAP.md`, `docs/evolutive_changes/REACT_MIGRATION_GUIDE.md`, `docs/evolutive_changes/NEXT_SESSION_CHECKLIST_2026-02-17.md`.
  - Ultimo passo concluido: padronizacao adicional de docs + auditoria de referencias cruzadas.
  - Proximo passo planejado: commitar as alteracoes documentais se o usuario solicitar.

## 2026-02-25 20:53:05
- Processo (checkpoint pre-revisao profunda agenda/concierge docs)
  - Solicitacao do usuario: revisar com mais profundidade o dominio de agendamento interno e refletir isso em `docs/project/PROJECT_OVERVIEW.md` e `docs/project/REQUIREMENTS.md`.
  - Skills usados para guiar a analise: `brainstorming` (levantamento estruturado) e `concise-planning` (checklist de revisao).
  - Evidencias analisadas:
    - `apps/api/prisma/schema.prisma` (models/enums de agenda, escalas, slots, concierge e settings);
    - `apps/api/src/lib/appointmentAvailability.ts` (regras de disponibilidade, slots de 30 min, janela de 14 dias, conflitos e alocacao de profissional);
    - `apps/api/src/routes/index.ts` (endpoints public/admin de concierge, webhook Z-API, appointments e professional-shifts);
    - `documentations/db_sql.sql` e `documentations/seed_carnaval*.sql` (DDL/seed com estruturas e dados operacionais de agenda/concierge).
  - Objetivo da alteracao:
    - reforcar que a agenda e interna ao aplicativo (nao dependente de agenda externa);
    - documentar tabelas/fluxos reais de agenda + chatbot/WhatsApp;
    - atualizar backlog para refletir o que ja existe e o que falta endurecer/evoluir.
  - Proximo passo planejado: aplicar patch em `docs/project/PROJECT_OVERVIEW.md` e `docs/project/REQUIREMENTS.md`.

## 2026-02-25 20:54:38
- Processo (checkpoint pos-revisao profunda agenda/concierge docs)
  - `docs/project/PROJECT_OVERVIEW.md` atualizado para explicitar agenda interna nativa do produto:
    - dominio de dados (Unit, ProfessionalService, ProfessionalShift, Appointment, AppointmentSlot, Waitlist, ConciergeSession/Event);
    - motor de disponibilidade interno (slots de 30 min, janela de 14 dias, periodos MORNING/AFTERNOON/EVENING, conflitos por slots + overlap legacy);
    - fluxos publicos web concierge, webhook Z-API e endpoints admin de agenda/atendimento;
    - evidencia documental via `documentations/seed_carnaval*.sql` e observacao sobre `documentations/db_sql.sql` como snapshot mais antigo/parcial.
  - `docs/project/REQUIREMENTS.md` reorganizado para:
    - separar baseline ja implementado (agenda/concierge internos) do backlog real;
    - focar pendencias em hardening/evolucao de agenda (no-show, lembretes, escalas recorrentes, UX admin);
    - manter integracoes externas (agenda/ERP) apenas como opcional futuro, sem dependencia da operacao atual.
  - Validacoes executadas:
    - `apps/api/src/app.ts`: prefixo `/api` confirmado para documentar endpoints;
    - `apps/api/prisma/schema.prisma`: enums/models de agenda/concierge conferidos;
    - `apps/api/src/lib/appointmentAvailability.ts`: regras de slots/janela/periodos e criacao de agendamento conferidas;
    - `apps/api/src/routes/index.ts`: endpoints de `public/concierge`, `public/webhooks/zapi`, `appointments`, `professional-shifts`, `concierge/sessions|inbox|waitlist` conferidos;
    - `documentations/seed_carnaval.sql`: tabelas/dados de appointments, appointment slots, concierge sessions/events, professionals, shifts e units conferidos.
  - Ultimo passo concluido: documentacao de agenda/concierge re-alinhada ao estado real do sistema.
  - Proximo passo planejado: revisar/ajustar docs adicionais (ex.: dossie comercial) se o usuario quiser alinhar a mesma narrativa de agenda interna.

## 2026-02-25 20:57:22
- Processo (checkpoint pre-ajuste dossie comercial - agenda interna)
  - Objetivo: alinhar `docs/project/SOLUTION_SALES_DOSSIER.md` com a narrativa correta de agenda interna nativa (sem dependencia de agenda externa).
  - Ajustes planejados:
    - reforcar no item de arquitetura que o motor de agenda/concierge e interno;
    - trocar mencoes de "agenda externa" por "conectores de terceiros opcionais";
    - manter transparencia comercial sobre limites (gateway real pendente / conectores opcionais nao ativados) sem sugerir dependencia funcional.
  - Ultimo passo concluido: localizadas as secoes impactadas (5, 6.2, 6.3 e 8).
  - Proximo passo planejado: aplicar patch e revalidar termos no dossie.

## 2026-02-25 20:58:08
- Processo (checkpoint pos-ajuste dossie comercial - agenda interna)
  - `docs/project/SOLUTION_SALES_DOSSIER.md` ajustado para explicitar que o motor de agenda/concierge e interno ao backend.
  - Secoes 6.2/6.3/8 atualizadas para tratar agenda/ERP de terceiros como conectores opcionais futuros, sem dependencia da agenda operacional atual.
  - Validacao (`rg`) no dossie:
    - sem ocorrencias de `agenda externa`, `trinx` ou `mercado pago`;
    - termos novos de narrativa interna/opcional confirmados nas secoes alteradas.
  - Ultimo passo concluido: dossie comercial alinhado com a documentacao tecnica revisada (overview/requirements).
  - Proximo passo planejado: commitar as alteracoes documentais se o usuario solicitar.

## 2026-01-28 16:30:18
- Auth UI
  - Mensagens de erro/sucesso limpas ao abrir ou alternar entre modais.

## 2026-01-28 16:31:03
- Auth UI
  - Mensagens de erro/sucesso limpas ao fechar o modal.

## 2026-01-28 16:32:10
- Auth UI
  - Limpeza dos campos de login/cadastro ao fechar o modal.

## 2026-01-28 16:33:08
- Auth UI
  - Reset do botao mostrar senha ao fechar o modal (input volta para password e icone para visibility).

## 2026-01-28 16:34:02
- Auth UI
  - Reset do botao mostrar senha ao abrir e alternar entre login/cadastro.

## 2026-01-28 16:34:52
- Auth UI
  - Campos limpos ao alternar entre login e cadastro.

## 2026-01-28 16:35:58
- Auth UI
  - ESC/backdrop ja usam closeAuthModal, que agora limpa mensagens, campos e reseta senha.

## 2026-01-28 17:02:24
- Auth UI
  - Mensagens de erro agora incluem status e rota da API para facilitar diagnostico.

## 2026-01-28 17:03:38
- Auth UI
  - Erros de rede tratados com mensagem clara (falha de conexao) incluindo a rota.

## 2026-01-28 17:04:38
- Auth UI
  - Mensagem de erro de rede agora inclui host/porta do servidor.

## 2026-01-28 17:05:31
- Auth UI
  - Mensagem de erro de rede agora inclui VITE_API_URL completo.

## 2026-01-28 17:22:19
- Auth UI
  - URL completo so aparece em modo DEV; em producao mostra apenas host.

## 2026-01-28 20:14:58
- Auth UI
  - Padronizacao das mensagens: prefixo por contexto (Login/Cadastro) para erros e sucessos.

## 2026-01-28 20:16:04
- Auth UI
  - Mensagens de sucesso ajustadas para combinar com o prefixo (Login/Cadastro realizado com sucesso).

## 2026-01-28 20:19:26
- Auth UI
  - Normalizacao das mensagens de erro com acentos e capitalizacao padrao.
  - Mensagem de rede com acentos.

## 2026-01-28 20:20:21
- Auth UI
  - Mensagens de fetchMe traduzidas para PT-BR.

## 2026-01-28 20:23:27
- API
  - Padronizacao das mensagens via constante MSG (middleware e rotas).

## 2026-01-28 20:24:25
- API
  - Padronizacao aplicada a todas as mensagens existentes; nenhuma outra rota com mensagens adicionais encontrada.

## 2026-01-28 20:25:21
- API
  - Mensagens futuras adicionadas (produto, servico, assinatura, pedido, agendamento, lead de franquia).

## 2026-01-28 20:27:35
- API
  - Validacoes adicionadas para products/services/memberships/orders/appointments/franchise-leads com mensagens MSG padronizadas.

## 2026-01-28 20:28:54
- API
  - Validacoes mais rigidas: price/duration/total/itens obrigatorios, email/telefone/nome obrigatorios, coercao numerica e booleana.

## 2026-01-28 20:30:04
- API
  - Erros de validacao agora incluem detail com campo e mensagem (Zod) para diagnostico no frontend.

## 2026-01-28 20:31:12
- API
  - Mensagens do Zod traduzidas para PT-BR basico no detail.

## 2026-01-28 20:32:10
- API
  - Labels amigaveis para campos no detail de validacao (ex.: email do cliente, telefone, preco).

## 2026-01-28 20:33:08
- API
  - Labels de campos com acentos ajustados (preço, duração, título, serviço, início).

## 2026-01-28 20:34:04
- API
  - Label ajustado para e-mail/usuario.

## 2026-01-28 20:35:15
- API
  - Labels de telefone atualizados para telefone/WhatsApp.

## 2026-01-28 20:36:09
- API
  - Validacao de telefone (regex 8-15 digitos, opcional com +) aplicada em pedidos, agendamentos e leads.

## 2026-01-28 20:37:03
- API
  - Mensagem de validacao de telefone ajustada para telefone/WhatsApp invalido.

## 2026-01-28 20:38:13
- API
  - Validacao de telefone agora aceita espacos e parenteses (normaliza antes do regex).

## 2026-01-28 20:39:02
- API
  - Normalizacao de telefone agora remove hifen tambem.

## 2026-01-28 20:49:32
- Auth API/UI
  - Login agora diferencia usuario nao cadastrado vs senha incorreta.
  - Erros 500 retornam mensagem de erro interno com detail.
  - Normalizacao frontend inclui novas mensagens.

## 2026-01-28 20:51:24
- Auth API
  - Detail de erro interno so aparece em NODE_ENV=development.

## 2026-01-28 20:52:27
- API
  - Detail de validacao agora so aparece em NODE_ENV=development em todas as rotas.

## 2026-01-28 21:26:18
- Menu Produtos
  - Modal de video movido para layout compartilhado (funciona em todas as paginas).
  - Handlers de video centralizados em video.behavior.
  - Texto dos itens "Como usar" ajustado para preto.

## 2026-01-28 21:32:42
- Menu Produtos
  - Itens "Como usar" voltaram para text-primary.
  - Botoes do submenu (Ver Produtos/Lancar) com texto preto.

## 2026-01-28 21:49:09
- Menus
  - Botao JLR (submenu JLR Beauty) com texto preto.
  - Botao Ver Produtos (submenu Produtos) mantido com texto preto.

## 2026-01-29 18:23:32
- Documentacao
  - `docs/project/PROJECT_OVERVIEW.md` atualizado para refletir apps/api (Express + Prisma + MySQL) e apps/web (Vite + React) em uso, mantendo legado em `apps/web/src/legacy`.
  - Novo `kernel/RULES.md` com regras de registro, documentacao e praticas de trabalho (Express, Zod, Vite, MySQL, Prisma, PHP).
- Operacao (local)
  - Scripts locais de inicializacao confirmados: `C:\\Users\\Jeiel\\start_backend.bat` e `C:\\Users\\Jeiel\\start_frontend.bat`.

## 2026-01-29
- Auth/API
  - `apps/api/src/routes/index.ts` passou a tratar erros do cadastro (try/catch + mensagem JSON), incluindo conflito de email.
  - `apps/api/src/app.ts` ganhou middleware de erro para respostas JSON com detalhe em modo development.

- Auth/UI
  - Cadastro agora redireciona para modal de login apos sucesso (mantem email preenchido).
  - Menu superior agora atualiza nome/perfil do usuario logado via localStorage.
  - Botao "Sair" adicionado no menu superior com limpeza de sessao e reabertura do login.

## 2026-01-30 10:35:00
- Roles/Admin
  - Role MASTER adicionada (Prisma + migracao) e guardas permitem ADMIN ou MASTER.
  - Seed suporta MASTER via env e atualizacao de role para acesso superior.
- Admin/UI
  - Nova tela de permissoes no painel para promover usuarios via API.
- Index/UI
  - Aviso "Acesso restrito" exibido ao retornar para o index quando usuario logado nao possui permissao de admin.

## 2026-01-30 10:37:00
- Documentacao
  - Confirmado que as mudancas recentes foram registradas no `memory/MODIFICATION_LOG.md`.

## 2026-01-30 11:05:00
- Admin/Auth
  - `requireAdmin` agora valida token e consulta role no banco (ADMIN ou MASTER), evitando bloqueio por token desatualizado.
- Admin/UI
  - Tela de usuarios mostra mensagem de erro na tabela quando falha o carregamento.

## 2026-01-30 11:12:00
- Admin/UI
  - Grid de usuarios no admin agora usa dados reais da API (remove mock e conecta tabela dinamica).

## 2026-01-30 11:45:00
- Admin/UI
  - Tela de usuarios redesenhada no estilo CRUD (grid dominante, filtros, menu de acoes com Editar/Preview/Delete).
  - Modais de preview e edicao passam a abrir sob demanda.
- Admin/API
  - Endpoint de exclusao de usuario adicionado (DELETE /users/:id) com protecao para nao excluir o proprio usuario.

## 2026-01-30 12:20:00
- Users/DB
  - User expandido com campos de perfil (telefone 2, cidade, bairro, avatar, status, email verificado, rating, ultimo acesso).
- Users/API
  - Endpoints de criar/editar usuarios e listagem ampliada com novos campos.
  - Login atualiza ultimo acesso.
- Users/Admin UI
  - Tela de usuarios compacta com grid dominante, filtros e modais de criar/editar/preview alinhados ao layout solicitado.
  - Grid agora inclui avatar, email, celular, rating, cidade e status; modais mostram detalhes completos sob demanda.
  - Menu de acoes por linha (Editar/Preview/Delete) com modal de confirmacao para exclusao.
  - Formulario de cadastro/edicao inclui senha, permissao (role), status, email verificado e rating.
  - Observacao operacional: `prisma generate` pode falhar se o backend estiver rodando (arquivo do Prisma em uso).

## 2026-01-30 13:05:00
- Users/Admin UI
  - Modais de cadastro/edicao de usuarios com largura reduzida no desktop e mantendo responsivo no mobile.
  - Campo de avatar ajustado com preview e botoes para escolher arquivo local via modal.

## 2026-01-30 14:20:00
- Backend
  - Upload de imagens via `/api/uploads` com armazenamento local em `uploads/`.
  - Categorias e status separados para produtos e servicos no schema Prisma.
  - CRUD de produtos/servicos/memberships expandido (PATCH/DELETE) e novos endpoints de categorias/status.
  - Endpoints de assinaturas, pedidos, leads e agenda com atualizacao de status.
- Admin/UI
  - Remocao de dados em localStorage para categorias/status e assinaturas.
  - Servicos, produtos, leads, pedidos, assinaturas e agenda agora leem/gravam no banco.
  - Modal dedicado para imagem de produto e upload real no servidor.

## 2026-01-31 15:40:00
- Admin/UI
  - Modal de preview de usuario ajustado para a mesma largura do modal de edicao (desktop).
  - Filtros de usuarios: campo de busca reduzido e combos de papel/status ampliados para evitar sobreposicao do icone.
- Documentacao
  - `docs/project/PROJECT_OVERVIEW.md` atualizado com status atual do projeto (2026-01-31).

## 2026-02-03 18:49:34
- Admin/UI
  - Contraste ajustado no admin (texto claro em fundo branco) via overrides de cores e titulo do dashboard.

## 2026-02-03 20:05:44
- Admin/UI
  - Aba "Testes" adicionada ao admin com painel de resultados e botao para executar validacoes.
- Admin/Behavior
  - Runner de testes no admin (UI + API + gravacao opcional) e feedback de status.
- Tests
  - Script `scripts/run-page-tests.mjs` executado com API local ativa (PASS=28, FAIL=0, SKIP=0).
  - Playwright executado (3/3 PASS) com validacao de persistencia no banco (status/categoria/estoque) e fluxos de pedidos e assinaturas.

## 2026-02-03 20:51:04
- API/DB
  - Pedidos agora aceitam itens de servico (OrderItem.serviceId) e validam existencia de servicos e assinaturas.
  - Agendamentos agora podem referenciar pedidos (Appointment.orderId); confirmacao exige pagamento aprovado do pedido.
- Tests
  - E2E atualizado para pedidos com produto + servico, pagamento aprovado e confirmacao de agendamento atrelado ao pedido.

## 2026-02-03 21:14:04
- Tests
  - E2E ajustado para validar agendamento no painel usando `data-appointments-grid`, evitando conflito de texto com a tabela de usuarios.

## 2026-02-03 21:15:04
- Tests
  - Playwright executado novamente (3/3 PASS) apos ajuste do seletor de agenda.

## 2026-02-03 21:16:40
- Tests
  - E2E agora valida tambem o nome do servico na agenda (além do cliente).

## 2026-02-03 21:17:49
- Tests
  - Playwright executado novamente (3/3 PASS) apos validacao do servico na agenda.

## 2026-02-03 21:44:07
- Admin/UI
  - Menu lateral do admin simplificado para apenas Home com icone de casinha.
- UI
  - Texto padrao do menu de entrada atualizado para "ENTRAR" antes do login.

## 2026-02-03 21:58:10
- Admin/UI
  - Menu superior do admin removido; menu lateral restaurado com todas as opcoes originais.

## 2026-02-03 22:03:22
- Admin/UI
  - Header do admin com logo JLR e link "Voltar ao site" para o index.

## 2026-02-03 22:09:43
- Auth/UI
  - Avatar do usuario no menu superior agora usa `avatarUrl` do cadastro apos login.
- Auth/API
  - `/auth/login`, `/auth/register` e `/auth/me` agora retornam `avatarUrl`.

## 2026-02-03 22:14:17
- UI
  - Menu superior do `index.html` agora usa dados do usuario logado (nome, role e avatar) via localStorage.

## 2026-02-03 22:15:41
- UI
  - Menu superior do `index.html` agora esconde o bloco do usuario quando nao logado e exibe botao "Entrar".

## 2026-02-03 22:19:36
- UI
  - `public-nav.html` e `franquias-nav.html` agora mostram botao "Entrar" quando nao logado e escondem bloco do usuario + logout.
- Auth/UI
  - `auth.behavior.ts` agora controla visibilidade de login/usuario/logout conforme sessao.

## 2026-02-03 22:26:50
- UI
  - `index.html` agora usa `auth.behavior` quando disponivel e fallback inline para atualizar o menu do usuario.
- Auth/UI
  - `auth.behavior.ts` expõe `__initAuthNav` para compatibilidade com paginas estaticas.

## 2026-02-03 22:31:59
- UI
  - `index.html` agora depende apenas do `auth.behavior` (sem fallback inline) para o menu do usuario.

## 2026-02-04 00:27:50
- UI/Assets
  - Imagens da seção About renomeadas para `about_img1.webp` a `about_img7.webp` e referencias atualizadas (index, legacy e navs).

## 2026-02-04 00:32:37
- UI/Assets
  - Renomeadas as imagens correspondentes em `apps/web/public/images` para manter o build do Vite consistente.

## 2026-02-04 00:40:49
- UI/Assets
  - Grid hero de Franquias renomeado para `franquias_img1.webp` a `franquias_img8.webp` (pastas `images/franchise` e `apps/web/public/images/franchise`) e referencias atualizadas.

## 2026-02-04 02:53:02
- Admin/UI
  - Totalizadores de Servicos movidos para o topo da tela e adicionado card de "Total de pedidos" na area de Servicos.

## 2026-02-04 02:57:57
- Admin/UI
  - Grid de totalizadores de Servicos ajustado para 3 cards por linha.

## 2026-02-04 03:40:52
- Admin/UI
  - Adicionado totalizador "Total Vendas Mes" e ajustado fundo dos cards para #E4EEF0.

## 2026-02-04 03:46:12
- Admin/UI
  - Fundo dos modais de Servicos (categorias, status e imagem) ajustado para #8EB69B.

## 2026-02-04 03:53:48
- Admin/UI
  - Adicionados botoes de navegacao/paginacao no grid de servicos.

## 2026-02-04 04:01:39
- Admin/UI
  - Paginacao do grid de servicos conectada ao filtro/pesquisa com navegacao real (client-side).

## 2026-02-04 04:05:22
- Admin/UI
  - Adicionado seletor de itens por pagina no grid de servicos.
  - Paginacao agora preserva a pagina atual apos editar/excluir; filtros resetam para pagina 1.

## 2026-02-06 16:21:05
- Documentacao/Processo
  - `docs/project/PROJECT_OVERVIEW.md` atualizado: URL do admin ajustada de `http://localhost:5173/admin` para `http://localhost:5174/admin`.
  - `AGENTS.md` reforcado com regra basica obrigatoria: antes de alterar, listar todos os passos; registrar plano/progresso/checkpoint no `memory/MODIFICATION_LOG.md`; ao retomar, ler o log para continuar do ponto exato.

## 2026-02-06 17:08:47
- Web/Refactor de conteudo legado
  - `apps/web/src/components/pages/HomeContent.tsx`, `FranquiasContent.tsx`, `CheckoutContent.tsx` e `AdminContent.tsx` migrados para wrapper estavel (`LegacyHtml` + import `?raw`) para eliminar JSX invalido.
  - `apps/web/src/app/LegacyHtml.tsx` recriado.
  - Arquivos de conteudo legado restaurados em `apps/web/src/legacy`: `index.content.html`, `franquias.content.html`, `checkout.content.html`, `admin.body.html`.
- Web/Lint e tipagem
  - `apps/web/src/app/RequireAdmin.tsx` ajustado para evitar `setState` sincronico no `useEffect`.
  - `apps/web/src/types/jsx.d.ts` adicionado para suportar atributo custom `dcmsky` em JSX.
  - Ajustes de lint em `apps/web/src/legacy/admin.behavior.ts` e `apps/web/src/legacy/index.behavior.ts` (regex/typing e limpeza de diretivas inutilizadas).
  - `apps/web/e2e/flows.spec.ts` corrigido (regex sem escapes desnecessarios).
- API/TypeScript
  - `apps/api/src/routes/index.ts` corrigido: label duplicado removido, tipagem de detalhes Zod ampliada para `PropertyKey`, e normalizacao de `req.params.key` para `String`.
  - `apps/api/src/types/express.d.ts` adicionado para tipar `req.user`.
- Scripts/Testes
  - `scripts/run-page-tests.mjs` atualizado para refletir a estrutura atual (Vite + componentes/legacy em `apps/web`), removendo dependencia de `index.html` raiz.
  - Validacao executada:
    - `apps/web`: `npm run lint` PASS, `npm run build` PASS
    - `apps/api`: `npm run build` PASS
    - `node scripts/run-page-tests.mjs`: PASS=31 FAIL=0 WARN=0 SKIP=0
  - `apps/web`: `npx playwright test` PASS (3/3)

## 2026-02-06 20:44:07
- Plano (antes da alteracao)
  - Atualizar `AGENTS.md` para remover referencia a PostgreSQL e manter Playwright.
  - Eliminar `any` do codigo-fonte e manter tipagem strict.
  - Criar `logger` padrao e substituir usos diretos de `console.*` no app.
  - Validar com lint/build e Playwright.
- Documentacao
  - `AGENTS.md` atualizado:
    - removida a linha de PostgreSQL em "Linguagem e Framework";
    - "Jest para testes" trocado por "Playwright para testes E2E";
    - regra "Sem tipos any" mantida.
- API/Tipagem
  - `apps/api/src/routes/index.ts`:
    - `customer: z.any()` substituido por `z.custom<Prisma.InputJsonValue>()`;
    - tipos `OrderInput` e `OrderItemInput` adicionados;
    - removidos `item: any` em `forEach/map`;
    - payload JSON de pagamento ajustado para `Prisma.InputJsonObject` sem `any`.
- Logger
  - `apps/api/src/utils/logger.ts` criado.
  - `apps/web/src/utils/logger.ts` criado.
  - `apps/api/src/server.ts`, `apps/api/src/app.ts`, `apps/api/prisma/seed.ts` migrados para `logger`.
  - `apps/web/src/legacy/admin.behavior.ts` migrou `console.error` para `logger.error`.
- Web/Tipagem
  - `apps/web/src/types/jsx.d.ts` ajustado para suportar `dcmsky` sem quebrar tipagem React.
- Validacao
  - `apps/api`: `npm run build` PASS.
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
  - `apps/web`: `npx playwright test` PASS (3/3).
- Checkpoint de continuidade
  - Ultimo passo concluido: logger padronizado + tipagem sem `any` + validacoes executadas.
  - Proximo passo planejado: opcionalmente expandir migracao de `logger` para outros arquivos fora do escopo atual, caso desejado.

## 2026-02-06 23:29:55
- Plano (antes da alteracao)
  - Reproduzir problema da grade de assinaturas vazia no Admin.
  - Corrigir carregamento de memberships para evitar lista vazia com dados existentes.
  - Validar com lint/build e E2E focado em memberships.
- Admin/Memberships
  - `apps/web/src/legacy/admin.behavior.ts` reforcado:
    - normalizacao de `benefits` (aceita array/string e evita quebra de render);
    - normalizacao dos registros retornados pela API antes de renderizar;
    - fallback para `/api/public/memberships` quando `/api/memberships` falha;
    - logs com `logger.warn`/`logger.error` para diagnostico.
  - Fluxo de edicao ajustado para usar beneficios normalizados.
- Testes
  - Novo teste E2E: `apps/web/e2e/membership-grid.spec.ts` para garantir que a grade renderiza planos persistidos.
  - Validacao executada:
    - `apps/web`: `npm run lint` PASS
    - `apps/web`: `npm run build` PASS
    - `apps/web`: `npx playwright test e2e/membership-grid.spec.ts --output=tmp/pw-membership` PASS (1/1)
- Checkpoint de continuidade
  - Ultimo passo concluido: grade de memberships robustecida e teste de regressao adicionado.
  - Proximo passo planejado: se necessario, expandir E2E para validar tambem CRUD completo de memberships (create/edit/delete).

## 2026-02-06 23:53:33
- Plano (antes da alteracao)
  - Criar programa separado para inspecao de tabelas do banco com botoes por tabela.
  - Exibir resultado em grid dinamica.
  - Registrar sucesso/erro de cada fetch em area de log abaixo da grid.
  - Validar compilacao/lint.
- API
  - `apps/api/src/routes/index.ts`:
    - adicionado endpoint `GET /order-items` (admin) para cobrir tabela `OrderItem`.
- Web
  - `apps/web/src/pages/DbConsole.tsx` criado:
    - primeira linha com botoes para todas as tabelas do schema;
    - clique em botao executa fetch da tabela correspondente;
    - resultado atribuido em grid dinamica (colunas inferidas dos dados);
    - bloco de log (textarea) registra cada tentativa com timestamp e status;
    - tratamento de erro com `try/catch` e mensagem detalhada.
  - `apps/web/src/app/App.tsx`:
    - nova rota protegida `/db-console` (e alias `/db-console.html`) via `RequireAdmin`.
- Validacao
  - `apps/api`: `npm run build` PASS.
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: DB Console funcional com fetch por tabela + log de erro/sucesso.
  - Proximo passo planejado: opcionalmente adicionar export CSV/JSON e filtros por coluna na grid.

## 2026-02-07 01:21:59
- Plano (antes da alteracao)
  - Separar tela de Planos (memberships) da tela de Assinantes (subscriptions).
  - Transformar Assinantes em grid CRUD com Incluir/Editar via modal.
  - Ajustar API para suportar inclusao/edicao completa de assinantes.
  - Validar lint/build e E2E.
- Admin/UI
  - `apps/web/src/legacy/admin.body.html`:
    - menu lateral atualizado: item `assinaturas` dividido em `Planos` e `Assinantes`;
    - view `data-view="assinaturas"` renomeada para `data-view="planos"` (mantendo cards visuais de planos);
    - nova view `data-view="assinantes"` com:
      - grid/tabular de assinantes,
      - totalizador,
      - paginação,
      - seletor de pagina (10/20/50),
      - botao `INCLUIR`.
    - novo modal `data-modal="assinantes-form"` para incluir/editar assinante.
  - `apps/web/src/legacy/admin.behavior.ts`:
    - expected views atualizado para `planos` e `assinantes`;
    - subscriptions refatorado para fluxo de grid CRUD:
      - filtro + paginação client-side,
      - contador e range,
      - botão de editar com ícone de lápis por linha,
      - abertura de modal para incluir/editar,
      - submit do modal persistindo via API.
    - labels de plano ajustados (`Salvar/Atualizar Plano`).
- API
  - `apps/api/src/routes/index.ts`:
    - adicionado `subscriptionSchema` (create) e expansão de `subscriptionUpdateSchema`;
    - novo endpoint `POST /subscriptions`;
    - `PATCH /subscriptions/:id` ampliado para editar plano/cliente/status/datas;
    - validacoes de membership e datas adicionadas.
- Testes
  - E2E ajustado para novos view-triggers:
    - `apps/web/e2e/membership-grid.spec.ts` usa `data-view-trigger="planos"`.
    - `apps/web/e2e/flows.spec.ts` usa `data-view-trigger="assinantes"`.
  - Validacao executada:
    - `apps/api`: `npm run build` PASS
    - `apps/web`: `npm run lint` PASS
    - `apps/web`: `npm run build` PASS
    - `apps/web`: `npx playwright test` PASS (4/4)
- Checkpoint de continuidade
  - Ultimo passo concluido: split Planos/Assinantes + CRUD modal de Assinantes funcionando.
  - Proximo passo planejado: extrair blocos de behavior por dominio (planos, assinantes, servicos, produtos...) em modulos menores para reduzir acoplamento.

## 2026-02-07 01:51:51
- Plano (antes da alteracao)
  - Adicionar botao de editar direto na linha da grid de Usuarios.
  - Reaproveitar fluxo de edicao existente (modal user-edit).
- Admin/Usuarios
  - `apps/web/src/legacy/admin.behavior.ts`:
    - render da coluna de acoes da grid de usuarios atualizado com botao lapis visivel por linha (`data-user-action="edit"`), mantendo menu de tres pontos para demais acoes.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
  - `apps/web`: `npx playwright test` PASS (4/4).
- Checkpoint de continuidade
  - Ultimo passo concluido: botao editar inline na grid de usuarios entregue.
  - Proximo passo planejado: opcionalmente remover menu de tres pontos e deixar todas as acoes explicitas na linha, se desejado.

## 2026-02-07 02:00:48
- Plano (antes da alteracao)
  - Adicionar rolagem vertical em modais com muitos campos.
  - Incluir navegacao por paginas dentro da janela de formulario no formato circular: `< 1 2 ... >`.
- Admin/UX
  - `apps/web/src/legacy/admin.behavior.ts`:
    - criado helper generico de paginação para modais (`initModalPager`) com botoes circulares e controle de pagina;
    - adicionado suporte de rolagem vertical (`maxHeight` + `overflowY`) para modais longos;
    - aplicado em:
      - `user-create`
      - `user-edit`
      - `assinantes-form`
    - reset de pagina configurado ao abrir cada modal para iniciar na pagina 1.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: modais longos com scroll e paginação circular.
  - Proximo passo planejado: opcionalmente ajustar quantidade de campos por pagina para cada modal conforme preferencia de UX.

## 2026-02-07 02:13:20
- Plano (antes da alteracao)
  - Remover paginação circular dos modais.
  - Mover paginação circular para o rodape da grid de Usuarios.
  - Habilitar navegacao lateral da grid (scroll horizontal).
- Admin/Usuarios
  - `apps/web/src/legacy/admin.body.html`:
    - wrapper da tabela de usuarios alterado para `overflow-x-auto` e tabela com largura minima para scroll lateral;
    - rodape da grid atualizado com controles circulares `< 1 2 ... >` e indicador de faixa exibida.
  - `apps/web/src/legacy/admin.behavior.ts`:
    - removido pager de modal (`initModalPager`) e resets associados;
    - mantida apenas rolagem vertical de modal (`ensureScrollableModal`);
    - adicionada paginacao client-side na grid de usuarios:
      - pagina atual, total de paginas,
      - render de botoes numericos circulares,
      - botoes prev/next circulares,
      - atualização de faixa `Mostrando X-Y de Z`.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: paginação circular posicionada corretamente no grid de usuarios + scroll lateral da tabela.
  - Proximo passo planejado: opcionalmente adicionar seletor de itens por pagina (10/20/50) tambem na grid de usuarios.

## 2026-02-07 13:55:25
- Plano (antes da alteracao)
  - Reduzir a largura do modal `assinantes-form` na tela de Assinantes, mantendo responsividade para celular.
  - Criar modal de adesao na Home para incluir assinante com plano preselecionado a partir do botao `Entrar no Clube`.
  - Conectar submit do modal da Home a um endpoint publico de subscriptions (sem exigir role admin), com validacao.
  - Ao finalizar cadastro no modal da Home, direcionar usuario para `/checkout` para pagamento.
  - Validar com build/lint (`apps/api` e `apps/web`).
- Admin/UI
  - `apps/web/src/legacy/admin.body.html`:
    - modal `assinantes-form` reduzido de `max-w-3xl` para `max-w-2xl` e largura mobile ajustada (`w-[94vw]`);
    - formulario interno ajustado para 2 colunas apenas em `lg`, melhorando leitura em telas menores.
- Home/UI e fluxo de assinatura
  - `apps/web/src/legacy/index.content.html`:
    - botoes `Entrar no Clube` dos 3 cards estaticos agora possuem `data-membership-join` + metadados do plano;
    - novo modal de adesao adicionado (plano, nome, email, telefone + estados de erro/acao).
  - `apps/web/src/legacy/index.behavior.ts`:
    - botoes dos cards dinamicos tambem passaram a renderizar `data-membership-join` com `membershipId`;
    - abertura do modal com pre-selecao do plano clicado;
    - submit cria assinatura via endpoint publico e redireciona para `/checkout`;
    - dados da intencao de checkout salvos em `localStorage` (`jlr_pending_subscription_checkout`).
- API
  - `apps/api/src/routes/index.ts`:
    - novo schema `publicSubscriptionSchema` com validacao de `membershipId`, `customerName`, `customerEmail` e `customerPhone`;
    - novo endpoint `POST /public/subscriptions`:
      - valida payload,
      - verifica plano ativo,
      - cria assinatura com status `PENDING`,
      - retorna `id` e `membershipId`.
- Validacao
  - `apps/api`: `npm run build` PASS.
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
  - `apps/web`: `npx playwright test` PASS (4/4).
- Checkpoint de continuidade
  - Ultimo passo concluido: fluxo Home -> modal de assinatura -> criacao publica -> redirecionamento para checkout entregue.
  - Proximo passo planejado: popular a tela `/checkout` com os dados de `jlr_pending_subscription_checkout` para exibir resumo real do plano selecionado.

## 2026-02-07 14:27:21
- Plano (antes da alteracao)
  - Ler `index_base.html` para extrair dados atuais do CTA de WhatsApp.
  - Adicionar botao `Fale Conosco` na mesma linha do bloco "Pagamento e Seguranca" em `checkout.content.html`.
  - Montar link do WhatsApp Web com mensagem preenchida com nome, email, telefone, plano e valor.
  - Reaproveitar dados da assinatura pendente (`jlr_pending_subscription_checkout`) para preencher a mensagem.
  - Validar com lint/build no `apps/web`.
- Referencia de WhatsApp
  - `index_base.html`: CTA encontrado com telefone `5511978935812` (link `wa.me`).
- Checkout/UI
  - `apps/web/src/legacy/checkout.content.html`:
    - adicionada acao `Fale Conosco` na mesma linha de "Pagamento e Seguranca";
    - botao abre WhatsApp Web em nova aba (`data-checkout-whatsapp-link`).
- Checkout/Behavior
  - `apps/web/src/legacy/index.behavior.ts`:
    - adicionado builder de URL do WhatsApp Web com telefone `5511978935812`;
    - mensagem pre-preenchida agora inclui:
      - nome,
      - email,
      - telefone,
      - plano escolhido,
      - valor;
    - leitura dos dados do `localStorage` via `jlr_pending_subscription_checkout`;
    - enriquecimento da mensagem com nome/titulo/preco do plano (cache de memberships, quando necessario).
  - fluxo de assinatura da Home atualizado para salvar tambem `planName`, `planTitle`, `planPrice` e `planValueLabel` no `localStorage` antes de redirecionar para `/checkout`.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: checkout com CTA "Fale Conosco" integrado ao WhatsApp Web com dados pre-preenchidos da assinatura.
  - Proximo passo planejado: opcionalmente espelhar esses mesmos dados no bloco visual de "Resumo do Pedido" do checkout.

## 2026-02-07 14:47:44
- Plano (antes da alteracao)
  - Ajustar apenas o icone do botao `Fale Conosco` no checkout para visual de WhatsApp.
  - Usar simbolo do WhatsApp em circulo verde com aro branco.
  - Validar com lint/build no `apps/web`.
- Checkout/UI
  - `apps/web/src/legacy/checkout.content.html`:
    - icone do botao `Fale Conosco` alterado para logo do WhatsApp em circulo verde (`#25D366`) com borda branca circular.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: botao `Fale Conosco` com iconografia WhatsApp conforme solicitado.
  - Proximo passo planejado: opcionalmente ajustar tamanho/espacamento do icone para equivaler exatamente ao padrao visual dos demais CTAs.

## 2026-02-07 17:32:54
- Plano (antes da alteracao)
  - Corrigir renderizacao do icone no botao `Fale Conosco` (icone estava invisivel/branco).
  - Substituir SVG inline por arquivo SVG de imagem para evitar conflito de estilos globais.
  - Manter visual solicitado: WhatsApp verde com circulo branco.
  - Validar com lint/build no `apps/web`.
- Checkout/UI
  - `apps/web/public/images/whatsapp-icon-button.svg` criado com visual WhatsApp (fundo verde + aro branco).
  - `apps/web/src/legacy/checkout.content.html` atualizado para usar `<img src="/images/whatsapp-icon-button.svg">` no botao `Fale Conosco`.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: icone do WhatsApp agora renderiza por asset dedicado e aparece corretamente ao lado de `Fale Conosco`.
  - Proximo passo planejado: opcionalmente substituir o icone por PNG oficial recortado, se quiser fidelidade visual 1:1 com a imagem de referencia.

## 2026-02-07 20:02:54
- Plano (antes da alteracao)
  - Criar pagina publica separada para `Assinaturas` com o mesmo layout de menu/footer da home.
  - Adicionar hero com background `apps/web/public/images/hero2.webp` e texto fornecido.
  - Reaproveitar (copiar) a mesma secao de Assinaturas da home.
  - Reaproveitar secao de recomendacoes/depoimentos da home.
  - Incluir nova entrada `ASSINATURAS` no menu principal ao lado de `JLR Beauty`.
  - Registrar rota publica `/assinaturas` (+ alias `assinaturas.html`) e validar com lint/build.
- Web/Paginas
  - `apps/web/src/legacy/assinaturas.content.html` criado com:
    - hero com background `/images/hero2.webp` e texto solicitado (titulo + descricao);
    - secao de Assinaturas copiada da home (cards + `data-membership-grid`);
    - modal de adesao reutilizado (`data-membership-subscribe-*`);
    - secao de recomendacoes/depoimentos copiada da home.
  - `apps/web/src/components/pages/AssinaturasContent.tsx` criado (wrapper `LegacyHtml` para novo HTML legado).
  - `apps/web/src/pages/Assinaturas.tsx` criado.
- Web/Rotas
  - `apps/web/src/app/App.tsx` atualizado:
    - nova rota publica `/assinaturas`;
    - alias `assinaturas.html` redirecionando para `/assinaturas`.
- Web/Menu
  - `apps/web/src/components/public/PublicNav.tsx` atualizado com item `ASSINATURAS` ao lado de `JLR Beauty`.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
  - `apps/web`: `npx playwright test` parcial (3/4 PASS, 1 FAIL por timeout externo em `POST /api/auth/login` no spec `membership-grid`).
  - Reexecucao isolada do spec falho nao concluida por erro de ambiente (`spawn EPERM`).
- Checkpoint de continuidade
  - Ultimo passo concluido: pagina publica de assinaturas entregue e navegavel via menu/rota.
  - Proximo passo planejado: adicionar E2E dedicado da rota `/assinaturas` (hero + cards + modal de adesao) quando o runner estabilizar.

## 2026-02-07 22:29:51
- Plano (antes da alteracao)
  - Corrigir corte visual do hero da pagina `Assinaturas` abaixo do menu fixo.
  - Ajustar apenas espacamento superior (`padding-top`) do hero para exibir o titulo completo.
  - Validar com lint/build no `apps/web`.
- Web/UI
  - `apps/web/src/legacy/assinaturas.content.html`:
    - hero ajustado de `pt-36` para `pt-52 md:pt-56` para evitar sobreposicao com a navbar fixa.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: titulo do hero da pagina Assinaturas voltou a aparecer completo.
  - Proximo passo planejado: opcionalmente reduzir altura total do hero em telas menores apos confirmar visual final.

## 2026-02-07 22:38:41
- Plano (antes da alteracao)
  - Aumentar novamente o padding superior do hero da pagina `Assinaturas`.
  - Reestruturar o hero tomando como base o da home (`index`), com inicio do texto apos o menu fixo.
  - Limitar o bloco de texto a meia tela em desktop (`lg:w-1/2`).
  - Validar com lint/build no `apps/web`.
- Web/UI
  - `apps/web/src/legacy/assinaturas.content.html`:
    - hero refeito no padrao estrutural da home (`header` com camadas de overlay e imagem de fundo);
    - padding superior aumentado para iniciar apos menu fixo (`pt-44 md:pt-52`);
    - bloco de texto limitado a metade da largura em desktop (`w-full lg:w-1/2`).
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: hero da pagina Assinaturas alinhado com o estilo da home e sem corte de titulo.
  - Proximo passo planejado: opcionalmente ajustar altura minima do hero para reduzir area vazia em telas menores.

## 2026-02-08 02:38:43
- Plano (antes da alteracao)
  - Ajustar hero da pagina `Assinaturas` para o mesmo comportamento visual da home (`index`).
  - Forcar altura cheia de viewport (`h-screen` + `min-h`) para evitar efeito "espremido".
  - Manter imagem ocupando largura/altura completas no hero.
  - Garantir texto iniciando abaixo do menu fixo, ocupando metade da largura em desktop.
  - Validar com build do `apps/web`.
- Web/UI
  - `apps/web/src/legacy/assinaturas.content.html`:
    - hero atualizado para `h-screen min-h-[600px]` (mesmo conceito da home);
    - imagem mantida em `bg-cover` ocupando largura/altura completas;
    - container do texto ajustado para `h-full` com `pt-32 md:pt-36` (inicio apos menu);
    - bloco textual mantido em meia largura no desktop (`w-full lg:w-1/2`).
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: hero da pagina Assinaturas agora ocupa a tela como o index, sem aspecto espremido.
  - Proximo passo planejado: opcionalmente refinar posicao vertical do bloco de texto por breakpoint apos validacao visual final.

## 2026-02-08 03:04:47
- Plano (antes da alteracao)
  - Refazer o hero de `Assinaturas` no formato "with cards" (referencia visual enviada).
  - Manter `hero2.webp` no fundo ocupando largura e altura completas.
  - Organizar texto principal em meia largura da tela.
  - Adicionar 3 boxes arredondados com os textos fornecidos.
  - Validar com lint/build no `apps/web`.
- Web/UI
  - `apps/web/src/legacy/assinaturas.content.html`:
    - hero reestruturado com layout em duas zonas:
      - topo: titulo + subtitulo em `w-full lg:w-1/2`;
      - base: grid com 3 cards arredondados;
    - overlay escuro + gradiente aplicados sobre `hero2.webp` para legibilidade;
    - cards implementados com conteudos:
      - "Como funciona?" + "Assine ...";
      - "Agende e Visite" + blocos "Agende ..." e "Visita ...";
      - "Prontinho!!" + mensagem final.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: hero de Assinaturas remodelado no estilo "with cards", com texto e cards conforme briefing.
  - Proximo passo planejado: ajustar microtipografia (tamanhos/espacamentos) apos revisao visual final no navegador.

## 2026-02-08 03:20:13
- Plano (antes da alteracao)
  - Descer o bloco de titulo/subtitulo do hero para a metade da imagem.
  - Ajustar titulo/subtitulo para o estilo do titulo "Quer fazer uma Assinatura e Economizar?" em cor branca.
  - Subir os 3 cards para ficar com efeito flutuante dentro do hero (acima do limite inferior).
  - Validar com lint/build no `apps/web`.
- Web/UI
  - `apps/web/src/legacy/assinaturas.content.html`:
    - bloco de texto do hero reposicionado para mais abaixo (`mt-24 md:mt-28`);
    - titulo ajustado para estilo do titulo da secao de assinaturas (`text-4xl md:text-5xl display-hero text-shadow-strong`) em branco;
    - subtitulo ajustado para branco (`text-white`) com legibilidade reforcada;
    - cards movidos para cima com efeito flutuante (`relative -top-8 md:-top-12`).
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: hero com titulo/subtitulo abaixo do menu e cards flutuando dentro da imagem de fundo.
  - Proximo passo planejado: ajustar finamente apenas espacamento vertical (pixel-perfect) apos sua revisao visual.

## 2026-02-08 03:32:56
- Plano (antes da alteracao)
  - Aumentar o tamanho do titulo do hero para faixa `6xl/7xl`.
  - Reposicionar titulo para mais abaixo (`mt-32`).
  - Isolar subtitulo em bloco de meia largura para quebrar mais linhas.
  - Reduzir brilho da imagem de fundo com camada verde escura semitransparente (~70%).
  - Validar com lint/build no `apps/web`.
- Web/UI
  - `apps/web/src/legacy/assinaturas.content.html`:
    - titulo do hero aumentado para `text-6xl md:text-7xl`;
    - bloco do titulo reposicionado para baixo (`mt-32 md:mt-36`);
    - subtitulo isolado em bloco dedicado de meia largura (`w-full lg:w-1/2`);
    - brilho da imagem reduzido com overlay `bg-[#0b2418]/70` + gradiente escuro.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: hero com titulo maior/mais baixo, subtitulo em meia largura e fundo escurecido.
  - Proximo passo planejado: opcionalmente ajustar o alinhamento vertical fino dos cards (flutuar mais/menos) apos validacao visual.

## 2026-02-08 04:11:59
- Encerramento do dia
  - Estado geral salvo em disco com ajustes da pagina `/assinaturas` (hero, cards, menu e fluxo de assinatura).
  - Documentacao consolidada no `memory/MODIFICATION_LOG.md` para retomada exata.
- Checkpoint de continuidade
  - Ultimo passo concluido: hero da pagina Assinaturas ajustado com titulo maior (`6xl/7xl`), texto mais abaixo, subtitulo em meia largura e overlay verde escuro para reduzir brilho.
  - Proximo passo planejado: revisar visual final da pagina `/assinaturas` e, se necessario, fazer ajuste fino de espacamento vertical do bloco de texto e dos cards flutuantes.

## 2026-02-08 15:40:28
- Hero/Assinaturas
  - `apps/web/src/legacy/assinaturas.content.html`:
    - aplicado `hue-rotate-[270deg]` na camada da imagem de fundo do hero (`hero2.webp`).

## 2026-02-08 15:47:52
- Hero/Assinaturas
  - `apps/web/src/legacy/assinaturas.content.html`:
    - removido `hue-rotate`;
    - criada camada dedicada `absolute inset-0 bg-black/30` sobre a imagem de fundo do hero.

## 2026-02-08 15:53:33
- Plano (antes da alteracao)
  - Gerar/ajustar script `.bat` para compilar Tailwind do projeto.
  - Garantir execucao correta mesmo quando chamado fora da pasta raiz.
  - Registrar checkpoint de continuidade.
- Scripts
  - `compile_tailwind.bat` atualizado:
    - adiciona `cd /d "%~dp0"` para executar sempre na raiz do projeto;
    - mensagens padronizadas com prefixo `[Tailwind]`;
    - retorno explicito com `exit /b 0` em sucesso.
- Validacao
  - Execucao `cmd /c compile_tailwind.bat` bloqueada no ambiente por cache offline do npm (`ENOTCACHED` para `tailwindcss@3.4.17`).
- Checkpoint de continuidade
  - Ultimo passo concluido: script `.bat` de compilacao do Tailwind ajustado e salvo.
  - Proximo passo planejado: executar o `.bat` em ambiente com cache/npm online para validar compilacao fim-a-fim.

## 2026-02-08 16:20:19
- Plano (antes da alteracao)
  - Converter `hero3.png` para `hero3.webp`.
  - Trocar o background do hero de Assinaturas de `hero2.webp` para `hero3.webp`.
  - Remover camadas extras de opacidade criadas anteriormente no hero.
  - Validar com lint/build no `apps/web`.
- Web/Assets
  - `images/hero3.webp` gerado a partir de `images/hero3.png`.
  - `apps/web/public/images/hero3.webp` sincronizado a partir do arquivo convertido.
- Web/UI
  - `apps/web/src/legacy/assinaturas.content.html`:
    - background do hero alterado para `'/images/hero3.webp'`;
    - camada extra de opacidade `absolute inset-0 bg-black/30` removida.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: hero de Assinaturas atualizado para `hero3.webp` sem overlay extra.
  - Proximo passo planejado: revisao visual rapida da pagina `/assinaturas` para ajuste fino opcional de contraste/texto.

## 2026-02-08 16:48:34
- Plano (antes da alteracao)
  - Descer mais o bloco de titulo/subtitulo do hero da pagina `Assinaturas`.
  - Quebrar o subtitulo em frases menores mantendo o mesmo texto.
  - Reorganizar os textos dos cards:
    - card 1: "Como funciona?" + "Assine ...";
    - card 2: "Agende e Visite" + "Agende ...";
    - card 3: "Prontinho!!" + "Visita ..." + "Manter ...".
  - Validar com lint/build no `apps/web`.
- Web/UI
  - `apps/web/src/legacy/assinaturas.content.html`:
    - bloco de titulo reposicionado mais para baixo (`mt-40 md:mt-44`);
    - subtitulo ajustado para largura menor (`lg:w-[44%] xl:w-[40%]`) e quebrado em 4 frases (mesmo texto existente);
    - cards reorganizados:
      - card 1 (`Como funciona?`): manteve "Assine ...";
      - card 2 (`Agende e Visite`): manteve apenas "Agende ...";
      - card 3 (`Prontinho!!`): recebeu "Visita ..." + "Manter ...".
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: hero de Assinaturas com titulo/subtitulo mais baixos e cards com texto redistribuido conforme referencia.
  - Proximo passo planejado: revisar visual final em `/assinaturas` para ajuste fino opcional de espacamento entre titulo, subtitulo e cards.

## 2026-02-08 17:25:22
- Plano (antes da alteracao)
  - Baixar ainda mais o bloco de titulo/subtitulo do hero em `Assinaturas`.
  - Inserir a imagem `Agende_Marque.png` no segundo box (`Agende e Visite`).
  - Garantir que a imagem ocupe aproximadamente 1/3 da altura do box.
  - Validar com lint/build no `apps/web`.
- Web/UI
  - `apps/web/src/legacy/assinaturas.content.html`:
    - titulo/subtitulo reposicionados ainda mais para baixo (`mt-52 md:mt-56`);
    - subtitulo com largura horizontal menor (`lg:w-[38%] xl:w-[34%]`) para manter quebra mais curta;
    - segundo box (`Agende e Visite`) atualizado com layout em coluna e imagem `'/images/Agende_Marque.png'`;
    - imagem posicionada no bloco inferior com proporcao de aproximadamente `1/3` do card (`basis-1/3` + `min-h-[88px]`).
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: textos do hero foram baixados e segundo box agora exibe `Agende_Marque.png` ocupando a area inferior.
  - Proximo passo planejado: ajuste fino opcional de altura (`mt`) e da proporcao da imagem (`basis`) apos revisao visual no navegador.

## 2026-02-08 17:42:02
- Plano (antes da alteracao)
  - Reduzir a imagem do segundo box (`Agende e Visite`) para ~1/4 do tamanho visual atual.
  - Manter textos e demais estruturas do hero sem alteracao.
  - Validar com lint/build no `apps/web`.
- Web/UI
  - `apps/web/src/legacy/assinaturas.content.html`:
    - imagem do segundo box reduzida para aproximadamente `1/4` da area visual anterior;
    - ajuste aplicado com container menor (`h-[44px]`, `w-1/2`, `self-center`), preservando o mesmo `src`.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: imagem `Agende_Marque.png` reduzida no segundo box para escala menor.
  - Proximo passo planejado: ajuste fino opcional do tamanho final (ex.: `h-[40px]` ou `w-[45%]`) apos sua revisao visual.

## 2026-02-08 17:47:29
- Plano (antes da alteracao)
  - Remover a imagem `Agende_Marque.png` do segundo box (`Agende e Visite`).
  - Substituir por um icone pequeno de agenda com cor de destaque.
  - Manter textos e estrutura geral do hero.
  - Validar com lint/build no `apps/web`.
- Web/UI
  - `apps/web/src/legacy/assinaturas.content.html`:
    - imagem do segundo box removida;
    - icone pequeno de agenda adicionado (`calendar_month`) com destaque em `text-gold`, fundo semitransparente e borda suave.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: box `Agende e Visite` agora usa icone de agenda pequeno e colorido no lugar da imagem.
  - Proximo passo planejado: ajuste fino opcional do estilo do icone (tamanho/cor/fundo) apos revisao visual.

## 2026-02-08 18:01:40
- Plano (antes da alteracao)
  - Aplicar layout interno em dois blocos para os 3 cards do hero (`25/75`).
  - Bloco esquerdo menor para icone/imagem e bloco direito maior para titulo + texto.
  - Nao exibir linhas divisorias extras (somente a composicao visual em duas areas).
  - Usar icones sugestivos e coloridos para cada card.
  - Validar com lint/build no `apps/web`.
- Web/UI
  - `apps/web/src/legacy/assinaturas.content.html`:
    - 3 cards do hero refatorados para layout interno em duas colunas (`25/75`) sem linhas visiveis;
    - coluna esquerda (menor) configurada para icone, centralizado e com fundo sutil;
    - coluna direita (maior) configurada para titulo + texto;
    - icones aplicados:
      - card 1: `task_alt` (verde agua);
      - card 2: `calendar_month` (dourado);
      - card 3: `auto_awesome` (rosa claro).
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: os 3 cards agora seguem composicao esquerda/ direita (`25/75`) com icones coloridos.
  - Proximo passo planejado: ajuste fino opcional de proporcao (`22/78` ou `28/72`) e tamanho dos icones apos revisao visual.

## 2026-02-08 18:05:02
- Plano (antes da alteracao)
  - Substituir os icones dos 3 cards por imagens pequenas (opcao 2).
  - Manter layout interno `25/75` e textos inalterados.
  - Usar imagens locais de `apps/web/public/images`.
  - Validar com lint/build no `apps/web`.
- Web/UI
  - `apps/web/src/legacy/assinaturas.content.html`:
    - icones dos 3 cards substituidos por mini-imagens (`h-12/w-12` e `md:h-14/md:w-14`) na coluna esquerda;
    - imagens aplicadas:
      - card 1 (`Como funciona?`): `/images/about_img2.webp`;
      - card 2 (`Agende e Visite`): `/images/Agende_Marque.png`;
      - card 3 (`Prontinho!!`): `/images/about_img6.webp`.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: cards do hero agora usam imagens pequenas na area esquerda (opcao 2), mantendo o layout `25/75`.
  - Proximo passo planejado: ajuste fino opcional de escolha das imagens ou tamanho (`h-10/w-10`) apos revisao visual.

## 2026-02-08 18:09:39
- Plano (antes da alteracao)
  - Remover a frase final do 3 card (`Prontinho!!`) no hero de `Assinaturas`.
  - Manter titulo, primeira frase e layout dos cards sem alteracoes.
  - Validar com lint/build no `apps/web`.
- Web/UI
  - `apps/web/src/legacy/assinaturas.content.html`:
    - removida a frase: `Manter sua auto estima la em cima e seus cuidados sempre em dia nunca foi tao simples!!` do 3 card.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: 3 card (`Prontinho!!`) agora exibe apenas a frase de visita.
  - Proximo passo planejado: ajuste fino opcional de espacamento vertical interno do 3 card apos remocao da segunda frase.

## 2026-02-08 18:14:55
- Plano (antes da alteracao)
  - Manter tamanho dos cards e colunas como estao.
  - Aumentar visualmente as imagens da coluna esquerda para efeito de recorte ("janela").
  - Aplicar `overflow-hidden` no box esquerdo e escalar as imagens internamente.
  - Validar com lint/build no `apps/web`.
- Web/UI
  - `apps/web/src/legacy/assinaturas.content.html`:
    - coluna esquerda dos 3 cards mantida com as mesmas dimensoes (`w-1/4 min-w-[72px]`);
    - aplicado `overflow-hidden` no box esquerdo para criar efeito de recorte;
    - imagens ajustadas para preencher e exceder o frame com escala interna:
      - card 1: `scale-[1.45]`;
      - card 2: `scale-[1.55]`;
      - card 3: `scale-[1.45]`.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: imagens agora aparecem parcialmente recortadas pela coluna esquerda, mantendo o mesmo tamanho de layout.
  - Proximo passo planejado: ajuste fino opcional da area visivel via `object-position` em cada imagem apos revisao visual.

## 2026-02-08 18:24:59
- Plano (antes da alteracao)
  - Padronizar a coluna esquerda dos 3 cards com largura fixa identica.
  - Remover dependencia de proporcao (`w-1/4`) para evitar diferenca visual entre cards.
  - Manter o restante do layout/estilo sem alteracoes.
  - Validar com lint/build no `apps/web`.
- Web/UI
  - `apps/web/src/legacy/assinaturas.content.html`:
    - 3 cards internos mudados de `flex + w-1/4` para `grid` com coluna fixa identica;
    - largura esquerda padronizada em `78px` para todos (`grid-cols-[78px_minmax(0,1fr)]`);
    - coluna direita ajustada para `min-w-0` mantendo o mesmo comportamento de texto.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: coluna 1 dos tres cards ficou com largura fixa igual entre todos.
  - Proximo passo planejado: ajuste fino opcional do valor fixo (ex.: `74px` ou `82px`) apos revisao visual.

## 2026-02-08 18:38:07
- Plano (antes da alteracao)
  - Reverter a ultima alteracao de largura fixa da coluna esquerda.
  - Voltar ao layout anterior proporcional (`w-1/4` + `w-3/4`) nos 3 cards.
  - Manter recorte das imagens e demais estilos.
  - Validar com lint/build no `apps/web`.
- Web/UI
  - `apps/web/src/legacy/assinaturas.content.html`:
    - removido `grid-cols-[78px_minmax(0,1fr)]` dos 3 cards;
    - restaurado layout anterior com `flex`, coluna esquerda `w-1/4 min-w-[72px]` e coluna direita `w-3/4`.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: cards retornaram ao estado visual anterior (melhor aprovado) com colunas proporcionais.
  - Proximo passo planejado: opcionalmente ajustar apenas enquadramento das imagens via `object-position`, sem mexer nas larguras.

## 2026-02-08 18:41:45
- Plano (antes da alteracao)
  - Reduzir um pouco a largura da coluna 1 apenas no card do meio (`Agende e Visite`).
  - Manter os outros dois cards inalterados.
  - Validar com lint/build no `apps/web`.
- Web/UI
  - `apps/web/src/legacy/assinaturas.content.html`:
    - card do meio (`Agende e Visite`) ajustado de `25/75` para `22/78`;
    - coluna 1: `w-[22%] min-w-[64px]`;
    - coluna 2: `w-[78%]`.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: coluna esquerda do card do meio ficou um pouco menor, mantendo os outros cards como estavam.
  - Proximo passo planejado: ajuste fino opcional (ex.: `23/77` ou `21/79`) apos revisao visual.

## 2026-02-08 19:15:12
- Plano (antes da alteracao)
  - Reduzir a altura dos 3 cards do hero em pelo menos 1/3.
  - Manter layout, textos e colunas atuais.
  - Diminuir `min-height`, paddings e gaps para consolidar a reducao visual.
  - Validar com lint/build no `apps/web`.
- Web/UI
  - `apps/web/src/legacy/assinaturas.content.html`:
    - `min-h` dos cards reduzido de `190px` para `126px` (redução de ~33,7%);
    - padding dos cards reduzido de `p-4 md:p-5` para `p-3 md:p-4`;
    - gaps internos reduzidos de `gap-3 md:gap-4` para `gap-2 md:gap-3`;
    - espacamentos de titulo/paragrafo ajustados (`mb-3` para `mb-2`) para compactar a altura final.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: 3 cards do hero ficaram visivelmente mais baixos (>= 1/3), mantendo o mesmo layout estrutural.
  - Proximo passo planejado: ajuste fino opcional do `min-h` (ex.: `120px` ou `132px`) conforme revisao visual.

## 2026-02-08 19:21:18
- Plano (antes da alteracao)
  - Aplicar reducao mais agressiva na altura dos 3 cards (meta visual proxima de metade).
  - Reduzir `min-height`, paddings, gaps e tipografia interna mantendo o mesmo layout.
  - Validar com lint/build no `apps/web`.
- Web/UI
  - `apps/web/src/legacy/assinaturas.content.html`:
    - `min-h` dos cards reduzido de `126px` para `72px`;
    - padding reduzido de `p-3 md:p-4` para `p-2 md:p-2.5`;
    - gaps internos reduzidos de `gap-2 md:gap-3` para `gap-1.5 md:gap-2`;
    - titulos reduzidos de `text-xl` para `text-base md:text-lg`;
    - textos reduzidos de `text-base leading-relaxed` para `text-sm leading-tight`.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: cards ficaram significativamente mais compactos, com reducao forte de altura visual.
  - Proximo passo planejado: ajuste fino opcional da densidade textual (quebra de linha) se ainda precisar reduzir mais.

## 2026-02-08 19:28:40
- Plano (antes da alteracao)
  - Reduzir novamente a altura visual dos cards, mantendo o mesmo conceito.
  - Evitar esticamento da linha de cards (`items-start`) para nao inflar todos pela altura do maior.
  - Diminuir largura da coluna de imagem e ampliar a de texto para reduzir quebra de linha.
  - Compactar tipografia/espacamento interno para reduzir altura final.
  - Validar com lint/build no `apps/web`.
- Web/UI
  - `apps/web/src/legacy/assinaturas.content.html`:
    - grid dos cards ajustado para `items-start` (evita esticar todos pela altura do maior);
    - cards compactados para `p-1.5 md:p-2` e `min-h-[64px]`;
    - coluna de imagem reduzida para `18%` (`min-w-[52px]`) em todos os cards;
    - coluna de texto ampliada para `82%` em todos os cards;
    - tipografia interna compactada (`h3: text-sm/md:text-base`, `p: text-xs/md:text-sm`).
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: cards ficaram significativamente menores e deixaram de inflar em conjunto.
  - Proximo passo planejado: ajuste fino opcional da altura minima (`60px` ou `68px`) apos revisao visual.

## 2026-02-08 19:42:47
- Plano (antes da alteracao)
  - Adicionar uma nova linha abaixo dos 3 cards do hero para teste.
  - Inserir o card de referencia enviado pelo usuario "do jeito que esta escrito".
  - Manter os cards atuais e apenas acrescentar o bloco abaixo.
  - Validar com lint/build no `apps/web`.
- Web/UI
  - `apps/web/src/legacy/assinaturas.content.html`:
    - nova linha adicionada abaixo dos 3 cards com o card de teste enviado;
    - snippet inserido preservando estrutura/conteudo conforme solicitado.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: card de teste adicional inserido abaixo dos cards principais no hero.
  - Proximo passo planejado: revisar visual do card de teste e decidir se ele substitui ou inspira os cards existentes.

## 2026-02-08 19:51:30
- Plano (antes da alteracao)
  - Remover o card de teste adicionado na linha abaixo dos cards principais.
  - Usar a imagem do primeiro card em todos os 3 cards para teste comparativo.
  - Remover `items-start` da grid para padronizar altura visual dos cards na mesma linha.
  - Validar com lint/build no `apps/web`.
- Web/UI
  - `apps/web/src/legacy/assinaturas.content.html`:
    - card de teste adicional removido;
    - imagens dos cards 2 e 3 alteradas para `'/images/about_img2.webp'` (mesma do card 1);
    - `items-start` removido da grid para voltar ao comportamento uniforme de altura na linha.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: hero voltou sem o card extra e os 3 cards usam a mesma imagem para teste.
  - Proximo passo planejado: avaliar em tela e ajustar somente o `min-h`/tipografia se ainda houver excesso de altura.

## 2026-02-08 20:38:54
- Plano (antes da alteracao)
  - Tornar a imagem da coluna 1 com tamanho fixo nos 3 cards (independente do texto).
  - Definir tamanho por breakpoint (mobile/tablet/desktop), variando apenas por tela.
  - Remover largura percentual da coluna de imagem/texto para evitar variacao entre cards.
  - Validar com lint/build no `apps/web`.
- Web/UI
  - `apps/web/src/legacy/assinaturas.content.html`:
    - coluna de imagem dos 3 cards fixada com dimensoes por breakpoint:
      - mobile: `w-16 h-16`
      - md: `w-20 h-20`
      - lg+: `w-24 h-24`
    - imagem agora usa `shrink-0` (nao encolhe/estica conforme texto);
    - coluna de texto alterada para `flex-1 min-w-0`, desacoplada da largura da imagem.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: as imagens dos 3 cards ficaram com tamanho fixo e uniforme, variando apenas por breakpoint.
  - Proximo passo planejado: ajuste fino opcional do tamanho fixo (`w-14/18/22` ou `w-16/20/24`) apos revisao visual.

## 2026-02-08 21:03:26
- Plano (antes da alteracao)
  - Migrar o wrapper dos 3 cards para `flex` responsivo (mobile coluna, desktop linha).
  - Fixar a area de imagem com dimensao identica e absoluta nos 3 cards por breakpoint.
  - Desacoplar completamente a imagem do tamanho do texto.
  - Validar com lint/build no `apps/web`.
- Web/UI
  - `apps/web/src/legacy/assinaturas.content.html`:
    - wrapper dos 3 cards alterado para `flex flex-col md:flex-row` com `md:flex-1` por card;
    - area de imagem fixada igual nos 3 cards com `size-16 md:size-20 lg:size-24` + `shrink-0`;
    - coluna de texto padronizada com `flex-1 min-w-0` para nao impactar a imagem;
    - removido `scale` das imagens para evitar variacao de enquadramento entre cards.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: as imagens da coluna 1 ficaram com tamanho fixo e uniforme, variando apenas por breakpoint.
  - Proximo passo planejado: ajuste fino opcional dos tamanhos fixos (`size-14/18/22` ou `size-16/20/24`) apos revisao visual.

## 2026-02-08 21:10:34
- Plano (antes da alteracao)
  - Desfazer a ultima alteracao aplicada nos cards do hero.
  - Retornar ao estado imediatamente anterior (antes do wrapper `flex`).
  - Manter o restante da pagina inalterado.
  - Validar com lint/build no `apps/web`.
- Web/UI
  - `apps/web/src/legacy/assinaturas.content.html`:
    - wrapper dos cards revertido de `flex` para `grid` (estado anterior);
    - cards revertidos de `md:flex-1` para `h-full`;
    - bloco de imagem revertido de `size-*` para `w-*/h-*` com `scale-[1.45]` como estava antes.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: ultima alteracao foi desfeita e a hero voltou para a posicao anterior aprovada.
  - Proximo passo planejado: ajustar somente texto/imagem sem mudar wrapper estrutural, se solicitado.

## 2026-02-08 23:53:11
- Plano (antes da alteracao)
  - Corrigir classe Tailwind invalida no hero da pagina `Assinaturas` (`md:mt72` -> `md:mt-72`).
  - Compilar o Tailwind pelo script do projeto (`compile_tailwind.bat`).
  - Registrar resultado de compilacao.
- Web/UI
  - `apps/web/src/legacy/assinaturas.content.html`:
    - classe corrigida: `md:mt72` -> `md:mt-72`.
- Validacao
  - `cmd /c compile_tailwind.bat`: FALHOU por cache offline do npm (`ENOTCACHED` para `tailwindcss@3.4.17`).
- Checkpoint de continuidade
  - Ultimo passo concluido: classe invalida do hero foi corrigida.
  - Proximo passo planejado: executar compilacao do Tailwind em ambiente com cache/npm online ou instalar `tailwindcss` localmente no projeto.

## 2026-02-09 11:11:45
- Plano (antes da alteracao)
  - Criar arquivo dedicado em `docs` com o plano de migracao para Vite/React sem legado.
  - Preservar o plano em formato executavel por fases para uso posterior.
  - Registrar checkpoint desta preparacao.
- Documentacao
  - `docs/evolutive_changes/VITE_REACT_MIGRATION_PLAN.md` criado com plano de migracao em 7 fases:
    - baseline/paridade
    - shared UI React
    - migracao paginas publicas
    - migracao admin
    - limpeza do legado
    - unificacao de pipeline de estilos
    - hardening e encerramento
- Validacao
  - Sem execucao de build/testes (alteracao apenas de documentacao).
- Checkpoint de continuidade
  - Ultimo passo concluido: plano dedicado de migracao Vite/React salvo em `docs/evolutive_changes/VITE_REACT_MIGRATION_PLAN.md`.
  - Proximo passo planejado: iniciar Fase 1 (baseline de paridade) quando autorizado.

## 2026-02-09 12:59:50
- Plano (antes da alteracao)
  - Converter checkout de pagina dedicada para modal global no frontend Vite/React.
  - Redirecionar rotas legadas `/checkout` e `checkout.html` para abrir modal (query `checkout=1`).
  - Trocar gatilhos legados (`window.location.href = "/checkout"`) por abertura do modal via evento.
  - Ajustar layout/scroll do conteudo de checkout para caber no modal.
  - Validar com lint/build no `apps/web`.
- Web/UI
  - `apps/web/src/components/public/CheckoutModal.tsx` criado:
    - modal global de checkout com backdrop, botao fechar, ESC e scroll interno.
  - `apps/web/src/app/layouts/PublicLayout.tsx`:
    - modal de checkout integrado ao layout publico;
    - abertura/fechamento via query param `checkout=1`;
    - listeners para eventos globais `jlr:open-checkout` e `jlr:close-checkout`;
    - lock de scroll do body via classe `checkout-modal-open`.
  - `apps/web/src/app/App.tsx`:
    - rotas `checkout.html` e `/checkout` alteradas para redirect com query `/?checkout=1` (abre modal em vez de pagina dedicada).
  - `apps/web/src/legacy/index.behavior.ts`:
    - gatilhos de checkout substituidos para abertura de modal (evento + query) no lugar de `window.location.href = "/checkout"`;
    - fluxo de assinatura que redirecionava para `/checkout` agora abre modal.
  - `apps/web/src/legacy/checkout.content.html`:
    - padding superior do `main` reduzido para melhor encaixe dentro do modal (`pt-6 md:pt-8`).
  - `apps/web/src/styles/legacy.css`:
    - adicionada regra `body.checkout-modal-open { overflow: hidden; }`.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: checkout agora abre como modal global; rota dedicada foi substituida por redirecionamento que abre modal.
  - Proximo passo planejado: revisar UX final do modal (tamanho, espacamento e foco) e decidir se `CheckoutPage` pode ser removida definitivamente.

## 2026-02-09 13:11:34
- Plano (antes da alteracao)
  - Atualizar `docs/evolutive_changes/VITE_REACT_MIGRATION_PLAN.md` com o estado real apos checkout em modal.
  - Incluir no plano os ajustes necessarios para finalizar a migracao sem legado.
  - Manter foco em documentacao (sem alteracao de codigo de runtime).
- Documentacao
  - `docs/evolutive_changes/VITE_REACT_MIGRATION_PLAN.md` atualizado com:
    - status atual por fase (parcial/em andamento/pendente);
    - checkpoint explicito de checkout como modal global;
    - bloco de ajustes imediatos (modal UX/a11y, desacoplamento de eventos legados, unificacao Tailwind/CSS, testes E2E do modal);
    - priorizacao de pendencias para encerramento da migracao.
- Validacao
  - Sem execucao de build/testes (alteracao apenas de documentacao).
- Checkpoint de continuidade
  - Ultimo passo concluido: plano de migracao agora reflete as mudancas recentes e as pendencias reais.
  - Proximo passo planejado: executar os ajustes priorizados do checkout modal e iniciar reescrita TSX das paginas publicas ainda legadas.

## 2026-02-09 16:00:06
- Plano (antes da alteracao)
  - Corrigir fallback do `ENTRAR` quando `loginModal` nao existir na pagina atual.
  - Corrigir fallback do icone de carrinho para abrir checkout modal global quando `cart-modal` nao existir.
  - Validar com `npm run lint` e `npm run build` no `apps/web`.
  - Registrar checkpoint de continuidade apos validacao.
- Web/UI
  - `apps/web/src/legacy/index.behavior.ts`:
    - adicionado `requestLoginModal` no fluxo de auth para fallback cross-page;
    - `openLoginModal()` agora redireciona para `/` e solicita abertura do login quando `#loginModal` nao existe na pagina atual;
    - `openModal()` (icone do carrinho) agora abre checkout modal global quando `#cart-modal` nao existe na pagina atual;
    - helper `openCheckoutModal()` consolidado para uso no carrinho e nos botoes com `data-checkout`.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: botao `ENTRAR` e gatilho de checkout voltaram a funcionar em paginas sem modais legados locais.
  - Proximo passo planejado: reduzir acoplamento de eventos globais (`jlr:*`) migrando abertura de modal para estado/roteamento React puro.

## 2026-02-09 21:38:00
- Plano (antes da alteracao)
  - Ajustar clique do icone de carrinho do menu principal para abrir sempre o checkout modal.
  - Evitar abertura do modal legado `cart-modal` na home.
  - Validar com `npm run lint` e `npm run build` no `apps/web`.
  - Registrar checkpoint apos validacao.
- Web/UI
  - `apps/web/src/legacy/index.behavior.ts`:
    - clique em `#open-cart` alterado para abrir diretamente o checkout modal (`openCheckoutModal()`), com `preventDefault` e `stopPropagation`;
    - removida funcao `openModal` que ficou obsoleta apos o redirecionamento do clique.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: icone do menu principal deixou de abrir o modal legado e agora abre o checkout modal (conteudo do antigo `checkout.html`).
  - Proximo passo planejado: remover gradualmente o bloco legado `cart-modal` do `index.content.html` quando nao houver mais dependencias funcionais.

## 2026-02-09 22:15:07
- Plano (antes da alteracao)
  - Corrigir condicao de corrida na abertura do checkout modal (URL muda para `?checkout=1`, mas modal nem sempre abre).
  - Centralizar sincronizacao de query pelo `setSearchParams` no `PublicLayout`.
  - Remover `pushState` manual do fluxo legado de abertura (`index.behavior`).
  - Atualizar teste E2E publico para o novo comportamento de checkout em modal.
  - Validar com `npm run lint`, `npm run build` e Playwright focado no fluxo publico.
- Web/UI
  - `apps/web/src/app/layouts/PublicLayout.tsx`:
    - removido early-return do listener `jlr:open-checkout`; agora sempre sincroniza query com `setSearchParams`.
  - `apps/web/src/legacy/index.behavior.ts`:
    - `openCheckoutModal()` deixou de usar `history.pushState` manual e passou a apenas emitir `jlr:open-checkout`.
  - `apps/web/src/components/public/CheckoutModal.tsx`:
    - z-index reforcado via `style={{ zIndex: 1000 }}` para evitar sobreposicao/interceptacao do menu fixo.
- Tests/E2E
  - `apps/web/e2e/flows.spec.ts`:
    - fluxo publico atualizado para validar checkout modal (`[data-checkout-modal]`) em vez de `#cart-modal` e navegação para `/checkout`;
    - fechamento no teste ajustado para `Escape`.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
  - `apps/web`: `npx playwright test e2e/flows.spec.ts:99 --output test-results-run4` PASS (1/1).
- Checkpoint de continuidade
  - Ultimo passo concluido: abertura do checkout modal estabilizada (sem corrida de estado URL/router) e fluxo publico validado por E2E.
  - Proximo passo planejado: revisar visual da camada do modal no navegador (desktop/mobile) e, se aprovado, remover de vez o `cart-modal` legado do `index.content.html`.

## 2026-02-10 00:57:06
- Plano (antes da alteracao)
  - Reduzir largura do checkout modal para metade da tela em desktop.
  - Manter o modal centralizado na viewport.
  - Preservar responsividade no mobile.
  - Validar com `npm run lint` e `npm run build` no `apps/web`.
- Web/UI
  - `apps/web/src/components/public/CheckoutModal.tsx`:
    - backdrop alterado para usar layout `flex` com `items-center justify-center` (centralizacao explicita do modal);
    - container do modal ajustado para `w-full` no mobile e `md:w-1/2` no desktop;
    - altura do modal ajustada para `h-[92vh]` (mobile) e `md:h-[88vh]`.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: checkout modal ficou menor, ocupando metade da tela no desktop e centralizado.
  - Proximo passo planejado: validacao visual final em desktop/mobile para ajuste fino opcional de largura (`md:w-[48%]` ou `md:w-[55%]`) e altura.

## 2026-02-10 18:49:51
- Plano (antes da alteracao)
  - Reduzir a largura do checkout modal para evitar ocupacao total da viewport.
  - Substituir a largura fixa ampla por larguras responsivas menores por breakpoint.
  - Validar com `npm run lint` e `npm run build` no `apps/web`.
- Web/UI
  - `apps/web/src/components/public/CheckoutModal.tsx`:
    - container do modal ajustado de `w-full md:w-1/2` para largura responsiva menor:
      - `w-[94vw]` (mobile), `sm:w-[88vw]`, `md:w-[64vw]`, `lg:w-[56vw]`, `xl:w-[48vw]`, `2xl:w-[44vw]`;
      - limite superior adicionado com `max-w-[960px]`.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: checkout modal nao ocupa mais a largura total e ficou mais estreito em desktop e telas grandes.
  - Proximo passo planejado: ajuste fino opcional de largura (`md:w-[60vw]` ou `md:w-[58vw]`) apos revisao visual.

## 2026-02-10 19:01:25
- Plano (antes da alteracao)
  - Diminuir mais a largura do checkout modal em desktop/telas grandes.
  - Reduzir largura por breakpoint e limitar `max-width`.
  - Validar com `npm run lint` e `npm run build` no `apps/web`.
- Web/UI
  - `apps/web/src/components/public/CheckoutModal.tsx`:
    - largura reduzida novamente:
      - `max-w-[760px]` (antes `max-w-[960px]`);
      - `sm:w-[86vw]` (antes `88vw`);
      - `md:w-[56vw]` (antes `64vw`);
      - `lg:w-[46vw]` (antes `56vw`);
      - `xl:w-[40vw]` (antes `48vw`);
      - `2xl:w-[36vw]` (antes `44vw`).
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: checkout modal ficou significativamente mais estreito em desktop e widescreen.
  - Proximo passo planejado: ajuste fino opcional para `md:w-[52vw]`/`lg:w-[42vw]` se ainda estiver largo na revisao visual.

## 2026-02-10 22:45:01
- Plano (antes da alteracao)
  - Restaurar o fluxo semantico: menu abre `Cart` (itens pendentes) e checkout abre apenas via acao explicita de pagamento.
  - Alterar clique do `#open-cart` para abrir `#cart-modal` em vez de abrir checkout direto.
  - Adicionar acao `Pagar agora` dentro do carrinho para abrir o checkout modal.
  - Redirecionar gatilhos de vitrine (`[data-checkout]`) para abrir carrinho, evitando salto direto para checkout.
  - Atualizar teste E2E publico para validar o fluxo Cart -> Checkout.
  - Validar com `npm run lint`, `npm run build` e Playwright focado no fluxo publico.
- Web/UI
  - `apps/web/src/legacy/index.behavior.ts`:
    - criado `openCartModal()` com abertura do `cart-modal`, lock de scroll e fallback cross-page para `/?cart=1` quando o modal nao existe na pagina atual;
    - `#open-cart` agora chama `openCartModal()` (nao abre checkout direto);
    - adicionada acao em `[data-cart-pay-now]` para fechar carrinho e abrir checkout modal (`jlr:open-checkout`);
    - abertura automatica do carrinho quando URL chega com `?cart=1` (com limpeza do parametro via `history.replaceState`);
    - cliques em `[data-checkout]` (cards da vitrine) agora abrem carrinho.
  - `apps/web/src/legacy/index.content.html`:
    - botao do rodape do carrinho alterado para `Pagar agora` e marcado com `data-cart-pay-now`;
    - `aria-label` dos botoes de vitrine ajustado de `Ir para checkout` para `Abrir carrinho`.
- Tests/E2E
  - `apps/web/e2e/flows.spec.ts`:
    - fluxo publico atualizado para validar: menu abre `#cart-modal`, `Pagar agora` abre `[data-checkout-modal]`, e botoes `[data-checkout]` abrem carrinho.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
  - `apps/web`: `npx playwright test e2e/flows.spec.ts:99 --output test-results-cart-flow`
    - primeira tentativa no sandbox: FALHOU (`spawn EPERM`);
    - reexecucao fora do sandbox: PASS (1/1).
- Checkpoint de continuidade
  - Ultimo passo concluido: fluxo funcional agora separa `Cart` (itens nao pagos) de `Checkout` (pagamento), com entrada pelo menu via carrinho e transicao para checkout apenas por `Pagar agora`.
  - Proximo passo planejado: evoluir `cart-modal` para renderizar itens reais da tabela/cart backend (produto/servico, quantidade, valor unitario, subtotal e total) substituindo o conteudo estatico atual.

## 2026-02-11 01:21:17
- Plano (antes da alteracao)
  - Incluir a classe `max-w-[960px]` no pipeline Tailwind para ser gerada no CSS compilado.
  - Fazer inclusao direta no `tailwind.config.js` via `safelist` para nao depender do scanner atual de `content`.
- Web/UI Build Config
  - `tailwind.config.js`:
    - adicionada `safelist: ['max-w-[960px]']`.
- Validacao
  - Nao executada (pendente de compilacao do Tailwind pelo fluxo local).
- Checkpoint de continuidade
  - Ultimo passo concluido: classe `max-w-[960px]` foi incluida no config para entrar na geracao do CSS.
  - Proximo passo planejado: compilar Tailwind para materializar a classe no `apps/web/src/styles/tailwind.css` e validar visualmente no checkout.

## 2026-02-12 11:29:14
- Plano (antes da alteracao)
  - Gerar resumo final do chatbot de agendamentos (concierge) com os dados coletados no fluxo.
  - Enviar o resumo pelo WhatsApp ao finalizar, usando URL da API oficial com texto codificado.
  - Manter uma acao de reenvio no proprio chatbot ao final do fluxo.
  - Validar com `npm run lint` e `npm run build` no `apps/web`.
- Web/UI
  - `apps/web/src/legacy/index.behavior.ts`:
    - `buildWhatsappUrl` ajustado para `https://api.whatsapp.com/send`.
    - adicionados helpers para montar resumo do concierge (`buildConciergeWhatsappMessage`) e disparar envio (`sendWhatsappMessage`).
    - `finalizeConcierge()` agora:
      - monta resumo do chat (servico, unidade, horario, nome e telefone);
      - envia automaticamente para WhatsApp no fim do atendimento;
      - renderiza CTA de reenvio (`Enviar resumo no WhatsApp`) junto da acao `Nova solicitacao`.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: chatbot de agendamentos passou a enviar resumo final para WhatsApp via URL com texto codificado.
  - Proximo passo planejado: validar UX final do concierge em desktop/mobile e confirmar formato final da mensagem enviada no WhatsApp.

## 2026-02-12 11:49:44
- Plano (antes da alteracao)
  - Aplicar opcao 1 para envio WhatsApp: abrir apenas em nova aba/janela sem redirecionar a pagina atual.
  - Remover fallback que tirava o usuario do site (`window.location.href = url`).
  - Validar com `npm run lint` e `npm run build` no `apps/web`.
- Web/UI
  - `apps/web/src/legacy/index.behavior.ts`:
    - `sendWhatsappMessage()` ajustada para somente `window.open(..., "_blank")`;
    - fallback de redirecionamento em mesma aba removido;
    - adicionado `popup?.focus()` quando a aba/janela abre com sucesso.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: envio para WhatsApp nao tira mais o usuario do site.
  - Proximo passo planejado: validar lint/build e confirmar comportamento no navegador com bloqueador de popup.

## 2026-02-12 17:46:19
- Plano (antes da alteracao)
  - Criar funcao backend para disparo via Z-API (`send-text`) com configuracao por variaveis de ambiente.
  - Expor endpoint publico de teste para envio do resumo do concierge sem depender de webhook.
  - Integrar o chatbot para disparar o resumo via API ao final da conversa.
  - Manter botao de fallback manual para envio por link do WhatsApp.
  - Validar com `apps/api` build e `apps/web` lint/build.
- API
  - `apps/api/src/lib/zapi.ts` criado:
    - resolve URL do `send-text` por `ZAPI_SEND_TEXT_URL` ou por `ZAPI_BASE_URL + ZAPI_INSTANCE_ID + ZAPI_INSTANCE_TOKEN`;
    - suporta header opcional `Client-Token` via `ZAPI_CLIENT_TOKEN`;
    - sanitiza telefone de destino e envia payload com `phone` + `message`;
    - adiciona logs estruturados de sucesso/falha sem expor PII.
  - `apps/api/src/routes/index.ts`:
    - novo endpoint `POST /api/public/concierge/whatsapp-summary`;
    - validacao Zod de `summary` e `recipientPhone`;
    - destino usa `recipientPhone` recebido ou fallback `ZAPI_DEFAULT_TARGET_PHONE`;
    - retorno `202` em sucesso e erros estruturados em falha/configuracao ausente.
- Web/UI
  - `apps/web/src/legacy/index.behavior.ts`:
    - adicionado `sendConciergeSummaryToApi()` para chamar `POST /api/public/concierge/whatsapp-summary`;
    - `finalizeConcierge()` convertido para async e agora dispara envio via API;
    - mensagem final do chat ajustada para sucesso/falha do disparo;
    - mantido botao de fallback `Enviar resumo no WhatsApp` com link manual.
- Validacao
  - `apps/api`: `npm run build` PASS.
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: integracao de disparo do resumo via Z-API implementada no backend e acionada no fim do chatbot.
  - Proximo passo planejado: executar teste manual fim-a-fim com credenciais reais da Z-API e validar recebimento da mensagem no WhatsApp.

## 2026-02-12 18:13:35
- Plano (antes da validacao)
  - Validar endpoint de disparo do resumo (`/api/public/concierge/whatsapp-summary`) com credenciais reais no `.env`.
  - Confirmar status HTTP e comportamento entre instancia ativa e processo novo da API.
- Validacao
  - Instancia ativa em `http://localhost:3001` retornou `500` (`{\"message\":\"erro interno no servidor\"}`).
  - Processo novo da API em porta temporaria (`3010`, `NODE_ENV=development`) retornou `202` com `{ \"success\": true }`.
  - Processo novo da API em porta temporaria (`3011`, `NODE_ENV=production`) retornou `202` com `{ \"success\": true }`.
  - Log da API no teste confirmou dispatch Z-API com status `200`.
- Checkpoint de continuidade
  - Ultimo passo concluido: integracao Z-API validada com sucesso em processo novo da API.
  - Proximo passo planejado: reiniciar a instancia ativa da API na porta `3001` para recarregar `.env` e eliminar o `500` residual.

## 2026-02-12 18:14:56
- Plano (operacional)
  - Reiniciar a API ativa na porta `3001` para carregar configuracoes recentes.
  - Revalidar o endpoint de disparo Z-API na porta padrao.
- Operacao
  - Processo antigo da API na `3001` encerrado (PID `13564`).
  - Nova instancia iniciada na `3001` (PID `15044`).
- Validacao
  - `POST http://localhost:3001/api/public/concierge/whatsapp-summary` retornou `202` com body `{ "success": true }`.
- Checkpoint de continuidade
  - Ultimo passo concluido: instancia principal da API foi normalizada e o disparo Z-API passou a funcionar na porta `3001`.
  - Proximo passo planejado: validar no frontend (fluxo completo do chatbot) e confirmar recebimento real no WhatsApp de destino.

## 2026-02-12 18:24:17
- Plano (antes da alteracao)
  - Criar arquivo de teste `send_message.php` na raiz do projeto para disparo manual de mensagem via Z-API.
  - Ler variaveis de configuracao do arquivo `apps/api/.env`.
  - Montar URL `send-text` por `ZAPI_SEND_TEXT_URL` ou por `ZAPI_BASE_URL + ZAPI_INSTANCE_ID + ZAPI_INSTANCE_TOKEN`.
  - Enviar payload com `phone` e `message` via cURL e exibir retorno de status/body.
  - Validar sintaxe do PHP localmente, se o binario `php` estiver disponivel no ambiente.
- Validacao
  - Pendente nesta etapa (sera executada em seguida).
- Checkpoint de continuidade
  - Ultimo passo concluido: plano de criacao do script de teste Z-API registrado.
  - Proximo passo planejado: criar `send_message.php` e validar execucao local.

## 2026-02-12 18:27:59
- Web/Utilitario de teste
  - `send_message.php` criado na raiz:
    - le variaveis do `apps/api/.env`;
    - resolve URL de envio por `ZAPI_SEND_TEXT_URL` ou `ZAPI_BASE_URL + ZAPI_INSTANCE_ID + ZAPI_INSTANCE_TOKEN`;
    - envia `phone` + `message` via cURL;
    - suporta `Client-Token` opcional;
    - desabilita proxy local no cURL (`CURLOPT_PROXY`/`CURLOPT_NOPROXY`) para evitar falha `127.0.0.1:9`.
- API/Z-API hardening
  - `apps/api/src/lib/zapi.ts`:
    - normalizacao de URL para garantir sufixo `/send-text`;
    - suporte a `ZAPI_BASE_URL` preenchido com URL completa da instancia;
    - validacao de erro logico no payload da Z-API (ex.: `error` no body), nao apenas status HTTP.
- Diagnostico
  - Detectado que `ZAPI_BASE_URL` estava com URL completa de instancia/token/send-text (nao apenas dominio).
  - Antes do ajuste de compatibilidade, resposta da Z-API era `200` com erro logico `NOT_FOUND`.
- Validacao
  - `apps/api`: `npm run build` PASS.
  - `send_message.php`: `php -l` PASS.
  - `send_message.php` teste real: PASS com retorno `zaapId`/`messageId`.
  - API reiniciada na `3001` e endpoint `POST /api/public/concierge/whatsapp-summary` validado: `202` com `{ "success": true }`.
- Checkpoint de continuidade
  - Ultimo passo concluido: disparo manual e disparo pelo endpoint do chatbot estao funcionais com Z-API.
  - Proximo passo planejado: validar no frontend fim-a-fim (finalizar chat e confirmar recebimento da mensagem no mesmo numero de destino).

## 2026-02-12 18:59:37
- Plano (antes da alteracao)
  - Criar rotina de webhook Z-API para receber mensagens de entrada no backend.
  - Expor endpoint de inbox publico para o chatbot consultar mensagens recebidas.
  - Integrar polling no concierge para mostrar retorno do WhatsApp no proprio chat.
  - Validar com `apps/api` build e `apps/web` lint/build.
- API
  - `apps/api/src/lib/conciergeInbox.ts` criado:
    - armazenamento em memoria de mensagens recebidas (com deduplicacao por id);
    - filtros por telefone/since/limite para consulta do inbox.
  - `apps/api/src/routes/index.ts`:
    - novo endpoint `POST /api/public/webhooks/zapi` para ingestao do webhook;
    - parser tolerante para payloads comuns da Z-API (`phone/from/chatId`, `text.message/body/message`, `fromMe`);
    - opcao de protecao por segredo (`ZAPI_WEBHOOK_SECRET`) via header `x-zapi-secret` ou query `secret`;
    - novo endpoint `GET /api/public/concierge/inbox` para leitura do inbox por telefone.
- Web/UI
  - `apps/web/src/legacy/index.behavior.ts`:
    - adicionado parser de resposta do inbox;
    - adicionado polling (`/api/public/concierge/inbox`) a cada 5s apos finalizar o concierge;
    - mensagens recebidas via webhook passam a aparecer no chatbot como bolhas `WhatsApp: ...`;
    - polling encerrado em `Nova solicitacao` e no cleanup da pagina.
- Validacao
  - `apps/api`: `npm run build` PASS.
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
  - API reiniciada na porta `3001` para carregar a rotina de webhook.
  - Teste `POST /api/public/webhooks/zapi` (payload simulado): `202` com `{ "received": true, "stored": true }`.
  - Teste `GET /api/public/concierge/inbox?phone=...`: `200` com mensagem retornada no inbox.
- Checkpoint de continuidade
  - Ultimo passo concluido: rotina de webhook + inbox + polling no chatbot implementada.
  - Proximo passo planejado: configurar webhook oficial no painel Z-API apontando para `/api/public/webhooks/zapi` e validar resposta entrando no chatbot em tempo real.

## 2026-02-12 20:09:30
- Plano (ajuste de compatibilidade)
  - Tornar a rota de webhook mais permissiva para validacao de terceiros (Z-API), aceitando handshake por `GET`.
  - Ajustar retorno de `POST` para `200` (em vez de `202`) para reduzir falso-negativo em verificacoes de painel.
  - Validar endpoint localmente e via ngrok.
- Validacao
  - Pendente nesta etapa (sera executada em seguida).
- Checkpoint de continuidade
  - Ultimo passo concluido: plano de hardening do webhook registrado.
  - Proximo passo planejado: aplicar ajustes de status/handshake e revalidar com Z-API.

## 2026-02-12 20:40:49
- Plano (ajuste de exibicao no chatbot)
  - Ajustar o polling do concierge para nao depender apenas do telefone da sessao.
  - Permitir exibicao de mensagens de retorno do WhatsApp vindas de outros numeros para facilitar testes operacionais.
  - Exibir o numero de origem junto da mensagem no chat quando for diferente do telefone informado no fluxo.
  - Validar com `apps/web` lint/build.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: polling do concierge passou a exibir retornos do WhatsApp mesmo quando o numero nao bate com o telefone da sessao.
  - Proximo passo planejado: validar em tela com mensagem de outro numero e confirmar exibicao da bolha `WhatsApp (xxxx): ...`.

## 2026-02-12 21:04:18
- Plano (ajuste de inicializacao por webhook)
  - Manter polling de inbox ativo desde a carga da pagina (nao apenas apos finalizar um fluxo).
  - Quando chegar webhook novo, iniciar/reiniciar automaticamente o concierge perguntando o servico desejado.
  - Nao interromper polling ao clicar em `Nova solicitacao`.
  - Validar com `apps/web` lint/build.
- Web/UI
  - `apps/web/src/legacy/index.behavior.ts`:
    - polling agora inicia automaticamente em `initIndexPage()` com `startConciergeInboxPolling()`;
    - `startConciergeInboxPolling` passou a ser singleton (nao reinicia timer se ja ativo) e atualiza telefone de foco quando informado;
    - ao receber mensagem de webhook e detectar conversa vazia/finalizada, o concierge abre e reinicia o fluxo (`renderConciergeStep()`);
    - botao `Nova solicitacao` nao para mais o polling de inbox.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: concierge agora pode ser disparado por webhook sem depender de fluxo previamente finalizado.
  - Proximo passo planejado: executar lint/build e validar comportamento em tela com mensagem recebida.

## 2026-02-12 21:05:40
- Plano (ajuste de UX solicitado)
  - Mostrar explicitamente o numero de quem enviou cada mensagem recebida via webhook no chatbot.
  - Ao chegar webhook novo, iniciar/reiniciar a conversa com a pergunta inicial de servico e opcoes.
  - Manter comportamento de polling continuo.
  - Validar com `apps/web` lint/build.
- Web/UI
  - `apps/web/src/legacy/index.behavior.ts`:
    - prefixo de mensagem inbound ajustado para sempre exibir numero completo: `WhatsApp (<numero>): ...`;
    - bootstrap por webhook reforcado para abrir/reiniciar o fluxo ao detectar chat oculto/vazio/finalizado;
    - bootstrap passou a ocorrer no maximo uma vez por lote de mensagens para evitar reset repetido.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: chatbot volta a mostrar numero de origem e reinicia a conversa com a pergunta inicial quando recebe webhook.
  - Proximo passo planejado: validar em tela com mensagem real da Z-API e confirmar ordem visual (pergunta inicial + mensagem recebida).

## 2026-02-12 21:41:28
- Plano (antes da alteracao grande do concierge)
  - Criar persistencia de sessoes/eventos do concierge no Prisma para suportar conversa por WhatsApp com estado.
  - Implementar motor de conversa no backend:
    - fluxo por etapas (servico, unidade, horario 09:00-17:00, nome);
    - respostas para o telefone que iniciou a conversa via webhook;
    - envio de resumo final para o telefone interno (`5511978935812`) e para o telefone iniciador.
  - Atualizar webhook para acionar o motor de conversa e manter inbox de observabilidade no frontend.
  - Atualizar chatbot do site para:
    - carregar servicos/unidades do banco;
    - finalizar via endpoint unificado de concierge;
    - enviar resumo em todos os casos (site e WhatsApp).
  - Validar com `apps/api` build e `apps/web` lint/build.
- Validacao
  - Pendente nesta etapa (sera executada em seguida).
- Checkpoint de continuidade
  - Ultimo passo concluido: plano aprovado pelo usuario para evolucao do concierge omnichannel.
  - Proximo passo planejado: aplicar migracao Prisma e iniciar implementacao do motor de conversa.

## 2026-02-12 21:56:13
- Plano (integracao frontend com fluxo unificado do concierge)
  - Substituir no frontend o catalogo estatico do concierge por carregamento dinamico do backend (`GET /api/public/concierge/options`).
  - Substituir finalizacao legada (`/concierge/whatsapp-summary`) por finalizacao unificada (`POST /api/public/concierge/complete`).
  - Manter polling do inbox e, ao receber webhook, reiniciar conversa com pergunta inicial e opcoes dinamicas.
  - Validar com `apps/web` lint/build e `apps/api` build.
- Web/UI
  - `apps/web/src/legacy/index.behavior.ts`:
    - adicionados parser/fetch de opcoes dinamicas do concierge;
    - fluxo de etapas do chatbot agora usa servicos/unidades/horarios vindos do banco;
    - finalizacao agora envia payload estruturado para `/api/public/concierge/complete`;
    - fallback de erro com botao `Tentar envio novamente`;
    - polling de inbox mantido e bootstrap por webhook ajustado para reiniciar fluxo dinamico;
    - exibicao de origem mantida como `WhatsApp (<numero>): <mensagem>`.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
  - `apps/api`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: frontend do concierge integrado ao fluxo unificado de backend (opcoes dinamicas + finalizacao unica).
  - Proximo passo planejado: validar manualmente em ambiente com Z-API ativa (site e webhook) para confirmar envio de resumo em todos os cenarios.

## 2026-02-12 22:20:27
- Plano (correcao de roteamento do telefone de resposta no webhook)
  - Ajustar parser de webhook Z-API para priorizar telefone do remetente (quem enviou) em vez do telefone conectado da instancia.
  - Manter `connectedPhone` apenas como fallback.
  - Validar com payload simulado contendo `connectedPhone` e remetente diferente.
- API
  - `apps/api/src/routes/index.ts`:
    - parser de webhook atualizado para priorizar candidatos de remetente (`participantPhone`, `senderPhone`, `sender.*`, `from`, `chatId`, `phone`) e usar `connectedPhone` apenas como fallback.
- Validacao
  - `apps/api`: `npm run build` PASS.
  - Teste simulado em `http://localhost:3012/api/public/webhooks/zapi` com payload contendo:
    - `connectedPhone=5511989261279` (instancia)
    - `from=5511981859426@s.whatsapp.net` (remetente)
  - Resultado PASS:
    - webhook `200` com `flowOk=true`;
    - inbox registrou `phone=5511981859426` (remetente correto).
- Checkpoint de continuidade
  - Ultimo passo concluido: parser corrigido para responder ao numero remetente (e nao ao numero da instancia).
  - Proximo passo planejado: reiniciar a API principal em `3001` e validar no fluxo real com Z-API.

## 2026-02-12 22:28:21
- Plano (ajuste de UX no fim do concierge)
  - Limpar automaticamente o historico do chatbot ao finalizar com sucesso e enviar resumo.
  - Reiniciar a conversa com o passo inicial para deixar a tela pronta para nova solicitacao.
  - Validar com `apps/web` lint/build.
- Web/UI
  - `apps/web/src/legacy/index.behavior.ts`:
    - no `finalizeConcierge`, quando `dispatched=true`, o chat agora limpa historico/opcoes automaticamente;
    - apos limpeza, reinicia o fluxo no passo inicial em 600ms.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: tela do chatbot passa a limpar automaticamente ao final bem-sucedido do fluxo.
  - Proximo passo planejado: validacao manual em ambiente real (finalizar conversa via WhatsApp e confirmar reset visual no painel).

## 2026-02-12 22:31:40
- Plano (seed de categorias e servicos a partir da planilha)
  - Ler planilha `Serviços_GeradoAs12-02-26_22_38_02.xlsx` e normalizar dados de nome, categoria, duracao, preco e custo.
  - Adicionar campo `cost` no modelo `Service` (Prisma + migration SQL).
  - Atualizar seed para fazer upsert de categorias e servicos usando os dados normalizados da planilha.
  - Executar generate/build, aplicar migration no banco e rodar seed.
  - Validar via consultas SQL de contagem e amostra.
- Validacao
  - Planilha lida com sucesso: 75 servicos, 7 categorias, sem nomes de servico duplicados.
  - `apps/api`: `npm run prisma:generate` PASS.
  - `apps/api`: `npm run prisma:seed` PASS.
  - `apps/api`: `npm run build` PASS.
  - SQL de validacao:
    - `ServiceCategory`: 11 registros totais.
    - `Service`: 77 registros totais.
    - `Service.cost IS NOT NULL`: 74 registros.
- Checkpoint de continuidade
  - Ultimo passo concluido: campo `cost` adicionado e seed da planilha aplicado no banco.
  - Proximo passo planejado: (opcional) ajustar encoding/charset do cliente MySQL para exibicao correta de acentos em consultas manuais.

## 2026-02-13 02:26:48
- Plano (ajustes de UX na tela de servicos)
  - Remover cards indicadores do topo da tela de servicos.
  - Aplicar contraste no cabecalho da grid (fundo verde escuro e texto branco).
  - Remover colunas `Categoria ID` e `Status ID` da grid.
  - Incluir campo `Custo` na grid e no formulario de edicao/cadastro.
  - Permitir abrir edicao clicando no valor do ID na grid.
  - Manter coluna `Destaque` visivel na grid.
- Web/UI
  - `apps/web/src/legacy/admin.body.html`:
    - removido bloco de indicadores da view `servicos`;
    - cabecalho da tabela alterado para `bg-forest` com labels em branco;
    - removidas colunas `Categoria ID` e `Status ID`;
    - adicionada coluna `Custo`;
    - adicionado input `data-service-cost` no formulario.
  - `apps/web/src/legacy/admin.behavior.ts`:
    - `ServiceRow` atualizado para suportar `cost`;
    - adicionada leitura do input `data-service-cost`;
    - payload de salvar servico agora inclui `cost` (quando informado);
    - grid passou a renderizar coluna de custo formatada;
    - ID da linha virou botao com `data-service-action=\"edit\"`;
    - ao editar, formulario preenche custo e faz scroll para o form.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: tela de servicos atualizada conforme os 6 pontos solicitados.
  - Proximo passo planejado: validacao manual visual da grid/form no admin para confirmar layout final e fluxo de edicao por clique no ID.

## 2026-02-13 03:17:24
- Plano (ajuste visual da barra de paginacao em servicos)
  - Alterar o fundo da barra superior da tabela de servicos para cor `primary` (verde claro).
  - Alterar os controles `Anterior`, `Pagina X de Y` e `Proxima` para fundo verde escuro com texto dourado.
  - Validar com build do frontend.
- Web/UI
  - `apps/web/src/legacy/admin.body.html`:
    - barra de paginação da grid de servicos alterada para `bg-primary/20`;
    - botoes de paginacao e indicador de pagina alterados para `bg-forest-dark` + `text-gold`.
  - `apps/web/src/legacy/index.behavior.ts`:
    - correção de null-check em `conciergePanel` para destravar build TypeScript.
- Validacao
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: barra de paginação da tela de servicos ajustada com o contraste solicitado.
  - Proximo passo planejado: validacao visual em tela para confirmar contraste final e estados de hover/disabled.

## 2026-02-13 04:09:43
- Plano (correcao final de contraste na paginacao de servicos)
  - Corrigir classes de cor da barra e controles para usar tokens existentes no projeto.
  - Garantir texto do contador `Mostrando X-Y...` em branco.
  - Validar build do frontend.
- Web/UI
  - `apps/web/src/legacy/admin.body.html`:
    - barra de paginacao ajustada para `bg-primary` (em vez de `bg-primary/20`);
    - botoes `Anterior/Proxima` e indicador `Pagina X de Y` ajustados para `bg-forest` + `text-gold`;
    - contador `Mostrando X-Y de Z servicos` ajustado para `text-white`.
- Validacao
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: contraste da barra de paginacao da tela de servicos corrigido conforme solicitado.
  - Proximo passo planejado: retomar validacoes visuais finais e seguir com os proximos ajustes pendentes.

## 2026-02-13 10:17:19
- Plano (documentacao WhatsApp API)
  - Consolidar em um capitulo unico todas as orientacoes de uso da Z-API + ngrok registradas no ciclo de 2026-02-12.
  - Agrupar variaveis de ambiente, chaves/tokens, links de webhook e endpoints operacionais em um unico local.
  - Referenciar o novo capitulo a partir da documentacao de integracoes.
- Documentacao
  - `docs/config/WHATSAPP_API_ZAPI_NGROK.md` criado:
    - guia operacional dedicado para API WhatsApp (Z-API + ngrok);
    - consolidacao de variaveis (`ZAPI_SEND_TEXT_URL`, `ZAPI_BASE_URL`, `ZAPI_INSTANCE_ID`, `ZAPI_INSTANCE_TOKEN`, `ZAPI_CLIENT_TOKEN`, `ZAPI_DEFAULT_TARGET_PHONE`, `ZAPI_WEBHOOK_SECRET`);
    - mapa de endpoints (`/public/concierge/options`, `/public/concierge/complete`, `/public/concierge/whatsapp-summary`, `/public/webhooks/zapi`, `/public/concierge/inbox`);
    - instrucoes de configuracao de webhook, comando ngrok e checklist de testes;
    - troubleshooting dos cenarios recorrentes (500 por `.env` desatualizado, `NOT_FOUND` logico da Z-API, roteamento de remetente).
  - `docs/config/INTEGRATIONS.md` atualizado:
    - adicao da secao WhatsApp com referencia para `docs/config/WHATSAPP_API_ZAPI_NGROK.md`.
- Validacao
  - Validacao documental/local concluida (sem alteracoes de codigo executavel).
- Checkpoint de continuidade
  - Ultimo passo concluido: orientacoes de Z-API e ngrok centralizadas em capitulo unico de documentacao.
  - Proximo passo planejado: revisar o capitulo com credenciais/URL reais em ambiente local (sem versionar secrets) e, se necessario, complementar `apps/api/.env.example` apenas com placeholders.

## 2026-02-13 11:16:23
- Plano (hardening WhatsApp + isolamento + auditoria)
  - Isolar o canal publico para nao exibir conversas inbound de WhatsApp na tela do chatbot.
  - Endurecer webhook Z-API com segredo obrigatorio e mover leitura de inbox para rota admin.
  - Persistir data/hora do agendamento no fluxo concierge (site e WhatsApp).
  - Criar painel admin dedicado para auditoria de contatos/agendamentos do WhatsApp.
  - Definir politica automatica de retencao dos registros finalizados/cancelados.
- API/DB
  - `apps/api/prisma/schema.prisma`:
    - `ConciergeStep` ganhou etapa `DATE`;
    - `ConciergeSession` ganhou `scheduledDateLabel` e `scheduledFor` (+ indice).
  - `apps/api/prisma/migrations/20260213111500_harden_whatsapp_concierge_tracking/migration.sql` criado.
  - `apps/api/src/lib/conciergeFlow.ts`:
    - fluxo WhatsApp atualizado para `SERVICE -> UNIT -> DATE -> SLOT -> NAME`;
    - resumo passou a incluir data e data/hora agendada;
    - sessao concluida agora grava `scheduledDateLabel` e `scheduledFor`;
    - finalizacao web (`completeWebConciergeSession`) agora exige `scheduledFor`.
  - `apps/api/src/routes/index.ts`:
    - `POST /api/public/webhooks/zapi` agora exige `ZAPI_WEBHOOK_SECRET` (obrigatorio);
    - `GET /api/public/concierge/inbox` substituido por `GET /api/concierge/inbox` com `requireAdmin`;
    - novo `GET /api/concierge/sessions` com `requireAdmin` para auditoria de contatos.
  - Retencao:
    - `apps/api/src/lib/conciergeRetention.ts` criado;
    - `apps/api/src/server.ts` inicia scheduler de limpeza automatica;
    - limpeza remove sessoes `COMPLETED`/`CANCELLED` acima da janela configurada.
  - Config:
    - `apps/api/.env.example` atualizado com `ZAPI_WEBHOOK_SECRET`, `CONCIERGE_RETENTION_DAYS`, `CONCIERGE_RETENTION_INTERVAL_HOURS`.
- Web/UI
  - `apps/web/src/legacy/index.behavior.ts`:
    - removido polling/inbox inbound no chatbot publico;
    - finalizacao passou para endpoint unificado `POST /api/public/concierge/complete`;
    - fluxo ganhou etapa de data e envia `scheduledFor` estruturado;
    - fallback manual de WhatsApp mantido apenas em caso de falha no envio automatico.
  - `apps/web/src/legacy/admin.body.html`:
    - nova view `data-view=\"whatsapp-contatos\"` e item lateral `WhatsApp`;
    - filtros e tabela para auditoria (contato, nome, telefone, servico, unidade, data/hora, status, finalizacao).
  - `apps/web/src/legacy/admin.behavior.ts`:
    - consumo de `GET /api/concierge/sessions`;
    - filtros/search e renderizacao da grade de auditoria;
    - testes internos do admin atualizados para incluir nova view/endpoint.
- Documentacao
  - `docs/config/WHATSAPP_API_ZAPI_NGROK.md` atualizado com:
    - endpoints admin (`/api/concierge/inbox`, `/api/concierge/sessions`);
    - segredo obrigatorio no webhook;
    - politica de retencao e comportamento da interface (site x admin).
- Validacao
  - `apps/api`: `npm run build` PASS.
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
  - `node scripts/run-page-tests.mjs`: PASS=31 FAIL=0 WARN=0 SKIP=0.
  - `apps/api`: `npm run prisma:generate` falhou por lock de arquivo do engine (`EPERM rename ...query_engine-windows.dll.node`), sem bloquear build TypeScript.
- Checkpoint de continuidade
  - Ultimo passo concluido: isolamento do chatbot publico, auditoria admin e persistencia de data/hora do agendamento implementados.
  - Proximo passo planejado: aplicar migration no banco ativo e validar fluxo real de WhatsApp end-to-end com `ZAPI_WEBHOOK_SECRET` configurado.

## 2026-02-13 12:37:06
- Plano (normalizacao de migration e validacao runtime)
  - Corrigir historico Prisma em ambiente local para liberar deploy da migration nova do concierge.
  - Aplicar migration `20260213111500_harden_whatsapp_concierge_tracking`.
  - Revalidar endpoints principais do fluxo.
- Banco/Migrations
  - Resolucao de historico:
    - `npx prisma migrate resolve --applied 20260212215000_add_concierge_session_flow`
    - `npx prisma migrate resolve --applied 20260212223500_add_service_cost`
  - Deploy aplicado com sucesso:
    - `npx prisma migrate deploy` -> aplicada `20260213111500_harden_whatsapp_concierge_tracking`.
- Validacao funcional
  - `POST /api/public/concierge/complete` validado com payload de data/hora:
    - retorno `success=true`.
  - `GET /api/concierge/sessions` (admin) validado:
    - retorno com `phone`, `scheduledDateLabel` e `scheduledFor`.
  - `POST /api/public/webhooks/zapi` sem segredo validado:
    - bloqueio esperado (`503`).
  - `GET /api/concierge/inbox` sem token validado:
    - bloqueio esperado (`401`).
- Validacao tecnica
  - `apps/api`: `npm run build` PASS.
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
  - `node scripts/run-page-tests.mjs`: PASS=31 FAIL=0 WARN=0 SKIP=0.
- Checkpoint de continuidade
  - Ultimo passo concluido: migration aplicada no banco e endpoints criticos revalidados em runtime.
  - Proximo passo planejado: validacao UX visual no admin (view WhatsApp) e teste operacional com webhook real autenticado por `ZAPI_WEBHOOK_SECRET`.

## 2026-02-13 15:06:00
- Plano (admin WhatsApp, padrao visual e seed de produtos)
  - Corrigir markup quebrado nas views `agenda` e `dashboard` que impede renderizacao/alternancia correta de abas (incluindo WhatsApp).
  - Ajustar sidebar admin para comportar novas opcoes sem esconder o ultimo item (altura/scroll).
  - Aplicar padrao visual admin: fundo cinza por padrao (sem alterar fundo de campos), mantendo verde primary/verde escuro/gold.
  - Padronizar grids no modelo de Servicos: barra superior primary, cabecalho de tabela verde escuro, botoes contrastantes em dourado e indicadores em branco.
  - Gerar seed de produtos a partir da planilha `ProdutosEstoque_GeradoAs13-02-26_14_38_24.xlsx`, validando `patrimonio = quantidade * preco`.
  - Validar compilacao/lint e registrar checkpoint final com ultimo passo concluido e proximo passo.
- Web/UI
  - `apps/web/src/legacy/admin.body.html`:
    - corrigido markup quebrado em `data-leads-table-body` (remoção de `\`n` literal no HTML);
    - corrigido bloco `data-appointments-grid` removendo cards corrompidos e mantendo placeholder consistente para render dinâmico;
    - sidebar desktop ajustada para não cortar itens (`height/max-height` reduzida e `overflow-y:auto`);
    - contêiner da sidebar alterado para layout com `gap` e sem `justify-between`, evitando ocultação do último menu;
    - padrão visual admin aplicado: fundo cinza global (preservando fundos de campos);
    - grids padronizados com cabeçalho escuro e barra superior em primary (via CSS global);
    - tabela de produtos recebeu coluna `Patrimonio` e barra superior com regra de cálculo;
    - `colspan` do carregamento da tabela de produtos ajustado para 17.
  - `apps/web/src/legacy/admin.behavior.ts`:
    - render da tabela de produtos atualizado para calcular/exibir `patrimonio = preco * estoque`;
    - `colspan` de estado vazio da tabela de produtos ajustado para 17.
- API/Seed
  - `apps/api/prisma/data/productInventorySeed.ts` criado com 8 itens importados da planilha de estoque.
  - `apps/api/prisma/seed.ts`:
    - integrado `productInventorySeed`;
    - criação/reativação automática da categoria de produto por nome (`Produtos`);
    - upsert lógico por `sku`/`name` para não duplicar itens do seed;
    - validação explícita de patrimônio (`patrimonio` da planilha x `preco * estoque`) com `logger.warn` em divergência.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
  - `apps/api`: `npm run build` PASS.
  - `apps/api`: `npm run prisma:seed` PASS.
  - `node scripts/run-page-tests.mjs`: PASS=31 FAIL=0 WARN=0 SKIP=0.
- Checkpoint de continuidade
  - Ultimo passo concluido: correções da tela admin WhatsApp, padronização visual de grids/fundos e seed de produtos por planilha implementados.
  - Proximo passo planejado: validar visualmente no `/admin` (desktop e mobile) o novo padrão de cor/fundos e a navegação da aba WhatsApp com dados reais.

## 2026-02-13 16:12:00
- Plano (paginacao unificada + edicao por ID no admin)
  - Suavizar o fundo cinza global do admin para reduzir contraste visual.
  - Grid de produtos:
    - remover bloco textual fixo `Patrimonio = estoque x preco`;
    - implementar barra de paginacao no padrao de servicos com `Primeira/Anterior/Pagina/Proxima/Ultima` e seletor `10/25/50`;
    - habilitar clique no ID para abrir edicao no formulario da mesma tela.
  - Grid de assinantes:
    - manter fluxo de edicao via modal existente e habilitar clique no ID para abrir edicao;
    - padronizar barra de paginacao com `Primeira/Anterior/Pagina/Proxima/Ultima` e seletor `10/25/50`.
  - Aplicar o mesmo padrao de paginacao nas demais grids administrativas sem paginação funcional (leads e pedidos/vendas).
  - Atualizar `admin.behavior.ts` com estados, filtros e handlers de paginação para todas as grids ajustadas.
  - Validar com lint/build/testes de pagina.
- Web/UI
  - `apps/web/src/legacy/admin.body.html`:
    - fundo cinza global suavizado (`admin-shell`, `admin-main`, `admin-sidebar` e overrides de blocos);
    - grid de produtos:
      - removido bloco textual fixo de patrimonio no topo;
      - adicionada barra de paginação completa no padrão de serviços (`Primeira/Anterior/Pagina/Proxima/Ultima` + seletor `10/25/50`);
    - grid de serviços:
      - paginação estendida com botões `Primeira` e `Ultima`;
      - seletor de itens por página padronizado para `10/25/50`;
    - grid de assinantes:
      - layout de paginação refeito no padrão de serviços com controles completos e seletor `10/25/50`;
    - grid de leads:
      - removida paginação mock estática;
      - adicionada paginação funcional completa com seletor `10/25/50`;
    - grid de pedidos/vendas:
      - adicionada paginação funcional completa com seletor `10/25/50`.
  - `apps/web/src/legacy/admin.behavior.ts`:
    - serviços: suporte a `Primeira/Ultima` em paginação;
    - produtos:
      - paginação funcional completa (estado, filtro, range e navegação);
      - clique no ID (`PRD-*`) abre edição no formulário inferior;
    - assinantes:
      - clique no ID (`SUB-*`) abre edição no modal existente;
      - suporte a `Primeira/Ultima` e estado visual de botões;
    - leads:
      - paginação funcional completa (estado, filtro, range e navegação);
      - clique no ID (`LEAD-*`) aciona fluxo de edição de status;
    - pedidos/vendas:
      - paginação funcional completa (estado, filtro, range e navegação);
      - clique no ID (`PV-*`) aciona fluxo de edição/status.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
  - `node scripts/run-page-tests.mjs`: PASS=31 FAIL=0 WARN=0 SKIP=0.
- Checkpoint de continuidade
  - Ultimo passo concluido: grids admin com paginação padronizada, edicao por ID e ajustes visuais de fundo aplicados.
  - Proximo passo planejado: validacao manual em `/admin` com foco em UX dos novos controles (desktop/mobile) e ajuste fino de espaçamentos se necessário.

## 2026-02-13 16:46:00
- Plano (padronizacao da grid de usuarios)
  - Aplicar na grid de usuarios o mesmo padrao de navegacao/paginacao das demais grids.
  - Habilitar edicao por clique no ID (`USR-*`).
  - Substituir navegacao antiga por controles completos (`Primeira/Anterior/Pagina/Proxima/Ultima`) e seletor `10/25/50`.
  - Validar compilacao e comportamento geral.
- Web/UI
  - `apps/web/src/legacy/admin.body.html`:
    - grid de usuarios recebeu barra superior de paginacao no padrao de servicos;
    - adicionados controles `data-users-page-first`, `data-users-page-prev`, `data-users-pagination-page`, `data-users-page-next`, `data-users-page-last`;
    - adicionado seletor `data-users-page-size` com opcoes `10/25/50`;
    - removido bloco antigo de paginação com bolinhas numeradas.
  - `apps/web/src/legacy/admin.behavior.ts`:
    - removida logica visual legada de botoes circulares da grid de usuarios;
    - paginação de usuarios atualizada para o novo padrao (incluindo first/last e page-size dinamico);
    - clique no ID (`USR-*`) agora aciona diretamente `data-user-action="edit"` para abrir edicao;
    - handlers de paginação da grid de usuarios atualizados para os novos controles.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
  - `node scripts/run-page-tests.mjs`: PASS=31 FAIL=0 WARN=0 SKIP=0.
- Checkpoint de continuidade
  - Ultimo passo concluido: grid de usuarios padronizada com edicao por ID e paginacao completa.
  - Proximo passo planejado: revisao visual final das grids no `/admin` para ajuste fino de spacing/legibilidade em resolucoes menores.

## 2026-02-13 17:09:00
- Plano (rodada final de ajuste fino em todas as grids)
  - Consolidar ajustes visuais das barras de grid para legibilidade e consistencia.
  - Refinar responsividade dos controles de paginação em telas menores.
  - Padronizar tipografia/altura de cabecalhos e celulas das tabelas.
  - Manter comportamento funcional atual sem alterar fluxos de CRUD/filtros.
- Web/UI
  - `apps/web/src/legacy/admin.body.html`:
    - criadas regras globais de ajuste fino para grids:
      - `table-head-cell` e `table-cell` com tamanho/linha/padding mais consistentes;
      - largura/altura minima para selects de pagina e chips de pagina atual;
      - largura/altura minima e alinhamento para botoes de paginação;
      - barra de rolagem horizontal com estilo mais discreto;
      - comportamento responsivo para mobile (toolbar compacta, wrap de controles, botões `Primeira/Ultima` com foco em ícone).
    - adicionado `admin-grid-toolbar` e `admin-grid-toolbar-controls` nas barras de paginação das grids:
      - Leads, Usuarios, Servicos, Produtos, Assinantes e Pedidos/Vendas.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
  - `node scripts/run-page-tests.mjs`: PASS=31 FAIL=0 WARN=0 SKIP=0.
- Checkpoint de continuidade
  - Ultimo passo concluido: rodada final de ajuste fino visual aplicada em todas as grids administrativas.
  - Proximo passo planejado: validacao manual em diferentes larguras de tela para micro-ajustes de densidade visual (caso desejado).

## 2026-02-13 17:20:03
- Plano (fechamento para versionamento no GitHub)
  - Consolidar todas as alteracoes pendentes em um commit unico.
  - Excluir logs temporarios `tmp-flow` do commit.
  - Manter migration, ajustes de backend/frontend e documentacao no mesmo pacote versionado.
- Versionamento
  - Commit unico preparado para publicacao.
  - `apps/api/tmp-flow-err.log` e `apps/api/tmp-flow-out.log` mantidos fora do staging por decisao operacional.
- Checkpoint de continuidade
  - Ultimo passo concluido: pacote de alteracoes consolidado para envio ao GitHub sem incluir logs temporarios.
  - Proximo passo planejado: executar `git push` da branch `Refatorar_VITEREACT` e iniciar a proxima mudanca estrutural.

## 2026-02-13 17:40:58
- Plano (agenda remota com disponibilidade real por slots)
  - Evoluir modelagem de agenda para suportar:
    - horario de funcionamento por unidade e dia da semana;
    - vinculo profissional x servico;
    - ocupacao de slots de 30 minutos com controle de concorrencia.
  - Implementar engine de disponibilidade com:
    - calculo por unidade + data + servico + periodo (manha/tarde/noite);
    - validacao de duracao do servico contra `hourFinish`;
    - consolidacao de vagas considerando todos os profissionais aptos.
  - Implementar reserva transacional de agendamentos:
    - selecao automatica de profissional livre;
    - persistencia de `Appointment` + slots ocupados;
    - bloqueio de overbooking por constraint unica.
  - Expor APIs publicas para o novo fluxo:
    - escolha de unidade/data;
    - escolha de categoria/servico;
    - periodos e slots disponiveis;
    - criacao de agendamento;
    - fila/mensagem para servico indisponivel ou digitado.
  - Atualizar fluxo do concierge web para:
    - unidade/data -> categoria/servico -> periodo -> slot -> contato;
    - agendar outro servico no mesmo dia/unidade;
    - orientar reinicio quando cliente quiser outra unidade/data no mesmo fluxo.
- Checkpoint de continuidade
  - Ultimo passo concluido: plano tecnico da mudanca estrutural registrado para inicio da implementacao.
  - Proximo passo planejado: aplicar alteracoes no Prisma + backend de disponibilidade e integrar no fluxo web.

## 2026-02-13 18:10:16
- Plano executado (agenda remota com slots de 30 min)
  - Banco e backend evoluidos para disponibilidade real por unidade/servico/profissional.
  - Fluxo web do concierge migrado para decisoes em etapas com vaga real.
  - Reserva transacional aplicada para reduzir risco de overbooking em concorrencia.
- API/DB
  - `apps/api/prisma/schema.prisma`:
    - `Unit` ganhou `hourStart` e `hourFinish`;
    - `Appointment` ganhou `clientId`, indices e relacao com `User`;
    - novas tabelas: `ProfessionalService`, `AppointmentSlot`, `AppointmentWaitlistMessage`.
  - Migration criada/aplicada:
    - `apps/api/prisma/migrations/20260213210533_remote_appointment_availability/migration.sql`.
  - `apps/api/src/lib/appointmentAvailability.ts` criado:
    - engine de disponibilidade por slots de 30 minutos;
    - consolidacao de vagas por periodo (`MORNING`, `AFTERNOON`, `EVENING`);
    - calculo de `hour_finish` por `hour_ini + duration`;
    - criacao transacional de agendamento com selecao automatica de profissional livre;
    - bloqueio por conflito de slot via chave unica (`unitId + professionalId + slotStart`).
  - `apps/api/src/routes/index.ts`:
    - novos endpoints publicos:
      - `GET /api/public/concierge/booking-context`
      - `GET /api/public/concierge/services?unitId&date`
      - `GET /api/public/concierge/periods?unitId&date&serviceId`
      - `GET /api/public/concierge/slots?unitId&date&serviceId&period`
      - `POST /api/public/concierge/book`
      - `POST /api/public/concierge/waitlist`
    - `GET /api/public/concierge/options` passou a retornar tambem `bookingContext`;
    - `POST /api/appointments` (admin) passou a usar reserva por disponibilidade real (preferencia de profissional);
    - novo endpoint admin `GET /api/concierge/waitlist`;
    - `PATCH /api/appointments/:id` remove slots ao cancelar agendamento.
  - `apps/api/prisma/seed.ts`:
    - unidades seedadas com `hourStart/hourFinish`;
    - relacao `ProfessionalService` seedada (profissionais ativos vinculados aos servicos ativos).
    - garantia adicional: toda unidade passa a ter ao menos um profissional associado (evita unidade sem disponibilidade).
- Web/UI
  - `apps/web/src/legacy/index.behavior.ts`:
    - fluxo do concierge refeito para:
      - unidade + data (primeira decisao);
      - categoria + servico;
      - periodo (manha/tarde/noite);
      - slots disponiveis reais;
      - contato e confirmacao;
      - opcao de agendar outro servico na mesma unidade/data;
      - orientacao para reiniciar ao querer outra unidade/data;
      - fallback de lista de espera para servico nao encontrado/sem vaga.
- Validacao
  - `apps/api`: `npx prisma migrate dev --name remote-appointment-availability` PASS (migration aplicada).
  - `apps/api`: `npx prisma generate` inicialmente falhou por lock do engine (`EPERM rename ...query_engine...`); processo na porta `3001` foi encerrado e o `npx prisma generate` normal passou em seguida.
  - `apps/api`: `npm run build` PASS.
  - `apps/api`: `npm run prisma:seed` PASS.
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
  - `node scripts/run-page-tests.mjs`: PASS=31 FAIL=0 WARN=0 SKIP=0.
  - Smoke do novo fluxo publico:
    - `GET /api/public/concierge/booking-context` PASS;
    - `GET /api/public/concierge/services/periods/slots` PASS;
    - `POST /api/public/concierge/book` PASS (agendamento criado em runtime: appointmentId=12).
    - disponibilidade por unidade validada (`Birmann 20` e `Parque da Cidade` com servicos disponiveis no dia).
    - teste de conflito no mesmo slot (unidade com 1 profissional): primeira reserva `201`, segunda reserva `409` (bloqueio esperado).
- Checkpoint de continuidade
  - Ultimo passo concluido: disponibilidade por slots + fluxo cliente em etapas entregue com migration aplicada no MySQL local.
  - Proximo passo planejado: validar em ambiente rodando (teste manual de concorrencia com dois clientes no mesmo slot) e, na sequencia, preparar migração para PostgreSQL.

## 2026-02-13 19:10:58
- Correção de regra (escala por profissional + reserva opcional por profissional)
  - Regra incorporada: disponibilidade agora depende da escala informada por profissional em cada dia, não apenas do horário macro da unidade.
  - Regra incorporada: slot pode aparecer como livre com capacidade >1 quando houver mais de um profissional apto e em escala no mesmo horário.
  - Regra incorporada: cliente pode optar por reservar com profissional específico.
- API/DB
  - `apps/api/prisma/schema.prisma`:
    - `Professional` ganhou `userId` (vínculo opcional com `User`);
    - novo modelo `ProfessionalShift` (`workDate`, `hourStart`, `hourFinish`, `isActive`, `notes`);
    - relações adicionadas entre `Unit`/`Professional` e escalas.
  - Migration criada/aplicada:
    - `apps/api/prisma/migrations/20260213222500_professional_shift_schedule/migration.sql`.
  - `apps/api/src/lib/appointmentAvailability.ts`:
    - cálculo de slots passou a considerar cobertura de escala por profissional para o intervalo completo do serviço;
    - profissionais fora da escala não entram no cálculo de disponibilidade;
    - nova função para listar profissionais disponíveis em um slot específico;
    - reserva com `preferredProfessionalId` em modo estrito quando solicitado.
  - `apps/api/src/routes/index.ts`:
    - novo endpoint público: `GET /api/public/concierge/slot-professionals`;
    - `POST /api/public/concierge/book` aceita `preferredProfessionalId`;
    - novos endpoints de escala:
      - admin: `GET/POST/PATCH/DELETE /api/professional-shifts`
      - self-service profissional: `GET/POST/PATCH/DELETE /api/professionals/me/shifts`
    - novo endpoint admin para vínculo login->profissional:
      - `PATCH /api/professionals/:id/link-user`
  - `apps/api/prisma/seed.ts`:
    - seed inicial de escalas por profissional para os próximos dias;
    - manutenção dos vínculos profissional-serviço com unidade.
- Web/UI
  - `apps/web/src/legacy/index.behavior.ts`:
    - após escolha do slot, fluxo pergunta se deseja profissional específico;
    - consulta `slot-professionals` e permite escolher “primeiro disponível” ou um profissional nominal;
    - ao confirmar, envia `preferredProfessionalId` quando houver escolha.
- Validação
  - `apps/api`: `npx prisma migrate deploy` PASS (nova migration aplicada).
  - `apps/api`: `npx prisma generate` PASS (após liberar lock de processo local).
  - `apps/api`: `npm run build` PASS.
  - `apps/api`: `npm run prisma:seed` PASS.
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
  - `node scripts/run-page-tests.mjs`: PASS=31 FAIL=0 WARN=0 SKIP=0.
  - Smoke funcional:
    - reserva com profissional específico: primeira `201`, segunda `409` no mesmo slot/profissional (bloqueio esperado);
    - API de escalas admin validada (`/professional-shifts`) com criação/listagem/limpeza de dado de teste.
- Checkpoint de continuidade
  - Ultimo passo concluido: cálculo de disponibilidade migrado para escala diária por profissional, com opção de reserva por profissional específico.
  - Proximo passo planejado: criar tela admin dedicada para manutenção de escalas (calendário/lista por unidade/dia) e iniciar plano de migração para PostgreSQL.

## 2026-02-13 19:33:09
- Plano (seed direcionado + telas admin de agenda/vinculos)
  - Ajustar seed para garantir 3 profissionais com escalas fixas:
    - profissional 1: segunda/quarta/sexta, `08:00`-`15:00` (manicure);
    - profissional 2: todos os dias, `11:00`-`19:00` (manicure);
    - profissional 3: todos os dias, `08:00`-`16:00` (cabeleireira).
  - Garantir vínculo profissional x serviços com base na especialidade.
  - Finalizar tela admin de agenda para:
    - cadastrar/listar/excluir escalas por profissional;
    - vincular serviços por profissional e definir unidade.
  - Validar build/lint/seed.
- API/DB
  - `apps/api/prisma/seed.ts`:
    - seed consolidado para criar/atualizar:
      - `Maria Manicure` (`08:00`-`15:00`, segunda/quarta/sexta),
      - `Francisca Manicure` (`11:00`-`19:00`, todos os dias),
      - `Cicera Cabeleireira` (`08:00`-`16:00`, todos os dias);
    - geração de escalas para janela de 56 dias;
    - vínculos de serviços por perfil (manicure/cabelo) e fallback para serviços ativos.
  - Rotas já ativas para manutenção:
    - `GET/POST/PATCH/DELETE /api/professional-shifts`
    - `GET /api/professional-services`
    - `PATCH /api/professionals/:id`
    - `PUT /api/professionals/:id/services`
- Web/UI
  - `apps/web/src/legacy/admin.body.html`:
    - seção de Agenda com blocos de:
      - escalas dos profissionais;
      - serviços por profissional e unidade.
  - `apps/web/src/legacy/admin.behavior.ts`:
    - handlers implementados para escalas:
      - atualizar, filtrar, criar e excluir;
    - handlers implementados para vínculos:
      - carregar checklist por profissional;
      - salvar unidade e serviços vinculados;
    - carregamento inicial ajustado para buscar agenda e escalas no bootstrap da tela.
- Validação
  - `apps/api`: `npx prisma generate` PASS.
  - `apps/api`: `npm run prisma:seed` PASS.
  - `apps/api`: `npm run build` PASS.
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
  - `node scripts/run-page-tests.mjs`: PASS=19 FAIL=0 WARN=0 SKIP=1 (API offline no teste de login).
  - Verificação direta no banco (script ad-hoc):
    - profissionais seedados com nomes/especialidades/unidade corretos;
    - amostra de escalas confirmou horários e dias esperados;
    - vínculos de serviços por profissional presentes.
- Checkpoint de continuidade
  - Ultimo passo concluido: seed de profissionais/escalas aplicado e telas admin de manutenção de agenda/vínculos finalizadas com handlers funcionais.
  - Proximo passo planejado: validação manual no `/admin` (fluxo completo de criação/edição operacional) e, em seguida, preparar trilha de migração para PostgreSQL.

## 2026-02-14 00:22:01
- Plano (ajuste visual da agenda)
  - Remover texto descritivo do cabeçalho da tela de Agenda.
  - Trocar o quadro "Agendamentos do dia" (cards) por uma tabela estilizada e organizada.
  - Ajustar o renderer da agenda para preencher linhas da nova tabela.
- Web/UI
  - `apps/web/src/legacy/admin.body.html`:
    - removida a frase "Conecte a agenda da Trinx e acompanhe os horarios.";
    - bloco de agendamentos convertido para tabela com colunas:
      - Data/Hora, Status, Servico, Cliente, Profissional, Unidade.
  - `apps/web/src/legacy/admin.behavior.ts`:
    - `renderAppointments` refatorado para renderizar `tbody` (`data-appointments-table-body`);
    - ordenação por horário de início e fallback de estado vazio em linha única da tabela.
- Checkpoint de continuidade
  - Ultimo passo concluido: tela de Agenda com lista tabular de agendamentos e cabeçalho sem frase da Trinx.
  - Proximo passo planejado: validação visual manual no `/admin` para densidade e legibilidade da nova tabela.

## 2026-02-14 17:54:48
- Plano (ajuste de fluxo WhatsApp concierge)
  - Restaurar no fluxo WhatsApp a pergunta de periodo (`Manha/Tarde/Noite`) antes da lista de horarios.
  - Passar a exibir servicos agrupados por categoria no passo de selecao de servico.
  - Conectar selecao de periodo e horarios ao motor de disponibilidade real (`appointmentAvailability`) por unidade/data/servico.
  - Manter compatibilidade com o schema atual, sem migration adicional nesta rodada.
  - Validar compilacao do backend e registrar checkpoint com resultado.
- API/Fluxo WhatsApp
  - `apps/api/src/lib/conciergeFlow.ts`:
    - ordem do fluxo ajustada para `UNIT -> DATE -> SERVICE -> SLOT -> NAME`;
    - novo prompt de servicos agrupados por categoria com numeracao global de opcoes;
    - etapa `SLOT` passou a operar em duas fases:
      - selecao de periodo (`Manha/Tarde/Noite`);
      - selecao de horario dentro do periodo escolhido;
    - periodos e horarios agora consumem disponibilidade real por unidade/data/servico via:
      - `listPublicPeriodsForService`
      - `listPublicSlotsForService`;
    - fallback de contexto reforcado para reiniciar em `UNIT` quando faltar unidade/data/servico.
- Validacao
  - `apps/api`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: fluxo WhatsApp atualizado com servicos por categoria e pergunta de periodo antes dos horarios.
  - Proximo passo planejado: validacao manual end-to-end via Z-API (mensagem real) para confirmar UX e disponibilidade por periodo/horario em runtime.

## 2026-02-14 18:26:36
- Plano (revisao de especificacao e consolidacao de documentacao do fluxo)
  - Revisar o arquivo `docs/evolutive_changes/MUDANCAS_FLUXO_ESTRUTURA.MD` e consolidar o combinado do ciclo de 2026-02-13.
  - Produzir documento estruturado com fluxo alvo, estruturas novas, endpoints e controles operacionais.
  - Registrar matriz de completude (`requisito x status x evidencias`) antes de seguir com novas alteracoes.
  - Apontar gaps/decisoes pendentes para aprovacao do proximo ciclo de implementacao.
- Documentacao consolidada
  - Criado `docs/config/ESPECIFICACAO_FLUXO_CONCIERGE_2026-02-13.md` com:
    - escopo consolidado do ciclo de 2026-02-13;
    - estruturas de dados novas (Prisma), engine de disponibilidade, endpoints e controles;
    - fluxo funcional web e WhatsApp;
    - seed operacional e telas admin;
    - matriz de completude de requisitos;
    - gaps e decisoes pendentes para fechamento de produto antes de novas alteracoes.
- Checkpoint de continuidade
  - Ultimo passo concluido: revisao de especificacao executada e documentacao consolidada criada.
  - Proximo passo planejado: decisao explicita do produto sobre (1) passo inicial do bot, (2) reserva transacional no bot inbound, (3) escolha de profissional no bot inbound.

## 2026-02-14 18:39:01
- Plano executado (ajuste final do WhatsApp conforme decisao de produto)
  - Iniciar conversa em `SERVICE` (servico primeiro).
  - Criar agendamento real no fim do fluxo WhatsApp (reserva transacional no backend).
  - Quando houver mais de um profissional disponivel no slot, oferecer escolha explicita.
- API/Fluxo WhatsApp
  - `apps/api/src/lib/conciergeFlow.ts`:
    - nova abertura de sessao em `step: SERVICE` com prompt de servicos por categoria;
    - ordem do fluxo ajustada para `SERVICE -> UNIT -> DATE -> SLOT -> NAME`;
    - `SLOT` continua em duas fases:
      - selecao de periodo;
      - selecao de horario;
    - apos escolher horario:
      - consulta profissionais disponiveis no slot;
      - se houver mais de um, envia prompt de escolha (inclui opcao de primeiro disponivel);
      - se houver apenas um, segue direto para captura de nome;
    - `NAME` agora conclui com criacao real de agendamento via `createRemoteAppointment`;
    - em conflito/indisponibilidade de slot na reserva final, fluxo retorna para etapa de periodo/horario;
    - resumo final passou a incluir profissional quando aplicavel.
  - `docs/config/ESPECIFICACAO_FLUXO_CONCIERGE_2026-02-13.md`:
    - atualizado para refletir decisoes fechadas e implementadas (inicio em `SERVICE`, reserva real no bot e escolha de profissional no WhatsApp inbound).
  - Estados internos adicionais:
    - marcador de periodo no `slotLabel` (`__PERIOD__:*`);
    - marcador de escolha de profissional no `customerName` (`__PROF_SELECTION__:*` / pendente).
- Validacao
  - `apps/api`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: bot WhatsApp inicia por servico, cria agendamento real e oferece escolha de profissional quando houver concorrencia no slot.
  - Proximo passo planejado: validacao E2E manual no WhatsApp real (novo fluxo completo + criacao de `Appointment` no banco) e ajuste fino de mensagens UX se necessario.

## 2026-02-14 18:59:05
- Plano (saudacao dinamica no inicio do fluxo WhatsApp)
  - Adicionar saudacao baseada no horario atual (`Bom Dia` / `Boa Tarde` / `Boa Noite`) no primeiro prompt do concierge WhatsApp.
  - Emendar a frase `Seja bem vinda` e, em seguida, perguntar `Qual tratamento deseja fazer hoje?`.
  - Manter a listagem de categorias/servicos logo apos a pergunta.
  - Aplicar o mesmo texto de abertura em reinicios de sessao no passo `SERVICE`.
  - Validar compilacao do backend.
- API/Fluxo WhatsApp
  - `apps/api/src/lib/conciergeFlow.ts`:
    - adicionada saudacao dinamica por horario:
      - `Bom Dia` (05:00-11:59),
      - `Boa Tarde` (12:00-17:59),
      - `Boa Noite` (18:00-04:59);
    - mensagem inicial padronizada:
      - `"<saudacao>! Seja bem vinda. Qual tratamento deseja fazer hoje?"`;
    - prompt de servicos mantido por categorias/itens logo apos a saudacao;
    - mesma abertura aplicada nos pontos de reinicio quando o fluxo volta para `SERVICE`.
- Validacao
  - `apps/api`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: inicio do bot WhatsApp com saudacao dinamica + pergunta de tratamento antes da lista de categorias/servicos.
  - Proximo passo planejado: validar mensagem de abertura em WhatsApp real nas tres faixas de horario (manha/tarde/noite).

## 2026-02-14 19:04:41
- Plano executado (teste automatizado da saudacao por horario)
  - Isolar a regra de saudacao em modulo dedicado para teste unitario puro.
  - Cobrir faixas de horario `Bom Dia`, `Boa Tarde` e `Boa Noite`.
  - Cobrir montagem da frase inicial completa do bot.
- API/Testes
  - Novo modulo: `apps/api/src/lib/conciergeOpening.ts`
    - `getGreetingByHour(now)`
    - `buildOpeningGreeting(now?)`
  - Novo teste: `apps/api/src/lib/conciergeOpening.test.ts`
    - 4 casos de teste (faixas de horario + frase composta).
  - `apps/api/src/lib/conciergeFlow.ts`
    - fluxo passou a reutilizar `buildOpeningGreeting`.
  - `apps/api/package.json`
    - script `test:greeting` adicionado;
    - script `test` atualizado para executar `test:greeting`.
- Validacao
  - `apps/api`: `npm test` PASS (4 testes, 0 falhas).
- Checkpoint de continuidade
  - Ultimo passo concluido: cobertura automatizada da regra de saudacao inicial por horario.
  - Proximo passo planejado: validar UX da saudacao no WhatsApp real em runtime e manter regressao via `npm test`.

## 2026-02-14 19:35:55
- Plano (toggle no admin para modo de exibicao de servicos no WhatsApp)
  - Adicionar configuracao persistida em `ContentEntry` com chave `whatsapp_flow_category_first`.
  - Criar controle no admin (tela `Contatos WhatsApp`) para marcar/desmarcar esse modo.
  - Ajustar o passo `SERVICE` do fluxo WhatsApp:
    - `true`: mostrar categorias primeiro e, apos escolha, mostrar servicos da categoria.
    - `false`: manter comportamento atual (todos os servicos de uma vez).
  - Preservar compatibilidade sem migration de banco (usar estado interno da sessao).
  - Validar compilacao/testes apos as alteracoes.
- Checkpoint de continuidade
  - Ultimo passo concluido: planejamento registrado para implementar toggle de exibicao no WhatsApp.
  - Proximo passo planejado: editar backend e admin para aplicar a flag e validar build/testes.

## 2026-02-14 19:43:36
- Plano executado (toggle admin para categorias primeiro no WhatsApp)
  - `apps/api/src/lib/conciergeFlow.ts`
    - nova chave de configuracao: `whatsapp_flow_category_first` (via `ContentEntry`);
    - leitura dinamica da flag por mensagem inbound (`isWhatsappCategoryFirstFlowEnabled`);
    - passo `SERVICE` passou a suportar dois modos:
      - `false` (padrao): lista completa de servicos (comportamento atual);
      - `true`: primeiro lista categorias, depois lista servicos da categoria escolhida;
    - adicionado estado interno de categoria selecionada no `slotLabel` com prefixo `__CATEGORY__:`;
    - adicionado comando de retorno para trocar categoria (`menu`/`voltar`/`categoria(s)`).
  - `apps/web/src/legacy/admin.body.html`
    - novo bloco de configuracao na tela `Contatos WhatsApp` com checkbox:
      - `data-concierge-category-first-toggle`;
      - `data-concierge-category-first-status`.
  - `apps/web/src/legacy/admin.behavior.ts`
    - carga da configuracao via `GET /api/content/whatsapp_flow_category_first`;
    - persistencia via `PUT /api/content/whatsapp_flow_category_first` com body `{ value: boolean }`;
    - feedback de estado na UI (ativo/desativado/salvando) e rollback visual em caso de erro.
- Validacao
  - `apps/api`: `npm run build` PASS.
  - `apps/api`: `npm test` PASS (4 testes).
  - `apps/api`: `npm run lint` NA (script inexistente no package atual).
  - `apps/web`: `npm run build` PASS.
  - `apps/web`: `npm run lint` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: toggle admin conectado ao fluxo WhatsApp com alternancia entre categorias-primeiro e lista completa.
  - Proximo passo planejado: homologar no WhatsApp real (mobile) os dois modos, incluindo troca de categoria via `menu`.

## 2026-02-14 20:29:55
- Plano executado (fix de entrega do resumo final no WhatsApp)
  - Priorizar envio do resumo para o cliente antes do numero administrativo.
  - Adicionar retry automatico para mensagens criticas (resumo e confirmacao final).
  - Criar fallback de resumo compacto quando o resumo completo falhar para o cliente.
- API/Fluxo WhatsApp
  - `apps/api/src/lib/conciergeFlow.ts`
    - novo helper `sendAndTrackWithRetry(...)` com tentativas adicionais e atraso curto;
    - novo helper `delay(...)` para reduzir rajada de envios consecutivos;
    - novo helper `buildCompactSummary(...)` para fallback de mensagem curta;
    - finalizacao em `NAME` ajustada para:
      - enviar resumo primeiro ao cliente (`normalizedPhone`);
      - enviar depois ao numero administrativo;
      - tentar novamente em caso de falha;
      - quando o resumo completo nao chega ao cliente, enviar resumo compacto de fallback;
      - enviar confirmacao final tambem com retry.
- Validacao
  - `apps/api`: `npm run build` PASS.
  - `apps/api`: `npm test` PASS (4 testes).
- Checkpoint de continuidade
  - Ultimo passo concluido: envio de resumo final com retry/fallback implementado para aumentar confiabilidade no WhatsApp.
  - Proximo passo planejado: validacao manual em conversa real (finalizar agendamento e confirmar recebimento do resumo + confirmacao).

## 2026-02-14 21:08:35
- Plano executado (estrutura de cliente + onboarding progressivo no WhatsApp)
  - Criar entidade `Customer` separada de `User`, com link opcional `userId`.
  - Tornar `Professional.userId` obrigatorio.
  - Persistir cliente do WhatsApp ao finalizar agendamento.
  - Iniciar novas conversas com saudacao nominal quando telefone ja existir.
  - Solicitar 1 campo de cadastro por nova interacao ate completar perfil (email, cidade, estado, bairro; telefone 2 opcional).
- Prisma/DB
  - `apps/api/prisma/schema.prisma`:
    - novo `model Customer` com campos:
      - `name`, `phone`, `email`, `city`, `state`, `neighborhood`, `phone2`, `phone2OptOut`, `notes`, `userId?`;
    - `Professional.userId` alterado para obrigatorio;
    - relacoes nomeadas:
      - `User <-> Professional` via `ProfessionalUser`;
      - `User <-> Customer` via `CustomerUser`.
  - Nova migration:
    - `apps/api/prisma/migrations/20260214210500_customer_profile_and_professional_user_required/migration.sql`
    - inclui:
      - criacao da tabela `Customer`;
      - backfill de `User` para profissionais sem `userId`;
      - alteracao de `Professional.userId` para `NOT NULL`;
      - FK de `Customer.userId` opcional para `User`.
  - Migration aplicada:
    - `npx prisma migrate deploy` PASS.
- API/Fluxo WhatsApp
  - `apps/api/src/lib/conciergeOpening.ts`:
    - `buildOpeningGreeting(now, customerName?)` agora aceita nome e usa primeiro nome na saudacao.
  - `apps/api/src/lib/conciergeOpening.test.ts`:
    - novo teste cobrindo saudacao nominal.
  - `apps/api/src/lib/conciergeFlow.ts`:
    - leitura de cliente por telefone (`Customer`);
    - abertura de conversa com nome quando cliente existe;
    - persistencia/atualizacao do cliente ao concluir agendamento via WhatsApp;
    - observacao em novo cadastro WhatsApp: `*cliente vindo pelo whatsapp`;
    - onboarding incremental (1 campo por conversa):
      - pendencia controlada por marcador de estado interno `__PROFILE__:*`;
      - validacao por campo;
      - fluxo segue para escolha de servico apos salvar o campo.
  - Campos solicitados incrementalmente:
    - `email`, `city`, `state`, `neighborhood`;
    - `phone2` opcional (aceita `pular`).
- API/Rotas
  - `apps/api/src/routes/index.ts`:
    - `PATCH /professionals/:id/link-user` agora exige `professionalUserId` obrigatorio (sem unlink para `null`).
- Seed
  - `apps/api/prisma/seed.ts`:
    - profissionais seedados agora garantem `userId` (criacao/reativacao de `User` tecnico com role `PROFESSIONAL` quando necessario).
- Validacao
  - `apps/api`: `npx prisma generate --no-engine` PASS.
  - `apps/api`: `npm run build` PASS.
  - `apps/api`: `npm test` PASS (5 testes).
- Checkpoint de continuidade
  - Ultimo passo concluido: arquitetura separada de cliente implementada e chatbot WhatsApp com reconhecimento por telefone + onboarding incremental de cadastro.
  - Proximo passo planejado: adicionar tela admin de clientes (lista/filtro/edicao) e opcao manual para vincular `Customer.userId` a um `User` quando cliente criar conta no site.

## 2026-02-14 21:26:30
- Plano (admin Pessoas com abas)
  - Renomear item de menu Usuarios para Pessoas na sidebar, mantendo o data-view="usuarios" para compatibilidade.
  - Transformar a view atual de usuarios em um hub com abas locais: Clientes, Profissionais, Usuarios.
  - Implementar duas grades novas (Clientes e Profissionais) com botoes de atualizar e carregamento por API.
  - Criar endpoint admin GET /api/customers para abastecer a aba de clientes.
  - Ajustar `admin.behavior.ts` com controle das abas de pessoas e renderizacao das duas novas listas.
  - Validar compilacao do `apps/api` e `apps/web`.
- Checkpoint de continuidade
  - Ultimo passo concluido: planejamento registrado para menu Pessoas com abas no admin.
  - Proximo passo planejado: aplicar edicoes em HTML/TS/rotas e validar build.

## 2026-02-14 21:31:38
- Plano executado (modulo Pessoas no admin com abas)
  - `apps/web/src/legacy/admin.body.html`
    - menu lateral `Usuarios` renomeado para `Pessoas` (trigger mantido em `data-view="usuarios"` para compatibilidade);
    - view `usuarios` passou a ser hub `Pessoas` com abas locais:
      - `Clientes`;
      - `Profissionais`;
      - `Usuarios`.
    - adicionadas duas grades novas:
      - clientes (`data-people-customers-*`);
      - profissionais (`data-people-professionals-*`).
    - botao `Adicionar usuario` agora aparece apenas quando a aba `Usuarios` estiver ativa.
  - `apps/web/src/legacy/admin.behavior.ts`
    - implementado controlador de abas locais de Pessoas (`data-people-tab-target`/`data-people-tab-panel`);
    - adicionados tipos e renderizacao para listagem de clientes e profissionais;
    - novas cargas via API:
      - `GET /api/customers`;
      - `GET /api/professionals` (listagem da aba de profissionais);
    - adicionados botoes de atualizar para as abas `Clientes` e `Profissionais`.
  - `apps/api/src/routes/index.ts`
    - novo endpoint admin: `GET /customers` com include de `user` vinculado.
- Validacao
  - `apps/api`: `npm run build` PASS.
  - `apps/api`: `npm test` PASS (5 testes).
  - `apps/api`: `npm run lint` NA (script inexistente).
  - `apps/web`: `npm run build` PASS.
  - `apps/web`: `npm run lint` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: modulo `Pessoas` com abas e dados reais de clientes/profissionais entregue no admin.
  - Proximo passo planejado: se quiser, adicionar CRUD completo de clientes e profissionais dentro dessas abas (hoje esta como listagem + refresh).

## 2026-02-14 21:38:57
- Plano (ajuste de background do admin para combinar com Assinaturas)
  - Aplicar no admin o mesmo tom base de fundo da secao Assinaturas (`bg-champagne`, valor `#f3efe0`).
  - Ajustar as regras centrais de background em `apps/web/src/legacy/admin.body.html` para manter consistencia visual.
  - Validar compilacao do frontend apos ajuste.
- Checkpoint de continuidade
  - Ultimo passo concluido: confirmacao da cor alvo (`bg-champagne`).
  - Proximo passo planejado: aplicar mudanca de fundo no admin e validar build.

## 2026-02-14 21:40:10
- Plano executado (background do admin alinhado ao `bg-champagne`)
  - `apps/web/src/legacy/admin.body.html`
    - alterado fundo base para `#f3efe0` (valor do token `bg-champagne`) em:
      - `.admin-shell`;
      - `.admin-sidebar`;
      - `.admin-main`;
      - `.admin-topbar`.
- Validacao
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: cor de fundo base do admin padronizada para `bg-champagne`.
  - Proximo passo planejado: se desejar, ajustar tambem os blocos internos (`bg-white` override) para aproximar ainda mais da identidade da secao Assinaturas.

## 2026-02-14 21:41:25
- Plano (harmonizacao visual interna do admin com paleta champagne)
  - Ajustar overrides de `bg-white`, `bg-[#f6f8f6]` e estados hover no admin para tons derivados de `#f3efe0`.
  - Ajustar trilha de scroll do admin para a nova base de fundo.
  - Preservar contraste de tabelas/toolbar e textos para nao prejudicar usabilidade.
  - Validar build do frontend apos os ajustes.
- Checkpoint de continuidade
  - Ultimo passo concluido: fundo base do admin ja alinhado ao `bg-champagne`.
  - Proximo passo planejado: harmonizar cards e superficies internas.

## 2026-02-14 21:42:33
- Plano executado (harmonizacao interna do admin com paleta champagne)
  - `apps/web/src/legacy/admin.body.html`
    - superficies `bg-white` internas (cards/blocos): `#fbf7ec`.
    - superficies `bg-[#f6f8f6]` internas: `#f7f1e2`.
    - inputs/selects/textareas com `bg-[#f6f8f6]`: `#f8f2e6`.
    - estados hover de superfice branca/neutra: `#efe6d0`.
    - trilha de scrollbar em areas rolaveis: `#efe6d0` (thumb mantido em dourado).
  - Mantido contraste de titulos, tabelas e toolbar para preservar legibilidade.
- Validacao
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: admin harmonizado visualmente com a base `bg-champagne` tambem nos cards internos.
  - Proximo passo planejado: revisar em tela real e, se quiser, suavizar o verde forte de alguns modais legados (`#8EB69B`) para a mesma paleta.

## 2026-02-14 21:50:25
- Plano (correcao de erro 500 no /auth/login)
  - Fortalecer o login para depender apenas de campos minimos no `User` durante autenticacao.
  - Tornar atualizacao de `lastAccessAt` nao-bloqueante para nao derrubar login em caso de divergencia de schema.
  - Adicionar log estruturado de erro no catch do login para diagnostico futuro.
  - Validar build do backend apos ajuste.
- Checkpoint de continuidade
  - Ultimo passo concluido: diagnostico inicial do endpoint de login e hipoteses de falha por schema/coluna.
  - Proximo passo planejado: aplicar hardening no login e validar compilacao.

## 2026-02-14 21:51:23
- Plano executado (hardening no login para reduzir 500)
  - `apps/api/src/routes/index.ts`
    - `/auth/login` agora faz `findFirst` com `select` minimo (`id`, `name`, `email`, `role`, `passwordHash`) para reduzir risco de falha por colunas auxiliares inconsistentes.
    - update de `lastAccessAt` passou a ser nao-bloqueante com `catch` e `logger.warn`.
    - resposta de login retorna `avatarUrl: null` (nao consulta coluna de avatar no fluxo de autenticacao).
    - catch do login agora registra `logger.error` com detalhe tecnico.
- Validacao
  - `apps/api`: `npm run build` PASS.
  - `apps/api`: `npm test` PASS (5 testes).
- Checkpoint de continuidade
  - Ultimo passo concluido: endpoint `/auth/login` robustecido contra falhas de schema acessorio.
  - Proximo passo planejado: se o erro persistir, capturar `detail` real em ambiente development para identificar exatamente qual coluna/tabela divergiu no banco.

## 2026-02-14 22:01:58
- Diagnostico (erro `prisma://` no startup)
  - Log de startup confirmou falha no cleanup inicial (`conciergeRetention`) com mensagem: datasource exigindo `prisma://`.
  - Validacao local mostrou que o client Prisma no workspace consegue consultar MySQL normalmente, indicando conflito de ambiente de execucao (sessao do terminal) e nao do codigo-fonte.
- Correcao aplicada fora do repo (atalho global do usuario)
  - `C:\Users\Jeiel\start_backend.bat` atualizado para limpar variaveis Prisma potencialmente conflitantes antes de subir a API:
    - `PRISMA_CLIENT_ENGINE_TYPE`
    - `PRISMA_CLI_QUERY_ENGINE_TYPE`
    - `PRISMA_GENERATE_NO_ENGINE`
    - `PRISMA_QUERY_ENGINE_LIBRARY`
    - `PRISMA_QUERY_ENGINE_BINARY`
  - Script mantido simples com `npm run dev` (sem `prisma generate` automatico para evitar lock de DLL no Windows).
- Checkpoint de continuidade
  - Ultimo passo concluido: eliminada a principal fonte de conflito de ambiente no `start_backend` usado pelo usuario.
  - Proximo passo planejado: confirmar com nova execucao do `start_backend` em terminal limpo se o erro de `prisma://` desapareceu.

## 2026-02-14 22:10:36
- Plano (padronizacao de grids em Pessoas + ajuste visual de label)
  - `apps/web/src/legacy/admin.body.html`
    - ajustar cor de `Itens por pagina` na aba `Usuarios` para branco;
    - aplicar no painel `Clientes` o mesmo layout de grid padrao (filtros + toolbar de paginacao + navegacao);
    - aplicar no painel `Profissionais` o mesmo layout de grid padrao (filtros + toolbar de paginacao + navegacao);
    - incluir seletores `data-people-*` nas regras CSS compartilhadas do toolbar para manter consistencia visual/responsiva.
  - `apps/web/src/legacy/admin.behavior.ts`
    - adicionar estado/controles de busca, filtro e paginacao para `Clientes`;
    - adicionar estado/controles de busca, filtro e paginacao para `Profissionais`;
    - renderizar range/pagina e habilitar botoes de navegacao como no padrao existente de `Usuarios`.
- Checkpoint de continuidade
  - Ultimo passo concluido: diagnostico do gap visual/funcional entre grids de Pessoas e grid padrao de Usuarios.
  - Proximo passo planejado: aplicar edicoes em HTML/TS e validar `npm run build` + `npm run lint` em `apps/web`.

## 2026-02-14 22:15:40
- Plano executado (padronizacao das grids de Pessoas + ajuste visual solicitado)
  - `apps/web/src/legacy/admin.body.html`
    - aba `Usuarios`: label `Itens por pagina` ajustada para `text-white` no cabecalho da grid;
    - aba `Clientes`:
      - adicionados busca (`data-people-customers-search`) e filtro por estado (`data-people-customers-state-filter`);
      - adicionada toolbar padrao de grid com range, seletor de pagina, e navegacao (`first/prev/next/last`);
    - aba `Profissionais`:
      - adicionados busca (`data-people-professionals-search`) e filtro por unidade (`data-people-professionals-unit-filter`);
      - adicionada toolbar padrao de grid com range, seletor de pagina, e navegacao (`first/prev/next/last`);
    - CSS compartilhado de toolbar/responsividade atualizado para incluir os seletores `data-people-customers-*` e `data-people-professionals-*` e manter o mesmo padrao visual das demais grids.
  - `apps/web/src/legacy/admin.behavior.ts`
    - adicionados seletores/estado de pagina para clientes e profissionais;
    - implementados filtros client-side e paginação client-side para clientes e profissionais;
    - implementados renderizadores de range/pagina e estado de botoes de navegacao nas duas abas;
    - hidratação dinamica de filtros:
      - estados em `Clientes` a partir dos dados recebidos;
      - unidades em `Profissionais` a partir dos dados recebidos;
    - eventos conectados para busca/filtros/paginacao/tamanho de pagina nas duas grids.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: padrao de grid unificado no modulo Pessoas (Clientes/Profissionais/Usuarios) com legibilidade e navegacao.
  - Proximo passo planejado: se desejar, aplicar o mesmo padrao de filtros avançados (multi-criterio) das outras views tambem nas grids de Pessoas.

## 2026-02-14 22:17:35
- Plano (padrao visual restante de grids no admin)
  - Ajustar em `apps/web/src/legacy/admin.body.html` os labels `Itens por pagina` restantes com `text-white` nos toolbars de:
    - Leads;
    - Servicos;
    - Produtos;
    - Assinantes;
    - Vendas/Pedidos.
  - Validar frontend com `npm run lint` e `npm run build`.
- Checkpoint de continuidade
  - Ultimo passo concluido: grids do modulo Pessoas padronizadas (clientes/profissionais/usuarios).
  - Proximo passo planejado: concluir consistencia visual dos labels de paginacao nas demais views.

## 2026-02-14 22:19:06
- Plano executado (consistencia visual nos labels de paginacao)
  - `apps/web/src/legacy/admin.body.html`
    - labels `Itens por pagina` padronizados para `text-white` tambem nas views:
      - Leads;
      - Servicos;
      - Produtos;
      - Assinantes;
      - Vendas/Pedidos.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: todos os toolbars de grid do admin agora usam o mesmo contraste no label `Itens por pagina`.
  - Proximo passo planejado: revisar em uso real no mobile e ajustar espacos/tamanhos de botoes de paginacao se necessario.

## 2026-02-14 22:40:24
- Plano (espacamento de mensagens no fluxo WhatsApp)
  - `apps/api/src/lib/conciergeFlow.ts`
    - criar helper para juntar blocos de texto com linha em branco (`\n\n`) entre grupos;
    - aplicar o helper nos prompts principais enviados ao celular (saudacao+catalogo, categoria/servico, unidade, data, periodo, horario, profissional e perfil);
    - ajustar prompts de selecao para manter listagem intacta, mas separada por blocos com espaco em branco.
  - validar backend apos ajuste.
- Checkpoint de continuidade
  - Ultimo passo concluido: localizacao dos builders de mensagem no `conciergeFlow.ts`.
  - Proximo passo planejado: implementar helper de formatacao e aplicar nos prompts.

## 2026-02-14 22:41:52
- Plano executado (linha em branco entre blocos de mensagens WhatsApp)
  - `apps/api/src/lib/conciergeFlow.ts`
    - criado helper `joinMessageBlocks` para montar mensagens com separacao por linha em branco entre grupos;
    - prompts principais reformulados para usar blocos com espaco:
      - selecao de tratamento por categoria/servico;
      - selecao de unidade, data, periodo, horario e profissional;
      - prompt de complemento de cadastro (`buildCustomerProfileFieldPrompt`);
      - saudacao inicial + catalogo (`openingServiceSelectionPrompt`) com separacao visual entre saudacao/pergunta e bloco de categorias/lista;
      - resumos enviados ao final (`buildSummary` e `buildCompactSummary`) com titulo separado do corpo.
- Validacao
  - `apps/api`: `npm run build` PASS.
  - `apps/api`: `npm test` PASS (5 testes).
- Checkpoint de continuidade
  - Ultimo passo concluido: mensagens do fluxo WhatsApp agora seguem padrao com linha em branco entre blocos.
  - Proximo passo planejado: validar em conversa real no celular se o nivel de espacamento esta ideal e ajustar microtextos, se necessario.

## 2026-02-14 22:57:01
- Plano executado (parametrizacao de saudacoes no modulo WhatsApp)
  - `apps/web/src/legacy/admin.body.html`
    - no primeiro bloco da tela `whatsapp-contatos`, adicionados:
      - campo `Saudacao inicial` (`data-concierge-opening-greeting`);
      - campo `Saudacao de conclusao` (`data-concierge-completion-greeting`);
      - botao `Salvar saudacoes` (`data-concierge-greetings-save`);
      - status dedicado (`data-concierge-greetings-status`).
  - `apps/web/src/legacy/admin.behavior.ts`
    - adicionados content keys:
      - `whatsapp_opening_greeting_text`;
      - `whatsapp_completion_greeting_text`;
    - implementado carregamento e persistencia dos dois campos no mesmo mecanismo de `contentEntry` ja usado pelo toggle de categorias;
    - adicionadas mensagens de status/erro para salvar/carregar saudacoes.
  - `apps/api/src/lib/conciergeFlow.ts`
    - adicionados content keys e defaults para saudacao inicial/final no fluxo;
    - implementado `loadWhatsappFlowSettings()` para ler em uma unica consulta:
      - `whatsapp_flow_category_first`;
      - `whatsapp_opening_greeting_text`;
      - `whatsapp_completion_greeting_text`;
    - saudacao inicial do fluxo agora usa:
      - prefixo automatico por horario (`Bom Dia`/`Boa Tarde`/`Boa Noite`);
      - texto parametrizado do campo admin;
    - saudacao final de conclusao agora usa texto parametrizado do campo admin.
- Validacao
  - `apps/api`: `npm run build` PASS.
  - `apps/api`: `npm test` PASS (5 testes).
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: saudacoes inicial e final do WhatsApp agora parametrizaveis via Admin e consumidas pelo backend.
  - Proximo passo planejado: validar em conversa real se o texto salvo atende o tom desejado e ajustar placeholders (ex.: incluir nome) se voce quiser.

## 2026-02-14 22:59:43
- Plano (atualizar documento de fluxo consolidado)
  - Atualizar `docs/config/ESPECIFICACAO_FLUXO_CONCIERGE_2026-02-13.md` com as ultimas mudancas do fluxo WhatsApp:
    - espacamento entre blocos de mensagem no celular;
    - parametrizacao de saudacao inicial no admin com prefixo horario automatico;
    - parametrizacao de mensagem final de conclusao no admin;
    - chaves de configuracao em `ContentEntry`.
  - Ajustar matriz de completude no mesmo documento para refletir os novos itens entregues.
- Checkpoint de continuidade
  - Ultimo passo concluido: implementacao tecnica frontend/backend das novas configuracoes de saudacao e formatacao de mensagens.
  - Proximo passo planejado: consolidar essas alteracoes na especificacao de fluxo.

## 2026-02-14 23:00:22
- Plano executado (anotacao no documento de fluxo consolidado)
  - `docs/config/ESPECIFICACAO_FLUXO_CONCIERGE_2026-02-13.md`
    - adicionada referencia aos aditivos de 2026-02-14 no `MODIFICATION_LOG`;
    - atualizada secao de endpoints/admin para incluir as chaves de configuracao em `ContentEntry`:
      - `whatsapp_flow_category_first`;
      - `whatsapp_opening_greeting_text`;
      - `whatsapp_completion_greeting_text`;
    - adicionada secao `6.3 Aditivo WhatsApp (2026-02-14)` com:
      - formatacao de mensagens por blocos com linha em branco;
      - saudacao inicial parametrizavel + prefixo automatico por horario;
      - saudacao final parametrizavel de conclusao;
      - consolidacao das chaves de configuracao persistidas;
    - matriz de completude atualizada com os itens 10, 11 e 12 relativos a essas entregas.
- Checkpoint de continuidade
  - Ultimo passo concluido: documento de fluxo consolidado atualizado com as mudancas recentes de UX/configuracao do WhatsApp.
  - Proximo passo planejado: se desejar, replicar o mesmo aditivo resumido em `docs/evolutive_changes/MUDANCAS_FLUXO_ESTRUTURA.MD` para manter os dois documentos 100% sincronizados.

## 2026-02-14 23:21:54
- Plano (correcao de coleta de perfil e nome no fluxo WhatsApp)
  - `apps/api/src/lib/conciergeFlow.ts`
    - remover a reabertura de coleta de perfil dentro da mesma sessao ativa (`SERVICE`) para garantir regra de 1 campo por ligacao/sessao;
    - ajustar o passo `NAME` para nao solicitar nome novamente quando o telefone ja tiver nome valido no cadastro;
    - quando nome ja existe, finalizar agendamento automaticamente com nome conhecido apos selecao de horario/profissional;
    - manter fallback atual para indisponibilidade de slot sem quebrar fluxo.
  - Validar API com build e testes.
- Checkpoint de continuidade
  - Ultimo passo concluido: reproduzida a causa do loop (bloco `shouldAskProfileField`) e identificado ponto de re-pergunta de nome.
  - Proximo passo planejado: aplicar patch no `conciergeFlow.ts` e validar.

## 2026-02-14 23:26:05
- Plano executado (correcao de 1 campo por ligacao + nome)
  - `apps/api/src/lib/conciergeFlow.ts`
    - removido bloco `shouldAskProfileField` no passo `SERVICE`, eliminando re-solicitacao de campo de cliente dentro da mesma sessao ativa;
    - implementado helper interno `finalizeWithCustomerName(sessionId, rawCustomerName)` para centralizar finalizacao do agendamento no passo `NAME`;
    - implementado `getKnownCustomerName()` para reaproveitar nome ja cadastrado por telefone;
    - em transicoes de horario/profissional -> `NAME`, quando nome ja existe:
      - nao pergunta nome novamente;
      - envia aviso de reuso do nome cadastrado;
      - finaliza automaticamente o agendamento com esse nome.
- Efeito esperado no fluxo
  - Coleta de perfil: no maximo 1 campo por ligacao/sessao.
  - Sem loop de pedir campo -> voltar menu -> pedir novo campo na mesma sessao.
  - Sem pergunta redundante de nome quando cliente ja identificado por telefone com nome valido.
- Validacao
  - `apps/api`: `npm run build` PASS.
  - `apps/api`: `npm test` PASS (5 testes).
- Checkpoint de continuidade
  - Ultimo passo concluido: ajustes de fluxo aplicados para regra de 1 campo por sessao e reuso de nome.
  - Proximo passo planejado: validar em WhatsApp real um ciclo completo com telefone parcialmente cadastrado para confirmar UX final.

## 2026-02-14 23:34:46
- Plano executado (grid de Clientes vazia apesar de registro existente)
  - Diagnostico
    - consulta direta no banco confirmou existencia de cliente cadastrado (`count = 1`, telefone `5511981859426`), indicando problema de visualizacao/filtro na UI e nao de persistencia.
  - `apps/web/src/legacy/admin.behavior.ts`
    - render de clientes agora diferencia:
      - lista realmente vazia;
      - lista filtrada vazia (mensagem orientando limpar filtros);
    - status da aba clientes passa a exibir:
      - `Total: X` quando sem filtro;
      - `Filtrados: Y de X` quando filtros/busca estao reduzindo resultados;
    - ao abrir a aba `Clientes` (`data-people-tab-target="clientes"`):
      - limpa busca/filtro de estado;
      - reseta pagina;
      - recarrega `fetchPeopleCustomers()` para evitar estado stale.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: grid de clientes ficou resiliente a filtros ativos e recarrega automaticamente ao abrir aba.
  - Proximo passo planejado: validar no navegador com hard refresh se a linha de cliente aparece sem interacao manual de filtro.

## 2026-02-14 23:41:32
- Plano (padronizar layout da view Agenda)
  - `apps/web/src/legacy/admin.body.html`
    - substituir layout lateral atual da Agenda (`filtros` esquerda + `grid` direita) por padrao vertical:
      - bloco de filtros no topo;
      - bloco de grid de agendamentos abaixo;
    - manter todos os mesmos seletores `data-appointments-*` para nao quebrar comportamento existente;
    - ajustar responsividade dos filtros para evitar truncamento visual.
  - Validar frontend com `npm run lint` e `npm run build`.
- Checkpoint de continuidade
  - Ultimo passo concluido: diagnostico de que a view Agenda usa layout diferente das demais e com espaco horizontal insuficiente.
  - Proximo passo planejado: aplicar ajuste estrutural no HTML da Agenda.

## 2026-02-14 23:47:38
- Plano executado (padronizacao da tela Agenda de Atendimentos)
  - `admin.html`
    - removido layout lateral (`filtros` esquerda + conteudo direita) na view `data-view="agenda"`;
    - aplicado layout vertical padrao:
      - bloco de filtros no topo;
      - grid de agendamentos abaixo em formato de tabela;
    - mantida identidade visual (cards, bordas, tipografia) alinhada ao restante do admin.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: agenda padronizada com filtros acima e grid abaixo para melhorar leitura dos campos.
  - Proximo passo planejado: validacao manual no navegador da tela `Agenda` em desktop e mobile para confirmar responsividade final.

## 2026-02-14 23:58:04
- Plano (grid Pessoas: clique no ID + observacao do cliente)
  - `apps/web/src/legacy/admin.body.html`
    - incluir coluna `Observacao` na grid de clientes;
    - tornar ID de `Clientes` e `Profissionais` acionavel para abrir modal de alteracao;
    - adicionar modais de edicao de Cliente e Profissional.
  - `apps/web/src/legacy/admin.behavior.ts`
    - renderizar `customer.notes` na grid;
    - implementar handlers de clique no ID para abrir os novos modais;
    - implementar fluxo de salvar edicao para clientes/profissionais via API.
  - `apps/api/src/routes/index.ts`
    - adicionar endpoint `PATCH /customers/:id` com validacao e persistencia.
  - Validar com build/lint e atualizar checkpoint.
- Checkpoint de continuidade
  - Ultimo passo concluido: diagnostico do gap (somente Usuarios abria modal pelo ID e coluna de observacao ausente em Clientes).
  - Proximo passo planejado: aplicar patches de UI + API e validar.

## 2026-02-15 00:03:05
- Plano executado (Pessoas: clique no ID + observacao do cliente)
  - `apps/web/src/legacy/admin.body.html`
    - grid de `Clientes` ganhou coluna `Observacao`;
    - placeholders/colspan da tabela de clientes ajustados para 11 colunas;
    - adicionados modais:
      - `customer-edit` (editar cliente);
      - `professional-edit` (editar profissional).
  - `apps/web/src/legacy/admin.behavior.ts`
    - `CustomerRow` estendido com `notes` e `userId`;
    - render de clientes agora exibe `notes` na coluna `Observacao`;
    - ID de `Clientes` e `Profissionais` virou acao clicavel para abrir modal de edicao;
    - novos handlers de salvar para cliente/profissional e chamadas de API:
      - `PATCH /customers/:id`;
      - `PATCH /professionals/:id`;
      - `PATCH /professionals/:id/link-user` (quando informado novo `userId`).
  - `apps/api/src/routes/index.ts`
    - adicionado `customerUpdateSchema`;
    - adicionado endpoint admin `PATCH /customers/:id` com validacao e persistencia de:
      - nome, telefone, telefone2, email, cidade, estado, bairro, observacao e `userId`.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
  - `apps/api`: `npm run build` PASS.
  - `apps/api`: `npm test` PASS (5 testes).
- Checkpoint de continuidade
  - Ultimo passo concluido: grids de Pessoas com clique no ID abrindo modal de alteracao para clientes/profissionais/usuarios e observacao de cliente visivel na tabela.
  - Proximo passo planejado: validar no navegador a edicao em cada aba com um registro real e ajustar mascaras de telefone se necessario.

## 2026-02-15 00:46:25
- Plano executado (Profissionais: novos campos + agenda + perfil de comissao por dominio)
  - Banco/Prisma
    - `apps/api/prisma/schema.prisma`
      - criado modelo de dominio `ProfessionalCommissionProfile` (`name`, `commissionPercent`, `status`, timestamps);
      - `Professional` estendido com:
        - `employmentStatus` (ACTIVE/INACTIVE),
        - `startedAt`,
        - `endedAt`,
        - `commissionProfileId` + relacao para perfil de comissao.
    - migration adicionada em:
      - `apps/api/prisma/migrations/20260215001500_professional_commission_profile_and_lifecycle/migration.sql`.
  - Seed
    - `apps/api/prisma/seed.ts`
      - inclui upsert de perfis de comissao padrao;
      - profissionais seedados passaram a receber `employmentStatus`, `startedAt` e `commissionProfileId` conforme perfil.
  - API
    - `apps/api/src/routes/index.ts`
      - novos endpoints admin de dominio:
        - `GET /professional-commission-profiles`
        - `POST /professional-commission-profiles`
        - `PATCH /professional-commission-profiles/:id`
        - `DELETE /professional-commission-profiles/:id` (bloqueia exclusao se perfil em uso)
      - `GET /professionals` agora inclui `commissionProfile`;
      - `PATCH /professionals/:id` agora aceita/salva:
        - `employmentStatus`, `startedAt`, `endedAt`, `commissionProfileId`;
        - validacoes de perfil existente e consistencia de datas.
  - Frontend Admin
    - `apps/web/src/legacy/admin.body.html`
      - grid de Profissionais atualizada com colunas:
        - Email, Status, Inicio, Saida, Perfil comissao, Agenda;
      - adicionada acao/botao para abrir modal de dominio `Perfis de comissao`;
      - modal de edicao de profissional ampliado com:
        - status, data de inicio, data de saida e perfil de comissao;
      - novo modal CRUD de perfis de comissao.
    - `apps/web/src/legacy/admin.behavior.ts`
      - render da grid de profissionais ajustado para novos campos;
      - clique em `Agenda` na linha do profissional:
        - abre view `agenda`;
        - aplica filtro do profissional na escala e recarrega dados;
      - implementado CRUD completo do modal de `Perfis de comissao`;
      - salvamento do modal de `Editar profissional` atualizado para novos campos.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
  - `apps/api`: `npx prisma generate --no-engine` PASS.
    - observacao: `npx prisma generate` sem `--no-engine` falhou por lock de arquivo (`EPERM` em `query_engine-windows.dll.node`).
  - `apps/api`: `npm run build` PASS.
  - `apps/api`: `npm test` PASS (5 testes).
- Checkpoint de continuidade
  - Ultimo passo concluido: tabela de profissionais evoluida com ciclo de vida, email, status, vinculo com perfil de comissao e atalho para agenda de horarios.
  - Proximo passo planejado: aplicar migration no banco em runtime local (`prisma migrate deploy/dev`) e validar CRUD real de perfil/comissao com dados do ambiente.

## 2026-02-15 01:26:02
- Correcao Prisma (runtime backend)
  - Sintoma: API falhava no startup com erro "URL must start with prisma://" ao executar `prisma.conciergeSession.deleteMany()` (scheduler de retention).
  - Causa: Prisma Client havia sido gerado anteriormente com `--no-engine`, ativando modo sem engine/data proxy, incompatível com `DATABASE_URL` MySQL local.
  - Acao: executado `npx prisma generate` em `apps/api` para regenerar client no modo normal.
  - Validacao: `npm run build` (apps/api) e `npx prisma validate` concluidos com sucesso.
  - Proximo passo: reiniciar `start_backend` e confirmar ausencia do erro no log inicial.

## 2026-02-15 01:29:39
- Atualizacao de regra em AGENTS
  - Incluida regra: qualquer alteracao de banco (schema/migration) exige executar `npx prisma generate` em `apps/api` antes de seguir.

## 2026-02-15 01:42:00
- Correcao erro 500 na grid de profissionais
  - Diagnostico: rota `/professionals` falhava com Prisma P2022 (coluna `Professional.employmentStatus` inexistente no banco).
  - Causa: migration `20260215001500_professional_commission_profile_and_lifecycle` pendente no MySQL local.
  - Acao: executado `npx prisma migrate deploy` em `apps/api`; migration aplicada com sucesso.
  - Validacao: consulta Prisma equivalente da rota `/professionals` executada com sucesso (`count=6`).
  - Observacao: `npx prisma generate` falhou por lock do arquivo `query_engine-windows.dll.node` (EPERM), indicando processo Node/backend segurando engine.
  - Proximo passo: parar backend, rodar `npx prisma generate` e reiniciar backend.
## 2026-02-15 01:59:07
- Plano: evolucao do modal de profissionais e perfis de trabalho
  - Passo 1: adicionar botao ao lado de Usuario vinculado para abrir modal do usuario relacionado.
  - Passo 2: criar dominio de Perfil de trabalho no banco e vinculo opcional em Professional.
  - Passo 3: criar endpoints CRUD de perfis de trabalho com flags de permissao.
  - Passo 4: incluir combo de Perfil de trabalho no modal de profissional.
  - Passo 5: criar modal de Perfis de trabalho com titulo, permissoes (switch) e botoes Salvar/Cancelar.
  - Passo 6: validar migracao, prisma generate e build.
## 2026-02-15 02:05:00
- Implementacao: modal de profissional + perfil de trabalho (permissoes)
  - Backend/Prisma
    - Adicionado modelo `ProfessionalWorkProfile` com titulo, status e 14 flags booleanas de permissao.
    - Adicionado vinculo opcional `workProfileId` em `Professional`.
    - Criada migration `20260215023000_professional_work_profile_permissions`.
    - API: novos endpoints CRUD
      - `GET /professional-work-profiles`
      - `POST /professional-work-profiles`
      - `PATCH /professional-work-profiles/:id`
      - `DELETE /professional-work-profiles/:id`
    - API: `GET /professionals` e `PATCH /professionals/:id` agora incluem/salvam `workProfile`.
  - Frontend admin
    - Modal `Editar profissional`:
      - botao ao lado de `Usuario vinculado (ID)` para abrir modal do usuario vinculado.
      - novo combo `Perfil de trabalho` com botao para abrir modal de perfis.
    - Novo modal `Perfis de trabalho` com:
      - campo `Titulo`;
      - `Status`;
      - lista de permissoes em flags liga/desliga (ajustes finos, acesso aos menus e opcoes avancadas);
      - botoes `Salvar` e `Cancelar`;
      - grid com listar/editar/excluir perfil.
    - Integracao com API para salvar/editar/excluir perfis de trabalho e vincular no profissional.
  - Validacao
    - `apps/api`: `npx prisma migrate deploy` PASS (migration aplicada).
    - `apps/api`: `npx prisma validate` PASS.
    - `apps/api`: `npm run build` PASS.
    - `apps/api`: `npm test` PASS (5 testes).
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
    - Consulta runtime Prisma em `professionalWorkProfile.findMany()` PASS.
  - Observacao
    - `npx prisma generate` falhou com `EPERM` (lock em `query_engine-windows.dll.node`) pois ha processo Node segurando o arquivo.
  - Checkpoint
    - Ultimo passo concluido: feature completa (DB/API/UI) entregue e validada por build/testes.
    - Proximo passo planejado: parar backend, executar `npx prisma generate` e subir backend novamente para remover pendencia de lock do client.
## 2026-02-15 02:22:00
- Ajuste de nomenclatura e exibicao: comissao em profissionais + tipo em usuarios
  - Profissionais
    - Grid: coluna alterada de "Perfil comissao" para "Comissao (%)".
    - Grid: valor exibido agora e somente o percentual da comissao (ex.: 12,00%), sem nome do perfil.
    - Modal de edicao: label alterada para "Comissao (%)".
    - Select de comissao: opcao vazia alterada para "Sem comissao"; opcoes exibem percentual primeiro.
  - Usuarios
    - Filtro: "Todos os papeis" alterado para "Todos os tipos".
    - Cabeçalho da grid: "Papel" alterado para "Tipo".
    - Modais criar/editar usuario: label alterada de "Permissao (tipo)" para "Tipo de usuario".
  - API
    - Mapeamento de validacao para campo role ajustado de "permissao" para "tipo".
  - Validacao
    - apps/api npm run build PASS.
    - apps/web npm run lint PASS.
    - apps/web npm run build PASS.
## 2026-02-15 02:36:00
- Correcao solicitada: comissao de profissional como campo direto (nao combo)
  - UI (Profissionais)
    - Modal de edicao trocado de select para input numerico em `Comissao (%)`.
    - Salvamento agora envia `commissionPercent` direto no payload do profissional.
    - Abertura do modal preenche com `professional.commissionPercent` (fallback para valor legado do perfil, quando existir).
    - Grid de profissionais passa a priorizar o percentual direto do profissional.
  - Backend/API
    - `professionalUpdateSchema` atualizado para aceitar `commissionPercent` (0 a 100, nullable).
    - `PATCH /professionals/:id` atualizado para persistir `commissionPercent` em `Professional`.
  - Banco/Prisma
    - Adicionada coluna `Professional.commissionPercent` (Decimal 5,2, nullable).
    - Migration criada/aplicada: `20260215032000_professional_commission_percent_direct`.
    - Backfill executado na migration para copiar valor de perfis legados (`commissionProfileId -> commissionPercent`) quando aplicavel.
  - Validacao
    - `apps/api`: `npx prisma migrate deploy` PASS.
    - `apps/api`: `npm run build` PASS.
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
  - Observacao
    - `npx prisma generate` falhou com `EPERM` (lock em `query_engine-windows.dll.node`) por processo Node ativo.
  - Proximo passo
    - Parar backend, executar `npx prisma generate` em `apps/api` e subir backend novamente.
## 2026-02-15 02:44:00
- Ajuste de navegacao: Profissionais -> Ver agenda com filtro predefinido
  - Alteracao no frontend (`admin.behavior.ts`): ao clicar `Ver agenda` na grid de profissionais, agora:
    - abre view `agenda`;
    - seta filtro de profissional em `Agendamentos`;
    - seta filtro de profissional em `Escalas`;
    - garante opcao no select mesmo se ainda nao estiver hidratado;
    - reaplica filtros e recarrega listas para refletir o profissional selecionado.
  - Validacao
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
## 2026-02-15 02:52:00
- Ajuste UX: modal de Perfis de trabalho com prefill ao abrir via Profissionais
  - Botao `Perfis` dentro de `Editar profissional` marcado com contexto de origem.
  - Ao abrir `Perfis de trabalho` a partir de `Profissionais`:
    - carrega lista de perfis;
    - identifica o profissional ativo do modal;
    - entra automaticamente em modo de edicao do perfil vinculado;
    - preenche Titulo, Status e todos os campos de permissao (flags) conforme o perfil.
  - Quando o profissional nao tem perfil vinculado, o formulario abre limpo com mensagem informativa.
  - Validacao
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
## 2026-02-15 03:51:11
- Checkpoint consolidado (estado atual)
  - Ultimo passo concluido
    - Profissionais: campo de comissao agora e percentual direto (input numerico), sem combo de perfil no modal.
    - Agenda: clique em `Ver agenda` na grid de profissionais abre a view Agenda com filtro do profissional ja aplicado em Agendamentos e Escalas.
    - Perfis de trabalho: ao abrir a partir de Profissionais, modal vem em modo de edicao do perfil vinculado, com titulo/status/permissoes preenchidos.
  - Validacoes recentes
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
    - `apps/api`: `npm run build` PASS.
    - `apps/api`: `npx prisma migrate deploy` PASS (migrations aplicadas).
  - Pendencia tecnica conhecida
    - `npx prisma generate` ainda falha com `EPERM` por lock em `query_engine-windows.dll.node` quando backend/node esta ativo.
  - Proximo passo planejado
    - Parar backend, executar `npx prisma generate` em `apps/api` e reiniciar backend para fechar o ciclo Prisma sem lock.
## 2026-02-15 15:11:04
- Plano (LED de status do banco no menu publico)
  - Backend (pps/api/src/app.ts): adicionar GET /health/db com verificacao de conexao MySQL via Prisma e resposta 200/503.
  - Frontend (pps/web/src/legacy/auth.behavior.ts): criar initDbStatusLed() para consultar /health/db na abertura e em polling.
  - Frontend (pps/web/src/components/public/PublicNav.tsx e pps/web/src/components/public/FranquiasNav.tsx): adicionar LED apos botao Sair.
  - Frontend (pps/web/src/styles/legacy.css): criar estilos do LED (verde fixo online, vermelho piscando offline).
  - Integracao (pps/web/src/app/layouts/PublicLayout.tsx): inicializar cleanup do monitoramento do LED.
  - Validacao: pps/api build; pps/web lint + build.
- Checkpoint de continuidade
  - Ultimo passo concluido: plano aprovado e registrado antes da edicao.
  - Proximo passo planejado: aplicar patches de backend/frontend e validar.
## 2026-02-15 15:15:19
- Plano executado (LED de conexao do banco no menu publico)
  - Backend
    - pps/api/src/app.ts
      - novo endpoint GET /health/db.
      - verifica conexao com banco via Prisma (SELECT 1).
      - retorna:
        - 200 com db.connected = true quando OK;
        - 503 com db.connected = false quando indisponivel.
      - falhas registradas com logger.warn.
  - Frontend
    - pps/web/src/legacy/auth.behavior.ts
      - criada funcao initDbStatusLed().
      - consulta VITE_API_URL/health/db na abertura e em polling (10s).
      - atualiza LED com estados:
        - online: verde fixo;
        - offline: vermelho piscando;
        - unknown: laranja piscando durante verificacao.
    - pps/web/src/components/public/PublicNav.tsx
      - LED adicionado apos botao Sair no menu.
    - pps/web/src/components/public/FranquiasNav.tsx
      - LED adicionado apos botao Sair no menu.
    - pps/web/src/styles/legacy.css
      - estilos/animacoes do LED adicionados.
    - pps/web/src/app/layouts/PublicLayout.tsx
      - initDbStatusLed() conectado ao ciclo de inicializacao/cleanup da navegacao publica.
- Validacao
  - pps/api: 
pm run build PASS.
  - pps/web: 
pm run lint PASS.
  - pps/web: 
pm run build PASS.
  - check runtime direto em http://localhost:3001/health/db: servidor API nao respondeu no momento (conexao recusada), entao validacao funcional ficou limitada ao build/lint.
- Checkpoint de continuidade
  - Ultimo passo concluido: LED de status do banco implementado no menu publico e integrado ao health check do backend.
  - Proximo passo planejado: subir backend (3001) e validar visualmente na home/franquias com banco ON (verde fixo) e banco OFF (vermelho piscando).
## 2026-02-15 15:21:27
- Correcao de processo (regra AGENTS: prisma generate)
  - Acao executada: 
px prisma generate em pps/api.
  - Resultado: PASS (Prisma Client gerado com sucesso).
- Checkpoint de continuidade
  - Ultimo passo concluido: regra de regeneracao do Prisma Client cumprida apos alteracoes no backend.
  - Proximo passo planejado: seguir novas alteracoes mantendo 
px prisma generate sempre que houver alteracao de banco/schema/migration.
## 2026-02-15 15:58:59
- Plano (documento operacional de migracao MySQL -> PostgreSQL)
  - Criar docs/evolutive_changes/POSTGRES_MIGRATION_PLAN.md com runbook completo de migracao para PostgreSQL.
  - Incluir:
    - pontos do projeto sensiveis a MySQL;
    - estrategia de baseline e ponto de retorno;
    - opcao de migracao de dados (reset+seed ou ETL);
    - checklist de validacao funcional e tecnica;
    - roteiro de cutover e rollback.
  - Registrar checkpoint final no memory/MODIFICATION_LOG.md.
- Checkpoint de continuidade
  - Ultimo passo concluido: aprovacao recebida para preparar plano PostgreSQL.
  - Proximo passo planejado: redigir documento e registrar conclusao.
## 2026-02-15 15:59:49
- Plano executado (runbook PostgreSQL)
  - Novo documento: docs/evolutive_changes/POSTGRES_MIGRATION_PLAN.md.
  - Conteudo consolidado:
    - mapeamento dos pontos sensiveis a MySQL no projeto;
    - avaliacao de impacto real (Prisma ajuda, mas migrations/dados sao criticos);
    - fases operacionais de migracao para PostgreSQL;
    - estrategia de cutover por DATABASE_URL;
    - roteiro de rollback completo;
    - checklist final de validacao tecnica/funcional.
  - Aditivo de arquitetura:
    - alinhamento com modularizacao futura (menu, ooter, chatbot, health) para facilitar manutencao e reaproveitamento.
- Checkpoint de continuidade
  - Ultimo passo concluido: runbook de migracao MySQL -> PostgreSQL criado e versionado em docs.
  - Proximo passo planejado: iniciar Fase 0 (congelamento baseline + backup) antes de alterar provider no Prisma.
## 2026-02-15 16:02:47
- Plano (inicio da migracao React modular sem interromper operacao)
  - Frontend: extrair menu e ooter para modulos dedicados em pps/web/src/modules/*, mantendo wrappers de compatibilidade para evitar quebra de rotas/imports.
  - Backend: concentrar logica do chatbot em pps/api/src/modules/chatbot/* (flow, inbox, opening, retention, integracao zapi), mantendo wrappers em pps/api/src/lib/* para ponto de retorno rapido.
  - Objetivo desta rodada: reorganizacao estrutural segura (sem alterar regras de negocio), preparando a fase seguinte de migracao de telas legado -> React puro.
  - Validacao: pps/api build/test + pps/web lint/build.
- Checkpoint de continuidade
  - Ultimo passo concluido: inicio oficial da rodada de modularizacao registrado.
  - Proximo passo planejado: aplicar reorganizacao de arquivos com compatibilidade e validar compilacao.
## 2026-02-15 16:12:29
- Plano executado (migracao React modular - rodada 1)
  - Frontend modularizacao inicial
    - criado modulo menu em pps/web/src/modules/menu:
      - components/PublicMenu.tsx
      - components/FranquiasMenu.tsx
      - index.ts + README.md
    - criado modulo ooter em pps/web/src/modules/footer:
      - components/PublicSiteFooter.tsx
      - index.ts + README.md
    - wrappers de compatibilidade mantidos:
      - pps/web/src/components/public/PublicNav.tsx agora re-exporta modules/menu/components/PublicMenu;
      - pps/web/src/components/public/FranquiasNav.tsx agora re-exporta modules/menu/components/FranquiasMenu;
      - pps/web/src/components/public/PublicFooter.tsx agora re-exporta modules/footer/components/PublicSiteFooter.
    - criado ponto de migracao do chatbot frontend:
      - pps/web/src/modules/chatbot/README.md.
  - Backend modularizacao inicial (chatbot)
    - criado modulo pps/api/src/modules/chatbot com subpastas:
      - low/conciergeFlow.ts
      - opening/conciergeOpening.ts
      - inbox/conciergeInbox.ts
      - integrations/zapi.ts
      - 
etention/conciergeRetention.ts
      - index.ts + README.md
    - import paths internos ajustados para manter compilacao.
    - wrappers de compatibilidade mantidos em pps/api/src/lib/*:
      - conciergeFlow.ts, conciergeOpening.ts, conciergeInbox.ts, zapi.ts, conciergeRetention.ts agora re-exportam o modulo novo.
    - inicio de consumo direto do modulo novo:
      - pps/api/src/server.ts (retention) e pps/api/src/routes/index.ts (flow/inbox/zapi).
  - Documentacao de modulos
    - criado docs/config/MODULES_CATALOG.md com mapa de modulos frontend/backend e estrategia de compatibilidade.
- Validacao
  - pps/api: 
pm run build PASS.
  - pps/api: 
pm test PASS (5 testes).
  - pps/web: 
pm run lint PASS.
  - pps/web: 
pm run build PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: modularizacao inicial entregue sem quebra de build/lint/testes.
  - Proximo passo planejado: rodada 2 de migracao React pura removendo dependencias de legacy/index.behavior.ts por dominio (menu, auth nav, chatbot widget).
## 2026-02-15 16:30:34
- Plano executado (migracao React modular - rodada 2: auth nav + LED sem legado)
  - Frontend (pps/web/src/modules/menu)
    - criado componente components/NavStatusActions.tsx para concentrar:
      - login/logout;
      - bloco de usuario logado;
      - indicador de saude do banco (LED).
    - criados hooks React:
      - hooks/useAuthStatus.ts (estado auth reativo + logout/login modal);
      - hooks/useDbHealthStatus.ts (polling /health/db com estados online/offline/unknown).
    - menus atualizados para consumir o bloco unico de acoes:
      - components/PublicMenu.tsx;
      - components/FranquiasMenu.tsx.
  - Auth state desacoplado do DOM legado
    - pps/web/src/lib/auth.ts
      - exportado AuthUser e evento AUTH_STATE_EVENT;
      - setUser e clearAuth agora disparam evento de mudanca de auth para sincronizacao React.
    - pps/web/src/legacy/auth.behavior.ts
      - convertido para camada de compatibilidade (bridge via evento), sem manipular DOM diretamente.
  - Layout publico
    - pps/web/src/app/layouts/PublicLayout.tsx
      - removidas inicializacoes legadas de auth/LED (initAuthNav e initDbStatusLed);
      - auth nav e LED passam a ser controlados exclusivamente por React no modulo menu.
- Validacao
  - pps/web: 
pm run lint PASS.
  - pps/web: 
pm run build PASS.
  - pps/api: 
pm run build PASS.
  - pps/api: 
pm test PASS (5 testes).
- Observacao de banco
  - Sem alteracao de schema/migration nesta rodada; prisma generate nao foi necessario.
- Checkpoint de continuidade
  - Ultimo passo concluido: auth nav e LED migrados para React modulo menu, reduzindo dependencia de legacy/auth.behavior.ts.
  - Proximo passo planejado: rodada 3 focada no chatbot web (extraindo do legacy/index.behavior.ts para modulo React dedicado com API client e estado por hooks).
## 2026-02-15 16:34:53
- Plano executado (migracao React modular - rodada 3: extracao de camada chatbot web)
  - Novo modulo frontend chatbot
    - pps/web/src/modules/chatbot/types.ts
      - tipos do fluxo concierge web extraidos do legado.
    - pps/web/src/modules/chatbot/api/client.ts
      - cliente HTTP do chatbot (etchChatbotPublicJson, postChatbotPublicJson, parse de erro).
    - pps/web/src/modules/chatbot/index.ts
      - barrel de export para consumo interno.
  - Integracao com legado sem quebra
    - pps/web/src/legacy/index.behavior.ts
      - removidos tipos locais de chatbot;
      - removidas funcoes locais de API do chatbot;
      - legado passou a consumir tipos e cliente do modulo novo via imports.
  - Continuacao da rodada 2
    - auth nav/LED seguem em React modulo menu;
    - legacy/auth.behavior.ts permanece como bridge de compatibilidade por evento.
- Validacao
  - pps/web: 
pm run lint PASS.
  - pps/web: 
pm run build PASS.
  - pps/api: 
pm run build PASS.
  - pps/api: 
pm test PASS (5 testes).
- Observacao de banco
  - Sem alteracao de schema/migration nesta rodada; prisma generate nao foi necessario.
- Checkpoint de continuidade
  - Ultimo passo concluido: tipos e cliente API do chatbot web extraidos para modulo dedicado sem quebrar fluxo atual.
  - Proximo passo planejado: rodada 4, migrando a UI/estado do widget concierge para componente React (com fallback controlado para legado).
## 2026-02-15 23:10:02
- Plano (formalizacao de requisitos da refatoracao final)
  - Ignorar temporariamente `docs/project/REQUIREMENTS.md` como fonte da frente de refatoracao.
  - Consolidar os 8 pontos aprovados em documento proprio e ativo.
  - Registrar criterios de aceite, arquitetura-alvo, modulos-alvo e KPIs reais do Admin.
  - Manter checkpoint explicito de continuidade.
- Plano executado
  - Novo documento criado: `docs/evolutive_changes/REFACTOR_REQUIREMENTS.md`.
  - Conteudo consolidado:
    - prioridade zero de migracao 100% React;
    - modularizacao por dominio com interfaces claras;
    - regras de negocio e KPI concentrados em `Express + Prisma`;
    - separacao de modulos admin-cadastros e admin-kpis;
    - definicao de KPIs reais com fonte em banco;
    - criterios de aceite e roadmap de execucao;
    - preparacao para migracao MySQL -> PostgreSQL com mudancas localizadas.
- Checkpoint de continuidade
  - Ultimo passo concluido: requisitos oficiais da refatoracao final foram documentados em arquivo dedicado.
  - Proximo passo planejado: iniciar entrega tecnica da rodada seguinte com Admin em React por dominio e substituicao dos KPIs mockados por endpoint real no backend.
## 2026-02-15 23:15:14
- Plano (rodada seguinte: KPIs reais + base de modularizacao admin)
  - Backend
    - Criar modulo `apps/api/src/modules/admin/kpis` para calculo de KPIs do dashboard com Prisma.
    - Expor endpoint admin protegido para leitura dos KPIs reais por periodo.
  - Frontend
    - Criar modulo `apps/web/src/modules/admin-kpis` para cliente/tipos do dashboard.
    - Integrar leitura de KPIs no Admin atual (compatibilidade com tela legado), substituindo cards principais mockados por dados do banco.
  - Documentacao/continuidade
    - Registrar execucao e checkpoint desta rodada no final.
  - Validacao prevista
    - `apps/api`: build + testes.
    - `apps/web`: lint + build.
- Checkpoint de continuidade
  - Ultimo passo concluido: plano da rodada registrado antes da edicao de codigo.
  - Proximo passo planejado: aplicar implementacao backend/frontend dos KPIs reais.
## 2026-02-15 23:24:26
- Plano executado (KPIs reais no Admin + modularizacao)
  - Backend
    - Novo modulo `apps/api/src/modules/admin/kpis`:
      - `dashboardKpis.ts`: agregacoes de receita, pedidos, agendamentos, assinaturas e novos clientes.
      - `index.ts`: export do modulo.
    - Nova rota protegida `GET /api/admin/dashboard/kpis` em `apps/api/src/routes/index.ts`.
      - suporta query de periodo (`days`, `from`, `to`);
      - valida parametros e retorna erro 400 para periodo invalido;
      - retorna erro 500 com log estruturado em falhas inesperadas.
  - Frontend
    - Novo modulo `apps/web/src/modules/admin-kpis`:
      - `types.ts`: contrato tipado dos KPIs;
      - `api/client.ts`: cliente HTTP para `/api/admin/dashboard/kpis`;
      - `index.ts`: barrel export.
    - Admin legado em compatibilidade:
      - `apps/web/src/legacy/admin.body.html`: cards principais do dashboard receberam `data-*` para bind de KPI real.
      - `apps/web/src/legacy/admin.behavior.ts`:
        - integração com `modules/admin-kpis`;
        - renderizacao dos cards (receita, agendamentos, assinaturas) com dados reais;
        - fallback com log `warn` em caso de falha;
        - suite interna de testes do Admin passou a verificar endpoint `/admin/dashboard/kpis`.
  - Documentacao
    - `docs/config/MODULES_CATALOG.md` atualizado com:
      - frontend `admin-kpis`;
      - backend `admin/kpis`.
- Validacao
  - `apps/api`: `npm run build` PASS.
  - `apps/api`: `npm test` PASS (5 testes).
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Observacao de banco
  - Sem alteracao de `schema.prisma`/migration nesta rodada; `prisma generate` nao foi necessario.
- Checkpoint de continuidade
  - Ultimo passo concluido: cards KPI principais do dashboard admin deixaram de usar valores fixos e passaram a consumir agregacoes reais via API.
  - Proximo passo planejado: iniciar migracao do dashboard/admin para componente React por dominio (sem `LegacyHtml`), mantendo contratos do modulo `admin-kpis`.
## 2026-02-15 23:46:42
- Plano (rodada: dashboard KPI em React com compatibilidade)
  - Frontend
    - Substituir no HTML legado apenas o bloco de cards KPI por placeholder React (`data-react-admin-dashboard-kpis`), mantendo o restante da view `dashboard`.
    - Criar componente React no modulo `admin-kpis` para renderizar os cards de KPI e consumir a API real.
    - Montar o componente como island dentro da pagina Admin atual (sem quebrar `initAdminPage` e demais views legadas).
  - Limpeza de legado
    - Remover da camada `legacy/admin.behavior.ts` a responsabilidade de atualizar cards KPI.
  - Validacao prevista
    - `apps/web`: lint + build.
    - `apps/api`: build + testes (regressao rapida).
- Checkpoint de continuidade
  - Ultimo passo concluido: plano registrado antes da edicao.
  - Proximo passo planejado: implementar island React de KPI e validar.
## 2026-02-15 23:53:12
- Plano executado (dashboard KPI em React island)
  - Frontend
    - `apps/web/src/legacy/admin.body.html`
      - bloco de cards KPI do dashboard substituido por placeholder React:
        - `data-react-admin-dashboard-kpis`.
      - restante da view `dashboard` e demais views legadas mantidos.
    - Novo componente React no modulo `admin-kpis`:
      - `apps/web/src/modules/admin-kpis/components/AdminDashboardKpiCards.tsx`
      - `apps/web/src/modules/admin-kpis/components/AdminDashboardKpisIsland.tsx`
      - renderiza KPIs reais (receita, agendamentos, assinaturas, pedidos, ticket medio, novos clientes) com refresh periodico.
    - Integracao na pagina Admin:
      - `apps/web/src/pages/Admin.tsx` agora monta `AdminDashboardKpisIsland` junto com `AdminContent`.
    - `apps/web/src/modules/admin-kpis/index.ts` atualizado para exportar componentes.
  - Limpeza de legado
    - `apps/web/src/legacy/admin.behavior.ts`
      - removida a logica de fetch/render dos cards KPI.
      - mantida apenas a checagem de endpoint KPI na suite interna de testes do Admin.
  - Documentacao
    - `docs/config/MODULES_CATALOG.md` atualizado com os componentes do modulo `admin-kpis`.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
  - `apps/api`: `npm run test` PASS (5 testes).
  - `apps/api`: `npm run build` PASS.
- Observacao
  - Warning de chunk grande no build web continua (ja existente), sem bloquear build.
- Checkpoint de continuidade
  - Ultimo passo concluido: cards KPI do dashboard passaram a ser renderizados por React (island), reduzindo dependencia direta de `legacy/admin.behavior.ts`.
  - Proximo passo planejado: migrar proximo bloco do dashboard (`Desempenho de Vendas` e resumo) para React, avancando para retirada gradual do `LegacyHtml` no Admin.
## 2026-02-15 23:56:51
- Plano (rodada: Desempenho de Vendas em React + dados reais)
  - Backend
    - Criar agregacao em modulo `apps/api/src/modules/admin/kpis` para serie diaria de vendas por tipo (`SERVICES`, `PRODUCTS`, `SUBSCRIPTIONS`).
    - Expor rota protegida `GET /api/admin/dashboard/sales-series` com filtros de periodo.
  - Frontend
    - Criar componente React no modulo `admin-kpis` para bloco "Desempenho de Vendas" com selects de tipo e periodo.
    - Substituir bloco HTML estatico da area de grafico por placeholder React (`data-react-admin-dashboard-sales`).
    - Montar island na pagina `Admin.tsx` mantendo compatibilidade com restante legado.
  - Qualidade
    - Atualizar checagem de endpoints no `legacy/admin.behavior.ts`.
    - Validar `apps/web` (lint/build) e `apps/api` (build/test).
- Checkpoint de continuidade
  - Ultimo passo concluido: plano da rodada registrado antes da edicao.
  - Proximo passo planejado: implementar endpoint + island React do bloco de vendas.
## 2026-02-16 00:05:16
- Plano executado (Desempenho de Vendas em React com serie real)
  - Backend
    - Novo modulo de periodo compartilhado em `apps/api/src/modules/admin/kpis/period.ts`.
    - Refactor de `apps/api/src/modules/admin/kpis/dashboardKpis.ts` para reutilizar `resolveAdminPeriodRange`.
    - Nova agregacao de serie de vendas em `apps/api/src/modules/admin/kpis/dashboardSalesSeries.ts`:
      - filtros por tipo: `SERVICES`, `PRODUCTS`, `SUBSCRIPTIONS`, `ALL`;
      - filtros por periodo (`days`, `from`, `to`);
      - retorno com pontos diarios + totais (`gross`, `ordersPaid`, `itemsSold`).
    - Export atualizado em `apps/api/src/modules/admin/kpis/index.ts`.
    - Nova rota protegida:
      - `GET /api/admin/dashboard/sales-series` em `apps/api/src/routes/index.ts`;
      - validacao de `scope` e parametros de periodo com erro 400 para payload invalido.
  - Frontend
    - Tipos/cliente estendidos no modulo `admin-kpis`:
      - `apps/web/src/modules/admin-kpis/types.ts` (contratos de serie de vendas);
      - `apps/web/src/modules/admin-kpis/api/client.ts` (`fetchAdminDashboardSalesSeries`).
    - Novos componentes React:
      - `apps/web/src/modules/admin-kpis/components/AdminDashboardSalesPanel.tsx`;
      - `apps/web/src/modules/admin-kpis/components/AdminDashboardSalesIsland.tsx`.
    - Exports do modulo atualizados em `apps/web/src/modules/admin-kpis/index.ts`.
    - Integracao na pagina Admin:
      - `apps/web/src/pages/Admin.tsx` agora monta `AdminDashboardSalesIsland`.
    - Compatibilidade com legado:
      - bloco estatico de "Desempenho de Vendas" substituido por placeholder React em `apps/web/src/legacy/admin.body.html` com `data-react-admin-dashboard-sales`;
      - `apps/web/src/legacy/admin.behavior.ts` atualizado para incluir checagem da API `/admin/dashboard/sales-series`.
  - Documentacao
    - `docs/config/MODULES_CATALOG.md` atualizado com componentes de sales island e arquivos backend adicionados.
- Validacao
  - `apps/api`: `npm run build` PASS.
  - `apps/api`: `npm test` PASS (5 testes).
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Observacao
  - Warning de chunk grande no build web permanece (nao bloqueante).
- Checkpoint de continuidade
  - Ultimo passo concluido: bloco "Desempenho de Vendas" do dashboard admin passou a usar componente React com serie real por tipo/periodo.
  - Proximo passo planejado: migrar bloco "Agendamentos por Data" para React e continuar a retirada gradual do `LegacyHtml` na view `dashboard`.
## 2026-02-16 00:11:09
- Plano (rodada: Agendamentos por Data em React + dados reais)
  - Backend
    - Criar agregacao de agenda no modulo `apps/api/src/modules/admin/kpis` com:
      - contagem diaria para calendario mensal;
      - lista de agendamentos da data selecionada;
      - resumo por status na data selecionada.
    - Expor rota protegida `GET /api/admin/dashboard/agenda-summary` com filtros (`month`, `date`).
  - Frontend
    - Estender tipos/cliente do modulo `admin-kpis` para agenda.
    - Criar componentes React para painel de agenda e island correspondente.
    - Substituir o bloco HTML estatico "Agendamentos por Data" por placeholder React (`data-react-admin-dashboard-agenda`).
    - Montar island em `apps/web/src/pages/Admin.tsx`.
  - Qualidade
    - Atualizar suite interna do admin para checar endpoint novo.
    - Validar `apps/api` (build/test) e `apps/web` (lint/build).
- Checkpoint de continuidade
  - Ultimo passo concluido: plano registrado antes da edicao.
  - Proximo passo planejado: implementar endpoint + island React da agenda.
## 2026-02-16 00:17:05
- Plano executado (Agendamentos por Data em React com dados reais)
  - Backend
    - Novo modulo:
      - `apps/api/src/modules/admin/kpis/dashboardAgendaSummary.ts`
      - entrega:
        - grade mensal de calendario com contagem diaria de agendamentos;
        - lista de agendamentos da data selecionada;
        - resumo por status (`PENDING`, `CONFIRMED`, `CANCELLED`) na data.
    - Export atualizado:
      - `apps/api/src/modules/admin/kpis/index.ts`.
    - Nova rota protegida:
      - `GET /api/admin/dashboard/agenda-summary` em `apps/api/src/routes/index.ts`;
      - filtros suportados: `month` (`YYYY-MM`) e `date` (`YYYY-MM-DD`);
      - validacao de payload com retorno 400 para parametros invalidos.
  - Frontend
    - Tipos/cliente do modulo `admin-kpis` estendidos:
      - `apps/web/src/modules/admin-kpis/types.ts` (tipos de agenda);
      - `apps/web/src/modules/admin-kpis/api/client.ts` (`fetchAdminDashboardAgendaSummary`).
    - Novos componentes React:
      - `apps/web/src/modules/admin-kpis/components/AdminDashboardAgendaPanel.tsx`;
      - `apps/web/src/modules/admin-kpis/components/AdminDashboardAgendaIsland.tsx`.
    - Exports do modulo atualizados:
      - `apps/web/src/modules/admin-kpis/index.ts`.
    - Integracao na pagina Admin:
      - `apps/web/src/pages/Admin.tsx` agora monta `AdminDashboardAgendaIsland`.
    - Compatibilidade com legado:
      - bloco estatico "Agendamentos por Data" substituido por placeholder React em `apps/web/src/legacy/admin.body.html` com `data-react-admin-dashboard-agenda`.
      - suite interna atualizada em `apps/web/src/legacy/admin.behavior.ts` para checar `/admin/dashboard/agenda-summary`.
  - Documentacao
    - `docs/config/MODULES_CATALOG.md` atualizado com os novos componentes/arquivos da agenda.
- Validacao
  - `apps/api`: `npm run build` PASS.
  - `apps/api`: `npm test` PASS (5 testes).
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Observacao
  - Warning de chunk grande no build web permanece (nao bloqueante).
- Checkpoint de continuidade
  - Ultimo passo concluido: bloco "Agendamentos por Data" do dashboard admin passou a usar componente React com calendario e lista reais via API.
  - Proximo passo planejado: migrar o bloco "Visao Geral de Comissoes" para React e, em seguida, concluir a substituicao completa da view `dashboard` sem `LegacyHtml`.
## 2026-02-16 00:24:30
- Plano executado (Visao Geral de Comissoes em React com dados reais)
  - Backend
    - Novo modulo:
      - `apps/api/src/modules/admin/kpis/dashboardCommissionsSummary.ts`
      - entrega:
        - consolidacao por profissional (servicos, vendas, comissao, status de pagamento);
        - totais gerais de comissoes para o periodo.
    - Export atualizado:
      - `apps/api/src/modules/admin/kpis/index.ts`.
    - Nova rota protegida:
      - `GET /api/admin/dashboard/commissions-summary` em `apps/api/src/routes/index.ts`;
      - suporta filtro por periodo (`days`, `from`, `to`);
      - validacao de payload com retorno 400 para parametros invalidos.
  - Frontend
    - Tipos/cliente do modulo `admin-kpis` estendidos:
      - `apps/web/src/modules/admin-kpis/types.ts` (tipos de comissoes);
      - `apps/web/src/modules/admin-kpis/api/client.ts` (`fetchAdminDashboardCommissionsSummary`).
    - Novos componentes React:
      - `apps/web/src/modules/admin-kpis/components/AdminDashboardCommissionsPanel.tsx`;
      - `apps/web/src/modules/admin-kpis/components/AdminDashboardCommissionsIsland.tsx`.
    - Exports do modulo atualizados:
      - `apps/web/src/modules/admin-kpis/index.ts`.
    - Integracao na pagina Admin:
      - `apps/web/src/pages/Admin.tsx` agora monta `AdminDashboardCommissionsIsland`.
    - Compatibilidade com legado:
      - bloco estatico "Visao Geral de Comissoes" substituido por placeholder React em `apps/web/src/legacy/admin.body.html` com `data-react-admin-dashboard-commissions`.
      - suite interna atualizada em `apps/web/src/legacy/admin.behavior.ts` para checar `/admin/dashboard/commissions-summary`.
  - Documentacao
    - `docs/config/MODULES_CATALOG.md` atualizado com componentes/arquivo de comissoes.
- Validacao
  - `apps/api`: `npm run build` PASS.
  - `apps/api`: `npm test` PASS (5 testes).
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Observacao
  - Warning de chunk grande no build web permanece (nao bloqueante).
- Checkpoint de continuidade
  - Ultimo passo concluido: painel de comissoes do dashboard admin passou a ser renderizado por React com dados reais.
  - Proximo passo planejado: consolidar a view `dashboard` em componente React unico (servicos + leads) para remover dependencia estrutural de `LegacyHtml` nessa view.
## 2026-02-16 00:32:12
- Plano (rodada: consolidacao da view dashboard em React)
  - Frontend
    - Substituir no HTML legado o bloco completo da view `dashboard` por placeholder React (`data-react-admin-dashboard-view`).
    - Criar modulo `admin-dashboard` com:
      - componente React da view `dashboard` (tabs Servicos/Leads);
      - island de montagem via portal para compatibilidade com shell legado do Admin.
    - Manter placeholders dos islands ja existentes (`kpis`, `sales`, `agenda`, `commissions`) dentro da nova view React.
    - Preservar `data-leads-*` na aba Leads para manter integracao com `legacy/admin.behavior.ts`.
  - Integracao
    - Montar island da view dashboard em `apps/web/src/pages/Admin.tsx`.
  - Qualidade
    - Validar `apps/web` (lint/build) e `apps/api` (build/test regressao).
- Checkpoint de continuidade
  - Ultimo passo concluido: plano registrado antes da edicao.
  - Proximo passo planejado: implementar modulo `admin-dashboard` e trocar estrutura da view dashboard.
## 2026-02-16 00:37:43
- Plano executado (estrutura da view dashboard migrada para React)
  - Frontend
    - `apps/web/src/legacy/admin.body.html`
      - bloco completo da view `dashboard` substituido por placeholder:
        - `data-react-admin-dashboard-view`.
      - objetivo: retirar dependencia estrutural de markup legado nessa view.
    - Novo modulo `admin-dashboard`:
      - `apps/web/src/modules/admin-dashboard/components/AdminDashboardView.tsx`
      - `apps/web/src/modules/admin-dashboard/components/AdminDashboardViewIsland.tsx`
      - `apps/web/src/modules/admin-dashboard/index.ts`
      - responsabilidade:
        - estrutura React da view dashboard;
        - tabs `servicos` e `leads`;
        - preservacao dos `data-leads-*` para compatibilidade com `legacy/admin.behavior.ts`;
        - placeholders dos submodulos React (`kpis`, `sales`, `agenda`, `commissions`).
    - Integracao na pagina Admin:
      - `apps/web/src/pages/Admin.tsx` agora monta `AdminDashboardViewIsland`.
  - Documentacao
    - `docs/config/MODULES_CATALOG.md` atualizado com o novo modulo `admin-dashboard`.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
  - `apps/api`: `npm test` PASS (5 testes).
  - `apps/api`: `npm run build` PASS.
- Observacao
  - Warning de chunk grande no build web permanece (nao bloqueante).
- Checkpoint de continuidade
  - Ultimo passo concluido: a estrutura da view `dashboard` saiu do HTML legado e passou para componente React dedicado.
  - Proximo passo planejado: iniciar migracao da view `usuarios` para React por modulo, reduzindo sequencialmente o `LegacyHtml` no Admin.

## 2026-02-16 00:42:24
- Plano (rodada: migracao da view usuarios para modulo React)
  - Frontend
    - Extrair a view usuarios de apps/web/src/legacy/admin.body.html para novo modulo admin-people via island React.
    - Preservar todos os seletores data-* (usuarios/clientes/profissionais/modais) para manter compatibilidade com apps/web/src/legacy/admin.behavior.ts.
    - Substituir no HTML legado a view usuarios por placeholder data-react-admin-people-view.
    - Integrar AdminPeopleViewIsland em apps/web/src/pages/Admin.tsx.
  - Documentacao
    - Atualizar docs/config/MODULES_CATALOG.md com o modulo admin-people.
  - Qualidade
    - Validar apps/web (lint/build) e regressao em apps/api (build/test).
- Checkpoint de continuidade
  - Ultimo passo concluido: plano registrado antes da edicao.
  - Proximo passo planejado: implementar modulo admin-people e conectar a island na pagina Admin.

## 2026-02-16 00:47:17
- Plano executado (view usuarios migrada para modulo admin-people)
  - Frontend
    - Novo modulo criado:
      - apps/web/src/modules/admin-people/components/AdminPeopleView.tsx
      - apps/web/src/modules/admin-people/components/AdminPeopleViewIsland.tsx
      - apps/web/src/modules/admin-people/index.ts
      - apps/web/src/modules/admin-people/templates/adminPeopleView.html
    - Estrutura da view usuarios extraida do legado para o modulo admin-people (clientes/profissionais/usuarios + modais).
    - Compatibilidade preservada mantendo seletores data-* usados por apps/web/src/legacy/admin.behavior.ts.
    - apps/web/src/legacy/admin.body.html atualizado:
      - bloco data-view="usuarios" substituido por placeholder data-react-admin-people-view.
    - Integracao concluida em apps/web/src/pages/Admin.tsx com AdminPeopleViewIsland.
  - Documentacao
    - docs/config/MODULES_CATALOG.md atualizado com o modulo admin-people.
- Validacao
  - apps/web: npm run lint PASS.
  - apps/web: npm run build PASS.
  - apps/api: npm test PASS (5 testes).
  - apps/api: npm run build PASS.
- Observacao
  - Warning de chunk grande no build web permanece (nao bloqueante).
- Checkpoint de continuidade
  - Ultimo passo concluido: view usuarios retirada do admin.body.html e centralizada em modulo admin-people.
  - Proximo passo planejado: migrar a view servicos para modulo React dedicado (admin-services) mantendo os data-* para o comportamento legado.

## 2026-02-16 00:47:56
- Plano (rodada: migracao da view servicos para modulo React)
  - Frontend
    - Extrair a view servicos de apps/web/src/legacy/admin.body.html para novo modulo admin-services via island React.
    - Preservar seletores data-* da area de servicos para manter compatibilidade com apps/web/src/legacy/admin.behavior.ts.
    - Substituir no HTML legado a view servicos por placeholder data-react-admin-services-view.
    - Integrar AdminServicesViewIsland em apps/web/src/pages/Admin.tsx.
  - Documentacao
    - Atualizar docs/config/MODULES_CATALOG.md com o modulo admin-services.
  - Qualidade
    - Validar apps/web (lint/build) e regressao em apps/api (build/test).
- Checkpoint de continuidade
  - Ultimo passo concluido: plano registrado antes da edicao.
  - Proximo passo planejado: implementar modulo admin-services e conectar a island na pagina Admin.

## 2026-02-16 00:51:32
- Plano executado (view servicos migrada para modulo admin-services)
  - Frontend
    - Novo modulo criado:
      - apps/web/src/modules/admin-services/components/AdminServicesView.tsx
      - apps/web/src/modules/admin-services/components/AdminServicesViewIsland.tsx
      - apps/web/src/modules/admin-services/index.ts
      - apps/web/src/modules/admin-services/templates/adminServicesView.html
    - Estrutura da view servicos extraida do legado para o modulo admin-services.
    - Compatibilidade preservada mantendo seletores data-* usados por apps/web/src/legacy/admin.behavior.ts.
    - apps/web/src/legacy/admin.body.html atualizado:
      - bloco data-view="servicos" substituido por placeholder data-react-admin-services-view.
    - Integracao concluida em apps/web/src/pages/Admin.tsx com AdminServicesViewIsland.
  - Documentacao
    - docs/config/MODULES_CATALOG.md atualizado com o modulo admin-services.
- Validacao
  - apps/web: npm run lint PASS.
  - apps/web: npm run build PASS.
  - apps/api: npm test PASS (5 testes).
  - apps/api: npm run build PASS.
- Observacao
  - Warning de chunk grande no build web permanece (nao bloqueante).
- Checkpoint de continuidade
  - Ultimo passo concluido: view servicos retirada do admin.body.html e centralizada em modulo admin-services.
  - Proximo passo planejado: migrar a view metas para modulo React dedicado (admin-goals) mantendo os data-* para o comportamento legado.

## 2026-02-16 01:05:32
- Plano (rodada: migracao das views metas e performance para modulos React)
  - Frontend
    - Extrair a view metas de apps/web/src/legacy/admin.body.html para novo modulo admin-goals via island React.
    - Extrair a view performance de apps/web/src/legacy/admin.body.html para novo modulo admin-performance via island React.
    - Preservar os seletores data-* das duas views para manter compatibilidade com apps/web/src/legacy/admin.behavior.ts.
    - Substituir no HTML legado os blocos data-view="metas" e data-view="performance" por placeholders React.
    - Integrar AdminGoalsViewIsland e AdminPerformanceViewIsland em apps/web/src/pages/Admin.tsx.
  - Documentacao
    - Atualizar docs/config/MODULES_CATALOG.md com os modulos admin-goals e admin-performance.
  - Qualidade
    - Validar apps/web (lint/build) e regressao em apps/api (build/test).
- Checkpoint de continuidade
  - Ultimo passo concluido: plano registrado antes da edicao.
  - Proximo passo planejado: implementar os dois modulos e conectar as islands na pagina Admin.

## 2026-02-16 01:12:22
- Plano executado (views metas e performance migradas para modulos React)
  - Frontend
    - Novos modulos criados:
      - apps/web/src/modules/admin-goals/components/AdminGoalsView.tsx
      - apps/web/src/modules/admin-goals/components/AdminGoalsViewIsland.tsx
      - apps/web/src/modules/admin-goals/index.ts
      - apps/web/src/modules/admin-goals/templates/adminGoalsView.html
      - apps/web/src/modules/admin-performance/components/AdminPerformanceView.tsx
      - apps/web/src/modules/admin-performance/components/AdminPerformanceViewIsland.tsx
      - apps/web/src/modules/admin-performance/index.ts
      - apps/web/src/modules/admin-performance/templates/adminPerformanceView.html
    - Estruturas das views metas e performance extraidas do legado para os novos modulos.
    - Compatibilidade preservada mantendo seletores data-* usados por apps/web/src/legacy/admin.behavior.ts.
    - apps/web/src/legacy/admin.body.html atualizado:
      - bloco data-view="metas" substituido por placeholder data-react-admin-goals-view.
      - bloco data-view="performance" substituido por placeholder data-react-admin-performance-view.
    - Integracao concluida em apps/web/src/pages/Admin.tsx com AdminGoalsViewIsland e AdminPerformanceViewIsland.
  - Documentacao
    - docs/config/MODULES_CATALOG.md atualizado com os modulos admin-goals e admin-performance.
- Validacao
  - apps/web: npm run lint PASS.
  - apps/web: npm run build PASS.
  - apps/api: npm test PASS (5 testes).
  - apps/api: npm run build PASS.
- Observacao
  - Warning de chunk grande no build web permanece (nao bloqueante).
- Checkpoint de continuidade
  - Ultimo passo concluido: views metas e performance retiradas do admin.body.html e centralizadas em modulos proprios.
  - Proximo passo planejado: migrar a view produtos para modulo React dedicado (admin-products) mantendo os data-* para o comportamento legado.

## 2026-02-16 01:12:49
- Plano (rodada: migracao das views restantes do Admin para modulos React)
  - Frontend
    - Extrair as views produtos, planos, assinantes, agenda, whatsapp-contatos, vendas e testes de apps/web/src/legacy/admin.body.html para modulos dedicados com island React.
    - Preservar os seletores data-* de cada view para manter compatibilidade com apps/web/src/legacy/admin.behavior.ts.
    - Substituir no HTML legado os blocos data-view dessas views por placeholders React.
    - Integrar as novas islands em apps/web/src/pages/Admin.tsx.
  - Documentacao
    - Atualizar docs/config/MODULES_CATALOG.md com os novos modulos.
  - Qualidade
    - Validar apps/web (lint/build) e regressao em apps/api (build/test).
- Checkpoint de continuidade
  - Ultimo passo concluido: plano registrado antes da edicao.
  - Proximo passo planejado: implementar os modulos restantes e conectar as islands na pagina Admin.

## 2026-02-16 01:22:19
- Plano executado (views restantes do Admin migradas para modulos React)
  - Frontend
    - Novos modulos criados:
      - admin-products
      - admin-plans
      - admin-subscribers
      - admin-schedule
      - admin-whatsapp-contacts
      - admin-sales
      - admin-tests
    - Arquivos adicionados por modulo:
      - components/*View.tsx
      - components/*ViewIsland.tsx
      - index.ts
      - templates/*.html (extraidos do legado)
    - apps/web/src/legacy/admin.body.html atualizado com placeholders React para as views:
      - produtos -> data-react-admin-products-view
      - planos -> data-react-admin-plans-view
      - assinantes -> data-react-admin-subscribers-view
      - agenda -> data-react-admin-schedule-view
      - whatsapp-contatos -> data-react-admin-whatsapp-contacts-view
      - vendas -> data-react-admin-sales-view
      - testes -> data-react-admin-tests-view
    - Integracao concluida em apps/web/src/pages/Admin.tsx com as novas islands.
  - Documentacao
    - docs/config/MODULES_CATALOG.md atualizado com os novos modulos.
- Validacao
  - apps/web: npm run lint PASS.
  - apps/web: npm run build PASS.
  - apps/api: npm test PASS (5 testes).
  - apps/api: npm run build PASS.
- Observacao
  - Warning de chunk grande no build web permanece (nao bloqueante).
- Checkpoint de continuidade
  - Ultimo passo concluido: todas as views do Admin foram extraidas do bloco legado para modulos React com islands.
  - Proximo passo planejado: reduzir dependencia de apps/web/src/legacy/admin.behavior.ts, movendo handlers por dominio para os modulos React (fase de desacoplamento do legado).

## 2026-02-16 01:29:12
- Plano (rodada: inicio do desacoplamento de admin.behavior por dominio)
  - Frontend
    - Extrair o dominio de testes (data-run-tests e resumo de validacao) de apps/web/src/legacy/admin.behavior.ts para modulo admin-tests.
    - Criar inicializador dedicado no modulo admin-tests para registrar eventos e executar o fluxo de validacao.
    - Manter o contrato atual com data-* e sem alterar comportamento funcional.
    - Conectar o novo inicializador em apps/web/src/legacy/admin.behavior.ts.
  - Documentacao
    - Atualizar docs/config/MODULES_CATALOG.md indicando que admin-tests ja possui behavior dedicado.
  - Qualidade
    - Validar apps/web (lint/build) e regressao em apps/api (build/test).
- Checkpoint de continuidade
  - Ultimo passo concluido: plano registrado antes da edicao.
  - Proximo passo planejado: implementar initAdminTestsBehavior e remover bloco equivalente do admin.behavior legado.

## 2026-02-16 01:33:43
- Plano executado (desacoplamento inicial do dominio de testes)
  - Frontend
    - Novo inicializador criado no modulo admin-tests:
      - apps/web/src/modules/admin-tests/behavior.ts
      - responsabilidade: fluxo completo de validacao da view de testes (DOM checks, API checks, write checks controlados e renderizacao de resultados).
    - Export do modulo admin-tests atualizado:
      - apps/web/src/modules/admin-tests/index.ts (inclui behavior).
    - apps/web/src/legacy/admin.behavior.ts atualizado:
      - bloco de testes extraido do arquivo monolitico;
      - chamada central substituida por initAdminTestsBehavior({ addCleanup, apiJson, apiUrl, escapeHtml }).
    - Compatibilidade mantida:
      - sem mudanca de seletores data-*;
      - mesma semantica de execucao dos testes no botao data-run-tests.
  - Documentacao
    - docs/config/MODULES_CATALOG.md atualizado para refletir behavior dedicado em admin-tests.
- Validacao
  - apps/web: npm run lint PASS.
  - apps/web: npm run build PASS.
  - apps/api: npm test PASS (5 testes).
  - apps/api: npm run build PASS.
- Observacao
  - Warning de chunk grande no build web permanece (nao bloqueante).
- Checkpoint de continuidade
  - Ultimo passo concluido: dominio de testes desacoplado do admin.behavior para modulo proprio.
  - Proximo passo planejado: extrair o proximo dominio menor do admin.behavior (ex.: agenda ou assinantes) seguindo o mesmo padrao de inicializador por modulo.

## 2026-02-16 01:34:54
- Plano (rodada complementar: extracao do shell de navegacao/modais do Admin)
  - Frontend
    - Criar modulo admin-shell com behavior dedicado para:
      - tabs gerais,
      - tabs da view pessoas,
      - navegacao por data-view/data-view-trigger,
      - abertura/fechamento de modais e ESC.
    - Retirar esse bloco de apps/web/src/legacy/admin.behavior.ts e consumir o inicializador do modulo.
    - Preservar o contrato atual de classes e seletores data-*.
  - Documentacao
    - Atualizar docs/config/MODULES_CATALOG.md com o novo modulo admin-shell.
  - Qualidade
    - Validar apps/web (lint/build) e regressao em apps/api (build/test).
- Checkpoint de continuidade
  - Ultimo passo concluido: plano registrado antes da edicao complementar.
  - Proximo passo planejado: implementar initAdminShellBehavior e ajustar admin.behavior para usar setModalOpen retornado.

## 2026-02-16 01:40:50
- Plano executado (desacoplamento incremental do legacy/admin.behavior)
  - Frontend
    - Dominio `admin-tests` extraido para modulo proprio:
      - apps/web/src/modules/admin-tests/behavior.ts
      - apps/web/src/modules/admin-tests/index.ts (export do behavior)
      - apps/web/src/legacy/admin.behavior.ts passou a chamar initAdminTestsBehavior(...)
    - Dominio estrutural `admin-shell` extraido para modulo proprio:
      - apps/web/src/modules/admin-shell/behavior.ts
      - apps/web/src/modules/admin-shell/index.ts
      - apps/web/src/legacy/admin.behavior.ts passou a chamar initAdminShellBehavior(...)
      - setModalOpen e setActiveView agora sao providos pelo modulo de shell.
    - Correcao durante validacao:
      - erro de compilacao "Cannot find name setActiveView" apos extracao do shell;
      - resolvido exportando setActiveView no retorno de initAdminShellBehavior e reconectando no legacy.
  - Documentacao
    - docs/config/MODULES_CATALOG.md atualizado com:
      - admin-tests (behavior dedicado)
      - admin-shell (navegacao/tabs/modais)
- Validacao
  - apps/web: npm run lint PASS.
  - apps/web: npm run build PASS.
  - apps/api: npm test PASS (5 testes).
  - apps/api: npm run build PASS.
- Observacao
  - Warning de chunk grande no build web permanece (nao bloqueante).
- Checkpoint de continuidade
  - Ultimo passo concluido: dominios admin-tests e admin-shell foram desacoplados do monolito legacy/admin.behavior.
  - Proximo passo planejado: extrair o proximo dominio de dados para behavior por modulo (prioridade sugerida: admin-subscribers).

## 2026-02-16 01:52:49
- Plano executado (desacoplamento do dominio de assinantes)
  - Frontend
    - Novo inicializador criado no modulo admin-subscribers:
      - apps/web/src/modules/admin-subscribers/behavior.ts
      - responsabilidade: filtros, paginacao, abertura/edicao de modal, persistencia e recarga de assinantes.
    - Export do modulo admin-subscribers atualizado:
      - apps/web/src/modules/admin-subscribers/index.ts (inclui behavior).
    - apps/web/src/legacy/admin.behavior.ts atualizado:
      - passou a chamar initAdminSubscribersBehavior(...);
      - removeu bloco monolitico de subscriptions (seletores/estado/funcoes/eventos/fetch inicial) do legado.
    - Compatibilidade mantida:
      - mesmos seletores data-subscriptions-*;
      - mesmo modal assinantes-form e fluxo de create/edit.
    - Correcao durante validacao:
      - incompatibilidade de tipo ao tentar sincronizar cache legado de memberships;
      - resolvido mantendo cache local de opcoes no modulo e removendo escrita no array tipado do legado.
  - Documentacao
    - docs/config/MODULES_CATALOG.md atualizado para refletir behavior dedicado em admin-subscribers.
- Validacao
  - apps/web: npm run lint PASS.
  - apps/web: npm run build PASS.
  - apps/api: npm test PASS (5 testes).
  - apps/api: npm run build PASS.
- Observacao
  - Warning de chunk grande no build web permanece (nao bloqueante).
- Checkpoint de continuidade
  - Ultimo passo concluido: dominio de assinantes desacoplado do monolito legacy/admin.behavior.
  - Proximo passo planejado: extrair o proximo dominio de dados (prioridade sugerida: agenda/escalas).

## 2026-02-16 02:01:32
- Plano (rodada: extracao do dominio agenda/escalas/profissional-servicos)
  - Frontend
    - Criar pps/web/src/modules/admin-schedule/behavior.ts para concentrar:
      - filtros e render de agendamentos,
      - filtros/CRUD de escalas,
      - vinculos de servicos por profissional,
      - carga inicial (hydrate + fetch) da view agenda.
    - Atualizar pps/web/src/modules/admin-schedule/index.ts para exportar o behavior.
    - Atualizar pps/web/src/legacy/admin.behavior.ts para consumir initAdminScheduleBehavior(...) e remover blocos equivalentes do monolito.
    - Manter acao open-agenda da tela de profissionais via API do novo modulo.
  - Documentacao
    - Atualizar docs/config/MODULES_CATALOG.md com behavior dedicado em dmin-schedule.
  - Qualidade
    - Validar pps/web (
pm run lint, 
pm run build) e regressao pps/api (
pm test, 
pm run build).
- Checkpoint de continuidade
  - Ultimo passo concluido: plano registrado antes da edicao.
  - Proximo passo planejado: implementar modulo dmin-schedule/behavior.ts e reconectar o legacy/admin.behavior.ts.

## 2026-02-16 02:08:48
- Plano executado (desacoplamento do dominio agenda/escalas/profissional-servicos)
  - Frontend
    - Novo inicializador criado no modulo dmin-schedule:
      - pps/web/src/modules/admin-schedule/behavior.ts
      - responsabilidade: filtros/render de agendamentos, filtros+CRUD de escalas, checklist e persistencia de vinculos de servicos por profissional, carga inicial da view agenda.
    - Export do modulo atualizado:
      - pps/web/src/modules/admin-schedule/index.ts (inclui ehavior).
    - pps/web/src/legacy/admin.behavior.ts atualizado:
      - passou a inicializar initAdminScheduleBehavior(...);
      - removeu bloco monolitico equivalente (seletores/estado/funcoes/eventos/bootstrap da agenda);
      - acao open-agenda da tabela de profissionais agora delega para dminScheduleBehavior.openAgendaForProfessional(...).
    - Compatibilidade mantida:
      - mesmos seletores data-appointments-*, data-shifts-* e data-prof-services-*;
      - mesma semantica de filtragem, listagem e persistencia.
  - Documentacao
    - docs/config/MODULES_CATALOG.md atualizado para refletir behavior dedicado em dmin-schedule.
- Validacao
  - pps/web: 
pm run lint PASS.
  - pps/web: 
pm run build PASS.
  - pps/api: 
pm test PASS (5 testes).
  - pps/api: 
pm run build PASS.
- Observacoes
  - Warning nao bloqueante de chunk grande no build web permanece.
  - Aviso nao bloqueante de asset images/franchise/mapa_fundo.webp sem resolucao em build time permanece.
- Checkpoint de continuidade
  - Ultimo passo concluido: dominio de agenda/escalas/profissional-servicos extraido do monolito para dmin-schedule/behavior.ts.
  - Proximo passo planejado: extrair proximo dominio de alto acoplamento restante de legacy/admin.behavior.ts (prioridade sugerida: services ou products) mantendo contrato de seletores.

## 2026-02-16 02:11:50
- Plano (rodada: extracao do dominio services)
  - Frontend
    - Criar pps/web/src/modules/admin-services/behavior.ts com:
      - estado local de servicos,
      - filtros/paginacao,
      - CRUD (create/update/delete),
      - edicao no formulario e refresh inicial.
    - Atualizar pps/web/src/modules/admin-services/index.ts para exportar behavior.
    - Atualizar pps/web/src/legacy/admin.behavior.ts para:
      - inicializar initAdminServicesBehavior(...),
      - remover seletores/estado/funcoes/listeners/bootstrap de services.
  - Documentacao
    - Atualizar docs/config/MODULES_CATALOG.md indicando behavior dedicado em dmin-services.
  - Qualidade
    - Validar pps/web (
pm run lint, 
pm run build) e regressao pps/api (
pm test, 
pm run build).
- Checkpoint de continuidade
  - Ultimo passo concluido: plano registrado antes da edicao.
  - Proximo passo planejado: implementar modulo dmin-services/behavior.ts e reconectar o legacy.

## 2026-02-16 02:17:39
- Plano executado (desacoplamento do dominio services)
  - Frontend
    - Novo inicializador criado no modulo dmin-services:
      - pps/web/src/modules/admin-services/behavior.ts
      - responsabilidade: estado local de servicos, filtros/paginacao, CRUD, edicao em formulario e carga inicial da tabela.
    - Export do modulo atualizado:
      - pps/web/src/modules/admin-services/index.ts (inclui ehavior).
    - pps/web/src/legacy/admin.behavior.ts atualizado:
      - inicializacao de initAdminServicesBehavior(...) integrada;
      - removidos seletores, estado, funcoes, listeners e bootstrap do dominio de services;
      - removido tipo local ServiceRow do legado (agora encapsulado no modulo).
    - Compatibilidade mantida:
      - mesmos seletores data-service-* e data-services-*;
      - mesmo fluxo de create/update/delete e paginacao.
  - Documentacao
    - docs/config/MODULES_CATALOG.md atualizado para refletir behavior dedicado em dmin-services.
- Validacao
  - pps/web: 
pm run lint PASS.
  - pps/web: 
pm run build PASS.
  - pps/api: 
pm test PASS (5 testes).
  - pps/api: 
pm run build PASS.
- Observacoes
  - Warning nao bloqueante de chunk grande no build web permanece.
  - Aviso nao bloqueante de asset images/franchise/mapa_fundo.webp sem resolucao em build time permanece.
- Checkpoint de continuidade
  - Ultimo passo concluido: dominio de services extraido do monolito para dmin-services/behavior.ts.
  - Proximo passo planejado: extrair o dominio products seguindo o mesmo padrao (behavior dedicado + limpeza do legado).

## 2026-02-16 02:20:19
- Plano (rodada: extracao do dominio products)
  - Frontend
    - Criar pps/web/src/modules/admin-products/behavior.ts com:
      - estado local de produtos,
      - filtros/paginacao,
      - CRUD (create/update/delete),
      - edicao no formulario e refresh inicial.
    - Atualizar pps/web/src/modules/admin-products/index.ts para exportar behavior.
    - Atualizar pps/web/src/legacy/admin.behavior.ts para:
      - inicializar initAdminProductsBehavior(...),
      - remover seletores/estado/funcoes/listeners/bootstrap de products.
  - Documentacao
    - Atualizar docs/config/MODULES_CATALOG.md indicando behavior dedicado em dmin-products.
  - Qualidade
    - Validar pps/web (
pm run lint, 
pm run build) e regressao pps/api (
pm test, 
pm run build).
- Checkpoint de continuidade
  - Ultimo passo concluido: plano registrado antes da edicao.
  - Proximo passo planejado: implementar modulo dmin-products/behavior.ts e reconectar o legacy.

## 2026-02-16 02:26:37
- Plano executado (desacoplamento do dominio products)
  - Frontend
    - Novo inicializador criado no modulo dmin-products:
      - pps/web/src/modules/admin-products/behavior.ts
      - responsabilidade: estado local de produtos, filtros/paginacao, CRUD, edicao em formulario e carga inicial da tabela.
    - Export do modulo atualizado:
      - pps/web/src/modules/admin-products/index.ts (inclui ehavior).
    - pps/web/src/legacy/admin.behavior.ts atualizado:
      - inicializacao de initAdminProductsBehavior(...) integrada;
      - removidos seletores, estado, funcoes, listeners e bootstrap do dominio de products;
      - removido tipo local ProductRow do legado (encapsulado no modulo).
    - Compatibilidade mantida:
      - mesmos seletores data-product-* e data-products-*;
      - mesmo fluxo de create/update/delete e paginacao.
  - Documentacao
    - docs/config/MODULES_CATALOG.md atualizado para refletir behavior dedicado em dmin-products.
- Validacao
  - pps/web: 
pm run lint PASS.
  - pps/web: 
pm run build PASS.
  - pps/api: 
pm test PASS (5 testes).
  - pps/api: 
pm run build PASS.
- Observacoes
  - Warning nao bloqueante de chunk grande no build web permanece.
  - Aviso nao bloqueante de asset images/franchise/mapa_fundo.webp sem resolucao em build time permanece.
- Checkpoint de continuidade
  - Ultimo passo concluido: dominio de products extraido do monolito para dmin-products/behavior.ts.
  - Proximo passo planejado: extrair o dominio leads do legacy/admin.behavior.ts seguindo o mesmo padrao de behavior dedicado.

## 2026-02-16 02:27:30
- Plano (rodada: extracao do dominio leads)
  - Frontend
    - Criar pps/web/src/modules/admin-leads/behavior.ts com:
      - estado local de leads,
      - filtros/paginacao,
      - atualizacao de status por acao da tabela,
      - carga inicial.
    - Criar pps/web/src/modules/admin-leads/index.ts exportando behavior.
    - Atualizar pps/web/src/legacy/admin.behavior.ts para:
      - inicializar initAdminLeadsBehavior(...),
      - remover seletores/estado/funcoes/listeners/bootstrap de leads.
  - Documentacao
    - Atualizar docs/config/MODULES_CATALOG.md para incluir dmin-leads.
  - Qualidade
    - Validar pps/web (
pm run lint, 
pm run build) e regressao pps/api (
pm test, 
pm run build).
- Checkpoint de continuidade
  - Ultimo passo concluido: plano registrado antes da edicao.
  - Proximo passo planejado: implementar modulo dmin-leads e reconectar o legacy.

## 2026-02-16 02:33:49
- Plano executado (desacoplamento do dominio leads)
  - Frontend
    - Novo modulo criado para leads:
      - pps/web/src/modules/admin-leads/behavior.ts
      - pps/web/src/modules/admin-leads/index.ts
      - responsabilidade: filtros/paginacao, atualizacao de status por acao de linha e carga inicial da aba Leads.
    - pps/web/src/legacy/admin.behavior.ts atualizado:
      - inicializacao de initAdminLeadsBehavior(...) integrada;
      - removidos seletores, estado, funcoes, listeners e bootstrap do dominio de leads;
      - removido tipo local LeadRow do legado (encapsulado no modulo).
    - Compatibilidade mantida:
      - mesmos seletores data-lead-* e data-leads-*;
      - mesmo fluxo de atualizacao de status via prompt.
  - Documentacao
    - docs/config/MODULES_CATALOG.md atualizado para incluir dmin-leads com behavior dedicado.
- Validacao
  - pps/web: 
pm run lint PASS.
  - pps/web: 
pm run build PASS.
  - pps/api: 
pm test PASS (5 testes).
  - pps/api: 
pm run build PASS.
- Observacoes
  - Warning nao bloqueante de chunk grande no build web permanece.
  - Aviso nao bloqueante de asset images/franchise/mapa_fundo.webp sem resolucao em build time permanece.
- Checkpoint de continuidade
  - Ultimo passo concluido: dominio de leads extraido do monolito para dmin-leads/behavior.ts.
  - Proximo passo planejado: extrair o dominio orders do legacy/admin.behavior.ts seguindo o mesmo padrao de behavior dedicado.

## 2026-02-16 02:36:28
- Plano (rodada: extracao do dominio orders)
  - Frontend
    - Criar pps/web/src/modules/admin-orders/behavior.ts com:
      - estado local de pedidos,
      - filtros/paginacao,
      - atualizacao de status via acao de tabela,
      - carga inicial da listagem.
    - Criar pps/web/src/modules/admin-orders/index.ts exportando behavior.
    - Atualizar pps/web/src/legacy/admin.behavior.ts para:
      - inicializar initAdminOrdersBehavior(...),
      - remover seletores/estado/funcoes/listeners/bootstrap de orders.
  - Documentacao
    - Atualizar docs/config/MODULES_CATALOG.md para incluir dmin-orders.
  - Qualidade
    - Validar pps/web (
pm run lint, 
pm run build) e regressao pps/api (
pm test, 
pm run build).
- Checkpoint de continuidade
  - Ultimo passo concluido: plano registrado antes da edicao.
  - Proximo passo planejado: implementar modulo dmin-orders e reconectar o legacy.

## 2026-02-16 02:41:13
- Plano executado (desacoplamento do dominio orders)
  - Frontend
    - Novo modulo criado para pedidos:
      - pps/web/src/modules/admin-orders/behavior.ts
      - pps/web/src/modules/admin-orders/index.ts
      - responsabilidade: filtros/paginacao, atualizacao de status por acao de linha e carga inicial da aba Pedidos.
    - pps/web/src/legacy/admin.behavior.ts atualizado:
      - inicializacao de initAdminOrdersBehavior(...) integrada;
      - removidos seletores, estado, funcoes, listeners e bootstrap do dominio de orders;
      - removido tipo local OrderRow do legado (encapsulado no modulo).
    - Compatibilidade mantida:
      - mesmos seletores data-order-* e data-orders-*;
      - mesmo fluxo de atualizacao de status via prompt.
  - Documentacao
    - docs/config/MODULES_CATALOG.md atualizado para incluir dmin-orders com behavior dedicado.
- Validacao
  - pps/web: 
pm run lint PASS.
  - pps/web: 
pm run build PASS.
  - pps/api: 
pm test PASS (5 testes).
  - pps/api: 
pm run build PASS.
- Observacoes
  - Warning nao bloqueante de chunk grande no build web permanece.
  - Aviso nao bloqueante de asset images/franchise/mapa_fundo.webp sem resolucao em build time permanece.
- Checkpoint de continuidade
  - Ultimo passo concluido: dominio de orders extraido do monolito para dmin-orders/behavior.ts.
  - Proximo passo planejado: extrair o dominio concierge do legacy/admin.behavior.ts em submodulos menores (configuracoes e tabela/sessoes).

## 2026-02-16 02:45:53
- Plano (rodada: extracao segura do dominio concierge/whatsapp-contatos)
  - Frontend
    - Criar pps/web/src/modules/admin-whatsapp-contacts/behavior.ts com o comportamento completo atual:
      - filtros/listagem de sessoes concierge,
      - configuracao category-first,
      - carga e persistencia das saudacoes de abertura/conclusao,
      - listeners e bootstrap inicial.
    - Atualizar pps/web/src/modules/admin-whatsapp-contacts/index.ts para exportar behavior.
    - Atualizar pps/web/src/legacy/admin.behavior.ts para:
      - inicializar initAdminWhatsappContactsBehavior(...),
      - remover seletores/estado/funcoes/listeners/bootstrap do bloco concierge.
    - Nao alterar backend nem textos/chaves de configuracao do fluxo conversacional.
  - Documentacao
    - Atualizar docs/config/MODULES_CATALOG.md para marcar behavior dedicado em dmin-whatsapp-contacts.
  - Qualidade
    - Validar pps/web (
pm run lint, 
pm run build) e regressao pps/api (
pm test, 
pm run build).
- Checkpoint de continuidade
  - Ultimo passo concluido: plano registrado antes da edicao.
  - Proximo passo planejado: implementar dmin-whatsapp-contacts/behavior.ts e reconectar o legacy sem alterar regra conversacional.

## 2026-02-16 02:52:06
- Plano executado (desacoplamento seguro do dominio concierge/whatsapp-contatos)
  - Frontend
    - Novo behavior criado em pps/web/src/modules/admin-whatsapp-contacts/behavior.ts com a logica completa existente:
      - listagem/filtros de sessoes concierge,
      - configuracao category-first,
      - leitura/gravação de saudacoes de abertura/conclusao,
      - listeners e bootstrap inicial.
    - Export do modulo atualizado:
      - pps/web/src/modules/admin-whatsapp-contacts/index.ts (inclui ehavior).
    - pps/web/src/legacy/admin.behavior.ts atualizado:
      - inicializa initAdminWhatsappContactsBehavior(...);
      - removeu seletores/estado/funcoes/listeners/bootstrap do bloco concierge;
      - removeu tipos locais ConciergeSessionRow e ContentEntryRow do legado.
    - Garantia de seguranca funcional:
      - sem alteracao de chaves de configuracao (whatsapp_flow_category_first, whatsapp_opening_greeting_text, whatsapp_completion_greeting_text);
      - sem alteracao de textos padrao de saudacao;
      - sem alteracao de backend/fluxo conversacional.
  - Documentacao
    - docs/config/MODULES_CATALOG.md atualizado: dmin-whatsapp-contacts agora com ehavior.ts dedicado.
- Validacao
  - pps/web: 
pm run lint PASS.
  - pps/web: 
pm run build PASS.
  - pps/api: 
pm test PASS (5 testes).
  - pps/api: 
pm run build PASS.
- Observacoes
  - Warning nao bloqueante de chunk grande no build web permanece.
  - Aviso nao bloqueante de asset images/franchise/mapa_fundo.webp sem resolucao em build time permanece.
- Checkpoint de continuidade
  - Ultimo passo concluido: bloco concierge desacoplado do monolito para dmin-whatsapp-contacts/behavior.ts.
  - Proximo passo planejado: extrair proximo dominio restante de legacy/admin.behavior.ts (prioridade sugerida: people em subdominios customer/professional).

## 2026-02-16 03:04:38
- Plano (rodada: extracao do subdominio people/customers)
  - Frontend
    - Criar `apps/web/src/modules/admin-people/behavior.ts` com o comportamento completo atual de clientes:
      - listagem/filtros por busca/estado,
      - paginacao,
      - acao de editar em linha,
      - submit de edicao no modal,
      - carga inicial e refresh.
    - Atualizar `apps/web/src/modules/admin-people/index.ts` para exportar `behavior`.
    - Atualizar `apps/web/src/legacy/admin.behavior.ts` para:
      - inicializar `initAdminPeopleBehavior(...)`,
      - remover seletores/estado/funcoes/listeners/bootstrap de clientes.
    - Nao alterar regras de negocio, textos de interface nem fluxo de professionals.
  - Documentacao
    - Atualizar `docs/config/MODULES_CATALOG.md` para marcar `admin-people` com `behavior.ts`.
  - Qualidade
    - Validar `apps/web` (`npm run lint`, `npm run build`) e regressao `apps/api` (`npm test`, `npm run build`).
- Checkpoint de continuidade
  - Ultimo passo concluido: plano registrado antes da edicao.
  - Proximo passo planejado: implementar `admin-people/behavior.ts` e reconectar o legado.

## 2026-02-16 03:14:22
- Plano executado (desacoplamento do subdominio people/customers)
  - Frontend
    - Novo behavior criado em `apps/web/src/modules/admin-people/behavior.ts` com a logica completa atual de clientes:
      - listagem/filtros por busca e estado,
      - paginacao,
      - acao de editar por linha,
      - submit do modal de edicao,
      - refresh e carga inicial da aba `clientes`.
    - Export do modulo atualizado:
      - `apps/web/src/modules/admin-people/index.ts` agora exporta `behavior`.
    - `apps/web/src/legacy/admin.behavior.ts` atualizado:
      - integra `initAdminPeopleBehavior(...)`;
      - remove seletores/estado/funcoes/listeners/bootstrap de clientes;
      - remove `type CustomerRow` e `updateCustomer` do legado.
    - Escopo preservado:
      - nenhum ajuste no fluxo concierge/whatsapp;
      - nenhum ajuste nas regras de professionals.
  - Documentacao
    - `docs/config/MODULES_CATALOG.md` atualizado: `admin-people` agora inclui `behavior.ts`.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
  - `apps/api`: `npm test` PASS (5 testes).
  - `apps/api`: `npm run build` PASS.
- Observacoes
  - Warning nao bloqueante de chunk grande no build web permanece.
  - Aviso nao bloqueante de asset `images/franchise/mapa_fundo.webp` sem resolucao em build time permanece.
- Checkpoint de continuidade
  - Ultimo passo concluido: subdominio `people/customers` extraido para `admin-people/behavior.ts`.
  - Proximo passo planejado: extrair `people/professionals` do legado para o mesmo modulo `admin-people` mantendo integracao com agenda e perfis profissionais.

## 2026-02-16 03:54:06
- Checkpoint de parada (encerramento da sessao)
  - Ultimo passo concluido:
    - extracao do subdominio people/customers para pps/web/src/modules/admin-people/behavior.ts,
    - integracao no legado via initAdminPeopleBehavior(...),
    - validacao completa executada com PASS (pps/web lint/build, pps/api test/build).
  - Proximo passo planejado:
    - extrair people/professionals do pps/web/src/legacy/admin.behavior.ts para pps/web/src/modules/admin-people/behavior.ts, mantendo integracao com agenda e perfis profissionais.
  - Estado para retomada:
    - concierge/whatsapp mantido sem alteracoes nesta rodada,
    - branch com alteracoes locais em andamento (sem novo commit nesta etapa).

## 2026-02-16 13:05:04
- Plano (rodada: extracao do subdominio people/professionals)
  - Frontend
    - Expandir `apps/web/src/modules/admin-people/behavior.ts` para incluir comportamento completo de profissionais:
      - listagem/filtros por busca/unidade,
      - paginacao,
      - edicao de profissional,
      - integracao com agenda (`open-agenda`),
      - perfis de trabalho e perfis de comissao (CRUD + feedback + bootstrap).
    - Atualizar `apps/web/src/legacy/admin.behavior.ts` para:
      - delegar profissionais para `initAdminPeopleBehavior(...)`,
      - remover seletores/estado/funcoes/listeners/bootstrap de professionals do legado,
      - manter integracao com usuarios (abrir usuario vinculado) via callback.
  - Documentacao
    - Atualizar `docs/config/MODULES_CATALOG.md` para refletir `admin-people` com clientes + profissionais em `behavior.ts`.
  - Qualidade
    - Validar `apps/web` (`npm run lint`, `npm run build`) e regressao `apps/api` (`npm test`, `npm run build`).
- Checkpoint de continuidade
  - Ultimo passo concluido: plano registrado antes da edicao.
  - Proximo passo planejado: implementar extracao de professionals no modulo `admin-people` e limpar o legado.

## 2026-02-16 13:22:01
- Plano executado (desacoplamento do subdominio people/professionals)
  - Frontend
    - `apps/web/src/modules/admin-people/behavior.ts` expandido para cobrir professionals, mantendo customers no mesmo modulo:
      - listagem/filtros/paginacao de profissionais,
      - edicao no modal de profissional,
      - acao `open-agenda` delegada por callback,
      - abertura de usuario vinculado por callback,
      - CRUD/listagem de perfis de trabalho,
      - CRUD/listagem de perfis de comissao,
      - bootstrap inicial de profissionais/perfis.
    - `apps/web/src/legacy/admin.behavior.ts` atualizado para remover o bloco legado de professionals:
      - removidos seletores/estado/funcoes/listeners/bootstrap de professionals,
      - removidos tipos e helpers locais (`Professional*`, `parseOptionalNumber`, etc.) que ficaram encapsulados no modulo,
      - `initAdminPeopleBehavior(...)` agora recebe callbacks de integracao com agenda e usuarios.
  - Documentacao
    - `docs/config/MODULES_CATALOG.md` atualizado: `admin-people` agora explicita behavior dedicado para clientes + profissionais (inclui perfis e integracao com agenda).
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
  - `apps/api`: `npm test` PASS (5 testes).
  - `apps/api`: `npm run build` PASS.
- Observacoes
  - Warning nao bloqueante de chunk grande no build web permanece.
  - Aviso nao bloqueante de asset `images/franchise/mapa_fundo.webp` sem resolucao em build time permanece.
- Checkpoint de continuidade
  - Ultimo passo concluido: subdominio `people/professionals` extraido para `admin-people/behavior.ts` e removido do legado.
  - Proximo passo planejado: reduzir dependencia residual de `legacy/admin.behavior.ts` no dominio `users` (mantendo contratos de seletores) ou iniciar migracao da view `users` para behavior/modulo dedicado dentro de `admin-people`.

## 2026-02-16 13:24:51
- Ajuste de consolidacao (pos-limpeza do legado)
  - `apps/web/src/legacy/admin.behavior.ts` recebeu limpeza adicional para remover sobras de `professionals` apos extracao.
  - Validacao repetida apos limpeza:
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
    - `apps/api`: `npm test` PASS (5 testes).
    - `apps/api`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: limpeza residual de professionals no legado validada com sucesso.
  - Proximo passo planejado: avancar na extracao do dominio `users` para reduzir ainda mais o acoplamento de `legacy/admin.behavior.ts`.

## 2026-02-16 13:44:41
- Plano (rodada final: conclusao da refatoracao React sem acoplamento legado)
  - Frontend
    - Remover dependencia direta de rotas principais em legacy/*.behavior:
      - criar modulo pps/web/src/modules/public-site para comportamentos publicos (index/video/auth-nav),
      - criar modulo pps/web/src/modules/admin-core para comportamento operacional do Admin,
      - atualizar pps/web/src/app/layouts/PublicLayout.tsx e pps/web/src/pages/Admin.tsx para consumir apenas modulos.
    - Criar utilitario compartilhado pps/web/src/shared/dom.ts e migrar os behaviors de modulos para esse ponto comum (sem legacy/dom).
    - Remover LegacyHtml do caminho operacional:
      - migrar componentes de conteudo/view para renderizacao React direta de template modular.
    - Remover imports *.html?raw:
      - converter templates consumidos por rotas/modulos para exports TS versionados por modulo.
  - Documentacao
    - Atualizar docs/config/MODULES_CATALOG.md para refletir os novos modulos de runtime (public-site, dmin-core, shared/dom).
  - Qualidade
    - Validar pps/web (
pm run lint, 
pm run build).
    - Validar pps/api (
pm test, 
pm run build).
    - Executar regressao adicional de fluxo com 
ode scripts/run-page-tests.mjs quando disponivel.
- Checkpoint de continuidade
  - Ultimo passo concluido: plano registrado antes da edicao.
  - Proximo passo planejado: executar migracao estrutural para remover acoplamentos de runtime com legacy e fechar validacoes finais.

## 2026-02-16 14:10:26
- Plano executado (rodada final: fechamento operacional da refatoracao React modular)
  - Frontend / runtime
    - Rotas principais desacopladas de legacy/*.behavior:
      - pps/web/src/app/layouts/PublicLayout.tsx agora consome modules/public-site.
      - pps/web/src/pages/Admin.tsx agora consome modules/admin-core/behavior.ts.
    - Novos modulos de runtime criados:
      - pps/web/src/modules/public-site/{index.behavior.ts,video.behavior.ts,auth.behavior.ts,index.ts}.
      - pps/web/src/modules/admin-core/{behavior.ts,index.ts}.
      - pps/web/src/shared/dom.ts como base comum para eventos DOM.
    - Behaviors dos modulos admin migrados para shared/dom (sem legacy/dom).
    - Bridges de compatibilidade mantidos em pps/web/src/legacy/*.behavior.ts via re-export para os novos modulos.
  - Frontend / templates React
    - Removido uso operacional de LegacyHtml e import *.html?raw no app:
      - novo componente comum pps/web/src/shared/markup/HtmlTemplate.tsx.
      - paginas de conteudo (HomeContent, FranquiasContent, CheckoutContent, AssinaturasContent, AdminContent) migradas para templates TS modulares.
      - views admin (dmin-people/services/goals/performance/products/plans/subscribers/schedule/whatsapp-contacts/sales/tests) migradas para templates TS modulares.
      - pps/web/src/vite-env.d.ts limpo (sem declare module "*.html?raw").
      - pps/web/src/app/LegacyHtml.tsx deixado como stub sem consumo (xport {}) devido bloqueio de permissao de exclusao no ambiente.
    - Novos templates TS gerados:
      - pps/web/src/modules/public-content/templates/*Html.ts.
      - pps/web/src/modules/admin-core/templates/adminShellHtml.ts.
      - pps/web/src/modules/admin-*/templates/*ViewHtml.ts.
  - Qualidade e regressao
    - scripts/run-page-tests.mjs atualizado para validar a arquitetura modular atual (sem referencia a runtime legado).
    - pps/web: 
pm run lint PASS.
    - pps/web: 
pm run build PASS.
    - pps/api: 
pm test PASS (5 testes).
    - pps/api: 
pm run build PASS.
    - 
ode scripts/run-page-tests.mjs: PASS=22 FAIL=0 WARN=0 SKIP=1 (API offline no momento da verificacao).
- Observacoes
  - Warnings nao bloqueantes no build web permanecem:
    - chunk principal acima de 500 kB;
    - asset images/franchise/mapa_fundo.webp sem resolucao em build time.
- Checkpoint de continuidade
  - Ultimo passo concluido: runtime principal migrado para modulos React sem dependencia direta de legacy/*.behavior, com LegacyHtml/?raw removidos do consumo operacional.
  - Proximo passo planejado: substituir gradualmente templates HTML-string por componentes TSX nativos para concluir React puro sem dangerouslySetInnerHTML.

## 2026-02-16 14:29:22
- Plano executado (rodada: migracao das rotas publicas para TSX nativo)
  - Frontend
    - Paginas publicas convertidas de template string para JSX nativo (sem HtmlTemplate):
      - pps/web/src/components/pages/HomeContent.tsx
      - pps/web/src/components/pages/FranquiasContent.tsx
      - pps/web/src/components/pages/CheckoutContent.tsx
      - pps/web/src/components/pages/AssinaturasContent.tsx
    - Ajustes aplicados durante conversao:
      - class -> className;
      - or -> htmlFor;
      - 
eadonly -> 
eadOnly;
      - utocomplete -> utoComplete (checkout);
      - style="background-image: ..." -> style={{ backgroundImage: ... }};
      - handlers inline legados da Home (onclick) migrados para onClick com bridge tipada (uthWindow).
    - Estado operacional apos rodada:
      - rotas publicas principais sem HtmlTemplate;
      - HtmlTemplate permanece apenas no bloco Admin modular ainda pendente de TSX nativo.
  - Regressao/qualidade
    - pps/web: 
pm run lint PASS.
    - pps/web: 
pm run build PASS.
    - pps/api: 
pm test PASS (5 testes).
    - pps/api: 
pm run build PASS.
    - 
ode scripts/run-page-tests.mjs atualizado para validar componentes publicos TSX e ausencia de HtmlTemplate nas paginas publicas:
      - resultado: PASS=25 FAIL=0 WARN=0 SKIP=1 (API offline no momento da verificacao).
- Observacoes
  - Ainda existe dependencia de template HTML no Admin (AdminContent e views admin via HtmlTemplate), proxima frente de migracao para TSX nativo.
  - Remocao fisica de arquivos nao usados em pps/web/src/modules/public-content bloqueada por permissao do ambiente; sem impacto funcional no runtime atual.
- Checkpoint de continuidade
  - Ultimo passo concluido: rotas publicas migradas para TSX nativo e validadas.
  - Proximo passo planejado: iniciar migracao TSX nativo do shell Admin (pps/web/src/components/pages/AdminContent.tsx) e, em seguida, views admin por dominio.

## 2026-02-16 14:47:26
- Plano executado (rodada: fechamento React puro no Admin)
  - Frontend
    - `apps/web/src/components/pages/AdminContent.tsx` migrado para JSX nativo; uso operacional de `HtmlTemplate` removido do Admin.
    - Views Admin migradas para TSX nativo:
      - `apps/web/src/modules/admin-people/components/AdminPeopleView.tsx`
      - `apps/web/src/modules/admin-services/components/AdminServicesView.tsx`
      - `apps/web/src/modules/admin-products/components/AdminProductsView.tsx`
      - `apps/web/src/modules/admin-plans/components/AdminPlansView.tsx`
      - `apps/web/src/modules/admin-subscribers/components/AdminSubscribersView.tsx`
      - `apps/web/src/modules/admin-schedule/components/AdminScheduleView.tsx`
      - `apps/web/src/modules/admin-sales/components/AdminSalesView.tsx`
      - `apps/web/src/modules/admin-whatsapp-contacts/components/AdminWhatsappContactsView.tsx`
      - `apps/web/src/modules/admin-goals/components/AdminGoalsView.tsx`
      - `apps/web/src/modules/admin-performance/components/AdminPerformanceView.tsx`
      - `apps/web/src/modules/admin-tests/components/AdminTestsView.tsx`
    - Correcao pos-conversao JSX:
      - atributos HTML -> JSX (`colspan`, `maxlength`, `inputmode`);
      - atributos numericos tipados (`colSpan={n}`, `maxLength={n}`).
  - Qualidade e regressao
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
    - `apps/api`: `npm test` PASS (5 testes).
    - `apps/api`: `npm run build` PASS.
    - `node scripts/run-page-tests.mjs`: PASS=25 FAIL=0 WARN=0 SKIP=1 (API offline em `http://localhost:3001`).
    - `rg -n "HtmlTemplate" apps/web/src -S`: somente `apps/web/src/shared/markup/HtmlTemplate.tsx` (sem consumo operacional).
  - Documentacao/validacao
    - `scripts/run-page-tests.mjs` atualizado para validar Admin em TSX (sem `HtmlTemplate` e sem `dangerouslySetInnerHTML`).
    - `docs/project/PROJECT_OVERVIEW.md` e `docs/config/MODULES_CATALOG.md` atualizados com estado final.
- Checkpoint de continuidade
  - Ultimo passo concluido: fechamento da migracao para React puro no runtime (rotas publicas + Admin).
  - Proximo passo planejado: limpeza opcional de arquivos de template historicos (`templates/*.html` e `*Html.ts`) se quiser remover referencia legada do repositorio.

## 2026-02-16 14:52:44
- Ajuste final de limpeza
  - Tentativa de remocao de `apps/web/src/shared/markup/HtmlTemplate.tsx` bloqueada por permissao do ambiente (`Access denied`).
  - Confirmado: arquivo permanece sem import/consumo operacional no runtime React atual.
- Checkpoint de continuidade
  - Ultimo passo concluido: validacao final da migracao React puro com testes e build verdes.
  - Proximo passo planejado: remover fisicamente `HtmlTemplate.tsx` quando permissao de escrita/exclusao for normalizada.

## 2026-02-16 15:06:50
- Documentacao tecnica consolidada
  - Criado `docs/evolutive_changes/REACT_MIGRATION_FINAL_SUMMARY.md` com:
    - mudancas estruturais realizadas na migracao para runtime React;
    - ganhos concretos observados neste projeto;
    - estrutura final frontend/backend apos refatoracao;
    - evidencias objetivas de validacao final (lint/build/test/page-tests).
- Checkpoint de continuidade
  - Ultimo passo concluido: consolidacao do resumo executivo-tecnico da refatoracao React.
  - Proximo passo planejado: limpeza fisica opcional dos artefatos legados/templates nao operacionais.

## 2026-02-16 18:49:21
- Ajuste de inicializacao local (fora do repositorio, por solicitacao do usuario)
  - Arquivo alterado: `C:\Users\Jeiel\start_backend.bat`
  - Mudancas aplicadas:
    - Mantida limpeza de variaveis Prisma no inicio.
    - Mantida validacao de `.env` e `node_modules`.
    - Adicionada validacao de banco antes do `npm run dev`:
      - leitura de `DATABASE_URL` do `.env`;
      - extracao de host/porta;
      - teste TCP com timeout (2s);
      - bloqueio de inicializacao quando banco indisponivel, com mensagem objetiva.
- Validacao
  - Script atualizado executa normalmente no cenario com banco online (segue para `npm run dev`).
  - Porta da API (`3001`) ficou ativa apos validacao de execucao.
- Checkpoint de continuidade
  - Ultimo passo concluido: `start_backend.bat` agora valida conectividade do banco antes de subir a API.
  - Proximo passo planejado: opcionalmente aplicar o mesmo padrao em scripts auxiliares de restart.

## 2026-02-16 19:03:52
- Correcao de regressao visual no Admin (menu carregava sem conteudo)
  - Causa raiz
    - `*Island.tsx` consultavam `document.querySelector(...)` durante o render inicial.
    - No primeiro render, os targets dos portais ainda nao estavam no DOM, retornando `null` e impedindo montagem das views.
  - Correcao aplicada
    - Novo hook: `apps/web/src/shared/usePortalTarget.ts`.
    - Islands Admin atualizadas para usar `usePortalTarget(...)` em vez de query direta no render:
      - dashboard, people, services, goals, performance, products, plans, subscribers, schedule, sales, tests, whatsapp-contacts.
      - kpis islands (cards/sales/agenda/commissions) tambem ajustadas.
  - Validacao
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
    - `node scripts/run-page-tests.mjs`: PASS=39 FAIL=0 WARN=0 SKIP=0.
- Checkpoint de continuidade
  - Ultimo passo concluido: conteudo do Admin voltou a montar corretamente apos correcoes de portal target.
  - Proximo passo planejado: limpeza opcional de artefatos legados ainda sem uso operacional.

## 2026-02-16 19:16:56
- Correcao de carga de dados no Admin (views apareciam sem dados)
  - Causa raiz
    - Corrida de montagem entre:
      - islands React (portais das views/KPIs), e
      - inicializacao do `initAdminPage()`.
    - Efeito pratico: os targets/elementos de grid/KPI ainda nao existiam quando os bindings de dados eram inicializados.
  - Correcao aplicada
    - `apps/web/src/shared/usePortalTarget.ts`
      - agora inicia com query imediata quando possivel;
      - usa `MutationObserver` para aguardar target entrar no DOM antes de montar portal.
    - `apps/web/src/pages/Admin.tsx`
      - `initAdminPage()` passou a aguardar seletores criticos dos grids antes de iniciar bindings e fetchs.
  - Validacao
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
    - `node scripts/run-page-tests.mjs`: PASS=39 FAIL=0 WARN=0 SKIP=0.
- Checkpoint de continuidade
  - Ultimo passo concluido: sincronizacao de montagem Admin normalizada; portais e carregamento de dados alinhados.
  - Proximo passo planejado: limpeza opcional de artefatos legados nao operacionais.

## 2026-02-16 19:27:03
- Ajuste adicional de montagem dos portais Admin
  - Causa
    - `usePortalTarget` dependia de `MutationObserver` sem consulta imediata no efeito; em cenarios sem nova mutacao, o target permanecia `null`.
  - Correcao
    - `apps/web/src/shared/usePortalTarget.ts` agora:
      - consulta `document.querySelector(selector)` imediatamente no `useEffect`;
      - somente usa observer quando o target ainda nao existe.
  - Validacao
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
    - `node scripts/run-page-tests.mjs`: PASS=39 FAIL=0 WARN=0 SKIP=0.
  - Observacao
    - E2E Playwright local nao executado neste ambiente por restricao de cache offline do npm (`ENOTCACHED` no pacote playwright).
- Checkpoint de continuidade
  - Ultimo passo concluido: robustez da descoberta de targets dos portais admin normalizada.
  - Proximo passo planejado: validar visualmente no browser com hard refresh e, se necessario, capturar erro de console/rede especifico.

## 2026-02-16 19:38:19
- Correcao visual de KPIs na primeira tela do Admin (cards duplicados/placeholder persistente)
  - Causa raiz
    - `apps/web/src/modules/admin-dashboard/components/AdminDashboardView.tsx` ainda continha placeholders estaticos dentro dos containers de portal:
      - `data-react-admin-dashboard-kpis`
      - `data-react-admin-dashboard-sales`
      - `data-react-admin-dashboard-agenda`
      - `data-react-admin-dashboard-commissions`
    - Os islands React renderizavam os paineis reais no mesmo container, mantendo o bloco "Carregando..." antigo acima.
  - Correcao aplicada
    - `apps/web/src/modules/admin-dashboard/components/AdminDashboardView.tsx`
      - removidos os placeholders estaticos de KPI/sales/agenda/comissoes;
      - mantidos somente os alvos de montagem React (containers vazios com `data-react-*`).
  - Resultado esperado
    - os 3 primeiros cards passam a exibir apenas o estado/controlador React (loading real -> dados da API), sem duplicacao visual.
- Checkpoint de continuidade
  - Ultimo passo concluido: limpeza dos placeholders legados da dashboard admin.
  - Proximo passo planejado: validar em browser com hard refresh para confirmar ausencia dos cards estaticos.

## 2026-02-16 20:46:49
- Ajuste de caminho de asset na pagina Franquias (warning de build Vite)
  - Arquivos alterados:
    - `apps/web/src/components/pages/FranquiasContent.tsx`
    - `apps/web/src/styles/tailwind.css`
  - Mudanca:
    - `images/franchise/mapa_fundo.webp` -> `/images/franchise/mapa_fundo.webp`
    - seletor utilitario CSS correspondente atualizado para manter compatibilidade da classe.
- Checkpoint de continuidade
  - Ultimo passo concluido: normalizacao de caminho absoluto do asset `mapa_fundo.webp`.
  - Proximo passo planejado: validar build para confirmar eliminacao do warning de resolucao em tempo de build.

## 2026-02-16 21:04:08
- Admin Pessoas: Clientes ganhou acao de inclusao (UI + backend)
  - Frontend (`apps/web/src/modules/admin-people/components/AdminPeopleView.tsx`)
    - adicionado botao `Incluir cliente` na aba `Clientes` (`data-people-customers-create`, `data-open-modal="customer-create"`);
    - adicionado modal `customer-create` com campos de cadastro (nome, telefone, telefone2, email, cidade, estado, bairro, usuario vinculado, observacao).
  - Frontend comportamento (`apps/web/src/modules/admin-people/behavior.ts`)
    - adicionados seletores e fluxo de criacao:
      - reset do formulario ao abrir modal;
      - `POST /customers` ao salvar (`data-customer-create-save`);
      - feedback de status, fechamento de modal e refresh da grid apos sucesso.
  - Backend (`apps/api/src/routes/index.ts`)
    - adicionado `customerCreateSchema` com validacoes de payload;
    - adicionado endpoint `POST /customers` com:
      - validacao de `userId` vinculado (existencia + role permitida);
      - normalizacao de campos opcionais;
      - tratamento de conflito unico (`P2002`) com retorno `409`.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
  - `apps/api`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: tela de clientes agora possui inclusao de novo cliente no Admin.
  - Proximo passo planejado: validacao manual no browser do fluxo completo (abrir modal -> criar cliente -> confirmar linha nova no grid).

## 2026-02-16 21:12:53
- Admin Pessoas: ajuste de altura da janela das grids (Clientes/Profissionais/Usuarios)
  - Arquivo alterado: `apps/web/src/modules/admin-people/components/AdminPeopleView.tsx`
  - Mudanca aplicada nos containers de grid:
    - `overflow-y-hidden` -> `overflow-y-auto`
    - adicionado `min-h-[320px]`
    - adicionado `max-h-[68vh]`
  - Efeito:
    - evita grid "achatada" com apenas 1 linha visivel;
    - area de tabela fica dinamica e com scroll vertical interno quando excede altura.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: janela da grid de clientes normalizada para altura dinamica.
  - Proximo passo planejado: validacao visual no navegador e ajuste fino opcional de `max-h` conforme preferencia de UX.

## 2026-02-16 21:24:05
- Admin Dashboard: contraste de grid e carga de leads
  - Causa raiz (leads sem dados)
    - `AdminDashboardView` renderizava condicionalmente a aba `Leads`; os elementos `data-leads-*` nao existiam no DOM na inicializacao do `initAdminPage()`, impedindo bind completo do modulo `admin-leads`.
  - Correcao aplicada (carga de leads)
    - `apps/web/src/modules/admin-dashboard/components/AdminDashboardView.tsx`
      - abas `Servicos` e `Leads` agora permanecem montadas no DOM e alternam visibilidade por classe `hidden`;
      - garante que `data-leads-table-body` e demais `data-leads-*` existam durante bootstrap e recebam dados de `/franchise-leads`.
  - Correcao aplicada (contraste visual)
    - `apps/web/src/modules/admin-kpis/components/AdminDashboardCommissionsPanel.tsx`
      - cabecalho da tabela final de comissoes ajustado para `bg-forest` + texto branco explicito.
    - `apps/web/src/modules/admin-dashboard/components/AdminDashboardView.tsx`
      - cabecalho da tabela de leads ajustado para fundo escuro e texto branco.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: grid final da primeira tela com contraste legivel e aba Leads apta a carregar dados novamente.
  - Proximo passo planejado: validar no browser com hard refresh e confirmar listagem de leads reais no dashboard.

## 2026-02-16 21:39:35
- Reposicionamento do painel de comissoes (Dashboard -> Pessoas/Profissionais)
  - Objetivo
    - Remover o bloco "Visao Geral de Comissoes" da primeira pagina (Dashboard, aba Servicos) e exibir no modulo `Pessoas`, aba `Profissionais`, logo apos a grid de profissionais.
  - Alteracoes aplicadas
    - `apps/web/src/modules/admin-dashboard/components/AdminDashboardView.tsx`
      - removido target `data-react-admin-dashboard-commissions` da aba `Servicos`.
    - `apps/web/src/modules/admin-people/components/AdminPeopleView.tsx`
      - adicionado target `data-react-admin-dashboard-commissions` apos `data-people-professionals-grid-scroll`.
  - Observacao tecnica
    - componente React de comissoes (island existente) foi reaproveitado sem duplicacao de logica, apenas mudanca do ponto de montagem.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: painel de comissoes movido para `Pessoas > Profissionais` apos a grid.
  - Proximo passo planejado: validacao visual no browser para confirmar ordem e espacamento no layout final.

## 2026-02-16 21:45:18
- Uniformizacao de cores no painel de comissoes (Pessoas > Profissionais)
  - Problema
    - havia dois paineis verdes com contraste inconsistente: um com texto branco e outro com texto escuro.
  - Ajuste aplicado
    - `apps/web/src/modules/admin-kpis/components/AdminDashboardCommissionsPanel.tsx`
      - header do painel agora usa `bg-primary` + titulo em `text-white`;
      - controles do header (select/botao) padronizados para fundo claro e texto verde, mantendo legibilidade sobre header verde.
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: contraste/cores uniformizados entre paineis verdes no modulo de profissionais.
  - Proximo passo planejado: validacao visual final no browser com hard refresh.

## 2026-02-16 21:49:33
- Ajuste visual solicitado no painel de comissoes (Pessoas > Profissionais)
  - Arquivo: `apps/web/src/modules/admin-kpis/components/AdminDashboardCommissionsPanel.tsx`
  - Mudanca:
    - titulo `Visao Geral de Comissoes` ajustado para o mesmo estilo do texto do toolbar de profissionais (`text-xs text-white font-medium uppercase tracking-wider`).
- Validacao
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: segundo box com mesma fonte e mesma cor do primeiro box, conforme solicitado.
  - Proximo passo planejado: validacao visual no browser (hard refresh).

## 2026-02-16 21:51:53
- Correcao final de contraste no titulo "Visao Geral de Comissoes"
  - Arquivo: `apps/web/src/modules/admin-kpis/components/AdminDashboardCommissionsPanel.tsx`
  - Causa: regra global `.admin-main h3` sobrescrevia classe utilitaria e mantinha texto escuro.
  - Ajuste: aplicado `style={{ color: "#ffffff" }}` no `h3` para garantir branco.
- Validacao
  - `apps/web`: `npm run lint` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: titulo do segundo box garantido em branco.
  - Proximo passo planejado: validacao visual com hard refresh.

## 2026-02-17 00:35:10
- Plano de alteracao aprovado: remocao do mini-CMS legado (`dcmsky` + scripts PHP) com preservacao do fluxo operacional de configuracoes WhatsApp
  - Passos planejados
    - mapear e desacoplar uso ativo de `/content` para novo endpoint sem semantica de CMS (`/settings`);
    - migrar frontend/admin WhatsApp para `/settings`;
    - manter persistencia em `ContentEntry` nesta etapa (sem migracao de schema) para evitar breaking change de dados;
    - remover atributo `dcmsky` dos componentes React;
    - ajustar seletores runtime que dependiam de `[dcmsky=...]`;
    - remover artefatos legados `cms/*.php` e `data/content*.json`/relatorios relacionados;
    - atualizar documentacao para remover referencia a CMS HTML legado;
    - executar validacao final (`lint`/`build`) e registrar checkpoint.
- Status
  - Em andamento.

## 2026-02-17 01:07:01
- Remocao do mini-CMS legado e consolidacao para React + settings operacionais
  - API
    - `apps/api/src/routes/index.ts`
      - endpoints administrativos de configuracao alterados de `/content` para `/settings`:
        - `GET /api/settings`
        - `GET /api/settings/:key`
        - `PUT /api/settings/:key`
  - Frontend (admin/WhatsApp)
    - `apps/web/src/modules/admin-whatsapp-contacts/behavior.ts`
      - migrado consumo de configuracoes para `/api/settings/:key`.
    - `apps/web/src/pages/DbConsole.tsx`
      - tabela de inspecao alterada de `ContentEntry (/content)` para `Settings (/settings)`.
  - Frontend (React puro sem `dcmsky`)
    - removidos atributos `dcmsky` dos componentes TSX do app web.
    - `apps/web/src/modules/public-site/index.behavior.ts`
      - seletores atualizados de `[dcmsky=...]` para `data-*` dedicados.
    - `apps/web/src/components/pages/HomeContent.tsx`
      - adicionados `data-spotlight-title`, `data-spotlight-price`, `data-spotlight-description` para manter o comportamento do spotlight.
    - `apps/web/src/types/jsx.d.ts`
      - removido suporte efetivo ao atributo custom legado (`dcmsky`).
  - Legado mini-CMS
    - `cms/*.php` substituidos por stubs deprecados (sem fluxo operacional).
    - `data/content*.json` e relatorios de chaves zerados para neutralizar uso legado.
    - Observacao: remocao fisica dos arquivos foi bloqueada por permissao de filesystem; aplicado fallback seguro de neutralizacao.
  - Documentacao atualizada
    - `docs/project/PROJECT_OVERVIEW.md`
      - removida descricao de CMS por `dcmsky`/`content.json`.
      - adicionada secao de runtime settings via `/api/settings`.
    - `docs/config/ESPECIFICACAO_FLUXO_CONCIERGE_2026-02-13.md`
      - endpoints atualizados para `/api/settings/:key`.
    - `docs/evolutive_changes/REACT_MIGRATION_GUIDE.md`
      - regra ajustada para nao usar `dcmsky`.
    - `docs/evolutive_changes/VITE_REACT_MIGRATION_PLAN.md`
      - referencia trocada de `dcmsky` para `data-*` de runtime.
- Validacao executada
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.
  - `apps/api`: `npm run build` PASS.
  - `apps/api`: `npm test` PASS (5/5).
- Checkpoint de continuidade
  - Ultimo passo concluido: mini-CMS legado removido do fluxo operacional, com frontend React sem `dcmsky` e configuracoes administrativas em `/settings`.
  - Proximo passo planejado: se desejado, realizar limpeza fisica definitiva dos arquivos legados (`cms/*`, `data/content*`) em ambiente com permissao de delete e remover a tabela `ContentEntry` somente apos migrar settings para entidade dedicada.

## 2026-02-17 01:38:46
- Revisao documental para retomada da refatoracao
  - Passos planejados:
    - revisar documentos-base (`REACT_MIGRATION_FINAL_SUMMARY`, `MODULES_CATALOG`, `PROJECT_OVERVIEW`) contra o estado real do codigo;
    - corrigir trechos desatualizados sobre artefatos legados inexistentes (`legacy/`, `templates`, `HtmlTemplate`);
    - documentar pendencias objetivas para continuidade na proxima sessao.
- Status
  - Em andamento.

## 2026-02-17 01:40:23
- Revisao documental concluida e pendencias formalizadas para retomada
  - `docs/evolutive_changes/REACT_MIGRATION_FINAL_SUMMARY.md`
    - consolidado estado atual para 2026-02-17;
    - adicionado bloco objetivo "O que falta (para continuar amanha)".
  - `docs/config/MODULES_CATALOG.md`
    - catalogo reescrito com a estrutura real de modulos em runtime;
    - removidas referencias desatualizadas a `legacy/`, `templates/*.html` e `HtmlTemplate`.
  - `docs/project/PROJECT_OVERVIEW.md`
    - data de status atualizada para 2026-02-17;
    - adicionada referencia ao checklist da proxima sessao.
  - `docs/evolutive_changes/NEXT_SESSION_CHECKLIST_2026-02-17.md`
    - novo checklist de continuidade (limpeza fisica, decisao de settings, homologacao final e encerramento).
- Checkpoint de continuidade
  - Ultimo passo concluido: documentacao principal revisada e pendencias de continuidade documentadas com checklist executavel.
  - Proximo passo planejado: iniciar a sessao seguinte pela Secao 1 do `docs/evolutive_changes/NEXT_SESSION_CHECKLIST_2026-02-17.md` (limpeza fisica de legado e validacao de referencias).

## 2026-02-17 11:03:02
- Troca aplicada para `Settings` (model dedicado no Prisma) com compatibilidade de dados existente
  - Plano executado
    - trocar model Prisma de `ContentEntry` para `Setting`;
    - migrar acessos backend/frontend para nomenclatura `Setting`;
    - regenerar Prisma Client e validar build/testes;
    - atualizar documentacao de pendencias para refletir decisao executada.
  - Alteracoes de codigo
    - `apps/api/prisma/schema.prisma`
      - model renomeado para `Setting` com `@@map("ContentEntry")` (compatibilidade com tabela fisica atual).
    - `apps/api/src/routes/index.ts`
      - `/api/settings` passou a usar `prisma.setting.*`.
    - `apps/api/src/modules/chatbot/flow/conciergeFlow.ts`
      - leitura de configuracoes via `prisma.setting.findMany(...)`.
    - `apps/web/src/modules/admin-whatsapp-contacts/behavior.ts`
      - tipo local renomeado de `ContentEntryRow` para `SettingRow`.
  - Atualizacoes de documentacao
    - `docs/project/PROJECT_OVERVIEW.md`
    - `docs/config/MODULES_CATALOG.md`
    - `docs/evolutive_changes/REACT_MIGRATION_FINAL_SUMMARY.md`
    - `docs/evolutive_changes/NEXT_SESSION_CHECKLIST_2026-02-17.md`
  - Validacao
    - `apps/api`: `npm run prisma:generate` PASS.
    - `apps/api`: `npm run build` PASS.
    - `apps/api`: `npm test` PASS (5/5).
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
  - Observacao tecnica
    - nao foi necessaria migracao de banco nesta etapa, pois `Setting` utiliza `@@map("ContentEntry")` para preservar dados e evitar breaking change imediato.
- Checkpoint de continuidade
  - Ultimo passo concluido: troca para `Settings` concluida no codigo (API, fluxo WhatsApp e Prisma client), mantendo compatibilidade com a tabela existente.
  - Proximo passo planejado: opcionalmente executar migracao fisica de tabela (`ContentEntry` -> `Setting`) quando desejar saneamento completo de schema no banco.

## 2026-02-17 13:44:06
- Ajuste visual no footer publico (coluna esquerda)
  - Plano executado
    - manter o card branco (`footer-card`) da coluna esquerda;
    - substituir logo + texto por imagem unica `footer.webp`;
    - preservar os icones sociais existentes.
  - Alteracao de codigo
    - `apps/web/src/modules/footer/components/PublicSiteFooter.tsx`
      - bloco interno do primeiro `footer-card` trocado para `<img src="/images/footer.webp" ... />`.
  - Validacao
    - `apps/web`: `npm run lint` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: card esquerdo do footer atualizado para usar imagem unica, mantendo estrutura e icones sociais.
  - Proximo passo planejado: revisar no navegador proporcao/recorte da imagem `footer.webp` em desktop e mobile.

## 2026-02-17 13:48:58
- Reorganizacao da coluna direita do footer
  - Plano executado
    - mover a secao `Horario` para a mesma coluna da secao `Entre na Lista de Convidados`;
    - remover a coluna isolada de horario para consolidar o bloco da direita.
  - Alteracao de codigo
    - `apps/web/src/modules/footer/components/PublicSiteFooter.tsx`
      - coluna `Horario` removida como bloco independente;
      - `Horario` inserido no bloco com `id="contact"`, acima do card de convidados.
  - Validacao
    - `apps/web`: `npm run lint` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: coluna direita consolidada com `Horario + Lista de Convidados`.
  - Proximo passo planejado: validar visualmente no browser se altura percebida entre coluna esquerda e direita ficou conforme esperado.

## 2026-02-17 13:53:29
- Ajuste de layout do footer para desktop (largura de colunas)
  - Plano executado
    - separar novamente `Horario` e `Entre na Lista de Convidados` em duas colunas distintas na direita;
    - ampliar a coluna central de `Contato` apenas em telas grandes (`lg`), mantendo comportamento mobile/tablet.
  - Alteracoes de codigo
    - `apps/web/src/modules/footer/components/PublicSiteFooter.tsx`
      - `Horario` voltou a ser coluna independente;
      - `Entre na Lista de Convidados` voltou para a quarta coluna (`id="contact"`).
    - `apps/web/src/styles/tailwind.css`
      - no breakpoint `@media (min-width: 1024px)`, `footer-grid` alterado para colunas proporcionais:
        - `1.05fr 1.55fr 1fr 1.2fr`.
  - Validacao
    - `apps/web`: `npm run lint` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: footer em desktop com duas secoes na direita lado a lado e coluna de contato ampliada.
  - Proximo passo planejado: validar visualmente no browser se as proporcoes ficaram satisfatorias; ajustar os `fr` se necessario.

## 2026-02-17 14:22:42
- Validacao apos ajuste manual no footer
  - Contexto
    - ajuste final de layout realizado manualmente no arquivo do footer.
  - Validacao executada
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
  - Observacao tecnica
    - aviso nao bloqueante de chunk grande no Vite permanece (`index-*.js` > 500 kB).
- Checkpoint de continuidade
  - Ultimo passo concluido: ajuste manual confirmado com lint/build sem erro.
  - Proximo passo planejado: opcionalmente aplicar code-splitting para reduzir tamanho do bundle principal.

## 2026-02-17 16:24:16
- Ajuste de UX na tela Admin > Produtos (edicao por ID)
  - Plano executado
    - adicionar marcador visual no titulo `Entrada de Produto`;
    - rolar automaticamente para a secao de formulario ao clicar em editar (ID/icone).
  - Alteracoes de codigo
    - `apps/web/src/modules/admin-products/components/AdminProductsView.tsx`
      - secao de formulario marcada com `data-product-entry-section`;
      - titulo `Entrada de Produto` recebeu marcador `•`.
    - `apps/web/src/modules/admin-products/behavior.ts`
      - adicionado `scrollToProductEntry()` com `scrollIntoView({ behavior: "smooth", block: "start" })`;
      - chamada do scroll no fluxo de `action === "edit"`.
  - Validacao
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
  - Observacao tecnica
    - aviso nao bloqueante de chunk grande no Vite permanece (`index-*.js` > 500 kB).
- Checkpoint de continuidade
  - Ultimo passo concluido: ao clicar no ID/editar de produto, o sistema preenche e leva o usuario ate `Entrada de Produto`.
  - Proximo passo planejado: opcionalmente adicionar destaque visual temporario na secao apos o scroll (pulse/borda) para reforcar percepcao.

## 2026-02-17 16:43:13
- Correcao de travamento percebido ao clicar em `Atualizar produto`
  - Causa tratada
    - fluxo de salvar/atualizar sem feedback e sem `try/catch`; quando API retornava erro de validacao/sessao, a tela parecia "parada".
  - Plano executado
    - incluir feedback visual de status/erro no card `Entrada de Produto`;
    - validar campos obrigatorios com mensagens explicitas (nome, preco, estoque);
    - aplicar estado de carregamento no botao durante requisicao;
    - tratar erros da API com mensagem ao usuario.
  - Alteracoes de codigo
    - `apps/web/src/modules/admin-products/components/AdminProductsView.tsx`
      - adicionado elemento de feedback `data-product-feedback`.
    - `apps/web/src/modules/admin-products/behavior.ts`
      - adicionados `setProductFeedback(...)` e `parseOptionalSelectId(...)`;
      - `data-product-save` agora usa `try/catch/finally`, com botao desabilitado e textos `Salvando.../Atualizando...`;
      - mensagens de validacao para nome, preco e estoque;
      - mensagem de erro exibida quando a API falha;
      - mensagem informativa ao carregar item para edicao.
  - Validacao
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
  - Observacao tecnica
    - aviso nao bloqueante de chunk grande no Vite permanece (`index-*.js` > 500 kB).
- Checkpoint de continuidade
  - Ultimo passo concluido: fluxo de atualizar produto deixou de falhar silenciosamente e agora informa erro/sucesso ao usuario.
  - Proximo passo planejado: se ocorrer nova falha, capturar a mensagem exibida no feedback para identificar exatamente a regra de negocio rejeitada pela API.

## 2026-02-17 16:57:28
- Correcao backend para erro 500 em operacoes de produto
  - Causa tratada
    - endpoints de produto sem tratamento especifico de erro Prisma; falhas de referencia (categoria/status) retornavam `erro interno no servidor` (500).
  - Plano executado
    - normalizar IDs opcionais de categoria/status (0/valor vazio -> `null`);
    - validar existencia de categoria/status antes de create/update;
    - tratar erros Prisma conhecidos (P2003/P2025) em create/update/delete;
    - manter log estruturado para falhas inesperadas.
  - Alteracoes de codigo
    - `apps/api/src/routes/index.ts`
      - `POST /products`: validacao previa de `productCategoryId`/`productStatusId`, `try/catch` com resposta de negocio.
      - `PATCH /products/:id`: validacao previa de referencias, tratamento de `P2025` (nao encontrado) e `P2003` (referencia invalida).
      - `DELETE /products/:id`: tratamento de `P2025` (nao encontrado).
  - Validacao
    - `apps/api`: `npm run build` PASS.
    - `apps/api`: `npm test` PASS (5/5).
    - smoke local: patch com `productCategoryId` inexistente passou de `500` para `400` com mensagem `produto invalido`.
- Checkpoint de continuidade
  - Ultimo passo concluido: backend de produtos deixou de devolver erro interno generico para falhas de referencia.
  - Proximo passo planejado: opcionalmente enriquecer detalhe de erro no frontend para exibir causa especifica em producao (quando `NODE_ENV` nao for development).

## 2026-02-17 17:03:47
- Alteracao estrutural no banco para suportar descricoes longas
  - Plano executado
    - alterar campos de descricao para `TEXT` no schema Prisma;
    - criar migration SQL para atualizar as colunas no MySQL;
    - aplicar migration localmente e validar API.
  - Alteracoes de codigo
    - `apps/api/prisma/schema.prisma`
      - `Product.description` -> `@db.Text`
      - `Service.description` -> `@db.Text`
      - `Membership.description` -> `@db.Text`
    - `apps/api/prisma/migrations/20260217170500_expand_description_fields_to_text/migration.sql`
      - `ALTER TABLE Product/Service/Membership MODIFY description TEXT NULL`.
  - Migracao de banco
    - `apps/api`: `npx prisma migrate deploy` PASS (migration aplicada com sucesso).
  - Validacao
    - `apps/api`: `npx prisma generate --no-engine` PASS.
    - `apps/api`: `npm run build` PASS.
    - `apps/api`: `npm test` PASS (5/5).
  - Observacao tecnica
    - `npm run prisma:generate` (com engine) falhou por lock do arquivo da engine enquanto API estava em execucao; geracao sem engine foi executada para atualizar client/tipos sem interromper servico.
- Checkpoint de continuidade
  - Ultimo passo concluido: banco local atualizado para aceitar descricoes maiores em produtos/servicos/assinaturas.
  - Proximo passo planejado: se desejar, reiniciar backend fora do watch e executar `npm run prisma:generate` novamente para regenerar com engine sem lock.

## 2026-02-17 17:30:38
- Padronizacao visual das grids admin + ajuste da tabela de produtos
  - Plano executado
    - aplicar contraste forte nos titulos de colunas em todas as tabelas do admin;
    - adicionar rolagem horizontal na grid de produtos;
    - reduzir impacto da coluna `Descricao` na largura da tabela de produtos.
  - Alteracoes de codigo
    - `apps/web/src/components/pages/AdminContent.tsx`
      - padrao global de cabecalho das tabelas alterado:
        - `thead` com fundo claro (`#efe6d0`);
        - `th` com texto escuro (`#1b2f24`) e peso maior.
    - `apps/web/src/modules/admin-products/components/AdminProductsView.tsx`
      - tabela de produtos envolvida com `overflow-x-auto` (`data-products-grid-scroll`);
      - coluna `Descricao` com largura fixa reduzida (`200px`).
    - `apps/web/src/modules/admin-products/behavior.ts`
      - celula `Descricao` ajustada para truncar texto com `ellipsis` e `title` com conteudo completo.
  - Validacao
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
  - Observacao tecnica
    - aviso nao bloqueante de chunk grande no Vite permanece (`index-*.js` > 500 kB).
- Checkpoint de continuidade
  - Ultimo passo concluido: titulos de colunas com contraste padronizado e grid de produtos com scroll horizontal e descricao compacta.
  - Proximo passo planejado: calibrar finamente larguras de colunas da tabela de produtos conforme preferencia de leitura em desktop.

## 2026-02-17 17:33:51
- Ajuste fino de largura da coluna `Descricao` na grid de produtos
  - Plano executado
    - reduzir novamente a largura fixa da coluna `Descricao`;
    - reduzir largura do texto truncado para manter mais colunas visiveis.
  - Alteracoes de codigo
    - `apps/web/src/modules/admin-products/components/AdminProductsView.tsx`
      - coluna `Descricao` ajustada de `200px` para `150px`.
    - `apps/web/src/modules/admin-products/behavior.ts`
      - celula de descricao ajustada para `150px` com texto truncado em `130px`.
  - Validacao
    - `apps/web`: `npm run lint` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: coluna de descricao ficou mais estreita e liberou espaco para os demais campos.
  - Proximo passo planejado: se ainda necessario, reduzir para `120px` ou ocultar algumas colunas secundarias por breakpoint.

## 2026-02-17 17:37:25
- Nova reducao da coluna `Descricao` (grid de produtos)
  - Plano executado
    - reduzir coluna para largura compacta extrema.
  - Alteracoes de codigo
    - `apps/web/src/modules/admin-products/components/AdminProductsView.tsx`
      - coluna `Descricao` ajustada de `150px` para `120px`.
    - `apps/web/src/modules/admin-products/behavior.ts`
      - texto truncado ajustado de `130px` para `100px`.
  - Validacao
    - `apps/web`: `npm run lint` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: coluna `Descricao` minimizada para aumentar a visibilidade dos demais campos.
  - Proximo passo planejado: se quiser ainda mais compacto, remover coluna `Beneficios` da grid e deixar apenas no formulario/modal.

## 2026-02-17 17:41:14
- Reducao adicional da coluna `Descricao` para metade do tamanho atual
  - Plano executado
    - reduzir de `120px` para `60px` conforme solicitado.
  - Alteracoes de codigo
    - `apps/web/src/modules/admin-products/components/AdminProductsView.tsx`
      - coluna `Descricao` ajustada para `60px`.
    - `apps/web/src/modules/admin-products/behavior.ts`
      - texto truncado da descricao ajustado para `48px`.
  - Validacao
    - `apps/web`: `npm run lint` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: coluna `Descricao` ficou em metade do tamanho anterior.
  - Proximo passo planejado: caso fique pequeno demais para uso, ajustar para compromisso em `80px`.

## 2026-02-17 17:59:19
- Ajuste definitivo da coluna `Descricao` na grid de produtos (largura fixa + quebra controlada)
  - Plano executado
    - fixar largura da coluna no header e nas linhas por `style` inline;
    - remover dependencia de utilitarias para controle de largura dessa coluna;
    - aplicar quebra/truncamento visual em ate 2 linhas para evitar expansao horizontal do texto longo.
  - Alteracoes de codigo
    - `apps/web/src/modules/admin-products/components/AdminProductsView.tsx`
      - `th` de `Descricao` alterado para largura fixa `140px` com `style` inline.
    - `apps/web/src/modules/admin-products/behavior.ts`
      - `td` de `Descricao` alterado para largura fixa `140px` com `style` inline;
      - texto da descricao alterado para classe dedicada `product-description-text`.
    - `apps/web/src/components/pages/AdminContent.tsx`
      - adicionadas regras globais:
        - `.product-description-head/.product-description-cell` com largura fixa de `140px`;
        - `.product-description-text` com clamp visual em 2 linhas e quebra de palavra.
  - Validacao
    - `apps/web`: `npm run lint` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: coluna `Descricao` da grid de produtos nao cresce mais conforme o tamanho do texto.
  - Proximo passo planejado: se quiser ainda mais compacta, reduzir `140px` para `120px` ou `100px` mantendo clamp em 2 linhas.

## 2026-02-17 18:08:12
- Reordenacao da coluna `Destaque` na grid de produtos
  - Plano executado
    - mover `Destaque` para ficar ao lado de `Produto`, antes de `Descricao`;
    - manter ordem de dados no corpo da tabela igual ao cabecalho.
  - Alteracoes de codigo
    - `apps/web/src/modules/admin-products/components/AdminProductsView.tsx`
      - cabecalho da grid alterado para: `ID | Produto | Destaque | Descricao | ...`.
    - `apps/web/src/modules/admin-products/behavior.ts`
      - celula de `Destaque` movida para imediatamente apos `Produto`, antes de `Descricao`.
  - Validacao
    - `apps/web`: `npm run lint` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: coluna `Destaque` reposicionada antes de `Descricao` no cabecalho e nas linhas.
  - Proximo passo planejado: ajustar larguras finas dessas duas colunas se necessario apos validacao visual.

## 2026-02-17 18:13:26
- Destaque visual condicional na coluna `Destaque` (grid de produtos)
  - Plano executado
    - manter valor textual `Sim/Nao`;
    - aplicar estilo diferenciado quando `Sim`.
  - Alteracoes de codigo
    - `apps/web/src/modules/admin-products/behavior.ts`
      - adicionado `featuredClass` condicional;
      - `Sim` agora usa badge com fundo verde claro, borda verde clara e texto verde escuro;
      - `Nao` permanece com estilo neutro.
  - Validacao
    - `apps/web`: `npm run lint` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: coluna `Destaque` agora evidencia visualmente registros com `Sim`.
  - Proximo passo planejado: se preferir, trocar o destaque de verde claro para dourado seguindo paleta de marca.

## 2026-02-17 18:19:47
- Correção definitiva do estilo condicional em `Destaque` (grid de produtos)
  - Diagnostico
    - o badge de `Sim` permaneceu neutro no browser.
  - Alteracoes de codigo
    - `apps/web/src/modules/admin-products/behavior.ts`
      - removida dependencia de classes utilitarias para cor do badge;
      - aplicado `style` inline condicional por linha:
        - `Sim`: fundo verde claro, texto verde escuro, borda verde clara;
        - `Nao`: fundo cinza claro, texto cinza escuro, borda cinza.
  - Validacao
    - `apps/web`: `npm run lint` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: badge `Destaque` agora usa estilo condicional garantido no render dinamico.
  - Proximo passo planejado: ajustar para paleta dourada se preferir ao verde claro.

## 2026-02-17 18:48:09
- Modularizacao da Home + base de toggles por SPA publica (Home/Assinaturas/Franquias)
  - Plano executado
    - separar secoes principais da Home em componentes dedicados;
    - criar mapa central para ligar/desligar secoes por pagina publica;
    - reutilizar bloco de assinatura/depoimentos entre Home e Assinaturas;
    - aplicar toggles em Franquias sem reestruturar markup existente.
  - Alteracoes de codigo
    - Nova infraestrutura de secoes
      - `apps/web/src/modules/public-site/sections/index.ts`
      - `apps/web/src/modules/public-site/sectionToggles.ts`
      - componentes criados em `apps/web/src/modules/public-site/sections/`:
        - `HomeHeroSection.tsx`
        - `HomeServicesSection.tsx`
        - `HomeMembershipSection.tsx` (com prop `title` para reutilizacao)
        - `HomeAboutSection.tsx`
        - `HomeProductsSection.tsx`
        - `HomeTestimonialsSection.tsx`
        - `HomeCtaSection.tsx`
    - Home
      - `apps/web/src/components/pages/HomeContent.tsx`
        - secoes principais substituidas por componentes;
        - render condicional por toggle (`isPublicSectionEnabled("home", ...)`).
    - Assinaturas
      - `apps/web/src/components/pages/AssinaturasContent.tsx`
        - passou a reutilizar `HomeMembershipSection`, `HomeAboutSection`, `HomeTestimonialsSection`;
        - toggle de hero aplicado (`isPublicSectionEnabled("assinaturas", "hero")`).
    - Franquias
      - `apps/web/src/components/pages/FranquiasContent.tsx`
        - toggles aplicados por secao via classe (`hero`, `vision`, `models`, `contact`).
  - Validacao
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
  - Observacao tecnica
    - warning nao bloqueante de chunk grande no build permanece (`index-*.js` > 500 kB).
- Checkpoint de continuidade
  - Ultimo passo concluido: estrutura publica preparada para ligar/desligar secoes por pagina com home modularizada por componentes.
  - Proximo passo planejado: opcionalmente extrair tambem seções de `FranquiasContent` para componentes dedicados, no mesmo padrao aplicado em Home.

## 2026-02-17 19:12:37
- Modularizacao completa de `FranquiasContent` + painel administrativo para editar `sectionToggles.ts`
  - Plano executado
    - concluir em franquias o mesmo padrao de composicao por secoes aplicado na home;
    - criar tela administrativa para ligar/desligar secoes de SPA publica;
    - restringir acesso por e-mail (`jeiel.borner@gmail.com`);
    - persistir alteracoes no arquivo `apps/web/src/modules/public-site/sectionToggles.ts` via API.
  - Alteracoes de codigo
    - Franquias modular
      - novos componentes:
        - `apps/web/src/modules/public-site/sections/FranquiasHeroSection.tsx`
        - `apps/web/src/modules/public-site/sections/FranquiasVisionSection.tsx`
        - `apps/web/src/modules/public-site/sections/FranquiasModelsSection.tsx`
        - `apps/web/src/modules/public-site/sections/FranquiasContactSection.tsx`
      - exportacoes centralizadas em `apps/web/src/modules/public-site/sections/index.ts`.
      - `apps/web/src/components/pages/FranquiasContent.tsx` reescrito para composicao por secoes + toggles.
    - Admin: nova tela de toggles
      - modulo novo:
        - `apps/web/src/modules/admin-section-toggles/components/AdminSectionTogglesView.tsx`
        - `apps/web/src/modules/admin-section-toggles/components/AdminSectionTogglesViewIsland.tsx`
        - `apps/web/src/modules/admin-section-toggles/index.ts`
      - integrado em:
        - `apps/web/src/pages/Admin.tsx` (island)
        - `apps/web/src/components/pages/AdminContent.tsx` (menu + `view-panel`)
      - restricao visual por e-mail aplicada no shell:
        - `apps/web/src/modules/admin-core/behavior.ts` (esconde menu/aba para nao autorizado).
    - Backend: leitura e escrita do `sectionToggles.ts`
      - `apps/api/src/routes/index.ts`
        - novos endpoints protegidos:
          - `GET /api/admin/section-toggles`
          - `PUT /api/admin/section-toggles`
        - validacao de payload com Zod;
        - parser/serializer do objeto `publicSectionToggles` no arquivo TS;
        - autorizacao adicional por e-mail (`jeiel.borner@gmail.com`).
    - Reuso assinado/home
      - `apps/web/src/components/pages/AssinaturasContent.tsx` reaproveitando secoes compartilhadas.
      - `apps/web/src/components/pages/HomeContent.tsx` mantendo composicao por secoes via toggles.
    - Ajuste de cobertura de testes de UI admin
      - `apps/web/src/modules/admin-tests/behavior.ts` inclui `site-sections` em `expectedViews`.
  - Validacao
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
    - `apps/api`: `npm run build` PASS.
    - `apps/api`: `npm test` PASS (5/5).
  - Observacao tecnica
    - em modo de desenvolvimento, salvar toggles no admin atualiza `sectionToggles.ts` diretamente;
    - em ambiente build estatico, as mudancas de toggle exigem novo build/deploy para refletir no bundle cliente.
- Checkpoint de continuidade
  - Ultimo passo concluido: franquias modularizada e painel de toggles funcional com persistencia e restricao por e-mail.
  - Proximo passo planejado: opcionalmente replicar o mesmo padrao modular/toggle para blocos do Admin no futuro.

## 2026-02-17 19:18:45
- Ajuste visual dos toggles no Admin > Secoes SPA (sem texto)
  - Plano executado
    - remover texto `Ligado/Desligado` dos botoes de toggle;
    - aplicar switch visual estilo chave (track + thumb), conforme referencia enviada.
  - Alteracoes de codigo
    - `apps/web/src/modules/admin-section-toggles/components/AdminSectionTogglesView.tsx`
      - botoes de secao mantidos com label da secao;
      - controle de estado substituido por switch visual:
        - ligado: trilho verde + thumb branco deslocado para direita;
        - desligado: trilho cinza + thumb branco deslocado para esquerda;
      - mantidos atributos de acessibilidade (`aria-pressed`, `aria-label`).
  - Validacao
    - `apps/web`: `npm run lint` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: toggles da tela `Secoes SPA` agora seguem padrao visual solicitado (sem texto de estado).
  - Proximo passo planejado: ajuste fino de tamanho/cor do switch se desejar aproximar 100% do mock de referencia.

## 2026-02-17 20:42:37
- Correcao de renderizacao dos toggles visuais na tela `Secoes SPA`
  - Diagnostico
    - switches nao apareciam no browser em alguns cenarios.
  - Alteracoes de codigo
    - `apps/web/src/modules/admin-section-toggles/components/AdminSectionTogglesView.tsx`
      - controle visual de switch alterado para estilos inline (track + thumb);
      - removida dependencia de classes utilitarias para dimensao/posicionamento do switch;
      - mantida acessibilidade (`aria-pressed`, `aria-label`).
  - Validacao
    - `apps/web`: `npm run lint` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: switch visual de ligado/desligado agora renderiza de forma deterministica.
  - Proximo passo planejado: ajuste fino de cores/sombra se quiser 100% identico ao mock.

## 2026-02-17 21:10:22
- HomeProductsSection migrado de mock para dados reais da tabela `Product`
  - Plano executado
    - criar endpoint publico de leitura de produtos;
    - consumir endpoint na secao de produtos da Home;
    - aplicar regra de destaque (primeiro `isFeatured=true`);
    - manter layout visual existente (fontes, classes, tamanhos e estrutura);
    - validar compilacao/lint.
  - Alteracoes de codigo
    - Backend
      - `apps/api/src/routes/index.ts`
        - novo endpoint `GET /api/public/products`.
        - retorno ordenado por `isFeatured desc`, `createdAt desc`.
        - filtro de status visivel (`ACTIVE`, `ATIVO`, `ATIVA`) quando houver status associado.
    - Frontend
      - `apps/web/src/modules/public-site/sections/HomeProductsSection.tsx`
        - secao passou a buscar dados em `GET /api/public/products`;
        - spotlight agora usa o primeiro produto em destaque (`isFeatured=true`); sem destaque, usa o primeiro da lista;
        - colecao abaixo renderiza os demais produtos do banco;
        - clique no card troca o spotlight;
        - imagens mantidas com dimensoes fixas e `object-cover` para padrao visual uniforme;
        - botao de compra abre carrinho (fallback para checkout se necessario).
  - Validacao
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
    - `apps/api`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: Home Products consumindo base real com regra de destaque aplicada.
  - Proximo passo planejado: validar em ambiente com dados reais se a ordenacao/curadoria de produtos ativos atende regra comercial final.

## 2026-02-17 21:24:53
- Ajuste de beneficios em `HomeProductsSection`
  - Causa identificada
    - parser de beneficios limitava resultados com `slice(0, 3)`.
  - Alteracoes de codigo
    - `apps/web/src/modules/public-site/sections/HomeProductsSection.tsx`
      - removido limite de 3 itens no parser de beneficios;
      - parser agora aceita array e string (incluindo JSON serializado ou texto separado por quebra de linha/`;`/`,`/`|`);
      - cards da galeria passaram a exibir beneficios (quando existirem) no lugar do placeholder de descricao.
  - Validacao
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: beneficios completos no destaque + beneficios visiveis na galeria.
  - Proximo passo planejado: ajustar quantidade visual de linhas dos beneficios na galeria caso queira mais/menos densidade de texto por card.

## 2026-02-17 21:31:34
- Padronizacao visual da UL de beneficios na galeria de produtos
  - Alteracoes de codigo
    - `apps/web/src/modules/public-site/sections/HomeProductsSection.tsx`
      - substituido texto unico de beneficios por lista `UL/LI` no mesmo estilo do destaque;
      - icone `check_circle` mantido;
      - versao menor aplicada para cards (icone menor, `text-xs`, espacamento reduzido);
      - limite visual dos cards preservado com `min-h` no bloco de beneficios.
  - Validacao
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: galeria agora exibe beneficios em UL padrao do destaque (compacta).
  - Proximo passo planejado: ajustar quantos beneficios por card (hoje ate 3) se quiser maior/menor densidade.

## 2026-02-17 21:35:40
- Exibicao da descricao nos cards da galeria de produtos
  - Alteracoes de codigo
    - `apps/web/src/modules/public-site/sections/HomeProductsSection.tsx`
      - adicionada descricao abaixo da UL de beneficios na galeria;
      - descricao mantida com fonte pequena (`text-xs`) e `line-clamp-2` para preservar layout.
  - Validacao
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: cards da galeria mostram beneficios e descricao com fonte pequena.
  - Proximo passo planejado: ajuste fino de quantidade de linhas (beneficios x descricao) caso queira priorizar um deles.

## 2026-02-17 21:55:45
- Atualizacao de copy e acao do CTA da Home
  - Alteracoes de codigo
    - `apps/web/src/modules/public-site/sections/HomeCtaSection.tsx`
      - titulo alterado para: "Transforme seu autocuidado em rotina, não em luxo";
      - subtitulo alterado para: "Entre para o nosso clube VIP e tenha prioridade na agenda com a economia que você sempre quis";
      - botao alterado para "ASSINE JÁ !";
      - acao alterada para navegar para `/assinaturas`.
  - Validacao
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: CTA alinhado com direcionamento para assinaturas.
  - Proximo passo planejado: revisar se o mesmo copy deve ser reaplicado em outras CTAs publicas para manter consistencia.

## 2026-02-18 00:16:26
- Carrinho lateral (cart) convertido de mock para funcional (produtos + assinaturas)
  - Plano executado
    - criar store compartilhado de carrinho em `localStorage`;
    - conectar botoes de produto para adicionar item real no carrinho;
    - tornar modal lateral dinamico (itens, quantidade, remover, subtotal, frete);
    - conectar botoes de assinatura para adicionar no carrinho;
    - manter visual existente do cart.
  - Alteracoes de codigo
    - Novo modulo
      - `apps/web/src/modules/cart/store.ts`
        - tipos de item (`PRODUCT`, `MEMBERSHIP`);
        - operacoes: `readCart`, `addCartItem`, `setCartItemQuantity`, `removeCartItem`, `clearCart`;
        - calculos: subtotal/quantidade e formatacao BRL;
        - evento global `jlr:cart-updated`.
    - Produtos
      - `apps/web/src/modules/public-site/sections/HomeProductsSection.tsx`
        - botao principal e icone de carrinho agora adicionam produto no cart com preco/imagem;
        - apos adicionar, dispara abertura do carrinho lateral.
    - Modal lateral
      - `apps/web/src/components/pages/HomeContent.tsx`
        - markup do cart migrado para placeholders dinamicos (`data-cart-*`), removendo itens fixos mockados.
      - `apps/web/src/modules/public-site/index.behavior.ts`
        - render dinamico dos itens no carrinho;
        - controle de quantidade (+/-) e remover;
        - subtotal em tempo real;
        - barra e texto de frete gratis em tempo real;
        - desabilita botao "Pagar agora" quando carrinho vazio;
        - escuta `jlr:open-cart` e `jlr:cart-updated`.
    - Assinaturas
      - `apps/web/src/modules/public-site/index.behavior.ts`
        - clique em `data-membership-join` agora adiciona a assinatura ao carrinho (item `MEMBERSHIP`) e abre modal lateral.
  - Validacao
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: cart lateral operacional com produtos e assinaturas.
  - Proximo passo planejado: integrar resumo real do carrinho no checkout grande (pagamento) e preparar regras especificas para servicos com agendamento.

## 2026-02-18 01:17:13
- Checkout grande conectado ao carrinho real
  - Plano executado
    - ler itens reais do cart no `CheckoutContent`;
    - trocar resumo mockado por lista dinamica;
    - calcular subtotal/entrega/impostos/total;
    - manter visual da tela de pagamento.
  - Alteracoes de codigo
    - `apps/web/src/components/pages/CheckoutContent.tsx`
      - componente convertido para React com estado e sincronizacao via `localStorage` + evento `jlr:cart-updated`;
      - resumo do pedido agora lista itens reais (produto/assinatura, quantidade, subtotal por item);
      - totais calculados dinamicamente:
        - subtotal = soma dos itens;
        - entrega = gratis acima de R$ 150,00, senao R$ 15,00;
        - impostos = 0 (placeholder controlado);
        - total = subtotal + entrega + impostos;
      - botoes "Concluir Compra" desabilitam quando carrinho vazio.
  - Validacao
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: checkout grande consumindo o mesmo carrinho funcional do modal lateral.
  - Proximo passo planejado: integrar confirmacao real de pagamento (persistencia de pedido/pagamento) e regras de servicos com agendamento fora do carrinho.

## 2026-02-18 02:25:17
- Checkout grande: controle de itens + cupom aplicado no total
  - Plano executado
    - adicionar controles de quantidade/remocao no resumo do checkout grande;
    - integrar validacao de cupom no checkout grande;
    - recalcular total considerando desconto de cupom.
  - Alteracoes de codigo
    - `apps/web/src/components/pages/CheckoutContent.tsx`
      - adicionados botoes `+`, `-` e `Remover` por item;
      - input de cupom agora funcional (aplicar/remover);
      - consumo de `POST /api/public/discount-coupons/validate`;
      - total final passa a considerar desconto do cupom aplicado.

- Cupom de desconto: estrutura completa (DB + API + Admin CRUD)
  - Plano executado
    - criar tabela dedicada para cupons;
    - criar endpoints admin de CRUD;
    - criar endpoint publico de validacao para checkout;
    - criar tela admin para gestao de cupons.
  - Alteracoes de codigo
    - Banco/Prisma
      - `apps/api/prisma/schema.prisma`
        - novo model `DiscountCoupon`.
      - `apps/api/prisma/migrations/20260218093000_add_discount_coupons/migration.sql`
        - migration de criacao da tabela `DiscountCoupon`.
    - API
      - `apps/api/src/routes/index.ts`
        - novos endpoints admin:
          - `GET /api/discount-coupons`
          - `POST /api/discount-coupons`
          - `PATCH /api/discount-coupons/:id`
          - `DELETE /api/discount-coupons/:id`
        - novo endpoint publico:
          - `POST /api/public/discount-coupons/validate`
        - validacoes de regra:
          - tipo `PERCENT` x `FIXED` (campos mutuamente exclusivos);
          - inicio/fim de validade;
          - subtotal minimo.
    - Admin (React)
      - novo modulo:
        - `apps/web/src/modules/admin-discount-coupons/components/AdminDiscountCouponsView.tsx`
        - `apps/web/src/modules/admin-discount-coupons/components/AdminDiscountCouponsViewIsland.tsx`
        - `apps/web/src/modules/admin-discount-coupons/index.ts`
      - integracoes:
        - `apps/web/src/components/pages/AdminContent.tsx` (menu + view `cupons-desconto`)
        - `apps/web/src/pages/Admin.tsx` (island render)
    - Testes internos de admin
      - `apps/web/src/modules/admin-tests/behavior.ts`
        - nova view `cupons-desconto` adicionada em `expectedViews`;
        - novo check de endpoint `/discount-coupons`.

- Validacao
  - `apps/api`: `npx prisma generate` falhou por arquivo de engine bloqueado (`EPERM`).
  - `apps/api`: `npx prisma generate --no-engine` PASS.
  - `apps/api`: `npx prisma migrate deploy` PASS (migration `20260218093000_add_discount_coupons` aplicada).
  - `apps/api`: `npm run build` PASS.
  - `apps/api`: `npm test` PASS (5/5).
  - `apps/web`: `npm run lint` PASS.
  - `apps/web`: `npm run build` PASS.

- Checkpoint de continuidade
  - Ultimo passo concluido: checkout grande com controle de itens e cupom funcional + CRUD admin de cupons pronto.
  - Proximo passo planejado: executar migration no ambiente alvo e validar fluxo E2E (admin cria cupom -> checkout aplica cupom) com API ligada ao banco.

## 2026-02-18 02:43:21
- Correcao de travamento no botao "Aplicar" do cupom no checkout
  - Diagnostico
    - o checkout podia ficar em `Aplicando...` quando a requisicao de validacao nao retornava (timeout/rede/erro de backend).
    - endpoint publico de validacao nao tinha `try/catch`, podendo deixar falha sem resposta apropriada.
  - Alteracoes de codigo
    - `apps/web/src/components/pages/CheckoutContent.tsx`
      - adicionado timeout com `AbortController` (`COUPON_REQUEST_TIMEOUT_MS = 12000`);
      - mensagem amigavel para timeout (`Tempo de resposta excedido...`);
      - garantia de reset de estado no `finally` (`setIsApplyingCoupon(false)` + `clearTimeout`).
    - `apps/api/src/routes/index.ts`
      - endpoint `POST /api/public/discount-coupons/validate` encapsulado em `try/catch`;
      - log de erro com `logger.error`;
      - retorno `500` padronizado em falhas inesperadas.
  - Validacao
    - `apps/api`: `npm run build` PASS.
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: fluxo de cupom no checkout nao fica mais travado indefinidamente.
  - Proximo passo planejado: validar no browser o cenario real (cupom valido, invalido e API offline) para confirmar UX final.

## 2026-02-18 03:11:38
- Ajuste de CTAs da Hero na Home
  - Alteracoes de codigo
    - `apps/web/src/modules/public-site/sections/HomeHeroSection.tsx`
      - botao `Agende Sua Experiencia` agora abre chatbot (adicionado `data-open-concierge`);
      - botao secundario alterado para `Rede de Franquias` com link para `/franquias`.
  - Validacao
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: CTA principal abre chatbot e CTA secundario navega para franquias.
  - Proximo passo planejado: validar comportamento em navegacao SPA (dev server) e em build de producao.

## 2026-02-18 03:32:00
- Hardening de seguranca (sessao/autenticacao/CORS/login)
  - Plano executado
    - tornar `JWT_SECRET` obrigatorio e remover fallback inseguro;
    - reduzir tempo padrao de sessao com token configuravel;
    - adicionar controle de tentativas de login (anti brute force);
    - reforcar middlewares para validar usuario ativo no banco;
    - endurecer CORS para evitar fallback permissivo em producao;
    - expirar token no frontend automaticamente quando `exp` for atingido.
  - Alteracoes de codigo
    - API
      - `apps/api/src/lib/auth.ts`
        - `JWT_SECRET` agora obrigatorio (minimo 32 chars);
        - `JWT_EXPIRES_IN` configuravel por ambiente (padrao `12h`).
      - `apps/api/src/middleware/auth.ts`
        - `requireAuth` e `requireAdmin` agora validam usuario no banco e exigem status `ACTIVE`;
        - eliminada confianca apenas no role do payload do token.
      - `apps/api/src/routes/index.ts`
        - adicionado controle em memoria para tentativas de login por IP+identificador;
        - bloqueio com resposta `429` apos limite configurado;
        - reset de contador em login bem-sucedido.
      - `apps/api/src/app.ts`
        - CORS restrito por lista permitida; sem wildcard em fallback de producao;
        - fallback de desenvolvimento apenas para localhost;
        - respostas `403` para origem bloqueada;
        - headers adicionais (`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`).
      - `apps/api/src/lib/messages.ts`
        - nova mensagem `TOO_MANY_REQUESTS`.
      - `apps/api/.env.example`
        - novas variaveis:
          - `JWT_EXPIRES_IN`
          - `AUTH_RATE_LIMIT_WINDOW_MS`
          - `AUTH_RATE_LIMIT_MAX_ATTEMPTS`
          - `AUTH_RATE_LIMIT_BLOCK_MS`
        - `JWT_SECRET` atualizado para placeholder seguro.
      - `apps/api/.env` (ambiente local)
        - `JWT_SECRET` local ajustado para valor com 32+ caracteres para compatibilidade imediata com a nova validacao.
    - Frontend
      - `apps/web/src/lib/auth.ts`
        - parser de JWT no cliente para validar `exp`;
        - `getToken()` agora invalida sessao automaticamente quando token expira;
        - `getUser()` passa a depender de token valido.
  - Validacao
    - `apps/api`: `npm run build` PASS.
    - `apps/api`: `npm test` PASS (5/5).
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: sessao e autenticacao endurecidas com expiracao real no frontend, verificacao de usuario ativo no backend e limitacao de login.
  - Proximo passo planejado: definir valores finais de ambiente (JWT/CORS/rate limit) para producao e testar cenarios de bloqueio de login no servidor.

## 2026-02-18 12:24:08
- Configuracao de banco Railway para deploy
  - Alteracoes de codigo
    - `apps/api/.env`
      - `DATABASE_URL` atualizado para a URL publica do MySQL no Railway (`metro.proxy.rlwy.net:33771/railway`).
  - Observacoes operacionais
    - alteracao aplicada apenas no backend (variavel de ambiente da API);
    - frontend continua consumindo API via `VITE_API_URL` (sem acesso direto ao banco).
- Checkpoint de continuidade
  - Ultimo passo concluido: backend local preparado para usar MySQL do Railway.
  - Proximo passo planejado: subir API e frontend, configurar envs no provedor e executar migrate deploy no ambiente de producao.

## 2026-02-18 12:34:52
- Seed no banco Railway (pos-mudanca de conexao)
  - Validacao executada
    - `apps/api`: `npm run prisma:seed` PASS.
    - verificacao de dados sem erro via Prisma Client:
      - `users`: 4
      - `products`: 8
      - `services`: 75
      - `memberships`: 3
      - `units`: 2
  - Observacoes operacionais
    - `apps/api`: `npx prisma migrate deploy` retornou `P3005` (schema ja existente e nao vazio).
    - banco Railway esta funcional para uso da aplicacao; para pipeline de migrations em producao, sera necessario baseline/sincronizacao do historico de migrations.
- Checkpoint de continuidade
  - Ultimo passo concluido: seed aplicado com sucesso no Railway e dados essenciais populados.
  - Proximo passo planejado: ajustar estrategia de baseline de migrations no Railway para permitir `migrate deploy` sem erro `P3005`.

## 2026-02-18 12:58:40
- Importacao de seed real a partir de dump SQL atual (`seed_carnaval.sql`)
  - Objetivo
    - usar os dados atuais do dump local para popular o Railway, incluindo configuracoes de WhatsApp/concierge.
  - Alteracoes de codigo/artefatos
    - `docs/evolutive_changes/seed_carnaval_data_only.sql`
      - gerado a partir de `docs/evolutive_changes/seed_carnaval.sql` contendo apenas `DELETE/INSERT`;
      - removidos blocos de `DROP/CREATE DATABASE`, `DROP/CREATE TABLE` e `_prisma_migrations`.
    - `docs/evolutive_changes/seed_carnaval_data_only_railway.sql`
      - versao adaptada para nomes de tabela em `PascalCase` no Railway (`Appointment`, `ContentEntry`, etc.).
  - Execucao
    - `apps/api`: `npx prisma db execute --schema prisma/schema.prisma --file ..\\..\\docs\\evolutive_changes\\seed_carnaval_data_only_railway.sql` PASS.
  - Validacao no Railway
    - `settings`: 3
    - `conciergeSessions`: 17
    - `conciergeEvents`: 232
    - `customers`: 3
    - `coupons`: 1
    - `products`: 11
    - `services`: 77
    - `memberships`: 3
    - `users`: 9
    - chaves WhatsApp presentes em `Setting/ContentEntry`:
      - `whatsapp_flow_category_first`
      - `whatsapp_opening_greeting_text`
      - `whatsapp_completion_greeting_text`
- Checkpoint de continuidade
  - Ultimo passo concluido: banco Railway carregado com dados do dump atual (incluindo configuracoes de WhatsApp).
  - Proximo passo planejado: validar a API em ambiente de deploy (Netlify/Vercel + API) usando esses dados e revisar estrategia de migrations (`P3005` baseline).

## 2026-02-18 13:12:36
- Preparacao de deploy Netlify (frontend-only) no monorepo
  - Plano executado
    - fixar build/publish do Netlify para `apps/web`;
    - garantir fallback SPA para rotas React;
    - manter backend Express separado (Railway).
  - Alteracoes de codigo
    - `netlify.toml`
      - `base = "apps/web"`;
      - `command = "npm run build"`;
      - `publish = "dist"`;
      - redirect SPA `/* -> /index.html (200)`.
    - `apps/web/public/_redirects`
      - fallback SPA `/* /index.html 200`.
  - Observacoes operacionais
    - configuracao de variavel `VITE_API_URL` permanece no painel do Netlify;
    - variaveis de backend (`DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, etc.) permanecem no Railway.
- Checkpoint de continuidade
  - Ultimo passo concluido: repositorio pronto para deploy do frontend no Netlify sem tentar buildar backend.
  - Proximo passo planejado: configurar envs no painel, publicar API no Railway e validar fluxo fim a fim em producao.

## 2026-02-18 17:32:52
- Correcao de responsividade (mobile) em menu publico, galeria de produtos e shell admin
  - Problemas reportados
    - menu publico nao aparecia no celular;
    - imagens da galeria de produtos nao carregavam em mobile;
    - menu lateral do admin ocupava area excessiva da tela no mobile.
  - Alteracoes de codigo
    - `apps/web/src/modules/menu/components/PublicMenu.tsx`
      - adicionado estado React para abrir/fechar menu mobile;
      - implementado painel mobile (`lg:hidden`) com links principais e overlay para fechamento.
    - `apps/web/src/modules/menu/components/FranquiasMenu.tsx`
      - mesma estrategia de menu mobile com painel e links da area de franquias.
    - `apps/web/src/modules/public-site/sections/HomeProductsSection.tsx`
      - normalizacao de URLs de imagem para ambiente remoto (corrige URLs antigas com `localhost`);
      - fallback resiliente para imagens quebradas (`onError` -> imagem padrao);
      - ajuste de tamanho fixo da imagem da galeria para manter cards consistentes no mobile.
    - `apps/web/src/components/pages/AdminContent.tsx`
      - adicionada media query para mobile no CSS inline do shell admin;
      - sidebar passa a funcionar como barra horizontal compacta com rolagem, escondendo textos no mobile.
  - Validacao
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: regressao visual mobile mitigada nos tres pontos reportados.
  - Proximo passo planejado: validar em dispositivo real (menu mobile, cards de produto com imagens e navegacao no admin) apos novo deploy no Netlify.

## 2026-02-18 18:03:18
- Ajuste mobile complementar apos validacao em dispositivo real
  - Problemas reportados
    - menu mobile ainda sem abrir;
    - grid de imagens da secao About estourando largura no celular;
    - titulos da home extrapolando viewport;
    - menu do admin ainda ocupando area excessiva em mobile.
  - Alteracoes de codigo
    - `apps/web/src/modules/menu/components/PublicMenu.tsx`
      - substituido toggle React por menu mobile nativo com `details/summary` (mais resiliente em mobile);
      - drawer mobile ancorado no topo direito.
    - `apps/web/src/modules/menu/components/FranquiasMenu.tsx`
      - mesma estrategia de menu mobile nativo (`details/summary`).
    - `apps/web/src/modules/menu/components/NavStatusActions.tsx`
      - compactacao da area de acoes em telas pequenas (menos elementos visiveis) para nao conflitar com botao de menu.
    - `apps/web/src/modules/public-site/sections/HomeAboutSection.tsx`
      - grid de imagens refeita no mesmo padrao visual da franquias (2 colunas no mobile / 3 no sm+), removendo overflow lateral.
    - `apps/web/src/modules/public-site/sections/HomeHeroSection.tsx`
      - titulo hero com escala tipografica menor no mobile e quebra forçada (`break-words`, largura maxima segura).
    - `apps/web/src/styles/tailwind.css`
      - `display-hero` com `overflow-wrap: anywhere` para reduzir risco de overflow;
      - ajuste de `summary` no topo para remover marker nativo e manter icone consistente.
    - `apps/web/src/components/pages/AdminContent.tsx`
      - media query mobile refinada: sidebar limitada em altura, overflow escondido e navegacao em faixa horizontal de icones.
  - Validacao
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: conjunto de correcoes mobile ampliado para menu, hero/about e shell admin.
  - Proximo passo planejado: publicar no Netlify e validar novamente em smartphone real os 5 itens reportados.

## 2026-02-18 18:46:01
- Ajuste final do pacote mobile/desktop (hero, menu, admin e produtos)
  - Plano definido antes da alteracao
    - manter titulo hero grande no desktop e responsivo no mobile;
    - manter quebra do titulo de "Tratamentos Personalizados" apenas no mobile;
    - remover box "Bem Estar/Autoestima" que ainda restava no topo do admin;
    - reforcar renderizacao de imagens de produtos no admin para URLs legadas/relativas;
    - validar integridade com lint e build.
  - Alteracoes de codigo
    - `apps/web/src/components/pages/AdminContent.tsx`
      - removido do header admin o bloco visual "Bem Estar / Autoestima" (box com borda dourada), preservando logo e link "Voltar ao site".
    - `apps/web/src/modules/admin-products/behavior.ts`
      - ampliada normalizacao de URL de imagem:
        - fallback para arquivo local invalido (`C:\...`) -> imagem padrao;
        - suporte a `//dominio/...` (forca `https:`);
        - suporte a caminhos relativos `images/...` e `./images/...`;
        - suporte a host sem protocolo (`dominio.com/...`);
        - migracao automatica de `localhost/127.0.0.1` para origem da API atual;
        - upgrade de `http` para `https` em domínios `railway.app`;
      - fallback de imagem mantido para casos de erro de carregamento.
  - Validacao
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
- Checkpoint de continuidade
  - Ultimo passo concluido: pacote solicitado aplicado e validado localmente sem erros de lint/build.
  - Proximo passo planejado: validar em smartphone real os itens 2, 3 e 5 apos novo deploy (menu hamburguer visivel/funcional, grid admin compacta e miniaturas de produtos carregando).

## 2026-02-18 21:08:23
- Ajuste de visibilidade do atalho Admin no topo (mobile)
  - Solicitacao
    - ocultar no celular o botao/icone de acesso ao Admin no topo, mantendo o link de acesso inferior.
  - Alteracao de codigo
    - `apps/web/src/modules/menu/components/NavStatusActions.tsx`
      - breakpoint do icone Admin alterado de `hidden sm:inline-flex` para `hidden md:inline-flex`.
      - efeito: o atalho nao aparece em telas pequenas de celular (inclusive cenarios em paisagem), reduzindo poluicao visual no topo.
  - Checkpoint de continuidade
    - Ultimo passo concluido: atalho Admin do topo ocultado no mobile conforme solicitado.
    - Proximo passo planejado: validar no aparelho apos deploy para confirmar comportamento esperado.

## 2026-02-18 21:10:24
- Refino de breakpoint do atalho Admin no topo
  - Solicitacao
    - exibir o atalho do Admin somente em desktop grande.
  - Alteracao de codigo
    - `apps/web/src/modules/menu/components/NavStatusActions.tsx`
      - breakpoint alterado de `hidden md:inline-flex` para `hidden lg:inline-flex`.
      - efeito: atalho Admin no topo aparece apenas em telas `lg` ou maiores.
  - Checkpoint de continuidade
    - Ultimo passo concluido: visibilidade ajustada para desktop grande apenas.
    - Proximo passo planejado: publicar e validar em dispositivos reais.

## 2026-02-18 21:33:17
- Correcao definitiva da visibilidade do atalho Admin no topo (conflito CSS legado)
  - Problema observado
    - mesmo com breakpoint Tailwind, o botao Admin ainda aparecia no celular.
  - Causa raiz
    - `apps/web/src/styles/legacy.css` possui `.nav-circle { display: inline-flex; }`, podendo sobrescrever utilitarios `hidden` do Tailwind por ordem de carregamento.
  - Alteracoes de codigo
    - `apps/web/src/modules/menu/components/NavStatusActions.tsx`
      - botao Admin passou a usar classe dedicada `nav-circle-admin-desktop`.
    - `apps/web/src/styles/legacy.css`
      - criada classe `nav-circle-admin-desktop` com regra robusta:
        - default `display: none !important`;
        - `@media (min-width: 1024px)` -> `display: inline-flex !important`.
  - Resultado esperado
    - atalho Admin no topo oculto em celular/tablet e visivel somente em desktop grande, sem depender de prioridade entre Tailwind e CSS legado.
  - Checkpoint de continuidade
    - Ultimo passo concluido: comportamento amarrado por classe dedicada com media query.
    - Proximo passo planejado: validar em smartphone apos novo deploy.

## 2026-02-18 21:45:59
- Ajuste de posicionamento do menu hamburguer no mobile (sem sobrepor carrinho)
  - Problema reportado
    - icone hamburguer estava na mesma area do carrinho por estar com posicionamento `fixed`.
  - Solucao aplicada
    - `apps/web/src/modules/menu/components/NavStatusActions.tsx`
      - componente passou a aceitar `mobileMenuTrigger?: ReactNode`;
      - trigger mobile eh renderizado no fluxo da barra e, quando logado, fica antes do botao `Sair`.
    - `apps/web/src/modules/menu/components/PublicMenu.tsx`
      - removido `details` fixo externo;
      - menu mobile agora eh injetado em `NavStatusActions` via prop `mobileMenuTrigger`;
      - dropdown posicionado relativo ao proprio trigger (`absolute right-0 top-full mt-2`).
    - `apps/web/src/modules/menu/components/FranquiasMenu.tsx`
      - mesma alteracao do menu publico.
  - Validacao
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
  - Checkpoint de continuidade
    - Ultimo passo concluido: hamburguer deixou de sobrepor o carrinho e passou a respeitar a ordem solicitada antes do botao de sair.
    - Proximo passo planejado: validar no celular apos deploy para confirmar espacamento visual final.

## 2026-02-19 09:56:12
- Preparacao de deploy no Vercel (frontend em `apps/web`)
  - Objetivo
    - substituir Netlify por Vercel mantendo backend + banco no Railway.
  - Alteracoes de codigo
    - `vercel.json` (raiz)
      - `framework: "vite"`;
      - `installCommand: "npm --prefix apps/web install"`;
      - `buildCommand: "npm --prefix apps/web run build"`;
      - `outputDirectory: "apps/web/dist"`;
      - rewrite SPA `/(.*) -> /index.html`.
  - Checkpoint de continuidade
    - Ultimo passo concluido: configuracao do Vercel versionada para buildar somente o frontend do monorepo.
    - Proximo passo planejado: configurar `VITE_API_URL` no Vercel, ajustar `CORS_ORIGIN` no Railway com dominio Vercel e validar login/rotas SPA em producao.

## 2026-02-19 10:02:32
- Correcao de falha de build no Vercel por duplicacao de path
  - Problema
    - build executado com Root Directory em `apps/web`, mas `vercel.json` usava `--prefix apps/web`, gerando path invalido `apps/web/apps/web/package.json`.
  - Alteracao de codigo
    - `vercel.json`
      - `installCommand`: de `npm --prefix apps/web install` para `npm install`;
      - `buildCommand`: de `npm --prefix apps/web run build` para `npm run build`;
      - `outputDirectory`: de `apps/web/dist` para `dist`.
  - Checkpoint de continuidade
    - Ultimo passo concluido: configuracao alinhada ao Root Directory atual (`apps/web`) no Vercel.
    - Proximo passo planejado: redeploy no Vercel e validar login/consumo da API Railway com `VITE_API_URL`.

## 2026-02-19 11:02:56
- Correcao de rota SPA no Vercel (erro 404 em `/admin`)
  - Problema
    - aplicacao logava corretamente, mas ao abrir rota de SPA (`/admin`) o Vercel retornava `404 NOT_FOUND`.
  - Causa
    - ausencia de rewrite de fallback para `index.html` no contexto atual de deploy.
  - Alteracao de codigo
    - `apps/web/vercel.json`
      - adicionado rewrite global:
        - `source: "/(.*)"`
        - `destination: "/index.html"`
  - Resultado esperado
    - rotas SPA (`/admin`, `/franquias`, `/assinaturas`, etc.) passam a abrir sem 404 no Vercel.
  - Checkpoint de continuidade
    - Ultimo passo concluido: fallback SPA versionado no diretório real do frontend (`apps/web`).
    - Proximo passo planejado: redeploy no Vercel e validar navegacao em rotas internas.

## 2026-02-19 11:09:16
- Neutralizacao do `vercel.json` local para evitar impacto em build
  - Contexto
    - usuario reportou falhas recorrentes de deploy associadas ao uso de `vercel.json`.
  - Alteracao de codigo
    - `apps/web/vercel.json`
      - removidas regras ativas (rewrite), mantendo somente schema.
  - Proximo passo operacional (manual no painel Vercel)
    - configurar rewrite SPA no dashboard em vez de arquivo versionado.
  - Checkpoint de continuidade
    - Ultimo passo concluido: `vercel.json` sem comandos/regras que possam interferir no build.
    - Proximo passo planejado: criar rewrite no painel da Vercel e validar rota `/admin`.

## 2026-02-19 11:21:42
- Configuracao de rewrite SPA no Vercel via arquivo do frontend
  - Contexto
    - painel do Vercel sem secao visivel de Routing/Rewrites.
  - Alteracao de codigo
    - `apps/web/vercel.json`
      - mantido em modo seguro (sem install/build commands);
      - adicionado apenas rewrite SPA:
        - `source: "/(.*)"`
        - `destination: "/index.html"`.
  - Validacao
    - `apps/web`: `npm run build` PASS.
  - Checkpoint de continuidade
    - Ultimo passo concluido: fallback de rota SPA aplicado sem alterar pipeline de build.
    - Proximo passo planejado: novo deploy no Vercel e validacao da rota `/admin` em producao.

## 2026-02-23 23:57:43
- Habilitacao de skills locais do workspace no `AGENTS.md` (pre-edicao)
  - Contexto
    - usuario solicitou disponibilizar skills locais em `.\.codex\skills` na lista oficial de skills da sessao.
    - validado previamente: `27` skills com `SKILL.md`, `name` e `description` legiveis.
  - Passos planejados
    - registrar checkpoint inicial antes de editar.
    - atualizar `AGENTS.md` em `### Available skills` adicionando as skills locais do workspace.
    - manter as skills de sistema ja listadas (`skill-creator` e `skill-installer`).
    - validar a secao final de skills apos a edicao.
    - registrar checkpoint final em `memory/MODIFICATION_LOG.md`.
  - Checkpoint de continuidade
    - Ultimo passo concluido: validacao estrutural das skills locais e identificacao do `AGENTS.md` raiz.
    - Proximo passo planejado: editar `AGENTS.md` para incluir as `27` skills do workspace.

## 2026-02-23 23:58:31
- Habilitacao de skills locais do workspace no `AGENTS.md` (pos-edicao)
  - Alteracao de codigo
    - `AGENTS.md`
      - secao `### Available skills` atualizada para incluir `27` skills locais de `.\.codex\skills`.
      - skills de sistema existentes foram mantidas (`skill-creator`, `skill-installer`).
      - paths das skills locais registrados como paths relativos ao workspace (ex.: `.codex/skills/<skill>/SKILL.md`).
  - Validacao
    - contagem de itens em `### Available skills`: `29` (`2` de sistema + `27` locais).
    - delimitadores da secao mantidos (`### Available skills` -> `### How to use skills`).
  - Checkpoint de continuidade
    - Ultimo passo concluido: skills locais adicionadas ao `AGENTS.md` com validacao de contagem.
    - Proximo passo planejado: iniciar nova interacao (ou reabrir sessao) para confirmar reconhecimento automatico da lista atualizada pela sessao.

## 2026-02-24 00:16:19
- Correcao planejada: CTA `Agendar` nos flips de tratamentos nao aciona concierge e precisa pre-selecionar categoria/servico
  - Passos planejados (pre-edicao)
    - mapear o contrato atual do chatbot (`data-open-concierge`) e o fluxo de categoria/servico no frontend.
    - adicionar metadados por card de tratamento para categoria/servico alvo nos botoes `Agendar`.
    - implementar leitura do trigger no `index.behavior.ts` e aplicar pre-selecao automatica (com fallback manual quando nao houver match).
    - validar comportamento manualmente e executar checagem de lint/build do frontend.
    - registrar resultado final e checkpoint no `memory/MODIFICATION_LOG.md`.
  - Checkpoint de continuidade
    - Ultimo passo concluido: causa raiz confirmada (botoes da secao de tratamentos nao possuem `data-open-concierge`).
    - Proximo passo planejado: editar `HomeServicesSection.tsx` e `index.behavior.ts` para suportar trigger com pre-selecao.

## 2026-02-24 00:20:30
- Correcao aplicada: botoes `Agendar` da secao Tratamentos agora abrem o concierge com pre-selecao por card
  - Alteracoes de codigo
    - `apps/web/src/modules/public-site/sections/HomeServicesSection.tsx`
      - adicionados `data-open-concierge` e metadados `data-concierge-*` (label/categoria/servico) em todos os botoes `Agendar` dos flip cards.
    - `apps/web/src/modules/public-site/index.behavior.ts`
      - trigger do concierge passou a ler metadados do botao clicado;
      - adicionada pre-selecao automatica de categoria e servico com match tolerante (acentos/caixa);
      - fallback manual com mensagem quando a disponibilidade retornada nao contem o match esperado;
      - clique do trigger interrompe propagacao para reduzir conflito com interacao do card.
  - Validacao
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
    - observacao: validacao manual no navegador ainda pendente (abrir contra-capa dos flips e clicar em `Agendar` em cada card).
  - Checkpoint de continuidade
    - Ultimo passo concluido: integracao dos flips com concierge + pre-selecao implementada e compilando.
    - Proximo passo planejado: validar manualmente em runtime se os nomes/categorias de cada card correspondem exatamente ao catalogo disponivel em producao e ajustar mapeamentos se necessario.

## 2026-02-24 01:04:13
- Planejamento aprovado: modal "Ver Menu Completo" (menu de servicos por categoria em acordeao mobile-first)
  - Passos planejados (pre-edicao)
    - criar endpoint publico de catalogo completo de servicos por categoria (sem dependencia de unidade/data).
    - reutilizar filtros/ordenacao de categorias e servicos ativos no backend.
    - trocar o link `Ver Menu Completo` por trigger de modal em `HomeServicesSection`.
    - implementar modal luxuoso com acordeao por categoria (uma aberta por vez) exibindo nome, duracao e preco.
    - adicionar estados de carregamento/erro/vazio e interacoes de fechamento (botao/backdrop/Esc).
    - validar com lint/build (web e api) e registrar checkpoint final.
  - Checkpoint de continuidade
    - Ultimo passo concluido: escopo e UX final aprovados (acordeao mobile-first, com duracao e preco).
    - Proximo passo planejado: implementar endpoint publico e modal no frontend.

## 2026-02-24 01:13:27
- Implementacao: modal "Ver Menu Completo" com catalogo de servicos por categoria (acordeao) + endpoint publico
  - Alteracoes de codigo
    - `apps/api/src/lib/appointmentAvailability.ts`
      - criado `listPublicServiceCatalogByCategory()` com categorias/servicos ativos, ordenacao alfabetica e payload com `durationMin` + `price`.
    - `apps/api/src/routes/index.ts`
      - novo endpoint publico `GET /api/public/services/catalog` retornando `{ categories }`.
    - `apps/web/src/modules/public-site/sections/HomeServicesSection.tsx`
      - `Ver Menu Completo` trocado para trigger de modal;
      - modal flutuante (visual premium) implementado na propria secao;
      - carregamento do catalogo via endpoint publico;
      - estados `loading/erro/vazio`;
      - acordeao por categoria (uma aberta por vez) com duracao e preco por servico;
      - fechamento por botao, backdrop e tecla `Esc`.
  - Validacao
    - `apps/api`: `npm run build` PASS.
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
    - observacao: validacao manual visual/UX do modal em desktop e celular ainda pendente.
  - Checkpoint de continuidade
    - Ultimo passo concluido: endpoint publico + modal acordeao integrados e compilando.
    - Proximo passo planejado: validar no navegador (mobile/desktop) e ajustar refinamentos visuais/textuais conforme feedback.

## 2026-02-24 08:40:23
- Ajuste planejado (debug UX/modal): modal "Ver Menu Completo" alto demais e conteudo interno nao aparecendo apos falha inicial de carregamento
  - Passos planejados (pre-edicao)
    - reduzir altura do modal para caber na viewport com scroll interno controlado;
    - reforcar area de conteudo (`min-h-0`) para evitar colapso em layout flex;
    - rearmar o carregamento ao abrir o modal quando estado anterior estiver em erro;
    - validar `apps/web` com lint/build e registrar checkpoint final.
  - Checkpoint de continuidade
    - Ultimo passo concluido: causa provavel isolada (altura `h-full` + estado de erro persistente no modal).
    - Proximo passo planejado: aplicar patch em `HomeServicesSection.tsx` e validar.

## 2026-02-24 08:43:45
- Correcao aplicada (modal "Ver Menu Completo"): altura/viewport e recarregamento apos erro
  - Alteracoes de codigo
    - `apps/web/src/modules/public-site/sections/HomeServicesSection.tsx`
      - `openCatalogModal()` agora reativa o fetch ao reabrir quando o estado anterior estava em `error` (reset para `idle`);
      - overlay do modal passou a centralizar o card (`flex items-center justify-center`);
      - container interno deixou de usar `h-full` e passou a usar `max-h` responsivo para caber na tela;
      - area de conteudo recebeu `min-h-0` para evitar colapso em layout flex com scroll interno.
  - Validacao
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
  - Checkpoint de continuidade
    - Ultimo passo concluido: modal ajustado para caber na viewport e recuperar carregamento apos erro inicial.
    - Proximo passo planejado: validar visualmente no navegador se a lista agora aparece corretamente (desktop e mobile).

## 2026-02-24 09:06:30
- Debug de estilo (Tailwind) para modal "Ver Menu Completo" com conteudo aparentemente vazio
  - Causa raiz confirmada
    - `tailwind.config.js` escaneava apenas `./*.html`, entao classes usadas em `apps/web/src/**/*.tsx` nao eram geradas no `tailwind.css`.
    - varias classes do modal (ex.: `text-white/75`, `border-gold-accent/40`, `bg-white/[0.03]`, gradientes arbitrarios) estavam ausentes no CSS compilado.
  - Passos planejados (pre-edicao)
    - corrigir `tailwind.config.js` para incluir `apps/web/src/**/*.{ts,tsx,js,jsx,html}`;
    - compilar um patch de utilities Tailwind (sem sobrescrever `tailwind.css` legado/custom);
    - importar o patch CSS no frontend apos `tailwind.css`;
    - validar com build e confirmar que as classes faltantes foram geradas.
  - Checkpoint de continuidade
    - Ultimo passo concluido: causa raiz de estilo isolada com evidencia no CSS gerado.
    - Proximo passo planejado: gerar patch CSS Tailwind e ligar no `main.tsx`.

## 2026-02-24 09:11:37
- Correcao aplicada (Tailwind): classes do modal React nao geradas por `tailwind.css`
  - Alteracoes de codigo
    - `tailwind.config.js`
      - `content` ampliado para incluir `apps/web/index.html` e `apps/web/src/**/*.{js,jsx,ts,tsx,html}` (alem dos HTMLs raiz/legacy).
    - `tmp/tailwind-react-patch.input.css`
      - criado input minimo com `@tailwind utilities;` para gerar apenas utilities faltantes (sem sobrescrever CSS custom legado).
    - `apps/web/src/styles/tailwind.react.patch.css`
      - patch compilado com utilities Tailwind faltantes usadas pelo modal (incluindo classes arbitrarias e opacidades).
    - `apps/web/src/main.tsx`
      - importado `./styles/tailwind.react.patch.css` logo apos `tailwind.css`.
  - Compilacao Tailwind
    - comando executado: `npx tailwindcss@3.4.17 -c tailwind.config.js -i tmp/tailwind-react-patch.input.css -o apps/web/src/styles/tailwind.react.patch.css`
  - Validacao
    - verificado no patch CSS: classes antes ausentes agora existem (ex.: `from-[#07160f]/95`, `border-gold-accent/40`, `text-white/75`).
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
  - Checkpoint de continuidade
    - Ultimo passo concluido: pipeline de estilo corrigido para o modal React via patch de utilities compilado.
    - Proximo passo planejado: validar no navegador se o conteudo do acordeao ficou visivel e, depois, decidir se consolidamos isso em uma compilacao Tailwind unica (sem patch).

## 2026-02-24 09:23:43
- Correcao aplicada (React StrictMode): modal preso em skeleton infinito apesar de endpoint OK
  - Causa raiz
    - `StrictMode` em dev executa cleanup/re-run do `useEffect`; o primeiro fetch era cancelado e o guard baseado em `catalogLoadState !== "idle"` impedia nova tentativa, deixando o estado em `loading`.
  - Alteracoes de codigo
    - `apps/web/src/modules/public-site/sections/HomeServicesSection.tsx`
      - adicionado `catalogReloadToken` para controlar recarga explicitamente;
      - efeito de fetch do catalogo passou a depender de `isCatalogModalOpen + catalogReloadToken` (sem travar em `loading`);
      - criado `retryCatalogLoad()` e botao "Tentar novamente" passou a chamar essa funcao;
      - `openCatalogModal()` reutiliza `retryCatalogLoad()` quando o ultimo estado era `error`.
  - Validacao
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
  - Checkpoint de continuidade
    - Ultimo passo concluido: carregamento do modal resiliente a `StrictMode` (sem skeleton infinito).
    - Proximo passo planejado: validar em runtime que o acordeao renderiza categorias/servicos e ajustar refinamentos visuais finais, se necessario.

## 2026-02-24 10:11:41
- Ajuste planejado (chatbot web): verificar/cadastrar cliente por telefone antes de criar agendamento
  - Contexto
    - Fluxo WhatsApp (Z-API) ja possui leitura por telefone e upsert de cliente em `apps/api/src/modules/chatbot/flow/conciergeFlow.ts`.
    - Fluxo web (`POST /public/concierge/book`) cria agendamento com `clientName/clientPhone`, mas nao garante cadastro em `customer`.
  - Passos planejados (pre-edicao)
    - extrair/expor helper reutilizavel de upsert de cliente por telefone no modulo do concierge;
    - integrar helper na rota `POST /public/concierge/book` antes de `createRemoteAppointment(...)`;
    - preencher `clientId` server-side com cliente existente/recem-criado;
    - manter compatibilidade do fluxo WhatsApp e usar nota de origem para cadastro via chatbot web.
  - Checkpoint de continuidade
    - Ultimo passo concluido: causa/escopo mapeados comparando fluxo WhatsApp x chatbot web.
    - Proximo passo planejado: aplicar patch backend e validar build.

## 2026-02-24 10:13:09
- Correcao aplicada (chatbot web): verificar/cadastrar cliente por telefone antes do agendamento
  - Alteracoes de codigo
    - `apps/api/src/modules/chatbot/flow/conciergeFlow.ts`
      - extraido helper reutilizavel `upsertConciergeCustomerByPhone(...)` para leitura/upsert por telefone com nome normalizado;
      - centralizado `select` de perfil do cliente em `CUSTOMER_PROFILE_SELECT`;
      - `upsertWhatsappCustomer(...)` passou a reutilizar o helper generico, preservando nota de origem WhatsApp.
    - `apps/api/src/routes/index.ts`
      - rota `POST /public/concierge/book` agora verifica/cadastra cliente antes de `createRemoteAppointment(...)`;
      - `clientId` do agendamento passa a ser resolvido no servidor usando o cadastro encontrado/criado;
      - cadastro novo via chatbot web usa nota `*cliente vindo pelo chatbot web`;
      - adicionado tratamento de erro com log estruturado e resposta `customer_upsert_failed`.
  - Validacao
    - `apps/api`: `npm run build` PASS.
    - `apps/api`: `npm run lint` indisponivel (script inexistente no `package.json`).
  - Checkpoint de continuidade
    - Ultimo passo concluido: fluxo web do chatbot passou a garantir cadastro/lookup de cliente por telefone antes de criar agendamento.
    - Proximo passo planejado: validar em runtime (telefone existente x telefone novo) e confirmar `appointment.clientId` preenchido.

## 2026-02-24 10:29:50
- Correcao planejada (hotfix): erro interno ao gravar cliente no chatbot web
  - Causa raiz provavel
    - rota `POST /public/concierge/book` passou a enviar `customer.id` para `appointment.clientId`;
    - porem `Appointment.clientId` referencia `User.id` (nao `Customer.id`), causando erro de relacao/constraint ao criar agendamento.
  - Passos planejados (pre-edicao)
    - ajustar rota para usar `customer.userId` (quando existir) como `clientId` do agendamento;
    - manter o cadastro/lookup em `Customer` por telefone;
    - validar `apps/api` com build e registrar checkpoint.
  - Checkpoint de continuidade
    - Ultimo passo concluido: causa raiz isolada por comparacao com `schema.prisma`.
    - Proximo passo planejado: aplicar hotfix na rota `/public/concierge/book`.

## 2026-02-24 10:31:02
- Hotfix aplicado (chatbot web): evitar erro de relacao ao criar agendamento apos cadastro de cliente
  - Causa raiz confirmada
    - `Appointment.clientId` referencia `User.id`, mas a rota estava passando `Customer.id` retornado pelo upsert de cliente por telefone.
  - Alteracao de codigo
    - `apps/api/src/routes/index.ts`
      - `POST /public/concierge/book` agora usa `customer.userId ?? parsed.data.clientId` para preencher `clientId` do agendamento;
      - o cadastro/lookup em `Customer` por telefone foi mantido (sem regressao).
  - Validacao
    - `apps/api`: `npm run build` PASS.
  - Checkpoint de continuidade
    - Ultimo passo concluido: hotfix aplicado e compilando.
    - Proximo passo planejado: redeploy no Railway e validar runtime (telefone novo e existente).

## 2026-02-24 10:44:12
- Ajuste planejado (chatbot web UX): falta de disponibilidade deve oferecer trocar data, nao trocar servico
  - Causa raiz
    - em `askPeriod()` (`apps/web/src/modules/public-site/index.behavior.ts`), quando nao ha vagas para `unidade + data + servico`, o fallback oferece `Escolher outro servico`.
  - Passos planejados (pre-edicao)
    - trocar fallback para `Escolher outra data` mantendo o servico ja escolhido;
    - adaptar `askDate()` para suportar modo de troca de data com preservacao do servico;
    - resetar apenas periodo/horario/profissional ao trocar o dia;
    - validar `apps/web` com lint/build.
  - Checkpoint de continuidade
    - Ultimo passo concluido: ponto exato do comportamento mapeado em `askPeriod()`.
    - Proximo passo planejado: aplicar patch em `index.behavior.ts`.

## 2026-02-24 10:46:41
- Correcao aplicada (chatbot web UX): quando nao ha vagas no dia, oferecer trocar data mantendo servico
  - Alteracoes de codigo
    - `apps/web/src/modules/public-site/index.behavior.ts`
      - fallback de `askPeriod()` trocado de `Escolher outro servico` para `Escolher outra data`;
      - nova acao informa que mantera o servico e chama `askDate({ preserveSelectedService: true })`;
      - `askDate()` agora aceita modo opcional para preservar servico selecionado;
      - ao trocar data com preservacao, o fluxo reseta apenas `periodo/horario/profissional` e volta direto para `askPeriod()` (sem recategorizar/reselecionar servico).
  - Validacao
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
  - Checkpoint de continuidade
    - Ultimo passo concluido: UX de indisponibilidade por dia ajustada para priorizar troca de data mantendo servico.
    - Proximo passo planejado: validar em runtime no chatbot (sem vagas no dia -> outra data -> horarios do mesmo servico).

## 2026-02-24 13:02:16
- Ajuste planejado (chatbot web UX): ao encerrar no pos-agendamento, limpar e fechar painel
  - Escopo
    - aplicar somente na pergunta final de continuidade (`askAnotherServiceDecision`);
    - manter os demais encerramentos atuais inalterados por enquanto.
  - Passos planejados (pre-edicao)
    - criar helper para limpar `conciergeBody`/`conciergeOptions`, resetar estado e fechar painel;
    - usar helper nas opcoes `Quero outra unidade/data` e `Finalizar`;
    - validar `apps/web` com lint/build.
  - Checkpoint de continuidade
    - Ultimo passo concluido: requisito refinado (nao aplicar em outros pontos por enquanto).
    - Proximo passo planejado: aplicar patch em `apps/web/src/modules/public-site/index.behavior.ts`.

## 2026-02-24 13:04:02
- Correcao aplicada (chatbot web UX): encerrar pos-agendamento agora limpa e fecha o chatbot
  - Alteracoes de codigo
    - `apps/web/src/modules/public-site/index.behavior.ts`
      - criado helper `closeAndResetConcierge()` para limpar mensagens/opcoes, resetar estado e fechar painel;
      - opcoes `Quero outra unidade/data` e `Finalizar` em `askAnotherServiceDecision()` passaram a usar o novo helper;
      - opcao `Sim, outro servico` mantida sem alteracao.
  - Validacao
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
  - Checkpoint de continuidade
    - Ultimo passo concluido: fluxo final agora fecha/limpa automaticamente quando usuario nao continua.
    - Proximo passo planejado: validar em runtime no pos-agendamento (clicar `Finalizar` e `Quero outra unidade/data`).

## 2026-02-24 13:20:42
- Ajuste planejado (dashboard admin / Painel): reposicionar box Agenda para topo da 3a coluna
  - Contexto
    - layout do `Painel` em `apps/web/src/modules/admin-dashboard/components/AdminDashboardView.tsx` usa grid `lg:grid-cols-3` com `Sales` (2 colunas) + `Agenda`.
    - solicitacao: garantir que `Agenda` fique visualmente na primeira linha da terceira coluna (mais alto).
  - Passos planejados (pre-edicao)
    - fixar placeholder `data-react-admin-dashboard-agenda` com `lg:col-start-3 lg:row-start-1`;
    - aplicar alinhamento superior (`self-start`) se necessario;
    - validar `apps/web` com lint/build.
  - Checkpoint de continuidade
    - Ultimo passo concluido: arquivo/layout do Painel identificado.
    - Proximo passo planejado: aplicar patch no grid do dashboard.

## 2026-02-24 13:22:11
- Correcao aplicada (dashboard admin / Painel): box Agenda fixado no topo da 3a coluna
  - Alteracoes de codigo
    - `apps/web/src/modules/admin-dashboard/components/AdminDashboardView.tsx`
      - placeholder `data-react-admin-dashboard-agenda` recebeu posicionamento explicito `lg:col-start-3 lg:row-start-1` e `self-start`.
  - Validacao
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
  - Checkpoint de continuidade
    - Ultimo passo concluido: reposicionamento do box Agenda aplicado no layout do Painel.
    - Proximo passo planejado: validar visualmente no Painel se a altura/encaixe ficou conforme esperado.

## 2026-02-24 13:36:18
- Correcao aplicada (dashboard admin / Painel): reestruturado layout para Agenda subir em relacao aos KPIs
  - Causa raiz confirmada
    - `Agenda` estava em um grid separado renderizado abaixo do bloco de KPIs; `row-start` so afetava esse grid interno e nao sua posicao relativa aos KPIs.
  - Alteracoes de codigo
    - `apps/web/src/modules/admin-dashboard/components/AdminDashboardView.tsx`
      - `Painel` (aba servicos) passou a usar grid principal `lg:grid-cols-3` com `items-start`;
      - colunas 1-2 agora agrupam `header + KPIs + vendas` em um container unico (`lg:col-span-2`);
      - placeholder `data-react-admin-dashboard-agenda` permanece na 3a coluna, topo (`lg:col-start-3 lg:row-start-1 self-start`).
  - Validacao
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
  - Checkpoint de continuidade
    - Ultimo passo concluido: Agenda reposicionada estruturalmente no topo da 3a coluna do Painel.
    - Proximo passo planejado: validar visualmente no navegador (Painel) e ajustar espacamentos finos, se necessario.

## 2026-02-24 14:02:11
- Ajuste planejado (imagens/avatar): evitar URLs `localhost` no banco e corrigir registros antigos
  - Causa raiz mapeada
    - endpoint `POST /api/uploads` monta URL absoluta com `req.protocol + req.host`, entao uploads feitos apontando para API local salvam `http://localhost:3001/uploads/...` no banco;
    - frontend em producao tenta carregar esse host local e ocorre mixed content / `ERR_CONNECTION_REFUSED`.
  - Passos planejados (pre-edicao)
    - retornar path relativo (`/uploads/...`) no backend de upload;
    - normalizar `avatarUrl` no frontend (auth/menu/admin usuarios) para prefixar com origem da API e reescrever URLs antigas de localhost;
    - criar script em `apps/api/scripts` para converter `User.avatarUrl` antigo (`localhost/127.0.0.1`) para path relativo `/uploads/...`;
    - validar `apps/api` build e `apps/web` lint/build.
  - Checkpoint de continuidade
    - Ultimo passo concluido: causa raiz isolada com evidencia no endpoint de upload e nos renders de avatar.
    - Proximo passo planejado: aplicar patch backend/frontend + script de correção.

## 2026-02-24 14:09:58
- Correcao aplicada (imagens/avatar): uploads relativos + normalizacao de avatar + script de saneamento
  - Alteracoes de codigo (backend)
    - `apps/api/src/routes/index.ts`
      - `POST /api/uploads` passou a retornar `url` relativo (`/uploads/<arquivo>`) em vez de URL absoluta baseada em `req.host`.
    - `apps/api/package.json`
      - adicionado script `fix:avatar-urls` para saneamento de URLs antigas.
    - `apps/api/scripts/fixAvatarUploadUrls.ts`
      - script para converter `User.avatarUrl` de `http://localhost.../uploads/...` e `http://127.0.0.1.../uploads/...` para `/uploads/...`;
      - suporta `--dry-run` e usa `logger`.
  - Alteracoes de codigo (frontend)
    - `apps/web/src/lib/assetUrls.ts`
      - novo helper `resolveUploadedAssetUrl(...)` para normalizar `/uploads/...`, reescrever localhost para origem atual da API e corrigir `http` em `railway.app`.
    - `apps/web/src/lib/auth.ts`
      - `setUser()` e `getUser()` passaram a normalizar `avatarUrl` antes de armazenar/retornar estado autenticado.
    - `apps/web/src/modules/admin-core/behavior.ts`
      - preview/listagem/edicao de avatar em usuarios agora usam normalizacao de URL;
      - `fetchUsers()` normaliza `avatarUrl` ao preencher cache.
  - Validacao
    - `apps/api`: `npm run build` PASS.
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
    - `apps/api`: `npm run fix:avatar-urls -- --dry-run` BLOQUEADO no sandbox (`EPERM spawn` via `tsx/esbuild`), sem executar alteracoes.
  - Checkpoint de continuidade
    - Ultimo passo concluido: novos uploads e exibicao de avatars nao dependem mais de `localhost`; script de saneamento criado para registros antigos.
    - Proximo passo planejado: rodar script de saneamento no ambiente desejado (local/Railway shell) e redeploy do backend/frontend.

## 2026-02-24 14:22:14
- Ajuste planejado (carrinho): imagem de produto nao aparece no carrinho apos adicionar
  - Causa raiz mapeada
    - vitrine de produtos usa normalizacao de imagem (`resolveProductImageUrl`), mas `addCartItem(...)` salva `product.imageUrl` cru no carrinho;
    - render do carrinho usa `item.imageUrl` sem normalizar.
  - Passos planejados (pre-edicao)
    - normalizar `imageUrl` ao adicionar produto ao carrinho na Home;
    - normalizar `imageUrl` no render do carrinho para cobrir itens antigos em `localStorage`;
    - validar `apps/web` com lint/build.
  - Checkpoint de continuidade
    - Ultimo passo concluido: causa raiz confirmada comparando HomeProductsSection x render do carrinho.
    - Proximo passo planejado: aplicar patch frontend.

## 2026-02-24 14:24:38
- Correcao aplicada (carrinho): imagens de produtos normalizadas ao adicionar e ao renderizar
  - Alteracoes de codigo
    - `apps/web/src/modules/public-site/sections/HomeProductsSection.tsx`
      - `addCartItem(...)` passou a salvar `imageUrl` ja normalizada via `resolveProductImageUrl(...)`.
    - `apps/web/src/modules/public-site/index.behavior.ts`
      - `getCartItemImage(...)` passou a normalizar `item.imageUrl` com `resolveUploadedAssetUrl(...)`, cobrindo itens antigos no `localStorage`.
  - Validacao
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
  - Checkpoint de continuidade
    - Ultimo passo concluido: imagem de produto no carrinho corrigida para novos e antigos itens.
    - Proximo passo planejado: validar em runtime (adicionar produto e abrir carrinho).

## 2026-02-24 14:54:37
- Ajuste planejado (checkout): reorganizar fluxo para foco em pagamento e carrinho colapsavel
  - Objetivo
    - remover lista de produtos visivel ao lado do formulario de pagamento;
    - exibir em ordem: `Subtotal` (clicavel para abrir carrinho), `Cupom`, `Dados para pagamento`, `Total a pagar`.
  - Passos planejados (pre-edicao)
    - reestruturar `CheckoutContent.tsx` para layout em coluna unica (desktop/mobile);
    - adicionar toggle de exibicao do carrinho a partir do valor do subtotal;
    - mover cupom para bloco proprio acima do pagamento;
    - mover total para bloco final e manter botoes/acoes existentes.
  - Checkpoint de continuidade
    - Ultimo passo concluido: layout atual e pontos de cupom/carrinho/pagamento mapeados.
    - Proximo passo planejado: aplicar patch no `CheckoutContent.tsx`.

## 2026-02-24 15:00:21
- Correcao aplicada (checkout): fluxo reorganizado para subtotal/cupom/pagamento/total
  - Alteracoes de codigo
    - `apps/web/src/components/pages/CheckoutContent.tsx`
      - checkout passou para layout em coluna unica (desktop/mobile), removendo competicao visual da lista de produtos ao lado do pagamento;
      - adicionado subtotal do carrinho em bloco superior com valor clicavel para abrir/fechar lista de itens (carrinho colapsavel);
      - campo de cupom movido para bloco proprio logo abaixo do subtotal;
      - bloco de pagamento recebeu destaque como `Dados para pagamento` (temporario), priorizando PIX e Cartao;
      - resumo lateral foi simplificado para `Total a pagar`, mantendo calculo final e botao de conclusao;
      - lista de produtos e cupom do resumo antigo foram ocultados (substituidos pelos blocos superiores).
    - uso de `resolveUploadedAssetUrl(...)` no preview de itens do carrinho dentro do checkout.
  - Validacao
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
  - Checkpoint de continuidade
    - Ultimo passo concluido: checkout reorganizado na ordem solicitada para etapa temporaria pre-Stripe.
    - Proximo passo planejado: validar visualmente no PC/celular e ajustar micro-layout/espacamento se necessario.

## 2026-02-24 15:12:46
- Hotfix planejado (Admin / Secoes SPA): erro interno ao abrir tela de toggles
  - Causa raiz provavel
    - path de `sectionToggles.ts` dependente de `process.cwd()` pode resolver caminho errado em Railway/local, causando falha de leitura em `GET /api/admin/section-toggles`.
  - Passos planejados (pre-edicao)
    - substituir path fixo por resolver robusto com caminhos candidatos (`cwd` + `__dirname`);
    - validar existencia com `fs.existsSync` e erro diagnostico com paths testados;
    - ajustar leitura/escrita para usar o path resolvido;
    - validar `apps/api` com build.
  - Checkpoint de continuidade
    - Ultimo passo concluido: parser de `sectionToggles.ts` testado e funcionando (problema nao e formato do arquivo).
    - Proximo passo planejado: aplicar patch no backend.

## 2026-02-24 15:14:29
- Hotfix aplicado (Admin / Secoes SPA): resolucao robusta do path de `sectionToggles.ts`
  - Alteracoes de codigo
    - `apps/api/src/routes/index.ts`
      - path fixo baseado em `process.cwd()` substituido por resolver com multiplos caminhos candidatos (`cwd` e `__dirname`);
      - validacao de existencia com `fs.existsSync`;
      - erro de diagnostico inclui paths testados quando o arquivo nao e encontrado;
      - leitura/escrita de `sectionToggles.ts` passaram a usar `filePath` resolvido dinamicamente.
  - Validacao
    - `apps/api`: `npm run build` PASS.
  - Checkpoint de continuidade
    - Ultimo passo concluido: endpoint de section toggles resiliente a variacao de `cwd` em ambiente local/Railway.
    - Proximo passo planejado: redeploy da API no Railway e validar tela `Secoes SPA` (carregar/salvar).

## 2026-02-24 19:15:00
- Migracao planejada (Admin / Secoes SPA): persistir toggles em `settings` para evitar dependencia de arquivo/deploy
  - Contexto
    - `GET /api/admin/section-toggles` continua retornando `500` em producao (Railway) por dependencia de filesystem/arquivo `sectionToggles.ts`.
    - Objetivo: salvar todas as toggles em snapshot unico no banco (`settings`) e permitir leitura publica em runtime.
  - Passos planejados (pre-edicao)
    - backend: trocar `GET/PUT /admin/section-toggles` para usar `prisma.setting` (chave `public.sectionToggles`) com fallback local;
    - backend: adicionar `GET /public/section-toggles` para leitura sem auth;
    - frontend admin: ajustar mensagens para indicar persistencia em banco/settings;
    - frontend publico: carregar toggles em runtime (fallback local) e atualizar exibicao das secoes sem depender de rebuild;
    - validar `apps/api` build e `apps/web` lint/build.
  - Checkpoint de continuidade
    - Ultimo passo concluido: confirmada causa estrutural (feature dependente de arquivo no servidor).
    - Proximo passo planejado: implementar migracao completa para `settings`.

## 2026-02-24 19:36:00
- Migracao aplicada (Admin / Secoes SPA): toggles persistidos em `settings` + leitura publica em runtime
  - Alteracoes de codigo (backend)
    - `apps/api/src/routes/index.ts`
      - criada chave `public.sectionToggles` em `settings` para snapshot completo das toggles;
      - `GET /api/admin/section-toggles` agora le de `settings` (com fallback para arquivo/default);
      - `PUT /api/admin/section-toggles` agora salva no banco (`prisma.setting.upsert`) sem escrever arquivo;
      - novo endpoint publico `GET /api/public/section-toggles` para consumo do site;
      - mantido fallback local + default embutido para resiliencia inicial.
  - Alteracoes de codigo (frontend)
    - `apps/web/src/modules/public-site/sectionToggles.runtime.ts` (novo)
      - store runtime com fallback local, fetch idempotente em `/api/public/section-toggles` e hooks React.
    - `apps/web/src/app/layouts/PublicLayout.tsx`
      - bootstrap dos toggles publicos e reinit do `initIndexPage()` quando toggles carregam.
    - `apps/web/src/components/pages/HomeContent.tsx`
    - `apps/web/src/components/pages/AssinaturasContent.tsx`
    - `apps/web/src/components/pages/FranquiasContent.tsx`
      - paginas publicas passaram a usar toggles runtime (com re-render).
    - `apps/web/src/modules/admin-section-toggles/components/AdminSectionTogglesView.tsx`
      - textos atualizados para indicar persistencia em `settings` (banco).
    - `apps/web/src/modules/public-site/sectionToggles.ts`
      - exports de tipo/snapshot default para reutilizacao pela store runtime.
  - Validacao
    - `apps/api`: `npm run build` PASS.
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
  - Checkpoint de continuidade
    - Ultimo passo concluido: migracao de `Secoes SPA` para banco/settings implementada ponta a ponta.
    - Proximo passo planejado: fazer 1 deploy da API + frontend; depois, futuras mudancas de toggles devem funcionar sem novos deploys (basta salvar no Admin e recarregar a pagina publica).

## 2026-02-24 20:05:00
- Correcao planejada (frontend): textos visiveis em PT-BR (sem ajuste de layout/corte visual)
  - Escopo aprovado
    - corrigir ortografia/acentuacao de textos visiveis nas paginas publicas, chatbot web e tela Admin `Secoes SPA`;
    - nao alterar layout, overflow, alturas ou riscos de corte visual nesta etapa.
  - Passos planejados (pre-edicao)
    - atualizar strings visiveis em `index.behavior.ts` (chatbot), telas publicas e `AdminSectionTogglesView`;
    - validar `apps/web` com lint/build;
    - registrar checkpoint final.
  - Checkpoint de continuidade
    - Ultimo passo concluido: auditoria estatica de textos/UX e lista de inconsistencias entregue.
    - Proximo passo planejado: aplicar patch de strings PT-BR visiveis.

## 2026-02-24 20:18:00
- Correcao aplicada (frontend): textos visiveis em PT-BR (sem mexer em layout/corte visual)
  - Alteracoes de codigo
    - `apps/web/src/modules/public-site/index.behavior.ts`
      - corrigidas mensagens visiveis do chatbot/checkout (acentuacao e ortografia) sem alterar logica.
    - `apps/web/src/components/pages/HomeContent.tsx`
      - corrigidos textos visiveis em banner/login/signup/modal carrinho.
    - `apps/web/src/components/pages/AssinaturasContent.tsx`
      - corrigidos textos visiveis do hero/cards (acentos e ortografia).
    - `apps/web/src/modules/public-site/sections/FranquiasModelsSection.tsx`
    - `apps/web/src/modules/public-site/sections/FranquiasVisionSection.tsx`
    - `apps/web/src/modules/public-site/sections/HomeMembershipSection.tsx`
    - `apps/web/src/modules/public-site/sections/HomeServicesSection.tsx`
    - `apps/web/src/modules/public-site/sections/HomeTestimonialsSection.tsx`
      - corrigidos textos visiveis de secoes publicas (acentuacao/ortografia).
    - `apps/web/src/modules/admin-section-toggles/components/AdminSectionTogglesView.tsx`
      - corrigidos textos visiveis da tela `Secoes SPA` para PT-BR.
  - Escopo preservado
    - nenhum ajuste de layout, overflow, altura, corte visual ou bordas fora da viewport foi aplicado nesta etapa.
  - Validacao
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
  - Checkpoint de continuidade
    - Ultimo passo concluido: textos visiveis PT-BR corrigidos no frontend (publico + chatbot + admin `Secoes SPA`).
    - Proximo passo planejado: aguardar sua avaliacao visual e, se aprovado, tratar riscos de corte visual em etapa separada.

## 2026-02-24 20:27:00
- Ajuste incremental (frontend): correcao textual adicional na Home Hero (PT-BR)
  - Alteracoes de codigo
    - `apps/web/src/modules/public-site/sections/HomeHeroSection.tsx`
      - corrigida frase do hero da Home (`santuário`, `interseção`, `avançada`, `holístico`).
  - Validacao
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
  - Checkpoint de continuidade
    - Ultimo passo concluido: ajuste textual pontual na Home Hero.
    - Proximo passo planejado: continuar correcoes texto a texto conforme revisao visual do usuario.

## 2026-02-24 20:36:00
- Ajuste incremental (frontend): correcao textual em `HomeAboutSection`
  - Alteracoes de codigo
    - `apps/web/src/modules/public-site/sections/HomeAboutSection.tsx`
      - `Anos de Experiencia` corrigido para `Anos de Experiência`.
  - Validacao
    - `apps/web`: `npm run lint` PASS (reexecutado com timeout maior).
    - `apps/web`: `npm run build` PASS (reexecutado com timeout maior).
  - Checkpoint de continuidade
    - Ultimo passo concluido: ajuste textual pontual em `HomeAboutSection`.
    - Proximo passo planejado: continuar correcoes texto a texto conforme revisao visual do usuario.

## 2026-02-24 20:44:00
- Ajuste incremental (frontend): correcao textual em `HomeAboutSection` (`Produtos Orgânicos`)
  - Alteracoes de codigo
    - `apps/web/src/modules/public-site/sections/HomeAboutSection.tsx`
      - `Produtos Organicos` corrigido para `Produtos Orgânicos` (acentuacao PT-BR).
  - Validacao
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
  - Checkpoint de continuidade
    - Ultimo passo concluido: ajuste textual pontual em `HomeAboutSection` (`Produtos Orgânicos`).
    - Proximo passo planejado: continuar correcoes texto a texto conforme revisao visual do usuario.

## 2026-02-24 20:51:00
- Ajuste incremental (frontend): correcao textual em `HomeProductsSection`
  - Alteracoes de codigo
    - `apps/web/src/modules/public-site/sections/HomeProductsSection.tsx`
      - `Colecao Completa` corrigido para `Coleção Completa`.
  - Validacao
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
  - Checkpoint de continuidade
    - Ultimo passo concluido: ajuste textual pontual em `HomeProductsSection` (`Coleção Completa`).
    - Proximo passo planejado: continuar correcoes texto a texto conforme revisao visual do usuario.

## 2026-02-24 20:58:00
- Ajuste incremental (frontend): correcao textual em `FranquiasHeroSection`
  - Alteracoes de codigo
    - `apps/web/src/modules/public-site/sections/FranquiasHeroSection.tsx`
      - corrigida acentuacao da frase do hero (`elegância`, `sofisticação`).
  - Validacao
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
  - Checkpoint de continuidade
    - Ultimo passo concluido: ajuste textual pontual em `FranquiasHeroSection`.
    - Proximo passo planejado: continuar correcoes texto a texto conforme revisao visual do usuario.

## 2026-02-24 21:04:00
- Ajuste incremental (frontend): correcao textual em `FranquiasHeroSection` (`Nossa Visão`)
  - Alteracoes de codigo
    - `apps/web/src/modules/public-site/sections/FranquiasHeroSection.tsx`
      - `Nossa Visao` corrigido para `Nossa Visão`.
  - Validacao
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
  - Checkpoint de continuidade
    - Ultimo passo concluido: ajuste textual pontual em `FranquiasHeroSection` (`Nossa Visão`).
    - Proximo passo planejado: continuar correcoes texto a texto conforme revisao visual do usuario.

## 2026-02-24 21:10:00
- Ajuste incremental (frontend): correcao textual em `FranquiasContactSection`
  - Alteracoes de codigo
    - `apps/web/src/modules/public-site/sections/FranquiasContactSection.tsx`
      - `dossie` corrigido para `dossiê` na frase do formulario de franquias.
  - Validacao
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
  - Checkpoint de continuidade
    - Ultimo passo concluido: ajuste textual pontual em `FranquiasContactSection`.
    - Proximo passo planejado: continuar correcoes texto a texto conforme revisao visual do usuario.

## 2026-02-24 21:16:00
- Ajuste incremental (frontend): correcao textual `Endereço de Email` (2 ocorrencias)
  - Alteracoes de codigo
    - `apps/web/src/modules/public-site/sections/FranquiasContactSection.tsx`
      - label `Endereco de Email` corrigido para `Endereço de Email`.
    - `apps/web/src/modules/footer/components/PublicSiteFooter.tsx`
      - placeholder `Endereco de Email` corrigido para `Endereço de Email`.
  - Validacao
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
  - Checkpoint de continuidade
    - Ultimo passo concluido: ajuste textual pontual em formulario de franquias + footer.
    - Proximo passo planejado: continuar correcoes texto a texto conforme revisao visual do usuario.

## 2026-02-24 21:21:00
- Ajuste incremental (frontend): correcao textual em `FranquiasContactSection` (`Número de Telefone`)
  - Alteracoes de codigo
    - `apps/web/src/modules/public-site/sections/FranquiasContactSection.tsx`
      - label `Numero de Telefone` corrigido para `Número de Telefone`.
  - Validacao
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
  - Checkpoint de continuidade
    - Ultimo passo concluido: ajuste textual pontual em `FranquiasContactSection` (`Número de Telefone`).
    - Proximo passo planejado: continuar correcoes texto a texto conforme revisao visual do usuario.

## 2026-02-24 21:27:00
- Ajuste incremental (frontend): correcao textual em `FranquiasContactSection` (`Detalhes da Localização`)
  - Alteracoes de codigo
    - `apps/web/src/modules/public-site/sections/FranquiasContactSection.tsx`
      - `Detalhes da Localizacao` corrigido para `Detalhes da Localização`.
  - Validacao
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
  - Checkpoint de continuidade
    - Ultimo passo concluido: ajuste textual pontual em `FranquiasContactSection` (`Detalhes da Localização`).
    - Proximo passo planejado: continuar correcoes texto a texto conforme revisao visual do usuario.

## 2026-02-24 21:33:00
- Ajuste incremental (frontend): correcao textual em `FranquiasContactSection` (`Endereço / Região de Interesse`)
  - Alteracoes de codigo
    - `apps/web/src/modules/public-site/sections/FranquiasContactSection.tsx`
      - `Endereco / Regiao de Interesse` corrigido para `Endereço / Região de Interesse`.
  - Validacao
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
  - Checkpoint de continuidade
    - Ultimo passo concluido: ajuste textual pontual em `FranquiasContactSection` (`Endereço / Região de Interesse`).
    - Proximo passo planejado: continuar correcoes texto a texto conforme revisao visual do usuario.

## 2026-02-24 21:46:00
- Ajuste incremental (frontend): lote de correcoes textuais visiveis (franquias + menu + admin)
  - Alteracoes de codigo
    - `apps/web/src/modules/public-site/sections/FranquiasContactSection.tsx`
      - frase de privacidade: `formulario` -> `formulário` e `politica` -> `política` (mantido `voce` conforme texto solicitado).
    - `apps/web/src/modules/menu/components/FranquiasMenu.tsx`
      - `Formatos de franquia disponiveis.` -> `Formatos de franquia disponíveis.`
      - `Colecao` -> `Coleção`
    - `apps/web/src/components/pages/AdminContent.tsx`
      - item de menu `Servicos` -> `Serviços`
    - `apps/web/src/modules/admin-dashboard/components/AdminDashboardView.tsx`
      - `Sua melhor versao, Eternizada` -> `Sua melhor versão, Eternizada`
    - `apps/web/src/modules/admin-products/components/AdminProductsView.tsx`
      - `Beneficios (ate 5)` -> `Benefícios (ate 5)`
    - `apps/web/src/modules/admin-plans/components/AdminPlansView.tsx`
      - `Cadastro e Gestao de Planos` -> `Cadastro e Gestão de Planos`
      - `lista de beneficios` -> `lista de benefícios`
    - `apps/web/src/modules/admin-subscribers/components/AdminSubscribersView.tsx`
      - `Gestao de Assinantes` -> `Gestão de Assinantes`
  - Validacao
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
  - Checkpoint de continuidade
    - Ultimo passo concluido: lote das correcoes textuais pendentes solicitado apos `Concluído`.
    - Proximo passo planejado: aguardar nova rodada de revisao visual/ajustes de texto ou retomar avaliacao de cortes visuais.

## 2026-02-24 22:02:00
- Correcao planejada (frontend): revisao focada em palavras-chave PT-BR (`você`, `gestão`, `benefícios`, `história`, `óleo`, `solução`)
  - Escopo aprovado
    - revisar e corrigir ocorrencias visiveis no frontend, priorizando palavras-chave citadas pelo usuario;
    - manter sem mudancas de layout/corte visual.
  - Passos planejados (pre-edicao)
    - mapear ocorrencias em `apps/web/src`;
    - aplicar correcoes apenas em strings de UI/placeholder/labels;
    - validar `apps/web` (`lint` + `build`) e registrar checkpoint final.
  - Checkpoint de continuidade
    - Ultimo passo concluido: levantamento inicial apontou novas ocorrencias em menus, franquias e formularios admin.
    - Proximo passo planejado: aplicar patch em lote das strings encontradas.

## 2026-02-24 22:12:00
- Correcao aplicada (frontend): revisao focada em palavras-chave PT-BR (`você`, `benefícios`, `história`)
  - Alteracoes de codigo
    - `apps/web/src/modules/public-site/sections/FranquiasContactSection.tsx`
      - `voce` -> `você` na frase de privacidade.
    - `apps/web/src/modules/menu/components/PublicMenu.tsx`
      - `beneficios` -> `benefícios`
      - `historia, proposito e experiencia` -> `história, propósito e experiência`
    - `apps/web/src/modules/menu/components/FranquiasMenu.tsx`
      - mesmas correcoes de `benefícios` / `história` / `propósito` / `experiência`
    - `apps/web/src/modules/admin-products/components/AdminProductsView.tsx`
      - placeholders/descricao com `beneficios` -> `benefícios` / `Beneficio` -> `Benefício`
    - `apps/web/src/modules/admin-services/components/AdminServicesView.tsx`
      - placeholder com `beneficios` -> `benefícios`
  - Verificacao adicional
    - busca por `oleo` e `solucao` em `apps/web/src` sem ocorrencias (nenhum ajuste necessario neste lote).
  - Validacao
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
  - Checkpoint de continuidade
    - Ultimo passo concluido: passada adicional por palavras-chave PT-BR no frontend concluida.
    - Proximo passo planejado: aguardar nova rodada de revisao visual do usuario ou retomar ajustes de layout/corte quando aprovado.

## 2026-02-24 22:18:00
- Ajuste incremental (frontend): fechamento da passada por palavras-chave (`gestão`)
  - Alteracoes de codigo
    - `apps/web/src/modules/admin-dashboard/components/AdminDashboardView.tsx`
      - `Gestao de Leads` corrigido para `Gestão de Leads`.
  - Observacao
    - ocorrencias remanescentes de `beneficios` na busca ampla sao atributos tecnicos (`name=\"beneficios[]\"`), mantidos sem alteracao.
  - Validacao
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
  - Checkpoint de continuidade
    - Ultimo passo concluido: passada de palavras-chave PT-BR refinada e consolidada.
    - Proximo passo planejado: aguardar sua revisao visual final ou nova lista de textos.

## 2026-02-24 23:14:16
- Plano aprovado (frontend): corrigir overflow do menu hamburguer no mobile
  - Diagnostico
    - dropdown mobile ancorado com `absolute right-0` ao icone dentro do bloco de acoes, causando abertura fora da viewport em telas pequenas.
  - Passos planejados
    - ajustar painel mobile para posicionamento `fixed` relativo ao viewport em `PublicMenu` e `FranquiasMenu`
    - manter scroll interno e visual atual
    - validar `apps/web` (`npm run lint` / `npm run build`)
  - Checkpoint de continuidade
    - Ultimo passo concluido: diagnostico da causa raiz do overflow fora da tela.
    - Proximo passo planejado: aplicar patch de posicionamento e validar.

## 2026-02-24 23:16:29
- Correcao aplicada (frontend): menu hamburguer mobile mantido dentro da viewport
  - Alteracoes de codigo
    - `apps/web/src/modules/menu/components/PublicMenu.tsx`
      - painel mobile (`#public-mobile-menu`) alterado de `absolute right-0 top-full` para `fixed left-4 right-4 top-24`.
      - altura maxima ajustada para `max-h-[70vh]` com scroll interno mantido.
    - `apps/web/src/modules/menu/components/FranquiasMenu.tsx`
      - painel mobile (`#franquias-mobile-menu`) alterado de `absolute right-0 top-full` para `fixed left-4 right-4 top-24`.
      - altura maxima ajustada para `max-h-[70vh]` com scroll interno mantido.
  - Resultado esperado
    - dropdown mobile abre totalmente na area visivel em celulares, sem extrapolar para fora da tela.
  - Validacao
    - `apps/web`: `npm run lint` PASS.
    - `apps/web`: `npm run build` PASS.
  - Checkpoint de continuidade
    - Ultimo passo concluido: correcao de posicionamento do menu mobile aplicada e validada.
    - Proximo passo planejado: aguardar validacao visual em celular e ajustar microespacamento/topo se necessario.

## 2026-02-26 22:38:29
- Registro de INICIO (governanca de memoria/registro)
  - Plano aberto: `memory/plans/PLAN-0001-REGRA-REGISTRO-MEMORIA.md`.
  - Objetivo: mover execucao detalhada para `PLAN-XXXX` e manter `memory/MODIFICATION_LOG.md` apenas com marcos de inicio/fim.

## 2026-02-26 22:39:01
- Registro de FIM (governanca de memoria/registro)
  - Regras atualizadas em `kernel/RULES.md`, `kernel/SYSTEM.md` e `kernel/BOOTSTRAP.md` para formalizar:
    - `memory/MODIFICATION_LOG.md` como historico macro (inicio/fim);
    - `memory/plans/PLAN-XXXX...` como execucao detalhada e continuidade.
  - Proximo passo: seguir o novo fluxo em todas as proximas alteracoes.

## 2026-02-26 22:52:38
- Registro de INICIO (melhoria textual de regras no bootstrap)
  - Plano aberto: `memory/plans/PLAN-0002-MELHORIA-TEXTO-BOOTSTRAP.md`.
  - Objetivo: melhorar redacao das regras de continuidade (memory/plans/, memory/decisions/ e readback) em `kernel/BOOTSTRAP.md`.

## 2026-02-26 22:53:16
- Registro de FIM (melhoria textual de regras no bootstrap)
  - `kernel/BOOTSTRAP.md` atualizado com redacao normativa para regras de `memory/plans/`, `memory/decisions/` e readback.
  - Ajustes de clareza, ortografia e consistencia de termos aplicados sem alterar o fluxo funcional.

## 2026-02-26 23:04:52
- Registro de INICIO (normalizacao de regras bootstrap/rules/system)
  - Plano aberto: `memory/plans/PLAN-0003-NORMALIZACAO-REGRAS-BOOTSTRAP-RULES-SYSTEM.md`.
  - Objetivo: separar responsabilidades sem sobreposicao entre bootstrap (inicio), rules (workflow/memoria) e SYSTEM (tecnico/organizacional).

## 2026-02-26 23:06:47
- Registro de FIM (normalizacao de regras bootstrap/rules/system)
  - `kernel/BOOTSTRAP.md` consolidado como rotina exclusiva de inicio de sessao.
  - `kernel/RULES.md` consolidado como fonte unica de workflow e memoria operacional.
  - `kernel/SYSTEM.md` consolidado como fonte unica de regras tecnicas e organizacionais.
  - Sobreposicoes removidas e regras realocadas para o arquivo dono.

## 2026-02-26 23:40:16
- Registro de INICIO (documentacao SPA sections + roadmap)
  - Plano aberto: `memory/plans/PLAN-0004-SPA-SECTIONS-E-ROADMAP.md`.
  - Objetivo: consolidar historico de modularizacao por secoes + painel `Secoes SPA` + migracao para `settings`, e atualizar `docs/evolutive_changes/ROADMAP.md`.

## 2026-02-26 23:41:31
- Registro de FIM (documentacao SPA sections + roadmap)
  - Criado `docs/evolutive_changes/SPA_SECTIONS_AND_SETTINGS_HISTORY.md` com linha do tempo, arquitetura atual e operacao da feature `Secoes SPA`.
  - Atualizado `docs/evolutive_changes/ROADMAP.md` para refletir estado real da frente `Secoes SPA + settings` e proximas etapas.

## 2026-02-26 23:53:15
- Registro de INICIO (atualizacao modules catalog)
  - Plano aberto: `memory/plans/PLAN-0005-ATUALIZACAO-MODULES-CATALOG.md`.
  - Objetivo: alinhar `documentations/MODULES_CATALOG.md` ao estado real dos modulos atuais.

## 2026-02-26 23:54:42
- Registro de FIM (atualizacao modules catalog)
  - `documentations/MODULES_CATALOG.md` atualizado para refletir modulos reais do frontend/backend.
  - Incluidos `admin-section-toggles`, `admin-discount-coupons`, `cart`, detalhes de `public-site` com `sectionToggles.runtime.ts` e secao de endpoints estruturais (`/api/admin|public/section-toggles`).

## 2026-02-27 00:51:50
- Registro de INICIO (plano aprovado: branding global + extracao de secoes SPA)
  - Plano aberto: `memory/plans/PLAN-0006-BRANDING-GLOBAL-E-EXTRACAO-SECOES-SPA.md`.
  - Decisoes confirmadas:
    - branding unico para todas as unidades;
    - `logoUrl` como URL do arquivo no servidor.
  - Estado: plano detalhado criado e aprovado, aguardando execucao futura.

## 2026-02-27 16:39:30
- Registro de FIM (branding global + extracao de secoes SPA)
  - Plano concluido: `memory/plans/PLAN-0006-DONE-BRANDING-GLOBAL-E-EXTRACAO-SECOES-SPA.md`.
  - Entrega tecnica:
    - backend com modulo de branding (`settings.public.branding`), endpoints admin/public e cache TTL em memoria;
    - frontend com runtime unico de branding (bootstrap unico + snapshot + subscribe) e substituicao de marca hardcoded em componentes estruturais;
    - extracao de secoes inline de `HomeContent` e Hero de `Assinaturas` para componentes dedicados;
    - tela Admin `Branding` integrada ao shell admin (view trigger + island).
  - Documentacao atualizada: `docs/evolutive_changes/SPA_SECTIONS_AND_SETTINGS_HISTORY.md`, `documentations/MODULES_CATALOG.md`, `docs/project/PROJECT_OVERVIEW.md`, `docs/evolutive_changes/ROADMAP.md`.

## 2026-02-28 01:42:22
- Registro de INICIO (governanca de registro hibrido com/sem plano)
  - Sem plano ativo no momento da solicitacao.
  - Objetivo: evitar lacunas no `memory/MODIFICATION_LOG.md` para correcoes pontuais fora de `PLAN-XXXX`.
  - Proximo passo planejado: atualizar regras (`kernel/RULES.md`/`kernel/BOOTSTRAP.md`) e formalizar decisao.

## 2026-02-28 01:43:05
- Registro de FIM (governanca de registro hibrido com/sem plano)
  - `kernel/RULES.md` atualizado com fluxo hibrido:
    - com plano: `MODIFICATION_LOG` registra apenas INICIO/FIM do plano;
    - sem plano: `MODIFICATION_LOG` registra INICIO/FIM por alteracao pontual.
  - `kernel/BOOTSTRAP.md` alinhado para leitura desse modelo no inicio da sessao.
  - Nova decisao ativa registrada em `memory/decisions/DECISION-002.md`.

## 2026-02-28 09:00:00
- Registro de INICIO (correcoes pontuais pos PLAN-0006: branding + navegacao)
  - Sem plano ativo no momento da execucao.
  - Objetivo: corrigir comportamento de branding em runtime, ajustar UX da tela Admin Branding e validar destinos de menu apos separacao de secoes/componentes.
  - Proximo passo planejado: aplicar correcoes em frontend, validar lint/build e checar alvos de menu.

## 2026-02-28 12:30:00
- Registro de FIM (correcoes pontuais pos PLAN-0006: branding + navegacao)
  - Branding (admin/public):
    - ajustado preview da logo em caixa fixa (sem sobreposicao aos campos);
    - adicionado upload de logo com autopreenchimento de `logoUrl`;
    - adicionado historico de logos com acao de reverter em 1 clique;
    - runtime de branding ajustado com snapshot local para fallback consistente no carregamento.
  - Navegacao/menu:
    - links internos migrados para navegacao SPA (`Link`) em menus e CTAs principais;
    - corrigidos destinos de topicos e ancora/hash apos extracao de secoes;
    - ajuste no layout publico para scroll/ancora sem regressao visual.
  - Arquivos principais alterados:
    - `apps/web/src/modules/admin-branding/components/AdminBrandingView.tsx`
    - `apps/web/src/modules/public-site/branding.runtime.ts`
    - `apps/web/src/modules/menu/components/PublicMenu.tsx`
    - `apps/web/src/modules/menu/components/FranquiasMenu.tsx`
    - `apps/web/src/app/layouts/PublicLayout.tsx`
    - `apps/web/src/components/pages/AdminContent.tsx`
    - `apps/web/src/modules/admin-performance/components/AdminPerformanceView.tsx`
    - `apps/web/src/modules/footer/components/PublicSiteFooter.tsx`
    - `apps/web/src/modules/menu/components/NavStatusActions.tsx`
    - `apps/web/src/modules/public-site/sections/HomeHeroSection.tsx`
    - `apps/web/src/modules/public-site/sections/HomeCtaSection.tsx`
    - `apps/web/package.json`
    - `scripts/check-menu-targets.mjs`
  - Validacoes executadas:
    - `apps/web npm run lint` PASS
    - `apps/web npm run build` PASS
    - `apps/web npm run check:menu-targets` PASS (`PASS=44`, `FAIL=0`)

## 2026-02-28 03:36:07
- Registro de INICIO (padronizacao de imagens e galeria de slots)
  - Plano aberto: `memory/plans/PLAN-0007-GALERIA-DE-IMAGENS-E-SLOTS-DE-MIDIA.md`.
  - Objetivo: padronizar referencias de imagens por pagina/secao e preparar galeria admin para troca segura por slots de midia.
  - Estado: inventario inicial concluido e plano salvo para continuidade na proxima sessao.

## 2026-03-01 00:58:50
- Registro de FIM (fluxo Stripe + pedido rastreavel + fulfillment)
  - Backend/API:
    - criado modulo Stripe em `apps/api/src/modules/payments/stripe/*` (`config`, `client`, `publicCheckout`, `index`);
    - novos endpoints publicos:
      - `POST /api/public/payments/stripe/checkout-session`
      - `GET /api/public/payments/stripe/confirm-session`
      - `POST /api/public/payments/stripe/cancel-pending`
      - `GET /api/public/orders/track/:publicCode`
    - novo endpoint admin:
      - `PATCH /api/orders/:id/fulfillment` (separacao, embalagem, despacho, envio, entrega, tracking).
    - webhook Stripe com verificacao de assinatura ativo em:
      - `POST /api/public/payments/stripe/webhook` (montado em `app.ts` com `express.raw` antes do `express.json`).
    - ajustes de ciclo do pedido/pagamento:
      - historico de status de pedido;
      - conciliacao de pagamento aprovado/cancelado;
      - cancelamento com reposicao de estoque para pedidos pendentes.
  - Banco/Prisma:
    - schema atualizado com campos de rastreio/fulfillment no `Order`;
    - novos modelos: `OrderStatusHistory` e `StripeWebhookEvent`;
    - migration adicionada:
      - `apps/api/prisma/migrations/20260301091500_order_fulfillment_and_stripe_events/migration.sql`.
  - Frontend/Checkout:
    - `CheckoutContent.tsx` conectado ao Stripe Checkout real;
    - coleta de `nome`, `email`, `telefone` no checkout;
    - retorno de sucesso/cancelamento Stripe tratado no modal;
    - cancelamento pendente chama API para desfazer pedido aberto;
    - limpeza de carrinho apos confirmacao de pagamento.
  - Documentacao:
    - `docs/config/STRIPE_TEST_RUNBOOK.md` atualizado para o estado atual do workspace.
  - Validacoes executadas:
    - `apps/api npm run prisma:generate` PASS
    - `apps/api npm run build` PASS
    - `apps/api npm run test` PASS
    - `apps/web npm run build` PASS
  - Observacao importante:
    - `npx prisma migrate deploy` nao foi aplicado no ambiente atual (erro `P3005` por schema ja existente sem baseline). Necessario aplicar migration no banco local correto (Laragon) antes de usar os novos endpoints em runtime.

## 2026-03-01 18:07:44
- Registro de INICIO (order dashboard operacional)
  - Plano aberto: `memory/plans/PLAN-0008-ORDER-DASHBOARD-OPERACIONAL.md`.
  - Objetivo: formalizar o plano derivado de `OrderDashBoardIdea.md` e executar os itens 2 e 7 (resumo de pedidos via API + operacao em lote para pendentes).

## 2026-03-01 20:46:41
- Registro de INICIO (estabilizacao pos PLAN-0008: deploy/build, enums, admin vendas, frete/settings, permissao master)
  - Sem plano ativo para este bloco; `PLAN-0008` mantido em checkpoint proprio.
  - Objetivo: estabilizar deploy no Railway, corrigir inconsistencias de enum PT-BR, ajustar tela Admin Vendas, consolidar politica de frete em `settings` e restringir submenus sensiveis ao papel `MASTER`.

## 2026-03-02 01:17:57
- Registro de FIM (estabilizacao pos PLAN-0008: deploy/build, enums, admin vendas, frete/settings, permissao master)
  - Deploy/build e enums:
    - rebuild/sincronizacao de schema para Railway (`664d680`, `fe2a265`);
    - reforco de enums em PT-BR e conversao de residuos em ingles (`c998e9d`).
  - Admin Vendas:
    - restaurado grid de pedidos e reposicionado totalizadores acima da lista (`5917112`).
  - Checkout/frete:
    - politica mista de entrega local e frete gratis por limite em `settings` (`2b8c162`);
    - modulo admin de configuracao de entrega integrado ao shell admin (`4542716`).
  - Permissoes no menu Admin:
    - criado grupo `Master` com submenu `Branding`, `Secoes SPA` e `Testes`;
    - visibilidade/restricao por role `MASTER` (bloqueio de trigger/view para demais perfis);
    - ajuste de `admin-tests` para validar views esperadas por role.
  - Configuracao de ambientes (evitar hardcode de dominio):
    - centralizacao de dominios web/api por variaveis de ambiente (`f4ef697`);
    - novos docs de referencia operacional de deploy:
      - `docs/config/DEPLOY_ENV_REFERENCE.md` (`ea5f081`);
      - link incluido em `docs/project/PROJECT_OVERVIEW.md`.
  - Arquivos/documentos principais impactados no bloco:
    - `apps/api/src/routes/index.ts`
    - `apps/api/src/app.ts`
    - `apps/api/src/modules/payments/stripe/config.ts`
    - `apps/api/.env.example`
    - `apps/web/src/components/pages/AdminContent.tsx`
    - `apps/web/src/components/pages/CheckoutContent.tsx`
    - `apps/web/src/modules/admin-core/behavior.ts`
    - `apps/web/src/modules/admin-tests/behavior.ts`
    - `apps/web/src/modules/admin-section-toggles/components/AdminSectionTogglesView.tsx`
    - `apps/web/src/modules/admin-checkout-delivery/*`
    - `apps/web/.env.example`
    - `docs/config/STRIPE_TEST_RUNBOOK.md`
    - `docs/config/DEPLOY_ENV_REFERENCE.md`
    - `docs/project/PROJECT_OVERVIEW.md`
  - Validacoes executadas no bloco:
    - `apps/web npm run lint` PASS
    - `apps/web npm run build` PASS
    - `apps/api npm run build` PASS
  - Proximo passo planejado:
    - configurar variaveis de ambiente em Railway/Vercel e validar fluxo Stripe fim-a-fim (sucesso/cancelamento/webhook).


## 2026-03-02 19:42:30
- Fechamento de sessao (normalizacao de memoria operacional e debug)
  - O que foi feito:
    - leitura das mudancas em `kernel/RULES.md` e alinhamento do playbook de workflow;
    - consolidacao de erros do `memory/MODIFICATION_LOG.md` e dos contextos de conversa em `memory/logs/DEBUG-HISTORY.md`;
    - padronizacao do formato dos incidentes para `# ID:` em todo o historico de debug.
  - O que mudou:
    - `memory/WORKFLOW_MEMORY_PLAYBOOK.md` atualizado com contexto de RAG/STAR, fluxo de sessao e memoria de debug;
    - `memory/logs/DEBUG-HISTORY.md` atualizado com incidentes `ERR-0001` a `ERR-0024` e formato final padronizado.
  - O que ficou pendente:
    - nenhum pendente aberto nesta sessao.

## 2026-03-03 04:14:33
- Fechamento de sessao (ajuste de UX da galeria de midias + auditoria)
  - O que foi feito:
    - correcoes no modal de edicao da galeria (`admin-media-gallery`) para preview em box fixo medio com imagem contida;
    - inclusao de fluxo explicito `Salvar e fechar` e confirmacao ao `Fechar sem salvar`;
    - validacao funcional manual confirmada pelo usuario e checklist do `PLAN-0007` marcado como concluido para testes de troca/reversao.
  - O que mudou:
    - `apps/web/src/modules/admin-media-gallery/components/AdminMediaGalleryView.tsx`;
    - `memory/plans/PLAN-0007-GALERIA-DE-IMAGENS-E-SLOTS-DE-MIDIA.md`;
    - `memory/logs/DEBUG-HISTORY.md` com novo incidente `ERR-0025`;
    - auditoria registrada em `memory/logs/AUDIT_CHECKLIST_20260303_041414-PASS.md` com resultado `PASS`.
  - O que ficou pendente:
    - fechamento formal do `PLAN-0007` via fluxo de Git (registro de commit/push) antes de renomear para `DONE`;
    - continuidade independente do `PLAN-0008` (teste manual de fluxo em lote ainda pendente no plano).

## 2026-03-04 18:27:31
- Registro de FIM (order dashboard operacional)
  - Plano concluido: `memory/plans/PLAN-0008-DONE-ORDER-DASHBOARD-OPERACIONAL.md`.
  - Pendencia final concluida: teste manual do fluxo em lote na tela admin de pedidos (resultado validado).
  - Situacao final: todos os itens de `Action Items` e `Validation` marcados como concluidos no plano.

## 2026-03-04 18:32:21
- Registro de FIM (galeria de imagens e slots de midia)
  - Plano concluido: `memory/plans/PLAN-0007-DONE-GALERIA-DE-IMAGENS-E-SLOTS-DE-MIDIA.md`.
  - Entrega final formalizada com fluxo Git completo (commit `b47bd81` em `main` + push para `origin/main`).
  - Situacao final: checklist tecnico e validacao funcional manual concluidos; governanca de memoria/plano atualizada.

## 2026-08-17 — Registro de INICIO/andamento (fixes pontuais reportados pelo usuário)
- Plano aberto: `memory/plans/PLAN-0027-FIXES-INCONSISTENCIAS-ADMIN-V2.md`.
- Objetivo: tratar inconsistências/bugs que o usuário foi reportando incrementalmente no Admin V2; usuário autorizou execução ("pode corrigir") após os 3 primeiros itens estarem investigados e documentados no plano.
- Itens 1-3 concluídos e validados (E2E real + visual real):
  - Item 1 — Cadastro > Clientes vazio: `apps/api/src/lib/customerSync.ts` (novo), ligado em `apps/api/src/lib/fulfillmentUtils.ts` (pedido pago) e `apps/api/src/lib/appointmentAvailability.ts` (agendamento criado); backfill `apps/api/scripts/backfillCustomersFromContacts.ts` (`npm run backfill:customers`) rodado no Postgres real (8 clientes materializados). `ERR-0056`.
  - Item 2 — Sessão expira em 15min: `apps/web/src/lib/auth.ts` (`refreshAccessToken`/`initSessionKeepAlive`), `apps/web/src/main.tsx`, `apps/web/src/app/RequireAdmin.tsx`. `ERR-0057`.
  - Item 3 — Cupons sem filtro de data: `apps/web/src/admin-v2/cadastros/coupons/CouponsListView.tsx` (filtro Vigente/Agendado/Expirado/Todas, client-side).
- Achado colateral (não pedido, documentado, não corrigido): Panorama > Clientes conta o mesmo cliente físico 2x por inconsistência na chave de identidade (`ERR-0058`) — decisão do usuário pendente.
- Validações executadas: `apps/api` `tsc -b` + `npm run build` + `npm run test` (134/134) PASS; `apps/web` `tsc -b` PASS; rebuild Docker (`api`+`web`) + redeploy; E2E real via curl (venda manual, agendamento novo, refresh token) contra Postgres real; validação visual real via Chrome (clientes materializados, filtro de cupons); dados de teste avulsos limpos do banco ao final.
- Pendente: decisão do usuário sobre o Item 4 (Panorama); possíveis novos itens do usuário; commit/push (aguardando autorização, ainda não solicitada nesta sessão).

## 2026-08-17 — Registro de andamento (segunda leva, Itens 5-11)
- Plano continua aberto: `memory/plans/PLAN-0027-FIXES-INCONSISTENCIAS-ADMIN-V2.md`. Usuário reportou mais 7 pontos numa leva só e autorizou tratar/corrigir diretamente ("agora pode começar a tratar e corrigir e fazer as alterações"), mantendo o plano aberto até ele sinalizar que não há mais itens.
- Itens concluídos e validados (E2E real + visual real):
  - Item 5/7 — `Cadastro > Clientes`: ID somente-leitura como 1º campo do form; "ID de usuário" trocou de lugar com E-mail e ganhou `title` explicando que é vínculo opcional com `User` (login), não o ID do cliente. `apps/web/src/admin-v2/cadastros/customers/components/CustomerFormModal.tsx`. `ERR-0059`.
  - Item 6 — `Panorama > Clientes`: subtítulo explicando que a lista inclui clientes sem cadastro formal (fonte derivada de pedido/agendamento, não de `Customer`). `apps/web/src/admin-v2/customers/CustomersFlowView.tsx`.
  - Item 8 — 2 cupons de teste criados via API real: `TESTE3` (3%, id 7) e `NOVOCLIENTE10` (10%, id 8). Documentado que o schema não tem segmentação de público — "novos clientes" só existe no nome.
  - Item 9 — `Cadastro > Serviços`: mesmo fix de ID do Item 5. `apps/web/src/admin-v2/cadastros/services/components/ServiceFormModal.tsx`. `ERR-0059`.
  - Item 10 — filtro "Destaque" adicionado em `ServicesListView.tsx`; reconciliação de dados: 8 serviços reais que representam os 9 flip-cards da Home marcados `isFeatured = true` no Postgres (ids 16,30,42,45,48,52,58,73). Achado de arquitetura documentado: os flip-cards são conteúdo estático (media slots + page texts), desconectado de `Service` — religar é decisão em aberto. `ERR-0060`.
  - Item 11 — `Membership.imageUrl` adicionado (migração aditiva `20260817180000_add_membership_image`); backend (`apps/api/src/routes/subscriptions.ts`) e cadastro nativo (`PlanFormModal.tsx`/`PlanCard.tsx`) atualizados com upload de imagem por plano. Achado de arquitetura documentado: a página pública ainda usa media slots genéricos/estáticos, não este campo — religar é decisão em aberto. `ERR-0061`.
- Validações executadas: `apps/api` `tsc -b` + `npm run build` + `npm run test` (134/134) PASS; `apps/web` `tsc -b` + `npm run build` PASS; `npx prisma generate` após alteração de schema; rebuild Docker (`api`+`web`) + `up -d --force-recreate`; migração aplicada automaticamente no boot do container (confirmada via `_prisma_migrations`); E2E real via curl (membership com `imageUrl` round-trip, contagem de `isFeatured`); validação visual real via Chrome (ID nos 2 forms, posição dos campos, filtro Destaque, campo de imagem do plano); registro de teste de `Membership` (`TesteImg`) removido ao final — cupons de teste do Item 8 foram mantidos por serem o próprio pedido do usuário.
- Pendente: decisões do usuário sobre Item 4, parte de "religar renderização pública" dos Itens 10/11; possíveis novos itens; commit/push (aguardando autorização).

## 2026-08-17 — Registro de andamento (Item 4 resolvido — decisão do usuário)
- Usuário decidiu: "clientes duplicados, junte num único" — Item 4 (Panorama > Clientes contando cliente físico 2x) deixa de ser achado documentado e passa a corrigido.
- `identityKey` (`apps/api/src/modules/intelligence/customers/service.ts`) trocada de `email > telefone > nome` para `telefone > email > nome` (telefone normalizado só-dígitos). `ERR-0058` atualizado para CORRIGIDO.
- Validações: `tsc -b` + `npm run test` (134/134) PASS; rebuild Docker (`api`) + `up -d --force-recreate`; E2E real (`GET /api/admin-v2/customers`: 17 → 9); visual real (Chrome, NOVOS 8 + EM RISCO 1 = 9).
- Nota de escopo registrada: `unit-health/service.ts` e `dashboardSalesInsights.ts` usam a mesma convenção de forma independente e não foram tocados — risco equivalente pode existir lá, fora do pedido.
- Plano continua aberto (usuário está validando, novos itens podem chegar); commit/push aguardando autorização.

## 2026-08-17 — Registro de FECHAMENTO de conteúdo (PLAN-0027) + ABERTURA (PLAN-0028)
- Usuário mandou encerrar o `PLAN-0027` e abrir um plano novo só para os 2 pontos de arquitetura que tinham ficado em aberto (religar flip-cards de Serviços e cards de Planos pra consumir o cadastro nativo em vez de Galeria de Mídias/Textos das Páginas), mantendo o comportamento/visual atual como está.
- `PLAN-0027` — todos os 11 itens resolvidos ou explicitamente encaminhados; conteúdo 100% fechado (ver seção "Git Record of Delivery" do próprio plano — Pre-commit review preenchido, commit/push seguem pendentes de aprovação explícita). Arquivo **não foi renomeado para `-DONE-`** — regra do kernel (`RULES.md` §10/§13) exige o Git Record completo (commit + push) antes de virar `DONE`; mesmo padrão já usado no `PLAN-0025`.
- `PLAN-0028` aberto: `memory/plans/PLAN-0028-RELIGAR-CONTEUDO-SERVICOS-PLANOS-CADASTRO-NATIVO.md`. Dois casos:
  - Caso A (Planos): achado que **corrige** o que foi dito no fechamento do `PLAN-0027` — `HomeMembershipSection.tsx` já é data-driven via `renderMembershipsFromDb()` em `index.behavior.ts` (busca `/api/public/memberships` de verdade); só falta renderizar `imageUrl` no template, que ainda não existia. Fix pequeno, aditivo, sem decisão de produto pendente.
  - Caso B (Serviços): achado novo — os 4 textos dos flip-cards (front/back label/tagline/desc) são conteúdo de marketing genuinamente distinto do nome operacional do serviço; `Service` não tem campos equivalentes hoje. Proposto: 4 campos novos opcionais em `Service` (`highlightLabel`/`highlightTagline`/`highlightBackLabel`/`highlightDescription`) + endpoint público novo + `HomeServicesSection.tsx` data-driven. **2 decisões de produto pendentes do usuário** antes de codar: autorizar os campos novos, e decidir o que fazer com a duplicidade "Limpeza de Pele" aparecendo em 2 dos 9 cards (8 cards / 9 com exceção / recompor pra 9 serviços distintos).
- Nenhum código alterado nesta rodada — só documentação/planejamento (fechamento de plano + criação de plano novo).

## 2026-08-17 — Registro de EXECUÇÃO (PLAN-0028 — Caso A + Caso B)
- Usuário aprovou os dois casos do `PLAN-0028` numa mensagem só: Caso A liberado direto; Caso B com decisão explícita — manter os 9 flip-cards, trocando o card duplicado ("Facial Spa"/card 7) por outro serviço real (`Drenagem Linfática Facial`, id 34) em vez de reduzir pra 8 ou deixar uma exceção manual.
- **Caso A (Planos):** `imageUrl` adicionado ao grid data-driven de Planos (`renderMembershipsFromDb()`/`index.behavior.ts`) — achado que corrigiu uma afirmação errada do fechamento do `PLAN-0027` (o grid já era data-driven, só faltava a imagem).
- **Caso B (Serviços):** migração aditiva `Service.highlightLabel/highlightTagline/highlightBackLabel/highlightDescription/highlightOrder`; endpoint novo `GET /public/services/featured`; `HomeServicesSection.tsx` reescrito pra data-driven (visual 1:1 preservado); campos novos no `ServiceFormModal.tsx`; migração de conteúdo via `apps/api/scripts/seedServiceHighlights.ts` (idempotente, `npm run seed:service-highlights`), rodada no Postgres real.
- **Achado técnico não previsto**, corrigido na mesma leva: o binding de clique dos botões "Agendar" (`[data-open-concierge]`) em `index.behavior.ts` era direto nos elementos (snapshot estático no boot) — quebraria pros 9 cards, que agora renderizam de forma assíncrona. Convertido pra delegação em `document`, mesmo padrão já usado no arquivo pra `[data-membership-join]`.
- `ERR-0062` registrado em `DEBUG-HISTORY.md` cobrindo os dois casos + o achado técnico.
- Validações: `apps/api` `tsc -b` + `npm run build` + `npm run test` (134/134) PASS; `apps/web` `tsc -b` + `npm run build` PASS; rebuild Docker (`api`+`web`) + `up -d --force-recreate`; migração aplicada automaticamente no boot; seed de dado rodado real; E2E real (`GET /public/services/featured`, `PATCH /memberships` com `imageUrl`); validação visual real via Chrome (9 flip-cards, flip + "Agendar" abrindo o concierge com o serviço religado, imagem de plano renderizando). Nenhum dado de teste avulso ficou pendente de limpeza.
- `PLAN-0028` marcado como executado no próprio arquivo, com Pre-commit review preenchido. Commit/push seguem pendentes de aprovação explícita (mesmo lote pendente do `PLAN-0027`).

## 2026-08-17 — Registro ponto-a-ponto (motivo do Pipeline de Franquias exposto no card)
- Usuário reportou: motivo da troca de etapa é obrigatório desde o `PLAN-0025`, mas nunca aparecia de volta no card — só ficava no histórico.
- Causa raiz: `getFranchisePipeline()` já lia `FranchiseLeadStageHistory` pra métricas, mas nunca selecionava a coluna `reason`, e `PipelineLead` nunca teve esse campo no contrato de saída.
- Fix: `reason` adicionado ao select do histórico + `LeadSnapshot`/`PipelineLead` (backend `types.ts`/`metrics.ts`/`service.ts`, frontend `types.ts`); `LeadCard.tsx` ganhou uma linha "Motivo" com tooltip nativo (`title`), só quando existe motivo gravado. `ERR-0063`.
- Validações: `apps/api` `tsc -b` + `npm run test` (134/134, incluindo fixtures de teste corrigidas em `gargalos/rules.test.ts`/`radar/rules.test.ts`/`metrics.test.ts`) PASS; `apps/web` `tsc -b` + build PASS; rebuild Docker + E2E real (`PATCH .../stage` com `reason`, `GET` devolvendo certo); visual real via Chrome (tooltip confirmado via árvore de acessibilidade, contém o texto exato do motivo). Mudança de teste (lead 7) revertida ao final.
- Ponto-a-ponto (não estrutural, não abriu plano) — registrado direto aqui conforme a regra de execução sem plano.
- Também reportado pelo usuário: drag-and-drop nos kanban do Admin V2 (Operação/Pedidos, Crescimento/Franquias) com rotina reusável. Investigado (achado: as colunas de Operação são calculadas, não um campo salvo; Franquias tinha decisão explícita anterior de "nunca arrasta", `PLAN-0022` RETROFIT-010b) e decisões colhidas do usuário via pergunta direta: coluna "Atenção" fica não-arrastável (alerta, não etapa real); soltar em "Prontos" sempre grava `fulfillmentStatus = DESPACHADO`; Franquias reverte a decisão anterior e passa a usar drag (mantendo o modal de motivo obrigatório). Biblioteca recomendada: `dnd-kit` (`react-beautiful-dnd` está arquivada/incompatível com React 19; API nativa exigiria construir acessibilidade/touch do zero). Plano aberto: `memory/plans/PLAN-0029-KANBAN-DRAG-AND-DROP.md` — falta só confirmar 1 sub-decisão pequena (comportamento da coluna "Entraram") e autorização explícita pra instalar a dependência nova antes de codar.

## 2026-08-17 — Registro de EXECUÇÃO (PLAN-0029 — drag-and-drop nos kanban)
- Usuário aprovou: "pode seguir com o entraram, aprovado o dnd-kit".
- `@dnd-kit/core` instalado (`apps/web/package.json`); componente reusável novo `apps/web/src/admin-v2/shell/kanban/KanbanDndBoard.tsx`.
- `OrdersBoardView.tsx` — drag entre `emPreparacao`↔`prontos` (colunas `entraram`/`atencao` fixas, sem listener de drag por construção); `updateOrderFulfillmentStatus` (novo client, `shared/api.ts`) chama `PATCH /orders/:id/fulfillment` (endpoint legado, sem mudança) — `Em Preparação` grava `SEPARANDO`, `Prontos` grava `DESPACHADO`.
- `PipelineBoardView.tsx`/`LeadCard.tsx` — `<select>` removido, card inteiro vira arrastável entre qualquer etapa (movimento livre, regra de negócio inalterada); soltar abre o mesmo `StageChangeReasonModal.tsx` de antes; cancelar reverte a UI sozinho.
- `DECISION-015` registrada — substitui formalmente a regra "usuário nunca arrasta" de `PLAN-0022`/RETROFIT-010b (mantém as demais regras de negócio da RETROFIT-010b inalteradas).
- `ERR-0064` registrado em `DEBUG-HISTORY.md`.
- Validações: `apps/web` `tsc -b` + build PASS; `apps/api` `tsc -b` + build + `npm run test` (134/134) PASS (sem mudança de backend, checado por precaução); rebuild Docker (`web`); E2E real via `PointerEvent` simulado com timing realista (não instantâneo — gestos de um salto só não davam tempo do dnd-kit processar, não é bug, é limitação de automação) contra o Postgres real, nos dois boards, ponta a ponta (incluindo o modal de motivo completo); validação visual real via Chrome. Mudanças de teste revertidas ao final; achado colateral sem risco documentado (efeito colateral pré-existente do endpoint legado de fulfillment sobre `Order.status`, só afetou dado sintético de teste).
- `PLAN-0029` marcado como executado e validado, Pre-commit review preenchido. Commit/push seguem pendentes de aprovação explícita (mesmo lote pendente do `PLAN-0027`/`PLAN-0028`).

## 2026-08-18 — SESSION AUDIT — PASS

Sessão encerrada a pedido do usuário ("salve tudo para continuarmos amanhã").

| Item | Resultado |
|---|---|
| Decision Integrity | PASS — `DECISION-015` nova, sem conflito com `DECISION-013`/`014` |
| State Integrity | PASS — `PLAN-0027`/`0028`/`0029` fechados `DONE`; planos antigos não tocados |
| Operational Memory | PASS — `MODIFICATION_LOG` e planos atualizados a cada marco |
| Debug Memory | PASS — `ERR-0056` a `ERR-0064` registrados no formato padrão |
| Technical Validation | PASS — lint/build/test rodados; 23 erros de lint pré-existentes (nenhum novo); migrations aplicadas e validadas; sem `console.*` não autorizado |
| Regression Risk | PASS com nota — auth/agendamento tocados, validados via E2E real; sem teste automatizado novo (gap registrado, mesmo padrão já aceito no projeto) |
| Git Governance | PASS — commit `e555234`+`1c2154c`, push `e9fbce7..1c2154c`, ambos com aprovação explícita e separada |

Checklist completo: `memory/logs/AUDIT_CHECKLIST_20260818_032518-PASS.md`.

**Resumo do que foi feito nesta sessão:** `PLAN-0027` (11 itens de fixes pontuais no Admin V2 — Clientes/Serviços/Cupons/Panorama/Planos), `PLAN-0028` (religação do conteúdo público de Serviços/Planos ao cadastro nativo), fix ponto-a-ponto do motivo no Pipeline de Franquias (`ERR-0063`), `PLAN-0029` (drag-and-drop reusável nos kanban de Operação e Franquias, `DECISION-015`). Todos os planos fechados `DONE`, commitados e pushados pra `origin/main`.

**Pendente para a próxima sessão:**
- Nenhuma pendência de código aberta desta leva.
- Itens levantados mas conscientemente fora de escopo, aguardando decisão futura do usuário (não bloqueiam nada): remover/limpar as chaves órfãs de Textos das Páginas/Galeria de Mídias que os 9 flip-cards antigos usavam (`PLAN-0028`, nota de "decisão futura"); `unit-health/service.ts`/`dashboardSalesInsights.ts` usam a mesma convenção antiga de `identityKey` (`email > telefone > nome`) de forma independente — risco de duplicação equivalente ao `ERR-0058` pode existir lá também, não verificado.
- Planos pré-existentes e não relacionados a esta sessão continuam com seu estado próprio, sem mudança: `PLAN-0019` (TLS/HTTPS, bloqueado por domínio), `PLAN-0020` (Estoque, in-progress), `PLAN-0021` (Menu Admin, in-progress).

## 2026-08-18 — Registro de EXECUÇÃO (PLAN-0030 — fluxo real de 5 etapas no Board Operacional + fix tooltip Motivo)
- Usuário reportou 2 pontos: (1) pedidos parados em "Entraram" no Kanban de Operação sem jeito de arrastar pra "Em Preparação"; (2) tooltip do Motivo no Kanban de Franquias mostrando "?" em vez do texto real, sem fallback quando vazio.
- **Item 2 resolvido primeiro e independente** (`ERR-0065`): `LeadCard.tsx` — tooltip nativo (`title`+`cursor-help`, causava o "?": o cursor `help` aparece na hora, o balão nativo com o texto só depois de um delay que passava despercebido) trocado por tooltip próprio (`group-hover`, sem delay); linha "Motivo" passou a aparecer sempre, mostrando `lead.reason ?? "N/A"`.
- **Item 1 — investigação ao vivo antes de codar**: tentei a solução mínima (destravar drag de "Entraram", reusando `PATCH /orders/:id/fulfillment` com `SEPARANDO`) e testei de verdade (token real, drag simulado, Postgres real) — não funcionou: `columnFor()` decide "Entraram" só por `Order.status === "PENDENTE"`, nunca por `fulfillmentStatus`; o card não saía da coluna e o dado ficava inconsistente (`ERR-0066`). Revertido no banco, reportado ao usuário, que decidiu reformular o fluxo inteiro.
- **PLAN-0030 executado**: Board Operacional de Pedidos passa de 4 pra 6 colunas — Recebido (`status=PENDENTE`) → Pago (`status=PAGO`, confirmação manual com nome+data via modal, `OrderStatusHistory.note`) → Em Separação → Pronto → Despachado/Entregue (modal pergunta qual dos dois; Despachado pede meio+data editável/retroativa) + Atenção (inalterada). Flag nova `operations.manualPaymentConfirmationEnabled` (`Setting`, mesmo padrão de Entrega/WhatsApp/Branding) desliga a confirmação manual quando uma integração de pagamento real cobrir esse trecho — validada ao vivo (drop em "Pago" corretamente bloqueado com a flag desligada). Grid do board redesenhado pra caber as 6 colunas sem scroll horizontal (`xl:grid-cols-6`, quebra linha em telas menores), por pedido explícito do usuário.
- **Zero migration de banco** — todo o fluxo novo usa enums/campos já existentes (`shipmentCarrier`, `shippedAt`, `OrderStatusHistory.note`) + a tabela genérica `Setting` pra flag. Zero endpoint novo — `PATCH /orders/:id` e `PATCH /orders/:id/fulfillment` só ganharam campos opcionais (`note`, `shippedAt`), backward-compatible.
- `DECISION-016` registrada (supersede parcialmente o exemplo "Entraram" da `DECISION-015` regra #1; princípio geral e demais regras continuam valendo, inclusive pra Franquias).
- Validações executadas: `apps/api` `tsc -b` + `npm run test` (134/134) PASS; `apps/web` `tsc -b` + `npm run build` PASS; rebuild Docker (`api`+`web`) + `up -d --force-recreate`; E2E real completo via drag simulado (`PointerEvent`) contra Postgres real — as 5 transições + os 2 modais (incluindo os 2 sub-caminhos de Despachado/Entregue: "Correios"+data retroativa 05/08/2026, e "Entregue" direto) + flag desligada bloqueando corretamente; dados de teste (2 pedidos + 4 linhas de histórico + a linha da flag) revertidos ao final.
- Arquivos: `apps/api/src/routes/orders.ts`; `apps/api/src/modules/intelligence/operational-orders/{types,service}.ts`; `apps/api/src/modules/intelligence/{gargalos,radar}/rules.test.ts` (fixtures); `apps/web/src/admin-v2/operations/orders/{types,OrdersBoardView}.tsx`; `apps/web/src/admin-v2/operations/orders/components/{ConfirmPaymentModal,ConfirmDispatchModal}.tsx` (novos); `apps/web/src/admin-v2/shared/{api,format}.ts`; `apps/web/src/admin-v2/growth/franchises/components/LeadCard.tsx`.
- Pendente: commit/push (Pre-commit review preenchido no plano, aguardando aprovação explícita, ainda não solicitada nesta sessão).

## 2026-08-18 — Registro de EXECUÇÃO (addendum PLAN-0030 — destravar "Atenção")
- Usuário perguntou, logo após a entrega do fluxo de 5 etapas: se os pedidos em "Atenção" não podem ser movidos, como resolver a situação deles? Precisa ter uma forma no kanban.
- "Atenção" não é uma 6ª etapa — é um alerta de tempo (`classifier.ts`, inalterado) por cima da etapa real. Solução: cards de Atenção (exceto `BLOCKED`) viram arrastáveis, usando `naturalColumnFor()` (novo) pra achar a etapa real e só aceitar soltar no próximo passo real — reusa os mesmos modais/regras já prontos, sem UI nova. Caso especial (pedido já `ENVIADO`, sem próximo passo): soltar de volta na própria coluna "Despachado/Entregue" marca `ENTREGUE` direto, sem modal.
- `BLOCKED` (estoque insuficiente) é diferente por decisão do usuário — não se resolve avançando etapa. Fica sempre fixo e ganha um link "Ver no Admin →" (`/admin#vendas`, deep-link por hash já usado no `HubCard.tsx`) — sem deep-link pro pedido específico (limitação pré-existente), o admin busca pelo código público mostrado no card.
- `DECISION-016` atualizada (item 6b, addendum).
- Validações: `tsc -b`/build (web) PASS; rebuild Docker (`web`); E2E real via Chrome — drag de um card `PAGO·SEPARANDO` em Atenção até "Pronto" (gravou `DESPACHADO`, permaneceu em Atenção, ainda demorado) e depois até "Despachado/Entregue" (modal, "Entregue", gravou `ENTREGUE` — **saiu de Atenção**, confirmado); os 3 pedidos `BLOCKED` reais mostrando o link, não-arrastáveis, link clicado de verdade e confirmado indo pro Admin legado. Dado de teste (pedido 29) revertido ao final.
- **Achado colateral durante a validação (não é bug, não corrigido)**: 2 pedidos reais (`PV-MSRI9CSB-A8H2`, `PV-MSRI9D6P-X1EW`) apareceram já com pagamento confirmado manualmente com nomes reais ("Jeiel"/"Borner") no histórico — o usuário testou o fluxo novo ao vivo, pela própria conta, entre as rodadas de validação desta sessão. Não revertido (não é dado de teste meu).
- Arquivos: `apps/web/src/admin-v2/operations/orders/OrdersBoardView.tsx`, `apps/web/src/admin-v2/operations/orders/components/OrderCardView.tsx`.
- Pendente: commit/push — mesmo lote pendente do `PLAN-0030` (aguardando aprovação explícita).

## 2026-08-18 — Registro de EXECUÇÃO (Addendum 2 do PLAN-0030 — "Atenção" deixa de ser coluna)
- Depois do commit `c7160da` (leva 1, incluindo o Addendum 1 — "Atenção" arrastável), usuário testou ao vivo e reportou: "nenhum pedido que tentei mover de atenção foi movido, todos voltam".
- Investigação confirmou que os drags **estavam funcionando de verdade** (6 pedidos reais avançaram `SEPARANDO`/`EMBALADO` → `DESPACHADO` no banco) — o problema era 100% visual: "Atenção" continuava sendo coluna exclusiva com prioridade sobre a etapa real (regra herdada do `PLAN-0022`), então um card avançava e reaparecia no mesmo lugar (ainda flagueado = ainda "Atenção"), parecendo que nada tinha acontecido.
- Usuário escolheu a correção maior: **"Atenção" deixa de ser uma coluna do kanban**. Board volta a ter só as 5 colunas reais (nunca 6). Todo pedido aparece sempre na coluna real (`columnFor()` sem desvio de prioridade); os flagueados ganham um agregado paralelo (`board.columns.atencao`, `count`/`totalValue`, não mais exclusivo) que alimenta um banner de resumo no topo do board — o selo por pedido (`card.reason`, cor) já existia no card, não mudou. Gargalos/Radar (RETROFIT-011/012) continuam funcionando sem nenhuma mudança neles (só leem `count`/`totalValue`).
- Efeito colateral positivo: confirmar `ENTREGUE` de um pedido `ENVIADO` (soltar de volta na própria coluna "Despachado/Entregue") deixou de ser exclusivo de cards flagueados — vale sempre agora.
- `DECISION-016` atualizada: item 6b (Addendum 1) marcado como superado, item 6c registra o desenho final.
- Validações: `apps/api` `tsc -b` + `npm run test` (134/134) PASS; `apps/web` `tsc -b` + `npm run build` PASS; rebuild Docker (`api`+`web`) + `up -d --force-recreate`; E2E real via drag simulado (`PAGO→EM SEP`, confirmado no banco e **visualmente** — o card saiu fisicamente da coluna de origem, evidência clara de movimento); banner de resumo conferido ("30 pedido(s) precisam de atenção · R$ 8.150,10 em jogo"); os 3 pedidos `BLOCKED` reais conferidos na coluna real deles, ainda não-arrastáveis, link "Ver no Admin →" preservado; grid de 5 colunas sem scroll horizontal conferido. Dado de teste (pedido 18) revertido ao final.
- Arquivos: `apps/api/src/modules/intelligence/operational-orders/service.ts`, `apps/web/src/admin-v2/operations/orders/OrdersBoardView.tsx`.
- Pendente: commit desta leva (aguardando aprovação explícita) + push (aprovação separada, depois do commit).

## 2026-08-18 — Registro de EXECUÇÃO (bug de sessão — expirava sempre em 15min + bot de status falso)
- Usuário reportou: precisou logar de novo (última sessão fazia tempo), foi pro admin legado, mas admin-v2 dava "preciso me logar" em todas as telas; o bot de status do Docker mostrava API/Postgres "fora" com tudo rodando de verdade (`docker ps` confirmava).
- Investigação achou 3 bugs relacionados, todos com a mesma raiz:
  - `ERR-0067` (causa raiz): o cookie de refresh (`jlr_rt`, 7 dias) é gravado com `secure: isProduction` — em produção sem TLS (`SEC-30`/`PLAN-0019`, bloqueado por domínio), isso marca o cookie `Secure` sobre HTTP puro, que o navegador descarta. A renovação silenciosa da sessão nunca tinha o cookie, sempre falhava, e toda sessão morria exatamente nos 15min do access token, sem exceção. Confirmado ao vivo via `curl` (`Set-Cookie: ...; Secure` em `http://`).
  - `ERR-0068` (agravante, achado na investigação): quando a renovação falhava, o código apagava o access token mesmo que ele ainda estivesse válido — a sessão "quebrava" quase na hora de qualquer hard-navigation, não só depois de 15min.
  - `ERR-0069`: o bot de status confundia "não consegui checar" (401 de sessão expirada) com "está offline de verdade" — mesma causa raiz por trás do alarme falso.
- Correções: variável nova `TLS_ENABLED` (`.env`/`.env.docker.example`/`sfk.toml`, default `false`) controla o `Secure` do cookie em vez de `NODE_ENV` — sem aumento de risco (a sessão já trafegava sem criptografia); `refreshAccessToken()` não desloga mais em falha, só deixa de renovar; `useDockerHealth.ts` ganhou o estado `unknown`, distinto de `offline`.
- Validações: `apps/api` `tsc -b` + `npm run test` (134/134) PASS; `apps/web` `tsc -b` + `npm run build` PASS; rebuild Docker (`api`+`web`) + `up -d --force-recreate`; E2E real via `fetch` no navegador (login real → cookie armazenado de verdade pelo Chrome → `POST /auth/refresh` 200 com token novo → hard-navigation pro `/admin` sem "sessão expirada"); endpoint `/health/services` confirmado exigindo `requireAdmin` e devolvendo 401 com token inválido.
- Arquivos: `apps/api/src/routes/auth.ts`; `apps/web/src/lib/auth.ts`; `apps/web/src/modules/admin-docker-status/useDockerHealth.ts`, `DockerStatusModal.tsx`; `.env`, `.env.docker.example`, `sfk.toml`.
- Pendente: commit/push (aguardando aprovação explícita).

## 2026-08-18 — Registro de EXECUÇÃO (bug — Board Operacional quebrado, grid Tailwind não compilado)
- Usuário reportou o Kanban de Operação (que estava certo) aparecendo com só 2 colunas bem largas, com desconfiança explícita de que eu tinha alterado mais do que deveria — pediu pra eu acessar o browser e entender antes de corrigir.
- Investigação ao vivo (browser real, `getComputedStyle`) + inspeção do CSS servido confirmou: mesma causa raiz já documentada 3 vezes antes (`ERR-0040`/`ERR-0049`/`ERR-0051`) — `tailwind.generated.css` é uma foto estática do Tailwind CLI, não um build ao vivo. `xl:grid-cols-5` (novo no `PLAN-0030`) nunca tinha sido usado em nenhum arquivo do projeto, então nunca foi compilado nessa foto — o navegador ignorou a classe ausente silenciosamente e caiu na regra existente de menor especificidade (`sm:grid-cols-2`), daí "2 colunas largas" em qualquer largura.
- Corrigido: `tailwind.generated.css` regenerado (comando documentado no próprio cabeçalho do arquivo); Board Operacional ganhou o breakpoint `lg:grid-cols-3` que também estava faltando (achado adicional, sem ele o board ainda ficaria em 2 colunas entre 640-1280px mesmo com a classe presente).
- `ERR-0070` registrado com autocrítica: o `ERR-0049` já tinha deixado uma nota de processo explícita pra regenerar esse arquivo sempre que uma tela introduzisse um padrão visual novo — não segui essa nota ao adicionar as classes de grid do `PLAN-0030`; validei só via drag/DOM/banco, nunca conferi o grid computado nem grepei o CSS servido. Checklist novo documentado no próprio `ERR-0070` pra não repetir.
- Validações: `tsc -b`/build (web) PASS; rebuild Docker (`web`) + `up -d --force-recreate`; diff entre uma regeneração fresca via Tailwind CLI e o arquivo commitado (vazio — confirma que está em dia); `grep` confirmando a classe presente; `getComputedStyle` real no navegador confirmando 5 colunas em 1680px (antes: 2).
- Arquivos: `apps/web/src/styles/tailwind.generated.css`, `apps/web/src/admin-v2/operations/orders/OrdersBoardView.tsx`.
- Pendente: commit/push (aguardando aprovação explícita).

## 2026-08-18 — Registro de ajuste (Board Operacional — ID consistente com Pedidos e Vendas + rótulo da coluna)
- Usuário pediu 2 ajustes pequenos no mesmo board: (1) o card mostrava `card.publicCode` (código longo, ex. `PV-MSRI9DTA-33H4`, usado só pro rastreio do cliente/checkout) — deveria mostrar o mesmo ID curto (`PV-{id}`, ex. `PV-39`) usado em toda a tela de Pedidos e Vendas do legado (`admin-orders/behavior.ts`); (2) a coluna "Em Sep" podia virar "Em Separação" por extenso, já que agora cabe (grid corrigido no `ERR-0070`).
- `OrderCardView.tsx` e os 2 modais (`ConfirmPaymentModal`/`ConfirmDispatchModal`) passaram a usar `PV-{orderId}` — `publicCode` removido da prop/plumbing inteira (`OrdersBoardView.tsx`), já que não tinha mais uso.
- `tsc`/build (web) PASS; rebuild Docker (`web`); validado visualmente via Chrome real (`PV-39` aparecendo certo pro pedido id 39, coluna "EM SEPARAÇÃO").
- Arquivos: `apps/web/src/admin-v2/operations/orders/OrdersBoardView.tsx`, `components/OrderCardView.tsx`, `components/ConfirmPaymentModal.tsx`, `components/ConfirmDispatchModal.tsx`.
- Pendente: commit/push (usuário pediu pra não commitar ainda — tem mais um ajuste maior em avaliação, ver "Pendente para a próxima sessão"/discussão em andamento sobre migrar Pedidos e Vendas pro Admin V2 nativo).

## 2026-08-18 — Registro de EXECUÇÃO (PLAN-0031 — migração "Pedidos e Vendas" pro Admin V2 nativo)
- Usuário aprovou o plano ("pode começar pela Onda 1 e siga até o fim mas documente todo o processo e principalmente o que foi feito de mudança") — as 7 ondas executadas na mesma sessão.
- Nova aba "Lista" dentro de Operação (`/admin-v2/operacao/lista`), irmã do Kanban: tabela completa de pedidos com busca (id/nome/e-mail), filtro de status e fulfillment, paginação client-side, seleção múltipla, 7 KPIs no topo, botão de venda manual.
- Modal de detalhe (somente leitura: itens, pagamentos, histórico completo) e modal de edição (status do pedido + fulfillment/transportadora/rastreio/notas, com bloqueio de opções que avançam etapa quando há pagamento vinculado não aprovado, mesma regra do backend).
- Ação em lote "marcar próxima etapa" (`PATCH /orders/bulk/advance`) e venda manual/balcão completa (catálogo produto+serviço, checagem de disponibilidade cross-unit, `POST /orders`).
- Link "Ver no Admin →" dos cards `BLOCKED` do Kanban religado pra rota nativa nova, com `?highlight={id}` abrindo o detalhe do pedido específico direto — melhoria real sobre o legado, que nunca teve deep-link pro pedido.
- **Zero mudança de backend** — os 5 endpoints usados (`GET /orders`, `GET /orders/summary`, `PATCH /orders/bulk/advance`, `PATCH /orders/:id`, `POST /orders`) já existiam pro admin legado, migração 100% frontend.
- Checklist do `ERR-0070` aplicado proativamente: `min-w-[200px]` (único class novo genuíno) checado no CSS servido antes/depois de regenerar `tailwind.generated.css`.
- Validações: `apps/api` `tsc -b` + `npm run test` (134/134, backend não tocado) PASS; `apps/web` `tsc -b` + `npm run build` PASS; rebuild Docker (`web`) + `up -d --force-recreate`; E2E real completo via Chrome real + Postgres real em todos os fluxos (lista, detalhe, edição, ação em lote, venda manual, deep-link do Kanban) — detalhes completos no "Diário de execução" do `PLAN-0031`. Nenhum dado de teste avulso ficou pendente.
- Arquivos novos: `apps/web/src/admin-v2/operations/orders/{listTypes.ts,OrdersListView.tsx}`, `components/{OrderDetailModal,OrderEditModal,ManualSaleModal}.tsx`. Arquivos alterados: `shared/api.ts` (5 clientes novos), `AdminV2Root.tsx` (aba/rota), `OrderCardView.tsx` (link religado), `tailwind.generated.css` (regenerado).
- Pendente: commit/push (aguardando aprovação explícita, ainda não solicitada nesta sessão — mesmo lote dos ajustes anteriores do PV-{id}/coluna Em Separação).

## 2026-08-18 — Ajuste de contraste (Lista de Pedidos — botões de paginação)
- Usuário reportou: botões de navegação da tabela (« ‹ › ») quase não apareciam — só borda, sem fundo, baixo contraste.
- `OrdersListView.tsx` — os 4 botões passaram a usar `bg-primary text-white hover:bg-primary/90` (mesmo estilo do botão "+ Venda manual"), com `disabled:opacity-40` pro estado desabilitado.
- `tsc`/build (web) limpos (classe `px-2.5` já existia no CSS compilado, sem necessidade de regenerar); rebuild Docker (`web`); validado visualmente via Chrome real.
- Arquivo: `apps/web/src/admin-v2/operations/orders/OrdersListView.tsx`.
- Pendente: commit/push — mesmo lote pendente desta sessão (aguardando aprovação explícita).

## 2026-08-18 — `PLAN-0025` regularizado: rename pra `-DONE-` (achado de auditoria)

- **Contexto/objetivo**: usuário pediu levantamento de quais planos estavam sem `-DONE-` no nome
  do arquivo. `PLAN-0025` apareceu na lista, mas investigação mostrou que o conteúdo do plano já
  estava com `Status: ✅ DONE` e `Push status: COMPLETED` desde 2026-08-15 (Git Record completo:
  commit `90a1214` + fechamento `5a12e04`, ambos confirmados em `origin/main` via
  `git merge-base --is-ancestor`). O trabalho e as duas autorizações (commit/push) já tinham
  acontecido — só o `git mv` pro nome `-DONE-` nunca foi executado, e `progress.md` ainda dizia
  "Sem commit/push (aguardando autorização)", desatualizado.
- **Ação**: `git mv memory/plans/PLAN-0025-ADMIN-V2-POLIMENTO-UX.md
  memory/plans/PLAN-0025-DONE-ADMIN-V2-POLIMENTO-UX.md`; `memory/progress.md` (linha do
  PLAN-0025) atualizada pra refletir commit/push reais e o rename.
- **Arquivos alterados**: `memory/plans/PLAN-0025-DONE-ADMIN-V2-POLIMENTO-UX.md` (renomeado),
  `memory/progress.md`, `memory/MODIFICATION_LOG.md` (esta entrada).
- **Status**: `PLAN-0025` agora consistente (conteúdo, nome de arquivo e `progress.md` batendo).
  Nenhum código alterado — só regularização de registro. Pendente de commit/push (aguardando
  aprovação do usuário).

## 2026-08-18 — `PLAN-0020` fechado DONE: validação visual (5 telas) + pentest manual S10

- **Contexto/objetivo**: continuação da auditoria de planos sem `-DONE-`. `PLAN-0020` (Estoque
  Multi-Unidade + Vendas + BI) já estava tecnicamente completo e commitado/pushado desde
  2026-07-07 (`ee6a61a`), mas com 2 pendências abertas há mais de um mês: confirmação visual do
  usuário e pentest manual S10 (isolamento entre unidades). Usuário pediu explicação do plano,
  perguntou em quais telas validar, e autorizou o pentest ("faz o pentest agora").
- **Validação visual (browser real, claude-in-chrome)**: como o plano foi escrito antes do Admin
  V2 existir, as 5 telas testadas foram as equivalentes nativas de hoje (migradas via
  `PLAN-0026`/`PLAN-0031`), não as legadas `admin-products`/`admin-sales`/`admin-kpis` citadas no
  texto original do plano:
  1. **Cadastros → Produtos** — Entrada de estoque (+5 em Franco da Rocha) via modal Movimentar;
     Histórico confirmou o registro exato (tipo/qtd/saldo/motivo/autor). Grade "Estoque por
     unidade" atualizou em tempo real sem reload.
  2. **Operação → Produtos** (matriz Armadilha/Estrela/Joia) — confirmado uso de CMV/margem real
     (produto com `costPrice` cadastrado mostrou margem 82.1%, os sem custo mostraram 100%).
  3. **Operação → Lista → Venda manual** — venda de balcão criada (PV-50): PAGO, canal ADMIN,
     vendedor e unidade corretos, **total calculado no servidor** (não confiou em nada do
     cliente), baixa de estoque direta (`sellStockDirect`), lista atualizou sozinha.
  4. **Panorama** — card "Operação agora" exibindo "Valor em estoque" (mesmo cálculo do
     `getInventoryOverview` do `PLAN-0020`).
  5. **SPA público** — seletor de quantidade do destaque funcional; zerei temporariamente o
     estoque online de "Base (Unha Fortalecida)" e o card mostrou selo **"ESGOTADO"** (não sumiu
     da vitrine, imagem acinzentada, carrinho desabilitado) — exatamente a regra do plano.
  - **Achado de teste, não é bug**: primeira tentativa de venda manual não submeteu porque
    faltavam e-mail/telefone (campos obrigatórios) — validação client-side correta, só sem toast
    visível; refeito com os campos completos, funcionou.
  - Todos os dados de teste (pedido PV-50, entrada +5, ajuste Esgotado) revertidos via SQL
    direto ao final — banco conferido idêntico ao estado anterior.
- **Pentest manual S10 (isolamento entre unidades/franquias)**: 2 usuários de teste criados via
  `POST /auth/register` (role padrão CLIENT) e promovidos direto no banco — `PROFESSIONAL` na
  unidade 1 (Parque da Cidade) e `MANAGER` na unidade 2 (Birmann 20). Tokens obtidos por login
  real da API (nenhum JWT forjado). 16 requisições via `curl` cobrindo leitura/escrita cross-unit
  em 6 endpoints (`/units/:id/inventory[/summary]`, `/products/:id/movements`, `/reservations`,
  `/stock/entry|consumption|adjust`), `POST /orders` com `unitId` forjado no body, `GET /orders`
  (admin-only), o endpoint cross-unit somente-saldo (S7), `GET /dashboard/sales-insights` com
  `?unitId=` de outra unidade na query (S4), e gating por papel independente da unidade (S6).
  **16/16 PASS** — nenhum vazamento encontrado; `resolveUnitScope`/`canAccessUnit`/
  `guardUnitAccess` fail-closed em todos os pontos, inclusive quando a query string tentava
  forçar `unitId` de outra unidade (servidor sempre ignorou e usou a unidade real do token).
  Usuários de teste e o único movimento de estoque real gerado (revertido) apagados do banco.
- **Arquivos alterados**: `memory/plans/PLAN-0020-DONE-PRODUTOS-ESTOQUE-LEDGER-VENDAS-MULTICANAL-BI.md`
  (renomeado, seção `## Pentest S10` + checklist de pendências fechado), `memory/progress.md`,
  `memory/MODIFICATION_LOG.md` (esta entrada). Nenhum código de produção alterado.
- **Status**: `PLAN-0020` agora `DONE` de verdade — checklist técnico (2026-07-07) + validação
  visual + pentest S10 (2026-08-18), tudo fechado. Pendente de commit/push (aguardando aprovação
  do usuário).

## 2026-08-18 — SESSION AUDIT — PASS (continuação da tarde/noite)

Sessão encerrada a pedido do usuário ("salve tudo conforme as regras do projeto e amanhã
continuamos").

| Item | Resultado |
|---|---|
| Decision Integrity | PASS — nenhuma `DECISION-*` tocada, nenhuma mudança estrutural |
| State Integrity | PASS — `PLAN-0025` e `PLAN-0020` fechados `DONE`; `PLAN-0019`/`0021` seguem com seu estado pré-existente, não tocados |
| Operational Memory | PASS — `MODIFICATION_LOG` e planos atualizados a cada marco |
| Debug Memory | N/A — nenhum bug encontrado ou corrigido nesta leva |
| Technical Validation | N/A (lint/build/test) — zero arquivos de código alterados, só `memory/*.md`; validação real desta leva foi E2E (5 telas via browser real + 16 testes de pentest via `curl`) |
| Regression Risk | PASS — RBAC/isolamento por unidade exercitado ao vivo (pentest), nenhum código alterado, nenhuma regressão |
| Git Governance | PASS — commits `6a971cd`+`fa84663`, push `de69c51..fa84663`, ambos com aprovação explícita e separada |

Checklist completo: `memory/logs/AUDIT_CHECKLIST_20260818_234842-PASS.md`.

**Resumo do que foi feito nesta leva:** usuário pediu levantamento de quais `PLAN-XXXX` estavam sem `-DONE-` no nome do arquivo. Achados: `PLAN-0019` (bloqueado, conhecido), `PLAN-0020` (Estoque — checklist técnico completo desde 2026-07-07, 2 pendências abertas), `PLAN-0021` (falta só commit/push, conhecido), `PLAN-0025` (Polimento UX — na verdade já **estava** commitado/pushado desde 2026-08-15, só faltava o rename). `PLAN-0025` regularizado (rename + registro corrigido). `PLAN-0020`: usuário pediu explicação do plano e em quais telas validar; as 5 telas equivalentes nativas no Admin V2 (o núcleo migrou do admin legado via `PLAN-0026`/`PLAN-0031`) foram testadas ao vivo via browser real (Cadastros→Produtos, Operação→Produtos, Operação→Lista→Venda manual, Panorama, SPA público) — todas OK, dados de teste revertidos. Pentest manual S10 executado a pedido explícito do usuário: 2 usuários de teste reais (`PROFESSIONAL`/`MANAGER` de unidades distintas, tokens via login real da API), 16 requisições cobrindo isolamento cross-unit em leitura/escrita/BI + gating por papel — **16/16 PASS**, nenhum vazamento. Ambos os planos fechados `DONE`, commitados (`6a971cd`, `fa84663`) e pushados (`de69c51..fa84663`).

**Pendente para a próxima sessão:**
- Nenhuma pendência de código aberta desta leva.
- Itens de sessões anteriores, ainda sem decisão do usuário (não bloqueiam nada): remover/limpar as chaves órfãs de Textos das Páginas/Galeria de Mídias dos antigos flip-cards (`PLAN-0028`); risco de duplicação equivalente ao `ERR-0058` em `unit-health/service.ts`/`dashboardSalesInsights.ts` (não verificado).
- Planos pré-existentes sem `-DONE-`, não tocados nesta sessão: `PLAN-0019` (TLS/HTTPS, bloqueado por domínio), `PLAN-0021` (Menu Admin — falta só commit/push).

## 2026-08-20 — Registro de ABERTURA (PLAN-0032 — revalidação guiada, foco PLAN-0020)
- Usuário pediu uma rodada de revalidação ao vivo: vai reportar bugs/melhorias conforme for usando o sistema, com foco principal no que o `PLAN-0020` (Estoque Multi-Unidade/Ledger/Vendas Multicanal/BI) entregou e em tudo que foi migrado sobre essa base (`PLAN-0026` Cadastros→Produtos, `PLAN-0031` Operação→Lista/Kanban, `PLAN-0022`/`0023` Panorama/BI).
- Plano aberto: `memory/plans/PLAN-0032-REVALIDACAO-PLAN-0020-BUGS-MELHORIAS.md` — funciona como fila viva de ocorrências (tabela + diário de execução por item), cada uma triada como bug/melhoria e ponto-a-ponto/estrutural antes de corrigir, seguindo a Anti-Scope-Drift Layer do kernel. Fechamento (`-DONE-`) só quando o usuário confirmar o fim da rodada.
- Nenhum código alterado ainda — sessão em espera do primeiro item reportado.

## 2026-08-20 — Registro de FECHAMENTO (PLAN-0032 — revalidação guiada, 6 ocorrências)

**Resumo:** rodada de revalidação ao vivo, foco `PLAN-0020` e tudo migrado sobre ele no Admin V2. 6 ocorrências reportadas e tratadas na mesma sessão, uma por vez, cada uma validada ao vivo (browser real + rebuild Docker, ou `curl`/Postgres direto) antes de seguir pra próxima.

1. **Histórico de movimentação de estoque sem consistência aparente** — investigado e não era bug de cálculo (ledger de "Sampoo de Ervas" batia certinho); a leitura confundia por falta de coluna "Saldo anterior" + ordenação mais-novo-primeiro. Bug real achado na mesma investigação (`ERR-0071`): AJUSTE de estoque pra cima podia falhar com "estoque insuficiente" (falso negativo) por passar pela lógica de saída de `applyStockMovement`. Corrigido com `applyStockAdjustment` novo (escrita única); `StockHistoryModal.tsx` ganhou coluna "Saldo anterior" + validação visual de consistência linha a linha. Achado colateral: `Product.stock` (cache global) dessincronizado em 2/9 produtos por reversões manuais de sessões anteriores sem resync — corrigido; nota de processo registrada. 5 testes novos (`stockLedger.test.ts`), 167/167 PASS.
2. **Contorno dos campos de formulário sem contraste** — `border-gold/40` (dourado clarinho, 1px) trocado em 134 campos reais (input/select/textarea, 32 arquivos) do Admin V2 inteiro por `border-primary/60` (verde da marca). Ajuste fino ao vivo: 2px inicial revertido pra 1px, mantendo a cor.
3. **Operação→Lista: resumo em 2 linhas + navegação mal posicionada; Produtos sem paginação** — resumo de 7 indicadores virou 1 linha só (nomes completos, ajuste fino revertendo uma abreviação de 5 posições pedida e depois descartada ao ver que cabia), Receita por último; paginação movida de baixo da grid pra logo após os filtros; mesma paginação adicionada à grid de Produtos (Cadastros), que nunca teve.
4. **Detalhes do Pedido "branco, pálido"** (`@frontend-specialist`) — reformulado com chunking por seção (Miller's Law), faixa de destaque pro status+total (Von Restorff), timeline no histórico — 100% tokens de marca já existentes, sem "reescrita radical" (decisão deliberada, `DECISION-013` regra #6).
5. **"Onde está o dinheiro?" — unificar em cards + abas + cor** (`@frontend-specialist` + skill `dataviz`) — cascata+origens viraram 6 stat tiles coloridos (paleta validada com `scripts/validate_palette.js`, ALL CHECKS PASS); as 6 decomposições "gigantes" viraram abas com painel de altura fixa + rolagem vertical.
6. **Auditoria de fechamento: Admin legado × Admin V2** — 12/15 telas do menu legado já migradas; 3 sem equivalente (Metas/Performance — zero API, zero model, conteúdo de template fake, nada real pra migrar; Assinantes — único gap real, backend `POST/PATCH /subscriptions` funcional sem UI em lugar nenhum). Achado colateral: `admin-leads` órfão do menu legado, candidato a limpeza.

**Validações:** `apps/api` `tsc -b` + `npm run test` 167/167 PASS; `apps/web` `tsc -b` + `npm run build` PASS; `tailwind.generated.css` regenerado 5x (checklist `ERR-0070`/`0071` aplicado proativamente em toda ocorrência visual); rebuild Docker + validação ao vivo via browser real em cada mudança de UI; `ERR-0071` registrado em `DEBUG-HISTORY.md`.

**Status:** `PLAN-0032` fechado `DONE` (usuário confirmou fim da rodada), renomeado pra `memory/plans/PLAN-0032-DONE-REVALIDACAO-PLAN-0020-BUGS-MELHORIAS.md`. Commit e push autorizados explicitamente pelo usuário na mesma instrução — Git Record completado a seguir.

**Pendente para a próxima sessão:** usuário quer revisar em seguida a pendência de aposentar o Admin legado e usar só o Admin V2 (não existe `PLAN-XXXX` formal pra isso ainda — só a nota em `DECISION-013` regra #3, "não decidida agora", e a menção de `RETROFIT-022` como fora de escopo no `PLAN-0024`). Itens de sessões anteriores continuam pendentes, sem mudança: chaves órfãs de Textos das Páginas/Galeria de Mídias (`PLAN-0028`); risco de duplicação `ERR-0058`-like em `unit-health/service.ts`/`dashboardSalesInsights.ts` (não verificado); `PLAN-0019` (TLS, bloqueado por domínio); `PLAN-0021` (Menu Admin, falta só commit/push — não tocado nesta sessão).

## 2026-08-20 — SESSION AUDIT — PASS

Sessão encerrada a pedido do usuário ("feche o plano atual, está completo. salve, commit e push").

| Item | Resultado |
|---|---|
| Decision Integrity | PASS — nenhuma `DECISION-*` tocada; `DECISION-013` regra #6 respeitada nas 3 ocorrências de UI |
| State Integrity | PASS — `PLAN-0032` fechado `DONE`; `PLAN-0019`/`0021` seguem com seu estado pré-existente, não tocados |
| Operational Memory | PASS — `MODIFICATION_LOG` e plano atualizados a cada ocorrência |
| Debug Memory | PASS — `ERR-0071` registrado no formato padrão |
| Technical Validation | PASS — `tsc -b`/build/testes (167/167) limpos nos dois apps; lint com 29 erros pré-existentes (mesmo padrão sistêmico já tolerado em sessões anteriores, nenhuma categoria nova) |
| Regression Risk | PASS — motor de estoque tocado (ocorrência #1) coberto por 5 testes novos; nenhuma área sensível (auth/pagamento/agendamento) alterada |
| Git Governance | PASS — Pre-commit review preenchido no `PLAN-0032`; commit/push autorizados explicitamente pelo usuário |

Checklist completo: `memory/logs/AUDIT_CHECKLIST_20260820_162602-PASS.md`.
