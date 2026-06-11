import { Router } from "express";
import { pushConciergeInboundMessage } from "../modules/chatbot/inbox/conciergeInbox";
import { processWhatsappConciergeInbound } from "../modules/chatbot/flow/conciergeFlow";
import { logger } from "../utils/logger";
import { withDetail } from "../lib/routeHelpers";
import { MSG } from "../lib/messages";
import { parseZApiWebhookMessage } from "../lib/webhookParser";

const webhooksRouter = Router();

webhooksRouter.get("/public/webhooks/zapi", (_req, res) => {
  res.status(200).json({ ok: true, provider: "zapi", webhook: "online" });
});

webhooksRouter.post("/public/webhooks/zapi", async (req, res) => {
  const expectedSecret = (process.env.ZAPI_WEBHOOK_SECRET || "").trim();
  if (!expectedSecret) {
    logger.error("Webhook Z-API bloqueado por configuracao ausente", {
      reason: "missing_webhook_secret",
    });
    res.status(503).json({
      message: MSG.SERVER_ERROR,
      ...withDetail("zapi webhook secret nao configurado"),
    });
    return;
  }

  const headerSecretRaw = req.headers["x-zapi-secret"];
  const headerSecret =
    typeof headerSecretRaw === "string"
      ? headerSecretRaw.trim()
      : Array.isArray(headerSecretRaw)
      ? String(headerSecretRaw[0] || "").trim()
      : "";
  const querySecret =
    typeof req.query.secret === "string" ? req.query.secret.trim() : "";
  if (headerSecret !== expectedSecret && querySecret !== expectedSecret) {
    res.status(401).json({ message: MSG.UNAUTHORIZED });
    return;
  }

  const parsed = parseZApiWebhookMessage(req.body);
  if (!parsed) {
    res.status(200).json({ received: true, stored: false, reason: "unsupported_payload" });
    return;
  }

  if (parsed.fromMe) {
    res.status(200).json({ received: true, stored: false, reason: "from_me_ignored" });
    return;
  }

  const stored = pushConciergeInboundMessage({
    id: parsed.messageId,
    phone: parsed.phone,
    text: parsed.text,
    createdAt: parsed.createdAt,
  });
  const flow = await processWhatsappConciergeInbound(parsed.phone, parsed.text);

  if (stored) {
    logger.info("Z-API webhook message stored for concierge inbox", {
      phoneSuffix: stored.phone.slice(-4),
      flowOk: flow.ok,
    });
  }

  res.status(200).json({
    received: true,
    stored: Boolean(stored),
    flowOk: flow.ok,
    ...(flow.reason ? { reason: flow.reason } : {}),
  });
});

export { webhooksRouter };
