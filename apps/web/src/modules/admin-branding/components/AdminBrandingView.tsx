import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactElement,
} from "react";
import { getToken } from "../../../lib/auth";
import { resolveUploadedAssetUrl } from "../../../lib/assetUrls";
import { logger } from "../../../utils/logger";
import { DEFAULT_BRANDING, type PublicBranding } from "../../public-site/branding";
import { updateBrandingSnapshot } from "../../public-site/branding.runtime";

type AdminBrandingResponse = {
  branding?: unknown;
};

type UploadResponse = {
  url?: string;
};

const API_URL = import.meta.env.VITE_API_URL || "";
const LOGO_HISTORY_STORAGE_KEY = "jlr.admin.branding.logo-history.v1";
const LOGO_HISTORY_LIMIT = 8;
const LOGO_UPLOAD_MAX_SIZE_BYTES = 5 * 1024 * 1024;

const normalizeBranding = (value: unknown): PublicBranding => {
  if (!value || typeof value !== "object") return { ...DEFAULT_BRANDING };
  const candidate = value as Record<string, unknown>;
  const fullName = typeof candidate.fullName === "string" ? candidate.fullName.trim() : "";
  const shortName = typeof candidate.shortName === "string" ? candidate.shortName.trim() : "";
  const logoUrl = typeof candidate.logoUrl === "string" ? candidate.logoUrl.trim() : "";
  return {
    fullName: fullName || DEFAULT_BRANDING.fullName,
    shortName: shortName || DEFAULT_BRANDING.shortName,
    logoUrl: logoUrl || DEFAULT_BRANDING.logoUrl,
  };
};

const normalizeErrorMessage = async (response: Response): Promise<string> => {
  const data = (await response.json().catch(() => ({}))) as { message?: string; detail?: string };
  const message = data.message || "Falha ao processar requisição.";
  if (!data.detail) return message;
  return `${message} (${data.detail})`;
};

const normalizeLogoUrl = (value: string): string => value.trim();

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
    logger.warn("Falha ao ler historico local de logos", { error });
    return [];
  }
};

const persistLogoHistory = (history: string[]): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOGO_HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    logger.warn("Falha ao persistir historico local de logos", { error });
  }
};

