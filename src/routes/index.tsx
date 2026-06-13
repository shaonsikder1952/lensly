import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useLanguage } from "../lib/i18n";
import glasses3d from "@/assets/glasses-3d.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lensly | One plan. €29/month. New lenses every year." },
      {
        name: "description",
        content:
          "One care plan: new prescription glasses every year + 3 free replacements a year, for €29/month. No retail markup.",
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

const languages = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
];

export function Nav() {
  const { lang, setLang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const currentLang = languages.find((l) => l.code === lang) || languages[0];

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <LensMark />
          <span className="font-display text-[15px] font-semibold tracking-tight">
            Lensly
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {/* Language Dropdown Selector */}
          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-1.5 rounded-md border border-border/80 bg-background/50 px-2.5 py-1.5 text-xs font-semibold text-foreground/80 transition hover:bg-muted/80 hover:text-foreground"
            >
              <span>{currentLang.flag}</span>
              <span className="uppercase">{currentLang.code}</span>
              <svg
                className={`h-3 w-3 text-muted-foreground transition-transform duration-200 ${
                  open ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {open && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                <div className="absolute right-0 mt-1.5 z-50 w-36 rounded-lg border border-border bg-card/95 p-1.5 shadow-xl backdrop-blur-md animate-in fade-in-50 slide-in-from-top-1 duration-150">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLang(l.code as any);
                        setOpen(false);
                      }}
                      className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-xs font-medium transition-colors hover:bg-muted ${
                        lang === l.code ? "bg-muted text-primary font-semibold" : "text-foreground/90"
                      }`}
                    >
                      <span>{l.flag}</span>
                      <span>{l.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <a
            href="/#plan"
            className="rounded-md bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            {t("nav.start")}
          </a>
        </div>
      </div>
    </header>
  );
}

export function LensMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
      <circle cx="11" cy="16" r="7" stroke="currentColor" strokeWidth="1.5" className="text-primary" />
      <circle cx="22" cy="16" r="7" stroke="currentColor" strokeWidth="1.5" className="text-primary" />
      <path d="M18 16h-3" stroke="currentColor" strokeWidth="1.5" className="text-primary" />
    </svg>
  );
}

