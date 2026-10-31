import { Link } from "@tanstack/react-router";
import { Heart, Menu, Search, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/sheet";
import { SearchOverlay } from "./SearchOverlay";
import { wishlist, customerProfile } from "@/lib/store";
import { cn } from "@/lib/utils";

export const NAV = [
  { label: "Discover", slug: "discover" },
  { label: "Women", slug: "women" },
  { label: "Men", slug: "men" },
  { label: "Streetwear", slug: "streetwear" },
  { label: "Accessories", slug: "accessories" },
  { label: "Under ₹999", slug: "under-999" },
];

export const ANNOUNCEMENT = "Less scrolling. Better finds. ↓";

export function Wordmark({ className }: { className?: string }) {
  return (
    <Link to="/" aria-label="OFFSCRIPT home" className={cn("wordmark text-lg leading-none md:text-xl", className)}>
      OFF<span className="font-display normal-case italic tracking-normal text-accent">s</span>CRIPT
    </Link>
  );
}

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const saved = wishlist.use();
  const profile = customerProfile.use();

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <>
      <div className="eyebrow bg-foreground py-2 text-center text-background">{ANNOUNCEMENT}</div>
      <header
        className={cn(
          "sticky top-0 z-40 border-b transition-colors duration-300",
          scrolled ? "border-border bg-background/95 backdrop-blur" : "border-transparent bg-background",
        )}
      >
        <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-6 px-5 md:h-16 md:px-10">
          <Wordmark />
          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-7">
              {NAV.map((n) => (
                <li key={n.slug}>
                  <Link
                    to="/collections/$slug"
                    params={{ slug: n.slug }}
                    className="eyebrow link-underline py-1"
                    activeProps={{ className: "text-accent" }}
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-1">
            <button onClick={() => setSearchOpen(true)} aria-label="Search" className="inline-flex h-11 w-11 items-center justify-center hover:text-accent">
              <Search className="h-5 w-5" strokeWidth={1.5} />
            </button>
            <Link to="/wishlist" aria-label={`Wishlist, ${saved.length} saved`} className="relative inline-flex h-11 w-11 items-center justify-center hover:text-accent">
              <Heart className="h-5 w-5" strokeWidth={1.5} />
              {saved.length > 0 && (
                <span className="absolute right-1 top-1.5 flex h-4 min-w-4 items-center justify-center bg-accent px-1 text-[10px] font-bold text-accent-foreground">
                  {saved.length}
                </span>
              )}
            </Link>
            <Link to="/profile" aria-label="My Profile and Orders" className="relative inline-flex h-11 w-11 items-center justify-center hover:text-accent" title="My Profile & Orders">
              <User className="h-5 w-5" strokeWidth={1.5} />
              {profile.orderRefs?.length > 0 && (
                <span className="absolute right-1.5 top-2 h-2 w-2 rounded-full bg-accent" />
              )}
            </Link>
            <button onClick={() => setMenuOpen(true)} aria-label="Open menu" className="inline-flex h-11 w-11 items-center justify-center lg:hidden">
              <Menu className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>

      <SearchOverlay open={searchOpen} onOpenChange={setSearchOpen} />

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto border-0 bg-background p-0 sm:max-w-md [&>button]:hidden">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SheetDescription className="sr-only">Site navigation</SheetDescription>
          <div className="flex h-14 items-center justify-between border-b px-5">
            <span className="wordmark text-lg">OFFSCRIPT</span>
            <SheetClose aria-label="Close menu" className="inline-flex h-11 w-11 items-center justify-center">
              <X className="h-5 w-5" />
            </SheetClose>
          </div>
          <nav aria-label="Mobile" className="px-5 py-6">
            <ul className="space-y-1">
              {NAV.map((n, i) => (
                <li key={n.slug} className="reveal" style={{ animationDelay: `${i * 40}ms` }}>
                  <Link to="/collections/$slug" params={{ slug: n.slug }} onClick={() => setMenuOpen(false)} className="block border-b py-3 font-display text-4xl">
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="my-6 border-y py-4">
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 py-1 text-lg font-semibold"
              >
                <User className="h-5 w-5 text-accent" />
                <span>My Profile & Orders</span>
                {profile.orderRefs?.length > 0 && (
                  <span className="ml-auto rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-accent-foreground">
                    {profile.orderRefs.length}
                  </span>
                )}
              </Link>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
              <div className="space-y-2">
                <p className="eyebrow text-muted-foreground">Edits</p>
                <MenuLink slug="new-arrivals" label="Latest drops" close={() => setMenuOpen(false)} />
                <MenuLink slug="oversized-tees" label="Trending: Oversized tees" close={() => setMenuOpen(false)} />
                <MenuLink slug="clean-fit" label="Trending: Clean fit" close={() => setMenuOpen(false)} />
                <MenuLink slug="under-499" label="Under ₹499" close={() => setMenuOpen(false)} />
              </div>
              <div className="space-y-2">
                <p className="eyebrow text-muted-foreground">OFFSCRIPT</p>
                <Link to="/about" onClick={() => setMenuOpen(false)} className="block">About</Link>
                <Link to="/faq" onClick={() => setMenuOpen(false)} className="block">FAQ</Link>
                <Link to="/contact" onClick={() => setMenuOpen(false)} className="block">Contact</Link>
                <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer" className="block">Instagram ↗</a>
              </div>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}

function MenuLink({ slug, label, close }: { slug: string; label: string; close: () => void }) {
  return (
    <Link to="/collections/$slug" params={{ slug }} onClick={close} className="block">
      {label}
    </Link>
  );
}
