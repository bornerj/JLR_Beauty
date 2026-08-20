import { useEffect, useState } from "react";
import { getToken } from "../../lib/auth";

/**
 * Admin V2 (`PLAN-0033`) — realocado de `modules/admin-docker-status/useDockerHealth.ts`
 * (Admin legado, aposentado) sem mudança de lógica, só de endereço.
 *
 * `unknown` (2026-08-18, `ERR-0069`) — distinto de `offline`. O endpoint (`GET /health/services`)
 * exige admin autenticado (`requireAdmin`) — se a sessão expirou ou a rede falha, isso não
 * significa que o Docker caiu, significa que não deu pra checar. Antes, qualquer falha de
 * rede/auth virava "offline" pra todos os serviços, um alarme falso.
 */
export type ServiceStatus = "online" | "offline" | "unknown" | "loading";

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
  nginx: "loading",
  api: "loading",
  web: "loading",
  postgres: "loading",
};

const ALL_UNKNOWN: DockerStatus = { nginx: "unknown", api: "unknown", web: "unknown", postgres: "unknown" };

async function fetchDockerHealth(): Promise<DockerStatus> {
  try {
    const token = getToken();
    // Sem token: nem vale a pena chamar (o endpoint exige admin) — não dá pra checar, não é "offline".
    if (!token) return ALL_UNKNOWN;
    const res = await fetch(`${API_URL}/health/services`, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return ALL_UNKNOWN; // inclui 401 de sessão expirada — não é sinal de infra caída.
    const data = (await res.json()) as ServicesResponse;
    const s = data.services ?? {};
    const resolve = (name: string): ServiceStatus => (s[name] ? (s[name].status === "online" ? "online" : "offline") : "unknown");
    return { nginx: resolve("nginx"), api: resolve("api"), web: resolve("web"), postgres: resolve("postgres") };
  } catch {
    return ALL_UNKNOWN; // falha de rede — idem, não é sinal de infra caída.
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
