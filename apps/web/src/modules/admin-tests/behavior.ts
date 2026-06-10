import { getToken, getUser } from "../../lib/auth";
import type { Cleanup } from "../../shared/dom";
import { on } from "../../shared/dom";

type ApiJsonFn = <T = unknown>(path: string, options?: RequestInit) => Promise<T>;
type EscapeHtmlFn = (value: string) => string;
type AddCleanupFn = (cleanup: Cleanup) => void;

type InitAdminTestsBehaviorParams = {
  addCleanup: AddCleanupFn;
  apiJson: ApiJsonFn;
  apiUrl: string;
  escapeHtml: EscapeHtmlFn;
};

type TestStatus = "pass" | "fail" | "warn" | "skip";
type TestSeverity = "critical" | "major" | "minor";
type TestResult = {
  id: string;
  title: string;
  status: TestStatus;
  severity: TestSeverity;
  detail: string;
};

const testBadgeByStatus: Record<TestStatus, string> = {
  pass: "bg-green-100 text-green-800 border-green-200",
  warn: "bg-yellow-100 text-yellow-800 border-yellow-200",
  fail: "bg-red-100 text-red-800 border-red-200",
  skip: "bg-stone-100 text-stone-600 border-stone-200",
};

const baseExpectedViews = [
  "dashboard",
  "whatsapp-contatos",
  "usuarios",
  "servicos",
  "produtos",
  "cupons-desconto",
  "planos",
  "assinantes",
  "agenda",
  "vendas",
  "checkout-entrega",
  "metas",
  "performance",
];

const masterExpectedViews = ["branding", "site-sections", "testes"];

const skippedApiPaths = [
  "/users",
  "/services",
  "/products",
  "/discount-coupons",
  "/memberships",
  "/orders",
  "/subscriptions",
  "/appointments",
  "/franchise-leads",
];

const apiChecks: Array<{ id: string; title: string; path: string; severity: TestSeverity }> = [
  { id: "api:users", title: "API /users lista", path: "/users", severity: "critical" },
  { id: "api:services", title: "API /services lista", path: "/services", severity: "critical" },
  { id: "api:products", title: "API /products lista", path: "/products", severity: "critical" },
  {
    id: "api:discount-coupons",
    title: "API /discount-coupons lista",
    path: "/discount-coupons",
    severity: "major",
  },
  { id: "api:memberships", title: "API /memberships lista", path: "/memberships", severity: "major" },
  { id: "api:orders", title: "API /orders lista", path: "/orders", severity: "major" },
  {
    id: "api:dashboard-kpis",
    title: "API /admin/dashboard/kpis",
    path: "/admin/dashboard/kpis",
    severity: "major",
  },
  {
    id: "api:dashboard-sales-series",
    title: "API /admin/dashboard/sales-series",
    path: "/admin/dashboard/sales-series",
    severity: "major",
  },
  {
    id: "api:dashboard-agenda-summary",
    title: "API /admin/dashboard/agenda-summary",
    path: "/admin/dashboard/agenda-summary",
    severity: "major",
  },
  {
    id: "api:dashboard-commissions-summary",
    title: "API /admin/dashboard/commissions-summary",
    path: "/admin/dashboard/commissions-summary",
    severity: "major",
  },
  { id: "api:subscriptions", title: "API /subscriptions lista", path: "/subscriptions", severity: "major" },
  { id: "api:appointments", title: "API /appointments lista", path: "/appointments", severity: "major" },
  {
    id: "api:concierge-sessions",
    title: "API /concierge/sessions lista",
    path: "/concierge/sessions",
    severity: "major",
  },
  { id: "api:franchise-leads", title: "API /franchise-leads lista", path: "/franchise-leads", severity: "major" },
];

