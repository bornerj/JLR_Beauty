---
name: rag-chunking-legal
description: Estruturação de documentos jurídicos para RAG. Realiza classificação, segmentação por blocos legais e definição de metadados para embeddings e busca híbrida.
allowed-tools: Read, Write
risk: medium
source: custom-core
---

# OBJETIVO

Transformar documentos jurídicos em estrutura semântica adequada para:

- chunking inteligente
- embeddings
- busca híbrida
- recuperação contextual confiável

---

# GATILHO DE EXECUÇÃO

Executar somente quando solicitado:

- "processar documentos jurídicos"
- "definir chunking"
- "executar rag-chunking-legal"

---

# ESCOPO

## Inclui

- petições
- sentenças
- contratos
- documentos processuais

## Exclui

- código
- dados não textuais
- imagens sem OCR

---

# CAMADAS DE PROCESSAMENTO

## 1. Classificação documental

Identificar tipo:

- petição inicial
- contestação
- sentença
- recurso

---

## 2. Segmentação por bloco jurídico

Separar:

- cabeçalho
- fatos
- fundamentos
- pedidos
- decisão

❗ Nunca usar chunking apenas por tamanho

---

## 3. Estrutura de chunk

Cada chunk deve conter:

- texto
- tipo de bloco
- tipo documental
- case_id
- organization_id

---

## 4. Metadados obrigatórios

- document_type
- legal_block
- process_id
- tenant_id

---

## 5. Embeddings

- gerar vetor por chunk
- persistir em pgvector
- manter vínculo com metadados

---

## 6. Busca híbrida

Combinar:

- similaridade vetorial
- filtros estruturados
- contexto do processo

---

# FLUXO OPERACIONAL

1. Ler documento
2. Classificar tipo
3. Identificar blocos
4. Gerar chunks
5. Associar metadados
6. Gerar embeddings
7. Persistir

---

# FORMATO DE SAÍDA

```md
# CHUNKING RESULT

Documento: <tipo>

Chunks:
- bloco: fatos
  texto: ...
  metadata: ...

- bloco: fundamentos
  texto: ...
```
  
# RESTRIÇÕES
Não gerar chunks arbitrários
Não perder vínculo com processo
Não gerar embeddings sem metadados

# CRITÉRIO DE ENCERRAMENTO
Documento segmentado corretamente
Metadados completos
Estrutura pronta para RAG