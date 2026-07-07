-- PLAN-0020 (S9): Row-Level Security fail-secure nas tabelas novas de estoque,
-- seguindo o padrão de 20260705020000_sec_rls_sensitive_tables (PLAN-0018 / SEC-24).
--
-- jlr_api_rw: CRUD total (policy permissiva — a API usa credencial única).
-- jlr_api_ro: SELECT only.
-- Qualquer outra role sem policy: default deny (zero linhas), mesmo com GRANT de tabela.
-- O owner (jlrbeauty) não é afetado — migrations e seed continuam funcionando.

ALTER TABLE "ProductStock" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StockMovement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StockReservation" ENABLE ROW LEVEL SECURITY;

CREATE POLICY jlr_api_rw_all ON "ProductStock" FOR ALL TO jlr_api_rw USING (true) WITH CHECK (true);
CREATE POLICY jlr_api_rw_all ON "StockMovement" FOR ALL TO jlr_api_rw USING (true) WITH CHECK (true);
CREATE POLICY jlr_api_rw_all ON "StockReservation" FOR ALL TO jlr_api_rw USING (true) WITH CHECK (true);

CREATE POLICY jlr_api_ro_select ON "ProductStock" FOR SELECT TO jlr_api_ro USING (true);
CREATE POLICY jlr_api_ro_select ON "StockMovement" FOR SELECT TO jlr_api_ro USING (true);
CREATE POLICY jlr_api_ro_select ON "StockReservation" FOR SELECT TO jlr_api_ro USING (true);

-- No policy defined for any other role: default deny (fail-secure).
