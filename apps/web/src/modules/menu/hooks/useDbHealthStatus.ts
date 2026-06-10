import { useEffect, useMemo, useState } from "react";

type DbLedState = "online" | "offline" | "unknown";

type DbHealthResponse = {
  db?: {
    connected?: boolean;
  };
};

type DbHealthStatus = {
  className: string;
  state: DbLedState;
  title: string;
};

const API_URL = import.meta.env.VITE_API_URL || "";
const REFRESH_INTERVAL_MS = 10000;

const toDbHealthStatus = (state: DbLedState): DbHealthStatus => {
  if (state === "online") {
    return {
      state,
      className: "db-status-led db-status-led--online",
      title: "Banco conectado",
    };
  }
  if (state === "offline") {
    return {
      state,
      className: "db-status-led db-status-led--offline",
      title: "Banco desconectado",
    };
  }
  return {
    state,
    className: "db-status-led db-status-led--unknown",
    title: "Verificando conexao com banco",
  };
};

const fetchDbHealth = async (): Promise<DbLedState> => {
  try {
    const response = await fetch(`${API_URL}/health/db`, {
      method: "GET",
      cache: "no-store",
    });
    if (!response.ok) return "offline";
    const payload = (await response.json()) as DbHealthResponse;
    if (payload?.db?.connected === true) return "online";
    return "offline";
  } catch {
    return "offline";
  }
};

export const useDbHealthStatus = (): DbHealthStatus => {
  const [state, setState] = useState<DbLedState>("unknown");

  useEffect(() => {
    let cancelled = false;
    const refresh = async (): Promise<void> => {
      const nextState = await fetchDbHealth();
      if (cancelled) return;
      setState(nextState);
    };
    void refresh();
    const intervalId = window.setInterval(() => {
      void refresh();
    }, REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  return useMemo(() => toDbHealthStatus(state), [state]);
};
