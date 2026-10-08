# Deploy com Kamal + nginx interno — ensaio na VM (Multipass) e implantação na VPS

> **Para quem é:** o roteiro a seguir quando testarmos na **VM Multipass** e, depois, na **VPS**. Leia inteiro antes de começar.
> **Origem:** `DECISION-024` (alvo de produção) e `PLAN-0042` (hardening de auth). Segurança do host: `docs/config/HARDENING_VPS.md`.
> **Status do documento:** **rascunho de projeto, ainda NÃO validado na prática.** Tudo o que depende de comportamento do Kamal que não foi
> confirmado está marcado **[A VALIDAR]**. A VM existe justamente para validar esses pontos; quando um ponto for confirmado ou
> refutado, atualize este arquivo e registre o resultado na seção 11.
> Segredos: **nunca** colocar valores aqui nem no git — só nomes de variáveis.

---

## 1. Arquitetura alvo

```
Internet ──► [proxy de borda: kamal-proxy  (ou Traefik, ver D1)]  :80/:443  (TLS aqui)
                         │  rede Docker "kamal" (interna)
                         ▼
                    [nginx]  :80   ← NÃO publica porta; só o proxy de borda fala com ele
                     │      └─ /api/*, /uploads/*  ──► [api]  :3001
                     └─ /*  (SPA estática)         ──► [web]  :80
                                                         │
                                                    [postgres] :5432  (só rede interna)
```

Princípios: (1) só o proxy de borda enxerga a internet; (2) o nginx só conversa com o proxy de borda e com api/web; (3) o Postgres nunca
publica porta; (4) TLS termina no proxy de borda; (5) o IP real do cliente precisa chegar até a API (seção 6).

---

## 2. Decisões pendentes (resolver na VM, nesta ordem)

