import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useLanguage, Language } from "../lib/i18n";
import { CURRENT_PLAN, getAnnualTotal, getDailyEquivalent, formatEur } from "../lib/pricing";
import { trackEvent } from "../lib/analytics";
import { FrameRequestModal } from "../components/frame-request-modal";
import { FrameStatusTracker } from "../components/frame-status-tracker";
import { VirtualTryOnPreview } from "../components/virtual-tryon-preview";
import {
  ShieldCheck,
  Check,
  CheckCircle2,
  ArrowRight,
  Clock,
  Sparkles,
  Glasses,
  FileText,
  Lock,
  ChevronDown,
  ExternalLink,
  Eye,
  HelpCircle,
  Send,
  Package,
  RefreshCw,
  Search,
  Building2,
  Phone,
  Mail,
  X,
  Copy,
  User,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "Lensly | Found a frame you love? Send it to Lensly",
      },
      {
        name: "description",
        content:
          "Discover any frame elsewhere, send us the link or screenshot, and we'll check compatibility and your prescription requirements before you pay. €29/month.",
      },
      {
        property: "og:title",
        content: "Lensly — Prescription Eyewear Subscription with Pre-Payment Verification",
      },
      {
        property: "og:description",
        content:
          "Share a frame link or screenshot and we'll check availability, compatibility and your prescription requirements before you pay.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Index,
});

