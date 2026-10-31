import { Link } from "@tanstack/react-router";

const EXPLORE = [
  ["Discover", "discover"],
  ["New Arrivals", "new-arrivals"],
  ["Women", "women"],
  ["Men", "men"],
  ["Streetwear", "streetwear"],
  ["Under ₹999", "under-999"],
] as const;

const POLICIES = [
  ["Privacy Policy", "privacy"],
  ["Terms and Conditions", "terms"],
  ["Affiliate Disclosure", "affiliate-disclosure"],
  ["Shipping and Returns", "shipping-returns"],
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-foreground text-background">
      <div className="mx-auto max-w-[1600px] px-5 pt-16 md:px-10">
        <p className="display-lg mb-16 max-w-4xl border-b border-background/20 pb-12 uppercase">
          Not another fashion store.<br /><span className="italic normal-case text-background/60">Just really good finds, chosen by people who care.</span>
        </p>
        <div className="grid gap-12 md:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
          <div>
            <p className="wordmark text-3xl">OFFSCRIPT</p>
            <p className="mt-3 font-display text-2xl italic opacity-80">Less noise. Better finds.</p>
          </div>
          <FooterCol title="Explore">
            {EXPLORE.map(([l, s]) => (
              <Link key={s} to="/collections/$slug" params={{ slug: s }} className="link-underline">{l}</Link>
            ))}
          </FooterCol>
          <FooterCol title="Information">
            <Link to="/profile" className="link-underline font-medium text-accent">My Orders & Profile</Link>
            <Link to="/about" className="link-underline">About Us</Link>
            <Link to="/faq" className="link-underline">How It Works</Link>
            <Link to="/contact" className="link-underline">Contact</Link>
            <Link to="/faq" className="link-underline">FAQs</Link>
          </FooterCol>
          <FooterCol title="Policies">
            {POLICIES.map(([l, s]) => (
              <Link key={s} to="/legal/$slug" params={{ slug: s }} className="link-underline">{l}</Link>
            ))}
          </FooterCol>
          <FooterCol title="Social">
            <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer" className="link-underline">Instagram ↗</a>
            <a href="https://pinterest.com/" target="_blank" rel="noopener noreferrer" className="link-underline">Pinterest ↗</a>
            <a href="https://youtube.com/" target="_blank" rel="noopener noreferrer" className="link-underline">YouTube ↗</a>
          </FooterCol>
        </div>
        <div className="mt-16 border-t border-background/20 py-6 text-sm">
          <p className="max-w-3xl opacity-80">
            <strong className="eyebrow mr-2">Affiliate disclosure</strong>
            Some product links may be affiliate links. We may earn a commission when you make a qualifying purchase, at no additional cost to you.
          </p>
          <p className="mt-4 text-xs opacity-60">© 2026 OFFSCRIPT · Demo storefront. Products, retailers and prices shown are illustrative.</p>
        </div>
        <p aria-hidden className="wordmark select-none overflow-hidden whitespace-nowrap pb-2 text-[22vw] leading-[0.8] opacity-[0.07]">OFFSCRIPT</p>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="eyebrow mb-4 opacity-60">{title}</p>
      <div className="flex flex-col items-start gap-2 text-sm">{children}</div>
    </div>
  );
}
