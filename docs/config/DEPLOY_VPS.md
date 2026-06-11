# Deploy na VPS — Guia Completo

Stack: Docker Compose (nginx + api + web + postgres)
Compatível com: Ubuntu 22.04+ / Debian 12+

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
