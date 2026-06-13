# Deploy na VPS — Guia Completo

Stack: Docker Compose (nginx + api + web + postgres)
Compatível com: Ubuntu 22.04+ / Debian 12+

1. Arquivos para o docker compose — onde estão
Todos na raiz ou próximos do projeto:

Arquivo	Onde	Para que serve
docker-compose.yml	            raiz	    Orquestra os 4 serviços: nginx, api, web, postgres
.env	                          raiz	    Variáveis de ambiente reais (credenciais, URLs)
.env.docker.example	            raiz	    Template para recriar o .env do zero
apps/api/Dockerfile	            apps/api	Build da API
apps/api/docker-entrypoint.sh	  apps/api	Roda migration automática no boot
apps/web/Dockerfile	            apps/web	Build do frontend
nginx/nginx.conf	              nginx/	  Proxy reverso nginx

Para subir: docker compose up -d na raiz do projeto.

# Comandos utilizados para subir/atualizar o Docker 

docker compose pull
docker compose build
docker compose up -d
docker compose ps
docker compose exec api node dist/seed.js
docker compose up -d --build web

## Após a primeira vez, O Dockerfile já compila o código durante o build, então basta reconstruir as imagens da api e do web e reiniciar:
## Na raiz do projeto 
docker compose up -d --build api web

## Rodar o seed manualmente para já persistir os defaults:
docker compose exec api node dist/seed.js

## Só o web mudou, então:
docker compose up -d --build web

## reconstruir os containers após as lateracoes
docker compose up -d --build

---

## Pré-requisitos do servidor

```bash
# Docker Engine
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Docker Compose v2 (incluso no Docker Engine moderno)
docker compose version
```

---

## 1. Clonar o repositório

```bash
git clone git@github.com:bornerj/JLR_Beauty.git /opt/jlrbeauty
cd /opt/jlrbeauty
```

---

## 2. Configurar variáveis de ambiente

```bash
cp .env.docker.example .env
nano .env
```

Campos obrigatórios a preencher:
- `POSTGRES_PASSWORD` — senha do banco (min 20 caracteres)
- `DATABASE_URL` — use a mesma senha: `postgresql://jlrbeauty:SUA_SENHA@postgres:5432/jlrbeauty`
- `JWT_SECRET` — string aleatória com mínimo 32 caracteres
- `APP_API_URL` / `APP_WEB_URL` / `CORS_ORIGIN` — URL pública do servidor (ex: `http://SEU_IP` ou `https://seudominio.com`)
- `MASTER_EMAIL` / `MASTER_PASSWORD` — credenciais do usuário master

---

## 3. Subir o sistema

```bash
# Build de todas as imagens e iniciar
docker compose up -d --build

# Acompanhar logs na primeira inicialização
docker compose logs -f
```

---

## 4. Popular banco com dados iniciais

As migrations são aplicadas **automaticamente** pelo `docker-entrypoint.sh` ao iniciar a API.
Só é necessário rodar o seed uma vez na primeira inicialização:

```bash
docker compose exec api npx prisma db seed
```

---

## 5. Verificar funcionamento

```bash
# Status dos containers
docker compose ps

# Health check da API (direto no container)
docker compose exec api wget -qO- http://localhost:3001/health

# Health check do banco (direto no container)
docker compose exec api wget -qO- http://localhost:3001/health/db
```

Acessar `http://SEU_IP` no navegador — site público deve carregar.

---

## Operações cotidianas

### Atualizar a aplicação

```bash
git pull
docker compose up -d --build
# migrations aplicadas automaticamente no restart da API
```

### Ver logs

```bash
docker compose logs api         # logs da API
docker compose logs nginx       # logs do nginx
docker compose logs postgres    # logs do banco
docker compose logs -f          # todos em tempo real
```

### Backup do PostgreSQL

```bash
docker compose exec postgres pg_dump -U jlrbeauty jlrbeauty > backup_$(date +%Y%m%d).sql
```

### Restaurar backup

```bash
cat backup_20260101.sql | docker compose exec -T postgres psql -U jlrbeauty jlrbeauty
```

### Reiniciar serviço específico

```bash
docker compose restart api
```

---

## SSL com Certbot (quando tiver domínio)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Parar nginx do Docker temporariamente
docker compose stop nginx

# Obter certificado
sudo certbot certonly --standalone -d seudominio.com

# Atualizar nginx/nginx.conf para porta 443 e adicionar ssl_certificate
# Depois:
docker compose up -d nginx
```

Adicionar ao `nginx/nginx.conf` após obter os certificados:

```nginx
listen 443 ssl;
ssl_certificate     /etc/letsencrypt/live/seudominio.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/seudominio.com/privkey.pem;
```

E adicionar um bloco de redirecionamento HTTP → HTTPS.

---

## Portas usadas

| Serviço  | Porta interna | Porta exposta |
|----------|---------------|---------------|
| nginx    | 80            | 80 (→ internet) |
| api      | 3001          | não exposta   |
| web      | 80            | não exposta   |
| postgres | 5432          | não exposta   |

---

## Volumes Docker (dados persistentes)

| Volume         | Conteúdo                      |
|----------------|-------------------------------|
| `postgres_data`| Dados do PostgreSQL           |
| `uploads_data` | Arquivos de upload da API     |

Os volumes ficam em `/var/lib/docker/volumes/` no host.


Pronto. O que falta para estar na VPS:

  ---
  Já pronto no código ✅

  - Docker Compose completo (4 serviços + healthchecks + volumes)
  - Migration automática no startup (docker-entrypoint.sh)
  - .env.docker.example com todos os vars documentados
  - DEPLOY_VPS.md com guia passo a passo atualizado
  - Frontend usa URL relativa (/api/...) — funciona sem configuração extra no nginx
  - Código no GitHub: github.com/bornerj/JLR_Beauty

  ---
  O que você precisa fazer na VPS

  1. Provisionar o servidor
  - Ubuntu 22.04+ ou Debian 12+
  - Mínimo: 1 vCPU, 1GB RAM, 20GB disco
  - Abrir portas: 22 (SSH), 80 (HTTP), 443 (HTTPS futuramente)

  2. Instalar Docker
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker $USER

  3. Adicionar chave SSH da VPS ao GitHub (para clonar via SSH)
  ssh-keygen -t ed25519
  cat ~/.ssh/id_ed25519.pub  # adicionar nas Deploy Keys do repo

  4. Clonar e configurar
  git clone git@github.com:bornerj/JLR_Beauty.git /opt/jlrbeauty
  cd /opt/jlrbeauty
  cp .env.docker.example .env
  nano .env   # preencher POSTGRES_PASSWORD, JWT_SECRET, APP_WEB_URL, MASTER_EMAIL/PASSWORD

  5. Subir
  docker compose up -d --build
  docker compose exec api npx prisma db seed

  ---
Opcional (pós-deploy)

  - SSL: Certbot + nginx quando tiver domínio (guia já está no DEPLOY_VPS.md)
  - Stripe: ativar STRIPE_ENABLED=true e preencher as chaves
  - Z-API: configurar ZAPI_WEBHOOK_SECRET

✻ Worked for 1m 18s

※ recap: Migramos o projeto JLR Beauty para Docker + PostgreSQL com infraestrutura completa pronta para VPS. Tudo commitado e no GitHub — próximo passo é provisionar o servidor e 
  rodar o deploy. (disable recaps in /config)

