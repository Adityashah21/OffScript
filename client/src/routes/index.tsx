import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useMemo, useState } from "react";
import cover from "@/assets/cover.jpg";
import hero from "@/assets/hero.jpg";
import campaign from "@/assets/campaign.jpg";
import { getProduct, products } from "@/data/products";
import { getCollection, moods, productsIn } from "@/data/collections";
import { NewsletterForm } from "@/components/Editorial";
import { ProductCard } from "@/components/ProductCard";
import { ArchiveCard, ProductSpotlight } from "@/components/ProductTreatments";
import { RadarRail } from "@/components/RadarRail";
import { seo } from "@/lib/seo";
import { inr } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => seo("Not another fashion store", "OFFSCRIPT is an independent fashion edit for India — streetwear, everyday basics and accessories, curated. Just really good finds."),
  component: Home,
});

const col = (s: string) => getCollection(s)!;
const prod = (s: string) => getProduct(s)!;

function Home() {
  return (
    <>
      <CoverHero />
      <Ticker />
      <FindsWall />
      <MoodPicker />
      <Spotlights />
      <RadarRail slugs={["oversized-tees", "coffee-date", "clean-fit", "college-core", "monochrome", "sneaker-edit", "travel-fits"]} />
      <BudgetEdit />
      <CampaignSpotlight />
      <Archive />
      <Newsletter />
    </>
  );
}

function CoverHero() {
  return (
    <section className="relative isolate overflow-hidden bg-foreground text-paper">
      <img src={cover} alt="Model in an oversized leather jacket on a sunlit Kolkata street" width={1920} height={1088} className="reveal-img absolute inset-0 -z-10 h-full w-full object-cover object-[70%_center]" />
      <div className="absolute inset-0 -z-10 bg-linear-to-r from-ink/70 via-ink/20 to-transparent" />
      <div className="mx-auto flex min-h-[calc(100svh-6rem)] max-w-[1600px] flex-col px-5 py-6 md:min-h-[min(92vh,900px)] md:px-10 md:py-8">
        <div className="eyebrow flex items-center justify-between gap-4 opacity-90">
          <span>Issue 001 · Autumn/Winter ’26</span>
          <span className="hidden sm:inline">Campaign: Kolkata, Golden Hour</span>
          <span>₹ · India</span>
        </div>
        <div className="mt-auto">
          <p className="eyebrow reveal mb-5 inline-block bg-accent px-2 py-1 text-accent-foreground">The new wardrobe edit</p>
          <h1 className="display-cover reveal uppercase" style={{ animationDelay: "120ms" }}>
            Not another<br />
            <span className="font-display italic normal-case">fashion</span> store.
          </h1>
          <div className="reveal mt-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between" style={{ animationDelay: "260ms" }}>
            <p className="max-w-xs font-display text-2xl italic md:text-3xl">Just really good finds.</p>
            <div className="flex flex-wrap items-center gap-5">
              <Link to="/collections/$slug" params={{ slug: "discover" }} className="btn-paper group">
                Start discovering <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link to="/collections/$slug" params={{ slug: "new-arrivals" }} className="eyebrow link-underline">New this week →</Link>
            </div>
          </div>
        </div>
        <div className="eyebrow mt-8 flex justify-between border-t border-paper/30 pt-3 opacity-80">
          <span>On the cover: wide trousers, leather, a white tee</span>
          <span className="hidden md:inline">↓ The Finds Wall</span>
        </div>
      </div>
    </section>
  );
}

function Ticker() {
  const phrase = ["Good finds only", "Style over hype", "Less scrolling, better finds"];
  const row = (k: string) => (
    <div key={k} className="flex shrink-0 items-center" aria-hidden={k === "b"}>
      {[...phrase, ...phrase].map((t, i) => (
        <span key={i} className="flex items-center whitespace-nowrap">
          <span className="px-6">{t}</span>
          <span className="text-accent">✳</span>
        </span>
      ))}
    </div>
  );
  return (
    <div className="overflow-hidden border-b border-foreground bg-background py-4">
      <p className="sr-only">Good finds only. Style over hype. Less scrolling, better finds.</p>
      <div className="ticker font-display text-2xl uppercase md:text-3xl" aria-hidden>
        {row("a")}
        {row("b")}
      </div>
    </div>
  );
}

