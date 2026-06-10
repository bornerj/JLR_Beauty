export const publicSectionToggles = {
  assinaturas: {
    about: false,
    hero: true,
    membership: true,
    testimonials: false
  },
  franquias: {
    contact: true,
    hero: true,
    models: true,
    vision: true
  },
  home: {
    about: true,
    cta: true,
    hero: true,
    membership: false,
    products: true,
    services: true,
    testimonials: true
  }
} as const;

export type PublicSectionToggleMap = typeof publicSectionToggles;

export type PublicPageKey = keyof PublicSectionToggleMap;

export type PublicSectionToggleSnapshot = Record<string, Record<string, boolean>>;

export const createDefaultPublicSectionTogglesSnapshot = (): PublicSectionToggleSnapshot => {
  return Object.entries(publicSectionToggles).reduce<PublicSectionToggleSnapshot>((acc, [page, sections]) => {
    acc[page] = Object.entries(sections).reduce<Record<string, boolean>>((inner, [section, enabled]) => {
      inner[section] = Boolean(enabled);
      return inner;
    }, {});
    return acc;
  }, {});
};

export const isPublicSectionEnabled = (
  page: PublicPageKey,
  section: string
): boolean => {
  const sectionMap = publicSectionToggles[page] as Record<string, boolean>;
  return sectionMap[section] ?? false;
};
