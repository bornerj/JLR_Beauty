# JLR Beauty — Introdução Operacional do Retrofit Admin V2

## 1. Contexto

O JLR Beauty já possui um SaaS funcional e em evolução, com frontend, backend, banco de dados, autenticação, segurança, agenda, produtos, serviços, pedidos, vendas, assinaturas, franquias, estoque, pagamentos, integrações, BI e áreas administrativas já implementadas.

O objetivo deste trabalho **não é reconstruir o sistema do zero**.

O objetivo é realizar um **retrofit do painel administrativo**, criando uma nova experiência de gestão mais clara, visual, operacional e orientada à decisão, preservando e reutilizando ao máximo a infraestrutura, regras de negócio, APIs, banco de dados, segurança e funcionalidades já existentes.

O Admin atual cresceu de forma incremental e hoje possui muitas funções, menus e áreas independentes.

Embora funcional, sua arquitetura de informação passou a refletir mais a estrutura interna do software do que a forma como um gestor pensa e administra o negócio.

O novo Admin deve corrigir isso.


---

# 2. Por que este retrofit será feito

O problema principal não é falta de dados.

O sistema já possui dados, métricas e funcionalidades suficientes para apoiar grande parte da gestão.

O problema é transformar esses dados em **entendimento rápido, diagnóstico e ação**.

Um gestor não deveria precisar:

* escolher entre dezenas de menus;
* abrir vários relatórios;
* interpretar diversos gráficos;
* cruzar números manualmente;
* descobrir sozinho onde existe um problema;
* procurar qual unidade está performando pior;
* calcular mentalmente qual produto vende muito mas gera pouca margem;
* identificar manualmente onde pedidos estão parados;
* analisar agendas individualmente para descobrir capacidade ociosa;
* comparar franquias uma por uma;
* procurar clientes que estão deixando de retornar.

O novo Admin deve inverter essa lógica.

Ao entrar no sistema, o usuário deve primeiro enxergar:

> **O que está acontecendo no negócio?**

Depois deve poder aprofundar progressivamente:

> **Onde está acontecendo?**

> **Por que está acontecendo?**

> **Qual produto, unidade, serviço, cliente, profissional ou etapa está causando isso?**

> **Qual é o impacto financeiro?**

> **O que pode ser feito agora?**

---

# 3. Objetivo principal

Criar um novo Admin, separado do Admin atual, com uma experiência orientada a:

* panorama;
* operação;
* exceções;
* gargalos;
* tendências;
* rentabilidade;
* capacidade;
* recorrência;
* oportunidades;
* diagnóstico;
* ação.

O Admin V2 deve funcionar como uma camada de **inteligência operacional sobre o SaaS existente**.

Ele não deve ser apenas um dashboard visualmente mais moderno.

Deve ser um **sistema visual de gestão do negócio**.

JLR BEAUTY ADMIN V2

PRINCÍPIO
O Admin V2 é uma camada de gestão operacional e analítica sobre os domínios existentes.

NÃO É
- reescrita do backend existente;
- substituição imediata do Admin legado;
- novo ERP;
- novo Data Warehouse;
- dashboard de gráficos.

É
- shell administrativo novo;
- navegação drill-down/roll-up;
- visão consolidada;
- classificação operacional;
- analytics explicável;
- ação contextual.

ROTAS
/admin       -> legado
/admin-v2    -> novo

Durante a implantação, os dois convivem.

Isso é importante porque vários planos anteriores mexeram no Admin atual e já foram validados. O PLAN-0008, por exemplo, implementou toda a operação de pedidos sem reescrever o Admin.

O PLAN-0020 também adicionou UI de produto, estoque, venda manual e BI sobre a estrutura existente.

Não existe motivo para colocar tudo isso em risco durante a mudança conceitual.

A regra seria:

ADMIN LEGADO
= manutenção + fallback + operações já existentes

ADMIN 2
= nova experiência de gestão

Quando o Admin 2 estiver maduro, podemos aposentar gradualmente partes do antigo.



MENU PRINCIPAL
- Panorama
- Operação
- Rede
- Clientes
- Crescimento
- Cadastros
- Sistema

