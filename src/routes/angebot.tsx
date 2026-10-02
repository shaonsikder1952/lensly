import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useLanguage } from "../lib/i18n";
import { Nav, Footer, LensMark } from "./index";
import { FrameRequestModal } from "../components/frame-request-modal";
import {
  ShieldCheck,
  Check,
  ArrowRight,
  Sparkles,
  Glasses,
  Eye,
  RefreshCw,
  Lock,
  ChevronDown,
} from "lucide-react";

export const Route = createFileRoute("/angebot")({
  head: () => ({
    meta: [
      {
        title: "Wunschfassung gefunden? Jetzt unverbindlich prüfen | Lensly.care",
      },
      {
        name: "description",
        content:
          "Deine Wunschfassung woanders entdeckt? Schicke uns den Link oder ein Foto. Wir prüfen Verfügbarkeit und Sehstärke vor der Zahlung. €29/Monat.",
      },
      {
        property: "og:title",
        content: "Lensly — Wunschfassung finden, vorab prüfen, im Abo tragen",
      },
      {
        property: "og:description",
        content:
          "Kostenlose Prüfung vor der Zahlung. Wir ermitteln Verfügbarkeit und Passgenauigkeit für Ihre Korrektionswerte.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://lensly.care/angebot" },
    ],
  }),
  component: AngebotPage,
});

