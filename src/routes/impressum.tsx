import { createFileRoute } from "@tanstack/react-router";
import { Nav, Footer } from "./index";
import { useLanguage } from "../lib/i18n";

export const Route = createFileRoute("/impressum")({
  head: () => ({
    meta: [
      { title: "Impressum | Lensly" },
      { name: "description", content: "Legal information according to § 5 TMG." },
    ],
  }),
  component: Impressum,
});

function Impressum() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <div>
        <Nav />
        <main className="mx-auto max-w-2xl px-6 py-16">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl mb-8">
            {t("Impressum")}
          </h1>
          
          <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground mb-2">
                {t("Angaben gemäß § 5 TMG")}
              </h2>
              <p className="font-medium text-foreground">Md Shaon Sikder</p>
            </section>
            
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground mb-2">
                {t("Kontakt")}
              </h2>
              <p>
                {t("E-Mail:")}{" "}
                <a href="mailto:lenslycare@gmail.com" className="text-primary hover:underline font-medium">
                  lenslycare@gmail.com
                </a>
              </p>
            </section>
            
            <section className="border-t border-border/60 pt-6">
              <p className="italic text-muted-foreground/80">
                {t("Address will be updated shortly.")}
              </p>
            </section>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
