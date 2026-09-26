import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, ShieldCheck, Zap, Download, Target, Sparkles, GraduationCap, Code2 } from "lucide-react";

import { listHomeSections } from "@/lib/catalog.functions";
import { ProductCard } from "@/components/site/ProductCard";
import { Reveal } from "@/components/site/primitives";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FAQS } from "@/lib/site-content";

const homeQuery = queryOptions({ queryKey: ["home"], queryFn: () => listHomeSections() });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Learn With Surendra — Master Computer Science. Build Your Future." },
      { name: "description", content: "Premium Java, DSA, DBMS, OS, System Design and interview notes for B.Tech, MCA and CS students and developers." },
      { property: "og:title", content: "Learn With Surendra — Premium CS Notes" },
      { property: "og:description", content: "Premium notes, interview preparation and practical learning resources for students and developers." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(homeQuery),
  component: Home,
});

function Section({ eyebrow, title, link, children }: { eyebrow: string; title: string; link?: { to: string; label: string }; children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-24 sm:px-6">
      <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-mono uppercase">{eyebrow}</p>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl">{title}</h2>
        </div>
        {link ? (
          <a href={link.to} className="group flex items-center gap-1 text-sm font-medium">
            {link.label} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </a>
        ) : null}
      </Reveal>
      {children}
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto h-[380px] w-full max-w-md" aria-hidden>
      <div className="card-surface anim-drift absolute left-0 top-6 w-72 overflow-hidden rotate-[-4deg]">
        <div className="flex items-center gap-1.5 border-b px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-gold/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/80" />
          <span className="ml-2 font-mono text-[10px] text-muted-foreground">HashMap.java</span>
        </div>
        <pre className="p-4 font-mono text-[11px] leading-5 text-muted-foreground">
{`int hash(Object key) {
  int h = key.hashCode();
  `}<span className="text-primary">{`return h ^ (h >>> 16);`}</span>{`
}
// O(1) average lookup`}
        </pre>
      </div>
      <div className="card-surface anim-drift absolute right-0 top-32 w-64 rotate-[3deg] p-5" style={{ animationDelay: "1.5s" }}>
        <p className="label-mono">CHAPTER 07 · DSA</p>
        <p className="mt-2 font-display text-lg font-semibold">Graphs & BFS</p>
        <div className="mt-3 space-y-1.5">
          {[90, 75, 82, 60].map((w, i) => (
            <div key={i} className="h-1.5 rounded bg-muted" style={{ width: `${w}%` }} />
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="font-mono text-[10px] text-muted-foreground">p. 142 / 310</span>
          <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">Highlighted</span>
        </div>
      </div>
      <div className="card-surface anim-drift absolute bottom-0 left-10 flex items-center gap-3 px-4 py-3" style={{ animationDelay: "3s" }}>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-success/15 text-success"><Download className="h-4 w-4" /></span>
        <div>
          <p className="text-sm font-semibold">Instant access</p>
          <p className="font-mono text-[10px] text-muted-foreground">Secure download ready</p>
        </div>
      </div>
    </div>
  );
}

function Home() {
  const { data } = useSuspenseQuery(homeQuery);
  const why = [
    { i: Target, t: "Exam & interview focused", b: "Every page is written around what actually gets asked — no filler chapters." },
    { i: Code2, t: "Code you can run", b: "Real Java examples, dry-runs and complexity notes beside each concept." },
    { i: Zap, t: "Instant access", b: "Pay once, download immediately and keep it in your library forever." },
    { i: ShieldCheck, t: "Secure payments", b: "Razorpay checkout with server-verified payments. UPI, cards, netbanking." },
  ];
  const testimonials = [
    { n: "Aditi R.", r: "B.Tech CSE, Pune", q: "The Java 8 interview notes were exactly what I revised the night before my TCS Digital round. Cleared it." },
    { n: "Karthik M.", r: "MCA, Bengaluru", q: "DSA in Java finally made recursion and DP click for me. The dry-run tables are gold." },
    { n: "Rahul S.", r: "Backend Developer", q: "Spring Boot + Microservices notes are practical, not theory dumps. Helped me switch roles." },
  ];
  return (
    <div>
      <section className="relative overflow-hidden border-b">
        <div className="blueprint-grid absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="anim-rise inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 font-mono text-[11px] text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" /> Learn smarter. Build stronger. Grow faster.
            </p>
            <h1 className="anim-rise mt-6 text-5xl font-bold leading-[1.02] sm:text-6xl lg:text-7xl" style={{ animationDelay: "80ms" }}>
              Master Computer Science. <span className="text-primary">Build Your Future.</span>
            </h1>
            <p className="anim-rise mt-6 max-w-xl text-lg text-muted-foreground" style={{ animationDelay: "160ms" }}>
              Premium notes, interview preparation and practical learning resources designed for students and developers.
            </p>
            <div className="anim-rise mt-8 flex flex-wrap gap-3" style={{ animationDelay: "240ms" }}>
              <Button asChild size="lg" className="group h-12 px-6 active:scale-95">
                <Link to="/notes">Explore Notes <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-6">
                <Link to="/notes" search={{ free: true }}>Free Resources</Link>
              </Button>
            </div>
            <dl className="anim-rise mt-10 flex gap-8" style={{ animationDelay: "320ms" }}>
              {[["12+", "Premium notes"], ["6", "Subjects"], ["4.8★", "Avg rating"]].map(([v, l]) => (
                <div key={l}>
                  <dt className="font-display text-2xl font-bold">{v}</dt>
                  <dd className="label-mono">{l}</dd>
                </div>
              ))}
            </dl>
          </div>
          <HeroVisual />
        </div>
      </section>

      <Section eyebrow="01 · Handpicked" title="Featured notes" link={{ to: "/notes", label: "Browse all" }}>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.featured.slice(0, 6).map((p, i) => (
            <Reveal key={p.id} delay={i * 60}><ProductCard p={p} /></Reveal>
          ))}
        </div>
      </Section>

      <Section eyebrow="02 · Subjects" title="Popular categories" link={{ to: "/categories", label: "All categories" }}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.categories.map((c, i) => (
            <Reveal key={c.id} delay={i * 50}>
              <Link to="/category/$slug" params={{ slug: c.slug }} className="card-surface group flex items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:border-primary/40">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-accent font-mono text-sm font-bold text-accent-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1">
                  <p className="font-display font-semibold">{c.name}</p>
                  <p className="text-sm text-muted-foreground">{c.productCount} resources</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
              </Link>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section eyebrow="03 · The difference" title="Why Learn With Surendra?">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {why.map(({ i: Icon, t, b }, idx) => (
            <Reveal key={t} delay={idx * 60} className="card-surface p-6">
              <Icon className="h-6 w-6 text-primary" />
              <h3 className="mt-4 font-semibold">{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{b}</p>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section eyebrow="04 · Most loved" title="Best sellers">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.bestsellers.slice(0, 3).map((p, i) => (
            <Reveal key={p.id} delay={i * 60}><ProductCard p={p} /></Reveal>
          ))}
        </div>
      </Section>

      <Section eyebrow="05 · On the house" title="Free resources" link={{ to: "/notes?free=true", label: "See all free" }}>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.free.slice(0, 3).map((p, i) => (
            <Reveal key={p.id} delay={i * 60}><ProductCard p={p} /></Reveal>
          ))}
        </div>
      </Section>

      <section className="mx-auto mt-24 max-w-6xl px-4 sm:px-6">
        <Reveal className="grid gap-8 overflow-hidden rounded-3xl bg-ink p-8 text-ink-foreground md:grid-cols-2 md:p-12">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest opacity-60">06 · Student benefits</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Built for the way students actually study.</h2>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {[[BookOpen, "Lifetime access to purchases"], [Download, "Unlimited re-downloads"], [GraduationCap, "Student-friendly pricing"], [Sparkles, "Free updates to editions"]].map(([Icon, t]) => {
              const I = Icon as typeof BookOpen;
              return (
                <li key={t as string} className="flex items-start gap-3">
                  <I className="mt-0.5 h-5 w-5 text-primary" />
                  <span className="text-sm opacity-90">{t as string}</span>
                </li>
              );
            })}
          </ul>
        </Reveal>
      </section>

      <Section eyebrow="07 · Students say" title="Trusted by learners across India">
        <div className="grid gap-4 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.n} delay={i * 60} className="card-surface p-6">
              <p className="leading-7">“{t.q}”</p>
              <p className="mt-5 font-semibold">{t.n}</p>
              <p className="label-mono">{t.r}</p>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section eyebrow="08 · Questions" title="Frequently asked">
        <Accordion type="single" collapsible className="card-surface px-6">
          {FAQS.slice(0, 5).map((f) => (
            <AccordionItem key={f.q} value={f.q}>
              <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Section>

      <section className="mx-auto mt-24 max-w-6xl px-4 sm:px-6">
        <Reveal className="relative overflow-hidden rounded-3xl border bg-primary-soft p-10 text-center md:p-16">
          <div className="blueprint-grid absolute inset-0 opacity-50" />
          <div className="relative">
            <h2 className="text-3xl font-bold sm:text-4xl">Your next offer starts with one good set of notes.</h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">Start free, upgrade when you're ready. Instant access after purchase.</p>
            <Button asChild size="lg" className="mt-8 h-12 px-8"><Link to="/notes">Explore Notes</Link></Button>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
