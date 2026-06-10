import { useCallback, useEffect, useMemo, useState, type ReactElement } from "react";
import { getToken, getUser } from "../../../lib/auth";
import { logger } from "../../../utils/logger";

type SectionToggleMap = Record<string, Record<string, boolean>>;

type SectionTogglesResponse = {
  toggles: SectionToggleMap;
};

const API_URL = import.meta.env.VITE_API_URL || "";

const toSortedToggleMap = (value: SectionToggleMap): SectionToggleMap => {
  const pageEntries = Object.entries(value).sort(([left], [right]) => left.localeCompare(right));
  return pageEntries.reduce<SectionToggleMap>((acc, [page, sections]) => {
    const sectionEntries = Object.entries(sections).sort(([left], [right]) => left.localeCompare(right));
    acc[page] = sectionEntries.reduce<Record<string, boolean>>((inner, [section, enabled]) => {
      inner[section] = Boolean(enabled);
      return inner;
    }, {});
    return acc;
  }, {});
};

const normalizeErrorMessage = async (response: Response): Promise<string> => {
  const data = await response.json().catch(() => ({})) as { message?: string; detail?: string };
  const message = data.message || "Falha ao processar requisição.";
  if (!data.detail) return message;
  return `${message} (${data.detail})`;
};

export const AdminSectionTogglesView = (): ReactElement => {
  const currentUser = getUser();
  const canEdit = currentUser?.role?.trim().toUpperCase() === "MASTER";

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [toggles, setToggles] = useState<SectionToggleMap>({});

  const fetchToggles = useCallback(async (): Promise<void> => {
    if (!canEdit) {
      setError("Acesso restrito. Apenas usuarios Master podem alterar as seções públicas.");
      setLoading(false);
      return;
    }
    const token = getToken();
    if (!token) {
      setError("Sessão expirada. Faça login novamente.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`${API_URL}/api/admin/section-toggles`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(await normalizeErrorMessage(response));
      }
      const payload = (await response.json()) as SectionTogglesResponse;
      setToggles(toSortedToggleMap(payload.toggles));
    } catch (fetchError) {
      logger.error("Falha ao carregar section toggles no admin", { error: fetchError });
      setError(fetchError instanceof Error ? fetchError.message : "Falha ao carregar configurações.");
    } finally {
      setLoading(false);
    }
  }, [canEdit]);

  useEffect(() => {
    fetchToggles().catch(() => undefined);
  }, [fetchToggles]);

  const totalSections = useMemo<number>(() => {
    return Object.values(toggles).reduce((sum, sections) => sum + Object.keys(sections).length, 0);
  }, [toggles]);

  const toggleSection = (page: string, section: string): void => {
    setSuccess("");
    setError("");
    setToggles((current) => ({
      ...current,
      [page]: {
        ...current[page],
        [section]: !current[page]?.[section],
      },
    }));
  };

  const saveChanges = async (): Promise<void> => {
    if (!canEdit) return;
    const token = getToken();
    if (!token) {
      setError("Sessão expirada. Faça login novamente.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`${API_URL}/api/admin/section-toggles`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ toggles }),
      });
      if (!response.ok) {
        throw new Error(await normalizeErrorMessage(response));
      }
      const payload = (await response.json()) as SectionTogglesResponse;
      setToggles(toSortedToggleMap(payload.toggles));
      setSuccess("Configurações salvas com sucesso no banco (settings).");
    } catch (saveError) {
      logger.error("Falha ao salvar section toggles no admin", { error: saveError });
      setError(saveError instanceof Error ? saveError.message : "Falha ao salvar configurações.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto p-8 flex flex-col gap-6" data-admin-section-toggles-view>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-forest dark:text-white text-3xl display-hero text-shadow-strong italic">
            Seções Públicas (SPA)
          </h2>
          <p className="text-stone-500 text-lg font-normal">
            Ligue ou desligue seções da Home, Assinaturas e Franquias e grave no
            <code className="mx-1">settings</code> (sem editar arquivo).
          </p>
        </div>
        <button
          className="px-5 py-2 text-sm font-semibold rounded-lg bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors disabled:opacity-60"
          type="button"
          onClick={() => saveChanges()}
          disabled={!canEdit || saving || loading}
        >
          {saving ? "Salvando..." : "Salvar configurações"}
        </button>
      </header>

      <section className="bg-white rounded-xl border border-[#cfe7d1] shadow-sm p-5 flex flex-col gap-2">
        <p className="text-xs uppercase tracking-widest text-text-muted font-semibold">Editor autorizado</p>
        <p className="text-sm text-forest-green font-medium">{currentUser?.email || "usuário não identificado"}</p>
        <p className="text-xs text-text-muted">Total de seções mapeadas: {totalSections}</p>
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

      {loading ? (
        <section className="bg-white rounded-xl border border-[#cfe7d1] shadow-sm p-6 text-sm text-text-muted">
          Carregando configurações de seções...
        </section>
      ) : null}

      {!loading && !error ? (
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {Object.entries(toggles).map(([page, sections]) => (
            <article key={page} className="bg-white rounded-xl border border-[#cfe7d1] shadow-sm p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-bold text-forest uppercase tracking-wider">{page}</h3>
                <span className="text-xs text-text-muted">{Object.keys(sections).length} seções</span>
              </div>
              <div className="flex flex-col gap-2">
                {Object.entries(sections).map(([section, enabled]) => (
                  <button
                    key={`${page}-${section}`}
                    type="button"
                    onClick={() => toggleSection(page, section)}
                    className="w-full flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-semibold tracking-wide transition-colors bg-[#f8f6ef] border-[#d6ccb3] hover:bg-[#f2ecdf]"
                    disabled={!canEdit || saving}
                    aria-pressed={enabled}
                    aria-label={`Alternar seção ${section} em ${page}`}
                  >
                    <span>{section}</span>
                    <span
                      style={{
                        position: "relative",
                        display: "inline-flex",
                        alignItems: "center",
                        width: "58px",
                        height: "32px",
                        borderRadius: "999px",
                        border: `2px solid ${enabled ? "#34b84b" : "#9ea1a6"}`,
                        background: enabled ? "#50cf63" : "#e6e7e8",
                        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.12)",
                        flexShrink: 0,
                        transition: "background-color 0.2s ease, border-color 0.2s ease",
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          top: "2px",
                          left: enabled ? "28px" : "2px",
                          width: "26px",
                          height: "26px",
                          borderRadius: "999px",
                          background: "#ffffff",
                          boxShadow: "0 2px 5px rgba(0,0,0,0.35)",
                          transition: "left 0.2s ease",
                        }}
                      />
                    </span>
                  </button>
                ))}
              </div>
            </article>
          ))}
        </section>
      ) : null}
    </div>
  );
};
