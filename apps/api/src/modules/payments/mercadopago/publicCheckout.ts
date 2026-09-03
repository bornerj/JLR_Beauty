import crypto from "crypto";
import { Payment, Preference } from "mercadopago";
import { getMercadoPagoClient } from "./client";
import { assertMercadoPagoEnabled, getMercadoPagoCheckoutConfig } from "./config";

export type MercadoPagoLineItemInput = {
  title: string;
  description?: string | null;
  quantity: number;
  unitPrice: number;
  pictureUrl?: string | null;
};

export type CreateMercadoPagoPreferenceInput = {
  items: MercadoPagoLineItemInput[];
  payerEmail?: string | null;
  payerName?: string | null;
  externalReference: string;
};

export type MercadoPagoPreferenceResult = {
  id: string;
  initPoint: string | null;
  sandboxInitPoint: string | null;
};

const sanitizeItems = (items: MercadoPagoLineItemInput[]) => {
  const output: Array<{
    id: string;
    title: string;
    description?: string;
    quantity: number;
    unit_price: number;
    picture_url?: string;
    currency_id: string;
  }> = [];
  let index = 0;
  for (const item of items) {
    const quantity = Number.isFinite(item.quantity) ? Math.floor(item.quantity) : 0;
    const unitPrice = Number.isFinite(item.unitPrice) ? Math.round(item.unitPrice * 100) / 100 : 0;
    if (!item.title.trim() || quantity <= 0 || unitPrice <= 0) continue;
    output.push({
      id: `item-${index}`,
      title: item.title.trim(),
      ...(item.description?.trim() ? { description: item.description.trim() } : {}),
      quantity,
      unit_price: unitPrice,
      ...(item.pictureUrl?.trim() ? { picture_url: item.pictureUrl.trim() } : {}),
      currency_id: "BRL",
    });
    index += 1;
  }
  return output;
};

// PLAN-0036 (ERR pendente de registro formal): a API do Mercado Pago rejeita
// a preferencia inteira ("auto_return invalid. back_url.success must be
// defined") quando back_urls.success nao e uma URL publicamente alcancavel
// (localhost/127.0.0.1/IP privado) — mesma limitacao de dominio do
// PLAN-0019 (TLS/HTTPS). auto_return e so uma melhoria de UX (redireciona
// sozinho em vez do cliente clicar "Voltar pro site"), entao so habilitamos
// quando a URL parece pronta para producao.
const isPubliclyReachableUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host.startsWith("192.168.") || host.startsWith("10.")) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

export const createPublicMercadoPagoPreference = async (
  input: CreateMercadoPagoPreferenceInput
): Promise<MercadoPagoPreferenceResult> => {
  const config = assertMercadoPagoEnabled();
  const client = getMercadoPagoClient();
  const items = sanitizeItems(input.items);
  if (!items.length) {
    throw new Error("mercadopago_line_items_invalid");
  }

  const preference = new Preference(client);
  const response = await preference.create({
    body: {
      items,
      payer: {
        email: input.payerEmail?.trim() || undefined,
        name: input.payerName?.trim() || undefined,
      },
      back_urls: {
        success: config.successUrl,
        failure: config.failureUrl,
        pending: config.pendingUrl,
      },
      ...(isPubliclyReachableUrl(config.successUrl) ? { auto_return: "approved" as const } : {}),
      notification_url: config.notificationUrl,
      external_reference: input.externalReference,
      payment_methods: {
        installments: config.maxInstallments,
        // PLAN-0036: cartão é o método formalmente validado neste plano; os
        // demais (PIX/boleto) ficam habilitados por padrão da conta, sem
        // exclusão explícita aqui.
      },
    },
  });

  return {
    id: response.id as string,
    initPoint: response.init_point || null,
    sandboxInitPoint: response.sandbox_init_point || null,
  };
};

export type MercadoPagoPaymentLike = {
  id: string | number;
  status?: string | null;
  status_detail?: string | null;
  external_reference?: string | null;
  transaction_amount?: number | null;
  installments?: number | null;
};

export const retrieveMercadoPagoPayment = async (
  paymentId: string
): Promise<MercadoPagoPaymentLike> => {
  assertMercadoPagoEnabled();
  const client = getMercadoPagoClient();
  const payment = new Payment(client);
  const response = await payment.get({ id: paymentId });
  return response as unknown as MercadoPagoPaymentLike;
};

/**
 * PLAN-0036: diferente do Stripe (que assina o body inteiro), o Mercado Pago
 * assina um "manifest" textual derivado do id da notificacao + request-id +
 * timestamp. Ver github.com/mercadopago/sdk-nodejs discussion #318 e doc
 * oficial "Ensure the validity of notifications sent by Mercado Pago".
 */
export const verifyMercadoPagoWebhookSignature = (params: {
  signatureHeader: string;
  requestId: string;
  dataId: string;
}): boolean => {
  const config = getMercadoPagoCheckoutConfig();
  if (!config.webhookSecret) {
    throw new Error("mercadopago_webhook_secret_missing");
  }

  const parts = params.signatureHeader.split(",").reduce<Record<string, string>>((acc, part) => {
    const [key, value] = part.split("=").map((piece) => piece.trim());
    if (key && value) acc[key] = value;
    return acc;
  }, {});

  const ts = parts.ts;
  const receivedSignature = parts.v1;
  if (!ts || !receivedSignature) {
    return false;
  }

  const manifest = `id:${params.dataId};request-id:${params.requestId};ts:${ts};`;
  const expectedSignature = crypto
    .createHmac("sha256", config.webhookSecret)
    .update(manifest)
    .digest("hex");

  const expectedBuffer = Buffer.from(expectedSignature, "hex");
  const receivedBuffer = Buffer.from(receivedSignature, "hex");
  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
};
