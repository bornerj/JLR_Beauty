import { useCallback, useEffect, useState } from "react";
import { getToken } from "../../../lib/auth";
import { logger } from "../../../utils/logger";
import { isSegmented, type TextSegment } from "../../../modules/public-site/pageTexts";
import { fetchPageTexts, fetchPreviousPageTexts, savePageTexts, restorePreviousPageTexts } from "../../shared/api";
import { DeleteConfirmModal } from "../../shell/DeleteConfirmModal";
import { SegmentEditor } from "./components/SegmentEditor";
import type { PageTextCatalogEntry, PageTextsMap } from "./types";

/**
 * Admin V2 (PLAN-0026, Onda 5) — Textos das Páginas, tier P (já era React puro no legado,
 * 309 linhas + `SegmentEditor.tsx`). Reusa `/api/admin/page-texts` (+ `/previous` +
 * `/restore`) sem alteração. 331 campos no catálogo — abas por página + acordeão por seção,
 * mesmo padrão do legado, pra não renderizar tudo de uma vez.
 *
 * **Contrato crítico** (ver `shared/api.ts`): `savePageTexts` substitui o mapa inteiro, não
 * faz merge incremental — o estado local sempre carrega todas as 331 chaves (carregadas já
 * mescladas com defaults pelo `GET`), e o `PUT` manda esse mapa completo de volta, nunca só
 * as chaves editadas na sessão.
 */

const PAGE_LABELS: Record<string, string> = {
  home: "Home",
  franquias: "Franquias",
  assinaturas: "Assinaturas",
  global: "Missão & Valores",
};

// PLAN-0034 (Fase 1c, achado de nomenclatura) — só 10/23 seções reais do catálogo
// tinham rótulo aqui; as outras 13 caíam no fallback `?? section` e apareciam com a
// chave técnica crua (snake_case) pra quem edita. Lista completa a partir de
// `grep -oE 'section: "[a-z_0-9]+"' catalog.ts | sort -u` — mantenha em sincronia
// ao adicionar uma seção nova ao catálogo.
const SECTION_LABELS: Record<string, string> = {
  hero: "Hero",
  about: "Sobre",
  cta: "CTA",
  services: "Serviços",
  membership: "Assinaturas (Home)",
  testimonials: "Depoimentos",
  models: "Modelos",
  vision: "Visão",
  contact: "Contato",
  mission: "Missão",
  products: "Produtos",
  benefits: "Benefícios",
  founder: "Fundadora",
  fran01: "Modelo Master (detalhes)",
  fran02: "Modelo Prime (detalhes)",
  fran03: "Modelo Essencial (detalhes)",
  gestao_app: "Gestão via App",
  fluxo_caixa: "Fluxo de Caixa",
  marketing_crm: "Marketing & CRM",
  expansao: "Expansão",
  perfil: "Perfil do Franqueado",
  suporte: "Suporte da Franqueadora",
  etapas: "Etapas de Abertura",
};

type LoadState = { loading: boolean; error: string | null };

