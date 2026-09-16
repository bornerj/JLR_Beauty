import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { confirmPasswordReset } from "../../lib/auth";

/**
 * ERR-0094 — segunda metade do fluxo de "esqueci minha senha": página que recebe o token
 * (`?token=...`, o link enviado por `POST /auth/forgot-password`) e conclui a troca via
 * `POST /auth/reset-password`. Depende de SMTP configurado pro link chegar de verdade; sem
 * isso, o token existe no banco mas ninguém recebe o e-mail (achado documentado, não
 * corrigido aqui — fora do escopo de UI).
 */
export default function RedefinirSenhaContent() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    if (!token) {
      setError("Link inválido — falta o token de redefinição.");
      return;
    }
    if (password.length < 8) {
      setError("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    setSubmitting(true);
    try {
      const message = await confirmPasswordReset(token, password);
      setSuccess(message);
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao redefinir a senha.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-light px-4 dark:bg-background-dark">
      <div className="w-full max-w-sm rounded-2xl border border-forest/10 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#0f1f16]">
        <h1 className="mb-2 text-2xl font-bold text-forest dark:text-white">Redefinir senha</h1>
        <p className="mb-5 text-xs text-forest/60 dark:text-white/60">
          Escolha uma nova senha para a sua conta.
        </p>

        {!token && (
          <p className="mb-4 text-xs font-semibold text-red-600">
            Link inválido — abra o link de redefinição enviado por e-mail.
          </p>
        )}

        <div className="space-y-3">
          <input
            type="password"
            placeholder="Nova senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={!token || submitting}
            className="w-full rounded-lg border border-[#cfe7d1] bg-[#f6f8f6] px-4 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
          <input
            type="password"
            placeholder="Confirmar nova senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={!token || submitting}
            className="w-full rounded-lg border border-[#cfe7d1] bg-[#f6f8f6] px-4 py-2 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
          {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
          {success && <p className="text-xs font-semibold text-green-600">{success}</p>}
        </div>

        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={!token || submitting}
          className="mt-4 w-full rounded-lg bg-primary py-2 text-sm font-bold uppercase tracking-wider text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Salvando…" : "Redefinir senha"}
        </button>

        <p className="mt-4 text-center text-xs text-forest/60 dark:text-white/60">
          <Link to="/" className="text-primary hover:underline">
            Voltar para o início
          </Link>
        </p>
      </div>
    </div>
  );
}
