import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useLanguage } from "../lib/i18n";
import { Nav, Footer } from "./index";
import { Mail, Check } from "lucide-react";

export const Route = createFileRoute("/cancel")({
  head: () => ({
    meta: [
      { title: "Vertrag kündigen | Lensly" },
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
  const [copied, setCopied] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <div>
        <Nav />
        <main className="mx-auto max-w-md px-4 py-16 sm:px-6">
          <div className="bg-card rounded-2xl border border-border shadow-md p-6 sm:p-8 text-center animate-in fade-in duration-200">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6" />
            </div>
            
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              {t("Cancel Contract")}
            </h1>
            
            <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {t("Please send us an email with your contract details to confirm your cancellation request.")}
            </p>

            <div className="bg-muted/50 rounded-lg p-3 my-5 border border-border/40 font-mono text-sm text-foreground font-semibold select-all break-all">
              lensly@gmail.com
            </div>

            <div className="flex flex-col gap-2.5">
              <a
                href="mailto:lensly@gmail.com?subject=Contract Cancellation Request"
                className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold shadow-xs hover:bg-primary/95 transition text-center block cursor-pointer"
              >
                {t("Send Email")}
              </a>
              
              <button
                onClick={() => {
                  navigator.clipboard.writeText("lensly@gmail.com");
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="w-full py-2.5 rounded-lg border border-border bg-background text-foreground text-xs font-semibold hover:bg-muted transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-primary" />
                    {t("Copied!")}
                  </>
                ) : (
                  t("Copy Email Address")
                )}
              </button>
            </div>
            
            <div className="mt-6 text-[10.5px] text-muted-foreground leading-relaxed border-t border-border/60 pt-4">
              {t("Our support team will process your cancellation request and send you a confirmation receipt within 24 hours.")}
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
