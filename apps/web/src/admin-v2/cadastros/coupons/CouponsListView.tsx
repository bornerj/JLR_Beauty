import { useCallback, useEffect, useState } from "react";
import { getToken } from "../../../lib/auth";
import { logger } from "../../../utils/logger";
import {
  fetchDiscountCoupons,
  createDiscountCoupon,
  updateDiscountCoupon,
  deleteDiscountCoupon,
} from "../../shared/api";
import { DeleteConfirmModal } from "../../shell/DeleteConfirmModal";
import { CouponFormModal } from "./components/CouponFormModal";
import type { DiscountCoupon, DiscountCouponInput } from "./types";

/**
 * Admin V2 (PLAN-0026, Onda 4) — Cupons de Desconto, tier P (já era React puro no legado).
 * Reusa `/api/discount-coupons` sem alteração (`DECISION-014` regra #2). Tabular (8 colunas
 * no legado) em vez de cards — mesmo padrão de tabela já usado em outras telas do Admin V2
 * (ex.: `money/MoneyView.tsx`), diferente de Planos (Onda 1), que se presta melhor a cards.
 */

type ListState = { loading: boolean; data: DiscountCoupon[] | null; error: string | null };
type FormModalState = { mode: "create" } | { mode: "edit"; coupon: DiscountCoupon } | null;
type DeleteModalState = { coupon: DiscountCoupon } | null;
type MutationState = { submitting: boolean; error: string | null };

