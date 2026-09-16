import { useEffect, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { confirmEmail } from "../../lib/auth";

/** Segunda metade do fluxo de verificação de e-mail: lê `?token=` e confirma via API. */
export default function ConfirmarEmailContent() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [status, setStatus] = useState<"loading" | "success" | "error">(token ? "loading" : "error");
  const [message, setMessage] = useState<string>(
    token ? "" : "Link inválido — falta o token de confirmação."
  );
  const attempted = useRef(false);

  useEffect(() => {
    if (!token || attempted.current) return;
    attempted.current = true;
    confirmEmail(token)
      .then(() => {
        setStatus("success");
        setMessage("E-mail confirmado com sucesso.");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Falha ao confirmar e-mail.");
      });
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-light px-4 dark:bg-background-dark">
      <div className="w-full max-w-sm rounded-2xl border border-forest/10 bg-white p-6 text-center shadow-2xl dark:border-white/10 dark:bg-[#0f1f16]">
        <h1 className="mb-2 text-2xl font-bold text-forest dark:text-white">Confirmação de e-mail</h1>

        {status === "loading" && <p className="text-sm text-forest/60 dark:text-white/60">Confirmando...</p>}
        {status === "success" && <p className="text-sm font-semibold text-green-600">{message}</p>}
        {status === "error" && <p className="text-sm font-semibold text-red-600">{message}</p>}

        <p className="mt-5 text-xs text-forest/60 dark:text-white/60">
          <Link to="/" className="text-primary hover:underline">
            Voltar para o início
          </Link>
        </p>
      </div>
    </div>
  );
}
