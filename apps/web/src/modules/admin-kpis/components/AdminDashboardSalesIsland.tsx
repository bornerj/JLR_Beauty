import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getToken } from "../../../lib/auth";
import { logger } from "../../../utils/logger";
import { fetchAdminDashboardSalesSeries } from "../api/client";
import { AdminDashboardSalesPanel } from "./AdminDashboardSalesPanel";
import type { AdminDashboardSalesScope, AdminDashboardSalesSeries } from "../types";
import { usePortalTarget } from "../../../shared/usePortalTarget";

const REFRESH_INTERVAL_MS = 60 * 1000;

type SalesState = {
  loading: boolean;
  data: AdminDashboardSalesSeries | null;
  error: string | null;
};

export const AdminDashboardSalesIsland = () => {
  const [scope, setScope] = useState<AdminDashboardSalesScope>("SERVICES");
  const [days, setDays] = useState<number>(30);
  const [state, setState] = useState<SalesState>({
    loading: true,
    data: null,
    error: null,
  });
  const target = usePortalTarget("[data-react-admin-dashboard-sales]");
  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setState({ loading: false, data: null, error: "Sessao expirada. Faca login novamente." });
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchAdminDashboardSalesSeries({
        token,
        scope,
        days,
      });
      setState({ loading: false, data, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar serie de vendas.";
      logger.warn("Falha ao carregar serie React de vendas do dashboard", { error: message });
      setState((prev) => ({ loading: false, data: prev.data, error: message }));
    }
  }, [days, scope]);

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
    <AdminDashboardSalesPanel
      scope={scope}
      days={days}
      onScopeChange={setScope}
      onDaysChange={setDays}
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

