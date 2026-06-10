import {
  AssinaturasHeroSection,
  HomeAboutSection,
  HomeMembershipSection,
  HomeTestimonialsSection,
} from "../../modules/public-site/sections";
import { usePublicPageSectionToggles } from "../../modules/public-site/sectionToggles.runtime";

export default function AssinaturasContent() {
  const sections = usePublicPageSectionToggles("assinaturas");
  const showHero = sections.hero ?? false;

  return (
    <>
      {showHero ? <AssinaturasHeroSection /> : null}

      {sections.membership ? <HomeMembershipSection title="Faça sua Assinatura e Economize!" /> : null}

      {sections.about ? <HomeAboutSection /> : null}

      {sections.testimonials ? <HomeTestimonialsSection /> : null}
    </>
  );
}
