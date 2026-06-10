import type { ReactElement } from "react";

export const AdminSubscribersView = (): ReactElement => {
  return (
    <>
<div className="max-w-[1400px] mx-auto p-8 flex flex-col gap-8">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex flex-col gap-1">
                <h2 className="text-forest dark:text-white text-3xl display-hero text-shadow-strong italic">Gestão de Assinantes</h2>
                <p className="text-stone-500 text-lg font-normal">Visualize, inclua e edite assinantes vinculados aos planos.</p>
            </div>
            <button className="px-5 py-2 text-sm font-semibold rounded-lg bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors flex items-center gap-2" type="button" data-open-modal="assinantes-form">
                <span className="material-symbols-outlined text-base">add</span>
                INCLUIR
            </button>
        </header>

        <section className="bg-white rounded-xl border border-[#cfe7d1] shadow-sm p-6 flex flex-col gap-4">
            <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-3">
                <div className="relative w-full group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-text-muted group-focus-within:text-primary transition-colors">search</span>
                    </div>
                    <input className="block w-full pl-10 pr-3 py-2.5 border border-[#cfe7d1] rounded-lg leading-5 bg-[#f6f8f6] text-forest-green placeholder-text-muted focus:outline-none focus:bg-white focus:ring-1 focus:ring-primary focus:border-primary text-xs font-body transition-all" placeholder="Buscar assinante..." type="text" data-subscriptions-search />
                </div>
                <div className="relative w-full">
                    <select className="appearance-none w-full bg-[#f6f8f6] border border-[#cfe7d1] text-forest-green py-2.5 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body text-xs cursor-pointer hover:bg-white transition-colors" data-subscriptions-status-filter>
                        <option value="">Status</option>
                        <option value="ATIVA">Ativa</option>
                        <option value="PENDENTE">Pendente</option>
                        <option value="CANCELADA">Cancelada</option>
                        <option value="INADIMPLENTE">Inadimplente</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-muted">
                        <span className="material-symbols-outlined text-lg">expand_more</span>
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-[#cfe7d1]">
                <div className="admin-grid-toolbar flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4 border-b border-[#cfe7d1] bg-primary">
                    <div className="text-xs text-white font-medium uppercase tracking-wider" data-subscriptions-pagination-range>
                        Mostrando 0-0 de 0 assinantes
                    </div>
                    <div className="admin-grid-toolbar-controls flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] uppercase tracking-wider text-white font-semibold">Itens por pagina</span>
                            <div className="relative">
                                <select className="appearance-none bg-white border border-[#cfe7d1] text-forest-green py-1.5 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-xs cursor-pointer hover:bg-[#f6f8f6] transition-colors" data-subscriptions-page-size>
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
                            <button className="px-3 py-1.5 rounded-lg border border-[#cfe7d1] bg-forest text-gold text-xs font-semibold hover:bg-primary transition-colors disabled:opacity-40" type="button" data-subscriptions-page-first>
                                <span className="material-symbols-outlined text-sm align-middle">first_page</span>
                                Primeira
                            </button>
                            <button className="px-3 py-1.5 rounded-lg border border-[#cfe7d1] bg-forest text-gold text-xs font-semibold hover:bg-primary transition-colors disabled:opacity-40" type="button" data-subscriptions-page-prev>
                                <span className="material-symbols-outlined text-sm align-middle">chevron_left</span>
                                Anterior
                            </button>
                            <div className="px-3 py-1.5 rounded-lg border border-[#cfe7d1] bg-forest text-xs font-semibold text-gold" data-subscriptions-pagination-page>
                                Pagina 1 de 1
                            </div>
                            <button className="px-3 py-1.5 rounded-lg border border-[#cfe7d1] bg-forest text-gold text-xs font-semibold hover:bg-primary transition-colors disabled:opacity-40" type="button" data-subscriptions-page-next>
                                Proxima
                                <span className="material-symbols-outlined text-sm align-middle">chevron_right</span>
                            </button>
                            <button className="px-3 py-1.5 rounded-lg border border-[#cfe7d1] bg-forest text-gold text-xs font-semibold hover:bg-primary transition-colors disabled:opacity-40" type="button" data-subscriptions-page-last>
                                Ultima
                                <span className="material-symbols-outlined text-sm align-middle">last_page</span>
                            </button>
                        </div>
                    </div>
                </div>
                <table className="min-w-full divide-y divide-[#cfe7d1]">
                    <thead className="bg-[#f6f8f6]">
                        <tr>
                            <th className="table-head-cell text-left text-text-muted">ID</th>
                            <th className="table-head-cell text-left text-text-muted">Cliente</th>
                            <th className="table-head-cell text-left text-text-muted">Email</th>
                            <th className="table-head-cell text-left text-text-muted">Telefone</th>
                            <th className="table-head-cell text-left text-text-muted">Plano</th>
                            <th className="table-head-cell text-left text-text-muted">Status</th>
                            <th className="table-head-cell text-left text-text-muted">Inicio</th>
                            <th className="table-head-cell text-left text-text-muted">Cancelamento</th>
                            <th className="table-head-cell text-right text-text-muted">Acoes</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-[#f4f0e7]" data-subscriptions-table-body>
                        <tr>
                            <td className="table-cell" colSpan={9}>Carregando assinantes...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>
    </div>

    </>
  );
};
