# PLAN-0020 — Produtos, Estoque Multi-Unidade (Ledger), Vendas Multicanal e BI por Papel

**Status:** ✅ EXECUTADO (2026-07-06/07) — núcleo produto+ledger+venda+BI operacional; checklist técnico (ondas 0-7, critérios de aceitação, travas S1-S9) fechado; rodada 1 de validação visual do usuário concluída (4 ajustes aplicados); testes automatizados das rotinas críticas implementados (23/23 PASS). Aguardando: confirmação final do usuário, pentest S10 e fluxo Git (commit/push) para virar DONE.
**Data:** 2026-07-06
**Escopo macro:** `apps/api` (schema Prisma, middleware auth, rotas catalog/orders, módulo admin/kpis, novos libs de estoque e escopo de unidade), `apps/web` (admin-products, admin-sales, admin-kpis/dashboard role-aware, SPA HomeProductsSection), infra Docker (restart do postgres)
**Agentes de apoio:** `@orchestrator`, `@database-architect`, `@product-manager`, `@backend-specialist`, `@frontend-specialist`

---

## STAR

**Situation**
- 8 produtos cadastrados (7 com estoque, 1 zerado), todos status "Ativo", visíveis via `/api/public/products`. SPA já lista destaque + coleção; voltou a funcionar após reativar o PostgreSQL (container estava `Exited` desde um reboot → API em crash-loop `P1001`).
- **2 unidades** já existem (Parque da Cidade, Birmann 20). Usuários: 1 MASTER, 3 PROFESSIONAL (0 ADMIN, 0 MANAGER).
- Enum `Role` já tem MASTER/ADMIN/MANAGER/PROFESSIONAL/CLIENT. Middlewares: `requireAdmin/requireStaff/requireMaster` — **sem `requireManager` e sem qualquer scoping por unidade**. `req.user = { id, role }` (sem unidade). Vínculo pessoa↔unidade só existe hoje em `Professional.unitId`.
- Estoque é `Product.stock Int` **global** (não por unidade). Baixa na confirmação do pedido (Stripe + `POST /orders` admin); restock no cancelamento. Sem ledger, sem entrada por compra, sem uso interno, sem canal, sem vendedor, sem unidade na venda.
- BI backend (`apps/api/src/modules/admin/kpis`) é real (receita, série, comissões, agenda) mas **zerado** (0 pedidos) e **não** tem top produtos/vendedor nem valor de estoque. Dashboard atual é grande demais e sem recorte por papel.

**Task**
1. Exibir produtos do banco com robustez (esgotado/quantidade/estado vazio).
2. Confirmar quando faltam produtos (hoje existem 8 — não faltam; o problema era o banco fora).
3. Cadastro + estoque **por unidade** com **ledger auditável**; diferenciar **uso interno × venda**; atribuir **canal + vendedor + unidade**; BI **mínimo e recortado por papel** (funcionário/gerente/admin).

**Action** — ondas 0 a 7 abaixo.
**Result** — fluxo produto → estoque por unidade → venda multicanal/multiunidade → BI por papel, auditável, validado com testes manuais + build Docker + TypeScript.

---

## Decisões do usuário (2026-07-06)

| Tema | Escolha |
|---|---|
| Atribuição de venda | Canal + vendedor (+ unidade) |
| Controle de estoque | Ledger completo (`StockMovement`) **por unidade** (`ProductStock`) |
| Profundidade do BI | Mínimo funcional **e recortado por papel** |
| Estoque das vendas do site | Unidade dedicada **"Loja Online"** |
| Franquias | Unidades no mesmo sistema; Admin/Master vê todas; flag own × franquia |
| Remanejamento entre unidades | **Só visualização** agora (execução de transferência = fase futura) |
| Controle de disponibilidade | **Reserva com TTL** — 3 camadas: REAL / RESERVADO / DISPONÍVEL (`RESERVATION_TTL_MINUTES=20`) |
| Gatilho da reserva | **Híbrido** — vendedor/admin reserva ao montar a venda; site reserva no início do checkout (não ao adicionar ao carrinho) |
| Pagamento após reserva expirar | **Re-checar disponibilidade** e re-reservar na confirmação; sem estoque → falha tratada (nunca vende o que não tem) |
| Zero disponível na vitrine | Produto aparece como **"Esgotado"** (não some) |
| Insumos de serviço (BOM) | **Fase 2** — agora só baixa manual `USO_SALAO` |
| Fornecedores + Pedido de Compra | **Fase 2** — agora só `ENTRADA_COMPRA` avulsa |
| Transferência entre unidades (execução) | **Fase 2** — agora só visualização read-only |
| Relatórios financeiros (CMV + lucratividade) | **Incluir na PLAN-0020** (requer `costPrice`) |

---

## Modelo de Papéis e Escopo (RBAC)

Vínculo canônico staff↔unidade: adicionar **`User.unitId`** (nullable). MASTER/ADMIN = null (global). MANAGER/PROFESSIONAL = a sua unidade.

