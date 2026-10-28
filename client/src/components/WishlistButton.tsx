import { Heart } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { toggleWishlist, wishlist } from "@/lib/store";

export function WishlistButton({ slug, name, className, withLabel }: { slug: string; name: string; className?: string; withLabel?: boolean }) {
  const list = wishlist.use();
  const saved = list.includes(slug);
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const added = toggleWishlist(slug);
        toast(added ? "Saved to your wishlist" : "Removed from your wishlist", { description: name });
      }}
      className={cn(
        "inline-flex items-center justify-center gap-2 transition-transform duration-200 active:scale-90",
        withLabel ? "btn-outline w-full" : "h-10 w-10 bg-background/90 text-foreground hover:bg-background",
        className,
      )}
    >
      <Heart className={cn("h-4 w-4 transition-colors", saved ? "fill-accent text-accent" : "")} strokeWidth={1.5} />
      {withLabel && (saved ? "Saved" : "Save to wishlist")}
    </button>
  );
}
