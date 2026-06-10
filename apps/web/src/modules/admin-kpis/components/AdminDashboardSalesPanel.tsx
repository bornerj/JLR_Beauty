import type {
  AdminDashboardSalesScope,
  AdminDashboardSalesSeries,
  AdminDashboardSalesSeriesPoint,
} from "../types";

type AdminDashboardSalesPanelProps = {
  scope: AdminDashboardSalesScope;
  days: number;
  onScopeChange: (scope: AdminDashboardSalesScope) => void;
  onDaysChange: (days: number) => void;
  data: AdminDashboardSalesSeries | null;
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

const compactPoints = (points: AdminDashboardSalesSeriesPoint[], maxPoints: number) => {
  if (points.length <= maxPoints) return points;
  const bucketSize = Math.ceil(points.length / maxPoints);
  const compacted: AdminDashboardSalesSeriesPoint[] = [];
  for (let start = 0; start < points.length; start += bucketSize) {
    const chunk = points.slice(start, start + bucketSize);
    const sum = chunk.reduce((acc, item) => acc + item.value, 0);
    const avg = sum / chunk.length;
    compacted.push({
      date: chunk[0].date,
      label: chunk[chunk.length - 1].label,
      value: avg,
    });
  }
  return compacted;
};

export const AdminDashboardSalesPanel = ({
  scope,
  days,
  onScopeChange,
  onDaysChange,
  data,
  loading,
  error,
  onRetry,
}: AdminDashboardSalesPanelProps) => {
  const points = compactPoints(data?.points || [], 30);
  const maxValue = Math.max(1, ...points.map((point) => point.value));
  const scopeLabel =
    scope === "SERVICES"
      ? "Servicos"
      : scope === "PRODUCTS"
      ? "Produtos"
      : scope === "SUBSCRIPTIONS"
      ? "Assinaturas"
      : "Todos";

  return (
    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-stone-100 p-6 flex flex-col">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h3 className="text-xl font-bold text-forest">Desempenho de Vendas</h3>
        <div className="flex gap-3">
          <select
            className="bg-stone-50 border-none text-sm font-sans rounded-lg py-1.5 px-3 text-stone-600 focus:ring-1 focus:ring-primary cursor-pointer"
            value={scope}
            onChange={(event) => onScopeChange(event.target.value as AdminDashboardSalesScope)}
          >
            <option value="SERVICES">Servicos</option>
            <option value="PRODUCTS">Produtos</option>
            <option value="SUBSCRIPTIONS">Assinaturas</option>
            <option value="ALL">Todos</option>
          </select>
          <select
            className="bg-stone-50 border-none text-sm font-sans rounded-lg py-1.5 px-3 text-stone-600 focus:ring-1 focus:ring-primary cursor-pointer"
            value={String(days)}
            onChange={(event) => onDaysChange(Number(event.target.value))}
          >
            <option value="30">Ultimos 30 dias</option>
            <option value="90">Ultimo trimestre</option>
            <option value="365">No ano</option>
          </select>
        </div>
      </div>

      {error && !data ? (
        <div className="rounded-xl border border-red-100 p-4 bg-red-50/50 flex flex-col gap-2">
          <p className="text-sm font-semibold text-red-700">Falha ao carregar serie de vendas.</p>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
            <div className="rounded-xl border border-[#cfe7d1] p-3">
              <p className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold">
                Receita ({scopeLabel})
              </p>
              <p className="text-xl font-bold text-forest mt-1">
                {data ? formatCurrencyBRL(data.totals.gross) : "Carregando..."}
              </p>
            </div>
            <div className="rounded-xl border border-[#cfe7d1] p-3">
              <p className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold">
                Pedidos Pagos
              </p>
              <p className="text-xl font-bold text-forest mt-1">
                {data ? data.totals.ordersPaid : "--"}
              </p>
            </div>
            <div className="rounded-xl border border-[#cfe7d1] p-3">
              <p className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold">
                Itens Vendidos
              </p>
              <p className="text-xl font-bold text-forest mt-1">
                {data ? data.totals.itemsSold : "--"}
              </p>
            </div>
          </div>

          <div className="flex-1 flex items-end gap-2 sm:gap-3 h-64 pt-2 pb-2 font-sans text-xs text-stone-400 overflow-x-auto">
            {loading && !data ? (
              <div className="w-full h-full flex items-center justify-center text-sm text-stone-500">
                Carregando serie...
              </div>
            ) : points.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-sm text-stone-500">
                Sem dados para o periodo selecionado.
              </div>
            ) : (
              <div className="flex-1 flex items-end justify-between h-full min-w-[640px]">
                {points.map((point) => {
                  const height = Math.max(6, Math.round((point.value / maxValue) * 100));
                  const tooltip = formatCurrencyBRL(point.value);
                  return (
                    <div key={point.date} className="flex flex-col items-center gap-2 group w-full">
                      <div
                        className="w-full max-w-[26px] bg-stone-200 rounded-t-sm group-hover:bg-primary/50 transition-all relative"
                        style={{ height: `${height}%` }}
                      >
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-forest text-white px-2 py-1 rounded text-xs z-10 whitespace-nowrap">
                          {tooltip}
                        </div>
                      </div>
                      <span>{point.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

