import type { ReactElement } from "react";
import { createPortal } from "react-dom";
import { AdminPeopleView } from "./AdminPeopleView";
import { usePortalTarget } from "../../../shared/usePortalTarget";

export const AdminPeopleViewIsland = (): ReactElement | null => {
  const target = usePortalTarget("[data-react-admin-people-view]");
  if (!target) return null;
  return createPortal(<AdminPeopleView />, target);
};
