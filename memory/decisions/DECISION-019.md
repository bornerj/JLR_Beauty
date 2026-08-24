# DECISION-019 — Chaves/slots órfãos do PLAN-0034: remover do código, manter no banco

Status: ACTIVE
Date: 2026-08-20

## Contexto

Durante o `PLAN-0034` (Fase 2), o cruzamento entre o catálogo de conteúdo editável
(`pageTexts/catalog.ts`, `mediaSlots.ts`) e o uso real no código encontrou 45 entradas
órfãs (36 chaves de texto + 9 slots de imagem), todas concentradas em um único
cluster: os 9 flip-cards de Serviços da Home, que migraram para consumir
`Service.name`/`Service.imageUrl`/`highlightLabel` diretamente da tabela `Service`
(`PLAN-0028`/`ERR-0062`), deixando as entradas antigas do `pageTexts`/`mediaSlots`
sem nenhum consumidor. Consulta ao Postgres ao vivo confirmou que os 45 valores
armazenados eram idênticos, byte a byte, aos `defaultValue`/`fallbackUrl` do
catálogo — nenhuma edição real da dona do site seria perdida com a remoção.

## Decisão

Remover as 45 entradas **só do código** (`catalog.ts`, `mediaSlots.ts` — backend e
frontend), mantendo os 45 valores como estão na tabela `Setting`/`ContentEntry` do
Postgres. Nenhuma exclusão de dado em produção nesta decisão.

Motivo: mesmo com risco confirmado como baixo (dados nunca editados), exclusão de
dado de produção é ação destrutiva — a decisão de apagar ou não fica sempre com o
usuário, nunca é automática, mesmo quando a análise técnica indica segurança.

## Consequences

- `apps/api/src/modules/pageTexts/catalog.ts`: 342 → 306 chaves
- `apps/api/src/modules/mediaSlots/service.ts` (`MEDIA_SLOT_IDS` +
  `PUBLIC_MEDIA_SLOT_CATALOG`) e `apps/web/src/modules/public-site/mediaSlots.ts`:
  78 → 69 slots
- As 45 chaves/valores continuam presentes no JSON armazenado em
  `ContentEntry.value` (`public.pageTexts`/`public.mediaSlots`) — inofensivas, nunca
  lidas (o catálogo é quem define o que é exposto/editável, não o conteúdo do JSON
  em si). Uma limpeza futura do dado em si, se algum dia desejada, é uma decisão
  nova e separada desta.
- Editor "Textos das Páginas" (Admin V2) passou a mostrar 306 campos; "Galeria de
  Mídias" passou a mostrar 69 slots — validado ao vivo no browser (`PLAN-0034` Fase 4).
