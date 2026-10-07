# PR-0003 — Hardening da autenticação e autorização (PLAN-0042)

## Título
`fix(security): hierarquia MASTER>ADMIN, IP confiável, login uniforme, detecção de reuso de refresh e política de senha (PLAN-0042)`

## Objetivo
Fechar os achados da auditoria de segurança do login (2026-10-07) mantendo o auth próprio (`DECISION-023`), sem provedor externo.

## O que foi feito
- `/users`: ADMIN não altera/exclui MASTER nem ADMIN; só MASTER cria ADMIN/MASTER; último MASTER protegido; troca de senha/e-mail/desativação revoga sessões; auditoria (`USER_SENSITIVE_UPDATE`, `USER_DELETED`, `USER_ACCESS_DENIED`).
- IP: nginx sobrescreve `X-Forwarded-For`; `getClientIp` usa `req.ip`; limite por conta; `limit_req` em `/api/auth/`; `server_tokens off`, `Permissions-Policy`.
- Login: resposta única + bcrypt dummy. Refresh: rotação atômica + detecção de reuso (janela 10 s). Senha: 10+ caracteres, sem senhas comuns/dados do cadastro.
- Docs: `docs/config/HARDENING_VPS.md` (runbook), `DECISION-023`, `ERR-0097..0100`, `PLAN-0042`.

## Áreas afetadas
`apps/api/src/{lib,routes}`, `apps/web/src/lib/auth.ts` e 2 telas de senha, `nginx/nginx.conf`, `.env.docker.example`, `sfk.toml`, `docs/`, `memory/`. **Zero migration.**

## Validações
`apps/api` 193/193 (26 novos); `tsc -b` api+web; `eslint`; `nginx -t`; rebuild + validação ao vivo com contas de teste (todas OK, contas removidas).

## Riscos/observações
- Mensagem de login muda; senhas novas mais rígidas; ADMIN perde poder sobre ADMIN/MASTER (intencional).
- Onda 6 (token fora do `localStorage`) adiada até o `PLAN-0019` (decisão do usuário); MFA (antiga Onda 8) virou melhoria futura no `PLAN-0043`. HTTPS continua dependendo de domínio (`PLAN-0019`).
