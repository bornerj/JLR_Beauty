import { useEffect, useSyncExternalStore } from "react";
import { logger } from "../../utils/logger";
import { cloneBranding, DEFAULT_BRANDING, type PublicBranding } from "./branding";

type BrandingResponse = {
  branding?: unknown;
};

const API_URL = import.meta.env.VITE_API_URL || "";
const BRANDING_SNAPSHOT_STORAGE_KEY = "jlr.public.branding.snapshot.v1";

let brandingSnapshot: PublicBranding = cloneBranding(DEFAULT_BRANDING);
let brandingVersion = 0;
let brandingBootstrapPromise: Promise<void> | null = null;
let brandingReady = false;

const subscribers = new Set<() => void>();

const subscribeBrandingStore = (listener: () => void): (() => void) => {
  subscribers.add(listener);
  return () => {
    subscribers.delete(listener);
  };
};

const notifySubscribers = (): void => {
  for (const listener of subscribers) {
    listener();
  }
};

const normalizeBrandingString = (value: unknown, fallback: string): string => {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim();
  return normalized || fallback;
};

const normalizeBrandingSnapshot = (value: unknown): PublicBranding => {
  if (!value || typeof value !== "object") return cloneBranding(DEFAULT_BRANDING);
  const candidate = value as Record<string, unknown>;
  return {
    fullName: normalizeBrandingString(candidate.fullName, DEFAULT_BRANDING.fullName),
    shortName: normalizeBrandingString(candidate.shortName, DEFAULT_BRANDING.shortName),
    logoUrl: normalizeBrandingString(candidate.logoUrl, DEFAULT_BRANDING.logoUrl),
  };
};

const readPersistedBrandingSnapshot = (): PublicBranding | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(BRANDING_SNAPSHOT_STORAGE_KEY);
    if (!raw) return null;
    return normalizeBrandingSnapshot(JSON.parse(raw));
  } catch (error) {
    logger.warn("Falha ao ler branding persistido no navegador; mantendo fallback local", {
      error: error instanceof Error ? error.message : "erro inesperado",
    });
    return null;
  }
};

const persistBrandingSnapshot = (value: PublicBranding): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BRANDING_SNAPSHOT_STORAGE_KEY, JSON.stringify(value));
  } catch (error) {
    logger.warn("Falha ao persistir branding no navegador", {
      error: error instanceof Error ? error.message : "erro inesperado",
    });
  }
};

const hydrateBrandingSnapshot = (): void => {
  const persisted = readPersistedBrandingSnapshot();
  if (!persisted) return;
  brandingSnapshot = cloneBranding(persisted);
};

const applyBrandingSnapshot = (next: PublicBranding): void => {
  brandingSnapshot = cloneBranding(next);
  persistBrandingSnapshot(brandingSnapshot);
  brandingVersion += 1;
  notifySubscribers();
};

hydrateBrandingSnapshot();

export const bootstrapBrandingOnce = async (): Promise<void> => {
  if (brandingBootstrapPromise) {
    await brandingBootstrapPromise;
    return;
  }
  if (brandingReady) return;

  brandingBootstrapPromise = (async () => {
    try {
      const response = await fetch(`${API_URL}/api/public/branding`, { method: "GET" });
      if (!response.ok) {
        throw new Error(`status ${response.status}`);
      }
      const payload = (await response.json()) as BrandingResponse;
      applyBrandingSnapshot(normalizeBrandingSnapshot(payload.branding));
    } catch (error) {
      logger.warn("Falha ao carregar branding publico; mantendo fallback local", {
        error: error instanceof Error ? error.message : "erro inesperado",
      });
    } finally {
      brandingReady = true;
      brandingBootstrapPromise = null;
    }
  })();

  await brandingBootstrapPromise;
};

export const getBrandingSnapshot = (): PublicBranding => {
  return cloneBranding(brandingSnapshot);
};

const getStoreSnapshot = (): PublicBranding => brandingSnapshot;
const getStoreServerSnapshot = (): PublicBranding => brandingSnapshot;

export const subscribeBranding = (listener: () => void): (() => void) => {
  return subscribeBrandingStore(listener);
};

export const updateBrandingSnapshot = (next: unknown): PublicBranding => {
  const normalized = normalizeBrandingSnapshot(next);
  applyBrandingSnapshot(normalized);
  brandingReady = true;
  return getBrandingSnapshot();
};

export const usePublicBrandingBootstrap = (): void => {
  useEffect(() => {
    bootstrapBrandingOnce().catch((error: unknown) => {
      logger.warn("Falha inesperada no bootstrap de branding publico", {
        error: error instanceof Error ? error.message : "erro inesperado",
      });
    });
  }, []);
};

export const useBrandingVersion = (): number => {
  return useSyncExternalStore(subscribeBrandingStore, () => brandingVersion, () => brandingVersion);
};

export const useBranding = (): PublicBranding => {
  usePublicBrandingBootstrap();
  return useSyncExternalStore(subscribeBrandingStore, getStoreSnapshot, getStoreServerSnapshot);
};
