import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useLanguage, Language } from "../lib/i18n";

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
      <ProductGallery />
      <Faq />
      <Reviews />
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
              lensly@gmail.com
            </div>

            <div className="flex flex-col gap-2">
              <a
                href="mailto:lensly@gmail.com"
                className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold shadow-xs hover:bg-primary/95 transition text-center block cursor-pointer"
              >
                {t("Send Email")}
              </a>
              
              <button
                onClick={() => {
                  navigator.clipboard.writeText("lensly@gmail.com");
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
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-md">
      {/* Sleek Trust & Announcement Bar */}
      <div className="bg-primary text-primary-foreground text-[8.5px] sm:text-[9.5px] py-1.5 px-4 font-sans tracking-wider text-center uppercase font-bold flex items-center justify-center gap-x-6 gap-y-1 flex-wrap border-b border-white/10 select-none">
        <span>{t("✓ CE Certified Lenses")}</span>
        <span className="hidden sm:inline opacity-30">•</span>
        <span>{t("✓ Free EU Shipping")}</span>
        <span className="hidden sm:inline opacity-30">•</span>
        <span>{t("✓ 14-Day Satisfaction Guarantee")}</span>
      </div>

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
            <span className="hidden xs:inline">{t("Subscribe")}</span>
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
                    onClick={() => handleScrollTo("styles")}
                    className="flex w-full items-center rounded-md px-3 py-2.5 text-left text-xs font-semibold text-foreground/80 hover:bg-muted cursor-pointer transition-colors"
                  >
                    {t("Frames")}
                  </button>
                  <button
                    onClick={() => handleScrollTo("reviews")}
                    className="flex w-full items-center rounded-md px-3 py-2.5 text-left text-xs font-semibold text-foreground/80 hover:bg-muted cursor-pointer transition-colors"
                  >
                    {t("Feedbacks")}
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
                        window.location.href = "mailto:lensly@gmail.com";
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

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 pt-16 pb-16 md:pt-28 md:pb-28">
        {/* Two-column grid on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-20 items-center">
          {/* Left Column: Headline, Description, CTAs, and Trust Badges */}
          <div className="md:col-span-7 flex flex-col items-center text-center md:items-start md:text-left">
            <p className="label-mono animate-fade-in text-[11px] uppercase tracking-[0.2em] text-primary">
              {t("One plan · €29 / month")}
            </p>
            <h1 className="animate-fade-in mt-3 font-display text-3xl sm:text-4xl md:text-[54px] font-semibold leading-[1.1] md:leading-[1.05] tracking-tight text-foreground">
              {t("Precision vision care, renewed every year")}{" "}
              <span className="relative inline-block">
                <span className="relative text-primary font-bold">
                  €29
                </span>
              </span>
            </h1>
            <style dangerouslySetInnerHTML={{__html: `
            `}} />

            {/* Key Benefits - 3 Points */}
            <div className="animate-fade-in mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">1 Free Pair/Yr</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">3 Replacements</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">Flat €29/Mo</span>
              </div>
            </div>

            <p className="animate-fade-in mt-5 text-[13px] sm:text-sm md:text-[16px] text-muted-foreground leading-relaxed max-w-lg">
              {t("Every year, a new pair of prescription glasses — delivered straight to your door. Break them? Three free replacements included.")}
            </p>

            {/* Premium CTA Buttons */}
            <div className="animate-fade-in mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <a
                href="/checkout"
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-7 py-4 text-xs sm:text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_-8px_oklch(0.46_0.07_210/0.6)] transition hover:opacity-95 hover:shadow-[0_12px_32px_-8px_oklch(0.46_0.07_210/0.7)] hover:scale-[1.01] active:scale-[0.99]"
              >
                {t("Start for €29/mo")}
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </a>
              <a
                href="/#plan"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-primary/10 bg-white/50 backdrop-blur-xs px-7 py-4 text-xs sm:text-sm font-semibold text-foreground hover:bg-white hover:border-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                {t("See the plan")}
              </a>
            </div>
          </div>

          {/* Right Column: Optometrist Consultation Image Card */}
          <div className="md:col-span-5 relative w-full px-4 animate-fade-in mt-10 md:mt-0 max-w-[340px] md:max-w-none mx-auto">
            {/* Solid Teal Offset Backdrop Accent Frame */}
            <div className="absolute inset-0 bg-primary/10 rounded-2xl translate-x-3.5 translate-y-3.5 pointer-events-none border border-primary/20" />
            
            {/* Image Container Card */}
            <div className="relative overflow-hidden rounded-2xl bg-white shadow-[0_12px_36px_rgba(0,0,0,0.06)] border border-border/80 aspect-[4/5]">
              <img
                src="/doctor-consultation.png"
                alt="Lensly personalized optometrist consultation"
                width={1024}
                height={1024}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.02]"
              />
            </div>
          </div>
        </div>

        {/* 3 Premium Value Features - positioned nicely below */}
        <div className="mt-24 md:mt-36 max-w-5xl mx-auto">
          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-border/60"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/80">
                {t("What is included in Lensly Care")}
              </span>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 text-left px-4">
            {/* Card 1: 1 Free Pair */}
            <div className="bg-white/60 border border-primary/5 rounded-2xl p-6 shadow-xs group transition-all duration-300 hover:shadow-md hover:border-primary/10">
              <div className="w-10 h-10 shrink-0 bg-primary/10 border border-primary/20 text-primary rounded-full flex items-center justify-center font-display font-bold text-sm transition-all duration-500 group-hover:bg-gradient-to-br group-hover:from-primary group-hover:to-teal-500 group-hover:text-primary-foreground group-hover:scale-105 shadow-xs shadow-primary/5 md:w-11 md:h-11">
                01
              </div>
              <div className="mt-4">
                <h3 className="font-display font-semibold text-[15px] sm:text-[16px] text-foreground tracking-tight">
                  {t("Every year, fresh.")}
                </h3>
                <p className="text-[12px] text-muted-foreground mt-1.5 leading-relaxed">
                  {t("Your eyesight changes. Your style changes too. That's why we deliver a completely new pair every year — no reordering, no extra cost.")}
                </p>
              </div>
            </div>

            {/* Card 2: 3 Free Replacements */}
            <div className="bg-white/60 border border-primary/5 rounded-2xl p-6 shadow-xs group transition-all duration-300 hover:shadow-md hover:border-primary/10">
              <div className="w-10 h-10 shrink-0 bg-primary/10 border border-primary/20 text-primary rounded-full flex items-center justify-center font-display font-bold text-sm transition-all duration-500 group-hover:bg-gradient-to-br group-hover:from-primary group-hover:to-teal-500 group-hover:text-primary-foreground group-hover:scale-105 shadow-xs shadow-primary/5 md:w-11 md:h-11">
                02
              </div>
              <div className="mt-4">
                <h3 className="font-display font-semibold text-[15px] sm:text-[16px] text-foreground tracking-tight flex items-center gap-2">
                  {t("Broken? No problem.")}
                </h3>
                <p className="text-[12px] text-muted-foreground mt-1.5 leading-relaxed">
                  {t("Glasses break. We send replacements — up to three times per year, free of charge. Damaged, prescription changed — doesn't matter. We fix it.")}
                </p>
              </div>
            </div>

            {/* Card 3: €29 Only */}
            <div className="bg-white/60 border border-primary/5 rounded-2xl p-6 shadow-xs group transition-all duration-300 hover:shadow-md hover:border-primary/10">
              <div className="w-10 h-10 shrink-0 bg-primary/10 border border-primary/20 text-primary rounded-full flex items-center justify-center font-display font-bold text-sm transition-all duration-500 group-hover:bg-gradient-to-br group-hover:from-primary group-hover:to-teal-500 group-hover:text-primary-foreground group-hover:scale-105 shadow-xs shadow-primary/5 md:w-11 md:h-11">
                03
              </div>
              <div className="mt-4">
                <h3 className="font-display font-semibold text-[15px] sm:text-[16px] text-foreground tracking-tight">
                  {t("€29. That's it.")}
                </h3>
                <p className="text-[12px] text-muted-foreground mt-1.5 leading-relaxed">
                  {t("No hidden costs. No upcharges for anti-reflective coating or thin lenses. €29 once a month — that's all.")}
                </p>
              </div>
            </div>
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
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-16 md:py-28">
        {/* Section Header */}
        <div className="text-center mb-10 md:mb-16">
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("The honest comparison.")}
          </h2>
          <p className="mt-2 text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            {t("€400 once at the optician or €29/month with us. The difference is in the details.")}
          </p>
        </div>

        {/* Comparison Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Traditional Optician Card */}
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs flex flex-col justify-between">
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
                  {t("Broken glasses? Full price, no replacement.")}
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/45" />
                  {t("Anti-reflective, UV coating — all extra, all expensive.")}
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/45" />
                  {t("New prescription? Another €400 out.")}
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/45" />
                  {t("Wait 2–3 years until you can afford it again.")}
                </li>
              </ul>
            </div>
          </div>

          {/* Lensly Care Card (Featured) */}
          <div className="relative rounded-2xl border-2 border-primary bg-card p-6 sm:p-8 shadow-xs flex flex-col justify-between">
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
            <div className="mt-6 pt-4 border-t border-border/60">
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

          <div className="relative flex flex-col gap-6 sm:grid sm:grid-cols-5 sm:gap-5 text-left pl-3 sm:pl-0">
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
                  {t("Just click 'Subscribe' below — takes 2 minutes.")}
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
                  {t("We'll reach out within a day via email and ask for everything we need.")}
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
                  {t("Just reply to our email with your prescription, PD, and a photo of the frame you like — from any shop, any brand.")}
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
                  {t("We order the frame for you and have your lenses made to spec.")}
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
                  {t("In about 15 days, your new glasses arrive in the mailbox — done.")}
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

          <div className="grid gap-6 md:grid-cols-2">
            {/* Glasses Insurance */}
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs flex flex-col justify-between">
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
            <div className="relative rounded-2xl border-2 border-primary bg-card p-6 sm:p-8 shadow-xs flex flex-col justify-between">
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

