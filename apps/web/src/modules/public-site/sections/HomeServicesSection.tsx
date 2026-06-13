import { useEffect, useState, type ReactElement } from "react";
import { fetchChatbotPublicJson } from "../../chatbot";
import { useMediaSlot } from "../media.runtime";
import { usePageText } from "../pageTexts.runtime";
import { RichText } from "../../../components/ui/RichText";

type PublicServiceCatalogItem = {
  id: number;
  name: string;
  durationMin: number;
  price: string;
};

type PublicServiceCatalogCategory = {
  id: number;
  name: string;
  services: PublicServiceCatalogItem[];
};

type PublicServiceCatalogResponse = {
  categories?: PublicServiceCatalogCategory[];
};

type CatalogLoadState = "idle" | "loading" | "success" | "error";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const sortByName = <T extends { name: string }>(items: T[]): T[] =>
  [...items].sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }));

const formatServiceDuration = (durationMin: number): string => `${durationMin} min`;

const formatServicePrice = (price: string): string => {
  const value = Number(price);
  if (!Number.isFinite(value)) return "Consultar valor";
  return currencyFormatter.format(value);
};

export const HomeServicesSection = (): ReactElement => {
  const serviceCardImage01 = useMediaSlot("home_services_card_img_01");
  const serviceCardImage02 = useMediaSlot("home_services_card_img_02");
  const serviceCardImage03 = useMediaSlot("home_services_card_img_03");
  const serviceCardImage04 = useMediaSlot("home_services_card_img_04");
  const serviceCardImage05 = useMediaSlot("home_services_card_img_05");
  const serviceCardImage06 = useMediaSlot("home_services_card_img_06");
  const serviceCardImage07 = useMediaSlot("home_services_card_img_07");
  const serviceCardImage08 = useMediaSlot("home_services_card_img_08");
  const serviceCardImage09 = useMediaSlot("home_services_card_img_09");

  const label       = usePageText("home.services.label");
  const title       = usePageText("home.services.title");
  const catalogLink = usePageText("home.services.catalog_link");

  const c1FrontLabel   = usePageText("home.services.card_1_front_label");
  const c1FrontTagline = usePageText("home.services.card_1_front_tagline");
  const c1BackLabel    = usePageText("home.services.card_1_back_label");
  const c1BackDesc     = usePageText("home.services.card_1_back_desc");

  const c2FrontLabel   = usePageText("home.services.card_2_front_label");
  const c2FrontTagline = usePageText("home.services.card_2_front_tagline");
  const c2BackLabel    = usePageText("home.services.card_2_back_label");
  const c2BackDesc     = usePageText("home.services.card_2_back_desc");

  const c3FrontLabel   = usePageText("home.services.card_3_front_label");
  const c3FrontTagline = usePageText("home.services.card_3_front_tagline");
  const c3BackLabel    = usePageText("home.services.card_3_back_label");
  const c3BackDesc     = usePageText("home.services.card_3_back_desc");

  const c4FrontLabel   = usePageText("home.services.card_4_front_label");
  const c4FrontTagline = usePageText("home.services.card_4_front_tagline");
  const c4BackLabel    = usePageText("home.services.card_4_back_label");
  const c4BackDesc     = usePageText("home.services.card_4_back_desc");

  const c5FrontLabel   = usePageText("home.services.card_5_front_label");
  const c5FrontTagline = usePageText("home.services.card_5_front_tagline");
  const c5BackLabel    = usePageText("home.services.card_5_back_label");
  const c5BackDesc     = usePageText("home.services.card_5_back_desc");

  const c6FrontLabel   = usePageText("home.services.card_6_front_label");
  const c6FrontTagline = usePageText("home.services.card_6_front_tagline");
  const c6BackLabel    = usePageText("home.services.card_6_back_label");
  const c6BackDesc     = usePageText("home.services.card_6_back_desc");

  const c7FrontLabel   = usePageText("home.services.card_7_front_label");
  const c7FrontTagline = usePageText("home.services.card_7_front_tagline");
  const c7BackLabel    = usePageText("home.services.card_7_back_label");
  const c7BackDesc     = usePageText("home.services.card_7_back_desc");

  const c8FrontLabel   = usePageText("home.services.card_8_front_label");
  const c8FrontTagline = usePageText("home.services.card_8_front_tagline");
  const c8BackLabel    = usePageText("home.services.card_8_back_label");
  const c8BackDesc     = usePageText("home.services.card_8_back_desc");

  const c9FrontLabel   = usePageText("home.services.card_9_front_label");
  const c9FrontTagline = usePageText("home.services.card_9_front_tagline");
  const c9BackLabel    = usePageText("home.services.card_9_back_label");
  const c9BackDesc     = usePageText("home.services.card_9_back_desc");

  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState<boolean>(false);
  const [catalogLoadState, setCatalogLoadState] = useState<CatalogLoadState>("idle");
  const [catalogErrorMessage, setCatalogErrorMessage] = useState<string>("");
  const [catalogCategories, setCatalogCategories] = useState<PublicServiceCatalogCategory[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [catalogReloadToken, setCatalogReloadToken] = useState<number>(0);

  useEffect(() => {
    if (!isCatalogModalOpen) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setIsCatalogModalOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCatalogModalOpen]);

  useEffect(() => {
    if (!isCatalogModalOpen) return;

    let cancelled = false;
    const loadCatalog = async (): Promise<void> => {
      setCatalogLoadState("loading");
      setCatalogErrorMessage("");

      const response = await fetchChatbotPublicJson<PublicServiceCatalogResponse>(
        "/public/services/catalog"
      );

      if (cancelled) return;

      const categoriesRaw = Array.isArray(response?.categories) ? response.categories : [];
      const categories = sortByName(categoriesRaw)
        .map((category) => ({
          ...category,
          services: sortByName(Array.isArray(category.services) ? category.services : []),
        }))
        .filter((category) => category.services.length > 0);

      if (!response) {
        setCatalogLoadState("error");
        setCatalogErrorMessage("Não foi possível carregar o menu completo agora.");
        return;
      }

      setCatalogCategories(categories);
      setActiveCategoryId((current) => current ?? categories[0]?.id ?? null);
      setCatalogLoadState("success");
    };

    void loadCatalog();

    return () => {
      cancelled = true;
    };
  }, [catalogReloadToken, isCatalogModalOpen]);

  const retryCatalogLoad = (): void => {
    setCatalogErrorMessage("");
    setCatalogLoadState("idle");
    setCatalogReloadToken((current) => current + 1);
  };

  const openCatalogModal = (): void => {
    if (catalogLoadState === "error") {
      retryCatalogLoad();
    }
    setIsCatalogModalOpen(true);
  };

  const closeCatalogModal = (): void => {
    setIsCatalogModalOpen(false);
  };

  const toggleCategory = (categoryId: number): void => {
    setActiveCategoryId((current) => (current === categoryId ? null : categoryId));
  };

  return (
    <>
    {/* Serviços */}
    <section className="py-24 px-6 bg-background-light dark:bg-background-dark relative" id="services">
        <div className="max-w-[1440px] mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                <div className="max-w-xl">
                    <h2 className="text-gold text-sm display-label mb-3"><RichText value={label} /></h2>
                    <h3 className="text-3xl sm:text-4xl md:text-5xl display-hero text-shadow-strong text-primary dark:text-white leading-tight">
                        <RichText value={title} /></h3>
                </div>
                <div className="md:text-right">
                    <button
                        className="inline-flex items-center gap-2 text-forest dark:text-white font-medium hover:text-primary transition-colors group"
                        type="button"
                        onClick={openCatalogModal}
                    >
                        <span><RichText value={catalogLink} /></span>
                        <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </button>
                </div>
            </div>
            {/* Flip Cards */}
            <div className="scene-container flex flex-col items-center gap-8 px-4 pb-12 md:grid md:grid-cols-3 md:gap-10 md:p-10 md:overflow-visible" id="flipcards">
                <div className="group flip-card flip-card-group flex-shrink-0 w-full max-w-sm cursor-pointer">
                    <div className="flip-card-inner">
                        <div className="flip-card-front bg-forest border border-gold-accent/30">
                            <img src={serviceCardImage01} alt="Woman with sleek shiny hair looking over shoulder" className="w-full h-full object-cover opacity-70 grayscale group-hover:grayscale-0 transition duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-t from-forest via-transparent to-transparent opacity-90"></div>
                            <div className="absolute bottom-8 left-0 w-full text-center">
                                <h3 className="text-2xl font-serif text-gold italic"><RichText value={c1FrontLabel} /></h3>
                                <p className="text-white text-xs tracking-widest mt-2 uppercase"><RichText value={c1FrontTagline} /></p>
                            </div>
                        </div>
                        <div className="flip-card-back bg-forest-green border border-gold-accent/60 p-6 flex flex-col justify-center items-center text-center">
                            <h3 className="text-xl font-serif text-gold mb-3"><RichText value={c1BackLabel} /></h3>
                            <p className="text-gray-200 text-xs leading-relaxed mb-5"><RichText value={c1BackDesc} /></p>
                            <button
                                className="inline-flex items-center justify-center px-6 py-2 text-xs font-bold uppercase tracking-widest rounded-full border border-gold-accent text-gold hover:bg-gold-accent hover:text-forest transition-colors"
                                data-open-concierge
                                data-concierge-label="Arte Capilar"
                                data-concierge-category="Cabeleireiro Feminino"
                                data-concierge-service="Hidratacao Capilar"
                                type="button"
                            >
                                Agendar
                            </button>
                        </div>
                    </div>
                </div>
                <div className="group flip-card flip-card-group flex-shrink-0 w-full max-w-sm cursor-pointer">
                    <div className="flip-card-inner">
                        <div className="flip-card-front bg-forest border border-gold-accent/30">
                            <img src={serviceCardImage02} alt="Close de mulher recebendo tratamento facial com olhos fechados" className="w-full h-full object-cover opacity-70 grayscale group-hover:grayscale-0 transition duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-t from-forest via-transparent to-transparent opacity-90"></div>
                            <div className="absolute bottom-8 left-0 w-full text-center">
                                <h3 className="text-2xl font-serif text-gold italic"><RichText value={c2FrontLabel} /></h3>
                                <p className="text-white text-xs tracking-widest mt-2 uppercase"><RichText value={c2FrontTagline} /></p>
                            </div>
                        </div>
                        <div className="flip-card-back bg-forest-green border border-gold-accent/60 p-6 flex flex-col justify-center items-center text-center">
                            <h3 className="text-xl font-serif text-gold mb-3"><RichText value={c2BackLabel} /></h3>
                            <p className="text-gray-200 text-xs leading-relaxed mb-5"><RichText value={c2BackDesc} /></p>
                            <button
                                className="inline-flex items-center justify-center px-6 py-2 text-xs font-bold uppercase tracking-widest rounded-full border border-gold-accent text-gold hover:bg-gold-accent hover:text-forest transition-colors"
                                data-open-concierge
                                data-concierge-label="Pele Clinica"
                                data-concierge-category="Estetica Facial"
                                data-concierge-service="Limpeza de Pele"
                                type="button"
                            >
                                Agendar
                            </button>
                        </div>
                    </div>
                </div>
                <div className="group flip-card flip-card-group flex-shrink-0 w-full max-w-sm cursor-pointer">
                    <div className="flip-card-inner">
                        <div className="flip-card-front bg-forest border border-gold-accent/30">
                            <img src={serviceCardImage03} alt="Relaxing spa setting with stones and massage oils" className="w-full h-full object-cover opacity-70 grayscale group-hover:grayscale-0 transition duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-t from-forest via-transparent to-transparent opacity-90"></div>
                            <div className="absolute bottom-8 left-0 w-full text-center">
                                <h3 className="text-2xl font-serif text-gold italic"><RichText value={c3FrontLabel} /></h3>
                                <p className="text-white text-xs tracking-widest mt-2 uppercase"><RichText value={c3FrontTagline} /></p>
                            </div>
                        </div>
                        <div className="flip-card-back bg-forest-green border border-gold-accent/60 p-6 flex flex-col justify-center items-center text-center">
                            <h3 className="text-xl font-serif text-gold mb-3"><RichText value={c3BackLabel} /></h3>
                            <p className="text-gray-200 text-xs leading-relaxed mb-5"><RichText value={c3BackDesc} /></p>
                            <button
                                className="inline-flex items-center justify-center px-6 py-2 text-xs font-bold uppercase tracking-widest rounded-full border border-gold-accent text-gold hover:bg-gold-accent hover:text-forest transition-colors"
                                data-open-concierge
                                data-concierge-label="Terapia de Bem-Estar"
                                data-concierge-category="Estetica Corporal"
                                data-concierge-service="Massagem Relaxante"
                                type="button"
                            >
                                Agendar
                            </button>
                        </div>
                    </div>
                </div>
                <div className="group flip-card flip-card-group flex-shrink-0 w-full max-w-sm cursor-pointer">
                    <div className="flip-card-inner">
                        <div className="flip-card-front bg-forest border border-gold-accent/30">
                            <img src={serviceCardImage04} alt="Terapia capilar" className="w-full h-full object-cover opacity-70 grayscale group-hover:grayscale-0 transition duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-t from-forest via-transparent to-transparent opacity-90"></div>
                            <div className="absolute bottom-8 left-0 w-full text-center">
                                <h3 className="text-2xl font-serif text-gold italic"><RichText value={c4FrontLabel} /></h3>
                                <p className="text-white text-xs tracking-widest mt-2 uppercase"><RichText value={c4FrontTagline} /></p>
                            </div>
                        </div>
                        <div className="flip-card-back bg-forest-green border border-gold-accent/60 p-6 flex flex-col justify-center items-center text-center">
                            <h3 className="text-xl font-serif text-gold mb-3"><RichText value={c4BackLabel} /></h3>
                            <p className="text-gray-200 text-xs leading-relaxed mb-5"><RichText value={c4BackDesc} /></p>
                            <button
                                className="inline-flex items-center justify-center px-6 py-2 text-xs font-bold uppercase tracking-widest rounded-full border border-gold-accent text-gold hover:bg-gold-accent hover:text-forest transition-colors"
                                data-open-concierge
                                data-concierge-label="Terapia Capilar"
                                data-concierge-category="Cabeleireiro Feminino"
                                data-concierge-service="Terapia Capilar"
                                type="button"
                            >
                                Agendar
                            </button>
                        </div>
                    </div>
                </div>
                <div className="group flip-card flip-card-group flex-shrink-0 w-full max-w-sm cursor-pointer">
                    <div className="flip-card-inner">
                        <div className="flip-card-front bg-forest border border-gold-accent/30">
                            <img src={serviceCardImage05} alt="Extensão de cílios" className="w-full h-full object-cover opacity-70 grayscale group-hover:grayscale-0 transition duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-t from-forest via-transparent to-transparent opacity-90"></div>
                            <div className="absolute bottom-8 left-0 w-full text-center">
                                <h3 className="text-2xl font-serif text-gold italic"><RichText value={c5FrontLabel} /></h3>
                                <p className="text-white text-xs tracking-widest mt-2 uppercase"><RichText value={c5FrontTagline} /></p>
                            </div>
                        </div>
                        <div className="flip-card-back bg-forest-green border border-gold-accent/60 p-6 flex flex-col justify-center items-center text-center">
                            <h3 className="text-xl font-serif text-gold mb-3"><RichText value={c5BackLabel} /></h3>
                            <p className="text-gray-200 text-xs leading-relaxed mb-5"><RichText value={c5BackDesc} /></p>
                            <button
                                className="inline-flex items-center justify-center px-6 py-2 text-xs font-bold uppercase tracking-widest rounded-full border border-gold-accent text-gold hover:bg-gold-accent hover:text-forest transition-colors"
                                data-open-concierge
                                data-concierge-label="Lashes"
                                data-concierge-category="Estetica Facial"
                                data-concierge-service="Extensao De Cilios"
                                type="button"
                            >
                                Agendar
                            </button>
                        </div>
                    </div>
                </div>
                <div className="group flip-card flip-card-group flex-shrink-0 w-full max-w-sm cursor-pointer">
                    <div className="flip-card-inner">
                        <div className="flip-card-front bg-forest border border-gold-accent/30">
                            <img src={serviceCardImage06} alt="Sobrancelhas" className="w-full h-full object-cover opacity-70 grayscale group-hover:grayscale-0 transition duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-t from-forest via-transparent to-transparent opacity-90"></div>
                            <div className="absolute bottom-8 left-0 w-full text-center">
                                <h3 className="text-2xl font-serif text-gold italic"><RichText value={c6FrontLabel} /></h3>
                                <p className="text-white text-xs tracking-widest mt-2 uppercase"><RichText value={c6FrontTagline} /></p>
                            </div>
                        </div>
                        <div className="flip-card-back bg-forest-green border border-gold-accent/60 p-6 flex flex-col justify-center items-center text-center">
                            <h3 className="text-xl font-serif text-gold mb-3"><RichText value={c6BackLabel} /></h3>
                            <p className="text-gray-200 text-xs leading-relaxed mb-5"><RichText value={c6BackDesc} /></p>
                            <button
                                className="inline-flex items-center justify-center px-6 py-2 text-xs font-bold uppercase tracking-widest rounded-full border border-gold-accent text-gold hover:bg-gold-accent hover:text-forest transition-colors"
                                data-open-concierge
                                data-concierge-label="Brows"
                                data-concierge-category="Estetica Facial"
                                data-concierge-service="Design de Sobrancelha"
                                type="button"
                            >
                                Agendar
                            </button>
                        </div>
                    </div>
                </div>
                <div className="group flip-card flip-card-group flex-shrink-0 w-full max-w-sm cursor-pointer">
                    <div className="flip-card-inner">
                        <div className="flip-card-front bg-forest border border-gold-accent/30">
                            <img src={serviceCardImage07} alt="Estética facial" className="w-full h-full object-cover opacity-70 grayscale group-hover:grayscale-0 transition duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-t from-forest via-transparent to-transparent opacity-90"></div>
                            <div className="absolute bottom-8 left-0 w-full text-center">
                                <h3 className="text-2xl font-serif text-gold italic"><RichText value={c7FrontLabel} /></h3>
                                <p className="text-white text-xs tracking-widest mt-2 uppercase"><RichText value={c7FrontTagline} /></p>
                            </div>
                        </div>
                        <div className="flip-card-back bg-forest-green border border-gold-accent/60 p-6 flex flex-col justify-center items-center text-center">
                            <h3 className="text-xl font-serif text-gold mb-3"><RichText value={c7BackLabel} /></h3>
                            <p className="text-gray-200 text-xs leading-relaxed mb-5"><RichText value={c7BackDesc} /></p>
                            <button
                                className="inline-flex items-center justify-center px-6 py-2 text-xs font-bold uppercase tracking-widest rounded-full border border-gold-accent text-gold hover:bg-gold-accent hover:text-forest transition-colors"
                                data-open-concierge
                                data-concierge-label="Facial Spa"
                                data-concierge-category="Estetica Facial"
                                data-concierge-service="Limpeza de Pele"
                                type="button"
                            >
                                Agendar
                            </button>
                        </div>
                    </div>
                </div>
                <div className="group flip-card flip-card-group flex-shrink-0 w-full max-w-sm cursor-pointer">
                    <div className="flip-card-inner">
                        <div className="flip-card-front bg-forest border border-gold-accent/30">
                            <img src={serviceCardImage08} alt="Manicure" className="w-full h-full object-cover opacity-70 grayscale group-hover:grayscale-0 transition duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-t from-forest via-transparent to-transparent opacity-90"></div>
                            <div className="absolute bottom-8 left-0 w-full text-center">
                                <h3 className="text-2xl font-serif text-gold italic"><RichText value={c8FrontLabel} /></h3>
                                <p className="text-white text-xs tracking-widest mt-2 uppercase"><RichText value={c8FrontTagline} /></p>
                            </div>
                        </div>
                        <div className="flip-card-back bg-forest-green border border-gold-accent/60 p-6 flex flex-col justify-center items-center text-center">
                            <h3 className="text-xl font-serif text-gold mb-3"><RichText value={c8BackLabel} /></h3>
                            <p className="text-gray-200 text-xs leading-relaxed mb-5"><RichText value={c8BackDesc} /></p>
                            <button
                                className="inline-flex items-center justify-center px-6 py-2 text-xs font-bold uppercase tracking-widest rounded-full border border-gold-accent text-gold hover:bg-gold-accent hover:text-forest transition-colors"
                                data-open-concierge
                                data-concierge-label="Nails"
                                data-concierge-category="Manicure & Pedicure"
                                data-concierge-service="Manicure + Pedicure"
                                type="button"
                            >
                                Agendar
                            </button>
                        </div>
                    </div>
                </div>
                <div className="group flip-card flip-card-group flex-shrink-0 w-full max-w-sm cursor-pointer">
                    <div className="flip-card-inner">
                        <div className="flip-card-front bg-forest border border-gold-accent/30">
                            <img src={serviceCardImage09} alt="Depilação" className="w-full h-full object-cover opacity-70 grayscale group-hover:grayscale-0 transition duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-t from-forest via-transparent to-transparent opacity-90"></div>
                            <div className="absolute bottom-8 left-0 w-full text-center">
                                <h3 className="text-2xl font-serif text-gold italic"><RichText value={c9FrontLabel} /></h3>
                                <p className="text-white text-xs tracking-widest mt-2 uppercase"><RichText value={c9FrontTagline} /></p>
                            </div>
                        </div>
                        <div className="flip-card-back bg-forest-green border border-gold-accent/60 p-6 flex flex-col justify-center items-center text-center">
                            <h3 className="text-xl font-serif text-gold mb-3"><RichText value={c9BackLabel} /></h3>
                            <p className="text-gray-200 text-xs leading-relaxed mb-5"><RichText value={c9BackDesc} /></p>
                            <button
                                className="inline-flex items-center justify-center px-6 py-2 text-xs font-bold uppercase tracking-widest rounded-full border border-gold-accent text-gold hover:bg-gold-accent hover:text-forest transition-colors"
                                data-open-concierge
                                data-concierge-label="Smooth"
                                data-concierge-category="Depilacao"
                                data-concierge-service="Depilacao Axilas"
                                type="button"
                            >
                                Agendar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
    {isCatalogModalOpen ? (
      <div
        className="fixed inset-0 z-[80] flex items-center justify-center bg-black/65 backdrop-blur-md px-3 py-4 sm:px-5 sm:py-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="services-catalog-modal-title"
        onClick={closeCatalogModal}
      >
        <div
          className="relative mx-auto flex w-full max-w-4xl min-h-0 max-h-[88vh] sm:max-h-[84vh] flex-col overflow-hidden rounded-[1.75rem] border border-gold-accent/40 bg-gradient-to-b from-[#07160f]/95 via-[#0b2016]/95 to-[#102a1d]/95 shadow-[0_25px_80px_rgba(0,0,0,0.55)]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="pointer-events-none absolute -left-8 top-8 h-28 w-28 rounded-full bg-gold-accent/10 blur-2xl" />
          <div className="pointer-events-none absolute -right-10 bottom-12 h-36 w-36 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative flex items-start justify-between gap-4 border-b border-gold-accent/20 px-5 py-5 sm:px-7">
            <div>
              <p className="text-[11px] tracking-[0.25em] uppercase text-gold/80">Menu Completo</p>
              <h3
                className="mt-2 text-2xl sm:text-3xl font-serif italic text-gold leading-tight"
                id="services-catalog-modal-title"
              >
                Tratamentos por Categoria
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-white/75 max-w-2xl">
                Explore todas as categorias e veja os serviços com duração e valor estimado.
              </p>
            </div>
            <button
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gold-accent/35 bg-white/5 text-gold hover:bg-gold-accent/10 transition-colors"
              type="button"
              onClick={closeCatalogModal}
              aria-label="Fechar menu completo"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="relative min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
            {catalogLoadState === "loading" ? (
              <div className="grid gap-3">
                {[0, 1, 2, 3].map((index) => (
                  <div
                    className="rounded-2xl border border-gold-accent/15 bg-white/5 p-4 animate-pulse"
                    key={`services-catalog-skeleton-${index}`}
                  >
                    <div className="h-4 w-40 rounded bg-white/10" />
                    <div className="mt-3 h-3 w-56 rounded bg-white/10" />
                  </div>
                ))}
              </div>
            ) : null}

            {catalogLoadState === "error" ? (
              <div className="rounded-2xl border border-red-300/20 bg-red-500/10 px-4 py-4 text-sm text-red-100">
                <p>{catalogErrorMessage || "Não foi possível carregar o menu no momento."}</p>
                <button
                  className="mt-3 inline-flex items-center rounded-full border border-gold-accent/40 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gold hover:bg-gold-accent/10 transition-colors"
                  type="button"
                  onClick={retryCatalogLoad}
                >
                  Tentar novamente
                </button>
              </div>
            ) : null}

            {catalogLoadState === "success" && catalogCategories.length === 0 ? (
              <div className="rounded-2xl border border-gold-accent/15 bg-white/5 px-4 py-4 text-sm text-white/80">
                Nenhum serviço ativo foi encontrado no catálogo.
              </div>
            ) : null}

            {catalogLoadState === "success" && catalogCategories.length > 0 ? (
              <div className="space-y-3">
                {catalogCategories.map((category) => {
                  const isOpen = activeCategoryId === category.id;
                  const panelId = `services-category-panel-${category.id}`;
                  return (
                    <div
                      className="overflow-hidden rounded-2xl border border-gold-accent/15 bg-white/[0.03] backdrop-blur-sm"
                      key={category.id}
                    >
                      <button
                        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left hover:bg-white/[0.03] transition-colors"
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        onClick={() => toggleCategory(category.id)}
                      >
                        <div className="min-w-0">
                          <p className="text-sm sm:text-base font-semibold text-white">{category.name}</p>
                          <p className="mt-1 text-[11px] sm:text-xs uppercase tracking-wider text-gold/80">
                            {category.services.length} serviço{category.services.length > 1 ? "s" : ""}
                          </p>
                        </div>
                        <span
                          className={`material-symbols-outlined text-gold transition-transform ${
                            isOpen ? "rotate-180" : ""
                          }`}
                          aria-hidden="true"
                        >
                          expand_more
                        </span>
                      </button>

                      {isOpen ? (
                        <div className="border-t border-gold-accent/10 px-4 pb-3 pt-2" id={panelId}>
                          <ul className="space-y-2">
                            {category.services.map((service) => (
                              <li
                                className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5"
                                key={service.id}
                              >
                                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                  <p className="text-sm text-white leading-tight">{service.name}</p>
                                  <p className="text-xs text-gold/90 font-medium">
                                    {formatServicePrice(service.price)}
                                  </p>
                                </div>
                                <p className="mt-1 text-[11px] uppercase tracking-wider text-white/60">
                                  {formatServiceDuration(service.durationMin)}
                                </p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div className="border-t border-gold-accent/20 px-5 py-4 sm:px-7">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] sm:text-xs text-white/60">
                Catálogo informativo. Valores e disponibilidade podem variar por unidade e agenda.
              </p>
              <button
                className="inline-flex items-center justify-center rounded-full border border-gold-accent/35 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gold hover:bg-gold-accent/10 transition-colors"
                type="button"
                onClick={closeCatalogModal}
              >
                Fechar Menu
              </button>
            </div>
          </div>
        </div>
      </div>
    ) : null}
    </>
  );
};
