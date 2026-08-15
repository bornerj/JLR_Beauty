import { useNavigate } from "react-router-dom";
import { formatSignedPercent } from "../../shared/format";
import type { NetworkUnitCard } from "../types";

/** Admin V2 (PLAN-0022, Onda 2) — cartão vivo de unidade no Mapa da Rede (RETROFIT-002). */

export function NetworkUnitCardView({ card }: { card: NetworkUnitCard }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(`/admin-v2/rede/${card.unitId}`)}
      className="flex w-full flex-col gap-1.5 rounded-lg border border-[#cfe7d1] bg-white p-3 text-left transition-shadow hover:shadow-md dark:border-forest-green dark:bg-forest"
    >
      <p className="text-sm font-bold text-forest">{card.unitName}</p>
      <p className={card.revenueTrendPercent >= 0 ? "text-sm font-semibold text-state-healthy" : "text-sm font-semibold text-state-critical"}>
        {formatSignedPercent(card.revenueTrendPercent)}
      </p>
      <p className="text-sm text-stone-600 dark:text-stone-400">Marg {card.marginPercent.toFixed(0)}%</p>
      <p className="text-sm text-stone-600 dark:text-stone-400">
        {card.primaryStrength.key === card.primaryWeakness.key ? "" : "↑ "}
        {card.primaryStrength.label}
      </p>
      <p className="text-xs text-state-attention">⚠ {card.primaryWeakness.label}</p>
    </button>
  );
}
