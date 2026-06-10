import type { ReactElement } from "react";
import { createPortal } from "react-dom";
import { usePortalTarget } from "../../../shared/usePortalTarget";
import { AdminBrandingView } from "./AdminBrandingView";

export const AdminBrandingViewIsland = (): ReactElement | null => {
  const target = usePortalTarget("[data-react-admin-branding-view]");
  if (!target) return null;
  return createPortal(<AdminBrandingView />, target);
};

