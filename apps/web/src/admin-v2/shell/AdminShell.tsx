import { useEffect, useState, type ReactNode } from "react";
import { getToken } from "../../lib/auth";
import { fetchAdminV2Units } from "../shared/api";
import type { AdminV2Unit } from "../panorama/types";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";
import { AdminBreadcrumb, type AdminBreadcrumbItem } from "./AdminBreadcrumb";
import { useAdminScope } from "./adminScope";

/** Admin V2 (PLAN-0022, Onda 1) — chrome comum a todas as telas: sidebar + topbar + breadcrumb. */

export function AdminShell({
  activeKey,
  breadcrumb,
  children,
}: {
  activeKey: string;
  breadcrumb: AdminBreadcrumbItem[];
  children: ReactNode;
}) {
  const { scope, setPreset, setUnitId } = useAdminScope();
  const [units, setUnits] = useState<AdminV2Unit[]>([]);

  useEffect(() => {
    let active = true;
    const token = getToken();
    if (!token) return;
    fetchAdminV2Units({ token })
      .then((result) => {
        if (active) setUnits(result);
      })
      .catch(() => {
        // silencioso: se a lista falhar, o seletor fica só com "Rede inteira".
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="admin-v2-shell flex min-h-screen w-full bg-background-light dark:bg-background-dark">
      <AdminSidebar activeKey={activeKey} />
      <div className="flex flex-1 flex-col">
        <AdminTopbar scope={scope} units={units} onPresetChange={setPreset} onUnitChange={setUnitId} />
        <div className="border-b border-gold/20 bg-white px-5 py-2 dark:bg-forest">
          <AdminBreadcrumb items={breadcrumb} />
        </div>
        <main className="flex-1 px-5 py-6">{children}</main>
      </div>
    </div>
  );
}
