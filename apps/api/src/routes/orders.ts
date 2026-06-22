import { Prisma, type FulfillmentStatus, type OrderStatus, type PaymentStatus } from "@prisma/client";
import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { requireAdmin, requireAuth } from "../middleware/auth";
import prisma from "../lib/prisma";
import { logger } from "../utils/logger";
import {
  withDetail,
  formatZodDetail,
  normalizeNullableText,
  asInputJsonObject,
} from "../lib/routeHelpers";
import { MSG } from "../lib/messages";
import {
  assertStripeEnabled,
  constructStripeWebhookEvent,
  createPublicStripeCheckoutSession,
  retrieveStripeCheckoutSession,
} from "../modules/payments/stripe";
import {
  toDecimalNumber,
  roundCurrency,
  calculateCouponDiscount,
  getCouponValidationError,
  normalizeCouponCode,
  readCheckoutShippingPolicy,
  calculateCheckoutShipping,
  buildOrderPublicCode,
  buildStripeCancelUrlWithContext,
  type CheckoutDeliveryMethod,
} from "../lib/currencyUtils";
import {
  getNextFulfillmentStatus,
  appendOrderStatusHistory,
  cancelOrderWithOptionalRestock,
  markOrderAsPaid,
} from "../lib/fulfillmentUtils";

const phoneSchema = z
  .string()
  .transform((value) => value.replace(/[\s()-]/g, ""))
  .refine((value) => /^\+?\d{8,15}$/.test(value), "telefone/WhatsApp inválido");

const publicDiscountCouponValidateSchema = z.object({
  code: z.string().min(1),
  subtotal: z.coerce.number().min(0),
});

const publicStripeCheckoutItemSchema = z.object({
  itemType: z.enum(["PRODUCT", "MEMBERSHIP"]),
  entityId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().min(1).max(99),
});

const publicStripeCheckoutSessionSchema = z.object({
  items: z.array(publicStripeCheckoutItemSchema).min(1),
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: phoneSchema,
  couponCode: z.string().optional(),
  deliveryMethod: z.enum(["PICKUP", "LOCAL_DELIVERY"]).default("LOCAL_DELIVERY"),
});

const publicStripeConfirmSessionQuerySchema = z.object({
  sessionId: z.string().min(1),
});

const publicStripeCancelPendingSchema = z
  .object({
    orderId: z.coerce.number().int().positive().optional(),
    paymentRecordId: z.coerce.number().int().positive().optional(),
  })
  .refine((value) => value.orderId !== undefined || value.paymentRecordId !== undefined, {
    message: "orderId ou paymentRecordId deve ser informado",
  });

const orderSchema = z.object({
  items: z
    .array(
      z
        .object({
          productId: z.coerce.number().optional(),
          membershipId: z.coerce.number().optional(),
          serviceId: z.coerce.number().optional(),
          quantity: z.coerce.number().min(1),
          unitPrice: z.coerce.number().min(0),
        })
        .refine(
          (item) => {
            const present = [item.productId, item.membershipId, item.serviceId].filter(
              (value) => value !== undefined && value !== null
            );
            return present.length === 1;
          },
          "cada item deve ter um produto, serviço ou assinatura"
        )
    )
    .min(1),
  total: z.coerce.number().min(0),
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: phoneSchema,
});

const orderUpdateSchema = z.object({
  status: z.enum(["PENDENTE", "PAGO", "ENVIADO", "ENTREGUE", "CANCELADO"]).optional(),
});

const orderFulfillmentUpdateSchema = z.object({
  fulfillmentStatus: z
    .enum(["PENDENTE", "SEPARANDO", "EMBALADO", "DESPACHADO", "ENVIADO", "ENTREGUE", "CANCELADO"])
    .optional(),
  shipmentTrackingCode: z.string().max(191).nullable().optional(),
  shipmentCarrier: z.string().max(191).nullable().optional(),
  fulfillmentNotes: z.string().max(4000).nullable().optional(),
});

const orderBulkAdvanceSchema = z.object({
  orderIds: z.array(z.coerce.number().int().positive()).min(1).max(200),
});

const paymentIntentSchema = z.object({
  type: z.enum(["order", "subscription"]),
  orderId: z.coerce.number().optional(),
  subscriptionId: z.coerce.number().optional(),
  amount: z.coerce.number().min(0),
  description: z.string().optional(),
  customer: z.custom<Prisma.InputJsonValue>().optional(),
  method: z.string().optional(),
});

const paymentUpdateSchema = z.object({
  status: z.enum(["PENDENTE", "APROVADO", "RECUSADO", "CANCELADO", "REEMBOLSADO"]).optional(),
});

type OrderInput = z.infer<typeof orderSchema>;
type OrderItemInput = OrderInput["items"][number];

type PublicStripeCheckoutItem = z.infer<typeof publicStripeCheckoutItemSchema>;

type PublicStripePricedItem = {
  itemType: "PRODUCT" | "MEMBERSHIP";
  entityId: number;
  quantity: number;
  name: string;
  unitPrice: number;
};

const ordersRouter = Router();

// --- Public discount coupons & checkout ---

ordersRouter.post("/public/discount-coupons/validate", async (req, res) => {
  const parsed = publicDiscountCouponValidateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }

  const code = normalizeCouponCode(parsed.data.code);
  const subtotal = parsed.data.subtotal;

  try {
    const coupon = await prisma.discountCoupon.findUnique({
      where: { code },
    });
    if (!coupon) {
      res.status(404).json({ message: "cupom nao encontrado" });
      return;
    }

    const validationError = getCouponValidationError(coupon, subtotal);
    if (validationError) {
      res.status(400).json({ message: validationError });
      return;
    }

    const discountValue = calculateCouponDiscount(coupon, subtotal);
    const total = roundCurrency(Math.max(0, subtotal - discountValue));

    res.json({
      coupon: {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        discountType: coupon.discountType,
        percentOff: coupon.percentOff === null ? null : toDecimalNumber(coupon.percentOff),
        amountOff: coupon.amountOff === null ? null : toDecimalNumber(coupon.amountOff),
        minSubtotal: coupon.minSubtotal === null ? null : toDecimalNumber(coupon.minSubtotal),
        startsAt: coupon.startsAt,
        endsAt: coupon.endsAt,
        isActive: coupon.isActive,
      },
      subtotal: roundCurrency(subtotal),
      discount: discountValue,
      total,
    });
  } catch (error) {
    logger.error("Falha ao validar cupom publico no checkout", { error, code, subtotal });
    res.status(500).json({
      message: MSG.SERVER_ERROR,
      ...withDetail(error instanceof Error ? error.message : "validate_public_discount_coupon_failed"),
    });
  }
});