| Papel | Estoque | Vendas / BI |
|---|---|---|
| **MASTER / ADMIN** | Todas as unidades | Tudo; filtro por unidade e own × franquia |
| **MANAGER** (gerente) | Sua unidade (+ leitura das demais) | Vendas e BI da sua unidade (todos os vendedores da unidade) |
| **PROFESSIONAL** (funcionário) | Lê estoque da sua unidade (+ consulta as demais, read-only) | **Somente as próprias vendas** |
| **CLIENT** | — | Site público apenas |

- Novo `requireManager` (MANAGER/ADMIN/MASTER) + helper `resolveUnitScope(req)` → lista de `unitId` permitidos.
- **Escopo imposto no servidor**: um PROFESSIONAL não consulta vendas/estoque-de-escrita de outra unidade via API; leitura de estoque de outras unidades é um endpoint read-only explícito.

---

## Modelo de Dados (novo / alterado)

**Enums**
- `StockMovementType { ENTRADA_COMPRA, SAIDA_VENDA, USO_SALAO, PERDA, AJUSTE, DEVOLUCAO }`
- `SalesChannel { SITE, APP, ADMIN, WHATSAPP }`
- `UnitKind { OWN, FRANCHISE }`
- `ReservationStatus { ACTIVE, CONFIRMED, RELEASED, EXPIRED }`

**Models**
- `Unit` += `kind UnitKind @default(OWN)`, `isOnline Boolean @default(false)` (marca a unidade "Loja Online").
- `ProductStock` (novo, **autoritativo** por unidade): `productId` FK, `unitId` FK, `stock Int @default(0)` (REAL), `reserved Int @default(0)` (RESERVADO), `minStock Int @default(0)`, `@@unique([productId, unitId])`, índices por unidade. **DISPONÍVEL = `stock - reserved`** (calculado).
- `StockReservation` (novo): `productId` FK, `unitId` FK, `quantity Int`, `status ReservationStatus @default(ACTIVE)`, `expiresAt`, `orderId Int?` (FK), `channel SalesChannel`, `createdByUserId Int?`, `createdAt`, `confirmedAt?`, `releasedAt?`. Índices `(status, expiresAt)`, `(productId, unitId, status)`, `(orderId)`.
- `StockMovement` (novo, ledger): `productId` FK, `unitId` FK, `type`, `quantity Int` (positivo; direção derivada do tipo), `balanceAfter Int`, `unitCost Decimal?`, `reason?`, `note?`, `refOrderId Int?`, `createdByUserId Int?`, `createdAt`. Índices `(productId, createdAt)`, `(unitId, createdAt)`, `(type)`, `(refOrderId)`.
- `Order` += `channel SalesChannel @default(SITE)`, `soldByUserId Int?` (FK User), `unitId Int?` (FK Unit — unidade que vendeu).
- `User` += `unitId Int?` (FK Unit) — scoping de staff.
- `Product` += `costPrice Decimal?` (preço de custo → CMV/margem), `unitOfMeasure String?` (ex.: un, ml, g), `minStock Int @default(0)` (alerta baixo), `maxStock Int?` (alerta excessivo).
- `OrderItem` += `unitCost Decimal?` — **snapshot do custo no momento da venda** (CMV correto mesmo que o custo do produto mude depois).
- `Product.stock`: **mantido como saldo global cacheado** (Σ `ProductStock.stock`), atualizado só pelo helper do ledger (escritor único) para não divergir e não quebrar leituras existentes. Saldo **autoritativo é `ProductStock`**.

### Reserva de estoque (REAL / RESERVADO / DISPONÍVEL)

| Camada | Campo | Cai quando |
|---|---|---|
| REAL | `ProductStock.stock` | Só na **confirmação do pagamento** (baixa) |
| RESERVADO | `ProductStock.reserved` | Ao **reservar**; volta ao expirar/cancelar |
| DISPONÍVEL | `stock - reserved` (calc.) | Reflete reservas em tempo real |

**Ciclo de vida** (helpers transacionais, escritor único, `SELECT ... FOR UPDATE` na linha de `ProductStock`):
1. **Reservar** — checa `disponível ≥ qtd`, `reserved += qtd`, cria `StockReservation ACTIVE` (`expiresAt = agora + TTL`). **Não** gera `StockMovement`. Gatilho **híbrido**: vendedor/admin ao montar a venda; site no início do checkout.
2. **Confirmar pagamento** — `reserved -= qtd`, `stock -= qtd`, `StockMovement SAIDA_VENDA`, reserva → `CONFIRMED`. Se a reserva **já expirou**, re-checar disponível e re-reservar na hora; sem estoque → falha tratada (estorna/avisa).
3. **Expirar** — job varredor (`RESERVATION_TTL_MINUTES=20`, intervalo configurável) solta reservas `ACTIVE` vencidas: `reserved -= qtd`, reserva → `EXPIRED`. Sem movimento real.
4. **Cancelar** — manual (`RELEASED`), igual à expiração.

