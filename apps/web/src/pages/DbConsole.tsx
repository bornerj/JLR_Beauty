import { type ReactElement, useMemo, useState } from "react";
import { getToken } from "../lib/auth";

type TableConfig = {
  key: string;
  label: string;
  endpoint: string;
};

type RowData = Record<string, unknown>;

const API_URL = import.meta.env.VITE_API_URL || "";

const TABLES: ReadonlyArray<TableConfig> = [
  { key: "settings", label: "Settings", endpoint: "/settings" },
  { key: "product_categories", label: "ProductCategory", endpoint: "/product-categories" },
  { key: "service_categories", label: "ServiceCategory", endpoint: "/service-categories" },
  { key: "product_statuses", label: "ProductStatus", endpoint: "/product-statuses" },
  { key: "service_statuses", label: "ServiceStatus", endpoint: "/service-statuses" },
  { key: "products", label: "Product", endpoint: "/products" },
  { key: "services", label: "Service", endpoint: "/services" },
  { key: "memberships", label: "Membership", endpoint: "/memberships" },
  { key: "subscriptions", label: "Subscription", endpoint: "/subscriptions" },
  { key: "orders", label: "Order", endpoint: "/orders" },
  { key: "order_items", label: "OrderItem", endpoint: "/order-items" },
  { key: "payments", label: "Payment", endpoint: "/payments" },
  { key: "units", label: "Unit", endpoint: "/units" },
  { key: "professionals", label: "Professional", endpoint: "/professionals" },
  { key: "appointments", label: "Appointment", endpoint: "/appointments" },
  { key: "franchise_leads", label: "FranchiseLead", endpoint: "/franchise-leads" },
  { key: "users", label: "User", endpoint: "/users" },
];

const toRowData = (value: unknown): RowData => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as RowData;
  }
  return { value };
};

const stringifyCell = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
};

const buildColumns = (rows: ReadonlyArray<RowData>): string[] => {
  const columns = new Set<string>();
  rows.forEach((row) => {
    Object.keys(row).forEach((key) => columns.add(key));
  });
  return Array.from(columns);
};

const nowLabel = (): string => new Date().toLocaleString("pt-BR");

export default function DbConsolePage(): ReactElement {
  const [activeTable, setActiveTable] = useState<TableConfig>(TABLES[0]);
  const [rows, setRows] = useState<RowData[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("Selecione uma tabela para carregar.");
  const [logs, setLogs] = useState<string[]>([]);

  const hasRows = rows.length > 0;

  const logText = useMemo(() => logs.join("\n"), [logs]);

  const appendLog = (line: string): void => {
    setLogs((prev) => [`[${nowLabel()}] ${line}`, ...prev].slice(0, 200));
  };

  const fetchTableData = async (table: TableConfig): Promise<void> => {
    setActiveTable(table);
    setIsLoading(true);
    try {
      const token = getToken();
      if (!token) {
        throw new Error("Sessão expirada. Faça login novamente.");
      }

      const response = await fetch(`${API_URL}/api${table.endpoint}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          message?: string;
          detail?: string;
        };
        const message = data.message || "Falha ao buscar dados.";
        const detail = data.detail ? ` (${data.detail})` : "";
        throw new Error(`${message}${detail} [HTTP ${response.status}]`);
      }

      const payload = (await response.json()) as unknown;
      const dataRows = Array.isArray(payload) ? payload.map((item) => toRowData(item)) : [toRowData(payload)];
      const dataColumns = buildColumns(dataRows);

      setRows(dataRows);
      setColumns(dataColumns);
      const okMessage = `${table.label}: ${dataRows.length} registro(s) carregado(s).`;
      setStatusMessage(okMessage);
      appendLog(`OK - ${okMessage}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido no fetch.";
      setRows([]);
      setColumns([]);
      setStatusMessage(`Erro em ${table.label}: ${message}`);
      appendLog(`ERRO - ${table.label}: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background-light p-6 md:p-8">
      <section className="mx-auto max-w-[96vw] rounded-2xl border border-stone-200 bg-white p-5 shadow-sm md:p-6">
        <header className="mb-5 flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-forest-green">DB Console</h1>
          <p className="text-sm text-stone-500">
            Clique em uma tabela para executar o fetch e visualizar o resultado na grid abaixo.
          </p>
        </header>

        <div className="mb-5 flex flex-wrap gap-2 border-b border-stone-200 pb-4">
          {TABLES.map((table) => {
            const isActive = table.key === activeTable.key;
            return (
              <button
                key={table.key}
                type="button"
                disabled={isLoading}
                onClick={() => {
                  void fetchTableData(table);
                }}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-colors ${
                  isActive
                    ? "border-forest-green bg-forest-green text-white"
                    : "border-stone-300 bg-white text-stone-700 hover:bg-stone-100"
                } ${isLoading ? "cursor-wait opacity-80" : ""}`}
              >
                {table.label}
              </button>
            );
          })}
        </div>

        <div className="mb-3 text-sm font-medium text-stone-700">{statusMessage}</div>

        <div className="overflow-auto rounded-xl border border-stone-200">
          <table className="min-w-full border-collapse text-left text-xs">
            <thead className="bg-stone-50">
              <tr>
                {columns.map((column) => (
                  <th key={column} className="border-b border-stone-200 px-3 py-2 font-semibold text-stone-700">
                    {column}
                  </th>
                ))}
                {!hasRows && (
                  <th className="border-b border-stone-200 px-3 py-2 font-semibold text-stone-700">
                    resultado
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {!hasRows && (
                <tr>
                  <td className="px-3 py-3 text-stone-500">
                    {isLoading ? "Carregando..." : "Sem registros para exibir."}
                  </td>
                </tr>
              )}
              {rows.map((row, rowIndex) => (
                <tr key={`${activeTable.key}-${rowIndex}`} className="odd:bg-white even:bg-stone-50/40">
                  {columns.map((column) => (
                    <td key={`${activeTable.key}-${rowIndex}-${column}`} className="max-w-[300px] px-3 py-2 align-top text-stone-700">
                      <pre className="whitespace-pre-wrap break-words font-mono text-[11px]">
                        {stringifyCell(row[column])}
                      </pre>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4">
          <label htmlFor="db-console-logs" className="mb-1 block text-sm font-semibold text-stone-700">
            Log de execução (sucesso/erro)
          </label>
          <textarea
            id="db-console-logs"
            readOnly
            value={logText}
            className="h-48 w-full rounded-xl border border-stone-300 bg-stone-50 p-3 font-mono text-xs text-stone-700"
          />
        </div>
      </section>
    </main>
  );
}
