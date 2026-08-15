/** Admin V2 (PLAN-0022) — breadcrumb clicável = implementação visual do roll-up. */

export type AdminBreadcrumbItem = {
  label: string;
  onNavigate?: () => void;
};

export function AdminBreadcrumb({ items }: { items: AdminBreadcrumbItem[] }) {
  return (
    <nav
      aria-label="breadcrumb"
      className="flex flex-wrap items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            {index > 0 && (
              <span aria-hidden="true" className="text-stone-300">
                ›
              </span>
            )}
            {item.onNavigate && !isLast ? (
              <button
                type="button"
                onClick={item.onNavigate}
                className="hover:text-primary transition-colors"
              >
                {item.label}
              </button>
            ) : (
              <span className={isLast ? "text-forest" : undefined}>{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
