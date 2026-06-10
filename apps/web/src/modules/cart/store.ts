export type CartItemType = "PRODUCT" | "MEMBERSHIP";

export type CartItem = {
  key: string;
  itemType: CartItemType;
  entityId: number;
  name: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  price: number;
  quantity: number;
};

export type AddCartItemInput = {
  itemType: CartItemType;
  entityId: number;
  name: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  price: number | string;
  quantity?: number;
};

export const CART_STORAGE_KEY = "jlr_cart_v1";
export const CART_UPDATED_EVENT = "jlr:cart-updated";

const parseNumber = (value: number | string): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeText = (value: string | null | undefined): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const normalizeQuantity = (value?: number): number => {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.floor(value as number));
};

const buildCartItemKey = (itemType: CartItemType, entityId: number): string =>
  `${itemType}:${entityId}`;

const normalizeCartItem = (entry: unknown): CartItem | null => {
  if (!entry || typeof entry !== "object") return null;
  const row = entry as Record<string, unknown>;
  const itemType = row.itemType === "PRODUCT" || row.itemType === "MEMBERSHIP" ? row.itemType : null;
  const entityId = Number(row.entityId);
  const name = typeof row.name === "string" ? row.name.trim() : "";
  const price = parseNumber((row.price as number | string | undefined) ?? 0);
  const quantity = normalizeQuantity(Number(row.quantity ?? 1));
  if (!itemType || !Number.isFinite(entityId) || entityId <= 0 || !name) return null;
  return {
    key: buildCartItemKey(itemType, entityId),
    itemType,
    entityId,
    name,
    subtitle: normalizeText(typeof row.subtitle === "string" ? row.subtitle : null),
    imageUrl: normalizeText(typeof row.imageUrl === "string" ? row.imageUrl : null),
    price,
    quantity,
  };
};

const dispatchCartUpdated = (items: CartItem[]): void => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT, { detail: { items } }));
};

export const readCart = (): CartItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeCartItem).filter((item): item is CartItem => Boolean(item));
  } catch {
    return [];
  }
};

export const writeCart = (items: CartItem[]): CartItem[] => {
  const normalized = items.map(normalizeCartItem).filter((item): item is CartItem => Boolean(item));
  if (typeof window !== "undefined") {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(normalized));
    dispatchCartUpdated(normalized);
  }
  return normalized;
};

export const addCartItem = (input: AddCartItemInput): CartItem[] => {
  const itemType = input.itemType;
  const entityId = Number(input.entityId);
  if (!Number.isFinite(entityId) || entityId <= 0) return readCart();
  const name = input.name.trim();
  if (!name) return readCart();

  const nextItem: CartItem = {
    key: buildCartItemKey(itemType, entityId),
    itemType,
    entityId,
    name,
    subtitle: normalizeText(input.subtitle),
    imageUrl: normalizeText(input.imageUrl),
    price: parseNumber(input.price),
    quantity: normalizeQuantity(input.quantity),
  };

  const current = readCart();
  const index = current.findIndex((item) => item.key === nextItem.key);
  if (index >= 0) {
    current[index] = {
      ...current[index],
      quantity: normalizeQuantity(current[index].quantity + nextItem.quantity),
      price: nextItem.price || current[index].price,
      subtitle: nextItem.subtitle ?? current[index].subtitle,
      imageUrl: nextItem.imageUrl ?? current[index].imageUrl,
      name: nextItem.name || current[index].name,
    };
    return writeCart(current);
  }
  return writeCart([...current, nextItem]);
};

export const setCartItemQuantity = (itemKey: string, quantity: number): CartItem[] => {
  const current = readCart();
  const index = current.findIndex((item) => item.key === itemKey);
  if (index < 0) return current;
  if (quantity <= 0) {
    return writeCart(current.filter((item) => item.key !== itemKey));
  }
  current[index] = { ...current[index], quantity: normalizeQuantity(quantity) };
  return writeCart(current);
};

export const removeCartItem = (itemKey: string): CartItem[] => {
  const current = readCart();
  return writeCart(current.filter((item) => item.key !== itemKey));
};

export const clearCart = (): CartItem[] => writeCart([]);

export const getCartSubtotal = (items: CartItem[]): number =>
  items.reduce((total, item) => total + item.price * item.quantity, 0);

export const getCartQuantity = (items: CartItem[]): number =>
  items.reduce((total, item) => total + item.quantity, 0);

export const formatCartCurrency = (value: number): string =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
