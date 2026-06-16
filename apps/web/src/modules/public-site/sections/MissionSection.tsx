import type { ReactElement } from "react";
import { useMediaSlot } from "../media.runtime";
import { usePageText } from "../pageTexts.runtime";
import { RichText } from "../../../components/ui/RichText";

export const MissionSection = (): ReactElement => {
  const centerImage = useMediaSlot("mission_center_img_01");

  const missaoTitle  = usePageText("global.mission.missao_title");
  const missaoText   = usePageText("global.mission.missao_text");
  const visaoTitle   = usePageText("global.mission.visao_title");
  const visaoText    = usePageText("global.mission.visao_text");
  const valoresTitle = usePageText("global.mission.valores_title");
  const valoresItem1 = usePageText("global.mission.valores_item_1");
  const valoresItem2 = usePageText("global.mission.valores_item_2");
  const valoresItem3 = usePageText("global.mission.valores_item_3");
  const valoresItem4 = usePageText("global.mission.valores_item_4");
  const valoresItem5 = usePageText("global.mission.valores_item_5");

  const valoresItems = [valoresItem1, valoresItem2, valoresItem3, valoresItem4, valoresItem5];

  return (
    <section className="w-full">
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-3">
        {/* Left column — teal */}
        <div className="bg-primary px-10 py-16 lg:px-14 lg:py-20 flex flex-col justify-center gap-12">
          {/* MISSÃO */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xl font-bold uppercase tracking-[0.25em] text-white display-hero">
                <RichText value={missaoTitle} />
              </span>
              <div className="w-9 h-9 rounded-full border border-white/40 flex items-center justify-center shrink-0 ml-4">
                <span className="material-symbols-outlined text-white" style={{ fontSize: "16px" }}>gps_fixed</span>
              </div>
            </div>
            <div className="h-px bg-white/20 mb-4" />
            <p className="text-white/80 text-sm leading-relaxed">
              <RichText value={missaoText} />
            </p>
          </div>

          {/* VISÃO */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xl font-bold uppercase tracking-[0.25em] text-white display-hero">
                <RichText value={visaoTitle} />
              </span>
              <div className="w-9 h-9 rounded-full border border-white/40 flex items-center justify-center shrink-0 ml-4">
                <span className="material-symbols-outlined text-white" style={{ fontSize: "16px" }}>insights</span>
              </div>
            </div>
            <div className="h-px bg-white/20 mb-4" />
            <p className="text-white/80 text-sm leading-relaxed">
              <RichText value={visaoText} />
            </p>
          </div>
        </div>

        {/* Center column — image */}
        <div className="relative overflow-hidden min-h-[420px] md:min-h-0">
          <img
            src={centerImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <span className="absolute bottom-5 right-5 text-white/70 text-3xl select-none leading-none pointer-events-none">✦</span>
        </div>

        {/* Right column — white */}
        <div className="bg-white px-10 py-16 lg:px-14 lg:py-20 flex flex-col justify-center">
          <h3 className="text-2xl font-bold uppercase tracking-[0.25em] text-forest display-hero mb-8">
            <RichText value={valoresTitle} />
          </h3>
          <ul className="flex flex-col gap-4">
            {valoresItems.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-primary font-bold text-base leading-5 shrink-0 mt-0.5">•</span>
                <span className="text-forest/80 text-sm leading-relaxed">
                  <RichText value={item} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};
