import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AdminScopeProvider } from "./shell/AdminScopeProvider";
import { AdminShell } from "./shell/AdminShell";
import type { AdminBreadcrumbItem } from "./shell/AdminBreadcrumb";
import { PanoramaView } from "./panorama/PanoramaView";
import { NetworkView } from "./network/NetworkView";
import { UnitDetailView } from "./network/UnitDetailView";
import { OrdersBoardView } from "./operations/orders/OrdersBoardView";
import { CapacityView } from "./operations/agenda/CapacityView";
import { ProductMatrixView } from "./portfolio/products/ProductMatrixView";
import { ServiceMatrixView } from "./portfolio/services/ServiceMatrixView";
import { CustomersFlowView } from "./customers/CustomersFlowView";
import { SubscriptionHealthView } from "./customers/subscriptions/SubscriptionHealthView";
import { PipelineBoardView } from "./growth/franchises/PipelineBoardView";
import { RadarView } from "./radar/RadarView";
import { GargalosView } from "./gargalos/GargalosView";
import { MoneyView } from "./money/MoneyView";
import { ComparatorView } from "./comparator/ComparatorView";
import { InsightsView } from "./insights/InsightsView";

/**
 * Admin V2 (PLAN-0022) — raiz da árvore nova, isolada do shell legado (AdminContent.tsx).
 * Roteamento interno próprio (montado em "admin-v2/*" no App.tsx) para manter Panorama,
 * Rede e Diagnóstico da Unidade encapsulados neste módulo — App.tsx não conhece as
 * telas internas do Admin V2, só o ponto de entrada.
 */

type OperationsTabKey = "pedidos" | "agenda" | "produtos" | "servicos";

/**
 * Sub-abas do mundo "Operação" (Pedidos = Onda 3, Agenda = Onda 4, Produtos = Onda 5,
 * Serviços = Onda 6). "Portfólio" não tem slot próprio nos 7 "mundos" fixos da sidebar
 * (Onda 1) — nasce aqui, dentro de Operação, mesmo padrão já usado para Agenda na Onda 4.
 * Mesmo estilo visual dos presets de período da AdminTopbar.
 */