REGRAS
1. toda visão resumida deve permitir drill-down;
2. toda visão detalhada deve permitir roll-up;
3. contexto de período/unidade deve persistir;
4. cálculos financeiros somente no backend;
5. scoping de unidade somente no backend;
6. estados operacionais não substituem estados transacionais;
7. módulos existentes devem ser reutilizados por adapter quando possível;
8. nenhuma migration destrutiva;
9. Admin legado deve continuar funcional durante a transição;
10. novos analytics devem ser explicáveis e testáveis.

---

# 4. Princípio central da experiência

A navegação deve seguir o conceito:

> **Resumo → Detalhamento → Causa → Ação**

A experiência será inspirada nos conceitos de Data Warehouse / OLAP:

* **Drill Down:** aprofundar a informação;
* **Roll Up:** retornar para uma visão mais agregada.

Na interface isso deve acontecer naturalmente.

Exemplo:

```text
Panorama
    ↓
Rede
    ↓
Unidade Campinas
    ↓
Agenda
    ↓
Quarta-feira
    ↓
13h–16h
    ↓
Profissionais ociosos
    ↓
Clientes potenciais
```

O caminho inverso deve estar sempre disponível:

```text
Clientes potenciais
    ↑
13h–16h
    ↑
Agenda
    ↑
Campinas
    ↑
Rede
    ↑
Panorama
```

O contexto selecionado, como período, unidade, canal ou comparação, deve permanecer durante a navegação.

---

# 5. Filosofia visual

Evitar que o novo Admin seja construído como um dashboard tradicional baseado principalmente em:

* cards de KPIs;
* gráficos de linha;
* gráficos de barras;
* gráficos de pizza;
* tabelas extensas.

Esses elementos podem existir como apoio, mas não devem ser o conceito principal da experiência.

Priorizar:

* Kanbans;
* mapas de estado;
* heatmaps;
* fluxos;
* rankings contextuais;
* matrizes;
* timelines;
* exceções;
* cards inteligentes;
* sinais operacionais;
* comparações;
* diagnósticos;
* oportunidades;
* ações contextuais.

Cada tela deve responder a uma pergunta concreta de negócio.

Admin V2 — conceito geral

O novo Admin será composto por ambientes visuais, não por páginas convencionais de relatório.

Os principais conceitos que devem entrar formalmente nos planos são:

1. PANORAMA VIVO
2. MAPA DA REDE
3. BOARD OPERACIONAL DE PEDIDOS
4. MAPA DE CAPACIDADE DA AGENDA
5. PORTFÓLIO VIVO DE PRODUTOS
6. PERFORMANCE DE SERVIÇOS
7. CLIENTES / RECORRÊNCIA / RISCO
8. ASSINATURAS / RETENÇÃO
9. PIPELINE DE FRANQUIAS
10. RADAR DE OPORTUNIDADES
11. DIAGNÓSTICO DA UNIDADE
12. INSIGHT ENGINE / AÇÕES RECOMENDADAS

---

# 6. Panorama Vivo

## Pergunta respondida

> **O que está acontecendo no negócio agora?**

O Panorama será a tela inicial do Admin V2.

Deve resumir:

* saúde da rede;
* operação;
* receita;
* margem;
* agenda;
* clientes;
* assinaturas;
* estoque;
* pedidos;
* alertas;
* tendências;
* oportunidades.

Exemplo conceitual:

```text
JLR BEAUTY                         Hoje · Rede inteira

PANORAMA

REDE
18 unidades
12 saudáveis · 4 atenção · 2 críticas

Receita      ↑ 8,4%
Margem       ↓ 1,3 p.p.
Ocupação     ↑ 4,1%

OPERAÇÃO AGORA
7 pedidos precisam de atenção
3 rupturas de estoque
14 horários com baixa ocupação

CLIENTES
318 novos
147 em risco
824 assinantes

O QUE MERECE SUA ATENÇÃO
🔴 Campinas caiu 18%
🟡 Margem do Produto X caiu para 8%
🟡 37 pedidos estão acima do SLA
🟢 Jardins tende a superar a meta em 11%

OPORTUNIDADE
428 clientes recorrentes estão fora do ciclo esperado
Potencial estimado: R$ 38.400

[Ver clientes] [Criar campanha]
```

Nenhum elemento importante deve existir apenas para informar.

Tudo deve permitir **drill-down**.

O Panorama é o início da exploração, não o destino final.

---

# 7. Mapa Vivo da Rede

