import { useBodyAttributes } from "../app/useBodyAttributes";
import { AdminV2Root } from "../admin-v2";

export default function AdminV2Page() {
  useBodyAttributes({
    className: "bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-body",
  });

  return <AdminV2Root />;
}
