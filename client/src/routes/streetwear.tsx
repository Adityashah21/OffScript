import { createFileRoute } from "@tanstack/react-router";
import { CatalogPage } from "@/components/CatalogPage";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/streetwear")({
  head: () => seo("Streetwear", "Relaxed silhouettes, everyday layers, and pieces that do the talking."),
  component: () => <CatalogPage slug="streetwear" />,
});
