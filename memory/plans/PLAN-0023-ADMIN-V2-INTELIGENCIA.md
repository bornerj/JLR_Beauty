# PLAN-0023 — Admin V2: Programa de Retrofit (Inteligência)

**Status:** ✅ Ondas 1-7 (RETROFIT-011/012/013/014/017/018/019) CONCLUÍDAS 2026-08-15, todas com E2E real + validação visual (Ondas 6-7 fechadas depois das demais — ver `## Ondas 6-7 — Fechamento da validação pendente`). **Roadmap de Inteligência do PLAN-0023 100% entregue e validado.** Consolidação (RETROFIT-020/021, fora deste plano) segue em `PLAN-0024`.
**Origem:** continuação direta do `PLAN-0022` (Fundação + Experiência Operacional, Ondas 0-9 + RETROFIT-010b, 100% entregue e validada visualmente em 2026-08-15) — a própria seção "Próximos Passos" daquele plano já previa que "planejamento detalhado de Inteligência (RETROFIT-011 a 019)... fica para um plano futuro (`PLAN-0023` em diante), quando a Fundação+Operação estiver validada em uso real". Está validada — este plano nasce agora, a pedido do usuário ("continue com o retrofit seguinte ao último concluído").
**Decisão arquitetural herdada:** `DECISION-013` (ACTIVE) — mesmas regras fixas do `PLAN-0022` (Health Score, escopo por unidade, explicabilidade) continuam valendo aqui, não são revalidadas onda a onda.
**Escopo macro:** só `apps/api/src/modules/intelligence/` (módulos novos) e `apps/web/src/admin-v2/` (telas novas) — nenhuma migração de schema prevista nesta leva (Inteligência é 100% derivada dos dados já existentes/já classificados pelas Ondas 1-9).
**Agentes de apoio:** mesmos do `PLAN-0022` — `@orchestrator`, `@backend-specialist`, `@frontend-specialist`.

---

## Governança do programa (herdada do PLAN-0022, vale para todas as ondas deste plano)

