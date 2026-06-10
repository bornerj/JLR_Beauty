## Sistema (Regras Tecnicas e Organizacionais)

Estas regras definem padroes de engenharia do projeto.
Regras de processo, continuidade e memoria ficam em `kernel/RULES.md`.

## Linguagem e Stack
- TypeScript com modo strict.
- Node.js 20+ com modulos ESM.
- API em Express.
- ORM: Prisma com MySQL.
- Testes E2E: Playwright.
- Frontend principal: Vite + React.
- Contexto adicional do produto: Next.js App Router e Stripe.

## Estilo de Codigo
- Use componentes funcionais (React).
- Prefira `const` em vez de `let`.
- Use tipos de retorno explicitos em TypeScript.
- Evite `any` (use apenas quando estritamente necessario).
- Use `async/await`; nao use callbacks quando houver alternativa assincrona clara.

## Logging
- NUNCA use `console.log()`.
- Use o logger do projeto: `import { logger } from './utils/logger'`.
- Niveis permitidos: `logger.info()`, `logger.warn()`, `logger.error()`.
- Nunca registre dados sensiveis (senhas, tokens, PII).

## Tratamento de Erros
- Trate erros de forma estruturada (nao deixar falhas criticas propagarem sem contexto).

```ts
try {
  const result = await operation();
  return { success: true, data: result };
} catch (error) {
  logger.error('Operacao falhou', { error });
  return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
}
```

## Seguranca e Entrada de Dados
- Valide toda entrada com schema explicito.
- Assuma que toda entrada externa e maliciosa.
- Use consultas parametrizadas; nunca concatene entrada do usuario em SQL.

```ts
// Bom
await db.query('SELECT * FROM users WHERE email = $1', [email]);

// Ruim
await db.query(`SELECT * FROM users WHERE email = '${email}'`);
```

## Arquitetura Tecnica
- Regras e funcoes de negocio vivem no backend (Express + Prisma).
- Frontend nao acessa banco diretamente; consome apenas APIs HTTP/JSON.
- Controller trata HTTP; regra de negocio fica em services/repositories.
- Rotas sensiveis devem usar `requireAuth` e `requireAdmin`.
- Erros devem seguir o padrao de `apps/api/src/lib/messages.ts`.
- Respostas de validacao retornam `detail` apenas em `NODE_ENV=development`.

## Zod e Consistencia de Mensagens
- Toda entrada deve ter schema Zod explicito.
- Mensagens devem ser normalizadas para PT-BR quando necessario.
- Validacoes de telefone e email devem ser consistentes entre backend e frontend.

## Prisma + MySQL
- Prisma e a unica camada de acesso ao banco no backend.
- Migracoes devem ser versionadas (Prisma Migrate).
- Crie seeds para base/feature/error quando necessario.
- Views/materialized views/funcoes de banco devem ser versionadas e documentadas.
- Se houver alteracao no banco (`schema.prisma` ou migration), rode `npx prisma generate` em `apps/api` antes de continuar.

## Frontend (Vite + React)
- Frontend consome APIs; sem queries diretas ao banco.
- Mensagens da API devem ser normalizadas no cliente (ex.: mapeamento PT-BR).
- Modais de login/cadastro devem limpar estado de erro/sucesso ao abrir/fechar.

## Pagamentos (Stripe)
- Nunca armazene numeros de cartao.
- Use tokenizacao do Stripe.
- Registre tentativas de pagamento.
- Trate falhas graciosamente.
- Use chaves de idempotencia.

## Gerenciamento de Estado
- Use React Context para tema/usuario quando aplicavel.
- Evite estado global desnecessario.
- Estado de servidor permanece no servidor.
- Estado de cliente deve ser minimo.

## Legado PHP/CMS
- Scripts PHP ficam restritos ao fluxo de CMS/geracao de conteudo (`cms/`).
- Evite logica de negocio em PHP; mantenha no backend Express.

## Filosofia de Engenharia
- Legibilidade acima de inteligencia.
- Explicito acima de implicito.
- Simples acima de complexo.
- Prefira remover codigo obsoleto em vez de comenta-lo.

## Testes (padrao tecnico)
- Escreva testes para logica de negocio.
- Cubra casos extremos e estados de erro.
- Use nomes de teste descritivos.
- Prefira testes de integracao quando entregarem mais confianca pratica.
