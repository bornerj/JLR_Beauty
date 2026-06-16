import type { ReactElement } from "react";
import type { PageTextValue } from "../pageTexts";
import { RichText } from "../../../components/ui/RichText";

export interface ModelMetric {
  icon: string;
  label: PageTextValue;
  value: PageTextValue;
}

export interface FranquiasModelDetailProps {
  sectionId: string;
  label: PageTextValue;
  conceptBadge: PageTextValue;
  conceptDesc: PageTextValue;
  floorplanImg: string;
  invHeader: PageTextValue;
  invItems: PageTextValue[];
  feeLabel: PageTextValue;
  feeValue: PageTextValue;
  immediateLabel: PageTextValue;
  immediateValue: PageTextValue;
  extras: Array<{ label: PageTextValue; value: PageTextValue }>;
  totalLabel: PageTextValue;
  totalValue: PageTextValue;
  metrics: ModelMetric[];
}

export const FranquiasModelDetailSection = ({
  sectionId,
  label,
  conceptBadge,
  conceptDesc,
  floorplanImg,
  invHeader,
  invItems,
  feeLabel,
  feeValue,
  immediateLabel,
  immediateValue,
  extras,
  totalLabel,
  totalValue,
  metrics,
}: FranquiasModelDetailProps): ReactElement => {
  return (
    <section className="w-full bg-background-light dark:bg-background-dark py-16 border-t border-forest/10 dark:border-white/10" id={sectionId}>
      <div className="mx-auto max-w-[1200px] px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-12">

          {/* LEFT — Concept + Floor Plan */}
          <div className="flex flex-col gap-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">
                <RichText value={label} />
              </span>
              <h2 className="display-hero text-5xl lg:text-6xl text-primary leading-tight mb-4">
                <RichText value={conceptBadge} />
              </h2>
              <p className="text-sm text-forest/75 dark:text-white/75 leading-relaxed">
                <RichText value={conceptDesc} />
              </p>
            </div>
            <div className="relative overflow-hidden rounded-xl shadow-lg mt-auto">
              <img
                src={floorplanImg}
                alt=""
                className="w-full h-auto object-cover block"
              />
              <div className="absolute bottom-0 left-0 w-14 h-14 bg-primary rounded-tr-2xl" />
            </div>
          </div>

          {/* CENTER — Investment Breakdown */}
          <div className="flex flex-col gap-4">
            <h3 className="display-hero text-2xl md:text-3xl text-forest dark:text-white">
              <RichText value={invHeader} />
            </h3>
            <ul className="space-y-2">
              {invItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-forest/70 dark:text-white/70">
                  <span className="text-primary shrink-0 mt-0.5 font-bold">•</span>
                  <RichText value={item} />
                </li>
              ))}
            </ul>
            <div className="border-t border-forest/10 dark:border-white/10 pt-3">
              <p className="text-sm text-forest/70 dark:text-white/70">
                <RichText value={feeLabel} />:{" "}
                <span className="font-bold text-primary"><RichText value={feeValue} /></span>
              </p>
            </div>
            <div className="border-t border-forest/10 dark:border-white/10 pt-3">
              <h4 className="display-hero text-lg text-forest dark:text-white">
                <RichText value={immediateLabel} />
              </h4>
              <p className="display-number text-3xl font-bold text-primary">
                <RichText value={immediateValue} />
              </p>
            </div>
            <div className="space-y-1">
              {extras.map((extra, i) => (
                <p key={i} className="text-sm text-forest/70 dark:text-white/70">
                  <RichText value={extra.label} />{" "}
                  <span className="font-bold text-primary"><RichText value={extra.value} /></span>
                </p>
              ))}
            </div>
            <div className="border-t border-forest/10 dark:border-white/10 pt-3">
              <h4 className="display-hero text-xl text-forest dark:text-white">
                <RichText value={totalLabel} />
              </h4>
              <p className="display-number text-4xl font-bold text-primary">
                <RichText value={totalValue} />
              </p>
            </div>
          </div>

          {/* RIGHT — Metrics 2×3 grid */}
          <div className="grid grid-cols-2 gap-6 content-start">
            {metrics.map((metric, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-2">
                <div className="w-14 h-14 flex items-center justify-center shrink-0">
                  <img src={metric.icon} alt="" className="w-12 h-12 object-contain" />
                </div>
                <span className="text-xs italic text-forest/60 dark:text-white/60 leading-tight">
                  <RichText value={metric.label} />
                </span>
                <span className="display-number text-lg font-bold text-primary leading-tight">
                  <RichText value={metric.value} />
                </span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};
