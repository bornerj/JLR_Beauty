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
import {
  getMediaSlotCatalog,
  normalizePublicMediaSlotsSnapshot,
  type MediaSlotId,
  type PublicMediaSlotCatalogItem,
  type PublicMediaSlotsSnapshot,
} from "../../public-site/mediaSlots";
import { updateMediaSlotsSnapshot } from "../../public-site/media.runtime";

type AdminMediaSlotsResponse = {
  slots?: unknown;
};

type UploadResponse = {
  url?: string;
};

const API_URL = import.meta.env.VITE_API_URL || "";
const MEDIA_UPLOAD_MAX_SIZE_BYTES = 5 * 1024 * 1024;
const PAGE_ORDER = ["home", "franquias", "assinaturas", "checkout"];

const normalizeErrorMessage = async (response: Response): Promise<string> => {
  const data = (await response.clone().json().catch(() => null)) as
    | { message?: string; detail?: string }
    | null;
  const message = data?.message?.trim();
  const detail = data?.detail?.trim();

  if (message && detail) return `${message} (${detail})`;
  if (message) return message;

  const rawText = (await response.text().catch(() => "")).trim();
  if (rawText) {
    const compact = rawText.replace(/\s+/g, " ").slice(0, 180);
    return `Falha na requisição (status ${response.status}): ${compact}`;
  }

  return `Falha na requisição (status ${response.status}).`;
};

const buildCatalogByPage = (
  catalog: PublicMediaSlotCatalogItem[]
): Array<{ page: string; slots: PublicMediaSlotCatalogItem[] }> => {
  const grouped = catalog.reduce<Record<string, PublicMediaSlotCatalogItem[]>>((acc, slot) => {
    const key = slot.page;
    if (!acc[key]) acc[key] = [];
    acc[key].push(slot);
    return acc;
  }, {});

  const pageIndex = new Map<string, number>(PAGE_ORDER.map((page, index) => [page, index]));

  return Object.entries(grouped)
    .map(([page, slots]) => ({
      page,
      slots: [...slots].sort((left, right) => {
        if (left.section === right.section) return left.order - right.order;
        return left.section.localeCompare(right.section, "pt-BR");
      }),
    }))
    .sort((left, right) => {
      const leftOrder = pageIndex.get(left.page) ?? Number.MAX_SAFE_INTEGER;
      const rightOrder = pageIndex.get(right.page) ?? Number.MAX_SAFE_INTEGER;
      if (leftOrder !== rightOrder) return leftOrder - rightOrder;
      return left.page.localeCompare(right.page, "pt-BR");
    });
};

