import { createFileRoute } from "@tanstack/react-router";
import { Nav, Footer } from "./index";

export const Route = createFileRoute("/agb")({
  head: () => ({
    meta: [
      { title: "Allgemeine Geschäftsbedingungen (AGB) | Lensly" },
      { name: "description", content: "Terms of service and subscription terms for Lensly." },
    ],
  }),
  component: Agb,
});

function Agb() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <div>
        <Nav />
        <main className="mx-auto max-w-2xl px-6 py-16">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl mb-8">
            Allgemeine Geschäftsbedingungen (AGB)
          </h1>
          
          <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
            <ol className="list-decimal pl-5 space-y-4 text-foreground/90">
              <li>
                <span className="font-medium text-foreground">Service Provision:</span> Lensly provides prescription eyewear on a monthly subscription basis.
              </li>
              <li>
                <span className="font-medium text-foreground">Pricing &amp; Cancellation:</span> The subscription is priced at €29/month. You can cancel your subscription at any time.
              </li>
              <li>
                <span className="font-medium text-foreground">Delivery Schedule:</span> One (1) new, complete pair of prescription glasses is delivered to you per year.
              </li>
              <li>
                <span className="font-medium text-foreground">Replacements &amp; Prescription Changes:</span> The plan includes up to three (3) free replacements per subscription year for broken glasses or prescription changes up to ±0.5 diopters.
              </li>
              <li>
                <span className="font-medium text-foreground">Liability:</span> Lensly is not liable for delays or fitting issues caused by incorrect prescription details provided by the customer.
              </li>
              <li>
                <span className="font-medium text-foreground">Custom Products &amp; Refunds:</span> Since prescription lenses are custom-manufactured to your exact specifications, refunds are not available once lens production has begun.
              </li>
            </ol>
            
            <section className="border-t border-border/60 pt-6 mt-8">
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground mb-2">
                Kontakt
              </h2>
              <p>
                For any questions regarding these terms, please contact:{" "}
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