function FindsWall() {
  const tee = prod("washed-black-oversized-tee");
  const sneak = prod("minimal-everyday-sneakers");
  const knit = prod("textured-knit-top");
  const bag = prod("everyday-shoulder-bag");
  return (
    <section aria-labelledby="wall" className="mx-auto max-w-[1600px] px-5 pt-20 md:px-10">
      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-4">
          <p className="eyebrow text-accent">Section 01</p>
          <h2 id="wall" className="display-lg mt-3 uppercase">The finds<br />wall.</h2>
        </div>
        <p className="self-end text-muted-foreground md:col-span-4 md:col-start-9">A pin-board of what caught our eye this week. Every tile goes somewhere real.</p>
      </div>
      <div className="mt-10 grid auto-rows-[minmax(0,auto)] grid-cols-2 gap-3 md:grid-cols-12 md:gap-4">
        <WallImage to={{ slug: "streetwear" }} img={col("streetwear").image} label="Streetwear" caption="Collection" className="col-span-2 aspect-[4/3] md:col-span-7 md:row-span-2 md:aspect-auto" />
        <WallProduct p={tee} className="md:col-span-3" />
        <div className="col-span-1 flex flex-col justify-between bg-foreground p-5 text-background md:col-span-2">
          <p className="eyebrow opacity-60">Note</p>
          <p className="font-display text-2xl leading-tight md:text-3xl">"Buy less. Wear it more."</p>
          <p className="eyebrow opacity-60">— The edit</p>
        </div>
        <WallProduct p={sneak} className="md:col-span-2" />
        <WallImage to={{ slug: "her-rotation" }} img={col("her-rotation").image} label="Her Rotation" caption="Collection" className="col-span-1 aspect-[3/4] md:col-span-3" />
        <WallProduct p={knit} className="md:col-span-3" />
        <Link to="/collections/$slug" params={{ slug: "new-arrivals" }} className="group col-span-1 flex flex-col justify-between border border-foreground p-5 md:col-span-3">
          <span className="eyebrow">Just in</span>
          <span className="font-display text-5xl leading-none md:text-6xl">{productsIn("new-arrivals").length}<br /><span className="text-2xl">new finds</span></span>
          <ArrowUpRight className="h-6 w-6 self-end transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
        </Link>
        <WallImage to={{ slug: "his-rotation" }} img={col("his-rotation").image} label="His Rotation" caption="Collection" className="col-span-1 aspect-[4/5] md:col-span-3" />
        <WallProduct p={bag} className="md:col-span-3" />
      </div>
    </section>
  );
}

