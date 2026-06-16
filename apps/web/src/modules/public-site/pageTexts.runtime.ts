import { useEffect, useSyncExternalStore } from "react";
import { logger } from "../../utils/logger";
import { type PageTextsMap, type PageTextValue, DEFAULT_PAGE_TEXTS } from "./pageTexts";

type PageTextsResponse = { texts?: unknown };

const API_URL = import.meta.env.VITE_API_URL || "";
const PAGE_TEXTS_STORAGE_KEY = "jlr.public.pageTexts.snapshot.v1";

let pageTextsSnapshot: PageTextsMap = { ...DEFAULT_PAGE_TEXTS };
let pageTextsBootstrapPromise: Promise<void> | null = null;
let pageTextsReady = false;

const subscribers = new Set<() => void>();

const subscribePageTextsStore = (listener: () => void): (() => void) => {
  subscribers.add(listener);
  return () => { subscribers.delete(listener); };
};

const notifySubscribers = (): void => {
  for (const listener of subscribers) listener();
};

const isValidPageTextsMap = (value: unknown): value is PageTextsMap => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  for (const v of Object.values(value as Record<string, unknown>)) {
    if (typeof v !== "string" && !Array.isArray(v)) return false;
  }
  return true;
};

const readPersistedSnapshot = (): PageTextsMap | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PAGE_TEXTS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return isValidPageTextsMap(parsed) ? (parsed as PageTextsMap) : null;
  } catch (error) {
    logger.warn("Falha ao ler pageTexts persistido; usando fallback", {
      error: error instanceof Error ? error.message : "erro inesperado",
    });
    return null;
  }
};

const persistSnapshot = (value: PageTextsMap): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PAGE_TEXTS_STORAGE_KEY, JSON.stringify(value));
  } catch (error) {
    logger.warn("Falha ao persistir pageTexts no navegador", {
      error: error instanceof Error ? error.message : "erro inesperado",
    });
  }
};

const applySnapshot = (next: PageTextsMap): void => {
  pageTextsSnapshot = next;
  persistSnapshot(pageTextsSnapshot);
  notifySubscribers();
};

const persisted = readPersistedSnapshot();
if (persisted) pageTextsSnapshot = persisted;

export const bootstrapPageTextsOnce = async (): Promise<void> => {
  if (pageTextsBootstrapPromise) { await pageTextsBootstrapPromise; return; }
  if (pageTextsReady) return;

  pageTextsBootstrapPromise = (async () => {
    try {
      const response = await fetch(`${API_URL}/api/public/page-texts`, { method: "GET" });
      if (!response.ok) throw new Error(`status ${response.status}`);
      const payload = (await response.json()) as PageTextsResponse;
      if (isValidPageTextsMap(payload.texts)) {
        applySnapshot(payload.texts as PageTextsMap);
      }
    } catch (error) {
      logger.warn("Falha ao carregar pageTexts publicos; mantendo fallback", {
        error: error instanceof Error ? error.message : "erro inesperado",
      });
    } finally {
      pageTextsReady = true;
      pageTextsBootstrapPromise = null;
    }
  })();

  await pageTextsBootstrapPromise;
};

export const getPageTextsSnapshot = (): PageTextsMap => pageTextsSnapshot;

export const updatePageTextsSnapshot = (next: unknown): void => {
  if (isValidPageTextsMap(next)) {
    applySnapshot(next as PageTextsMap);
    pageTextsReady = true;
  }
};

export const usePublicPageTextsBootstrap = (): void => {
  useEffect(() => {
    bootstrapPageTextsOnce().catch((error: unknown) => {
      logger.warn("Falha inesperada no bootstrap de pageTexts", {
        error: error instanceof Error ? error.message : "erro inesperado",
      });
    });
  }, []);
};

const getStoreSnapshot = (): PageTextsMap => pageTextsSnapshot;
const getStoreServerSnapshot = (): PageTextsMap => pageTextsSnapshot;

export const usePageTexts = (): PageTextsMap => {
  usePublicPageTextsBootstrap();
  return useSyncExternalStore(subscribePageTextsStore, getStoreSnapshot, getStoreServerSnapshot);
};

export const usePageText = (key: string): PageTextValue => {
  const texts = usePageTexts();
  return texts[key] ?? "";
};
