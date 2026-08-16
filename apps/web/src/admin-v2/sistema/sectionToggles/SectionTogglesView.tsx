import { useCallback, useEffect, useMemo, useState } from "react";
import { getToken, getUser } from "../../../lib/auth";
import { logger } from "../../../utils/logger";
import { fetchSectionToggles, updateSectionToggles, type SectionToggleMap } from "../../shared/api";

/**
 * Admin V2 (PLAN-0026, Onda 6) — Seções Telas (liga/desliga), tier P (já era React puro no
 * legado, 276 linhas). Reusa `/api/admin/section-toggles` sem alteração. 32 chaves
 * `page.section` (Home 8, Franquias 19, Assinaturas 5). **Só `MASTER` edita** — gate
 * client-side preservado (checa `getUser()?.role` antes de sequer chamar a API, evitando um
 * 403 previsível pra quem não pode editar mesmo) e o backend confirma de novo (403 real).
 */

// Home primeiro, Assinaturas por último (Franquias no meio) — mesma ordem fixa do legado,
// não alfabética (reflete a ordem real das seções nas páginas públicas).
const PAGE_ORDER = ["home", "franquias", "assinaturas"];
const PAGE_LABELS: Record<string, string> = { home: "Home", franquias: "Franquias", assinaturas: "Assinaturas" };

const SECTION_ORDER: Record<string, string[]> = {
  home: ["hero", "services", "membership", "about", "mission", "products", "testimonials", "cta"],
  franquias: [
    "hero",
    "hero_gallery",
    "about",
    "vision",
    "founder",
    "benefits",
    "mission",
    "models",
    "fran03",
    "fran02",
    "fran01",
    "gestao_app",
    "fluxo_caixa",
    "marketing_crm",
    "expansao",
    "perfil",
    "suporte",
    "etapas",
    "contact",
  ],
  assinaturas: ["hero", "membership", "about", "mission", "testimonials"],
};

const sortByOrder = (order: string[]) => (left: string, right: string): number => {
  const leftIndex = order.indexOf(left);
  const rightIndex = order.indexOf(right);
  if (leftIndex === -1 && rightIndex === -1) return left.localeCompare(right);
  if (leftIndex === -1) return 1;
  if (rightIndex === -1) return -1;
  return leftIndex - rightIndex;
};

const toSortedToggleMap = (value: SectionToggleMap): SectionToggleMap => {
  const pageEntries = Object.entries(value).sort(([left], [right]) => sortByOrder(PAGE_ORDER)(left, right));
  return pageEntries.reduce<SectionToggleMap>((acc, [page, sections]) => {
    const sectionEntries = Object.entries(sections).sort(([left], [right]) => sortByOrder(SECTION_ORDER[page] || [])(left, right));
    acc[page] = sectionEntries.reduce<Record<string, boolean>>((inner, [section, enabled]) => {
      inner[section] = Boolean(enabled);
      return inner;
    }, {});
    return acc;
  }, {});
};

type LoadState = { loading: boolean; error: string | null };

