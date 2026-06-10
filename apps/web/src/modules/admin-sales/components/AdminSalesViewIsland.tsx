import type { ReactElement } from "react";
import { createPortal } from "react-dom";
import { AdminSalesView } from "./AdminSalesView";
import { usePortalTarget } from "../../../shared/usePortalTarget";

export const AdminSalesViewIsland = (): ReactElement | null => {
  const target = usePortalTarget("[data-react-admin-sales-view]");
  if (!target) return null;
  return createPortal(<AdminSalesView />, target);
};
