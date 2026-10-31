import { useSyncExternalStore } from "react";

/** Tiny localStorage-backed stores (frontend-only v1). */
function createStore<T>(key: string, fallback: T, storage: () => Storage | undefined = () => localStorage) {
  const listeners = new Set<() => void>();
  let cache: T | undefined;
  const read = (): T => {
    if (typeof window === "undefined") return fallback;
    if (cache !== undefined) return cache;
    try {
      const raw = storage()?.getItem(key);
      cache = raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      cache = fallback;
    }
    return cache;
  };
  const write = (v: T) => {
    cache = v;
    try {
      storage()?.setItem(key, JSON.stringify(v));
    } catch {
      /* ignore quota */
    }
    listeners.forEach((l) => l());
  };
  const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  };
  const use = () => useSyncExternalStore(subscribe, read, () => fallback);
  return { read, write, use };
}

const EMPTY: string[] = [];

export const wishlist = createStore<string[]>("offscript:wishlist", EMPTY);
export const toggleWishlist = (slug: string) => {
  const cur = wishlist.read();
  const has = cur.includes(slug);
  wishlist.write(has ? cur.filter((s) => s !== slug) : [...cur, slug]);
  return !has;
};

export const recentSearches = createStore<string[]>("offscript:recent", EMPTY);
export const pushRecent = (q: string) => {
  const t = q.trim();
  if (!t) return;
  recentSearches.write([t, ...recentSearches.read().filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 6));
};

export type Attribution = Record<string, string>;
export const attribution = createStore<Attribution>("offscript:attribution", {}, () => sessionStorage);
const UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
export function captureAttribution(search: Record<string, unknown>, landing: string) {
  const found: Attribution = {};
  for (const k of UTM) if (typeof search[k] === "string") found[k] = search[k] as string;
  if (Object.keys(found).length) attribution.write({ ...found, landing, capturedAt: new Date().toISOString() });
}

export interface CustomerProfile {
  fullName: string;
  mobile: string;
  email: string;
  house: string;
  street: string;
  landmark: string;
  city: string;
  state: string;
  pin: string;
  orderRefs: string[];
}

export const DEFAULT_CUSTOMER_PROFILE: CustomerProfile = {
  fullName: "",
  mobile: "",
  email: "",
  house: "",
  street: "",
  landmark: "",
  city: "",
  state: "",
  pin: "",
  orderRefs: [],
};

export const customerProfile = createStore<CustomerProfile>("offscript:customer_profile", DEFAULT_CUSTOMER_PROFILE);

export function updateCustomerProfile(data: Partial<CustomerProfile>) {
  const current = customerProfile.read();
  const updated: CustomerProfile = {
    ...current,
    ...data,
    orderRefs: data.orderRefs
      ? Array.from(new Set([...(data.orderRefs || []), ...(current.orderRefs || [])]))
      : current.orderRefs,
  };
  customerProfile.write(updated);
  return updated;
}

export function recordCustomerOrder(ref: string, details?: Partial<CustomerProfile>) {
  const current = customerProfile.read();
  const nextRefs = Array.from(new Set([ref, ...(current.orderRefs || [])]));
  const updated: CustomerProfile = {
    ...current,
    ...(details || {}),
    orderRefs: nextRefs,
  };
  customerProfile.write(updated);
  return updated;
}
