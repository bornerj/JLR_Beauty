import { z } from "zod";
import prisma from "../../lib/prisma";
import { logger } from "../../utils/logger";
import {
  PAGE_TEXT_CATALOG,
  PAGE_TEXTS_CATALOG_MAP,
  type PageTextValue,
  type TextSegment,
} from "./catalog";

export const PUBLIC_PAGE_TEXTS_SETTING_KEY = "public.pageTexts";
export const PUBLIC_PAGE_TEXTS_PREVIOUS_KEY = "public.pageTexts.previous";

const DEFAULT_PAGE_TEXTS_CACHE_TTL_MS = 5 * 60 * 1000;

const parsePageTextsCacheTtlMs = (): number => {
  const raw = Number(process.env.PAGE_TEXTS_CACHE_TTL_MS ?? DEFAULT_PAGE_TEXTS_CACHE_TTL_MS);
  if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_PAGE_TEXTS_CACHE_TTL_MS;
  return Math.floor(raw);
};

const PAGE_TEXTS_CACHE_TTL_MS = parsePageTextsCacheTtlMs();

const textSegmentSchema: z.ZodType<TextSegment> = z.object({
  text: z.string(),
  style: z.enum(["default", "gold-gradient", "primary", "gold", "bold", "uppercase"]),
});

const pageTextValueSchema: z.ZodType<PageTextValue> = z.union([
  z.string(),
  z.array(textSegmentSchema),
]);

export const pageTextsPayloadSchema = z.object({
  texts: z.record(z.string(), pageTextValueSchema),
});

export type PageTextsMap = Record<string, PageTextValue>;

let pageTextsCache: PageTextsMap | null = null;
let pageTextsCacheExpiresAt = 0;

const buildDefaultPageTexts = (): PageTextsMap => {
  const result: PageTextsMap = {};
  for (const entry of PAGE_TEXT_CATALOG) {
    result[entry.key] = entry.defaultValue;
  }
  return result;
};

const mergeWithDefaults = (stored: Record<string, unknown>): PageTextsMap => {
  const defaults = buildDefaultPageTexts();
  const result: PageTextsMap = { ...defaults };
  for (const entry of PAGE_TEXT_CATALOG) {
    const raw = stored[entry.key];
    if (raw === undefined) continue;
    const parsed = pageTextValueSchema.safeParse(raw);
    if (parsed.success) {
      result[entry.key] = parsed.data;
    }
  }
  return result;
};

const readPageTextsFromSettings = async (): Promise<PageTextsMap | null> => {
  const setting = await prisma.setting.findUnique({
    where: { key: PUBLIC_PAGE_TEXTS_SETTING_KEY },
    select: { value: true },
  });
  if (!setting?.value || typeof setting.value !== "object") return null;
  return mergeWithDefaults(setting.value as Record<string, unknown>);
};

export const getPublicPageTexts = async (): Promise<PageTextsMap> => {
  const now = Date.now();
  if (pageTextsCache && now < pageTextsCacheExpiresAt) {
    return { ...pageTextsCache };
  }

  const fromSettings = await readPageTextsFromSettings();
  const resolved = fromSettings ?? buildDefaultPageTexts();
  pageTextsCache = resolved;
  pageTextsCacheExpiresAt = now + PAGE_TEXTS_CACHE_TTL_MS;
  return { ...pageTextsCache };
};

export const getPreviousPageTexts = async (): Promise<PageTextsMap | null> => {
  const setting = await prisma.setting.findUnique({
    where: { key: PUBLIC_PAGE_TEXTS_PREVIOUS_KEY },
    select: { value: true },
  });
  if (!setting?.value || typeof setting.value !== "object") return null;
  return mergeWithDefaults(setting.value as Record<string, unknown>);
};

export const savePublicPageTexts = async (texts: PageTextsMap): Promise<PageTextsMap> => {
  const sanitized: PageTextsMap = {};
  for (const [key, value] of Object.entries(texts)) {
    if (!PAGE_TEXTS_CATALOG_MAP.has(key)) continue;
    const parsed = pageTextValueSchema.safeParse(value);
    if (parsed.success) {
      sanitized[key] = parsed.data;
    } else {
      logger.warn("pageTexts: valor inválido ignorado", { key });
    }
  }

  const merged = mergeWithDefaults(sanitized);

  const currentSetting = await prisma.setting.findUnique({
    where: { key: PUBLIC_PAGE_TEXTS_SETTING_KEY },
    select: { value: true },
  });
  if (currentSetting?.value && typeof currentSetting.value === "object") {
    await prisma.setting.upsert({
      where: { key: PUBLIC_PAGE_TEXTS_PREVIOUS_KEY },
      create: { key: PUBLIC_PAGE_TEXTS_PREVIOUS_KEY, value: currentSetting.value },
      update: { value: currentSetting.value },
    });
  }

  await prisma.setting.upsert({
    where: { key: PUBLIC_PAGE_TEXTS_SETTING_KEY },
    create: { key: PUBLIC_PAGE_TEXTS_SETTING_KEY, value: merged },
    update: { value: merged },
  });

  pageTextsCache = merged;
  pageTextsCacheExpiresAt = Date.now() + PAGE_TEXTS_CACHE_TTL_MS;
  return { ...pageTextsCache };
};

export const invalidatePublicPageTextsCache = (): void => {
  pageTextsCache = null;
  pageTextsCacheExpiresAt = 0;
};

export { PAGE_TEXT_CATALOG };
