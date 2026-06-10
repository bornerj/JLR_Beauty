# Roadmap (Atualizado)

Data de referencia: 2026-02-26

## 1) Estado atual (concluido)
- Runtime principal em React modular (publico + admin), com dominios separados em `apps/web/src/modules/*`.
- Estrategia de seccionamento da SPA publica consolidada (Home/Assinaturas/Franquias).
- Painel Admin `Secoes SPA` entregue e operacional.
- Persistencia de toggles migrada para banco via `settings` (`public.sectionToggles`), com leitura publica em runtime.
- Branding global dinamico entregue:
  - persistencia em `settings` (`public.branding`);
  - endpoints admin/public;
  - cache TTL no backend;
  - runtime store no frontend;
  - tela Admin `Branding`.

Referencia detalhada:
- `docs/evolutive_changes/SPA_SECTIONS_AND_SETTINGS_HISTORY.md`

## 2) Proxima fase (curto prazo)
- Hardening operacional de `Secoes SPA`:
  - validar fluxo completo em homologacao e producao (salvar no Admin -> refletir no publico);
  - reforcar observabilidade de erro para leitura/escrita de toggles;
  - garantir consistencia de schema/payload do snapshot `public.sectionToggles`.
- Hardening operacional de `Branding`:
  - validar troca de `fullName`/`shortName`/`logoUrl` em todas as telas publicas e admin;
  - monitorar expiracao e invalidação do cache TTL backend;
  - reforcar cobertura de regressao para fluxos sensiveis (auth/cart/concierge).
- Atualizacao documental:
  - manter `documentations/MODULES_CATALOG.md` alinhado ao estado real de modulos;
  - revisar `docs/project/PROJECT_OVERVIEW.md` quando houver mudancas estruturais.

## 3) Fase de plataforma (medio prazo)
- Evoluir backend e dados sem quebrar contratos:
  - consolidar padroes de configuracoes em `settings`;
  - reduzir residuos de compatibilidade legado quando validado em producao;
  - preparar frente de banco conforme `docs/evolutive_changes/POSTGRES_MIGRATION_PLAN.md`.

## 4) Qualidade continua (transversal)
- Manter validacoes de entrega por rodada:
  - frontend: lint + build;
  - backend: build + testes;
  - registrar marcos de INICIO/FIM em `memory/MODIFICATION_LOG.md` e execucao detalhada em `memory/plans/`.

