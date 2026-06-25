import { createFileRoute } from "@tanstack/react-router";
import { Nav, Footer } from "./index";
import { useLanguage } from "../lib/i18n";

export const Route = createFileRoute("/datenschutz")({
  head: () => ({
    meta: [
      { title: "Datenschutzerklärung | Lensly" },
      {
        name: "description",
        content: "Privacy policy and data storage information under GDPR compliance.",
      },
    ],
  }),
  component: Datenschutz,
});

function Datenschutz() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <div>
        <Nav />
        <main className="mx-auto max-w-3xl px-6 py-16">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl mb-8">
            {t("Datenschutzerklärung")}
          </h1>

          <div className="space-y-8 text-sm leading-relaxed text-muted-foreground select-text">
            {/* 1. Controller */}
            <section className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                {t("1. Name und Anschrift des Verantwortlichen")}
              </h2>
              <p>
                {t("Der Verantwortliche im Sinne der Datenschutz-Grundverordnung (DSGVO) und anderer nationaler Datenschutzgesetze ist:")}
              </p>
              <div className="font-medium text-foreground pl-4 border-l-2 border-primary/20">
                <p>Lensly UG (haftungsbeschränkt) i.Gr.</p>
                <p>Königsallee 14</p>
                <p>40212 Düsseldorf</p>
                <p>Germany</p>
                <p>{t("E-Mail:")} hello@lensly.care</p>
              </div>
            </section>

            {/* 2. Collection & Processing */}
            <section className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                {t("2. Erhebung und Speicherung personenbezogener Daten")}
              </h2>
              <p>
                {t("Beim Abschluss eines Abonnements erheben wir folgende Daten:")}
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>{t("Name, Vorname")}</li>
                <li>{t("E-Mail-Adresse")}</li>
                <li>{t("Telefonnummer")}</li>
                <li>{t("Geburtsdatum & Geburtsort")}</li>
                <li>{t("Beruf")}</li>
                <li>{t("Liefer- und Rechnungsadresse")}</li>
                <li>{t("Zahlungsmethode (maskierte IBAN bei SEPA-Lastschrift)")}</li>
                <li>{t("Elektronische Unterschriftsdaten (Zeichnung oder getippter Name)")}</li>
              </ul>
            </section>

            {/* 3. Purpose & Legal Basis */}
            <section className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                {t("3. Zweck und Rechtsgrundlage der Verarbeitung")}
              </h2>
              <p>
                {t("Die Verarbeitung dieser Daten erfolgt zur Durchführung des Vertrages und Erbringung unserer Dienstleistung (Art. 6 Abs. 1 lit. b DSGVO).")}
              </p>
              <p>
                {t("Zusätzlich verarbeiten wir Ihre E-Mail-Adresse, um Ihnen vertragsrelevante Bestätigungen und Updates zuzusenden.")}
              </p>
            </section>

            {/* 4. Stripe and Third parties */}
            <section className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                {t("4. Weitergabe von Daten an Dritte")}
              </h2>
              <p>
                {t("Eine Weitergabe Ihrer Daten erfolgt nur an Dienstleister, die uns bei der Vertragserfüllung unterstützen (z.B. Versanddienstleister für die Zustellung der Brillen).")}
              </p>
              <p>
                {t("Zahlungen werden über den Zahlungsdienstleister Stripe Payments Europe, Ltd. abgewickelt. Ihre echten Kreditkarten- oder Bankdaten werden direkt bei Stripe verarbeitet und nicht auf unseren Servern gespeichert.")}
              </p>
            </section>

            {/* 5. Retention */}
            <section className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                {t("5. Speicherdauer")}
              </h2>
              <p>
                {t("Wir speichern Ihre Daten so lange, wie es für die Vertragserfüllung erforderlich ist, bzw. so lange gesetzliche Aufbewahrungsfristen (z.B. handels- und steuerrechtliche Vorgaben nach HGB/AO von bis zu 10 Jahren) dies vorschreiben.")}
              </p>
            </section>

            {/* 6. Rights */}
            <section className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                {t("6. Ihre Rechte (Betroffenenrechte)")}
              </h2>
              <p>
                {t("Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16 DSGVO), Löschung (Art. 17 DSGVO), Einschränkung der Verarbeitung (Art. 18 DSGVO) sowie das Recht auf Datenübertragbarkeit (Art. 20 DSGVO).")}
              </p>
              <p>
                {t("Zudem steht Ihnen ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde zu (Art. 77 DSGVO).")}
              </p>
            </section>

            {/* 7. Contact */}
            <section className="border-t border-border/60 pt-6 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                {t("Kontakt für Datenschutzanfragen")}
              </h2>
              <p>
                {t("Wenn Sie Auskunft über Ihre Daten wünschen oder die Löschung beantragen möchten, schreiben Sie uns an:")}{" "}
                <a
                  href="mailto:hello@lensly.care"
                  className="text-primary hover:underline font-medium"
                >
                  hello@lensly.care
                </a>
              </p>
            </section>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
