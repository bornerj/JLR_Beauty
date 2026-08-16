/**
 * Admin V2 (PLAN-0026, Onda 9) — tipo dos registros de contato do concierge (WhatsApp/site),
 * espelhando a resposta de `GET /concierge/sessions` (`apps/api/src/routes/schedule.ts`).
 */

export type ConciergeSessionStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";

export type ConciergeSession = {
  id: number;
  origin: "WEB" | "WHATSAPP";
  status: ConciergeSessionStatus;
  phone: string;
  customerName: string | null;
  service: { id: number; name: string } | null;
  unit: { id: number; name: string } | null;
  slotLabel: string | null;
  scheduledDateLabel: string | null;
  scheduledFor: string | null;
  createdAt: string | null;
  completedAt: string | null;
  lastInboundAt: string | null;
  summarySentAt: string | null;
  eventsCount: number;
};
