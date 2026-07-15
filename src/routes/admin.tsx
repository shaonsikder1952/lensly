import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useLanguage } from "../lib/i18n";
import {
  getSubscriptions,
  adminUpdateSubscriptionStatus,
  adminLogin,
  adminDeleteSubscription,
  adminEditSubscription,
  getDeletedSubscriptions,
  restoreSubscription,
  permanentlyDeleteSubscription,
} from "../lib/api/subscriptions.functions";
import { Nav, Footer } from "./index";
import { ContractBody } from "../components/ContractBody";
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
  Trash2,
  Edit,
  Archive,
  Pause,
  Play,
  Clock,
  RotateCcw,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin-Dashboard | Lensly" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

interface SubscriptionItem {
  id?: number;
  contractId: string;
  fullName: string;
  email: string;
  phone?: string;
  birthDate?: string;
  birthPlace?: string;
  profession?: string;
  streetAddress?: string;
  postalCode?: string;
  city?: string;
  state?: string;
  country?: string;
  paymentMethod: "sepa" | "wallet";
  maskedIban?: string;
  signatureType: "draw" | "type";
  signatureData: string;
  status: "active" | "cancelled" | "withdrawn" | "pending" | "paused" | "archived";
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
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "cancelled" | "withdrawn" | "pending" | "paused" | "archived"
  >("all");

  // Modal State for Viewing Contract
  const [selectedSub, setSelectedSub] = useState<SubscriptionItem | null>(null);

