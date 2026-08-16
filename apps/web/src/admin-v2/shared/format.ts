/** Admin V2 (PLAN-0022) — mesmos formatadores usados em apps/web/src/modules/admin-kpis. */

export const formatCurrencyBRL = (value: number): string => {
  const normalized = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(normalized);
};

export const formatSignedPercent = (value: number): string => {
  const normalized = Number.isFinite(value) ? value : 0;
  const prefix = normalized > 0 ? "+" : "";
  return `${prefix}${normalized.toFixed(1)}%`;
};

export const formatSignedPp = (value: number): string => {
  const normalized = Number.isFinite(value) ? value : 0;
  const prefix = normalized > 0 ? "+" : "";
  return `${prefix}${normalized.toFixed(1)} p.p.`;
};

/** Minutos -> texto curto ("45 min" / "3h" / "2d"). Usado tanto para idade de pedido quanto para média de transição (Onda 3, RETROFIT-004). */
export const formatMinutes = (minutes: number): string => {
  const normalized = Number.isFinite(minutes) ? Math.max(0, minutes) : 0;
  if (normalized < 60) return `${Math.round(normalized)} min`;
  const hours = normalized / 60;
  if (hours < 48) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
};

/** "YYYY-MM-DD" -> "dd/mm" (Onda 4, RETROFIT-005 — cabeçalho de coluna do heatmap). */
export const formatShortDate = (isoDate: string): string => {
  const [, month, day] = isoDate.split("-");
  return `${day}/${month}`;
};

export const WEEKDAY_LABELS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"] as const;

/** Rótulo de hora curto ("9h" / "14h") usado nas linhas do heatmap de capacidade. */
export const formatHour = (hour: number): string => `${hour}h`;

/** ISO datetime -> "dd/mm/aaaa HH:MM" (pt-BR), "—" para vazio/inválido. Onda 9 (WhatsApp/Integrações). */
export const formatDateTimeBR = (value?: string | null): string => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};
