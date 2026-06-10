import type { AdminDashboardCommissionsSummary } from "../types";

type AdminDashboardCommissionsPanelProps = {
  days: number;
  onDaysChange: (days: number) => void;
  data: AdminDashboardCommissionsSummary | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
};

const formatCurrencyBRL = (value: number): string => {
  const normalized = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(normalized);
};

const statusClass = (status: string): string => {
  if (status === "PAGO") return "bg-green-100 text-green-800";
  return "bg-yellow-100 text-yellow-800";
};

export const AdminDashboardCommissionsPanel = ({
  days,
  onDaysChange,
  data,
  loading,
  error,
  onRetry,
}: AdminDashboardCommissionsPanelProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
      <div className="p-6 border-b border-stone-100 bg-primary flex flex-wrap gap-4 justify-between items-center">
        <h3
          className="text-xs text-white font-medium uppercase tracking-wider"
          style={{ color: "#ffffff" }}
        >
          Visao Geral de Comissoes
        </h3>
        <div className="flex gap-3 items-center">
          <select
            className="bg-white border border-[#cfe7d1] text-forest-green text-sm font-sans rounded-lg py-1.5 px-3 focus:ring-1 focus:ring-primary cursor-pointer"
            value={String(days)}
            onChange={(event) => onDaysChange(Number(event.target.value))}
          >
            <option value="30">Ultimos 30 dias</option>
            <option value="90">Ultimo trimestre</option>
            <option value="365">No ano</option>
          </select>
          <button
            type="button"
            onClick={onRetry}
            className="px-3 py-1.5 rounded-lg border border-[#cfe7d1] bg-white text-forest-green text-xs font-semibold hover:bg-[#f6f8f6] transition-colors"
          >
            Atualizar
          </button>
        </div>
      </div>
      {error && !data ? (
        <div className="p-6 flex flex-col gap-2">
          <p className="text-sm font-semibold text-red-700">Falha ao carregar comissoes.</p>
          <p className="text-xs text-red-600">{error}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 px-6 pt-4">
            <div className="rounded-xl border border-[#cfe7d1] p-3">
              <p className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold">Profissionais</p>
              <p className="text-xl font-bold text-forest mt-1">{data?.totals.professionals ?? "--"}</p>
            </div>
            <div className="rounded-xl border border-[#cfe7d1] p-3">
              <p className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold">Servicos</p>
              <p className="text-xl font-bold text-forest mt-1">{data?.totals.services ?? "--"}</p>
            </div>
            <div className="rounded-xl border border-[#cfe7d1] p-3">
              <p className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold">Vendas</p>
              <p className="text-xl font-bold text-forest mt-1">
                {data ? formatCurrencyBRL(data.totals.totalSales) : "--"}
              </p>
            </div>
            <div className="rounded-xl border border-[#cfe7d1] p-3">
              <p className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold">Comissoes</p>
              <p className="text-xl font-bold text-primary mt-1">
                {data ? formatCurrencyBRL(data.totals.totalCommissions) : "--"}
              </p>
            </div>
          </div>
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-forest text-white text-xs font-sans uppercase tracking-wider border-y border-stone-100">
                  <th className="px-6 py-4 font-medium text-white">Profissional</th>
                  <th className="px-6 py-4 font-medium text-white">Funcao</th>
                  <th className="px-6 py-4 font-medium text-white">Servicos</th>
                  <th className="px-6 py-4 font-medium text-right text-white">Total de Vendas</th>
                  <th className="px-6 py-4 font-medium text-right text-white">Comissao</th>
                  <th className="px-6 py-4 font-medium text-center text-white">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-body">
                {loading && !data ? (
                  <tr>
                    <td className="px-6 py-4 text-sm text-stone-500" colSpan={6}>
                      Carregando comissoes...
                    </td>
                  </tr>
                ) : data && data.rows.length > 0 ? (
                  data.rows.map((row) => (
                    <tr key={row.professionalId} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-stone-800">{row.professionalName}</span>
                          <span className="text-[11px] text-stone-500">{row.unitName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-stone-600 font-sans text-sm">{row.roleLabel}</td>
                      <td className="px-6 py-4 text-stone-600 font-sans text-sm">{row.servicesPerformed}</td>
                      <td className="px-6 py-4 text-right font-medium text-stone-800">
                        {formatCurrencyBRL(row.totalSales)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-primary">
                        {formatCurrencyBRL(row.commissionTotal)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-sans ${statusClass(
                            row.paymentStatus
                          )}`}
                        >
                          {row.paymentStatus === "PAGO" ? "Pago" : "Pendente"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-6 py-4 text-sm text-stone-500" colSpan={6}>
                      Sem dados de comissao para o periodo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
