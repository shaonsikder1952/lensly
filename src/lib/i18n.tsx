import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "en" | "de" | "fr" | "es" | "it";

interface LanguageContextProps {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Nav
    "nav.start": "Start for €29/mo",
    // Hero
    "hero.badge": "One plan · €29 / month",
    "hero.titlePart1": "New glasses every ",
    "hero.titlePart2": "year.",
    "hero.subtitle": "A single, honest plan. Up-to-date prescription lenses delivered every year. Broken, power change? We got you covered with three free replacements.",
    "hero.cta": "See the plan",
    // Trust
    "trust.lenses": "Premium Optical Lenses",
    "trust.shipping": "Free EU-Wide Shipping",
    "trust.checkout": "Secure Stripe Checkout",
    // Plan Section
    "plan.traditional": "Traditional optician",
    "plan.upfront": "Upfront · 1 pair · no free replacements",
    "plan.wait": "Wait 2–3 years to save up money and buy again",
    "plan.accidental": "Accidental replacements cost full retail price",
    "plan.coatings": "Coatings & high-index lenses billed as extras",
    "plan.outdated": "Outdated prescription within 12 months",
    "plan.lenslyCare": "Lensly Care",
    "plan.dailyCoffee": "less than a daily coffee",
    "plan.feature1": "1 new pair of precision lenses every year",
    "plan.feature2": "3 free replacements (broken, power change? We got you covered)",
    "plan.feature3": "Premium lenses, anti-reflective & UV-400 coatings included",
    "plan.feature4": "Free shipping EU-wide · cancel anytime",
    "plan.whatsNext": "What's next?",
    "plan.whatsNextDesc": "To start your plan, subscribe to Lensly Care. Once payment is complete, our team will contact you to select your frames and collect your prescription or doctor's report.",
    "plan.subscribeBtn": "Subscribe to Lensly Care",
    "plan.secureStripe": "Secure checkout via Stripe",
    // Math Row
    "math.optician": "Traditional optician (4 pairs)",
    "math.lensly": "Lensly subscription (€348/yr)",
    "math.saved": "Saved per year with replacements",
    // Insurance Comparison
    "compare.title": "Lensly vs. Glasses Insurance",
    "compare.desc": "Supplemental insurance plans look cheap upfront but often leave you with heavy out-of-pocket costs.",
    "compare.insurance": "Glasses Insurance",
    "compare.insuranceSub": "Standard supplemental policy",
    "compare.lenslySub": "Complete continuous vision plan",
    "compare.item1_yes": "Covers 1 pair every 2 years",
    "compare.item2_no": "Replacements not covered",
    "compare.item3_no": "Additional co-pays for premium lenses",
    "compare.lensly_item1": "1 complete pair delivered to you",
    "compare.lensly_item2": "3 free replacements (broken, power change)",
    "compare.lensly_item3": "Nothing extra to pay ever",
    // Footer
    "footer.support": "For any help or requests regarding subscription please contact at",
  },
  de: {
    // Nav
    "nav.start": "Starten für 29 €/Monat",
    // Hero
    "hero.badge": "Ein Tarif · 29 € / Monat",
    "hero.titlePart1": "Jedes Jahr neue ",
    "hero.titlePart2": "Brille.",
    "hero.subtitle": "Ein einziger, ehrlicher Tarif. Jährlich neue Korrekturgläser geliefert. Beschädigt, Sehstärkenänderung? Wir sichern Sie mit drei kostenlosen Ersatzgläsern ab.",
    "hero.cta": "Tarif ansehen",
    // Trust
    "trust.lenses": "Premium Brillengläser",
    "trust.shipping": "Kostenloser EU-Versand",
    "trust.checkout": "Sicherer Stripe-Checkout",
    // Plan Section
    "plan.traditional": "Herkömmlicher Optiker",
    "plan.upfront": "Einmalig · 1 Brille · kein kostenloser Ersatz",
    "plan.wait": "2–3 Jahre warten, um Geld zu sparen und neu zu kaufen",
    "plan.accidental": "Unfall-Ersatz kostet den vollen Ladenpreis",
    "plan.coatings": "Beschichtungen & dünne Gläser kosten extra",
    "plan.outdated": "Veraltete Sehstärke innerhalb von 12 Monaten",
    "plan.lenslyCare": "Lensly Care",
    "plan.dailyCoffee": "weniger als ein täglicher Kaffee",
    "plan.feature1": "1 neues Paar Präzisionsgläser jedes Jahr",
    "plan.feature2": "3 kostenlose Ersatzgläser (beschädigt, Sehstärke geändert? Wir helfen)",
    "plan.feature3": "Premium-Gläser, Entspiegelung & UV-400 inklusive",
    "plan.feature4": "Kostenloser EU-Versand · jederzeit kündbar",
    "plan.whatsNext": "Wie geht es weiter?",
    "plan.whatsNextDesc": "Um Ihren Tarif zu starten, abonnieren Sie Lensly Care. Nach der Zahlung meldet sich unser Team bei Ihnen, um Gestelle auszuwählen und Ihr Rezept einzuholen.",
    "plan.subscribeBtn": "Lensly Care abonnieren",
    "plan.secureStripe": "Sicherer Checkout über Stripe",
    // Math Row
    "math.optician": "Herkömmlicher Optiker (4 Brillen)",
    "math.lensly": "Lensly-Abo (348 €/Jahr)",
    "math.saved": "Jährliche Ersparnis mit Ersatz",
    // Insurance Comparison
    "compare.title": "Lensly vs. Brillenversicherung",
    "compare.desc": "Zusatzversicherungen wirken anfangs günstig, haben aber oft hohe Zuzahlungen.",
    "compare.insurance": "Brillenversicherung",
    "compare.insuranceSub": "Standard-Zusatzpolice",
    "compare.lenslySub": "Komplettes Sehversorgungs-Abo",
    "compare.item1_yes": "Deckt 1 Brille alle 2 Jahre ab",
    "compare.item2_no": "Kein Ersatz bei Beschädigung",
    "compare.item3_no": "Zusatzkosten für Premium-Gläser",
    "compare.lensly_item1": "1 komplette Brille jährlich geliefert",
    "compare.lensly_item2": "3 kostenlose Ersatzgläser (beschädigt, Sehstärke)",
    "compare.lensly_item3": "Keine versteckten Zuzahlungen",
    // Footer
    "footer.support": "Bei Fragen oder Wünschen zu Ihrem Abonnement kontaktieren Sie uns bitte unter",
  },
  fr: {
    "nav.start": "S'abonner pour 29 €/mois",
    "hero.badge": "Un plan · 29 € / mois",
    "hero.titlePart1": "De nouvelles lunettes chaque ",
    "hero.titlePart2": "an.",
    "hero.subtitle": "Un tarif unique et transparent. Des verres correcteurs mis à jour livrés chaque année. Cassés, changement de correction ? Vous bénéficiez de trois remplacements gratuits.",
    "hero.cta": "Voir le plan",
    "trust.lenses": "Verres optiques premium",
    "trust.shipping": "Livraison gratuite en UE",
    "trust.checkout": "Paiement Stripe sécurisé",
    "plan.traditional": "Opticien traditionnel",
    "plan.upfront": "Achat initial · 1 paire · pas de remplacement gratuit",
    "plan.wait": "Attendre 2 à 3 ans pour économiser et racheter",
    "plan.accidental": "Remplacement accidentel au prix fort",
    "plan.coatings": "Traitements et verres amincis facturés en supplément",
    "plan.outdated": "Correction obsolète en moins de 12 mois",
    "plan.lenslyCare": "Lensly Care",
    "plan.dailyCoffee": "moins cher qu'un café par jour",
    "plan.feature1": "1 nouvelle paire de verres de précision par an",
    "plan.feature2": "3 remplacements gratuits (cassés, changement de correction)",
    "plan.feature3": "Verres premium, antireflet & protection UV-400 inclus",
    "plan.feature4": "Livraison gratuite en Europe · sans engagement",
    "plan.whatsNext": "Quelle est l'étape suivante ?",
    "plan.whatsNextDesc": "Pour commencer votre forfait, abonnez-vous à Lensly Care. Une fois le paiement validé, notre équipe vous contactera pour choisir votre monture et recueillir votre ordonnance.",
    "plan.subscribeBtn": "S'abonner à Lensly Care",
    "plan.secureStripe": "Paiement sécurisé via Stripe",
    "math.optician": "Opticien traditionnel (4 paires)",
    "math.lensly": "Abonnement Lensly (348 €/an)",
    "math.saved": "Économie par an avec remplacements",
    "compare.title": "Lensly vs. Assurance Lunettes",
    "compare.desc": "Les assurances complémentaires semblent bon marché au départ mais cachent souvent des frais importants.",
    "compare.insurance": "Assurance Lunettes",
    "compare.insuranceSub": "Complémentaire santé standard",
    "compare.lenslySub": "Forfait complet de santé visuelle",
    "compare.item1_yes": "Couvre 1 paire tous les 2 ans",
    "compare.item2_no": "Remplacements non couverts",
    "compare.item3_no": "Franchises pour les verres premium",
    "compare.lensly_item1": "1 paire complète livrée chez vous",
    "compare.lensly_item2": "3 remplacements gratuits (correction, casse)",
    "compare.lensly_item3": "Aucun frais supplémentaire à payer",
    "footer.support": "Pour toute question ou demande concernant votre abonnement, contactez-nous à",
  },
  es: {
    "nav.start": "Iniciar por 29 €/mes",
    "hero.badge": "Un plan · 29 € / mes",
    "hero.titlePart1": "Gafas nuevas cada ",
    "hero.titlePart2": "año.",
    "hero.subtitle": "Un plan único y honesto. Lentes graduadas actualizadas cada año. ¿Rotura o cambio de graduación? Te cubrimos con tres reemplazos gratuitos.",
    "hero.cta": "Ver el plan",
    "trust.lenses": "Lentes ópticas premium",
    "trust.shipping": "Envío gratis a toda la UE",
    "trust.checkout": "Pago Stripe seguro",
    "plan.traditional": "Óptica tradicional",
    "plan.upfront": "Pago único · 1 par · sin reemplazos gratuitos",
    "plan.wait": "Esperar 2-3 años para ahorrar y comprar de nuevo",
    "plan.accidental": "Reemplazo por accidente a precio normal",
    "plan.coatings": "Tratamientos y lentes reducidas como extras",
    "plan.outdated": "Graduación desactualizada en 12 meses",
    "plan.lenslyCare": "Lensly Care",
    "plan.dailyCoffee": "menos que un café al día",
    "plan.feature1": "1 nuevo par de lentes de precisión cada año",
    "plan.feature2": "3 reemplazos gratis (rotura, cambio de graduación)",
    "plan.feature3": "Lentes premium con tratamientos antirreflejantes y UV-400 incluidos",
    "plan.feature4": "Envío gratuito en la UE · cancela cuando quieras",
    "plan.whatsNext": "¿Qué es lo siguiente?",
    "plan.whatsNextDesc": "Para comenzar tu plan, suscríbete a Lensly Care. Once completado el pago, nuestro equipo se pondrá en contacto contigo para elegir montura y recibir tu receta médica.",
    "plan.subscribeBtn": "Suscribirse a Lensly Care",
    "plan.secureStripe": "Pago seguro mediante Stripe",
    "math.optician": "Óptica tradicional (4 pares)",
    "math.lensly": "Suscripción Lensly (348 €/año)",
    "math.saved": "Ahorro anual con reemplazos",
    "compare.title": "Lensly vs. Seguro de Gafas",
    "compare.desc": "Los seguros de gafas parecen baratos al principio pero suelen dejarte con gastos adicionales.",
    "compare.insurance": "Seguro de Gafas",
    "compare.insuranceSub": "Póliza complementaria común",
    "compare.lenslySub": "Plan completo de cuidado visual",
    "compare.item1_yes": "Cubre 1 par cada 2 años",
    "compare.item2_no": "Reemplazos no cubiertos",
    "compare.item3_no": "Copagos para lentes de gama alta",
    "compare.lensly_item1": "1 par completo entregado a domicilio",
    "compare.lensly_item2": "3 reemplazos gratis (rotura, graduación)",
    "compare.lensly_item3": "Sin costes ocultos nunca",
    "footer.support": "Para cualquier consulta o solicitud sobre su suscripción, contáctenos en",
  },
  it: {
    "nav.start": "Inizia con 29 €/mese",
    "hero.badge": "Un piano · 29 € / mese",
    "hero.titlePart1": "Occhiali nuovi ogni ",
    "hero.titlePart2": "anno.",
    "hero.subtitle": "Un unico piano, trasparente. Lenti graduate aggiornate consegnate ogni anno. Rottura o cambio di gradazione? Ti copriamo con tre sostituzioni gratuite.",
    "hero.cta": "Scopri il piano",
    "trust.lenses": "Lenti ottiche premium",
    "trust.shipping": "Spedizione gratuita in UE",
    "trust.checkout": "Pagamento Stripe sicuro",
    "plan.traditional": "Ottico tradizionale",
    "plan.upfront": "Pagamento iniziale · 1 paio · nessuna sostituzione gratuita",
    "plan.wait": "Attendi 2-3 anni per risparmiare e riacquistare",
    "plan.accidental": "Sostituzioni accidentali al prezzo di listino",
    "plan.coatings": "Trattamenti e lenti sottili fatturati come extra",
    "plan.outdated": "Graduazione obsoleta entro 12 mesi",
    "plan.lenslyCare": "Lensly Care",
    "plan.dailyCoffee": "meno di un caffè al giorno",
    "plan.feature1": "1 nuovo paio di lenti di precisione all'anno",
    "plan.feature2": "3 sostituzioni gratuite (rottura, cambio gradazione)",
    "plan.feature3": "Lenti premium con antiriflesso e protezione UV-400 inclusi",
    "plan.feature4": "Spedizione gratuita in tutta l'UE · disdici quando vuoi",
    "plan.whatsNext": "Quali sono i passaggi successivi?",
    "plan.whatsNextDesc": "Per iniziare il tuo piano, abbonati a Lensly Care. Una volta completato il pagamento, il nostro team ti contatterà per scegliere la montatura e raccogliere la tua prescrizione.",
    "plan.subscribeBtn": "Abbonati a Lensly Care",
    "plan.secureStripe": "Pagamento sicuro con Stripe",
    "math.optician": "Ottico tradizionale (4 paia)",
    "math.lensly": "Abbonamento Lensly (348 €/anno)",
    "math.saved": "Risparmio annuale con sostituzioni",
    "compare.title": "Lensly vs. Assicurazione Occhiali",
    "compare.desc": "Le polizze integrative sembrano convenienti all'inizio, ma spesso prevedono franchigie elevate.",
    "compare.insurance": "Assicurazione Occhiali",
    "compare.insuranceSub": "Polizza integrativa standard",
    "compare.lenslySub": "Piano di cura visiva continuo",
    "compare.item1_yes": "Copre 1 paio ogni 2 anni",
    "compare.item2_no": "Sostituzioni non coperte",
    "compare.item3_no": "Costi extra per lenti premium",
    "compare.lensly_item1": "1 paio completo consegnato a domicilio",
    "compare.lensly_item2": "3 sostituzioni gratuite (rottura, gradazione)",
    "compare.lensly_item3": "Nessun costo aggiuntivo mai",
    "footer.support": "Per qualsiasi domanda o richiesta relativa all'abbonamento, contattaci a",
  },
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem("lensly_lang") as Language;
    if (saved && translations[saved]) {
      setLangState(saved);
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("lensly_lang", newLang);
  };

  const t = (key: string): string => {
    return translations[lang][key] || translations["en"][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
