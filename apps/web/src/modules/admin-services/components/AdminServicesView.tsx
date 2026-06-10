import type { ReactElement } from "react";

export const AdminServicesView = (): ReactElement => {
  return (
    <>
<div className="max-w-[1400px] mx-auto p-8 flex flex-col gap-8">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex flex-col gap-1">
                <h2 className="text-forest dark:text-white text-3xl display-hero text-shadow-strong italic">Cadastro e Consulta de Serviços</h2>
                <p className="text-stone-500 text-lg font-normal">Gerencie os serviços oferecidos no salão.</p>
            </div>
            <div className="flex items-center gap-3">
                <button className="px-4 py-2 text-sm font-semibold rounded-lg bg-[#e7f3eb] text-forest-green hover:bg-[#d5e9db] transition-colors">
                    Importar
                </button>
                <button className="px-5 py-2 text-sm font-semibold rounded-lg bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors flex items-center gap-2" type="button" data-service-new>
                    <span className="material-symbols-outlined text-base">add</span>
                    Novo Serviço
                </button>
            </div>
        </header>

        <section className="bg-white rounded-xl border border-[#cfe7d1] shadow-sm p-6 flex flex-col gap-4">
            <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-3">
                <div className="relative w-full group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-text-muted group-focus-within:text-primary transition-colors">search</span>
                    </div>
                    <input className="block w-full pl-10 pr-3 py-2.5 border border-[#cfe7d1] rounded-lg leading-5 bg-[#f6f8f6] text-forest-green placeholder-text-muted focus:outline-none focus:bg-white focus:ring-1 focus:ring-primary focus:border-primary text-xs font-body transition-all" placeholder="Buscar por nome do serviço..." type="text" data-services-search />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                        <div className="relative w-full">
                            <select className="appearance-none w-full bg-[#f6f8f6] border border-[#cfe7d1] text-forest-green py-2.5 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body text-xs cursor-pointer hover:bg-white transition-colors" data-select="servicos-categorias" data-placeholder="Categoria" data-services-category-filter>
                                <option>Categoria</option>
                                <option>Cabelos</option>
                                <option>Estetica</option>
                                <option>Sobrancelhas</option>
                                <option>Unhas</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-muted">
                                <span className="material-symbols-outlined text-lg">expand_more</span>
                            </div>
                        </div>
                        <button className="h-9 w-9 rounded-lg border border-[#cfe7d1] bg-white text-forest-green hover:bg-[#f6f8f6] transition-colors flex items-center justify-center" type="button" data-open-modal="categorias-servicos" title="Cadastrar categorias de serviços">
                            <span className="material-symbols-outlined text-[18px]">add</span>
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative w-full">
                            <select className="appearance-none w-full bg-[#f6f8f6] border border-[#cfe7d1] text-forest-green py-2.5 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body text-xs cursor-pointer hover:bg-white transition-colors" data-select="servicos-status" data-placeholder="Status" data-services-status-filter>
                                <option>Status</option>
                                <option>Ativo</option>
                                <option>Rascunho</option>
                                <option>Inativo</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-muted">
                                <span className="material-symbols-outlined text-lg">expand_more</span>
                            </div>
                        </div>
                        <button className="h-9 w-9 rounded-lg border border-[#cfe7d1] bg-white text-forest-green hover:bg-[#f6f8f6] transition-colors flex items-center justify-center" type="button" data-open-modal="status-servicos" title="Cadastrar status de serviços">
                            <span className="material-symbols-outlined text-[18px]">tune</span>
                        </button>
                    </div>
                    <button className="flex items-center gap-2 bg-white border border-[#cfe7d1] text-forest-green py-2.5 px-4 rounded-lg hover:bg-[#f6f8f6] focus:outline-none focus:ring-1 focus:ring-primary font-body text-xs transition-colors sm:col-span-2" type="button" data-services-clear-filters>
                        <span className="material-symbols-outlined text-lg text-text-muted">refresh</span>
                        Limpar filtros
                    </button>
                </div>
            </div>
        </section>

        <div className="bg-white rounded-xl border border-[#cfe7d1] shadow-sm overflow-hidden">
            <div className="admin-grid-toolbar flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4 border-b border-[#cfe7d1] bg-primary">
                <div className="text-xs text-white font-medium uppercase tracking-wider" data-services-pagination-range>
                    Mostrando 0-0 de 0 serviços
                </div>
                <div className="admin-grid-toolbar-controls flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] uppercase tracking-wider text-white font-semibold">Itens por página</span>
                        <div className="relative">
                            <select className="appearance-none bg-white border border-[#cfe7d1] text-forest-green py-1.5 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-xs cursor-pointer hover:bg-[#f6f8f6] transition-colors" data-services-page-size>
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
                        <button className="px-3 py-1.5 rounded-lg border border-[#cfe7d1] bg-forest text-gold text-xs font-semibold hover:bg-primary transition-colors disabled:opacity-40" type="button" data-services-page-first>
                            <span className="material-symbols-outlined text-sm align-middle">first_page</span>
                            Primeira
                        </button>
                        <button className="px-3 py-1.5 rounded-lg border border-[#cfe7d1] bg-forest text-gold text-xs font-semibold hover:bg-primary transition-colors disabled:opacity-40" type="button" data-services-page-prev>
                            <span className="material-symbols-outlined text-sm align-middle">chevron_left</span>
                            Anterior
                        </button>
                        <div className="px-3 py-1.5 rounded-lg border border-[#cfe7d1] bg-forest text-xs font-semibold text-gold" data-services-pagination-page>
                            Página 1 de 1
                        </div>
                        <button className="px-3 py-1.5 rounded-lg border border-[#cfe7d1] bg-forest text-gold text-xs font-semibold hover:bg-primary transition-colors disabled:opacity-40" type="button" data-services-page-next>
                            Próxima
                            <span className="material-symbols-outlined text-sm align-middle">chevron_right</span>
                        </button>
                        <button className="px-3 py-1.5 rounded-lg border border-[#cfe7d1] bg-forest text-gold text-xs font-semibold hover:bg-primary transition-colors disabled:opacity-40" type="button" data-services-page-last>
                            Última
                            <span className="material-symbols-outlined text-sm align-middle">last_page</span>
                        </button>
                    </div>
                </div>
            </div>
            <table className="min-w-full divide-y divide-[#cfe7d1]">
                <thead className="bg-forest">
                    <tr>
                        <th className="table-head-cell text-left text-white" scope="col">ID</th>
                        <th className="table-head-cell text-left text-white" scope="col">Serviço</th>
                        <th className="table-head-cell text-left text-white" scope="col">Descrição</th>
                        <th className="table-head-cell text-left text-white" scope="col">Categoria</th>
                        <th className="table-head-cell text-left text-white" scope="col">Status</th>
                        <th className="table-head-cell text-left text-white" scope="col">Duração</th>
                        <th className="table-head-cell text-left text-white" scope="col">Comissão</th>
                        <th className="table-head-cell text-left text-white" scope="col">Preço</th>
                        <th className="table-head-cell text-left text-white" scope="col">Custo</th>
                        <th className="table-head-cell text-left text-white" scope="col">Destaque</th>
                        <th className="table-head-cell text-left text-white" scope="col">Imagem URL</th>
                        <th className="table-head-cell text-left text-white" scope="col">Criado</th>
                        <th className="table-head-cell text-left text-white" scope="col">Atualizado</th>
                        <th className="table-head-cell text-right text-white" scope="col">Ações</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#f4f0e7]" data-services-table-body>
                    <tr>
                        <td className="table-cell" colSpan={14}>Carregando serviços...</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <section className="xl:col-span-2 bg-white rounded-xl border border-[#cfe7d1] shadow-sm p-6 flex flex-col gap-5">
                <div>
                    <h3 className="text-xl font-bold text-forest">Entrada de Serviço</h3>
                    <p className="text-sm text-stone-500">Cadastre os detalhes e valores do atendimento.</p>
                </div>
                <form className="flex flex-col gap-4" data-service-form>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs uppercase tracking-wider text-text-muted font-semibold">Nome do Serviço</label>
                        <input className="w-full border border-[#cfe7d1] rounded-lg px-4 py-2.5 bg-[#f6f8f6] text-forest-green focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body" placeholder="Ex.: Escova Premium" type="text" data-service-name />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs uppercase tracking-wider text-text-muted font-semibold">Descrição</label>
                        <textarea className="w-full border border-[#cfe7d1] rounded-lg px-4 py-2.5 bg-[#f6f8f6] text-forest-green focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body min-h-[90px]" placeholder="Resumo rápido do serviço e benefícios principais." data-service-description></textarea>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs uppercase tracking-wider text-text-muted font-semibold">Categoria</label>
                            <div className="flex items-center gap-2">
                                <div className="relative w-full">
                                    <select className="appearance-none w-full bg-[#f6f8f6] border border-[#cfe7d1] text-forest-green py-2.5 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body text-sm cursor-pointer hover:bg-white transition-colors" data-select="servicos-categorias" data-placeholder="Selecione" data-service-category>
                                        <option>Cabelos</option>
                                        <option>Estética</option>
                                        <option>Sobrancelhas</option>
                                        <option>Unhas</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-muted">
                                        <span className="material-symbols-outlined text-lg">expand_more</span>
                                    </div>
                                </div>
                                <button className="h-9 w-9 rounded-lg border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center justify-center" type="button" data-open-modal="categorias-servicos" title="Cadastrar categorias de serviços">
                                    <span className="material-symbols-outlined text-[18px]">add</span>
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs uppercase tracking-wider text-text-muted font-semibold">Duração</label>
                            <input className="w-full border border-[#cfe7d1] rounded-lg px-4 py-2.5 bg-[#f6f8f6] text-forest-green focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body" placeholder="Ex.: 60 min" type="text" data-service-duration />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs uppercase tracking-wider text-text-muted font-semibold">Preço</label>
                            <input className="w-full border border-[#cfe7d1] rounded-lg px-4 py-2.5 bg-[#f6f8f6] text-forest-green focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body" placeholder="R$ 0,00" type="text" data-service-price />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs uppercase tracking-wider text-text-muted font-semibold">Custo</label>
                            <input className="w-full border border-[#cfe7d1] rounded-lg px-4 py-2.5 bg-[#f6f8f6] text-forest-green focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body" placeholder="R$ 0,00" type="text" data-service-cost />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs uppercase tracking-wider text-text-muted font-semibold">Comissão (%)</label>
                            <input className="w-full border border-[#cfe7d1] rounded-lg px-4 py-2.5 bg-[#f6f8f6] text-forest-green focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body" placeholder="Ex.: 15" type="number" min="0" max="100" data-service-commission />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs uppercase tracking-wider text-text-muted font-semibold">Status</label>
                            <div className="flex items-center gap-2">
                                <div className="relative w-full">
                                    <select className="appearance-none w-full bg-[#f6f8f6] border border-[#cfe7d1] text-forest-green py-2.5 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body text-sm cursor-pointer hover:bg-white transition-colors" data-select="servicos-status" data-placeholder="Selecione" data-service-status>
                                        <option>Ativo</option>
                                        <option>Rascunho</option>
                                        <option>Inativo</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-muted">
                                        <span className="material-symbols-outlined text-lg">expand_more</span>
                                    </div>
                                </div>
                                <button className="h-9 w-9 rounded-lg border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center justify-center" type="button" data-open-modal="status-servicos" title="Cadastrar status de serviços">
                                    <span className="material-symbols-outlined text-[18px]">tune</span>
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs uppercase tracking-wider text-text-muted font-semibold">Destaque</label>
                            <div className="flex items-center gap-3 bg-[#f6f8f6] border border-[#cfe7d1] rounded-lg px-4 py-2.5">
                                <input className="accent-primary" type="checkbox" data-service-featured />
                                <span className="text-sm text-forest-green font-medium">Mostrar em FlipCards Tratamento Personalizado (até 9 simultâneos)</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs uppercase tracking-wider text-text-muted font-semibold">Imagem do Serviço</label>
                        <div className="flex items-center gap-2">
                            <input id="servico-imagem" className="w-full border border-[#cfe7d1] rounded-lg px-4 py-2.5 bg-[#f6f8f6] text-forest-green focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body" placeholder="Selecione uma imagem" type="text" readOnly data-service-image />
                            <button className="h-9 px-4 rounded-lg border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-semibold" type="button" data-open-modal="servicos-imagem">
                                Escolher
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <button className="flex-1 px-5 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20" type="button" data-service-save>
                            Salvar serviço
                        </button>
                        <button className="flex-1 px-5 py-3 rounded-xl bg-white border border-[#cfe7d1] text-forest-green font-bold hover:bg-[#f6f8f6] transition-colors" type="button" data-service-clear>
                            Limpar
                        </button>
                    </div>
                </form>
            </section>

        </div>

        
    </div>

    </>
  );
};
