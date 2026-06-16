import type { ReactElement } from "react";
import { usePageText } from "../pageTexts.runtime";
import { RichText } from "../../../components/ui/RichText";

export const FranquiasFluxoCaixaSection = (): ReactElement => {
  const title = usePageText("franquias.fluxo_caixa.title");
  const f1t   = usePageText("franquias.fluxo_caixa.feature_1_title");
  const f1d   = usePageText("franquias.fluxo_caixa.feature_1_desc");
  const f2t   = usePageText("franquias.fluxo_caixa.feature_2_title");
  const f2d   = usePageText("franquias.fluxo_caixa.feature_2_desc");
  const f3t   = usePageText("franquias.fluxo_caixa.feature_3_title");
  const f3d   = usePageText("franquias.fluxo_caixa.feature_3_desc");

  const features = [
    { title: f1t, desc: f1d },
    { title: f2t, desc: f2d },
    { title: f3t, desc: f3d },
  ];

  return (
    <section className="w-full bg-forest text-white" id="fluxo-caixa">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px]">

        {/* LEFT — Main content */}
        <div className="px-10 py-20 lg:px-16 lg:py-24">
          <h2 className="display-hero text-4xl md:text-5xl leading-tight mb-14">
            <RichText value={title} />
          </h2>

          <div className="space-y-0">
            {features.map((f, i) => (
              <div key={i}>
                <div className="py-8">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-3">
                    <RichText value={f.title} />
                  </h3>
                  <p className="text-white/75 text-sm leading-relaxed max-w-xl">
                    <RichText value={f.desc} />
                  </p>
                </div>
                {i < features.length - 1 && (
                  <div className="border-t border-white/15" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Decorative teal stripe */}
        <div className="hidden lg:flex bg-primary flex-col justify-between p-12">
          <span className="text-white/20 text-6xl select-none">✦</span>
          <span className="text-white/10 text-4xl select-none self-end">✦</span>
          <span className="text-white/25 text-5xl select-none">✦</span>
        </div>

      </div>
    </section>
  );
};
