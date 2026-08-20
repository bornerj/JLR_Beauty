import { useCallback, useEffect, useState } from "react";
import { getToken } from "../../../lib/auth";
import { logger } from "../../../utils/logger";
import { fetchConciergeSessions, fetchSetting, updateSetting } from "../../shared/api";
import { formatDateTimeBR } from "../../shared/format";
import type { ConciergeSession, ConciergeSessionStatus } from "./types";

/**
 * Admin V2 (PLAN-0026, Onda 9) — WhatsApp/Integrações, tier M (legado tinha `behavior.ts`
 * imperativo, 361 linhas + 96 de markup). Reusa `GET /concierge/sessions` (auditoria,
 * somente leitura) + `/api/settings/:key` genérico (Onda 2) pras 3 configs do fluxo do bot:
 * "categorias primeiro" (boolean) e as 2 saudações (texto). Nenhuma rota nova.
 */

const CATEGORY_FIRST_KEY = "whatsapp_flow_category_first";
const OPENING_GREETING_KEY = "whatsapp_opening_greeting_text";
const COMPLETION_GREETING_KEY = "whatsapp_completion_greeting_text";
const DEFAULT_OPENING_GREETING = "Seja bem-vinda. Qual tratamento deseja fazer hoje?";
const DEFAULT_COMPLETION_GREETING = "Agendamento registrado com sucesso. Nosso time vai confirmar os detalhes em seguida.";

const parseBooleanSettingValue = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") return ["1", "true", "yes", "sim", "on", "enabled"].includes(value.trim().toLowerCase());
  if (value && typeof value === "object" && "enabled" in (value as Record<string, unknown>)) {
    return Boolean((value as Record<string, unknown>).enabled);
  }
  return false;
};

const parseTextSettingValue = (value: unknown, fallback: string): string => {
  if (typeof value === "string" && value.trim()) return value.trim();
  return fallback;
};

const STATUS_LABELS: Record<ConciergeSessionStatus, string> = {
  ACTIVE: "Ativo",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
};

const STATUS_BADGE_CLASS: Record<ConciergeSessionStatus, string> = {
  ACTIVE: "bg-state-info/15 text-state-info",
  COMPLETED: "bg-state-healthy/15 text-state-healthy",
  CANCELLED: "bg-state-critical/15 text-state-critical",
};

type SettingsState = { loading: boolean; error: string | null };
type SessionsState = { loading: boolean; data: ConciergeSession[] | null; error: string | null };

