export type PublicBranding = {
  fullName: string;
  shortName: string;
  logoUrl: string;
};

export const DEFAULT_BRANDING: PublicBranding = {
  fullName: "JLR Beauty",
  shortName: "JLR",
  logoUrl: "/images/JLRLOGO.webp",
};

export const cloneBranding = (value: PublicBranding): PublicBranding => {
  return {
    fullName: value.fullName,
    shortName: value.shortName,
    logoUrl: value.logoUrl,
  };
};

