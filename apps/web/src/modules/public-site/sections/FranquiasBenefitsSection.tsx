import type { ReactElement } from "react";
import { useMediaSlot } from "../media.runtime";
import { usePageText } from "../pageTexts.runtime";
import { RichText } from "../../../components/ui/RichText";

export const FranquiasBenefitsSection = (): ReactElement => {
  const cellImg01 = useMediaSlot("franquias_benefits_cell_img_01");
  const cellImg02 = useMediaSlot("franquias_benefits_cell_img_02");
  const cellImg03 = useMediaSlot("franquias_benefits_cell_img_03");
  const cellImg04 = useMediaSlot("franquias_benefits_cell_img_04");
  const cellImg05 = useMediaSlot("franquias_benefits_cell_img_05");
  const cellImg06 = useMediaSlot("franquias_benefits_cell_img_06");
  const cellImg07 = useMediaSlot("franquias_benefits_cell_img_07");
  const cellImg08 = useMediaSlot("franquias_benefits_cell_img_08");
  const cellImg09 = useMediaSlot("franquias_benefits_cell_img_09");

  const title    = usePageText("franquias.benefits.title");
  const cell1Txt = usePageText("franquias.benefits.cell_1_text");
  const cell2Txt = usePageText("franquias.benefits.cell_2_text");
  const cell3Txt = usePageText("franquias.benefits.cell_3_text");
  const cell4Txt = usePageText("franquias.benefits.cell_4_text");
  const cell5Txt = usePageText("franquias.benefits.cell_5_text");
  const cell6Txt = usePageText("franquias.benefits.cell_6_text");
  const cell7Txt = usePageText("franquias.benefits.cell_7_text");
  const cell8Txt = usePageText("franquias.benefits.cell_8_text");
  const cell9Txt = usePageText("franquias.benefits.cell_9_text");

  const cells = [
    { img: cellImg01, text: cell1Txt },
    { img: cellImg02, text: cell2Txt },
    { img: cellImg03, text: cell3Txt },
    { img: cellImg04, text: cell4Txt },
    { img: cellImg05, text: cell5Txt },
    { img: cellImg06, text: cell6Txt },
    { img: cellImg07, text: cell7Txt },
    { img: cellImg08, text: cell8Txt },
    { img: cellImg09, text: cell9Txt },
  ];

  return (
    <section className="w-full bg-white py-20 dark:bg-background-dark" id="benefits">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-10">

        {/* Title with decorative stars */}
        <div className="mb-16 flex items-center justify-center gap-4">
          <span className="text-primary text-3xl select-none leading-none">✦</span>
          <h2 className="display-hero text-4xl md:text-5xl text-forest dark:text-white text-center leading-tight">
            <RichText value={title} />
          </h2>
          <span className="text-primary text-3xl select-none leading-none">✦</span>
        </div>

        {/* 3×3 grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-14">
          {cells.map((cell, i) => (
            <div key={i} className="flex flex-col items-center text-center gap-4">
              <div className="w-20 h-20 flex items-center justify-center shrink-0">
                <img
                  src={cell.img}
                  alt=""
                  className="w-16 h-16 object-contain"
                />
              </div>
              <p className="text-sm font-semibold text-forest/80 dark:text-white/80 leading-snug max-w-[200px]">
                <RichText value={cell.text} />
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
