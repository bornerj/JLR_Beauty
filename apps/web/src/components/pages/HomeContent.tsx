import {
  AccessDeniedBanner,
  AuthModalsSection,
  CartModalSection,
  ConciergeWidgetSection,
  HomeAboutSection,
  HomeCtaSection,
  HomeHeroSection,
  HomeMembershipSection,
  HomeProductsSection,
  HomeServicesSection,
  HomeTestimonialsSection,
} from "../../modules/public-site/sections";
import { usePublicPageSectionToggles } from "../../modules/public-site/sectionToggles.runtime";

export default function HomeContent() {
  const homeSections = usePublicPageSectionToggles("home");

  return (
    <>
      <AccessDeniedBanner />
      <CartModalSection />
      <AuthModalsSection />

      {homeSections.hero ? <HomeHeroSection /> : null}
      {homeSections.services ? <HomeServicesSection /> : null}
      {homeSections.membership ? <HomeMembershipSection /> : null}
      {homeSections.about ? <HomeAboutSection /> : null}
      {homeSections.products ? <HomeProductsSection /> : null}
      {homeSections.testimonials ? <HomeTestimonialsSection /> : null}
      {homeSections.cta ? <HomeCtaSection /> : null}

      <ConciergeWidgetSection />
    </>
  );
}
