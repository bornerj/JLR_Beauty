import { sendTransactionalEmail } from "./email";

const stripTrailingSlash = (value: string): string => value.replace(/\/+$/, "");

const webAppBaseUrl = stripTrailingSlash(process.env.APP_WEB_URL?.trim() || "");

const emailShell = (title: string, bodyHtml: string): string => `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0d1b12;">
    <h1 style="font-size: 20px;">${title}</h1>
    ${bodyHtml}
    <p style="color: #78716c; font-size: 12px; margin-top: 24px;">JLR Beauty</p>
  </div>
`;

export async function sendPasswordResetEmail(args: {
  to: string;
  name: string;
  resetToken: string;
}): Promise<void> {
  const link = webAppBaseUrl
    ? `${webAppBaseUrl}/redefinir-senha?token=${args.resetToken}`
    : `/redefinir-senha?token=${args.resetToken}`;

  await sendTransactionalEmail({
    to: args.to,
    subject: "Redefinição de senha — JLR Beauty",
    html: emailShell(
      `Olá, ${args.name}`,
      `
        <p>Recebemos um pedido para redefinir a senha da sua conta.</p>
        <p><a href="${link}">Clique aqui para escolher uma nova senha</a></p>
        <p>Se você não pediu isso, pode ignorar este e-mail — sua senha continua a mesma.</p>
      `
    ),
  });
}

export async function sendVerificationEmail(args: {
  to: string;
  name: string;
  verificationToken: string;
}): Promise<void> {
  const link = webAppBaseUrl
    ? `${webAppBaseUrl}/confirmar-email?token=${args.verificationToken}`
    : `/confirmar-email?token=${args.verificationToken}`;

  await sendTransactionalEmail({
    to: args.to,
    subject: "Confirme seu e-mail — JLR Beauty",
    html: emailShell(
      `Bem-vindo(a), ${args.name}`,
      `
        <p>Confirme seu e-mail pra ativar o acesso à sua conta.</p>
        <p><a href="${link}">Clique aqui para confirmar seu e-mail</a></p>
        <p>Se você não fez esse cadastro, pode ignorar este e-mail.</p>
      `
    ),
  });
}
