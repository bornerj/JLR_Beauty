import crypto from "crypto";

// Generate HMAC secret for order tracking
// Used to sign publicCode so only legitimate order tracking requests are allowed
const HMAC_SECRET = process.env.ORDER_HMAC_SECRET || "default-dev-secret-change-in-prod";

/**
 * Generate HMAC for an order's publicCode
 * This validates that the client knows the public code and cannot enumerate random codes
 * @param orderId Order database ID
 * @param publicCode The public order code
 * @returns Hex-encoded HMAC-SHA256
 */
export const generateOrderHmac = (orderId: number, publicCode: string): string => {
  const message = `${orderId}:${publicCode}`;
  return crypto.createHmac("sha256", HMAC_SECRET).update(message).digest("hex");
};

/**
 * Verify HMAC for order tracking request
 * @param orderId Order database ID
 * @param publicCode The public order code
 * @param hmac The HMAC provided by client
 * @returns true if HMAC is valid
 */
export const verifyOrderHmac = (orderId: number, publicCode: string, hmac: string): boolean => {
  const expectedHmac = generateOrderHmac(orderId, publicCode);
  const expectedBuffer = Buffer.from(expectedHmac);
  const providedBuffer = Buffer.from(hmac);

  // timingSafeEqual throws if buffer lengths differ — guard first.
  // Length itself isn't secret (HMAC-SHA256 hex is always 64 chars).
  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
};