function Hero() {
  const { t } = useLanguage();
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      {/* Decorative background layers */}
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-50" />
      <div className="pointer-events-none absolute left-1/2 top-[62%] h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 radial-glow" />

      <div className="relative mx-auto max-w-3xl px-6 pt-10 pb-12 text-center md:pt-14 md:pb-16">
        <p className="label-mono animate-fade-in text-[11px] uppercase tracking-[0.2em] text-primary">
          {t("hero.badge")}
        </p>
        <h1 className="animate-fade-in mx-auto mt-3 max-w-[18ch] font-display text-[34px] font-semibold leading-[1.05] tracking-tight md:text-[52px]">
          {t("hero.titlePart1")}
          <span className="shimmer-text whitespace-nowrap">{t("hero.titlePart2")}</span>
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
          {t("hero.subtitle")}
        </p>
        <div className="mt-5 flex items-center justify-center gap-4">
          <a
            href="/#plan"
            className="group inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground shadow-[0_8px_24px_-8px_oklch(0.46_0.07_210/0.6)] transition hover:opacity-90 hover:shadow-[0_12px_32px_-8px_oklch(0.46_0.07_210/0.7)]"
          >
            {t("hero.cta")}
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </a>
        </div>

        {/* Trust Indicators */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-border/40 pt-6 text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80">
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.969 0 1.371 1.24.588 1.81l-3.97 2.883a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.883a1 1 0 00-1.17 0l-3.97 2.883c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.05 9.43c-.783-.57-.38-1.81.588-1.81h4.907a1 1 0 00.95-.69l1.519-4.674z" />
            </svg>
            <span>{t("trust.lenses")}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14v4m0 0L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span>{t("trust.shipping")}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            <span>{t("trust.checkout")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Plan() {
  const { t } = useLanguage();
  return (
    <section id="plan" className="border-b border-border/60 bg-[var(--mint)]/30">
      <div className="mx-auto max-w-5xl px-6 py-16">
        {/* Comparison Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Traditional Optician Card */}
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm transition hover:shadow-md">
            <p className="label-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              {t("plan.traditional")}
            </p>
            <div className="mt-5 font-display text-5xl font-semibold tracking-tight text-foreground/35 line-through decoration-[oklch(0.7_0.17_55)] decoration-[3px]">
              €400
            </div>
            <p className="mt-2 text-xs font-medium text-muted-foreground/80 uppercase tracking-wider">
              {t("plan.upfront")}
            </p>
            <ul className="mt-6 space-y-3.5 border-t border-border/60 pt-6 text-sm text-muted-foreground">
              <li className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/45" />
                {t("plan.wait")}
              </li>
              <li className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/45" />
                {t("plan.accidental")}
              </li>
              <li className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/45" />
                {t("plan.coatings")}
              </li>
              <li className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/45" />
                {t("plan.outdated")}
              </li>
            </ul>
          </div>

          {/* Lensly Care Card (Featured) */}
          <div className="relative rounded-2xl border-2 border-primary bg-card p-8 shadow-md transition hover:shadow-lg">
            <div className="absolute -top-3 right-8 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-primary-foreground shadow-sm">
              {t("plan.lenslyCare")}
            </div>
            <p className="label-mono text-[11px] uppercase tracking-[0.2em] text-primary">
              The subscription
            </p>
            <div className="mt-5 flex items-baseline gap-2">
              <span className="font-display text-6xl font-semibold tracking-tight text-primary">
                €29
              </span>
              <span className="text-base font-medium text-muted-foreground">/ month</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Continuous vision care · <span className="font-semibold text-foreground">€0.95 a day</span> ({t("plan.dailyCoffee")}).
            </p>
            <ul className="mt-6 space-y-3.5 border-t border-border pt-6 text-sm">
              <Feature>{t("plan.feature1")}</Feature>
              <Feature>{t("plan.feature2")}</Feature>
              <Feature>{t("plan.feature3")}</Feature>
              <Feature>{t("plan.feature4")}</Feature>
            </ul>
            <div className="mt-6 border-t border-border/60 pt-6 text-left">
              <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-foreground">
                {t("plan.whatsNext")}
              </h4>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {t("plan.whatsNextDesc")}
              </p>
            </div>
            
            <a
              href="https://buy.stripe.com/bJe8wRbYMggBa4h0om7EQ01"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 block w-full rounded-lg bg-primary py-3 text-center text-sm font-semibold text-primary-foreground shadow-[0_4px_12px_rgba(0,102,119,0.15)] transition-all hover:bg-primary/95 hover:shadow-[0_4px_20px_rgba(0,102,119,0.25)]"
            >
              {t("plan.subscribeBtn")}
            </a>
            
            <p className="mt-3 text-center text-[10px] text-muted-foreground/80">
              {t("plan.secureStripe")}
            </p>
          </div>
        </div>

        {/* The math */}
        <div className="mt-8 grid gap-6 rounded-2xl border border-border bg-card p-8 md:grid-cols-3">
          <Math k="€1,600" l={t("math.optician")} />
          <Math k="€29/mo" l={t("math.lensly")} highlight />
          <Math k="€1,252" l={t("math.saved")} />
        </div>

        {/* Insurance Comparison */}
        <div className="mt-16 border-t border-border/60 pt-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h3 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
              {t("compare.title")}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("compare.desc")}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Glasses Insurance */}
            <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
              <div className="flex items-center justify-between border-b border-border/60 pb-5">
                <div>
                  <h4 className="font-display text-lg font-semibold text-foreground">{t("compare.insurance")}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{t("compare.insuranceSub")}</p>
                </div>
                <div className="text-right">
                  <span className="font-display text-2xl font-bold text-foreground">€7-20<span className="text-sm font-normal text-muted-foreground">/mo</span></span>
                </div>
              </div>
              
              <ul className="mt-6 space-y-4 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <svg className="w-4 h-4 mt-0.5 shrink-0 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>{t("compare.item1_yes")}</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-4 h-4 mt-0.5 shrink-0 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>{t("compare.item2_no")}</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-4 h-4 mt-0.5 shrink-0 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>{t("compare.item3_no")}</span>
                </li>
              </ul>
            </div>

            {/* Lensly */}
            <div className="relative rounded-2xl border-2 border-primary bg-card p-8 shadow-md">
              <div className="absolute -top-3 right-8 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-primary-foreground shadow-sm">
                Recommended
              </div>
              <div className="flex items-center justify-between border-b border-border/60 pb-5">
                <div>
                  <h4 className="font-display text-lg font-semibold text-primary">{t("plan.lenslyCare")}</h4>
                  <p className="text-xs text-primary/80 mt-1">{t("compare.lenslySub")}</p>
                </div>
                <div className="text-right">
                  <span className="font-display text-2xl font-bold text-primary">€29<span className="text-sm font-normal text-muted-foreground">/mo</span></span>
                </div>
              </div>
              
              <ul className="mt-6 space-y-4 text-sm text-foreground/95">
                <li className="flex items-start gap-3">
                  <svg className="w-4 h-4 mt-0.5 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{t("compare.lensly_item1")}</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-4 h-4 mt-0.5 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{t("compare.lensly_item2")}</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-4 h-4 mt-0.5 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{t("compare.lensly_item3")}</span>
                </li>
              </ul>
            </div>
          </div>
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

function Math({
  k,
  l,
  sub,
  highlight = false,
}: {
  k: string;
  l: string;
  sub?: string;
  highlight?: boolean;
}) {
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
      {sub && <div className="mt-1 text-[11px] text-muted-foreground/75 font-medium">{sub}</div>}
    </div>
  );
}

export function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="bg-foreground text-background">
      <div className="border-b border-background/10 py-5 text-center text-xs text-background/60">
        {t("footer.support")}{" "}
        <a href="mailto:lenslycare@gmail.com" className="text-primary hover:underline font-medium">
          lenslycare@gmail.com
        </a>
      </div>
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-8 label-mono text-[10px] uppercase tracking-[0.18em] text-background/60">
        <Link to="/" className="flex items-center gap-2 text-background/85 hover:opacity-90 transition-opacity">
          <LensMark />
          <span className="font-display text-sm font-semibold">Lensly</span>
        </Link>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <a href="mailto:lenslycare@gmail.com" className="hover:text-background transition-colors lowercase tracking-normal font-sans text-xs mr-2">
            lenslycare@gmail.com
          </a>
          <Link to="/impressum" className="hover:text-background transition-colors">
            Impressum
          </Link>
          <Link to="/datenschutz" className="hover:text-background transition-colors">
            Datenschutz
          </Link>
          <Link to="/agb" className="hover:text-background transition-colors">
            AGB
          </Link>
          <span className="text-background/40">© 2026 Lensly</span>
        </div>
      </div>
    </footer>
  );
}

