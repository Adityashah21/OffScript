import { createFileRoute } from "@tanstack/react-router";
import { CatalogPage } from "@/components/CatalogPage";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/accessories")({
  head: () => seo("Accessories", "Bags, rings and frames — the small things that finish the fit."),
  component: () => <CatalogPage slug="accessories" />,
});
