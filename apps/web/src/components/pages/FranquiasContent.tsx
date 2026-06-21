import {
  FranquiasBenefitsSection,
  FranquiasContactSection,
  FranquiasEtapasAberturaSection,
  FranquiasExpansaoSection,
  FranquiasFran01Section,
  FranquiasFran02Section,
  FranquiasFran03Section,
  FranquiasFluxoCaixaSection,
  FranquiasFounderSection,
  FranquiasGestaoAppSection,
  FranquiasHeroSection,
  FranquiasMarketingCrmSection,
  FranquiasModelsSection,
  FranquiasPerfilFranqueadoSection,
  FranquiasSuporteFranqueadoraSection,
  FranquiasVisionSection,
  HomeAboutSection,
  MissionSection,
} from "../../modules/public-site/sections";
import { usePublicPageSectionToggles } from "../../modules/public-site/sectionToggles.runtime";

export default function FranquiasContent() {
  const sections = usePublicPageSectionToggles("franquias");

  // Compute alternating bg for visible sections that participate in the A/B pattern.
  // Sections with their own fixed bg (hero, mission, fluxo_caixa, expansao, contact)
  // do not consume an index slot — the sequence continues unbroken across them.
  const altKeys = [
    "about", "vision", "founder", "benefits", "models",
    "fran03", "fran02", "fran01", "gestao_app", "marketing_crm",
    "perfil", "suporte", "etapas",
  ] as const;

  let seq = 0;
  const altMap: Partial<Record<typeof altKeys[number], boolean>> = {};
  for (const key of altKeys) {
    if (sections[key]) altMap[key] = seq++ % 2 !== 0;
  }

  return (
    <>
      {sections.hero ? <FranquiasHeroSection /> : null}
      {sections.about ? <HomeAboutSection alt={altMap.about} /> : null}
      {sections.vision ? <FranquiasVisionSection alt={altMap.vision} /> : null}
      {sections.founder ? <FranquiasFounderSection alt={altMap.founder} /> : null}
      {sections.benefits ? <FranquiasBenefitsSection alt={altMap.benefits} /> : null}
      {sections.mission ? <MissionSection /> : null}
      {sections.models ? <FranquiasModelsSection alt={altMap.models} /> : null}
      {sections.fran03 ? <FranquiasFran03Section alt={altMap.fran03} /> : null}
      {sections.fran02 ? <FranquiasFran02Section alt={altMap.fran02} /> : null}
      {sections.fran01 ? <FranquiasFran01Section alt={altMap.fran01} /> : null}
      {sections.gestao_app ? <FranquiasGestaoAppSection alt={altMap.gestao_app} /> : null}
      {sections.fluxo_caixa ? <FranquiasFluxoCaixaSection /> : null}
      {sections.marketing_crm ? <FranquiasMarketingCrmSection alt={altMap.marketing_crm} /> : null}
      {sections.expansao ? <FranquiasExpansaoSection /> : null}
      {sections.perfil ? <FranquiasPerfilFranqueadoSection alt={altMap.perfil} /> : null}
      {sections.suporte ? <FranquiasSuporteFranqueadoraSection alt={altMap.suporte} /> : null}
      {sections.etapas ? <FranquiasEtapasAberturaSection alt={altMap.etapas} /> : null}
      {sections.contact ? <FranquiasContactSection /> : null}
    </>
  );
}
