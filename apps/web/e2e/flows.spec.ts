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

async function apiPut<T>(
  request: typeof test.request,
  token: string,
  path: string,
  data: unknown
) {
  const response = await request.put(`${API_BASE_URL}/api${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    data,
  });
  if (!response.ok()) {
    const detail = await response.text();
    throw new Error(`PUT ${path} failed: ${response.status()} ${detail}`);
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
  /**
   * `PLAN-0033` — reescrito pro Admin V2. O legado (`/admin`, seletores `data-view-trigger`/
   * `data-*-save`/`data-*-row`) foi aposentado; `TestsView.tsx` (Admin V2, `PLAN-0026` Onda 10)
   * documenta a razão explícita de não portar esses seletores 1:1 (árvore React diferente,
   * sempre daria falso-negativo).
   *
   * A criação/edição de usuário, serviço e produto passou de "clicar no formulário legado"
   * pra chamada de API direta — o teste já verificava a persistência via API logo depois de
   * cada passo de UI, então a interação de UI não testava nada que a chamada direta não prove
   * igual, e isso elimina 100% do acoplamento com o DOM do legado nessa parte. O ajuste de
   * estoque do produto passou a usar o endpoint real do ledger (`stock/adjust`, `PLAN-0020`/
   * `ERR-0071`) em vez de `PATCH /products/:id` com `stock` — esse campo nunca existiu no
   * `productUpdateSchema` (backend ignora silenciosamente), então a chamada original nunca
   * teria funcionado de verdade; a correção usa o endpoint que o `ERR-0071` desta sessão
   * confirmou correto.
   *
   * O bloco final de verificação via UI foi trocado pras 3 telas nativas com equivalente real
   * (Testes, Usuários, Lista de Pedidos). 2 verificações do teste original não têm
   * equivalente nativo e foram removidas, não substituídas — documentado inline:
   * "Assinantes" (gestão individual de assinatura — achado do `PLAN-0032` ocorrência #6,
   * backend pronto, zero UI em lugar nenhum) e o grid de agendamentos por cliente/serviço
   * (a Agenda nativa é um mapa de capacidade dia×hora, não uma lista por agendamento —
   * conceito diferente por desenho, `PLAN-0022` Onda 4).
   */
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
    const units = await apiGet<Array<{ id: number; isOnline?: boolean }>>(request, auth.token, "/units");

    const serviceCategoryId = serviceCategories[0]?.id;
    const serviceStatusId = serviceStatuses[0]?.id;
    const serviceStatusAltId = serviceStatuses[1]?.id || serviceStatusId;
    const productCategoryId = productCategories[0]?.id;
    const productStatusId = productStatuses[0]?.id;
    const stockUnitId = units.find((unit) => !unit.isOnline)?.id ?? units[0]?.id;

    expect(serviceCategoryId, "Missing service category").toBeTruthy();
    expect(serviceStatusId, "Missing service status").toBeTruthy();
    expect(productCategoryId, "Missing product category").toBeTruthy();
    expect(productStatusId, "Missing product status").toBeTruthy();
    expect(stockUnitId, "Missing unit for stock adjust").toBeTruthy();

    await page.addInitScript(
      ({ token, user }) => {
        localStorage.setItem("jlr_token", token);
        localStorage.setItem("jlr_user", JSON.stringify(user));
      },
      { token: auth.token, user: auth.user }
    );

    try {
      // Usuário — criação via API (a UI de criação legada saiu de cena; verificação de
      // renderização real acontece no bloco de UI mais abaixo, tela nativa de Usuários).
      const userEmail = `e2e.user.${Date.now()}@example.com`;
      const createdUser = await apiPost<{ id: number; email: string; role: string }>(
        request,
        auth.token,
        "/users",
        { name: "E2E Usuario", email: userEmail, password: "Aa!12345", role: "CLIENT" }
      );
      expect(createdUser.role).toBe("CLIENT");
      cleanup.push(async () => apiDelete(request, auth.token, `/users/${createdUser.id}`));

      // Serviço — criação + edição de status via API.
      const serviceName = `Servico E2E ${Date.now()}`;
      let createdService = await apiPost<{
        id: number;
        name: string;
        price: number | string;
        serviceCategory?: { id: number } | null;
        serviceStatus?: { id: number } | null;
      }>(request, auth.token, "/services", {
        name: serviceName,
        durationMin: 30,
        price: 10,
        serviceCategoryId,
        serviceStatusId,
      });
      expect(Number(createdService.price)).toBeCloseTo(10, 2);
      expect(createdService.serviceCategory?.id).toBe(serviceCategoryId);
      expect(createdService.serviceStatus?.id).toBe(serviceStatusId);
      cleanup.push(async () => apiDelete(request, auth.token, `/services/${createdService.id}`));

      if (serviceStatusAltId && serviceStatusAltId !== serviceStatusId) {
        createdService = await apiPatch(request, auth.token, `/services/${createdService.id}`, {
          serviceStatusId: serviceStatusAltId,
        });
        expect(createdService.serviceStatus?.id).toBe(serviceStatusAltId);
      }

      // Produto — criação com estoque inicial (ledger, `PLAN-0020`) + ajustes via
      // `stock/adjust` real (não `PATCH /products/:id`, que nunca aceitou `stock`).
      const productName = `Produto E2E ${Date.now()}`;
      const createdProductInitial = await apiPost<{ id: number; price: number | string; productCategory?: { id: number } | null; productStatus?: { id: number } | null }>(
        request,
        auth.token,
        "/products",
        {
          name: productName,
          price: 15,
          productCategoryId,
          productStatusId,
          initialStock: 5,
          initialStockUnitId: stockUnitId,
        }
      );
      expect(Number(createdProductInitial.price)).toBeCloseTo(15, 2);
      expect(createdProductInitial.productCategory?.id).toBe(productCategoryId);
      expect(createdProductInitial.productStatus?.id).toBe(productStatusId);
      const createdProductId = createdProductInitial.id;
      cleanup.push(async () => apiDelete(request, auth.token, `/products/${createdProductId}`));

      const findProduct = async () => {
        const products = await apiGet<Array<{ id: number; stock?: number | null }>>(
          request,
          auth.token,
          "/products"
        );
        return products.find((product) => product.id === createdProductId);
      };

      await expect.poll(async () => (await findProduct())?.stock ?? null).toBe(5);

      await apiPost(request, auth.token, `/units/${stockUnitId}/products/${createdProductId}/stock/adjust`, {
        targetStock: 12,
        reason: "e2e ajuste 1",
      });
      await expect.poll(async () => (await findProduct())?.stock ?? null).toBe(12);

      await apiPost(request, auth.token, `/units/${stockUnitId}/products/${createdProductId}/stock/adjust`, {
        targetStock: 3,
        reason: "e2e ajuste 2",
      });
      await expect.poll(async () => (await findProduct())?.stock ?? null).toBe(3);

      const createdProduct = await findProduct();
      if (!createdProduct) throw new Error("Produto nao encontrado apos atualizacao.");
      if (!createdService) throw new Error("Servico nao encontrado apos atualizacao.");

      await apiPost(request, auth.token, `/units/${stockUnitId}/products/${createdProductId}/stock/adjust`, {
        targetStock: 5,
        reason: "e2e ajuste 3",
      });
      await expect.poll(async () => (await findProduct())?.stock ?? null).toBe(5);

      const orderEmail = `e2e.order.${Date.now()}@example.com`;
      const order = await apiPost<{ id: number }>(request, auth.token, "/orders", {
        items: [
          { productId: createdProduct.id, quantity: 2 },
          { serviceId: createdService.id, quantity: 1 },
        ],
        // `unitId` é obrigatório pra ADMIN/MASTER (escopo global, S2 do `PLAN-0020`) — o
        // teste original nunca enviava isso, achado nesta reescrita (`PLAN-0033` Onda 3).
        // `unitPrice`/`total` removidos: nunca existiram no schema (calculados no servidor,
        // S12), Zod só ignorava silenciosamente.
        unitId: stockUnitId,
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

      // `PLAN-0033` Onda 3 — achado pré-existente (não causado pela reescrita): os enums de
      // status neste arquivo estavam em inglês, mas o schema real é PT-BR (`SYSTEM.md`
      // "mensagens normalizadas para PT-BR"); o teste nunca detectava porque cada `PATCH`
      // aqui falhava e o `finally`/cleanup escondia o erro real até agora.
      await apiPatch(request, auth.token, `/payments/${payment.paymentRecordId}`, {
        status: "APROVADO",
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
        .toBe("PAGO");

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
          status: "PENDENTE",
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
        status: "APROVADO",
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
        .toBe("ATIVA");

      const professionals = await apiGet<Array<{ id: number; unitId: number | null }>>(
        request,
        auth.token,
        "/professionals"
      );
      const chosenProfessional = professionals.find((professional) => professional.unitId !== null);
      const professionalId = chosenProfessional?.id;
      const appointmentUnitId = chosenProfessional?.unitId ?? units[0]?.id;
      expect(professionalId, "Missing professional with a unit assigned").toBeTruthy();

      // `PLAN-0033` Onda 3 — achados pré-existentes em cascata, nenhum relacionado à
      // aposentadoria do Admin legado: `POST /appointments` (`strictPreferredProfessional`)
      // exige (1) que o profissional já atenda o serviço (`ProfessionalService` — um serviço
      // recém-criado nunca tem profissional vinculado) e (2) que o profissional tenha um
      // turno (`ProfessionalShift`) cobrindo o horário exato do agendamento, específico da
      // data (não é recorrente por dia da semana). O teste original usava `new Date()` (agora)
      // sem alinhar ao grid de slots de 30min nem garantir turno algum — falhava sempre,
      // independente da causa de fundo real ter mudado ao longo do tempo. Corrigido: vincula
      // o serviço ao profissional, cria um turno cobrindo o horário fixo escolhido (10:00,
      // dentro do expediente 08:00-20:00 de todas as unidades físicas — evita depender da
      // hora real de quando o teste roda), ambos revertidos no cleanup.
      const existingLinks = await apiGet<{ items: Array<{ serviceId: number }> }>(
        request,
        auth.token,
        `/professional-services?professionalId=${professionalId}`
      );
      const originalServiceIds = existingLinks.items.map((item) => item.serviceId);
      await apiPut(request, auth.token, `/professionals/${professionalId}/services`, {
        serviceIds: [...originalServiceIds, createdService.id],
      });
      cleanup.push(async () => {
        await apiPut(request, auth.token, `/professionals/${professionalId}/services`, {
          serviceIds: originalServiceIds,
        });
      });

      const appointmentStart = new Date();
      appointmentStart.setHours(10, 0, 0, 0);
      const shift = await prisma.professionalShift.create({
        data: {
          professionalId,
          unitId: appointmentUnitId,
          workDate: new Date(appointmentStart.toDateString()),
          hourStart: "08:00",
          hourFinish: "20:00",
          isActive: true,
          notes: "e2e (PLAN-0033)",
        },
      });
      cleanup.push(async () => {
        await prisma.professionalShift.delete({ where: { id: shift.id } });
      });

      const appointment = await apiPost<{ id: number }>(request, auth.token, "/appointments", {
        unitId: appointmentUnitId,
        professionalId,
        serviceId: createdService.id,
        orderId: order.id,
        start: appointmentStart.toISOString(),
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
        { status: "CONFIRMADO" }
      );
      expect(confirmedAppointment.status).toBe("CONFIRMADO");

      await apiPatch(request, auth.token, `/orders/${order.id}`, { status: "CANCELADO" });
      await expect
        .poll(async () => {
          const product = await findProduct();
          return product?.stock ?? null;
        })
        .toBe(5);

      // Testes e Validação (Sistema, `/admin-v2/sistema/testes`) — equivalente nativo da
      // aba "Testes" legada, escopo deliberadamente reduzido (ver comentário no topo do
      // teste e `TestsView.tsx`).
      await page.goto("/admin-v2/sistema/testes");
      await expect(page.getByRole("heading", { name: "Testes e Validação" })).toBeVisible();
      await page.getByRole("button", { name: /Executar testes/i }).click();
      await expect(page.getByRole("button", { name: /Executando/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /Executar testes/i })).toBeVisible();
      await expect(page.getByText("PASSOU").first()).toBeVisible();

      // Usuários (Cadastros, `/admin-v2/cadastros/usuarios`) — confirma que o usuário criado
      // via API (acima) aparece na tela nativa de listagem.
      await page.goto("/admin-v2/cadastros/usuarios");
      await page.fill('input[placeholder*="e-mail"]', userEmail);
      await expect(page.getByText(userEmail)).toBeVisible();

      // Lista de Pedidos (Operação, `/admin-v2/operacao/lista`) — equivalente nativo da
      // aba "Vendas" legada (`PLAN-0031`).
      await page.goto("/admin-v2/operacao/lista");
      await page.fill('input[placeholder*="Buscar por ID"]', orderEmail);
      await expect(page.getByText(orderEmail)).toBeVisible();

      // Sem equivalente nativo, removido (não substituído — ver comentário no topo do teste):
      // (1) gestão individual de assinatura ("Assinantes" legado) — achado do `PLAN-0032`
      // ocorrência #6, backend `POST/PATCH /subscriptions` pronto, zero UI em qualquer lugar;
      // (2) grid de agendamentos por cliente/serviço — a Agenda nativa é um mapa de
      // capacidade dia×hora (`CapacityView.tsx`, `PLAN-0022` Onda 4), não uma lista por
      // agendamento. A confirmação de `CONFIRMED` do agendamento já foi verificada via API
      // (`confirmedAppointment.status`) mais acima — a cobertura de negócio não se perde,
      // só a checagem de renderização em tela, que não tem pra onde ir.
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