## Pergunta respondida

> **Quais unidades estão bem e quais precisam de atenção?**

As unidades devem ser classificadas automaticamente em estados como:

* Decolando;
* Saudável;
* Atenção;
* Crítico.

Exemplo:

```text
REDE

DECOLANDO       SAUDÁVEL        ATENÇÃO         CRÍTICO

Jardins         Moema           Pinheiros       Campinas
+27%            +8%             -6%             -18%
Margem 38%      Margem 32%      Margem 21%      Margem 12%

↑ Premium       → Estável       ↓ Produtos      ⚠ Agenda
```

Os cartões devem mudar de posição automaticamente conforme os dados do negócio.

O usuário não deve arrastar unidades entre colunas.

Cada unidade deve resumir:

* faturamento;
* tendência;
* margem;
* ocupação;
* recorrência;
* Health Score;
* principal força;
* principal problema.

---

# 8. Diagnóstico Vivo da Unidade

## Pergunta respondida

> **Por que esta unidade está bem ou mal?**

Exemplo:

```text
CAMPINAS CENTRO                         🟡 ATENÇÃO

Health Score
61 / 100

Rentabilidade
██████░░░░ 61

Ocupação
████░░░░░░ 43

Recorrência
████████░░ 82

Estoque
█████████░ 91

Assinaturas
███████░░░ 75

PRINCIPAL PROBLEMA

Agenda ociosa de terça a quinta

Impacto estimado:
R$ 28.400 / mês

PRINCIPAL FORÇA

Produtos premium
+18% margem

[Ver agenda]
[Ver clientes]
[Ver produtos]
[Comparar unidade]
```

A tela da unidade deve funcionar como um hub para novos drill-downs.

---

# 9. Board Operacional de Pedidos

## Pergunta respondida

> **Onde os pedidos estão travando?**

Utilizar Kanban operacional para visualizar:

* novos;
* pagos;
* em preparação;
* prontos;
* enviados;
* entregues;
* atenção;
* travados;
* atrasados.

Exemplo:

```text
PEDIDOS · HOJE

ENTRARAM       PREPARAÇÃO       ⚠ ATENÇÃO       PRONTOS

12             18               7               11
R$ 3.280       R$ 5.420         R$ 2.190        R$ 3.850

#4831          #4812            #4790
R$ 380         R$ 720           R$ 1.240
há 7 min       há 38 min        há 2d 4h

                                ⚠ ESTOQUE
                                Produto indisponível
```

Estados operacionais como:

* `ATTENTION`;
* `STALLED`;
* `OVERDUE`;
* `BLOCKED`;

devem ser derivados e não substituir os estados transacionais existentes.

Também deve existir uma visão de fluxo:

```text
Novo
  ↓ 4 min

Pago
  ↓ 3 min

Separação
  ↓ 18 min

Expedição
  ↓ 4h12 ⚠

Entregue
```

O objetivo é revelar gargalos, não apenas contar pedidos.

---

# 10. Mapa de Capacidade da Agenda

## Pergunta respondida

> **Onde estamos perdendo capacidade e receita?**

Utilizar heatmap para mostrar ocupação por dia e horário.

Exemplo:

```text
CAPACIDADE · CAMPINAS

         SEG   TER   QUA   QUI   SEX   SÁB

09h      90%   70%   60%   80%   100% 100%
10h      90%   50%   40%   70%   100% 100%
11h      80%   40%   30%   50%   100% 100%
12h      50%   20%   20%   30%    90% 100%
13h      40%   20%   10%   30%    90% 100%
14h      50%   30%   20%   40%   100% 100%
15h      60%   40%   30%   40%   100% 100%
```

Deve considerar:

* ocupação;
* capacidade disponível;
* capacidade vendida;
* profissionais disponíveis;
* capacidade ociosa;
* receita por hora disponível;
* receita por hora ocupada;
* no-show;
* cancelamentos.

O drill-down deve permitir chegar a um horário específico e relacionar capacidade ociosa com oportunidades comerciais.

---

# 11. Portfólio Vivo de Produtos

## Pergunta respondida

> **O que vende e o que realmente dá dinheiro?**

Utilizar uma matriz de performance:

