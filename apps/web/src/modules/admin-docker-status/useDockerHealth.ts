import { useEffect, useState } from "react";
import { getToken } from "../../lib/auth";

export type ServiceStatus = "online" | "offline" | "loading";

export type DockerStatus = {
  nginx: ServiceStatus;
  api: ServiceStatus;
  web: ServiceStatus;
  postgres: ServiceStatus;
};

type ServicesResponse = {
  services: Record<string, { status: string }>;
};

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "";

const INITIAL: DockerStatus = {
  nginx:    "loading",
  api:      "loading",
  web:      "loading",
  postgres: "loading",
};

async function fetchDockerHealth(): Promise<DockerStatus> {
  try {
    const token = getToken();
    const res = await fetch(`${API_URL}/health/services`, {
      cache: "no-store",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return { nginx: "online", api: "offline", web: "online", postgres: "offline" };
    const data = (await res.json()) as ServicesResponse;
    const s = data.services ?? {};
    return {
      nginx:    s["nginx"]?.status    === "online" ? "online" : "offline",
      api:      s["api"]?.status      === "online" ? "online" : "offline",
      web:      s["web"]?.status      === "online" ? "online" : "offline",
      postgres: s["postgres"]?.status === "online" ? "online" : "offline",
    };
  } catch {
    return { nginx: "offline", api: "offline", web: "offline", postgres: "offline" };
  }
}

export type DockerHealthResult = {
  status: DockerStatus;
  isLoading: boolean;
  anyOffline: boolean;
};

export function useDockerHealth(): DockerHealthResult {
  const [status, setStatus] = useState<DockerStatus>(INITIAL);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchDockerHealth().then((s) => {
      if (!cancelled) {
        setStatus(s);
        setIsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const anyOffline = !isLoading && Object.values(status).some((s) => s === "offline");

  return { status, isLoading, anyOffline };
}
