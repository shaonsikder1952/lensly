import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "en" | "de" | "fr" | "es" | "it";

interface LanguageContextProps {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (text: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

const initialTranslations: Record<Language, Record<string, string>> = {
  en: {},
  de: {
    "Get started": "Jetzt starten",
    "Start": "Start",
    "Subscribe to Lensly Care": "Lensly Care abonnieren",
    "Subscribe": "Abonnieren",
    "Handcrafted in Germany": "Handgefertigt in Deutschland",
    "Ships in 48h": "Versand in 48h",
    "Over 400 members across EU": "Bereits über 400 Mitglieder in der EU",
    "✓ CE Certified Lenses": "✓ CE-zertifizierte Gläser",
    "✓ Free EU Shipping": "✓ Kostenloser EU-Versand",
    "✓ 14-Day Satisfaction Guarantee": "✓ 14-Tage-Zufriedenheitsgarantie",
    
    // Hero Section
    "Start for €29/mo": "Starten für 29 €/Monat",
    "One plan · €29 / month": "Ein Tarif · 29 € / Monat",
    "New glasses every year. No optician. ": "Neue Brille jedes Jahr. Kein Optiker. ",
    "€29.": "29 €.",
    "Precision vision care, renewed every ": "Erstklassige Sehversorgung, erneuert jedes ",
    "year.": "Jahr.",
    "Every year, a new pair of prescription glasses — delivered straight to your door. Break them? Three free replacements included.":
      "Jedes Jahr eine neue Korrektionsbrille — direkt zu dir nach Hause. Brichst du sie? Drei kostenlose Ersatzpaare inklusive.",
    "Get a fresh pair of premium prescription glasses delivered to your door every single year, plus up to 3 hassle-free accident replacements. All included in one transparent monthly subscription, with no retail markups.":
      "Frische Korrekturbrillen jedes Jahr an Ihre Tür geliefert. Beschädigt oder neues Rezept nötig? Drei kostenlose Ersatzgläser inklusive. Keine Optikerbesuche, keine Überraschungskosten.",
    "Subscribe Now": "Jetzt abonnieren",
    "Explore the Plan": "Plan erkunden",
    "See the plan": "Plan entdecken",
    
    // Trust Badges
    "CE-certified lenses from Germany": "CE-geprüfte Gläser aus Deutschland",
    "Free shipping, EU-wide": "Versand kostenlos, EU-weit",
    "Payment via Stripe — secure": "Bezahlung via Stripe — sicher",
    "Premium Optical Lenses": "Premium Brillengläser",
    "Free EU-Wide Shipping": "Kostenloser EU-Versand",
    "Secure Stripe Checkout": "Sicherer Stripe-Checkout",
    "CE Certified German Lenses": "CE-zertifizierte deutsche Gläser",
    "Free EU Shipping": "Kostenloser EU-Versand",
    "Stripe Secured": "Stripe-gesichert",
    
    // Feature Cards
    "What is included in Lensly Care": "Was bei Lensly Care enthalten ist",
    "Every year, fresh.": "Jedes Jahr frisch.",
    "Your eyesight changes. Your style changes too. That's why we deliver a completely new pair every year — no reordering, no extra cost.":
      "Deine Sehstärke ändert sich. Dein Stil auch. Deshalb liefern wir dir jedes Jahr ein komplett neues Paar — kein Nachbestellen, kein Aufpreis.",
    "Broken? No problem.": "Kaputt? Kein Problem.",
    "Glasses break. We send replacements — up to three times per year, free of charge. Damaged, prescription changed — doesn't matter. We fix it.":
      "Brillen gehen kaputt. Wir schicken Ersatz — bis zu dreimal pro Jahr, kostenlos. Beschädigt, Sehstärke geändert — egal. Wir lösen das.",
    "€29. That's it.": "29 €. Das war's.",
    "No hidden costs. No upcharges for anti-reflective coating or thin lenses. €29 once a month — that's all.":
      "Keine versteckten Kosten. Keine Aufpreise für Entspiegelung oder dünne Gläser. Einmal im Monat 29 € — das ist alles.",
    "1 Free Pair Every Year": "1 neue Brille jedes Jahr gratis",
    "Receive a complete new pair of prescription glasses delivered to your door annually.": "Erhalten Sie jährlich eine komplett neue Korrekturbrille direkt nach Hause geliefert.",
    "3 Free Replacements": "3 kostenlose Ersatzgläser",
    "Accident coverage included. We replace broken lenses or update prescription at zero cost.": "Unfallschutz inklusive. Wir ersetzen beschädigte Gläser oder passen die Sehstärke kostenlos an.",
    "Flat €29 Monthly Only": "Nur 29 € monatlich flat",
    "All-inclusive subscription with zero retail markup or surprise medical billings.": "All-inclusive-Abonnement ohne Händleraufschläge oder überraschende Zusatzkosten.",
    
    // Plan Comparison
    "The honest comparison.": "Der ehrliche Vergleich.",
    "€400 once at the optician or €29/month with us. The difference is in the details.":
      "Einmalig €400 beim Optiker oder €29/Monat bei uns. Der Unterschied liegt im Detail.",
    "One simple monthly rate": "Eine einfache monatliche Rate",
    "Continuous vision care with no upfront costs or retail markup": "Kontinuierliche Sehversorgung ohne Vorabkosten oder Einzelhandelsaufschlag",
    "Traditional optician": "Herkömmlicher Optiker",
    "Upfront · 1 pair · no free replacements": "Einmalig · 1 Brille · kein kostenloser Ersatz",
    "Broken glasses? Full price, no replacement.": "Kaputte Brille? Voller Preis, kein Ersatz.",
    "Anti-reflective, UV coating — all extra, all expensive.": "Entspiegelung, UV-Schutz — alles extra, alles teuer.",
    "New prescription? Another €400 out.": "Neue Sehstärke? Nochmal €400 raus.",
    "Wait 2–3 years until you can afford it again.": "2–3 Jahre warten bis du es dir wieder leisten kannst.",
    "Wait 2–3 years to save up money and buy again":
      "2–3 Jahre warten, um Geld zu sparen und neu zu kaufen",
    "Accidental replacements cost full retail price": "Unfall-Ersatz kostet den vollen Ladenpreis",
    "Coatings & high-index lenses billed as extras": "Beschichtungen & dünne Gläser kosten extra",
    "Outdated prescription within 12 months": "Veraltete Sehstärke innerhalb von 12 Monaten",
    "Lensly Care": "Lensly Care",
    "The subscription": "Das Abonnement",
    "/ month": "/ Monat",
    "Continuous vision care": "Kontinuierliche Sehversorgung",
    "€0.95 a day": "0,95 € pro Tag",
    "less than a daily coffee": "weniger als ein täglicher Kaffee",
    "1 new pair of precision lenses every year": "1 neues Paar Präzisionsgläser jedes Jahr",
    "3 free replacements (broken, power change? We got you covered)":
      "3 kostenlose Ersatzgläser (beschädigt, Sehstärke geändert? Wir helfen)",
    "Premium lenses, anti-reflective & UV-400 coatings included":
      "Premium-Gläser, Entspiegelung & UV-400 inklusive",
    "Free shipping EU-wide · minimum 1 year contract":
      "Kostenloser EU-Versand · Mindestlaufzeit 1 Jahr",
    "Subscribe to Lensly Care": "Lensly Care abonnieren",
    "Secure checkout via Stripe": "Sicherer Checkout über Stripe",
    
    // Process Steps
    "How it works": "Wie es funktioniert",
    "Get your custom prescription glasses in five simple steps.": "Erhalte deine maßgefertigten Brillen in fünf einfachen Schritten.",
    "Subscribe via Stripe": "Über Stripe abonnieren",
    "Just click 'Subscribe' below — takes 2 minutes.": "Einfach unten auf 'Abonnieren' klicken — dauert 2 Minuten.",
    "Select your plan and complete checkout securely.":
      "Wählen Sie Ihren Plan und schließen Sie den Checkout sicher ab.",
    "E-mail contact within 24 hours": "Kontakt per E-Mail innerhalb von 24 Stunden",
    "We'll reach out within a day via email and ask for everything we need.":
      "Wir melden uns innerhalb eines Tages per Mail und fragen alles Nötige ab.",
    "We reach out to gather your custom prescription details.":
      "Wir melden uns bei Ihnen, um die Details Ihres Brillenglaskonzepts zu erfassen.",
    "Send frame details": "Gestell-Details senden",
    "Just reply to our email with your prescription, PD, and a photo of the frame you like — from any shop, any brand.":
      "Einfach auf unsere Mail antworten mit deinem Rezept, deiner PD-Stärke und einem Foto des Gestells, das du magst — aus jedem Shop, jeder Marke.",
    "3. Send us prescription, pupillary distance & chosen frame":
      "3. Rezept, Pupillendistanz (PD) & Wunschgestell zusenden",
    "Simply reply with your values and a photo/screenshot of any frame you want.":
      "Antworten Sie einfach mit Ihren Werten und einem Foto/Screenshot des gewünschten Gestells.",
    "Sourcing & production": "Beschaffung & Anfertigung",
    "We order the frame for you and have your lenses made to spec.":
      "Wir bestellen das Gestell für dich und lassen deine Gläser nach Maß fertigen.",
    "We purchase your frame and craft your custom lenses to specification.":
      "Wir erwerben Ihr Gestell und fertigen Ihre maßgeschneiderten Gläser nach Ihren Angaben an.",
    "Delivered to your door": "Lieferung direkt zu dir",
    "In about 15 days, your new glasses arrive in the mailbox — done.":
      "In ca. 15 Tagen liegt deine neue Brille im Briefkasten — fertig.",
    "Your finished prescription eyewear arrives in approximately 15 days.":
      "Ihre fertige Korrektionsbrille kommt in ca. 15 Tagen bei Ihnen an.",
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
    "Still have questions?": "Noch Fragen?",
    "Everything you need to know": "Alles, was Sie wissen müssen",
    "The things people ask us most.": "Die Dinge, die uns am häufigsten gefragt werden.",
    "Who is behind Lensly?": "Wer steht hinter Lensly?",
    "We're a small team from Germany. The idea came up because glasses in Europe are absurdly expensive — not because they have to be, but because the market wants it that way. We work directly with certified optical labs and skip the retail markup.":
      "Wir sind ein kleines Team aus Deutschland. Die Idee entstand, weil Brillen in Europa absurd teuer sind — nicht weil sie es sein müssen, sondern weil der Markt es so will. Wir arbeiten direkt mit zertifizierten Optiklaboren zusammen und lassen den Händleraufschlag weg.",
    "Lensly is a small independent team focused on making quality prescription eyewear affordable and accessible across Europe. We work directly with certified optical labs to cut out retail markups.":
      "Lensly ist ein kleines, unabhängiges Team, das sich darauf konzentriert, hochwertige Korrektionsbrillen in ganz Europa erschwinglich und zugänglich zu machen. Wir arbeiten direkt mit zertifizierten Optiklaboren zusammen, um Händlerspannen zu vermeiden.",
    "Can I see frame options before subscribing?":
      "Kann ich die Brillengestelle vor dem Abonnement sehen?",
    "Yes — and that's actually the best part. You can pick any frame you like. From Mister Spex, JINS, a local optician, Amazon — doesn't matter. Just send us a screenshot and we'll source the frame for you. No markup, no restrictions.":
      "Ja — und das ist eigentlich das Beste daran. Du kannst jede Brille nehmen, die dir gefällt. Von Mister Spex, JINS, einem lokalen Optiker, Amazon — völlig egal. Schick uns einfach einen Screenshot und wir besorgen das Gestell für dich. Keine Aufpreis, keine Einschränkung.",
    "Yes. You choose any frame you like, from any brand, online shop, or store. Send us a photo or screenshot and we source it for you. No limitations.":
      "Ja. Sie können jedes beliebige Gestell wählen – von jeder Marke, aus jedem Online-Shop oder Ladengeschäft. Schicken Sie uns einfach ein Foto oder einen Screenshot und wir besorgen es für Sie. Keine Einschränkungen.",
    "How do I get my pupillary distance measured?": "Wie messe ich meine Pupillendistanz (PD)?",
    "Visit any local optician or eye doctor for a quick measurement. Takes 2 minutes and is usually free. Then just include it in your email to us.":
      "Besuche einen lokalen Optiker oder Augenarzt für eine schnelle Messung. Dauert 2 Minuten und ist in der Regel kostenlos. Füge den Wert einfach deiner E-Mail an uns bei.",
    "Visit any local optician or doctor for a quick measurement. It takes 2 minutes and is usually free. Then just include it in your email to us.":
      "Besuchen Sie einen lokalen Optiker oder Augenarzt für eine schnelle Messung. Es dauert nur 2 Minuten und ist in der Regel kostenlos. Fügen Sie den Wert einfach Ihrer E-Mail an uns bei.",
    "What if my lenses are wrong?": "Was ist, wenn meine Gläser nicht stimmen?",
    "Then we'll do it again. Free of charge. No discussion.":
      "Dann machen wir's nochmal. Kostenlos. Keine Diskussion.",
    "We send a replacement pair free of charge, no questions asked.":
      "Wir senden Ihnen kostenlos und ohne Rückfragen ein neues Paar zu.",
    "I have a strong prescription — will this still work?":
      "Ich habe eine starke Sehschwäche — klappt das trotzdem?",
    "Yes. We make lenses for all common prescriptions, including high diopters and astigmatism. Drop us a message before subscribing if you're unsure.":
      "Ja. Wir fertigen Gläser für alle gängigen Sehstärken an, auch für hohe Dioptrien und Astigmatismus. Schreib uns kurz vor dem Abonnieren falls du unsicher bist.",
    "How do returns or refunds work?": "Wie funktionieren Rückgaben oder Rückerstattungen?",
    "If there's a production error on our end, we fix it for free. Custom prescription lenses can't be refunded once made, but we'll always find a solution that works.":
      "Wenn es auf unserer Seite einen Produktionsfehler gibt, beheben wir ihn kostenlos. Maßgefertigte Korrektionsgläser können nach der Produktion nicht erstattet werden, aber wir finden immer eine Lösung, die funktioniert.",
    "If there is a production error on our side we fix it completely free. Custom prescription lenses cannot be refunded once produced, but we will always make it right.":
      "Bei Produktionsfehlern unsererseits beheben wir diese vollkommen kostenlos. Da es sich um maßgefertigte Korrektionsgläser handelt, ist eine Rückerstattung nach der Produktion ausgeschlossen, aber wir finden immer eine zufriedenstellende Lösung.",
    "Do I buy the frame or do you?": "Kaufe ich das Gestell selbst oder übernehmt ihr das?",
    "We source the frame for you based on your photo or screenshot. It's included in your subscription — nothing extra to pay.":
      "Wir besorgen das Gestell basierend auf deinem Foto oder Screenshot für dich. Es ist in deinem Abonnement enthalten — du musst nichts extra bezahlen.",
    "We source the frame for you based on your photo or screenshot. It is included in your subscription, nothing extra to pay.":
      "Wir beschaffen das Gestell basierend auf Ihrem Foto oder Screenshot für Sie. Es ist in Ihrem Abonnement enthalten – Sie müssen nichts extra bezahlen.",
    
    // Reviews Section
    "What our members say": "Was unsere Mitglieder sagen",
    "What our members are saying": "Was unsere Mitglieder sagen",
    "Loved by students, office professionals, and daily screen-users": "Geliebt von Studenten, Büroangestellten und täglichen Bildschirmnutzern",
    "Medical Student, LMU Munich": "Medizinstudentin, LMU München",
    "Student": "Student",
    "As a student, I couldn't just drop €380 for new glasses every two years. With Lensly I pay €29 a month and get a new pair every year. Last week my frame got damaged — the replacement arrived in 4 days.":
      "Als Studentin konnte ich mir alle zwei Jahre nicht einfach €380 für eine neue Brille leisten. Mit Lensly zahle ich 29 € im Monat und bekomme jedes Jahr ein neues Paar. Letzte Woche wurde mein Gestell beschädigt — der Ersatz war in 4 Tagen da.",
    "As a student, paying €400 upfront at traditional opticians was impossible. Lensly's €29 flat monthly rate is insanely cheap and completely hassle-free. Got my second pair last week—super clean lenses and fast shipping!":
      "Als Studentin war es unmöglich, beim herkömmlichen Optiker €400 auf einmal zu bezahlen. Lenslys €29 Pauschalpreis pro Monat ist unglaublich günstig und völlig unkompliziert. Habe letzte Woche mein zweites Paar bekommen — super saubere Gläser und schneller Versand!",
    "Senior Consultant, Accenture": "Senior Consultant, Accenture",
    "Office Worker": "Büroangestellte/r",
    "I work 9 hours a day in front of three monitors. The blue-light filter lenses from Lensly are noticeably better than what I used to buy at the local optician — and for a third of the price. Setup took 10 minutes.":
      "Ich arbeite täglich 9 Stunden vor drei Bildschirmen. Die Blaulichtfilter-Gläser von Lensly sind deutlich besser als das, was ich früher beim lokalen Optiker gekauft habe — und das für ein Drittel des Preises. Einrichtung hat 10 Minuten gedauert.",
    "I sit in front of three monitors all day. The blue-light filter lenses Lensly provides are top quality, and the 3 free accident replacements are a lifesaver. Had a frame break last month, and a brand new one arrived in 3 days. No hidden fees, no headache.":
      "Ich sitze den ganzen Tag vor drei Bildschirmen. Die Blaulichtfilter-Gläser von Lensly sind von höchster Qualität, und die 3 kostenlosen Unfallersatzgläser sind ein Lebensretter. Letzten Monat ist mein Gestell kaputt gegangen, und nach 3 Tagen kam ein brandneues an. Keine versteckten Gebühren, kein Ärger.",
    "Computer Science Student, TU Berlin": "Informatik-Student, TU Berlin",
    "The first delivery took almost 18 days, which I found a bit long. But the lenses were precise, the anti-reflective coating was good, and the second pair arrived in 12 days. For €29/month, definitely fair.":
      "Die erste Lieferung hat knapp 18 Tage gedauert, was ich etwas lang fand. Aber die Gläser waren präzise, die Entspiegelung gut, und beim zweiten Paar war's in 12 Tagen da. Für €29/Monat definitiv fair.",
    "Honestly, the best prescription glasses service I've ever used. Getting a new pair every 12 months is perfect for updating my prescription, and the cheap flat rate fits my student budget perfectly. Hassle-free setup, quick delivery, and top quality.":
      "Ehrlich gesagt, der beste Service für verschreibungspflichtige Brillen, den ich je genutzt habe. Jedes Jahr ein neues Paar zu bekommen ist perfekt, um meine Sehstärke anzupassen, und der günstige Pauschalpreis passt perfekt in mein Studentenbudget. Unkomplizierter Aufbau, schnelle Lieferung und höchste Qualität.",
    "Business Student, FU Berlin": "BWL-Student, FU Berlin",
    "I never understood why glasses should be so expensive. Lensly explains it: because opticians charge retail markups. With the subscription I pay €348 per year for new glasses including replacements — at the optician, one pair alone was €320.":
      "Ich habe vorher nie verstanden, warum Brillen so teuer sein sollen. Lensly erklärt's: weil Optiker Händleraufschläge verlangen. Mit dem Abo zahle ich €348 im Jahr für eine neue Brille inklusive Ersatz — beim Optiker war allein ein Paar €320.",
    "So simple. €29/month is the absolute best deal for students. Highly recommend!":
      "So einfach. €29/Monat ist das absolut beste Angebot für Studenten. Sehr empfehlenswert!",
    "Administrative Assistant, Siemens": "Assistentin, Siemens",
    "After an accident I requested my replacement pair. One short email to Lensly, two photos, three days later the new glasses arrived. No forms, no phone call.":
      "Habe nach einem Unfall mein Ersatzpaar angefordert. Eine kurze Mail an Lensly, zwei Fotos, drei Tage später war die neue Brille da. Keine Formulare, kein Telefonat.",
    "Absolutely hassle-free. Got my replacement glasses in just 2 days. Brilliant service!":
      "Absolut unkompliziert. Habe meine Ersatzbrille in nur 2 Tagen bekommen. Brillanter Service!",
    "Marketing Manager, Zalando": "Marketing Manager, Zalando",
    "I change my style every year. At a normal optician that costs €400 per pair. Now I just pick a new frame, send a screenshot — and get it built and delivered. That's the model I always wanted.":
      "Ich wechsle jedes Jahr meinen Stil. Bei einem normalen Optiker kostet das €400 pro Brille. Jetzt suche ich mir einfach ein neues Gestell aus, schicke einen Screenshot — und bekomme es gebaut und geliefert. Das ist das Modell, das ich immer wollte.",
    "German lenses are crystal clear. I love my fresh style every year!":
      "Die deutschen Gläser sind kristallklar. Ich liebe meinen frischen Stil jedes Jahr!",
    "Verified Member": "Verifiziertes Mitglied",
    "See Less": "Weniger anzeigen",
    "See More": "Mehr anzeigen",
    
    // Navigation Menu
    "Home": "Startseite",
    "Pricing": "Preise",
    "Frames": "Gestelle",
    "Feedbacks": "Bewertungen",
    "FAQ": "FAQ",
    "Select Language": "Sprache auswählen",
    "Contact Us": "Kontakt",
    "Have questions? Send us an email directly.": "Hast du Fragen? Schick uns direkt eine E-Mail.",
    "Send Email": "E-Mail senden",
    "Copy Email Address": "E-Mail-Adresse kopieren",
    "Copied!": "Kopiert!",
    "Sign Contract": "Vertrag unterzeichnen",
    "Impressum": "Impressum",
    "Datenschutz": "Datenschutz",
    "AGB": "AGB",
    "Vertrag hier kündigen": "Vertrag hier kündigen",
    
    // Product Gallery
    "Signature Frame Styles": "Signatur-Gestelle",
    "Send us a photo — we'll source the frame for you.": "Schick uns ein Foto — wir besorgen das Gestell für dich.",
    "CE-certified German prescription lenses fitted to premium frames": "CE-zertifizierte deutsche Korrektionsgläser in Premium-Gestellen",
    "Explore All Signature Frames": "Alle Signatur-Gestelle erkunden",
    
    // Footer
    "Questions about your subscription? Write to us:": "Fragen zum Abo? Schreib uns:",
    "For any help or requests regarding subscription please contact at":
      "Bei Fragen oder Wünschen zu Ihrem Abonnement kontaktieren Sie uns bitte unter",
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
    "Submit Cancellation Request": "Jetzt kündigen",
    "Cancellation Submitted": "Kündigung eingereicht",
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
    "Please enter your full name.": "Bitte geben Sie Ihren vollständigen Namen ein.",
    "Please enter a valid email address.": "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
    "Please confirm the cancellation request.": "Bitte bestätigen Sie die Kündigungsanfrage.",
    "Online Cancellation Portal (§ 312k BGB)": "Online-Kündigungsportal (§ 312k BGB)",
    "Please complete this form to request cancellation of your continuous vision care plan.": "Bitte füllen Sie dieses Formular aus, um die Kündigung Ihres Lensly Care-Abonnements zu beantragen.",
    "Full Name": "Vollständiger Name",
    "Contract Number": "Vertragsnummer",
    "Cancellation Date": "Kündigungsdatum",
    "Next possible date (contractual notice)": "Nächstmöglicher Zeitpunkt (fristgerecht)",
    "Immediate termination (extraordinary, proof required)": "Außerordentliche Kündigung (Nachweis erforderlich)",
    "I hereby request the legally binding cancellation of my subscription. I acknowledge the 12-month fixed minimum duration & 30-day notice periods.": "Ich beantrage hiermit die rechtsverbindliche Kündigung meines Abonnements. Ich bestätige die 12-monatige Mindestlaufzeit & 30-tägige Kündigungsfrist.",
    "Request Confirmed": "Anfrage bestätigt",
    "Your cancellation has been successfully logged and processed. We have registered your request and emailed a verification confirmation to your inbox.": "Ihre Kündigung wurde erfolgreich erfasst und bearbeitet. Wir haben Ihre Anfrage registriert und eine Bestätigung an Ihre E-Mail-Adresse gesendet.",
    "Cancellation summary": "Kündigungszusammenfassung",
    "Contract Holder:": "Vertragsinhaber:",
    "Registered Email:": "Registrierte E-Mail:",
    "Contract Reference:": "Vertragsreferenz:",
    "Cancellation Date:": "Kündigungsdatum:",
    "Next Contractual Possible Date": "Nächstmöglicher Vertragszeitpunkt",
    "Immediate Termination (Pending Proof)": "Außerordentliche Kündigung (ausstehender Nachweis)",
    "You do not need to take any further action. You can close this tab or return to the homepage.": "Sie müssen nichts weiter tun. Sie können diesen Tab schließen oder zur Startseite zurückkehren.",
    "Return Home": "Zurück zur Startseite"
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
    "Cancel Subscription": "Résilier le contrat",
    "Withdraw Subscription": "Rétracter le contrat",
    "Submit Cancellation Request": "Résilier le contrat",
    "Cancellation Submitted": "Annulation soumise",
    "Please enter your full name.": "Veuillez entrer votre nom complet.",
    "Please enter a valid email address.": "Veuillez entrer une adresse e-mail valide.",
    "Please confirm the cancellation request.": "Veuillez confirmer la demande d'annulation.",
    "Online Cancellation Portal (§ 312k BGB)": "Portail d'annulation en ligne (§ 312k BGB)",
    "Please complete this form to request cancellation of your continuous vision care plan.": "Veuillez remplir ce formulaire pour demander l'annulation de votre abonnement Lensly Care.",
    "Full Name": "Nom complet",
    "Contract Number": "Numéro de contrat",
    "Cancellation Date": "Date d'annulation",
    "Next possible date (contractual notice)": "Prochaine date possible (délai contractuel)",
    "Immediate termination (extraordinary, proof required)": "Résiliation immédiate (extraordinaire, justificatif requis)",
    "I hereby request the legally binding cancellation of my subscription. I acknowledge the 12-month fixed minimum duration & 30-day notice periods.": "Je demande par la présente l'annulation juridiquement contraignante de mon abonnement. Je reconnais la durée minimale fixe de 12 mois et les délais de préavis de 30 jours.",
    "Request Confirmed": "Demande confirmée",
    "Your cancellation has been successfully logged and processed. We have registered your request and emailed a verification confirmation to your inbox.": "Votre annulation a été enregistrée et traitée avec succès. Nous avons enregistré votre demande et envoyé une confirmation de vérification dans votre boîte de réception.",
    "Cancellation summary": "Résumé de l'annulation",
    "Contract Holder:": "Titulaire du contrat:",
    "Registered Email:": "E-mail enregistré:",
    "Contract Reference:": "Référence du contrat:",
    "Cancellation Date:": "Date d'annulation:",
    "Next Contractual Possible Date": "Prochaine date contractuelle possible",
    "Immediate Termination (Pending Proof)": "Résiliation immédiate (en attente de preuve)",
    "You do not need to take any further action. You can close this tab or return to the homepage.": "Vous n'avez aucune autre action à entreprendre. Vous pouvez fermer cet onglet ou retourner à la page d'accueil.",
    "Return Home": "Retour à l'accueil"
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
    "Cancel Subscription": "Cancelar suscripción",
    "Withdraw Subscription": "Revocar suscripción",
    "Submit Cancellation Request": "Cancelar suscripción",
    "Cancellation Submitted": "Cancelación enviada",
    "Please enter your full name.": "Por favor ingrese su nombre completo.",
    "Please enter a valid email address.": "Por favor ingrese una dirección de correo electrónico válida.",
    "Please confirm the cancellation request.": "Por favor confirme la solicitud de cancelación.",
    "Online Cancellation Portal (§ 312k BGB)": "Portal de cancelación en línea (§ 312k BGB)",
    "Please complete this form to request cancellation of your continuous vision care plan.": "Complete este formulario para solicitar la cancelación de su plan de cuidado de la visión continuo.",
    "Full Name": "Nombre completo",
    "Contract Number": "Número de contrato",
    "Cancellation Date": "Fecha de cancelación",
    "Next possible date (contractual notice)": "Próxima fecha posible (aviso contractual)",
    "Immediate termination (extraordinary, proof required)": "Terminación inmediata (extraordinaria, se requiere comprobante)",
    "I hereby request the legally binding cancellation of my subscription. I acknowledge the 12-month fixed minimum duration & 30-day notice periods.": "Por la presente solicito la cancelación legalmente vinculante de mi suscripción. Reconozco la duración mínima fija de 12 meses y los períodos de preaviso de 30 días.",
    "Request Confirmed": "Solicitud confirmada",
    "Your cancellation has been successfully logged and processed. We have registered your request and emailed a verification confirmation to your inbox.": "Su cancelación se ha registrado y procesado correctamente. Hemos registrado su solicitud y enviado una confirmación de verificación a su bandeja de entrada.",
    "Cancellation summary": "Resumen de cancelación",
    "Contract Holder:": "Titular del contrato:",
    "Registered Email:": "Correo electrónico registrado:",
    "Contract Reference:": "Referencia del contrato:",
    "Cancellation Date:": "Fecha de cancelación:",
    "Next Contractual Possible Date": "Próxima fecha contractual posible",
    "Immediate Termination (Pending Proof)": "Terminación inmediata (prueba pendiente)",
    "You do not need to take any further action. You can close this tab or return to the homepage.": "No es necesario realizar ninguna otra acción. Puede cerrar esta pestaña o volver a la página de inicio.",
    "Return Home": "Volver a inicio"
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
    "Cancel Subscription": "Annulla abbonamento",
    "Withdraw Subscription": "Revoca abbonamento",
    "Submit Cancellation Request": "Annulla abbonamento",
    "Cancellation Submitted": "Cancellazione inviata",
    "Please enter your full name.": "Inserisci il tuo nome completo.",
    "Please enter a valid email address.": "Inserisci un indirizzo email valido.",
    "Please confirm the cancellation request.": "Si prega di confermare la richiesta di cancellazione.",
    "Online Cancellation Portal (§ 312k BGB)": "Portale di cancellazione online (§ 312k BGB)",
    "Please complete this form to request cancellation of your continuous vision care plan.": "Compila questo modulo per richiedere la cancellazione del tuo abbonamento continuo per la cura della vista.",
    "Full Name": "Nome completo",
    "Contract Number": "Numero di contratto",
    "Cancellation Date": "Data di cancellazione",
    "Next possible date (contractual notice)": "Prossima data possibile (preavviso contrattuale)",
    "Immediate termination (extraordinary, proof required)": "Risoluzione immediata (straordinaria, prova richiesta)",
    "I hereby request the legally binding cancellation of my subscription. I acknowledge the 12-month fixed minimum duration & 30-day notice periods.": "Richiedo con la presente la cancellazione legalmente vincolante del mio abbonamento. Riconosco la durata minima fissa di 12 mesi e i periodi di preavviso di 30 giorni.",
    "Request Confirmed": "Richiesta confermata",
    "Your cancellation has been successfully logged and processed. We have registered your request and emailed a verification confirmation to your inbox.": "La tua cancellazione è stata registrata ed elaborata con successo. Abbiamo registrato la tua richiesta e inviato una conferma di verifica alla tua casella di posta.",
    "Cancellation summary": "Riepilogo della cancellazione",
    "Contract Holder:": "Intestatario del contratto:",
    "Registered Email:": "Email registrata:",
    "Contract Reference:": "Riferimento del contratto:",
    "Cancellation Date:": "Data di cancellazione:",
    "Next Contractual Possible Date": "Prossima data contrattuale possibile",
    "Immediate Termination (Pending Proof)": "Risoluzione immediata (in attesa di prova)",
    "You do not need to take any further action. You can close this tab or return to the homepage.": "Non è necessario intraprendere ulteriori azioni. Puoi chiudere questa scheda o tornare alla homepage.",
    "Return Home": "Ritorna alla home"
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
      setLangState("de");
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
    
    // First check state translations
    if (langMap[text]) {
      return langMap[text];
    }

    // Then check cache (faster than API)
    if (translationCache[lang] && translationCache[lang][text]) {
      return translationCache[lang][text];
    }

    // OPTIONAL: Uncomment below to enable dynamic Google translation for missing keys
    // fetchTranslation(text, lang);

    // Return original text if no translation found (instant, no delay)
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
    
    // Contract Translations
    "LENSLY CARE VISION SUBSCRIPTION AGREEMENT": "LENSLY CARE SEHVERSORGUNG ABONNEMENTVERTRAG",
    "Contract Reference": "Vertragsreferenz",
    "1. Contracting Parties": "1. Vertragsparteien",
    "This agreement is concluded between:": "Dieser Vertrag wird geschlossen zwischen:",
    "Sikder LLC, Germany": "Sikder LLC, Deutschland",
    "(hereinafter referred to as \"Lensly\" or \"the Provider\")": "(nachfolgend \"Lensly\" oder \"der Anbieter\" genannt)",
    "the subscriber whose personal information, payment details, and electronic acceptance are recorded during the checkout process (hereinafter referred to as \"the Customer\").": "dem Abonnenten, dessen persönliche Informationen, Zahlungsdetails und elektronische Zustimmung während des Checkout-Prozesses erfasst werden (nachfolgend \"der Kunde\" genannt).",
    "By completing the checkout process and confirming payment, the Customer accepts this agreement electronically.": "Durch Abschluss des Checkout-Prozesses und Bestätigung der Zahlung akzeptiert der Kunde diese Vereinbarung elektronisch.",
    "2. Lensly Care Subscription": "2. Lensly Care Abonnement",
    "Lensly Care is a vision subscription service providing customers with access to custom-made prescription eyewear benefits.": "Lensly Care ist ein Sehversorgungsabonnement, das Kunden Zugang zu maßgefertigten Korrektionsbrillenleistungen bietet.",
    "One (1) complete custom-made prescription glasses pair per contract year.": "Eine (1) komplette maßgefertigte Korrekturbrille pro Vertragsjahr.",
    "Up to three (3) approved replacement services per contract year according to the replacement conditions described in this agreement.": "Bis zu drei (3) genehmigte Ersatzleistungen pro Vertragsjahr gemäß den in dieser Vereinbarung beschriebenen Ersatzbedingungen.",
    "3. Lensly Delivery Commitment": "3. Lensly Lieferverpflichtung",
    "Once the Lensly Care subscription agreement has been successfully established and the Customer has provided all required information, including valid prescription details, fitting information, and frame selection approval, Lensly is obligated to provide the included custom-made prescription eyewear benefit according to the terms of this agreement.": "Sobald der Lensly Care Abonnementvertrag erfolgreich abgeschlossen wurde und der Kunde alle erforderlichen Informationen bereitgestellt hat, einschließlich gültiger Rezeptangaben, Anpassungsinformationen und Gestellauswahl, ist Lensly verpflichtet, die enthaltene maßgefertigte Korrektionsbrillenleistung gemäß den Bedingungen dieser Vereinbarung bereitzustellen.",
    "Lensly will make reasonable efforts to complete production and delivery within the stated timeframe.": "Lensly wird angemessene Anstrengungen unternehmen, um Produktion und Lieferung innerhalb des angegebenen Zeitrahmens abzuschließen.",
    "Delays caused by missing customer information, supplier availability, laboratory processing times, shipping conditions, or circumstances outside Lensly's reasonable control do not remove Lensly's obligation to fulfil the agreed eyewear benefit.": "Verzögerungen, die durch fehlende Kundeninformationen, Lieferantenverfügbarkeit, Laborverarbeitungszeiten, Versandbedingungen oder Umstände außerhalb der angemessenen Kontrolle von Lensly verursacht werden, heben Lenslys Verpflichtung zur Erfüllung der vereinbarten Brillenleistung nicht auf.",
    "Lensly will continue to work toward completion and delivery of the Customer's included eyewear benefit.": "Lensly wird weiterhin an der Fertigstellung und Lieferung der enthaltenen Brillenleistung des Kunden arbeiten.",
    "4. Minimum Contract Term and Renewal": "4. Mindestvertragslaufzeit und Verlängerung",
    "The Lensly Care subscription has a minimum contract term of twelve (12) months from the activation date.": "Das Lensly Care Abonnement hat eine Mindestvertragslaufzeit von zwölf (12) Monaten ab Aktivierungsdatum.",
    "The contract year begins on the date of subscription activation and continues for twelve (12) consecutive months.": "Das Vertragsjahr beginnt am Tag der Abonnementaktivierung und dauert zwölf (12) aufeinanderfolgende Monate.",
    "After the initial twelve-month period, the subscription automatically continues on a monthly basis and may be cancelled with thirty (30) days' notice.": "Nach der anfänglichen Zwölfmonatsperiode setzt sich das Abonnement automatisch monatlich fort und kann mit einer Frist von dreißig (30) Tagen gekündigt werden.",
    "The Customer acknowledges that the minimum financial commitment during the initial contract term is €348 (€29 × 12 months).": "Der Kunde bestätigt, dass die finanzielle Mindestverpflichtung während der anfänglichen Vertragslaufzeit 348 € (29 € × 12 Monate) beträgt.",
    "5. Subscription Fee and Payment": "5. Abonnementgebühr und Zahlung",
    "The subscription fee is €29 per month.": "Die Abonnementgebühr beträgt 29 € pro Monat.",
    "Payments are collected monthly in advance through approved payment providers, including Stripe-supported payment methods.": "Zahlungen werden monatlich im Voraus über genehmigte Zahlungsanbieter eingezogen, einschließlich von Stripe unterstützter Zahlungsmethoden.",
    "The Customer is responsible for maintaining valid payment information.": "Der Kunde ist für die Aufrechterhaltung gültiger Zahlungsinformationen verantwortlich.",
    "If a payment cannot be processed, Lensly will notify the Customer and provide an opportunity to update payment information or complete payment.": "Wenn eine Zahlung nicht verarbeitet werden kann, wird Lensly den Kunden benachrichtigen und die Möglichkeit bieten, Zahlungsinformationen zu aktualisieren oder die Zahlung abzuschließen.",
    "The first failed payment attempt will not result in an additional charge.": "Der erste fehlgeschlagene Zahlungsversuch führt nicht zu einer zusätzlichen Gebühr.",
    "For repeated failed payment attempts caused by customer-related payment issues, Lensly may apply a reasonable processing fee of €5 per failed payment attempt after notifying the Customer.": "Bei wiederholten fehlgeschlagenen Zahlungsversuchen aufgrund kundenbezogener Zahlungsprobleme kann Lensly nach Benachrichtigung des Kunden eine angemessene Bearbeitungsgebühr von 5 € pro fehlgeschlagenem Zahlungsversuch erheben.",
    "6. First Glasses Production Process": "6. Erster Brillenproduktionsprozess",
    "After activation, the Customer must provide all required information, including valid prescription details, fitting information, and selected frame information.": "Nach der Aktivierung muss der Kunde alle erforderlichen Informationen bereitstellen, einschließlich gültiger Rezeptangaben, Anpassungsinformationen und ausgewählter Gestellinformationen.",
    "The Customer may select a preferred frame and provide frame details or images through approved Lensly communication channels.": "Der Kunde kann ein bevorzugtes Gestell auswählen und Gestelldetails oder Bilder über genehmigte Lensly-Kommunikationskanäle bereitstellen.",
    "Lensly will confirm the selected frame before production begins.": "Lensly wird das ausgewählte Gestell bestätigen, bevor die Produktion beginnt.",
    "Custom lens processing will begin only after the required information and approvals have been received.": "Die maßgefertigte Glasverarbeitung beginnt erst, nachdem die erforderlichen Informationen und Genehmigungen eingegangen sind.",
    "Because the first glasses are custom-made according to the Customer's individual prescription, measurements, and selected frame, the Customer may request changes before final confirmation of the first glasses order.": "Da die erste Brille nach dem individuellen Rezept, den Maßen und dem ausgewählten Gestell des Kunden maßgefertigt wird, kann der Kunde vor der endgültigen Bestätigung der ersten Brillenbestellung Änderungen anfordern.",
    "Once the Customer has confirmed the first glasses order through an approved Lensly communication channel, including email or another official communication method, the custom glasses order cannot be cancelled or changed due to the individual nature of the product.": "Sobald der Kunde die erste Brillenbestellung über einen genehmigten Lensly-Kommunikationskanal bestätigt hat, einschließlich E-Mail oder einer anderen offiziellen Kommunikationsmethode, kann die maßgefertigte Brillenbestellung aufgrund der individuellen Natur des Produkts nicht storniert oder geändert werden.",
    "Lensly will proceed with fulfilling the confirmed eyewear benefit according to the details approved by the Customer.": "Lensly wird mit der Erfüllung der bestätigten Brillenleistung gemäß den vom Kunden genehmigten Details fortfahren.",
    "7. Customer Responsibilities": "7. Kundenverantwortlichkeiten",
    "The Customer is responsible for providing accurate and complete information required for production.": "Der Kunde ist für die Bereitstellung genauer und vollständiger Informationen verantwortlich, die für die Produktion erforderlich sind.",
    "Lensly manufactures prescription eyewear according to the information and specifications provided by the Customer.": "Lensly fertigt Korrektionsbrillen gemäß den vom Kunden bereitgestellten Informationen und Spezifikationen an.",
    "Delays caused by missing, incomplete, or incorrect customer information may delay production.": "Verzögerungen, die durch fehlende, unvollständige oder falsche Kundeninformationen verursacht werden, können die Produktion verzögern.",
    "8. Replacement Coverage": "8. Ersatzleistungen",
    "Lensly provides up to three (3) approved replacement services per contract year.": "Lensly bietet bis zu drei (3) genehmigte Ersatzleistungen pro Vertragsjahr an.",
    "Replacement coverage applies only in the following situations:": "Die Ersatzleistung gilt nur in folgenden Situationen:",
    "Accidental breakage of the glasses.": "Unfallbedingter Bruch der Brille.",
    "Lens damage or scratches that materially affect clear vision.": "Glasschäden oder Kratzer, die das klare Sehen wesentlich beeinträchtigen.",
    "Verified prescription changes.": "Verifizierte Rezeptänderungen.",
    "The Customer must provide appropriate proof for replacement requests.": "Der Kunde muss geeignete Nachweise für Ersatzanfragen bereitstellen.",
    "Replacement coverage does not include: Loss or theft, intentional damage, misuse or improper handling, cosmetic damage that does not affect vision, or changes based only on personal preference.": "Die Ersatzleistung umfasst nicht: Verlust oder Diebstahl, absichtliche Beschädigung, Missbrauch oder unsachgemäße Handhabung, kosmetische Schäden, die das Sehen nicht beeinträchtigen, oder Änderungen, die nur auf persönlichen Vorlieben basieren.",
    "Lensly reserves the right to review and verify replacement requests.": "Lensly behält sich das Recht vor, Ersatzanfragen zu überprüfen und zu verifizieren.",
    "9. Frame and Lens Adjustments": "9. Gestell- und Glasanpassungen",
    "If the Customer provides a valid reason, including incorrect prescription compared with the submitted prescription, incorrect lens specifications, or confirmed fitting or frame-related production issues, Lensly will replace the affected lenses free of charge after verification.": "Wenn der Kunde einen gültigen Grund angibt, einschließlich falscher Rezeptur im Vergleich zur eingereichten Rezeptur, falscher Glasspezifikationen oder bestätigter Anpassungs- oder gestellbezogener Produktionsprobleme, wird Lensly die betroffenen Gläser nach Überprüfung kostenlos ersetzen.",
    "Issues caused by incorrect customer-provided information or incorrect customer selection may not qualify for free replacement.": "Probleme, die durch falsche vom Kunden bereitgestellte Informationen oder falsche Kundenauswahl verursacht werden, qualifizieren möglicherweise nicht für einen kostenlosen Ersatz.",
    "10. Delivery and Production Time": "10. Lieferung und Produktionszeit",
    "Lensly will make reasonable efforts to process and deliver custom-made eyewear within approximately 14 to 21 days after receiving all required customer information, including valid prescription details, fitting information, and final frame approval.": "Lensly wird angemessene Anstrengungen unternehmen, um maßgefertigte Brillen innerhalb von etwa 14 bis 21 Tagen nach Erhalt aller erforderlichen Kundeninformationen zu verarbeiten und zu liefern, einschließlich gültiger Rezeptangaben, Anpassungsinformationen und endgültiger Gestellgenehmigung.",
    "Because prescription eyewear is individually manufactured, delivery times may vary depending on production requirements, supplier availability, laboratory processing times, and shipping conditions.": "Da Korrektionsbrillen individuell hergestellt werden, können die Lieferzeiten je nach Produktionsanforderungen, Lieferantenverfügbarkeit, Laborverarbeitungszeiten und Versandbedingungen variieren.",
    "Lensly will keep the Customer informed in case of significant delays.": "Lensly wird den Kunden bei erheblichen Verzögerungen informieren.",
    "11. Laboratory and Supplier Processing": "11. Labor- und Lieferantenverarbeitung",
    "Lensly works with selected optical suppliers and laboratories for the production and adjustment of prescription eyewear.": "Lensly arbeitet mit ausgewählten optischen Lieferanten und Laboren für die Produktion und Anpassung von Korrektionsbrillen zusammen.",
    "Production and delivery may depend on third-party availability and processing times.": "Produktion und Lieferung können von der Verfügbarkeit und den Verarbeitungszeiten Dritter abhängen.",
    "Lensly will make reasonable efforts to source the selected frame requested by the Customer through available supplier and retail channels to complete the eyewear order according to the Customer's selection.": "Lensly wird angemessene Anstrengungen unternehmen, um das vom Kunden angeforderte ausgewählte Gestell über verfügbare Lieferanten- und Einzelhandelskanäle zu beschaffen, um die Brillenbestellung gemäß der Auswahl des Kunden abzuschließen.",
    "12. Ownership of Eyewear": "12. Eigentum an der Brille",
    "After successful delivery of the completed eyewear, ownership of the frame and lenses transfers to the Customer.": "Nach erfolgreicher Lieferung der fertiggestellten Brille geht das Eigentum am Gestell und an den Gläsern auf den Kunden über.",
    "13. Early Cancellation": "13. Vorzeitige Kündigung",
    "Early cancellation during this period is generally not available.": "Eine vorzeitige Kündigung während dieser Zeit ist grundsätzlich nicht möglich.",
    "However, Lensly may review exceptional circumstances and consider early cancellation requests on a case-by-case basis.": "Lensly kann jedoch außergewöhnliche Umstände prüfen und Anträge auf vorzeitige Kündigung von Fall zu Fall in Betracht ziehen.",
    "14. Payment Suspension": "14. Zahlungsaussetzung",
    "If subscription payments remain unpaid, Lensly may temporarily suspend benefits that require active payment, including future production and replacement services, until outstanding payments are resolved.": "Wenn Abonnementzahlungen unbezahlt bleiben, kann Lensly Leistungen, die eine aktive Zahlung erfordern, einschließlich zukünftiger Produktions- und Ersatzleistungen, vorübergehend aussetzen, bis ausstehende Zahlungen beglichen sind.",
    "15. Prescription Eyewear Information": "15. Informationen zu Korrektionsbrillen",
    "Lensly provides custom-made prescription eyewear through selected optical suppliers and laboratories.": "Lensly bietet maßgefertigte Korrektionsbrillen über ausgewählte optische Lieferanten und Labore an.",
    "The eyewear is produced according to applicable requirements for prescription optical products.": "Die Brille wird gemäß den geltenden Anforderungen für optische Korrekturprodukte hergestellt.",
    "16. Custom-Made Products and Withdrawal Rights": "16. Maßgefertigte Produkte und Widerrufsrechte",
    "Prescription glasses manufactured according to individual customer specifications may qualify as custom-made goods under applicable German consumer law.": "Nach individuellen Kundenspezifikationen hergestellte Korrektionsbrillen können nach geltendem deutschen Verbraucherrecht als maßgefertigte Waren gelten.",
    "The Customer acknowledges that individual custom-made lens processing may affect withdrawal rights according to applicable legal provisions.": "Der Kunde erkennt an, dass die individuelle maßgefertigte Glasverarbeitung die Widerrufsrechte gemäß den geltenden gesetzlichen Bestimmungen beeinflussen kann.",
    "17. Customer Information and Privacy": "17. Kundeninformationen und Datenschutz",
    "Customer information is processed according to applicable data protection laws, including GDPR requirements.": "Kundeninformationen werden gemäß den geltenden Datenschutzgesetzen, einschließlich der DSGVO-Anforderungen, verarbeitet.",
    "Personal information is used for subscription management, eyewear production, delivery, customer support, and legal obligations.": "Persönliche Informationen werden für Abonnementverwaltung, Brillenproduktion, Lieferung, Kundensupport und rechtliche Verpflichtungen verwendet.",
    "18. Customer Support and Communication": "18. Kundensupport und Kommunikation",
    "Requests regarding replacements, delivery, subscription changes, and cancellations should be submitted through official Lensly communication channels.": "Anfragen bezüglich Ersatz, Lieferung, Abonnementänderungen und Kündigungen sollten über offizielle Lensly-Kommunikationskanäle eingereicht werden.",
    "Customer Acceptance": "Kundenannahme",
    "By completing payment and accepting this agreement, the Customer confirms that they have read and accepted the Lensly Care Vision Subscription Agreement.": "Durch Abschluss der Zahlung und Annahme dieser Vereinbarung bestätigt der Kunde, dass er die Lensly Care Sehversorgung Abonnementvereinbarung gelesen und akzeptiert hat.",
    "Contract Reference: LNS-2026-XXXXX": "Vertragsreferenz: LNS-2026-XXXXX",
    "Customer acceptance is recorded electronically during checkout.": "Die Kundenannahme wird während des Checkouts elektronisch aufgezeichnet.",
    "Contract Information (German Compliance)": "Vertragsinformationen (Deutsches Recht)",
