import { useBodyAttributes } from "../app/useBodyAttributes";
import FranquiasContent from "../components/pages/FranquiasContent";

export default function FranquiasPage() {
  useBodyAttributes({
    className:
      "bg-background-light dark:bg-background-dark text-forest dark:text-cream font-body",
    id: "top",
  });

  return <FranquiasContent />;
}
