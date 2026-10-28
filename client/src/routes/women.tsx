import { createFileRoute } from "@tanstack/react-router";
import { CatalogPage } from "@/components/CatalogPage";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/women")({
  head: () => seo("Women", "Knits, slips and shirts for her rotation, curated by OFFSCRIPT."),
  component: () => <CatalogPage slug="women" />,
});