export function ProductGallery() {
  const { t } = useLanguage();

  const styles = [
    {
      name: t("The Classic Acetate"),
      desc: t("Premium handcrafted tortoiseshell frame with durable metal inner core. Sleek vintage design suitable for any face shape."),
      tag: t("Premium Acetate"),
      image: "/classic-acetate.png"
    },
    {
      name: t("The Modern Gold"),
      desc: t("Ultra-lightweight round stainless steel frame plated with high-polish warm gold. Minimalist styling with adjustable silicone nose pads."),
      tag: t("Stainless Steel"),
      image: "/modern-gold.png"
    },
    {
      name: t("The Bold Black"),
      desc: t("Chic thick-rimmed square frame in deep polished onyx black. Solid construction with high-grade flexible hinges."),
      tag: t("Polished Resin"),
      image: "/bold-black.png"
    },
    {
      name: t("The Crystal Clear"),
      desc: t("Elegant transparent round frame crafting a modern, intellectual look. Soft keyhole bridge for maximum all-day comfort."),
      tag: t("Transparent TR90"),
      image: "/crystal-clear.png"
    }
  ];

  return (
    <section id="styles" className="py-16 md:py-28 bg-background border-t border-border/40">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("Signature Frame Styles")}
          </h2>
          <p className="mt-2 text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            {t("Send us a photo — we'll source the frame for you.")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {styles.map((style, idx) => (
            <div
              key={idx}
              className="bg-white/60 border border-primary/5 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between hover:shadow-md hover:border-primary/10 transition-all duration-300 group"
            >
              <div className="aspect-[4/5] overflow-hidden bg-muted/40 relative">
                <img
                  src={style.image}
                  alt={style.name}
                  width={400}
                  height={500}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute top-3 left-3 bg-primary/95 text-primary-foreground text-[8px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border border-white/10 shadow-sm">
                  {style.tag}
                </span>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div className="mb-4">
                  <h3 className="font-display font-semibold text-xs sm:text-[14px] text-foreground tracking-tight">
                    {style.name}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                    {style.desc}
                  </p>
                </div>
                <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider flex items-center gap-1 border-t border-border/40 pt-3">
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{t("German Lenses Fitted")}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Explore All Link/Button */}
        <div className="text-center mt-12">
          <Link
            to="/frames"
            className="inline-flex items-center gap-2 rounded-xl border border-primary/15 bg-white px-6 py-3 text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary/5 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-xs"
          >
            <span>{t("Explore All Signature Frames")}</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
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
            "We're a small team from Germany. The idea came up because glasses in Europe are absurdly expensive — not because they have to be, but because the market wants it that way. We work directly with certified optical labs and skip the retail markup.",
          )}
        </p>
      ),
    },
    {
      q: t("Can I see frame options before subscribing?"),
      a: (
        <p className="text-[13px] sm:text-sm text-muted-foreground leading-relaxed">
          {t(
            "Yes — and that's actually the best part. You can pick any frame you like. From Mister Spex, JINS, a local optician, Amazon — doesn't matter. Just send us a screenshot and we'll source the frame for you. No markup, no restrictions.",
          )}
        </p>
      ),
    },
    {
      q: t("How do I get my pupillary distance measured?"),
      a: (
        <p className="text-[13px] sm:text-sm text-muted-foreground leading-relaxed">
          {t(
            "Visit any local optician or eye doctor for a quick measurement. Takes 2 minutes and is usually free. Then just include it in your email to us.",
          )}
        </p>
      ),
    },
    {
      q: t("What if my lenses are wrong?"),
      a: (
        <p className="text-[13px] sm:text-sm text-muted-foreground leading-relaxed">
          {t("Then we'll do it again. Free of charge. No discussion.")}
        </p>
      ),
    },
    {
      q: t("I have a strong prescription — will this still work?"),
      a: (
        <p className="text-[13px] sm:text-sm text-muted-foreground leading-relaxed">
          {t(
            "Yes. We make lenses for all common prescriptions, including high diopters and astigmatism. Drop us a message before subscribing if you're unsure.",
          )}
        </p>
      ),
    },
    {
      q: t("How do returns or refunds work?"),
      a: (
        <p className="text-[13px] sm:text-sm text-muted-foreground leading-relaxed">
          {t(
            "If there's a production error on our end, we fix it for free. Custom prescription lenses can't be refunded once made, but we'll always find a solution that works.",
          )}
        </p>
      ),
    },
    {
      q: t("Do I buy the frame or do you?"),
      a: (
        <p className="text-[13px] sm:text-sm text-muted-foreground leading-relaxed">
          {t(
            "We source the frame for you based on your photo or screenshot. It's included in your subscription — nothing extra to pay.",
          )}
        </p>
      ),
    },
  ];

  return (
    <section id="faq" className="py-16 md:py-28 border-t border-border/40 bg-muted/10">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("Still have questions?")}
          </h2>
          <p className="mt-2 text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">
            {t("The things people ask us most.")}
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

