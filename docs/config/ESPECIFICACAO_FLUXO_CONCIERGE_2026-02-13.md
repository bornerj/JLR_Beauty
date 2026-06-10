# Especificacao Consolidada - Fluxo Concierge (Ciclo 2026-02-13)

## 1. Objetivo
Consolidar, em formato de especificacao de produto/tecnica, as mudancas de fluxo e estrutura acordadas no ciclo de 2026-02-13 para o concierge (site + WhatsApp), incluindo regras de disponibilidade real, reserva transacional, escalas por profissional, controles administrativos e gaps pendentes.

Fonte principal revisada:
- `docs/evolutive_changes/MUDANCAS_FLUXO_ESTRUTURA.MD`
- `memory/MODIFICATION_LOG.md` (entradas de 2026-02-13)
- `memory/MODIFICATION_LOG.md` (aditivos de 2026-02-14)

## 2. Escopo do ciclo (o que foi combinado)
1. Migrar de slots fixos para disponibilidade real por unidade/data/servico/profissional.
2. Suportar periodos (`MORNING`, `AFTERNOON`, `EVENING`) antes da escolha de horario.
3. Exibir servicos agrupados por categoria no fluxo.
4. Reserva transacional com bloqueio de concorrencia para evitar overbooking.
5. Escala diaria por profissional (informada por profissional), nao apenas horario macro da unidade.
6. Permitir reserva opcional com profissional especifico quando houver disponibilidade.
7. Entregar tela admin para escalar profissionais e associar servicos/unidade.
8. Seedar 3 profissionais com jornadas definidas.

## 3. Estruturas de dados entregues
Referencias: `apps/api/prisma/schema.prisma`.

- `Unit`
  - janela macro de funcionamento: `hourStart`, `hourFinish`.
- `Professional`
  - vinculo opcional com usuario: `userId`.
- `ProfessionalService`
  - associacao N:N profissional x servico.
- `ProfessionalShift`
  - escala diaria real: `workDate`, `hourStart`, `hourFinish`, `isActive`, `notes`.
- `AppointmentSlot`
  - ocupacao em blocos de 30 minutos por agendamento.
  - controle de concorrencia por `@@unique([unitId, professionalId, slotStart])`.
- `AppointmentWaitlistMessage`
  - fila de espera para indisponibilidade.
- `ConciergeSession`
  - trilha conversacional (`step`, `status`, `scheduledDateLabel`, `scheduledFor`, etc.).

## 4. Engine de disponibilidade/reserva
Referencia: `apps/api/src/lib/appointmentAvailability.ts`.

Capacidades implementadas:
1. Calculo de disponibilidade por `unitId + dateIso + serviceId`.
2. Segmentacao por periodo (`MORNING`, `AFTERNOON`, `EVENING`).
3. Horarios em slots de 30 min com validacao de duracao do servico.
4. Filtro por escala ativa do profissional no dia/horario.
5. Consolidacao de capacidade por slot (`professionalsAvailable`).
6. Reserva transacional (`createRemoteAppointment`) com protecao de conflito.
7. Consulta de profissionais disponiveis para slot especifico.

## 5. Endpoints e controles entregues
Referencia: `apps/api/src/routes/index.ts`.

### 5.1 Publicos (concierge)
- `GET /api/public/concierge/booking-context`
- `GET /api/public/concierge/services?unitId&date`
- `GET /api/public/concierge/periods?unitId&date&serviceId`
- `GET /api/public/concierge/slots?unitId&date&serviceId&period`
- `GET /api/public/concierge/slot-professionals?unitId&date&serviceId&slotLabel`
- `POST /api/public/concierge/book` (aceita `preferredProfessionalId`)
- `POST /api/public/concierge/waitlist`

### 5.2 Admin
- `GET /api/concierge/sessions`
- `GET /api/concierge/waitlist`
- `GET/POST/PATCH/DELETE /api/professional-shifts`
- `GET /api/professional-services?professionalId=...`
- `PATCH /api/professionals/:id/link-user`
- `PUT /api/professionals/:id/services`
- `GET /api/settings/:key` e `PUT /api/settings/:key` para configuracoes do fluxo WhatsApp:
  - `whatsapp_flow_category_first`
  - `whatsapp_opening_greeting_text`
  - `whatsapp_completion_greeting_text`

### 5.3 Self-service profissional
- `GET/POST/PATCH/DELETE /api/professionals/me/shifts`

## 6. Fluxo funcional consolidado (esperado)

### 6.1 Fluxo web (site)
Referencia: `apps/web/src/legacy/index.behavior.ts`.

