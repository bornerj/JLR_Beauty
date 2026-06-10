import type { ReactElement } from "react";
import { createPortal } from "react-dom";
import { usePortalTarget } from "../../../shared/usePortalTarget";
import { AdminSectionTogglesView } from "./AdminSectionTogglesView";

export const AdminSectionTogglesViewIsland = (): ReactElement | null => {
  const target = usePortalTarget("[data-react-admin-section-toggles-view]");
  if (!target) return null;
  return createPortal(<AdminSectionTogglesView />, target);
};
