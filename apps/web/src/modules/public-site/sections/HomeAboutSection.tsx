import type { ReactElement } from "react";
import { useBranding } from "../branding.runtime";
import { useMediaSlot } from "../media.runtime";
import { usePageText } from "../pageTexts.runtime";
import { RichText } from "../../../components/ui/RichText";

export const HomeAboutSection = (): ReactElement => {
  const branding = useBranding();
  const aboutImage01 = useMediaSlot("home_about_img_01");
  const aboutImage02 = useMediaSlot("home_about_img_02");
  const aboutImage03 = useMediaSlot("home_about_img_03");
  const aboutImage04 = useMediaSlot("home_about_img_04");
  const aboutImage05 = useMediaSlot("home_about_img_05");
  const aboutImage06 = useMediaSlot("home_about_img_06");
  const aboutImage07 = useMediaSlot("home_about_img_07");
  const aboutImage08 = useMediaSlot("home_about_img_08");

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
    <section className="py-16 px-6 bg-white" id="about">
        <div className="max-w-[1200px] mx-auto">
            <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
                <div className="order-1">
                    <div className="relative flex justify-center lg:justify-start">
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 max-w-[520px]">
                            <div className="space-y-4">
                                <img className="h-32 w-36 rounded-2xl object-cover shadow-lg shadow-forest/10 border border-forest/10" src={aboutImage01} alt={`${branding.fullName} - equipe`} />
                                <img className="h-40 w-36 rounded-2xl object-cover shadow-lg shadow-forest/10 border border-forest/10" src={aboutImage02} alt={`Salão ${branding.fullName}`} />
                                <img className="h-32 w-36 rounded-2xl object-cover shadow-lg shadow-forest/10 border border-forest/10" src={aboutImage03} alt={`Ambiente ${branding.fullName}`} />
                            </div>
                            <div className="space-y-4 pt-6">
                                <img className="h-40 w-36 rounded-2xl object-cover shadow-lg shadow-forest/10 border border-forest/10" src={aboutImage04} alt="Salao premium" />
                                <img className="h-32 w-36 rounded-2xl object-cover shadow-lg shadow-forest/10 border border-forest/10" src={aboutImage05} alt="Ambiente sofisticado" />
                                <img className="h-32 w-36 rounded-2xl object-cover shadow-lg shadow-forest/10 border border-forest/10" src={aboutImage06} alt="Detalhes do salao" />
                            </div>
                            <div className="hidden sm:flex flex-col gap-4 pt-12">
                                <img className="h-32 w-36 rounded-2xl object-cover shadow-lg shadow-forest/10 border border-forest/10" src={aboutImage07} alt={`Sobre nós ${branding.fullName}`} />
                                <img className="h-40 w-36 rounded-2xl object-cover shadow-lg shadow-forest/10 border border-forest/10" src={aboutImage08} alt={`${branding.fullName} - ambiente`} />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="order-2 flex flex-col justify-center">
                    <div className="mb-4 flex items-center gap-2">
                        <div className="h-px w-12 bg-gold"></div>
                        <span className="text-sm font-bold uppercase tracking-widest text-gold"><RichText value={label} /></span>
                    </div>
                    <h3 className="mb-6 text-4xl md:text-5xl display-hero text-shadow-strong text-primary dark:text-white">
                      <RichText value={title} />
                    </h3>
                    <div className="space-y-6 text-lg font-light leading-relaxed text-forest/80">
                        <p><RichText value={para1} context={ctx} /></p>
                        <p><RichText value={para2} context={ctx} /></p>
                    </div>
                    <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div className="flex flex-col gap-2 border-l border-forest/10 pl-4">
                            <span className="text-3xl display-number text-shadow-strong text-gold"><RichText value={stat1Value} /></span>
                            <span className="text-sm font-medium uppercase tracking-wider text-forest/60"><RichText value={stat1Label} /></span>
                        </div>
                        <div className="flex flex-col gap-2 border-l border-forest/10 pl-4">
                            <span className="text-3xl display-number text-shadow-strong text-gold"><RichText value={stat2Value} /></span>
                            <span className="text-sm font-medium uppercase tracking-wider text-forest/60"><RichText value={stat2Label} /></span>
                        </div>
                    </div>
                    <button className="mt-10 flex w-fit items-center gap-2 rounded-lg border border-forest/20 bg-forest/5 px-4 py-2 text-sm font-bold uppercase tracking-wider text-forest transition-colors hover:bg-primary hover:text-white">
                        <a href="#spotlightprod"><RichText value={ctaButton} /></a>
                        <span className="material-symbols-outlined text-sm">arrow_outward</span>
                    </button>
                </div>
            </div>
        </div>
    </section>
    {/* Produtos */}
    </>
  );
};
