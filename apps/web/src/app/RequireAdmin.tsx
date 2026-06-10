import { type ReactElement, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { fetchMe, getToken, requestAccessDeniedNotice, requestLoginModal } from "../lib/auth";

type GuardState = "loading" | "allowed" | "denied";

export default function RequireAdmin({ children }: { children: ReactElement }) {
  const hasToken = Boolean(getToken());
  const [state, setState] = useState<GuardState>(hasToken ? "loading" : "denied");

  useEffect(() => {
    if (!hasToken) {
      requestLoginModal();
      return;
    }

    let active = true;
    fetchMe()
      .then((user) => {
        if (!active) return;
        if (user.role === "ADMIN" || user.role === "MASTER") {
          setState("allowed");
        } else {
          requestAccessDeniedNotice();
          setState("denied");
        }
      })
      .catch(() => {
        if (!active) return;
        requestLoginModal();
        setState("denied");
      });

    return () => {
      active = false;
    };
  }, [hasToken]);

  if (state === "loading") {
    return <div className="min-h-screen bg-background-light dark:bg-background-dark" />;
  }

  if (state === "denied") {
    return <Navigate to="/" replace />;
  }

  return children;
}
