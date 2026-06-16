export const publicSectionToggles = {
  assinaturas: {
    about: false,
    hero: true,
    membership: true,
    mission: false,
    testimonials: false
  },
  franquias: {
    about: false,
    benefits: true,
    contact: true,
    etapas: true,
    expansao: true,
    fran01: true,
    fran02: true,
    fran03: true,
    fluxo_caixa: true,
    founder: true,
    gestao_app: true,
    hero: true,
    hero_gallery: false,
    marketing_crm: true,
    mission: false,
    models: true,
    perfil: true,
    suporte: true,
    vision: true
  },
  home: {
    about: true,
    cta: true,
    hero: true,
    membership: false,
    mission: false,
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
