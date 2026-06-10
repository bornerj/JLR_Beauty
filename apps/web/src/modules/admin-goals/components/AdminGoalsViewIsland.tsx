import type { ReactElement } from "react";
import { createPortal } from "react-dom";
import { AdminGoalsView } from "./AdminGoalsView";
import { usePortalTarget } from "../../../shared/usePortalTarget";

export const AdminGoalsViewIsland = (): ReactElement | null => {
  const target = usePortalTarget("[data-react-admin-goals-view]");
  if (!target) return null;
  return createPortal(<AdminGoalsView />, target);
};
