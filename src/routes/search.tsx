import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { PageHero } from "@/components/site/primitives";
import { Marketplace } from "./notes.index";

export const Route = createFileRoute("/search")({
  validateSearch: z.object({
    q: z.string().optional(),
    category: z.string().optional(),
    sort: z.enum(["popular", "newest", "price-asc", "price-desc", "rating"]).optional(),
    maxPrice: z.coerce.number().optional(),
    minRating: z.coerce.number().optional(),
    free: z.coerce.boolean().optional(),
    page: z.coerce.number().int().min(1).optional(),
  }),
  head: () => ({
    meta: [
      { title: "Search Notes — Learn With Surendra" },
      { name: "description", content: "Search premium CS notes by title, topic and category." },
      { property: "og:title", content: "Search Notes — Learn With Surendra" },
      { property: "og:description", content: "Find the exact notes you need for exams and interviews." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const search = Route.useSearch();
  return (
    <>
      <PageHero eyebrow="Search" title={search.q ? `Results for “${search.q}”` : "Search all notes"} />
      <Marketplace search={search} basePath="/search" />
    </>
  );
}