export function SectionTogglesView() {
  const currentUser = getUser();
  const canEdit = currentUser?.role?.trim().toUpperCase() === "MASTER";

  const [toggles, setToggles] = useState<SectionToggleMap>({});
  const [state, setState] = useState<LoadState>({ loading: true, error: null });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    if (!canEdit) {
      setState({ loading: false, error: "Acesso restrito. Apenas usuários Master podem ver/alterar as seções públicas." });
      return;
    }
    const token = getToken();
    if (!token) {
      setState({ loading: false, error: "Sessão expirada. Faça login novamente." });
      return;
    }
    setState({ loading: true, error: null });
    setSuccess("");
    try {
      const fetched = await fetchSectionToggles({ token });
      setToggles(toSortedToggleMap(fetched));
      setState({ loading: false, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar configurações.";
      logger.warn("Falha ao carregar Seções Telas (Admin V2)", { error: message });
      setState({ loading: false, error: message });
    }
  }, [canEdit]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalSections = useMemo(
    () => Object.values(toggles).reduce((sum, sections) => sum + Object.keys(sections).length, 0),
    [toggles]
  );

  const toggleSection = (page: string, section: string): void => {
    setSuccess("");
    setState((prev) => ({ ...prev, error: null }));
    setToggles((current) => ({
      ...current,
      [page]: { ...current[page], [section]: !current[page]?.[section] },
    }));
  };

  const handleSave = useCallback(async () => {
    if (!canEdit) return;
    const token = getToken();
    if (!token) {
      setState((prev) => ({ ...prev, error: "Sessão expirada. Faça login novamente." }));
      return;
    }
    setSaving(true);
    setState((prev) => ({ ...prev, error: null }));
    setSuccess("");
    try {
      const saved = await updateSectionToggles({ token, toggles });
      setToggles(toSortedToggleMap(saved));
      setSuccess("Configurações salvas com sucesso.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao salvar configurações.";
      logger.warn("Falha ao salvar Seções Telas (Admin V2)", { error: message });
      setState((prev) => ({ ...prev, error: message }));
    } finally {
      setSaving(false);
    }
  }, [canEdit, toggles]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-forest">Seções Telas</h1>
          <p className="text-base text-stone-600 dark:text-stone-400">
            ligue ou desligue seções da Home, Franquias e Assinaturas — grava direto no banco, sem deploy
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={!canEdit || saving || state.loading}
          className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Salvando…" : "Salvar configurações"}
        </button>
      </div>

      <div className="flex flex-col gap-1 rounded-xl border border-[#cfe7d1] bg-white p-5 dark:border-forest-green dark:bg-forest">
        <p className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Editor autorizado</p>
        <p className="text-sm font-medium text-forest">{currentUser?.email || "usuário não identificado"}</p>
        {!state.loading && !state.error && (
          <p className="text-xs text-stone-500 dark:text-stone-400">Total de seções mapeadas: {totalSections}</p>
        )}
      </div>

      {state.loading && <p className="text-sm text-stone-600 dark:text-stone-400">Carregando configurações de seções…</p>}
      {state.error && <p className="text-sm font-semibold text-state-critical">{state.error}</p>}
      {success && <p className="text-sm font-semibold text-state-healthy">{success}</p>}

      {!state.loading && !state.error && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {Object.entries(toggles).map(([page, sections]) => (
            <div key={page} className="flex flex-col gap-4 rounded-xl border border-[#cfe7d1] bg-white p-5 dark:border-forest-green dark:bg-forest">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-bold uppercase tracking-wider text-forest">{PAGE_LABELS[page] ?? page}</h3>
                <span className="text-xs text-stone-500 dark:text-stone-400">{Object.keys(sections).length} seções</span>
              </div>
              <div className="flex flex-col gap-2">
                {Object.entries(sections).map(([section, enabled]) => (
                  <button
                    key={`${page}-${section}`}
                    type="button"
                    onClick={() => toggleSection(page, section)}
                    disabled={!canEdit || saving}
                    aria-pressed={enabled}
                    aria-label={`Alternar seção ${section} em ${page}`}
                    className="flex w-full items-center justify-between rounded-lg border border-gold/40 bg-primary/5 px-3 py-2 text-xs font-semibold tracking-wide text-forest transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span>{section}</span>
                    <span
                      className={`relative inline-flex h-7 w-[52px] flex-shrink-0 items-center rounded-full border-2 transition-colors ${
                        enabled ? "border-state-healthy bg-state-healthy" : "border-stone-300 bg-stone-200 dark:border-stone-600 dark:bg-stone-700"
                      }`}
                    >
                      <span
                        className={`absolute h-5 w-5 rounded-full bg-white shadow transition-all ${enabled ? "left-[26px]" : "left-0.5"}`}
                      />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
