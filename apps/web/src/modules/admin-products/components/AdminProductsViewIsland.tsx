import type { ReactElement } from "react";
import { createPortal } from "react-dom";
import { AdminProductsView } from "./AdminProductsView";
import { usePortalTarget } from "../../../shared/usePortalTarget";

export const AdminProductsViewIsland = (): ReactElement | null => {
  const target = usePortalTarget("[data-react-admin-products-view]");
  if (!target) return null;
  return createPortal(<AdminProductsView />, target);
};
