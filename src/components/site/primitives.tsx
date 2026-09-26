import { useEffect, useRef, useState, type ReactNode } from "react";
import { Star, SearchX } from "lucide-react";
import { cn } from "@/lib/utils";

/** Fade-up on scroll. Pure CSS animation triggered by IntersectionObserver. */
export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -60px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={cn(shown ? "anim-rise" : "opacity-0", className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={i <= Math.round(value) ? "fill-gold text-gold" : "text-border"}
        />
      ))}
    </span>
  );
}

const HUES = [34, 250, 160, 80, 300, 200];
/** Generated notebook-cover thumbnail — no image hosting required. */
export function Cover({ title, category, pages, className }: { title: string; category?: string | null; pages?: number | null; className?: string }) {
  const hue = HUES[(title.length + (category?.length ?? 0)) % HUES.length];
  return (
    <div
      className={cn("relative overflow-hidden bg-ink text-ink-foreground", className)}
      style={{ backgroundImage: `radial-gradient(120% 80% at 100% 0%, oklch(0.62 0.17 ${hue} / 0.55), transparent 60%)` }}
    >
      <div className="blueprint-grid absolute inset-0 opacity-[0.12]" />
      <div className="relative flex h-full flex-col justify-between p-5">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] opacity-70">{category ?? "Notes"}</span>
        <div>
          <p className="font-display text-xl font-semibold leading-tight">{title}</p>
          {pages ? <p className="mt-2 font-mono text-[10px] opacity-60">{pages} PAGES · PDF</p> : null}
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="card-surface flex flex-col items-center px-6 py-16 text-center">
      <SearchX className="h-10 w-10 text-muted-foreground" />
      <h3 className="mt-4 text-xl font-semibold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{body}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function PageHero({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
  return (
    <section className="relative border-b">
      <div className="blueprint-grid absolute inset-0 opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
        <p className="label-mono uppercase">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold sm:text-5xl">{title}</h1>
        {body ? <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{body}</p> : null}
      </div>
    </section>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_p]:mt-4 [&_p]:leading-7 [&_p]:text-muted-foreground [&_ul]:mt-4 [&_ul]:space-y-2 [&_ul]:text-muted-foreground">
      {children}
    </div>
  );
}
