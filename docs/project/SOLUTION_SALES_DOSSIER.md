# JLR Beauty Platform - Dossie Comercial-Tecnico

## 1) O que a solucao entrega hoje
Plataforma unificada para operacao de beauty business com tres frentes integradas:
- Experiencia publica (site institucional + conversao + franquias).
- Operacao administrativa (cadastros, agenda, vendas, KPI, CRM).
- Backend transacional com regras de negocio, autenticacao, integracoes e persistencia.

Estado atual implementado no projeto:
- Frontend React/Vite modular, com rotas publicas e painel Admin.
- Backend Express + Prisma + MySQL, com validacao e controle de acesso.
- Banco com 27 entidades de dominio e 11 enums de regra.
- API com 114 endpoints mapeados em runtime.

## 2) Funcionalidades ja operacionais

## 2.1) Jornada publica e conversao
- Home, Franquias, Assinaturas e Checkout em SPA React.
- Hero, servicos, produtos, CTA, depoimentos, rodape e chatbot concierge.
- Catalogo publico de produtos e assinaturas vindo da base de dados.
- Carrinho funcional para produtos e assinaturas.
- Checkout grande com resumo, alteracao de quantidades e aplicacao de cupom.
- Validacao publica de cupons em endpoint dedicado.
- Captura de leads de franquia.

## 2.2) Operacao Admin
- Dashboard com KPI reais (receita, agenda, vendas, comissoes, series).
- CRUD completo de produtos, servicos, assinaturas, pedidos, pagamentos, leads.
- Gestao de categorias e status separados para produtos e servicos.
- Gestao de pessoas:
- usuarios, clientes e profissionais;
- perfis de comissao e perfis de trabalho de profissionais;
- vinculo profissional-servico.
- Agenda operacional:
- agendamentos;
- escalas de profissionais;
- controle de slots;
- lista de espera.
- Console de contatos WhatsApp/concierge.
- Controle de secoes da SPA por toggles (ligar/desligar blocos sem redeploy).

## 2.3) Chatbot/Concierge (Web + WhatsApp)
- Fluxo guiado de agendamento por etapas (servico, unidade, data, horario, nome).
- Selecao de profissionais por slot quando aplicavel.
- Registro de sessoes e eventos de conversa.
- Webhook para WhatsApp via Z-API.
- Envio de resumo/confirmacao por WhatsApp.
- Retencao automatica de sessoes antigas por scheduler.

## 2.4) Seguranca e governanca
- JWT com expiracao e validacao de token no frontend e backend.
- Controle de acesso por papel (MASTER, ADMIN, MANAGER, PROFESSIONAL, CLIENT).
- Endpoints administrativos protegidos por `requireAdmin`.
- Rate limit de tentativas de login.
- CORS com allowlist explicita por origem.
- Headers basicos de hardening HTTP.

## 3) Estrutura de dados (entidades)

## 3.1) Comercio e receita
| Entidade | Papel no negocio |
|---|---|
| Product, ProductCategory, ProductStatus | Catalogo de produtos, classificacao e situacao comercial |
| Service, ServiceCategory, ServiceStatus | Catalogo de servicos e parametros operacionais |
| Membership, Subscription | Planos e assinaturas recorrentes |
| DiscountCoupon | Regras de desconto (percentual/fixo, validade, minimo) |
| Order, OrderItem, Payment | Pedido, itens e trilha de pagamento |

## 3.2) Operacao de agenda
| Entidade | Papel no negocio |
|---|---|
| Unit | Unidade fisica (enderecos e horario base) |
| Professional | Profissional vinculado a usuario e unidade |
| ProfessionalWorkProfile | Matriz de permissoes operacionais do profissional |
| ProfessionalCommissionProfile | Politica de comissao por perfil |
| ProfessionalService | Matriz N:N profissional x servico |
| ProfessionalShift | Escalas por data/horario |
| Appointment, AppointmentSlot | Agendamentos e bloqueio de slots |
| AppointmentWaitlistMessage | Fila de espera para oportunidades |

## 3.3) CRM, identidade e expansao
| Entidade | Papel no negocio |
|---|---|
| User | Identidade e autorizacao do sistema |
| Customer | Cadastro comercial de cliente |
| FranchiseLead | Funil comercial de franquias |
| Setting (`@@map("ContentEntry")`) | Configuracoes dinamicas do sistema e canais |
| ConciergeSession, ConciergeEvent | Historico operacional de conversas e agendamentos |

