export type PublicBranding = {
  fullName: string;
  shortName: string;
  logoUrl: string;
  // PLAN-0034 (Fase 5) — não é editável pelo form de Branding (é config de env var no
  // backend, `CONCIERGE_SUMMARY_PHONE`), só anexado na resposta pública. Antes disso,
  // 2 arquivos hardcodavam esse número — e discordavam entre si.
  whatsappPhone: string;
};

export const DEFAULT_BRANDING: PublicBranding = {
  fullName: "JLR Beauty",
  shortName: "JLR",
  logoUrl: "/images/JLRLOGO.webp",
  whatsappPhone: "5511978935812",
};

export const cloneBranding = (value: PublicBranding): PublicBranding => {
  return {
    fullName: value.fullName,
    shortName: value.shortName,
    logoUrl: value.logoUrl,
    whatsappPhone: value.whatsappPhone,
  };
};

