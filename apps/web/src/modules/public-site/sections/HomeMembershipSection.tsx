import type { ReactElement } from "react";
import { usePageText } from "../pageTexts.runtime";
import { RichText } from "../../../components/ui/RichText";

export const HomeMembershipSection = (): ReactElement => {
  const label      = usePageText("home.membership.label");
  const title      = usePageText("home.membership.title");
  const subtitle   = usePageText("home.membership.subtitle");
  const emptyState = usePageText("home.membership.empty_state");

  return (
    <>
    {/* Assinaturas */}
    <section className="py-24 px-6 bg-champagne dark:bg-[#1a2e22]" id="membership">
        <div className="max-w-[1440px] mx-auto">
            <div className="text-center mb-16 max-w-2xl mx-auto">
                <h2 className="text-gold text-sm display-label mb-3"><RichText value={label} /></h2>
                <h3 className="text-4xl md:text-5xl display-hero text-shadow-strong text-forest dark:text-white leading-tight mb-6">
                    <RichText value={title} />
                </h3>
                <p className="text-forest/70 dark:text-gray-300 text-lg"><RichText value={subtitle} /></p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start" data-membership-grid>
                {/* Fallback genérico — sem plano/preço fictício, ver PLAN-0034 achado #6 / DECISION-018.
                    Substituído em runtime por renderMembershipsFromDb() (index.behavior.ts) quando há
                    >=3 planos reais cadastrados em Cadastros > Assinaturas. */}
                <p className="col-span-1 md:col-span-3 text-center text-sm text-forest/70 dark:text-gray-300 py-10">
                    <RichText value={emptyState} />
                </p>
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
