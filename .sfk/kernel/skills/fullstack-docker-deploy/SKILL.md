---
name: fullstack-docker-deploy
description: Standardized Docker workflow for fullstack systems (frontend, backend, and database) with integrated development and direct server deployment. Includes compose templates, nginx reverse proxy, and deploy scripts.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Fullstack Docker Deploy

## Purpose
Provide a repeatable standard to package and deploy fullstack applications with:
- frontend
- backend
- PostgreSQL database
- optional reverse proxy

This skill is for self-hosted Docker servers (not Vercel/Railway).

## When To Use
- Team wants one integrated dev environment.
- Team wants one production deployment method on own server.
- Project has separate frontend/backend and persistent database needs.
- Final delivery requires reproducible deployment and rollback-ready workflow.

## Standard Workflow

### Phase 1: Scaffold Standard Files
Run:

```bash
python .agent/skills/fullstack-docker-deploy/scripts/scaffold_docker_stack.py --target .
```

Generates:
- `docker-compose.dev.yml`
- `docker-compose.prod.yml`
- `docker/backend/Dockerfile`
- `docker/frontend/Dockerfile`
- `docker/nginx/default.conf`
- `ops/deploy-docker.sh`
- `.env.example`

### Phase 2: Configure Project Variables
Create `.env` from `.env.example` and set:
- app directories
- ports
- db credentials
- frontend/backend commands
- image tag/version

### Phase 3: Integrated Development
Use:

```bash
docker compose -f docker-compose.dev.yml --env-file .env up --build
```

Requirements:
- hot reload working for frontend and backend
- backend connected to db
- data persisted in named volume

### Phase 4: Production Deploy (Own Server)
Use:

```bash
bash ops/deploy-docker.sh
```

This should:
- build and start stack with `docker-compose.prod.yml`
- keep db data in persistent volume
- run optional migration command
- perform basic health checks

### Phase 5: Verification and Handover
Verify:
- app reachable via proxy
- backend health endpoint returns success
- db connectivity and migrations are valid
- logs are clean after startup window

## Safety Rules
- Never run production with default secrets.
- Never remove db volume during routine deploy.
- Always maintain `.env.example` aligned with required env vars.
- Keep compose and Dockerfiles under version control.
- Prefer explicit tags over implicit `latest` for controlled rollback.

## Required Checklist
- [ ] `docker-compose.dev.yml` runs full stack locally.
- [ ] `docker-compose.prod.yml` runs on server without code edits.
- [ ] DB uses persistent named volume.
- [ ] Health checks exist for backend and db.
- [ ] Reverse proxy routes `/api` to backend and `/` to frontend.
- [ ] Deploy script supports non-interactive execution.
- [ ] Team documentation lists deploy and recovery commands.

## Notes
- Templates are generic by design; adapt commands and paths to your stack.
- For monorepos, set `FRONTEND_APP_DIR` and `BACKEND_APP_DIR` in `.env`.

