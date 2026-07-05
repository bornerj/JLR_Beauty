-- Add orderHmac field to Order table for SEC-21 (public order tracking protection)
ALTER TABLE "Order" ADD COLUMN "orderHmac" TEXT UNIQUE;

-- Create index for lookups by HMAC
CREATE INDEX IF NOT EXISTS "Order_orderHmac_idx" ON "Order"("orderHmac");