function WallImage({ to, img, label, caption, className }: { to: { slug: string }; img: string; label: string; caption: string; className?: string }) {
  return (
    <Link to="/collections/$slug" params={to} className={cn("group relative block overflow-hidden bg-secondary", className)}>
      <img src={img} alt="" loading="lazy" className="img-zoom absolute inset-0 h-full w-full object-cover group-hover:scale-[1.04]" />
      <div className="scrim-bottom absolute inset-0" />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4 text-paper md:p-6">
        <div>
          <p className="eyebrow opacity-80">{caption}</p>
          <p className="font-display text-3xl md:text-5xl">{label}</p>
        </div>
        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

function WallProduct({ p, className }: { p: ReturnType<typeof prod>; className?: string }) {
  return (
    <div className={cn("col-span-1", className)}>
      <ProductCard product={p} />
    </div>
  );
}

function MoodPicker() {
  const [mood, setMood] = useState(moods[0]!.slug);
  const list = useMemo(() => productsIn(mood).slice(0, 4), [mood]);
  const active = moods.find((m) => m.slug === mood)!;
  return (
    <section aria-labelledby="mood" className="mt-28 bg-foreground py-20 text-background">
      <div className="mx-auto max-w-[1600px] px-5 md:px-10">
        <p className="eyebrow opacity-60">Section 02 · Interactive</p>
        <h2 id="mood" className="display-lg mt-3 uppercase">What's your<br />current mood?</h2>
        <div role="tablist" aria-label="Moods" className="mt-10 flex flex-wrap gap-x-6 gap-y-2 border-b border-background/20 pb-4">
          {moods.map((m) => (
            <button
              key={m.slug}
              role="tab"
              aria-selected={mood === m.slug}
              onClick={() => setMood(m.slug)}
              className={cn("font-display text-3xl transition-colors md:text-5xl", mood === m.slug ? "text-background" : "text-background/30 hover:text-background/70")}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div role="tabpanel" className="mt-8 grid gap-10 md:grid-cols-12">
          <div className="md:col-span-3">
            <p className="eyebrow text-accent-foreground/70">{active.note}</p>
            <p className="mt-3 text-sm opacity-70">{productsIn(mood).length} pieces match this mood.</p>
            <Link to="/collections/$slug" params={{ slug: mood }} className="btn-paper group mt-6">
              See all <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div key={mood} className="grid grid-cols-2 gap-x-3 gap-y-8 md:col-span-9 md:grid-cols-4 md:gap-x-5 [&_.text-muted-foreground]:text-background/60">
            {list.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Spotlights() {
  return (
    <section aria-labelledby="spot" className="mx-auto max-w-[1600px] px-5 pt-28 md:px-10">
      <p className="eyebrow text-accent">Section 03</p>
      <h2 id="spot" className="display-lg mt-3 uppercase">Worth the<br />spotlight.</h2>
      <div className="mt-14 space-y-24">
        <ProductSpotlight product={prod("black-slip-midi-dress")} index="01" />
        <ProductSpotlight product={prod("olive-overshirt")} index="02" reverse />
      </div>
    </section>
  );
}

function BudgetEdit() {
  const tiers = [
    { slug: "under-499", price: 499, copy: "Small budget. Strong outfit." },
    { slug: "under-999", price: 999, copy: "Everyday pieces that do more." },
    { slug: "under-1999", price: 1999, copy: "Your next wardrobe upgrade starts here." },
  ];
  return (
    <section aria-labelledby="budget" className="mx-auto max-w-[1600px] px-5 pt-28 md:px-10">
      <div className="flex flex-col justify-between gap-4 border-t border-foreground pt-5 md:flex-row md:items-end">
        <h2 id="budget" className="display-lg uppercase">Good taste.<br /><span className="italic normal-case text-accent">Any</span> budget.</h2>
        <p className="max-w-xs text-muted-foreground">Pick a ceiling. We'll show only what's under it.</p>
      </div>
      <ul className="mt-6">
        {tiers.map((t) => (
          <li key={t.slug} className="border-b border-foreground">
            <Link to="/collections/$slug" params={{ slug: t.slug }} className="group grid items-center gap-4 py-6 md:grid-cols-[auto_1fr_auto_auto] md:gap-10">
              <span className="eyebrow text-muted-foreground">Under</span>
              <span className="font-display text-[clamp(4.5rem,14vw,13rem)] leading-[0.85] tracking-tight transition-colors group-hover:text-accent">{inr(t.price)}</span>
              <span className="max-w-[16rem] text-muted-foreground">{t.copy}</span>
              <span className="eyebrow inline-flex items-center gap-2">{productsIn(t.slug).length} pieces <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CampaignSpotlight() {
  return (
    <section className="mt-28 grid bg-accent text-accent-foreground md:grid-cols-12">
      <div className="relative min-h-[60vh] md:col-span-7">
        <img src={campaign} alt="Two friends in burgundy and cream on a Mumbai rooftop" loading="lazy" className="absolute inset-0 h-full w-full object-cover object-right" />
      </div>
      <div className="flex flex-col justify-between gap-10 p-6 md:col-span-5 md:p-12">
        <p className="eyebrow opacity-80">Campaign 002 · Rooftop, Mumbai</p>
        <div>
          <h2 className="display-lg uppercase">Your next<br />favourite fit<br /><span className="italic normal-case">is closer than you think.</span></h2>
          <p className="mt-5 max-w-sm opacity-90">Our editors' first picks this season — {productsIn("featured").length} pieces, one page.</p>
        </div>
        <Link to="/edit/$slug" params={{ slug: "next-favourite-fit" }} className="btn-paper group self-start">
          Open the campaign <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}

function Archive() {
  const list = [...products].sort((a, b) => a.price - b.price);
  return (
    <section aria-labelledby="archive" className="bg-foreground py-20 text-background">
      <div className="mx-auto grid max-w-[1600px] gap-10 px-5 md:grid-cols-12 md:px-10">
        <div className="md:col-span-4">
          <p className="eyebrow opacity-60">Section 04 · The index</p>
          <h2 id="archive" className="display-lg mt-3 uppercase">The full<br />archive.</h2>
          <p className="mt-4 max-w-xs opacity-70">Every piece in the edit, cheapest first. Skim it like a contents page.</p>
          <img src={hero} alt="" loading="lazy" className="mt-8 hidden aspect-[4/5] w-2/3 object-cover md:block" />
        </div>
        <ul className="md:col-span-8">
          {list.map((p, i) => (
            <ArchiveCard key={p.id} product={p} n={i + 1} />
          ))}
        </ul>
      </div>
    </section>
  );
}

function Newsletter() {
  return (
    <section className="mx-auto max-w-[1600px] px-5 pt-28 md:px-10">
      <div className="grid gap-10 md:grid-cols-2">
        <h2 className="display-lg uppercase">Good finds.<br /><span className="italic normal-case text-accent">Straight to you.</span></h2>
        <div className="flex flex-col justify-end gap-6">
          <p className="max-w-md text-muted-foreground">New edits, underrated pieces, and outfit inspiration. Only when there's something worth sharing.</p>
          <NewsletterForm />
        </div>
      </div>
    </section>
  );
}
