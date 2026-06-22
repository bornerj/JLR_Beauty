---
id: DECISION-011
title: Remoção do ngrok — tunnel substituído por nginx + Docker
status: ACTIVE
date: 2026-06-22
area: infrastructure / dev-tooling
---

## Contexto

O ngrok foi introduzido como ferramenta de desenvolvimento local para expor a API (porta 3001) à internet, permitindo que Z-API e Stripe enviassem webhooks para `localhost` durante testes. Era necessário porque a API não tinha URL pública acessível externamente.

## Decisão

Remover todas as referências ao ngrok do codebase, documentação e `kernel/project.toml`.

**Por quê:** Com a infra atual baseada em Docker + nginx, a API já é acessível via domínio público (`https://SEU_DOMINIO/api/...`). O nginx proxia as requisições externas diretamente para o container `api` na rede interna Docker. O ngrok deixou de ser necessário.

## Impacto

| Item | Status |
|------|--------|
| `kernel/project.toml` `[tools.dev.tunnel]` | Removido |
| `docs/config/WHATSAPP_API_ZAPI_NGROK.md` | Renomeado para `WHATSAPP_API_ZAPI.md`; seção ngrok removida |
| `docs/config/INTEGRATIONS.md` | Referências `ngrok` removidas do título e descrição |
| `docs/project/PROJECT_OVERVIEW.md` | Duas menções passageiras removidas |
| `docs/evolutive_changes/POSTGRES_MIGRATION_PLAN.md` | Uma menção passageira removida |
| `docs/evolutive_changes/REFACTOR_REQUIREMENTS.md` | Uma menção passageira removida |
| `docs/project/REQUIREMENTS.md` | Uma menção passageira removida |
| `apps/api/src/modules/chatbot/README.md` | Menção `Z-API/ngrok` → `Z-API` |

## Se ngrok for necessário novamente

Cenário: rodar a API **fora do Docker** (dev puro com `npm run dev`) e precisar testar webhooks de Z-API ou Stripe.

Nesse caso, pode-se usar qualquer tunnel HTTPS:
- `ngrok http 3001` (mesma instrução antiga)
- `cloudflared tunnel` (alternativa sem limite de URL única)
- VS Code port forwarding (para testes rápidos)

A URL pública gerada deve ser configurada temporariamente no painel Z-API e/ou Stripe Dashboard como webhook endpoint.

## Alternativas consideradas

- **Manter**: manteria documentação stale (enganosa para devs que usam Docker).
- **Arquivar docs**: complexidade desnecessária — o conteúdo de Z-API sem ngrok é mais limpo.
