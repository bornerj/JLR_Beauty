# Module: chatbot

Modulo de chatbot/concierge (backend).

## Escopo
- Fluxo conversacional (`flow/conciergeFlow.ts`)
- Saudacoes e abertura (`opening/conciergeOpening.ts`)
- Inbox em memoria (`inbox/conciergeInbox.ts`)
- Integracao com Z-API (`integrations/zapi.ts`)
- Retencao/limpeza de sessoes (`retention/conciergeRetention.ts`)
- Webhooks Z-API sao consumidos pelas rotas em `apps/api/src/routes/index.ts` usando este modulo.

## Compatibilidade
Os arquivos antigos em `apps/api/src/lib/*` permanecem como wrappers de re-export para manter imports legados enquanto a migracao avanca.
