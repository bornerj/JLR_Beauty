-- SEC-24: Enable Row-Level Security on sensitive tables (defense in depth)
--
-- Threat model: if a DATABASE_URL (jlr_api_rw) or DATABASE_RO_URL (jlr_api_ro)
-- credential leaks, or a future role is misconfigured, RLS provides a fail-secure
-- default: any role WITHOUT an explicit policy gets zero rows, even if it has
-- table-level GRANTs. The table owner (jlrbeauty, used for migrations/seed) is
-- NOT subject to RLS unless FORCE ROW LEVEL SECURITY is set, so migrations and
-- seeding are unaffected.
--
-- jlr_api_rw keeps full CRUD (matches its existing GRANT from init-api-users.sh —
-- no functional change for the running application).
-- jlr_api_ro keeps read-only access (matches its existing GRANT SELECT).

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;

CREATE POLICY jlr_api_rw_all ON "User" FOR ALL TO jlr_api_rw USING (true) WITH CHECK (true);
CREATE POLICY jlr_api_rw_all ON "Order" FOR ALL TO jlr_api_rw USING (true) WITH CHECK (true);
CREATE POLICY jlr_api_rw_all ON "Payment" FOR ALL TO jlr_api_rw USING (true) WITH CHECK (true);
CREATE POLICY jlr_api_rw_all ON "Customer" FOR ALL TO jlr_api_rw USING (true) WITH CHECK (true);
CREATE POLICY jlr_api_rw_all ON "Subscription" FOR ALL TO jlr_api_rw USING (true) WITH CHECK (true);

CREATE POLICY jlr_api_ro_select ON "User" FOR SELECT TO jlr_api_ro USING (true);
CREATE POLICY jlr_api_ro_select ON "Order" FOR SELECT TO jlr_api_ro USING (true);
CREATE POLICY jlr_api_ro_select ON "Payment" FOR SELECT TO jlr_api_ro USING (true);
CREATE POLICY jlr_api_ro_select ON "Customer" FOR SELECT TO jlr_api_ro USING (true);
CREATE POLICY jlr_api_ro_select ON "Subscription" FOR SELECT TO jlr_api_ro USING (true);

-- No policy defined for any other role: default deny (fail-secure).
