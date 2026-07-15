import { createFileRoute } from "@tanstack/react-router";
import { useLanguage } from "../lib/i18n";
import { Nav, Footer } from "./index";

export const Route = createFileRoute("/frames")({
  head: () => ({
    meta: [
      { title: "Signature Frames | Lensly" },
      {
        name: "description",
        content: "Explore the full collection of signature Lensly Care eyewear frames, CE certified and fitted with premium lenses.",
      },
    ],
  }),
  component: FramesPage,
});

function FramesPage() {
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
    },
    {
      name: t("The Vintage Tortoise"),
      desc: t("Classic round keyhole tortoiseshell eyeglass frame in warm amber. Timeless styling with double rivet details."),
      tag: t("Keyhole Acetate"),
      image: "/vintage-tortoise.png"
    },
    {
      name: t("The Minimalist Silver"),
      desc: t("Ultra-fine surgical stainless steel frames in brushed platinum silver. Sleek, near-weightless profile."),
      tag: t("Brushed Steel"),
      image: "/minimalist-silver.png"
    },
    {
      name: t("The Chic Cat-Eye"),
      desc: t("Feminine winged silhouette in high-gloss piano black. A sophisticated retro statement piece."),
      tag: t("Gloss Acetate"),
      image: "/chic-cateye.png"
    },
    {
      name: t("The Clear Peach"),
      desc: t("Translucent champagne-peach rounded frames with delicate silver temple cores. Soft, warm skin-tone palette."),
      tag: t("Crystal TR90"),
      image: "/clear-peach.png"
    },
    {
      name: t("The Retro Aviator"),
      desc: t("Sleek double-bridge silver aviator prescription spectacles. A striking combination of utility and high-end design."),
      tag: t("Stainless Aviator"),
      image: "/retro-aviator.png"
    },
    {
      name: t("The Gunmetal Square"),
      desc: t("Professional gunmetal grey rectangular frame. Lightweight titanium temples with structured modern lines."),
      tag: t("Gunmetal Alloy"),
      image: "/gunmetal-square.png"
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <div>
        <Nav />
        <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <div className="text-center mb-10 md:mb-16">
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {t("Signature Eyewear Collection")}
            </h1>
            <p className="mt-3 text-xs sm:text-sm text-muted-foreground uppercase tracking-wider font-semibold">
              {t("10 premium frame options - CE-certified German lenses included")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
                    <p className="text-[10.5px] sm:text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
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

          {/* Custom Frame Request Banner */}
          <div className="mt-12 max-w-xl mx-auto bg-gradient-to-br from-primary/5 to-teal-500/5 border border-primary/10 rounded-2xl p-5 sm:p-7 text-center">
            <h3 className="font-display font-semibold text-xs sm:text-[14px] text-foreground tracking-tight mb-2">
              {t("Looking for a different style?")}
            </h3>
            <p className="text-[11.5px] sm:text-xs text-muted-foreground leading-relaxed">
              {t("If you want any frame outside our signature collection, just contact us via email. We can source almost any frame style and custom-fit your premium German lenses - free of charge.")}
            </p>
            <div className="mt-4">
              <a
                href="https://mail.google.com/mail/?view=cm&fs=1&to=hello@lensly.care&su=Custom%20Frame%20Request"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[10.5px] sm:text-xs font-bold uppercase tracking-wider text-primary-foreground hover:opacity-95 shadow-sm shadow-primary/10 transition cursor-pointer"
              >
                <span>{t("Request Custom Frame")}</span>
              </a>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
