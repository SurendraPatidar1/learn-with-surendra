import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, FileText, Loader2 } from "lucide-react";

import type { ProductListItem } from "@/types/catalog";
import { formatInr } from "@/lib/format";
import { Cover, Stars } from "./primitives";
import { usePurchase, toggleWishlist } from "@/hooks/use-purchase";
import { Button } from "@/components/ui/button";

export function ProductCard({ p }: { p: ProductListItem }) {
  const { buy, busy } = usePurchase();
  const [saved, setSaved] = useState(false);
  return (
    <article className="card-surface group flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
      <Link to="/notes/$slug" params={{ slug: p.slug }} className="relative block overflow-hidden">
        <Cover
          title={p.title}
          category={p.category?.name}
          pages={p.page_count}
          className="aspect-[16/10] transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute left-3 top-3 flex gap-1.5">
          {p.is_free ? (
            <span className="rounded-full bg-success px-2.5 py-0.5 text-[11px] font-semibold text-success-foreground">Free</span>
          ) : null}
          {p.is_bestseller ? (
            <span className="rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold text-primary-foreground">Bestseller</span>
          ) : null}
        </div>
      </Link>
      <button
        type="button"
        aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
        onClick={async () => setSaved(await toggleWishlist(p.id, saved))}
        className="absolute hidden"
      />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between">
          <span className="label-mono uppercase">{p.category?.name ?? "Notes"}</span>
          <button
            type="button"
            aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
            onClick={async () => setSaved(await toggleWishlist(p.id, saved))}
            className="rounded-full p-1.5 text-muted-foreground transition hover:bg-accent hover:text-primary active:scale-90"
          >
            <Heart className={saved ? "h-4 w-4 fill-primary text-primary" : "h-4 w-4"} />
          </button>
        </div>
        <Link to="/notes/$slug" params={{ slug: p.slug }}>
          <h3 className="mt-1 text-lg font-semibold leading-snug transition-colors group-hover:text-primary">{p.title}</h3>
        </Link>
        <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{p.short_description}</p>
        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Stars value={p.rating} size={12} /> {p.rating.toFixed(1)} ({p.review_count})
          </span>
          {p.page_count ? (
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" /> {p.page_count} pages
            </span>
          ) : null}
        </div>
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            {p.is_free ? (
              <span className="font-display text-2xl font-bold">Free</span>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="font-display text-2xl font-bold">{formatInr(p.price)}</span>
                {p.compare_at_price ? (
                  <span className="text-sm text-muted-foreground line-through">{formatInr(p.compare_at_price)}</span>
                ) : null}
              </div>
            )}
            {!p.is_free && p.discount_percentage > 0 ? (
              <span className="text-xs font-medium text-success">{p.discount_percentage}% off</span>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/notes/$slug" params={{ slug: p.slug }}>Details</Link>
            </Button>
            <Button size="sm" disabled={busy} onClick={() => buy(p.id, p.slug)} className="active:scale-95">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : p.is_free ? "Get" : "Buy"}
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="card-surface overflow-hidden">
      <div className="aspect-[16/10] animate-pulse bg-muted" />
      <div className="space-y-3 p-5">
        <div className="h-3 w-20 animate-pulse rounded bg-muted" />
        <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-8 w-1/2 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