ordersRouter.get("/public/checkout/shipping-policy", async (_req, res) => {
  try {
    const policy = await readCheckoutShippingPolicy();
    res.json({
      policy,
      deliveryMethods: [
        { code: "PICKUP", label: "Retirada no salao" },
        { code: "LOCAL_DELIVERY", label: "Entrega local" },
      ],
    });
  } catch (error) {
    logger.error("Falha ao ler politica de frete publico", { error });
    res.status(500).json({
      message: MSG.SERVER_ERROR,
      ...withDetail(error instanceof Error ? error.message : "shipping_policy_read_failed"),
    });
  }
});

ordersRouter.post("/public/payments/stripe/checkout-session", async (req, res) => {
  const parsed = publicStripeCheckoutSessionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }

  let stripeConfig;
  try {
    stripeConfig = assertStripeEnabled();
  } catch (error) {
    const detail = error instanceof Error ? error.message : "stripe_disabled";
    res.status(503).json({
      message: MSG.INVALID_PAYMENT,
      ...withDetail(detail),
    });
    return;
  }

  const payload = parsed.data;
  const productQuantities = new Map<number, number>();
  const membershipQuantities = new Map<number, number>();
  for (const item of payload.items) {
    if (item.itemType === "PRODUCT") {
      const current = productQuantities.get(item.entityId) || 0;
      productQuantities.set(item.entityId, current + item.quantity);
      continue;
    }
    const current = membershipQuantities.get(item.entityId) || 0;
    membershipQuantities.set(item.entityId, current + item.quantity);
  }

  const productIds = Array.from(productQuantities.keys());
  const membershipIds = Array.from(membershipQuantities.keys());
  const [products, memberships] = await Promise.all([
    productIds.length
      ? prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true, price: true, stock: true },
        })
      : Promise.resolve([]),
    membershipIds.length
      ? prisma.membership.findMany({
          where: { id: { in: membershipIds } },
          select: { id: true, name: true, title: true, price: true, status: true },
        })
      : Promise.resolve([]),
  ]);

  if (products.length !== productIds.length) {
    res.status(404).json({ message: MSG.PRODUCT_NOT_FOUND });
    return;
  }
  if (memberships.length !== membershipIds.length) {
    res.status(404).json({ message: MSG.MEMBERSHIP_NOT_FOUND });
    return;
  }

  const inactiveMembership = memberships.find((item) => {
    const status = (item.status || "").trim().toUpperCase();
    return status !== "ATIVO" && status !== "ACTIVE";
  });
  if (inactiveMembership) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(`assinatura inativa: ${inactiveMembership.name}`),
    });
    return;
  }

  const productById = new Map(products.map((item) => [item.id, item]));
  const membershipById = new Map(memberships.map((item) => [item.id, item]));

  const pricedItems: PublicStripePricedItem[] = [];
  for (const item of payload.items as PublicStripeCheckoutItem[]) {
    if (item.itemType === "PRODUCT") {
      const product = productById.get(item.entityId);
      if (!product) {
        res.status(404).json({ message: MSG.PRODUCT_NOT_FOUND });
        return;
      }
      pricedItems.push({
        itemType: "PRODUCT",
        entityId: product.id,
        quantity: item.quantity,
        name: product.name,
        unitPrice: toDecimalNumber(product.price),
      });
      continue;
    }

    const membership = membershipById.get(item.entityId);
    if (!membership) {
      res.status(404).json({ message: MSG.MEMBERSHIP_NOT_FOUND });
      return;
    }
    pricedItems.push({
      itemType: "MEMBERSHIP",
      entityId: membership.id,
      quantity: item.quantity,
      name: `${membership.name} - ${membership.title}`,
      unitPrice: toDecimalNumber(membership.price),
    });
  }

  const subtotal = roundCurrency(
    pricedItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0)
  );
  const shippingPolicy = await readCheckoutShippingPolicy();
  const deliveryMethod = payload.deliveryMethod as CheckoutDeliveryMethod;
  const shipping = calculateCheckoutShipping(subtotal, deliveryMethod, shippingPolicy);
  const normalizedCouponCode = payload.couponCode ? normalizeCouponCode(payload.couponCode) : null;

  let discount = 0;
  let couponId: number | null = null;
  if (normalizedCouponCode) {
    const coupon = await prisma.discountCoupon.findUnique({
      where: { code: normalizedCouponCode },
    });
    if (!coupon) {
      res.status(404).json({ message: "cupom nao encontrado" });
      return;
    }
    const validationError = getCouponValidationError(coupon, subtotal);
    if (validationError) {
      res.status(400).json({ message: validationError });
      return;
    }
    discount = calculateCouponDiscount(coupon, subtotal);
    couponId = coupon.id;
  }

  const total = roundCurrency(Math.max(0, subtotal + shipping - discount));
  if (total <= 0) {
    res.status(400).json({
      message: MSG.INVALID_ORDER,
      ...withDetail("total do pedido invalido para checkout stripe"),
    });
    return;
  }

  let createdOrder: { id: number; publicCode: string | null; total: Prisma.Decimal };
  let createdPayment: { id: number };
  try {
    const created = await prisma.$transaction(async (tx) => {
      if (productIds.length) {
        for (const productId of productIds) {
          const quantity = productQuantities.get(productId) || 0;
          const updated = await tx.product.updateMany({
            where: { id: productId, stock: { gte: quantity } },
            data: { stock: { decrement: quantity } },
          });
          if (updated.count !== 1) {
            throw new Error(`insufficient_stock_${productId}`);
          }
        }
      }

      const order = await tx.order.create({
        data: {
          publicCode: buildOrderPublicCode(),
          status: "PENDENTE",
          fulfillmentStatus: "PENDENTE",
          total: new Prisma.Decimal(total),
          customerName: payload.customerName.trim(),
          customerEmail: payload.customerEmail.trim().toLowerCase(),
          customerPhone: payload.customerPhone,
          items: {
            create: pricedItems.map((item) => ({
              productId: item.itemType === "PRODUCT" ? item.entityId : null,
              membershipId: item.itemType === "MEMBERSHIP" ? item.entityId : null,
              quantity: item.quantity,
              unitPrice: new Prisma.Decimal(item.unitPrice),
            })),
          },
        },
        select: { id: true, publicCode: true, total: true },
      });

      const payment = await tx.payment.create({
        data: {
          provider: "STRIPE",
          status: "PENDENTE",
          amount: new Prisma.Decimal(total),
          method: "CARD",
          orderId: order.id,
          rawPayload: {
            origin: "public_checkout",
            deliveryMethod,
            subtotal,
            shipping,
            discount,
            couponCode: normalizedCouponCode,
            couponId,
          },
        },
        select: { id: true },
      });

      return { order, payment };
    });
    createdOrder = created.order;
    createdPayment = created.payment;
  } catch (error) {
    const detail = error instanceof Error ? error.message : "order_create_failed";
    if (detail.startsWith("insufficient_stock_")) {
      res.status(400).json({
        message: MSG.INVALID_ORDER,
        ...withDetail("estoque insuficiente para um ou mais produtos"),
      });
      return;
    }
    logger.error("Falha ao criar pedido/pagamento para checkout stripe", { error: detail });
    res.status(500).json({
      message: MSG.SERVER_ERROR,
      ...withDetail(detail),
    });
    return;
  }

  const checkoutLineItems = [
    {
      name: `Pedido ${createdOrder.publicCode || `#${createdOrder.id}`}`,
      description: "Pagamento de compra no site JLR",
      quantity: 1,
      unitAmount: total,
    },
  ];

  let sessionId: string;
  let checkoutUrl: string;
  try {
    const session = await createPublicStripeCheckoutSession({
      lineItems: checkoutLineItems,
      customerEmail: payload.customerEmail,
      metadata: {
        orderId: String(createdOrder.id),
        paymentRecordId: String(createdPayment.id),
        publicCode: createdOrder.publicCode || "",
      },
      cancelUrl: buildStripeCancelUrlWithContext(stripeConfig.cancelUrl, {
        orderId: createdOrder.id,
        paymentRecordId: createdPayment.id,
      }),
    });
    if (!session.url) {
      throw new Error("stripe_session_without_url");
    }
    sessionId = session.id;
    checkoutUrl = session.url;
  } catch (error) {
    const detail = error instanceof Error ? error.message : "stripe_session_create_failed";
    logger.error("Falha ao criar sessao Stripe Checkout", {
      error: detail,
      orderId: createdOrder.id,
      paymentId: createdPayment.id,
    });
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: createdPayment.id },
        data: {
          status: "RECUSADO",
          rawPayload: {
            origin: "public_checkout",
            error: detail,
          },
        },
      });
      await cancelOrderWithOptionalRestock(tx, {
        orderId: createdOrder.id,
        source: "STRIPE_SESSION",
        note: "falha ao criar sessao stripe",
        forceRestock: true,
      });
    });
    res.status(502).json({
      message: MSG.INVALID_PAYMENT,
      ...withDetail("stripe_checkout_session_failed"),
    });
    return;
  }

  await prisma.payment.update({
    where: { id: createdPayment.id },
    data: {
      providerPaymentId: sessionId,
      rawPayload: {
        origin: "public_checkout",
        deliveryMethod,
        subtotal,
        shipping,
        discount,
        couponCode: normalizedCouponCode,
        couponId,
        stripeSessionId: sessionId,
      },
    },
  });

  res.status(201).json({
    sessionId,
    checkoutUrl,
    orderId: createdOrder.id,
    publicCode: createdOrder.publicCode,
    paymentRecordId: createdPayment.id,
    totals: {
      subtotal,
      shipping,
      discount,
      total,
    },
  });
});

