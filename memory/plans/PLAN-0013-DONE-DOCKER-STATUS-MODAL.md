
# PLAN-0013 — Docker Status Modal no Admin

Status: CONCLUÍDO — 2026-06-13
Data de abertura: 2026-06-12
Pré-requisito: PLAN-0012 concluído (rotas Admin funcionando)
Contexto: O LED de status do banco estava no navbar público (sem sentido em produção Docker).
O nginx não subia automaticamente após reboot por causa de `depends_on: condition: service_healthy`
no docker-compose.yml — o Docker daemon ignora depends_on no restart automático.

---

## STAR

**Situation**
1. `docker-compose.yml`: nginx tem `depends_on: api: condition: service_healthy`.
   No reboot, o Docker daemon reinicia containers de forma independente, ignorando
   `depends_on`. nginx inicia antes da api estar healthy, falha, entra em backoff
   exponencial e não aparece no `docker compose ps` após 34 minutos.
2. O LED do banco está em `NavStatusActions.tsx` (navbar público), onde não agrega
   valor em ambiente Docker.

**Task**
1. Fix pontual: mudar `condition: service_healthy` → `condition: service_started` para
   o nginx no docker-compose.yml.
2. Feature: modal flutuante no Admin com status dos 4 serviços Docker (nginx, api,
   web, postgres) + ícone permanente no topbar com LED de alerta.

**Action**
- docker-compose.yml: 1 linha
- NavStatusActions.tsx: remover LED e hook useDbHealthStatus
- app.ts: novo endpoint `GET /health/services`
- Novo hook `useDockerHealth.ts`
- Novo componente `DockerStatusModal.tsx`
- AdminContent.tsx: ícone clicável no topbar + render do modal

**Result**
- nginx sobe automaticamente após reboot
- Admin mostra modal de status Docker ao entrar, fecha em 10s
- Ícone permanente no topbar abre/fecha o modal e exibe LED de alerta se offline

---

## Arquitetura dos 4 status

| Serviço   | Como detectado                                    | Pode ser offline? |
|-----------|---------------------------------------------------|-------------------|
| nginx     | Inferido online (se API respondeu, nginx repassou)| Nunca nesta checagem |
| api       | `GET /health` retorna 200                         | Sim — restart do container |
| web       | Inferido online (página carregou)                 | Nunca nesta checagem |
| postgres  | `GET /health/db` → `db.connected: true`           | Sim — o mais provável |

---

## Arquitetura de Arquivos

```
apps/api/src/app.ts                                  ← + GET /health/services
apps/web/src/modules/menu/components/NavStatusActions.tsx  ← remover LED
apps/web/src/modules/admin-docker-status/
├── useDockerHealth.ts                               ← hook fetch + estado
└── DockerStatusModal.tsx                            ← modal flutuante
apps/web/src/components/pages/AdminContent.tsx       ← ícone topbar + modal
docker-compose.yml                                   ← fix nginx depends_on
```

---

## Checklist de Execução

- [x] Fix docker-compose.yml — nginx condition: service_started
- [x] Remover LED de NavStatusActions.tsx
- [x] Adicionar GET /health/services em app.ts
- [x] Criar useDockerHealth.ts
- [x] Criar DockerStatusModal.tsx
- [x] Modificar AdminContent.tsx

---

## Critérios de Validação

| Critério | Como validar |
|----------|-------------|
| nginx sobe no reboot | `docker compose restart` → nginx aparece no ps |
| Modal aparece ao entrar no admin | Abrir /admin → modal visível no canto inferior direito |
| Modal fecha em 10s | Aguardar 10s → modal some automaticamente |
| Ícone no topbar | Visível no header do admin, ao lado de "Voltar ao site" |
| Ícone abre/fecha modal | Clicar no ícone → abre; clicar de novo → fecha |
| LED vermelho no ícone se offline | Simular falha no postgres → LED vermelho no topbar |
| Build limpo | `npm run build` em api e web sem erros |

---

## Git Record of Delivery

- [x] Step 1 — Pre-commit review: 46 arquivos revisados, zero erros TypeScript
- [x] Step 2 — Commit authorization: aprovado pelo usuário em 2026-06-13
- [x] Step 3 — Commit: 0637dcd | main | feat: page texts editor, docker status modal, mission section
- [x] Step 4 — Push: origin/main atualizado
- Push status: DONE — 2026-06-13
