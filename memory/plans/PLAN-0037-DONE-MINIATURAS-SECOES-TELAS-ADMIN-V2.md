# PLAN-0037 — Miniaturas visuais na tela "Seções Telas" (Admin V2)

**Status:** ✅ DONE — implementado, buildado e validado visualmente pelo usuário no próprio navegador. Commit feito; push pendente (aprovação separada).
**Data de abertura:** 2026-09-15
**Escopo macro:** `apps/web/src/admin-v2/sistema/sectionToggles/` (reescrita do componente + 2 arquivos novos de dados/UI). **Zero mudança de backend** (nenhuma rota nova, nenhuma migration, nenhum Setting novo). `tailwind.generated.css` **não precisou ser tocado** — verificação manual confirmou que todas as classes novas já estavam compiladas (ver Notas de Risco e `ERR-0090`).
**Agente de apoio:** `@frontend-specialist` (skills `frontend-design`, `web-design-guidelines`) — redesenho de UI reaproveitando padrão visual e tokens já estabelecidos do Admin V2.

**Origem:** usuário pediu um estudo visual (mockup HTML, fora do código real) pra tela de liga/desliga de seções, hoje só nome cru + switch. Mockup publicado como Artifact, iterado uma vez (cor de fundo do modo escuro corrigida pra bater com o padrão real `bg-white dark:bg-forest` / `border-[#cfe7d1] dark:border-forest-green`) e aprovado explicitamente: *"gostei da forma que está, com as opções de P, M e G e LISTA compacta e expandida (...) o resto está ok, os textos, as imagens, tudo é o que eu quero. pode fazer."*

---

## STAR

**Situation:** `SectionTogglesView.tsx` (210 linhas, `/admin-v2/sistema/secoes`) já é 100% React nativo, consumindo `/api/admin/section-toggles` sem alteração — reescrito no `PLAN-0026` Onda 6. Hoje cada uma das 32 chaves `página.seção` (Home 8, Franquias 19, Assinaturas 5) aparece como uma linha só com a chave técnica crua (ex. `hero_gallery`) + um switch feito à mão. RAG confirmou: (1) não existe nenhum mecanismo de screenshot no projeto; (2) existe um catálogo de Galeria de Mídias maduro (`Setting.public.mediaSlots`, espelhado no frontend em `apps/web/src/modules/public-site/mediaSlots.ts` via `getMediaSlotCatalog()`), já indexado por `page`+`section`, com endpoint de leitura já usado noutro lugar do Admin V2 (`fetchMediaSlots`); (3) a cobertura desse catálogo por seção de toggle é parcial (22 das 32 chaves têm uma imagem correspondente direta; 10 não têm — ver mapeamento abaixo) e tem 2 inconsistências de nomenclatura entre os dois sistemas que precisam de tratamento explícito (não genérico): as fotos da seção `hero_gallery` de Franquias estão catalogadas com `section: "hero"` no catálogo de mídia (junto com o hero de verdade, diferenciadas só pelo `order`), e a seção `mission` de Home/Franquias/Assinaturas não tem slot próprio por página — usa um slot único e compartilhado (`page: "global", section: "mission"`).

**Task:** redesenhar a tela pra mostrar cada seção como uma linha com miniatura + nome amigável + chave técnica + switch, miniaturas pequenas mas legíveis, sem exigir nenhum endpoint/tabela nova, com um seletor de tamanho (P/M/G) e de densidade de lista (compacta com rolagem / expandida) — ambos preferências locais do navegador do admin, não dado de servidor.

**Action:** ver Onda única abaixo (escopo pequeno o bastante pra não precisar de fases separadas).

**Result esperado:** tela navegável no browser real mostrando as 32 linhas com miniatura (22 com imagem real vinda da Galeria de Mídias, 10 com wireframe neutro consistente — nunca uma miniatura quebrada/vazia), nomes amigáveis em PT-BR, seletores P/M/G e compacta/expandida funcionando e persistindo por `localStorage`, comportamento de liga/desliga e salvamento **inalterado** (mesmo endpoint, mesmo gate `MASTER`), `tsc`/build limpos, `tailwind.generated.css` regenerado e conferido, validação visual real (light + dark) via browser.

