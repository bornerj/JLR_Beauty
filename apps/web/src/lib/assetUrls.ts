const API_URL = import.meta.env.VITE_API_URL || "";

const getApiOrigin = (): string => {
  try {
    return new URL(API_URL).origin;
  } catch {
    return API_URL;
  }
};

const isLoopbackHost = (hostname: string): boolean => {
  const normalized = hostname.trim().toLowerCase();
  return normalized === "localhost" || normalized === "127.0.0.1";
};

export const resolveUploadedAssetUrl = (value?: string | null): string => {
  const raw = (value || "").trim();
  if (!raw) return "";
  if (raw.startsWith("data:")) return raw;
  if (/^[a-z]:\\/i.test(raw)) return "";
  if (raw.startsWith("//")) return `https:${raw}`;
  if (raw.startsWith("/uploads/")) return `${getApiOrigin()}${raw}`;
  if (raw.startsWith("uploads/")) return `${getApiOrigin()}/${raw}`;

  if (/^https?:\/\//i.test(raw)) {
    try {
      const parsed = new URL(raw);
      if (isLoopbackHost(parsed.hostname) && parsed.pathname.startsWith("/uploads/")) {
        return `${getApiOrigin()}${parsed.pathname}${parsed.search}`;
      }
      if (parsed.protocol === "http:" && parsed.hostname.endsWith("railway.app")) {
        return raw.replace(/^http:/i, "https:");
      }
      return raw;
    } catch {
      return raw;
    }
  }

  return raw;
};
