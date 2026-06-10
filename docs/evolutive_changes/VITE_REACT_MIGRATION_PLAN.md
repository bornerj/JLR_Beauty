# Vite/React Migration Plan (Sem Legado)

## Objetivo
Migrar o frontend para 100% Vite/React, removendo dependencias de `apps/web/src/legacy` (`?raw`, `LegacyHtml`, `*.behavior`), mantendo paridade visual e funcional.

## Status Atual (2026-02-09)
- Progresso geral estimado: em andamento (migracao parcial).
- Avanco recente concluido:
  - Checkout convertido de pagina dedicada para modal global.
  - Rotas `/checkout` e `checkout.html` redirecionadas para `/?checkout=1`.
  - Fluxos legados de CTA de checkout agora disparam abertura de modal.
  - `lint` e `build` do `apps/web` validados apos a mudanca.
- Ponto de atencao atual:
  - Conteudo do checkout ainda depende de template legado (`checkout.content.html`) dentro do modal.
  - Pipeline Tailwind ainda com ambiguidade entre raiz e app Vite.

## Fase 1 - Baseline e Paridade
Status: parcial
1. Mapear fluxos atuais por rota: `/`, `/assinaturas`, `/franquias`, `/checkout`, `/admin`.
2. Capturar evidencias visuais (prints) e comportamentais (E2E/fluxos manuais).
3. Listar pontos obrigatorios de paridade:
   - blocos de conteudo
   - modais
   - `data-*` usados por scripts
   - atributos `data-*` de runtime

## Fase 2 - Shared UI em React
Status: parcial
1. Consolidar componentes comuns em React:
   - navegacao publica
   - footer
   - modais globais
2. Mover estado e interacao para hooks/context React.
3. Remover dependencias globais de `legacy/*.behavior` quando houver equivalente React.
4. Atualizar padrao de modais:
   - feito: checkout modal integrado ao `PublicLayout`.
   - pendente: consolidar abertura/fechamento sem eventos legados globais.

## Fase 3 - Migracao de Paginas Publicas
Status: em andamento
Ordem recomendada:
1. Home (`index.content.html` -> componentes React)
2. Assinaturas (`assinaturas.content.html` -> componentes React)
3. Franquias (`franquias.content.html` -> componentes React)
4. Checkout (`checkout.content.html` -> componentes React)

Para cada pagina:
1. Reescrever markup em TSX.
2. Substituir handlers DOM por estado React.
3. Preservar contratos visuais e atributos necessarios.
4. Remover import `?raw` da pagina migrada.

Checkpoint da fase:
- Checkout ja mudou de pagina para modal, mas ainda nao foi reescrito em TSX puro.

## Fase 4 - Migracao do Admin
Status: pendente para remocao estrutural do legado
1. Substituir `admin.body.html` por componentes React modulares:
   - usuarios
   - servicos
   - produtos
   - memberships
   - agenda/pedidos
2. Migrar regras de modal/tabela para estado React.
3. Remover `initAdminPage()` apos paridade.

## Fase 5 - Limpeza de Legado
Status: pendente
1. Remover `LegacyHtml.tsx`.
2. Remover imports `?raw` restantes.
3. Remover `apps/web/src/legacy/*.behavior` nao usados.
4. Remover arquivos `apps/web/src/legacy/*.content.html` quando zerar consumo.

## Fase 6 - Pipeline de Estilos Unificado
Status: pendente (prioridade alta)
1. Definir uma unica fonte de verdade para CSS da SPA (`apps/web/src/styles/*`).
2. Eliminar ambiguidade entre compilacao Tailwind da raiz e CSS do app.
3. Garantir que utilitarios usados nas paginas migradas estejam no pipeline ativo do Vite.
4. Formalizar comando unico de build CSS para ambiente local e CI.

## Fase 7 - Hardening e Encerramento
Status: parcial
1. Rodar `npm run lint` e `npm run build` no `apps/web`.
2. Executar Playwright E2E para fluxos criticos.
3. Validar responsividade desktop/mobile.
4. Atualizar documentacao final (`PROJECT_OVERVIEW` e `MODIFICATION_LOG`).

## Ajustes Imediatos Recomendados
1. Checkout modal
   - Revisar foco inicial, foco ao fechar e escape/backdrop para acessibilidade.
   - Definir dimensoes finais (desktop/mobile) e comportamento de scroll interno.
2. Remocao de acoplamento legado
   - Trocar eventos globais (`jlr:open-checkout`) por estado/rota React sempre que possivel.
   - Planejar remocao de `checkout.content.html` apos versao TSX equivalente.
3. Tailwind/CSS
   - Unificar pipeline para evitar mudancas que nao refletem no app Vite.
4. Testes
   - Incluir cenario E2E com abertura do checkout modal via CTA da home/assinaturas.
   - Garantir cobertura para fechamento de modal e retorno de scroll do body.

## Criterios de Conclusao
1. Zero uso de `LegacyHtml`.
2. Zero import de `*.html?raw`.
3. Zero uso de `apps/web/src/legacy/*.behavior` nas rotas principais.
4. Rotas publicas e admin renderizadas em componentes React.
5. Lint, build e E2E passando com paridade funcional.
