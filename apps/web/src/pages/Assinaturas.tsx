import { useBodyAttributes } from "../app/useBodyAttributes";
import AssinaturasContent from "../components/pages/AssinaturasContent";

export default function AssinaturasPage() {
  useBodyAttributes({
    className:
      "bg-background-light dark:bg-background-dark font-body text-forest dark:text-white antialiased selection:bg-primary selection:text-forest",
    id: "top",
  });

  return <AssinaturasContent />;
}
