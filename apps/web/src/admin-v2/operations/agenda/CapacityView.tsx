import { useCallback, useEffect, useState } from "react";
import { getToken } from "../../../lib/auth";
import { logger } from "../../../utils/logger";
import { useAdminScope } from "../../shell/adminScope";
import { fetchCapacityHeatmap, fetchSlotDetail } from "../../shared/api";
import { CapacityHeatmapGrid } from "./components/CapacityHeatmapGrid";
import { SlotDetailPanel } from "./components/SlotDetailPanel";
import type { CapacityHeatmap, SlotDetail } from "./types";

/**
 * Admin V2 (PLAN-0022, Onda 4) — Mapa de Capacidade da Agenda (RETROFIT-005).
 * Pergunta que a tela fecha: "onde estamos perdendo capacidade e receita?"
 * Diferente de Panorama/Rede/Operação (agregam a rede ou várias unidades), este mapa é
 * sempre de UMA unidade — usa o mesmo seletor único de unidade da topbar
 * (`AdminScope.unitId`); com "Rede inteira" selecionado, pede para escolher uma.
 */

type HeatmapState = { loading: boolean; data: CapacityHeatmap | null; error: string | null };
type SlotState = { key: string; loading: boolean; data: SlotDetail | null; error: string | null } | null;

export function CapacityView() {
  const { scope } = useAdminScope();
  const [heatmapState, setHeatmapState] = useState<HeatmapState>({ loading: true, data: null, error: null });
  const [slotState, setSlotState] = useState<SlotState>(null);

  const loadHeatmap = useCallback(async () => {
    if (!scope.unitId) return;
    const token = getToken();
    if (!token) {
      setHeatmapState({ loading: false, data: null, error: "Sessão expirada. Faça login novamente." });
      return;
    }
    setHeatmapState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchCapacityHeatmap({ token, unitId: scope.unitId, days: scope.days });
      setHeatmapState({ loading: false, data, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar o mapa de capacidade.";
      logger.warn("Falha ao carregar Mapa de Capacidade da Agenda (Admin V2)", { error: message, unitId: scope.unitId });
      setHeatmapState((prev) => ({ loading: false, data: prev.data, error: message }));
    }
  }, [scope.unitId, scope.days]);

  useEffect(() => {
    void loadHeatmap();
    setSlotState(null); // trocar de unidade/período invalida o horário selecionado anteriormente
  }, [loadHeatmap]);

  const loadSlot = useCallback(
    async (date: string, hour: number) => {
      if (!scope.unitId) return;
      const key = `${date}-${hour}`;
      const token = getToken();
      if (!token) {
        setSlotState({ key, loading: false, data: null, error: "Sessão expirada. Faça login novamente." });
        return;
      }
      setSlotState({ key, loading: true, data: null, error: null });
      try {
        const data = await fetchSlotDetail({ token, unitId: scope.unitId, date, hour, days: scope.days });
        setSlotState({ key, loading: false, data, error: null });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha ao carregar o detalhamento do horário.";
        logger.warn("Falha ao carregar detalhamento de horário (Admin V2)", { error: message, unitId: scope.unitId, date, hour });
        setSlotState({ key, loading: false, data: null, error: message });
      }
    },
    [scope.unitId, scope.days]
  );

  if (!scope.unitId) {
    return (
      <div className="rounded-xl border border-dashed border-stone-200 p-6 text-center text-base text-stone-600 dark:text-stone-400">
        O Mapa de Capacidade é sempre de uma unidade específica — selecione uma unidade no seletor no topo da tela
        (hoje: "Rede inteira").
      </div>
    );
  }

  if (heatmapState.loading && !heatmapState.data) {
    return <p className="text-base text-stone-600 dark:text-stone-400">Carregando mapa de capacidade…</p>;
  }

  if (heatmapState.error && !heatmapState.data) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-red-100 bg-white p-5">
        <p className="text-sm font-semibold text-red-600">Falha ao carregar o mapa de capacidade.</p>
        <p className="text-sm text-stone-600 dark:text-stone-400">{heatmapState.error}</p>
        <div>
          <button
            type="button"
            onClick={() => void loadHeatmap()}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!heatmapState.data) return null;
  const heatmap = heatmapState.data;
  const selected = slotState ? { date: slotState.key.slice(0, 10), hour: Number(slotState.key.slice(11)) } : null;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-3xl font-bold text-forest">Agenda — Capacidade</h1>
        <p className="text-base text-stone-600 dark:text-stone-400">
          onde {heatmap.unitName} está perdendo capacidade e receita · últimos {heatmap.period.days} dia(s) · clique
          num horário para ver o detalhamento
        </p>
      </div>

      <CapacityHeatmapGrid heatmap={heatmap} selected={selected} onSelectSlot={(date, hour) => void loadSlot(date, hour)} />

      {slotState && (
        <SlotDetailPanel
          loading={slotState.loading}
          error={slotState.error}
          detail={slotState.data}
          onRetry={() => void loadSlot(selected!.date, selected!.hour)}
        />
      )}
    </div>
  );
}
