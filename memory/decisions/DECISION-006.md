Status: ACTIVE
Date: 2026-06-11
Context: Os section toggles (quais seções do site público ficam visíveis) eram persistidos via `fs.writeFileSync` em um arquivo `.ts` no disco. Em ambiente Docker, o container é efêmero — o arquivo seria perdido a cada rebuild. Além disso, escrever em arquivo `.ts` em produção é frágil e não auditável.
Decision: Persistir section toggles exclusivamente na tabela `Setting` do banco de dados (chave: `public.sectionToggles`). Remover todo código com `fs.writeFileSync` ou leitura de arquivo `.ts` de toggles. Padrão GET/PUT via API com fallback para `DEFAULT_PUBLIC_SECTION_TOGGLES` quando a chave não existir no banco.
Consequences: Estado persiste entre restarts e rebuilds Docker; auditável via banco; alinha com o padrão já usado para `branding` e `mediaSlots`; novos toggles adicionados ao DEFAULT não aparecem automaticamente para usuários com snapshot antigo salvo — exige função de merge com defaults (ver ERR-0032).
