import type { AdminV2Unit, PanoramaSnapshot } from "../panorama/types";
import type { NetworkBoard, UnitDiagnostic } from "../network/types";
import type { OrdersBoard, OrdersFlow } from "../operations/orders/types";
import type { CapacityHeatmap, SlotDetail } from "../operations/agenda/types";
import type { PortfolioProducts } from "../portfolio/products/types";
import type { ServicePerformanceList } from "../portfolio/services/types";
import type { CustomerFlow } from "../customers/types";
import type { SubscriptionHealth } from "../customers/subscriptions/types";
import type { FranchisePipeline } from "../growth/franchises/types";
import type { RadarBriefing } from "../radar/types";
import type { BottlenecksRanking } from "../gargalos/types";
import type { MoneyOverview } from "../money/types";
import type { UnitComparator } from "../comparator/types";
import type { InsightFeed } from "../insights/types";

/** Admin V2 (PLAN-0022) — cliente HTTP para /api/admin-v2/*, mesmo padrão de apps/web/src/modules/admin-kpis/api/client.ts. */

type ApiErrorPayload = { message?: string; detail?: string };

const getApiUrl = (): string => import.meta.env.VITE_API_URL || "";

const parseApiError = async (response: Response): Promise<string> => {
  const payload = (await response.json().catch(() => ({}))) as ApiErrorPayload;
  return payload.detail || payload.message || "Falha ao carregar dados do Admin V2.";
};

