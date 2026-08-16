import type { PageTextValue } from "../../../modules/public-site/pageTexts";

/**
 * Admin V2 (PLAN-0026, Onda 5) — tipo do catálogo de Textos das Páginas, espelhando
 * `PageTextEntry` (`apps/api/src/modules/pageTexts/catalog.ts`). `StyleId`/`TextSegment`/
 * `PageTextValue`/`PageTextsMap` vêm do módulo utilitário compartilhado
 * `modules/public-site/pageTexts.ts` (não é módulo `admin-*` legado, é usado pelo site
 * público também — reuso, não edição do legado).
 */

export type PageTextCatalogEntry = {
  key: string;
  page: "home" | "franquias" | "assinaturas" | "global";
  section: string;
  label: string;
  type: "simple" | "segmented";
  defaultValue: PageTextValue;
};

export type PageTextsMap = Record<string, PageTextValue>;
