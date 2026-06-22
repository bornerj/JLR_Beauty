# Requisitos de Refatoracao Final (Baseline Atual)

Documento ativo para guiar a reta final da refatoracao para React puro com modularizacao reutilizavel.

Observacao: este documento substitui, para a frente de refatoracao, o uso de `docs/project/REQUIREMENTS.md` ate revisao final.

## Escopo aprovado
1. Prioridade zero: concluir frontend em 100% React (sem dependencia operacional de `LegacyHtml` e `legacy/*.behavior`).
2. Modularizacao por dominio com fronteiras claras (interfaces de entrada/saida) para reaproveitamento em outros projetos.
3. Regras de negocio e acesso a dados concentrados no backend (`Express + Prisma`), mantendo frontend sem logica de negocio.
4. Modulos administrativos de cadastro separados por dominio (usuarios, clientes, profissionais, produtos, estoque e vendas).
5. Dashboard admin com KPIs reais e alimentados por banco de dados (sem cards mockados como fonte primaria).
6. Modulo de vendas completo como etapa seguinte, sem desviar da prioridade zero da refatoracao.
7. Ponto de retorno por fase (rollback), com checkpoints no `memory/MODIFICATION_LOG.md`.
8. Preparacao para migracao MySQL -> PostgreSQL com mapa de impacto claro e mudancas localizadas.

## Requisitos arquiteturais obrigatorios
1. Frontend
   - Cada dominio vira modulo em `apps/web/src/modules/<dominio>`.
   - Componente nao acessa banco; consome apenas API versionada/estavel.
   - Dependencias externas do modulo entram por parametros/interfaces, sem acoplamento oculto.
2. Backend
   - Cada dominio vira modulo em `apps/api/src/modules/<dominio>`.
   - Regras, validacoes, agregacoes, KPI e persistencia ficam em `Express + Prisma`.
   - Queries SQL manuais, quando necessarias, sempre parametrizadas.
3. Banco e ORM
   - Prisma permanece como camada de abstracao principal.
   - Mudancas de schema/migration exigem regeneracao do client (`npx prisma generate` em `apps/api`).
4. Compatibilidade e rollback
   - Cada rodada deve manter camada de compatibilidade ate paridade funcional.
   - Remocao de legado somente apos validacao de build/lint/testes e checklist funcional.

## Modulos-alvo para reaproveitamento
1. `menu`
   - Navegacao, auth-status e indicadores operacionais (ex.: LED de saude DB).
2. `footer`
   - Rodape institucional reutilizavel e parametrizavel.
3. `chatbot`
   - Fluxo completo (frontend, backend, integracoes Z-API, contratos de API e estados).
4. `admin-cadastros`
   - Submodulos: usuarios, clientes, profissionais, produtos, estoque, vendas.
5. `admin-kpis`
   - KPIs e visoes de dashboard com fonte em banco e filtros por periodo.

## KPIs reais (primeira tela Admin)
1. Receita bruta no periodo.
2. Pedidos por status (pendente, pago, enviado, entregue, cancelado).
3. Agendamentos por status (pendente, confirmado, cancelado) e visao diaria.
4. Assinaturas por status (ativa, pendente, inadimplente, cancelada).
5. Ticket medio de pedidos pagos.
6. Novos clientes no periodo.

Regra: calculo de KPI no backend; frontend apenas renderiza.

## Criterios de aceite da prioridade zero
1. Zero dependencia operacional de `LegacyHtml` nas rotas principais.
2. Zero dependencia operacional de `legacy/*.behavior` nas rotas principais.
3. Rotas publicas e admin em componentes React modulares.
4. Lint e build do frontend passando.
5. Build e testes do backend passando.
6. Checkpoint de continuidade registrado no `memory/MODIFICATION_LOG.md`.

## Roadmap de execucao recomendado
1. Fechar migracao React do Admin por dominio (removendo acoplamentos legados).
2. Implementar endpoint de KPIs reais no backend e ligar no dashboard admin.
3. Consolidar modulo `admin-cadastros` com contratos estaveis.
4. Fechar modulo de vendas (cadastro, listagem, status, indicadores basicos).
5. Remover legado residual com validacao final.
6. Executar fase de preparacao PostgreSQL com base no `docs/evolutive_changes/POSTGRES_MIGRATION_PLAN.md`.


