/**
 * PLAN-0042 / Onda 5 — política para senhas NOVAS (cadastro, redefinição, senha definida por admin).
 * O login continua aceitando senhas antigas (>= 8); só a criação passa por aqui.
 */
export const PASSWORD_MIN_LENGTH = 10;

export type PasswordPolicyResult =
  | { ok: true }
  | { ok: false; code: "too_short" | "weak_complexity" | "common" | "repetitive" | "contains_identity" };

/** Trechos que denunciam senha previsível (PT-BR + EN + marca). Comparados após normalização. */
const BANNED_FRAGMENTS = [
  "password", "passwd", "senha", "qwert", "asdfg", "zxcvb", "1qaz", "123456", "654321", "12345", "abcdef", "abcde",
  "admin", "master", "letmein", "welcome", "bemvindo", "mudar", "trocar", "iloveyou", "teamo", "amor", "brasil",
  "futebol", "flamengo", "corinthians", "palmeiras", "saopaulo", "gremio", "cruzeiro", "jlrbeauty", "jlrai", "beauty",
  "salao", "monkey", "dragon", "football", "baseball", "sunshine", "princess", "mercadopago",
];

/** Leet comum → letra, para pegar `P@ssw0rd`, `S3nh@`. */
const LEET: Record<string, string> = { "@": "a", "4": "a", "0": "o", "1": "i", "!": "i", "3": "e", "5": "s", "$": "s", "7": "t" };

const normalize = (value: string): string =>
  [...value.toLowerCase()].map((ch) => LEET[ch] ?? ch).join("").replace(/[^a-z0-9]/g, "");

/** Remove acentos/pontuação do nome/e-mail para comparar com a senha normalizada. */
const identityTokens = (ctx: { email?: string; name?: string }): string[] => {
  const tokens: string[] = [];
  if (ctx.email) {
    const local = ctx.email.split("@")[0] ?? "";
    tokens.push(normalize(local));
    for (const part of local.split(/[^A-Za-z0-9]+/)) tokens.push(normalize(part));
  }
  if (ctx.name) {
    const plain = ctx.name.normalize("NFD").replace(/[̀-ͯ]/g, "");
    for (const part of plain.split(/\s+/)) tokens.push(normalize(part));
  }
  return tokens.filter((t) => t.length >= 4);
};

const hasRequiredCharacterMix = (password: string): boolean =>
  /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);

const hasLongRun = (value: string, run: number): boolean => new RegExp(`(.)\\1{${run - 1},}`).test(value);

export function validateNewPassword(password: string, ctx: { email?: string; name?: string } = {}): PasswordPolicyResult {
  if (password.length < PASSWORD_MIN_LENGTH) return { ok: false, code: "too_short" };
  if (!hasRequiredCharacterMix(password)) return { ok: false, code: "weak_complexity" };

  const normalized = normalize(password);
  if (BANNED_FRAGMENTS.some((fragment) => normalized.includes(fragment))) return { ok: false, code: "common" };
  if (hasLongRun(password.toLowerCase(), 4)) return { ok: false, code: "repetitive" };
  if (identityTokens(ctx).some((token) => normalized.includes(token))) return { ok: false, code: "contains_identity" };
  return { ok: true };
}
