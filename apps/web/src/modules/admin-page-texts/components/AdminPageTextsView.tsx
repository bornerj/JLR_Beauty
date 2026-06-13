import { useState, useEffect, type ReactElement } from "react";
import { type PageTextValue, type TextSegment, isSegmented } from "../../public-site/pageTexts";
import { SegmentEditor } from "./SegmentEditor";

const API_URL = import.meta.env.VITE_API_URL || "";

type CatalogEntry = {
  key: string;
  page: string;
  section: string;
  label: string;
  type: "simple" | "segmented";
  defaultValue: PageTextValue;
};

type PageTextsMap = Record<string, PageTextValue>;

type LoadState = "idle" | "loading" | "success" | "error" | "saving";

const PAGE_LABELS: Record<string, string> = {
  home: "Home",
  franquias: "Franquias",
  assinaturas: "Assinaturas",
  global: "Missão & Valores",
};

const SECTION_LABELS: Record<string, string> = {
  hero: "Hero",
  about: "Sobre",
  cta: "CTA",
  services: "Serviços",
  membership: "Assinaturas",
  testimonials: "Depoimentos",
  models: "Modelos",
  vision: "Visão",
  contact: "Contato",
  mission: "Missão",
};

export const AdminPageTextsView = (): ReactElement => {
  const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
  const [texts, setTexts] = useState<PageTextsMap>({});
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [activePage, setActivePage] = useState<string>("home");
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async (): Promise<void> => {
      setLoadState("loading");
      try {
        const token = localStorage.getItem("jlr_token") ?? "";
        const res = await fetch(`${API_URL}/api/admin/page-texts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = (await res.json()) as { catalog: CatalogEntry[]; texts: PageTextsMap };
        setCatalog(data.catalog ?? []);
        setTexts(data.texts ?? {});
        setLoadState("success");

        const firstPage = data.catalog[0]?.page ?? "home";
        setActivePage(firstPage);
        const firstSection = data.catalog.find((e) => e.page === firstPage)?.section ?? "";
        if (firstSection) setOpenSections(new Set([`${firstPage}.${firstSection}`]));
      } catch {
        setErrorMessage("Não foi possível carregar os textos.");
        setLoadState("error");
      }
    };
    void load();
  }, []);

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

  const handleSave = async (): Promise<void> => {
    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const token = localStorage.getItem("jlr_token") ?? "";
      const res = await fetch(`${API_URL}/api/admin/page-texts`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ texts }),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      setSuccessMessage("Textos salvos com sucesso!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch {
      setErrorMessage("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const pages = Array.from(new Set(catalog.map((e) => e.page)));

  const sectionsForPage = (page: string): string[] =>
    Array.from(new Set(catalog.filter((e) => e.page === page).map((e) => e.section)));

  const entriesForSection = (page: string, section: string): CatalogEntry[] =>
    catalog.filter((e) => e.page === page && e.section === section);

  if (loadState === "loading") {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div className="p-8 text-sm text-red-600 bg-red-50 rounded-xl border border-red-200">
        {errorMessage}
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-forest display-hero">Textos das Páginas</h1>
          <p className="text-sm text-forest/60 mt-1">Edite os textos visíveis do site público.</p>
        </div>
        <button
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-white font-bold text-sm uppercase tracking-widest hover:bg-primary/90 transition-colors disabled:opacity-60"
          type="button"
          disabled={saving}
          onClick={handleSave}
        >
          <span className="material-symbols-outlined text-base">{saving ? "progress_activity" : "save"}</span>
          {saving ? "Salvando..." : "Salvar tudo"}
        </button>
      </div>

      {successMessage && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-700 flex items-center gap-2">
          <span className="material-symbols-outlined text-base">check_circle</span>
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600">
          {errorMessage}
        </div>
      )}

      {/* Page tabs */}
      <div className="flex gap-2 border-b border-[#cfe7d1]">
        {pages.map((page) => (
          <button
            key={page}
            type="button"
            className={`px-5 py-2 text-sm font-semibold uppercase tracking-wider rounded-t-lg border-b-2 transition-colors ${
              activePage === page
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-forest/60 hover:text-forest"
            }`}
            onClick={() => setActivePage(page)}
          >
            {PAGE_LABELS[page] ?? page}
          </button>
        ))}
      </div>

      {/* Sections accordion */}
      <div className="flex flex-col gap-3">
        {sectionsForPage(activePage).map((section) => {
          const sectionKey = `${activePage}.${section}`;
          const isOpen = openSections.has(sectionKey);
          const entries = entriesForSection(activePage, section);

          return (
            <div key={sectionKey} className="rounded-xl border border-[#cfe7d1] overflow-hidden">
              <button
                type="button"
                className="w-full flex items-center justify-between px-5 py-3 bg-[#f6f8f6] hover:bg-champagne/40 transition-colors"
                onClick={() => toggleSection(sectionKey)}
              >
                <span className="font-semibold text-sm uppercase tracking-widest text-forest">
                  {SECTION_LABELS[section] ?? section}
                  <span className="ml-2 text-forest/40 font-normal normal-case tracking-normal">
                    ({entries.length} campo{entries.length !== 1 ? "s" : ""})
                  </span>
                </span>
                <span className={`material-symbols-outlined text-forest/60 transition-transform ${isOpen ? "rotate-180" : ""}`}>
                  expand_more
                </span>
              </button>

              {isOpen && (
                <div className="flex flex-col divide-y divide-[#cfe7d1]/50">
                  {entries.map((entry) => {
                    const currentValue = texts[entry.key] ?? entry.defaultValue;

                    return (
                      <div key={entry.key} className="px-5 py-4 flex flex-col gap-2">
                        <label className="text-xs font-semibold uppercase tracking-widest text-forest/60">
                          {entry.label}
                          {entry.label.includes("{fullName}") && (
                            <span className="ml-2 normal-case tracking-normal font-normal text-gold">
                              — use {"{fullName}"} para inserir o nome do salão
                            </span>
                          )}
                        </label>

                        {entry.type === "simple" ? (
                          <textarea
                            className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 text-sm bg-[#f6f8f6] text-forest resize-y min-h-[2.5rem]"
                            rows={currentValue && String(currentValue).length > 80 ? 3 : 1}
                            value={typeof currentValue === "string" ? currentValue : ""}
                            onChange={(e) => handleSimpleChange(entry.key, e.target.value)}
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
    </div>
  );
};
