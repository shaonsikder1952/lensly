import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../lib/i18n";
import { saveSubscription, checkStripeConfig, createStripeSession, confirmStripeSession, sendVerificationCodes, verifyCodes } from "../lib/api/subscriptions.functions";
import { Nav, Footer } from "./index";
import {
  ShieldCheck,
  Wallet,
  CreditCard,
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
  X,
} from "lucide-react";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Secure Checkout | Lensly Care" },
      {
        name: "description",
        content: "Subscribe to Lensly Care - Premium prescription eyewear subscription.",
      },
    ],
  }),
  component: CheckoutPage,
});

interface CheckoutData {
  contractId: string;
  fullName: string;
  email: string;
  phone: string;
  birthDate: string;
  birthPlace: string;
  profession: string;
  streetAddress: string;
  postalCode: string;
  city: string;
  state?: string;
  country?: string;
  paymentMethod: "sepa" | "wallet";
  maskedIban?: string;
  timestamp: string;
  signatureType: "draw" | "type";
  signatureData: string;
  contractHash: string;
}

const generateContractHash = async (data: string): Promise<string> => {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

function CheckoutPage() {
  const { t } = useLanguage();

  const [isSuccess, setIsSuccess] = useState(false);
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);

  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [isVerifyingStripe, setIsVerifyingStripe] = useState(false);

  useEffect(() => {
    checkStripeConfig()
      .then((res) => {
        setStripeEnabled(res.enabled);
      })
      .catch((err) => {
        console.error("Failed to check Stripe config:", err);
      });

    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    if (sessionId) {
      setIsVerifyingStripe(true);
      confirmStripeSession({ data: { sessionId } })
        .then(async (updatedRecord) => {
          const hashInput = `${updatedRecord.contractId}|${updatedRecord.fullName}|${updatedRecord.email}|${updatedRecord.timestamp}`;
          const contractHash = await generateContractHash(hashInput);
          setCheckoutData({
            contractId: updatedRecord.contractId,
            fullName: updatedRecord.fullName,
            email: updatedRecord.email,
            phone: updatedRecord.phone,
            birthDate: updatedRecord.birthDate,
            birthPlace: updatedRecord.birthPlace,
            profession: updatedRecord.profession,
            streetAddress: updatedRecord.streetAddress,
            postalCode: updatedRecord.postalCode,
            city: updatedRecord.city,
            paymentMethod: updatedRecord.paymentMethod,
            maskedIban: updatedRecord.maskedIban,
            signatureType: updatedRecord.signatureType,
            signatureData: updatedRecord.signatureData,
            timestamp: updatedRecord.timestamp,
            contractHash,
          });
          setIsSuccess(true);
          // Fire Meta Pixel Purchase event on confirmed payment
          if (typeof window !== "undefined" && (window as any).fbq) {
            (window as any).fbq("track", "Purchase", {
              value: 29.00,
              currency: "EUR",
            });
          }
          window.history.replaceState({}, document.title, window.location.pathname);
        })
        .catch((error) => {
          console.error("Stripe session confirmation error:", error);
          setValidationError(t("Payment verification failed. Please try again or contact support."));
        })
        .finally(() => {
          setIsVerifyingStripe(false);
        });
    }

    if (params.get("cancelled") === "true") {
      setValidationError(t("Payment was cancelled. You can try again."));
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState("+49");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [profession, setProfession] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [stateInput, setStateInput] = useState("");
  const [countryInput, setCountryInput] = useState("DE");
  const [consentLocked, setConsentLocked] = useState(false);
  const [paymentType, setPaymentType] = useState<"card">("card");

  const [accountHolder, setAccountHolder] = useState("");
  const [iban, setIban] = useState("");

  const [signatureType, setSignatureType] = useState<"draw" | "type">("draw");
  const [typedSignature, setTypedSignature] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, _setValidationError] = useState("");
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);

  const setValidationError = (msg: string) => {
    _setValidationError(msg);
    if (msg) {
      setToast({ message: msg, type: "error" });
    }
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const [contractId] = useState(() => {
    const rand = Math.floor(100000 + Math.random() * 900000);
    return `LNS-2026-${rand}`;
  });

  useEffect(() => {
    if (signatureType === "draw" && canvasRef.current && !isSuccess) {
      const canvas = canvasRef.current;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.strokeStyle = "#006677";
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

  // Hash function moved to top level

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
    // Proper email validation: must have @ with domain containing a dot
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setValidationError(t("Please enter a valid email address."));
      return { valid: false, signatureVal: "" };
    }
    // Phone validation: must be digits/spaces/dashes/plus, at least 5 digits
    const phoneDigits = phone.replace(/[^\d]/g, "");
    if (!phone.trim() || phoneDigits.length < 5 || !/^[\d\s()-]+$/.test(phone.trim())) {
      setValidationError(t("Please enter a valid phone number."));
      return { valid: false, signatureVal: "" };
    }
    // Birth date validation: must be valid date and subscriber must be 18+
    if (!birthDate) {
      setValidationError(t("Please enter your date of birth."));
      return { valid: false, signatureVal: "" };
    }
    const parsedDate = new Date(birthDate);
    if (isNaN(parsedDate.getTime())) {
      setValidationError(t("Please enter a valid date of birth."));
      return { valid: false, signatureVal: "" };
    }
    const today = new Date();
    const age = today.getFullYear() - parsedDate.getFullYear();
    const monthDiff = today.getMonth() - parsedDate.getMonth();
    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < parsedDate.getDate()) ? age - 1 : age;
    if (actualAge < 18) {
      setValidationError(t("You must be at least 18 years old to subscribe."));
      return { valid: false, signatureVal: "" };
    }
    if (!birthPlace.trim()) {
      setValidationError(t("Please enter your place of birth."));
      return { valid: false, signatureVal: "" };
    }
    if (!profession.trim()) {
      setValidationError(t("Please enter your profession."));
      return { valid: false, signatureVal: "" };
    }
    if (!streetAddress.trim()) {
      setValidationError(t("Please enter your street address."));
      return { valid: false, signatureVal: "" };
    }
    if (!postalCode.trim()) {
      setValidationError(t("Please enter your postal code."));
      return { valid: false, signatureVal: "" };
    }
    if (!city.trim()) {
      setValidationError(t("Please enter your city."));
      return { valid: false, signatureVal: "" };
    }
    if (!stateInput.trim()) {
      setValidationError(t("Please enter your state / province / region."));
      return { valid: false, signatureVal: "" };
    }
    if (!consentLocked) {
      setValidationError(t("⚠️ You must tick the agreement checkbox to proceed. Please read and accept the subscription terms before continuing."));
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
    const ibanRegex = /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/;
    if (!ibanRegex.test(cleanedIban)) {
      setValidationError(t("Please enter a valid IBAN (e.g. DE89 3704 0044 0532 0130 00)."));
      return;
    }

    const fullPhone = phoneCountryCode + " " + phone.trim();
    startSepaPayment(signatureVal, fullPhone);
  };

  const startSepaPayment = (signatureVal: string, fullPhone: string) => {
    setIsSubmitting(true);
    const cleanedIban = iban.replace(/\s+/g, "");
    const masked = cleanedIban.slice(0, 4) + " **** **** **** " + cleanedIban.slice(-4);

    const saveData = {
      contractId,
      fullName: fullName.trim(),
      email: email.trim(),
      phone: fullPhone,
      birthDate: birthDate,
      birthPlace: birthPlace.trim(),
      profession: profession.trim(),
      streetAddress: streetAddress.trim(),
      postalCode: postalCode.trim(),
      city: city.trim(),
      state: stateInput.trim(),
      country: countryInput,
      paymentMethod: "sepa" as const,
      maskedIban: masked,
      signatureType,
      signatureData: signatureVal,
    };

    if (stripeEnabled) {
      saveSubscription({ data: { ...saveData, status: "pending" } })
        .then(() => {
          const successUrl = `${window.location.origin}/checkout?success=true`;
          const cancelUrl = `${window.location.origin}/checkout?cancelled=true`;
          return createStripeSession({
            data: {
              ...saveData,
              successUrl,
              cancelUrl,
            }
          });
        })
        .then((res) => {
          if (res.sessionUrl) {
            window.location.href = res.sessionUrl;
          } else {
            throw new Error("No Stripe checkout URL returned.");
          }
        })
        .catch((error) => {
          console.error("Stripe Checkout Session creation error:", error);
          setIsSubmitting(false);
          setValidationError(t("Failed to initiate Stripe Checkout. Please try again."));
        });
    } else {
      saveSubscription({ data: { ...saveData, status: "active" } })
        .then(async (saved) => {
          const hashInput = `${saved.contractId}|${saved.fullName}|${saved.email}|${saved.createdAt}`;
          const contractHash = await generateContractHash(hashInput);
          setIsSubmitting(false);
          setCheckoutData({
            ...saveData,
            timestamp: saved.createdAt || new Date().toISOString(),
            contractHash,
          });
          setIsSuccess(true);
        })
        .catch((error) => {
          console.error("SEPA save error (simulation):", error);
          setIsSubmitting(false);
          setValidationError(t("An error occurred during submission. Please try again."));
        });
    }
  };

  const handleWalletClick = () => {
    setValidationError("");
    const { valid, signatureVal } = validateForm();
    if (!valid) return;

    const fullPhone = phoneCountryCode + " " + phone.trim();
    startWalletPayment(signatureVal, fullPhone);
  };

  const startWalletPayment = (signatureVal: string, fullPhone: string) => {
    const saveData = {
      contractId,
      fullName: fullName.trim(),
      email: email.trim(),
      phone: fullPhone,
      birthDate: birthDate,
      birthPlace: birthPlace.trim(),
      profession: profession.trim(),
      streetAddress: streetAddress.trim(),
      postalCode: postalCode.trim(),
      city: city.trim(),
      state: stateInput.trim(),
      country: countryInput,
      paymentMethod: "wallet" as const,
      signatureType,
      signatureData: signatureVal,
    };

    setIsSubmitting(true);

    saveSubscription({ data: { ...saveData, status: "pending" } })
      .then(() => {
        // Store pending contract details in localStorage to allow pre-loading on /contract page
        localStorage.setItem("lensly_pending_contract", JSON.stringify({
          ...saveData,
          signedAt: new Date().toISOString()
        }));

        if (stripeEnabled) {
          // Production Mode: Redirect to Stripe Payment Link
          const stripeLink = `https://buy.stripe.com/bJe8wRbYMggBa4h0om7EQ01?prefilled_email=${encodeURIComponent(email.trim())}&client_reference_id=${contractId}`;
          window.location.href = stripeLink;
        } else {
          // Simulation/Local Mode: Redirect directly to /contract page to simulate completed payment
          setTimeout(() => {
            window.location.href = `/contract?success=true&contractId=${contractId}&email=${encodeURIComponent(email.trim())}`;
          }, 1000);
        }
      })
      .catch((error) => {
        console.error("Failed to save subscription:", error);
        setIsSubmitting(false);
        setValidationError(t("An error occurred. Please try again."));
      });
  };



  const handleDownloadPDF = async () => {
    if (!checkoutData) return;
    setDownloadingPDF(true);
    const firstName = checkoutData.fullName.trim().split(" ")[0].toLowerCase();
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
      {isVerifyingStripe && (
        <div className="fixed inset-0 z-[100] bg-background/85 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-sm">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
            <h3 className="font-display font-semibold text-lg text-foreground">
              {t("Verifying payment with Stripe...")}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("We are validating your secure checkout session and securing your signed vision contract. This will only take a moment.")}
            </p>
          </div>
        </div>
      )}

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
                      <span className="text-foreground font-semibold block mt-0.5">
                        {checkoutData.fullName}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-semibold text-muted-foreground tracking-wider block">
                        {t("Email Address")}
                      </span>
                      <span className="text-foreground block mt-0.5">{checkoutData.email}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-semibold text-muted-foreground tracking-wider block">
                        {t("Phone Number")}
                      </span>
                      <span className="text-foreground block mt-0.5">{checkoutData.phone}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-semibold text-muted-foreground tracking-wider block">
                        {t("Birth Date")}
                      </span>
                      <span className="text-foreground block mt-0.5">{checkoutData.birthDate}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-semibold text-muted-foreground tracking-wider block">
                        {t("Place of Birth")}
                      </span>
                      <span className="text-foreground block mt-0.5">
                        {checkoutData.birthPlace}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-semibold text-muted-foreground tracking-wider block">
                        {t("Profession")}
                      </span>
                      <span className="text-foreground block mt-0.5">
                        {checkoutData.profession}
                      </span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-[9px] uppercase font-semibold text-muted-foreground tracking-wider block">
                        {t("Delivery Address")}
                      </span>
                      <span className="text-foreground block mt-0.5">
                        {checkoutData.streetAddress}, {checkoutData.postalCode} {checkoutData.city}, {checkoutData.state || ""} ({checkoutData.country || ""})
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-semibold text-muted-foreground tracking-wider block">
                        {t("Payment Method")}
                      </span>
                      <span className="text-foreground block mt-0.5">
                        {checkoutData.paymentMethod === "sepa"
                          ? `${t("SEPA Lastschrift")} (${checkoutData.maskedIban})`
                          : t("Apple Pay / Google Pay")}
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
                        "This agreement is entered into between Sikder LLC, Germany (the Provider) and the subscriber (the Customer) whose signature is attached hereto.",
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
                      <span>SHA-256: {checkoutData.contractHash.slice(0, 16).toUpperCase()}...</span>
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
                        {t("Download your signed contract below. Email confirmation will follow shortly.")}
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
                    onClick={handleDownloadPDF}
                    disabled={downloadingPDF}
                    className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {downloadingPDF ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    {downloadingPDF ? t("Downloading...") : t("Download Signed Contract (PDF)")}
                  </button>
                  <Link
                    to="/"
                    className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/95 shadow-sm"
                  >
                    {t("Return Home")}
                  </Link>

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
                      <p>{t("This agreement is concluded between:")}</p>
                      <p className="font-semibold">{t("Sikder LLC, Germany")}</p>
                      <p>{t('(hereinafter referred to as "Lensly" or "the Provider")')}</p>
                      <p className="mt-2">{t("and")}</p>
                      <p>{t('the subscriber whose personal information, payment details, and electronic acceptance are recorded during the checkout process (hereinafter referred to as "the Customer").')}</p>
                      <p className="mt-2">{t("By completing the checkout process and confirming payment, the Customer accepts this agreement electronically.")}</p>
                    </section>

                    <section className="space-y-1">
                      <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">
                        {t("2. Lensly Care Subscription")}
                      </h5>
                      <p>{t("Lensly Care is a vision subscription service providing customers with access to custom-made prescription eyewear benefits.")}</p>
                      <p className="mt-2">{t("The subscription includes:")}</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>{t("One (1) complete custom-made prescription glasses pair per contract year.")}</li>
                        <li>{t("Up to three (3) approved replacement services per contract year according to the replacement conditions described in this agreement.")}</li>
                      </ul>
                    </section>

                    <section className="space-y-1">
                      <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">
                        {t("3. Lensly Delivery Commitment")}
                      </h5>
                      <p>{t("Once the Lensly Care subscription agreement has been successfully established and the Customer has provided all required information, including valid prescription details, fitting information, and frame selection approval, Lensly is obligated to provide the included custom-made prescription eyewear benefit according to the terms of this agreement.")}</p>
                      <p className="mt-2">{t("Lensly will make reasonable efforts to complete production and delivery within the stated timeframe.")}</p>
                      <p className="mt-2">{t("Delays caused by missing customer information, supplier availability, laboratory processing times, shipping conditions, or circumstances outside Lensly's reasonable control do not remove Lensly's obligation to fulfil the agreed eyewear benefit.")}</p>
                      <p className="mt-2">{t("Lensly will continue to work toward completion and delivery of the Customer's included eyewear benefit.")}</p>
                    </section>

                    <section className="space-y-1">
                      <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">
                        {t("4. Minimum Contract Term and Renewal")}
                      </h5>
                      <p>{t("The Lensly Care subscription has a minimum contract term of twelve (12) months from the activation date.")}</p>
                      <p className="mt-2">{t("The contract year begins on the date of subscription activation and continues for twelve (12) consecutive months.")}</p>
                      <p className="mt-2">{t("After the initial twelve-month period, the subscription automatically continues on a monthly basis and may be cancelled with thirty (30) days' notice.")}</p>
                      <p className="mt-2">{t("The Customer acknowledges that the minimum financial commitment during the initial contract term is €348 (€29 × 12 months).")}</p>
                    </section>

                    <section className="space-y-1">
                      <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">
                        {t("5. Subscription Fee and Payment")}
                      </h5>
                      <p>{t("The subscription fee is €29 per month.")}</p>
                      <p className="mt-2">{t("Payments are collected monthly in advance through approved payment providers, including Stripe-supported payment methods.")}</p>
                      <p className="mt-2">{t("The Customer is responsible for maintaining valid payment information.")}</p>
                      <p className="mt-2">{t("If a payment cannot be processed, Lensly will notify the Customer and provide an opportunity to update payment information or complete payment.")}</p>
                      <p className="mt-2">{t("The first failed payment attempt will not result in an additional charge.")}</p>
                      <p className="mt-2">{t("For repeated failed payment attempts caused by customer-related payment issues, Lensly may apply a reasonable processing fee of €5 per failed payment attempt after notifying the Customer.")}</p>
                    </section>

                    <section className="space-y-1">
                      <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">
                        {t("6. First Glasses Production Process")}
                      </h5>
                      <p>{t("After activation, the Customer must provide all required information, including valid prescription details, fitting information, and selected frame information.")}</p>
                      <p className="mt-2">{t("The Customer may select a preferred frame and provide frame details or images through approved Lensly communication channels.")}</p>
                      <p className="mt-2">{t("Lensly will confirm the selected frame before production begins.")}</p>
                      <p className="mt-2">{t("Custom lens processing will begin only after the required information and approvals have been received.")}</p>
                      <p className="mt-2">{t("Because the first glasses are custom-made according to the Customer's individual prescription, measurements, and selected frame, the Customer may request changes before final confirmation of the first glasses order.")}</p>
                      <p className="mt-2">{t("Once the Customer has confirmed the first glasses order through an approved Lensly communication channel, including email or another official communication method, the custom glasses order cannot be cancelled or changed due to the individual nature of the product.")}</p>
                      <p className="mt-2">{t("Lensly will proceed with fulfilling the confirmed eyewear benefit according to the details approved by the Customer.")}</p>
                    </section>

                    <section className="space-y-1">
                      <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">
                        {t("7. Customer Responsibilities")}
                      </h5>
                      <p>{t("The Customer is responsible for providing accurate and complete information required for production.")}</p>
                      <p className="mt-2">{t("Lensly manufactures prescription eyewear according to the information and specifications provided by the Customer.")}</p>
                      <p className="mt-2">{t("Delays caused by missing, incomplete, or incorrect customer information may delay production.")}</p>
                    </section>

                    <section className="space-y-1">
                      <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">
                        {t("8. Replacement Coverage")}
                      </h5>
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
                      <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">
                        {t("9. Frame and Lens Adjustments")}
                      </h5>
                      <p>{t("If the Customer provides a valid reason, including incorrect prescription compared with the submitted prescription, incorrect lens specifications, or confirmed fitting or frame-related production issues, Lensly will replace the affected lenses free of charge after verification.")}</p>
                      <p className="mt-2">{t("Issues caused by incorrect customer-provided information or incorrect customer selection may not qualify for free replacement.")}</p>
                    </section>

                    <section className="space-y-1">
                      <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">
                        {t("10. Delivery and Production Time")}
                      </h5>
                      <p>{t("Lensly will make reasonable efforts to process and deliver custom-made eyewear within approximately 14 to 21 days after receiving all required customer information, including valid prescription details, fitting information, and final frame approval.")}</p>
                      <p className="mt-2">{t("Because prescription eyewear is individually manufactured, delivery times may vary depending on production requirements, supplier availability, laboratory processing times, and shipping conditions.")}</p>
                      <p className="mt-2">{t("Lensly will keep the Customer informed in case of significant delays.")}</p>
                    </section>

                    <section className="space-y-1">
                      <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">
                        {t("11. Laboratory and Supplier Processing")}
                      </h5>
                      <p>{t("Lensly works with selected optical suppliers and laboratories for the production and adjustment of prescription eyewear.")}</p>
                      <p className="mt-2">{t("Production and delivery may depend on third-party availability and processing times.")}</p>
                      <p className="mt-2">{t("Lensly will make reasonable efforts to source the selected frame requested by the Customer through available supplier and retail channels to complete the eyewear order according to the Customer's selection.")}</p>
                    </section>

                    <section className="space-y-1">
                      <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">
                        {t("12. Ownership of Eyewear")}
                      </h5>
                      <p>{t("After successful delivery of the completed eyewear, ownership of the frame and lenses transfers to the Customer.")}</p>
                    </section>

                    <section className="space-y-1">
                      <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">
                        {t("13. Early Cancellation")}
                      </h5>
                      <p>{t("The Lensly Care subscription has a minimum contract term of twelve (12) months.")}</p>
                      <p className="mt-2">{t("Early cancellation during this period is generally not available.")}</p>
                      <p className="mt-2">{t("However, Lensly may review exceptional circumstances and consider early cancellation requests on a case-by-case basis.")}</p>
                    </section>

                    <section className="space-y-1">
                      <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">
                        {t("14. Payment Suspension")}
                      </h5>
                      <p>{t("If subscription payments remain unpaid, Lensly may temporarily suspend benefits that require active payment, including future production and replacement services, until outstanding payments are resolved.")}</p>
                    </section>

                    <section className="space-y-1">
                      <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">
                        {t("15. Prescription Eyewear Information")}
                      </h5>
                      <p>{t("Lensly provides custom-made prescription eyewear through selected optical suppliers and laboratories.")}</p>
                      <p className="mt-2">{t("The eyewear is produced according to applicable requirements for prescription optical products.")}</p>
                    </section>

                    <section className="space-y-1 border-t border-border/50 pt-2 bg-primary/[0.01] p-2 rounded">
                      <h5 className="font-bold text-primary text-[10px] uppercase tracking-wider">
                        {t("16. Custom-Made Products and Withdrawal Rights")}
                      </h5>
                      <p className="text-[11px] italic">{t("Prescription glasses manufactured according to individual customer specifications may qualify as custom-made goods under applicable German consumer law.")}</p>
                      <p className="mt-2 text-[11px] italic">{t("The Customer acknowledges that individual custom-made lens processing may affect withdrawal rights according to applicable legal provisions.")}</p>
                    </section>

                    <section className="space-y-1">
                      <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">
                        {t("17. Customer Information and Privacy")}
                      </h5>
                      <p>{t("Customer information is processed according to applicable data protection laws, including GDPR requirements.")}</p>
                      <p className="mt-2">{t("Personal information is used for subscription management, eyewear production, delivery, customer support, and legal obligations.")}</p>
                    </section>

                    <section className="space-y-1">
                      <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">
                        {t("18. Customer Support and Communication")}
                      </h5>
                      <p>{t("Requests regarding replacements, delivery, subscription changes, and cancellations should be submitted through official Lensly communication channels.")}</p>
                    </section>

                    <section className="space-y-1 border-t border-border/50 pt-3">
                      <h5 className="font-bold text-foreground text-[10px] uppercase tracking-wider">
                        {t("Customer Acceptance")}
                      </h5>
                      <p>{t("By completing payment and accepting this agreement, the Customer confirms that they have read and accepted the Lensly Care Vision Subscription Agreement.")}</p>
                      <p className="mt-2 font-semibold text-foreground">{t("Contract Reference: LNS-2026-XXXXX")}</p>
                      <p className="mt-1">{t("Customer acceptance is recorded electronically during checkout.")}</p>
                    </section>
                  </div>

                  <div className="p-5 bg-muted/20">
                    {/* Compliance text warning */}
                    <div className="rounded-lg border border-primary/20 bg-primary/[0.02] p-3 text-[11px] text-foreground leading-relaxed font-medium mb-4">
                      <span className="font-bold text-primary block text-[9px] uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5" />
                        {t("Contract Information (German Compliance)")}
                      </span>
                      {t(
                        "Minimum term 12 months, billing €29 monthly, automatic renewal with monthly cancellation thereafter.",
                      )}
                    </div>

                    {/* Mandantory Signature Consent Checkbox */}
                    <label className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer select-none ${consentLocked
                        ? "bg-primary/[0.04] border-primary/45 shadow-xs"
                        : "bg-card border-border/80 hover:bg-muted/40 hover:border-border"
                      }`}>
                      <input
                        type="checkbox"
                        checked={consentLocked}
                        onChange={(e) => setConsentLocked(e.target.checked)}
                        className="mt-0.5 rounded border-border/80 text-primary focus:ring-primary focus:ring-offset-0 focus:outline-none accent-primary w-5.5 h-5.5 cursor-pointer shrink-0"
                      />
                      <span className="text-xs text-foreground/90 font-medium leading-relaxed transition-colors">
                        {t("I agree to the")}{" "}
                        <a href="/agb" target="_blank" className="text-primary hover:underline font-bold underline-offset-2">{t("Terms of Service (AGB)")}</a>
                        {t(", the 12-month contract lock-in, and the custom-lens refund rules.")}{" "}
                        <span className="text-destructive font-extrabold">*</span>
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
                          if (!typedSignature) {
                            setTypedSignature(e.target.value);
                          }
                        }}
                        placeholder="Your name"
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
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@example.com"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                        {t("Phone Number")}
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={phoneCountryCode}
                          onChange={(e) => setPhoneCountryCode(e.target.value)}
                          className="rounded-lg border border-border bg-background px-2 py-2 text-xs focus:border-primary focus:outline-none transition-colors w-24 cursor-pointer shrink-0"
                        >
                          <option value="+49">🇩🇪 +49</option>
                          <option value="+43">🇦🇹 +43</option>
                          <option value="+41">🇨🇭 +41</option>
                          <option value="+33">🇫🇷 +33</option>
                          <option value="+44">🇬🇧 +44</option>
                          <option value="+34">🇪🇸 +34</option>
                          <option value="+39">🇮🇹 +39</option>
                          <option value="+1">🇺🇸 +1</option>
                        </select>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                        {t("Birth Date")}
                      </label>
                      <input
                        type="date"
                        required
                        value={birthDate}
                        max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                        {t("Place of Birth")}
                      </label>
                      <input
                        type="text"
                        required
                        value={birthPlace}
                        onChange={(e) => setBirthPlace(e.target.value)}
                        placeholder="e.g. Berlin"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                        {t("Profession")}
                      </label>
                      <input
                        type="text"
                        required
                        value={profession}
                        onChange={(e) => setProfession(e.target.value)}
                        placeholder="e.g. Software Engineer"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Delivery Address */}
                  <div className="border-t border-border/60 pt-4 mt-2">
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      {t("Delivery Address")}
                    </label>
                    <div className="grid gap-3">
                      <div>
                        <input
                          type="text"
                          required
                          value={streetAddress}
                          onChange={(e) => setStreetAddress(e.target.value)}
                          placeholder="Street & house number"
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none transition-colors"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          required
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          placeholder="Postal code"
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none transition-colors"
                        />
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="City"
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none transition-colors"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          required
                          value={stateInput}
                          onChange={(e) => setStateInput(e.target.value)}
                          placeholder="State / Region"
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none transition-colors"
                        />
                        <select
                          value={countryInput}
                          onChange={(e) => setCountryInput(e.target.value)}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none transition-colors cursor-pointer"
                        >
                          <option value="DE">{t("Germany")}</option>
                          <option value="AT">{t("Austria")}</option>
                          <option value="CH">{t("Switzerland")}</option>
                          <option value="FR">{t("France")}</option>
                          <option value="GB">{t("United Kingdom")}</option>
                          <option value="US">{t("United States")}</option>
                          <option value="ES">{t("Spain")}</option>
                          <option value="IT">{t("Italy")}</option>
                        </select>
                      </div>
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
                          className={`px-2 py-0.5 text-[9px] font-medium rounded transition-all cursor-pointer ${signatureType === "draw"
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
                          className={`px-2 py-0.5 text-[9px] font-medium rounded transition-all cursor-pointer ${signatureType === "type"
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
                            width={800}
                            height={240}
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

                       <div className="space-y-4 pt-4">
                     {/* Compliance Info Banner */}
                    <div className="bg-muted/50 rounded-xl p-3.5 border border-border/80 text-[11px] sm:text-xs text-muted-foreground leading-relaxed text-left max-w-sm mx-auto">
                      <p className="font-semibold text-foreground mb-1 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                        {t("Important Subscription Information")}
                      </p>
                      <p className="text-[10.5px] leading-normal opacity-90">
                        {t("By proceeding, you agree to a minimum contract duration of 12 months at €29.00/month. Thereafter, the subscription automatically renews on a monthly basis, cancelable at any time with 30 days notice. Cancellation can be requested easily online.")}
                      </p>
                    </div>

                    {/* Stripe button with full form validation */}
                    <button
                      type="button"
                      className="w-full relative overflow-hidden rounded-xl py-4 text-center text-[15px] font-bold text-white shadow-[0_4px_20px_rgba(0,151,178,0.45)] transition-all hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2.5 cursor-pointer bg-[#0097b2]"
                      style={{ letterSpacing: "0.01em" }}
                      onClick={() => {
                        // --- Full form validation before Stripe redirect ---
                        if (!fullName.trim()) {
                          setValidationError(t("Please enter your full name."));
                          return;
                        }
                        if (!email.trim() || !email.includes("@")) {
                          setValidationError(t("Please enter a valid email address."));
                          return;
                        }
                        if (!phone.trim() || phone.trim().length < 6) {
                          setValidationError(t("Please enter a valid phone number."));
                          return;
                        }
                        if (!birthDate) {
                          setValidationError(t("Please enter your date of birth."));
                          return;
                        }
                        if (!birthPlace.trim()) {
                          setValidationError(t("Please enter your place of birth."));
                          return;
                        }
                        if (!profession.trim()) {
                          setValidationError(t("Please enter your profession."));
                          return;
                        }
                        if (!streetAddress.trim()) {
                          setValidationError(t("Please enter your street address."));
                          return;
                        }
                        if (!postalCode.trim()) {
                          setValidationError(t("Please enter your postal code."));
                          return;
                        }
                        if (!city.trim()) {
                          setValidationError(t("Please enter your city."));
                          return;
                        }
                        if (!consentLocked) {
                          setValidationError(t("⚠️ You must tick the agreement checkbox to proceed. Please read and accept the subscription terms before continuing."));
                          // Scroll to checkbox to make it visible
                          const checkboxElement = document.querySelector('input[type="checkbox"]');
                          if (checkboxElement) {
                            checkboxElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            // Add shake animation to checkbox container
                            const labelElement = checkboxElement.closest('label');
                            if (labelElement) {
                              labelElement.classList.add('animate-shake');
                              setTimeout(() => labelElement.classList.remove('animate-shake'), 500);
                            }
                          }
                          return;
                        }
                        // All good — save to localStorage and redirect
                        const pendingData = {
                          contractId,
                          fullName: fullName.trim(),
                          email: email.trim(),
                          phone: `${phoneCountryCode}${phone.trim()}`,
                          birthDate,
                          birthPlace: birthPlace.trim(),
                          profession: profession.trim(),
                          streetAddress: streetAddress.trim(),
                          postalCode: postalCode.trim(),
                          city: city.trim(),
                          state: stateInput.trim(),
                          country: countryInput,
                          paymentMethod: "card",
                          savedAt: new Date().toISOString(),
                        };
                        localStorage.setItem("lensly_pending_contract", JSON.stringify(pendingData));
                        const stripeUrl = `https://buy.stripe.com/bJe8wRbYMggBa4h0om7EQ01?prefilled_email=${encodeURIComponent(email.trim())}`;
                        window.location.href = stripeUrl;
                      }}
                    >
                      {/* Subtle shimmer effect */}
                      <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-700" />
                      <ShieldCheck className="w-5 h-5 relative" />
                      <span className="relative tracking-wide">{t("Pay & Activate Lensly Care")}</span>
                    </button>

                    <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground max-w-xs mx-auto">
                      <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
                      {t("256-bit encrypted. After payment, your contract is ready to download instantly.")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      <Footer />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-[9999] animate-in slide-in-from-top-3 fade-in duration-250 w-[320px]">
          <div className={`flex items-center gap-3 bg-white dark:bg-zinc-900 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.18)] overflow-hidden border border-zinc-100 dark:border-zinc-800`}>
            {/* Colored left bar */}
            <div className={`w-1.5 self-stretch shrink-0 ${toast.type === "error" ? "bg-red-500" : "bg-emerald-500"}`} />
            {/* Icon */}
            <div className={`shrink-0 rounded-full p-1.5 ${toast.type === "error" ? "bg-red-50 dark:bg-red-500/10" : "bg-emerald-50 dark:bg-emerald-500/10"}`}>
              {toast.type === "error"
                ? <AlertCircle className="w-4 h-4 text-red-500" />
                : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            </div>
            {/* Message */}
            <p className="flex-1 py-3.5 pr-1 text-[13px] font-medium text-zinc-800 dark:text-zinc-100 leading-snug">
              {toast.message}
            </p>
            {/* Close */}
            <button
              onClick={() => setToast(null)}
              className="mr-3 shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
