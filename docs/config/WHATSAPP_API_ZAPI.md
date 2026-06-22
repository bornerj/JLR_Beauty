# Capitulo: API WhatsApp (Z-API)

Este capitulo consolida as orientacoes operacionais de WhatsApp discutidas no ciclo de 2026-02-12, incluindo uso da Z-API, webhook e tokens/chaves.

## Objetivo
- Enviar mensagens do fluxo concierge via Z-API.
- Receber mensagens de entrada via webhook Z-API.

## Variaveis de ambiente (API)
Definir no `apps/api/.env`:

- `ZAPI_SEND_TEXT_URL` (opcional se usar URL completa).
- `ZAPI_BASE_URL` (padrao: `https://api.z-api.io`).
- `ZAPI_INSTANCE_ID` (obrigatorio se nao usar `ZAPI_SEND_TEXT_URL`).
- `ZAPI_INSTANCE_TOKEN` (obrigatorio se nao usar `ZAPI_SEND_TEXT_URL`).
- `ZAPI_CLIENT_TOKEN` (opcional; enviado no header `Client-Token`).
- `ZAPI_DEFAULT_TARGET_PHONE` (telefone padrao para envio de resumo).
- `ZAPI_WEBHOOK_SECRET` (opcional; protege webhook inbound).

## Regras de URL do send-text
A API resolve o endpoint de envio nesta ordem:

1. Se `ZAPI_SEND_TEXT_URL` existir, usa esse valor.
2. Caso contrario, monta por `ZAPI_BASE_URL + /instances/{id}/token/{token}/send-text`.
3. Se `ZAPI_BASE_URL` ja vier com `/instances/.../token/...`, apenas garante sufixo `/send-text`.

## Endpoints atuais de WhatsApp/Concierge
Base: `https://SEU_DOMINIO/api`

- `GET /public/concierge/options`
  - Carrega servicos/unidades/horarios dinamicos para o chatbot.
- `POST /public/concierge/complete`
  - Finalizacao unificada do concierge (site + fluxo omnichannel).
- `POST /public/concierge/whatsapp-summary`
  - Envio direto de resumo para WhatsApp via Z-API (compatibilidade/uso manual).
- `GET /public/webhooks/zapi`
  - Handshake/status para validacao externa (retorna `200`).
- `POST /public/webhooks/zapi`
  - Ingestao de mensagens inbound da Z-API.
  - Ignora mensagens `fromMe`.
  - Exige segredo em:
    - header `x-zapi-secret`, ou
    - query `?secret=...`
- `GET /concierge/inbox` (protegido com `requireAdmin`)
  - Consulta mensagens recebidas para observabilidade no admin.
- `GET /concierge/sessions` (protegido com `requireAdmin`)
  - Lista contatos/agendamentos do concierge com filtros para auditoria operacional.

## Token, chave e link: onde cada um entra
- `ZAPI_INSTANCE_TOKEN`: autenticacao da instancia na URL do `send-text`.
- `ZAPI_CLIENT_TOKEN`: header HTTP opcional adicional da Z-API.
- `ZAPI_WEBHOOK_SECRET`: valida chamadas inbound no webhook.
- Link do webhook no painel Z-API:
  - `https://SEU_DOMINIO/api/public/webhooks/zapi`

## Comportamento da interface (site x admin)
- Chatbot publico do site:
  - nao espelha mensagens inbound de outros clientes em tela;
  - registra/finaliza o agendamento via `POST /api/public/concierge/complete`.
- Painel admin:
  - centraliza a auditoria em `WhatsApp` com dados de contato e agendamento;
  - consome `GET /api/concierge/sessions` para listar:
    - telefone, nome, servico, unidade, data/hora agendada, data/hora de contato e status.

## Testes operacionais recomendados
1. Validar status do webhook:
   - `GET https://SEU_DOMINIO/api/public/webhooks/zapi` -> esperado `200`.
2. Testar envio direto de resumo:
   - `POST /api/public/concierge/whatsapp-summary` -> esperado `202` com `{ "success": true }`.
3. Testar webhook inbound:
   - Enviar mensagem para o numero conectado da instancia.
   - Confirmar `POST /api/public/webhooks/zapi` com `200`.
   - Confirmar leitura no `GET /api/concierge/inbox` (admin autenticado).
   - Confirmar consolidado no `GET /api/concierge/sessions` (admin autenticado).

## Utilitario de teste manual
Arquivo: `send_message.php`

Uso CLI:

```bash
php send_message.php --phone=5511999999999 --message="Teste de envio"
```

Uso HTTP:

```text
/send_message.php?phone=5511999999999&message=Teste%20de%20envio
```

O script:
- le `apps/api/.env`;
- resolve URL `send-text`;
- envia `phone` + `message`;
- aplica `Client-Token` se configurado;
- retorna sucesso/erro com status HTTP.

## Troubleshooting rapido
- `500` em endpoint local que funcionava antes:
  - reiniciar a API para recarregar `.env`.
- Z-API retorna `200`, mas com erro logico (ex.: `NOT_FOUND`):
  - revisar formato de `ZAPI_BASE_URL`/`ZAPI_SEND_TEXT_URL`;
  - confirmar que o sufixo `send-text` esta correto.
- Webhook recebe no numero da instancia em vez do remetente:
  - parser atual prioriza telefone do remetente e usa `connectedPhone` apenas como fallback.

## Seguranca
- Nunca versionar tokens/chaves no repositorio.
- Nunca expor `ZAPI_INSTANCE_TOKEN`, `ZAPI_CLIENT_TOKEN` e `ZAPI_WEBHOOK_SECRET` em logs/publico.
- Em producao, `ZAPI_WEBHOOK_SECRET` deve estar sempre definido.

## Retencao de registros
- O backend executa limpeza automatica de sessoes do concierge com status `COMPLETED`/`CANCELLED`.
- Politica padrao:
  - `CONCIERGE_RETENTION_DAYS=180`
  - `CONCIERGE_RETENTION_INTERVAL_HOURS=24`
- Ajuste por ambiente no `apps/api/.env`.
