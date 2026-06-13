import type { ReactElement } from "react";
import { Link } from "react-router-dom";
import { useMediaSlot } from "../media.runtime";
import { usePageText } from "../pageTexts.runtime";
import { RichText } from "../../../components/ui/RichText";

export const HomeHeroSection = (): ReactElement => {
  const heroBackgroundUrl = useMediaSlot("home_hero_bg_01");

  const badge        = usePageText("home.hero.badge");
  const title        = usePageText("home.hero.title");
  const subtitle     = usePageText("home.hero.subtitle");
  const ctaPrimary   = usePageText("home.hero.cta_primary");
  const ctaSecondary = usePageText("home.hero.cta_secondary");

  return (
    <>
    {/* Header */}
    <header className="relative w-full h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-forest/40 via-forest/20 to-forest/60 z-10"></div>
            <div
              className="w-full h-full bg-cover bg-center bg-no-repeat transition-transform duration-[20s] hover:scale-105"
              data-alt="Luxurious salon interior with soft lighting, marble floors, and green plants"
              style={{ backgroundImage: `url(${heroBackgroundUrl})` }}
            >
            </div>
            <div className="absolute inset-0 bg-black/50"></div>
        </div>
        <div className="relative z-20 container mx-auto px-6 text-center flex flex-col items-center gap-8 pt-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm">
                <span className="material-symbols-outlined text-primary text-sm">star</span>
                <span className="text-white text-xs font-bold tracking-widest uppercase"><RichText value={badge} /></span>
            </div>

            <h1 className="text-white text-4xl sm:text-5xl md:text-7xl lg:text-8xl
                        display-hero font-playfair leading-tight break-words max-w-[92vw] lg:max-w-5xl drop-shadow-lg">
              <RichText value={title} />
            </h1>
            <p className="text-white/90 text-lg md:text-xl font-light tracking-wide max-w-2xl leading-relaxed drop-shadow-lg">
                <RichText value={subtitle} />
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <button className="h-14 px-8 items-center justify-center rounded-lg bg-primary text-forest text-sm font-bold uppercase tracking-widest hover:bg-white transition-colors duration-300 shadow-[0_0_20px_rgba(17,212,82,0.4)]" data-open-concierge type="button">
                    <RichText value={ctaPrimary} />
                </button>
                <Link className="h-14 px-8 inline-flex items-center justify-center rounded-lg border border-white/40 bg-transparent text-white text-sm font-bold uppercase tracking-widest hover:bg-white/10 transition-colors backdrop-blur-sm" to="/franquias">
                  <RichText value={ctaSecondary} />
                </Link>
            </div>
        </div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 animate-bounce">
            <span className="material-symbols-outlined text-white text-3xl">keyboard_arrow_down</span>
        </div>
    </header>
    </>
  );
};
