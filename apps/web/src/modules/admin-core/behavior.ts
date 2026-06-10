import type { Cleanup } from "../../shared/dom";
import { on } from "../../shared/dom";
import { getToken, getUser } from "../../lib/auth";
import { resolveUploadedAssetUrl } from "../../lib/assetUrls";
import { initAdminLeadsBehavior } from "../admin-leads";
import { initAdminOrdersBehavior } from "../admin-orders";
import { initAdminPeopleBehavior } from "../admin-people";
import { initAdminProductsBehavior } from "../admin-products";
import { initAdminScheduleBehavior } from "../admin-schedule";
import { initAdminServicesBehavior } from "../admin-services";
import { initAdminWhatsappContactsBehavior } from "../admin-whatsapp-contacts";
import { initAdminShellBehavior } from "../admin-shell";
import { initAdminSubscribersBehavior } from "../admin-subscribers";
import { initAdminTestsBehavior } from "../admin-tests";
import { logger } from "../../utils/logger";



export function initAdminPage(): Cleanup {
  const cleanups: Cleanup[] = [];
  const add = (cleanup: Cleanup) => cleanups.push(cleanup);
  const { setModalOpen, setActiveView } = initAdminShellBehavior({ addCleanup: add });
  const currentUser = getUser();
  const isMaster = currentUser?.role?.trim().toUpperCase() === "MASTER";
  const masterOnlyViews = ["branding", "site-sections", "testes"];

  if (!isMaster) {
    masterOnlyViews.forEach((view) => {
      const restrictedTrigger = document.querySelector(
        `[data-view-trigger="${view}"]`
      ) as HTMLElement | null;
      const restrictedView = document.querySelector(`[data-view="${view}"]`) as HTMLElement | null;
      if (restrictedTrigger) {
        restrictedTrigger.classList.add("hidden");
      }
      if (restrictedView) {
        restrictedView.classList.add("hidden");
      }
    });

    const activePanel = document.querySelector("[data-view]:not(.hidden)") as HTMLElement | null;
    const activeView = activePanel?.getAttribute("data-view") || "";
    if (masterOnlyViews.includes(activeView)) {
      setActiveView("dashboard");
    }
  }

  const servicoImagemInput = document.getElementById("servico-imagem") as HTMLInputElement | null;
  const servicoImagemFile = document.getElementById("servico-imagem-file") as HTMLInputElement | null;
  const servicoImagemUrl = document.getElementById("servico-imagem-url") as HTMLInputElement | null;
  const servicoImagemUseUrl = document.getElementById("servico-imagem-use-url");
  const servicoImagemClear = document.getElementById("servico-imagem-clear");
  const produtoImagemInput = document.querySelector("[data-product-image]") as HTMLInputElement | null;
  const produtoImagemFile = document.getElementById("produto-imagem-file") as HTMLInputElement | null;
  const produtoImagemUrl = document.getElementById("produto-imagem-url") as HTMLInputElement | null;
  const produtoImagemUseUrl = document.getElementById("produto-imagem-use-url");
  const produtoImagemClear = document.getElementById("produto-imagem-clear");
  const usuarioImagemFile = document.getElementById("usuario-imagem-file") as HTMLInputElement | null;
  const usuarioImagemUrl = document.getElementById("usuario-imagem-url") as HTMLInputElement | null;
  const usuarioImagemUseUrl = document.getElementById("usuario-imagem-use-url");
  const usuarioImagemClear = document.getElementById("usuario-imagem-clear");
  let activeAvatarInput: HTMLInputElement | null = null;
  let activeAvatarPreviewImg: HTMLImageElement | null = null;
  let activeAvatarPreviewPlaceholder: HTMLElement | null = null;

  const setAvatarPreview = (value: string) => {
    if (!activeAvatarPreviewImg || !activeAvatarPreviewPlaceholder) return;
    const resolvedAvatarUrl = resolveUploadedAssetUrl(value);
    if (resolvedAvatarUrl) {
      activeAvatarPreviewImg.src = resolvedAvatarUrl;
      activeAvatarPreviewImg.classList.remove("hidden");
      activeAvatarPreviewPlaceholder.classList.add("hidden");
    } else {
      activeAvatarPreviewImg.removeAttribute("src");
      activeAvatarPreviewImg.classList.add("hidden");
      activeAvatarPreviewPlaceholder.classList.remove("hidden");
    }
  };

  document.querySelectorAll("[data-avatar-picker]").forEach((button) => {
    add(
      on(button, "click", () => {
        const inputSelector = button.getAttribute("data-avatar-input");
        const previewImgSelector = button.getAttribute("data-avatar-preview-img");
        const previewPlaceholderSelector = button.getAttribute("data-avatar-preview-placeholder");
        activeAvatarInput = inputSelector
          ? (document.querySelector(inputSelector) as HTMLInputElement | null)
          : null;
        activeAvatarPreviewImg = previewImgSelector
          ? (document.querySelector(previewImgSelector) as HTMLImageElement | null)
          : null;
        activeAvatarPreviewPlaceholder = previewPlaceholderSelector
          ? (document.querySelector(previewPlaceholderSelector) as HTMLElement | null)
          : null;
        if (activeAvatarInput) {
          setAvatarPreview(activeAvatarInput.value || "");
        }
      })
    );
  });

  document.querySelectorAll("[data-avatar-clear]").forEach((button) => {
    add(
      on(button, "click", () => {
        const inputSelector = button.getAttribute("data-avatar-input");
        const previewImgSelector = button.getAttribute("data-avatar-preview-img");
        const previewPlaceholderSelector = button.getAttribute("data-avatar-preview-placeholder");
        const input = inputSelector
          ? (document.querySelector(inputSelector) as HTMLInputElement | null)
          : null;
        const previewImg = previewImgSelector
          ? (document.querySelector(previewImgSelector) as HTMLImageElement | null)
          : null;
        const previewPlaceholder = previewPlaceholderSelector
          ? (document.querySelector(previewPlaceholderSelector) as HTMLElement | null)
          : null;
        if (input) input.value = "";
        if (previewImg && previewPlaceholder) {
          previewImg.removeAttribute("src");
          previewImg.classList.add("hidden");
          previewPlaceholder.classList.remove("hidden");
        }
      })
    );
  });

  if (servicoImagemFile) {
    add(
      on(servicoImagemFile, "change", async () => {
        const file = servicoImagemFile.files && servicoImagemFile.files[0];
        if (!file || !servicoImagemInput) return;
        try {
          const { url } = await uploadImageFile(file);
          servicoImagemInput.value = url;
          setModalOpen("servicos-imagem", false);
        } catch (error) {
          logger.error("Falha ao enviar imagem de servico", { error });
        } finally {
          servicoImagemFile.value = "";
        }
      })
    );
  }

  if (servicoImagemUseUrl) {
    add(
      on(servicoImagemUseUrl, "click", () => {
        const url = servicoImagemUrl ? servicoImagemUrl.value.trim() : "";
        if (!url || !servicoImagemInput) return;
        servicoImagemInput.value = url;
        setModalOpen("servicos-imagem", false);
      })
    );
  }

  if (servicoImagemClear) {
    add(
      on(servicoImagemClear, "click", () => {
        if (servicoImagemInput) servicoImagemInput.value = "";
        if (servicoImagemUrl) servicoImagemUrl.value = "";
        if (servicoImagemFile) servicoImagemFile.value = "";
      })
    );
  }

  if (produtoImagemFile) {
    add(
      on(produtoImagemFile, "change", async () => {
        const file = produtoImagemFile.files && produtoImagemFile.files[0];
        if (!file || !produtoImagemInput) return;
        try {
          const { url } = await uploadImageFile(file);
          produtoImagemInput.value = url;
          setModalOpen("produtos-imagem", false);
        } catch (error) {
          logger.error("Falha ao enviar imagem de produto", { error });
        } finally {
          produtoImagemFile.value = "";
        }
      })
    );
  }

  if (produtoImagemUseUrl) {
    add(
      on(produtoImagemUseUrl, "click", () => {
        const url = produtoImagemUrl ? produtoImagemUrl.value.trim() : "";
        if (!url || !produtoImagemInput) return;
        produtoImagemInput.value = url;
        setModalOpen("produtos-imagem", false);
      })
    );
  }

  if (produtoImagemClear) {
    add(
      on(produtoImagemClear, "click", () => {
        if (produtoImagemInput) produtoImagemInput.value = "";
        if (produtoImagemUrl) produtoImagemUrl.value = "";
        if (produtoImagemFile) produtoImagemFile.value = "";
      })
    );
  }

  if (usuarioImagemFile) {
    add(
      on(usuarioImagemFile, "change", async () => {
        const file = usuarioImagemFile.files && usuarioImagemFile.files[0];
        if (!file || !activeAvatarInput) return;
        try {
          const { url } = await uploadImageFile(file);
          activeAvatarInput.value = url;
          setAvatarPreview(url);
          setModalOpen("usuarios-imagem", false);
        } catch (error) {
          showUsersError(error instanceof Error ? error.message : "Falha ao enviar imagem.");
        } finally {
          usuarioImagemFile.value = "";
        }
      })
    );
  }

  if (usuarioImagemUseUrl) {
    add(
      on(usuarioImagemUseUrl, "click", () => {
        const url = usuarioImagemUrl ? usuarioImagemUrl.value.trim() : "";
        if (!url || !activeAvatarInput) return;
        activeAvatarInput.value = url;
        setAvatarPreview(url);
        setModalOpen("usuarios-imagem", false);
      })
    );
  }

  if (usuarioImagemClear) {
    add(
      on(usuarioImagemClear, "click", () => {
        if (activeAvatarInput) activeAvatarInput.value = "";
        if (usuarioImagemUrl) usuarioImagemUrl.value = "";
        if (usuarioImagemFile) usuarioImagemFile.value = "";
        setAvatarPreview("");
      })
    );
  }

  const API_URL = import.meta.env.VITE_API_URL || "";
  const apiJson = async <T = unknown>(path: string, options: RequestInit = {}): Promise<T> => {
    const token = getToken();
    if (!token) throw new Error("Sessao expirada.");
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };
    if (options.body && !(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }
    const response = await fetch(`${API_URL}/api${path}`, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {}),
      },
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const message = data?.message || "Falha ao processar requisicao.";
      throw new Error(message);
    }
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  };
  const uploadImageFile = async (file: File) => {
    const token = getToken();
    if (!token) throw new Error("Sessao expirada.");
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${API_URL}/api/uploads`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const message = data?.message || "Falha ao enviar imagem.";
      throw new Error(message);
    }
    return response.json() as Promise<{ url: string }>;
  };
  const ROLE_LABELS: Record<string, string> = {
    MASTER: "Master",
    ADMIN: "Administrador",
    MANAGER: "Gerente",
    PROFESSIONAL: "Profissional",
    CLIENT: "Cliente",
  };
  const STATUS_LABELS: Record<string, string> = {
    ATIVO: "Ativo",
    INATIVO: "Inativo",
    SUSPENSO: "Suspenso",
    CANCELADO: "Cancelado",
  };

  type UserRow = {
    id: number;
    name: string;
    email: string;
    role: string;
    phone?: string | null;
    phone2?: string | null;
    city?: string | null;
    neighborhood?: string | null;
    avatarUrl?: string | null;
    status?: string | null;
    emailVerified?: boolean | null;
    rating?: number | null;
    createdAt?: string;
    lastAccessAt?: string | null;
    updatedAt?: string;
  };

  const usersTableBody = document.querySelector("[data-users-table-body]") as HTMLElement | null;
  const usersStatus = document.querySelector("[data-users-status]") as HTMLElement | null;
  const usersError = document.querySelector("[data-users-error]") as HTMLElement | null;
  const usersRefresh = document.querySelector("[data-users-refresh]") as HTMLButtonElement | null;
  const usersRange = document.querySelector("[data-users-range]") as HTMLElement | null;
  const usersPageFirst = document.querySelector("[data-users-page-first]") as HTMLButtonElement | null;
  const usersPagePrev = document.querySelector("[data-users-page-prev]") as HTMLButtonElement | null;
  const usersPageNext = document.querySelector("[data-users-page-next]") as HTMLButtonElement | null;
  const usersPageLast = document.querySelector("[data-users-page-last]") as HTMLButtonElement | null;
  const usersPageSizeSelect = document.querySelector(
    "[data-users-page-size]"
  ) as HTMLSelectElement | null;
  const usersPaginationPage = document.querySelector(
    "[data-users-pagination-page]"
  ) as HTMLElement | null;
  const usersSearch = document.querySelector("[data-users-search]") as HTMLInputElement | null;
  const usersRoleFilter = document.querySelector(
    "[data-users-role-filter]"
  ) as HTMLSelectElement | null;
  const usersStatusFilter = document.querySelector(
    "[data-users-status-filter]"
  ) as HTMLSelectElement | null;

  const previewAvatarImg = document.querySelector(
    "[data-user-preview-avatar-img]"
  ) as HTMLImageElement | null;
  const previewAvatarInitials = document.querySelector(
    "[data-user-preview-avatar-initials]"
  ) as HTMLElement | null;
  const previewName = document.querySelector("[data-user-preview-name]") as HTMLElement | null;
  const previewRole = document.querySelector("[data-user-preview-role]") as HTMLElement | null;
  const previewEmail = document.querySelector("[data-user-preview-email]") as HTMLElement | null;
  const previewPhone = document.querySelector("[data-user-preview-phone]") as HTMLElement | null;
  const previewPhone2 = document.querySelector("[data-user-preview-phone2]") as HTMLElement | null;
  const previewLocation = document.querySelector("[data-user-preview-location]") as HTMLElement | null;
  const previewStatus = document.querySelector("[data-user-preview-status]") as HTMLElement | null;
  const previewEmailVerified = document.querySelector(
    "[data-user-preview-email-verified]"
  ) as HTMLElement | null;
  const previewRating = document.querySelector("[data-user-preview-rating]") as HTMLElement | null;
  const previewCreated = document.querySelector("[data-user-preview-created]") as HTMLElement | null;
  const previewLastAccess = document.querySelector(
    "[data-user-preview-last-access]"
  ) as HTMLElement | null;
  const previewEdit = document.querySelector("[data-user-preview-edit]") as HTMLButtonElement | null;

  const editName = document.querySelector("[data-user-edit-name]") as HTMLInputElement | null;
  const editEmail = document.querySelector("[data-user-edit-email]") as HTMLInputElement | null;
  const editPassword = document.querySelector(
    "[data-user-edit-password]"
  ) as HTMLInputElement | null;
  const editRole = document.querySelector("[data-user-edit-role]") as HTMLSelectElement | null;
  const editPhone = document.querySelector("[data-user-edit-phone]") as HTMLInputElement | null;
  const editPhone2 = document.querySelector("[data-user-edit-phone2]") as HTMLInputElement | null;
  const editCity = document.querySelector("[data-user-edit-city]") as HTMLInputElement | null;
  const editNeighborhood = document.querySelector(
    "[data-user-edit-neighborhood]"
  ) as HTMLInputElement | null;
  const editAvatar = document.querySelector("[data-user-edit-avatar]") as HTMLInputElement | null;
  const editAvatarPreviewImg = document.querySelector(
    "[data-user-edit-avatar-preview-img]"
  ) as HTMLImageElement | null;
  const editAvatarPreviewPlaceholder = document.querySelector(
    "[data-user-edit-avatar-preview-placeholder]"
  ) as HTMLElement | null;
  const editStatus = document.querySelector("[data-user-edit-status]") as HTMLSelectElement | null;
  const editEmailVerified = document.querySelector(
    "[data-user-edit-email-verified]"
  ) as HTMLSelectElement | null;
  const editRating = document.querySelector("[data-user-edit-rating]") as HTMLInputElement | null;
  const editSave = document.querySelector("[data-user-edit-save]") as HTMLButtonElement | null;

  const createName = document.querySelector("[data-user-create-name]") as HTMLInputElement | null;
  const createEmail = document.querySelector("[data-user-create-email]") as HTMLInputElement | null;
  const createPassword = document.querySelector(
    "[data-user-create-password]"
  ) as HTMLInputElement | null;
  const createRole = document.querySelector("[data-user-create-role]") as HTMLSelectElement | null;
  const createPhone = document.querySelector("[data-user-create-phone]") as HTMLInputElement | null;
  const createPhone2 = document.querySelector(
    "[data-user-create-phone2]"
  ) as HTMLInputElement | null;
  const createCity = document.querySelector("[data-user-create-city]") as HTMLInputElement | null;
  const createNeighborhood = document.querySelector(
    "[data-user-create-neighborhood]"
  ) as HTMLInputElement | null;
  const createAvatar = document.querySelector(
    "[data-user-create-avatar]"
  ) as HTMLInputElement | null;
  const createAvatarPreviewImg = document.querySelector(
    "[data-user-create-avatar-preview-img]"
  ) as HTMLImageElement | null;
  const createAvatarPreviewPlaceholder = document.querySelector(
    "[data-user-create-avatar-preview-placeholder]"
  ) as HTMLElement | null;
  const createStatus = document.querySelector("[data-user-create-status]") as HTMLSelectElement | null;
  const createEmailVerified = document.querySelector(
    "[data-user-create-email-verified]"
  ) as HTMLSelectElement | null;
  const createRating = document.querySelector(
    "[data-user-create-rating]"
  ) as HTMLInputElement | null;
  const createSave = document.querySelector("[data-user-create-save]") as HTMLButtonElement | null;

  const deleteName = document.querySelector("[data-user-delete-name]") as HTMLElement | null;
  const deleteConfirm = document.querySelector(
    "[data-user-delete-confirm]"
  ) as HTMLButtonElement | null;

  let usersCache: UserRow[] = [];
  let activeUserId: number | null = null;
  let usersPage = 1;
  let usersPageSize = 10;

  if (usersPageSizeSelect) {
    const initialSize = Number(usersPageSizeSelect.value);
    if (Number.isFinite(initialSize) && initialSize > 0) {
      usersPageSize = initialSize;
    }
  }
  document.querySelectorAll('[data-open-modal="user-create"]').forEach((button) => {
    add(
      on(button, "click", () => {
        if (createAvatar) createAvatar.value = "";
        if (createAvatarPreviewImg && createAvatarPreviewPlaceholder) {
          createAvatarPreviewImg.removeAttribute("src");
          createAvatarPreviewImg.classList.add("hidden");
          createAvatarPreviewPlaceholder.classList.remove("hidden");
        }
      })
    );
  });

  const setUsersStatus = (value: string) => {
    if (usersStatus) usersStatus.textContent = value;
  };

  const showUsersError = (message: string) => {
    if (!usersError) return;
    usersError.textContent = message;
    usersError.classList.remove("hidden");
  };

  const clearUsersError = () => {
    if (!usersError) return;
    usersError.textContent = "";
    usersError.classList.add("hidden");
  };

  const escapeHtml = (value: string) => {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  };

  const initialsFor = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] || "";
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (first + last).toUpperCase() || "U";
  };

  const formatDate = (value?: string | null) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("pt-BR");
  };

  const statusBadgeClass = (status?: string | null) => {
    switch (status) {
      case "ATIVO":
        return "bg-green-100 text-green-800 border border-green-200";
      case "INATIVO":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      case "SUSPENSO":
        return "bg-orange-100 text-orange-800 border border-orange-200";
      case "CANCELADO":
        return "bg-red-100 text-red-700 border border-red-200";
      default:
        return "bg-stone-100 text-stone-600 border border-stone-200";
    }
  };

  initAdminTestsBehavior({
    addCleanup: add,
    apiJson,
    apiUrl: API_URL,
    escapeHtml,
  });

  const renderUsersPager = (totalFiltered: number, totalPages: number, pageSize: number) => {
    if (usersRange) {
      const start = totalFiltered === 0 ? 0 : (usersPage - 1) * pageSize + 1;
      const end = totalFiltered === 0 ? 0 : Math.min(totalFiltered, usersPage * pageSize);
      usersRange.textContent = `Mostrando ${start}-${end} de ${totalFiltered} usuarios.`;
    }
    if (usersPaginationPage) {
      usersPaginationPage.textContent = `Pagina ${usersPage} de ${totalPages}`;
    }
    if (usersPageFirst) {
      usersPageFirst.disabled = usersPage <= 1;
      usersPageFirst.classList.toggle("opacity-50", usersPage <= 1);
    }
    if (usersPagePrev) {
      usersPagePrev.disabled = usersPage <= 1;
      usersPagePrev.classList.toggle("opacity-50", usersPage <= 1);
    }
    if (usersPageNext) {
      usersPageNext.disabled = usersPage >= totalPages;
      usersPageNext.classList.toggle("opacity-50", usersPage >= totalPages);
    }
    if (usersPageLast) {
      usersPageLast.disabled = usersPage >= totalPages;
      usersPageLast.classList.toggle("opacity-50", usersPage >= totalPages);
    }
  };

  const renderUsers = (users: UserRow[], totalFiltered: number, totalPages: number) => {
    if (!usersTableBody) return;
    renderUsersPager(totalFiltered, totalPages, usersPageSize);
    if (!users.length) {
      usersTableBody.innerHTML = `
        <tr>
            <td class="table-cell" colspan="16">Nenhum usuario encontrado.</td>
        </tr>
      `;
      return;
    }
    usersTableBody.innerHTML = users
      .map((user) => {
        const name = escapeHtml(user.name || "");
        const email = escapeHtml(user.email || "");
        const phone = escapeHtml(user.phone || "-");
        const phone2 = escapeHtml(user.phone2 || "-");
        const city = escapeHtml(user.city || "-");
        const neighborhood = escapeHtml(user.neighborhood || "-");
        const ratingValue = user.rating ? Math.max(1, Math.min(5, user.rating)) : null;
        const statusLabel = STATUS_LABELS[user.status || ""] || "-";
        const badgeClass = statusBadgeClass(user.status);
        const initials = initialsFor(user.name || "");
        const avatarUrl = user.avatarUrl ? escapeHtml(resolveUploadedAssetUrl(user.avatarUrl)) : "";
        const avatarUrlLabel = avatarUrl || "-";
        const roleLabel = ROLE_LABELS[user.role] || user.role || "-";
        const emailVerifiedLabel = user.emailVerified ? "Sim" : "Nao";
        const lastAccessLabel = formatDate(user.lastAccessAt);
        const createdLabel = formatDate(user.createdAt);
        const updatedLabel = formatDate(user.updatedAt);
        const avatarHtml = avatarUrl
          ? `<img class="h-9 w-9 rounded-full object-cover" src="${avatarUrl}" alt="Avatar">`
          : `<div class="h-9 w-9 rounded-full bg-[#eef4f0] border border-[#cfe7d1] flex items-center justify-center text-forest-green text-[11px] font-semibold">${initials}</div>`;
        return `
        <tr data-user-row data-user-id="${user.id}" class="hover:bg-[#f6f8f6] transition-colors">
            <td class="table-cell">
                <button class="text-xs text-primary font-semibold hover:underline" type="button" data-user-action="edit">
                    USR-${user.id}
                </button>
            </td>
            <td class="table-cell">
                <div class="flex items-center gap-2.5">
                    ${avatarHtml}
                    <div>
                        <div class="text-xs font-semibold text-forest-green font-body">${name || "Sem nome"}</div>
                        <div class="text-[11px] text-text-muted font-body">${roleLabel}</div>
                    </div>
                </div>
            </td>
            <td class="table-cell">
                <div class="text-[11px] text-text-muted font-body">${email}</div>
            </td>
            <td class="table-cell">
                <div class="text-[11px] text-text-muted font-body">${avatarUrlLabel}</div>
            </td>
            <td class="table-cell">
                <div class="text-[11px] text-text-muted font-body">${phone}</div>
            </td>
            <td class="table-cell">
                <div class="text-[11px] text-text-muted font-body">${phone2}</div>
            </td>
            <td class="table-cell">
                <div class="text-[11px] text-text-muted font-body">${city}</div>
            </td>
            <td class="table-cell">
                <div class="text-[11px] text-text-muted font-body">${neighborhood}</div>
            </td>
            <td class="table-cell">
                <div class="text-[11px] text-text-muted font-body">${roleLabel}</div>
            </td>
            <td class="table-cell">
                <span class="px-2.5 py-1 inline-flex text-[11px] leading-5 font-semibold rounded-full ${badgeClass}">${statusLabel}</span>
            </td>
            <td class="table-cell">
                <div class="text-[11px] text-text-muted font-body">${emailVerifiedLabel}</div>
            </td>
            <td class="table-cell">
                ${
                  ratingValue
                    ? `<div class="flex items-center gap-0.5 text-yellow-500">
                        ${Array.from({ length: 5 })
                          .map((_, index) =>
                            index < ratingValue
                              ? '<span class="material-symbols-outlined text-base leading-none">star</span>'
                              : '<span class="material-symbols-outlined text-base leading-none text-yellow-200">star</span>'
                          )
                          .join("")}
                      </div>`
                    : '<span class="text-[11px] text-text-muted font-body">-</span>'
                }
            </td>
            <td class="table-cell">
                <div class="text-[11px] text-text-muted font-body">${lastAccessLabel}</div>
            </td>
            <td class="table-cell">
                <div class="text-[11px] text-text-muted font-body">${createdLabel}</div>
            </td>
            <td class="table-cell">
                <div class="text-[11px] text-text-muted font-body">${updatedLabel}</div>
            </td>
            <td class="table-cell text-right">
                <div class="relative inline-flex items-center justify-end gap-1.5">
                    <button class="h-8 w-8 rounded-lg border border-[#cfe7d1] text-forest-green hover:bg-[#f6f8f6] transition-colors inline-flex items-center justify-center" type="button" data-user-action="edit" aria-label="Editar usuario" title="Editar">
                        <span class="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button class="h-8 w-8 rounded-lg border border-[#cfe7d1] text-forest-green hover:bg-[#f6f8f6] transition-colors" type="button" data-user-actions aria-label="Acoes">
                        <span class="material-symbols-outlined text-base">more_horiz</span>
                    </button>
                    <div class="absolute right-0 top-10 z-20 hidden w-40 rounded-xl border border-[#cfe7d1] bg-white shadow-lg overflow-hidden" data-user-menu>
                        <button class="w-full text-left px-4 py-2 text-sm hover:bg-[#f6f8f6] flex items-center gap-2" type="button" data-user-action="edit">
                            <span class="material-symbols-outlined text-base text-forest">edit</span>
                            Editar
                        </button>
                        <button class="w-full text-left px-4 py-2 text-sm hover:bg-[#f6f8f6] flex items-center gap-2" type="button" data-user-action="preview">
                            <span class="material-symbols-outlined text-base text-forest">visibility</span>
                            Preview
                        </button>
                        <button class="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2" type="button" data-user-action="delete">
                            <span class="material-symbols-outlined text-base">delete</span>
                            Delete
                        </button>
                    </div>
                </div>
            </td>
        </tr>
      `;
      })
      .join("");
  };

  const applyUserFilters = () => {
    const query = usersSearch?.value.trim().toLowerCase() || "";
    const role = usersRoleFilter?.value || "ALL";
    const status = usersStatusFilter?.value || "ALL";
    const filtered = usersCache.filter((user) => {
      const matchesQuery =
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        (user.phone || "").toLowerCase().includes(query);
      const matchesRole = role === "ALL" || user.role === role;
      const matchesStatus = status === "ALL" || user.status === status;
      return matchesQuery && matchesRole && matchesStatus;
    });
    const totalPages = Math.max(1, Math.ceil(filtered.length / usersPageSize));
    if (usersPage > totalPages) usersPage = totalPages;
    if (usersPage < 1) usersPage = 1;
    const start = (usersPage - 1) * usersPageSize;
    const paged = filtered.slice(start, start + usersPageSize);
    renderUsers(paged, filtered.length, totalPages);
  };

  const fetchUsers = async () => {
    clearUsersError();
    setUsersStatus("Carregando...");
    const token = getToken();
    if (!token) {
      setUsersStatus("");
      showUsersError("Sessao expirada. Faca login novamente.");
      if (usersTableBody) {
        usersTableBody.innerHTML = `
          <tr>
              <td class="table-cell" colspan="16">Nenhum usuario disponivel.</td>
          </tr>
        `;
      }
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const message = data?.message || "Falha ao carregar usuarios.";
        throw new Error(message);
      }
      const usersResponse = (await response.json()) as UserRow[];
      usersCache = usersResponse.map((user) => ({
        ...user,
        avatarUrl: resolveUploadedAssetUrl(user.avatarUrl) || null,
      }));
      applyUserFilters();
      setUsersStatus(`Total: ${usersCache.length}`);
    } catch (error) {
      setUsersStatus("");
      const message = error instanceof Error ? error.message : "Falha ao carregar usuarios.";
      showUsersError(message);
      if (usersTableBody) {
        usersTableBody.innerHTML = `
          <tr>
              <td class="table-cell" colspan="7">${message}</td>
          </tr>
        `;
      }
    }
  };

  const createUser = async (payload: Record<string, unknown>) => {
    const token = getToken();
    if (!token) throw new Error("Sessao expirada.");
    const response = await fetch(`${API_URL}/api/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const message = data?.message || "Falha ao criar usuario.";
      throw new Error(message);
    }
    return response.json();
  };

  const updateUser = async (userId: number, payload: Record<string, unknown>) => {
    const token = getToken();
    if (!token) throw new Error("Sessao expirada.");
    const response = await fetch(`${API_URL}/api/users/${userId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const message = data?.message || "Falha ao atualizar usuario.";
      throw new Error(message);
    }
    return response.json();
  };

  const deleteUser = async (userId: number) => {
    const token = getToken();
    if (!token) throw new Error("Sessao expirada.");
    const response = await fetch(`${API_URL}/api/users/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const message = data?.message || "Falha ao excluir usuario.";
      throw new Error(message);
    }
  };

  const closeUserMenus = () => {
    document.querySelectorAll("[data-user-menu]").forEach((menu) => {
      menu.classList.add("hidden");
    });
  };

  const openPreviewModal = (user: UserRow) => {
    activeUserId = user.id;
    if (previewAvatarImg && previewAvatarInitials) {
      const resolvedAvatarUrl = resolveUploadedAssetUrl(user.avatarUrl);
      if (resolvedAvatarUrl) {
        previewAvatarImg.src = resolvedAvatarUrl;
        previewAvatarImg.classList.remove("hidden");
        previewAvatarInitials.classList.add("hidden");
      } else {
        previewAvatarImg.classList.add("hidden");
        previewAvatarInitials.classList.remove("hidden");
        previewAvatarInitials.textContent = initialsFor(user.name || "");
      }
    }
    if (previewName) previewName.textContent = user.name || "Sem nome";
    if (previewRole) previewRole.textContent = ROLE_LABELS[user.role] || user.role;
    if (previewEmail) previewEmail.textContent = user.email || "-";
    if (previewPhone) previewPhone.textContent = user.phone || "-";
    if (previewPhone2) previewPhone2.textContent = user.phone2 || "-";
    if (previewLocation) {
      const city = user.city || "-";
      const neighborhood = user.neighborhood || "-";
      previewLocation.textContent = `${city} / ${neighborhood}`;
    }
    if (previewStatus) previewStatus.textContent = STATUS_LABELS[user.status || ""] || "-";
    if (previewEmailVerified)
      previewEmailVerified.textContent = user.emailVerified ? "Sim" : "Nao";
    if (previewRating) previewRating.textContent = user.rating ? String(user.rating) : "-";
    if (previewCreated) previewCreated.textContent = formatDate(user.createdAt);
    if (previewLastAccess) previewLastAccess.textContent = formatDate(user.lastAccessAt);
    setModalOpen("user-preview", true);
  };

  const openEditModal = (user: UserRow) => {
    activeUserId = user.id;
    if (editName) editName.value = user.name || "";
    if (editEmail) editEmail.value = user.email || "";
    if (editPassword) editPassword.value = "";
    if (editRole) editRole.value = user.role || "CLIENT";
    if (editPhone) editPhone.value = user.phone || "";
    if (editPhone2) editPhone2.value = user.phone2 || "";
    if (editCity) editCity.value = user.city || "";
    if (editNeighborhood) editNeighborhood.value = user.neighborhood || "";
    if (editAvatar) editAvatar.value = user.avatarUrl || "";
    if (editAvatarPreviewImg && editAvatarPreviewPlaceholder) {
      const resolvedAvatarUrl = resolveUploadedAssetUrl(user.avatarUrl);
      if (resolvedAvatarUrl) {
        editAvatarPreviewImg.src = resolvedAvatarUrl;
        editAvatarPreviewImg.classList.remove("hidden");
        editAvatarPreviewPlaceholder.classList.add("hidden");
      } else {
        editAvatarPreviewImg.removeAttribute("src");
        editAvatarPreviewImg.classList.add("hidden");
        editAvatarPreviewPlaceholder.classList.remove("hidden");
      }
    }
    if (editStatus) editStatus.value = user.status || "ATIVO";
    if (editEmailVerified) editEmailVerified.value = String(Boolean(user.emailVerified));
    if (editRating) editRating.value = user.rating ? String(user.rating) : "";
    setModalOpen("user-edit", true);
  };

  const openDeleteModal = (user: UserRow) => {
    activeUserId = user.id;
    if (deleteName) deleteName.textContent = user.name || user.email || "este usuario";
    setModalOpen("user-delete", true);
  };

  if (usersRefresh) {
    add(
      on(usersRefresh, "click", () => {
        usersPage = 1;
        fetchUsers().catch(() => undefined);
      })
    );
  }
  if (usersSearch) {
    add(
      on(usersSearch, "input", () => {
        usersPage = 1;
        applyUserFilters();
      })
    );
  }
  if (usersRoleFilter) {
    add(
      on(usersRoleFilter, "change", () => {
        usersPage = 1;
        applyUserFilters();
      })
    );
  }
  if (usersStatusFilter) {
    add(
      on(usersStatusFilter, "change", () => {
        usersPage = 1;
        applyUserFilters();
      })
    );
  }
  if (usersPagePrev) {
    add(
      on(usersPagePrev, "click", () => {
        if (usersPage <= 1) return;
        usersPage -= 1;
        applyUserFilters();
      })
    );
  }
  if (usersPageFirst) {
    add(
      on(usersPageFirst, "click", () => {
        if (usersPage <= 1) return;
        usersPage = 1;
        applyUserFilters();
      })
    );
  }
  if (usersPageNext) {
    add(
      on(usersPageNext, "click", () => {
        usersPage += 1;
        applyUserFilters();
      })
    );
  }
  if (usersPageLast) {
    add(
      on(usersPageLast, "click", () => {
        usersPage = Number.MAX_SAFE_INTEGER;
        applyUserFilters();
      })
    );
  }
  if (usersPageSizeSelect) {
    add(
      on(usersPageSizeSelect, "change", () => {
        const nextSize = Number(usersPageSizeSelect.value);
        usersPageSize = Number.isFinite(nextSize) && nextSize > 0 ? nextSize : 10;
        usersPage = 1;
        applyUserFilters();
      })
    );
  }
  if (usersTableBody) {
    add(
      on(usersTableBody, "click", (event) => {
        const target = event.target as HTMLElement | null;
        const actionButton = target?.closest("[data-user-actions]") as HTMLButtonElement | null;
        if (actionButton) {
          const menu = actionButton.parentElement?.querySelector(
            "[data-user-menu]"
          ) as HTMLElement | null;
          const isOpen = menu && !menu.classList.contains("hidden");
          closeUserMenus();
          if (menu && !isOpen) {
            menu.classList.remove("hidden");
          }
          return;
        }

        const actionItem = target?.closest("[data-user-action]") as HTMLElement | null;
        if (actionItem) {
          const row = actionItem.closest("[data-user-row]") as HTMLElement | null;
          if (!row) return;
          const id = Number(row.getAttribute("data-user-id"));
          const user = usersCache.find((entry) => entry.id === id);
          if (!user) return;
          const action = actionItem.getAttribute("data-user-action");
          closeUserMenus();
          if (action === "preview") {
            openPreviewModal(user);
          } else if (action === "edit") {
            openEditModal(user);
          } else if (action === "delete") {
            openDeleteModal(user);
          }
        }
      })
    );
  }

  add(
    on(document, "click", (event) => {
      const target = event.target as HTMLElement | null;
      const insideMenu = target?.closest("[data-user-menu]");
      const insideButton = target?.closest("[data-user-actions]");
      if (!insideMenu && !insideButton) {
        closeUserMenus();
      }
    })
  );

  if (previewEdit) {
    add(
      on(previewEdit, "click", () => {
        if (activeUserId === null) return;
        const user = usersCache.find((entry) => entry.id === activeUserId);
        if (!user) return;
        setModalOpen("user-preview", false);
        openEditModal(user);
      })
    );
  }

  if (editSave) {
    add(
      on(editSave, "click", async () => {
        if (activeUserId === null) return;
        clearUsersError();
        const payload: Record<string, unknown> = {
          name: editName?.value.trim() || "",
          email: editEmail?.value.trim() || "",
          role: editRole?.value || "CLIENT",
          phone: editPhone?.value.trim() || undefined,
          phone2: editPhone2?.value.trim() || undefined,
          city: editCity?.value.trim() || undefined,
          neighborhood: editNeighborhood?.value.trim() || undefined,
          avatarUrl: editAvatar?.value.trim() || undefined,
          status: editStatus?.value || "ATIVO",
          emailVerified: editEmailVerified?.value === "true",
        };
        const ratingValue = Number(editRating?.value || "");
        if (!Number.isNaN(ratingValue) && ratingValue > 0) payload.rating = ratingValue;
        const password = editPassword?.value.trim() || "";
        if (password) payload.password = password;

        const original = editSave.textContent || "";
        editSave.textContent = "Salvando...";
        editSave.disabled = true;
        try {
          await updateUser(activeUserId, payload);
          setUsersStatus("Usuario atualizado.");
          await fetchUsers();
          setModalOpen("user-edit", false);
        } catch (error) {
          showUsersError(error instanceof Error ? error.message : "Falha ao atualizar usuario.");
        } finally {
          editSave.textContent = original || "Salvar";
          editSave.disabled = false;
        }
      })
    );
  }

  if (createSave) {
    add(
      on(createSave, "click", async () => {
        clearUsersError();
        const payload: Record<string, unknown> = {
          name: createName?.value.trim() || "",
          email: createEmail?.value.trim() || "",
          password: createPassword?.value.trim() || "",
          role: createRole?.value || "CLIENT",
          phone: createPhone?.value.trim() || undefined,
          phone2: createPhone2?.value.trim() || undefined,
          city: createCity?.value.trim() || undefined,
          neighborhood: createNeighborhood?.value.trim() || undefined,
          avatarUrl: createAvatar?.value.trim() || undefined,
          status: createStatus?.value || "ATIVO",
          emailVerified: createEmailVerified?.value === "true",
        };
        const ratingValue = Number(createRating?.value || "");
        if (!Number.isNaN(ratingValue) && ratingValue > 0) payload.rating = ratingValue;

        const original = createSave.textContent || "";
        createSave.textContent = "Salvando...";
        createSave.disabled = true;
        try {
          await createUser(payload);
          setUsersStatus("Usuario criado.");
          await fetchUsers();
          setModalOpen("user-create", false);
        } catch (error) {
          showUsersError(error instanceof Error ? error.message : "Falha ao criar usuario.");
        } finally {
          createSave.textContent = original || "Salvar";
          createSave.disabled = false;
        }
      })
    );
  }

  if (deleteConfirm) {
    add(
      on(deleteConfirm, "click", async () => {
        if (activeUserId === null) return;
        clearUsersError();
        const original = deleteConfirm.textContent || "";
        deleteConfirm.textContent = "Excluindo...";
        deleteConfirm.disabled = true;
        try {
          await deleteUser(activeUserId);
          setUsersStatus("Usuario excluido.");
          await fetchUsers();
          setModalOpen("user-delete", false);
        } catch (error) {
          showUsersError(error instanceof Error ? error.message : "Falha ao excluir usuario.");
        } finally {
          deleteConfirm.textContent = original || "Delete";
          deleteConfirm.disabled = false;
        }
      })
    );
  }

  if (usersTableBody) {
    fetchUsers();
  }
  type CatalogKey =
    | "produtos-categorias"
    | "servicos-categorias"
    | "produtos-status"
    | "servicos-status";

  type CatalogItem = {
    id: number;
    name: string;
    status?: "ACTIVE" | "INACTIVE";
    color?: "VERDE" | "AMARELO" | "VERMELHO" | "CINZA";
  };

  const catalogConfig: Record<
    CatalogKey,
    { endpoint: string; kind: "category" | "status" }
  > = {
    "produtos-categorias": { endpoint: "/product-categories", kind: "category" },
    "servicos-categorias": { endpoint: "/service-categories", kind: "category" },
    "produtos-status": { endpoint: "/product-statuses", kind: "status" },
    "servicos-status": { endpoint: "/service-statuses", kind: "status" },
  };

  const catalogStore: Record<CatalogKey, CatalogItem[]> = {
    "produtos-categorias": [],
    "servicos-categorias": [],
    "produtos-status": [],
    "servicos-status": [],
  };

  const categoryStatusLabel: Record<string, string> = {
    ACTIVE: "Ativo",
    INACTIVE: "Inativo",
  };

  const badgeByStatus: Record<string, string> = {
    Ativo: "bg-green-100 text-green-800 border-green-200",
    Inativo: "bg-yellow-100 text-yellow-800 border-yellow-200",
  };

  const badgeByColor: Record<string, string> = {
    VERDE: "bg-green-100 text-green-800 border-green-200",
    AMARELO: "bg-yellow-100 text-yellow-800 border-yellow-200",
    VERMELHO: "bg-red-100 text-red-700 border-red-200",
    CINZA: "bg-gray-100 text-gray-700 border-gray-200",
  };

  const isItemUsed = (key: CatalogKey, id: number) => {
    return Array.from(document.querySelectorAll(`[data-select="${key}"]`)).some(
      (select) => (select as HTMLSelectElement).value === String(id)
    );
  };

  const renderSelects = (key: CatalogKey) => {
    document.querySelectorAll(`[data-select="${key}"]`).forEach((select) => {
      const el = select as HTMLSelectElement;
      const placeholder = el.getAttribute("data-placeholder") || "";
      const current = el.value;
      el.innerHTML = "";
      if (placeholder) {
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = placeholder;
        el.appendChild(opt);
      }
      (catalogStore[key] || []).forEach((item) => {
        const opt = document.createElement("option");
        opt.value = String(item.id);
        opt.textContent = item.name;
        el.appendChild(opt);
      });
      const hasCurrent = Array.from(el.options).some((opt) => opt.value === current);
      if (current && hasCurrent) {
        el.value = current;
      }
    });
  };

  const renderTable = (key: CatalogKey) => {
    const tbody = document.querySelector(`[data-list="${key}"]`);
    if (!tbody) return;
    const items = catalogStore[key] || [];
    tbody.innerHTML = items
      .map((item) => {
        const inUse = isItemUsed(key, item.id);
        const deleteDisabled = inUse ? "opacity-40 cursor-not-allowed" : "";
        const deleteTitle = inUse ? "Em uso" : "Excluir";
        const deleteAttrs = inUse ? "disabled" : `data-delete="${key}:${item.id}"`;
        if (key.includes("categorias")) {
          const statusLabel = categoryStatusLabel[item.status || "ACTIVE"] || "Ativo";
          const badge = badgeByStatus[statusLabel] || badgeByStatus.Ativo;
          return `
                        <tr class="hover:bg-[#f6f8f6] transition-colors">
                            <td class="table-cell">
                                <span class="font-medium text-forest-green">${item.name}
                            
                            <td class="table-cell">
                                <span class="px-2.5 py-1 inline-flex text-xs font-semibold rounded-full ${badge}">${statusLabel}
                            
                            <td class="table-cell text-right">
                                <div class="inline-flex items-center gap-2">
                                    <button class="p-1.5 rounded-lg text-forest-green hover:bg-[#f6f8f6]" title="Editar" type="button" data-edit="${key}:${item.id}">
                                        <span class="material-symbols-outlined text-[18px]">edit
                                    
                                    <button class="p-1.5 rounded-lg text-red-500 hover:bg-red-50 ${deleteDisabled}" title="${deleteTitle}" type="button" ${deleteAttrs}>
                                        <span class="material-symbols-outlined text-[18px]">delete
                                    
                                
                            
                        `;
        }
        const badge = badgeByColor[item.color || "VERDE"] || badgeByColor.VERDE;
        return `
                        <tr class="hover:bg-[#f6f8f6] transition-colors">
                            <td class="table-cell">
                                <span class="font-medium text-forest-green">${item.name}
                            
                            <td class="table-cell">
                                <span class="px-2.5 py-1 inline-flex text-xs font-semibold rounded-full ${badge}">${item.color || "VERDE"}
                            
                            <td class="table-cell text-right">
                                <div class="inline-flex items-center gap-2">
                                    <button class="p-1.5 rounded-lg text-forest-green hover:bg-[#f6f8f6]" title="Editar" type="button" data-edit="${key}:${item.id}">
                                        <span class="material-symbols-outlined text-[18px]">edit
                                    
                                    <button class="p-1.5 rounded-lg text-red-500 hover:bg-red-50 ${deleteDisabled}" title="${deleteTitle}" type="button" ${deleteAttrs}>
                                        <span class="material-symbols-outlined text-[18px]">delete
                                    
                                
                            
                        `;
      })
      .join("");
  };

  const renderAllCatalog = () => {
    (Object.keys(catalogStore) as CatalogKey[]).forEach((key) => {
      renderSelects(key);
      renderTable(key);
    });
  };

  const loadCatalog = async () => {
    const keys = Object.keys(catalogConfig) as CatalogKey[];
    await Promise.all(
      keys.map(async (key) => {
        catalogStore[key] = await apiJson<CatalogItem[]>(catalogConfig[key].endpoint);
      })
    );
    renderAllCatalog();
  };

  document.querySelectorAll("[data-save]").forEach((button) => {
    add(
      on(button, "click", async () => {
        const key = button.getAttribute("data-save") as CatalogKey | null;
        const modal = button.closest("[data-crud]");
        if (!key || !modal) return;
        const config = catalogConfig[key];
        if (!config) return;
        const nameInput = modal.querySelector('[data-input="name"]') as HTMLInputElement | null;
        const name = nameInput ? nameInput.value.trim() : "";
        if (!name) return;

        const editingId = modal.getAttribute("data-editing-id");
        const payload: Record<string, unknown> = { name };
        if (config.kind === "category") {
          const statusInput = modal.querySelector('[data-input="status"]') as HTMLSelectElement | null;
          payload.status = (statusInput?.value || "ACTIVE") as string;
        } else {
          const colorInput = modal.querySelector('[data-input="color"]') as HTMLSelectElement | null;
          payload.color = (colorInput?.value || "VERDE") as string;
        }

        try {
          if (editingId) {
            await apiJson(`${config.endpoint}/${editingId}`, {
              method: "PATCH",
              body: JSON.stringify(payload),
            });
          } else {
            await apiJson(config.endpoint, {
              method: "POST",
              body: JSON.stringify(payload),
            });
          }
          await loadCatalog();
          modal.querySelectorAll("[data-input]").forEach((input) => {
            if (input instanceof HTMLSelectElement) {
              input.selectedIndex = 0;
            } else if (input instanceof HTMLInputElement) {
              input.value = "";
            }
          });
          modal.removeAttribute("data-editing-id");
          const saveButton = modal.querySelector(`[data-save="${key}"]`);
          if (saveButton) saveButton.textContent = "Salvar";
        } catch (error) {
          logger.error("Falha ao salvar item de catalogo", { error });
        }
      })
    );
  });

  add(
    on(document, "click", (event) => {
      const target = event.target as HTMLElement | null;
      const deleteButton = target?.closest("[data-delete]") as HTMLElement | null;
      if (deleteButton) {
        const [key, idRaw] = (deleteButton.getAttribute("data-delete") || "").split(":");
        const catalogKey = key as CatalogKey;
        const id = Number(idRaw);
        if (!catalogKey || !Number.isFinite(id) || isItemUsed(catalogKey, id)) return;
        const config = catalogConfig[catalogKey];
        if (!config) return;
        apiJson(`${config.endpoint}/${id}`, { method: "DELETE" })
          .then(() => loadCatalog())
          .catch((error) => {
            logger.error("Falha ao excluir item de catalogo", { error });
          });
        return;
      }

      const editButton = target?.closest("[data-edit]") as HTMLElement | null;
      if (editButton) {
        const [key, idRaw] = (editButton.getAttribute("data-edit") || "").split(":");
        const catalogKey = key as CatalogKey;
        const id = Number(idRaw);
        const modal = document.querySelector(`[data-crud="${catalogKey}"]`);
        const item = (catalogStore[catalogKey] || []).find((entry) => entry.id === id);
        if (!modal || !item) return;
        const nameInput = modal.querySelector('[data-input="name"]') as HTMLInputElement | null;
        if (nameInput) nameInput.value = item.name;
        if (catalogKey.includes("categorias")) {
          const statusInput = modal.querySelector('[data-input="status"]') as HTMLSelectElement | null;
          if (statusInput) statusInput.value = item.status || "ACTIVE";
        } else {
          const colorInput = modal.querySelector('[data-input="color"]') as HTMLSelectElement | null;
          if (colorInput) colorInput.value = item.color || "VERDE";
        }
        modal.setAttribute("data-editing-id", String(item.id));
        const saveButton = modal.querySelector(`[data-save="${catalogKey}"]`);
        if (saveButton) saveButton.textContent = "Atualizar";
        setModalOpen(modal.getAttribute("data-modal"), true);
        return;
      }

      const clearButton = target?.closest("[data-clear]") as HTMLElement | null;
      if (clearButton) {
        const key = clearButton.getAttribute("data-clear");
        const modal = clearButton.closest("[data-crud]");
        if (!modal || !key) return;
        modal.querySelectorAll("[data-input]").forEach((input) => {
          if (input instanceof HTMLSelectElement) {
            input.selectedIndex = 0;
          } else if (input instanceof HTMLInputElement) {
            input.value = "";
          }
        });
        modal.removeAttribute("data-editing-id");
        const saveButton = modal.querySelector(`[data-save="${key}"]`);
        if (saveButton) saveButton.textContent = "Salvar";
      }
    })
  );

  loadCatalog().catch(() => undefined);

  type MembershipRow = {
    id: number;
    name: string;
    title: string;
    price: number | string;
    benefits?: unknown;
    isFeatured?: boolean | null;
    status?: string | null;
  };

  const membershipForm = document.querySelector("[data-membership-form]") as HTMLFormElement | null;
  const membershipList = document.querySelector("[data-membership-list]") as HTMLElement | null;
  const membershipCount = document.querySelector("[data-membership-count]");
  const benefitsContainer = document.querySelector("[data-benefits-container]") as HTMLElement | null;
  const addBenefitButton = document.querySelector("[data-add-benefit]");

  let memberships: MembershipRow[] = [];
  let editingMembershipId: number | null = null;

  const normalizeBenefits = (value: unknown): string[] => {
    if (Array.isArray(value)) {
      return value
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter((item) => item.length > 0);
    }
    if (typeof value === "string") {
      return value
        .split(/\r?\n|[,;|]/)
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    }
    return [];
  };

  const normalizeMembership = (row: MembershipRow): MembershipRow => {
    return {
      ...row,
      benefits: normalizeBenefits(row.benefits),
    };
  };

  const addBenefitInput = (value = "") => {
    if (!benefitsContainer || !addBenefitButton) return;
    const row = document.createElement("div");
    row.className = "flex items-center gap-2";
    row.setAttribute("data-benefit-row", "");

    const input = document.createElement("input");
    input.type = "text";
    input.value = value;
    input.placeholder = "Ex.: Beneficio adicional";
    input.setAttribute("data-membership-benefit", "");
    input.className =
      "w-full border border-[#cfe7d1] rounded-lg px-4 py-2.5 bg-[#f6f8f6] text-forest-green focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body";

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.title = "Remover beneficio";
    removeButton.setAttribute("data-remove-benefit", "");
    removeButton.className =
      "h-10 w-10 rounded-lg border border-[#cfe7d1] bg-white text-forest-green hover:bg-[#f6f8f6] transition-colors flex items-center justify-center";
    removeButton.innerHTML =
      '<span class="material-symbols-outlined text-[18px]">remove</span>';

    row.appendChild(input);
    row.appendChild(removeButton);
    benefitsContainer.insertBefore(row, addBenefitButton);
  };

  const ensureBenefitRows = (count = 3) => {
    if (!benefitsContainer) return;
    const rows = benefitsContainer.querySelectorAll("[data-benefit-row]");
    if (rows.length > count) {
      Array.from(rows)
        .slice(count)
        .forEach((row) => row.remove());
    }
    if (rows.length < count) {
      for (let i = rows.length; i < count; i += 1) {
        addBenefitInput("");
      }
    }
  };

  const collectBenefits = () => {
    return Array.from(document.querySelectorAll("[data-membership-benefit]"))
      .map((input) => (input as HTMLInputElement).value.trim())
      .filter((value) => value);
  };

  const resetMembershipForm = () => {
    if (!membershipForm || !benefitsContainer) return;
    membershipForm.reset();
    ensureBenefitRows(3);
    benefitsContainer
      .querySelectorAll("[data-membership-benefit]")
      .forEach((input) => {
        (input as HTMLInputElement).value = "";
      });
    const priceInput = membershipForm.querySelector("[data-membership-price]") as HTMLInputElement | null;
    if (priceInput) setPriceValidity(priceInput, true);
    editingMembershipId = null;
    const submitButton = membershipForm.querySelector('button[type="submit"]');
    if (submitButton) submitButton.textContent = "Salvar Plano";
  };

  const normalizePrice = (inputEl: HTMLInputElement | null) => {
    if (!inputEl) return null;
    const digits = inputEl.value.replace(/\D/g, "");
    if (digits.length < 3) return null;
    const cents = digits.slice(-2);
    let integer = digits.slice(0, -2).replace(/^0+/, "");
    if (!integer) integer = "0";
    integer = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    const formatted = `R$ ${integer},${cents}`;
    inputEl.value = formatted;
    return formatted;
  };

  const parseCurrencyValue = (value: string) => {
    const raw = value.trim();
    if (!raw) return null;
    const cleaned = raw.replace(/[^\d,.-]/g, "");
    if (cleaned.includes(",") || cleaned.includes(".")) {
      const normalized = cleaned.replace(/\./g, "").replace(",", ".");
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : null;
    }
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const formatCurrencyValue = (value: number) => {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const toCurrencyNumber = (value: number | string | null | undefined): number => {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    if (typeof value === "string") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  };

  const setPriceValidity = (inputEl: HTMLInputElement | null, isValid: boolean) => {
    if (!inputEl) return;
    const errorEl = document.querySelector("[data-price-error]");
    inputEl.classList.toggle("border-red-400", !isValid);
    inputEl.classList.toggle("ring-1", !isValid);
    inputEl.classList.toggle("ring-red-400", !isValid);
    if (errorEl) errorEl.classList.toggle("hidden", isValid);
  };

  const iconForPlan = (name: string) => {
    const lower = (name || "").toLowerCase();
    if (lower.includes("gold")) return "verified";
    if (lower.includes("platinum")) return "diamond";
    return "check_circle";
  };

  const renderMemberships = () => {
    if (!membershipList) return;
    if (membershipCount) membershipCount.textContent = String(memberships.length);
    if (memberships.length === 0) {
      membershipList.innerHTML =
        '<div class="rounded-xl border border-dashed border-[#cfe7d1] bg-[#f6f8f6] p-6 text-sm text-stone-500">Nenhum plano cadastrado ainda. Use o formulario ao lado para criar o primeiro plano.</div>';
      return;
    }
    membershipList.innerHTML = memberships
      .map((plan) => {
        const featuredClass = plan.isFeatured
          ? "border-2 border-gold shadow-xl shadow-gold/10 transform scale-[1.02]"
          : "border border-champagne-dark hover:shadow-2xl hover:shadow-gold/10";
        const badge = plan.isFeatured
          ? `<div class="absolute -top-4 left-1/2 -translate-x-1/2 bg-gold text-white text-xs font-bold uppercase px-4 py-1 rounded-full tracking-widest">Mais Popular</div>`
          : "";
        const icon = iconForPlan(plan.name);
        const benefits = normalizeBenefits(plan.benefits)
          .map(
            (item) => `
                                <li class="flex items-start gap-2">
                                    <span class="material-symbols-outlined text-gold text-base mt-0.5">${icon}</span>
                                    ${item}
                                </li>
                            `
          )
          .join("");
        const cardClasses = `bg-white rounded-2xl p-6 transition-all duration-300 transform hover:-translate-y-1 relative group h-full flex flex-col ${featuredClass}`;
        const numericPrice =
          typeof plan.price === "number" ? plan.price : Number(plan.price);
        const priceLabel = Number.isFinite(numericPrice)
          ? formatCurrencyValue(numericPrice)
          : "R$ 0,00";
        return `
                        <div class="${cardClasses}">
                            ${badge}
                            <div class="mb-6">
                                <span class="inline-block py-1 px-3 bg-gray-100 rounded-full text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">${plan.name}</span>
                                <h4 class="display-title text-shadow-strong text-2xl text-forest mb-2">${plan.title}</h4>
                                <p class="text-gold font-bold text-lg">${priceLabel} <span class="text-xs text-gray-400 font-normal">/ mes</span></p>
                            </div>
                            <ul class="space-y-3 mb-6 flex-grow text-sm text-forest/80">
                                ${benefits}
                            </ul>
                            <div class="flex items-center gap-2">
                                <button class="flex-1 py-2 rounded-lg bg-forest text-white hover:bg-primary hover:text-forest font-bold uppercase tracking-widest text-[10px] transition-colors" type="button" data-membership-edit="${plan.id}">
                                    Editar
                                </button>
                                <button class="p-2 rounded-lg border border-[#cfe7d1] text-forest-green hover:bg-[#f6f8f6]" title="Excluir" type="button" data-membership-delete="${plan.id}">
                                    <span class="material-symbols-outlined text-lg">delete</span>
                                </button>
                            </div>
                        </div>
                    `;
      })
      .join("");
  };

  const fetchMemberships = async () => {
    try {
      const response = await apiJson<MembershipRow[]>("/memberships");
      memberships = response.map((row) => normalizeMembership(row));
      renderMemberships();
    } catch (error) {
      logger.warn("Falha ao carregar memberships admin. Tentando endpoint publico.", { error });
      try {
        const fallbackResponse = await fetch(`${API_URL}/api/public/memberships`);
        if (!fallbackResponse.ok) {
          throw new Error(`HTTP ${fallbackResponse.status}`);
        }
        const fallbackRows = (await fallbackResponse.json()) as MembershipRow[];
        memberships = fallbackRows.map((row) => normalizeMembership(row));
        renderMemberships();
      } catch (fallbackError) {
        logger.error("Falha ao carregar memberships (admin/public)", { fallbackError });
        memberships = [];
        if (membershipCount) membershipCount.textContent = "0";
        if (membershipList) {
          membershipList.innerHTML =
            '<div class="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">Falha ao carregar planos. Verifique a sessao e tente novamente.</div>';
        }
      }
    }
  };

  if (addBenefitButton) {
    add(on(addBenefitButton, "click", () => addBenefitInput()));
  }

  if (benefitsContainer) {
    add(
      on(benefitsContainer, "click", (event) => {
        const target = event.target as HTMLElement | null;
        const removeButton = target?.closest("[data-remove-benefit]");
        if (!removeButton) return;
        const rows = benefitsContainer.querySelectorAll("[data-benefit-row]");
        if (rows.length <= 1) return;
        const row = removeButton.closest("[data-benefit-row]");
        if (row) row.remove();
      })
    );
  }

  if (membershipForm) {
    const priceInput = membershipForm.querySelector("[data-membership-price]") as HTMLInputElement | null;
    if (priceInput) {
      add(
        on(priceInput, "input", () => {
          const digits = priceInput.value.replace(/\D/g, "");
          priceInput.value = digits;
          setPriceValidity(priceInput, digits.length >= 3);
        })
      );
      add(
        on(priceInput, "blur", () => {
          const formatted = normalizePrice(priceInput);
          setPriceValidity(priceInput, Boolean(formatted));
        })
      );
    }

    add(
      on(membershipForm, "submit", async (event) => {
        event.preventDefault();
        const nameInput = membershipForm.querySelector("[data-membership-name]") as HTMLInputElement | null;
        const titleInput = membershipForm.querySelector("[data-membership-title]") as HTMLInputElement | null;
        const priceInputLocal = membershipForm.querySelector("[data-membership-price]") as HTMLInputElement | null;
        const statusInput = membershipForm.querySelector("[data-membership-status]") as HTMLSelectElement | null;
        const featuredInput = membershipForm.querySelector("[data-membership-featured]") as HTMLInputElement | null;
        const name = nameInput?.value.trim() || "";
        const title = titleInput?.value.trim() || "";
        const status = statusInput?.value || "Ativo";
        const featured = Boolean(featuredInput?.checked);
        const benefits = collectBenefits();

        const formattedPrice = normalizePrice(priceInputLocal);
        setPriceValidity(priceInputLocal, Boolean(formattedPrice));
        const priceNumber = parseCurrencyValue(priceInputLocal?.value || "");

        if (!name || !title || !formattedPrice || priceNumber === null) return;

        const payload = {
          name,
          title,
          price: priceNumber,
          benefits,
          isFeatured: featured,
          status,
        };

        try {
          if (editingMembershipId !== null) {
            await apiJson(`/memberships/${editingMembershipId}`, {
              method: "PATCH",
              body: JSON.stringify(payload),
            });
          } else {
            await apiJson("/memberships", {
              method: "POST",
              body: JSON.stringify(payload),
            });
          }
          await fetchMemberships();
          resetMembershipForm();
        } catch (error) {
          logger.error("Falha ao salvar assinatura", { error });
        }
      })
    );
  }

  if (membershipList) {
    add(
      on(membershipList, "click", (event) => {
        const target = event.target as HTMLElement | null;
        const editButton = target?.closest("[data-membership-edit]") as HTMLElement | null;
        if (editButton) {
          const id = Number(editButton.getAttribute("data-membership-edit"));
          const plan = memberships.find((entry) => entry.id === id);
          if (!plan || !membershipForm) return;
          const nameInput = membershipForm.querySelector("[data-membership-name]") as HTMLInputElement | null;
          const titleInput = membershipForm.querySelector("[data-membership-title]") as HTMLInputElement | null;
          const priceInput = membershipForm.querySelector("[data-membership-price]") as HTMLInputElement | null;
          const statusInput = membershipForm.querySelector("[data-membership-status]") as HTMLSelectElement | null;
          const featuredInput = membershipForm.querySelector("[data-membership-featured]") as HTMLInputElement | null;
          if (nameInput) nameInput.value = plan.name || "";
          if (titleInput) titleInput.value = plan.title || "";
          const editablePrice =
            typeof plan.price === "number" ? plan.price : Number(plan.price);
          if (priceInput) {
            priceInput.value = formatCurrencyValue(
              Number.isFinite(editablePrice) ? editablePrice : 0
            );
          }
          if (statusInput) statusInput.value = plan.status || "Ativo";
          if (featuredInput) featuredInput.checked = Boolean(plan.isFeatured);
          if (benefitsContainer) {
            benefitsContainer
              .querySelectorAll("[data-benefit-row]")
              .forEach((row) => row.remove());
            const planBenefits = normalizeBenefits(plan.benefits);
            planBenefits.forEach((benefit) => addBenefitInput(benefit));
            if (planBenefits.length === 0) {
              ensureBenefitRows(3);
            }
          }
          editingMembershipId = plan.id;
          const submitButton = membershipForm.querySelector('button[type="submit"]');
          if (submitButton) submitButton.textContent = "Atualizar Plano";
          return;
        }

        const deleteButton = target?.closest("[data-membership-delete]") as HTMLElement | null;
        if (deleteButton) {
          const id = Number(deleteButton.getAttribute("data-membership-delete"));
          if (!Number.isNaN(id)) {
            apiJson(`/memberships/${id}`, { method: "DELETE" })
              .then(() => fetchMemberships())
              .then(() => resetMembershipForm())
              .catch((error) => {
                logger.error("Falha ao excluir assinatura", { error });
              });
          }
        }
      })
    );
  }

  fetchMemberships().catch(() => undefined);

  const statusBadgeByName: Record<string, string> = {
    PENDENTE: "bg-yellow-100 text-yellow-800 border-yellow-200",
    SEPARANDO: "bg-amber-100 text-amber-800 border-amber-200",
    EMBALADO: "bg-indigo-100 text-indigo-800 border-indigo-200",
    DESPACHADO: "bg-sky-100 text-sky-800 border-sky-200",
    PAGO: "bg-green-100 text-green-800 border-green-200",
    ENVIADO: "bg-blue-100 text-blue-800 border-blue-200",
    ENTREGUE: "bg-green-100 text-green-800 border-green-200",
    CANCELADO: "bg-red-100 text-red-800 border-red-200",
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    PAID: "bg-green-100 text-green-800 border-green-200",
    SHIPPED: "bg-blue-100 text-blue-800 border-blue-200",
    DELIVERED: "bg-green-100 text-green-800 border-green-200",
    CANCELLED: "bg-red-100 text-red-800 border-red-200",
    ATIVO: "bg-green-100 text-green-800 border-green-200",
    INATIVO: "bg-yellow-100 text-yellow-800 border-yellow-200",
    SUSPENSO: "bg-orange-100 text-orange-800 border-orange-200",
    ATIVA: "bg-green-100 text-green-800 border-green-200",
    CANCELADA: "bg-red-100 text-red-800 border-red-200",
    INADIMPLENTE: "bg-red-100 text-red-800 border-red-200",
    CONFIRMADO: "bg-green-100 text-green-800 border-green-200",
  };

  initAdminSubscribersBehavior({
    addCleanup: add,
    apiJson,
    setModalOpen,
    formatDate,
    statusBadgeByName,
    getMemberships: () => memberships,
  });

  const adminScheduleBehavior = initAdminScheduleBehavior({
    addCleanup: add,
    apiJson,
    setActiveView,
    escapeHtml,
    formatDate,
    statusBadgeByName,
  });

  const statusBadgeByColor = (color?: string | null) => {
    if (!color) return "bg-stone-100 text-stone-600 border-stone-200";
    return (
      badgeByColor[color as keyof typeof badgeByColor] ||
      "bg-stone-100 text-stone-600 border-stone-200"
    );
  };

  initAdminServicesBehavior({
    addCleanup: add,
    apiJson,
    escapeHtml,
    formatDate,
    statusBadgeByColor,
    parseCurrencyValue,
    formatCurrencyValue,
    toCurrencyNumber,
  });

  initAdminProductsBehavior({
    addCleanup: add,
    apiJson,
    escapeHtml,
    formatDate,
    statusBadgeByColor,
    parseCurrencyValue,
    formatCurrencyValue,
  });

  initAdminLeadsBehavior({
    addCleanup: add,
    apiJson,
  });

  initAdminOrdersBehavior({
    addCleanup: add,
    apiJson,
    formatCurrencyValue,
    formatDate,
    statusBadgeByName,
  });

  initAdminWhatsappContactsBehavior({
    addCleanup: add,
    apiJson,
    escapeHtml,
    formatDate,
    statusBadgeByName,
  });
  initAdminPeopleBehavior({
    addCleanup: add,
    apiJson,
    escapeHtml,
    formatDate,
    setModalOpen,
    openAgendaForProfessional: (professional) => {
      adminScheduleBehavior.openAgendaForProfessional(professional);
    },
    openLinkedUserById: async (userId) => {
      let user = usersCache.find((entry) => entry.id === userId);
      if (!user) {
        await fetchUsers();
        user = usersCache.find((entry) => entry.id === userId);
      }
      if (!user) {
        throw new Error("Usuario vinculado nao encontrado.");
      }
      setModalOpen("professional-edit", false);
      openEditModal(user);
    },
  });
  return () => {
    cleanups.forEach((cleanup) => cleanup());
  };
}
