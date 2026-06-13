import {
  FranquiasContactSection,
  FranquiasHeroSection,
  FranquiasModelsSection,
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
      {sections.mission ? <MissionSection /> : null}
      {sections.models ? <FranquiasModelsSection /> : null}
      {sections.contact ? <FranquiasContactSection /> : null}
    </>
  );
}
