import { useCallback, useEffect, useMemo, useState } from "react";
import { getToken } from "../../../lib/auth";
import { logger } from "../../../utils/logger";
import {
  fetchProfessionals,
  updateProfessional,
  linkProfessionalUser,
  fetchProfessionalWorkProfiles,
  fetchAdminV2Units,
} from "../../shared/api";
import type { AdminV2Unit } from "../../panorama/types";
import { ProfessionalFormModal } from "./components/ProfessionalFormModal";
import { WorkProfileManagerModal } from "./components/WorkProfileManagerModal";
import { CommissionProfileManagerModal } from "./components/CommissionProfileManagerModal";
import type { Professional, ProfessionalUpdateInput, ProfessionalWorkProfile } from "./types";

/**
 * Admin V2 (PLAN-0026, Onda 13) — Cadastro de Profissionais, tier G, segunda das 3 telas do
 * desmembramento de "Pessoas" (`DECISION-014` regra #3). Reusa `/api/professionals` +
 * `/api/professional-work-profiles` + `/api/professional-commission-profiles` sem alteração.
 *
 * **Sem criação de profissional**: não existe `POST /professionals` no backend — a tela só
 * lista e edita profissionais já existentes, mesma limitação do legado.
 *
 * **Turnos e vínculo de serviços não aparecem aqui**: são domínio da Agenda
 * (`admin-schedule`), não de Cadastro de Pessoas — a tabela só mostra as contagens
 * read-only, mesmo comportamento do legado (que só tem um botão "Ver agenda" pra sair da
 * tela, sem gerenciar nada aqui).
 */

type ListState = { loading: boolean; data: Professional[] | null; error: string | null };
type MutationState = { submitting: boolean; error: string | null };
type ManagerModal = "work-profiles" | "commission-profiles" | null;

/**
 * `startedAt`/`endedAt` são armazenados como data pura (meia-noite UTC — backend normaliza
 * via `parseIsoDateStart`). `toLocaleDateString()` sem `timeZone: "UTC"` converte pro fuso
 * local antes de formatar, o que pode exibir o dia anterior (ex.: meia-noite UTC em
 * horário BRT vira 21h do dia anterior) — achado real durante a validação visual desta
 * onda, corrigido fixando o fuso em UTC.
 */
const formatDateOnly = (value: string | null): string => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("pt-BR", { timeZone: "UTC" });
};

const formatPercent = (value: string | null): string => {
  if (value === null || value === undefined || value === "") return "—";
  const parsed = Number(value);
  return Number.isFinite(parsed) ? `${parsed}%` : "—";
};

