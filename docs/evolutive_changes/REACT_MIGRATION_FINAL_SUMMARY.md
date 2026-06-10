# Resumo Final da Migracao para Runtime React

Data de referencia: 2026-02-17

## 1. Estado estrutural atual
1. Frontend em runtime React/TSX para rotas publicas e Admin.
2. Sem dependencia operacional de `HtmlTemplate`, `*.html?raw` e `dcmsky`.
3. Comportamentos organizados por modulo em `apps/web/src/modules/*`.
4. Endpoint de configuracoes administrativas migrado de `/api/content` para `/api/settings`.

## 2. Mudancas consolidadas no ultimo ciclo
1. Mini-CMS legado por `dcmsky` foi descontinuado no runtime.
2. `admin-whatsapp-contacts` passou a consumir `GET/PUT /api/settings/:key`.
3. `DbConsole` foi ajustado para `Settings`.
4. Scripts PHP do mini-CMS e arquivos de data foram neutralizados (sem efeito operacional).

## 3. Ganhos concretos no projeto
1. Menos acoplamento com legado e menos pontos de falha por markup dinamico.
2. Fluxo de configuracao operacional separado de conteudo estatico de pagina.
3. Estrutura modular mais previsivel para manutencao.
4. Build/lint/test com baseline estavel apos a mudanca.

## 4. Validacao executada
1. `apps/web`: `npm run lint` PASS.
2. `apps/web`: `npm run build` PASS.
3. `apps/api`: `npm run build` PASS.
4. `apps/api`: `npm test` PASS (5/5).

## 5. O que falta (para continuar amanha)
1. Remover fisicamente (delete real) artefatos legados neutralizados:
   - `cms/apply_cmskey.php`
   - `cms/gen_cmskey.php`
   - `cms/report_missing_keys.php`
   - `data/content.json`
   - `data/content.backup.20260124-043538.json`
   - `data/missing_keys.json`
   - `data/report_missing_keys.json`
2. Homologacao funcional final no browser (fluxos mais sensiveis):
   - Admin Dashboard (KPI + Leads)
   - Pessoas (inclusao/listagem)
   - WhatsApp contatos (carregar/salvar settings)
3. Opcional de saneamento de schema:
   - migrar nome da tabela fisica de `ContentEntry` para `Setting` (hoje o model Prisma ja esta em `Setting` com `@@map("ContentEntry")`).

## 6. Observacao operacional
A limpeza fisica dos arquivos legados foi bloqueada por permissao de filesystem no ambiente atual; por isso os arquivos foram neutralizados, mas ainda existem no repositorio.
