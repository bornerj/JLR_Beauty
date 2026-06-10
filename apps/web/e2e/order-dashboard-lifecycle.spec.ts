import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3001";
const require = createRequire(import.meta.url);

const readDatabaseUrl = () => {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envPath = path.resolve(process.cwd(), "../api/.env");
  if (!fs.existsSync(envPath)) return "";
  const content = fs.readFileSync(envPath, "utf8");
  const match = content.match(/DATABASE_URL\s*=\s*"?([^\n"]+)"?/i);
  return match?.[1] || "";
};

const prismaModulePath = path.resolve(process.cwd(), "../api/node_modules/@prisma/client");
const { PrismaClient, Prisma } = require(prismaModulePath);
const prisma = new PrismaClient({
  datasources: { db: { url: readDatabaseUrl() } },
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

type AuthResponse = {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
};

type ApiOrder = {
  id: number;
  status: string;
  fulfillmentStatus: string;
  shipmentTrackingCode?: string | null;
  shipmentCarrier?: string | null;
};

type ApiProduct = {
  id: number;
  stock?: number | null;
};

const getAdminAuth = async (request: typeof test.request): Promise<AuthResponse> => {
  const response = await request.post(`${API_BASE_URL}/api/auth/login`, {
    data: { identifier: "admin@jlrbeauty.com", password: "Admin@1234" },
  });
  expect(response.ok()).toBeTruthy();
  return (await response.json()) as AuthResponse;
};

const apiGet = async <T>(request: typeof test.request, token: string, routePath: string): Promise<T> => {
  const response = await request.get(`${API_BASE_URL}/api${routePath}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok()) {
    throw new Error(`GET ${routePath} failed: ${response.status()} ${await response.text()}`);
  }
  return (await response.json()) as T;
};

const apiPost = async <T>(
  request: typeof test.request,
  token: string,
  routePath: string,
  data: unknown
): Promise<T> => {
  const response = await request.post(`${API_BASE_URL}/api${routePath}`, {
    headers: { Authorization: `Bearer ${token}` },
    data,
  });
  if (!response.ok()) {
    throw new Error(`POST ${routePath} failed: ${response.status()} ${await response.text()}`);
  }
  return (await response.json()) as T;
};

const apiPatch = async <T>(
  request: typeof test.request,
  token: string,
  routePath: string,
  data: unknown
): Promise<T> => {
  const response = await request.patch(`${API_BASE_URL}/api${routePath}`, {
    headers: { Authorization: `Bearer ${token}` },
    data,
  });
  if (!response.ok()) {
    throw new Error(`PATCH ${routePath} failed: ${response.status()} ${await response.text()}`);
  }
  return (await response.json()) as T;
};

const getOrderById = async (
  request: typeof test.request,
  token: string,
  orderId: number
): Promise<ApiOrder> => {
  const orders = await apiGet<ApiOrder[]>(request, token, "/orders");
  const order = orders.find((row) => row.id === orderId);
  if (!order) throw new Error(`Order ${orderId} not found`);
  return order;
};

const getProductStockById = async (
  request: typeof test.request,
  token: string,
  productId: number
): Promise<number> => {
  const products = await apiGet<ApiProduct[]>(request, token, "/products");
  const product = products.find((row) => row.id === productId);
  if (!product) throw new Error(`Product ${productId} not found`);
  return Number(product.stock || 0);
};

test("order lifecycle e2e: pago, nao pago, cancelado stripe, despacho, entrega e estorno", async ({
  request,
}) => {
  const auth = await getAdminAuth(request);
  await prisma.user.update({
    where: { email: auth.user.email },
    data: { role: "ADMIN", status: "ATIVO" },
  });
  let createdProductId: number | null = null;
  const createdOrderIds: number[] = [];
  const createdPaymentIds: number[] = [];

  try {
    const productCategories = await apiGet<Array<{ id: number }>>(
      request,
      auth.token,
      "/product-categories"
    );
    const productStatuses = await apiGet<Array<{ id: number }>>(
      request,
      auth.token,
      "/product-statuses"
    );
    const categoryId = productCategories[0]?.id;
    const statusId = productStatuses[0]?.id;
    expect(categoryId, "product category required for E2E").toBeTruthy();
    expect(statusId, "product status required for E2E").toBeTruthy();

    const product = await apiPost<{ id: number }>(request, auth.token, "/products", {
      name: `Produto Pedido E2E ${Date.now()}`,
      price: 25,
      stock: 20,
      productCategoryId: Number(categoryId),
      productStatusId: Number(statusId),
      status: "Ativo",
    });
    createdProductId = product.id;

    const firstOrder = await apiPost<{ id: number }>(request, auth.token, "/orders", {
      items: [{ productId: product.id, quantity: 2, unitPrice: 25 }],
      total: 50,
      customerName: "Pedido E2E Fluxo 1",
      customerEmail: `pedido1.${Date.now()}@example.com`,
      customerPhone: "+55 (11) 98888-1111",
    });
    createdOrderIds.push(firstOrder.id);

    const firstPaymentIntent = await apiPost<{ paymentRecordId: number }>(
      request,
      auth.token,
      "/payments/intent",
      {
        type: "order",
        orderId: firstOrder.id,
        amount: 50,
        description: "Pagamento E2E pedido 1",
        customer: { name: "Pedido E2E Fluxo 1" },
      }
    );
    createdPaymentIds.push(firstPaymentIntent.paymentRecordId);

    const unpaidStatusBlock = await request.patch(`${API_BASE_URL}/api/orders/${firstOrder.id}`, {
      headers: { Authorization: `Bearer ${auth.token}` },
      data: { status: "ENVIADO" },
    });
    expect(unpaidStatusBlock.status()).toBe(409);

    const unpaidFulfillmentBlock = await request.patch(
      `${API_BASE_URL}/api/orders/${firstOrder.id}/fulfillment`,
      {
        headers: { Authorization: `Bearer ${auth.token}` },
        data: { fulfillmentStatus: "SEPARANDO" },
      }
    );
    expect(unpaidFulfillmentBlock.status()).toBe(409);

    await apiPatch(
      request,
      auth.token,
      `/payments/${firstPaymentIntent.paymentRecordId}`,
      { status: "APROVADO" }
    );

    const paidOrder = await getOrderById(request, auth.token, firstOrder.id);
    expect(paidOrder.status).toBe("PAGO");

    await apiPatch(request, auth.token, `/orders/${firstOrder.id}/fulfillment`, {
      fulfillmentStatus: "DESPACHADO",
      shipmentCarrier: "Correios",
      shipmentTrackingCode: "BR-E2E-001",
      fulfillmentNotes: "Despacho inicial em teste E2E",
    });
    const dispatchedOrder = await getOrderById(request, auth.token, firstOrder.id);
    expect(dispatchedOrder.fulfillmentStatus).toBe("DESPACHADO");
    expect(dispatchedOrder.shipmentCarrier).toBe("Correios");
    expect(dispatchedOrder.shipmentTrackingCode).toBe("BR-E2E-001");

    await apiPatch(request, auth.token, `/orders/${firstOrder.id}/fulfillment`, {
      fulfillmentStatus: "ENVIADO",
    });
    const shippedOrder = await getOrderById(request, auth.token, firstOrder.id);
    expect(shippedOrder.status).toBe("ENVIADO");
    expect(shippedOrder.fulfillmentStatus).toBe("ENVIADO");

    await apiPatch(request, auth.token, `/orders/${firstOrder.id}/fulfillment`, {
      fulfillmentStatus: "ENTREGUE",
    });
    const deliveredOrder = await getOrderById(request, auth.token, firstOrder.id);
    expect(deliveredOrder.status).toBe("ENTREGUE");
    expect(deliveredOrder.fulfillmentStatus).toBe("ENTREGUE");

    await apiPatch(
      request,
      auth.token,
      `/payments/${firstPaymentIntent.paymentRecordId}`,
      { status: "REEMBOLSADO" }
    );
    const refundedOrder = await getOrderById(request, auth.token, firstOrder.id);
    expect(refundedOrder.status).toBe("CANCELADO");
    expect(refundedOrder.fulfillmentStatus).toBe("CANCELADO");

    const stockBeforeSecondOrder = await getProductStockById(request, auth.token, product.id);
    const secondOrder = await apiPost<{ id: number }>(request, auth.token, "/orders", {
      items: [{ productId: product.id, quantity: 1, unitPrice: 25 }],
      total: 25,
      customerName: "Pedido E2E Fluxo 2",
      customerEmail: `pedido2.${Date.now()}@example.com`,
      customerPhone: "+55 (11) 97777-2222",
    });
    createdOrderIds.push(secondOrder.id);

    const stockAfterSecondOrder = await getProductStockById(request, auth.token, product.id);
    expect(stockAfterSecondOrder).toBe(stockBeforeSecondOrder - 1);

    const stripePayment = await prisma.payment.create({
      data: {
        provider: "STRIPE",
        providerPaymentId: `sess_e2e_${Date.now()}`,
        status: "PENDENTE",
        amount: new Prisma.Decimal(25),
        method: "CARD",
        orderId: secondOrder.id,
      },
      select: { id: true },
    });
    createdPaymentIds.push(stripePayment.id);

    const stripeCancelResponse = await request.post(
      `${API_BASE_URL}/api/public/payments/stripe/cancel-pending`,
      {
        data: { paymentRecordId: stripePayment.id },
      }
    );
    expect(stripeCancelResponse.ok()).toBeTruthy();
    const stripeCancelBody = (await stripeCancelResponse.json()) as { ok: boolean };
    expect(stripeCancelBody.ok).toBe(true);

    const cancelledStripeOrder = await getOrderById(request, auth.token, secondOrder.id);
    expect(cancelledStripeOrder.status).toBe("CANCELADO");
    expect(cancelledStripeOrder.fulfillmentStatus).toBe("CANCELADO");

    const stripePaymentAfterCancel = await prisma.payment.findUnique({
      where: { id: stripePayment.id },
      select: { status: true },
    });
    expect(stripePaymentAfterCancel?.status).toBe("CANCELADO");

    const stockAfterStripeCancel = await getProductStockById(request, auth.token, product.id);
    expect(stockAfterStripeCancel).toBe(stockBeforeSecondOrder);
  } finally {
    if (createdPaymentIds.length) {
      await prisma.payment.deleteMany({ where: { id: { in: createdPaymentIds } } });
    }
    if (createdOrderIds.length) {
      await prisma.orderStatusHistory.deleteMany({ where: { orderId: { in: createdOrderIds } } });
      await prisma.orderItem.deleteMany({ where: { orderId: { in: createdOrderIds } } });
      await prisma.appointment.deleteMany({ where: { orderId: { in: createdOrderIds } } });
      await prisma.order.deleteMany({ where: { id: { in: createdOrderIds } } });
    }
    if (createdProductId) {
      await prisma.product.deleteMany({ where: { id: createdProductId } });
    }
  }
});
