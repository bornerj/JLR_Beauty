import { useState } from "react";
import { formatCurrencyBRL } from "../../../shared/format";
import { QUADRANT_DESCRIPTIONS, QUADRANT_DOT_CLASS, QUADRANT_LABELS, QUADRANT_TEXT_CLASS } from "../state";
import type { ServicePerformance } from "../types";

/**
 * Admin V2 (PLAN-0022, Onda 6) — cartão de serviço da Performance de Serviços
 * (RETROFIT-007). Sinaliza "ocupa muita agenda, rende pouco por hora" (Armadilha) com
 * `[Analisar preço]` — governança #7 (todo insight relevante termina em ação
 * contextual). Sem deep-link para editar preço no Admin legado (mesma limitação já
 * encontrada nas Ondas 2-3): o badge é informativo, não um link morto.
 */

export function ServiceCard({ service }: { service: ServicePerformance }) {
  const [expanded, setExpanded] = useState(false);
  const hasUnitBreakdown = service.byUnit.length > 1;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-[#cfe7d1] bg-white p-3 dark:border-forest-green dark:bg-forest">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-bold text-forest">{service.name}</p>
        <span
          title={QUADRANT_DESCRIPTIONS[service.quadrant]}
          className={`flex flex-shrink-0 items-center gap-1.5 text-xs font-bold ${QUADRANT_TEXT_CLASS[service.quadrant]}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${QUADRANT_DOT_CLASS[service.quadrant]}`} />
          {QUADRANT_LABELS[service.quadrant]}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-600 dark:text-stone-400">
        <span>
          Agendamentos <strong className="text-forest">{service.appointments}</strong>
        </span>
        <span>
          Ocupa <strong className="text-forest">{service.occupancyPercent.toFixed(1)}%</strong> da agenda
        </span>
        {service.marginPerHour !== null ? (
          <span>
            Margem/hora{" "}
            <strong className={service.marginPerHour >= 0 ? "text-forest" : "text-state-critical"}>
              {formatCurrencyBRL(service.marginPerHour)}
            </strong>
          </span>
        ) : (
          <span className="text-stone-500 dark:text-stone-400">sem agendamento no período</span>
        )}
        {service.marginSharePercent !== null && (
          <span>
            <strong className="text-forest">{service.marginSharePercent.toFixed(1)}%</strong> da margem total
          </span>
        )}
      </div>

      {service.quadrant === "ARMADILHA" && (
        <span
          title="Ocupa muita agenda, mas rende pouco por hora — vale revisar o preço ou o tempo de execução deste serviço."
          className="w-fit rounded-full bg-state-critical/10 px-2 py-0.5 text-[11px] font-bold text-state-critical"
        >
          ⚠ Analisar preço
        </span>
      )}

      {hasUnitBreakdown && (
        <div>
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="text-[11px] font-semibold text-primary hover:underline"
          >
            {expanded ? "ocultar por unidade" : `ver por unidade (${service.byUnit.length})`}
          </button>
          {expanded && (
            <div className="mt-2 flex flex-col divide-y divide-stone-100 dark:divide-forest-green">
              {service.byUnit.map((unit) => (
                <div key={unit.unitId} className="flex flex-wrap items-center justify-between gap-2 py-1.5 text-xs">
                  <span className="font-semibold text-forest">{unit.unitName}</span>
                  <span className="text-stone-600 dark:text-stone-400">
                    {unit.appointments} agendamento(s)
                    {unit.marginPerHour !== null && (
                      <>
                        {" "}
                        · <span className={unit.marginPerHour >= 0 ? "text-forest" : "text-state-critical"}>{formatCurrencyBRL(unit.marginPerHour)}/h</span>
                      </>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
