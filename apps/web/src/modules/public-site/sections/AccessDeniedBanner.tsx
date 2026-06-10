import type { ReactElement } from "react";

export const AccessDeniedBanner = (): ReactElement => {
  return (
    <div className="hidden max-w-[1200px] mx-auto px-6 pt-4" data-access-denied-banner>
      <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 shadow-sm">
        <span className="material-symbols-outlined text-lg mt-0.5">lock</span>
        <div className="flex-1">
          <p className="text-sm font-semibold">Acesso restrito</p>
          <p className="text-xs text-red-600">
            Sua conta não tem permissão para acessar o painel administrativo.
          </p>
        </div>
        <button
          className="text-red-500 hover:text-red-700 transition-colors"
          type="button"
          aria-label="Fechar aviso"
          data-access-denied-close
        >
          <span className="material-symbols-outlined text-base">close</span>
        </button>
      </div>
    </div>
  );
};

