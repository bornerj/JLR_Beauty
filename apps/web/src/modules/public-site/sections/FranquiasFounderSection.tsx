import type { ReactElement } from "react";
import { useMediaSlot } from "../media.runtime";
import { usePageText } from "../pageTexts.runtime";
import { RichText } from "../../../components/ui/RichText";

export const FranquiasFounderSection = (): ReactElement => {
  const founderImage = useMediaSlot("franquias_founder_main_img_01");

  const title      = usePageText("franquias.founder.title");
  const quote      = usePageText("franquias.founder.quote");
  const intro      = usePageText("franquias.founder.intro");
  const paragraph1 = usePageText("franquias.founder.paragraph_1");
  const paragraph2 = usePageText("franquias.founder.paragraph_2");
  const paragraph3 = usePageText("franquias.founder.paragraph_3");
  const paragraph4 = usePageText("franquias.founder.paragraph_4");
  const blockquote = usePageText("franquias.founder.blockquote");
  const tagline1   = usePageText("franquias.founder.tagline_1");
  const tagline2   = usePageText("franquias.founder.tagline_2");

  return (
    <section className="w-full" id="founder">
      <div className="grid grid-cols-1 lg:grid-cols-2">

        {/* Left — teal background + founder photo */}
        <div className="relative bg-primary min-h-[480px] lg:min-h-0 overflow-hidden order-2 lg:order-1">
          <img
            src={founderImage}
            alt="Josi Oliveira — Fundadora JLR Beauty House"
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
          <span className="absolute bottom-10 left-5 text-white/30 text-5xl select-none leading-none pointer-events-none">✦</span>
          <span className="absolute bottom-4 left-12 text-white/20 text-3xl select-none leading-none pointer-events-none">✦</span>
        </div>

        {/* Right — text content */}
        <div className="bg-white px-10 py-16 lg:px-14 lg:py-20 flex flex-col justify-center order-1 lg:order-2">

          {/* Title row + quote */}
          <div className="flex flex-col gap-3 mb-8 lg:flex-row lg:items-start lg:gap-10">
            <h2 className="text-5xl lg:text-6xl display-hero text-forest leading-tight shrink-0">
              <RichText value={title} />
            </h2>
            <p className="text-primary italic font-light text-lg leading-relaxed lg:pt-2">
              <RichText value={quote} />
            </p>
          </div>

          {/* Intro bold */}
          <p className="text-forest text-sm leading-relaxed font-semibold mb-5">
            <RichText value={intro} />
          </p>

          {/* Parágrafo 1 — itálico narrativo */}
          <p className="text-forest/70 text-sm leading-relaxed italic mb-5">
            <RichText value={paragraph1} />
          </p>

          {/* Parágrafos 2–4 */}
          <p className="text-forest/80 text-sm leading-relaxed mb-4">
            <RichText value={paragraph2} />
          </p>
          <p className="text-forest/80 text-sm leading-relaxed mb-4">
            <RichText value={paragraph3} />
          </p>
          <p className="text-forest/80 text-sm leading-relaxed mb-6">
            <RichText value={paragraph4} />
          </p>

          {/* Blockquote */}
          <blockquote className="border-l-2 border-primary pl-4 italic text-forest/70 text-sm leading-relaxed mb-8">
            <RichText value={blockquote} />
          </blockquote>

          {/* Footer taglines */}
          <div className="mt-auto pt-6 border-t border-forest/10 flex justify-end">
            <div className="text-right">
              <p className="text-sm font-medium text-forest/60"><RichText value={tagline1} /></p>
              <p className="text-sm font-medium text-forest/60"><RichText value={tagline2} /></p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
