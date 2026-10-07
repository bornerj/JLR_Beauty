# PLAN-0042 — Hardening da autenticação e autorização (auth próprio, sem provedor externo)

**Status:** 🟨 PARCIAL — aprovado em 2026-10-07. **Ondas 1, 2, 3, 4, 5, 7a e 7b executadas e validadas (ao vivo + testes).** **Onda 6 ADIADA até o `PLAN-0019` (HTTPS), por decisão do usuário em 2026-10-07.** Onda 8 (MFA) **movida para o `PLAN-0043`** (melhoria futura, upgrade comercial). Sem commit (aguardando aprovação). **Escopo ativo do plano = Ondas 1-5 e 7, todas concluídas.** O plano pode virar `-DONE-` sem a Onda 6, desde que ela fique registrada como adiada (retomada em `PLAN-0019`).
**Decisão do usuário (2026-10-07):** **não migrar** para Auth0/Supabase/similar. Maximizar a segurança do auth atual, dentro do que uma VPS própria permite. MFA foi pedido como opcional e depois reclassificado como **melhoria futura/upgrade pago** (`PLAN-0043`, F-2).
**Origem:** aviso de consultor + diagnóstico `@security-auditor` de 2026-10-07 (leitura de `lib/auth.ts`, `middleware/auth.ts`, `routes/auth.ts`, `routes/users.ts`, `lib/rateLimiter.ts`, `nginx/nginx.conf`).
**Agentes de apoio:** `@security-auditor`, `@backend-specialist`, `@devops-engineer`, `@test-engineer`.
**Escopo macro:** `apps/api` (rotas de auth/usuários, rate limiter, mensagens), `apps/web` (mapa de mensagens, e na Onda 6 o armazenamento do token), `nginx/nginx.conf`, `docs/`, `memory/`. **Zero migration Prisma** nas Ondas 1-7 (a chave de rate limit é string; `AuditLog.action` é texto).

---

## STAR

**Situation (verificado no código em 2026-10-07):**
1. `PATCH /users/:id` e `DELETE /users/:id` exigem só `requireAdmin`. Um ADMIN pode trocar senha/e-mail/status de um **MASTER** (tomada de conta) ou apagá-lo. O `ERR-0093` fechou só a troca de *papel*. A troca de senha por essa rota não valida força, não revoga refresh tokens e não gera auditoria. `POST /users` deixa ADMIN criar outro ADMIN, em contradição com a regra "mudança de papel só MASTER".
2. `nginx.conf` usa `X-Forwarded-For $proxy_add_x_forwarded_for` (anexa ao valor enviado pelo cliente) e `getClientIp()` pega o **primeiro** elemento → o cliente escolhe o próprio IP. Rate limit de login (`IP::email`), de cupom, de concierge e o IP gravado no `AuditLog` são falsificáveis. Além disso não há limite por conta nem `limit_req` no nginx.
3. Login responde "usuário não cadastrado" vs "senha incorreta" (enumeração) e só roda bcrypt quando o usuário existe (canal de tempo).
4. Refresh: a rotação não é atômica (ler → atualizar) e o reuso de um token já revogado só é recusado, sem derrubar a sessão (sinal de roubo ignorado).
5. Política de senha = complexidade (aceita `Senha@123`); sem bloqueio de senhas comuns.
6. Produção em HTTP puro (`PLAN-0019`, bloqueado por domínio); access token em `localStorage`; sem MFA.

**Task:** fechar os achados 1-5 agora; deixar 6 preparado (infra/runbook) ou como onda própria; MFA como desenho opcional.
**Restrições:** nada de commit/push sem dupla aprovação; nunca exibir segredos; não alterar o host (ufw/sshd/fail2ban) sem aprovação específica; compatibilidade com usuários existentes (senhas já gravadas continuam logando); `DECISION-013/014` não afetadas.

**Result esperado:** ADMIN não consegue atingir MASTER por nenhuma rota; IP real confiável de ponta a ponta; login uniforme e sem canal de tempo; roubo de refresh token detectado; senhas comuns recusadas; testes automatizados cobrindo cada regra.

---

## Ondas

