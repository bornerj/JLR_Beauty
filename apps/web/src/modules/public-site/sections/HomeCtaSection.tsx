import type { ReactElement } from "react";
import { Link } from "react-router-dom";

export const HomeCtaSection = (): ReactElement => {
  return (
    <>
    {/* CTA Agendamento */}
    <section className="py-12 px-6">
        <div className="w-full rounded-3xl border border-gold-accent/60 bg-[#0f2418] dark:bg-[#0b1811] overflow-hidden relative">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_rgba(197,160,89,0.4),_transparent_60%)]"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-12 md:p-16 gap-6">
                <div className="max-w-2xl">
                    <p className="text-gold text-xs uppercase tracking-[0.35em] mb-3">Convite Exclusivo</p>
                    <h2 className="text-3xl md:text-4xl display-hero text-gold mb-4">Transforme seu autocuidado em rotina, não em luxo</h2>
                    <p className="text-gold/80 text-lg font-light">Entre para o nosso clube VIP e tenha prioridade na agenda com a economia que você sempre quis</p>
                </div>
                <Link className="shrink-0 h-14 px-10 rounded-full border border-gold-accent text-gold hover:bg-gold-accent/15 hover:text-gold transition-all duration-300 text-sm font-semibold uppercase tracking-[0.3em] inline-flex items-center justify-center" to="/assinaturas">
                    ASSINE JÁ !
                </Link>
            </div>
        </div>
    </section>
    </>
  );
};