ordersRouter.get("/public/payments/stripe/confirm-session", async (req, res) => {
  const parsed = publicStripeConfirmSessionQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }

  try {
    assertStripeEnabled();
  } catch (error) {
    const detail = error instanceof Error ? error.message : "stripe_disabled";
    res.status(503).json({
      message: MSG.INVALID_PAYMENT,
      ...withDetail(detail),
    });
    return;
  }

  const { sessionId } = parsed.data;
  let session;
  try {
    session = await retrieveStripeCheckoutSession(sessionId);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "stripe_session_not_found";
    res.status(404).json({
      message: MSG.INVALID_PAYMENT,
      ...withDetail(detail),
    });
    return;
  }

  const payment = await prisma.payment.findFirst({
    where: {
      provider: "STRIPE",
      providerPaymentId: session.id,
    },
    include: {
      order: true,
    },
  });
  if (!payment) {
    res.status(404).json({ message: MSG.PAYMENT_NOT_FOUND });
    return;
  }

  if (session.payment_status === "paid") {
    await prisma.$transaction(async (tx) => {
      const currentPayment = await tx.payment.findUnique({
        where: { id: payment.id },
        select: { id: true, status: true, orderId: true },
      });
      if (!currentPayment) return;
      if (currentPayment.status !== "APROVADO") {
        await tx.payment.update({
          where: { id: currentPayment.id },
          data: {
            status: "APROVADO",
            paidAt: new Date(),
            rawPayload: {
              stripeSessionId: session.id,
              stripePaymentIntentId:
                typeof session.payment_intent === "string"
                  ? session.payment_intent
                  : session.payment_intent?.id || null,
              confirmSource: "confirm_session",
            },
          },
        });
      }
      if (currentPayment.orderId) {
        await markOrderAsPaid(tx, {
          orderId: currentPayment.orderId,
          source: "STRIPE_CONFIRM",
          note: "pagamento confirmado por confirm-session",
        });
      }
    });
  } else if (session.status === "expired" && payment.status === "PENDENTE") {
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "CANCELADO",
        rawPayload: {
            stripeSessionId: session.id,
            confirmSource: "confirm_session",
            reason: "expired",
          },
        },
      });
      if (payment.orderId) {
        await cancelOrderWithOptionalRestock(tx, {
          orderId: payment.orderId,
          source: "STRIPE_CONFIRM",
          note: "sessao stripe expirada",
          forceRestock: true,
        });
      }
    });
  }

  const refreshed = await prisma.payment.findUnique({
    where: { id: payment.id },
    include: {
      order: true,
    },
  });
  if (!refreshed) {
    res.status(404).json({ message: MSG.PAYMENT_NOT_FOUND });
    return;
  }

  res.json({
    sessionId: session.id,
    stripeSessionStatus: session.status,
    stripePaymentStatus: session.payment_status,
    paymentStatus: refreshed.status,
    order: refreshed.order
      ? {
          id: refreshed.order.id,
          publicCode: refreshed.order.publicCode,
          status: refreshed.order.status,
          fulfillmentStatus: refreshed.order.fulfillmentStatus,
          total: toDecimalNumber(refreshed.order.total),
          paymentConfirmedAt: refreshed.order.paymentConfirmedAt,
          shipmentTrackingCode: refreshed.order.shipmentTrackingCode,
          shipmentCarrier: refreshed.order.shipmentCarrier,
          shippedAt: refreshed.order.shippedAt,
          deliveredAt: refreshed.order.deliveredAt,
        }
      : null,
  });
});