export const AdminMediaGalleryView = (): ReactElement => {
  const mediaCatalog = useMemo(() => getMediaSlotCatalog(), []);

  const [formSlots, setFormSlots] = useState<PublicMediaSlotsSnapshot>(() =>
    normalizePublicMediaSlotsSnapshot({})
  );
  const [savedSlots, setSavedSlots] = useState<PublicMediaSlotsSnapshot>(() =>
    normalizePublicMediaSlotsSnapshot({})
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [uploadingSlotId, setUploadingSlotId] = useState<MediaSlotId | "">("");
  const [uploadTargetSlotId, setUploadTargetSlotId] = useState<MediaSlotId | "">("");
  const [editorSlotId, setEditorSlotId] = useState<MediaSlotId | "">("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const groupedCatalog = useMemo(() => buildCatalogByPage(mediaCatalog), [mediaCatalog]);

  const hasChanges = useMemo(() => {
    return mediaCatalog.some((slot) => formSlots[slot.id] !== savedSlots[slot.id]);
  }, [formSlots, mediaCatalog, savedSlots]);

  const editorSlot = useMemo(() => {
    if (!editorSlotId) return null;
    return mediaCatalog.find((slot) => slot.id === editorSlotId) ?? null;
  }, [editorSlotId, mediaCatalog]);

  const slotHasUnsavedChange = useMemo(() => {
    if (!editorSlotId) return false;
    return formSlots[editorSlotId] !== savedSlots[editorSlotId];
  }, [editorSlotId, formSlots, savedSlots]);

  const closeEditor = useCallback((): void => {
    if (!editorSlotId) return;
    if (slotHasUnsavedChange) {
      const shouldClose = window.confirm(
        "Este slot tem alterações não salvas. Deseja fechar sem salvar?"
      );
      if (!shouldClose) return;
    }
    setEditorSlotId("");
  }, [editorSlotId, slotHasUnsavedChange]);

  useEffect(() => {
    if (!editorSlotId) return;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== "Escape") return;
      closeEditor();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeEditor, editorSlotId]);

  const loadMediaSlots = useCallback(async (): Promise<void> => {
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
      const response = await fetch(`${API_URL}/api/admin/media-slots`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(await normalizeErrorMessage(response));
      }
      const payload = (await response.json()) as AdminMediaSlotsResponse;
      const normalized = normalizePublicMediaSlotsSnapshot(payload.slots);
      setFormSlots(normalized);
      setSavedSlots(normalized);
      updateMediaSlotsSnapshot(normalized);
    } catch (fetchError) {
      logger.error("Falha ao carregar media slots no admin", { error: fetchError });
      setError(fetchError instanceof Error ? fetchError.message : "Falha ao carregar galeria.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMediaSlots().catch(() => undefined);
  }, [loadMediaSlots]);

  const saveMediaSlots = async (): Promise<boolean> => {
    const token = getToken();
    if (!token) {
      setError("Sessão expirada. Faça login novamente.");
      return false;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_URL}/api/admin/media-slots`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ slots: formSlots }),
      });
      if (!response.ok) {
        throw new Error(await normalizeErrorMessage(response));
      }
      const payload = (await response.json()) as AdminMediaSlotsResponse;
      const normalized = normalizePublicMediaSlotsSnapshot(payload.slots ?? formSlots);
      setFormSlots(normalized);
      setSavedSlots(normalized);
      updateMediaSlotsSnapshot(normalized);
      setSuccess("Galeria de mídias salva com sucesso.");
      return true;
    } catch (saveError) {
      logger.error("Falha ao salvar media slots no admin", { error: saveError });
      setError(saveError instanceof Error ? saveError.message : "Falha ao salvar galeria.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveEditorSlot = async (): Promise<void> => {
    const didSave = await saveMediaSlots();
    if (didSave) setEditorSlotId("");
  };

  const setSlotValue = (slotId: MediaSlotId, value: string): void => {
    setFormSlots((current) => ({
      ...current,
      [slotId]: value,
    }));
    setSuccess("");
    setError("");
  };

  const revertSlotToFallback = (slot: PublicMediaSlotCatalogItem): void => {
    setSlotValue(slot.id, slot.fallbackUrl);
    setSuccess(`Slot ${slot.id} revertido para o fallback. Clique em "Salvar galeria" para persistir.`);
  };

  const requestUploadForSlot = (slotId: MediaSlotId): void => {
    setUploadTargetSlotId(slotId);
    fileInputRef.current?.click();
  };

  const uploadFileToSlot = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";

    if (!file || !uploadTargetSlotId) {
      setUploadTargetSlotId("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Selecione um arquivo de imagem válido (PNG, JPG, WEBP, etc).");
      setSuccess("");
      setUploadTargetSlotId("");
      return;
    }

    if (file.size > MEDIA_UPLOAD_MAX_SIZE_BYTES) {
      setError("A imagem excede 5MB. Envie um arquivo menor.");
      setSuccess("");
      setUploadTargetSlotId("");
      return;
    }

    const token = getToken();
    if (!token) {
      setError("Sessão expirada. Faça login novamente.");
      setSuccess("");
      setUploadTargetSlotId("");
      return;
    }

    const slotId = uploadTargetSlotId;
    setUploadTargetSlotId("");
    setUploadingSlotId(slotId);
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
      const uploadedUrl = (payload.url || "").trim();
      if (!uploadedUrl) {
        throw new Error("Upload concluído sem URL retornada pela API.");
      }

      const resolvedUploadedUrl = resolveUploadedAssetUrl(uploadedUrl) || uploadedUrl;
      setSlotValue(slotId, resolvedUploadedUrl);
      setSuccess(`Upload concluído para ${slotId}. Clique em "Salvar galeria" para persistir.`);
    } catch (uploadError) {
      logger.error("Falha ao subir imagem de media slot no admin", { error: uploadError });
      setError(uploadError instanceof Error ? uploadError.message : "Falha ao enviar imagem.");
    } finally {
      setUploadingSlotId("");
    }
  };

  const controlsDisabled = loading || saving;

  return (
    <div className="max-w-[1400px] mx-auto p-8 flex flex-col gap-6" data-admin-media-gallery-view>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          void uploadFileToSlot(event);
        }}
      />

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-forest dark:text-white text-3xl display-hero text-shadow-strong italic">
            Galeria de Mídias
          </h2>
          <p className="text-stone-500 text-lg font-normal">
            Catálogo institucional de imagens do site em{" "}
            <code className="mx-1">settings.public.mediaSlots</code>.
          </p>
          <p className="text-xs text-text-muted">
            Escopo desta galeria: imagens institucionais (não inclui logo e nem imagens do catálogo de
            produtos).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="px-5 py-2 text-sm font-semibold rounded-lg bg-[#e7f3eb] text-forest-green hover:bg-[#d5e9db] transition-colors disabled:opacity-60"
            type="button"
            onClick={() => {
              void loadMediaSlots();
            }}
            disabled={controlsDisabled}
          >
            Recarregar
          </button>
          <button
            className="px-5 py-2 text-sm font-semibold rounded-lg bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors disabled:opacity-60"
            type="button"
            onClick={() => {
              void saveMediaSlots();
            }}
            disabled={controlsDisabled || !hasChanges}
          >
            {saving ? "Salvando..." : "Salvar galeria"}
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
          Carregando slots de mídia...
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-5">
          {groupedCatalog.map(({ page, slots }) => {
            const numCols = 4;
            const columns: typeof slots[number][][] = Array.from({ length: numCols }, () => []);
            slots.forEach((slot, i) => columns[i % numCols].push(slot));

            return (
              <article key={page} className="bg-gray-100 rounded-2xl p-4 md:p-5">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <h3 className="text-xl font-bold text-forest uppercase tracking-wider">{page}</h3>
                  <span className="text-xs text-stone-500">{slots.length} slots</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {columns.map((colSlots, colIdx) => (
                    <div key={colIdx} className="grid gap-3 content-start">
                      {colSlots.map((slot) => {
                        const currentValue = formSlots[slot.id];
                        const currentPreviewUrl = resolveUploadedAssetUrl(currentValue) || currentValue;

                        return (
                          <button
                            key={slot.id}
                            type="button"
                            className="w-full text-left group"
                            onClick={() => {
                              setEditorSlotId(slot.id);
                            }}
                          >
                            <div className="relative overflow-hidden rounded-xl shadow-sm">
                              <img
                                src={currentPreviewUrl}
                                alt={slot.label}
                                className="h-auto max-w-full w-full block rounded-xl transition-transform duration-500 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 rounded-xl pointer-events-none" />
                            </div>
                            <p className="mt-1.5 text-xs text-gray-600 font-semibold truncate px-0.5">
                              {slot.label}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </section>
      )}

      {editorSlot ? (
        <div
          className="fixed inset-0 z-[80] bg-black/45 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeEditor}
        >
          <section
            className="w-full max-w-3xl max-h-[88vh] overflow-y-auto rounded-2xl border border-[#d6ccb3] bg-white shadow-2xl p-5 flex flex-col gap-4"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xl font-bold text-forest">{editorSlot.label}</h4>
                <p className="text-xs text-text-muted">
                  <code>{editorSlot.id}</code> · {editorSlot.page}/{editorSlot.section}
                </p>
              </div>
              <button
                type="button"
                className="h-9 w-9 rounded-full border border-[#d6ccb3] text-forest-green hover:bg-[#f6f8f6]"
                onClick={closeEditor}
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </header>

            <div className="mx-auto w-full max-w-[640px] h-[260px] md:h-[320px] rounded-xl overflow-hidden border border-[#d6ccb3] bg-[#f5f7f5] p-3 flex items-center justify-center">
              <img
                src={resolveUploadedAssetUrl(formSlots[editorSlot.id]) || formSlots[editorSlot.id]}
                alt={editorSlot.label}
                className="max-w-full max-h-full w-auto h-auto object-contain"
              />
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">
                URL do slot
              </span>
              <input
                className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-white text-forest-green focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-xs"
                value={formSlots[editorSlot.id]}
                onChange={(event) => setSlotValue(editorSlot.id, event.target.value)}
                placeholder={editorSlot.fallbackUrl}
                type="text"
                disabled={controlsDisabled}
              />
            </label>

            <p className="text-[11px] text-text-muted break-all">
              Fallback: <code>{editorSlot.fallbackUrl}</code>
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                className="h-9 px-4 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors text-xs font-semibold disabled:opacity-60"
                type="button"
                onClick={() => {
                  void saveEditorSlot();
                }}
                disabled={controlsDisabled || !slotHasUnsavedChange}
              >
                {saving ? "Salvando..." : "Salvar e fechar"}
              </button>
              <button
                className="h-9 px-4 rounded-lg border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-semibold disabled:opacity-60"
                type="button"
                onClick={() => requestUploadForSlot(editorSlot.id)}
                disabled={controlsDisabled}
              >
                {uploadingSlotId === editorSlot.id ? "Enviando..." : "Upload"}
              </button>
              <button
                className="h-9 px-4 rounded-lg border border-[#d6ccb3] bg-white text-forest-green hover:bg-[#f6f8f6] transition-colors text-xs font-semibold disabled:opacity-60"
                type="button"
                onClick={() => revertSlotToFallback(editorSlot)}
                disabled={controlsDisabled || formSlots[editorSlot.id] === editorSlot.fallbackUrl}
              >
                Reverter fallback
              </button>
              <button
                className="h-9 px-4 rounded-lg border border-[#d6ccb3] bg-white text-forest-green hover:bg-[#f6f8f6] transition-colors text-xs font-semibold"
                type="button"
                onClick={closeEditor}
              >
                Fechar sem salvar
              </button>
            </div>

            {slotHasUnsavedChange ? (
              <p className="text-[11px] text-amber-700">
                Alterações pendentes neste slot. Use <strong>Salvar e fechar</strong> para persistir.
              </p>
            ) : null}
          </section>
        </div>
      ) : null}

      <p className="text-xs text-text-muted">
        {hasChanges
          ? "Existem alterações não salvas na galeria."
          : "Galeria alinhada com o snapshot salvo no backend."}
      </p>
    </div>
  );
};
