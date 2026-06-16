Status: ACTIVE
Date: 2026-06-10
Context: O projeto original usava MySQL (Railway). A migração para VPS Docker (DECISION-004) abriu a oportunidade de trocar o banco. PLAN-0010 incluiu a migração de schema como parte da infraestrutura Docker.
Decision: Adotar PostgreSQL 16 (Alpine) como banco de dados único do projeto, substituindo MySQL. Migration inicial gerada do zero (`20260610042751_init_postgresql`). Migrations antigas descartadas — banco de produção legado (Railway MySQL) migrado manualmente se necessário.
Consequences: Tipos nativos melhores (Json, arrays, enums); melhor suporte a extensões futuras; Prisma 5.22 suporta ambos sem alteração de schema lógico; `binaryTargets` ajustados para node Alpine no Docker; sem migração automática de dados do Railway — responsabilidade do operador.
