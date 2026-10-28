import { createFileRoute } from "@tanstack/react-router";
import { CatalogPage } from "@/components/CatalogPage";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/under-999")({
  head: () => seo("Under ₹999", "Everyday pieces under ₹999 that do more than their price."),
  component: () => <CatalogPage slug="under-999" />,
});
