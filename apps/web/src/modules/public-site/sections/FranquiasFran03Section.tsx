import type { ReactElement } from "react";
import { useMediaSlot } from "../media.runtime";
import { usePageText } from "../pageTexts.runtime";
import { FranquiasModelDetailSection } from "./FranquiasModelDetailSection";

export const FranquiasFran03Section = (): ReactElement => {
  const floorplan     = useMediaSlot("franquias_fran03_floorplan_img_01");
  const metricIcon01  = useMediaSlot("franquias_fran03_metric_icon_01");
  const metricIcon02  = useMediaSlot("franquias_fran03_metric_icon_02");
  const metricIcon03  = useMediaSlot("franquias_fran03_metric_icon_03");
  const metricIcon04  = useMediaSlot("franquias_fran03_metric_icon_04");
  const metricIcon05  = useMediaSlot("franquias_fran03_metric_icon_05");
  const metricIcon06  = useMediaSlot("franquias_fran03_metric_icon_06");

  const label          = usePageText("franquias.fran03.label");
  const conceptBadge   = usePageText("franquias.fran03.concept_badge");
  const conceptDesc    = usePageText("franquias.fran03.concept_desc");
  const invHeader      = usePageText("franquias.fran03.inv_header");
  const invItem1       = usePageText("franquias.fran03.inv_item_1");
  const invItem2       = usePageText("franquias.fran03.inv_item_2");
  const invItem3       = usePageText("franquias.fran03.inv_item_3");
  const invItem4       = usePageText("franquias.fran03.inv_item_4");
  const invItem5       = usePageText("franquias.fran03.inv_item_5");
  const invItem6       = usePageText("franquias.fran03.inv_item_6");
  const feeLabel       = usePageText("franquias.fran03.fee_label");
  const feeValue       = usePageText("franquias.fran03.fee_value");
  const immediateLabel = usePageText("franquias.fran03.immediate_label");
  const immediateValue = usePageText("franquias.fran03.immediate_value");
  const extra1Label    = usePageText("franquias.fran03.extra_1_label");
  const extra1Value    = usePageText("franquias.fran03.extra_1_value");
  const extra2Label    = usePageText("franquias.fran03.extra_2_label");
  const extra2Value    = usePageText("franquias.fran03.extra_2_value");
  const extra3Label    = usePageText("franquias.fran03.extra_3_label");
  const extra3Value    = usePageText("franquias.fran03.extra_3_value");
  const totalLabel     = usePageText("franquias.fran03.total_label");
  const totalValue     = usePageText("franquias.fran03.total_value");
  const m1Label        = usePageText("franquias.fran03.metric_1_label");
  const m1Value        = usePageText("franquias.fran03.metric_1_value");
  const m2Label        = usePageText("franquias.fran03.metric_2_label");
  const m2Value        = usePageText("franquias.fran03.metric_2_value");
  const m3Label        = usePageText("franquias.fran03.metric_3_label");
  const m3Value        = usePageText("franquias.fran03.metric_3_value");
  const m4Label        = usePageText("franquias.fran03.metric_4_label");
  const m4Value        = usePageText("franquias.fran03.metric_4_value");
  const m5Label        = usePageText("franquias.fran03.metric_5_label");
  const m5Value        = usePageText("franquias.fran03.metric_5_value");
  const m6Label        = usePageText("franquias.fran03.metric_6_label");
  const m6Value        = usePageText("franquias.fran03.metric_6_value");

  return (
    <FranquiasModelDetailSection
      sectionId="fran03"
      label={label}
      conceptBadge={conceptBadge}
      conceptDesc={conceptDesc}
      floorplanImg={floorplan}
      invHeader={invHeader}
      invItems={[invItem1, invItem2, invItem3, invItem4, invItem5, invItem6]}
      feeLabel={feeLabel}
      feeValue={feeValue}
      immediateLabel={immediateLabel}
      immediateValue={immediateValue}
      extras={[
        { label: extra1Label, value: extra1Value },
        { label: extra2Label, value: extra2Value },
        { label: extra3Label, value: extra3Value },
      ]}
      totalLabel={totalLabel}
      totalValue={totalValue}
      metrics={[
        { icon: metricIcon01, label: m1Label, value: m1Value },
        { icon: metricIcon02, label: m2Label, value: m2Value },
        { icon: metricIcon03, label: m3Label, value: m3Value },
        { icon: metricIcon04, label: m4Label, value: m4Value },
        { icon: metricIcon05, label: m5Label, value: m5Value },
        { icon: metricIcon06, label: m6Label, value: m6Value },
      ]}
    />
  );
};
