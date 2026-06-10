import type { ReactElement } from "react";
import { createPortal } from "react-dom";
import { AdminWhatsappContactsView } from "./AdminWhatsappContactsView";
import { usePortalTarget } from "../../../shared/usePortalTarget";

export const AdminWhatsappContactsViewIsland = (): ReactElement | null => {
  const target = usePortalTarget("[data-react-admin-whatsapp-contacts-view]");
  if (!target) return null;
  return createPortal(<AdminWhatsappContactsView />, target);
};
