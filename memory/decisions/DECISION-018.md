# DECISION-018 — Objetivo Máximo: Plataforma Reutilizável (SaaS Multi-Tenant / White-Label)

Status: ACTIVE
Date: 2026-08-20

## Contexto

Durante a discussão do `PLAN-0034` (auditoria de textos hardcoded pós-Admin V2), o
usuário revelou o objetivo estratégico real por trás dessa e de futuras auditorias
similares: **esta base de código não é exclusiva da JLR Beauty**. A intenção é, no
futuro, comercializar a mesma plataforma para outros clientes/empreendimentos. "JLR
Beauty" e "JLR" são marca e propriedade de uma cliente específica — não podem ficar
amarrados ao produto em nenhum nível que impeça reuso.

O usuário também apontou dois pontos técnicos que ampliam o escopo de qualquer
auditoria de conteúdo:
1. **Imagens seguem o mesmo padrão de textos** — ambos vêm do banco (`Setting.key`:
   `public.pageTexts` e `public.mediaSlots`), então qualquer auditoria de "conteúdo
   hardcoded" precisa cobrir os dois, não só texto.
2. **Migração Admin → Admin V2 pode ter introduzido inconsistência de nomenclatura**
   — telas foram renomeadas/reorganizadas; os textos por trás podem ser os mesmos ou
   próximos, mas as chaves/labels de exibição podem ter divergido do catálogo original,
   o que também é risco pra portabilidade (chave com nome específico da tela antiga
   confunde quem for adaptar isso pra outro cliente).

## Decisão

**O objetivo máximo de qualquer trabalho de "conteúdo editável" (textos, imagens,
branding) neste projeto é permitir, no futuro, uma rotina `saas-initialize`** que:
- apaga todo conteúdo específico da JLR Beauty (textos em `public.pageTexts`, imagens
  em `public.mediaSlots`, e qualquer outro dado de branding/identidade armazenado);
- repovoa com valores-padrão genéricos, sem marca, prontos para um novo cliente
  configurar do zero via Admin.

Consequência direta para o trabalho atual e futuro: toda auditoria de "texto/imagem
hardcoded" (como o `PLAN-0034`) deve ser tratada como um passo de preparação para
essa portabilidade, e não apenas como limpeza de dívida técnica isolada. Isso muda o
critério de "correto": não basta o texto vir do banco — o **valor padrão** de
fallback no catálogo (`catalog.ts` / equivalente de `mediaSlots`) também não pode
depender de branding específico da JLR de forma que quebre a ideia de reset genérico,
E strings de marca fora do sistema de conteúdo editável (título de página, meta tags,
rodapé, e-mails, nomes de rota/variável) também entram no radar dessa preocupação
maior, mesmo que não sejam escopo do `pageTexts` em si.

`saas-initialize` em si **não é construído agora** — é o horizonte que justifica o
padrão. Fica registrado como item de backlog futuro, sem plano de execução ainda.

## Consequences

- `PLAN-0034` é revisado para declarar este objetivo como sua motivação de fundo e
  ampliar escopo para imagens (`mediaSlots`) além de texto (`pageTexts`).
- Toda migração futura de tela (como Admin → Admin V2) deve preservar ou documentar
  explicitamente qualquer divergência de nomenclatura entre chave de catálogo e nome
  de tela, para não acumular dívida de portabilidade.
- Novo trabalho de conteúdo que amarre string/imagem específica da JLR fora do
  sistema de `pageTexts`/`mediaSlots` deve ser sinalizado como risco de portabilidade,
  mesmo que funcione perfeitamente para a JLR hoje.
- `saas-initialize` (rotina de reset para produto genérico) fica como backlog —
  qualquer plano futuro que a implemente deve referenciar esta decisão.
