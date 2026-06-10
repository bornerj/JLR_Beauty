import { useEffect, useMemo, useState, type ReactElement } from "react";
import {
  CART_STORAGE_KEY,
  CART_UPDATED_EVENT,
  clearCart,
  formatCartCurrency,
  getCartSubtotal,
  removeCartItem,
  readCart,
  setCartItemQuantity,
  type CartItem,
} from "../../modules/cart/store";
import { resolveUploadedAssetUrl } from "../../lib/assetUrls";
import { useMediaSlot } from "../../modules/public-site/media.runtime";

const DEFAULT_FREE_SHIPPING_THRESHOLD = 150;
const DEFAULT_LOCAL_DELIVERY_FEE = 10;
const TAX_RATE = 0;
const FALLBACK_IMAGE_URL = "/images/products/jlr_argan.webp";
const API_URL = import.meta.env.VITE_API_URL || "";
const COUPON_REQUEST_TIMEOUT_MS = 12000;
const PENDING_STRIPE_ORDER_KEY = "jlr_pending_stripe_order_checkout";
const PENDING_SUBSCRIPTION_KEY = "jlr_pending_subscription_checkout";

type AppliedCoupon = {
  id: number;
  code: string;
  name: string;
  discountType: string;
  percentOff: number | null;
  amountOff: number | null;
  minSubtotal: number | null;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
};

type CouponValidationResponse = {
  coupon: AppliedCoupon;
  subtotal: number;
  discount: number;
  total: number;
};

type StripeCheckoutSessionResponse = {
  sessionId: string;
  checkoutUrl: string;
  orderId: number;
  publicCode: string | null;
  paymentRecordId: number;
  totals: {
    subtotal: number;
    shipping: number;
    discount: number;
    total: number;
  };
};

type CheckoutDeliveryMethod = "PICKUP" | "LOCAL_DELIVERY";

type CheckoutShippingPolicyResponse = {
  policy: {
    localDeliveryFee: number;
    freeShippingThreshold: number;
  };
};

type StripeConfirmSessionResponse = {
  sessionId: string;
  stripeSessionStatus: string | null;
  stripePaymentStatus: string | null;
  paymentStatus: string;
  order: {
    id: number;
    publicCode: string | null;
    status: string;
    fulfillmentStatus: string;
    total: number;
    paymentConfirmedAt: string | null;
    shipmentTrackingCode: string | null;
    shipmentCarrier: string | null;
    shippedAt: string | null;
    deliveredAt: string | null;
  } | null;
};

type PendingStripeOrderPayload = {
  orderId: number;
  paymentRecordId: number;
  publicCode: string | null;
  sessionId: string;
};

const getItemSubtitle = (item: CartItem): string => {
  if (item.subtitle?.trim()) return item.subtitle;
  return item.itemType === "MEMBERSHIP" ? "Assinatura mensal" : "Produto";
};

const roundMoney = (value: number): number => Math.round(value * 100) / 100;

const parsePendingSubscriptionContact = (): {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
} => {
  if (typeof window === "undefined") {
    return { customerName: "", customerEmail: "", customerPhone: "" };
  }
  const raw = window.localStorage.getItem(PENDING_SUBSCRIPTION_KEY);
  if (!raw) {
    return { customerName: "", customerEmail: "", customerPhone: "" };
  }
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      customerName: typeof parsed.customerName === "string" ? parsed.customerName : "",
      customerEmail: typeof parsed.customerEmail === "string" ? parsed.customerEmail : "",
      customerPhone: typeof parsed.customerPhone === "string" ? parsed.customerPhone : "",
    };
  } catch {
    return { customerName: "", customerEmail: "", customerPhone: "" };
  }
};

const getAppliedCouponDiscount = (coupon: AppliedCoupon | null, subtotal: number): number => {
  if (!coupon || subtotal <= 0) return 0;
  const minSubtotal = coupon.minSubtotal ?? 0;
  if (minSubtotal > 0 && subtotal < minSubtotal) return 0;

  if (coupon.discountType === "PERCENT") {
    const percentOff = coupon.percentOff ?? 0;
    if (percentOff <= 0) return 0;
    return roundMoney(Math.min(subtotal, (subtotal * percentOff) / 100));
  }
  if (coupon.discountType === "FIXED") {
    const amountOff = coupon.amountOff ?? 0;
    if (amountOff <= 0) return 0;
    return roundMoney(Math.min(subtotal, amountOff));
  }
  return 0;
};

