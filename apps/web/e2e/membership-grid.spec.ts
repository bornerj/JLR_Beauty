import { expect, test } from "@playwright/test";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3001";

type AuthResponse = {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
};

/**
 * `PLAN-0033` — reescrito pra Admin V2 (`/admin-v2/cadastros/planos`, tela nativa do
 * `PLAN-0026`). O Admin legado (`/admin`, `[data-view-trigger="planos"]`) foi aposentado —
 * a asserção agora é sobre a contagem "N plano(s)" do subtítulo da tela nativa, já que
 * `PlansListView.tsx` não usa atributos `data-*` como o legado usava.
 */
test("admin-v2 memberships grid renders persisted plans", async ({ page, request }) => {
  const login = await request.post(`${API_BASE_URL}/api/auth/login`, {
    data: { identifier: "admin@jlrbeauty.com", password: "Admin@1234" },
  });
  expect(login.ok()).toBeTruthy();
  const auth = (await login.json()) as AuthResponse;

  await page.addInitScript(
    ({ token, user }) => {
      localStorage.setItem("jlr_token", token);
      localStorage.setItem("jlr_user", JSON.stringify(user));
    },
    { token: auth.token, user: auth.user }
  );

  await page.goto("/admin-v2/cadastros/planos");
  await expect(page.getByRole("heading", { name: "Planos", exact: true })).toBeVisible();

  await expect.poll(async () => {
    const text = await page.getByText(/plano\(s\)$/).first().textContent();
    const match = text?.match(/(\d+)\s+plano\(s\)/);
    return match ? Number(match[1]) : 0;
  }).toBeGreaterThan(0);
});
