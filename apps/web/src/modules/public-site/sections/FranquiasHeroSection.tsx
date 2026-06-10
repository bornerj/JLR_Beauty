import type { ReactElement } from "react";
import { useBranding } from "../branding.runtime";
import { useMediaSlot } from "../media.runtime";

export const FranquiasHeroSection = (): ReactElement => {
  const branding = useBranding();
  const heroBackgroundMap = useMediaSlot("franquias_hero_bg_map_01");
  const heroGalleryImage01 = useMediaSlot("franquias_hero_gallery_img_01");
  const heroGalleryImage02 = useMediaSlot("franquias_hero_gallery_img_02");
  const heroGalleryImage03 = useMediaSlot("franquias_hero_gallery_img_03");
  const heroGalleryImage04 = useMediaSlot("franquias_hero_gallery_img_04");
  const heroGalleryImage05 = useMediaSlot("franquias_hero_gallery_img_05");
  const heroGalleryImage06 = useMediaSlot("franquias_hero_gallery_img_06");
  const heroGalleryImage07 = useMediaSlot("franquias_hero_gallery_img_07");
  const heroGalleryImage08 = useMediaSlot("franquias_hero_gallery_img_08");

  return (
    <>
    {/* Hero Section */}
    <section className="relative pt-28 pb-16 bg-cream dark:bg-background-dark overflow-hidden">
        <div
          className="absolute inset-0 bg-center bg-no-repeat bg-contain opacity-20 pointer-events-none"
          style={{ backgroundImage: `url(${heroBackgroundMap})` }}
        ></div>
        <div className="mx-auto max-w-[1200px] px-6 lg:px-10 grid items-center gap-14 lg:grid-cols-2 relative z-10">
            <div className="flex flex-col items-start">
                <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-forest/20 bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-forest shadow-sm dark:border-white/20 dark:bg-white/10 dark:text-white">
                    Oportunidades de Franquia
                </span>
                <h1 className="text-4xl md:text-5xl lg:text-6xl display-hero leading-tight text-forest dark:text-white">
                    {`Leve a ${branding.fullName} para sua cidade ou bairro`}
                </h1>
                <p className="mt-5 text-base md:text-lg font-light leading-relaxed text-forest/80 dark:text-white/80 max-w-xl">
                    Junte-se a rede premier de franquias de beleza de luxo e leve elegância, sofisticação e cuidado de
                    classe mundial para sua comunidade.
                </p>
                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                    <a className="flex h-12 min-w-[180px] items-center justify-center rounded-lg bg-primary px-6 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 hover:shadow-xl" href="#models">
                        Conhecer Modelos
                    </a>
                    <a className="flex h-12 min-w-[180px] items-center justify-center rounded-lg border border-forest/20 bg-white/70 px-6 text-sm font-bold uppercase tracking-wider text-forest backdrop-blur-sm transition-all hover:bg-white/90 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20" href="#vision">
                        Nossa Visão
                    </a>
                </div>
            </div>
            <div className="relative flex justify-center lg:justify-end">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 max-w-[520px]">
                    <div className="space-y-4">
                        <img className="h-32 w-36 rounded-2xl object-cover shadow-lg shadow-forest/10 border border-white/70" src={heroGalleryImage01} alt={`${branding.fullName} master studio`} />
                        <img className="h-40 w-36 rounded-2xl object-cover shadow-lg shadow-forest/10 border border-white/70" src={heroGalleryImage02} alt={`Salão ${branding.fullName}`} />
                        <img className="h-32 w-36 rounded-2xl object-cover shadow-lg shadow-forest/10 border border-white/70" src={heroGalleryImage03} alt={`Ambiente ${branding.fullName}`} />
                    </div>
                    <div className="space-y-4 pt-6">
                        <img className="h-40 w-36 rounded-2xl object-cover shadow-lg shadow-forest/10 border border-white/70" src={heroGalleryImage04} alt="Espaco de estetica" />
                        <img className="h-32 w-36 rounded-2xl object-cover shadow-lg shadow-forest/10 border border-white/70" src={heroGalleryImage05} alt="Salao premium" />
                        <img className="h-32 w-36 rounded-2xl object-cover shadow-lg shadow-forest/10 border border-white/70" src={heroGalleryImage06} alt="Ambiente sofisticado" />
                    </div>
                    <div className="hidden sm:flex flex-col gap-4 pt-12">
                        <img className="h-32 w-36 rounded-2xl object-cover shadow-lg shadow-forest/10 border border-white/70" src={heroGalleryImage07} alt={`Esmalteria ${branding.fullName}`} />
                        <img className="h-40 w-36 rounded-2xl object-cover shadow-lg shadow-forest/10 border border-white/70" src={heroGalleryImage08} alt={`Detalhes de salão ${branding.fullName}`} />
                    </div>
                </div>
            </div>
        </div>
    </section>
    </>
  );
};
