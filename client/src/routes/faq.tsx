import { createFileRoute, Link } from "@tanstack/react-router";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/faq")({
  head: () => seo("FAQ & how it works", "How OFFSCRIPT works: retailer links, affiliate commissions and cash-on-delivery order requests."),
  component: Faq,
});

const FAQS = [
  ["How does the platform work?", "We find and curate fashion pieces from different retailers and organise them into edits and collections. You browse here, then buy either on the retailer's site or — for a few marked pieces — through a cash-on-delivery request."],
  ["Are products sold directly by this website?", "Mostly no. Most pieces are sold by external retailers. Only pieces marked \"Cash on delivery\" are fulfilled through an authorised arrangement with OFFSCRIPT."],
  ["What happens when I click a retailer link?", "The retailer's product page opens in a new tab. From there, the retailer handles price, stock, payment, shipping and returns."],
  ["How do affiliate links work?", "Some links may be affiliate links. If you buy after clicking, we may earn a small commission at no extra cost to you."],
  ["How do COD order requests work?", "On eligible pieces, you submit your contact and delivery details. You pay the amount shown when the order arrives. In this demo, requests are not sent to any supplier."],
  ["Who handles shipping and delivery?", "For retailer purchases: the retailer. For COD pieces: OFFSCRIPT's fulfilment partner (once live). We won't promise delivery times we can't confirm."],
  ["How can I report an incorrect product price?", "Prices change often. Use the contact page with the product name and what you saw — we'll check and update it."],
  ["How can I contact the team?", "Use the contact form or message our social profile."],
];

function Faq() {
  return (
    <div className="mx-auto max-w-4xl px-5 pt-12 md:px-10">
      <p className="eyebrow text-accent">Help</p>
      <h1 className="display-xl mt-4 uppercase">How it<br />works.</h1>
      <div className="mt-14 divide-y border-y">
        {FAQS.map(([q, a]) => (
          <details key={q} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-display text-2xl">
              {q}
              <span className="text-xl transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">{a}</p>
          </details>
        ))}
      </div>
      <Link to="/contact" className="btn-ink mt-12">Still stuck? Contact us</Link>
    </div>
  );
}
