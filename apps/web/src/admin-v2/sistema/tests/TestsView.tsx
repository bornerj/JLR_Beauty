import { useCallback, useState } from "react";
import { getToken } from "../../../lib/auth";
import { pingApi, apiRequest } from "../../shared/api";

/**
 * Admin V2 (PLAN-0026, Onda 10) — Testes e Validação, tier M (legado tinha `behavior.ts`
 * imperativo, 385 linhas). **Escopo deliberadamente reduzido em relação ao legado**: o
 * legado misturava checagens de API (13 endpoints) com checagens de **DOM do shell legado**
 * (`.top-nav`, `.site-footer`, `[data-view="..."]`, `[data-view-trigger="..."]`,
 * `[data-user-create-save]`, `[data-service-save]`, `[data-product-save]`, etc.) — esses
 * seletores não existem e nunca vão existir no Admin V2 (é uma árvore React totalmente
 * diferente, sem os hooks `data-view`/`data-*-save` do shell antigo). Portar essas
 * checagens 1:1 faria a tela sempre mostrar "FALHA" pra elementos que nunca existiram aqui,
 * um falso-negativo permanente e enganoso. A tela nativa mantém só o que é **verificável e
 * significativo nesta app**: saúde dos endpoints de API (mesmos 13, mesma lista), teste de
 * gravação (criar+excluir serviço/produto, mesmo gate de segurança `admin_tests_write`) e
 * checagem de validação de payload inválido — tudo isso testa o **backend compartilhado**,
 * que é o que realmente importa (o backend é o mesmo pros dois frontends).
 */

type TestStatus = "pass" | "fail" | "warn" | "skip";
type TestSeverity = "critical" | "major" | "minor";
type TestResult = { id: string; title: string; status: TestStatus; severity: TestSeverity; detail: string };

const STATUS_BADGE_CLASS: Record<TestStatus, string> = {
  pass: "bg-state-healthy/15 text-state-healthy",
  warn: "bg-state-attention/15 text-state-attention",
  fail: "bg-state-critical/15 text-state-critical",
  skip: "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400",
};

const STATUS_LABELS: Record<TestStatus, string> = { pass: "PASSOU", warn: "AVISO", fail: "FALHOU", skip: "IGNORADO" };

