import { createFileRoute, Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { toast } from "sonner";
import { products } from "@/data/products";
import { EmptyState } from "@/components/Editorial";
import { PriceBadge } from "@/components/ProductCard";
import { PurchaseActions } from "@/components/PurchaseActions";
import { toggleWishlist, wishlist } from "@/lib/store";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/wishlist")({
  head: () => seo("Your wishlist", "The pieces you've saved on OFFSCRIPT, kept on this device."),
  component: WishlistPage,
});

function WishlistPage() {
  const saved = wishlist.use();
  const items = saved.map((s) => products.find((p) => p.slug === s)).filter((p): p is (typeof products)[number] => !!p);
  return (
    <div className="mx-auto max-w-[1600px] px-5 pt-10 md:px-10">
      <p className="eyebrow text-accent">Saved on this device</p>
      <h1 className="display-xl mt-3 uppercase">Wishlist</h1>
      <p className="mt-3 eyebrow text-muted-foreground">{items.length} {items.length === 1 ? "piece" : "pieces"}</p>
      <div className="mt-10">
        {items.length === 0 ? (
          <EmptyState
            title={["Your next favorites", "start here."]}
            body="Tap the heart on anything you like. We'll keep it here for you."
            action={<Link to="/collections/$slug" params={{ slug: "discover" }} className="btn-ink">Discover the edit</Link>}
          />
        ) : (
          <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((p) => (
              <li key={p.id} className="relative">
                <Link to="/product/$slug" params={{ slug: p.slug }} className="group block">
                  <div className="aspect-[4/5] overflow-hidden bg-secondary">
                    <img src={p.images[0]} alt={p.name} className="img-zoom h-full w-full object-cover group-hover:scale-105" />
                  </div>
                  <p className="eyebrow mt-3 text-muted-foreground">{p.retailer}</p>
                  <p className="text-sm font-medium">{p.name}</p>
                  <PriceBadge price={p.price} originalPrice={p.originalPrice} className="text-sm" />
                </Link>
                <div className="mt-4"><PurchaseActions product={p} compact /></div>
                <button
                  onClick={() => {
                    toggleWishlist(p.slug);
                    toast("Removed from your wishlist", { description: p.name });
                  }}
                  aria-label={`Remove ${p.name}`}
                  className="absolute right-2 top-2 inline-flex h-10 w-10 items-center justify-center bg-background"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
