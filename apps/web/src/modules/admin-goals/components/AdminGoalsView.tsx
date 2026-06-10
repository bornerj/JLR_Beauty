import type { ReactElement } from "react";

export const AdminGoalsView = (): ReactElement => {
  return (
    <>
<div className="max-w-5xl mx-auto space-y-8 pb-20">
                {/* Profile & Header Section */}
                <div className="bg-surface-light rounded-2xl p-6 shadow-sm border border-border-color flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex gap-5 items-center">
                        <div className="relative">
                            <div className="bg-center bg-no-repeat bg-cover rounded-full h-24 w-24 border-4 border-[#e7f3eb]" data-alt="Perfil grande de Sarah Jenkins" style={{ backgroundImage: "url(\"https://lh3.googleusercontent.com/aida-public/AB6AXuCi5GFXYuYajpr0O40SKlK1oPyjFTmWwgGjUMc58oslDRO0TImKxo0aCQ0Xu3x_7aG99tXVG3i4BkfdaLGeNGb-5SaTGKpKCMZwLuaTiFsOCQnIIKylists4ZRAYzl0Ta76lREfAVT_ARu5_55tv8-6DXuAKP5KTJ95a2pD8-HuD_QCIJpgkDwGxNiHwbydUs4Hxe22NpIC2QY2MsuYvIxds36rlDU-NyvMP1asfOYVFBogcwSZ4O4RgiPgks0I1jHnqqfI102BQ5o\")" }}>
                            </div>
                            <div className="absolute bottom-1 right-1 bg-surface-light rounded-full p-1 border border-border-color shadow-sm">
                                <span className="material-symbols-outlined text-primary text-xl">verified</span>
                            </div>
                        </div>
                        <div className="flex flex-col justify-center">
                            <h1 className="text-text-main text-3xl display-hero text-shadow-strong leading-tight tracking-[-0.015em]">Sarah
                                Jenkins</h1>
                            <p className="text-text-secondary text-base font-medium mt-1">Estilista Senior - Level 3</p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">Destaque</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 w-full md:w-auto">
                        <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Periodo da
                            Meta</label>
                        <div className="relative">
                            <select className="appearance-none bg-[#e7f3eb] text-text-main font-bold py-3 pl-4 pr-10 rounded-lg w-full md:w-48 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 border-none">
                                <option>Outubro 2023</option>
                                <option>Novembro 2023</option>
                                <option>Dezembro 2023</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-text-main">
                                <span className="material-symbols-outlined">expand_more</span>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Goal Setting Workspace */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-text-main text-2xl font-bold">Definir Metas</h2>
                        <button className="text-primary text-sm font-bold hover:underline">Preencher com o mes
                            passado</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* KPI Card 1: Receita Total */}
                        <div className="bg-surface-light p-6 rounded-2xl border border-border-color shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="bg-[#e7f3eb] p-2 rounded-lg text-text-main">
                                        <span className="material-symbols-outlined">attach_money</span>
                                    </div>
                                    <h3 className="font-bold text-text-main text-lg">Receita Total</h3>
                                </div>
                                <div className="group relative flex justify-center">
                                    <span className="material-symbols-outlined text-text-secondary cursor-help hover:text-text-main text-xl">info</span>
                                    <div className="absolute bottom-full mb-2 hidden group-hover:block w-48 bg-text-main text-white text-xs rounded p-2 z-10 text-center">
                                        Receita combinada de servicos e vendas de produtos.
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="relative w-full">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-text-secondary font-bold">R$ </span>
                                    </div>
                                    <input className="block w-full pl-8 pr-3 py-3 rounded-lg border-border-color bg-background-light text-text-main font-bold text-xl focus:ring-primary focus:border-primary" type="text" value="12,500" />
                                </div>
                                <span className="text-text-secondary font-medium whitespace-nowrap text-sm">Meta</span>
                            </div>
                            <div>
                                <input className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" max="20000" min="5000" type="range" value="12500" />
                                <div className="flex justify-between mt-2 text-xs text-text-secondary font-medium">
                                    <span>R$ 5.000,00</span>
                                    <span>R$ 20.000,00</span>
                                </div>
                            </div>
                        </div>
                        {/* KPI Card 2: Vendas de Produtos */}
                        <div className="bg-surface-light p-6 rounded-2xl border border-border-color shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="bg-[#e7f3eb] p-2 rounded-lg text-text-main">
                                        <span className="material-symbols-outlined">shopping_bag</span>
                                    </div>
                                    <h3 className="font-bold text-text-main text-lg">Vendas de Produtos</h3>
                                </div>
                                <div className="group relative flex justify-center">
                                    <span className="material-symbols-outlined text-text-secondary cursor-help hover:text-text-main text-xl">info</span>
                                    <div className="absolute bottom-full mb-2 hidden group-hover:block w-48 bg-text-main text-white text-xs rounded p-2 z-10 text-center">
                                        Receita de produtos levados para casa.
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="relative w-full">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-text-secondary font-bold">R$ </span>
                                    </div>
                                    <input className="block w-full pl-8 pr-3 py-3 rounded-lg border-border-color bg-background-light text-text-main font-bold text-xl focus:ring-primary focus:border-primary" type="text" value="2,100" />
                                </div>
                                <span className="text-text-secondary font-medium whitespace-nowrap text-sm">Meta</span>
                            </div>
                            <div>
                                <input className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" max="5000" min="0" type="range" value="2100" />
                                <div className="flex justify-between mt-2 text-xs text-text-secondary font-medium">
                                    <span>R$ 0,00</span>
                                    <span>R$ 5.000,00</span>
                                </div>
                            </div>
                        </div>
                        {/* KPI Card 3: Novos Clientes */}
                        <div className="bg-surface-light p-6 rounded-2xl border border-border-color shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="bg-[#e7f3eb] p-2 rounded-lg text-text-main">
                                        <span className="material-symbols-outlined">group_add</span>
                                    </div>
                                    <h3 className="font-bold text-text-main text-lg">Novos Clientes</h3>
                                </div>
                                <div className="group relative flex justify-center">
                                    <span className="material-symbols-outlined text-text-secondary cursor-help hover:text-text-main text-xl">info</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="relative w-full">
                                    <input className="block w-full px-3 py-3 rounded-lg border-border-color bg-background-light text-text-main font-bold text-xl focus:ring-primary focus:border-primary" type="number" value="12" />
                                </div>
                                <span className="text-text-secondary font-medium whitespace-nowrap text-sm">Clientes</span>
                            </div>
                            <div>
                                <input className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" max="30" min="0" type="range" value="12" />
                                <div className="flex justify-between mt-2 text-xs text-text-secondary font-medium">
                                    <span>0</span>
                                    <span>30+</span>
                                </div>
                            </div>
                        </div>
                        {/* KPI Card 4: Taxa de Retencao */}
                        <div className="bg-surface-light p-6 rounded-2xl border border-border-color shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="bg-[#e7f3eb] p-2 rounded-lg text-text-main">
                                        <span className="material-symbols-outlined">loop</span>
                                    </div>
                                    <h3 className="font-bold text-text-main text-lg">Taxa de Retencao</h3>
                                </div>
                                <div className="group relative flex justify-center">
                                    <span className="material-symbols-outlined text-text-secondary cursor-help hover:text-text-main text-xl">info</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="relative w-full">
                                    <input className="block w-full px-3 py-3 rounded-lg border-border-color bg-background-light text-text-main font-bold text-xl focus:ring-primary focus:border-primary" type="number" value="68" />
                                    <div className="absolute inset-y-0 right-0 pr-8 flex items-center pointer-events-none">
                                        <span className="text-text-secondary font-bold">%</span>
                                    </div>
                                </div>
                                <span className="text-text-secondary font-medium whitespace-nowrap text-sm">Taxa</span>
                            </div>
                            <div>
                                <input className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" max="100" min="0" type="range" value="68" />
                                <div className="flex justify-between mt-2 text-xs text-text-secondary font-medium">
                                    <span>0%</span>
                                    <span>100%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Preview Chart Section */}
                <div className="bg-surface-light p-8 rounded-2xl border border-border-color shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center mb-8 gap-4">
                        <div>
                            <h3 className="text-xl font-bold text-text-main">Previa de Progresso</h3>
                            <p className="text-text-secondary text-sm mt-1">Comparando metas atuais com o desempenho real do
                                mes passado</p>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-bold">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                                <span>Mes Passado</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-primary"></div>
                                <span>Meta Proposta</span>
                            </div>
                        </div>
                    </div>
                    {/* CSS Bar Chart */}
                    <div className="relative h-64 w-full flex items-end justify-between gap-4 md:gap-12 px-2">
                        {/* Horizontal Grid Lines */}
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                            <div className="w-full border-b border-dashed border-gray-200 h-0"></div>
                            <div className="w-full border-b border-dashed border-gray-200 h-0"></div>
                            <div className="w-full border-b border-dashed border-gray-200 h-0"></div>
                            <div className="w-full border-b border-gray-200 h-0"></div>
                        </div>
                        {/* Bar Group 1 */}
                        <div className="flex flex-col items-center flex-1 h-full justify-end z-10 group cursor-pointer">
                            <div className="flex gap-1 md:gap-3 items-end h-full w-full justify-center">
                                <div className="w-4 md:w-8 bg-gray-300 rounded-t-md h-[60%] relative transition-all duration-300 group-hover:bg-gray-400">
                                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-text-main text-white text-xs py-1 px-2 rounded whitespace-nowrap transition-opacity">
                                        R$ 10.200,00</div>
                                </div>
                                <div className="w-4 md:w-8 bg-primary rounded-t-md h-[75%] relative transition-all duration-300 group-hover:bg-primary-dark">
                                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-white text-xs py-1 px-2 rounded whitespace-nowrap transition-opacity font-bold">
                                        R$ 12.500,00</div>
                                </div>
                            </div>
                            <p className="mt-3 text-xs md:text-sm font-bold text-text-secondary text-center">Receita</p>
                        </div>
                        {/* Bar Group 2 */}
                        <div className="flex flex-col items-center flex-1 h-full justify-end z-10 group cursor-pointer">
                            <div className="flex gap-1 md:gap-3 items-end h-full w-full justify-center">
                                <div className="w-4 md:w-8 bg-gray-300 rounded-t-md h-[40%] relative transition-all duration-300 group-hover:bg-gray-400">
                                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-text-main text-white text-xs py-1 px-2 rounded whitespace-nowrap transition-opacity">
                                        R$ 1.800,00</div>
                                </div>
                                <div className="w-4 md:w-8 bg-primary rounded-t-md h-[55%] relative transition-all duration-300 group-hover:bg-primary-dark">
                                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-white text-xs py-1 px-2 rounded whitespace-nowrap transition-opacity font-bold">
                                        R$ 2.100,00</div>
                                </div>
                            </div>
                            <p className="mt-3 text-xs md:text-sm font-bold text-text-secondary text-center">Varejo</p>
                        </div>
                        {/* Bar Group 3 */}
                        <div className="flex flex-col items-center flex-1 h-full justify-end z-10 group cursor-pointer">
                            <div className="flex gap-1 md:gap-3 items-end h-full w-full justify-center">
                                <div className="w-4 md:w-8 bg-gray-300 rounded-t-md h-[30%] relative transition-all duration-300 group-hover:bg-gray-400">
                                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-text-main text-white text-xs py-1 px-2 rounded whitespace-nowrap transition-opacity">
                                        8</div>
                                </div>
                                <div className="w-4 md:w-8 bg-primary rounded-t-md h-[45%] relative transition-all duration-300 group-hover:bg-primary-dark">
                                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-white text-xs py-1 px-2 rounded whitespace-nowrap transition-opacity font-bold">
                                        12</div>
                                </div>
                            </div>
                            <p className="mt-3 text-xs md:text-sm font-bold text-text-secondary text-center">Novos Clientes
                            </p>
                        </div>
                        {/* Bar Group 4 */}
                        <div className="flex flex-col items-center flex-1 h-full justify-end z-10 group cursor-pointer">
                            <div className="flex gap-1 md:gap-3 items-end h-full w-full justify-center">
                                <div className="w-4 md:w-8 bg-gray-300 rounded-t-md h-[65%] relative transition-all duration-300 group-hover:bg-gray-400">
                                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-text-main text-white text-xs py-1 px-2 rounded whitespace-nowrap transition-opacity">
                                        65%</div>
                                </div>
                                <div className="w-4 md:w-8 bg-primary rounded-t-md h-[68%] relative transition-all duration-300 group-hover:bg-primary-dark">
                                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-white text-xs py-1 px-2 rounded whitespace-nowrap transition-opacity font-bold">
                                        68%</div>
                                </div>
                            </div>
                            <p className="mt-3 text-xs md:text-sm font-bold text-text-secondary text-center">Retencao</p>
                        </div>
                    </div>
                </div>
                {/* Action Bar */}
                <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4 pt-4 border-t border-border-color">
                    <button className="px-6 py-3 rounded-xl text-text-secondary font-bold hover:bg-gray-100 transition-colors w-full sm:w-auto">
                        Reverter Alteracoes
                    </button>
                    <div className="flex gap-4 w-full sm:w-auto">
                        <button className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-[#e7f3eb] text-text-main font-bold hover:bg-[#d5e9db] transition-colors">
                            Salvar como Rascunho
                        </button>
                        <button className="flex-1 sm:flex-none px-8 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-colors shadow-lg shadow-primary/30 flex items-center justify-center gap-2">
                            <span>Save & Notify</span>
                            <span className="material-symbols-outlined text-sm">send</span>
                        </button>
                    </div>
                </div>
            </div>

    </>
  );
};

