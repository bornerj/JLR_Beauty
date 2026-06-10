import type { ReactElement } from "react";
import { createPortal } from "react-dom";
import { AdminScheduleView } from "./AdminScheduleView";
import { usePortalTarget } from "../../../shared/usePortalTarget";

export const AdminScheduleViewIsland = (): ReactElement | null => {
  const target = usePortalTarget("[data-react-admin-schedule-view]");
  if (!target) return null;
  return createPortal(<AdminScheduleView />, target);
};
