import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getToken } from "../../../lib/auth";
import { logger } from "../../../utils/logger";
import { fetchAdminDashboardKpis } from "../api/client";
import type { AdminDashboardKpis } from "../types";
import { AdminDashboardKpiCards } from "./AdminDashboardKpiCards";
import { usePortalTarget } from "../../../shared/usePortalTarget";

const REFRESH_INTERVAL_MS = 60 * 1000;

type DashboardKpiState = {
  loading: boolean;
  data: AdminDashboardKpis | null;
  error: string | null;
};

export const AdminDashboardKpisIsland = () => {
  const [state, setState] = useState<DashboardKpiState>({
    loading: true,
    data: null,
    error: null,
  });
  const target = usePortalTarget("[data-react-admin-dashboard-kpis]");
  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setState({ loading: false, data: null, error: "Sessao expirada. Faca login novamente." });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchAdminDashboardKpis({ token, days: 30 });
      setState({ loading: false, data, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar KPIs.";
      logger.warn("Falha ao carregar KPIs React do dashboard admin", { error: message });
      setState((prev) => ({ loading: false, data: prev.data, error: message }));
    }
  }, []);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!active) return;
      await load();
    };

    void run();
    const intervalId = window.setInterval(() => {
      void run();
    }, REFRESH_INTERVAL_MS);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [load]);

  if (!target) return null;

  return createPortal(
    <AdminDashboardKpiCards
      data={state.data}
      loading={state.loading}
      error={state.error}
      onRetry={() => {
        void load();
      }}
    />,
    target
  );
};
