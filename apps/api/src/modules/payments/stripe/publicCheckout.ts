import type Stripe from "stripe";
import { getStripeClient } from "./client";
import { assertStripeEnabled, getStripeCheckoutConfig } from "./config";

export type StripeLineItemInput = {
  name: string;
  description?: string | null;
  quantity: number;
  unitAmount: number;
  imageUrl?: string | null;
};

export type CreateStripeCheckoutSessionInput = {
  lineItems: StripeLineItemInput[];
  customerEmail?: string | null;
  metadata: Record<string, string>;
  successUrl?: string | null;
  cancelUrl?: string | null;
};

const toStripeAmount = (value: number): number => Math.round(value * 100);

const sanitizeLineItems = (
  lineItems: StripeLineItemInput[],
  currency: string
): Stripe.Checkout.SessionCreateParams.LineItem[] => {
  const output: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  for (const item of lineItems) {
    const quantity = Number.isFinite(item.quantity) ? Math.floor(item.quantity) : 0;
    const unitAmount = toStripeAmount(item.unitAmount);
    if (!item.name.trim() || quantity <= 0 || unitAmount <= 0) continue;
    output.push({
      quantity,
      price_data: {
        currency,
        product_data: {
          name: item.name.trim(),
          ...(item.description?.trim() ? { description: item.description.trim() } : {}),
          ...(item.imageUrl?.trim() ? { images: [item.imageUrl.trim()] } : {}),
        },
        unit_amount: unitAmount,
      },
    });
  }
  return output;
};

export const createPublicStripeCheckoutSession = async (
  input: CreateStripeCheckoutSessionInput
): Promise<Stripe.Checkout.Session> => {
  const config = assertStripeEnabled();
  const stripe = getStripeClient();
  const lineItems = sanitizeLineItems(input.lineItems, config.currency);
  if (!lineItems.length) {
    throw new Error("stripe_line_items_invalid");
  }

  return stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: lineItems,
    success_url: input.successUrl?.trim() || config.successUrl,
    cancel_url: input.cancelUrl?.trim() || config.cancelUrl,
    customer_email: input.customerEmail?.trim() || undefined,
    metadata: input.metadata,
    billing_address_collection: "auto",
    phone_number_collection: { enabled: true },
  });
};

export const retrieveStripeCheckoutSession = async (
  sessionId: string
): Promise<Stripe.Checkout.Session> => {
  assertStripeEnabled();
  const stripe = getStripeClient();
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent"],
  });
};

export const constructStripeWebhookEvent = (payload: Buffer, signature: string): Stripe.Event => {
  const config = getStripeCheckoutConfig();
  if (!config.enabled) throw new Error("stripe_disabled");
  if (!config.secretKey) throw new Error("stripe_secret_missing");
  if (!config.webhookSecret) throw new Error("stripe_webhook_secret_missing");
  const stripe = getStripeClient();
  return stripe.webhooks.constructEvent(payload, signature, config.webhookSecret);
};
