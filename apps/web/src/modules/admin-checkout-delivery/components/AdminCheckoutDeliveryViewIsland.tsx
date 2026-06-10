import type { ReactElement } from "react";
import { createPortal } from "react-dom";
import { usePortalTarget } from "../../../shared/usePortalTarget";
import { AdminCheckoutDeliveryView } from "./AdminCheckoutDeliveryView";

export const AdminCheckoutDeliveryViewIsland = (): ReactElement | null => {
  const target = usePortalTarget("[data-react-admin-checkout-delivery-view]");
  if (!target) return null;
  return createPortal(<AdminCheckoutDeliveryView />, target);
};

