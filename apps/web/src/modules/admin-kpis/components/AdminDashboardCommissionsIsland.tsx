import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getToken } from "../../../lib/auth";
import { logger } from "../../../utils/logger";
import { fetchAdminDashboardCommissionsSummary } from "../api/client";
import { AdminDashboardCommissionsPanel } from "./AdminDashboardCommissionsPanel";
import type { AdminDashboardCommissionsSummary } from "../types";
import { usePortalTarget } from "../../../shared/usePortalTarget";

const REFRESH_INTERVAL_MS = 60 * 1000;

type CommissionsState = {
  loading: boolean;
  data: AdminDashboardCommissionsSummary | null;
  error: string | null;
};

export const AdminDashboardCommissionsIsland = () => {
  const [days, setDays] = useState<number>(30);
  const [state, setState] = useState<CommissionsState>({
    loading: true,
    data: null,
    error: null,
  });
  const target = usePortalTarget("[data-react-admin-dashboard-commissions]");
  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setState({ loading: false, data: null, error: "Sessao expirada. Faca login novamente." });
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchAdminDashboardCommissionsSummary({
        token,
        days,
      });
      setState({ loading: false, data, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar comissoes.";
      logger.warn("Falha ao carregar comissoes React do dashboard", { error: message });
      setState((prev) => ({ loading: false, data: prev.data, error: message }));
    }
  }, [days]);

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
    <AdminDashboardCommissionsPanel
      days={days}
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

