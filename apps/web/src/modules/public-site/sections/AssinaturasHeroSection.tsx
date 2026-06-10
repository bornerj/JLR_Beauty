import type { ReactElement } from "react";
import { useMediaSlot } from "../media.runtime";

export const AssinaturasHeroSection = (): ReactElement => {
  const heroBackgroundImage = useMediaSlot("assinaturas_hero_bg_01");
  const heroCardImage01 = useMediaSlot("assinaturas_hero_card_img_01");
  const heroCardImage02 = useMediaSlot("assinaturas_hero_card_img_02");
  const heroCardImage03 = useMediaSlot("assinaturas_hero_card_img_03");

  return (
    <header className="relative w-full h-screen min-h-[760px] overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div
          className="w-full h-full bg-cover bg-center bg-no-repeat transition-transform duration-[20s] hover:scale-105"
          style={{ backgroundImage: `url(${heroBackgroundImage})` }}
        ></div>
      </div>
      <div className="relative z-20 h-full max-w-[1440px] mx-auto px-6 lg:px-12 pt-32 md:pt-36 pb-16 md:pb-20 flex flex-col">
        <div className="w-full h-full flex flex-col justify-end pb-12">
          <div className="w-full">
            <h1 className="text-6xl md:text-7xl display-hero text-shadow-strong text-primary leading-tight mb-6">
              Viva seu melhor <span className="gold-gradient-text">Estilo!</span>
            </h1>
          </div>
          <div className="w-full lg:w-[38%] xl:w-[34%]">
            <p className="text-white text-lg md:text-xl leading-relaxed">
              <span className="block">
                Aqui está a solução para conseguir cuidar da sua autoestima em meio à sua rotina super corrida!
              </span>
              <span className="block mt-1">
                Garanta um visual de alto padrão com um valor fixo mensal que custa menos do que três visitas avulsas!
              </span>
              <span className="block mt-1">assinantes têm acesso a horários exclusivos e agendamento prioritário via app.</span>
            </p>
          </div>
        </div>
        <div className="mt-auto relative -top-8 md:-top-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 w-full">
            <article className="rounded-2xl border border-gold/20 bg-white/10 backdrop-blur-md p-1.5 md:p-2 text-white h-full">
              <div className="flex items-center gap-1.5">
                <div className="shrink-0 w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-xl bg-black/25 border border-gold/20 overflow-hidden">
                  <img src={heroCardImage01} alt="Plano de assinatura" className="h-full w-full object-cover object-center scale-[1.45]" />
                </div>
                <div className="min-w-0 flex-1 flex flex-col justify-center">
                  <h3 className="text-xl md:text-base font-semibold text-gold mb-0.5">Assine e Economize</h3>
                  <p className="text-xs md:text-sm text-white/90 leading-tight">
                    Assine um de nossos planos e use <b>Ilimitadamente</b> nossos serviços
                  </p>
                </div>
              </div>
            </article>
            <article className="rounded-2xl border border-gold/20 bg-white/10 backdrop-blur-md p-1.5 md:p-2 text-white h-full">
              <div className="flex items-center gap-1.5">
                <div className="shrink-0 w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-xl bg-black/25 border border-gold/20 overflow-hidden">
                  <img src={heroCardImage02} alt="Plano de assinatura" className="h-full w-full object-cover object-center scale-[1.45]" />
                </div>
                <div className="min-w-0 flex-1 flex flex-col justify-center">
                  <h3 className="text-sm md:text-base font-semibold text-gold  mb-0.5">Agende e Visite</h3>
                  <p className="text-xs md:text-sm text-white/90 leading-tight">
                    Agende seu horário facilmente utilizando nosso aplicativo e venha nos visitar
                  </p>
                </div>
              </div>
            </article>
            <article className="rounded-2xl border border-gold/20 bg-white/10 backdrop-blur-md p-1.5 md:p-2 text-white h-full">
              <div className="flex items-center gap-1.5">
                <div className="shrink-0 w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-xl bg-black/25 border border-gold/20 overflow-hidden">
                  <img src={heroCardImage03} alt="Plano de assinatura" className="h-full w-full object-cover object-center scale-[1.45]" />
                </div>
                <div className="min-w-0 flex-1 flex flex-col justify-center">
                  <h3 className="text-sm md:text-base font- text-gold mb-0.5">Pronto !!</h3>
                  <p className="text-xs md:text-sm text-white/90 leading-tight">Aproveite o seu momento e fique pronta em até 60 min!</p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
    </header>
  );
};
