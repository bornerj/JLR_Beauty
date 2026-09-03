import { MercadoPagoConfig } from "mercadopago";
import { assertMercadoPagoEnabled } from "./config";

let mercadoPagoClient: MercadoPagoConfig | null = null;

export const getMercadoPagoClient = (): MercadoPagoConfig => {
  if (mercadoPagoClient) return mercadoPagoClient;
  const config = assertMercadoPagoEnabled();
  mercadoPagoClient = new MercadoPagoConfig({
    accessToken: config.accessToken as string,
    options: { timeout: 5000 },
  });
  return mercadoPagoClient;
};
