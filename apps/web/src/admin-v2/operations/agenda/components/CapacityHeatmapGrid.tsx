import { formatHour, formatShortDate, WEEKDAY_LABELS } from "../../../shared/format";
import { occupancyLevel, OCCUPANCY_CELL_CLASS } from "../state";
import type { CapacityHeatmap } from "../types";

/**
 * Admin V2 (PLAN-0022, Onda 4) — grade dia×hora do Mapa de Capacidade da Agenda
 * (RETROFIT-005). Cada célula é um horário real (`ProfessionalShift`/`Appointment`),
 * clicável para abrir o detalhamento (`SlotDetailPanel`) — nunca escreve na agenda.
 */

export function CapacityHeatmapGrid({
  heatmap,
  selected,
  onSelectSlot,
}: {
  heatmap: CapacityHeatmap;
  selected: { date: string; hour: number } | null;
  onSelectSlot: (date: string, hour: number) => void;
}) {
  if (!heatmap.hourRange || heatmap.days.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-stone-200 p-6 text-center text-base text-stone-600 dark:text-stone-400">
        Nenhuma escala de profissional cadastrada nesta unidade no período selecionado — sem escala não há grade de
        capacidade para desenhar.
      </div>
    );
  }

  const hours: number[] = [];
  for (let hour = heatmap.hourRange.start; hour < heatmap.hourRange.end; hour += 1) hours.push(hour);

  return (
    <div className="overflow-x-auto rounded-xl border border-[#cfe7d1] bg-white dark:border-forest-green dark:bg-forest">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-white p-2 text-left font-semibold text-stone-600 dark:text-stone-400 dark:bg-forest">
              Hora
            </th>
            {heatmap.days.map((day) => (
              <th key={day.date} className="p-2 text-center font-semibold text-stone-600 dark:text-stone-400">
                <span className="block">{WEEKDAY_LABELS[day.weekday]}</span>
                <span className="block text-forest">{formatShortDate(day.date)}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hours.map((hour) => (
            <tr key={hour}>
              <td className="sticky left-0 z-10 bg-white p-1 pr-2 text-right font-semibold text-stone-600 dark:text-stone-400 dark:bg-forest">
                {formatHour(hour)}
              </td>
              {heatmap.days.map((day) => {
                const slot = day.slots.find((s) => s.hour === hour);
                if (!slot) return <td key={`${day.date}-${hour}`} className="p-1" />;
                const level = occupancyLevel(slot.availableMinutes, slot.occupancyRate);
                const isSelected = selected?.date === day.date && selected.hour === hour;
                return (
                  <td key={`${day.date}-${hour}`} className="p-1">
                    <button
                      type="button"
                      disabled={slot.availableMinutes <= 0}
                      onClick={() => onSelectSlot(day.date, hour)}
                      title={`${WEEKDAY_LABELS[day.weekday]} ${formatShortDate(day.date)} · ${formatHour(hour)} · ocupação ${slot.occupancyRate}%`}
                      className={`h-8 w-12 rounded-md text-[11px] font-bold transition-colors disabled:cursor-not-allowed ${OCCUPANCY_CELL_CLASS[level]} ${
                        isSelected ? "ring-2 ring-primary ring-offset-1" : ""
                      }`}
                    >
                      {slot.availableMinutes > 0 ? `${Math.round(slot.occupancyRate)}%` : "—"}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
