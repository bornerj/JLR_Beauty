import type { ReactElement } from "react";
import { useBranding } from "../branding.runtime";

export const FranquiasContactSection = (): ReactElement => {
  const branding = useBranding();

  return (
    <>
    {/* Contact Form Section */}
    <div className="bg-forest py-24 text-white" id="contact">
        <div className="mx-auto max-w-[800px] px-6">
            <div className="mb-12 text-center">
                <span className="mb-4 inline-flex items-center justify-center rounded-full bg-primary/20 p-3 text-primary">
                    <span className="material-symbols-outlined">handshake</span>
                </span>
                <h2 className="display-hero text-shadow-strong mb-4 text-4xl md:text-5xl">Seja um Parceiro</h2>
                <p className="text-lg text-white/70">Preencha o formulario abaixo para receber nosso dossiê completo de
                    franquias.</p>
            </div>
            <form className="space-y-6 rounded-2xl bg-white/5 p-8 shadow-2xl backdrop-blur-sm md:p-12">
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/90" htmlFor="name">Nome Completo</label>
                        <input className="w-full rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:border-primary focus:bg-white/20 focus:outline-none focus:ring-1 focus:ring-primary" id="name" placeholder="Jane Doe" type="text" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/90" htmlFor="email">Endereço de Email</label>
                        <input className="w-full rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:border-primary focus:bg-white/20 focus:outline-none focus:ring-1 focus:ring-primary" id="email" placeholder="jane@example.com" type="email" />
                    </div>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/90" htmlFor="phone">Número de Telefone</label>
                        <input className="w-full rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:border-primary focus:bg-white/20 focus:outline-none focus:ring-1 focus:ring-primary" id="phone" placeholder="+55 (11) 99999-9999" type="tel" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/90" htmlFor="city">Cidade de Interesse</label>
                        <input className="w-full rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:border-primary focus:bg-white/20 focus:outline-none focus:ring-1 focus:ring-primary" id="city" placeholder="Sao Paulo, SP" type="text" />
                    </div>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/90" htmlFor="investment">Capacidade de
                            Investimento</label>
                        <select className="w-full rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-white focus:border-primary focus:bg-white/20 focus:outline-none focus:ring-1 focus:ring-primary [&>option]:text-forest" id="investment">
                            <option disabled value="">Selecione uma opcao</option>
                            <option value="200-400">R$ 200.000,00 - R$ 400.000,00</option>
                            <option value="400-800">R$ 400.000,00 - R$ 800.000,00</option>
                            <option value="800+">R$ 800.000,00 +</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/90" htmlFor="funding-source">Origem dos
                            Recursos</label>
                        <select className="w-full rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-white focus:border-primary focus:bg-white/20 focus:outline-none focus:ring-1 focus:ring-primary [&>option]:text-forest" id="funding-source">
                            <option disabled value="">Selecione a fonte principal...</option>
                            <option value="savings">Poupanca Pessoal</option>
                            <option value="loan">Emprestimo Bancario</option>
                            <option value="investors">Investidores Privados</option>
                            <option value="liquidation">Liquidacao de Ativos</option>
                        </select>
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-2 border-b border-white/10">
                        <span className="material-symbols-outlined text-primary">pin_drop</span>
                        <h3 className="text-lg font-semibold text-white">Detalhes da Localização</h3>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-white/90" htmlFor="location-address">Endereço / Região de
                                Interesse</label>
                            <input className="w-full rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:border-primary focus:bg-white/20 focus:outline-none focus:ring-1 focus:ring-primary" id="location-address" placeholder="Ex: Av. da Liberdade, Lisboa" type="text" />
                        </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/90" htmlFor="property-type">Tipo de Imovel</label>
                        <select className="w-full rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-white focus:border-primary focus:bg-white/20 focus:outline-none focus:ring-1 focus:ring-primary [&>option]:text-forest" id="property-type">
                            <option disabled value="">Selecione o tipo</option>
                            <option value="shopping">Shopping Center</option>
                            <option value="street">Loja de Rua</option>
                            <option value="mall">Galeria / Mall</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/90" htmlFor="franchise-choice">Franquia Escolhida</label>
                        <input className="w-full rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:border-primary focus:bg-white/20 focus:outline-none focus:ring-1 focus:ring-primary" id="franchise-choice" placeholder="Selecione um modelo acima" type="text" readOnly />
                    </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-white/90" htmlFor="location-justification">Justificativa
                                da Escolha da Localidade</label>
                            <p className="text-xs text-white/60">{`Explique por que esta localizacao e estrategica para a marca ${branding.fullName}.`}</p>
                            <textarea className="w-full min-h-[120px] rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:border-primary focus:bg-white/20 focus:outline-none focus:ring-1 focus:ring-primary resize-y" id="location-justification" placeholder="A regiao possui alto fluxo de pessoas..."></textarea>
                        </div>
                    </div>
                </div>
                <div className="pt-4">
                    <button className="flex w-full items-center justify-center rounded-lg bg-primary py-4 text-base font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:scale-[1.01]" type="button">
                        Seja um Franqueado
                    </button>
                    <p className="mt-4 text-center text-xs text-white/40">Ao enviar este formulário, você concorda com nossa
                        política de privacidade.</p>
                </div>
            </form>
        </div>
    </div>
    </>
  );
};
