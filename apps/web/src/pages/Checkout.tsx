import { useBodyAttributes } from "../app/useBodyAttributes";
import CheckoutContent from "../components/pages/CheckoutContent";

export default function CheckoutPage() {
  useBodyAttributes({
    className:
      "bg-[#f6f8f6] dark:bg-[#102216] text-[#0d1b12] dark:text-white font-body min-h-screen flex flex-col antialiased selection:bg-gold/30",
  });

  return <CheckoutContent />;
}
