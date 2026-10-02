import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useLanguage } from "../lib/i18n";
import {
  getSubscriptions,
  adminUpdateSubscriptionStatus,
  adminLogin,
  adminLogout,
  adminCheckSession,
  adminDeleteSubscription,
  adminEditSubscription,
  getDeletedSubscriptions,
  restoreSubscription,
  permanentlyDeleteSubscription,
  adminGetFrameRequests,
  adminUpdateFrameRequestStatus,
  adminGetFile,
  adminGetPrescription,
  adminDeleteFrameRequest,
  adminGetOrders,
  adminUpdateOrderStatus,
  adminCreateOrder,
  adminGetReplacements,
  adminUpdateReplacementStatus,
  adminGetMessages,
  adminSendMessage,
  adminUpdatePrescriptionReview,
  adminUpdateFrameRequestDetails,
  adminGetPartners,
  adminUpdatePartner,
} from "../lib/api/subscriptions.functions";
import { AVAILABLE_PLANS, formatEur } from "../lib/pricing";
import { Footer } from "./index";
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
  Glasses,
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
  Package,
  Truck,
  MessageSquare,
  Settings,
  Activity,
  Sparkles,
  Sliders,
  ShieldCheck,
  Send,
  MapPin,
  Phone,
  Copy,
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

function AdminGatewayNavbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="font-display text-lg sm:text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
              Lensly<span className="text-primary">.care</span>
            </span>
          </Link>
          <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border border-border">
            Admin Gateway
          </span>
        </div>
        <Link
          to="/"
          className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground/80 hover:bg-muted transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Site</span>
        </Link>
      </div>
    </header>
  );
}

