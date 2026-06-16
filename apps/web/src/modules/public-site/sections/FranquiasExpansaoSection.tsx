import type { ReactElement } from "react";
import { useMediaSlot } from "../media.runtime";
import { usePageText } from "../pageTexts.runtime";
import { RichText } from "../../../components/ui/RichText";

export const FranquiasExpansaoSection = (): ReactElement => {
  const mapImg = useMediaSlot("franquias_expansao_map_img_01");

  const title  = usePageText("franquias.expansao.title");
  const para1  = usePageText("franquias.expansao.paragraph_1");
  const para2  = usePageText("franquias.expansao.paragraph_2");
  const quote1 = usePageText("franquias.expansao.quote_1");
  const quote2 = usePageText("franquias.expansao.quote_2");
  const quote3 = usePageText("franquias.expansao.quote_3");

  return (
    <section className="w-full bg-beige dark:bg-forest/20" id="expansao">
      <div className="grid grid-cols-1 lg:grid-cols-2">

        {/* LEFT — map image */}
        <div className="relative min-h-[360px] lg:min-h-[520px] overflow-hidden order-2 lg:order-1">
          <img
            src={mapImg}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-beige/30 dark:to-forest/30" />
        </div>

        {/* RIGHT — text */}
        <div className="px-10 py-20 lg:px-14 lg:py-24 flex flex-col justify-center order-1 lg:order-2 bg-white dark:bg-forest/10">
          <h2 className="display-hero text-4xl md:text-5xl text-forest dark:text-white leading-tight mb-8">
            <RichText value={title} />
          </h2>

          <p className="text-sm text-forest/80 dark:text-white/80 leading-relaxed mb-5">
            <RichText value={para1} />
          </p>
          <p className="text-sm text-forest/80 dark:text-white/80 leading-relaxed mb-10">
            <RichText value={para2} />
          </p>

          {/* Quote trio */}
          <div className="space-y-4 border-l-4 border-primary pl-6">
            {[quote1, quote2, quote3].map((q, i) => (
              <p key={i} className="text-primary font-semibold text-sm italic leading-relaxed">
                <RichText value={q} />
              </p>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
