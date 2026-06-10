import type { ReactElement } from "react";
import { createPortal } from "react-dom";
import { AdminDashboardView } from "./AdminDashboardView";
import { usePortalTarget } from "../../../shared/usePortalTarget";

export const AdminDashboardViewIsland = (): ReactElement | null => {
  const target = usePortalTarget("[data-react-admin-dashboard-view]");
  if (!target) return null;
  return createPortal(<AdminDashboardView />, target);
};