export const initAdminTestsBehavior = ({
  addCleanup,
  apiJson,
  apiUrl,
  escapeHtml,
}: InitAdminTestsBehaviorParams): void => {
  const testsRunButton = document.querySelector("[data-run-tests]") as HTMLButtonElement | null;
  const testsResults = document.querySelector("[data-tests-results]") as HTMLElement | null;
  const testsLastRun = document.querySelector("[data-tests-last-run]") as HTMLElement | null;
  const testsCountPass = document.querySelector("[data-tests-count-pass]") as HTMLElement | null;
  const testsCountWarn = document.querySelector("[data-tests-count-warn]") as HTMLElement | null;
  const testsCountFail = document.querySelector("[data-tests-count-fail]") as HTMLElement | null;
  const testsCountSkip = document.querySelector("[data-tests-count-skip]") as HTMLElement | null;
  const currentUser = getUser();
  const isMaster = currentUser?.role?.trim().toUpperCase() === "MASTER";
  const expectedViews = isMaster ? [...baseExpectedViews, ...masterExpectedViews] : baseExpectedViews;

  const setTestsLoading = (isLoading: boolean) => {
    if (!testsRunButton) return;
    testsRunButton.disabled = isLoading;
    testsRunButton.classList.toggle("opacity-70", isLoading);
    testsRunButton.classList.toggle("cursor-wait", isLoading);
  };

  const renderTestResults = (results: TestResult[]) => {
    if (!testsResults) return;
    testsResults.innerHTML = results
      .map((result) => {
        const badgeClass = testBadgeByStatus[result.status];
        const detail = escapeHtml(result.detail || "-");
        return `
          <div class="p-4 flex flex-col gap-2">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="px-2 py-1 rounded-full text-xs font-semibold ${badgeClass}">${result.status.toUpperCase()}</span>
                <span class="text-xs text-stone-500 uppercase tracking-widest">${result.severity}</span>
              </div>
              <span class="text-xs text-stone-400">${escapeHtml(result.id)}</span>
            </div>
            <div class="text-sm font-semibold text-forest">${escapeHtml(result.title)}</div>
            <div class="text-xs text-stone-500">${detail}</div>
          </div>
        `;
      })
      .join("");
  };

  const updateTestsSummary = (results: TestResult[]) => {
    const counts = results.reduce(
      (acc, item) => {
        acc[item.status] += 1;
        return acc;
      },
      { pass: 0, warn: 0, fail: 0, skip: 0 } as Record<TestStatus, number>
    );
    if (testsCountPass) testsCountPass.textContent = String(counts.pass);
    if (testsCountWarn) testsCountWarn.textContent = String(counts.warn);
    if (testsCountFail) testsCountFail.textContent = String(counts.fail);
    if (testsCountSkip) testsCountSkip.textContent = String(counts.skip);
  };

  const runAdminTests = async () => {
    const results: TestResult[] = [];
    const addResult = (result: TestResult) => results.push(result);
    const addDomCheck = (id: string, title: string, selector: string, severity: TestSeverity) => {
      const exists = Boolean(document.querySelector(selector));
      addResult({
        id,
        title,
        status: exists ? "pass" : "fail",
        severity,
        detail: exists ? "Elemento encontrado." : `Elemento ausente: ${selector}`,
      });
    };

    addDomCheck("ui:nav", "Navbar principal carregada", ".top-nav", "major");
    addDomCheck("ui:footer", "Footer global carregado", ".site-footer", "major");

    const missingViews = expectedViews.filter((view) => !document.querySelector(`[data-view="${view}"]`));
    const missingTriggers = expectedViews.filter(
      (view) => !document.querySelector(`[data-view-trigger="${view}"]`)
    );
    addResult({
      id: "ui:views",
      title: "Views do admin registradas",
      status: missingViews.length || missingTriggers.length ? "fail" : "pass",
      severity: "critical",
      detail:
        missingViews.length || missingTriggers.length
          ? `Views faltando: ${missingViews.join(", ") || "-"}; triggers faltando: ${
              missingTriggers.join(", ") || "-"
            }`
          : "Todas as views e triggers estao presentes.",
    });

    addDomCheck("ui:forms", "Botoes de salvar presentes", "[data-user-create-save]", "major");
    addDomCheck("ui:forms-service", "Botao salvar servico presente", "[data-service-save]", "major");
    addDomCheck("ui:forms-product", "Botao salvar produto presente", "[data-product-save]", "major");
    addDomCheck("ui:errors", "Area de erros do usuarios", "[data-users-error]", "minor");
    addDomCheck("ui:price-error", "Erro de preco no formulario", "[data-price-error]", "minor");

    const token = getToken();
    if (!token) {
      addResult({
        id: "api:auth",
        title: "Token de autenticacao",
        status: "skip",
        severity: "critical",
        detail: "Nenhum token encontrado. Testes de API foram ignorados.",
      });
      skippedApiPaths.forEach((path) => {
        addResult({
          id: `api:${path}`,
          title: `API ${path}`,
          status: "skip",
          severity: "major",
          detail: "Ignorado por falta de autenticacao.",
        });
      });
      renderTestResults(results);
      updateTestsSummary(results);
      if (testsLastRun) testsLastRun.textContent = `Ultima execucao: ${new Date().toLocaleString("pt-BR")}`;
      return;
    }

    addResult({
      id: "api:auth",
      title: "Token de autenticacao",
      status: "pass",
      severity: "critical",
      detail: "Token presente.",
    });

    for (const check of apiChecks) {
      try {
        await apiJson(check.path);
        addResult({
          id: check.id,
          title: check.title,
          status: "pass",
          severity: check.severity,
          detail: "Resposta OK.",
        });
      } catch (error) {
        addResult({
          id: check.id,
          title: check.title,
          status: "fail",
          severity: check.severity,
          detail: error instanceof Error ? error.message : "Falha ao acessar endpoint.",
        });
      }
    }

    const allowWriteTests =
      localStorage.getItem("admin_tests_write") === "true" ||
      ["localhost", "127.0.0.1"].includes(window.location.hostname);

    if (!allowWriteTests) {
      addResult({
        id: "api:write",
        title: "Testes de gravacao (create/delete)",
        status: "skip",
        severity: "major",
        detail: "Desativado por seguranca. Defina localStorage admin_tests_write=true.",
      });
    } else {
      try {
        const servicePayload = {
          name: `Teste Auto Servico ${Date.now()}`,
          description: "Teste automatizado",
          price: 1,
          durationMin: 10,
          isFeatured: false,
        };
        const createdService = await apiJson<{ id: number }>("/services", {
          method: "POST",
          body: JSON.stringify(servicePayload),
        });
        if (!createdService?.id) throw new Error("ID do servico nao retornado.");
        await apiJson(`/services/${createdService.id}`, { method: "DELETE" });
        addResult({
          id: "api:write-service",
          title: "Criar e remover servico",
          status: "pass",
          severity: "major",
          detail: "Servico criado e removido com sucesso.",
        });
      } catch (error) {
        addResult({
          id: "api:write-service",
          title: "Criar e remover servico",
          status: "fail",
          severity: "major",
          detail: error instanceof Error ? error.message : "Falha no teste de gravacao.",
        });
      }

      try {
        const productPayload = {
          name: `Teste Auto Produto ${Date.now()}`,
          description: "Teste automatizado",
          price: 1,
          isFeatured: false,
        };
        const createdProduct = await apiJson<{ id: number }>("/products", {
          method: "POST",
          body: JSON.stringify(productPayload),
        });
        if (!createdProduct?.id) throw new Error("ID do produto nao retornado.");
        await apiJson(`/products/${createdProduct.id}`, { method: "DELETE" });
        addResult({
          id: "api:write-product",
          title: "Criar e remover produto",
          status: "pass",
          severity: "major",
          detail: "Produto criado e removido com sucesso.",
        });
      } catch (error) {
        addResult({
          id: "api:write-product",
          title: "Criar e remover produto",
          status: "fail",
          severity: "major",
          detail: error instanceof Error ? error.message : "Falha no teste de gravacao.",
        });
      }
    }

    try {
      const invalidResponse = await fetch(`${apiUrl}/api/services`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "" }),
      });
      addResult({
        id: "api:validation",
        title: "Validacao critica de servicos",
        status: invalidResponse.status === 400 ? "pass" : "warn",
        severity: "minor",
        detail:
          invalidResponse.status === 400
            ? "API rejeitou payload invalido (400)."
            : `Status inesperado: ${invalidResponse.status}`,
      });
    } catch (error) {
      addResult({
        id: "api:validation",
        title: "Validacao critica de servicos",
        status: "warn",
        severity: "minor",
        detail: error instanceof Error ? error.message : "Falha ao validar resposta.",
      });
    }

    renderTestResults(results);
    updateTestsSummary(results);
    if (testsLastRun) testsLastRun.textContent = `Ultima execucao: ${new Date().toLocaleString("pt-BR")}`;
  };

  if (!testsRunButton) return;

  addCleanup(
    on(testsRunButton, "click", async () => {
      setTestsLoading(true);
      try {
        await runAdminTests();
      } finally {
        setTestsLoading(false);
      }
    })
  );
};
