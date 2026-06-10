import type { ReactElement } from "react";
import { Link } from "react-router-dom";

export const AdminPerformanceView = (): ReactElement => {
  return (
    <>
{/* Breadcrumbs / Page Title */}
<div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
  <div>
  <Link className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-forest/70 hover:text-primary transition-colors" to="/admin">
    <span className="material-symbols-outlined text-base">arrow_back</span>
    Voltar
  </Link>
 <h1 className="text-3xl display-hero text-shadow-strong text-forest-dark dark:text-white mt-3">Analise de Desempenho</h1>
<p className="text-gray-500 dark:text-gray-400 mt-1">Detalhamento do desempenho da equipe e metricas de receita</p>
</div>
<div className="flex items-center gap-2 bg-white dark:bg-white/5 p-1 rounded-lg border border-[#cfe7d7] dark:border-white/10 shadow-sm">
<button className="px-4 py-2 text-sm font-medium rounded text-primary bg-primary/10">Visao Geral</button>
<button className="px-4 py-2 text-sm font-medium rounded text-gray-500 dark:text-gray-400 hover:text-forest-dark dark:hover:text-white transition-colors">Financeiro</button>
<button className="px-4 py-2 text-sm font-medium rounded text-gray-500 dark:text-gray-400 hover:text-forest-dark dark:hover:text-white transition-colors">Lista de Clientees</button>
</div>
</div>
{/* Profile Header & Global Filter */}
<div className="bg-white dark:bg-white/5 rounded-2xl shadow-sm border border-[#e7f3eb] dark:border-white/5 p-6 md:p-8 mb-6">
<div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
<div className="flex items-center gap-6">
<div className="relative">
<div className="size-24 rounded-full bg-cover bg-center border-4 border-[#f6f8f6] dark:border-[#1a2e22] shadow-lg" data-alt="Foto de perfil de Elena Fisher, Estilista Senior" style={{ backgroundImage: "url(\"https://lh3.googleusercontent.com/aida-public/AB6AXuCEDvGQmXHxu8Ok5Qph0-EOuqKhZW0cdcyrPPTWWSLf-Bl0VdEpgMdSnvUH2gL20TduNF4lU4aMfFbj6xaDdOLENvwC4_etSYzaBqcXFWzDFFPtv1XxBfjgpO8IvZuwtsneZDp5rQyLbvaIA-prYg8tkIHPKCWV1l1p5EEtJVapbc6cSWfJeekSWpRUphj3zThUJ9-m7OpSt1HlRTKBQ7F8Z9AN_Ts_mlxdV4pd1nSQWb72FKOyyL-QGC9-lSbVWV5NO_3X_D5W-d8\")" }}></div>
<div className="absolute bottom-0 right-0 rounded-full bg-primary p-1.5 border-4 border-[#f6f8f6] dark:border-[#1a2e22]">
<span className="material-symbols-outlined text-white text-[16px]">verified</span>
</div>
</div>
<div>
<div className="flex items-center gap-2">
<h2 className="text-2xl font-bold text-forest-dark dark:text-white">Elena Fisher</h2>
<span className="bg-gold-accent/10 text-gold-accent text-xs px-2 py-0.5 rounded-full font-bold border border-gold-accent/20">Destaque</span>
</div>
<p className="text-primary font-medium text-lg">Estilista Senior <span className="text-gray-400 px-2">-</span> Especialista em Cabelo</p>
<p className="text-gray-500 dark:text-gray-400 text-sm mt-1 flex items-center gap-1">
<span className="material-symbols-outlined text-[16px]">badge</span>
                                Employee ID: #EF-2023-89
                            </p>
</div>
</div>
{/* Data Filters */}
<div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
<div className="flex items-center gap-2 bg-[#f8fcf9] dark:bg-white/5 border border-[#cfe7d7] dark:border-white/10 rounded-lg px-4 py-2.5">
<span className="material-symbols-outlined text-gray-400 text-[20px]">calendar_today</span>
<div className="flex flex-col">
<span className="text-[10px] uppercase text-gray-400 font-bold tracking-wider leading-none">Data Inicial</span>
<input className="bg-transparent border-none p-0 h-auto text-sm font-semibold text-forest-dark dark:text-white focus:ring-0 w-24" type="text" value="01 Out 2023" />
</div>
</div>
<div className="flex items-center gap-2 bg-[#f8fcf9] dark:bg-white/5 border border-[#cfe7d7] dark:border-white/10 rounded-lg px-4 py-2.5">
<span className="material-symbols-outlined text-gray-400 text-[20px]">event</span>
<div className="flex flex-col">
<span className="text-[10px] uppercase text-gray-400 font-bold tracking-wider leading-none">Data Final</span>
<input className="bg-transparent border-none p-0 h-auto text-sm font-semibold text-forest-dark dark:text-white focus:ring-0 w-24" type="text" value="31 Out 2023" />
</div>
</div>
<button className="bg-primary hover:bg-green-600 text-white font-bold rounded-lg px-6 py-2 transition-colors shadow-lg shadow-green-500/20 flex items-center justify-center gap-2">
<span className="material-symbols-outlined">download</span>
                            Exportar
                        </button>
</div>
</div>
</div>
{/* KPI Stats Cards */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
{/* Stat 1 */}
<div className="bg-white dark:bg-white/5 rounded-xl p-6 border border-[#cfe7d7] dark:border-white/5 shadow-sm flex flex-col justify-between relative overflow-hidden group">
<div className="metric-card-icon group">
<span className="material-symbols-outlined text-6xl text-primary">payments</span>
</div>
<div>
<p className="text-gray-500 dark:text-gray-400 font-medium text-sm uppercase tracking-wide">Total de Comissoes</p>
<h3 className="text-3xl display-number text-shadow-strong text-forest-dark dark:text-white mt-2">R$ 4.250,00</h3>
</div>
<div className="mt-4 flex items-center gap-2">
<span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold px-2 py-1 rounded-full flex items-center">
<span className="material-symbols-outlined text-[14px] mr-1">trending_up</span> +12%
                        </span>
<span className="text-gray-400 text-sm">vs mes passado</span>
</div>
</div>
{/* Stat 2 */}
<div className="bg-white dark:bg-white/5 rounded-xl p-6 border border-[#cfe7d7] dark:border-white/5 shadow-sm flex flex-col justify-between relative overflow-hidden group">
<div className="metric-card-icon group">
<span className="material-symbols-outlined text-6xl text-gold-accent">shopping_bag</span>
</div>
<div>
<p className="text-gray-500 dark:text-gray-400 font-medium text-sm uppercase tracking-wide">Vendas de Produtos</p>
<h3 className="text-3xl display-number text-shadow-strong text-gold-accent mt-2">R$ 850,00</h3>
</div>
<div className="mt-4 flex items-center gap-2">
<span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold px-2 py-1 rounded-full flex items-center">
<span className="material-symbols-outlined text-[14px] mr-1">trending_up</span> +5%
                        </span>
<span className="text-gray-400 text-sm">vs mes passado</span>
</div>
</div>
{/* Stat 3 */}
<div className="bg-white dark:bg-white/5 rounded-xl p-6 border border-[#cfe7d7] dark:border-white/5 shadow-sm flex flex-col justify-between relative overflow-hidden group">
<div className="metric-card-icon group">
<span className="material-symbols-outlined text-6xl text-primary">content_cut</span>
</div>
<div>
<p className="text-gray-500 dark:text-gray-400 font-medium text-sm uppercase tracking-wide">Total de Agendamentos</p>
<h3 className="text-3xl display-number text-shadow-strong text-forest-dark dark:text-white mt-2">42</h3>
</div>
<div className="mt-4 flex items-center gap-2">
<span className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold px-2 py-1 rounded-full flex items-center">
<span className="material-symbols-outlined text-[14px] mr-1">trending_down</span> -2%
                        </span>
<span className="text-gray-400 text-sm">vs mes passado</span>
</div>
</div>
</div>
{/* Charts Section */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
{/* Receita Bar Chart */}
<div className="lg:col-span-2 bg-white dark:bg-white/5 rounded-xl p-6 border border-[#cfe7d7] dark:border-white/5 shadow-sm">
<div className="flex items-center justify-between mb-8">
<h3 className="text-lg font-bold text-forest-dark dark:text-white flex items-center gap-2">
<span className="material-symbols-outlined text-primary">bar_chart</span>
                            Detalhe Mensal de Receita
                        </h3>
<div className="flex gap-4 text-sm">
<div className="flex items-center gap-2">
<span className="size-3 rounded-full bg-primary"></span>
<span className="text-gray-500 dark:text-gray-400">Servicos</span>
</div>
<div className="flex items-center gap-2">
<span className="size-3 rounded-full bg-gold-accent"></span>
<span className="text-gray-500 dark:text-gray-400">Produtos</span>
</div>
</div>
</div>
{/* CSS Bar Chart Simulation */}
<div className="h-64 flex items-end justify-between gap-2 sm:gap-4 md:gap-8 px-2">
{/* Semana 1 */}
<div className="flex flex-col justify-end w-full group relative h-full">
<div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-forest-dark text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">R$ 1.200,00</div>
<div className="w-full bg-gold-accent/80 dark:bg-gold-accent/70 rounded-t-sm h-[20%] relative"></div>
<div className="w-full bg-primary rounded-t-sm h-[40%]"></div>
<p className="text-center text-xs text-gray-400 mt-2">Semana 1</p>
</div>
{/* Semana 2 */}
<div className="flex flex-col justify-end w-full group relative h-full">
<div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-forest-dark text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">R$ 1.450,00</div>
<div className="w-full bg-gold-accent/80 dark:bg-gold-accent/70 rounded-t-sm h-[15%]"></div>
<div className="w-full bg-primary rounded-t-sm h-[55%]"></div>
<p className="text-center text-xs text-gray-400 mt-2">Semana 2</p>
</div>
{/* Semana 3 */}
<div className="flex flex-col justify-end w-full group relative h-full">
<div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-forest-dark text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">R$ 1.680,00</div>
<div className="w-full bg-gold-accent/80 dark:bg-gold-accent/70 rounded-t-sm h-[25%]"></div>
<div className="w-full bg-primary rounded-t-sm h-[65%]"></div>
<p className="text-center text-xs text-gray-400 mt-2">Semana 3</p>
</div>
{/* Semana 4 */}
<div className="flex flex-col justify-end w-full group relative h-full">
<div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-forest-dark text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">R$ 1.350,00</div>
<div className="w-full bg-gold-accent/80 dark:bg-gold-accent/70 rounded-t-sm h-[10%]"></div>
<div className="w-full bg-primary rounded-t-sm h-[50%]"></div>
<p className="text-center text-xs text-gray-400 mt-2">Semana 4</p>
</div>
</div>
</div>
{/* Right Column: Gauge & Ratings */}
<div className="flex flex-col gap-6">
{/* Retention Gauge */}
<div className="bg-white dark:bg-white/5 rounded-xl p-6 border border-[#cfe7d7] dark:border-white/5 shadow-sm flex flex-col items-center justify-center relative">
<h3 className="text-lg font-bold text-forest-dark dark:text-white self-start mb-4">Retencao de Clientees</h3>
<div className="relative size-40">
{/* Simple CSS Gauge using conic-gradient */}
<div className="size-full rounded-full" style={{ background: "conic-gradient(#11d452 85%, #f3f4f6 0)" }}></div>
<div className="absolute inset-2 bg-white dark:bg-[#152a1e] rounded-full flex flex-col items-center justify-center">
<span className="text-3xl display-number text-shadow-strong text-forest-dark dark:text-white">85%</span>
<span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Retorno</span>
</div>
</div>
<p className="text-center text-sm text-gray-500 mt-4 px-4">Otimo trabalho! Sua taxa de retencao esta entre as 10% melhores do salao.</p>
</div>
{/* Ratings */}
<div className="bg-white dark:bg-white/5 rounded-xl p-6 border border-[#cfe7d7] dark:border-white/5 shadow-sm">
<div className="flex justify-between items-center mb-4">
<h3 className="text-lg font-bold text-forest-dark dark:text-white">Avaliacao de Feedback</h3>
<div className="flex items-center gap-1 text-gold-accent">
<span className="text-2xl font-bold text-forest-dark dark:text-white mr-2">4.9</span>
<span className="material-symbols-outlined icon-filled">star</span>
<span className="material-symbols-outlined icon-filled">star</span>
<span className="material-symbols-outlined icon-filled">star</span>
<span className="material-symbols-outlined icon-filled">star</span>
<span className="material-symbols-outlined icon-filled">star_half</span>
</div>
</div>
<p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Baseado em 124 avaliacoes</p>
<div className="w-full h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
<div className="h-full bg-primary w-[95%]"></div>
</div>
<div className="flex justify-between text-xs text-gray-400 mt-1">
<span>0</span>
<span>5.0</span>
</div>
</div>
</div>
</div>
{/* Recent Servicos Table */}
<div className="bg-white dark:bg-white/5 rounded-xl border border-[#cfe7d7] dark:border-white/5 shadow-sm overflow-hidden">
<div className="p-6 border-b border-[#cfe7d7] dark:border-white/10 flex justify-between items-center">
<h3 className="text-lg font-bold text-forest-dark dark:text-white">Recent Servicos Performed</h3>
<button className="text-primary text-sm font-bold hover:underline">Ver Todos</button>
</div>
<div className="overflow-x-auto">
<table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
<thead className="bg-[#f8fcf9] dark:bg-white/5 text-xs uppercase text-gray-700 dark:text-gray-300 font-semibold">
<tr>
<th className="px-6 py-4 rounded-tl-lg">Data</th>
<th className="px-6 py-4">Cliente</th>
<th className="px-6 py-4">Servico</th>
<th className="px-6 py-4 text-right">Receita</th>
<th className="px-6 py-4 text-right rounded-tr-lg">Comissao</th>
</tr>
</thead>
<tbody className="divide-y divide-[#cfe7d7] dark:divide-white/10">
<tr className="hover:bg-[#f6f8f6] dark:hover:bg-white/5 transition-colors">
<td className="px-6 py-4 font-medium text-forest-dark dark:text-white">24 Out 2023</td>
<td className="px-6 py-4 flex items-center gap-3">
<div className="size-8 rounded-full bg-cover bg-center" data-alt="Avatar da cliente Sarah J" style={{ backgroundImage: "url(\"https://lh3.googleusercontent.com/aida-public/AB6AXuDZjkg5QdZtah3EVGfvtdxSNpRKWGV5F5tEzMLxoosKWfCuGtz8WOawt3iLwg0Ke8c99ThHHA0P-kdHRKWLtXbFWdbfZfHCiqHzehpUo9YtPivjCyYA1WNCevbTUoFieo2J7zVNWZOJEtkl7iMZTwPfnXKVc05TqcAfw85ewrhQnpZmwo_4dmnUdxk1b0cqaYstGpPP82aoprO9qBoF5Gvp9M8qGORnO34n9M6YjxRMs8W3CIriYnGNMZ0o5wI9Fxz2xZgwmHI93Js\")" }}></div>
                                    Sarah J.
                                </td>
<td className="px-6 py-4">
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                        Balayage Completo
                                    </span>
</td>
<td className="px-6 py-4 text-right font-semibold text-forest-dark dark:text-white">R$ 350,00</td>
<td className="px-6 py-4 text-right font-bold text-primary">R$ 105,00</td>
</tr>
<tr className="hover:bg-[#f6f8f6] dark:hover:bg-white/5 transition-colors">
<td className="px-6 py-4 font-medium text-forest-dark dark:text-white">24 Out 2023</td>
<td className="px-6 py-4 flex items-center gap-3">
<div className="size-8 rounded-full bg-cover bg-center" data-alt="Avatar da cliente Michelle K" style={{ backgroundImage: "url(\"https://lh3.googleusercontent.com/aida-public/AB6AXuDqv9n4DOoZshwTnUqMJRjn47_imCIvymNX9_t0mkWzMP3pAZdXx3QKZ2o0hjrtuHChmS9M0EkiHTqNohYKmoP49L9i7qJCRvztAYAGvzYnF6CgRKlILRgaMdoq36V8JCJCz27AmHtMFrtsa7DeoLiHZUUS04_EpJkkR7elo8-QBQbFkelL-MxpmwfLHFDyBeMHrh8GihWT_0Tgu3_qqXKcIYnouwUXxcjkp3yYud3YisASDK1H-Y7B348FcDNXg8UqnBGYE-uBMd0\")" }}></div>
                                    Michelle K.
                                </td>
<td className="px-6 py-4">
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                                        Corte e Estilo
                                    </span>
</td>
<td className="px-6 py-4 text-right font-semibold text-forest-dark dark:text-white">R$ 85,00</td>
<td className="px-6 py-4 text-right font-bold text-primary">R$ 25,50</td>
</tr>
<tr className="hover:bg-[#f6f8f6] dark:hover:bg-white/5 transition-colors">
<td className="px-6 py-4 font-medium text-forest-dark dark:text-white">23 Out 2023</td>
<td className="px-6 py-4 flex items-center gap-3">
<div className="size-8 rounded-full bg-cover bg-center" data-alt="Avatar do cliente David L" style={{ backgroundImage: "url(\"https://lh3.googleusercontent.com/aida-public/AB6AXuCzDb-khmMtSQ35cXYXqsuoqAgAFx2iYnKKkTOHl7uCcHLOAMilI0GZwdkOn1jcBkHpxscrjIl4CZ3uO3dwZP6K7ACFOmuF7FL47UNwf2OKk-IlmHGcLXFwoMWu1cw5JgJRtY7ckTC5s4tiRaLr5HiC3hYbvjU9lWpN7O4v81mDYoa6u0FF9RYrx0eoYE3fcTMnXn7J0wevfkFK1nV9n5fJ0v4nrnj3--gcV4vut3rUdqOsjK0gNgIBwUojpdQmqLvdsARrDYEWKs\")" }}></div>
                                    David L.
                                </td>
<td className="px-6 py-4">
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                                        Produto: Oleo Marroquino
                                    </span>
</td>
<td className="px-6 py-4 text-right font-semibold text-forest-dark dark:text-white">R$ 45,00</td>
<td className="px-6 py-4 text-right font-bold text-gold-accent">R$ 4,50</td>
</tr>
<tr className="hover:bg-[#f6f8f6] dark:hover:bg-white/5 transition-colors">
<td className="px-6 py-4 font-medium text-forest-dark dark:text-white">23 Out 2023</td>
<td className="px-6 py-4 flex items-center gap-3">
<div className="size-8 rounded-full bg-cover bg-center" data-alt="Avatar da cliente Emily R" style={{ backgroundImage: "url(\"https://lh3.googleusercontent.com/aida-public/AB6AXuCyl1j8VDTGkaiOBUbO1DrBDDZpaRJvzoQA4wXzI_XOpSP-0Rp3uqYVRpDAC81q0FqD01zR4ZPNMkmfd6OTvrkZFYY8xdLE_Novbfb9W10On26hmVGuE_DaY81GVPNbzT3VNtBI0vajlznO7NPFjrD6ljtUp4qE3U0hfE_88byawmfvBRkU6Pfq9MX-2Qrese2Hp22rqXQLZ77zkLxEqxICO0GpEM4KhgOvDXUzK2__yCUx0JRxC5sCRSvMyPIJZsFBb9W5zFyFhU\")" }}></div>
                                    Emily R.
                                </td>
<td className="px-6 py-4">
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                        Correcao de Cor
                                    </span>
</td>
<td className="px-6 py-4 text-right font-semibold text-forest-dark dark:text-white">R$ 450,00</td>
<td className="px-6 py-4 text-right font-bold text-primary">R$ 135,00</td>
</tr>
</tbody>
</table>
</div>
</div>

    </>
  );
};

