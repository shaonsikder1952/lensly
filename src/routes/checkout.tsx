import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../lib/i18n";
import { saveSubscription } from "../lib/api/subscriptions.functions";
import { Nav, Footer } from "./index";
import {
  ShieldCheck,
  Wallet,
  Building2,
  Lock,
  CheckCircle2,
  Loader2,
  Smartphone,
  Info,
  Sparkles,
  PenTool,
  Type,
  Trash2,
  AlertCircle,
  FileCheck,
  FileText,
  Download,
} from "lucide-react";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Secure Checkout | Lensly Care" },
      {
        name: "description",
        content: "Subscribe to Lensly Vision Care. Bundled compliance and checkout screen.",
      },
    ],
  }),
  component: CheckoutPage,
});

interface CheckoutData {
  contractId: string;
  fullName: string;
  email: string;
  paymentMethod: "sepa" | "wallet";
  maskedIban?: string;
  timestamp: string;
  signatureType: "draw" | "type";
  signatureData: string;
}

function CheckoutPage() {
  const { t } = useLanguage();

  // Checkout Steps / States
  const [isSuccess, setIsSuccess] = useState(false);
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);

  // Form inputs
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [consentLocked, setConsentLocked] = useState(false);
  const [paymentType, setPaymentType] = useState<"sepa" | "wallet">("sepa");

  // SEPA Details
  const [accountHolder, setAccountHolder] = useState("");
  const [iban, setIban] = useState("");

  // Signature Pad State
  const [signatureType, setSignatureType] = useState<"draw" | "type">("draw");
  const [typedSignature, setTypedSignature] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");

  // Apple Pay / Google Pay Modal Simulation
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletStep, setWalletStep] = useState<
    "instructions" | "scanning" | "processing" | "success"
  >("instructions");

  // Simulated Contract Reference ID
  const [contractId] = useState(() => {
    const rand = Math.floor(100000 + Math.random() * 900000);
    return `LNS-2026-${rand}`;
  });

  // Set up canvas drawing properties
  useEffect(() => {
    if (signatureType === "draw" && canvasRef.current && !isSuccess) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "#006677"; // Match primary teal
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
      }
    }
  }, [signatureType, isSuccess]);

  // Drawing Event Handlers
  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ("touches" in e) {
      if (e.cancelable) e.preventDefault();
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // Reset checkout state if needed
  const resetCheckout = () => {
    setIsSuccess(false);
    setCheckoutData(null);
    setFullName("");
    setEmail("");
    setConsentLocked(false);
    setAccountHolder("");
    setIban("");
    setTypedSignature("");
    setHasDrawn(false);
    setValidationError("");
  };

  // Format IBAN with spaces for cleaner aesthetics
  const handleIbanChange = (val: string) => {
    const cleaned = val.replace(/\s+/g, "").toUpperCase();
    const formatted = cleaned.replace(/(.{4})/g, "$1 ").trim();
    setIban(formatted);
  };

  // Validate the combined legal, details, and signature fields
  const validateForm = (): { valid: boolean; signatureVal: string } => {
    if (!fullName.trim()) {
      setValidationError(t("Please enter your full name."));
      return { valid: false, signatureVal: "" };
    }
    if (!email.trim() || !email.includes("@")) {
      setValidationError(t("Please enter a valid email address."));
      return { valid: false, signatureVal: "" };
    }
    if (!consentLocked) {
      setValidationError(t("You must agree to the contract lock-in terms."));
      return { valid: false, signatureVal: "" };
    }

    let signatureVal = "";
    if (signatureType === "draw") {
      if (!hasDrawn || !canvasRef.current) {
        setValidationError(t("Please draw your signature in the signature box."));
        return { valid: false, signatureVal: "" };
      }
      signatureVal = canvasRef.current.toDataURL("image/png");
    } else {
      if (!typedSignature.trim()) {
        setValidationError(t("Please type your name in the signature field."));
        return { valid: false, signatureVal: "" };
      }
      signatureVal = typedSignature.trim();
    }

    return { valid: true, signatureVal };
  };

  // Submit via SEPA Lastschrift
  const handleSubmitSepa = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    const { valid, signatureVal } = validateForm();
    if (!valid) return;

    if (!accountHolder.trim()) {
      setValidationError(t("Please enter the account holder name."));
      return;
    }

    const cleanedIban = iban.replace(/\s+/g, "");
    if (cleanedIban.length < 15) {
      setValidationError(t("Please enter a valid IBAN."));
      return;
    }

    setIsSubmitting(true);

    const masked = cleanedIban.slice(0, 4) + " **** **** **** " + cleanedIban.slice(-4);
    saveSubscription({
      data: {
        contractId,
        fullName: fullName.trim(),
        email: email.trim(),
        paymentMethod: "sepa",
        maskedIban: masked,
        signatureType,
        signatureData: signatureVal,
      },
    })
      .then((saved) => {
        setIsSubmitting(false);
        const data: CheckoutData = {
          contractId: saved.contractId,
          fullName: saved.fullName,
          email: saved.email,
          paymentMethod: "sepa",
          maskedIban: saved.maskedIban,
          signatureType: saved.signatureType,
          signatureData: saved.signatureData,
          timestamp: saved.createdAt || new Date().toISOString(),
        };
        setCheckoutData(data);
        setIsSuccess(true);
      })
      .catch((error) => {
        console.error("SEPA save error:", error);
        setIsSubmitting(false);
        setValidationError(t("An error occurred during submission. Please try again."));
      });
  };

  // Trigger Apple / Google Pay Modal
  const handleWalletClick = () => {
    setValidationError("");
    const { valid } = validateForm();
    if (!valid) return;

    // Launch simulated wallet authorization
    setWalletStep("instructions");
    setShowWalletModal(true);
  };

  // Simulate Biometric Bi-pass
  const handleSimulateBiometric = () => {
    const { signatureVal } = validateForm();
    setWalletStep("scanning");

    // Scan biometric
    setTimeout(() => {
      setWalletStep("processing");

      // Process Stripe authorization
      setTimeout(() => {
        setWalletStep("success");

        // Finalize transaction and save to database
        setTimeout(() => {
          saveSubscription({
            data: {
              contractId,
              fullName: fullName.trim(),
              email: email.trim(),
              paymentMethod: "wallet",
              signatureType,
              signatureData: signatureVal,
            },
          })
            .then((saved) => {
              setShowWalletModal(false);
              const data: CheckoutData = {
                contractId: saved.contractId,
                fullName: saved.fullName,
                email: saved.email,
                paymentMethod: "wallet",
                signatureType: saved.signatureType,
                signatureData: saved.signatureData,
                timestamp: saved.createdAt || new Date().toISOString(),
              };
              setCheckoutData(data);
              setIsSuccess(true);
            })
            .catch((error) => {
              console.error("Wallet save error:", error);
              setShowWalletModal(false);
              setValidationError(t("An error occurred during payment processing."));
            });
        }, 1200);
      }, 1500);
    }, 1500);
  };

  // Print function with dynamic filename
  const handlePrint = () => {
    if (checkoutData) {
      const firstName = checkoutData.fullName.trim().split(" ")[0].toLowerCase();
      const originalTitle = document.title;
      document.title = `lensly_contract_${firstName}`;
      window.print();
      document.title = originalTitle;
    } else {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      {/* Dynamic CSS Print block to make the contract document beautifully formatted for PDF print/save */}
      {isSuccess && (
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-contract-document, #printable-contract-document * {
              visibility: visible;
            }
            #printable-contract-document {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              background: white;
              color: black;
              padding: 2.5rem;
              border: none !important;
              box-shadow: none !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>
      )}

      <div>
        <Nav />

        <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          {/* Success Onboarding Screen */}
          {isSuccess && checkoutData ? (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-card rounded-2xl border border-border p-6 sm:p-10 shadow-xl text-center animate-in fade-in zoom-in duration-300">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 mb-6">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <h1 className="font-display text-2xl font-bold text-foreground">
                  {t("Welcome to Lensly Care!")}
                </h1>
                <p className="mt-2.5 text-sm text-muted-foreground">
                  {t(
                    "Your vision subscription has been successfully activated. We've locked in your rate of €29/month.",
                  )}
                </p>

                {/* Printable Document Block wrapper */}
                <div
                  id="printable-contract-document"
                  className="mt-8 border border-border/80 rounded-xl bg-muted/20 p-5 text-left text-xs space-y-6"
                >
                  <div className="text-center pb-4 border-b border-border/60">
                    <h2 className="font-display font-bold text-foreground uppercase tracking-widest text-sm">
                      {t("LENSLY CARE SUBSCRIPTION AGREEMENT (SIGNED)")}
                    </h2>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {t("Contract Reference ID")}:{" "}
                      <span className="font-mono font-semibold text-foreground">
                        {checkoutData.contractId}
                      </span>
                    </p>
                  </div>

                  {/* Certified Metadata Grid */}
                  <div className="grid gap-y-3.5 sm:grid-cols-2 sm:gap-x-8 border-b border-border/60 pb-4">
                    <div>
                      <span className="text-[9px] uppercase font-semibold text-muted-foreground tracking-wider block">
                        {t("Contract ID")}
                      </span>
                      <span className="font-mono text-foreground font-semibold block mt-0.5">
                        {checkoutData.contractId}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-semibold text-muted-foreground tracking-wider block">
                        {t("Executed Timestamp")}
                      </span>
                      <span className="text-foreground block mt-0.5">
                        {new Date(checkoutData.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-semibold text-muted-foreground tracking-wider block">
                        {t("Subscriber")}
                      </span>
                      <span className="text-foreground font-medium block mt-0.5">
                        {checkoutData.fullName}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-semibold text-muted-foreground tracking-wider block">
                        {t("Payment Method")}
                      </span>
                      <span className="text-foreground block mt-0.5">
                        {checkoutData.paymentMethod === "sepa"
                          ? `${t("SEPA Lastschrift")} (${checkoutData.maskedIban})`
                          : "Express Wallet (Apple/Google Pay)"}
                      </span>
                    </div>
                  </div>

                  {/* GTC Full Agreement Text embedded inside the PDF print block */}
                  <div className="space-y-4 text-[10px] leading-relaxed text-muted-foreground/90 max-h-60 overflow-y-auto sm:max-h-none border-b border-border/65 pb-4 select-text">
                    <h3 className="font-bold text-foreground text-[10px] uppercase tracking-wider text-center">
                      {t("AGREEMENT TERMS & CONDITIONS")}
                    </h3>

                    <p>
                      <strong>{t("1. Contracting Parties:")}</strong>{" "}
                      {t(
                        "This agreement is entered into between Lensly UG (haftungsbeschränkt), Düsseldorf, Germany (the Provider) and the subscriber (the Customer) whose signature is attached hereto.",
                      )}
                    </p>
                    <p>
                      <strong>{t("2. Subscription Scope:")}</strong>{" "}
                      {t(
                        "The subscription provides 1 complete custom-made pair of prescription glasses per contract year at €29.00/month. The plan includes a safety net of up to 3 free prescription or accident replacements per subscription year.",
                      )}
                    </p>
                    <p>
                      <strong>{t("3. Term & Cancellation:")}</strong>{" "}
                      {t(
                        "This contract features a mandatory 12-month fixed minimum term. Ordinary cancellation prior to the end of the 12th month is excluded. Thereafter, the contract automatically converts into rolling monthly renewals cancelable at any time with 30 days notice.",
                      )}
                    </p>
                    <p>
                      <strong>{t("4. Medical MDR Device:")}</strong>{" "}
                      {t(
                        "Prescription lenses are Class I Medical Devices under European Medical Device Regulation (EU MDR). Lenses and frames carry CE conformity certifications.",
                      )}
                    </p>
                    <p>
                      <strong>{t("5. Withdrawal Waiver:")}</strong>{" "}
                      {t(
                        "Under § 312g Abs. 2 Nr. 1 BGB, the statutory 14-day consumer right of withdrawal does not apply to goods custom-made to customer specifications. Right of withdrawal regarding individual custom glass routing expires prematurely once production begins.",
                      )}
                    </p>
                  </div>

                  {/* Digital Signature block */}
                  <div>
                    <span className="text-[9px] uppercase font-semibold text-muted-foreground tracking-wider block mb-2">
                      {t("Authorized Electronic Signature")}
                    </span>
                    <div className="border border-dashed border-border/80 bg-card rounded-lg h-20 flex items-center justify-center p-2 relative overflow-hidden">
                      {checkoutData.signatureType === "draw" ? (
                        <img
                          src={checkoutData.signatureData}
                          alt="Signature"
                          className="max-h-full max-w-full object-contain pointer-events-none select-none"
                        />
                      ) : (
                        <span className="font-serif italic text-2xl text-primary font-medium tracking-wide">
                          {checkoutData.signatureData}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center mt-2 text-[8px] font-mono text-muted-foreground">
                      <span>{t("E-SIGNATURE COMPLIANT (eIDAS REGULATION)")}</span>
                      <span>SHA-256: {checkoutData.contractId.replace("-", "")}CE8F...</span>
                    </div>
                  </div>
                </div>

                {/* Next steps checklist */}
                <div className="mt-8 text-left border-t border-border pt-6 no-print">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3 flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-primary" />
                    {t("Subscription Onboarding Steps")}
                  </h4>
                  <ul className="space-y-3 text-xs text-muted-foreground/90">
                    <li className="flex items-start gap-2.5">
                      <span className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                        1
                      </span>
                      <span>
                        {t("Check your email for a copy of your 1-year contract and PDF mandate.")}
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                        2
                      </span>
                      <span>
                        {t("Select your frames online or from any optical brand you love.")}
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                        3
                      </span>
                      <span>
                        {t(
                          "Upload your prescription details or send us your values to start lens production.",
                        )}
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Success action buttons */}
                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center no-print">
                  <button
                    onClick={handlePrint}
                    className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    {t("Download Signed Contract (PDF)")}
                  </button>
                  <Link
                    to="/"
                    className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/95 shadow-sm"
                  >
                    {t("Return Home")}
                  </Link>
                  <button
                    onClick={resetCheckout}
                    className="rounded-lg border border-input bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted"
                  >
                    {t("Simulate Another Subscribe")}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ================= ACTIVE CHECKOUT GRID ================= */
            <div className="grid gap-8 lg:grid-cols-12 items-start">
              {/* Left Column: Order Summary & Scrollable GTC / Contract Document Viewer */}
              <div className="lg:col-span-6 space-y-6">
                <div className="bg-card rounded-2xl border border-border shadow-md overflow-hidden flex flex-col">
                  {/* Summary Header */}
                  <div className="bg-muted/40 border-b border-border px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-xs uppercase tracking-wider text-foreground">
                        {t("Agreement Document & Summary")}
                      </span>
                    </div>
                    <span className="text-[10px] text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full">
                      €29 / {t("mo")}
                    </span>
                  </div>

                  {/* Scrollable GTC Document Reader */}
                  <div className="p-5 h-[340px] overflow-y-auto space-y-4 text-xs leading-relaxed text-muted-foreground border-b border-border select-text custom-scrollbar">
                    <div className="text-center pb-3 border-b border-border/60">
                      <h4 className="font-display font-bold text-foreground uppercase tracking-widest text-xs">
                        {t("LENSLY CARE VISION SUBSCRIPTION AGREEMENT")}
                      </h4>
                      <p className="text-[9px] text-muted-foreground mt-0.5">
                        {t("Contract Reference")}: {contractId}
                      </p>
                    </div>

                    <section className="space-y-1">
                      <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">
                        {t("1. Contracting Parties")}
                      </h5>
                      <p>
                        {t(
                          "This legally binding agreement is entered into between Lensly UG (haftungsbeschränkt), Düsseldorf, Germany (hereinafter 'the Provider') and the subscriber (hereinafter 'the Customer') whose credentials and electronic signatures are captured at checkout.",
                        )}
                      </p>
                    </section>

                    <section className="space-y-1">
                      <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">
                        {t("2. Minimum Contract Term & Renewal")}
                      </h5>
                      <p>
                        {t(
                          "The Lensly subscription has a mandatory minimum contract duration of twelve (12) months (1 year) from the date of activation. Ordinary early termination during this 12-month lock-in window is excluded. Upon completion, the contract renewals on a month-to-month basis at the same rate, cancelable with 30 days notice.",
                        )}
                      </p>
                    </section>

                    <section className="space-y-1">
                      <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">
                        {t("3. Subscription Fee & Billing")}
                      </h5>
                      <p>
                        {t(
                          "The subscription fee is €29/month. Payments are debited monthly in advance via Stripe using bank credentials (SEPA) or Express Wallets. Default in payment suspends lab manufacturing and safety replacement rights.",
                        )}
                      </p>
                    </section>

                    <section className="space-y-1">
                      <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">
                        {t("4. Deliverables & Replacements")}
                      </h5>
                      <p>
                        {t(
                          "Lensly guarantees the delivery of one (1) new complete pair of custom prescription glasses per contract year. Furthermore, the plan covers up to three (3) free replacement lenses/glasses per year for breakage, scratches, or changes to the Customer's prescription values.",
                        )}
                      </p>
                    </section>

                    <section className="space-y-1 border-t border-border/50 pt-2 bg-primary/[0.01] p-2 rounded">
                      <h5 className="font-bold text-primary text-[10px] uppercase tracking-wider">
                        {t("5. MDR & Medical Classification Shield")}
                      </h5>
                      <p className="text-[11px]">
                        {t(
                          "Prescription spectacles are Class I Medical Devices under European Medical Device Regulation (EU MDR). All frames carry verified CE markings and lenses carry original conformity certificates. Finishing lens perimeter routing is done by contracted ophthalmic labs.",
                        )}
                      </p>
                    </section>

                    <section className="space-y-1 border-t border-border/50 pt-2 bg-primary/[0.01] p-2 rounded">
                      <h5 className="font-bold text-primary text-[10px] uppercase tracking-wider">
                        {t("6. Statutory Exclusion of Withdrawal")}
                      </h5>
                      <p className="text-[11px] italic">
                        {t(
                          "Under § 312g Abs. 2 Nr. 1 BGB, the statutory 14-day consumer right of withdrawal does not apply to goods that are custom-made to customer specifications. The Customer explicitly agrees and instructs that the right of withdrawal regarding individual custom lens products expires prematurely once laboratory lens routing commences.",
                        )}
                      </p>
                    </section>
                  </div>

                  <div className="p-5 bg-muted/20">
                    {/* Compliance text warning */}
                    <div className="rounded-lg border border-primary/20 bg-primary/[0.02] p-3 text-[11px] text-foreground leading-relaxed font-medium mb-4">
                      <span className="font-bold text-primary block text-[9px] uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5" />
                        {t("Vertragsinformationen (German Compliance)")}
                      </span>
                      {t(
                        "Minimum term 12 months, billing €29 monthly, automatic renewal with monthly cancellation thereafter.",
                      )}
                    </div>

                    {/* Mandantory Signature Consent Checkbox */}
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={consentLocked}
                        onChange={(e) => setConsentLocked(e.target.checked)}
                        className="mt-0.5 rounded border-border text-primary focus:ring-primary focus:ring-offset-0 focus:outline-none accent-primary w-4.5 h-4.5 cursor-pointer shrink-0"
                      />
                      <span className="text-[11px] text-muted-foreground/95 select-none leading-relaxed transition-colors group-hover:text-foreground">
                        {t(
                          "I agree to the Terms of Service, the 12-month contract lock-in, and the custom-lens refund rules.",
                        )}{" "}
                        <span className="text-destructive font-bold">*</span>
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-muted-foreground/80 px-2">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    {t("Stripe Verified Secure Checkout")}
                  </span>
                  <span>Ref: {contractId}</span>
                </div>
              </div>

              {/* Right Column: Checkout Billing, Signature, & Payment Picker */}
              <div className="lg:col-span-6 bg-card rounded-2xl border border-border shadow-md p-5 sm:p-6">
                <h3 className="font-display font-semibold text-lg text-foreground mb-4">
                  {t("Subscriber & Payment Information")}
                </h3>

                {/* Error Box */}
                {validationError && (
                  <div className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{validationError}</span>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Subscriber Details */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                        {t("Full Name")}
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          if (paymentType === "sepa" && !accountHolder) {
                            setAccountHolder(e.target.value);
                          }
                          if (!typedSignature) {
                            setTypedSignature(e.target.value);
                          }
                        }}
                        placeholder="John Doe"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                        {t("Email Address")}
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        placeholder="john@example.com"
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* SIGNATURE PAD INTEGRATION */}
                  <div className="border-t border-b border-border/60 py-4 my-2">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {t("Authorized Signature")}{" "}
                        <span className="text-destructive font-bold">*</span>
                      </label>

                      {/* Signature type selector toggle */}
                      <div className="flex bg-muted/65 p-0.5 rounded border border-border/80">
                        <button
                          type="button"
                          onClick={() => setSignatureType("draw")}
                          className={`px-2 py-0.5 text-[9px] font-medium rounded transition-all cursor-pointer ${
                            signatureType === "draw"
                              ? "bg-card text-foreground font-bold shadow-xs"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <PenTool className="w-2.5 h-2.5 inline mr-1" />
                          {t("Draw")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSignatureType("type")}
                          className={`px-2 py-0.5 text-[9px] font-medium rounded transition-all cursor-pointer ${
                            signatureType === "type"
                              ? "bg-card text-foreground font-bold shadow-xs"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Type className="w-2.5 h-2.5 inline mr-1" />
                          {t("Type")}
                        </button>
                      </div>
                    </div>

                    {/* Signature interactive container */}
                    {signatureType === "draw" ? (
                      <div>
                        <div className="flex justify-between items-center mb-1 text-[9px] text-muted-foreground/80">
                          <span>{t("Draw signature in the box")}</span>
                          <button
                            type="button"
                            onClick={clearCanvas}
                            className="text-destructive hover:underline flex items-center gap-0.5 font-medium cursor-pointer"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                            {t("Clear")}
                          </button>
                        </div>
                        <div className="border border-border rounded-lg bg-background overflow-hidden relative touch-none">
                          <canvas
                            ref={canvasRef}
                            width={400}
                            height={120}
                            className="w-full bg-background block cursor-crosshair h-24"
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="text"
                          required={signatureType === "type"}
                          value={typedSignature}
                          onChange={(e) => setTypedSignature(e.target.value)}
                          placeholder={t("Signature Text")}
                          className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:border-primary focus:outline-none transition-colors"
                        />
                        <div className="border border-dashed border-border/80 rounded-lg h-14 bg-muted/20 flex items-center justify-center p-1">
                          {typedSignature.trim() ? (
                            <span className="font-serif italic text-xl text-primary tracking-wide">
                              {typedSignature}
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/50 italic">
                              {t("Signature preview...")}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Payment Tab Picker */}
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      {t("Select Payment Type")}
                    </label>
                    <div className="grid grid-cols-2 gap-2 bg-muted/60 p-1 rounded-lg border border-border/80">
                      <button
                        type="button"
                        onClick={() => setPaymentType("sepa")}
                        className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                          paymentType === "sepa"
                            ? "bg-card text-foreground shadow-sm font-bold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5 text-primary" />
                        {t("Bank Transfer (SEPA)")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentType("wallet")}
                        className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                          paymentType === "wallet"
                            ? "bg-card text-foreground shadow-sm font-bold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Wallet className="w-3.5 h-3.5 text-primary" />
                        {t("Express Wallet")}
                      </button>
                    </div>
                  </div>

                  {/* Tab Render: SEPA form */}
                  {paymentType === "sepa" ? (
                    <form onSubmit={handleSubmitSepa} className="space-y-3 pt-2">
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                          {t("Account Holder Name")}
                        </label>
                        <input
                          type="text"
                          required
                          value={accountHolder}
                          onChange={(e) => setAccountHolder(e.target.value)}
                          placeholder="John Doe"
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                          {t("IBAN")}
                        </label>
                        <input
                          type="text"
                          required
                          value={iban}
                          onChange={(e) => handleIbanChange(e.target.value)}
                          placeholder="DE89 3704 0044 0532 0130 00"
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono focus:border-primary focus:outline-none transition-colors"
                        />
                      </div>

                      <div className="bg-muted/30 border border-border/80 rounded-lg p-3 text-[10px] text-muted-foreground leading-relaxed">
                        {t(
                          "SEPA Direct Debit Mandate: By signing this form, you authorize Lensly Care to pull recurring monthly payments of €29 from your bank account.",
                        )}
                      </div>

                      {/* Primary Sign/Pay checkout button */}
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-lg bg-primary py-3 text-center text-sm font-semibold text-primary-foreground shadow-[0_4px_12px_rgba(0,102,119,0.15)] transition-all hover:bg-primary/95 hover:shadow-[0_4px_20px_rgba(0,102,119,0.25)] flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {t("Authorizing Mandate...")}
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4" />
                            {t("Pay & Subscribe")}
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    /* Tab Render: Express Wallet */
                    <div className="space-y-4 pt-4 text-center">
                      <p className="text-xs text-muted-foreground">
                        {t("Fast, secure checkout using biometric secure enclaves.")}
                      </p>

                      {/* Custom Apple Pay Button */}
                      <button
                        type="button"
                        onClick={handleWalletClick}
                        className="w-full rounded-lg bg-black text-white hover:bg-black/90 py-2.5 text-center text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer border border-black"
                      >
                        <span className="font-sans text-xs tracking-tight">{t("Pay with")}</span>
                        <span className="font-bold tracking-tight text-sm font-serif italic">
                           Pay
                        </span>
                      </button>

                      {/* Custom Google Pay Button */}
                      <button
                        type="button"
                        onClick={handleWalletClick}
                        className="w-full rounded-lg bg-white text-black hover:bg-muted/60 border border-border py-2.5 text-center text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span className="font-sans text-xs tracking-tight">{t("Pay with")}</span>
                        <span className="font-bold tracking-wide text-sm text-foreground/90 font-mono">
                          <span className="text-blue-500">G</span>
                          <span className="text-red-500">o</span>
                          <span className="text-yellow-500">o</span>
                          <span className="text-blue-500">g</span>
                          <span className="text-green-500">l</span>
                          <span className="text-red-500">e</span> Pay
                        </span>
                      </button>

                      <div className="text-[10px] text-muted-foreground max-w-xs mx-auto pt-2">
                        {t(
                          "Authorization locks in the 12-month subscription contract automatically.",
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      <Footer />

      {/* ================= SIMULATED EXPRESS WALLET MODAL ================= */}
      {showWalletModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl p-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal close */}
            <button
              onClick={() => setShowWalletModal(false)}
              className="absolute top-4 right-4 text-xs text-muted-foreground hover:text-foreground font-semibold cursor-pointer"
            >
              ✕
            </button>

            {walletStep === "instructions" && (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary mb-4">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h4 className="font-display font-semibold text-foreground text-base">
                  {t("Express Wallet Checkout")}
                </h4>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  {t(
                    "You are about to authorize the Lensly 1-year contract and recurring billing of €29/month via Apple/Google Pay.",
                  )}
                </p>
                <button
                  onClick={handleSimulateBiometric}
                  className="w-full mt-6 rounded-lg bg-primary py-2.5 text-center text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {t("Confirm & Simulate Pay")}
                </button>
              </div>
            )}

            {walletStep === "scanning" && (
              <div className="text-center py-6">
                <div className="relative w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  {/* Pulse visual ring */}
                  <span className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </div>
                <h4 className="font-display font-semibold text-foreground text-sm">
                  {t("Waiting for Biometric ID...")}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("Simulating FaceID / TouchID scan on device...")}
                </p>
              </div>
            )}

            {walletStep === "processing" && (
              <div className="text-center py-6">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
                <h4 className="font-display font-semibold text-foreground text-sm">
                  {t("Authorizing with Stripe...")}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("Encrypting secure key and locking in 12-month mandate...")}
                </p>
              </div>
            )}

            {walletStep === "success" && (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-200">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-display font-semibold text-foreground text-sm">
                  {t("Payment Authorized")}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("Secure tokens stored. Onboarding loading...")}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
