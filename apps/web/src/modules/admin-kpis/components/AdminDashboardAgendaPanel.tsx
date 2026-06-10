import type { AdminDashboardAgendaSummary } from "../types";

type AdminDashboardAgendaPanelProps = {
  month: string;
  selectedDate: string;
  onMonthChange: (month: string) => void;
  onDateChange: (date: string) => void;
  data: AdminDashboardAgendaSummary | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
};

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

const addMonths = (monthKey: string, delta: number): string => {
  const [yearRaw, monthRaw] = monthKey.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return monthKey;
  }
  const base = new Date(year, month - 1 + delta, 1);
  return `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}`;
};

const appointmentStatusClass = (status: string): string => {
  if (status === "CONFIRMADO") return "bg-green-100 text-green-700";
  if (status === "PENDENTE") return "bg-yellow-100 text-yellow-700";
  if (status === "CANCELADO") return "bg-red-100 text-red-700";
  return "bg-stone-100 text-stone-600";
};

export const AdminDashboardAgendaPanel = ({
  month,
  selectedDate,
  onMonthChange,
  onDateChange,
  data,
  loading,
  error,
  onRetry,
}: AdminDashboardAgendaPanelProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-6 flex flex-col h-full">
      <h3 className="text-xl font-bold text-forest mb-4">Agendamentos por Data</h3>
      {error && !data ? (
        <div className="rounded-xl border border-red-100 p-4 bg-red-50/50 flex flex-col gap-2">
          <p className="text-sm font-semibold text-red-700">Falha ao carregar agenda.</p>
          <p className="text-xs text-red-600">{error}</p>
          <div>
            <button
              type="button"
              onClick={onRetry}
              className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-dark transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6 pb-6 border-b border-stone-100">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                className="text-stone-400 hover:text-forest"
                onClick={() => onMonthChange(addMonths(month, -1))}
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <span className="font-bold text-stone-800 capitalize">
                {data?.month.label || "Carregando..."}
              </span>
              <button
                type="button"
                className="text-stone-400 hover:text-forest"
                onClick={() => onMonthChange(addMonths(month, 1))}
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
            <div className="grid grid-cols-7 text-center text-xs font-sans mb-2 text-stone-400">
              {WEEKDAY_LABELS.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 text-center text-sm font-medium gap-y-2">
              {(data?.calendar.days || []).map((day) => (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => onDateChange(day.date)}
                  className={`relative mx-auto size-8 rounded-full flex items-center justify-center transition-colors ${
                    day.isSelected
                      ? "bg-primary text-white shadow-md shadow-green-200"
                      : day.isToday
                      ? "bg-forest text-gold"
                      : day.inCurrentMonth
                      ? "text-stone-700 hover:bg-stone-100"
                      : "text-stone-300 hover:bg-stone-50"
                  }`}
                >
                  {day.label}
                  {day.totalAppointments > 0 ? (
                    <span className="absolute -bottom-1.5 -right-1.5 min-w-[14px] h-[14px] px-1 rounded-full bg-gold text-[9px] text-forest font-bold leading-[14px]">
                      {day.totalAppointments}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <h4 className="text-xs font-sans uppercase tracking-widest text-stone-400 mb-3">
              Agenda - {data?.selectedDate.label || selectedDate}
            </h4>
            <div className="flex items-center gap-3 mb-3 text-xs">
              <span className="px-2 py-1 rounded-full bg-stone-100 text-stone-700">
                Total: {data?.summary.total ?? "--"}
              </span>
              <span className="px-2 py-1 rounded-full bg-green-100 text-green-700">
                Confirmados: {data?.summary.byStatus.CONFIRMADO ?? "--"}
              </span>
              <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                Pendentes: {data?.summary.byStatus.PENDENTE ?? "--"}
              </span>
            </div>
            {loading && !data ? (
              <p className="text-sm text-stone-500">Carregando agenda...</p>
            ) : data && data.appointments.length > 0 ? (
              <div className="flex flex-col gap-3">
                {data.appointments.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 items-center group hover:bg-stone-50 p-2 -mx-2 rounded-lg transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center w-12 h-12 bg-cream rounded-lg text-forest border border-stone-100">
                      <span className="text-xs font-bold">{item.timeLabel}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-stone-800">{item.clientName}</p>
                      <p className="text-xs text-stone-500 font-sans">
                        {item.serviceName} - {item.professionalName}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold ${appointmentStatusClass(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-stone-500">Sem agendamentos para a data selecionada.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

