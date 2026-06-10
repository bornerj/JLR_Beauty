import { resolveUploadedAssetUrl } from "./assetUrls";

const API_URL = import.meta.env.VITE_API_URL || "";

const TOKEN_KEY = "jlr_token";
const USER_KEY = "jlr_user";
const LOGIN_FLAG_KEY = "jlr_open_login";
const ACCESS_DENIED_KEY = "jlr_access_denied";
export const AUTH_STATE_EVENT = "jlr:auth-state-changed";
const TOKEN_EXPIRY_SKEW_SECONDS = 30;

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
};

type AuthResponse = {
  token: string;
  user: AuthUser;
};

const normalizeAuthUser = (user: AuthUser): AuthUser => ({
  ...user,
  avatarUrl: resolveUploadedAssetUrl(user.avatarUrl) || null,
});

const messageMap: Record<string, string> = {
  "dados invalidos": "Dados inválidos",
  "credenciais invalidas": "Credenciais inválidas",
  "usuario nao cadastrado": "Usuário não cadastrado",
  "senha incorreta": "Senha incorreta",
  "erro interno no servidor": "Erro interno no servidor",
  "email ja cadastrado": "E-mail já cadastrado",
  "senha fraca: use 8+ caracteres com maiuscula, minuscula, numero e caractere especial":
    "Senha fraca: use 8+ caracteres com maiúscula, minúscula, número e caractere especial",
  "usuario nao encontrado": "Usuário não encontrado",
  "conteudo nao encontrado": "Conteúdo não encontrado",
  "nao autorizado": "Não autorizado",
  "token invalido": "Token inválido",
  "acesso negado": "Acesso negado",
  "falha na requisicao": "Falha na requisição",
};

const normalizeMessage = (raw: string) => {
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();
  if (messageMap[lower]) return messageMap[lower];
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

type JwtLikePayload = {
  exp?: number;
};

const decodeBase64Url = (value: string): string => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  return globalThis.atob(padded);
};

const parseJwtPayload = (token: string): JwtLikePayload | null => {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const decoded = decodeBase64Url(parts[1]);
    const payload = JSON.parse(decoded) as JwtLikePayload;
    return payload && typeof payload === "object" ? payload : null;
  } catch {
    return null;
  }
};

const isTokenExpired = (token: string): boolean => {
  const payload = parseJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") return true;
  const nowSeconds = Date.now() / 1000;
  return payload.exp <= nowSeconds + TOKEN_EXPIRY_SKEW_SECONDS;
};

const notifyAuthStateChanged = (user: AuthUser | null): void => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<AuthUser | null>(AUTH_STATE_EVENT, {
      detail: user,
    })
  );
};

export function getToken() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  if (isTokenExpired(token)) {
    clearAuth();
    return null;
  }
  return token;
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  notifyAuthStateChanged(null);
}

export function setUser(user: AuthUser) {
  const normalizedUser = normalizeAuthUser(user);
  localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
  notifyAuthStateChanged(normalizedUser);
}

export function getUser(): AuthUser | null {
  if (!getToken()) return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return normalizeAuthUser(JSON.parse(raw) as AuthUser);
  } catch {
    return null;
  }
}

export function requestLoginModal() {
  localStorage.setItem(LOGIN_FLAG_KEY, "1");
}

export function consumeLoginRequest() {
  const value = localStorage.getItem(LOGIN_FLAG_KEY);
  if (value) localStorage.removeItem(LOGIN_FLAG_KEY);
  return value === "1";
}

export function requestAccessDeniedNotice() {
  localStorage.setItem(ACCESS_DENIED_KEY, "1");
}

export function consumeAccessDeniedNotice() {
  const value = localStorage.getItem(ACCESS_DENIED_KEY);
  if (value) localStorage.removeItem(ACCESS_DENIED_KEY);
  return value === "1";
}

async function postJson<T>(path: string, payload: unknown, token?: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
  } catch {
    let host = API_URL;
    try {
      host = new URL(API_URL).host;
    } catch {
      host = API_URL;
    }
    const apiInfo = import.meta.env.DEV ? ` - api: ${API_URL}` : "";
    throw new Error(
      `Não foi possível conectar ao servidor (${host}) [NETWORK] em ${path}${apiInfo}`
    );
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message = normalizeMessage(data?.message || "falha na requisicao");
    const detail = data?.detail || "";
    const suffix = detail ? ` (${detail})` : "";
    throw new Error(`${message}${suffix} [${response.status}] em ${path}`);
  }
  return response.json() as Promise<T>;
}

export async function login(identifier: string, password: string) {
  const response = await postJson<AuthResponse>("/auth/login", { identifier, password });
  setToken(response.token);
  setUser(response.user);
  return response.user;
}

export async function register(name: string, email: string, password: string) {
  const response = await postJson<AuthResponse>("/auth/register", { name, email, password });
  setToken(response.token);
  setUser(response.user);
  return response.user;
}

export async function fetchMe() {
  const token = getToken();
  if (!token) {
    throw new Error("Token ausente");
  }
  const response = await fetch(`${API_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    clearAuth();
    throw new Error("Não autorizado");
  }
  const user = (await response.json()) as AuthUser;
  setUser(user);
  return user;
}
