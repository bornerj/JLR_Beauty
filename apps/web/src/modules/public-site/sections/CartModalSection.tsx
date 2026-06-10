import type { ReactElement } from "react";

export const CartModalSection = (): ReactElement => {
  return (
    <div
      className="fixed inset-0 z-[60] hidden bg-black/40 backdrop-blur-sm transition-opacity duration-300"
      id="cart-modal"
    >
      <div className="absolute inset-0" id="cart-backdrop"></div>
      <div className="absolute inset-y-0 right-0 w-full max-w-md flex flex-col bg-cream-sidebar dark:bg-[#1a2e22] shadow-2xl transform transition-transform duration-300 ease-in-out border-l border-gold-accent/30">
        <div className="px-6 py-5 border-b border-gold-accent/20 flex items-center justify-between bg-white/50 dark:bg-black/10">
          <h2 className="text-xl display-hero text-forest-green dark:text-white">
            Sacola de Compras (<span data-cart-count>0</span>)
          </h2>
          <button
            className="text-gray-500 hover:text-forest-green dark:hover:text-white transition-colors"
            id="close-cart"
            type="button"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="px-6 py-4 bg-[#f0f4f1] dark:bg-[#152b1e]">
          <p className="text-xs font-medium text-center text-forest-green dark:text-gray-300 mb-2" data-cart-freeship-text>
            Gaste <span className="font-bold" data-cart-free-shipping-remaining>R$ 150,00</span> a mais para frete gratis
          </p>
          <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
            <div className="bg-forest-green h-full rounded-full w-0 transition-all duration-300" data-cart-free-shipping-progress></div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide p-6 space-y-6" data-cart-items>
          <p className="text-sm text-center text-forest/70 dark:text-gray-300 py-6" data-cart-empty>
            Seu carrinho está vazio.
          </p>
        </div>
        <div className="border-t border-gold-accent/30 bg-white/60 dark:bg-black/20 p-6 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
              <span className="font-bold text-forest-green dark:text-white" data-cart-subtotal>
                R$ 0,00
              </span>
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500">
              <span>Entrega</span>
              <span>Calculado na finalização</span>
            </div>
          </div>
          <button
            className="w-full bg-forest-green hover:bg-[#1a3523] text-gold-accent h-12 rounded font-bold uppercase tracking-wider text-sm transition-all shadow-lg flex items-center justify-center gap-2"
            type="button"
            data-cart-pay-now
          >
            Pagar agora
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
          <p className="text-[10px] text-center text-gray-400">Finalização segura com Stripe</p>
        </div>
      </div>
    </div>
  );
};

