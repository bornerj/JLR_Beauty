# PostgreSQL Migration Plan (MySQL -> PostgreSQL)

## Objetivo
Migrar o backend de MySQL para PostgreSQL com risco controlado, ponto de retorno claro e validacao objetiva.

Este documento e um runbook operacional para executar a migracao sem perder rastreabilidade.

## Principios de Execucao
1. Sem big-bang sem rollback.
2. Toda mudanca em branch dedicada.
3. Baseline congelada antes de tocar no provider.
4. Validacao tecnica e funcional antes de cutover.
5. Rollback documentado e testado.

## Mapeamento dos Pontos Sensiveis no Projeto
1. `apps/api/prisma/schema.prisma`
   - datasource atual: `provider = "mysql"`.
2. `apps/api/prisma/migrations/migration_lock.toml`
   - lock atual: `provider = "mysql"`.
3. `apps/api/prisma/migrations/*`
   - SQL gerado para MySQL (`AUTO_INCREMENT`, `CHARSET`, `COLLATE`, etc).
4. `apps/web/e2e/flows.spec.ts`
   - usa `DATABASE_URL` do backend para conectar via Prisma em testes.
5. `docs/config/db_sql.sql` e `docs/config/migrate_db_sql.sql`
   - dumps SQL de referencia em formato MySQL.
6. Operacao local
   - MySQL atual em `localhost:3306`.

## Impacto Real da Migracao
Prisma reduz o impacto no codigo de negocio, mas os itens abaixo ainda sao criticos:
1. Historico de migrations (MySQL) nao e reaproveitavel diretamente em PostgreSQL.
2. Estrategia de dados (reset+seed vs ETL) precisa decisao explicita.
3. Comportamento de busca textual (`contains`) pode variar por collation/case sensitivity.

## Estrategia Recomendada para Este Projeto
Para equipe pequena e alta velocidade:
1. Manter MySQL como baseline estavel (branch/tag).
2. Criar branch de migracao para PostgreSQL.
3. Recriar baseline de migrations no provider PostgreSQL.
4. Rodar seed e validar.
5. Cutover por `DATABASE_URL`.

## Fase 0 - Congelamento e Ponto de Retorno
1. Criar branch/tag de seguranca antes da migracao.
   - Exemplo:
   - `git checkout -b postgres-migration`
   - `git tag pre-postgres-cutover`
2. Fazer backup completo do banco MySQL.
   - Exemplo (ajustar usuario/senha):
   - `mysqldump -u root -p --routines --triggers --single-transaction jlr_beauty > backup_mysql_pre_postgres.sql`
3. Confirmar que backend atual sobe e testes minimos passam na baseline.

## Fase 1 - Preparacao de Ambiente PostgreSQL
1. Provisionar banco PostgreSQL (local ou container) com banco dedicado.
2. Criar URL de conexao:
   - `DATABASE_URL="postgresql://user:pass@localhost:5432/jlr_beauty_pg?schema=public"`
3. Guardar `.env` antigo de MySQL para rollback rapido.

## Fase 2 - Troca de Provider Prisma
1. Alterar `apps/api/prisma/schema.prisma`:
   - de `provider = "mysql"` para `provider = "postgresql"`.
2. Tratar historico de migrations:
   - Opcao recomendada: criar nova baseline de migrations para PG na branch de migracao.
   - O lock `apps/api/prisma/migrations/migration_lock.toml` deve refletir PostgreSQL.
3. Gerar client Prisma obrigatoriamente:
   - `cd apps/api`
   - `npx prisma generate`

## Fase 3 - Baseline de Schema em PostgreSQL
Escolher uma das abordagens:

### Abordagem A (rapida): reset + seed
1. Aplicar baseline no PG.
2. Executar seed.
3. Validar app com dados seedados.

### Abordagem B (com dados reais): ETL MySQL -> PG
1. Exportar dados do MySQL.
2. Transformar tipos/formatos necessarios.
3. Importar para PG.
4. Validar integridade (contagens, FKs, valores criticos).

## Fase 4 - Validacao Obrigatoria
1. Backend:
   - `cd apps/api`
   - `npm run build`
   - `npm test`
2. Frontend:
   - `cd apps/web`
   - `npm run lint`
   - `npm run build`
3. Smoke API:
   - `GET /health` deve retornar 200.
   - `GET /health/db` deve retornar 200 com `db.connected = true`.
4. Fluxos criticos:
   - login/admin
   - CRUD principal no admin
   - fluxo de agenda/concierge
   - pagamentos simulados
5. Busca textual:
   - revisar filtros com `contains` para confirmar comportamento esperado.

## Fase 5 - Cutover
1. Atualizar `DATABASE_URL` no ambiente ativo para PostgreSQL.
2. Reiniciar backend.
3. Rodar smoke imediato:
   - `/health`
   - `/health/db`
4. Rodar validacao funcional rapida em UI.

## Fase 6 - Rollback (Se Algo Falhar)
1. Voltar `DATABASE_URL` para MySQL.
2. Checkout da tag/branch estavel se houve mudanca de codigo nao confiavel.
3. Reiniciar backend.
4. Revalidar:
   - `/health`
   - `/health/db`
   - login/admin minimo.
5. Se necessario, restaurar dump MySQL de seguranca.

## Checklist de Conclusao
1. Provider Prisma em PostgreSQL validado.
2. Prisma Client regenerado (`npx prisma generate`) apos mudancas de banco.
3. Build/test/lint passando.
4. Fluxos criticos validados.
5. Rollback testado.
6. `memory/MODIFICATION_LOG.md` atualizado com plano e checkpoint final.

## Observacoes de Modularizacao (alinhado ao plano maior)
Durante a migracao final React, separar responsabilidade por modulo para facilitar reaproveitamento:
1. `menu` (frontend e adaptadores necessarios).
2. `footer`.
3. `chatbot` (frontend + backend + integracao Z-API/ngrok).
4. `health`/observabilidade (inclui status de banco no menu).

Isso reduz acoplamento e simplifica migracoes futuras de infraestrutura (como esta de banco).

