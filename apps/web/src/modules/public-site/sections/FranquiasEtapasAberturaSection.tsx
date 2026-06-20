import { Fragment, type ReactElement } from "react";
import { usePageText } from "../pageTexts.runtime";
import { RichText } from "../../../components/ui/RichText";

export const FranquiasEtapasAberturaSection = (): ReactElement => {
  const title = usePageText("franquias.etapas.title");
  const step1  = usePageText("franquias.etapas.step_1");
  const step2  = usePageText("franquias.etapas.step_2");
  const step3  = usePageText("franquias.etapas.step_3");
  const step4  = usePageText("franquias.etapas.step_4");
  const step5  = usePageText("franquias.etapas.step_5");
  const step6  = usePageText("franquias.etapas.step_6");
  const step7  = usePageText("franquias.etapas.step_7");
  const step8  = usePageText("franquias.etapas.step_8");
  const step9  = usePageText("franquias.etapas.step_9");
  const step10 = usePageText("franquias.etapas.step_10");
  const cta    = usePageText("franquias.etapas.cta");

  // Snake layout: row1 left-to-right (1–4), row2 right-to-left (5–8), row3 left + CTA (9–10)
  const row1 = [step1, step2, step3, step4];
  const row2 = [step8, step7, step6, step5]; // reversed for snake visual
  const row3 = [step9, step10];

  const StepBubble = ({ num, label }: { num: number; label: ReturnType<typeof usePageText> }) => (
    <div className="flex flex-col items-center gap-3 flex-1 min-w-0">
      <div className="shrink-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm shadow-md">
        {num}
      </div>
      <p className="text-sm text-center text-forest/80 dark:text-white/80 leading-snug max-w-[100px]">
        <RichText value={label} />
      </p>
    </div>
  );

  const Connector = ({ flip = false }: { flip?: boolean }) => (
    <div className={`hidden sm:block self-[28px] mt-7 flex-none w-8 ${flip ? "rotate-180" : ""}`}>
      <div className="border-t-2 border-dashed border-primary/50 w-full" />
    </div>
  );

  return (
    <section className="w-full bg-white dark:bg-background-dark py-20" id="etapas-abertura">
      <div className="mx-auto max-w-[620px] px-6 lg:px-10">

        <div className="text-center mb-16">
          <h2 className="display-hero text-4xl md:text-5xl text-forest dark:text-white leading-tight">
            <RichText value={title} />
          </h2>
        </div>

        {/* Row 1 — steps 1–4, L→R */}
        <div className="flex items-start justify-between gap-2 mb-10">
          {row1.map((s, i) => (
            <Fragment key={i}>
              <StepBubble num={i + 1} label={s} />
              {i < row1.length - 1 && <Connector />}
            </Fragment>
          ))}
        </div>

        {/* Turn connector — right side going down */}
        <div className="flex justify-end mb-10 pr-[calc(12.5%-28px)]">
          <div className="h-8 border-r-2 border-dashed border-primary/50" />
        </div>

        {/* Row 2 — steps 8→5, displayed R→L so snake goes right-to-left */}
        <div className="flex items-start justify-between gap-2 mb-10">
          {row2.map((s, i) => (
            <Fragment key={i}>
              <StepBubble num={8 - i} label={s} />
              {i < row2.length - 1 && <Connector flip />}
            </Fragment>
          ))}
        </div>

        {/* Turn connector — left side going down */}
        <div className="flex justify-start mb-10 pl-[calc(12.5%-28px)]">
          <div className="h-8 border-l-2 border-dashed border-primary/50" />
        </div>

        {/* Row 3 — steps 9–10 + CTA */}
        <div className="flex items-start justify-start gap-2">
          {row3.map((s, i) => (
            <Fragment key={i}>
              <StepBubble num={i + 9} label={s} />
              {i < row3.length - 1 && <Connector />}
            </Fragment>
          ))}
          <Connector />
          {/* CTA */}
          <div className="flex flex-col items-center gap-3 flex-1">
            <div className="w-14 h-14 rounded-full bg-forest dark:bg-white/10 border-2 border-primary flex items-center justify-center text-white dark:text-white font-bold text-lg shadow-md">
              ✦
            </div>
            <button className="text-xs text-center bg-primary text-white font-bold px-4 py-2 rounded-full shadow hover:bg-primary/90 transition-colors max-w-[120px] leading-snug">
              <RichText value={cta} />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
