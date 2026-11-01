import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Truck, Info, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/data/products";
import { isCodEligible } from "@/lib/order";
import { cn } from "@/lib/utils";

function getApiUrl(): string {
  if (typeof window !== "undefined") {
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
    if (window.location.hostname === "localhost") return "http://localhost:5001";
  }
  return "https://offscript-p9rk.onrender.com";
}

export function getAffiliateRedirectUrl(slug: string): string {
  const API_URL = getApiUrl();
  return `${API_URL}/api/affiliate/redirect/${encodeURIComponent(slug)}`;
}

export function PurchaseActions({
  product,
  size,
  compact,
}: {
  product: Product;
  size?: string;
  compact?: boolean;
}) {
  const p = product;

  // 1. Sold out state
  if (!p.inStock) {
    return (
      <div className="space-y-2">
        <button disabled className="btn-ink w-full opacity-60 cursor-not-allowed">
          Currently Sold Out
        </button>
        {!compact && (
          <p className="text-xs text-muted-foreground text-center">
            We will update this piece as soon as inventory is restocked.
          </p>
        )}
      </div>
    );
  }

  // 2. Direct Reselling / Cash on Delivery
  if (isCodEligible(p)) {
    return (
      <div className="space-y-3">
        <Link
          to="/order/$slug"
          params={{ slug: p.slug }}
          search={{ size: size || undefined }}
          className={cn("btn-ink w-full flex items-center justify-center gap-2")}
        >
          <Truck className="h-4 w-4" /> Order with Cash on Delivery
        </Link>
        {!compact && (
          <div className="rounded border border-border/60 bg-muted/20 p-2.5 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Fulfilled directly by OFFSCRIPT</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-normal">
              No online advance payment required. Submit your delivery details and pay cash when your order arrives.
            </p>
          </div>
        )}
      </div>
    );
  }

  // 3. Affiliate external merchant redirect
  const redirectUrl = p.affiliateUrl ? getAffiliateRedirectUrl(p.slug) : null;

  return (
    <div className="space-y-3">
      {redirectUrl ? (
        <a
          href={redirectUrl}
          target="_blank"
          rel="noopener noreferrer sponsored nofollow"
          className="btn-ink w-full flex items-center justify-center gap-2"
        >
          <span>Shop at {compact ? "retailer" : p.retailer}</span>
          <ArrowUpRight className="h-4 w-4" />
        </a>
      ) : (
        <button
          type="button"
          onClick={() =>
            toast("Retailer Link Pending", {
              description: "The affiliate partner link for this piece is currently updating.",
            })
          }
          className="btn-ink w-full flex items-center justify-center gap-2"
        >
          <span>Shop at retailer</span>
          <ArrowUpRight className="h-4 w-4" />
        </button>
      )}

      {!compact && (
        <div className="rounded border border-border/50 bg-muted/15 p-2.5 text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-1.5 text-foreground font-mono text-[10px] uppercase tracking-wider">
            <Info className="h-3 w-3 text-accent" />
            <span>Affiliate Disclosure</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            When you purchase via this link, OFFSCRIPT may earn an affiliate commission at zero additional cost to you. Pricing, inventory, and fulfillment are handled directly by {p.retailer}.
          </p>
        </div>
      )}
    </div>
  );
}
