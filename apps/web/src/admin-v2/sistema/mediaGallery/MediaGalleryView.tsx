import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { getToken } from "../../../lib/auth";
import { resolveUploadedAssetUrl } from "../../../lib/assetUrls";
import { logger } from "../../../utils/logger";
import {
  getMediaSlotCatalog,
  normalizePublicMediaSlotsSnapshot,
  type MediaSlotId,
  type PublicMediaSlotCatalogItem,
  type PublicMediaSlotsSnapshot,
} from "../../../modules/public-site/mediaSlots";
import { updateMediaSlotsSnapshot } from "../../../modules/public-site/media.runtime";
import { fetchMediaSlots, saveMediaSlots, uploadAsset } from "../../shared/api";
import { DeleteConfirmModal } from "../../shell/DeleteConfirmModal";

/**
 * Admin V2 (PLAN-0026, Onda 7) — Galeria de Mídias, tier P (já era React puro no legado,
 * 519 linhas). Reusa `/api/admin/media-slots` (+ `/api/uploads` genérico) sem alteração.
 * 78 slots institucionais, agrupados por página, cada um clicável pra um editor em modal
 * (preview + URL manual + upload + reverter fallback). Mesmo fallback em cascata do legado
 * (banco → catálogo local `modules/public-site/mediaSlots.ts` → fallback por slot) — catálogo
 * vem do módulo utilitário compartilhado, não da API, igual ao original.
 *
 * **Contrato "manda o mapa inteiro"** (mesma pegadinha da Onda 5): `saveMediaSlots` sempre
 * envia os 78 slots completos, nunca um diff.
 */

const PAGE_ORDER = ["home", "franquias", "assinaturas", "checkout"];
const MEDIA_UPLOAD_MAX_SIZE_BYTES = 5 * 1024 * 1024;

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

type LoadState = { loading: boolean; error: string | null };

