import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getToken } from "../../../lib/auth";
import { logger } from "../../../utils/logger";
import { usePortalTarget } from "../../../shared/usePortalTarget";

/**
 * PLAN-0020 — BI compacto de vendas & estoque, recortado por papel NO SERVIDOR:
 * o endpoint /dashboard/sales-insights devolve só o que o usuário pode ver
 * (funcionário: próprias vendas; gerente: unidade; admin: tudo).
 */

const REFRESH_INTERVAL_MS = 60 * 1000;

type SalesInsights = {
  totals: {
    revenue: number;
    ordersPaid: number;
    avgTicket: number;
    itemsSold: number;
    cmv: number;
    grossProfit: number;
    marginPercent: number;
  };
  byChannel: Array<{ channel: string; revenue: number; orders: number }>;
  topProducts: Array<{ productId: number; name: string; quantity: number; revenue: number; profit: number }>;
  topSellers: Array<{ userId: number; name: string; revenue: number; orders: number }>;
  topCustomers: Array<{ customer: string; revenue: number; orders: number }>;
};

type InventoryOverview = {
  units: Array<{
    unitId: number;
    unitName: string;
    isOnline: boolean;
    items: number;
    stockValue: number;
    outOfStock: number;
    lowStock: number;
  }>;
  consolidated: { stockValue: number; outOfStock: number; lowStock: number; excessStock: number };
};

const CHANNEL_LABEL: Record<string, string> = {
  SITE: "Site",
  APP: "App",
  ADMIN: "Balcão",
  WHATSAPP: "WhatsApp",
};

const formatBRL = (value: number): string =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const getApiUrl = (): string => import.meta.env.VITE_API_URL || "";

const fetchJson = async <T,>(path: string, token: string): Promise<T> => {
  const response = await fetch(`${getApiUrl()}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { message?: string; detail?: string };
    throw new Error(payload.detail || payload.message || `HTTP ${response.status}`);
  }
  return (await response.json()) as T;
};

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white rounded-xl border border-[#cfe7d1] shadow-sm p-4 flex flex-col gap-2">
    <p className="text-text-muted text-xs font-medium uppercase tracking-wider">{title}</p>
    {children}
  </div>
);

export const AdminDashboardInsightsIsland = () => {
  const [insights, setInsights] = useState<SalesInsights | null>(null);
  const [inventory, setInventory] = useState<InventoryOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const target = usePortalTarget("[data-react-admin-dashboard-insights]");

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const data = await fetchJson<SalesInsights>("/api/dashboard/sales-insights?days=30", token);
      setInsights(data);
      setError(null);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Falha ao carregar BI.";
      logger.warn("Falha ao carregar sales-insights", { error: message });
      setError(message);
    }
    try {
      // Gerente/admin apenas — 403 para funcionário é esperado (esconde o painel).
      const data = await fetchJson<InventoryOverview>("/api/dashboard/inventory-overview", token);
      setInventory(data);
    } catch {
      setInventory(null);
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(), REFRESH_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [load]);

  if (!target) return null;

  const totals = insights?.totals;

  return createPortal(
    <section className="flex flex-col gap-4">
      <h3 className="text-forest text-xl font-bold">Vendas & Estoque — últimos 30 dias</h3>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Card title="Receita (pedidos pagos)">
          <p className="text-forest-green text-2xl display-number text-shadow-strong">
            {totals ? formatBRL(totals.revenue) : "—"}
          </p>
          <span className="text-xs text-text-muted">
            {totals ? `${totals.ordersPaid} vendas · ticket ${formatBRL(totals.avgTicket)}` : "Carregando..."}
          </span>
        </Card>
        <Card title="CMV / Margem">
          <p className="text-forest-green text-2xl display-number text-shadow-strong">
            {totals ? `${totals.marginPercent.toFixed(1)}%` : "—"}
          </p>
          <span className="text-xs text-text-muted">
            {totals ? `CMV ${formatBRL(totals.cmv)} · lucro ${formatBRL(totals.grossProfit)}` : "Carregando..."}
          </span>
        </Card>
        <Card title="Valor de estoque">
          <p className="text-forest-green text-2xl display-number text-shadow-strong">
            {inventory ? formatBRL(inventory.consolidated.stockValue) : "—"}
          </p>
          <span className="text-xs text-text-muted">
            {inventory ? `${inventory.units.length} unidade(s)` : "Somente gerente/admin"}
          </span>
        </Card>
        <Card title="Ruptura / baixo estoque">
          <p className="text-forest-green text-2xl display-number text-shadow-strong">
            {inventory
              ? `${inventory.consolidated.outOfStock} · ${inventory.consolidated.lowStock}`
              : "—"}
          </p>
          <span className="text-xs text-text-muted">esgotados · abaixo do mínimo</span>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="Top produtos (qtd vendida)">
          {insights?.topProducts.length ? (
            <ul className="flex flex-col gap-1 text-sm">
              {insights.topProducts.slice(0, 5).map((product) => (
                <li key={product.productId} className="flex justify-between gap-2 border-b border-[#f4f0e7] py-1">
                  <span className="truncate">{product.name}</span>
                  <span className="whitespace-nowrap font-medium">
                    {product.quantity}× · {formatBRL(product.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-text-muted">Sem vendas de produto no período.</p>
          )}
        </Card>
        <Card title="Quem vendeu mais">
          {insights?.topSellers.length ? (
            <ul className="flex flex-col gap-1 text-sm">
              {insights.topSellers.slice(0, 5).map((seller) => (
                <li key={seller.userId} className="flex justify-between gap-2 border-b border-[#f4f0e7] py-1">
                  <span className="truncate">{seller.name}</span>
                  <span className="whitespace-nowrap font-medium">
                    {seller.orders} vendas · {formatBRL(seller.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-text-muted">Sem vendas atribuídas a vendedor no período.</p>
          )}
        </Card>
        <Card title="Por canal">
          {insights?.byChannel.length ? (
            <ul className="flex flex-col gap-1 text-sm">
              {insights.byChannel.map((channel) => (
                <li key={channel.channel} className="flex justify-between gap-2 border-b border-[#f4f0e7] py-1">
                  <span>{CHANNEL_LABEL[channel.channel] || channel.channel}</span>
                  <span className="whitespace-nowrap font-medium">
                    {channel.orders} · {formatBRL(channel.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-text-muted">Sem vendas no período.</p>
          )}
        </Card>
      </div>
    </section>,
    target
  );
};
