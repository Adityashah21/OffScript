import { useSyncExternalStore } from "react";
import { updateCustomerProfile, type CustomerProfile } from "./store";

const TOKEN_KEY = "offscript:customer_jwt";
const USER_KEY = "offscript:customer_user";

export interface CustomerUserData {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  addresses?: Array<{
    id: string;
    tag?: string;
    fullName: string;
    mobile: string;
    house: string;
    street: string;
    landmark?: string;
    city: string;
    state: string;
    pin: string;
    isDefault?: boolean;
  }>;
  wishlist?: string[];
  role: "customer";
}

let cachedToken: string | null | undefined;
let cachedUser: CustomerUserData | null | undefined;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((cb) => cb());
}

export function getCustomerToken(): string | null {
  if (typeof window === "undefined") return null;
  if (cachedToken !== undefined) return cachedToken;
  try {
    cachedToken = localStorage.getItem(TOKEN_KEY);
  } catch {
    cachedToken = null;
  }
  return cachedToken;
}

export function getCustomerUser(): CustomerUserData | null {
  if (typeof window === "undefined") return null;
  if (cachedUser !== undefined) return cachedUser;
  try {
    const raw = localStorage.getItem(USER_KEY);
    cachedUser = raw ? (JSON.parse(raw) as CustomerUserData) : null;
  } catch {
    cachedUser = null;
  }
  return cachedUser;
}

export function setCustomerSession(token: string, user: CustomerUserData) {
  cachedToken = token;
  cachedUser = user;
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // ignore quota
  }

  // Update profile store
  const defaultAddr = user.addresses?.find((a) => a.isDefault) || user.addresses?.[0];
  updateCustomerProfile({
    fullName: user.name,
    email: user.email,
    mobile: user.mobile || defaultAddr?.mobile || "",
    ...(defaultAddr
      ? {
          house: defaultAddr.house,
          street: defaultAddr.street,
          landmark: defaultAddr.landmark || "",
          city: defaultAddr.city,
          state: defaultAddr.state,
          pin: defaultAddr.pin,
        }
      : {}),
  });

  notify();
}

export function clearCustomerSession() {
  cachedToken = null;
  cachedUser = null;
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // ignore
  }
  notify();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useCustomerAuth() {
  const user = useSyncExternalStore(subscribe, getCustomerUser, () => null);
  const token = useSyncExternalStore(subscribe, getCustomerToken, () => null);

  return {
    isAuthenticated: Boolean(token && user),
    user,
    token,
    logout: clearCustomerSession,
  };
}

export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
    if (window.location.hostname === "localhost") return "http://localhost:5001";
  }
  return "https://offscript-p9rk.onrender.com";
}

export async function loginCustomer(email: string, password: string): Promise<CustomerUserData> {
  const API_URL = getApiBaseUrl();
  const res = await fetch(`${API_URL}/api/customer/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || data.message || "Failed to log in");
  }

  setCustomerSession(data.token, data.customer);
  return data.customer;
}

export async function registerCustomer(params: {
  name: string;
  email: string;
  password: string;
  mobile?: string;
}): Promise<CustomerUserData> {
  const API_URL = getApiBaseUrl();
  const res = await fetch(`${API_URL}/api/customer/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || data.message || "Failed to create account");
  }

  setCustomerSession(data.token, data.customer);
  return data.customer;
}
