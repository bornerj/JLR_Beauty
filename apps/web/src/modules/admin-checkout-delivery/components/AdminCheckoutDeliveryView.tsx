import { useCallback, useEffect, useMemo, useState, type ReactElement } from "react";
import { getToken } from "../../../lib/auth";
import { logger } from "../../../utils/logger";

const API_URL = import.meta.env.VITE_API_URL || "";
const LOCAL_DELIVERY_FEE_KEY = "checkout.localDeliveryFee";
const FREE_SHIPPING_THRESHOLD_KEY = "checkout.freeShippingThreshold";
const DEFAULT_LOCAL_DELIVERY_FEE = 10;
const DEFAULT_FREE_SHIPPING_THRESHOLD = 150;

type SettingRow = {
  key: string;
  value?: unknown;
  updatedAt?: string;
};

const normalizeErrorMessage = async (response: Response): Promise<string> => {
  const data = (await response.json().catch(() => ({}))) as {
    message?: string;
    detail?: string;
  };
  const message = data.message || "Falha ao processar requisicao.";
  return data.detail ? `${message} (${data.detail})` : message;
};

const parseNumericSettingValue = (value: unknown, fallback: number): number => {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, value);
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
  }
  if (value && typeof value === "object") {
    const candidate = (value as Record<string, unknown>).value;
    if (typeof candidate === "number" && Number.isFinite(candidate)) return Math.max(0, candidate);
    if (typeof candidate === "string") {
      const parsed = Number(candidate);
      return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
    }
  }
  return fallback;
};

