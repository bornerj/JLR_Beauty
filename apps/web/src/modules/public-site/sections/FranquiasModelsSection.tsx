import type { ReactElement } from "react";
import { useMediaSlot } from "../media.runtime";
import { usePageText } from "../pageTexts.runtime";
import { RichText } from "../../../components/ui/RichText";

export const FranquiasModelsSection = ({ alt }: { alt?: boolean } = {}): ReactElement => {
  const modelCardImage01 = useMediaSlot("franquias_models_card_img_01");
  const modelCardImage02 = useMediaSlot("franquias_models_card_img_02");
  const modelCardImage03 = useMediaSlot("franquias_models_card_img_03");

  const label    = usePageText("franquias.models.label");
  const title    = usePageText("franquias.models.title");
  const subtitle = usePageText("franquias.models.subtitle");

  const c1Name       = usePageText("franquias.models.card_1_name");
  const c1Subtitle   = usePageText("franquias.models.card_1_subtitle");
  const c1Investment = usePageText("franquias.models.card_1_investment");
  const c1Feat1      = usePageText("franquias.models.card_1_feat_1");
  const c1Feat2      = usePageText("franquias.models.card_1_feat_2");
  const c1Feat3      = usePageText("franquias.models.card_1_feat_3");
  const c1Feat4      = usePageText("franquias.models.card_1_feat_4");

  const c2Name       = usePageText("franquias.models.card_2_name");
  const c2Subtitle   = usePageText("franquias.models.card_2_subtitle");
  const c2Investment = usePageText("franquias.models.card_2_investment");
  const c2Feat1      = usePageText("franquias.models.card_2_feat_1");
  const c2Feat2      = usePageText("franquias.models.card_2_feat_2");
  const c2Feat3      = usePageText("franquias.models.card_2_feat_3");
  const c2Feat4      = usePageText("franquias.models.card_2_feat_4");

  const c3Name       = usePageText("franquias.models.card_3_name");
  const c3Subtitle   = usePageText("franquias.models.card_3_subtitle");
  const c3Investment = usePageText("franquias.models.card_3_investment");
  const c3Feat1      = usePageText("franquias.models.card_3_feat_1");
  const c3Feat2      = usePageText("franquias.models.card_3_feat_2");
  const c3Feat3      = usePageText("franquias.models.card_3_feat_3");
  const c3Feat4      = usePageText("franquias.models.card_3_feat_4");

  return (
    <>
    {/* Franchise Models Section */}
    <div className={`${alt ? 'bg-background-light' : 'bg-white'} py-24 dark:bg-zinc-900`} id="models">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-10">
            <div className="mb-16 text-center">
                <span className="mb-2 block text-sm font-bold uppercase tracking-widest text-primary"><RichText value={label} /></span>
                <h2 className="display-hero text-shadow-strong text-4xl text-forest dark:text-white md:text-5xl"><RichText value={title} /></h2>
                <p className="mx-auto mt-4 max-w-2xl text-lg text-forest/70 dark:text-white/70 text-balance">
                    <RichText value={subtitle} />
                </p>
            </div>
            <div className="grid gap-8 lg:grid-cols-3">
                {/* Studio Model */}
                <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-lg transition-all hover:-translate-y-2 hover:shadow-xl dark:bg-background-dark dark:border dark:border-white/5">
                    <div className="relative h-64 overflow-hidden">
                        <div
                          className="h-full w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                          data-alt="Modern compact bright salon studio interior with mirrors"
                          style={{ backgroundImage: `url(${modelCardImage01})` }}
                        >
                        </div>

                    </div>
                    <div className="flex flex-1 flex-col p-8">
                        <h3 className="display-hero text-xl text-primary mb-1"><RichText value={c1Name} /></h3>
                        <p className="text-sm text-forest/60 mb-5"><RichText value={c1Subtitle} /></p>
                        <div className="mb-6">
                            <p className="text-sm text-forest/60 dark:text-white/60 mb-1">Investimento Inicial</p>
                            <p className="text-3xl display-number text-shadow-strong text-gold"><RichText value={c1Investment} /></p>
                        </div>
                        <ul className="mb-8 space-y-3 flex-1">
                            <li className="flex items-start gap-3 text-sm text-forest/80 dark:text-white/80">
                                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                                <span><RichText value={c1Feat1} /></span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-forest/80 dark:text-white/80">
                                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                                <span><RichText value={c1Feat2} /></span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-forest/80 dark:text-white/80">
                                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                                <span><RichText value={c1Feat3} /></span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-forest/80 dark:text-white/80">
                                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                                <span><RichText value={c1Feat4} /></span>
                            </li>
                        </ul>
                        <a href="#fran03" className="mt-auto w-full rounded-lg border border-forest/10 bg-forest/5 py-3 text-sm font-bold text-forest transition-colors hover:bg-primary hover:text-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-primary block text-center">Ver Detalhes</a>
                    </div>
                </div>
                {/* Standard Model */}
                <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-gold/50 transition-all hover:-translate-y-2 hover:shadow-xl dark:bg-background-dark">
                    <div className="absolute top-4 right-4 z-10 rounded-full bg-gold px-3 py-1 text-xs font-bold text-white uppercase tracking-wider">
                        Mais Popular</div>
                    <div className="relative h-64 overflow-hidden">
                        <div
                          className="h-full w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                          data-alt="Salao elegante e amplo com varias estacoes e iluminacao aconchegante"
                          style={{ backgroundImage: `url(${modelCardImage02})` }}
                        >
                        </div>

                    </div>
                    <div className="flex flex-1 flex-col p-8">
                        <h3 className="display-hero text-xl text-primary mb-1"><RichText value={c2Name} /></h3>
                        <p className="text-sm text-forest/60 mb-5"><RichText value={c2Subtitle} /></p>
                        <div className="mb-6">
                            <p className="text-sm text-forest/60 dark:text-white/60 mb-1">Investimento Inicial</p>
                            <p className="text-3xl display-number text-shadow-strong text-gold"><RichText value={c2Investment} /></p>
                        </div>
                        <ul className="mb-8 space-y-3 flex-1">
                            <li className="flex items-start gap-3 text-sm text-forest/80 dark:text-white/80">
                                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                                <span><RichText value={c2Feat1} /></span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-forest/80 dark:text-white/80">
                                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                                <span><RichText value={c2Feat2} /></span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-forest/80 dark:text-white/80">
                                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                                <span><RichText value={c2Feat3} /></span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-forest/80 dark:text-white/80">
                                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                                <span><RichText value={c2Feat4} /></span>
                            </li>
                        </ul>
                        <a href="#fran02" className="mt-auto w-full rounded-lg bg-forest py-3 text-sm font-bold text-white transition-colors hover:bg-primary dark:bg-primary dark:text-forest dark:hover:bg-white block text-center">
                            Selecionar <RichText value={c2Name} />
                        </a>
                    </div>
                </div>
                {/* Flagship Model */}
                <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-lg transition-all hover:-translate-y-2 hover:shadow-xl dark:bg-background-dark dark:border dark:border-white/5">
                    <div className="relative h-64 overflow-hidden">
                        <div
                          className="h-full w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                          data-alt="Large luxurious spa reception area with marble floors and high ceilings"
                          style={{ backgroundImage: `url(${modelCardImage03})` }}
                        >
                        </div>

                    </div>
                    <div className="flex flex-1 flex-col p-8">
                        <h3 className="display-hero text-xl text-primary mb-1"><RichText value={c3Name} /></h3>
                        <p className="text-sm text-forest/60 mb-5"><RichText value={c3Subtitle} /></p>
                        <div className="mb-6">
                            <p className="text-sm text-forest/60 dark:text-white/60 mb-1">Investimento Inicial</p>
                            <p className="text-3xl display-number text-shadow-strong text-gold"><RichText value={c3Investment} /></p>
                        </div>
                        <ul className="mb-8 space-y-3 flex-1">
                            <li className="flex items-start gap-3 text-sm text-forest/80 dark:text-white/80">
                                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                                <span><RichText value={c3Feat1} /></span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-forest/80 dark:text-white/80">
                                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                                <span><RichText value={c3Feat2} /></span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-forest/80 dark:text-white/80">
                                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                                <span><RichText value={c3Feat3} /></span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-forest/80 dark:text-white/80">
                                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                                <span><RichText value={c3Feat4} /></span>
                            </li>
                        </ul>
                        <a href="#fran01" className="mt-auto w-full rounded-lg border border-forest/10 bg-forest/5 py-3 text-sm font-bold text-forest transition-colors hover:bg-primary hover:text-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-primary block text-center">Ver Detalhes</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
    </>
  );
};
