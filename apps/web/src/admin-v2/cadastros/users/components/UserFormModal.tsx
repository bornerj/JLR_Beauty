import { useState, type ChangeEvent } from "react";
import { getToken, getUser } from "../../../../lib/auth";
import { resolveUploadedAssetUrl } from "../../../../lib/assetUrls";
import { uploadAsset } from "../../../shared/api";
import { USER_ROLES, USER_ROLE_LABELS, USER_STATUSES, USER_STATUS_LABELS } from "../types";
import type { User, UserCreateInput, UserUpdateInput } from "../types";

/**
 * Admin V2 (PLAN-0026, Onda 14) — modal de criar/editar Usuário. Campos espelham o form
 * legado (`admin-core/behavior.ts`, aba Usuários de `admin-people`): nome, e-mail, senha
 * (obrigatória só na criação — em branco na edição mantém a senha atual, mesma UX do
 * legado), papel, telefone/telefone alternativo, cidade/bairro, avatar (upload real),
 * status, e-mail verificado, avaliação (1-5, opcional).
 *
 * **Gate de papel espelhado do backend**: só um usuário `MASTER` pode atribuir o papel
 * `MASTER` (`POST`/`PATCH /users` retornam 403 caso contrário) — a opção "Master" fica fora
 * do select quando quem está logado não é `MASTER`, mesmo padrão de gate client-side da
 * Onda 6 (Seções Telas).
 */

const IMAGE_UPLOAD_MAX_SIZE_BYTES = 5 * 1024 * 1024;

type FormState = {
  name: string;
  email: string;
  password: string;
  role: string;
  phone: string;
  phone2: string;
  city: string;
  neighborhood: string;
  avatarUrl: string;
  status: string;
  emailVerified: boolean;
  rating: string;
};

const emptyForm = (): FormState => ({
  name: "",
  email: "",
  password: "",
  role: "CLIENT",
  phone: "",
  phone2: "",
  city: "",
  neighborhood: "",
  avatarUrl: "",
  status: "ATIVO",
  emailVerified: false,
  rating: "",
});

const fromUser = (user: User): FormState => ({
  name: user.name,
  email: user.email,
  password: "",
  role: user.role,
  phone: user.phone ?? "",
  phone2: user.phone2 ?? "",
  city: user.city ?? "",
  neighborhood: user.neighborhood ?? "",
  avatarUrl: user.avatarUrl ?? "",
  status: user.status ?? "ATIVO",
  emailVerified: Boolean(user.emailVerified),
  rating: user.rating ? String(user.rating) : "",
});

