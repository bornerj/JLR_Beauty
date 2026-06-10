import type { ReactElement } from "react";
import { createPortal } from "react-dom";
import { AdminPlansView } from "./AdminPlansView";
import { usePortalTarget } from "../../../shared/usePortalTarget";

export const AdminPlansViewIsland = (): ReactElement | null => {
  const target = usePortalTarget("[data-react-admin-plans-view]");
  if (!target) return null;
  return createPortal(<AdminPlansView />, target);
};
