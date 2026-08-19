import { useEffect, useMemo, useState } from "react";
import { getToken } from "../../../../lib/auth";
import { logger } from "../../../../utils/logger";
import { fetchCrossUnitStock, fetchInventoryUnits, fetchProducts, fetchServices } from "../../../shared/api";
import { formatCurrencyBRL } from "../../../shared/format";
import type { Product } from "../../../cadastros/products/types";
import type { Service } from "../../../cadastros/services/types";
import type { InventoryUnit } from "../../../cadastros/products/types";

/**
 * Admin V2 (PLAN-0031) — venda manual/balcão (migração de `loadManualSaleData`/
 * `manualSaleSave`, `admin-orders/behavior.ts:1010-1258`). Catálogo unificado
 * produto+serviço (mesmo escopo do legado — não inclui plano/assinatura, que o legado também
 * não oferecia aqui). Unidade obrigatória só quando a venda tem item de produto físico;
 * disponibilidade cross-unit checada por produto selecionado (serviço não tem estoque).
 */

type CatalogItem = { kind: "PRODUCT" | "SERVICE"; id: number; name: string; price: number };
type SaleLine = { key: string; kind: "PRODUCT" | "SERVICE"; id: number; name: string; unitPrice: number; quantity: number };

export type ManualSalePayload = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  unitId?: number;
  markAsPaid: boolean;
  items: Array<{ productId?: number; serviceId?: number; quantity: number }>;
};

