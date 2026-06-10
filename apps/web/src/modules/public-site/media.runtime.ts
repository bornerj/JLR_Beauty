import { useEffect, useSyncExternalStore } from "react";
import { resolveUploadedAssetUrl } from "../../lib/assetUrls";
import { logger } from "../../utils/logger";
import {
  clonePublicMediaSlotsSnapshot,
  createDefaultPublicMediaSlotsSnapshot,
  normalizePublicMediaSlotsSnapshot,
  type MediaSlotId,
  type PublicMediaSlotsSnapshot,
} from "./mediaSlots";

type PublicMediaSlotsResponse = {
  slots?: unknown;
};

const API_URL = import.meta.env.VITE_API_URL || "";
const MEDIA_SNAPSHOT_STORAGE_KEY = "jlr.public.media-slots.snapshot.v1";

let mediaSnapshot: PublicMediaSlotsSnapshot = createDefaultPublicMediaSlotsSnapshot();
let mediaVersion = 0;
let mediaBootstrapPromise: Promise<void> | null = null;
let mediaReady = false;

const subscribers = new Set<() => void>();

const subscribeMediaStore = (listener: () => void): (() => void) => {
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

const readPersistedMediaSnapshot = (): PublicMediaSlotsSnapshot | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(MEDIA_SNAPSHOT_STORAGE_KEY);
    if (!raw) return null;
    return normalizePublicMediaSlotsSnapshot(JSON.parse(raw));
  } catch (error) {
    logger.warn("Falha ao ler media slots persistidos no navegador; mantendo fallback local", {
      error: error instanceof Error ? error.message : "erro inesperado",
    });
    return null;
  }
};

const persistMediaSnapshot = (value: PublicMediaSlotsSnapshot): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MEDIA_SNAPSHOT_STORAGE_KEY, JSON.stringify(value));
  } catch (error) {
    logger.warn("Falha ao persistir media slots no navegador", {
      error: error instanceof Error ? error.message : "erro inesperado",
    });
  }
};

const hydrateMediaSnapshot = (): void => {
  const persisted = readPersistedMediaSnapshot();
  if (!persisted) return;
  mediaSnapshot = clonePublicMediaSlotsSnapshot(persisted);
};

const applyMediaSnapshot = (next: PublicMediaSlotsSnapshot): void => {
  mediaSnapshot = clonePublicMediaSlotsSnapshot(next);
  persistMediaSnapshot(mediaSnapshot);
  mediaVersion += 1;
  notifySubscribers();
};

const resolveMediaUrl = (value: string): string => {
  return resolveUploadedAssetUrl(value) || value;
};

hydrateMediaSnapshot();

export const bootstrapPublicMediaSlotsOnce = async (): Promise<void> => {
  if (mediaBootstrapPromise) {
    await mediaBootstrapPromise;
    return;
  }
  if (mediaReady) return;

  mediaBootstrapPromise = (async () => {
    try {
      const response = await fetch(`${API_URL}/api/public/media-slots`, { method: "GET" });
      if (!response.ok) {
        throw new Error(`status ${response.status}`);
      }
      const payload = (await response.json()) as PublicMediaSlotsResponse;
      applyMediaSnapshot(normalizePublicMediaSlotsSnapshot(payload.slots));
    } catch (error) {
      logger.warn("Falha ao carregar media slots publicos; mantendo fallback local", {
        error: error instanceof Error ? error.message : "erro inesperado",
      });
    } finally {
      mediaReady = true;
      mediaBootstrapPromise = null;
    }
  })();

  await mediaBootstrapPromise;
};

export const getPublicMediaSlotsSnapshot = (): PublicMediaSlotsSnapshot => {
  return clonePublicMediaSlotsSnapshot(mediaSnapshot);
};

const getStoreSnapshot = (): PublicMediaSlotsSnapshot => mediaSnapshot;
const getStoreServerSnapshot = (): PublicMediaSlotsSnapshot => mediaSnapshot;

export const subscribePublicMediaSlots = (listener: () => void): (() => void) => {
  return subscribeMediaStore(listener);
};

export const updateMediaSlotsSnapshot = (next: unknown): PublicMediaSlotsSnapshot => {
  const normalized = normalizePublicMediaSlotsSnapshot(next);
  applyMediaSnapshot(normalized);
  mediaReady = true;
  return getPublicMediaSlotsSnapshot();
};

export const usePublicMediaSlotsBootstrap = (): void => {
  useEffect(() => {
    bootstrapPublicMediaSlotsOnce().catch((error: unknown) => {
      logger.warn("Falha inesperada no bootstrap de media slots publicos", {
        error: error instanceof Error ? error.message : "erro inesperado",
      });
    });
  }, []);
};

export const usePublicMediaSlotsVersion = (): number => {
  return useSyncExternalStore(subscribeMediaStore, () => mediaVersion, () => mediaVersion);
};

export const usePublicMediaSlots = (): PublicMediaSlotsSnapshot => {
  usePublicMediaSlotsBootstrap();
  return useSyncExternalStore(subscribeMediaStore, getStoreSnapshot, getStoreServerSnapshot);
};

export const useMediaSlot = (slotId: MediaSlotId): string => {
  const slots = usePublicMediaSlots();
  return resolveMediaUrl(slots[slotId]);
};

