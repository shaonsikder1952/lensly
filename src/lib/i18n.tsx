import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "en" | "de" | "fr" | "es" | "it";

interface LanguageContextProps {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (text: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

// Premium manual translations as seeds for instant loading
const initialTranslations: Record<Language, Record<string, string>> = {
  en: {},
  de: {
    "Start for €29/mo": "Starten für 29 €/Monat",
    "One plan · €29 / month": "Ein Tarif · 29 € / Monat",
    "New glasses every ": "Jedes Jahr neue ",
    "year.": "Brille.",
    "Fresh prescription glasses delivered to your door every year. Break them or need a new prescription? Three free replacements included. No optician visits, no surprise costs.":
      "Frische Korrekturbrillen jedes Jahr an Ihre Tür geliefert. Beschädigt oder neues Rezept nötig? Drei kostenlose Ersatzgläser inklusive. Keine Optikerbesuche, keine Überraschungskosten.",
    "See the plan": "Tarif ansehen",
    "Premium Optical Lenses": "Premium Brillengläser",
    "Free EU-Wide Shipping": "Kostenloser EU-Versand",
    "Secure Stripe Checkout": "Sicherer Stripe-Checkout",
    "Traditional optician": "Herkömmlicher Optiker",
    "Upfront · 1 pair · no free replacements": "Einmalig · 1 Brille · kein kostenloser Ersatz",
    "Wait 2–3 years to save up money and buy again":
      "2–3 Jahre warten, um Geld zu sparen und neu zu kaufen",
    "Accidental replacements cost full retail price": "Unfall-Ersatz kostet den vollen Ladenpreis",
    "Coatings & high-index lenses billed as extras": "Beschichtungen & dünne Gläser kosten extra",
    "Outdated prescription within 12 months": "Veraltete Sehstärke innerhalb von 12 Monaten",
    "Lensly Care": "Lensly Care",
    "less than a daily coffee": "weniger als ein täglicher Kaffee",
    "1 new pair of precision lenses every year": "1 neues Paar Präzisionsgläser jedes Jahr",
    "3 free replacements (broken, power change? We got you covered)":
      "3 kostenlose Ersatzgläser (beschädigt, Sehstärke geändert? Wir helfen)",
    "Premium lenses, anti-reflective & UV-400 coatings included":
      "Premium-Gläser, Entspiegelung & UV-400 inklusive",
    "Free shipping EU-wide · minimum 1 year contract":
      "Kostenloser EU-Versand · Mindestlaufzeit 1 Jahr",
    "What's next?": "Wie geht es weiter?",
    "To start your plan, subscribe to Lensly Care. Once payment is complete, our team will contact you to select your frames and collect your prescription or doctor's report.":
      "Um Ihren Tarif zu starten, abonnieren Sie Lensly Care. Nach der Zahlung meldet sich unser Team bei Ihnen, um Gestelle auszuwählen und Ihr Rezept einzuholen.",
    "Subscribe to Lensly Care": "Lensly Care abonnieren",
    "Sign Contract": "Vertrag unterzeichnen",
    "Pay & Subscribe": "Zahlungspflichtig abonnieren",
    "Minimum term 12 months, billing €29 monthly, automatic renewal with monthly cancellation thereafter.":
      "Mindestlaufzeit 12 Monate, Abrechnung 29 € monatlich, danach automatische Verlängerung mit monatlicher Kündigungsmöglichkeit.",
    "I agree to the Terms of Service, the 12-month contract lock-in, and the custom-lens refund rules.":
      "Ich stimme den Allgemeinen Geschäftsbedingungen (AGB), der 12-monatigen Mindestvertragslaufzeit und den Erstattungsrichtlinien für maßgefertigte Gläser zu.",
    "Bank Transfer (SEPA Direct Debit)": "Lastschrift (SEPA-Lastschrift)",
    "Express Wallet (Apple Pay / Google Pay)": "Express-Wallet (Apple Pay / Google Pay)",
    "Vertrag hier kündigen": "Vertrag hier kündigen",
    "Vertrag widerrufen": "Vertrag widerrufen",
    "Kündigung bestätigen": "Kündigung bestätigen",
    "Widerruf bestätigen": "Widerruf bestätigen",
    "Secure checkout via Stripe": "Sicherer Checkout über Stripe",
    "Traditional optician (4 pairs)": "Herkömmlicher Optiker (4 Brillen)",
    "Lensly subscription (€348/yr)": "Lensly-Abo (348 €/Jahr)",
    "Saved per year with replacements": "Jährliche Ersparnis mit Ersatz",
    "Lensly vs. Glasses Insurance": "Lensly vs. Brillenversicherung",
    "Supplemental insurance plans look cheap upfront but often leave you with heavy out-of-pocket costs.":
      "Zusatzversicherungen wirken anfangs günstig, haben aber oft hohe Zuzahlungen.",
    "Glasses Insurance": "Brillenversicherung",
    "Standard supplemental policy": "Standard-Zusatzpolice",
    "Complete continuous vision plan": "Komplettes Sehversorgungs-Abo",
    "Covers 1 pair every 2 years": "Deckt 1 Brille alle 2 Jahre ab",
    "Replacements not covered": "Kein Ersatz bei Beschädigung",
    "Additional co-pays for premium lenses": "Zusatzkosten für Premium-Gläser",
    "1 complete pair delivered to you": "1 komplette Brille jährlich geliefert",
    "3 free replacements (broken, power change)":
      "3 kostenlose Ersatzgläser (beschädigt, Sehstärke)",
    "Nothing extra to pay ever": "Keine versteckten Zuzahlungen",
    "For any help or requests regarding subscription please contact at":
      "Bei Fragen oder Wünschen zu Ihrem Abonnement kontaktieren Sie uns bitte unter",
    "Max €150 allowance, you pay the remaining balance out of pocket":
      "Max. 150 € Zuschuss, den Rest zahlen Sie selbst aus eigener Tasche",
    "Accidental breakage or prescription changes cost 100% full retail price":
      "Unfallschäden oder Sehstärkenänderungen kosten 100 % des normalen Ladenpreises",
    "Anti-reflective, scratch-resistant coatings and high-index thinning cost €150+ extra":
      "Entspiegelung, Kratzschutz und dünnere Gläser kosten über 150 € extra",
    "Fully covered every single year, zero waiting periods":
      "Jedes Jahr voll abgedeckt, keinerlei Wartezeiten",
    "€0 out-of-pocket costs for prescription changes or accident replacements":
      "0 € Zuzahlung bei Sehstärkenänderung oder Unfallschäden",
    "Premium lenses, anti-reflective & UV-400 coatings are 100% included":
      "Premium-Gläser, Entspiegelung & UV-400 sind zu 100 % inklusive",
    "1 pair every 2 years": "1 Brille alle 2 Jahre",
    "pay €240 in premiums, get €150 back, lose €90 minimum":
      "240 € Beiträge zahlen, 150 € zurückerhalten, mindestens 90 € Verlust",
    "Break them once": "Ein beschädigtes Paar",
    "€400 out of pocket, not covered": "400 € aus eigener Tasche, nicht abgedeckt",
    "Need anti-reflective or thin lenses": "Entspiegelung oder dünne Gläser benötigt",
    "€150+ extra, not covered": "Über 150 € extra, nicht abgedeckt",
    "Prescription changes": "Änderung der Sehstärke",
    "full retail price, not covered": "Voller Ladenpreis, nicht abgedeckt",
    "Total realistic cost over 2 years: €800-1,200+":
      "Realistische Gesamtkosten über 2 Jahre: 800 - 1.200 €+",
    "Premiums + gaps + extras + one replacement": "Beiträge + Eigenanteil + Extras + ein Ersatz",
    "Flat €29/month, completely covered": "Flatrate 29 €/Monat, komplett abgedeckt",
    "Zero hidden fees, 1 pair per year and 3 replacements per year":
      "Keine versteckten Gebühren, 1 Brille pro Jahr und 3 Ersatzgläser pro Jahr",
    "€7-20/month": "7-20 €/Monat",
    "€29/month": "29 €/Monat",
    "Frequently Asked Questions": "Häufig gestellte Fragen (FAQ)",
    "Everything you need to know": "Alles, was Sie wissen müssen",
    "Who is behind Lensly?": "Wer steht hinter Lensly?",
    "Lensly is a small independent team focused on making quality prescription eyewear affordable and accessible across Europe. We work directly with certified optical labs to cut out retail markups.":
      "Lensly ist ein kleines, unabhängiges Team, das sich darauf konzentriert, hochwertige Korrektionsbrillen in ganz Europa erschwinglich und zugänglich zu machen. Wir arbeiten direkt mit zertifizierten Optiklaboren zusammen, um Händlerspannen zu vermeiden.",
    "Can I see frame options before subscribing?":
      "Kann ich die Brillengestelle vor dem Abonnement sehen?",
    "Yes. You choose any frame you like, from any brand, online shop, or store. Send us a photo or screenshot and we source it for you. No limitations.":
      "Ja. Sie können jedes beliebige Gestell wählen – von jeder Marke, aus jedem Online-Shop oder Ladengeschäft. Schicken Sie uns einfach ein Foto oder einen Screenshot und wir besorgen es für Sie. Keine Einschränkungen.",
    "What is the exact process for my first pair?":
      "Wie läuft der Prozess für meine erste Brille genau ab?",
    "1. Subscribe via Stripe": "1. Über Stripe abonnieren",
    "Select your plan and complete checkout securely.":
      "Wählen Sie Ihren Plan und schließen Sie den Checkout sicher ab.",
    "2. E-mail contact within 24 hours": "2. Kontakt per E-Mail innerhalb von 24 Stunden",
    "We reach out to gather your custom prescription details.":
      "Wir melden uns bei Ihnen, um die Details Ihres Brillenglaskonzepts zu erfassen.",
    "3. Send us prescription, pupillary distance & chosen frame":
      "3. Rezept, Pupillendistanz (PD) & Wunschgestell zusenden",
    "Simply reply with your values and a photo/screenshot of any frame you want.":
      "Antworten Sie einfach mit Ihren Werten und einem Foto/Screenshot des gewünschten Gestells.",
    "4. Sourcing & production": "4. Beschaffung & Anfertigung",
    "We purchase your frame and craft your custom lenses to specification.":
      "Wir erwerben Ihr Gestell und fertigen Ihre maßgeschneiderten Gläser nach Ihren Angaben an.",
    "5. Delivered to your door": "5. Lieferung direkt zu Ihnen",
    "Your finished prescription eyewear arrives in approximately 15 days.":
      "Ihre fertige Korrektionsbrille kommt in ca. 15 Tagen bei Ihnen an.",
    "How do I get my pupillary distance measured?": "Wie messe ich meine Pupillendistanz (PD)?",
    "Visit any local optician or doctor for a quick measurement. It takes 2 minutes and is usually free. Then just include it in your email to us.":
      "Besuchen Sie einen lokalen Optiker oder Augenarzt für eine schnelle Messung. Es dauert nur 2 Minuten und ist in der Regel kostenlos. Fügen Sie den Wert einfach Ihrer E-Mail an uns bei.",
    "What if my lenses are wrong?": "Was ist, wenn meine Gläser nicht stimmen?",
    "We send a replacement pair free of charge, no questions asked.":
      "Wir senden Ihnen kostenlos und ohne Rückfragen ein neues Paar zu.",
    "How do returns or refunds work?": "Wie funktionieren Rückgaben oder Rückerstattungen?",
    "If there is a production error on our side we fix it completely free. Custom prescription lenses cannot be refunded once produced, but we will always make it right.":
      "Bei Produktionsfehlern unsererseits beheben wir diese vollkommen kostenlos. Da es sich um maßgefertigte Korrektionsgläser handelt, ist eine Rückerstattung nach der Produktion ausgeschlossen, aber wir finden immer eine zufriedenstellende Lösung.",
    "Do I buy the frame or do you?": "Kaufe ich das Gestell selbst oder übernehmen Sie das?",
    "We source the frame for you based on your photo or screenshot. It is included in your subscription, nothing extra to pay.":
      "Wir beschaffen das Gestell basierend auf Ihrem Foto oder Screenshot für Sie. Es ist in Ihrem Abonnement enthalten – Sie müssen nichts extra bezahlen.",
    "Admin Dashboard": "Admin-Dashboard",
    Subscribers: "Abonnenten",
    "Total Subscriptions": "Abonnements gesamt",
    "Active Subscriptions": "Aktive Abonnements",
    "Total Terminated": "Gekündigt gesamt",
    Withdrawn: "Widerrufen",
    "Contract ID": "Vertrags-ID",
    Name: "Name",
    Email: "E-Mail",
    Payment: "Zahlung",
    "Signed At": "Unterzeichnet am",
    Status: "Status",
    Active: "Aktiv",
    Terminated: "Gekündigt",
    "Withdrawn Status": "Widerrufen",
    "Download PDF": "PDF herunterladen",
    "Search subscribers...": "Abonnenten suchen...",
    "No subscriptions found.": "Keine Abonnements gefunden.",
    "Loading dashboard data...": "Dashboard-Daten werden geladen...",
    "Enter Admin Password": "Admin-Passwort eingeben",
    Unlock: "Freischalten",
    "Invalid password": "Ungültiges Passwort",
    "Payment Method": "Zahlungsart",
    Signature: "Unterschrift",
    "Masked IBAN": "Maskierte IBAN",
    "Wallet Express": "Wallet Express",
    "Cancel Subscription": "Vertrag kündigen",
    "Withdraw Subscription": "Vertrag widerrufen",
    "Back to Index": "Zurück zur Startseite",
    "Export CSV": "CSV exportieren",
    "Status Summary": "Statusübersicht",
    "Recent Activity": "Kürzliche Aktivitäten",
    "Page not found": "Seite nicht gefunden",
    "The page you're looking for doesn't exist or has been moved.": "Die gesuchte Seite existiert nicht oder wurde verschoben.",
    "Go home": "Zur Startseite",
    "This page didn't load": "Diese Seite konnte nicht geladen werden",
    "Something went wrong on our end. You can try refreshing or head back home.": "Auf unserer Seite ist ein Fehler aufgetreten. Sie können versuchen, die Seite neu zu laden, oder zur Startseite zurückkehren.",
    "Try again": "Erneut versuchen",
    "The subscription": "Das Abonnement",
    "Recommended": "Empfohlen",
    "/ month": "/ Monat",
    "Continuous vision care": "Kontinuierliche Sehversorgung",
    "€0.95 a day": "0,95 € pro Tag",
    "Vertreten durch:": "Vertreten durch:",
    "Germany": "Deutschland",
    "Hinweis: Die Gesellschaft befindet sich in Gründung. Umsatzsteuer-Identifikationsnummer und Handelsregistereintragung folgen nach Abschluss des Registrierungsprozesses.": "Hinweis: Die Gesellschaft befindet sich in Gründung. Umsatzsteuer-Identifikationsnummer und Handelsregistereintragung folgen nach Abschluss des Registrierungsprozesses.",
    "1. Name und Anschrift des Verantwortlichen": "1. Name und Anschrift des Verantwortlichen",
    "Der Verantwortliche im Sinne der Datenschutz-Grundverordnung (DSGVO) und anderer nationaler Datenschutzgesetze ist:": "Der Verantwortliche im Sinne der Datenschutz-Grundverordnung (DSGVO) und anderer nationaler Datenschutzgesetze ist:",
    "2. Erhebung und Speicherung personenbezogener Daten": "2. Erhebung und Speicherung personenbezogener Daten",
    "Beim Abschluss eines Abonnements erheben wir folgende Daten:": "Beim Abschluss eines Abonnements erheben wir folgende Daten:",
    "Name, Vorname": "Name, Vorname",
    "E-Mail-Adresse": "E-Mail-Adresse",
    "Telefonnummer": "Telefonnummer",
    "Geburtsdatum & Geburtsort": "Geburtsdatum & Geburtsort",
    "Beruf": "Beruf",
    "Liefer- und Rechnungsadresse": "Liefer- und Rechnungsadresse",
    "Zahlungsmethode (maskierte IBAN bei SEPA-Lastschrift)": "Zahlungsmethode (maskierte IBAN bei SEPA-Lastschrift)",
    "Elektronische Unterschriftsdaten (Zeichnung oder getippter Name)": "Elektronische Unterschriftsdaten (Zeichnung oder getippter Name)",
    "3. Zweck und Rechtsgrundlage der Verarbeitung": "3. Zweck und Rechtsgrundlage der Verarbeitung",
    "Die Verarbeitung dieser Daten erfolgt zur Durchführung des Vertrages und Erbringung unserer Dienstleistung (Art. 6 Abs. 1 lit. b DSGVO).": "Die Verarbeitung dieser Daten erfolgt zur Durchführung des Vertrages und Erbringung unserer Dienstleistung (Art. 6 Abs. 1 lit. b DSGVO).",
    "Zusätzlich verarbeiten wir Ihre E-Mail-Adresse, um Ihnen vertragsrelevante Bestätigungen und Updates zuzusenden.": "Zusätzlich verarbeiten wir Ihre E-Mail-Adresse, um Ihnen vertragsrelevante Bestätigungen und Updates zuzusenden.",
    "4. Weitergabe von Daten an Dritte": "4. Weitergabe von Daten an Dritte",
    "Eine Weitergabe Ihrer Daten erfolgt nur an Dienstleister, die uns bei der Vertragserfüllung unterstützen (z.B. Versanddienstleister für die Zustellung der Brillen).": "Eine Weitergabe Ihrer Daten erfolgt nur an Dienstleister, die uns bei der Vertragserfüllung unterstützen (z.B. Versanddienstleister für die Zustellung der Brillen).",
    "Zahlungen werden über den Zahlungsdienstleister Stripe Payments Europe, Ltd. abgewickelt. Ihre echten Kreditkarten- oder Bankdaten werden direkt bei Stripe verarbeitet und nicht auf unseren Servern gespeichert.": "Zahlungen werden über den Zahlungsdienstleister Stripe Payments Europe, Ltd. abgewickelt. Ihre echten Kreditkarten- oder Bankdaten werden direkt bei Stripe verarbeitet und nicht auf unseren Servern gespeichert.",
    "5. Speicherdauer": "5. Speicherdauer",
    "Wir speichern Ihre Daten so lange, wie es für die Vertragserfüllung erforderlich ist, bzw. so lange gesetzliche Aufbewahrungsfristen (z.B. handels- und steuerrechtliche Vorgaben nach HGB/AO von bis zu 10 Jahren) dies vorschreiben.": "Wir speichern Ihre Daten so lange, wie es für die Vertragserfüllung erforderlich ist, bzw. so lange gesetzliche Aufbewahrungsfristen (z.B. handels- und steuerrechtliche Vorgaben nach HGB/AO von bis zu 10 Jahren) dies vorschreiben.",
    "6. Ihre Rechte (Betroffenenrechte)": "6. Ihre Rechte (Betroffenenrechte)",
    "Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16 DSGVO), Löschung (Art. 17 DSGVO), Einschränkung der Verarbeitung (Art. 18 DSGVO) sowie das Recht auf Datenübertragbarkeit (Art. 20 DSGVO).": "Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16 DSGVO), Löschung (Art. 17 DSGVO), Einschränkung der Verarbeitung (Art. 18 DSGVO) sowie das Recht auf Datenübertragbarkeit (Art. 20 DSGVO).",
    "Zudem steht Ihnen ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde zu (Art. 77 DSGVO).": "Zudem steht Ihnen ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde zu (Art. 77 DSGVO).",
    "Kontakt für Datenschutzanfragen": "Kontakt für Datenschutzanfragen",
    "Wenn Sie Auskunft über Ihre Daten wünschen oder die Löschung beantragen möchten, schreiben Sie uns an:": "Wenn Sie Auskunft über Ihre Daten wünschen oder die Löschung beantragen möchten, schreiben Sie uns an:",
    "Saved when using replacements": "Gespart bei Nutzung von Ersatzleistungen",
    "Lensly subscription (incl. replacements)": "Lensly-Abo (inkl. Ersatzleistungen)",
  },
  fr: {
    "Start for €29/mo": "S'abonner pour 29 €/mois",
    "One plan · €29 / month": "Un plan · 29 € / mois",
    "New glasses every ": "De nouvelles lunettes chaque ",
    "year.": "an.",
    "Fresh prescription glasses delivered to your door every year. Break them or need a new prescription? Three free replacements included. No optician visits, no surprise costs.":
      "Des lunettes correctrices neuves livrées à votre porte chaque année. Cassées ou besoin d'une nouvelle ordonnance ? Trois remplacements gratuits inclus. Pas de visite chez l'opticien, pas de frais surprises.",
    "See the plan": "Voir le plan",
    "Premium Optical Lenses": "Verres optiques premium",
    "Free EU-Wide Shipping": "Livraison gratuite en UE",
    "Secure Stripe Checkout": "Paiement Stripe sécurisé",
    "Traditional optician": "Opticien traditionnel",
    "Upfront · 1 pair · no free replacements":
      "Achat initial · 1 paire · pas de remplacement gratuit",
    "Wait 2–3 years to save up money and buy again":
      "Attendre 2 à 3 ans pour économiser et racheter",
    "Accidental replacements cost full retail price": "Remplacement accidentel au prix fort",
    "Coatings & high-index lenses billed as extras":
      "Traitements et verres amincis facturés en supplément",
    "Outdated prescription within 12 months": "Correction obsolète en moins de 12 mois",
    "Lensly Care": "Lensly Care",
    "less than a daily coffee": "moins cher qu'un café par jour",
    "1 new pair of precision lenses every year": "1 nouvelle paire de verres de précision par an",
    "3 free replacements (broken, power change? We got you covered)":
      "3 remplacements gratuits (cassés, changement de correction)",
    "Premium lenses, anti-reflective & UV-400 coatings included":
      "Verres premium, antireflet & protection UV-400 inclus",
    "Free shipping EU-wide · minimum 1 year contract":
      "Livraison gratuite en Europe · engagement de 1 an minimum",
    "What's next?": "Quelle est l'étape suivante ?",
    "To start your plan, subscribe to Lensly Care. Once payment is complete, our team will contact you to select your frames and collect your prescription or doctor's report.":
      "Pour commencer votre forfait, abonnez-vous à Lensly Care. Une fois le paiement validé, notre équipe vous contactera pour choisir votre monture et recueillir votre ordonnance.",
    "Subscribe to Lensly Care": "S'abonner à Lensly Care",
    "Sign Contract": "Signer le contrat",
    "Pay & Subscribe": "Payer & S'abonner",
    "Minimum term 12 months, billing €29 monthly, automatic renewal with monthly cancellation thereafter.":
      "Engagement de 12 mois minimum, facturation de 29 € par mois, renouvellement automatique avec résiliation mensuelle ensuite.",
    "I agree to the Terms of Service, the 12-month contract lock-in, and the custom-lens refund rules.":
      "J'accepte les conditions d'utilisation, l'engagement contractuel de 12 mois et les conditions de remboursement des verres sur mesure.",
    "Bank Transfer (SEPA Direct Debit)": "Prélèvement SEPA",
    "Express Wallet (Apple Pay / Google Pay)": "Express Wallet (Apple Pay / Google Pay)",
    "Vertrag hier kündigen": "Résilier le contrat ici",
    "Vertrag widerrufen": "Rétracter le contrat",
    "Kündigung bestätigen": "Confirmer la résiliation",
    "Widerruf bestätigen": "Confirmer la rétractation",
    "Secure checkout via Stripe": "Paiement sécurisé via Stripe",
    "Traditional optician (4 pairs)": "Opticien traditionnel (4 paires)",
    "Lensly subscription (€348/yr)": "Abonnement Lensly (348 €/an)",
    "Saved per year with replacements": "Économie par an avec remplacements",
    "Lensly vs. Glasses Insurance": "Lensly vs. Assurance Lunettes",
    "Supplemental insurance plans look cheap upfront but often leave you with heavy out-of-pocket costs.":
      "Les assurances complémentaires semblent bon marché au départ mais cachent souvent des frais importants.",
    "Glasses Insurance": "Assurance Lunettes",
    "Standard supplemental policy": "Complémentaire santé standard",
    "Complete continuous vision plan": "Forfait complet de santé visuelle",
    "Covers 1 pair every 2 years": "Couvre 1 paire tous les 2 ans",
    "Replacements not covered": "Remplacements non couverts",
    "Additional co-pays for premium lenses": "Franchises pour les verres premium",
    "1 complete pair delivered to you": "1 paire complète livrée chez vous",
    "3 free replacements (broken, power change)": "3 remplacements gratuits (correction, casse)",
    "Nothing extra to pay ever": "Aucun frais supplémentaire à payer",
    "For any help or requests regarding subscription please contact at":
      "Pour toute question ou demande concernant votre abonnement, contactez-nous à",
    "Max €150 allowance, you pay the remaining balance out of pocket":
      "Max. 150 € de prise en charge, vous payez le reste de votre poche",
    "Accidental breakage or prescription changes cost 100% full retail price":
      "La casse accidentelle ou les changements d'ordonnance coûtent 100 % du prix fort",
    "Anti-reflective, scratch-resistant coatings and high-index thinning cost €150+ extra":
      "Les traitements antireflet, anti-rayures et les verres amincis coûtent plus de 150 € en supplément",
    "Fully covered every single year, zero waiting periods":
      "Entièrement couvert chaque année, sans aucun délai d'attente",
    "€0 out-of-pocket costs for prescription changes or accident replacements":
      "0 € de reste à charge pour les changements de correction ou la casse",
    "Premium lenses, anti-reflective & UV-400 coatings are 100% included":
      "Verres premium, antireflet & protection UV-400 inclus à 100 %",
    "1 pair every 2 years": "1 paire tous les 2 ans",
    "pay €240 in premiums, get €150 back, lose €90 minimum":
      "240 € de cotisations payées, 150 € remboursés, perte minimale de 90 €",
    "Break them once": "Cassées une fois",
    "€400 out of pocket, not covered": "400 € de votre poche, non couvert",
    "Need anti-reflective or thin lenses": "Traitements antireflet ou verres amincis",
    "€150+ extra, not covered": "Plus de 150 € en supplément, non couvert",
    "Prescription changes": "Changement d'ordonnance",
    "full retail price, not covered": "Plein tarif, non couvert",
    "Total realistic cost over 2 years: €800-1,200+": "Coût réel sur 2 ans : 800 - 1 200 €+",
    "Premiums + gaps + extras + one replacement":
      "Cotisations + franchises + extras + un remplacement",
    "Flat €29/month, completely covered": "Forfait 29 €/mois, entièrement couvert",
    "Zero hidden fees, 1 pair per year and 3 replacements per year":
      "Zéro frais cachés, 1 paire par an et 3 remplacements par an",
    "€7-20/month": "7-20 €/mois",
    "€29/month": "29 €/mois",
    "Frequently Asked Questions": "Foire Aux Questions",
    "Everything you need to know": "Tout ce que vous devez savoir",
    "Who is behind Lensly?": "Qui est derrière Lensly ?",
    "Lensly is a small independent team focused on making quality prescription eyewear affordable and accessible across Europe. We work directly with certified optical labs to cut out retail markups.":
      "Lensly est une petite équipe indépendante dédiée à rendre les lunettes de vue de qualité abordables et accessibles dans toute l'Europe. Nous travaillons directement avec des laboratoires d'optique certifiés pour éliminer les marges des distributeurs.",
    "Can I see frame options before subscribing?": "Puis-je voir les montures avant de m'abonner ?",
    "Yes. You choose any frame you like, from any brand, online shop, or store. Send us a photo or screenshot and we source it for you. No limitations.":
      "Oui. Vous choisissez la monture de votre choix, de n'importe quelle marque, boutique en ligne ou magasin. Envoyez-nous une photo ou une capture d'écran et nous la trouverons pour vous. Aucune limite.",
    "What is the exact process for my first pair?":
      "Quel est le processus exact pour ma première paire ?",
    "1. Subscribe via Stripe": "1. S'abonner via Stripe",
    "Select your plan and complete checkout securely.":
      "Sélectionnez votre offre et finalisez votre paiement en toute sécurité.",
    "2. E-mail contact within 24 hours": "2. Contact par e-mail sous 24h",
    "We reach out to gather your custom prescription details.":
      "Nous vous contactons pour recueillir les détails de votre ordonnance.",
    "3. Send us prescription, pupillary distance & chosen frame":
      "3. Envoi de l'ordonnance, de l'écart pupillaire et de la monture choisie",
    "Simply reply with your values and a photo/screenshot of any frame you want.":
      "Répondez simplement avec vos informations et une photo/capture d'écran de la monture de votre choix.",
    "4. Sourcing & production": "4. Achat de la monture & fabrication",
    "We purchase your frame and craft your custom lenses to specification.":
      "Nous achetons la monture et fabriquons vos verres correcteurs sur mesure.",
    "5. Delivered to your door": "5. Livraison chez vous",
    "Your finished prescription eyewear arrives in approximately 15 days.":
      "Vos lunettes de vue terminées arrivent chez vous sous environ 15 jours.",
    "How do I get my pupillary distance measured?": "Comment faire mesurer mon écart pupillaire ?",
    "Visit any local optician or doctor for a quick measurement. It takes 2 minutes and is usually free. Then just include it in your email to us.":
      "Rendez-vous chez un opticien ou un médecin local pour une mesure rapide. Cela prend 2 minutes et c'est généralement gratuit. Indiquez-la simplement dans votre e-mail.",
    "What if my lenses are wrong?": "Que faire si mes verres ne conviennent pas ?",
    "We send a replacement pair free of charge, no questions asked.":
      "Nous vous envoyons une paire de remplacement gratuitement, sans poser de questions.",
    "How do returns or refunds work?": "Comment fonctionnent les retours ou remboursements ?",
    "If there is a production error on our side we fix it completely free. Custom prescription lenses cannot be refunded once produced, but we will always make it right.":
      "En cas d'erreur de fabrication de notre part, nous la corrigeons gratuitement. Les verres correcteurs personnalisés ne peuvent pas être remboursés une fois produits, mais nous ferons toujours le nécessaire pour vous satisfaire.",
    "Do I buy the frame or do you?": "Est-ce moi qui achète la monture ou vous ?",
    "We source the frame for you based on your photo or screenshot. It is included in your subscription, nothing extra to pay.":
      "Nous trouvons la monture pour vous à partir de votre photo ou capture d'écran. Elle est incluse dans votre abonnement, aucun frais supplémentaire à prévoir.",
  },
  es: {
    "Start for €29/mo": "Iniciar por 29 €/mes",
    "One plan · €29 / month": "Un plan · 29 € / mes",
    "New glasses every ": "Gafas nuevas cada ",
    "year.": "año.",
    "Fresh prescription glasses delivered to your door every year. Break them or need a new prescription? Three free replacements included. No optician visits, no surprise costs.":
      "Gafas graduadas nuevas entregadas en tu puerta cada año. ¿Se te rompen o necesitas una nueva receta? Tres reemplazos gratuitos incluidos. Sin visitas al óptico, sin costes sorpresa.",
    "See the plan": "Ver el plan",
    "Premium Optical Lenses": "Lentes ópticas premium",
    "Free EU-Wide Shipping": "Envío gratis a toda la UE",
    "Secure Stripe Checkout": "Pago Stripe seguro",
    "Traditional optician": "Óptica tradicional",
    "Upfront · 1 pair · no free replacements": "Pago único · 1 par · sin reemplazos gratuitos",
    "Wait 2–3 years to save up money and buy again":
      "Esperar 2-3 años para ahorrar y comprar de nuevo",
    "Accidental replacements cost full retail price": "Reemplazo por accidente a precio normal",
    "Coatings & high-index lenses billed as extras": "Tratamientos y lentes reducidas como extras",
    "Outdated prescription within 12 months": "Graduación desactualizada en 12 meses",
    "Lensly Care": "Lensly Care",
    "less than a daily coffee": "menos que un café al día",
    "1 new pair of precision lenses every year": "1 nuevo par de lentes de precisión cada año",
    "3 free replacements (broken, power change? We got you covered)":
      "3 reemplazos gratis (rotura, cambio de graduación)",
    "Premium lenses, anti-reflective & UV-400 coatings included":
      "Lentes premium con tratamientos antirreflejantes y UV-400 incluidos",
    "Free shipping EU-wide · minimum 1 year contract":
      "Envío gratuito en la UE · contrato mínimo de 1 año",
    "What's next?": "¿Qué es lo siguiente?",
    "To start your plan, subscribe to Lensly Care. Once payment is complete, our team will contact you to select your frames and collect your prescription or doctor's report.":
      "Para comenzar tu plan, suscríbete a Lensly Care. Once completado el pago, nuestro equipo se pondrá en contacto contigo para elegir montura y recibir tu receta médica.",
    "Subscribe to Lensly Care": "Suscribirse a Lensly Care",
    "Sign Contract": "Firmar contrato",
    "Pay & Subscribe": "Pagar y suscribirse",
    "Minimum term 12 months, billing €29 monthly, automatic renewal with monthly cancellation thereafter.":
      "Compromiso mínimo de 12 meses, facturación de 29 € al mes, renovación automática con cancelación mensual posterior.",
    "I agree to the Terms of Service, the 12-month contract lock-in, and the custom-lens refund rules.":
      "Acepto las Condiciones de servicio, el compromiso de contrato de 12 meses y las reglas de reembolso de lentes personalizadas.",
    "Bank Transfer (SEPA Direct Debit)": "Adeudo directo SEPA",
    "Express Wallet (Apple Pay / Google Pay)": "Cartera Express (Apple Pay / Google Pay)",
    "Vertrag hier kündigen": "Cancelar contrato aquí",
    "Vertrag widerrufen": "Revocar contrato",
    "Kündigung bestätigen": "Confirmar cancelación",
    "Widerruf bestätigen": "Confirmar revocación",
    "Secure checkout via Stripe": "Pago seguro mediante Stripe",
    "Traditional optician (4 pairs)": "Óptica tradicional (4 pares)",
    "Lensly subscription (€348/yr)": "Suscripción Lensly (348 €/año)",
    "Saved per year with replacements": "Ahorro anual con reemplazos",
    "Lensly vs. Glasses Insurance": "Lensly vs. Seguro de Gafas",
    "Supplemental insurance plans look cheap upfront but often leave you with heavy out-of-pocket costs.":
      "Los seguros de gafas parecen baratos al principio pero suelen dejarte con gastos adicionales.",
    "Glasses Insurance": "Seguro de Gafas",
    "Standard supplemental policy": "Póliza complementaria común",
    "Complete continuous vision plan": "Plan completo de cuidado visual",
    "Covers 1 pair every 2 years": "Cubre 1 par cada 2 años",
    "Replacements not covered": "Reemplazos no cubiertos",
    "Additional co-pays for premium lenses": "Copagos para lentes de gama alta",
    "1 complete pair delivered to you": "1 par completo entregado a domicilio",
    "3 free replacements (broken, power change)": "3 reemplazos gratis (rotura, graduación)",
    "Nothing extra to pay ever": "Sin costes ocultos nunca",
    "For any help or requests regarding subscription please contact at":
      "Para cualquier consulta o solicitud sobre su suscripción, contáctenos en",
    "Max €150 allowance, you pay the remaining balance out of pocket":
      "Máximo 150 € de cobertura, pagas la diferencia de tu propio bolsillo",
    "Accidental breakage or prescription changes cost 100% full retail price":
      "La rotura accidental o cambios de graduación te cuestan el 100 % del precio de venta",
    "Anti-reflective, scratch-resistant coatings and high-index thinning cost €150+ extra":
      "Tratamiento antirreflejante, antirrayas y reducción de lentes cuestan más de 150 € extras",
    "Fully covered every single year, zero waiting periods":
      "Totalmente cubierto cada año, sin ningún periodo de espera",
    "€0 out-of-pocket costs for prescription changes or accident replacements":
      "0 € de gastos de tu bolsillo por rotura o cambios de graduación",
    "Premium lenses, anti-reflective & UV-400 coatings are 100% included":
      "Lentes premium con tratamientos antirreflejantes y UV-400 incluidos al 100 %",
    "1 pair every 2 years": "1 par cada 2 años",
    "pay €240 in premiums, get €150 back, lose €90 minimum":
      "pagas 240 € de cuotas, recibes 150 € de reembolso, pierdes 90 € como mínimo",
    "Break them once": "Se te rompen una vez",
    "€400 out of pocket, not covered": "400 € de tu bolsillo, no cubierto",
    "Need anti-reflective or thin lenses":
      "Necesitas tratamientos antirreflejantes o reducción de lentes",
    "€150+ extra, not covered": "Más de 150 € extras, no cubierto",
    "Prescription changes": "Cambios de graduación",
    "full retail price, not covered": "Precio de venta completo, no cubierto",
    "Total realistic cost over 2 years: €800-1,200+": "Coste real en 2 años: 800 - 1.200 €+",
    "Premiums + gaps + extras + un reemplazo": "Cuotas + franquicias + extras + un reemplazo",
    "Flat €29/month, completely covered": "Tarifa plana de 29 €/mes, completamente cubierto",
    "Zero hidden fees, 1 pair per year and 3 replacements per year":
      "Sin cuotas ocultas, 1 par al año y 3 reemplazos al año",
    "€7-20/month": "7-20 €/mes",
    "€29/month": "29 €/mes",
    "Frequently Asked Questions": "Preguntas Frecuentes",
    "Everything you need to know": "Todo lo que necesitas saber",
    "Who is behind Lensly?": "¿Quién está detrás de Lensly?",
    "Lensly is a small independent team focused on making quality prescription eyewear affordable and accessible across Europe. We work directly with certified optical labs to cut out retail markups.":
      "Lensly es un pequeño equipo independiente enfocado en hacer que las gafas graduadas de calidad sean asequibles y accesibles en toda Europa. Trabajamos directamente con laboratorios ópticos certificados para eliminar los márgenes de los intermediarios.",
    "Can I see frame options before subscribing?":
      "¿Puedo ver las opciones de monturas antes de suscribirme?",
    "Yes. You choose any frame you like, from any brand, online shop, or store. Send us a photo or screenshot and we source it for you. No limitations.":
      "Sí. Eliges la monture que quieras: de cualquier marca, tienda online o tienda física. Envíanos una foto o captura de pantalla y nosotros la conseguimos para ti. Sin límites.",
    "What is the exact process for my first pair?":
      "¿Cuál es el proceso exacto para mi primer par?",
    "1. Subscribe via Stripe": "1. Suscríbete mediante Stripe",
    "Select your plan and complete checkout securely.":
      "Selecciona tu plan y completa el pago de forma segura.",
    "2. E-mail contact within 24 hours": "2. Contacto por e-mail en 24 horas",
    "We reach out to gather your custom prescription details.":
      "Nos comunicamos contigo para recopilar los detalles de tu receta.",
    "3. Send us prescription, pupillary distance & chosen frame":
      "3. Envíanos tu receta, distancia pupilar y montura elegida",
    "Simply reply with your values and a photo/screenshot of any frame you want.":
      "Simplemente responde con tus datos y una foto/captura de la montura que desees.",
    "4. Sourcing & production": "4. Obtención y fabricación",
    "We purchase your frame and craft your custom lenses to specification.":
      "Adquirimos tu montura y elaboramos tus lentes personalizadas según tus especificaciones.",
    "5. Delivered to your door": "5. Entrega a domicilio",
    "Your finished prescription eyewear arrives in approximately 15 days.":
      "Tus gafas graduadas terminadas llegarán a tu puerta en unos 15 días.",
    "How do I get my pupillary distance measured?": "¿Cómo mido mi distancia pupilar?",
    "Visit any local optician or doctor for a quick measurement. It takes 2 minutes and is usually free. Then just include it in your email to us.":
      "Visita a cualquier óptico o médico local para una medición rápida. Lleva solo 2 minutos y suele ser gratuita. Luego inclúyela en el correo que nos envíes.",
    "What if my lenses are wrong?": "¿Qué pasa si mis lentes están mal?",
    "We send a replacement pair free of charge, no questions asked.":
      "Te enviamos un par de reemplazo gratis, sin hacer preguntas.",
    "How do returns or refunds work?": "¿Cómo funcionan las devoluciones o reembolsos?",
    "If there is a production error on our side we fix it completely free. Custom prescription lenses cannot be refunded once produced, but we will always make it right.":
      "Si hay un error de fabricación por nuestra parte, lo solucionamos gratis. Las lentes graduadas personalizadas no se pueden reembolsar una vez fabricadas, pero siempre buscaremos una solución.",
    "Do I buy the frame or do you?": "¿Tengo que comprar la montura yo o la compráis vosotros?",
    "We source the frame for you based on your photo or screenshot. It is included in your subscription, nothing extra to pay.":
      "Nosotros conseguimos la montura basándonos en tu foto o captura. Está incluida en tu suscripción, no tienes que pagar nada extra.",
  },
  it: {
    "Start for €29/mo": "Inizia con 29 €/mese",
    "One plan · €29 / month": "Un piano · 29 € / mese",
    "New glasses every ": "Occhiali nuovi ogni ",
    "year.": "anno.",
    "Fresh prescription glasses delivered to your door every year. Break them or need a new prescription? Three free replacements included. No optician visits, no surprise costs.":
      "Occhiali da vista nuovi consegnati a casa tua ogni anno. Si rompono o hai bisogno di una nuova ricetta? Tre sostituzioni gratuite incluse. Nessuna visita dall'ottico, nessun costo a sorpresa.",
    "See the plan": "Scopri il piano",
    "Premium Optical Lenses": "Lenti ottiche premium",
    "Free EU-Wide Shipping": "Spedizione gratuita in UE",
    "Secure Stripe Checkout": "Pagamento Stripe sicuro",
    "Traditional optician": "Ottico tradizionale",
    "Upfront · 1 pair · no free replacements":
      "Pagamento iniziale · 1 paio · nessuna sostituzione gratuita",
    "Wait 2–3 years to save up money and buy again":
      "Attendi 2-3 anni per risparmiare e riacquistare",
    "Accidental replacements cost full retail price":
      "Sostituzioni accidentali al prezzo di listino",
    "Coatings & high-index lenses billed as extras":
      "Trattamenti e lenti sottili fatturati come extra",
    "Outdated prescription within 12 months": "Graduazione obsoleta entro 12 mesi",
    "Lensly Care": "Lensly Care",
    "less than a daily coffee": "meno di un caffè al giorno",
    "1 new pair of precision lenses every year": "1 nuovo paio di lenti di precisione all'anno",
    "3 free replacements (broken, power change? We got you covered)":
      "3 sostituzioni gratuite (rottura, cambio gradazione)",
    "Premium lenses, anti-reflective & UV-400 coatings included":
      "Lenti premium con antiriflesso e protezione UV-400 inclusi",
    "Free shipping EU-wide · minimum 1 year contract":
      "Spedizione gratuita in tutta l'UE · contratto minimo di 1 anno",
    "What's next?": "Quali sono i passaggi successivi?",
    "To start your plan, subscribe to Lensly Care. Once payment is complete, our team will contact you to select your frames and collect your prescription or doctor's report.":
      "Per iniziare il tuo piano, abbonati a Lensly Care. Una volta completato il pagamento, il nostro team ti contatterà per scegliere la montatura e raccogliere la tua prescrizione.",
    "Subscribe to Lensly Care": "Abbonati a Lensly Care",
    "Sign Contract": "Firma il contratto",
    "Pay & Subscribe": "Paga e abbonati",
    "Minimum term 12 months, billing €29 monthly, automatic renewal with monthly cancellation thereafter.":
      "Durata minima 12 mesi, fatturazione di 29 € al mese, rinnovo automatico con disdetta mensile successiva.",
    "I agree to the Terms of Service, the 12-month contract lock-in, and the custom-lens refund rules.":
      "Accetto i Termini di servizio, il vincolo contrattuale di 12 mesi e le regole di rimborso per le lenti personalizzate.",
    "Bank Transfer (SEPA Direct Debit)": "Addebito diretto SEPA",
    "Express Wallet (Apple Pay / Google Pay)": "Wallet Express (Apple Pay / Google Pay)",
    "Vertrag hier kündigen": "Annulla il contratto qui",
    "Vertrag widerrufen": "Recedi dal contratto",
    "Kündigung bestätigen": "Conferma l'annullamento",
    "Widerruf bestätigen": "Conferma il recesso",
    "Secure checkout via Stripe": "Pagamento sicuro con Stripe",
    "Traditional optician (4 pairs)": "Ottico tradizionale (4 paia)",
    "Lensly subscription (€348/yr)": "Abbonamento Lensly (348 €/anno)",
    "Saved per year with replacements": "Risparmio annuale con sostituzioni",
    "Lensly vs. Glasses Insurance": "Lensly vs. Assicurazione Occhiali",
    "Supplemental insurance plans look cheap upfront but often leave you with heavy out-of-pocket costs.":
      "Le polizze integrative sembrano convenienti all'inizio, ma spesso prevedono franchigie elevate.",
    "Glasses Insurance": "Assicurazione Occhiali",
    "Standard supplemental policy": "Polizza integrativa standard",
    "Complete continuous vision plan": "Piano di cura visiva continuo",
    "Covers 1 pair every 2 years": "Copre 1 paio ogni 2 anni",
    "Replacements not covered": "Sostituzioni non coperte",
    "Additional co-pays for premium lenses": "Costi extra per lenti premium",
    "1 complete pair delivered to you": "1 paio completo consegnato a domicilio",
    "3 free replacements (broken, power change)": "3 sostituzioni gratuite (rottura, gradazione)",
    "Nothing extra to pay ever": "Nessun costo aggiuntivo mai",
    "For any help or requests regarding subscription please contact at":
      "Per qualsiasi domanda o richiesta relativa all'abbonamento, contattaci a",
    "Max €150 allowance, you pay the remaining balance out of pocket":
      "Massimo 150 € di rimborso, paghi la differenza di tasca tua",
    "Accidental breakage or prescription changes cost 100% full retail price":
      "Rotture accidentali o cambi di gradazione costano il 100 % del prezzo di listino",
    "Anti-reflective, scratch-resistant coatings and high-index thinning cost €150+ extra":
      "Trattamento antiriflesso, antigraffio e lenti sottili costano oltre 150 € extra",
    "Fully covered every single year, zero waiting periods":
      "Interamente coperto ogni anno, senza alcun tempo di attesa",
    "€0 out-of-pocket costs for prescription changes or accident replacements":
      "0 € di costi a carico tuo per cambi di gradazione o sostituzione per rottura",
    "Premium lenses, anti-reflective & UV-400 coatings are 100% included":
      "Lenti premium, trattamento antiriflesso e UV-400 inclusi al 100 %",
    "1 pair every 2 years": "1 paio ogni 2 anni",
    "pay €240 in premiums, get €150 back, lose €90 minimum":
      "paghi 240 € di premi, ricevi 150 € di rimborso, perdi almeno 90 €",
    "Break them once": "Si rompono una volta",
    "€400 out of pocket, not covered": "400 € di tasca tua, non coperto",
    "Need anti-reflective or thin lenses": "Lenti antiriflesso o sottili",
    "€150+ extra, not covered": "Oltre 150 € extra, non coperto",
    "Prescription changes": "Cambio di gradazione",
    "full retail price, not covered": "Prezzo di listino intero, non coperto",
    "Total realistic cost over 2 years: €800-1,200+": "Costo reale su 2 anni: 800 - 1.200 €+",
    "Premiums + gaps + extras + one replacement": "Premi + franchigie + extra + una sostituzione",
    "Flat €29/month, completely covered": "Tariffa fissa 29 €/mese, completamente coperto",
    "Zero hidden fees, 1 pair per year and 3 replacements per year":
      "Nessun costo nascosto, 1 paio all'anno e 3 sostituzioni all'anno",
    "€7-20/month": "7-20 €/mese",
    "€29/month": "29 €/mese",
    "Frequently Asked Questions": "Domande Frequenti",
    "Everything you need to know": "Tutto quello che c'è da sapere",
    "Who is behind Lensly?": "Chi c'è dietro Lensly?",
    "Lensly is a small independent team focused on making quality prescription eyewear affordable and accessible across Europe. We work directly with certified optical labs to cut out retail markups.":
      "Lensly è un piccolo team indipendente dedicato a rendere gli occhiali da vista di qualità convenienti e accessibili in tutta Europa. Lavoriamo direttamente con laboratori ottici certificati per eliminare i ricarichi dei rivenditori.",
    "Can I see frame options before subscribing?":
      "Posso vedere le opzioni di montatura prima di abbonarmi?",
    "Yes. You choose any frame you like, from any brand, online shop, or store. Send us a photo or screenshot and we source it for you. No limitations.":
      "Sì. Scegli tu la montatura che preferisci da qualsiasi marchio, negozio online o fisico. Inviaci una foto o uno screenshot e noi la reperiremo per te. Senza limiti.",
    "What is the exact process for my first pair?":
      "Qual è la procedura esatta per il mio primo paio?",
    "1. Subscribe via Stripe": "1. Abbonati con Stripe",
    "Select your plan and complete checkout securely.":
      "Seleziona il tuo piano e completa il pagamento in sicurezza.",
    "2. E-mail contact within 24 hours": "2. Contatto via e-mail entro 24 ore",
    "We reach out to gather your custom prescription details.":
      "Ti contatteremo per raccogliere i dati della tua ricetta medica.",
    "3. Send us prescription, pupillary distance & chosen frame":
      "3. Inviaci ricetta, distanza pupillare e montatura scelta",
    "Simply reply with your values and a photo/screenshot of any frame you want.":
      "Rispondi all'e-mail con i tuoi parametri e la foto/screenshot della montura desiderata.",
    "4. Sourcing & production": "4. Reperimento e produzione",
    "We purchase your frame and craft your custom lenses to specification.":
      "Acquistiamo la montatura e realizziamo le lenti su misura secondo le tue specifiche.",
    "5. Delivered to your door": "5. Consegna a domicilio",
    "Your finished prescription eyewear arrives in approximately 15 days.":
      "I tuoi occhiali da vista pronti arriveranno a destinazione in circa 15 giorni.",
    "How do I get my pupillary distance measured?": "Come faccio a misurare la distanza pupillare?",
    "Visit any local optician or doctor for a quick measurement. It takes 2 minutes and is usually free. Then just include it in your email to us.":
      "Visita un ottico o un medico locale per una misurazione rapida. Richiede 2 minuti ed è generalmente gratuita. Poi inseriscila nella tua e-mail.",
    "What if my lenses are wrong?": "Cosa succede se le lenti sono errate?",
    "We send a replacement pair free of charge, no questions asked.":
      "Ti invieremo un paio sostitutivo gratuitamente, senza fare domande.",
    "How do returns or refunds work?": "Come funzionano i resi o i rimborsi?",
    "If there is a production error on our side we fix it completely free. Custom prescription lenses cannot be refunded once produced, but we will always make it right.":
      "In caso di errore di produzione da parte nostra, lo risolveremo gratuitamente. Le lenti da vista personalizzate non sono rimborsabili una volta prodotte, ma troveremo sempre il modo di soddisfare le tue esigenze.",
    "Do I buy the frame or do you?": "La montura la compro io o voi?",
    "We source the frame for you based on your photo or screenshot. It is included in your subscription, nothing extra to pay.":
      "Reperiamo noi la montatura per te in base alla tua foto o screenshot. È inclusa nel tuo abbonamento, non devi pagare nulla in più.",
  },
};

// In-memory cache for translations that dynamically updates
const translationCache: Record<string, Record<string, string>> = {
  de: { ...initialTranslations.de },
  fr: { ...initialTranslations.fr },
  es: { ...initialTranslations.es },
  it: { ...initialTranslations.it },
};

// Load saved runtime translation caches from localStorage
if (typeof window !== "undefined") {
  try {
    const saved = localStorage.getItem("lensly_translations_cache");
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.keys(translationCache).forEach((l) => {
        if (parsed[l]) {
          translationCache[l] = { ...translationCache[l], ...parsed[l] };
        }
      });
    }
  } catch (e) {
    console.error("Failed to load translation cache", e);
  }
}

function saveCacheToStorage() {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("lensly_translations_cache", JSON.stringify(translationCache));
    } catch (e) {
      console.error("Failed to save translation cache", e);
    }
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");
  // Keep translations in state to trigger updates upon API returns
  const [translationsMap, setTranslationsMap] = useState<Record<string, Record<string, string>>>(
    () => {
      return { ...translationCache };
    },
  );