ordersRouter.post("/public/payments/stripe/cancel-pending", async (req, res) => {
  const parsed = publicStripeCancelPendingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }

  const payload = parsed.data;
  const payment = payload.paymentRecordId
    ? await prisma.payment.findUnique({
        where: { id: payload.paymentRecordId },
      })
    : await prisma.payment.findFirst({
        where: {
          orderId: payload.orderId,
          provider: "STRIPE",
        },
        orderBy: { id: "desc" },
      });

  if (!payment || payment.provider !== "STRIPE") {
    res.status(404).json({ message: MSG.PAYMENT_NOT_FOUND });
    return;
  }

  await prisma.$transaction(async (tx) => {
    const currentPayment = await tx.payment.findUnique({
      where: { id: payment.id },
      select: { id: true, status: true, orderId: true },
    });
    if (!currentPayment) return;

    if (currentPayment.status !== "APROVADO") {
      await tx.payment.update({
        where: { id: currentPayment.id },
        data: { status: "CANCELADO" },
      });
    }

    if (currentPayment.orderId) {
      await cancelOrderWithOptionalRestock(tx, {
        orderId: currentPayment.orderId,
        source: "STRIPE_CANCEL",
        note: "checkout cancelado antes da confirmacao",
        forceRestock: true,
      });
    }
  });

  res.json({ ok: true, paymentId: payment.id });
});

ordersRouter.get("/public/orders/track/:publicCode", async (req, res) => {
  const code = String(req.params.publicCode || "").trim();
  if (!code) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }

  const order = await prisma.order.findFirst({
    where: { publicCode: code },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, imageUrl: true } },
          membership: { select: { id: true, name: true, title: true } },
          service: { select: { id: true, name: true } },
        },
      },
      payments: {
        orderBy: { id: "desc" },
        select: {
          id: true,
          provider: true,
          providerPaymentId: true,
          status: true,
          amount: true,
          method: true,
          paidAt: true,
          createdAt: true,
        },
      },
    },
  });
  if (!order) {
    res.status(404).json({ message: MSG.ORDER_NOT_FOUND });
    return;
  }

  res.json({
    id: order.id,
    publicCode: order.publicCode,
    status: order.status,
    fulfillmentStatus: order.fulfillmentStatus,
    total: toDecimalNumber(order.total),
    createdAt: order.createdAt,
    paymentConfirmedAt: order.paymentConfirmedAt,
    separatedAt: order.separatedAt,
    packedAt: order.packedAt,
    dispatchedAt: order.dispatchedAt,
    shipmentTrackingCode: order.shipmentTrackingCode,
    shipmentCarrier: order.shipmentCarrier,
    shippedAt: order.shippedAt,
    deliveredAt: order.deliveredAt,
    items: order.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      unitPrice: toDecimalNumber(item.unitPrice),
      product: item.product,
      membership: item.membership,
      service: item.service,
    })),
    payments: order.payments.map((item) => ({
      ...item,
      amount: toDecimalNumber(item.amount),
    })),
  });
});

// --- Admin orders ---

ordersRouter.get("/orders", requireAdmin, async (_req, res) => {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true } },
          service: { select: { id: true, name: true } },
          membership: { select: { id: true, name: true, title: true } },
        },
      },
      payments: true,
      statusHistory: { orderBy: { createdAt: "desc" } },
    },
  });
  res.json(orders);
});

