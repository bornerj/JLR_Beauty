import { useState } from "react";
import type { AdminV2Unit } from "../../../panorama/types";
import type { Professional, ProfessionalUpdateInput, ProfessionalWorkProfile } from "../types";

/**
 * Admin V2 (PLAN-0026, Onda 13) — modal de edição de Profissional. **Sempre edição, nunca
 * criação** — não existe `POST /professionals` no backend (ver `types.ts`). Campos espelham
 * o form legado (`admin-people`, aba Profissionais): nome, unidade, status de vínculo,
 * datas de início/fim, perfil de trabalho, comissão (%) e vínculo de usuário — igual ao
 * legado, `commissionProfileId`/`specialties` não entram aqui (o form legado também nunca os
 * expõe).
 */

type FormState = {
  name: string;
  unitId: string;
  employmentStatus: "ACTIVE" | "INACTIVE";
  startedAt: string;
  endedAt: string;
  workProfileId: string;
  commissionPercent: string;
  linkedUserId: string;
};

const toDateInputValue = (value: string | null): string => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};

const fromProfessional = (professional: Professional): FormState => ({
  name: professional.name,
  unitId: professional.unitId ? String(professional.unitId) : "",
  employmentStatus: professional.employmentStatus,
  startedAt: toDateInputValue(professional.startedAt),
  endedAt: toDateInputValue(professional.endedAt),
  workProfileId: professional.workProfileId ? String(professional.workProfileId) : "",
  commissionPercent: professional.commissionPercent ?? "",
  linkedUserId: String(professional.user.id),
});

export function ProfessionalFormModal({
  professional,
  units,
  workProfiles,
  submitting,
  error,
  onCancel,
  onSubmit,
  onManageWorkProfiles,
}: {
  professional: Professional;
  units: AdminV2Unit[];
  workProfiles: ProfessionalWorkProfile[];
  submitting: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (args: { update: ProfessionalUpdateInput; linkUserId: number | null }) => void;
  onManageWorkProfiles: () => void;
}) {
  const [form, setForm] = useState<FormState>(fromProfessional(professional));
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = () => {
    const name = form.name.trim();
    if (name.length < 2) {
      setLocalError("Informe o nome do profissional (mínimo 2 caracteres).");
      return;
    }
    const commissionRaw = form.commissionPercent.trim();
    const commissionPercent = commissionRaw ? Number(commissionRaw.replace(",", ".")) : null;
    if (commissionPercent !== null && (!Number.isFinite(commissionPercent) || commissionPercent < 0 || commissionPercent > 100)) {
      setLocalError("Comissão inválida. Informe um percentual entre 0 e 100.");
      return;
    }
    const linkedUserRaw = form.linkedUserId.trim();
    const linkedUserId = linkedUserRaw ? Number(linkedUserRaw) : null;
    if (linkedUserRaw && (!Number.isInteger(linkedUserId) || (linkedUserId as number) <= 0)) {
      setLocalError("ID de usuário vinculado inválido.");
      return;
    }
    if (
      form.startedAt &&
      form.endedAt &&
      new Date(form.endedAt).getTime() < new Date(form.startedAt).getTime()
    ) {
      setLocalError("Data de término deve ser maior ou igual à data de início.");
      return;
    }

    setLocalError(null);
    onSubmit({
      update: {
        name,
        unitId: form.unitId ? Number(form.unitId) : null,
        employmentStatus: form.employmentStatus,
        startedAt: form.startedAt || null,
        endedAt: form.endedAt || null,
        workProfileId: form.workProfileId ? Number(form.workProfileId) : null,
        commissionPercent,
      },
      linkUserId: linkedUserId !== professional.user.id ? linkedUserId : null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-2xl dark:bg-forest">
        <h3 className="text-xl font-bold text-forest">Editar profissional</h3>
        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">PRO-{professional.id}</p>

        <div className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Nome</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary dark:bg-forest-green"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Unidade</label>
              <select
                value={form.unitId}
                onChange={(e) => setForm({ ...form, unitId: e.target.value })}
                className="rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary dark:bg-forest-green"
              >
                <option value="">Sem unidade</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Status</label>
              <select
                value={form.employmentStatus}
                onChange={(e) => setForm({ ...form, employmentStatus: e.target.value as "ACTIVE" | "INACTIVE" })}
                className="rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary dark:bg-forest-green"
              >
                <option value="ACTIVE">Ativo</option>
                <option value="INACTIVE">Inativo</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Data de início</label>
              <input
                type="date"
                value={form.startedAt}
                onChange={(e) => setForm({ ...form, startedAt: e.target.value })}
                className="rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary dark:bg-forest-green"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Data de término</label>
              <input
                type="date"
                value={form.endedAt}
                onChange={(e) => setForm({ ...form, endedAt: e.target.value })}
                className="rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary dark:bg-forest-green"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Perfil de trabalho</label>
              <button type="button" onClick={onManageWorkProfiles} className="text-xs font-semibold text-primary hover:underline">
                Gerenciar perfis
              </button>
            </div>
            <select
              value={form.workProfileId}
              onChange={(e) => setForm({ ...form, workProfileId: e.target.value })}
              className="rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary dark:bg-forest-green"
            >
              <option value="">Sem perfil de trabalho</option>
              {workProfiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Comissão (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={form.commissionPercent}
                onChange={(e) => setForm({ ...form, commissionPercent: e.target.value })}
                className="rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary dark:bg-forest-green"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                ID de usuário vinculado
              </label>
              <input
                type="number"
                min={1}
                value={form.linkedUserId}
                onChange={(e) => setForm({ ...form, linkedUserId: e.target.value })}
                className="rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary dark:bg-forest-green"
              />
            </div>
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
            {submitting ? "Salvando…" : "Atualizar profissional"}
          </button>
        </div>
      </div>
    </div>
  );
}
