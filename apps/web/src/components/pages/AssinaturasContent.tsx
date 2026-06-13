import {
  AssinaturasHeroSection,
  HomeAboutSection,
  HomeMembershipSection,
  HomeTestimonialsSection,
  MissionSection,
} from "../../modules/public-site/sections";
import { usePublicPageSectionToggles } from "../../modules/public-site/sectionToggles.runtime";

export default function AssinaturasContent() {
  const sections = usePublicPageSectionToggles("assinaturas");
  const showHero = sections.hero ?? false;

  return (
    <>
      {showHero ? <AssinaturasHeroSection /> : null}

      {sections.membership ? <HomeMembershipSection /> : null}

      {sections.about ? <HomeAboutSection /> : null}

      {sections.mission ? <MissionSection /> : null}

      {sections.testimonials ? <HomeTestimonialsSection /> : null}
    </>
  );
}
