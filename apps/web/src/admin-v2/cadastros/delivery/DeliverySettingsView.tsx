import { useCallback, useEffect, useState } from "react";
import { getToken } from "../../../lib/auth";
import { logger } from "../../../utils/logger";
import { fetchSetting, updateSetting } from "../../shared/api";
import { formatCurrencyBRL } from "../../shared/format";

/**
 * Admin V2 (PLAN-0026, Onda 2) — Entrega no Checkout, tier P (config-form, não list-CRUD).
 * Reusa `/api/settings/:key` sem alteração (`DECISION-014` regra #2), mesmas 2 chaves e
 * defaults do legado (`admin-checkout-delivery/components/AdminCheckoutDeliveryView.tsx`):
 * `checkout.localDeliveryFee` (padrão R$ 10) e `checkout.freeShippingThreshold` (padrão R$ 150).
 */

const LOCAL_DELIVERY_FEE_KEY = "checkout.localDeliveryFee";
const FREE_SHIPPING_THRESHOLD_KEY = "checkout.freeShippingThreshold";
const DEFAULT_LOCAL_DELIVERY_FEE = 10;
const DEFAULT_FREE_SHIPPING_THRESHOLD = 150;

const parseNumericSettingValue = (value: unknown, fallback: number): number => {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, value);
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
  }
  return fallback;
};

type LoadState = { loading: boolean; error: string | null; lastUpdatedAt: string | null };

export function DeliverySettingsView() {
  const [fee, setFee] = useState(DEFAULT_LOCAL_DELIVERY_FEE);
  const [threshold, setThreshold] = useState(DEFAULT_FREE_SHIPPING_THRESHOLD);
  const [state, setState] = useState<LoadState>({ loading: true, error: null, lastUpdatedAt: null });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setState({ loading: false, error: "Sessão expirada. Faça login novamente.", lastUpdatedAt: null });
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const [feeSetting, thresholdSetting] = await Promise.all([
        fetchSetting({ token, key: LOCAL_DELIVERY_FEE_KEY }),
        fetchSetting({ token, key: FREE_SHIPPING_THRESHOLD_KEY }),
      ]);
      setFee(parseNumericSettingValue(feeSetting?.value, DEFAULT_LOCAL_DELIVERY_FEE));
      setThreshold(parseNumericSettingValue(thresholdSetting?.value, DEFAULT_FREE_SHIPPING_THRESHOLD));
      const updatedAt = thresholdSetting?.updatedAt || feeSetting?.updatedAt || null;
      setState({ loading: false, error: null, lastUpdatedAt: updatedAt ? new Date(updatedAt).toLocaleString("pt-BR") : null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar configurações de entrega.";
      logger.warn("Falha ao carregar configurações de entrega (Admin V2)", { error: message });
      setState({ loading: false, error: message, lastUpdatedAt: null });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setState((prev) => ({ ...prev, error: "Sessão expirada. Faça login novamente." }));
      return;
    }
    setSaving(true);
    setSuccess(null);
    setState((prev) => ({ ...prev, error: null }));
    try {
      const [, thresholdSetting] = await Promise.all([
        updateSetting({ token, key: LOCAL_DELIVERY_FEE_KEY, value: fee }),
        updateSetting({ token, key: FREE_SHIPPING_THRESHOLD_KEY, value: threshold }),
      ]);
      setState((prev) => ({
        ...prev,
        lastUpdatedAt: thresholdSetting.updatedAt ? new Date(thresholdSetting.updatedAt).toLocaleString("pt-BR") : new Date().toLocaleString("pt-BR"),
      }));
      setSuccess("Política de entrega salva com sucesso.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao salvar configurações de entrega.";
      logger.warn("Falha ao salvar configurações de entrega (Admin V2)", { error: message });
      setState((prev) => ({ ...prev, error: message }));
    } finally {
      setSaving(false);
    }
  }, [fee, threshold]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-forest">Entrega no Checkout</h1>
          <p className="text-base text-stone-600 dark:text-stone-400">
            defina taxa fixa da entrega local e limite de frete grátis
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={state.loading || saving}
          className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Salvando…" : "Salvar política"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-2 rounded-xl border border-[#cfe7d1] bg-white p-5 dark:border-forest-green dark:bg-forest">
          <label htmlFor="local-delivery-fee" className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
            Taxa de entrega local (R$)
          </label>
          <input
            id="local-delivery-fee"
            type="number"
            min={0}
            step="0.01"
            value={fee}
            onChange={(e) => setFee(Number(e.target.value))}
            className="rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary dark:bg-forest-green"
          />
          <p className="text-xs text-stone-500 dark:text-stone-400">Usado quando a modalidade escolhida for Entrega local.</p>
        </div>
        <div className="flex flex-col gap-2 rounded-xl border border-[#cfe7d1] bg-white p-5 dark:border-forest-green dark:bg-forest">
          <label htmlFor="free-shipping-threshold" className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
            Limite de frete grátis local (R$)
          </label>
          <input
            id="free-shipping-threshold"
            type="number"
            min={0}
            step="1"
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary dark:bg-forest-green"
          />
          <p className="text-xs text-stone-500 dark:text-stone-400">Compras iguais ou acima desse valor: entrega local grátis.</p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 rounded-xl border border-[#cfe7d1] bg-white p-5 dark:border-forest-green dark:bg-forest">
        <p className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Resumo aplicado no checkout</p>
        <p className="text-sm text-forest">
          Retirada no salão: <strong>grátis</strong>.
        </p>
        <p className="text-sm text-forest">
          Entrega local: <strong>{formatCurrencyBRL(fee)}</strong>.
        </p>
        <p className="text-sm text-forest">
          Frete grátis local acima de: <strong>{formatCurrencyBRL(threshold)}</strong>.
        </p>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          {state.lastUpdatedAt ? `Última atualização: ${state.lastUpdatedAt}` : "Sem atualização registrada nesta sessão."}
        </p>
      </div>

      {state.loading && <p className="text-sm text-stone-600 dark:text-stone-400">Carregando política de entrega…</p>}
      {state.error && <p className="text-sm font-semibold text-state-critical">{state.error}</p>}
      {success && <p className="text-sm font-semibold text-state-healthy">{success}</p>}
    </div>
  );
}