```text
                     MARGEM ALTA
                          ↑

        JOIAS             │          ESTRELAS
                          │
     Serum Premium        │       Kit Repair
     margem 48%           │       margem 37%
     baixa saída          │       alta saída
                          │
──────────────────────────┼────────────────────────→ VOLUME
                          │
        FRACOS            │       ARMADILHAS
                          │
     Shampoo Z            │       Shampoo X
     margem 9%            │       margem 8%
     baixa saída          │       alta saída
                          │
                     MARGEM BAIXA
```

Considerar:

* volume;
* receita;
* margem;
* CMV;
* estoque;
* capital imobilizado;
* unidade;
* tendência.

Um produto de alta venda e baixa margem deve ser identificado como possível armadilha.

---

# 12. Performance de Serviços

## Pergunta respondida

> **Quais serviços utilizam melhor a capacidade do salão?**

Serviços devem ser analisados também pelo uso do tempo.

Considerar:

* receita;
* margem;
* duração;
* receita por hora;
* margem por hora;
* demanda;
* ocupação;
* no-show;
* recorrência.

Exemplo de insight:

```text
⚠ Serviço X vende bastante,
mas ocupa 18% da capacidade da agenda
e representa apenas 8% da margem.

[Analisar preço]
```

---

# 13. Clientes, Recorrência e Risco

## Pergunta respondida

> **Quem está entrando, permanecendo ou deixando de voltar?**

Os clientes devem ser classificados automaticamente em:

```text
NOVOS
  ↓
ATIVOS
  ↓
RECORRENTES
  ↓
EM RISCO
  ↓
INATIVOS
```

O sistema deve explicar os sinais que produziram cada classificação.

Exemplo:

```text
CLIENTES EM RISCO

37 atrasaram o ciclo habitual
28 cancelaram as últimas agendas
22 possuem assinatura inadimplente
19 reduziram frequência
```

---

# 14. Saúde das Assinaturas

## Pergunta respondida

> **A base de assinaturas está crescendo ou deteriorando?**

Exemplo:

```text
ASSINATURAS

ENTRANDO       SAUDÁVEIS       ATENÇÃO       SAINDO

+42            691             73            18

                84% base                     churn 2,1%
```

Considerar:

* novas assinaturas;
* renovações;
* base saudável;
* inadimplência;
* cancelamentos;
* churn;
* MRR;
* redução de uso.

---

# 15. Pipeline de Franquias

## Pergunta respondida

> **Onde estão as oportunidades comerciais de franquia?**

Utilizar Kanban comercial:

```text
INTERESSADOS
    ↓
QUALIFICADOS
    ↓
REUNIÃO
    ↓
PROPOSTA
    ↓
NEGOCIAÇÃO
    ↓
CONTRATO
    ↓
IMPLANTAÇÃO
```

Além da quantidade, mostrar:

* valor potencial;
* tempo médio por etapa;
* conversão;
* oportunidades paradas;
* velocidade do pipeline;
* gargalos comerciais.

---

# 16. Radar Executivo

## Pergunta respondida

> **O que mudou e merece minha atenção?**

O Radar deve produzir um briefing executivo estruturado.

Exemplo:

```text
RADAR
terça-feira, 11 de agosto

3 COISAS MELHORARAM

↑ Jardins cresceu 14% em serviços premium
↑ Ticket médio subiu de R$ 184 para R$ 197
↑ Renovação de assinaturas chegou a 91%

2 PONTOS EXIGEM ATENÇÃO

⚠ Margem de produtos caiu 3,2 p.p.
⚠ Campinas está abaixo de 55% de ocupação

1 OPORTUNIDADE

💡 428 clientes recorrentes estão fora
do ciclo esperado de retorno.

Potencial estimado:
R$ 38.400

[Ver clientes]
[Criar campanha]
```

O Radar não deve funcionar como uma caixa-preta ou simples chatbot.

Os sinais apresentados devem ser estruturados, verificáveis e derivados dos dados reais.

---

# 17. Gargalos

## Pergunta respondida

> **O que está impedindo o negócio de performar melhor?**

Exemplo:

```text
GARGALOS DA REDE

1. EXPEDIÇÃO
██████████████████
37 pedidos
R$ 21.400 impactados

2. AGENDA TER–QUI 13H–16H
████████████
164 horas ociosas

3. PRODUTO X
████████
margem caiu 11 p.p.

4. ASSINATURAS
██████
28 cobranças falharam

5. CAMPINAS
████
ocupação -18%
```

