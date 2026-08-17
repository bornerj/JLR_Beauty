import { type ReactElement, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  fetchMe,
  getToken,
  refreshAccessToken,
  requestAccessDeniedNotice,
  requestLoginModal,
} from "../lib/auth";

type GuardState = "loading" | "allowed" | "denied";

export default function RequireAdmin({ children }: { children: ReactElement }) {
  const [state, setState] = useState<GuardState>("loading");

  useEffect(() => {
    let active = true;

    const guard = async () => {
      // Se o access token local ja expirou mas o refresh cookie (7 dias) ainda
      // e valido (ex.: aba ficou fechada/suspensa por >15min), tenta renovar
      // silenciosamente antes de mandar pro login.
      let token = getToken();
      if (!token) {
        const renewed = await refreshAccessToken();
        if (!active) return;
        token = renewed ? getToken() : null;
      }

      if (!token) {
        requestLoginModal();
        setState("denied");
        return;
      }

      try {
        const user = await fetchMe();
        if (!active) return;
        if (user.role === "ADMIN" || user.role === "MASTER") {
          setState("allowed");
        } else {
          requestAccessDeniedNotice();
          setState("denied");
        }
      } catch {
        if (!active) return;
        requestLoginModal();
        setState("denied");
      }
    };

    guard();

    return () => {
      active = false;
    };
  }, []);

  if (state === "loading") {
    return <div className="min-h-screen bg-background-light dark:bg-background-dark" />;
  }

  if (state === "denied") {
    return <Navigate to="/" replace />;
  }

  return children;
}
