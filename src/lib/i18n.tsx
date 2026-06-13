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
    "Fresh prescription glasses delivered to your door every year. Break them or need a new prescription? Three free replacements included. No optician visits, no surprise costs.": "Frische Korrekturbrillen jedes Jahr an Ihre Tür geliefert. Beschädigt oder neues Rezept nötig? Drei kostenlose Ersatzgläser inklusive. Keine Optikerbesuche, keine Überraschungskosten.",
    "See the plan": "Tarif ansehen",
    "Premium Optical Lenses": "Premium Brillengläser",
    "Free EU-Wide Shipping": "Kostenloser EU-Versand",
    "Secure Stripe Checkout": "Sicherer Stripe-Checkout",
    "Traditional optician": "Herkömmlicher Optiker",
    "Upfront · 1 pair · no free replacements": "Einmalig · 1 Brille · kein kostenloser Ersatz",
    "Wait 2–3 years to save up money and buy again": "2–3 Jahre warten, um Geld zu sparen und neu zu kaufen",
    "Accidental replacements cost full retail price": "Unfall-Ersatz kostet den vollen Ladenpreis",
    "Coatings & high-index lenses billed as extras": "Beschichtungen & dünne Gläser kosten extra",
    "Outdated prescription within 12 months": "Veraltete Sehstärke innerhalb von 12 Monaten",
    "Lensly Care": "Lensly Care",
    "less than a daily coffee": "weniger als ein täglicher Kaffee",
    "1 new pair of precision lenses every year": "1 neues Paar Präzisionsgläser jedes Jahr",
    "3 free replacements (broken, power change? We got you covered)": "3 kostenlose Ersatzgläser (beschädigt, Sehstärke geändert? Wir helfen)",
    "Premium lenses, anti-reflective & UV-400 coatings included": "Premium-Gläser, Entspiegelung & UV-400 inklusive",
    "Free shipping EU-wide · cancel anytime": "Kostenloser EU-Versand · jederzeit kündbar",
    "What's next?": "Wie geht es weiter?",
    "To start your plan, subscribe to Lensly Care. Once payment is complete, our team will contact you to select your frames and collect your prescription or doctor's report.": "Um Ihren Tarif zu starten, abonnieren Sie Lensly Care. Nach der Zahlung meldet sich unser Team bei Ihnen, um Gestelle auszuwählen und Ihr Rezept einzuholen.",
    "Subscribe to Lensly Care": "Lensly Care abonnieren",
    "Secure checkout via Stripe": "Sicherer Checkout über Stripe",
    "Traditional optician (4 pairs)": "Herkömmlicher Optiker (4 Brillen)",
    "Lensly subscription (€348/yr)": "Lensly-Abo (348 €/Jahr)",
    "Saved per year with replacements": "Jährliche Ersparnis mit Ersatz",
    "Lensly vs. Glasses Insurance": "Lensly vs. Brillenversicherung",
    "Supplemental insurance plans look cheap upfront but often leave you with heavy out-of-pocket costs.": "Zusatzversicherungen wirken anfangs günstig, haben aber oft hohe Zuzahlungen.",
    "Glasses Insurance": "Brillenversicherung",
    "Standard supplemental policy": "Standard-Zusatzpolice",
    "Complete continuous vision plan": "Komplettes Sehversorgungs-Abo",
    "Covers 1 pair every 2 years": "Deckt 1 Brille alle 2 Jahre ab",
    "Replacements not covered": "Kein Ersatz bei Beschädigung",
    "Additional co-pays for premium lenses": "Zusatzkosten für Premium-Gläser",
    "1 complete pair delivered to you": "1 komplette Brille jährlich geliefert",
    "3 free replacements (broken, power change)": "3 kostenlose Ersatzgläser (beschädigt, Sehstärke)",
    "Nothing extra to pay ever": "Keine versteckten Zuzahlungen",
    "For any help or requests regarding subscription please contact at": "Bei Fragen oder Wünschen zu Ihrem Abonnement kontaktieren Sie uns bitte unter",
  },
  fr: {
    "Start for €29/mo": "S'abonner pour 29 €/mois",
    "One plan · €29 / month": "Un plan · 29 € / mois",
    "New glasses every ": "De nouvelles lunettes chaque ",
    "year.": "an.",
    "Fresh prescription glasses delivered to your door every year. Break them or need a new prescription? Three free replacements included. No optician visits, no surprise costs.": "Des lunettes correctrices neuves livrées à votre porte chaque année. Cassées ou besoin d'une nouvelle ordonnance ? Trois remplacements gratuits inclus. Pas de visite chez l'opticien, pas de frais surprises.",
    "See the plan": "Voir le plan",
    "Premium Optical Lenses": "Verres optiques premium",
    "Free EU-Wide Shipping": "Livraison gratuite en UE",
    "Secure Stripe Checkout": "Paiement Stripe sécurisé",
    "Traditional optician": "Opticien traditionnel",
    "Upfront · 1 pair · no free replacements": "Achat initial · 1 paire · pas de remplacement gratuit",
    "Wait 2–3 years to save up money and buy again": "Attendre 2 à 3 ans pour économiser et racheter",
    "Accidental replacements cost full retail price": "Remplacement accidentel au prix fort",
    "Coatings & high-index lenses billed as extras": "Traitements et verres amincis facturés en supplément",
    "Outdated prescription within 12 months": "Correction obsolète en moins de 12 mois",
    "Lensly Care": "Lensly Care",
    "less than a daily coffee": "moins cher qu'un café par jour",
    "1 new pair of precision lenses every year": "1 nouvelle paire de verres de précision par an",
    "3 free replacements (broken, power change? We got you covered)": "3 remplacements gratuits (cassés, changement de correction)",
    "Premium lenses, anti-reflective & UV-400 coatings included": "Verres premium, antireflet & protection UV-400 inclus",
    "Free shipping EU-wide · cancel anytime": "Livraison gratuite en Europe · sans engagement",
    "What's next?": "Quelle est l'étape suivante ?",
    "To start your plan, subscribe to Lensly Care. Once payment is complete, our team will contact you to select your frames and collect your prescription or doctor's report.": "Pour commencer votre forfait, abonnez-vous à Lensly Care. Une fois le paiement validé, notre équipe vous contactera pour choisir votre monture et recueillir votre ordonnance.",
    "Subscribe to Lensly Care": "S'abonner à Lensly Care",
    "Secure checkout via Stripe": "Paiement sécurisé via Stripe",
    "Traditional optician (4 pairs)": "Opticien traditionnel (4 paires)",
    "Lensly subscription (€348/yr)": "Abonnement Lensly (348 €/an)",
    "Saved per year with replacements": "Économie par an avec remplacements",
    "Lensly vs. Glasses Insurance": "Lensly vs. Assurance Lunettes",
    "Supplemental insurance plans look cheap upfront but often leave you with heavy out-of-pocket costs.": "Les assurances complémentaires semblent bon marché au départ mais cachent souvent des frais importants.",
    "Glasses Insurance": "Assurance Lunettes",
    "Standard supplemental policy": "Complémentaire santé standard",
    "Complete continuous vision plan": "Forfait complet de santé visuelle",
    "Covers 1 pair every 2 years": "Couvre 1 paire tous les 2 ans",
    "Replacements not covered": "Remplacements non couverts",
    "Additional co-pays for premium lenses": "Franchises pour les verres premium",
    "1 complete pair delivered to you": "1 paire complète livrée chez vous",
    "3 free replacements (broken, power change)": "3 remplacements gratuits (correction, casse)",
    "Nothing extra to pay ever": "Aucun frais supplémentaire à payer",
    "For any help or requests regarding subscription please contact at": "Pour toute question ou demande concernant votre abonnement, contactez-nous à",
  },
  es: {
    "Start for €29/mo": "Iniciar por 29 €/mes",
    "One plan · €29 / month": "Un plan · 29 € / mes",
    "New glasses every ": "Gafas nuevas cada ",
    "year.": "año.",
    "Fresh prescription glasses delivered to your door every year. Break them or need a new prescription? Three free replacements included. No optician visits, no surprise costs.": "Gafas graduadas nuevas entregadas en tu puerta cada año. ¿Se te rompen o necesitas una nueva receta? Tres reemplazos gratuitos incluidos. Sin visitas al óptico, sin costes sorpresa.",
    "See the plan": "Ver el plan",
    "Premium Optical Lenses": "Lentes ópticas premium",
    "Free EU-Wide Shipping": "Envío gratis a toda la UE",
    "Secure Stripe Checkout": "Pago Stripe seguro",
    "Traditional optician": "Óptica tradicional",
    "Upfront · 1 pair · no free replacements": "Pago único · 1 par · sin reemplazos gratuitos",
    "Wait 2–3 years to save up money and buy again": "Esperar 2-3 años para ahorrar y comprar de nuevo",
    "Accidental replacements cost full retail price": "Reemplazo por accidente a precio normal",
    "Coatings & high-index lenses billed as extras": "Tratamientos y lentes reducidas como extras",
    "Outdated prescription within 12 months": "Graduación desactualizada en 12 meses",
    "Lensly Care": "Lensly Care",
    "less than a daily coffee": "menos que un café al día",
    "1 new pair of precision lenses every year": "1 nuevo par de lentes de precisión cada año",
    "3 free replacements (broken, power change? We got you covered)": "3 reemplazos gratis (rotura, cambio de graduación)",
    "Premium lenses, anti-reflective & UV-400 coatings included": "Lentes premium con tratamientos antirreflejantes y UV-400 incluidos",
    "Free shipping EU-wide · cancel anytime": "Envío gratuito en la UE · cancela cuando quieras",
    "What's next?": "¿Qué es lo siguiente?",
    "To start your plan, subscribe to Lensly Care. Once payment is complete, our team will contact you to select your frames and collect your prescription or doctor's report.": "Para comenzar tu plan, suscríbete a Lensly Care. Once completado el pago, nuestro equipo se pondrá en contacto contigo para elegir montura y recibir tu receta médica.",
    "Subscribe to Lensly Care": "Suscribirse a Lensly Care",
    "Secure checkout via Stripe": "Pago seguro mediante Stripe",
    "Traditional optician (4 pairs)": "Óptica tradicional (4 pares)",
    "Lensly subscription (€348/yr)": "Suscripción Lensly (348 €/año)",
    "Saved per year with replacements": "Ahorro anual con reemplazos",
    "Lensly vs. Glasses Insurance": "Lensly vs. Seguro de Gafas",
    "Supplemental insurance plans look cheap upfront but often leave you with heavy out-of-pocket costs.": "Los seguros de gafas parecen baratos al principio pero suelen dejarte con gastos adicionales.",
    "Glasses Insurance": "Seguro de Gafas",
    "Standard supplemental policy": "Póliza complementaria común",
    "Complete continuous vision plan": "Plan completo de cuidado visual",
    "Covers 1 pair every 2 years": "Cubre 1 par cada 2 años",
    "Replacements not covered": "Reemplazos no cubiertos",
    "Additional co-pays for premium lenses": "Copagos para lentes de gama alta",
    "1 complete pair delivered to you": "1 par completo entregado a domicilio",
    "3 free replacements (broken, power change)": "3 reemplazos gratis (rotura, graduación)",
    "Nothing extra to pay ever": "Sin costes ocultos nunca",
    "For any help or requests regarding subscription please contact at": "Para cualquier consulta o solicitud sobre su suscripción, contáctenos en",
  },
  it: {
    "Start for €29/mo": "Inizia con 29 €/mese",
    "One plan · €29 / month": "Un piano · 29 € / mese",
    "New glasses every ": "Occhiali nuovi ogni ",
    "year.": "anno.",
    "Fresh prescription glasses delivered to your door every year. Break them or need a new prescription? Three free replacements included. No optician visits, no surprise costs.": "Occhiali da vista nuovi consegnati a casa tua ogni anno. Si rompono o hai bisogno di una nuova ricetta? Tre sostituzioni gratuite incluse. Nessuna visita dall'ottico, nessun costo a sorpresa.",
    "See the plan": "Scopri il piano",
    "Premium Optical Lenses": "Lenti ottiche premium",
    "Free EU-Wide Shipping": "Spedizione gratuita in UE",
    "Secure Stripe Checkout": "Pagamento Stripe sicuro",
    "Traditional optician": "Ottico tradizionale",
    "Upfront · 1 pair · no free replacements": "Pagamento iniziale · 1 paio · nessuna sostituzione gratuita",
    "Wait 2–3 years to save up money and buy again": "Attendi 2-3 anni per risparmiare e riacquistare",
    "Accidental replacements cost full retail price": "Sostituzioni accidentali al prezzo di listino",
    "Coatings & high-index lenses billed as extras": "Trattamenti e lenti sottili fatturati come extra",
    "Outdated prescription within 12 months": "Graduazione obsoleta entro 12 mesi",
    "Lensly Care": "Lensly Care",
    "less than a daily coffee": "meno di un caffè al giorno",
    "1 new pair of precision lenses every year": "1 nuovo paio di lenti di precisione all'anno",
    "3 free replacements (broken, power change? We got you covered)": "3 sostituzioni gratuite (rottura, cambio gradazione)",
    "Premium lenses, anti-reflective & UV-400 coatings included": "Lenti premium con antiriflesso e protezione UV-400 inclusi",
    "Free shipping EU-wide · cancel anytime": "Spedizione gratuita in tutta l'UE · disdici quando vuoi",
    "What's next?": "Quali sono i passaggi successivi?",
    "To start your plan, subscribe to Lensly Care. Once payment is complete, our team will contact you to select your frames and collect your prescription or doctor's report.": "Per iniziare il tuo piano, abbonati a Lensly Care. Una volta completato il pagamento, il nostro team ti contatterà per scegliere la montatura e raccogliere la tua prescrizione.",
    "Subscribe to Lensly Care": "Abbonati a Lensly Care",
    "Secure checkout via Stripe": "Pagamento sicuro con Stripe",
    "Traditional optician (4 pairs)": "Ottico tradizionale (4 paia)",
    "Lensly subscription (€348/yr)": "Abbonamento Lensly (348 €/anno)",
    "Saved per year with replacements": "Risparmio annuale con sostituzioni",
    "Lensly vs. Glasses Insurance": "Lensly vs. Assicurazione Occhiali",
    "Supplemental insurance plans look cheap upfront but often leave you with heavy out-of-pocket costs.": "Le polizze integrative sembrano convenienti all'inizio, ma spesso prevedono franchigie elevate.",
    "Glasses Insurance": "Assicurazione Occhiali",
    "Standard supplemental policy": "Polizza integrativa standard",
    "Complete continuous vision plan": "Piano di cura visiva continuo",
    "Covers 1 pair every 2 years": "Copre 1 paio ogni 2 anni",
    "Replacements not covered": "Sostituzioni non coperte",
    "Additional co-pays for premium lenses": "Costi extra per lenti premium",
    "1 complete pair delivered to you": "1 paio completo consegnato a domicilio",
    "3 free replacements (broken, power change)": "3 sostituzioni gratuite (rottura, gradazione)",
    "Nothing extra to pay ever": "Nessun costo aggiuntivo mai",
    "For any help or requests regarding subscription please contact at": "Per qualsiasi domanda o richiesta relativa all'abbonamento, contattaci a",
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
  const [translationsMap, setTranslationsMap] = useState<Record<string, Record<string, string>>>(() => {
    return { ...translationCache };
  });

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
