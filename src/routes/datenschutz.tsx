import { createFileRoute } from "@tanstack/react-router";
import { Nav, Footer } from "./index";

export const Route = createFileRoute("/datenschutz")({
  head: () => ({
    meta: [
      { title: "Datenschutzerklärung | Lensly" },
      { name: "description", content: "Privacy policy and data storage information under GDPR compliance." },
    ],
  }),
  component: Datenschutz,
});

function Datenschutz() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <div>
        <Nav />
        <main className="mx-auto max-w-2xl px-6 py-16">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl mb-8">
            Datenschutzerklärung
          </h1>
          
          <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
            <section className="space-y-3">
              <p>
                We collect only the data necessary to process your order (name, prescription details, and delivery address).
              </p>
              <p>
                Payment information is processed securely and directly via Stripe. We do not store your credit card or billing details on our servers.
              </p>
              <p>
                We do not sell, distribute, or lease your personal data to third parties. All personal data is stored securely in accordance with GDPR (General Data Protection Regulation) requirements.
              </p>
            </section>
            
            <section className="border-t border-border/60 pt-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground mb-2">
                Contact for Data Requests
              </h2>
              <p>
                If you have questions, would like to request data deletion, or require information about your stored data, please email:{" "}
                <a href="mailto:lenslycare@gmail.com" className="text-primary hover:underline font-medium">
                  lenslycare@gmail.com
                </a>
              </p>
            </section>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
