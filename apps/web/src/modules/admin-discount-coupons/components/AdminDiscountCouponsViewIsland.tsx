import type { ReactElement } from "react";
import { createPortal } from "react-dom";
import { usePortalTarget } from "../../../shared/usePortalTarget";
import { AdminDiscountCouponsView } from "./AdminDiscountCouponsView";

export const AdminDiscountCouponsViewIsland = (): ReactElement | null => {
  const target = usePortalTarget("[data-react-admin-discount-coupons-view]");
  if (!target) return null;
  return createPortal(<AdminDiscountCouponsView />, target);
};
