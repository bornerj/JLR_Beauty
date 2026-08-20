import { useState } from "react";
import type { DiscountCoupon, DiscountCouponInput, DiscountType } from "../types";

/**
 * Admin V2 (PLAN-0026, Onda 4) — modal de criar/editar cupom de desconto. Campos e regras
 * de validação espelham o form legado (`admin-discount-coupons/AdminDiscountCouponsView.tsx`)
 * e o backend (`discountCouponSchema`/`validateDiscountCouponRules`): percentual e valor
 * fixo são mutuamente exclusivos por `discountType`, fim de validade >= início.
 */

type FormState = {
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

const emptyForm = (): FormState => ({
  code: "",
  name: "",
  discountType: "PERCENT",
  percentOff: "",
  amountOff: "",
  minSubtotal: "",
  startsAt: "",
  endsAt: "",
  isActive: true,
});

const toInputDateTimeValue = (value: string | null | undefined): string => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const pad = (input: number): string => String(input).padStart(2, "0");
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
};

const fromCoupon = (coupon: DiscountCoupon): FormState => ({
  code: coupon.code,
  name: coupon.name,
  discountType: coupon.discountType,
  percentOff: coupon.percentOff ?? "",
  amountOff: coupon.amountOff ?? "",
  minSubtotal: coupon.minSubtotal ?? "",
  startsAt: toInputDateTimeValue(coupon.startsAt),
  endsAt: toInputDateTimeValue(coupon.endsAt),
  isActive: coupon.isActive,
});

export function CouponFormModal({
  editing,
  submitting,
  error,
  onCancel,
  onSubmit,
}: {
  /** `null` = criando um cupom novo; um `DiscountCoupon` = editando esse cupom. */
  editing: DiscountCoupon | null;
  submitting: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (input: DiscountCouponInput) => void;
}) {
  const [form, setForm] = useState<FormState>(editing ? fromCoupon(editing) : emptyForm());
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = () => {
    const code = form.code.trim().toUpperCase();
    const name = form.name.trim();
    if (!code || !name) {
      setLocalError("Informe código e nome do cupom.");
      return;
    }

    const percentOff = form.percentOff.trim() ? Number(form.percentOff) : null;
    const amountOff = form.amountOff.trim() ? Number(form.amountOff) : null;
    const minSubtotal = form.minSubtotal.trim() ? Number(form.minSubtotal) : null;

    if (form.discountType === "PERCENT" && (!Number.isFinite(percentOff) || (percentOff as number) <= 0)) {
      setLocalError("Informe um percentual de desconto válido (maior que zero).");
      return;
    }
    if (form.discountType === "FIXED" && (!Number.isFinite(amountOff) || (amountOff as number) <= 0)) {
      setLocalError("Informe um valor fixo de desconto válido (maior que zero).");
      return;
    }
    if (minSubtotal !== null && (!Number.isFinite(minSubtotal) || minSubtotal < 0)) {
      setLocalError("Informe um subtotal mínimo válido.");
      return;
    }

    const startsAtIso = form.startsAt ? new Date(form.startsAt).toISOString() : null;
    const endsAtIso = form.endsAt ? new Date(form.endsAt).toISOString() : null;
    if (startsAtIso && endsAtIso && new Date(endsAtIso) < new Date(startsAtIso)) {
      setLocalError("Fim de validade deve ser maior ou igual ao início.");
      return;
    }

    // Schema de criação (`discountCouponSchema`) só aceita `number | undefined` em
    // percentOff/amountOff/minSubtotal, nunca `null` explícito — só o de atualização
    // (`discountCouponUpdateSchema`) aceita `null` (pra permitir *limpar* um campo já
    // setado). Por isso o campo não usado (tipo de desconto oposto, ou mínimo vazio) some
    // da entrada (`undefined`, chave omitida no JSON) ao criar, mas vira `null` explícito ao
    // editar — mesma distinção do form legado.
    const isEditing = Boolean(editing);
    const clearValue = isEditing ? null : undefined;

    setLocalError(null);
    onSubmit({
      code,
      name,
      discountType: form.discountType,
      percentOff: form.discountType === "PERCENT" ? percentOff : clearValue,
      amountOff: form.discountType === "FIXED" ? amountOff : clearValue,
      minSubtotal: minSubtotal !== null ? minSubtotal : clearValue,
      startsAt: startsAtIso,
      endsAt: endsAtIso,
      isActive: form.isActive,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-2xl dark:bg-forest">
        <h3 className="text-xl font-bold text-forest">{editing ? "Editar cupom" : "Novo cupom"}</h3>
        <div className="mt-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Código</label>
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="VIP30"
                className="rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Nome</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Cupom VIP"
                className="rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Tipo</label>
              <select
                value={form.discountType}
                onChange={(e) => setForm({ ...form, discountType: e.target.value as DiscountType })}
                className="rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
              >
                <option value="PERCENT">Percentual</option>
                <option value="FIXED">Valor fixo</option>
              </select>
            </div>
            {form.discountType === "PERCENT" ? (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                  Percentual (%)
                </label>
                <input
                  type="number"
                  min={0.01}
                  step="0.01"
                  value={form.percentOff}
                  onChange={(e) => setForm({ ...form, percentOff: e.target.value })}
                  placeholder="10"
                  className="rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
                />
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                  Valor (R$)
                </label>
                <input
                  type="number"
                  min={0.01}
                  step="0.01"
                  value={form.amountOff}
                  onChange={(e) => setForm({ ...form, amountOff: e.target.value })}
                  placeholder="30"
                  className="rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
                />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
              Subtotal mínimo (R$)
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.minSubtotal}
              onChange={(e) => setForm({ ...form, minSubtotal: e.target.value })}
              placeholder="150"
              className="rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                Início validade
              </label>
              <input
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                className="rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                Fim validade
              </label>
              <input
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                className="rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest dark:bg-forest-green">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="accent-primary"
            />
            Cupom ativo
          </label>
        </div>
        {(localError || error) && <p className="mt-3 text-xs font-semibold text-state-critical">{localError || error}</p>}
        <div className="mt-5 flex justify-end gap-2">
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
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Salvando…" : editing ? "Atualizar cupom" : "Salvar cupom"}
          </button>
        </div>
      </div>
    </div>
  );
}
