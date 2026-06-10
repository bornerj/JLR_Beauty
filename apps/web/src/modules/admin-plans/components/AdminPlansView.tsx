import type { ReactElement } from "react";

export const AdminPlansView = (): ReactElement => {
  return (
    <>
<div className="max-w-[1400px] mx-auto p-8 flex flex-col gap-8">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex flex-col gap-1">
                <h2 className="text-forest dark:text-white text-3xl display-hero text-shadow-strong italic">Cadastro e Gestão de Planos</h2>
                <p className="text-stone-500 text-lg font-normal">Crie planos com nome, titulo, valor mensal e lista de benefícios.</p>
            </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <section className="xl:col-span-1 bg-white rounded-xl border border-[#cfe7d1] shadow-sm p-6 flex flex-col gap-5">
                <div>
                    <h3 className="text-xl font-bold text-forest">Entrada de Plano</h3>
                    <p className="text-sm text-stone-500">Preencha os dados do plano.</p>
                </div>
                <form className="flex flex-col gap-4" data-membership-form>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs uppercase tracking-wider text-text-muted font-semibold">Nome</label>
                        <input className="w-full border border-[#cfe7d1] rounded-lg px-4 py-2.5 bg-[#f6f8f6] text-forest-green focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body" placeholder="Ex.: Silver" type="text" data-membership-name />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs uppercase tracking-wider text-text-muted font-semibold">Titulo</label>
                        <input className="w-full border border-[#cfe7d1] rounded-lg px-4 py-2.5 bg-[#f6f8f6] text-forest-green focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body" placeholder="Ex.: Radiance" type="text" data-membership-title />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <label className="text-xs uppercase tracking-wider text-text-muted font-semibold">Valor mensal</label>
                                <span className="relative group inline-flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[16px] text-text-muted cursor-help" aria-hidden="true">info</span>
                                    <span className="absolute left-1/2 top-full mt-2 w-52 -translate-x-1/2 rounded-lg bg-forest text-white text-[11px] leading-snug px-3 py-2 shadow-lg opacity-0 pointer-events-none transition-opacity duration-150 group-hover:opacity-100">
                                        Exemplos: R$ 99,00 · R$ 189,00 · R$ 299,00
                                    </span>
                                </span>
                            </div>
                            <input className="w-full border border-[#cfe7d1] rounded-lg px-4 py-2.5 bg-[#f6f8f6] text-forest-green focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body" placeholder="R$ 0,00" type="text" inputMode="numeric" data-membership-price />
                            <p className="text-xs text-red-500 mt-1 hidden" data-price-error>Informe um valor valido (ex.: R$ 99,00).</p>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs uppercase tracking-wider text-text-muted font-semibold">Status</label>
                            <div className="relative w-full">
                                <select className="appearance-none w-full bg-[#f6f8f6] border border-[#cfe7d1] text-forest-green py-2.5 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body text-sm cursor-pointer hover:bg-white transition-colors" data-membership-status>
                                    <option>Ativo</option>
                                    <option>Rascunho</option>
                                    <option>Inativo</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-muted">
                                    <span className="material-symbols-outlined text-lg">expand_more</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2" data-benefits-container>
                        <label className="text-xs uppercase tracking-wider text-text-muted font-semibold">Beneficios (lista)</label>
                        <div className="flex items-center gap-2" data-benefit-row>
                            <input className="w-full border border-[#cfe7d1] rounded-lg px-4 py-2.5 bg-[#f6f8f6] text-forest-green focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body" placeholder="Ex.: 10% de desconto em servicos" type="text" data-membership-benefit />
                            <button className="h-10 w-10 rounded-lg border border-[#cfe7d1] bg-white text-forest-green hover:bg-[#f6f8f6] transition-colors flex items-center justify-center" type="button" data-remove-benefit title="Remover beneficio">
                                <span className="material-symbols-outlined text-[18px]">remove</span>
                            </button>
                        </div>
                        <div className="flex items-center gap-2" data-benefit-row>
                            <input className="w-full border border-[#cfe7d1] rounded-lg px-4 py-2.5 bg-[#f6f8f6] text-forest-green focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body" placeholder="Ex.: Acesso antecipado a agenda" type="text" data-membership-benefit />
                            <button className="h-10 w-10 rounded-lg border border-[#cfe7d1] bg-white text-forest-green hover:bg-[#f6f8f6] transition-colors flex items-center justify-center" type="button" data-remove-benefit title="Remover beneficio">
                                <span className="material-symbols-outlined text-[18px]">remove</span>
                            </button>
                        </div>
                        <div className="flex items-center gap-2" data-benefit-row>
                            <input className="w-full border border-[#cfe7d1] rounded-lg px-4 py-2.5 bg-[#f6f8f6] text-forest-green focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body" placeholder="Ex.: Tratamento capilar mensal" type="text" data-membership-benefit />
                            <button className="h-10 w-10 rounded-lg border border-[#cfe7d1] bg-white text-forest-green hover:bg-[#f6f8f6] transition-colors flex items-center justify-center" type="button" data-remove-benefit title="Remover beneficio">
                                <span className="material-symbols-outlined text-[18px]">remove</span>
                            </button>
                        </div>
                        <button className="flex items-center gap-2 bg-white border border-[#cfe7d1] text-forest-green py-2.5 px-4 rounded-lg hover:bg-[#f6f8f6] focus:outline-none focus:ring-1 focus:ring-primary font-body text-sm transition-colors" type="button" data-add-benefit>
                            <span className="material-symbols-outlined text-lg text-text-muted">add</span>
                            Adicionar beneficio
                        </button>
                    </div>
                    <div className="flex items-center gap-3 bg-[#f6f8f6] border border-[#cfe7d1] rounded-lg px-4 py-2.5">
                        <input className="accent-primary" type="checkbox" data-membership-featured />
                        <span className="text-sm text-forest-green font-medium">Plano em destaque</span>
                    </div>
                    <button className="w-full py-3 rounded-lg bg-forest text-white hover:bg-primary hover:text-forest font-bold uppercase tracking-widest text-xs transition-colors" type="submit">
                        Salvar Plano
                    </button>
                </form>
            </section>

            <section className="xl:col-span-2 flex flex-col gap-6">
                <div className="bg-white rounded-xl border border-[#cfe7d1] shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-forest">Planos Ativos</h3>
                    <div className="flex items-center gap-2 text-sm text-stone-500">
                        <span className="material-symbols-outlined text-base text-gold">card_membership</span>
                        <span data-membership-count>3</span> planos
                    </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-membership-list></div>
                </div>
            </section>
        </div>
    </div>

    </>
  );
};
