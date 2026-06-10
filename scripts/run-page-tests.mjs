import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const readFile = (relativePath) => {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    return { ok: false, content: "", path: relativePath };
  }
  return { ok: true, content: fs.readFileSync(fullPath, "utf8"), path: relativePath };
};

const files = {
  webIndex: readFile("apps/web/index.html"),
  homeContent: readFile("apps/web/src/components/pages/HomeContent.tsx"),
  franquias: readFile("apps/web/src/components/pages/FranquiasContent.tsx"),
  checkout: readFile("apps/web/src/components/pages/CheckoutContent.tsx"),
  publicNav: readFile("apps/web/src/modules/menu/components/PublicMenu.tsx"),
  publicFooter: readFile("apps/web/src/modules/footer/components/PublicSiteFooter.tsx"),
  adminContent: readFile("apps/web/src/components/pages/AdminContent.tsx"),
  adminBehavior: readFile("apps/web/src/modules/admin-core/behavior.ts"),
  adminTestsView: readFile("apps/web/src/modules/admin-tests/components/AdminTestsView.tsx"),
  adminServicesBehavior: readFile("apps/web/src/modules/admin-services/behavior.ts"),
  adminProductsBehavior: readFile("apps/web/src/modules/admin-products/behavior.ts"),
};

const results = [];
const addResult = (id, title, status, severity, detail) => {
  results.push({ id, title, status, severity, detail });
};

const expectFile = (id, title, file, severity) => {
  if (!file.ok) {
    addResult(id, title, "fail", severity, `Missing file: ${file.path}`);
    return false;
  }
  addResult(id, title, "pass", severity, "File found.");
  return true;
};

const expectContains = (id, title, file, needle, severity) => {
  if (!file.ok) {
    addResult(id, title, "fail", severity, `Missing file: ${file.path}`);
    return;
  }
  const ok = file.content.includes(needle);
  addResult(
    id,
    title,
    ok ? "pass" : "fail",
    severity,
    ok ? "Pattern found." : `Missing pattern: ${needle}`
  );
};

const expectRegex = (id, title, file, regex, severity) => {
  if (!file.ok) {
    addResult(id, title, "fail", severity, `Missing file: ${file.path}`);
    return;
  }
  const ok = regex.test(file.content);
  addResult(
    id,
    title,
    ok ? "pass" : "fail",
    severity,
    ok ? "Pattern found." : `Missing regex: ${regex}`
  );
};

const expectNotContains = (id, title, file, needle, severity) => {
  if (!file.ok) {
    addResult(id, title, "fail", severity, `Missing file: ${file.path}`);
    return;
  }
  const ok = !file.content.includes(needle);
  addResult(
    id,
    title,
    ok ? "pass" : "fail",
    severity,
    ok ? "Pattern not present." : `Unexpected pattern: ${needle}`
  );
};

expectFile("file:web-index", "apps/web/index.html exists", files.webIndex, "critical");
expectFile("file:home-content", "home content component exists", files.homeContent, "critical");
expectFile("file:franquias", "franquias content component exists", files.franquias, "critical");
expectFile("file:checkout", "checkout content component exists", files.checkout, "critical");
expectFile("file:public-nav", "PublicMenu component exists", files.publicNav, "major");
expectFile("file:public-footer", "PublicSiteFooter component exists", files.publicFooter, "major");
expectFile("file:admin-content", "admin content component exists", files.adminContent, "critical");
expectFile("file:admin-behavior", "admin core behavior exists", files.adminBehavior, "major");
expectFile("file:admin-tests-view", "admin tests view component exists", files.adminTestsView, "major");
expectFile(
  "file:admin-services-behavior",
  "admin services behavior exists",
  files.adminServicesBehavior,
  "major"
);
expectFile(
  "file:admin-products-behavior",
  "admin products behavior exists",
  files.adminProductsBehavior,
  "major"
);

