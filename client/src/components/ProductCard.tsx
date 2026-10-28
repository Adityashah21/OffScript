import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import type { Product } from "@/data/products";
import { inr } from "@/lib/format";
import { isCodEligible } from "@/lib/order";
import { WishlistButton } from "./WishlistButton";
import { cn } from "@/lib/utils";

export function PriceBadge({ price, originalPrice, className }: { price: number; originalPrice?: number | undefined; className?: string }) {
  return (
    <span className={cn("inline-flex items-baseline gap-2", className)}>
      <span className="font-semibold">{inr(price)}</span>
      {originalPrice && originalPrice > price && (
        <span className="text-muted-foreground line-through text-[0.85em]">{inr(originalPrice)}</span>
      )}
    </span>
  );
}

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const p = product;
  const off = p.originalPrice && p.originalPrice > p.price ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;
  return (
    <article className="group relative reveal" style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}>
      <Link to="/product/$slug" params={{ slug: p.slug }} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
          <img
            src={p.images[0]}
            alt={p.name}
            loading="lazy"
            width={768}
            height={960}
            className="img-zoom absolute inset-0 h-full w-full object-cover group-hover:scale-[1.04]"
          />
          {p.images[1] && (
            <img
              src={p.images[1]}
              alt=""
              aria-hidden
              loading="lazy"
              className="img-zoom absolute inset-0 h-full w-full object-cover opacity-0 group-hover:opacity-100 group-hover:scale-[1.04]"
            />
          )}
          <div className="absolute left-0 top-0 flex flex-col items-start gap-1 p-2">
            {p.isEditorsPick && <span className="eyebrow bg-accent px-2 py-1 text-accent-foreground">Editor's pick</span>}
            {p.isNew && <span className="eyebrow bg-background px-2 py-1 text-foreground">New</span>}
            {off > 0 && <span className="eyebrow bg-olive px-2 py-1 text-olive-foreground">−{off}% at retailer</span>}
            {!p.inStock && <span className="eyebrow bg-foreground px-2 py-1 text-background">Sold out</span>}
          </div>
          <span className="eyebrow absolute inset-x-2 bottom-2 hidden translate-y-2 bg-background text-foreground py-3 text-center opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 md:block">
            View piece
          </span>
        </div>
        <div className="mt-3 space-y-1 pr-10">
          <p className="eyebrow text-muted-foreground">
            {p.category} · {p.retailer}
          </p>
          <h3 className="text-sm font-medium leading-snug">{p.name}</h3>
          <div className="flex items-center gap-2 text-sm">
            <PriceBadge price={p.price} originalPrice={p.originalPrice} />
            {isCodEligible(p) ? (
              <span className="eyebrow text-olive">COD</span>
            ) : (
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" aria-label="Sold by external retailer" />
            )}
          </div>
        </div>
      </Link>
      <WishlistButton slug={p.slug} name={p.name} className="absolute right-2 top-2" />
    </article>
  );
}

export function ProductGrid({ products, className }: { products: Product[]; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 md:gap-x-6 2xl:grid-cols-4", className)}>
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} index={i} />
      ))}
    </div>
  );
}

export function LoadingSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 md:gap-x-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="aspect-[4/5] animate-pulse bg-secondary" />
          <div className="h-3 w-1/2 animate-pulse bg-secondary" />
          <div className="h-3 w-3/4 animate-pulse bg-secondary" />
        </div>
      ))}
    </div>
  );
}
