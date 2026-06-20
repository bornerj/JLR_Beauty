# Debug History (extraido de memory/MODIFICATION_LOG.md)

# ID: ERR-0001: Erro 500 no login por dependencia de schema acessorio
SINTOMA: `POST /auth/login` retornando erro 500 ("correcao de erro 500 no /auth/login").
CAUSA_RAIZ: Fluxo de login dependia de colunas alem do minimo; divergencias de schema/coluna auxiliar podiam derrubar a autenticacao.
ACAO: Em `apps/api/src/routes/index.ts`, login passou a usar `findFirst` com `select` minimo (`id`, `name`, `email`, `role`, `passwordHash`), `lastAccessAt` nao-bloqueante com `catch`, e `logger.error` no `catch` principal.
CONTEXTO: 2026-02-14; Node v20.19.5; Express 5.2.1; Prisma 5.22.0; Windows (Laragon local).

# ID: ERR-0002: Falha de startup Prisma com mensagem `URL must start with prisma://`
SINTOMA: API falhando no startup ao executar `prisma.conciergeSession.deleteMany()` com erro `URL must start with prisma://` / datasource exigindo `prisma://`.
CAUSA_RAIZ: Prisma Client gerado com `--no-engine` + variaveis `PRISMA_*` conflitantes na sessao de terminal.
ACAO: Regeneracao com `npx prisma generate` em `apps/api` e limpeza de variaveis `PRISMA_*` no atalho global `C:\Users\Jeiel\start_backend.bat`.
CONTEXTO: 2026-02-14 e 2026-02-15; Prisma 5.22.0 + MySQL local; Windows.

# ID: ERR-0003: Erro P2022 na grid de profissionais
SINTOMA: Rota `/professionals` falhando com Prisma `P2022` (coluna `Professional.employmentStatus` inexistente), refletindo erro 500 na tela.
CAUSA_RAIZ: Migration `20260215001500_professional_commission_profile_and_lifecycle` pendente no MySQL local.
ACAO: `npx prisma migrate deploy` em `apps/api` para aplicar migration; validacao posterior com consulta Prisma (`count=6`).
CONTEXTO: 2026-02-15; Node v20.19.5; Prisma 5.22.0; MySQL local (Laragon).

# ID: ERR-0004: Endpoint de WhatsApp retornando 500 apenas na instancia ativa
SINTOMA: `POST http://localhost:3001/api/public/concierge/whatsapp-summary` retornava `500` (`{"message":"erro interno no servidor"}`), enquanto processos novos retornavam `202`.
CAUSA_RAIZ: Instancia ativa em `:3001` estava com ambiente desatualizado (necessitava reload de `.env`).
ACAO: Encerrada instancia antiga e reiniciada API na porta `3001`; validacao apos restart retornou `202` com `{ "success": true }`.
CONTEXTO: 2026-02-12; API local em Node/Express; integracao Z-API.

# ID: ERR-0005: Z-API com `200` HTTP e erro logico `NOT_FOUND`
SINTOMA: Integracao recebia resposta HTTP `200` com erro logico no payload (`NOT_FOUND`); tambem havia falha por proxy local `127.0.0.1:9`.
CAUSA_RAIZ: `ZAPI_BASE_URL` preenchido com URL completa de instancia/token/send-text e validacao anterior considerava apenas status HTTP.
ACAO: Em `apps/api/src/lib/zapi.ts`, normalizacao de URL para `/send-text`, suporte a `ZAPI_BASE_URL` completa e validacao de erro logico no body; em `send_message.php`, proxy local desabilitado com `CURLOPT_PROXY/CURLOPT_NOPROXY`.
CONTEXTO: 2026-02-12; API Express 5.2.1; ambiente local Windows + cURL/PHP.

# ID: ERR-0006: Falha de ambiente `spawn EPERM` em reexecucao de spec Playwright
SINTOMA: Reexecucao isolada do spec falho nao concluida por `spawn EPERM`.
CAUSA_RAIZ: Restricao/instabilidade de ambiente de execucao no Windows durante teste E2E.
ACAO: Sem patch de codigo aplicado no registro; acao operacional foi adiar e estabilizar runner antes de repetir o E2E.
CONTEXTO: 2026-02-07; Web com Playwright 1.58.1; Windows local.

