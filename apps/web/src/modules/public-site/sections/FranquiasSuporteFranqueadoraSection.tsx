import type { ReactElement } from "react";
import { useMediaSlot } from "../media.runtime";
import { usePageText } from "../pageTexts.runtime";
import { RichText } from "../../../components/ui/RichText";

export const FranquiasSuporteFranqueadoraSection = (): ReactElement => {
  const suporteImg = useMediaSlot("franquias_suporte_img_01");

  const title      = usePageText("franquias.suporte.title");
  const g1Title    = usePageText("franquias.suporte.g1_title");
  const g1Item1    = usePageText("franquias.suporte.g1_item_1");
  const g1Item2    = usePageText("franquias.suporte.g1_item_2");
  const g1Item3    = usePageText("franquias.suporte.g1_item_3");
  const g2Title    = usePageText("franquias.suporte.g2_title");
  const g2Item1    = usePageText("franquias.suporte.g2_item_1");
  const g2Item2    = usePageText("franquias.suporte.g2_item_2");
  const g2Item3    = usePageText("franquias.suporte.g2_item_3");
  const g2Item4    = usePageText("franquias.suporte.g2_item_4");
  const g2Item5    = usePageText("franquias.suporte.g2_item_5");
  const g2Item6    = usePageText("franquias.suporte.g2_item_6");
  const g2Item7    = usePageText("franquias.suporte.g2_item_7");
  const g3Title    = usePageText("franquias.suporte.g3_title");
  const g3Item1    = usePageText("franquias.suporte.g3_item_1");
  const g3Item2    = usePageText("franquias.suporte.g3_item_2");
  const g3Item3    = usePageText("franquias.suporte.g3_item_3");
  const g3SubItems = usePageText("franquias.suporte.g3_subitems");

  const groups = [
    { title: g1Title, items: [g1Item1, g1Item2, g1Item3] },
    { title: g2Title, items: [g2Item1, g2Item2, g2Item3, g2Item4, g2Item5, g2Item6, g2Item7] },
    { title: g3Title, items: [g3Item1, g3Item2, g3Item3] },
  ];

  return (
    <section className="w-full bg-background-light dark:bg-background-dark" id="suporte-franqueadora">
      <div className="mx-auto max-w-[1200px] grid grid-cols-1 lg:grid-cols-2">

        {/* LEFT — groups */}
        <div className="px-10 py-20 lg:px-14 lg:py-24 flex flex-col justify-center">
          <h2 className="display-hero text-4xl md:text-5xl text-forest dark:text-white leading-tight mb-12">
            <RichText value={title} />
          </h2>

          <div className="space-y-10">
            {groups.map((g, gi) => (
              <div key={gi}>
                <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-4">
                  <RichText value={g.title} />
                </h3>
                <ul className="space-y-2">
                  {g.items.map((item, ii) => (
                    <li key={ii} className="flex items-start gap-3">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      <span className="text-sm text-forest/80 dark:text-white/80 leading-relaxed">
                        <RichText value={item} />
                      </span>
                    </li>
                  ))}
                  {/* g3 subitems */}
                  {gi === 2 && (
                    <li className="ml-4 mt-1">
                      <p className="text-xs text-forest/60 dark:text-white/60 leading-relaxed italic">
                        <RichText value={g3SubItems} />
                      </p>
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — woman photo */}
        <div className="relative min-h-[440px] lg:min-h-0 overflow-hidden">
          <img
            src={suporteImg}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
          <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-background-light/40 to-transparent dark:from-background-dark/40" />
        </div>

      </div>
    </section>
  );
};
