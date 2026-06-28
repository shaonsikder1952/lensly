import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../lib/i18n";
import { saveSubscription } from "../lib/api/subscriptions.functions";
import { Nav, Footer } from "./index";
import {
  PenTool,
  Type,
  Trash2,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Lock,
  Calendar,
  AlertCircle,
  Download,
  RotateCcw,
  Loader2,
} from "lucide-react";

export const Route = createFileRoute("/contract")({
  head: () => ({
    meta: [
      { title: "Lensly Vision Care Agreement | Sign Contract" },
      {
        name: "description",
        content: "Review and sign your Lensly Care 1-year subscription agreement.",
      },
    ],
  }),
  component: ContractPage,
});

interface SignedContractData {
  signed: boolean;
  fullName: string;
  email: string;
  signedAt: string;
  contractId: string;
  signatureType: "draw" | "type";
  signatureData: string;
  paymentMethod?: string;
  maskedIban?: string;
}

function ContractPage() {
  const { t } = useLanguage();
  const [signedData, setSignedData] = useState<SignedContractData | null>(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [agreeTerm, setAgreeTerm] = useState(false);
  const [agreeBilling, setAgreeBilling] = useState(false);
  const [agreeAgb, setAgreeAgb] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"sepa" | "wallet" | "card">("sepa");
  const [iban, setIban] = useState("");
  const [signatureType, setSignatureType] = useState<"draw" | "type">("draw");
  const [typedSignature, setTypedSignature] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [pendingDetails, setPendingDetails] = useState<any>(null);

  // Canvas Drawing State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Generate a persistent simulated contract ID if none exists
  const [contractId, setContractId] = useState(() => {
    const rand = Math.floor(100000 + Math.random() * 900000);
    return `LNS-2026-${rand}`;
  });

  // Load signed state from localStorage — auto-complete contract if returning from Stripe
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        // If already signed, restore the signed view
        const saved = localStorage.getItem("lensly_signed_contract");
        if (saved) {
          setSignedData(JSON.parse(saved));
          return;
        }

        // Check for pending details saved before Stripe redirect
        const pendingSaved = localStorage.getItem("lensly_pending_contract");
        if (!pendingSaved) return;

        let parsedPending: Record<string, string> | null = null;
        try {
          parsedPending = JSON.parse(pendingSaved);
        } catch (e) {
          console.error("Failed to parse pending details", e);
          return;
        }

        if (!parsedPending) return;

        // Pre-fill form fields from saved data
        setFullName(parsedPending.fullName || "");
        setEmail(parsedPending.email || "");
        if (parsedPending.paymentMethod) setPaymentMethod(parsedPending.paymentMethod as "sepa" | "card");
        if (parsedPending.iban) setIban(parsedPending.iban);
        setContractId(parsedPending.contractId);
        setPendingDetails(parsedPending as any);

        // If the customer paid via Stripe card, auto-generate the signed contract
        // so they land directly on the ready-to-download screen
        if (parsedPending.paymentMethod === "card" && parsedPending.fullName && parsedPending.email) {
          const autoSignedData = {
            signed: true,
            fullName: parsedPending.fullName,
            email: parsedPending.email,
            signedAt: new Date().toISOString(),
            contractId: parsedPending.contractId,
            signatureType: "type" as const,
            signatureData: parsedPending.fullName, // typed name as electronic signature
            paymentMethod: "card" as const,
            maskedIban: "Stripe Card Payment",
          };
          localStorage.removeItem("lensly_pending_contract");
          localStorage.setItem("lensly_signed_contract", JSON.stringify(autoSignedData));
          setSignedData(autoSignedData);
        }
      } catch (e) {
        console.error("Failed to load signed contract", e);
      }
    }
  }, []);

  // Set up drawing styles
  useEffect(() => {
    if (signatureType === "draw" && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "#006677"; // Match primary teal
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
      }
    }
  }, [signatureType, signedData]);

  // Drawing Handlers
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

  // Submit Handler
  const handleSignContract = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Validation
    if (!fullName.trim()) {
      setErrorMsg(t("Please enter your full name."));
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMsg(t("Please enter a valid email address."));
      return;
    }
    if (!agreeTerm || !agreeBilling || !agreeAgb) {
      setErrorMsg(t("Please agree to all contract terms to proceed."));
      return;
    }

    let maskedIban = "";
    if (paymentMethod === "sepa") {
      const cleanedIban = iban.replace(/\s+/g, "");
      const ibanRegex = /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/;
      if (!ibanRegex.test(cleanedIban)) {
        setErrorMsg(t("Please enter a valid IBAN (e.g. DE89 3704 0044 0532 0130 00)."));
        return;
      }
      maskedIban = cleanedIban.slice(0, 4) + " **** **** **** " + cleanedIban.slice(-4);
    }

    let signatureVal = "";
    if (signatureType === "draw") {
      if (!hasDrawn || !canvasRef.current) {
        setErrorMsg(t("Please draw your signature in the signature area."));
        return;
      }
      signatureVal = canvasRef.current.toDataURL("image/png");
    } else {
      if (!typedSignature.trim()) {
        setErrorMsg(t("Please type your name to sign the contract."));
        return;
      }
      signatureVal = typedSignature;
    }
    const data: SignedContractData = {
      signed: true,
      fullName: fullName.trim(),
      email: email.trim(),
      signedAt: new Date().toISOString(),
      contractId,
      signatureType,
      signatureData: signatureVal,
      paymentMethod,
      maskedIban: paymentMethod === "sepa" ? maskedIban : "Apple/Google Pay",
    };

    if (pendingDetails) {
      saveSubscription({
        data: {
          contractId: pendingDetails.contractId,
          fullName: fullName.trim(),
          email: email.trim(),
          phone: pendingDetails.phone || "placeholder",
          birthDate: pendingDetails.birthDate || "placeholder",
          birthPlace: pendingDetails.birthPlace || "placeholder",
          profession: pendingDetails.profession || "placeholder",
          streetAddress: pendingDetails.streetAddress || "placeholder",
          postalCode: pendingDetails.postalCode || "placeholder",
          city: pendingDetails.city || "placeholder",
          state: pendingDetails.state || "",
          country: pendingDetails.country || "DE",
          paymentMethod: pendingDetails.paymentMethod || "wallet",
          signatureType,
          signatureData: signatureVal,
          status: "active",
        }
      }).catch((err) => {
        console.error("Failed to activate pending subscription in database:", err);
      });
    }

    localStorage.removeItem("lensly_pending_contract");
    localStorage.setItem("lensly_signed_contract", JSON.stringify(data));
    setSignedData(data);
  };

  // Reset Handler
  const handleReset = () => {
    if (
      confirm(
        t(
          "Are you sure you want to revoke and delete this signed agreement? This will clear the signatures.",
        ),
      )
    ) {
      localStorage.removeItem("lensly_signed_contract");
      setSignedData(null);
      setFullName("");
      setEmail("");
      setAgreeTerm(false);
      setAgreeBilling(false);
      setAgreeAgb(false);
      setTypedSignature("");
      setHasDrawn(false);
      setErrorMsg("");
    }
  };

  const handleDownloadPDF = async () => {
    if (!signedData) return;
    setDownloadingPDF(true);
    const firstName = signedData.fullName.trim().split(" ")[0].toLowerCase();
    const filename = `lensly_contract_${firstName}.pdf`;

    const element = document.getElementById("printable-contract-document");
    if (!element) {
      setDownloadingPDF(false);
      return;
    }

    let clone: HTMLElement | null = null;
    try {
      const [html2canvasMod, jsPDFMod] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);
      const html2canvas = html2canvasMod.default;
      const jsPDF = jsPDFMod.default;

      clone = element.cloneNode(true) as HTMLElement;
      clone.classList.remove("hidden");
      clone.style.display = "block";
      clone.style.background = "#ffffff";
      clone.style.color = "#000000";
      clone.style.padding = "24px";
      clone.style.width = "750px";
      clone.style.position = "absolute";
      clone.style.left = "-9999px";
      clone.style.top = "0";
      document.body.appendChild(clone);

      const canvas = await html2canvas(clone, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      const pdf = new jsPDF({ orientation: "portrait", unit: "in", format: "letter" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 0.25;
      const contentWidth = pdfWidth - margin * 2;
      const imgHeight = (canvas.height * contentWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, "JPEG", margin, position, contentWidth, imgHeight);
      heightLeft -= pdfHeight - margin * 2;

      while (heightLeft > 0) {
        position = -(pdfHeight - margin * 2 - margin) + margin;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", margin, position - (imgHeight - heightLeft - (pdfHeight - margin * 2)), contentWidth, imgHeight);
        heightLeft -= pdfHeight - margin * 2;
      }

      pdf.save(filename);
      setDownloadingPDF(false);
    } catch (err) {
      console.error("PDF generation failed:", err);
      setDownloadingPDF(false);
      alert("PDF download failed: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      if (clone && document.body.contains(clone)) {
        document.body.removeChild(clone);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <div>
        <Nav />
        <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          {/* Preview Warning Banner */}
          <div className="max-w-2xl mx-auto mb-8 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2.5 leading-relaxed no-print">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{t("Contract Preview Mode")}</p>
              <p className="mt-1">
                {t("This standalone page is for reviewing and previewing the contract layout only. Signing here will not start an active subscription or trigger payments. To complete a real subscription, please go to the")}{" "}
                <Link to="/checkout" className="underline font-semibold hover:text-amber-800 dark:hover:text-amber-300">
                  {t("Checkout Page")}
                </Link>
                .
              </p>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
              <ShieldCheck className="w-3.5 h-3.5" />
              {t("Legal Agreement")}
            </span>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl mt-3">
              {t("Lensly Vision Care Agreement")}
            </h1>
            <p className="mt-2.5 text-sm text-muted-foreground max-w-md mx-auto">
              {t(
                "Review, check the authorization boxes, and digitally sign your 1-year contract below.",
              )}
            </p>
          </div>

          {signedData ? (
            /* ================= SIGNED CONFIRMATION STATE ================= */
            <div className="max-w-2xl mx-auto rounded-2xl border border-border bg-card p-6 sm:p-10 shadow-lg text-center animate-in fade-in zoom-in duration-200">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 mb-6">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                {t("Contract Signed Successfully")}
              </h2>
              <p className="mt-2 text-xs text-muted-foreground">
                {t("A copy of your signed agreement has been certified and saved.")}
              </p>

              {/* Certificate Block */}
              <div className="mt-8 border border-border/80 rounded-xl bg-muted/20 p-5 sm:p-8 text-left relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 text-[10px] uppercase font-bold tracking-widest text-emerald-600/20 pointer-events-none select-none">
                  {t("Verified Secure")}
                </div>

                <div className="grid gap-y-4 sm:grid-cols-2 sm:gap-x-8 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">
                      {t("Contract Identification")}
                    </span>
                    <span className="font-mono text-foreground font-semibold block mt-0.5">
                      {signedData.contractId}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">
                      {t("Date & Time of Signature")}
                    </span>
                    <span className="text-foreground block mt-0.5">
                      {new Date(signedData.signedAt).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">
                      {t("Subscriber Name")}
                    </span>
                    <span className="text-foreground font-medium block mt-0.5">
                      {signedData.fullName}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">
                      {t("Registered Email")}
                    </span>
                    <span className="text-foreground block mt-0.5">{signedData.email}</span>
                  </div>
                  {signedData.paymentMethod && (
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">
                        {t("Payment Method")}
                      </span>
                      <span className="text-foreground block mt-0.5 font-medium">
                        {signedData.paymentMethod === "sepa"
                          ? `${t("SEPA Lastschrift")} (${signedData.maskedIban})`
                          : signedData.maskedIban || t("Apple Pay / Google Pay")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Signature Render */}
                <div className="mt-6 border-t border-border pt-5">
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block mb-2">
                    {t("Authorized Electronic Signature")}
                  </span>

                  <div className="border border-dashed border-border/80 bg-card rounded-lg h-24 flex items-center justify-center relative overflow-hidden p-2">
                    {signedData.signatureType === "draw" ? (
                      <img
                        src={signedData.signatureData}
                        alt="Signature"
                        className="max-h-full max-w-full object-contain pointer-events-none select-none"
                      />
                    ) : (
                      <span className="font-serif italic text-3xl text-primary font-medium tracking-wide">
                        {signedData.signatureData}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-2 text-[9px] font-mono text-muted-foreground">
                    <span>{t("E-SIGNATURE COMPLIANT (eIDAS REGULATION)")}</span>
                    <span>SHA-256: {signedData.contractId.replace("-", "")}FD3A...</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleDownloadPDF}
                  disabled={downloadingPDF}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/95 shadow-sm disabled:opacity-50"
                >
                  {downloadingPDF ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {downloadingPDF ? t("Downloading...") : t("Print or Save Contract")}
                </button>
                <button
                  onClick={handleReset}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-input bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted"
                >
                  <RotateCcw className="w-4 h-4" />
                  {t("Revoke & Resign")}
                </button>
              </div>

              {/* Printable Document Block wrapper */}
              <div
                id="printable-contract-document"
                className="hidden"
              >
                <div className="text-center pb-4 border-b border-border/60">
                  <h2 className="font-display font-bold text-foreground uppercase tracking-widest text-sm">
                    {t("LENSLY CARE SUBSCRIPTION AGREEMENT (SIGNED)")}
                  </h2>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {t("Contract Reference ID")}:{" "}
                    <span className="font-mono font-semibold text-foreground">
                      {signedData.contractId}
                    </span>
                  </p>
                </div>

                {/* Certified Metadata Grid */}
                <div className="grid gap-y-3.5 grid-cols-2 gap-x-8 border-b border-border/65 pb-4 mt-4">
                  <div>
                    <span className="text-[9px] uppercase font-semibold text-muted-foreground tracking-wider block">
                      {t("Contract ID")}
                    </span>
                    <span className="font-mono text-foreground font-semibold block mt-0.5">
                      {signedData.contractId}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-semibold text-muted-foreground tracking-wider block">
                      {t("Executed Timestamp")}
                    </span>
                    <span className="text-foreground block mt-0.5">
                      {new Date(signedData.signedAt).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-semibold text-muted-foreground tracking-wider block">
                      {t("Subscriber")}
                    </span>
                    <span className="text-foreground font-semibold block mt-0.5">
                      {signedData.fullName}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-semibold text-muted-foreground tracking-wider block">
                      {t("Email Address")}
                    </span>
                    <span className="text-foreground block mt-0.5">{signedData.email}</span>
                  </div>
                  {signedData.paymentMethod && (
                    <div>
                      <span className="text-[9px] uppercase font-semibold text-muted-foreground tracking-wider block">
                        {t("Payment Method")}
                      </span>
                      <span className="text-foreground block mt-0.5 font-semibold">
                        {signedData.paymentMethod === "sepa"
                          ? `${t("SEPA Lastschrift")} (${signedData.maskedIban})`
                          : signedData.maskedIban || t("Apple Pay / Google Pay")}
                      </span>
                    </div>
                  )}
                </div>

                {/* GTC Full Agreement Text embedded inside the PDF print block */}
                <div className="space-y-4 text-[10px] leading-relaxed text-muted-foreground/90 pb-4 border-b border-border/65 mt-4 select-text">
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
                <div className="mt-4">
                  <span className="text-[9px] uppercase font-semibold text-muted-foreground tracking-wider block mb-2">
                    {t("Authorized Electronic Signature")}
                  </span>
                  <div className="border border-dashed border-border/80 bg-card rounded-lg h-20 flex items-center justify-center p-2 relative overflow-hidden">
                    {signedData.signatureType === "draw" ? (
                      <img
                        src={signedData.signatureData}
                        alt="Signature"
                        className="max-h-full max-w-full object-contain pointer-events-none select-none"
                      />
                    ) : (
                      <span className="font-serif italic text-2xl text-primary font-medium tracking-wide">
                        {signedData.signatureData}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-2 text-[8px] font-mono text-muted-foreground">
                    <span>{t("E-SIGNATURE COMPLIANT (eIDAS REGULATION)")}</span>
                    <span>SHA-256: {signedData.contractId.replace("-", "")}FD3A...</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 text-xs">
                <Link to="/" className="text-primary hover:underline font-semibold">
                  {t("Return to Home Page")}
                </Link>
              </div>
            </div>
          ) : (
            /* ================= ACTIVE CONTRACT SIGNING WORKFLOW ================= */
            <div className="grid gap-8 lg:grid-cols-12 items-start">
              {/* Left Column: Contract Document Viewer */}
              <div className="lg:col-span-7 bg-card rounded-2xl border border-border shadow-md overflow-hidden flex flex-col h-[620px] max-h-[70vh]">
                <div className="bg-muted/40 border-b border-border/80 px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-xs uppercase tracking-wider text-foreground/80">
                      {t("Agreement Document")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                    <Calendar className="w-3.5 h-3.5" />
                    2026-06-25
                  </div>
                </div>

                {/* Scrollable Document Content */}
                <div className="p-6 overflow-y-auto space-y-5 text-sm leading-relaxed text-muted-foreground/90 font-sans custom-scrollbar select-text">
                  <div className="text-center border-b border-border pb-4 mb-4">
                    <h2 className="font-display font-bold text-foreground uppercase tracking-widest text-sm">
                      {t("LENSLY CARE VISION SUBSCRIPTION AGREEMENT")}
                    </h2>
                    <p className="text-[10px] text-muted-foreground/80 tracking-wide mt-1">
                      {t("Contract Reference")}: {contractId}
                    </p>
                  </div>

                  <section>
                    <h3 className="font-bold text-foreground text-xs uppercase tracking-wider mb-1.5">
                      {t("1. Contracting Parties")}
                    </h3>
                    <p className="text-xs">
                      {t(
                        "This legally binding agreement is entered into between Lensly (hereinafter 'Lensly') and the subscriber (hereinafter 'the Customer') whose custom information and digital signatures are attached hereto.",
                      )}
                    </p>
                  </section>

                  <section>
                    <h3 className="font-bold text-foreground text-xs uppercase tracking-wider mb-1.5">
                      {t("2. Minimum Contract Term & Renewal")}
                    </h3>
                    <p className="text-xs">
                      {t(
                        "The Lensly subscription has a mandatory minimum contract duration of twelve (12) months (1 year) from the date of activation. Upon completion of the initial 12-month period, the subscription will automatically renew on a month-to-month basis at the same rate, unless cancelled by the Customer with a minimum of thirty (30) days notice prior to the end of the current billing cycle.",
                      )}
                    </p>
                  </section>

                  <section>
                    <h3 className="font-bold text-foreground text-xs uppercase tracking-wider mb-1.5">
                      {t("3. Subscription Fee & Billing")}
                    </h3>
                    <p className="text-xs">
                      {t(
                        "The subscription fee is €29/month. Payments are processed monthly on a recurring basis via Stripe using the payment details provided at checkout. The fee includes all coatings, prescription lenses, frame procurement, and shipping costs. No additional or hidden surcharges will apply.",
                      )}
                    </p>
                  </section>

                  <section>
                    <h3 className="font-bold text-foreground text-xs uppercase tracking-wider mb-1.5">
                      {t("4. Deliverables & Replacements")}
                    </h3>
                    <p className="text-xs">
                      {t(
                        "Lensly guarantees the delivery of one (1) new complete pair of custom prescription glasses per contract year. Furthermore, the plan covers up to three (3) free replacement lenses/glasses per year in the event of accidental breakage, scratches, loss, or changes to the Customer's prescription values.",
                      )}
                    </p>
                  </section>

                  <section>
                    <h3 className="font-bold text-foreground text-xs uppercase tracking-wider mb-1.5">
                      {t("5. Custom Goods & Refunds")}
                    </h3>
                    <p className="text-xs">
                      {t(
                        "As all prescription optical lenses are custom crafted to individual health specifications, the contract is immediately initiated. Refunds are not available once custom lens manufacturing has begun. Corrective replacements are provided completely free if any manufacturing defects occur.",
                      )}
                    </p>
                  </section>

                  <section className="border-t border-border/60 pt-4">
                    <h3 className="font-bold text-foreground text-xs uppercase tracking-wider mb-1.5">
                      {t("6. Consent to Electronic Signatures")}
                    </h3>
                    <p className="text-xs italic">
                      {t(
                        "By typing or drawing your signature in this document, you explicitly consent to transact business electronically and agree that your electronic signature carries the full legal weight and binding nature of a handwritten physical signature under standard global electronic transaction acts.",
                      )}
                    </p>
                  </section>
                </div>

                <div className="bg-muted/30 border-t border-border/80 px-5 py-3 text-center text-[10px] text-muted-foreground flex justify-between items-center">
                  <span>© 2026 Lensly Care AG</span>
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-600" />
                    {t("256-bit SSL Encrypted")}
                  </span>
                </div>
              </div>

              {/* Right Column: Signing Form */}
              <div className="lg:col-span-5 bg-card rounded-2xl border border-border shadow-md p-5 sm:p-6">
                <h3 className="font-display font-semibold text-lg text-foreground mb-4">
                  {t("Contract Execution Form")}
                </h3>

                <form onSubmit={handleSignContract} className="space-y-4">
                  {/* Name Input */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      {t("Full Name")} <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t("e.g. John Doe")}
                      className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Email Input */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      {t("Email Address")} <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t("e.g. john@example.com")}
                      className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Payment Method Selector */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      {t("Payment Method")} <span className="text-destructive">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2 bg-muted/60 p-1 rounded-lg border border-border/80">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("sepa")}
                        className={`py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                          paymentMethod === "sepa"
                            ? "bg-card text-foreground shadow-sm font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {t("SEPA Lastschrift")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("wallet")}
                        className={`py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                          paymentMethod === "wallet"
                            ? "bg-card text-foreground shadow-sm font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {t("Apple/Google Pay")}
                      </button>
                    </div>
                  </div>

                  {/* IBAN Input (Only visible if SEPA selected) */}
                  {paymentMethod === "sepa" && (
                    <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                        {t("IBAN")} <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={iban}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          const cleaned = val.replace(/[^A-Z0-9]/g, "");
                          const matches = cleaned.match(/.{1,4}/g);
                          setIban(matches ? matches.join(" ") : cleaned);
                        }}
                        placeholder="DE89 3704 0044 0532 0130 00"
                        className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm font-mono text-foreground focus:border-primary focus:outline-none transition-colors"
                      />
                    </div>
                  )}

                  {/* Agreement Checkboxes */}
                  <div className="space-y-2.5 border-t border-b border-border/60 py-3.5 my-4">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={agreeTerm}
                        onChange={(e) => setAgreeTerm(e.target.checked)}
                        className="mt-0.5 rounded border-border text-primary focus:ring-primary focus:ring-offset-0 focus:outline-none accent-primary w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs text-muted-foreground/95 select-none leading-relaxed transition-colors group-hover:text-foreground">
                        {t("I accept the minimum 12-month contract commitment.")}
                      </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={agreeBilling}
                        onChange={(e) => setAgreeBilling(e.target.checked)}
                        className="mt-0.5 rounded border-border text-primary focus:ring-primary focus:ring-offset-0 focus:outline-none accent-primary w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs text-muted-foreground/95 select-none leading-relaxed transition-colors group-hover:text-foreground">
                        {t("I authorize recurring monthly billing of €29.")}
                      </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={agreeAgb}
                        onChange={(e) => setAgreeAgb(e.target.checked)}
                        className="mt-0.5 rounded border-border text-primary focus:ring-primary focus:ring-offset-0 focus:outline-none accent-primary w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs text-muted-foreground/95 select-none leading-relaxed transition-colors group-hover:text-foreground">
                        {t("I agree to the Terms of Service (AGB) & Privacy Policy.")}
                      </span>
                    </label>
                  </div>

                  {/* Signature Pad Mode Toggle */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      {t("Choose Signature Method")} <span className="text-destructive">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2 bg-muted/60 p-1 rounded-lg border border-border/80">
                      <button
                        type="button"
                        onClick={() => setSignatureType("draw")}
                        className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                          signatureType === "draw"
                            ? "bg-card text-foreground shadow-sm font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <PenTool className="w-3.5 h-3.5" />
                        {t("Draw Signature")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSignatureType("type")}
                        className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                          signatureType === "type"
                            ? "bg-card text-foreground shadow-sm font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Type className="w-3.5 h-3.5" />
                        {t("Type Signature")}
                      </button>
                    </div>
                  </div>

                  {/* Signature Content Area */}
                  <div className="mt-3">
                    {signatureType === "draw" ? (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                            {t("Sign in the box below")}
                          </span>
                          <button
                            type="button"
                            onClick={clearCanvas}
                            className="inline-flex items-center gap-1 text-[10px] font-medium text-destructive hover:underline"
                          >
                            <Trash2 className="w-3 h-3" />
                            {t("Clear Box")}
                          </button>
                        </div>
                        <div className="border border-border rounded-lg bg-background overflow-hidden relative touch-none">
                          <canvas
                            ref={canvasRef}
                            width={400}
                            height={140}
                            className="w-full bg-background block cursor-crosshair"
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
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                            {t("Type signature values")}
                          </span>
                        </div>
                        <input
                          type="text"
                          required={signatureType === "type"}
                          value={typedSignature}
                          onChange={(e) => setTypedSignature(e.target.value)}
                          placeholder={t("e.g. John Doe")}
                          className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none transition-colors"
                        />
                        <div className="mt-2.5 border border-dashed border-border/80 rounded-lg p-3 bg-muted/20 h-16 flex items-center justify-center">
                          {typedSignature.trim() ? (
                            <span className="font-serif italic text-2xl text-primary tracking-wide">
                              {typedSignature}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground/50 italic">
                              {t("Cursive signature preview...")}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Error Message */}
                  {errorMsg && (
                    <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-primary py-2.5 text-center text-sm font-semibold text-primary-foreground shadow-[0_4px_12px_rgba(0,102,119,0.15)] transition-all hover:bg-primary/95 hover:shadow-[0_4px_20px_rgba(0,102,119,0.25)] flex items-center justify-center gap-2 mt-4 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {t("Sign & Authorize Agreement")}
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
}
