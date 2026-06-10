import type { ReactElement } from "react";
import { useMediaSlot } from "../media.runtime";

export const FranquiasModelsSection = (): ReactElement => {
  const modelCardImage01 = useMediaSlot("franquias_models_card_img_01");
  const modelCardImage02 = useMediaSlot("franquias_models_card_img_02");
  const modelCardImage03 = useMediaSlot("franquias_models_card_img_03");

  return (
    <>
    {/* Franchise Models Section */}
    <div className="bg-background-light py-24 dark:bg-zinc-900" id="models">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-10">
            <div className="mb-16 text-center">
                <span className="mb-2 block text-sm font-bold uppercase tracking-widest text-primary">Escolha Seu
                    Caminho</span>
                <h2 className="display-hero text-shadow-strong text-4xl text-forest dark:text-white md:text-5xl">Modelos de
                    Franquia</h2>
                <p className="mx-auto mt-4 max-w-2xl text-lg text-forest/70 dark:text-white/70 text-balance">
                    Oportunidades de investimento sob medida para atender diferentes mercados e ambições.
                </p>
            </div>
            <div className="grid gap-8 lg:grid-cols-3">
                {/* Studio Model */}
                <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-lg transition-all hover:-translate-y-2 hover:shadow-xl dark:bg-background-dark dark:border dark:border-white/5">
                    <div className="relative h-64 overflow-hidden">
                        <div
                          className="h-full w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                          data-alt="Modern compact bright salon studio interior with mirrors"
                          style={{ backgroundImage: `url(${modelCardImage01})` }}
                        >
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        <div className="absolute bottom-4 left-6">
                            <h3 className="text-2xl font-bold text-white">Esmalteria</h3>
                            <p className="text-sm font-medium text-white/90">Compacto e Boutique</p>
                        </div>
                    </div>
                    <div className="flex flex-1 flex-col p-8">
                        <div className="mb-6">
                            <p className="text-sm text-forest/60 dark:text-white/60 mb-1">Investimento Inicial</p>
                            <p className="text-3xl display-number text-shadow-strong text-gold">R$ 200.000,00</p>
                        </div>
                        <ul className="mb-8 space-y-3 flex-1">
                            <li className="flex items-start gap-3 text-sm text-forest/80 dark:text-white/80">
                                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                                <span>Investimento de Entrada</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-forest/80 dark:text-white/80">
                                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                                <span>Area compacta de 40-60m2</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-forest/80 dark:text-white/80">
                                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                                <span>Ideal para areas de alto fluxo</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-forest/80 dark:text-white/80">
                                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                                <span>Equipe enxuta de 3-5 pessoas</span>
                            </li>
                        </ul>
                        <button className="mt-auto w-full rounded-lg border border-forest/10 bg-forest/5 py-3 text-sm font-bold text-forest transition-colors hover:bg-primary hover:text-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-primary" data-franquia="Esmalteria" type="button">Ver Detalhes</button>
                    </div>
                </div>
                {/* Standard Model */}
                <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-gold/50 transition-all hover:-translate-y-2 hover:shadow-xl dark:bg-background-dark">
                    <div className="absolute top-4 right-4 z-10 rounded-full bg-gold px-3 py-1 text-xs font-bold text-white uppercase tracking-wider">
                        Mais Popular</div>
                    <div className="relative h-64 overflow-hidden">
                        <div
                          className="h-full w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                          data-alt="Salao elegante e amplo com varias estacoes e iluminacao aconchegante"
                          style={{ backgroundImage: `url(${modelCardImage02})` }}
                        >
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        <div className="absolute bottom-4 left-6">
                            <h3 className="text-2xl font-bold text-white">Padrao</h3>
                            <p className="text-sm font-medium text-white/90">Salao Completo</p>
                        </div>
                    </div>
                    <div className="flex flex-1 flex-col p-8">
                        <div className="mb-6">
                            <p className="text-sm text-forest/60 dark:text-white/60 mb-1">Investimento Inicial</p>
                            <p className="text-3xl display-number text-shadow-strong text-gold">R$ 450.000,00</p>
                        </div>
                        <ul className="mb-8 space-y-3 flex-1">
                            <li className="flex items-start gap-3 text-sm text-forest/80 dark:text-white/80">
                                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                                <span>Menu de serviços completo</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-forest/80 dark:text-white/80">
                                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                                <span>Area padrao de 80-120m2</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-forest/80 dark:text-white/80">
                                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                                <span>Locais premium em shoppings</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-forest/80 dark:text-white/80">
                                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                                <span>8-12 profissionais</span>
                            </li>
                        </ul>
                        <button className="mt-auto w-full rounded-lg bg-forest py-3 text-sm font-bold text-white transition-colors hover:bg-primary dark:bg-primary dark:text-forest dark:hover:bg-white" data-franquia="Padrao" type="button">
                            Selecionar Padrao
                        </button>
                    </div>
                </div>
                {/* Flagship Model */}
                <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-lg transition-all hover:-translate-y-2 hover:shadow-xl dark:bg-background-dark dark:border dark:border-white/5">
                    <div className="relative h-64 overflow-hidden">
                        <div
                          className="h-full w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                          data-alt="Large luxurious spa reception area with marble floors and high ceilings"
                          style={{ backgroundImage: `url(${modelCardImage03})` }}
                        >
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        <div className="absolute bottom-4 left-6">
                            <h3 className="text-2xl font-bold text-white">Principal</h3>
                            <p className="text-sm font-medium text-white/90">Experiencia maxima de luxo</p>
                        </div>
                    </div>
                    <div className="flex flex-1 flex-col p-8">
                        <div className="mb-6">
                            <p className="text-sm text-forest/60 dark:text-white/60 mb-1">Investimento Inicial</p>
                            <p className="text-3xl display-number text-shadow-strong text-gold">R$ 900.000,00</p>
                        </div>
                        <ul className="mb-8 space-y-3 flex-1">
                            <li className="flex items-start gap-3 text-sm text-forest/80 dark:text-white/80">
                                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                                <span>Presenca iconica na rua</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-forest/80 dark:text-white/80">
                                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                                <span>Area ampla de 150m2+</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-forest/80 dark:text-white/80">
                                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                                <span>Zonas exclusivas de spa</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-forest/80 dark:text-white/80">
                                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                                <span>20+ especialistas</span>
                            </li>
                        </ul>
                        <button className="mt-auto w-full rounded-lg border border-forest/10 bg-forest/5 py-3 text-sm font-bold text-forest transition-colors hover:bg-primary hover:text-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-primary" data-franquia="Principal" type="button">Ver Detalhes</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    </>
  );
};
