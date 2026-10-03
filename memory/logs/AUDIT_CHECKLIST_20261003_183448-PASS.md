# AUDIT CHECKLIST — 2026-10-03 — PASS

Sessão: migração Zorin → servidor Ubuntu (`PLAN-0038`), correção de 3 discrepâncias de bootstrap, `ERR-0096`, backup, documentação. Commit `ecf4734` pushado (`origin/main`).

## 1. Decision Integrity (Decision Drift)
[x] Todas as DECISION-* ACTIVE seguem válidas (013–021 tratam de Admin V2, estoque, pagamentos, conteúdo — nenhuma de hospedagem).
[x] Nada feito hoje contradiz uma DECISION ACTIVE.
[x] Mudança estrutural (hospedagem, volumes → bind mounts, remoção do `driveguard`) registrada como **`DECISION-022`**.

## 2. State Integrity (Architectural Drift)
[x] PLAN abertos, todos rastreados e nomeados: `PLAN-0038` (aguarda teste de reboot do usuário), `PLAN-0036` (Onda 6, pré-existente), `PLAN-0019` (TLS, bloqueado por domínio, pré-existente).
[x] Mudança de arquitetura de ambiente refletida em `sfk.toml [hosting.*]`, `docs/config/SERVIDOR_UBUNTU.md`, `progress.md`.
[x] Escopo do plano respeitado. Desvio formal: remoção de `scripts/fix-nginx.sh` (mesma causa raiz do `driveguard`) — registrada no plano, no log e na `DECISION-022`.

## 3. Operational Memory
[x] Toda mudança no `MODIFICATION_LOG` (bootstrap/discrepâncias, START do plano, `ERR-0096`, Ondas 3-5, esta auditoria).
[x] Plano atualizado com progresso real por onda + Git Record preenchido (commit e push).
[x] Plano **corretamente não fechado** `-DONE-`: o critério "persistência após reboot" ainda não foi verificado.

## 4. Debug Memory
[x] Bug corrigido: login 403 por `CORS_ORIGIN` → `ERR-0096` completo (SINTOMA / CAUSA_RAIZ / ACAO / CONTEXTO).
[x] Backfill de higiene `ERR-0088` escrito (pendente desde 2026-08-24). `ERR-0033`/`ERR-0091` marcados SUPERADO.
[x] `DEBUG-HISTORY` consultado antes do trabalho (origem do `driveguard`).

## 5. Technical Validation
[x] `apps/api` e `apps/web` **intocados** → lint/`tsc`/testes unitários não se aplicam (não executados por ritual).
[x] Build: `docker compose build` das 3 imagens OK. `docker compose config -q` OK. `sfk.toml` lido por `tomllib` OK.
[x] Dados: `pg_restore --exit-on-error` exit 0; contagens das 41 tabelas Zorin × servidor idênticas; 15/15 migrations; 69 uploads servidos.
[x] `scripts/backup.sh --verify` executado de verdade (restore em banco temporário, contagens idênticas, checksums OK).
[x] Sem schema Prisma alterado, sem migration nova. Sem `console.log` (nenhum código de produto alterado).

## 6. Regression Risk
[x] Área sensível tocada só por configuração: `CORS_ORIGIN` (autenticação/borda) no `.env`; verificado com `curl` (origens liberadas passam, origem estranha segue 403).
[ ] Cobertura automatizada: **não existe teste automatizado** para `backup.sh` nem para a regra de CORS por origem — validação foi manual/ao vivo. **Ressalva não bloqueante.**
[x] Histórico similar (`ERR-0033`/`0091`) tratado e marcado superado; ressalva anterior do `ERR-0093` (sem teste automatizado da guarda de papel) segue aberta, não tocada.

## 7. Git Governance
[x] Revisão dos arquivos antes do commit (15 arquivos listados, `.env` e arquivos de RH de fora).
[x] Mensagem no padrão convencional (`chore(infra): …`) + atribuição.
[x] Git Record of Delivery preenchido no `PLAN-0038` (commit + push COMPLETED).
[x] Commit e push autorizados explicitamente e **separadamente** (`ecf4734`, `6d66dd9..ecf4734`).

## Audit Result

Status: **PASS** (com ressalvas não bloqueantes: sem teste automatizado de `backup.sh`/CORS; teste de reboot pendente com o usuário; cron + backup offsite não configurados; senhas das roles do banco = defaults versionados).
