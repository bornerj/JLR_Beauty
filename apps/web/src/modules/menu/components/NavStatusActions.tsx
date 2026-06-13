import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuthStatus } from "../hooks/useAuthStatus";

type NavStatusActionsProps = {
  mobileMenuTrigger?: ReactNode;
};

export default function NavStatusActions({ mobileMenuTrigger }: NavStatusActionsProps) {
  const { user, roleLabel, isLoggedIn, openLoginModal, logout } = useAuthStatus();

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <button id="open-cart" className="nav-circle" type="button" aria-label="Abrir carrinho">
        <span id="open-cart-icon" className="material-symbols-outlined text-[20px] text-forest">
          shopping_cart
        </span>
        <span className="pulse-dot" aria-hidden="true"></span>
      </button>
      <Link className="nav-circle nav-circle-admin-desktop" to="/admin" aria-label="Administrador">
        <span className="material-symbols-outlined text-[20px] text-forest">
          admin_panel_settings
        </span>
      </Link>

      {!isLoggedIn ? (
        <>
          {mobileMenuTrigger}
          <button
            className="hidden sm:inline-flex px-4 py-2 rounded-full border border-forest/20 text-forest text-xs font-bold uppercase tracking-widest hover:bg-forest/10 transition-colors"
            type="button"
            onClick={openLoginModal}
            data-auth-login-button
          >
            Entrar
          </button>
          <button
            className="nav-circle sm:hidden"
            type="button"
            aria-label="Entrar"
            onClick={openLoginModal}
            data-auth-login-button
          >
            <span className="material-symbols-outlined text-[20px] text-forest">person</span>
          </button>
        </>
      ) : (
        <>
          <div className="hidden sm:flex items-center gap-3 pl-2" data-auth-user-block>
            <div className="text-right leading-tight">
              <p className="text-sm font-semibold text-forest" data-auth-user-name>
                {user?.name || "Usuario"}
              </p>
              <p className="text-xs text-forest/60" data-auth-user-role>
                {roleLabel}
              </p>
            </div>
            <div className="relative flex items-center gap-1">
              <img
                className="h-10 w-10 rounded-full object-cover border border-forest/10"
                src={user?.avatarUrl || "/images/about_img1.webp"}
                alt={user?.name ? `Usuario ${user.name}` : "Usuario logado"}
                data-auth-user-avatar
              />
              <span className="material-symbols-outlined text-forest/60 text-base">expand_more</span>
            </div>
          </div>
          {mobileMenuTrigger}
          <button
            className="nav-circle"
            type="button"
            aria-label="Sair"
            onClick={logout}
            data-auth-logout
          >
            <span className="material-symbols-outlined text-[20px] text-forest">logout</span>
          </button>
        </>
      )}

    </div>
  );
}
