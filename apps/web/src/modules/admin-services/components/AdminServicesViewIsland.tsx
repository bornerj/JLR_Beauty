import type { ReactElement } from "react";
import { createPortal } from "react-dom";
import { AdminServicesView } from "./AdminServicesView";
import { usePortalTarget } from "../../../shared/usePortalTarget";

export const AdminServicesViewIsland = (): ReactElement | null => {
  const target = usePortalTarget("[data-react-admin-services-view]");
  if (!target) return null;
  return createPortal(<AdminServicesView />, target);
};
