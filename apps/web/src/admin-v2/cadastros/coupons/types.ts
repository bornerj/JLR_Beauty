/**
 * Admin V2 (PLAN-0026, Onda 4) — tipos de Cupons de Desconto, espelhando
 * `DiscountCoupon` (`schema.prisma`) e `discountCouponSchema`/`discountCouponUpdateSchema`
 * (`apps/api/src/routes/admin.ts`). `percentOff`/`amountOff`/`minSubtotal` voltam do backend
 * como `string | null` (`Prisma.Decimal.toJSON()`), mesmo achado da Onda 1 (`Membership.price`).
 */

export type DiscountType = "PERCENT" | "FIXED";

export type DiscountCoupon = {
  id: number;
  code: string;
  name: string;
  discountType: DiscountType;
  percentOff: string | null;
  amountOff: string | null;
  minSubtotal: string | null;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DiscountCouponInput = {
  code: string;
  name: string;
  discountType: DiscountType;
  percentOff?: number | null;
  amountOff?: number | null;
  minSubtotal?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  isActive?: boolean;
};