ordersRouter.get("/orders/summary", requireAdmin, async (_req, res) => {
  const orders = await prisma.order.findMany({
    select: {
      id: true,
      status: true,
      fulfillmentStatus: true,
      total: true,
      payments: {
        select: { status: true },
      },
    },
  });

  const totalOrders = orders.length;
  const inProgress = orders.filter((order) =>
    ["PENDENTE", "SEPARANDO", "EMBALADO"].includes(order.fulfillmentStatus)
  ).length;
  const dispatched = orders.filter((order) =>
    ["DESPACHADO", "ENVIADO", "ENTREGUE"].includes(order.fulfillmentStatus)
  ).length;
  const delivered = orders.filter((order) => order.fulfillmentStatus === "ENTREGUE").length;
  const cancelled = orders.filter((order) => order.status === "CANCELADO").length;
  const pendingPayment = orders.filter((order) => {
    const hasLinkedPayment = order.payments.length > 0;
    const hasApprovedPayment = order.payments.some((payment) => payment.status === "APROVADO");
    return hasLinkedPayment && !hasApprovedPayment;
  }).length;
  const confirmedRevenue = orders.reduce((acc, order) => {
    if (!["PAGO", "ENVIADO", "ENTREGUE"].includes(order.status)) return acc;
    return acc + Number(order.total);
  }, 0);

  res.json({
    totalOrders,
    inProgress,
    dispatched,
    delivered,
    cancelled,
    pendingPayment,
    confirmedRevenue,
  });
});

ordersRouter.get("/order-items", requireAdmin, async (_req, res) => {
  const orderItems = await prisma.orderItem.findMany({
    orderBy: { id: "desc" },
    include: { order: true, product: true, membership: true, service: true },
  });
  res.json(orderItems);
});

ordersRouter.post("/orders", requireAdmin, async (req, res) => {
  const parsed = orderSchema.safeParse(req.body);
  if (!parsed.success) {
    const debugHeader = req.headers["x-debug"] === "1";
    res.status(400).json({
      message: MSG.INVALID_ORDER,
      ...(debugHeader
        ? { detail: formatZodDetail(parsed.error.issues), debug: req.body }
        : withDetail(formatZodDetail(parsed.error.issues))),
    });
    return;
  }

  const { items = [], total, customerName, customerEmail, customerPhone } = parsed.data;
  const productQuantities = new Map<number, number>();
  const serviceIds = new Set<number>();
  const membershipIds = new Set<number>();
  items.forEach((item: OrderItemInput) => {
    if (item.productId) {
      const productId = Number(item.productId);
      if (Number.isFinite(productId)) {
        const current = productQuantities.get(productId) || 0;
        productQuantities.set(productId, current + Number(item.quantity || 1));
      }
    }
    if (item.serviceId) {
      const serviceId = Number(item.serviceId);
      if (Number.isFinite(serviceId)) serviceIds.add(serviceId);
    }
    if (item.membershipId) {
      const membershipId = Number(item.membershipId);
      if (Number.isFinite(membershipId)) membershipIds.add(membershipId);
    }
  });
  const productIds = Array.from(productQuantities.keys());
  const serviceIdList = Array.from(serviceIds);
  const membershipIdList = Array.from(membershipIds);
  if (productIds.length) {
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
    if (products.length !== productIds.length) {
      res.status(404).json({ message: MSG.PRODUCT_NOT_FOUND });
      return;
    }
    const insufficient = products.find(
      (product) => product.stock < (productQuantities.get(product.id) || 0)
    );
    if (insufficient) {
      const detail = `estoque insuficiente para ${insufficient.name}`;
      const debugHeader = req.headers["x-debug"] === "1";
      res.status(400).json({
        message: MSG.INVALID_ORDER,
        ...(debugHeader ? { detail } : withDetail(detail)),
      });
      return;
    }
  }
  if (serviceIdList.length) {
    const services = await prisma.service.findMany({ where: { id: { in: serviceIdList } } });
    if (services.length !== serviceIdList.length) {
      res.status(404).json({ message: MSG.SERVICE_NOT_FOUND });
      return;
    }
  }
  if (membershipIdList.length) {
    const memberships = await prisma.membership.findMany({
      where: { id: { in: membershipIdList } },
    });
    if (memberships.length !== membershipIdList.length) {
      res.status(404).json({ message: MSG.MEMBERSHIP_NOT_FOUND });
      return;
    }
  }

  const order = await prisma.$transaction(async (tx) => {
    if (productIds.length) {
      await Promise.all(
        productIds.map((productId) =>
          tx.product.update({
            where: { id: productId },
            data: { stock: { decrement: productQuantities.get(productId) || 0 } },
          })
        )
      );
    }
    return tx.order.create({
      data: {
        publicCode: buildOrderPublicCode(),
        total: new Prisma.Decimal(total || 0),
        customerName,
        customerEmail,
        customerPhone,
        items: {
          create: items.map((item: OrderItemInput) => ({
            productId: item.productId ? Number(item.productId) : null,
            membershipId: item.membershipId ? Number(item.membershipId) : null,
            serviceId: item.serviceId ? Number(item.serviceId) : null,
            quantity: Number(item.quantity || 1),
            unitPrice: new Prisma.Decimal(item.unitPrice || 0),
          })),
        },
      },
      include: { items: true },
    });
  });
  res.status(201).json(order);
});

