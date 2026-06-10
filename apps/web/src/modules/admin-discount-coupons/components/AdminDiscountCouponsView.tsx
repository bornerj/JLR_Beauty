import { useCallback, useEffect, useMemo, useState, type ReactElement } from "react";
import { getToken } from "../../../lib/auth";
import { logger } from "../../../utils/logger";

type DiscountType = "PERCENT" | "FIXED";

type DiscountCouponRow = {
  id: number;
  code: string;
  name: string;
  discountType: DiscountType;
  percentOff?: number | string | null;
  amountOff?: number | string | null;
  minSubtotal?: number | string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type CouponValidationResponse = {
  message?: string;
  detail?: string;
};

type CouponFormState = {
  id: number | null;
  code: string;
  name: string;
  discountType: DiscountType;
  percentOff: string;
  amountOff: string;
  minSubtotal: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
};

const API_URL = import.meta.env.VITE_API_URL || "";

const parseNumber = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toInputDateTimeValue = (value: string | null | undefined): string => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const pad = (input: number): string => String(input).padStart(2, "0");
  const year = parsed.getFullYear();
  const month = pad(parsed.getMonth() + 1);
  const day = pad(parsed.getDate());
  const hour = pad(parsed.getHours());
  const minute = pad(parsed.getMinutes());
  return `${year}-${month}-${day}T${hour}:${minute}`;
};

const emptyForm: CouponFormState = {
  id: null,
  code: "",
  name: "",
  discountType: "PERCENT",
  percentOff: "",
  amountOff: "",
  minSubtotal: "",
  startsAt: "",
  endsAt: "",
  isActive: true,
};

const parseApiError = async (response: Response): Promise<string> => {
  const payload = (await response.json().catch(() => ({}))) as CouponValidationResponse;
  return payload.detail || payload.message || "Falha ao processar requisicao.";
};