---

## Mapeamento de miniatura por seção (curado nesta sessão via leitura de `apps/api/src/modules/mediaSlots/service.ts`)

Regra de resolução: **match exato `page`+`section` no catálogo de mídia, menor `order` primeiro**, com 2 exceções explícitas (documentadas em comentário no código, não genéricas):
- `franquias.hero` → primeiro item de `section: "hero"` cujo `id` **não** contém `gallery` (`franquias_hero_bg_map_01`); `franquias.hero_gallery` → primeiro item de `section: "hero"` cujo `id` **contém** `gallery` (`franquias_hero_gallery_img_01`).
- qualquer seção `mission` (Home/Franquias/Assinaturas) → `page: "global", section: "mission"` (`mission_center_img_01`), slot único compartilhado pelas 3.

| Página | Seção | Slot usado | Página | Seção | Slot usado |
|---|---|---|---|---|---|
| home | hero | `home_hero_bg_01` | franquias | fran01 | `franquias_fran01_floorplan_img_01` |
| home | services | — (wireframe) | franquias | fran02 | `franquias_fran02_floorplan_img_01` |
| home | membership | — (wireframe) | franquias | fran03 | `franquias_fran03_floorplan_img_01` |
| home | about | `home_about_img_01` | franquias | gestao_app | `franquias_gestao_app_img_01` |
| home | mission | `mission_center_img_01` (global) | franquias | fluxo_caixa | `franquias_fluxo_caixa_feature_img_01` |
| home | products | — (wireframe) | franquias | marketing_crm | `franquias_marketing_crm_img_01` |
| home | testimonials | `home_testimonials_avatar_01` | franquias | expansao | `franquias_expansao_map_img_01` |
| home | cta | — (wireframe) | franquias | perfil | `franquias_perfil_img_01` |
| franquias | hero | `franquias_hero_bg_map_01` | franquias | suporte | `franquias_suporte_img_01` |
| franquias | hero_gallery | `franquias_hero_gallery_img_01` | franquias | etapas | — (wireframe) |
| franquias | about | — (wireframe) | franquias | contact | — (wireframe) |
| franquias | vision | `franquias_vision_img_01` | assinaturas | hero | `assinaturas_hero_bg_01` |
| franquias | founder | `franquias_founder_main_img_01` | assinaturas | membership | — (wireframe) |
| franquias | benefits | `franquias_benefits_cell_img_01` | assinaturas | about | — (wireframe) |
| franquias | mission | `mission_center_img_01` (global) | assinaturas | mission | `mission_center_img_01` (global) |
| franquias | models | `franquias_models_card_img_01` | assinaturas | testimonials | — (wireframe) |

**Deliberadamente fora de escopo:** não buscar imagem de `Product`/`Service` (entidades próprias, fora do catálogo de mídia) para cobrir `home.products`/`home.services` — evitaria 2 chamadas de API novas por uma cobertura marginal; essas 2 (+ 8 outras) ficam com wireframe. Se o usuário quiser fechar essa lacuna depois, é um plano à parte, pequeno.

## Implementação

1. **Novo arquivo** `apps/web/src/admin-v2/sistema/sectionToggles/sectionDisplay.ts`:
   - `SECTION_LABELS: Record<string, Record<string,string>>` — os 32 nomes amigáveis validados no mockup (ex. `hero_gallery` → "Galeria do Hero", `fran01/02/03` → "Destaque — baixo investimento/marca consolidada/suporte contínuo").
   - `SECTION_ARCHETYPE: Record<string, Record<string,"hero"|"split"|"cards"|"gallery"|"cta">>` — mesma classificação do mockup, usada pro wireframe de fallback.
   - `resolveSectionThumbnailSlotId(page, section): MediaSlotId | null` — implementa a regra de resolução acima usando `getMediaSlotCatalog()` (import de `modules/public-site/mediaSlots.ts`, já reusado por `MediaGalleryView.tsx`).
