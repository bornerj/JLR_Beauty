---
name: ai-governance-audit
description: Auditoria de governança para sistemas com IA. Verifica rastreabilidade, isolamento por tenant, uso de contexto, revisão humana e conformidade operacional.
allowed-tools: Read, Write, Grep
risk: high
source: custom-core
---

# OBJETIVO

Garantir que o sistema com IA seja:

- auditável
- seguro
- rastreável
- controlado
- confiável

---

# GATILHO DE EXECUÇÃO

Executar apenas quando solicitado:

- "auditar governança de IA"
- "executar ai-governance-audit"

---

# ESCOPO

## Inclui

- pipeline de IA
- RAG
- geração de texto
- funções SQL
- edge functions

## Exclui

- UI estética
- código irrelevante para IA

---

# CAMADAS DE VALIDAÇÃO

## 1. Isolamento por tenant

Verificar:

- uso de organization_id
- políticas RLS
- ausência de vazamento entre tenants

---

## 2. Rastreabilidade

Verificar:

- origem do conteúdo
- documento fonte
- chunk utilizado
- contexto recuperado

---

## 3. Uso de IA

Verificar:

- geração baseada em contexto (RAG)
- ausência de geração "livre"
- presença de grounding

---

## 4. Auditoria

Verificar existência de:

- AuditLog
- histórico de ações
- logs de geração
- logs de ingestão

---

## 5. Revisão humana

Verificar:

- IA não publica automaticamente
- existência de etapa de revisão
- confirmação explícita

---

## 6. Risco jurídico

Detectar:

- respostas sem fonte
- linguagem de certeza absoluta
- ausência de disclaimer

---

# FLUXO OPERACIONAL

1. Ler sistema
2. Identificar fluxo de IA
3. Verificar isolamento
4. Verificar logs
5. Verificar RAG
6. Gerar relatório

---

# FORMATO DE SAÍDA

```md
# AI GOVERNANCE REPORT

## Falhas críticas
- ...

## Riscos médios
- ...

## Pontos corretos
- ...

## Recomendações
- ...

```

# REGRAS CRÍTICAS
Nunca alterar código automaticamente
Sempre gerar relatório
Sempre pedir confirmação antes de corrigir

# CRITÉRIO DE ENCERRAMENTO
Encerrar quando:
relatório gerado
riscos classificados
sistema avaliado