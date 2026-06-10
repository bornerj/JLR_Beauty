import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getToken } from "../../../lib/auth";
import { logger } from "../../../utils/logger";
import { fetchAdminDashboardAgendaSummary } from "../api/client";
import { AdminDashboardAgendaPanel } from "./AdminDashboardAgendaPanel";
import type { AdminDashboardAgendaSummary } from "../types";
import { usePortalTarget } from "../../../shared/usePortalTarget";

const REFRESH_INTERVAL_MS = 60 * 1000;

type AgendaState = {
  loading: boolean;
  data: AdminDashboardAgendaSummary | null;
  error: string | null;
};

const currentMonthKey = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const currentDateKey = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
};

export const AdminDashboardAgendaIsland = () => {
  const [month, setMonth] = useState<string>(currentMonthKey);
  const [selectedDate, setSelectedDate] = useState<string>(currentDateKey);
  const [state, setState] = useState<AgendaState>({
    loading: true,
    data: null,
    error: null,
  });
  const target = usePortalTarget("[data-react-admin-dashboard-agenda]");
  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setState({ loading: false, data: null, error: "Sessao expirada. Faca login novamente." });
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchAdminDashboardAgendaSummary({
        token,
        month,
        date: selectedDate,
      });
      setState({ loading: false, data, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar agenda.";
      logger.warn("Falha ao carregar agenda React do dashboard", { error: message });
      setState((prev) => ({ loading: false, data: prev.data, error: message }));
    }
  }, [month, selectedDate]);

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
    <AdminDashboardAgendaPanel
      month={month}
      selectedDate={selectedDate}
      onMonthChange={(nextMonth) => {
        setMonth(nextMonth);
        setSelectedDate(`${nextMonth}-01`);
      }}
      onDateChange={(nextDate) => {
        setSelectedDate(nextDate);
        setMonth(nextDate.slice(0, 7));
      }}
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

