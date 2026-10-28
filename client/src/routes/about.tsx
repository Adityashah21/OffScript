import { createFileRoute, Link } from "@tanstack/react-router";
import everyday from "@/assets/cat-everyday.jpg";
import street from "@/assets/cat-streetwear.jpg";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  head: () => seo("About", "Why OFFSCRIPT exists: the internet has enough products — we're here for the good ones."),
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-[1600px] px-5 pt-12 md:px-10">
      <p className="eyebrow text-accent">About OFFSCRIPT</p>
      <h1 className="display-xl mt-4 uppercase">The internet has<br />enough products.<br /><span className="italic normal-case text-accent">We're here for</span><br />the good ones.</h1>

      <div className="mt-20 grid gap-12 md:grid-cols-[1fr_1fr]">
        <img src={everyday} alt="Everyday uniform editorial" className="aspect-[3/4] w-full object-cover" />
        <div className="space-y-12 md:pt-24">
          <Block n="01" title="The idea">
            There are thousands of fashion products online. Finding the pieces that fit your taste, budget and everyday life takes time. OFFSCRIPT aims to make that easier by curating interesting products, useful collections and outfit inspiration. (Placeholder copy — replace with your own story.)
          </Block>
          <Block n="02" title="How we curate">
            Fewer, better. We look at cut, fabric feel, price and how a piece works with the rest of a wardrobe — not just how it photographs.
          </Block>
          <Block n="03" title="Where finds come from">
            Many of our edits start on social feeds — Reels, Shorts, Pins. We follow the trend, then filter for what's actually worth buying.
          </Block>
        </div>
      </div>

      <div className="mt-24 grid gap-12 md:grid-cols-[1fr_1.4fr]">
        <div className="space-y-8">
          <Block n="04" title="How buying works">
            Most pieces are sold by external retailers. Clicking "Shop at retailer" takes you to their site, where they handle payment, delivery and returns. A small number of pieces can be requested with cash on delivery, where we have a fulfilment arrangement.
          </Block>
          <Block n="05" title="Affiliate disclosure">
            Some product links may be affiliate links. We may earn a commission when you make a qualifying purchase, at no additional cost to you. It never decides what we pick.
          </Block>
          <Link to="/collections/$slug" params={{ slug: "discover" }} className="btn-ink">Discover the edit</Link>
        </div>
        <img src={street} alt="Streetwear editorial" className="aspect-[4/3] w-full object-cover" />
      </div>
    </div>
  );
}

function Block({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-foreground pt-4">
      <p className="eyebrow text-muted-foreground">{n}</p>
      <h2 className="mt-2 font-display text-3xl">{title}</h2>
      <p className="mt-3 max-w-lg leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}
