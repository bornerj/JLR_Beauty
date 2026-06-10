# Module: chatbot (frontend)

Estado atual da migracao:
- A logica funcional do chatbot web reside no modulo `apps/web/src/modules/public-site/index.behavior.ts`.
- Este modulo foi criado para centralizar a migracao progressiva para React puro.

Proxima etapa prevista:
1. Extrair API client do chatbot.
2. Extrair estado/steps do fluxo para hooks React.
3. Extrair UI do widget para componentes TSX.
4. Remover acoplamento final com `modules/public-site/index.behavior.ts`.

Objetivo:
Deixar o chatbot frontend isolado e reutilizavel em outros projetos.
