# Integrations

This document defines active third-party integration contracts.
Backend stack target: Express + Prisma + PostgreSQL (Docker), serving the React/Vite frontend via nginx.

## WhatsApp (Z-API + ngrok)
- Full operational chapter: `docs/config/WHATSAPP_API_ZAPI_NGROK.md`
- Scope:
  - Z-API send-text integration
  - webhook inbound processing
  - ngrok tunnel for local webhook testing
  - environment keys/tokens and endpoint map

## Payments (Stripe Checkout)
- Full operational chapter: `docs/config/STRIPE_TEST_RUNBOOK.md`
- Deploy/environment reference: `docs/config/DEPLOY_ENV_REFERENCE.md`
- Scope:
  - Stripe Checkout session creation from public checkout flow
  - session confirmation and pending payment cancellation
  - webhook event validation/signature and idempotent processing
  - order/payment status synchronization in database
- Public/API endpoints:
  - `POST /api/public/payments/stripe/checkout-session`
  - `GET /api/public/payments/stripe/confirm-session`
  - `POST /api/public/payments/stripe/cancel-pending`
  - `POST /api/public/payments/stripe/webhook`
- Required environment keys (API):
  - `STRIPE_ENABLED`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `APP_WEB_URL`
  - `APP_API_URL`
  - `CORS_ORIGIN`

