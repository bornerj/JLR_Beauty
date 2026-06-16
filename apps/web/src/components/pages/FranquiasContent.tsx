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

  return (
    <>
      {sections.hero ? <FranquiasHeroSection /> : null}
      {sections.about ? <HomeAboutSection /> : null}
      {sections.vision ? <FranquiasVisionSection /> : null}
      {sections.founder ? <FranquiasFounderSection /> : null}
      {sections.benefits ? <FranquiasBenefitsSection /> : null}
      {sections.mission ? <MissionSection /> : null}
      {sections.models ? <FranquiasModelsSection /> : null}
      {sections.fran01 ? <FranquiasFran01Section /> : null}
      {sections.fran02 ? <FranquiasFran02Section /> : null}
      {sections.fran03 ? <FranquiasFran03Section /> : null}
      {sections.gestao_app ? <FranquiasGestaoAppSection /> : null}
      {sections.fluxo_caixa ? <FranquiasFluxoCaixaSection /> : null}
      {sections.marketing_crm ? <FranquiasMarketingCrmSection /> : null}
      {sections.expansao ? <FranquiasExpansaoSection /> : null}
      {sections.perfil ? <FranquiasPerfilFranqueadoSection /> : null}
      {sections.suporte ? <FranquiasSuporteFranqueadoraSection /> : null}
      {sections.etapas ? <FranquiasEtapasAberturaSection /> : null}
      {sections.contact ? <FranquiasContactSection /> : null}
    </>
  );
}