### Onda 1 — P0: bloquear escalonamento ADMIN → MASTER ✅ (ERR-0097)
Regra (função pura `lib/userGuards.ts`, testável):
- Hierarquia: MASTER > ADMIN > demais. Só MASTER altera dados sensíveis (`password`, `email`, `status`, `emailVerified`) ou exclui contas **MASTER ou ADMIN**; ADMIN só atinge contas abaixo dele (e a si mesmo, exceto `status`).
- ADMIN não pode modificar um MASTER em **nenhum** campo.
- `POST /users`: criar `ADMIN` ou `MASTER` exige MASTER.
- Senha definida por admin passa por `isStrongPassword` + política da Onda 5.
- Trocar senha/e-mail ou desativar conta → `revokeAllRefreshTokens(alvo)` + auditoria (`USER_PASSWORD_CHANGED_BY_ADMIN`, `USER_UPDATED_SENSITIVE`, `USER_DELETED`).
- [x] `lib/userGuards.ts` + 12 testes · [x] aplicado em `PATCH`, `POST`, `DELETE`, `PATCH /:id/role` · [x] novas ações em `AuditAction` · [x] guarda do último MASTER (extra).
- **Saída:** testes cobrem matriz ator×alvo×campo; validação ao vivo (ADMIN → MASTER = 403; MASTER → ADMIN = 200).

### Onda 2 — IP confiável + limites por conta ✅ (ERR-0098)
- [ ] `nginx.conf`: `X-Forwarded-For $remote_addr` (sobrescreve, não concatena) em `/api/`; `limit_req_zone` para `/api/auth/` (login/refresh/forgot/register).
- [ ] `getClientIp()` passa a usar só `req.ip` (com `trust proxy 1`, que lê o último salto escrito pelo nginx).
- [ ] Limite **por conta** (`acct::email`, teto maior que o do par IP+e-mail) para barrar ataque distribuído; registro de falha nos dois contadores.
- **Saída:** teste unitário do `getClientIp` com XFF forjado; validação ao vivo: header forjado não muda o IP gravado no `AuditLog`.

### Onda 3 — Login uniforme, sem enumeração e sem canal de tempo ✅ (ERR-0099)
- [ ] Mesma resposta/mensagem (`credenciais invalidas`) para usuário inexistente, sem hash e senha errada; bcrypt "dummy" quando o usuário não existe.
- [ ] Mapa de mensagens do front (`apps/web/src/lib/auth.ts`) com a nova mensagem. Auditoria continua distinguindo o motivo (só no servidor).
- **Saída:** teste confirma status/corpo idênticos; medição de tempo grosseira nos dois ramos.

### Onda 4 — Refresh token: rotação atômica + detecção de reuso ✅ (ERR-0100)
- [ ] Rotação via `updateMany(where: { id, revokedAt: null })` (`count === 1` ou falha) — sem corrida.
- [ ] Reuso de token revogado fora de janela de tolerância (10 s, para duas abas) ⇒ revogar **todas** as sessões do usuário + auditoria `REFRESH_TOKEN_REUSE`.
- **Saída:** testes da lógica (função pura de decisão) + validação ao vivo com cookie reutilizado.

### Onda 5 — Política de senha ✅ (ERR-0100)
- [ ] `lib/passwordPolicy.ts`: mínimo 10 caracteres para senhas **novas**, bloqueio de lista de senhas comuns/sequências/repetições, e senha igual ao e-mail/nome. Aplicar em registro, reset e senha definida por admin. Login continua aceitando `min(8)` (contas antigas).
- [ ] Mensagem clara em PT-BR no front (regras visíveis).
- **Saída:** testes de tabela (aceita/recusa).

### Onda 6 — Sessão no navegador ⏸ ADIADA até o PLAN-0019 (decisão do usuário, 2026-10-07)
- Hoje: access token (15 min) em `localStorage`. Alternativa: manter só em memória e restaurar via `/auth/refresh` ao abrir a página. Ganho: XSS não exfiltra o token. Custo: corrida de rotação entre abas (mitigada pela janela de 10 s da Onda 4) e re-login silencioso a cada reload.
- CSP atual já é estrita (`script-src 'self'`) e não foi achado XSS: o risco é hipotético (defesa em profundidade).
- **Decisão (2026-10-07): adiar até o `PLAN-0019`.** Motivos: (1) sem TLS o token já é legível na rede, então proteger contra XSS antes é pouco efetivo; (2) a Onda 6 depende muito do cookie de refresh, e o `Secure` só pode ser ligado com HTTPS (`TLS_ENABLED=true`, `ERR-0067`); (3) custo de experiência (refresh a cada F5, corrida entre abas).
- **Impacto medido no código:** `getToken()` (`apps/web/src/lib/auth.ts`) é a única porta de leitura, com 94 chamadas em ~30 telas do Admin V2 que não precisam mudar; mudam `lib/auth.ts`, o bootstrap em `main.tsx` e `RequireAdmin.tsx` (esperar o refresh antes de decidir login/painel). Zero backend, zero migration.
- **Ao retomar:** (a) token em variável de módulo, restaurado por `POST /auth/refresh` no bootstrap com tela de "carregando"; (b) `BroadcastChannel` para uma aba só fazer o refresh e avisar as outras (evita a corrida de rotação; a janela de 10 s da Onda 4 é o plano B); (c) repensar a regra do `ERR-0068` (falha de refresh não apaga sessão válida), pois sem `localStorage` ela deixa de existir; (d) conferir que o `limit_req` de `/api/auth/` comporta um refresh por carregamento.
- **Gatilho de retomada:** `PLAN-0019` concluído (HTTPS + `TLS_ENABLED=true`), ou antes disso se o painel for exposto à internet com conteúdo editável por terceiros.

