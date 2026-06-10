const parseBooleanFlag = (value: string | undefined): boolean => {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
};

const stripTrailingSlash = (value: string): string => value.replace(/\/+$/, "");

export type StripeCheckoutConfig = {
  enabled: boolean;
  secretKey: string | null;
  webhookSecret: string | null;
  successUrl: string;
  cancelUrl: string;
  currency: string;
};

const webAppBaseUrl = stripTrailingSlash(process.env.APP_WEB_URL?.trim() || "");
const DEFAULT_SUCCESS_URL = webAppBaseUrl
  ? `${webAppBaseUrl}/checkout?checkout=1&stripeSuccess=1&stripeSessionId={CHECKOUT_SESSION_ID}`
  : "";
const DEFAULT_CANCEL_URL = webAppBaseUrl ? `${webAppBaseUrl}/checkout?checkout=1&stripeCanceled=1` : "";

export const getStripeCheckoutConfig = (): StripeCheckoutConfig => {
  return {
    enabled: parseBooleanFlag(process.env.STRIPE_ENABLED),
    secretKey: process.env.STRIPE_SECRET_KEY?.trim() || null,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET?.trim() || null,
    successUrl: process.env.STRIPE_CHECKOUT_SUCCESS_URL?.trim() || DEFAULT_SUCCESS_URL,
    cancelUrl: process.env.STRIPE_CHECKOUT_CANCEL_URL?.trim() || DEFAULT_CANCEL_URL,
    currency: (process.env.STRIPE_CHECKOUT_CURRENCY || "brl").trim().toLowerCase(),
  };
};

export const assertStripeEnabled = (): StripeCheckoutConfig => {
  const config = getStripeCheckoutConfig();
  if (!config.enabled) {
    throw new Error("stripe_disabled");
  }
  if (!config.secretKey) {
    throw new Error("stripe_secret_missing");
  }
  if (!config.successUrl) {
    throw new Error("stripe_success_url_missing");
  }
  if (!config.cancelUrl) {
    throw new Error("stripe_cancel_url_missing");
  }
  return config;
};