export function ManualSaleModal({
  submitting,
  error,
  onCancel,
  onConfirm,
}: {
  submitting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: (payload: ManualSalePayload) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [units, setUnits] = useState<InventoryUnit[]>([]);

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [unitId, setUnitId] = useState<number | "">("");
  const [markAsPaid, setMarkAsPaid] = useState(true);
  const [lines, setLines] = useState<SaleLine[]>([]);
  const [selectedItemKey, setSelectedItemKey] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [availability, setAvailability] = useState<{ loading: boolean; total: number | null }>({ loading: false, total: null });

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoadError("Sessão expirada. Faça login novamente.");
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const [productList, serviceList, unitList] = await Promise.all([
          fetchProducts({ token }),
          fetchServices({ token }),
          fetchInventoryUnits({ token }),
        ]);
        setProducts(productList);
        setServices(serviceList);
        const physicalUnits = unitList.filter((unit) => !unit.isOnline);
        setUnits(physicalUnits);
        if (physicalUnits.length === 1) setUnitId(physicalUnits[0].id);
        setLoading(false);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Falha ao carregar catálogo.";
        logger.warn("Falha ao carregar catálogo pra venda manual (Admin V2)", { error: message });
        setLoadError(message);
        setLoading(false);
      }
    })();
  }, []);

  const catalog = useMemo<CatalogItem[]>(() => {
    const productItems: CatalogItem[] = products.map((p) => ({ kind: "PRODUCT", id: p.id, name: p.name, price: Number(p.price) }));
    const serviceItems: CatalogItem[] = services.map((s) => ({ kind: "SERVICE", id: s.id, name: s.name, price: Number(s.price) }));
    return [...productItems, ...serviceItems].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [products, services]);

  const selectedCatalogItem = useMemo(
    () => catalog.find((item) => `${item.kind}:${item.id}` === selectedItemKey) ?? null,
    [catalog, selectedItemKey]
  );

  const hasProductLine = lines.some((line) => line.kind === "PRODUCT");
  const total = lines.reduce((acc, line) => acc + line.unitPrice * line.quantity, 0);

  useEffect(() => {
    if (!selectedCatalogItem || selectedCatalogItem.kind !== "PRODUCT" || !unitId) {
      setAvailability({ loading: false, total: null });
      return;
    }
    const token = getToken();
    if (!token) return;
    let cancelled = false;
    setAvailability({ loading: true, total: null });
    fetchCrossUnitStock({ token, productId: selectedCatalogItem.id })
      .then((rows) => {
        if (cancelled) return;
        const row = rows.find((r) => r.unitId === unitId);
        setAvailability({ loading: false, total: row?.available ?? 0 });
      })
      .catch(() => {
        if (!cancelled) setAvailability({ loading: false, total: null });
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCatalogItem, unitId]);

  const addLine = () => {
    if (!selectedCatalogItem || quantity < 1) return;
    setLines((prev) => [
      ...prev,
      {
        key: `${selectedCatalogItem.kind}:${selectedCatalogItem.id}:${Date.now()}`,
        kind: selectedCatalogItem.kind,
        id: selectedCatalogItem.id,
        name: selectedCatalogItem.name,
        unitPrice: selectedCatalogItem.price,
        quantity,
      },
    ]);
    setSelectedItemKey("");
    setQuantity(1);
  };

  const removeLine = (key: string) => setLines((prev) => prev.filter((line) => line.key !== key));

  const canSubmit =
    customerName.trim().length > 0 &&
    customerEmail.trim().length > 0 &&
    customerPhone.trim().length > 0 &&
    lines.length > 0 &&
    (!hasProductLine || unitId !== "");

  const handleConfirm = () => {
    if (!canSubmit) return;
    onConfirm({
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim(),
      unitId: unitId === "" ? undefined : unitId,
      markAsPaid,
      items: lines.map((line) => ({
        ...(line.kind === "PRODUCT" ? { productId: line.id } : { serviceId: line.id }),
        quantity: line.quantity,
      })),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 shadow-2xl dark:bg-forest">
        <h3 className="text-lg font-bold text-forest">Venda manual / balcão</h3>

        {loading ? (
          <p className="mt-4 text-sm text-stone-600 dark:text-stone-400">Carregando catálogo…</p>
        ) : loadError ? (
          <p className="mt-4 text-sm font-semibold text-state-critical">{loadError}</p>
        ) : (
          <>
            <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nome do cliente"
                disabled={submitting}
                className="rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 dark:bg-forest-green"
              />
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="E-mail"
                disabled={submitting}
                className="rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 dark:bg-forest-green"
              />
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Telefone/WhatsApp"
                disabled={submitting}
                className="rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 dark:bg-forest-green"
              />
            </div>

            <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                  Unidade {hasProductLine && <span className="text-state-critical">*</span>}
                </label>
                <select
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value ? Number(e.target.value) : "")}
                  disabled={submitting}
                  className="mt-1 w-full rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 dark:bg-forest-green"
                >
                  <option value="">Selecione…</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Pago?</label>
                <select
                  value={markAsPaid ? "1" : "0"}
                  onChange={(e) => setMarkAsPaid(e.target.value === "1")}
                  disabled={submitting}
                  className="mt-1 w-full rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 dark:bg-forest-green"
                >
                  <option value="1">Sim</option>
                  <option value="0">Não</option>
                </select>
              </div>
            </div>

            <div className="mt-3 rounded-lg border border-stone-100 p-3 dark:border-forest-green/40">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Adicionar item</label>
              <div className="mt-1.5 flex flex-wrap gap-2">
                <select
                  value={selectedItemKey}
                  onChange={(e) => setSelectedItemKey(e.target.value)}
                  disabled={submitting}
                  className="min-w-[200px] flex-1 rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 dark:bg-forest-green"
                >
                  <option value="">Produto ou serviço…</option>
                  {catalog.map((item) => (
                    <option key={`${item.kind}:${item.id}`} value={`${item.kind}:${item.id}`}>
                      {item.name} — {formatCurrencyBRL(item.price)}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                  disabled={submitting}
                  className="w-20 rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 dark:bg-forest-green"
                />
                <button
                  type="button"
                  onClick={addLine}
                  disabled={submitting || !selectedCatalogItem}
                  className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Adicionar
                </button>
              </div>
              {selectedCatalogItem?.kind === "PRODUCT" && unitId !== "" && (
                <p className="mt-1.5 text-xs text-stone-500 dark:text-stone-400">
                  {availability.loading ? "Checando disponibilidade…" : `Disponível na unidade: ${availability.total ?? "—"}`}
                </p>
              )}
            </div>

            {lines.length > 0 && (
              <table className="mt-3 w-full text-left text-sm">
                <tbody>
                  {lines.map((line) => (
                    <tr key={line.key} className="border-t border-stone-100 dark:border-forest-green/40">
                      <td className="py-1.5 text-forest">{line.name}</td>
                      <td className="py-1.5 text-right text-forest">{line.quantity}x</td>
                      <td className="py-1.5 text-right font-semibold text-forest">{formatCurrencyBRL(line.unitPrice * line.quantity)}</td>
                      <td className="py-1.5 text-right">
                        <button type="button" onClick={() => removeLine(line.key)} className="text-state-critical hover:underline" disabled={submitting}>
                          remover
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-stone-200 dark:border-forest-green/40">
                    <td colSpan={2} className="py-1.5 text-right font-bold text-forest">
                      Total
                    </td>
                    <td colSpan={2} className="py-1.5 text-right font-bold text-forest">
                      {formatCurrencyBRL(total)}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </>
        )}

        {error && <p className="mt-3 text-xs font-semibold text-state-critical">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-full border border-stone-200 px-4 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-50 disabled:opacity-50 dark:text-stone-400"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || !canSubmit}
            className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Registrando…" : "Registrar venda"}
          </button>
        </div>
      </div>
    </div>
  );
}
