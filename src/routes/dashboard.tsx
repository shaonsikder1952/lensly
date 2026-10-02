import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useLanguage, type Language } from "../lib/i18n";
import { AVAILABLE_PLANS, CURRENT_PLAN, getPlanById, formatEur } from "../lib/pricing";
import { LensMark } from "./index";
import {
  customerGetOverview,
  customerLogin,
  customerRespondToFrameOption,
  customerSubmitReplacement,
  customerGetMessages,
  customerSendMessage,
  getOpticianPartners,
  getVtoConfiguration,
  customerLogout,
  exchangeCustomerHandoff,
} from "../lib/api/subscriptions.functions";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Glasses,
  FileText,
  RefreshCw,
  Send,
  Building2,
  Phone,
  Mail,
  ExternalLink,
  Search,
  Camera,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Package,
  Truck,
  Eye,
  Check,
  X,
  UploadCloud,
  FileCheck,
  MapPin,
  Calendar,
  MessageSquare,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Customer Dashboard | Lensly.care" },
      {
        name: "description",
        content: "Manage your Lensly eyewear subscription, track custom frame requests, review prescription status, and submit replacements.",
      },
    ],
  }),
  component: CustomerDashboardPage,
});

const languages = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
];

const ORDER_STEPS = [
  "Requested",
  "Verified",
  "Confirmed",
  "Processing",
  "Lens Production",
  "Quality Check",
  "Shipped",
  "Delivered",
];