# ID: ERR-0007: `prisma generate` falhando com lock de DLL (`EPERM`)
SINTOMA: `npx prisma generate` falhou com `EPERM` em `query_engine-windows.dll.node`.
CAUSA_RAIZ: Processo Node/backend ativo segurando arquivo da engine Prisma.
ACAO: Procedimento operacional definido: parar backend antes de `prisma generate`; em janela critica, geracao sem engine foi usada para nao interromper servico.
CONTEXTO: 2026-01-30, 2026-02-15 e 2026-02-17; Prisma 5.22.0; Windows.

# ID: ERR-0008: Erro 500 generico em operacoes de produto
SINTOMA: Endpoints de produto retornavam `erro interno no servidor` (500) em falhas de referencia (categoria/status).
CAUSA_RAIZ: Ausencia de tratamento especifico para erros Prisma conhecidos (ex.: `P2003`, `P2025`).
ACAO: Em `apps/api/src/routes/index.ts`, normalizacao de IDs opcionais, validacao previa de referencias, e `try/catch` com tratamento de `P2003/P2025` em `POST/PATCH/DELETE /products`.
CONTEXTO: 2026-02-17; Express 5.2.1; Prisma 5.22.0; API local.

# ID: ERR-0009: Checkout travando em `Aplicando...` no cupom
SINTOMA: Botao de cupom podia ficar indefinidamente em `Aplicando...` quando validacao nao retornava (timeout/rede/erro backend).
CAUSA_RAIZ: Front sem timeout/abort robusto e endpoint publico sem `try/catch` para falhas inesperadas.
ACAO: Em `apps/web/src/components/pages/CheckoutContent.tsx`, adicao de `AbortController` com timeout (`12000ms`) e `finally` para reset; em `apps/api/src/routes/index.ts`, `POST /api/public/discount-coupons/validate` encapsulado em `try/catch` com log e resposta padrao.
CONTEXTO: 2026-02-18; React 19.2.0 + Vite 7.2.4; API Express/Prisma.

# ID: ERR-0010: Falha de build no Vercel por duplicacao de path
SINTOMA: Build quebrava com path invalido `apps/web/apps/web/package.json`.
CAUSA_RAIZ: Root Directory configurado em `apps/web` e `vercel.json` ainda usando comandos com `--prefix apps/web`.
ACAO: Ajuste de `vercel.json`: `installCommand` -> `npm install`, `buildCommand` -> `npm run build`, `outputDirectory` -> `dist`.
CONTEXTO: 2026-02-19; deploy Vercel; frontend Vite.

# ID: ERR-0011: Erro 404 em rotas SPA no Vercel (`/admin`)
SINTOMA: Login funcionava, mas abrir rota SPA (`/admin`) retornava `404 NOT_FOUND`.
CAUSA_RAIZ: Ausencia de rewrite de fallback para `index.html` no deploy.
ACAO: Em `apps/web/vercel.json`, adicionado rewrite global `source: "/(.*)"` para `destination: "/index.html"`.
CONTEXTO: 2026-02-19; Vercel + SPA React Router.

# ID: ERR-0012: Modal "Ver Menu Completo" alto e conteudo vazio apos erro inicial
SINTOMA: Modal nao cabia na viewport e o conteudo podia nao reaparecer apos primeira falha de carregamento.
CAUSA_RAIZ: Layout com `h-full` gerando colapso/overflow e estado `error` persistente sem rearmar fetch ao reabrir.
ACAO: Em `apps/web/src/modules/public-site/sections/HomeServicesSection.tsx`, `openCatalogModal()` passou a resetar para `idle` quando estado anterior era `error`; modal com `max-h` responsivo e area de conteudo com `min-h-0`.
CONTEXTO: 2026-02-24; React 19.2.0; Vite 7.2.4.

# ID: ERR-0013: Erro de relacao ao criar agendamento no chatbot web
SINTOMA: Erro interno ao gravar cliente/agendamento em `POST /public/concierge/book`.
CAUSA_RAIZ: `appointment.clientId` recebia `Customer.id`, mas `Appointment.clientId` referencia `User.id`.
ACAO: Em `apps/api/src/routes/index.ts`, rota passou a usar `customer.userId ?? parsed.data.clientId` para `clientId`, mantendo lookup/upsert de `Customer` por telefone.
CONTEXTO: 2026-02-24; API Express 5.2.1 + Prisma 5.22.0; Railway/local.

