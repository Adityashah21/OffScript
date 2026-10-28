import hero from "@/assets/hero.jpg";
import campaign from "@/assets/campaign.jpg";
import street from "@/assets/cat-streetwear.jpg";
import everyday from "@/assets/cat-everyday.jpg";
import her from "@/assets/cat-her.jpg";
import his from "@/assets/cat-his.jpg";
import acc from "@/assets/cat-accessories.jpg";
import tee from "@/assets/p-tee.jpg";
import creamTee from "@/assets/p-cream-tee.jpg";
import sneakers from "@/assets/p-sneakers.jpg";
import cargo from "@/assets/p-cargo.jpg";
import bag from "@/assets/p-bag.jpg";
import { products, type Product } from "./products";

export interface Collection {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  image: string;
  match: (p: Product) => boolean;
}

const inCol = (id: string) => (p: Product) => p.collectionIds.includes(id);

export const collections: Collection[] = [
  { slug: "discover", title: "Discover", eyebrow: "The full edit", description: "Every piece we've found so far. Filter it down to your taste and budget.", image: campaign, match: () => true },
  { slug: "new-arrivals", title: "New Arrivals", eyebrow: "Just in", description: "The latest finds, added this week.", image: hero, match: (p) => p.isNew },
  { slug: "women", title: "Women", eyebrow: "Her rotation", description: "Knits, slips and shirts that work harder than they look.", image: her, match: (p) => p.gender === "women" || p.gender === "unisex" },
  { slug: "men", title: "Men", eyebrow: "His rotation", description: "Overshirts, cargos and the tees that go with both.", image: his, match: (p) => p.gender === "men" || p.gender === "unisex" },
  { slug: "streetwear", title: "Streetwear", eyebrow: "Category", description: "Relaxed silhouettes, everyday layers, and pieces that do the talking.", image: street, match: inCol("streetwear") },
  { slug: "accessories", title: "Accessories", eyebrow: "Category", description: "Bags, rings and frames — the small things that finish the fit.", image: acc, match: (p) => p.category === "Accessories" },
  { slug: "everyday-uniform", title: "Everyday Uniform", eyebrow: "Collection", description: "Pieces you'll reach for five days a week.", image: everyday, match: inCol("everyday-uniform") },
  { slug: "her-rotation", title: "Her Rotation", eyebrow: "Collection", description: "On repeat in her wardrobe this season.", image: her, match: inCol("her-rotation") },
  { slug: "his-rotation", title: "His Rotation", eyebrow: "Collection", description: "On repeat in his wardrobe this season.", image: his, match: inCol("his-rotation") },
  { slug: "under-499", title: "Under ₹499", eyebrow: "The price edit", description: "Small budget. Strong outfit.", image: acc, match: (p) => p.price < 500 },
  { slug: "under-999", title: "Under ₹999", eyebrow: "The price edit", description: "Everyday pieces that do more.", image: tee, match: (p) => p.price < 1000 },
  { slug: "under-1999", title: "Under ₹1,999", eyebrow: "The price edit", description: "Your next wardrobe upgrade starts here.", image: sneakers, match: (p) => p.price < 2000 },
  { slug: "oversized-tees", title: "The Oversized Tee Rotation", eyebrow: "Seen on your feed", description: "Boxy, heavy and drop-shouldered.", image: creamTee, match: inCol("oversized-tees") },
  { slug: "coffee-date", title: "Coffee-Date Fits", eyebrow: "Seen on your feed", description: "Put together without trying too hard.", image: her, match: inCol("coffee-date") },
  { slug: "clean-fit", title: "The Clean-Fit Edit", eyebrow: "Seen on your feed", description: "Whites, blues and nothing loud.", image: everyday, match: inCol("clean-fit") },
  { slug: "college-core", title: "College-Core Essentials", eyebrow: "Seen on your feed", description: "From 9am lectures to canteen breaks.", image: his, match: inCol("college-core") },
  { slug: "monochrome", title: "Monochrome Everything", eyebrow: "Seen on your feed", description: "Black on black, done right.", image: tee, match: inCol("monochrome") },
  { slug: "sneaker-edit", title: "The Everyday Sneaker Edit", eyebrow: "Seen on your feed", description: "One pair, every outfit.", image: sneakers, match: inCol("sneaker-edit") },
  { slug: "weekend-plans", title: "Weekend Plans", eyebrow: "By occasion", description: "Brunch, flea markets and long drives.", image: street, match: inCol("weekend-plans") },
  { slug: "date-night", title: "Date Night", eyebrow: "By occasion", description: "Dinner reservations, dark colours.", image: her, match: inCol("date-night") },
  { slug: "travel-fits", title: "Travel Fits", eyebrow: "By occasion", description: "Comfortable enough for the train, sharp enough for arrival.", image: cargo, match: inCol("travel-fits") },
  { slug: "going-out", title: "Going Out", eyebrow: "By occasion", description: "For nights that start late.", image: bag, match: inCol("going-out") },
  { slug: "off-duty", title: "Off-Duty", eyebrow: "Mood", description: "Easy layers for days with no plans.", image: street, match: (p) => ["weekend-plans", "travel-fits"].some((c) => p.collectionIds.includes(c)) },
  { slug: "main-character", title: "Main Character", eyebrow: "Mood", description: "Dark colours, sharp lines, a little drama.", image: her, match: (p) => ["date-night", "going-out", "monochrome"].some((c) => p.collectionIds.includes(c)) },
  { slug: "soft-hours", title: "Soft Hours", eyebrow: "Mood", description: "Knits, linen and quiet colours.", image: everyday, match: (p) => p.tags.some((t) => ["knit", "linen", "coffee date"].includes(t)) },
  { slug: "featured", title: "Featured Finds", eyebrow: "Campaign", description: "The pieces we'd buy first.", image: hero, match: (p) => p.isFeatured || p.isEditorsPick },
  { slug: "viral-finds", title: "Viral Finds", eyebrow: "Seen on your feed", description: "Pieces our feed kept showing us.", image: street, match: inCol("viral-finds") },
];

