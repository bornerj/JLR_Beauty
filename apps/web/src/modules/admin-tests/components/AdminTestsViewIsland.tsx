import type { ReactElement } from "react";
import { createPortal } from "react-dom";
import { AdminTestsView } from "./AdminTestsView";
import { usePortalTarget } from "../../../shared/usePortalTarget";

export const AdminTestsViewIsland = (): ReactElement | null => {
  const target = usePortalTarget("[data-react-admin-tests-view]");
  if (!target) return null;
  return createPortal(<AdminTestsView />, target);
};
