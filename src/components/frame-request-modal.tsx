import React, { useState, useRef } from "react";
import { useLanguage } from "../lib/i18n";
import { submitFrameRequest } from "../lib/api/subscriptions.functions";
import { trackEvent } from "../lib/analytics";
import {
  X,
  UploadCloud,
  Link as LinkIcon,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  ShieldCheck,
  Eye,
  ArrowRight,
  Info,
  ExternalLink,
} from "lucide-react";

interface FrameRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (requestId: string) => void;
}

export function FrameRequestModal({ isOpen, onClose, onSuccess }: FrameRequestModalProps) {
  const { t } = useLanguage();

  // Form step: "input" | "prescription" | "confirm"
  const [step, setStep] = useState<"input" | "prescription" | "confirm">("input");

  // Frame Discovery Inputs
  const [inputMode, setInputMode] = useState<"upload" | "url">("upload");
  const [frameUrl, setFrameUrl] = useState("");
  const [frameImageData, setFrameImageData] = useState<string | null>(null);
  const [frameImageName, setFrameImageName] = useState<string | null>(null);
  const [frameBrand, setFrameBrand] = useState("");
  const [frameModel, setFrameModel] = useState("");
  const [notes, setNotes] = useState("");

  // Customer Contact
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Prescription Inputs
  const [prescriptionType, setPrescriptionType] = useState<"file" | "manual" | "later">("file");
  const [prescriptionFileData, setPrescriptionFileData] = useState<string | null>(null);
  const [prescriptionFileName, setPrescriptionFileName] = useState<string | null>(null);

  // Manual Diopter Values
  const [sphR, setSphR] = useState("");
  const [sphL, setSphL] = useState("");
  const [cylR, setCylR] = useState("");
  const [cylL, setCylL] = useState("");
  const [axisR, setAxisR] = useState("");
  const [axisL, setAxisL] = useState("");
  const [pd, setPd] = useState("");

  // Status & Validation
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [createdRequestId, setCreatedRequestId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Refs
  const frameFileInputRef = useRef<HTMLInputElement | null>(null);
  const prescriptionFileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFrameFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File validation: JPG, PNG, WEBP, max 10MB
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setErrorMessage(t("Please select a valid image file (JPG, PNG, or WEBP)."));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage(t("File size exceeds 10MB limit. Please upload a smaller image."));
      return;
    }

    setErrorMessage("");
    trackEvent("frame_upload_started", { fileType: file.type, fileSize: file.size });

    const reader = new FileReader();
    reader.onload = () => {
      setFrameImageData(reader.result as string);
      setFrameImageName(file.name);
      trackEvent("frame_upload_completed", { fileType: file.type });
    };
    reader.readAsDataURL(file);
  };

  const handlePrescriptionFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File validation: PDF, JPG, PNG, WEBP, max 10MB
    const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setErrorMessage(t("Please select a valid prescription file (PDF, JPG, PNG, or WEBP)."));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage(t("Prescription file size exceeds 10MB limit."));
      return;
    }

    setErrorMessage("");
    const reader = new FileReader();
    reader.onload = () => {
      setPrescriptionFileData(reader.result as string);
      setPrescriptionFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleNextToPrescription = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (inputMode === "url" && !frameUrl.trim()) {
      setErrorMessage(t("Please enter the frame URL or switch to image upload."));
      return;
    }

    if (inputMode === "upload" && !frameImageData) {
      setErrorMessage(t("Please upload a photo or screenshot of the frame, or enter a URL."));
      return;
    }

    if (!fullName.trim()) {
      setErrorMessage(t("Please enter your name so we know how to address you."));
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setErrorMessage(t("Please enter a valid email address for your review report."));
      return;
    }

    trackEvent("prescription_started");
    setStep("prescription");
  };

  const handleSubmitFinal = async () => {
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const res = await submitFrameRequest({
        data: {
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          frameUrl: frameUrl.trim() || undefined,
          frameImageData: frameImageData || undefined,
          frameBrand: frameBrand.trim() || undefined,
          frameModel: frameModel.trim() || undefined,
          notes: notes.trim() || undefined,
          prescriptionType: prescriptionType === "later" ? "none" : prescriptionType,
          prescriptionSphR: sphR.trim() || undefined,
          prescriptionSphL: sphL.trim() || undefined,
          prescriptionCylR: cylR.trim() || undefined,
          prescriptionCylL: cylL.trim() || undefined,
          prescriptionAxisR: axisR.trim() || undefined,
          prescriptionAxisL: axisL.trim() || undefined,
          prescriptionPd: pd.trim() || undefined,
          prescriptionFileData: prescriptionFileData || undefined,
        },
      });

      if (res.success && res.requestId) {
        setCreatedRequestId(res.requestId);
        trackEvent("prescription_submitted", {
          frameUrl: frameUrl || undefined,
          prescriptionType,
        });
        setStep("confirm");
        if (onSuccess) {
          onSuccess(res.requestId);
        }
      } else {
        setErrorMessage(t("Failed to submit frame request. Please try again."));
      }
    } catch (err) {
      console.error("Error submitting frame request:", err);
      setErrorMessage(t("An unexpected error occurred. Please check your connection and retry."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTrackLive = () => {
    onClose();
    const el = document.getElementById("tracking");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
    if (createdRequestId && typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("lensly_track_request", { detail: { requestId: createdRequestId } })
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-xl rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-200 z-10 text-left max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/60">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-primary/10 text-primary font-semibold">
              <Eye className="w-3 h-3" />
              <span>{t("Pre-Payment Verification")}</span>
            </div>
            <h2 className="font-display font-bold text-lg sm:text-xl text-foreground mt-1">
              {step === "confirm" ? t("Request Submitted Successfully") : t("Send Your Frame to Lensly")}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {step === "confirm"
                ? t("Our optical team is now reviewing your request.")
                : t("Submit your frame and prescription first. We check feasibility before you pay.")}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer shrink-0"
            aria-label={t("Close modal")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 pr-1 py-4">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Frame Discovery & Customer Info */}
          {step === "input" && (
            <form onSubmit={handleNextToPrescription} className="space-y-4">
              {/* Tabs: Upload Screenshot vs Paste URL */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-2">
                  {t("How would you like to share your frame?")}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setInputMode("upload")}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      inputMode === "upload"
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <UploadCloud className="w-4 h-4" />
                    {t("Upload Screenshot / Photo")}
                  </button>

                  <button
                    type="button"
                    onClick={() => setInputMode("url")}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      inputMode === "url"
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <LinkIcon className="w-4 h-4" />
                    {t("Paste Store Link / URL")}
                  </button>
                </div>
              </div>

              {/* Mode: Upload Screenshot */}
              {inputMode === "upload" && (
                <div>
                  <input
                    type="file"
                    ref={frameFileInputRef}
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFrameFileUpload}
                  />

                  {frameImageData ? (
                    <div className="p-3 rounded-xl border border-primary/30 bg-primary/5 flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={frameImageData}
                          alt="Uploaded frame preview"
                          className="w-12 h-12 rounded-lg object-cover border border-border shrink-0"
                        />
                        <div className="truncate">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {frameImageName || t("Frame Image")}
                          </p>
                          <p className="text-[10px] text-emerald-600 font-medium">
                            {t("Ready for lab review")}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setFrameImageData(null);
                          setFrameImageName(null);
                          if (frameFileInputRef.current) frameFileInputRef.current.value = "";
                        }}
                        className="text-xs text-muted-foreground hover:text-destructive p-1 cursor-pointer"
                      >
                        {t("Remove")}
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => frameFileInputRef.current?.click()}
                      className="border-2 border-dashed border-border hover:border-primary/50 bg-muted/20 hover:bg-primary/5 rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center"
                    >
                      <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
                      <p className="text-xs font-semibold text-foreground">
                        {t("Click to upload frame screenshot or photo")}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {t("JPG, PNG, or WEBP (Max 10MB)")}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Mode: URL Input */}
              {inputMode === "url" && (
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    {t("Frame product link")}
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/frame-model-123"
                    value={frameUrl}
                    onChange={(e) => setFrameUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {t("Paste any link from any online store or brand page.")}
                  </p>
                </div>
              )}

              {/* Optional Brand & Model */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    {t("Brand (optional)")}
                  </label>
                  <input
                    type="text"
                    placeholder={t("e.g. Ray-Ban, Ace & Tate, Tom Ford")}
                    value={frameBrand}
                    onChange={(e) => setFrameBrand(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    {t("Model name or number (optional)")}
                  </label>
                  <input
                    type="text"
                    placeholder={t("e.g. Clubmaster 51mm, Aviator")}
                    value={frameModel}
                    onChange={(e) => setFrameModel(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Customer Contact Details */}
              <div className="pt-2 border-t border-border/40 space-y-3">
                <p className="text-xs font-semibold text-foreground">{t("Where should we send your review?")}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      {t("Full Name *")}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={t("e.g. Max Mustermann")}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      {t("Email Address *")}
                    </label>
                    <input
                      type="email"
                      required
                      placeholder={t("e.g. max@example.de")}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    {t("Phone number (optional, for WhatsApp / SMS updates)")}
                  </label>
                  <input
                    type="tel"
                    placeholder="+49 170 1234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    {t("Any notes or special requirements?")}
                  </label>
                  <textarea
                    rows={2}
                    placeholder={t("e.g. I have a high cylinder prescription, or prefer ultra-thin 1.67 lenses...")}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  />
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md hover:bg-primary/95 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{t("Continue to Prescription Details")}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Prescription Flow */}
          {step === "prescription" && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-muted/40 border border-border/80 text-xs">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  {t("Submit your prescription first. We'll review it before you pay.")}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {t("Our lab opticians verify diopters, cylinder, and pupil distance compatibility with the requested frame. You only proceed to subscription after full verification.")}
                </p>
              </div>

              {/* Prescription Method Tabs */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-2">
                  {t("Prescription input method:")}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPrescriptionType("file")}
                    className={`py-2 px-2 text-center rounded-lg border text-xs font-medium transition cursor-pointer ${
                      prescriptionType === "file"
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {t("Upload Document")}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrescriptionType("manual")}
                    className={`py-2 px-2 text-center rounded-lg border text-xs font-medium transition cursor-pointer ${
                      prescriptionType === "manual"
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {t("Enter Values Manually")}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrescriptionType("later")}
                    className={`py-2 px-2 text-center rounded-lg border text-xs font-medium transition cursor-pointer ${
                      prescriptionType === "later"
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {t("Send Later via Email")}
                  </button>
                </div>
              </div>

              {/* File Upload Mode */}
              {prescriptionType === "file" && (
                <div>
                  <input
                    type="file"
                    ref={prescriptionFileInputRef}
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handlePrescriptionFileUpload}
                  />

                  {prescriptionFileData ? (
                    <div className="p-3 rounded-xl border border-primary/30 bg-primary/5 flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="w-8 h-8 text-primary shrink-0" />
                        <div className="truncate">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {prescriptionFileName || t("Prescription Document")}
                          </p>
                          <p className="text-[10px] text-emerald-600 font-medium">
                            {t("Ready for lab verification")}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setPrescriptionFileData(null);
                          setPrescriptionFileName(null);
                          if (prescriptionFileInputRef.current)
                            prescriptionFileInputRef.current.value = "";
                        }}
                        className="text-xs text-muted-foreground hover:text-destructive p-1 cursor-pointer"
                      >
                        {t("Remove")}
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => prescriptionFileInputRef.current?.click()}
                      className="border-2 border-dashed border-border hover:border-primary/50 bg-muted/20 hover:bg-primary/5 rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center"
                    >
                      <FileText className="w-8 h-8 text-muted-foreground mb-2" />
                      <p className="text-xs font-semibold text-foreground">
                        {t("Upload optical pass, doctor prescription, or lab sheet")}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {t("PDF, JPG, PNG, or WEBP (Max 10MB)")}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Manual Entry Mode */}
              {prescriptionType === "manual" && (
                <div className="space-y-3 p-3.5 rounded-xl border border-border/80 bg-muted/20">
                  <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-semibold text-muted-foreground uppercase">
                    <div>{t("Eye")}</div>
                    <div>{t("SPH (Sphere)")}</div>
                    <div>{t("CYL (Cylinder)")}</div>
                    <div>{t("AXIS (°)")}</div>
                  </div>

                  {/* Right Eye */}
                  <div className="grid grid-cols-4 gap-2 items-center">
                    <div className="text-xs font-semibold text-foreground text-center">{t("Right (OD)")}</div>
                    <input
                      type="text"
                      placeholder="-2.00"
                      value={sphR}
                      onChange={(e) => setSphR(e.target.value)}
                      className="px-2 py-1.5 rounded-md border border-border bg-background text-xs text-center text-foreground placeholder:text-muted-foreground/60"
                    />
                    <input
                      type="text"
                      placeholder="-0.50"
                      value={cylR}
                      onChange={(e) => setCylR(e.target.value)}
                      className="px-2 py-1.5 rounded-md border border-border bg-background text-xs text-center text-foreground placeholder:text-muted-foreground/60"
                    />
                    <input
                      type="text"
                      placeholder="180"
                      value={axisR}
                      onChange={(e) => setAxisR(e.target.value)}
                      className="px-2 py-1.5 rounded-md border border-border bg-background text-xs text-center text-foreground placeholder:text-muted-foreground/60"
                    />
                  </div>

                  {/* Left Eye */}
                  <div className="grid grid-cols-4 gap-2 items-center">
                    <div className="text-xs font-semibold text-foreground text-center">{t("Left (OS)")}</div>
                    <input
                      type="text"
                      placeholder="-1.75"
                      value={sphL}
                      onChange={(e) => setSphL(e.target.value)}
                      className="px-2 py-1.5 rounded-md border border-border bg-background text-xs text-center text-foreground placeholder:text-muted-foreground/60"
                    />
                    <input
                      type="text"
                      placeholder="-0.50"
                      value={cylL}
                      onChange={(e) => setCylL(e.target.value)}
                      className="px-2 py-1.5 rounded-md border border-border bg-background text-xs text-center text-foreground placeholder:text-muted-foreground/60"
                    />
                    <input
                      type="text"
                      placeholder="175"
                      value={axisL}
                      onChange={(e) => setAxisL(e.target.value)}
                      className="px-2 py-1.5 rounded-md border border-border bg-background text-xs text-center text-foreground placeholder:text-muted-foreground/60"
                    />
                  </div>

                  {/* Pupillary Distance */}
                  <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                    <label className="text-xs font-medium text-foreground">
                      {t("Pupillary Distance (PD):")}
                    </label>
                    <div className="w-32">
                      <input
                        type="text"
                        placeholder="e.g. 62 mm"
                        value={pd}
                        onChange={(e) => setPd(e.target.value)}
                        className="w-full px-2 py-1.5 rounded-md border border-border bg-background text-xs text-center text-foreground placeholder:text-muted-foreground/60"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Later Mode Note */}
              {prescriptionType === "later" && (
                <div className="p-3 rounded-lg border border-border bg-muted/10 text-xs text-muted-foreground">
                  <p>
                    {t("No problem! You can submit the frame request first. Our team will verify the frame availability, and you can email your prescription or optician pass later.")}
                  </p>
                </div>
              )}

              {/* Privacy Reassurance */}
              <div className="text-[10.5px] text-muted-foreground flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>
                  {t("Your prescription and medical data are handled confidentially and used solely for optical verification.")}
                </span>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep("input")}
                  className="w-1/3 py-2.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground hover:bg-muted transition cursor-pointer"
                >
                  {t("Back")}
                </button>

                <button
                  type="button"
                  onClick={handleSubmitFinal}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-md hover:bg-primary/95 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t("Submitting Request...")}</span>
                    </>
                  ) : (
                    <span>{t("Submit Frame & Prescription for Free Review")}</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Confirmation View */}
          {step === "confirm" && (
            <div className="text-center py-2 space-y-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div>
                <h3 className="font-display font-bold text-base text-foreground">
                  {t("Your Frame Request Is In Review")}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  {t("We've received your frame details and prescription. Our optical lab is currently reviewing availability and lens compatibility.")}
                </p>
              </div>

              {/* Tracking Code Card */}
              {createdRequestId && (
                <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 max-w-sm mx-auto">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("Your Tracking ID")}
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="font-mono text-base font-bold text-primary select-all">
                      {createdRequestId}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(createdRequestId);
                        setCopiedId(true);
                        setTimeout(() => setCopiedId(false), 2000);
                      }}
                      className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition cursor-pointer"
                      title={t("Copy Tracking ID")}
                    >
                      {copiedId ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Process Timeline */}
              <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 text-left max-w-md mx-auto space-y-2">
                <p className="text-[11px] font-semibold text-foreground">{t("What happens next:")}</p>
                <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal pl-4">
                  <li>
                    <strong className="text-foreground">{t("Optical Review:")}</strong>{" "}
                    {t("We verify frame dimensions, base curve, and lens suitability for your prescription.")}
                  </li>
                  <li>
                    <strong className="text-foreground">{t("Sourcing Check:")}</strong>{" "}
                    {t("We ensure genuine frame availability from certified distributor channels.")}
                  </li>
                  <li>
                    <strong className="text-foreground">{t("Confirmation Email:")}</strong>{" "}
                    {t("Within 24 business hours, you receive a full confirmation with custom checkout link.")}
                  </li>
                </ol>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={handleTrackLive}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md hover:bg-primary/95 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{t("Track Status Live")}</span>
                </button>

                <a
                  href={`/dashboard?email=${encodeURIComponent(email)}&requestId=${encodeURIComponent(createdRequestId || "")}`}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-primary/30 bg-primary/10 text-primary font-semibold text-xs hover:bg-primary/20 transition flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{t("Open Customer Portal")}</span>
                </a>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-border bg-background text-foreground font-semibold text-xs hover:bg-muted transition cursor-pointer"
                >
                  {t("Done")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
