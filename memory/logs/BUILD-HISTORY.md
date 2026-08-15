# Build Notes

<!-- Record build commands, pinned versions, and tool gotchas here. -->
<!-- Example:
## Tailwind CSS
Working compile command (confirmed):
  npx tailwindcss@3.4.17 -i input.css -o output.css
Notes:
- Pin the version — unpinned npx tailwindcss may resolve a different version and break builds.
-->

## 2026-08-14 — Migração `add_franchise_pipeline` (PLAN-0022, Onda 9)

**O que mudou (aditivo, sem perda de dado — `FranchiseLead` estava vazia no ambiente local,
0 registros):**
- Novo enum `FranchiseStage` (`INTERESSADO/QUALIFICADO/REUNIAO/PROPOSTA/NEGOCIACAO/CONTRATO/IMPLANTACAO`).
- `FranchiseLead.stage FranchiseStage @default(INTERESSADO)` (`NOT NULL`, com default — nenhuma
  linha pré-existente fica sem valor); `FranchiseLead.estimatedValue Decimal?`;
  `FranchiseLead.stageChangedAt DateTime?` (default `now()`). Campo legado `status String?`
  **preservado** — as duas colunas convivem, a tela `admin-leads` legada continua lendo/gravando
  em `status` sem nenhuma mudança de comportamento.
- Nova tabela `FranchiseLeadStageHistory` (`id, leadId, fromStage?, toStage, changedAt`), FK para
  `FranchiseLead` com `onDelete: Cascade`.

**Como rodou (mesmo motivo estrutural de sempre — `postgres` só é alcançável de dentro da rede
Docker Compose, sem porta publicada no host):**
1. `docker cp apps/api/prisma/schema.prisma jlr_beauty-api-1:/app/prisma/schema.prisma` (container
   já rodando ainda tinha o schema da Onda 8 embutido na imagem; copiado o novo antes de gerar a
   migration).
2. `docker compose exec api sh -c 'DATABASE_URL="$DATABASE_MIGRATION_URL" npx prisma migrate dev
   --name add_franchise_pipeline --skip-seed'` — usa a role dona do banco (`jlrbeauty`, via
   `DATABASE_MIGRATION_URL`), não a role `jlr_api_rw` de runtime (least-privilege, sem permissão
   para criar o shadow database que `migrate dev` precisa) — mesmo padrão já usado pelo
   `docker-entrypoint.sh` para `migrate deploy` no boot.
3. `docker cp jlr_beauty-api-1:/app/prisma/migrations/20260814214126_add_franchise_pipeline
   apps/api/prisma/migrations/` — migration gerada dentro do container copiada de volta pro
   repositório (senão fica só na imagem, não versionada).
4. `npx prisma generate` local (fora do container) para o Prisma Client do host bater com o schema
   novo (necessário pro `tsc` do host reconhecer os campos novos ao escrever o módulo
   `franchise-pipeline`).

**⚠️ Achado durante a execução — 2 mudanças de drift pré-existente vieram junto na mesma migration,
não fazem parte do escopo da Onda 9:**
- `DROP INDEX "Order_orderHmac_idx"` — índice redundante criado por SQL bruto na migration
  `20260705000001_sec_order_hmac` (SEC-21), nunca declarado no `schema.prisma` (`orderHmac` já tem
  `@unique`, que já mantém seu próprio índice único cobrindo a mesma busca). Dropar o duplicado é
  inofensivo — a constraint `@unique` segue garantindo unicidade normalmente.
- `ALTER TABLE "concierge_public_attempts"/"coupon_validation_attempts" ALTER COLUMN "updatedAt"
  DROP DEFAULT` — essas duas tabelas (criadas por SQL bruto nas migrations de rate-limit de
  05/07) tinham um `DEFAULT` no nível do banco que o `schema.prisma` nunca declarou (`updatedAt
  DateTime @updatedAt` é gerenciado pela aplicação, não pelo banco). Sem efeito funcional — o
  Prisma continua preenchendo `updatedAt` normalmente em toda escrita via `@updatedAt`.