const parseDecimal = (value: string | null): number | null => {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatDate = (value: string | null): string => (value ? new Date(value).toLocaleDateString("pt-BR") : "—");

// Vigência calculada a partir de startsAt/endsAt (independe do flag manual `isActive`).
// Não existia nenhum filtro por data em nenhuma das duas telas (legado incluso) — feature nova.
type ValidityFilter = "all" | "valid" | "scheduled" | "expired";

const getCouponValidity = (coupon: DiscountCoupon, now: Date): Exclude<ValidityFilter, "all"> => {
  const startsAt = coupon.startsAt ? new Date(coupon.startsAt) : null;
  const endsAt = coupon.endsAt ? new Date(coupon.endsAt) : null;
  if (startsAt && startsAt > now) return "scheduled";
  if (endsAt && endsAt < now) return "expired";
  return "valid";
};

const VALIDITY_FILTER_OPTIONS: { value: ValidityFilter; label: string }[] = [
  { value: "all", label: "Todas as vigências" },
  { value: "valid", label: "Vigentes agora" },
  { value: "scheduled", label: "Agendados (ainda não começaram)" },
  { value: "expired", label: "Expirados" },
];

export function CouponsListView() {
  const [state, setState] = useState<ListState>({ loading: true, data: null, error: null });
  const [formModal, setFormModal] = useState<FormModalState>(null);
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>(null);
  const [mutation, setMutation] = useState<MutationState>({ submitting: false, error: null });
  const [validityFilter, setValidityFilter] = useState<ValidityFilter>("all");

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setState({ loading: false, data: null, error: "Sessão expirada. Faça login novamente." });
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchDiscountCoupons({ token });
      setState({ loading: false, data, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar os cupons.";
      logger.warn("Falha ao carregar Cupons (Admin V2)", { error: message });
      setState((prev) => ({ loading: false, data: prev.data, error: message }));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmit = useCallback(
    async (input: DiscountCouponInput) => {
      const token = getToken();
      if (!token || !formModal) return;
      setMutation({ submitting: true, error: null });
      try {
        if (formModal.mode === "edit") {
          await updateDiscountCoupon({ token, id: formModal.coupon.id, input });
        } else {
          await createDiscountCoupon({ token, input });
        }
        setFormModal(null);
        setMutation({ submitting: false, error: null });
        void load();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha ao salvar o cupom.";
        logger.warn("Falha ao salvar cupom (Admin V2)", { error: message });
        setMutation({ submitting: false, error: message });
      }
    },
    [formModal, load]
  );

  const handleDelete = useCallback(async () => {
    const token = getToken();
    if (!token || !deleteModal) return;
    setMutation({ submitting: true, error: null });
    try {
      await deleteDiscountCoupon({ token, id: deleteModal.coupon.id });
      setDeleteModal(null);
      setMutation({ submitting: false, error: null });
      void load();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao excluir o cupom.";
      logger.warn("Falha ao excluir cupom (Admin V2)", { error: message });
      setMutation({ submitting: false, error: message });
    }
  }, [deleteModal, load]);

  if (state.loading && !state.data) {
    return <p className="text-base text-stone-600 dark:text-stone-400">Carregando cupons…</p>;
  }

  if (state.error && !state.data) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-red-100 bg-white p-5">
        <p className="text-sm font-semibold text-red-600">Falha ao carregar os cupons.</p>
        <p className="text-sm text-stone-600 dark:text-stone-400">{state.error}</p>
        <div>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!state.data) return null;
  const coupons = state.data;
  const now = new Date();
  const filteredCoupons =
    validityFilter === "all" ? coupons : coupons.filter((c) => getCouponValidity(c, now) === validityFilter);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-forest">Cupons de Desconto</h1>
          <p className="text-base text-stone-600 dark:text-stone-400">
            código, tipo de desconto, validade e subtotal mínimo · {filteredCoupons.length} de {coupons.length}{" "}
            cupom(ns)
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormModal({ mode: "create" })}
          className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90"
        >
          + Novo cupom
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <select
          value={validityFilter}
          onChange={(e) => setValidityFilter(e.target.value as ValidityFilter)}
          className="rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary dark:bg-forest-green"
        >
          {VALIDITY_FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {coupons.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-200 p-6 text-center text-sm text-stone-500 dark:text-stone-400">
          Nenhum cupom cadastrado ainda.
        </p>
      ) : filteredCoupons.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-200 p-6 text-center text-sm text-stone-500 dark:text-stone-400">
          Nenhum cupom nessa vigência.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#cfe7d1] bg-white dark:border-forest-green dark:bg-forest">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#cfe7d1] text-xs font-bold uppercase tracking-wider text-stone-500 dark:border-forest-green dark:text-stone-400">
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Desconto</th>
                <th className="px-4 py-3">Mínimo</th>
                <th className="px-4 py-3">Validade</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredCoupons.map((coupon) => {
                const percentOff = parseDecimal(coupon.percentOff);
                const amountOff = parseDecimal(coupon.amountOff);
                const minSubtotal = parseDecimal(coupon.minSubtotal);
                const discountLabel =
                  coupon.discountType === "PERCENT"
                    ? `${(percentOff ?? 0).toFixed(2)}%`
                    : `R$ ${(amountOff ?? 0).toFixed(2)}`;
                const validity = getCouponValidity(coupon, now);
                const validityLabel =
                  validity === "expired" ? "Expirado" : validity === "scheduled" ? "Agendado" : "Vigente";
                const validityClass =
                  validity === "expired"
                    ? "bg-state-critical/15 text-state-critical"
                    : validity === "scheduled"
                      ? "bg-state-info/15 text-state-info"
                      : "bg-state-healthy/15 text-state-healthy";
                return (
                  <tr key={coupon.id} className="border-b border-stone-100 last:border-0 dark:border-forest-green/40">
                    <td className="px-4 py-3 font-semibold text-forest">{coupon.code}</td>
                    <td className="px-4 py-3 text-forest">{coupon.name}</td>
                    <td className="px-4 py-3 text-forest">{coupon.discountType === "PERCENT" ? "Percentual" : "Valor fixo"}</td>
                    <td className="px-4 py-3 text-forest">{discountLabel}</td>
                    <td className="px-4 py-3 text-forest">{minSubtotal !== null ? `R$ ${minSubtotal.toFixed(2)}` : "—"}</td>
                    <td className="px-4 py-3 text-forest">
                      <div className="flex flex-col gap-1">
                        <span>
                          {formatDate(coupon.startsAt)} até {formatDate(coupon.endsAt)}
                        </span>
                        <span
                          className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${validityClass}`}
                        >
                          {validityLabel}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          coupon.isActive
                            ? "bg-state-healthy/15 text-state-healthy"
                            : "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400"
                        }`}
                      >
                        {coupon.isActive ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setFormModal({ mode: "edit", coupon })}
                          title="Editar"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-forest hover:bg-primary/10"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteModal({ coupon })}
                          title="Excluir"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-state-critical hover:bg-state-critical/10"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {formModal && (
        <CouponFormModal
          editing={formModal.mode === "edit" ? formModal.coupon : null}
          submitting={mutation.submitting}
          error={mutation.error}
          onCancel={() => {
            setFormModal(null);
            setMutation({ submitting: false, error: null });
          }}
          onSubmit={(input) => void handleSubmit(input)}
        />
      )}

      {deleteModal && (
        <DeleteConfirmModal
          title={`Excluir "${deleteModal.coupon.code}"?`}
          description="Essa ação não pode ser desfeita. O cupom deixa de poder ser aplicado em novos pedidos."
          submitting={mutation.submitting}
          error={mutation.error}
          onCancel={() => {
            setDeleteModal(null);
            setMutation({ submitting: false, error: null });
          }}
          onConfirm={() => void handleDelete()}
        />
      )}
    </div>
  );
}
