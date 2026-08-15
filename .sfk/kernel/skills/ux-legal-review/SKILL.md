---
name: ux-legal-review
description: "Auditoria linguística e de conformidade textual para sistemas e aplicações. Realiza revisão gramatical, padronização terminológica, coerência de marca, mitigação de risco jurídico e verificação básica de conformidade LGPD. Gera relatório versionado e aplica correções apenas sob aprovação explícita."
allowed-tools: Read, Glob, Grep, Write
risk: low
source: reusable-standard
---

# OBJETIVO

Auditar textos exibidos ao usuário final garantindo:

- Correção gramatical em Português do Brasil
- Padronização terminológica
- Coerência de tom institucional
- Redução de risco jurídico
- Adequação básica à LGPD
- Clareza comunicacional

# GATILHO DE EXECUÇÃO

A Skill deve ser acionada somente quando houver comando explícito como:

- "auditar textos do projeto"
- "executar governança linguística"
- "revisar textos de interface"
- "gerar relatório de revisão"

Não deve agir automaticamente.

# ESCOPO

## Inclui

- Labels
- Botões
- Títulos
- Mensagens de erro
- Mensagens de sucesso
- Placeholders
- Textos HTML
- Strings visíveis ao usuário
- Arquivos i18n
- JSON de tradução

Extensões analisadas:

- *.php
- *.py
- *.ts
- *.tsx
- *.js
- *.jsx
- *.java
- *.html
- *.vue
- *.json

## Exclui

- Comentários técnicos
- Logs
- Variáveis
- Identificadores
- Nomes de funções
- Código estrutural
- Interpolação dinâmica como `${variavel}`

Nunca alterar estruturas de código.

# CAMADAS DE VALIDAÇÃO

## 1. Correção Linguística

- Ortografia conforme ABL
- Acentuação
- Concordância verbal
- Concordância nominal
- Regência
- Crase
- Pontuação

## 2. Padronização Terminológica

Detectar uso inconsistente de termos equivalentes.

Exemplo:
Login vs Entrar
Salvar vs Gravar
Excluir vs Remover

Sugerir termo único.

## 3. Tom Institucional

Classificar texto como:

- Formal
- Neutro
- Informal
- Técnico
- Comercial

Detectar:

- Gírias
- Gerúndio excessivo
- Imperatividade agressiva
- Linguagem prolixa

## 4. Clareza e Ambiguidade

Detectar:

- Frases vagas
- Mensagens genéricas
- Duplo sentido
- Falta de instrução objetiva

## 5. Risco Jurídico

Sinalizar textos como:

- "Garantimos"
- "100% seguro"
- "Nunca falha"
- "Proteção total"

Classificar como RISCO_JURIDICO_ALTO

Sugerir reformulação prudente.

## 6. Conformidade LGPD Básica

Detectar:

- Coleta de dados sem referência à política
- Linguagem vaga sobre uso de dados
- Falta de menção a consentimento quando aplicável

## 7. Coerência de Marca

Se existir arquivo BRAND_GUIDELINES.md:

- Respeitar vocabulário aprovado
- Detectar termos proibidos
- Aplicar diretrizes institucionais

# FLUXO OPERACIONAL

## Fase 1 – Descoberta

1. Executar Glob para localizar arquivos elegíveis.
2. Executar Grep para extrair strings visíveis.

## Fase 2 – Extração Estruturada

Para cada ocorrência registrar:

- Arquivo
- Linha
- Tipo de elemento
- Texto original
- Camada afetada
- Classificação de risco

## Fase 3 – Geração de Relatório

Criar arquivo:

REVISAO_ENTERPRISE_XX.MD

### Regra de versionamento

Se existir REVISAO_ENTERPRISE_01.MD, criar REVISAO_ENTERPRISE_02.MD.
Incrementar automaticamente.

# FORMATO DO RELATÓRIO

Estrutura obrigatória:

# RELATÓRIO DE GOVERNANÇA LINGUÍSTICA

Projeto: <nome>
Data: YYYY-MM-DD
Arquivos analisados: <número>

---

## 1. Erros Gramaticais

Arquivo:
Linha:
Texto original:
Problema:
Sugestão:

---

## 2. Terminologia Inconsistente

---

## 3. Riscos Jurídicos

---

## 4. Pontos LGPD

---

# REGRA CRÍTICA

Nunca modificar código automaticamente.

Após gerar relatório, perguntar:

"Deseja aplicar as correções sugeridas?"

Somente após confirmação explícita:

- Substituir textos aprovados
- Gerar arquivo ALTERACOES_APLICADAS_ENTERPRISE_XX.MD

# CICLO OBRIGATÓRIO

Validar
Sugerir
Aguardar aprovação
Aplicar
Revalidar

# RESTRIÇÕES

- Nunca alterar interpolação dinâmica
- Nunca alterar variáveis
- Nunca traduzir marcas registradas
- Nunca modificar estrutura de código
- Nunca executar sem comando explícito

# CRITÉRIO DE ENCERRAMENTO

A Skill encerra quando:

- O relatório foi gerado
- Ou nenhuma inconsistência foi encontrada
- Ou as alterações aprovadas foram aplicadas e revalidadas