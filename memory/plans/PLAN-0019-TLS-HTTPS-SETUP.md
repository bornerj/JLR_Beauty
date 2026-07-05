# PLAN-0019 — TLS/HTTPS em Produção (SEC-30)

**Status:** ⏸️ BLOCKED — aguardando domínio (Let's Encrypt não emite certificado para IP puro)
**Data Início:** 2026-07-05 (desmembrado do PLAN-0018, Onda 4)
**Escopo:** `nginx/production.conf`, `docker-compose.yml`, `.env` de produção
**Razão:** SEC-30 — produção do JLR Beauty roda em HTTP puro, sem TLS/domínio configurado

---

## Contexto

Durante a validação final (Onda 4) do `PLAN-0018-DONE-SECURITY-CRITICAL-ENDPOINTS-RLS-MITIGATION.md`, ao montar um penetration test replicando de ponta a ponta o incidente de segurança que motivou aquele plano (credencial capturada via sniffer + acesso direto ao backend), foi necessário verificar o canal de transporte. Constatação:

- `nginx/production.conf` só tem `listen 80;` — nenhuma configuração TLS/SSL
- `docs/config/DEPLOY_VPS.md` documenta o SSL via Certbot como etapa **opcional, pós-deploy** ("quando tiver domínio")
- **Confirmado diretamente com o usuário em 2026-07-05:** o servidor de produção real ainda não tem domínio e roda em HTTP puro

## Por que isso é provavelmente a causa raiz real do incidente original

Se o tráfego nunca foi criptografado, um "sniffer" não precisou de nenhuma técnica sofisticada de MITM (ARP spoofing, proxy malicioso, DNS spoofing, etc.) — bastou capturar pacotes HTTP em texto claro em qualquer ponto da rede (Wi-Fi público, roteador comprometido, ISP, ou até o próprio provedor de hospedagem) para obter login, senha e o token JWT do header `Authorization`.

Todo o hardening feito no PLAN-0018 (HMAC em order tracking, rate limits, RLS, JWT de 15min, timing jitter) protege contra o **uso** de uma credencial já roubada — nenhum deles impede o **roubo em si** se o canal de transporte não for criptografado. Este plano ataca a causa raiz; o PLAN-0018 atacou os sintomas/superfície de exploração pós-roubo.

## Por que está bloqueado

Let's Encrypt (Certbot) — o mecanismo de certificado gratuito já documentado no projeto — **não emite certificado para IP puro**, apenas para domínios com DNS apontado. Sem esse pré-requisito, as alternativas são:
- Certificado autoassinado: tecnicamente possível, mas gera warnings de segurança no browser para usuários reais — não resolve o problema de produção.
- Comprar/registrar um domínio: pré-requisito real, decisão e ação do usuário, fora do que pode ser feito neste ambiente de desenvolvimento local.

**Este plano fica em espera até o usuário ter um domínio com DNS apontado para a VPS.**

---

## Plano de Execução (quando houver domínio)

### Passo 1 — DNS
Apontar o domínio (registro A) para o IP público da VPS.

### Passo 2 — Certificado (Certbot)
```bash
sudo apt install certbot python3-certbot-nginx
docker compose stop nginx
sudo certbot certonly --standalone -d seudominio.com
```

### Passo 3 — nginx: adicionar TLS + redirect
Em `nginx/production.conf`:
- Adicionar bloco `listen 443 ssl;` com `ssl_certificate`/`ssl_certificate_key` apontando para os arquivos emitidos pelo Certbot (`/etc/letsencrypt/live/seudominio.com/`)
- Adicionar bloco de redirecionamento: `listen 80` → `return 301 https://$host$request_uri;`
- Considerar HSTS a nível de nginx também (já existe a nível de app via Helmet, PLAN-0017 SEC-07 — mas nginx é a camada que efetivamente termina TLS)

### Passo 4 — docker-compose: montar volume do Certbot
Montar `/etc/letsencrypt` (host) → `/etc/letsencrypt` (container nginx) em `docker-compose.yml`, para o nginx enxergar os certificados emitidos no host.

### Passo 5 — Variáveis de ambiente
Atualizar no `.env` de produção:
- `APP_API_URL` → `https://seudominio.com`
- `APP_WEB_URL` → `https://seudominio.com`
- `CORS_ORIGIN` → `https://seudominio.com`

### Passo 6 — Renovação automática
Configurar `certbot renew` via cron (certificados Let's Encrypt expiram em 90 dias).

### Passo 7 — Revisitar SEC-27 / DECISION-012
Se a topologia final resultar em **web e api servidos por subdomínios diferentes** (ex.: `app.seudominio.com` + `api.seudominio.com`, não mais same-origin via nginx), a restrição de `Origin` obrigatório (SEC-27, revertida no PLAN-0018 por quebrar o same-origin atual) **volta a ser viável** e deve ser reavaliada.

**Importante:** antes de reativar, repetir o teste com browser real (Chrome/Firefox headless fazendo o fetch de fato) documentado em `ERR-0042` (`memory/logs/DEBUG-HISTORY.md`) — não confiar apenas em `curl`. Se web e api continuarem same-origin mesmo com domínio, SEC-27 permanece não aplicável e DECISION-012 continua válida.

### Passo 8 — Validação final
- Confirmar HTTPS funcionando (`curl -I https://seudominio.com`)
- Confirmar redirect HTTP→HTTPS funcionando
- Confirmar HSTS preload não quebra nada (já configurado a nível de app)
- Testar login/checkout reais via HTTPS
- Atualizar `docker/DEPLOY_VPS.md` se o passo a passo divergir do documentado

---

## Critérios de Aceitação

- [ ] Domínio com DNS apontado para a VPS
- [ ] Certificado Let's Encrypt emitido e válido
- [ ] nginx servindo HTTPS na porta 443
- [ ] Redirect HTTP (80) → HTTPS (443) funcionando
- [ ] `APP_API_URL`/`APP_WEB_URL`/`CORS_ORIGIN` atualizados para `https://`
- [ ] Renovação automática configurada
- [ ] SEC-27/DECISION-012 revisitado se a topologia de domínio mudar same-origin → cross-origin
- [ ] Login, checkout e fluxos autenticados validados via HTTPS real

---

## Git Record of Delivery (a preencher ao final)

- **Step 1 (Pre-commit review):** [pendente]
- **Step 2 (Commit authorization):** [pendente]
- **Step 3 (Commit confirmation):** [pendente]
- **Step 4 (Push authorization e resultado):** [pendente]
- **Push status:** PENDING

---

## Próximos Passos

1. Usuário providencia domínio + DNS apontado para a VPS
2. Retomar este plano a partir do Passo 2 (Certbot)
