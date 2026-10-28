import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { getProduct, products } from "@/data/products";
import { Breadcrumbs } from "@/components/Editorial";
import { PriceBadge, ProductCard } from "@/components/ProductCard";
import { PurchaseActions } from "@/components/PurchaseActions";
import { WishlistButton } from "@/components/WishlistButton";
import { formatDate } from "@/lib/format";
import { isCodEligible } from "@/lib/order";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/product/$slug")({
  loader: ({ params }) => {
    const p = getProduct(params.slug);
    if (!p) throw notFound();
    return { name: p.name, description: p.description };
  },
  head: ({ loaderData }) =>
    loaderData ? seo(loaderData.name, loaderData.description) : { meta: [{ title: "Piece not found — OFFSCRIPT" }, { name: "robots", content: "noindex" }] },
  component: ProductPage,
});

function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  return (
    <div>
      {/* Mobile: swipe */}
      <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory overflow-x-auto md:hidden" aria-label="Product images">
        {images.map((src, i) => (
          <img key={i} src={src} alt={`${name}, image ${i + 1}`} className="aspect-[4/5] w-full shrink-0 snap-center object-cover" />
        ))}
      </div>
      {images.length > 1 && <p className="eyebrow mt-2 text-center text-muted-foreground md:hidden">Swipe · {images.length} images</p>}
      {/* Desktop */}
      <div className="hidden gap-4 md:grid md:grid-cols-[80px_1fr]">
        <div className="flex flex-col gap-3">
          {images.map((src, i) => (
            <button key={i} onClick={() => setActive(i)} aria-label={`Show image ${i + 1}`} aria-pressed={active === i} className={cn("aspect-[4/5] overflow-hidden border-2", active === i ? "border-foreground" : "border-transparent")}>
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
        <div className="aspect-[4/5] overflow-hidden bg-secondary">
          <img key={active} src={images[active]} alt={name} className="reveal h-full w-full object-cover" />
        </div>
      </div>
    </div>
  );
}

function ProductPage() {
  const { slug } = Route.useParams();
  const p = getProduct(slug)!;
  const [size, setSize] = useState("");
  const [color, setColor] = useState(p.availableColors[0] ?? "");

  const similar = products.filter((x) => x.id !== p.id && x.category === p.category).slice(0, 4);
  const collection = products.filter((x) => x.id !== p.id && !similar.includes(x) && x.collectionIds.some((c) => p.collectionIds.includes(c))).slice(0, 4);
  const budget = products.filter((x) => x.id !== p.id && Math.abs(x.price - p.price) <= 400).slice(0, 4);

  return (
    <div key={slug} className="mx-auto max-w-[1600px] px-5 pt-6 md:px-10">
      <Breadcrumbs items={[{ label: p.category, to: "/discover" }, { label: p.name }]} />
      <div className="mt-6 grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
        <ProductGallery images={p.images} name={p.name} />
        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="eyebrow text-muted-foreground">{p.brand} · via {p.retailer}</p>
          <h1 className="display-md mt-3">{p.name}</h1>
          <PriceBadge price={p.price} originalPrice={p.originalPrice} className="mt-4 text-xl" />
          <p className="mt-1 text-xs text-muted-foreground">Price last checked {formatDate(p.lastUpdatedAt)} · Illustrative demo product</p>

          {p.availableColors.length > 0 && (
            <fieldset className="mt-8">
              <legend className="eyebrow mb-3">Colour — <span className="text-muted-foreground">{color}</span></legend>
              <div className="flex flex-wrap gap-2">
                {p.availableColors.map((c) => (
                  <button key={c} type="button" aria-pressed={color === c} onClick={() => setColor(c)} className={cn("border px-3 py-2 text-sm", color === c ? "border-foreground" : "")}>{c}</button>
                ))}
              </div>
            </fieldset>
          )}

          {p.availableSizes.length > 0 && (
            <fieldset className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <legend className="eyebrow">Size</legend>
                <Link to="/legal/$slug" params={{ slug: "size-guide" }} className="eyebrow link-underline text-muted-foreground">Size guide</Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {p.availableSizes.map((s) => (
                  <button key={s} type="button" aria-pressed={size === s} onClick={() => setSize(s)} className={cn("h-11 min-w-12 border px-3 text-sm transition-colors", size === s ? "border-foreground bg-foreground text-background" : "hover:border-foreground")}>{s}</button>
                ))}
              </div>
              {isCodEligible(p) && <p className="mt-2 text-xs text-muted-foreground">Pick a size now or on the order form.</p>}
            </fieldset>
          )}

          <div className="mt-8 space-y-3">
            <PurchaseActions product={p} size={size} />
            <WishlistButton slug={p.slug} name={p.name} withLabel />
          </div>

          <div className="mt-10 divide-y border-y text-sm">
            <Detail title="About this piece">{p.description}</Detail>
            {p.fit && <Detail title="Fit">{p.fit}</Detail>}
            {p.material && <Detail title="Material">{p.material}</Detail>}
            <Detail title={isCodEligible(p) ? "How this order works" : "Where you'll buy"}>
              {isCodEligible(p)
                ? `OFFSCRIPT has a fulfilment arrangement for this piece. Shipping: ${p.shippingCharge ? `₹${p.shippingCharge}` : "free"}. In this demo, requests aren't sent to a supplier.`
                : `Sold and shipped by ${p.retailer}. Shipping, returns and final price are set by them.`}
            </Detail>
          </div>
        </div>
      </div>

      <section className="mt-24">
        <h2 className="display-lg border-t border-foreground pt-5">If this is<br />your thing…</h2>
        <Rail title="Similar pieces" items={similar} />
        <Rail title="More from this collection" items={collection} />
        <Rail title="Around the same budget" items={budget} />
      </section>
    </div>
  );
}

function Detail({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group py-4" open={title === "About this piece"}>
      <summary className="eyebrow flex cursor-pointer list-none items-center justify-between">
        {title}
        <span className="transition-transform group-open:rotate-45">+</span>
      </summary>
      <p className="mt-3 leading-relaxed text-muted-foreground">{children}</p>
    </details>
  );
}

function Rail({ title, items }: { title: string; items: typeof products }) {
  if (!items.length) return null;
  return (
    <div className="mt-12">
      <p className="eyebrow mb-5">{title}</p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-4 md:gap-x-6">
        {items.map((x, i) => (
          <ProductCard key={x.id} product={x} index={i} />
        ))}
      </div>
    </div>
  );
}