function OperationsTabs({ active }: { active: OperationsTabKey }) {
  const navigate = useNavigate();
  const tabs: Array<{ key: OperationsTabKey; label: string; path: string }> = [
    { key: "pedidos", label: "Pedidos", path: "/admin-v2/operacao" },
    { key: "agenda", label: "Agenda", path: "/admin-v2/operacao/agenda" },
    { key: "produtos", label: "Produtos", path: "/admin-v2/operacao/produtos" },
    { key: "servicos", label: "Serviços", path: "/admin-v2/operacao/servicos" },
  ];
  return (
    <div className="mb-4 flex w-fit rounded-full border border-gold/50 bg-white p-0.5 dark:bg-forest">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => navigate(tab.path)}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            active === tab.key ? "bg-primary text-white" : "text-forest hover:bg-primary/10"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

const OPERATIONS_SUBTAB_LABELS: Record<Exclude<OperationsTabKey, "pedidos">, string> = {
  agenda: "Agenda",
  produtos: "Produtos",
  servicos: "Serviços",
};

type CustomersTabKey = "fluxo" | "assinaturas";

/** Sub-abas do mundo "Clientes" (Fluxo = Onda 7, Assinaturas = Onda 8), mesmo padrão de `OperationsTabs`. */
function CustomersTabs({ active }: { active: CustomersTabKey }) {
  const navigate = useNavigate();
  const tabs: Array<{ key: CustomersTabKey; label: string; path: string }> = [
    { key: "fluxo", label: "Fluxo", path: "/admin-v2/clientes" },
    { key: "assinaturas", label: "Assinaturas", path: "/admin-v2/clientes/assinaturas" },
  ];
  return (
    <div className="mb-4 flex w-fit rounded-full border border-gold/50 bg-white p-0.5 dark:bg-forest">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => navigate(tab.path)}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            active === tab.key ? "bg-primary text-white" : "text-forest hover:bg-primary/10"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

type IntelligenceTabKey = "radar" | "gargalos" | "dinheiro" | "comparador" | "insights";

/**
 * Sub-abas da leva de Inteligência (PLAN-0023): Radar Executivo (Onda 1), Gargalos
 * (Onda 2), Dinheiro (Onda 3), Comparador (Onda 4) e Insights (Onda 6). Nenhum tem
 * "mundo" próprio nos 7 fixos da sidebar (Onda 1 do PLAN-0022) — nascem dentro de
 * Panorama, mesmo padrão já usado para Agenda/Produtos/Serviços dentro de Operação.
 */
function IntelligenceTabs({ active }: { active: IntelligenceTabKey }) {
  const navigate = useNavigate();
  const tabs: Array<{ key: IntelligenceTabKey; label: string; path: string }> = [
    { key: "radar", label: "Radar", path: "/admin-v2/radar" },
    { key: "gargalos", label: "Gargalos", path: "/admin-v2/gargalos" },
    { key: "dinheiro", label: "Dinheiro", path: "/admin-v2/dinheiro" },
    { key: "comparador", label: "Comparador", path: "/admin-v2/comparador" },
    { key: "insights", label: "Insights", path: "/admin-v2/insights" },
  ];
  return (
    <div className="mb-4 flex w-fit rounded-full border border-gold/50 bg-white p-0.5 dark:bg-forest">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => navigate(tab.path)}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            active === tab.key ? "bg-primary text-white" : "text-forest hover:bg-primary/10"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

const INTELLIGENCE_TAB_LABELS: Record<IntelligenceTabKey, string> = {
  radar: "Radar Executivo",
  gargalos: "Gargalos",
  dinheiro: "Onde está o dinheiro?",
  comparador: "Comparador de Unidades",
  insights: "Insights",
};

function AdminV2Shell() {
  const location = useLocation();
  const navigate = useNavigate();

  const isNetworkArea = location.pathname.includes("/rede");
  const isUnitDetail = /\/rede\/[^/]+\/?$/.test(location.pathname);
  const isOperationsArea = location.pathname.includes("/operacao");
  const isAgendaArea = location.pathname.includes("/operacao/agenda");
  const isProdutosArea = location.pathname.includes("/operacao/produtos");
  const isServicosArea = location.pathname.includes("/operacao/servicos");
  const isCustomersArea = location.pathname.includes("/clientes");
  const isSubscriptionsArea = location.pathname.includes("/clientes/assinaturas");
  const isGrowthArea = location.pathname.includes("/crescimento");
  const isRadarArea = location.pathname.includes("/radar");
  const isGargalosArea = location.pathname.includes("/gargalos");
  const isMoneyArea = location.pathname.includes("/dinheiro");
  const isComparatorArea = location.pathname.includes("/comparador");
  const isInsightsArea = location.pathname.includes("/insights");
  const isIntelligenceArea = isRadarArea || isGargalosArea || isMoneyArea || isComparatorArea || isInsightsArea;
  const intelligenceTab: IntelligenceTabKey = isGargalosArea
    ? "gargalos"
    : isMoneyArea
      ? "dinheiro"
      : isComparatorArea
        ? "comparador"
        : isInsightsArea
          ? "insights"
          : "radar";
  const customersTab: CustomersTabKey = isSubscriptionsArea ? "assinaturas" : "fluxo";
  const activeTab: OperationsTabKey = isAgendaArea
    ? "agenda"
    : isProdutosArea
      ? "produtos"
      : isServicosArea
        ? "servicos"
        : "pedidos";
  const activeKey = isOperationsArea
    ? "operacao"
    : isNetworkArea
      ? "rede"
      : isCustomersArea
        ? "clientes"
        : isGrowthArea
          ? "crescimento"
          : "panorama";

  const breadcrumb: AdminBreadcrumbItem[] = [{ label: "Panorama", onNavigate: () => navigate("/admin-v2") }];
  if (isNetworkArea) {
    breadcrumb.push({
      label: "Rede",
      onNavigate: isUnitDetail ? () => navigate("/admin-v2/rede") : undefined,
    });
  }
  if (isOperationsArea) {
    breadcrumb.push({
      label: "Operação",
      onNavigate: activeTab !== "pedidos" ? () => navigate("/admin-v2/operacao") : undefined,
    });
  }
  if (activeTab !== "pedidos" && isOperationsArea) {
    breadcrumb.push({ label: OPERATIONS_SUBTAB_LABELS[activeTab] });
  }
  if (isCustomersArea) {
    breadcrumb.push({
      label: "Clientes",
      onNavigate: isSubscriptionsArea ? () => navigate("/admin-v2/clientes") : undefined,
    });
  }
  if (isSubscriptionsArea) {
    breadcrumb.push({ label: "Assinaturas" });
  }
  if (isGrowthArea) {
    breadcrumb.push({ label: "Crescimento" });
  }
  if (isIntelligenceArea) {
    breadcrumb.push({
      label: "Inteligência",
      onNavigate: () => navigate("/admin-v2/radar"),
    });
    breadcrumb.push({ label: INTELLIGENCE_TAB_LABELS[intelligenceTab] });
  }

  return (
    <AdminShell activeKey={activeKey} breadcrumb={breadcrumb}>
      {isOperationsArea && <OperationsTabs active={activeTab} />}
      {isCustomersArea && <CustomersTabs active={customersTab} />}
      {isIntelligenceArea && <IntelligenceTabs active={intelligenceTab} />}
      <Routes>
        <Route index element={<PanoramaView />} />
        <Route path="rede" element={<NetworkView />} />
        <Route path="rede/:unitId" element={<UnitDetailView />} />
        <Route path="operacao" element={<OrdersBoardView />} />
        <Route path="operacao/agenda" element={<CapacityView />} />
        <Route path="operacao/produtos" element={<ProductMatrixView />} />
        <Route path="operacao/servicos" element={<ServiceMatrixView />} />
        <Route path="clientes" element={<CustomersFlowView />} />
        <Route path="clientes/assinaturas" element={<SubscriptionHealthView />} />
        <Route path="crescimento" element={<PipelineBoardView />} />
        <Route path="radar" element={<RadarView />} />
        <Route path="gargalos" element={<GargalosView />} />
        <Route path="dinheiro" element={<MoneyView />} />
        <Route path="comparador" element={<ComparatorView />} />
        <Route path="insights" element={<InsightsView />} />
      </Routes>
    </AdminShell>
  );
}

export function AdminV2Root() {
  return (
    <AdminScopeProvider>
      <AdminV2Shell />
    </AdminScopeProvider>
  );
}
