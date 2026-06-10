import type { ReactElement } from "react";
import { useMediaSlot } from "../media.runtime";

export const FranquiasVisionSection = (): ReactElement => {
  const visionImage = useMediaSlot("franquias_vision_img_01");

  return (
    <>
    {/* Editorial / Vision Section */}
    <div className="relative bg-cream-dark py-24 dark:bg-background-dark" id="vision">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-10">
            <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
                <div className="order-2 lg:order-1">
                    <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                        <div
                          className="aspect-[4/5] w-full bg-cover bg-center transition-transform duration-700 hover:scale-105"
                          data-alt="Close de produtos de beleza sobre mesa de mármore com detalhes dourados"
                          style={{ backgroundImage: `url(${visionImage})` }}
                        >
                        </div>
                        <div className="absolute -bottom-10 -right-10 z-10 hidden h-64 w-64 rounded-full border-[1px] border-gold/30 bg-forest p-8 lg:flex items-center justify-center">
                            <p className="text-center display-quote text-xl text-gold">"Beleza não é apenas um
                                serviço, é uma experiência arquitetônica."</p>
                        </div>
                    </div>
                </div>
                <div className="order-1 flex flex-col justify-center lg:order-2">
                    <div className="mb-4 flex items-center gap-2">
                        <div className="h-px w-12 bg-gold"></div>
                        <span className="text-sm font-bold uppercase tracking-widest text-gold">A Visão</span>
                    </div>
                    <h2 className="mb-8 text-4xl display-hero text-shadow-strong leading-tight text-forest dark:text-white md:text-5xl">
                        Mais que um salão, um santuário de autocuidado.
                    </h2>
                    <div className="space-y-6 text-lg font-light leading-relaxed text-forest/80 dark:text-white/80">
                        <p>
                            <span className="float-left mr-3 text-6xl display-title text-shadow-strong leading-[0.8] text-primary">J</span>LR
                            Beauty combina tecnologia de beleza de ponta com elegância atemporal para criar uma
                            experiência inesquecível para cada cliente. Acreditamos que o verdadeiro luxo está nos
                            detalhes - do calor da nossa iluminação à precisão dos nossos tratamentos.
                        </p>
                        <p>
                            Ser nosso parceiro significa entrar em um legado de excelência. Não apenas construímos
                            salões; criamos ambientes onde a confiança floresce. Nossos conceitos arquitetônicos são
                            premiados, pensados para serem funcionais para a equipe e transcendentes para os clientes.
                        </p>
                    </div>
                    <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
                        <div className="flex flex-col gap-2 border-l border-forest/10 pl-4 dark:border-white/10">
                            <span className="text-3xl display-number text-shadow-strong text-gold">10+</span>
                            <span className="text-sm font-medium uppercase tracking-wider text-forest/60 dark:text-white/60">Anos
                                de Liderança</span>
                        </div>
                        <div className="flex flex-col gap-2 border-l border-forest/10 pl-4 dark:border-white/10">
                            <span className="text-3xl display-number text-shadow-strong text-gold">50+</span>
                            <span className="text-sm font-medium uppercase tracking-wider text-forest/60 dark:text-white/60">Unidades
                                no Mundo</span>
                        </div>
                        <div className="flex flex-col gap-2 border-l border-forest/10 pl-4 dark:border-white/10">
                            <span className="text-3xl display-number text-shadow-strong text-gold">98%</span>
                            <span className="text-sm font-medium uppercase tracking-wider text-forest/60 dark:text-white/60">Satisfação
                                dos Parceiros</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    </>
  );
};
