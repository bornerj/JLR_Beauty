import type { ReactElement } from "react";
import { createPortal } from "react-dom";
import { usePortalTarget } from "../../../shared/usePortalTarget";
import { AdminMediaGalleryView } from "./AdminMediaGalleryView";

export const AdminMediaGalleryViewIsland = (): ReactElement | null => {
  const target = usePortalTarget("[data-react-admin-media-gallery-view]");
  if (!target) return null;
  return createPortal(<AdminMediaGalleryView />, target);
};

