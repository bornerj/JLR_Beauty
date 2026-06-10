import { useCallback, useEffect } from "react";
import { Outlet, useLocation, useSearchParams } from "react-router-dom";
import PublicNav from "../../components/public/PublicNav";
import FranquiasNav from "../../components/public/FranquiasNav";
import VideoModal from "../../components/public/VideoModal";
import PublicFooter from "../../components/public/PublicFooter";
import CheckoutModal from "../../components/public/CheckoutModal";
import { initVideoModal } from "../../modules/public-site/video.behavior";
import { initIndexPage } from "../../modules/public-site/index.behavior";
import {
  usePublicSectionTogglesBootstrap,
  usePublicSectionTogglesVersion,
} from "../../modules/public-site/sectionToggles.runtime";
import { usePublicBrandingBootstrap } from "../../modules/public-site/branding.runtime";
import { usePublicMediaSlotsBootstrap } from "../../modules/public-site/media.runtime";

export default function PublicLayout() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isCheckoutOpen = searchParams.get("checkout") === "1";
  const isFranquias = location.pathname.startsWith("/franquias");
  usePublicSectionTogglesBootstrap();
  usePublicBrandingBootstrap();
  usePublicMediaSlotsBootstrap();
  const publicSectionTogglesVersion = usePublicSectionTogglesVersion();

  const closeCheckoutModal = useCallback(() => {
    const currentParams = new URLSearchParams(window.location.search);
    if (!currentParams.has("checkout")) return;
    currentParams.delete("checkout");
    setSearchParams(currentParams, { replace: true });
  }, [setSearchParams]);

  useEffect(() => {
    const cleanupVideo = initVideoModal();
    const cleanupIndex = initIndexPage();
    return () => {
      cleanupVideo();
      cleanupIndex();
    };
  }, [location.pathname, publicSectionTogglesVersion]);

  useEffect(() => {
    const openListener = () => {
      const currentParams = new URLSearchParams(window.location.search);
      currentParams.set("checkout", "1");
      setSearchParams(currentParams, { replace: false });
    };
    const closeListener = () => closeCheckoutModal();
    window.addEventListener("jlr:open-checkout", openListener as EventListener);
    window.addEventListener("jlr:close-checkout", closeListener as EventListener);
    return () => {
      window.removeEventListener("jlr:open-checkout", openListener as EventListener);
      window.removeEventListener("jlr:close-checkout", closeListener as EventListener);
    };
  }, [closeCheckoutModal, setSearchParams]);

  useEffect(() => {
    document.body.classList.toggle("checkout-modal-open", isCheckoutOpen);
    return () => document.body.classList.remove("checkout-modal-open");
  }, [isCheckoutOpen]);

  useEffect(() => {
    const hash = location.hash;
    if (!hash) return;

    const targetId = decodeURIComponent(hash.replace(/^#/, "").trim());
    if (!targetId) return;

    let canceled = false;
    let attempts = 0;
    const maxAttempts = 8;

    const scrollToTarget = () => {
      if (canceled) return;
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: "auto", block: "start" });
        return;
      }
      if (attempts >= maxAttempts) return;
      attempts += 1;
      window.setTimeout(scrollToTarget, 50);
    };

    scrollToTarget();
    return () => {
      canceled = true;
    };
  }, [location.pathname, location.hash, publicSectionTogglesVersion]);

  return (
    <div className="bg-background-light dark:bg-background-dark font-body text-forest dark:text-white antialiased selection:bg-primary selection:text-forest">
      {isFranquias ? <FranquiasNav /> : <PublicNav />}
      <VideoModal />
      <main>
        <Outlet />
      </main>
      <CheckoutModal isOpen={isCheckoutOpen} onClose={closeCheckoutModal} />
      <PublicFooter />
    </div>
  );
}