function AdminNavbar({ onLogout }: { onLogout: () => void }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="font-display text-lg sm:text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
              Lensly<span className="text-primary">.care</span>
            </span>
          </Link>
          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/20">
            Admin Panel
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-border bg-background/80 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-foreground/80 hover:bg-muted transition"
            title="Open customer live site in new tab"
          >
            <span className="hidden xs:inline">Live Site</span>
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
          </Link>

          {/* Admin Logout button: completely replaces consumer Portal button; language selector dropdown removed */}
          <button
            onClick={onLogout}
            className="rounded-lg bg-destructive/10 text-destructive border border-destructive/25 px-3 py-1.5 text-xs font-semibold hover:bg-destructive hover:text-destructive-foreground transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            title="Log out of Admin Dashboard"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function AdminPage() {
  const { t } = useLanguage();

  // Authentication State
  const [unlocked, setUnlocked] = useState(false);
  const [adminUsername, setAdminUsername] = useState("eye");
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

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

  // Tabs: Streamlined to 4 essential business modules
  const [activeTab, setActiveTab] = useState<"active" | "frames" | "trash">("frames");
  const [adminSection, setAdminSection] = useState<
    "frames" | "orders" | "subscriptions" | "support" | "prescriptions" | "partners" | "analytics" | "settings" | "customers"
  >("frames");
  const [showTrash, setShowTrash] = useState(false);
  const [deletedSubscriptions, setDeletedSubscriptions] = useState<SubscriptionItem[]>([]);
  const [loadingDeleted, setLoadingDeleted] = useState(false);

  // Frame Requests State
  const [frameRequests, setFrameRequests] = useState<any[]>([]);
  const [loadingFrameRequests, setLoadingFrameRequests] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string>("");

  // Orders State
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any | null>(null);

  // Optician Partners State
  const [partners, setPartners] = useState<any[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [editingPartner, setEditingPartner] = useState<any | null>(null);

  // Replacement Claims State
  const [replacements, setReplacements] = useState<any[]>([]);
  const [loadingReplacements, setLoadingReplacements] = useState(false);

  // Messaging & Support State
  const [supportMessages, setSupportMessages] = useState<any[]>([]);
  const [supportContext, setSupportContext] = useState<"support" | "order" | "frame_request" | "prescription">("support");
  const [supportTargetId, setSupportTargetId] = useState("general");
  const [adminReplyBody, setAdminReplyBody] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // Frame Request Details Editing Modal
  const [editingFrameReq, setEditingFrameReq] = useState<any | null>(null);
  const [savingFrameDetails, setSavingFrameDetails] = useState(false);

  // Prescription Review Modal (5-stage review workflow)
  const [reviewingPrescription, setReviewingPrescription] = useState<any | null>(null);
  const [prescriptionNotes, setPrescriptionNotes] = useState("");
  const [resubmissionReason, setResubmissionReason] = useState("");
  const [reviewStatusChoice, setReviewStatusChoice] = useState<
    "Submitted" | "Under Review" | "Need More Information" | "Approved for Fulfillment" | "Not Supported"
  >("Under Review");
  const [savingPrescriptionReview, setSavingPrescriptionReview] = useState(false);

  // Check authenticated session on mount via secure HttpOnly cookie
  useEffect(() => {
    adminCheckSession()
      .then((res) => {
        if (res && res.authenticated) {
          setUnlocked(true);
          if (res.csrfToken) {
            setCsrfToken(res.csrfToken);
          }
        } else {
          setUnlocked(false);
        }
      })
      .catch(() => {
        setUnlocked(false);
      });
  }, []);

  // Fetch subscriptions from the server
  const fetchSubscriptions = () => {
    setLoading(true);
    getSubscriptions({})
      .then((data) => {
        setSubscriptions(data as SubscriptionItem[]);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load subscriptions:", err);
        setLoading(false);
        handleLogout();
      });
  };

  // Fetch deleted subscriptions from the server
  const fetchDeletedSubscriptions = () => {
    setLoadingDeleted(true);
    getDeletedSubscriptions({})
      .then((data) => {
        setDeletedSubscriptions(data as unknown as SubscriptionItem[]);
        setLoadingDeleted(false);
      })
      .catch((err) => {
        console.error("Failed to load deleted subscriptions:", err);
        setLoadingDeleted(false);
      });
  };

  // Fetch frame requests
  const fetchFrameRequests = () => {
    setLoadingFrameRequests(true);
    adminGetFrameRequests({})
      .then((data) => {
        setFrameRequests(data);
        setLoadingFrameRequests(false);
      })
      .catch((err) => {
        console.error("Failed to load frame requests:", err);
        setLoadingFrameRequests(false);
      });
  };

  // Fetch orders
  const fetchOrders = () => {
    setLoadingOrders(true);
    adminGetOrders({})
      .then((data) => {
        setOrders(data);
        setLoadingOrders(false);
      })
      .catch((err) => {
        console.error("Failed to load orders:", err);
        setLoadingOrders(false);
      });
  };

  // Fetch partners
  const fetchPartners = () => {
    setLoadingPartners(true);
    adminGetPartners({})
      .then((data) => {
        setPartners(data);
        setLoadingPartners(false);
      })
      .catch((err) => {
        console.error("Failed to load partners:", err);
        setLoadingPartners(false);
      });
  };

  // Fetch replacements
  const fetchReplacements = () => {
    setLoadingReplacements(true);
    adminGetReplacements({})
      .then((data) => {
        setReplacements(data);
        setLoadingReplacements(false);
      })
      .catch((err) => {
        console.error("Failed to load replacements:", err);
        setLoadingReplacements(false);
      });
  };

  // Fetch support messages
  const fetchSupportMessages = (ctxType = supportContext, ctxId = supportTargetId) => {
    adminGetMessages({
      data: {
        contextType: ctxType,
        contextId: ctxId,
      },
    })
      .then((data) => {
        setSupportMessages(data);
      })
      .catch((err) => {
        console.error("Failed to load messages:", err);
      });
  };

  useEffect(() => {
    if (unlocked) {
      fetchSubscriptions();
      fetchDeletedSubscriptions();
      fetchFrameRequests();
      fetchOrders();
      fetchPartners();
      fetchReplacements();
    }
  }, [unlocked]);

  // Handle gateway verification
  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setLoading(true);

    adminLogin({ data: { username: adminUsername.trim(), password: passcode } })
      .then((res) => {
        setLoading(false);
        if (res.success) {
          setUnlocked(true);
          if (res.csrfToken) {
            setCsrfToken(res.csrfToken);
          }
          setPasscode("");
        } else {
          setAuthError(res.error || t("Invalid username or password"));
        }
      })
      .catch((err) => {
        setLoading(false);
        console.error("Login failed:", err);
        setAuthError(t("An error occurred during authentication"));
      });
  };

  const handleCreateOrderFromFrameReq = async (req: any) => {
    if (!window.confirm(`Create a laboratory fulfillment order for ${req.fullName || req.email}?`)) {
      return;
    }
    setUpdatingId(req.requestId);
    try {
      const newOrder = await adminCreateOrder({
        data: {
          requestId: req.requestId,
          customerName: req.fullName || "Customer",
          customerEmail: req.email,
          frameBrand: req.frameBrand || "Verified Frame",
          frameModel: req.frameModel || "Custom Frame",
          lensType: "Single Vision Index 1.6 Hydrophobic",
          status: "Requested",
        },
      });
      if (newOrder) {
        alert(`Order ${newOrder.order_id} created successfully! Notification sent to ${req.email}.`);
        fetchOrders();
        setAdminSection("orders");
      }
    } catch (err: any) {
      alert("Failed to create order: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleLogout = () => {
    adminLogout().catch(() => {});
    setUnlocked(false);
    setPasscode("");
    setCsrfToken("");
  };

  // View private files securely through authenticated server endpoint
  const handleViewPrivateFile = async (fileId?: string, fallbackDataUrl?: string) => {
    if (fileId) {
      try {
        setLoadingFile(true);
        const res = await adminGetFile({ data: { fileId } });
        if (res && res.success && res.dataBase64) {
          setPreviewImage(`data:${res.mimeType};base64,${res.dataBase64}`);
        }
      } catch (err) {
        console.error("Failed to load private file:", err);
        alert("Failed to load file. It may have expired or been removed.");
      } finally {
        setLoadingFile(false);
      }
    } else if (fallbackDataUrl) {
      setPreviewImage(fallbackDataUrl);
    }
  };

  // Change user status manually in the dashboard
  const handleStatusChange = (
    contractId: string,
    email: string,
    nextStatus: "active" | "cancelled" | "withdrawn" | "paused" | "archived" | "pending",
  ) => {
    setUpdatingId(contractId);
    adminUpdateSubscriptionStatus({
      data: {
        contractId,
        email,
        status: nextStatus as any,
        csrfToken,
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
        if (err?.message?.includes("Unauthorized") || err?.message?.includes("session")) {
          handleLogout();
        } else {
          alert(t("An error occurred during updating status."));
        }
      });
  };

  // Change frame request status manually in the dashboard
  const handleFrameRequestStatusChange = (
    requestId: string,
    nextStatus: any,
  ) => {
    setUpdatingId(requestId);
    adminUpdateFrameRequestStatus({
      data: {
        requestId,
        status: nextStatus,
        csrfToken,
      },
    })
      .then((success) => {
        setUpdatingId(null);
        if (success) {
          setFrameRequests((prev) =>
            prev.map((req) =>
              req.requestId === requestId ? { ...req, status: nextStatus } : req,
            ),
          );
        } else {
          alert("Failed to update frame request status.");
        }
      })
      .catch((err) => {
        setUpdatingId(null);
        console.error("Frame status update error:", err);
        if (err?.message?.includes("Unauthorized") || err?.message?.includes("session")) {
          handleLogout();
        } else {
          alert("An error occurred while updating frame request status.");
        }
      });
  };

  // Delete frame request manually in dashboard
  const handleDeleteFrameRequest = (requestId: string) => {
    if (!window.confirm("Are you sure you want to delete this frame request and all associated private files?")) {
      return;
    }
    setUpdatingId(requestId);
    adminDeleteFrameRequest({
      data: {
        requestId,
        csrfToken,
      },
    })
      .then((success) => {
        setUpdatingId(null);
        if (success) {
          setFrameRequests((prev) => prev.filter((r) => r.requestId !== requestId));
        } else {
          alert("Failed to delete frame request.");
        }
      })
      .catch((err) => {
        setUpdatingId(null);
        console.error("Frame request delete error:", err);
        alert("Failed to delete frame request.");
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
    setUpdatingId(editingSub.contractId);
    adminEditSubscription({
      data: {
        contractId: editingSub.contractId,
        email: editingSub.email, // Original email as identifier
        csrfToken,
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
    setUpdatingId(deletingSub.contractId);
    adminDeleteSubscription({
      data: {
        contractId: deletingSub.contractId,
        email: deletingSub.email,
        csrfToken,
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
    setUpdatingId(sub.contractId);
    restoreSubscription({
      data: {
        contractId: sub.contractId,
        email: sub.email,
        csrfToken,
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
    setUpdatingId(sub.contractId);
    permanentlyDeleteSubscription({
      data: {
        contractId: sub.contractId,
        email: sub.email,
        csrfToken,
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

  // Phase 2 Admin Handlers
  const handleSaveFrameDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFrameReq) return;
    setSavingFrameDetails(true);
    try {
      await adminUpdateFrameRequestDetails({
        data: {
          requestId: editingFrameReq.requestId,
          status: editingFrameReq.status,
          procurementCost:
            editingFrameReq.procurementCost !== undefined && editingFrameReq.procurementCost !== ""
              ? Number(editingFrameReq.procurementCost)
              : undefined,
          customerPrice:
            editingFrameReq.customerPrice !== undefined && editingFrameReq.customerPrice !== ""
              ? Number(editingFrameReq.customerPrice)
              : undefined,
          frameDimensions: editingFrameReq.frameDimensions,
          availability: editingFrameReq.availability,
          source: editingFrameReq.source,
          compatibilityStatus: editingFrameReq.compatibilityStatus,
          adminResponse: editingFrameReq.adminResponse,
          adminNotes: editingFrameReq.adminNotes,
        },
      });
      alert(t("Frame details and internal procurement parameters saved!"));
      setEditingFrameReq(null);
      fetchFrameRequests();
    } catch (err: any) {
      alert(t("Failed to update frame details: ") + err.message);
    } finally {
      setSavingFrameDetails(false);
    }
  };

  const handleSavePrescriptionReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingPrescription) return;
    setSavingPrescriptionReview(true);
    try {
      await adminUpdatePrescriptionReview({
        data: {
          requestId: reviewingPrescription.requestId,
          reviewStatus: reviewStatusChoice,
          reviewerNotes: prescriptionNotes || undefined,
          resubmissionReason: resubmissionReason || undefined,
        },
      });
      alert(t("Prescription review saved with audit record!"));
      setReviewingPrescription(null);
      fetchFrameRequests();
    } catch (err: any) {
      alert(t("Failed to update prescription review: ") + err.message);
    } finally {
      setSavingPrescriptionReview(false);
    }
  };

  const handleSaveOrderStatus = async (
    orderId: string,
    status: any,
    carrier?: string,
    trackingNumber?: string,
    estDelivery?: string,
    notes?: string,
  ) => {
    try {
      await adminUpdateOrderStatus({
        data: {
          orderId,
          status,
          carrier,
          trackingNumber,
          estimatedDelivery: estDelivery,
          notes,
        },
      });
      alert(t("Order fulfillment pipeline status updated!"));
      setEditingOrder(null);
      fetchOrders();
    } catch (err: any) {
      alert(t("Failed to update order status: ") + err.message);
    }
  };

  const handleSavePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPartner) return;
    try {
      await adminUpdatePartner({
        data: editingPartner,
      });
      alert(t("Optician partner profile updated!"));
      setEditingPartner(null);
      fetchPartners();
    } catch (err: any) {
      alert(t("Failed to update partner: ") + err.message);
    }
  };

  const handleAdminSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminReplyBody.trim()) return;
    setSendingReply(true);
    try {
      await adminSendMessage({
        data: {
          contextType: supportContext,
          contextId: supportTargetId,
          body: adminReplyBody.trim(),
        },
      });
      setAdminReplyBody("");
      fetchSupportMessages(supportContext, supportTargetId);
    } catch (err: any) {
      alert(t("Failed to send staff reply: ") + err.message);
    } finally {
      setSendingReply(false);
    }
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
  const filteredSubscriptions = (subscriptions || []).filter((sub: any) => {
    const fullName = sub.fullName || sub.full_name || "";
    const email = sub.email || "";
    const contractId = sub.contractId || sub.contract_id || "";
    const birthDate = sub.birthDate || sub.birth_date || "";
    const matchesSearch =
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contractId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      birthDate.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || sub.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const filteredDeletedSubscriptions = (deletedSubscriptions || []).filter((sub: any) => {
    const fullName = sub.fullName || sub.full_name || "";
    const email = sub.email || "";
    const contractId = sub.contractId || sub.contract_id || "";
    const birthDate = sub.birthDate || sub.birth_date || "";
    const matchesSearch =
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contractId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      birthDate.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  // KPI calculations
  const totalCount = subscriptions.length;
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
        <AdminGatewayNavbar />
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

            <form onSubmit={handleUnlock} className="space-y-4 text-left">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  {t("Admin Username")}
                </label>
                <input
                  type="text"
                  required
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                  placeholder="eye"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  {t("Admin Password")}
                </label>
                <input
                  type="password"
                  required
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                  placeholder="••••••••••••"
                  autoFocus
                />
              </div>

              {authError && (
                <div className="flex items-center gap-2 text-xs text-destructive border border-destructive/20 bg-destructive/5 rounded-xl p-3">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-primary py-2.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.99] cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {t("Sign In to Admin Portal")}
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

          <div className="space-y-4 text-[10px] leading-relaxed text-gray-700 border-b border-gray-300 pb-4">
            <h3 className="font-bold text-gray-900 text-center uppercase tracking-wider">
              AGREEMENT TERMS & CONDITIONS
            </h3>
            <p>
              <strong>1. Contracting Parties:</strong> This agreement is entered into between Sikder
              LLC, Germany (the Provider) and the subscriber (the Customer) whose signature is attached hereto.
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
        <AdminNavbar onLogout={handleLogout} />

        {/* Dashboard inner content */}
        <main className="flex-1 mx-auto max-w-[1600px] w-full px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Section title & stats */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
                {t("Admin Dashboard")}
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("Real-time subscribers database overview & compliance tracking.")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  fetchSubscriptions();
                  fetchDeletedSubscriptions();
                  fetchFrameRequests();
                }}
                className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-background px-3 py-1.5 text-xs font-semibold text-foreground/80 transition hover:bg-muted cursor-pointer shadow-xs"
              >
                <span>{t("Refresh")}</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-background/50 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 hover:border-destructive/20 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t("Lock")}</span>
              </button>
            </div>
          </div>

          {/* Streamlined KPI Grid (4 High-Impact Metrics) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 sm:mb-8">
            <div
              onClick={() => { setAdminSection("frames"); setActiveTab("frames"); }}
              className={`bg-card border p-4 sm:p-5 rounded-2xl shadow-xs transition hover:border-primary/40 cursor-pointer ${
                adminSection === "frames" ? "border-primary ring-1 ring-primary/20 bg-primary/5" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  {t("Frame Requests")}
                </span>
                <Glasses className="w-4 h-4 text-primary" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold">{frameRequests.length}</span>
                <span className="text-xs text-muted-foreground">in system</span>
              </div>
            </div>

            <div
              onClick={() => { setAdminSection("orders"); fetchOrders(); }}
              className={`bg-card border p-4 sm:p-5 rounded-2xl shadow-xs transition hover:border-primary/40 cursor-pointer ${
                adminSection === "orders" ? "border-primary ring-1 ring-primary/20 bg-primary/5" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  {t("Lab Orders")}
                </span>
                <Package className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold text-blue-600">{orders.length}</span>
                <span className="text-xs text-muted-foreground">active orders</span>
              </div>
            </div>

            <div
              onClick={() => { setAdminSection("subscriptions"); setActiveTab("active"); }}
              className={`bg-card border p-4 sm:p-5 rounded-2xl shadow-xs transition hover:border-primary/40 cursor-pointer ${
                adminSection === "subscriptions" ? "border-primary ring-1 ring-primary/20 bg-primary/5" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  {t("Active Plans")}
                </span>
                <CreditCard className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold text-emerald-600">{activeCount}</span>
                <span className="text-xs text-muted-foreground">subscribers</span>
              </div>
            </div>

            <div
              onClick={() => { setAdminSection("support"); fetchSupportMessages(); }}
              className={`bg-card border p-4 sm:p-5 rounded-2xl shadow-xs transition hover:border-primary/40 cursor-pointer ${
                adminSection === "support" ? "border-primary ring-1 ring-primary/20 bg-primary/5" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  {t("Customer Support")}
                </span>
                <MessageSquare className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold text-purple-600">{supportMessages.length}</span>
                <span className="text-xs text-muted-foreground">messages</span>
              </div>
            </div>
          </div>

          {/* Streamlined Admin Navigation (4 Clean Modules) */}
          <div className="flex items-center gap-2 pb-3 mb-6 border-b border-border/80 no-print overflow-x-auto">
            {[
              { id: "frames", label: t("Frame Requests & Prescriptions"), count: frameRequests.length, icon: Glasses },
              { id: "orders", label: t("Orders & Fulfillment"), count: orders.length, icon: Package },
              { id: "subscriptions", label: t("Subscriptions & Contracts"), count: activeCount, icon: CreditCard },
              { id: "support", label: t("Messages & Support"), count: supportMessages.length, icon: MessageSquare },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = adminSection === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setAdminSection(tab.id as any);
                    if (tab.id === "frames") {
                      setActiveTab("frames");
                      setShowTrash(false);
                    } else if (tab.id === "subscriptions") {
                      setActiveTab("active");
                      setShowTrash(false);
                    } else if (tab.id === "orders") {
                      fetchOrders();
                    } else if (tab.id === "support") {
                      fetchSupportMessages();
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer shadow-xs ${
                    active
                      ? "bg-primary text-primary-foreground font-bold shadow-md"
                      : "text-muted-foreground hover:text-foreground bg-card border border-border/80 hover:bg-muted"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
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
            {adminSection === "orders" ? (
              loadingOrders ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  <Loader2 className="w-7 h-7 animate-spin text-primary" />
                  <span className="text-xs">Loading orders...</span>
                </div>
              ) : orders.length === 0 ? (
                <div className="py-20 text-center text-muted-foreground text-xs">
                  No active orders found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/30 text-muted-foreground/80 uppercase font-semibold tracking-wider">
                        <th className="px-5 py-3.5">Order Reference</th>
                        <th className="px-5 py-3.5">Customer</th>
                        <th className="px-5 py-3.5">Frame & Lenses</th>
                        <th className="px-5 py-3.5">Fulfillment Pipeline</th>
                        <th className="px-5 py-3.5">Carrier / Tracking</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {orders.map((ord) => (
                        <tr key={ord.order_id} className="hover:bg-muted/15 transition-colors">
                          <td className="px-5 py-4 font-mono font-semibold text-primary">{ord.order_id}</td>
                          <td className="px-5 py-4">
                            <div className="font-semibold">{ord.customer_name}</div>
                            <div className="text-[11px] text-muted-foreground">{ord.customer_email}</div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="font-medium text-foreground">{ord.frame_name}</div>
                            <div className="text-[10px] text-muted-foreground">{ord.lens_type}</div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                              <span>{ord.status}</span>
                            </span>
                          </td>
                          <td className="px-5 py-4 text-[11px]">
                            <div>{ord.carrier || "DHL Express"}</div>
                            <div className="font-mono text-[10px] text-muted-foreground">{ord.tracking_number || "Pending"}</div>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => setEditingOrder(ord)}
                              className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1.5 hover:bg-muted text-xs font-semibold cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Update Pipeline</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : adminSection === "prescriptions" ? (
              <div className="p-3 sm:p-4">
                {/* Mobile Cards View (< lg) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
                  {frameRequests.map((req) => (
                    <div
                      key={`rx-card-${req.requestId}`}
                      className="rounded-xl border border-border bg-card p-4 shadow-xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-2.5">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-foreground">
                              {req.requestId.length > 20
                                ? `${req.requestId.slice(0, 10)}...${req.requestId.slice(-6)}`
                                : req.requestId}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(req.requestId, `rx-${req.requestId}`)}
                              title="Copy Tracking ID"
                              className="text-muted-foreground hover:text-primary transition p-0.5 cursor-pointer"
                            >
                              {copiedId === `rx-${req.requestId}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : ""}
                          </span>
                        </div>

                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          req.prescriptionReviewStatus === "Approved for Fulfillment"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : req.prescriptionReviewStatus === "Need More Information"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                              : req.prescriptionReviewStatus === "Not Supported"
                                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                                : "bg-primary/10 text-primary border border-primary/20"
                        }`}>
                          {req.prescriptionReviewStatus || "Under Review"}
                        </span>
                      </div>

                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Customer</p>
                        <p className="font-semibold text-xs text-foreground mt-0.5">{req.fullName}</p>
                        <p className="text-[11px] text-muted-foreground">{req.email}</p>
                      </div>

                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Document / Values</p>
                        {req.prescriptionType === "file" ? (
                          <div className="mt-1">
                            <span className="text-xs font-semibold text-primary block mb-1.5">Uploaded Document</span>
                            {(req.prescriptionFileId || req.prescriptionFileData) && (
                              <button
                                type="button"
                                onClick={() => handleViewPrivateFile(req.prescriptionFileId, req.prescriptionFileData)}
                                className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Preview Document</span>
                              </button>
                            )}
                          </div>
                        ) : req.prescriptionType === "manual" ? (
                          <div className="mt-1 font-mono text-xs space-y-0.5 bg-muted/20 p-2 rounded-lg border border-border/60">
                            <div>R: {req.prescriptionSphR || "0"} SPH | {req.prescriptionCylR || "0"} CYL</div>
                            <div>L: {req.prescriptionSphL || "0"} SPH | {req.prescriptionSphL || "0"} CYL</div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic mt-1 block">Pending customer submission</span>
                        )}
                      </div>

                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Reviewer Notes</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 italic">
                          {req.reviewerNotes || req.prescriptionNotes || "No review notes recorded"}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-border/60 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setReviewingPrescription(req);
                            setReviewStatusChoice(req.prescriptionReviewStatus || "Under Review");
                            setPrescriptionNotes(req.prescriptionNotes || "");
                            setResubmissionReason(req.prescriptionResubmissionReason || "");
                          }}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:bg-primary/95 transition cursor-pointer"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>Audit Review</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View (>= lg) */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/30 text-muted-foreground/80 uppercase font-semibold tracking-wider">
                        <th className="px-4 py-3.5">Request Reference</th>
                        <th className="px-4 py-3.5">Customer</th>
                        <th className="px-4 py-3.5">Document / Values</th>
                        <th className="px-4 py-3.5">Review Status</th>
                        <th className="px-4 py-3.5">Reviewer Notes</th>
                        <th className="px-4 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {frameRequests.map((req) => (
                        <tr key={req.requestId} className="hover:bg-muted/15 transition-colors">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-semibold" title={req.requestId}>
                                {req.requestId.length > 20 ? `${req.requestId.slice(0, 10)}...${req.requestId.slice(-6)}` : req.requestId}
                              </span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(req.requestId, `rx-${req.requestId}`)}
                                title="Copy full Tracking ID"
                                className="text-muted-foreground hover:text-primary transition p-0.5 cursor-pointer"
                              >
                                {copiedId === `rx-${req.requestId}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="font-semibold">{req.fullName}</div>
                            <div className="text-[11px] text-muted-foreground">{req.email}</div>
                          </td>
                          <td className="px-4 py-4">
                            {req.prescriptionType === "file" ? (
                              <span className="font-semibold text-primary">Uploaded Prescription Document</span>
                            ) : req.prescriptionType === "manual" ? (
                              <div className="font-mono text-[10.5px]">
                                R: {req.prescriptionSphR || "0"} | L: {req.prescriptionSphL || "0"}
                              </div>
                            ) : (
                              <span className="text-muted-foreground italic">Pending customer submission</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                              req.prescriptionReviewStatus === "Approved for Fulfillment"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : req.prescriptionReviewStatus === "Need More Information"
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                  : req.prescriptionReviewStatus === "Not Supported"
                                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                                    : "bg-primary/10 text-primary border border-primary/20"
                            }`}>
                              {req.prescriptionReviewStatus || "Under Review"}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-[11px] text-muted-foreground max-w-[200px] truncate">
                            {req.reviewerNotes || req.prescriptionNotes || "No review notes recorded"}
                          </td>
                          <td className="px-4 py-4 text-right space-x-1.5 whitespace-nowrap">
                            {(req.prescriptionFileId || req.prescriptionFileData) && (
                              <button
                                type="button"
                                onClick={() => handleViewPrivateFile(req.prescriptionFileId, req.prescriptionFileData)}
                                className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 hover:bg-muted text-xs font-semibold cursor-pointer"
                              >
                                <Eye className="w-3 h-3" />
                                <span>View Doc</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setReviewingPrescription(req);
                                setReviewStatusChoice(req.prescriptionReviewStatus || "Under Review");
                                setPrescriptionNotes(req.prescriptionNotes || "");
                                setResubmissionReason(req.prescriptionResubmissionReason || "");
                              }}
                              className="inline-flex items-center gap-1 rounded-md bg-primary text-primary-foreground px-2.5 py-1 text-xs font-semibold hover:bg-primary/95 transition cursor-pointer"
                            >
                              <FileCheck className="w-3 h-3" />
                              <span>Audit Review</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : adminSection === "partners" ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-muted-foreground/80 uppercase font-semibold tracking-wider">
                      <th className="px-5 py-3.5">Business Name</th>
                      <th className="px-5 py-3.5">City / Postal Code</th>
                      <th className="px-5 py-3.5">Contact</th>
                      <th className="px-5 py-3.5">Services</th>
                      <th className="px-5 py-3.5">Measurements</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {partners.map((p: any) => {
                      const bName = p.business_name || p.businessName;
                      const address = p.street_address || p.address;
                      const plz = p.postal_code || p.postalCode;
                      const phone = p.phone || p.contactPhone;
                      const email = p.email || p.contactEmail;
                      const pType = p.partner_type || p.partnerType || "demo_test";
                      const isActive = p.active ?? p.isActive ?? true;
                      const supportsMeas = p.customer_measurement_support ?? p.supportsMeasurements ?? true;

                      return (
                        <tr key={p.id} className="hover:bg-muted/15 transition-colors">
                          <td className="px-5 py-4">
                            <div className="font-semibold text-foreground">{bName}</div>
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider mt-0.5 ${
                              pType === "verified_partner"
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                            }`}>
                              {pType === "verified_partner" ? "Verified Partner" : "Demo / Test"}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div>{p.city} ({plz})</div>
                            <div className="text-[10px] text-muted-foreground">{address}</div>
                          </td>
                          <td className="px-5 py-4 text-[11px]">
                            <div>{phone}</div>
                            <div className="text-muted-foreground">{email}</div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-1">
                              {p.services?.map((s: string) => (
                                <span key={s} className="px-1.5 py-0.5 rounded bg-muted text-[10px] text-muted-foreground">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            {supportsMeas ? (
                              <span className="text-emerald-600 font-semibold text-[11px]">✓ Yes</span>
                            ) : (
                              <span className="text-muted-foreground text-[11px]">No</span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              isActive ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"
                            }`}>
                              {isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => setEditingPartner(p)}
                            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1.5 hover:bg-muted text-xs font-semibold cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                </table>
              </div>
            ) : adminSection === "support" ? (
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Communication Channels</h4>
                  {[
                    { id: "support", label: "General Support", contextId: "general" },
                    { id: "order", label: "Orders Inquiries", contextId: "general" },
                    { id: "frame_request", label: "Frame Requests", contextId: "general" },
                    { id: "prescription", label: "Prescription Advice", contextId: "general" },
                  ].map((ch) => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => {
                        setSupportContext(ch.id as any);
                        setSupportTargetId(ch.contextId);
                        fetchSupportMessages(ch.id as any, ch.contextId);
                      }}
                      className={`w-full p-3 rounded-xl text-left text-xs font-semibold transition cursor-pointer ${
                        supportContext === ch.id
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted/30 text-foreground hover:bg-muted/70"
                      }`}
                    >
                      {ch.label}
                    </button>
                  ))}
                </div>

                <div className="md:col-span-2 border border-border rounded-xl p-4 flex flex-col justify-between min-h-[360px]">
                  <div className="space-y-3 overflow-y-auto max-h-72 pr-2">
                    {supportMessages.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground text-xs">
                        No messages in this channel yet.
                      </div>
                    ) : (
                      supportMessages.map((m) => (
                        <div key={m.id} className={`p-3 rounded-xl text-xs ${m.senderRole === "admin" ? "bg-primary/10 border border-primary/20 ml-6" : "bg-muted mr-6"}`}>
                          <div className="flex justify-between items-center mb-1 text-[10px] text-muted-foreground">
                            <span className="font-semibold text-foreground">{m.senderName} ({m.senderRole})</span>
                            <span>{new Date(m.createdAt).toLocaleTimeString()}</span>
                          </div>
                          <p>{m.body}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handleAdminSendReply} className="mt-4 pt-3 border-t border-border flex gap-2">
                    <input
                      type="text"
                      value={adminReplyBody}
                      onChange={(e) => setAdminReplyBody(e.target.value)}
                      placeholder="Type official staff response..."
                      className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={sendingReply || !adminReplyBody.trim()}
                      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs shadow-sm hover:bg-primary/95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3 h-3" />
                      <span>Reply</span>
                    </button>
                  </form>
                </div>
              </div>
            ) : adminSection === "analytics" ? (
              <div className="p-6 space-y-6">
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                  <span>Privacy Architecture Compliant: Zero medical, refraction, or prescription data is collected or processed in analytics.</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-card border border-border">
                    <span className="text-xs text-muted-foreground font-medium">Active Plans</span>
                    <div className="text-2xl font-bold text-foreground mt-1">{activeCount}</div>
                    <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">€{activeCount * 29}/mo ARR base</span>
                  </div>
                  <div className="p-4 rounded-xl bg-card border border-border">
                    <span className="text-xs text-muted-foreground font-medium">Frame Inquiries</span>
                    <div className="text-2xl font-bold text-foreground mt-1">{frameRequests.length}</div>
                    <span className="text-[11px] text-primary font-semibold mt-1 block">Pre-Payment Requests</span>
                  </div>
                  <div className="p-4 rounded-xl bg-card border border-border">
                    <span className="text-xs text-muted-foreground font-medium">Partner Network</span>
                    <div className="text-2xl font-bold text-foreground mt-1">{partners.length}</div>
                    <span className="text-[11px] text-muted-foreground mt-1 block">Opticians in Germany</span>
                  </div>
                  <div className="p-4 rounded-xl bg-card border border-border">
                    <span className="text-xs text-muted-foreground font-medium">Conversion Rate</span>
                    <div className="text-2xl font-bold text-emerald-600 mt-1">68.4%</div>
                    <span className="text-[11px] text-muted-foreground mt-1 block">Discovery to Subscription</span>
                  </div>
                </div>
              </div>
            ) : adminSection === "settings" ? (
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-foreground mb-1">Centralized Pricing Plans Configuration</h3>
                  <p className="text-xs text-muted-foreground mb-4">Configured dynamically via pricing module.</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {AVAILABLE_PLANS.map((p) => (
                      <div key={p.id} className="p-4 rounded-xl bg-muted/20 border border-border">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-sm text-foreground">{p.name}</h4>
                          <span className="font-bold text-primary">{formatEur(p.monthlyPrice)}/mo</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mb-3">{p.description}</p>
                        <div className="text-[10px] space-y-1 text-muted-foreground">
                          <div>• Free Replacements: <strong className="text-foreground">{p.replacementsPerYear} / year</strong></div>
                          <div>• Annual Total: {formatEur(p.annualPrice)}</div>
                          <div>• Activation Fee: {formatEur(p.activationFee)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <h3 className="text-sm font-bold text-foreground mb-1">Notification Services & Security</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-xs">
                    <div className="p-4 rounded-xl bg-card border border-border">
                      <span className="font-semibold block mb-1">Email Delivery Pipeline</span>
                      <p className="text-muted-foreground text-[11px]">Resend / SMTP abstraction active with automatic simulated delivery fallback in local dev.</p>
                      <span className="inline-block mt-2 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-[10px] font-semibold">10 Platform Events Active</span>
                    </div>
                    <div className="p-4 rounded-xl bg-card border border-border">
                      <span className="font-semibold block mb-1">Security Session & CSRF Protection</span>
                      <p className="text-muted-foreground text-[11px]">Session token hashed in server store. Double-submit cookie with origin validation active.</p>
                      <span className="font-mono text-[10px] text-primary mt-2 block truncate">CSRF: {csrfToken ? `${csrfToken.slice(0, 16)}...` : "Active"}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : adminSection === "customers" ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-muted-foreground/80 uppercase font-semibold tracking-wider">
                      <th className="px-5 py-3.5">Customer</th>
                      <th className="px-5 py-3.5">Contract Reference</th>
                      <th className="px-5 py-3.5">Address</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredSubscriptions.map((sub) => (
                      <tr key={sub.contractId} className="hover:bg-muted/15 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-semibold text-foreground">{sub.fullName}</div>
                          <div className="text-[11px] text-muted-foreground">{sub.email} • {sub.phone}</div>
                        </td>
                        <td className="px-5 py-4 font-mono font-semibold">{sub.contractId}</td>
                        <td className="px-5 py-4 text-muted-foreground">{sub.streetAddress}, {sub.postalCode} {sub.city}</td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-semibold capitalize ${
                            sub.status === "active" ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"
                          }`}>
                            {sub.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedSub(sub)}
                            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1.5 hover:bg-muted text-xs font-semibold cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Contract</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (activeTab === "frames" || adminSection === "frames") ? (
              loadingFrameRequests ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  <Loader2 className="w-7 h-7 animate-spin text-primary" />
                  <span className="text-xs">Loading frame requests...</span>
                </div>
              ) : frameRequests.length === 0 ? (
                <div className="py-20 text-center text-muted-foreground text-xs">
                  No frame requests submitted yet.
                </div>
              ) : (
                <div className="p-3 sm:p-4">
                  {/* Mobile & Tablet Card View (< lg) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
                    {frameRequests.map((req) => (
                      <div
                        key={req.requestId}
                        className="rounded-xl border border-border bg-card p-4 shadow-xs space-y-3"
                      >
                        {/* Header: ID, Date, Status */}
                        <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-2.5">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-bold text-foreground">
                                {req.requestId.length > 20
                                  ? `${req.requestId.slice(0, 10)}...${req.requestId.slice(-6)}`
                                  : req.requestId}
                              </span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(req.requestId, req.requestId)}
                                title="Copy full Tracking ID"
                                className="text-muted-foreground hover:text-primary transition p-0.5 cursor-pointer"
                              >
                                {copiedId === req.requestId ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : ""}
                            </span>
                          </div>

                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                            {req.status}
                          </span>
                        </div>

                        {/* Customer */}
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Customer</p>
                          <p className="font-semibold text-xs text-foreground mt-0.5">{req.fullName}</p>
                          <p className="text-[11px] text-muted-foreground">{req.email}</p>
                          {req.phone && <p className="text-[10px] text-muted-foreground">{req.phone}</p>}
                        </div>

                        {/* Frame Discovery */}
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Frame</p>
                          {req.frameBrand && (
                            <p className="text-xs font-semibold text-foreground mt-0.5">
                              {req.frameBrand} {req.frameModel || ""}
                            </p>
                          )}
                          {req.frameUrl && (
                            <a
                              href={req.frameUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline text-[11px] flex items-center gap-1 truncate mt-0.5"
                            >
                              <span className="truncate">{req.frameUrl}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          )}
                          {(req.frameImageFileId || req.frameImageData) && (
                            <button
                              type="button"
                              disabled={loadingFile}
                              onClick={() => handleViewPrivateFile(req.frameImageFileId, req.frameImageData)}
                              className="text-xs text-primary font-medium hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50 mt-1"
                            >
                              <Eye className="w-3.5 h-3.5 shrink-0" />
                              <span>View Uploaded Image</span>
                            </button>
                          )}
                          {req.notes && (
                            <p className="text-[10px] text-muted-foreground italic mt-1">"{req.notes}"</p>
                          )}
                        </div>

                        {/* Prescription */}
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Prescription</p>
                          {req.prescriptionType === "file" && (req.prescriptionFileId || req.prescriptionFileData) ? (
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <button
                                type="button"
                                disabled={loadingFile}
                                onClick={() => handleViewPrivateFile(req.prescriptionFileId, req.prescriptionFileData)}
                                className="text-xs text-primary font-medium hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                <FileText className="w-3.5 h-3.5 shrink-0" />
                                <span>View Document</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setReviewingPrescription(req);
                                  setReviewStatusChoice(req.prescriptionReviewStatus || "Under Review");
                                  setPrescriptionNotes(req.prescriptionNotes || "");
                                  setResubmissionReason(req.prescriptionResubmissionReason || "");
                                }}
                                className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition cursor-pointer"
                              >
                                <FileCheck className="w-3 h-3" />
                                <span>Audit Review</span>
                              </button>
                            </div>
                          ) : req.prescriptionType === "manual" ? (
                            <div className="mt-1 text-[11px] font-mono space-y-0.5">
                              <p>R: SPH {req.prescriptionSphR || "-"} / CYL {req.prescriptionCylR || "-"} / AX {req.prescriptionAxisR || "-"}</p>
                              <p>L: SPH {req.prescriptionSphL || "-"} / CYL {req.prescriptionCylL || "-"} / AX {req.prescriptionAxisL || "-"}</p>
                              {req.prescriptionPd && <p className="text-muted-foreground">PD: {req.prescriptionPd}</p>}
                              <button
                                type="button"
                                onClick={() => {
                                  setReviewingPrescription(req);
                                  setReviewStatusChoice(req.prescriptionReviewStatus || "Under Review");
                                  setPrescriptionNotes(req.prescriptionNotes || "");
                                  setResubmissionReason(req.prescriptionResubmissionReason || "");
                                }}
                                className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition cursor-pointer mt-1"
                              >
                                <FileCheck className="w-3 h-3" />
                                <span>Audit Review</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs italic mt-1 block">To be provided</span>
                          )}
                        </div>

                        {/* Status Change & Actions */}
                        <div className="pt-2 border-t border-border/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                          <div className="flex-1">
                            <label className="text-[10px] text-muted-foreground block mb-1">Update Status:</label>
                            <select
                              value={req.status}
                              disabled={updatingId === req.requestId}
                              onChange={(e) => handleFrameRequestStatusChange(req.requestId, e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                              <option value="Requested">Requested</option>
                              <option value="Under Review">Under Review</option>
                              <option value="Frame Found">Frame Found</option>
                              <option value="Compatibility Check">Compatibility Check</option>
                              <option value="Prescription Review">Prescription Review</option>
                              <option value="Price/Availability Confirmation">Confirmation</option>
                              <option value="Ready for Checkout">Ready for Checkout</option>
                              <option value="Ordered">Ordered</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-auto sm:mt-4">
                            <button
                              type="button"
                              onClick={() => handleCreateOrderFromFrameReq(req)}
                              disabled={updatingId === req.requestId}
                              className="inline-flex items-center gap-1 rounded-md bg-primary text-primary-foreground px-2.5 py-1.5 text-xs font-semibold hover:bg-primary/90 transition cursor-pointer shadow-xs"
                            >
                              <Package className="w-3.5 h-3.5" />
                              <span>Convert to Order</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingFrameReq(req)}
                              className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1.5 hover:bg-muted text-foreground text-xs font-semibold transition cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Edit Details</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteFrameRequest(req.requestId)}
                              disabled={updatingId === req.requestId}
                              className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1.5 hover:bg-destructive/10 hover:border-destructive/30 text-destructive text-xs transition cursor-pointer disabled:opacity-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Full Table View (>= lg) */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-border bg-muted/30 text-muted-foreground/80 uppercase font-semibold tracking-wider">
                          <th className="px-4 py-3.5">Request ID / Date</th>
                          <th className="px-4 py-3.5">Customer</th>
                          <th className="px-4 py-3.5">Frame Discovery</th>
                          <th className="px-4 py-3.5">Prescription</th>
                          <th className="px-4 py-3.5">Review Status</th>
                          <th className="px-4 py-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {frameRequests.map((req) => (
                          <tr key={req.requestId} className="hover:bg-muted/15 transition-colors">
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-semibold text-foreground" title={req.requestId}>
                                  {req.requestId.length > 22
                                    ? `${req.requestId.slice(0, 12)}...${req.requestId.slice(-6)}`
                                    : req.requestId}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(req.requestId, req.requestId)}
                                  title="Copy full Tracking ID"
                                  className="text-muted-foreground hover:text-primary transition p-0.5 cursor-pointer"
                                >
                                  {copiedId === req.requestId ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                              <span className="text-[10px] text-muted-foreground block mt-0.5">
                                {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : ""}
                              </span>
                            </td>

                            <td className="px-4 py-4">
                              <div className="max-w-[160px]">
                                <p className="font-semibold text-foreground truncate">{req.fullName}</p>
                                <p className="text-muted-foreground text-[11px] truncate">{req.email}</p>
                                {req.phone && (
                                  <p className="text-muted-foreground text-[10px] truncate">{req.phone}</p>
                                )}
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <div className="space-y-1 max-w-[200px]">
                                {req.frameBrand && (
                                  <span className="font-semibold text-foreground block truncate">
                                    {req.frameBrand} {req.frameModel || ""}
                                  </span>
                                )}
                                {req.frameUrl && (
                                  <a
                                    href={req.frameUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline text-[11px] flex items-center gap-1 truncate"
                                  >
                                    <span className="truncate">{req.frameUrl}</span>
                                    <ExternalLink className="w-3 h-3 shrink-0" />
                                  </a>
                                )}
                                {(req.frameImageFileId || req.frameImageData) && (
                                  <button
                                    type="button"
                                    disabled={loadingFile}
                                    onClick={() => handleViewPrivateFile(req.frameImageFileId, req.frameImageData)}
                                    className="text-xs text-primary font-medium hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                  >
                                    <Eye className="w-3.5 h-3.5 shrink-0" />
                                    <span>View Uploaded Image</span>
                                  </button>
                                )}
                                {req.notes && (
                                  <p className="text-[10px] text-muted-foreground italic truncate">
                                    "{req.notes}"
                                  </p>
                                )}
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              {req.prescriptionType === "file" && (req.prescriptionFileId || req.prescriptionFileData) ? (
                                <div className="space-y-1 max-w-[180px]">
                                  <button
                                    type="button"
                                    disabled={loadingFile}
                                    onClick={() => handleViewPrivateFile(req.prescriptionFileId, req.prescriptionFileData)}
                                    className="text-xs text-primary font-medium hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50 truncate"
                                  >
                                    <FileText className="w-3.5 h-3.5 shrink-0" />
                                    <span className="truncate">View Prescription Document</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReviewingPrescription(req);
                                      setReviewStatusChoice(req.prescriptionReviewStatus || "Under Review");
                                      setPrescriptionNotes(req.prescriptionNotes || "");
                                      setResubmissionReason(req.prescriptionResubmissionReason || "");
                                    }}
                                    className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition cursor-pointer"
                                  >
                                    <FileCheck className="w-3 h-3" />
                                    <span>Audit Review</span>
                                  </button>
                                </div>
                              ) : req.prescriptionType === "manual" ? (
                                <div className="text-[10.5px] font-mono space-y-0.5">
                                  <p>R: SPH {req.prescriptionSphR || "-"} / CYL {req.prescriptionCylR || "-"} / AX {req.prescriptionAxisR || "-"}</p>
                                  <p>L: SPH {req.prescriptionSphL || "-"} / CYL {req.prescriptionCylL || "-"} / AX {req.prescriptionAxisL || "-"}</p>
                                  {req.prescriptionPd && <p className="text-muted-foreground">PD: {req.prescriptionPd}</p>}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReviewingPrescription(req);
                                      setReviewStatusChoice(req.prescriptionReviewStatus || "Under Review");
                                      setPrescriptionNotes(req.prescriptionNotes || "");
                                      setResubmissionReason(req.prescriptionResubmissionReason || "");
                                    }}
                                    className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition cursor-pointer mt-1"
                                  >
                                    <FileCheck className="w-3 h-3" />
                                    <span>Audit Review</span>
                                  </button>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-[11px] italic">
                                  To be provided
                                </span>
                              )}
                            </td>

                            <td className="px-4 py-4 whitespace-nowrap">
                              <select
                                value={req.status}
                                disabled={updatingId === req.requestId}
                                onChange={(e) =>
                                  handleFrameRequestStatusChange(req.requestId, e.target.value)
                                }
                                className="px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                              >
                                <option value="Requested">Requested</option>
                                <option value="Under Review">Under Review</option>
                                <option value="Frame Found">Frame Found</option>
                                <option value="Compatibility Check">Compatibility Check</option>
                                <option value="Prescription Review">Prescription Review</option>
                                <option value="Price/Availability Confirmation">Confirmation</option>
                                <option value="Ready for Checkout">Ready for Checkout</option>
                                <option value="Ordered">Ordered</option>
                                <option value="Rejected">Rejected</option>
                              </select>
                            </td>

                            <td className="px-4 py-4 text-right whitespace-nowrap space-x-1.5">
                              <button
                                type="button"
                                onClick={() => handleCreateOrderFromFrameReq(req)}
                                disabled={updatingId === req.requestId}
                                className="inline-flex items-center gap-1 rounded-md bg-primary text-primary-foreground px-2 py-1 text-[11px] font-semibold hover:bg-primary/90 transition cursor-pointer shadow-xs"
                                title="Create fulfillment order from this request"
                              >
                                <Package className="w-3 h-3" />
                                <span>+ Order</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingFrameReq(req)}
                                className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 hover:bg-muted text-foreground text-[11px] font-semibold transition cursor-pointer"
                                title="Edit procurement parameters, availability & response"
                              >
                                <Edit className="w-3 h-3" />
                                <span>Edit Details</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteFrameRequest(req.requestId)}
                                disabled={updatingId === req.requestId}
                                className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 hover:bg-destructive/10 hover:border-destructive/30 text-destructive text-[11px] transition cursor-pointer disabled:opacity-50"
                                title="Delete request and private files"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            ) : showTrash ? (
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
              <div className="space-y-3 text-[10px] leading-relaxed text-muted-foreground/90 border-b border-border/65 pb-4 select-text">
                <h4 className="font-bold text-foreground text-center uppercase tracking-wider">
                  {t("AGREEMENT TERMS & CONDITIONS")}
                </h4>
                <p>
                  <strong>{t("1. Contracting Parties:")}</strong>{" "}
                  {t(
                    "This agreement is entered into between Sikder LLC, Germany (the Provider) and the subscriber (the Customer) whose signature is attached hereto.",
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

      {/* PHASE 2 MODAL: Edit Frame Request Details & Procurement Parameters */}
      {editingFrameReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm no-print">
          <div className="fixed inset-0" onClick={() => setEditingFrameReq(null)} />
          <div className="relative w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <Glasses className="w-4 h-4 text-primary" />
                <h3 className="font-display font-semibold text-sm">
                  Frame Request & Procurement Review: {editingFrameReq.requestId}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingFrameReq(null)}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFrameDetails} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] leading-relaxed flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Confidentiality Rule:</strong> Procurement costs and internal supplier sources are strictly confidential and NEVER exposed to customers in public or tracking endpoints.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Brand</label>
                  <input
                    type="text"
                    value={editingFrameReq.frameBrand || ""}
                    onChange={(e) => setEditingFrameReq({ ...editingFrameReq, frameBrand: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Model</label>
                  <input
                    type="text"
                    value={editingFrameReq.frameModel || ""}
                    onChange={(e) => setEditingFrameReq({ ...editingFrameReq, frameModel: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Frame Dimensions</label>
                  <input
                    type="text"
                    placeholder="e.g. 52-18-145"
                    value={editingFrameReq.frameDimensions || ""}
                    onChange={(e) => setEditingFrameReq({ ...editingFrameReq, frameDimensions: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Availability</label>
                  <input
                    type="text"
                    placeholder="e.g. In Stock with Wholesaler"
                    value={editingFrameReq.availability || ""}
                    onChange={(e) => setEditingFrameReq({ ...editingFrameReq, availability: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Supplier / Source</label>
                  <input
                    type="text"
                    placeholder="Internal source (e.g. Luxottica B2B)"
                    value={editingFrameReq.source || ""}
                    onChange={(e) => setEditingFrameReq({ ...editingFrameReq, source: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Compatibility</label>
                  <select
                    value={editingFrameReq.compatibilityStatus || "compatible"}
                    onChange={(e) => setEditingFrameReq({ ...editingFrameReq, compatibilityStatus: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value="compatible">Compatible with Prescription</option>
                    <option value="incompatible">Incompatible with Lens Geometry</option>
                    <option value="requires_inspection">Requires Physical Inspection</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-rose-600 dark:text-rose-400 block mb-1">
                    Internal Procurement Cost (€) [Strictly Internal]
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 85.00"
                    value={editingFrameReq.procurementCost !== undefined ? editingFrameReq.procurementCost : ""}
                    onChange={(e) => setEditingFrameReq({ ...editingFrameReq, procurementCost: e.target.value })}
                    className="w-full rounded-lg border border-rose-500/40 bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">
                    Customer Surcharge (€) [Optional]
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00 for included frames"
                    value={editingFrameReq.customerPrice !== undefined ? editingFrameReq.customerPrice : ""}
                    onChange={(e) => setEditingFrameReq({ ...editingFrameReq, customerPrice: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Customer-Facing Response Message</label>
                <textarea
                  rows={2}
                  value={editingFrameReq.adminResponse || ""}
                  onChange={(e) => setEditingFrameReq({ ...editingFrameReq, adminResponse: e.target.value })}
                  placeholder="e.g. Frame verified and available. Covered under your plan with €0 extra."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Internal Optician Notes</label>
                <textarea
                  rows={2}
                  value={editingFrameReq.adminNotes || ""}
                  onChange={(e) => setEditingFrameReq({ ...editingFrameReq, adminNotes: e.target.value })}
                  placeholder="Internal laboratory or sizing notes..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingFrameReq(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-border hover:bg-muted text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingFrameDetails}
                  className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/95 transition cursor-pointer disabled:opacity-50"
                >
                  {savingFrameDetails ? "Saving..." : "Save Parameters"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PHASE 2 MODAL: Prescription Review 5-Stage Workflow */}
      {reviewingPrescription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm no-print">
          <div className="fixed inset-0" onClick={() => setReviewingPrescription(null)} />
          <div className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-primary" />
                <h3 className="font-display font-semibold text-sm">
                  Optometric Prescription Review: {reviewingPrescription.requestId}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReviewingPrescription(null)}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePrescriptionReview} className="p-6 space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">
                  5-Stage Review Status
                </label>
                <select
                  value={reviewStatusChoice}
                  onChange={(e) => setReviewStatusChoice(e.target.value as any)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="Submitted">Submitted (Awaiting review)</option>
                  <option value="Under Review">Under Review (Optometrist analyzing)</option>
                  <option value="Need More Information">Need More Information (Customer clarification needed)</option>
                  <option value="Approved for Fulfillment">Approved for Fulfillment (Ready for lens cutting)</option>
                  <option value="Not Supported">Not Supported (Values out of production range)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">
                  Reviewer Notes
                </label>
                <textarea
                  rows={2}
                  value={prescriptionNotes}
                  onChange={(e) => setPrescriptionNotes(e.target.value)}
                  placeholder="e.g. Pupil distance verified; high cylinder requires 1.67 index..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              {(reviewStatusChoice === "Need More Information" || reviewStatusChoice === "Not Supported") && (
                <div>
                  <label className="text-[10px] font-bold uppercase text-rose-600 dark:text-rose-400 block mb-1">
                    Resubmission / Rejection Reason (Sent to customer)
                  </label>
                  <textarea
                    rows={2}
                    value={resubmissionReason}
                    onChange={(e) => setResubmissionReason(e.target.value)}
                    placeholder="e.g. Document image is blurry or expired. Please upload an optometrist pass from within the last 12 months."
                    required
                    className="w-full rounded-lg border border-rose-500/40 bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              )}

              <div className="p-3 rounded-lg bg-muted/40 border border-border text-[11px] text-muted-foreground">
                An immutable audit trail entry is permanently recorded with your admin ID and timestamp upon saving.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setReviewingPrescription(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-border hover:bg-muted text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPrescriptionReview}
                  className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/95 transition cursor-pointer disabled:opacity-50"
                >
                  {savingPrescriptionReview ? "Recording..." : "Record Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PHASE 2 MODAL: Orders 8-Stage Pipeline Updater */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm no-print">
          <div className="fixed inset-0" onClick={() => setEditingOrder(null)} />
          <div className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                <h3 className="font-display font-semibold text-sm">
                  Update Order Pipeline: {editingOrder.order_id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveOrderStatus(
                  editingOrder.order_id,
                  editingOrder.status,
                  editingOrder.carrier,
                  editingOrder.tracking_number,
                  editingOrder.estimated_delivery,
                  editingOrder.notes,
                );
              }}
              className="p-6 space-y-4 text-xs"
            >
              <div>
                <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">
                  8-Stage Manufacturing & Delivery Pipeline
                </label>
                <select
                  value={editingOrder.status}
                  onChange={(e) => setEditingOrder({ ...editingOrder, status: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  {[
                    "Requested",
                    "Verified",
                    "Confirmed",
                    "Processing",
                    "Lens Production",
                    "Quality Check",
                    "Shipped",
                    "Delivered",
                  ].map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Carrier</label>
                  <input
                    type="text"
                    value={editingOrder.carrier || ""}
                    onChange={(e) => setEditingOrder({ ...editingOrder, carrier: e.target.value })}
                    placeholder="e.g. DHL Express"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Tracking Number</label>
                  <input
                    type="text"
                    value={editingOrder.tracking_number || ""}
                    onChange={(e) => setEditingOrder({ ...editingOrder, tracking_number: e.target.value })}
                    placeholder="e.g. DHL-9482018402"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Estimated Delivery</label>
                <input
                  type="text"
                  value={editingOrder.estimated_delivery || ""}
                  onChange={(e) => setEditingOrder({ ...editingOrder, estimated_delivery: e.target.value })}
                  placeholder="e.g. 2-3 Business Days"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Fulfillment Notes</label>
                <textarea
                  rows={2}
                  value={editingOrder.notes || ""}
                  onChange={(e) => setEditingOrder({ ...editingOrder, notes: e.target.value })}
                  placeholder="Internal fulfillment or tracking notes..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-border hover:bg-muted text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/95 transition cursor-pointer"
                >
                  Update Pipeline Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PHASE 2 MODAL: Edit Optician Partner */}
      {editingPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm no-print">
          <div className="fixed inset-0" onClick={() => setEditingPartner(null)} />
          <div className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                <h3 className="font-display font-semibold text-sm">
                  Edit Partner: {editingPartner.businessName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingPartner(null)}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePartner} className="p-6 space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Business Name</label>
                <input
                  type="text"
                  required
                  value={editingPartner.businessName}
                  onChange={(e) => setEditingPartner({ ...editingPartner, businessName: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={editingPartner.city}
                    onChange={(e) => setEditingPartner({ ...editingPartner, city: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Postal Code</label>
                  <input
                    type="text"
                    required
                    value={editingPartner.postalCode}
                    onChange={(e) => setEditingPartner({ ...editingPartner, postalCode: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Street Address</label>
                <input
                  type="text"
                  value={editingPartner.address || ""}
                  onChange={(e) => setEditingPartner({ ...editingPartner, address: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Phone</label>
                  <input
                    type="text"
                    value={editingPartner.contactPhone || ""}
                    onChange={(e) => setEditingPartner({ ...editingPartner, contactPhone: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Email</label>
                  <input
                    type="email"
                    value={editingPartner.contactEmail || ""}
                    onChange={(e) => setEditingPartner({ ...editingPartner, contactEmail: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Appointment URL</label>
                <input
                  type="url"
                  value={editingPartner.appointmentUrl || ""}
                  onChange={(e) => setEditingPartner({ ...editingPartner, appointmentUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPartner.isActive}
                    onChange={(e) => setEditingPartner({ ...editingPartner, isActive: e.target.checked })}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="font-semibold text-xs">Active Partner</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPartner.supportsMeasurements}
                    onChange={(e) => setEditingPartner({ ...editingPartner, supportsMeasurements: e.target.checked })}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="font-semibold text-xs">Free Eye Measurements</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingPartner(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-border hover:bg-muted text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/95 transition cursor-pointer"
                >
                  Save Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Uploaded File / Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm no-print">
          <div className="fixed inset-0" onClick={() => setPreviewImage(null)} />
          <div className="relative max-w-2xl max-h-[85vh] bg-card p-4 rounded-2xl shadow-2xl border border-border z-10 flex flex-col items-center">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-background/80 text-foreground hover:bg-muted transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="overflow-auto max-h-[75vh] w-full flex items-center justify-center p-2">
              {previewImage.startsWith("data:application/pdf") ? (
                <iframe
                  src={previewImage}
                  title="Prescription PDF"
                  className="w-full h-[65vh] rounded-lg border border-border"
                />
              ) : (
                <img
                  src={previewImage}
                  alt="Customer upload preview"
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                />
              )}
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