ordersRouter.patch("/orders/bulk/advance", requireAdmin, async (req, res) => {
  const parsed = orderBulkAdvanceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }

  const orderIds = Array.from(new Set(parsed.data.orderIds));
  const orders = await prisma.order.findMany({
    where: { id: { in: orderIds } },
    include: { payments: true },
  });
  const orderById = new Map(orders.map((order) => [order.id, order]));

  const results: Array<{
    orderId: number;
    result: "UPDATED" | "SKIPPED";
    reason?: string;
    previousFulfillmentStatus?: FulfillmentStatus;
    nextFulfillmentStatus?: FulfillmentStatus;
    nextOrderStatus?: OrderStatus;
  }> = [];

  await prisma.$transaction(async (tx) => {
    for (const orderId of orderIds) {
      const existing = orderById.get(orderId);
      if (!existing) {
        results.push({ orderId, result: "SKIPPED", reason: "pedido nao encontrado" });
        continue;
      }

      if (existing.status === "CANCELADO" || existing.fulfillmentStatus === "CANCELADO") {
        results.push({ orderId, result: "SKIPPED", reason: "pedido cancelado" });
        continue;
      }

      const hasApprovedPayment = existing.payments.some((payment) => payment.status === "APROVADO");
      const hasLinkedPayment = existing.payments.length > 0;
      const requiresApprovedPayment = hasLinkedPayment && !hasApprovedPayment;
      if (requiresApprovedPayment) {
        results.push({ orderId, result: "SKIPPED", reason: MSG.ORDER_PAYMENT_REQUIRED });
        continue;
      }

      const nextFulfillmentStatus = getNextFulfillmentStatus(existing.fulfillmentStatus);
      if (!nextFulfillmentStatus) {
        results.push({
          orderId,
          result: "SKIPPED",
          reason: "pedido ja esta na etapa final",
          previousFulfillmentStatus: existing.fulfillmentStatus,
        });
        continue;
      }

      const updateData: Prisma.OrderUpdateInput = {
        fulfillmentStatus: nextFulfillmentStatus,
      };
      let nextOrderStatus: OrderStatus | undefined;
      const now = new Date();

      if (nextFulfillmentStatus === "SEPARANDO") {
        updateData.separatedAt = now;
      }
      if (nextFulfillmentStatus === "EMBALADO") {
        updateData.packedAt = now;
      }
      if (nextFulfillmentStatus === "DESPACHADO") {
        updateData.dispatchedAt = now;
      }
      if (nextFulfillmentStatus === "ENVIADO") {
        updateData.shippedAt = now;
        updateData.status = "ENVIADO";
        nextOrderStatus = "ENVIADO";
      }
      if (nextFulfillmentStatus === "ENTREGUE") {
        updateData.deliveredAt = now;
        updateData.status = "ENTREGUE";
        nextOrderStatus = "ENTREGUE";
      }

      const updated = await tx.order.update({
        where: { id: existing.id },
        data: updateData,
      });

      if (updated.status !== existing.status) {
        await appendOrderStatusHistory(tx, {
          orderId: updated.id,
          fromStatus: existing.status,
          toStatus: updated.status,
          source: "BULK",
          note: "status atualizado por operacao em lote",
        });
      }

      results.push({
        orderId,
        result: "UPDATED",
        previousFulfillmentStatus: existing.fulfillmentStatus,
        nextFulfillmentStatus,
        ...(nextOrderStatus ? { nextOrderStatus } : {}),
      });
    }
  });

  const updatedCount = results.filter((item) => item.result === "UPDATED").length;
  const skippedCount = results.length - updatedCount;
  res.json({
    totalRequested: orderIds.length,
    updatedCount,
    skippedCount,
    results,
  });
});

ordersRouter.patch("/orders/:id", requireAdmin, async (req, res) => {
  const orderId = Number(req.params.id);
  if (!Number.isFinite(orderId)) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }
  const parsed = orderUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_ORDER,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }
  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, payments: true },
  });
  if (!existing) {
    res.status(404).json({ message: MSG.ORDER_NOT_FOUND });
    return;
  }

  const nextStatus = parsed.data.status;
  const hasApprovedPayment = existing.payments.some((payment) => payment.status === "APROVADO");
  const hasLinkedPayment = existing.payments.length > 0;
  const requiresApprovedPayment = hasLinkedPayment && !hasApprovedPayment;
  const isProgressingStatus =
    nextStatus === "PAGO" || nextStatus === "ENVIADO" || nextStatus === "ENTREGUE";
  if (requiresApprovedPayment && isProgressingStatus) {
    res.status(409).json({ message: MSG.ORDER_PAYMENT_REQUIRED });
    return;
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (nextStatus === "CANCELADO") {
      await cancelOrderWithOptionalRestock(tx, {
        orderId,
        source: "ADMIN",
        note: "pedido cancelado via painel admin",
      });
      const row = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true, payments: true },
      });
      return row as NonNullable<typeof row>;
    }

    const updateData: Prisma.OrderUpdateInput = {
      status: nextStatus,
      ...(nextStatus === "PAGO" ? { paymentConfirmedAt: new Date() } : {}),
      ...(nextStatus === "ENVIADO"
        ? {
            fulfillmentStatus: "ENVIADO",
            shippedAt: new Date(),
          }
        : {}),
      ...(nextStatus === "ENTREGUE"
        ? {
            fulfillmentStatus: "ENTREGUE",
            deliveredAt: new Date(),
          }
        : {}),
      ...(nextStatus === "PENDENTE" ? { fulfillmentStatus: "PENDENTE" } : {}),
    };

    const row = await tx.order.update({
      where: { id: orderId },
      data: updateData,
      include: { items: true, payments: true },
    });

    if (nextStatus && nextStatus !== existing.status) {
      await appendOrderStatusHistory(tx, {
        orderId,
        fromStatus: existing.status,
        toStatus: nextStatus,
        source: "ADMIN",
        note: "status alterado pelo painel admin",
      });
    }
    return row;
  });
  res.json(updated);
});

