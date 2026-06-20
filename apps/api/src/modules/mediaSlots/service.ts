import { z } from "zod";
import prisma from "../../lib/prisma";
import { logger } from "../../utils/logger";

export const PUBLIC_MEDIA_SLOTS_SETTING_KEY = "public.mediaSlots";

const DEFAULT_MEDIA_SLOTS_CACHE_TTL_MS = 5 * 60 * 1000;

const MEDIA_SLOT_IDS = [
  "home_hero_bg_01",
  "home_about_img_01",
  "home_about_img_02",
  "home_about_img_03",
  "home_about_img_04",
  "home_about_img_05",
  "home_about_img_06",
  "home_about_img_07",
  "home_about_img_08",
  "home_services_card_img_01",
  "home_services_card_img_02",
  "home_services_card_img_03",
  "home_services_card_img_04",
  "home_services_card_img_05",
  "home_services_card_img_06",
  "home_services_card_img_07",
  "home_services_card_img_08",
  "home_services_card_img_09",
  "home_testimonials_avatar_01",
  "home_testimonials_avatar_02",
  "home_testimonials_avatar_03",
  "home_testimonials_avatar_04",
  "franquias_hero_bg_map_01",
  "franquias_hero_gallery_img_01",
  "franquias_hero_gallery_img_02",
  "franquias_hero_gallery_img_03",
  "franquias_hero_gallery_img_04",
  "franquias_hero_gallery_img_05",
  "franquias_hero_gallery_img_06",
  "franquias_hero_gallery_img_07",
  "franquias_hero_gallery_img_08",
  "franquias_models_card_img_01",
  "franquias_models_card_img_02",
  "franquias_models_card_img_03",
  "franquias_vision_img_01",
  "franquias_founder_main_img_01",
  "franquias_benefits_cell_img_01",
  "franquias_benefits_cell_img_02",
  "franquias_benefits_cell_img_03",
  "franquias_benefits_cell_img_04",
  "franquias_benefits_cell_img_05",
  "franquias_benefits_cell_img_06",
  "franquias_benefits_cell_img_07",
  "franquias_benefits_cell_img_08",
  "franquias_benefits_cell_img_09",
  "franquias_fran01_floorplan_img_01",
  "franquias_fran01_metric_icon_01", "franquias_fran01_metric_icon_02", "franquias_fran01_metric_icon_03",
  "franquias_fran01_metric_icon_04", "franquias_fran01_metric_icon_05", "franquias_fran01_metric_icon_06",
  "franquias_fran02_floorplan_img_01",
  "franquias_fran02_metric_icon_01", "franquias_fran02_metric_icon_02", "franquias_fran02_metric_icon_03",
  "franquias_fran02_metric_icon_04", "franquias_fran02_metric_icon_05", "franquias_fran02_metric_icon_06",
  "franquias_fran03_floorplan_img_01",
  "franquias_fran03_metric_icon_01", "franquias_fran03_metric_icon_02", "franquias_fran03_metric_icon_03",
  "franquias_fran03_metric_icon_04", "franquias_fran03_metric_icon_05", "franquias_fran03_metric_icon_06",
  "franquias_gestao_app_img_01",
  "franquias_fluxo_caixa_feature_img_01", "franquias_fluxo_caixa_feature_img_02", "franquias_fluxo_caixa_feature_img_03",
  "franquias_marketing_crm_img_01",
  "franquias_expansao_map_img_01",
  "franquias_perfil_img_01",
  "franquias_suporte_img_01",
  "assinaturas_hero_bg_01",
  "assinaturas_hero_card_img_01",
  "assinaturas_hero_card_img_02",
  "assinaturas_hero_card_img_03",
  "checkout_whatsapp_icon_01",
  "mission_center_img_01",
] as const;

type PublicMediaSlotId = (typeof MEDIA_SLOT_IDS)[number];

