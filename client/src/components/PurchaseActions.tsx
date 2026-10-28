import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Truck } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/data/products";
import { isCodEligible } from "@/lib/order";
import { cn } from "@/lib/utils";

export function PurchaseActions({ product, size, compact }: { product: Product; size?: string; compact?: boolean }) {
  const p = product;
  if (!p.inStock) {
    return (
      <div className="space-y-2">
        <button disabled className="btn-ink w-full">Currently sold out</button>
        {!compact && <p className="text-xs text-muted-foreground">We'll update this page if the retailer restocks.</p>}
      </div>
    );
  }
  if (isCodEligible(p)) {
    return (
      <div className="space-y-2">
        <Link to="/order/$slug" params={{ slug: p.slug }} search={{ size: size || undefined }} className={cn("btn-ink w-full")}>
          <Truck className="h-4 w-4" /> Order with cash on delivery
        </Link>
        {!compact && (
          <p className="text-xs text-muted-foreground">
            You'll submit an order request to OFFSCRIPT. No online payment — pay when it arrives.
          </p>
        )}
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {p.affiliateUrl ? (
        <a href={p.affiliateUrl} target="_blank" rel="noopener noreferrer sponsored nofollow" className="btn-ink w-full">
          Shop at {compact ? "retailer" : p.retailer} <ArrowUpRight className="h-4 w-4" />
        </a>
      ) : (
        <button
          type="button"
          onClick={() => toast("Demo mode", { description: "No retailer link is configured for this piece yet." })}
          className="btn-ink w-full"
        >
          Shop at retailer <ArrowUpRight className="h-4 w-4" />
        </button>
      )}
      {!compact && (
        <p className="text-xs text-muted-foreground">
          {p.affiliateUrl
            ? `Opens ${p.retailer} in a new tab (demo placeholder link). Price, delivery and returns are handled by the retailer.`
            : "Demo state: no retailer link configured. In production this opens the retailer's page in a new tab."}
        </p>
      )}
    </div>
  );
}
