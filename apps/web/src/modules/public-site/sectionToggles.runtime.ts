import { useEffect, useSyncExternalStore } from "react";
import { logger } from "../../utils/logger";
import {
  createDefaultPublicSectionTogglesSnapshot,
  type PublicPageKey,
  type PublicSectionToggleSnapshot,
} from "./sectionToggles";

type SectionTogglesResponse = {
  toggles?: unknown;
};

const API_URL = import.meta.env.VITE_API_URL || "";

let snapshot: PublicSectionToggleSnapshot = createDefaultPublicSectionTogglesSnapshot();
let version = 0;
let fetchPromise: Promise<void> | null = null;
let hasAttemptedLoad = false;

const subscribers = new Set<() => void>();

const subscribe = (listener: () => void): (() => void) => {
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

const cloneSnapshot = (value: PublicSectionToggleSnapshot): PublicSectionToggleSnapshot => {
  return Object.entries(value).reduce<PublicSectionToggleSnapshot>((acc, [page, sections]) => {
    acc[page] = Object.entries(sections).reduce<Record<string, boolean>>((inner, [section, enabled]) => {
      inner[section] = Boolean(enabled);
      return inner;
    }, {});
    return acc;
  }, {});
};

const normalizeSnapshot = (value: unknown): PublicSectionToggleSnapshot => {
  const fallback = createDefaultPublicSectionTogglesSnapshot();
  if (!value || typeof value !== "object") return fallback;

  const candidate = value as Record<string, unknown>;
  for (const [page, sections] of Object.entries(candidate)) {
    if (!sections || typeof sections !== "object") continue;
    const fallbackSections = fallback[page] ?? {};
    const nextSections = { ...fallbackSections };
    for (const [section, enabled] of Object.entries(sections as Record<string, unknown>)) {
      nextSections[section] = Boolean(enabled);
    }
    fallback[page] = nextSections;
  }

  return fallback;
};

const applySnapshot = (next: PublicSectionToggleSnapshot): void => {
  snapshot = cloneSnapshot(next);
  version += 1;
  notifySubscribers();
};

export const ensurePublicSectionTogglesLoaded = async (): Promise<void> => {
  if (fetchPromise) {
    await fetchPromise;
    return;
  }
  if (hasAttemptedLoad) return;

  hasAttemptedLoad = true;
  fetchPromise = (async () => {
    try {
      const response = await fetch(`${API_URL}/api/public/section-toggles`, { method: "GET" });
      if (!response.ok) {
        throw new Error(`status ${response.status}`);
      }
      const payload = (await response.json()) as SectionTogglesResponse;
      const normalized = normalizeSnapshot(payload.toggles);
      applySnapshot(normalized);
    } catch (error) {
      logger.warn("Falha ao carregar section toggles publicos; mantendo fallback local", {
        error: error instanceof Error ? error.message : "erro inesperado",
      });
    } finally {
      fetchPromise = null;
    }
  })();

  await fetchPromise;
};

const getSnapshot = (): PublicSectionToggleSnapshot => snapshot;
const getServerSnapshot = (): PublicSectionToggleSnapshot => snapshot;

export const usePublicSectionTogglesBootstrap = (): void => {
  useEffect(() => {
    ensurePublicSectionTogglesLoaded().catch((error: unknown) => {
      logger.warn("Falha inesperada no bootstrap de section toggles publicos", {
        error: error instanceof Error ? error.message : "erro inesperado",
      });
    });
  }, []);
};

export const usePublicSectionTogglesVersion = (): number => {
  return useSyncExternalStore(subscribe, () => version, () => version);
};

export const usePublicPageSectionToggles = (page: PublicPageKey): Record<string, boolean> => {
  usePublicSectionTogglesBootstrap();
  return useSyncExternalStore(
    subscribe,
    () => getSnapshot()[page] ?? {},
    () => getServerSnapshot()[page] ?? {}
  );
};

export const usePublicSectionEnabled = (page: PublicPageKey, section: string): boolean => {
  const pageToggles = usePublicPageSectionToggles(page);
  return pageToggles[section] ?? false;
};

