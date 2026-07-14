import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "en" | "de" | "fr" | "es" | "it";

interface LanguageContextProps {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (text: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

const initialTranslations: Record<Language, Record<string, string>> = {
  en: {
    "LENSLY CARE VISION SUBSCRIPTION AGREEMENT": "LENSLY CARE VISION SUBSCRIPTION AGREEMENT",
    "contract.title": "LENSLY CARE VISION SUBSCRIPTION AGREEMENT",
    "contract.ref_prefix": "Contract Reference",
    "1. Contracting Parties": "1. Contracting Parties",
    "contract.parties.title": "1. Contracting Parties",
    "contract.parties.body": "This agreement is concluded between: Sikder LLC, Germany (hereinafter referred to as “Lensly” or “the Provider”) and the subscriber whose personal information, payment details, and electronic acceptance are recorded during the checkout process (hereinafter referred to as “the Customer”).",
    "contract.parties.acceptance": "By completing the checkout process and confirming payment, the Customer accepts this agreement electronically.",
    "2. Lensly Care Subscription": "2. Lensly Care Subscription",
    "contract.subscription.title": "2. Lensly Care Subscription",
    "contract.subscription.body": "Lensly Care is a vision subscription service providing customers with access to custom-made prescription eyewear benefits. The subscription includes:",
    "contract.subscription.item1": "One (1) complete custom-made prescription glasses pair per contract year.",
    "contract.subscription.item2": "Up to three (3) approved replacement services per contract year according to the replacement conditions described in this agreement.",
    "3. Lensly Delivery Commitment": "3. Lensly Delivery Commitment",
    "contract.delivery.title": "3. Lensly Delivery Commitment",
    "contract.delivery.body1": "Once the Lensly Care subscription agreement has been successfully established and the Customer has provided all required information, including valid prescription details, fitting information, and frame selection approval, Lensly is obligated to provide the included custom-made prescription eyewear benefit according to the terms of this agreement.",
    "contract.delivery.body2": "Lensly will make reasonable efforts to complete production and delivery within the stated timeframe.",
    "contract.delivery.body3": "Delays caused by missing customer information, supplier availability, laboratory processing times, shipping conditions, or circumstances outside Lensly’s reasonable control do not remove Lensly’s obligation to fulfil the agreed eyewear benefit. Lensly will continue to work toward completion and delivery of the Customer’s included eyewear benefit.",
    "4. Minimum Contract Term and Renewal": "4. Minimum Contract Term and Renewal",
    "contract.term.title": "4. Minimum Contract Term and Renewal",
    "contract.term.body1": "The Lensly Care subscription has a minimum contract term of twelve (12) months from the activation date.",
    "contract.term.body2": "The contract year begins on the date of subscription activation and continues for twelve (12) consecutive months.",
    "contract.term.body3": "After the initial twelve-month period, the subscription automatically continues on a monthly basis and may be cancelled with thirty (30) days’ notice.",
    "contract.term.commitment": "The Customer acknowledges that the minimum financial commitment during the initial contract term is €348 (€29 × 12 months).",
    "5. Subscription Fee and Payment": "5. Subscription Fee and Payment",
    "contract.fee.title": "5. Subscription Fee and Payment",
    "contract.fee.body1": "The subscription fee is €29 per month.",
    "contract.fee.body2": "Payments are collected monthly in advance through approved payment providers, including Stripe-supported payment methods.",
    "contract.fee.body3": "The Customer is responsible for maintaining valid payment information.",
    "contract.fee.failed1": "If a payment cannot be processed, Lensly will notify the Customer and provide an opportunity to update payment information or complete payment.",
    "contract.fee.failed2": "The first failed payment attempt will not result in an additional charge.",
    "contract.fee.failed3": "For repeated failed payment attempts caused by customer-related payment issues, Lensly may apply a reasonable processing fee of €5 per failed payment attempt after notifying the Customer.",
    "6. First Glasses Production Process": "6. First Glasses Production Process",
    "contract.first_glasses.title": "6. First Glasses Production Process",
    "contract.first_glasses.body1": "After activation, the Customer must provide all required information, including valid prescription details, fitting information, and selected frame information.",
    "contract.first_glasses.body2": "The Customer may select a preferred frame and provide frame details or images through approved Lensly communication channels. Lensly will confirm the selected frame before production begins.",
    "contract.first_glasses.body3": "Custom lens processing will begin only after the required information and approvals have been received.",
    "contract.first_glasses.changes": "Because the first glasses are custom-made according to the Customer’s individual prescription, measurements, and selected frame, the Customer may request changes before final confirmation of the first glasses order.",
    "contract.first_glasses.final": "Once the Customer has confirmed the first glasses order through an approved Lensly communication channel, including email or another official communication method, the custom glasses order cannot be cancelled or changed due to the individual nature of the product. Lensly will proceed with fulfilling the confirmed eyewear benefit according to the details approved by the Customer.",
    "7. Customer Responsibilities": "7. Customer Responsibilities",
    "contract.customer_responsibilities.title": "7. Customer Responsibilities",
    "contract.customer_responsibilities.body1": "The Customer is responsible for providing accurate and complete information required for production.",
    "contract.customer_responsibilities.body2": "Lensly manufactures prescription eyewear according to the information and specifications provided by the Customer.",
    "contract.customer_responsibilities.body3": "Delays caused by missing, incomplete, or incorrect customer information may delay production.",
    "8. Replacement Coverage": "8. Replacement Coverage",
    "contract.replacement.title": "8. Replacement Coverage",
    "contract.replacement.body1": "Lensly provides up to three (3) approved replacement services per contract year.",
    "contract.replacement.body2": "Replacement coverage applies only in the following situations:",
    "contract.replacement.item1": "Accidental breakage of the glasses.",
    "contract.replacement.item2": "Lens damage or scratches that materially affect clear vision.",
    "contract.replacement.item3": "Verified prescription changes.",
    "contract.replacement.proof": "The Customer must provide appropriate proof for replacement requests. Proof may include photographs of damage, updated prescription documentation, or other relevant information requested by Lensly.",
    "contract.replacement.excl_title": "Replacement coverage does not include:",
    "contract.replacement.excl1": "Loss or theft.",
    "contract.replacement.excl2": "Intentional damage.",
    "contract.replacement.excl3": "Misuse or improper handling.",
    "contract.replacement.excl4": "Cosmetic damage that does not affect vision.",
    "contract.replacement.excl5": "Changes based only on personal preference.",
    "contract.replacement.reserve": "Lensly reserves the right to review and verify replacement requests.",
    "9. Frame and Lens Adjustments": "9. Frame and Lens Adjustments",
    "contract.adjustments.title": "9. Frame and Lens Adjustments",
    "contract.adjustments.body1": "If the Customer provides a valid reason, including: Incorrect prescription compared with the submitted prescription; Incorrect lens specifications; Confirmed fitting or frame-related production issues; Lensly will replace the affected lenses free of charge after verification.",
    "contract.adjustments.body2": "Issues caused by incorrect customer-provided information or incorrect customer selection may not qualify for free replacement.",
    "10. Delivery and Production Time": "10. Delivery and Production Time",
    "contract.delivery_time.title": "10. Delivery and Production Time",
    "contract.delivery_time.body1": "Lensly will make reasonable efforts to process and deliver custom-made eyewear within approximately 14 to 21 days after receiving all required customer information, including valid prescription details, fitting information, and final frame approval.",
    "contract.delivery_time.body2": "Because prescription eyewear is individually manufactured, delivery times may vary depending on production requirements, supplier availability, laboratory processing times, and shipping conditions.",
    "contract.delivery_time.body3": "Lensly will keep the Customer informed in case of significant delays.",
    "11. Laboratory and Supplier Processing": "11. Laboratory and Supplier Processing",
    "contract.laboratory.title": "11. Laboratory and Supplier Processing",
    "contract.laboratory.body1": "Lensly works with selected optical suppliers and laboratories for the production and adjustment of prescription eyewear.",
    "contract.laboratory.body2": "Production and delivery may depend on third-party availability and processing times.",
    "contract.laboratory.body3": "Lensly will make reasonable efforts to source the selected frame requested by the Customer through available supplier and retail channels to complete the eyewear order according to the Customer’s selection.",
    "12. Ownership of Eyewear": "12. Ownership of Eyewear",
    "contract.ownership.title": "12. Ownership of Eyewear",
    "contract.ownership.body1": "After successful delivery of the completed eyewear, ownership of the frame and lenses transfers to the Customer.",
    "13. Early Cancellation": "13. Early Cancellation",
    "contract.early_cancellation.title": "13. Early Cancellation",
    "contract.early_cancellation.body1": "The Lensly Care subscription has a minimum contract term of twelve (12) months. Early cancellation during this period is generally not available.",
    "contract.early_cancellation.body2": "However, Lensly may review exceptional circumstances and consider early cancellation requests on a case-by-case basis.",
    "14. Payment Suspension": "14. Payment Suspension",
    "contract.suspension.title": "14. Payment Suspension",
    "contract.suspension.body1": "If subscription payments remain unpaid, Lensly may temporarily suspend benefits that require active payment, including future production and replacement services, until outstanding payments are resolved.",
    "15. Prescription Eyewear Information": "15. Prescription Eyewear Information",
    "contract.eyewear_info.title": "15. Prescription Eyewear Information",
    "contract.eyewear_info.body1": "Lensly provides custom-made prescription eyewear through selected optical suppliers and laboratories.",
    "contract.eyewear_info.body2": "The eyewear is produced according to applicable requirements for prescription optical products.",
    "16. Custom-Made Products and Withdrawal Rights": "16. Custom-Made Products and Withdrawal Rights",
    "contract.withdrawal.title": "16. Custom-Made Products and Withdrawal Rights",
    "contract.withdrawal.body1": "Prescription glasses manufactured according to individual customer specifications may qualify as custom-made goods under applicable German consumer law.",
    "contract.withdrawal.body2": "The Customer acknowledges that individual custom-made lens processing may affect withdrawal rights according to applicable legal provisions.",
    "17. Customer Information and Privacy": "17. Customer Information and Privacy",
    "contract.privacy.title": "17. Customer Information and Privacy",
    "contract.privacy.body1": "Customer information is processed according to applicable data protection laws, including GDPR requirements.",
    "contract.privacy.body2": "Personal information is used for subscription management, eyewear production, delivery, customer support, and legal obligations.",
    "18. Customer Support and Communication": "18. Customer Support and Communication",
    "contract.support.title": "18. Customer Support and Communication",
    "contract.support.body1": "Requests regarding replacements, delivery, subscription changes, and cancellations should be submitted through official Lensly communication channels.",
    "Customer Acceptance": "Customer Acceptance",
    "contract.acceptance.title": "Customer Acceptance",
    "contract.acceptance.body1": "By completing payment and accepting this agreement, the Customer confirms that they have read and accepted the Lensly Care Vision Subscription Agreement.",
    "contract.acceptance.body2": "Customer acceptance is recorded electronically during checkout.",
    "Contract Reference ID": "Contract Reference ID",
    "Executed Timestamp": "Executed Timestamp",
    "Subscriber": "Subscriber",
    "Email Address": "Email Address",
    "Payment Method": "Payment Method",
    "Stripe Card Payment": "Stripe Card Payment",
    "Authorized Electronic Signature": "Authorized Electronic Signature",
    "E-SIGNATURE COMPLIANT (eIDAS REGULATION)": "E-SIGNATURE COMPLIANT (eIDAS REGULATION)",
    "contract.footer": "© 2026 Sikder LLC — All Rights Reserved",
    "Minimum term 12 months, billing €29 monthly, automatic renewal.": "Minimum term 12 months, billing €29 monthly, automatic renewal.",
  },
  de: {
    "LENSLY CARE VISION SUBSCRIPTION AGREEMENT": "LENSLY CARE BRILLEN-ABONNEMENTVERTRAG",
    "contract.title": "LENSLY CARE BRILLEN-ABONNEMENTVERTRAG",
    "contract.ref_prefix": "Vertragsnummer",
    "1. Contracting Parties": "1. Vertragsparteien",
    "contract.parties.title": "1. Vertragsparteien",
    "contract.parties.body": "Dieser Vertrag wird geschlossen zwischen: Sikder LLC, Deutschland (nachfolgend bezeichnet als „Lensly“ oder „der Anbieter“) und dem Abonnenten, dessen persönliche Daten, Zahlungsinformationen und elektronische Zustimmung während des Bestellvorgangs erfasst werden (nachfolgend bezeichnet als „der Kunde“).",
    "contract.parties.acceptance": "Durch den Abschluss des Bestellvorgangs und die Bestätigung der Zahlung akzeptiert der Kunde diesen Vertrag auf elektronischem Weg.",
    "2. Lensly Care Subscription": "2. Lensly Care Abonnement",
    "contract.subscription.title": "2. Lensly Care Abonnement",
    "contract.subscription.body": "Lensly Care ist ein Brillen-Abonnementdienst, der Kunden Zugang zu Vorteilen für maßgefertigte Korrektionsbrillen bietet. Das Abonnement umfasst:",
    "contract.subscription.item1": "Eine (1) komplette maßgefertigte Korrektionsbrille pro Vertragsjahr.",
    "contract.subscription.item2": "Bis zu drei (3) genehmigte Ersatzleistungen pro Vertragsjahr gemäß den in dieser Vereinbarung beschriebenen Ersatzbedingungen.",
    "3. Lensly Delivery Commitment": "3. Lieferverpflichtung von Lensly",
    "contract.delivery.title": "3. Lieferverpflichtung von Lensly",
    "contract.delivery.body1": "Sobald der Lensly Care Abonnementvertrag erfolgreich zustande gekommen ist und der Kunde alle erforderlichen Informationen bereitgestellt hat, einschließlich gültiger Werte der Brillenverordnung, Anpassungsdaten und der Genehmigung der Fassungsauswahl, ist Lensly verpflichtet, die vereinbarte maßgefertigte Korrektionsbrille gemäß den Bedingungen dieses Vertrages bereitzustellen.",
    "contract.delivery.body2": "Lensly wird angemessene Anstrengungen unternehmen, um die Produktion und Lieferung innerhalb des angegebenen Zeitrahmens abzuschließen.",
    "contract.delivery.body3": "Verzögerungen, die durch fehlende Kundeninformationen, Lieferantenverfügbarkeit, Laborbearbeitungszeiten, Versandbedingungen oder Umstände außerhalb der angemessenen Kontrolle von Lensly verursacht werden, entbinden Lensly nicht von der Verpflichtung zur Erfüllung der vereinbarten Brillenleistung. Lensly wird weiterhin an der Fertigstellung und Lieferung der im Abonnement enthaltenen Brille des Kunden arbeiten.",
    "4. Minimum Contract Term and Renewal": "4. Mindestvertragslaufzeit und Verlängerung",
    "contract.term.title": "4. Mindestvertragslaufzeit und Verlängerung",
    "contract.term.body1": "Das Lensly Care Abonnement hat eine Mindestvertragslaufzeit von zwölf (12) Monaten ab dem Aktivierungsdatum.",
    "contract.term.body2": "Das Vertragsjahr beginnt mit dem Datum der Abonnementaktivierung und läuft über zwölf (12) aufeinanderfolgende Monate.",
    "contract.term.body3": "Nach Ablauf des ersten Zwölfmonatszeitraums verlängert sich das Abonnement automatisch auf monatlicher Basis und kann mit einer Frist von dreißig (30) Tagen gekündigt werden.",
    "contract.term.commitment": "Der Kunde nimmt zur Kenntnis, dass die finanzielle Mindestverpflichtung während der Mindestvertragslaufzeit 348 € beträgt (29 € × 12 Monate).",
    "5. Subscription Fee and Payment": "5. Abonnementgebühr und Zahlung",
    "contract.fee.title": "5. Abonnementgebühr und Zahlung",
    "contract.fee.body1": "Die Abonnementgebühr beträgt 29 € pro Monat.",
    "contract.fee.body2": "Die Zahlungen werden monatlich im Voraus über zugelassene Zahlungsdienstleister eingezogen, einschließlich der von Stripe unterstützten Zahlungsmethoden.",
    "contract.fee.body3": "Der Kunde ist dafür verantwortlich, gültige Zahlungsinformationen zu hinterlegen.",
    "contract.fee.failed1": "Wenn eine Zahlung nicht verarbeitet werden kann, wird Lensly den Kunden benachrichtigen und die Möglichkeit geben, die Zahlungsinformationen zu aktualisieren oder die Zahlung abzuschließen.",
    "contract.fee.failed2": "Der erste fehlgeschlagene Zahlungsversuch führt nicht zu einer zusätzlichen Gebühr.",
    "contract.fee.failed3": "Bei wiederholt fehlgeschlagenen Zahlungsversuchen, die durch vom Kunden zu vertretende Zahlungsprobleme verursacht werden, kann Lensly nach vorheriger Benachrichtigung des Kunden eine angemessene Bearbeitungsgebühr von 5 € pro fehlgeschlagenem Zahlungsversuch erheben.",
    "6. First Glasses Production Process": "6. Produktionsprozess der ersten Brille",
    "contract.first_glasses.title": "6. Produktionsprozess der ersten Brille",
    "contract.first_glasses.body1": "Nach der Aktivierung muss der Kunde alle erforderlichen Informationen bereitstellen, einschließlich gültiger Werte der Brillenverordnung, Anpassungsdaten und Informationen zur ausgewählten Fassung.",
    "contract.first_glasses.body2": "Der Kunde kann eine bevorzugte Fassung auswählen und Fassungsdetails oder Bilder über die zugelassenen Kommunikationskanäle von Lensly bereitstellen. Lensly wird die ausgewählte Fassung vor Produktionsbeginn bestätigen.",
    "contract.first_glasses.body3": "Die Bearbeitung der individuellen Brillengläser beginnt erst, nachdem die erforderlichen Informationen und Freigaben eingegangen sind.",
    "contract.first_glasses.changes": "Da die erste Brille individuell nach den Rezeptwerten, Maßen und der ausgewählten Fassung des Kunden angefertigt wird, kann der Kunde vor der endgültigen Bestätigung der ersten Brillenbestellung Änderungen beantragen.",
    "contract.first_glasses.final": "Sobald der Kunde die erste Brillenbestellung über einen zugelassenen Kommunikationskanal von Lensly, einschließlich E-Mail oder einer anderen offiziellen Kommunikationsmethode, bestätigt hat, kann die Bestellung der maßgefertigten Brille aufgrund der individuellen Natur des Produkts nicht mehr storniert oder geändert werden. Lensly wird mit der Erfüllung der bestätigten Brillenleistung gemäß den vom Kunden genehmigten Details fortfahren.",
    "7. Customer Responsibilities": "7. Verantwortlichkeiten des Kunden",
    "contract.customer_responsibilities.title": "7. Verantwortlichkeiten des Kunden",
    "contract.customer_responsibilities.body1": "Der Kunde ist für die Bereitstellung korrekter und vollständiger Informationen verantwortlich, die für die Produktion erforderlich sind.",
    "contract.customer_responsibilities.body2": "Lensly fertigt die Korrektionsbrille gemäß den vom Kunden bereitgestellten Informationen und Spezifikationen an.",
    "contract.customer_responsibilities.body3": "Verzögerungen, die durch fehlende, unvollständige oder fehlerhafte Kundeninformationen verursacht werden, können die Produktion verzögern.",
    "8. Replacement Coverage": "8. Ersatzleistungen",
    "contract.replacement.title": "8. Ersatzleistungen",
    "contract.replacement.body1": "Lensly bietet bis zu drei (3) genehmigte Ersatzleistungen pro Vertragsjahr an.",
    "contract.replacement.body2": "Der Anspruch auf Ersatzleistungen besteht nur in den folgenden Situationen:",
    "contract.replacement.item1": "Unbeabsichtigter Bruch der Brille.",
    "contract.replacement.item2": "Beschädigung der Gläser oder Kratzer, die das klare Sehen erheblich beeinträchtigen.",
    "contract.replacement.item3": "Nachgewiesene Änderungen der Rezeptwerte.",
    "contract.replacement.proof": "Der Kunde muss für Ersatzanträge einen geeigneten Nachweis erbringen. Der Nachweis kann Fotos der Beschädigung, aktualisierte Brillenverordnungen oder andere von Lensly angeforderte relevante Informationen umfassen.",
    "contract.replacement.excl_title": "Die Ersatzleistungen umfassen nicht:",
    "contract.replacement.excl1": "Verlust oder Diebstahl.",
    "contract.replacement.excl2": "Vorsätzliche Beschädigung.",
    "contract.replacement.excl3": "Missbrauch oder unsachgemäße Handhabung.",
    "contract.replacement.excl4": "Kosmetische Schäden, die das Sehvermögen nicht beeinträchtigen.",
    "contract.replacement.excl5": "Änderungen, die nur auf persönlichen Vorlieben beruhen.",
    "contract.replacement.reserve": "Lensly behält sich das Recht vor, Ersatzanträge zu prüfen und zu verifizieren.",
    "9. Frame and Lens Adjustments": "9. Fassungs- und Glasanpassungen",
    "contract.adjustments.title": "9. Fassungs- und Glasanpassungen",
    "contract.adjustments.body1": "Wenn der Kunde einen triftigen Grund angibt, einschließlich: Abweichung der Brillenwerte im Vergleich zur eingereichten Brillenverordnung; Falsche Glasspezifikationen; Bestätigte Anpassungs- oder fassungsbezogene Produktionsfehler; wird Lensly die betroffenen Gläser nach Überprüfung kostenlos ersetzen.",
    "contract.adjustments.body2": "Probleme, die durch fehlerhafte Angaben des Kunden oder eine falsche Auswahl des Kunden verursacht werden, berechtigen nicht zu einem kostenlosen Ersatz.",
    "10. Delivery and Production Time": "10. Liefer- und Produktionszeit",
    "contract.delivery_time.title": "10. Liefer- und Produktionszeit",
    "contract.delivery_time.body1": "Lensly wird sich in angemessener Weise bemühen, maßgefertigte Korrektionsbrillen innerhalb von ca. 14 bis 21 Tagen nach Erhalt aller erforderlichen Kundeninformationen, einschließlich gültiger Werte der Brillenverordnung, Anpassungsdaten und der endgültigen Freigabe der Fassung, zu produzieren und zu liefern.",
    "contract.delivery_time.body2": "Da Korrektionsbrillen individuell gefertigt werden, können die Lieferzeiten je nach Produktionsanforderungen, Lieferantenverfügbarkeit, Laborbearbeitungszeiten und Versandbedingungen variieren.",
    "contract.delivery_time.body3": "Lensly wird den Kunden im Falle erheblicher Verzögerungen auf dem Laufenden halten.",
    "11. Laboratory and Supplier Processing": "11. Zusammenarbeit mit Laboren und Lieferanten",
    "contract.laboratory.title": "11. Zusammenarbeit mit Laboren und Lieferanten",
    "contract.laboratory.body1": "Lensly arbeitet mit ausgewählten optischen Lieferanten und Labors für die Produktion und Anpassung von Korrektionsbrillen zusammen.",
    "contract.laboratory.body2": "Produktion und Lieferung können von der Verfügbarkeit und den Bearbeitungszeiten von Drittanbietern abhängen.",
    "contract.laboratory.body3": "Lensly wird sich in angemessener Weise bemühen, die vom Kunden gewünschte Fassung über verfügbare Lieferanten- und Einzelhandelskanäle zu beschaffen, um die Brillenbestellung gemäß der Auswahl des Kunden abzuschließen.",
    "12. Ownership of Eyewear": "12. Eigentum an der Brille",
    "contract.ownership.title": "12. Eigentum an der Brille",
    "contract.ownership.body1": "Nach erfolgreicher Lieferung der fertiggestellten Brille geht das Eigentum an Fassung und Gläsern auf den Kunden über.",
    "13. Early Cancellation": "13. Vorzeitige Kündigung",
    "contract.early_cancellation.title": "13. Vorzeitige Kündigung",
    "contract.early_cancellation.body1": "Das Lensly Care Abonnement hat eine Mindestvertragslaufzeit von zwölf (12) Monaten. Eine vorzeitige Kündigung während dieses Zeitraums ist in der Regel nicht möglich.",
    "contract.early_cancellation.body2": "Lensly kann jedoch außergewöhnliche Umstände prüfen und Anträge auf vorzeitige Kündigung im Einzelfall prüfen.",
    "14. Payment Suspension": "14. Zahlungsaussetzung",
    "contract.suspension.title": "14. Zahlungsaussetzung",
    "contract.suspension.body1": "Wenn Abonnementzahlungen nicht geleistet werden, kann Lensly Leistungen, die eine active Zahlung erfordern, einschließlich der zukünftigen Produktion und Ersatzleistungen, vorübergehend aussetzen, bis die ausstehenden Zahlungen beglichen sind.",
    "15. Prescription Eyewear Information": "15. Informationen zu Korrektionsbrillen",
    "contract.eyewear_info.title": "15. Informationen zu Korrektionsbrillen",
    "contract.eyewear_info.body1": "Lensly stellt maßgefertigte Korrektionsbrillen über ausgewählte optische Lieferanten und Labors bereit.",
    "contract.eyewear_info.body2": "Die Herstellung der Brille erfolgt gemäß den geltenden Anforderungen für optische Korrektionsprodukte.",
    "16. Custom-Made Products and Withdrawal Rights": "16. Maßgeschneiderte Produkte und Widerrufsrecht",
    "contract.withdrawal.title": "16. Maßgeschneiderte Produkte und Widerrufsrecht",
    "contract.withdrawal.body1": "Korrektionsbrillen, die nach individuellen Wünschen oder Maßen des Kunden hergestellt werden, können nach geltendem deutschen Verbraucherrecht als nach Kundenspezifikation angefertigte Waren gelten.",
    "contract.withdrawal.body2": "Der Kunde nimmt zur Kenntnis, dass die individuelle Bearbeitung maßgefertigter Brillengläser das Widerrufsrecht gemäß den geltenden gesetzlichen Bestimmungen beeinflussen kann.",
    "17. Customer Information and Privacy": "17. Kundeninformationen und Datenschutz",
    "contract.privacy.title": "17. Kundeninformationen und Datenschutz",
    "contract.privacy.body1": "Die Verarbeitung von Kundeninformationen erfolgt gemäß den geltenden Datenschutzgesetzen, einschließlich der Anforderungen der DSGVO.",
    "contract.privacy.body2": "Personenbezogene Daten werden für die Abonnementverwaltung, die Brillenproduktion, die Lieferung, den Kundensupport und rechtliche Verpflichtungen verwendet.",
    "18. Customer Support and Communication": "18. Kundensupport und Kommunikation",
    "contract.support.title": "18. Kundensupport und Kommunikation",
    "contract.support.body1": "Anfragen bezüglich Ersatz, Lieferung, Abonnementänderungen und Kündigungen sind über die offiziellen Kommunikationskanäle von Lensly einzureichen.",
    "Customer Acceptance": "Annahme durch den Kunden",
    "contract.acceptance.title": "Annahme durch den Kunden",
    "contract.acceptance.body1": "Durch den Abschluss der Zahlung und die Annahme dieses Vertrages bestätigt der Kunde, dass er den Lensly Care Brillen-Abonnementvertrag gelesen und akzeptiert hat.",
    "contract.acceptance.body2": "Die Annahme des Kunden wird elektronisch während des Bestellvorgangs aufgezeichnet.",
    "Contract Reference ID": "Vertrags-Referenz-ID",
    "Executed Timestamp": "Ausführungs-Zeitstempel",
    "Subscriber": "Abonnent",
    "Email Address": "E-Mail-Adresse",
    "Payment Method": "Zahlungsmethode",
    "Stripe Card Payment": "Stripe Kreditkartenzahlung",
    "Authorized Electronic Signature": "Autorisierte elektronische Unterschrift",
    "E-SIGNATURE COMPLIANT (eIDAS REGULATION)": "E-SIGNATURE KONFORM (eIDAS-VERORDNUNG)",
    "contract.footer": "© 2026 Sikder LLC — Alle Rechte vorbehalten",
    "Minimum term 12 months, billing €29 monthly, automatic renewal.": "Mindestlaufzeit 12 Monate, Abrechnung 29 € monatlich, automatische Verlängerung.",
  },
  fr: {
    "LENSLY CARE VISION SUBSCRIPTION AGREEMENT": "CONTRAT D'ABONNEMENT POUR ÉQUIPEMENTS VISUELS LENSLY CARE",
    "contract.title": "CONTRAT D'ABONNEMENT POUR ÉQUIPEMENTS VISUELS LENSLY CARE",
    "contract.ref_prefix": "Référence du contrat",
    "1. Contracting Parties": "1. Parties Contractantes",
    "contract.parties.title": "1. Parties Contractantes",
    "contract.parties.body": "Le présent contrat est conclu entre : Sikder LLC, Allemagne (ci-après dénommée « Lensly » ou « le Prestataire ») et l’abonné dont les informations personnelles, les coordonnées de paiement et l’acceptation électronique sont enregistrées lors du processus de commande (ci-après dénommé « le Client »).",
    "contract.parties.acceptance": "En finalisant la commande et en confirmant le paiement, le Client accepte le présent contrat par voie électronique.",
    "2. Lensly Care Subscription": "2. Abonnement Lensly Care",
    "contract.subscription.title": "2. Abonnement Lensly Care",
    "contract.subscription.body": "Lensly Care est un service d'abonnement visuel offrant aux clients l’accès à des prestations de lunettes de vue correctrices sur mesure. L’abonnement comprend :",
    "contract.subscription.item1": "Une (1) paire complète de lunettes de vue correctrices sur mesure par année de contrat.",
    "contract.subscription.item2": "Jusqu'à trois (3) prestations de remplacement approuvées par année de contrat conformément aux conditions de remplacement décrites dans le présent contrat.",
    "3. Lensly Delivery Commitment": "3. Engagement de Livraison de Lensly",
    "contract.delivery.title": "3. Engagement de Livraison de Lensly",
    "contract.delivery.body1": "Une fois le contrat d’abonnement Lensly Care valablement établi et après que le Client a fourni toutes les informations requises, y compris les détails d'une ordonnance de lunettes valide, les données de prise de mesures et l'approbation de la monture sélectionnée, Lensly est tenu de fournir la prestation de lunettes correctrices sur mesure incluse selon les termes du présent contrat.",
    "contract.delivery.body2": "Lensly déploiera des efforts raisonnables pour finaliser la production et la livraison dans les délais annoncés.",
    "contract.delivery.body3": "Les retards causés par des informations manquantes de la part du client, la disponibilité des fournisseurs, les délais de traitement en laboratoire, les conditions d'expédition ou des circonstances échappant au contrôle raisonnable de Lensly ne dispensent pas Lensly de son obligation de fournir l'équipement visuel convenu. Lensly continuera d'œuvrer à la finalisation et à la livraison de l'équipement visuel inclus du Client.",
    "4. Minimum Contract Term and Renewal": "4. Durée Minimale du Contrat et Renouvellement",
    "contract.term.title": "4. Durée Minimale du Contrat et Renouvellement",
    "contract.term.body1": "L’abonnement Lensly Care a une durée minimale d’engagement de douze (12) mois à compter de la date d’activation.",
    "contract.term.body2": "L’année de contrat commence à la date d’activation de l’abonnement et se poursuit pendant douze (12) mois consécutifs.",
    "contract.term.body3": "Après la période initiale de douze mois, l’abonnement se poursuit automatiquement sur une base mensuelle et peut être résilié avec un préavis de trente (30) jours.",
    "contract.term.commitment": "Le Client reconnaît que l'engagement financier minimal pendant la durée initiale du contrat est de 348 € (29 € × 12 mois).",
    "5. Subscription Fee and Payment": "5. Frais d'Abonnement et Paiement",
    "contract.fee.title": "5. Frais d'Abonnement et Paiement",
    "contract.fee.body1": "Les frais d’abonnement sont de 29 € par mois.",
    "contract.fee.body2": "Les paiements sont prélevés mensuellement d'avance via des prestataires de paiement agréés, y compris les méthodes de paiement prises en charge par Stripe.",
    "contract.fee.body3": "Le Client est responsable du maintien d’informations de paiement valides.",
    "contract.fee.failed1": "Si un paiement ne peut être traité, Lensly en informera le Client et lui donnera l’opportunité de mettre à jour ses coordonnées de paiement ou de finaliser le règlement.",
    "contract.fee.failed2": "La première tentative de paiement échouée n’entraînera pas de frais supplémentaires.",
    "contract.fee.failed3": "En cas d'échecs de paiement répétés causés par des problèmes de paiement imputables au client, Lensly pourra appliquer des frais de traitement raisonnables de 5 € par tentative infructueuse après en avoir informé le Client.",
    "6. First Glasses Production Process": "6. Processus de Production de la Première Paire",
    "contract.first_glasses.title": "6. Processus de Production de la Première Paire",
    "contract.first_glasses.body1": "Après activation, le Client doit fournir toutes les informations requises, y compris les détails d'une ordonnance de lunettes valide, les données de prise de mesures et les détails de la monture sélectionnée.",
    "contract.first_glasses.body2": "Le Client peut sélectionner la monture de son choix et en fournir les détails ou les images via les canaux de communication agréés par Lensly. Lensly confirmera la monture sélectionnée avant le début de la production.",
    "contract.first_glasses.body3": "Le traitement des verres sur mesure ne commencera qu’après réception des informations et des approbations requises.",
    "contract.first_glasses.changes": "La première paire de lunettes étant fabriquée sur mesure selon l’ordonnance individuelle, les données de prise de mesures et la monture sélectionnée par le Client, ce dernier peut demander des modifications avant la confirmation finale de la commande de la première paire.",
    "contract.first_glasses.final": "Une fois que le Client a confirmé la commande de la première paire de lunettes par un canal de communication agréé par Lensly, y compris par e-mail ou tout autre mode de communication officiel, la commande de lunettes sur mesure ne peut plus être annulée ou modifiée en raison de la nature personnalisée du produit. Lensly procédera à la fourniture de la prestation visuelle confirmée selon les détails approuvés par le Client.",
    "7. Customer Responsibilities": "7. Responsabilités du Client",
    "contract.customer_responsibilities.title": "7. Responsabilités du Client",
    "contract.customer_responsibilities.body1": "Le Client est responsable de fournir des informations exactes et complets nécessaires à la production.",
    "contract.customer_responsibilities.body2": "Lensly fabrique les lunettes correctrices sur la base des informations et des spécifications fournies par le Client.",
    "contract.customer_responsibilities.body3": "Les retards causés par des informations client manquantes, incomplètes ou incorrectes peuvent retarder la production.",
    "8. Replacement Coverage": "8. Prestations de Remplacement",
    "contract.replacement.title": "8. Prestations de Remplacement",
    "contract.replacement.body1": "Lensly fournit jusqu'à trois (3) prestations de remplacement approuvées par année de contrat.",
    "contract.replacement.body2": "Les prestations de remplacement s'appliquent uniquement dans les situations suivantes :",
    "contract.replacement.item1": "Casse accidentelle des lunettes.",
    "contract.replacement.item2": "Dommages ou rayures sur les verres altérant significativement la clarté de la vision.",
    "contract.replacement.item3": "Changements de correction visuelle vérifiés.",
    "contract.replacement.proof": "Le Client doit fournir une preuve appropriée pour les demandes de remplacement. La preuve peut inclure des photographies des dommages, des documents de prescription mis à jour ou toute autre information pertinente demandée par Lensly.",
    "contract.replacement.excl_title": "Les prestations de remplacement ne comprennent pas :",
    "contract.replacement.excl1": "La perte ou le vol.",
    "contract.replacement.excl2": "Les dommages intentionnels.",
    "contract.replacement.excl3": "L'utilisation abusive ou la mauvaise manipulation.",
    "contract.replacement.excl4": "Les dommages esthétiques n'affectant pas la vision.",
    "contract.replacement.excl5": "Les changements basés uniquement sur des préférences personnelles.",
    "contract.replacement.reserve": "Lensly se réserve le droit d’examiner et de vérifier les demandes de remplacement.",
    "9. Frame and Lens Adjustments": "9. Ajustements de Monture et de Verres",
    "contract.adjustments.title": "9. Ajustements de Monture et de Verres",
    "contract.adjustments.body1": "Si le Client fournit un motif valable, notamment en cas de correction non conforme à la prescription optique fournie, de spécifications de verres incorrectes ou de problème de fabrication de monture ou de données de prise de mesures, Lensly remplacera gratuitement les verres concernés après vérification.",
    "contract.adjustments.body2": "Les problèmes causés par des informations incorrectes fournies par le client ou par une mauvaise sélection de la part du client ne donnent pas droit à un remplacement gratuit.",
    "10. Delivery and Production Time": "10. Délai de Production et de Livraison",
    "contract.delivery_time.title": "10. Délai de Production et de Livraison",
    "contract.delivery_time.body1": "Lensly s'efforcera de traiter et de livrer les lunettes sur mesure dans un délai d'environ 14 à 21 jours après réception de toutes les informations requises du client, y compris les détails d'une ordonnance de lunettes valide, les données de prise de mesures et l'approbation finale de la monture.",
    "contract.delivery_time.body2": "Les lunettes correctrices étant fabriquées individuellement, les délais de livraison peuvent varier en fonction des exigences de production, de la disponibilité des fournisseurs, des délais de traitement en laboratoire et des conditions d'expédition.",
    "contract.delivery_time.body3": "Lensly tiendra le Client informé en cas de retard important.",
    "11. Laboratory and Supplier Processing": "11. Traitement en Laboratoire et Fournisseurs",
    "contract.laboratory.title": "11. Traitement en Laboratoire et Fournisseurs",
    "contract.laboratory.body1": "Lensly collabore avec des fournisseurs d’optique et des laboratoires sélectionnés pour la production et l’ajustement des lunettes de vue.",
    "contract.laboratory.body2": "La production et la livraison peuvent dépendre de la disponibilité et des délais de traitement des tiers.",
    "contract.laboratory.body3": "Lensly déploiera des efforts raisonnables pour obtenir la monture sélectionnée demandée par le Client auprès des canaux de distribution et d'approvisionnement disponibles afin de finaliser la commande de lunettes conformément à la sélection du Client.",
    "12. Ownership of Eyewear": "12. Propriété des Lunettes de Vue",
    "contract.ownership.title": "12. Propriété des Lunettes de Vue",
    "contract.ownership.body1": "Après livraison réussie des lunettes finalisées, la propriété de la monture et des verres est transférée au Client.",
    "13. Early Cancellation": "13. Résiliation Anticipée",
    "contract.early_cancellation.title": "13. Résiliation Anticipée",
    "contract.early_cancellation.body1": "L’abonnement Lensly Care a une durée minimale d’engagement de douze (12) mois. La résiliation anticipée n'est en principe pas possible.",
    "contract.early_cancellation.body2": "Toutefois, Lensly pourra examiner les circonstances exceptionnelles et étudier les demandes de résiliation anticipée au cas par cas.",
    "14. Payment Suspension": "14. Suspension de Paiement",
    "contract.suspension.title": "14. Suspension de Paiement",
    "contract.suspension.body1": "Si les paiements d’abonnement restent impayés, Lensly pourra suspendre temporairement les prestations nécessitant un paiement actif, y compris la production future et les services de remplacement, jusqu'à ce que les paiements en attente soient régularisés.",
    "15. Prescription Eyewear Information": "15. Informations sur les Lunettes de Vue",
    "contract.eyewear_info.title": "15. Informations sur les Lunettes de Vue",
    "contract.eyewear_info.body1": "Lensly fournit des lunettes correctrices sur mesure par l'intermédiaire de fournisseurs d’optique et de laboratoires sélectionnés.",
    "contract.eyewear_info.body2": "Les lunettes sont produites conformément aux exigences applicables aux produits optiques de prescription.",
    "16. Custom-Made Products and Withdrawal Rights": "16. Produits sur Mesure et Droit de Rétractation",
    "contract.withdrawal.title": "16. Produits sur Mesure et Droit de Rétractation",
    "contract.withdrawal.body1": "Les lunettes de vue fabriquées selon les spécifications individuelles du client peuvent être qualifiées de biens sur mesure selon le droit de la consommation allemand applicable.",
    "contract.withdrawal.body2": "Le Client reconnaît que le traitement de verres individuels sur mesure peut affecter le droit de rétractation conformément aux dispositions légales applicables.",
    "17. Customer Information and Privacy": "17. Informations du Client et Protection des Données",
    "contract.privacy.title": "17. Informations du Client et Protection des Données",
    "contract.privacy.body1": "Les informations du Client sont traitées conformément aux lois applicables sur la protection des données, y compris les exigences du RGPD.",
    "contract.privacy.body2": "Les données personnelles sont utilisées pour la gestion des abonnements, la fabrication des lunettes, la livraison, le support client et les obligations légales.",
    "18. Customer Support and Communication": "18. Support Client et Communication",
    "contract.support.title": "18. Support Client et Communication",
    "contract.support.body1": "Les demandes concernant les remplacements, la livraison, les modifications d’abonnement et les résiliations doivent être soumises via les canaux de communication officiels de Lensly.",
    "Customer Acceptance": "Acceptation du Contrat",
    "contract.acceptance.title": "Acceptation du Contrat",
    "contract.acceptance.body1": "En finalisant le paiement et en acceptant le présent contrat, le Client confirme qu'il a lu et accepté le contrat d'abonnement visuel Lensly Care.",
    "contract.acceptance.body2": "L’acceptation du Client est enregistrée électroniquement lors du processus de commande.",
    "Contract Reference ID": "ID de Référence du Contrat",
    "Executed Timestamp": "Date et Heure d'Exécution",
    "Subscriber": "Abonné",
    "Email Address": "Adresse E-mail",
    "Payment Method": "Moyen de Paiement",
    "Stripe Card Payment": "Paiement par Carte Stripe",
    "Authorized Electronic Signature": "Signature Électronique Autorisée",
    "E-SIGNATURE COMPLIANT (eIDAS REGULATION)": "CONFORME À LA SIGNATURE ÉLECTRONIQUE (RÈGLEMENT eIDAS)",
    "contract.footer": "© 2026 Sikder LLC — Tous droits réservés",
    "Minimum term 12 months, billing €29 monthly, automatic renewal.": "Durée minimale de 12 mois, facturation de 29 € par mois, renouvellement automatique.",
  },
  es: {
    "LENSLY CARE VISION SUBSCRIPTION AGREEMENT": "CONTRATO DE SUSCRIPCIÓN DE CUIDADO VISUAL LENSLY CARE",
    "contract.title": "CONTRATO DE SUSCRIPCIÓN DE CUIDADO VISUAL LENSLY CARE",
    "contract.ref_prefix": "Referencia del contrato",
    "1. Contracting Parties": "1. Partes Contratantes",
    "contract.parties.title": "1. Partes Contratantes",
    "contract.parties.body": "El presente contrato se celebra entre: Sikder LLC, Alemania (en adelante, “Lensly” o “el Proveedor”) y el suscriptor cuyos datos personales, información de pago y aceptación electrónica quedan registrados durante el proceso de compra (en adelante, “el Cliente”).",
    "contract.parties.acceptance": "Al completar el proceso de compra y confirmar el pago, el Cliente acepta este contrato electrónicamente.",
    "2. Lensly Care Subscription": "2. Suscripción Lensly Care",
    "contract.subscription.title": "2. Suscripción Lensly Care",
    "contract.subscription.body": "Lensly Care es un servicio de suscripción visual que proporciona a los clientes acceso a prestaciones de gafas graduadas personalizadas. La suscripción incluye:",
    "contract.subscription.item1": "Un (1) par de gafas graduadas completas personalizadas por año de contrato.",
    "contract.subscription.item2": "Hasta tres (3) servicios de reemplazo aprobados por año de contrato de acuerdo con las condiciones de reemplazo descritas en este contrato.",
    "3. Lensly Delivery Commitment": "3. Compromiso de Entrega de Lensly",
    "contract.delivery.title": "3. Compromiso de Entrega de Lensly",
    "contract.delivery.body1": "Una vez que el contrato de suscripción de Lensly Care se haya establecido con éxito y el Cliente haya proporcionado toda la información requerida, incluidos los detalles de una prescripción óptica válida, los datos de ajuste y la aprobación de la montura seleccionada, Lensly está obligado a proporcionar el par de gafas graduadas incluido según los términos de este contrato.",
    "contract.delivery.body2": "Lensly hará esfuerzos razonables para completar la producción y entrega dentro del plazo establecido.",
    "contract.delivery.body3": "Los retrasos causados por la falta de información del cliente, disponibilidad de proveedores, tiempos de procesamiento de laboratorio, condiciones de envío o circunstancias fuera del control razonable de Lensly no eliminan la obligación de Lensly de cumplir con el beneficio de gafas acordado. Lensly continuará trabajando para la finalización y entrega del beneficio de gafas incluido del Cliente.",
    "4. Minimum Contract Term and Renewal": "4. Plazo Mínimo del Contrato y Renovación",
    "contract.term.title": "4. Plazo Mínimo del Contrato y Renovación",
    "contract.term.body1": "La suscripción de Lensly Care tiene un plazo mínimo de contrato de doce (12) meses a partir de la fecha de activación.",
    "contract.term.body2": "El año de contrato comienza en la fecha de activación de la suscripción y continúa durante doce (12) meses consecutivos.",
    "contract.term.body3": "Después del período inicial de doce meses, la suscripción continúa automáticamente de forma mensual y puede cancelarse con treinta (30) días de aviso.",
    "contract.term.commitment": "El Cliente reconoce que el compromiso financiero mínimo durante el plazo inicial del contrato es de 348 € (29 € × 12 meses).",
    "5. Subscription Fee and Payment": "5. Tarifa de Suscripción y Pago",
    "contract.fee.title": "5. Tarifa de Suscripción y Pago",
    "contract.fee.body1": "La tarifa de suscripción es de 29 € al mes.",
    "contract.fee.body2": "Los pagos se cobran mensualmente por adelantado a través de proveedores de pago autorizados, incluidos los métodos de pago compatibles con Stripe.",
    "contract.fee.body3": "El Cliente es responsable de mantener información de pago válida.",
    "contract.fee.failed1": "Si un pago no puede procesarse, Lensly notificará al Cliente y le dará la oportunidad de actualizar la información de pago o completar el pago.",
    "contract.fee.failed2": "El primer intento de pago fallido no resultará en un cargo adicional.",
    "contract.fee.failed3": "Para intentos de pago fallidos repetidos causados por problemas de pago relacionados con el cliente, Lensly podrá aplicar una tarifa de procesamiento razonable de 5 € por intento de pago fallido después de notificar al Cliente.",
    "6. First Glasses Production Process": "6. Proceso de Producción de las Primeras Gafas",
    "contract.first_glasses.title": "6. Proceso de Producción de las Primeras Gafas",
    "contract.first_glasses.body1": "Después de la activación, el Cliente debe proporcionar toda la información requerida, incluidos los detalles de una prescripción óptica válida, los datos de ajuste y la información de la montura seleccionada.",
    "contract.first_glasses.body2": "El Cliente puede seleccionar una montura preferida y proporcionar detalles o imágenes de la montura a través de los canales de comunicación aprobados de Lensly. Lensly confirmará la montura seleccionada antes de que comience la producción.",
    "contract.first_glasses.body3": "El procesamiento de lentes personalizadas comenzará solo después de que se hayan recibido la información y las aprobaciones requeridas.",
    "contract.first_glasses.changes": "Debido a que las primeras gafas se fabrican a medida según la receta individual del Cliente, las medidas y la montura seleccionada, el Cliente podrá solicitar cambios antes de la confirmación del primer pedido de gafas.",
    "contract.first_glasses.final": "Una vez que el Cliente haya confirmado el pedido de las primeras gafas a través de un canal de comunicación aprobado de Lensly, incluido el correo electrónico u otro método de comunicación oficial, el pedido de gafas personalizadas no se podrá cancelar ni cambiar debido a la naturaleza individualizada del producto. Lensly procederá a cumplir con la prestación de gafas graduadas confirmada según los detalles aprobados por el Cliente.",
    "7. Customer Responsibilities": "7. Responsabilidades del Cliente",
    "contract.customer_responsibilities.title": "7. Responsabilidades del Cliente",
    "contract.customer_responsibilities.body1": "El Cliente es responsable de proporcionar información precisa y completa requerida para la producción.",
    "contract.customer_responsibilities.body2": "Lensly fabrica gafas graduadas de acuerdo con la información y las especificaciones proporcionadas por el Cliente.",
    "contract.customer_responsibilities.body3": "Los retrasos causados por información del cliente faltante, incompleta o incorrecta pueden retrasar la producción.",
    "8. Replacement Coverage": "8. Prestaciones de Reemplazo",
    "contract.replacement.title": "8. Prestaciones de Reemplazo",
    "contract.replacement.body1": "Lensly proporciona hasta tres (3) servicios de reemplazo aprobados por año de contrato.",
    "contract.replacement.body2": "El derecho a las prestaciones de reemplazo se aplica únicamente en las siguientes situaciones:",
    "contract.replacement.item1": "Rotura accidental de las gafas.",
    "contract.replacement.item2": "Daños en las lentes o arañazos que afecten materialmente la visión clara.",
    "contract.replacement.item3": "Cambios de prescripción óptica verificados.",
    "contract.replacement.proof": "El Cliente debe proporcionar la prueba adecuada para las solicitudes de reemplazo. La prueba puede incluir fotografías de los daños, documentación de la prescripción óptica actualizada u otra información relevante solicitada por Lensly.",
    "contract.replacement.excl_title": "Las prestaciones de reemplazo no incluyen:",
    "contract.replacement.excl1": "Pérdida o robo.",
    "contract.replacement.excl2": "Daño intencional.",
    "contract.replacement.excl3": "Uso indebido o manipulación incorrecta.",
    "contract.replacement.excl4": "Daño cosmético que no afecte la visión.",
    "contract.replacement.excl5": "Cambios privados o basados únicamente en preferencias personales.",
    "contract.replacement.reserve": "Lensly se reserva el derecho de revisar y verificar las solicitudes de reemplazo.",
    "9. Frame and Lens Adjustments": "9. Ajustes de Montura y Lentes",
    "contract.adjustments.title": "9. Ajustes de Montura y Lentes",
    "contract.adjustments.body1": "Si el Cliente presenta un motivo válido, en particular en caso de graduación no conforme con la prescripción óptica proporcionada, especificaciones incorrectas de las lentes, o problemas de fabricación confirmados relacionados con la montura o las medidas de ajuste, Lensly reemplazará las lentes afectadas de forma gratuita tras la verificación.",
    "contract.adjustments.body2": "Los problemas causados por información incorrecta proporcionada por el cliente o una selección incorrecta del cliente pueden no calificar para un reemplazo gratuito.",
    "10. Delivery and Production Time": "10. Plazo de Entrega y Producción",
    "contract.delivery_time.title": "10. Plazo de Entrega y Producción",
    "contract.delivery_time.body1": "Lensly hará esfuerzos razonables para procesar y entregar gafas personalizadas dentro de aproximadamente 14 a 21 días después de recibir toda la información requerida del cliente, incluidos los detalles de una prescripción óptica válida, los datos de ajuste y la aprobación del diseño de la montura.",
    "contract.delivery_time.body2": "Debido a que las gafas graduadas se fabrican individualmente, los plazos de entrega pueden variar según los requisitos de producción, la disponibilidad de proveedores, los tiempos de procesamiento de laboratorio y las condiciones de envío.",
    "contract.delivery_time.body3": "Lensly mantendrá informado al Cliente en caso de retrasos significativos.",
    "11. Laboratory and Supplier Processing": "11. Procesamiento de Laboratorio y Proveedores",
    "contract.laboratory.title": "11. Procesamiento de Laboratorio y Proveedores",
    "contract.laboratory.body1": "Lensly trabaja con proveedores ópticos y laboratorios seleccionados para la producción y el ajuste de gafas graduadas.",
    "contract.laboratory.body2": "La producción y la entrega pueden depender de la disponibilidad de terceros y de los tiempos de procesamiento.",
    "contract.laboratory.body3": "Lensly hará esfuerzos razonables para obtener la montura seleccionada solicitada por el Cliente a través de los canales minoristas y de proveedores disponibles para completar el pedido de gafas de acuerdo con la selección del Cliente.",
    "12. Ownership of Eyewear": "12. Propiedad de las Gafas",
    "contract.ownership.title": "12. Propiedad de las Gafas",
    "contract.ownership.body1": "Después de la entrega exitosa de las gafas finalizadas, la propiedad de la montura y las lentes se transfiere al Cliente.",
    "13. Early Cancellation": "13. Cancelación Anticipada",
    "contract.early_cancellation.title": "13. Cancelación Anticipada",
    "contract.early_cancellation.body1": "La suscripción de Lensly Care tiene un plazo mínimo de contrato de doce (12) meses. La cancelación anticipada durante este período por lo general no es posible.",
    "contract.early_cancellation.body2": "Sin embargo, Lensly podrá revisar circunstancias excepcionales y considerar solicitudes de cancelación anticipada caso por caso.",
    "14. Payment Suspension": "14. Suspensión de Pago",
    "contract.suspension.title": "14. Suspensión de Pago",
    "contract.suspension.body1": "Si los pagos de la suscripción siguen sin pagarse, Lensly podrá registrar una suspensión temporal de los beneficios de producción y reemplazo hasta que se resuelvan los saldos pendientes.",
    "15. Prescription Eyewear Information": "15. Información sobre Gafas Graduadas",
    "contract.eyewear_info.title": "15. Información sobre Gafas Graduadas",
    "contract.eyewear_info.body1": "Lensly proporciona gafas graduadas personalizadas a través de proveedores ópticos y laboratorios seleccionados.",
    "contract.eyewear_info.body2": "Las gafas se producen de acuerdo con los requisitos aplicables para productos ópticos graduados.",
    "16. Custom-Made Products and Withdrawal Rights": "16. Productos Personalizados y Derecho de Desistimiento",
    "contract.withdrawal.title": "16. Productos Personalizados y Derecho de Desistimiento",
    "contract.withdrawal.body1": "Las gafas graduadas fabricadas según las especificaciones individuales del cliente pueden calificar como bienes hechos a medida bajo la ley de consumo aplicable.",
    "contract.withdrawal.body2": "El Cliente reconoce que el procesamiento de lentes personalizadas individuales puede afectar los derechos de desistimiento de acuerdo con las disposiciones legales aplicables.",
    "17. Customer Information and Privacy": "17. Información del Cliente y Protección de Datos",
    "contract.privacy.title": "17. Información del Cliente y Protección de Datos",
    "contract.privacy.body1": "La información del Cliente se procesa de acuerdo con las leyes de protección de datos aplicables, incluidos los requisitos del RGPD.",
    "contract.privacy.body2": "La información personal se utiliza para la gestión de suscripciones, producción de gafas, entrega, soporte al cliente y obligaciones legales.",
    "18. Customer Support and Communication": "18. Soporte al Cliente y Comunicación",
    "contract.support.title": "18. Soporte al Cliente y Comunicación",
    "contract.support.body1": "Las solicitudes relacionadas con reemplazos, entrega, cambios de suscripción y cancelaciones deben enviarse a través de los canales de comunicación oficiales de Lensly.",
    "Customer Acceptance": "Aceptación del Contratante",
    "contract.acceptance.title": "Aceptación del Contratante",
    "contract.acceptance.body1": "Al completar el pago y aceptar este contrato, el Cliente confirma que ha leído y aceptado el contrato de suscripción de cuidado visual Lensly Care.",
    "contract.acceptance.body2": "La aceptación del Cliente se registra electrónicamente durante el proceso de compra.",
    "Contract Reference ID": "ID de Referencia del Contrato",
    "Executed Timestamp": "Fecha y Hora de Ejecución",
    "Subscriber": "Suscriptor",
    "Email Address": "Dirección de Correo Electrónico",
    "Payment Method": "Método de Pago",
    "Stripe Card Payment": "Pago con Tarjeta Stripe",
    "Authorized Electronic Signature": "Firma Electrónica Autorizada",
    "E-SIGNATURE COMPLIANT (eIDAS REGULATION)": "CONFORME CON FIRMA ELECTRÓNICA (REGLAMENTO eIDAS)",
    "contract.footer": "© 2026 Sikder LLC — Todos los derechos reservados",
    "Minimum term 12 months, billing €29 monthly, automatic renewal.": "Plazo mínimo de 12 meses, facturación de 29 € mensuales, renovación automática.",
  },
  it: {
    "LENSLY CARE VISION SUBSCRIPTION AGREEMENT": "CONTRATTO DI ABBONAMENTO PER OCCHIALI DA VISTA LENSLY CARE",
    "contract.title": "CONTRATTO DI ABBONAMENTO PER OCCHIALI DA VISTA LENSLY CARE",
    "contract.ref_prefix": "Riferimento del Contratto:",
    "1. Contracting Parties": "1. Parti Contraenti",
    "contract.parties.title": "1. Parti Contraenti",
    "contract.parties.body": "Il presente contratto è concluso tra: Sikder LLC, Germania (di seguito denominata “Lensly” o “il Fornitore”) e l’abbonato i cui dati personali, informazioni di pagamento e accettazione elettronica vengono registrati durante il processo di acquisto (di seguito denominato “il Cliente”).",
    "contract.parties.acceptance": "Completando il processo di acquisto e confermando il pagamento, il Cliente accetta il presente contratto elettronicamente.",
    "2. Lensly Care Subscription": "2. Abbonamento Lensly Care",
    "contract.subscription.title": "2. Abbonamento Lensly Care",
    "contract.subscription.body": "Lensly Care è un servizio di abbonamento per la vista che fornisce ai clienti l'accesso a prestazioni di occhiali da vista personalizzati. L'abbonamento include:",
    "contract.subscription.item1": "Un (1) paio di occhiali da vista personalizzati completi per anno di contratto.",
    "contract.subscription.item2": "Fino a tre (3) prestazioni di sostituzione approvate per anno di contratto in base alle condizioni di sostituzione descritte nel presente contratto.",
    "3. Impegno di Consegna di Lensly": "3. Impegno di Consegna di Lensly",
    "contract.delivery.title": "3. Impegno di Consegna di Lensly",
    "contract.delivery.body1": "Una volta che il contratto di abbonamento Lensly Care è stato concluso con successo e il Cliente ha fornito tutte le informazioni richieste, inclusi i dettagli di una prescrizione ottica valida, le misure necessarie al montaggio e l'approvazione della montatura selezionata, Lensly è obbligata a fornire il paio di occhiali da vista personalizzati incluso secondo i termini del presente contratto.",
    "contract.delivery.body2": "Lensly compirà ogni ragionevole sforzo per completare la produzione e la consegna entro i tempi stabiliti.",
    "contract.delivery.body3": "I ritardi causati da informazioni mancanti del cliente, disponibilità del fornitore, tempi di elaborazione del laboratorio, condizioni di spedizione o circostanze al di fuori del ragionevole controllo di Lensly non eliminano l'obbligo di Lensly di adempiere al paio di occhiali concordato. Lensly continuerà a lavorare per il completamento e la consegna della prestazione visiva inclusa del Cliente.",
    "4. Durata Minima del Contratto e Rinnovo": "4. Durata Minima del Contratto e Rinnovo",
    "contract.term.title": "4. Durata Minima del Contratto e Rinnovo",
    "contract.term.body1": "L'abbonamento Lensly Care ha una durata minima contrattuale di dodici (12) mesi dalla data di attivazione.",
    "contract.term.body2": "L'anno contrattuale inizia alla data di attivazione dell'abbonamento e continua per dodici (12) mesi consecutivi.",
    "contract.term.body3": "Dopo il periodo iniziale di dodici mesi, l'abbonamento prosegue automaticamente su base mensile e può essere annullato con un preavviso di trenta (30) giorni.",
    "contract.term.commitment": "Il Cliente riconosce che l'impegno finanziario minimo durante la durata contrattuale iniziale è di €348 (€29 × 12 mesi).",
    "5. Quota di Abbonamento e Pagamento": "5. Quota di Abbonamento e Pagamento",
    "contract.fee.title": "5. Quota di Abbonamento e Pagamento",
    "contract.fee.body1": "La quota di abbonamento è di €29 al mese.",
    "contract.fee.body2": "I pagamenti vengono riscossi mensilmente in anticipo tramite fornitori di pagamento approvati, inclusi i metodi di pagamento supportati da Stripe.",
    "contract.fee.body3": "Il Cliente è responsabile del mantenimento di informazioni di pagamento valide.",
    "contract.fee.failed1": "Se un pagamento non può essere elaborato, Lensly informerà il Cliente e fornirà l'opportunità di aggiornare le informazioni di pagamento o completare il pagamento.",
    "contract.fee.failed2": "Il primo tentativo di pagamento fallito non comporterà costi aggiuntivi.",
    "contract.fee.failed3": "Per ripetuti tentativi di pagamento falliti causati da problemi di pagamento imputabili al cliente, Lensly può applicare una ragionevole commissione di gestione di €5 per ogni tentativo di pagamento fallito dopo aver informato il Cliente.",
    "6. Processo di Produzione del Primo Occhiale": "6. Processo di Produzione del Primo Paio di Occhiali",
    "contract.first_glasses.title": "6. Processo di Produzione del Primo Paio di Occhiali",
    "contract.first_glasses.body1": "Dopo l'attivazione, il Cliente deve fornire tutte le informazioni richieste, inclusi i dettagli di una prescrizione ottica valida, le misure necessarie al montaggio e le informazioni sulla montatura selezionata.",
    "contract.first_glasses.body2": "Il Cliente può selezionare una montatura preferita e fornire dettagli o immagini della montatura tramite i canali di comunicazione approvati da Lensly. Lensly confermerà la montatura selezionata prima dell'inizio della produzione.",
    "contract.first_glasses.body3": "L'elaborazione delle lenti personalizzate inizierà solo dopo aver ricevuto le informazioni e le approvazioni richieste.",
    "contract.first_glasses.changes": "Poiché il primo paio di occhiali è realizzato su misura in base alla prescrizione individuale del Cliente, alle misure e alla montatura selezionata, il Cliente può richiedere modifiche prima della conferma finale dell'ordine del primo paio di occhiali.",
    "contract.first_glasses.final": "Una volta che il Cliente ha confermato l'ordine del primo paio di occhiali tramite un canale di comunicazione approvato da Lensly, inclusa l'e-mail o un altro metodo di comunicazione ufficiale, l'ordine di occhiali personalizzati non può essere annullato o modificato a causa della natura personalizzata del prodotto. Lensly procederà ad adempiere alla prestazione visiva inclusa confermata in base ai dettagli approvati dal Cliente.",
    "7. Responsabilità del Cliente": "7. Responsabilità del Cliente",
    "contract.customer_responsibilities.title": "7. Responsabilità del Cliente",
    "contract.customer_responsibilities.body1": "Il Cliente è responsabile di fornire informazioni accurate e complete necessarie per la produzione.",
    "contract.customer_responsibilities.body2": "Lensly produce occhiali da vista in base alle informazioni e alle specifiche fornite dal Cliente.",
    "contract.customer_responsibilities.body3": "I ritardi causati da informazioni del cliente mancanti, incomplete o errate possono ritardare la produzione.",
    "8. Replacement Coverage": "8. Prestazioni di Sostituzione",
    "contract.replacement.title": "8. Prestazioni di Sostituzione",
    "contract.replacement.body1": "Lensly fornisce fino a tre (3) servizi di sostituzione approvati per anno di contratto.",
    "contract.replacement.body2": "Le prestazioni di sostituzione si applicano solo nelle seguenti situazioni:",
    "contract.replacement.item1": "Rottura accidentale degli occhiali.",
    "contract.replacement.item2": "Danni alle lenti o graffi che influenzano materialmente la visione chiara.",
    "contract.replacement.item3": "Modifiche di prescrizione ottica verificate.",
    "contract.replacement.proof": "Il Cliente deve fornire una prova adeguata per le richieste di sostituzione. La prova può includere fotografie dei danni, documentazione della prescrizione ottica aggiornata o altre informazioni rilevanti richieste da Lensly.",
    "contract.replacement.excl_title": "Le prestazioni di sostituzione non includono:",
    "contract.replacement.excl1": "Perdita o furto.",
    "contract.replacement.excl2": "Danno intenzionale.",
    "contract.replacement.excl3": "Uso improprio o manipolazione errata.",
    "contract.replacement.excl4": "Danno estetico che non influisce sulla vista.",
    "contract.replacement.excl5": "Modifiche basate solo su preferenze personali.",
    "contract.replacement.reserve": "Lensly si riserva il diritto di verificare ed esaminare le richieste di sostituzione.",
    "9. Frame and Lens Adjustments": "9. Adattamento di Montatura e Lenti",
    "contract.adjustments.title": "9. Adattamento di Montatura e Lenti",
    "contract.adjustments.body1": "Se il Cliente fornisce un valido motivo, in particolare in caso di gradazione non conforme alla prescrizione ottica fornita, specifiche delle lenti errate, o problemi di produzione confermati relativi alla montatura o alle misure necessarie al montaggio, Lensly sostituirà le lenti interessate gratuitamente previa verifica.",
    "contract.adjustments.body2": "I problemi causati da informazioni errate fornite dal cliente o da una selezione errata del cliente potrebbero non dare diritto alla sostituzione gratuita.",
    "10. Delivery and Production Time": "10. Tempi di Consegna e Produzione",
    "contract.delivery_time.title": "10. Tempi di Consegna e Produzione",
    "contract.delivery_time.body1": "Lensly compirà ogni ragionevole sforzo per elaborare e consegnare gli occhiali personalizzati entro circa 14-21 giorni dalla ricezione di tutte le informazioni richieste dal cliente, inclusi i dettagli di una prescrizione ottica valida, le misure necessarie al montaggio e l'approvazione finale della montatura.",
    "contract.delivery_time.body2": "Poiché gli occhiali da vista sono fabbricati individualmente, i tempi di consegna possono variare a seconda dei requisiti di produzione, della disponibilità dei fornitori, dei tempi di elaborazione del laboratorio e delle condizioni di spedizione.",
    "contract.delivery_time.body3": "Lensly terrà informato il Cliente in caso di ritardi significativi.",
    "11. Laboratory and Supplier Processing": "11. Produzione e Gestione tramite Laboratori e Fornitori",
    "contract.laboratory.title": "11. Produzione e Gestione tramite Laboratori e Fornitori",
    "contract.laboratory.body1": "Lensly lavora con fornitori di ottica e laboratori selezionati per la produzione e il montaggio di occhiali da vista.",
    "contract.laboratory.body2": "La produzione e la consegna possono dipendere dalla disponibilità di terzi e dai tempi di elaborazione.",
    "contract.laboratory.body3": "Lensly compirà ogni ragionevole sforzo per reperire la montatura selezionata richiesta dal Cliente attraverso i canali di fornitura e vendita al dettaglio disponibili per completare l'ordine degli occhiali in conformità con la selezione del Cliente.",
    "12. Ownership of Eyewear": "12. Proprietà degli Occhiali",
    "contract.ownership.title": "12. Proprietà degli Occhiali",
    "contract.ownership.body1": "Dopo il successo della consegna degli occhiali completati, la proprietà della montatura e delle lenti si trasferisce al Cliente.",
    "13. Early Cancellation": "13. Risoluzione Anticipata",
    "contract.early_cancellation.title": "13. Risoluzione Anticipata",
    "contract.early_cancellation.body1": "L'abbonamento Lensly Care ha una durata contrattuale minima di dodici (12) mesi. La risoluzione anticipata durante questo periodo di norma non è possibile.",
    "contract.early_cancellation.body2": "Tuttavia, Lensly può esaminare circostanze eccezionali e prendere in considerazione richieste di risoluzione anticipata caso per caso.",
    "14. Payment Suspension": "14. Sospensione dei Pagamenti",
    "contract.suspension.title": "14. Sospensione dei Pagamenti",
    "contract.suspension.body1": "Se i pagamenti dell'abbonamento rimangono non pagati, Lensly può sospendere temporaneamente i benefici che richiedono un pagamento attivo, incluse la produzione futura e i servizi di sostituzione, fino alla risoluzione dei pagamenti in sospeso.",
    "15. Prescription Eyewear Information": "15. Informazioni sugli Occhiali da Vista",
    "contract.eyewear_info.title": "15. Informazioni sugli Occhiali da Vista",
    "contract.eyewear_info.body1": "Lensly fornisce occhiali da vista personalizzati tramite fornitori ottici e laboratori selezionati.",
    "contract.eyewear_info.body2": "Gli occhiali sono prodotti in conformità con i requisiti applicabili per i prodotti ottici da vista.",
    "16. Custom-Made Products and Withdrawal Rights": "16. Prodotti su Misura e Diritti di Recesso",
    "contract.withdrawal.title": "16. Prodotti su Misura e Diritti di Recesso",
    "contract.withdrawal.body1": "Gli occhiali da vista prodotti secondo le specifiche individuali del cliente possono essere qualificati come beni personalizzati ai sensi della legge tedesca sulla tutela dei consumatori applicabile.",
    "contract.withdrawal.body2": "Il Cliente riconosce che l'elaborazione di lenti personalizzate individuali può influire sui diritti di recesso in conformità con le disposizioni di legge applicabili.",
    "17. Customer Information and Privacy": "17. Informazioni del Cliente e Protezione dei Dati",
    "contract.privacy.title": "17. Informazioni del Cliente e Protezione dei Dati",
    "contract.privacy.body1": "Le informazioni del Cliente sono trattate in conformità con le leggi sulla protezione dei dati applicabili, inclusi i requisiti del GDPR.",
    "contract.privacy.body2": "Le informazioni personali vengono utilizzate per la gestione dell'abbonamento, la produzione di occhiali, la consegna, il supporto clienti e gli obblighi legali.",
    "18. Supporto Clienti e Comunicazione": "18. Supporto Clienti e Comunicazione",
    "contract.support.title": "18. Supporto Clienti e Comunicazione",
    "contract.support.body1": "Le richieste relative a sostituzioni, consegne, modifiche dell'abbonamento e cancellazioni devono essere inviate tramite i canali di comunicazione ufficiali di Lensly.",
    "Customer Acceptance": "Accettazione del Contratto",
    "contract.acceptance.title": "Accettazione del Contratto",
    "contract.acceptance.body1": "Completando il pagamento e accettando il presente accordo, il Cliente conferma di aver letto e accettato il contratto di abbonamento di assistenza visiva Lensly Care.",
    "contract.acceptance.body2": "L'accettazione del Cliente viene registrata elettronicamente durante il processo di acquisto.",
    "Contract Reference ID": "Riferimento Contratto ID",
    "Executed Timestamp": "Data Esecuzione",
    "Subscriber": "Abbonato",
    "Email Address": "Indirizzo Email",
    "Payment Method": "Metodo di Pagamento",
    "Stripe Card Payment": "Pagamento con Carta Stripe",
    "Authorized Electronic Signature": "Firma Elettronica Autorizzata",
    "E-SIGNATURE COMPLIANT (eIDAS REGULATION)": "CONFORME ALLA FIRMA ELETTRONICA (REGOLAMENTO eIDAS)",
    "contract.footer": "© 2026 Sikder LLC — Tutti i diritti riservati",
    "Minimum term 12 months, billing €29 monthly, automatic renewal.": "Durata minima 12 mesi, fatturazione 29 € al mese, rinnovo automatico.",
  },
};
const translationCache: Record<string, Record<string, string>> = {
  en: { ...initialTranslations.en },
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
          const staticKeys = initialTranslations[l as Language] || {};
          const filteredParsed: Record<string, string> = {};
          Object.keys(parsed[l]).forEach((k) => {
            if (!(k in staticKeys)) {
              filteredParsed[k] = parsed[l][k];
            }
          });
          translationCache[l] = { ...translationCache[l], ...filteredParsed };
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
    if (!text) {
      return "";
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
