import nodemailer from "nodemailer";
import { logger } from "../utils/logger";

/**
 * Envio transacional de e-mail via Brevo (SMTP relay). Mesmo padrão usado no projeto Rifa
 * (mesma conta Brevo, variáveis de ambiente idênticas por conveniência).
 *
 * Sem credenciais configuradas (`BREVO_SMTP_USER`/`BREVO_SMTP_KEY`/`BREVO_SENDER_EMAIL`), cai
 * em modo "preview": loga a intenção de envio e não lança erro — mesmo espírito do
 * `_dev_reset_token`/`_dev_verification_token` que já existiam antes desta lib (nunca trava o
 * fluxo por falta de configuração de e-mail).
 */

type SendTransactionalEmailInput = {
  to: string;
  subject: string;
  html: string;
};

export type EmailDeliveryResult = {
  delivered: boolean;
  previewOnly: boolean;
};

const readBrevoConfig = () => ({
  host: process.env.BREVO_SMTP_HOST?.trim() || "smtp-relay.brevo.com",
  port: Number(process.env.BREVO_SMTP_PORT || 587),
  user: process.env.BREVO_SMTP_USER?.trim() || "",
  key: process.env.BREVO_SMTP_KEY?.trim() || "",
  senderEmail: process.env.BREVO_SENDER_EMAIL?.trim() || "",
  senderName: process.env.BREVO_SENDER_NAME?.trim() || "JLR Beauty",
});

export const isEmailConfigured = (): boolean => {
  const config = readBrevoConfig();
  return Boolean(config.user && config.key && config.senderEmail);
};

export async function sendTransactionalEmail({
  to,
  subject,
  html,
}: SendTransactionalEmailInput): Promise<EmailDeliveryResult> {
  const config = readBrevoConfig();

  if (!isEmailConfigured()) {
    logger.info("E-mail transacional em modo preview (Brevo nao configurado)", { to, subject });
    return { delivered: false, previewOnly: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: { user: config.user, pass: config.key },
    });

    await transporter.sendMail({
      from: `"${config.senderName}" <${config.senderEmail}>`,
      to,
      subject,
      html,
    });

    return { delivered: true, previewOnly: false };
  } catch (error) {
    logger.error("Falha ao enviar e-mail transacional via Brevo", {
      to,
      subject,
      error: error instanceof Error ? error.message : "erro desconhecido",
    });
    return { delivered: false, previewOnly: true };
  }
}
