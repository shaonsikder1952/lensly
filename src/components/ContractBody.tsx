import { useLanguage } from "../lib/i18n";

interface ContractBodyProps {
  contractId?: string;
  /** If true, wraps in a scrollable viewer box (checkout left column).
   *  If false, renders clauses directly (for PDF/signed block). */
  scrollable?: boolean;
}

export function ContractBody({ contractId, scrollable = false }: ContractBodyProps) {
  const { t } = useLanguage();

  const clauses = (
    <div className="space-y-4 text-xs leading-relaxed text-muted-foreground select-text">
      <div className="text-center pb-3 border-b border-border/60">
        <h4 className="font-display font-bold text-foreground uppercase tracking-widest text-xs">
          {t("LENSLY CARE VISION SUBSCRIPTION AGREEMENT")}
        </h4>
        {contractId && (
          <p className="text-[9px] text-muted-foreground mt-0.5">
            {t("Contract Reference")}: {contractId}
          </p>
        )}
      </div>

      <section className="space-y-1">
        <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">{t("1. Contracting Parties")}</h5>
        <p>{t("This agreement is concluded between:")}</p>
        <p className="font-semibold">{t("Sikder LLC, Germany")}</p>
        <p>{t('(hereinafter referred to as "Lensly" or "the Provider")')}</p>
        <p className="mt-2">{t("and")}</p>
        <p>{t('the subscriber whose personal information, payment details, and electronic acceptance are recorded during the checkout process (hereinafter referred to as "the Customer").')}</p>
        <p className="mt-2">{t("By completing the checkout process and confirming payment, the Customer accepts this agreement electronically.")}</p>
      </section>

      <section className="space-y-1">
        <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">{t("2. Lensly Care Subscription")}</h5>
        <p>{t("Lensly Care is a vision subscription service providing customers with access to custom-made prescription eyewear benefits.")}</p>
        <p className="mt-2">{t("The subscription includes:")}</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t("One (1) complete custom-made prescription glasses pair per contract year.")}</li>
          <li>{t("Up to three (3) approved replacement services per contract year according to the replacement conditions described in this agreement.")}</li>
        </ul>
      </section>

      <section className="space-y-1">
        <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">{t("3. Lensly Delivery Commitment")}</h5>
        <p>{t("Once the Lensly Care subscription agreement has been successfully established and the Customer has provided all required information, including valid prescription details, fitting information, and frame selection approval, Lensly is obligated to provide the included custom-made prescription eyewear benefit according to the terms of this agreement.")}</p>
        <p className="mt-2">{t("Lensly will make reasonable efforts to complete production and delivery within the stated timeframe.")}</p>
        <p className="mt-2">{t("Delays caused by missing customer information, supplier availability, laboratory processing times, shipping conditions, or circumstances outside Lensly's reasonable control do not remove Lensly's obligation to fulfil the agreed eyewear benefit.")}</p>
        <p className="mt-2">{t("Lensly will continue to work toward completion and delivery of the Customer's included eyewear benefit.")}</p>
      </section>

      <section className="space-y-1">
        <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">{t("4. Minimum Contract Term and Renewal")}</h5>
        <p>{t("The Lensly Care subscription has a minimum contract term of twelve (12) months from the activation date.")}</p>
        <p className="mt-2">{t("The contract year begins on the date of subscription activation and continues for twelve (12) consecutive months.")}</p>
        <p className="mt-2">{t("After the initial twelve-month period, the subscription automatically continues on a monthly basis and may be cancelled with thirty (30) days' notice.")}</p>
        <p className="mt-2">{t("The Customer acknowledges that the minimum financial commitment during the initial contract term is €348 (€29 × 12 months).")}</p>
      </section>

      <section className="space-y-1">
        <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">{t("5. Subscription Fee and Payment")}</h5>
        <p>{t("The subscription fee is €29 per month.")}</p>
        <p className="mt-2">{t("Payments are collected monthly in advance through approved payment providers, including Stripe-supported payment methods.")}</p>
        <p className="mt-2">{t("The Customer is responsible for maintaining valid payment information.")}</p>
        <p className="mt-2">{t("If a payment cannot be processed, Lensly will notify the Customer and provide an opportunity to update payment information or complete payment.")}</p>
        <p className="mt-2">{t("The first failed payment attempt will not result in an additional charge.")}</p>
        <p className="mt-2">{t("For repeated failed payment attempts caused by customer-related payment issues, Lensly may apply a reasonable processing fee of €5 per failed payment attempt after notifying the Customer.")}</p>
      </section>

      <section className="space-y-1">
        <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">{t("6. First Glasses Production Process")}</h5>
        <p>{t("After activation, the Customer must provide all required information, including valid prescription details, fitting information, and selected frame information.")}</p>
        <p className="mt-2">{t("The Customer may select a preferred frame and provide frame details or images through approved Lensly communication channels.")}</p>
        <p className="mt-2">{t("Lensly will confirm the selected frame before production begins.")}</p>
        <p className="mt-2">{t("Custom lens processing will begin only after the required information and approvals have been received.")}</p>
        <p className="mt-2">{t("Because the first glasses are custom-made according to the Customer's individual prescription, measurements, and selected frame, the Customer may request changes before final confirmation of the first glasses order.")}</p>
        <p className="mt-2">{t("Once the Customer has confirmed the first glasses order through an approved Lensly communication channel, including email or another official communication method, the custom glasses order cannot be cancelled or changed due to the individual nature of the product.")}</p>
        <p className="mt-2">{t("Lensly will proceed with fulfilling the confirmed eyewear benefit according to the details approved by the Customer.")}</p>
      </section>

      <section className="space-y-1">
        <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">{t("7. Customer Responsibilities")}</h5>
        <p>{t("The Customer is responsible for providing accurate and complete information required for production.")}</p>
        <p className="mt-2">{t("Lensly manufactures prescription eyewear according to the information and specifications provided by the Customer.")}</p>
        <p className="mt-2">{t("Delays caused by missing, incomplete, or incorrect customer information may delay production.")}</p>
      </section>

      <section className="space-y-1">
        <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">{t("8. Replacement Coverage")}</h5>
        <p>{t("Lensly provides up to three (3) approved replacement services per contract year.")}</p>
        <p className="mt-2">{t("Replacement coverage applies only in the following situations:")}</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t("Accidental breakage of the glasses.")}</li>
          <li>{t("Lens damage or scratches that materially affect clear vision.")}</li>
          <li>{t("Verified prescription changes.")}</li>
        </ul>
        <p className="mt-2">{t("The Customer must provide appropriate proof for replacement requests.")}</p>
        <p className="mt-2">{t("Replacement coverage does not include: Loss or theft, intentional damage, misuse or improper handling, cosmetic damage that does not affect vision, or changes based only on personal preference.")}</p>
        <p className="mt-2">{t("Lensly reserves the right to review and verify replacement requests.")}</p>
      </section>

      <section className="space-y-1">
        <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">{t("9. Frame and Lens Adjustments")}</h5>
        <p>{t("If the Customer provides a valid reason, including incorrect prescription compared with the submitted prescription, incorrect lens specifications, or confirmed fitting or frame-related production issues, Lensly will replace the affected lenses free of charge after verification.")}</p>
        <p className="mt-2">{t("Issues caused by incorrect customer-provided information or incorrect customer selection may not qualify for free replacement.")}</p>
      </section>

      <section className="space-y-1">
        <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">{t("10. Delivery and Production Time")}</h5>
        <p>{t("Lensly will make reasonable efforts to process and deliver custom-made eyewear within approximately 14 to 21 days after receiving all required customer information, including valid prescription details, fitting information, and final frame approval.")}</p>
        <p className="mt-2">{t("Because prescription eyewear is individually manufactured, delivery times may vary depending on production requirements, supplier availability, laboratory processing times, and shipping conditions.")}</p>
        <p className="mt-2">{t("Lensly will keep the Customer informed in case of significant delays.")}</p>
      </section>

      <section className="space-y-1">
        <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">{t("11. Laboratory and Supplier Processing")}</h5>
        <p>{t("Lensly works with selected optical suppliers and laboratories for the production and adjustment of prescription eyewear.")}</p>
        <p className="mt-2">{t("Production and delivery may depend on third-party availability and processing times.")}</p>
        <p className="mt-2">{t("Lensly will make reasonable efforts to source the selected frame requested by the Customer through available supplier and retail channels to complete the eyewear order according to the Customer's selection.")}</p>
      </section>

      <section className="space-y-1">
        <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">{t("12. Ownership of Eyewear")}</h5>
        <p>{t("After successful delivery of the completed eyewear, ownership of the frame and lenses transfers to the Customer.")}</p>
      </section>

      <section className="space-y-1">
        <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">{t("13. Early Cancellation")}</h5>
        <p>{t("The Lensly Care subscription has a minimum contract term of twelve (12) months.")}</p>
        <p className="mt-2">{t("Early cancellation during this period is generally not available.")}</p>
        <p className="mt-2">{t("However, Lensly may review exceptional circumstances and consider early cancellation requests on a case-by-case basis.")}</p>
      </section>

      <section className="space-y-1">
        <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">{t("14. Payment Suspension")}</h5>
        <p>{t("If subscription payments remain unpaid, Lensly may temporarily suspend benefits that require active payment, including future production and replacement services, until outstanding payments are resolved.")}</p>
      </section>

      <section className="space-y-1">
        <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">{t("15. Prescription Eyewear Information")}</h5>
        <p>{t("Lensly provides custom-made prescription eyewear through selected optical suppliers and laboratories.")}</p>
        <p className="mt-2">{t("The eyewear is produced according to applicable requirements for prescription optical products.")}</p>
      </section>

      <section className="space-y-1 border-t border-border/50 pt-2 bg-primary/[0.01] p-2 rounded">
        <h5 className="font-bold text-primary text-[10px] uppercase tracking-wider">{t("16. Custom-Made Products and Withdrawal Rights")}</h5>
        <p className="text-[11px] italic">{t("Prescription glasses manufactured according to individual customer specifications may qualify as custom-made goods under applicable German consumer law.")}</p>
        <p className="mt-2 text-[11px] italic">{t("The Customer acknowledges that individual custom-made lens processing may affect withdrawal rights according to applicable legal provisions.")}</p>
      </section>

      <section className="space-y-1">
        <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">{t("17. Customer Information and Privacy")}</h5>
        <p>{t("Customer information is processed according to applicable data protection laws, including GDPR requirements.")}</p>
        <p className="mt-2">{t("Personal information is used for subscription management, eyewear production, delivery, customer support, and legal obligations.")}</p>
      </section>

      <section className="space-y-1">
        <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">{t("18. Customer Support and Communication")}</h5>
        <p>{t("Requests regarding replacements, delivery, subscription changes, and cancellations should be submitted through official Lensly communication channels.")}</p>
      </section>

      <section className="space-y-1 border-t border-border/50 pt-3">
        <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">{t("Customer Acceptance")}</h5>
        <p>{t("By completing payment and accepting this agreement, the Customer confirms that they have read and accepted the Lensly Care Vision Subscription Agreement.")}</p>
        <p className="mt-1">{t("Customer acceptance is recorded electronically during checkout.")}</p>
      </section>
    </div>
  );

  if (scrollable) {
    return (
      <div className="p-5 h-[340px] overflow-y-auto space-y-4 text-xs leading-relaxed text-muted-foreground border-b border-border select-text custom-scrollbar">
        {clauses}
      </div>
    );
  }

  return clauses;
}
