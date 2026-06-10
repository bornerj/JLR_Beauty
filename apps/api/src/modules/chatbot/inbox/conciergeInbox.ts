type ConciergeInboundMessage = {
  id: string;
  phone: string;
  text: string;
  createdAt: string;
};

type PushConciergeMessageInput = {
  id?: string;
  phone: string;
  text: string;
  createdAt?: string;
};

type ListConciergeMessagesOptions = {
  phone?: string;
  sinceMs?: number;
  limit?: number;
};

const MAX_STORED_MESSAGES = 500;
const inboundMessages: ConciergeInboundMessage[] = [];
const inboundIds = new Set<string>();

const sanitizePhone = (value: string): string => {
  return value.replace(/\D/g, "");
};

const normalizeTimestamp = (value?: string): string => {
  if (!value) return new Date().toISOString();
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString();
  return parsed.toISOString();
};

const phonesMatch = (left: string, right: string): boolean => {
  if (!left || !right) return false;
  if (left === right) return true;
  return left.endsWith(right) || right.endsWith(left);
};

export const pushConciergeInboundMessage = (
  input: PushConciergeMessageInput
): ConciergeInboundMessage | null => {
  const phone = sanitizePhone(input.phone);
  const text = input.text.trim();
  if (!phone || !text) return null;

  const id = (input.id || "").trim() || `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  if (inboundIds.has(id)) return null;

  const message: ConciergeInboundMessage = {
    id,
    phone,
    text,
    createdAt: normalizeTimestamp(input.createdAt),
  };

  inboundMessages.push(message);
  inboundIds.add(id);

  while (inboundMessages.length > MAX_STORED_MESSAGES) {
    const oldest = inboundMessages.shift();
    if (!oldest) break;
    inboundIds.delete(oldest.id);
  }

  return message;
};

export const listConciergeInboundMessages = (
  options: ListConciergeMessagesOptions
): ConciergeInboundMessage[] => {
  const normalizedPhone = sanitizePhone(options.phone || "");
  const sinceMs = Number.isFinite(options.sinceMs) ? Number(options.sinceMs) : 0;
  const limit = Number.isFinite(options.limit) ? Math.max(1, Math.min(100, Number(options.limit))) : 30;

  return inboundMessages
    .filter((message) => {
      if (normalizedPhone && !phonesMatch(message.phone, normalizedPhone)) {
        return false;
      }
      if (sinceMs > 0 && Date.parse(message.createdAt) <= sinceMs) {
        return false;
      }
      return true;
    })
    .slice(-limit);
};