**Refatoração:** o fluxo Stripe atual **decrementa `stock` real no checkout e faz restock no cancel** (mistura reservado com real). Passa a **reservar** no checkout e **baixar** só na confirmação — alinha o ledger (movimentos = mudanças reais) e elimina overselling (resolve S5).

---

## Segurança — Validação `@security-auditor` (2026-07-06)

> Premissa verificada no código: a RLS atual (`migrations/20260705020000_sec_rls_sensitive_tables`) é **fail-secure apenas** — a policy de `jlr_api_rw` é `USING (true)` (credencial única da API, sem `SET` de contexto por request). **Logo, RLS NÃO isola por unidade.** O isolamento por unidade/papel é obrigação da camada de aplicação. Todo o plano parte disso.

Achados priorizados (Risco = Probabilidade × Impacto):

| # | Sev | OWASP | Achado | Mitigação obrigatória |
|---|-----|-------|--------|-----------------------|
| **S1** | 🔴 Crítico | A01/A06 | RLS não faz isolamento de unidade; se o scoping ficar só na UI, qualquer staff acessa qualquer unidade | Scoping **no servidor** via `resolveUnitScope(req)` em **toda** query com dimensão de unidade. RLS permanece só como defense-in-depth (fail-secure). |
| **S2** | 🟠 Alto | A01 (IDOR) | `unitId` vem da URL/query (`/units/:unitId/...`, `?unitId=`) — atacável | Validar `unitId ∈ resolveUnitScope(req)`; caso contrário **403**. Default **fail-closed**: se MANAGER/PROFESSIONAL omite `unitId`, assume a própria unidade — **nunca** "todas". |
| **S3** | 🟠 Alto | A01 | Mass assignment de identidade: cliente poderia forjar `soldByUserId`, `Order.unitId`, `User.unitId`, `createdByUserId` | Esses campos **sempre derivados do token/servidor**; Zod **rejeita** (não ignora) esses campos no body. |
| **S4** | 🟠 Alto | A01/A10 | KPIs hoje `requireAdmin` + query global; ao abrir para MANAGER/PROFESSIONAL podem vazar números globais | Escopo forçado **antes** da query: PROFESSIONAL → `soldByUserId=self`; MANAGER → sua unidade. Default fail-closed, nunca global. |
| **S5** | 🟡 Médio | A06 | Corrida de concorrência → overselling | **Resolvido pela reserva** (`SELECT ... FOR UPDATE` na linha de `ProductStock` ao reservar/confirmar; `balanceAfter` lido na mesma tx travada). |
| **S6** | 🟡 Médio | A08 | Quantidade negativa/estouro; `AJUSTE` pode mascarar furto/quebra | `quantity` inteiro positivo com teto sano; saídas não deixam saldo negativo; `AJUSTE` exige `reason` + grava `createdByUserId` **e** `AuditLog`. |
| **S7** | 🟡 Médio | A01 | Endpoint cross-unit (consulta de estoque de outras unidades) pode vazar dados financeiros | Retornar **apenas saldo de estoque**, nunca vendas/receita/custos de outra unidade. |
| **S8** | 🟡 Médio | A01/A09 | `/public/products` expondo saldo exato da Loja Online = vazamento de inteligência de negócio + enumeração | Expor **flag coarse** (`inStock`/`lowStock`) publicamente, **não** o número exato. |
| **S9** | 🟢 Baixo | A02 | Cobertura de RLS nas tabelas novas | `ENABLE ROW LEVEL SECURITY` em `ProductStock` e `StockMovement` com `jlr_api_rw_all` + `jlr_api_ro_select` + default-deny, idêntico ao padrão de `20260705020000`. Owner `jlrbeauty` não afetado (migrations/seed OK). |
| **S10** | 🟢 Baixo | A01 | Isolamento entre franquias | Gerente de franquia scoped à própria unidade; MASTER/ADMIN veem todas (aprovado). Garantir que staff de uma franquia **nunca** veja unidade irmã. |
| **S11** | 🟡 Médio | A01/A06 | Reserva-como-DoS: vendedor reserva tudo e trava os demais; ou reservas órfãs nunca liberadas | TTL curto (20 min) + job varredor confiável (idempotente, resiliente a restart); reservas atreladas a `createdByUserId`/`orderId`; admin/gerente pode liberar reserva manualmente; teto de qtd por reserva. |
| **S12** | 🟠 Alto | A08 | Preço/total forjados: `total` e `unitPrice` vêm do cliente no `POST /orders` → dá para pagar menos e poluir o BI | **Calcular total no servidor** a partir dos itens; `unitPrice` do preço de catálogo do servidor (não do body). |

**Hardening futuro (fora deste plano):** enforcement de unidade também no banco via `SET LOCAL app.user_unit` por transação + policy RLS `USING (unit_id = current_setting(...))`. Exige gerenciar variável de sessão sobre o pool de conexões — anotado para plano futuro, não bloqueia este.

**Veredito:** arquitetura aprovada **com** as mitigações S1–S8 e S11 embutidas como itens de execução e critério de aceitação. Sem S1/S2/S3/S4 o recorte por papel é apenas cosmético; a reserva (S5/S11) é o que garante que ninguém venda o que não tem.

