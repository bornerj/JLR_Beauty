import { z } from "zod";
import prisma from "../../lib/prisma";
import { logger } from "../../utils/logger";

export const PUBLIC_BRANDING_SETTING_KEY = "public.branding";

const DEFAULT_BRANDING_CACHE_TTL_MS = 5 * 60 * 1000;
const DEFAULT_PUBLIC_BRANDING = {
  fullName: "JLR Beauty",
  shortName: "JLR",
  logoUrl: "/images/JLRLOGO.webp",
} as const;

export const brandingPayloadSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  shortName: z.string().trim().min(1).max(80),
  logoUrl: z.string().trim().min(1).max(2048),
});

export type PublicBranding = z.infer<typeof brandingPayloadSchema>;

const parseBrandingCacheTtlMs = (): number => {
  const raw = Number(process.env.BRANDING_CACHE_TTL_MS ?? DEFAULT_BRANDING_CACHE_TTL_MS);
  if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_BRANDING_CACHE_TTL_MS;
  return Math.floor(raw);
};

const BRANDING_CACHE_TTL_MS = parseBrandingCacheTtlMs();

let brandingCacheValue: PublicBranding | null = null;
let brandingCacheExpiresAt = 0;

const cloneBranding = (value: PublicBranding): PublicBranding => {
  return {
    fullName: value.fullName,
    shortName: value.shortName,
    logoUrl: value.logoUrl,
  };
};

const readBrandingFromSettings = async (): Promise<PublicBranding | null> => {
  const entry = await prisma.setting.findUnique({
    where: { key: PUBLIC_BRANDING_SETTING_KEY },
    select: { value: true },
  });
  if (!entry?.value) return null;
  const parsed = brandingPayloadSchema.safeParse(entry.value);
  if (!parsed.success) {
    logger.warn("Setting public.branding com formato invalido; usando fallback", {
      key: PUBLIC_BRANDING_SETTING_KEY,
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
    return null;
  }
  return cloneBranding(parsed.data);
};

export const getPublicBranding = async (): Promise<PublicBranding> => {
  const now = Date.now();
  if (brandingCacheValue && now < brandingCacheExpiresAt) {
    return cloneBranding(brandingCacheValue);
  }

  const fromSettings = await readBrandingFromSettings();
  const resolved = fromSettings ?? cloneBranding(DEFAULT_PUBLIC_BRANDING);
  brandingCacheValue = cloneBranding(resolved);
  brandingCacheExpiresAt = now + BRANDING_CACHE_TTL_MS;
  return cloneBranding(brandingCacheValue);
};

export const savePublicBranding = async (payload: unknown): Promise<PublicBranding> => {
  const normalized = cloneBranding(brandingPayloadSchema.parse(payload));
  const saved = await prisma.setting.upsert({
    where: { key: PUBLIC_BRANDING_SETTING_KEY },
    create: { key: PUBLIC_BRANDING_SETTING_KEY, value: normalized },
    update: { value: normalized },
    select: { value: true },
  });
  const parsedSaved = brandingPayloadSchema.safeParse(saved.value ?? normalized);
  const persisted = parsedSaved.success ? cloneBranding(parsedSaved.data) : normalized;
  brandingCacheValue = cloneBranding(persisted);
  brandingCacheExpiresAt = Date.now() + BRANDING_CACHE_TTL_MS;
  return cloneBranding(brandingCacheValue);
};

export const invalidatePublicBrandingCache = (): void => {
  brandingCacheValue = null;
  brandingCacheExpiresAt = 0;
};

