import type { ReactElement } from "react";
import { useBranding } from "../branding.runtime";

export const ConciergeWidgetSection = (): ReactElement => {
  const branding = useBranding();

  return (
    <div id="concierge-chat-wrapper" className="fixed bottom-4 right-4 z-[70] flex flex-col items-end gap-3">
      <div
        id="concierge-panel"
        className="hidden w-[92vw] max-w-sm bg-forest text-white rounded-2xl shadow-2xl border border-gold/50 overflow-hidden"
      >
        <div className="bg-forest/90 border-b border-gold/20 p-4 flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gold">{`Concierge ${branding.shortName}`}</p>
            <p className="text-xs text-white/70">Online agora</p>
          </div>
          <button id="concierge-close" className="text-white/70 hover:text-white text-xl leading-none" type="button" aria-label="Fechar chat">
            ×
          </button>
        </div>
        <div id="concierge-body" className="p-4 space-y-3 bg-[#0f2418] h-72 overflow-y-auto scrollbar-hide"></div>
        <div id="concierge-options" className="p-3 border-t border-gold/20 bg-forest flex flex-wrap gap-2"></div>
      </div>
      <button
        id="concierge-toggle"
        className="w-12 h-12 rounded-full bg-gold text-forest flex items-center justify-center shadow-lg hover:scale-110 transition duration-300 border-2 border-white"
        type="button"
        aria-label="Abrir concierge"
      >
        <span className="material-symbols-outlined text-xl">chat</span>
      </button>
    </div>
  );
};

