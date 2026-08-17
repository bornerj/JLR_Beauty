import { Prisma } from "@prisma/client";
import { logger } from "../utils/logger";

/**
 * PLAN-0027 (Item 1) — materializa/atualiza `Customer` a partir de um contato real
 * (pedido confirmado como PAGO ou agendamento criado). Antes desta sincronização,
 * `Customer` só era escrito manualmente (tela nativa "Cadastro > Clientes") ou pelo
 * fluxo de concierge WhatsApp (`upsertConciergeCustomerByPhone` em
 * `modules/chatbot/flow/conciergeFlow.ts` — mesma ideia, não reaproveitado aqui de
 * propósito para não acoplar o módulo de pedidos/agenda ao módulo de chatbot).
 *
 * Chave de identidade: telefone normalizado (dígitos), pois `Customer.phone` é
 * `@unique` no schema. Sem telefone normalizável não há como materializar (não é
 * erro — simplesmente não sincroniza).
 *
 * Best-effort: nunca deve derrubar o fluxo principal (pagamento/agendamento) se
 * falhar — só loga um warning e segue.
 */

const sanitizePhone = (value: string): string => value.replace(/\D/g, "");

export const syncCustomerFromContact = async (
  tx: Prisma.TransactionClient,
  contact: { name: string | null; phone: string | null; email?: string | null }
): Promise<void> => {
  const phone = contact.phone ? sanitizePhone(contact.phone) : "";
  if (!phone) return;

  const name = (contact.name || "").trim() || "(sem nome)";
  const email = contact.email?.trim().toLowerCase() || undefined;

  try {
    await tx.customer.upsert({
      where: { phone },
      update: {
        name,
        ...(email ? { email } : {}),
      },
      create: {
        phone,
        name,
        email: email ?? null,
      },
    });
  } catch (error) {
    logger.warn("Falha ao sincronizar Customer a partir de contato real", {
      error: error instanceof Error ? error.message : "erro inesperado",
      phone,
    });
  }
};
