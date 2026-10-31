import { Product } from "../models/Product.js";
import { Collection } from "../models/Collection.js";
const norm = (s) => s.toLowerCase().replace(/[₹,]/g, "").trim();
export async function searchAll(q) {
    const query = norm(q);
    if (!query)
        return { products: [], collections: [] };
    const budget = query.match(/(?:under|below|less than)\s*(\d+)/);
    const max = budget ? Number(budget[1]) : null;
    const words = query
        .replace(/(?:under|below|less than)\s*\d+/, "")
        .split(/\s+/)
        .filter((w) => w.length > 1 && !["the", "and", "for", "fits", "outfits", "outfit"].includes(w));
    const [products, collections] = await Promise.all([
        Product.find(),
        Collection.find(),
    ]);
    const hay = (p) => norm([
        p.name,
        p.category,
        p.subcategory,
        p.retailer,
        p.brand,
        ...p.availableColors,
        ...p.tags,
        ...p.collectionIds.join(" ").split("-"),
    ].join(" "));
    const prods = products.filter((p) => {
        if (max !== null && p.price > max)
            return false;
        if (!words.length)
            return max !== null;
        const h = hay(p);
        return words.every((w) => h.includes(w.replace(/s$/, "")));
    });
    const cols = collections.filter((c) => {
        const h = norm(c.title + " " + c.slug.replace(/-/g, " ") + " " + c.description);
        return words.length ? words.some((w) => h.includes(w.replace(/s$/, ""))) : false;
    });
    return {
        products: prods.map((p) => p.toJSON()),
        collections: cols.slice(0, 4).map((c) => c.toJSON()),
    };
}