function AngebotPage() {
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "Wie funktioniert die kostenlose Prüfung vor der Zahlung?",
      a: "Sie senden uns den Link, das Modell oder ein Foto Ihrer Wunschfassung zusammen mit Ihren Brillenwerten. Unser optisches Fachteam prüft Verfügbarkeit, Zentriermaße und Glasdicken. Erst wenn alles technisch passt, erhalten Sie die Möglichkeit zur Vertragsaktivierung.",
    },
    {
      q: "Welche Kosten fallen an?",
      a: "Die Vorabprüfung ist vollkommen kostenlos. Bei Aktivierung gilt unser transparenter Tarif von €29,00 pro Monat bei einer Mindestvertragslaufzeit von 12 Monaten (Gesamtverpflichtung: €348,00 im 1. Jahr). Danach ist der Vertrag monatlich mit 30 Tagen Frist kündbar.",
    },
    {
      q: "Übernimmt die gesetzliche Krankenkasse (GKV) die Kosten?",
      a: "Eine Erstattung durch die gesetzliche Krankenkasse ist nur in bestimmten gesetzlich vorgesehenen Fällen möglich und hängt von den individuellen Voraussetzungen ab. Bitte klären Sie die Erstattungsfähigkeit vorab mit Ihrer Krankenkasse.",
    },
    {
      q: "Was geschieht bei Beschädigung oder Sehstärkenänderung?",
      a: "Ihr Tarif umfasst ein Kontingent von bis zu drei Ersatzanfragen pro Vertragsjahr für Bruch, tiefe Glaskratzer oder ärztlich verordnete Sehstärkenänderungen gemäß den geltenden Tarifbedingungen.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary/20 selection:text-primary">
      <div>
        <Nav onOpenFrameModal={() => setIsModalOpen(true)} />

        <main>
          {/* Focused Hero */}
          <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-background via-background to-[var(--mint)]/20 py-16 md:py-24">
            <div className="pointer-events-none absolute inset-0 grid-bg opacity-35" />
            <div className="relative mx-auto max-w-4xl px-4 sm:px-6 text-center">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider bg-primary/10 text-primary font-semibold mb-6 border border-primary/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Kostenlose Prüfung vor der Zahlung</span>
              </div>

              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
                Deine Wunschfassung gefunden?{" "}
                <span className="shimmer-text">Schicke sie an Lensly.</span>
              </h1>

              <p className="mt-5 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                Sende uns einfach den Link oder einen Screenshot deiner Lieblingsbrille.
                Wir prüfen Verfügbarkeit und Sehstärke vor der Zahlung.
              </p>

              {/* Primary Action Button */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:bg-primary/95 transition flex items-center justify-center gap-2 cursor-pointer group"
                >
                  <Glasses className="w-4 h-4" />
                  <span>Wunschfassung & Sehstärke prüfen</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="mt-8 pt-6 border-t border-border/40 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground font-medium">
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-primary" />
                  0 € Vorab-Kosten
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-primary" />
                  Prüfung vor Kaufabschluss
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-primary" />
                  Monatlich kündbar nach 12 Monaten
                </span>
              </div>
            </div>
          </section>

          {/* Pain Point vs Lensly Mechanism */}
          <section className="py-16 md:py-20 border-b border-border/60 bg-background">
            <div className="mx-auto max-w-4xl px-4 sm:px-6">
              <div className="text-center max-w-xl mx-auto mb-12">
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  Brillenkauf neu gedacht
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Kein Vorab-Zwang. Erst die Sicherheit, dass Werte und Fassung harmonieren.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl border border-border bg-card/60 space-y-3">
                  <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                    Der herkömmliche Weg
                  </span>
                  <ul className="text-xs text-muted-foreground space-y-2 leading-relaxed">
                    <li>• Hohe Einmalinvestition vor dem ersten Tragen</li>
                    <li>• Unsicherheit bei individuellen Glasdicken und Zentrierwerten</li>
                    <li>• Volle Nachkaufkosten bei Bruch oder Kratzern</li>
                  </ul>
                </div>

                <div className="p-6 rounded-2xl border border-primary/30 bg-primary/[0.02] shadow-xs space-y-3">
                  <span className="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
                    Der Lensly Weg
                  </span>
                  <ul className="text-xs text-foreground space-y-2 leading-relaxed font-medium">
                    <li>✓ Kostenlose Vorab-Prüfung von Werten & Fassung</li>
                    <li>✓ Planbare €29/Monat inklusive Gläser und Entspiegelung</li>
                    <li>✓ Bis zu 3 Ersatzanfragen pro Vertragsjahr bei Beschädigung</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* 3-Step Process */}
          <section className="py-16 md:py-20 border-b border-border/60 bg-muted/10">
            <div className="mx-auto max-w-4xl px-4 sm:px-6">
              <div className="text-center max-w-xl mx-auto mb-12">
                <p className="text-xs font-mono uppercase tracking-widest text-primary font-bold">
                  In 3 einfachen Schritten
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-2">
                  So funktioniert der Check
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                <div className="p-6 rounded-2xl border border-border bg-card">
                  <span className="font-mono text-xs font-bold text-primary">01</span>
                  <h3 className="font-display font-bold text-sm text-foreground mt-2">Fassung & Werte senden</h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    Link oder Screenshot hochladen und Brillenwerte angeben oder Brillenpass fotografieren.
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-border bg-card">
                  <span className="font-mono text-xs font-bold text-primary">02</span>
                  <h3 className="font-display font-bold text-sm text-foreground mt-2">Kostenlose Prüfung</h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    Unsere Fachexperten prüfen die technische Machbarkeit vor der Zahlung.
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-border bg-card">
                  <span className="font-mono text-xs font-bold text-primary">03</span>
                  <h3 className="font-display font-bold text-sm text-foreground mt-2">Aktivieren & Erhalten</h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    Nach Bestätigung aktivieren Sie die Mitgliedschaft für €29/Monat und erhalten Ihre verglaste Brille.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Transparent Pricing Breakdown Box */}
          <section className="py-16 md:py-20 border-b border-border/60 bg-background">
            <div className="mx-auto max-w-xl px-4 sm:px-6">
              <div className="p-6 sm:p-8 rounded-2xl border border-border bg-card shadow-sm text-left space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div>
                    <h3 className="font-display font-bold text-base text-foreground">Lensly Care Mitgliedschaft</h3>
                    <p className="text-xs text-muted-foreground">Vollständige Sehhilfe inklusive Schutz</p>
                  </div>
                  <span className="text-base font-bold text-primary">€29,00 / Monat</span>
                </div>

                <ul className="text-xs text-muted-foreground space-y-2">
                  <li className="flex justify-between">
                    <span>Mindestvertragslaufzeit:</span>
                    <span className="font-semibold text-foreground">12 Monate</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Gesamtverpflichtung im 1. Jahr:</span>
                    <span className="font-semibold text-foreground">€348,00 (€29 × 12 Monate)</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Verlängerung:</span>
                    <span className="text-foreground">Monatlich flexibel nach Ablauf</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Kündigungsfrist:</span>
                    <span className="text-foreground">30 Tage</span>
                  </li>
                </ul>

                <div className="pt-3 border-t border-border/60 text-[11px] text-muted-foreground space-y-2">
                  <p>
                    <strong className="text-foreground">Kostenlose Prüfung vor der Zahlung:</strong> Die Vorabprüfung Ihrer Fassung und Sehstärke verpflichtet zu keinem Kauf.
                  </p>
                  <p className="bg-muted/40 p-3 rounded-lg border border-border/40">
                    <strong>Krankenkassen-Hinweis:</strong> Eine Erstattung durch die gesetzliche Krankenkasse ist nur in bestimmten gesetzlich vorgesehenen Fällen möglich und hängt von den individuellen Voraussetzungen ab. Bitte klären Sie die Erstattungsfähigkeit vorab mit Ihrer Krankenkasse.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md hover:bg-primary/95 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Jetzt Wunschfassung kostenlos prüfen</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Focused FAQ */}
          <section className="py-16 md:py-20 border-b border-border/60 bg-muted/10">
            <div className="mx-auto max-w-2xl px-4 sm:px-6">
              <div className="text-center mb-10">
                <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
                  Häufige Fragen
                </h2>
              </div>

              <div className="space-y-3">
                {faqs.map((faq, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div
                      key={idx}
                      className="overflow-hidden rounded-xl border border-border bg-card transition"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        className="flex w-full items-center justify-between p-4 text-left text-xs sm:text-sm font-semibold text-foreground hover:bg-muted/40 transition cursor-pointer"
                      >
                        <span>{faq.q}</span>
                        <ChevronDown
                          className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${
                            isOpen ? "rotate-180 text-primary" : ""
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 text-xs text-muted-foreground leading-relaxed border-t border-border/40 pt-3">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </main>
      </div>

      <Footer />

      <FrameRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
