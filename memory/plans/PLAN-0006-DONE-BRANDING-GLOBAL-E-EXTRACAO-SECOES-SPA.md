# Plano de Trabalho: Branding Global + Extracao de Secoes SPA

Status: DONE (CONCLUIDO E PUBLICADO)
Data: 2026-02-27
Solicitacao: detalhar plano de separacao total de secoes em componentes e centralizacao de branding global dinamico.

## Decisoes ja confirmadas
- Branding sera unico para todas as unidades.
- `logoUrl` sera URL para o arquivo hospedado no servidor.

## Objetivo
- Reduzir impacto de manutencao e facilitar rebranding/white-label.
- Remover hardcode de marca (`JLR Beauty`, `JLR`, logo fixo) das telas.
- Garantir acesso unico aos dados de branding para todas as telas/secoes.

## Escopo (In)
- Separar secoes inline restantes em componentes TSX dedicados.
- Criar configuracao global de branding em `settings`.
- Criar endpoints/admin UI de manutencao de branding.
- Criar camada unica de acesso backend + frontend para branding.
- Substituir ocorrencias de marca no frontend e pontos de texto backend exibidos ao usuario.

## Escopo (Out)
- Redesign visual das telas.
- Mudanca de regra de negocio de agendamento/pagamentos.
- Multi-tenant por unidade (fora de escopo nesta rodada).

## Mapeamento detalhado: secoes inline atuais e impacto

### 1) `apps/web/src/components/pages/HomeContent.tsx`
- Blocos inline relevantes:
  - banner de acesso restrito (`data-access-denied-banner`).
  - modal de carrinho (`#cart-modal` + `data-cart-*`).
  - modal de login (`#loginModal` + `data-auth-*`).
  - modal de signup (`#signupModal` + `data-auth-*`).
  - widget concierge (`#concierge-chat-wrapper`, `#concierge-panel`, `#concierge-body`, `#concierge-options`).
- Impacto esperado:
  - Medio: ha dependencia forte de IDs e `data-*` usados por behaviors.
  - Risco principal: quebrar binds de eventos ao mover markup.
  - Mitigacao: manter IDs/`data-*` identicos e validar fluxos completos (auth/cart/concierge).

### 2) `apps/web/src/components/pages/AssinaturasContent.tsx`
- Blocos inline relevantes:
  - Hero completo (header + cards) renderizado diretamente no arquivo.
- Impacto esperado:
  - Baixo para medio: extracao mais direta, pouca dependencia de behavior legado.
  - Mitigacao: extrair para `AssinaturasHeroSection.tsx` mantendo classes/estrutura visual.

### 3) `apps/web/src/components/pages/FranquiasContent.tsx`
- Estado atual:
  - Ja esta separado por secoes (`FranquiasHeroSection`, `FranquiasVisionSection`, `FranquiasModelsSection`, `FranquiasContactSection`).
- Impacto esperado:
  - Baixo: apenas ajuste de consumo de branding dinamico nos componentes.

### 4) `apps/web/src/components/pages/AdminContent.tsx` (apoio)
- Estado atual:
  - shell admin muito extenso + css inline.
- Impacto no plano:
  - Nao e alvo da extracao de secoes publicas agora.
  - Apenas incluir nova view de Branding no menu/painel seguindo padrao de views existentes.

## Onde sera feita a manutencao de branding

### Tela administrativa
- Nova tela no Admin: `Branding`.
- Padrao de implementacao (igual modulos atuais):
  - `apps/web/src/modules/admin-branding/components/AdminBrandingView.tsx`
  - `apps/web/src/modules/admin-branding/components/AdminBrandingViewIsland.tsx`
  - `apps/web/src/modules/admin-branding/index.ts`
- Integracao:
  - novo `data-view-trigger=\"branding\"` em `AdminContent.tsx`.
  - novo painel `data-view=\"branding\"` com target React island.
  - montagem em `apps/web/src/pages/Admin.tsx`.

### CRUD (modelo operacional)
- Nao sera CRUD de lista; sera configuracao global unica com `upsert`.
- Contratos:
  - `GET /api/admin/branding` (carregar valor atual)
  - `PUT /api/admin/branding` (salvar/atualizar valor unico)
  - `GET /api/public/branding` (consumo publico em runtime)
- Persistencia:
  - `settings.key = \"public.branding\"`
  - `settings.value = { fullName, shortName, logoUrl }`
- Padrao de UX:
  - mesmo padrao de feedback da tela `Secoes SPA` (loading/error/success).

## Modelagem de dados (database-design)

