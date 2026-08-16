import { Link } from "react-router-dom";

/**
 * Admin V2 (PLAN-0024, RETROFIT-020/021; `native` desde o PLAN-0026) — card de navegação
 * para as telas "hub" (Cadastros/Sistema). Sempre um link real (`<Link>` vira `<a href>`)
 * quando `href` existe; nunca um link morto — item sem tela correspondente no legado vem
 * com `disabledReason` e fica desabilitado, mesmo padrão de "em breve" já usado em
 * `AdminSidebar`/`DrillCard`. `native: true` indica que a tela já foi reescrita dentro do
 * Admin V2 (`DECISION-014`) — muda só a legenda, não some com o adapter/link pro legado
 * das telas ainda não migradas.
 */

export function HubCard({
  icon,
  label,
  href,
  disabledReason,
  native = false,
}: {
  icon: string;
  label: string;
  href?: string;
  disabledReason?: string;
  native?: boolean;
}) {
  if (!href) {
    return (
      <div
        title={disabledReason ? `${label} — ${disabledReason}` : `${label} — em breve`}
        aria-disabled="true"
        className="flex flex-col items-start gap-2 rounded-xl border border-stone-200 bg-white p-5 opacity-50 dark:border-forest-green dark:bg-forest"
      >
        <span className="material-symbols-outlined text-2xl text-stone-400">{icon}</span>
        <p className="text-sm font-bold text-stone-500 dark:text-stone-400">{label}</p>
        <p className="text-xs uppercase tracking-wide text-stone-400">{disabledReason ?? "em breve"}</p>
      </div>
    );
  }
  return (
    <Link
      to={href}
      className="flex flex-col items-start gap-2 rounded-xl border border-[#cfe7d1] bg-white p-5 transition-colors hover:border-primary/60 hover:bg-primary/5 dark:border-forest-green dark:bg-forest"
    >
      <span className="material-symbols-outlined text-2xl text-primary">{icon}</span>
      <p className="text-sm font-bold text-forest">{label}</p>
      <p className="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">
        {native ? "Abrir →" : "Abrir no Admin →"}
      </p>
    </Link>
  );
}
