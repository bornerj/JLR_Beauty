import {
  FranquiasContactSection,
  FranquiasHeroSection,
  FranquiasModelsSection,
  FranquiasVisionSection,
} from "../../modules/public-site/sections";
import { usePublicPageSectionToggles } from "../../modules/public-site/sectionToggles.runtime";

export default function FranquiasContent() {
  const sections = usePublicPageSectionToggles("franquias");

  return (
    <>
      {sections.hero ? <FranquiasHeroSection /> : null}
      {sections.vision ? <FranquiasVisionSection /> : null}
      {sections.models ? <FranquiasModelsSection /> : null}
      {sections.contact ? <FranquiasContactSection /> : null}
    </>
  );
}
