const DAY_IN_MS = 24 * 60 * 60 * 1000;
const DEFAULT_PERIOD_DAYS = 30;
const MAX_PERIOD_DAYS = 365;

export type AdminPeriodInput = {
  from?: string;
  to?: string;
  days?: number;
};

export type AdminPeriodRange = {
  from: Date;
  to: Date;
  previousFrom: Date;
  previousTo: Date;
  days: number;
};

const toStartOfDay = (value: Date): Date => {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
};

const toEndOfDay = (value: Date): Date => {
  const next = new Date(value);
  next.setHours(23, 59, 59, 999);
  return next;
};

const parseDateBoundary = (
  value: string | undefined,
  boundary: "start" | "end",
  errorCode: string
): Date | null => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(errorCode);
  }
  return boundary === "start" ? toStartOfDay(parsed) : toEndOfDay(parsed);
};

export const resolveAdminPeriodRange = (input: AdminPeriodInput): AdminPeriodRange => {
  const to = parseDateBoundary(input.to, "end", "invalid_period_to") ?? toEndOfDay(new Date());
  const parsedDays = input.days ?? DEFAULT_PERIOD_DAYS;
  if (!Number.isFinite(parsedDays) || parsedDays <= 0 || parsedDays > MAX_PERIOD_DAYS) {
    throw new Error("invalid_days");
  }
  const days = Math.floor(parsedDays);
  const from =
    parseDateBoundary(input.from, "start", "invalid_period_from") ??
    toStartOfDay(new Date(to.getTime() - (days - 1) * DAY_IN_MS));

  if (from.getTime() > to.getTime()) {
    throw new Error("invalid_period_range");
  }

  const spanMs = to.getTime() - from.getTime() + 1;
  const previousTo = new Date(from.getTime() - 1);
  const previousFrom = new Date(previousTo.getTime() - spanMs + 1);

  return {
    from,
    to,
    previousFrom,
    previousTo,
    days: Math.max(1, Math.round(spanMs / DAY_IN_MS)),
  };
};

