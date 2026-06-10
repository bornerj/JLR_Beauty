import { useBodyAttributes } from "../app/useBodyAttributes";
import HomeContent from "../components/pages/HomeContent";

export default function HomePage() {
  useBodyAttributes({
    className:
      "bg-background-light dark:bg-background-dark font-body text-forest dark:text-white antialiased selection:bg-primary selection:text-forest",
    id: "top",
  });

  return <HomeContent />;
}