# ID: ERR-0014: Erro interno em `GET /api/admin/section-toggles`
SINTOMA: Tela de toggles no Admin abria com erro interno; endpoint podia retornar `500`.
CAUSA_RAIZ: Resolucao de path de `sectionToggles.ts` dependente de `process.cwd()`, variando entre ambientes (local/Railway).
ACAO: Em `apps/api/src/routes/index.ts`, troca para resolver robusto com multiplos caminhos candidatos (`cwd` + `__dirname`), `fs.existsSync`, e diagnostico com paths testados.
CONTEXTO: 2026-02-24; API no Railway/local; Node v20.19.5.

# ID: ERR-0015: Erro de compilacao TS apos extracao do admin shell
SINTOMA: Build com erro `Cannot find name setActiveView` apos extracao de modulo.
CAUSA_RAIZ: `setActiveView` nao estava sendo exportado/reconectado entre modulo `admin-shell` e camada legacy.
ACAO: `setActiveView` foi exportado no retorno de `initAdminShellBehavior` e reconectado em `apps/web/src/legacy/admin.behavior.ts`.
CONTEXTO: 2026-02-16; TypeScript 5.9.x; React 19.2.0.

# ID: ERR-0016: `prisma migrate deploy` bloqueado por `P3005` (schema sem baseline)
SINTOMA: `npx prisma migrate deploy` falhou com erro `P3005` (schema existente sem baseline).
CAUSA_RAIZ: Banco alvo ja possuia estrutura previa sem baseline de migrations.
ACAO: Acao registrada como pendente: aplicar estrategia de baseline no banco local correto (Laragon) antes de usar endpoints novos em runtime.
CONTEXTO: 2026-03-01; Prisma 5.22.0; MySQL local (Laragon).

## Erros Extraidos dos Contextos de Conversa (sessoes Codex)

# ID: ERR-0017: Timeout recorrente em buscas/leitura de arquivos grandes
SINTOMA: Mensagens de sessao como "As buscas deram timeout pelo tamanho dos arquivos" e "comandos estouraram timeout do ambiente".
CAUSA_RAIZ: Consultas amplas em arquivos/logs extensos com timeout padrao curto para o volume de dados.
ACAO: Reexecutar em comandos menores e aumentar timeout; separar leitura por blocos/arquivos especificos.
CONTEXTO: Sessoes Codex em Windows/PowerShell, workspace `c:\laragon\www\JLR_AI_Studio`.

# ID: ERR-0018: Falha `ENOTCACHED` ao executar compilacao Tailwind via `.bat`
SINTOMA: Execucao de `compile_tailwind.bat` falhou com erro de cache offline do npm (`ENOTCACHED`).
CAUSA_RAIZ: Ambiente sem acesso/entrada de cache necessaria para `npx tailwindcss@...` no momento da execucao.
ACAO: Script foi mantido funcional; tratar como incidente operacional (garantir cache/rede ou dependencia local instalada) e rerodar.
CONTEXTO: Sessao 2026-02-07; Node/npm em Windows local.

# ID: ERR-0019: Falha de comando por quoting do caminho do `pwsh`
SINTOMA: "Os comandos falharam por quoting do caminho do `pwsh`" durante validacao.
CAUSA_RAIZ: Escape/quoting incorreto ao montar comando com caminho contendo espacos (`C:\Program Files\PowerShell\7\pwsh.exe`).
ACAO: Reexecutar validacoes com `npm` direto no `workdir` alvo (`apps/web`) sem wrapper de caminho quoted.
CONTEXTO: Sessao 2026-02-24; Windows + PowerShell.

# ID: ERR-0020: Falha de patch por mismatch em `saveError`
SINTOMA: "Patch do `AdminSectionTogglesView` falhou em uma linha por mismatch (`saveError`)".
CAUSA_RAIZ: Drift de contexto no arquivo (linha alvo divergente do hunk aplicado).
ACAO: Reaplicar patch em blocos menores/mais localizados para evitar conflito de contexto.
CONTEXTO: Sessao 2026-02-24; `apps/web/src/modules/admin-section-toggles/components/AdminSectionTogglesView.tsx`.

# ID: ERR-0021: `spawn EPERM` do esbuild em log de fluxo da API
SINTOMA: `apps/api/tmp-flow-err.log` registrou `spawn EPERM` do `esbuild`.
CAUSA_RAIZ: Erro de execucao no ambiente (permissao/lock de processo/arquivo), sem evidencia de bug funcional direto na aplicacao.
ACAO: Tratar como incidente operacional; repetir em terminal limpo e validar bloqueios de processo/antivirus.
CONTEXTO: Sessao 2026-02-16; API Node/TypeScript em Windows.

