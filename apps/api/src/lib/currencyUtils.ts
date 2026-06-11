import { type Prisma } from "@prisma/client";
import { parseOptionalDate } from "./routeHelpers";
import prisma from "./prisma";

export const toDecimalNumber = (value: Prisma.Decimal | null | undefined): number =>
  value === null || value === undefined ? 0 : Number(value.toString());

export const roundCurrency = (value: number): number => Math.round(value * 100) / 100;

export const parseDateFieldInput = (
  rawValue: string | null | undefined
): { value: Date | null | undefined; invalid: boolean } => {
  if (rawValue === undefined) return { value: undefined, invalid: false };
  const normalized = rawValue === null ? null : rawValue.trim();
  const parsed = parseOptionalDate(normalized);
  const hasText = typeof rawValue === "string" && rawValue.trim() !== "";
  if (hasText && parsed === undefined) {
    return { value: undefined, invalid: true };
  }
  return { value: parsed, invalid: false };
};

export const validateDiscountCouponRules = (
  payload: {
    discountType: string;
    percentOff?: number;
    amountOff?: number;
    startsAt?: Date | null;
    endsAt?: Date | null;
  },
  isPartial = false
): string | null => {
  const percentOff = payload.percentOff;
  const amountOff = payload.amountOff;

  if (payload.discountType === "PERCENT") {
    if ((percentOff === undefined || percentOff <= 0) && !isPartial) {
      return "percentual de desconto obrigatorio para tipo percentual";
    }
    if (amountOff !== undefined && amountOff > 0) {
      return "valor fixo nao pode ser informado para cupom percentual";
    }
  }

  if (payload.discountType === "FIXED") {
    if ((amountOff === undefined || amountOff <= 0) && !isPartial) {
      return "valor de desconto obrigatorio para tipo fixo";
    }
    if (percentOff !== undefined && percentOff > 0) {
      return "percentual nao pode ser informado para cupom de valor fixo";
    }
  }

  if (payload.startsAt && payload.endsAt && payload.endsAt < payload.startsAt) {
    return "fim de validade deve ser maior ou igual ao inicio";
  }

  return null;
};

export const calculateCouponDiscount = (
  coupon: {
    discountType: string;
    percentOff: Prisma.Decimal | null;
    amountOff: Prisma.Decimal | null;
    minSubtotal: Prisma.Decimal | null;
  },
  subtotal: number
): number => {
  if (subtotal <= 0) return 0;
  const minSubtotal = toDecimalNumber(coupon.minSubtotal);
  if (minSubtotal > 0 && subtotal < minSubtotal) return 0;

  if (coupon.discountType === "PERCENT") {
    const percentOff = toDecimalNumber(coupon.percentOff);
    if (percentOff <= 0) return 0;
    return roundCurrency(Math.min(subtotal, (subtotal * percentOff) / 100));
  }

  if (coupon.discountType === "FIXED") {
    const amountOff = toDecimalNumber(coupon.amountOff);
    if (amountOff <= 0) return 0;
    return roundCurrency(Math.min(subtotal, amountOff));
  }

  return 0;
};

export const getCouponValidationError = (
  coupon: {
    isActive: boolean;
    startsAt: Date | null;
    endsAt: Date | null;
    minSubtotal: Prisma.Decimal | null;
  },
  subtotal: number
): string | null => {
  if (!coupon.isActive) return "cupom inativo";
  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) return "cupom ainda fora da validade";
  if (coupon.endsAt && coupon.endsAt < now) return "cupom expirado";
  const minSubtotal = toDecimalNumber(coupon.minSubtotal);
  if (minSubtotal > 0 && subtotal < minSubtotal) {
    return `subtotal minimo para este cupom: R$ ${minSubtotal.toFixed(2)}`;
  }
  return null;
};

export const CHECKOUT_LOCAL_DELIVERY_FEE_SETTING_KEY = "checkout.localDeliveryFee";
export const CHECKOUT_FREE_SHIPPING_THRESHOLD_SETTING_KEY = "checkout.freeShippingThreshold";
export const DEFAULT_LOCAL_DELIVERY_FEE = 10;
export const DEFAULT_FREE_SHIPPING_THRESHOLD = 150;

export type CheckoutDeliveryMethod = "PICKUP" | "LOCAL_DELIVERY";

export type CheckoutShippingPolicy = {
  localDeliveryFee: number;
  freeShippingThreshold: number;
};

export const sanitizeNonNegative = (value: number, fallback: number): number => {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(0, roundCurrency(value));
};

export const parseNumericSettingValue = (rawValue: Prisma.JsonValue | null | undefined): number | null => {
  if (typeof rawValue === "number" && Number.isFinite(rawValue)) return rawValue;
  if (typeof rawValue === "string") {
    const parsed = Number(rawValue);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (rawValue && typeof rawValue === "object" && !Array.isArray(rawValue)) {
    const candidate = (rawValue as Record<string, unknown>).value;
    if (typeof candidate === "number" && Number.isFinite(candidate)) return candidate;
    if (typeof candidate === "string") {
      const parsed = Number(candidate);
      return Number.isFinite(parsed) ? parsed : null;
    }
  }
  return null;
};

export const readCheckoutShippingPolicy = async (): Promise<CheckoutShippingPolicy> => {
  const entries = await prisma.setting.findMany({
    where: {
      key: {
        in: [CHECKOUT_LOCAL_DELIVERY_FEE_SETTING_KEY, CHECKOUT_FREE_SHIPPING_THRESHOLD_SETTING_KEY],
      },
    },
    select: { key: true, value: true },
  });

  const localDeliveryFeeRaw = entries.find(
    (entry) => entry.key === CHECKOUT_LOCAL_DELIVERY_FEE_SETTING_KEY
  )?.value;
  const freeThresholdRaw = entries.find(
    (entry) => entry.key === CHECKOUT_FREE_SHIPPING_THRESHOLD_SETTING_KEY
  )?.value;

  const localDeliveryFee = sanitizeNonNegative(
    parseNumericSettingValue(localDeliveryFeeRaw) ?? DEFAULT_LOCAL_DELIVERY_FEE,
    DEFAULT_LOCAL_DELIVERY_FEE
  );
  const freeShippingThreshold = sanitizeNonNegative(
    parseNumericSettingValue(freeThresholdRaw) ?? DEFAULT_FREE_SHIPPING_THRESHOLD,
    DEFAULT_FREE_SHIPPING_THRESHOLD
  );

  return { localDeliveryFee, freeShippingThreshold };
};

export const calculateCheckoutShipping = (
  subtotal: number,
  deliveryMethod: CheckoutDeliveryMethod,
  policy: CheckoutShippingPolicy
): number => {
  if (subtotal <= 0) return 0;
  if (deliveryMethod === "PICKUP") return 0;
  if (subtotal >= policy.freeShippingThreshold) return 0;
  return policy.localDeliveryFee;
};

export const buildOrderPublicCode = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.floor(Math.random() * 1679616)
    .toString(36)
    .toUpperCase()
    .padStart(4, "0");
  return `PV-${timestamp}-${random}`;
};

export const normalizeCouponCode = (value: string): string => value.trim().toUpperCase();

export const buildStripeCancelUrlWithContext = (
  baseUrl: string,
  params: { orderId: number; paymentRecordId: number }
): string => {
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}orderId=${params.orderId}&paymentRecordId=${params.paymentRecordId}`;
};
