-- Create public concierge rate limiting table (SEC-26)
CREATE TABLE IF NOT EXISTS "concierge_public_attempts" (
    "ip" TEXT NOT NULL PRIMARY KEY,
    "attemptCount" INTEGER NOT NULL DEFAULT 1,
    "windowStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blockedUntil" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "concierge_public_attempts_blockedUntil_idx" ON "concierge_public_attempts"("blockedUntil");
