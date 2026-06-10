import { useMemo, useState, type ReactElement } from "react";

type DashboardTab = "servicos" | "leads";

const tabClassName = (active: boolean): string => {
  if (active) {
    return "bg-primary border border-primary text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm";
  }
  return "bg-white border border-stone-200 text-stone-700 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm opacity-60 hover:opacity-100";
};

export const AdminDashboardView = (): ReactElement => {
  const [activeTab, setActiveTab] = useState<DashboardTab>("servicos");
  const tabLabel = useMemo(() => (activeTab === "servicos" ? "Servicos" : "Leads"), [activeTab]);

  return (
    <div className="max-w-[1400px] mx-auto p-8 flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className={tabClassName(activeTab === "servicos")}
          onClick={() => setActiveTab("servicos")}
        >
          Servicos
        </button>
        <button
          type="button"
          className={tabClassName(activeTab === "leads")}
          onClick={() => setActiveTab("leads")}
        >
          Leads
        </button>
      </div>

      <section className={activeTab === "servicos" ? "" : "hidden"}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 flex flex-col">
            <header className="flex flex-wrap justify-between items-end gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-forest dark:text-white text-4xl display-hero text-shadow-strong italic">
                  Sua melhor versão, Eternizada
                </h2>
                <p className="text-stone-500 text-lg font-normal">Redefinindo a Beleza!</p>
              </div>
            </header>
            <div className="mt-6" data-react-admin-dashboard-kpis />
            <div className="mt-6" data-react-admin-dashboard-sales />
          </div>

          <div
            data-react-admin-dashboard-agenda
            className="lg:col-start-3 lg:row-start-1 self-start"
          />
        </div>
      </section>

      <section
        className={
          activeTab === "leads"
            ? "bg-white rounded-2xl border border-[#cfe7d1] shadow-sm p-6 flex flex-col gap-5"
            : "hidden bg-white rounded-2xl border border-[#cfe7d1] shadow-sm p-6 flex flex-col gap-5"
        }
      >
          <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex flex-col gap-1">
              <h3 className="text-primary text-3xl display-hero text-shadow-strong leading-tight">
                Gestão de Leads
              </h3>
              <p className="text-text-muted text-sm font-body">
                Gerencie as novas solicitacoes de franquia e acompanhe o status.
              </p>
            </div>
            <div className="text-xs uppercase tracking-wider text-stone-400">Aba: {tabLabel}</div>
          </header>

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4 rounded-xl border border-[#cfe7d1] shadow-sm">
            <div className="relative w-full lg:w-96 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-text-muted group-focus-within:text-primary transition-colors">
                  search
                </span>
              </div>
              <input
                className="block w-full pl-10 pr-3 py-2.5 border border-[#cfe7d1] rounded-lg leading-5 bg-[#f6f8f6] text-forest-green placeholder-text-muted focus:outline-none focus:bg-white focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm font-body transition-all"
                placeholder="Buscar por nome, email ou cidade..."
                type="text"
                data-leads-search
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="relative">
                <select
                  className="appearance-none bg-[#f6f8f6] border border-[#cfe7d1] text-forest-green py-2.5 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body text-sm cursor-pointer hover:bg-white transition-colors"
                  data-leads-status-filter
                >
                  <option value="">Status</option>
                  <option value="analise">Em Analise</option>
                  <option value="aprovado">Aprovado</option>
                  <option value="reprovado">Reprovado</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-muted">
                  <span className="material-symbols-outlined text-lg">expand_more</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#cfe7d1] shadow-sm overflow-hidden">
            <div className="admin-grid-toolbar flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4 border-b border-[#cfe7d1] bg-primary">
              <div className="text-xs text-white font-medium uppercase tracking-wider" data-leads-pagination-range>
                Mostrando 0-0 de 0 leads
              </div>
              <div className="admin-grid-toolbar-controls flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase tracking-wider text-white font-semibold">
                    Itens por pagina
                  </span>
                  <div className="relative">
                    <select
                      className="appearance-none bg-white border border-[#cfe7d1] text-forest-green py-1.5 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-xs cursor-pointer hover:bg-[#f6f8f6] transition-colors"
                      data-leads-page-size
                      defaultValue="10"
                    >
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-muted">
                      <span className="material-symbols-outlined text-base">expand_more</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="px-3 py-1.5 rounded-lg border border-[#cfe7d1] bg-forest text-gold text-xs font-semibold hover:bg-primary transition-colors disabled:opacity-40"
                    type="button"
                    data-leads-page-first
                  >
                    <span className="material-symbols-outlined text-sm align-middle">first_page</span>
                    Primeira
                  </button>
                  <button
                    className="px-3 py-1.5 rounded-lg border border-[#cfe7d1] bg-forest text-gold text-xs font-semibold hover:bg-primary transition-colors disabled:opacity-40"
                    type="button"
                    data-leads-page-prev
                  >
                    <span className="material-symbols-outlined text-sm align-middle">chevron_left</span>
                    Anterior
                  </button>
                  <div
                    className="px-3 py-1.5 rounded-lg border border-[#cfe7d1] bg-forest text-xs font-semibold text-gold"
                    data-leads-pagination-page
                  >
                    Pagina 1 de 1
                  </div>
                  <button
                    className="px-3 py-1.5 rounded-lg border border-[#cfe7d1] bg-forest text-gold text-xs font-semibold hover:bg-primary transition-colors disabled:opacity-40"
                    type="button"
                    data-leads-page-next
                  >
                    Proxima
                    <span className="material-symbols-outlined text-sm align-middle">chevron_right</span>
                  </button>
                  <button
                    className="px-3 py-1.5 rounded-lg border border-[#cfe7d1] bg-forest text-gold text-xs font-semibold hover:bg-primary transition-colors disabled:opacity-40"
                    type="button"
                    data-leads-page-last
                  >
                    Ultima
                    <span className="material-symbols-outlined text-sm align-middle">last_page</span>
                  </button>
                </div>
              </div>
            </div>
            <table className="min-w-full divide-y divide-[#cfe7d1]">
              <thead className="bg-forest">
                <tr>
                  <th className="table-head-cell text-left text-white" scope="col">
                    Candidato
                  </th>
                  <th className="table-head-cell text-left text-white" scope="col">
                    Cidade/UF
                  </th>
                  <th className="table-head-cell text-left text-white" scope="col">
                    Investimento Previsto
                  </th>
                  <th className="table-head-cell text-left text-white" scope="col">
                    Status
                  </th>
                  <th className="table-head-cell text-right text-white" scope="col">
                    Acoes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#f4f0e7]" data-leads-table-body>
                <tr>
                  <td className="table-cell" colSpan={5}>
                    Carregando leads...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
      </section>
    </div>
  );
};