Não é opcional, não se revalida onda a onda — ver `PLAN-0022` §"Governança do programa" para o texto completo. Destaques mais relevantes para a leva de Inteligência:
1. Nenhum cálculo novo de margem/score/classificação no frontend — sempre o que a API já decompôs.
2. Regra de explicabilidade: nenhum achado do Radar/Gargalos é só um número — sempre vem com a explicação e uma ação navegável (governança #6 e #7 do PLAN-0022).
3. Sem ML nesta fase — toda classificação/priorização é regra determinística e documentada no código (mesmo padrão dos classificadores das Ondas 5-9).
4. Reuso antes de criação — cada onda desta leva **consome** os módulos `intelligence/*` já existentes (Ondas 1-9), nunca recalcula o que já foi calculado.

---

## Roadmap desta leva (herdado do roadmap resumido do PLAN-0022)

| # | Nome | Pergunta que fecha | Status |
|---|---|---|---|
| RETROFIT-011 | Radar Executivo | O que mudou e merece atenção? | ✅ CONCLUÍDA 2026-08-15 |
| RETROFIT-012 | "O que está travando?" (Gargalos) | O que impede o negócio de performar melhor? | ✅ CONCLUÍDA 2026-08-15 |
| RETROFIT-013 | "Onde está o dinheiro?" | Quem gera receita e quem gera lucro? | ✅ CONCLUÍDA 2026-08-15 |
| RETROFIT-014 | Comparador Visual de Unidades | Por que uma unidade performa melhor que outra? | ✅ CONCLUÍDA 2026-08-15 |
| RETROFIT-017 | Health Score (evolução) | — | ✅ CONCLUÍDA 2026-08-15 (v1 já entregue na Onda 1 do PLAN-0022; esta onda refinou narrativa) |
| RETROFIT-018 | Insight Engine | O que devo saber sem perguntar? | código completo 2026-08-15, E2E/visual pendentes (escopo ajustado — ver Onda 6 abaixo) |
| RETROFIT-019 | Ações Recomendadas | O que posso fazer agora? | código completo 2026-08-15, E2E/visual pendentes (escopo ajustado — ver Onda 7 abaixo) |

Consolidação (RETROFIT-020 a 022) fica fora deste plano — só entra quando o usuário decidir sobre a migração/aposentadoria do Admin legado (sem critério fixado ainda, `PLAN-0022` §RETROFIT-022).

---

### Onda 1 — Radar Executivo (RETROFIT-011)

**Pergunta que a tela fecha:** *o que mudou e merece atenção hoje?*

**Design (RAG contra os módulos já entregues, Ondas 1-9):** um agregador que consome os 8 endpoints de leitura já existentes (`panorama`, `network`, `operations/orders`, `portfolio/products`, `portfolio/services`, `customers`, `subscriptions/health`, `growth/franchises/pipeline`) em paralelo e monta uma lista de **achados** determinísticos (sem ML), cada um com severidade (`CRITICO/ATENCAO/OPORTUNIDADE`), categoria, mensagem já explicada e uma ação navegável — nunca um número solto (governança #6/#7). Diferente do Panorama (que já tem seu próprio `attention: PanoramaAttentionSignal[]` restrito a rede/pedidos): o Radar cruza TODOS os domínios (Portfólio, Serviços, Clientes, Assinaturas, Franquias inclusos), com link de ação específico por achado (o Panorama não carrega isso hoje).

**Regras de achado (fixas, documentadas no código — nenhuma inventada além do que os módulos já classificam):**
- Unidade CRITICA (`network`) → 1 achado `CRITICO` por unidade, com a causa principal já decomposta.
- Coluna "Atenção" do board de pedidos (`operations/orders`): `>=10` pedidos → `CRITICO`; `>=1` → `ATENCAO`.
- Produtos/serviços "Armadilha" (`portfolio/products`, `portfolio/services`): `>=1` → `ATENCAO` (1 achado agregado por domínio, não 1 por item, para não inundar o briefing).
- Clientes "Em risco" (`customers`): `>=1` → `ATENCAO`.
- Churn de assinatura no período (`subscriptions/health`): `>=1` cancelamento → `CRITICO`; assinaturas em "Atenção" `>=1` → `ATENCAO`.
- Etapa do funil de franquias mais lenta que o histórico (`growth/franchises/pipeline`, `isBottleneck`) → `ATENCAO` por etapa; leads parados `>=1` → `ATENCAO` agregado.
- Tendência de receita (`panorama.financial`): queda `<=-10%` → `ATENCAO`; alta `>=+15%` → `OPORTUNIDADE`.
- Oportunidade de reativação já calculada pelo Panorama (`panorama.opportunities`) → `OPORTUNIDADE`.

**Backend**
- [ ] `apps/api/src/modules/intelligence/radar/types.ts` — contrato (`RadarFinding`, `RadarBriefing`).
- [ ] `apps/api/src/modules/intelligence/radar/rules.ts` — função pura `buildRadarFindings(inputs)`, testável isolada (mesmo padrão `classifier.ts`/`metrics.ts` das Ondas 5-9).
- [ ] `apps/api/src/modules/intelligence/radar/rules.test.ts` — cobertura de cada regra + verificação de que nenhum achado sai sem `actionPath`.
- [ ] `apps/api/src/modules/intelligence/radar/service.ts` — busca os 8 endpoints em paralelo (reuso direto das funções `get*` já existentes, sem endpoint novo de dado bruto) e delega para `rules.ts`.
- [ ] `GET /api/admin-v2/radar?days=` em `adminV2.ts` — mesmo padrão `requireAdmin`; sem `unitIds` (é um briefing de rede inteira, como o Panorama).

**Frontend**
- [ ] `radar/types.ts` + `radar/state.ts` (rótulo/cor por severidade) + `radar/RadarView.tsx` — lista de achados agrupados por severidade, cada um com botão de ação real (navega para a tela correspondente).
- [ ] Sidebar: Radar não tem "mundo" próprio nos 7 fixos da Onda 1 — nasce dentro de "Panorama" (é literalmente o aprofundamento do Panorama) como uma aba/link, ou como card adicional no próprio Panorama linkando para `/admin-v2/radar`. Decisão: **rota própria `/admin-v2/radar`**, acessível por um card novo no topo do Panorama ("Ver radar completo") — mantém o Panorama como resumo e o Radar como a lista completa e acionável, sem sobrecarregar o dashboard.

**Critérios de aceitação:** nenhum achado sem `actionPath`; contagens de cada achado batem com os endpoints de origem (E2E real); Radar carrega em paralelo (não em cascata) — `Promise.all` nos 8 fetches.

**Backend entregue:**
- [x] `apps/api/src/modules/intelligence/radar/types.ts` — contrato (`RadarFinding`, `RadarBriefing`, `RadarInputs`).
- [x] `apps/api/src/modules/intelligence/radar/rules.ts` — `buildRadarFindings()` pura, 9 regras fixas e documentadas (unidade crítica, pedidos em atenção, produtos/serviços Armadilha, clientes em risco, churn/atenção de assinatura, gargalo/leads parados de franquia, tendência de receita, oportunidade de reativação do Panorama), ordenadas por severidade.
- [x] `apps/api/src/modules/intelligence/radar/rules.test.ts` — **11 testes unitários PASS**, incluindo verificação de que todo achado sai com `actionPath`/`actionLabel`/`message` não vazios. Registrado em `test:intelligence` (agora 82 testes).
- [x] `apps/api/src/modules/intelligence/radar/service.ts` — busca os 8 módulos em `Promise.all` (nunca cascata), delega para `rules.ts`.
- [x] `GET /api/admin-v2/radar?days=` em `adminV2.ts`.

**Frontend entregue:**
- [x] `radar/types.ts` + `radar/state.ts` (rótulo/cor por severidade) + `radar/RadarView.tsx` — achados agrupados por severidade, cada um com botão de ação real.
- [x] Rota própria `/admin-v2/radar` (sem "mundo" na sidebar — nasce dentro de Panorama); `panorama/PanoramaView.tsx` ganhou o botão "Ver radar executivo →".
- [x] Breadcrumb `Panorama > Radar Executivo`.

**Validações executadas (todas reais):** `tsc -p tsconfig.build.json --noEmit` (api) PASS; `npx tsc -b` (web) PASS; `npm run build` (api e web) PASS; `npm run test` (api) **110/110 PASS**; `npm run lint` (web) — mesmo padrão `fetch-on-mount` tolerado, 1 instância nova; `docker compose build api web` PASS. **E2E real contra Postgres**: `GET /api/admin-v2/radar` → `200` com **9 achados reais** cruzando todos os 8 módulos (28 pedidos em atenção, 1 churn 11.1%, 1 produto Armadilha, 3 serviços Armadilha, 1 cliente em risco, 3 assinaturas em atenção, 2 gargalos de etapa + leads parados de franquia — todos conferindo exatamente com os dados já validados nas Ondas 5-9), ordenados por severidade, todos com `actionPath` válido; `401` sem token; regressão em `/panorama`, `/network`, `/customers`, `/subscriptions/health`, `/growth/franchises/pipeline` → `200`. **Validação visual real**: tela renderizada corretamente, achados legíveis e agrupados; navegação de "Ver pipeline" e "Ver radar executivo →" confirmada funcionando (um clique simulado da ferramenta de automação errou o alvo — confirmado via `.click()` direto no DOM que o código está correto).

---

### Onda 2 — "O que está travando?" / Gargalos (RETROFIT-012)

**Pergunta que a tela fecha:** *o que impede o negócio de performar melhor?*

**Design (RAG contra os módulos já entregues, Ondas 1-9 do PLAN-0022):** diferente do Radar (Onda 1, lista TUDO que mudou/merece atenção, sem filtro de tradução monetária), Gargalos só entra o que tem uma **tradução honesta pra R$** — ranking por impacto, maior primeiro; item sem impacto conhecido nunca é escondido, só vai pro fim da lista (governança #6). Consome 5 módulos já entregues (`operational-orders`, `capacity`, `portfolio` produtos, `subscriptions`, `franchise-pipeline`), cada um contribuindo no máximo 1 gargalo agregado (nunca 1 por item, para não inundar a lista).

**Regras de gargalo (fixas, documentadas em `rules.ts`, nenhuma inventada além do que os módulos já classificam):**
- Operação (`operational-orders`): coluna "Atenção" do board `>0` pedidos → impacto = soma do valor dos pedidos travados.
- Agenda (`capacity`, todas as unidades): capacidade ociosa em rede inteira → impacto = soma de (minutos ociosos × receita/hora de referência) por horário por unidade, mesma fórmula do drill-down da Onda 4; aponta a unidade mais afetada.
- Portfólio (`portfolio` produtos): produtos "Armadilha" (vendem bastante, rendem pouco) → impacto = soma de estoque físico × custo; pode ser `null` quando não há capital físico parado.
- Assinaturas (`subscriptions`): assinaturas em estado "Saindo" ou "Atenção" → impacto = soma do preço mensal dos planos (MRR em risco).
- Franquias (`franchise-pipeline`): leads com `isStalled` (parados além do tempo médio esperado da etapa) → impacto = soma do `estimatedValue`; pode ser `null` quando o lead não tem valor estimado.
- `totalImpact` = soma só dos itens com `impact` não nulo (nunca soma um número inventado no lugar de `null`).

**Backend entregue:**
- [x] `apps/api/src/modules/intelligence/gargalos/types.ts` — contrato (`Bottleneck`, `BottleneckImpact` honesto `{amount, explanation} | null`, `BottlenecksRanking`, `RankInputs`).
- [x] `apps/api/src/modules/intelligence/gargalos/rules.ts` — `rankBottlenecks()` pura, 5 regras fixas, ordena por impacto (nulls por último); `sumKnownImpact()` ignora nulls.
- [x] `apps/api/src/modules/intelligence/gargalos/rules.test.ts` — **10 testes unitários PASS**, cobrindo baseline neutro, impacto de cada domínio, soma multi-slot de agenda, fallback de taxa própria vs. da unidade, filtragem por estado de assinatura, ordenação com nulls por último e `sumKnownImpact`.
- [x] `apps/api/src/modules/intelligence/gargalos/service.ts` — busca os 5 módulos em `Promise.all` (nunca cascata; `capacity` buscado por unidade e agregado), delega para `rules.ts`.
- [x] Campo aditivo `SubscriptionHealthEntry.membershipPrice` (mirror front/back) — necessário para o cálculo honesto de MRR em risco, sem inventar valor.
- [x] `GET /api/admin-v2/gargalos?days=` em `adminV2.ts`.

**Frontend entregue:**
- [x] `gargalos/types.ts` (mirror do backend) + `gargalos/GargalosView.tsx` — card "Impacto total conhecido" (só aparece quando `totalImpact > 0`) + lista numerada por impacto, cada item com categoria, mensagem, valor formatado + explicação (ou aviso "impacto em R$ ainda não estimável" quando `impact` é `null`) e botão de ação real.
- [x] `IntelligenceTabs` (Radar/Gargalos) em `AdminV2Root.tsx` — mesmo padrão de `OperationsTabs`/`CustomersTabs`; rota `/admin-v2/gargalos`; breadcrumb `Panorama > Inteligência > Gargalos`.
- [x] Botão de entrada "Ver gargalos →" em `panorama/PanoramaView.tsx`, ao lado do "Ver radar executivo →" já existente.

**Validações executadas (todas reais):** `tsc -p tsconfig.build.json --noEmit` (api) PASS; `npx tsc -b` (web) PASS; `npm run build` (api e web) PASS; `npm run test` (api) **120/120 PASS**; `npm run lint` (web) — mesmo padrão `fetch-on-mount` tolerado, 1 instância nova (`GargalosView.tsx`); `docker compose build api web` PASS + redeploy `--force-recreate` + healthcheck OK. **E2E real contra Postgres** (login MASTER): `GET /api/admin-v2/gargalos` → `200` com **5 gargalos reais**, todos com impacto conhecido: Agenda R$ 1.078.346,41 (Birmann 20 como unidade mais afetada), Franquias R$ 1.040.000,00 (6 leads parados), Operação R$ 7.292,30 (28 pedidos), Portfólio R$ 2.064,00 (1 produto Armadilha), Assinaturas R$ 776,00 (4 em risco) — `totalImpact` R$ 2.128.478,71 confere exatamente com a soma manual dos 5 itens; contagens de pedidos/produto Armadilha batendo com o que já estava validado no Radar (Onda 1); `?days=7` retorna período e números diferentes corretamente; `401` sem token; regressão OK em `/panorama`, `/network`, `/operations/orders`, `/portfolio/products`, `/subscriptions/health` → `200`. **Validação visual real**: tela renderiza corretamente (título, subtítulo, card de impacto total, 5 itens ranqueados, tipografia legível); abas Radar/Gargalos alternam corretamente; clique no botão "Ver agenda" navega para `/admin-v2/operacao/agenda` (confirmado por mudança de URL); botão "Ver gargalos →" do Panorama navega corretamente para `/admin-v2/gargalos` (confirmado via `.click()` direto no DOM — cliques simulados por coordenada da ferramenta de automação voltaram a errar o alvo em 2 tentativas, mesmo comportamento já documentado na Onda 1, não é bug de código).

---

### Onda 3 — "Onde está o dinheiro?" (RETROFIT-013)

**Pergunta que a tela fecha:** *quem gera receita e quem gera lucro?*

**Design (RAG contra os módulos já entregues):** cascata Receita → Custo Direto → Margem Bruta (mockup original `retrofit/RETROFIT-013.md`), decomposta por Unidade/Produto/Serviço/Canal/Profissional/Plano de assinatura. **Decisão de escopo documentada**: o degrau `descontos/taxas/perdas → Margem de Contribuição` do mockup original **não existe** aqui — o `total` de um pedido já é o valor final pós-desconto (não há uma linha de desconto separada no schema); criar esse degrau seria fabricar um número redundante com a Margem Bruta (governança #6, nunca inventar). O módulo **não recalcula nada**: recombina 3 origens já validadas em ondas anteriores —
- **Produtos**: `getSalesInsights` (PLAN-0020/`admin/kpis`) — receita = pedidos PAGO, custo = CMV.
- **Serviços**: `getServicePerformance` (Onda 6) — receita/custo = preço/custo do serviço em agendamentos não cancelados.
- **Assinaturas (MRR)**: `getSubscriptionHealth` (Onda 8) — soma do preço mensal de toda assinatura ainda não cancelada; sem custo rastreado (`cost: null`, explicado).

Única agregação nova: receita/custo de serviço agrupada **por profissional** (mesma fonte de dados da Onda 6 — `Appointment` não cancelado + `Service.price/cost` —, só reagrupada por `professionalId` em vez de `serviceId`).

**Backend entregue:**
- [x] `apps/api/src/modules/intelligence/money/types.ts` — contrato (`MoneyWaterfallStep`, `MoneySource`, `MoneyByUnit/Product/Service/Channel/Professional/Plan`, `MoneyOverview`).
- [x] `apps/api/src/modules/intelligence/money/rules.ts` — `buildMoneyOverview()` pura: monta a cascata, as 3 origens, e as 6 decomposições a partir dos módulos já buscados.
- [x] `apps/api/src/modules/intelligence/money/rules.test.ts` — **8 testes unitários PASS**, incluindo soma das 3 origens na cascata, exclusão de assinatura cancelada do MRR/byPlan, soma produto+serviço por unidade com `marginPercent: null` quando não há receita, ordenação de `byService`/`byProfessional`.
- [x] `apps/api/src/modules/intelligence/money/service.ts` — busca os 3 módulos + a agregação por profissional em `Promise.all` (nunca cascata; produtos buscados também por unidade, mesmo padrão já usado no Comparador/Health Score).
- [x] Campo aditivo reaproveitado: nenhum novo (só consome o que a Onda 2 já expôs em `SubscriptionHealthEntry.membershipPrice`).
- [x] `GET /api/admin-v2/money?days=` em `adminV2.ts`.

**Frontend entregue:**
- [x] `money/types.ts` (mirror do backend) + `money/MoneyView.tsx` — cascata visual (setas ↓ nos degraus de subtração), 3 cards de origem, tabela "Por Unidade" e 4 listas (Produto/Serviço/Canal/Profissional) + 1 lista de planos de assinatura, todas explicadas.
- [x] `IntelligenceTabs` estendida para 4 abas (Radar/Gargalos/**Dinheiro**/Comparador) em `AdminV2Root.tsx`; rota `/admin-v2/dinheiro`; breadcrumb `Panorama > Inteligência > Onde está o dinheiro?`.

**Validações executadas (todas reais):** `tsc -p tsconfig.build.json --noEmit` (api) PASS; `npx tsc -b` (web) PASS; `npm run build` (api e web) PASS; `npm run test` (api) **128/128 PASS** antes da Onda 4; `npm run lint` (web) — mesmo padrão `fetch-on-mount` tolerado, 1 instância nova; `docker compose build api web` + redeploy validados junto com a Onda 4 (ver validação combinada abaixo).

---

### Onda 4 — Comparador Visual de Unidades (RETROFIT-014)

**Pergunta que a tela fecha:** *por que uma unidade performa melhor que outra?*

**Design (RAG contra os módulos já entregues):** tabela Unidade × 5 dimensões (mockup original `retrofit/RETROFIT-014.md`: Receita, Margem, Ocupação, Ticket Médio, Recorrência) + coluna "Rede", mais o card "Maior Diferença" apontando a causa, não só mostrando colunas. **Reuso quase total**: as 5 dimensões por unidade já existem prontas em `getUnitsHealth` (Onda 1 — Health Score) — receita, margem, tendência de receita, ocupação (`occupancy.availableMinutes/bookedMinutes`) e recorrência —, faltando só `avgTicket` (`getSalesInsights` por unidade, PLAN-0020). Nenhuma query nova de dado bruto, só uma chamada adicional a `getCapacityHeatmap` por unidade (Onda 4 do PLAN-0022) para obter `unitRevenuePerBookedHour`, necessário só para a estimativa de R$ do gap de Ocupação.

**Regra do "Maior Diferença" (fixa, documentada em `rules.ts`):** para cada uma das 5 métricas, calcula o spread relativo `(melhor − pior) / valor da rede × 100`; a métrica com maior spread vence o ranking. **Só quando a métrica vencedora é Ocupação** existe uma fórmula honesta de tradução para R$ (reuso exato da fórmula do drill-down de horário da Onda 4: minutos ociosos adicionais × receita/hora de referência da própria unidade mais fraca) — para as outras 4 métricas, `estimatedRevenueDifference` é `null` com explicação honesta de que não existe conversão confiável ainda (governança #6, nunca fabricar). Com menos de 2 unidades no escopo, `biggestGap` é `null` (nada a comparar).

**Backend entregue:**
- [x] `apps/api/src/modules/intelligence/comparator/types.ts` — contrato (`ComparatorUnitRow`, `ComparatorNetworkRow`, `ComparatorGap`, `UnitComparator`).
- [x] `apps/api/src/modules/intelligence/comparator/rules.ts` — `buildUnitComparator()` pura: monta a linha "Rede" (ocupação = agregado bookedMinutes/availableMinutes, não média das unidades; recorrência = média simples, documentada), acha o maior gap relativo, estima R$ só para Ocupação.
- [x] `apps/api/src/modules/intelligence/comparator/rules.test.ts` — **8 testes unitários PASS**, incluindo `biggestGap: null` com <2 unidades, métrica empatada ignorada no ranking, estimativa de R$ só para Ocupação, ocupação da rede como agregado (não média).
- [x] `apps/api/src/modules/intelligence/comparator/service.ts` — busca `getUnitsHealth` + `getSalesInsights` por unidade + `getCapacityHeatmap` por unidade + `getSalesInsights` de rede em `Promise.all` (nunca cascata), delega para `rules.ts`.
- [x] `GET /api/admin-v2/comparator?days=` em `adminV2.ts`.

**Frontend entregue:**
- [x] `comparator/types.ts` (mirror do backend) + `comparator/ComparatorView.tsx` — tabela Métrica × Unidades × Rede + card "Maior Diferença" (com estimativa de R$ quando existe, ou a explicação honesta quando não existe); estado "menos de 2 unidades" tratado explicitamente.
- [x] 4ª aba "Comparador" em `IntelligenceTabs`; rota `/admin-v2/comparador`; breadcrumb `Panorama > Inteligência > Comparador de Unidades`.

**Validações executadas (todas reais, Ondas 3+4 juntas):** `tsc -p tsconfig.build.json --noEmit` (api) PASS; `npx tsc -b` (web) PASS; `npm run build` (api e web) PASS; `npm run test` (api) **136/136 PASS** (5 + 23 + 108 intelligence); `npm run lint` (web) — mesmo padrão `fetch-on-mount` tolerado, 2 instâncias novas (`MoneyView.tsx`, `ComparatorView.tsx`); `docker compose build api web` PASS + redeploy `--force-recreate` + healthcheck OK. **E2E real contra Postgres** (login MASTER): `GET /api/admin-v2/money` → `200` com cascata batendo exatamente (Receita R$ 32.292,00 = Produtos R$ 11.290,00 + Serviços R$ 19.340,00 + Assinaturas R$ 1.662,00; Custo Direto R$ 10.264,00 = R$ 108,00 + R$ 10.156,00; Margem Bruta R$ 22.028,00; `byPlan` soma R$ 1.662,00 idêntico ao MRR da origem "Assinaturas"); `GET /api/admin-v2/comparator` → `200` com 5 unidades + linha Rede, `biggestGap` em Ocupação (Loja Online 0% — coerente, é loja online sem agenda física — vs Parque da Cidade 2,3%) e `estimatedRevenueDifference: null` (nenhuma unidade tem receita/hora de referência suficiente no recorte para estimar); `401` sem token nos dois; regressão OK em `/panorama`, `/network`, `/radar`, `/gargalos`. **Validação visual real**: as duas telas renderizam corretamente (cascata com setas, cards de origem, tabela por unidade e listas na Onda 3; tabela Métrica×Unidade×Rede e card "Maior Diferença" na Onda 4), 4ª/3ª abas do `IntelligenceTabs` funcionando, breadcrumbs corretos (`Panorama > Inteligência > Onde está o dinheiro?` e `Panorama > Inteligência > Comparador de Unidades`), números na tela conferindo exatamente com o E2E.

---

### Onda 5 — Health Score (evolução) (RETROFIT-017)

**Pergunta que a tela fecha:** já respondida pela v1 (Onda 1 do PLAN-0022) — esta onda só refina a explicação, não a fórmula (`DECISION-013` continua intocada).

**Design:** o texto original do programa agrupa "Health Score" em Inteligência como uma onda de evolução da *narrativa*, não da fórmula.

1. **Narrativa em prosa**: uma frase determinística no Diagnóstico da Unidade, composta só a partir de campos que o score já decompôs (unidade, estado, score, tendência de receita, força/fraqueza principal, impacto quando existe) — não é um cálculo novo, é composição de texto sobre dados já explicados.
2. **Estimativa de impacto R$ estendida — tentada e revertida nesta mesma onda**: a ideia inicial era estender a tradução pra R$ (que na v1 só cobria "ocupação") também pra "estoque", reusando o `capitalParked` de produtos Armadilha já calculado no Portfólio (Onda 5 do PLAN-0022). Implementado, testado (9 testes) e **rejeitado na validação E2E**: o componente "estoque" do Health Score mede ruptura/estoque baixo (`inventoryHealthRate`, ver `unit-health/service.ts`) — um sinal distinto de "capital parado em produto Armadilha" (baixa margem, alto volume). Uma unidade pode ter ruptura severa com zero capital parado (efeito oposto do que a fórmula assumia). Anexar esse número à fraqueza errada violaria a governança #6 (nunca um número que não explica a causa real) — revertido antes de ir para produção; ocupação continua a única fraqueza com tradução honesta. Decisão documentada em `apps/api/src/modules/intelligence/network/impact.ts`.

**Backend entregue:**
- [x] `apps/api/src/modules/intelligence/network/impact.ts` (novo, extraído de `service.ts`) — `estimateWeaknessImpact()` pura; mesma regra da v1 (só "ocupação"), com o raciocínio de rejeição de "estoque" documentado inline para não ser tentado de novo sem essa memória.
- [x] `apps/api/src/modules/intelligence/network/impact.test.ts` — **8 testes unitários PASS**, incluindo as 5 fraquezas sem tradução confirmando `null` mesmo com dados favoráveis (nunca fabrica).
- [x] `apps/api/src/modules/intelligence/network/narrative.ts` (novo) — `buildUnitNarrative()` pura.
- [x] `apps/api/src/modules/intelligence/network/narrative.test.ts` — **5 testes unitários PASS**.
- [x] `network/service.ts` — `getUnitDiagnostic()` monta a narrativa a partir do Health Score já calculado; expõe `narrative: string` novo em `UnitDiagnostic`.
- [x] Nenhuma rota nova — `GET /api/admin-v2/network/units/:id` (já existente, Onda 2 do PLAN-0022) passou a devolver o campo novo automaticamente.

**Frontend entregue:**
- [x] `network/types.ts` — mirror atualizado (`narrative: string` novo em `UnitDiagnostic`).
- [x] `network/UnitDetailView.tsx` — parágrafo de narrativa logo abaixo do cabeçalho da unidade.
- [x] **Correção de dívida encontrada nesta onda**: o botão "Comparar unidade" estava desabilitado desde a Onda 2 do PLAN-0022 ("em breve — Comparador chega numa onda futura, RETROFIT-014"). O Comparador foi entregue na Onda 4 desta leva — o botão estava desatualizado, mostrando "em breve" para uma funcionalidade que já existe. Corrigido para navegação real (`/admin-v2/comparador`).

**Validações executadas (todas reais):** `tsc -p tsconfig.build.json --noEmit` (api) PASS; `npx tsc -b` (web) PASS; `npm run build` (api e web) PASS; `npm run test` (api) **149/149 PASS** (5 + 23 + 121 intelligence); `docker compose build api web` PASS + redeploy `--force-recreate` + healthcheck OK. **E2E real contra Postgres** e **validação visual real**: ver registro completo em `memory/MODIFICATION_LOG.md`.

---

### Onda 6 — Insight Engine (RETROFIT-018)

**Pergunta que a tela fecha:** *o que devo saber sem perguntar?*

**Escopo ajustado, decidido com o usuário antes de implementar:** o roadmap original descreve o Insight Engine como "a camada que gera os achados do Radar/Gargalos a partir de regras determinísticas" — mas Radar (Onda 1) e Gargalos (Onda 2) **já são** exatamente isso, cada um já entregue com seu próprio motor de regras testado. Construir um "motor" novo por trás dos dois seria refazer trabalho já validado sem ganho real (contra a governança de reuso). Perguntado ao usuário, decisão: RETROFIT-018 vira uma **camada de consolidação** — um único feed que junta Radar + Gargalos + o maior achado do Comparador (Onda 4), ranqueado, servindo de base natural para o RETROFIT-019 (Ações Recomendadas).

**Regra de deduplicação (fixa, documentada em `rules.ts`):** Radar e Gargalos descrevem o mesmo fato em 4 das 5 categorias do Gargalos (Operação, Portfólio, Assinaturas, Franquias) — um do jeito narrativo, o outro com R$. Mostrar os dois seria o oposto de "um único feed". Regra: quando a categoria existe nos dois, só a versão do Gargalos entra (carrega o R$, o Radar não); achados do Radar em categorias que o Gargalos não cobre (Rede, Serviços, Clientes, Financeiro) entram normalmente. Ordenação final: prioridade (Crítico > Atenção > Oportunidade), depois por R$ conhecido decrescente (nulls por último).

**Backend entregue:**
- [x] `apps/api/src/modules/intelligence/insights/types.ts` — contrato (`Insight`, `InsightPriority`, `InsightSource`, `InsightFeed`).
- [x] `apps/api/src/modules/intelligence/insights/rules.ts` — `buildInsightFeed()` pura: dedup por categoria, conversão do maior achado do Comparador em insight, ordenação final. `sumKnownImpact()` ignora nulls.
- [x] `apps/api/src/modules/intelligence/insights/rules.test.ts` — **8 testes unitários PASS**, incluindo a dedup Radar×Gargalos, prioridade Crítico sempre primeiro mesmo sem R$, ordenação por impacto dentro da mesma prioridade, e o Comparador só virando insight quando `biggestGap` não é `null`.
- [x] `apps/api/src/modules/intelligence/insights/service.ts` — busca Radar + Gargalos + Comparador em `Promise.all` (nunca cascata), delega para `rules.ts`.
- [x] `GET /api/admin-v2/insights?days=` em `adminV2.ts`.

**Frontend entregue:**
- [x] `insights/types.ts` (mirror) + `insights/state.ts` (rótulos/cor por prioridade, reuso do vocabulário do Radar) + `insights/InsightsView.tsx` — card "Impacto total conhecido" condicional + feed agrupado por prioridade, cada item com categoria, origem (Radar/Gargalos/Comparador), mensagem, valor + explicação quando existe, e botão de ação real.
- [x] 5ª aba "Insights" em `IntelligenceTabs`; rota `/admin-v2/insights`; breadcrumb `Panorama > Inteligência > Insights`.
- [x] Botão de entrada "Ver insights →" em `panorama/PanoramaView.tsx`, ao lado dos botões de Radar e Gargalos já existentes.

**Validações executadas:** `tsc -p tsconfig.build.json --noEmit` (api) PASS; `npx tsc -b` (web) PASS; `npm run build` (api e web) PASS; `npm run test` (api) **157/157 PASS** (5 + 23 + 129 intelligence); `npm run lint` (web) — mesmo padrão `fetch-on-mount` tolerado, 2 instâncias novas (`InsightsView.tsx`, mais a edição em `PanoramaView.tsx`). **Pendente no fechamento desta sessão**: `docker compose build`, redeploy, E2E real contra Postgres e validação visual real — o rebuild Docker ainda estava em andamento quando a sessão foi encerrada a pedido do usuário. Ver `memory/MODIFICATION_LOG.md` (fechamento de sessão) — próxima sessão deve completar essa validação antes de considerar a Onda 6 realmente pronta pra uso.

---

### Onda 7 — Ações Recomendadas (RETROFIT-019)

**Pergunta que a tela fecha:** *o que posso fazer agora?*

**Escopo ajustado, decidido com o usuário antes de implementar:** o mockup original ("[Criar campanha] [Ajustar preço] [Falar com franqueado]") pressupõe várias ações específicas por insight, cada uma levando a uma tela dedicada. Duas restrições reais impediam isso: (1) o Admin legado não suporta deep-link confiável pra sub-telas (já documentado na Onda 2 do PLAN-0022 — um link assim aterrissaria no painel padrão, não na tela certa); (2) dentro do próprio Admin V2, só existe UMA tela de escrita real (mover etapa do Pipeline de Franquias, RETROFIT-010b) — todo o resto da leva de Inteligência é só leitura. Decisão: catálogo de sugestões em **texto** (conselho de negócio determinístico por categoria), com botão de navegação só quando existe uma rota real pra ir junto — nunca um botão que não leva a lugar nenhum.

**Catálogo entregue (fixo, por categoria, documentado em `recommendations.ts`):** Rede, Operação, Agenda, Portfólio, Serviços, Clientes, Assinaturas e Comparador ganham 1 sugestão em texto puro (`actionPath: null`). Franquias aponta para `/admin-v2/crescimento` (mover a etapa do lead, tela real da Onda 9 do PLAN-0022). Financeiro aponta para `/admin-v2/dinheiro` (decomposição por unidade/produto/canal, tela real da Onda 3 desta leva). Categoria sem entrada no catálogo devolve lista vazia — nunca uma sugestão genérica fabricada.

**Backend entregue:**
- [x] `apps/api/src/modules/intelligence/insights/types.ts` — `RecommendedAction` novo (`label`, `actionPath: string | null`); `Insight.recommendedActions: RecommendedAction[]` adicionado.
- [x] `apps/api/src/modules/intelligence/insights/recommendations.ts` (novo) — `getRecommendedActions(category)` pura (catálogo fixo) + `attachRecommendedActions()` (decora a lista de insights).
- [x] `apps/api/src/modules/intelligence/insights/recommendations.test.ts` — **5 testes unitários PASS**, incluindo categoria desconhecida devolvendo lista vazia e a checagem de que só Franquias/Financeiro têm `actionPath` real.
- [x] `insights/rules.ts` (Onda 6) — `buildInsightFeed()` passou a chamar `attachRecommendedActions()` no fim, sem alterar a lógica de dedup/ordenação já validada.
- [x] Nenhuma rota nova — `GET /api/admin-v2/insights` (já existente, Onda 6) passou a devolver `recommendedActions` em cada insight automaticamente.

**Frontend entregue:**
- [x] `insights/types.ts` — mirror atualizado (`RecommendedAction`, `Insight.recommendedActions`).
- [x] `insights/InsightsView.tsx` — cada card de insight ganhou uma lista de sugestões abaixo da mensagem/impacto: texto simples quando `actionPath` é `null`, link sublinhado (navegação real) quando existe.

**Validações executadas:** `tsc -p tsconfig.build.json --noEmit` (api) PASS; `npx tsc -b` (web) PASS; `npm run build` (api e web) PASS; `npm run test` (api) **162/162 PASS** (5 + 23 + 134 intelligence). ~~Pendente no fechamento desta sessão~~ — **completado em 2026-08-15**, ver `## Ondas 6-7 — Fechamento da validação pendente` abaixo.

---

### Ondas 6-7 — Fechamento da validação pendente (2026-08-15)

`docker compose build api web` executado (cache hit em todas as camadas — código já estava na imagem do rebuild anterior); containers `api`/`web`/`nginx`/`postgres` saudáveis.

**E2E real contra Postgres** (login MASTER via `POST /api/auth/login`, JWT real):
- `GET /api/admin-v2/insights?days=30` → `200`, 8 insights, dedup Radar×Gargalos correto (Agenda/Operação/Portfólio/Assinaturas só a versão Gargalos com R$; Serviços/Clientes só Radar; Comparador presente porque `biggestGap` não era `null`), ordenação por impacto R$ decrescente com `null` por último, `totalKnownImpact` (R$ 1.953.478,71) bate exatamente com a soma manual dos `impact.amount`.
- `recommendedActions` conferido contra o catálogo fixo: só Franquias (`/admin-v2/crescimento`) tem `actionPath` real nesta massa de dados; os demais 7 são texto puro (`actionPath: null`) — nenhuma categoria com Financeiro ativo neste recorte, então `/admin-v2/dinheiro` não apareceu (esperado, não é bug).
- Regressão OK em `/panorama` (rota index `/admin-v2`), `/network`, `/radar`, `/gargalos`, `/comparator`, `/money` — todos `200` (3 rodadas). `401` sem token confirmado em `/insights`.

**Validação visual real** (Playwright headless contra o Docker local, `apps/web` já tem `@playwright/test` como devDependency — usado como alternativa por indisponibilidade da extensão Chrome nesta máquina):
- Login real via UI (modal "Entrar" do site) com o usuário MASTER.
- `/admin-v2` (Panorama): botão "Ver insights →" presente ao lado de Radar/Gargalos, narrativa da Onda 5 visível ("Loja Online está em atenção... principal causa: Ocupação").
- `/admin-v2/insights`: 5ª aba ativa, breadcrumb `Panorama > Inteligência > INSIGHTS`, card "Impacto total conhecido" e os 8 cards de insight renderizados batendo número a número com o E2E; link sublinhado só no card de Franquias, texto puro nos demais — exatamente como a governança do RETROFIT-019 define.
- Clique real "Ver insights →" (Panorama → Insights) e clique real no link de ação de Franquias (Insights → `/admin-v2/crescimento`) — navegação funcionando ponta a ponta, Pipeline carrega os 5 leads parados citados no insight.
- Nenhum erro de console/rede específico das Ondas 6-7; os únicos console errors observados são de bootstrap do Admin legado (branding/cupons/seções/etc.), pré-existentes e fora do escopo desta leva — não investigados aqui (anti-scope-drift).

**Conclusão:** Ondas 6-7 (RETROFIT-018 Insight Engine + RETROFIT-019 Ações Recomendadas) agora **realmente validadas** (E2E real + visual real), não só código-completo. PLAN-0023 pode avançar para a decisão de Consolidação (RETROFIT-020/021/022) ou revisão/merge do PR #1.
