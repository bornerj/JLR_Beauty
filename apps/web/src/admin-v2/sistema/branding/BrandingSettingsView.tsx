import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { getToken } from "../../../lib/auth";
import { resolveUploadedAssetUrl } from "../../../lib/assetUrls";
import { logger } from "../../../utils/logger";
import { DEFAULT_BRANDING, type PublicBranding } from "../../../modules/public-site/branding";
import { updateBrandingSnapshot } from "../../../modules/public-site/branding.runtime";
import { fetchBranding, updateBranding, uploadAsset } from "../../shared/api";

/**
 * Admin V2 (PLAN-0026, Onda 3) — Branding Global, tier P (config-form). Reusa
 * `/api/admin/branding` sem alteração (`DECISION-014` regra #2); mesmos 3 campos e mesma
 * lógica do legado (`admin-branding/components/AdminBrandingView.tsx`, 496 linhas, já era
 * React puro): nome completo, nome curto, logo (upload ou URL manual) com histórico local
 * de reversão (localStorage, não é dado de servidor) e pré-visualização ao vivo. Chama
 * `updateBrandingSnapshot` após salvar pra refletir instantaneamente no site público, igual
 * ao legado.
 */

const LOGO_HISTORY_STORAGE_KEY = "jlr.admin.branding.logo-history.v1";
const LOGO_HISTORY_LIMIT = 8;
const LOGO_UPLOAD_MAX_SIZE_BYTES = 5 * 1024 * 1024;

const normalizeLogoUrl = (value: string): string => value.trim();

const normalizeBranding = (value: PublicBranding): PublicBranding => {
  const fullName = value.fullName.trim();
  const shortName = value.shortName.trim();
  const logoUrl = value.logoUrl.trim();
  return {
    ...value, // preserva whatsappPhone — não editável por este form (config de env var)
    fullName: fullName || DEFAULT_BRANDING.fullName,
    shortName: shortName || DEFAULT_BRANDING.shortName,
    logoUrl: logoUrl || DEFAULT_BRANDING.logoUrl,
  };
};

const buildLogoHistory = (entries: string[]): string[] => {
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const entry of entries) {
    const normalized = normalizeLogoUrl(entry);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    unique.push(normalized);
    if (unique.length >= LOGO_HISTORY_LIMIT) break;
  }
  return unique;
};

const readLogoHistory = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOGO_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return buildLogoHistory(parsed.filter((item) => typeof item === "string") as string[]);
  } catch (error) {
    logger.warn("Falha ao ler histórico local de logos (Admin V2)", { error });
    return [];
  }
};

const persistLogoHistory = (history: string[]): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOGO_HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    logger.warn("Falha ao persistir histórico local de logos (Admin V2)", { error });
  }
};

