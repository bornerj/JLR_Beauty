# Deploy Env Reference (Vercel + Railway)

## Objetivo
Guardar em um lugar unico quais dominios estao em uso e onde configurar variaveis de ambiente para evitar erro quando houver troca de provedor no futuro.

## Ambiente atual (producao)
- Frontend: `https://jlrbeauty.vercel.app`
- Backend API: `https://jlraistudio-production.up.railway.app`

Data de referencia: 2026-03-02.

## Onde configurar

### 1) Railway (servico da API)
Configurar no painel do Railway, no servico da API:

```env
APP_API_URL=https://jlraistudio-production.up.railway.app
APP_WEB_URL=https://jlrbeauty.vercel.app
CORS_ORIGIN=https://jlrbeauty.vercel.app

STRIPE_ENABLED=true
STRIPE_SECRET_KEY=<<definir_no_painel>>
STRIPE_WEBHOOK_SECRET=<<definir_no_painel>>
STRIPE_CHECKOUT_SUCCESS_URL=
STRIPE_CHECKOUT_CANCEL_URL=
STRIPE_CHECKOUT_CURRENCY=brl
```

Notas:
- `STRIPE_CHECKOUT_SUCCESS_URL` e `STRIPE_CHECKOUT_CANCEL_URL` podem ficar vazias se `APP_WEB_URL` estiver correta.
- Nao commitar secrets no repositorio.

### 2) Vercel (projeto frontend)
Configurar no painel do Vercel, em Environment Variables:

```env
VITE_WEB_URL=https://jlrbeauty.vercel.app
VITE_API_URL=https://jlraistudio-production.up.railway.app
```

### 3) Stripe Dashboard (webhook)
No Stripe, endpoint de webhook:

```txt
https://jlraistudio-production.up.railway.app/api/public/payments/stripe/webhook
```

## Checklist quando trocar de provedor
1. Atualizar dominio novo no Railway (`APP_WEB_URL`, `APP_API_URL`, `CORS_ORIGIN`).
2. Atualizar dominio novo no Vercel (`VITE_WEB_URL`, `VITE_API_URL`) ou no novo provedor frontend.
3. Atualizar webhook no Stripe para a nova URL da API.
4. Fazer redeploy de API e frontend.
5. Validar checkout Stripe (sucesso e cancelamento) com cartao de teste.

