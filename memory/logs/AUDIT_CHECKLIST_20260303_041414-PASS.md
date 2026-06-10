# AUDIT_CHECKLIST.md
Objetivo: atuar como agente auditor antes de commit final, push ou encerramento de sessão.

Nenhuma sessão pode ser encerrada com FAIL.

## 1. Integridade de Decisão (Decision Drift)

[x] Todas as DECISION-* ativas continuam válidas?
[x] Alguma alteração feita hoje contradiz decisão ACTIVE?
[x] Mudanças estruturais (auth, schema, contrato de API, arquitetura) foram registradas como nova DECISION ou atualização?

Observação: sem conflito de decisão identificado nesta sessão.

---

## 2. Integridade de Estado (Architectural Drift)

[x] tem algum PLAN-XXXX que não está DONE ?
[x] Houve mudança relevante de fluxo ou arquitetura não refletida no estado oficial?
[x] Escopo do plano foi respeitado?

Observação: existem planos em andamento (`PLAN-0007` e `PLAN-0008`); mudanças desta sessão permaneceram no escopo do `PLAN-0007` e o checkpoint foi atualizado.

---

## 3. Memória Operacional

[x] Toda alteração foi registrada no MODIFICATION_LOG?
[x] Plano (PLAN-XXXX) foi atualizado com progresso real?
[x] Plano foi encerrado corretamente se concluído?

Observação: `PLAN-0007` atualizado; não foi encerrado nesta sessão (etapa de Git pendente).

---

## 4. Memória de Debug

[x] Algum bug foi corrigido nesta sessão?
[x] Se sim, existe entrada correspondente em `memory/logs/DEBUG-HISTORY.md`?
[x] O template foi seguido com:
    - ID
    - SINTOMA
    - CAUSA_RAIZ
    - ACAO
    - CONTEXTO

Observação: registrado `ERR-0025`.

---

## 5. Validação Técnica

[x] Lint executado?
[x] Build executado?
[x] Testes executados?
[x] Migração Prisma aplicada e validada se houve alteração de schema?
[x] Logs limpos sem console.log indevido?

Observação: `apps/web npm run lint` e `apps/web npm run build` executados com sucesso; validação funcional manual concluída pelo usuário; não houve alteração de schema Prisma nesta sessão.

---

## 6. Risco de Regressão

[x] Alguma área sensível foi alterada? (auth, pagamento, agendamento, integração externa)
[x] Existem testes cobrindo a mudança?
[x] Existe histórico similar no debug-history que pode reaparecer?

Observação: ajuste restrito ao módulo de galeria/admin (`admin-media-gallery`), com risco principal de UI mitigado por validação manual e controle explícito de salvamento.

---

## 7. Governança de Git

[x] Revisão de arquivos alterados feita?
[x] Mensagem de commit segue padrão?
[x] Registro Git da Entrega foi preenchido?
[x] Push autorizado explicitamente?

Observação: etapa de Git desta entrega permanece pendente por não haver solicitação de commit/push nesta sessão; `PLAN-0007` mantém seção `Registro Git da Entrega` em aberto para o fechamento formal.

---

## Resultado da Auditoria

Status: PASS

Sem violação bloqueante para encerramento de sessão.
