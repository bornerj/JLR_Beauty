import { useEffect, useRef, type ReactElement } from "react";
import type { DockerStatus, ServiceStatus } from "./useDockerHealth";

type Props = {
  visible: boolean;
  onClose: () => void;
  status: DockerStatus;
  isLoading: boolean;
};

const SERVICE_ROWS: [keyof DockerStatus, string][] = [
  ["nginx",    "Nginx"],
  ["api",      "API"],
  ["web",      "Web"],
  ["postgres", "PostgreSQL"],
];

const LED_CLASS: Record<ServiceStatus, string> = {
  online:  "db-status-led db-status-led--online",
  offline: "db-status-led db-status-led--offline",
  loading: "db-status-led db-status-led--unknown",
};

const STATUS_LABEL: Record<ServiceStatus, string> = {
  online:  "Online",
  offline: "Offline",
  loading: "Verificando...",
};

const STATUS_COLOR: Record<ServiceStatus, string> = {
  online:  "#198754",
  offline: "#ef4444",
  loading: "#b58b2a",
};

const AUTO_CLOSE_MS = 10_000;

export default function DockerStatusModal({ visible, onClose, status, isLoading }: Props): ReactElement | null {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) return;
    timerRef.current = setTimeout(onClose, AUTO_CLOSE_MS);
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Status da infraestrutura"
      style={{
        position:     "fixed",
        bottom:       "1.5rem",
        right:        "1.5rem",
        zIndex:       999,
        background:   "#f3efe0",
        border:       "1px solid #d4af37",
        borderRadius: "0.75rem",
        boxShadow:    "0 8px 32px rgba(0,0,0,0.2)",
        padding:      "0.9rem 1.1rem",
        minWidth:     "210px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem", gap: "0.5rem" }}>
        <span style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#4a5f54" }}>
          Infraestrutura
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#4a5f54", display: "flex", alignItems: "center" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>close</span>
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
        {SERVICE_ROWS.map(([key, label]) => {
          const s: ServiceStatus = isLoading ? "loading" : status[key];
          return (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
              <span className={LED_CLASS[s]} aria-hidden="true" />
              <span style={{ flex: 1, fontSize: "0.78rem", fontWeight: 500, color: "#1b2f24" }}>
                {label}
              </span>
              <span style={{ fontSize: "0.68rem", fontWeight: 700, color: STATUS_COLOR[s] }}>
                {STATUS_LABEL[s]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
