import { getMediaSlotCatalog, type MediaSlotId } from "../../../modules/public-site/mediaSlots";

/**
 * PLAN-0037 — dados de exibição da tela "Seções Telas" (rótulo amigável + wireframe de
 * fallback + miniatura). Curado à mão pelo mesmo motivo de `SECTION_ORDER` no
 * `SectionTogglesView.tsx`: reflete a ordem/semântica real das páginas públicas, não algo
 * derivável do banco.
 */

export type SectionThumbnailArchetype = "hero" | "split" | "cards" | "gallery" | "cta";

export const SECTION_LABELS: Record<string, Record<string, string>> = {
  home: {
    hero: "Hero — capa principal",
    services: "Serviços em destaque",
    membership: "Planos de assinatura",
    about: "Sobre a JLR",
    mission: "Missão",
    products: "Produtos",
    testimonials: "Depoimentos",
    cta: "Chamada final (CTA)",
  },
  franquias: {
    hero: "Hero — capa Franquias",
    hero_gallery: "Galeria do Hero",
    about: "Sobre o modelo",
    vision: "Visão",
    founder: "Fundadora",
    benefits: "Benefícios",
    mission: "Missão",
    models: "Modelos (Essencial/Prime/Master)",
    fran01: "Destaque — baixo investimento",
    fran02: "Destaque — marca consolidada",
    fran03: "Destaque — suporte contínuo",
    gestao_app: "Gestão via App",
    fluxo_caixa: "Fluxo de Caixa",
    marketing_crm: "Marketing & CRM",
    expansao: "Plano de Expansão",
    perfil: "Perfil do Franqueado",
    suporte: "Suporte ao Franqueado",
    etapas: "Etapas de Adesão",
    contact: "Contato",
  },
  assinaturas: {
    hero: "Hero — capa Assinaturas",
    membership: "Planos",
    about: "Sobre a assinatura",
    mission: "Missão",
    testimonials: "Depoimentos",
  },
};

export const SECTION_ARCHETYPE: Record<string, Record<string, SectionThumbnailArchetype>> = {
  home: {
    hero: "hero",
    services: "cards",
    membership: "split",
    about: "split",
    mission: "split",
    products: "gallery",
    testimonials: "gallery",
    cta: "cta",
  },
  franquias: {
    hero: "hero",
    hero_gallery: "gallery",
    about: "split",
    vision: "split",
    founder: "split",
    benefits: "cards",
    mission: "split",
    models: "gallery",
    fran01: "cards",
    fran02: "cards",
    fran03: "cards",
    gestao_app: "split",
    fluxo_caixa: "split",
    marketing_crm: "split",
    expansao: "split",
    perfil: "split",
    suporte: "split",
    etapas: "cards",
    contact: "cta",
  },
  assinaturas: {
    hero: "hero",
    membership: "cards",
    about: "split",
    mission: "split",
    testimonials: "gallery",
  },
};

/**
 * Resolve qual slot da Galeria de Mídias representa uma seção do toggle. Match exato
 * `page`+`section`, menor `order` primeiro — com 2 exceções documentadas (ver PLAN-0037):
 * (1) Franquias separa "hero" e "hero_gallery" como toggles distintos, mas o catálogo de
 * mídia agrupa as duas sob `section: "hero"`, diferenciadas só pelo `id`/`order`; (2) "mission"
 * de qualquer página usa um slot único compartilhado (`page: "global"`).
 */
export const resolveSectionThumbnailSlotId = (page: string, section: string): MediaSlotId | null => {
  const catalog = getMediaSlotCatalog();

  if (section === "mission") {
    const shared = catalog.find((slot) => slot.page === "global" && slot.section === "mission");
    return shared?.id ?? null;
  }

  if (page === "franquias" && (section === "hero" || section === "hero_gallery")) {
    const wantsGallery = section === "hero_gallery";
    const candidates = catalog
      .filter((slot) => slot.page === "franquias" && slot.section === "hero" && slot.id.includes("gallery") === wantsGallery)
      .sort((left, right) => left.order - right.order);
    return candidates[0]?.id ?? null;
  }

  const candidates = catalog
    .filter((slot) => slot.page === page && slot.section === section)
    .sort((left, right) => left.order - right.order);
  return candidates[0]?.id ?? null;
};