Sempre mostrar:

* impacto;
* abrangência;
* origem;
* prioridade;
* possibilidade de drill-down.

---

# 18. Onde Está o Dinheiro?

## Pergunta respondida

> **Quem gera receita e quem gera lucro?**

Permitir decomposição financeira por:

* unidade;
* produto;
* serviço;
* canal;
* vendedor;
* profissional;
* assinatura.

Distinguir claramente:

* faturamento;
* custos;
* CMV;
* margem;
* descontos;
* taxas;
* contribuição.

Exemplo:

```text
ONDE ESTÁ O DINHEIRO?

Receita
R$ 428.300

↓ CMV

R$ 126.400

↓ custos / descontos / taxas

Margem de contribuição
R$ 224.100
```

---

# 19. Comparador de Unidades

## Pergunta respondida

> **Por que uma unidade performa melhor que outra?**

Exemplo:

```text
COMPARAR

             CAMPINAS     JARDINS      REDE

Receita        -18%         +14%        +8%
Margem          12%          38%        31%
Ocupação        51%          89%        76%
Ticket         R$174        R$221      R$198
Recorrência     62%          81%        74%
```

O sistema deve destacar automaticamente as maiores diferenças e seus possíveis impactos.

---

# 20. Cadastros

Cadastros são necessários, porém não fazem parte da rotina analítica diária.

Devem existir em uma área secundária.

Exemplo:

```text
CADASTROS

Negócio
├── Produtos
├── Serviços
├── Planos
├── Cupons
└── Entrega

Pessoas
├── Clientes
├── Profissionais
├── Usuários
└── Perfis

Rede
├── Unidades
└── Parâmetros
```

As telas atuais devem ser reutilizadas inicialmente sempre que possível.

Não reescrever CRUDs apenas por estética.

---

# 21. Sistema

Funcionalidades técnicas devem permanecer separadas da gestão diária.

Exemplo:

```text
SISTEMA

Site
├── Branding
├── Textos
├── Seções
└── Galeria

Integrações
├── Stripe
├── WhatsApp
└── Webhooks

Segurança
├── Usuários
├── Auditoria
└── Sessões

Infraestrutura
├── Status
└── Diagnósticos

Desenvolvimento
└── Testes
```

---

# 22. Estratégia de implementação

O Admin V2 deve nascer separado do Admin atual.

Inicialmente:

```text
/admin
→ Admin atual

/admin-v2
→ novo Admin
```

O Admin atual deve continuar funcionando durante o retrofit.

Nenhuma funcionalidade existente deve ser removida até sua substituição ter sido implementada, testada e validada.

---

# 23. Regra de reutilização

Antes de criar qualquer funcionalidade nova, a IA deve verificar:

1. se já existe no backend;
2. se já existe no banco;
3. se já existe endpoint;
4. se já existe componente;
5. se já existe regra de negócio;
6. se já existe teste.

Toda necessidade deve ser classificada como:

* `PRESERVAR`;
* `REUTILIZAR`;
* `ADAPTAR`;
* `CRIAR`;
* `DESCONTINUAR`.

Evitar qualquer duplicação desnecessária de domínio.

---

# 24. Arquitetura

O Admin V2 deve ser uma camada sobre os domínios existentes.

Não criar um novo backend independente.

Criar somente as novas camadas necessárias para:

* agregações;
* scores;
* classificadores;
* tendências;
* detecção de gargalos;
* oportunidades;
* diagnósticos;
* insights.

As regras de negócio devem permanecer no backend.

O frontend não deve calcular:

* lucro;
* margem;
* Health Score;
* estados operacionais;
* risco;
* tendências financeiras;
* escopo de unidade.

---

# 25. Segurança

Toda segurança existente deve ser preservada.

Não enfraquecer:

* autenticação;
* RBAC;
* escopo por unidade;
* Row-Level Security;
* auditoria;
* proteção Stripe;
* rate limiting;
* validações;
* logging;
* idempotência.

Nenhuma tela consolidada pode revelar dados de unidades às quais o usuário não possui acesso.

---

# 26. Regra de explicabilidade

Scores, classificações, tendências e alertas não podem funcionar como caixas-pretas.

Não retornar apenas:

```text
Health Score = 61
```