# ID: ERR-0022: Falha de validacao por script `lint` inexistente no backend
SINTOMA: Tentativa de `apps/api: npm run lint` resultou em script inexistente.
CAUSA_RAIZ: `apps/api/package.json` nao define script `lint`.
ACAO: Validacao tecnica seguiu por `npm run build` e `npm test`; pendencia de padronizacao de script de lint no backend.
CONTEXTO: Sessoes de fevereiro/2026 no workspace JLR; Node 20.19.5, TypeScript 5.9.x.

# ID: ERR-0023: Caminho incorreto para `package.json` na raiz do monorepo
SINTOMA: `Get-Content package.json` retornou "Cannot find path 'C:\laragon\www\JLR_AI_Studio\package.json' because it does not exist".
CAUSA_RAIZ: Repositorio em formato monorepo sem `package.json` na raiz; manifests estao em `apps/api` e `apps/web`.
ACAO: Ajustar descoberta para `apps/api/package.json` e `apps/web/package.json`.
CONTEXTO: Sessao 2026-03-02; PowerShell no workspace JLR.

# ID: ERR-0024: Varredura global de sessoes excedeu limite de execucao
SINTOMA: Comando de busca em `C:\Users\Jeiel\.codex\sessions\2026` terminou com `command timed out after 120053 milliseconds`.
CAUSA_RAIZ: Escopo de busca amplo (multiplos arquivos grandes `.jsonl`) com padrao extenso em uma unica chamada.
ACAO: Repartir consulta por subconjuntos (datas/padroes), limitar retorno e iterar por etapas.
CONTEXTO: Sessao 2026-03-02; PowerShell/Codex com timeout por comando.

# ID: ERR-0025: Modal da galeria exibia imagem estourada e sem fluxo seguro de salvamento
SINTOMA: Ao abrir o editor da imagem por slot, a visualizacao ficava grande demais/cortada e o usuario fechava o modal sem acao explicita de salvar.
CAUSA_RAIZ: Preview com dimensionamento inadequado para o container e UX do modal sem CTA local de persistencia.
ACAO: Em `apps/web/src/modules/admin-media-gallery/components/AdminMediaGalleryView.tsx`, o preview foi padronizado em box fixo medio com imagem contida (`object-contain`, `max-w/max-h`) e foi adicionado fluxo explicito `Salvar e fechar` + confirmacao em `Fechar sem salvar`.
CONTEXTO: Sessao 2026-03-03; React + Vite no modulo `admin-media-gallery`; validacao manual do usuario concluida.

# ID: ERR-0026: Build Docker falhou — prop `title` obsoleto em AssinaturasContent
SINTOMA: `docker compose up -d --build api web` falhou com erro TypeScript: `Type '{ title: string; }' is not assignable to type 'IntrinsicAttributes'. Property 'title' does not exist on type 'IntrinsicAttributes'` em `AssinaturasContent.tsx(17,53)`.
CAUSA_RAIZ: `AssinaturasContent.tsx` passava `title="Faça sua Assinatura e Economize!"` para `<HomeMembershipSection>`, que antes aceitava esse prop. Apos a migracao do PLAN-0012, o componente passou a ler o titulo via `usePageText("home.membership.title")` e nao aceita mais props externos — a interface ficou incompativel.
ACAO: Removido o prop `title` da linha 17 de `apps/web/src/components/pages/AssinaturasContent.tsx`. O titulo agora vem do catalogo de textos (editavel via Admin > Textos).
CONTEXTO: Sessao 2026-06-12; PLAN-0012 migracao de componentes; Docker build no host Linux.

# ID: ERR-0027: Seed falhou no container de producao — `Cannot find module '../src/utils/logger'`
SINTOMA: `docker compose exec api npx tsx prisma/seed.ts` retornou `Error: Cannot find module '../src/utils/logger'` dentro do container da API.
CAUSA_RAIZ: O container de producao contem apenas `dist/` (codigo compilado) — o diretorio `src/` nao e copiado para a imagem final. O `tsx` tentou resolver `../src/utils/logger` em tempo de execucao, mas o arquivo nao existe no container.
ACAO: Usar o seed ja compilado pelo `seed:build` (esbuild gera `dist/seed.js` com todas as dependencias internas em bundle). Comando correto: `docker compose exec api node dist/seed.js`.
CONTEXTO: Sessao 2026-06-12; container Docker producao (node:20-slim, apenas dist/); seed rodado apos PLAN-0012.