export const fetchPanorama = async (args: {
  token: string;
  days?: number;
  unitIds?: number[];
}): Promise<PanoramaSnapshot> => {
  const params = new URLSearchParams();
  if (args.days !== undefined) params.set("days", String(args.days));
  if (args.unitIds && args.unitIds.length > 0) params.set("unitIds", args.unitIds.join(","));
  const suffix = params.toString();
  const path = suffix ? `/api/admin-v2/panorama?${suffix}` : "/api/admin-v2/panorama";

  const response = await fetch(`${getApiUrl()}${path}`, {
    headers: { Authorization: `Bearer ${args.token}` },
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
  return (await response.json()) as PanoramaSnapshot;
};

export const fetchNetworkBoard = async (args: { token: string; days?: number; unitIds?: number[] }): Promise<NetworkBoard> => {
  const params = new URLSearchParams();
  if (args.days !== undefined) params.set("days", String(args.days));
  if (args.unitIds && args.unitIds.length > 0) params.set("unitIds", args.unitIds.join(","));
  const suffix = params.toString();
  const path = suffix ? `/api/admin-v2/network?${suffix}` : "/api/admin-v2/network";

  const response = await fetch(`${getApiUrl()}${path}`, {
    headers: { Authorization: `Bearer ${args.token}` },
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
  return (await response.json()) as NetworkBoard;
};

export const fetchUnitDiagnostic = async (args: {
  token: string;
  unitId: number;
  days?: number;
}): Promise<UnitDiagnostic> => {
  const params = new URLSearchParams();
  if (args.days !== undefined) params.set("days", String(args.days));
  const suffix = params.toString();
  const path = suffix
    ? `/api/admin-v2/network/units/${args.unitId}?${suffix}`
    : `/api/admin-v2/network/units/${args.unitId}`;

  const response = await fetch(`${getApiUrl()}${path}`, {
    headers: { Authorization: `Bearer ${args.token}` },
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
  return (await response.json()) as UnitDiagnostic;
};

export const fetchOrdersBoard = async (args: { token: string; days?: number; unitIds?: number[] }): Promise<OrdersBoard> => {
  const params = new URLSearchParams();
  if (args.days !== undefined) params.set("days", String(args.days));
  if (args.unitIds && args.unitIds.length > 0) params.set("unitIds", args.unitIds.join(","));
  const suffix = params.toString();
  const path = suffix ? `/api/admin-v2/operations/orders?${suffix}` : "/api/admin-v2/operations/orders";

  const response = await fetch(`${getApiUrl()}${path}`, {
    headers: { Authorization: `Bearer ${args.token}` },
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
  return (await response.json()) as OrdersBoard;
};

export const fetchOrdersFlow = async (args: { token: string; days?: number; unitIds?: number[] }): Promise<OrdersFlow> => {
  const params = new URLSearchParams();
  if (args.days !== undefined) params.set("days", String(args.days));
  if (args.unitIds && args.unitIds.length > 0) params.set("unitIds", args.unitIds.join(","));
  const suffix = params.toString();
  const path = suffix
    ? `/api/admin-v2/operations/orders/flow?${suffix}`
    : "/api/admin-v2/operations/orders/flow";

  const response = await fetch(`${getApiUrl()}${path}`, {
    headers: { Authorization: `Bearer ${args.token}` },
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
  return (await response.json()) as OrdersFlow;
};

export const fetchCapacityHeatmap = async (args: { token: string; unitId: number; days?: number }): Promise<CapacityHeatmap> => {
  const params = new URLSearchParams({ unitId: String(args.unitId) });
  if (args.days !== undefined) params.set("days", String(args.days));
  const response = await fetch(`${getApiUrl()}/api/admin-v2/operations/agenda/capacity?${params.toString()}`, {
    headers: { Authorization: `Bearer ${args.token}` },
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
  return (await response.json()) as CapacityHeatmap;
};

export const fetchSlotDetail = async (args: {
  token: string;
  unitId: number;
  date: string;
  hour: number;
  days?: number;
}): Promise<SlotDetail> => {
  const params = new URLSearchParams({ unitId: String(args.unitId), date: args.date, hour: String(args.hour) });
  if (args.days !== undefined) params.set("days", String(args.days));
  const response = await fetch(`${getApiUrl()}/api/admin-v2/operations/agenda/slots?${params.toString()}`, {
    headers: { Authorization: `Bearer ${args.token}` },
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
  return (await response.json()) as SlotDetail;
};

export const fetchPortfolioProducts = async (args: { token: string; days?: number; unitIds?: number[] }): Promise<PortfolioProducts> => {
  const params = new URLSearchParams();
  if (args.days !== undefined) params.set("days", String(args.days));
  if (args.unitIds && args.unitIds.length > 0) params.set("unitIds", args.unitIds.join(","));
  const suffix = params.toString();
  const path = suffix ? `/api/admin-v2/portfolio/products?${suffix}` : "/api/admin-v2/portfolio/products";

  const response = await fetch(`${getApiUrl()}${path}`, {
    headers: { Authorization: `Bearer ${args.token}` },
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
  return (await response.json()) as PortfolioProducts;
};

export const fetchServicePerformance = async (args: { token: string; days?: number; unitIds?: number[] }): Promise<ServicePerformanceList> => {
  const params = new URLSearchParams();
  if (args.days !== undefined) params.set("days", String(args.days));
  if (args.unitIds && args.unitIds.length > 0) params.set("unitIds", args.unitIds.join(","));
  const suffix = params.toString();
  const path = suffix ? `/api/admin-v2/portfolio/services?${suffix}` : "/api/admin-v2/portfolio/services";

  const response = await fetch(`${getApiUrl()}${path}`, {
    headers: { Authorization: `Bearer ${args.token}` },
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
  return (await response.json()) as ServicePerformanceList;
};

export const fetchCustomerFlow = async (args: { token: string; days?: number; unitIds?: number[] }): Promise<CustomerFlow> => {
  const params = new URLSearchParams();
  if (args.days !== undefined) params.set("days", String(args.days));
  if (args.unitIds && args.unitIds.length > 0) params.set("unitIds", args.unitIds.join(","));
  const suffix = params.toString();
  const path = suffix ? `/api/admin-v2/customers?${suffix}` : "/api/admin-v2/customers";

  const response = await fetch(`${getApiUrl()}${path}`, {
    headers: { Authorization: `Bearer ${args.token}` },
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
  return (await response.json()) as CustomerFlow;
};

/** Sem `unitIds`: `Subscription` não tem `unitId` no schema (mesma nota da Onda 1) — rede inteira sempre. */
export const fetchSubscriptionHealth = async (args: { token: string; days?: number }): Promise<SubscriptionHealth> => {
  const params = new URLSearchParams();
  if (args.days !== undefined) params.set("days", String(args.days));
  const suffix = params.toString();
  const path = suffix ? `/api/admin-v2/subscriptions/health?${suffix}` : "/api/admin-v2/subscriptions/health";

  const response = await fetch(`${getApiUrl()}${path}`, {
    headers: { Authorization: `Bearer ${args.token}` },
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
  return (await response.json()) as SubscriptionHealth;
};

/** Só leitura, sem filtro de período/unidade (pipeline comercial é sempre a foto do estado atual dos leads). */
/** Sem `unitIds`: rede inteira, mesmo escopo do Radar. */
export const fetchBottlenecksRanking = async (args: { token: string; days?: number }): Promise<BottlenecksRanking> => {
  const params = new URLSearchParams();
  if (args.days !== undefined) params.set("days", String(args.days));
  const suffix = params.toString();
  const path = suffix ? `/api/admin-v2/gargalos?${suffix}` : "/api/admin-v2/gargalos";

  const response = await fetch(`${getApiUrl()}${path}`, {
    headers: { Authorization: `Bearer ${args.token}` },
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
  return (await response.json()) as BottlenecksRanking;
};

/** Sem `unitIds`: decomposição financeira sempre de rede inteira (a quebra por unidade já vem embutida em `byUnit`). */
export const fetchMoneyOverview = async (args: { token: string; days?: number }): Promise<MoneyOverview> => {
  const params = new URLSearchParams();
  if (args.days !== undefined) params.set("days", String(args.days));
  const suffix = params.toString();
  const path = suffix ? `/api/admin-v2/money?${suffix}` : "/api/admin-v2/money";

  const response = await fetch(`${getApiUrl()}${path}`, {
    headers: { Authorization: `Bearer ${args.token}` },
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
  return (await response.json()) as MoneyOverview;
};

/** Sem `unitIds`: compara sempre a rede inteira — filtrar pra menos de 2 unidades tornaria a própria tela sem sentido. */
export const fetchUnitComparator = async (args: { token: string; days?: number }): Promise<UnitComparator> => {
  const params = new URLSearchParams();
  if (args.days !== undefined) params.set("days", String(args.days));
  const suffix = params.toString();
  const path = suffix ? `/api/admin-v2/comparator?${suffix}` : "/api/admin-v2/comparator";

  const response = await fetch(`${getApiUrl()}${path}`, {
    headers: { Authorization: `Bearer ${args.token}` },
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
  return (await response.json()) as UnitComparator;
};

/** Sem `unitIds`: consolida Radar+Gargalos+Comparador, todos já de rede inteira. */
export const fetchInsightFeed = async (args: { token: string; days?: number }): Promise<InsightFeed> => {
  const params = new URLSearchParams();
  if (args.days !== undefined) params.set("days", String(args.days));
  const suffix = params.toString();
  const path = suffix ? `/api/admin-v2/insights?${suffix}` : "/api/admin-v2/insights";

  const response = await fetch(`${getApiUrl()}${path}`, {
    headers: { Authorization: `Bearer ${args.token}` },
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
  return (await response.json()) as InsightFeed;
};

/** Sem `unitIds`: é um briefing de rede inteira, mesmo escopo do Panorama. */
export const fetchRadarBriefing = async (args: { token: string; days?: number }): Promise<RadarBriefing> => {
  const params = new URLSearchParams();
  if (args.days !== undefined) params.set("days", String(args.days));
  const suffix = params.toString();
  const path = suffix ? `/api/admin-v2/radar?${suffix}` : "/api/admin-v2/radar";

  const response = await fetch(`${getApiUrl()}${path}`, {
    headers: { Authorization: `Bearer ${args.token}` },
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
  return (await response.json()) as RadarBriefing;
};

export const fetchFranchisePipeline = async (args: { token: string }): Promise<FranchisePipeline> => {
  const response = await fetch(`${getApiUrl()}/api/admin-v2/growth/franchises/pipeline`, {
    headers: { Authorization: `Bearer ${args.token}` },
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
  return (await response.json()) as FranchisePipeline;
};

/** RETROFIT-010b — move um lead para outra etapa; devolve o pipeline inteiro já recalculado (mesmo formato do GET), sem precisar de um segundo fetch. */
export const moveFranchiseLeadStage = async (args: {
  token: string;
  leadId: number;
  stage: FranchisePipeline["stages"][number]["stage"];
}): Promise<FranchisePipeline> => {
  const response = await fetch(`${getApiUrl()}/api/admin-v2/growth/franchises/${args.leadId}/stage`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${args.token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ stage: args.stage }),
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
  return (await response.json()) as FranchisePipeline;
};

/** Reutiliza a mesma rota de unidades já usada pelo módulo de estoque (PLAN-0020) — sem endpoint novo. */
export const fetchAdminV2Units = async (args: { token: string }): Promise<AdminV2Unit[]> => {
  const response = await fetch(`${getApiUrl()}/api/inventory/units`, {
    headers: { Authorization: `Bearer ${args.token}` },
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
  const payload = (await response.json()) as { units: AdminV2Unit[] };
  return payload.units;
};
