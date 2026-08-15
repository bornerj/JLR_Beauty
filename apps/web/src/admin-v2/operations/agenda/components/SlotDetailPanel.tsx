import { formatCurrencyBRL, formatHour, formatMinutes, formatShortDate } from "../../../shared/format";
import type { SlotDetail } from "../types";

/**
 * Admin V2 (PLAN-0022, Onda 4) — detalhamento do horário selecionado no heatmap
 * (RETROFIT-005). "Receita perdida" nunca é só o número — sempre vem com a explicação
 * da composição (governança #6 do plano), calculada e devolvida pronta pelo backend.
 */

export function SlotDetailPanel({
  loading,
  error,
  detail,
  onRetry,
}: {
  loading: boolean;
  error: string | null;
  detail: SlotDetail | null;
  onRetry: () => void;
}) {
  if (loading && !detail) {
    return <p className="text-base text-stone-600 dark:text-stone-400">Carregando horário…</p>;
  }

  if (error && !detail) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-red-100 bg-white p-5">
        <p className="text-sm font-semibold text-red-600">Falha ao carregar o detalhamento do horário.</p>
        <p className="text-sm text-stone-600 dark:text-stone-400">{error}</p>
        <div>
          <button
            type="button"
            onClick={onRetry}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!detail) return null;

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-[#cfe7d1] bg-white p-5 dark:border-forest-green dark:bg-forest">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-bold text-forest">
          {formatShortDate(detail.date)} · {formatHour(detail.hour)}
        </h2>
        <span className="text-sm font-semibold text-forest">{detail.occupancyRate.toFixed(0)}% ocupado</span>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-1 text-base text-stone-600 dark:text-stone-400">
        <span>
          Disponível <strong className="text-forest">{formatMinutes(detail.availableMinutes)}</strong>
        </span>
        <span>
          Reservado <strong className="text-forest">{formatMinutes(detail.bookedMinutes)}</strong>
        </span>
        {detail.revenuePerBookedHour !== null && (
          <span>
            Receita/hora reservada <strong className="text-forest">{formatCurrencyBRL(detail.revenuePerBookedHour)}</strong>
          </span>
        )}
      </div>

      {detail.lostRevenueEstimate ? (
        <div className="rounded-lg border border-state-critical/30 bg-state-critical/5 p-3">
          <p className="text-xs font-bold uppercase tracking-wider text-state-critical">Receita potencial perdida</p>
          <p className="mt-1 text-xl font-bold text-forest">{formatCurrencyBRL(detail.lostRevenueEstimate.amount)}</p>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">{detail.lostRevenueEstimate.explanation}</p>
        </div>
      ) : (
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Sem estimativa de receita perdida para este horário — capacidade totalmente ocupada ou sem taxa de
          referência disponível.
        </p>
      )}

      <div>
        <p className="mb-2 text-sm font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Profissionais escalados</p>
        {detail.professionals.length === 0 ? (
          <p className="text-sm text-stone-500 dark:text-stone-400">Nenhum profissional escalado neste horário.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {detail.professionals.map((professional) => (
              <div
                key={professional.professionalId}
                className="rounded-lg border border-stone-100 p-3 dark:border-forest-green"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-forest">{professional.professionalName}</p>
                  {professional.isIdle ? (
                    <span className="rounded-full bg-state-critical/15 px-2 py-0.5 text-[11px] font-bold text-state-critical">
                      ocioso(a)
                    </span>
                  ) : (
                    <span className="text-sm text-stone-600 dark:text-stone-400">
                      {formatMinutes(professional.bookedMinutes)} de {formatMinutes(professional.scheduledMinutes)} reservado(s)
                    </span>
                  )}
                </div>
                {professional.appointments.length > 0 && (
                  <ul className="mt-2 flex flex-col gap-1">
                    {professional.appointments.map((appointment) => (
                      <li key={appointment.appointmentId} className="text-sm text-stone-600 dark:text-stone-400">
                        {appointment.clientName} · {appointment.serviceName}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
