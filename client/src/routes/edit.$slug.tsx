import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import { CatalogPage } from "@/components/CatalogPage";
import { CollectionCard } from "@/components/Editorial";
import { getCollection, getEdit, productsIn } from "@/data/collections";
import { captureAttribution } from "@/lib/store";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/edit/$slug")({
  validateSearch: (s: Record<string, unknown>) => s,
  loader: ({ params }) => {
    const e = getEdit(params.slug);
    if (!e) throw notFound();
    return { title: e.headline.join(" "), intro: e.intro };
  },
  head: ({ loaderData }) =>
    loaderData ? seo(loaderData.title, loaderData.intro) : { meta: [{ title: "Edit not found — OFFSCRIPT" }, { name: "robots", content: "noindex" }] },
  component: EditPage,
});

function EditPage() {
  const { slug } = Route.useParams();
  const search = Route.useSearch();
  const e = getEdit(slug)!;
  const count = productsIn(e.collection).length;

  useEffect(() => {
    captureAttribution(search, `/edit/${slug}`);
  }, [search, slug]);

  const hero = (
    <section className="grid md:grid-cols-2">
      <div className="flex flex-col justify-end bg-foreground px-5 py-12 text-background md:px-10 md:py-20">
        <p className="eyebrow opacity-70">The OFFSCRIPT edit · {count} pieces</p>
        <h1 className="display-xl mt-4 uppercase">
          {e.headline.map((l) => (
            <span key={l} className="block">{l}</span>
          ))}
        </h1>
        <p className="mt-6 max-w-md opacity-80">{e.intro}</p>
      </div>
      <div className="grain relative aspect-[4/5] md:aspect-auto">
        <img src={e.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
      </div>
    </section>
  );

  return (
    <>
      <CatalogPage slug={e.collection} hero={hero} />
      <section className="mx-auto max-w-[1600px] px-5 pt-20 md:px-10">
        <p className="eyebrow mb-6">Related edits</p>
        <div className="grid gap-4 md:grid-cols-3">
          {e.related.map((r) => {
            const c = getCollection(r);
            return c ? <CollectionCard key={r} c={c} count={productsIn(r).length} className="aspect-[4/3]" /> : null;
          })}
        </div>
        <Link to="/collections/$slug" params={{ slug: "discover" }} className="btn-outline mt-10">Return to discovery</Link>
      </section>
    </>
  );
}