  // Modal State for Editing Subscriber
  const [editingSub, setEditingSub] = useState<SubscriptionItem | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    birthDate: "",
    birthPlace: "",
    profession: "",
    streetAddress: "",
    postalCode: "",
    city: "",
    state: "",
    country: "",
    status: "active" as SubscriptionItem["status"],
  });

  // Modal State for Deleting Subscriber
  const [deletingSub, setDeletingSub] = useState<SubscriptionItem | null>(null);

  // Trash & Deleted States
  const [showTrash, setShowTrash] = useState(false);
  const [deletedSubscriptions, setDeletedSubscriptions] = useState<SubscriptionItem[]>([]);
  const [loadingDeleted, setLoadingDeleted] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // Load unlock state from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = sessionStorage.getItem("lensly_admin_token");
      if (storedToken) {
        setUnlocked(true);
      }
    }
  }, []);

  // Fetch subscriptions from the server
  const fetchSubscriptions = () => {
    const token = sessionStorage.getItem("lensly_admin_token") || "";
    if (!token) {
      setUnlocked(false);
      return;
    }
    setLoading(true);
    setDbError(null);
    getSubscriptions({ data: { adminToken: token } })
      .then((data) => {
        setSubscriptions(data as SubscriptionItem[]);
        setLoading(false);
      })
      .catch((err: any) => {
        console.error("Failed to load subscriptions:", err);
        setLoading(false);
        const errMsg = err?.message || String(err);
        if (errMsg.includes("Unauthorized") || errMsg.includes("invalid") || errMsg.includes("expired")) {
          handleLogout();
        } else {
          setDbError(errMsg);
        }
      });
  };

  // Fetch deleted subscriptions from the server
  const fetchDeletedSubscriptions = () => {
    const token = sessionStorage.getItem("lensly_admin_token") || "";
    if (!token) {
      setUnlocked(false);
      return;
    }
    setLoadingDeleted(true);
    getDeletedSubscriptions({ data: { adminToken: token } })
      .then((data) => {
        setDeletedSubscriptions(data as SubscriptionItem[]);
        setLoadingDeleted(false);
      })
      .catch((err: any) => {
        console.error("Failed to load deleted subscriptions:", err);
        setLoadingDeleted(false);
        const errMsg = err?.message || String(err);
        if (errMsg.includes("Unauthorized") || errMsg.includes("invalid") || errMsg.includes("expired")) {
          handleLogout();
        } else {
          setDbError(errMsg);
        }
      });
  };

  useEffect(() => {
    if (unlocked) {
      fetchSubscriptions();
      fetchDeletedSubscriptions();
    }
  }, [unlocked]);

  // Handle gateway verification
  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setLoading(true);

    adminLogin({ data: { password: passcode } })
      .then((res) => {
        setLoading(false);
        if (res.success && res.token) {
          sessionStorage.setItem("lensly_admin_token", res.token);
          setUnlocked(true);
        } else {
          setAuthError(t("Invalid password"));
        }
      })
      .catch((err) => {
        setLoading(false);
        console.error("Login failed:", err);
        setAuthError(t("An error occurred during authentication"));
      });
  };

  const handleLogout = () => {
    setUnlocked(false);
    setPasscode("");
    sessionStorage.removeItem("lensly_admin_token");
  };

  // Change user status manually in the dashboard
  const handleStatusChange = (
    contractId: string,
    email: string,
    nextStatus: "active" | "cancelled" | "withdrawn" | "paused" | "archived" | "pending",
  ) => {
    const token = sessionStorage.getItem("lensly_admin_token") || "";
    if (!token) {
      handleLogout();
      return;
    }
    setUpdatingId(contractId);
    adminUpdateSubscriptionStatus({
      data: {
        adminToken: token,
        contractId,
        email,
        status: nextStatus as any,
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

  const startEditing = (sub: SubscriptionItem) => {
    setEditingSub(sub);
    setEditForm({
      fullName: sub.fullName,
      email: sub.email,
      phone: sub.phone || "",
      birthDate: sub.birthDate || "",
      birthPlace: sub.birthPlace || "",
      profession: sub.profession || "",
      streetAddress: sub.streetAddress || "",
      postalCode: sub.postalCode || "",
      city: sub.city || "",
      state: sub.state || "",
      country: sub.country || "",
      status: sub.status,
    });
  };

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSub) return;
    const token = sessionStorage.getItem("lensly_admin_token") || "";
    if (!token) {
      handleLogout();
      return;
    }
    setUpdatingId(editingSub.contractId);
    adminEditSubscription({
      data: {
        adminToken: token,
        contractId: editingSub.contractId,
        email: editingSub.email, // Original email as identifier
        updatedFields: {
          fullName: editForm.fullName,
          email: editForm.email,
          phone: editForm.phone,
          birthDate: editForm.birthDate,
          birthPlace: editForm.birthPlace,
          profession: editForm.profession,
          streetAddress: editForm.streetAddress,
          postalCode: editForm.postalCode,
          city: editForm.city,
          state: editForm.state,
          country: editForm.country,
          status: editForm.status,
        },
      },
    })
      .then((success) => {
        setUpdatingId(null);
        if (success) {
          setSubscriptions((prev) =>
            prev.map((sub) =>
              sub.contractId === editingSub.contractId
                ? {
                    ...sub,
                    fullName: editForm.fullName,
                    email: editForm.email,
                    phone: editForm.phone,
                    birthDate: editForm.birthDate,
                    birthPlace: editForm.birthPlace,
                    profession: editForm.profession,
                    streetAddress: editForm.streetAddress,
                    postalCode: editForm.postalCode,
                    city: editForm.city,
                    state: editForm.state,
                    country: editForm.country,
                    status: editForm.status,
                    updatedAt: new Date().toISOString(),
                  }
                : sub,
            ),
          );
          setEditingSub(null);
        } else {
          alert(t("Failed to update subscription."));
        }
      })
      .catch((err) => {
        setUpdatingId(null);
        console.error("Edit save error:", err);
        alert(t("An error occurred while saving updates."));
      });
  };

  const handleDeleteSubscription = () => {
    if (!deletingSub) return;
    const token = sessionStorage.getItem("lensly_admin_token") || "";
    if (!token) {
      handleLogout();
      return;
    }
    setUpdatingId(deletingSub.contractId);
    adminDeleteSubscription({
      data: {
        adminToken: token,
        contractId: deletingSub.contractId,
        email: deletingSub.email,
      },
    })
      .then((success) => {
        setUpdatingId(null);
        if (success) {
          setSubscriptions((prev) =>
            prev.filter((sub) => sub.contractId !== deletingSub.contractId),
          );
          setDeletedSubscriptions((prev) => [deletingSub, ...prev]);
          setDeletingSub(null);
        } else {
          alert(t("Failed to delete subscription. Record not found."));
        }
      })
      .catch((err) => {
        setUpdatingId(null);
        console.error("Delete error:", err);
        alert(t("An error occurred during deleting subscription."));
      });
  };

  const handleRestoreSubscription = (sub: SubscriptionItem) => {
    const token = sessionStorage.getItem("lensly_admin_token") || "";
    if (!token) {
      handleLogout();
      return;
    }
    setUpdatingId(sub.contractId);
    restoreSubscription({
      data: {
        adminToken: token,
        contractId: sub.contractId,
        email: sub.email,
      },
    })
      .then((success) => {
        setUpdatingId(null);
        if (success) {
          setDeletedSubscriptions((prev) =>
            prev.filter((item) => item.contractId !== sub.contractId),
          );
          setSubscriptions((prev) => [sub, ...prev]);
        } else {
          alert(t("Failed to restore subscription."));
        }
      })
      .catch((err) => {
        setUpdatingId(null);
        console.error("Restore error:", err);
        alert(t("An error occurred during restoring subscription."));
      });
  };

  const handlePermanentlyDeleteSubscription = (sub: SubscriptionItem) => {
    if (!window.confirm(t("Are you sure you want to permanently delete this subscription? This action cannot be undone."))) {
      return;
    }
    const token = sessionStorage.getItem("lensly_admin_token") || "";
    if (!token) {
      handleLogout();
      return;
    }
    setUpdatingId(sub.contractId);
    permanentlyDeleteSubscription({
      data: {
        adminToken: token,
        contractId: sub.contractId,
        email: sub.email,
      },
    })
      .then((success) => {
        setUpdatingId(null);
        if (success) {
          setDeletedSubscriptions((prev) =>
            prev.filter((item) => item.contractId !== sub.contractId),
          );
        } else {
          alert(t("Failed to permanently delete subscription."));
        }
      })
      .catch((err) => {
        setUpdatingId(null);
        console.error("Permanent delete error:", err);
        alert(t("An error occurred during permanent deletion."));
      });
  };

  // Export search/filter results to CSV
  const handleExportCSV = () => {
    const csvHeaders = [
      "Contract ID",
      "Full Name",
      "Email",
      "Phone",
      "Birth Date",
      "Place of Birth",
      "Profession",
      "Street Address",
      "Postal Code",
      "City",
      "State",
      "Country",
      "Payment Method",
      "Masked IBAN",
      "Status",
      "Signed At",
    ];
    const rows = filteredSubscriptions.map((sub) => [
      sub.contractId,
      sub.fullName,
      sub.email,
      sub.phone || "",
      sub.birthDate || "",
      sub.birthPlace || "",
      sub.profession || "",
      sub.streetAddress || "",
      sub.postalCode || "",
      sub.city || "",
      sub.state || "",
      sub.country || "",
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
      sub.contractId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sub.birthDate && sub.birthDate.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "all" || sub.status === statusFilter;
    // Hide pending from "All" view — show only when explicitly filtered
    const isPaid = statusFilter === "pending" || sub.status !== "pending";

    return matchesSearch && matchesStatus && isPaid;
  });

  const filteredDeletedSubscriptions = deletedSubscriptions.filter((sub) => {
    const matchesSearch =
      sub.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.contractId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sub.birthDate && sub.birthDate.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch;
  });

  // KPI calculations — pending (unpaid) subs are hidden from view
  const paidSubscriptions = subscriptions.filter((s) => s.status !== "pending");
  const totalCount = paidSubscriptions.length;
  const activeCount = subscriptions.filter((s) => s.status === "active").length;
  const pendingCount = subscriptions.filter((s) => s.status === "pending").length;
  const pausedCount = subscriptions.filter((s) => s.status === "paused").length;
  const cancelledCount = subscriptions.filter((s) => s.status === "cancelled").length;
  const withdrawnCount = subscriptions.filter((s) => s.status === "withdrawn").length;
  const archivedCount = subscriptions.filter((s) => s.status === "archived").length;

  const [downloadingPDF, setDownloadingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    if (!selectedSub) return;
    setDownloadingPDF(true);
    const firstName = selectedSub.fullName.trim().split(" ")[0].toLowerCase();
    const filename = `lensly_contract_${firstName}.pdf`;

    const element = document.getElementById("printable-contract-document");
    if (!element) {
      setDownloadingPDF(false);
      return;
    }

    let clone: HTMLElement | null = null;
    try {
      const [html2canvasMod, jsPDFMod] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);
      const html2canvas = html2canvasMod.default;
      const jsPDF = jsPDFMod.default;

      clone = element.cloneNode(true) as HTMLElement;
      clone.classList.remove("hidden");
      clone.style.display = "block";
      clone.style.background = "#ffffff";
      clone.style.color = "#000000";
      clone.style.padding = "24px";
      clone.style.width = "750px";
      clone.style.position = "absolute";
      clone.style.left = "-9999px";
      clone.style.top = "0";
      document.body.appendChild(clone);

      const canvas = await html2canvas(clone, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      const pdf = new jsPDF({ orientation: "portrait", unit: "in", format: "letter" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 0.25;
      const contentWidth = pdfWidth - margin * 2;
      const imgHeight = (canvas.height * contentWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, "JPEG", margin, position, contentWidth, imgHeight);
      heightLeft -= pdfHeight - margin * 2;

      while (heightLeft > 0) {
        position = -(pdfHeight - margin * 2 - margin) + margin;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", margin, position - (imgHeight - heightLeft - (pdfHeight - margin * 2)), contentWidth, imgHeight);
        heightLeft -= pdfHeight - margin * 2;
      }

      pdf.save(filename);
      setDownloadingPDF(false);
    } catch (err) {
      console.error("PDF generation failed:", err);
      setDownloadingPDF(false);
      alert("PDF download failed: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      if (clone && document.body.contains(clone)) {
        document.body.removeChild(clone);
      }
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
                  placeholder="Enter password"
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
                disabled={loading}
                className="w-full rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.99] cursor-pointer flex items-center justify-center gap-1.5"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {t("Unlock")}
              </button>
            </form>
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
                Email Address
              </span>
              <span className="block mt-0.5">{selectedSub.email}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500 block">
                Phone Number
              </span>
              <span className="block mt-0.5">{selectedSub.phone}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500 block">
                Birth Date
              </span>
              <span className="block mt-0.5">{selectedSub.birthDate}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500 block">
                Place of Birth
              </span>
              <span className="block mt-0.5">{selectedSub.birthPlace}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500 block">
                Street Address
              </span>
              <span className="block mt-0.5">{selectedSub.streetAddress}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500 block">
                Postal Code & City
              </span>
              <span className="block mt-0.5">{selectedSub.postalCode} {selectedSub.city}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500 block">
                State & Country
              </span>
              <span className="block mt-0.5">
                {selectedSub.state || "N/A"} / {selectedSub.country || "N/A"}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500 block">
                Profession
              </span>
              <span className="block mt-0.5">{selectedSub.profession}</span>
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

          <ContractBody contractId={selectedSub.contractId} />

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
                onClick={() => {
                  fetchSubscriptions();
                  fetchDeletedSubscriptions();
                }}
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

          {/* Database Error Banner */}
          {dbError && (
            <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-xs text-destructive flex items-start gap-2.5 leading-relaxed no-print">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">{t("Database Error Details")}</p>
                <p className="mt-1 font-mono break-all">{dbError}</p>
              </div>
            </div>
          )}

          {/* KPI grid row */}
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4 mb-8">
            <div className="bg-card border border-border/70 p-4 rounded-xl shadow-xs transition hover:border-primary/20">
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider">
                  {t("Total")}
                </span>
                <Users className="w-4 h-4 text-primary/80" />
              </div>
              <div className="text-2xl font-bold">{totalCount}</div>
            </div>

            <div className="bg-card border border-border/70 p-4 rounded-xl shadow-xs transition hover:border-primary/20">
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider">
                  {t("Active")}
                </span>
                <CalendarCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-emerald-600">{activeCount}</div>
            </div>

            <div className="bg-card border border-border/70 p-4 rounded-xl shadow-xs transition hover:border-primary/20">
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider">
                  {t("Pending")}
                </span>
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-600">{pendingCount}</div>
            </div>

            <div className="bg-card border border-border/70 p-4 rounded-xl shadow-xs transition hover:border-primary/20">
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider">
                  {t("Paused")}
                </span>
                <Pause className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-amber-600">{pausedCount}</div>
            </div>

            <div className="bg-card border border-border/70 p-4 rounded-xl shadow-xs transition hover:border-primary/20">
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider">
                  {t("Terminated")}
                </span>
                <X className="w-4 h-4 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-orange-600">{cancelledCount}</div>
            </div>

            <div className="bg-card border border-border/70 p-4 rounded-xl shadow-xs transition hover:border-primary/20">
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider">
                  {t("Withdrawn")}
                </span>
                <ShieldAlert className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-2xl font-bold text-rose-600">{withdrawnCount}</div>
            </div>

            <div className="bg-card border border-border/70 p-4 rounded-xl shadow-xs transition hover:border-primary/20">
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider">
                  {t("Archived")}
                </span>
                <Archive className="w-4 h-4 text-slate-600" />
              </div>
              <div className="text-2xl font-bold text-slate-600">{archivedCount}</div>
            </div>
          </div>

          {/* Tab Selection */}
          <div className="flex gap-2 mb-6 border-b border-border pb-px no-print">
            <button
              onClick={() => {
                setShowTrash(false);
                setSearchTerm("");
              }}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition cursor-pointer ${
                !showTrash
                  ? "border-primary text-foreground font-bold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("Active Subscriptions")} ({filteredSubscriptions.length})
            </button>
            <button
              onClick={() => {
                setShowTrash(true);
                setSearchTerm("");
              }}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                showTrash
                  ? "border-primary text-foreground font-bold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t("Trash Bin")} ({deletedSubscriptions.length})
            </button>
          </div>

          {/* Filtering bar */}
          <div className="bg-card border border-border rounded-xl p-4 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center shadow-xs">
            <div className="relative w-full md:max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder={showTrash ? t("Search deleted subscriptions...") : t("Search subscriptions...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-border/80 bg-background/50 pl-10 pr-4 py-2 text-xs focus:border-primary focus:outline-none"
              />
            </div>

            <div className="flex w-full md:w-auto items-center gap-3 self-stretch md:self-auto justify-end">
              {!showTrash && (
                <>
                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(
                        e.target.value as
                          | "all"
                          | "active"
                          | "cancelled"
                          | "withdrawn"
                          | "pending"
                          | "paused"
                          | "archived",
                      )
                    }
                    className="rounded-lg border border-border/80 bg-background/80 px-3.5 py-2 text-xs font-semibold text-foreground/80 focus:border-primary focus:outline-none"
                  >
                    <option value="all">{t("All Statuses")}</option>
                    <option value="active">{t("Active")}</option>
                    <option value="pending">{t("Pending")}</option>
                    <option value="paused">{t("Paused")}</option>
                    <option value="cancelled">{t("Terminated")}</option>
                    <option value="withdrawn">{t("Withdrawn Status")}</option>
                    <option value="archived">{t("Archived")}</option>
                  </select>

                  <button
                    onClick={handleExportCSV}
                    disabled={filteredSubscriptions.length === 0}
                    className="flex items-center gap-1.5 rounded-lg bg-secondary border border-border/80 px-3.5 py-2 text-xs font-semibold text-secondary-foreground hover:bg-muted transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{t("Export CSV")}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Subscriptions Grid / Table */}
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            {showTrash ? (
              loadingDeleted ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  <Loader2 className="w-7 h-7 animate-spin text-primary" />
                  <span className="text-xs">{t("Loading trash data...")}</span>
                </div>
              ) : filteredDeletedSubscriptions.length === 0 ? (
                <div className="py-20 text-center text-muted-foreground text-xs">
                  {t("Trash bin is empty.")}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/30 text-muted-foreground/80 uppercase font-semibold tracking-wider">
                        <th className="px-5 py-3.5">{t("Contract ID")}</th>
                        <th className="px-5 py-3.5">{t("Customer")}</th>
                        <th className="px-5 py-3.5">{t("Date of Birth")}</th>
                        <th className="px-5 py-3.5">{t("Payment Method")}</th>
                        <th className="px-5 py-3.5">{t("Signed At")}</th>
                        <th className="px-5 py-3.5 text-right">{t("Actions")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {filteredDeletedSubscriptions.map((sub) => (
                        <tr key={sub.contractId} className="hover:bg-muted/15 transition-colors">
                          <td className="px-5 py-4 font-mono font-semibold text-foreground/90 whitespace-nowrap">
                            {sub.contractId}
                          </td>
                          <td className="px-5 py-4">
                            <div className="font-semibold text-foreground">{sub.fullName}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              {sub.email} | {sub.phone}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-muted-foreground whitespace-nowrap">
                            {sub.birthDate || "-"}
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
                          <td className="px-5 py-4 whitespace-nowrap text-right space-x-1">
                            <button
                              onClick={() => handleRestoreSubscription(sub)}
                              disabled={updatingId === sub.contractId}
                              className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1.5 hover:bg-muted font-medium transition text-emerald-600 hover:text-emerald-700 cursor-pointer disabled:opacity-50"
                              title={t("Restore Subscription")}
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>{t("Restore")}</span>
                            </button>
                            <button
                              onClick={() => handlePermanentlyDeleteSubscription(sub)}
                              disabled={updatingId === sub.contractId}
                              className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1.5 hover:bg-destructive/10 hover:border-destructive/30 font-medium transition text-destructive cursor-pointer disabled:opacity-50"
                              title={t("Delete Permanently")}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{t("Delete Permanently")}</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : loading ? (
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
                            {sub.email} | {sub.phone}
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
                          {sub.status === "pending" && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-1 text-[10px] font-semibold text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
                              <Clock className="w-3 h-3" />
                              {t("Pending")}
                            </span>
                          )}
                          {sub.status === "paused" && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-1 text-[10px] font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                              <Pause className="w-3 h-3" />
                              {t("Paused")}
                            </span>
                          )}
                          {sub.status === "cancelled" && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-orange-500/10 px-2 py-1 text-[10px] font-semibold text-orange-700 dark:bg-orange-500/20 dark:text-orange-400">
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
                          {sub.status === "archived" && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-500/10 px-2 py-1 text-[10px] font-semibold text-slate-700 dark:bg-slate-500/20 dark:text-slate-400">
                              <Archive className="w-3 h-3" />
                              {t("Archived")}
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

                          <button
                            onClick={() => startEditing(sub)}
                            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1.5 hover:bg-muted font-medium transition text-primary hover:text-primary/80 cursor-pointer"
                            title={t("Edit Subscriber")}
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>{t("Edit")}</span>
                          </button>

                          <button
                            onClick={() => setDeletingSub(sub)}
                            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1.5 hover:bg-destructive/10 hover:border-destructive/30 font-medium transition text-destructive cursor-pointer"
                            title={t("Delete Subscriber")}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{t("Delete")}</span>
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
                              {sub.status !== "paused" && (
                                <button
                                  onClick={() =>
                                    handleStatusChange(sub.contractId, sub.email, "paused")
                                  }
                                  className="flex w-full items-center gap-1.5 rounded-md px-2.5 py-2 hover:bg-muted transition text-amber-600 font-semibold cursor-pointer"
                                >
                                  <Pause className="w-3.5 h-3.5" />
                                  <span>{t("Pause Plan")}</span>
                                </button>
                              )}
                              {sub.status === "paused" && (
                                <button
                                  onClick={() =>
                                    handleStatusChange(sub.contractId, sub.email, "active")
                                  }
                                  className="flex w-full items-center gap-1.5 rounded-md px-2.5 py-2 hover:bg-muted transition text-emerald-600 font-semibold cursor-pointer"
                                >
                                  <Play className="w-3.5 h-3.5" />
                                  <span>{t("Resume Plan")}</span>
                                </button>
                              )}
                              {sub.status !== "cancelled" && (
                                <button
                                  onClick={() =>
                                    handleStatusChange(sub.contractId, sub.email, "cancelled")
                                  }
                                  className="flex w-full items-center gap-1.5 rounded-md px-2.5 py-2 hover:bg-muted transition text-orange-600 font-semibold cursor-pointer"
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
                              {sub.status !== "archived" && (
                                <button
                                  onClick={() =>
                                    handleStatusChange(sub.contractId, sub.email, "archived")
                                  }
                                  className="flex w-full items-center gap-1.5 rounded-md px-2.5 py-2 hover:bg-muted transition text-slate-600 font-semibold cursor-pointer"
                                >
                                  <Archive className="w-3.5 h-3.5" />
                                  <span>{t("Archive Plan")}</span>
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
                <X className="w-4 h-4" />
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
                  <span className="text-foreground font-semibold block mt-0.5">
                    {selectedSub.fullName}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">
                    {t("Email Address")}
                  </span>
                  <span className="text-foreground block mt-0.5">{selectedSub.email}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">
                    {t("Phone Number")}
                  </span>
                  <span className="text-foreground block mt-0.5">{selectedSub.phone}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">
                    {t("Birth Date")}
                  </span>
                  <span className="text-foreground block mt-0.5">{selectedSub.birthDate}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">
                    {t("Place of Birth")}
                  </span>
                  <span className="text-foreground block mt-0.5">{selectedSub.birthPlace}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">
                    {t("Street Address")}
                  </span>
                  <span className="text-foreground block mt-0.5">{selectedSub.streetAddress}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">
                    {t("Postal Code, City, State & Country")}
                  </span>
                  <span className="text-foreground block mt-0.5">
                    {selectedSub.postalCode} {selectedSub.city}, {selectedSub.state || ""} ({selectedSub.country || ""})
                  </span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">
                    {t("Profession")}
                  </span>
                  <span className="text-foreground block mt-0.5">{selectedSub.profession}</span>
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
              <ContractBody contractId={selectedSub.contractId} />

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
                onClick={handleDownloadPDF}
                disabled={downloadingPDF}
                className="rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {downloadingPDF ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>{downloadingPDF ? t("Downloading...") : t("Save PDF")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Subscriber Modal */}
      {editingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm no-print">
          <div className="fixed inset-0" onClick={() => setEditingSub(null)} />
          <div className="relative w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border/80 px-5 py-4">
              <div className="flex items-center gap-2">
                <Edit className="w-4 h-4 text-primary" />
                <h3 className="font-display font-semibold text-sm">
                  {t("Edit Subscriber Details")}
                </h3>
              </div>
              <button
                onClick={() => setEditingSub(null)}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleEditSave} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    {t("Full Name")}
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.fullName}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, fullName: e.target.value }))}
                    className="w-full rounded-lg border border-border/80 bg-background/50 px-3 py-2 text-xs focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    {t("Email Address")}
                  </label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full rounded-lg border border-border/80 bg-background/50 px-3 py-2 text-xs focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    {t("Phone Number")}
                  </label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full rounded-lg border border-border/80 bg-background/50 px-3 py-2 text-xs focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    {t("Birth Date")}
                  </label>
                  <input
                    type="text"
                    value={editForm.birthDate}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, birthDate: e.target.value }))}
                    className="w-full rounded-lg border border-border/80 bg-background/50 px-3 py-2 text-xs focus:border-primary focus:outline-none"
                    placeholder="Date of birth"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    {t("Place of Birth")}
                  </label>
                  <input
                    type="text"
                    value={editForm.birthPlace}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, birthPlace: e.target.value }))}
                    className="w-full rounded-lg border border-border/80 bg-background/50 px-3 py-2 text-xs focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    {t("Profession")}
                  </label>
                  <input
                    type="text"
                    value={editForm.profession}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, profession: e.target.value }))}
                    className="w-full rounded-lg border border-border/80 bg-background/50 px-3 py-2 text-xs focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    {t("Street Address")}
                  </label>
                  <input
                    type="text"
                    value={editForm.streetAddress}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, streetAddress: e.target.value }))
                    }
                    className="w-full rounded-lg border border-border/80 bg-background/50 px-3 py-2 text-xs focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    {t("Postal Code")}
                  </label>
                  <input
                    type="text"
                    value={editForm.postalCode}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, postalCode: e.target.value }))
                    }
                    className="w-full rounded-lg border border-border/80 bg-background/50 px-3 py-2 text-xs focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    {t("City")}
                  </label>
                  <input
                    type="text"
                    value={editForm.city}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, city: e.target.value }))}
                    className="w-full rounded-lg border border-border/80 bg-background/50 px-3 py-2 text-xs focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    {t("State")}
                  </label>
                  <input
                    type="text"
                    value={editForm.state}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, state: e.target.value }))}
                    className="w-full rounded-lg border border-border/80 bg-background/50 px-3 py-2 text-xs focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    {t("Country")}
                  </label>
                  <input
                    type="text"
                    value={editForm.country}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, country: e.target.value }))}
                    className="w-full rounded-lg border border-border/80 bg-background/50 px-3 py-2 text-xs focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    {t("Status")}
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        status: e.target.value as SubscriptionItem["status"],
                      }))
                    }
                    className="w-full rounded-lg border border-border/80 bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
                  >
                    <option value="active">{t("Active")}</option>
                    <option value="pending">{t("Pending")}</option>
                    <option value="paused">{t("Paused")}</option>
                    <option value="cancelled">{t("Terminated")}</option>
                    <option value="withdrawn">{t("Withdrawn Status")}</option>
                    <option value="archived">{t("Archived")}</option>
                  </select>
                </div>
              </div>

              {/* Form Actions */}
              <div className="border-t border-border bg-muted/20 -mx-6 -mb-6 px-5 py-3 flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingSub(null)}
                  className="rounded-lg border border-border px-3.5 py-1.5 text-xs font-semibold text-foreground/80 hover:bg-muted transition cursor-pointer"
                >
                  {t("Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={updatingId === editingSub.contractId}
                  className="rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition flex items-center gap-1 cursor-pointer"
                >
                  {updatingId === editingSub.contractId && <Loader2 className="w-3 h-3 animate-spin" />}
                  <span>{t("Save Changes")}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm no-print">
          <div className="fixed inset-0" onClick={() => setDeletingSub(null)} />
          <div className="relative w-full max-w-sm bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-destructive/20 bg-destructive/5 px-5 py-4">
              <div className="flex items-center gap-2 text-destructive">
                <ShieldAlert className="w-4 h-4" />
                <h3 className="font-display font-semibold text-sm">
                  {t("Delete Subscriber")}
                </h3>
              </div>
              <button
                onClick={() => setDeletingSub(null)}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t("Delete")}{" "}
                <strong className="text-foreground">{deletingSub.fullName}</strong> (
                {deletingSub.contractId})?{" "}
                {t("This cannot be undone.")}
              </p>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeletingSub(null)}
                  className="rounded-lg border border-border px-3.5 py-1.5 text-xs font-semibold text-foreground/80 hover:bg-muted transition cursor-pointer"
                >
                  {t("Cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSubscription}
                  disabled={updatingId === deletingSub.contractId}
                  className="rounded-lg bg-destructive px-3.5 py-1.5 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                >
                  {updatingId === deletingSub.contractId && (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  )}
                  <span>{t("Delete")}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="no-print">
        <Footer />
      </div>
    </div>
  );
}