export function ProfessionalsListView() {
  const [state, setState] = useState<ListState>({ loading: true, data: null, error: null });
  const [units, setUnits] = useState<AdminV2Unit[]>([]);
  const [workProfiles, setWorkProfiles] = useState<ProfessionalWorkProfile[]>([]);
  const [editing, setEditing] = useState<Professional | null>(null);
  const [mutation, setMutation] = useState<MutationState>({ submitting: false, error: null });
  const [managerModal, setManagerModal] = useState<ManagerModal>(null);
  const [search, setSearch] = useState("");
  const [unitFilter, setUnitFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setState({ loading: false, data: null, error: "Sessão expirada. Faça login novamente." });
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const [professionals, unitList, workProfileList] = await Promise.all([
        fetchProfessionals({ token }),
        fetchAdminV2Units({ token }),
        fetchProfessionalWorkProfiles({ token }),
      ]);
      setUnits(unitList);
      setWorkProfiles(workProfileList);
      setState({ loading: false, data: professionals, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar os profissionais.";
      logger.warn("Falha ao carregar Profissionais (Admin V2)", { error: message });
      setState((prev) => ({ loading: false, data: prev.data, error: message }));
    }
  }, []);

  useEffect(() => {
    // ERR-0084 — mesmo fix do ERR-0083: adia a chamada em 1 tick pra sair do
    // commit síncrono do efeito (react-hooks/set-state-in-effect).
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  const reloadWorkProfiles = useCallback(() => {
    const token = getToken();
    if (!token) return;
    fetchProfessionalWorkProfiles({ token })
      .then(setWorkProfiles)
      .catch((error) => logger.warn("Falha ao recarregar perfis de trabalho (Admin V2)", { error }));
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (state.data ?? []).filter((p) => {
      const matchesQuery =
        !query ||
        p.name.toLowerCase().includes(query) ||
        p.user.email.toLowerCase().includes(query) ||
        (p.unit?.name ?? "").toLowerCase().includes(query);
      const matchesUnit = !unitFilter || String(p.unitId ?? "") === unitFilter;
      const matchesStatus = !statusFilter || p.employmentStatus === statusFilter;
      return matchesQuery && matchesUnit && matchesStatus;
    });
  }, [state.data, search, unitFilter, statusFilter]);

  const handleSubmit = useCallback(
    async (args: { update: ProfessionalUpdateInput; linkUserId: number | null }) => {
      const token = getToken();
      if (!token || !editing) return;
      setMutation({ submitting: true, error: null });
      try {
        await updateProfessional({ token, id: editing.id, input: args.update });
        if (args.linkUserId) {
          await linkProfessionalUser({ token, id: editing.id, professionalUserId: args.linkUserId });
        }
        setEditing(null);
        setMutation({ submitting: false, error: null });
        void load();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha ao atualizar o profissional.";
        logger.warn("Falha ao atualizar profissional (Admin V2)", { error: message });
        setMutation({ submitting: false, error: message });
      }
    },
    [editing, load]
  );

  if (state.loading && !state.data) {
    return <p className="text-base text-stone-600 dark:text-stone-400">Carregando profissionais…</p>;
  }

  if (state.error && !state.data) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-red-100 bg-white p-5">
        <p className="text-sm font-semibold text-red-600">Falha ao carregar os profissionais.</p>
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

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-forest">Profissionais</h1>
          <p className="text-base text-stone-600 dark:text-stone-400">
            equipe vinculada a uma conta de login, com unidade, comissão e perfil de trabalho · {filtered.length}/{state.data.length}{" "}
            profissional(is)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setManagerModal("work-profiles")}
            className="rounded-full border border-gold/40 bg-white px-3 py-1.5 text-xs font-semibold text-forest hover:bg-primary/5 dark:bg-forest-green"
          >
            Perfis de trabalho
          </button>
          <button
            type="button"
            onClick={() => setManagerModal("commission-profiles")}
            className="rounded-full border border-gold/40 bg-white px-3 py-1.5 text-xs font-semibold text-forest hover:bg-primary/5 dark:bg-forest-green"
          >
            Perfis de comissão
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, e-mail ou unidade…"
          className="rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green sm:col-span-2"
        />
        <select
          value={unitFilter}
          onChange={(e) => setUnitFilter(e.target.value)}
          className="rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
        >
          <option value="">Todas as unidades</option>
          {units.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
        >
          <option value="">Todos os status</option>
          <option value="ACTIVE">Ativo</option>
          <option value="INACTIVE">Inativo</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-200 p-6 text-center text-sm text-stone-500 dark:text-stone-400">
          Nenhum profissional encontrado.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#cfe7d1] bg-white dark:border-forest-green dark:bg-forest">
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#cfe7d1] text-xs font-bold uppercase tracking-wider text-stone-500 dark:border-forest-green dark:text-stone-400">
                <th className="px-4 py-3">Profissional</th>
                <th className="px-4 py-3">Usuário</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Início</th>
                <th className="px-4 py-3">Fim</th>
                <th className="px-4 py-3">Unidade</th>
                <th className="px-4 py-3">Comissão</th>
                <th className="px-4 py-3">Turnos</th>
                <th className="px-4 py-3">Serviços</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((professional) => (
                <tr key={professional.id} className="border-b border-stone-100 last:border-0 dark:border-forest-green/40">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-forest">{professional.name}</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">PRO-{professional.id}</p>
                  </td>
                  <td className="px-4 py-3 text-forest">{professional.user.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        professional.employmentStatus === "ACTIVE"
                          ? "bg-state-healthy/15 text-state-healthy"
                          : "bg-stone-200 text-stone-600 dark:bg-stone-700 dark:text-stone-300"
                      }`}
                    >
                      {professional.employmentStatus === "ACTIVE" ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-forest">{formatDateOnly(professional.startedAt)}</td>
                  <td className="px-4 py-3 text-forest">{formatDateOnly(professional.endedAt)}</td>
                  <td className="px-4 py-3 text-forest">{professional.unit?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-forest">
                    {formatPercent(professional.commissionPercent ?? professional.commissionProfile?.commissionPercent ?? null)}
                  </td>
                  <td className="px-4 py-3 text-forest">{professional._count.shifts}</td>
                  <td className="px-4 py-3 text-forest">{professional._count.professionalServices}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setEditing(professional)}
                      title="Editar"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-forest hover:bg-primary/10"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <ProfessionalFormModal
          professional={editing}
          units={units}
          workProfiles={workProfiles}
          submitting={mutation.submitting}
          error={mutation.error}
          onCancel={() => {
            setEditing(null);
            setMutation({ submitting: false, error: null });
          }}
          onSubmit={(args) => void handleSubmit(args)}
          onManageWorkProfiles={() => setManagerModal("work-profiles")}
        />
      )}

      {managerModal === "work-profiles" && (
        <WorkProfileManagerModal onClose={() => setManagerModal(null)} onChanged={reloadWorkProfiles} />
      )}
      {managerModal === "commission-profiles" && (
        <CommissionProfileManagerModal onClose={() => setManagerModal(null)} onChanged={() => void load()} />
      )}
    </div>
  );
}
