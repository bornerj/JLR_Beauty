import type { ReactElement } from "react";
import { createPortal } from "react-dom";
import { AdminSubscribersView } from "./AdminSubscribersView";
import { usePortalTarget } from "../../../shared/usePortalTarget";

export const AdminSubscribersViewIsland = (): ReactElement | null => {
  const target = usePortalTarget("[data-react-admin-subscribers-view]");
  if (!target) return null;
  return createPortal(<AdminSubscribersView />, target);
};
