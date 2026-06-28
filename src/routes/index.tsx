import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useLanguage, Language } from "../lib/i18n";
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
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState("hero");

  // Contact modal state
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const sections = ["hero", "plan", "faq"];
    const observers = sections.map((id) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(id);
          }
        },
        { threshold: 0.3, rootMargin: "-20% 0px -20% 0px" }
      );
      observer.observe(el);
      return { observer, el };
    });

    return () => {
      observers.forEach((obs) => {
        if (obs) obs.observer.unobserve(obs.el);
      });
    };
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <Nav onContactClick={() => setIsContactOpen(true)} />
      <Hero />
      <Plan />
      <Faq />
      <Footer />

      {/* Contact Modal Panel */}
      {isContactOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/40 backdrop-blur-xs no-print">
          <div className="fixed inset-0" onClick={() => setIsContactOpen(false)} />
          
          <div className="relative w-full max-w-xs rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-center">
            <button
              onClick={() => setIsContactOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Close modal"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-3">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </div>

            <h3 className="font-display font-bold text-base text-foreground mb-1">
              {t("Contact Us")}
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              {t("Have questions? Send us an email directly.")}
            </p>

            <div className="bg-muted/50 rounded-lg p-2.5 mb-4 border border-border/40 font-mono text-[13px] text-foreground font-semibold select-all break-all">
              hello@lensly.care
            </div>

            <div className="flex flex-col gap-2">
              <a
                href="mailto:hello@lensly.care"
                className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold shadow-xs hover:bg-primary/95 transition text-center block cursor-pointer"
              >
                {t("Send Email")}
              </a>
              
              <button
                onClick={() => {
                  navigator.clipboard.writeText("hello@lensly.care");
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="w-full py-2 rounded-lg border border-border bg-background text-foreground text-xs font-semibold hover:bg-muted transition cursor-pointer"
              >
                {copied ? t("Copied!") : t("Copy Email Address")}
              </button>
            </div>
          </div>
        </div>
      )}
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

export function Nav({ onContactClick }: { onContactClick?: () => void }) {
  const { lang, setLang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const currentLang = languages.find((l) => l.code === lang) || languages[0];

  const handleScrollTo = (id: string) => {
    setMenuOpen(false);
    if (window.location.pathname === "/") {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = `/#${id}`;
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <LensMark />
          <span className="font-display text-[15px] font-semibold tracking-tight">Lensly</span>
        </Link>

        <div className="flex items-center gap-2.5">
          {/* Language Dropdown Selector */}
          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              aria-label={t("Select Language")}
              aria-haspopup="listbox"
              aria-expanded={open}
              className="flex items-center gap-1.5 rounded-md border border-border/80 bg-background/50 px-2.5 py-1.5 text-xs font-semibold text-foreground/80 transition hover:bg-muted/80 hover:text-foreground cursor-pointer"
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
                <div
                  role="listbox"
                  className="absolute right-0 mt-1.5 z-50 w-36 rounded-lg border border-border bg-card/95 p-1.5 shadow-xl backdrop-blur-md animate-in fade-in-50 slide-in-from-top-1 duration-150"
                >
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      role="option"
                      aria-selected={lang === l.code}
                      onClick={() => {
                        setLang(l.code as Language);
                        setOpen(false);
                      }}
                      className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-xs font-medium transition-colors hover:bg-muted cursor-pointer ${
                        lang === l.code
                          ? "bg-muted text-primary font-semibold"
                          : "text-foreground/90"
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

          {/* Subscribe CTA Button (Laptop & Mobile) */}
          <Link
            to="/"
            hash="plan"
            onClick={(e) => {
              if (window.location.pathname === "/") {
                e.preventDefault();
                const el = document.getElementById("plan");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }
            }}
            className="rounded-md bg-primary px-3 py-1.5 text-[10.5px] sm:text-xs font-semibold text-primary-foreground shadow-sm transition hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <span className="hidden xs:inline">{t("Subscribe to Lensly Care")}</span>
            <span className="xs:hidden">{t("Subscribe")}</span>
          </Link>

          {/* Hamburger Menu Button (Laptop & Mobile) */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle navigation menu"
              className="flex justify-center items-center w-8.5 h-8.5 rounded-md border border-border/80 bg-background/50 hover:bg-muted transition cursor-pointer text-foreground"
            >
              {menuOpen ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              ) : (
                <svg
                  width="18"
                  height="14"
                  viewBox="0 0 18 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1.5 1.5h15M1.5 7h15M1.5 12.5h15"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 mt-1.5 z-50 w-44 rounded-lg border border-border bg-card/95 p-1.5 shadow-xl backdrop-blur-md animate-in fade-in-50 slide-in-from-top-1 duration-150 flex flex-col gap-0.5">
                  <button
                    onClick={() => handleScrollTo("hero")}
                    className="flex w-full items-center rounded-md px-3 py-2.5 text-left text-xs font-semibold text-foreground/80 hover:bg-muted cursor-pointer transition-colors"
                  >
                    {t("Home")}
                  </button>
                  <button
                    onClick={() => handleScrollTo("plan")}
                    className="flex w-full items-center rounded-md px-3 py-2.5 text-left text-xs font-semibold text-foreground/80 hover:bg-muted cursor-pointer transition-colors"
                  >
                    {t("Pricing")}
                  </button>
                  <button
                    onClick={() => handleScrollTo("faq")}
                    className="flex w-full items-center rounded-md px-3 py-2.5 text-left text-xs font-semibold text-foreground/80 hover:bg-muted cursor-pointer transition-colors"
                  >
                    {t("FAQ")}
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      if (onContactClick) {
                        onContactClick();
                      } else {
                        window.location.href = "mailto:hello@lensly.care";
                      }
                    }}
                    className="flex w-full items-center rounded-md px-3 py-2.5 text-left text-xs font-semibold text-primary hover:bg-muted cursor-pointer transition-colors"
                  >
                    {t("Contact Us")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export function LensMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
      <circle
        cx="11"
        cy="16"
        r="7"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-primary"
      />
      <circle
        cx="22"
        cy="16"
        r="7"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-primary"
      />
      <path d="M18 16h-3" stroke="currentColor" strokeWidth="1.5" className="text-primary" />
    </svg>
  );
}

function Hero() {
  const { t } = useLanguage();
  return (
    <section id="hero" className="relative overflow-hidden border-b border-border/60">
      {/* Decorative background layers */}
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-50" />
      <div className="pointer-events-none absolute left-1/2 top-[62%] h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 radial-glow" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 pt-10 pb-12 text-center md:pt-14 md:pb-16">
        <p className="label-mono animate-fade-in text-[11px] uppercase tracking-[0.2em] text-primary">
          {t("One plan · €29 / month")}
        </p>
        <h1 className="animate-fade-in mx-auto mt-3 max-w-[22ch] font-display text-[34px] font-semibold leading-[1.05] tracking-tight md:text-[52px]">
          {t("Precision vision care, renewed every ")}
          <span className="shimmer-text whitespace-nowrap">{t("year.")}</span>
        </h1>

        {/* Floating 3D glasses with tight orbital rings */}
        <div className="relative mx-auto mt-5 flex h-[170px] w-full items-center justify-center md:h-[210px]">
          {/* Orbital rings centered on glasses */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
            <div className="spin-slow h-[300px] w-[300px] rounded-full border border-primary/5 md:h-[380px] md:w-[380px]" />
          </div>
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
            <div
              className="spin-slow h-[220px] w-[220px] rounded-full border border-dashed border-primary/10 md:h-[280px] md:w-[280px]"
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

        {/* 3 Premium Value Features - Row format on mobile, columns on desktop */}
        <div className="max-w-md md:max-w-4xl mx-auto mt-10 md:mt-14 mb-8 md:mb-14 px-4 text-left">
          <div className="bg-white/80 border border-primary/10 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-5 md:space-y-0 md:p-0 md:bg-transparent md:border-0 md:shadow-none md:grid md:grid-cols-3 md:gap-8">
            {/* Card 1: 1 Free Pair */}
            <div className="flex gap-4 items-start md:flex-col md:gap-0 group pb-5 border-b border-border/50 md:pb-0 md:border-b-0">
              <div className="w-10 h-10 shrink-0 bg-primary/10 border border-primary/20 text-primary rounded-full flex items-center justify-center font-display font-bold text-sm transition-all duration-500 group-hover:bg-gradient-to-br group-hover:from-primary group-hover:to-teal-500 group-hover:text-primary-foreground group-hover:scale-105 shadow-xs shadow-primary/5 md:w-12 md:h-12 md:text-base">
                01
              </div>
              <div className="flex-1 md:mt-5">
                <h3 className="font-display font-semibold text-[15px] sm:text-[17px] text-foreground tracking-tight">
                  {t("1 Free Pair Every Year")}
                </h3>
                <p className="text-[11.5px] text-muted-foreground mt-1 leading-relaxed">
                  {t("Receive a complete new pair of prescription glasses delivered to your door annually.")}
                </p>
              </div>
            </div>

            {/* Card 2: 3 Free Replacements */}
            <div className="flex gap-4 items-start md:flex-col md:gap-0 group relative pb-5 border-b border-border/50 md:pb-0 md:border-b-0">
              <div className="w-10 h-10 shrink-0 bg-primary/10 border-2 border-primary text-primary rounded-full flex items-center justify-center font-display font-bold text-sm transition-all duration-500 group-hover:bg-gradient-to-br group-hover:from-primary group-hover:to-teal-500 group-hover:text-primary-foreground group-hover:scale-105 shadow-xs shadow-primary/5 md:w-12 md:h-12 md:text-base">
                02
              </div>
              <div className="flex-1 md:mt-5">
                <h3 className="font-display font-semibold text-[15px] sm:text-[17px] text-foreground tracking-tight flex items-center gap-2">
                  {t("3 Free Replacements")}
                  <span className="bg-primary/10 text-primary text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full md:hidden">
                    {t("Included")}
                  </span>
                </h3>
                <p className="text-[11.5px] text-muted-foreground mt-1 leading-relaxed">
                  {t("Accident coverage included. We replace broken lenses or update prescription at zero cost.")}
                </p>
              </div>
            </div>

            {/* Card 3: €29 Only */}
            <div className="flex gap-4 items-start md:flex-col md:gap-0 group">
              <div className="w-10 h-10 shrink-0 bg-primary/10 border border-primary/20 text-primary rounded-full flex items-center justify-center font-display font-bold text-sm transition-all duration-500 group-hover:bg-gradient-to-br group-hover:from-primary group-hover:to-teal-500 group-hover:text-primary-foreground group-hover:scale-105 shadow-xs shadow-primary/5 md:w-12 md:h-12 md:text-base">
                03
              </div>
              <div className="flex-1 md:mt-5">
                <h3 className="font-display font-semibold text-[15px] sm:text-[17px] text-foreground tracking-tight">
                  {t("Flat €29 Monthly Only")}
                </h3>
                <p className="text-[11.5px] text-muted-foreground mt-1 leading-relaxed">
                  {t("All-inclusive subscription with zero retail markup or surprise medical billings.")}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-4">
          <a
            href="/#plan"
            className="group inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground shadow-[0_8px_24px_-8px_oklch(0.46_0.07_210/0.6)] transition hover:opacity-90 hover:shadow-[0_12px_32px_-8px_oklch(0.46_0.07_210/0.7)]"
          >
            {t("See the plan")}
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </a>
        </div>

        {/* Trust Indicators */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-border/40 pt-6 text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80">
          <div className="flex items-center gap-2">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="text-primary"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.969 0 1.371 1.24.588 1.81l-3.97 2.883a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.883a1 1 0 00-1.17 0l-3.97 2.883c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.05 9.43c-.783-.57-.38-1.81.588-1.81h4.907a1 1 0 00.95-.69l1.519-4.674z"
              />
            </svg>
            <span>{t("Premium Optical Lenses")}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="text-primary"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14v4m0 0L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <span>{t("Free EU-Wide Shipping")}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="text-primary"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            <span>{t("Secure Stripe Checkout")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}



function Plan() {
  const { t } = useLanguage();
  const [insuranceTab, setInsuranceTab] = useState<"insurance" | "lensly">("lensly");

  return (
    <section id="plan" className="border-b border-border/60 bg-[var(--mint)]/30">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 sm:py-16">
        {/* Comparison Grid */}
        <div className="grid gap-4.5 md:grid-cols-2">
          {/* Traditional Optician Card */}
          <div className="rounded-2xl border border-border bg-card p-4.5 sm:p-7 shadow-xs flex flex-col justify-between">
            <div>
              <p className="label-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {t("Traditional optician")}
              </p>
              <div className="mt-3.5 font-display text-4xl sm:text-5xl font-semibold tracking-tight text-foreground/35 line-through decoration-[oklch(0.7_0.17_55)] decoration-[3px]">
                €400
              </div>
              <p className="mt-1.5 text-[11px] font-medium text-muted-foreground/80 uppercase tracking-wider">
                {t("Upfront · 1 pair · no free replacements")}
              </p>
              <ul className="mt-4 space-y-2.5 border-t border-border/60 pt-4 text-xs sm:text-[13px] text-muted-foreground">
                <li className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/45" />
                  {t("Wait 2–3 years to save up money and buy again")}
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/45" />
                  {t("Accidental replacements cost full retail price")}
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/45" />
                  {t("Coatings & high-index lenses billed as extras")}
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/45" />
                  {t("Outdated prescription within 12 months")}
                </li>
              </ul>
            </div>
          </div>

          {/* Lensly Care Card (Featured) */}
          <div className="relative rounded-2xl border-2 border-primary bg-card p-4.5 sm:p-7 shadow-xs flex flex-col justify-between">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-primary-foreground shadow-sm">
              {t("Lensly Care")}
            </div>
            <div>
              <p className="label-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                {t("The subscription")}
              </p>
              <div className="mt-3.5 flex items-baseline gap-2">
                <span className="font-display text-5xl sm:text-6xl font-semibold tracking-tight text-primary">
                  €29
                </span>
                <span className="text-sm font-medium text-muted-foreground">{t("/ month")}</span>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {t("Continuous vision care")} ·{" "}
                <span className="font-semibold text-foreground">{t("€0.95 a day")}</span> (
                {t("less than a daily coffee")}).
              </p>
              <ul className="mt-4 space-y-2.5 border-t border-border pt-4 text-xs sm:text-[13px]">
                <Feature>{t("1 new pair of precision lenses every year")}</Feature>
                <Feature>
                  {t("3 free replacements (broken, power change? We got you covered)")}
                </Feature>
                <Feature>{t("Premium lenses, anti-reflective & UV-400 coatings included")}</Feature>
                <Feature>{t("Free shipping EU-wide · minimum 1 year contract")}</Feature>
              </ul>
            </div>
            <div className="mt-4.5 pt-4 border-t border-border/60">
              <Link
                to="/checkout"
                className="block w-full rounded-lg bg-primary py-2.5 text-center text-xs font-semibold text-primary-foreground shadow-[0_4px_12px_-4px_oklch(0.46_0.07_210/0.6)] transition-all hover:bg-primary/95 hover:shadow-[0_6px_16px_-4px_oklch(0.46_0.07_210/0.7)] cursor-pointer"
              >
                {t("Subscribe to Lensly Care")}
              </Link>
              <p className="mt-1.5 text-center text-[9px] text-muted-foreground/80">
                {t("Secure checkout via Stripe")}
              </p>
            </div>
          </div>
        </div>

        {/* How it works timeline */}
        <div className="mt-12 border-t border-border/40 pt-10">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h4 className="font-display text-sm font-semibold tracking-wider text-primary uppercase">
              {t("How it works")}
            </h4>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("Get your custom prescription glasses in five simple steps.")}
            </p>
          </div>

          <div className="relative flex flex-col gap-6 sm:grid sm:grid-cols-5 sm:gap-4.5 text-left pl-3 sm:pl-0">
            {/* Connector line for mobile (runs vertically) */}
            <div className="absolute left-[26px] top-3 bottom-3 w-[1.5px] bg-border/80 sm:hidden z-0" />
            {/* Subtle connector line for desktop */}
            <div className="hidden sm:block absolute top-[16px] left-[5%] right-[5%] h-[1px] bg-border/60 z-0" />

            {/* Step 1 */}
            <div className="relative z-10 flex gap-4 items-start sm:flex-col sm:items-start sm:gap-0 bg-transparent p-0 border-0 shadow-none">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground font-display font-semibold text-xs flex items-center justify-center shadow-xs shrink-0 ring-4 ring-[oklch(0.97_0.01_180)] sm:w-8 sm:h-8 sm:ring-8 sm:ring-[oklch(0.97_0.01_180)]">
                1
              </div>
              <div className="flex-1 sm:mt-3">
                <h5 className="font-display font-semibold text-[13px] text-foreground leading-snug">
                  {t("Subscribe via Stripe")}
                </h5>
                <p className="text-[10.5px] text-muted-foreground mt-1 leading-relaxed max-w-[260px] sm:max-w-none">
                  {t("Select your plan and complete checkout securely.")}
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 flex gap-4 items-start sm:flex-col sm:items-start sm:gap-0 bg-transparent p-0 border-0 shadow-none">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground font-display font-semibold text-xs flex items-center justify-center shadow-xs shrink-0 ring-4 ring-[oklch(0.97_0.01_180)] sm:w-8 sm:h-8 sm:ring-8 sm:ring-[oklch(0.97_0.01_180)]">
                2
              </div>
              <div className="flex-1 sm:mt-3">
                <h5 className="font-display font-semibold text-[13px] text-foreground leading-snug">
                  {t("E-mail contact within 24 hours")}
                </h5>
                <p className="text-[10.5px] text-muted-foreground mt-1 leading-relaxed max-w-[260px] sm:max-w-none">
                  {t("We reach out to gather your custom prescription details.")}
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 flex gap-4 items-start sm:flex-col sm:items-start sm:gap-0 bg-transparent p-0 border-0 shadow-none">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground font-display font-semibold text-xs flex items-center justify-center shadow-xs shrink-0 ring-4 ring-[oklch(0.97_0.01_180)] sm:w-8 sm:h-8 sm:ring-8 sm:ring-[oklch(0.97_0.01_180)]">
                3
              </div>
              <div className="flex-1 sm:mt-3">
                <h5 className="font-display font-semibold text-[13px] text-foreground leading-snug truncate max-w-full sm:whitespace-normal">
                  {t("Send frame details")}
                </h5>
                <p className="text-[10.5px] text-muted-foreground mt-1 leading-relaxed max-w-[260px] sm:max-w-none">
                  {t("Simply reply with your values and a photo/screenshot of any frame you want.")}
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative z-10 flex gap-4 items-start sm:flex-col sm:items-start sm:gap-0 bg-transparent p-0 border-0 shadow-none">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground font-display font-semibold text-xs flex items-center justify-center shadow-xs shrink-0 ring-4 ring-[oklch(0.97_0.01_180)] sm:w-8 sm:h-8 sm:ring-8 sm:ring-[oklch(0.97_0.01_180)]">
                4
              </div>
              <div className="flex-1 sm:mt-3">
                <h5 className="font-display font-semibold text-[13px] text-foreground leading-snug">
                  {t("Sourcing & production")}
                </h5>
                <p className="text-[10.5px] text-muted-foreground mt-1 leading-relaxed max-w-[260px] sm:max-w-none">
                  {t("We purchase your frame and craft your custom lenses to specification.")}
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="relative z-10 flex gap-4 items-start sm:flex-col sm:items-start sm:gap-0 bg-transparent p-0 border-0 shadow-none">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground font-display font-semibold text-xs flex items-center justify-center shadow-xs shrink-0 ring-4 ring-[oklch(0.97_0.01_180)] sm:w-8 sm:h-8 sm:ring-8 sm:ring-[oklch(0.97_0.01_180)]">
                5
              </div>
              <div className="flex-1 sm:mt-3">
                <h5 className="font-display font-semibold text-[13px] text-foreground leading-snug">
                  {t("Delivered to your door")}
                </h5>
                <p className="text-[10.5px] text-muted-foreground mt-1 leading-relaxed max-w-[260px] sm:max-w-none">
                  {t("Your finished prescription eyewear arrives in approximately 15 days.")}
                </p>
              </div>
            </div>
          </div>
        </div>


        {/* The math */}
        <div className="mt-8 flex flex-col sm:grid sm:grid-cols-3 gap-5 sm:gap-6 rounded-2xl border border-border bg-card p-5 sm:p-8">
          <Math k="€1,600" l={t("Traditional optician (4 pairs)")} />
          <Math k="€29/month" l={t("Lensly subscription (incl. replacements)")} highlight />
          <Math k="€1,252" l={t("Saved when using replacements")} />
        </div>

        {/* Insurance Comparison */}
        <div className="mt-16 border-t border-border/60 pt-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h3 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
              {t("Lensly vs. Glasses Insurance")}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t(
                "Supplemental insurance plans look cheap upfront but often leave you with heavy out-of-pocket costs.",
              )}
            </p>
          </div>

          <div className="grid gap-4.5 md:grid-cols-2">
            {/* Glasses Insurance */}
            <div className="rounded-2xl border border-border bg-card p-4.5 sm:p-8 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-border/60 pb-4">
                  <div>
                    <h4 className="font-display text-base font-semibold text-foreground">
                      {t("Glasses Insurance")}
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {t("Standard supplemental policy")}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-display text-xl font-bold text-foreground">
                      €7-20<span className="text-xs font-normal text-muted-foreground">/month</span>
                    </span>
                  </div>
                </div>

                <ul className="mt-4 space-y-3 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2.5">
                    <svg
                      className="w-3.5 h-3.5 mt-0.5 shrink-0 text-destructive"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <div>
                      <span className="font-semibold text-foreground">
                        {t("1 pair every 2 years")}
                      </span>
                      <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                        {t("pay €240 in premiums, get €150 back, lose €90 minimum")}
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <svg
                      className="w-3.5 h-3.5 mt-0.5 shrink-0 text-destructive"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <div>
                      <span className="font-semibold text-foreground">{t("Break them once")}</span>
                      <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                        {t("€400 out of pocket, not covered")}
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <svg
                      className="w-3.5 h-3.5 mt-0.5 shrink-0 text-destructive"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <div>
                      <span className="font-semibold text-foreground">
                        {t("Need anti-reflective or thin lenses")}
                      </span>
                      <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                        {t("€150+ extra, not covered")}
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <svg
                      className="w-3.5 h-3.5 mt-0.5 shrink-0 text-destructive"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <div>
                      <span className="font-semibold text-foreground">
                        {t("Prescription changes")}
                      </span>
                      <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                        {t("full retail price, not covered")}
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="mt-6 border-t border-border/60 pt-4">
                <div className="text-[14px] font-bold text-destructive">
                  {t("Total realistic cost over 2 years: €800-1,200+")}
                </div>
                <div className="text-[10.5px] font-medium text-muted-foreground/75 mt-0.5">
                  {t("Premiums + gaps + extras + one replacement")}
                </div>
              </div>
            </div>

            {/* Lensly */}
            <div className="relative rounded-2xl border-2 border-primary bg-card p-4.5 sm:p-8 shadow-xs flex flex-col justify-between">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-primary-foreground shadow-sm">
                {t("Recommended")}
              </div>
              <div>
                <div className="flex items-center justify-between border-b border-border/60 pb-4">
                  <div>
                    <h4 className="font-display text-base font-semibold text-primary">
                      {t("Lensly Care")}
                    </h4>
                    <p className="text-[11px] text-primary/80 mt-0.5">
                      {t("Complete continuous vision plan")}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-display text-xl font-bold text-primary">
                      €29<span className="text-xs font-normal text-muted-foreground">/month</span>
                    </span>
                  </div>
                </div>

                <ul className="mt-4 space-y-3 text-xs text-foreground/95">
                  <li className="flex items-start gap-2.5">
                    <svg
                      className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <span className="font-semibold text-foreground">
                        {t("1 complete pair delivered to you")}
                      </span>
                      <p className="text-[11px] text-primary/70 mt-0.5">
                        {t("Fully covered every single year, zero waiting periods")}
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <svg
                      className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <span className="font-semibold text-foreground">
                        {t("3 free replacements (broken, power change)")}
                      </span>
                      <p className="text-[11px] text-primary/70 mt-0.5">
                        {t(
                          "€0 out-of-pocket costs for prescription changes or accident replacements",
                        )}
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <svg
                      className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <span className="font-semibold text-foreground">
                        {t("Nothing extra to pay ever")}
                      </span>
                      <p className="text-[11px] text-primary/70 mt-0.5">
                        {t("Premium lenses, anti-reflective & UV-400 coatings are 100% included")}
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="mt-6 border-t border-border/60 pt-4">
                <div className="text-[14px] font-bold text-primary">
                  {t("Flat €29/month, completely covered")}
                </div>
                <div className="text-[10.5px] font-medium text-muted-foreground/75 mt-0.5">
                  {t("Zero hidden fees, 1 pair per year and 3 replacements per year")}
                </div>
              </div>
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
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        className="mt-0.5 shrink-0 text-primary"
        fill="none"
      >
        <circle cx="8" cy="8" r="7.25" stroke="currentColor" strokeWidth="1" opacity="0.4" />
        <path
          d="M5 8.2l2.2 2.1L11 6.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
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
    <div className="flex flex-row items-center justify-start text-left gap-4 sm:flex-col sm:items-start sm:justify-center sm:text-left sm:gap-0">
      <div
        className={
          "font-display text-[22px] sm:text-3xl md:text-4xl font-semibold tracking-tight shrink-0 " +
          (highlight ? "text-primary" : "text-foreground")
        }
      >
        {k}
      </div>
      <div className="flex-1">
        <div className="text-[11.5px] sm:text-[13px] leading-snug text-muted-foreground">{l}</div>
        {sub && <div className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground/75 font-medium">{sub}</div>}
      </div>
    </div>
  );
}

export function Faq() {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: t("Who is behind Lensly?"),
      a: (
        <p className="text-[13px] sm:text-sm text-muted-foreground leading-relaxed">
          {t(
            "Lensly is a small independent team focused on making quality prescription eyewear affordable and accessible across Europe. We work directly with certified optical labs to cut out retail markups.",
          )}
        </p>
      ),
    },
    {
      q: t("Can I see frame options before subscribing?"),
      a: (
        <p className="text-[13px] sm:text-sm text-muted-foreground leading-relaxed">
          {t(
            "Yes. You choose any frame you like, from any brand, online shop, or store. Send us a photo or screenshot and we source it for you. No limitations.",
          )}
        </p>
      ),
    },
    {
      q: t("How do I get my pupillary distance measured?"),
      a: (
        <p className="text-[13px] sm:text-sm text-muted-foreground leading-relaxed">
          {t(
            "Visit any local optician or doctor for a quick measurement. It takes 2 minutes and is usually free. Then just include it in your email to us.",
          )}
        </p>
      ),
    },
    {
      q: t("What if my lenses are wrong?"),
      a: (
        <p className="text-[13px] sm:text-sm text-muted-foreground leading-relaxed">
          {t("We send a replacement pair free of charge, no questions asked.")}
        </p>
      ),
    },
    {
      q: t("How do returns or refunds work?"),
      a: (
        <p className="text-[13px] sm:text-sm text-muted-foreground leading-relaxed">
          {t(
            "If there is a production error on our side we fix it completely free. Custom prescription lenses cannot be refunded once produced, but we will always make it right.",
          )}
        </p>
      ),
    },
    {
      q: t("Do I buy the frame or do you?"),
      a: (
        <p className="text-[13px] sm:text-sm text-muted-foreground leading-relaxed">
          {t(
            "We source the frame for you based on your photo or screenshot. It is included in your subscription, nothing extra to pay.",
          )}
        </p>
      ),
    },
  ];

  return (
    <section id="faq" className="py-14 sm:py-20 border-t border-border/40 bg-muted/10">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("Frequently Asked Questions")}
          </h2>
          <p className="mt-2 text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">
            {t("Everything you need to know")}
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="overflow-hidden rounded-lg border border-border bg-card transition-all duration-200"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${idx}`}
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between px-4 py-3.5 sm:px-6 sm:py-5 text-left text-[13px] sm:text-base font-semibold text-foreground hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <svg
                    className={`h-4 w-4 text-muted-foreground shrink-0 ml-4 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div
                  id={`faq-answer-${idx}`}
                  role="region"
                  className={`transition-all duration-200 ease-in-out ${
                    isOpen
                      ? "max-h-[700px] opacity-100 border-t border-border/40 px-4 py-4 sm:px-6 sm:py-5 bg-muted/5"
                      : "max-h-0 opacity-0 overflow-hidden"
                  }`}
                >
                  {faq.a}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="bg-foreground text-background">
      <div className="border-b border-background/10 py-5 text-center text-xs text-background/60">
        {t("For any help or requests regarding subscription please contact at")}{" "}
        <a href="mailto:hello@lensly.care" className="text-primary hover:underline font-medium">
          hello@lensly.care
        </a>
      </div>
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6 py-8 label-mono text-[10px] uppercase tracking-[0.18em] text-background/60">
        <Link
          to="/"
          className="flex items-center gap-2 text-background/85 hover:opacity-90 transition-opacity"
        >
          <LensMark />
          <span className="font-display text-sm font-semibold">Lensly</span>
        </Link>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <a
            href="mailto:hello@lensly.care"
            className="hover:text-background transition-colors lowercase tracking-normal font-sans text-xs mr-2"
          >
            hello@lensly.care
          </a>
          <Link to="/contract" className="hover:text-background transition-colors">
            {t("Sign Contract")}
          </Link>
          <Link to="/impressum" className="hover:text-background transition-colors">
            {t("Impressum")}
          </Link>
          <Link to="/datenschutz" className="hover:text-background transition-colors">
            {t("Datenschutz")}
          </Link>
          <Link to="/agb" className="hover:text-background transition-colors">
            {t("AGB")}
          </Link>
          <Link
            to="/cancel"
            className="hover:text-background/90 text-emerald-400 font-medium transition-colors"
          >
            {t("Vertrag hier kündigen")}
          </Link>
          <Link
            to="/withdraw"
            className="hover:text-background/90 text-emerald-400 font-medium transition-colors"
          >
            {t("Vertrag widerrufen")}
          </Link>
          <span className="text-background/40">© 2026 Lensly</span>
        </div>
      </div>
    </footer>
  );
}
