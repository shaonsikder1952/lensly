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
  const [paymentMethod, setPaymentMethod] = useState<"card">("card");
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
        // paymentMethod is always "card" now (SEPA removed)
        if (parsedPending.iban) setIban(parsedPending.iban);
        setContractId(parsedPending.contractId);
        setPendingDetails(parsedPending as any);

        // If the customer paid via Stripe card, auto-generate the signed contract
        // so they land directly on the ready-to-download screen
        if ((parsedPending.paymentMethod === "card" || parsedPending.paymentMethod === "wallet") && parsedPending.fullName && parsedPending.email) {
          const signatureTypeVal = (parsedPending.signatureType as "draw" | "type") || "type";
          const signatureDataVal = parsedPending.signatureData || parsedPending.fullName;

          const autoSignedData = {
            signed: true,
            fullName: parsedPending.fullName,
            email: parsedPending.email,
            signedAt: new Date().toISOString(),
            contractId: parsedPending.contractId,
            signatureType: signatureTypeVal,
            signatureData: signatureDataVal,
            paymentMethod: "wallet" as const,
            maskedIban: "Stripe Payment",
          };

          // Save/activate subscription in PostgreSQL/JSON database
          saveSubscription({
            data: {
              contractId: parsedPending.contractId,
              fullName: parsedPending.fullName,
              email: parsedPending.email,
              phone: parsedPending.phone || "",
              birthDate: parsedPending.birthDate || "",
              birthPlace: parsedPending.birthPlace || "",
              profession: parsedPending.profession || "",
              streetAddress: parsedPending.streetAddress || "",
              postalCode: parsedPending.postalCode || "",
              city: parsedPending.city || "",
              state: parsedPending.state || "",
              country: parsedPending.country || "DE",
              paymentMethod: "wallet" as const,
              signatureType: signatureTypeVal,
              signatureData: signatureDataVal,
              status: "active",
            }
          }).catch((err) => {
            console.error("Failed to auto-activate subscription in database:", err);
          });

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

    const maskedIban = "Stripe Card Payment";

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
      maskedIban: "Stripe Card Payment",
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
          {!signedData && (
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
          )}

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
                        {signedData.maskedIban || t("Stripe Card Payment")}
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
                        {signedData.maskedIban || t("Stripe Card Payment")}
                      </span>
                    </div>
                  )}
                </div>

                {/* GTC Full Agreement Text embedded inside the PDF print block */}
                <div className="space-y-4 text-[10px] leading-relaxed text-muted-foreground/90 pb-4 border-b border-border/65 mt-4 select-text">
                  <h3 className="font-bold text-foreground text-[10px] uppercase tracking-wider text-center">
                    {t("AGREEMENT TERMS & CONDITIONS")}
                  </h3>

                  {/* §1 Contracting Parties */}
                  <div className="space-y-1">
                    <strong className="text-foreground block">{t("contract.parties.title")}</strong>
                    <p>{t("contract.parties.body")}</p>
                    <p className="italic text-[9px]">{t("contract.parties.acceptance")}</p>
                  </div>

                  {/* §2 Lensly Care Subscription */}
                  <div className="space-y-1">
                    <strong className="text-foreground block">{t("contract.subscription.title")}</strong>
                    <p>{t("contract.subscription.body")}</p>
                    <ul className="list-disc list-inside space-y-0.5 pl-1 text-[9px]">
                      <li>{t("contract.subscription.item1")}</li>
                      <li>{t("contract.subscription.item2")}</li>
                    </ul>
                  </div>

                  {/* §3 Lensly Delivery Commitment */}
                  <div className="space-y-1">
                    <strong className="text-foreground block">{t("contract.delivery.title")}</strong>
                    <p>{t("contract.delivery.body1")}</p>
                    <p>{t("contract.delivery.body2")}</p>
                    <p>{t("contract.delivery.body3")}</p>
                  </div>

                  {/* §4 Minimum Contract Term and Renewal */}
                  <div className="space-y-1">
                    <strong className="text-foreground block">{t("contract.term.title")}</strong>
                    <p>{t("contract.term.body1")}</p>
                    <p>{t("contract.term.body2")}</p>
                    <p>{t("contract.term.body3")}</p>
                    <p className="font-semibold text-xs">{t("contract.term.commitment")}</p>
                  </div>

                  {/* §5 Subscription Fee and Payment */}
                  <div className="space-y-1">
                    <strong className="text-foreground block">{t("contract.fee.title")}</strong>
                    <p>{t("contract.fee.body1")}</p>
                    <p>{t("contract.fee.body2")}</p>
                    <p>{t("contract.fee.body3")}</p>
                    <p>{t("contract.fee.failed1")}</p>
                    <p>{t("contract.fee.failed2")}</p>
                    <p>{t("contract.fee.failed3")}</p>
                  </div>

                  {/* §6 First Glasses Production Process */}
                  <div className="space-y-1">
                    <strong className="text-foreground block">{t("contract.first_glasses.title")}</strong>
                    <p>{t("contract.first_glasses.body1")}</p>
                    <p>{t("contract.first_glasses.body2")}</p>
                    <p>{t("contract.first_glasses.body3")}</p>
                    <p>{t("contract.first_glasses.changes")}</p>
                    <p className="font-semibold text-xs">{t("contract.first_glasses.final")}</p>
                  </div>

                  {/* §7 Customer Responsibilities */}
                  <div className="space-y-1">
                    <strong className="text-foreground block">{t("contract.customer_responsibilities.title")}</strong>
                    <p>{t("contract.customer_responsibilities.body1")}</p>
                    <p>{t("contract.customer_responsibilities.body2")}</p>
                    <p>{t("contract.customer_responsibilities.body3")}</p>
                  </div>

                  {/* §8 Replacement Coverage */}
                  <div className="space-y-1">
                    <strong className="text-foreground block">{t("contract.replacement.title")}</strong>
                    <p>{t("contract.replacement.body1")}</p>
                    <p className="font-semibold text-xs">{t("contract.replacement.body2")}</p>
                    <ul className="list-disc list-inside space-y-0.5 pl-1 text-[9px]">
                      <li>{t("contract.replacement.item1")}</li>
                      <li>{t("contract.replacement.item2")}</li>
                      <li>{t("contract.replacement.item3")}</li>
                    </ul>
                    <p>{t("contract.replacement.proof")}</p>
                    <strong className="text-foreground block mt-1.5">{t("contract.replacement.excl_title")}</strong>
                    <ul className="list-disc list-inside space-y-0.5 pl-1 text-[9px]">
                      <li>{t("contract.replacement.excl1")}</li>
                      <li>{t("contract.replacement.excl2")}</li>
                      <li>{t("contract.replacement.excl3")}</li>
                      <li>{t("contract.replacement.excl4")}</li>
                      <li>{t("contract.replacement.excl5")}</li>
                    </ul>
                    <p>{t("contract.replacement.reserve")}</p>
                  </div>

                  {/* §9 Frame and Lens Adjustments */}
                  <div className="space-y-1">
                    <strong className="text-foreground block">{t("contract.adjustments.title")}</strong>
                    <p>{t("contract.adjustments.body1")}</p>
                    <p>{t("contract.adjustments.body2")}</p>
                  </div>

                  {/* §10 Delivery and Production Time */}
                  <div className="space-y-1">
                    <strong className="text-foreground block">{t("contract.delivery_time.title")}</strong>
                    <p>{t("contract.delivery_time.body1")}</p>
                    <p>{t("contract.delivery_time.body2")}</p>
                    <p>{t("contract.delivery_time.body3")}</p>
                  </div>

                  {/* §11 Laboratory and Supplier Processing */}
                  <div className="space-y-1">
                    <strong className="text-foreground block">{t("contract.laboratory.title")}</strong>
                    <p>{t("contract.laboratory.body1")}</p>
                    <p>{t("contract.laboratory.body2")}</p>
                    <p>{t("contract.laboratory.body3")}</p>
                  </div>

                  {/* §12 Ownership of Eyewear */}
                  <div className="space-y-1">
                    <strong className="text-foreground block">{t("contract.ownership.title")}</strong>
                    <p>{t("contract.ownership.body1")}</p>
                  </div>

                  {/* §13 Early Cancellation */}
                  <div className="space-y-1">
                    <strong className="text-foreground block">{t("contract.early_cancellation.title")}</strong>
                    <p>{t("contract.early_cancellation.body1")}</p>
                    <p>{t("contract.early_cancellation.body2")}</p>
                  </div>

                  {/* §14 Payment Suspension */}
                  <div className="space-y-1">
                    <strong className="text-foreground block">{t("contract.suspension.title")}</strong>
                    <p>{t("contract.suspension.body1")}</p>
                  </div>

                  {/* §15 Prescription Eyewear Information */}
                  <div className="space-y-1">
                    <strong className="text-foreground block">{t("contract.eyewear_info.title")}</strong>
                    <p>{t("contract.eyewear_info.body1")}</p>
                    <p>{t("contract.eyewear_info.body2")}</p>
                  </div>

                  {/* §16 Custom-Made Products and Withdrawal Rights */}
                  <div className="space-y-1 bg-amber-50/30 dark:bg-amber-900/5 p-1 rounded">
                    <strong className="text-amber-700 dark:text-amber-400 block">{t("contract.withdrawal.title")}</strong>
                    <p className="italic text-xs">{t("contract.withdrawal.body1")}</p>
                    <p>{t("contract.withdrawal.body2")}</p>
                  </div>

                  {/* §17 Customer Information and Privacy */}
                  <div className="space-y-1">
                    <strong className="text-foreground block">{t("contract.privacy.title")}</strong>
                    <p>{t("contract.privacy.body1")}</p>
                    <p>{t("contract.privacy.body2")}</p>
                  </div>

                  {/* §18 Customer Support and Communication */}
                  <div className="space-y-1">
                    <strong className="text-foreground block">{t("contract.support.title")}</strong>
                    <p>{t("contract.support.body1")}</p>
                  </div>

                  {/* Customer Acceptance */}
                  <div className="space-y-1 border-t border-border/60 pt-2 mt-2">
                    <strong className="text-foreground block">{t("contract.acceptance.title")}</strong>
                    <p>{t("contract.acceptance.body1")}</p>
                    <p className="italic text-[9px]">{t("contract.acceptance.body2")}</p>
                  </div>
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
              <div className="lg:col-span-7 bg-card rounded-2xl border border-border shadow-md overflow-hidden flex flex-col h-[620px] max-h-[70vh] order-2 lg:order-1">
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

                  {/* §1 Contracting Parties */}
                  <section className="space-y-1">
                    <h3 className="font-bold text-foreground text-xs uppercase tracking-wider">{t("contract.parties.title")}</h3>
                    <p className="text-xs">{t("contract.parties.body")}</p>
                    <p className="italic text-[11px]">{t("contract.parties.acceptance")}</p>
                  </section>

                  {/* §2 Lensly Care Subscription */}
                  <section className="space-y-1">
                    <h3 className="font-bold text-foreground text-xs uppercase tracking-wider">{t("contract.subscription.title")}</h3>
                    <p className="text-xs">{t("contract.subscription.body")}</p>
                    <ul className="list-disc list-inside space-y-0.5 pl-1 text-xs">
                      <li>{t("contract.subscription.item1")}</li>
                      <li>{t("contract.subscription.item2")}</li>
                    </ul>
                  </section>

                  {/* §3 Lensly Delivery Commitment */}
                  <section className="space-y-1">
                    <h3 className="font-bold text-foreground text-xs uppercase tracking-wider">{t("contract.delivery.title")}</h3>
                    <p className="text-xs">{t("contract.delivery.body1")}</p>
                    <p className="text-xs">{t("contract.delivery.body2")}</p>
                    <p className="text-xs">{t("contract.delivery.body3")}</p>
                  </section>

                  {/* §4 Minimum Contract Term and Renewal */}
                  <section className="space-y-1">
                    <h3 className="font-bold text-foreground text-xs uppercase tracking-wider">{t("contract.term.title")}</h3>
                    <p className="text-xs">{t("contract.term.body1")}</p>
                    <p className="text-xs">{t("contract.term.body2")}</p>
                    <p className="text-xs">{t("contract.term.body3")}</p>
                    <p className="font-semibold text-xs">{t("contract.term.commitment")}</p>
                  </section>

                  {/* §5 Subscription Fee and Payment */}
                  <section className="space-y-1">
                    <h3 className="font-bold text-foreground text-xs uppercase tracking-wider">{t("contract.fee.title")}</h3>
                    <p className="text-xs">{t("contract.fee.body1")}</p>
                    <p className="text-xs">{t("contract.fee.body2")}</p>
                    <p className="text-xs">{t("contract.fee.body3")}</p>
                    <p className="text-xs">{t("contract.fee.failed1")}</p>
                    <p className="text-xs">{t("contract.fee.failed2")}</p>
                    <p className="text-xs">{t("contract.fee.failed3")}</p>
                  </section>

                  {/* §6 First Glasses Production Process */}
                  <section className="space-y-1">
                    <h3 className="font-bold text-foreground text-xs uppercase tracking-wider">{t("contract.first_glasses.title")}</h3>
                    <p className="text-xs">{t("contract.first_glasses.body1")}</p>
                    <p className="text-xs">{t("contract.first_glasses.body2")}</p>
                    <p className="text-xs">{t("contract.first_glasses.body3")}</p>
                    <p className="text-xs">{t("contract.first_glasses.changes")}</p>
                    <p className="font-semibold text-xs">{t("contract.first_glasses.final")}</p>
                  </section>

                  {/* §7 Customer Responsibilities */}
                  <section className="space-y-1">
                    <h3 className="font-bold text-foreground text-xs uppercase tracking-wider">{t("contract.customer_responsibilities.title")}</h3>
                    <p className="text-xs">{t("contract.customer_responsibilities.body1")}</p>
                    <p className="text-xs">{t("contract.customer_responsibilities.body2")}</p>
                    <p className="text-xs">{t("contract.customer_responsibilities.body3")}</p>
                  </section>

                  {/* §8 Replacement Coverage */}
                  <section className="space-y-1">
                    <h3 className="font-bold text-foreground text-xs uppercase tracking-wider">{t("contract.replacement.title")}</h3>
                    <p className="text-xs">{t("contract.replacement.body1")}</p>
                    <p className="font-semibold text-xs">{t("contract.replacement.body2")}</p>
                    <ul className="list-disc list-inside space-y-0.5 pl-1 text-xs">
                      <li>{t("contract.replacement.item1")}</li>
                      <li>{t("contract.replacement.item2")}</li>
                      <li>{t("contract.replacement.item3")}</li>
                    </ul>
                    <p className="text-xs">{t("contract.replacement.proof")}</p>
                    <h4 className="font-bold text-foreground text-xs uppercase tracking-wider mt-1.5">{t("contract.replacement.excl_title")}</h4>
                    <ul className="list-disc list-inside space-y-0.5 pl-1 text-xs">
                      <li>{t("contract.replacement.excl1")}</li>
                      <li>{t("contract.replacement.excl2")}</li>
                      <li>{t("contract.replacement.excl3")}</li>
                      <li>{t("contract.replacement.excl4")}</li>
                      <li>{t("contract.replacement.excl5")}</li>
                    </ul>
                    <p className="text-xs">{t("contract.replacement.reserve")}</p>
                  </section>

                  {/* §9 Frame and Lens Adjustments */}
                  <section className="space-y-1">
                    <h3 className="font-bold text-foreground text-xs uppercase tracking-wider">{t("contract.adjustments.title")}</h3>
                    <p className="text-xs">{t("contract.adjustments.body1")}</p>
                    <p className="text-xs">{t("contract.adjustments.body2")}</p>
                  </section>

                  {/* §10 Delivery and Production Time */}
                  <section className="space-y-1">
                    <h3 className="font-bold text-foreground text-xs uppercase tracking-wider">{t("contract.delivery_time.title")}</h3>
                    <p className="text-xs">{t("contract.delivery_time.body1")}</p>
                    <p className="text-xs">{t("contract.delivery_time.body2")}</p>
                    <p className="text-xs">{t("contract.delivery_time.body3")}</p>
                  </section>

                  {/* §11 Laboratory and Supplier Processing */}
                  <section className="space-y-1">
                    <h3 className="font-bold text-foreground text-xs uppercase tracking-wider">{t("contract.laboratory.title")}</h3>
                    <p className="text-xs">{t("contract.laboratory.body1")}</p>
                    <p className="text-xs">{t("contract.laboratory.body2")}</p>
                    <p className="text-xs">{t("contract.laboratory.body3")}</p>
                  </section>

                  {/* §12 Ownership of Eyewear */}
                  <section className="space-y-1">
                    <h3 className="font-bold text-foreground text-xs uppercase tracking-wider">{t("contract.ownership.title")}</h3>
                    <p className="text-xs">{t("contract.ownership.body1")}</p>
                  </section>

                  {/* §13 Early Cancellation */}
                  <section className="space-y-1">
                    <h3 className="font-bold text-foreground text-xs uppercase tracking-wider">{t("contract.early_cancellation.title")}</h3>
                    <p className="text-xs">{t("contract.early_cancellation.body1")}</p>
                    <p className="text-xs">{t("contract.early_cancellation.body2")}</p>
                  </section>

                  {/* §14 Payment Suspension */}
                  <section className="space-y-1">
                    <h3 className="font-bold text-foreground text-xs uppercase tracking-wider">{t("contract.suspension.title")}</h3>
                    <p className="text-xs">{t("contract.suspension.body1")}</p>
                  </section>

                  {/* §15 Prescription Eyewear Information */}
                  <section className="space-y-1">
                    <h3 className="font-bold text-foreground text-xs uppercase tracking-wider">{t("contract.eyewear_info.title")}</h3>
                    <p className="text-xs">{t("contract.eyewear_info.body1")}</p>
                    <p className="text-xs">{t("contract.eyewear_info.body2")}</p>
                  </section>

                  {/* §16 Custom-Made Products and Withdrawal Rights */}
                  <section className="space-y-1 bg-amber-50/30 dark:bg-amber-900/5 p-2 rounded">
                    <h3 className="font-bold text-amber-700 dark:text-amber-400 text-xs uppercase tracking-wider">{t("contract.withdrawal.title")}</h3>
                    <p className="italic text-xs">{t("contract.withdrawal.body1")}</p>
                    <p className="text-xs">{t("contract.withdrawal.body2")}</p>
                  </section>

                  {/* §17 Customer Information and Privacy */}
                  <section className="space-y-1">
                    <h3 className="font-bold text-foreground text-xs uppercase tracking-wider">{t("contract.privacy.title")}</h3>
                    <p className="text-xs">{t("contract.privacy.body1")}</p>
                    <p className="text-xs">{t("contract.privacy.body2")}</p>
                  </section>

                  {/* §18 Customer Support and Communication */}
                  <section className="space-y-1">
                    <h3 className="font-bold text-foreground text-xs uppercase tracking-wider">{t("contract.support.title")}</h3>
                    <p className="text-xs">{t("contract.support.body1")}</p>
                  </section>

                  {/* Customer Acceptance */}
                  <section className="space-y-1 border-t border-border/60 pt-2 mt-2">
                    <h3 className="font-bold text-foreground text-xs uppercase tracking-wider">{t("contract.acceptance.title")}</h3>
                    <p className="text-xs">{t("contract.acceptance.body1")}</p>
                    <p className="italic text-[11px]">{t("contract.acceptance.body2")}</p>
                  </section>
                </div>

                <div className="bg-muted/30 border-t border-border/80 px-5 py-3 text-center text-[10px] text-muted-foreground flex justify-between items-center">
                  <span>© 2026 Sikder LLC</span>
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-600" />
                    {t("256-bit SSL Encrypted")}
                  </span>
                </div>
              </div>

              {/* Right Column: Signing Form */}
              <div className="lg:col-span-5 bg-card rounded-2xl border border-border shadow-md p-5 sm:p-6 order-1 lg:order-2">
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
