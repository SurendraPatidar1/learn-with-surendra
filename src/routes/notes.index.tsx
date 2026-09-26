import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { SlidersHorizontal } from "lucide-react";

import { listCategories, listProducts } from "@/lib/catalog.functions";
import { ProductCard, ProductCardSkeleton } from "@/components/site/ProductCard";
import { EmptyState, PageHero } from "@/components/site/primitives";
import { Button } from "@/components/ui/button";

const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  sort: z.enum(["popular", "newest", "price-asc", "price-desc", "rating"]).optional(),
  maxPrice: z.coerce.number().optional(),
  minRating: z.coerce.number().optional(),
  free: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).optional(),
});

export type NotesSearch = z.infer<typeof searchSchema>;

export const Route = createFileRoute("/notes/")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "All Notes — Learn With Surendra" },
      { name: "description", content: "Browse premium and free CS notes: Java, DSA, SQL, DBMS, OS, Networks, Spring Boot, Microservices and System Design." },
      { property: "og:title", content: "All Notes — Learn With Surendra" },
      { property: "og:description", content: "Search, filter and sort every premium and free study resource." },
    ],
  }),
  component: NotesPage,
});

export function Marketplace({ search, basePath, lockedCategory }: { search: NotesSearch; basePath: "/notes" | "/search"; lockedCategory?: string }) {
  const navigate = useNavigate();
  const set = (patch: Partial<NotesSearch>) =>
    navigate({ to: basePath, search: (s: NotesSearch) => ({ ...s, page: undefined, ...patch }) as never });
  const category = lockedCategory ?? search.category;
  const page = search.page ?? 1;
  const { data: cats } = useQuery({ queryKey: ["categories"], queryFn: () => listCategories() });
  const { data, isFetching, isError, refetch } = useQuery(
    queryOptions({
      queryKey: ["products", search, category],
      queryFn: () =>
        listProducts({
          data: {
            search: search.q,
            category,
            sort: search.sort ?? "popular",
            maxPrice: search.maxPrice,
            minRating: search.minRating,
            freeOnly: search.free,
            page,
            pageSize: 9,
          },
        }),
      placeholderData: keepPreviousData,
    }),
  );
  const pages = data ? Math.max(1, Math.ceil(data.total / 9)) : 1;
  const select = "h-10 rounded-lg border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="card-surface mb-8 flex flex-wrap items-center gap-3 p-3">
        <SlidersHorizontal className="ml-1 h-4 w-4 text-muted-foreground" />
        <input
          defaultValue={search.q}
          placeholder="Search title or topic…"
          aria-label="Search"
          onKeyDown={(e) => e.key === "Enter" && set({ q: (e.target as HTMLInputElement).value || undefined })}
          className={`${select} min-w-0 flex-1 basis-48`}
        />
        {!lockedCategory ? (
          <select aria-label="Category" value={search.category ?? ""} onChange={(e) => set({ category: e.target.value || undefined })} className={select}>
            <option value="">All categories</option>
            {cats?.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
          </select>
        ) : null}
        <select aria-label="Max price" value={search.maxPrice ?? ""} onChange={(e) => set({ maxPrice: e.target.value ? Number(e.target.value) : undefined })} className={select}>
          <option value="">Any price</option>
          <option value="0">Free</option>
          <option value="79">Under ₹79</option>
          <option value="149">Under ₹149</option>
          <option value="199">Under ₹199</option>
        </select>
        <select aria-label="Minimum rating" value={search.minRating ?? ""} onChange={(e) => set({ minRating: e.target.value ? Number(e.target.value) : undefined })} className={select}>
          <option value="">Any rating</option>
          <option value="4">4★ & up</option>
          <option value="4.5">4.5★ & up</option>
        </select>
        <select aria-label="Sort" value={search.sort ?? "popular"} onChange={(e) => set({ sort: e.target.value as NotesSearch["sort"] })} className={select}>
          <option value="popular">Most popular</option>
          <option value="newest">Newest</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="rating">Top rated</option>
        </select>
        <label className="flex items-center gap-2 px-2 text-sm">
          <input type="checkbox" checked={!!search.free} onChange={(e) => set({ free: e.target.checked || undefined })} className="accent-[var(--primary)]" />
          Free only
        </label>
      </div>

      <p className="label-mono mb-4">{data ? `${data.total} RESULT${data.total === 1 ? "" : "S"}` : "LOADING…"}</p>

      {isError ? (
        <EmptyState title="Couldn't load notes" body="Check your connection and try again." action={<Button onClick={() => refetch()}>Retry</Button>} />
      ) : !data ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : data.items.length === 0 ? (
        <EmptyState
          title="No notes match those filters"
          body="Try a broader search or clear a filter — Java, DSA and SQL are great places to start."
          action={<Button variant="outline" onClick={() => navigate({ to: basePath, search: {} as never })}>Clear filters</Button>}
        />
      ) : (
        <div className={`grid gap-6 transition-opacity sm:grid-cols-2 lg:grid-cols-3 ${isFetching ? "opacity-60" : ""}`}>
          {data.items.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}

      {pages > 1 ? (
        <div className="mt-10 flex items-center justify-center gap-2">
          <Button variant="outline" disabled={page <= 1} onClick={() => navigate({ to: basePath, search: (s: NotesSearch) => ({ ...s, page: page - 1 }) as never })}>Previous</Button>
          <span className="font-mono text-sm text-muted-foreground">{page} / {pages}</span>
          <Button variant="outline" disabled={page >= pages} onClick={() => navigate({ to: basePath, search: (s: NotesSearch) => ({ ...s, page: page + 1 }) as never })}>Next</Button>
        </div>
      ) : null}
    </div>
  );
}

function NotesPage() {
  const search = Route.useSearch();
  return (
    <>
      <PageHero eyebrow="Marketplace" title="Every note, one shelf." body="Premium and free study material for CS students, interview prep and working developers." />
      <Marketplace search={search} basePath="/notes" />
    </>
  );
}
