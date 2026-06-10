import type { ReactElement } from "react";

type HomeMembershipSectionProps = {
  title?: string;
};

export const HomeMembershipSection = ({
  title = "Quer fazer uma Assinatura e Economizar?",
}: HomeMembershipSectionProps): ReactElement => {
  return (
    <>
    {/* Assinaturas */} 
    <section className="py-24 px-6 bg-champagne dark:bg-[#1a2e22]" id="membership">
        <div className="max-w-[1440px] mx-auto">
            <div className="text-center mb-16 max-w-2xl mx-auto">
                <h2 className="text-gold text-sm display-label mb-3">Assinaturas
                    Exclusivas</h2>
                <h3 className="text-4xl md:text-5xl display-hero text-shadow-strong text-forest dark:text-white leading-tight mb-6">
                    {title}
                </h3>
                <p className="text-forest/70 dark:text-gray-300 text-lg">Escolha o plano
                    que melhor se adapta ao seu estilo
                    de vida e desfrute de benefícios exclusivos, descontos e experiências premium.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start" data-membership-grid>
                <div className="bg-white dark:bg-forest border border-champagne-dark dark:border-white/10 rounded-2xl p-8 hover:shadow-2xl hover:shadow-gold/10 transition-all duration-300 transform hover:-translate-y-2 relative group h-full flex flex-col">
                    <div className="mb-6">
                        <span className="inline-block py-1 px-3 bg-gray-100 dark:bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-300 mb-4">Silver</span>
                        <h4 className="display-title text-shadow-strong text-3xl text-forest dark:text-white mb-2">Radiance</h4>
                        <p className="text-gold font-bold text-xl">R$ 99,00 <span className="text-sm text-gray-400 font-normal">/ mês</span></p>
                    </div>
                    <ul className="space-y-4 mb-10 flex-grow">
                        <li className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-gold text-lg mt-0.5">check_circle</span>
                            <span className="text-forest/80 dark:text-gray-300 text-sm">10% de desconto em serviços</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-gold text-lg mt-0.5">check_circle</span>
                            <span className="text-forest/80 dark:text-gray-300 text-sm">Acesso antecipado a agenda</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-gold text-lg mt-0.5">check_circle</span>
                            <span className="text-forest/80 dark:text-gray-300 text-sm">Tratamento capilar mensal</span>
                        </li>
                    </ul>
                    <button className="w-full py-4 rounded-lg bg-forest text-white hover:bg-primary hover:text-forest font-bold uppercase tracking-widest text-xs transition-colors mt-auto" type="button" data-membership-join data-membership-name="Silver" data-membership-title="Radiance">
                        Entrar no Clube
                    </button>
                </div>
                <div className="bg-white dark:bg-forest border-2 border-gold rounded-2xl p-8 shadow-xl shadow-gold/10 transform scale-105 z-10 relative h-full flex flex-col">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gold text-white text-xs font-bold uppercase px-4 py-1 rounded-full tracking-widest">
                        Mais Popular</div>
                    <div className="mb-6">
                        <span className="inline-block py-1 px-3 bg-gold/10 rounded-full text-xs font-bold uppercase tracking-widest text-gold mb-4">Gold</span>
                        <h4 className="display-title text-shadow-strong text-3xl text-forest dark:text-white mb-2">Luminosity</h4>
                        <p className="text-gold font-bold text-xl">R$ 189,00 <span className="text-sm text-gray-400 font-normal">/ mês</span></p>
                    </div>
                    <ul className="space-y-4 mb-10 flex-grow">
                        <li className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-gold text-lg mt-0.5">verified</span>
                            <span className="text-forest/80 dark:text-gray-300 text-sm font-medium">15% de desconto em todos
                                os serviços</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-gold text-lg mt-0.5">verified</span>
                            <span className="text-forest/80 dark:text-gray-300 text-sm">Priority booking garantido</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-gold text-lg mt-0.5">verified</span>
                            <span className="text-forest/80 dark:text-gray-300 text-sm">Facial mensal gratuito</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-gold text-lg mt-0.5">verified</span>
                            <span className="text-forest/80 dark:text-gray-300 text-sm">Presente de aniversário
                                exclusivo</span>
                        </li>
                    </ul>
                    <button className="w-full py-4 rounded-lg bg-forest text-white hover:bg-primary hover:text-forest font-bold uppercase tracking-widest text-xs transition-colors mt-auto" type="button" data-membership-join data-membership-name="Gold" data-membership-title="Luminosity">
                        Entrar no Clube
                    </button>
                </div>
                <div className="bg-white dark:bg-forest border border-champagne-dark dark:border-white/10 rounded-2xl p-8 hover:shadow-2xl hover:shadow-gold/10 transition-all duration-300 transform hover:-translate-y-2 relative h-full flex flex-col">
                    <div className="mb-6">
                        <span className="inline-block py-1 px-3 bg-gray-100 dark:bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-300 mb-4">Platinum</span>
                        <h4 className="display-title text-shadow-strong text-3xl text-forest dark:text-white mb-2">Ethereal</h4>
                        <p className="text-gold font-bold text-xl">R$ 299,00 <span className="text-sm text-gray-400 font-normal">/ mês</span></p>
                    </div>
                    <ul className="space-y-4 mb-10 flex-grow">
                        <li className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-gold text-lg mt-0.5">diamond</span>
                            <span className="text-forest/80 dark:text-gray-300 text-sm">20% de desconto ilimitado</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-gold text-lg mt-0.5">diamond</span>
                            <span className="text-forest/80 dark:text-gray-300 text-sm">Massagem corporal mensal</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-gold text-lg mt-0.5">diamond</span>
                            <span className="text-forest/80 dark:text-gray-300 text-sm">Serviço de concierge dedicado</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-gold text-lg mt-0.5">diamond</span>
                            <span className="text-forest/80 dark:text-gray-300 text-sm">Convites para eventos VIP</span>
                        </li>
                    </ul>
                    <button className="w-full py-4 rounded-lg bg-forest text-white hover:bg-primary hover:text-forest font-bold uppercase tracking-widest text-xs transition-colors mt-auto" type="button" data-membership-join data-membership-name="Platinum" data-membership-title="Ethereal">
                        Entrar no Clube
                    </button>
                </div>
            </div>
        </div>
    </section>
    <div className="fixed inset-0 z-[70] hidden items-center justify-center bg-black/40 backdrop-blur-sm px-3" data-membership-subscribe-modal aria-hidden="true">
        <div className="w-full max-w-md sm:max-w-lg rounded-2xl border border-[#cfe7d1] bg-white p-5 sm:p-6 shadow-2xl relative">
            <button className="absolute right-4 top-4 text-forest/60 hover:text-forest transition-colors" type="button" data-membership-subscribe-close aria-label="Fechar">
                <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="text-xl font-bold text-forest mb-1">Entrar no Clube</h3>
            <p className="text-sm text-stone-500 mb-4">Complete seus dados para iniciar sua assinatura.</p>
            <form className="grid grid-cols-1 gap-3" data-membership-subscribe-form>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Plano</label>
                    <select className="appearance-none w-full bg-[#f6f8f6] border border-[#cfe7d1] text-forest-green py-2.5 pl-3 pr-9 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body text-xs cursor-pointer hover:bg-white transition-colors" data-membership-subscribe-plan required>
                        <option value="">Selecione um plano</option>
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Nome</label>
                    <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" type="text" data-membership-subscribe-name required />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Email</label>
                    <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" type="email" data-membership-subscribe-email required />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Telefone</label>
                    <input className="w-full border border-[#cfe7d1] rounded-lg px-3 py-2 bg-[#f6f8f6] text-forest-green" type="text" data-membership-subscribe-phone required />
                </div>
                <p className="hidden text-xs text-red-600" data-membership-subscribe-error></p>
                <div className="mt-1 flex items-center justify-end gap-3">
                    <button className="px-4 py-2 rounded-lg border border-[#cfe7d1] text-forest-green hover:bg-[#f6f8f6] transition-colors text-xs" type="button" data-membership-subscribe-close>Cancelar</button>
                    <button className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition-colors text-xs disabled:opacity-60" type="submit" data-membership-subscribe-save>Continuar para pagamento</button>
                </div>
            </form>
        </div>
    </div>
    </>
  );
};

