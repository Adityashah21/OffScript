import { createFileRoute } from "@tanstack/react-router";
import { CatalogPage } from "@/components/CatalogPage";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/discover")({
  head: () => seo("Discover", "The full OFFSCRIPT edit — every curated piece, filterable by price, size and retailer."),
  component: () => <CatalogPage slug="discover" />,
});