export const AdminDiscountCouponsView = (): ReactElement => {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [items, setItems] = useState<DiscountCouponRow[]>([]);
  const [form, setForm] = useState<CouponFormState>(emptyForm);

  const token = useMemo(() => getToken(), []);

  const request = useCallback(
    async <T,>(path: string, options?: RequestInit): Promise<T> => {
      if (!token) throw new Error("Sessão expirada. Faça login novamente.");
      const response = await fetch(`${API_URL}/api${path}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          ...(options?.headers || {}),
        },
      });
      if (!response.ok) {
        throw new Error(await parseApiError(response));
      }
      if (response.status === 204) return undefined as T;
      return (await response.json()) as T;
    },
    [token]
  );

  const fetchCoupons = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError("");
    try {
      const response = await request<DiscountCouponRow[]>("/discount-coupons", { method: "GET" });
      setItems(response);
    } catch (fetchError) {
      logger.error("Falha ao carregar cupons de desconto no admin", { error: fetchError });
      setError(fetchError instanceof Error ? fetchError.message : "Falha ao carregar cupons.");
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    fetchCoupons().catch(() => undefined);
  }, [fetchCoupons]);

  const resetForm = (): void => {
    setForm(emptyForm);
    setError("");
    setSuccess("");
  };

  const onEdit = (row: DiscountCouponRow): void => {
    const percentOff = parseNumber(row.percentOff);
    const amountOff = parseNumber(row.amountOff);
    const minSubtotal = parseNumber(row.minSubtotal);
    setForm({
      id: row.id,
      code: row.code || "",
      name: row.name || "",
      discountType: row.discountType,
      percentOff: percentOff !== null ? String(percentOff) : "",
      amountOff: amountOff !== null ? String(amountOff) : "",
      minSubtotal: minSubtotal !== null ? String(minSubtotal) : "",
      startsAt: toInputDateTimeValue(row.startsAt),
      endsAt: toInputDateTimeValue(row.endsAt),
      isActive: Boolean(row.isActive),
    });
    setError("");
    setSuccess(`Cupom #${row.id} carregado para edicao.`);
  };

  const onDelete = async (id: number): Promise<void> => {
    setDeletingId(id);
    setError("");
    setSuccess("");
    try {
      await request<void>(`/discount-coupons/${id}`, { method: "DELETE" });
      await fetchCoupons();
      if (form.id === id) {
        setForm(emptyForm);
      }
      setSuccess("Cupom removido com sucesso.");
    } catch (deleteError) {
      logger.error("Falha ao remover cupom de desconto", { error: deleteError, id });
      setError(deleteError instanceof Error ? deleteError.message : "Falha ao remover cupom.");
    } finally {
      setDeletingId(null);
    }
  };

  const onSubmit = async (): Promise<void> => {
    const normalizedCode = form.code.trim().toUpperCase();
    const normalizedName = form.name.trim();
    if (!normalizedCode) {
      setError("Informe o codigo do cupom.");
      return;
    }
    if (!normalizedName) {
      setError("Informe o nome do cupom.");
      return;
    }

    const percentOff = form.percentOff.trim() ? Number(form.percentOff) : null;
    const amountOff = form.amountOff.trim() ? Number(form.amountOff) : null;
    const minSubtotal = form.minSubtotal.trim() ? Number(form.minSubtotal) : null;
    if (form.discountType === "PERCENT") {
      if (!Number.isFinite(percentOff) || (percentOff as number) <= 0) {
        setError("Informe um percentual de desconto valido.");
        return;
      }
    }
    if (form.discountType === "FIXED") {
      if (!Number.isFinite(amountOff) || (amountOff as number) <= 0) {
        setError("Informe um valor fixo de desconto valido.");
        return;
      }
    }
    if (minSubtotal !== null && (!Number.isFinite(minSubtotal) || minSubtotal < 0)) {
      setError("Informe um subtotal minimo valido.");
      return;
    }

    const startsAtIso = form.startsAt ? new Date(form.startsAt).toISOString() : null;
    const endsAtIso = form.endsAt ? new Date(form.endsAt).toISOString() : null;
    if (startsAtIso && endsAtIso && new Date(endsAtIso) < new Date(startsAtIso)) {
      setError("Fim de validade deve ser maior ou igual ao inicio.");
      return;
    }

    const isUpdate = Boolean(form.id);
    const payload: Record<string, unknown> = {
      code: normalizedCode,
      name: normalizedName,
      discountType: form.discountType,
      isActive: form.isActive,
      startsAt: startsAtIso,
      endsAt: endsAtIso,
    };
    if (form.discountType === "PERCENT") {
      payload.percentOff = percentOff;
      payload.amountOff = isUpdate ? null : undefined;
    } else {
      payload.amountOff = amountOff;
      payload.percentOff = isUpdate ? null : undefined;
    }
    if (isUpdate) {
      payload.minSubtotal = minSubtotal;
    } else if (minSubtotal !== null) {
      payload.minSubtotal = minSubtotal;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      if (form.id) {
        await request<DiscountCouponRow>(`/discount-coupons/${form.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await request<DiscountCouponRow>("/discount-coupons", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      await fetchCoupons();
      setForm(emptyForm);
      setSuccess(form.id ? "Cupom atualizado com sucesso." : "Cupom criado com sucesso.");
    } catch (saveError) {
      logger.error("Falha ao salvar cupom de desconto", { error: saveError });
      setError(saveError instanceof Error ? saveError.message : "Falha ao salvar cupom.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto p-8 flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-forest dark:text-white text-3xl display-hero text-shadow-strong italic">
            Cupons de Desconto
          </h2>
          <p className="text-stone-500 text-lg font-normal">
            Cadastre cupons com validade, tipo de desconto e regra de subtotal minimo.
          </p>
        </div>
      </header>

      <section className="bg-white rounded-xl border border-[#cfe7d1] shadow-sm p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs uppercase tracking-wider text-text-muted font-semibold">Codigo</label>
          <input
            className="w-full border border-[#cfe7d1] rounded-lg px-4 py-2.5 bg-[#f6f8f6] text-forest-green"
            value={form.code}
            onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
            placeholder="VIP30"
            type="text"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs uppercase tracking-wider text-text-muted font-semibold">Nome</label>
          <input
            className="w-full border border-[#cfe7d1] rounded-lg px-4 py-2.5 bg-[#f6f8f6] text-forest-green"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Cupom VIP"
            type="text"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs uppercase tracking-wider text-text-muted font-semibold">Tipo</label>
          <select
            className="w-full border border-[#cfe7d1] rounded-lg px-4 py-2.5 bg-[#f6f8f6] text-forest-green"
            value={form.discountType}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                discountType: event.target.value as DiscountType,
              }))
            }
          >
            <option value="PERCENT">Percentual</option>
            <option value="FIXED">Valor fixo</option>
          </select>
        </div>

        {form.discountType === "PERCENT" ? (
          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase tracking-wider text-text-muted font-semibold">
              Percentual (%)
            </label>
            <input
              className="w-full border border-[#cfe7d1] rounded-lg px-4 py-2.5 bg-[#f6f8f6] text-forest-green"
              value={form.percentOff}
              onChange={(event) =>
                setForm((current) => ({ ...current, percentOff: event.target.value }))
              }
              placeholder="10"
              min="0.01"
              step="0.01"
              type="number"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase tracking-wider text-text-muted font-semibold">
              Valor (R$)
            </label>
            <input
              className="w-full border border-[#cfe7d1] rounded-lg px-4 py-2.5 bg-[#f6f8f6] text-forest-green"
              value={form.amountOff}
              onChange={(event) =>
                setForm((current) => ({ ...current, amountOff: event.target.value }))
              }
              placeholder="30"
              min="0.01"
              step="0.01"
              type="number"
            />
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-xs uppercase tracking-wider text-text-muted font-semibold">
            Subtotal minimo (R$)
          </label>
          <input
            className="w-full border border-[#cfe7d1] rounded-lg px-4 py-2.5 bg-[#f6f8f6] text-forest-green"
            value={form.minSubtotal}
            onChange={(event) => setForm((current) => ({ ...current, minSubtotal: event.target.value }))}
            placeholder="150"
            min="0"
            step="0.01"
            type="number"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs uppercase tracking-wider text-text-muted font-semibold">
            Inicio validade
          </label>
          <input
            className="w-full border border-[#cfe7d1] rounded-lg px-4 py-2.5 bg-[#f6f8f6] text-forest-green"
            value={form.startsAt}
            onChange={(event) => setForm((current) => ({ ...current, startsAt: event.target.value }))}
            type="datetime-local"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs uppercase tracking-wider text-text-muted font-semibold">
            Fim validade
          </label>
          <input
            className="w-full border border-[#cfe7d1] rounded-lg px-4 py-2.5 bg-[#f6f8f6] text-forest-green"
            value={form.endsAt}
            onChange={(event) => setForm((current) => ({ ...current, endsAt: event.target.value }))}
            type="datetime-local"
          />
        </div>

        <div className="flex items-center gap-3 border border-[#cfe7d1] rounded-lg px-4 py-2.5 bg-[#f6f8f6]">
          <input
            checked={form.isActive}
            className="accent-primary"
            onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
            type="checkbox"
          />
          <span className="text-sm text-forest-green font-medium">Cupom ativo</span>
        </div>

        <div className="xl:col-span-4 flex flex-wrap gap-3">
          <button
            className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20 disabled:opacity-60"
            disabled={saving}
            onClick={() => onSubmit()}
            type="button"
          >
            {saving ? "Salvando..." : form.id ? "Atualizar cupom" : "Salvar cupom"}
          </button>
          <button
            className="px-5 py-2.5 rounded-xl bg-white border border-[#cfe7d1] text-forest-green font-bold hover:bg-[#f6f8f6] transition-colors"
            onClick={() => resetForm()}
            type="button"
          >
            Limpar
          </button>
        </div>
      </section>

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

      <section className="bg-white rounded-xl border border-[#cfe7d1] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#cfe7d1] bg-primary text-xs text-white font-semibold uppercase tracking-wider">
          {loading ? "Carregando cupons..." : `Mostrando ${items.length} cupons`}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#cfe7d1]">
            <thead className="bg-[#f6f8f6]">
              <tr>
                <th className="table-head-cell text-left text-text-muted">Codigo</th>
                <th className="table-head-cell text-left text-text-muted">Nome</th>
                <th className="table-head-cell text-left text-text-muted">Tipo</th>
                <th className="table-head-cell text-left text-text-muted">Desconto</th>
                <th className="table-head-cell text-left text-text-muted">Minimo</th>
                <th className="table-head-cell text-left text-text-muted">Validade</th>
                <th className="table-head-cell text-left text-text-muted">Status</th>
                <th className="table-head-cell text-right text-text-muted">Acoes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#f4f0e7]">
              {!loading && items.length === 0 ? (
                <tr>
                  <td className="table-cell text-sm text-text-muted" colSpan={8}>
                    Nenhum cupom cadastrado.
                  </td>
                </tr>
              ) : null}

              {items.map((row) => {
                const percentOff = parseNumber(row.percentOff);
                const amountOff = parseNumber(row.amountOff);
                const minSubtotal = parseNumber(row.minSubtotal);
                const discountLabel =
                  row.discountType === "PERCENT"
                    ? `${percentOff?.toFixed(2) || "0.00"}%`
                    : `R$ ${(amountOff || 0).toFixed(2)}`;
                const validityStart = row.startsAt
                  ? new Date(row.startsAt).toLocaleDateString("pt-BR")
                  : "-";
                const validityEnd = row.endsAt
                  ? new Date(row.endsAt).toLocaleDateString("pt-BR")
                  : "-";

                return (
                  <tr key={row.id} className="hover:bg-[#f6f8f6] transition-colors">
                    <td className="table-cell text-xs font-semibold text-forest-green">{row.code}</td>
                    <td className="table-cell text-sm text-gray-900">{row.name}</td>
                    <td className="table-cell text-xs text-gray-900">
                      {row.discountType === "PERCENT" ? "Percentual" : "Valor fixo"}
                    </td>
                    <td className="table-cell text-xs text-gray-900">{discountLabel}</td>
                    <td className="table-cell text-xs text-gray-900">
                      {minSubtotal !== null ? `R$ ${minSubtotal.toFixed(2)}` : "-"}
                    </td>
                    <td className="table-cell text-xs text-gray-900">
                      {validityStart} ate {validityEnd}
                    </td>
                    <td className="table-cell text-xs">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          row.isActive
                            ? "bg-green-100 text-green-800 border border-green-200"
                            : "bg-stone-100 text-stone-700 border border-stone-200"
                        }`}
                      >
                        {row.isActive ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="table-cell text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          className="p-2 rounded-lg text-forest-green hover:bg-[#f6f8f6]"
                          onClick={() => onEdit(row)}
                          title="Editar"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-50"
                          disabled={deletingId === row.id}
                          onClick={() => onDelete(row.id)}
                          title="Excluir"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