Motivo de registrar isto explicitamente: `prisma migrate dev` sempre reconcilia TODO o drift entre
o banco real e o `schema.prisma` atual ao gerar uma nova migration, não só o que foi editado nesta
sessão — não dava pra isolar só a mudança da Onda 9 sem editar manualmente o SQL gerado (o que
quebraria a validação de checksum do Prisma contra o que já tinha sido de fato aplicado ao banco).
Os dois itens acima já eram drift antes desta sessão; nenhum dado foi perdido, nenhuma constraint
de negócio foi enfraquecida.

**Validação pós-migração:** `docker compose exec api sh -c 'DATABASE_URL="$DATABASE_MIGRATION_URL"
npx prisma migrate status'` → "Database schema is up to date!" (11 migrations). `GET
/api/franchise-leads` (rota legada) → `200`, `[]` (base vazia, sem dado pra perder). `tsc -p
tsconfig.build.json` e `npm run test` (99/99) PASS após a migração.

---

## 2026-08-13 — Massa de teste Admin V2 (PLAN-0022)

**O que rodou:** `apps/api/scripts/seedAdminV2TestData.ts`, a pedido explícito do usuário, para
validar visualmente o Admin V2 (Ondas 0-3) com dados reais em vez de um ambiente vazio.

**Como rodou (ambiente local Docker, sem tsx na imagem prod):** `npx esbuild scripts/seedAdminV2TestData.ts
--bundle --platform=node --outfile=/tmp/seedAdminV2TestData.bundle.js --external:@prisma/client --external:dotenv`
→ `docker cp` para dentro do container `api` → `node seedAdminV2TestData.js` (executado contra o
Postgres do `docker-compose.yml`, usando `DATABASE_URL` do `.env` do container). Arquivo temporário
removido do container após a execução; o script-fonte fica versionado em `apps/api/scripts/`.
Reexecutável com `npm run seed:admin-v2-test-data` (requer `tsx`, disponível em ambiente de dev local).

**O que foi criado (idempotente — reexecutar não duplica, ver guards no próprio script):**
- 2 unidades novas `kind=FRANCHISE`: "Franco da Rocha" (SP) e "Recife" (PE).
- Estoque inicial (`ENTRADA_COMPRA` via `applyStockMovement`, ledger real) nas 5 unidades
  (as 2 novas + Birmann 20 + Parque da Cidade + Loja Online) — 45 movimentos, 45 linhas de
  `ProductStock`.
- 6 profissionais novos (2 em Birmann 20, 2 em Franco da Rocha, 2 em Recife) + escalas
  (`ProfessionalShift`) cobrindo hoje ±35/+21 dias. Parque da Cidade já tinha 3 profissionais,
  não precisou de novos. Loja Online (unidade online) não recebe profissionais/agendamentos —
  decisão consciente, não é uma unidade física com agenda.
- 43 `Order` (venda real via `sellStockDirect`, mesmo ledger de produção), distribuídos para
  cobrir os 4 estados do Board Operacional (`entraram/emPreparacao/atencao/prontos`) e os 5
  estados do classificador (`NORMAL/ATTENTION/STALLED/OVERDUE/BLOCKED`), com cadeia completa de
  timestamps de fulfillment em parte dos pedidos para exercitar o Fluxo real (`OrdersFlow`).
- 36 `Appointment` + `AppointmentSlot` (4 por profissional, 9 profissionais).

**Identificação dos dados de teste (para limpeza futura, se necessário):** pedidos com
`customerEmail` terminando em `@teste.jlr.local`; agendamentos com `notes` contendo
`[SEED-ADMINV2]`; movimentos de estoque com `note` contendo `[SEED-ADMINV2]`.

**Validação pós-execução:** `GET /api/admin-v2/panorama`, `/network`, `/operations/orders` e
`/operations/orders/flow` retornaram `200` com dados reais e não-vazios (5 unidades em
`attention`, board com as 4 colunas populadas, fluxo com gargalo real detectado na etapa
Enviado→Entregue, média 1170min). `npm run test` (46/46) e `tsc -p tsconfig.build.json` seguem
PASS após a adição do script.