expectContains("index:nav", "public nav present", files.publicNav, "top-nav", "major");
expectContains("index:footer", "public footer present", files.publicFooter, "site-footer", "major");
expectNotContains("index:no-template", "home sem HtmlTemplate", files.homeContent, "HtmlTemplate", "major");
expectNotContains(
  "franquias:no-template",
  "franquias sem HtmlTemplate",
  files.franquias,
  "HtmlTemplate",
  "major"
);
expectNotContains(
  "checkout:no-template",
  "checkout sem HtmlTemplate",
  files.checkout,
  "HtmlTemplate",
  "major"
);
expectNotContains(
  "admin:no-template",
  "admin sem HtmlTemplate",
  files.adminContent,
  "HtmlTemplate",
  "critical"
);
expectNotContains(
  "admin:no-dangerously",
  "admin sem dangerouslySetInnerHTML",
  files.adminContent,
  "dangerouslySetInnerHTML",
  "critical"
);
expectContains(
  "franquias:title",
  "franquias title present",
  files.franquias,
  "Oportunidades de Franquia",
  "major"
);
expectRegex("franquias:form", "franquias form present", files.franquias, /<form[\s>]/, "major");
expectContains("checkout:pay", "checkout payment section", files.checkout, "Pagamento e Seguranca", "major");

expectContains("admin:view-testes", "admin tests view present", files.adminContent, 'data-view="testes"', "critical");
expectContains(
  "admin:trigger-testes",
  "admin tests trigger present",
  files.adminContent,
  'data-view-trigger="testes"',
  "critical"
);
expectContains(
  "admin:run-tests",
  "admin run button present",
  files.adminTestsView,
  "data-run-tests",
  "critical"
);

expectContains(
  "admin:behavior-runner",
  "admin behavior test runner present",
  files.adminBehavior,
  "initAdminTestsBehavior",
  "major"
);
expectContains(
  "admin:behavior-services",
  "admin services behavior API",
  files.adminServicesBehavior,
  "/services",
  "major"
);
expectContains(
  "admin:behavior-products",
  "admin products behavior API",
  files.adminProductsBehavior,
  "/products",
  "major"
);

const apiBase =
  process.env.API_URL || process.env.VITE_API_URL || "http://localhost:3001";
const adminCreds = { identifier: "admin@jlrbeauty.com", password: "Admin@1234" };

const apiResults = [];
const addApiResult = (id, title, status, severity, detail) => {
  apiResults.push({ id, title, status, severity, detail });
};