export default function CheckoutContent(): ReactElement {
  const checkoutWhatsappIcon = useMediaSlot("checkout_whatsapp_icon_01");
  const initialContact = useMemo(() => parsePendingSubscriptionContact(), []);
  const [items, setItems] = useState<CartItem[]>(() => readCart());
  const [isCartDetailsOpen, setIsCartDetailsOpen] = useState<boolean>(false);
  const [couponCode, setCouponCode] = useState<string>("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [couponError, setCouponError] = useState<string>("");
  const [couponSuccess, setCouponSuccess] = useState<string>("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState<boolean>(false);
  const [customerName, setCustomerName] = useState<string>(initialContact.customerName);
  const [customerEmail, setCustomerEmail] = useState<string>(initialContact.customerEmail);
  const [customerPhone, setCustomerPhone] = useState<string>(initialContact.customerPhone);
  const [isStartingCheckout, setIsStartingCheckout] = useState<boolean>(false);
  const [checkoutError, setCheckoutError] = useState<string>("");
  const [checkoutSuccess, setCheckoutSuccess] = useState<string>("");
  const [stripeQueryHandled, setStripeQueryHandled] = useState<boolean>(false);
  const [deliveryMethod, setDeliveryMethod] = useState<CheckoutDeliveryMethod>("LOCAL_DELIVERY");
  const [shippingPolicy, setShippingPolicy] = useState<{
    localDeliveryFee: number;
    freeShippingThreshold: number;
  }>({
    localDeliveryFee: DEFAULT_LOCAL_DELIVERY_FEE,
    freeShippingThreshold: DEFAULT_FREE_SHIPPING_THRESHOLD,
  });

  useEffect(() => {
    const syncCart = () => {
      setItems(readCart());
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key !== CART_STORAGE_KEY) return;
      syncCart();
    };

    window.addEventListener(CART_UPDATED_EVENT, syncCart as EventListener);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, syncCart as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadShippingPolicy = async (): Promise<void> => {
      try {
        const response = await fetch(`${API_URL}/api/public/checkout/shipping-policy`, {
          signal: controller.signal,
        });
        if (!response.ok) return;
        const payload = (await response.json()) as CheckoutShippingPolicyResponse;
        const nextLocalFee = Number(payload?.policy?.localDeliveryFee);
        const nextFreeThreshold = Number(payload?.policy?.freeShippingThreshold);
        setShippingPolicy({
          localDeliveryFee:
            Number.isFinite(nextLocalFee) && nextLocalFee >= 0
              ? nextLocalFee
              : DEFAULT_LOCAL_DELIVERY_FEE,
          freeShippingThreshold:
            Number.isFinite(nextFreeThreshold) && nextFreeThreshold >= 0
              ? nextFreeThreshold
              : DEFAULT_FREE_SHIPPING_THRESHOLD,
        });
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
      }
    };

    void loadShippingPolicy();
    return () => controller.abort();
  }, []);

  const subtotal = useMemo(() => getCartSubtotal(items), [items]);
  const shipping = useMemo(() => {
    if (subtotal <= 0) return 0;
    if (deliveryMethod === "PICKUP") return 0;
    return subtotal >= shippingPolicy.freeShippingThreshold ? 0 : shippingPolicy.localDeliveryFee;
  }, [deliveryMethod, shippingPolicy.freeShippingThreshold, shippingPolicy.localDeliveryFee, subtotal]);
  const taxes = useMemo(() => subtotal * TAX_RATE, [subtotal]);
  const total = useMemo(
    () => Math.max(0, subtotal + shipping + taxes - couponDiscount),
    [subtotal, shipping, taxes, couponDiscount]
  );

  useEffect(() => {
    if (subtotal <= 0) {
      setCouponDiscount(0);
      setAppliedCoupon(null);
      setCouponCode("");
      setCouponError("");
      setCouponSuccess("");
      return;
    }
    if (!appliedCoupon) return;
    const nextDiscount = getAppliedCouponDiscount(appliedCoupon, subtotal);
    setCouponDiscount(nextDiscount);
    const minSubtotal = appliedCoupon.minSubtotal ?? 0;
    if (nextDiscount <= 0 && minSubtotal > 0 && subtotal < minSubtotal) {
      setCouponError(
        `Subtotal minimo para o cupom ${appliedCoupon.code}: ${formatCartCurrency(minSubtotal)}`
      );
      setCouponSuccess("");
      return;
    }
    if (couponError.startsWith("Subtotal minimo")) {
      setCouponError("");
      setCouponSuccess(`Cupom ${appliedCoupon.code} aplicado com sucesso.`);
    }
  }, [appliedCoupon, couponError, subtotal]);

  const updateItemQuantity = (item: CartItem, quantity: number): void => {
    setItems(setCartItemQuantity(item.key, quantity));
  };

  const removeItem = (item: CartItem): void => {
    setItems(removeCartItem(item.key));
  };

  const applyCoupon = async (): Promise<void> => {
    const normalizedCode = couponCode.trim().toUpperCase();
    if (!normalizedCode) {
      setCouponError("Informe um codigo de desconto.");
      setCouponSuccess("");
      return;
    }
    if (subtotal <= 0) {
      setCouponError("Adicione itens ao carrinho antes de aplicar cupom.");
      setCouponSuccess("");
      return;
    }

    setIsApplyingCoupon(true);
    setCouponError("");
    setCouponSuccess("");
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), COUPON_REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(`${API_URL}/api/public/discount-coupons/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: normalizedCode, subtotal }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          message?: string;
          detail?: string;
        };
        const message = payload.detail || payload.message || "Falha ao validar cupom.";
        throw new Error(message);
      }
      const payload = (await response.json()) as CouponValidationResponse;
      setAppliedCoupon(payload.coupon);
      setCouponDiscount(payload.discount);
      setCouponCode(payload.coupon.code);
      setCouponSuccess(`Cupom ${payload.coupon.code} aplicado com sucesso.`);
    } catch (error) {
      setAppliedCoupon(null);
      setCouponDiscount(0);
      if (error instanceof Error && error.name === "AbortError") {
        setCouponError("Tempo de resposta excedido ao validar cupom. Tente novamente.");
      } else {
        setCouponError(error instanceof Error ? error.message : "Falha ao validar cupom.");
      }
    } finally {
      window.clearTimeout(timeoutId);
      setIsApplyingCoupon(false);
    }
  };

  const clearCoupon = (): void => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode("");
    setCouponError("");
    setCouponSuccess("");
  };

  const confirmStripeSession = async (sessionId: string): Promise<void> => {
    const response = await fetch(
      `${API_URL}/api/public/payments/stripe/confirm-session?sessionId=${encodeURIComponent(sessionId)}`
    );
    const payload = (await response.json().catch(() => ({}))) as
      | StripeConfirmSessionResponse
      | { message?: string; detail?: string };
    if (!response.ok) {
      const message =
        (payload as { detail?: string; message?: string }).detail ||
        (payload as { detail?: string; message?: string }).message ||
        "Falha ao confirmar pagamento com Stripe.";
      throw new Error(message);
    }
    const confirmed = payload as StripeConfirmSessionResponse;
    if (confirmed.paymentStatus !== "APROVADO" || confirmed.order?.status !== "PAGO") {
      throw new Error("Pagamento ainda pendente no Stripe. Aguarde e tente novamente.");
    }
    clearCart();
    window.localStorage.removeItem(PENDING_STRIPE_ORDER_KEY);
    window.localStorage.removeItem(PENDING_SUBSCRIPTION_KEY);
    setItems(readCart());
    setCheckoutError("");
    setCheckoutSuccess(
      `Pagamento confirmado! Pedido ${confirmed.order.publicCode || `#${confirmed.order.id}`} aprovado.`
    );
  };

  const cancelPendingStripeOrder = async (orderId?: number, paymentRecordId?: number): Promise<void> => {
    const hasOrder = typeof orderId === "number" && Number.isFinite(orderId);
    const hasPayment = typeof paymentRecordId === "number" && Number.isFinite(paymentRecordId);
    if (!hasOrder && !hasPayment) return;

    await fetch(`${API_URL}/api/public/payments/stripe/cancel-pending`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(hasOrder ? { orderId } : {}),
        ...(hasPayment ? { paymentRecordId } : {}),
      }),
    }).catch(() => undefined);
  };

  const startStripeCheckout = async (): Promise<void> => {
    if (!items.length) return;
    const normalizedName = customerName.trim();
    const normalizedEmail = customerEmail.trim();
    const normalizedPhone = customerPhone.trim();
    if (!normalizedName || !normalizedEmail || !normalizedPhone) {
      setCheckoutError("Preencha nome, email e telefone para concluir a compra.");
      setCheckoutSuccess("");
      return;
    }

    setIsStartingCheckout(true);
    setCheckoutError("");
    setCheckoutSuccess("");
    try {
      const response = await fetch(`${API_URL}/api/public/payments/stripe/checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            itemType: item.itemType,
            entityId: item.entityId,
            quantity: item.quantity,
          })),
          customerName: normalizedName,
          customerEmail: normalizedEmail,
          customerPhone: normalizedPhone,
          couponCode: appliedCoupon?.code,
          deliveryMethod,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as
        | StripeCheckoutSessionResponse
        | { message?: string; detail?: string };
      if (!response.ok) {
        const message =
          (payload as { detail?: string; message?: string }).detail ||
          (payload as { detail?: string; message?: string }).message ||
          "Falha ao iniciar checkout Stripe.";
        throw new Error(message);
      }
      const session = payload as StripeCheckoutSessionResponse;
      const pendingPayload: PendingStripeOrderPayload = {
        orderId: session.orderId,
        paymentRecordId: session.paymentRecordId,
        publicCode: session.publicCode,
        sessionId: session.sessionId,
      };
      window.localStorage.setItem(PENDING_STRIPE_ORDER_KEY, JSON.stringify(pendingPayload));
      window.location.href = session.checkoutUrl;
    } catch (error) {
      setCheckoutError(
        error instanceof Error ? error.message : "Falha ao redirecionar para Stripe Checkout."
      );
      setCheckoutSuccess("");
    } finally {
      setIsStartingCheckout(false);
    }
  };

  useEffect(() => {
    if (stripeQueryHandled) return;
    const searchParams = new URLSearchParams(window.location.search);
    const stripeSessionId = searchParams.get("stripeSessionId") || "";
    const stripeSuccess = searchParams.get("stripeSuccess") === "1";
    const stripeCanceled = searchParams.get("stripeCanceled") === "1";
    const orderIdFromUrl = Number(searchParams.get("orderId"));
    const paymentRecordIdFromUrl = Number(searchParams.get("paymentRecordId"));

    if (!stripeSuccess && !stripeCanceled) {
      setStripeQueryHandled(true);
      return;
    }

    const pendingRaw = window.localStorage.getItem(PENDING_STRIPE_ORDER_KEY);
    let pendingOrder: PendingStripeOrderPayload | null = null;
    if (pendingRaw) {
      try {
        pendingOrder = JSON.parse(pendingRaw) as PendingStripeOrderPayload;
      } catch {
        pendingOrder = null;
      }
    }

    const run = async () => {
      if (stripeSuccess && stripeSessionId) {
        await confirmStripeSession(stripeSessionId);
      } else if (stripeCanceled) {
        await cancelPendingStripeOrder(
          Number.isFinite(orderIdFromUrl) ? orderIdFromUrl : pendingOrder?.orderId,
          Number.isFinite(paymentRecordIdFromUrl)
            ? paymentRecordIdFromUrl
            : pendingOrder?.paymentRecordId
        );
        window.localStorage.removeItem(PENDING_STRIPE_ORDER_KEY);
        setCheckoutSuccess("Pagamento cancelado no Stripe. O pedido pendente foi cancelado.");
        setCheckoutError("");
      }
    };

    run()
      .catch((error) => {
        setCheckoutSuccess("");
        setCheckoutError(
          error instanceof Error
            ? error.message
            : "Falha ao finalizar retorno do Stripe no checkout."
        );
      })
      .finally(() => {
        setStripeQueryHandled(true);
      });
  }, [stripeQueryHandled]);

  return (
    <main className="flex-grow max-w-[980px] mx-auto px-3 lg:px-4 pt-6 md:pt-8 pb-10">
      <div className="grid grid-cols-1 gap-8 items-start">
        <div className="col-span-1 flex flex-col gap-8">
          <div className="border-b border-gray-200 pb-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-[#0d1b12]">Checkout</h2>
              <a
                className="inline-flex items-center gap-2 rounded-lg border border-green-600 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-green-700 hover:bg-green-50 transition-colors"
                data-checkout-whatsapp-link
                href="https://api.whatsapp.com/send?phone=5511989261279"
                rel="noopener noreferrer"
                target="_blank"
              >
                <img alt="WhatsApp" className="h-6 w-6 rounded-md" src={checkoutWhatsappIcon} />
                <span>Fale Conosco</span>
              </a>
            </div>
            <p className="text-sm text-gray-500 mt-2 pb-2">
              Siga a ordem: subtotal, cupom, dados de pagamento e total a pagar.
            </p>
          </div>
          {checkoutError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {checkoutError}
            </div>
          ) : null}
          {checkoutSuccess ? (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {checkoutSuccess}
            </div>
          ) : null}

          <section className="bg-white rounded-xl border border-gold/20 shadow-sm overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-stone-100 bg-stone-50/60">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-stone-500 font-semibold">
                    Subtotal (carrinho)
                  </p>
                  <p className="text-xs text-stone-500 mt-1">
                    Clique no valor para {isCartDetailsOpen ? "ocultar" : "ver"} os itens.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCartDetailsOpen((current) => !current)}
                  className="inline-flex items-center gap-2 rounded-lg border border-gold/30 bg-white px-3 py-2 text-sm font-semibold text-[#0d1b12] hover:bg-gold/5 transition-colors"
                  aria-expanded={isCartDetailsOpen}
                  aria-controls="checkout-cart-details"
                >
                  <span>{formatCartCurrency(subtotal)}</span>
                  <span className="material-symbols-outlined text-base">
                    {isCartDetailsOpen ? "expand_less" : "expand_more"}
                  </span>
                </button>
              </div>
            </div>

            {isCartDetailsOpen ? (
              <div id="checkout-cart-details" className="px-5 sm:px-6 py-4 max-h-[380px] overflow-y-auto">
                {items.length ? (
                  <ul className="divide-y divide-gray-100" role="list">
                    {items.map((item) => {
                      const itemImage = resolveUploadedAssetUrl(item.imageUrl) || FALLBACK_IMAGE_URL;
                      return (
                        <li className="flex py-5" key={item.key}>
                          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-50 relative">
                            <img className="h-full w-full object-cover object-center" src={itemImage} alt={item.name} />
                            <span className="absolute top-0 right-0 -mt-2 -mr-2 bg-gray-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                              {item.quantity}
                            </span>
                          </div>
                          <div className="ml-4 flex flex-1 flex-col">
                            <div>
                              <div className="flex justify-between text-base font-medium text-[#0d1b12] gap-3">
                                <h3 className="leading-tight">{item.name}</h3>
                                <p className="whitespace-nowrap">{formatCartCurrency(item.price * item.quantity)}</p>
                              </div>
                              <p className="mt-1 text-sm text-gray-500">{getItemSubtitle(item)}</p>
                            </div>
                            <div className="mt-3 flex items-center justify-between gap-3">
                              <div className="inline-flex items-center rounded-md border border-gray-300 bg-white">
                                <button
                                  className="h-8 w-8 text-sm font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                                  disabled={item.quantity <= 1}
                                  onClick={() => updateItemQuantity(item, item.quantity - 1)}
                                  type="button"
                                >
                                  -
                                </button>
                                <span className="min-w-8 text-center text-sm font-semibold text-[#0d1b12]">
                                  {item.quantity}
                                </span>
                                <button
                                  className="h-8 w-8 text-sm font-bold text-gray-700 hover:bg-gray-100"
                                  onClick={() => updateItemQuantity(item, item.quantity + 1)}
                                  type="button"
                                >
                                  +
                                </button>
                              </div>
                              <button
                                className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline"
                                onClick={() => removeItem(item)}
                                type="button"
                              >
                                Remover
                              </button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="py-6 text-center text-sm text-gray-500">Seu carrinho esta vazio.</p>
                )}
              </div>
            ) : null}
          </section>

          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sm:p-6">
            <div className="mb-4">
              <h3 className="text-base font-bold text-[#0d1b12]">Cupom</h3>
              <p className="text-xs text-gray-500 mt-1">Informe o nome/codigo do cupom.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-grow">
                <input
                  className="block w-full rounded-md border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-white"
                  id="discount-code"
                  name="discount-code"
                  placeholder="Codigo de desconto"
                  value={couponCode}
                  onChange={(event) => setCouponCode(event.target.value)}
                  type="text"
                />
              </div>
              <button
                className="rounded-md bg-stone-200 px-4 py-2 text-sm font-semibold text-stone-600 shadow-sm hover:bg-stone-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-400 transition disabled:opacity-60"
                onClick={() => applyCoupon()}
                disabled={isApplyingCoupon || items.length === 0}
                type="button"
              >
                {isApplyingCoupon ? "Aplicando..." : "Aplicar"}
              </button>
              {appliedCoupon ? (
                <button
                  className="rounded-md border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition"
                  onClick={() => clearCoupon()}
                  type="button"
                >
                  Remover cupom
                </button>
              ) : null}
            </div>
            {couponError ? <p className="mt-2 text-xs text-red-600">{couponError}</p> : null}
            {couponSuccess ? <p className="mt-2 text-xs text-green-700">{couponSuccess}</p> : null}
          </section>

          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sm:p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#0d1b12]">Dados da cliente</h3>
              <p className="text-xs text-gray-500 mt-1">
                Informações usadas para gerar e rastrear o pedido.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="sm:col-span-2 text-xs text-gray-700 font-medium">
                Nome completo
                <input
                  className="mt-1 block w-full rounded-lg border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                  placeholder="Seu nome"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  type="text"
                />
              </label>
              <label className="text-xs text-gray-700 font-medium">
                E-mail
                <input
                  className="mt-1 block w-full rounded-lg border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                  placeholder="voce@email.com"
                  value={customerEmail}
                  onChange={(event) => setCustomerEmail(event.target.value)}
                  type="email"
                />
              </label>
              <label className="text-xs text-gray-700 font-medium">
                Telefone / WhatsApp
                <input
                  className="mt-1 block w-full rounded-lg border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                  placeholder="+55 11 99999-9999"
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  type="tel"
                />
              </label>
            </div>
          </section>

          <section aria-labelledby="payment-heading" className="space-y-6">
            <div className="flex items-center justify-between gap-3">
              <h3 id="payment-heading" className="text-lg font-bold text-[#0d1b12]">
                Dados para pagamento
              </h3>
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                PIX ou Cartao
              </span>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="p-5 sm:p-6 border-b border-gray-100 bg-stone-50/40">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center">
                    <input
                      checked
                      className="h-4 w-4 border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      id="payment-card"
                      name="payment-method"
                      type="radio"
                      readOnly
                    />
                    <label className="ml-3 block text-sm font-bold text-[#0d1b12]" htmlFor="payment-card">
                      Cartao de Credito/Debito
                    </label>
                  </div>
                  <div className="flex gap-1.5 opacity-80">
                    <div className="h-6 w-9 rounded bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                      <span className="text-[8px] font-extrabold text-[#1a1f71] tracking-tighter">VISA</span>
                    </div>
                    <div className="h-6 w-9 rounded bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                      <span className="text-[8px] font-extrabold text-[#eb001b]">MC</span>
                    </div>
                    <div className="h-6 w-9 rounded bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                      <span className="text-[8px] font-extrabold text-[#006fcf]">AMEX</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-4 pl-0 sm:pl-7 transition-all duration-300">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1.5" htmlFor="card-number">
                      Numero do Cartao
                    </label>
                    <div className="relative">
                      <input
                        autoComplete="cc-number"
                        className="block w-full rounded-lg border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-white pr-10 input-transition"
                        id="card-number"
                        name="card-number"
                        placeholder="0000 0000 0000 0000"
                        type="text"
                      />
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                        <span className="material-symbols-outlined text-gray-400 text-lg">credit_card</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5" htmlFor="expiration-date">
                      Validade (MM/AA)
                    </label>
                    <input
                      autoComplete="cc-exp"
                      className="block w-full rounded-lg border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-white input-transition"
                      id="expiration-date"
                      name="expiration-date"
                      placeholder="MM / AA"
                      type="text"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5" htmlFor="cvc">
                      CVV
                    </label>
                    <div className="relative">
                      <input
                        autoComplete="csc"
                        className="block w-full rounded-lg border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-white input-transition"
                        id="cvc"
                        name="cvc"
                        placeholder="123"
                        type="text"
                      />
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                        <span className="material-symbols-outlined text-gray-400 text-lg">help</span>
                      </div>
                    </div>
                  </div>
                  <div className="sm:col-span-2 pt-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1.5" htmlFor="card-name">
                      Nome no Cartao
                    </label>
                    <input
                      autoComplete="cc-name"
                      className="block w-full rounded-lg border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-white input-transition"
                      id="card-name"
                      name="card-name"
                      type="text"
                    />
                  </div>
                </div>
              </div>
              <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition group">
                <div className="flex items-center">
                  <input
                    className="h-4 w-4 border-gray-300 text-primary focus:ring-primary cursor-pointer"
                    id="payment-pix"
                    name="payment-method"
                    type="radio"
                  />
                  <label
                    className="ml-3 block text-sm font-medium text-[#0d1b12] cursor-pointer group-hover:text-primary transition-colors"
                    htmlFor="payment-pix"
                  >
                    PIX
                  </label>
                </div>
                <div className="bg-primary/10 text-primary px-3 py-1 rounded text-[10px] font-bold tracking-wide">
                  Instantaneo
                </div>
              </div>
              <div className="hidden p-4 sm:p-5 items-center justify-between cursor-pointer hover:bg-gray-50 transition group">
                <div className="flex items-center">
                  <input
                    className="h-4 w-4 border-gray-300 text-primary focus:ring-primary cursor-pointer"
                    id="payment-paypal"
                    name="payment-method"
                    type="radio"
                  />
                  <label
                    className="ml-3 block text-sm font-medium text-[#0d1b12] cursor-pointer group-hover:text-primary transition-colors"
                    htmlFor="payment-paypal"
                  >
                    PayPal
                  </label>
                </div>
                <span className="text-[#003087] font-bold italic text-xs tracking-tight">PayPal</span>
              </div>
            </div>
          </section>

          <div className="flex items-start gap-4 p-5 rounded-lg bg-gold/5 border border-gold/20">
            <div className="flex-shrink-0 bg-white p-2 rounded-full shadow-sm border border-gold/10">
              <span className="material-symbols-outlined text-gold text-xl block">lock</span>
            </div>
            <div>
              <h3 className="font-bold text-[#0d1b12] text-sm flex items-center gap-2">Transacao Segura</h3>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed max-w-prose">
                Suas informacoes pessoais e de pagamento sao criptografadas com tecnologia SSL de 256 bits. Nao armazenamos os dados completos do cartao em nossos servidores.
              </p>
            </div>
          </div>

          <div className="hidden lg:hidden mt-2">
            <button
              className="w-full flex items-center justify-center rounded-lg bg-primary h-14 text-white font-bold text-lg shadow-lg hover:bg-[#0da640] transition duration-200 disabled:opacity-60"
              disabled={items.length === 0 || isStartingCheckout}
              onClick={() => {
                void startStripeCheckout();
              }}
              type="button"
            >
              {isStartingCheckout ? "Redirecionando..." : "Concluir Compra"}
            </button>
          </div>
        </div>

        <div className="col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gold/20 overflow-hidden">
            <div className="p-6 bg-stone-50 border-b border-stone-100">
              <h2 className="text-lg font-bold text-[#0d1b12]">Total a pagar</h2>
            </div>
            <div className="hidden px-6 py-4 max-h-[400px] overflow-y-auto">
              {items.length ? (
                <ul className="divide-y divide-gray-100" role="list">
                  {items.map((item) => (
                    <li className="flex py-6" key={item.key}>
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-50 relative">
                        <img className="h-full w-full object-cover object-center" src={item.imageUrl || FALLBACK_IMAGE_URL} alt={item.name} />
                        <span className="absolute top-0 right-0 -mt-2 -mr-2 bg-gray-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="ml-4 flex flex-1 flex-col">
                        <div>
                          <div className="flex justify-between text-base font-medium text-[#0d1b12]">
                            <h3>{item.name}</h3>
                            <p className="ml-4">{formatCartCurrency(item.price * item.quantity)}</p>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">{getItemSubtitle(item)}</p>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <div className="inline-flex items-center rounded-md border border-gray-300 bg-white">
                            <button
                              className="h-8 w-8 text-sm font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                              disabled={item.quantity <= 1}
                              onClick={() => updateItemQuantity(item, item.quantity - 1)}
                              type="button"
                            >
                              -
                            </button>
                            <span className="min-w-8 text-center text-sm font-semibold text-[#0d1b12]">
                              {item.quantity}
                            </span>
                            <button
                              className="h-8 w-8 text-sm font-bold text-gray-700 hover:bg-gray-100"
                              onClick={() => updateItemQuantity(item, item.quantity + 1)}
                              type="button"
                            >
                              +
                            </button>
                          </div>
                          <button
                            className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline"
                            onClick={() => removeItem(item)}
                            type="button"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-8 text-center text-sm text-gray-500">Seu carrinho esta vazio.</p>
              )}
            </div>
            <div className="hidden px-6 py-4 bg-stone-50/50 border-t border-gray-100">
              <div className="flex gap-2">
                <div className="relative flex-grow">
                  <input
                    className="block w-full rounded-md border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-white"
                    id="discount-code"
                    name="discount-code"
                    placeholder="Codigo de desconto"
                    value={couponCode}
                    onChange={(event) => setCouponCode(event.target.value)}
                    type="text"
                  />
                </div>
                <button
                  className="rounded-md bg-stone-200 px-4 py-2 text-sm font-semibold text-stone-600 shadow-sm hover:bg-stone-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-400 transition disabled:opacity-60"
                  onClick={() => applyCoupon()}
                  disabled={isApplyingCoupon || items.length === 0}
                  type="button"
                >
                  {isApplyingCoupon ? "Aplicando..." : "Aplicar"}
                </button>
                {appliedCoupon ? (
                  <button
                    className="rounded-md border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition"
                    onClick={() => clearCoupon()}
                    type="button"
                  >
                    Remover cupom
                  </button>
                ) : null}
              </div>
              {couponError ? <p className="mt-2 text-xs text-red-600">{couponError}</p> : null}
              {couponSuccess ? <p className="mt-2 text-xs text-green-700">{couponSuccess}</p> : null}
            </div>
            <div className="border-t border-gold/20 bg-stone-50 px-6 py-6 space-y-4">
              <div className="space-y-2 rounded-lg border border-gold/20 bg-white px-3 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">Forma de entrega</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    className={`rounded-lg border px-3 py-2 text-left transition ${
                      deliveryMethod === "PICKUP"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-gray-200 bg-white text-[#0d1b12] hover:border-primary/40"
                    }`}
                    onClick={() => setDeliveryMethod("PICKUP")}
                  >
                    <p className="text-sm font-semibold">Retirada no salao</p>
                    <p className="text-xs">Gratis</p>
                  </button>
                  <button
                    type="button"
                    className={`rounded-lg border px-3 py-2 text-left transition ${
                      deliveryMethod === "LOCAL_DELIVERY"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-gray-200 bg-white text-[#0d1b12] hover:border-primary/40"
                    }`}
                    onClick={() => setDeliveryMethod("LOCAL_DELIVERY")}
                  >
                    <p className="text-sm font-semibold">Entrega local</p>
                    <p className="text-xs">
                      {formatCartCurrency(shippingPolicy.localDeliveryFee)} ou gratis acima de{" "}
                      {formatCartCurrency(shippingPolicy.freeShippingThreshold)}
                    </p>
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  {deliveryMethod === "PICKUP"
                    ? "Disponivel em ate 24h uteis."
                    : subtotal >= shippingPolicy.freeShippingThreshold && subtotal > 0
                    ? "Frete local gratis aplicado nesta compra."
                    : `Frete local gratis a partir de ${formatCartCurrency(
                        shippingPolicy.freeShippingThreshold
                      )}.`}
                </p>
              </div>
              <div className="flex justify-between text-sm font-medium text-gray-600">
                <p>Subtotal</p>
                <p>{formatCartCurrency(subtotal)}</p>
              </div>
              <div className="flex justify-between text-sm font-medium text-gray-600">
                <p>{deliveryMethod === "PICKUP" ? "Retirada no salao" : "Entrega local"}</p>
                <p>{shipping > 0 ? formatCartCurrency(shipping) : "Gratis"}</p>
              </div>
              <div className="flex justify-between text-sm font-medium text-gray-600">
                <p>Impostos</p>
                <p>{formatCartCurrency(taxes)}</p>
              </div>
              {appliedCoupon ? (
                <div className="flex justify-between text-sm font-semibold text-green-700">
                  <p>Cupom ({appliedCoupon.code})</p>
                  <p>-{formatCartCurrency(couponDiscount)}</p>
                </div>
              ) : null}
              <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                <p className="text-lg font-bold text-[#0d1b12]">Total a pagar</p>
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-0.5">BRL</p>
                  <p className="text-2xl font-bold text-[#0d1b12]">{formatCartCurrency(total)}</p>
                </div>
              </div>
              <button
                className="w-full flex items-center justify-center rounded-lg bg-primary h-12 text-white font-bold text-lg shadow-md hover:shadow-lg hover:bg-[#0da640] transition-all duration-300 mt-4 group disabled:opacity-60"
                disabled={items.length === 0 || isStartingCheckout}
                onClick={() => {
                  void startStripeCheckout();
                }}
                type="button"
              >
                {isStartingCheckout ? "Redirecionando..." : "Concluir Compra"}
                <span className="material-symbols-outlined ml-2 group-hover:translate-x-1 transition-transform">lock</span>
              </button>
              <div className="flex justify-center items-center gap-2 mt-4 text-gray-400">
                <span className="material-symbols-outlined text-lg">verified_user</span>
                <span className="text-xs font-medium">Transacao Criptografada SSL</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
