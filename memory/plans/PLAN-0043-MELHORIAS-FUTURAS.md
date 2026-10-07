# PLAN-0043 — Melhorias futuras (upgrades comerciais e endurecimentos adiados)

**Status:** 🟦 BACKLOG — **nenhum item daqui é pendência do projeto.** Aberto em 2026-10-07 por decisão do usuário.
**Regra de entrada (decisão do usuário, 2026-10-07):** um item vive aqui quando é **melhoria/upgrade**, não correção. Só se investe **depois do primeiro retorno financeiro** do projeto e, quando o recurso for pedido pela cliente, ele é **negociado e pago** (escopo, prazo e valor combinados antes de começar). Nada daqui entra em sessão de trabalho por iniciativa própria.
**Como usar:** quando um item for contratado, abrir um plano próprio `PLAN-XXXX` a partir da seção dele (como o `PLAN-0041` já é para o pagamento), e marcar aqui como "contratado → PLAN-XXXX".

---

## Catálogo

| ID | Melhoria | Tipo | Depende de | Plano detalhado |
|---|---|---|---|---|
| F-1 | Pagamento com cartão dentro da aplicação (Mercado Pago, Checkout Pro) | Upgrade comercial | `PLAN-0019` (domínio/HTTPS), conta MP verificada da cliente | `PLAN-0041` (BACKLOG, 9 fases). Código já entregue e **desligado** (`MERCADOPAGO_ENABLED=false`) |
| F-2 | MFA / autenticação em dois fatores (TOTP) | Upgrade comercial | nada externo; fica mais forte com HTTPS (`PLAN-0019`) | **Seção F-2 abaixo** (desenho completo, ex-Onda 8 do `PLAN-0042`) |
| F-3 | Access token só em memória (fora do `localStorage`) | Endurecimento técnico adiado | `PLAN-0019` (HTTPS + `TLS_ENABLED=true`) | `PLAN-0042`, Onda 6 (impacto medido e passos de retomada) |

> F-1 e F-2 são **vendáveis** (a cliente pode querer e pagar). F-3 não é vendável: é defesa em profundidade que retomamos junto do HTTPS, por decisão técnica, sem cobrança separada.

### Pendência independente da contratação (já registrada no `PLAN-0041`)
Itens **P-1/P-2**: com `MERCADOPAGO_ENABLED=false` o botão "Concluir Compra" ainda aparece e falha. É correção do estado atual, não upgrade — fica no `PLAN-0041`, recomendada mesmo sem contratação.

---

## F-1 — Pagamento com cartão (resumo)
Ver `PLAN-0041`. Estado: integração pronta e desligada; falta ativação (proposta comercial, credenciais de produção da cliente, HTTPS/webhook, sandbox, produção controlada, LGPD, go-live). Memória: `DECISION-021` (adendo de 2026-10-04).

## F-2 — MFA (TOTP) — desenho
**Valor para a cliente:** mesmo com senha vazada, a conta MASTER/ADMIN não é invadida. Argumento de venda para quem opera dados de clientes (LGPD).
**Para negociar:** escopo (só equipe ou também clientes), obrigatório ou opcional, canais de recuperação, suporte a "perdi o celular".

Sem serviço externo; padrão RFC 6238 (Google Authenticator/Authy/1Password).
1. **Dados** (migration aditiva): `User.mfaEnabled Boolean @default(false)`, `User.mfaSecretEnc String?` (segredo cifrado com AES-256-GCM, chave `MFA_ENCRYPTION_KEY` no `.env`, 32 bytes), tabela `MfaRecoveryCode(userId, codeHash, usedAt)` (10 códigos de uso único, hash SHA-256).
2. **Biblioteca:** `otplib` (ou implementação própria de ~40 linhas com `crypto.createHmac`; preferir a lib mantida). Janela ±1 passo (30 s); proteger contra reuso do mesmo código (guardar `lastUsedStep`).
3. **Ativação:** `POST /auth/mfa/setup` (gera segredo + URI `otpauth://`, QR no front via lib local, sem serviço externo) → `POST /auth/mfa/confirm` (valida 1º código, ativa, devolve códigos de recuperação uma única vez).
4. **Login em 2 etapas:** senha correta + `mfaEnabled` ⇒ resposta `{ mfaRequired: true, mfaToken }` (JWT de 5 min, escopo `mfa`, **não** serve como access token) → `POST /auth/mfa/verify { mfaToken, code | recoveryCode }` ⇒ aí sim emite access + refresh. Rate limit próprio (5 tentativas/5 min por conta).
5. **Política:** obrigatório para MASTER e ADMIN (período de carência configurável), opcional para os demais; desativar/redefinir MFA só por MASTER, com auditoria; reset de senha **não** desliga o MFA.
6. **Recuperação:** códigos de recuperação + procedimento de emergência por CLI no servidor (`scripts/` rodando Prisma, só quem tem acesso ao host).
7. **UI:** Admin V2 → Segurança da conta (ativar, ver QR, regenerar códigos); tela do 2º fator no login.
8. **Testes:** vetores RFC 6238, janela, reuso, bloqueio por tentativas, fluxo ponta a ponta. **Estimativa:** ~1 sessão média. **Dependência:** nenhuma externa; fica mais forte com HTTPS (`PLAN-0019`).

**Pré-requisitos já prontos (PLAN-0042):** hierarquia MASTER > ADMIN, rate limit por conta, detecção de reuso de refresh, política de senha, auditoria. O MFA se apoia neles.

## F-3 — Token em memória (resumo)
Ver `PLAN-0042`, Onda 6. Retomar com o `PLAN-0019`.

---

## Como acrescentar uma melhoria nova
Adicionar uma linha na tabela (ID `F-n`, tipo, dependências, onde está o detalhe) e uma seção curta. Não executar nem estimar prazo/valor aqui: isso é conversa comercial.

## Git Record of Delivery
Não se aplica (plano de backlog, sem entrega própria). Cada item contratado terá o Git Record no seu plano.
