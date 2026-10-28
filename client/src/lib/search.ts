import { products, type Product } from "@/data/products";
import { collections, type Collection } from "@/data/collections";

const norm = (s: string) => s.toLowerCase().replace(/[₹,]/g, "").trim();

export function searchAll(q: string): { products: Product[]; collections: Collection[] } {
  const query = norm(q);
  if (!query) return { products: [], collections: [] };
  const budget = query.match(/(?:under|below|less than)\s*(\d+)/);
  const max = budget ? Number(budget[1]) : null;
  const words = query
    .replace(/(?:under|below|less than)\s*\d+/, "")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !["the", "and", "for", "fits", "outfits", "outfit"].includes(w));

  const hay = (p: Product) =>
    norm([p.name, p.category, p.subcategory, p.retailer, p.brand, ...p.availableColors, ...p.tags, ...p.collectionIds.join(" ").split("-")].join(" "));

  const prods = products.filter((p) => {
    if (max !== null && p.price > max) return false;
    if (!words.length) return max !== null;
    const h = hay(p);
    return words.every((w) => h.includes(w.replace(/s$/, "")));
  });
  const cols = collections.filter((c) => {
    const h = norm(c.title + " " + c.slug.replace(/-/g, " ") + " " + c.description);
    return words.length ? words.some((w) => h.includes(w.replace(/s$/, ""))) : false;
  });
  return { products: prods, collections: cols.slice(0, 4) };
}

export const searchSuggestions = ["Black oversized tee", "White sneakers", "Under 1000", "College outfits", "Everyday shirts"];