### Escolha: `settings` (recomendado)
- Justificativa:
  - dado global de produto, nao operacional por unidade.
  - evita duplicacao de branding em varias `Unit`.
  - alinha com configuracoes dinamicas ja existentes (`public.sectionToggles`).

### Contrato de dados
- Chave: `public.branding`
- Shape:
```json
{
  "fullName": "JLR Beauty",
  "shortName": "JLR",
  "logoUrl": "https://.../logo.webp"
}
```

## Acesso unico aos dados de branding

### Backend (camada unica)
- Criar modulo/helper dedicado (ex.: `apps/api/src/modules/branding/service.ts`) para:
  - `getPublicBranding()`
  - `savePublicBranding(payload)`
- Rotas apenas delegam para essa camada.
- Validacao de payload com Zod.
- Adicionar cache TTL em memoria no service para reduzir leitura repetida no banco.
  - Variaveis de cache (nomes alvo):
    - `brandingCacheValue`
    - `brandingCacheExpiresAt`
    - `BRANDING_CACHE_TTL_MS` (env, default recomendado: `300000` = 5 min)
  - Regras:
    - `getPublicBranding()` retorna cache quando `Date.now() < brandingCacheExpiresAt`.
    - expirado/ausente: consulta banco, atualiza cache e novo `expiresAt`.
    - `savePublicBranding(payload)`: persiste e invalida/atualiza cache imediatamente.
  - Escopo do cache:
    - cache local por processo/instancia (sem distribuicao entre replicas).

### Frontend (camada unica)
- Criar store/runtime hook dedicado (ex.: `apps/web/src/modules/public-site/branding.runtime.ts`) para:
  - bootstrap (fetch unico),
  - cache em memoria,
  - assinatura de mudancas para re-render.
- Uso nas telas:
  - `useBranding()` (ou equivalente) para `fullName`, `shortName`, `logoUrl`.

### Estrategia explicita: carregar 1x e reutilizar variaveis
- Regra funcional:
  - no carregamento inicial da aplicacao, executar 1 fetch de branding;
  - depois disso, todos os componentes leem apenas variaveis de runtime;
  - nenhum componente faz acesso direto ao endpoint de branding.
- Variaveis de runtime (nomes alvo):
  - `DEFAULT_BRANDING`: fallback local padrao.
  - `brandingSnapshot`: objeto em memoria com `{ fullName, shortName, logoUrl }` atual.
  - `brandingBootstrapPromise`: promise singleton para deduplicar chamadas concorrentes no bootstrap.
  - `brandingReady`: flag de bootstrap concluido.
- API interna do runtime (nomes alvo):
  - `bootstrapBrandingOnce()`: executa fetch somente na primeira chamada.
  - `getBrandingSnapshot()`: retorna snapshot atual sem fetch.
  - `subscribeBranding(listener)`: notifica re-render quando houver atualizacao.
  - `updateBrandingSnapshot(next)`: atualiza snapshot local apos `PUT /api/admin/branding`.
- Ponto de inicializacao:
  - chamar `bootstrapBrandingOnce()` no bootstrap da app publica (entrada/layout raiz).
  - componentes (menu/footer/heros/admin header) usam `useBranding()` baseado no snapshot.
- Garantia de "acesso ao banco 1x":
  - no fluxo de UI, o acesso ao banco ocorre 1 vez por carregamento inicial da aplicacao.
  - navegacao interna reutiliza o snapshot em memoria sem nova ida ao banco.

## Substituicao de marca hardcoded

### Regra de troca
- `JLR Beauty` -> variavel `fullName`.
- `JLR` (contexto de marca) -> variavel `shortName`.
- `/images/JLRLOGO.webp` -> variavel `logoUrl`.

### Cuidados para evitar falso positivo
- Nao substituir textos tecnicos, codigos e exemplos onde `JLR` nao representa marca exibida.
- Executar substituicao em duas passagens:
  - pass 1: componentes de navegacao, footer, hero e areas institucionais.
  - pass 2: textos secundarios e mensagens de suporte.

## Performance (avaliacao)

### Impacto esperado
- Separar secoes em arquivos TSX nao piora performance por si so.
- Tendencia: neutro a levemente positivo para manutencao e bundle hygiene.

### Riscos reais de performance
- fetch repetido de branding em varios componentes.
- re-render excessivo se o hook nao for centralizado.
- leitura repetida de `settings(public.branding)` no backend em requests sequenciais.

### Mitigacoes
- bootstrap unico do branding no layout publico (similar ao fluxo de section toggles).
- cache em memoria e deduplicacao de request.
- manter componentes de secao leves e evitar logica pesada no render.
- bloquear fetch direto em componentes (fonte unica: `branding.runtime.ts`).
- cache TTL no backend para reduzir roundtrips ao banco em `GET /api/public/branding`.

