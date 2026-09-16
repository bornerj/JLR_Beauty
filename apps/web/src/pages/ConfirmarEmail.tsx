import { useBodyAttributes } from "../app/useBodyAttributes";
import ConfirmarEmailContent from "../components/pages/ConfirmarEmailContent";

export default function ConfirmarEmailPage() {
  useBodyAttributes({
    className:
      "bg-background-light dark:bg-background-dark font-body text-forest dark:text-white antialiased selection:bg-primary selection:text-forest",
    id: "top",
  });

  return <ConfirmarEmailContent />;
}
