export const getGreetingByHour = (now: Date): string => {
  const hour = now.getHours();
  if (hour >= 5 && hour < 12) return "Bom Dia";
  if (hour >= 12 && hour < 18) return "Boa Tarde";
  return "Boa Noite";
};

const toDisplayName = (rawName?: string | null): string | null => {
  const normalized = (rawName || "").trim();
  if (!normalized) return null;
  const firstName = normalized.split(/\s+/)[0] || "";
  return firstName || null;
};

export const buildOpeningGreeting = (
  now: Date = new Date(),
  customerName?: string | null
): string => {
  const greeting = getGreetingByHour(now);
  const displayName = toDisplayName(customerName);
  if (displayName) {
    return `${greeting} ${displayName}, seja bem vinda.\nQual tratamento deseja fazer hoje?`;
  }
  return `${greeting}! Seja bem vinda.\nQual tratamento deseja fazer hoje?`;
};
