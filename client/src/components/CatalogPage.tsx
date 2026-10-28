import { Link } from "@tanstack/react-router";
import { SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { getCollection, productsIn } from "@/data/collections";
import type { Product } from "@/data/products";
import { Breadcrumbs, EmptyState } from "./Editorial";
import { ProductGrid } from "./ProductCard";
import { cn } from "@/lib/utils";

export type SortKey = "recommended" | "newest" | "price-asc" | "price-desc";
const PRICE_BUCKETS = [
  { id: "u500", label: "Under ₹500", test: (n: number) => n < 500 },
  { id: "500-999", label: "₹500 – ₹999", test: (n: number) => n >= 500 && n < 1000 },
  { id: "1000-1499", label: "₹1,000 – ₹1,499", test: (n: number) => n >= 1000 && n < 1500 },
  { id: "1500+", label: "₹1,500 and above", test: (n: number) => n >= 1500 },
];

interface Filters {
  category: string[];
  price: string[];
  retailer: string[];
  size: string[];
  color: string[];
  inStock: boolean;
}
const EMPTY: Filters = { category: [], price: [], retailer: [], size: [], color: [], inStock: false };

export function applyFilters(list: Product[], f: Filters, sort: SortKey) {
  const out = list.filter(
    (p) =>
      (!f.category.length || f.category.includes(p.category)) &&
      (!f.price.length || PRICE_BUCKETS.some((b) => f.price.includes(b.id) && b.test(p.price))) &&
      (!f.retailer.length || f.retailer.includes(p.retailer)) &&
      (!f.size.length || p.availableSizes.some((s) => f.size.includes(s))) &&
      (!f.color.length || p.availableColors.some((c) => f.color.includes(c))) &&
      (!f.inStock || p.inStock),
  );
  const score = (p: Product) => (p.isEditorsPick ? 2 : 0) + (p.isFeatured ? 1 : 0);
  return [...out].sort((a, b) => {
    if (sort === "newest") return b.lastUpdatedAt.localeCompare(a.lastUpdatedAt);
    if (sort === "price-asc") return a.price - b.price;
    if (sort === "price-desc") return b.price - a.price;
    return score(b) - score(a);
  });
}

export function CatalogPage({ slug, hero }: { slug: string; hero?: React.ReactNode }) {
  const c = getCollection(slug)!;
  const base = useMemo(() => productsIn(slug), [slug]);
  const [f, setF] = useState<Filters>(EMPTY);
  const [sort, setSort] = useState<SortKey>("recommended");
  const [drawer, setDrawer] = useState(false);
  const list = useMemo(() => applyFilters(base, f, sort), [base, f, sort]);

  const opts = useMemo(
    () => ({
      category: [...new Set(base.map((p) => p.category))],
      retailer: [...new Set(base.map((p) => p.retailer))].sort(),
      size: [...new Set(base.flatMap((p) => p.availableSizes))],
      color: [...new Set(base.flatMap((p) => p.availableColors))].sort(),
    }),
    [base],
  );

  const toggle = (k: Exclude<keyof Filters, "inStock">, v: string) =>
    setF((cur) => ({ ...cur, [k]: cur[k].includes(v) ? cur[k].filter((x) => x !== v) : [...cur[k], v] }));

  const chips = [
    ...(["category", "retailer", "size", "color"] as const).flatMap((k) => f[k].map((v) => ({ k, v, label: v }))),
    ...f.price.map((v) => ({ k: "price" as const, v, label: PRICE_BUCKETS.find((b) => b.id === v)!.label })),
  ];

  const panel = (
    <div className="space-y-8">
      {opts.category.length > 1 && <FilterGroup title="Category" options={opts.category} selected={f.category} onToggle={(v) => toggle("category", v)} />}
      <FilterGroup title="Price" options={PRICE_BUCKETS.map((b) => b.id)} labels={Object.fromEntries(PRICE_BUCKETS.map((b) => [b.id, b.label]))} selected={f.price} onToggle={(v) => toggle("price", v)} />
      {opts.retailer.length > 1 && <FilterGroup title="Retailer" options={opts.retailer} selected={f.retailer} onToggle={(v) => toggle("retailer", v)} />}
      {opts.size.length > 0 && <FilterGroup title="Size" options={opts.size} selected={f.size} onToggle={(v) => toggle("size", v)} pills />}
      {opts.color.length > 1 && <FilterGroup title="Colour" options={opts.color} selected={f.color} onToggle={(v) => toggle("color", v)} />}
      <fieldset>
        <legend className="eyebrow mb-3">Availability</legend>
        <label className="flex cursor-pointer items-center gap-3 text-sm">
          <input type="checkbox" checked={f.inStock} onChange={(e) => setF({ ...f, inStock: e.target.checked })} className="h-4 w-4 accent-[var(--color-accent)]" />
          In stock only
        </label>
      </fieldset>
    </div>
  );

  return (
    <div>
      {hero ?? (
        <section className="mx-auto max-w-[1600px] px-5 pt-8 md:px-10">
          <Breadcrumbs items={[{ label: c.title }]} />
          <div className="mt-6 grid items-end gap-6 md:grid-cols-[1fr_1.2fr]">
            <div className="pb-2">
              <p className="eyebrow text-accent">{c.eyebrow}</p>
              <h1 className="display-xl mt-3 uppercase">{c.title}</h1>
              <p className="mt-4 max-w-md text-muted-foreground">{c.description}</p>
            </div>
            <div className="grain relative aspect-[16/9] overflow-hidden bg-secondary md:aspect-[21/9]">
              <img src={c.image} alt="" className="h-full w-full object-cover" />
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-[1600px] px-5 pt-10 md:px-10">
        <div className="sticky top-14 z-20 -mx-5 flex items-center justify-between gap-4 border-y bg-background px-5 py-3 md:top-16 md:-mx-10 md:px-10">
          <p className="eyebrow" aria-live="polite">
            {list.length} {list.length === 1 ? "piece" : "pieces"}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setDrawer(true)} className="eyebrow inline-flex h-10 items-center gap-2 border px-3 lg:hidden">
              <SlidersHorizontal className="h-4 w-4" /> Filter{chips.length ? ` (${chips.length})` : ""}
            </button>
            <label htmlFor="sort" className="sr-only">Sort by</label>
            <select id="sort" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="eyebrow h-10 border bg-background px-3">
              <option value="recommended">Recommended</option>
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {chips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 py-4">
            {chips.map((ch) => (
              <button key={ch.k + ch.v} onClick={() => toggle(ch.k, ch.v)} className="inline-flex items-center gap-1.5 bg-secondary px-3 py-1.5 text-xs font-medium hover:bg-border" aria-label={`Remove filter ${ch.label}`}>
                {ch.label} <X className="h-3 w-3" />
              </button>
            ))}
            {f.inStock && (
              <button onClick={() => setF({ ...f, inStock: false })} className="inline-flex items-center gap-1.5 bg-secondary px-3 py-1.5 text-xs font-medium">
                In stock <X className="h-3 w-3" />
              </button>
            )}
            <button onClick={() => setF(EMPTY)} className="eyebrow link-underline ml-2">Clear all</button>
          </div>
        )}

        <div className="grid gap-10 pt-6 lg:grid-cols-[220px_1fr]">
          <aside className="hidden lg:block" aria-label="Filters">{panel}</aside>
          {list.length ? (
            <ProductGrid products={list} />
          ) : (
            <EmptyState
              title={["Nothing here", "— yet."]}
              body="No pieces match these filters. Loosen one or two and try again."
              action={<button onClick={() => setF(EMPTY)} className="btn-ink">Clear filters</button>}
            />
          )}
        </div>
      </section>

      <Sheet open={drawer} onOpenChange={setDrawer}>
        <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto bg-background px-5 pb-28 pt-6">
          <SheetTitle className="eyebrow mb-6">Filter</SheetTitle>
          <SheetDescription className="sr-only">Narrow the product list</SheetDescription>
          {panel}
          <div className="fixed inset-x-0 bottom-0 flex gap-3 border-t bg-background p-4">
            <button onClick={() => setF(EMPTY)} className="btn-outline flex-1">Clear</button>
            <button onClick={() => setDrawer(false)} className="btn-ink flex-1">Show {list.length}</button>
          </div>
        </SheetContent>
      </Sheet>

      <div className="mx-auto max-w-[1600px] px-5 pt-16 md:px-10">
        <Link to="/collections/$slug" params={{ slug: "discover" }} className="eyebrow link-underline">← Back to discovery</Link>
      </div>
    </div>
  );
}

function FilterGroup({ title, options, selected, onToggle, labels, pills }: { title: string; options: string[]; selected: string[]; onToggle: (v: string) => void; labels?: Record<string, string>; pills?: boolean }) {
  return (
    <fieldset>
      <legend className="eyebrow mb-3">{title}</legend>
      <div className={cn(pills ? "flex flex-wrap gap-2" : "space-y-2")}>
        {options.map((o) =>
          pills ? (
            <button key={o} type="button" aria-pressed={selected.includes(o)} onClick={() => onToggle(o)} className={cn("min-w-11 border px-2 py-2 text-xs", selected.includes(o) ? "border-foreground bg-foreground text-background" : "hover:border-foreground")}>
              {o}
            </button>
          ) : (
            <label key={o} className="flex cursor-pointer items-center gap-3 text-sm">
              <input type="checkbox" checked={selected.includes(o)} onChange={() => onToggle(o)} className="h-4 w-4 accent-[var(--color-accent)]" />
              {labels?.[o] ?? o}
            </label>
          ),
        )}
      </div>
    </fieldset>
  );
}
