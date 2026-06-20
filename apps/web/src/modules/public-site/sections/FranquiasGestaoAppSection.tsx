import type { ReactElement } from "react";
import { useMediaSlot } from "../media.runtime";
import { usePageText } from "../pageTexts.runtime";
import { RichText } from "../../../components/ui/RichText";

export const FranquiasGestaoAppSection = (): ReactElement => {
  const appImg = useMediaSlot("franquias_gestao_app_img_01");

  const title = usePageText("franquias.gestao_app.title");
  const f1t   = usePageText("franquias.gestao_app.feature_1_title");
  const f1d   = usePageText("franquias.gestao_app.feature_1_desc");
  const f2t   = usePageText("franquias.gestao_app.feature_2_title");
  const f2d   = usePageText("franquias.gestao_app.feature_2_desc");
  const f3t   = usePageText("franquias.gestao_app.feature_3_title");
  const f3d   = usePageText("franquias.gestao_app.feature_3_desc");
  const f4t   = usePageText("franquias.gestao_app.feature_4_title");
  const f4d   = usePageText("franquias.gestao_app.feature_4_desc");

  const features = [
    { title: f1t, desc: f1d },
    { title: f2t, desc: f2d },
    { title: f3t, desc: f3d },
    { title: f4t, desc: f4d },
  ];

  return (
    <section className="w-full bg-background-light dark:bg-background-dark py-20" id="gestao-app">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">

          {/* LEFT — Title + features */}
          <div>
            <h2 className="display-hero text-4xl md:text-5xl text-forest dark:text-white leading-tight mb-10">
              <RichText value={title} />
            </h2>
            <div className="space-y-8">
              {features.map((f, i) => (
                <div key={i}>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-2">
                    <RichText value={f.title} />
                  </h3>
                  <p className="text-sm text-forest/75 dark:text-white/75 leading-relaxed">
                    <RichText value={f.desc} />
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — App mockup image */}
          <div className="relative">
            <img
              src={appImg}
              alt=""
              className="w-full h-auto object-contain rounded-xl"
            />
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-primary rounded-tl-3xl -z-10" />
          </div>

        </div>
      </div>
    </section>
  );
};