# ID: ERR-0028: Section Toggles "acesso negado" — diagnóstico inicial errado, causa real: email hardcoded na API
SINTOMA: Admin > Seções SPA retornava "acesso negado" para o usuário MASTER (admin@jlrbeauty.com). Diagnóstico inicial errado: achamos que era `canEdit` MASTER-only no frontend. Fix provisório (ADMIN ou MASTER) revertido.
CAUSA_RAIZ_REAL: `canEditSectionToggles()` em `apps/api/src/routes/admin.ts` linha 95 verificava `user.email === "jeiel.borner@gmail.com"` (email pessoal hardcoded). O email do MASTER do sistema é `admin@jlrbeauty.com`, então a verificação nunca passava.
CAUSA_SECUNDARIA: O usuário acidentalmente trocou sua própria role de MASTER para ADMIN pela UI de Pessoas. A API bloqueia corretamente escalada para MASTER se o token atual não for MASTER (lines 79/128/183 de users.ts), criando deadlock. Role restaurada diretamente no banco via psql.
ACAO: (1) `canEditSectionToggles` reescrito para verificar `user.role === "MASTER"` em vez de email. (2) Role de `admin@jlrbeauty.com` restaurada via `UPDATE "User" SET role = 'MASTER' WHERE email = 'admin@jlrbeauty.com'`. (3) `AdminContent.tsx` e `AdminSectionTogglesView.tsx` revertidos para lógica MASTER-only original.
CONTEXTO: Sessao 2026-06-12; `apps/api/src/routes/admin.ts` linha 89–96; `apps/web/src/modules/admin-section-toggles/components/AdminSectionTogglesView.tsx`.

# ID: ERR-0029: nginx não subia após reboot do computador ##bug
SINTOMA: Após reinicialização do SO, `docker compose ps` mostrava apenas 3 containers (postgres, api, web). nginx ausente — não aparecia nem em estado de erro. Site carregava (web container servindo SPA diretamente via porta 80 interna) mas login falhava porque não havia proxy para a API.
CAUSA_RAIZ: `docker-compose.yml` definia `nginx.depends_on.api.condition: service_healthy`. O Compose CLI respeita `depends_on` durante `docker compose up`, mas o Docker daemon — responsável pelo restart automático com política `restart: unless-stopped` — ignora completamente `depends_on`. No reboot, nginx iniciava antes da API estar healthy, falhava, entrava em backoff exponencial (1s → 2s → 4s → ... → 30s) e após 34 min estava em pausa longa, invisível no `docker compose ps`.
ACAO: Alterado `condition: service_healthy` → `condition: service_started` para a dependência `api` do serviço `nginx` em `docker-compose.yml`. Nginx passa a subir junto com os demais containers e serve `502` por poucos segundos enquanto a API aquece — comportamento correto.
CONTEXTO: Sessao 2026-06-13; `docker-compose.yml` serviço nginx; Linux/Docker daemon restart policy; JLR_Beauty produção Docker.

# ID: ERR-0032: Novas seções e toggles não apareciam — `readSectionTogglesFromSettings` não mesclava com defaults ##bug
SINTOMA: Após rebuild com PLAN-0014, as seções `mission` (todas as páginas) e `about` (franquias) não apareciam no site público nem como switches no Admin > Seções Públicas. A imagem do slot apareceu corretamente.
CAUSA_RAIZ: `readSectionTogglesFromSettings` em `apps/api/src/routes/admin.ts` retornava o snapshot do banco diretamente via `cloneSectionToggleMap(parsed.data)` sem mesclar com `DEFAULT_PUBLIC_SECTION_TOGGLES`. O banco continha um snapshot antigo (salvo antes do PLAN-0014) sem as chaves `mission` e `franquias.about`. Como o snapshot era válido, o fallback nunca era acionado — as novas chaves simplesmente não existiam na resposta da API.
ACAO: Adicionada função `mergeWithDefaultSectionToggles(stored)` que parte de um clone dos defaults e sobrepõe os valores armazenados. `readSectionTogglesFromSettings` agora retorna `mergeWithDefaultSectionToggles(parsed.data)`. Isso garante que novas seções adicionadas aos defaults sempre apareçam, mesmo quando o banco tem um snapshot anterior. O comportamento é idêntico ao `normalizeSnapshot` já existente no frontend (`sectionToggles.runtime.ts`).
CONTEXTO: Sessão 2026-06-13; PLAN-0014; `apps/api/src/routes/admin.ts`; padrão — ao adicionar novas seções aos defaults, o banco nunca tem as chaves novas até o admin salvar manualmente.

