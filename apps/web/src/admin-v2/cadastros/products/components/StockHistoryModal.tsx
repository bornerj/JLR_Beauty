import { useCallback, useEffect, useState } from "react";
import { getToken } from "../../../../lib/auth";
import { logger } from "../../../../utils/logger";
import { fetchStockMovements } from "../../../shared/api";
import { formatDateTimeBR } from "../../../shared/format";
import type { InventoryUnit, StockMovementRow, StockMovementType } from "../types";

/**
 * Admin V2 (PLAN-0026, Onda 11) — histórico de movimentação de estoque por unidade, reusa
 * `GET /api/units/:unitId/products/:id/movements` sem alteração.
 */

const MOVEMENT_TYPE_LABEL: Record<StockMovementType, string> = {
  ENTRADA_COMPRA: "Entrada",
  SAIDA_VENDA: "Venda",
  USO_SALAO: "Uso salão",
  PERDA: "Perda",
  AJUSTE: "Ajuste",
  DEVOLUCAO: "Devolução",
};

const INBOUND_TYPES = new Set<StockMovementType>(["ENTRADA_COMPRA", "DEVOLUCAO"]);

// Espelha o `take: 100` de `GET /units/:unitId/products/:id/movements` — acima
// desse tamanho a lista pode estar truncada, então a linha mais antiga exibida
// não é necessariamente o primeiro movimento real (ver nota abaixo).
const HISTORY_PAGE_SIZE = 100;

/**
 * Validação de consistência do ledger (PLAN-0032, ocorrência #1 — pedido do
 * usuário): a API já devolve mais nova → mais antiga (`orderBy: createdAt desc`)
 * sem uma coluna "saldo anterior", o que é fácil de ler como se o saldo não
 * batesse. Aqui derivamos o saldo anterior de cada linha a partir do
 * `balanceAfter` da linha seguinte (mais antiga) na mesma lista — sem precisar
 * de nenhum campo novo do backend — e sinalizamos visualmente qualquer
 * movimento cujo saldo anterior + variação não bata com o saldo gravado.
 */
type MovementRowView = {
  movement: StockMovementRow;
  previousBalance: number | null; // null = desconhecido (linha mais antiga da página, histórico pode estar truncado)
  inconsistent: boolean;
};

function buildMovementRows(movements: StockMovementRow[]): MovementRowView[] {
  return movements.map((movement, index) => {
    const older = movements[index + 1];
    const isOldestInPage = index === movements.length - 1;
    const previousBalance = older
      ? older.balanceAfter
      : isOldestInPage && movements.length < HISTORY_PAGE_SIZE
        ? 0 // primeiro movimento real do produto na unidade — saldo antes dele é sempre 0
        : null; // página cheia (100): pode haver movimentos mais antigos não carregados

    let inconsistent = false;
    if (previousBalance !== null) {
      if (movement.type === "AJUSTE") {
        // AJUSTE define o saldo alvo diretamente; o invariante aqui é a magnitude
        // gravada em `quantity` bater com a diferença real entre os saldos.
        inconsistent = Math.abs(movement.balanceAfter - previousBalance) !== movement.quantity;
      } else {
        const signedDelta = INBOUND_TYPES.has(movement.type) ? movement.quantity : -movement.quantity;
        inconsistent = previousBalance + signedDelta !== movement.balanceAfter;
      }
    }
    return { movement, previousBalance, inconsistent };
  });
}

export function StockHistoryModal({
  productId,
  productName,
  units,
  onClose,
}: {
  productId: number;
  productName: string;
  units: InventoryUnit[];
  onClose: () => void;
}) {
  const [unitId, setUnitId] = useState("");
  const [movements, setMovements] = useState<StockMovementRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token || !unitId) {
      setMovements(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStockMovements({ token, unitId: Number(unitId), productId });
      setMovements(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao carregar histórico.";
      logger.warn("Falha ao carregar histórico de estoque (Admin V2)", { error: message, productId, unitId });
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [unitId, productId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
      <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl dark:bg-forest">
        <div className="flex items-start justify-between gap-3 border-b border-[#cfe7d1] px-5 py-4 dark:border-forest-green">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">Histórico de movimentação</p>
            <h3 className="text-lg font-bold text-forest">{productName}</h3>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              className="rounded-lg border border-primary/60 bg-white px-3 py-1.5 text-xs text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
            >
              <option value="">Unidade</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.isOnline ? `${unit.name} (online)` : unit.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/40 text-forest hover:bg-primary/5"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        </div>
        <div className="overflow-y-auto px-5 py-4">
          {!unitId && <p className="text-sm text-stone-500 dark:text-stone-400">Selecione uma unidade.</p>}
          {unitId && loading && <p className="text-sm text-stone-600 dark:text-stone-400">Carregando…</p>}
          {unitId && error && <p className="text-sm font-semibold text-state-critical">{error}</p>}
          {unitId && !loading && !error && movements && movements.length === 0 && (
            <p className="text-sm text-stone-500 dark:text-stone-400">Sem movimentos nesta unidade.</p>
          )}
          {unitId && !loading && !error && movements && movements.length > 0 && (
            <>
              <p className="mb-2 text-[11px] text-stone-500 dark:text-stone-400">
                Mais recente no topo. Leia de baixo para cima: saldo anterior + movimentação = saldo.
                {movements.length >= HISTORY_PAGE_SIZE && " Mostrando os 100 mais recentes — pode haver movimentos mais antigos não listados."}
              </p>
              <table className="w-full min-w-[640px] text-left text-xs">
                <thead>
                  <tr className="border-b border-[#cfe7d1] text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:border-forest-green dark:text-stone-400">
                    <th className="px-3 py-2">Quando</th>
                    <th className="px-3 py-2">Tipo</th>
                    <th className="px-3 py-2 text-right">Saldo anterior</th>
                    <th className="px-3 py-2 text-right">Qtd</th>
                    <th className="px-3 py-2 text-right">Saldo</th>
                    <th className="px-3 py-2">Razão</th>
                    <th className="px-3 py-2">Por</th>
                  </tr>
                </thead>
                <tbody>
                  {buildMovementRows(movements).map(({ movement, previousBalance, inconsistent }) => {
                    const sign = movement.type === "AJUSTE" ? "±" : INBOUND_TYPES.has(movement.type) ? "+" : "−";
                    return (
                      <tr
                        key={movement.id}
                        className={`border-b border-stone-100 last:border-0 dark:border-forest-green/40 ${
                          inconsistent ? "bg-state-critical/10" : ""
                        }`}
                      >
                        <td className="whitespace-nowrap px-3 py-2 text-forest">{formatDateTimeBR(movement.createdAt)}</td>
                        <td className="px-3 py-2 text-forest">{MOVEMENT_TYPE_LABEL[movement.type] ?? movement.type}</td>
                        <td className="px-3 py-2 text-right text-stone-500 dark:text-stone-400">
                          {previousBalance === null ? "—" : previousBalance}
                        </td>
                        <td className="px-3 py-2 text-right text-forest">
                          {sign}
                          {movement.quantity}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-forest">
                          {movement.balanceAfter}
                          {inconsistent && (
                            <span
                              className="material-symbols-outlined ml-1 align-middle text-sm text-state-critical"
                              title="Inconsistente: saldo anterior + movimentação não bate com este saldo"
                            >
                              warning
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-forest">{movement.reason || "—"}</td>
                        <td className="px-3 py-2 text-forest">{movement.createdBy?.name ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
