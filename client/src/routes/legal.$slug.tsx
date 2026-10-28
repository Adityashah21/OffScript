import { createFileRoute, notFound } from "@tanstack/react-router";
import { seo } from "@/lib/seo";

const PAGES: Record<string, { title: string; body: string[] }> = {
  privacy: {
    title: "Privacy Policy",
    body: [
      "Placeholder policy — replace with a reviewed version before launch.",
      "This demo stores your wishlist and recent searches only in your browser. Campaign tags (like utm_source) from social links are kept in this browser session only.",
      "Forms on this demo (newsletter, contact, COD requests) are not sent anywhere. When connected to a real backend, we'll only use your details to respond to or fulfil your request.",
    ],
  },
  terms: {
    title: "Terms and Conditions",
    body: ["Placeholder terms — replace before launch.", "Product information and prices are provided for discovery and may change on the retailer's site. The retailer's terms apply to purchases made there."],
  },
  "affiliate-disclosure": {
    title: "Affiliate Disclosure",
    body: [
      "Some product links may be affiliate links. We may earn a commission when you make a qualifying purchase, at no additional cost to you.",
      "Commissions never decide what we feature. Pieces marked \"Cash on delivery\" are not affiliate links — they're fulfilled through an authorised arrangement.",
    ],
  },
  "shipping-returns": {
    title: "Shipping and Returns",
    body: [
      "Retailer purchases: shipping, delivery times and returns are handled by the retailer under their own policy.",
      "COD requests: shipping charges are shown before you submit. Delivery and return terms will be published here once a fulfilment partner is live. We don't make promises we can't confirm.",
    ],
  },
  "size-guide": {
    title: "Size Guide",
    body: [
      "Illustrative guide for demo products. Always check the retailer's own size chart.",
      "Tops (chest, inches): XS 34 · S 36 · M 38–40 · L 42 · XL 44. Oversized tees run roomy — size down for a closer fit.",
      "Bottoms use waist size in inches (28–36). Footwear uses UK sizes.",
    ],
  },
};

export const Route = createFileRoute("/legal/$slug")({
  loader: ({ params }) => {
    const p = PAGES[params.slug];
    if (!p) throw notFound();
    return { title: p.title };
  },
  head: ({ loaderData }) => (loaderData ? seo(loaderData.title, `${loaderData.title} for OFFSCRIPT.`) : { meta: [{ title: "Not found — OFFSCRIPT" }, { name: "robots", content: "noindex" }] }),
  component: Legal,
});

function Legal() {
  const { slug } = Route.useParams();
  const p = PAGES[slug]!;
  return (
    <div className="mx-auto max-w-3xl px-5 pt-12 md:px-10">
      <p className="eyebrow text-accent">Information</p>
      <h1 className="display-lg mt-4">{p.title}</h1>
      <div className="mt-10 space-y-5 border-t border-foreground pt-8 leading-relaxed">
        {p.body.map((b) => <p key={b}>{b}</p>)}
      </div>
    </div>
  );
}
