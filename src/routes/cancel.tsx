import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useLanguage } from "../lib/i18n";
import { updateSubscriptionStatus } from "../lib/api/subscriptions.functions";
import { Nav, Footer } from "./index";
import { AlertTriangle, CheckCircle2, ShieldCheck, Mail, User, FileText, Loader2 } from "lucide-react";

export const Route = createFileRoute("/cancel")({
  head: () => ({
    meta: [
      { title: "Vertrag kündigen | Lensly" },
      {
        name: "description",
        content: "Statutory online cancellation form for your Lensly Care subscription.",
      },
    ],
  }),
  component: CancelPage,
});

function CancelPage() {
  const { t } = useLanguage();

  // Form input states
  const [fullName, setFullName] = useState("");
  const [contractNumber, setContractNumber] = useState("");
  const [email, setEmail] = useState("");

  // Submit/validation UI states
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleCancelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Simple validation
    if (!fullName.trim()) {
      setErrorMsg(t("Please enter your full name."));
      return;
    }
    if (!contractNumber.trim()) {
      setErrorMsg(t("Please enter your contract or customer number."));
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMsg(t("Please enter a valid email address."));
      return;
    }

    setIsSubmitting(true);

    updateSubscriptionStatus({
      data: {
        contractId: contractNumber,
        email,
        status: "cancelled",
      },
    })
      .then((success) => {
        setIsSubmitting(false);
        if (success) {
          setIsSubmitted(true);
        } else {
          setErrorMsg(
            t("No matching contract was found. Please check your contract number and email."),
          );
        }
      })
      .catch((error) => {
        console.error("Cancellation status update error:", error);
        setIsSubmitting(false);
        setErrorMsg(t("An error occurred. Please try again later."));
      });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <div>
        <Nav />
        <main className="mx-auto max-w-xl px-4 py-16 sm:px-6">
          {isSubmitted ? (
            /* ================= STEP 2: SUCCESS STATE ================= */
            <div className="bg-card rounded-2xl border border-border p-6 sm:p-10 shadow-lg text-center animate-in fade-in zoom-in-95 duration-200">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-500/10 text-amber-600 mb-6">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <h2 className="font-display text-2xl font-bold text-foreground">
                {t("Kündigung bestätigt")}
              </h2>
              <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                {t(
                  "We have received and processed your subscription cancellation request. In compliance with Section 312k BGB, we will send an immediate electronic receipt and confirmation letter to your registered email.",
                )}
              </p>

              <div className="mt-6 border border-border/80 rounded-xl bg-muted/20 p-4 text-left text-xs space-y-2">
                <div className="flex justify-between border-b border-border/40 pb-2">
                  <span>{t("Customer Name")}</span>
                  <span className="font-semibold text-foreground">{fullName}</span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-2">
                  <span>{t("Contract Number")}</span>
                  <span className="font-mono text-foreground">{contractNumber.toUpperCase()}</span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-2">
                  <span>{t("Registered Email")}</span>
                  <span className="text-foreground">{email}</span>
                </div>
                <div className="flex justify-between text-muted-foreground/80">
                  <span>{t("Termination Date")}</span>
                  <span className="text-foreground font-semibold">
                    {t("End of active contract term")}
                  </span>
                </div>
              </div>

              <div className="mt-8">
                <Link
                  to="/"
                  className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition shadow-sm"
                >
                  {t("Return to Home Page")}
                </Link>
              </div>
            </div>
          ) : (
            /* ================= STEP 1: CANCELLATION FORM ================= */
            <div className="bg-card rounded-2xl border border-border shadow-md p-6 sm:p-8">
              <div className="text-center mb-6">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-600">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {t("Vertrag kündigen (Section 312k BGB)")}
                </span>
                <h1 className="font-display text-2xl font-bold tracking-tight text-foreground mt-3">
                  {t("Subscription Cancellation Form")}
                </h1>
                <p className="mt-2 text-xs text-muted-foreground max-w-sm mx-auto">
                  {t(
                    "You are about to cancel your Lensly Care subscription. Please provide your contract details to execute the termination.",
                  )}
                </p>
              </div>

              <form onSubmit={handleCancelSubmit} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    {t("Full Name")}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Contract Number */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    {t("Contract / Customer Number")}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                      <FileText className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={contractNumber}
                      onChange={(e) => setContractNumber(e.target.value)}
                      placeholder="LNS-2026-XXXXXX"
                      className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-xs font-mono text-foreground focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    {t("Email Address")}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Error Box */}
                {errorMsg && (
                  <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                    {errorMsg}
                  </div>
                )}

                {/* Informational Warning */}
                <div className="bg-muted/40 border border-border/80 rounded-lg p-3 text-[10px] text-muted-foreground leading-relaxed">
                  {t(
                    "Please note: Your cancellation request will take effect at the end of your initial 12-month term, or on a rolling monthly basis if the initial term has already expired.",
                  )}
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-lg bg-primary py-2.5 text-center text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      {t("Processing...")}
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {t("Kündigung bestätigen")}
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
}
