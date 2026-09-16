# Capítulo: E-mail transacional (Brevo)

Envio de e-mail transacional (redefinição de senha, confirmação de cadastro) via
**Brevo** (SMTP relay). Mesma conta/configuração já usada em outro projeto do usuário
(Rifa) — mesmos nomes de variável, por conveniência e consistência.

## Objetivo
- `POST /auth/forgot-password` — envia um link de redefinição de senha
  (`{APP_WEB_URL}/redefinir-senha?token=...`).
- `POST /auth/register` e `POST /auth/resend-verification` — envia um link de confirmação
  de e-mail (`{APP_WEB_URL}/confirmar-email?token=...`).

## Por que SMTP relay (não a API HTTP da Brevo)
Reaproveita o pacote `nodemailer` (já popular, zero acoplamento a um SDK específico de
provedor) — trocar de provedor de e-mail no futuro exige só trocar as variáveis de
ambiente, não o código de envio.

## Variáveis de ambiente (API)
Definir em `.env` (raiz do projeto — nunca commitado, ver `.gitignore`):

- `BREVO_SMTP_HOST` — default `smtp-relay.brevo.com` (não precisa mudar).
- `BREVO_SMTP_PORT` — default `587`.
- `BREVO_SMTP_USER` — usuário SMTP (painel Brevo > SMTP & API > SMTP).
- `BREVO_SMTP_KEY` — chave/senha SMTP (painel Brevo > SMTP & API > SMTP) — **não** é a API
  key HTTP, é a chave específica de SMTP.
- `BREVO_SENDER_EMAIL` — e-mail remetente, precisa estar verificado na conta Brevo
  (painel > Senders, Domains & Dedicated IPs).
- `BREVO_SENDER_NAME` — nome exibido como remetente (default `JLR Beauty`).

## Comportamento sem configuração (modo preview)
Se `BREVO_SMTP_USER`/`BREVO_SMTP_KEY`/`BREVO_SENDER_EMAIL` não estiverem definidos, o envio
cai em modo "preview": loga a intenção de envio (`logger.info`) e retorna normalmente, sem
lançar erro — os endpoints nunca falham por falta de configuração de e-mail. Nesse modo, em
`NODE_ENV=development`, os endpoints de forgot-password/resend-verification ainda incluem
`_dev_reset_token`/`_dev_verification_token` na resposta, pra testar o fluxo sem e-mail
nenhum.

## Onde fica o código
- `apps/api/src/lib/email.ts` — cliente genérico (`sendTransactionalEmail`), reusa
  `nodemailer` + Brevo SMTP relay.
- `apps/api/src/lib/emailTemplates.ts` — os 2 templates (`sendPasswordResetEmail`,
  `sendVerificationEmail`), HTML simples inline (sem dependência de template engine).
- Chamado a partir de `apps/api/src/routes/auth.ts` (`register`, `resend-verification`,
  `forgot-password`) — sempre disparado depois de gravar o token no banco, nunca bloqueia a
  resposta do endpoint em caso de falha de envio (`.catch()` só loga um warning).

## Domínio de envio
Pra não cair em spam, o domínio do `BREVO_SENDER_EMAIL` precisa ter os registros
SPF/DKIM configurados no DNS conforme o painel da Brevo indicar (Senders, Domains &
Dedicated IPs > Domains). Sem isso, a entrega funciona mas o destinatário pode não ver o
e-mail na caixa de entrada principal.
