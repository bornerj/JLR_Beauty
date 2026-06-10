import { useEffect, useMemo, useState, type MouseEvent, type ReactElement } from "react";
import { addCartItem } from "../../cart/store";
import { useBranding } from "../branding.runtime";

type PublicProductRow = {
  id: number;
  name: string;
  description?: string | null;
  sku?: string | null;
  price: number | string;
  imageUrl?: string | null;
  benefits?: string[] | null;
  isFeatured?: boolean | null;
};

const API_URL = import.meta.env.VITE_API_URL || "";
const FALLBACK_IMAGE_URL = "/images/products/jlr_argan.webp";
const MAX_COLLECTION_ITEMS = 8;

const getApiOrigin = (): string => {
  try {
    return new URL(API_URL).origin;
  } catch {
    return API_URL;
  }
};

const resolveProductImageUrl = (value?: string | null): string => {
  if (!value) return FALLBACK_IMAGE_URL;
  const trimmed = value.trim();
  if (!trimmed) return FALLBACK_IMAGE_URL;
  if (trimmed.startsWith("data:")) return trimmed;
  if (trimmed.startsWith("/images/")) return trimmed;
  if (trimmed.startsWith("/uploads/")) return `${getApiOrigin()}${trimmed}`;
  if (trimmed.startsWith("uploads/")) return `${getApiOrigin()}/${trimmed}`;
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
        return `${getApiOrigin()}${parsed.pathname}${parsed.search}`;
      }
      return trimmed;
    } catch {
      return trimmed;
    }
  }
  return trimmed;
};

