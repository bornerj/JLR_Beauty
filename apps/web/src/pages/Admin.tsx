import { useEffect } from "react";
import { useBodyAttributes } from "../app/useBodyAttributes";
import { initAdminPage } from "../modules/admin-core/behavior";
import AdminContent from "../components/pages/AdminContent";
import {
  AdminDashboardAgendaIsland,
  AdminDashboardCommissionsIsland,
  AdminDashboardKpisIsland,
  AdminDashboardSalesIsland,
} from "../modules/admin-kpis";
import { AdminDashboardViewIsland } from "../modules/admin-dashboard";
import { AdminDiscountCouponsViewIsland } from "../modules/admin-discount-coupons";
import { AdminGoalsViewIsland } from "../modules/admin-goals";
import { AdminPeopleViewIsland } from "../modules/admin-people";
import { AdminPerformanceViewIsland } from "../modules/admin-performance";
import { AdminPlansViewIsland } from "../modules/admin-plans";
import { AdminProductsViewIsland } from "../modules/admin-products";
import { AdminSalesViewIsland } from "../modules/admin-sales";
import { AdminServicesViewIsland } from "../modules/admin-services";
import { AdminSubscribersViewIsland } from "../modules/admin-subscribers";
import { AdminScheduleViewIsland } from "../modules/admin-schedule";
import { AdminCheckoutDeliveryViewIsland } from "../modules/admin-checkout-delivery";
import { AdminBrandingViewIsland } from "../modules/admin-branding";
import { AdminMediaGalleryViewIsland } from "../modules/admin-media-gallery";
import { AdminSectionTogglesViewIsland } from "../modules/admin-section-toggles";
import { AdminPageTextsViewIsland } from "../modules/admin-page-texts";
import { AdminTestsViewIsland } from "../modules/admin-tests";
import { AdminWhatsappContactsViewIsland } from "../modules/admin-whatsapp-contacts";

export default function AdminPage() {
  useBodyAttributes({
    className:
      "bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-body",
  });

  useEffect(() => {
    let active = true;
    let cleanup: (() => void) | null = null;

    const requiredSelectors = [
      "[data-users-table-body]",
      "[data-services-table-body]",
      "[data-products-table-body]",
      "[data-subscriptions-table-body]",
      "[data-leads-table-body]",
      "[data-orders-table-body]",
    ];

    const isReady = (): boolean =>
      requiredSelectors.every((selector) => document.querySelector(selector));

    const start = (): void => {
      if (!active || cleanup) return;
      cleanup = initAdminPage();
    };

    if (isReady()) {
      start();
    } else {
      let attempts = 0;
      const maxAttempts = 180;
      const waitForViews = (): void => {
        if (!active) return;
        if (isReady() || attempts >= maxAttempts) {
          start();
          return;
        }
        attempts += 1;
        window.requestAnimationFrame(waitForViews);
      };
      window.requestAnimationFrame(waitForViews);
    }

    return () => {
      active = false;
      if (cleanup) cleanup();
    };
  }, []);

  return (
    <>
      <AdminContent />
      <AdminDashboardViewIsland />
      <AdminPeopleViewIsland />
      <AdminServicesViewIsland />
      <AdminGoalsViewIsland />
      <AdminPerformanceViewIsland />
      <AdminProductsViewIsland />
      <AdminPlansViewIsland />
      <AdminSubscribersViewIsland />
      <AdminScheduleViewIsland />
      <AdminWhatsappContactsViewIsland />
      <AdminSalesViewIsland />
      <AdminCheckoutDeliveryViewIsland />
      <AdminTestsViewIsland />
      <AdminSectionTogglesViewIsland />
      <AdminBrandingViewIsland />
      <AdminMediaGalleryViewIsland />
      <AdminPageTextsViewIsland />
      <AdminDiscountCouponsViewIsland />
      <AdminDashboardKpisIsland />
      <AdminDashboardSalesIsland />
      <AdminDashboardAgendaIsland />
      <AdminDashboardCommissionsIsland />
    </>
  );
}
