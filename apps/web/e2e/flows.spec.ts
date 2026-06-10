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

const prismaModulePath = path.resolve(
  process.cwd(),
  "../api/node_modules/@prisma/client"
);
const { PrismaClient } = require(prismaModulePath);
const prisma = new PrismaClient({
  datasources: { db: { url: readDatabaseUrl() } },
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

async function getAdminAuth(request: typeof test.request) {
  const response = await request.post(`${API_BASE_URL}/api/auth/login`, {
    data: { identifier: "admin@jlrbeauty.com", password: "Admin@1234" },
  });
  if (!response.ok()) {
    throw new Error(`Login failed: ${response.status()}`);
  }
  const data = (await response.json()) as { token: string; user: unknown };
  if (!data?.token) {
    throw new Error("Token missing from login response.");
  }
  return data;
}

async function apiGet<T>(request: typeof test.request, token: string, path: string) {
  const response = await request.get(`${API_BASE_URL}/api${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok()) {
    throw new Error(`GET ${path} failed: ${response.status()}`);
  }
  return (await response.json()) as T;
}

async function apiPost<T>(
  request: typeof test.request,
  token: string,
  path: string,
  data: unknown
) {
  const response = await request.post(`${API_BASE_URL}/api${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    data,
  });
  if (!response.ok()) {
    const detail = await response.text();
    throw new Error(`POST ${path} failed: ${response.status()} ${detail}`);
  }
  return (await response.json()) as T;
}

async function apiPatch<T>(
  request: typeof test.request,
  token: string,
  path: string,
  data: unknown
) {
  const response = await request.patch(`${API_BASE_URL}/api${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    data,
  });
  if (!response.ok()) {
    const detail = await response.text();
    throw new Error(`PATCH ${path} failed: ${response.status()} ${detail}`);
  }
  return (await response.json()) as T;
}

async function apiDelete(request: typeof test.request, token: string, path: string) {
  const response = await request.delete(`${API_BASE_URL}/api${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok()) {
    throw new Error(`DELETE ${path} failed: ${response.status()}`);
  }
}

test.describe("Public flows", () => {
  test("home cart and checkout flow", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".top-nav")).toBeVisible();

    await page.click("#open-cart");
    await expect(page.locator("#cart-modal")).toBeVisible();
    await expect(page.locator("[data-checkout-modal]")).toBeHidden();
    await expect(page).not.toHaveURL(/checkout=1/);

    await page.click("[data-cart-pay-now]");
    await expect(page.locator("[data-checkout-modal]")).toBeVisible();
    await expect(page).toHaveURL(/checkout=1/);
    await expect(page.locator("#cart-modal")).toBeHidden();
    await page.keyboard.press("Escape");
    await expect(page.locator("[data-checkout-modal]")).toBeHidden();
    await expect(page).not.toHaveURL(/checkout=1/);

    const checkoutButton = page.locator("[data-checkout]").first();
    await expect(checkoutButton).toBeVisible();
    await checkoutButton.click();
    await expect(page.locator("#cart-modal")).toBeVisible();
    await expect(page.locator("[data-checkout-modal]")).toBeHidden();
  });

  test("franquias form renders and accepts input", async ({ page }) => {
    await page.goto("/franquias");
    await expect(page.getByRole("heading", { name: "Seja um Parceiro" })).toBeVisible();

    await page.fill("#name", "Teste Franquia");
    await page.fill("#email", "teste@exemplo.com");
    await page.fill("#phone", "+55 (11) 99999-9999");
    await page.fill("#city", "Sao Paulo");
    await page.selectOption("#investment", "200-400");
    await page.selectOption("#funding-source", "savings");
    await page.fill("#location-address", "Av. Teste, 123");
    await page.selectOption("#property-type", "street");
    await page.fill("#location-justification", "Regiao com alto fluxo.");

    await page.click('button:has-text("Seja um Franqueado")');
    await expect(page.getByRole("heading", { name: "Seja um Parceiro" })).toBeVisible();
  });
});