ordersRouter.patch("/orders/:id/fulfillment", requireAdmin, async (req, res) => {
  const orderId = Number(req.params.id);
  if (!Number.isFinite(orderId)) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }

  const parsed = orderFulfillmentUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYLOAD,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }

  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, payments: true },
  });
  if (!existing) {
    res.status(404).json({ message: MSG.ORDER_NOT_FOUND });
    return;
  }

  const payload = parsed.data;
  const nextFulfillmentStatus = payload.fulfillmentStatus;
  const hasApprovedPayment = existing.payments.some((payment) => payment.status === "APROVADO");
  const hasLinkedPayment = existing.payments.length > 0;
  const requiresApprovedPayment = hasLinkedPayment && !hasApprovedPayment;
  const isProgressingFulfillment =
    nextFulfillmentStatus === "SEPARANDO" ||
    nextFulfillmentStatus === "EMBALADO" ||
    nextFulfillmentStatus === "DESPACHADO" ||
    nextFulfillmentStatus === "ENVIADO" ||
    nextFulfillmentStatus === "ENTREGUE";
  if (requiresApprovedPayment && isProgressingFulfillment) {
    res.status(409).json({ message: MSG.ORDER_PAYMENT_REQUIRED });
    return;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updateData: Prisma.OrderUpdateInput = {
      fulfillmentStatus: nextFulfillmentStatus,
      shipmentTrackingCode: normalizeNullableText(payload.shipmentTrackingCode),
      shipmentCarrier: normalizeNullableText(payload.shipmentCarrier),
      fulfillmentNotes: normalizeNullableText(payload.fulfillmentNotes),
    };

    if (nextFulfillmentStatus === "SEPARANDO") {
      updateData.separatedAt = new Date();
    }
    if (nextFulfillmentStatus === "EMBALADO") {
      updateData.packedAt = new Date();
    }
    if (nextFulfillmentStatus === "DESPACHADO") {
      updateData.dispatchedAt = new Date();
    }
    if (nextFulfillmentStatus === "ENVIADO") {
      updateData.shippedAt = new Date();
      updateData.status = "ENVIADO";
    }
    if (nextFulfillmentStatus === "ENTREGUE") {
      updateData.deliveredAt = new Date();
      updateData.status = "ENTREGUE";
    }
    if (nextFulfillmentStatus === "CANCELADO") {
      updateData.status = "CANCELADO";
    }

    const row = await tx.order.update({
      where: { id: orderId },
      data: updateData,
      include: { items: true, payments: true },
    });

    if (row.status !== existing.status) {
      await appendOrderStatusHistory(tx, {
        orderId: row.id,
        fromStatus: existing.status,
        toStatus: row.status,
        source: "FULFILLMENT",
        note: "status atualizado pelo fluxo de fulfillment",
      });
    }

    return row;
  });

  res.json(updated);
});

// --- Admin payments ---

ordersRouter.get("/payments", requireAdmin, async (_req, res) => {
  const payments = await prisma.payment.findMany({
    orderBy: { id: "desc" },
    include: { order: true, subscription: true },
  });
  res.json(payments);
});

ordersRouter.patch("/payments/:id", requireAdmin, async (req, res) => {
  const paymentId = Number(req.params.id);
  if (!Number.isFinite(paymentId)) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }
  const parsed = paymentUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYMENT,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }
  const status = parsed.data.status;
  try {
    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.payment.findUnique({
        where: { id: paymentId },
        select: { id: true, status: true, orderId: true, subscriptionId: true },
      });
      if (!current) {
        throw new Error("payment_not_found");
      }

      const nextStatus: PaymentStatus = status || current.status;
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: nextStatus,
          paidAt:
            nextStatus === "APROVADO"
              ? new Date()
              : nextStatus === "REEMBOLSADO"
              ? new Date()
              : undefined,
        },
      });

      if (nextStatus === "APROVADO") {
        if (current.orderId) {
          await markOrderAsPaid(tx, {
            orderId: current.orderId,
            source: "ADMIN_PAYMENT",
            note: "pagamento aprovado manualmente",
          });
        }
        if (current.subscriptionId) {
          await tx.subscription.update({
            where: { id: current.subscriptionId },
            data: { status: "ATIVA" },
          });
        }
      }

      if (nextStatus === "CANCELADO" || nextStatus === "REEMBOLSADO") {
        if (current.orderId) {
          await cancelOrderWithOptionalRestock(tx, {
            orderId: current.orderId,
            source: "ADMIN_PAYMENT",
            note: nextStatus === "REEMBOLSADO" ? "pagamento estornado" : "pagamento cancelado",
          });
        }
        if (current.subscriptionId) {
          await tx.subscription.update({
            where: { id: current.subscriptionId },
            data: { status: "CANCELADA" },
          });
        }
      }

      const row = await tx.payment.findUnique({
        where: { id: paymentId },
        include: { order: true, subscription: true },
      });
      return row as NonNullable<typeof row>;
    });
    res.json(updated);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "payment_update_failed";
    if (detail === "payment_not_found") {
      res.status(404).json({ message: MSG.PAYMENT_NOT_FOUND });
      return;
    }
    logger.error("Falha ao atualizar pagamento", { paymentId, error: detail });
    res.status(500).json({
      message: MSG.SERVER_ERROR,
      ...withDetail(detail),
    });
  }
});

ordersRouter.post("/payments/intent", requireAuth, async (req, res) => {
  const parsed = paymentIntentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: MSG.INVALID_PAYMENT,
      ...withDetail(formatZodDetail(parsed.error.issues)),
    });
    return;
  }
  const { type, orderId, subscriptionId, amount, description, customer, method } = parsed.data;
  const rawPayload: Prisma.InputJsonObject = {
    type,
    ...(description !== undefined ? { description } : {}),
    ...(customer !== undefined ? { customer } : {}),
  };
  if (type === "order" && !orderId) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }
  if (type === "subscription" && !subscriptionId) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD });
    return;
  }
  if (type === "order") {
    const orderExists = await prisma.order.findUnique({ where: { id: Number(orderId) } });
    if (!orderExists) {
      res.status(404).json({ message: MSG.ORDER_NOT_FOUND });
      return;
    }
  }
  if (type === "subscription") {
    const subExists = await prisma.subscription.findUnique({
      where: { id: Number(subscriptionId) },
    });
    if (!subExists) {
      res.status(404).json({ message: MSG.SUBSCRIPTION_NOT_FOUND });
      return;
    }
  }

  const paymentId = `mock_${Date.now()}`;
  const payment = await prisma.payment.create({
    data: {
      provider: "MOCK",
      providerPaymentId: paymentId,
      status: "PENDENTE",
          amount: new Prisma.Decimal(amount || 0),
      method: method || null,
      orderId: type === "order" ? Number(orderId) : null,
      subscriptionId: type === "subscription" ? Number(subscriptionId) : null,
      rawPayload,
    },
  });

  res.json({
    paymentId,
    paymentRecordId: payment.id,
    status: payment.status.toLowerCase(),
    initPoint: "https://www.mercadopago.com.br",
    type,
    orderId,
    subscriptionId,
    amount,
    description,
    customer,
  });
});

// --- Stripe webhook handler (exported for use in app.ts) ---

