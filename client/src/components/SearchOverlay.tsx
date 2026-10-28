import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { searchAll, searchSuggestions } from "@/lib/search";
import { pushRecent, recentSearches } from "@/lib/store";
import { inr } from "@/lib/format";

const SHORTCUTS = [
  { label: "Women", slug: "women" },
  { label: "Men", slug: "men" },
  { label: "Streetwear", slug: "streetwear" },
  { label: "Accessories", slug: "accessories" },
  { label: "Under ₹999", slug: "under-999" },
];

export function SearchOverlay({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [q, setQ] = useState("");
  const [committed, setCommitted] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const recent = recentSearches.use();
  const navigate = useNavigate();
  const results = useMemo(() => searchAll(q), [q]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else setQ("");
  }, [open]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (q.trim().length > 2) {
        pushRecent(q);
        setCommitted(q);
      }
    }, 1200);
    return () => clearTimeout(t);
  }, [q]);

  const close = () => {
    if (q.trim() && committed !== q) pushRecent(q);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="top" className="h-[100dvh] max-h-[100dvh] overflow-y-auto border-0 bg-background p-0 duration-300 [&>button]:hidden">
        <SheetTitle className="sr-only">Search OFFSCRIPT</SheetTitle>
        <SheetDescription className="sr-only">Search products, retailers, colours and collections.</SheetDescription>
        <div className="mx-auto max-w-6xl px-5 py-6 md:px-10 md:py-10">
          <div className="flex items-center gap-4 border-b border-foreground pb-3">
            <Search className="h-5 w-5 shrink-0" strokeWidth={1.5} aria-hidden />
            <label htmlFor="site-search" className="sr-only">Search</label>
            <input
              ref={inputRef}
              id="site-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && results.products[0]) {
                  pushRecent(q);
                  onOpenChange(false);
                  navigate({ to: "/product/$slug", params: { slug: results.products[0].slug } });
                }
              }}
              placeholder="Search tees, sneakers, under 1000…"
              className="w-full bg-transparent font-display text-3xl outline-none placeholder:text-muted-foreground/60 md:text-7xl"
              autoComplete="off"
            />
            <button onClick={() => onOpenChange(false)} aria-label="Close search" className="h-10 w-10 shrink-0 inline-flex items-center justify-center hover:text-accent">
              <X className="h-5 w-5" />
            </button>
          </div>

          {!q.trim() ? (
            <div className="grid gap-10 py-8 md:grid-cols-3">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="eyebrow text-muted-foreground">Recent</p>
                  {recent.length > 0 && (
                    <button onClick={() => recentSearches.write([])} className="eyebrow link-underline">Clear</button>
                  )}
                </div>
                {recent.length ? (
                  <ul className="space-y-2">
                    {recent.map((r) => (
                      <li key={r}><button onClick={() => setQ(r)} className="link-underline text-left">{r}</button></li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Nothing yet.</p>
                )}
              </div>
              <div>
                <p className="eyebrow mb-3 text-muted-foreground">Trending searches</p>
                <ul className="space-y-2">
                  {searchSuggestions.map((s) => (
                    <li key={s}><button onClick={() => setQ(s)} className="link-underline text-left">{s}</button></li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="eyebrow mb-3 text-muted-foreground">Shortcuts</p>
                <div className="flex flex-wrap gap-2">
                  {SHORTCUTS.map((s) => (
                    <Link key={s.slug} to="/collections/$slug" params={{ slug: s.slug }} onClick={close} className="border px-3 py-2 text-sm hover:border-foreground">
                      {s.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ) : results.products.length === 0 && results.collections.length === 0 ? (
            <div className="py-12">
              <h2 className="display-md">No finds this time.</h2>
              <p className="mt-3 max-w-md text-muted-foreground">Try another search. Your next favorite piece is probably hiding under a different name.</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {searchSuggestions.map((s) => (
                  <button key={s} onClick={() => setQ(s)} className="border px-3 py-2 text-sm hover:border-foreground">{s}</button>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid gap-10 py-8 md:grid-cols-[1fr_2fr]">
              <div>
                <p className="eyebrow mb-3 text-muted-foreground">Collections</p>
                {results.collections.length ? (
                  <ul className="space-y-3">
                    {results.collections.map((c) => (
                      <li key={c.slug}>
                        <Link to="/collections/$slug" params={{ slug: c.slug }} onClick={close} className="group flex items-center justify-between border-b pb-3">
                          <span className="font-display text-xl">{c.title}</span>
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No matching collections.</p>
                )}
              </div>
              <div>
                <p className="eyebrow mb-3 text-muted-foreground" aria-live="polite">
                  {results.products.length} {results.products.length === 1 ? "piece" : "pieces"}
                </p>
                <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {results.products.slice(0, 9).map((p) => (
                    <li key={p.id}>
                      <Link to="/product/$slug" params={{ slug: p.slug }} onClick={close} className="group block">
                        <div className="aspect-[4/5] overflow-hidden bg-secondary">
                          <img src={p.images[0]} alt={p.name} className="img-zoom h-full w-full object-cover group-hover:scale-105" />
                        </div>
                        <p className="mt-2 text-sm">{p.name}</p>
                        <p className="text-sm font-semibold">{inr(p.price)}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
