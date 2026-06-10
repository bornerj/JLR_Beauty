Status: ACTIVE
Data: 2026-02-28
Contexto: A regra atual de memoria macro deixou lacunas para correcoes pontuais executadas sem plano ativo (ex.: ajustes de branding, href e bugs pequenos), reduzindo rastreabilidade no `memory/MODIFICATION_LOG.md`.
Decision: Adotar fluxo hibrido de registro. Quando houver plano ativo, manter no `memory/MODIFICATION_LOG.md` apenas marcos de INICIO/FIM do plano; quando nao houver plano ativo, registrar INICIO/FIM de cada alteracao pontual no `memory/MODIFICATION_LOG.md` ate a conclusao.
Consequencias: Mantem disciplina de planos para entregas maiores e recupera rastreabilidade diaria para hotfixes/correcoes pequenas; reduz risco de "mudancas invisiveis"; exige triagem de escopo durante a execucao para converter para `PLAN-XXXX` quando a tarefa crescer.
