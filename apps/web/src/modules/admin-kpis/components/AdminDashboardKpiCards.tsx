import type { AdminDashboardKpis } from "../types";

type AdminDashboardKpiCardsProps = {
  data: AdminDashboardKpis | null;
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

const formatSignedPercent = (value: number): string => {
  const normalized = Number.isFinite(value) ? value : 0;
  const prefix = normalized > 0 ? "+" : "";
  return `${prefix}${normalized.toFixed(1)}%`;
};

const MetricCard = ({
  title,
  icon,
  value,
  badgeLabel,
  subtitle,
}: {
  title: string;
  icon: string;
  value: string;
  badgeLabel: string;
  subtitle: string;
}) => {
  return (
    <div className="metric-card group">
      <div className="metric-card-icon group">
        <span className="material-symbols-outlined text-6xl text-gold">{icon}</span>
      </div>
      <div className="flex justify-between items-start">
        <p className="text-stone-500 font-medium font-sans text-sm tracking-wide uppercase">{title}</p>
        <span className="metric-badge">
          <span className="material-symbols-outlined text-sm">trending_up</span> {badgeLabel}
        </span>
      </div>
      <div>
        <p className="text-forest text-4xl display-number text-shadow-strong italic text-gold">{value}</p>
        <p className="text-stone-400 text-sm mt-1 font-sans">{subtitle}</p>
      </div>
    </div>
  );
};

export const AdminDashboardKpiCards = ({
  data,
  loading,
  error,
  onRetry,
}: AdminDashboardKpiCardsProps) => {
  if (loading && !data) {
    return (
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Receita Total"
          icon="payments"
          value="Carregando..."
          badgeLabel="--"
          subtitle="Buscando dados reais"
        />
        <MetricCard
          title="Agendamentos Hoje"
          icon="event_available"
          value="Carregando..."
          badgeLabel="--"
          subtitle="Buscando dados reais"
        />
        <MetricCard
          title="Assinaturas Ativas"
          icon="card_membership"
          value="Carregando..."
          badgeLabel="--"
          subtitle="Buscando dados reais"
        />
      </section>
    );
  }

  if (error && !data) {
    return (
      <section className="bg-white rounded-xl border border-red-100 p-5 flex flex-col gap-3">
        <p className="text-sm text-red-600 font-semibold">Falha ao carregar os KPIs do dashboard.</p>
        <p className="text-xs text-stone-500">{error}</p>
        <div>
          <button
            type="button"
            onClick={onRetry}
            className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-dark transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </section>
    );
  }

  if (!data) return null;

  return (
    <div className="flex flex-col gap-4">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Receita Total"
          icon="payments"
          value={formatCurrencyBRL(data.revenue.current)}
          badgeLabel={formatSignedPercent(data.revenue.deltaPercent)}
          subtitle={`vs ${formatCurrencyBRL(data.revenue.previous)} no periodo anterior`}
        />
        <MetricCard
          title="Agendamentos Hoje"
          icon="event_available"
          value={String(data.appointments.scheduledToday)}
          badgeLabel={`${data.appointments.byStatus.CONFIRMADO} confirmados`}
          subtitle={`${data.appointments.totalInPeriod} no periodo selecionado`}
        />
        <MetricCard
          title="Assinaturas Ativas"
          icon="card_membership"
          value={String(data.subscriptions.activeTotal)}
          badgeLabel={`${data.subscriptions.newInPeriod} novas`}
          subtitle={`Pendentes: ${data.subscriptions.byStatus.PENDENTE} | Inadimplentes: ${data.subscriptions.byStatus.INADIMPLENTE}`}
        />
      </section>
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-[#cfe7d1] p-4">
          <p className="text-xs uppercase tracking-wider text-stone-500 font-semibold">Pedidos</p>
          <p className="text-2xl font-bold text-forest mt-2">{data.orders.total}</p>
          <p className="text-xs text-stone-500 mt-1">Pagos: {data.orders.paid}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#cfe7d1] p-4">
          <p className="text-xs uppercase tracking-wider text-stone-500 font-semibold">Ticket Medio</p>
          <p className="text-2xl font-bold text-forest mt-2">{formatCurrencyBRL(data.revenue.avgTicket)}</p>
          <p className="text-xs text-stone-500 mt-1">Pedidos pagos no periodo</p>
        </div>
        <div className="bg-white rounded-xl border border-[#cfe7d1] p-4">
          <p className="text-xs uppercase tracking-wider text-stone-500 font-semibold">Novos Clientes</p>
          <p className="text-2xl font-bold text-forest mt-2">{data.customers.newInPeriod}</p>
          <p className="text-xs text-stone-500 mt-1">Clientes criados no periodo</p>
        </div>
      </section>
    </div>
  );
};