export function WhatsappIntegrationsView() {
  const [categoryFirst, setCategoryFirst] = useState(false);
  const [categoryFirstSaving, setCategoryFirstSaving] = useState(false);
  const [openingGreeting, setOpeningGreeting] = useState(DEFAULT_OPENING_GREETING);
  const [completionGreeting, setCompletionGreeting] = useState(DEFAULT_COMPLETION_GREETING);
  const [greetingsSaving, setGreetingsSaving] = useState(false);
  const [greetingsMessage, setGreetingsMessage] = useState("");
  const [settingsState, setSettingsState] = useState<SettingsState>({ loading: true, error: null });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sessionsState, setSessionsState] = useState<SessionsState>({ loading: true, data: null, error: null });

  const loadSettings = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setSettingsState({ loading: false, error: "Sessão expirada. Faça login novamente." });
      return;
    }
    setSettingsState({ loading: true, error: null });
    try {
      const [categoryFirstSetting, openingSetting, completionSetting] = await Promise.all([
        fetchSetting({ token, key: CATEGORY_FIRST_KEY }),
        fetchSetting({ token, key: OPENING_GREETING_KEY }),
        fetchSetting({ token, key: COMPLETION_GREETING_KEY }),
      ]);
      setCategoryFirst(parseBooleanSettingValue(categoryFirstSetting?.value));
      setOpeningGreeting(parseTextSettingValue(openingSetting?.value, DEFAULT_OPENING_GREETING));
      setCompletionGreeting(parseTextSettingValue(completionSetting?.value, DEFAULT_COMPLETION_GREETING));
      setSettingsState({ loading: false, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar configurações.";
      logger.warn("Falha ao carregar configurações do WhatsApp (Admin V2)", { error: message });
      setSettingsState({ loading: false, error: message });
    }
  }, []);

  const loadSessions = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setSessionsState({ loading: false, data: null, error: "Sessão expirada. Faça login novamente." });
      return;
    }
    setSessionsState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchConciergeSessions({
        token,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        from: dateFrom || undefined,
        to: dateTo || undefined,
      });
      setSessionsState({ loading: false, data, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar contatos.";
      logger.warn("Falha ao carregar contatos do WhatsApp (Admin V2)", { error: message });
      setSessionsState((prev) => ({ loading: false, data: prev.data, error: message }));
    }
  }, [search, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    void loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCategoryFirstToggle = useCallback(async (nextValue: boolean) => {
    const token = getToken();
    if (!token) return;
    const previousValue = categoryFirst;
    setCategoryFirst(nextValue);
    setCategoryFirstSaving(true);
    try {
      await updateSetting({ token, key: CATEGORY_FIRST_KEY, value: nextValue });
    } catch (error) {
      logger.warn("Falha ao salvar configuração do fluxo WhatsApp (Admin V2)", {
        error: error instanceof Error ? error.message : String(error),
      });
      setCategoryFirst(previousValue);
    } finally {
      setCategoryFirstSaving(false);
    }
  }, [categoryFirst]);

  const handleSaveGreetings = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    const opening = openingGreeting.trim() || DEFAULT_OPENING_GREETING;
    const completion = completionGreeting.trim() || DEFAULT_COMPLETION_GREETING;
    setGreetingsSaving(true);
    setGreetingsMessage("");
    try {
      await Promise.all([
        updateSetting({ token, key: OPENING_GREETING_KEY, value: opening }),
        updateSetting({ token, key: COMPLETION_GREETING_KEY, value: completion }),
      ]);
      setOpeningGreeting(opening);
      setCompletionGreeting(completion);
      setGreetingsMessage("Saudações salvas com sucesso.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao salvar saudações.";
      logger.warn("Falha ao salvar saudações do WhatsApp (Admin V2)", { error: message });
      setGreetingsMessage(message);
    } finally {
      setGreetingsSaving(false);
    }
  }, [openingGreeting, completionGreeting]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-3xl font-bold text-forest">WhatsApp / Integrações</h1>
        <p className="text-base text-stone-600 dark:text-stone-400">
          auditoria dos atendimentos e agendamentos do concierge, e configuração do fluxo do bot
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-[#cfe7d1] bg-white p-5 dark:border-forest-green dark:bg-forest">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-forest">Fluxo de serviços no WhatsApp</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">Controle como o bot apresenta os serviços para clientes no celular.</p>
          </div>
          <label className="inline-flex cursor-pointer select-none items-center gap-3 text-sm font-medium text-forest">
            <input
              type="checkbox"
              checked={categoryFirst}
              disabled={settingsState.loading || categoryFirstSaving}
              onChange={(e) => void handleCategoryFirstToggle(e.target.checked)}
              className="h-4 w-4 rounded border border-primary/60 text-primary focus:ring-primary"
            />
            Mostrar categorias primeiro
          </label>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          {categoryFirstSaving
            ? "Salvando configuração…"
            : categoryFirst
              ? "Modo ativo: cliente vê categorias primeiro e depois os serviços da categoria."
              : "Modo desativado: cliente vê todos os serviços de uma vez."}
        </p>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Saudação inicial
            </label>
            <textarea
              value={openingGreeting}
              onChange={(e) => setOpeningGreeting(e.target.value)}
              disabled={settingsState.loading}
              className="min-h-[84px] w-full rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
              placeholder={DEFAULT_OPENING_GREETING}
            />
            <p className="text-[11px] text-stone-500 dark:text-stone-400">O bot sempre prefixa com Bom Dia, Boa Tarde ou Boa Noite.</p>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Saudação de conclusão
            </label>
            <textarea
              value={completionGreeting}
              onChange={(e) => setCompletionGreeting(e.target.value)}
              disabled={settingsState.loading}
              className="min-h-[84px] w-full rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
              placeholder={DEFAULT_COMPLETION_GREETING}
            />
            <p className="text-[11px] text-stone-500 dark:text-stone-400">Mensagem enviada ao final do agendamento no WhatsApp.</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => void handleSaveGreetings()}
            disabled={settingsState.loading || greetingsSaving}
            className="rounded-lg border border-gold/40 bg-white px-4 py-2 text-sm font-medium text-forest hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-forest-green"
          >
            {greetingsSaving ? "Salvando…" : "Salvar saudações"}
          </button>
          {greetingsMessage && (
            <p
              className={`text-xs ${greetingsMessage.includes("sucesso") ? "text-state-healthy" : "text-state-critical"}`}
            >
              {greetingsMessage}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-[#cfe7d1] bg-white p-5 dark:border-forest-green dark:bg-forest">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar nome, telefone, serviço, unidade…"
            className="rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
          >
            <option value="">Todos os status</option>
            <option value="ACTIVE">Ativo</option>
            <option value="COMPLETED">Concluído</option>
            <option value="CANCELLED">Cancelado</option>
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
          />
          <button
            type="button"
            onClick={() => void loadSessions()}
            disabled={sessionsState.loading}
            className="rounded-lg border border-gold/40 bg-white px-4 py-2 text-sm font-medium text-forest hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-forest-green"
          >
            {sessionsState.loading ? "Atualizando…" : "Atualizar"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-[#cfe7d1] bg-white dark:border-forest-green dark:bg-forest">
        <div className="flex items-center justify-between px-5 py-4">
          <h3 className="text-lg font-semibold text-forest">Registros de contato</h3>
          <span className="text-xs text-stone-500 dark:text-stone-400">
            {sessionsState.data ? `${sessionsState.data.length} registro${sessionsState.data.length === 1 ? "" : "s"}` : "…"}
          </span>
        </div>
        {sessionsState.error && <p className="px-5 pb-3 text-sm font-semibold text-state-critical">{sessionsState.error}</p>}
        {sessionsState.loading && !sessionsState.data ? (
          <p className="px-5 pb-5 text-sm text-stone-600 dark:text-stone-400">Carregando contatos de WhatsApp…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead>
                <tr className="border-y border-[#cfe7d1] text-xs font-bold uppercase tracking-wider text-stone-500 dark:border-forest-green dark:text-stone-400">
                  <th className="px-4 py-3">Contato em</th>
                  <th className="px-4 py-3">Origem</th>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Telefone</th>
                  <th className="px-4 py-3">Serviço</th>
                  <th className="px-4 py-3">Unidade</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Horário</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Finalizado em</th>
                </tr>
              </thead>
              <tbody>
                {(sessionsState.data ?? []).length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-stone-500 dark:text-stone-400" colSpan={10}>
                      Nenhum contato encontrado.
                    </td>
                  </tr>
                ) : (
                  (sessionsState.data ?? []).map((session) => {
                    const scheduledDate =
                      session.scheduledDateLabel?.trim() ||
                      (session.scheduledFor ? new Date(session.scheduledFor).toLocaleDateString("pt-BR") : "—");
                    const scheduledTime =
                      session.slotLabel?.trim() ||
                      (session.scheduledFor
                        ? new Date(session.scheduledFor).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
                        : "—");
                    return (
                      <tr key={session.id} className="border-b border-stone-100 last:border-0 dark:border-forest-green/40">
                        <td className="px-4 py-3 text-forest">{formatDateTimeBR(session.createdAt)}</td>
                        <td className="px-4 py-3 text-forest">{session.origin === "WHATSAPP" ? "WhatsApp" : "Site"}</td>
                        <td className="px-4 py-3 text-forest">{session.customerName?.trim() || "—"}</td>
                        <td className="px-4 py-3 text-forest">{session.phone || "—"}</td>
                        <td className="px-4 py-3 text-forest">{session.service?.name ?? "—"}</td>
                        <td className="px-4 py-3 text-forest">{session.unit?.name ?? "—"}</td>
                        <td className="px-4 py-3 text-forest">{scheduledDate}</td>
                        <td className="px-4 py-3 text-forest">{scheduledTime}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE_CLASS[session.status]}`}>
                            {STATUS_LABELS[session.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-forest">{formatDateTimeBR(session.completedAt)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
