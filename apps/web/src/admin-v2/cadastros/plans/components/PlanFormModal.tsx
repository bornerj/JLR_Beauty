import { useState } from "react";
import { MEMBERSHIP_STATUS_OPTIONS } from "../types";
import type { Membership, MembershipInput } from "../types";

/**
 * Admin V2 (PLAN-0026, Onda 1) — modal de criar/editar plano. Campos e opções de status
 * espelham exatamente o form legado (`admin-plans/components/AdminPlansView.tsx` +
 * `admin-core/behavior.ts`), só a interação vira React declarativo em vez de
 * `querySelector`/`addEventListener` manual.
 */

const emptyForm = (): MembershipInput => ({
  name: "",
  title: "",
  description: "",
  price: 0,
  benefits: [""],
  isFeatured: false,
  status: "Ativo",
});

const fromMembership = (membership: Membership): MembershipInput => ({
  name: membership.name,
  title: membership.title,
  description: membership.description ?? "",
  price: Number(membership.price),
  benefits: membership.benefits && membership.benefits.length > 0 ? membership.benefits : [""],
  isFeatured: membership.isFeatured,
  status: membership.status,
});

export function PlanFormModal({
  editing,
  submitting,
  error,
  onCancel,
  onSubmit,
}: {
  /** `null` = criando um plano novo; um `Membership` = editando esse plano. */
  editing: Membership | null;
  submitting: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (input: MembershipInput) => void;
}) {
  const [form, setForm] = useState<MembershipInput>(editing ? fromMembership(editing) : emptyForm());

  const setBenefit = (index: number, value: string) => {
    const next = [...(form.benefits ?? [])];
    next[index] = value;
    setForm({ ...form, benefits: next });
  };
  const addBenefit = () => setForm({ ...form, benefits: [...(form.benefits ?? []), ""] });
  const removeBenefit = (index: number) =>
    setForm({ ...form, benefits: (form.benefits ?? []).filter((_, i) => i !== index) });

  const canSubmit = form.name.trim().length > 0 && form.title.trim().length > 0 && form.price >= 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      ...form,
      name: form.name.trim(),
      title: form.title.trim(),
      description: form.description?.trim() || undefined,
      benefits: (form.benefits ?? []).map((b) => b.trim()).filter((b) => b.length > 0),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-2xl dark:bg-forest">
        <h3 className="text-xl font-bold text-forest">{editing ? "Editar plano" : "Novo plano"}</h3>
        <div className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Nome</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex.: Silver"
              className="rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary dark:bg-forest-green"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Título</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex.: Radiance"
              className="rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary dark:bg-forest-green"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                Valor mensal (R$)
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className="rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary dark:bg-forest-green"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary dark:bg-forest-green"
              >
                {MEMBERSHIP_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Descrição</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary dark:bg-forest-green"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
              Benefícios (lista)
            </label>
            {(form.benefits ?? []).map((benefit, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  value={benefit}
                  onChange={(e) => setBenefit(index, e.target.value)}
                  placeholder="Ex.: 10% de desconto em serviços"
                  className="w-full rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary dark:bg-forest-green"
                />
                <button
                  type="button"
                  onClick={() => removeBenefit(index)}
                  title="Remover benefício"
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50"
                >
                  <span className="material-symbols-outlined text-[18px]">remove</span>
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addBenefit}
              className="flex items-center justify-center gap-2 rounded-lg border border-stone-200 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Adicionar benefício
            </button>
          </div>
          <label className="flex items-center gap-2 rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest dark:bg-forest-green">
            <input
              type="checkbox"
              checked={form.isFeatured ?? false}
              onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
              className="accent-primary"
            />
            Plano em destaque
          </label>
        </div>
        {error && <p className="mt-3 text-xs font-semibold text-state-critical">{error}</p>}
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
            disabled={submitting || !canSubmit}
            className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Salvando…" : "Salvar plano"}
          </button>
        </div>
      </div>
    </div>
  );
}
