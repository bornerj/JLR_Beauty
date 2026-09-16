import { useBodyAttributes } from "../app/useBodyAttributes";
import RedefinirSenhaContent from "../components/pages/RedefinirSenhaContent";

export default function RedefinirSenhaPage() {
  useBodyAttributes({
    className:
      "bg-background-light dark:bg-background-dark font-body text-forest dark:text-white antialiased selection:bg-primary selection:text-forest",
    id: "top",
  });

  return <RedefinirSenhaContent />;
}
