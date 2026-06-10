# JLR Beauty Platform - One Pager Comercial

## Visao Geral
A JLR Beauty Platform e uma solucao digital integrada para operacao de beleza premium, reunindo em um unico sistema:
- Site publico com foco em conversao.
- Painel administrativo com controle operacional completo.
- Motor de agenda e relacionamento via concierge (web + WhatsApp).
- Base transacional para vendas, assinaturas, pagamentos e CRM.

## O que a plataforma faz hoje
- Jornada publica completa: Home, Franquias, Assinaturas e Checkout.
- Conversao direta em produtos, assinaturas e leads de franquia.
- Carrinho e checkout com cupom de desconto.
- Concierge com fluxo guiado de agendamento (servico, unidade, data, horario e profissional).
- Painel Admin com:
- KPI de negocio (vendas, agenda, comissoes, performance).
- CRUD de produtos, servicos, assinaturas, pedidos, pagamentos e leads.
- Gestao de clientes, usuarios, profissionais, escalas e slots.
- Controle de secoes do site por toggles (ligar/desligar sem alterar codigo).

## Estrutura da solucao
- Frontend: React/Vite (deploy estatico).
- Backend: Express + Prisma (API modular).
- Banco: MySQL (modelo de dominio consolidado).
- Integracoes: WhatsApp via Z-API.
- Seguranca: JWT, RBAC por perfil, CORS por allowlist, rate limit de login.

## Dados e inteligencia operacional
O sistema centraliza entidades de negocio em dominio unico:
- Catalogo: produtos, servicos, categorias e status.
- Receita: pedidos, itens, pagamentos, assinaturas e cupons.
- Operacao: unidades, profissionais, perfis de comissao, escalas, agendamentos e slots.
- Relacionamento: usuarios, clientes, leads de franquia, sessoes e eventos de concierge.

Isso permite visao 360 da operacao, com rastreabilidade do funil ate a entrega.

## Valor para o negocio
- Reduz fragmentacao de ferramentas e retrabalho operacional.
- Acelera atendimento e fechamento com jornada digital integrada.
- Sustenta expansao por unidade/franquia com padrao unico de gestao.
- Melhora previsibilidade de receita com assinaturas e funis monitorados.
- Mantem base pronta para crescimento com evolucao modular.

## Escalabilidade e evolucao
Capacidade atual:
- Frontend desacoplado e distribuivel em CDN.
- Backend modular por dominio, pronto para crescimento incremental.
- Banco estruturado para multiunidade e operacao concorrente.

Evolucoes planejadas para patamar enterprise:
- Rate limit distribuido (Redis).
- Scheduler dedicado para rotinas criticas.
- Upload em object storage.
- Fila para eventos/webhooks.
- Gateway de pagamento real e integracoes externas finais.

## Mensagem final
A JLR Beauty Platform ja opera como sistema integrado de conversao, operacao e relacionamento. E uma base solida para vender mais, operar melhor e escalar com controle.