export function PageTextsView() {
  const [catalog, setCatalog] = useState<PageTextCatalogEntry[]>([]);
  const [texts, setTexts] = useState<PageTextsMap>({});
  const [state, setState] = useState<LoadState>({ loading: true, error: null });
  const [activePage, setActivePage] = useState<string>("home");
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setState({ loading: false, error: "Sessão expirada. Faça login novamente." });
      return;
    }
    setState({ loading: true, error: null });
    try {
      const [{ catalog: fetchedCatalog, texts: fetchedTexts }, previous] = await Promise.all([
        fetchPageTexts({ token }),
        fetchPreviousPageTexts({ token }),
      ]);
      setCatalog(fetchedCatalog);
      setTexts(fetchedTexts);
      setHasPrevious(previous !== null);
      const firstPage = fetchedCatalog[0]?.page ?? "home";
      setActivePage(firstPage);
      const firstSection = fetchedCatalog.find((e) => e.page === firstPage)?.section ?? "";
      if (firstSection) setOpenSections(new Set([`${firstPage}.${firstSection}`]));
      setState({ loading: false, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar os textos.";
      logger.warn("Falha ao carregar Textos das Páginas (Admin V2)", { error: message });
      setState({ loading: false, error: message });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSimpleChange = (key: string, value: string): void => {
    setTexts((prev) => ({ ...prev, [key]: value }));
  };

  const handleSegmentedChange = (key: string, segments: TextSegment[]): void => {
    setTexts((prev) => ({ ...prev, [key]: segments }));
  };

  const toggleSection = (sectionKey: string): void => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionKey)) next.delete(sectionKey);
      else next.add(sectionKey);
      return next;
    });
  };

  const handleSave = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setState((prev) => ({ ...prev, error: "Sessão expirada. Faça login novamente." }));
      return;
    }
    setSaving(true);
    setState((prev) => ({ ...prev, error: null }));
    setSuccessMessage("");
    try {
      const saved = await savePageTexts({ token, texts });
      setTexts(saved);
      setHasPrevious(true);
      setSuccessMessage("Textos salvos com sucesso!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao salvar. Tente novamente.";
      logger.warn("Falha ao salvar Textos das Páginas (Admin V2)", { error: message });
      setState((prev) => ({ ...prev, error: message }));
    } finally {
      setSaving(false);
    }
  }, [texts]);

  const handleRestore = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setState((prev) => ({ ...prev, error: "Sessão expirada. Faça login novamente." }));
      return;
    }
    setRestoring(true);
    setState((prev) => ({ ...prev, error: null }));
    setSuccessMessage("");
    try {
      const restored = await restorePreviousPageTexts({ token });
      setTexts(restored);
      setHasPrevious(true);
      setRestoreModalOpen(false);
      setSuccessMessage('Versão anterior restaurada. Clique em "Salvar tudo" para confirmar.');
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao restaurar versão anterior.";
      logger.warn("Falha ao restaurar Textos das Páginas (Admin V2)", { error: message });
      setState((prev) => ({ ...prev, error: message }));
    } finally {
      setRestoring(false);
    }
  }, []);

  const pages = Array.from(new Set(catalog.map((e) => e.page)));
  const sectionsForPage = (page: string): string[] =>
    Array.from(new Set(catalog.filter((e) => e.page === page).map((e) => e.section)));
  const entriesForSection = (page: string, section: string): PageTextCatalogEntry[] =>
    catalog.filter((e) => e.page === page && e.section === section);

  if (state.loading) {
    return <p className="text-base text-stone-600 dark:text-stone-400">Carregando textos…</p>;
  }

  if (state.error && catalog.length === 0) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-red-100 bg-white p-5">
        <p className="text-sm font-semibold text-red-600">Falha ao carregar os textos.</p>
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

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-forest">Textos das Páginas</h1>
          <p className="text-base text-stone-600 dark:text-stone-400">
            edite os textos visíveis do site público · {catalog.length} campo(s)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasPrevious && (
            <button
              type="button"
              onClick={() => setRestoreModalOpen(true)}
              disabled={saving || restoring}
              className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-white px-4 py-2 text-xs font-semibold text-forest hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-forest"
            >
              <span className="material-symbols-outlined text-base">history</span>
              Restaurar versão anterior
            </button>
          )}
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || restoring}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-base">{saving ? "progress_activity" : "save"}</span>
            {saving ? "Salvando…" : "Salvar tudo"}
          </button>
        </div>
      </div>

      {successMessage && <p className="text-sm font-semibold text-state-healthy">{successMessage}</p>}
      {state.error && <p className="text-sm font-semibold text-state-critical">{state.error}</p>}

      <div className="flex gap-2 border-b border-[#cfe7d1] dark:border-forest-green">
        {pages.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => setActivePage(page)}
            className={`rounded-t-lg border-b-2 px-5 py-2 text-sm font-semibold uppercase tracking-wider transition-colors ${
              activePage === page
                ? "border-primary bg-primary/5 text-primary"
                : "border-transparent text-stone-500 hover:text-forest dark:text-stone-400"
            }`}
          >
            {PAGE_LABELS[page] ?? page}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {sectionsForPage(activePage).map((section) => {
          const sectionKey = `${activePage}.${section}`;
          const isOpen = openSections.has(sectionKey);
          const entries = entriesForSection(activePage, section);

          return (
            <div key={sectionKey} className="overflow-hidden rounded-xl border border-[#cfe7d1] dark:border-forest-green">
              <button
                type="button"
                onClick={() => toggleSection(sectionKey)}
                className="flex w-full items-center justify-between bg-primary/5 px-5 py-3 transition-colors hover:bg-primary/10"
              >
                <span className="text-sm font-semibold uppercase tracking-widest text-forest">
                  {SECTION_LABELS[section] ?? section}
                  <span className="ml-2 font-normal normal-case tracking-normal text-stone-500 dark:text-stone-400">
                    ({entries.length} campo{entries.length !== 1 ? "s" : ""})
                  </span>
                </span>
                <span
                  className={`material-symbols-outlined text-stone-500 transition-transform dark:text-stone-400 ${isOpen ? "rotate-180" : ""}`}
                >
                  expand_more
                </span>
              </button>

              {isOpen && (
                <div className="flex flex-col divide-y divide-[#cfe7d1]/50 bg-white dark:divide-forest-green/40 dark:bg-forest">
                  {entries.map((entry) => {
                    const currentValue = texts[entry.key] ?? entry.defaultValue;
                    return (
                      <div key={entry.key} className="flex flex-col gap-2 px-5 py-4">
                        <label className="text-xs font-bold uppercase tracking-widest text-stone-600 dark:text-stone-400">
                          {entry.label}
                          {entry.label.includes("{fullName}") && (
                            <span className="ml-2 normal-case tracking-normal font-normal text-gold">
                              — use {"{fullName}"} para inserir o nome do salão
                            </span>
                          )}
                        </label>

                        {entry.type === "simple" ? (
                          <textarea
                            value={typeof currentValue === "string" ? currentValue : ""}
                            onChange={(e) => handleSimpleChange(entry.key, e.target.value)}
                            rows={currentValue && String(currentValue).length > 80 ? 3 : 1}
                            className="min-h-[2.5rem] w-full resize-y rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
                          />
                        ) : (
                          <SegmentEditor
                            segments={isSegmented(currentValue) ? currentValue : []}
                            onChange={(segs) => handleSegmentedChange(entry.key, segs)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {restoreModalOpen && (
        <DeleteConfirmModal
          tone="neutral"
          title="Restaurar versão anterior?"
          description="Os textos atuais serão substituídos pela última versão salva antes desta (mas poderão ser restaurados de novo, se necessário)."
          confirmLabel="Restaurar"
          confirmingLabel="Restaurando…"
          submitting={restoring}
          error={null}
          onCancel={() => setRestoreModalOpen(false)}
          onConfirm={() => void handleRestore()}
        />
      )}
    </div>
  );
}
