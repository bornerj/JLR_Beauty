import type { ReactElement } from "react";
import { useBranding } from "../../public-site/branding.runtime";

export const AdminProductsView = (): ReactElement => {
  const branding = useBranding();

  return (
    <>
<div className="max-w-[1400px] mx-auto p-8 flex flex-col gap-8">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex flex-col gap-1">
                <h2 className="text-forest dark:text-white text-3xl display-hero text-shadow-strong italic">Cadastro e Consulta de Produtos</h2>
                <p className="text-stone-500 text-lg font-normal">{`Crie, edite e acompanhe o catálogo da ${branding.fullName}.`}</p>
            </div>
            <div className="flex items-center gap-3">
                <button className="px-4 py-2 text-sm font-semibold rounded-lg bg-[#e7f3eb] text-forest-green hover:bg-[#d5e9db] transition-colors">
                    Importar
                </button>
                <button className="px-5 py-2 text-sm font-semibold rounded-lg bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors flex items-center gap-2" type="button" data-product-new>
                    <span className="material-symbols-outlined text-base">add</span>
                    Novo Produto
                </button>
            </div>
        </header>

        <section className="bg-white rounded-xl border border-[#cfe7d1] shadow-sm p-6 flex flex-col gap-4">
            <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-3">
                <div className="relative w-full group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-text-muted group-focus-within:text-primary transition-colors">search</span>
                    </div>
                    <input className="block w-full pl-10 pr-3 py-2.5 border border-[#cfe7d1] rounded-lg leading-5 bg-[#f6f8f6] text-forest-green placeholder-text-muted focus:outline-none focus:bg-white focus:ring-1 focus:ring-primary focus:border-primary text-xs font-body transition-all" placeholder="Buscar por nome do produto..." type="text" data-products-search />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                        <div className="relative w-full">
                            <select className="appearance-none w-full bg-[#f6f8f6] border border-[#cfe7d1] text-forest-green py-2.5 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body text-xs cursor-pointer hover:bg-white transition-colors" data-select="produtos-categorias" data-placeholder="Categoria" data-products-category-filter>
                                <option>Categoria</option>
                                <option>Tratamento</option>
                                <option>Finalizacao</option>
                                <option>Hair Care</option>
                                <option>Skin Care</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-muted">
                                <span className="material-symbols-outlined text-lg">expand_more</span>
                            </div>
                        </div>
                        <button className="h-9 w-9 rounded-lg border border-[#cfe7d1] bg-white text-forest-green hover:bg-[#f6f8f6] transition-colors flex items-center justify-center" type="button" data-open-modal="categorias" title="Cadastrar categorias de produtos">
                            <span className="material-symbols-outlined text-[18px]">add</span>
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative w-full">
                            <select className="appearance-none w-full bg-[#f6f8f6] border border-[#cfe7d1] text-forest-green py-2.5 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body text-xs cursor-pointer hover:bg-white transition-colors" data-select="produtos-status" data-placeholder="Status" data-products-status-filter>
                                <option>Status</option>
                                <option>Ativo</option>
                                <option>Rascunho</option>
                                <option>Inativo</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-muted">
                                <span className="material-symbols-outlined text-lg">expand_more</span>
                            </div>
                        </div>
                        <button className="h-9 w-9 rounded-lg border border-[#cfe7d1] bg-white text-forest-green hover:bg-[#f6f8f6] transition-colors flex items-center justify-center" type="button" data-open-modal="status-produtos" title="Cadastrar status de produtos">
                            <span className="material-symbols-outlined text-[18px]">tune</span>
                        </button>
                    </div>
                    <button className="flex items-center gap-2 bg-white border border-[#cfe7d1] text-forest-green py-2.5 px-4 rounded-lg hover:bg-[#f6f8f6] focus:outline-none focus:ring-1 focus:ring-primary font-body text-xs transition-colors sm:col-span-2" type="button" data-products-clear-filters>
                        <span className="material-symbols-outlined text-lg text-text-muted">refresh</span>
                        Limpar filtros
                    </button>
                </div>
            </div>
        </section>

        <div className="bg-white rounded-xl border border-[#cfe7d1] shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4 border-b border-[#cfe7d1] bg-primary">
                <div className="text-xs text-white font-medium uppercase tracking-wider" data-products-pagination-range>
                    Mostrando 0-0 de 0 produtos
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] uppercase tracking-wider text-white font-semibold">Itens por pagina</span>
                        <div className="relative">
                            <select className="appearance-none bg-white border border-[#cfe7d1] text-forest-green py-1.5 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-xs cursor-pointer hover:bg-[#f6f8f6] transition-colors" data-products-page-size>
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
                        <button className="px-3 py-1.5 rounded-lg border border-[#cfe7d1] bg-forest text-gold text-xs font-semibold hover:bg-primary transition-colors disabled:opacity-40" type="button" data-products-page-first>
                            <span className="material-symbols-outlined text-sm align-middle">first_page</span>
                            Primeira
                        </button>
                        <button className="px-3 py-1.5 rounded-lg border border-[#cfe7d1] bg-forest text-gold text-xs font-semibold hover:bg-primary transition-colors disabled:opacity-40" type="button" data-products-page-prev>
                            <span className="material-symbols-outlined text-sm align-middle">chevron_left</span>
                            Anterior
                        </button>
                        <div className="px-3 py-1.5 rounded-lg border border-[#cfe7d1] bg-forest text-xs font-semibold text-gold" data-products-pagination-page>
                            Pagina 1 de 1
                        </div>
                        <button className="px-3 py-1.5 rounded-lg border border-[#cfe7d1] bg-forest text-gold text-xs font-semibold hover:bg-primary transition-colors disabled:opacity-40" type="button" data-products-page-next>
                            Proxima
                            <span className="material-symbols-outlined text-sm align-middle">chevron_right</span>
                        </button>
                        <button className="px-3 py-1.5 rounded-lg border border-[#cfe7d1] bg-forest text-gold text-xs font-semibold hover:bg-primary transition-colors disabled:opacity-40" type="button" data-products-page-last>
                            Ultima
                            <span className="material-symbols-outlined text-sm align-middle">last_page</span>
                        </button>
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto" data-products-grid-scroll>
                <table className="min-w-full divide-y divide-[#cfe7d1]">
                    <thead className="bg-[#f6f8f6]">
                        <tr>
                            <th className="table-head-cell text-left text-text-muted" scope="col">ID</th>
                            <th className="table-head-cell text-left text-text-muted" scope="col">Produto</th>
                            <th className="table-head-cell text-left text-text-muted" scope="col">Destaque</th>
                            <th
                                className="table-head-cell text-left text-text-muted product-description-head"
                                scope="col"
                                style={{ width: "140px", minWidth: "140px", maxWidth: "140px" }}
                            >
                                Descricao
                            </th>
                            <th className="table-head-cell text-left text-text-muted" scope="col">SKU</th>
                            <th className="table-head-cell text-left text-text-muted" scope="col">Categoria</th>
                            <th className="table-head-cell text-left text-text-muted" scope="col">Categoria ID</th>
                            <th className="table-head-cell text-left text-text-muted" scope="col">Status</th>
                            <th className="table-head-cell text-left text-text-muted" scope="col">Status ID</th>
                            <th className="table-head-cell text-left text-text-muted" scope="col">Estoque</th>
                            <th className="table-head-cell text-left text-text-muted" scope="col">Preco</th>
                            <th className="table-head-cell text-left text-text-muted" scope="col">Patrimonio</th>
                            <th className="table-head-cell text-left text-text-muted" scope="col">Imagem URL</th>
                            <th className="table-head-cell text-left text-text-muted" scope="col">Beneficios</th>
                            <th className="table-head-cell text-left text-text-muted" scope="col">Criado</th>
                            <th className="table-head-cell text-left text-text-muted" scope="col">Atualizado</th>
                            <th className="table-head-cell text-right text-text-muted" scope="col">Acoes</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-[#f4f0e7]" data-products-table-body>
                        <tr>
                            <td className="table-cell" colSpan={17}>Carregando produtos...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <section className="xl:col-span-1 bg-white rounded-xl border border-[#cfe7d1] shadow-sm p-6 flex flex-col gap-5" data-product-entry-section>
                <div>
                    <h3 className="text-xl font-bold text-forest" data-product-entry-title>
                        Entrada de Produto <span className="text-primary align-middle">•</span>
                    </h3>
                    <p className="text-sm text-stone-500">Preencha os dados básicos para cadastrar ou atualizar.</p>
                    <p className="mt-2 text-xs text-stone-500 hidden" data-product-feedback></p>
                </div>
                <form className="flex flex-col gap-4" data-product-form>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs uppercase tracking-wider text-text-muted font-semibold">Nome do Produto</label>
                        <input className="w-full border border-[#cfe7d1] rounded-lg px-4 py-2.5 bg-[#f6f8f6] text-forest-green focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body" placeholder="Ex.: Shampoo Argan Premium" type="text" data-product-name />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs uppercase tracking-wider text-text-muted font-semibold">Categoria</label>
                            <div className="flex items-center gap-2">
                                <div className="relative w-full">
                                    <select className="appearance-none w-full bg-[#f6f8f6] border border-[#cfe7d1] text-forest-green py-2.5 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body text-sm cursor-pointer hover:bg-white transition-colors" data-select="produtos-categorias" data-placeholder="Selecione" data-product-category>
                                        <option>Tratamento</option>
                                        <option>Finalizacao</option>
                                        <option>Hair Care</option>
                                        <option>Skin Care</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-muted">
                                        <span className="material-symbols-outlined text-lg">expand_more</span>
                                    </div>
                                </div>
                                <button className="h-9 w-9 rounded-lg border border-[#cfe7d1] bg-white text-forest-green hover:bg-[#f6f8f6] transition-colors flex items-center justify-center" type="button" data-open-modal="categorias" title="Cadastrar categorias">
                                    <span className="material-symbols-outlined text-[18px]">add</span>
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs uppercase tracking-wider text-text-muted font-semibold">SKU</label>
                            <input className="w-full border border-[#cfe7d1] rounded-lg px-4 py-2.5 bg-[#f6f8f6] text-forest-green focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body" placeholder="JLR-ARG-01" type="text" data-product-sku />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs uppercase tracking-wider text-text-muted font-semibold">Preco</label>
                            <input className="w-full border border-[#cfe7d1] rounded-lg px-4 py-2.5 bg-[#f6f8f6] text-forest-green focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body" placeholder="R$ 0,00" type="text" data-product-price />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs uppercase tracking-wider text-text-muted font-semibold">Estoque</label>
                            <input className="w-full border border-[#cfe7d1] rounded-lg px-4 py-2.5 bg-[#f6f8f6] text-forest-green focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body" placeholder="Quantidade" type="number" min="0" data-product-stock />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs uppercase tracking-wider text-text-muted font-semibold">Status</label>
                            <div className="flex items-center gap-2">
                                <div className="relative w-full">
                                    <select className="appearance-none w-full bg-[#f6f8f6] border border-[#cfe7d1] text-forest-green py-2.5 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body text-sm cursor-pointer hover:bg-white transition-colors" data-select="produtos-status" data-placeholder="Selecione" data-product-status>
                                        <option>Ativo</option>
                                        <option>Rascunho</option>
                                        <option>Inativo</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-muted">
                                        <span className="material-symbols-outlined text-lg">expand_more</span>
                                    </div>
                                </div>
                                <button className="h-9 w-9 rounded-lg border border-[#cfe7d1] bg-white text-forest-green hover:bg-[#f6f8f6] transition-colors flex items-center justify-center" type="button" data-open-modal="status-produtos" title="Cadastrar status de produtos">
                                    <span className="material-symbols-outlined text-[18px]">tune</span>
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs uppercase tracking-wider text-text-muted font-semibold">Destaque</label>
                            <div className="flex items-center gap-3 bg-[#f6f8f6] border border-[#cfe7d1] rounded-lg px-4 py-2.5">
                                <input className="accent-primary" type="checkbox" data-product-featured />
                                <span className="text-sm text-forest-green font-medium">Mostrar na vitrine</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs uppercase tracking-wider text-text-muted font-semibold">Descricao</label>
                        <textarea className="w-full border border-[#cfe7d1] rounded-lg px-4 py-2.5 bg-[#f6f8f6] text-forest-green focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body min-h-[110px]" placeholder="Detalhes do produto, benefícios e modo de uso." data-product-description></textarea>
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs uppercase tracking-wider text-text-muted font-semibold">Benefícios (ate 5)</label>
                            <span className="text-[11px] text-text-muted">Lista separada</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input className="w-full border border-[#cfe7d1] rounded-lg px-4 py-2.5 bg-[#f6f8f6] text-forest-green focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body" name="beneficios[]" placeholder="Benefício 1" type="text" data-product-benefit />
                            <input className="w-full border border-[#cfe7d1] rounded-lg px-4 py-2.5 bg-[#f6f8f6] text-forest-green focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body" name="beneficios[]" placeholder="Benefício 2" type="text" data-product-benefit />
                            <input className="w-full border border-[#cfe7d1] rounded-lg px-4 py-2.5 bg-[#f6f8f6] text-forest-green focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body" name="beneficios[]" placeholder="Benefício 3" type="text" data-product-benefit />
                            <input className="w-full border border-[#cfe7d1] rounded-lg px-4 py-2.5 bg-[#f6f8f6] text-forest-green focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body" name="beneficios[]" placeholder="Benefício 4" type="text" data-product-benefit />
                            <input className="w-full border border-[#cfe7d1] rounded-lg px-4 py-2.5 bg-[#f6f8f6] text-forest-green focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body sm:col-span-2" name="beneficios[]" placeholder="Benefício 5" type="text" data-product-benefit />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs uppercase tracking-wider text-text-muted font-semibold">Imagem do Produto</label>
                        <div className="flex items-center gap-2">
                            <input className="w-full border border-[#cfe7d1] rounded-lg px-4 py-2.5 bg-[#f6f8f6] text-forest-green focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body" placeholder="Selecione uma imagem" type="text" readOnly data-product-image />
                            <button className="h-9 px-4 rounded-lg border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-semibold" type="button" data-open-modal="produtos-imagem">
                                Escolher
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <button className="flex-1 px-5 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20" type="button" data-product-save>
                            Salvar produto
                        </button>
                        <button className="flex-1 px-5 py-3 rounded-xl bg-white border border-[#cfe7d1] text-forest-green font-bold hover:bg-[#f6f8f6] transition-colors" type="button" data-product-clear>
                            Limpar
                        </button>
                    </div>
                </form>
            </section>

            <section className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-[#cfe7d1] shadow-sm p-5 flex flex-col justify-between">
                    <p className="text-text-muted text-sm font-body font-medium uppercase tracking-wider">Produtos ativos</p>
                    <div className="flex items-end gap-2">
                        <p className="text-forest-green text-3xl display-number text-shadow-strong">128</p>
                        <span className="text-green-600 text-xs font-medium mb-1 flex items-center">
                            <span className="material-symbols-outlined text-sm">trending_up</span> +6%
                        </span>
                    </div>
                    <span className="text-xs text-text-muted">Ultima atualizacao hoje</span>
                </div>
                <div className="bg-white rounded-xl border border-[#cfe7d1] shadow-sm p-5 flex flex-col justify-between">
                    <p className="text-text-muted text-sm font-body font-medium uppercase tracking-wider">Baixo estoque</p>
                    <div className="flex items-end gap-2">
                        <p className="text-forest-green text-3xl display-number text-shadow-strong">9</p>
                        <span className="text-orange-500 text-xs font-medium mb-1 flex items-center">
                            <span className="material-symbols-outlined text-sm">warning</span> Revisar
                        </span>
                    </div>
                    <span className="text-xs text-text-muted">Abaixo de 5 unidades</span>
                </div>
                <div className="bg-white rounded-xl border border-[#cfe7d1] shadow-sm p-5 flex flex-col justify-between">
                    <p className="text-text-muted text-sm font-body font-medium uppercase tracking-wider">Categorias</p>
                    <div className="flex items-end gap-2">
                        <p className="text-forest-green text-3xl display-number text-shadow-strong">6</p>
                        <span className="text-primary text-xs font-medium mb-1 flex items-center">
                            <span className="material-symbols-outlined text-sm">auto_awesome</span> em destaque
                        </span>
                    </div>
                    <span className="text-xs text-text-muted">Tratamento lidera vendas</span>
                </div>
                <div className="bg-white rounded-xl border border-[#cfe7d1] shadow-sm p-5 flex flex-col justify-between">
                    <p className="text-text-muted text-sm font-body font-medium uppercase tracking-wider">Rascunhos</p>
                    <div className="flex items-end gap-2">
                        <p className="text-forest-green text-3xl display-number text-shadow-strong">14</p>
                        <span className="text-text-muted text-xs font-medium mb-1 flex items-center">
                            <span className="material-symbols-outlined text-sm">schedule</span> pendentes
                        </span>
                    </div>
                    <span className="text-xs text-text-muted">Atualize para publicar</span>
                </div>
            </section>
        </div>

        
    </div>

    </>
  );
};
