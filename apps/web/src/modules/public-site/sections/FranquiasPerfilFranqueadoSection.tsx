import type { ReactElement } from "react";
import { useMediaSlot } from "../media.runtime";
import { usePageText } from "../pageTexts.runtime";
import { RichText } from "../../../components/ui/RichText";

export const FranquiasPerfilFranqueadoSection = ({ alt }: { alt?: boolean } = {}): ReactElement => {
  const perfilImg = useMediaSlot("franquias_perfil_img_01");

  const title = usePageText("franquias.perfil.title");
  const item1 = usePageText("franquias.perfil.item_1");
  const item2 = usePageText("franquias.perfil.item_2");
  const item3 = usePageText("franquias.perfil.item_3");
  const item4 = usePageText("franquias.perfil.item_4");
  const item5 = usePageText("franquias.perfil.item_5");
  const item6 = usePageText("franquias.perfil.item_6");
  const item7 = usePageText("franquias.perfil.item_7");

  const items = [item1, item2, item3, item4, item5, item6, item7];

  return (
    <section className={`w-full ${alt ? 'bg-background-light' : 'bg-white'} dark:bg-background-dark`} id="perfil-franqueado">
      <div className="mx-auto max-w-[1200px] grid grid-cols-1 lg:grid-cols-2">

        {/* LEFT — photo */}
        <div className="relative min-h-[400px] lg:min-h-0 overflow-hidden order-2 lg:order-1">
          <img
            src={perfilImg}
            alt=""
            className="absolute inset-0 w-full h-full object-contain object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>

        {/* RIGHT — title + checklist */}
        <div className={`relative z-10 px-10 py-20 lg:px-14 lg:py-24 flex flex-col justify-center order-1 lg:order-2 ${alt ? 'bg-white' : 'bg-background-light'} dark:bg-background-dark`}>
          <h2 className="display-hero text-4xl md:text-5xl text-forest dark:text-white leading-tight mb-8">
            <RichText value={title} />
          </h2>

          <ul className="space-y-5">
            {items.map((item, i) => (
              <li key={i} className="flex items-start gap-4">
                <span className="shrink-0 mt-0.5 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                  {i + 1}
                </span>
                <span className="text-sm text-forest dark:text-white leading-relaxed">
                  <RichText value={item} />
                </span>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </section>
  );
};
