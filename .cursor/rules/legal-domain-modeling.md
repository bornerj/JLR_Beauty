---
name: legal-domain-modeling
description: Modelagem de domínio jurídico orientada a sistemas. Converte requisitos legais e funcionais em entidades, relações, casos de uso e limites de contexto para arquitetura de software.
allowed-tools: Read, Write, Edit
risk: medium
source: custom-core
---

# OBJETIVO

Transformar requisitos jurídicos e funcionais em:

- Entidades estruturadas
- Relacionamentos
- Casos de uso
- Regras de negócio (invariantes)
- Contextos delimitados (bounded contexts)
- Separação entre Fase 1 (MVP) e Fase 2 (expansão)

---

# GATILHO DE EXECUÇÃO

Executar somente quando solicitado explicitamente:

- "modelar domínio jurídico"
- "extrair entidades do sistema"
- "definir domínio do projeto"
- "executar legal-domain-modeling"

---

# ESCOPO

## Inclui

- Requisitos funcionais
- Documentos jurídicos
- Descrição de sistema
- Fluxos operacionais
- Entidades e relações

## Exclui

- Implementação técnica
- Código
- Queries SQL
- UI/UX

---

# CAMADAS DE MODELAGEM

## 1. Entidades

Extrair entidades principais:

Exemplo:
- Processo
- Documento
- Parte
- EventoProcessual
- Prazo
- Estilo
- Análise

---

## 2. Relacionamentos

Mapear:

- Processo → possui → Documentos
- Documento → pertence → Processo
- Processo → possui → Partes
- Processo → possui → Eventos

---

## 3. Casos de Uso

Identificar operações reais:

- cadastrar processo
- anexar documento
- classificar documento
- gerar minuta
- consultar histórico
- aplicar estilo

---

## 4. Invariantes (regras críticas)

Definir regras que NÃO podem ser violadas:

- Documento deve pertencer a um processo
- Processo deve pertencer a uma organização
- Toda consulta deve respeitar organization_id
- Documento deve ter status válido

---

## 5. Bounded Contexts

Separar o sistema em blocos:

- Core Jurídico
- Gestão Documental
- Memória Jurídica (RAG)
- Estilo e Redação
- Auditoria

---

## 6. Classificação de Fase

Separar claramente:

### Fase 1 (MVP)
- cadastro
- processos
- documentos
- chunking
- busca
- editor assistido

### Fase 2
- preditivo
- judge profile
- automações
- digital twin avançado

---

# FLUXO OPERACIONAL

1. Ler requisitos
2. Extrair entidades
3. Mapear relações
4. Definir casos de uso
5. Definir invariantes
6. Separar contextos
7. Classificar por fase

---

# FORMATO DE SAÍDA

```md
# DOMAIN MODEL

## Entidades
- Processo
- Documento
- ...

## Relacionamentos
- Processo → Documentos
...

## Casos de Uso
- criar processo
...

## Invariantes
- ...

## Contextos
- ...

## Fase 1
- ...

## Fase 2
- ...

```

# RESTRIÇÕES
Não gerar código
Não assumir dados inexistentes
Não misturar domínio com infraestrutura

# CRITÉRIO DE ENCERRAMENTO
Encerrar quando:
Entidades claras
Contextos definidos
Fase 1 e 2 separadas