import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { seo } from "@/lib/seo";

const PAGES: Record<string, { title: string; subtitle: string; body: string[] }> = {
  privacy: {
    title: "Privacy Policy",
    subtitle: "How OFFSCRIPT collects, safeguards, and processes customer and order information.",
    body: [
      "1. Information Collection: OFFSCRIPT collects customer details strictly required to process and dispatch Cash-on-Delivery (COD) orders and maintain client accounts (full name, verified 10-digit mobile number, delivery address, and optional email).",
      "2. Campaign Attribution & Analytics: We record anonymous referral sources (e.g. UTM campaign tags) to analyze discovery trends. We do not sell, rent, or distribute personal identity information to third-party data brokers.",
      "3. External Merchant Redirects: When you click an affiliate curation piece, you are securely redirected to the external retailer's domain. That merchant's privacy policy governs subsequent transactions on their store.",
      "4. Data Rights: You may request the deletion or correction of your registered account and order history at any time by contacting support@offscript.in.",
    ],
  },
  terms: {
    title: "Terms of Service",
    subtitle: "The legal framework governing discovery, affiliate referrals, and direct reselling.",
    body: [
      "1. Dual Platform Model: OFFSCRIPT operates both as an editorial streetwear discovery engine (curating affiliate links to third-party merchants) and an authorized direct reselling service for select cash-on-delivery garments.",
      "2. Affiliate Products: For third-party affiliate items, external merchants are solely responsible for product availability, price discrepancies, order fulfillment, shipping speed, and external returns.",
      "3. Direct Reselling Orders: For pieces marked 'Cash on Delivery (Authorised)', OFFSCRIPT verifies the order details with you prior to dispatch. You agree to inspect the package upon courier arrival and tender exact cash payment.",
      "4. Fair Usage: Repeated fraudulent order submissions, bot requests, or fake addresses will result in permanent IP and phone blacklisting.",
    ],
  },
  "affiliate-disclosure": {
    title: "Affiliate & Advertising Disclosure",
    subtitle: "Full transparency regarding commission attribution and editorial curation.",
    body: [
      "1. Commission Disclosure: In compliance with international advertising standards and FTC guidelines, OFFSCRIPT discloses that certain product links on this website are affiliate tracking links.",
      "2. Zero Cost to You: When you click an affiliate product and complete a qualifying purchase on a partner merchant's website, OFFSCRIPT may earn a small referral commission at absolutely no additional cost to you.",
      "3. Editorial Independence: Our editorial selections, style edits, and collections are independently chosen based on streetwear aesthetics, construction quality, and silhouette. Brand sponsorship never dictates our recommendations.",
      "4. Direct Fulfillment Separation: Pieces marked 'Order with cash on delivery' are not affiliate links; they are fulfilled directly by OFFSCRIPT.",
    ],
  },
  "shipping-returns": {
    title: "Shipping & Return Policy",
    subtitle: "Fulfillment timeframes, COD delivery instructions, and return policies.",
    body: [
      "1. Cash-on-Delivery Dispatch: Direct reselling orders are processed within 24 to 48 hours of verification. Standard delivery across major Indian metro cities takes 3 to 5 business days.",
      "2. Payment Collection: COD payment is collected in cash or accepted UPI scan upon courier arrival at your provided address. Our delivery partners require order confirmation before package handover.",
      "3. Returns & Exchanges: We offer a 7-day return and exchange window for unworn direct-reselling pieces with original tags intact in case of sizing mismatch or manufacturing defects. Initiate return requests via your Profile page or email returns@offscript.in.",
      "4. Affiliate Purchases: For pieces purchased via third-party retailer redirects, all shipping tracking, delivery timelines, and return workflows are managed under that specific retailer's policy.",
    ],
  },
  "size-guide": {
    title: "Editorial Size & Fit Guide",
    subtitle: "Streetwear proportions, boxy cuts, and standard garment measurements.",
    body: [
      "Tops & Camp Shirts (Chest circumference in inches):\n• XS: 34 - 36 in (86 - 91 cm)\n• S: 36 - 38 in (91 - 96 cm)\n• M: 38 - 40 in (96 - 101 cm)\n• L: 42 - 44 in (106 - 111 cm)\n• XL: 44 - 46 in (111 - 117 cm)\n• XXL: 46 - 48 in (117 - 122 cm)",
      "Fit Note: OFFSCRIPT camp shirts and boxy heavyweight tees are engineered with dropped shoulders and relaxed chest ease. If you prefer a tailored fit, we recommend sizing down one standard size.",
      "Bottoms & Trousers (Waist in inches):\n• 28: 71 cm\n• 30: 76 cm\n• 32: 81 cm\n• 34: 86 cm\n• 36: 91 cm",
      "Footwear (UK / Indian standard):\n• UK 6 / EU 40\n• UK 7 / EU 41\n• UK 8 / EU 42\n• UK 9 / EU 43\n• UK 10 / EU 44\n• UK 11 / EU 45",
    ],
  },
};

export const Route = createFileRoute("/legal/$slug")({
  loader: ({ params }) => {
    const p = PAGES[params.slug];
    if (!p) throw notFound();
    return { title: p.title, subtitle: p.subtitle, body: p.body, slug: params.slug };
  },
  head: ({ loaderData }) =>
    loaderData
      ? seo(`${loaderData.title} · OFFSCRIPT`, loaderData.subtitle)
      : { meta: [{ title: "Policy · OFFSCRIPT" }] },
  component: LegalPage,
});

function LegalPage() {
  const data = Route.useLoaderData();

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 md:py-20">
      <Link to="/" className="eyebrow link-underline text-muted-foreground mb-8 inline-block">
        ← Back to Discovery
      </Link>
      <h1 className="display-lg uppercase tracking-tight">{data.title}</h1>
      <p className="mt-3 text-sm text-muted-foreground font-mono">{data.subtitle}</p>

      <div className="mt-10 space-y-6 text-sm leading-relaxed border-t pt-8">
        {data.body.map((para, i) => (
          <p key={i} className="whitespace-pre-line text-foreground/90">
            {para}
          </p>
        ))}
      </div>

      <div className="mt-16 border-t pt-8 flex flex-wrap gap-4 text-xs font-mono text-muted-foreground">
        <Link to="/legal/$slug" params={{ slug: "privacy" }} className="hover:text-foreground underline">
          Privacy Policy
        </Link>
        <span>•</span>
        <Link to="/legal/$slug" params={{ slug: "terms" }} className="hover:text-foreground underline">
          Terms & Conditions
        </Link>
        <span>•</span>
        <Link to="/legal/$slug" params={{ slug: "affiliate-disclosure" }} className="hover:text-foreground underline">
          Affiliate Disclosure
        </Link>
        <span>•</span>
        <Link to="/legal/$slug" params={{ slug: "shipping-returns" }} className="hover:text-foreground underline">
          Shipping & Returns
        </Link>
        <span>•</span>
        <Link to="/legal/$slug" params={{ slug: "size-guide" }} className="hover:text-foreground underline">
          Size Guide
        </Link>
      </div>
    </div>
  );
}
