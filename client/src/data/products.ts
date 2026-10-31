import tee from "@/assets/p-tee.jpg";
import creamTee from "@/assets/p-cream-tee.jpg";
import shirt from "@/assets/p-shirt.jpg";
import denim from "@/assets/p-denim.jpg";
import sneakers from "@/assets/p-sneakers.jpg";
import knit from "@/assets/p-knit.jpg";
import bag from "@/assets/p-bag.jpg";
import cargo from "@/assets/p-cargo.jpg";
import dress from "@/assets/p-dress.jpg";
import hero from "@/assets/hero.jpg";
import street from "@/assets/cat-streetwear.jpg";
import everyday from "@/assets/cat-everyday.jpg";
import her from "@/assets/cat-her.jpg";
import his from "@/assets/cat-his.jpg";
import acc from "@/assets/cat-accessories.jpg";

/**
 * ILLUSTRATIVE MOCK DATA. Not real inventory, retailers, or prices.
 * Shape mirrors the planned backend Product document.
 */
export type PurchaseMode = "affiliate" | "authorized_cod";
export type Gender = "women" | "men" | "unisex";

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: "Tops" | "Shirts" | "Bottoms" | "Dresses" | "Footwear" | "Accessories";
  subcategory: string;
  gender: Gender;
  retailer: string;
  brand: string;
  price: number;
  /** Only set when the source retailer listing supports it. */
  originalPrice?: number;
  currency: "INR";
  images: string[];
  availableSizes: string[];
  availableColors: string[];
  tags: string[];
  collectionIds: string[];
  affiliateUrl: string | null;
  purchaseMode: PurchaseMode;
  codEnabled: boolean;
  shippingCharge: number;
  inStock: boolean;
  isFeatured: boolean;
  isNew: boolean;
  isEditorsPick: boolean;
  material?: string;
  fit?: string;
  lastUpdatedAt: string;
}

const base = {
  currency: "INR" as const,
  affiliateUrl: null,
  purchaseMode: "affiliate" as PurchaseMode,
  codEnabled: false,
  shippingCharge: 0,
  inStock: true,
  isFeatured: false,
  isNew: false,
  isEditorsPick: false,
};

const APPAREL = ["XS", "S", "M", "L", "XL"];

