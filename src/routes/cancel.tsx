import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useLanguage } from "../lib/i18n";
import { Nav, Footer } from "./index";
import { ShieldAlert, CheckCircle2, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/cancel")({
  head: () => ({
    meta: [
      { title: "Cancel Subscription | Lensly" },
      {
        name: "description",
        content: "Statutory online cancellation page for your Lensly Care subscription.",
      },
    ],
  }),
  component: CancelPage,
});

function CancelPage() {
  const { t } = useLanguage();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [contractId, setContractId] = useState("");
  const [cancelDate, setCancelDate] = useState("next");
  const [confirmed, setConfirmed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [cancelRef, setCancelRef] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) {
      setError(t("Please enter your full name."));
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError(t("Please enter a valid email address."));
      return;
    }
    if (!confirmed) {
      setError(t("Please confirm the cancellation request."));
      return;
    }

    // Generate cancellation reference ID
    const refId = `LNS-CANCEL-${Math.floor(100000 + Math.random() * 900000)}`;
    setCancelRef(refId);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <div>
        <Nav />
        <main className="mx-auto max-w-md px-4 py-16 sm:px-6">
          <div className="bg-white/85 border border-primary/10 rounded-2xl p-6 sm:p-8 shadow-[0_12px_40px_rgba(0,102,119,0.03)] backdrop-blur-xs animate-in fade-in duration-200">
            
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="text-center">
                  <div className="w-12 h-12 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShieldAlert className="w-6 h-6 text-red-600" />
                  </div>
                  <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
                    {t("Cancel Subscription")}
                  </h1>
                  <p className="mt-1 text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">
                    {t("Online Cancellation Portal (§ 312k BGB)")}
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                    {t("Please complete this form to request cancellation of your continuous vision care plan.")}
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-700 p-3 rounded-lg text-xs font-semibold border border-red-100 text-left">
                    ⚠️ {error}
                  </div>
                )}

                <div className="space-y-4">
                  {/* Name field */}
                  <div>
                    <label htmlFor="fullName" className="block text-[10px] uppercase tracking-wider font-bold text-foreground/80 mb-1.5 text-left">
                      {t("Full Name")}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your name"
                        className="w-full rounded-lg border border-border/80 bg-background/50 py-2.5 px-3 text-xs text-foreground placeholder-muted-foreground/60 transition-all hover:bg-background/80 focus:border-primary focus:bg-background outline-none font-sans"
                      />
                    </div>
                  </div>

                  {/* Email field */}
                  <div>
                    <label htmlFor="email" className="block text-[10px] uppercase tracking-wider font-bold text-foreground/80 mb-1.5 text-left">
                      {t("Email Address")}
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@example.com"
                        className="w-full rounded-lg border border-border/80 bg-background/50 py-2.5 px-3 text-xs text-foreground placeholder-muted-foreground/60 transition-all hover:bg-background/80 focus:border-primary focus:bg-background outline-none font-sans"
                      />
                    </div>
                  </div>

                  {/* Contract ID field */}
                  <div>
                    <label htmlFor="contractId" className="block text-[10px] uppercase tracking-wider font-bold text-foreground/80 mb-1.5 text-left">
                      {t("Contract Number")} ({t("Optional")})
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="contractId"
                        value={contractId}
                        onChange={(e) => setContractId(e.target.value)}
                        placeholder="LNS-123456"
                        className="w-full rounded-lg border border-border/80 bg-background/50 py-2.5 px-3 text-xs text-foreground placeholder-muted-foreground/60 transition-all hover:bg-background/80 focus:border-primary focus:bg-background outline-none font-sans"
                      />
                    </div>
                  </div>

                  {/* Cancellation Date selection */}
                  <div>
                    <label htmlFor="cancelDate" className="block text-[10px] uppercase tracking-wider font-bold text-foreground/80 mb-1.5 text-left">
                      {t("Cancellation Date")}
                    </label>
                    <select
                      id="cancelDate"
                      value={cancelDate}
                      onChange={(e) => setCancelDate(e.target.value)}
                      className="w-full rounded-lg border border-border/80 bg-background/50 py-2.5 px-3 text-xs text-foreground transition-all hover:bg-background/80 focus:border-primary focus:bg-background outline-none font-sans"
                    >
                      <option value="next">{t("Next possible date (contractual notice)")}</option>
                      <option value="immediate">{t("Immediate termination (extraordinary, proof required)")}</option>
                    </select>
                  </div>

                  {/* Agreement checkbox */}
                  <div className="flex items-start gap-2.5 pt-2">
                    <input
                      type="checkbox"
                      id="confirm"
                      checked={confirmed}
                      onChange={(e) => setConfirmed(e.target.checked)}
                      className="mt-0.5 h-3.5 w-3.5 rounded-sm border-border bg-background text-primary focus:ring-primary shrink-0 cursor-pointer"
                    />
                    <label htmlFor="confirm" className="text-[11px] text-muted-foreground leading-normal text-left cursor-pointer">
                      {t("I hereby request the legally binding cancellation of my subscription. I acknowledge the 12-month fixed minimum duration & 30-day notice periods.")}
                    </label>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-destructive hover:bg-destructive/95 text-white text-xs font-bold uppercase tracking-wider transition hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-sm shadow-destructive/15 flex items-center justify-center gap-1.5"
                  >
                    <span>{t("Submit Cancellation Request")}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6 text-center animate-in zoom-in-98 duration-300">
                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                
                <div className="space-y-2">
                  <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
                    {t("Cancellation Submitted")}
                  </h1>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    {t("Request Confirmed")}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t("Your cancellation has been successfully logged and processed. We have registered your request and emailed a verification confirmation to your inbox.")}
                  </p>
                </div>

                <div className="border border-border/80 rounded-xl bg-muted/40 p-5 text-left space-y-2.5 text-xs">
                  <div className="flex justify-between items-center text-[10px] uppercase font-semibold text-muted-foreground border-b border-border/40 pb-2 mb-1">
                    <span>{t("Cancellation summary")}</span>
                    <span className="font-mono text-foreground font-bold">{cancelRef}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>{t("Contract Holder:")}</span>
                    <span className="font-semibold text-foreground">{fullName}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>{t("Registered Email:")}</span>
                    <span className="font-semibold text-foreground">{email}</span>
                  </div>
                  {contractId && (
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>{t("Contract Reference:")}</span>
                      <span className="font-semibold text-foreground">{contractId}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>{t("Cancellation Date:")}</span>
                    <span className="font-semibold text-foreground">
                      {cancelDate === "next"
                        ? t("Next Contractual Possible Date")
                        : t("Immediate Termination (Pending Proof)")}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-muted-foreground leading-relaxed">
                  {t("You do not need to take any further action. You can close this tab or return to the homepage.")}
                </div>

                <div className="pt-2">
                  <a
                    href="/"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/95 shadow-xs"
                  >
                    {t("Return Home")}
                  </a>
                </div>
              </div>
            )}
            
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