2. **Novo componente** `apps/web/src/admin-v2/sistema/sectionToggles/SectionThumbnail.tsx` — recebe `archetype` + `imageUrl?`; renderiza `<img>` (com `loading="lazy"`, `object-cover`, cantos arredondados, borda sutil) quando há URL, ou o wireframe CSS (mesmos 5 arquétipos do mockup, reescritos como classes Tailwind) quando não há.
3. **`SectionTogglesView.tsx`**:
   - chama `fetchMediaSlots` junto de `fetchSectionToggles` no `load()` (mesmo token, `Promise.all`); guarda o snapshot em estado.
   - cada linha passa a renderizar `<SectionThumbnail>` + rótulo amigável (`SECTION_LABELS[page][section] ?? section`) + chave técnica pequena abaixo (mantém a chave crua visível, só não é mais o texto principal) + o switch existente (sem mudança de lógica/endpoint).
   - adiciona a faixa de controles P/M/G + compacta/expandida (mesmo padrão visual do mockup, tokens de marca), persistindo em `localStorage` (`admin_v2_section_toggles_display`, `{ size: "s"|"m"|"l", density: "compact"|"expanded" }`, com fallback seguro se `localStorage` lançar).
   - tamanho da miniatura via CSS custom property no container (mesma técnica do mockup) — P 56×37, M 72×48 (default), G 100×67.
   - densidade compacta = `max-height` + `overflow-y-auto` por card de página (só relevante pra Franquias, 19 linhas); expandida = altura natural.
3. **CSS:** nenhuma classe arbitrária nova além das já usadas no projeto quando possível; onde for necessária (ex. altura/largura específica da miniatura em pixel), **regenerar `tailwind.generated.css`** ao final (comando documentado no cabeçalho do próprio arquivo — ver Notas de Risco, mesma causa raiz de `ERR-0040/0049/0051/0070/0071`).

## Fora de escopo (Out)
- Qualquer mudança de backend, schema ou endpoint.
- Upload/edição de imagem a partir desta tela (a edição de imagem continua só em Sistema → Galeria de Mídias; esta tela é somente leitura pra thumbnail).
- Cobrir as 10 seções sem imagem natural com uma fonte de dado nova (Product/Service ou screenshot automatizado) — candidato a um plano futuro, não travado por este.

---

## Checklist

- [x] `sectionDisplay.ts` criado (labels + arquétipos + resolução de slot)
- [x] `SectionThumbnail.tsx` criado (imagem real + wireframe de fallback, 5 arquétipos)
- [x] `SectionTogglesView.tsx` reescrito (thumbnail + rótulo amigável + chave técnica + switch inalterado + controles P/M/G e compacta/expandida + persistência local)
- [x] `tsc -b` (apps/web) limpo
- [x] `npm run build` (apps/web) limpo
- [x] Grep das classes Tailwind novas confirmado sem necessidade de regeneração (ver `ERR-0090` — tentativa de regeneração preventiva produziu arquivo regressivo, revertida)
- [x] Validação visual real no browser — confirmada pelo usuário ("tá funcionando") após o `nginx` ficar saudável de novo (`ERR-0091`)
- [x] Comportamento de liga/desliga + "Salvar configurações" revalidado sem regressão (mesmo endpoint) — coberto pela validação acima
- [x] `memory/MODIFICATION_LOG.md` atualizado
- [x] `memory/progress.md` atualizado (linha do módulo Admin V2 — Seções)

## Critérios de Validação

| Critério | Como validar |
|---|---|
| Nenhuma miniatura quebrada | As 10 seções sem slot mostram wireframe, nunca `<img>` com `src` vazio/404 |
| Paridade de comportamento | Ligar/desligar + salvar grava exatamente como antes (`GET`/`PUT /api/admin/section-toggles` inalterados) |
| CSS servido de verdade | Classes novas presentes em `tailwind.generated.css` pós-regeneração (checklist `ERR-0070`), conferido via `grep`, não só "parece certo" |
| Preferência de exibição persiste | Recarregar a página mantém o P/M/G e a densidade escolhidos (via `localStorage`) |
| Dark mode correto | Card e página dividem o mesmo `forest` de fundo, separados só pela borda `forest-green` (mesmo padrão do resto do Admin V2) |

