import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { Product } from "@/data/products";
import { PriceBadge } from "./ProductCard";
import { PurchaseActions } from "./PurchaseActions";
import { WishlistButton } from "./WishlistButton";
import { isCodEligible } from "@/lib/order";
import { cn } from "@/lib/utils";

/** Large featured-product spotlight: image + editorial copy + real purchase actions. */
export function ProductSpotlight({ product: p, index, reverse }: { product: Product; index: string; reverse?: boolean }) {
  return (
    <article className={cn("grid items-center gap-8 md:grid-cols-12 md:gap-10", reverse && "md:[&>*:first-child]:order-2")}>
      <Link to="/product/$slug" params={{ slug: p.slug }} className="group relative block overflow-hidden bg-secondary md:col-span-7">
        <img src={p.images[0]} alt={p.name} loading="lazy" className="img-zoom aspect-[4/5] w-full object-cover group-hover:scale-[1.03] md:aspect-[5/6]" />
        <span className="eyebrow absolute left-4 top-4 bg-background px-2 py-1">Spotlight {index}</span>
      </Link>
      <div className="md:col-span-5">
        <p className="font-display text-[clamp(4rem,10vw,9rem)] leading-none text-accent">{index}</p>
        <p className="eyebrow mt-4 text-muted-foreground">{p.category} · {p.retailer}</p>
        <h3 className="display-md mt-3">{p.name}</h3>
        <p className="mt-4 max-w-sm leading-relaxed text-muted-foreground">{p.description.replace(" Sample description for demo purposes.", "")}</p>
        <PriceBadge price={p.price} originalPrice={p.originalPrice} className="mt-5 text-xl" />
        <div className="mt-6 flex max-w-sm gap-2">
          <div className="flex-1"><PurchaseActions product={p} compact /></div>
          <WishlistButton slug={p.slug} name={p.name} className="h-12 w-12 border" />
        </div>
        <Link to="/product/$slug" params={{ slug: p.slug }} className="eyebrow group mt-5 inline-flex items-center gap-2">
          Read the details <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </article>
  );
}

/** Compact archive-style row: index number, thumb, name, price — catalogue index feel. */
export function ArchiveCard({ product: p, n }: { product: Product; n: number }) {
  return (
    <li className="group relative border-b border-background/20">
      <Link to="/product/$slug" params={{ slug: p.slug }} className="grid grid-cols-[2.5rem_3.5rem_1fr_auto] items-center gap-3 py-3 pr-12 sm:grid-cols-[3rem_4rem_1fr_8rem_auto] sm:gap-5">
        <span className="eyebrow opacity-50">{String(n).padStart(3, "0")}</span>
        <span className="aspect-[4/5] overflow-hidden bg-background/10">
          <img src={p.images[0]} alt="" loading="lazy" className="img-zoom h-full w-full object-cover group-hover:scale-110" />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-display text-xl transition-colors group-hover:text-accent-foreground sm:text-2xl">{p.name}</span>
          <span className="eyebrow block opacity-60">{p.retailer}</span>
        </span>
        <span className="eyebrow hidden opacity-60 sm:block">{isCodEligible(p) ? "Cash on delivery" : "At retailer ↗"}</span>
        <PriceBadge price={p.price} originalPrice={p.originalPrice} className="text-sm" />
      </Link>
      <WishlistButton slug={p.slug} name={p.name} className="absolute right-0 top-1/2 -translate-y-1/2" />
    </li>
  );
}