function Index() {
  const { t } = useLanguage();
  const [isFrameModalOpen, setIsFrameModalOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  useEffect(() => {
    trackEvent("page_view", { page: "homepage" });
  }, []);

  const openFrameModal = (source: string) => {
    trackEvent("frame_request_started", { source });
    setIsFrameModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative selection:bg-primary/20 selection:text-primary">
      {/* 1. Announcement / Trust Bar */}
      <TrustBar />

      {/* 2. Navbar */}
      <Nav
        onOpenFrameModal={() => openFrameModal("navbar_cta")}
        onContactClick={() => setIsContactOpen(true)}
      />

      <main>
        {/* 3. Hero Section */}
        <Hero onOpenFrameModal={() => openFrameModal("hero_primary_cta")} />

        {/* 4. Simple Explanation of Lensly Concept */}
        <ConceptExplanation />

        {/* 5. How It Works Timeline (6-Stage Journey) */}
        <HowItWorksTimeline onOpenFrameModal={() => openFrameModal("timeline_cta")} />

        {/* 6. Virtual Try-On Section */}
        <VirtualTryOnPreview onOpenFrameModal={() => openFrameModal("vto_cta")} />

        {/* Status Tracker: Real-Time Pipeline Lookup */}
        <section id="tracking" className="py-12 md:py-16 border-b border-border/60 bg-background">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <FrameStatusTracker />
          </div>
        </section>

        {/* 9. Signature Frame Collection (Optional In-House Styles) */}
        <ProductGallery onOpenFrameModal={() => openFrameModal("gallery_custom_request")} />

        {/* 10. Transparent Pricing Section */}
        <PricingSection />

        {/* 11. What Is Included */}
        <InclusionsSection />

        {/* 12. Replacement & Service Coverage Explanation */}
        <ReplacementCareSection />

        {/* 13. Trust & Data Privacy Section */}
        <TrustAndPrivacySection />

        {/* 14. Partner Optical Lab Concept */}
        <PartnerOpticianSection />

        {/* 15. Truthful FAQ */}
        <FaqSection />

        {/* 16. Final CTA */}
        <FinalCta onOpenFrameModal={() => openFrameModal("final_cta")} />
      </main>

      {/* Footer */}
      <Footer onContactClick={() => setIsContactOpen(true)} />

      {/* Interactive Modal: Send Your Frame & Prescription */}
      <FrameRequestModal
        isOpen={isFrameModalOpen}
        onClose={() => setIsFrameModalOpen(false)}
      />

      {/* Direct Contact Modal */}
      {isContactOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-xs">
          <div className="fixed inset-0" onClick={() => setIsContactOpen(false)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-center z-10">
            <button
              onClick={() => setIsContactOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer p-1"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-3">
              <Mail className="w-6 h-6" />
            </div>

            <h3 className="font-display font-bold text-base text-foreground mb-1">
              {t("Contact Us")}
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              {t("Have questions about frame sourcing or prescription lenses? Our optical specialists reply within 24 hours.")}
            </p>

            <div className="bg-muted/40 rounded-lg p-2.5 mb-4 border border-border/60 font-mono text-xs text-foreground font-semibold select-all break-all">
              support@lensly.care
            </div>

            <div className="flex flex-col gap-2">
              <a
                href="mailto:support@lensly.care?subject=Lensly%20Inquiry"
                className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/95 transition text-center"
              >
                {t("Send Email")}
              </a>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText("support@lensly.care");
                  setCopiedEmail(true);
                  setTimeout(() => setCopiedEmail(false), 2000);
                }}
                className="w-full py-2.5 rounded-lg border border-border bg-background text-foreground text-xs font-semibold hover:bg-muted transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedEmail ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-primary" />
                    <span>{t("Copied!")}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{t("Copy Email Address")}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// SUBCOMPONENTS
// -------------------------------------------------------------

function TrustBar() {
  const { t } = useLanguage();
  return (
    <div className="bg-primary text-primary-foreground text-[8.5px] sm:text-[10px] py-2 px-4 font-sans tracking-wider text-center uppercase font-semibold flex items-center justify-center gap-x-6 gap-y-1 flex-wrap border-b border-white/10 select-none">
      <span className="flex items-center gap-1.5">
        <ShieldCheck className="w-3 h-3 shrink-0" />
        {t("Precision Lens Surfacing")}
      </span>
      <span className="hidden sm:inline opacity-30">•</span>
      <span className="flex items-center gap-1.5">
        <Eye className="w-3 h-3 shrink-0" />
        {t("Free Pre-Payment Verification")}
      </span>
      <span className="hidden sm:inline opacity-30">•</span>
      <span className="flex items-center gap-1.5">
        <Package className="w-3 h-3 shrink-0" />
        {t("Insured EU Shipping Included")}
      </span>
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

export function Nav({
  onOpenFrameModal,
  onContactClick,
}: {
  onOpenFrameModal?: () => void;
  onContactClick?: () => void;
}) {
  const { lang, setLang, t } = useLanguage();
  const [langOpen, setLangOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const currentLang = languages.find((l) => l.code === lang) || languages[0];

  const handleNavScroll = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <LensMark />
          <span className="font-display text-base font-bold tracking-tight text-foreground">
            Lensly<span className="text-primary">.care</span>
          </span>
        </Link>

        {/* Desktop Quick Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-muted-foreground">
          <button
            onClick={() => handleNavScroll("concept")}
            className="hover:text-foreground transition cursor-pointer"
          >
            {t("How it Works")}
          </button>
          <button
            onClick={() => handleNavScroll("journey")}
            className="hover:text-foreground transition cursor-pointer"
          >
            {t("Journey")}
          </button>
          <button
            onClick={() => handleNavScroll("try-on")}
            className="hover:text-foreground transition cursor-pointer"
          >
            {t("Try-On")}
          </button>
          <button
            onClick={() => handleNavScroll("pricing")}
            className="hover:text-foreground transition cursor-pointer"
          >
            {t("Pricing")}
          </button>
          <button
            onClick={() => handleNavScroll("tracking")}
            className="hover:text-foreground transition cursor-pointer"
          >
            {t("Track Request")}
          </button>
          <button
            onClick={() => handleNavScroll("faq")}
            className="hover:text-foreground transition cursor-pointer"
          >
            {t("FAQ")}
          </button>
        </nav>

        {/* Right Action Stack */}
        <div className="flex items-center gap-2.5">
          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              aria-label={t("Select Language")}
              className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-background/50 px-2.5 py-1.5 text-xs font-semibold text-foreground/80 hover:bg-muted transition cursor-pointer"
            >
              <span>{currentLang.flag}</span>
              <span className="uppercase text-[11px]">{currentLang.code}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </button>

            {langOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                <div className="absolute right-0 mt-1.5 z-50 w-36 rounded-xl border border-border bg-card p-1.5 shadow-xl animate-in fade-in-50 duration-150">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLang(l.code as Language);
                        setLangOpen(false);
                      }}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium transition cursor-pointer ${
                        lang === l.code
                          ? "bg-muted text-primary font-semibold"
                          : "text-foreground hover:bg-muted/50"
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

          {/* Primary Navbar Action CTA: Portal */}
          <Link
            to="/dashboard"
            className="rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/95 transition cursor-pointer flex items-center gap-1.5"
          >
            <User className="w-3.5 h-3.5" />
            <span>{t("Portal")}</span>
          </Link>

          {/* Mobile Hamburger Menu */}
          <div className="relative md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              className="w-8.5 h-8.5 rounded-lg border border-border/80 bg-background/50 flex items-center justify-center text-foreground hover:bg-muted transition cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <MenuIcon />}
            </button>

            {mobileMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMobileMenuOpen(false)} />
                <div className="absolute right-0 mt-1.5 z-50 w-48 rounded-xl border border-border bg-card p-1.5 shadow-xl flex flex-col gap-0.5 text-xs font-medium">
                  <button
                    onClick={() => handleNavScroll("concept")}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted text-foreground cursor-pointer"
                  >
                    {t("The Lensly Concept")}
                  </button>
                  <button
                    onClick={() => handleNavScroll("journey")}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted text-foreground cursor-pointer"
                  >
                    {t("Journey")}
                  </button>
                  <button
                    onClick={() => handleNavScroll("try-on")}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted text-foreground cursor-pointer"
                  >
                    {t("Try-On")}
                  </button>
                  <button
                    onClick={() => handleNavScroll("pricing")}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted text-foreground cursor-pointer"
                  >
                    {t("Pricing & Coverage")}
                  </button>
                  <button
                    onClick={() => handleNavScroll("tracking")}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted text-foreground cursor-pointer"
                  >
                    {t("Track Request")}
                  </button>
                  <button
                    onClick={() => handleNavScroll("faq")}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted text-foreground cursor-pointer"
                  >
                    {t("FAQ")}
                  </button>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-left px-3 py-2 rounded-lg bg-primary/10 text-primary font-semibold flex items-center gap-2 border-t border-border/40 mt-1"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>{t("Portal")}</span>
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (onContactClick) onContactClick();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted text-muted-foreground font-medium cursor-pointer"
                  >
                    {t("Contact Support")}
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

function MenuIcon() {
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="1.5" y1="2" x2="16.5" y2="2" />
      <line x1="1.5" y1="7" x2="16.5" y2="7" />
      <line x1="1.5" y1="12" x2="16.5" y2="12" />
    </svg>
  );
}

export function LensMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" fill="none" className="shrink-0">
      <circle cx="11" cy="16" r="7" stroke="currentColor" strokeWidth="1.6" className="text-primary" />
      <circle cx="22" cy="16" r="7" stroke="currentColor" strokeWidth="1.6" className="text-primary" />
      <path d="M18 16h-3" stroke="currentColor" strokeWidth="1.6" className="text-primary" />
    </svg>
  );
}

function Hero({ onOpenFrameModal }: { onOpenFrameModal: () => void }) {
  const { t } = useLanguage();

  const handleExploreClick = () => {
    trackEvent("hero_cta_click", { action: "explore" });
    const el = document.getElementById("concept");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-background via-background to-[var(--mint)]/20">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-35" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 pt-16 pb-16 md:pt-24 md:pb-24">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-14 items-center">
          {/* Left Hero Content */}
          <div className="md:col-span-7 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider bg-primary/10 text-primary font-semibold mb-4 border border-primary/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t("Pre-Payment Verification · German Vision Care")}</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-[1.1]">
              {t("Found a frame you love?")}{" "}
              <span className="shimmer-text">{t("Send it to Lensly.")}</span>
            </h1>

            <p className="mt-5 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
              {t("Share a frame link or screenshot and we’ll check availability, compatibility and your prescription requirements before you pay.")}
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-3.5 justify-center md:justify-start">
              <button
                type="button"
                onClick={() => {
                  trackEvent("hero_cta_click", { action: "check_frame_prescription" });
                  onOpenFrameModal();
                }}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs sm:text-sm shadow-md hover:bg-primary/95 transition flex items-center justify-center gap-2 cursor-pointer group"
              >
                <span>{t("Check My Prescription & Frame")}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </button>

              <button
                type="button"
                onClick={handleExploreClick}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-border bg-card/80 text-foreground font-semibold text-xs sm:text-sm hover:bg-muted transition cursor-pointer"
              >
                {t("Explore How Lensly Works")}
              </button>
            </div>

            {/* Trust Badges directly beneath Hero CTA */}
            <div className="mt-8 pt-6 border-t border-border/40 flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2 text-[11px] text-muted-foreground font-medium">
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-primary" />
                {t("Free Pre-Payment Verification")}
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-primary" />
                {t("Prescription & Frame Sizing Check")}
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-primary" />
                {t("Monthly Cancellation After 12 Months")}
              </span>
            </div>
          </div>

          {/* Right Visual Element: Frame Discovery + Optical Card */}
          <div className="md:col-span-5 relative w-full max-w-sm md:max-w-none mx-auto">
            <div className="relative rounded-2xl border border-border bg-card p-5 shadow-xl space-y-4">
              {/* Sourcing Preview Card */}
              <div className="rounded-xl bg-muted/40 p-3.5 border border-border/60">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-2">
                  <span className="font-mono uppercase font-semibold">{t("1. Customer Discovers Frame")}</span>
                  <span className="text-emerald-600 font-semibold">{t("Any store or brand")}</span>
                </div>
                <div className="flex items-center gap-3 bg-card p-2.5 rounded-lg border border-border/80">
                  <img
                    src="/classic-acetate.png"
                    alt="Frame preview"
                    className="w-14 h-10 object-contain"
                  />
                  <div className="truncate">
                    <p className="text-xs font-bold text-foreground truncate">{t("Tortoiseshell Acetate")}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{t("Screenshot or URL uploaded")}</p>
                  </div>
                </div>
              </div>

              {/* Lab Review Stage */}
              <div className="rounded-xl bg-primary/5 p-3.5 border border-primary/20 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono uppercase font-semibold text-primary">{t("2. Lensly Lab Reviews")}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">{t("Free Check")}</span>
                </div>
                <ul className="text-[11px] text-muted-foreground space-y-1 pl-1">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{t("Diopter range & index matching (1.50 - 1.67)")}</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{t("Lens bevel & frame structural compatibility")}</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{t("Distributor authenticity & availability check")}</span>
                  </li>
                </ul>
              </div>

              {/* Outcome Badge */}
              <div className="flex items-center justify-between pt-2 text-xs border-t border-border/40">
                <span className="text-muted-foreground font-medium">{t("All-Inclusive Monthly:")}</span>
                <span className="font-display font-bold text-base text-primary">€29 {t("/ month")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ConceptExplanation() {
  const { t } = useLanguage();

  return (
    <section id="concept" className="py-16 md:py-24 border-b border-border/60 bg-background">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-[10.5px] font-mono uppercase tracking-widest text-primary font-bold">
            {t("The Lensly Care Model")}
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-2">
            {t("Why Vision Care Belongs on Subscription")}
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {t("Eyesight changes continuously. Frames scratch or break. Traditional retail forces large irregular upfront payments with costly repairs. Lensly bundles precision lenses, frame sourcing, and replacements into one predictable monthly plan.")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-border bg-card shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm mb-4">
              01
            </div>
            <h3 className="font-display font-bold text-base text-foreground">
              {t("Pre-Payment Feasibility")}
            </h3>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              {t("Unlike ordinary shops where you pay first and hope for the best, Lensly checks your frame and diopters beforehand. If a frame cannot accommodate your cylinder or thickness, we inform you transparently.")}
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm mb-4">
              02
            </div>
            <h3 className="font-display font-bold text-base text-foreground">
              {t("Fresh Lenses Every Single Year")}
            </h3>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              {t("Every contract year you receive a complete new pair of prescription glasses with fresh anti-reflective coatings and updated diopters to ensure optimal visual health.")}
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm mb-4">
              03
            </div>
            <h3 className="font-display font-bold text-base text-foreground">
              {t("Up to 3 Replacements per Contract Year")}
            </h3>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              {t("Broken frames, deep scratches, or verified prescription changes within the year? Your plan includes up to three replacement requests per contract year per plan terms.")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorksTimeline({ onOpenFrameModal }: { onOpenFrameModal: () => void }) {
  const { t } = useLanguage();

  const steps = [
    {
      num: "01",
      title: "Discover Frame",
      desc: "Find any frame you like online, in a magazine, or in a retail shop.",
    },
    {
      num: "02",
      title: "Send to Lensly",
      desc: "Submit a screenshot, photo, or product URL through our free review tool.",
    },
    {
      num: "03",
      title: "Prescription Review",
      desc: "Upload your prescription or optical pass. Our opticians check feasibility before you pay.",
    },
    {
      num: "04",
      title: "Confirmation & Options",
      desc: "Receive an availability report and lens recommendation directly by email.",
    },
    {
      num: "05",
      title: "Simple Checkout",
      desc: "Activate your €29/month subscription with free EU delivery and complete coverage.",
    },
    {
      num: "06",
      title: "Fulfillment & Care",
      desc: "Your custom eyewear is delivered upon completion, backed by up to 3 contractual replacement requests per year.",
    },
  ];

  return (
    <section id="journey" className="py-16 md:py-24 border-b border-border/60 bg-background">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-[10.5px] font-mono uppercase tracking-widest text-primary font-bold">
            {t("Transparent Workflow")}
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-2">
            {t("The Lensly Customer Journey")}
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {t("Designed from the ground up to eliminate hesitation. You know exactly whether your frame and lenses work before committing a single euro.")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
          {steps.map((s) => (
            <div
              key={s.num}
              className="p-6 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between hover:border-primary/30 transition"
            >
              <div>
                <span className="font-mono text-xs font-bold text-primary">{s.num}</span>
                <h3 className="font-display font-bold text-sm text-foreground mt-2">{t(s.title)}</h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{t(s.desc)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <button
            type="button"
            onClick={onOpenFrameModal}
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md hover:bg-primary/95 transition inline-flex items-center gap-2 cursor-pointer"
          >
            <span>{t("Start Free Frame & Prescription Review")}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

function ProductGallery({ onOpenFrameModal }: { onOpenFrameModal: () => void }) {
  const { t } = useLanguage();

  const styles = [
    {
      name: "The Classic Acetate",
      desc: "Handcrafted tortoiseshell frame with durable metal inner core. Suitable for all face profiles.",
      tag: "Handcrafted Acetate",
      image: "/classic-acetate.png",
    },
    {
      name: "The Modern Gold",
      desc: "Ultra-lightweight round stainless steel frame with subtle warm gold finish.",
      tag: "Stainless Steel",
      image: "/modern-gold.png",
    },
    {
      name: "The Bold Black",
      desc: "Structured square frame in polished onyx resin with reinforced flexible hinges.",
      tag: "Polished Resin",
      image: "/bold-black.png",
    },
    {
      name: "The Crystal Clear",
      desc: "Minimalist translucent frame with soft keyhole bridge for comfortable all-day wear.",
      tag: "Transparent TR90",
      image: "/crystal-clear.png",
    },
  ];

  return (
    <section id="frames" className="py-16 md:py-24 border-b border-border/60 bg-background">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-[10.5px] font-mono uppercase tracking-widest text-primary font-bold">
            {t("Curated Styles")}
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-2">
            {t("Lensly Signature Frame Collection")}
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {t("Don't have an external frame in mind? Choose from our signature in-house collection, all fitted with custom German-surfaced lenses.")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          {styles.map((style, idx) => (
            <div
              key={idx}
              className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:border-primary/20 transition group flex flex-col justify-between"
            >
              <div className="aspect-[4/3] overflow-hidden bg-muted/30 p-6 flex items-center justify-center relative">
                <img
                  src={style.image}
                  alt={style.name}
                  className="w-full h-full object-contain transition duration-300 group-hover:scale-105"
                />
                <span className="absolute top-3 left-3 bg-primary/95 text-primary-foreground text-[8px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full shadow-xs">
                  {t(style.tag)}
                </span>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-display font-bold text-sm text-foreground">{t(style.name)}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t(style.desc)}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-border/40 text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>{t("Lab Surfacing Included")}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/frames"
            className="px-5 py-2.5 rounded-xl border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted transition"
          >
            {t("Explore All 10 Signature Frames →")}
          </Link>
          <button
            type="button"
            onClick={onOpenFrameModal}
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/95 transition cursor-pointer"
          >
            {t("Request Sourcing for an Outside Frame")}
          </button>
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  const { t } = useLanguage();
  const plan = CURRENT_PLAN;
  const annualTotal = getAnnualTotal(plan);
  const dailyEq = getDailyEquivalent(plan);

  return (
    <section id="pricing" className="py-16 md:py-24 border-b border-border/60 bg-[var(--mint)]/20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-[10.5px] font-mono uppercase tracking-widest text-primary font-bold">
            {t("Transparent Pricing")}
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-2">
            {t("One Clear Plan. No Hidden Fees.")}
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {t("All premium coatings, annual complete pairs, and accidental replacements bundled into one predictable rate.")}
          </p>
        </div>

        <div className="max-w-lg mx-auto rounded-3xl border-2 border-primary bg-card p-6 sm:p-9 shadow-xl relative text-left">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-foreground shadow-sm">
            {t(plan.name)}
          </div>

          <div className="flex items-baseline justify-between border-b border-border/60 pb-5">
            <div>
              <p className="text-xs uppercase font-mono tracking-wider text-muted-foreground">
                {t("Monthly Subscription")}
              </p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="font-display text-4xl sm:text-5xl font-bold text-primary">
                  {formatEur(plan.monthlyPrice)}
                </span>
                <span className="text-xs text-muted-foreground font-medium">{t("/ month")}</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-semibold text-emerald-600">
                {dailyEq} {t("/ day")}
              </span>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {annualTotal} € {t("annual commitment")}
              </p>
            </div>
          </div>

          {/* Features */}
          <ul className="mt-6 space-y-3 text-xs text-foreground/90">
            {(plan.includedServices || []).map((feature: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>{t(feature)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 pt-5 border-t border-border/60 space-y-2 text-center">
            <Link
              to="/checkout"
              className="block w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs sm:text-sm shadow-md hover:bg-primary/95 transition text-center"
            >
              {t("Subscribe to Lensly Care")}
            </Link>
            <p className="text-[10px] text-muted-foreground">
              {t("Secure recurring payments via Stripe SEPA Debit or Card. Minimum 12-month duration, monthly cancelable thereafter.")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function InclusionsSection() {
  const { t } = useLanguage();

  return (
    <section className="py-16 md:py-24 border-b border-border/60 bg-background">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-[10.5px] font-mono uppercase tracking-widest text-primary font-bold">
            {t("All-Inclusive Standard")}
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-2">
            {t("What Is Included in Your Lensly Plan")}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          <div className="p-5 rounded-2xl border border-border bg-card shadow-xs">
            <Package className="w-6 h-6 text-primary mb-3" />
            <h3 className="font-display font-bold text-sm text-foreground">{t("Annual Complete Pair")}</h3>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              {t("Every 12 months you receive a complete new pair with updated prescription values and your choice of frame.")}
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-border bg-card shadow-xs">
            <RefreshCw className="w-6 h-6 text-primary mb-3" />
            <h3 className="font-display font-bold text-sm text-foreground">{t("Up to 3 Replacements")}</h3>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              {t("Broken frames, deep scratches, or prescribed diopter changes within the year are covered up to three times per plan terms.")}
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-border bg-card shadow-xs">
            <Sparkles className="w-6 h-6 text-primary mb-3" />
            <h3 className="font-display font-bold text-sm text-foreground">{t("All Premium Coatings")}</h3>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              {t("Anti-reflective, scratch-resistant hard coating, easy-clean hydrophobic seal, and 100% UV-400 protection.")}
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-border bg-card shadow-xs">
            <ShieldCheck className="w-6 h-6 text-primary mb-3" />
            <h3 className="font-display font-bold text-sm text-foreground">{t("Free EU Delivery")}</h3>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              {t("Insured climate-neutral shipping across all European Union member states directly to your mailbox.")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ReplacementCareSection() {
  const { t } = useLanguage();

  return (
    <section className="py-16 md:py-24 border-b border-border/60 bg-muted/10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center text-left">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider bg-primary/10 text-primary font-semibold">
              <RefreshCw className="w-3 h-3" />
              <span>{t("Accident & Damage Coverage")}</span>
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {t("How Accidental Replacements Work")}
            </h2>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {t("Eyewear accidents happen. If you accidentally step on your frame, scratch a lens, or your optometrist diagnoses a change in cylinder power within your subscription year:")}
            </p>

            <ol className="text-xs text-muted-foreground space-y-2 list-decimal pl-4">
              <li>
                <strong className="text-foreground">{t("Notify Lensly:")}</strong> {t("Send a quick email or request replacement via your customer portal.")}
              </li>
              <li>
                <strong className="text-foreground">{t("Lab Production:")}</strong> {t("We immediately machine a replacement pair with your recorded prescription.")}
              </li>
              <li>
                <strong className="text-foreground">{t("Zero Co-Pay:")}</strong> {t("Up to three replacement incidents per contract year carry zero repair or lens surcharges.")}
              </li>
            </ol>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-md text-left space-y-3">
              <span className="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
                {t("Coverage Comparison")}
              </span>
              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-lg border border-border/80 bg-muted/20">
                  <p className="font-semibold text-foreground">{t("Traditional Retail Purchase:")}</p>
                  <p className="text-muted-foreground text-[11px] mt-0.5">
                    {t("Breakage or scratches usually require a completely new purchase at full retail price.")}
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
                  <p className="font-semibold text-primary">{t("Lensly Continuous Care:")}</p>
                  <p className="text-muted-foreground text-[11px] mt-0.5">
                    {t("Up to 3 replacement requests per contract year are included in the regular rate of €29/month (per plan terms).")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustAndPrivacySection() {
  const { t } = useLanguage();

  return (
    <section className="py-16 md:py-24 border-b border-border/60 bg-background">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-[10.5px] font-mono uppercase tracking-widest text-primary font-bold">
            {t("Data Minimization & Compliance")}
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-2">
            {t("German Privacy & Sensitive Medical Data Standards")}
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {t("Your prescription and visual health data are treated with strict purpose limitation under the European General Data Protection Regulation (GDPR / DSGVO).")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-5 rounded-2xl border border-border bg-card">
            <Lock className="w-5 h-5 text-primary mb-2.5" />
            <h3 className="font-display font-bold text-sm text-foreground">{t("Encrypted Transmission")}</h3>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              {t("All prescription documents and customer details are transmitted through TLS-encrypted channels directly to verified opticians.")}
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-border bg-card">
            <Eye className="w-5 h-5 text-primary mb-2.5" />
            <h3 className="font-display font-bold text-sm text-foreground">{t("Purpose-Specific Use")}</h3>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              {t("Prescription data are accessed solely by optical technicians for lens surfacing. Never sold, never shared with advertising networks.")}
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-border bg-card">
            <ShieldCheck className="w-5 h-5 text-primary mb-2.5" />
            <h3 className="font-display font-bold text-sm text-foreground">{t("Right of Erasure")}</h3>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              {t("Under Art. 17 DSGVO, you retain full rights to request complete deletion of uploaded prescriptions and personal records at any time.")}
            </p>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-muted-foreground flex flex-wrap items-center justify-center gap-4">
          <Link to="/datenschutz" className="underline hover:text-foreground">
            {t("Datenschutzerklärung (Privacy Policy)")}
          </Link>
          <span>•</span>
          <Link to="/agb" className="underline hover:text-foreground">
            {t("Allgemeine Geschäftsbedingungen (Terms)")}
          </Link>
          <span>•</span>
          <Link to="/impressum" className="underline hover:text-foreground">
            {t("Impressum (Legal Notice)")}
          </Link>
        </div>
      </div>
    </section>
  );
}

function PartnerOpticianSection() {
  const { t } = useLanguage();

  return (
    <section className="py-16 md:py-24 border-b border-border/60 bg-muted/15">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-[10.5px] font-mono uppercase tracking-widest text-primary font-bold">
            {t("Certified Optical Infrastructure")}
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-2">
            {t("Direct Lab Surfacing Without High Street Markup")}
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {t("How Lensly achieves €29/month: We bypass expensive retail real estate and collaborate directly with certified optical finishing labs equipped with CNC edgers and digital wavefront surfacing machinery.")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
          <div className="p-6 rounded-2xl border border-border bg-card">
            <Building2 className="w-6 h-6 text-primary mb-3" />
            <h3 className="font-display font-bold text-base text-foreground">
              {t("Precision Manufacturing & Quality Control")}
            </h3>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              {t("After verifying your prescription details, the lenses are custom-ground for your chosen frame, anti-reflective coated, and subjected to careful optical quality control before shipping.")}
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card">
            <Eye className="w-6 h-6 text-primary mb-3" />
            <h3 className="font-display font-bold text-base text-foreground">
              {t("Prescription & PD Measurements")}
            </h3>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              {t("Need a recent eye test or pupillary distance measurement? Any ophthalmologist or local optometrist can issue an updated prescription pass, which you can easily photograph and upload.")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "Can I really send a link or screenshot of any frame I find?",
      a: "Yes. You can share a product link, model number, or clear photo from any store or designer brand. Our team checks whether genuine distributor stock is available and whether the frame dimensions support your prescription before you pay.",
    },
    {
      q: "What happens before I pay?",
      a: "Nothing is charged upfront. You submit the frame details and your prescription values. We verify optical compatibility and frame availability. Only once verified do you receive a link to activate your Lensly Care subscription.",
    },
    {
      q: "What if I have strong diopters or high astigmatism?",
      a: "We fulfill prescriptions across common minus, plus, and cylinder ranges. For stronger powers (e.g. above +/-4.00 dpt or high cylinder), our lab reviews whether high-index lenses are required to keep the edge profile clean and comfortable.",
    },
    {
      q: "How does the annual replacement benefit work?",
      a: "Your subscription includes up to 3 replacements per contract year for accidental breakage, severe scratches, or doctor-verified prescription changes. Simply notify our support team with photos to initiate production.",
    },
    {
      q: "What is the contract duration and cancellation policy?",
      a: "The initial contract commitment is 12 months (€29/month = €348/year). After the initial 12 months, your plan automatically renews on a flexible monthly basis, cancelable at any time with statutory 30-day notice via our online cancellation portal.",
    },
    {
      q: "Does statutory health insurance (GKV) cover the costs?",
      a: "Reimbursement by statutory health insurance is only possible in specific legally defined cases and depends on individual requirements. Please verify coverage with your insurance provider in advance.",
    },
    {
      q: "How do I measure my Pupillary Distance (PD)?",
      a: "Your PD is often listed on your optical pass (Brillenpass) or prescription sheet from your eye doctor or optician. Alternatively, visit any optical practice for a quick PD millimeter reading before ordering.",
    },
  ];

  return (
    <section id="faq" className="py-16 md:py-24 border-b border-border/60 bg-background">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="text-center mb-12">
          <p className="text-[10.5px] font-mono uppercase tracking-widest text-primary font-bold">
            {t("Answers & Clarity")}
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-2">
            {t("Frequently Asked Questions")}
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="overflow-hidden rounded-xl border border-border bg-card transition"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between p-4 sm:p-5 text-left text-xs sm:text-sm font-semibold text-foreground hover:bg-muted/40 transition cursor-pointer"
                >
                  <span>{t(faq.q)}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${
                      isOpen ? "rotate-180 text-primary" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs text-muted-foreground leading-relaxed border-t border-border/40 pt-3">
                    {t(faq.a)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FinalCta({ onOpenFrameModal }: { onOpenFrameModal: () => void }) {
  const { t } = useLanguage();

  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-background to-primary/5 text-center">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          {t("Ready to experience hassle-free vision care?")}
        </h2>
        <p className="mt-4 text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
          {t("Send us your favorite frame link or screenshot. We’ll review availability and your prescription values before you pay a single euro.")}
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <button
            type="button"
            onClick={onOpenFrameModal}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs sm:text-sm shadow-md hover:bg-primary/95 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{t("Check My Frame & Prescription")}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <Link
            to="/checkout"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl border border-border bg-card text-foreground font-semibold text-xs sm:text-sm hover:bg-muted transition"
          >
            {t("Subscribe Directly")}
          </Link>
        </div>
      </div>
    </section>
  );
}

export function Footer({ onContactClick }: { onContactClick?: () => void }) {
  const { t } = useLanguage();

  return (
    <footer className="bg-card border-t border-border/60 text-muted-foreground text-xs">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-8 border-b border-border/60">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <LensMark />
              <span className="font-display font-bold text-foreground text-sm">Lensly.care</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {t("Prescription eyewear subscription & pre-payment frame verification.")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <a
              href="mailto:support@lensly.care"
              className="text-primary hover:underline font-medium"
            >
              support@lensly.care
            </a>
            <span>•</span>
            <button
              type="button"
              onClick={onContactClick}
              className="text-foreground hover:text-primary transition cursor-pointer"
            >
              {t("Contact Specialist")}
            </button>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-muted-foreground">
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/impressum" className="hover:text-foreground transition">
              {t("Impressum")}
            </Link>
            <Link to="/datenschutz" className="hover:text-foreground transition">
              {t("Datenschutz")}
            </Link>
            <Link to="/agb" className="hover:text-foreground transition">
              {t("AGB")}
            </Link>
            <Link to="/withdraw" className="hover:text-foreground transition">
              {t("Widerrufsrecht")}
            </Link>
            <Link to="/cancel" className="hover:text-foreground transition">
              {t("Vertrag hier kündigen (§ 312k BGB)")}
            </Link>
          </div>

          <p>{t("© 2026 Lensly. All rights reserved.")}</p>
        </div>
      </div>
    </footer>
  );
}