  useEffect(() => {
    const saved = localStorage.getItem("lensly_lang") as Language;
    if (saved) {
      setLangState(saved);
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("lensly_lang", newLang);
  };

  const t = (text: string): string => {
    if (lang === "en" || !text) {
      return text;
    }

    const langMap = translationsMap[lang] || {};
    if (langMap[text]) {
      return langMap[text];
    }

    // Trigger dynamic Google translation
    fetchTranslation(text, lang);

    // Default to the original English text while translating
    return text;
  };

  const activeFetches = React.useRef<Set<string>>(new Set());

  const fetchTranslation = async (text: string, targetLang: Language) => {
    const fetchKey = `${targetLang}:${text}`;
    if (activeFetches.current.has(fetchKey)) {
      return;
    }
    activeFetches.current.add(fetchKey);

    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Translation request failed");

      const data = await res.json();
      if (data && data[0] && data[0][0] && data[0][0][0]) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const translatedText = data[0].map((x: any) => x[0]).join("");

        // Store in cache
        translationCache[targetLang][text] = translatedText;
        saveCacheToStorage();

        // Update state to trigger UI render
        setTranslationsMap((prev) => ({
          ...prev,
          [targetLang]: {
            ...prev[targetLang],
            [text]: translatedText,
          },
        }));
      }
    } catch (err) {
      console.error(`Error translating text to ${targetLang}:`, err);
    } finally {
      activeFetches.current.delete(fetchKey);
    }
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
