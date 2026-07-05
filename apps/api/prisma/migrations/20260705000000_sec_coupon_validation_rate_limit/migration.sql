-- Create coupon validation rate limiting table
CREATE TABLE IF NOT EXISTS "coupon_validation_attempts" (
    "ip" TEXT NOT NULL PRIMARY KEY,
    "attemptCount" INTEGER NOT NULL DEFAULT 1,
    "windowStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blockedUntil" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for efficiency when checking blockedUntil
CREATE INDEX IF NOT EXISTS "coupon_validation_attempts_blockedUntil_idx" ON "coupon_validation_attempts"("blockedUntil");
