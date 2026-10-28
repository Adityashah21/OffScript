import { describe, expect, it } from "vitest";
import { getProduct, products } from "@/data/products";
import { isCodEligible, isValidIndianMobile, isValidPin, orderTotal, validateOrder, type OrderInput } from "@/lib/order";

const tee = getProduct("washed-black-oversized-tee")!;
const shirt = getProduct("relaxed-fit-everyday-shirt")!;
const good: OrderInput = { fullName: "Asha Rao", mobile: "9876543210", email: "", house: "12B", street: "MG Road", landmark: "", city: "Pune", state: "Maharashtra", pin: "411001", size: "M", color: "Washed Black", quantity: 1, instructions: "", confirmed: true };

describe("COD rules", () => {
  it("only authorized_cod products with codEnabled are eligible", () => {
    expect(isCodEligible(tee)).toBe(true);
    expect(isCodEligible(shirt)).toBe(false);
  });
  it("purchaseMode and codEnabled agree for every product", () => {
    for (const p of products) expect(p.codEnabled).toBe(p.purchaseMode === "authorized_cod");
  });
  it("total = price × qty + shipping", () => {
    expect(orderTotal(tee, 2)).toBe(699 * 2 + 49);
  });
  it("validates Indian mobile and 6-digit PIN", () => {
    expect(isValidIndianMobile("9876543210")).toBe(true);
    expect(isValidIndianMobile("1234567890")).toBe(false);
    expect(isValidPin("411001")).toBe(true);
    expect(isValidPin("41100")).toBe(false);
  });
  it("requires size, quantity 1–5 and confirmation", () => {
    expect(validateOrder(tee, good)).toEqual({});
    expect(validateOrder(tee, { ...good, size: "" }).size).toBeDefined();
    expect(validateOrder(tee, { ...good, quantity: 6 }).quantity).toBeDefined();
    expect(validateOrder(tee, { ...good, confirmed: false }).confirmed).toBeDefined();
    expect(validateOrder(shirt, good).product).toBeDefined();
  });
});
