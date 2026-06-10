import type {
  AdminDashboardAgendaSummary,
  AdminDashboardCommissionsSummary,
  AdminDashboardKpis,
  AdminDashboardSalesScope,
  AdminDashboardSalesSeries,
} from "../types";

type ApiErrorPayload = {
  message?: string;
  detail?: string;
};

const parseApiError = async (response: Response): Promise<string> => {
  const payload = (await response.json().catch(() => ({}))) as ApiErrorPayload;
  return payload.detail || payload.message || "Falha ao carregar dados do dashboard.";
};

const getApiUrl = (): string => {
  return import.meta.env.VITE_API_URL || "";
};

export const fetchAdminDashboardKpis = async (args: {
  token: string;
  days?: number;
  from?: string;
  to?: string;
}): Promise<AdminDashboardKpis> => {
  const params = new URLSearchParams();
  if (args.days !== undefined) params.set("days", String(args.days));
  if (args.from) params.set("from", args.from);
  if (args.to) params.set("to", args.to);
  const suffix = params.toString();
  const path = suffix ? `/api/admin/dashboard/kpis?${suffix}` : "/api/admin/dashboard/kpis";

  const response = await fetch(`${getApiUrl()}${path}`, {
    headers: {
      Authorization: `Bearer ${args.token}`,
    },
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
  return (await response.json()) as AdminDashboardKpis;
};

export const fetchAdminDashboardSalesSeries = async (args: {
  token: string;
  scope?: AdminDashboardSalesScope;
  days?: number;
  from?: string;
  to?: string;
}): Promise<AdminDashboardSalesSeries> => {
  const params = new URLSearchParams();
  if (args.scope) params.set("scope", args.scope);
  if (args.days !== undefined) params.set("days", String(args.days));
  if (args.from) params.set("from", args.from);
  if (args.to) params.set("to", args.to);
  const suffix = params.toString();
  const path =
    suffix.length > 0
      ? `/api/admin/dashboard/sales-series?${suffix}`
      : "/api/admin/dashboard/sales-series";

  const response = await fetch(`${getApiUrl()}${path}`, {
    headers: {
      Authorization: `Bearer ${args.token}`,
    },
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
  return (await response.json()) as AdminDashboardSalesSeries;
};

export const fetchAdminDashboardAgendaSummary = async (args: {
  token: string;
  month?: string;
  date?: string;
}): Promise<AdminDashboardAgendaSummary> => {
  const params = new URLSearchParams();
  if (args.month) params.set("month", args.month);
  if (args.date) params.set("date", args.date);
  const suffix = params.toString();
  const path =
    suffix.length > 0
      ? `/api/admin/dashboard/agenda-summary?${suffix}`
      : "/api/admin/dashboard/agenda-summary";

  const response = await fetch(`${getApiUrl()}${path}`, {
    headers: {
      Authorization: `Bearer ${args.token}`,
    },
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
  return (await response.json()) as AdminDashboardAgendaSummary;
};

export const fetchAdminDashboardCommissionsSummary = async (args: {
  token: string;
  days?: number;
  from?: string;
  to?: string;
}): Promise<AdminDashboardCommissionsSummary> => {
  const params = new URLSearchParams();
  if (args.days !== undefined) params.set("days", String(args.days));
  if (args.from) params.set("from", args.from);
  if (args.to) params.set("to", args.to);
  const suffix = params.toString();
  const path =
    suffix.length > 0
      ? `/api/admin/dashboard/commissions-summary?${suffix}`
      : "/api/admin/dashboard/commissions-summary";

  const response = await fetch(`${getApiUrl()}${path}`, {
    headers: {
      Authorization: `Bearer ${args.token}`,
    },
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
  return (await response.json()) as AdminDashboardCommissionsSummary;
};
