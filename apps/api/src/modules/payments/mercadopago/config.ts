const parseBooleanFlag = (value: string | undefined): boolean => {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
};

const stripTrailingSlash = (value: string): string => value.replace(/\/+$/, "");

export type MercadoPagoCheckoutConfig = {
  enabled: boolean;
  accessToken: string | null;
  webhookSecret: string | null;
  successUrl: string;
  failureUrl: string;
  pendingUrl: string;
  notificationUrl: string;
  maxInstallments: number;
};

const webAppBaseUrl = stripTrailingSlash(process.env.APP_WEB_URL?.trim() || "");
const apiBaseUrl = stripTrailingSlash(process.env.APP_API_URL?.trim() || "");

// PLAN-0036: Checkout Pro exige 3 back_urls (o Stripe usava só success/cancel).
// O proprio Mercado Pago anexa payment_id/status/external_reference na volta.
const DEFAULT_SUCCESS_URL = webAppBaseUrl
  ? `${webAppBaseUrl}/checkout?checkout=1&mpStatus=success`
  : "";
const DEFAULT_FAILURE_URL = webAppBaseUrl
  ? `${webAppBaseUrl}/checkout?checkout=1&mpStatus=failure`
  : "";
const DEFAULT_PENDING_URL = webAppBaseUrl
  ? `${webAppBaseUrl}/checkout?checkout=1&mpStatus=pending`
  : "";
const DEFAULT_NOTIFICATION_URL = apiBaseUrl
  ? `${apiBaseUrl}/api/public/payments/mercadopago/webhook`
  : "";

const parseMaxInstallments = (value: string | undefined): number => {
  const parsed = Number.parseInt(value || "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 12;
  return Math.min(parsed, 24);
};

export const getMercadoPagoCheckoutConfig = (): MercadoPagoCheckoutConfig => {
  return {
    enabled: parseBooleanFlag(process.env.MERCADOPAGO_ENABLED),
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN?.trim() || null,
    webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim() || null,
    successUrl: process.env.MERCADOPAGO_CHECKOUT_SUCCESS_URL?.trim() || DEFAULT_SUCCESS_URL,
    failureUrl: process.env.MERCADOPAGO_CHECKOUT_FAILURE_URL?.trim() || DEFAULT_FAILURE_URL,
    pendingUrl: process.env.MERCADOPAGO_CHECKOUT_PENDING_URL?.trim() || DEFAULT_PENDING_URL,
    notificationUrl: process.env.MERCADOPAGO_NOTIFICATION_URL?.trim() || DEFAULT_NOTIFICATION_URL,
    maxInstallments: parseMaxInstallments(process.env.MERCADOPAGO_MAX_INSTALLMENTS),
  };
};

export const assertMercadoPagoEnabled = (): MercadoPagoCheckoutConfig => {
  const config = getMercadoPagoCheckoutConfig();
  if (!config.enabled) {
    throw new Error("mercadopago_disabled");
  }
  if (!config.accessToken) {
    throw new Error("mercadopago_access_token_missing");
  }
  if (!config.successUrl || !config.failureUrl || !config.pendingUrl) {
    throw new Error("mercadopago_back_urls_missing");
  }
  if (!config.notificationUrl) {
    throw new Error("mercadopago_notification_url_missing");
  }
  return config;
};
