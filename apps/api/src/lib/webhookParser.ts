export type UnknownRecord = Record<string, unknown>;

export type ParsedWebhookMessage = {
  messageId: string;
  phone: string;
  text: string;
  createdAt?: string;
  fromMe: boolean;
};

export const asRecord = (value: unknown): UnknownRecord | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as UnknownRecord;
};

export const valueAsString = (value: unknown): string | null => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }
  if (typeof value === "number" || typeof value === "bigint") {
    return String(value);
  }
  return null;
};

export const valueAsBoolean = (value: unknown): boolean | null => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lowered = value.trim().toLowerCase();
    if (lowered === "true") return true;
    if (lowered === "false") return false;
  }
  return null;
};

export const getNested = (root: unknown, path: ReadonlyArray<string>): unknown => {
  let current: unknown = root;
  for (const key of path) {
    const record = asRecord(current);
    if (!record) return undefined;
    current = record[key];
  }
  return current;
};

export const pickStringFromPaths = (root: unknown, paths: ReadonlyArray<ReadonlyArray<string>>): string => {
  for (const path of paths) {
    const found = valueAsString(getNested(root, path));
    if (found) return found;
  }
  return "";
};

export const pickBooleanFromPaths = (
  root: unknown,
  paths: ReadonlyArray<ReadonlyArray<string>>,
  fallback = false
): boolean => {
  for (const path of paths) {
    const found = valueAsBoolean(getNested(root, path));
    if (found !== null) return found;
  }
  return fallback;
};

export const normalizeWebhookPhone = (rawValue: string): string => {
  const noSuffix = rawValue.includes("@") ? rawValue.split("@")[0] : rawValue;
  return noSuffix.replace(/\D/g, "");
};

export const parseZApiWebhookMessage = (payload: unknown): ParsedWebhookMessage | null => {
  const messageId =
    pickStringFromPaths(payload, [
      ["messageId"],
      ["id"],
      ["data", "messageId"],
      ["data", "id"],
      ["text", "id"],
    ]) || `zapi_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const connectedPhone = normalizeWebhookPhone(
    pickStringFromPaths(payload, [
      ["connectedPhone"],
      ["data", "connectedPhone"],
    ])
  );
  const phoneCandidates = [
    pickStringFromPaths(payload, [["participantPhone"], ["data", "participantPhone"]]),
    pickStringFromPaths(payload, [["senderPhone"], ["data", "senderPhone"]]),
    pickStringFromPaths(payload, [["sender", "phone"], ["data", "sender", "phone"]]),
    pickStringFromPaths(payload, [["sender", "id"], ["data", "sender", "id"]]),
    pickStringFromPaths(payload, [["from"], ["data", "from"]]),
    pickStringFromPaths(payload, [["chatId"], ["data", "chatId"]]),
    pickStringFromPaths(payload, [["phone"], ["data", "phone"]]),
  ]
    .map(normalizeWebhookPhone)
    .filter((value) => Boolean(value));
  const uniquePhoneCandidates = Array.from(new Set(phoneCandidates));
  const phone =
    uniquePhoneCandidates.find((value) => value !== connectedPhone) ||
    uniquePhoneCandidates[0] ||
    connectedPhone;

  const text = pickStringFromPaths(payload, [
    ["text", "message"],
    ["textMessage", "text"],
    ["message"],
    ["body"],
    ["data", "text", "message"],
    ["data", "textMessage", "text"],
    ["data", "message"],
    ["data", "body"],
    ["data", "content"],
  ]);

  const createdAt = pickStringFromPaths(payload, [
    ["createdAt"],
    ["timestamp"],
    ["time"],
    ["data", "createdAt"],
    ["data", "timestamp"],
    ["data", "time"],
  ]);

  const fromMe = pickBooleanFromPaths(payload, [
    ["fromMe"],
    ["senderMe"],
    ["data", "fromMe"],
    ["data", "senderMe"],
    ["sender", "fromMe"],
    ["data", "sender", "fromMe"],
  ]);

  if (!phone || !text) return null;
  return {
    messageId,
    phone,
    text,
    createdAt: createdAt || undefined,
    fromMe,
  };
};