const SKIPPED_API_PATHS = [
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

const API_CHECKS: Array<{ id: string; title: string; path: string; severity: TestSeverity }> = [
  { id: "api:users", title: "API /users lista", path: "/users", severity: "critical" },
  { id: "api:services", title: "API /services lista", path: "/services", severity: "critical" },
  { id: "api:products", title: "API /products lista", path: "/products", severity: "critical" },
  { id: "api:discount-coupons", title: "API /discount-coupons lista", path: "/discount-coupons", severity: "major" },
  { id: "api:memberships", title: "API /memberships lista", path: "/memberships", severity: "major" },
  { id: "api:orders", title: "API /orders lista", path: "/orders", severity: "major" },
  { id: "api:dashboard-kpis", title: "API /admin/dashboard/kpis", path: "/admin/dashboard/kpis", severity: "major" },
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
  { id: "api:concierge-sessions", title: "API /concierge/sessions lista", path: "/concierge/sessions", severity: "major" },
  { id: "api:franchise-leads", title: "API /franchise-leads lista", path: "/franchise-leads", severity: "major" },
];

export function TestsView() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);

  const counts = results.reduce(
    (acc, item) => {
      acc[item.status] += 1;
      return acc;
    },
    { pass: 0, warn: 0, fail: 0, skip: 0 } as Record<TestStatus, number>
  );

  const runTests = useCallback(async () => {
    setRunning(true);
    const collected: TestResult[] = [];
    const add = (result: TestResult) => collected.push(result);

    const token = getToken();
    if (!token) {
      add({ id: "api:auth", title: "Token de autenticação", status: "skip", severity: "critical", detail: "Nenhum token encontrado. Testes de API foram ignorados." });
      for (const path of SKIPPED_API_PATHS) {
        add({ id: `api:${path}`, title: `API ${path}`, status: "skip", severity: "major", detail: "Ignorado por falta de autenticação." });
      }
      setResults(collected);
      setLastRun(new Date().toLocaleString("pt-BR"));
      setRunning(false);
      return;
    }

    add({ id: "api:auth", title: "Token de autenticação", status: "pass", severity: "critical", detail: "Token presente." });

    for (const check of API_CHECKS) {
      try {
        await pingApi({ token, path: check.path });
        add({ id: check.id, title: check.title, status: "pass", severity: check.severity, detail: "Resposta OK." });
      } catch (error) {
        add({
          id: check.id,
          title: check.title,
          status: "fail",
          severity: check.severity,
          detail: error instanceof Error ? error.message : "Falha ao acessar endpoint.",
        });
      }
    }

    // Mesmo gate de segurança do legado: gravação só roda em localhost ou com opt-in explícito.
    const allowWriteTests =
      window.localStorage.getItem("admin_tests_write") === "true" || ["localhost", "127.0.0.1"].includes(window.location.hostname);

    if (!allowWriteTests) {
      add({
        id: "api:write",
        title: "Testes de gravação (create/delete)",
        status: "skip",
        severity: "major",
        detail: "Desativado por segurança. Defina localStorage admin_tests_write=true.",
      });
    } else {
      {
        // ERR-0079: POST e DELETE isolados — se o registro chegar a ser criado e só o
        // DELETE falhar, o teste precisa dizer isso explicitamente (fica órfão no
        // catálogo real), não reportar a mesma "falha no teste" genérica de sempre.
        let createdId: number | undefined;
        try {
          const servicePayload = { name: `Teste Auto Serviço ${Date.now()}`, description: "Teste automatizado", price: 1, durationMin: 10, isFeatured: false };
          const created = await apiRequest({ token, path: "/services", method: "POST", body: servicePayload });
          createdId = (created.json as { id?: number } | null)?.id;
          if (!createdId) throw new Error("ID do serviço não retornado.");
          await apiRequest({ token, path: `/services/${createdId}`, method: "DELETE" });
          add({ id: "api:write-service", title: "Criar e remover serviço", status: "pass", severity: "major", detail: "Serviço criado e removido com sucesso." });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Falha no teste de gravação.";
          add({
            id: "api:write-service",
            title: "Criar e remover serviço",
            status: "fail",
            severity: "major",
            detail: createdId
              ? `Serviço #${createdId} foi criado mas não pôde ser removido (${message}) — ficou órfão no catálogo real, precisa de exclusão manual.`
              : message,
          });
        }
      }

      {
        let createdId: number | undefined;
        try {
          const productPayload = { name: `Teste Auto Produto ${Date.now()}`, description: "Teste automatizado", price: 1, isFeatured: false };
          const created = await apiRequest({ token, path: "/products", method: "POST", body: productPayload });
          createdId = (created.json as { id?: number } | null)?.id;
          if (!createdId) throw new Error("ID do produto não retornado.");
          await apiRequest({ token, path: `/products/${createdId}`, method: "DELETE" });
          add({ id: "api:write-product", title: "Criar e remover produto", status: "pass", severity: "major", detail: "Produto criado e removido com sucesso." });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Falha no teste de gravação.";
          add({
            id: "api:write-product",
            title: "Criar e remover produto",
            status: "fail",
            severity: "major",
            detail: createdId
              ? `Produto #${createdId} foi criado mas não pôde ser removido (${message}) — ficou órfão no catálogo real, precisa de exclusão manual.`
              : message,
          });
        }
      }
    }

    try {
      const invalid = await apiRequest({ token, path: "/services", method: "POST", body: { name: "" } });
      add({
        id: "api:validation",
        title: "Validação crítica de serviços",
        status: invalid.status === 400 ? "pass" : "warn",
        severity: "minor",
        detail: invalid.status === 400 ? "API rejeitou payload inválido (400)." : `Status inesperado: ${invalid.status}`,
      });
    } catch (error) {
      add({ id: "api:validation", title: "Validação crítica de serviços", status: "warn", severity: "minor", detail: error instanceof Error ? error.message : "Falha ao validar resposta." });
    }

    setResults(collected);
    setLastRun(new Date().toLocaleString("pt-BR"));
    setRunning(false);
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-forest">Testes e Validação</h1>
          <p className="text-base text-stone-600 dark:text-stone-400">executa verificações de saúde da API pra garantir funcionamento</p>
        </div>
        <button
          type="button"
          onClick={() => void runTests()}
          disabled={running}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-base">{running ? "progress_activity" : "playlist_play"}</span>
          {running ? "Executando…" : "Executar testes"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-[#cfe7d1] bg-white p-4 dark:border-forest-green dark:bg-forest">
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">Passaram</p>
          <p className="mt-2 text-3xl font-bold text-forest">{counts.pass}</p>
        </div>
        <div className="rounded-xl border border-[#cfe7d1] bg-white p-4 dark:border-forest-green dark:bg-forest">
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">Avisos</p>
          <p className="mt-2 text-3xl font-bold text-forest">{counts.warn}</p>
        </div>
        <div className="rounded-xl border border-[#cfe7d1] bg-white p-4 dark:border-forest-green dark:bg-forest">
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">Falhas</p>
          <p className="mt-2 text-3xl font-bold text-forest">{counts.fail}</p>
        </div>
        <div className="rounded-xl border border-[#cfe7d1] bg-white p-4 dark:border-forest-green dark:bg-forest">
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">Ignorados</p>
          <p className="mt-2 text-3xl font-bold text-forest">{counts.skip}</p>
        </div>
      </div>

      <div className="rounded-xl border border-[#cfe7d1] bg-white dark:border-forest-green dark:bg-forest">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#cfe7d1] px-4 py-3 dark:border-forest-green">
          <h3 className="text-base font-semibold text-forest">Resultados</h3>
          <span className="text-xs text-stone-500 dark:text-stone-400">Última execução: {lastRun ?? "—"}</span>
        </div>
        <div className="divide-y divide-stone-100 dark:divide-forest-green/40">
          {results.length === 0 ? (
            <div className="p-4 text-sm text-stone-500 dark:text-stone-400">Nenhuma execução ainda.</div>
          ) : (
            results.map((result) => (
              <div key={result.id} className="flex flex-col gap-2 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${STATUS_BADGE_CLASS[result.status]}`}>
                      {STATUS_LABELS[result.status]}
                    </span>
                    <span className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400">{result.severity}</span>
                  </div>
                  <span className="text-xs text-stone-400">{result.id}</span>
                </div>
                <div className="text-sm font-semibold text-forest">{result.title}</div>
                <div className="text-xs text-stone-500 dark:text-stone-400">{result.detail}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gold/40 bg-primary/5 p-4 text-sm text-forest">
        <p className="mb-1 font-semibold">Observações</p>
        <p>
          Testes de API exigem usuário autenticado. Testes de gravação (create/delete) só rodam em localhost ou com{" "}
          <code>localStorage.admin_tests_write=&quot;true&quot;</code>; criam dados temporários e removem em seguida.
        </p>
      </div>
    </div>
  );
}
