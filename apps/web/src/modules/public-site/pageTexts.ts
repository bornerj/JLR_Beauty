export type StyleId =
  | "default"
  | "gold-gradient"
  | "primary"
  | "gold"
  | "bold"
  | "uppercase";

export type TextSegment = { text: string; style: StyleId };
export type PageTextValue = string | TextSegment[];
export type PageTextsMap = Record<string, PageTextValue>;

export const STYLE_CLASS_MAP: Record<StyleId, string> = {
  "default":       "",
  "gold-gradient": "gold-gradient-text",
  "primary":       "text-primary",
  "gold":          "text-gold",
  "bold":          "font-bold",
  "uppercase":     "uppercase tracking-widest",
};

export const DEFAULT_PAGE_TEXTS: PageTextsMap = {};

export const isSegmented = (value: PageTextValue): value is TextSegment[] =>
  Array.isArray(value);

export const resolveText = (value: PageTextValue, context?: { fullName?: string }): string => {
  const raw = isSegmented(value) ? value.map((s) => s.text).join("") : value;
  if (!context?.fullName) return raw;
  return raw.replace(/\{fullName\}/g, context.fullName);
};
