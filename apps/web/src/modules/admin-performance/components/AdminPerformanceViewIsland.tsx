import type { ReactElement } from "react";
import { createPortal } from "react-dom";
import { AdminPerformanceView } from "./AdminPerformanceView";
import { usePortalTarget } from "../../../shared/usePortalTarget";

export const AdminPerformanceViewIsland = (): ReactElement | null => {
  const target = usePortalTarget("[data-react-admin-performance-view]");
  if (!target) return null;
  return createPortal(<AdminPerformanceView />, target);
};