export function UserFormModal({
  editing,
  submitting,
  error,
  onCancel,
  onSubmit,
}: {
  /** `null` = criando um usuário novo; um `User` = editando esse usuário. */
  editing: User | null;
  submitting: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (input: UserCreateInput | UserUpdateInput) => void;
}) {
  const [form, setForm] = useState<FormState>(editing ? fromUser(editing) : emptyForm());
  const [localError, setLocalError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const currentUser = getUser();
  const canAssignMaster = currentUser?.role === "MASTER" || editing?.role === "MASTER";
  const roleOptions = USER_ROLES.filter((role) => role !== "MASTER" || canAssignMaster);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setLocalError("Selecione um arquivo de imagem válido (PNG, JPG, WEBP, etc).");
      return;
    }
    if (file.size > IMAGE_UPLOAD_MAX_SIZE_BYTES) {
      setLocalError("A imagem excede 5MB. Envie um arquivo menor.");
      return;
    }
    const token = getToken();
    if (!token) {
      setLocalError("Sessão expirada. Faça login novamente.");
      return;
    }
    setUploading(true);
    setLocalError(null);
    try {
      const uploadedUrl = await uploadAsset({ token, file });
      const resolved = resolveUploadedAssetUrl(uploadedUrl) || uploadedUrl;
      setForm((current) => ({ ...current, avatarUrl: resolved }));
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Falha ao enviar imagem.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    const name = form.name.trim();
    const email = form.email.trim();
    if (name.length < 2) {
      setLocalError("Informe o nome do usuário (mínimo 2 caracteres).");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLocalError("Informe um e-mail válido.");
      return;
    }
    const password = form.password.trim();
    if (!editing && password.length < 8) {
      setLocalError("Informe uma senha com pelo menos 8 caracteres.");
      return;
    }
    if (editing && password && password.length < 8) {
      setLocalError("A nova senha precisa ter pelo menos 8 caracteres (ou deixe em branco pra manter a atual).");
      return;
    }
    const ratingRaw = form.rating.trim();
    const rating = ratingRaw ? Number(ratingRaw) : undefined;
    if (rating !== undefined && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
      setLocalError("Avaliação inválida. Informe um número inteiro entre 1 e 5, ou deixe em branco.");
      return;
    }

    setLocalError(null);
    const base = {
      name,
      email,
      role: form.role as UserCreateInput["role"],
      phone: form.phone.trim() || undefined,
      phone2: form.phone2.trim() || undefined,
      city: form.city.trim() || undefined,
      neighborhood: form.neighborhood.trim() || undefined,
      avatarUrl: form.avatarUrl.trim() || undefined,
      status: form.status as UserCreateInput["status"],
      emailVerified: form.emailVerified,
      rating,
    };
    if (editing) {
      const update: UserUpdateInput = { ...base };
      if (password) update.password = password;
      onSubmit(update);
    } else {
      onSubmit({ ...base, password });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl dark:bg-forest">
        <h3 className="text-xl font-bold text-forest">{editing ? "Editar usuário" : "Novo usuário"}</h3>
        {editing && <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">USR-{editing.id}</p>}

        <div className="mt-4 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gold/40 bg-primary/5">
              {form.avatarUrl ? (
                <img src={form.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-2xl text-stone-400">person</span>
              )}
            </div>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gold/40 bg-white px-3 py-2 text-xs font-semibold text-forest hover:bg-primary/5 dark:bg-forest-green">
              <span className="material-symbols-outlined text-[16px]">upload</span>
              {uploading ? "Enviando…" : "Enviar avatar"}
              <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => void handleFileChange(e)} />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Nome</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary dark:bg-forest-green"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">E-mail</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary dark:bg-forest-green"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                {editing ? "Nova senha (opcional)" : "Senha"}
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={editing ? "Deixe em branco pra manter a atual" : "Mínimo 8 caracteres"}
                className="rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary dark:bg-forest-green"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Papel</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary dark:bg-forest-green"
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {USER_ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Telefone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary dark:bg-forest-green"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                Telefone alternativo
              </label>
              <input
                value={form.phone2}
                onChange={(e) => setForm({ ...form, phone2: e.target.value })}
                className="rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary dark:bg-forest-green"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Cidade</label>
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary dark:bg-forest-green"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Bairro</label>
              <input
                value={form.neighborhood}
                onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                className="rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary dark:bg-forest-green"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary dark:bg-forest-green"
              >
                {USER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {USER_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">E-mail verificado</label>
              <select
                value={form.emailVerified ? "true" : "false"}
                onChange={(e) => setForm({ ...form, emailVerified: e.target.value === "true" })}
                className="rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary dark:bg-forest-green"
              >
                <option value="false">Não</option>
                <option value="true">Sim</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Avaliação (1-5)</label>
              <input
                type="number"
                min={1}
                max={5}
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: e.target.value })}
                placeholder="Opcional"
                className="rounded-lg border border-gold/40 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary dark:bg-forest-green"
              />
            </div>
          </div>
        </div>

        {(localError || error) && <p className="mt-3 text-xs font-semibold text-state-critical">{localError || error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-full border border-stone-200 px-4 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-50 disabled:opacity-50 dark:text-stone-400"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || uploading}
            className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Salvando…" : editing ? "Atualizar usuário" : "Criar usuário"}
          </button>
        </div>
      </div>
    </div>
  );
}
