import type { ReactElement } from "react";
import { useMediaSlot } from "../media.runtime";
import { usePageText } from "../pageTexts.runtime";
import { RichText } from "../../../components/ui/RichText";

export const FranquiasFluxoCaixaSection = (): ReactElement => {
  const img01 = useMediaSlot("franquias_fluxo_caixa_feature_img_01");
  const img02 = useMediaSlot("franquias_fluxo_caixa_feature_img_02");
  const img03 = useMediaSlot("franquias_fluxo_caixa_feature_img_03");

  const title = usePageText("franquias.fluxo_caixa.title");
  const f1t   = usePageText("franquias.fluxo_caixa.feature_1_title");
  const f1d   = usePageText("franquias.fluxo_caixa.feature_1_desc");
  const f2t   = usePageText("franquias.fluxo_caixa.feature_2_title");
  const f2d   = usePageText("franquias.fluxo_caixa.feature_2_desc");
  const f3t   = usePageText("franquias.fluxo_caixa.feature_3_title");
  const f3d   = usePageText("franquias.fluxo_caixa.feature_3_desc");

  const features = [
    { img: img01, title: f1t, desc: f1d },
    { img: img02, title: f2t, desc: f2d },
    { img: img03, title: f3t, desc: f3d },
  ];

  return (
    <section className="w-full bg-forest text-white py-20" id="fluxo-caixa">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-10">

        <h2 className="display-hero text-4xl md:text-5xl leading-tight text-center mb-16">
          <RichText value={title} />
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <div
              key={i}
              className="flex flex-col rounded-xl overflow-hidden border border-gold/50"
            >
              <div className="h-[200px] overflow-hidden shrink-0">
                <img
                  src={f.img}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col gap-3 px-6 py-7 flex-1 border-t border-gold/50">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gold leading-snug">
                  <RichText value={f.title} />
                </h3>
                <p className="text-white/70 text-sm leading-relaxed">
                  <RichText value={f.desc} />
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
