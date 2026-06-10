import type { ReactElement } from "react";

type AuthWindow = Window & {
  closeAuthModal?: (id: string) => void;
  switchToSignup?: () => void;
  switchToLogin?: () => void;
};

export const AuthModalsSection = (): ReactElement => {
  const authWindow = window as AuthWindow;

  return (
    <>
      <div id="loginModal" className="fixed inset-0 z-[60] hidden bg-black/40 backdrop-blur-sm transition-opacity duration-300">
        <div className="absolute inset-0" id="login-backdrop"></div>
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#0f1f16] border border-forest/10 dark:border-white/10 rounded-2xl shadow-2xl p-6 relative">
            <button
              onClick={() => authWindow.closeAuthModal?.("loginModal")}
              className="absolute top-3 right-3 text-forest/60 dark:text-white/60 hover:text-forest dark:hover:text-white transition"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
            <h3 className="text-2xl font-bold text-forest dark:text-white mb-2">Entrar</h3>
            <p className="text-xs text-forest/60 dark:text-white/60 mb-5">Acesse sua conta para continuar.</p>
            <div className="space-y-3">
              <input
                type="email"
                placeholder="E-mail"
                data-auth-login-email
                className="w-full bg-[#f6f8f6] dark:bg-white/5 border border-[#cfe7d1] dark:border-white/10 rounded-lg px-4 py-2 text-sm text-forest dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="relative">
                <input
                  type="password"
                  placeholder="Senha"
                  data-auth-login-password
                  className="w-full bg-[#f6f8f6] dark:bg-white/5 border border-[#cfe7d1] dark:border-white/10 rounded-lg px-4 py-2 pr-10 text-sm text-forest dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-forest/60 dark:text-white/60 hover:text-forest dark:hover:text-white transition"
                  data-auth-toggle="login"
                  type="button"
                  aria-label="Mostrar senha"
                >
                  <span className="material-symbols-outlined text-lg">visibility</span>
                </button>
              </div>
              <p className="hidden text-xs text-red-600" data-auth-login-error></p>
              <p className="hidden text-xs text-green-600" data-auth-login-success></p>
            </div>
            <button
              className="w-full mt-4 bg-primary text-white py-2 text-sm font-bold uppercase tracking-wider rounded-lg"
              data-auth-login-submit
            >
              Entrar
            </button>
            <div className="flex items-center gap-3 my-4">
              <span className="flex-1 h-px bg-forest/10 dark:bg-white/10"></span>
              <span className="text-[10px] text-forest/50 dark:text-white/50 uppercase tracking-widest">ou</span>
              <span className="flex-1 h-px bg-forest/10 dark:bg-white/10"></span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button className="border border-forest/10 dark:border-white/10 text-forest dark:text-white py-2 text-xs rounded-lg hover:border-primary">
                Google
              </button>
              <button className="border border-forest/10 dark:border-white/10 text-forest dark:text-white py-2 text-xs rounded-lg hover:border-primary">
                Facebook
              </button>
            </div>
            <p className="text-xs text-forest/60 dark:text-white/60 mt-4">
              Não tem cadastro?
              <button onClick={() => authWindow.switchToSignup?.()} className="text-primary hover:underline ml-1">
                Criar conta
              </button>
            </p>
          </div>
        </div>
      </div>

      <div id="signupModal" className="fixed inset-0 z-[60] hidden bg-black/40 backdrop-blur-sm transition-opacity duration-300">
        <div className="absolute inset-0" id="signup-backdrop"></div>
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#0f1f16] border border-forest/10 dark:border-white/10 rounded-2xl shadow-2xl p-6 relative">
            <button
              onClick={() => authWindow.closeAuthModal?.("signupModal")}
              className="absolute top-3 right-3 text-forest/60 dark:text-white/60 hover:text-forest dark:hover:text-white transition"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
            <h3 className="text-2xl font-bold text-forest dark:text-white mb-2">Criar conta</h3>
            <p className="text-xs text-forest/60 dark:text-white/60 mb-5">Complete seus dados para se cadastrar.</p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Nome completo"
                data-auth-register-name
                className="w-full bg-[#f6f8f6] dark:bg-white/5 border border-[#cfe7d1] dark:border-white/10 rounded-lg px-4 py-2 text-sm text-forest dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <input
                type="email"
                placeholder="E-mail"
                data-auth-register-email
                className="w-full bg-[#f6f8f6] dark:bg-white/5 border border-[#cfe7d1] dark:border-white/10 rounded-lg px-4 py-2 text-sm text-forest dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="relative">
                <input
                  type="password"
                  placeholder="Senha"
                  data-auth-register-password
                  className="w-full bg-[#f6f8f6] dark:bg-white/5 border border-[#cfe7d1] dark:border-white/10 rounded-lg px-4 py-2 pr-10 text-sm text-forest dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-forest/60 dark:text-white/60 hover:text-forest dark:hover:text-white transition"
                  data-auth-toggle="register"
                  type="button"
                  aria-label="Mostrar senha"
                >
                  <span className="material-symbols-outlined text-lg">visibility</span>
                </button>
              </div>
              <p className="hidden text-xs text-red-600" data-auth-register-error></p>
              <p className="hidden text-xs text-green-600" data-auth-register-success></p>
              <input
                type="date"
                className="w-full bg-[#f6f8f6] dark:bg-white/5 border border-[#cfe7d1] dark:border-white/10 rounded-lg px-4 py-2 text-sm text-forest dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <input
                type="text"
                placeholder="Cidade"
                className="w-full bg-[#f6f8f6] dark:bg-white/5 border border-[#cfe7d1] dark:border-white/10 rounded-lg px-4 py-2 text-sm text-forest dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <input
                type="text"
                placeholder="Bairro"
                className="w-full bg-[#f6f8f6] dark:bg-white/5 border border-[#cfe7d1] dark:border-white/10 rounded-lg px-4 py-2 text-sm text-forest dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <button
              className="w-full mt-4 bg-primary text-white py-2 text-sm font-bold uppercase tracking-wider rounded-lg"
              data-auth-register-submit
            >
              Cadastrar
            </button>
            <div className="flex items-center gap-3 my-4">
              <span className="flex-1 h-px bg-forest/10 dark:bg-white/10"></span>
              <span className="text-[10px] text-forest/50 dark:text-white/50 uppercase tracking-widest">ou</span>
              <span className="flex-1 h-px bg-forest/10 dark:bg-white/10"></span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button className="border border-forest/10 dark:border-white/10 text-forest dark:text-white py-2 text-xs rounded-lg hover:border-primary">
                Google
              </button>
              <button className="border border-forest/10 dark:border-white/10 text-forest dark:text-white py-2 text-xs rounded-lg hover:border-primary">
                Facebook
              </button>
            </div>
            <p className="text-xs text-forest/60 dark:text-white/60 mt-4">
              Já tem conta?
              <button onClick={() => authWindow.switchToLogin?.()} className="text-primary hover:underline ml-1">
                Entrar
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