# ID: ERR-0031: Build Docker falhou — `mission_center_img_01` ausente do catálogo de media slots do frontend ##bug
SINTOMA: `docker compose up -d --build` falhou com erro TypeScript no build do `web`: `Argument of type '"mission_center_img_01"' is not assignable to parameter of type '"home_hero_bg_01" | ... | "checkout_whatsapp_icon_01"'` em `MissionSection.tsx:7`.
CAUSA_RAIZ: O projeto mantém dois catálogos de media slots paralelos e independentes: `apps/api/src/modules/mediaSlots/service.ts` (backend, fonte de verdade da API) e `apps/web/src/modules/public-site/mediaSlots.ts` (frontend, lista `as const` que gera o tipo `MediaSlotId`). O hook `useMediaSlot(id)` é tipado contra o catálogo do frontend. Ao adicionar `mission_center_img_01` apenas no backend, o TypeScript do frontend rejeitou a chave como inválida.
ACAO: Adicionado `mission_center_img_01` em `apps/web/src/modules/public-site/mediaSlots.ts` — entrada idêntica à do backend (`page: "global"`, `section: "mission"`, `fallbackUrl: "/images/about_img1.webp"`). Build passou sem erros após a correção.
CONTEXTO: Sessão 2026-06-13; PLAN-0014; padrão arquitetural — qualquer novo slot de mídia precisa ser adicionado nos **dois** arquivos simultaneamente.

# ID: ERR-0033: nginx sem config após ligar o computador — contingência de drive externo
SINTOMA: Containers todos UP (`docker compose ps` mostra 4 serviços healthy), mas `http://localhost` retorna `ERR_SOCKET_NOT_CONNECTED` no browser. `curl http://localhost` conecta mas recebe "Conexão fechada pela outra ponta" imediatamente. `docker exec nginx ls /etc/nginx/conf.d/` retorna vazio.
CAUSA_RAIZ: O projeto reside em `/media/jeiel/A8FEADE5FEADABCE6/` — partição Linux criada dentro de um HD secundário compartilhado com Windows (dual-boot). O GNOME/udisks2 só monta essa partição quando o usuário clica explicitamente no gerenciador de arquivos. O Docker daemon sobe cedo no boot com `restart: unless-stopped` e recria os containers antes da partição estar montada. O bind-mount `./nginx/ → /etc/nginx/conf.d/` captura o diretório vazio (caminho inexistente no momento do start). Após a montagem manual do drive, a partição fica acessível no host mas o container já tem o bind-mount capturado apontando para nada. Nginx sobe sem nenhum `server {}` definido — aceita TCP mas fecha imediatamente.
ACAO: Não é um bug — é contingência do setup. Procedimento após ligar o computador: (1) montar o drive pelo gerenciador de arquivos; (2) executar `./scripts/fix-nginx.sh` (ou `docker compose up -d --force-recreate nginx`). Script de conveniência criado em `scripts/fix-nginx.sh`.
CONTEXTO: Sessão 2026-06-14; setup dual-boot HD compartilhado Windows/Linux; não requer alteração de código.

# ID: ERR-0034: Chaves de page text com prefixo incorreto em 3 seções — textos não carregavam ##bug
SINTOMA: Textos das seções FranquiasEtapasAbertura, FranquiasPerfilFranqueado e FranquiasSuporteFranqueadora retornavam string vazia ou fallback na tela pública após PLAN-0015.
CAUSA_RAIZ: Os 3 componentes foram codificados com prefixos longos nas chaves de page text (`etapas_abertura.*`, `perfil_franqueado.*`, `suporte_franqueadora.*`) que não correspondiam às chaves registradas em `catalog.ts` — que usavam os prefixos curtos `etapas.*`, `perfil.*`, `suporte.*`. `usePageText()` retorna a própria chave como fallback quando não encontra match, exibindo o literal da chave em vez do texto.
ACAO: Renomeadas as chaves nos 3 componentes para corresponder exatamente ao catálogo: `FranquiasEtapasAberturaSection.tsx` (`etapas_abertura` → `etapas`), `FranquiasPerfilFranqueadoSection.tsx` (`perfil_franqueado` → `perfil`), `FranquiasSuporteFranqueadoraSection.tsx` (`suporte_franqueadora` → `suporte`).
CONTEXTO: Sessão 2026-06-16; pós-PLAN-0015; `apps/web/src/modules/public-site/sections/`; padrão — ao criar seções novas, as chaves do componente devem ser copiadas literalmente do `catalog.ts`.