export const products: Product[] = [
  {
    ...base,
    id: "p01",
    slug: "washed-black-oversized-tee",
    name: "Washed Black Oversized Tee",
    description:
      "A heavyweight boxy tee with a lived-in wash. Drop shoulders, a slightly cropped length and a collar that holds its shape. Sample description for demo purposes.",
    category: "Tops",
    subcategory: "T-Shirts",
    gender: "unisex",
    retailer: "OFFSCRIPT Select",
    brand: "Northlane",
    price: 699,
    images: [tee, hero],
    availableSizes: APPAREL,
    availableColors: ["Washed Black"],
    tags: ["oversized", "tee", "black", "streetwear", "college", "monochrome"],
    collectionIds: ["oversized-tees", "streetwear", "everyday-uniform", "college-core", "viral-finds", "monochrome"],
    purchaseMode: "authorized_cod",
    codEnabled: true,
    shippingCharge: 49,
    isFeatured: true,
    isEditorsPick: true,
    material: "Sample info: 100% cotton, 240 GSM",
    fit: "Oversized — size down for a closer fit",
    lastUpdatedAt: "2026-10-24T10:00:00Z",
  },
  {
    ...base,
    id: "p02",
    slug: "relaxed-fit-everyday-shirt",
    name: "Relaxed Fit Everyday Shirt",
    description:
      "Soft oxford weave in a pale sky blue. Wear it buttoned, open over a tee, or tucked into trousers. Sample description for demo purposes.",
    category: "Shirts",
    subcategory: "Casual Shirts",
    gender: "unisex",
    retailer: "Thread & Co.",
    brand: "Thread & Co.",
    price: 899,
    images: [shirt, everyday],
    availableSizes: APPAREL,
    availableColors: ["Sky Blue"],
    tags: ["shirt", "blue", "everyday", "office", "college", "clean"],
    collectionIds: ["everyday-uniform", "clean-fit", "college-core", "weekend-plans", "travel-fits"],
    affiliateUrl: "https://example.com/retailer/relaxed-fit-everyday-shirt?ref=offscript-demo",
    isFeatured: true,
    isNew: true,
    material: "Sample info: cotton oxford",
    fit: "Relaxed",
    lastUpdatedAt: "2026-10-25T09:30:00Z",
  },
  {
    ...base,
    id: "p03",
    slug: "straight-fit-denim",
    name: "Straight Fit Denim",
    description:
      "Mid-blue rigid denim with a straight leg and a high rise. The pair that goes with everything else on this page. Sample description for demo purposes.",
    category: "Bottoms",
    subcategory: "Jeans",
    gender: "unisex",
    retailer: "Denimwala",
    brand: "Denimwala",
    price: 1299,
    images: [denim, hero],
    availableSizes: ["28", "30", "32", "34", "36"],
    availableColors: ["Mid Blue"],
    tags: ["jeans", "denim", "blue", "everyday", "college"],
    collectionIds: ["everyday-uniform", "college-core", "clean-fit", "weekend-plans"],
    isFeatured: true,
    material: "Sample info: rigid cotton denim",
    fit: "Straight, high rise",
    lastUpdatedAt: "2026-10-22T12:00:00Z",
  },
  {
    ...base,
    id: "p04",
    slug: "minimal-everyday-sneakers",
    name: "Minimal Everyday Sneakers",
    description:
      "Clean white low-tops with a tonal sole. Made for long campus days and short weekend plans. Sample description for demo purposes.",
    category: "Footwear",
    subcategory: "Sneakers",
    gender: "unisex",
    retailer: "Sole Street",
    brand: "Sole Street",
    price: 1799,
    originalPrice: 2299,
    images: [sneakers, street],
    availableSizes: ["UK 5", "UK 6", "UK 7", "UK 8", "UK 9", "UK 10"],
    availableColors: ["White"],
    tags: ["sneakers", "white", "shoes", "everyday", "clean"],
    collectionIds: ["sneaker-edit", "clean-fit", "everyday-uniform", "travel-fits", "viral-finds"],
    affiliateUrl: "https://example.com/retailer/minimal-everyday-sneakers?ref=offscript-demo",
    isFeatured: true,
    isEditorsPick: true,
    lastUpdatedAt: "2026-10-26T08:00:00Z",
  },
  {
    ...base,
    id: "p05",
    slug: "textured-knit-top",
    name: "Textured Knit Top",
    description:
      "A short-sleeve knit in deep wine with a diamond texture and a soft scoop neck. Sample description for demo purposes.",
    category: "Tops",
    subcategory: "Knitwear",
    gender: "women",
    retailer: "Kora Studio",
    brand: "Kora Studio",
    price: 799,
    images: [knit, her],
    availableSizes: ["XS", "S", "M", "L"],
    availableColors: ["Wine"],
    tags: ["knit", "top", "burgundy", "date night", "coffee date"],
    collectionIds: ["her-rotation", "coffee-date", "date-night", "going-out"],
    purchaseMode: "authorized_cod",
    codEnabled: true,
    shippingCharge: 49,
    isFeatured: true,
    isNew: true,
    material: "Sample info: acrylic-cotton blend knit",
    fit: "Regular, slightly cropped",
    lastUpdatedAt: "2026-10-26T11:00:00Z",
  },
  {
    ...base,
    id: "p06",
    slug: "everyday-shoulder-bag",
    name: "Everyday Shoulder Bag",
    description:
      "A slouchy tan shoulder bag that fits a laptop sleeve, a water bottle and the rest of your day. Sample description for demo purposes.",
    category: "Accessories",
    subcategory: "Bags",
    gender: "women",
    retailer: "Kora Studio",
    brand: "Kora Studio",
    price: 999,
    images: [bag, acc],
    availableSizes: [],
    availableColors: ["Tan"],
    tags: ["bag", "accessories", "tan", "college", "travel"],
    collectionIds: ["accessories", "college-core", "travel-fits", "coffee-date"],
    isFeatured: true,
    lastUpdatedAt: "2026-10-20T15:00:00Z",
  },
  {
    ...base,
    id: "p07",
    slug: "olive-utility-cargos",
    name: "Olive Utility Cargos",
    description:
      "Relaxed cargo trousers in washed olive twill with deep side pockets. Sample description for demo purposes.",
    category: "Bottoms",
    subcategory: "Trousers",
    gender: "men",
    retailer: "Northlane",
    brand: "Northlane",
    price: 1499,
    images: [cargo, street],
    availableSizes: ["28", "30", "32", "34", "36"],
    availableColors: ["Olive"],
    tags: ["cargo", "trousers", "olive", "streetwear", "travel"],
    collectionIds: ["streetwear", "his-rotation", "travel-fits", "weekend-plans", "viral-finds"],
    affiliateUrl: "https://example.com/retailer/olive-utility-cargos?ref=offscript-demo",
    isNew: true,
    isFeatured: true,
    lastUpdatedAt: "2026-10-27T07:00:00Z",
  },
  {
    ...base,
    id: "p08",
    slug: "black-slip-midi-dress",
    name: "Black Slip Midi Dress",
    description:
      "A bias-cut midi with thin straps. Add a knit for dinner, a tee underneath for daytime. Sample description for demo purposes.",
    category: "Dresses",
    subcategory: "Midi",
    gender: "women",
    retailer: "Kora Studio",
    brand: "Kora Studio",
    price: 1899,
    images: [dress, her],
    availableSizes: ["XS", "S", "M", "L"],
    availableColors: ["Black"],
    tags: ["dress", "black", "date night", "going out", "monochrome"],
    collectionIds: ["her-rotation", "date-night", "going-out", "monochrome"],
    affiliateUrl: "https://example.com/retailer/black-slip-midi-dress?ref=offscript-demo",
    isEditorsPick: true,
    isFeatured: true,
    lastUpdatedAt: "2026-10-23T18:00:00Z",
  },
  {
    ...base,
    id: "p09",
    slug: "bone-heavyweight-tee",
    name: "Bone Heavyweight Tee",
    description:
      "The off-white version of the tee everyone keeps asking about. Thick, boxy and easy to layer. Sample description for demo purposes.",
    category: "Tops",
    subcategory: "T-Shirts",
    gender: "unisex",
    retailer: "Northlane",
    brand: "Northlane",
    price: 649,
    images: [creamTee, street],
    availableSizes: APPAREL,
    availableColors: ["Bone"],
    tags: ["oversized", "tee", "white", "cream", "streetwear", "clean"],
    collectionIds: ["oversized-tees", "streetwear", "clean-fit", "everyday-uniform", "his-rotation"],
    affiliateUrl: "https://example.com/retailer/bone-heavyweight-tee?ref=offscript-demo",
    isNew: true,
    lastUpdatedAt: "2026-10-27T06:00:00Z",
  },
  {
    ...base,
    id: "p10",
    slug: "olive-overshirt",
    name: "Olive Overshirt",
    description:
      "A brushed-cotton overshirt with a chest pocket — the layer for evenings that turn cool. Sample description for demo purposes.",
    category: "Shirts",
    subcategory: "Overshirts",
    gender: "men",
    retailer: "Thread & Co.",
    brand: "Thread & Co.",
    price: 1599,
    images: [his, cargo],
    availableSizes: ["S", "M", "L", "XL"],
    availableColors: ["Olive"],
    tags: ["overshirt", "shirt", "olive", "college", "layering"],
    collectionIds: ["his-rotation", "college-core", "weekend-plans"],
    purchaseMode: "authorized_cod",
    codEnabled: true,
    shippingCharge: 0,
    isEditorsPick: true,
    lastUpdatedAt: "2026-10-21T10:00:00Z",
  },
  {
    ...base,
    id: "p11",
    slug: "white-linen-shirt",
    name: "White Linen Shirt",
    description:
      "Breathable linen with rolled sleeves and a soft collar, made for Indian summers. Sample description for demo purposes.",
    category: "Shirts",
    subcategory: "Casual Shirts",
    gender: "women",
    retailer: "Thread & Co.",
    brand: "Thread & Co.",
    price: 1199,
    images: [everyday, shirt],
    availableSizes: ["XS", "S", "M", "L", "XL"],
    availableColors: ["White"],
    tags: ["linen", "shirt", "white", "clean", "travel", "everyday"],
    collectionIds: ["her-rotation", "clean-fit", "travel-fits", "everyday-uniform"],
    affiliateUrl: null,
    lastUpdatedAt: "2026-10-19T10:00:00Z",
  },
  {
    ...base,
    id: "p12",
    slug: "silver-ring-set",
    name: "Silver Ring Set",
    description: "Two chunky polished rings for stacking. Small detail, big difference. Sample description for demo purposes.",
    category: "Accessories",
    subcategory: "Jewellery",
    gender: "unisex",
    retailer: "Sole Street",
    brand: "Hallmark Lane",
    price: 449,
    images: [acc, bag],
    availableSizes: [],
    availableColors: ["Silver"],
    tags: ["rings", "jewellery", "silver", "accessories", "going out"],
    collectionIds: ["accessories", "going-out", "date-night"],
    affiliateUrl: "https://example.com/retailer/silver-ring-set?ref=offscript-demo",
    lastUpdatedAt: "2026-10-18T10:00:00Z",
  },
  {
    ...base,
    id: "p13",
    slug: "tortoise-square-sunglasses",
    name: "Tortoise Square Sunglasses",
    description: "Squared tortoiseshell frames with dark lenses. Sample description for demo purposes.",
    category: "Accessories",
    subcategory: "Eyewear",
    gender: "unisex",
    retailer: "Sole Street",
    brand: "Hallmark Lane",
    price: 399,
    images: [acc, creamTee],
    availableSizes: [],
    availableColors: ["Tortoise"],
    tags: ["sunglasses", "accessories", "travel", "brown"],
    collectionIds: ["accessories", "travel-fits", "weekend-plans", "viral-finds"],
    affiliateUrl: "https://example.com/retailer/tortoise-sunglasses?ref=offscript-demo",
    inStock: false,
    lastUpdatedAt: "2026-10-15T10:00:00Z",
  },
  {
    ...base,
    id: "p14",
    slug: "wine-mock-neck-knit",
    name: "Wine Mock-Neck Knit",
    description: "A long-sleeve mock neck in deep wine with a cable texture. Sample description for demo purposes.",
    category: "Tops",
    subcategory: "Knitwear",
    gender: "women",
    retailer: "Kora Studio",
    brand: "Kora Studio",
    price: 1349,
    images: [her, knit],
    availableSizes: ["XS", "S", "M", "L"],
    availableColors: ["Wine"],
    tags: ["knit", "top", "burgundy", "date night", "going out"],
    collectionIds: ["her-rotation", "date-night", "going-out", "coffee-date"],
    affiliateUrl: "https://example.com/retailer/wine-mock-neck-knit?ref=offscript-demo",
    isNew: true,
    lastUpdatedAt: "2026-10-27T05:00:00Z",
  },
];

