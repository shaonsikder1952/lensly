import { createFileRoute } from "@tanstack/react-router";
import glasses3d from "@/assets/glasses-3d.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lensly | One plan. €39/month. New lenses every 6 months." },
      {
        name: "description",
        content:
          "One care plan: new prescription glasses every 6 months + 2 free replacements a year, for €39/month. No retail markup.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero />
      <Plan />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <a href="#" className="flex items-center gap-2">
          <LensMark />
          <span className="font-display text-[15px] font-semibold tracking-tight">
            Lensly
          </span>
        </a>
        <a
          href="https://buy.stripe.com/4gM7sN1k82pL4JX7QO7EQ00"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:opacity-90"
        >
          Start for €39/mo
        </a>
      </div>
    </header>
  );
}

function LensMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
      <circle cx="11" cy="16" r="7" stroke="currentColor" strokeWidth="1.5" className="text-primary" />
      <circle cx="22" cy="16" r="7" stroke="currentColor" strokeWidth="1.5" className="text-primary" />
      <path d="M18 16h-3" stroke="currentColor" strokeWidth="1.5" className="text-primary" />
    </svg>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      {/* Decorative background layers */}
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-50" />
      <div className="pointer-events-none absolute left-1/2 top-[62%] h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 radial-glow" />

      <div className="relative mx-auto max-w-3xl px-6 pt-10 pb-12 text-center md:pt-14 md:pb-16">
        <p className="label-mono animate-fade-in text-[11px] uppercase tracking-[0.2em] text-primary">
          One plan · €39 / month
        </p>
        <h1 className="animate-fade-in mx-auto mt-3 max-w-[18ch] font-display text-[34px] font-semibold leading-[1.05] tracking-tight md:text-[52px]">
          New glasses every{" "}
          <span className="shimmer-text whitespace-nowrap">6 months.</span>
        </h1>

        {/* Floating 3D glasses with tight orbital rings */}
        <div className="relative mx-auto mt-5 flex h-[170px] w-full items-center justify-center md:h-[210px]">
          {/* Orbital rings centered on glasses */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="spin-slow h-[300px] w-[300px] rounded-full border border-primary/15 md:h-[380px] md:w-[380px]" />
          </div>
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div
              className="spin-slow h-[220px] w-[220px] rounded-full border border-dashed border-primary/25 md:h-[280px] md:w-[280px]"
              style={{ animationDirection: "reverse", animationDuration: "60s" }}
            />
          </div>
          {/* Shadow */}
          <div className="absolute bottom-4 left-1/2 h-5 w-44 -translate-x-1/2 rounded-[50%] bg-primary/25 blur-2xl" />
          <img
            src={glasses3d}
            alt="Lensly prescription glasses"
            width={1024}
            height={1024}
            className="float-slow relative h-[150px] w-auto drop-shadow-[0_24px_30px_oklch(0.46_0.07_210/0.3)] md:h-[190px]"
          />
        </div>

        <p className="mx-auto mt-5 max-w-md text-[14px] leading-relaxed text-muted-foreground md:max-w-xl md:text-base">
          A single, honest plan. Up-to-date prescription lenses delivered twice a year,
          plus two free replacements if you break or scratch them.
        </p>
        <div className="mt-5 flex items-center justify-center gap-4">
          <a
            href="#plan"
            className="group inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground shadow-[0_8px_24px_-8px_oklch(0.46_0.07_210/0.6)] transition hover:opacity-90 hover:shadow-[0_12px_32px_-8px_oklch(0.46_0.07_210/0.7)]"
          >
            See the plan
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}

function Plan() {
  return (
    <section id="plan" className="border-b border-border/60 bg-[var(--mint)]/50">
      <div className="mx-auto max-w-5xl px-6 py-14">
        {/* Comparison */}
        <div className="grid gap-px rounded-xl border border-border bg-border md:grid-cols-2">
          {/* Traditional */}
          <div className="rounded-l-xl bg-card p-6 md:p-8">
            <p className="label-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Traditional optician
            </p>
            <div className="mt-4 font-display text-5xl font-semibold tracking-tight text-foreground/40 line-through decoration-[oklch(0.7_0.17_55)] decoration-[3px]">
              €1,200
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Upfront · single pair · no updates</p>
            <ul className="mt-5 space-y-2.5 border-t border-border pt-4 text-sm text-muted-foreground">
              <li>Pay again in 2–3 years</li>
              <li>Replacements cost full price</li>
              <li>Frame &amp; coatings billed separately</li>
              <li>Outdated prescription within 12 months</li>
            </ul>
          </div>

          {/* Lensly */}
          <div className="rounded-r-xl bg-card p-6 md:p-8">
            <span className="mb-3 inline-block rounded-full bg-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-foreground">
              Lensly Care
            </span>
            <p className="label-mono text-[11px] uppercase tracking-[0.18em] text-primary">
              The only plan
            </p>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-display text-6xl font-semibold tracking-tight text-primary">
                €39
              </span>
              <span className="text-lg text-muted-foreground">/ month</span>
            </div>
            <p className="mt-2 text-sm text-foreground/80">
              That's <span className="font-medium text-foreground">€1.28 a day,</span> less than a coffee a week.
            </p>
            <ul className="mt-5 space-y-2.5 border-t border-border pt-4 text-sm">
              <Feature>1 new pair of glasses, every 6 months</Feature>
              <Feature>2 free replacements per year (lost, broken, scratched)</Feature>
              <Feature>Premium lenses · anti-reflective + UV-400 coatings included</Feature>
              <Feature>Free EU shipping · cancel anytime</Feature>
            </ul>
            <a
              href="https://buy.stripe.com/4gM7sN1k82pL4JX7QO7EQ00"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 block w-full rounded-md bg-primary py-3 text-center text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
            >
              Start your plan for €39/month
            </a>
          </div>
        </div>

        {/* The math */}
        <div className="mt-6 grid gap-4 rounded-xl border border-border bg-card p-6 md:grid-cols-3 md:p-8">
          <Math k="€468" l="What you pay per year with Lensly" highlight />
          <Math k="€1,200+" l="What one pair at an optician costs" />
          <Math k="€732" l="Saved in year one, you get 2 fresh pairs" />
        </div>
      </div>
    </section>
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-foreground/90">
      <svg width="16" height="16" viewBox="0 0 16 16" className="mt-0.5 shrink-0 text-primary" fill="none">
        <circle cx="8" cy="8" r="7.25" stroke="currentColor" strokeWidth="1" opacity="0.4" />
        <path d="M5 8.2l2.2 2.1L11 6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>{children}</span>
    </li>
  );
}

function Math({ k, l, highlight = false }: { k: string; l: string; highlight?: boolean }) {
  return (
    <div>
      <div
        className={
          "font-display text-3xl font-semibold tracking-tight md:text-4xl " +
          (highlight ? "text-primary" : "text-foreground")
        }
      >
        {k}
      </div>
      <div className="mt-2 text-[13px] leading-snug text-muted-foreground">{l}</div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="bg-foreground text-background">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-8 label-mono text-[10px] uppercase tracking-[0.18em] text-background/60">
        <div className="flex items-center gap-2 text-background/85">
          <LensMark />
          <span className="font-display text-sm font-semibold">Lensly</span>
        </div>
        <span>© 2026 Lensly · EU</span>
      </div>
    </footer>
  );
}