const runApiTests = async () => {
  let token = "";
  try {
    const loginResponse = await fetch(`${apiBase}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(adminCreds),
    });
    if (!loginResponse.ok) {
      addApiResult(
        "api:login",
        "API login (admin seed)",
        "fail",
        "critical",
        `Login failed with status ${loginResponse.status}`
      );
      return;
    }
    const loginData = await loginResponse.json();
    token = loginData?.token || "";
    if (!token) {
      addApiResult("api:login", "API login (admin seed)", "fail", "critical", "Token missing.");
      return;
    }
    addApiResult("api:login", "API login (admin seed)", "pass", "critical", "Token received.");
  } catch (error) {
    addApiResult(
      "api:login",
      "API login (admin seed)",
      "skip",
      "critical",
      `API not reachable at ${apiBase}`
    );
    return;
  }

  const headers = { Authorization: `Bearer ${token}` };
  const listEndpoints = [
    { id: "api:users", title: "/users list", path: "/users", severity: "critical" },
    { id: "api:services", title: "/services list", path: "/services", severity: "critical" },
    { id: "api:products", title: "/products list", path: "/products", severity: "critical" },
    { id: "api:memberships", title: "/memberships list", path: "/memberships", severity: "major" },
    { id: "api:orders", title: "/orders list", path: "/orders", severity: "major" },
    { id: "api:subscriptions", title: "/subscriptions list", path: "/subscriptions", severity: "major" },
    { id: "api:appointments", title: "/appointments list", path: "/appointments", severity: "major" },
    { id: "api:franchise-leads", title: "/franchise-leads list", path: "/franchise-leads", severity: "major" },
  ];

  for (const endpoint of listEndpoints) {
    try {
      const response = await fetch(`${apiBase}/api${endpoint.path}`, { headers });
      if (!response.ok) {
        addApiResult(
          endpoint.id,
          `API ${endpoint.title}`,
          "fail",
          endpoint.severity,
          `Status ${response.status}`
        );
        continue;
      }
      addApiResult(
        endpoint.id,
        `API ${endpoint.title}`,
        "pass",
        endpoint.severity,
        "Response OK."
      );
    } catch (error) {
      addApiResult(
        endpoint.id,
        `API ${endpoint.title}`,
        "fail",
        endpoint.severity,
        "Network error."
      );
    }
  }

  try {
    const invalidResponse = await fetch(`${apiBase}/api/services`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ name: "" }),
    });
    addApiResult(
      "api:validation",
      "Services validation (invalid payload)",
      invalidResponse.status === 400 ? "pass" : "warn",
      "minor",
      `Status ${invalidResponse.status}`
    );
  } catch (error) {
    addApiResult(
      "api:validation",
      "Services validation (invalid payload)",
      "warn",
      "minor",
      "Network error."
    );
  }

  try {
    const servicePayload = {
      name: `Teste Auto Servico ${Date.now()}`,
      description: "Teste automatizado",
      price: 1,
      durationMin: 10,
      isFeatured: false,
    };
    const createResponse = await fetch(`${apiBase}/api/services`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(servicePayload),
    });
    if (!createResponse.ok) {
      addApiResult(
        "api:write-service",
        "Create/delete service",
        "fail",
        "major",
        `Create status ${createResponse.status}`
      );
    } else {
      const created = await createResponse.json();
      const id = created?.id;
      if (!id) {
        addApiResult(
          "api:write-service",
          "Create/delete service",
          "fail",
          "major",
          "Create missing id."
        );
      } else {
        const deleteResponse = await fetch(`${apiBase}/api/services/${id}`, {
          method: "DELETE",
          headers,
        });
        addApiResult(
          "api:write-service",
          "Create/delete service",
          deleteResponse.ok ? "pass" : "fail",
          "major",
          deleteResponse.ok ? "Created and deleted." : `Delete status ${deleteResponse.status}`
        );
      }
    }
  } catch (error) {
    addApiResult("api:write-service", "Create/delete service", "fail", "major", "Network error.");
  }

  try {
    const productPayload = {
      name: `Teste Auto Produto ${Date.now()}`,
      description: "Teste automatizado",
      price: 1,
      isFeatured: false,
    };
    const createResponse = await fetch(`${apiBase}/api/products`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(productPayload),
    });
    if (!createResponse.ok) {
      addApiResult(
        "api:write-product",
        "Create/delete product",
        "fail",
        "major",
        `Create status ${createResponse.status}`
      );
    } else {
      const created = await createResponse.json();
      const id = created?.id;
      if (!id) {
        addApiResult(
          "api:write-product",
          "Create/delete product",
          "fail",
          "major",
          "Create missing id."
        );
      } else {
        const deleteResponse = await fetch(`${apiBase}/api/products/${id}`, {
          method: "DELETE",
          headers,
        });
        addApiResult(
          "api:write-product",
          "Create/delete product",
          deleteResponse.ok ? "pass" : "fail",
          "major",
          deleteResponse.ok ? "Created and deleted." : `Delete status ${deleteResponse.status}`
        );
      }
    }
  } catch (error) {
    addApiResult("api:write-product", "Create/delete product", "fail", "major", "Network error.");
  }
};

await runApiTests();
results.push(...apiResults);

const counts = results.reduce(
  (acc, item) => {
    acc[item.status] += 1;
    return acc;
  },
  { pass: 0, fail: 0, warn: 0, skip: 0 }
);

console.log("SUMMARY");
console.log(`PASS=${counts.pass} FAIL=${counts.fail} WARN=${counts.warn} SKIP=${counts.skip}`);
console.log("DETAILS");
for (const result of results) {
  const status = result.status.toUpperCase().padEnd(4, " ");
  console.log(`[${status}] ${result.id} - ${result.title} (${result.severity}) :: ${result.detail}`);
}

const hasCriticalFailure = results.some(
  (result) => result.severity === "critical" && result.status === "fail"
);
if (hasCriticalFailure) process.exitCode = 1;
