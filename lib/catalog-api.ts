// TODO: CatalogAPI integration — not yet active
// This entire module is commented out. The rewards catalog is currently
// manual-only (business owners create their own rewards).
// When CatalogAPI is ready to launch, uncomment and configure env vars:
//   CATALOG_API_TOKEN, CATALOG_API_BASE_URL, CATALOG_SOCKET_ID

/*
// ============================================================
// CatalogAPI v2 — Server-side client
// All requests go through this module so the bearer token
// never reaches the browser.
// ============================================================

import type {
  CatalogSocket,
  CatalogCategory,
  CatalogBrand,
  CatalogTag,
  CatalogItem,
  CatalogCart,
  CatalogOrder,
  CatalogStockInfo,
} from "./types";

const BASE_URL =
  process.env.CATALOG_API_BASE_URL ??
  "https://api.catalogapi.com/sandbox/api/v2";

const TOKEN = process.env.CATALOG_API_TOKEN ?? "";

// ── Helpers ──────────────────────────────────────────────────

interface CatalogApiError {
  success: false;
  error_code: string;
  message: string;
}

type CatalogResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string; error_code: string };

async function request<T>(
  path: string,
  init?: RequestInit
): Promise<CatalogResult<T>> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const json = await res.json();

  if (!res.ok || json.success === false) {
    const err = json as CatalogApiError;
    return {
      ok: false,
      status: res.status,
      error: err.message ?? "CatalogAPI request failed",
      error_code: err.error_code ?? "UNKNOWN",
    };
  }

  return { ok: true, data: json as T };
}

// ── Sockets ──────────────────────────────────────────────────

interface SocketListRes {
  success: boolean;
  sockets: CatalogSocket[];
  total_sockets: number;
}

export function listSockets() {
  return request<SocketListRes>("/sockets");
}

interface SocketDetailRes extends CatalogSocket {
  success: boolean;
}

export function getSocket(socketId: number) {
  return request<SocketDetailRes>(`/sockets/${socketId}`);
}

// ── Categories ───────────────────────────────────────────────

interface CategoryListRes {
  success: boolean;
  categories: CatalogCategory[];
  total_categories: number;
}

export function listCategories(socketId: number) {
  return request<CategoryListRes>(`/sockets/${socketId}/categories`);
}

// ── Brands ───────────────────────────────────────────────────

interface BrandListRes {
  success: boolean;
  brands: CatalogBrand[];
  total_brands: number;
}

export function listBrands(socketId: number) {
  return request<BrandListRes>(`/sockets/${socketId}/brands`);
}

// ── Tags ─────────────────────────────────────────────────────

interface TagListRes {
  success: boolean;
  tags: CatalogTag[];
  total_tags: number;
}

export function listTags(socketId: number) {
  return request<TagListRes>(`/sockets/${socketId}/tags`);
}

// ── Items ────────────────────────────────────────────────────

export interface ItemSearchParams {
  search?: string;
  category_id?: number;
  brand_id?: number;
  tag_id?: number;
  item_type_id?: number;
  fulfillment_type?: "physical" | "digital";
  min_points?: number;
  max_points?: number;
  min_price?: number;
  max_price?: number;
  page?: number;
  per_page?: number;
  sort?: string;
  brand_faceting?: "top" | "full";
  tag_faceting?: "top" | "full";
}

interface ItemSearchRes {
  success: boolean;
  items: CatalogItem[];
  total_items: number;
  page: number;
  per_page: number;
  total_pages: number;
  facets?: {
    brands?: CatalogBrand[];
    tags?: CatalogTag[];
  };
}

export function searchItems(socketId: number, params: ItemSearchParams) {
  const qs = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && val !== "") {
      qs.set(key, String(val));
    }
  }
  const query = qs.toString();
  return request<ItemSearchRes>(
    `/sockets/${socketId}/items${query ? `?${query}` : ""}`
  );
}

interface ItemDetailRes extends CatalogItem {
  success: boolean;
}

export function getItem(socketId: number, catalogItemId: number) {
  return request<ItemDetailRes>(
    `/sockets/${socketId}/items/${catalogItemId}`
  );
}

// ── Stock ────────────────────────────────────────────────────

interface StockRes extends CatalogStockInfo {
  success: boolean;
}

export function checkStock(socketId: number, catalogItemId: number) {
  return request<StockRes>(
    `/sockets/${socketId}/items/${catalogItemId}/stock`
  );
}

// ── Cart ─────────────────────────────────────────────────────

interface CartRes extends CatalogCart {
  success: boolean;
}

export function getCart(socketId: number, externalUserId: string) {
  return request<CartRes>(
    `/sockets/${socketId}/cart/${encodeURIComponent(externalUserId)}`
  );
}

export function addToCart(
  socketId: number,
  externalUserId: string,
  items: { catalog_item_id: number; metadata?: Record<string, string> }[]
) {
  return request<CartRes>(
    `/sockets/${socketId}/cart/${encodeURIComponent(externalUserId)}`,
    { method: "POST", body: JSON.stringify({ items }) }
  );
}

export function removeLineItem(
  socketId: number,
  externalUserId: string,
  lineItemId: string
) {
  return request<CartRes>(
    `/sockets/${socketId}/cart/${encodeURIComponent(externalUserId)}/line_items/${lineItemId}`,
    { method: "DELETE" }
  );
}

export function emptyCart(socketId: number, externalUserId: string) {
  return request<CartRes>(
    `/sockets/${socketId}/cart/${encodeURIComponent(externalUserId)}/empty`,
    { method: "POST" }
  );
}

// ── Address ──────────────────────────────────────────────────

export interface SetAddressBody {
  given_name?: string;
  surname?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  state_or_region?: string;
  postal_code?: string;
  country?: string;
  email?: string;
  phone_number?: string;
}

export function setCartAddress(
  socketId: number,
  externalUserId: string,
  address: SetAddressBody
) {
  return request<CartRes>(
    `/sockets/${socketId}/cart/${encodeURIComponent(externalUserId)}/set_address`,
    { method: "POST", body: JSON.stringify(address) }
  );
}

// ── Validate & Checkout ──────────────────────────────────────

interface ValidateRes {
  success: boolean;
  cart: CatalogCart;
  errors: string[];
  failed_items: Record<string, string[]>;
}

export function validateCart(
  socketId: number,
  externalUserId: string,
  lock = false
) {
  return request<ValidateRes>(
    `/sockets/${socketId}/cart/${encodeURIComponent(externalUserId)}/validate`,
    { method: "POST", body: JSON.stringify({ lock }) }
  );
}

export function unlockCart(socketId: number, externalUserId: string) {
  return request<CartRes>(
    `/sockets/${socketId}/cart/${encodeURIComponent(externalUserId)}/unlock`,
    { method: "POST" }
  );
}

interface PlaceOrderRes {
  success: boolean;
  external_order_id: string;
  order_number: string;
}

export interface LineItemPayment {
  line_item_id: string;
  price_paid: string;
  points_paid?: number;
  shipping_paid?: string;
  tax_paid?: string;
}

export function placeOrder(
  socketId: number,
  externalUserId: string,
  cartVersion: string,
  externalOrderId: string,
  lineItemPayments: LineItemPayment[]
) {
  return request<PlaceOrderRes>(
    `/sockets/${socketId}/cart/${encodeURIComponent(externalUserId)}/order_place`,
    {
      method: "POST",
      body: JSON.stringify({
        cart_version: cartVersion,
        external_order_id: externalOrderId,
        line_item_payments: lineItemPayments,
      }),
    }
  );
}

// ── Orders ───────────────────────────────────────────────────

interface OrderRes extends CatalogOrder {
  success: boolean;
}

export function getOrder(externalOrderId: string) {
  return request<OrderRes>(
    `/orders/${encodeURIComponent(externalOrderId)}`
  );
}
*/