### Onda 7 — Infra da VPS
- **7a ✅ (executada e validada com `nginx -t` + ao vivo):** `nginx.conf` — `server_tokens off`, remover `X-XSS-Protection` (obsoleto), `Permissions-Policy`, `limit_req` (Onda 2).
- **7b ✅ runbook escrito em `docs/config/HARDENING_VPS.md` (nada executado no host — precisa de aprovação por item):** `ufw` (80/443/22), SSH só por chave + sem root + `fail2ban`, `unattended-upgrades`, Docker sem portas internas publicadas, TLS com Let's Encrypt/certbot assim que houver domínio (`PLAN-0019`) → `TLS_ENABLED=true`, HSTS no nginx, backup cifrado fora do servidor.

### Onda 8 — MFA (TOTP) → **movida para o `PLAN-0043` (Melhorias futuras, item F-2)**
Decisão do usuário (2026-10-07): MFA é **upgrade comercial** — só será implementado depois do primeiro retorno financeiro e, se a cliente pedir, negociado e pago. O desenho completo foi movido sem alterações para `memory/plans/PLAN-0043-MELHORIAS-FUTURAS.md`. **Não faz mais parte do escopo do `PLAN-0042`.**

---

## Resultado da execução (2026-10-07)
- Testes: `apps/api` **193/193** (167 anteriores + 26 novos: `userGuards` 12, `rateLimiter` 3, `passwordPolicy` 6, `refreshPolicy` 5); `tsc -b` api e web limpos; `eslint` limpo nos arquivos alterados; `nginx -t` OK.
- Ao vivo (API real via nginx, contas de teste ADMIN/CLIENT criadas e removidas): **todas as verificações passaram** — ADMIN→MASTER 403 em senha/e-mail/status/exclusão; ADMIN não cria ADMIN nem se desativa; senha fraca recusada; troca de senha revoga sessão do alvo; login uniforme (mesmo corpo, 1352 vs 1350 ms); XFF forjado não vira IP gravado; reuso de refresh detectado e auditado (janela de 10 s respeitada); 429 do nginx sob rajada (51/70).
- Observação de ambiente: o `node_modules` do host (copiado do Zorin) perdeu bits de execução e os links de `.bin`; corrigi só o `esbuild` (`chmod +x`, fora do git). `npm run …` não funciona no host por isso; os testes foram rodados chamando `tsx` direto. No Docker o build é íntegro.
- Script da validação ao vivo: scratchpad da sessão (não versionado).

## Validação (por onda e final)
`npx tsc -b` (api e web), `npm run lint` (web), `npm run test` (api) — todos devem continuar verdes, com os testes novos incluídos; `docker compose build api web nginx` + recriação; validação ao vivo contra a API real com dados de teste revertidos; checagem de que `apps/*` não regrediu o login MASTER (usuário confirma no navegador).

## Riscos
1. **Travar o próprio admin** com regras novas → o usuário MASTER é o único que altera ADMIN/MASTER; manter ao menos 1 MASTER ativo (guard impede desativar/excluir o último MASTER).
2. **Mensagem de login única** muda o texto exibido (aceito; segurança > precisão da mensagem).
3. **`limit_req` no nginx** pode bloquear uso legítimo atrás de NAT corporativo → limites folgados (burst) e só em `/api/auth/`.
4. **Reuso de refresh** com duas abas → janela de tolerância de 10 s.
5. Contas existentes com senha fraca continuam logando; a política vale para senhas novas.

## Git Record of Delivery
- Step 1 (Pre-commit review): _pendente_
- Step 2 (Commit authorization): _pendente_
- Step 3 (Commit confirmation): _pendente_
- Step 4 (Push authorization and result): _pendente_
- Push status: PENDING
