import Stripe from "stripe";
import { assertStripeEnabled } from "./config";

let stripeClient: Stripe | null = null;

export const getStripeClient = (): Stripe => {
  if (stripeClient) return stripeClient;
  const config = assertStripeEnabled();
  stripeClient = new Stripe(config.secretKey as string);
  return stripeClient;
};