export function Reviews() {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);

  const reviews = [
    {
      name: "Sarah Lindner",
      role: t("Medical Student, LMU Munich"),
      badge: t("Student"),
      badgeColor: "bg-emerald-50/50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
      image: "/sarah-lindner.png",
      text: t("As a student, I couldn't just drop €380 for new glasses every two years. With Lensly I pay €29 a month and get a new pair every year. Last week my frame got damaged — the replacement arrived in 4 days.")
    },
    {
      name: "Markus Becker",
      role: t("Senior Consultant, Accenture"),
      badge: t("Office Worker"),
      badgeColor: "bg-indigo-50/50 text-indigo-700 border-indigo-200/50 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20",
      image: "/markus-becker.png",
      text: t("I work 9 hours a day in front of three monitors. The blue-light filter lenses from Lensly are noticeably better than what I used to buy at the local optician — and for a third of the price. Setup took 10 minutes.")
    },
    {
      name: "Lukas Weber",
      role: t("Computer Science Student, TU Berlin"),
      badge: t("Student"),
      badgeColor: "bg-emerald-50/50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
      image: "/lukas-weber.png",
      text: t("The first delivery took almost 18 days, which I found a bit long. But the lenses were precise, the anti-reflective coating was good, and the second pair arrived in 12 days. For €29/month, definitely fair.")
    },
    {
      name: "Jonas Schmidt",
      role: t("Business Student, FU Berlin"),
      badge: t("Student"),
      badgeColor: "bg-emerald-50/50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
      image: "/jonas-schmidt.png",
      text: t("I never understood why glasses should be so expensive. Lensly explains it: because opticians charge retail markups. With the subscription I pay €348 per year for new glasses including replacements — at the optician, one pair alone was €320.")
    },
    {
      name: "Emma Fischer",
      role: t("Administrative Assistant, Siemens"),
      badge: t("Office Worker"),
      badgeColor: "bg-indigo-50/50 text-indigo-700 border-indigo-200/50 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20",
      image: "/emma-fischer.png",
      text: t("After an accident I requested my replacement pair. One short email to Lensly, two photos, three days later the new glasses arrived. No forms, no phone call.")
    },
    {
      name: "Laura Weber",
      role: t("Marketing Manager, Zalando"),
      badge: t("Office Worker"),
      badgeColor: "bg-indigo-50/50 text-indigo-700 border-indigo-200/50 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20",
      image: "/laura-weber.png",
      text: t("I change my style every year. At a normal optician that costs €400 per pair. Now I just pick a new frame, send a screenshot — and get it built and delivered. That's the model I always wanted.")
    }
  ];

  const visibleReviews = isExpanded ? reviews : reviews.slice(0, 3);

  return (
    <section id="reviews" className="py-16 md:py-28 border-t border-border/40 bg-background relative overflow-hidden">
      {/* Subtle decorative glow to match other sections */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
      
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("What our members say")}
          </h2>
        </div>

        {/* 3-column layout grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {visibleReviews.map((review, idx) => (
            <div 
              key={idx}
              className="bg-white/80 border border-primary/10 rounded-2xl p-6 shadow-[0_12px_40px_rgba(0,102,119,0.03)] backdrop-blur-xs flex flex-col justify-between hover:shadow-[0_16px_48px_rgba(0,102,119,0.06)] hover:scale-[1.01] hover:border-primary/20 transition-all duration-300 relative group"
            >
              <div>
                {/* 5-star rating layout using clinical-teal color */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-3.5 h-3.5 text-primary fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>

                <p className="text-[13px] text-muted-foreground/90 font-sans leading-relaxed italic">
                  "{review.text}"
                </p>
              </div>

              {/* Reviewer Details */}
              <div className="flex flex-col gap-3 mt-6 pt-5 border-t border-border/40">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={review.image}
                      alt={review.name}
                      width={64}
                      height={64}
                      className="w-8 h-8 rounded-full border border-primary/10 object-cover shrink-0"
                    />
                    <div className="text-left">
                      <h4 className="font-semibold text-xs text-foreground leading-none">
                        {review.name}
                      </h4>
                      <span className="text-[10px] text-muted-foreground font-medium block mt-1.5 leading-none">
                        {review.role}
                      </span>
                    </div>
                  </div>

                  {/* Role Specific color Badge */}
                  <span className={`text-[8px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border shrink-0 ${review.badgeColor}`}>
                    {review.badge}
                  </span>
                </div>

                {/* Verified Tag */}
                <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold text-left">
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{t("Verified Member")}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Expand / Collapse Button controls */}
        <div className="text-center mt-12 animate-fade-in">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-2 rounded-xl border border-primary/10 bg-white px-6 py-3 text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary/5 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-xs"
          >
            {isExpanded ? t("See Less") : t("See More")}
          </button>
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
        {t("Questions about your subscription? Write to us:")}{" "}
        <a href="mailto:lensly@gmail.com" className="text-primary hover:underline font-medium">
          lensly@gmail.com
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
            href="mailto:lensly@gmail.com"
            className="hover:text-background transition-colors lowercase tracking-normal font-sans text-xs mr-2"
          >
            lensly@gmail.com
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
            className="hover:text-background transition-colors"
          >
            {t("Vertrag hier kündigen")}
          </Link>
          <span className="text-background/40">© 2026 Lensly</span>
        </div>
      </div>
    </footer>
  );
}