const formatCurrency = (value: number): string =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const AdminCheckoutDeliveryView = (): ReactElement => {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [localDeliveryFeeInput, setLocalDeliveryFeeInput] = useState<string>(
    String(DEFAULT_LOCAL_DELIVERY_FEE)
  );
  const [freeShippingThresholdInput, setFreeShippingThresholdInput] = useState<string>(
    String(DEFAULT_FREE_SHIPPING_THRESHOLD)
  );
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>("");

  const readSettingNumber = useCallback(
    async (key: string, fallback: number, token: string): Promise<{ value: number; updatedAt?: string }> => {
      const response = await fetch(`${API_URL}/api/settings/${key}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 404) {
        return { value: fallback };
      }
      if (!response.ok) {
        throw new Error(await normalizeErrorMessage(response));
      }
      const payload = (await response.json()) as SettingRow;
      return {
        value: parseNumericSettingValue(payload.value, fallback),
        updatedAt: payload.updatedAt,
      };
    },
    []
  );

  const fetchSettings = useCallback(async (): Promise<void> => {
    const token = getToken();
    if (!token) {
      setError("Sessao expirada. Faca login novamente.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const [feeSetting, thresholdSetting] = await Promise.all([
        readSettingNumber(LOCAL_DELIVERY_FEE_KEY, DEFAULT_LOCAL_DELIVERY_FEE, token),
        readSettingNumber(FREE_SHIPPING_THRESHOLD_KEY, DEFAULT_FREE_SHIPPING_THRESHOLD, token),
      ]);
      setLocalDeliveryFeeInput(String(feeSetting.value));
      setFreeShippingThresholdInput(String(thresholdSetting.value));
      setLastUpdatedAt(
        thresholdSetting.updatedAt || feeSetting.updatedAt
          ? new Date(thresholdSetting.updatedAt || feeSetting.updatedAt || "").toLocaleString("pt-BR")
          : ""
      );
    } catch (fetchError) {
      logger.error("Falha ao carregar configuracoes de entrega do checkout", { error: fetchError });
      setError(
        fetchError instanceof Error ? fetchError.message : "Falha ao carregar configuracoes de entrega."
      );
    } finally {
      setLoading(false);
    }
  }, [readSettingNumber]);

  useEffect(() => {
    fetchSettings().catch(() => undefined);
  }, [fetchSettings]);

  const localDeliveryFee = useMemo(() => {
    const parsed = Number(localDeliveryFeeInput);
    if (!Number.isFinite(parsed)) return 0;
    return Math.max(0, parsed);
  }, [localDeliveryFeeInput]);

  const freeShippingThreshold = useMemo(() => {
    const parsed = Number(freeShippingThresholdInput);
    if (!Number.isFinite(parsed)) return 0;
    return Math.max(0, parsed);
  }, [freeShippingThresholdInput]);

  const saveSettings = async (): Promise<void> => {
    const token = getToken();
    if (!token) {
      setError("Sessao expirada. Faca login novamente.");
      return;
    }
    const fee = Number(localDeliveryFeeInput);
    const threshold = Number(freeShippingThresholdInput);
    if (!Number.isFinite(fee) || fee < 0) {
      setError("Taxa de entrega local invalida. Informe um numero maior ou igual a zero.");
      setSuccess("");
      return;
    }
    if (!Number.isFinite(threshold) || threshold < 0) {
      setError("Limite de frete gratis invalido. Informe um numero maior ou igual a zero.");
      setSuccess("");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const [feeResponse, thresholdResponse] = await Promise.all([
        fetch(`${API_URL}/api/settings/${LOCAL_DELIVERY_FEE_KEY}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ value: fee }),
        }),
        fetch(`${API_URL}/api/settings/${FREE_SHIPPING_THRESHOLD_KEY}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ value: threshold }),
        }),
      ]);

      if (!feeResponse.ok) {
        throw new Error(await normalizeErrorMessage(feeResponse));
      }
      if (!thresholdResponse.ok) {
        throw new Error(await normalizeErrorMessage(thresholdResponse));
      }

      const thresholdPayload = (await thresholdResponse.json()) as SettingRow;
      setLocalDeliveryFeeInput(String(Math.max(0, fee)));
      setFreeShippingThresholdInput(String(Math.max(0, threshold)));
      setLastUpdatedAt(
        thresholdPayload.updatedAt
          ? new Date(thresholdPayload.updatedAt).toLocaleString("pt-BR")
          : new Date().toLocaleString("pt-BR")
      );
      setSuccess("Politica de entrega salva com sucesso.");
    } catch (saveError) {
      logger.error("Falha ao salvar configuracoes de entrega do checkout", { error: saveError });
      setError(saveError instanceof Error ? saveError.message : "Falha ao salvar configuracoes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto p-8 flex flex-col gap-6" data-admin-checkout-delivery-view>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-forest dark:text-white text-3xl display-hero text-shadow-strong italic">
            Entrega no Checkout
          </h2>
          <p className="text-stone-500 text-lg font-normal">
            Defina taxa fixa da entrega local e limite de frete gratis para checkout.
          </p>
        </div>
        <button
          className="px-5 py-2 text-sm font-semibold rounded-lg bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors disabled:opacity-60"
          type="button"
          onClick={() => saveSettings()}
          disabled={loading || saving}
        >
          {saving ? "Salvando..." : "Salvar politica"}
        </button>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <article className="bg-white rounded-xl border border-[#cfe7d1] shadow-sm p-5 flex flex-col gap-2">
          <label
            className="text-xs uppercase tracking-widest text-text-muted font-semibold"
            htmlFor="checkout-local-delivery-fee"
          >
            Taxa de entrega local (R$)
          </label>
          <input
            id="checkout-local-delivery-fee"
            className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
            type="number"
            min="0"
            step="0.01"
            value={localDeliveryFeeInput}
            onChange={(event) => setLocalDeliveryFeeInput(event.target.value)}
          />
          <p className="text-xs text-text-muted">Usado quando a modalidade escolhida for Entrega local.</p>
        </article>

        <article className="bg-white rounded-xl border border-[#cfe7d1] shadow-sm p-5 flex flex-col gap-2">
          <label
            className="text-xs uppercase tracking-widest text-text-muted font-semibold"
            htmlFor="checkout-free-shipping-threshold"
          >
            Limite de frete gratis local (R$)
          </label>
          <input
            id="checkout-free-shipping-threshold"
            className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
            type="number"
            min="0"
            step="1"
            value={freeShippingThresholdInput}
            onChange={(event) => setFreeShippingThresholdInput(event.target.value)}
          />
          <p className="text-xs text-text-muted">
            Em compras iguais ou acima desse valor, a entrega local fica gratis.
          </p>
        </article>
      </section>

      <section className="bg-white rounded-xl border border-[#cfe7d1] shadow-sm p-5 flex flex-col gap-2">
        <p className="text-xs uppercase tracking-widest text-text-muted font-semibold">Resumo aplicado no checkout</p>
        <p className="text-sm text-forest-green">
          Retirada no salao: <strong>gratis</strong>.
        </p>
        <p className="text-sm text-forest-green">
          Entrega local: <strong>{formatCurrency(localDeliveryFee)}</strong>.
        </p>
        <p className="text-sm text-forest-green">
          Frete gratis local acima de: <strong>{formatCurrency(freeShippingThreshold)}</strong>.
        </p>
        <p className="text-xs text-text-muted">
          {lastUpdatedAt ? `Ultima atualizacao: ${lastUpdatedAt}` : "Sem atualizacao registrada nesta sessao."}
        </p>
      </section>

      {loading ? (
        <section className="bg-white rounded-xl border border-[#cfe7d1] shadow-sm p-4 text-sm text-text-muted">
          Carregando politica de entrega...
        </section>
      ) : null}

      {error ? (
        <section className="bg-white rounded-xl border border-red-200 shadow-sm p-4 text-sm text-red-700">
          {error}
        </section>
      ) : null}

      {success ? (
        <section className="bg-white rounded-xl border border-green-200 shadow-sm p-4 text-sm text-green-700">
          {success}
        </section>
      ) : null}
    </div>
  );
};

