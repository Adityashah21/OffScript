import type { Product } from "@/data/products";

export const MAX_QTY = 5;

/** A product may show the COD request flow only when both flags agree. */
export const isCodEligible = (p: Product) => p.purchaseMode === "authorized_cod" && p.codEnabled;

export const orderTotal = (p: Product, qty: number) => p.price * qty + p.shippingCharge;

export interface OrderInput {
  fullName: string;
  mobile: string;
  email: string;
  house: string;
  street: string;
  landmark: string;
  city: string;
  state: string;
  pin: string;
  size: string;
  color: string;
  quantity: number;
  instructions: string;
  confirmed: boolean;
}

export const isValidIndianMobile = (v: string) => /^(?:\+91[\s-]?|0)?[6-9]\d{9}$/.test(v.replace(/\s+/g, ""));
export const isValidPin = (v: string) => /^[1-9]\d{5}$/.test(v.trim());

export function validateOrder(p: Product, f: OrderInput) {
  const e: Partial<Record<keyof OrderInput | "product", string>> = {};
  if (!isCodEligible(p)) e.product = "This piece isn't available for cash on delivery.";
  if (f.fullName.trim().length < 2) e.fullName = "Enter your full name.";
  if (!isValidIndianMobile(f.mobile)) e.mobile = "Enter a valid 10-digit Indian mobile number.";
  if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = "Enter a valid email or leave it blank.";
  if (!f.house.trim()) e.house = "Enter your house or flat number.";
  if (!f.street.trim()) e.street = "Enter your street or locality.";
  if (!f.city.trim()) e.city = "Enter your city.";
  if (!f.state.trim()) e.state = "Select your state.";
  if (!isValidPin(f.pin)) e.pin = "Enter a valid 6-digit PIN code.";
  if (p.availableSizes.length && !f.size) e.size = "Select a size.";
  if (!Number.isInteger(f.quantity) || f.quantity < 1 || f.quantity > MAX_QTY)
    e.quantity = `Quantity must be between 1 and ${MAX_QTY}.`;
  if (!f.confirmed) e.confirmed = "Please confirm your details.";
  return e;
}

export const mockOrderRef = () => "DEMO-" + Math.random().toString(36).slice(2, 8).toUpperCase();
