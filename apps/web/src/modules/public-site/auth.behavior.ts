import { AUTH_STATE_EVENT, getUser, type AuthUser } from "../../lib/auth";

const emitAuthStateChanged = (user: AuthUser | null): void => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<AuthUser | null>(AUTH_STATE_EVENT, {
      detail: user,
    })
  );
};

export function setAuthNavUser(user: AuthUser | null): void {
  emitAuthStateChanged(user);
}

export function initAuthNav(): () => void {
  emitAuthStateChanged(getUser());
  return () => {};
}

export function initDbStatusLed(): () => void {
  return () => {};
}

if (typeof window !== "undefined") {
  (window as unknown as { __initAuthNav?: () => void }).__initAuthNav = initAuthNav;
}
