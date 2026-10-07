# DECISION-023 — Autenticação própria mantida e endurecida; sem provedor externo (Auth0/Supabase/etc.)

Status: ACTIVE
Date: 2026-10-07

## Contexto

Um consultor recomendou não usar login próprio e migrar para um provedor de identidade (Auth0,
Supabase Auth, etc.). O diagnóstico `@security-auditor` de 2026-10-07 mostrou que a base (bcrypt custo 12,
JWT de 15 min, refresh opaco hasheado e rotacionado, autorização relida do banco a cada requisição) é
sólida, e que os riscos reais estavam na **autorização da API** (ADMIN atingia MASTER por `PATCH`/`DELETE
/users/:id`) e na **infraestrutura** (IP falsificável via `X-Forwarded-For`, HTTP sem TLS) — problemas que
um provedor externo **não resolveria**, pois vivem na API e no servidor do projeto.

## Decisão

1. **Manter o auth próprio** e maximizar a segurança dentro do que a VPS permite (`PLAN-0042`).
2. **Não migrar** para serviço externo agora (decisão do usuário, 2026-10-07): evita dependência de
   fornecedor, custo por usuário ativo e uma migração estrutural (usuários, papéis, RLS, middleware).
3. Hierarquia de contas **MASTER > ADMIN > demais** aplicada em todas as rotas de `/users`; sempre há ao
   menos um MASTER ativo.
4. IP do cliente = `req.ip` (nginx sobrescreve `X-Forwarded-For`); limites por IP+e-mail **e** por conta.
5. MFA (TOTP) fica como **opcional documentado** (`PLAN-0042`, Onda 8), sem serviço externo.
6. Reavaliar provedor gerenciado **somente** se surgir exigência de SSO/compliance de cliente ou ao virar SaaS
   multi-tenant real (`DECISION-018`).

## Consequências

- Manutenção do código de auth continua nossa: exige os testes de `test:auth` e revisão a cada mudança.
- O maior risco restante é infra, não código: HTTPS depende do domínio (`PLAN-0019`). Runbook em
  `docs/config/HARDENING_VPS.md`.
- Senhas novas seguem política mais rígida (10+, sem senhas comuns); contas antigas continuam logando.
