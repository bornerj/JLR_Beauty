import type { ReactElement } from "react";

export const AdminPeopleView = (): ReactElement => {
  return (
    <>
<div className="max-w-[1400px] mx-auto p-8 flex flex-col gap-6">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex flex-col gap-1">
                <h2 className="text-forest dark:text-white text-3xl display-hero text-shadow-strong italic">Pessoas</h2>
                <p className="text-stone-500 text-sm">Gerencie clientes, profissionais e usuarios em um unico modulo.</p>
            </div>
            <button className="px-5 py-2 text-xs font-semibold rounded-lg bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors flex items-center gap-2" type="button" data-open-modal="user-create" data-people-users-action>
                <span className="material-symbols-outlined text-base">person_add</span>
                Adicionar usuario
            </button>
        </header>

        <div className="flex flex-wrap items-center gap-3">
            <button className="people-tab-button bg-primary border border-primary text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm" type="button" data-people-tab-target="clientes">Clientes</button>
            <button className="people-tab-button bg-white border border-stone-200 text-stone-700 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm opacity-60 hover:opacity-100" type="button" data-people-tab-target="profissionais">Profissionais</button>
            <button className="people-tab-button bg-white border border-stone-200 text-stone-700 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm opacity-60 hover:opacity-100" type="button" data-people-tab-target="usuarios">Usuarios</button>
        </div>

        <section className="bg-white rounded-2xl border border-[#cfe7d1] shadow-sm p-5 flex flex-col gap-4" data-people-tab-panel="clientes">
            <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-3">
                <div className="relative w-full group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-text-muted group-focus-within:text-primary transition-colors">search</span>
                    </div>
                    <input className="block w-full pl-10 pr-3 py-2 border border-[#cfe7d1] rounded-lg leading-5 bg-[#f6f8f6] text-forest-green placeholder-text-muted focus:outline-none focus:bg-white focus:ring-1 focus:ring-primary focus:border-primary text-xs font-body transition-all" placeholder="Buscar por nome, telefone, email ou cidade..." type="text" data-people-customers-search />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="relative">
                        <select className="appearance-none w-full bg-[#f6f8f6] border border-[#cfe7d1] text-forest-green py-2 pl-3 pr-11 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body text-xs cursor-pointer hover:bg-white transition-colors" data-people-customers-state-filter>
                            <option value="ALL">Todos os estados</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-muted">
                            <span className="material-symbols-outlined text-base">expand_more</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:col-span-2">
                        <button className="flex items-center gap-2 bg-white border border-[#cfe7d1] text-forest-green py-2 px-3 rounded-lg hover:bg-[#f6f8f6] focus:outline-none focus:ring-1 focus:ring-primary font-body text-xs transition-colors" type="button" data-people-customers-refresh>
                            <span className="material-symbols-outlined text-base text-text-muted">refresh</span>
                            Atualizar
                        </button>
                        <button className="flex items-center gap-2 bg-white border border-[#cfe7d1] text-forest-green py-2 px-3 rounded-lg hover:bg-[#f6f8f6] focus:outline-none focus:ring-1 focus:ring-primary font-body text-xs transition-colors" type="button" data-open-modal="customer-create" data-people-customers-create>
                            <span className="material-symbols-outlined text-base text-text-muted">person_add</span>
                            Incluir cliente
                        </button>
                        <span className="text-[11px] text-text-muted" data-people-customers-status></span>
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto overflow-y-auto min-h-[320px] max-h-[68vh] rounded-2xl border border-[#cfe7d1]" data-people-customers-grid-scroll>
                <div className="admin-grid-toolbar flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4 border-b border-[#cfe7d1] bg-primary">
                    <div className="text-xs text-white font-medium uppercase tracking-wider" data-people-customers-range>
                        Mostrando 0-0 de 0 clientes.
                    </div>
                    <div className="admin-grid-toolbar-controls flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] uppercase tracking-wider text-white font-semibold">Itens por pagina</span>
                            <div className="relative">
                                <select className="appearance-none bg-white border border-[#cfe7d1] text-forest-green py-1.5 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-xs cursor-pointer hover:bg-[#f6f8f6] transition-colors" data-people-customers-page-size>
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
                            <button className="px-3 py-1.5 rounded-lg border border-[#cfe7d1] bg-forest text-gold text-xs font-semibold hover:bg-primary transition-colors disabled:opacity-40" type="button" data-people-customers-page-first>
                                <span className="material-symbols-outlined text-sm align-middle">first_page</span>
                                Primeira
                            </button>
                            <button className="px-3 py-1.5 rounded-lg border border-[#cfe7d1] bg-forest text-gold text-xs font-semibold hover:bg-primary transition-colors disabled:opacity-40" type="button" data-people-customers-page-prev>
                                <span className="material-symbols-outlined text-sm align-middle">chevron_left</span>
                                Anterior
                            </button>
                            <div className="px-3 py-1.5 rounded-lg border border-[#cfe7d1] bg-forest text-xs font-semibold text-gold" data-people-customers-pagination-page>
                                Pagina 1 de 1
                            </div>
                            <button className="px-3 py-1.5 rounded-lg border border-[#cfe7d1] bg-forest text-gold text-xs font-semibold hover:bg-primary transition-colors disabled:opacity-40" type="button" data-people-customers-page-next>
                                Proxima
                                <span className="material-symbols-outlined text-sm align-middle">chevron_right</span>
                            </button>
                            <button className="px-3 py-1.5 rounded-lg border border-[#cfe7d1] bg-forest text-gold text-xs font-semibold hover:bg-primary transition-colors disabled:opacity-40" type="button" data-people-customers-page-last>
                                Ultima
                                <span className="material-symbols-outlined text-sm align-middle">last_page</span>
                            </button>
                        </div>
                    </div>
                </div>
                <table className="min-w-[1250px] divide-y divide-[#cfe7d1]">
                    <thead className="bg-[#f6f8f6]">
                        <tr>
                            <th className="table-head-cell text-left text-[11px] text-text-muted">ID</th>
                            <th className="table-head-cell text-left text-[11px] text-text-muted">Nome</th>
                            <th className="table-head-cell text-left text-[11px] text-text-muted">Telefone</th>
                            <th className="table-head-cell text-left text-[11px] text-text-muted">Telefone 2</th>
                            <th className="table-head-cell text-left text-[11px] text-text-muted">Email</th>
                            <th className="table-head-cell text-left text-[11px] text-text-muted">Cidade</th>
                            <th className="table-head-cell text-left text-[11px] text-text-muted">Estado</th>
                            <th className="table-head-cell text-left text-[11px] text-text-muted">Bairro</th>
                            <th className="table-head-cell text-left text-[11px] text-text-muted">Observacao</th>
                            <th className="table-head-cell text-left text-[11px] text-text-muted">Usuario vinculado</th>
                            <th className="table-head-cell text-left text-[11px] text-text-muted">Criado</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-[#f4f0e7]" data-people-customers-table-body>
                        <tr>
                            <td className="table-cell" colSpan={11}>Carregando clientes...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

        <section className="bg-white rounded-2xl border border-[#cfe7d1] shadow-sm p-5 flex flex-col gap-4 hidden" data-people-tab-panel="profissionais">
            <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-3">
                <div className="relative w-full group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-text-muted group-focus-within:text-primary transition-colors">search</span>
                    </div>
                    <input className="block w-full pl-10 pr-3 py-2 border border-[#cfe7d1] rounded-lg leading-5 bg-[#f6f8f6] text-forest-green placeholder-text-muted focus:outline-none focus:bg-white focus:ring-1 focus:ring-primary focus:border-primary text-xs font-body transition-all" placeholder="Buscar por profissional, usuario ou unidade..." type="text" data-people-professionals-search />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="relative">
                        <select className="appearance-none w-full bg-[#f6f8f6] border border-[#cfe7d1] text-forest-green py-2 pl-3 pr-11 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body text-xs cursor-pointer hover:bg-white transition-colors" data-people-professionals-unit-filter>
                            <option value="ALL">Todas as unidades</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-muted">
                            <span className="material-symbols-outlined text-base">expand_more</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:col-span-2">
                        <button className="flex items-center gap-2 bg-white border border-[#cfe7d1] text-forest-green py-2 px-3 rounded-lg hover:bg-[#f6f8f6] focus:outline-none focus:ring-1 focus:ring-primary font-body text-xs transition-colors" type="button" data-people-professionals-refresh>
                            <span className="material-symbols-outlined text-base text-text-muted">refresh</span>
                            Atualizar
                        </button>
                        <button className="flex items-center gap-2 bg-white border border-[#cfe7d1] text-forest-green py-2 px-3 rounded-lg hover:bg-[#f6f8f6] focus:outline-none focus:ring-1 focus:ring-primary font-body text-xs transition-colors" type="button" data-open-modal="professional-commission-profiles">
                            <span className="material-symbols-outlined text-base text-text-muted">percent</span>
                            Perfis de comissao
                        </button>
                        <span className="text-[11px] text-text-muted" data-people-professionals-status></span>
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto overflow-y-auto min-h-[320px] max-h-[68vh] rounded-2xl border border-[#cfe7d1]" data-people-professionals-grid-scroll>
                <div className="admin-grid-toolbar flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4 border-b border-[#cfe7d1] bg-primary">
                    <div className="text-xs text-white font-medium uppercase tracking-wider" data-people-professionals-range>
                        Mostrando 0-0 de 0 profissionais.
                    </div>
                    <div className="admin-grid-toolbar-controls flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] uppercase tracking-wider text-white font-semibold">Itens por pagina</span>
                            <div className="relative">
                                <select className="appearance-none bg-white border border-[#cfe7d1] text-forest-green py-1.5 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-xs cursor-pointer hover:bg-[#f6f8f6] transition-colors" data-people-professionals-page-size>
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
                            <button className="px-3 py-1.5 rounded-lg border border-[#cfe7d1] bg-forest text-gold text-xs font-semibold hover:bg-primary transition-colors disabled:opacity-40" type="button" data-people-professionals-page-first>
                                <span className="material-symbols-outlined text-sm align-middle">first_page</span>
                                Primeira
                            </button>
                            <button className="px-3 py-1.5 rounded-lg border border-[#cfe7d1] bg-forest text-gold text-xs font-semibold hover:bg-primary transition-colors disabled:opacity-40" type="button" data-people-professionals-page-prev>
                                <span className="material-symbols-outlined text-sm align-middle">chevron_left</span>
                                Anterior
                            </button>
                            <div className="px-3 py-1.5 rounded-lg border border-[#cfe7d1] bg-forest text-xs font-semibold text-gold" data-people-professionals-pagination-page>
                                Pagina 1 de 1
                            </div>
                            <button className="px-3 py-1.5 rounded-lg border border-[#cfe7d1] bg-forest text-gold text-xs font-semibold hover:bg-primary transition-colors disabled:opacity-40" type="button" data-people-professionals-page-next>
                                Proxima
                                <span className="material-symbols-outlined text-sm align-middle">chevron_right</span>
                            </button>
                            <button className="px-3 py-1.5 rounded-lg border border-[#cfe7d1] bg-forest text-gold text-xs font-semibold hover:bg-primary transition-colors disabled:opacity-40" type="button" data-people-professionals-page-last>
                                Ultima
                                <span className="material-symbols-outlined text-sm align-middle">last_page</span>
                            </button>
                        </div>
                    </div>
                </div>
                <table className="min-w-[1600px] divide-y divide-[#cfe7d1]">
                    <thead className="bg-[#f6f8f6]">
                        <tr>
                            <th className="table-head-cell text-left text-[11px] text-text-muted">ID</th>
                            <th className="table-head-cell text-left text-[11px] text-text-muted">Nome</th>
                            <th className="table-head-cell text-left text-[11px] text-text-muted">Email</th>
                            <th className="table-head-cell text-left text-[11px] text-text-muted">Status</th>
                            <th className="table-head-cell text-left text-[11px] text-text-muted">Inicio</th>
                            <th className="table-head-cell text-left text-[11px] text-text-muted">Saida</th>
                            <th className="table-head-cell text-left text-[11px] text-text-muted">Unidade</th>
                            <th className="table-head-cell text-left text-[11px] text-text-muted">Comissao (%)</th>
                            <th className="table-head-cell text-left text-[11px] text-text-muted">Escalas</th>
                            <th className="table-head-cell text-left text-[11px] text-text-muted">Servicos</th>
                            <th className="table-head-cell text-left text-[11px] text-text-muted">Agenda</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-[#f4f0e7]" data-people-professionals-table-body>
                        <tr>
                            <td className="table-cell" colSpan={11}>Carregando profissionais...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div className="mt-4" data-react-admin-dashboard-commissions />
        </section>

        <section className="bg-white rounded-2xl border border-[#cfe7d1] shadow-sm p-5 flex flex-col gap-4 hidden" data-people-tab-panel="usuarios">
            <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-3">
                <div className="relative w-full group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-text-muted group-focus-within:text-primary transition-colors">search</span>
                    </div>
                    <input className="block w-full pl-10 pr-3 py-2 border border-[#cfe7d1] rounded-lg leading-5 bg-[#f6f8f6] text-forest-green placeholder-text-muted focus:outline-none focus:bg-white focus:ring-1 focus:ring-primary focus:border-primary text-xs font-body transition-all" placeholder="Buscar por nome, email ou celular..." type="text" data-users-search />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="relative">
                        <select className="appearance-none w-full bg-[#f6f8f6] border border-[#cfe7d1] text-forest-green py-2 pl-3 pr-11 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body text-xs cursor-pointer hover:bg-white transition-colors" data-users-role-filter>
                            <option value="ALL">Todos os tipos</option>
                            <option value="MASTER">Master</option>
                            <option value="ADMIN">Administrador</option>
                            <option value="MANAGER">Gerente</option>
                            <option value="PROFESSIONAL">Profissional</option>
                            <option value="CLIENT">Cliente</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-muted">
                            <span className="material-symbols-outlined text-base">expand_more</span>
                        </div>
                    </div>
                    <div className="relative">
                        <select className="appearance-none w-full bg-[#f6f8f6] border border-[#cfe7d1] text-forest-green py-2 pl-3 pr-11 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body text-xs cursor-pointer hover:bg-white transition-colors" data-users-status-filter>
                            <option value="ALL">Todos os status</option>
                            <option value="ATIVO">Ativo</option>
                            <option value="INATIVO">Inativo</option>
                            <option value="SUSPENSO">Suspenso</option>
                            <option value="CANCELADO">Cancelado</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-muted">
                            <span className="material-symbols-outlined text-base">expand_more</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:col-span-2">
                        <button className="flex items-center gap-2 bg-white border border-[#cfe7d1] text-forest-green py-2 px-3 rounded-lg hover:bg-[#f6f8f6] focus:outline-none focus:ring-1 focus:ring-primary font-body text-xs transition-colors" type="button" data-users-refresh>
                            <span className="material-symbols-outlined text-base text-text-muted">refresh</span>
                            Atualizar
                        </button>
                        <span className="text-[11px] text-text-muted" data-users-status></span>
                    </div>
                </div>
            </div>
            <p className="hidden text-[11px] text-red-600" data-users-error></p>
            <div className="overflow-x-auto overflow-y-auto min-h-[320px] max-h-[68vh] rounded-2xl border border-[#cfe7d1]" data-users-grid-scroll>
                <div className="admin-grid-toolbar flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4 border-b border-[#cfe7d1] bg-primary">
                    <div className="text-xs text-white font-medium uppercase tracking-wider" data-users-range>
                        Mostrando 0-0 de 0 usuarios
                    </div>
                    <div className="admin-grid-toolbar-controls flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] uppercase tracking-wider text-white font-semibold">Itens por pagina</span>
                            <div className="relative">
                                <select className="appearance-none bg-white border border-[#cfe7d1] text-forest-green py-1.5 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-xs cursor-pointer hover:bg-[#f6f8f6] transition-colors" data-users-page-size>
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
                            <button className="px-3 py-1.5 rounded-lg border border-[#cfe7d1] bg-forest text-gold text-xs font-semibold hover:bg-primary transition-colors disabled:opacity-40" type="button" data-users-page-first>
                                <span className="material-symbols-outlined text-sm align-middle">first_page</span>
                                Primeira
                            </button>
                            <button className="px-3 py-1.5 rounded-lg border border-[#cfe7d1] bg-forest text-gold text-xs font-semibold hover:bg-primary transition-colors disabled:opacity-40" type="button" data-users-page-prev>
                                <span className="material-symbols-outlined text-sm align-middle">chevron_left</span>
                                Anterior
                            </button>
                            <div className="px-3 py-1.5 rounded-lg border border-[#cfe7d1] bg-forest text-xs font-semibold text-gold" data-users-pagination-page>
                                Pagina 1 de 1
                            </div>
                            <button className="px-3 py-1.5 rounded-lg border border-[#cfe7d1] bg-forest text-gold text-xs font-semibold hover:bg-primary transition-colors disabled:opacity-40" type="button" data-users-page-next>
                                Proxima
                                <span className="material-symbols-outlined text-sm align-middle">chevron_right</span>
                            </button>
                            <button className="px-3 py-1.5 rounded-lg border border-[#cfe7d1] bg-forest text-gold text-xs font-semibold hover:bg-primary transition-colors disabled:opacity-40" type="button" data-users-page-last>
                                Ultima
                                <span className="material-symbols-outlined text-sm align-middle">last_page</span>
                            </button>
                        </div>
                    </div>
                </div>
                <table className="min-w-[1700px] divide-y divide-[#cfe7d1]">
                    <thead className="bg-[#f6f8f6]">
                        <tr>
                            <th className="table-head-cell text-left text-[11px] text-text-muted">ID</th>
                            <th className="table-head-cell text-left text-[11px] text-text-muted">Usuario</th>
                            <th className="table-head-cell text-left text-[11px] text-text-muted">Email</th>
                            <th className="table-head-cell text-left text-[11px] text-text-muted">Avatar URL</th>
                            <th className="table-head-cell text-left text-[11px] text-text-muted">Celular</th>
                            <th className="table-head-cell text-left text-[11px] text-text-muted">Celular 2</th>
                            <th className="table-head-cell text-left text-[11px] text-text-muted">Cidade</th>
                            <th className="table-head-cell text-left text-[11px] text-text-muted">Bairro</th>
                            <th className="table-head-cell text-left text-[11px] text-text-muted">Tipo</th>
                            <th className="table-head-cell text-left text-[11px] text-text-muted">Status</th>
                            <th className="table-head-cell text-left text-[11px] text-text-muted">Email verificado</th>
                            <th className="table-head-cell text-left text-[11px] text-text-muted">Rating</th>
                            <th className="table-head-cell text-left text-[11px] text-text-muted">Ultimo acesso</th>
                            <th className="table-head-cell text-left text-[11px] text-text-muted">Criado</th>
                            <th className="table-head-cell text-left text-[11px] text-text-muted">Atualizado</th>
                            <th className="table-head-cell text-right text-[11px] text-text-muted">Acoes</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-[#f4f0e7]" data-users-table-body>
                        <tr>
                            <td className="table-cell" colSpan={16}>Carregando usuarios...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>
    </div>

    <div className="fixed inset-0 z-50 hidden items-center justify-center bg-black/40 backdrop-blur-sm" data-modal="user-preview" aria-hidden="true">
        <div className="bg-white w-[92vw] max-w-2xl rounded-2xl shadow-2xl border border-[#cfe7d1] p-6 relative">
            <button className="absolute top-4 right-4 text-forest/60 hover:text-forest transition" type="button" data-close-modal="user-preview" aria-label="Fechar preview">
                <span className="material-symbols-outlined">close</span>
            </button>
            <div className="flex items-start gap-4">
                <div className="relative h-16 w-16 rounded-full bg-[#eef4f0] border border-[#cfe7d1] flex items-center justify-center overflow-hidden">
                    <img className="h-full w-full object-cover hidden" alt="Avatar" data-user-preview-avatar-img />
                    <span className="text-forest-green font-semibold text-lg" data-user-preview-avatar-initials>JD</span>
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-forest" data-user-preview-name>Usuario</h3>
                    <p className="text-sm text-stone-500" data-user-preview-role>Cliente</p>
                </div>
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                <div>
                    <p className="text-[11px] uppercase tracking-widest text-text-muted font-semibold">Email</p>
                    <p className="mt-1 text-forest" data-user-preview-email>email@dominio.com</p>
                </div>
                <div>
                    <p className="text-[11px] uppercase tracking-widest text-text-muted font-semibold">Celular</p>
                    <p className="mt-1 text-forest" data-user-preview-phone>-</p>
                </div>
                <div>
                    <p className="text-[11px] uppercase tracking-widest text-text-muted font-semibold">Celular 2</p>
                    <p className="mt-1 text-forest" data-user-preview-phone2>-</p>
                </div>
                <div>
                    <p className="text-[11px] uppercase tracking-widest text-text-muted font-semibold">Cidade / Bairro</p>
                    <p className="mt-1 text-forest" data-user-preview-location>-</p>
                </div>
                <div>
                    <p className="text-[11px] uppercase tracking-widest text-text-muted font-semibold">Status</p>
                    <p className="mt-1 text-forest" data-user-preview-status>-</p>
                </div>
                <div>
                    <p className="text-[11px] uppercase tracking-widest text-text-muted font-semibold">Email verificado</p>
                    <p className="mt-1 text-forest" data-user-preview-email-verified>-</p>
                </div>
                <div>
                    <p className="text-[11px] uppercase tracking-widest text-text-muted font-semibold">Rating</p>
                    <p className="mt-1 text-forest" data-user-preview-rating>-</p>
                </div>
                <div>
                    <p className="text-[11px] uppercase tracking-widest text-text-muted font-semibold">Data cadastro</p>
                    <p className="mt-1 text-forest" data-user-preview-created>-</p>
                </div>
                <div>
                    <p className="text-[11px] uppercase tracking-widest text-text-muted font-semibold">Ultimo acesso</p>
                    <p className="mt-1 text-forest" data-user-preview-last-access>-</p>
                </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
                <button className="px-4 py-2 rounded-lg border border-[#cfe7d1] text-forest-green hover:bg-[#f6f8f6] transition-colors text-xs" type="button" data-close-modal="user-preview">Fechar</button>
                <button className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition-colors text-xs" type="button" data-user-preview-edit>Editar</button>
            </div>
        </div>
    </div>

    <div className="fixed inset-0 z-50 hidden items-center justify-center bg-black/40 backdrop-blur-sm" data-modal="user-create" aria-hidden="true">
        <div className="bg-white w-[92vw] max-w-2xl rounded-2xl shadow-2xl border border-[#cfe7d1] p-6 relative">
            <button className="absolute top-4 right-4 text-forest/60 hover:text-forest transition" type="button" data-close-modal="user-create" aria-label="Fechar cadastro">
                <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="text-2xl font-bold text-forest mb-4">Novo usuario</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="flex flex-col gap-3 md:col-span-2">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Avatar</label>
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="h-16 w-16 rounded-full border border-[#cfe7d1] bg-[#eef4f0] flex items-center justify-center overflow-hidden">
                            <img className="h-full w-full object-cover hidden" alt="Avatar" data-user-create-avatar-preview-img />
                            <span className="text-forest-green text-[10px] font-semibold" data-user-create-avatar-preview-placeholder>Sem foto</span>
                        </div>
                        <div className="flex-1 flex flex-col gap-2">
                            <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" type="url" placeholder="https://..." data-user-create-avatar />
                            <div className="flex flex-wrap items-center gap-2">
                                <button className="h-9 px-4 rounded-lg border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-semibold" type="button" data-open-modal="usuarios-imagem" data-avatar-picker data-avatar-input="[data-user-create-avatar]" data-avatar-preview-img="[data-user-create-avatar-preview-img]" data-avatar-preview-placeholder="[data-user-create-avatar-preview-placeholder]">Escolher arquivo</button>
                                <button className="h-9 px-4 rounded-lg border border-[#cfe7d1] bg-white text-forest-green hover:bg-[#f6f8f6] transition-colors text-xs font-semibold" type="button" data-avatar-clear data-avatar-input="[data-user-create-avatar]" data-avatar-preview-img="[data-user-create-avatar-preview-img]" data-avatar-preview-placeholder="[data-user-create-avatar-preview-placeholder]">Limpar</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Nome completo</label>
                    <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" type="text" data-user-create-name />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Email</label>
                    <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" type="email" data-user-create-email />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Senha</label>
                    <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" type="password" data-user-create-password />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Tipo de usuario</label>
                    <div className="relative">
                        <select className="appearance-none w-full bg-[#f6f8f6] border border-[#cfe7d1] text-forest-green py-2 pl-3 pr-9 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body text-xs cursor-pointer hover:bg-white transition-colors" data-user-create-role>
                            <option value="CLIENT">Cliente</option>
                            <option value="PROFESSIONAL">Profissional</option>
                            <option value="MANAGER">Gerente</option>
                            <option value="ADMIN">Administrador</option>
                            <option value="MASTER">Master</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-muted">
                            <span className="material-symbols-outlined text-base">expand_more</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Celular</label>
                    <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" type="text" data-user-create-phone />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Celular 2</label>
                    <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" type="text" data-user-create-phone2 />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Cidade</label>
                    <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" type="text" data-user-create-city />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Bairro</label>
                    <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" type="text" data-user-create-neighborhood />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Status</label>
                    <div className="relative">
                        <select className="appearance-none w-full bg-[#f6f8f6] border border-[#cfe7d1] text-forest-green py-2 pl-3 pr-9 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body text-xs cursor-pointer hover:bg-white transition-colors" data-user-create-status>
                            <option value="ATIVO">Ativo</option>
                            <option value="INATIVO">Inativo</option>
                            <option value="SUSPENSO">Suspenso</option>
                            <option value="CANCELADO">Cancelado</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-muted">
                            <span className="material-symbols-outlined text-base">expand_more</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Email verificado</label>
                    <div className="relative">
                        <select className="appearance-none w-full bg-[#f6f8f6] border border-[#cfe7d1] text-forest-green py-2 pl-3 pr-9 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body text-xs cursor-pointer hover:bg-white transition-colors" data-user-create-email-verified>
                            <option value="false">Nao</option>
                            <option value="true">Sim</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-muted">
                            <span className="material-symbols-outlined text-base">expand_more</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Rating (1-5)</label>
                    <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" type="number" min="1" max="5" step="1" data-user-create-rating />
                </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
                <button className="px-4 py-2 rounded-lg border border-[#cfe7d1] text-forest-green hover:bg-[#f6f8f6] transition-colors text-xs" type="button" data-close-modal="user-create">Cancelar</button>
                <button className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition-colors text-xs" type="button" data-user-create-save>Salvar</button>
            </div>
        </div>
    </div>

    <div className="fixed inset-0 z-50 hidden items-center justify-center bg-black/40 backdrop-blur-sm" data-modal="user-edit" aria-hidden="true">
        <div className="bg-white w-[92vw] max-w-2xl rounded-2xl shadow-2xl border border-[#cfe7d1] p-6 relative">
            <button className="absolute top-4 right-4 text-forest/60 hover:text-forest transition" type="button" data-close-modal="user-edit" aria-label="Fechar edicao">
                <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="text-2xl font-bold text-forest mb-4">Editar usuario</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="flex flex-col gap-3 md:col-span-2">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Avatar</label>
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="h-16 w-16 rounded-full border border-[#cfe7d1] bg-[#eef4f0] flex items-center justify-center overflow-hidden">
                            <img className="h-full w-full object-cover hidden" alt="Avatar" data-user-edit-avatar-preview-img />
                            <span className="text-forest-green text-[10px] font-semibold" data-user-edit-avatar-preview-placeholder>Sem foto</span>
                        </div>
                        <div className="flex-1 flex flex-col gap-2">
                            <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" type="url" placeholder="https://..." data-user-edit-avatar />
                            <div className="flex flex-wrap items-center gap-2">
                                <button className="h-9 px-4 rounded-lg border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-semibold" type="button" data-open-modal="usuarios-imagem" data-avatar-picker data-avatar-input="[data-user-edit-avatar]" data-avatar-preview-img="[data-user-edit-avatar-preview-img]" data-avatar-preview-placeholder="[data-user-edit-avatar-preview-placeholder]">Escolher arquivo</button>
                                <button className="h-9 px-4 rounded-lg border border-[#cfe7d1] bg-white text-forest-green hover:bg-[#f6f8f6] transition-colors text-xs font-semibold" type="button" data-avatar-clear data-avatar-input="[data-user-edit-avatar]" data-avatar-preview-img="[data-user-edit-avatar-preview-img]" data-avatar-preview-placeholder="[data-user-edit-avatar-preview-placeholder]">Limpar</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Nome completo</label>
                    <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" type="text" data-user-edit-name />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Email</label>
                    <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" type="email" data-user-edit-email />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Nova senha (opcional)</label>
                    <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" type="password" data-user-edit-password />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Tipo de usuario</label>
                    <div className="relative">
                        <select className="appearance-none w-full bg-[#f6f8f6] border border-[#cfe7d1] text-forest-green py-2 pl-3 pr-9 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body text-xs cursor-pointer hover:bg-white transition-colors" data-user-edit-role>
                            <option value="CLIENT">Cliente</option>
                            <option value="PROFESSIONAL">Profissional</option>
                            <option value="MANAGER">Gerente</option>
                            <option value="ADMIN">Administrador</option>
                            <option value="MASTER">Master</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-muted">
                            <span className="material-symbols-outlined text-base">expand_more</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Celular</label>
                    <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" type="text" data-user-edit-phone />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Celular 2</label>
                    <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" type="text" data-user-edit-phone2 />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Cidade</label>
                    <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" type="text" data-user-edit-city />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Bairro</label>
                    <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" type="text" data-user-edit-neighborhood />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Status</label>
                    <div className="relative">
                        <select className="appearance-none w-full bg-[#f6f8f6] border border-[#cfe7d1] text-forest-green py-2 pl-3 pr-9 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body text-xs cursor-pointer hover:bg-white transition-colors" data-user-edit-status>
                            <option value="ATIVO">Ativo</option>
                            <option value="INATIVO">Inativo</option>
                            <option value="SUSPENSO">Suspenso</option>
                            <option value="CANCELADO">Cancelado</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-muted">
                            <span className="material-symbols-outlined text-base">expand_more</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Email verificado</label>
                    <div className="relative">
                        <select className="appearance-none w-full bg-[#f6f8f6] border border-[#cfe7d1] text-forest-green py-2 pl-3 pr-9 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body text-xs cursor-pointer hover:bg-white transition-colors" data-user-edit-email-verified>
                            <option value="false">Nao</option>
                            <option value="true">Sim</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-muted">
                            <span className="material-symbols-outlined text-base">expand_more</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Rating (1-5)</label>
                    <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" type="number" min="1" max="5" step="1" data-user-edit-rating />
                </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
                <button className="px-4 py-2 rounded-lg border border-[#cfe7d1] text-forest-green hover:bg-[#f6f8f6] transition-colors text-xs" type="button" data-close-modal="user-edit">Cancelar</button>
                <button className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition-colors text-xs" type="button" data-user-edit-save>Salvar</button>
            </div>
        </div>
    </div>

    <div className="fixed inset-0 z-50 hidden items-center justify-center bg-black/40 backdrop-blur-sm" data-modal="user-delete" aria-hidden="true">
        <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-[#f1b8b8] p-6 relative">
            <button className="absolute top-4 right-4 text-forest/60 hover:text-forest transition" type="button" data-close-modal="user-delete" aria-label="Fechar exclusao">
                <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="text-xl font-bold text-forest mb-2">Excluir usuario</h3>
            <p className="text-sm text-stone-500">Tem certeza que deseja excluir <strong data-user-delete-name>este usuario</strong>? Esta acao nao pode ser desfeita.</p>
            <div className="mt-6 flex items-center justify-end gap-3">
                <button className="px-4 py-2 rounded-lg border border-[#cfe7d1] text-forest-green hover:bg-[#f6f8f6] transition-colors text-xs" type="button" data-close-modal="user-delete">Cancelar</button>
                <button className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors text-xs" type="button" data-user-delete-confirm>Delete</button>
            </div>
        </div>
    </div>

    <div className="fixed inset-0 z-50 hidden items-center justify-center bg-black/40 backdrop-blur-sm" data-modal="customer-create" aria-hidden="true">
        <div className="bg-white w-[92vw] max-w-2xl rounded-2xl shadow-2xl border border-[#cfe7d1] p-6 relative">
            <button className="absolute top-4 right-4 text-forest/60 hover:text-forest transition" type="button" data-close-modal="customer-create" aria-label="Fechar cadastro de cliente">
                <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="text-2xl font-bold text-forest mb-4">Novo cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Nome</label>
                    <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" type="text" data-customer-create-name />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Telefone</label>
                    <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" type="text" data-customer-create-phone />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Telefone 2</label>
                    <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" type="text" data-customer-create-phone2 />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Email</label>
                    <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" type="email" data-customer-create-email />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Cidade</label>
                    <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" type="text" data-customer-create-city />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Estado</label>
                    <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" type="text" maxLength={2} data-customer-create-state />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Bairro</label>
                    <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" type="text" data-customer-create-neighborhood />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Usuario vinculado (ID)</label>
                    <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" type="number" min="1" step="1" data-customer-create-user-id />
                </div>
                <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Observacao</label>
                    <textarea className="w-full min-h-[96px] border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" data-customer-create-notes></textarea>
                </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
                <button className="px-4 py-2 rounded-lg border border-[#cfe7d1] text-forest-green hover:bg-[#f6f8f6] transition-colors text-xs" type="button" data-close-modal="customer-create">Cancelar</button>
                <button className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition-colors text-xs" type="button" data-customer-create-save>Salvar</button>
            </div>
        </div>
    </div>

    <div className="fixed inset-0 z-50 hidden items-center justify-center bg-black/40 backdrop-blur-sm" data-modal="customer-edit" aria-hidden="true">
        <div className="bg-white w-[92vw] max-w-2xl rounded-2xl shadow-2xl border border-[#cfe7d1] p-6 relative">
            <button className="absolute top-4 right-4 text-forest/60 hover:text-forest transition" type="button" data-close-modal="customer-edit" aria-label="Fechar edicao de cliente">
                <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="text-2xl font-bold text-forest mb-4">Editar cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Nome</label>
                    <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" type="text" data-customer-edit-name />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Telefone</label>
                    <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" type="text" data-customer-edit-phone />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Telefone 2</label>
                    <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" type="text" data-customer-edit-phone2 />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Email</label>
                    <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" type="email" data-customer-edit-email />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Cidade</label>
                    <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" type="text" data-customer-edit-city />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Estado</label>
                    <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" type="text" maxLength={2} data-customer-edit-state />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Bairro</label>
                    <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" type="text" data-customer-edit-neighborhood />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Usuario vinculado (ID)</label>
                    <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" type="number" min="1" step="1" data-customer-edit-user-id />
                </div>
                <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Observacao</label>
                    <textarea className="w-full min-h-[96px] border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" data-customer-edit-notes></textarea>
                </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
                <button className="px-4 py-2 rounded-lg border border-[#cfe7d1] text-forest-green hover:bg-[#f6f8f6] transition-colors text-xs" type="button" data-close-modal="customer-edit">Cancelar</button>
                <button className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition-colors text-xs" type="button" data-customer-edit-save>Salvar</button>
            </div>
        </div>
    </div>

    <div className="fixed inset-0 z-50 hidden items-center justify-center bg-black/40 backdrop-blur-sm" data-modal="professional-edit" aria-hidden="true">
        <div className="bg-white w-[92vw] max-w-2xl rounded-2xl shadow-2xl border border-[#cfe7d1] p-6 relative">
            <button className="absolute top-4 right-4 text-forest/60 hover:text-forest transition" type="button" data-close-modal="professional-edit" aria-label="Fechar edicao de profissional">
                <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="text-2xl font-bold text-forest mb-4">Editar profissional</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Nome</label>
                    <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" type="text" data-professional-edit-name />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Unidade (ID)</label>
                    <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" type="number" min="1" step="1" data-professional-edit-unit-id />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Usuario vinculado (ID)</label>
                    <div className="flex items-center gap-2">
                        <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" type="number" min="1" step="1" data-professional-edit-user-id />
                        <button className="shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-[#cfe7d1] bg-white text-forest-green hover:bg-[#f6f8f6] transition-colors text-[11px] font-semibold" type="button" data-professional-edit-open-user>
                            <span className="material-symbols-outlined text-sm">open_in_new</span>
                            Usuario
                        </button>
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Status</label>
                    <div className="relative">
                        <select className="appearance-none w-full bg-[#f6f8f6] border border-[#cfe7d1] text-forest-green py-2 pl-3 pr-9 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body text-xs cursor-pointer hover:bg-white transition-colors" data-professional-edit-employment-status>
                            <option value="ACTIVE">Ativo</option>
                            <option value="INACTIVE">Inativo</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-muted">
                            <span className="material-symbols-outlined text-base">expand_more</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Data de inicio</label>
                    <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" type="date" data-professional-edit-started-at />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Data de saida</label>
                    <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" type="date" data-professional-edit-ended-at />
                </div>
                <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Perfil de trabalho</label>
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <select className="appearance-none w-full bg-[#f6f8f6] border border-[#cfe7d1] text-forest-green py-2 pl-3 pr-9 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body text-xs cursor-pointer hover:bg-white transition-colors" data-professional-edit-work-profile-id>
                                <option value="">Sem perfil</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-muted">
                                <span className="material-symbols-outlined text-base">expand_more</span>
                            </div>
                        </div>
                        <button className="shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-[#cfe7d1] bg-white text-forest-green hover:bg-[#f6f8f6] transition-colors text-[11px] font-semibold" type="button" data-open-modal="professional-work-profiles" data-prof-work-profile-from-professional="true">
                            <span className="material-symbols-outlined text-sm">manage_accounts</span>
                            Perfis
                        </button>
                    </div>
                </div>
                <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Comissao (%)</label>
                    <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" type="number" min="0" max="100" step="0.01" placeholder="Ex.: 10, 20, 50" data-professional-edit-commission-percent />
                </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
                <button className="px-4 py-2 rounded-lg border border-[#cfe7d1] text-forest-green hover:bg-[#f6f8f6] transition-colors text-xs" type="button" data-close-modal="professional-edit">Cancelar</button>
                <button className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition-colors text-xs" type="button" data-professional-edit-save>Salvar</button>
            </div>
        </div>
    </div>

    <div className="fixed inset-0 z-50 hidden items-center justify-center bg-black/40 backdrop-blur-sm" data-modal="professional-work-profiles" aria-hidden="true">
        <div className="bg-white w-[94vw] max-w-5xl rounded-2xl shadow-2xl border border-[#cfe7d1] p-6 relative max-h-[85vh] overflow-y-auto">
            <button className="absolute top-4 right-4 text-forest/60 hover:text-forest transition" type="button" data-close-modal="professional-work-profiles" aria-label="Fechar perfis de trabalho">
                <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="text-2xl font-bold text-forest mb-4">Perfis de trabalho</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Titulo</label>
                    <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" type="text" data-prof-work-profile-title />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Status</label>
                    <div className="relative">
                        <select className="appearance-none w-full bg-[#f6f8f6] border border-[#cfe7d1] text-forest-green py-2 pl-3 pr-9 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body text-xs cursor-pointer hover:bg-white transition-colors" data-prof-work-profile-status>
                            <option value="ACTIVE">Ativo</option>
                            <option value="INACTIVE">Inativo</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-muted">
                            <span className="material-symbols-outlined text-base">expand_more</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="mt-4 rounded-xl border border-[#cfe7d1] bg-[#f6f8f6] p-4 space-y-4 text-sm">
                <div className="space-y-2">
                    <h4 className="text-xs uppercase tracking-wider text-text-muted font-semibold">Ajustes finos</h4>
                    <label className="flex items-center justify-between gap-4 py-1">
                        <span className="text-forest-green">Pode realizar agendamentos</span>
                        <input className="h-4 w-4 accent-primary" type="checkbox" data-prof-work-profile-perm="canScheduleAppointments" />
                    </label>
                    <label className="flex items-center justify-between gap-4 py-1">
                        <span className="text-forest-green">Pode acessar a agenda de outros profissionais</span>
                        <input className="h-4 w-4 accent-primary" type="checkbox" data-prof-work-profile-perm="canAccessOtherProfessionalsAgenda" />
                    </label>
                    <label className="flex items-center justify-between gap-4 py-1">
                        <span className="text-forest-green">Pode visualizar valores de servicos</span>
                        <input className="h-4 w-4 accent-primary" type="checkbox" data-prof-work-profile-perm="canViewServiceValues" />
                    </label>
                    <label className="flex items-center justify-between gap-4 py-1">
                        <span className="text-forest-green">Pode visualizar contato do cliente</span>
                        <input className="h-4 w-4 accent-primary" type="checkbox" data-prof-work-profile-perm="canViewCustomerContact" />
                    </label>
                </div>
                <div className="space-y-2">
                    <h4 className="text-xs uppercase tracking-wider text-text-muted font-semibold">Acesso aos menus</h4>
                    <label className="flex items-center justify-between gap-4 py-1">
                        <span className="text-forest-green">Pode acessar menu clientes/anamnese</span>
                        <input className="h-4 w-4 accent-primary" type="checkbox" data-prof-work-profile-perm="canAccessMenuClientsAnamnese" />
                    </label>
                    <label className="flex items-center justify-between gap-4 py-1">
                        <span className="text-forest-green">Pode acessar menu servicos</span>
                        <input className="h-4 w-4 accent-primary" type="checkbox" data-prof-work-profile-perm="canAccessMenuServices" />
                    </label>
                    <label className="flex items-center justify-between gap-4 py-1">
                        <span className="text-forest-green">Pode acessar menu produtos</span>
                        <input className="h-4 w-4 accent-primary" type="checkbox" data-prof-work-profile-perm="canAccessMenuProducts" />
                    </label>
                    <label className="flex items-center justify-between gap-4 py-1">
                        <span className="text-forest-green">Pode acessar menu despesas</span>
                        <input className="h-4 w-4 accent-primary" type="checkbox" data-prof-work-profile-perm="canAccessMenuExpenses" />
                    </label>
                    <label className="flex items-center justify-between gap-4 py-1">
                        <span className="text-forest-green">Pode visualizar comissoes a receber</span>
                        <input className="h-4 w-4 accent-primary" type="checkbox" data-prof-work-profile-perm="canViewCommissionsToReceive" />
                    </label>
                    <label className="flex items-center justify-between gap-4 py-1">
                        <span className="text-forest-green">Pode visualizar pagamentos de comissao</span>
                        <input className="h-4 w-4 accent-primary" type="checkbox" data-prof-work-profile-perm="canViewCommissionPayments" />
                    </label>
                </div>
                <div className="space-y-2">
                    <h4 className="text-xs uppercase tracking-wider text-text-muted font-semibold">Opcoes avancadas</h4>
                    <label className="flex items-center justify-between gap-4 py-1">
                        <span className="text-forest-green">Pode editar agendamentos</span>
                        <input className="h-4 w-4 accent-primary" type="checkbox" data-prof-work-profile-perm="canEditAppointments" />
                    </label>
                    <label className="flex items-center justify-between gap-4 py-1">
                        <span className="text-forest-green">Pode deletar agendamentos</span>
                        <input className="h-4 w-4 accent-primary" type="checkbox" data-prof-work-profile-perm="canDeleteAppointments" />
                    </label>
                    <label className="flex items-center justify-between gap-4 py-1">
                        <span className="text-forest-green">Pode criar servico no agendamento</span>
                        <input className="h-4 w-4 accent-primary" type="checkbox" data-prof-work-profile-perm="canCreateServiceInAppointment" />
                    </label>
                    <label className="flex items-center justify-between gap-4 py-1">
                        <span className="text-forest-green">Ver total bruto em comissoes a pagar</span>
                        <input className="h-4 w-4 accent-primary" type="checkbox" data-prof-work-profile-perm="canViewGrossCommissionsToPay" />
                    </label>
                </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
                <button className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition-colors text-xs" type="button" data-prof-work-profile-save>Salvar</button>
                <button className="px-4 py-2 rounded-lg border border-[#cfe7d1] text-forest-green hover:bg-[#f6f8f6] transition-colors text-xs" type="button" data-prof-work-profile-cancel data-close-modal="professional-work-profiles">Cancelar</button>
                <span className="text-[11px] text-text-muted" data-prof-work-profile-feedback></span>
            </div>
            <div className="mt-4 overflow-x-auto rounded-xl border border-[#cfe7d1]">
                <table className="min-w-full divide-y divide-[#cfe7d1]">
                    <thead className="bg-[#f6f8f6]">
                        <tr>
                            <th className="table-head-cell text-left text-[11px] text-text-muted">ID</th>
                            <th className="table-head-cell text-left text-[11px] text-text-muted">Titulo</th>
                            <th className="table-head-cell text-left text-[11px] text-text-muted">Status</th>
                            <th className="table-head-cell text-left text-[11px] text-text-muted">Permissoes ativas</th>
                            <th className="table-head-cell text-right text-[11px] text-text-muted">Acoes</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-[#f4f0e7]" data-prof-work-profile-table-body>
                        <tr>
                            <td className="table-cell" colSpan={5}>Carregando perfis...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <div className="fixed inset-0 z-50 hidden items-center justify-center bg-black/40 backdrop-blur-sm" data-modal="professional-commission-profiles" aria-hidden="true">
        <div className="bg-white w-[94vw] max-w-4xl rounded-2xl shadow-2xl border border-[#cfe7d1] p-6 relative max-h-[85vh] overflow-y-auto">
            <button className="absolute top-4 right-4 text-forest/60 hover:text-forest transition" type="button" data-close-modal="professional-commission-profiles" aria-label="Fechar perfis de comissao">
                <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="text-2xl font-bold text-forest mb-4">Perfis de comissao</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Profissao/Perfil</label>
                    <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" type="text" data-prof-commission-profile-name />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Comissao (%)</label>
                    <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" type="number" min="0" max="100" step="0.01" data-prof-commission-profile-percent />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Status</label>
                    <div className="relative">
                        <select className="appearance-none w-full bg-[#f6f8f6] border border-[#cfe7d1] text-forest-green py-2 pl-3 pr-9 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body text-xs cursor-pointer hover:bg-white transition-colors" data-prof-commission-profile-status>
                            <option value="ACTIVE">Ativo</option>
                            <option value="INACTIVE">Inativo</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-muted">
                            <span className="material-symbols-outlined text-base">expand_more</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
                <button className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition-colors text-xs" type="button" data-prof-commission-profile-save>Salvar</button>
                <button className="px-4 py-2 rounded-lg border border-[#cfe7d1] text-forest-green hover:bg-[#f6f8f6] transition-colors text-xs" type="button" data-prof-commission-profile-clear>Limpar</button>
                <span className="text-[11px] text-text-muted" data-prof-commission-profile-feedback></span>
            </div>
            <div className="mt-4 overflow-x-auto rounded-xl border border-[#cfe7d1]">
                <table className="min-w-full divide-y divide-[#cfe7d1]">
                    <thead className="bg-[#f6f8f6]">
                        <tr>
                            <th className="table-head-cell text-left text-[11px] text-text-muted">ID</th>
                            <th className="table-head-cell text-left text-[11px] text-text-muted">Perfil</th>
                            <th className="table-head-cell text-left text-[11px] text-text-muted">Comissao</th>
                            <th className="table-head-cell text-left text-[11px] text-text-muted">Status</th>
                            <th className="table-head-cell text-right text-[11px] text-text-muted">Acoes</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-[#f4f0e7]" data-prof-commission-profile-table-body>
                        <tr>
                            <td className="table-cell" colSpan={5}>Carregando perfis...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    </>
  );
};