export const getCollection = (slug: string) => collections.find((c) => c.slug === slug);
export const productsIn = (slug: string) => {
  const c = getCollection(slug);
  return c ? products.filter(c.match) : [];
};

export const trendSlugs = ["oversized-tees", "coffee-date", "clean-fit", "college-core", "monochrome", "sneaker-edit"];
export const occasionSlugs = [
  { slug: "college-core", label: "College Days" },
  { slug: "weekend-plans", label: "Weekend Plans" },
  { slug: "date-night", label: "Date Night" },
  { slug: "everyday-uniform", label: "Everyday Essentials" },
  { slug: "travel-fits", label: "Travel Fits" },
  { slug: "going-out", label: "Going Out" },
];

/** Social campaign landing pages at /edit/$slug */
export interface CampaignEdit {
  slug: string;
  headline: string[];
  intro: string;
  image: string;
  collection: string;
  related: string[];
}

export const edits: CampaignEdit[] = [
  { slug: "oversized-tees", headline: ["5 oversized tees", "that actually", "look good."], intro: "Boxy cuts, heavy cotton, and shoulders that drop just enough. Picked for how they hang, not how they photograph.", image: creamTee, collection: "oversized-tees", related: ["streetwear", "monochrome", "under-999"] },
  { slug: "college-fits", headline: ["College fits", "for every", "timetable."], intro: "Easy layers and a bag that holds everything — built for long days on campus.", image: his, collection: "college-core", related: ["everyday-uniform", "sneaker-edit", "under-999"] },
  { slug: "under-999", headline: ["Under ₹999.", "Still worth", "a second look."], intro: "Proof that good taste doesn't need a big budget.", image: tee, collection: "under-999", related: ["under-499", "under-1999", "oversized-tees"] },
  { slug: "viral-finds", headline: ["The internet", "found these.", "We checked."], intro: "Pieces that kept appearing on our feed — filtered for the ones worth your money.", image: street, collection: "viral-finds", related: ["oversized-tees", "clean-fit", "coffee-date"] },
];
edits.push({ slug: "next-favourite-fit", headline: ["Your next", "favourite fit", "is closer", "than you think."], intro: "Our editors' first picks this season — the pieces that made the rest of the edit look good.", image: campaign, collection: "featured", related: ["clean-fit", "main-character", "under-999"] });

export const moods = [
  { slug: "off-duty", label: "Off-Duty", note: "No plans, good fit" },
  { slug: "streetwear", label: "Street Mode", note: "Boxy, heavy, loud-quiet" },
  { slug: "clean-fit", label: "Clean Fit", note: "Whites, blues, nothing extra" },
  { slug: "main-character", label: "Main Character", note: "Dark, sharp, a little drama" },
  { slug: "soft-hours", label: "Soft Hours", note: "Knits and linen" },
  { slug: "under-999", label: "Under Budget", note: "Everything under ₹999" },
];

export const getEdit = (slug: string) => edits.find((e) => e.slug === slug);
