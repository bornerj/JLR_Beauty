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
