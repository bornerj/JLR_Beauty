import type { ReactElement } from "react";
import { createPortal } from "react-dom";
import { usePortalTarget } from "../../../shared/usePortalTarget";
import { AdminPageTextsView } from "./AdminPageTextsView";

export const AdminPageTextsViewIsland = (): ReactElement | null => {
  const target = usePortalTarget("[data-react-admin-page-texts-view]");
  if (!target) return null;
  return createPortal(<AdminPageTextsView />, target);
};
