import { createFileRoute, notFound } from "@tanstack/react-router";
import { z } from "zod";

import { listCategories } from "@/lib/catalog.functions";
import { PageHero } from "@/components/site/primitives";
import { Marketplace } from "./notes.index";

export const Route = createFileRoute("/category/$slug")({
  validateSearch: z.object({
    sort: z.enum(["popular", "newest", "price-asc", "price-desc", "rating"]).optional(),
    maxPrice: z.coerce.number().optional(),
    minRating: z.coerce.number().optional(),
    free: z.coerce.boolean().optional(),
    page: z.coerce.number().int().min(1).optional(),
  }),
  loader: async ({ params }) => {
    const cats = await listCategories();
    const cat = cats.find((c) => c.slug === params.slug);
    if (!cat) throw notFound();
    return { cat };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.cat.name ?? "Category";
    const d = `${name} notes and study material — Learn With Surendra.`;
    return {
      meta: [
        { title: `${name} Notes — Learn With Surendra` },
        { name: "description", content: d },
        { property: "og:title", content: `${name} Notes — Learn With Surendra` },
        { property: "og:description", content: d },
      ],
    };
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { cat } = Route.useLoaderData();
  const search = Route.useSearch();
  return (
    <>
      <PageHero eyebrow="Category" title={`${cat.name} notes`} body={cat.description ?? undefined} />
      <Marketplace search={search} basePath="/notes" lockedCategory={cat.slug} />
    </>
  );
}