## 4) Relacionamentos principais do dominio
- `Order` 1:N `OrderItem`.
- `OrderItem` pode referenciar `Product` ou `Service` ou `Membership`.
- `Order` 1:N `Payment`.
- `Subscription` N:1 `Membership` e 1:N `Payment`.
- `Appointment` N:1 `Unit`, N:1 `Professional`, N:1 `Service`, opcional N:1 `Order`.
- `Professional` N:1 `Unit`, N:1 `User`, N:1 `ProfessionalWorkProfile`, N:1 `ProfessionalCommissionProfile`.
- `Professional` N:N `Service` via `ProfessionalService`.
- `ConciergeSession` opcional N:1 `Service`, opcional N:1 `Unit`, e 1:N `ConciergeEvent`.
- `Customer` opcional 1:1 `User`.

## 5) Arquitetura da solucao
- Frontend: SPA React (Vite), deploy estatico (Vercel ou Netlify).
- Backend: API Express stateless (Railway).
- Persistencia: MySQL (Railway) via Prisma ORM.
- Motor de agenda/concierge: disponibilidade, slots, escalas e reserva implementados internamente no backend (sem dependencia de agenda de terceiros para operar).
- Integracao mensageria: Z-API para WhatsApp.
- Uploads: endpoint de upload com persistencia local em disco do backend.
- Configuracao operacional: chaves em `Setting` (tabela fisica `ContentEntry` por compatibilidade).

Topologia de referencia em producao:
- Frontend em Vercel.
- API em Railway.
- MySQL em Railway.
- CORS allowlist para dominios de front.

## 6) Capacidade e escalabilidade (estado atual)

## 6.1) Forcas de escala ja presentes
- Frontend estatico desacoplado da API: escala horizontal natural em CDN.
- Backend com contratos de API modulares e separacao por dominio.
- Banco com indices em tabelas criticas de agenda e concierge.
- Dominio preparado para multiunidade e multiplos profissionais.
- Dados de catalogo, pedidos e agenda centralizados em modelo unico.

## 6.2) Pontos de atencao para escala alta
- Rate limit de login hoje em memoria de processo (nao compartilhado entre replicas).
- Scheduler de retencao roda dentro da instancia da API (risco de execucao duplicada em varias replicas).
- Upload local em disco da instancia (nao ideal para autoscaling/ephemeral filesystem).
- Pagamento ainda com `intent` mock (estrutura pronta, gateway real pendente).
- Existem endpoints placeholder para conectores de terceiros (ex.: agenda/ERP), mas a agenda operacional principal ja roda internamente no produto.

## 6.3) Caminho de evolucao para escala enterprise
- Migrar rate limit para Redis.
- Mover scheduler para worker/cron dedicado.
- Mover upload para object storage (S3/R2/GCS) + CDN.
- Introduzir fila assicrona para webhooks/notificacoes (ex.: RabbitMQ/SQS).
- Concluir integracao de gateway de pagamento real e, se necessario ao negocio, conectores ERP/agenda de terceiros.
- Adicionar monitoracao APM + metricas de banco e filas.

## 7) Valor comercial direto (mensagem de venda)
- Solucao unica para operacao e crescimento: marketing, vendas, agenda e relacionamento.
- Menor dependencia de planilhas/sistemas desconectados.
- Conversao digital com rastreabilidade operacional ate o pedido/agendamento.
- Plataforma pronta para operar rede de unidades e funil de franquias.
- Estrutura tecnica modular que permite evolucao rapida por blocos de negocio.

## 8) Limites atuais declarados (transparencia comercial)
- Integracao de pagamento ainda em modo mock operacional.
- Conectores externos de agenda/ERP (opcionais) ainda nao ativados; nao sao requisito para a agenda interna ja operacional.
- Nao ha benchmark formal de carga registrado no repositorio ate o momento.
- Escalabilidade horizontal total depende das evolucoes listadas no item 6.3.

## 9) Conclusao executiva
A solucao ja opera como plataforma integrada de commerce + agenda + concierge + admin, com base de dados estruturada e arquitetura pronta para evolucao. No estado atual, atende operacao real e crescimento controlado. Para patamar enterprise de alto volume, o caminho tecnico esta claro e incremental, sem necessidade de reescrever o produto.
