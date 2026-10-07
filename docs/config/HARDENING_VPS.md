# Hardening da VPS / servidor — checklist de segurança (PLAN-0042, Onda 7b)

> **Runbook, não script.** Nada daqui foi aplicado no host automaticamente: cada item mexe em
> rede/SSH/pacotes e pode trancar você para fora. Aplique um por vez, **mantendo uma segunda sessão
> SSH aberta** até confirmar que a nova regra funciona. Nunca coloque valores de segredo neste arquivo.

Estado do app (já no repositório): rate limit de login por IP+e-mail **e por conta**, `limit_req` no nginx
para `/api/auth/`, IP real confiável (`X-Forwarded-For` sobrescrito), hierarquia MASTER > ADMIN, detecção
de reuso de refresh token, política de senha (10+ caracteres, sem senhas comuns). O que segue é a camada
**do servidor**, que o código não cobre.

## 1. Firewall (ufw) — só o necessário
```bash
sudo ufw default deny incoming && sudo ufw default allow outgoing
sudo ufw limit 22/tcp          # SSH com limite de tentativas
sudo ufw allow 80/tcp          # nginx (HTTP; vira redirect para HTTPS quando houver TLS)
sudo ufw allow 443/tcp         # só depois do PLAN-0019
sudo ufw enable && sudo ufw status verbose
```
Atenção: o Docker publica portas **por fora do ufw** (regras próprias no iptables). Confira que
`docker compose ps` só publica `80` (e `443`): hoje `postgres`, `api` e `web` **não** têm porta publicada
— mantenha assim. Nunca adicionar `ports:` ao Postgres.

## 2. SSH
`/etc/ssh/sshd_config.d/99-hardening.conf`:
```
PasswordAuthentication no
PermitRootLogin no
PubkeyAuthentication yes
MaxAuthTries 3
AllowUsers jbsystemas
```
Antes de recarregar (`sudo sshd -t && sudo systemctl reload ssh`), confirme que a **chave pública** do usuário
está em `~/.ssh/authorized_keys` e teste o login por chave em outra janela.

## 3. fail2ban (SSH + opcionalmente login do site)
```bash
sudo apt install fail2ban
# /etc/fail2ban/jail.d/sshd.local →  [sshd] enabled = true / maxretry = 4 / bantime = 1h
```
Para o site (opcional): filtro lendo o log do nginx para `POST /api/auth/login` com 401/429 repetidos
(o `limit_req` do nginx já devolve 429).

## 4. Atualizações automáticas de segurança
```bash
sudo apt install unattended-upgrades && sudo dpkg-reconfigure -plow unattended-upgrades
```
Imagens Docker: reconstruir periodicamente (`docker compose build --pull`) para receber correções do
`node:*-alpine`/`nginx:alpine`/Postgres; rodar `npm audit` nos dois apps antes de cada deploy.

## 5. TLS / HTTPS (depende de domínio — `PLAN-0019`)
Sem HTTPS, senha e token trafegam em texto puro: **é o maior risco restante**, acima de qualquer detalhe
do código. Quando houver domínio apontando para a VPS:
1. `certbot` (Let's Encrypt) com o plugin webroot/nginx; renovação automática (`certbot.timer`).
2. nginx: `listen 443 ssl http2;`, redirecionar `80 → 443`, `ssl_protocols TLSv1.2 TLSv1.3;`,
   `add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;`.
3. `.env`: `TLS_ENABLED=true` (cookie de refresh passa a `Secure`), `APP_WEB_URL`/`CORS_ORIGIN` com `https://`.
4. Recriar `api` (`docker compose up -d api` — `restart` não relê o `.env`).

## 6. Segredos e backups
- `.env` com `chmod 600`, fora do git (já é). Rotação de `JWT_SECRET` invalida todas as sessões — aceitável e
  recomendada se houver suspeita de vazamento.
- Backup (`scripts/backup.sh`): reavaliar cron + cópia **fora do servidor e cifrada** antes de entrar dado real
  de clientes (hoje o banco só tem dados de teste — `DECISION-022`).
- Apagar quando não forem mais necessários: `/srv/backups/jlr_beauty/emergencia-20261003` e
  `env-pre-PLAN-0039.bak` (contêm PII e senhas antigas).

## 7. Monitoramento mínimo
- Revisar `audit_logs` por `LOGIN_FAILED` em rajada, `USER_ACCESS_DENIED`, `REFRESH_TOKEN_REUSE`
  (sinal de token roubado) e `ROLE_CHANGE`.
- `docker compose logs api | grep -i "Reuso de refresh"`.
