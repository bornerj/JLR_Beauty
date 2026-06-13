import type { ReactElement } from "react";
import { useMediaSlot } from "../media.runtime";
import { usePageText } from "../pageTexts.runtime";
import { RichText } from "../../../components/ui/RichText";

export const FranquiasVisionSection = (): ReactElement => {
  const visionImage = useMediaSlot("franquias_vision_img_01");

  const label      = usePageText("franquias.vision.label");
  const title      = usePageText("franquias.vision.title");
  const quote      = usePageText("franquias.vision.quote");
  const para1      = usePageText("franquias.vision.paragraph_1");
  const para2      = usePageText("franquias.vision.paragraph_2");
  const stat1Value = usePageText("franquias.vision.stat_1_value");
  const stat1Label = usePageText("franquias.vision.stat_1_label");
  const stat2Value = usePageText("franquias.vision.stat_2_value");
  const stat2Label = usePageText("franquias.vision.stat_2_label");
  const stat3Value = usePageText("franquias.vision.stat_3_value");
  const stat3Label = usePageText("franquias.vision.stat_3_label");

  return (
    <>
    {/* Editorial / Vision Section */}
    <div className="relative bg-cream-dark py-24 dark:bg-background-dark" id="vision">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-10">
            <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
                <div className="order-2 lg:order-1">
                    <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                        <div
                          className="aspect-[4/5] w-full bg-cover bg-center transition-transform duration-700 hover:scale-105"
                          data-alt="Close de produtos de beleza sobre mesa de mármore com detalhes dourados"
                          style={{ backgroundImage: `url(${visionImage})` }}
                        >
                        </div>
                        <div className="absolute -bottom-10 -right-10 z-10 hidden h-64 w-64 rounded-full border-[1px] border-gold/30 bg-forest p-8 lg:flex items-center justify-center">
                            <p className="text-center display-quote text-xl text-gold"><RichText value={quote} /></p>
                        </div>
                    </div>
                </div>
                <div className="order-1 flex flex-col justify-center lg:order-2">
                    <div className="mb-4 flex items-center gap-2">
                        <div className="h-px w-12 bg-gold"></div>
                        <span className="text-sm font-bold uppercase tracking-widest text-gold"><RichText value={label} /></span>
                    </div>
                    <h2 className="mb-8 text-4xl display-hero text-shadow-strong leading-tight text-forest dark:text-white md:text-5xl">
                        <RichText value={title} />
                    </h2>
                    <div className="space-y-6 text-lg font-light leading-relaxed text-forest/80 dark:text-white/80">
                        <p>
                            <span className="float-left mr-3 text-6xl display-title text-shadow-strong leading-[0.8] text-primary">J</span><RichText value={para1} />
                        </p>
                        <p>
                            <RichText value={para2} />
                        </p>
                    </div>
                    <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
                        <div className="flex flex-col gap-2 border-l border-forest/10 pl-4 dark:border-white/10">
                            <span className="text-3xl display-number text-shadow-strong text-gold"><RichText value={stat1Value} /></span>
                            <span className="text-sm font-medium uppercase tracking-wider text-forest/60 dark:text-white/60"><RichText value={stat1Label} /></span>
                        </div>
                        <div className="flex flex-col gap-2 border-l border-forest/10 pl-4 dark:border-white/10">
                            <span className="text-3xl display-number text-shadow-strong text-gold"><RichText value={stat2Value} /></span>
                            <span className="text-sm font-medium uppercase tracking-wider text-forest/60 dark:text-white/60"><RichText value={stat2Label} /></span>
                        </div>
                        <div className="flex flex-col gap-2 border-l border-forest/10 pl-4 dark:border-white/10">
                            <span className="text-3xl display-number text-shadow-strong text-gold"><RichText value={stat3Value} /></span>
                            <span className="text-sm font-medium uppercase tracking-wider text-forest/60 dark:text-white/60"><RichText value={stat3Label} /></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    </>
  );
};
