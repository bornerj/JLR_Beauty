# PLAN-0009 — Cópia e Estrutura Base para JLR_Beauty

Status: EXECUTING
Data de abertura: 2026-06-10
Contexto: Cópia do projeto atual (JLR_AI_Studio) para a nova pasta de desenvolvimento
`/media/jeiel/A8FEADE5FEADABCE2/Development/GitHub/JLR_Beauty`, preservando 100% do
funcionamento atual. Nenhuma alteração de código neste plano — só estrutura e repositório.
A versão em `Development/www/JLR_AI_Studio` continua intacta e operacional no Railway
durante toda a execução deste plano e dos planos seguintes.

## STAR

**Situation**
O projeto atual em `Development/www/JLR_AI_Studio` está funcional no Railway/Vercel.
Precisamos de uma cópia independente em `Development/GitHub/JLR_Beauty` como base para
os PLAN-0010 e PLAN-0011, sem afetar o ambiente de produção atual.

**Task**
Copiar todos os artefatos relevantes do projeto, excluir lixo de desenvolvimento
(node_modules, dist, tmp-*, logs), inicializar um repositório Git limpo na nova pasta
e verificar que ambos os apps (api e web) compilam sem erros.

**Action**
1. Copiar com rsync excluindo pastas efêmeras
2. Remover arquivos temporários residuais (tmp-*.cjs, tmp-*.log)
3. Inicializar git e criar commit inicial
4. Instalar dependências em apps/api e apps/web
5. Verificar build de ambos os apps

**Result**
`Development/GitHub/JLR_Beauty` com estrutura completa, git inicializado, builds passando.
Projeto original inalterado.

---

## Escopo

**In:**
- Cópia de todo o monorepo (apps/api, apps/web, kernel/, memory/, docs/, cms/)
- Limpeza de arquivos temporários de debug (tmp-*.cjs, tmp-*.log, tmp-*.cjs)
- Inicialização de repositório Git
- Verificação de build (npm install + npm run build em ambos os apps)
- Atualização do .gitignore para o novo contexto

**Out:**
- Qualquer alteração de código
- Configuração Docker (PLAN-0010)
- Refactor de rotas (PLAN-0011)
- Migração de banco de dados
- Alteração de variáveis de ambiente

---

## Action Items

- [ ] 1. Verificar espaço em disco disponível para a cópia
- [ ] 2. Executar rsync da pasta fonte para destino (excluindo node_modules, dist, .git, uploads/*, tmp-*)
- [ ] 3. Remover arquivos temporários residuais em apps/api (tmp-*.cjs, tmp-*.log)
- [ ] 4. Verificar que uploads/ existe como pasta vazia (estrutura preservada, arquivos não copiados — serão gerenciados pelo Docker Volume no PLAN-0010)
- [ ] 5. Revisar e atualizar `.gitignore` na raiz do novo projeto
- [ ] 6. Inicializar repositório Git em `JLR_Beauty/`
- [ ] 7. Criar commit inicial: `chore: initial project copy from JLR_AI_Studio`
- [ ] 8. Executar `npm install` em `apps/api` — verificar saída sem erros críticos
- [ ] 9. Executar `npm install` em `apps/web` — verificar saída sem erros críticos
- [ ] 10. Executar `npm run build` em `apps/api` — deve passar sem erros TypeScript
- [ ] 11. Executar `npm run build` em `apps/web` — deve passar sem erros TypeScript/lint
- [ ] 12. Registrar resultado na `memory/MODIFICATION_LOG.md` do projeto original

---

## Validation

- [ ] `diff -rq --exclude=node_modules --exclude=.git --exclude=dist --exclude=uploads` entre fonte e destino retorna diferença apenas nos arquivos excluídos intencionalmente
- [ ] `git status` no destino mostra repositório limpo após commit inicial
- [ ] `npm run build` em apps/api: exit 0
- [ ] `npm run build` em apps/web: exit 0
- [ ] Pasta `uploads/` existe e está vazia no destino
- [ ] Nenhum arquivo tmp-* presente no destino

---

## Continuidade

- Último passo concluído: aguardando aprovação do usuário
- Próximo passo planejado: item 1 (verificar espaço em disco)

---

## Registro Git da Entrega

*(a preencher após execução)*

- Passo 1 (Revisão pré-commit): —
- Passo 2 (Autorização de commit): —
- Passo 3 (Confirmação do commit): —
- Passo 4 (Autorização e resultado do push): —
- Status do push: PENDENTE
