import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";

import { listHomeSections } from "@/lib/catalog.functions";
import { PageHero, Reveal } from "@/components/site/primitives";

const q = queryOptions({ queryKey: ["home"], queryFn: () => listHomeSections() });

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Categories — Learn With Surendra" },
      { name: "description", content: "Java, DSA, Database, Core CS, Backend and Interview Prep notes organised by subject." },
      { property: "og:title", content: "Categories — Learn With Surendra" },
      { property: "og:description", content: "Browse notes by subject." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(q),
  component: Categories,
});

function Categories() {
  const { data } = useSuspenseQuery(q);
  return (
    <>
      <PageHero eyebrow="Subjects" title="Pick a subject. Go deep." />
      <div className="mx-auto grid max-w-6xl gap-5 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
        {data.categories.map((c, i) => (
          <Reveal key={c.id} delay={i * 50}>
            <Link to="/category/$slug" params={{ slug: c.slug }} className="card-surface group block h-full p-7 transition hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
              <span className="font-mono text-xs text-primary">{String(i + 1).padStart(2, "0")}</span>
              <h2 className="mt-3 text-2xl font-semibold">{c.name}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>
              <p className="mt-6 flex items-center gap-1 text-sm font-medium">
                {c.productCount} resources <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </p>
            </Link>
          </Reveal>
        ))}
      </div>
    </>
  );
}