export function MediaGalleryView() {
  const mediaCatalog = useMemo(() => getMediaSlotCatalog(), []);
  const groupedCatalog = useMemo(() => buildCatalogByPage(mediaCatalog), [mediaCatalog]);

  const [formSlots, setFormSlots] = useState<PublicMediaSlotsSnapshot>(() => normalizePublicMediaSlotsSnapshot({}));
  const [savedSlots, setSavedSlots] = useState<PublicMediaSlotsSnapshot>(() => normalizePublicMediaSlotsSnapshot({}));
  const [state, setState] = useState<LoadState>({ loading: true, error: null });
  const [saving, setSaving] = useState(false);
  const [uploadingSlotId, setUploadingSlotId] = useState<MediaSlotId | "">("");
  const [uploadTargetSlotId, setUploadTargetSlotId] = useState<MediaSlotId | "">("");
  const [editorSlotId, setEditorSlotId] = useState<MediaSlotId | "">("");
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const hasChanges = useMemo(
    () => mediaCatalog.some((slot) => formSlots[slot.id] !== savedSlots[slot.id]),
    [formSlots, mediaCatalog, savedSlots]
  );

  const editorSlot = useMemo(() => {
    if (!editorSlotId) return null;
    return mediaCatalog.find((slot) => slot.id === editorSlotId) ?? null;
  }, [editorSlotId, mediaCatalog]);

  const slotHasUnsavedChange = useMemo(() => {
    if (!editorSlotId) return false;
    return formSlots[editorSlotId] !== savedSlots[editorSlotId];
  }, [editorSlotId, formSlots, savedSlots]);

  const requestCloseEditor = useCallback((): void => {
    if (!editorSlotId) return;
    if (slotHasUnsavedChange) {
      setCloseConfirmOpen(true);
      return;
    }
    setEditorSlotId("");
  }, [editorSlotId, slotHasUnsavedChange]);

  useEffect(() => {
    if (!editorSlotId) return;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== "Escape") return;
      requestCloseEditor();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [requestCloseEditor, editorSlotId]);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setState({ loading: false, error: "Sessão expirada. Faça login novamente." });
      return;
    }
    setState({ loading: true, error: null });
    setSuccess("");
    try {
      const slots = await fetchMediaSlots({ token });
      const normalized = normalizePublicMediaSlotsSnapshot(slots);
      setFormSlots(normalized);
      setSavedSlots(normalized);
      updateMediaSlotsSnapshot(normalized);
      setState({ loading: false, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar galeria.";
      logger.warn("Falha ao carregar Galeria de Mídias (Admin V2)", { error: message });
      setState({ loading: false, error: message });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = useCallback(async (): Promise<boolean> => {
    const token = getToken();
    if (!token) {
      setState((prev) => ({ ...prev, error: "Sessão expirada. Faça login novamente." }));
      return false;
    }
    setSaving(true);
    setState((prev) => ({ ...prev, error: null }));
    setSuccess("");
    try {
      const saved = await saveMediaSlots({ token, slots: formSlots });
      const normalized = normalizePublicMediaSlotsSnapshot(saved);
      setFormSlots(normalized);
      setSavedSlots(normalized);
      updateMediaSlotsSnapshot(normalized);
      setSuccess("Galeria de mídias salva com sucesso.");
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao salvar galeria.";
      logger.warn("Falha ao salvar Galeria de Mídias (Admin V2)", { error: message });
      setState((prev) => ({ ...prev, error: message }));
      return false;
    } finally {
      setSaving(false);
    }
  }, [formSlots]);

  const saveEditorSlot = async (): Promise<void> => {
    const didSave = await handleSave();
    if (didSave) setEditorSlotId("");
  };

  const setSlotValue = (slotId: MediaSlotId, value: string): void => {
    setFormSlots((current) => ({ ...current, [slotId]: value }));
    setSuccess("");
    setState((prev) => ({ ...prev, error: null }));
  };

  const revertSlotToFallback = (slot: PublicMediaSlotCatalogItem): void => {
    setSlotValue(slot.id, slot.fallbackUrl);
    setSuccess(`Slot ${slot.id} revertido para o fallback. Clique em "Salvar e fechar" para persistir.`);
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
      setState((prev) => ({ ...prev, error: "Selecione um arquivo de imagem válido (PNG, JPG, WEBP, etc)." }));
      setSuccess("");
      setUploadTargetSlotId("");
      return;
    }
    if (file.size > MEDIA_UPLOAD_MAX_SIZE_BYTES) {
      setState((prev) => ({ ...prev, error: "A imagem excede 5MB. Envie um arquivo menor." }));
      setSuccess("");
      setUploadTargetSlotId("");
      return;
    }
    const token = getToken();
    if (!token) {
      setState((prev) => ({ ...prev, error: "Sessão expirada. Faça login novamente." }));
      setSuccess("");
      setUploadTargetSlotId("");
      return;
    }

    const slotId = uploadTargetSlotId;
    setUploadTargetSlotId("");
    setUploadingSlotId(slotId);
    setState((prev) => ({ ...prev, error: null }));
    setSuccess("");
    try {
      const uploadedUrl = await uploadAsset({ token, file });
      const resolvedUploadedUrl = resolveUploadedAssetUrl(uploadedUrl) || uploadedUrl;
      setSlotValue(slotId, resolvedUploadedUrl);
      setSuccess(`Upload concluído para ${slotId}. Clique em "Salvar e fechar" para persistir.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao enviar imagem.";
      logger.warn("Falha ao subir imagem de media slot (Admin V2)", { error: message });
      setState((prev) => ({ ...prev, error: message }));
    } finally {
      setUploadingSlotId("");
    }
  };

  const controlsDisabled = state.loading || saving;

  return (
    <div className="flex flex-col gap-5">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          void uploadFileToSlot(event);
        }}
      />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-forest">Galeria de Mídias</h1>
          <p className="text-base text-stone-600 dark:text-stone-400">
            catálogo institucional de imagens do site · {mediaCatalog.length} slots — não inclui logo nem imagens do
            catálogo de produtos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void load()}
            disabled={controlsDisabled}
            className="rounded-full border border-gold/40 bg-white px-4 py-2 text-xs font-semibold text-forest hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-forest"
          >
            Recarregar
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={controlsDisabled || !hasChanges}
            className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Salvando…" : "Salvar galeria"}
          </button>
        </div>
      </div>

      {state.loading && <p className="text-sm text-stone-600 dark:text-stone-400">Carregando slots de mídia…</p>}
      {state.error && <p className="text-sm font-semibold text-state-critical">{state.error}</p>}
      {success && <p className="text-sm font-semibold text-state-healthy">{success}</p>}

      {!state.loading && (
        <div className="flex flex-col gap-5">
          {groupedCatalog.map(({ page, slots }) => (
            <div key={page} className="rounded-2xl bg-primary/5 p-4 md:p-5">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h3 className="text-xl font-bold uppercase tracking-wider text-forest">{page}</h3>
                <span className="text-xs text-stone-500 dark:text-stone-400">{slots.length} slots</span>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
                {slots.map((slot) => {
                  const currentValue = formSlots[slot.id];
                  const currentPreviewUrl = resolveUploadedAssetUrl(currentValue) || currentValue;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setEditorSlotId(slot.id)}
                      className="group w-full text-left"
                    >
                      <div className="relative h-[140px] overflow-hidden rounded-xl shadow-sm">
                        <img
                          src={currentPreviewUrl}
                          alt={slot.label}
                          className="h-full w-full rounded-xl object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="pointer-events-none absolute inset-0 rounded-xl bg-black/0 transition-colors duration-300 group-hover:bg-black/20" />
                      </div>
                      <p className="mt-1.5 truncate px-0.5 text-xs font-semibold text-stone-600 dark:text-stone-400">
                        {slot.label}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {editorSlot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
          onClick={requestCloseEditor}
        >
          <div
            className="flex max-h-[88vh] w-full max-w-3xl flex-col gap-4 overflow-y-auto rounded-2xl border border-gold/40 bg-white p-5 shadow-2xl dark:bg-forest"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xl font-bold text-forest">{editorSlot.label}</h4>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  <code>{editorSlot.id}</code> · {editorSlot.page}/{editorSlot.section}
                </p>
              </div>
              <button
                type="button"
                onClick={requestCloseEditor}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/40 text-forest hover:bg-primary/5"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="mx-auto flex h-[260px] w-full max-w-[640px] items-center justify-center overflow-hidden rounded-xl border border-gold/40 bg-primary/5 p-3 md:h-[320px]">
              <img
                src={resolveUploadedAssetUrl(formSlots[editorSlot.id]) || formSlots[editorSlot.id]}
                alt={editorSlot.label}
                className="max-h-full max-w-full w-auto h-auto object-contain"
              />
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                URL do slot
              </span>
              <input
                value={formSlots[editorSlot.id]}
                onChange={(event) => setSlotValue(editorSlot.id, event.target.value)}
                placeholder={editorSlot.fallbackUrl}
                disabled={controlsDisabled}
                className="rounded-lg border border-primary/60 bg-white px-3 py-2 text-xs text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
              />
            </label>

            <p className="break-all text-[11px] text-stone-500 dark:text-stone-400">
              Fallback: <code>{editorSlot.fallbackUrl}</code>
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void saveEditorSlot()}
                disabled={controlsDisabled || !slotHasUnsavedChange}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Salvando…" : "Salvar e fechar"}
              </button>
              <button
                type="button"
                onClick={() => requestUploadForSlot(editorSlot.id)}
                disabled={controlsDisabled}
                className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploadingSlotId === editorSlot.id ? "Enviando…" : "Upload"}
              </button>
              <button
                type="button"
                onClick={() => revertSlotToFallback(editorSlot)}
                disabled={controlsDisabled || formSlots[editorSlot.id] === editorSlot.fallbackUrl}
                className="rounded-lg border border-gold/40 bg-white px-4 py-2 text-xs font-semibold text-forest hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-forest-green"
              >
                Reverter fallback
              </button>
              <button
                type="button"
                onClick={requestCloseEditor}
                className="rounded-lg border border-gold/40 bg-white px-4 py-2 text-xs font-semibold text-forest hover:bg-primary/5 dark:bg-forest-green"
              >
                Fechar sem salvar
              </button>
            </div>

            {slotHasUnsavedChange && (
              <p className="text-[11px] text-gold">
                Alterações pendentes neste slot. Use <strong>Salvar e fechar</strong> para persistir.
              </p>
            )}
          </div>
        </div>
      )}

      {closeConfirmOpen && (
        <DeleteConfirmModal
          tone="neutral"
          title="Fechar sem salvar?"
          description="Este slot tem alterações não salvas. Elas serão perdidas se você fechar agora."
          confirmLabel="Fechar sem salvar"
          confirmingLabel="Fechando…"
          submitting={false}
          error={null}
          onCancel={() => setCloseConfirmOpen(false)}
          onConfirm={() => {
            setCloseConfirmOpen(false);
            setEditorSlotId("");
          }}
        />
      )}

      <p className="text-xs text-stone-500 dark:text-stone-400">
        {hasChanges ? "Existem alterações não salvas na galeria." : "Galeria alinhada com o snapshot salvo no backend."}
      </p>
    </div>
  );
}
