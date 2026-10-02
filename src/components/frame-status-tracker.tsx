import React, { useState } from "react";
import { useLanguage } from "../lib/i18n";
import { getFrameRequestStatus } from "../lib/api/subscriptions.functions";
import { type FrameRequestStatus } from "../lib/subscriptions.server";
import {
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Glasses,
} from "lucide-react";

const PIPELINE_STAGES: { status: FrameRequestStatus; label: string; desc: string }[] = [
  { status: "Requested", label: "Requested", desc: "Request submitted and logged." },
  { status: "Under Review", label: "Under Review", desc: "Specialists checking details." },
  { status: "Frame Found", label: "Frame Found", desc: "Frame sourced from verified distributor." },
  { status: "Compatibility Check", label: "Compatibility Check", desc: "Bevel and base curve validation." },
  { status: "Prescription Review", label: "Prescription Review", desc: "Diopter & cylinder lab verification." },
  { status: "Price/Availability Confirmation", label: "Confirmation", desc: "Availability & plan locked in." },
  { status: "Ready for Checkout", label: "Ready for Checkout", desc: "Verified. Ready to activate subscription." },
  { status: "Ordered", label: "Ordered & In Lab", desc: "Lenses being custom surfaced." },
];

export function FrameStatusTracker() {
  const { t } = useLanguage();
  const [trackingId, setTrackingId] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any | null>(null);

  React.useEffect(() => {
    const handleAutoTrack = (e: any) => {
      const reqId = e.detail?.requestId;
      if (reqId) {
        setTrackingId(reqId);
        setLoading(true);
        setError("");
        getFrameRequestStatus({ data: { requestId: reqId } })
          .then((res) => {
            if (res.found && res.request) setResult(res.request);
          })
          .catch(() => {})
          .finally(() => setLoading(false));
      }
    };
    window.addEventListener("lensly_track_request", handleAutoTrack);

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const trackParam = params.get("track") || params.get("tracking_id");
      if (trackParam) {
        setTrackingId(trackParam);
        setLoading(true);
        getFrameRequestStatus({ data: { requestId: trackParam } })
          .then((res) => {
            if (res.found && res.request) setResult(res.request);
          })
          .catch(() => {})
          .finally(() => setLoading(false));
      }
    }

    return () => {
      window.removeEventListener("lensly_track_request", handleAutoTrack);
    };
  }, []);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId.trim()) {
      setError("Please enter a valid Tracking ID.");
      return;
    }

    setError("");
    setLoading(true);
    setResult(null);

    try {
      const res = await getFrameRequestStatus({
        data: {
          requestId: trackingId.trim(),
          email: email.trim() || undefined,
        },
      });

      if (res.found && res.request) {
        setResult(res.request);
      } else {
        setError("No request found matching that Tracking ID. Please check the ID and try again.");
      }
    } catch (err) {
      console.error("Status lookup error:", err);
      setError("Unable to connect to status service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStageIndex = (currentStatus: string): number => {
    const idx = PIPELINE_STAGES.findIndex((s) => s.status === currentStatus);
    return idx === -1 ? 0 : idx;
  };

  const currentStageIndex = result ? getStageIndex(result.status) : -1;

  return (
    <div className="w-full max-w-2xl mx-auto rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs text-left">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-primary font-bold">
          {t("Live Verification Pipeline")}
        </span>
      </div>

      <h3 className="font-display font-bold text-xl text-foreground">
        {t("Track Your Frame Request Status")}
      </h3>
      <p className="text-xs text-muted-foreground mt-1 mb-5">
        {t("Check the real-time optical lab review of your frame and prescription before checkout.")}
      </p>

      {/* Form */}
      <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-2.5">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder={t("Enter your tracking ID (e.g. LNS-REQ-123456)")}
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-background text-xs font-mono text-foreground placeholder:font-sans placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-xs hover:bg-primary/95 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>{t("Check Status")}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{t(error)}</span>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="mt-6 pt-6 border-t border-border/60 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-muted/20 p-4 rounded-xl border border-border/80">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">
                {t("Tracking Code")}
              </span>
              <p className="font-mono text-sm font-bold text-foreground">{result.requestId}</p>
              <p className="text-xs text-muted-foreground">{result.fullName}</p>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">
                {t("Current Status")}
              </span>
              <div className="mt-0.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                <Clock className="w-3.5 h-3.5" />
                <span>{t(result.status)}</span>
              </div>
            </div>
          </div>

          {/* 8-Stage Visual Timeline */}
          <div className="space-y-4">
            <p className="text-xs font-semibold text-foreground">{t("Verification Lifecycle:")}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PIPELINE_STAGES.map((stage, idx) => {
                const isPassed = idx < currentStageIndex;
                const isCurrent = idx === currentStageIndex;

                return (
                  <div
                    key={stage.status}
                    className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 transition ${
                      isCurrent
                        ? "border-primary bg-primary/5 text-foreground shadow-xs ring-1 ring-primary/20"
                        : isPassed
                        ? "border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-950/10 text-muted-foreground"
                        : "border-border/60 bg-muted/5 text-muted-foreground/60"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isPassed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : isCurrent ? (
                        <div className="w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-border flex items-center justify-center text-[10px] text-muted-foreground">
                          {idx + 1}
                        </div>
                      )}
                    </div>

                    <div>
                      <p className={`font-semibold ${isCurrent ? "text-primary" : "text-foreground"}`}>
                        {t(stage.label)}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{t(stage.desc)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Admin Note if present */}
          {result.adminNotes && (
            <div className="mt-4 p-3.5 rounded-xl border border-primary/20 bg-primary/5 text-xs">
              <p className="font-semibold text-primary">{t("Lab Specialist Note:")}</p>
              <p className="text-muted-foreground mt-1">{result.adminNotes}</p>
            </div>
          )}

          {/* Next Action for Ready for Checkout */}
          {result.status === "Ready for Checkout" && (
            <div className="mt-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-center">
              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                {t("Frame & Prescription Approved!")}
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">
                {t("Your custom frame sourcing has been verified. You can now activate your vision care subscription.")}
              </p>
              <a
                href={`/checkout?frame_req=${encodeURIComponent(result.requestId)}&fullName=${encodeURIComponent(result.fullName || "")}&email=${encodeURIComponent(result.email || "")}&phone=${encodeURIComponent(result.phone || "")}`}
                className="mt-3 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md hover:bg-primary/95 transition"
              >
                {t("Proceed to Secure Checkout")}
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
