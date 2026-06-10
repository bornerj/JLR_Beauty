import { useEffect, useMemo, useState } from "react";
import {
  AUTH_STATE_EVENT,
  clearAuth,
  getUser,
  requestLoginModal,
  type AuthUser,
} from "../../../lib/auth";

const ROLE_LABELS: Record<string, string> = {
  MASTER: "Master",
  ADMIN: "Administrador",
  MANAGER: "Gerente",
  PROFESSIONAL: "Profissional",
  CLIENT: "Cliente",
};

type AuthStateChangeEvent = CustomEvent<AuthUser | null>;

type UseAuthStatusResult = {
  isLoggedIn: boolean;
  roleLabel: string;
  user: AuthUser | null;
  openLoginModal: () => void;
  logout: () => void;
};

export const useAuthStatus = (): UseAuthStatusResult => {
  const [user, setUser] = useState<AuthUser | null>(() => getUser());

  useEffect(() => {
    const syncFromStorage = (): void => {
      setUser(getUser());
    };
    const onStorage = (event: StorageEvent): void => {
      if (event.key && event.key !== "jlr_user") return;
      syncFromStorage();
    };
    const onAuthStateEvent = (event: Event): void => {
      const authEvent = event as AuthStateChangeEvent;
      if (typeof authEvent.detail === "undefined") {
        syncFromStorage();
        return;
      }
      setUser(authEvent.detail);
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(AUTH_STATE_EVENT, onAuthStateEvent as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(AUTH_STATE_EVENT, onAuthStateEvent as EventListener);
    };
  }, []);

  const roleLabel = useMemo((): string => {
    if (!user) return "";
    return ROLE_LABELS[user.role] || user.role;
  }, [user]);

  const openLoginModal = (): void => {
    const openLogin = (window as typeof window & { openLoginModal?: () => void }).openLoginModal;
    if (openLogin) {
      openLogin();
      return;
    }
    requestLoginModal();
    window.location.href = "/";
  };

  const logout = (): void => {
    clearAuth();
    requestLoginModal();
    window.location.href = "/";
  };

  return {
    user,
    roleLabel,
    isLoggedIn: Boolean(user),
    openLoginModal,
    logout,
  };
};
