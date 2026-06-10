import NavStatusActions from "./NavStatusActions";
import { useBranding } from "../../public-site/branding.runtime";
import { Link } from "react-router-dom";

export default function PublicMenu() {
  const branding = useBranding();

  return (
    <>
      <nav className="top-nav">
              <div id="menusuperior" className="top-nav__inner">
                  <Link className="brand-link group" to="/">
                      <div className="brand-mark">
                      <img alt={branding.fullName} className="brand-img" src={branding.logoUrl} />
                      </div>
                  </Link>
                  <div className="nav-links" id="submenu">
                      <div className="relative group">
                          <button className="nav-link menu-item flex items-center gap-2" type="button">
                              {branding.fullName}
                              <span className="material-symbols-outlined text-base">expand_more</span>
                          </button>
                          <div className="absolute left-0 top-full pt-3 w-[360px] opacity-0 invisible pointer-events-none group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto transition-all duration-200">
                              <div className="rounded-2xl bg-white shadow-2xl border border-forest/10 p-4">
                                  <div className="space-y-2">
                                      <Link className="menu-item flex items-start gap-3 rounded-xl px-3 py-3 hover:bg-white/10 transition-colors" to="/#services">
                                          <span className="size-10 rounded-xl bg-white/20 border border-gold/40 flex items-center justify-center text-forest">
                                              <span className="material-symbols-outlined text-lg">spa</span>
                                          </span>
                                          <div>
                                              <p className="text-sm font-semibold text-primary">Tratamentos</p>
                                              <p className="text-xs text-primary/80">Cuidados completos para cabelo, pele e bem-estar.</p>
                                          </div>
                                      </Link>
                                      <Link className="menu-item flex items-start gap-3 rounded-xl px-3 py-3 hover:bg-white/10 transition-colors" to="/assinaturas">
                                          <span className="size-10 rounded-xl bg-white/20 border border-gold/40 flex items-center justify-center text-forest">
                                              <span className="material-symbols-outlined text-lg">card_membership</span>
                                          </span>
                                          <div>
                                              <p className="text-sm font-semibold text-primary">Assinaturas</p>
                                              <p className="text-xs text-primary/80">Planos mensais com benefícios e economia.</p>
                                          </div>
                                      </Link>
                                      <Link className="menu-item flex items-start gap-3 rounded-xl px-3 py-3 hover:bg-white/10 transition-colors" to="/#about">
                                          <span className="size-10 rounded-xl bg-white/20 border border-gold/40 flex items-center justify-center text-forest">
                                              <span className="material-symbols-outlined text-lg">storefront</span>
                                          </span>
                                          <div>
                                              <p className="text-sm font-semibold text-primary">Quem Somos</p>
                                              <p className="text-xs text-primary/80">Nossa história, propósito e experiência.</p>
                                          </div>
                                      </Link>
                                      <Link className="menu-item flex items-start gap-3 rounded-xl px-3 py-3 hover:bg-white/10 transition-colors" to="/#testimonials">
                                          <span className="size-10 rounded-xl bg-white/20 border border-gold/40 flex items-center justify-center text-forest">
                                              <span className="material-symbols-outlined text-lg">reviews</span>
                                          </span>
                                          <div>
                                              <p className="text-sm font-semibold text-primary">Depoimentos</p>
                                              <p className="text-xs text-primary/80">O que nossas clientes dizem.</p>
                                          </div>
                                      </Link>
                                  </div>
                                  <div className="mt-4 flex gap-2 border-t border-gold/30 pt-3">
                                      <Link className="menu-item menu-item-btn flex-1 text-center text-[11px] font-bold uppercase tracking-widest py-2 rounded-lg bg-gold text-black hover:bg-gold/90 transition-colors" to="/">{branding.shortName}</Link>
                                      <Link className="menu-item flex-1 text-center text-[11px] font-bold uppercase tracking-widest py-2 rounded-lg border border-gold/60 text-forest hover:bg-gold/10 transition-colors" to="/#contact">Contato</Link>
                                  </div>
                              </div>
                          </div>
                      </div>

                      <Link className="nav-link menu-item" to="/assinaturas">ASSINATURAS</Link>
      
                      <Link className="nav-link menu-item" to="/franquias">Franquias</Link>
      
                      <div className="relative group">
                          <button className="nav-link menu-item flex items-center gap-2" type="button">
                              Produtos
                              <span className="material-symbols-outlined text-base">expand_more</span>
                          </button>
                          <div className="absolute left-0 top-full pt-3 w-[360px] opacity-0 invisible pointer-events-none group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto transition-all duration-200">
                              <div className="rounded-2xl bg-white shadow-2xl border border-forest/10 p-4">
                                  <div className="space-y-2">
                                      <Link className="menu-item flex items-start gap-3 rounded-xl px-3 py-3 hover:bg-white/10 transition-colors" to="/#spotlightprod">
                                          <span className="size-10 rounded-xl bg-white/20 border border-gold/40 flex items-center justify-center text-forest">
                                              <span className="material-symbols-outlined text-lg">stars</span>
                                          </span>
                                          <div>
                                              <p className="text-sm font-semibold text-primary">Destaque</p>
                                              <p className="text-xs text-primary/80">Produto premium em evidência.</p>
                                          </div>
                                      </Link>
                                      <Link className="menu-item flex items-start gap-3 rounded-xl px-3 py-3 hover:bg-white/10 transition-colors" to="/#Colecao">
                                          <span className="size-10 rounded-xl bg-white/20 border border-gold/40 flex items-center justify-center text-forest">
                                              <span className="material-symbols-outlined text-lg">view_cozy</span>
                                          </span>
                                          <div>
                                              <p className="text-sm font-semibold text-primary">Colecao</p>
                                              <p className="text-xs text-primary/80">Linhas completas para cada necessidade.</p>
                                          </div>
                                      </Link>
                                      <a className="menu-item flex items-start gap-3 rounded-xl px-3 py-3 hover:bg-white/10 transition-colors" href="#" data-open-lymp-video>
                                          <span className="size-10 rounded-xl bg-white/20 border border-gold/40 flex items-center justify-center text-forest">
                                              <span className="material-symbols-outlined text-lg">menu_book</span>
                                          </span>
                                          <div>
                                              <p className="text-sm font-semibold text-primary">Como Usar Lymp Clean</p>
                                              <p className="text-xs text-primary/80">Solução de Limpeza para pincéis</p>
                                          </div>
                                      </a>
                                      <a className="menu-item flex items-start gap-3 rounded-xl px-3 py-3 hover:bg-white/10 transition-colors" href="#" data-open-freepee-video>
                                          <span className="size-10 rounded-xl bg-white/20 border border-gold/40 flex items-center justify-center text-forest">
                                              <span className="material-symbols-outlined text-lg">play_circle</span>
                                          </span>
                                          <div>
                                              <p className="text-sm font-semibold text-primary">Como usar o FreePee GO</p>
                                              <p className="text-xs text-primary/80">Direcionador para Mulheres</p>
                                          </div>
                                      </a>
                                      <a className="menu-item flex items-start gap-3 rounded-xl px-3 py-3 hover:bg-white/10 transition-colors" href="#" data-open-nutri-video>
                                          <span className="size-10 rounded-xl bg-white/20 border border-gold/40 flex items-center justify-center text-forest">
                                              <span className="material-symbols-outlined text-lg">play_circle</span>
                                          </span>
                                          <div>
                                              <p className="text-sm font-semibold text-primary">Como usar Nutri Cutis</p>
                                              <p className="text-xs text-primary/80">Oleo para Cuticulas</p>
                                          </div>
                                      </a>
                                  </div>
                                  <div className="mt-4 flex gap-2 border-t border-gold/30 pt-3">
                                      <Link className="menu-item menu-item-btn flex-1 text-center text-[11px] font-bold uppercase tracking-widest py-2 rounded-lg bg-gold text-black hover:bg-gold/90 transition-colors" to="/#products">Ver Produtos</Link>
                                      <Link className="menu-item flex-1 text-center text-[11px] font-bold uppercase tracking-widest py-2 rounded-lg border border-gold/60 text-black hover:bg-gold/10 transition-colors" to="/#spotlightprod">Lancar</Link>
                                  </div>
                              </div>
                          </div>
                      </div>
      
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4">
                      <NavStatusActions
                        mobileMenuTrigger={(
                          <details className="lg:hidden relative">
                            <summary className="nav-toggle list-none cursor-pointer rounded-full border border-forest/15 bg-white/95 shadow-md">
                              <span className="material-symbols-outlined">menu</span>
                            </summary>
                            <div
                              id="public-mobile-menu"
                              className="fixed left-4 right-4 top-24 z-[80] bg-white border border-[#e7f3eb] rounded-2xl shadow-xl max-h-[70vh] overflow-y-auto"
                            >
                              <div className="px-5 py-4 flex flex-col gap-3">
                                <Link className="nav-link menu-item" to="/#services">Tratamentos</Link>
                                <Link className="nav-link menu-item" to="/assinaturas">Assinaturas</Link>
                                <Link className="nav-link menu-item" to="/franquias">Franquias</Link>
                                <Link className="nav-link menu-item" to="/#products">Produtos</Link>
                                <Link className="nav-link menu-item" to="/#spotlightprod">Produto em destaque</Link>
                                <Link className="nav-link menu-item" to="/#Colecao">Colecao completa</Link>
                                <Link className="nav-link menu-item" to="/#contact">Contato</Link>
                              </div>
                            </div>
                          </details>
                        )}
                      />
                  </div>
              </div>
          </nav>
    </>
  );
}

