const API_URL = import.meta.env.VITE_API_URL || "";

type ApiErrorPayload = {
  message?: string;
  detail?: string;
};

export const parseApiError = async (response: Response): Promise<string> => {
  const payload = (await response.json().catch(() => ({}))) as ApiErrorPayload;
  return payload.detail || payload.message || "Falha ao processar solicitacao.";
};

export const fetchChatbotPublicJson = async <T>(path: string): Promise<T | null> => {
  try {
    const response = await fetch(`${API_URL}/api${path}`);
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
};

export const postChatbotPublicJson = async <T>(
  path: string,
  body: unknown
): Promise<{ ok: boolean; data?: T; error?: string }> => {
  try {
    const response = await fetch(`${API_URL}/api${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const error = await parseApiError(response);
      return { ok: false, error };
    }
    const data = (await response.json().catch(() => ({}))) as T;
    return { ok: true, data };
  } catch {
    return { ok: false, error: "Falha de conexao com o servidor." };
  }
};