export type PublicMediaSlotCatalogItem = {
  id: PublicMediaSlotId;
  page: string;
  section: string;
  order: number;
  label: string;
  fallbackUrl: string;
};

const PUBLIC_MEDIA_SLOT_CATALOG: ReadonlyArray<PublicMediaSlotCatalogItem> = [
  {
    id: "home_hero_bg_01",
    page: "home",
    section: "hero",
    order: 1,
    label: "Home Hero - Fundo principal",
    fallbackUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBGlAanZP882cSxX_iZ1KCKut7YA_0sU7Yao8L4l_Sm1UxSejKl3_yv--pA0R57IfBYRBZxNDcUfcaKgcjkNGqxPlZBDPHL7dLNQ0oMp0FuzRPZmp_ltSquvEioDHB9hdFWOJVV06KBp0zEXyq5Emz49pA8MBqUVof_58ST254kB1D0MX-LlOZI_VE9maolCcZVrHoMYJikymuPnku8SVroyyH63JnaYchV4LFIgHP--PqAAcXlo10GPMj6pf8AmXTdAic1f_H8AVA",
  },
  {
    id: "home_about_img_01",
    page: "home",
    section: "about",
    order: 1,
    label: "Home About - Colagem 1",
    fallbackUrl: "/images/about_img1.webp",
  },
  {
    id: "home_about_img_02",
    page: "home",
    section: "about",
    order: 2,
    label: "Home About - Colagem 2",
    fallbackUrl: "/images/about_img2.webp",
  },
  {
    id: "home_about_img_03",
    page: "home",
    section: "about",
    order: 3,
    label: "Home About - Colagem 3",
    fallbackUrl: "/images/about_img3.webp",
  },
  {
    id: "home_about_img_04",
    page: "home",
    section: "about",
    order: 4,
    label: "Home About - Colagem 4",
    fallbackUrl: "/images/about_img4.webp",
  },
  {
    id: "home_about_img_05",
    page: "home",
    section: "about",
    order: 5,
    label: "Home About - Colagem 5",
    fallbackUrl: "/images/about_img5.webp",
  },
  {
    id: "home_about_img_06",
    page: "home",
    section: "about",
    order: 6,
    label: "Home About - Colagem 6",
    fallbackUrl: "/images/about_img6.webp",
  },
  {
    id: "home_about_img_07",
    page: "home",
    section: "about",
    order: 7,
    label: "Home About - Colagem 7",
    fallbackUrl: "/images/about_img7.webp",
  },
  {
    id: "home_about_img_08",
    page: "home",
    section: "about",
    order: 8,
    label: "Home About - Colagem 8",
    fallbackUrl: "/images/about_img1.webp",
  },
  {
    id: "home_services_card_img_01",
    page: "home",
    section: "services",
    order: 1,
    label: "Home Serviços - Card 1",
    fallbackUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuARr5EhNnwTTjU5vlGCN2g-k5I4Fk5IbzkhY7M2Z7hNSuHgjw72-n7jYz2nIL6kEYaEr2QMUh4UDzmoecfSlC9o6BrycwyRf7ATUC-faqNXHToAzrZteugibFPTXoxqaRaIQj1P-JvEWa4qsYuJKZ58dbph3ZWOGnXE34Y8S0_mtkPdyXssxJk8jwC0K4lgGNt7Q9v7f5AsQL1I8ftDD1qGZSMTDeTg1Il52tMs_XMMyUJnSxUw_O4b_90g_rEfz7CLKsjmV5eiPFE",
  },
  {
    id: "home_services_card_img_02",
    page: "home",
    section: "services",
    order: 2,
    label: "Home Serviços - Card 2",
    fallbackUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBFlMndGMRtfTguABIfBDd-3hHe5OvlsSXybdKCqkXMA1jrp2pijAYz9lJ-BPbiTp3zymW0erEQrQntmBsMYNX3ML5Q204mA5E2M5KV6YeXS8N-RRuyta2yFPAwbBfbuaoOZT09JQzAWDDPyMCZAxaIayvB-rDCfgOn-h3u4V5uMGeSVtUUNnY-q4zadhEYJjXh6VT0ExNFxzjpD_lrWvNaNaMRHqKXa3foc2lyFvd-7F9mUP7lYJN-6_PrpmV42rzWXbAokEJngJg",
  },
  {
    id: "home_services_card_img_03",
    page: "home",
    section: "services",
    order: 3,
    label: "Home Serviços - Card 3",
    fallbackUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC2j8nn6oj-qs-X2-WzwFVCFw_DmIPuHqaw6dMKzBxhxjmw59gYuClCcw1vAtnLmEEqwXvygjNJ7PTYy7dDm3Nsq1D3MdV-29TqJ2pMELeGmPK597YuPmNSP1rQSqIlVfjWnIkHkm6MB47xHYs_VE-EFkemKe4-hF37Frz8Q04wbN2OxdLgF9bTj4QqmbSLtBZg9zDKe0CTceA95qlG-_y1AQLybppm3kgiEv1qeNDURTzmAlJirpGFLyM1h5UjHWF_RKUh_Vffadk",
  },
  {
    id: "home_services_card_img_04",
    page: "home",
    section: "services",
    order: 4,
    label: "Home Serviços - Card 4",
    fallbackUrl: "/images/hidra.webp",
  },
  {
    id: "home_services_card_img_05",
    page: "home",
    section: "services",
    order: 5,
    label: "Home Serviços - Card 5",
    fallbackUrl: "/images/Services/servico3.webp",
  },
  {
    id: "home_services_card_img_06",
    page: "home",
    section: "services",
    order: 6,
    label: "Home Serviços - Card 6",
    fallbackUrl: "/images/Services/servico2.webp",
  },
  {
    id: "home_services_card_img_07",
    page: "home",
    section: "services",
    order: 7,
    label: "Home Serviços - Card 7",
    fallbackUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: "home_services_card_img_08",
    page: "home",
    section: "services",
    order: 8,
    label: "Home Serviços - Card 8",
    fallbackUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: "home_services_card_img_09",
    page: "home",
    section: "services",
    order: 9,
    label: "Home Serviços - Card 9",
    fallbackUrl: "https://images.unsplash.com/photo-1552693673-1bf958298935?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: "home_testimonials_avatar_01",
    page: "home",
    section: "testimonials",
    order: 1,
    label: "Home Depoimentos - Avatar 1",
    fallbackUrl: "/images/profis/pessoa1.webp",
  },
  {
    id: "home_testimonials_avatar_02",
    page: "home",
    section: "testimonials",
    order: 2,
    label: "Home Depoimentos - Avatar 2",
    fallbackUrl: "/images/profis/pessoa2.webp",
  },
  {
    id: "home_testimonials_avatar_03",
    page: "home",
    section: "testimonials",
    order: 3,
    label: "Home Depoimentos - Avatar 3",
    fallbackUrl: "/images/profis/pessoa3.webp",
  },
  {
    id: "home_testimonials_avatar_04",
    page: "home",
    section: "testimonials",
    order: 4,
    label: "Home Depoimentos - Avatar 4",
    fallbackUrl: "/images/profis/pessoa4.webp",
  },
  {
    id: "franquias_hero_bg_map_01",
    page: "franquias",
    section: "hero",
    order: 1,
    label: "Franquias Hero - Mapa de fundo",
    fallbackUrl: "/images/franchise/mapa_fundo.webp",
  },
  {
    id: "franquias_hero_gallery_img_01",
    page: "franquias",
    section: "hero",
    order: 2,
    label: "Franquias Hero - Colagem 1",
    fallbackUrl: "/images/franchise/franquias_img1.webp",
  },
  {
    id: "franquias_hero_gallery_img_02",
    page: "franquias",
    section: "hero",
    order: 3,
    label: "Franquias Hero - Colagem 2",
    fallbackUrl: "/images/franchise/franquias_img2.webp",
  },
  {
    id: "franquias_hero_gallery_img_03",
    page: "franquias",
    section: "hero",
    order: 4,
    label: "Franquias Hero - Colagem 3",
    fallbackUrl: "/images/franchise/franquias_img3.webp",
  },
  {
    id: "franquias_hero_gallery_img_04",
    page: "franquias",
    section: "hero",
    order: 5,
    label: "Franquias Hero - Colagem 4",
    fallbackUrl: "/images/franchise/franquias_img4.webp",
  },
  {
    id: "franquias_hero_gallery_img_05",
    page: "franquias",
    section: "hero",
    order: 6,
    label: "Franquias Hero - Colagem 5",
    fallbackUrl: "/images/franchise/franquias_img5.webp",
  },
  {
    id: "franquias_hero_gallery_img_06",
    page: "franquias",
    section: "hero",
    order: 7,
    label: "Franquias Hero - Colagem 6",
    fallbackUrl: "/images/franchise/franquias_img6.webp",
  },
  {
    id: "franquias_hero_gallery_img_07",
    page: "franquias",
    section: "hero",
    order: 8,
    label: "Franquias Hero - Colagem 7",
    fallbackUrl: "/images/franchise/franquias_img7.webp",
  },
  {
    id: "franquias_hero_gallery_img_08",
    page: "franquias",
    section: "hero",
    order: 9,
    label: "Franquias Hero - Colagem 8",
    fallbackUrl: "/images/franchise/franquias_img8.webp",
  },
  {
    id: "franquias_models_card_img_01",
    page: "franquias",
    section: "models",
    order: 1,
    label: "Franquias Modelos - Card Esmalteria",
    fallbackUrl: "/images/franchise/franquias_img7.webp",
  },
  {
    id: "franquias_models_card_img_02",
    page: "franquias",
    section: "models",
    order: 2,
    label: "Franquias Modelos - Card Padrão",
    fallbackUrl: "/images/franchise/franquias_img4.webp",
  },
  {
    id: "franquias_models_card_img_03",
    page: "franquias",
    section: "models",
    order: 3,
    label: "Franquias Modelos - Card Principal",
    fallbackUrl: "/images/franchise/franquias_img1.webp",
  },
  {
    id: "franquias_vision_img_01",
    page: "franquias",
    section: "vision",
    order: 1,
    label: "Franquias Visão - Imagem principal",
    fallbackUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCb29EWREojJ9LX2_noBAqpfiSfM1zlMC44x0gt4ZXLHJjgb8T39AVqnb8nVmwEwGc9jS25DolXl2F1VOlzMbuBEVToAl_cfKdkmL4NxITEsutoiN4lWmScfLNYXjYKeSSBaIF5OiAOM0xddNj9ZrgFOG419peUJZUWEhJnnwluRpqw2QFhCFqwLDiXyelAT03RpupNO6VVtg0zhEPi6wjrLmb14OCDGsxfVNA3wL996LLSrlEHPC-0eAqZANlYANFFtYhgLkNgmSg",
  },
  {
    id: "franquias_founder_main_img_01",
    page: "franquias",
    section: "founder",
    order: 1,
    label: "Franquias Founder - Foto da Fundadora",
    fallbackUrl: "/images/franchise/franquias_img1.webp",
  },
  { id: "franquias_benefits_cell_img_01", page: "franquias", section: "benefits", order: 1, label: "Benefícios - Ícone célula 1", fallbackUrl: "/images/franchise/franquias_img1.webp" },
  { id: "franquias_benefits_cell_img_02", page: "franquias", section: "benefits", order: 2, label: "Benefícios - Ícone célula 2", fallbackUrl: "/images/franchise/franquias_img2.webp" },
  { id: "franquias_benefits_cell_img_03", page: "franquias", section: "benefits", order: 3, label: "Benefícios - Ícone célula 3", fallbackUrl: "/images/franchise/franquias_img3.webp" },
  { id: "franquias_benefits_cell_img_04", page: "franquias", section: "benefits", order: 4, label: "Benefícios - Ícone célula 4", fallbackUrl: "/images/franchise/franquias_img1.webp" },
  { id: "franquias_benefits_cell_img_05", page: "franquias", section: "benefits", order: 5, label: "Benefícios - Ícone célula 5", fallbackUrl: "/images/franchise/franquias_img2.webp" },
  { id: "franquias_benefits_cell_img_06", page: "franquias", section: "benefits", order: 6, label: "Benefícios - Ícone célula 6", fallbackUrl: "/images/franchise/franquias_img3.webp" },
  { id: "franquias_benefits_cell_img_07", page: "franquias", section: "benefits", order: 7, label: "Benefícios - Ícone célula 7", fallbackUrl: "/images/franchise/franquias_img1.webp" },
  { id: "franquias_benefits_cell_img_08", page: "franquias", section: "benefits", order: 8, label: "Benefícios - Ícone célula 8", fallbackUrl: "/images/franchise/franquias_img2.webp" },
  { id: "franquias_benefits_cell_img_09", page: "franquias", section: "benefits", order: 9, label: "Benefícios - Ícone célula 9", fallbackUrl: "/images/franchise/franquias_img3.webp" },
  { id: "franquias_fran01_floorplan_img_01", page: "franquias", section: "fran01", order: 1, label: "Master - Planta baixa", fallbackUrl: "/images/franchise/franquias_img1.webp" },
  { id: "franquias_fran01_metric_icon_01", page: "franquias", section: "fran01", order: 2, label: "Master - Ícone métrica 1 (Payback)", fallbackUrl: "/images/franchise/franquias_img1.webp" },
  { id: "franquias_fran01_metric_icon_02", page: "franquias", section: "fran01", order: 3, label: "Master - Ícone métrica 2 (ROI)", fallbackUrl: "/images/franchise/franquias_img2.webp" },
  { id: "franquias_fran01_metric_icon_03", page: "franquias", section: "fran01", order: 4, label: "Master - Ícone métrica 3 (Faturamento)", fallbackUrl: "/images/franchise/franquias_img3.webp" },
  { id: "franquias_fran01_metric_icon_04", page: "franquias", section: "fran01", order: 5, label: "Master - Ícone métrica 4 (Lucro)", fallbackUrl: "/images/franchise/franquias_img1.webp" },
  { id: "franquias_fran01_metric_icon_05", page: "franquias", section: "fran01", order: 6, label: "Master - Ícone métrica 5 (Breakeven)", fallbackUrl: "/images/franchise/franquias_img2.webp" },
  { id: "franquias_fran01_metric_icon_06", page: "franquias", section: "fran01", order: 7, label: "Master - Ícone métrica 6 (Margem)", fallbackUrl: "/images/franchise/franquias_img3.webp" },
  { id: "franquias_fran02_floorplan_img_01", page: "franquias", section: "fran02", order: 1, label: "Prime - Planta baixa", fallbackUrl: "/images/franchise/franquias_img2.webp" },
  { id: "franquias_fran02_metric_icon_01", page: "franquias", section: "fran02", order: 2, label: "Prime - Ícone métrica 1 (Payback)", fallbackUrl: "/images/franchise/franquias_img1.webp" },
  { id: "franquias_fran02_metric_icon_02", page: "franquias", section: "fran02", order: 3, label: "Prime - Ícone métrica 2 (ROI)", fallbackUrl: "/images/franchise/franquias_img2.webp" },
  { id: "franquias_fran02_metric_icon_03", page: "franquias", section: "fran02", order: 4, label: "Prime - Ícone métrica 3 (Faturamento)", fallbackUrl: "/images/franchise/franquias_img3.webp" },
  { id: "franquias_fran02_metric_icon_04", page: "franquias", section: "fran02", order: 5, label: "Prime - Ícone métrica 4 (Lucro)", fallbackUrl: "/images/franchise/franquias_img1.webp" },
  { id: "franquias_fran02_metric_icon_05", page: "franquias", section: "fran02", order: 6, label: "Prime - Ícone métrica 5 (Breakeven)", fallbackUrl: "/images/franchise/franquias_img2.webp" },
  { id: "franquias_fran02_metric_icon_06", page: "franquias", section: "fran02", order: 7, label: "Prime - Ícone métrica 6 (Margem)", fallbackUrl: "/images/franchise/franquias_img3.webp" },
  { id: "franquias_fran03_floorplan_img_01", page: "franquias", section: "fran03", order: 1, label: "Essencial - Planta baixa", fallbackUrl: "/images/franchise/franquias_img3.webp" },
  { id: "franquias_fran03_metric_icon_01", page: "franquias", section: "fran03", order: 2, label: "Essencial - Ícone métrica 1 (Payback)", fallbackUrl: "/images/franchise/franquias_img1.webp" },
  { id: "franquias_fran03_metric_icon_02", page: "franquias", section: "fran03", order: 3, label: "Essencial - Ícone métrica 2 (ROI)", fallbackUrl: "/images/franchise/franquias_img2.webp" },
  { id: "franquias_fran03_metric_icon_03", page: "franquias", section: "fran03", order: 4, label: "Essencial - Ícone métrica 3 (Faturamento)", fallbackUrl: "/images/franchise/franquias_img3.webp" },
  { id: "franquias_fran03_metric_icon_04", page: "franquias", section: "fran03", order: 5, label: "Essencial - Ícone métrica 4 (Lucro)", fallbackUrl: "/images/franchise/franquias_img1.webp" },
  { id: "franquias_fran03_metric_icon_05", page: "franquias", section: "fran03", order: 6, label: "Essencial - Ícone métrica 5 (Breakeven)", fallbackUrl: "/images/franchise/franquias_img2.webp" },
  { id: "franquias_fran03_metric_icon_06", page: "franquias", section: "fran03", order: 7, label: "Essencial - Ícone métrica 6 (Margem)", fallbackUrl: "/images/franchise/franquias_img3.webp" },
  { id: "franquias_gestao_app_img_01",          page: "franquias", section: "gestao_app",   order: 1, label: "Gestão App - Mockup do app",        fallbackUrl: "/images/franchise/franquias_img1.webp" },
  { id: "franquias_fluxo_caixa_feature_img_01", page: "franquias", section: "fluxo_caixa", order: 1, label: "Fluxo de Caixa - Imagem feature 1", fallbackUrl: "/images/franchise/franquias_img1.webp" },
  { id: "franquias_fluxo_caixa_feature_img_02", page: "franquias", section: "fluxo_caixa", order: 2, label: "Fluxo de Caixa - Imagem feature 2", fallbackUrl: "/images/franchise/franquias_img2.webp" },
  { id: "franquias_fluxo_caixa_feature_img_03", page: "franquias", section: "fluxo_caixa", order: 3, label: "Fluxo de Caixa - Imagem feature 3", fallbackUrl: "/images/franchise/franquias_img3.webp" },
  { id: "franquias_marketing_crm_img_01",       page: "franquias", section: "marketing_crm", order: 1, label: "Marketing CRM - Foto produtos",  fallbackUrl: "/images/franchise/franquias_img2.webp" },
  { id: "franquias_expansao_map_img_01", page: "franquias", section: "expansao",     order: 1, label: "Expansão - Mapa SP",               fallbackUrl: "/images/franchise/franquias_img3.webp" },
  { id: "franquias_perfil_img_01",       page: "franquias", section: "perfil",       order: 1, label: "Perfil Franqueado - Foto pessoas",  fallbackUrl: "/images/franchise/franquias_img1.webp" },
  { id: "franquias_suporte_img_01",      page: "franquias", section: "suporte",      order: 1, label: "Suporte Franqueadora - Foto modelo", fallbackUrl: "/images/franchise/franquias_img2.webp" },
  {
    id: "assinaturas_hero_bg_01",
    page: "assinaturas",
    section: "hero",
    order: 1,
    label: "Assinaturas Hero - Fundo principal",
    fallbackUrl: "/images/hero3.webp",
  },
  {
    id: "assinaturas_hero_card_img_01",
    page: "assinaturas",
    section: "hero",
    order: 2,
    label: "Assinaturas Hero - Card 1",
    fallbackUrl: "/images/about_img2.webp",
  },
  {
    id: "assinaturas_hero_card_img_02",
    page: "assinaturas",
    section: "hero",
    order: 3,
    label: "Assinaturas Hero - Card 2",
    fallbackUrl: "/images/about_img4.webp",
  },
  {
    id: "assinaturas_hero_card_img_03",
    page: "assinaturas",
    section: "hero",
    order: 4,
    label: "Assinaturas Hero - Card 3",
    fallbackUrl: "/images/about_img3.webp",
  },
  {
    id: "checkout_whatsapp_icon_01",
    page: "checkout",
    section: "contact",
    order: 1,
    label: "Checkout - Ícone WhatsApp",
    fallbackUrl: "/images/whatsapp-icon-button.svg",
  },
  {
    id: "mission_center_img_01",
    page: "global",
    section: "mission",
    order: 1,
    label: "Missão/Visão - Foto central",
    fallbackUrl: "/images/about_img1.webp",
  },
];

