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
  en: {
    // ─── Full Legal Contract — English ────────────────────────────────────
    // (dot-notation keys must be explicit; the t() function returns the key
    //  as-is for "en", which only works when the key IS the English text)
    "LENSLY CARE VISION SUBSCRIPTION AGREEMENT": "LENSLY CARE VISION SUBSCRIPTION AGREEMENT",
    "1. Contracting Parties": "1. Contracting Parties",
    "contract.parties.body": "This agreement is concluded between Sikder LLC, Germany (hereinafter \"Lensly\" or \"the Provider\") and the subscriber whose personal information, payment details, and electronic acceptance are recorded during the checkout process (hereinafter \"the Customer\").",
    "contract.parties.acceptance": "By completing the checkout process and confirming payment, the Customer accepts this agreement electronically.",
    "2. Subject Matter: Lensly Care Subscription": "2. Subject Matter: Lensly Care Subscription",
    "contract.subject.body": "Lensly Care is a vision subscription service providing customers with access to custom-made prescription eyewear benefits, including:",
    "contract.subject.item1": "One (1) complete custom-made prescription glasses per contract year",
    "contract.subject.item2": "Up to three (3) free replacement pairs per year (breakage, scratches, or prescription changes)",
    "contract.subject.item3": "Premium lenses with anti-reflective and UV-400 coatings",
    "contract.subject.item4": "Free shipping EU-wide",
    "3. Subscription Fee & Billing": "3. Subscription Fee & Billing",
    "contract.billing.body": "The monthly subscription fee is €29.00 (twenty-nine euros). Payments are debited monthly in advance via Stripe Payments Europe, Ltd., by SEPA direct debit or Express Wallet payment (Apple Pay / Google Pay).",
    "contract.billing.sepa": "Default in payment entitles Lensly to suspend service provision, including lens manufacturing and replacement rights, until the outstanding amount is settled in full.",
    "4. Minimum Contract Term & Renewal": "4. Minimum Contract Term & Renewal",
    "contract.term.body": "The subscription has a mandatory minimum term of twelve (12) months from the date of activation. Ordinary termination during this period is excluded.",
    "contract.term.renewal": "Upon expiry of the minimum term, the contract automatically renews on a month-to-month basis at the same rate. Cancellation is then possible with 30 days' notice before the end of the current month.",
    "5. Annual Eyewear Entitlement": "5. Annual Eyewear Entitlement",
    "contract.eyewear.body": "The Customer is entitled to one (1) new complete pair of prescription glasses per contract year. This entitlement is valid for twelve (12) months from the contract start date and cannot be carried over to the following year.",
    "contract.eyewear.note": "The entitlement includes frame, lenses, and all standard coatings. The Customer selects their frame freely; Lensly sources it based on a photo or screenshot provided.",
    "6. Replacement Benefits": "6. Replacement Benefits",
    "contract.replacements.body": "The Customer is entitled to up to three (3) free replacements per contract year, granted in case of: breakage or significant damage, deep scratches on lenses, or a clinically relevant change in prescription (prescription required).",
    "contract.replacements.scope": "Replacements cover lenses and/or frame depending on the nature of the damage. Delivery of replacement eyewear is free of charge within the EU.",
    "7. Medical Device Classification": "7. Medical Device Classification",
    "contract.mdr.body": "Prescription spectacles are Class I Medical Devices under European Medical Device Regulation (EU MDR 2017/745). All eyewear supplied by Lensly carries CE marking and is manufactured exclusively by certified ophthalmic laboratories complying with applicable standards.",
    "8. Exclusion of Right of Withdrawal": "8. Exclusion of Right of Withdrawal",
    "contract.withdrawal.body": "Pursuant to § 312g para. 2 no. 1 BGB and Directive 2011/83/EU, the statutory 14-day right of withdrawal does not apply to goods manufactured to the consumer's individual specifications. Prescription lenses, crafted to the Customer's personal parameters (power, pupillary distance, frame), are expressly excluded from this right.",
    "contract.withdrawal.instruction": "The Customer acknowledges and expressly instructs Lensly to commence the individual manufacture of lenses upon order confirmation. The right of withdrawal lapses prematurely pursuant to § 356 para. 5 BGB once production has begun.",
    "9. Liability Limitation": "9. Liability Limitation",
    "contract.liability.body": "Lensly's liability for minor negligence is limited to the amount of the monthly subscription fee, unless the breach concerns a material contractual obligation. Statutory liability for intent, gross negligence, or injury to life, body, or health remains unaffected.",
    "10. Termination": "10. Termination",
    "contract.termination.body": "Ordinary termination is possible at the earliest upon expiry of the 12-month minimum term, with 30 days' notice, by written notice or email to hello@lensly.care.",
    "contract.termination.extraordinary": "Both parties reserve the right to terminate for good cause. Good cause for Lensly includes, in particular, a payment default of more than two months.",
    "11. Data Protection (GDPR)": "11. Data Protection (GDPR)",
    "contract.gdpr.body": "Lensly processes the Customer's personal data exclusively for the performance of this contract pursuant to Art. 6(1)(b) GDPR. Data is shared with third parties only to the extent necessary to deliver the agreed services (shipping providers, ophthalmic laboratories, payment provider Stripe). Please refer to our Privacy Policy for further information.",
    "12. Governing Law & Jurisdiction": "12. Governing Law & Jurisdiction",
    "contract.law.body": "This agreement is governed exclusively by the laws of the Federal Republic of Germany, excluding the UN Convention on Contracts for the International Sale of Goods (CISG). For all disputes arising out of or in connection with this agreement, exclusive local jurisdiction lies with the competent courts at Lensly's registered seat, to the extent permitted by law.",
    "13. Severability & Entire Agreement": "13. Severability & Entire Agreement",
    "contract.severability.body": "Should any provision of this agreement be or become invalid or unenforceable, this shall not affect the validity of the remaining provisions. The invalid provision shall be replaced by an effective provision closest to the economic purpose of the invalid one. This agreement constitutes the entire agreement of the parties with respect to its subject matter.",
    "contract.footer": "By completing the checkout process and providing an electronic signature, the Customer confirms having read, understood, and accepted this agreement.",
    "Contract Reference": "Contract Reference",
    "Agreement Document & Summary": "Agreement Document & Summary",
  },
  de: {
    "Start for €29/mo": "Starten für 29 €/Monat",
    "One membership. One predictable price.": "Eine Mitgliedschaft. Ein vorhersehbarer Preis.",
    "Get My First Pair": "Erste Brille sichern",
    "Precision vision care, renewed every ": "Erstklassige Sehversorgung, erneuert jedes ",
    "year.": "Jahr.",
    "What our members are saying": "Was unsere Mitglieder sagen",
    "Loved by students, office professionals, and daily screen-users": "Beliebt bei Studenten, Büroangestellten und täglichen Bildschirmnutzern",
    "Verified Member": "Verifiziertes Mitglied",
    "See More": "Mehr anzeigen",
    "See Less": "Weniger anzeigen",
    "Student": "Student",
    "Office Worker": "Angestellter",
    "Medical Student, LMU Munich": "Medizinstudentin, LMU München",
    "Senior Consultant, Accenture": "Senior Consultant, Accenture",
    "Computer Science Student, TU Berlin": "Informatikstudent, TU Berlin",
    "Business Student, FU Berlin": "BWL-Student, FU Berlin",
    "Administrative Assistant, Siemens": "Verwaltungsassistentin, Siemens",
    "Marketing Manager, Zalando": "Marketing Managerin, Zalando",
    "As a student, paying €400 upfront at traditional opticians was impossible. Lensly's €29 flat monthly rate is insanely cheap and completely hassle-free. Got my second pair last week—super clean lenses and fast shipping!": "Als Studentin war es unmöglich, 400 € im Voraus bei traditionellen Optikern zu zahlen. Die Flatrate von 29 € im Monat bei Lensly ist wahnsinnig günstig und völlig unkompliziert. Letzte Woche habe ich meine zweite Brille bekommen – super klare Gläser und schneller Versand!",
    "I sit in front of three monitors all day. The blue-light filter lenses Lensly provides are top quality, and the 3 free accident replacements are a lifesaver. Had a frame break last month, and a brand new one arrived in 3 days. No hidden fees, no headache.": "Ich sitze den ganzen Tag vor drei Bildschirmen. Die Blaulichtfilter-Gläser von Lensly sind von höchster Qualität, und der dreifache kostenlose Unfallersatz ist ein Lebensretter. Letzten Monat ging ein Gestell kaputt, und innerhalb von 3 Tagen war ein nagelneues da. Keine versteckten Kosten, keine Kopfschmerzen.",
    "Honestly, the best prescription glasses service I've ever used. Getting a new pair every 12 months is perfect for updating my prescription, and the cheap flat rate fits my student budget perfectly. Hassle-free setup, quick delivery, and top quality.": "Ehrlich gesagt der beste Brillenservice, den ich je genutzt habe. Jedes Jahr eine neue Brille zu bekommen ist perfekt, um meine Sehstärke anzupassen, und der günstige Flatrate-Preis passt ideal in mein Studentenbudget. Unkomplizierter Ablauf, schnelle Lieferung und Top-Qualität.",
    "So simple. €29/month is the absolute best deal for students. Highly recommend!": "Super einfach. 29 €/Monat ist das absolut beste Angebot für Studenten. Sehr zu empfehlen!",
    "Absolutely hassle-free. Got my replacement glasses in just 2 days. Brilliant service!": "Absolut stressfrei. Habe meine Ersatzbrille in nur 2 Tagen erhalten. Genialer Service!",
    "German lenses are crystal clear. I love my fresh style every year!": "Die deutschen Gläser sind glasklar. Ich liebe meinen neuen Style jedes Jahr!",
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
    "Free Pair": "Brille gratis",
    "Every single year": "Jedes einzelne Jahr",
    "Free Replacements": "Kostenloser Ersatz",
    "Free of cost": "Völlig kostenfrei",
    "Only": "Nur",
    "Flat rate": "Flatrate",
    "Annual Benefit": "Jährlicher Vorteil",
    "1 Free Pair Every Year": "1 neue Brille jedes Jahr gratis",
    "Receive a complete new pair of prescription glasses delivered to your door annually.": "Erhalten Sie jährlich eine komplett neue Korrekturbrille direkt nach Hause geliefert.",
    "Peace of Mind": "Sorgenfreiheit",
    "3 Free Replacements": "3 kostenlose Ersatzgläser",
    "Accident coverage included. We replace broken lenses or update prescription at zero cost.": "Unfallschutz inklusive. Wir ersetzen beschädigte Gläser oder passen die Sehstärke kostenlos an.",
    "Pricing Model": "Preismodell",
    "Flat €29 Monthly Only": "Nur 29 € monatlich flat",
    "All-inclusive subscription with zero retail markup or surprise medical billings.": "All-inclusive-Abonnement ohne Händleraufschläge oder überraschende Zusatzkosten.",
    "Included": "Inklusive",

    // ─── Full Legal Contract — German ─────────────────────────────────────
    "LENSLY CARE VISION SUBSCRIPTION AGREEMENT": "LENSLY CARE SEHVERSORGUNGSABONNEMENT-VERTRAG",
    "1. Contracting Parties": "1. Vertragsparteien",
    "contract.parties.body": "Dieser Vertrag wird geschlossen zwischen Sikder LLC, Deutschland (nachfolgend \"Lensly\" oder \"Anbieter\") und dem Abonnenten, dessen persönliche Daten, Zahlungsinformationen und elektronische Zustimmung im Rahmen des Bestellprozesses erfasst werden (nachfolgend \"Kunde\").",
    "contract.parties.acceptance": "Mit dem Abschluss des Bestellvorgangs und der Bestätigung der Zahlung nimmt der Kunde diesen Vertrag auf elektronischem Wege an.",
    "2. Subject Matter: Lensly Care Subscription": "2. Vertragsgegenstand: Lensly Care Abonnement",
    "contract.subject.body": "Lensly Care ist ein Sehversorgungsabonnement, das dem Kunden Zugang zu individuell angefertigter Korrektionsbrille mit folgenden Leistungen gewährt:",
    "contract.subject.item1": "Eine (1) vollständige, individuell angefertigte Korrektionsbrille pro Vertragsjahr",
    "contract.subject.item2": "Bis zu drei (3) kostenlose Ersatzleistungen pro Jahr (Bruch, Kratzer oder Änderung der Sehstärke)",
    "contract.subject.item3": "Premium-Gläser mit Entspiegelung und UV-400-Schutz",
    "contract.subject.item4": "Kostenloser Versand innerhalb der EU",
    "3. Subscription Fee & Billing": "3. Abonnementgebühr und Abrechnung",
    "contract.billing.body": "Die monatliche Abonnementgebühr beträgt 29,00 € (neunundzwanzig Euro). Die Zahlung erfolgt monatlich im Voraus über den Zahlungsdienstleister Stripe Payments Europe, Ltd., mittels SEPA-Lastschriftverfahren oder digitaler Express-Wallet-Zahlung (Apple Pay / Google Pay).",
    "contract.billing.sepa": "Zahlungsverzug berechtigt Lensly zur Aussetzung der Leistungserbringung, insbesondere der Brillenfertigung und der Ersatzleistungen, bis zur vollständigen Begleichung des ausstehenden Betrags.",
    "4. Minimum Contract Term & Renewal": "4. Mindestvertragslaufzeit und Verlängerung",
    "contract.term.body": "Das Abonnement hat eine Mindestlaufzeit von zwölf (12) Monaten ab dem Datum der Vertragsaktivierung. Eine ordentliche Kündigung innerhalb dieses Zeitraums ist ausgeschlossen.",
    "contract.term.renewal": "Nach Ablauf der Mindestlaufzeit verlängert sich der Vertrag automatisch auf monatlicher Basis zum gleichen Preis. Eine Kündigung ist in diesem Fall mit einer Frist von 30 Tagen zum Monatsende möglich.",
    "5. Annual Eyewear Entitlement": "5. Jährlicher Brillenanspruch",
    "contract.eyewear.body": "Der Kunde hat Anspruch auf eine (1) neue, vollständige Korrektionsbrille pro Vertragsjahr. Das Recht auf Abruf der Jahresbrille gilt für zwölf (12) Monate ab Vertragsbeginn und kann nicht auf das Folgejahr übertragen werden.",
    "contract.eyewear.note": "Der Anspruch umfasst Gestell, Gläser sowie alle standardmäßig enthaltenen Beschichtungen. Die Auswahl des Gestells erfolgt durch den Kunden nach eigenem Ermessen; Lensly beschafft das Gestell auf Basis eines bereitgestellten Fotos oder Screenshots.",
    "6. Replacement Benefits": "6. Ersatzleistungen",
    "contract.replacements.body": "Der Kunde hat Anspruch auf bis zu drei (3) kostenlose Brillenersatzleistungen pro Vertragsjahr. Ersatzleistungen werden gewährt bei: Bruch oder erheblichen Beschädigungen der Brille, Kratzern an den Gläsern sowie klinisch relevanten Änderungen der Sehstärke (Vorlage eines Rezepts erforderlich).",
    "contract.replacements.scope": "Ersatzleistungen beinhalten Gläser und/oder Gestell je nach Art des Schadens. Der Versand der Ersatzbrille erfolgt kostenfrei innerhalb der EU.",
    "7. Medical Device Classification": "7. Medizinprodukteklassifizierung",
    "contract.mdr.body": "Korrektionsbrillen sind Medizinprodukte der Klasse I gemäß der Europäischen Medizinprodukteverordnung (EU MDR 2017/745). Alle von Lensly gelieferten Brillen tragen eine CE-Kennzeichnung und werden ausschließlich von zertifizierten ophthalmologischen Labors gefertigt, die den einschlägigen Normen entsprechen.",
    "8. Exclusion of Right of Withdrawal": "8. Ausschluss des Widerrufsrechts",
    "contract.withdrawal.body": "Gemäß § 312g Abs. 2 Nr. 1 BGB besteht kein gesetzliches 14-tägiges Widerrufsrecht für Waren, die nach Kundenspezifikation angefertigt werden. Korrektionsgläser sind individuell nach den persönlichen Angaben des Kunden (Stärke, Pupillendistanz, Gestell) angefertigt und fallen daher ausdrücklich unter diese Ausnahme.",
    "contract.withdrawal.instruction": "Der Kunde nimmt zur Kenntnis und erteilt ausdrücklich die Anweisung, dass mit der Auftragsbestätigung durch Lensly mit der individuellen Fertigung der Gläser begonnen wird. Das Widerrufsrecht erlischt damit vorzeitig gemäß § 356 Abs. 5 BGB, sobald die Fertigung der Gläser begonnen hat.",
    "9. Liability Limitation": "9. Haftungsbeschränkung",
    "contract.liability.body": "Die Haftung von Lensly für leichte Fahrlässigkeit ist auf den Betrag der monatlichen Abonnementgebühr begrenzt, es sei denn, es handelt sich um die Verletzung wesentlicher Vertragspflichten (Kardinalspflichten). Die gesetzliche Haftung für Vorsatz, grobe Fahrlässigkeit sowie für Schäden an Leben, Körper und Gesundheit bleibt unberührt.",
    "10. Termination": "10. Kündigung",
    "contract.termination.body": "Die ordentliche Kündigung ist frühestens nach Ablauf der Mindestlaufzeit von 12 Monaten mit einer Frist von 30 Tagen zum Monatsende schriftlich oder per E-Mail an hello@lensly.care möglich.",
    "contract.termination.extraordinary": "Eine außerordentliche Kündigung aus wichtigem Grund bleibt für beide Parteien vorbehalten. Ein wichtiger Grund für Lensly liegt insbesondere bei Zahlungsverzug von mehr als zwei Monaten vor.",
    "11. Data Protection (GDPR)": "11. Datenschutz (DSGVO)",
    "contract.gdpr.body": "Lensly verarbeitet personenbezogene Daten des Kunden ausschließlich zur Vertragserfüllung gemäß Art. 6 Abs. 1 lit. b DSGVO. Eine Weitergabe an Dritte erfolgt nur, soweit dies zur Erbringung der vereinbarten Leistungen erforderlich ist (z. B. Versanddienstleister, ophthalmologische Labors, Zahlungsdienstleister Stripe). Weitere Informationen sind der Datenschutzerklärung zu entnehmen.",
    "12. Governing Law & Jurisdiction": "12. Anwendbares Recht und Gerichtsstand",
    "contract.law.body": "Es gilt ausschließlich das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts (CISG). Für sämtliche Streitigkeiten aus oder im Zusammenhang mit diesem Vertrag ist, soweit gesetzlich zulässig, das zuständige Gericht am Sitz von Lensly örtlich zuständig.",
    "13. Severability & Entire Agreement": "13. Salvatorische Klausel und Gesamtvereinbarung",
    "contract.severability.body": "Sollten einzelne Bestimmungen dieses Vertrages unwirksam sein oder werden, so berührt dies die Wirksamkeit der übrigen Bestimmungen nicht. Die unwirksame Bestimmung ist durch eine wirksame Regelung zu ersetzen, die dem wirtschaftlichen Zweck der unwirksamen Bestimmung am nächsten kommt. Dieser Vertrag stellt die vollständige Einigung der Parteien zu seinem Gegenstand dar.",
    "contract.footer": "Durch Abschluss des Bestellvorgangs und elektronische Unterzeichnung bestätigt der Kunde, diesen Vertrag gelesen, verstanden und akzeptiert zu haben. Vertragssprache ist Deutsch.",
    "Contract Reference": "Vertragsreferenz",
    "Agreement Document & Summary": "Vertragsdokument & Zusammenfassung",
  },
  fr: {
    "Start for €29/mo": "S'abonner pour 29 €/mois",
    "One plan · €29 / month": "Un plan · 29 € / mois",
    "Precision vision care, renewed every ": "Soins visuels de précision, renouvelés chaque ",
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
    "Free Pair": "Paire gratuite",
    "Every single year": "Chaque année",
    "Free Replacements": "Remplacements gratuits",
    "Free of cost": "Sans frais",
    "Only": "Seulement",
    "Flat rate": "Forfait",

    // ─── Full Legal Contract — French ─────────────────────────────────────
    "LENSLY CARE VISION SUBSCRIPTION AGREEMENT": "CONTRAT D'ABONNEMENT LENSLY CARE VISION",
    "1. Contracting Parties": "1. Parties Contractantes",
    "contract.parties.body": "Le présent contrat est conclu entre Sikder LLC, Allemagne (ci-après dénommée \"Lensly\" ou \"le Prestataire\") et l'abonné dont les informations personnelles, les coordonnées bancaires et l'acceptation électronique sont enregistrées lors du processus de commande (ci-après dénommé \"le Client\").",
    "contract.parties.acceptance": "En finalisant le processus de commande et en confirmant le paiement, le Client accepte le présent contrat par voie électronique.",
    "2. Subject Matter: Lensly Care Subscription": "2. Objet du Contrat: Abonnement Lensly Care",
    "contract.subject.body": "Lensly Care est un service d'abonnement à la correction visuelle permettant au Client de bénéficier de lunettes correctrices sur mesure, comprenant :",
    "contract.subject.item1": "Une (1) paire complète de lunettes correctrices personnalisées par année contractuelle",
    "contract.subject.item2": "Jusqu'à trois (3) remplacements gratuits par an (casse, rayures ou changement de correction)",
    "contract.subject.item3": "Verres premium avec traitement antireflet et protection UV-400",
    "contract.subject.item4": "Livraison gratuite dans toute l'Union européenne",
    "3. Subscription Fee & Billing": "3. Frais d'Abonnement et Facturation",
    "contract.billing.body": "Le montant mensuel de l'abonnement est de 29,00 € (vingt-neuf euros). Les paiements sont prélevés mensuellement et à l'avance via le prestataire de paiement Stripe Payments Europe, Ltd., par prélèvement SEPA ou par paiement Express Wallet (Apple Pay / Google Pay).",
    "contract.billing.sepa": "Tout défaut de paiement autorise Lensly à suspendre la prestation de services, notamment la fabrication des lunettes et les droits au remplacement, jusqu'au règlement intégral des sommes dues.",
    "4. Minimum Contract Term & Renewal": "4. Durée Minimale du Contrat et Renouvellement",
    "contract.term.body": "L'abonnement a une durée minimale de douze (12) mois à compter de la date d'activation. Toute résiliation ordinaire durant cette période est exclue.",
    "contract.term.renewal": "À l'expiration de la durée minimale, le contrat est automatiquement renouvelé d'un mois en mois au même tarif. La résiliation est alors possible moyennant un préavis de 30 jours avant la fin du mois en cours.",
    "5. Annual Eyewear Entitlement": "5. Droit Annuel aux Lunettes",
    "contract.eyewear.body": "Le Client a droit à une (1) nouvelle paire complète de lunettes correctrices par année contractuelle. Ce droit est valable pendant douze (12) mois à compter du début du contrat et n'est pas reportable sur l'année suivante.",
    "contract.eyewear.note": "Le droit comprend la monture, les verres et tous les traitements inclus en standard. Le Client sélectionne librement sa monture ; Lensly la commande sur la base d'une photo ou d'une capture d'écran fournie.",
    "6. Replacement Benefits": "6. Prestations de Remplacement",
    "contract.replacements.body": "Le Client bénéficie de trois (3) remplacements gratuits par année contractuelle, accordés en cas de : casse ou dommages importants, rayures profondes sur les verres, ou modification cliniquement significative de la correction (ordonnance requise).",
    "contract.replacements.scope": "Les remplacements concernent les verres et/ou la monture selon la nature du sinistre. La livraison de remplacement est offerte dans toute l'UE.",
    "7. Medical Device Classification": "7. Classification en tant que Dispositif Médical",
    "contract.mdr.body": "Les lunettes correctrices sont des dispositifs médicaux de classe I au sens du Règlement européen sur les dispositifs médicaux (UE MDR 2017/745). Toutes les lunettes fournies par Lensly portent le marquage CE et sont fabriquées exclusivement par des laboratoires ophtalmiques certifiés.",
    "8. Exclusion of Right of Withdrawal": "8. Exclusion du Droit de Rétractation",
    "contract.withdrawal.body": "Conformément à l'article L.221-28 du Code de la consommation et à la Directive 2011/83/UE, le droit de rétractation de 14 jours ne s'applique pas aux biens confectionnés selon les spécifications du consommateur. Les verres correcteurs, fabriqués sur mesure selon les données personnelles du Client, sont expressément exclus de ce droit.",
    "contract.withdrawal.instruction": "Le Client reconnaît expressément et demande à Lensly de commencer la fabrication personnalisée des verres dès confirmation de la commande. Le droit de rétractation s'éteint dès le début de la fabrication.",
    "9. Liability Limitation": "9. Limitation de Responsabilité",
    "contract.liability.body": "La responsabilité de Lensly pour faute légère est limitée au montant de la mensualité de l'abonnement, sauf en cas de manquement à une obligation essentielle du contrat. La responsabilité légale pour faute intentionnelle, faute grave ou atteinte à la vie, à l'intégrité physique ou à la santé demeure entière.",
    "10. Termination": "10. Résiliation",
    "contract.termination.body": "La résiliation ordinaire est possible au plus tôt à l'expiration de la durée minimale de 12 mois, avec un préavis de 30 jours, par écrit ou par courriel adressé à hello@lensly.care.",
    "contract.termination.extraordinary": "Chaque partie conserve le droit de résilier le contrat pour motif grave. Pour Lensly, un motif grave est notamment constitué par un retard de paiement de plus de deux mois.",
    "11. Data Protection (GDPR)": "11. Protection des Données (RGPD)",
    "contract.gdpr.body": "Lensly traite les données personnelles du Client exclusivement aux fins d'exécution du contrat, conformément à l'article 6, paragraphe 1, point b) du RGPD. Les données ne sont transmises à des tiers que dans la mesure nécessaire à la fourniture des services (transporteurs, laboratoires ophtalmiques, prestataire de paiement Stripe). Pour plus d'informations, veuillez consulter notre Politique de confidentialité.",
    "12. Governing Law & Jurisdiction": "12. Droit Applicable et Juridiction Compétente",
    "contract.law.body": "Le présent contrat est régi par le droit allemand, à l'exclusion de la Convention des Nations Unies sur les contrats de vente internationale de marchandises (CVIM). Pour tout litige né du présent contrat, et dans la mesure permise par la loi, la compétence territoriale exclusive est attribuée aux juridictions du siège de Lensly.",
    "13. Severability & Entire Agreement": "13. Clause de Divisibilité et Intégralité de l'Accord",
    "contract.severability.body": "Si l'une des clauses du présent contrat est ou devient invalide, la validité des autres clauses n'en est pas affectée. La clause invalide sera remplacée par une disposition valide se rapprochant le plus possible de son objet économique. Le présent contrat constitue l'accord complet des parties sur son objet.",
    "contract.footer": "En finalisant la commande et en apposant sa signature électronique, le Client déclare avoir lu, compris et accepté le présent contrat.",
    "Contract Reference": "Référence du Contrat",
    "Agreement Document & Summary": "Document Contractuel & Récapitulatif",
  },
  es: {
    "Start for €29/mo": "Iniciar por 29 €/mes",
    "One plan · €29 / month": "Un plan · 29 € / mes",
    "Precision vision care, renewed every ": "Cuidado visual de precisión, renovado cada ",
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
    "Free Pair": "Gafas gratis",
    "Every single year": "Cada año",
    "Free Replacements": "Reemplazos gratis",
    "Free of cost": "Sin coste alguno",
    "Only": "Solo",
    "Flat rate": "Tarifa plana",

    // ─── Full Legal Contract — Spanish ────────────────────────────────────
    "LENSLY CARE VISION SUBSCRIPTION AGREEMENT": "CONTRATO DE SUSCRIPCIÓN LENSLY CARE VISIÓN",
    "1. Contracting Parties": "1. Partes Contratantes",
    "contract.parties.body": "El presente contrato se celebra entre Sikder LLC, Alemania (en adelante \"Lensly\" o \"el Proveedor\") y el suscriptor cuyos datos personales, información de pago y aceptación electrónica quedan registrados durante el proceso de compra (en adelante \"el Cliente\").",
    "contract.parties.acceptance": "Al completar el proceso de compra y confirmar el pago, el Cliente acepta el presente contrato por vía electrónica.",
    "2. Subject Matter: Lensly Care Subscription": "2. Objeto del Contrato: Suscripción Lensly Care",
    "contract.subject.body": "Lensly Care es un servicio de suscripción de cuidado visual que ofrece al Cliente acceso a gafas graduadas personalizadas, incluyendo:",
    "contract.subject.item1": "Un (1) par completo de gafas graduadas a medida por año contractual",
    "contract.subject.item2": "Hasta tres (3) sustituciones gratuitas al año (rotura, arañazos o cambio de graduación)",
    "contract.subject.item3": "Lentes premium con tratamiento antirreflejante y protección UV-400",
    "contract.subject.item4": "Envío gratuito en toda la Unión Europea",
    "3. Subscription Fee & Billing": "3. Tarifa de Suscripción y Facturación",
    "contract.billing.body": "La tarifa mensual de la suscripción es de 29,00 € (veintinueve euros). Los cobros se realizan mensualmente y por adelantado a través del proveedor de pagos Stripe Payments Europe, Ltd., mediante domiciliación SEPA o pago Express Wallet (Apple Pay / Google Pay).",
    "contract.billing.sepa": "El impago autoriza a Lensly a suspender la prestación del servicio, incluyendo la fabricación de gafas y el derecho a sustituciones, hasta que se salde el importe pendiente.",
    "4. Minimum Contract Term & Renewal": "4. Duración Mínima del Contrato y Renovación",
    "contract.term.body": "La suscripción tiene una duración mínima de doce (12) meses a partir de la fecha de activación. La cancelación ordinaria durante este período está excluida.",
    "contract.term.renewal": "Transcurrida la duración mínima, el contrato se renueva automáticamente mes a mes al mismo precio. En ese caso, la cancelación es posible con un preaviso de 30 días antes del fin del mes en curso.",
    "5. Annual Eyewear Entitlement": "5. Derecho Anual a las Gafas",
    "contract.eyewear.body": "El Cliente tiene derecho a un (1) par completo de gafas graduadas nuevas por año contractual. Este derecho es válido durante doce (12) meses desde el inicio del contrato y no es transferible al año siguiente.",
    "contract.eyewear.note": "El derecho incluye montura, lentes y todos los tratamientos incluidos de serie. El Cliente elige libremente la montura; Lensly la adquiere según la foto o captura de pantalla proporcionada.",
    "6. Replacement Benefits": "6. Prestaciones de Sustitución",
    "contract.replacements.body": "El Cliente tiene derecho a tres (3) sustituciones gratuitas por año contractual, que se aplican en caso de: rotura o daños significativos, arañazos en los cristales, o cambio clínicamente relevante en la graduación (se requiere receta médica).",
    "contract.replacements.scope": "Las sustituciones abarcan lentes y/o montura según la naturaleza del daño. El envío de las gafas de sustitución es gratuito dentro de la UE.",
    "7. Medical Device Classification": "7. Clasificación como Producto Sanitario",
    "contract.mdr.body": "Las gafas graduadas son productos sanitarios de clase I conforme al Reglamento Europeo sobre Productos Sanitarios (UE MDR 2017/745). Todas las gafas suministradas por Lensly llevan el marcado CE y son fabricadas exclusivamente por laboratorios oftálmicos certificados.",
    "8. Exclusion of Right of Withdrawal": "8. Exclusión del Derecho de Desistimiento",
    "contract.withdrawal.body": "De conformidad con el artículo 103 del Real Decreto Legislativo 1/2007 y la Directiva 2011/83/UE, el derecho de desistimiento de 14 días no se aplica a los bienes elaborados conforme a las especificaciones del consumidor. Las lentes graduadas, fabricadas a medida según los datos personales del Cliente, quedan expresamente excluidas de dicho derecho.",
    "contract.withdrawal.instruction": "El Cliente reconoce y solicita expresamente que Lensly inicie la fabricación personalizada de las lentes desde la confirmación del pedido. El derecho de desistimiento se extingue con el inicio de la fabricación.",
    "9. Liability Limitation": "9. Limitación de Responsabilidad",
    "contract.liability.body": "La responsabilidad de Lensly por negligencia leve queda limitada al importe de la cuota mensual de suscripción, salvo en caso de incumplimiento de obligaciones esenciales del contrato. La responsabilidad legal por dolo, negligencia grave o daños a la vida, integridad física o salud no se ve afectada.",
    "10. Termination": "10. Resolución del Contrato",
    "contract.termination.body": "La cancelación ordinaria es posible a partir del vencimiento del período mínimo de 12 meses, con un preaviso de 30 días, mediante comunicación escrita o por correo electrónico a hello@lensly.care.",
    "contract.termination.extraordinary": "Ambas partes se reservan el derecho de resolver el contrato por causa justificada. Para Lensly, constituye causa justificada el retraso en el pago de más de dos meses.",
    "11. Data Protection (GDPR)": "11. Protección de Datos (RGPD)",
    "contract.gdpr.body": "Lensly trata los datos personales del Cliente exclusivamente para la ejecución del contrato, de acuerdo con el artículo 6.1.b) del RGPD. Los datos solo se transmiten a terceros en la medida necesaria para la prestación del servicio (transportistas, laboratorios oftálmicos, proveedor de pagos Stripe). Para más información, consulte nuestra Política de Privacidad.",
    "12. Governing Law & Jurisdiction": "12. Ley Aplicable y Jurisdicción Competente",
    "contract.law.body": "El presente contrato se rige por el Derecho alemán, con exclusión de la Convención de las Naciones Unidas sobre los Contratos de Compraventa Internacional de Mercaderías (CISG). Para cualquier litigio derivado del presente contrato, la competencia territorial exclusiva corresponde a los tribunales del domicilio social de Lensly, en la medida permitida por la ley.",
    "13. Severability & Entire Agreement": "13. Cláusula de Salvaguarda e Integralidad del Acuerdo",
    "contract.severability.body": "Si alguna de las cláusulas del presente contrato fuera o deviniera nula o ineficaz, ello no afectará a la validez del resto. La cláusula ineficaz será sustituida por una disposición válida que se aproxime lo más posible a su finalidad económica. El presente contrato constituye el acuerdo íntegro entre las partes sobre su objeto.",
    "contract.footer": "Al completar el proceso de compra y firmar electrónicamente, el Cliente declara haber leído, comprendido y aceptado el presente contrato.",
    "Contract Reference": "Referencia del Contrato",
    "Agreement Document & Summary": "Documento Contractual y Resumen",
  },
  it: {
    "Start for €29/mo": "Inizia con 29 €/mese",
    "One plan · €29 / month": "Un piano · 29 € / mese",
    "Precision vision care, renewed every ": "Cura della vista di precisione, rinnovata ogni ",
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
    "Free Pair": "Paio gratis",
    "Every single year": "Ogni singolo anno",
    "Free Replacements": "Sostituzioni gratis",
    "Free of cost": "Senza costi aggiuntivi",
    "Only": "Solo",
    "Flat rate": "Tariffa fissa",

    // ─── Full Legal Contract — Italian ────────────────────────────────────
    "LENSLY CARE VISION SUBSCRIPTION AGREEMENT": "CONTRATTO DI ABBONAMENTO LENSLY CARE VISIONE",
    "1. Contracting Parties": "1. Parti Contraenti",
    "contract.parties.body": "Il presente contratto è concluso tra Sikder LLC, Germania (di seguito \"Lensly\" o \"il Fornitore\") e l'abbonato i cui dati personali, informazioni di pagamento e accettazione elettronica vengono registrati durante il processo di acquisto (di seguito \"il Cliente\").",
    "contract.parties.acceptance": "Completando il processo di acquisto e confermando il pagamento, il Cliente accetta il presente contratto per via elettronica.",
    "2. Subject Matter: Lensly Care Subscription": "2. Oggetto del Contratto: Abbonamento Lensly Care",
    "contract.subject.body": "Lensly Care è un servizio di abbonamento alla cura della vista che offre al Cliente l'accesso a occhiali da vista personalizzati, comprendente:",
    "contract.subject.item1": "Un (1) paio completo di occhiali da vista su misura per anno contrattuale",
    "contract.subject.item2": "Fino a tre (3) sostituzioni gratuite all'anno (rottura, graffi o cambio di graduazione)",
    "contract.subject.item3": "Lenti premium con trattamento antiriflesso e protezione UV-400",
    "contract.subject.item4": "Spedizione gratuita in tutta l'Unione Europea",
    "3. Subscription Fee & Billing": "3. Quota di Abbonamento e Fatturazione",
    "contract.billing.body": "La quota mensile di abbonamento è pari a 29,00 € (ventinove euro). I pagamenti vengono addebitati mensilmente e in anticipo tramite il fornitore di servizi di pagamento Stripe Payments Europe, Ltd., mediante addebito diretto SEPA o pagamento tramite Express Wallet (Apple Pay / Google Pay).",
    "contract.billing.sepa": "Il mancato pagamento autorizza Lensly a sospendere la prestazione dei servizi, incluse la produzione degli occhiali e le sostituzioni, fino al saldo integrale degli importi dovuti.",
    "4. Minimum Contract Term & Renewal": "4. Durata Minima del Contratto e Rinnovo",
    "contract.term.body": "L'abbonamento ha una durata minima di dodici (12) mesi a decorrere dalla data di attivazione. Il recesso ordinario durante tale periodo è escluso.",
    "contract.term.renewal": "Alla scadenza del periodo minimo, il contratto si rinnova automaticamente di mese in mese allo stesso prezzo. In tale caso, il recesso è possibile con un preavviso di 30 giorni prima della fine del mese in corso.",
    "5. Annual Eyewear Entitlement": "5. Diritto Annuale agli Occhiali",
    "contract.eyewear.body": "Il Cliente ha diritto a un (1) nuovo paio completo di occhiali da vista per anno contrattuale. Il diritto è valido per dodici (12) mesi dalla data di inizio del contratto e non è trasferibile all'anno successivo.",
    "contract.eyewear.note": "Il diritto comprende montatura, lenti e tutti i trattamenti inclusi di serie. Il Cliente sceglie liberamente la montatura; Lensly la acquista in base a una foto o screenshot forniti.",
    "6. Replacement Benefits": "6. Prestazioni di Sostituzione",
    "contract.replacements.body": "Il Cliente ha diritto a tre (3) sostituzioni gratuite per anno contrattuale, riconosciute in caso di: rottura o danni significativi, graffi profondi sulle lenti, o variazione clinicamente rilevante della graduazione (è richiesta la presentazione di una ricetta medica).",
    "contract.replacements.scope": "Le sostituzioni comprendono lenti e/o montatura a seconda della natura del danno. La spedizione degli occhiali sostitutivi è gratuita nell'intera UE.",
    "7. Medical Device Classification": "7. Classificazione come Dispositivo Medico",
    "contract.mdr.body": "Gli occhiali da vista sono dispositivi medici di classe I ai sensi del Regolamento europeo sui dispositivi medici (UE MDR 2017/745). Tutti gli occhiali forniti da Lensly recano la marcatura CE e sono fabbricati esclusivamente da laboratori oftalmici certificati.",
    "8. Exclusion of Right of Withdrawal": "8. Esclusione del Diritto di Recesso",
    "contract.withdrawal.body": "Ai sensi dell'art. 59, lett. c) del D.Lgs. 206/2005 (Codice del Consumo) e della Direttiva 2011/83/UE, il diritto di recesso di 14 giorni non si applica ai beni confezionati secondo le specifiche del consumatore. Le lenti da vista, fabbricate su misura in base ai dati personali del Cliente, sono espressamente escluse da tale diritto.",
    "contract.withdrawal.instruction": "Il Cliente riconosce espressamente e chiede a Lensly di dare inizio alla produzione personalizzata delle lenti a partire dalla conferma dell'ordine. Il diritto di recesso si estingue con l'avvio della produzione.",
    "9. Liability Limitation": "9. Limitazione di Responsabilità",
    "contract.liability.body": "La responsabilità di Lensly per colpa lieve è limitata all'importo della quota mensile di abbonamento, salvo in caso di violazione di obblighi contrattuali essenziali. La responsabilità legale per dolo, colpa grave o danni alla vita, all'integrità fisica o alla salute rimane integra.",
    "10. Termination": "10. Risoluzione del Contratto",
    "contract.termination.body": "Il recesso ordinario è possibile a partire dalla scadenza del periodo minimo di 12 mesi, con un preavviso di 30 giorni, mediante comunicazione scritta o via e-mail a hello@lensly.care.",
    "contract.termination.extraordinary": "Entrambe le parti si riservano il diritto di recedere dal contratto per giusta causa. Per Lensly, costituisce giusta causa il ritardo nel pagamento superiore a due mesi.",
    "11. Data Protection (GDPR)": "11. Protezione dei Dati (GDPR)",
    "contract.gdpr.body": "Lensly tratta i dati personali del Cliente esclusivamente per l'esecuzione del contratto, ai sensi dell'art. 6, par. 1, lett. b) del GDPR. I dati vengono trasmessi a terzi solo nella misura necessaria per la fornitura dei servizi (corrieri, laboratori oftalmici, fornitore di pagamenti Stripe). Per ulteriori informazioni, consultare la nostra Informativa sulla Privacy.",
    "12. Governing Law & Jurisdiction": "12. Legge Applicabile e Foro Competente",
    "contract.law.body": "Il presente contratto è disciplinato dal diritto tedesco, con esclusione della Convenzione delle Nazioni Unite sui contratti di vendita internazionale di merci (CISG). Per qualsiasi controversia derivante dal presente contratto, la competenza territoriale esclusiva spetta ai tribunali della sede legale di Lensly, nei limiti consentiti dalla legge.",
    "13. Severability & Entire Agreement": "13. Clausola di Salvaguardia e Integralità dell'Accordo",
    "contract.severability.body": "Qualora una o più clausole del presente contratto siano o diventino nulle o inefficaci, ciò non pregiudica la validità delle restanti disposizioni. La clausola nulla sarà sostituita da una disposizione valida che si avvicini il più possibile al suo scopo economico. Il presente contratto costituisce l'accordo completo tra le parti in merito al suo oggetto.",
    "contract.footer": "Completando il processo di acquisto e apponendo la propria firma elettronica, il Cliente dichiara di aver letto, compreso e accettato il presente contratto.",
    "Contract Reference": "Riferimento Contratto",
    "Agreement Document & Summary": "Documento Contrattuale e Riepilogo",
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
  const [lang, setLangState] = useState<Language>("de");
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
    } else {
      // Autonomously detect browser language
      if (typeof navigator !== "undefined") {
        const browserLang = navigator.language.slice(0, 2).toLowerCase();
        const supportedLangs: Language[] = ["en", "de", "fr", "es", "it"];
        if (supportedLangs.includes(browserLang as Language)) {
          setLangState(browserLang as Language);
          localStorage.setItem("lensly_lang", browserLang);
        } else {
          setLangState("de");
        }
      } else {
        setLangState("de");
      }
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("lensly_lang", newLang);
  };

  const t = (text: string): string => {
    if (!text) {
      return text;
    }

    const langMap = translationsMap[lang] || {};
    if (langMap[text]) {
      return langMap[text];
    }

    if (lang === "en") {
      return text;
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