export const AdminBrandingView = (): ReactElement => {
  const [form, setForm] = useState<PublicBranding>({ ...DEFAULT_BRANDING });
  const [savedBranding, setSavedBranding] = useState<PublicBranding>({ ...DEFAULT_BRANDING });
  const [logoHistory, setLogoHistory] = useState<string[]>(() => readLogoHistory());
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [uploadingLogo, setUploadingLogo] = useState<boolean>(false);
  const [revertingLogoUrl, setRevertingLogoUrl] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const logoFileInputRef = useRef<HTMLInputElement | null>(null);

  const pushLogoHistory = useCallback((entries: string[]): void => {
    setLogoHistory((current) => {
      const next = buildLogoHistory([...entries, ...current]);
      persistLogoHistory(next);
      return next;
    });
  }, []);

  const persistBranding = useCallback(async (payloadToSave: PublicBranding): Promise<PublicBranding> => {
    const token = getToken();
    if (!token) {
      throw new Error("Sessão expirada. Faça login novamente.");
    }

    const response = await fetch(`${API_URL}/api/admin/branding`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payloadToSave),
    });

    if (!response.ok) {
      throw new Error(await normalizeErrorMessage(response));
    }

    const payload = (await response.json()) as AdminBrandingResponse;
    return normalizeBranding(payload.branding ?? payloadToSave);
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
      const response = await fetch(`${API_URL}/api/admin/branding`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(await normalizeErrorMessage(response));
      }

      const payload = (await response.json()) as AdminBrandingResponse;
      const normalized = normalizeBranding(payload.branding);
      setForm(normalized);
      setSavedBranding(normalized);
      updateBrandingSnapshot(normalized);
      pushLogoHistory([normalized.logoUrl]);
    } catch (fetchError) {
      logger.error("Falha ao carregar branding no admin", { error: fetchError });
      setError(fetchError instanceof Error ? fetchError.message : "Falha ao carregar branding.");
    } finally {
      setLoading(false);
    }
  }, [pushLogoHistory]);

  useEffect(() => {
    loadBranding().catch(() => undefined);
  }, [loadBranding]);

  const hasChanges = useMemo(() => {
    const normalized = normalizeBranding(form);
    return (
      normalized.fullName !== savedBranding.fullName ||
      normalized.shortName !== savedBranding.shortName ||
      normalized.logoUrl !== savedBranding.logoUrl
    );
  }, [form, savedBranding]);

  const saveBranding = async (): Promise<void> => {
    setSaving(true);
    setError("");
    setSuccess("");

    const previousLogoUrl = savedBranding.logoUrl;

    try {
      const payloadToSave = normalizeBranding(form);
      const normalized = await persistBranding(payloadToSave);
      setForm(normalized);
      setSavedBranding(normalized);
      updateBrandingSnapshot(normalized);
      pushLogoHistory([normalized.logoUrl, previousLogoUrl]);
      setSuccess("Branding salvo com sucesso.");
    } catch (saveError) {
      logger.error("Falha ao salvar branding no admin", { error: saveError });
      setError(saveError instanceof Error ? saveError.message : "Falha ao salvar branding.");
    } finally {
      setSaving(false);
    }
  };

  const revertLogo = async (logoUrl: string): Promise<void> => {
    const targetLogoUrl = normalizeLogoUrl(logoUrl);
    if (!targetLogoUrl) return;

    setSaving(true);
    setRevertingLogoUrl(targetLogoUrl);
    setError("");
    setSuccess("");

    const previousLogoUrl = savedBranding.logoUrl;

    try {
      const payloadToSave = normalizeBranding({
        ...form,
        logoUrl: targetLogoUrl,
      });
      const normalized = await persistBranding(payloadToSave);
      setForm(normalized);
      setSavedBranding(normalized);
      updateBrandingSnapshot(normalized);
      pushLogoHistory([normalized.logoUrl, previousLogoUrl]);
      setSuccess("Logo revertida e salva com sucesso.");
    } catch (revertError) {
      logger.error("Falha ao reverter logo no admin", { error: revertError });
      setError(revertError instanceof Error ? revertError.message : "Falha ao reverter logo.");
    } finally {
      setSaving(false);
      setRevertingLogoUrl("");
    }
  };

  const handleLogoFileSelected = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Selecione um arquivo de imagem válido (PNG, JPG, WEBP, etc). ");
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
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_URL}/api/uploads`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await normalizeErrorMessage(response));
      }

      const payload = (await response.json()) as UploadResponse;
      const uploadedUrlRaw = normalizeLogoUrl(payload.url || "");
      if (!uploadedUrlRaw) {
        throw new Error("Upload concluído sem URL retornada pela API.");
      }

      const resolvedUploadedUrl = resolveUploadedAssetUrl(uploadedUrlRaw) || uploadedUrlRaw;
      setForm((current) => ({
        ...current,
        logoUrl: resolvedUploadedUrl,
      }));
      pushLogoHistory([resolvedUploadedUrl]);
      setSuccess('Upload concluído. URL preenchida automaticamente. Clique em "Salvar branding" para aplicar.');
    } catch (uploadError) {
      logger.error("Falha ao subir logo no admin", { error: uploadError });
      setError(uploadError instanceof Error ? uploadError.message : "Falha ao enviar imagem da logo.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const preview = normalizeBranding(form);
  const previewLogoUrl = resolveUploadedAssetUrl(preview.logoUrl) || preview.logoUrl;
  const controlsDisabled = loading || saving || uploadingLogo;

  return (
    <div className="max-w-[1400px] mx-auto p-8 flex flex-col gap-6" data-admin-branding-view>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-forest dark:text-white text-3xl display-hero text-shadow-strong italic">
            Branding Global
          </h2>
          <p className="text-stone-500 text-lg font-normal">
            Configure nome completo, nome curto e logo da marca global em
            <code className="mx-1">settings.public.branding</code>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="px-5 py-2 text-sm font-semibold rounded-lg bg-[#e7f3eb] text-forest-green hover:bg-[#d5e9db] transition-colors disabled:opacity-60"
            type="button"
            onClick={() => loadBranding()}
            disabled={controlsDisabled}
          >
            Recarregar
          </button>
          <button
            className="px-5 py-2 text-sm font-semibold rounded-lg bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors disabled:opacity-60"
            type="button"
            onClick={() => saveBranding()}
            disabled={controlsDisabled}
          >
            {saving ? "Salvando..." : "Salvar branding"}
          </button>
        </div>
      </header>

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
          Carregando branding...
        </section>
      ) : (
        <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)] items-start gap-6">
          <article className="bg-white rounded-xl border border-[#cfe7d1] shadow-sm p-6 flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-bold text-forest">Dados da Marca</h3>
              <p className="text-sm text-text-muted">
                Esses dados serão usados no menu, footer, heros e painel admin.
              </p>
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wider text-text-muted font-semibold">Nome completo</span>
              <input
                className="w-full border border-[#cfe7d1] rounded-lg px-4 py-2.5 bg-[#f6f8f6] text-forest-green focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                value={form.fullName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    fullName: event.target.value,
                  }))
                }
                placeholder="Ex.: JLR Beauty"
                type="text"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wider text-text-muted font-semibold">Nome curto</span>
              <input
                className="w-full border border-[#cfe7d1] rounded-lg px-4 py-2.5 bg-[#f6f8f6] text-forest-green focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                value={form.shortName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    shortName: event.target.value,
                  }))
                }
                placeholder="Ex.: JLR"
                type="text"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wider text-text-muted font-semibold">URL da logo</span>
              <input
                className="w-full border border-[#cfe7d1] rounded-lg px-4 py-2.5 bg-[#f6f8f6] text-forest-green focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                value={form.logoUrl}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    logoUrl: event.target.value,
                  }))
                }
                placeholder="Ex.: https://cdn.exemplo.com/logo.webp"
                type="text"
              />
            </label>

            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[#d6ccb3] bg-[#f8f2e6] p-3">
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
                className="h-9 px-4 rounded-lg border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-semibold disabled:opacity-60"
                type="button"
                onClick={() => logoFileInputRef.current?.click()}
                disabled={controlsDisabled}
              >
                {uploadingLogo ? "Enviando logo..." : "Upload da logo"}
              </button>
              <span className="text-xs text-text-muted">PNG, JPG ou WEBP ate 5MB.</span>
            </div>

            <div className="rounded-lg border border-[#d6ccb3] bg-[#f8f2e6] p-3 flex flex-col gap-2">
              <p className="text-xs uppercase tracking-wider text-text-muted font-semibold">Ultimas logos</p>
              {logoHistory.length === 0 ? (
                <p className="text-xs text-text-muted">Sem historico de logos neste navegador.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {logoHistory.map((historyUrl) => {
                    const isCurrentSavedLogo = historyUrl === normalizeLogoUrl(savedBranding.logoUrl);
                    const isReverting = revertingLogoUrl === historyUrl;
                    return (
                      <div
                        key={historyUrl}
                        className="flex items-center justify-between gap-3 rounded-lg border border-[#d9c9a3] bg-white px-3 py-2"
                      >
                        <p className="text-[11px] text-forest-green truncate" title={historyUrl}>
                          {historyUrl}
                        </p>
                        <button
                          className="h-8 px-3 rounded-lg border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-[11px] font-semibold disabled:opacity-60"
                          type="button"
                          disabled={controlsDisabled || isCurrentSavedLogo}
                          onClick={() => {
                            void revertLogo(historyUrl);
                          }}
                        >
                          {isCurrentSavedLogo ? "Em uso" : isReverting ? "Revertendo..." : "Reverter"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <p className="text-xs text-text-muted">
              {hasChanges ? "Existem alteracoes nao salvas no formulario." : "Formulario alinhado com o branding salvo."}
            </p>
          </article>

          <article className="bg-white rounded-xl border border-[#cfe7d1] shadow-sm p-6 flex flex-col gap-4 xl:sticky xl:top-24 overflow-hidden">
            <div>
              <h3 className="text-lg font-bold text-forest">Pre-visualizacao</h3>
              <p className="text-sm text-text-muted">Visual instantaneo da identidade usada no frontend.</p>
            </div>
            <div className="rounded-xl border border-[#d6ccb3] bg-[#f8f6ef] p-4 flex flex-col gap-4">
              <div className="h-[240px] w-full rounded-lg bg-white border border-[#d6ccb3] overflow-hidden flex items-center justify-center p-4">
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
          </article>
        </section>
      )}
    </div>
  );
};