Sequencia alvo:
1. Unidade + data.
2. Categoria + servico.
3. Periodo (manha/tarde/noite).
4. Horario (slot real).
5. Opcao de profissional especifico ou primeiro disponivel.
6. Dados de contato e confirmacao.

### 6.2 Fluxo WhatsApp inbound
Referencia: `apps/api/src/lib/conciergeFlow.ts`.

Sequencia atual do bot:
1. Servico (agrupado por categoria no prompt).
2. Unidade.
3. Data.
4. Periodo.
5. Horario.
6. Se houver mais de um profissional no horario: escolha de profissional (ou primeiro disponivel).
7. Nome.

Observacao importante:
- O fluxo WhatsApp inbound cria agendamento real com `createRemoteAppointment` ao final da conversa.

### 6.3 Aditivo WhatsApp (2026-02-14)
1. Formatacao de mensagens no celular:
- os prompts passaram a ser montados em blocos com linha em branco entre grupos de conteudo.
- Exemplo de padrao: saudacao/pergunta, linha em branco, titulo de lista, itens, linha em branco, instrucao de resposta.

2. Saudacao inicial parametrizavel:
- no Admin > WhatsApp (primeiro bloco), foi adicionado campo de texto para a saudacao inicial.
- Regra de composicao no envio:
  - prefixo automatico por horario: `Bom Dia`, `Boa Tarde` ou `Boa Noite`;
  - seguido do texto salvo no campo `whatsapp_opening_greeting_text`.
- Quando houver nome conhecido, o primeiro nome e incluido apos o prefixo horario.

3. Saudacao final parametrizavel:
- no mesmo bloco do Admin > WhatsApp, foi adicionado campo de texto para a mensagem de conclusao.
- A mensagem final enviada apos a criacao do agendamento passa a usar o valor de `whatsapp_completion_greeting_text`.

4. Chaves de configuracao persistidas:
- `whatsapp_flow_category_first` (toggle ja existente)
- `whatsapp_opening_greeting_text` (novo)
- `whatsapp_completion_greeting_text` (novo)

## 7. Seed operacional entregue
Referencia: `apps/api/prisma/seed.ts`.

Profissionais seedados:
1. Maria Manicure: segunda/quarta/sexta, `08:00-15:00`.
2. Francisca Manicure: todos os dias, `11:00-19:00`.
3. Cicera Cabeleireira: todos os dias, `08:00-16:00`.

Tambem foram seedados:
- vinculos profissional-servico por especialidade;
- janela de escalas para varios dias (`scheduleWindowDays = 56`).

## 8. Controles de tela (admin)
Referencias:
- `apps/web/src/legacy/admin.body.html`
- `apps/web/src/legacy/admin.behavior.ts`

Entregue no Admin > Agenda:
1. Lista/tabulacao de agendamentos do dia.
2. Bloco de escalas (filtros + criacao + exclusao).
3. Bloco de servicos por profissional/unidade (carregar e salvar vinculos).

## 9. Matriz de completude (requisito x status)

1. Disponibilidade real por slot de 30 min: **Concluido**.
2. Periodo antes de horario: **Concluido** (web e WhatsApp atual).
3. Servicos organizados por categoria: **Concluido** (web e WhatsApp atual).
4. Capacidade agregada por slot (N profissionais): **Concluido**.
5. Reserva com profissional especifico (opcional): **Concluido na API/web/WhatsApp inbound**.
6. Escala informada por profissional (self-service): **Concluido**.
7. Tela admin para escalas e vinculos profissional-servico: **Concluido**.
8. Seed das 3 profissionais com jornadas especificadas: **Concluido**.
9. Reset de sessao apos finalizacao por telefone: **Concluido** (nova sessao criada em nova conversa).
10. Espacamento de mensagens WhatsApp por blocos (`linha em branco`): **Concluido**.
11. Saudacao inicial parametrizavel no Admin com prefixo horario automatico: **Concluido**.
12. Saudacao final de conclusao parametrizavel no Admin: **Concluido**.

## 10. Gaps e decisoes pendentes antes de continuar

1. **Criterios de aceite E2E oficiais do ciclo**
- Definir checklist final unico para homologacao funcional (web + WhatsApp + admin + banco) antes de abrir novo ciclo estrutural.

## 11. Recomendacao de proximo passo (gestao)
Com as decisoes de produto ja aplicadas (inicio em `SERVICE`, criacao de agendamento real no bot e escolha de profissional quando houver concorrencia), o proximo passo recomendado e fechar a homologacao E2E oficial com checklist unico.

