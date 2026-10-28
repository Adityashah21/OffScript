import { createFileRoute } from "@tanstack/react-router";
import { CatalogPage } from "@/components/CatalogPage";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/men")({
  head: () => seo("Men", "Overshirts, cargos and heavyweight tees for his rotation."),
  component: () => <CatalogPage slug="men" />,
});
