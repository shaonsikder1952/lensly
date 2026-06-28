import { createFileRoute } from "@tanstack/react-router";
import { Nav, Footer } from "./index";
import { useLanguage } from "../lib/i18n";
import { ShieldAlert, Scale, HelpCircle, FileCheck } from "lucide-react";

export const Route = createFileRoute("/agb")({
  head: () => ({
    meta: [
      { title: "Allgemeine Geschäftsbedingungen (AGB) | Lensly" },
      {
        name: "description",
        content:
          "General Terms and Conditions (GTC) and Regulatory Customer Information for Lensly Care.",
      },
    ],
  }),
  component: Agb,
});

function Agb() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <div>
        <Nav />
        <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
              <Scale className="w-3.5 h-3.5" />
              {t("Legal & Compliance")}
            </span>
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl mt-3">
              {t("General Terms and Conditions (GTC) & Regulatory Customer Information")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("Effective Date: June 25, 2026. Lensly UG (haftungsbeschränkt)")}
            </p>
          </div>

          <div className="bg-card rounded-2xl border border-border shadow-md p-6 sm:p-10 space-y-8 text-sm leading-relaxed text-muted-foreground/90 select-text">
            {/* Clause 1 */}
            <section className="space-y-2">
              <h2 className="font-display font-semibold text-foreground text-base border-b border-border/60 pb-2">
                {t("§ 1 Scope, Corporate Structure, and Contractual Partner")}
              </h2>
              <div className="space-y-2 text-xs sm:text-sm">
                <p>
                  {t(
                    '(1) These General Terms and Conditions (hereinafter "GTC") apply to all contracts regarding the "Lensly Care" continuous vision subscription concluded via the website lensly.care.',
                  )}
                </p>
                <p>
                  {t("(2) The contractual partner and Provider of the subscription platform is:")}
                </p>
                <div className="bg-muted/40 p-3 rounded-lg border border-border/80 font-medium text-foreground my-2">
                  {/* TODO: Legal review prior to launch. Verify UG registration status. */}
                  <p className="font-bold">Lensly UG (haftungsbeschränkt)</p>
                  <p>Düsseldorf, Germany</p>
                  <p className="font-normal text-xs text-muted-foreground mt-1">
                    Email: lensly@gmail.com
                  </p>
                  <p className="text-xs text-muted-foreground font-normal">
                    {t('(hereinafter referred to as the "Provider").')}
                  </p>
                </div>
                <p>
                  {t(
                    "(3) A customer within the meaning of these GTC is exclusively a consumer who enters into a legal transaction for purposes that are predominantly neither commercial nor attributable to an independent professional activity (§ 13 BGB).",
                  )}
                </p>
              </div>
            </section>

            {/* Clause 2 */}
            <section className="space-y-2">
              <h2 className="font-display font-semibold text-foreground text-base border-b border-border/60 pb-2">
                {t('§ 2 Subject of the Contract: The "Lensly Care" Vision Protection Plan')}
              </h2>
              <div className="space-y-2 text-xs sm:text-sm">
                <p>
                  {t(
                    "(1) The Provider operates an automated, continuous eyewear security and digital healthcare subscription platform.",
                  )}
                </p>
                <p>
                  {t(
                    "(2) Under the flat-rate fee of 29.00 Euro per month, the continuous annual scope of services consists of:",
                  )}
                </p>
                <ul className="list-disc pl-5 space-y-1 my-2">
                  <li>
                    {t(
                      "The provisioning of 1 complete custom-made pair of prescription glasses (including selected frame and custom-ground lenses) per individual subscription year.",
                    )}
                  </li>
                  <li>
                    {t(
                      "An emergency safety net of up to 3 free prescription or structural replacement pairs per individual subscription year. These are explicitly triggered by documented changes in prescription power, lens scratches, or accidental mechanical frame breakages.",
                    )}
                  </li>
                </ul>
                <p>
                  {t(
                    "(3) The Customer is required to provide current and accurate medical prescription parameters (Sphere, Cylinder, Axis, and Pupillary Distance) via the secure customer interface after checking out. Custom manufacturing cycles will only initiate upon complete receipt of these biological data fields.",
                  )}
                </p>
              </div>
            </section>

            {/* Clause 3 */}
            <section className="space-y-2">
              <h2 className="font-display font-semibold text-foreground text-base border-b border-border/60 pb-2">
                {t("§ 3 Regulatory Classification: EU MDR Medical Device Compliance Shield")}
              </h2>
              <div className="space-y-2 text-xs sm:text-sm">
                <p>
                  {t(
                    "(1) The Customer is explicitly informed that prescription spectacles are classified as Class I Medical Devices under the European Medical Device Regulation (EU MDR).",
                  )}
                </p>
                <p>
                  {t(
                    "(2) All eyewear frames offered on lensly.care are sourced exclusively from manufacturing batches carrying verified European CE conformity markings. All optical lenses are procured strictly from authorized distributors of recognized international brands (such as Essilor or Zeiss) carrying full manufacturing statements of conformity.",
                  )}
                </p>
                <p>
                  {t(
                    "(3) The final technical lens cutting, lens edge routing, and physical mounting into the frame are performed by specialized, contracted ophthalmic laboratories. The Provider operates as the digital infrastructure coordinator and borderless supply chain administrator, maintaining complete batch tracking and quality assurance validation up to the last-mile domestic courier handover.",
                  )}
                </p>
              </div>
            </section>

            {/* Clause 4 */}
            <section className="space-y-2">
              <h2 className="font-display font-semibold text-foreground text-base border-b border-border/60 pb-2">
                {t("§ 4 Contract Conclusion and the Two-Button Consumer Law Solution")}
              </h2>
              <div className="space-y-2 text-xs sm:text-sm">
                <p>
                  {t(
                    "(1) The display of the subscription service on the website constitutes a non-binding online catalog and does not represent a legally binding offer by the Provider.",
                  )}
                </p>
                <p>
                  {t(
                    "(2) To execute a contract, the Customer must navigate the integrated checkout interface. Before submitting payment details, the Customer must manually check an empty, un-checked consent box confirming they acknowledge the minimum contract duration and the premature cancellation waiver for custom-made lenses.",
                  )}
                </p>
                <p>
                  {t(
                    "(3) By clicking the final checkout execution button labeled [ Buy Now / Subscribe with Obligation to Pay ], the Customer submits a legally binding offer to enter into a 12-month fixed subscription cycle.",
                  )}
                </p>
                <p>
                  {t(
                    "(4) A binding contract is officially established only when the Provider transmits an electronic verification receipt labeled Order Confirmation via email immediately after successful Stripe/SEPA processing.",
                  )}
                </p>
              </div>
            </section>

            {/* Clause 5 */}
            <section className="space-y-2">
              <h2 className="font-display font-semibold text-foreground text-base border-b border-border/60 pb-2">
                {t("§ 5 Minimum Duration, Automatic Renewal, and Digital Interface Buttons")}
              </h2>
              <div className="space-y-2 text-xs sm:text-sm">
                <p>
                  {t(
                    "(1) The subscription contract is entered into for a fixed mandatory minimum duration of 12 months (Minimum Term). Early ordinary termination during this initial 12-month window is legally excluded.",
                  )}
                </p>
                <p>
                  {t(
                    "(2) If the subscription is not terminated with a notice period of one month prior to the end of the Minimum Term, it automatically transitions into an open-ended subscription.",
                  )}
                </p>
                <p>
                  {t(
                    "(3) Following the expiration of the initial 12 months, the Customer has the legal right to terminate the subscription at any time with a notice period of exactly one month on a rolling monthly basis.",
                  )}
                </p>
                <p>
                  {t(
                    "(4) The Statutory Interface Buttons: In strict compliance with Section 312k BGB and European Electronic Distance Contract Regulations, the Provider hosts two permanently visible, un-degradable links within the global footer layout of lensly.care:",
                  )}
                </p>
                <ul className="list-disc pl-5 space-y-2 my-2 text-foreground font-medium">
                  <li>
                    {t(
                      'Button Link 1: "Vertrag hier kündigen" (Cancel Contract Here): Directs the user to a two-step web interface to submit an immediate rolling or end-of-term subscription cancellation request.',
                    )}
                  </li>
                  <li>
                    {t(
                      'Button Link 2: "Vertrag widerrufen" (Withdraw from Contract Here): Directs the user to an immediate electronic layout to execute a statutory 14-day service withdrawal.',
                    )}
                  </li>
                </ul>
              </div>
            </section>

            {/* Clause 6 */}
            <section className="space-y-2">
              <h2 className="font-display font-semibold text-foreground text-base border-b border-border/60 pb-2">
                {t("§ 6 Pricing, Invoicing, and SEPA Lastschrift Automated Collection")}
              </h2>
              <div className="space-y-2 text-xs sm:text-sm">
                <p>
                  {t(
                    "(1) All prices published on lensly.care are final total prices stated in Euro. They include the mandatory 19% statutory German Import Value Added Tax (VAT/Einfuhrumsatzsteuer).",
                  )}
                </p>
                <p>
                  {t(
                    "(2) The recurring membership fee of 29.00 Euro is due and debited monthly in advance on the recurring calendar date of the subscription start.",
                  )}
                </p>
                <p>
                  {t(
                    "(3) By selecting SEPA Direct Debit and providing bank account credentials (IBAN), the Customer grants the Provider a digital SEPA Core Mandate authorizing automated recurring bank pulls. The Customer is legally required to maintain sufficient account funds. Any bank chargeback fees (Rücklastschriftgebühren) incurred due to insufficient account balance or incorrect data entry shall be billed entirely to the Customer.",
                  )}
                </p>
                <p>
                  {t(
                    "(4) In the event of a continuous payment default or a failed bank pull retry, the Provider will transition the user profile to Past Due status. This automatically suspends lab production, dashboard tools, and the 3 free emergency replacement privileges until the financial balance is restored via Stripe.",
                  )}
                </p>
              </div>
            </section>

            {/* Clause 7 */}
            <section className="space-y-2 bg-primary/[0.02] border border-primary/20 rounded-xl p-4 sm:p-5">
              <h2 className="font-display font-semibold text-primary text-base border-b border-primary/20 pb-2 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                {t("§ 7 EXCLUSION OF THE RIGHT OF WITHDRAWAL FOR CUSTOM PRESCRIPTION GOODS")}
              </h2>
              <div className="space-y-2 text-xs sm:text-sm text-foreground/95">
                <p>
                  {t(
                    "(1) Online consumers generally possess a statutory 14-day right of withdrawal to return e-commerce purchases without stating reasons.",
                  )}
                </p>
                <p className="font-medium">
                  {t(
                    "(2) Exclusion under German Civil Code (§ 312g Abs. 2 Nr. 1 BGB): The right of withdrawal is explicitly excluded by law for contracts involving the supply of goods that are not prefabricated and for the manufacturing of which an individual selection or determination by the consumer is decisive, or which are clearly tailored to the personal needs of the consumer.",
                  )}
                </p>
                <p className="font-semibold italic">
                  {t(
                    "(3) Premature Expiry: Because the prescription lenses provided within the Lensly Care framework are ground, calibrated, and tailored down to the sub-millimeter based on the Customer's unique medical data, the Customer explicitly acknowledges that the right of withdrawal regarding individual eyewear shipments expires completely the exact moment the manufacturing laboratory begins the custom-cutting process.",
                  )}
                </p>
              </div>
            </section>

            {/* Clause 8 */}
            <section className="space-y-2">
              <h2 className="font-display font-semibold text-foreground text-base border-b border-border/60 pb-2">
                {t("§ 8 Voluntary 14-Day Lensly Care Satisfaction Guarantee")}
              </h2>
              <div className="space-y-2 text-xs sm:text-sm">
                <p>
                  {t(
                    "Independent of the statutory legal exclusion of the right of withdrawal for custom medical items, the Provider grants a voluntary 14-day satisfaction guarantee. If the custom-ground lenses or frame fit do not provide absolute eye comfort within the first 14 days following delivery, the Customer can contact support at lensly@gmail.com. The Provider will perform an advanced prescription re-verification and dispatch a corrected replacement pair completely free of charge.",
                  )}
                </p>
              </div>
            </section>

            {/* Clause 10 */}
            <section className="space-y-2">
              <h2 className="font-display font-semibold text-foreground text-base border-b border-border/60 pb-2">
                {t("§ 10 Medical Disclaimer, Data Protection, and Customer Liability")}
              </h2>
              <div className="space-y-2 text-xs sm:text-sm">
                <p>
                  {t(
                    "(1) The Provider cuts and delivers lenses strictly on the basis of the medical parameters submitted by the Customer. The Provider does not perform independent physical eye exams, automated refractions, or manual optician face fittings. The Customer carries the sole legal responsibility to ensure that their submitted prescription data is accurate and has been verified by a licensed ophthalmologist (Augenarzt) or master optician (Optiker) within the last 12 months.",
                  )}
                </p>
                <p>
                  {t(
                    "(2) All submitted prescription, medical, and banking data are handled in absolute compliance with the General Data Protection Regulation (GDPR) via secure, encrypted data protocols.",
                  )}
                </p>
              </div>
            </section>

            {/* Clause 11 */}
            <section className="space-y-2">
              <h2 className="font-display font-semibold text-foreground text-base border-b border-border/60 pb-2">
                {t("§ 11 Governing Law, Severability, and Jurisdiction")}
              </h2>
              <div className="space-y-2 text-xs sm:text-sm">
                <p>
                  {t(
                    "(1) The laws of the Federal Republic of Germany apply, to the exclusion of the UN Convention on Contracts for the International Sale of Goods (CISG).",
                  )}
                </p>
                <p>
                  {t(
                    "(2) If any individual provision of this contract is or becomes legally invalid, the structural validity of all remaining contractual clauses remains completely unaffected.",
                  )}
                </p>
              </div>
            </section>

            {/* Statutory Cancellation Policy */}
            <section className="space-y-3 bg-muted/30 border border-border rounded-xl p-5 sm:p-6 mt-8">
              <h2 className="font-display font-bold text-foreground text-base uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck className="w-5 h-5 text-primary shrink-0" />
                {t("LEGAL CANCELLATION POLICY (For the Subscription Plan Architecture)")}
              </h2>

              <div className="space-y-3 text-xs sm:text-sm">
                <div>
                  <h4 className="font-bold text-foreground">{t("Right of Withdrawal")}</h4>
                  <p>
                    {t(
                      "You have the right to withdraw from this subscription contract within fourteen days without giving any reason. The statutory withdrawal period is fourteen days from the day the contract is officially concluded on the web portal.",
                    )}
                  </p>
                  <p className="mt-2">
                    {t(
                      'To exercise your right of withdrawal, you must inform us (Lensly UG, Düsseldorf, Germany, Email: lensly@gmail.com) of your decision to withdraw from this contract by means of a clear, unambiguous statement (e.g., a letter sent by post or an email), or by directly executing the electronic withdrawal form via the permanent "Vertrag widerrufen" button link on our platform interface.',
                    )}
                  </p>
                </div>

                <div className="pt-2">
                  <h4 className="font-bold text-foreground">{t("Consequences of Withdrawal")}</h4>
                  <p>
                    {t(
                      "If you withdraw from this contract within the 14-day window, we will refund all subscription payments received from you without delay, and at the latest within fourteen days from the day on which we received your cancellation notification. We will use the exact same payment method (Stripe/SEPA) that you used for the initial transaction, and you will not incur any refund fees.",
                    )}
                  </p>
                </div>

                <div className="pt-2 border-t border-border/80 text-xs font-semibold text-foreground/80">
                  <h4 className="font-bold text-foreground uppercase tracking-wide">
                    {t("Special Expiry Notice")}
                  </h4>
                  <p>
                    {t(
                      "Your right of withdrawal regarding the active subscription framework expires prematurely if you instruct us to begin the custom manufacturing of your medical prescription lenses before the 14-day withdrawal window has closed, and you explicitly acknowledge that you lose your right of withdrawal once laboratory lens production starts.",
                    )}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
