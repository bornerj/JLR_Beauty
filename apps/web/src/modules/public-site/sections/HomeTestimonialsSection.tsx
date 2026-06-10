import type { ReactElement } from "react";
import { useBranding } from "../branding.runtime";
import { useMediaSlot } from "../media.runtime";

export const HomeTestimonialsSection = (): ReactElement => {
  const branding = useBranding();
  const testimonialAvatar01 = useMediaSlot("home_testimonials_avatar_01");
  const testimonialAvatar02 = useMediaSlot("home_testimonials_avatar_02");
  const testimonialAvatar03 = useMediaSlot("home_testimonials_avatar_03");
  const testimonialAvatar04 = useMediaSlot("home_testimonials_avatar_04");

  return (
    <>
    <section className="py-24 px-6 bg-background-light dark:bg-background-dark" id="testimonials">
        <div className="max-w-[1440px] mx-auto">
            <div className="flex flex-col items-center text-center gap-4 mb-12">
                <div className="h-10 w-auto text-primary">
                    <img alt={branding.fullName} className="brand-img" src={branding.logoUrl} />
                </div>
                <p className="text-gold text-xs uppercase tracking-[0.3em]">Depoimentos</p>
                <h3 className="text-2xl md:text-3xl display-hero text-shadow-strong leading-tight text-forest dark:text-white">
                    Experiências reais, resultados inesquecíveis
                </h3>
                <p className="text-sm md:text-base text-forest/70 dark:text-gray-300 max-w-2xl">
                    Quatro histórias que refletem o cuidado, o luxo e a transformação que entregamos em cada atendimento.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <figure className="rounded-2xl border border-forest/10 dark:border-white/10 bg-white/80 dark:bg-white/5 p-6 shadow-sm">
                    <blockquote className="text-sm text-forest/80 dark:text-gray-300 leading-relaxed">
                        {`"${branding.fullName} não é apenas um salão, é um botão de reinício para todo o seu ser. Atendimento impecável."`}
                    </blockquote>
                    <figcaption className="mt-6 flex items-center gap-3">
                        <div className="size-12 rounded-full overflow-hidden border border-primary/40">
                            <img alt="Retrato de Sarah Jenkins" className="w-full h-full object-cover" data-alt="Retrato de mulher sorridente" src={testimonialAvatar01} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-forest dark:text-white">Sarah Jenkins</p>
                            <p className="text-xs uppercase tracking-wider text-gold">Editora da Vogue</p>
                        </div>
                    </figcaption>
                </figure>
                <figure className="rounded-2xl border border-forest/10 dark:border-white/10 bg-white/80 dark:bg-white/5 p-6 shadow-sm">
                    <blockquote className="text-sm text-forest/80 dark:text-gray-300 leading-relaxed">
                        "O cuidado com cada detalhe transforma o ritual em um momento de calma. Resultado visível desde a primeira visita."
                    </blockquote>
                    <figcaption className="mt-6 flex items-center gap-3">
                        <div className="size-12 rounded-full overflow-hidden border border-primary/40">
                            <img alt="Retrato de Luiza Martins" className="w-full h-full object-cover" data-alt="Retrato de mulher com cabelo ondulado" src={testimonialAvatar02} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-forest dark:text-white">Luiza Martins</p>
                            <p className="text-xs uppercase tracking-wider text-gold">Diretora Criativa</p>
                        </div>
                    </figcaption>
                </figure>
                <figure className="rounded-2xl border border-forest/10 dark:border-white/10 bg-white/80 dark:bg-white/5 p-6 shadow-sm">
                    <blockquote className="text-sm text-forest/80 dark:text-gray-300 leading-relaxed">
                        "Saio sempre renovado. A equipe entendeu exatamente o que eu queria e o resultado ficou sofisticado."
                    </blockquote>
                    <figcaption className="mt-6 flex items-center gap-3">
                        <div className="size-12 rounded-full overflow-hidden border border-primary/40">
                            <img alt="Retrato de Marcos Nogueira" className="w-full h-full object-cover" data-alt="Retrato de homem sorridente" src={testimonialAvatar03} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-forest dark:text-white">Marcos Nogueira</p>
                            <p className="text-xs uppercase tracking-wider text-gold">Consultor de Imagem</p>
                        </div>
                    </figcaption>
                </figure>
                <figure className="rounded-2xl border border-forest/10 dark:border-white/10 bg-white/80 dark:bg-white/5 p-6 shadow-sm">
                    <blockquote className="text-sm text-forest/80 dark:text-gray-300 leading-relaxed">
                        "Produtos premium, atendimento elegante e um clima de spa verdadeiro. Um refugo de luxo no meio da cidade."
                    </blockquote>
                    <figcaption className="mt-6 flex items-center gap-3">
                        <div className="size-12 rounded-full overflow-hidden border border-primary/40">
                            <img alt="Retrato de Ana Ribeiro" className="w-full h-full object-cover" data-alt="Retrato de mulher com pele iluminada" src={testimonialAvatar04} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-forest dark:text-white">Ana Ribeiro</p>
                            <p className="text-xs uppercase tracking-wider text-gold">Empresária</p>
                        </div>
                    </figcaption>
                </figure>
            </div>
        </div>
    </section>
    </>
  );
};

