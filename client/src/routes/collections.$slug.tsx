import { createFileRoute, notFound } from "@tanstack/react-router";
import { CatalogPage } from "@/components/CatalogPage";
import { getCollection } from "@/data/collections";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/collections/$slug")({
  loader: ({ params }) => {
    const c = getCollection(params.slug);
    if (!c) throw notFound();
    return { title: c.title, description: c.description };
  },
  head: ({ loaderData }) =>
    loaderData ? seo(loaderData.title, loaderData.description) : { meta: [{ title: "Collection not found — OFFSCRIPT" }, { name: "robots", content: "noindex" }] },
  component: CollectionRoute,
});

function CollectionRoute() {
  const { slug } = Route.useParams();
  return <CatalogPage key={slug} slug={slug} />;
}