const API_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? "https://offscript-p9rk.onrender.com"
    : "http://localhost:5000");

// In-memory list of live products loaded from the database
let liveProducts: Product[] = [];

// Subscribers for product updates
type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribeProducts(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {}
  });
}

export function setLiveProducts(newProducts: Product[]) {
  liveProducts = newProducts;
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem("offscript_live_products", JSON.stringify(newProducts));
    }
  } catch {}
  notifyListeners();
}

// Restore cached products on load
if (typeof window !== "undefined") {
  try {
    const cached = localStorage.getItem("offscript_live_products");
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        liveProducts = parsed;
      }
    }
  } catch {}
}

export function getAllProducts(): Product[] {
  const map = new Map<string, Product>();
  // 1. Seed products first
  for (const p of products) {
    map.set(p.slug.toLowerCase(), p);
  }
  // 2. Live database products (these override seed products or add newly created ones)
  for (const p of liveProducts) {
    map.set(p.slug.toLowerCase(), p);
  }
  return Array.from(map.values());
}

export const getProduct = (slug: string) => {
  const normalized = (slug || "").toLowerCase().trim();
  const all = getAllProducts();
  return all.find((p) => p.slug.toLowerCase() === normalized);
};

export async function fetchLiveProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_URL}/api/products?limit=100`);
    if (!res.ok) return liveProducts;
    const data = await res.json();
    const items: any[] = data.items || data;
    if (Array.isArray(items) && items.length > 0) {
      const formatted: Product[] = items.map((item) => ({
        id: item._id || item.id || item.slug,
        slug: item.slug,
        name: item.name,
        description: item.description,
        category: item.category,
        subcategory: item.subcategory || item.category,
        gender: item.gender || "unisex",
        retailer: item.retailer || "OFFSCRIPT",
        brand: item.brand || "OFFSCRIPT",
        price: item.price,
        originalPrice: item.originalPrice,
        currency: "INR",
        images: Array.isArray(item.images) && item.images.length > 0 ? item.images : [tee],
        availableSizes: item.availableSizes || ["S", "M", "L"],
        availableColors: item.availableColors || ["Black"],
        tags: item.tags || [],
        collectionIds: item.collectionIds || ["discover", "streetwear"],
        affiliateUrl: item.affiliateUrl || null,
        purchaseMode: item.purchaseMode || (item.codEnabled ? "authorized_cod" : "affiliate"),
        codEnabled: Boolean(item.codEnabled),
        shippingCharge: item.shippingCharge || 0,
        inStock: item.inStock !== false,
        isFeatured: Boolean(item.isFeatured),
        isNew: Boolean(item.isNew),
        isEditorsPick: Boolean(item.isEditorsPick),
        material: item.material,
        fit: item.fit,
        lastUpdatedAt: item.lastUpdatedAt || new Date().toISOString(),
      }));
      setLiveProducts(formatted);
      return formatted;
    }
  } catch (err) {
    console.warn("Failed to fetch live products from API:", err);
  }
  return liveProducts;
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const existing = getProduct(slug);
  if (existing) return existing;

  try {
    const res = await fetch(`${API_URL}/api/products/${slug}`);
    if (!res.ok) return null;
    const item = await res.json();
    if (item && item.slug) {
      const formatted: Product = {
        id: item._id || item.id || item.slug,
        slug: item.slug,
        name: item.name,
        description: item.description,
        category: item.category,
        subcategory: item.subcategory || item.category,
        gender: item.gender || "unisex",
        retailer: item.retailer || "OFFSCRIPT",
        brand: item.brand || "OFFSCRIPT",
        price: item.price,
        originalPrice: item.originalPrice,
        currency: "INR",
        images: Array.isArray(item.images) && item.images.length > 0 ? item.images : [tee],
        availableSizes: item.availableSizes || ["S", "M", "L"],
        availableColors: item.availableColors || ["Black"],
        tags: item.tags || [],
        collectionIds: item.collectionIds || ["discover", "streetwear"],
        affiliateUrl: item.affiliateUrl || null,
        purchaseMode: item.purchaseMode || (item.codEnabled ? "authorized_cod" : "affiliate"),
        codEnabled: Boolean(item.codEnabled),
        shippingCharge: item.shippingCharge || 0,
        inStock: item.inStock !== false,
        isFeatured: Boolean(item.isFeatured),
        isNew: Boolean(item.isNew),
        isEditorsPick: Boolean(item.isEditorsPick),
        material: item.material,
        fit: item.fit,
        lastUpdatedAt: item.lastUpdatedAt || new Date().toISOString(),
      };
      setLiveProducts([...liveProducts, formatted]);
      return formatted;
    }
  } catch (err) {
    console.warn(`Failed to fetch product /${slug}:`, err);
  }
  return null;
}

export const retailers = Array.from(new Set(products.map((p) => p.retailer))).sort();
export const colors = Array.from(new Set(products.flatMap((p) => p.availableColors))).sort();
export const sizes = Array.from(new Set(products.flatMap((p) => p.availableSizes)));
export const categories = Array.from(new Set(products.map((p) => p.category)));