Também explicar sua composição:

```text
Rentabilidade   64
Crescimento     52
Ocupação        43
Recorrência     82
Estoque         91
Assinaturas     75
```

O sistema deve apontar quais componentes mais influenciaram o resultado.

---

# 27. Regra de ação

Sempre que possível, um insight deve terminar em uma ação contextual.

Exemplos:

* Ver clientes;
* Ver pedidos;
* Comparar unidades;
* Abrir agenda;
* Revisar estoque;
* Criar campanha;
* Ajustar preço;
* Ver produto;
* Ver assinaturas;
* Falar com franqueado.

> **Insight sem caminho para ação deve ser considerado incompleto.**

---

# 28. Regra obrigatória para novas telas

Toda tela nova deve cumprir pelo menos uma destas funções:

* classificar;
* comparar;
* apontar exceção;
* mostrar fluxo;
* revelar gargalo;
* explicar causa;
* mostrar tendência;
* indicar oportunidade;
* permitir drill-down;
* permitir roll-up;
* oferecer ação contextual.

Se uma proposta de tela resultar apenas em KPIs, gráficos e tabelas, ela deve ser reconsiderada.

---

# 29. Estrutura macro do retrofit

## Fundação

```text
RETROFIT-000 — Baseline e contrato de compatibilidade
RETROFIT-001 — Admin V2 Shell
RETROFIT-002 — Drill Down / Roll Up / Scope
```

## Experiência operacional

```text
RETROFIT-003 — Diagnóstico Vivo da Unidade
RETROFIT-004 — Board Operacional de Pedidos
RETROFIT-005 — Mapa de Capacidade da Agenda
RETROFIT-006 — Portfólio Vivo de Produtos
RETROFIT-007 — Performance de Serviços
RETROFIT-008 — Clientes como Fluxo de Relacionamento
RETROFIT-009 — Assinaturas como “Saúde da Base”
RETROFIT-010 — Pipeline de Franquias

```

## Inteligência

```text
RETROFIT-011 — Radar Executivo
RETROFIT-012 — Tela “O que está travando?”
RETROFIT-013 — Tela “Onde está o dinheiro?”
RETROFIT-014 — Comparador Visual de Unidades
RETROFIT-017 — Health Score
RETROFIT-018 — Insight Engine
RETROFIT-019 — Ações Recomendadas
```

## Consolidação

```text
RETROFIT-020 — Cadastros
RETROFIT-021 — Sistema
RETROFIT-022 — Migração / aposentadoria gradual do Admin legado
```

---

# 30. Princípio final

O usuário não deve sentir que está navegando por módulos de software.

Deve sentir que está navegando pelo próprio negócio.

A experiência final deve seguir:

> **Observar → Entender → Aprofundar → Diagnosticar → Agir**

O objetivo final do Admin V2 é transformar os dados existentes do JLR Beauty em uma representação visual, simples, explicável e acionável do estado real do negócio.

Uma regra que eu colocaria no início de todos esses requisitos

Não construir uma tela nova se ela apenas reproduzir um dashboard tradicional com cards, KPIs e gráficos.

Cada tela do Admin V2 precisa cumprir pelo menos uma destas funções:

classificar;
comparar;
apontar exceção;
mostrar fluxo;
revelar gargalo;
explicar causa;
indicar oportunidade;
permitir drill-down;
recomendar ação.

Gráfico pode existir, mas como apoio, não como conceito principal.

E eu manteria outra regra:

Cada tela precisa terminar em uma pergunta respondida.

Exemplos:

Panorama
→ O que está acontecendo?

Mapa da Rede
→ Onde está acontecendo?

Diagnóstico
→ Por que está acontecendo?

Pedidos
→ Onde o fluxo travou?

Agenda
→ Onde existe capacidade perdida?

Produtos
→ O que vende e o que realmente dá dinheiro?

Clientes
→ Quem está entrando, ficando ou indo embora?

Radar
→ O que mudou?

Gargalos
→ O que está impedindo resultado?

Oportunidades
→ Onde posso ganhar mais?

Ação
→ O que faço agora?

Esse passa a ser o núcleo funcional do retrofit, e não apenas uma ideia de design. O Admin V2 deve nascer em torno dessas telas, enquanto os cadastros e funcionalidades antigas ficam como infraestrutura de apoio.
