RETROFIT-002 — Contexto e navegação OLAP - Mapa Vivo da Rede 

Implementar:

drillDown()
rollUp()
breadcrumb
global scope
period
unit
comparison

Essa é a fundação da experiência.

Essa foi uma das ideias centrais e precisa estar no plano.

Em vez de ranking:

1 Jardins R$ 200k
2 Moema R$ 180k
3 Campinas R$ 160k

teremos:

```
REDE

DECOLANDO       SAUDÁVEL        ATENÇÃO         CRÍTICO

┌───────────┐   ┌───────────┐   ┌───────────┐  ┌────────────┐
│ Jardins   │   │ Moema     │   │ Pinheiros │  │ Campinas  │
│           │   │           │   │           │  │           │
│ +27%      │   │ +8%       │   │ -6%       │  │ -18%      │
│ Marg 38%  │   │ Marg 32%  │   │ Marg 21%  │  │ Marg 12%  │
│           │   │           │   │           │  │           │
│ ↑ Premium │   │ → estável │   │ ↓ produto │  │ ⚠ agenda  │
└───────────┘   └───────────┘   └───────────┘  └────────────┘

```
Mas os cartões mudam de coluna automaticamente.

O usuário não arrasta.

O negócio muda o cartão de lugar.

Cada cartão deve mostrar
faturamento;
variação;
margem;
ocupação;
Health Score;
principal força;
principal problema.

Clique em Campinas:

Rede
 >
Campinas

e abre o próximo nível.