export function CustomerDashboardPage() {
  const { lang, setLang, t } = useLanguage();
  const [langOpen, setLangOpen] = useState(false);
  const currentLang = languages.find((l) => l.code === lang) || languages[0];

  const [activeTab, setActiveTab] = useState<
    "overview" | "orders" | "frames" | "prescriptions" | "replacement" | "partners" | "vto" | "messages"
  >("overview");

  // Customer identification
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [contractId, setContractId] = useState<string>("");
  const [accessToken, setAccessToken] = useState<string>("");
  const [loginIdentifier, setLoginIdentifier] = useState<string>("");
  const [isIdentified, setIsIdentified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Portal data
  const [overviewData, setOverviewData] = useState<{
    customerName: string;
    customerEmail: string;
    activeSubscription?: any;
    orders: any[];
    frameRequests: any[];
    prescriptions: any[];
  } | null>(null);

  // Optician partners
  const [partners, setPartners] = useState<any[]>([]);
  const [partnerQuery, setPartnerQuery] = useState("");
  const [isSearchingPartners, setIsSearchingPartners] = useState(false);

  // Messaging state
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessageBody, setNewMessageBody] = useState("");
  const [messageContext, setMessageContext] = useState<"support" | "order" | "frame_request" | "prescription">("support");
  const [messageTargetId, setMessageTargetId] = useState("general");
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Replacement Request Form State
  const [replacementReason, setReplacementReason] = useState<"accidental_damage" | "lost_item" | "prescription_change" | "other">("accidental_damage");
  const [replacementDesc, setReplacementDesc] = useState("");
  const [replacementFileName, setReplacementFileName] = useState("");
  const [replacementFileBase64, setReplacementFileBase64] = useState("");
  const [replacementSubmitting, setReplacementSubmitting] = useState(false);
  const [replacementFeedback, setReplacementFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // VTO State
  const [vtoStatus, setVtoStatus] = useState<any>(null);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [selectedVtoFrame, setSelectedVtoFrame] = useState("/classic-acetate.png");

  // Load customer session via secure HttpOnly cookie or handoff
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Purge any legacy client-accessible tokens from browser storage
      try {
        sessionStorage.removeItem("lensly_customer_token");
        localStorage.removeItem("lensly_customer_token");
      } catch {}

      const urlParams = new URLSearchParams(window.location.search);
      const handoffToken = urlParams.get("handoff_token") || urlParams.get("handoff");
      const urlContract = urlParams.get("contract_id") || urlParams.get("contractId");
      const legacyToken = urlParams.get("token") || urlParams.get("access_token");

      if (urlContract) {
        setContractId(urlContract);
      }

      // If handoff token arrived in URL, exchange via POST for HttpOnly session cookie
      if (handoffToken) {
        exchangeCustomerHandoff({ data: { handoffToken } })
          .then(() => {
            loadDashboardData(undefined, urlContract || undefined);
          })
          .catch((err) => {
            console.error("Handoff exchange note:", err);
            loadDashboardData(undefined, urlContract || undefined);
          })
          .finally(() => {
            // Clean credentials and tokens from URL immediately
            const cleanUrl = new URL(window.location.href);
            cleanUrl.searchParams.delete("handoff_token");
            cleanUrl.searchParams.delete("handoff");
            cleanUrl.searchParams.delete("token");
            cleanUrl.searchParams.delete("access_token");
            cleanUrl.searchParams.delete("email");
            window.history.replaceState({}, document.title, cleanUrl.pathname + (cleanUrl.search ? cleanUrl.search : ""));
          });
        return;
      }

      // Clean URL if any token or email query param was present
      const urlEmail = urlParams.get("email");
      const urlRequestId = urlParams.get("requestId") || urlParams.get("request_id");

      if (urlEmail) {
        setLoginIdentifier(urlEmail);
      } else if (urlRequestId) {
        setLoginIdentifier(urlRequestId);
      }

      if (legacyToken || urlParams.has("email") || urlParams.has("requestId") || urlParams.has("request_id")) {
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete("token");
        cleanUrl.searchParams.delete("access_token");
        cleanUrl.searchParams.delete("email");
        cleanUrl.searchParams.delete("requestId");
        cleanUrl.searchParams.delete("request_id");
        window.history.replaceState({}, document.title, cleanUrl.pathname + (cleanUrl.search ? cleanUrl.search : ""));
      }

      // Load dashboard data using HttpOnly session cookie (with optional identifier fallback)
      const initialLookup = legacyToken || urlEmail || urlRequestId || undefined;
      loadDashboardData(initialLookup, urlContract || undefined);
    }
  }, []);

  const loadDashboardData = async (identifierOrToken?: string, contract?: string) => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const data = await customerGetOverview({
        data: {
          identifier: identifierOrToken?.trim() || undefined,
          accessToken: identifierOrToken?.trim() || undefined,
          contractId: contract?.trim() || undefined,
        },
      });
      setOverviewData(data);
      setCustomerEmail(data.customerEmail);
      setIsIdentified(true);
      if (identifierOrToken && identifierOrToken.length >= 32) {
        setAccessToken(identifierOrToken);
      }
    } catch (err: any) {
      console.warn("Dashboard session load note:", err.message);
      setIsIdentified(false);
      if (identifierOrToken) {
        setErrorMessage(t("No account found matching this email or tracking ID."));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim()) {
      setErrorMessage(t("Please enter your email address or tracking ID."));
      return;
    }
    setErrorMessage("");
    setIsLoading(true);
    try {
      const res = await customerLogin({
        data: {
          identifier: loginIdentifier.trim(),
          contractId: contractId.trim() || undefined,
        },
      });
      if (res && res.success) {
        await loadDashboardData(res.email, res.contractId);
      } else {
        setErrorMessage(res?.error || t("No account found matching this information."));
      }
    } catch (err: any) {
      setErrorMessage(err.message || t("Login failed. Please check your details."));
    } finally {
      setIsLoading(false);
    }
  };

  // Load partners on mount
  useEffect(() => {
    loadPartners();
    getVtoConfiguration().then((res) => setVtoStatus(res)).catch(() => {});
  }, []);

  const loadPartners = async (query?: string) => {
    setIsSearchingPartners(true);
    try {
      const res = await getOpticianPartners({
        data: { query },
      });
      setPartners(res);
    } catch (err) {
      console.error("Partners query error:", err);
    } finally {
      setIsSearchingPartners(false);
    }
  };

  // Load messages when tab opened
  useEffect(() => {
    if (activeTab === "messages" && overviewData) {
      loadMessages();
    }
  }, [activeTab, overviewData, messageContext, messageTargetId]);

  const loadMessages = async () => {
    try {
      const res = await customerGetMessages({
        data: {
          contextType: messageContext,
          contextId: messageTargetId || "general",
        },
      });
      setMessages(res);
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageBody.trim() || !customerEmail) return;
    setIsSendingMessage(true);
    try {
      await customerSendMessage({
        data: {
          contextType: messageContext,
          contextId: messageTargetId || "general",
          senderEmail: customerEmail,
          senderName: overviewData?.customerName || "Customer",
          body: newMessageBody.trim(),
        },
      });
      setNewMessageBody("");
      await loadMessages();
    } catch (err: any) {
      alert("Error sending message: " + err.message);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleFrameDecision = async (requestId: string, decision: "approved" | "declined" | "resubmit_requested") => {
    if (!accessToken) {
      const promptToken = prompt("Please provide your 64-character Frame Access Token received via email:");
      if (!promptToken) return;
      setAccessToken(promptToken);
    }
    const effToken = accessToken;
    try {
      const res = await customerRespondToFrameOption({
        data: {
          requestId,
          accessToken: effToken,
          decision,
        },
      });
      if (res.success) {
        alert("Your choice has been securely recorded! Our optical team will proceed immediately.");
        if (overviewData?.customerEmail) {
          loadDashboardData(accessToken || undefined, contractId || undefined);
        }
      } else {
        alert(res.error || "Failed to submit decision.");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleReplacementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerEmail || !overviewData?.activeSubscription?.contract_id) {
      alert("Please ensure you are viewing an active subscription before submitting a claim.");
      return;
    }
    setReplacementSubmitting(true);
    setReplacementFeedback(null);
    try {
      const res = await customerSubmitReplacement({
        data: {
          email: customerEmail,
          subscriptionId: overviewData.activeSubscription.contract_id,
          reason: replacementReason,
          description: replacementDesc,
          evidenceFileName: replacementFileName || undefined,
          evidenceData: replacementFileBase64 || undefined,
        },
      });
      if (res.success) {
        const claimRef = res.replacement?.id || (res as any).claimId || "REC-" + Date.now();
        setReplacementFeedback({
          success: true,
          message: `Claim registered! Reference: ${claimRef}. Our care team will review your replacement within 24 hours.`,
        });
        setReplacementDesc("");
        setReplacementFileName("");
        setReplacementFileBase64("");
      } else {
        setReplacementFeedback({
          success: false,
          message: res.error || "Claim submission could not be completed.",
        });
      }
    } catch (err: any) {
      setReplacementFeedback({
        success: false,
        message: err.message || "An unexpected error occurred.",
      });
    } finally {
      setReplacementSubmitting(false);
    }
  };

  const handleEvidenceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds 10MB limit.");
      return;
    }
    setReplacementFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setReplacementFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setUserPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <LensMark />
              <span className="font-display text-base font-bold tracking-tight text-foreground group-hover:text-primary transition">
                Lensly<span className="text-primary">.care</span>
              </span>
            </Link>
            <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full font-medium">
              {t("Customer Portal")}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangOpen(!langOpen)}
                aria-label={t("Select Language")}
                className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-background/50 px-2.5 py-1.5 text-xs font-semibold text-foreground/80 hover:bg-muted transition cursor-pointer"
              >
                <span>{currentLang.flag}</span>
                <span className="uppercase text-[11px]">{currentLang.code}</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </button>

              {langOpen && (
                <div className="absolute right-0 mt-1.5 w-36 rounded-xl border border-border bg-card p-1 shadow-lg z-50 animate-in fade-in zoom-in-95">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => {
                        setLang(l.code as Language);
                        setLangOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition cursor-pointer ${
                        lang === l.code
                          ? "bg-primary/10 text-primary font-bold"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <span>{l.flag}</span>
                      <span>{l.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isIdentified ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card border border-border px-3 py-1.5 rounded-lg shadow-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-medium text-foreground">{overviewData?.customerName || customerEmail}</span>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await customerLogout();
                    } catch {}
                    try {
                      sessionStorage.removeItem("lensly_customer_token");
                      localStorage.removeItem("lensly_customer_token");
                    } catch {}
                    setIsIdentified(false);
                    setOverviewData(null);
                    setAccessToken("");
                  }}
                  className="ml-2 text-muted-foreground hover:text-rose-500 text-[11px] underline cursor-pointer"
                >
                  {t("Logout")}
                </button>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground bg-muted/30 px-2.5 py-1 rounded-lg border border-border/60">
                {t("Secure Area")}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isIdentified ? (
          /* Identification prompt */
          <div className="max-w-md mx-auto my-12 p-8 bg-card border border-border rounded-2xl shadow-lg text-center">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
              <Glasses className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight mb-2">{t("Access Your Lensly Dashboard")}</h1>
            <p className="text-xs text-muted-foreground mb-6">
              {t("Enter your subscription email address or contract ID to manage your glasses, track live orders, and review prescriptions.")}
            </p>

            {errorMessage && (
              <div className="p-3 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{t(errorMessage)}</span>
              </div>
            )}

            <form onSubmit={handleCustomerLogin} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  {t("Email Address or Tracking ID")} <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder={t("max@gmail.com or LNS-REQ-8CDBFD2EB23AFB6BE61F9189A426446E")}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-mono focus:ring-2 focus:ring-primary focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  {t("Contract ID")} <span className="font-normal text-[11px]">({t("Optional")})</span>
                </label>
                <input
                  type="text"
                  value={contractId}
                  onChange={(e) => setContractId(e.target.value)}
                  placeholder={t("e.g. LNS-2026-104928")}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-none uppercase"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md hover:bg-primary/95 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : t("Access Dashboard")}
              </button>

              <p className="text-[11px] text-muted-foreground text-center pt-1 leading-relaxed">
                {t("Enter the email address or tracking ID used when submitting your frame request or subscription.")}
              </p>
            </form>
          </div>
        ) : (
          /* Authenticated Dashboard View */
          <div>
            {/* Dashboard Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-4 mb-6 border-b border-border/80 scrollbar-none">
              {[
                { id: "overview", label: t("Overview"), icon: Sparkles },
                { id: "orders", label: `${t("Orders")} (${overviewData?.orders.length || 0})`, icon: Package },
                { id: "frames", label: `${t("Frame Requests")} (${overviewData?.frameRequests.length || 0})`, icon: Glasses },
                { id: "prescriptions", label: t("Prescription"), icon: FileText },
                { id: "replacement", label: t("Replacements"), icon: RefreshCw },
                { id: "partners", label: t("Optician Partners"), icon: Building2 },
                { id: "vto", label: t("Virtual Try-On"), icon: Camera },
                { id: "messages", label: t("Messages & Support"), icon: MessageSquare },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-card border border-transparent"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Top Quick Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Subscription Status Card */}
                  <div className="p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-muted-foreground">{t("Active Subscription")}</span>
                        <span
                          className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold capitalize ${
                            overviewData?.activeSubscription?.status === "active"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {overviewData?.activeSubscription?.status ? t("Active") : t("No active plan")}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-foreground">
                        {overviewData?.activeSubscription ? t("Lensly Standard Plan") : t("No Plan Subscribed")}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {overviewData?.activeSubscription
                          ? `${t("Contract:")} ${overviewData.activeSubscription.contract_id} ${t("• €29/month")}`
                          : t("Explore our plans and verify your favorite frames.")}
                      </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{t("Renewal: 1st of next month")}</span>
                      <Link to="/cancel" className="text-primary hover:underline font-medium text-[11px]">
                        {t("Manage Contract")}
                      </Link>
                    </div>
                  </div>

                  {/* Active Order or Frame Request Card */}
                  {overviewData?.orders && overviewData.orders.length > 0 ? (
                    <div className="p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-medium text-muted-foreground">{t("Latest Order")}</span>
                          <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-primary/10 text-primary border border-primary/20">
                            {t(overviewData.orders[0].status)}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-foreground">
                          {overviewData.orders[0].frame_brand || t("Custom Eyewear Production")}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("Order #")}{overviewData.orders[0].order_id}
                        </p>
                      </div>

                      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {overviewData.orders[0].carrier ? `${overviewData.orders[0].carrier} • ${overviewData.orders[0].tracking_number || "Bereitgestellt"}` : t("In Optic Lab Production")}
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveTab("orders")}
                          className="text-primary hover:underline font-medium text-[11px] cursor-pointer"
                        >
                          {t("Track Progress →")}
                        </button>
                      </div>
                    </div>
                  ) : overviewData?.frameRequests && overviewData.frameRequests.length > 0 ? (
                    <div className="p-6 rounded-2xl bg-card border border-primary/30 shadow-sm flex flex-col justify-between bg-primary/5">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-medium text-primary font-semibold">{t("Wunschbrillen-Prüfung")}</span>
                          <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-primary/15 text-primary border border-primary/25">
                            {t(overviewData.frameRequests[0].status)}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-foreground">
                          {overviewData.frameRequests[0].frameBrand || t("Wunschfassung")} {overviewData.frameRequests[0].frameModel || ""}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 font-mono">
                          ID: {overviewData.frameRequests[0].requestId}
                        </p>
                      </div>

                      <div className="mt-4 pt-4 border-t border-border/80 flex items-center justify-between text-xs">
                        {overviewData.frameRequests[0].status === "Ready for Checkout" ? (
                          <a
                            href={`/checkout?frame_req=${overviewData.frameRequests[0].requestId}`}
                            className="font-bold text-primary hover:underline flex items-center gap-1"
                          >
                            <span>{t("Proceed to Checkout (€29/mo) →")}</span>
                          </a>
                        ) : (
                          <>
                            <span className="text-muted-foreground">{t("Status: Optical Lab Review")}</span>
                            <button
                              type="button"
                              onClick={() => setActiveTab("frames")}
                              className="text-primary hover:underline font-semibold text-[11px] cursor-pointer"
                            >
                              {t("View Details →")}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-medium text-muted-foreground">{t("Latest Order")}</span>
                          <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-muted text-muted-foreground">
                            {t("No Orders Yet")}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-foreground">{t("No Active Order")}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("Submit a frame request or subscribe to start eyewear production.")}
                        </p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs">
                        <Link to="/" className="text-primary hover:underline font-medium text-[11px]">
                          {t("Submit Your Frame →")}
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Prescription Card */}
                  <div className="p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-muted-foreground">{t("Prescription Verification")}</span>
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {t("Verified & Active")}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-foreground">{t("Optometric Review Passed")}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("Fitted for Single Vision Index 1.6 with hydrophobic anti-reflection coating.")}
                      </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{t("Valid for 12 months")}</span>
                      <button
                        type="button"
                        onClick={() => setActiveTab("prescriptions")}
                        className="text-primary hover:underline font-medium text-[11px] cursor-pointer"
                      >
                        {t("Update Document")}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Primary Order Timeline Banner */}
                <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                    <div>
                      <h3 className="text-base font-bold text-foreground">{t("Current Eyewear Pipeline")}</h3>
                      <p className="text-xs text-muted-foreground">
                        {t("Live 8-stage manufacturing and verification status for your custom eyewear.")}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t("Order ID:")} <span className="font-mono font-medium text-foreground">ORD-2026-001</span>
                    </div>
                  </div>

                  {/* 8-Stage Pipeline Stepper */}
                  <div className="relative py-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                      {ORDER_STEPS.map((step, idx) => {
                        const currentIdx = 4; // Simulated "Lens Production"
                        const isDone = idx < currentIdx;
                        const isCurrent = idx === currentIdx;

                        return (
                          <div
                            key={step}
                            className={`p-3 rounded-xl border text-center transition ${
                              isCurrent
                                ? "bg-primary/10 border-primary text-primary shadow-sm"
                                : isDone
                                  ? "bg-emerald-500/5 border-emerald-500/30 text-foreground"
                                  : "bg-muted/30 border-border/50 text-muted-foreground"
                            }`}
                          >
                            <div className="flex items-center justify-center mb-1.5">
                              {isDone ? (
                                <Check className="w-4 h-4 text-emerald-500" />
                              ) : isCurrent ? (
                                <RefreshCw className="w-4 h-4 text-primary animate-spin" />
                              ) : (
                                <span className="text-[10px] font-mono text-muted-foreground">{idx + 1}</span>
                              )}
                            </div>
                            <div className="text-[11px] font-semibold tracking-tight">{t(step)}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Latest Frame Request Quick Action */}
                {overviewData?.frameRequests && overviewData.frameRequests.length > 0 && (
                  <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-bold text-foreground">{t("Recent Frame Verification")}</h3>
                      <span className="text-xs font-mono text-muted-foreground">
                        {overviewData.frameRequests[0].requestId}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <span className="text-xs text-muted-foreground">{t("Frame Model:")}</span>
                        <p className="text-sm font-semibold text-foreground">
                          {overviewData.frameRequests[0].frameBrand} {overviewData.frameRequests[0].frameModel}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">{t("Admin Optical Proposal:")}</span>
                        <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                          {t(overviewData.frameRequests[0].adminResponse || "Frame sourced and verified. Available for inclusion in your plan.")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => handleFrameDecision(overviewData.frameRequests[0].requestId, "approved")}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
                        >
                          {t("Approve Option")}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFrameDecision(overviewData.frameRequests[0].requestId, "declined")}
                          className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition cursor-pointer"
                        >
                          {t("Decline")}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: ORDERS */}
            {activeTab === "orders" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold tracking-tight">{t("Your Eyewear Orders")}</h2>
                    <p className="text-xs text-muted-foreground">
                      {t("Track every step of lens edging, coating, and delivery.")}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {(overviewData?.orders && overviewData.orders.length > 0
                    ? overviewData.orders
                    : [
                        {
                          order_id: "ORD-2026-001",
                          frame_name: "The Classic Acetate (Tortoiseshell)",
                          lens_type: "Single Vision 1.6 Premium Anti-Reflective",
                          status: "Lens Production",
                          carrier: "DHL Express",
                          tracking_number: "DHL-9482018402",
                          estimated_delivery: "3-5 Business Days",
                          created_at: new Date().toISOString(),
                        },
                      ]
                  ).map((order: any) => (
                    <div key={order.order_id} className="p-6 rounded-2xl bg-card border border-border shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/70">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-primary">{order.order_id}</span>
                            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-primary/10 text-primary border border-primary/20">
                              {t(order.status)}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-foreground mt-1">{t(order.frame_name)}</h4>
                          <p className="text-xs text-muted-foreground">{t(order.lens_type)}</p>
                        </div>
                        <div className="text-right text-xs">
                          <p className="text-muted-foreground">{t("Carrier:")} <span className="font-semibold text-foreground">{order.carrier || "DHL Express"}</span></p>
                          <p className="font-mono text-primary text-[11px] mt-0.5">{order.tracking_number || t("Tracking assigned once shipped")}</p>
                        </div>
                      </div>

                      {/* Timeline component */}
                      <div className="pt-6">
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                          {ORDER_STEPS.map((st, i) => {
                            const activeIdx = ORDER_STEPS.indexOf(order.status) !== -1 ? ORDER_STEPS.indexOf(order.status) : 4;
                            const isDone = i < activeIdx;
                            const isCur = i === activeIdx;

                            return (
                              <div
                                key={st}
                                className={`p-2.5 rounded-xl border text-center ${
                                  isCur
                                    ? "bg-primary/10 border-primary text-primary font-bold"
                                    : isDone
                                      ? "bg-emerald-500/5 border-emerald-500/20 text-foreground"
                                      : "bg-muted/20 border-border/40 text-muted-foreground"
                                }`}
                              >
                                <div className="text-[10px] font-semibold">{t(st)}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: FRAME REQUESTS */}
            {activeTab === "frames" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold tracking-tight">{t("Submitted Frame Requests")}</h2>
                    <p className="text-xs text-muted-foreground">
                      {t("Found a frame anywhere online or in-store? We check compatibility and procure it for your plan.")}
                    </p>
                  </div>
                  <Link
                    to="/"
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-sm hover:bg-primary/95 transition flex items-center gap-2 self-start sm:self-auto"
                  >
                    <span>{t("+ Submit New Frame")}</span>
                  </Link>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {(overviewData?.frameRequests && overviewData.frameRequests.length > 0
                    ? overviewData.frameRequests
                    : [
                        {
                          requestId: "LNS-REQ-104928",
                          frameBrand: "Oliver Peoples",
                          frameModel: "Gregory Peck OV5186",
                          frameDimensions: "47-23-150",
                          availability: "In Stock with Partner",
                          customerPrice: 0,
                          status: "Option Available",
                          adminResponse: "Frame found and compatible with your prescription. Approved for plan inclusion with €0 surcharge.",
                        },
                      ]
                  ).map((req: any) => (
                    <div key={req.requestId} className="p-6 rounded-2xl bg-card border border-border shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-border/70">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-primary">{req.requestId}</span>
                            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              {t(req.status)}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-foreground mt-1">
                            {req.frameBrand} {req.frameModel}
                          </h4>
                          {req.frameDimensions && (
                            <p className="text-xs text-muted-foreground">{t("Dimensions:")} {req.frameDimensions}</p>
                          )}
                        </div>

                        {req.customerPrice !== undefined && (
                          <div className="text-right">
                            <span className="text-xs text-muted-foreground">{t("Plan Surcharge:")}</span>
                            <p className="text-sm font-bold text-foreground">
                              {req.customerPrice === 0 ? t("Included in Plan (€0)") : formatEur(req.customerPrice)}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Admin Response & Decision Actions */}
                      <div className="pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="text-xs text-muted-foreground flex-1">
                          <strong className="text-foreground block mb-0.5">{t("Optician Note:")}</strong>
                          <span>{t(req.adminResponse || "Our optical lab is currently reviewing dimensions and bevel geometry.")}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleFrameDecision(req.requestId, "approved")}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
                          >
                            {t("Approve Option")}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFrameDecision(req.requestId, "declined")}
                            className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition cursor-pointer"
                          >
                            {t("Decline")}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFrameDecision(req.requestId, "resubmit_requested")}
                            className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition cursor-pointer"
                          >
                            {t("Request Alternative")}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: PRESCRIPTIONS */}
            {activeTab === "prescriptions" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold tracking-tight">{t("Prescription & Medical Records")}</h2>
                  <p className="text-xs text-muted-foreground">
                    {t("Your optometric records are protected with 256-bit server-side encryption. Sensitive values are never displayed publicly.")}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Status Card */}
                  <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-medium text-muted-foreground">{t("Current Status")}</span>
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {t("Approved for Fulfillment")}
                      </span>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-border/50">
                        <span className="text-muted-foreground">{t("Review Stage:")}</span>
                        <span className="font-semibold text-foreground">{t("Approved for Fulfillment")}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-border/50">
                        <span className="text-muted-foreground">{t("Optometric Verification:")}</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">{t("Passed CE Standards")}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-border/50">
                        <span className="text-muted-foreground">{t("Lens Recommendation:")}</span>
                        <span className="font-semibold text-foreground">{t("High-Index 1.6 UV400")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Upload Replacement Form */}
                  <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
                    <h3 className="text-sm font-bold mb-2">{t("Update or Replace Prescription")}</h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      {t("Had a new eye exam or need to correct your prescription? Upload your updated pass here.")}
                    </p>

                    <div className="p-4 border-2 border-dashed border-border rounded-xl text-center hover:border-primary/50 transition">
                      <UploadCloud className="w-8 h-8 text-primary mx-auto mb-2" />
                      <p className="text-xs font-semibold text-foreground">{t("Click to upload or drag file")}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{t("PDF, PNG, or JPG up to 10MB")}</p>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        id="prescription-file-upload"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) alert(`File "${f.name}" selected. Ready to securely submit to lab.`);
                        }}
                      />
                      <label
                        htmlFor="prescription-file-upload"
                        className="mt-3 inline-block px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs shadow-sm hover:bg-primary/95 transition cursor-pointer"
                      >
                        {t("Choose Document")}
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: REPLACEMENT REQUEST */}
            {activeTab === "replacement" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold tracking-tight">{t("Submit Replacement Request")}</h2>
                  <p className="text-xs text-muted-foreground">
                    {t("Damage, loss, or changed prescription? Submit a replacement claim according to your tariff conditions.")}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Policy Summary Card */}
                  <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
                    <h3 className="text-sm font-bold mb-2">{t("Contractual Replacement Allowance")}</h3>
                    <div className="space-y-3 text-xs mt-4">
                      <div className="flex justify-between py-1.5 border-b border-border/50">
                        <span className="text-muted-foreground">{t("Active Plan:")}</span>
                        <span className="font-semibold text-foreground">{CURRENT_PLAN.name}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-border/50">
                        <span className="text-muted-foreground">{t("Plan Allowance:")}</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {t("Up to")} {CURRENT_PLAN.replacementsPerYear} {t("requests / year")}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-border/50">
                        <span className="text-muted-foreground">{t("Used this year:")}</span>
                        <span className="font-semibold text-foreground">{t("0 of")} {CURRENT_PLAN.replacementsPerYear}</span>
                      </div>
                    </div>
                    <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/20 text-[11px] text-muted-foreground">
                      {t("Replacement requests for breakage, damage, or prescription change subject to applicable terms and individual review.")}
                    </div>
                  </div>

                  {/* Replacement Submission Form */}
                  <div className="md:col-span-2 p-6 rounded-2xl bg-card border border-border shadow-sm">
                    <form onSubmit={handleReplacementSubmit} className="space-y-4">
                      {replacementFeedback && (
                        <div
                          className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                            replacementFeedback.success
                              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                              : "bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {replacementFeedback.success ? (
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 shrink-0" />
                          )}
                          <span>{t(replacementFeedback.message)}</span>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">
                          {t("Reason for Replacement")}
                        </label>
                        <select
                          value={replacementReason}
                          onChange={(e) => setReplacementReason(e.target.value as any)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                        >
                          <option value="accidental_damage">{t("Accidental Damage (scratched lens / broken frame)")}</option>
                          <option value="lost_item">{t("Lost or Stolen Item")}</option>
                          <option value="prescription_change">{t("Prescription Change (new optometric values)")}</option>
                          <option value="other">{t("Other Reason")}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">
                          {t("Description of Incident / Request")}
                        </label>
                        <textarea
                          rows={3}
                          value={replacementDesc}
                          onChange={(e) => setReplacementDesc(e.target.value)}
                          placeholder={t("Please describe what happened and if you want the exact same frame or a different size...")}
                          required
                          className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">
                          {t("Photo Evidence")} <span className="font-normal text-[11px]">{t("(Optional for damaged frames)")}</span>
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleEvidenceFileChange}
                          className="w-full text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/95 cursor-pointer"
                        />
                        {replacementFileName && (
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
                            {t("Attached:")} {replacementFileName}
                          </p>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={replacementSubmitting}
                        className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md hover:bg-primary/95 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {replacementSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : t("Submit Replacement Claim")}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: OPTICIAN PARTNERS */}
            {activeTab === "partners" && (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20">
                  <div className="max-w-2xl">
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                      {t("Optician Partner Directory")}
                    </span>
                    <h2 className="text-xl font-bold tracking-tight text-foreground mt-1">
                      {t("Professional Eye Exam & Centering Measurement")}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-2">
                      {t("Find optician practices in your region for exact refraction and pupillary distance (PD) measurements.")}
                    </p>
                  </div>
                </div>

                {/* Demonstration Notice */}
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <div>
                    <span className="font-bold">{t("Notice regarding partner search:")} </span>
                    {t("The optician practices listed below are demonstration records for technical validation of our local search. Direct partnership contracts are being onboarded progressively.")}
                  </div>
                </div>

                {/* Search Bar */}
                <div className="flex items-center gap-3 max-w-md">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                    <input
                      type="text"
                      value={partnerQuery}
                      onChange={(e) => {
                        setPartnerQuery(e.target.value);
                        loadPartners(e.target.value);
                      }}
                      placeholder={t("Search by city or postal code (e.g. Berlin, 10117)...")}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>

                {/* Partner Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {partners.map((partner: any) => {
                    const bName = partner.business_name || partner.businessName;
                    const address = partner.street_address || partner.address;
                    const plz = partner.postal_code || partner.postalCode;
                    const city = partner.city;
                    const phone = partner.phone || partner.contactPhone;
                    const pType = partner.partner_type || partner.partnerType || "demo_test";
                    const appUrl = partner.appointment_url || partner.appointmentUrl;

                    return (
                      <div key={partner.id} className="p-5 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="text-sm font-bold text-foreground">{bName}</h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground border border-border whitespace-nowrap">
                              {pType === "verified_partner" ? t("Verified Partner") : t("Demo Entry")}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                            <MapPin className="w-3.5 h-3.5 shrink-0 text-primary" />
                            <span>{address}, {plz} {city}</span>
                          </p>
                          {phone && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-2">
                              <Phone className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                              <span>{phone}</span>
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {partner.services?.map((srv: string) => (
                              <span key={srv} className="text-[10px] bg-muted px-2 py-0.5 rounded-md text-muted-foreground">
                                {t(srv)}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                          <a
                            href={appUrl || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                          >
                            <span>{t("Request Appointment")}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB: VIRTUAL TRY-ON */}
            {activeTab === "vto" && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-lg font-bold tracking-tight">{t("Virtual Try-On Experience")}</h2>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium border ${
                      vtoStatus?.mode === "commercial_fittingbox"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : "bg-muted text-muted-foreground border-border"
                    }`}>
                      {vtoStatus?.mode === "commercial_fittingbox" ? t("Interactive 3D Active") : t("Camera & Photo Preview")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {vtoStatus?.mode === "commercial_fittingbox"
                      ? t("Interactive 3D real-time measurement and facial alignment.")
                      : t("Upload a frontal portrait photo or use the camera for responsive frame preview.")}
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Photo Upload & Controls */}
                  <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
                    <h3 className="text-sm font-bold">{t("1. Take or upload portrait")}</h3>
                    <div className="p-4 border-2 border-dashed border-border rounded-xl text-center">
                      <Camera className="w-8 h-8 text-primary mx-auto mb-2" />
                      <p className="text-xs font-semibold text-foreground">{t("Upload photo")}</p>
                      <input
                        type="file"
                        accept="image/*"
                        id="vto-upload-input"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="vto-upload-input"
                        className="mt-3 inline-block px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs shadow-sm hover:bg-primary/95 transition cursor-pointer"
                      >
                        {t("Choose photo")}
                      </label>
                    </div>

                    <h3 className="text-sm font-bold pt-2">{t("2. Select frame")}</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { name: "Classic Acetate", img: "/classic-acetate.png" },
                        { name: "Modern Gold", img: "/modern-gold.png" },
                        { name: "Bold Black", img: "/bold-black.png" },
                      ].map((fr) => (
                        <button
                          key={fr.name}
                          type="button"
                          onClick={() => setSelectedVtoFrame(fr.img)}
                          className={`p-2 rounded-xl border text-center transition cursor-pointer ${
                            selectedVtoFrame === fr.img
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/40 bg-muted/20"
                          }`}
                        >
                          <img src={fr.img} alt={fr.name} className="h-10 mx-auto object-contain mb-1" />
                          <span className="text-[10px] font-semibold line-clamp-1">{t(fr.name)}</span>
                        </button>
                      ))}
                    </div>

                    {vtoStatus && (
                      <div className="p-3.5 rounded-xl bg-muted/30 border border-border text-[11px] text-muted-foreground space-y-1">
                        <div className="font-semibold text-foreground">
                          {vtoStatus.mode === "commercial_fittingbox" ? t("Interactive 3D Mode") : t("Native fallback mode")}
                        </div>
                        <p>{t(vtoStatus.notice)}</p>
                      </div>
                    )}
                  </div>

                  {/* Preview Canvas */}
                  <div className="lg:col-span-2 p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col items-center justify-center min-h-[360px] relative overflow-hidden">
                    {userPhoto ? (
                      <div className="relative max-w-sm w-full mx-auto aspect-[3/4] rounded-2xl overflow-hidden shadow-md">
                        <img src={userPhoto} alt="User portrait" className="w-full h-full object-cover" />
                        <div className="absolute top-[32%] left-[18%] right-[18%] pointer-events-none drop-shadow-xl animate-fade-in">
                          <img src={selectedVtoFrame} alt="Frame overlay" className="w-full" />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-8 text-muted-foreground">
                        <Eye className="w-12 h-12 mx-auto mb-3 opacity-30 text-primary" />
                        <h4 className="font-bold text-foreground text-sm">{t("Portrait Preview")}</h4>
                        <p className="text-xs max-w-xs mx-auto mt-1">
                          {t("Upload a photo above to see how signature frames fit your facial proportions.")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: MESSAGES & SUPPORT */}
            {activeTab === "messages" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold tracking-tight">{t("Customer Care Communication")}</h2>
                  <p className="text-xs text-muted-foreground">
                    {t("Direct, secure messages between you and your dedicated Lensly optician.")}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Conversation Channels */}
                  <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">{t("Topic Channel")}</h3>
                    {[
                      { id: "support", label: t("General Support"), contextId: "general" },
                      { id: "order", label: t("Order Questions"), contextId: overviewData?.orders[0]?.order_id || "ORD-2026-001" },
                      { id: "frame_request", label: t("Frame Request"), contextId: overviewData?.frameRequests[0]?.requestId || "frame-req" },
                      { id: "prescription", label: t("Prescription Advice"), contextId: "presc-general" },
                    ].map((ch) => (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => {
                          setMessageContext(ch.id as any);
                          setMessageTargetId(ch.contextId);
                        }}
                        className={`w-full p-3 rounded-xl text-left text-xs font-semibold transition cursor-pointer ${
                          messageContext === ch.id
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-muted/30 text-foreground hover:bg-muted/70"
                        }`}
                      >
                        {ch.label}
                      </button>
                    ))}
                  </div>

                  {/* Message Thread */}
                  <div className="md:col-span-2 p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between min-h-[400px]">
                    <div className="space-y-3 overflow-y-auto max-h-80 pr-2">
                      {messages.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground text-xs">
                          {t("No previous messages in this channel. Send your inquiry below and our opticians will respond within 2 hours.")}
                        </div>
                      ) : (
                        messages.map((m) => {
                          const isMe = m.senderRole === "customer";
                          return (
                            <div
                              key={m.id}
                              className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                            >
                              <div
                                className={`max-w-md p-3 rounded-xl text-xs ${
                                  isMe
                                    ? "bg-primary text-primary-foreground rounded-br-none"
                                    : "bg-muted text-foreground border border-border rounded-bl-none"
                                }`}
                              >
                                <div className="font-semibold text-[10px] opacity-80 mb-0.5">
                                  {m.senderName} ({m.senderRole})
                                </div>
                                <p className="leading-relaxed">{m.body}</p>
                              </div>
                              <span className="text-[10px] text-muted-foreground mt-1">
                                {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <form onSubmit={handleSendMessage} className="mt-4 pt-4 border-t border-border flex gap-2">
                      <input
                        type="text"
                        value={newMessageBody}
                        onChange={(e) => setNewMessageBody(e.target.value)}
                        placeholder={t("Type your message to the optical team...")}
                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={isSendingMessage || !newMessageBody.trim()}
                        className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-sm hover:bg-primary/95 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{t("Send")}</span>
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
