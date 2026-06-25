import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useLanguage } from "../lib/i18n";
import { getSubscriptions, updateSubscriptionStatus } from "../lib/api/subscriptions.functions";
import { Nav, Footer } from "./index";
import {
  Users,
  CreditCard,
  CalendarCheck,
  Search,
  Download,
  Check,
  X,
  ShieldAlert,
  Lock,
  Eye,
  LogOut,
  ArrowLeft,
  Loader2,
  FileText,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  Building2,
  FileCheck,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin-Dashboard | Lensly" },
      {
        name: "description",
        content: "Secure dashboard to manage and audit Lensly Care subscriptions.",
      },
    ],
  }),
  component: AdminPage,
});

interface SubscriptionItem {
  id?: number;
  contractId: string;
  fullName: string;
  email: string;
  paymentMethod: "sepa" | "wallet";
  maskedIban?: string;
  signatureType: "draw" | "type";
  signatureData: string;
  status: "active" | "cancelled" | "withdrawn";
  createdAt?: string;
  updatedAt?: string;
}

function AdminPage() {
  const { t } = useLanguage();

  // Authentication State
  const [unlocked, setUnlocked] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState("");

  // Subscriptions & UI State
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "cancelled" | "withdrawn">(
    "all",
  );

  // Modal State for Viewing Contract
  const [selectedSub, setSelectedSub] = useState<SubscriptionItem | null>(null);

  // Load unlock state from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("lensly_admin_unlocked");
      if (stored === "true") {
        setUnlocked(true);
      }
    }
  }, []);

  // Fetch subscriptions from the server
  const fetchSubscriptions = () => {
    setLoading(true);
    getSubscriptions()
      .then((data) => {
        setSubscriptions(data as SubscriptionItem[]);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load subscriptions:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (unlocked) {
      fetchSubscriptions();
    }
  }, [unlocked]);

  // Handle gateway verification
  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    if (passcode.trim() === "lensly2026") {
      setUnlocked(true);
      sessionStorage.setItem("lensly_admin_unlocked", "true");
    } else {
      setAuthError(t("Invalid password"));
    }
  };

  // Auto-fill passcode for developers
  const handleQuickUnlock = () => {
    setPasscode("lensly2026");
    setUnlocked(true);
    sessionStorage.setItem("lensly_admin_unlocked", "true");
  };

  const handleLogout = () => {
    setUnlocked(false);
    setPasscode("");
    sessionStorage.removeItem("lensly_admin_unlocked");
  };

  // Change user status manually in the dashboard
  const handleStatusChange = (
    contractId: string,
    email: string,
    nextStatus: "active" | "cancelled" | "withdrawn",
  ) => {
    setUpdatingId(contractId);
    updateSubscriptionStatus({
      data: {
        contractId,
        email,
        status: nextStatus,
      },
    })
      .then((success) => {
        setUpdatingId(null);
        if (success) {
          // Update local state instantly
          setSubscriptions((prev) =>
            prev.map((sub) =>
              sub.contractId === contractId
                ? { ...sub, status: nextStatus, updatedAt: new Date().toISOString() }
                : sub,
            ),
          );
        } else {
          alert(t("Failed to update status. Record not found."));
        }
      })
      .catch((err) => {
        setUpdatingId(null);
        console.error("Update error:", err);
        alert(t("An error occurred during updating status."));
      });
  };

  // Export search/filter results to CSV
  const handleExportCSV = () => {
    const csvHeaders = [
      "Contract ID",
      "Full Name",
      "Email",
      "Payment Method",
      "Masked IBAN",
      "Status",
      "Signed At",
    ];
    const rows = filteredSubscriptions.map((sub) => [
      sub.contractId,
      sub.fullName,
      sub.email,
      sub.paymentMethod,
      sub.maskedIban || "",
      sub.status,
      sub.createdAt ? new Date(sub.createdAt).toISOString() : "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        csvHeaders.join(","),
        ...rows.map((e) => e.map((val) => `"${val.replace(/"/g, '""')}"`).join(",")),
      ].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `lensly_subscriptions_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter calculations
  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch =
      sub.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.contractId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || sub.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // KPI calculations
  const totalCount = subscriptions.length;
  const activeCount = subscriptions.filter((s) => s.status === "active").length;
  const cancelledCount = subscriptions.filter((s) => s.status === "cancelled").length;
  const withdrawnCount = subscriptions.filter((s) => s.status === "withdrawn").length;

  // Print function inside modal with dynamic filename
  const handlePrintModalContract = () => {
    if (selectedSub) {
      const firstName = selectedSub.fullName.trim().split(" ")[0].toLowerCase();
      const originalTitle = document.title;
      document.title = `lensly_contract_${firstName}`;
      window.print();
      document.title = originalTitle;
    } else {
      window.print();
    }
  };

  /* ================= GATEWAY GATE LAYOUT ================= */
  if (!unlocked) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
        <Nav />
        <main className="flex-1 flex items-center justify-center px-4 py-16 grid-bg">
          <div className="w-full max-w-md bg-card border border-border p-8 rounded-2xl shadow-xl backdrop-blur-md relative overflow-hidden animate-fade-in">
            <div className="pointer-events-none absolute left-1/2 top-0 h-[150px] w-[150px] -translate-x-1/2 -translate-y-1/2 radial-glow opacity-50" />
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
                <Lock className="w-6 h-6" />
              </div>
              <h1 className="font-display text-2xl font-bold">{t("Admin Dashboard")}</h1>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                {t(
                  "Secure administrative gateway to audit customer vision plans and electronic signatures.",
                )}
              </p>
            </div>

            <form onSubmit={handleUnlock} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  {t("Enter Admin Password")}
                </label>
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full rounded-lg border border-border/80 bg-background px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                  placeholder="••••••••"
                  autoFocus
                />
              </div>

              {authError && (
                <div className="flex items-center gap-2 text-xs text-destructive border border-destructive/20 bg-destructive/5 rounded-lg p-3">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.99] cursor-pointer"
              >
                {t("Unlock")}
              </button>
            </form>

            <div className="mt-6 border-t border-border/85 pt-4 text-center">
              <button
                onClick={handleQuickUnlock}
                className="text-[11px] font-semibold text-primary hover:underline transition cursor-pointer"
              >
                {t("Unlock with default passcode (lensly2026)")}
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  /* ================= DASHBOARD CORE LAYOUT ================= */
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      {/* Printable contract overlay - only visible on window.print() */}
      {selectedSub && (
        <div
          id="printable-contract-document"
          className="hidden print:block p-8 space-y-6 text-xs text-foreground bg-white"
        >
          <div className="text-center pb-4 border-b border-gray-300">
            <h2 className="font-bold uppercase tracking-wider text-base">
              LENSLY CARE SUBSCRIPTION AGREEMENT (SIGNED)
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Contract Reference ID:{" "}
              <span className="font-mono font-semibold">{selectedSub.contractId}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 border-b border-gray-300 pb-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500 block">
                Contract ID
              </span>
              <span className="font-mono font-semibold block mt-0.5">{selectedSub.contractId}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500 block">
                Executed Timestamp
              </span>
              <span className="block mt-0.5">
                {selectedSub.createdAt ? new Date(selectedSub.createdAt).toLocaleString() : ""}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500 block">
                Subscriber
              </span>
              <span className="font-semibold block mt-0.5">{selectedSub.fullName}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500 block">
                Payment Method
              </span>
              <span className="block mt-0.5">
                {selectedSub.paymentMethod === "sepa"
                  ? `Bank Transfer (SEPA) (${selectedSub.maskedIban})`
                  : "Express Wallet (Apple/Google Pay)"}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500 block">
                Current Status
              </span>
              <span className="font-semibold block mt-0.5 uppercase">{selectedSub.status}</span>
            </div>
          </div>

          <div className="space-y-4 text-[10px] leading-relaxed text-gray-700 border-b border-gray-300 pb-4">
            <h3 className="font-bold text-gray-900 text-center uppercase tracking-wider">
              AGREEMENT TERMS & CONDITIONS
            </h3>
            <p>
              <strong>1. Contracting Parties:</strong> This agreement is entered into between Lensly
              UG (haftungsbeschränkt), Düsseldorf, Germany (the Provider) and the subscriber (the
              Customer) whose signature is attached hereto.
            </p>
            <p>
              <strong>2. Subscription Scope:</strong> The subscription provides 1 complete
              custom-made pair of prescription glasses per contract year at €29.00/month. The plan
              includes a safety net of up to 3 free prescription or accident replacements per
              subscription year.
            </p>
            <p>
              <strong>3. Term & Cancellation:</strong> This contract features a mandatory 12-month
              fixed minimum term. Ordinary cancellation prior to the end of the 12th month is
              excluded. Thereafter, the contract automatically converts into rolling monthly
              renewals cancelable at any time with 30 days notice.
            </p>
            <p>
              <strong>4. Medical MDR Device:</strong> Prescription lenses are Class I Medical
              Devices under European Medical Device Regulation (EU MDR). Lenses and frames carry CE
              conformity certifications.
            </p>
            <p>
              <strong>5. Withdrawal Waiver:</strong> Under § 312g Abs. 2 Nr. 1 BGB, the statutory
              14-day consumer right of withdrawal does not apply to goods custom-made to customer
              specifications. Right of withdrawal regarding individual custom glass routing expires
              prematurely once production begins.
            </p>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-gray-500 block mb-2">
              Authorized Electronic Signature
            </span>
            <div className="border border-dashed border-gray-400 bg-gray-50 rounded-lg h-24 flex items-center justify-center p-2 overflow-hidden max-w-sm">
              {selectedSub.signatureType === "draw" ? (
                <img
                  src={selectedSub.signatureData}
                  alt="Signature"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <span className="font-serif italic text-3xl text-gray-800 font-medium tracking-wide">
                  {selectedSub.signatureData}
                </span>
              )}
            </div>
            <div className="flex justify-between items-center mt-2 text-[8px] font-mono text-gray-500">
              <span>E-SIGNATURE COMPLIANT (eIDAS REGULATION)</span>
              <span>SHA-256: {selectedSub.contractId.replace("-", "")}CE8F...</span>
            </div>
          </div>
        </div>
      )}

      {/* Main dashboard navigation/screen wrapper */}
      <div className="flex-1 flex flex-col no-print">
        <Nav />

        {/* Dashboard inner content */}
        <main className="flex-1 mx-auto max-w-5xl w-full px-4 py-8 sm:px-6">
          {/* Section title & stats */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight">
                {t("Admin Dashboard")}
              </h1>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {t("Real-time subscribers database overview & compliance tracking.")}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchSubscriptions}
                className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-background px-3.5 py-2 text-xs font-semibold text-foreground/80 transition hover:bg-muted cursor-pointer"
              >
                <span>{t("Refresh")}</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-background/50 px-3.5 py-2 text-xs font-semibold text-destructive hover:bg-destructive/5 hover:border-destructive/20 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t("Lock")}</span>
              </button>
            </div>
          </div>

          {/* KPI grid row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-card border border-border/70 p-5 rounded-xl shadow-xs transition hover:border-primary/20">
              <div className="flex items-center justify-between text-muted-foreground mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  {t("Total Subscriptions")}
                </span>
                <Users className="w-4 h-4 text-primary/80" />
              </div>
              <div className="text-3xl font-bold">{totalCount}</div>
            </div>

            <div className="bg-card border border-border/70 p-5 rounded-xl shadow-xs transition hover:border-primary/20">
              <div className="flex items-center justify-between text-muted-foreground mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  {t("Active Subscriptions")}
                </span>
                <CalendarCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-bold text-primary">{activeCount}</div>
            </div>

            <div className="bg-card border border-border/70 p-5 rounded-xl shadow-xs transition hover:border-primary/20">
              <div className="flex items-center justify-between text-muted-foreground mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  {t("Total Terminated")}
                </span>
                <ShieldAlert className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-3xl font-bold text-amber-600">{cancelledCount}</div>
            </div>

            <div className="bg-card border border-border/70 p-5 rounded-xl shadow-xs transition hover:border-primary/20">
              <div className="flex items-center justify-between text-muted-foreground mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  {t("Withdrawn")}
                </span>
                <X className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-3xl font-bold text-rose-600">{withdrawnCount}</div>
            </div>
          </div>

          {/* Filtering bar */}
          <div className="bg-card border border-border rounded-xl p-4 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center shadow-xs">
            <div className="relative w-full md:max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder={t("Search subscribers...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-border/80 bg-background/50 pl-10 pr-4 py-2 text-xs focus:border-primary focus:outline-none"
              />
            </div>

            <div className="flex w-full md:w-auto items-center gap-3 self-stretch md:self-auto justify-end">
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as "all" | "active" | "cancelled" | "withdrawn")
                }
                className="rounded-lg border border-border/80 bg-background/80 px-3.5 py-2 text-xs font-semibold text-foreground/80 focus:border-primary focus:outline-none"
              >
                <option value="all">{t("All Statuses")}</option>
                <option value="active">{t("Active")}</option>
                <option value="cancelled">{t("Terminated")}</option>
                <option value="withdrawn">{t("Withdrawn Status")}</option>
              </select>

              <button
                onClick={handleExportCSV}
                disabled={filteredSubscriptions.length === 0}
                className="flex items-center gap-1.5 rounded-lg bg-secondary border border-border/80 px-3.5 py-2 text-xs font-semibold text-secondary-foreground hover:bg-muted transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t("Export CSV")}</span>
              </button>
            </div>
          </div>

          {/* Subscriptions Grid / Table */}
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="w-7 h-7 animate-spin text-primary" />
                <span className="text-xs">{t("Loading dashboard data...")}</span>
              </div>
            ) : filteredSubscriptions.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground text-xs">
                {t("No subscriptions found.")}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-muted-foreground/80 uppercase font-semibold tracking-wider">
                      <th className="px-5 py-3.5">{t("Contract ID")}</th>
                      <th className="px-5 py-3.5">{t("Customer")}</th>
                      <th className="px-5 py-3.5">{t("Payment Method")}</th>
                      <th className="px-5 py-3.5">{t("Signed At")}</th>
                      <th className="px-5 py-3.5">{t("Status")}</th>
                      <th className="px-5 py-3.5 text-right">{t("Actions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredSubscriptions.map((sub) => (
                      <tr key={sub.contractId} className="hover:bg-muted/15 transition-colors">
                        <td className="px-5 py-4 font-mono font-semibold text-foreground/90 whitespace-nowrap">
                          {sub.contractId}
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-semibold text-foreground">{sub.fullName}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {sub.email}
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-muted-foreground">
                          {sub.paymentMethod === "sepa" ? (
                            <div>
                              <span className="font-semibold text-foreground/80">
                                {t("SEPA Lastschrift")}
                              </span>
                              <div className="text-[10px] font-mono mt-0.5">{sub.maskedIban}</div>
                            </div>
                          ) : (
                            <span className="font-semibold text-foreground/80">
                              {t("Wallet Express")}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-muted-foreground whitespace-nowrap">
                          {sub.createdAt
                            ? new Date(sub.createdAt).toLocaleString("de-DE", {
                                dateStyle: "short",
                                timeStyle: "short",
                              })
                            : "-"}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          {sub.status === "active" && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                              <Check className="w-3 h-3" />
                              {t("Active")}
                            </span>
                          )}
                          {sub.status === "cancelled" && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-1 text-[10px] font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                              <AlertCircle className="w-3 h-3" />
                              {t("Terminated")}
                            </span>
                          )}
                          {sub.status === "withdrawn" && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-1 text-[10px] font-semibold text-rose-700 dark:bg-rose-500/20 dark:text-rose-400">
                              <X className="w-3 h-3" />
                              {t("Withdrawn Status")}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-right space-x-1">
                          <button
                            onClick={() => setSelectedSub(sub)}
                            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1.5 hover:bg-muted font-medium transition cursor-pointer"
                            title={t("View & Print Contract")}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{t("View")}</span>
                          </button>

                          <div className="inline-block relative group">
                            <button
                              disabled={updatingId === sub.contractId}
                              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 hover:bg-muted font-medium transition disabled:opacity-50 cursor-pointer"
                            >
                              <span>{t("Manage")}</span>
                              <ChevronDown className="w-3 h-3" />
                            </button>

                            <div className="absolute right-0 mt-1 z-20 hidden group-hover:block w-36 rounded-lg border border-border bg-card p-1 shadow-lg text-left">
                              {sub.status !== "active" && (
                                <button
                                  onClick={() =>
                                    handleStatusChange(sub.contractId, sub.email, "active")
                                  }
                                  className="flex w-full items-center gap-1.5 rounded-md px-2.5 py-2 hover:bg-muted transition text-emerald-600 font-semibold cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>{t("Set Active")}</span>
                                </button>
                              )}
                              {sub.status !== "cancelled" && (
                                <button
                                  onClick={() =>
                                    handleStatusChange(sub.contractId, sub.email, "cancelled")
                                  }
                                  className="flex w-full items-center gap-1.5 rounded-md px-2.5 py-2 hover:bg-muted transition text-amber-600 font-semibold cursor-pointer"
                                >
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  <span>{t("Cancel Plan")}</span>
                                </button>
                              )}
                              {sub.status !== "withdrawn" && (
                                <button
                                  onClick={() =>
                                    handleStatusChange(sub.contractId, sub.email, "withdrawn")
                                  }
                                  className="flex w-full items-center gap-1.5 rounded-md px-2.5 py-2 hover:bg-muted transition text-rose-600 font-semibold cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>{t("Withdraw")}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Audit Modal View (Standard Overlay for viewing & triggering print) */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm no-print">
          <div className="fixed inset-0" onClick={() => setSelectedSub(null)} />
          <div className="relative w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border/80 px-5 py-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <h3 className="font-display font-semibold text-sm">
                  {t("Signed Agreement Detail")}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg transition"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Modal Body (Scrollable preview of the document) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="text-center pb-4 border-b border-border/60">
                <h2 className="font-display font-bold text-foreground uppercase tracking-widest text-xs">
                  {t("LENSLY CARE SUBSCRIPTION AGREEMENT (SIGNED)")}
                </h2>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {t("Contract Reference ID")}:{" "}
                  <span className="font-mono font-semibold text-foreground">
                    {selectedSub.contractId}
                  </span>
                </p>
              </div>

              {/* Verified Metadata Info */}
              <div className="grid grid-cols-2 gap-y-3.5 gap-x-8 border-b border-border/65 pb-4 text-xs">
                <div>
                  <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">
                    {t("Contract ID")}
                  </span>
                  <span className="font-mono text-foreground font-semibold block mt-0.5">
                    {selectedSub.contractId}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">
                    {t("Executed Timestamp")}
                  </span>
                  <span className="text-foreground block mt-0.5">
                    {selectedSub.createdAt ? new Date(selectedSub.createdAt).toLocaleString() : ""}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">
                    {t("Subscriber")}
                  </span>
                  <span className="text-foreground font-medium block mt-0.5">
                    {selectedSub.fullName}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">
                    {t("Payment Method")}
                  </span>
                  <span className="text-foreground block mt-0.5">
                    {selectedSub.paymentMethod === "sepa"
                      ? `${t("SEPA Lastschrift")} (${selectedSub.maskedIban})`
                      : "Express Wallet (Apple/Google Pay)"}
                  </span>
                </div>
              </div>

              {/* Agreement Text */}
              <div className="space-y-3 text-[10px] leading-relaxed text-muted-foreground/90 border-b border-border/65 pb-4 select-text">
                <h4 className="font-bold text-foreground text-center uppercase tracking-wider">
                  {t("AGREEMENT TERMS & CONDITIONS")}
                </h4>
                <p>
                  <strong>{t("1. Contracting Parties:")}</strong>{" "}
                  {t(
                    "This agreement is entered into between Lensly UG (haftungsbeschränkt), Düsseldorf, Germany (the Provider) and the subscriber (the Customer) whose signature is attached hereto.",
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

              {/* E-Signature */}
              <div>
                <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block mb-2">
                  {t("Authorized Electronic Signature")}
                </span>
                <div className="border border-dashed border-border/80 bg-muted/30 rounded-lg h-24 flex items-center justify-center p-2 relative overflow-hidden max-w-xs">
                  {selectedSub.signatureType === "draw" ? (
                    <img
                      src={selectedSub.signatureData}
                      alt="Signature"
                      className="max-h-full max-w-full object-contain pointer-events-none select-none"
                    />
                  ) : (
                    <span className="font-serif italic text-2xl text-primary font-medium tracking-wide">
                      {selectedSub.signatureData}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center mt-2 text-[8px] font-mono text-muted-foreground">
                  <span>{t("E-SIGNATURE COMPLIANT (eIDAS REGULATION)")}</span>
                  <span>SHA-256: {selectedSub.contractId.replace("-", "")}CE8F...</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="border-t border-border bg-muted/20 px-5 py-3 flex justify-end gap-2">
              <button
                onClick={() => setSelectedSub(null)}
                className="rounded-lg border border-border px-3.5 py-1.5 text-xs font-semibold text-foreground/80 hover:bg-muted transition cursor-pointer"
              >
                {t("Close")}
              </button>
              <button
                onClick={handlePrintModalContract}
                className="rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t("Print / Save PDF")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer noPrint />
    </div>
  );
}