const parsePrice = (value: number | string): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatPrice = (value: number | string): string =>
  parsePrice(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const parseBenefits = (value: unknown): string[] => {
  if (typeof value === "string") {
    const normalized = value.trim();
    if (!normalized) return [];
    if (normalized.startsWith("[") && normalized.endsWith("]")) {
      try {
        const parsed = JSON.parse(normalized) as unknown;
        return parseBenefits(parsed);
      } catch {
        return [];
      }
    }
    return normalized
      .split(/\r?\n|[;,|]/g)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
};

const parsePublicProducts = (payload: unknown): PublicProductRow[] => {
  if (!Array.isArray(payload)) return [];
  return payload
    .map((row): PublicProductRow | null => {
      if (!row || typeof row !== "object") return null;
      const entry = row as Record<string, unknown>;
      const id = Number(entry.id);
      const name = typeof entry.name === "string" ? entry.name.trim() : "";
      const price = entry.price;
      if (!Number.isFinite(id) || !name) return null;
      if (typeof price !== "number" && typeof price !== "string") return null;

      return {
        id,
        name,
        description: typeof entry.description === "string" ? entry.description : null,
        sku: typeof entry.sku === "string" ? entry.sku : null,
        price,
        imageUrl: typeof entry.imageUrl === "string" ? entry.imageUrl : null,
        benefits: parseBenefits(entry.benefits),
        isFeatured: typeof entry.isFeatured === "boolean" ? entry.isFeatured : false,
      };
    })
    .filter((row): row is PublicProductRow => Boolean(row));
};

export const HomeProductsSection = (): ReactElement => {
  const branding = useBranding();
  const [products, setProducts] = useState<PublicProductRow[]>([]);
  const [spotlightId, setSpotlightId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [brokenImages, setBrokenImages] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const abort = new AbortController();

    const loadProducts = async (): Promise<void> => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`${API_URL}/api/public/products`, { signal: abort.signal });
        if (!response.ok) {
          throw new Error("Falha ao carregar produtos.");
        }
        const payload: unknown = await response.json();
        const parsed = parsePublicProducts(payload);
        setProducts(parsed);
        setBrokenImages({});
        const featured = parsed.find((product) => Boolean(product.isFeatured));
        setSpotlightId(featured?.id ?? parsed[0]?.id ?? null);
      } catch (fetchError) {
        if (abort.signal.aborted) return;
        setProducts([]);
        setSpotlightId(null);
        setError(fetchError instanceof Error ? fetchError.message : "Falha ao carregar produtos.");
      } finally {
        if (!abort.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadProducts().catch(() => undefined);

    return () => {
      abort.abort();
    };
  }, []);

  const spotlight = useMemo(() => {
    if (!products.length) return null;
    if (spotlightId === null) return products[0];
    return products.find((product) => product.id === spotlightId) ?? products[0];
  }, [products, spotlightId]);

  const collection = useMemo(() => {
    if (!products.length || !spotlight) return [];
    return products.filter((product) => product.id !== spotlight.id).slice(0, MAX_COLLECTION_ITEMS);
  }, [products, spotlight]);

  const spotlightBenefits = spotlight?.benefits?.length
    ? spotlight.benefits
    : [`Produto premium da linha ${branding.fullName}.`];

  const spotlightImageSrc = spotlight && !brokenImages[spotlight.id]
    ? resolveProductImageUrl(spotlight.imageUrl)
    : FALLBACK_IMAGE_URL;

  const openCartModal = (): void => {
    window.dispatchEvent(new CustomEvent("jlr:open-cart"));
  };

  const handleAddProductToCart = (
    product: PublicProductRow | null | undefined,
    event: MouseEvent<HTMLButtonElement>
  ): void => {
    event.preventDefault();
    event.stopPropagation();
    if (!product) return;
    addCartItem({
      itemType: "PRODUCT",
      entityId: product.id,
      name: product.name,
      subtitle: product.sku || product.description || null,
      imageUrl: resolveProductImageUrl(product.imageUrl),
      price: product.price,
      quantity: 1,
    });
    openCartModal();
  };

  return (
    <>
      <section className="py-8 px-6 bg-white dark:bg-[#12241a] border-t border-b border-champagne/50 dark:border-white/5" id="products">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-4 gap-6">
            <div>
              <h2 className="text-gold text-sm display-label mb-3">Luxo em Casa</h2>
              <h3 className="text-3xl md:text-5xl display-hero text-shadow-strong text-primary dark:text-white">Produtos em Destaque</h3>
            </div>
            <a className="hidden md:inline-flex items-center gap-2 text-forest dark:text-white font-medium hover:text-gold transition-colors group" href="#spotlightprod">
              <span>Ver Todos os Produtos</span>
              <span className="material-symbols-outlined text-gold group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </a>
          </div>
          <div className="mt-4 text-center md:hidden">
            <a className="inline-flex items-center gap-2 text-forest dark:text-white font-medium hover:text-gold transition-colors group" href="#spotlightprod">
              <span>Ver Todos os Produtos</span>
              <span className="material-symbols-outlined text-gold group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </a>
          </div>
        </div>
      </section>

      <section className="w-full flex flex-col items-center pt-6">
        <div className="w-full max-w-7xl px-6 lg:px-8 py-6 lg:py-10 bg-[#f0f7f2]" id="spotlightprod">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 ">
            <div className="flex flex-col gap-6 " id="spotleft">
              <div className="aspect-[4/5] w-full rounded-lg overflow-hidden dark:bg-[#1a2e22] group relative">
                <img
                  src={spotlightImageSrc}
                  alt={spotlight?.name || "Produto em destaque"}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  onError={() => {
                    if (!spotlight) return;
                    setBrokenImages((previous) => ({ ...previous, [spotlight.id]: true }));
                  }}
                />
                <div className="absolute bottom-4 right-4 bg-white/80 dark:bg-black/60 backdrop-blur px-3 py-1 rounded text-xs font-medium uppercase tracking-wider">
                  {spotlight?.isFeatured ? "Destaque" : "Novo"}
                </div>
              </div>
            </div>

            <div className="flex flex-col h-full justify-center" id="Spotright">
              <h1 className="text-4xl lg:text-5xl display-hero text-shadow-strong text-gray-900 dark:text-white leading-[1.1] mb-4">
                {spotlight?.name || `Produtos ${branding.fullName}`}
              </h1>
              <div className="flex items-center gap-6 mb-8 border-b border-[#e7f3eb] dark:border-[#1e3a29] pb-6" id="spotheadline">
                <span className="text-2xl font-medium text-gray-900 dark:text-white">
                  {spotlight ? formatPrice(spotlight.price) : "R$ 0,00"}
                </span>
                <div className="h-6 w-px bg-primary dark:bg-gray-700" />
                <div className="flex items-center gap-2">
                  <div className="flex text-primary">
                    <span className="material-symbols-outlined fill text-[18px]">star</span>
                    <span className="material-symbols-outlined fill text-[18px]">star</span>
                    <span className="material-symbols-outlined fill text-[18px]">star</span>
                    <span className="material-symbols-outlined fill text-[18px]">star</span>
                    <span className="material-symbols-outlined fill text-[18px]">star_half</span>
                  </div>
                  <span className="text-sm underline underline-offset-4 cursor-pointer hover:text-primary">{`Curadoria ${branding.shortName}`}</span>
                </div>
              </div>

              <div className="space-y-6" id="spotlightdescription">
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed font-light">
                  {spotlight?.description || "Selecione um produto para visualizar os detalhes."}
                </p>
                <ul className="space-y-4" id="spotlightbenefits">
                  {spotlightBenefits.map((benefit) => (
                    <li className="flex items-start gap-3" key={benefit}>
                      <div className="flex-shrink-0 mt-1">
                        <span className="material-symbols-outlined text-gold-accent mt-0.5">check_circle</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">{benefit}</h4>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="pt-6 flex flex-col gap-4">
                  <div className="flex gap-4">
                    <div className="w-24 border border-[#e7f3eb] dark:border-[#2a4e38] rounded-lg flex items-center justify-between px-3 bg-white dark:bg-[#152b1e]">
                      <button className="text-gray-500 hover:text-primary" type="button">-</button>
                      <span className="font-medium text-gray-900 dark:text-white">1</span>
                      <button className="text-gray-500 hover:text-primary" type="button">+</button>
                    </div>
                    <button
                      className="flex-1 bg-primary hover:bg-[#0da640] text-white h-12 rounded-lg font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                      onClick={(event) => handleAddProductToCart(spotlight, event)}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
                      {`Adicionar a Sacola - ${spotlight ? formatPrice(spotlight.price) : "R$ 0,00"}`}
                    </button>
                  </div>
                  <p className="text-xs text-center text-gray-400 mt-2">Frete gratis em pedidos acima de R$ 150,00. Devolucao em 30 dias.</p>
                  {loading ? <p className="text-xs text-center text-forest/70">Carregando produtos...</p> : null}
                  {!loading && error ? <p className="text-xs text-center text-red-600">{error}</p> : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div id="Colecao" className="w-full max-w-[1400px] px-6 lg:px-8 py-8 mx-auto">
          <div className="text-center pt-4 pb-2">
            <h1 className="font-bold text-4xl mb-4">Outros Produtos para seu conforto</h1>
            <h1 className="text-3xl">Coleção Completa</h1>
          </div>
          <section className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 justify-items-center gap-y-16 gap-x-10 mt-6 mb-5 px-2">
            {collection.map((product) => (
              <div className="w-full max-w-[20rem] bg-white shadow-lg rounded-2xl overflow-hidden duration-500 hover:scale-105 hover:shadow-xl" key={product.id}>
                <div
                  className="product-card-link cursor-pointer"
                  onClick={() => setSpotlightId(product.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSpotlightId(product.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <img
                    src={
                      brokenImages[product.id]
                        ? FALLBACK_IMAGE_URL
                        : resolveProductImageUrl(product.imageUrl)
                    }
                    alt={product.name}
                    className="h-72 sm:h-80 w-full object-cover rounded-t-2xl"
                    onError={() => {
                      setBrokenImages((previous) => ({ ...previous, [product.id]: true }));
                    }}
                  />
                  <div className="px-4 py-3 w-full">
                    <span className="text-gray-400 mr-3 uppercase text-xs">{branding.fullName}</span>
                    <p className="text-lg font-bold text-black truncate block capitalize">{product.name}</p>
                    <div className="flex items-center">
                      <p className="text-lg font-semibold text-black cursor-auto my-3">{formatPrice(product.price)}</p>
                      <button
                        type="button"
                        className="ml-auto text-gray-700 hover:text-primary transition-colors"
                        aria-label="Abrir carrinho"
                        onClick={(event) => handleAddProductToCart(product, event)}
                      >
                        <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
                      </button>
                    </div>
                    <ul className="space-y-1 min-h-[56px]">
                      {(product.benefits?.length
                        ? product.benefits.slice(0, 3)
                        : [product.description || `Produto premium da linha ${branding.fullName}.`]
                      ).map((benefit) => (
                        <li className="flex items-start gap-2" key={`${product.id}-${benefit}`}>
                          <span className="material-symbols-outlined text-gold-accent text-[14px] mt-0.5">
                            check_circle
                          </span>
                          <span className="text-xs text-gray-600 leading-snug line-clamp-2">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-xs text-gray-600 leading-snug line-clamp-2">
                      {product.description || `Produto premium da linha ${branding.fullName}.`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </section>
          {!loading && !collection.length ? (
            <p className="text-center text-sm text-forest/70">{products.length ? "Nao ha mais produtos para listar." : "Nenhum produto disponivel."}</p>
          ) : null}
        </div>
      </section>
    </>
  );
};