type StripeCheckoutSessionLike = {
  id: string;
  status?: string | null;
  payment_status?: string | null;
  payment_intent?: string | { id: string } | null;
};

const syncStripeCheckoutSessionPayment = async (
  session: StripeCheckoutSessionLike,
  params: {
    mode: "approve" | "cancel";
    source: string;
    eventType: string;
    eventId: string;
  }
): Promise<void> => {
  const payment = await prisma.payment.findFirst({
    where: {
      provider: "STRIPE",
      providerPaymentId: session.id,
    },
    select: { id: true, orderId: true },
  });
  if (!payment) return;

  await prisma.$transaction(async (tx) => {
    const current = await tx.payment.findUnique({
      where: { id: payment.id },
      select: { id: true, status: true, orderId: true, rawPayload: true },
    });
    if (!current) return;

    const basePayload = asInputJsonObject(current.rawPayload);
    const stripePaymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id || null;

    if (params.mode === "approve" || session.payment_status === "paid") {
      if (current.status !== "APROVADO") {
        await tx.payment.update({
          where: { id: current.id },
          data: {
            status: "APROVADO",
            paidAt: new Date(),
            rawPayload: {
              ...basePayload,
              stripeSessionId: session.id,
              stripePaymentIntentId,
              webhookEventId: params.eventId,
              webhookEventType: params.eventType,
              webhookSource: params.source,
            },
          },
        });
      }
      if (current.orderId) {
        await markOrderAsPaid(tx, {
          orderId: current.orderId,
          source: params.source,
          note: `pagamento aprovado via ${params.eventType}`,
        });
      }
      return;
    }

    if (current.status === "APROVADO") {
      return;
    }

    await tx.payment.update({
      where: { id: current.id },
      data: {
        status: "CANCELADO",
        rawPayload: {
          ...basePayload,
          stripeSessionId: session.id,
          stripePaymentIntentId,
          webhookEventId: params.eventId,
          webhookEventType: params.eventType,
          webhookSource: params.source,
        },
      },
    });
    if (current.orderId) {
      await cancelOrderWithOptionalRestock(tx, {
        orderId: current.orderId,
        source: params.source,
        note: `pagamento cancelado via ${params.eventType}`,
        forceRestock: true,
      });
    }
  });
};

function sanitizeStripeEvent(event: unknown): Record<string, unknown> {
  if (!event || typeof event !== "object") return {};
  const e = event as Record<string, unknown>;

  const sanitized: Record<string, unknown> = {
    id: e.id,
    object: e.object,
    type: e.type,
    livemode: e.livemode,
    created: e.created,
    api_version: e.api_version,
  };

  const data = e.data as Record<string, unknown> | undefined;
  if (data && typeof data === "object") {
    const obj = data.object as Record<string, unknown> | undefined;
    if (obj && typeof obj === "object") {
      sanitized.data = {
        object: {
          id: obj.id,
          object: obj.object,
          amount_total: obj.amount_total,
          amount_subtotal: obj.amount_subtotal,
          currency: obj.currency,
          payment_status: obj.payment_status,
          status: obj.status,
          mode: obj.mode,
          payment_intent:
            typeof obj.payment_intent === "string"
              ? obj.payment_intent
              : obj.payment_intent !== null &&
                typeof obj.payment_intent === "object"
              ? (obj.payment_intent as Record<string, unknown>).id
              : null,
        },
      };
    }
  }

  return sanitized;
}

export const handleStripeWebhook = async (req: Request, res: Response): Promise<void> => {
  const signatureHeader = req.headers["stripe-signature"];
  if (typeof signatureHeader !== "string" || !signatureHeader.trim()) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD, ...withDetail("missing_stripe_signature") });
    return;
  }
  const rawBody =
    req.body instanceof Buffer
      ? req.body
      : Buffer.from(typeof req.body === "string" ? req.body : "");

  let event;
  try {
    event = constructStripeWebhookEvent(rawBody, signatureHeader);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "stripe_signature_invalid";
    logger.warn("Webhook Stripe rejeitado por assinatura/payload invalido", { detail });
    res.status(400).json({ message: MSG.INVALID_PAYLOAD, ...withDetail(detail) });
    return;
  }

  const alreadyProcessed = await prisma.stripeWebhookEvent.findUnique({
    where: { eventId: event.id },
    select: { id: true },
  });
  if (alreadyProcessed) {
    res.status(200).json({ received: true, duplicate: true });
    return;
  }

  try {
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object as unknown as StripeCheckoutSessionLike;
      await syncStripeCheckoutSessionPayment(session, {
        mode: "approve",
        source: "STRIPE_WEBHOOK",
        eventType: event.type,
        eventId: event.id,
      });
    } else if (
      event.type === "checkout.session.expired" ||
      event.type === "checkout.session.async_payment_failed"
    ) {
      const session = event.data.object as unknown as StripeCheckoutSessionLike;
      await syncStripeCheckoutSessionPayment(session, {
        mode: "cancel",
        source: "STRIPE_WEBHOOK",
        eventType: event.type,
        eventId: event.id,
      });
    }

    await prisma.stripeWebhookEvent.create({
      data: {
        eventId: event.id,
        eventType: event.type,
        livemode: Boolean(event.livemode),
        status: "PROCESSED",
        payload: sanitizeStripeEvent(event) as Prisma.InputJsonValue,
        processedAt: new Date(),
      },
    });

    res.status(200).json({ received: true });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "stripe_webhook_process_failed";
    logger.error("Falha ao processar webhook Stripe", {
      eventId: event.id,
      eventType: event.type,
      error: detail,
    });
    await prisma.stripeWebhookEvent
      .create({
        data: {
          eventId: event.id,
          eventType: event.type,
          livemode: Boolean(event.livemode),
          status: "FAILED",
          errorMessage: detail,
          payload: sanitizeStripeEvent(event) as Prisma.InputJsonValue,
          processedAt: new Date(),
        },
      })
      .catch(() => undefined);
    res.status(500).json({ message: MSG.SERVER_ERROR });
  }
};

export { ordersRouter };
