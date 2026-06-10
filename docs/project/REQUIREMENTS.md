# Requirements Backlog (Validated 2026-02-25)

This backlog now reflects the current state of the product: the scheduling/concierge domain already exists inside the application (database + API + admin + web/WhatsApp flows). The items below focus on hardening, expansion, and operational maturity rather than "building agenda from scratch".

## Baseline Validated (Already in the Product)
- Internal scheduling domain implemented in backend + database:
  - units with operating hours;
  - professionals with service eligibility matrix;
  - work shifts by date (`ProfessionalShift`);
  - appointments + slot locking (`Appointment` + `AppointmentSlot`);
  - waitlist (`AppointmentWaitlistMessage`).
- Concierge flow implemented for WEB and WHATSAPP:
  - session/event persistence (`ConciergeSession`, `ConciergeEvent`);
  - step-based progression (service -> unit -> date -> slot -> name -> completed);
  - Z-API webhook intake and summary sending.
- Admin operational endpoints exist for appointments, professional shifts, concierge inbox/sessions/waitlist.
- Public endpoints exist for booking context, services/periods/slots, booking, waitlist, completion, and WhatsApp summary.

## Agenda & Atendimento (Evolucao)
- Harden and production-validate the concierge booking/chat flow end-to-end (web + WhatsApp), including retries, duplicate messages, and operator fallback paths.
- Improve admin agenda UX for day/week visualization, rescheduling, cancellation flows, and conflict handling feedback.
- Add explicit no-show / attendance outcome tracking (attended, no-show, late, rescheduled) for appointments.
- Add reminder and follow-up automations (e.g., pre-appointment reminder, post-appointment follow-up) with audit trail.
- Expand waitlist operations (status transitions, conversion tracking, operator notes/history).
- Add richer professional availability tools (recurring shift templates, bulk shift generation/edit, exceptions/holidays).

## Core Customer Experience
- Provide customer login/session and profile management.
- Finalize product purchase flow with cart persistence and end-to-end checkout completion.
- Enable subscription purchase flow with plan selection and recurring billing (provider decision still pending).
- Ensure checkout/booking journeys present clear confirmation, payment, and post-action feedback.

## Admin Operations (Commerce + CRM)
- Finalize Orders/Vendas workflow with real status pipeline transitions (pending, paid, shipped, delivered).
- Finalize Assinaturas lifecycle management (active, delinquent, cancelled) tied to real billing events.
- Reporting dashboards:
  - Top professionals by appointments and revenue.
  - Top products by sales and period.
  - Orders by status and delivery SLA.
  - Agenda conversion metrics (concierge session -> appointment -> confirmed -> paid).
- Fulfillment/dispatch workflow (separation, packing, shipment).

## Data & Backend
- Review and extend schema for remaining operational gaps (attendance outcomes, reminders, scheduling exceptions, notification logs) without regressing the current agenda model.
- Consolidate and version SQL reference snapshots in `documentations/` so they stay aligned with `apps/api/prisma/schema.prisma` (today `db_sql.sql` is a partial/older structural snapshot compared with `seed_carnaval*.sql` + Prisma).
- Seed data for base, feature, and error test scenarios (including realistic agenda/concierge cases).
- Complete API endpoints for remaining core commerce flows (catalog/cart/orders/subscriptions and payment callbacks).
- Expand role-based access beyond current admin-focused guards (admin, manager, professional, client) with permission granularity aligned to agenda operations.

## Integrations
- WhatsApp (Z-API + ngrok local webhook testing): harden configuration, webhook security, retry/error handling, and observability.
- Store webhook payloads and audit trail (including retention policy / archival strategy).
- Payment gateway integration: replace current payment intent mock with a real provider while preserving payment/audit records.
- External agenda/ERP connectors are optional future integrations only if business requires sync with third-party systems (not a dependency for current scheduling operation).

## Security & Reliability
- Input validation and sanitization across all endpoints.
- SQL injection and abuse protection (rate limits, anti-spam for public concierge endpoints).
- Token-based auth with expiry and refresh.
- Observability: logs, error tracking, and slow query monitoring.
- Background job hardening for retention/cleanup flows (single-run guarantees in multi-instance deploys).

## UI/UX Alignment
- Align concierge CTAs to open the chat consistently across all public pages/sections.
- Improve status feedback and recovery paths for booking failures (slot lost, no professional available, invalid date/time).
- Ensure subscription and product CTAs lead to real checkout states (not just UI transitions).
- Improve admin labels/microcopy still referencing external agenda sync (e.g., legacy "Sincronizar Trinx" wording in agenda UI placeholders).