const publicMediaSlotIdSchema = z.enum(MEDIA_SLOT_IDS);
const mediaSlotUrlSchema = z
  .string()
  .trim()
  .min(1)
  .max(2048)
  .refine((value) => value.startsWith("/") || /^https?:\/\//i.test(value), "url inválida");

export const mediaSlotsPayloadSchema = z.object({
  slots: z.record(z.string(), mediaSlotUrlSchema),
});

const parseMediaSlotsCacheTtlMs = (): number => {
  const raw = Number(process.env.MEDIA_SLOTS_CACHE_TTL_MS ?? DEFAULT_MEDIA_SLOTS_CACHE_TTL_MS);
  if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_MEDIA_SLOTS_CACHE_TTL_MS;
  return Math.floor(raw);
};

const MEDIA_SLOTS_CACHE_TTL_MS = parseMediaSlotsCacheTtlMs();

const mediaSlotCatalogIds = new Set(PUBLIC_MEDIA_SLOT_CATALOG.map((slot) => slot.id));
for (const slotId of MEDIA_SLOT_IDS) {
  if (!mediaSlotCatalogIds.has(slotId)) {
    throw new Error(`slot ${slotId} ausente no catalogo de media slots`);
  }
}

export type PublicMediaSlotsSnapshot = Record<PublicMediaSlotId, string>;

let mediaSlotsCacheValue: PublicMediaSlotsSnapshot | null = null;
let mediaSlotsCacheExpiresAt = 0;

const createDefaultMediaSlotsSnapshot = (): PublicMediaSlotsSnapshot => {
  const snapshot = {} as PublicMediaSlotsSnapshot;
  for (const slot of PUBLIC_MEDIA_SLOT_CATALOG) {
    snapshot[slot.id] = slot.fallbackUrl;
  }
  return snapshot;
};

const cloneMediaSlotsSnapshot = (value: PublicMediaSlotsSnapshot): PublicMediaSlotsSnapshot => {
  const cloned = {} as PublicMediaSlotsSnapshot;
  for (const slot of PUBLIC_MEDIA_SLOT_CATALOG) {
    cloned[slot.id] = value[slot.id];
  }
  return cloned;
};

const normalizeMediaSlotsFromUnknown = (
  value: unknown,
  options?: { warnInvalidValues?: boolean }
): PublicMediaSlotsSnapshot => {
  const defaults = createDefaultMediaSlotsSnapshot();
  const candidate =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;

  if (!candidate) return defaults;

  const invalidEntries: string[] = [];

  for (const slot of PUBLIC_MEDIA_SLOT_CATALOG) {
    const raw = candidate[slot.id];
    if (raw === undefined || raw === null) continue;
    const parsed = mediaSlotUrlSchema.safeParse(raw);
    if (parsed.success) {
      defaults[slot.id] = parsed.data;
      continue;
    }
    invalidEntries.push(slot.id);
  }

  if (options?.warnInvalidValues && invalidEntries.length > 0) {
    logger.warn("Setting public.mediaSlots contem valores invalidos; usando fallback por slot", {
      key: PUBLIC_MEDIA_SLOTS_SETTING_KEY,
      invalidSlotIds: invalidEntries,
    });
  }

  return defaults;
};

const normalizeMediaSlotsForSave = (
  slots: Record<string, string>
): PublicMediaSlotsSnapshot => {
  const normalized = createDefaultMediaSlotsSnapshot();
  for (const slot of PUBLIC_MEDIA_SLOT_CATALOG) {
    const slotId = slot.id;
    const raw = slots[slotId];
    if (raw === undefined) {
      normalized[slotId] = slot.fallbackUrl;
      continue;
    }
    normalized[slotId] = mediaSlotUrlSchema.parse(raw);
  }
  return normalized;
};

const readMediaSlotsFromSettings = async (): Promise<PublicMediaSlotsSnapshot | null> => {
  const entry = await prisma.setting.findUnique({
    where: { key: PUBLIC_MEDIA_SLOTS_SETTING_KEY },
    select: { value: true },
  });
  if (!entry?.value) return null;
  return normalizeMediaSlotsFromUnknown(entry.value, { warnInvalidValues: true });
};

export const getPublicMediaSlots = async (): Promise<PublicMediaSlotsSnapshot> => {
  const now = Date.now();
  if (mediaSlotsCacheValue && now < mediaSlotsCacheExpiresAt) {
    return cloneMediaSlotsSnapshot(mediaSlotsCacheValue);
  }

  const fromSettings = await readMediaSlotsFromSettings();
  const resolved = fromSettings ?? createDefaultMediaSlotsSnapshot();

  mediaSlotsCacheValue = cloneMediaSlotsSnapshot(resolved);
  mediaSlotsCacheExpiresAt = now + MEDIA_SLOTS_CACHE_TTL_MS;
  return cloneMediaSlotsSnapshot(mediaSlotsCacheValue);
};

export const savePublicMediaSlots = async (
  slots: Record<string, string>
): Promise<PublicMediaSlotsSnapshot> => {
  const normalized = normalizeMediaSlotsForSave(slots);
  const saved = await prisma.setting.upsert({
    where: { key: PUBLIC_MEDIA_SLOTS_SETTING_KEY },
    create: { key: PUBLIC_MEDIA_SLOTS_SETTING_KEY, value: normalized },
    update: { value: normalized },
    select: { value: true },
  });

  const parsedSaved = normalizeMediaSlotsFromUnknown(saved.value ?? normalized, {
    warnInvalidValues: true,
  });
  mediaSlotsCacheValue = cloneMediaSlotsSnapshot(parsedSaved);
  mediaSlotsCacheExpiresAt = Date.now() + MEDIA_SLOTS_CACHE_TTL_MS;
  return cloneMediaSlotsSnapshot(mediaSlotsCacheValue);
};

export const getPublicMediaSlotCatalog = (): PublicMediaSlotCatalogItem[] => {
  return PUBLIC_MEDIA_SLOT_CATALOG.map((slot) => ({ ...slot }));
};

export const isPublicMediaSlotId = (value: string): value is PublicMediaSlotId => {
  return publicMediaSlotIdSchema.safeParse(value).success;
};

export const invalidatePublicMediaSlotsCache = (): void => {
  mediaSlotsCacheValue = null;
  mediaSlotsCacheExpiresAt = 0;
};

