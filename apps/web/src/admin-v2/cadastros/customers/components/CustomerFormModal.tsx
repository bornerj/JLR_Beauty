import { useState } from "react";
import type { Customer, CustomerInput } from "../types";

/**
 * Admin V2 (PLAN-0026, Onda 12) — modal de criar/editar Cliente. Campos espelham o form
 * legado (`admin-people/AdminPeopleView.tsx` + `behavior.ts`, aba Clientes). Vínculo com
 * conta de usuário via ID numérico bruto (sem busca/autocomplete) — mesma UX do legado, não
 * modernizado nesta onda (a tela de Usuários, Onda 14, ainda não existe nativa pra oferecer
 * um seletor melhor sem inventar uma dependência cruzada precoce).
 *
 * PLAN-0027 Item 5/7 (`ERR-0059`): ID do próprio cliente (`Customer.id`, somente leitura)
 * agora é o primeiro campo do form, como na grid. "ID de usuário" trocou de posição com
 * E-mail (campo maior fica com mais espaço) e ganhou `title` explicando que é um vínculo
 * opcional com uma conta de login (`User`) — não é o ID do cliente e não vem preenchido
 * automaticamente, mesmo achado documentado no `PLAN-0027`.
 */

type FormState = {
  name: string;
  phone: string;
  phone2: string;
  email: string;
  city: string;
  state: string;
  neighborhood: string;
  notes: string;
  userId: string;
};

const emptyForm = (): FormState => ({
  name: "",
  phone: "",
  phone2: "",
  email: "",
  city: "",
  state: "",
  neighborhood: "",
  notes: "",
  userId: "",
});

const fromCustomer = (customer: Customer): FormState => ({
  name: customer.name,
  phone: customer.phone,
  phone2: customer.phone2 ?? "",
  email: customer.email ?? "",
  city: customer.city ?? "",
  state: customer.state ?? "",
  neighborhood: customer.neighborhood ?? "",
  notes: customer.notes ?? "",
  userId: customer.user?.id ? String(customer.user.id) : customer.userId ? String(customer.userId) : "",
});

export function CustomerFormModal({
  editing,
  submitting,
  error,
  onCancel,
  onSubmit,
}: {
  /** `null` = criando um cliente novo; um `Customer` = editando esse cliente. */
  editing: Customer | null;
  submitting: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (input: CustomerInput) => void;
}) {
  const [form, setForm] = useState<FormState>(editing ? fromCustomer(editing) : emptyForm());
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = () => {
    const name = form.name.trim();
    const phone = form.phone.trim();
    if (name.length < 2) {
      setLocalError("Informe o nome do cliente (mínimo 2 caracteres).");
      return;
    }
    if (!phone) {
      setLocalError("Informe o telefone do cliente.");
      return;
    }
    const email = form.email.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLocalError("Informe um e-mail válido.");
      return;
    }
    const userIdRaw = form.userId.trim();
    const userId = userIdRaw ? Number(userIdRaw) : undefined;
    if (userIdRaw && (!Number.isInteger(userId) || (userId as number) <= 0)) {
      setLocalError("ID de usuário inválido.");
      return;
    }

    setLocalError(null);
    onSubmit({
      name,
      phone,
      phone2: form.phone2.trim() || null,
      email: email || null,
      city: form.city.trim() || null,
      state: form.state.trim() ? form.state.trim().toUpperCase() : null,
      neighborhood: form.neighborhood.trim() || null,
      notes: form.notes.trim() || null,
      userId: userId ?? null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-2xl dark:bg-forest">
        <h3 className="text-xl font-bold text-forest">{editing ? "Editar cliente" : "Novo cliente"}</h3>
        <div className="mt-4 flex flex-col gap-4">
          <div className="grid grid-cols-[110px_1fr] gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">ID</label>
              <input
                value={editing ? `CLI-${editing.id}` : "gerado ao salvar"}
                disabled
                readOnly
                className="rounded-lg border border-gold/40 bg-stone-50 px-3 py-2 text-sm text-stone-500 dark:bg-forest-green/40 dark:text-stone-400"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Nome</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nome completo"
                className="rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary dark:bg-forest-green"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Telefone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="(11) 90000-0000"
                className="rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary dark:bg-forest-green"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                Telefone alternativo
              </label>
              <input
                value={form.phone2}
                onChange={(e) => setForm({ ...form, phone2: e.target.value })}
                placeholder="Opcional"
                className="rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary dark:bg-forest-green"
              />
            </div>
          </div>

          <div className="grid grid-cols-[140px_1fr] gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                ID de usuário
              </label>
              <input
                type="number"
                min={1}
                value={form.userId}
                onChange={(e) => setForm({ ...form, userId: e.target.value })}
                placeholder="Opcional"
                title="Vincula este cliente a uma conta de login existente (tabela User). Não é o ID do próprio cliente e não é preenchido automaticamente — deixe em branco se o cliente não tiver conta."
                className="rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary dark:bg-forest-green"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">E-mail</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="cliente@exemplo.com"
                className="rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary dark:bg-forest-green"
              />
            </div>
          </div>

          <div className="grid grid-cols-[1fr_80px_1fr] gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Cidade</label>
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary dark:bg-forest-green"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">UF</label>
              <input
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                maxLength={2}
                placeholder="SP"
                className="rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm uppercase text-forest focus:outline-none focus:ring-1 focus:ring-primary dark:bg-forest-green"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Bairro</label>
              <input
                value={form.neighborhood}
                onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                className="rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary dark:bg-forest-green"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Notas</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Observações internas sobre o cliente."
              className="rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary dark:bg-forest-green"
            />
          </div>
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
            {submitting ? "Salvando…" : editing ? "Atualizar cliente" : "Salvar cliente"}
          </button>
        </div>
      </div>
    </div>
  );
}
