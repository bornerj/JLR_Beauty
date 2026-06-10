import type { Cleanup } from "../../shared/dom";
import { on, onAll } from "../../shared/dom";
import {
  clearAuth,
  consumeAccessDeniedNotice,
  consumeLoginRequest,
  getUser,
  login,
  requestLoginModal,
  register,
} from "../../lib/auth";
import { resolveUploadedAssetUrl } from "../../lib/assetUrls";
import { setAuthNavUser } from "./auth.behavior";
import { getBrandingSnapshot } from "./branding.runtime";
import {
  fetchChatbotPublicJson,
  postChatbotPublicJson,
  type ConciergeBookingContext,
  type ConciergeDateOption,
  type ConciergePeriodOption,
  type ConciergeProfessionalOption,
  type ConciergeServiceCategory,
  type ConciergeServiceOption,
  type ConciergeSlotOption,
  type ConciergeUnitOption,
} from "../chatbot";
import {
  addCartItem,
  formatCartCurrency,
  getCartQuantity,
  getCartSubtotal,
  readCart,
  removeCartItem,
  setCartItemQuantity,
  type CartItem,
} from "../cart/store";

export function initIndexPage(): Cleanup {
  const cleanups: Cleanup[] = [];
  const add = (cleanup: Cleanup) => cleanups.push(cleanup);

  const openCheckoutModal = () => {
    window.dispatchEvent(new CustomEvent("jlr:open-checkout"));
  };

  const cartModal = document.getElementById("cart-modal");
  const openCart = document.getElementById("open-cart");
  const closeCart = document.getElementById("close-cart");
  const cartBackdrop = document.getElementById("cart-backdrop");
  const cartIcon = document.getElementById("open-cart-icon");
  const cartPayNowButton = document.querySelector("[data-cart-pay-now]") as
    | HTMLButtonElement
    | null;
  const cartCount = document.querySelector("[data-cart-count]") as HTMLElement | null;
  const cartItemsContainer = document.querySelector("[data-cart-items]") as HTMLElement | null;
  const cartEmptyState = document.querySelector("[data-cart-empty]") as HTMLElement | null;
  const cartSubtotal = document.querySelector("[data-cart-subtotal]") as HTMLElement | null;
  const cartFreeShippingRemaining = document.querySelector(
    "[data-cart-free-shipping-remaining]"
  ) as HTMLElement | null;
  const cartFreeShippingText = document.querySelector("[data-cart-freeship-text]") as
    | HTMLElement
    | null;
  const cartFreeShippingProgress = document.querySelector(
    "[data-cart-free-shipping-progress]"
  ) as HTMLElement | null;
  const DEFAULT_FREE_SHIPPING_THRESHOLD = 150;
  const CHECKOUT_POLICY_API_URL = import.meta.env.VITE_API_URL || "";
  let freeShippingThreshold = DEFAULT_FREE_SHIPPING_THRESHOLD;
  const DEFAULT_CART_IMAGE = "/images/products/jlr_argan.webp";

  const escapeHtml = (value: string): string =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const buildCartItemLabel = (item: CartItem): string =>
    item.itemType === "MEMBERSHIP" ? "Assinatura" : "Produto";

  const getCartItemImage = (item: CartItem): string =>
    resolveUploadedAssetUrl(item.imageUrl) || DEFAULT_CART_IMAGE;

  const renderCartItems = (items: CartItem[]): void => {
    if (!cartItemsContainer) return;

    if (!items.length) {
      cartItemsContainer.innerHTML = "";
      if (cartEmptyState) cartEmptyState.classList.remove("hidden");
      return;
    }

    if (cartEmptyState) cartEmptyState.classList.add("hidden");
    cartItemsContainer.innerHTML = items
      .map((item) => {
        const lineTotal = item.price * item.quantity;
        return `
          <div class="flex gap-4">
            <div class="w-20 h-24 flex-shrink-0 bg-[#eef4f0] rounded overflow-hidden border border-gold-accent/10">
              <img class="w-full h-full object-cover bg-center" src="${escapeHtml(
                getCartItemImage(item)
              )}" alt="${escapeHtml(item.name)}" />
            </div>
            <div class="flex-1 flex flex-col justify-between py-1">
              <div>
                <div class="flex items-start justify-between gap-4">
                  <h3 class="text-base display-title text-forest-green dark:text-white leading-tight">${escapeHtml(
                    item.name
                  )}</h3>
                  <span class="text-sm font-medium text-forest-green dark:text-white">${formatCartCurrency(
                    lineTotal
                  )}</span>
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 font-sans">${escapeHtml(
                  item.subtitle || buildCartItemLabel(item)
                )}</p>
              </div>
              <div class="flex justify-between items-end mt-2">
                <div class="flex items-center border border-gold-accent/30 rounded bg-white dark:bg-[#102216]">
                  <button class="px-2 py-0.5 text-gray-500 hover:text-forest-green text-xs" type="button" data-cart-action="decrease" data-cart-item-key="${escapeHtml(
                    item.key
                  )}">-</button>
                  <span class="px-2 text-xs font-medium min-w-[1.5rem] text-center">${item.quantity}</span>
                  <button class="px-2 py-0.5 text-gray-500 hover:text-forest-green text-xs" type="button" data-cart-action="increase" data-cart-item-key="${escapeHtml(
                    item.key
                  )}">+</button>
                </div>
                <button class="text-xs text-gray-400 underline hover:text-red-500 transition-colors" type="button" data-cart-action="remove" data-cart-item-key="${escapeHtml(
                  item.key
                )}">Remover</button>
              </div>
            </div>
          </div>
        `;
      })
      .join('<div class="border-t border-gold-accent/10"></div>');
  };

  const renderCartSummary = (items: CartItem[]): void => {
    const subtotal = getCartSubtotal(items);
    const totalQuantity = getCartQuantity(items);
    if (cartCount) cartCount.textContent = String(totalQuantity);
    if (cartSubtotal) cartSubtotal.textContent = formatCartCurrency(subtotal);

    const remaining = Math.max(0, freeShippingThreshold - subtotal);
    if (cartFreeShippingRemaining) {
      cartFreeShippingRemaining.textContent = formatCartCurrency(remaining);
    }
    if (cartFreeShippingText) {
      cartFreeShippingText.innerHTML =
        remaining > 0
          ? `Gaste <span class="font-bold" data-cart-free-shipping-remaining>${formatCartCurrency(
              remaining
            )}</span> a mais para frete gratis`
          : "Você ganhou frete grátis!";
    }
    if (cartFreeShippingProgress) {
      const percent =
        freeShippingThreshold <= 0
          ? 100
          : Math.max(0, Math.min(100, (subtotal / freeShippingThreshold) * 100));
      cartFreeShippingProgress.style.width = `${percent}%`;
    }
    if (cartPayNowButton) {
      const disabled = totalQuantity <= 0;
      cartPayNowButton.disabled = disabled;
      cartPayNowButton.classList.toggle("opacity-50", disabled);
      cartPayNowButton.classList.toggle("cursor-not-allowed", disabled);
    }
  };

  const renderCart = (): void => {
    const items = readCart();
    renderCartItems(items);
    renderCartSummary(items);
  };

  const loadCartShippingPolicy = async (): Promise<void> => {
    try {
      const response = await fetch(`${CHECKOUT_POLICY_API_URL}/api/public/checkout/shipping-policy`);
      if (!response.ok) return;
      const payload = (await response.json()) as {
        policy?: { freeShippingThreshold?: number };
      };
      const threshold = Number(payload?.policy?.freeShippingThreshold);
      if (Number.isFinite(threshold) && threshold >= 0) {
        freeShippingThreshold = threshold;
        renderCart();
      }
    } catch {
      // keep default threshold when policy endpoint is unavailable
    }
  };

  const openCartModal = () => {
    if (!cartModal) {
      window.location.href = "/?cart=1";
      return;
    }
    cartModal.classList.remove("hidden");
    document.body.classList.add("overflow-hidden");
    if (cartIcon) {
      cartIcon.textContent = "add_shopping_cart";
    }
  };

  const closeModal = () => {
    cartModal?.classList.add("hidden");
    document.body.classList.remove("overflow-hidden");
    if (cartIcon) {
      cartIcon.textContent = "shopping_cart";
    }
  };

  add(
    on(openCart, "click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openCartModal();
    })
  );
  add(
    on(window, "jlr:open-cart", () => {
      renderCart();
      openCartModal();
    })
  );
  add(on(closeCart, "click", closeModal));
  add(on(cartBackdrop, "click", closeModal));
  add(
    on(cartItemsContainer, "click", (event) => {
      const target = event.target as HTMLElement | null;
      const actionButton = target?.closest("[data-cart-action]") as HTMLButtonElement | null;
      if (!actionButton) return;
      const itemKey = actionButton.getAttribute("data-cart-item-key") || "";
      const action = actionButton.getAttribute("data-cart-action");
      if (!itemKey || !action) return;
      const current = readCart().find((item) => item.key === itemKey);
      if (!current) return;

      if (action === "increase") {
        setCartItemQuantity(itemKey, current.quantity + 1);
      } else if (action === "decrease") {
        setCartItemQuantity(itemKey, current.quantity - 1);
      } else if (action === "remove") {
        removeCartItem(itemKey);
      }
      renderCart();
    })
  );
  add(
    on(window, "jlr:cart-updated", () => {
      renderCart();
    })
  );
  add(
    on(cartPayNowButton, "click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (getCartQuantity(readCart()) <= 0) return;
      closeModal();
      openCheckoutModal();
    })
  );
  add(
    on(document, "keydown", (event) => {
      if (
        event instanceof KeyboardEvent &&
        event.key === "Escape" &&
        cartModal &&
        !cartModal.classList.contains("hidden")
      ) {
        closeModal();
      }
    })
  );
  if (cartModal) {
    renderCart();
    void loadCartShippingPolicy();
    const currentParams = new URLSearchParams(window.location.search);
    if (currentParams.get("cart") === "1") {
      openCartModal();
      currentParams.delete("cart");
      const nextQuery = currentParams.toString();
      const nextUrl = nextQuery
        ? `${window.location.pathname}?${nextQuery}`
        : window.location.pathname;
      window.history.replaceState({}, "", nextUrl);
    }
  }

  const loginModal = document.getElementById("loginModal");
  const signupModal = document.getElementById("signupModal");
  const loginBackdrop = document.getElementById("login-backdrop");
  const signupBackdrop = document.getElementById("signup-backdrop");

  const closeAuthModal = (modalId: string) => {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add("hidden");
    document.body.classList.remove("overflow-hidden");
    clearAuthErrors();
    if (modalId === "loginModal") {
      if (loginEmailInput) loginEmailInput.value = "";
      if (loginPasswordInput) loginPasswordInput.value = "";
      if (loginPasswordInput) loginPasswordInput.type = "password";
      if (loginToggle) {
        const icon = loginToggle.querySelector(".material-symbols-outlined");
        if (icon) icon.textContent = "visibility";
        loginToggle.setAttribute("aria-label", "Mostrar senha");
      }
    }
    if (modalId === "signupModal") {
      if (registerNameInput) registerNameInput.value = "";
      if (registerEmailInput) registerEmailInput.value = "";
      if (registerPasswordInput) registerPasswordInput.value = "";
      if (registerPasswordInput) registerPasswordInput.type = "password";
      if (registerToggle) {
        const icon = registerToggle.querySelector(".material-symbols-outlined");
        if (icon) icon.textContent = "visibility";
        registerToggle.setAttribute("aria-label", "Mostrar senha");
      }
    }
  };

  const openAuthModal = (modalId: string) => {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove("hidden");
    document.body.classList.add("overflow-hidden");
  };

  const resetLoginPassword = () => {
    if (loginPasswordInput) loginPasswordInput.type = "password";
    if (loginToggle) {
      const icon = loginToggle.querySelector(".material-symbols-outlined");
      if (icon) icon.textContent = "visibility";
      loginToggle.setAttribute("aria-label", "Mostrar senha");
    }
  };

  const resetRegisterPassword = () => {
    if (registerPasswordInput) registerPasswordInput.type = "password";
    if (registerToggle) {
      const icon = registerToggle.querySelector(".material-symbols-outlined");
      if (icon) icon.textContent = "visibility";
      registerToggle.setAttribute("aria-label", "Mostrar senha");
    }
  };

  const openLoginModal = () => {
    if (!loginModal) {
      requestLoginModal();
      window.location.href = "/";
      return;
    }
    clearAuthErrors();
    resetLoginPassword();
    openAuthModal("loginModal");
  };
  const openSignupModal = () => {
    clearAuthErrors();
    resetRegisterPassword();
    openAuthModal("signupModal");
  };
  const switchToSignup = () => {
    clearAuthErrors();
    resetLoginPassword();
    if (loginEmailInput) loginEmailInput.value = "";
    if (loginPasswordInput) loginPasswordInput.value = "";
    closeAuthModal("loginModal");
    openAuthModal("signupModal");
  };
  const switchToLogin = () => {
    clearAuthErrors();
    resetRegisterPassword();
    if (registerNameInput) registerNameInput.value = "";
    if (registerEmailInput) registerEmailInput.value = "";
    if (registerPasswordInput) registerPasswordInput.value = "";
    closeAuthModal("signupModal");
    openAuthModal("loginModal");
  };

  const win = window as typeof window & {
    openLoginModal?: () => void;
    openSignupModal?: () => void;
    closeAuthModal?: (id: string) => void;
    switchToSignup?: () => void;
    switchToLogin?: () => void;
  };

  win.openLoginModal = openLoginModal;
  win.openSignupModal = openSignupModal;
  win.closeAuthModal = closeAuthModal;
  win.switchToSignup = switchToSignup;
  win.switchToLogin = switchToLogin;

  add(
    on(loginBackdrop, "click", () => {
      closeAuthModal("loginModal");
    })
  );
  add(
    on(signupBackdrop, "click", () => {
      closeAuthModal("signupModal");
    })
  );
  add(
    on(document, "keydown", (event) => {
      if (!(event instanceof KeyboardEvent) || event.key !== "Escape") return;
      if (loginModal && !loginModal.classList.contains("hidden")) {
        closeAuthModal("loginModal");
      }
      if (signupModal && !signupModal.classList.contains("hidden")) {
        closeAuthModal("signupModal");
      }
    })
  );

  const loginEmailInput = document.querySelector(
    "[data-auth-login-email]"
  ) as HTMLInputElement | null;
  const loginPasswordInput = document.querySelector(
    "[data-auth-login-password]"
  ) as HTMLInputElement | null;
  const loginSubmit = document.querySelector("[data-auth-login-submit]") as HTMLButtonElement | null;

  const registerNameInput = document.querySelector(
    "[data-auth-register-name]"
  ) as HTMLInputElement | null;
  const registerEmailInput = document.querySelector(
    "[data-auth-register-email]"
  ) as HTMLInputElement | null;
  const registerPasswordInput = document.querySelector(
    "[data-auth-register-password]"
  ) as HTMLInputElement | null;
  const registerSubmit = document.querySelector(
    "[data-auth-register-submit]"
  ) as HTMLButtonElement | null;

  const setBusy = (button: HTMLButtonElement | null, busy: boolean) => {
    if (!button) return;
    button.disabled = busy;
    button.classList.toggle("opacity-60", busy);
  };

  const loginError = document.querySelector("[data-auth-login-error]") as HTMLParagraphElement | null;
  const registerError = document.querySelector(
    "[data-auth-register-error]"
  ) as HTMLParagraphElement | null;
  const loginSuccess = document.querySelector(
    "[data-auth-login-success]"
  ) as HTMLParagraphElement | null;
  const registerSuccess = document.querySelector(
    "[data-auth-register-success]"
  ) as HTMLParagraphElement | null;

  const clearAuthErrors = () => {
    if (loginError) {
      loginError.textContent = "";
      loginError.classList.add("hidden");
    }
    if (registerError) {
      registerError.textContent = "";
      registerError.classList.add("hidden");
    }
    if (loginSuccess) {
      loginSuccess.textContent = "";
      loginSuccess.classList.add("hidden");
    }
    if (registerSuccess) {
      registerSuccess.textContent = "";
      registerSuccess.classList.add("hidden");
    }
  };

  const showAuthError = (target: "login" | "register", message: string) => {
    const el = target === "login" ? loginError : registerError;
    if (!el) return;
    const prefix = target === "login" ? "Login falhou: " : "Cadastro falhou: ";
    el.textContent = `${prefix}${message}`;
    el.classList.remove("hidden");
  };

  const showAuthSuccess = (target: "login" | "register", message: string) => {
    const el = target === "login" ? loginSuccess : registerSuccess;
    if (!el) return;
    const prefix = target === "login" ? "Login: " : "Cadastro: ";
    el.textContent = `${prefix}${message}`;
    el.classList.remove("hidden");
  };

  const togglePassword = (input: HTMLInputElement | null, button: HTMLButtonElement | null) => {
    if (!input || !button) return;
    const icon = button.querySelector(".material-symbols-outlined");
    const isHidden = input.type === "password";
    input.type = isHidden ? "text" : "password";
    if (icon) icon.textContent = isHidden ? "visibility_off" : "visibility";
    button.setAttribute("aria-label", isHidden ? "Ocultar senha" : "Mostrar senha");
  };

  const loginToggle = document.querySelector(
    '[data-auth-toggle="login"]'
  ) as HTMLButtonElement | null;
  const registerToggle = document.querySelector(
    '[data-auth-toggle="register"]'
  ) as HTMLButtonElement | null;

  if (loginToggle) {
    add(on(loginToggle, "click", () => togglePassword(loginPasswordInput, loginToggle)));
  }
  if (registerToggle) {
    add(on(registerToggle, "click", () => togglePassword(registerPasswordInput, registerToggle)));
  }

  const submitLoginOnEnter = (event: Event) => {
    if (!(event instanceof KeyboardEvent) || event.key !== "Enter") return;
    if (!loginModal || loginModal.classList.contains("hidden")) return;
    event.preventDefault();
    loginSubmit?.click();
  };
  add(on(loginEmailInput, "keydown", submitLoginOnEnter));
  add(on(loginPasswordInput, "keydown", submitLoginOnEnter));

  if (loginSubmit) {
    add(
      on(loginSubmit, "click", async () => {
        clearAuthErrors();
        const identifier = loginEmailInput?.value.trim() || "";
        const password = loginPasswordInput?.value.trim() || "";
        if (!identifier || !password) {
          showAuthError("login", "Informe email e senha.");
          return;
        }
        setBusy(loginSubmit, true);
        try {
          const user = await login(identifier, password);
          showAuthSuccess("login", "realizado com sucesso.");
          setAuthNavUser(user);
          if (loginEmailInput) loginEmailInput.value = "";
          if (loginPasswordInput) loginPasswordInput.value = "";
          setTimeout(() => {
            closeAuthModal("loginModal");
            if (user.role === "ADMIN" || user.role === "MASTER") {
              window.location.href = "/admin";
            }
          }, 600);
        } catch (error) {
          showAuthError("login", error instanceof Error ? error.message : "Falha no login.");
        } finally {
          setBusy(loginSubmit, false);
        }
      })
    );
  }

  if (registerSubmit) {
    add(
      on(registerSubmit, "click", async () => {
        clearAuthErrors();
        const name = registerNameInput?.value.trim() || "";
        const email = registerEmailInput?.value.trim() || "";
        const password = registerPasswordInput?.value.trim() || "";
        if (!name || !email || !password) {
          showAuthError("register", "Preencha nome, email e senha.");
          return;
        }
        setBusy(registerSubmit, true);
        try {
          await register(name, email, password);
          showAuthSuccess("register", "realizado com sucesso.");
          if (registerNameInput) registerNameInput.value = "";
          if (registerEmailInput) registerEmailInput.value = "";
          if (registerPasswordInput) registerPasswordInput.value = "";
          setTimeout(() => {
            clearAuth();
            closeAuthModal("signupModal");
            if (loginEmailInput) loginEmailInput.value = email;
            if (loginPasswordInput) loginPasswordInput.value = "";
            openAuthModal("loginModal");
          }, 800);
        } catch (error) {
          showAuthError(
            "register",
            error instanceof Error ? error.message : "Falha no cadastro."
          );
        } finally {
          setBusy(registerSubmit, false);
        }
      })
    );
  }

  const accessDeniedBanner = document.querySelector(
    "[data-access-denied-banner]"
  ) as HTMLElement | null;
  const accessDeniedClose = document.querySelector(
    "[data-access-denied-close]"
  ) as HTMLButtonElement | null;
  if (accessDeniedClose) {
    add(on(accessDeniedClose, "click", () => accessDeniedBanner?.classList.add("hidden")));
  }
  if (consumeAccessDeniedNotice() && accessDeniedBanner) {
    accessDeniedBanner.classList.remove("hidden");
  }

  if (consumeLoginRequest()) {
    openLoginModal();
  }

  setAuthNavUser(getUser());

  const spotlightImage = document.querySelector("[data-spotlight-image]") as HTMLElement | null;
  const spotlightTitle = document.querySelector("[data-spotlight-title]");
  const spotlightPrice = document.querySelector("[data-spotlight-price]");
  const spotlightDesc = document.querySelector("[data-spotlight-description]");
  const collectionImages = document.querySelectorAll("[data-collection-image]");

  const getSpotlightUrl = () => {
    if (!spotlightImage) return "";
    const bg =
      spotlightImage.style.backgroundImage ||
      getComputedStyle(spotlightImage).backgroundImage;
    const match = bg.match(/url\(["']?(.*?)["']?\)/);
    return match ? match[1] : "";
  };

  const setCompareText = (el: Element | null, value: string) => {
    if (!el) return;
    el.textContent = value || "";
    el.classList.toggle("hidden", !value);
  };

  if (spotlightImage && collectionImages.length) {
    add(
      onAll(collectionImages, "click", (event) => {
        event.preventDefault();
        const img = event.currentTarget as HTMLImageElement | null;
        if (!img) return;
        const card = img.closest(".product-card-link") as HTMLElement | null;
        if (!card) return;

        const cardTitleEl = card.querySelector("[data-card-title]");
        const cardPriceEl = card.querySelector("[data-card-price]");
        const cardCompareEl = card.querySelector("[data-card-compare]");

        const clickedSrc = img.getAttribute("src");
        const spotlightSrc = getSpotlightUrl();
        if (!clickedSrc || !spotlightSrc) return;

        const cardData = {
          title: card.dataset.productTitle || cardTitleEl?.textContent?.trim() || "",
          price: card.dataset.productPrice || cardPriceEl?.textContent?.trim() || "",
          compare: card.dataset.productCompare || cardCompareEl?.textContent?.trim() || "",
          desc: card.dataset.productDesc || "",
          alt: img.getAttribute("alt") || "",
        };

        const spotlightData = {
          title: spotlightTitle?.textContent?.trim() || "",
          price: spotlightPrice?.textContent?.trim() || "",
          compare: spotlightImage.dataset.spotlightCompare || "",
          desc: spotlightDesc?.textContent?.trim() || "",
          alt: spotlightImage.getAttribute("data-alt") || "",
        };

        spotlightImage.style.backgroundImage = `url(${clickedSrc})`;
        img.setAttribute("src", spotlightSrc);

        if (spotlightTitle) spotlightTitle.textContent = cardData.title || spotlightData.title;
        if (spotlightPrice) spotlightPrice.textContent = cardData.price || spotlightData.price;
        if (spotlightDesc) spotlightDesc.textContent = cardData.desc || spotlightData.desc;
        spotlightImage.dataset.spotlightCompare = cardData.compare || "";

        if (cardTitleEl) cardTitleEl.textContent = spotlightData.title || cardData.title;
        if (cardPriceEl) cardPriceEl.textContent = spotlightData.price || cardData.price;
        setCompareText(cardCompareEl, spotlightData.compare || "");

        card.dataset.productTitle = spotlightData.title || cardData.title;
        card.dataset.productPrice = spotlightData.price || cardData.price;
        card.dataset.productCompare = spotlightData.compare || "";
        card.dataset.productDesc = spotlightData.desc || cardData.desc;

        if (cardData.alt || spotlightData.alt) {
          img.setAttribute("alt", spotlightData.alt);
          spotlightImage.setAttribute("data-alt", cardData.alt);
        }
      })
    );
  }

  add(
    onAll(document.querySelectorAll("[data-checkout]"), "click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openCartModal();
    })
  );

  type HomeMembershipRow = {
    id: number;
    name: string;
    title: string;
    price: number | string;
    benefits?: string[] | null;
    isFeatured?: boolean | null;
  };

  type PendingSubscriptionCheckout = {
    subscriptionId?: number | null;
    membershipId?: number;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    planName?: string;
    planTitle?: string;
    planPrice?: number | string;
    planValueLabel?: string;
  };

  const membershipGrid = document.querySelector("[data-membership-grid]") as HTMLElement | null;
  const checkoutWhatsappLink = document.querySelector(
    "[data-checkout-whatsapp-link]"
  ) as HTMLAnchorElement | null;
  const membershipSubscribeModal = document.querySelector(
    "[data-membership-subscribe-modal]"
  ) as HTMLElement | null;
  const membershipSubscribeForm = document.querySelector(
    "[data-membership-subscribe-form]"
  ) as HTMLFormElement | null;
  const membershipSubscribePlan = document.querySelector(
    "[data-membership-subscribe-plan]"
  ) as HTMLSelectElement | null;
  const membershipSubscribeName = document.querySelector(
    "[data-membership-subscribe-name]"
  ) as HTMLInputElement | null;
  const membershipSubscribeEmail = document.querySelector(
    "[data-membership-subscribe-email]"
  ) as HTMLInputElement | null;
  const membershipSubscribePhone = document.querySelector(
    "[data-membership-subscribe-phone]"
  ) as HTMLInputElement | null;
  const membershipSubscribeError = document.querySelector(
    "[data-membership-subscribe-error]"
  ) as HTMLParagraphElement | null;
  const membershipSubscribeSave = document.querySelector(
    "[data-membership-subscribe-save]"
  ) as HTMLButtonElement | null;
  const API_URL = import.meta.env.VITE_API_URL || "";
  const WHATSAPP_PHONE = "5511978935812";
  //const WHATSAPP_PHONE = "5511989261279";
  let publicMemberships: HomeMembershipRow[] = [];

  const planIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("gold")) return "verified";
    if (lower.includes("platinum")) return "diamond";
    return "check_circle";
  };

  const parsePrice = (value: number | string) => {
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const buildWhatsappUrl = (text?: string) => {
    const base = `https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE}`;
    if (!text) return base;
    return `${base}&text=${encodeURIComponent(text)}`;
  };

  const parsePendingSubscriptionCheckout = (): PendingSubscriptionCheckout | null => {
    const raw = localStorage.getItem("jlr_pending_subscription_checkout");
    if (!raw) return null;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      const row = parsed as Record<string, unknown>;
      const membershipIdRaw = Number(row.membershipId);
      const planPriceRaw = row.planPrice;
      return {
        subscriptionId: Number.isFinite(Number(row.subscriptionId))
          ? Number(row.subscriptionId)
          : null,
        membershipId: Number.isFinite(membershipIdRaw) ? membershipIdRaw : undefined,
        customerName: typeof row.customerName === "string" ? row.customerName : "",
        customerEmail: typeof row.customerEmail === "string" ? row.customerEmail : "",
        customerPhone: typeof row.customerPhone === "string" ? row.customerPhone : "",
        planName: typeof row.planName === "string" ? row.planName : "",
        planTitle: typeof row.planTitle === "string" ? row.planTitle : "",
        planPrice:
          typeof planPriceRaw === "number" || typeof planPriceRaw === "string"
            ? planPriceRaw
            : undefined,
        planValueLabel: typeof row.planValueLabel === "string" ? row.planValueLabel : "",
      };
    } catch {
      return null;
    }
  };

  const resolveCheckoutPlanLabel = (
    pending: PendingSubscriptionCheckout
  ): { planLabel: string; valueLabel: string } => {
    const fromCache =
      pending.membershipId !== undefined
        ? publicMemberships.find((plan) => plan.id === pending.membershipId)
        : undefined;
    const planName = (pending.planName || fromCache?.name || "").trim();
    const planTitle = (pending.planTitle || fromCache?.title || "").trim();
    const planLabel = [planName, planTitle].filter(Boolean).join(" - ") || "-";

    if ((pending.planValueLabel || "").trim()) {
      return { planLabel, valueLabel: (pending.planValueLabel || "").trim() };
    }

    const priceSource =
      pending.planPrice !== undefined && pending.planPrice !== null
        ? pending.planPrice
        : fromCache?.price;
    if (priceSource !== undefined && priceSource !== null) {
      return { planLabel, valueLabel: formatCurrency(parsePrice(priceSource)) };
    }

    return { planLabel, valueLabel: "-" };
  };

  const updateCheckoutWhatsappLink = () => {
    if (!checkoutWhatsappLink) return;
    const pending = parsePendingSubscriptionCheckout();
    if (!pending) {
      checkoutWhatsappLink.href = buildWhatsappUrl();
      return;
    }
    const customerName = (pending.customerName || "").trim() || "-";
    const customerEmail = (pending.customerEmail || "").trim() || "-";
    const customerPhone = (pending.customerPhone || "").trim() || "-";
    const { planLabel, valueLabel } = resolveCheckoutPlanLabel(pending);
    const message = [
      "Ola! Quero ajuda com o pagamento da minha assinatura.",
      `Nome: ${customerName}`,
      `Email: ${customerEmail}`,
      `Telefone: ${customerPhone}`,
      `Plano: ${planLabel}`,
      `Valor: ${valueLabel}`,
    ].join("\n");
    checkoutWhatsappLink.href = buildWhatsappUrl(message);
  };

  const parsePublicMemberships = (payload: unknown): HomeMembershipRow[] => {
    if (!Array.isArray(payload)) return [];
    return payload
      .map((entry): HomeMembershipRow | null => {
        if (!entry || typeof entry !== "object") return null;
        const row = entry as Record<string, unknown>;
        const id = Number(row.id);
        const name = typeof row.name === "string" ? row.name.trim() : "";
        const title = typeof row.title === "string" ? row.title.trim() : "";
        const priceValue = row.price;
        const price =
          typeof priceValue === "number" || typeof priceValue === "string" ? priceValue : 0;
        const benefits = Array.isArray(row.benefits)
          ? row.benefits.filter((item): item is string => typeof item === "string")
          : [];
        const isFeatured = typeof row.isFeatured === "boolean" ? row.isFeatured : false;
        if (!Number.isFinite(id) || !name || !title) return null;
        return { id, name, title, price, benefits, isFeatured };
      })
      .filter((entry): entry is HomeMembershipRow => Boolean(entry));
  };

  const fetchPublicMemberships = async (): Promise<HomeMembershipRow[]> => {
    const response = await fetch(`${API_URL}/api/public/memberships`);
    if (!response.ok) return [];
    const payload: unknown = await response.json();
    return parsePublicMemberships(payload);
  };

  const setMembershipSubscribeError = (message: string) => {
    if (!membershipSubscribeError) return;
    membershipSubscribeError.textContent = message;
    membershipSubscribeError.classList.toggle("hidden", !message);
  };

  const setMembershipSubscribeBusy = (busy: boolean) => {
    if (!membershipSubscribeSave) return;
    membershipSubscribeSave.disabled = busy;
  };

  const hydrateMembershipSubscribePlans = (selectedId?: number) => {
    if (!membershipSubscribePlan) return;
    const baseOption = '<option value="">Selecione um plano</option>';
    const options = publicMemberships
      .map(
        (plan) =>
          `<option value="${plan.id}">${escapeHtml(plan.name)} - ${escapeHtml(plan.title)}</option>`
      )
      .join("");
    membershipSubscribePlan.innerHTML = `${baseOption}${options}`;
    if (selectedId) membershipSubscribePlan.value = String(selectedId);
  };

  const closeMembershipSubscribeModal = () => {
    if (!membershipSubscribeModal) return;
    membershipSubscribeModal.classList.add("hidden");
    membershipSubscribeModal.classList.remove("flex");
    membershipSubscribeModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("overflow-hidden");
  };

  const resolvePlanByButton = (button: HTMLElement): HomeMembershipRow | null => {
    const idRaw = button.getAttribute("data-membership-id");
    const id = Number(idRaw);
    if (Number.isFinite(id)) {
      const matchById = publicMemberships.find((plan) => plan.id === id);
      if (matchById) return matchById;
    }
    const name = (button.getAttribute("data-membership-name") || "").trim().toLowerCase();
    const title = (button.getAttribute("data-membership-title") || "").trim().toLowerCase();
    const matchByLabel = publicMemberships.find(
      (plan) => plan.name.toLowerCase() === name && plan.title.toLowerCase() === title
    );
    return matchByLabel || null;
  };

  const addMembershipToCart = async (button: HTMLElement): Promise<void> => {
    if (!publicMemberships.length) {
      try {
        publicMemberships = await fetchPublicMemberships();
      } catch {
        publicMemberships = [];
      }
    }
    const selectedPlan = resolvePlanByButton(button);
    if (!selectedPlan) {
      setMembershipSubscribeError("Plano de assinatura não encontrado.");
      return;
    }
    addCartItem({
      itemType: "MEMBERSHIP",
      entityId: selectedPlan.id,
      name: `${selectedPlan.name} - ${selectedPlan.title}`,
      subtitle: "Assinatura mensal",
      imageUrl: getBrandingSnapshot().logoUrl,
      price: parsePrice(selectedPlan.price),
      quantity: 1,
    });
    openCartModal();
  };

  const openMembershipSubscribeFromButton = async (button: HTMLElement) => {
    await addMembershipToCart(button);
  };

  const renderMembershipsFromDb = (plans: HomeMembershipRow[]) => {
    if (!membershipGrid) return;

    membershipGrid.innerHTML = plans
      .map((plan) => {
        const featured = Boolean(plan.isFeatured);
        const featuredClass = featured
          ? "bg-white dark:bg-forest border-2 border-gold rounded-2xl p-8 shadow-xl shadow-gold/10 transform scale-105 z-10 relative h-full flex flex-col"
          : "bg-white dark:bg-forest border border-champagne-dark dark:border-white/10 rounded-2xl p-8 hover:shadow-2xl hover:shadow-gold/10 transition-all duration-300 transform hover:-translate-y-2 relative h-full flex flex-col";
        const badge = featured
          ? '<div class="absolute -top-4 left-1/2 -translate-x-1/2 bg-gold text-white text-xs font-bold uppercase px-4 py-1 rounded-full tracking-widest">Mais Popular</div>'
          : "";
        const tierClass = featured
          ? "inline-block py-1 px-3 bg-gold/10 rounded-full text-xs font-bold uppercase tracking-widest text-gold mb-4"
          : "inline-block py-1 px-3 bg-gray-100 dark:bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-300 mb-4";
        const icon = planIcon(plan.name || "");
        const benefits = (plan.benefits || [])
          .map(
            (benefit) => `
                        <li class="flex items-start gap-3">
                            <span class="material-symbols-outlined text-gold text-lg mt-0.5">${icon}</span>
                            <span class="text-forest/80 dark:text-gray-300 text-sm">${escapeHtml(benefit)}</span>
                        </li>
                    `
          )
          .join("");

        return `
                <div class="${featuredClass}">
                    ${badge}
                    <div class="mb-6">
                        <span class="${tierClass}">${escapeHtml(plan.name || "-")}</span>
                        <h4 class="display-title text-shadow-strong text-3xl text-forest dark:text-white mb-2">${escapeHtml(
                          plan.title || "-"
                        )}</h4>
                        <p class="text-gold font-bold text-xl">${formatCurrency(parsePrice(plan.price))} <span class="text-sm text-gray-400 font-normal">/ mês</span></p>
                    </div>
                    <ul class="space-y-4 mb-10 flex-grow">
                        ${benefits}
                    </ul>
                    <button class="w-full py-4 rounded-lg bg-forest text-white hover:bg-primary hover:text-forest font-bold uppercase tracking-widest text-xs transition-colors mt-auto" type="button" data-membership-join data-membership-id="${plan.id}" data-membership-name="${escapeHtml(plan.name || "")}" data-membership-title="${escapeHtml(plan.title || "")}">
                        Entrar no Clube
                    </button>
                </div>
            `;
      })
      .join("");
  };

  const loadMembershipsFromDb = async () => {
    try {
      publicMemberships = await fetchPublicMemberships();
      hydrateMembershipSubscribePlans();
      updateCheckoutWhatsappLink();
      if (!membershipGrid || publicMemberships.length < 3) return;
      renderMembershipsFromDb(publicMemberships);
    } catch {
      // keep static fallback from HTML
    }
  };

  updateCheckoutWhatsappLink();
  loadMembershipsFromDb().catch(() => undefined);

  if (membershipSubscribeModal) {
    add(
      on(membershipSubscribeModal, "click", (event) => {
        if (event.target === membershipSubscribeModal) {
          closeMembershipSubscribeModal();
        }
      })
    );
  }

  document.querySelectorAll("[data-membership-subscribe-close]").forEach((button) => {
    add(on(button, "click", () => closeMembershipSubscribeModal()));
  });

  add(
    on(document, "keydown", (event) => {
      if (
        event instanceof KeyboardEvent &&
        event.key === "Escape" &&
        membershipSubscribeModal &&
        !membershipSubscribeModal.classList.contains("hidden")
      ) {
        closeMembershipSubscribeModal();
      }
    })
  );
  add(
    on(document, "click", (event) => {
      const target = event.target as HTMLElement | null;
      const joinButton = target?.closest("[data-membership-join]") as HTMLElement | null;
      if (!joinButton) return;
      event.preventDefault();
      openMembershipSubscribeFromButton(joinButton).catch(() => {
        setMembershipSubscribeError("Falha ao adicionar assinatura ao carrinho.");
      });
    })
  );

  if (membershipSubscribeForm) {
    add(
      on(membershipSubscribeForm, "submit", async (event) => {
        event.preventDefault();
        setMembershipSubscribeError("");
        const membershipId = Number(membershipSubscribePlan?.value || "");
        const customerName = membershipSubscribeName?.value.trim() || "";
        const customerEmail = membershipSubscribeEmail?.value.trim() || "";
        const customerPhone = membershipSubscribePhone?.value.trim() || "";

        if (!Number.isFinite(membershipId)) {
          setMembershipSubscribeError("Selecione um plano.");
          return;
        }
        if (!customerName || !customerEmail || !customerPhone) {
          setMembershipSubscribeError("Preencha nome, email e telefone.");
          return;
        }

        setMembershipSubscribeBusy(true);
        try {
          const selectedPlan = publicMemberships.find((plan) => plan.id === membershipId) || null;
          const response = await fetch(`${API_URL}/api/public/subscriptions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              membershipId,
              customerName,
              customerEmail,
              customerPhone,
            }),
          });
          const payload = (await response.json().catch(() => ({}))) as { message?: string; id?: number };
          if (!response.ok) {
            throw new Error(payload.message || "Não foi possível iniciar sua assinatura.");
          }

          localStorage.setItem(
            "jlr_pending_subscription_checkout",
            JSON.stringify({
              subscriptionId: payload.id || null,
              membershipId,
              customerName,
              customerEmail,
              customerPhone,
              planName: selectedPlan?.name || "",
              planTitle: selectedPlan?.title || "",
              planPrice: selectedPlan?.price ?? null,
              planValueLabel: selectedPlan ? formatCurrency(parsePrice(selectedPlan.price)) : "",
              createdAt: new Date().toISOString(),
            })
          );
          closeMembershipSubscribeModal();
          openCheckoutModal();
        } catch (error) {
          setMembershipSubscribeError(
            error instanceof Error ? error.message : "Falha ao iniciar assinatura."
          );
        } finally {
          setMembershipSubscribeBusy(false);
        }
      })
    );
  }

  const conciergePanel = document.getElementById("concierge-panel");
  const conciergeToggle = document.getElementById("concierge-toggle");
  const conciergeClose = document.getElementById("concierge-close");
  const conciergeBody = document.getElementById("concierge-body");
  const conciergeOptions = document.getElementById("concierge-options");
  const conciergeTriggers = document.querySelectorAll("[data-open-concierge]");
  type ConciergeTriggerPrefill = {
    sourceLabel: string;
    categoryName: string;
    serviceName: string;
  };

  let pendingConciergePrefill: ConciergeTriggerPrefill | null = null;

  const conciergeState: {
    context: ConciergeBookingContext | null;
    selectedUnit: ConciergeUnitOption | null;
    selectedDate: ConciergeDateOption | null;
    categories: ConciergeServiceCategory[];
    selectedCategory: ConciergeServiceCategory | null;
    selectedService: ConciergeServiceOption | null;
    selectedPeriod: ConciergePeriodOption | null;
    selectedSlot: ConciergeSlotOption | null;
    selectedProfessional: ConciergeProfessionalOption | null;
    lockUnitAndDate: boolean;
    lastClientName: string;
    lastClientPhone: string;
  } = {
    context: null,
    selectedUnit: null,
    selectedDate: null,
    categories: [],
    selectedCategory: null,
    selectedService: null,
    selectedPeriod: null,
    selectedSlot: null,
    selectedProfessional: null,
    lockUnitAndDate: false,
    lastClientName: "",
    lastClientPhone: "",
  };
  const fetchPublicJson = fetchChatbotPublicJson;
  const postPublicJson = postChatbotPublicJson;

  const normalizeConciergeMatchText = (value: string): string =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

  const findBestNameMatch = <T extends { name: string }>(items: T[], query: string): T | null => {
    const normalizedQuery = normalizeConciergeMatchText(query);
    if (!normalizedQuery) return null;

    const exact = items.find((item) => normalizeConciergeMatchText(item.name) === normalizedQuery);
    if (exact) return exact;

    const contains = items.find((item) =>
      normalizeConciergeMatchText(item.name).includes(normalizedQuery)
    );
    if (contains) return contains;

    const reverseContains = items.find((item) =>
      normalizedQuery.includes(normalizeConciergeMatchText(item.name))
    );
    return reverseContains || null;
  };

  const readConciergePrefillFromTrigger = (trigger: HTMLElement | null): ConciergeTriggerPrefill | null => {
    if (!trigger) return null;
    const categoryName = (trigger.dataset.conciergeCategory || "").trim();
    const serviceName = (trigger.dataset.conciergeService || "").trim();
    if (!categoryName || !serviceName) return null;
    return {
      sourceLabel: (trigger.dataset.conciergeLabel || "serviço").trim() || "serviço",
      categoryName,
      serviceName,
    };
  };

  const findCategoryForPrefill = (
    categories: ConciergeServiceCategory[],
    prefill: ConciergeTriggerPrefill
  ): ConciergeServiceCategory | null => {
    const byCategory = findBestNameMatch(categories, prefill.categoryName);
    if (byCategory) return byCategory;

    const byServiceCategory =
      categories.find((category) => !!findBestNameMatch(category.services, prefill.serviceName)) || null;
    return byServiceCategory;
  };

  const addMessage = (text: string, role: "bot" | "user" = "bot") => {
    if (!conciergeBody) return;
    const bubble = document.createElement("div");
    bubble.className =
      role === "user"
        ? "ml-auto max-w-[85%] rounded-2xl bg-gold text-forest px-4 py-2 text-sm"
        : "mr-auto max-w-[85%] rounded-2xl bg-white/10 text-white px-4 py-2 text-sm";
    bubble.textContent = text;
    conciergeBody.appendChild(bubble);
    conciergeBody.scrollTop = conciergeBody.scrollHeight;
  };

  const renderOptions = (options: Array<{ label: string; onClick: () => void }>) => {
    if (!conciergeOptions) return;
    conciergeOptions.innerHTML = "";
    options.forEach((option) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "px-3 py-2 rounded-full border border-gold/40 text-xs font-semibold text-white hover:bg-gold/20 transition-colors";
      btn.textContent = option.label;
      btn.addEventListener("click", option.onClick);
      conciergeOptions.appendChild(btn);
    });
  };

  const resetServiceSelection = () => {
    conciergeState.selectedCategory = null;
    conciergeState.selectedService = null;
    conciergeState.selectedPeriod = null;
    conciergeState.selectedSlot = null;
    conciergeState.selectedProfessional = null;
  };

  const resetConversationState = () => {
    conciergeState.selectedUnit = null;
    conciergeState.selectedDate = null;
    conciergeState.categories = [];
    resetServiceSelection();
    conciergeState.lockUnitAndDate = false;
  };

  const ensureBookingContext = async (): Promise<boolean> => {
    if (conciergeState.context) return true;
    const payload = await fetchPublicJson<{
      units?: ConciergeUnitOption[];
      dates?: ConciergeDateOption[];
    }>("/public/concierge/booking-context");
    const units = Array.isArray(payload?.units) ? payload.units : [];
    const dates = Array.isArray(payload?.dates) ? payload.dates : [];
    if (!units.length || !dates.length) {
      addMessage("Não foi possível carregar as opções de agendamento agora.");
      return false;
    }
    conciergeState.context = { units, dates };
    return true;
  };

  const renderRestartOnly = () => {
    renderOptions([
      {
        label: "Nova solicitação",
        onClick: () => {
          if (conciergeBody) conciergeBody.innerHTML = "";
          resetConversationState();
          void startConciergeFlow();
        },
      },
    ]);
  };

  const promptWaitlistForm = (serviceNamePrefill = "") => {
    if (!conciergeOptions) return;
    conciergeOptions.innerHTML = "";

    const serviceInput = document.createElement("input");
    serviceInput.className =
      "w-full rounded-lg border border-gold/30 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-gold/50";
    serviceInput.placeholder = "Qual serviço você procura?";
    serviceInput.value = serviceNamePrefill;

    const nameInput = document.createElement("input");
    nameInput.className =
      "w-full rounded-lg border border-gold/30 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-gold/50";
    nameInput.placeholder = "Seu nome";
    nameInput.value = conciergeState.lastClientName;
    const phoneInput = document.createElement("input");
    phoneInput.className =
      "w-full rounded-lg border border-gold/30 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-gold/50";
    phoneInput.placeholder = "Telefone (WhatsApp)";
    phoneInput.value = conciergeState.lastClientPhone;

    const noteInput = document.createElement("input");
    noteInput.className =
      "w-full rounded-lg border border-gold/30 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-gold/50";
    noteInput.placeholder = "Observação (opcional)";

    const privacyNote = document.createElement("p");
    privacyNote.className = "text-[11px] leading-relaxed text-white/70";
    privacyNote.textContent =
      "Usaremos seus dados para retorno sobre disponibilidade e agendamento. Ao enviar, você concorda com a Política de Privacidade.";

    const confirmBtn = document.createElement("button");
    confirmBtn.type = "button";
    confirmBtn.className =
      "w-full mt-2 px-3 py-2 rounded-lg bg-gold text-forest text-xs font-semibold uppercase tracking-widest";
    confirmBtn.textContent = "Enviar para unidade";
    confirmBtn.addEventListener("click", async () => {
      const unit = conciergeState.selectedUnit;
      const date = conciergeState.selectedDate;
      const serviceName = serviceInput.value.trim();
      const name = nameInput.value.trim();
      const phone = phoneInput.value.trim();
      const notes = noteInput.value.trim();
      if (!unit || !date) {
        addMessage("Defina unidade e data antes de enviar para espera.");
        renderRestartOnly();
        return;
      }
      if (!serviceName || !phone) {
        addMessage("Informe serviço e telefone para entrar na fila de espera.");
        return;
      }

      const sent = await postPublicJson<{ success?: boolean }>("/public/concierge/waitlist", {
        unitId: unit.id,
        requestedDate: date.isoDate,
        requestedServiceName: serviceName,
        clientName: name || undefined,
        clientPhone: phone,
        notes: notes || undefined,
      });
      if (!sent.ok) {
        addMessage(sent.error || "Não foi possível registrar sua solicitação agora.");
        return;
      }
      conciergeState.lastClientName = name;
      conciergeState.lastClientPhone = phone;
      addMessage("Solicitação enviada para a unidade. Vamos te avisar assim que houver vaga.");
      renderRestartOnly();
    });

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className =
      "w-full mt-2 px-3 py-2 rounded-lg border border-gold/40 text-xs font-semibold text-white hover:bg-gold/20 transition-colors";
    cancelBtn.textContent = "Cancelar";
    cancelBtn.addEventListener("click", () => {
      renderRestartOnly();
    });

    conciergeOptions.appendChild(serviceInput);
    conciergeOptions.appendChild(nameInput);
    conciergeOptions.appendChild(phoneInput);
    conciergeOptions.appendChild(noteInput);
    conciergeOptions.appendChild(privacyNote);
    conciergeOptions.appendChild(confirmBtn);
    conciergeOptions.appendChild(cancelBtn);
  };

  const promptServiceNotFound = () => {
    addMessage(
      "Se o serviço não estiver na lista, posso enviar sua solicitação para a unidade e você aguarda retorno. Deseja continuar?"
    );
    renderOptions([
      {
        label: "Sim, enviar para espera",
        onClick: () => promptWaitlistForm(),
      },
      {
        label: "Não, encerrar",
        onClick: () => {
          addMessage("Tudo bem. Quando quiser, inicie uma nova solicitação.");
          renderRestartOnly();
        },
      },
    ]);
  };

  const askPeriod = async () => {
    const unit = conciergeState.selectedUnit;
    const date = conciergeState.selectedDate;
    const service = conciergeState.selectedService;
    if (!unit || !date || !service) {
      addMessage("Não consegui validar unidade, data e serviço.");
      renderRestartOnly();
      return;
    }
    const payload = await fetchPublicJson<{
      periods?: ConciergePeriodOption[];
    }>(
      `/public/concierge/periods?unitId=${unit.id}&date=${encodeURIComponent(date.isoDate)}&serviceId=${
        service.id
      }`
    );
    const periods = Array.isArray(payload?.periods)
      ? payload.periods.filter((period) => period.availableStarts > 0)
      : [];
    if (!periods.length) {
      addMessage(
        "Não encontrei vagas nesse dia para esse serviço. Posso registrar sua solicitação para a unidade?"
      );
      renderOptions([
        {
          label: "Entrar em lista de espera",
          onClick: () => promptWaitlistForm(service.name),
        },
        {
          label: "Escolher outra data",
          onClick: () => {
            addMessage("Vamos manter o serviço e trocar a data.", "bot");
            void askDate({ preserveSelectedService: true });
          },
        },
      ]);
      return;
    }
    addMessage("Qual período você prefere?");
    renderOptions(
      periods.map((period) => ({
        label: `${period.label} (${period.availableStarts} vagas)`,
        onClick: () => {
          conciergeState.selectedPeriod = period;
          conciergeState.selectedSlot = null;
          conciergeState.selectedProfessional = null;
          addMessage(period.label, "user");
          void askSlots();
        },
      }))
    );
  };

  const askSlots = async () => {
    const unit = conciergeState.selectedUnit;
    const date = conciergeState.selectedDate;
    const service = conciergeState.selectedService;
    const period = conciergeState.selectedPeriod;
    if (!unit || !date || !service || !period) {
      addMessage("Não consegui validar os dados do horário.");
      renderRestartOnly();
      return;
    }

    const payload = await fetchPublicJson<{
      slots?: ConciergeSlotOption[];
    }>(
      `/public/concierge/slots?unitId=${unit.id}&date=${encodeURIComponent(date.isoDate)}&serviceId=${
        service.id
      }&period=${period.key}`
    );
    const slots = Array.isArray(payload?.slots) ? payload.slots : [];
    if (!slots.length) {
      addMessage("Esse período acabou de ficar sem vagas. Quer entrar em lista de espera?");
      renderOptions([
        {
          label: "Entrar em lista de espera",
          onClick: () => promptWaitlistForm(service.name),
        },
        {
          label: "Escolher outro período",
          onClick: () => void askPeriod(),
        },
      ]);
      return;
    }

    addMessage("Escolha um horário disponível:");
    conciergeState.selectedProfessional = null;
    renderOptions(
      slots.map((slot) => ({
        label: `${slot.hourIni} - ${slot.hourFinish} (${slot.professionalsAvailable} prof.)`,
        onClick: () => {
          conciergeState.selectedSlot = slot;
          addMessage(slot.slotLabel, "user");
          void askProfessionalPreference(slot);
        },
      }))
    );
  };

  const askProfessionalPreference = async (slot: ConciergeSlotOption) => {
    const unit = conciergeState.selectedUnit;
    const date = conciergeState.selectedDate;
    const service = conciergeState.selectedService;
    if (!unit || !date || !service) {
      addMessage("Não consegui validar dados para selecionar profissional.");
      renderRestartOnly();
      return;
    }

    const payload = await fetchPublicJson<{
      professionals?: ConciergeProfessionalOption[];
    }>(
      `/public/concierge/slot-professionals?unitId=${unit.id}&date=${encodeURIComponent(
        date.isoDate
      )}&serviceId=${service.id}&slotLabel=${encodeURIComponent(slot.slotLabel)}`
    );
    const professionals = Array.isArray(payload?.professionals) ? payload.professionals : [];
    if (!professionals.length) {
      addMessage("Esse horário ficou indisponível. Vamos escolher outro.");
      void askSlots();
      return;
    }

    addMessage("Deseja reservar com um profissional especifico?");
    renderOptions([
      {
        label: "Primeiro profissional disponivel",
        onClick: () => {
          conciergeState.selectedProfessional = null;
          addMessage("Primeiro disponivel", "user");
          promptContactForm();
        },
      },
      ...professionals.map((professional) => ({
        label: professional.name,
        onClick: () => {
          conciergeState.selectedProfessional = professional;
          addMessage(professional.name, "user");
          promptContactForm();
        },
      })),
    ]);
  };

  const askCategory = async () => {
    const unit = conciergeState.selectedUnit;
    const date = conciergeState.selectedDate;
    if (!unit || !date) {
      addMessage("Selecione unidade e data primeiro.");
      renderRestartOnly();
      return;
    }

    const payload = await fetchPublicJson<{
      categories?: ConciergeServiceCategory[];
    }>(
      `/public/concierge/services?unitId=${unit.id}&date=${encodeURIComponent(date.isoDate)}`
    );
    const categoriesRaw = Array.isArray(payload?.categories) ? payload.categories : [];
    const categories = categoriesRaw.filter((category) => Array.isArray(category.services));
    conciergeState.categories = categories;

    if (!categories.length) {
      addMessage("Não encontramos serviços disponíveis para essa combinação de unidade e data.");
      promptServiceNotFound();
      return;
    }

    if (pendingConciergePrefill) {
      const matchedCategory = findCategoryForPrefill(categories, pendingConciergePrefill);
      if (matchedCategory) {
        conciergeState.selectedCategory = matchedCategory;
        addMessage(
          `Vou preparar o agendamento de ${pendingConciergePrefill.sourceLabel}.`,
          "bot"
        );
        addMessage(matchedCategory.name, "user");
        askService(matchedCategory);
        return;
      }

      addMessage(
        `Não encontrei a categoria de ${pendingConciergePrefill.sourceLabel} nessa disponibilidade. Vamos escolher manualmente.`
      );
      pendingConciergePrefill = null;
    }

    addMessage("Qual categoria de serviço você prefere?");
    renderOptions([
      ...categories.map((category) => ({
        label: category.name,
        onClick: () => {
          conciergeState.selectedCategory = category;
          addMessage(category.name, "user");
          askService(category);
        },
      })),
      {
        label: "Não encontrei meu serviço",
        onClick: promptServiceNotFound,
      },
    ]);
  };

  const askService = (category: ConciergeServiceCategory) => {
    const options = category.services;
    if (!options.length) {
      addMessage("Essa categoria não tem serviços no momento.");
      void askCategory();
      return;
    }

    if (pendingConciergePrefill) {
      const matchedService = findBestNameMatch(options, pendingConciergePrefill.serviceName);
      if (matchedService) {
        conciergeState.selectedService = matchedService;
        conciergeState.selectedPeriod = null;
        conciergeState.selectedSlot = null;
        conciergeState.selectedProfessional = null;
        addMessage(matchedService.name, "user");
        pendingConciergePrefill = null;
        void askPeriod();
        return;
      }

      addMessage(
        `Não achei o serviço de ${pendingConciergePrefill.sourceLabel} nesta categoria. Vamos escolher manualmente.`
      );
      pendingConciergePrefill = null;
    }

    addMessage("Escolha o serviço desejado:");
    renderOptions([
      ...options.map((service) => ({
        label: `${service.name} (${service.durationMin} min)`,
        onClick: () => {
          conciergeState.selectedService = service;
          conciergeState.selectedPeriod = null;
          conciergeState.selectedSlot = null;
          conciergeState.selectedProfessional = null;
          addMessage(service.name, "user");
          void askPeriod();
        },
      })),
      {
        label: "Voltar categorias",
        onClick: () => void askCategory(),
      },
      {
        label: "Não encontrei meu serviço",
        onClick: promptServiceNotFound,
      },
    ]);
  };

  const askAnotherServiceDecision = () => {
    addMessage("Deseja agendar outro serviço no mesmo dia e unidade?");
    renderOptions([
      {
        label: "Sim, outro serviço",
        onClick: () => {
          resetServiceSelection();
          addMessage("Certo, vamos escolher outro serviço mantendo unidade e data.", "bot");
          void askCategory();
        },
      },
      {
        label: "Quero outra unidade/data",
        onClick: () => {
          closeAndResetConcierge();
        },
      },
      {
        label: "Finalizar",
        onClick: () => {
          closeAndResetConcierge();
        },
      },
    ]);
  };

  const finalizeAppointment = async (name: string, phone: string): Promise<void> => {
    const unit = conciergeState.selectedUnit;
    const date = conciergeState.selectedDate;
    const service = conciergeState.selectedService;
    const slot = conciergeState.selectedSlot;
    const professional = conciergeState.selectedProfessional;
    if (!unit || !date || !service || !slot) {
      addMessage("Não foi possível validar os dados do agendamento.");
      renderRestartOnly();
      return;
    }

    const booking = await postPublicJson<{
      success?: boolean;
      appointment?: { id?: number };
    }>("/public/concierge/book", {
      unitId: unit.id,
      date: date.isoDate,
      serviceId: service.id,
      slotLabel: slot.slotLabel,
      preferredProfessionalId: professional?.id,
      clientName: name,
      clientPhone: phone,
    });

    if (!booking.ok) {
      addMessage(booking.error || "Não foi possível concluir seu agendamento.");
      if ((booking.error || "").toLowerCase().includes("slot")) {
        addMessage("Esse horário acabou de ser ocupado. Vamos escolher outro.");
        void askSlots();
        return;
      }
      renderRestartOnly();
      return;
    }

    conciergeState.lastClientName = name;
    conciergeState.lastClientPhone = phone;
    conciergeState.lockUnitAndDate = true;
    addMessage(
      `Agendamento confirmado: ${service.name} em ${date.label}, ${slot.hourIni} na unidade ${unit.name}${
        professional ? ` com ${professional.name}` : ""
      }.`
    );
    askAnotherServiceDecision();
  };

  const promptContactForm = () => {
    if (!conciergeOptions) return;
    conciergeOptions.innerHTML = "";

    const nameInput = document.createElement("input");
    nameInput.className =
      "w-full rounded-lg border border-gold/30 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-gold/50";
    nameInput.placeholder = "Nome completo";
    nameInput.value = conciergeState.lastClientName;

    const phoneInput = document.createElement("input");
    phoneInput.className =
      "w-full rounded-lg border border-gold/30 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-gold/50";
    phoneInput.placeholder = "Telefone (WhatsApp)";
    phoneInput.value = conciergeState.lastClientPhone;

    const privacyNote = document.createElement("p");
    privacyNote.className = "text-[11px] leading-relaxed text-white/70";
    privacyNote.textContent =
      "Usaremos seu nome e telefone para confirmar o agendamento e entrar em contato sobre esta solicitação.";

    const confirmBtn = document.createElement("button");
    confirmBtn.type = "button";
    confirmBtn.className =
      "w-full mt-2 px-3 py-2 rounded-lg bg-gold text-forest text-xs font-semibold uppercase tracking-widest";
    confirmBtn.textContent = "Confirmar agendamento";
    confirmBtn.addEventListener("click", () => {
      const name = nameInput.value.trim();
      const phone = phoneInput.value.trim();
      if (!name || !phone) {
        addMessage("Informe nome e telefone para concluir.");
        return;
      }
      addMessage(`${name} • ${phone}`, "user");
      void finalizeAppointment(name, phone);
    });

    const backBtn = document.createElement("button");
    backBtn.type = "button";
    backBtn.className =
      "w-full mt-2 px-3 py-2 rounded-lg border border-gold/40 text-xs font-semibold text-white hover:bg-gold/20 transition-colors";
    backBtn.textContent = "Voltar horários";
    backBtn.addEventListener("click", () => {
      void askSlots();
    });

    conciergeOptions.appendChild(nameInput);
    conciergeOptions.appendChild(phoneInput);
    conciergeOptions.appendChild(privacyNote);
    conciergeOptions.appendChild(confirmBtn);
    conciergeOptions.appendChild(backBtn);
  };

  const askDate = (options?: { preserveSelectedService?: boolean }) => {
    const context = conciergeState.context;
    const unit = conciergeState.selectedUnit;
    if (!context || !unit) {
      addMessage("Não foi possível carregar datas.");
      renderRestartOnly();
      return;
    }

    if (options?.preserveSelectedService && conciergeState.selectedService) {
      addMessage(
        `Escolha outra data na unidade ${unit.name} para tentar o serviço ${conciergeState.selectedService.name}.`
      );
    } else {
      addMessage(
        `Unidade ${unit.name} selecionada. Agora escolha o dia para montar sua grade de horários.`
      );
    }
    renderOptions(
      context.dates.map((date) => ({
        label: date.label,
        onClick: () => {
          conciergeState.selectedDate = date;
          conciergeState.selectedPeriod = null;
          conciergeState.selectedSlot = null;
          conciergeState.selectedProfessional = null;
          if (!options?.preserveSelectedService) {
            conciergeState.selectedCategory = null;
            conciergeState.selectedService = null;
          }
          addMessage(date.label, "user");
          if (options?.preserveSelectedService && conciergeState.selectedService) {
            void askPeriod();
            return;
          }
          void askCategory();
        },
      }))
    );
  };

  const askUnit = () => {
    const context = conciergeState.context;
    if (!context) {
      addMessage("Não foi possível carregar unidades.");
      renderRestartOnly();
      return;
    }
    addMessage("Qual unidade você prefere?");
    renderOptions(
      context.units.map((unit) => ({
        label: `${unit.name} (${unit.hourStart}-${unit.hourFinish})`,
        onClick: () => {
          conciergeState.selectedUnit = unit;
          addMessage(unit.name, "user");
          askDate();
        },
      }))
    );
  };

  const startConciergeFlow = async () => {
    const ready = await ensureBookingContext();
    if (!ready) {
      renderRestartOnly();
      return;
    }
    askUnit();
  };

  const openConcierge = () => {
    if (!conciergePanel) return;
    conciergePanel.classList.remove("hidden");
    if (conciergeBody && conciergeBody.childElementCount === 0) {
      resetConversationState();
      void startConciergeFlow();
    }
  };

  const closeConcierge = () => {
    if (!conciergePanel) return;
    conciergePanel.classList.add("hidden");
  };

  const closeAndResetConcierge = () => {
    if (conciergeBody) conciergeBody.innerHTML = "";
    if (conciergeOptions) conciergeOptions.innerHTML = "";
    resetConversationState();
    closeConcierge();
  };

  const startNewConversation = () => {
    if (conciergeBody) conciergeBody.innerHTML = "";
    resetConversationState();
    void startConciergeFlow();
  };

  const enforceLockedUnitDate = () => {
    if (!conciergeState.lockUnitAndDate) return;
    addMessage(
      "Para manter consistência do agendamento, novos serviços neste fluxo devem usar a mesma unidade e data."
    );
    renderOptions([
      {
        label: "Continuar na mesma unidade/data",
        onClick: () => {
          resetServiceSelection();
          void askCategory();
        },
      },
      {
        label: "Iniciar nova solicitação",
        onClick: startNewConversation,
      },
    ]);
  };

  if (conciergePanel && !conciergePanel.classList.contains("hidden")) {
    enforceLockedUnitDate();
  }

  const openConciergeFromTrigger = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    const trigger = event.currentTarget as HTMLElement | null;
    pendingConciergePrefill = readConciergePrefillFromTrigger(trigger);
    if (conciergeState.lockUnitAndDate && conciergeBody && conciergeBody.childElementCount > 0) {
      enforceLockedUnitDate();
      openConcierge();
      return;
    }
    openConcierge();
  };

  add(on(conciergeToggle, "click", openConcierge));
  add(on(conciergeClose, "click", closeConcierge));
  add(
    onAll(conciergeTriggers, "click", (event) => {
      openConciergeFromTrigger(event);
    })
  );

  if (conciergeOptions && conciergeOptions.childElementCount === 0 && conciergeBody) {
    const info = document.createElement("button");
    info.type = "button";
    info.className =
      "px-3 py-2 rounded-full border border-gold/40 text-xs font-semibold text-white hover:bg-gold/20 transition-colors";
    info.textContent = "Iniciar agendamento";
    info.addEventListener("click", startNewConversation);
    conciergeOptions.appendChild(info);
  }

  add(
    on(document, "visibilitychange", () => {
      if (document.visibilityState !== "visible") return;
      if (!conciergePanel || conciergePanel.classList.contains("hidden")) return;
      if (!conciergeBody || conciergeBody.childElementCount > 0) return;
      startNewConversation();
    })
  );

  const triggerQuickWaitlist = () => {
    if (!conciergePanel) return;
    conciergePanel.classList.remove("hidden");
    if (conciergeBody && conciergeBody.childElementCount === 0) {
      void startConciergeFlow().then(() => {
        addMessage("Se preferir, você também pode pedir um serviço específico para espera.");
        promptWaitlistForm();
      });
      return;
    }
    promptWaitlistForm();
  };

  if (membershipGrid && !membershipGrid.dataset.conciergeWaitlistBound) {
    membershipGrid.dataset.conciergeWaitlistBound = "1";
    const waitlistBtn = document.createElement("button");
    waitlistBtn.type = "button";
    waitlistBtn.className =
      "mt-4 px-4 py-2 rounded-full border border-gold/40 text-xs font-semibold text-forest hover:bg-gold/10 transition-colors";
    waitlistBtn.textContent = "Não achou horário? Entrar em espera";
    waitlistBtn.addEventListener("click", triggerQuickWaitlist);
    membershipGrid.parentElement?.appendChild(waitlistBtn);
  }

  if (!conciergePanel?.classList.contains("hidden") && conciergeBody && conciergeBody.childElementCount === 0) {
    void startConciergeFlow();
  }

  add(
    on(window, "focus", () => {
      if (!conciergePanel || conciergePanel.classList.contains("hidden")) return;
      if (!conciergeBody) return;
      if (conciergeBody.childElementCount === 0) {
        void startConciergeFlow();
      }
    })
  );

  return () => {
    cleanups.forEach((cleanup) => cleanup());
  };
}