# ID: ERR-0035: Seções 2-col sem max-width — conteúdo esticado em monitores largos ##bug
SINTOMA: Em viewports > 1400px, as seções FounderSection, ExpansaoSection, MarketingCrmSection, PerfilFranqueadoSection e SuporteFranqueadoraSection apresentavam o grid de 2 colunas expandido indefinidamente até a borda da tela, gerando blocos de texto e imagem excessivamente largos.
CAUSA_RAIZ: Os containers internos das seções (`<div className="grid grid-cols-1 lg:grid-cols-2">`) eram filhos diretos de `<section className="w-full">` sem nenhum `max-w` limitador. O padrão do projeto é envolver o grid em `mx-auto max-w-[1200px]`, como já era feito em outras seções da mesma página.
ACAO: Adicionado `mx-auto max-w-[1200px]` ao div de grid nas 5 seções afetadas. ExpansaoSection também tinha cor de fundo incorreta (`bg-beige` — classe inexistente no Tailwind config do projeto) corrigida para `bg-gold-light`; gradiente de overlay ajustado de `to-beige/30` para `to-gold-light/30`.
CONTEXTO: Sessão 2026-06-16; pós-PLAN-0015; `apps/web/src/modules/public-site/sections/`; padrão — novas seções de largura total com grid interno devem sempre usar `mx-auto max-w-[1200px]` no container do grid.

# ID: ERR-0036: Ícones ✦ decorativos causando desalinhamento de baseline em títulos ##bug
SINTOMA: Títulos das seções BenefitsSection, GestaoAppSection e PerfilFranqueadoSection exibiam desalinhamento visual — o `<h2>` ficava fora de eixo devido à diferença de tamanho de fonte entre o ícone e o texto do título.
CAUSA_RAIZ: `<span>✦</span>` inseridos como irmãos inline de `<h2>` em contexto flex não têm alinhamento de baseline consistente com text-4xl/5xl. Em mobile, o ícone occupava espaço fora da caixa do título quebrando o layout do cabeçalho.
ACAO: Removidos os spans decorativos ✦ de BenefitsSection (2 flanqueando o h2), GestaoAppSection (após o título inline) e PerfilFranqueadoSection (antes do h2 junto com container flex).
CONTEXTO: Sessão 2026-06-16; pós-PLAN-0015; `apps/web/src/modules/public-site/sections/`.

# ID: ERR-0037: FluxoCaixaSection — layout decorativo sem imagens + 3 media slots ausentes do catálogo ##bug
SINTOMA: A seção FluxoCaixaSection exibia layout 2-col com stripe teal à direita contendo apenas ícones ✦ decorativos, sem imagem real. O conteúdo visual da seção era insuficiente para comunicar as features. Além disso, os 3 media slots de imagem por feature não existiam no catálogo (api nem web).
CAUSA_RAIZ: O PLAN-0015 implementou o layout inicial com stripe decorativa como placeholder visual, sem adicionar media slots de imagem ao catálogo. A seção foi entregue sem os slots `franquias_fluxo_caixa_feature_img_0*` em `service.ts` (api) nem em `mediaSlots.ts` (web).
ACAO: Layout substituído por grid 3-col de cards (imagem + título + descrição) com `h-[200px]` e `object-cover` por imagem. Adicionados 3 media slots (`franquias_fluxo_caixa_feature_img_01/02/03`) em `apps/api/src/modules/mediaSlots/service.ts` e em `apps/web/src/modules/public-site/mediaSlots.ts` — padrão ERR-0031 aplicado: slots devem ser adicionados nos dois arquivos simultaneamente.
CONTEXTO: Sessão 2026-06-16; pós-PLAN-0015; `FranquiasFluxoCaixaSection.tsx`, `service.ts`, `mediaSlots.ts`.