| ID | Pergunta | Recomendação inicial | Como decidir |
|---|---|---|---|
| **D1** | Qual proxy de borda? **Kamal 2.x usa `kamal-proxy` por padrão; o Traefik foi substituído** (só roda como *acessório*). Kamal 1.x usava Traefik. | **`kamal-proxy`** (padrão, suportado, TLS Let's Encrypt embutido). Traefik só se houver motivo concreto. | Confirmar a versão do Kamal que será usada (`kamal version`). A `DECISION-024` cita Traefik; se D1 = kamal-proxy, atualizar a decisão. |
| **D2** | Como o nginx alcança `api` e `web` se cada release recebe nome novo de container? | Dar um **alias de rede fixo** (`api`, `web`) a cada container na rede `kamal` — via `options` do servidor. **[A VALIDAR]** que `options: network-alias: ...` funciona na versão usada. | Teste 3.1 da seção 8. |
| **D3** | Quantos "serviços Kamal"? O Kamal faz deploy de **1 imagem por `deploy.yml`**; o projeto tem 3 imagens (`api`, `web`, `nginx`). | **Opção A:** 3 arquivos de deploy (`config/deploy.api.yml`, `deploy.web.yml`, `deploy.nginx.yml`), só o nginx com `proxy:`. **Opção B (plano B):** a API serve a SPA e o nginx sai — mais simples e nativo do Kamal, mas **foge da arquitetura pedida**. | Tentar A na VM; se o alias/rede ficarem frágeis, avaliar B com o usuário. |
| **D4** | Postgres: acessório do Kamal ou serviço gerenciado? | Acessório no ensaio. Na VPS, avaliar backup/restore antes de dado real. | Seção 7. |
| **D5** | Registry de imagens (Docker Hub privado, GHCR, registry local na VM). | GHCR ou registry local no ensaio. | Credenciais só em `.kamal/secrets`. |

---

## 3. Pré-requisitos

**Máquina de controle (notebook do usuário):**
- Kamal instalado (gem Ruby **ou** a imagem Docker oficial do Kamal). *Hoje não há Ruby nem Kamal nesta máquina.* **[A VALIDAR]** o método de instalação preferido.
- Docker local (para construir as imagens) e acesso SSH por chave à VM/VPS.
- Registry configurado (D5).

**Servidor de destino (VM ou VPS):** Ubuntu LTS, Docker Engine, usuário com permissão de Docker, SSH por chave, portas 80/443 livres para o proxy de borda.

**Só para a VPS:** domínio com DNS apontando para o IP da VPS (**pré-requisito do TLS** — `PLAN-0019`).

---

## 4. Fase A — Ensaio na VM Multipass

### 4.1 Criar a VM
```bash
multipass launch 24.04 --name jlr-vm --cpus 2 --memory 4G --disk 20G
multipass info jlr-vm            # anote o IPv4 (rede 10.22.190.x neste servidor)
multipass exec jlr-vm -- sudo apt-get update
# instalar Docker na VM (script oficial ou apt), depois:
multipass exec jlr-vm -- sudo usermod -aG docker ubuntu
```
Coloque a **chave pública SSH** do notebook em `~ubuntu/.ssh/authorized_keys` da VM e teste `ssh ubuntu@<IP-da-VM>`.

### 4.2 Particularidades da VM (diferem da VPS)
- **Sem domínio público → sem Let's Encrypt.** Na VM use `proxy.ssl: false` (HTTP). O TLS só será testado na VPS.
- ⚠ **Armadilha de segurança:** com `ssl: false`, o `kamal-proxy` **repassa por padrão** o `X-Forwarded-For` enviado pelo cliente (com SSL ligado ele não repassa).
  Isso reabriria o furo do `ERR-0098` (IP falsificável). **Fixe `proxy.forward_headers: false` também na VM** para que o ensaio reproduza a produção.
  **[A VALIDAR]** que, com `false`, o proxy substitui o cabeçalho pelo IP do cliente.
- A VM deve receber a mesma "carga simulada" planejada pelo usuário (script de carga contra `/` e `/api/auth/*`).

### 4.3 Montar o `config/deploy*.yml` (esboço — **[A VALIDAR]** cada chave com `kamal docs` da versão instalada)
Nomes de chaves abaixo confirmados na documentação do Kamal 2: `service`, `image`, `servers`, `registry`, `env`, `builder`, `ssh`, `proxy`
(`host`, `ssl`, `app_port` — padrão **80**, `healthcheck`, `forward_headers`, `response_timeout`), `accessories` (`image`, `host`, `port`, `env`,
`files`, `directories`, `volumes`, `network` — padrão `kamal`, `cmd`). Valores e a forma de `options` abaixo **não** estão confirmados.

```yaml
# config/deploy.nginx.yml — o único serviço com proxy de borda (esboço)
service: jlr-nginx
image: <registry>/jlr-nginx
servers:
  web:
    - <IP-da-VM>
registry:
  server: <registry>
  username: <usuario>
  password:
    - KAMAL_REGISTRY_PASSWORD        # vem de .kamal/secrets
proxy:
  app_port: 80
  ssl: false                         # VM; na VPS: true + host
  # host: app.exemplo.com.br         # VPS
  forward_headers: false             # ver 4.2
  healthcheck:
    path: /up                        # o nginx precisa responder 200 em /up  [A VALIDAR o padrão da versão]
```
```yaml
# config/deploy.api.yml / deploy.web.yml — sem proxy de borda; alias de rede fixo (D2)  [A VALIDAR]
service: jlr-api
image: <registry>/jlr-api
servers:
  web:
    hosts: [<IP-da-VM>]
    proxy: false                     # [A VALIDAR] sintaxe para desligar o proxy no role
    options:
      network-alias: api             # [A VALIDAR] repasse de --network-alias ao docker run
env:
  clear:
    NODE_ENV: production
    PORT: 3001
    TLS_ENABLED: "false"             # VPS: "true"
  secret:
    - DATABASE_URL
    - JWT_SECRET
    # ... demais nomes em sfk.toml → [environments.docker] (ver seção 7)
```
- A API hoje roda `prisma migrate deploy` na subida (`docker-entrypoint.sh`); como cada release sobe um container por vez, não há migração concorrente.
- O `web` e o `nginx` ganham os Dockerfiles/`config` equivalentes (o nginx hoje usa a imagem `nginx:alpine` montando `nginx/`; no Kamal o arquivo de configuração precisa ir **dentro da imagem** ou como `files`). **[A VALIDAR]**

---

## 5. Fase B — `nginx` de produção (atrás do proxy de borda)

Diferenças em relação ao `nginx/nginx.conf` atual (UAT):

1. **Sem porta publicada** (hoje o compose tem `"80:80"` — isso some; quem escuta fora é o proxy de borda).
2. **Endpoint `/up`** para o health check do proxy: `location = /up { access_log off; return 200 "ok"; }`.
3. **IP real do cliente (obrigatório — seção 6).**
4. `X-Forwarded-Proto`: atrás do TLS do proxy, repassar o valor recebido (`proxy_set_header X-Forwarded-Proto $http_x_forwarded_proto;`) em vez de `$scheme`.
5. Manter: `server_tokens off`, `limit_req` em `/api/auth/`, `proxy_set_header X-Forwarded-For $remote_addr` (correto **depois** do `real_ip`).
6. HSTS: o Helmet da API já envia; ou adicionar `add_header Strict-Transport-Security ...` só quando houver TLS real.
7. `upstream`/`proxy_pass` apontando para os **aliases fixos** (`api:3001`, `web:80`) — nomes de container com versão NÃO servem (D2).

---

## 6. IP real do cliente atrás do proxy de borda (**crítico**)

Sem tratar isto, o nginx vê sempre o IP do proxy de borda: o `limit_req` (por IP) e o rate limit/AuditLog da API passam a tratar **todos os
usuários como um só** — um abusador trava o login de todos (`DECISION-024`, item 4).

No bloco `server` do nginx de produção:
```nginx
set_real_ip_from <sub-rede da rede Docker "kamal">;   # descubra: docker network inspect kamal
real_ip_header   X-Forwarded-For;
real_ip_recursive on;
```
- **Não** use `0.0.0.0/0` em `set_real_ip_from`: qualquer um voltaria a forjar o IP.
- O proxy de borda deve **sobrescrever** o `X-Forwarded-For` vindo da internet: kamal-proxy com `forward_headers: false` (padrão com SSL ligado); Traefik sem `forwardedHeaders.trustedIPs` no entrypoint.
- A API **não muda**: usa `req.ip` com `trust proxy 1` (o único salto até ela é o nginx).

---

## 7. Dados, segredos e acessórios

**Variáveis (nomes; valores em `.kamal/secrets`, fora do git):** lista completa em `sfk.toml → [environments.docker]`. Mínimo para subir:
`POSTGRES_PASSWORD`, `DB_API_RW_PASSWORD`, `DB_API_RO_PASSWORD`, `DATABASE_URL`, `DATABASE_MIGRATION_URL`, `JWT_SECRET`, `MASTER_EMAIL`,
`MASTER_PASSWORD`, `CORS_ORIGIN`, `APP_WEB_URL`, `APP_API_URL`, `TLS_ENABLED`, `BREVO_*`. Pagamento (`MERCADOPAGO_*`) fica `ENABLED=false` (`PLAN-0043`).
- Garantir `.kamal/secrets*` no `.gitignore` **antes** do primeiro `kamal setup`. Gerar segredos com `openssl rand -hex 24` (senhas) e 32+ caracteres para o `JWT_SECRET`.
- `CORS_ORIGIN` e `APP_WEB_URL` com o domínio `https://` na VPS (na VM, `http://<IP-da-VM>`).

**Postgres como acessório (D4):** imagem **customizada** (Debian + pgaudit, `docker/postgres/Dockerfile`) → construir e subir para o registry; `accessories.postgres` com
`image`, `host`, `directories` para os dados, `files` para o `init-api-users.sh`, `env` (`secret`), **sem** `port` publicada (a doc do Kamal avisa das implicações de segurança de `port`).
Acessórios **não têm zero-downtime**. Boot: `kamal accessory boot postgres`. O init das roles só roda em diretório de dados **vazio** (`PLAN-0039`).

**Uploads da API:** volume persistente (`volumes`/`directories` no serviço da API) montado em `/app/uploads`, hoje `JLR_UPLOADS_DIR`.

**Backup:** o `scripts/backup.sh` assume compose; adaptar para `docker exec` no container do Postgres/acessório e testar o `--verify`. Backup cifrado **fora** da VPS antes de dado real.

---

## 8. Fase C — Validação na VM (checklist; marque e registre na seção 11)

1. **D2/D3:** nginx alcança `api` e `web` pelos aliases após **dois deploys seguidos** (nomes de container mudam a cada release).
2. `kamal setup` e `kamal deploy` terminam; `/up` = 200; o site abre pelo IP da VM; login MASTER funciona.
3. **IP real (seção 6):** requisição com `X-Forwarded-For: 6.6.6.6` **não** vira o IP em `audit_logs`; dois clientes (notebook e celular) aparecem com **IPs diferentes**.
4. **Rajada em `/api/auth/`** → 429 **só** para o IP abusivo, não para os demais.
5. **Rolling deploy:** durante um `kamal deploy`, o site continua respondendo (sem 502 prolongado); a migração roda uma vez.
6. **Rollback:** `kamal rollback <versão>` volta e o site responde.
7. **Reboot da VM:** containers e proxy voltam sozinhos; dados do Postgres e uploads intactos.
8. **Persistência:** `kamal accessory reboot postgres` não perde dados; restaurar um backup numa VM limpa.
9. Cookie de refresh: com `TLS_ENABLED=false` funciona em HTTP (limitação conhecida, `ERR-0067`); com TLS (VPS) deve vir `Secure`.
10. **Carga simulada** (planejada pelo usuário): sem 5xx, `limit_req` coerente, sem vazamento de memória evidente.

---

## 9. Fase D — Implantação na VPS (somente depois da seção 8 aprovada)

Diferenças em relação à VM:
1. **Domínio** apontando para a VPS (TTL baixo antes da virada); `proxy.host` preenchido e `proxy.ssl: true`. Let's Encrypt via kamal-proxy **exige um único servidor, `host` definido e a porta 443 aberta** (documentação do Kamal).
2. `TLS_ENABLED=true`, `CORS_ORIGIN`/`APP_WEB_URL`/`APP_API_URL` em `https://`, `MERCADOPAGO_ENABLED=false`.
3. Host endurecido conforme `docs/config/HARDENING_VPS.md` (ufw, SSH por chave sem root, fail2ban, atualizações automáticas, backup externo cifrado).
4. Segredos **novos** (nunca reaproveitar os do UAT/VM); `MASTER_PASSWORD` forte e trocada após o primeiro login.
5. Repetir os testes 3, 4, 6 e 7 da seção 8 **na VPS** (o IP real e o 429 precisam ser reconferidos com o proxy real).
6. **Virada:** subir e validar pelo domínio de teste → trocar o DNS → monitorar `audit_logs` (`LOGIN_FAILED`, `REFRESH_TOKEN_REUSE`, `USER_ACCESS_DENIED`) e logs por 24 h.
7. **Plano de volta:** manter o UAT/ambiente anterior no ar até o fim da janela; `kamal rollback` para versão; restauração de backup documentada e testada.

---

## 10. Comandos úteis do Kamal (conferir com `kamal --help` na versão instalada)
```bash
kamal setup                       # primeira vez: instala Docker se preciso, sobe proxy, acessórios e app
kamal deploy                      # nova versão (rolling)
kamal rollback <versão>           # volta a uma versão anterior
kamal app logs -f                 # logs do app
kamal app exec '<comando>'        # comando dentro do container
kamal accessory boot|reboot|logs postgres
kamal details                     # estado dos containers
kamal lock release                # destrava um deploy interrompido
```

---

## 11. Registro do ensaio (preencher durante a execução)

| Data | Ponto validado (ID da seção 8 / D1-D5) | Resultado | Ação / ajuste neste documento |
|---|---|---|---|
| | | | |

Qualquer falha de código ou configuração achada no ensaio vira `ERR-XXXX` em `memory/logs/DEBUG-HISTORY.md`; mudança de infraestrutura entra em `memory/logs/BUILD-HISTORY.md`; a escolha de D1–D5 vira `DECISION-XXX`.

---

## Fontes consultadas (2026-10-07)
- Kamal — configuração do proxy: https://kamal-deploy.org/docs/configuration/proxy/ (kamal-proxy padrão; `app_port` 80; `forward_headers`; Let's Encrypt exige um servidor, `host` e porta 443)
- Kamal — acessórios: https://kamal-deploy.org/docs/configuration/accessories/ (rede `kamal`, `port`, `directories`, `files`; sem zero-downtime)
- Kamal — visão geral: https://kamal-deploy.org/docs/configuration/overview/ (`.kamal/secrets`)
- Kamal — migração 1.x → 2.0: https://kamal-deploy.org/docs/upgrading/overview/ (Traefik substituído pelo kamal-proxy; Traefik possível como acessório; rede `kamal`)
- Não confirmados na documentação lida (por isso **[A VALIDAR]**): caminho padrão do health check, `options: network-alias`, `proxy: false` por role, vários serviços atrás do mesmo proxy.
