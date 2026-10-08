# Hardening da VPS / servidor — checklist de segurança (PLAN-0042, Onda 7b)

> **Escopo (`DECISION-024`, 2026-10-07):** este servidor Ubuntu é **UAT/desenvolvimento** do usuário; a **produção** será uma
> **VPS com Traefik + Kamal**, com o nginx do projeto só na rede interna. Por isso o hardening do UAT é **proporcional**
> (seção "Estado do servidor de UAT") e o que importa de verdade é a seção **"Produção (VPS + Traefik + Kamal)"** no fim.
> As seções 1-7 abaixo são o checklist completo, a aplicar na VPS.

## Estado do servidor de UAT (verificado em 2026-10-07)
| Item | Estado | Decisão |
|---|---|---|
| Firewall `ufw` | ativo; entrada negada; `22`/`80` só de `10.10.10.0/24`; Tailscale liberado | ✅ suficiente |
| SSH | só chave, sem senha, sem root (`00-hardening.conf`) | ✅ suficiente |
| Atualizações automáticas | `unattended-upgrades` ativo | ✅ |
| `.env` | `chmod 600` | ✅ |
| fail2ban / `MaxAuthTries` / `AllowUsers` | não aplicados | ⏭ dispensado no UAT (só LAN/Tailscale alcançam o SSH); aplicar na VPS |
| Porta 80 do Docker (`"80:80"`) | **contorna o ufw**: o site abre pelo Wi-Fi `192.168.0.14` (confirmado) | ⚠ **risco aceito** no UAT; na produção o nginx não publica porta |
| Backup | não configurado | ⏭ dispensado enquanto só há dados de teste |

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

## 5. TLS / HTTPS (depende de domínio — `PLAN-0019`) — na produção é do Traefik
> Os passos com `certbot`/nginx abaixo valem só para um deploy **sem** Traefik. Com Traefik (`DECISION-024`), o certificado é emitido e renovado pelo próprio Traefik; ver "Produção" no fim.
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

---

## Produção (VPS + Traefik + Kamal) — `DECISION-024`

> **Roteiro operacional completo (VM Multipass → VPS): `docs/deploy/DEPLOY_KAMAL_NGINX_VM_E_VPS.md`.** Esta seção é o resumo de segurança; o passo a passo, as decisões pendentes (D1–D5) e o checklist de validação estão naquele documento.

Topologia alvo: **internet → Traefik (80/443) → rede interna Docker → nginx → api/web → Postgres**. O nginx **não publica porta**.

1. **TLS no Traefik:** entrypoints `web` (80, redirect para `websecure`) e `websecure` (443); resolvedor ACME (Let's Encrypt)
   com armazenamento persistente; HSTS via middleware de headers. Domínio apontando para a VPS é pré-requisito (`PLAN-0019`).
2. **Remover `ports:` do nginx** no compose de produção (hoje `"80:80"`); só o Traefik escuta fora. O Postgres nunca publica porta.
3. **IP real do cliente (obrigatório — senão o rate limit trava todos juntos):** atrás do Traefik o `$remote_addr` do nginx
   passa a ser o IP do Traefik. Configurar no nginx:
   ```
   set_real_ip_from <sub-rede da rede Docker do Traefik>;
   real_ip_header X-Forwarded-For;
   real_ip_recursive on;
   ```
   e garantir que o Traefik **sobrescreva** o `X-Forwarded-For` vindo da internet (não listar IPs não confiáveis em
   `forwardedHeaders.trustedIPs`). O nginx continua repassando `X-Forwarded-For $remote_addr` para a API (já correto).
   **Validar** repetindo o teste do `ERR-0098`: requisição com `X-Forwarded-For: 6.6.6.6` não pode virar o IP gravado em
   `audit_logs`, e dois clientes distintos devem aparecer com IPs distintos.
4. **Kamal:** secrets fora do repositório (`.kamal/secrets` / variáveis do ambiente), `TLS_ENABLED=true`,
   `APP_WEB_URL`/`CORS_ORIGIN` com `https://`. (Kamal 1.x usa Traefik; Kamal 2 usa o `kamal-proxy` — o requisito de IP real é o mesmo.)
5. **Host da VPS:** `ufw` (22 restrito + 80/443), SSH só por chave sem root + `MaxAuthTries 3`, `fail2ban`, `unattended-upgrades`,
   backup cifrado fora do servidor (seções 1-4 e 6 acima).
6. **Ensaio na VM Multipass:** reproduzir esta lista na VM antes da VPS, inclusive o teste de `X-Forwarded-For` forjado e a
   rajada em `/api/auth/` (esperado: 429 só para o IP abusivo, não para todos).
