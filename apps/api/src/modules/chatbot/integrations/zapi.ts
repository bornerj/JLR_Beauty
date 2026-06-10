import { logger } from "../../../utils/logger";

type ZApiSendTextPayload = {
  phone: string;
  message: string;
};

type ZApiSendTextResult = {
  ok: boolean;
  status: number;
  responseBody: unknown;
};

const sanitizePhone = (value: string): string => {
  return value.replace(/\D/g, "");
};

const normalizeSendTextUrl = (rawUrl: string): string => {
  const normalized = rawUrl.trim().replace(/\/+$/, "");
  if (/\/send-text$/i.test(normalized)) {
    return normalized;
  }
  return `${normalized}/send-text`;
};

const resolveSendTextUrl = (): string | null => {
  const explicitUrl = (process.env.ZAPI_SEND_TEXT_URL || "").trim();
  if (explicitUrl) return normalizeSendTextUrl(explicitUrl);

  const instanceId = (process.env.ZAPI_INSTANCE_ID || "").trim();
  const instanceToken = (process.env.ZAPI_INSTANCE_TOKEN || "").trim();
  if (!instanceId || !instanceToken) return null;

  const baseUrl = (process.env.ZAPI_BASE_URL || "https://api.z-api.io")
    .trim()
    .replace(/\/+$/, "");

  if (/\/instances\/[^/]+\/token\/[^/]+/i.test(baseUrl)) {
    return normalizeSendTextUrl(baseUrl);
  }

  return `${baseUrl}/instances/${instanceId}/token/${instanceToken}/send-text`;
};

const parseResponseBody = async (response: Response): Promise<unknown> => {
  const raw = await response.text();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
};

export const isZApiConfigured = (): boolean => {
  return Boolean(resolveSendTextUrl());
};

export const getDefaultZApiTargetPhone = (): string => {
  return sanitizePhone((process.env.ZAPI_DEFAULT_TARGET_PHONE || "").trim());
};

const hasZApiLogicalError = (payload: unknown): boolean => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return false;
  }
  const row = payload as Record<string, unknown>;
  if (typeof row.error === "string" && row.error.trim() !== "") {
    return true;
  }
  if (row.success === false) {
    return true;
  }
  return false;
};

export const sendZApiTextMessage = async (
  payload: ZApiSendTextPayload
): Promise<ZApiSendTextResult> => {
  const sendTextUrl = resolveSendTextUrl();
  if (!sendTextUrl) {
    throw new Error("zapi nao configurada");
  }

  const targetPhone = sanitizePhone(payload.phone);
  if (!targetPhone) {
    throw new Error("telefone de destino invalido");
  }

  const clientToken = (process.env.ZAPI_CLIENT_TOKEN || "").trim();
  const response = await fetch(sendTextUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(clientToken ? { "Client-Token": clientToken } : {}),
    },
    body: JSON.stringify({
      phone: targetPhone,
      message: payload.message,
    }),
  });

  const responseBody = await parseResponseBody(response);
  if (!response.ok) {
    logger.warn("Z-API send-text returned non-2xx status", { status: response.status });
    return { ok: false, status: response.status, responseBody };
  }

  if (hasZApiLogicalError(responseBody)) {
    logger.warn("Z-API send-text returned logical error payload", { status: response.status });
    return { ok: false, status: response.status, responseBody };
  }

  logger.info("Z-API send-text dispatched", { status: response.status });
  return { ok: true, status: response.status, responseBody };
};
