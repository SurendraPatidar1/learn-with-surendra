import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, X, Moon, Sun, Monitor, Search, LogOut, LayoutDashboard } from "lucide-react";

import { useTheme } from "@/lib/theme";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const NAV = [
  { to: "/notes", label: "Notes" },
  { to: "/categories", label: "Categories" },
  { to: "/about", label: "About" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact" },
] as const;

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink font-mono text-sm font-bold text-ink-foreground">
        S<span className="text-primary">.</span>
      </span>
      <span className="font-display text-[15px] font-semibold leading-none">
        Learn With Surendra
      </span>
    </Link>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const order = ["light", "dark", "system"] as const;
  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;
  return (
    <button
      type="button"
      aria-label={`Theme: ${theme}. Click to change.`}
      title={`Theme: ${theme}`}
      onClick={() => setTheme(order[(order.indexOf(theme) + 1) % 3])}
      className="grid h-9 w-9 place-items-center rounded-full border transition hover:bg-accent active:scale-90"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [q, setQ] = useState("");
  const { user } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    setOpen(false);
    navigate({ to: "/search", search: { q: q.trim() } });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast("Signed out");
    navigate({ to: "/" });
  };

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-all ${scrolled ? "bg-background/85 backdrop-blur-md" : "border-transparent bg-background"}`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground"
              activeProps={{ className: "!text-foreground font-medium" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <form onSubmit={submit} className="ml-auto hidden lg:block">
          <label className="flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 focus-within:ring-2 focus-within:ring-ring">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search notes…"
              aria-label="Search notes"
              className="w-40 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>
        </form>
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <ThemeToggle />
          {user ? (
            <>
              <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex">
                <Link to="/dashboard">
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Link>
              </Button>
              <button aria-label="Sign out" onClick={signOut} className="hidden h-9 w-9 place-items-center rounded-full border hover:bg-accent sm:grid">
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hidden px-2 text-sm font-medium sm:block">Sign in</Link>
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link to="/signup">Get started</Link>
              </Button>
            </>
          )}
          <button
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen(!open)}
            className="grid h-9 w-9 place-items-center rounded-full border md:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div className={`grid overflow-hidden transition-all duration-300 md:hidden ${open ? "grid-rows-[1fr] border-t" : "grid-rows-[0fr]"}`}>
        <div className="min-h-0">
          <div className="space-y-1 bg-background px-4 py-4">
            <form onSubmit={submit} className="mb-3">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search notes…"
                aria-label="Search notes"
                className="w-full rounded-lg border bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </form>
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2.5 font-medium hover:bg-accent">
                {n.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-3">
              {user ? (
                <>
                  <Button asChild className="flex-1"><Link to="/dashboard" onClick={() => setOpen(false)}>Dashboard</Link></Button>
                  <Button variant="outline" onClick={signOut}>Sign out</Button>
                </>
              ) : (
                <>
                  <Button asChild variant="outline" className="flex-1"><Link to="/login" onClick={() => setOpen(false)}>Sign in</Link></Button>
                  <Button asChild className="flex-1"><Link to="/signup" onClick={() => setOpen(false)}>Get started</Link></Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  const cols = [
    { h: "Quick Links", l: [["/", "Home"], ["/notes", "All notes"], ["/search", "Search"], ["/dashboard", "Dashboard"]] },
    { h: "Categories", l: [["/category/java", "Java"], ["/category/dsa", "DSA"], ["/category/database", "Database"], ["/category/interview-prep", "Interview Prep"]] },
    { h: "Support", l: [["/about", "About"], ["/contact", "Contact"], ["/faq", "FAQ"]] },
    { h: "Legal", l: [["/terms", "Terms"], ["/privacy", "Privacy"], ["/refund", "Refund policy"]] },
  ] as const;
  return (
    <footer className="mt-24 border-t bg-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-6">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">Learn smarter. Build stronger. Grow faster. Premium CS notes for students and developers.</p>
          <div className="mt-5 flex gap-3 text-sm text-muted-foreground">
            <a href="https://youtube.com" target="_blank" rel="noreferrer" className="hover:text-primary">YouTube</a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-primary">Instagram</a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-primary">LinkedIn</a>
          </div>
        </div>
        {cols.map((c) => (
          <div key={c.h}>
            <p className="label-mono uppercase">{c.h}</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {c.l.map(([to, label]) => (
                <li key={to}>
                  <a href={to} className="text-muted-foreground transition hover:text-foreground">{label}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t">
        <p className="mx-auto max-w-6xl px-4 py-5 font-mono text-xs text-muted-foreground sm:px-6">
          Copyright © {new Date().getFullYear()} Learn With Surendra. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
