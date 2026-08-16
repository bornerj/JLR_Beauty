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
import type { Membership, MembershipInput } from "../cadastros/plans/types";
import type { DiscountCoupon, DiscountCouponInput } from "../cadastros/coupons/types";
import type { PublicBranding } from "../../modules/public-site/branding";
import type { PageTextCatalogEntry, PageTextsMap } from "../sistema/pageTexts/types";
import type { PublicMediaSlotsSnapshot } from "../../modules/public-site/mediaSlots";
import type { ConciergeSession } from "../sistema/whatsapp/types";
import type {
  Product,
  ProductInput,
  ProductCategory,
  ProductStatusOption,
  InventoryUnit,
  CrossUnitStockRow,
  StockMovementRow,
  StockMovementKind,
  StockMovementInput,
} from "../cadastros/products/types";
import type { Customer, CustomerInput } from "../cadastros/customers/types";
import type {
  Service,
  ServiceInput,
  ServiceCategory,
  ServiceStatusOption,
  CategoryOrStatusInput,
} from "../cadastros/services/types";

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
  reason: string;
}): Promise<FranchisePipeline> => {
  const response = await fetch(`${getApiUrl()}/api/admin-v2/growth/franchises/${args.leadId}/stage`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${args.token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ stage: args.stage, reason: args.reason }),
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

/**
 * Admin V2 (PLAN-0026, Onda 1 — Cadastros nativos) — reusa `/api/memberships`
 * (`apps/api/src/routes/subscriptions.ts`), sem endpoint novo (`DECISION-014` regra #2).
 */
export const fetchMemberships = async (args: { token: string }): Promise<Membership[]> => {
  const response = await fetch(`${getApiUrl()}/api/memberships`, {
    headers: { Authorization: `Bearer ${args.token}` },
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
  return (await response.json()) as Membership[];
};

export const createMembership = async (args: { token: string; input: MembershipInput }): Promise<Membership> => {
  const response = await fetch(`${getApiUrl()}/api/memberships`, {
    method: "POST",
    headers: { Authorization: `Bearer ${args.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(args.input),
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
  return (await response.json()) as Membership;
};

export const updateMembership = async (args: {
  token: string;
  id: number;
  input: MembershipInput;
}): Promise<Membership> => {
  const response = await fetch(`${getApiUrl()}/api/memberships/${args.id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${args.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(args.input),
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
  return (await response.json()) as Membership;
};

export const deleteMembership = async (args: { token: string; id: number }): Promise<void> => {
  const response = await fetch(`${getApiUrl()}/api/memberships/${args.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${args.token}` },
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
};

export type GenericSetting = { key: string; value: unknown; updatedAt?: string };

/**
 * Admin V2 (PLAN-0026) — cliente genérico pra `/api/settings/:key` (`admin.ts`), reusado por
 * várias telas de config (Entrega nesta onda; Branding provavelmente na próxima). `GET` 404
 * quando a chave nunca foi salva — tratado como "sem valor ainda", não erro.
 */
export const fetchSetting = async (args: { token: string; key: string }): Promise<GenericSetting | null> => {
  const response = await fetch(`${getApiUrl()}/api/settings/${args.key}`, {
    headers: { Authorization: `Bearer ${args.token}` },
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
  return (await response.json()) as GenericSetting;
};

export const updateSetting = async (args: { token: string; key: string; value: unknown }): Promise<GenericSetting> => {
  const response = await fetch(`${getApiUrl()}/api/settings/${args.key}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${args.token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ value: args.value }),
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
  return (await response.json()) as GenericSetting;
};

/**
 * Admin V2 (PLAN-0026, Onda 3) — Branding usa rota dedicada (`/api/admin/branding`), não o
 * genérico `/api/settings/:key` — `admin.ts` valida com `brandingPayloadSchema` e mantém
 * cache in-memory no service (`modules/branding/service.ts`). Mesmo contrato do legado
 * (`admin-branding/components/AdminBrandingView.tsx`).
 */
export const fetchBranding = async (args: { token: string }): Promise<PublicBranding> => {
  const response = await fetch(`${getApiUrl()}/api/admin/branding`, {
    headers: { Authorization: `Bearer ${args.token}` },
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
  const payload = (await response.json()) as { branding?: PublicBranding };
  if (!payload.branding) {
    throw new Error("Resposta sem branding.");
  }
  return payload.branding;
};

export const updateBranding = async (args: { token: string; input: PublicBranding }): Promise<PublicBranding> => {
  const response = await fetch(`${getApiUrl()}/api/admin/branding`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${args.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(args.input),
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
  const payload = (await response.json()) as { branding?: PublicBranding };
  return payload.branding ?? args.input;
};

/**
 * Admin V2 (PLAN-0026, Onda 4) — Cupons de Desconto, reusa `/api/discount-coupons`
 * (`admin.ts`) sem alteração (`DECISION-014` regra #2). Mesmo contrato do legado
 * (`admin-discount-coupons/components/AdminDiscountCouponsView.tsx`, 538 linhas, já era
 * React puro).
 */
export const fetchDiscountCoupons = async (args: { token: string }): Promise<DiscountCoupon[]> => {
  const response = await fetch(`${getApiUrl()}/api/discount-coupons`, {
    headers: { Authorization: `Bearer ${args.token}` },
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
  return (await response.json()) as DiscountCoupon[];
};

export const createDiscountCoupon = async (args: {
  token: string;
  input: DiscountCouponInput;
}): Promise<DiscountCoupon> => {
  const response = await fetch(`${getApiUrl()}/api/discount-coupons`, {
    method: "POST",
    headers: { Authorization: `Bearer ${args.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(args.input),
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
  return (await response.json()) as DiscountCoupon;
};

export const updateDiscountCoupon = async (args: {
  token: string;
  id: number;
  input: DiscountCouponInput;
}): Promise<DiscountCoupon> => {
  const response = await fetch(`${getApiUrl()}/api/discount-coupons/${args.id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${args.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(args.input),
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
  return (await response.json()) as DiscountCoupon;
};

export const deleteDiscountCoupon = async (args: { token: string; id: number }): Promise<void> => {
  const response = await fetch(`${getApiUrl()}/api/discount-coupons/${args.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${args.token}` },
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
};

/**
 * Admin V2 (PLAN-0026, Onda 5) — Textos das Páginas, reusa `/api/admin/page-texts` (+
 * `/previous` + `/restore`) sem alteração (`DECISION-014` regra #2). `savePageTexts`
 * **substitui o mapa inteiro** — não é PATCH incremental (`savePublicPageTexts` no backend
 * faz merge com defaults, não com o que já estava salvo) — a tela precisa sempre mandar o
 * mapa completo em memória, nunca só as chaves editadas, senão os campos não tocados nesta
 * sessão voltam pro valor default. Mesmo contrato do legado
 * (`admin-page-texts/AdminPageTextsView.tsx`, que já manda `{ texts }` completo).
 */
export const fetchPageTexts = async (args: {
  token: string;
}): Promise<{ catalog: PageTextCatalogEntry[]; texts: PageTextsMap }> => {
  const response = await fetch(`${getApiUrl()}/api/admin/page-texts`, {
    headers: { Authorization: `Bearer ${args.token}` },
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
  return (await response.json()) as { catalog: PageTextCatalogEntry[]; texts: PageTextsMap };
};

export const fetchPreviousPageTexts = async (args: { token: string }): Promise<PageTextsMap | null> => {
  const response = await fetch(`${getApiUrl()}/api/admin/page-texts/previous`, {
    headers: { Authorization: `Bearer ${args.token}` },
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
  const payload = (await response.json()) as { texts: PageTextsMap | null };
  return payload.texts;
};

export const savePageTexts = async (args: { token: string; texts: PageTextsMap }): Promise<PageTextsMap> => {
  const response = await fetch(`${getApiUrl()}/api/admin/page-texts`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${args.token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ texts: args.texts }),
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
  const payload = (await response.json()) as { texts: PageTextsMap };
  return payload.texts;
};

export const restorePreviousPageTexts = async (args: { token: string }): Promise<PageTextsMap> => {
  const response = await fetch(`${getApiUrl()}/api/admin/page-texts/restore`, {
    method: "POST",
    headers: { Authorization: `Bearer ${args.token}` },
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
  const payload = (await response.json()) as { texts: PageTextsMap };
  return payload.texts;
};

export type SectionToggleMap = Record<string, Record<string, boolean>>;

/**
 * Admin V2 (PLAN-0026, Onda 6) — Seções Telas (liga/desliga), reusa `/api/admin/section-
 * toggles` sem alteração. **Só usuário `MASTER` edita** — o backend checa isso além do
 * `requireAdmin` padrão (403 pra ADMIN comum, inclusive no `GET`) — preservado exatamente,
 * mesmo gate client-side do legado (`getUser()?.role === "MASTER"`, checado antes até de
 * chamar a API, pra não gerar erro 403 desnecessário pra quem não pode editar mesmo).
 */
export const fetchSectionToggles = async (args: { token: string }): Promise<SectionToggleMap> => {
  const response = await fetch(`${getApiUrl()}/api/admin/section-toggles`, {
    headers: { Authorization: `Bearer ${args.token}` },
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
  const payload = (await response.json()) as { toggles: SectionToggleMap };
  return payload.toggles;
};

export const updateSectionToggles = async (args: {
  token: string;
  toggles: SectionToggleMap;
}): Promise<SectionToggleMap> => {
  const response = await fetch(`${getApiUrl()}/api/admin/section-toggles`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${args.token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ toggles: args.toggles }),
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
  const payload = (await response.json()) as { toggles: SectionToggleMap };
  return payload.toggles;
};

/**
 * Admin V2 (PLAN-0026, Onda 7) — Galeria de Mídias, reusa `/api/admin/media-slots` sem
 * alteração. **78 slots, contrato "manda o mapa inteiro"** (mesma pegadinha da Onda 5 —
 * `savePublicMediaSlots` normaliza usando fallback pra qualquer slot ausente do payload, não
 * faz merge com o que já estava salvo).
 */
export const fetchMediaSlots = async (args: { token: string }): Promise<PublicMediaSlotsSnapshot> => {
  const response = await fetch(`${getApiUrl()}/api/admin/media-slots`, {
    headers: { Authorization: `Bearer ${args.token}` },
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
  const payload = (await response.json()) as { slots: PublicMediaSlotsSnapshot };
  return payload.slots;
};

export const saveMediaSlots = async (args: {
  token: string;
  slots: PublicMediaSlotsSnapshot;
}): Promise<PublicMediaSlotsSnapshot> => {
  const response = await fetch(`${getApiUrl()}/api/admin/media-slots`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${args.token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ slots: args.slots }),
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
  const payload = (await response.json()) as { slots: PublicMediaSlotsSnapshot };
  return payload.slots;
};

/**
 * Admin V2 (PLAN-0026, Onda 8) — Serviços, reusa `/api/services` (+ `/service-categories` +
 * `/service-statuses`) sem alteração. Legado (`admin-services`) tinha `behavior.ts`
 * imperativo (416 linhas) — reescrito como React declarativo, mesma regra de negócio.
 */
export const fetchServices = async (args: { token: string }): Promise<Service[]> => {
  const response = await fetch(`${getApiUrl()}/api/services`, {
    headers: { Authorization: `Bearer ${args.token}` },
  });
  if (!response.ok) throw new Error(await parseApiError(response));
  return (await response.json()) as Service[];
};

export const createService = async (args: { token: string; input: ServiceInput }): Promise<Service> => {
  const response = await fetch(`${getApiUrl()}/api/services`, {
    method: "POST",
    headers: { Authorization: `Bearer ${args.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(args.input),
  });
  if (!response.ok) throw new Error(await parseApiError(response));
  return (await response.json()) as Service;
};

export const updateService = async (args: { token: string; id: number; input: ServiceInput }): Promise<Service> => {
  const response = await fetch(`${getApiUrl()}/api/services/${args.id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${args.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(args.input),
  });
  if (!response.ok) throw new Error(await parseApiError(response));
  return (await response.json()) as Service;
};

export const deleteService = async (args: { token: string; id: number }): Promise<void> => {
  const response = await fetch(`${getApiUrl()}/api/services/${args.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${args.token}` },
  });
  if (!response.ok) throw new Error(await parseApiError(response));
};

/**
 * Categorias/Status de Serviço — CRUD genérico compartilhado (mesmo padrão do legado em
 * `admin-core/behavior.ts`, que também reusa pra Produtos). `kind` seleciona o endpoint;
 * reusável pela Onda 11 (Produtos) sem duplicar.
 */
export const fetchServiceCategories = async (args: { token: string }): Promise<ServiceCategory[]> => {
  const response = await fetch(`${getApiUrl()}/api/service-categories`, {
    headers: { Authorization: `Bearer ${args.token}` },
  });
  if (!response.ok) throw new Error(await parseApiError(response));
  return (await response.json()) as ServiceCategory[];
};

export const createServiceCategory = async (args: { token: string; input: CategoryOrStatusInput }): Promise<ServiceCategory> => {
  const response = await fetch(`${getApiUrl()}/api/service-categories`, {
    method: "POST",
    headers: { Authorization: `Bearer ${args.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(args.input),
  });
  if (!response.ok) throw new Error(await parseApiError(response));
  return (await response.json()) as ServiceCategory;
};

export const updateServiceCategory = async (args: {
  token: string;
  id: number;
  input: CategoryOrStatusInput;
}): Promise<ServiceCategory> => {
  const response = await fetch(`${getApiUrl()}/api/service-categories/${args.id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${args.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(args.input),
  });
  if (!response.ok) throw new Error(await parseApiError(response));
  return (await response.json()) as ServiceCategory;
};

export const deleteServiceCategory = async (args: { token: string; id: number }): Promise<void> => {
  const response = await fetch(`${getApiUrl()}/api/service-categories/${args.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${args.token}` },
  });
  if (!response.ok) throw new Error(await parseApiError(response));
};

export const fetchServiceStatuses = async (args: { token: string }): Promise<ServiceStatusOption[]> => {
  const response = await fetch(`${getApiUrl()}/api/service-statuses`, {
    headers: { Authorization: `Bearer ${args.token}` },
  });
  if (!response.ok) throw new Error(await parseApiError(response));
  return (await response.json()) as ServiceStatusOption[];
};

export const createServiceStatus = async (args: { token: string; input: CategoryOrStatusInput }): Promise<ServiceStatusOption> => {
  const response = await fetch(`${getApiUrl()}/api/service-statuses`, {
    method: "POST",
    headers: { Authorization: `Bearer ${args.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(args.input),
  });
  if (!response.ok) throw new Error(await parseApiError(response));
  return (await response.json()) as ServiceStatusOption;
};

export const updateServiceStatus = async (args: {
  token: string;
  id: number;
  input: CategoryOrStatusInput;
}): Promise<ServiceStatusOption> => {
  const response = await fetch(`${getApiUrl()}/api/service-statuses/${args.id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${args.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(args.input),
  });
  if (!response.ok) throw new Error(await parseApiError(response));
  return (await response.json()) as ServiceStatusOption;
};

export const deleteServiceStatus = async (args: { token: string; id: number }): Promise<void> => {
  const response = await fetch(`${getApiUrl()}/api/service-statuses/${args.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${args.token}` },
  });
  if (!response.ok) throw new Error(await parseApiError(response));
};

/**
 * Admin V2 (PLAN-0026, Onda 9) — WhatsApp/Integrações, reusa `GET /concierge/sessions`
 * (`schedule.ts`) sem alteração. Filtro **server-side** (`search`/`status`/`from`/`to`) —
 * o legado buscava até 500 registros de uma vez e filtrava no cliente; a rota já suporta os
 * mesmos filtros no backend, então a tela nativa manda os filtros na querystring em vez de
 * reimplementar client-side (mesmo resultado, menos payload, mais alinhado com
 * `DECISION-013` regra #4 — cálculo/filtro de negócio no backend).
 */
export const fetchConciergeSessions = async (args: {
  token: string;
  search?: string;
  status?: string;
  from?: string;
  to?: string;
}): Promise<ConciergeSession[]> => {
  const params = new URLSearchParams();
  params.set("limit", "500");
  if (args.search) params.set("search", args.search);
  if (args.status) params.set("status", args.status);
  if (args.from) params.set("from", args.from);
  if (args.to) params.set("to", args.to);
  const response = await fetch(`${getApiUrl()}/api/concierge/sessions?${params.toString()}`, {
    headers: { Authorization: `Bearer ${args.token}` },
  });
  if (!response.ok) throw new Error(await parseApiError(response));
  const payload = (await response.json()) as { items: ConciergeSession[] };
  return payload.items;
};

/**
 * Admin V2 (PLAN-0026, Onda 10) — smoke-check genérico (`GET /api<path>`, só confirma que a
 * rota responde OK, sem tipar o corpo) e `apiRequest` (mesmo genérico, mas com método/corpo
 * livres) — usados pela tela de Testes e Validação pra checar saúde de vários endpoints sem
 * precisar de 1 função tipada por rota.
 */
export const pingApi = async (args: { token: string; path: string }): Promise<void> => {
  const response = await fetch(`${getApiUrl()}/api${args.path}`, {
    headers: { Authorization: `Bearer ${args.token}` },
  });
  if (!response.ok) throw new Error(await parseApiError(response));
};

export const apiRequest = async (args: {
  token: string;
  path: string;
  method: string;
  body?: unknown;
}): Promise<{ status: number; json: unknown }> => {
  const response = await fetch(`${getApiUrl()}/api${args.path}`, {
    method: args.method,
    headers: { Authorization: `Bearer ${args.token}`, "Content-Type": "application/json" },
    body: args.body !== undefined ? JSON.stringify(args.body) : undefined,
  });
  const json = await response.json().catch(() => null);
  return { status: response.status, json };
};

/**
 * Admin V2 (PLAN-0026, Onda 11) — Produtos, reusa `/api/products` (+ `/product-categories` +
 * `/product-statuses`, mesmo desenho de endpoint das categorias/status de serviço, Onda 8) +
 * `/api/inventory/*` (`PLAN-0020`, estoque multi-unidade) sem alteração.
 */
export const fetchProducts = async (args: { token: string }): Promise<Product[]> => {
  const response = await fetch(`${getApiUrl()}/api/products`, {
    headers: { Authorization: `Bearer ${args.token}` },
  });
  if (!response.ok) throw new Error(await parseApiError(response));
  return (await response.json()) as Product[];
};

export const createProduct = async (args: { token: string; input: ProductInput }): Promise<Product> => {
  const response = await fetch(`${getApiUrl()}/api/products`, {
    method: "POST",
    headers: { Authorization: `Bearer ${args.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(args.input),
  });
  if (!response.ok) throw new Error(await parseApiError(response));
  return (await response.json()) as Product;
};

export const updateProduct = async (args: { token: string; id: number; input: ProductInput }): Promise<Product> => {
  const response = await fetch(`${getApiUrl()}/api/products/${args.id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${args.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(args.input),
  });
  if (!response.ok) throw new Error(await parseApiError(response));
  return (await response.json()) as Product;
};

export const deleteProduct = async (args: { token: string; id: number }): Promise<void> => {
  const response = await fetch(`${getApiUrl()}/api/products/${args.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${args.token}` },
  });
  if (!response.ok) throw new Error(await parseApiError(response));
};

export const fetchProductCategories = async (args: { token: string }): Promise<ProductCategory[]> => {
  const response = await fetch(`${getApiUrl()}/api/product-categories`, {
    headers: { Authorization: `Bearer ${args.token}` },
  });
  if (!response.ok) throw new Error(await parseApiError(response));
  return (await response.json()) as ProductCategory[];
};

export const createProductCategory = async (args: { token: string; input: CategoryOrStatusInput }): Promise<ProductCategory> => {
  const response = await fetch(`${getApiUrl()}/api/product-categories`, {
    method: "POST",
    headers: { Authorization: `Bearer ${args.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(args.input),
  });
  if (!response.ok) throw new Error(await parseApiError(response));
  return (await response.json()) as ProductCategory;
};

export const updateProductCategory = async (args: {
  token: string;
  id: number;
  input: CategoryOrStatusInput;
}): Promise<ProductCategory> => {
  const response = await fetch(`${getApiUrl()}/api/product-categories/${args.id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${args.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(args.input),
  });
  if (!response.ok) throw new Error(await parseApiError(response));
  return (await response.json()) as ProductCategory;
};

export const deleteProductCategory = async (args: { token: string; id: number }): Promise<void> => {
  const response = await fetch(`${getApiUrl()}/api/product-categories/${args.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${args.token}` },
  });
  if (!response.ok) throw new Error(await parseApiError(response));
};

export const fetchProductStatuses = async (args: { token: string }): Promise<ProductStatusOption[]> => {
  const response = await fetch(`${getApiUrl()}/api/product-statuses`, {
    headers: { Authorization: `Bearer ${args.token}` },
  });
  if (!response.ok) throw new Error(await parseApiError(response));
  return (await response.json()) as ProductStatusOption[];
};

export const createProductStatus = async (args: { token: string; input: CategoryOrStatusInput }): Promise<ProductStatusOption> => {
  const response = await fetch(`${getApiUrl()}/api/product-statuses`, {
    method: "POST",
    headers: { Authorization: `Bearer ${args.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(args.input),
  });
  if (!response.ok) throw new Error(await parseApiError(response));
  return (await response.json()) as ProductStatusOption;
};

export const updateProductStatus = async (args: {
  token: string;
  id: number;
  input: CategoryOrStatusInput;
}): Promise<ProductStatusOption> => {
  const response = await fetch(`${getApiUrl()}/api/product-statuses/${args.id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${args.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(args.input),
  });
  if (!response.ok) throw new Error(await parseApiError(response));
  return (await response.json()) as ProductStatusOption;
};

export const deleteProductStatus = async (args: { token: string; id: number }): Promise<void> => {
  const response = await fetch(`${getApiUrl()}/api/product-statuses/${args.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${args.token}` },
  });
  if (!response.ok) throw new Error(await parseApiError(response));
};

export const fetchInventoryUnits = async (args: { token: string }): Promise<InventoryUnit[]> => {
  const response = await fetch(`${getApiUrl()}/api/inventory/units`, {
    headers: { Authorization: `Bearer ${args.token}` },
  });
  if (!response.ok) throw new Error(await parseApiError(response));
  const payload = (await response.json()) as { units: InventoryUnit[] };
  return payload.units;
};

export const fetchCrossUnitStock = async (args: { token: string; productId: number }): Promise<CrossUnitStockRow[]> => {
  const response = await fetch(`${getApiUrl()}/api/inventory/cross-unit?productId=${args.productId}`, {
    headers: { Authorization: `Bearer ${args.token}` },
  });
  if (!response.ok) throw new Error(await parseApiError(response));
  return (await response.json()) as CrossUnitStockRow[];
};

export const fetchStockMovements = async (args: {
  token: string;
  unitId: number;
  productId: number;
}): Promise<StockMovementRow[]> => {
  const response = await fetch(`${getApiUrl()}/api/units/${args.unitId}/products/${args.productId}/movements`, {
    headers: { Authorization: `Bearer ${args.token}` },
  });
  if (!response.ok) throw new Error(await parseApiError(response));
  return (await response.json()) as StockMovementRow[];
};

export const postStockMovement = async (args: {
  token: string;
  unitId: number;
  productId: number;
  kind: StockMovementKind;
  input: StockMovementInput;
}): Promise<{ ok: boolean; balanceAfter: number }> => {
  const path =
    args.kind === "adjust"
      ? `/units/${args.unitId}/products/${args.productId}/stock/adjust`
      : `/units/${args.unitId}/products/${args.productId}/stock/${args.kind}`;
  const body: Record<string, unknown> = { ...args.input };
  delete body.kind;
  const response = await fetch(`${getApiUrl()}/api${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${args.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await parseApiError(response));
  return (await response.json()) as { ok: boolean; balanceAfter: number };
};

/**
 * Admin V2 (PLAN-0026, Onda 12) — Clientes, reusa `/api/customers` sem alteração. **Sem
 * `deleteCustomer`** — o backend não expõe `DELETE /customers/:id` (confirmado no RAG, não
 * fabricado). Primeira das 3 telas do desmembramento de "Pessoas" (`DECISION-014` regra #3).
 */
export const fetchCustomers = async (args: { token: string }): Promise<Customer[]> => {
  const response = await fetch(`${getApiUrl()}/api/customers`, {
    headers: { Authorization: `Bearer ${args.token}` },
  });
  if (!response.ok) throw new Error(await parseApiError(response));
  return (await response.json()) as Customer[];
};

export const createCustomer = async (args: { token: string; input: CustomerInput }): Promise<Customer> => {
  const response = await fetch(`${getApiUrl()}/api/customers`, {
    method: "POST",
    headers: { Authorization: `Bearer ${args.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(args.input),
  });
  if (!response.ok) throw new Error(await parseApiError(response));
  return (await response.json()) as Customer;
};

export const updateCustomer = async (args: { token: string; id: number; input: CustomerInput }): Promise<Customer> => {
  const response = await fetch(`${getApiUrl()}/api/customers/${args.id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${args.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(args.input),
  });
  if (!response.ok) throw new Error(await parseApiError(response));
  return (await response.json()) as Customer;
};

/**
 * Cliente genérico de upload (`/api/uploads`), reusado por qualquer tela que precise subir
 * imagem (Branding nesta onda; Galeria de Mídias na Onda 7). Mesmo endpoint do legado.
 */
export const uploadAsset = async (args: { token: string; file: File }): Promise<string> => {
  const formData = new FormData();
  formData.append("file", args.file);
  const response = await fetch(`${getApiUrl()}/api/uploads`, {
    method: "POST",
    headers: { Authorization: `Bearer ${args.token}` },
    body: formData,
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
  const payload = (await response.json()) as { url?: string };
  if (!payload.url) {
    throw new Error("Upload concluído sem URL retornada pela API.");
  }
  return payload.url;
};