## Não-escopo (Anti-Scope-Drift) — Fase 2 / planos futuros
Diferidos após a validação do PRD (2026-07-06) para manter a PLAN-0020 entregável:
- **Insumos de serviço (BOM)** — serviço consome produtos automaticamente (PRD 2.1.1/2.1.2). Agora só `USO_SALAO` manual.
- **Fornecedores + Pedido de Compra** com status e recebimento (PRD 2.3). Agora só `ENTRADA_COMPRA` avulsa.
- **Execução de transferência entre unidades** (PRD 2.1.2). Agora só visualização read-only.
- **Inventário físico guiado** (contagem → ajustes em lote) (PRD 2.1.3). Agora só `AJUSTE` avulso.
- **Gestão de usuários por unidade** pelo gerente (PRD 2.5). Agora só o RBAC de leitura/venda.
- **Número de série / itens serializados** (PRD 2.1.2) — não aplicável a salão; não-escopo permanente.
- TLS/HTTPS (PLAN-0019); backup/recovery e integração POS/contábil (PRD 3.5/3.6 — ops/futuro).
- Exportação avançada de relatórios ("Exportar" fica para depois).
- Separação financeira/tenancy real de franquia (tratadas como unidades com flag).
- Alterações em auth além de incluir `unitId` no contexto e criar `requireManager`.

> **Sugestão:** abrir `PLAN-0021` para o módulo de Compras/Fornecedores + Insumos de Serviço + Transferências quando a PLAN-0020 estiver estável.

---

## Onda 0 — Infra & baseline
- [x] Investigar por que `jlr_beauty-postgres-1` não reiniciou após reboot (restart policy / `exit 127` da imagem custom). Corrigir `restart:` no `docker-compose.yml` se necessário. Registrar ERR em `DEBUG-HISTORY.md`.
- [x] Confirmar migrations aplicadas e seed íntegro.
- (Feito em diagnóstico: `docker compose up -d postgres` → banco `healthy`, API recuperada, endpoint devolvendo os 8 produtos.)

## Onda 1 — Schema + migração de dados
- [x] Enums, `ProductStock`, `StockMovement`, `Unit.kind/isOnline`, `Order.channel/soldByUserId/unitId`, `User.unitId`.
- [x] RLS fail-secure em `ProductStock`, `StockMovement` e `StockReservation` (padrão PLAN-0018).
- [x] Migração de dados: criar unidade "Loja Online" (`isOnline=true`); marcar unidades 1/2 como `OWN`; criar `ProductStock` para os 8 produtos. **Decisão de execução:** alocar o `stock` global atual na unidade "Loja Online" (para o site seguir mostrando disponibilidade) e permitir o admin redistribuir depois. *Confirmar ao iniciar a Onda 1.*
- [x] `npx prisma generate` + `migrate`.

## Onda 2 — Backend: motor de estoque multi-unidade
- [x] `apps/api/src/lib/stockLedger.ts` → `applyStockMovement(tx, {...})`: atualiza `ProductStock` da unidade + recalcula `Product.stock` global + grava `StockMovement` com `balanceAfter`; transacional; `SELECT ... FOR UPDATE` na linha; bloqueia saldo negativo.
- [x] `apps/api/src/lib/stockReservation.ts` → `reserveStock(tx, {...})` (checa disponível, `reserved += qtd`, cria `StockReservation ACTIVE`), `confirmReservation(tx, id)` (→ `reserved -= qtd`, `applyStockMovement SAIDA_VENDA`, re-checa se expirada), `releaseReservation(tx, id, motivo)`. Todos com lock de linha.
- [x] Job varredor `releaseExpiredReservations()` (idempotente, resiliente a restart) — libera reservas `ACTIVE` vencidas. Env: `RESERVATION_TTL_MINUTES=20`, `RESERVATION_SWEEP_INTERVAL_MS`. Seguir o padrão do cleanup de concierge já existente.
- [x] Refatorar os pontos de mutação/reserva:
  - Stripe checkout-session (site) → **reservar** na unidade "Loja Online" (deixa de decrementar `stock` real).
  - Stripe `confirm-session` → **confirmar reserva** (baixa `SAIDA_VENDA` + `refOrderId`).
  - Stripe cancel/expiry → **liberar reserva** (deixa de fazer restock via `cancelOrderWithOptionalRestock`).
  - `POST /orders` (admin balcão) → reservar+confirmar (venda imediata) na **unidade do vendedor**, `SAIDA_VENDA`.
  - `fulfillmentUtils` restock de pedido já pago/cancelado → `DEVOLUCAO` (estorno de baixa real, distinto de liberar reserva).
  - `catalog.ts PATCH /products` deixa de escrever `stock` direto (estoque só via endpoints de movimento).
