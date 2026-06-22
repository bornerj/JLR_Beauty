import type { ReactElement } from "react";
import { useBranding } from "../branding.runtime";
import { useMediaSlot } from "../media.runtime";
import { usePageText } from "../pageTexts.runtime";
import { RichText } from "../../../components/ui/RichText";

export const HomeAboutSection = ({ alt }: { alt?: boolean } = {}): ReactElement => {
  const branding = useBranding();
  const aboutImage01 = useMediaSlot("home_about_img_01");
  const aboutImage02 = useMediaSlot("home_about_img_02");
  const aboutImage03 = useMediaSlot("home_about_img_03");
  const aboutImage04 = useMediaSlot("home_about_img_04");
  const aboutImage05 = useMediaSlot("home_about_img_05");
  const aboutImage06 = useMediaSlot("home_about_img_06");

  const label      = usePageText("home.about.label");
  const title      = usePageText("home.about.title");
  const para1      = usePageText("home.about.paragraph_1");
  const para2      = usePageText("home.about.paragraph_2");
  const stat1Value = usePageText("home.about.stat_1_value");
  const stat1Label = usePageText("home.about.stat_1_label");
  const stat2Value = usePageText("home.about.stat_2_value");
  const stat2Label = usePageText("home.about.stat_2_label");
  const ctaButton  = usePageText("home.about.cta_button");

  const ctx = { fullName: branding.fullName };

  return (
    <>
    {/* Sobre */}
    <section className={`py-16 px-6 ${alt ? 'bg-background-light' : 'bg-white'}`} id="about">
        <div className="max-w-[1200px] mx-auto flex flex-col gap-10">

            {/* Galeria — topo, largura total */}
            <div style={{ display: 'grid', gap: '0.75rem' }}>
                <div className="overflow-hidden rounded-2xl shadow-lg border border-forest/10" style={{ height: '26rem' }}>
                    <img
                        className="w-full h-full object-cover"
                        src={aboutImage01}
                        alt={`${branding.fullName} - destaque`}
                    />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '0.75rem' }}>
                    <div className="overflow-hidden rounded-xl shadow-md border border-forest/10" style={{ aspectRatio: '1/1' }}>
                        <img className="w-full h-full object-cover" src={aboutImage02} alt={`${branding.fullName} 2`} />
                    </div>
                    <div className="overflow-hidden rounded-xl shadow-md border border-forest/10" style={{ aspectRatio: '1/1' }}>
                        <img className="w-full h-full object-cover" src={aboutImage03} alt={`${branding.fullName} 3`} />
                    </div>
                    <div className="overflow-hidden rounded-xl shadow-md border border-forest/10" style={{ aspectRatio: '1/1' }}>
                        <img className="w-full h-full object-cover" src={aboutImage04} alt={`${branding.fullName} 4`} />
                    </div>
                    <div className="overflow-hidden rounded-xl shadow-md border border-forest/10" style={{ aspectRatio: '1/1' }}>
                        <img className="w-full h-full object-cover" src={aboutImage05} alt={`${branding.fullName} 5`} />
                    </div>
                    <div className="overflow-hidden rounded-xl shadow-md border border-forest/10" style={{ aspectRatio: '1/1' }}>
                        <img className="w-full h-full object-cover" src={aboutImage06} alt={`${branding.fullName} 6`} />
                    </div>
                </div>
            </div>

            {/* Texto — abaixo, dividido em 2 colunas para aproveitar a largura */}
            <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
                {/* Coluna esquerda: label + título + CTA */}
                <div className="flex flex-col justify-center">
                    <div className="mb-4 flex items-center gap-2">
                        <div className="h-px w-12 bg-gold"></div>
                        <span className="text-sm font-bold uppercase tracking-widest text-gold"><RichText value={label} /></span>
                    </div>
                    <h3 className="mb-8 text-4xl md:text-5xl display-hero text-shadow-strong text-primary dark:text-white">
                        <RichText value={title} />
                    </h3>
                    <button className="flex w-fit items-center gap-2 rounded-lg border border-forest/20 bg-forest/5 px-4 py-2 text-sm font-bold uppercase tracking-wider text-forest transition-colors hover:bg-primary hover:text-white">
                        <a href="#spotlightprod"><RichText value={ctaButton} /></a>
                        <span className="material-symbols-outlined text-sm">arrow_outward</span>
                    </button>
                </div>
                {/* Coluna direita: parágrafos + stats */}
                <div className="flex flex-col gap-6">
                    <div className="space-y-4 text-lg font-light leading-relaxed text-forest/80">
                        <p><RichText value={para1} context={ctx} /></p>
                        <p><RichText value={para2} context={ctx} /></p>
                    </div>
                    <div className="grid grid-cols-2 gap-6 pt-4 border-t border-forest/10">
                        <div className="flex flex-col gap-2 border-l border-forest/10 pl-4">
                            <span className="text-3xl display-number text-shadow-strong text-gold"><RichText value={stat1Value} /></span>
                            <span className="text-sm font-medium uppercase tracking-wider text-forest/60"><RichText value={stat1Label} /></span>
                        </div>
                        <div className="flex flex-col gap-2 border-l border-forest/10 pl-4">
                            <span className="text-3xl display-number text-shadow-strong text-gold"><RichText value={stat2Value} /></span>
                            <span className="text-sm font-medium uppercase tracking-wider text-forest/60"><RichText value={stat2Label} /></span>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </section>
    {/* Produtos */}
    </>
  );
};
