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

test("admin memberships grid renders persisted plans", async ({ page, request }) => {
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

  await page.goto("/admin");
  await page.click('[data-view-trigger="planos"]');

  const membershipList = page.locator("[data-membership-list]");
  await expect(membershipList).toBeVisible();

  await expect.poll(async () => membershipList.locator("> div").count()).toBeGreaterThan(0);
  await expect(page.locator("[data-membership-count]").first()).not.toHaveText("0");
});