export function BrandingSettingsView() {
  const [form, setForm] = useState<PublicBranding>({ ...DEFAULT_BRANDING });
  const [savedBranding, setSavedBranding] = useState<PublicBranding>({ ...DEFAULT_BRANDING });
  const [logoHistory, setLogoHistory] = useState<string[]>(() => readLogoHistory());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const logoFileInputRef = useRef<HTMLInputElement | null>(null);

  const pushLogoHistory = useCallback((entries: string[]): void => {
    setLogoHistory((current) => {
      const next = buildLogoHistory([...entries, ...current]);
      persistLogoHistory(next);
      return next;
    });
  }, []);

  const loadBranding = useCallback(async (): Promise<void> => {
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
      const branding = normalizeBranding(await fetchBranding({ token }));
      setForm(branding);
      setSavedBranding(branding);
      updateBrandingSnapshot(branding);
      pushLogoHistory([branding.logoUrl]);
    } catch (fetchError) {
      logger.warn("Falha ao carregar branding (Admin V2)", { error: fetchError });
      setError(fetchError instanceof Error ? fetchError.message : "Falha ao carregar branding.");
    } finally {
      setLoading(false);
    }
  }, [pushLogoHistory]);

  useEffect(() => {
    void loadBranding();
  }, [loadBranding]);

  const hasChanges = useMemo(() => {
    const normalized = normalizeBranding(form);
    return (
      normalized.fullName !== savedBranding.fullName ||
      normalized.shortName !== savedBranding.shortName ||
      normalized.logoUrl !== savedBranding.logoUrl
    );
  }, [form, savedBranding]);

  const saveBranding = async (payloadOverride?: PublicBranding): Promise<void> => {
    const token = getToken();
    if (!token) {
      setError("Sessão expirada. Faça login novamente.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    const previousLogoUrl = savedBranding.logoUrl;
    try {
      const payloadToSave = normalizeBranding(payloadOverride ?? form);
      const branding = await updateBranding({ token, input: payloadToSave });
      setForm(branding);
      setSavedBranding(branding);
      updateBrandingSnapshot(branding);
      pushLogoHistory([branding.logoUrl, previousLogoUrl]);
      setSuccess("Branding salvo com sucesso.");
    } catch (saveError) {
      logger.warn("Falha ao salvar branding (Admin V2)", { error: saveError });
      setError(saveError instanceof Error ? saveError.message : "Falha ao salvar branding.");
    } finally {
      setSaving(false);
    }
  };

  const revertLogo = (logoUrl: string): void => {
    // Só atualiza o rascunho local (mesmo padrão do upload de logo e de
    // MediaGalleryView.revertSlotToFallback) — não salva no backend sozinho,
    // pra não arrastar junto edições não salvas de fullName/shortName (ERR-0077).
    const targetLogoUrl = normalizeLogoUrl(logoUrl);
    if (!targetLogoUrl) return;
    setForm((current) => ({ ...current, logoUrl: targetLogoUrl }));
    pushLogoHistory([targetLogoUrl]);
    setSuccess('Logo revertida no formulário. Clique em "Salvar branding" para aplicar.');
  };

  const handleLogoFileSelected = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Selecione um arquivo de imagem válido (PNG, JPG, WEBP, etc).");
      setSuccess("");
      return;
    }
    if (file.size > LOGO_UPLOAD_MAX_SIZE_BYTES) {
      setError("A imagem excede 5MB. Envie um arquivo menor.");
      setSuccess("");
      return;
    }

    const token = getToken();
    if (!token) {
      setError("Sessão expirada. Faça login novamente.");
      setSuccess("");
      return;
    }

    setUploadingLogo(true);
    setError("");
    setSuccess("");
    try {
      const uploadedUrlRaw = normalizeLogoUrl(await uploadAsset({ token, file }));
      const resolvedUploadedUrl = resolveUploadedAssetUrl(uploadedUrlRaw) || uploadedUrlRaw;
      setForm((current) => ({ ...current, logoUrl: resolvedUploadedUrl }));
      pushLogoHistory([resolvedUploadedUrl]);
      setSuccess('Upload concluído. URL preenchida automaticamente. Clique em "Salvar branding" para aplicar.');
    } catch (uploadError) {
      logger.warn("Falha ao subir logo (Admin V2)", { error: uploadError });
      setError(uploadError instanceof Error ? uploadError.message : "Falha ao enviar imagem da logo.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const preview = normalizeBranding(form);
  const previewLogoUrl = resolveUploadedAssetUrl(preview.logoUrl) || preview.logoUrl;
  const controlsDisabled = loading || saving || uploadingLogo;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-forest">Branding Global</h1>
          <p className="text-base text-stone-600 dark:text-stone-400">
            nome completo, nome curto e logo da marca — usados em menu, footer, heróis e no
            próprio painel admin (<code>settings.public.branding</code>)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void loadBranding()}
            disabled={controlsDisabled}
            className="rounded-full border border-gold/40 bg-white px-4 py-2 text-xs font-semibold text-forest hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-forest"
          >
            Recarregar
          </button>
          <button
            type="button"
            onClick={() => void saveBranding()}
            disabled={controlsDisabled}
            className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Salvando…" : "Salvar branding"}
          </button>
        </div>
      </div>

      {loading && <p className="text-sm text-stone-600 dark:text-stone-400">Carregando branding…</p>}
      {error && <p className="text-sm font-semibold text-state-critical">{error}</p>}
      {success && <p className="text-sm font-semibold text-state-healthy">{success}</p>}

      {!loading && (
        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
          <div className="flex flex-col gap-4 rounded-xl border border-[#cfe7d1] bg-white p-5 dark:border-forest-green dark:bg-forest">
            <div>
              <h3 className="text-lg font-bold text-forest">Dados da Marca</h3>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                Esses dados serão usados no menu, footer, heróis e painel admin.
              </p>
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                Nome completo
              </span>
              <input
                type="text"
                value={form.fullName}
                onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                placeholder="Ex.: JLR Beauty"
                className="rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                Nome curto
              </span>
              <input
                type="text"
                value={form.shortName}
                onChange={(event) => setForm((current) => ({ ...current, shortName: event.target.value }))}
                placeholder="Ex.: JLR"
                className="rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                URL da logo
              </span>
              <input
                type="text"
                value={form.logoUrl}
                onChange={(event) => setForm((current) => ({ ...current, logoUrl: event.target.value }))}
                placeholder="Ex.: https://cdn.exemplo.com/logo.webp"
                className="rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
              />
            </label>

            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gold/40 bg-primary/5 p-3">
              <input
                ref={logoFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  void handleLogoFileSelected(event);
                }}
              />
              <button
                type="button"
                onClick={() => logoFileInputRef.current?.click()}
                disabled={controlsDisabled}
                className="h-9 rounded-lg border border-primary/30 bg-primary/10 px-4 text-xs font-semibold text-primary hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploadingLogo ? "Enviando logo…" : "Upload da logo"}
              </button>
              <span className="text-xs text-stone-500 dark:text-stone-400">PNG, JPG ou WEBP até 5MB.</span>
            </div>

            <div className="flex flex-col gap-2 rounded-lg border border-gold/40 bg-primary/5 p-3">
              <p className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                Últimas logos
              </p>
              {logoHistory.length === 0 ? (
                <p className="text-xs text-stone-500 dark:text-stone-400">Sem histórico de logos neste navegador.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {logoHistory.map((historyUrl) => {
                    const isCurrentSavedLogo = historyUrl === normalizeLogoUrl(savedBranding.logoUrl);
                    return (
                      <div
                        key={historyUrl}
                        className="flex items-center justify-between gap-3 rounded-lg border border-gold/30 bg-white px-3 py-2 dark:bg-forest-green"
                      >
                        <p className="truncate text-[11px] text-forest dark:text-stone-200" title={historyUrl}>
                          {historyUrl}
                        </p>
                        <button
                          type="button"
                          disabled={controlsDisabled || isCurrentSavedLogo}
                          onClick={() => revertLogo(historyUrl)}
                          className="h-8 rounded-lg border border-primary/30 bg-primary/10 px-3 text-[11px] font-semibold text-primary hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isCurrentSavedLogo ? "Em uso" : "Reverter"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <p className="text-xs text-stone-500 dark:text-stone-400">
              {hasChanges ? "Existem alterações não salvas no formulário." : "Formulário alinhado com o branding salvo."}
            </p>
          </div>

          <div className="flex flex-col gap-4 overflow-hidden rounded-xl border border-[#cfe7d1] bg-white p-5 xl:sticky xl:top-24 dark:border-forest-green dark:bg-forest">
            <div>
              <h3 className="text-lg font-bold text-forest">Pré-visualização</h3>
              <p className="text-sm text-stone-500 dark:text-stone-400">Visual instantâneo da identidade usada no frontend.</p>
            </div>
            <div className="flex flex-col gap-4 rounded-xl border border-gold/40 bg-primary/5 p-4">
              <div className="flex h-[240px] w-full items-center justify-center overflow-hidden rounded-lg border border-gold/40 bg-white p-4">
                <img
                  src={previewLogoUrl}
                  alt={preview.fullName}
                  className="block h-full w-full object-contain"
                  style={{ maxWidth: "100%", maxHeight: "100%" }}
                  onLoad={(event) => {
                    event.currentTarget.style.display = "block";
                  }}
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm uppercase tracking-[0.24em] text-gold">{preview.shortName}</p>
                <p className="text-xl font-semibold text-forest">{preview.fullName}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
