import type { ReactElement } from "react";
import { useMediaSlot } from "../media.runtime";
import { usePageText } from "../pageTexts.runtime";
import { RichText } from "../../../components/ui/RichText";

export const FranquiasMarketingCrmSection = (): ReactElement => {
  const crmImg = useMediaSlot("franquias_marketing_crm_img_01");

  const title  = usePageText("franquias.marketing_crm.title");
  const item1  = usePageText("franquias.marketing_crm.item_1");
  const item2  = usePageText("franquias.marketing_crm.item_2");
  const item3  = usePageText("franquias.marketing_crm.item_3");
  const item4  = usePageText("franquias.marketing_crm.item_4");
  const item5  = usePageText("franquias.marketing_crm.item_5");
  const sub1   = usePageText("franquias.marketing_crm.sub_1");
  const sub2   = usePageText("franquias.marketing_crm.sub_2");
  const sub3   = usePageText("franquias.marketing_crm.sub_3");
  const tip    = usePageText("franquias.marketing_crm.tip");

  const items = [item1, item2, item3, item4, item5];

  return (
    <section className="w-full bg-background-light dark:bg-background-dark" id="marketing-crm">
      <div className="grid grid-cols-1 lg:grid-cols-2">

        {/* LEFT — text content */}
        <div className="px-10 py-20 lg:px-14 lg:py-24 flex flex-col justify-center">
          <h2 className="display-hero text-4xl md:text-5xl text-forest dark:text-white leading-tight mb-10">
            <RichText value={title} />
          </h2>

          <ul className="space-y-4 mb-6">
            {items.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-1 w-2 h-2 rounded-full bg-primary shrink-0" />
                <span className="text-sm text-forest/80 dark:text-white/80 leading-relaxed">
                  <RichText value={item} />
                </span>
              </li>
            ))}
          </ul>

          {/* CRM sub-items */}
          <div className="pl-5 border-l-2 border-primary/40 space-y-2 mb-8">
            {[sub1, sub2, sub3].map((s, i) => (
              <p key={i} className="text-xs text-primary font-medium leading-relaxed">
                <RichText value={s} />
              </p>
            ))}
          </div>

          {/* Tip callout */}
          <div className="bg-primary/10 border border-primary/30 rounded-lg px-5 py-4">
            <p className="text-xs text-forest/70 dark:text-white/70 italic leading-relaxed">
              <RichText value={tip} />
            </p>
          </div>
        </div>

        {/* RIGHT — photo */}
        <div className="relative min-h-[360px] lg:min-h-0 overflow-hidden">
          <img
            src={crmImg}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
        </div>

      </div>
    </section>
  );
};
