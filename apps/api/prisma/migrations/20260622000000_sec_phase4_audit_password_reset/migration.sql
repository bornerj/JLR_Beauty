-- SEC-16: Password reset tokens
CREATE TABLE "password_reset_tokens" (
  "id"        SERIAL PRIMARY KEY,
  "userId"    INTEGER NOT NULL,
  "token"     TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt"    TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "password_reset_tokens_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");

-- SEC-09: Audit log
CREATE TABLE "audit_logs" (
  "id"        SERIAL PRIMARY KEY,
  "userId"    INTEGER,
  "action"    TEXT NOT NULL,
  "ip"        TEXT,
  "userAgent" TEXT,
  "meta"      JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt");
CREATE INDEX "audit_logs_action_createdAt_idx" ON "audit_logs"("action", "createdAt");

-- Grant to runtime user (DEFAULT PRIVILEGES on jlrbeauty user cover future tables,
-- but we grant explicitly to be safe if the DB was created without DEFAULT PRIVILEGES set)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'jlr_api_rw') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "password_reset_tokens" TO jlr_api_rw;
    GRANT USAGE, SELECT ON SEQUENCE "password_reset_tokens_id_seq" TO jlr_api_rw;
    GRANT SELECT, INSERT, UPDATE, DELETE ON "audit_logs" TO jlr_api_rw;
    GRANT USAGE, SELECT ON SEQUENCE "audit_logs_id_seq" TO jlr_api_rw;
  END IF;
END
$$;
