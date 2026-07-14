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
          {t("contract.title")}
        </h4>
        {contractId && (
          <p className="text-[9px] text-muted-foreground mt-0.5">
            {t("contract.ref_prefix")}: {contractId}
          </p>
        )}
      </div>

      {/* §1 Contracting Parties */}
      <section className="space-y-1">
        <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">
          {t("contract.parties.title")}
        </h5>
        <p>{t("contract.parties.body")}</p>
        <p className="italic text-[9px]">{t("contract.parties.acceptance")}</p>
      </section>

      {/* §2 Lensly Care Subscription */}
      <section className="space-y-1">
        <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">
          {t("contract.subscription.title")}
        </h5>
        <p>{t("contract.subscription.body")}</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t("contract.subscription.item1")}</li>
          <li>{t("contract.subscription.item2")}</li>
        </ul>
      </section>

      {/* §3 Lensly Delivery Commitment */}
      <section className="space-y-1">
        <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">
          {t("contract.delivery.title")}
        </h5>
        <p>{t("contract.delivery.body1")}</p>
        <p>{t("contract.delivery.body2")}</p>
        <p>{t("contract.delivery.body3")}</p>
      </section>

      {/* §4 Minimum Contract Term and Renewal */}
      <section className="space-y-1">
        <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">
          {t("contract.term.title")}
        </h5>
        <p>{t("contract.term.body1")}</p>
        <p>{t("contract.term.body2")}</p>
        <p>{t("contract.term.body3")}</p>
        <p className="font-semibold">{t("contract.term.commitment")}</p>
      </section>

      {/* §5 Subscription Fee and Payment */}
      <section className="space-y-1">
        <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">
          {t("contract.fee.title")}
        </h5>
        <p>{t("contract.fee.body1")}</p>
        <p>{t("contract.fee.body2")}</p>
        <p>{t("contract.fee.body3")}</p>
        <p>{t("contract.fee.failed1")}</p>
        <p>{t("contract.fee.failed2")}</p>
        <p>{t("contract.fee.failed3")}</p>
      </section>

      {/* §6 First Glasses Production Process */}
      <section className="space-y-1">
        <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">
          {t("contract.first_glasses.title")}
        </h5>
        <p>{t("contract.first_glasses.body1")}</p>
        <p>{t("contract.first_glasses.body2")}</p>
        <p>{t("contract.first_glasses.body3")}</p>
        <p>{t("contract.first_glasses.changes")}</p>
        <p className="font-semibold">{t("contract.first_glasses.final")}</p>
      </section>

      {/* §7 Customer Responsibilities */}
      <section className="space-y-1">
        <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">
          {t("contract.customer_responsibilities.title")}
        </h5>
        <p>{t("contract.customer_responsibilities.body1")}</p>
        <p>{t("contract.customer_responsibilities.body2")}</p>
        <p>{t("contract.customer_responsibilities.body3")}</p>
      </section>

      {/* §8 Replacement Coverage */}
      <section className="space-y-1">
        <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">
          {t("contract.replacement.title")}
        </h5>
        <p>{t("contract.replacement.body1")}</p>
        <p className="font-semibold">{t("contract.replacement.body2")}</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t("contract.replacement.item1")}</li>
          <li>{t("contract.replacement.item2")}</li>
          <li>{t("contract.replacement.item3")}</li>
        </ul>
        <p>{t("contract.replacement.proof")}</p>
        <strong className="text-foreground block mt-1.5">{t("contract.replacement.excl_title")}</strong>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t("contract.replacement.excl1")}</li>
          <li>{t("contract.replacement.excl2")}</li>
          <li>{t("contract.replacement.excl3")}</li>
          <li>{t("contract.replacement.excl4")}</li>
          <li>{t("contract.replacement.excl5")}</li>
        </ul>
        <p>{t("contract.replacement.reserve")}</p>
      </section>

      {/* §9 Frame and Lens Adjustments */}
      <section className="space-y-1">
        <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">
          {t("contract.adjustments.title")}
        </h5>
        <p>{t("contract.adjustments.body1")}</p>
        <p>{t("contract.adjustments.body2")}</p>
      </section>

      {/* §10 Delivery and Production Time */}
      <section className="space-y-1">
        <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">
          {t("contract.delivery_time.title")}
        </h5>
        <p>{t("contract.delivery_time.body1")}</p>
        <p>{t("contract.delivery_time.body2")}</p>
        <p>{t("contract.delivery_time.body3")}</p>
      </section>

      {/* §11 Laboratory and Supplier Processing */}
      <section className="space-y-1">
        <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">
          {t("contract.laboratory.title")}
        </h5>
        <p>{t("contract.laboratory.body1")}</p>
        <p>{t("contract.laboratory.body2")}</p>
        <p>{t("contract.laboratory.body3")}</p>
      </section>

      {/* §12 Ownership of Eyewear */}
      <section className="space-y-1">
        <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">
          {t("contract.ownership.title")}
        </h5>
        <p>{t("contract.ownership.body1")}</p>
      </section>

      {/* §13 Early Cancellation */}
      <section className="space-y-1">
        <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">
          {t("contract.early_cancellation.title")}
        </h5>
        <p>{t("contract.early_cancellation.body1")}</p>
        <p>{t("contract.early_cancellation.body2")}</p>
      </section>

      {/* §14 Payment Suspension */}
      <section className="space-y-1">
        <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">
          {t("contract.suspension.title")}
        </h5>
        <p>{t("contract.suspension.body1")}</p>
      </section>

      {/* §15 Prescription Eyewear Information */}
      <section className="space-y-1">
        <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">
          {t("contract.eyewear_info.title")}
        </h5>
        <p>{t("contract.eyewear_info.body1")}</p>
        <p>{t("contract.eyewear_info.body2")}</p>
      </section>

      {/* §16 Custom-Made Products and Withdrawal Rights */}
      <section className="space-y-1 border-t border-border/50 pt-2 bg-primary/[0.01] p-2 rounded">
        <h5 className="font-bold text-primary text-[10px] uppercase tracking-wider">
          {t("contract.withdrawal.title")}
        </h5>
        <p className="text-[11px] italic">{t("contract.withdrawal.body1")}</p>
        <p>{t("contract.withdrawal.body2")}</p>
      </section>

      {/* §17 Customer Information and Privacy */}
      <section className="space-y-1">
        <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">
          {t("contract.privacy.title")}
        </h5>
        <p>{t("contract.privacy.body1")}</p>
        <p>{t("contract.privacy.body2")}</p>
      </section>

      {/* §18 Customer Support and Communication */}
      <section className="space-y-1">
        <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">
          {t("contract.support.title")}
        </h5>
        <p>{t("contract.support.body1")}</p>
      </section>

      {/* Customer Acceptance */}
      <section className="space-y-1 border-t border-border/50 pt-3">
        <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">
          {t("contract.acceptance.title")}
        </h5>
        <p>{t("contract.acceptance.body1")}</p>
        <p className="mt-1">{t("contract.acceptance.body2")}</p>
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