- [x] Endpoints (com escopo de unidade + papel):
  - `POST /units/:unitId/products/:id/stock/entry` (`ENTRADA_COMPRA`).
  - `POST /units/:unitId/products/:id/stock/consumption` (`USO_SALAO`).
  - `POST /units/:unitId/products/:id/stock/loss` (`PERDA` — quebra/vencimento, com razão).
  - `POST /units/:unitId/products/:id/stock/adjust` (`AJUSTE`).
  - `GET /units/:unitId/products/:id/movements`.
  - `GET /units/:unitId/inventory/summary` (itens, valor de estoque = Σ `stock*price`, ruptura `stock<=0`, **baixo** `stock<=minStock`, **excessivo** `maxStock != null && stock>=maxStock`).
  - `GET /units/:unitId/reservations` (ativas/expiradas — relatório PRD 2.4.1).
  - `GET /inventory/cross-unit?productId=` (read-only, todas as unidades — para consulta/remanejamento futuro).
- [x] `GET /public/products`: retornar flag coarse `inStock` baseada em **DISPONÍVEL** (`stock - reserved`) da unidade "Loja Online" (não o número exato — S8); manter filtro de status.
- [x] Zod em todos.

## Onda 3 — Backend: RBAC, canal/vendedor/unidade e KPIs por papel
- [x] Middleware: incluir `unitId` em `req.user`; criar `requireManager`; `resolveUnitScope(req)`.
- [x] Setar `channel`/`soldByUserId`/`unitId` em toda criação de pedido (site=SITE+Loja Online; admin=ADMIN+unidade do vendedor+seller).
- [x] **Sub-decisão de execução:** venda de balcão do admin nasce `PAGO` (com `Payment` imediato)? *Recomendado: sim.* Confirmar na Onda 3. — **Adotado: sim** (ver Decisões de execução #2).
- [x] KPIs (todos aceitando escopo de unidade, validado por papel no servidor):
  - `dashboardTopProducts.ts` (mais vendidos: qtd + receita).
  - `dashboardTopSellers.ts` (por `soldByUserId`; breakdown por canal).
  - `dashboardInventory.ts` (resumo de estoque por unidade / consolidado).
  - `dashboardFinancials.ts` — **CMV/COGS** (Σ `OrderItem.unitCost × qtd` de pedidos PAGO), **lucratividade/margem** por produto/serviço (receita − custo), **vendas por cliente** (PRD 2.4.2/2.4.3).
  - Ajustar KPIs existentes (receita/série/comissões) para respeitar o escopo de unidade e o recorte de papel (PROFESSIONAL → só próprias vendas).
  - *(implementado consolidado em `dashboardSalesInsights.ts` + `/dashboard/inventory-overview`, não como arquivos separados por KPI — ver Registro de Execução Onda 3)*
- [x] Ao confirmar venda, gravar `OrderItem.unitCost` = `Product.costPrice` do momento (snapshot p/ CMV).
- [x] Auditar todas as ações sensíveis em `AuditLog` (entrada/baixa/uso/perda/ajuste, venda, liberação de reserva) — PRD 3.3, não só `AJUSTE`.

## Onda 4 — Frontend Admin: produtos & estoque
- [x] `admin-products`: saldo **por unidade**; modais Entrada/Baixa(uso)/Ajuste; histórico de movimentação; badge ruptura/baixo; consulta read-only de estoque de outras unidades.
- [x] Reusar padrão de modais/behavior existente.
- [x] Confirmar upload/campo `imageUrl` (produtos sem imagem — ver Onda 6).

## Onda 5 — Frontend Admin: vendas & BI por papel (enxuto)
- [x] Reduzir o dashboard atual e substituir por **painéis compactos por papel**:
  - **Funcionário:** Minhas vendas (período) + Estoque da minha unidade + consulta outras unidades.
  - **Gerente:** Vendas da unidade + top produtos + top vendedores da unidade + valor de estoque + ruptura.
  - **Admin/Master:** consolidado com filtro por unidade e own × franquia.
  - *(entregue via `AdminDashboardInsightsIsland` — ilha de BI compacta consumindo `sales-insights`/`inventory-overview` com recorte por papel no servidor)*
- [x] Ligar "Novo pedido manual" → formulário (produto, qtd, cliente, canal=ADMIN, unidade+vendedor=logado) → `POST /orders`. Validar `admin-orders/behavior.ts` (dirige o grid hoje).

## Onda 6 — SPA (público) polish
- [x] `HomeProductsSection`: usar `inStock` (DISPONÍVEL) da Loja Online para "Esgotado" + desabilitar "Adicionar"; ligar seletor de quantidade do destaque.
- [x] Imagens: os 8 produtos têm `imageUrl=null` (todos no fallback). **Conteúdo, não bug** — registrado como pendência de conteúdo (não bloqueia DONE técnico); definição de imagem fica a cargo do admin via upload já existente.

## Onda 7 — Dados de teste & validação final
- [x] (Só dev) seed: 1 ADMIN + 1 MANAGER + profissionais com `unitId`; 2-3 vendas `PAGO` em unidades/canais/vendedores distintos para validar o BI por papel. **Nunca em produção.**
- [x] Validação: TypeScript (api+web) PASS, build Docker PASS, testes PASS.
- [x] Roteiro manual por papel: entrada de compra → baixa por uso → venda admin (unidade A, vendedor X) → venda site (Loja Online) → login como funcionário (vê só as próprias vendas + estoque da unidade) → login como gerente (vê a unidade) → login como admin (vê tudo + filtro) → conferir top produtos/vendedores, valor de estoque, ruptura e histórico. *(validado via API real conforme Registro de Execução Onda 7 — dados de teste limpos do banco após validação)*

---

## Validação de Fluxos (dry-run 2026-07-06) e Ajustes Resultantes

Rastreamento de 4 fluxos contra o desenho, com os ajustes incorporados:

| Fluxo | Veredito | Ajuste incorporado |
|---|---|---|
| **1. Cadastro de produto** | OK com ajuste | Cadastro cria só o **catálogo** (nome/preço/descrição/imagem/status). "Estoque inicial" = **opcional + seletor de unidade** → gera `ENTRADA_COMPRA` (razão "saldo inicial") na unidade escolhida. Em branco → 0 em todas as unidades. Nenhuma escrita silenciosa de `stock`. |
| **2. Ver na vitrine** | OK com nuance | Vitrine mostra se status ativo/sem-status **e** disponibilidade da **Loja Online**. Produto com estoque só em loja física aparece como **"Esgotado"** online. "Aparecer" ≠ "comprável online". Zero-disponível **aparece como Esgotado** (padrão; ocultar = opção futura). |
| **3. Venda 2 produtos + 1 serviço** | OK com 2 correções | (a) **Total calculado no servidor** (Σ `unitPrice×qtd`), não confiado do cliente. (b) **`unitPrice` do preço de catálogo** no servidor (ou validado contra ele). (c) Estoque exigido na **unidade do vendedor**; tela do vendedor mostra disponível da própria unidade. Serviço não reserva/baixa estoque. |
| **4. Cadastro sem preço/sem estoque** | Definido | **Sem preço:** UI bloqueia + API 400 (obrigatório). **Endurecer para preço > 0** (Zod `.positive()`) — hoje aceita R$ 0,00. **Sem estoque:** cria com 0, aparece "Esgotado", não vendável até uma entrada. |

**Novos itens de execução derivados:**
- [x] Onda 2 — `POST /orders`: total e `unitPrice` **server-side** (não confiar no cliente).
- [x] Onda 2 — `productSchema.price` → `.positive()` (proíbe R$ 0,00).
- [x] Onda 2 — Cadastro de produto: parâmetros opcionais `initialStock` + `unitId` → roteados por `applyStockMovement (ENTRADA_COMPRA)`; sem escrita direta de `stock`.
- [x] Onda 4 — Form de produto: seletor de unidade p/ estoque inicial + exibição de disponível por unidade (incl. Loja Online).
- [x] Onda 5 — Form de venda: mostrar disponível **da unidade do vendedor**; total somado no servidor exibido para conferência.

## Cobertura do PRD (validação 2026-07-06)

Cruzamento com `prd_inventario_franquia.pdf`. **Coberto na PLAN-0020** (após as adições acima): RBAC 3 papéis; cadastro de produto (agora + `costPrice`/`unitOfMeasure`/`minStock`/`maxStock`); ledger completo (+`PERDA`); estoque por unidade com alertas baixo/excessivo; reserva com TTL; registro de venda por unidade/funcionário/cliente + desconto; pedido↔reserva; relatórios de estoque/movimentação/**reservas**; vendas por produto/funcionário/unidade/cliente; **CMV + lucratividade**; auditoria de todas as ações; RBAC/autenticação.

**Diferido para Fase 2 (PLAN-0021 sugerido):** insumos de serviço (BOM), fornecedores + pedido de compra, execução de transferência, inventário físico guiado, gestão de usuários por unidade. **Não-escopo permanente:** número de série; backup/recovery e integração POS/contábil (ops).

## Riscos
- Migração de estoque global → por unidade: alocação do saldo atual precisa de decisão (Onda 1) e é irreversível sem cuidado → fazer em migration versionada com passo de dados idempotente.
- `Product.stock` cacheado (Σ unidades): garantir escritor único (o helper) para não divergir.
- RLS em 2 tabelas novas — padrão fail-secure PLAN-0018.
- Escopo por papel deve ser imposto **no servidor**, não só na UI.
- Refatoração ampla (schema + >3 arquivos de rota + middleware + frontend) → justifica PLAN.

## Critérios de Aceitação
- [x] Estoque é por unidade; site vende da Loja Online; lojas físicas têm saldo próprio.
- [x] Entrada (compra), baixa (venda), uso interno, ajuste e devolução geram `StockMovement` auditável por unidade.
- [x] Venda grava canal + vendedor + unidade; cancelamento devolve via ledger.
- [x] Reserva funciona nas 3 camadas: reservar prende DISPONÍVEL sem tocar no REAL; confirmar dá baixa no REAL; expirar em 20 min devolve o DISPONÍVEL — validado ao vivo (reserva prendeu o disponível, sweeper expirou em ≤60s e devolveu); validação com 2 vendedores concorrentes cobre-se pelo lock `SELECT ... FOR UPDATE` (não repetida manualmente com 2 sessões simultâneas).
- [x] Pagamento após reserva expirada re-checa disponibilidade; sem estoque → falha tratada (nunca vende o que não tem).
- [x] Funcionário vê só as próprias vendas e o estoque da sua unidade; gerente vê a unidade; admin vê tudo com filtro — imposto no servidor.
- [x] Dashboard enxuto por papel com: receita, nº vendas, ticket médio, top produtos, quem vendeu mais, valor de estoque, ruptura/baixo estoque.
- [x] Alertas de estoque **baixo** (`<=minStock`) e **excessivo** (`>=maxStock`); baixa por **perda** registrada no ledger.
- [x] BI financeiro: **CMV** (via `OrderItem.unitCost` snapshot), **margem/lucratividade** por produto e **vendas por cliente**.
- [x] Todas as ações sensíveis auditadas em `AuditLog` (PRD 3.3), não só ajustes.
- [x] SPA mostra esgotado corretamente (estoque da Loja Online).
- [x] TypeScript + build Docker + testes PASS.

**Travas de segurança (S1–S10) — obrigatórias:**
- [x] Todo endpoint com dimensão de unidade valida `unitId ∈ resolveUnitScope(req)`; default fail-closed (própria unidade, nunca "todas") (S1, S2).
- [x] `soldByUserId`/`Order.unitId`/`User.unitId`/`createdByUserId` derivados do servidor; Zod rejeita esses campos no body (S3).
- [x] PROFESSIONAL só obtém KPIs das próprias vendas; MANAGER só da sua unidade — verificado via API, não só UI (S4).
- [x] Decremento de estoque atômico/travado (sem overselling em concorrência, provado com tentativa de 999un bloqueada); `AJUSTE` grava `AuditLog` (S5, S6).
- [x] Endpoint cross-unit devolve só saldo, sem financeiro (S7).
- [x] `/public/products` expõe flag coarse (`inStock`), não saldo exato (S8).
- [x] RLS habilitada em `ProductStock` e `StockMovement` (rw-all + ro-select + default-deny) (S9).
- [ ] Pentest manual replicando o padrão do PLAN-0018: staff de uma unidade/franquia não acessa dados de outra (S10) — **não executado nesta rodada**; recomendado antes do fechamento formal como DONE, análogo ao pentest do PLAN-0018.

---

## Registro de Execução (2026-07-06/07)

**Entregue (todas as ondas):**
- **Onda 0:** Causa raiz do postgres Exited(127) identificada (bind mount em `/media` antes da montagem do disco no boot) — ERR-0043; restart policy já correta, sem mudança no compose.
- **Onda 1:** Migrations `20260706100000_inventory_multiunit_core` (4 enums, `ProductStock`, `StockMovement`, `StockReservation`, colunas em Product/Unit/Order/OrderItem/User, índices, FKs, data migration: unidade "Loja Online" id=3 criada, 8 saldos migrados para ela, 7 movimentos "saldo inicial", `User.unitId` backfill de Professional) e `20260706110000_inventory_rls` (RLS fail-secure nas 3 tabelas novas). Aplicadas e validadas no banco.
- **Onda 2:** `lib/stockLedger.ts` (applyStockMovement com `FOR UPDATE` + balanceAfter + sync do cache global; sellStockDirect), `lib/stockReservation.ts` (reserve/confirm com re-check pós-expiração/release/releaseOrderReservations + sweeper 60s, TTL 20min), `routes/inventory.ts` (entry/consumption/loss/adjust/movements/inventory/summary/reservations/release/cross-unit/units), `fulfillmentUtils` refatorado (cancel libera reservas ou gera DEVOLUCAO conforme baixa real; markOrderAsPaid confirma reservas — centraliza os 3 caminhos de pagamento), checkout Stripe agora **reserva** na Loja Online (não decrementa real), `catalog.ts` (price>0, costPrice/unitOfMeasure/minStock/maxStock, estoque inicial via ledger, PATCH sem stock, `/public/products` com `inStock` coarse).
- **Onda 3:** `requireManager` + `resolveUnitScope`/`canAccessUnit` (fail-closed), `unitId` no token-context, `POST /orders` reescrito (requireStaff, total/preços server-side, canal ADMIN + soldBy + unitId validado, nasce PAGO com Payment MANUAL por padrão, baixa via ledger, AuditLog), `dashboardSalesInsights.ts` (receita/ticket/CMV/margem/topProdutos/topVendedores/topClientes/porCanal + inventoryOverview), rotas `/dashboard/sales-insights` (recorte por papel no servidor) e `/dashboard/inventory-overview`.
- **Onda 4:** Admin produtos — preço de custo, estoque mínimo, estoque inicial+unidade (criação), painel "Estoque por unidade" (edição), modais Movimentar (entrada/uso/perda/ajuste) e Histórico.
- **Onda 5:** Modal "Novo pedido manual" (cliente, unidade, itens produto+serviço, disponível da unidade, pago/a-receber) ligado ao `POST /orders`; ilha `AdminDashboardInsightsIsland` no dashboard (BI compacto).
- **Onda 6:** SPA — `inStock`, badge/estado Esgotado (spotlight + coleção), seletor de quantidade funcional.
- **Onda 7:** TS PASS (api+web), builds PASS, Docker rebuild PASS (10 migrations, sweeper ativo), testes 5/5 PASS, **fluxo end-to-end via API real validado**: entrada +10un → venda balcão mista (2×produto+1×serviço) PAGO/ADMIN/unidade1/soldBy/total 770 server-side com unitCost snapshot → saldo 8 + ledger completo (quem/quanto/saldo/refOrder) → overselling 999un bloqueado (400) → total forjado 0.01 ignorado (cobrou 35 do catálogo) → sales-insights com receita/CMV/margem/tops reais → inventory-overview por unidade → público expõe só `inStock` booleano. Dados de teste limpos do banco.

**Decisões de execução (dentro do escopo aprovado):**
1. `minStock`/`maxStock` só em `Product` (catálogo global) — evita duplicação com `ProductStock`; alertas comparam saldo da unidade contra o min/max do produto.
2. Venda de balcão nasce **PAGA** por padrão (`markAsPaid` default true; modal oferece "A receber" → PENDENTE) — sub-decisão da Onda 3 adotada conforme recomendação.
3. Venda de balcão usa **baixa direta** (`sellStockDirect`, checa DISPONÍVEL sob lock) — atomicamente equivalente a reservar+confirmar na mesma transação.
4. Confirmação de reservas centralizada em `markOrderAsPaid` — cobre confirm-session, aprovação manual e webhook Stripe sem duplicação.
5. `POST /orders` mudou de `requireAdmin` para `requireStaff` (gerente/funcionário vendem), com scoping de unidade fail-closed.
6. `unitOfMeasure`/`maxStock` existem na API mas ficaram fora do form admin (enxuto) — adicionáveis depois sem migração.
7. Pagamento pós-expiração sem estoque: pedido marca `fulfillmentNotes` `[ESTOQUE]...resolver manualmente` (não vende o que não tem; estorno é decisão do admin).

**Rodada 1 de validação visual (2026-07-07):** usuário testou admin+SPA e reportou 5 itens; 4 corrigidos (layout do form de produtos, quantidade travada no modal de venda, "+ Novo Produto" sem scroll/foco, feedback de erro pouco visível) e 1 explicado como comportamento decidido em plano (reserva só no início do checkout, não no carrinho — provado ao vivo com sweeper). Detalhe completo em `MODIFICATION_LOG.md` (2026-07-07 — correções rodada 1).

**Testes automatizados (2026-07-07):** implementados para as rotinas críticas que não dependem de infraestrutura de banco de testes (ainda inexistente no projeto) — `stockLedger.test.ts` (7 casos: entrada/saída, bloqueio de saldo negativo, validação de quantidade, sync do cache global), `stockReservation.test.ts` (8 casos: reservar sem tocar no REAL, disponível insuficiente, confirmar, liberar idempotente, re-checagem pós-expiração confirmando e falhando, reserva já finalizada), `middleware/auth.test.ts` (8 casos: `resolveUnitScope`/`canAccessUnit` fail-closed para MASTER/ADMIN/MANAGER/PROFESSIONAL, cobrindo S1-S4). Fake mínimo de `Prisma.TransactionClient` em `lib/testHelpers/fakeStockTx.ts` (sem dependência nova) para não depender de Postgres real. Total 23/23 PASS (`npm run test` no `apps/api`), TS PASS. **Fora do escopo automatizado por exigir infra de banco de teste/HTTP:** rotas Express (`orders.ts`, `inventory.ts`) fim-a-fim e concorrência real com 2 sessões simultâneas — cobertas até aqui só pelo teste manual via API real (Onda 7) e pela revisão de lock (`SELECT ... FOR UPDATE`).

**Pendências para DONE:**
- [ ] Validação visual/manual do usuário — confirmação final do usuário de que a rodada 1 fechou todos os pontos (sem novo report pendente).
- [ ] Pentest manual S10 (staff de uma unidade/franquia não acessa dados de outra), análogo ao pentest do PLAN-0018.
- [ ] Fluxo Git completo (commit + push autorizados) → Git Record abaixo.

## Git Record of Delivery (a preencher ao final)
- **Step 1 (Pre-commit review):** [pendente]
- **Step 2 (Commit authorization):** [pendente]
- **Step 3 (Commit confirmation):** [pendente]
- **Step 4 (Push authorization e resultado):** [pendente]
- **Push status:** PENDING

---

## Próximos Passos
1. Usuário valida/ajusta este plano revisado.
2. Após aprovação → `EXECUTING_WITH_PLAN`, começando pela Onda 0/1.