test.describe("Admin flows", () => {
  test("admin validates status/category/stock and orders/subscriptions flows", async ({
    page,
    request,
  }) => {
    const auth = await getAdminAuth(request);
    const cleanup: Array<() => Promise<void>> = [];

    const serviceCategories = await apiGet<Array<{ id: number; name: string }>>(
      request,
      auth.token,
      "/service-categories"
    );
    const serviceStatuses = await apiGet<Array<{ id: number; name: string }>>(
      request,
      auth.token,
      "/service-statuses"
    );
    const productCategories = await apiGet<Array<{ id: number; name: string }>>(
      request,
      auth.token,
      "/product-categories"
    );
    const productStatuses = await apiGet<Array<{ id: number; name: string }>>(
      request,
      auth.token,
      "/product-statuses"
    );

    const serviceCategoryId = serviceCategories[0]?.id;
    const serviceStatusId = serviceStatuses[0]?.id;
    const serviceStatusAltId = serviceStatuses[1]?.id || serviceStatusId;
    const productCategoryId = productCategories[0]?.id;
    const productCategoryAltId = productCategories[1]?.id || productCategoryId;
    const productStatusId = productStatuses[0]?.id;
    const productStatusAltId = productStatuses[1]?.id || productStatusId;

    expect(serviceCategoryId, "Missing service category").toBeTruthy();
    expect(serviceStatusId, "Missing service status").toBeTruthy();
    expect(productCategoryId, "Missing product category").toBeTruthy();
    expect(productStatusId, "Missing product status").toBeTruthy();

    await page.addInitScript(
      ({ token, user }) => {
        localStorage.setItem("jlr_token", token);
        localStorage.setItem("jlr_user", JSON.stringify(user));
      },
      { token: auth.token, user: auth.user }
    );

    try {
      await page.goto("/admin");
      await expect(page.locator(".admin-sidebar")).toBeVisible();

      await page.click('[data-view-trigger="testes"]');
      const runTests = page.locator("[data-run-tests]");
      await expect(runTests).toBeVisible();
      await runTests.click();
      await expect(runTests).not.toBeDisabled();
      await expect(page.locator("[data-tests-count-pass]")).not.toHaveText("0");

      await page.click('[data-view-trigger="usuarios"]');
      await expect(page.locator('[data-view="usuarios"]')).not.toHaveClass(/hidden/);
      await expect(page.locator("[data-user-row]").first()).toBeVisible();

      const userEmail = `e2e.user.${Date.now()}@example.com`;
      await page.click('[data-open-modal="user-create"]');
      await expect(page.locator('[data-modal="user-create"]')).toBeVisible();
      await page.fill("[data-user-create-name]", "E2E Usuario");
      await page.fill("[data-user-create-email]", userEmail);
      await page.fill("[data-user-create-password]", "Aa!12345");
      await page.selectOption("[data-user-create-role]", "CLIENT");
      await page.click("[data-user-create-save]");
      await expect(page.locator('[data-modal="user-create"]')).toBeHidden();

      const users = await apiGet<Array<{ id: number; email: string; role: string }>>(
        request,
        auth.token,
        "/users"
      );
      const createdUser = users.find((user) => user.email === userEmail);
      expect(createdUser, "User should be persisted in DB").toBeTruthy();
      if (createdUser) {
        expect(createdUser.role).toBe("CLIENT");
        cleanup.push(async () => apiDelete(request, auth.token, `/users/${createdUser.id}`));
      }

      await page.click('[data-view-trigger="servicos"]');
      await expect(page.locator('[data-view="servicos"]')).not.toHaveClass(/hidden/);
      await page.waitForFunction(
        () => (document.querySelector('[data-service-category]') as HTMLSelectElement | null)?.options
          .length > 1
      );

      const serviceName = `Servico E2E ${Date.now()}`;
      await page.fill("[data-service-name]", serviceName);
      await page.fill("[data-service-duration]", "30");
      await page.fill("[data-service-price]", "10");
      await page.selectOption("[data-service-category]", String(serviceCategoryId));
      await page.selectOption("[data-service-status]", String(serviceStatusId));
      await page.click("[data-service-save]");
      await expect(page.locator("[data-service-save]")).toBeEnabled();

      const serviceRow = page.locator("[data-service-row]", { hasText: serviceName });
      await expect(serviceRow).toBeVisible();

      const findService = async () => {
        const services = await apiGet<
          Array<{
            id: number;
            name: string;
            price: number | string;
            serviceCategory?: { id: number } | null;
            serviceStatus?: { id: number } | null;
          }>
        >(request, auth.token, "/services");
        return services.find((service) => service.name === serviceName);
      };

      let createdService = await findService();
      expect(createdService, "Service should be persisted in DB").toBeTruthy();
      if (createdService) {
        expect(Number(createdService.price)).toBeCloseTo(10, 2);
        expect(createdService.serviceCategory?.id).toBe(serviceCategoryId);
        expect(createdService.serviceStatus?.id).toBe(serviceStatusId);
      }

      if (serviceStatusAltId && serviceStatusAltId !== serviceStatusId) {
        await serviceRow.locator('[data-service-action="edit"]').click();
        await expect(page.locator("[data-service-save]")).toHaveText(/Atualizar/i);
        await page.selectOption("[data-service-status]", String(serviceStatusAltId));
        await expect(page.locator("[data-service-status]")).toHaveValue(
          String(serviceStatusAltId)
        );
        await page.click("[data-service-save]");
        await expect(page.locator("[data-service-save]")).toBeEnabled();

        await expect
          .poll(async () => {
            const service = await findService();
            return service?.serviceStatus?.id || null;
          })
          .toBe(serviceStatusAltId);
        createdService = await findService();
        if (createdService) {
          cleanup.push(async () => apiDelete(request, auth.token, `/services/${createdService.id}`));
        }
      } else if (createdService) {
        cleanup.push(async () => apiDelete(request, auth.token, `/services/${createdService.id}`));
      }

      await page.click('[data-view-trigger="produtos"]');
      await expect(page.locator('[data-view="produtos"]')).not.toHaveClass(/hidden/);
      await page.waitForFunction(
        () => (document.querySelector('[data-product-category]') as HTMLSelectElement | null)?.options
          .length > 1
      );

      const productName = `Produto E2E ${Date.now()}`;
      await page.fill("[data-product-name]", productName);
      await page.fill("[data-product-price]", "15");
      await page.fill("[data-product-stock]", "5");
      await page.selectOption("[data-product-category]", String(productCategoryId));
      await page.selectOption("[data-product-status]", String(productStatusId));
      await page.click("[data-product-save]");
      await expect(page.locator("[data-product-save]")).toBeEnabled();

      const productRow = page.locator("[data-product-row]", { hasText: productName });
      await expect(productRow).toBeVisible();

      const findProduct = async () => {
        const products = await apiGet<
          Array<{
            id: number;
            name: string;
            price: number | string;
            stock?: number | null;
            productCategory?: { id: number } | null;
            productStatus?: { id: number } | null;
          }>
        >(request, auth.token, "/products");
        return products.find((product) => product.name === productName);
      };

      let createdProduct = await findProduct();
      expect(createdProduct, "Product should be persisted in DB").toBeTruthy();
      if (createdProduct) {
        expect(Number(createdProduct.price)).toBeCloseTo(15, 2);
        expect(createdProduct.stock ?? 0).toBe(5);
        expect(createdProduct.productCategory?.id).toBe(productCategoryId);
        expect(createdProduct.productStatus?.id).toBe(productStatusId);
        cleanup.push(async () => apiDelete(request, auth.token, `/products/${createdProduct.id}`));
      }

      await productRow.locator('[data-product-action="edit"]').click();
      await expect(page.locator("[data-product-save]")).toHaveText(/Atualizar/i);
      await page.fill("[data-product-stock]", "12");
      await page.selectOption("[data-product-category]", String(productCategoryAltId));
      await page.selectOption("[data-product-status]", String(productStatusAltId));
      await page.click("[data-product-save]");
      await expect(page.locator("[data-product-save]")).toBeEnabled();

      await expect
        .poll(async () => {
          const product = await findProduct();
          return {
            stock: product?.stock ?? null,
            categoryId: product?.productCategory?.id ?? null,
            statusId: product?.productStatus?.id ?? null,
          };
        })
        .toEqual({
          stock: 12,
          categoryId: productCategoryAltId ?? null,
          statusId: productStatusAltId ?? null,
        });

      await productRow.locator('[data-product-action="edit"]').click();
      await page.fill("[data-product-stock]", "3");
      await page.click("[data-product-save]");
      await expect(page.locator("[data-product-save]")).toBeEnabled();

      await expect
        .poll(async () => {
          const product = await findProduct();
          return product?.stock ?? null;
        })
        .toBe(3);

      createdProduct = await findProduct();
      if (!createdProduct) throw new Error("Produto nao encontrado apos atualizacao.");
      if (!createdService) throw new Error("Servico nao encontrado apos atualizacao.");

      await apiPatch(request, auth.token, `/products/${createdProduct.id}`, { stock: 5 });
      await expect
        .poll(async () => {
          const product = await findProduct();
          return product?.stock ?? null;
        })
        .toBe(5);

      const orderEmail = `e2e.order.${Date.now()}@example.com`;
      const order = await apiPost<{ id: number }>(request, auth.token, "/orders", {
        items: [
          {
            productId: createdProduct.id,
            quantity: 2,
            unitPrice: 15,
          },
          {
            serviceId: createdService.id,
            quantity: 1,
            unitPrice: 10,
          },
        ],
        total: 40,
        customerName: "Pedido E2E",
        customerEmail: orderEmail,
        customerPhone: "+55 (11) 99999-9999",
      });
      cleanup.push(async () => {
        await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
        await prisma.order.delete({ where: { id: order.id } });
      });

      await expect
        .poll(async () => {
          const product = await findProduct();
          return product?.stock ?? null;
        })
        .toBe(3);

      const payment = await apiPost<{ paymentRecordId: number }>(
        request,
        auth.token,
        "/payments/intent",
        {
          type: "order",
          orderId: order.id,
          amount: 40,
          description: "Pedido E2E",
          customer: { name: "Pedido E2E" },
        }
      );
      cleanup.push(async () => {
        await prisma.payment.delete({ where: { id: payment.paymentRecordId } });
      });

      await apiPatch(request, auth.token, `/payments/${payment.paymentRecordId}`, {
        status: "APPROVED",
      });

      await expect
        .poll(async () => {
          const orders = await apiGet<Array<{ id: number; status: string }>>(
            request,
            auth.token,
            "/orders"
          );
          return orders.find((item) => item.id === order.id)?.status || null;
        })
        .toBe("PAID");

      const membership = await apiPost<{ id: number }>(request, auth.token, "/memberships", {
        name: `Plan ${Date.now()}`,
        title: "Plano E2E",
        price: 99,
        benefits: ["Acesso basico"],
        status: "Ativo",
      });
      cleanup.push(async () => apiDelete(request, auth.token, `/memberships/${membership.id}`));

      const subscriptionEmail = `e2e.sub.${Date.now()}@example.com`;
      const subscription = await prisma.subscription.create({
        data: {
          membershipId: membership.id,
          status: "PENDING",
          customerName: "Assinante E2E",
          customerEmail: subscriptionEmail,
          customerPhone: "+55 (11) 99999-9999",
        },
      });
      cleanup.push(async () => {
        await prisma.subscription.delete({ where: { id: subscription.id } });
      });

      const subscriptionPayment = await apiPost<{ paymentRecordId: number }>(
        request,
        auth.token,
        "/payments/intent",
        {
          type: "subscription",
          subscriptionId: subscription.id,
          amount: 99,
          description: "Assinatura E2E",
          customer: { name: "Assinante E2E" },
        }
      );
      cleanup.push(async () => {
        await prisma.payment.delete({ where: { id: subscriptionPayment.paymentRecordId } });
      });

      await apiPatch(request, auth.token, `/payments/${subscriptionPayment.paymentRecordId}`, {
        status: "APPROVED",
      });

      await expect
        .poll(async () => {
          const subs = await apiGet<Array<{ id: number; status: string }>>(
            request,
            auth.token,
            "/subscriptions"
          );
          return subs.find((item) => item.id === subscription.id)?.status || null;
        })
        .toBe("ACTIVE");

      const units = await apiGet<Array<{ id: number }>>(request, auth.token, "/units");
      const professionals = await apiGet<Array<{ id: number }>>(
        request,
        auth.token,
        "/professionals"
      );
      const appointment = await apiPost<{ id: number }>(request, auth.token, "/appointments", {
        unitId: units[0]?.id,
        professionalId: professionals[0]?.id,
        serviceId: createdService.id,
        orderId: order.id,
        start: new Date().toISOString(),
        clientName: "Cliente E2E",
        clientPhone: "+55 (11) 98888-0000",
      });
      cleanup.push(async () => {
        await prisma.appointment.delete({ where: { id: appointment.id } });
      });

      const confirmedAppointment = await apiPatch<{ status: string }>(
        request,
        auth.token,
        `/appointments/${appointment.id}`,
        { status: "CONFIRMED" }
      );
      expect(confirmedAppointment.status).toBe("CONFIRMED");

      await apiPatch(request, auth.token, `/orders/${order.id}`, { status: "CANCELLED" });
      await expect
        .poll(async () => {
          const product = await findProduct();
          return product?.stock ?? null;
        })
        .toBe(5);

      await page.reload();
      await expect(page.locator(".admin-sidebar")).toBeVisible();

      await page.click('[data-view-trigger="vendas"]');
      await expect(page.locator('[data-view="vendas"]')).not.toHaveClass(/hidden/);
      await page.fill("[data-orders-search]", orderEmail);
      const orderRow = page.locator("[data-order-row]", { hasText: orderEmail });
      await expect(orderRow).toBeVisible();

      await page.click('[data-view-trigger="assinantes"]');
      await expect(page.locator('[data-view="assinantes"]')).not.toHaveClass(/hidden/);
      await page.fill("[data-subscriptions-search]", subscriptionEmail);
      const subscriptionRow = page.locator("[data-subscription-row]", {
        hasText: subscriptionEmail,
      });
      await expect(subscriptionRow).toBeVisible();

      await page.click('[data-view-trigger="agenda"]');
      await expect(page.locator('[data-view="agenda"]')).not.toHaveClass(/hidden/);
      const agendaGrid = page.locator('[data-view="agenda"] [data-appointments-grid]');
      await expect(agendaGrid).toContainText("Cliente E2E");
      await expect(agendaGrid).toContainText(serviceName);
    } finally {
      for (const action of cleanup.reverse()) {
        try {
          await action();
        } catch {
          // ignore cleanup errors
        }
      }
    }
  });
});