## Notas de Risco
1. **`tailwind.generated.css` é foto estática, não build ao vivo** — causa raiz já documentada 5x (`ERR-0040`, `ERR-0049`, `ERR-0051`, `ERR-0070`, achado adicional do `PLAN-0032`). **Atualização desta sessão**: todas as classes novas introduzidas por este plano já estavam presentes no CSS servido (conferido com `grep` usando o escaping real do seletor Tailwind) — nenhuma regeneração foi necessária. Uma tentativa de regenerar mesmo assim (por precaução) revelou um problema novo, mais sério: o comando documentado produziu um arquivo **983 linhas menor**, removendo classes genuinamente em uso (`bg-gold-accent`, `p-0`, `pr-10`, `bottom-1`, `opacity-40` etc.) — revertido antes de qualquer commit, registrado como `ERR-0090`. **Checklist atualizado**: antes de aceitar o output de uma regeneração completa, rodar `git diff --stat` nela; se o total de linhas cair, tratar como suspeito e conferir com `grep -rlF` no código-fonte antes de aceitar.
2. **Cobertura parcial de imagem é esperada, não um bug** — 10 das 32 seções não têm slot de mídia hoje; o wireframe de fallback é o comportamento correto pra elas, não um "TODO" pendente.
3. **Validação visual bloqueada neste sandbox** — nem `claude-in-chrome` (extensão não conectada) nem Playwright (`ECONNREFUSED` em `localhost:80`) conseguiram alcançar a stack Docker a partir deste ambiente de execução de comandos, mesma limitação já registrada na auditoria de 2026-09-02 pro Postgres/API. `docker compose build web && docker compose up -d --no-deps web` já rodou com o código novo — falta o usuário abrir `/admin-v2/sistema/secoes` (login MASTER) no próprio navegador.

## Git Record of Delivery
- [x] Step 1 (Pre-commit review) — 2026-09-15: 5 arquivos modificados + 3 novos (293
  inserções, 34 remoções). Escopo do commit inclui, além do `PLAN-0037` em si, o achado e
  fix do `ERR-0091` (mesma sessão, necessário pra validar visualmente o próprio plano):
  - `apps/web/src/admin-v2/sistema/sectionToggles/sectionDisplay.ts` (novo) — rótulos + arquétipos + resolução de slot
  - `apps/web/src/admin-v2/sistema/sectionToggles/SectionThumbnail.tsx` (novo) — miniatura com fallback
  - `apps/web/src/admin-v2/sistema/sectionToggles/SectionTogglesView.tsx` — redesenho da tela
  - `docker-compose.yml` — serviço `driveguard` + healthcheck/depends_on em `nginx` (`ERR-0091`)
  - `memory/plans/PLAN-0037-MINIATURAS-SECOES-TELAS-ADMIN-V2.md` (novo, este arquivo)
  - `memory/logs/DEBUG-HISTORY.md` (`ERR-0090`, `ERR-0091`)
  - `memory/MODIFICATION_LOG.md`, `memory/progress.md`
  Validações: `tsc -b`/`npm run build`/`eslint` (apps/web) limpos; classes Tailwind novas
  confirmadas pré-compiladas; `docker-compose.yml` validado ao vivo nos 2 sentidos (cenário
  normal e cenário de falha simulado); validação visual real confirmada pelo usuário.
- [x] Step 2 (Commit authorization) — 2026-09-15: usuário aprovou explicitamente ("ok, tá
  funcionando, pode commitar")
- [x] Step 3 (Commit confirmation) — commit `50658e6` em `main`: 8 arquivos, 620
  inserções/34 remoções (redesenho da tela + `docker-compose.yml`/`driveguard`
  (`ERR-0091`) + memória `ERR-0090`/`ERR-0091`/`MODIFICATION_LOG`/`progress.md`)
- [x] Step 4 (Push authorization e resultado) — 2026-09-15: usuário aprovou explicitamente
  ("pode subir (push)"). `git push origin main`: `27c3b58..20a143c main -> main`, sucesso
  (3 commits: `50658e6`, `70d2e60`, `20a143c`)
- Push status: COMPLETED