# ID: ERR-0038: EtapasAberturaSection — snake layout desproporcional em viewports médias ##bug
SINTOMA: Em telas entre 768px e 1100px, o snake de 10 passos extrapolava o container — bolhas numéricas (w-14 h-14) demasiado grandes para o espaço disponível, empurrando o texto dos passos para fora ou quebrando a linha de conexão entre os steps.
CAUSA_RAIZ: O PLAN-0015 dimensionou o container com `max-w-[1100px]` e bolhas `w-14 h-14` para um snake de 4 itens por linha. Em viewports médias, cada bolha de 56px + gap + texto `max-w-[120px]` não cabia em 4 colunas sem overflow.
ACAO: Bolhas reduzidas para `w-10 h-10` (40px), fonte interna de `text-lg` → `text-sm`; `max-w-[120px]` do texto → `max-w-[100px]`; container reduzido para `max-w-[620px]` — snake fica em layout mais compacto mas com proporções corretas. Adicionados `min-w-0` nas células e `Fragment` substituindo o wrapper extra para evitar overflow implícito.
CONTEXTO: Sessão 2026-06-16; pós-PLAN-0015; `apps/web/src/modules/public-site/sections/FranquiasEtapasAberturaSection.tsx`.

# ID: ERR-0039: AdminMediaGalleryView — Masonry Grid com alturas irregulares entre cards ##bug
SINTOMA: Na galeria Admin > Mídia, os cards de imagem exibiam alturas completamente diferentes entre si — fotos em portrait dominavam colunas inteiras enquanto imagens em landscape ficavam comprimidas, criando layout visualmente inconsistente.
CAUSA_RAIZ: O Masonry Grid de 4 colunas (PLAN-0012) distribuía slots entre colunas via `i % numCols` e renderizava imagens com `h-auto` respeitando a proporção original. Slots de franquias adicionados no PLAN-0015 têm proporções heterogêneas (ícones quadrados + fotos landscape + fotos portrait).
ACAO: Layout Masonry substituído por grid flat `grid-cols-2 md:grid-cols-4` com cada card em `div.h-[180px]` + `img.object-cover` — altura uniforme em todos os slots independente da proporção original. Lógica de colunização (`columns[]`, `i % numCols`) removida.
CONTEXTO: Sessão 2026-06-16; pós-PLAN-0015; `apps/web/src/modules/admin-media-gallery/components/AdminMediaGalleryView.tsx`.

# ID: ERR-0030: 502 Bad Gateway + tela branca após `docker compose up --build` ##bug
SINTOMA: Após rebuild com `docker compose up -d --build`, site retornava `502 Bad Gateway`. Após restart manual do nginx, site carregava mas ficava tela branca — JS do bundle era servido com `Content-Type: text/html` e tamanho 533 bytes (= index.html gzipado) em vez de 955 KB.
CAUSA_RAIZ: Dois problemas encadeados:
  (1) Bind mount de arquivo único (`./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro`): ao editar o arquivo no host, ferramentas de edição criam novo inode (write-to-temp + rename). Docker bind de arquivo único aponta para o inode original — que foi deletado. Container vê "No such file or directory" para o arquivo montado, e nginx cai para config padrão sem nenhum virtual host configurado → 502.
  (2) `proxy_pass http://$upstream_web/` com variável: no nginx, quando `proxy_pass` usa variável E inclui URI (mesmo apenas `/`), o URI do proxy_pass SUBSTITUI a URI completa da request em vez de apenas substituir o prefixo da location. Resultado: toda request (`GET /assets/index.js`, `GET /api/...`) era encaminhada ao upstream como `GET /`.
ACAO: (1) Volume alterado de bind de arquivo para bind de diretório: `./nginx/:/etc/nginx/conf.d/:ro` — diretório bind não perde referência ao editar arquivos internos. (2) Removida a `/` final de todos os `proxy_pass http://$var` no `nginx/nginx.conf` — sem URI no proxy_pass, nginx repassa a URI original intacta ao upstream.
CONTEXTO: Sessao 2026-06-13; `docker-compose.yml` volumes nginx; `nginx/nginx.conf` proxy_pass; comportamento nginx com variáveis documentado em http://nginx.org/en/docs/http/ngx_http_proxy_module.html.