## Plano de execucao (tasks atomicas)
- [x] Registrar abertura do plano no `memory/MODIFICATION_LOG.md` (registro macro de INICIO).
- [x] Mapear e catalogar todas as ocorrencias de marca hardcoded no frontend/backend com classificacao por risco.
- [x] Extrair Hero de Assinaturas para componente dedicado (`AssinaturasHeroSection.tsx`).
- [x] Extrair blocos inline de `HomeContent` para componentes dedicados:
  - `AccessDeniedBanner`,
  - `CartModalSection`,
  - `AuthModalsSection` (login + signup),
  - `ConciergeWidgetSection`.
- [x] Ajustar `HomeContent` para composicao somente por componentes/secoes.
- [x] Criar schema Zod de branding no backend.
- [x] Criar service unico de branding no backend (`get`/`save`).
- [x] Implementar cache TTL no service de branding backend:
  - `BRANDING_CACHE_TTL_MS` (default `300000`)
  - `brandingCacheValue` + `brandingCacheExpiresAt`
  - invalidacao/refresh imediato apos `savePublicBranding`.
- [x] Expor endpoints `GET/PUT /api/admin/branding` e `GET /api/public/branding`.
- [x] Criar modulo `admin-branding` (view + island + integracao no menu Admin).
- [x] Criar runtime hook/store unico de branding no frontend com variaveis explicitas:
  - `DEFAULT_BRANDING`
  - `brandingSnapshot`
  - `brandingBootstrapPromise`
  - `brandingReady`
  - API: `bootstrapBrandingOnce`, `getBrandingSnapshot`, `subscribeBranding`, `updateBrandingSnapshot`.
- [x] Inicializar `bootstrapBrandingOnce()` no carregamento inicial da app publica para garantir fetch unico.
- [x] Integrar branding dinamico nos componentes estruturais (menu/footer/heros/admin header).
- [x] Substituir ocorrencias restantes de marca por variaveis de branding (com whitelist de exclusoes).
- [x] Validar que nao ha fetch de branding fora da camada unica (`branding.runtime.ts`).
- [x] Validar comportamento do cache TTL backend (hit/miss/expiracao/invalidacao pos-`PUT`).
- [x] Validar regressao funcional completa (auth/cart/concierge/toggles/branding).
- [x] Atualizar documentacao (`SPA_SECTIONS...`, `MODULES_CATALOG`, `PROJECT_OVERVIEW`, `ROADMAP`).

## Validacao obrigatoria
- `apps/web`: `npm run lint` e `npm run build`.
- `apps/api`: `npm run build` e `npm test`.
- Homologacao manual:
  - salvar branding no Admin;
  - recarregar Home/Franquias/Assinaturas/Admin;
  - confirmar troca de nome/logo sem regressao de comportamento.

## Checkpoint de Continuidade
- Ultimo passo concluido: execucao completa do plano 0006 (backend + frontend + admin + extracao de secoes + documentacao) com validacoes de build/test/lint.
- Proximo passo planejado: sem pendencias tecnicas abertas neste plano; seguir homologacao manual de rotina (troca de branding no Admin e conferencia visual fim-a-fim).

## Registro Git da Entrega
- Data de registro: 2026-02-27 17:15:35

### Passo 1 (Revisao pre-commit)
- Arquivos alterados foram listados previamente no fluxo com `git status --short`.
- Validacoes executadas e reportadas:
  - `apps/web`: `npm run lint` e `npm run build` (PASS)
  - `apps/api`: `npm run build` e `npm test` (PASS)

### Passo 2 (Autorizacao de commit)
- Confirmacao explicita do usuario: `sim`.

### Passo 3 (Confirmacao do commit)
- Branch: `main`
- Hash curto: `21e6519`
- Hash completo: `21e6519a43f0606821aa786b0029f146a3829d92`
- Autor: `bornerj`
- Data do commit: `2026-02-27 17:11:18 -0300`
- Mensagem: `feat: concluir plan-0006 com branding global dinamico e fluxo de aprovacao git`
- Estatistica final: `47 files changed, 2060 insertions(+), 552 deletions(-)`

### Passo 4 (Autorizacao e resultado do push)
- Confirmacao explicita do usuario: `sim`.
- Comando executado: `git push origin main`
- Remoto/branch: `origin/main`
- Resultado: `8f515f5..21e6519  main -> main`
- Status final: `PUSH_CONCLUIDO`
