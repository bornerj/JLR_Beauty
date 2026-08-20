import { useState } from "react";
import { getToken } from "../../../../lib/auth";
import { logger } from "../../../../utils/logger";
import { postStockMovement } from "../../../shared/api";
import type { InventoryUnit, StockMovementKind } from "../types";

/**
 * Admin V2 (PLAN-0026, Onda 11) — modal de movimentação de estoque (`PLAN-0020`), reusa
 * `/api/units/:unitId/products/:id/stock/{entry,consumption,loss,adjust}` sem alteração.
 * Mesmas 4 modalidades do legado: entrada (compra), baixa por uso no salão, perda/quebra,
 * ajuste de inventário (define saldo alvo — exige razão, regra do backend S6).
 */

const KIND_OPTIONS: { value: StockMovementKind; label: string }[] = [
  { value: "entry", label: "Entrada (compra)" },
  { value: "consumption", label: "Baixa por uso no salão" },
  { value: "loss", label: "Perda / quebra / vencimento" },
  { value: "adjust", label: "Ajuste de inventário (define saldo)" },
];

export function StockMoveModal({
  productId,
  productName,
  units,
  onClose,
  onSaved,
}: {
  productId: number;
  productName: string;
  units: InventoryUnit[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [kind, setKind] = useState<StockMovementKind>("entry");
  const [unitId, setUnitId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const quantityLabel = kind === "adjust" ? "Saldo alvo (contagem)" : "Quantidade";

  const handleSave = async () => {
    const token = getToken();
    if (!token) return;
    const unitIdNum = unitId ? Number(unitId) : null;
    const quantityNum = quantity.trim() ? Number(quantity) : NaN;
    if (!unitIdNum) {
      setError("Selecione a unidade.");
      return;
    }
    if (!Number.isInteger(quantityNum) || quantityNum < 0 || (kind !== "adjust" && quantityNum < 1)) {
      setError("Informe uma quantidade válida.");
      return;
    }
    if (kind === "adjust" && reason.trim().length < 3) {
      setError("Ajuste de inventário exige uma razão (mínimo 3 caracteres).");
      return;
    }
    const costNum = unitCost.trim() ? Number(unitCost) : undefined;
    if (kind === "entry" && unitCost.trim() && (costNum === undefined || Number.isNaN(costNum))) {
      setError("Custo unitário inválido.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const input =
        kind === "adjust"
          ? { kind: "adjust" as const, targetStock: quantityNum, reason: reason.trim() }
          : {
              kind,
              quantity: quantityNum,
              unitCost: kind === "entry" ? costNum : undefined,
              reason: reason.trim() || undefined,
            };
      await postStockMovement({ token, unitId: unitIdNum, productId, kind, input });
      onSaved();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao registrar movimento.";
      logger.warn("Falha ao registrar movimento de estoque (Admin V2)", { error: message, productId, kind });
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-forest">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">Movimentação de estoque</p>
            <h3 className="text-lg font-bold text-forest">{productName}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/40 text-forest hover:bg-primary/5"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Tipo de movimento</span>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as StockMovementKind)}
              className="rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
            >
              {KIND_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Unidade</span>
            <select
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              className="rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
            >
              <option value="">Selecione a unidade</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.isOnline ? `${unit.name} (online)` : unit.name}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">{quantityLabel}</span>
              <input
                type="number"
                min={0}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                className="rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
              />
            </label>
            {kind === "entry" && (
              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Custo unitário</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                  placeholder="0,00"
                  className="rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
                />
              </label>
            )}
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Razão</span>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Obrigatória em ajuste; recomendada nos demais"
              className="rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
            />
          </label>
        </div>

        {error && <p className="mt-3 text-xs font-semibold text-state-critical">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-full border border-stone-200 px-4 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-50 disabled:opacity-50 dark:text-stone-400"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={submitting}
            className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Registrando…" : "Registrar movimento"}
          </button>
        </div>
      </div>
    </div>
  );
}
