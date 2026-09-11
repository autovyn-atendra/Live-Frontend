"use client";

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import HashloaderComponent from "@/components/Templates/hashloader";
import axios from "axios";
import Ainput from "@/components/atoms/Input";
import {
  RefreshCw,
  Search,
  Calendar,
  Phone,
  Mail,
  Tag,
  Clock,
  TrendingUp,
  Tv,
  Users,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  Filter,
  X,
  ArrowLeft,
  MessageSquare,
  Flame,
  FileText,
  Monitor,
  PhoneCall,
  Bot,
  PlayCircle,
  Download,
  BarChart2,
  UserPlus,
  Plus,
  Trash2,
  Edit3,
  Globe,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { useCurrentUser } from "@/app/hooks/use-current-user";

// ============================================================
// MODAL HELPER COMPONENT (REACT PORTAL FOR GUARANTEED TOP STACKING)
// ============================================================
const Modal = ({
  isOpen,
  onClose,
  children,
  widthClass = "max-w-4xl",
  zIndexClass = "z-[999999]",
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  widthClass?: string;
  zIndexClass?: string;
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className={`fixed inset-0 ${zIndexClass} flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs`}
      onClick={onClose}
    >
      <div
        className={`relative max-h-[92vh] w-full ${widthClass} overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

// ============================================================
// CONSTANTS & TYPES
// ============================================================
const BASE_URL = process.env.NEXT_PUBLIC_URL;

type WebsiteLead = {
  Id: number;
  UTD: number;
  Meta_Lead_Id?: string;
  Page_Id?: string | null;
  Form_Id?: string | null;
  Name?: string | null;
  Full_Name?: string | null;
  MobileNumber?: string | null;
  Phone_Number?: string | null;
  Email?: string | null;
  City?: string | null;
  CompanyName?: string | null;
  Company_Name?: string | null;
  Message?: string | null;
  ProductName?: string | null;
  Product_Name?: string | null;
  OTPVerified?: boolean | string | number | null;
  OTP_Verified?: boolean | string | number | null;
  IPAddress?: string | null;
  OTPCode?: string | number | null;
  OTPExpiry?: string | null;
  OTPVerifiedAt?: string | null;
  CreatedAt?: string | null;
  Created_At?: string | null;
  UpdatedAt?: string | null;
  Updated_At?: string | null;
  All_Fields?: Record<string, any> | string | null;
  Source?: string | null;
  status?: number | string | null;
  Temperature?: "Cold" | "Warm" | "Hot" | string | null;
  Demo_CC_Emails?: string | null;
  Created_By?: string | null;
};

type PaginationState = {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

// ============================================================
// UTILS
// ============================================================
const showToast = (
  msg: string,
  type: "success" | "error" | "warning" | "info"
) =>
  Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 4000,
    timerProgressBar: true,
  }).fire({ icon: type, title: msg });

const formatDateForDisplay = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "—";
  try {
    const str = String(dateStr).trim();
    if (!str) return "—";

    // 1. Date-only format (e.g., "2026-08-19")
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [year, month, day] = str.split("-").map(Number);
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }

    // 2. Parse Datetime components directly
    const match = str.match(/^(\d{4})[-/](\d{2})[-/](\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/);
    if (match) {
      const [, y, m, d, h, min] = match;
      const year = Number(y);
      const month = Number(m) - 1;
      const day = Number(d);
      const hour = Number(h);
      const minute = Number(min);

      const localDate = new Date(year, month, day, hour, minute);
      return localDate.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }

    const cleanStr = str.endsWith("Z") ? str.slice(0, -1) : str;
    const d = new Date(cleanStr);
    if (isNaN(d.getTime())) return dateStr;

    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateStr || "—";
  }
};

const formatFieldKey = (key: string) => {
  if (!key) return "";
  return key
    .replace(/_/g, " ")
    .replace(/\?/g, "")
    .trim()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

const formatFieldValue = (val: any) => {
  if (val === null || val === undefined) return "N/A";
  if (typeof val === "boolean") return val ? "Yes" : "No";
  if (Array.isArray(val)) return val.join(", ");
  const str = String(val);
  return str.replace(/_/g, " ").trim();
};

const getInitials = (name: string | null | undefined) => {
  if (!name) return "WL";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const STAGES = [
  "New",
  "Shortlisted",
  "Contacted",
  "Busy",
  "Interested",
  "Demo Scheduled",
  "Quotation Sent",
  "Won",
  "Lost",
  "Junk",
];

// Map status to badge style & text
const getStatusDetails = (statusVal: number | string | null | undefined) => {
  if (statusVal === 10 || statusVal === "Shortlisted" || statusVal === "SHORTLISTED") {
    return {
      label: "Shortlisted",
      className: "bg-[#EEF2FF] text-[#4F46E5] border-[#C7D2FE] dark:bg-[#312E81]/50 dark:text-[#A5B4FC] dark:border-[#4338CA]",
    };
  }
  if (statusVal === 1 || statusVal === "Processed" || statusVal === "Quotation Sent") {
    return {
      label: "Quotation Sent",
      className: "bg-[#F3E8FF] text-[#7E22CE] border-[#E9D5FF] dark:bg-[#3B0764]/50 dark:text-[#D8B4FE] dark:border-[#581C87]",
    };
  }
  if (statusVal === 2 || statusVal === "Contacted") {
    return {
      label: "Contacted",
      className: "bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD] dark:bg-[#075985]/50 dark:text-[#7DD3FC] dark:border-[#0369A1]",
    };
  }
  if (statusVal === 7 || statusVal === "Busy" || statusVal === "BUSY") {
    return {
      label: "Busy",
      className: "bg-[#FFF7ED] text-[#C2410C] border-[#FFEDD5] dark:bg-[#7C2D12]/50 dark:text-[#FDBA74] dark:border-[#9A3412]",
    };
  }
  if (statusVal === 3 || statusVal === "Interested") {
    return {
      label: "Interested",
      className: "bg-[#F3E8FF] text-[#7E22CE] border-[#E9D5FF] dark:bg-[#3B0764]/60 dark:text-[#D8B4FE] dark:border-[#581C87]",
    };
  }
  if (statusVal === 4 || statusVal === "Demo Scheduled") {
    return {
      label: "Demo Scheduled",
      className: "bg-[#FEF3C7] text-[#B45309] border-[#FDE68A] dark:bg-[#78350F]/50 dark:text-[#FDE68A] dark:border-[#92400E]",
    };
  }
  if (statusVal === 5 || statusVal === "Won") {
    return {
      label: "Won",
      className: "bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0] dark:bg-[#14532D]/50 dark:text-[#86EFAC] dark:border-[#16A34A]",
    };
  }
  if (statusVal === 6 || statusVal === "Lost") {
    return {
      label: "Lost",
      className: "bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA] dark:bg-[#7F1D1D]/50 dark:text-[#FCA5A5] dark:border-[#991B1B]",
    };
  }
  if (statusVal === 8 || statusVal === "Junk" || statusVal === "JUNK") {
    return {
      label: "Junk",
      className: "bg-[#F1F5F9] text-[#64748B] border-[#CBD5E1] dark:bg-[#1E293B]/70 dark:text-[#94A3B8] dark:border-[#475569]",
    };
  }
  if (statusVal === 9 || statusVal === "3-Day Exhausted") {
    return {
      label: "3-Day Exhausted",
      className: "bg-[#FEE2E2] text-[#991B1B] border-[#FECACA] dark:bg-[#7F1D1D]/50 dark:text-[#F87171] dark:border-[#991B1B]",
    };
  }
  return {
    label: "New",
    className: "bg-[#F1F5F9] text-[#334155] border-[#E2E8F0] dark:bg-[#1E293B] dark:text-[#CBD5E1] dark:border-[#334155]",
  };
};

// Map temperature to badge style & text
const getTemperatureDetails = (tempVal: string | null | undefined) => {
  const str = String(tempVal || "").trim().toLowerCase();
  if (str === "hot") {
    return {
      label: "Hot",
      className: "bg-[#FFE4E6] text-[#E11D48] border-[#FECDD3] dark:bg-[#E11D48]/20 dark:text-[#FDA4AF] dark:border-[#E11D48]/40",
      dotColor: "bg-[#E11D48]",
    };
  }
  if (str === "cold") {
    return {
      label: "Cold",
      className: "bg-[#E0F2FE] text-[#0284C7] border-[#BAE6FD] dark:bg-[#0284C7]/20 dark:text-[#7DD3FC] dark:border-[#0284C7]/40",
      dotColor: "bg-[#0284C7]",
    };
  }
  return {
    label: "Warm",
    className: "bg-[#FEF3C7] text-[#D97706] border-[#FDE68A] dark:bg-[#D97706]/20 dark:text-[#FDE68A] dark:border-[#D97706]/40",
    dotColor: "bg-[#D97706]",
  };
};

// ============================================================
// MAIN PAGE COMPONENT
// ============================================================
export default function WebsiteLeadPage() {
  const user: any = useCurrentUser();
  const router = useRouter();

  // ── Selected & Last Viewed Lead State for Scroll Retention ────────
  const [selectedLead, setSelectedLead] = useState<WebsiteLead | null>(null);
  const [lastViewedLeadId, setLastViewedLeadId] = useState<number | null>(null);
  const scrollPositionRef = React.useRef<number>(0);

  // ── Table State ──────────────────────────────────────────
  const [rows, setRows] = useState<WebsiteLead[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ── Filter State ─────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterProductName, setFilterProductName] = useState("");
  const [filterOtpVerified, setFilterOtpVerified] = useState("");

  // ── Campaign Dropdown & Manual Lead State ──────────────────
  const [campaignsList, setCampaignsList] = useState<any[]>([]);
  const [addLeadModalOpen, setAddLeadModalOpen] = useState<boolean>(false);
  const [isSubmittingLead, setIsSubmittingLead] = useState<boolean>(false);
  const [newLeadForm, setNewLeadForm] = useState<{
    dealerName: string;
    phoneNumber: string;
    designation: string;
    companyName: string;
    noOfEmployees: string;
    customNoOfEmployees?: string;
    module: string;
    customModule?: string;
    campaignId: string;
    email: string;
    city: string;
    customQuestions: Array<{ question: string; answer: string }>;
  }>({
    dealerName: "",
    phoneNumber: "",
    designation: "",
    companyName: "",
    noOfEmployees: "",
    customNoOfEmployees: "",
    module: "HR Setu",
    customModule: "",
    campaignId: "",
    email: "",
    city: "",
    customQuestions: [],
  });

  // ── Dynamic Dashboard KPI Statistics State ────────────────
  const [stats, setStats] = useState<{
    totalLeads: number;
    leadsThisWeek: number;
    leadsToday: number;
    totalOtpVerified: number;
    otpVerifiedToday: number;
    todayFollowups: number;
    overdueFollowups: number;
    upcomingFollowups: number;
    completedTodayFollowups: number;
    totalDemos: number;
    demosThisWeek: number;
    demosCompletedThisWeek: number;
    conversionRate: string;
    totalCalls: number;
    callsToday: number;
    leadsCalledToday: number;
    callsThisWeek: number;
  }>({
    totalLeads: 0,
    leadsThisWeek: 0,
    leadsToday: 0,
    totalOtpVerified: 0,
    otpVerifiedToday: 0,
    todayFollowups: 0,
    overdueFollowups: 0,
    upcomingFollowups: 0,
    completedTodayFollowups: 0,
    totalDemos: 0,
    demosThisWeek: 0,
    demosCompletedThisWeek: 0,
    conversionRate: "0.0%",
    totalCalls: 0,
    callsToday: 0,
    leadsCalledToday: 0,
    callsThisWeek: 0,
  });

  // ── Detail Workspace State ────────────────────────────────
  const [activeStage, setActiveStage] = useState<string>("New");
  const [leadTemperature, setLeadTemperature] = useState<"Cold" | "Warm" | "Hot">("Warm");
  const [followupDate, setFollowupDate] = useState<string>("");
  const [followupTime, setFollowupTime] = useState<string>("11:00");
  const [followupType, setFollowupType] = useState<string>("CALL");
  const [followupPurpose, setFollowupPurpose] = useState<string>("");
  const [whatsappReminder, setWhatsappReminder] = useState<boolean>(true);
  const [newRemarkText, setNewRemarkText] = useState<string>("");
  const [activities, setActivities] = useState<any[]>([]);
  const [isSubmittingActivity, setIsSubmittingActivity] = useState<boolean>(false);

  // ── Edit Submitted Form Details & Email Modal State ────────
  const [isEditFormModalOpen, setIsEditFormModalOpen] = useState<boolean>(false);
  const [editEmail, setEditEmail] = useState<string>("");
  const [editFormFields, setEditFormFields] = useState<Array<{ key: string; value: string }>>([]);
  const [isSavingLeadDetails, setIsSavingLeadDetails] = useState<boolean>(false);

  // ── Call Modal State ──────────────────────────────────────
  const [callModalOpen, setCallModalOpen] = useState<boolean>(false);
  const [callResult, setCallResult] = useState<string>("CONNECTED");
  const [callRemark, setCallRemark] = useState<string>("");

  // ── Schedule Demo Modal State ─────────────────────────────
  const [scheduleDemoModalOpen, setScheduleDemoModalOpen] = useState<boolean>(false);
  const [demoDate, setDemoDate] = useState<string>("");
  const [demoTime, setDemoTime] = useState<string>("11:00");
  const [demoType, setDemoType] = useState<string>("MICROSOFT_TEAMS");
  const [demoRemark, setDemoRemark] = useState<string>("");
  const [demoCcEmails, setDemoCcEmails] = useState<string[]>([]);
  const [newCcEmailInput, setNewCcEmailInput] = useState<string>("");
  const [showAddCcInput, setShowAddCcInput] = useState<boolean>(false);
  const [saveCcToCampaign, setSaveCcToCampaign] = useState<boolean>(true);
//   const [campaignsList, setCampaignsList] = useState<any[]>([]);

  // ── Inline Profile Email Edit State ───────────────────────
  const [isEditingInlineEmail, setIsEditingInlineEmail] = useState<boolean>(false);
  const [inlineEmailInput, setInlineEmailInput] = useState<string>("");
  const [isSavingInlineEmail, setIsSavingInlineEmail] = useState<boolean>(false);

  // ── Demo Modal Customer Email Edit State ──────────────────
  const [demoModalEmailInput, setDemoModalEmailInput] = useState<string>("");
  const [isEditingDemoModalEmail, setIsEditingDemoModalEmail] = useState<boolean>(false);
  const [isSavingDemoModalEmail, setIsSavingDemoModalEmail] = useState<boolean>(false);

  // ── Pagination State ─────────────────────────────────────
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    pageSize: 10,
    totalPages: 1,
    totalRecords: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const openScheduleDemoModal = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const dd = String(tomorrow.getDate()).padStart(2, "0");
    setDemoDate(`${yyyy}-${mm}-${dd}`);
    setDemoTime("11:00");
    setDemoType("MICROSOFT_TEAMS");
    setDemoRemark("");
    setNewCcEmailInput("");
    setShowAddCcInput(false);
    setSaveCcToCampaign(true);

    const currentLeadEmail = selectedLead?.Email || "";
    setDemoModalEmailInput(currentLeadEmail);
    setIsEditingDemoModalEmail(!currentLeadEmail);

    const collectedEmails = new Set<string>();

    if (selectedLead?.Demo_CC_Emails) {
      String(selectedLead.Demo_CC_Emails)
        .split(/[,;]/)
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e && e.includes("@"))
        .forEach((e) => collectedEmails.add(e));
    }

    campaignsList.forEach((camp: any) => {
      if (camp.Demo_CC_Emails) {
        String(camp.Demo_CC_Emails)
          .split(/[,;]/)
          .map((e) => e.trim().toLowerCase())
          .filter((e) => e && e.includes("@"))
          .forEach((e) => collectedEmails.add(e));
      }
    });

    setDemoCcEmails(Array.from(collectedEmails));
    setScheduleDemoModalOpen(true);
  };

  const handleSaveInlineEmail = async () => {
    if (!selectedLead || isSavingInlineEmail) return;
    const leadTargetId = selectedLead.Id || selectedLead.UTD;
    const cleanEmail = inlineEmailInput.trim();

    if (cleanEmail && (!cleanEmail.includes("@") || !cleanEmail.includes("."))) {
      showToast("Please enter a valid email address", "warning");
      return;
    }

    try {
      setIsSavingInlineEmail(true);
      const res = await axios.post(
        `${BASE_URL}/meta/updateLeadDetails`,
        {
          metaLeadUtd: leadTargetId,
          email: cleanEmail,
          isWebsiteLead: true,
          source: "WEBSITE",
        },
        {
          headers: {
            accept: "application/json",
            compcode: user?.Comp_Code || process.env.NEXT_PUBLIC_COMP_CODE || "1",
            name: user?.name,
            "x-lead-source": "WEBSITE",
            "Content-Type": "application/json",
          },
        }
      );

      if (res.data?.success || res.data?.Status) {
        showToast("Email updated successfully! 🎉", "success");
        setSelectedLead((prev: any) => (prev ? { ...prev, Email: cleanEmail } : prev));
        setRows((prev) =>
          prev.map((r) =>
            r.Id === leadTargetId || r.UTD === leadTargetId ? { ...r, Email: cleanEmail } : r
          )
        );
        setIsEditingInlineEmail(false);
        setDemoModalEmailInput(cleanEmail);
        fetchLeadActivities(leadTargetId);
      } else {
        showToast(res.data?.message || "Failed to update email", "error");
      }
    } catch (err: any) {
      console.error("Save inline email error:", err);
      showToast(err?.response?.data?.message || "Error updating email", "error");
    } finally {
      setIsSavingInlineEmail(false);
    }
  };

  const handleSaveDemoModalEmail = async () => {
    if (!selectedLead || isSavingDemoModalEmail) return;
    const leadTargetId = selectedLead.Id || selectedLead.UTD;
    const cleanEmail = demoModalEmailInput.trim();

    if (!cleanEmail) {
      showToast("Please enter customer email", "warning");
      return;
    }
    if (!cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      showToast("Please enter a valid email address (e.g. name@example.com)", "warning");
      return;
    }

    try {
      setIsSavingDemoModalEmail(true);
      const res = await axios.post(
        `${BASE_URL}/meta/updateLeadDetails`,
        {
          metaLeadUtd: leadTargetId,
          email: cleanEmail,
          isWebsiteLead: true,
          source: "WEBSITE",
        },
        {
          headers: {
            accept: "application/json",
            compcode: user?.Comp_Code || process.env.NEXT_PUBLIC_COMP_CODE || "1",
            name: user?.name,
            "x-lead-source": "WEBSITE",
            "Content-Type": "application/json",
          },
        }
      );

      if (res.data?.success || res.data?.Status) {
        showToast("Customer email saved successfully! 🎉", "success");
        setSelectedLead((prev: any) => (prev ? { ...prev, Email: cleanEmail } : prev));
        setRows((prev) =>
          prev.map((r) =>
            r.Id === leadTargetId || r.UTD === leadTargetId ? { ...r, Email: cleanEmail } : r
          )
        );
        setIsEditingDemoModalEmail(false);
        fetchLeadActivities(leadTargetId);
      } else {
        showToast(res.data?.message || "Failed to save email", "error");
      }
    } catch (err: any) {
      console.error("Save demo modal email error:", err);
      showToast(err?.response?.data?.message || "Error saving email", "error");
    } finally {
      setIsSavingDemoModalEmail(false);
    }
  };

  const handleAddCcEmail = () => {
    const trimmed = newCcEmailInput.trim().toLowerCase();
    if (!trimmed) {
      showToast("Please enter an email address", "warning");
      return;
    }
    if (!trimmed.includes("@") || !trimmed.includes(".")) {
      showToast("Please enter a valid email address (e.g. name@example.com)", "warning");
      return;
    }
    if (demoCcEmails.some((e) => e.toLowerCase() === trimmed)) {
      showToast("Email is already in the CC list", "info");
      setNewCcEmailInput("");
      return;
    }
    setDemoCcEmails((prev) => [...prev, trimmed]);
    setNewCcEmailInput("");
    setShowAddCcInput(false);
    showToast("CC email added", "success");
  };

  const handleRemoveCcEmail = (emailToRemove: string) => {
    setDemoCcEmails((prev) => prev.filter((e) => e.toLowerCase() !== emailToRemove.toLowerCase()));
  };

  // ============================================================
  // FETCH WEBSITE LEADS
  // ============================================================
  const fetchWebsiteLeads = useCallback(
    async (pageToFetch = 1, customLimit?: number, overrideFilters?: Record<string, any>) => {
      setIsLoading(true);
      try {
        const payload: Record<string, any> = {
          page: pageToFetch,
          limit: customLimit || pagination.pageSize,
          sortBy: "Id",
          sortOrder: "DESC",
        };

        const activeSearch = overrideFilters ? (overrideFilters.searchQuery ?? "") : searchQuery;
        const activeFrom = overrideFilters ? (overrideFilters.fromDate ?? "") : fromDate;
        const activeTo = overrideFilters ? (overrideFilters.toDate ?? "") : toDate;
        const activeStatus = overrideFilters ? (overrideFilters.filterStatus ?? "") : filterStatus;
        const activeProduct = overrideFilters ? (overrideFilters.filterProductName ?? "") : filterProductName;
        const activeOtp = overrideFilters ? (overrideFilters.filterOtpVerified ?? "") : filterOtpVerified;

        if (activeSearch.trim()) payload.search = activeSearch.trim();
        if (activeFrom) payload.fromDate = activeFrom;
        if (activeTo) payload.toDate = activeTo;
        if (activeStatus !== "") payload.status = Number(activeStatus);
        if (activeProduct.trim()) payload.productName = activeProduct.trim();
        if (activeOtp !== "") payload.otpVerified = activeOtp;

        const res = await axios.post(`${BASE_URL}/meta/getWebsiteLeads`, payload, {
          headers: {
            accept: "application/json",
            compcode: user?.Comp_Code || process.env.NEXT_PUBLIC_COMP_CODE || "1",
            name: user?.name,
            "Content-Type": "application/json",
          },
        });

        if (res.data?.success) {
          const list = Array.isArray(res.data.data) ? res.data.data : [];
          setRows(list);
          if (res.data.pagination) {
            setPagination({
              currentPage: res.data.pagination.currentPage || pageToFetch,
              pageSize: res.data.pagination.pageSize || pagination.pageSize,
              totalPages: res.data.pagination.totalPages || 1,
              totalRecords: res.data.pagination.totalRecords || 0,
              hasNextPage: !!res.data.pagination.hasNextPage,
              hasPrevPage: !!res.data.pagination.hasPrevPage,
            });
          }
        } else {
          setRows([]);
        }
      } catch (err: any) {
        showToast(
          err?.response?.data?.message ?? "Error fetching Website leads",
          "error"
        );
        setRows([]);
      } finally {
        setIsLoading(false);
      }
    },
    [
      searchQuery,
      fromDate,
      toDate,
      filterStatus,
      filterProductName,
      filterOtpVerified,
      pagination.pageSize,
      user?.Comp_Code,
      user?.name,
    ]
  );

  // ============================================================
  // FETCH LEAD ACTIVITIES (TIMELINE)
  // ============================================================
  const fetchLeadActivities = useCallback(
    async (leadId: number) => {
      try {
        const res = await axios.get(`${BASE_URL}/meta/getActivities/${leadId}?source=WEBSITE`, {
          headers: {
            accept: "application/json",
            compcode: user?.Comp_Code || process.env.NEXT_PUBLIC_COMP_CODE || "1",
            name: user?.name,
            "x-lead-source": "WEBSITE",
          },
        });

        if (res.data?.success) {
          setActivities(Array.isArray(res.data.data) ? res.data.data : []);
          if (res.data.All_Fields || res.data.lead) {
            if (res.data.lead?.Temperature) {
              setLeadTemperature(res.data.lead.Temperature as any);
            }
            setSelectedLead((prev: any) => {
              if (!prev || (prev.Id !== leadId && prev.UTD !== leadId)) return prev;
              return {
                ...prev,
                ...(res.data.lead || {}),
                All_Fields: res.data.All_Fields || res.data.lead?.All_Fields || prev.All_Fields,
              };
            });
          }
        } else {
          setActivities([]);
        }
      } catch (err) {
        console.error("Error fetching lead activities:", err);
        setActivities([]);
      }
    },
    [user?.Comp_Code, user?.name]
  );

  // ============================================================
  // FETCH DYNAMIC DASHBOARD STATS
  // ============================================================
  const fetchDashboardStats = useCallback(async () => {
    try {
      const res = await axios.post(
        `${BASE_URL}/meta/getWebsiteDashboardStats`,
        {},
        {
          headers: {
            accept: "application/json",
            compcode: user?.Comp_Code || process.env.NEXT_PUBLIC_COMP_CODE || "1",
            name: user?.name,
            "Content-Type": "application/json",
          },
        }
      );
      if (res.data?.success && res.data?.data) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.warn("Failed to load website dashboard stats:", err);
    }
  }, [user?.Comp_Code, user?.name]);

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE_URL}/meta/getCampaigns`, {
        headers: {
          accept: "application/json",
          compcode: user?.Comp_Code || process.env.NEXT_PUBLIC_COMP_CODE || "1",
        },
      });
      if (res.data?.success && Array.isArray(res.data.data)) {
        const activeCamps = res.data.data.filter((c: any) => c.Is_Active !== 0 && c.Is_Active !== false);
        setCampaignsList(activeCamps);
      }
    } catch (err) {
      console.warn("Failed to fetch campaigns for CC emails:", err);
    }
  }, [user?.Comp_Code]);

  const searchParams = useSearchParams();
  const leadIdParam = searchParams.get("leadId") || searchParams.get("id") || searchParams.get("leadUtd");
  const fromParam = searchParams.get("from");

  useEffect(() => {
    fetchWebsiteLeads(1);
    fetchDashboardStats();
    fetchCampaigns();
    if (leadIdParam) {
      const leadId = Number(leadIdParam);
      if (leadId && !isNaN(leadId)) {
        axios
          .post(
            `${BASE_URL}/meta/getWebsiteLead`,
            { id: leadId },
            {
              headers: {
                accept: "application/json",
                compcode: user?.Comp_Code || process.env.NEXT_PUBLIC_COMP_CODE || "1",
                name: user?.name,
                "Content-Type": "application/json",
              },
            }
          )
          .then((res) => {
            const item = res.data?.data || res.data?.lead;
            if (item) {
              handleOpenDetailView(item);
            }
          })
          .catch((err) => {
            console.error("Fetch single website lead detail error:", err);
          });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadIdParam]);

  useLayoutEffect(() => {
    if (selectedLead) {
      const mainEl = document.querySelector("main");
      if (mainEl) mainEl.scrollTop = 0;
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, [selectedLead?.Id, selectedLead?.UTD]);

  useEffect(() => {
    if (!selectedLead && lastViewedLeadId) {
      const scrollTimer = setTimeout(() => {
        const rowEl = document.getElementById(`website-lead-row-${lastViewedLeadId}`);
        if (rowEl) {
          rowEl.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 50);

      return () => clearTimeout(scrollTimer);
    }
  }, [selectedLead, lastViewedLeadId]);

  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleFilterChange = (key: string, value: string) => {
    if (key === "searchQuery") setSearchQuery(value);
    if (key === "fromDate") setFromDate(value);
    if (key === "toDate") setToDate(value);
    if (key === "filterStatus") setFilterStatus(value);
    if (key === "filterProductName") setFilterProductName(value);
    if (key === "filterOtpVerified") setFilterOtpVerified(value);

    fetchWebsiteLeads(1, undefined, { [key]: value });
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchWebsiteLeads(1, undefined, { searchQuery: val });
    }, 300);
  };

  const handleResetFilter = () => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    setSearchQuery("");
    setFromDate("");
    setToDate("");
    setFilterStatus("");
    setFilterProductName("");
    setFilterOtpVerified("");

    fetchWebsiteLeads(1, undefined, {
      searchQuery: "",
      fromDate: "",
      toDate: "",
      filterStatus: "",
      filterProductName: "",
      filterOtpVerified: "",
    });
    fetchDashboardStats();
  };

  const handleFilterOtpVerified = () => {
    setFromDate("");
    setToDate("");
    setFilterStatus("");
    setSearchQuery("");
    setFilterProductName("");
    setFilterOtpVerified("true");

    fetchWebsiteLeads(1, undefined, {
      fromDate: "",
      toDate: "",
      searchQuery: "",
      filterStatus: "",
      filterProductName: "",
      filterOtpVerified: "true",
    });

    setTimeout(() => {
      document.getElementById("website-leads-table-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const handleFilterTotalLeads = () => {
    handleResetFilter();
    setTimeout(() => {
      document.getElementById("website-leads-table-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const handleOpenDetailView = (lead: WebsiteLead) => {
    const mainEl = document.querySelector("main");
    scrollPositionRef.current = mainEl ? mainEl.scrollTop : (window.scrollY || document.documentElement.scrollTop || 0);
    const targetId = lead.Id || lead.UTD;
    setLastViewedLeadId(targetId);

    if (mainEl) mainEl.scrollTop = 0;
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    setActivities([]);
    setLeadTemperature((lead.Temperature as any) || "Warm");
    setSelectedLead({ ...lead, UTD: targetId, Id: targetId });

    const info = getStatusDetails(lead.status);
    setActiveStage(info.label || "New");

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const dd = String(tomorrow.getDate()).padStart(2, "0");
    setFollowupDate(`${yyyy}-${mm}-${dd}`);
    setFollowupTime("11:00");

    fetchLeadActivities(targetId);
  };

  // Stage change handler
  const handleUpdateStage = async (targetStage: string) => {
    if (!selectedLead || isSubmittingActivity) return;

    if (targetStage === "Demo Scheduled") {
      openScheduleDemoModal();
      return;
    }
    const stageMap: Record<string, number> = {
      "New": 0,
      "Shortlisted": 10,
      "Contacted": 2,
      "Busy": 7,
      "Interested": 3,
      "Demo Scheduled": 4,
      "Quotation Sent": 1,
      "Won": 5,
      "Lost": 6,
      "Junk": 8,
    };
    const newStatusVal = stageMap[targetStage] !== undefined ? stageMap[targetStage] : 0;
    let customRemark = `Stage changed to ${targetStage}`;

    const leadTargetId = selectedLead.Id || selectedLead.UTD;
    const leadDisplayName = selectedLead.Name || selectedLead.Full_Name || "this customer";

    if (targetStage === "Junk") {
      const { isConfirmed } = await Swal.fire({
        html: `
          <div style="text-align: center; padding-top: 4px;">
            <div style="width: 54px; height: 54px; margin: 0 auto 16px auto; border-radius: 50%; background: #F1F5F9; border: 1.5px solid #CBD5E1; display: flex; align-items: center; justify-content: center; font-size: 26px; color: #64748B;">
              🗑️
            </div>
            <h3 style="font-size: 24px; font-weight: 800; color: #0F172A; margin: 0 0 8px 0; tracking: -0.02em;">
              Mark Lead as Junk?
            </h3>
            <p style="color: #64748B; font-size: 16px; margin: 0 0 16px 0; font-weight: 500; line-height: 1.5;">
              Are you sure you want to mark <b>${leadDisplayName}</b> as 
              <span style="color: #64748B; font-weight: 700;">Junk / Invalid</span>? Future automated calls will be stopped.
            </p>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: "Yes, Mark as Junk 🗑️",
        cancelButtonText: "Cancel",
        buttonsStyling: false,
        customClass: {
          popup: "rounded-3xl p-6 border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] max-w-md shadow-2xl font-sans",
          confirmButton: "px-5 py-2.5 bg-[#64748B] hover:bg-[#475569] text-white font-bold text-lg rounded-xl cursor-pointer shadow-md transition-all",
          cancelButton: "px-4 py-2.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] font-bold text-lg rounded-xl cursor-pointer transition-all mr-3",
        },
      });
      if (!isConfirmed) return;
      customRemark = "Lead marked as Junk / Invalid";
    }

    if (targetStage === "Lost") {
      const { value: lossReason, isConfirmed } = await Swal.fire({
        html: `
          <div style="text-align: center; padding-top: 4px;">
            <div style="width: 54px; height: 54px; margin: 0 auto 16px auto; border-radius: 50%; background: #EEF2FF; border: 1.5px solid #C7D2FE; display: flex; align-items: center; justify-content: center; font-size: 26px; color: #4F46E5;">
              ❓
            </div>
            <h3 style="font-size: 24px; font-weight: 800; color: #0F172A; margin: 0 0 8px 0; tracking: -0.02em;">
              Mark Lead as Lost?
            </h3>
            <p style="color: #64748B; font-size: 16px; margin: 0 0 16px 0; font-weight: 500; line-height: 1.5;">
              Are you sure you want to mark <b>${leadDisplayName}</b> as 
              <span style="color: #DC2626; font-weight: 700;">Lost</span>?
            </p>
            <div style="text-align: left;">
              <label style="display: block; font-size: 18px; font-weight: 700; color: #334155; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em;">
                Reason for Loss <span style="color: #DC2626;">*</span>
              </label>
              <textarea 
                id="swal-loss-remark" 
                rows="3" 
                style="width: 100%; box-sizing: border-box; padding: 10px 14px; font-size: 14px; border-radius: 12px; border: 1.5px solid #CBD5E1; background: #F8FAFC; color: #0F172A; font-family: inherit; resize: none; outline: none;" 
                placeholder="e.g. Price issue, Purchased from competitor, Customer not interested..."
              ></textarea>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: "Yes, Mark as Lost ❌",
        cancelButtonText: "Cancel",
        buttonsStyling: false,
        customClass: {
          popup: "rounded-3xl p-6 border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] max-w-md shadow-2xl font-sans",
          confirmButton: "px-5 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-lg rounded-xl cursor-pointer shadow-md transition-all",
          cancelButton: "px-4 py-2.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] font-bold text-lg rounded-xl cursor-pointer transition-all mr-3",
        },
        focusConfirm: false,
        preConfirm: () => {
          const val = (document.getElementById("swal-loss-remark") as HTMLTextAreaElement)?.value;
          if (!val || !val.trim()) {
            Swal.showValidationMessage("Mandatory: Please enter reason/remark for loss!");
            return false;
          }
          return val.trim();
        },
      });

      if (!isConfirmed || !lossReason) return;
      customRemark = `Lost Reason: ${lossReason}`;
    }

    try {
      setIsSubmittingActivity(true);
      const res = await axios.post(
        `${BASE_URL}/meta/updateLeadStatus`,
        {
          metaLeadUtd: leadTargetId,
          status: newStatusVal,
          remark: customRemark,
          isWebsiteLead: true,
          source: "WEBSITE",
        },
        {
          headers: {
            accept: "application/json",
            compcode: user?.Comp_Code || process.env.NEXT_PUBLIC_COMP_CODE || "1",
            name: user?.name,
            "x-lead-source": "WEBSITE",
            "Content-Type": "application/json",
          },
        }
      );

      const isSuccess = res.data?.success || res.data?.Status || res.data?.status;
      if (isSuccess) {
        showToast(res.data?.message || `Stage updated to ${targetStage}`, "success");
        if (targetStage === "Lost" || targetStage === "Won" || targetStage === "Junk") {
          setSelectedLead(null);
        } else {
          setActiveStage(targetStage);
          setSelectedLead({ ...selectedLead, status: newStatusVal });
          fetchLeadActivities(leadTargetId);
        }
        fetchWebsiteLeads(pagination.currentPage);
      } else {
        showToast(res.data?.message || "Failed to update lead status", "error");
      }
    } catch (err: any) {
      console.error("Update Lead Stage Error:", err);
      showToast(err?.response?.data?.message || err?.message || "Failed to update lead status", "error");
    } finally {
      setIsSubmittingActivity(false);
    }
  };

  // Update Lead Temperature Handler
  const handleUpdateTemperature = async (temp: "Cold" | "Warm" | "Hot") => {
    if (!selectedLead || isSubmittingActivity || leadTemperature === temp) return;
    const oldTemp = leadTemperature;
    const leadTargetId = selectedLead.Id || selectedLead.UTD;
    setLeadTemperature(temp);
    setSelectedLead((prev: any) => (prev ? { ...prev, Temperature: temp } : prev));
    setRows((prev) =>
      prev.map((r) => (r.Id === leadTargetId || r.UTD === leadTargetId ? { ...r, Temperature: temp } : r))
    );

    try {
      setIsSubmittingActivity(true);
      const res = await axios.post(
        `${BASE_URL}/meta/updateLeadTemperature`,
        {
          metaLeadUtd: leadTargetId,
          temperature: temp,
          isWebsiteLead: true,
          source: "WEBSITE",
        },
        {
          headers: {
            accept: "application/json",
            compcode: user?.Comp_Code || process.env.NEXT_PUBLIC_COMP_CODE || "1",
            name: user?.name,
            "x-lead-source": "WEBSITE",
            "Content-Type": "application/json",
          },
        }
      );

      if (res.data?.success) {
        showToast(`Lead marked as ${temp} 🔥`, "success");
        fetchLeadActivities(leadTargetId);
      } else {
        setLeadTemperature(oldTemp);
        showToast(res.data?.message || "Failed to update temperature", "error");
      }
    } catch (err: any) {
      setLeadTemperature(oldTemp);
      console.error("Update temperature error:", err);
      showToast(err?.response?.data?.message || "Failed to update lead temperature", "error");
    } finally {
      setIsSubmittingActivity(false);
    }
  };

  // Add Remark Handler
  const handleAddRemark = async () => {
    if (!newRemarkText.trim() || !selectedLead || isSubmittingActivity) return;
    const leadTargetId = selectedLead.Id || selectedLead.UTD;
    try {
      setIsSubmittingActivity(true);
      const res = await axios.post(
        `${BASE_URL}/meta/addActivity`,
        {
          metaLeadUtd: leadTargetId,
          activityType: "REMARK",
          activityStatus: "ADDED",
          remark: newRemarkText.trim(),
          isWebsiteLead: true,
          source: "WEBSITE",
        },
        {
          headers: {
            accept: "application/json",
            compcode: user?.Comp_Code || process.env.NEXT_PUBLIC_COMP_CODE || "1",
            name: user?.name,
            "x-lead-source": "WEBSITE",
            "Content-Type": "application/json",
          },
        }
      );

      if (res.data?.success) {
        setNewRemarkText("");
        showToast("Remark added successfully", "success");
        fetchLeadActivities(leadTargetId);
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message ?? "Failed to add remark", "error");
    } finally {
      setIsSubmittingActivity(false);
    }
  };

  // Schedule Follow-up Handler
  const handleScheduleFollowup = async () => {
    if (!selectedLead || !followupDate || isSubmittingActivity) {
      showToast("Please select a follow-up date", "warning");
      return;
    }

    const leadTargetId = selectedLead.Id || selectedLead.UTD;
    const fDate = followupDate;
    const fTime = followupTime || "11:00";

    try {
      setIsSubmittingActivity(true);
      const res = await axios.post(
        `${BASE_URL}/meta/createFollowup`,
        {
          metaLeadUtd: leadTargetId,
          followupDate: fDate,
          followupTime: fTime,
          followupType: followupType || "CALL",
          purpose: followupPurpose.trim() || "Website Customer Follow-up Scheduled",
          remark: `WhatsApp reminder: ${whatsappReminder ? "Yes" : "No"}`,
          isWebsiteLead: true,
          source: "WEBSITE",
        },
        {
          headers: {
            accept: "application/json",
            compcode: user?.Comp_Code || process.env.NEXT_PUBLIC_COMP_CODE || "1",
            name: user?.name,
            "x-lead-source": "WEBSITE",
            "Content-Type": "application/json",
          },
        }
      );

      if (res.data?.success) {
        showToast("Follow-up scheduled successfully!", "success");
        setFollowupPurpose("");
        fetchLeadActivities(leadTargetId);
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message ?? "Failed to schedule follow-up", "error");
    } finally {
      setIsSubmittingActivity(false);
    }
  };

  // Log Call Handler
  const handleSaveCallResult = async () => {
    if (!selectedLead || isSubmittingActivity) return;
    const leadTargetId = selectedLead.Id || selectedLead.UTD;
    try {
      setIsSubmittingActivity(true);
      const res = await axios.post(
        `${BASE_URL}/meta/addActivity`,
        {
          metaLeadUtd: leadTargetId,
          activityType: "CALL",
          activityStatus: "COMPLETED",
          callResult: callResult,
          remark: callRemark.trim() || `Call outcome: ${callResult}`,
          isWebsiteLead: true,
          source: "WEBSITE",
        },
        {
          headers: {
            accept: "application/json",
            compcode: user?.Comp_Code || process.env.NEXT_PUBLIC_COMP_CODE || "1",
            name: user?.name,
            "x-lead-source": "WEBSITE",
            "Content-Type": "application/json",
          },
        }
      );

      if (res.data?.success) {
        showToast("Call result logged successfully!", "success");
        setCallModalOpen(false);
        setCallRemark("");
        fetchLeadActivities(leadTargetId);
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message ?? "Error logging call", "error");
    } finally {
      setIsSubmittingActivity(false);
    }
  };

  // Trigger Callmatic AI Call Handler
  const [triggeringAiCall, setTriggeringAiCall] = useState<boolean>(false);
  const handleTriggerAiCall = async (leadId: number) => {
    if (!leadId || triggeringAiCall) return;
    try {
      setTriggeringAiCall(true);
      const res = await axios.post(
        `${BASE_URL}/meta/makeMetaCall`,
        { meta_lead_utd: leadId },
        {
          headers: {
            accept: "application/json",
            compcode: user?.Comp_Code || process.env.NEXT_PUBLIC_COMP_CODE || "1",
            name: user?.name,
            "Content-Type": "application/json",
          },
        }
      );
      if (res.data?.success) {
        showToast(
          `Callmatic AI Call triggered successfully! Call ID: ${res.data?.callId || "Initiated"}`,
          "success"
        );
        fetchLeadActivities(leadId);
      } else {
        showToast(res.data?.message || "Failed to trigger AI call", "error");
      }
    } catch (err: any) {
      console.error("AI Call trigger error:", err);
      showToast(
        err.response?.data?.message || "Error occurred while triggering Callmatic AI call",
        "error"
      );
    } finally {
      setTriggeringAiCall(false);
    }
  };

  // ── Callmatic AI Call History & Recording Modal States ──
  const [isCallHistoryModalOpen, setIsCallHistoryModalOpen] = useState<boolean>(false);
  const [callHistoryLead, setCallHistoryLead] = useState<any>(null);
  const [callHistoryData, setCallHistoryData] = useState<any[]>([]);
  const [isLoadingCallHistory, setIsLoadingCallHistory] = useState<boolean>(false);

  const [selectedCallTranscript, setSelectedCallTranscript] = useState<any>(null);
  const [selectedCallItem, setSelectedCallItem] = useState<any>(null);
  const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState<boolean>(false);

  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState<boolean>(false);
  const [isLoadingRecording, setIsLoadingRecording] = useState<boolean>(false);
  const [playingCallId, setPlayingCallId] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState<boolean>(false);
  const [selectedSummaryText, setSelectedSummaryText] = useState<string>("");

  // Fetch Enriched AI Call History for Lead
  const handleOpenCallHistory = async (lead: any) => {
    const leadTargetId = lead?.Id || lead?.UTD;
    if (!lead || !leadTargetId) return;
    setCallHistoryLead(lead);
    setIsCallHistoryModalOpen(true);
    setIsLoadingCallHistory(true);
    setCallHistoryData([]);

    try {
      const res = await axios.post(
        `${BASE_URL}/meta/getMetaCallHistory`,
        { meta_lead_utd: leadTargetId },
        {
          headers: {
            accept: "application/json",
            compcode: user?.Comp_Code || process.env.NEXT_PUBLIC_COMP_CODE || "1",
            name: user?.name,
            "Content-Type": "application/json",
          },
        }
      );

      const list = res.data?.Data || res.data?.data || [];
      if ((res.data?.Status || res.data?.success) && Array.isArray(list)) {
        setCallHistoryData(list);
      } else {
        setCallHistoryData([]);
      }
      fetchLeadActivities(leadTargetId);
    } catch (err: any) {
      console.error("Fetch call history error:", err);
      showToast(err.response?.data?.Message || "Failed to fetch AI call history", "error");
    } finally {
      setIsLoadingCallHistory(false);
    }
  };

  // Play Live Audio Recording Handler
  const handlePlayRecording = async (callId: string) => {
    if (!callId) return;
    try {
      setPlayingCallId(callId);
      setIsRecordingModalOpen(true);
      setIsLoadingRecording(true);
      setAudioUrl(null);

      const response = await axios.get(
        `${BASE_URL}/meta/getMetaCallRecording/${callId}`,
        {
          headers: {
            accept: "*/*",
            compcode: user?.Comp_Code || process.env.NEXT_PUBLIC_COMP_CODE || "1",
            name: user?.name,
          },
          responseType: "blob",
        }
      );

      const contentType = response.headers["content-type"] || "audio/mpeg";
      const blob = new Blob([response.data], { type: contentType });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    } catch (err: any) {
      console.error("Recording fetch error:", err);
      showToast(err?.response?.data?.Message || err?.message || "Unable to fetch call recording", "error");
      setIsRecordingModalOpen(false);
    } finally {
      setIsLoadingRecording(false);
    }
  };

  const closeRecordingModal = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setIsRecordingModalOpen(false);
    setAudioUrl(null);
    setPlayingCallId(null);
  };

  // Confirm Schedule Demo Handler
  const handleConfirmScheduleDemo = async () => {
    if (!selectedLead || isSubmittingActivity) return;

    if (!demoDate) {
      showToast("Please enter a demo date", "warning");
      return;
    }
    if (!demoTime) {
      showToast("Please enter a demo time", "warning");
      return;
    }

    const leadTargetId = selectedLead.Id || selectedLead.UTD;
    const customerFullName = selectedLead.Name || selectedLead.Full_Name || "Website Customer";
    const customerPhone = selectedLead.MobileNumber || selectedLead.Phone_Number || null;

    if (demoType === "MICROSOFT_TEAMS") {
      const email = (demoModalEmailInput.trim() || selectedLead.Email || "").trim();
      if (!email || !email.includes("@")) {
        showToast("Customer email is required for Microsoft Teams meeting. Please enter customer email above.", "warning");
        setIsEditingDemoModalEmail(true);
        return;
      }

      try {
        setIsSubmittingActivity(true);

        const res = await axios.post(
          `${BASE_URL}/meta/scheduleTeamsDemo`,
          {
            leadUtd: leadTargetId,
            metaLeadId: selectedLead.Meta_Lead_Id || String(leadTargetId),
            customerName: customerFullName,
            customerEmail: email,
            customerMobile: customerPhone,
            demoDate: demoDate,
            demoTime: demoTime,
            demoRemark: demoRemark.trim() || `Website Lead Product Demo Session`,
            demoPlatform: "MICROSOFT_TEAMS",
            demoCcEmails: demoCcEmails,
            saveToCampaign: saveCcToCampaign,
            userCode: user?.user_id || user?.usercode || user?.id || user?.name || "ADMIN",
            userName: user?.name || "Admin",
            userEmail: user?.email || user?.Email || null,
            isWebsiteLead: true,
            source: "WEBSITE",
          },
          {
            headers: {
              accept: "application/json",
              compcode: user?.Comp_Code || process.env.NEXT_PUBLIC_COMP_CODE || "1",
              name: user?.name,
              "x-lead-source": "WEBSITE",
              "Content-Type": "application/json",
            },
          }
        );

        if (res.data?.success) {
          showToast("Demo scheduled successfully and Teams meeting invitation sent.", "success");
          setScheduleDemoModalOpen(false);
          setActiveStage("Demo Scheduled");
          const ccStr = demoCcEmails.join(", ");
          setSelectedLead((prev: any) => (prev ? { ...prev, Email: email, status: 4, Demo_CC_Emails: ccStr } : prev));
          setRows((prev) =>
            prev.map((r) => ((r.Id === leadTargetId || r.UTD === leadTargetId) ? { ...r, Email: email, status: 4, Demo_CC_Emails: ccStr } : r))
          );
          fetchLeadActivities(leadTargetId);
          fetchWebsiteLeads(pagination.currentPage);
        } else {
          showToast(res.data?.message || "Failed to schedule Microsoft Teams demo", "error");
        }
      } catch (err: any) {
        console.error("Teams demo scheduling error:", err);
        showToast(
          err?.response?.data?.message ||
            err?.response?.data?.Message ||
            err?.message ||
            "Error scheduling Microsoft Teams demo",
          "error"
        );
      } finally {
        setIsSubmittingActivity(false);
      }
      return;
    }

    // Standard online/offline demo flow
    try {
      setIsSubmittingActivity(true);

      await axios.post(
        `${BASE_URL}/meta/updateLeadStatus`,
        {
          metaLeadUtd: leadTargetId,
          status: 4,
          remark: demoRemark.trim() || `Demo Scheduled for ${demoDate} at ${demoTime}`,
          isWebsiteLead: true,
          source: "WEBSITE",
        },
        {
          headers: {
            accept: "application/json",
            compcode: user?.Comp_Code || process.env.NEXT_PUBLIC_COMP_CODE || "1",
            name: user?.name,
            "x-lead-source": "WEBSITE",
            "Content-Type": "application/json",
          },
        }
      );

      await axios.post(
        `${BASE_URL}/meta/createFollowup`,
        {
          metaLeadUtd: leadTargetId,
          followupDate: demoDate,
          followupTime: demoTime,
          followupType: "DEMO",
          purpose: `Demo Scheduled (${demoType})`,
          remark: demoRemark.trim() || `Website Product demo scheduled via ${demoType}`,
          isWebsiteLead: true,
          source: "WEBSITE",
        },
        {
          headers: {
            accept: "application/json",
            compcode: user?.Comp_Code || process.env.NEXT_PUBLIC_COMP_CODE || "1",
            name: user?.name,
            "x-lead-source": "WEBSITE",
            "Content-Type": "application/json",
          },
        }
      );

      showToast(`Demo scheduled for ${demoDate} at ${demoTime}! Stage updated to Demo Scheduled 🎉`, "success");
      setScheduleDemoModalOpen(false);
      setActiveStage("Demo Scheduled");
      setSelectedLead({ ...selectedLead, status: 4 });
      fetchLeadActivities(leadTargetId);
      fetchWebsiteLeads(pagination.currentPage);
    } catch (err: any) {
      showToast(err?.response?.data?.message ?? "Error scheduling demo", "error");
    } finally {
      setIsSubmittingActivity(false);
    }
  };

  // WhatsApp Action Handler
  const handleWhatsAppAction = async (phone: string, leadId: number) => {
    const cleanPhone = phone.replace(/\D/g, "");
    window.open(`https://wa.me/${cleanPhone}`, "_blank");

    try {
      await axios.post(
        `${BASE_URL}/meta/addActivity`,
        {
          metaLeadUtd: leadId,
          activityType: "WHATSAPP",
          activityStatus: "OPENED",
          remark: "Opened WhatsApp chat with website customer",
          isWebsiteLead: true,
          source: "WEBSITE",
        },
        {
          headers: {
            accept: "application/json",
            compcode: user?.Comp_Code || process.env.NEXT_PUBLIC_COMP_CODE || "1",
            name: user?.name,
            "x-lead-source": "WEBSITE",
            "Content-Type": "application/json",
          },
        }
      );

      if (selectedLead && (selectedLead.Id === leadId || selectedLead.UTD === leadId)) {
        fetchLeadActivities(leadId);
      }
    } catch (_) { }
  };

  const handleQuickAction = async (actionName: string) => {
    if (!selectedLead) return;
    const leadTargetId = selectedLead.Id || selectedLead.UTD;

    if (actionName.toLowerCase().includes("demo")) {
      openScheduleDemoModal();
      return;
    }

    if (actionName.toLowerCase().includes("quotation")) {
      try {
        await axios.post(
          `${BASE_URL}/meta/updateLeadStatus`,
          {
            metaLeadUtd: leadTargetId,
            status: 1,
            remark: "Quotation triggered - stage changed to Quotation Sent",
            isWebsiteLead: true,
            source: "WEBSITE",
          },
          {
            headers: {
              accept: "application/json",
              compcode: user?.Comp_Code || process.env.NEXT_PUBLIC_COMP_CODE || "1",
              name: user?.name,
              "x-lead-source": "WEBSITE",
              "Content-Type": "application/json",
            },
          }
        );

        await axios.post(
          `${BASE_URL}/meta/addActivity`,
          {
            metaLeadUtd: leadTargetId,
            activityType: "QUOTATION",
            activityStatus: "TRIGGERED",
            remark: `${actionName} action triggered for website lead`,
            isWebsiteLead: true,
            source: "WEBSITE",
          },
          {
            headers: {
              accept: "application/json",
              compcode: user?.Comp_Code || process.env.NEXT_PUBLIC_COMP_CODE || "1",
              name: user?.name,
              "x-lead-source": "WEBSITE",
              "Content-Type": "application/json",
            },
          }
        );

        showToast(`${actionName} triggered! Stage updated to Quotation Sent 📄`, "success");
        setActiveStage("Quotation Sent");
        setSelectedLead((prev: any) => (prev ? { ...prev, status: 1 } : prev));
        setRows((prev) =>
          prev.map((r) => ((r.Id === leadTargetId || r.UTD === leadTargetId) ? { ...r, status: 1 } : r))
        );
        fetchLeadActivities(leadTargetId);
      } catch (_) {
        showToast(`Action ${actionName} completed`, "info");
      }

      const company = selectedLead.CompanyName || selectedLead.Company_Name || "";
      const customerFullName = selectedLead.Name || selectedLead.Full_Name || "";
      const rawMobile = selectedLead.MobileNumber || selectedLead.Phone_Number || "";

      const queryParams = new URLSearchParams();
      queryParams.set("action", "new");
      queryParams.set("source", "website_lead");
      if (company) queryParams.set("company", company);
      if (customerFullName) queryParams.set("stakeholder", customerFullName);
      if (rawMobile) {
        const cleanMobile = rawMobile.replace(/[^0-9]/g, "").slice(-10);
        queryParams.set("mobile", cleanMobile);
      }
      if (selectedLead.Email) queryParams.set("email", selectedLead.Email);
      if (selectedLead.City) queryParams.set("headquarters", selectedLead.City);
      if (selectedLead.ProductName || selectedLead.Product_Name) {
        queryParams.set("product", selectedLead.ProductName || selectedLead.Product_Name || "");
      }
      queryParams.set("leadUtd", String(leadTargetId));

      router.push(`/autovyn/admin/HRMS/ClientIntakeForm?${queryParams.toString()}`);
      return;
    }

    try {
      await axios.post(
        `${BASE_URL}/meta/addActivity`,
        {
          metaLeadUtd: leadTargetId,
          activityType: "QUOTATION",
          activityStatus: "TRIGGERED",
          remark: `${actionName} action triggered`,
        },
        {
          headers: {
            accept: "application/json",
            compcode: user?.Comp_Code || process.env.NEXT_PUBLIC_COMP_CODE || "1",
            name: user?.name,
            "Content-Type": "application/json",
          },
        }
      );
      showToast(`${actionName} triggered for ${selectedLead.Name || selectedLead.Full_Name || "Customer"}`, "info");
      fetchLeadActivities(leadTargetId);
    } catch (_) {
      showToast(`Action ${actionName} completed`, "info");
    }
  };

  // ── Edit Submitted Form Details & Email Modal ────────
  const editFieldsContainerRef = React.useRef<HTMLDivElement | null>(null);

  const handleOpenEditFormModal = () => {
    if (!selectedLead) return;
    setEditEmail(selectedLead.Email || "");

    let fieldsObj: Record<string, any> = {};
    try {
      if (typeof selectedLead.All_Fields === "string") {
        fieldsObj = JSON.parse(selectedLead.All_Fields);
      } else if (typeof selectedLead.All_Fields === "object" && selectedLead.All_Fields !== null) {
        fieldsObj = selectedLead.All_Fields;
      }
    } catch (_) { }

    const entries = Object.entries(fieldsObj).map(([k, v]) => ({
      key: k,
      value: v !== null && v !== undefined ? String(v) : "",
    }));

    if (entries.length === 0) {
      setEditFormFields([
        { key: "Customer / Contact Person", value: selectedLead.Name || selectedLead.Full_Name || "" },
        { key: "Company Name", value: selectedLead.CompanyName || selectedLead.Company_Name || "" },
        { key: "Product Name", value: selectedLead.ProductName || selectedLead.Product_Name || "" },
        { key: "Message", value: selectedLead.Message || "" },
      ]);
    } else {
      setEditFormFields(entries);
    }

    setIsEditFormModalOpen(true);
  };

  const handleAddEditFormField = () => {
    setEditFormFields((prev) => [...prev, { key: "", value: "" }]);
    setTimeout(() => {
      if (editFieldsContainerRef.current) {
        editFieldsContainerRef.current.scrollTo({
          top: editFieldsContainerRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    }, 60);
  };

  const handleEditFormFieldChange = (index: number, field: "key" | "value", val: string) => {
    setEditFormFields((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  const handleRemoveEditFormField = (index: number) => {
    setEditFormFields((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveLeadDetails = async () => {
    if (!selectedLead || isSavingLeadDetails) return;
    const leadTargetId = selectedLead.Id || selectedLead.UTD;

    try {
      setIsSavingLeadDetails(true);

      const allFieldsObj: Record<string, any> = {};
      editFormFields.forEach((item) => {
        const trimmedKey = item.key.trim();
        if (trimmedKey) {
          allFieldsObj[trimmedKey] = item.value.trim();
        }
      });

      const cleanEmail = editEmail.trim();

      const res = await axios.post(
        `${BASE_URL}/meta/updateLeadDetails`,
        {
          metaLeadUtd: leadTargetId,
          email: cleanEmail,
          allFields: allFieldsObj,
          isWebsiteLead: true,
          source: "WEBSITE",
        },
        {
          headers: {
            accept: "application/json",
            compcode: user?.Comp_Code || process.env.NEXT_PUBLIC_COMP_CODE || "1",
            name: user?.name,
            "x-lead-source": "WEBSITE",
            "Content-Type": "application/json",
          },
        }
      );

      if (res.data?.success || res.data?.Status) {
        showToast("Website lead details & email updated successfully! 🎉", "success");
        setSelectedLead((prev: any) =>
          prev
            ? {
                ...prev,
                Email: cleanEmail,
                All_Fields: allFieldsObj,
              }
            : prev
        );
        setRows((prev) =>
          prev.map((r) =>
            r.Id === leadTargetId || r.UTD === leadTargetId
              ? { ...r, Email: cleanEmail, All_Fields: allFieldsObj }
              : r
          )
        );
        setIsEditFormModalOpen(false);
        fetchLeadActivities(leadTargetId);
      } else {
        showToast(res.data?.message || "Failed to update lead details", "error");
      }
    } catch (err: any) {
      console.error("Save lead details error:", err);
      showToast(
        err?.response?.data?.message ||
          err?.response?.data?.Message ||
          "Error saving lead details",
        "error"
      );
    } finally {
      setIsSavingLeadDetails(false);
    }
  };

  // ── Manual Lead Form Handlers ─────────────────────────────
  const handleAddCustomQuestion = () => {
    setNewLeadForm((prev) => ({
      ...prev,
      customQuestions: [...prev.customQuestions, { question: "", answer: "" }],
    }));
  };

  const handleCustomQuestionChange = (
    index: number,
    field: "question" | "answer",
    value: string
  ) => {
    setNewLeadForm((prev) => {
      const updated = [...prev.customQuestions];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, customQuestions: updated };
    });
  };

  const handleRemoveCustomQuestion = (index: number) => {
    setNewLeadForm((prev) => ({
      ...prev,
      customQuestions: prev.customQuestions.filter((_, idx) => idx !== index),
    }));
  };

  const handleCreateManualLead = async () => {
    if (!newLeadForm.dealerName.trim()) {
      showToast("Please enter Customer / Contact Person Name", "warning");
      return;
    }
    if (!newLeadForm.phoneNumber.trim()) {
      showToast("Please enter Mobile / Phone Number", "warning");
      return;
    }

    try {
      setIsSubmittingLead(true);
      const finalEmployees =
        newLeadForm.noOfEmployees === "Other"
          ? (newLeadForm.customNoOfEmployees || "").trim()
          : newLeadForm.noOfEmployees.trim();

      const finalModule =
        newLeadForm.module === "Other"
          ? (newLeadForm.customModule || "").trim()
          : newLeadForm.module.trim();

      const res = await axios.post(
        `${BASE_URL}/meta/createManualLead`,
        {
          dealerName: newLeadForm.dealerName.trim(),
          phoneNumber: newLeadForm.phoneNumber.trim(),
          designation: newLeadForm.designation.trim(),
          companyName: newLeadForm.companyName.trim(),
          noOfEmployees: finalEmployees,
          module: finalModule,
          campaignId: newLeadForm.campaignId.trim(),
          email: newLeadForm.email.trim(),
          city: newLeadForm.city.trim(),
          customQuestions: newLeadForm.customQuestions.filter(
            (q) => q.question.trim() || q.answer.trim()
          ),
        },
        {
          headers: {
            accept: "application/json",
            compcode: user?.Comp_Code || process.env.NEXT_PUBLIC_COMP_CODE || "1",
            name: user?.name,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.data?.success || res.data?.Status) {
        showToast("Lead created successfully! 🎉", "success");
        setAddLeadModalOpen(false);
        setNewLeadForm({
          dealerName: "",
          phoneNumber: "",
          designation: "",
          companyName: "",
          noOfEmployees: "",
          customNoOfEmployees: "",
          module: "HR Setu",
          customModule: "",
          campaignId: "",
          email: "",
          city: "",
          customQuestions: [],
        });
        fetchWebsiteLeads(1);
        fetchDashboardStats();
      } else {
        showToast(res.data?.message || "Failed to create lead", "error");
      }
    } catch (err: any) {
      console.error("Create manual lead error:", err);
      showToast(
        err?.response?.data?.message ||
        err?.response?.data?.Message ||
        "Error creating manual lead",
        "error"
      );
    } finally {
      setIsSubmittingLead(false);
    }
  };

  const isCustomerMessage = (tItem: any, index: number) => {
    if (!tItem) return index % 2 !== 0;

    const role = String(
      tItem.role ||
      tItem.speaker ||
      tItem.type ||
      tItem.sender ||
      tItem.from ||
      tItem.name ||
      ""
    ).toLowerCase();

    if (
      role.includes("user") ||
      role.includes("customer") ||
      role.includes("caller") ||
      role.includes("human") ||
      role.includes("client") ||
      role.includes("callee")
    ) {
      return true;
    }

    if (
      role.includes("agent") ||
      role.includes("bot") ||
      role.includes("assistant") ||
      role.includes("ai") ||
      role.includes("system")
    ) {
      return false;
    }

    return index % 2 !== 0;
  };

  // ── Render Shared Callmatic AI Modals ──
  const renderCallModals = () => {
    const totalCalls = callHistoryData?.length || 0;
    const completedCount = callHistoryData?.filter((c: any) => String(c.status || "").toLowerCase() === "completed").length || 0;
    const busyCount = callHistoryData?.filter((c: any) => String(c.status || "").toLowerCase() === "busy").length || 0;
    const noAnswerCount = callHistoryData?.filter((c: any) => ["no_answer", "no-answer", "unanswered"].includes(String(c.status || "").toLowerCase())).length || 0;
    const failedCount = callHistoryData?.filter((c: any) => ["failed", "rejected", "canceled"].includes(String(c.status || "").toLowerCase())).length || 0;
    const appointmentsCount = completedCount;
    const totalDurationSec = callHistoryData?.reduce((acc: number, c: any) => acc + (Number(c.duration) || 0), 0) || 0;
    const totalDurationFormatted = totalDurationSec >= 60 ? `${Math.floor(totalDurationSec / 60)} min` : `${totalDurationSec} sec`;

    return (
      <>
        {/* ══ AI CALL HISTORY MODAL ══ */}
        <Modal
          isOpen={isCallHistoryModalOpen}
          onClose={() => setIsCallHistoryModalOpen(false)}
          widthClass="max-w-7xl"
          zIndexClass="z-[99990]"
        >
          <div className="flex items-center justify-between bg-[#1B2A4A] dark:bg-[#0F172A] px-6 py-4 text-white">
            <div>
              <h3 className="text-xl font-bold tracking-tight">
                {callHistoryLead?.Name || callHistoryLead?.Full_Name || "Website Lead AI Call History"}
              </h3>
              <p className="text-lg text-[#94A3B8] mt-0.5 font-medium">
                {callHistoryLead?.Name || callHistoryLead?.Full_Name || "Customer"} • {callHistoryLead?.MobileNumber || callHistoryLead?.Phone_Number || "N/A"} {callHistoryLead?.ProductName ? `• Product: ${callHistoryLead.ProductName}` : ""}
              </p>
            </div>
            <button
              onClick={() => setIsCallHistoryModalOpen(false)}
              className="p-1.5 rounded-full hover:bg-white/10 transition-all cursor-pointer text-white"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 max-h-[80vh] overflow-y-auto bg-[#F8FAFC] dark:bg-[#090D16]">
            {isLoadingCallHistory ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <HashloaderComponent isLoading={true} />
                <p className="text-lg text-[#64748B] dark:text-[#94A3B8]">Loading Callmatic AI Call History...</p>
              </div>
            ) : callHistoryData && callHistoryData.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
                  <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl p-3 text-center shadow-2xs">
                    <div className="text-xl font-bold text-[#0F172A] dark:text-white">{totalCalls}</div>
                    <div className="text-lg font-medium text-[#64748B] dark:text-[#94A3B8] mt-1">Total Calls</div>
                  </div>

                  <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl p-3 text-center shadow-2xs">
                    <div className="text-xl font-bold text-[#16A34A]">{completedCount}</div>
                    <div className="text-lg font-medium text-[#64748B] dark:text-[#94A3B8] mt-1">Completed</div>
                  </div>

                  <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl p-3 text-center shadow-2xs">
                    <div className="text-xl font-bold text-[#D97706]">{busyCount}</div>
                    <div className="text-lg font-medium text-[#64748B] dark:text-[#94A3B8] mt-1">Busy</div>
                  </div>

                  <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl p-3 text-center shadow-2xs">
                    <div className="text-xl font-bold text-[#475569]">{noAnswerCount}</div>
                    <div className="text-lg font-medium text-[#64748B] dark:text-[#94A3B8] mt-1">No Answer</div>
                  </div>

                  <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl p-3 text-center shadow-2xs">
                    <div className="text-xl font-bold text-[#DC2626]">{failedCount}</div>
                    <div className="text-lg font-medium text-[#64748B] dark:text-[#94A3B8] mt-1">Failed</div>
                  </div>

                  <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl p-3 text-center shadow-2xs">
                    <div className="text-xl font-bold text-[#2563EB]">{appointmentsCount}</div>
                    <div className="text-lg font-medium text-[#64748B] dark:text-[#94A3B8] mt-1">Appointments</div>
                  </div>

                  <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl p-3 text-center shadow-2xs">
                    <div className="text-xl font-bold text-[#0F172A] dark:text-white">{totalDurationFormatted}</div>
                    <div className="text-lg font-medium text-[#64748B] dark:text-[#94A3B8] mt-1">Total Duration</div>
                  </div>
                </div>

                <div className="border border-[#E2E8F0] dark:border-[#334155] rounded-xl overflow-hidden shadow-2xs bg-white dark:bg-[#0F172A]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#F8FAFC] dark:bg-[#1E293B]/80 border-b border-[#E2E8F0] dark:border-[#334155]">
                          <th className="px-4 py-3 text-lg font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">TIME</th>
                          <th className="px-4 py-3 text-lg font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">TO PHONE NUMBER</th>
                          <th className="px-4 py-3 text-lg font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">STATUS</th>
                          <th className="px-4 py-3 text-lg font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">DURATION</th>
                          <th className="px-4 py-3 text-lg font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">CHANNEL</th>
                          <th className="px-4 py-3 text-center text-lg font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">RECORDING</th>
                          <th className="px-4 py-3 text-center text-lg font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">TRANSCRIPT</th>
                          <th className="px-4 py-3 text-center text-lg font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">SUMMARY</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#334155] text-lg font-medium">
                        {callHistoryData.map((call: any, idx: number) => {
                          const statusStr = String(call.status || "completed").toLowerCase();
                          const isCompleted = statusStr === "completed";
                          const isFailed = ["failed", "no_answer", "busy", "rejected"].includes(statusStr);

                          return (
                            <tr key={call.Call_Id || idx} className="hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]/50 transition-colors">
                              <td className="px-4 py-3.5 text-[#334155] dark:text-[#E2E8F0] whitespace-nowrap">
                                {formatDateForDisplay(call.Created_At)}
                              </td>
                              <td className="px-4 py-3.5 text-[#334155] dark:text-[#E2E8F0] whitespace-nowrap font-medium">
                                {call.Phone_Number || callHistoryLead?.MobileNumber || callHistoryLead?.Phone_Number || "N/A"}
                              </td>
                              <td className="px-4 py-3.5 whitespace-nowrap font-bold text-lg uppercase">
                                <span className={`inline-flex items-center gap-1.5 ${isCompleted ? "text-[#16A34A]" : isFailed ? "text-[#DC2626]" : "text-[#D97706]"}`}>
                                  <span className="w-2 h-2 rounded-full bg-current" />
                                  {call.status || "completed"}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-[#334155] dark:text-[#E2E8F0] whitespace-nowrap font-semibold">
                                {call.duration !== null && call.duration !== undefined && !isNaN(Number(call.duration)) && Number(call.duration) > 0
                                  ? `${Number(call.duration)} sec`
                                  : "0 sec"}
                              </td>
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                {String(call.Call_Type || "").toUpperCase() === "AUTO_AI_CALL" ||
                                  String(call.Call_Source || "").toUpperCase().includes("CRON") ? (
                                  <span className="px-2.5 py-1 rounded-full text-lg font-bold bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC]">
                                    🤖 Auto AI Call
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-full text-lg font-bold bg-[#FFEDD5] text-[#C2410C] border border-[#FED7AA]">
                                    👤 Manual AI Call
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3.5 text-center whitespace-nowrap">
                                {call.Call_Id ? (
                                  <button
                                    onClick={() => handlePlayRecording(call.Call_Id)}
                                    className="p-1.5 text-[#2563EB] hover:bg-[#EFF6FF] dark:hover:bg-[#1E293B] rounded-full transition-all cursor-pointer inline-flex items-center justify-center"
                                    title="Play Call Recording"
                                  >
                                    <PlayCircle size={20} />
                                  </button>
                                ) : (
                                  <span className="text-[#94A3B8]">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3.5 text-center whitespace-nowrap">
                                {call.transcript ? (
                                  <button
                                    onClick={() => {
                                      setSelectedCallTranscript(call.transcript);
                                      setSelectedCallItem(call);
                                      setIsTranscriptModalOpen(true);
                                    }}
                                    className="p-1.5 text-[#7C3AED] hover:bg-[#F5F3FF] dark:hover:bg-[#1E293B] rounded-full transition-all cursor-pointer inline-flex items-center justify-center"
                                    title="View Voice Transcript"
                                  >
                                    <MessageSquare size={20} />
                                  </button>
                                ) : (
                                  <span className="text-[#94A3B8]">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3.5 text-center whitespace-nowrap">
                                {call.summary ? (
                                  <button
                                    onClick={() => {
                                      setSelectedSummaryText(call.summary);
                                      setIsSummaryModalOpen(true);
                                    }}
                                    className="p-1.5 text-[#C026D3] hover:bg-[#FDF4FF] dark:hover:bg-[#1E293B] rounded-full transition-all cursor-pointer inline-flex items-center justify-center"
                                    title="View AI Call Summary"
                                  >
                                    <BarChart2 size={20} />
                                  </button>
                                ) : (
                                  <span className="text-[#94A3B8]">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-16 space-y-2 bg-white dark:bg-[#0F172A] rounded-xl border border-[#E2E8F0] dark:border-[#334155]">
                <Bot size={44} className="mx-auto text-[#94A3B8] opacity-50" />
                <p className="text-lg font-bold text-[#64748B] dark:text-[#94A3B8]">No AI Call Records Found</p>
                <p className="text-lg text-[#94A3B8]">Trigger an AI Call to view real-time call status and recordings here.</p>
              </div>
            )}
          </div>
        </Modal>

        {/* ══ AI SUMMARY MODAL ══ */}
        <Modal
          isOpen={isSummaryModalOpen}
          onClose={() => setIsSummaryModalOpen(false)}
          widthClass="max-w-md"
          zIndexClass="z-[999999]"
        >
          <div className="flex items-center justify-between bg-[#C026D3] px-5 py-3 text-white">
            <h3 className="flex items-center gap-2 text-lg font-bold">
              <BarChart2 size={18} /> AI Call Summary
            </h3>
            <button onClick={() => setIsSummaryModalOpen(false)} className="hover:opacity-80 cursor-pointer text-white">
              <X size={18} />
            </button>
          </div>
          <div className="p-5 max-h-[60vh] overflow-y-auto">
            <p className="text-lg text-[#334155] dark:text-[#E2E8F0] leading-relaxed whitespace-pre-wrap">
              {selectedSummaryText || "No summary available for this call."}
            </p>
          </div>
        </Modal>

        {/* ══ WHATSAPP STYLE VOICE TRANSCRIPT MODAL ══ */}
        <Modal
          isOpen={isTranscriptModalOpen}
          onClose={() => setIsTranscriptModalOpen(false)}
          widthClass="max-w-xl"
          zIndexClass="z-[999999]"
        >
          <div className="flex items-center justify-between bg-header dark:bg-[#111B21] px-5 py-3 text-white shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#128C7E] flex items-center justify-center font-bold text-white shadow-xs">
                <Bot size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold leading-tight">
                  {(selectedCallItem?.Provider || "Callmatic")} AI Voice Call Transcript
                </h3>
                <p className="text-lg text-[#E0F2F1] dark:text-[#8696A0] flex items-center gap-2 flex-wrap">
                  <span>Customer: <span className="font-semibold">{callHistoryLead?.Name || callHistoryLead?.Full_Name || "Customer"}</span></span>
                  {selectedCallItem?.duration ? (
                    <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                      ⏱ {Number(selectedCallItem.duration)} sec
                    </span>
                  ) : null}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsTranscriptModalOpen(false)}
              className="p-1.5 rounded-full hover:bg-white/10 transition-all cursor-pointer text-white"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-4 max-h-[70vh] overflow-y-auto space-y-3 bg-[#E5DDD5] dark:bg-[#0B141A] min-h-[350px]">
            {(() => {
              let msgs: any[] = [];
              if (Array.isArray(selectedCallTranscript)) {
                msgs = selectedCallTranscript;
              } else if (typeof selectedCallTranscript === "string") {
                const trimmed = selectedCallTranscript.trim();
                try {
                  const parsed = JSON.parse(trimmed);
                  if (Array.isArray(parsed)) msgs = parsed;
                } catch (_) {}

                if (msgs.length === 0 && trimmed) {
                  const splitRegex = /(Agent:|User:|Bot:|Human:|Caller:|Customer:|Assistant:)/i;
                  const tokens = trimmed.split(splitRegex);
                  if (tokens.length > 1) {
                    let currentSpeaker = "";
                    for (let i = 0; i < tokens.length; i++) {
                      const token = tokens[i].trim();
                      if (!token) continue;
                      if (/^(Agent|User|Bot|Human|Caller|Customer|Assistant):$/i.test(token)) {
                        currentSpeaker = token.replace(":", "").toLowerCase();
                      } else if (currentSpeaker) {
                        const isU = currentSpeaker.includes("user") || currentSpeaker.includes("human") || currentSpeaker.includes("customer") || currentSpeaker.includes("caller");
                        const cleanText = token.replace(/^["'`]|["'`]$/g, "").trim();
                        if (cleanText) {
                          msgs.push({
                            sender: isU ? "human" : "bot",
                            role: isU ? "user" : "agent",
                            speaker: isU ? (callHistoryLead?.Name || callHistoryLead?.Full_Name || "Customer") : "Callmatic AI Agent",
                            text: cleanText,
                            message: cleanText,
                          });
                        }
                        currentSpeaker = "";
                      }
                    }
                  } else {
                    msgs = [{
                      sender: "bot",
                      role: "agent",
                      speaker: "Callmatic AI Agent",
                      text: trimmed,
                      message: trimmed,
                    }];
                  }
                }
              }

              return msgs.length > 0 ? (
                msgs.map((tItem: any, idx: number) => {
                  const isUser = isCustomerMessage(tItem, idx);
                  const messageText =
                    typeof tItem === "string"
                      ? tItem
                      : tItem.content || tItem.text || tItem.message || tItem.transcript || JSON.stringify(tItem);

                  return (
                    <div
                      key={idx}
                      className={`flex flex-col ${isUser ? "items-end" : "items-start"} mb-1`}
                    >
                      <span className="text-[14px] font-semibold text-[#54656F] dark:text-[#8696A0] mb-0.5 px-1">
                        {isUser ? (callHistoryLead?.Name || callHistoryLead?.Full_Name || "Customer") : (tItem.speaker || "Callmatic AI Agent")}
                      </span>

                      <div
                        className={`relative max-w-[82%] p-3 rounded-2xl text-lg leading-relaxed shadow-xs ${isUser
                          ? "bg-[#DCF8C6] dark:bg-[#005C4B] text-[#111B21] dark:text-[#E9EDEF] rounded-tr-none border border-[#B9E69B]/50 dark:border-[#005C4B]"
                          : "bg-white dark:bg-[#202C33] text-[#111B21] dark:text-[#E9EDEF] rounded-tl-none border border-[#E2E8F0] dark:border-[#2A3942]"
                          }`}
                      >
                        <p className="whitespace-pre-wrap font-sans text-lg">{messageText}</p>
                        <div className={`flex items-center justify-end gap-1 text-[14px] mt-1 ${isUser ? "text-[#54656F] dark:text-[#8696A0]" : "text-[#8696A0]"}`}>
                          {isUser && <span className="text-[#53BDEB] font-bold">✓✓</span>}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <MessageSquare size={36} className="text-[#8696A0] opacity-60 mb-2" />
                  <p className="text-lg font-semibold text-[#54656F] dark:text-[#8696A0]">
                    {typeof selectedCallTranscript === "string" ? selectedCallTranscript : "No voice transcript messages found."}
                  </p>
                </div>
              );
            })()}
          </div>
        </Modal>

        {/* ══ RECORDING AUDIO MODAL ══ */}
        <Modal
          isOpen={isRecordingModalOpen}
          onClose={closeRecordingModal}
          widthClass="max-w-md"
          zIndexClass="z-[999999]"
        >
          <div className="flex items-center justify-between bg-[#4F46E5] px-5 py-3 text-white">
            <h3 className="flex items-center gap-2 text-lg font-bold">
              <PlayCircle size={20} /> Call Recording Audio
            </h3>
            <button onClick={closeRecordingModal} className="hover:opacity-80 cursor-pointer text-white">
              <X size={20} />
            </button>
          </div>
          <div className="flex min-h-[160px] flex-col items-center justify-center gap-4 p-6">
            {isLoadingRecording ? (
              <div className="flex flex-col items-center gap-2">
                <HashloaderComponent isLoading={true} />
                <p className="text-lg text-[#64748B] dark:text-[#94A3B8]">Loading call recording audio...</p>
              </div>
            ) : audioUrl ? (
              <>
                <audio controls autoPlay className="w-full rounded-xl">
                  <source src={audioUrl} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>

                <a
                  href={audioUrl}
                  download={`callmatic_recording_${playingCallId}.mp3`}
                  className="flex items-center gap-1.5 text-lg text-[#4F46E5] dark:text-[#818CF8] font-bold hover:underline"
                >
                  <Download size={16} /> Download Recording
                </a>
              </>
            ) : (
              <p className="text-lg text-[#94A3B8]">No recording available for this call</p>
            )}
          </div>
        </Modal>

        {/* ══ EDIT SUBMITTED FORM DETAILS & EMAIL MODAL ══ */}
        <Modal
          isOpen={isEditFormModalOpen}
          onClose={() => setIsEditFormModalOpen(false)}
          widthClass="max-w-2xl"
          zIndexClass="z-[999999]"
        >
          <div className="flex items-center justify-between bg-header dark:bg-[#1E293B] px-6 py-4 text-white shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center font-bold text-white shadow-xs">
                <Edit3 size={20} />
              </div>
              <div>
                <h3 className="text-xl font-bold leading-tight">
                  Edit Website Inquiry & Contact Email
                </h3>
                <p className="text-lg text-[#E0E7FF] dark:text-[#94A3B8] mt-0.5">
                  Lead: <span className="font-semibold">{selectedLead?.Name || selectedLead?.Full_Name || "Customer"}</span> {selectedLead?.MobileNumber || selectedLead?.Phone_Number ? `• ${selectedLead?.MobileNumber || selectedLead?.Phone_Number}` : ""}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsEditFormModalOpen(false)}
              className="p-1.5 rounded-full hover:bg-white/10 transition-all cursor-pointer text-white"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5 bg-[#F8FAFC] dark:bg-[#090D16]">
            {/* Email Address */}
            <div className="bg-white dark:bg-[#0F172A] p-4 rounded-2xl border border-[#E2E8F0] dark:border-[#1E293B] shadow-2xs space-y-2">
              <label className="block text-lg font-bold uppercase tracking-wider text-[#4F46E5] dark:text-[#818CF8]">
                Customer Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="e.g. customer@example.com"
                  className="w-full pl-10 pr-3.5 h-10 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-xl text-base font-medium text-[#0F172A] dark:text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
                />
              </div>
            </div>

            {/* Questions & Details */}
            <div className="bg-white dark:bg-[#0F172A] p-4 rounded-2xl border border-[#E2E8F0] dark:border-[#1E293B] shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-bold uppercase tracking-wider text-[#334155] dark:text-[#CBD5E1]">
                    Inquiry Details & Attributes ({editFormFields.length})
                  </h4>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    Modify submitted inquiry parameters or add custom fields
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddEditFormField}
                  className="text-xs font-bold text-[#4F46E5] hover:text-[#4338CA] bg-[#EEF2FF] hover:bg-[#E0E7FF] dark:bg-[#312E81]/40 dark:text-[#A5B4FC] px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                >
                  <Plus size={14} /> Add Parameter
                </button>
              </div>

              {editFormFields.length === 0 ? (
                <div className="text-center py-6 text-[#94A3B8] italic text-lg">
                  No extra fields. Click &quot;Add Parameter&quot; to add details.
                </div>
              ) : (
                <div ref={editFieldsContainerRef} className="space-y-3 max-h-[320px] overflow-y-auto pr-1 scroll-smooth">
                  {editFormFields.map((field, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-[#F8FAFC] dark:bg-[#1E293B]/60 border border-[#E2E8F0] dark:border-[#334155] rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
                    >
                      <div className="flex-1">
                        <label className="block text-lg font-bold text-[#64748B] dark:text-[#94A3B8] uppercase mb-1">
                          Field Name
                        </label>
                        <input
                          type="text"
                          value={field.key}
                          onChange={(e) => handleEditFormFieldChange(idx, "key", e.target.value)}
                          placeholder="e.g. Requirement, Budget, City"
                          className="w-full h-9 px-3 bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#334155] rounded-lg text-lg font-semibold text-[#0F172A] dark:text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#4F46E5]"
                        />
                      </div>

                      <div className="flex-1">
                        <label className="block text-lg font-bold text-[#64748B] dark:text-[#94A3B8] uppercase mb-1">
                          Value
                        </label>
                        <input
                          type="text"
                          value={field.value}
                          onChange={(e) => handleEditFormFieldChange(idx, "value", e.target.value)}
                          placeholder="e.g. Sales CRM, 50k, Jaipur"
                          className="w-full h-9 px-3 bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#334155] rounded-lg text-lg font-medium text-[#0F172A] dark:text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#4F46E5]"
                        />
                      </div>

                      <div className="sm:self-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveEditFormField(idx)}
                          className="h-9 px-2.5 text-[#EF4444] hover:bg-[#FEE2E2] dark:hover:bg-[#7F1D1D]/40 rounded-lg transition-all cursor-pointer flex items-center justify-center"
                          title="Delete Field"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-[#F8FAFC] dark:bg-[#090D16] border-t border-[#E2E8F0] dark:border-[#1E293B]">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setIsEditFormModalOpen(false)}
              className="text-lg font-bold rounded-xl border-[#CBD5E1] px-4 py-2 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveLeadDetails}
              disabled={isSavingLeadDetails}
              size="lg"
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-lg font-bold rounded-xl px-5 py-2 cursor-pointer shadow-md shadow-[#4F46E5]/20 flex items-center gap-2"
            >
              {isSavingLeadDetails ? "Saving Changes..." : "Save Changes"}
            </Button>
          </div>
        </Modal>
      </>
    );
  };

  // ============================================================
  // RENDER WORKSPACE DETAIL VIEW (IF LEAD SELECTED)
  // ============================================================
  if (selectedLead) {
    const customerDisplayName = selectedLead.Name || selectedLead.Full_Name || "Website Customer";
    const initials = getInitials(customerDisplayName);
    const formattedPhone = selectedLead.MobileNumber || selectedLead.Phone_Number || "—";
    const formattedLeadId = selectedLead.Id || selectedLead.UTD ? `WL-${selectedLead.Id || selectedLead.UTD}` : "—";
    const formattedProduct = selectedLead.ProductName || selectedLead.Product_Name || "—";
    const formattedReceived = formatDateForDisplay(selectedLead.CreatedAt || selectedLead.Created_At);
    const isOtpVerified = selectedLead.OTPVerified === true || selectedLead.OTPVerified === "TRUE" || selectedLead.OTPVerified === "true" || selectedLead.OTPVerified === 1 || selectedLead.OTP_Verified === true || selectedLead.OTP_Verified === "TRUE" || selectedLead.OTP_Verified === 1;

    return (
      <div id="website-lead-detail-workspace-top" className="w-full min-h-screen bg-[#F8FAFC] dark:bg-[#090D16] p-4 sm:p-6 flex flex-col gap-6 font-sans text-[#334155] dark:text-[#F1F5F9]">
        {/* Top Header Navigation */}
        <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0] dark:border-[#1E293B]">
          <button
            onClick={() => {
              if (fromParam === "followup") {
                router.push("/autovyn/admin/HRMS/Meta_Lead/followup_lead");
              } else {
                setSelectedLead(null);
              }
            }}
            className="inline-flex items-center gap-2 text-lg font-bold text-[#818CF8] hover:text-[#4338CA] bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] px-3.5 py-2 rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <ArrowLeft size={16} />
            {fromParam === "followup" ? "Back to Follow-ups" : "Back to Website Leads"}
          </button>
        </div>

        {/* ══ 3-COLUMN CRM WORKSPACE GRID ══ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ── LEFT COLUMN (4 COLS) ── */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Card 1A: Customer Profile Summary */}
            <div className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] dark:bg-[#1E1B4B] text-[#818CF8] dark:text-[#818CF8] font-bold text-lg flex items-center justify-center shadow-inner">
                    {initials}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0F172A] dark:text-white text-lg leading-tight">
                      {customerDisplayName}
                    </h3>
                    <p className="text-lg font-bold uppercase tracking-wider text-[#94A3B8] mt-0.5">
                      {selectedLead.CompanyName || selectedLead.Company_Name || "DIRECT WEBSITE INQUIRY"}
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1 text-lg font-bold px-2.5 py-0.5 rounded-full shadow-2xs border ${
                    leadTemperature === "Hot"
                      ? "bg-[#FFE4E6] text-[#E11D48] border-[#FECDD3] dark:bg-[#E11D48]/20 dark:text-[#FDA4AF] dark:border-[#E11D48]/40"
                      : leadTemperature === "Warm"
                      ? "bg-[#FEF3C7] text-[#D97706] border-[#FDE68A] dark:bg-[#D97706]/20 dark:text-[#FDE68A] dark:border-[#D97706]/40"
                      : "bg-[#E0F2FE] text-[#0284C7] border-[#BAE6FD] dark:bg-[#0284C7]/20 dark:text-[#BAE6FD] dark:border-[#0284C7]/40"
                  }`}
                >
                  <Flame size={13} fill="currentColor" />
                  {leadTemperature}
                </span>
              </div>

              {/* Action Buttons (WhatsApp & Call) */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  onClick={() => handleWhatsAppAction(formattedPhone, selectedLead.Id || selectedLead.UTD)}
                  className="flex items-center justify-center gap-1.5 bg-[#DCFCE7] hover:bg-[#BBF7D0] text-[#15803D] dark:bg-[#14532D]/40 dark:text-[#4ADE80] border border-[#86EFAC] dark:border-[#166534] py-2 px-3 rounded-xl text-lg font-bold transition-all shadow-2xs cursor-pointer"
                >
                  <MessageSquare size={15} />
                  WhatsApp
                </button>

                <Button
                  onClick={() => {
                    window.open(`tel:${formattedPhone}`);
                    setCallModalOpen(true);
                  }}
                  variant="outline"
                  size="lg"
                  className="flex items-center justify-center gap-1.5 bg-white dark:bg-[#1E293B] hover:bg-[#F8FAFC] dark:hover:bg-[#334155] text-[#334155] dark:text-[#E2E8F0] border border-[#E2E8F0] dark:border-[#334155] py-2 px-3 rounded-xl text-lg font-bold transition-all shadow-2xs cursor-pointer"
                >
                  Call & Log
                </Button>
              </div>

              {/* AI Call & AI History Buttons */}
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button
                  disabled={triggeringAiCall}
                  size="lg"
                  onClick={() => handleTriggerAiCall(selectedLead.Id || selectedLead.UTD)}
                  className="w-full flex items-center justify-center gap-1.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold py-2 px-3 rounded-xl text-lg transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  {triggeringAiCall ? "Triggering..." : "AI Call"}
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleOpenCallHistory(selectedLead)}
                  className="w-full flex items-center justify-center gap-1.5 bg-white dark:bg-[#1E293B] hover:bg-[#F8FAFC] dark:hover:bg-[#334155] text-[#334155] dark:text-[#E2E8F0] border border-[#E2E8F0] dark:border-[#334155] py-2 px-3 rounded-xl text-lg font-bold transition-all shadow-2xs cursor-pointer"
                >
                  AI History
                </Button>
              </div>

              {/* Customer Details Table */}
              <div className="pt-2 border-t border-[#F1F5F9] dark:border-[#1E293B] space-y-2.5 text-lg">
                <div className="flex justify-between items-center">
                  <span className="text-[#64748B] font-bold">Mobile</span>
                  <span className="font-bold text-[#0F172A] dark:text-white">{formattedPhone}</span>
                </div>

                <div className="flex flex-col gap-1.5 pb-0.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[#64748B] font-bold">Email</span>
                    {!isEditingInlineEmail && (
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#0F172A] dark:text-white truncate max-w-[180px]" title={selectedLead.Email || "No Email"}>
                          {selectedLead.Email || <span className="text-[#94A3B8] font-normal italic text-sm">Not Added</span>}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setInlineEmailInput(selectedLead.Email || "");
                            setIsEditingInlineEmail(true);
                          }}
                          className="text-lg font-bold text-[#4F46E5] dark:text-[#818CF8] hover:underline flex items-center gap-1 cursor-pointer bg-[#EEF2FF] dark:bg-[#312E81]/40 px-2 py-0.5 rounded-md transition-all shadow-2xs"
                        >
                          <Edit3 size={11} /> {selectedLead.Email ? "Edit" : "Add Email"}
                        </button>
                      </div>
                    )}
                  </div>
                  {isEditingInlineEmail && (
                    <div className="flex items-center gap-1.5 pt-1">
                      <div className="relative flex-1">
                        <Mail size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                        <input
                          type="email"
                          value={inlineEmailInput}
                          onChange={(e) => setInlineEmailInput(e.target.value)}
                          placeholder="customer@example.com"
                          className="w-full pl-7 pr-2 h-7 text-xs bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-lg text-[#0F172A] dark:text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#4F46E5] font-medium"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveInlineEmail();
                            if (e.key === "Escape") setIsEditingInlineEmail(false);
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        disabled={isSavingInlineEmail}
                        onClick={handleSaveInlineEmail}
                        className="h-7 px-2.5 text-xs font-bold text-white bg-[#4F46E5] hover:bg-[#4338CA] rounded-lg cursor-pointer transition-all disabled:opacity-50 flex items-center gap-1 shadow-2xs"
                      >
                        {isSavingInlineEmail ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingInlineEmail(false)}
                        className="h-7 px-2 text-xs font-bold text-[#64748B] hover:text-[#334155] rounded-lg cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#64748B] font-bold">Product Requested</span>
                  <span className="font-bold text-[#4F46E5] dark:text-[#818CF8] text-lg">{formattedProduct}</span>
                </div>

                {selectedLead.Message && (
                  <div className="p-3 bg-[#F8FAFC] dark:bg-[#1E293B]/60 rounded-xl border border-[#E2E8F0] dark:border-[#334155] space-y-1">
                    <span className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider block">
                      Customer Inquiry / Message
                    </span>
                    <p className="text-base text-[#0F172A] dark:text-white font-medium whitespace-pre-wrap">
                      {selectedLead.Message}
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-[#64748B] font-bold">OTP Verification</span>
                  {isOtpVerified ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm font-bold bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC]">
                      <ShieldCheck size={14} /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm font-bold bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]">
                      <ShieldAlert size={14} /> Pending / Unverified
                    </span>
                  )}
                </div>

                {isOtpVerified && selectedLead.OTPVerifiedAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-[#64748B] font-bold">OTP Verified At</span>
                    <span className="font-medium text-[#475569] dark:text-[#CBD5E1] text-base">
                      {formatDateForDisplay(selectedLead.OTPVerifiedAt)}
                    </span>
                  </div>
                )}

                

                <div className="flex justify-between items-center">
                  <span className="text-[#64748B] font-bold">Lead ID</span>
                  <span className="font-mono font-bold text-[#818CF8] text-lg">{formattedLeadId}</span>
                </div>

                <div className="flex justify-between items-center pt-1 border-t border-[#F1F5F9] dark:border-[#1E293B]">
                  <span className="text-[#64748B] font-bold">Received At</span>
                  <span className="font-medium text-[#475569] dark:text-[#CBD5E1] text-lg">{formattedReceived}</span>
                </div>
              </div>
            </div>

            {/* Card 1B: Pipeline Stage Progress */}
            <div className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-2xl p-5 shadow-xs space-y-3">
              <h4 className="text-lg font-bold uppercase tracking-wider text-[#94A3B8] pb-2 border-b border-[#F1F5F9] dark:border-[#1E293B]">
                Pipeline Stage
              </h4>

              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E2E8F0] dark:before:bg-[#1E293B]">
                {STAGES.map((stg) => {
                  const isActive = activeStage === stg;
                  return (
                    <div
                      key={stg}
                      onClick={() => handleUpdateStage(stg)}
                      className="relative flex items-center gap-3 cursor-pointer group"
                    >
                      <div
                        className={`absolute -left-6 w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center ${isActive
                          ? "bg-[#4F46E5] border-[#4F46E5] shadow-xs"
                          : "bg-white dark:bg-[#0F172A] border-[#CBD5E1] dark:border-[#334155] group-hover:border-[#4F46E5]"
                          }`}
                      >
                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>

                      <span
                        className={`text-lg font-bold transition-colors ${isActive
                          ? "text-[#0F172A] dark:text-white"
                          : "text-[#64748B] dark:text-[#94A3B8] group-hover:text-[#334155]"
                          }`}
                      >
                        {stg}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── MIDDLE COLUMN (5 COLS): ACTIVITY TIMELINE ── */}
          <div className="lg:col-span-5 bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-2xl p-5 shadow-xs flex flex-col gap-4 min-h-[560px]">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] dark:border-[#1E293B] pb-3">
              <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">
                Activity Timeline ({activities.length})
              </h3>
              <Button
                onClick={() => fetchLeadActivities(selectedLead.Id || selectedLead.UTD)}
                size="lg"
                variant="outline"
                className="flex items-center gap-4 justify-between"
              >
                Reload
              </Button>
            </div>

            {/* Add Remark Box */}
            <div className="bg-[#F8FAFC] dark:bg-[#1E293B]/60 border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-2.5 flex items-center gap-2">
              <input
                type="text"
                value={newRemarkText}
                onChange={(e) => setNewRemarkText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddRemark()}
                placeholder="What was discussed with website lead?"
                disabled={isSubmittingActivity}
                className="flex-1 bg-transparent text-lg font-medium text-[#1E293B] dark:text-[#F1F5F9] placeholder:text-[#94A3B8] focus:outline-none px-1"
              />
              <button
                onClick={handleAddRemark}
                disabled={isSubmittingActivity || !newRemarkText.trim()}
                className="px-4 py-1.5 bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-50 text-white rounded-xl text-lg font-bold transition-all shadow-xs shrink-0 cursor-pointer"
              >
                Add
              </button>
            </div>

            {/* Timeline Feed List */}
            <div className="space-y-4 mt-2 flex-1 overflow-y-auto max-h-[480px]">
              {activities.length === 0 ? (
                <div className="text-center py-10 text-[#94A3B8] space-y-2">
                  <MessageSquare size={28} className="mx-auto text-[#CBD5E1]" />
                  <p className="font-bold text-lg">No activities recorded yet.</p>
                  <p className="text-lg">Add a remark or log a call to start tracking timeline.</p>
                </div>
              ) : (
                activities.map((item) => {
                  const type = String(item.Activity_Type || "REMARK").toUpperCase();
                  return (
                    <div key={item.UTD} className="flex items-start gap-3 relative pl-2 group">
                      <div className="w-8 h-8 rounded-xl bg-[#EEF2FF] dark:bg-[#1E1B4B] text-[#818CF8] dark:text-[#818CF8] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs border border-[#C7D2FE]/60 dark:border-[#3730A3]/60">
                        {type === "CALL" || type === "AI_CALL" || type === "AI_CALL_SUMMARY" ? (
                          <Phone size={15} />
                        ) : type === "WHATSAPP" ? (
                          <MessageSquare size={15} />
                        ) : type === "TEMPERATURE_CHANGE" ? (
                          <Flame size={15} />
                        ) : type === "STATUS_CHANGE" ? (
                          <RefreshCw size={15} />
                        ) : type === "FOLLOWUP_CREATED" ? (
                          <Calendar size={15} />
                        ) : type === "FOLLOWUP_COMPLETED" ? (
                          <CheckCircle2 size={15} />
                        ) : type === "FOLLOWUP_RESCHEDULED" ? (
                          <Clock size={15} />
                        ) : (
                          <FileText size={15} />
                        )}
                      </div>

                      <div className="flex-1 bg-[#F8FAFC]/80 dark:bg-[#1E293B]/40 p-3 rounded-xl border border-[#F1F5F9] dark:border-[#334155]/60 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold uppercase tracking-wider text-[#818CF8]">
                            {type.replace(/_/g, " ")}
                          </span>
                          <span className="text-lg text-[#94A3B8]">
                            {item.Created_Name || item.Created_By || "SYSTEM"}
                          </span>
                        </div>

                        {item.Old_Value && item.New_Value && (
                          <p className="text-lg text-[#0F172A] dark:text-white">
                            {item.Old_Value} → {item.New_Value}
                          </p>
                        )}

                        {item.Call_Result && (
                          <span className="inline-block px-2 py-0.5 bg-[#EEF2FF] text-[#818CF8] rounded text-lg font-bold border border-[#C7D2FE]">
                            Result: {item.Call_Result}
                          </span>
                        )}

                        <p className="text-lg text-[#1E293B] dark:text-[#F1F5F9] leading-relaxed">
                          {item.Remark || "No detailed remark."}
                        </p>

                        <p className="text-lg text-[#94A3B8] pt-0.5">
                          {formatDateForDisplay(item.Activity_Date)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── RIGHT COLUMN (3 COLS): QUICK ACTIONS & TEMPERATURE ── */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            {/* Card 3A: QUICK ACTIONS */}
            <div className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-2xl p-5 shadow-xs space-y-4">
              <h4 className="text-lg font-bold uppercase tracking-wider text-[#94A3B8]">
                Quick Actions
              </h4>

              {/* Set Followup */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Ainput
                    type="date"
                    name="followupDate"
                    title="Followup Date"
                    value={followupDate}
                    handleInputChange={(_, value) => setFollowupDate(value)}
                    onInput={() => { }}
                    redlabel=""
                    labelClass="text-lg font-bold"
                    className="!h-10 !text-lg"
                  />

                  <Ainput
                    type="time"
                    name="followupTime"
                    title="Followup Time"
                    value={followupTime}
                    handleInputChange={(_, value) => setFollowupTime(value)}
                    onInput={() => { }}
                    redlabel=""
                    labelClass="text-lg font-bold"
                    className="!h-10 !text-lg"
                  />
                </div>

                <Ainput
                  type="text"
                  name="followupPurpose"
                  title="Purpose / Note"
                  placeholder="Purpose / Note (e.g. Website product demo)"
                  value={followupPurpose}
                  handleInputChange={(_, value) => setFollowupPurpose(value)}
                  onInput={() => { }}
                  redlabel=""
                  labelClass="text-lg font-bold"
                  className="!h-10 !text-lg"
                />

                <button
                  onClick={handleScheduleFollowup}
                  disabled={isSubmittingActivity || !followupDate}
                  className="w-full mt-1 bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-50 text-white py-2 px-3 rounded-xl text-lg font-bold transition-all shadow-xs cursor-pointer"
                >
                  Schedule Follow-up ➔
                </button>
              </div>

              {/* WhatsApp Reminder Toggle */}
              <div className="bg-[#DCFCE7]/70 dark:bg-[#14532D]/30 border border-[#86EFAC] dark:border-[#166534] rounded-xl p-3 flex items-center justify-between gap-2">
                <span className="text-lg font-bold text-[#15803D] dark:text-[#4ADE80] flex items-center gap-1.5">
                  WhatsApp reminder on this date
                </span>
                <button
                  type="button"
                  onClick={() => setWhatsappReminder(!whatsappReminder)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out shrink-0 ${whatsappReminder ? "bg-[#16A34A]" : "bg-[#CBD5E1] dark:bg-[#334155]"
                    }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${whatsappReminder ? "translate-x-5" : "translate-x-0"
                      }`}
                  />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => handleQuickAction("Schedule Demo")}
                  className="w-full flex items-center justify-center gap-2 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] hover:bg-[#F8FAFC] py-2 px-3 rounded-xl text-lg font-bold text-[#334155] dark:text-[#E2E8F0] transition-all shadow-2xs cursor-pointer"
                >
                  <Monitor size={15} />
                  Schedule Demo
                </button>

                <button
                  onClick={() => handleQuickAction("Send Quotation")}
                  className="w-full flex items-center justify-center gap-2 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] hover:bg-[#F8FAFC] py-2 px-3 rounded-xl text-lg font-bold text-[#334155] dark:text-[#E2E8F0] transition-all shadow-2xs cursor-pointer"
                >
                  <FileText size={15} />
                  Send Quotation
                </button>
              </div>

              {/* Change Status */}
              <div className="pt-2 border-t border-[#F1F5F9] dark:border-[#1E293B] space-y-2">
                <label className="block text-lg font-bold text-[#334155] dark:text-[#CBD5E1]">
                  Change Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleUpdateStage("Won")}
                    className="py-2 bg-[#DCFCE7] hover:bg-[#BBF7D0] text-[#15803D] border border-[#86EFAC] rounded-xl text-lg font-bold transition-all cursor-pointer text-center"
                  >
                    Won 🎉
                  </button>

                  <button
                    onClick={() => handleUpdateStage("Lost")}
                    className="py-2 bg-[#FFE4E6] hover:bg-[#FECDD3] text-[#E11D48] border border-[#FDA4AF] rounded-xl text-lg font-bold transition-all cursor-pointer text-center"
                  >
                    Lost ❌
                  </button>
                </div>
              </div>
            </div>

            {/* Card 3B: LEAD TEMPERATURE */}
            <div className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold uppercase tracking-wider text-[#94A3B8]">
                  Lead Temperature
                </span>
                <span
                  className={`text-lg font-bold ${
                    leadTemperature === "Hot"
                      ? "text-[#E11D48]"
                      : leadTemperature === "Warm"
                      ? "text-[#D97706]"
                      : "text-[#0284C7]"
                  }`}
                >
                  {leadTemperature}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <button
                  onClick={() => handleUpdateTemperature("Cold")}
                  disabled={isSubmittingActivity}
                  title="Mark as Cold"
                  className={`h-2 rounded-full transition-all cursor-pointer disabled:opacity-50 ${
                    leadTemperature === "Cold" ? "bg-[#0284C7] ring-2 ring-[#0284C7]/30" : "bg-[#0284C7]/30"
                  }`}
                />
                <button
                  onClick={() => handleUpdateTemperature("Warm")}
                  disabled={isSubmittingActivity}
                  title="Mark as Warm"
                  className={`h-2 rounded-full transition-all cursor-pointer disabled:opacity-50 ${
                    leadTemperature === "Warm" ? "bg-[#D97706] ring-2 ring-[#D97706]/30" : "bg-[#D97706]/30"
                  }`}
                />
                <button
                  onClick={() => handleUpdateTemperature("Hot")}
                  disabled={isSubmittingActivity}
                  title="Mark as Hot"
                  className={`h-2 rounded-full transition-all cursor-pointer disabled:opacity-50 ${
                    leadTemperature === "Hot" ? "bg-[#E11D48] ring-2 ring-[#E11D48]/30" : "bg-[#E11D48]/30"
                  }`}
                />
              </div>

              <div className="flex justify-between text-lg font-bold text-[#94A3B8] pt-0.5">
                <span>Cold</span>
                <span>Warm</span>
                <span>Hot</span>
              </div>
            </div>
          </div>
        </div>

        {/* ══ CALL LOG RESULT MODAL ══ */}
        {callModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-3xl p-6 shadow-2xl w-full max-w-md space-y-4">
              <div className="flex items-center justify-between border-b border-[#F1F5F9] dark:border-[#1E293B] pb-3">
                <h3 className="text-xl text-[#0F172A] dark:text-white font-bold flex items-center gap-2">
                  <PhoneCall size={20} className="text-[#818CF8]" />
                  Log Call Outcome
                </h3>
                <button
                  onClick={() => setCallModalOpen(false)}
                  className="text-[#94A3B8] hover:text-[#475569] cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div>
                <label className="block text-lg text-[#334155] dark:text-[#CBD5E1] mb-1">
                  Call Outcome / Result
                </label>
                <select
                  value={callResult}
                  onChange={(e) => setCallResult(e.target.value)}
                  className="w-full h-10 px-3 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl text-lg text-[#1E293B] dark:text-[#F1F5F9] focus:outline-none"
                >
                  <option value="CONNECTED">CONNECTED (Call Connected)</option>
                  <option value="NO_ANSWER">NO_ANSWER (No Answer)</option>
                  <option value="BUSY">BUSY (Line Busy)</option>
                  <option value="SWITCHED_OFF">SWITCHED_OFF (Phone Off)</option>
                  <option value="INVALID_NUMBER">INVALID_NUMBER (Wrong / Invalid)</option>
                  <option value="CALLBACK_REQUESTED">CALLBACK_REQUESTED (Customer Asked Callback)</option>
                  <option value="INTERESTED">INTERESTED (High Interest)</option>
                  <option value="NOT_INTERESTED">NOT_INTERESTED (Not Interested)</option>
                </select>
              </div>

              <div>
                <label className="block text-lg text-[#334155] dark:text-[#CBD5E1] mb-1">
                  Call Notes / Remark
                </label>
                <textarea
                  rows={3}
                  value={callRemark}
                  onChange={(e) => setCallRemark(e.target.value)}
                  placeholder="Enter details of conversation..."
                  className="w-full p-3 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl text-lg font-medium text-[#1E293B] dark:text-[#F1F5F9] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setCallModalOpen(false)}
                  className="text-lg font-bold rounded-xl border-[#E2E8F0] px-4 py-2 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveCallResult}
                  size="lg"
                  disabled={isSubmittingActivity}
                  className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-lg font-bold rounded-xl px-5 py-2 cursor-pointer"
                >
                  Save Call Log ➔
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ══ SCHEDULE DEMO MODAL ══ */}
        {scheduleDemoModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-3xl p-6 shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto space-y-4">
              <div className="flex items-center justify-between border-b border-[#F1F5F9] dark:border-[#1E293B] pb-3">
                <h3 className="text-xl text-[#0F172A] dark:text-white font-bold flex items-center gap-2">
                  <Monitor size={20} className="text-[#818CF8]" />
                  Schedule Product Demo
                </h3>
                <button
                  onClick={() => setScheduleDemoModalOpen(false)}
                  className="text-[#94A3B8] hover:text-[#475569] cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="bg-[#F8FAFC] dark:bg-[#1E293B]/60 p-3.5 rounded-2xl border border-[#E2E8F0] dark:border-[#334155] space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-base font-bold text-[#64748B] dark:text-[#94A3B8]">
                    Scheduling demo for <span className="font-semibold text-[#0F172A] dark:text-white">{customerDisplayName}</span>
                  </p>
                  {!isEditingDemoModalEmail && selectedLead?.Email && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg text-[#4F46E5] dark:text-[#818CF8] bg-white dark:bg-[#0F172A] px-3 py-1 rounded-xl border border-[#CBD5E1] dark:border-[#334155] flex items-center gap-1.5 shadow-2xs">
                        <Mail size={14} /> {selectedLead.Email}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setDemoModalEmailInput(selectedLead.Email || "");
                          setIsEditingDemoModalEmail(true);
                        }}
                        className="text-lg font-bold text-[#4F46E5] dark:text-[#818CF8] hover:underline flex items-center gap-1 cursor-pointer bg-[#EEF2FF] dark:bg-[#312E81]/40 px-2 py-1 rounded-lg transition-all"
                      >
                        <Edit3 size={12} /> Edit Email
                      </button>
                    </div>
                  )}
                  {!isEditingDemoModalEmail && !selectedLead?.Email && (
                    <button
                      type="button"
                      onClick={() => {
                        setDemoModalEmailInput("");
                        setIsEditingDemoModalEmail(true);
                      }}
                      className="text-xs font-bold text-white bg-[#4F46E5] hover:bg-[#4338CA] px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                    >
                      <Plus size={14} /> Add Customer Email
                    </button>
                  )}
                </div>

                {isEditingDemoModalEmail && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <div className="relative flex-1">
                      <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                      <input
                        type="email"
                        value={demoModalEmailInput}
                        onChange={(e) => setDemoModalEmailInput(e.target.value)}
                        placeholder="Enter customer email address (e.g. name@example.com)"
                        className="w-full pl-9 pr-3 h-9 text-sm bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#334155] rounded-xl text-[#0F172A] dark:text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30 font-medium"
                      />
                    </div>
                   <div className="flex gap-2">
                     <Button
                      type="button"
                      disabled={isSavingDemoModalEmail}
                      onClick={handleSaveDemoModalEmail}
                    //   size="sm"
                      className="h-9 px-4 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold rounded-xl cursor-pointer"
                    >
                      {isSavingDemoModalEmail ? "Saving..." : "Save Email"}
                    </Button>
                    {selectedLead?.Email && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setDemoModalEmailInput(selectedLead.Email || "");
                          setIsEditingDemoModalEmail(false);
                        }}
                        className="text-xs font-bold text-[#64748B] hover:text-[#334155] px-2 py-1 cursor-pointer"
                      >
                        Cancel
                      </Button>
                    )}
                   </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Ainput
                  type="date"
                  name="demoDate"
                  title="Demo Date"
                  value={demoDate}
                  handleInputChange={(_, value) => setDemoDate(value)}
                  onInput={() => { }}
                  redlabel=""
                  labelClass="text-lg font-bold"
                  className="!h-10 !text-lg"
                />

                <Ainput
                  type="time"
                  name="demoTime"
                  title="Demo Time"
                  value={demoTime}
                  handleInputChange={(_, value) => setDemoTime(value)}
                  onInput={() => { }}
                  redlabel=""
                  labelClass="text-lg font-bold"
                  className="!h-10 !text-lg"
                />
              </div>

              <div>
                <label className="block text-lg font-medium text-[#334155] dark:text-[#CBD5E1] mb-1">
                  Demo Mode / Platform
                </label>
                <select
                  value={demoType}
                  onChange={(e) => setDemoType(e.target.value)}
                  className="w-full h-10 px-3 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-xl text-lg font-medium text-[#1E293B] dark:text-[#F1F5F9] focus:outline-none cursor-pointer"
                >
                  <option value="MICROSOFT_TEAMS">Microsoft Teams (Auto-generate Teams Meeting & Invite)</option>
                  <option value="ONLINE">ONLINE (Google Meet / Zoom / Screen Share)</option>
                  <option value="IN_PERSON">IN_PERSON (Company Office Visit)</option>
                  <option value="CLIENT_LOCATION">CLIENT_LOCATION (Client Site Visit)</option>
                </select>
              </div>

              {/* CC Recipients */}
              <div className="bg-[#F8FAFC] dark:bg-[#1E293B]/60 p-4 rounded-2xl border border-[#E2E8F0] dark:border-[#334155] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-base font-bold text-[#334155] dark:text-[#CBD5E1]">
                      👥 Team CC Recipients ({demoCcEmails.length})
                    </label>
                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                      Invited to Microsoft Teams meeting & receives notifications
                    </p>
                  </div>
                  {!showAddCcInput && (
                    <Button
                      type="button"
                      onClick={() => setShowAddCcInput(true)}
                      size="lg"
                      variant="outline"
                      className="text-lg font-bold text-[#4F46E5] hover:text-[#4338CA] bg-[#EEF2FF] hover:bg-[#E0E7FF] dark:bg-[#312E81]/40 dark:text-[#A5B4FC] border-[#C7D2FE] dark:border-[#4338CA] px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                    >
                      Add CC
                    </Button>
                  )}
                </div>

                {demoCcEmails.length > 0 ? (
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                    {demoCcEmails.map((email) => (
                      <span
                        key={email}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#475569] rounded-xl text-sm font-medium text-[#1E293B] dark:text-[#F1F5F9] shadow-2xs group"
                      >
                        <Mail size={13} className="text-[#4F46E5] dark:text-[#818CF8]" />
                        <span>{email}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCcEmail(email)}
                          className="ml-1 p-0.5 text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#FEE2E2] dark:hover:bg-[#7F1D1D]/40 rounded-full transition-all cursor-pointer"
                          title="Remove from CC"
                        >
                          <X size={13} />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#94A3B8] italic py-1">
                    No CC emails added yet. Click &quot;Add CC&quot; to add internal recipients.
                  </p>
                )}

                {showAddCcInput && (
                  <div className="p-3 bg-white dark:bg-[#0F172A] border border-[#C7D2FE] dark:border-[#4338CA] rounded-2xl space-y-2 animate-in fade-in duration-200 shadow-2xs">
                    <label className="block text-xs font-bold text-[#4F46E5] dark:text-[#818CF8] uppercase tracking-wider">
                      Enter New CC Email Address
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="relative flex-1">
                        <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                        <input
                          type="email"
                          autoFocus
                          value={newCcEmailInput}
                          onChange={(e) => setNewCcEmailInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddCcEmail();
                            } else if (e.key === "Escape") {
                              setShowAddCcInput(false);
                              setNewCcEmailInput("");
                            }
                          }}
                          placeholder="e.g. manager@autovyn.com"
                          className="w-full pl-9 pr-3 h-10 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-xl text-sm font-medium text-[#0F172A] dark:text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
                        />
                      </div>
                      <div className="flex gap-2 justify-between">
                        <Button
                          type="button"
                          onClick={handleAddCcEmail}
                          size="lg"
                          className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
                        >
                          Add
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowAddCcInput(false);
                            setNewCcEmailInput("");
                          }}
                          size="lg"
                          className="text-sm border-[#CBD5E1] dark:border-[#334155] cursor-pointer"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-lg font-bold text-[#334155] dark:text-[#CBD5E1] mb-1">
                  Demo Agenda / Remark
                </label>
                <textarea
                  rows={2}
                  value={demoRemark}
                  onChange={(e) => setDemoRemark(e.target.value)}
                  placeholder="Enter demo agenda, product requirements, or special notes..."
                  className="w-full p-3 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl text-lg font-medium text-[#1E293B] dark:text-[#F1F5F9] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setScheduleDemoModalOpen(false)}
                  className="text-lg font-bold rounded-xl border-[#E2E8F0] px-4 py-2 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmScheduleDemo}
                  disabled={isSubmittingActivity}
                  size="lg"
                  className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-lg font-bold rounded-xl px-5 py-2 cursor-pointer"
                >
                  Schedule Demo & Update Stage ➔
                </Button>
              </div>
            </div>
          </div>
        )}

        {renderCallModals()}
      </div>
    );
  }

  // ============================================================
  // RENDER MAIN PIPELINE TABLE & STATS LIST
  // ============================================================
  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] dark:bg-[#090D16] p-4 sm:p-6 flex flex-col gap-6 font-sans text-[#334155] dark:text-[#F1F5F9]">
      {/* ══ TOP PIPELINE HEADER ══ */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] dark:text-white tracking-tight flex items-center gap-2.5">
            <Globe className="text-[#4F46E5]" size={30} />
            Website Leads Pipeline
          </h1>
          <p className="text-lg font-medium text-[#64748B] dark:text-[#94A3B8] mt-0.5">
            {pagination.totalRecords} website inquiries & direct leads across {STAGES.length} stages
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="lg"
            variant="save"
            onClick={() => {
              setNewLeadForm({
                dealerName: "",
                phoneNumber: "",
                designation: "",
                companyName: "",
                noOfEmployees: "",
                customNoOfEmployees: "",
                module: "HR Setu",
                customModule: "",
                campaignId: campaignsList[0]?.Campaign_Id || campaignsList[0]?.Meta_Form_Id || "",
                email: "",
                city: "",
                customQuestions: [],
              });
              setAddLeadModalOpen(true);
            }}
          >
            <span>+ Add Manual Lead</span>
          </Button>
        </div>
      </div>

      {/* ══ METRIC SUMMARY CARDS GRID (4 CARDS) ══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: TOTAL WEBSITE LEADS */}
        <div
          onClick={handleFilterTotalLeads}
          className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between relative overflow-hidden cursor-pointer hover:border-[#0284C7]/50 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold uppercase tracking-wider text-[#94A3B8] group-hover:text-[#0284C7] transition-colors">
              Total Website Leads
            </span>
            <div className="w-9 h-9 rounded-full bg-[#F0F9FF] dark:bg-[#082F49]/70 text-[#0284C7] dark:text-[#38BDF8] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-bold text-[#0F172A] dark:text-white tracking-tight">
              {stats.totalLeads || pagination.totalRecords || rows.length}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1 text-lg font-bold text-[#059669] dark:text-[#34D399]">
            <ArrowUpRight size={15} />
            <span>+{stats.leadsThisWeek} this week ({stats.leadsToday} today)</span>
          </div>
        </div>

        {/* Card 2: OTP VERIFIED LEADS */}
        <div
          onClick={handleFilterOtpVerified}
          className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between relative overflow-hidden cursor-pointer hover:border-[#10B981]/50 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold uppercase tracking-wider text-[#94A3B8] group-hover:text-[#10B981] transition-colors">
              OTP Verified Inquiries
            </span>
            <div className="w-9 h-9 rounded-full bg-[#ECFDF5] dark:bg-[#064E3B]/70 text-[#10B981] dark:text-[#34D399] flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-[#0F172A] dark:text-white tracking-tight">
              {stats.totalOtpVerified}
            </span>
            <span className="text-lg font-bold text-[#059669] dark:text-[#34D399] bg-[#ECFDF5] dark:bg-[#064E3B]/70 px-2.5 py-0.5 rounded-full">
              {stats.totalLeads > 0 ? `${((stats.totalOtpVerified / stats.totalLeads) * 100).toFixed(0)}%` : "0%"} verified ➔
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1 text-lg font-bold text-[#059669] dark:text-[#34D399]">
            <ShieldCheck size={15} />
            <span>{stats.otpVerifiedToday} verified today</span>
          </div>
        </div>

        {/* Card 3: TODAY'S FOLLOWUPS */}
        <div
          onClick={() => router.push("/autovyn/admin/HRMS/Meta_Lead/followup_lead")}
          className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between relative overflow-hidden cursor-pointer hover:border-[#D97706]/50 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold uppercase tracking-wider text-[#94A3B8] group-hover:text-[#D97706] transition-colors">
              Today's Followups
            </span>
            <div className="w-9 h-9 rounded-full bg-[#FFFBEB] dark:bg-[#451A03]/70 text-[#D97706] dark:text-[#FBBF24] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-bold text-[#0F172A] dark:text-white tracking-tight">
              {stats.todayFollowups}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-lg font-bold text-[#E11D48] dark:text-[#FB7185]">
            <AlertCircle size={15} />
            <span>{stats.overdueFollowups} overdue · {stats.upcomingFollowups} upcoming</span>
          </div>
        </div>

        {/* Card 4: DEMOS & CONVERSION */}
        <div
          onClick={() => router.push("/autovyn/admin/HRMS/Meta_Lead/followup_lead")}
          className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between relative overflow-hidden cursor-pointer hover:border-[#9333EA]/50 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold uppercase tracking-wider text-[#94A3B8] group-hover:text-[#9333EA] transition-colors">
              Demos & Conversion
            </span>
            <div className="w-9 h-9 rounded-full bg-[#FAF5FF] dark:bg-[#3B0764]/70 text-[#9333EA] dark:text-[#C084FC] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Tv size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-[#0F172A] dark:text-white tracking-tight">
              {stats.demosThisWeek}
            </span>
            <span className="text-lg font-bold text-[#7C3AED] dark:text-[#C084FC] bg-[#FAF5FF] dark:bg-[#3B0764]/70 px-2 py-0.5 rounded-full">
              {stats.conversionRate} conv
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1 text-lg font-bold text-[#059669] dark:text-[#34D399]">
            <TrendingUp size={15} />
            <span>{stats.demosCompletedThisWeek} completed · {stats.totalDemos} total</span>
          </div>
        </div>
      </div>

      {/* ══ ADVANCED FILTER PANEL ══ */}
      <div className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 dark:border-[#1E293B]">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-[#4F46E5]" />
            <h3 className="text-lg font-bold uppercase tracking-wider text-[#334155] dark:text-[#CBD5E1]">
              FILTER PARAMETERS
            </h3>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilter}
              disabled={isLoading}
              className="text-lg font-bold h-9 px-3 cursor-pointer text-[#E11D48] hover:text-[#BE123C] hover:bg-[#FFF1F2] dark:hover:bg-[#4C0519]/40 border-[#FECDD3] dark:border-[#881337]"
            >
              Reset All Filters
            </Button>
          </div>
        </div>

        {/* 6-Column Responsive Filter Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
          {/* 1. Search Bar */}
          <div>
            <label className="block text-lg font-bold text-[#334155] dark:text-[#CBD5E1] mb-1">
              Search Leads
            </label>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Name, Mobile, Company..."
                className="w-full pl-9 pr-3 h-9 bg-[#F8FAFC] dark:bg-[#1E293B]/80 border border-[#E2E8F0] dark:border-[#334155] rounded-xl text-lg font-medium text-[#1E293B] dark:text-[#F1F5F9] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
              />
            </div>
          </div>

          {/* 2. Product Name Filter */}
          <div>
            <label className="block text-lg font-bold text-[#334155] dark:text-[#CBD5E1] mb-1">
              Product Interested
            </label>
            <input
              type="text"
              value={filterProductName}
              onChange={(e) => handleFilterChange("filterProductName", e.target.value)}
              placeholder="e.g. Payroll, GatePass, CRM"
              className="w-full px-3 h-9 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl text-lg font-medium text-[#1E293B] dark:text-[#F1F5F9] focus:outline-none"
            />
          </div>

          {/* 3. OTP Verification Filter */}
          <div>
            <label className="block text-lg font-bold text-[#334155] dark:text-[#CBD5E1] mb-1">
              OTP Status
            </label>
            <select
              value={filterOtpVerified}
              onChange={(e) => handleFilterChange("filterOtpVerified", e.target.value)}
              className="w-full h-9 px-3 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl text-lg font-medium text-[#1E293B] dark:text-[#F1F5F9] focus:outline-none cursor-pointer"
            >
              <option value="">All Verification Status</option>
              <option value="true">✅ OTP Verified</option>
              <option value="false">⏳ OTP Unverified / Pending</option>
            </select>
          </div>

          {/* 4. From Date */}
          <Ainput
            title="From Date"
            type="date"
            name="fromDate"
            value={fromDate}
            handleInputChange={(_, value) => handleFilterChange("fromDate", value)}
            onInput={() => { }}
            redlabel=""
            labelClass="text-lg font-bold"
            className="!h-9 !text-lg"
          />

          {/* 5. To Date */}
          <Ainput
            title="To Date"
            type="date"
            name="toDate"
            value={toDate}
            handleInputChange={(_, value) => handleFilterChange("toDate", value)}
            onInput={() => { }}
            redlabel=""
            labelClass="text-lg font-bold"
            className="!h-9 !text-lg"
          />

          {/* 6. Status Filter */}
          <div>
            <label className="block text-lg font-bold text-[#334155] dark:text-[#CBD5E1] mb-1">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => handleFilterChange("filterStatus", e.target.value)}
              className="w-full h-9 px-3 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl text-lg font-medium text-[#1E293B] dark:text-[#F1F5F9] focus:outline-none cursor-pointer"
            >
              <option value="">All Active Statuses</option>
              <option value="0">New / Received</option>
              <option value="10">Shortlisted</option>
              <option value="2">Contacted</option>
              <option value="7">Busy / No Answer</option>
              <option value="3">Interested</option>
              <option value="4">Demo Scheduled</option>
              <option value="1">Processed / Quotation Sent</option>
              <option value="5">Won (Converted)</option>
              <option value="6">Lost (Dropped Deals)</option>
              <option value="8">Junk / Invalid</option>
              <option value="9">3-Day Exhausted (Stopped)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ══ MAIN TABLE VIEW ══ */}
      <div id="website-leads-table-section" className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-2xl shadow-xs overflow-hidden scroll-mt-6">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-[#E2E8F0] dark:border-[#1E293B] bg-[#F8FAFC]/50 dark:bg-[#1E293B]/30 text-lg font-bold text-[#94A3B8] dark:text-[#64748B] uppercase tracking-wider">
                <th className="py-3 px-4 whitespace-nowrap">Customer & Company</th>
                <th className="py-3 px-4 whitespace-nowrap">Mobile Number</th>
                <th className="py-3 px-4 whitespace-nowrap">Product Requested</th>
                <th className="py-3 px-4 whitespace-nowrap">OTP Status</th>
                <th className="py-3 px-4 whitespace-nowrap">Pipeline Status</th>
                <th className="py-3 px-4 whitespace-nowrap">Temperature</th>
                <th className="py-3 px-4 whitespace-nowrap">Received At</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#F1F5F9] dark:divide-[#1E293B]/70 text-lg">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#94A3B8]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={24} className="animate-spin text-[#818CF8]" />
                      <span className="font-bold text-lg text-[#475569] dark:text-[#CBD5E1]">Fetching Website leads...</span>
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#94A3B8]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Tag size={32} className="text-[#CBD5E1] dark:text-[#334155]" />
                      <span className="font-bold text-lg text-[#475569] dark:text-[#94A3B8]">No Website leads found</span>
                      <span className="text-lg text-[#94A3B8]">Try adjusting your search or date filters.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((lead) => {
                  const leadTargetId = lead.Id || lead.UTD;
                  const statusInfo = getStatusDetails(lead.status);
                  const isLastViewed = leadTargetId === lastViewedLeadId;
                  const isOtpVerified = lead.OTPVerified === true || lead.OTPVerified === "TRUE" || lead.OTPVerified === "true" || lead.OTPVerified === 1 || lead.OTP_Verified === true || lead.OTP_Verified === "TRUE" || lead.OTP_Verified === 1;

                  return (
                    <tr
                      key={leadTargetId}
                      id={`website-lead-row-${leadTargetId}`}
                      onDoubleClick={() => handleOpenDetailView(lead)}
                      className={`hover:bg-[#F8FAFC]/80 dark:hover:bg-[#1E293B]/50 transition-colors group cursor-pointer ${isLastViewed
                          ? "bg-[#EEF2FF]/80 dark:bg-[#1E1B4B]/60 ring-2 ring-inset ring-[#818CF8]/60"
                          : ""
                        }`}
                    >
                      {/* Customer Name & Company */}
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <div
                          title={lead.Name || lead.Full_Name || "—"}
                          className="font-bold text-[#334155] dark:text-[#F1F5F9] text-lg max-w-[190px] truncate leading-snug"
                        >
                          {lead.Name || lead.Full_Name || "—"}
                        </div>
                        <div
                          title={lead.CompanyName || lead.Company_Name || "Website Inquiry"}
                          className="text-lg font-semibold text-[#64748B] dark:text-[#94A3B8] max-w-[190px] truncate leading-tight"
                        >
                          {lead.CompanyName || lead.Company_Name || "Website Inquiry"}
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-[#818CF8] text-lg">
                          {lead.MobileNumber || lead.Phone_Number || "—"}
                        </span>
                      </td>

                      {/* Product Name */}
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-[#4F46E5] dark:text-[#A5B4FC] bg-[#EEF2FF] dark:bg-[#1E1B4B]/70 px-2.5 py-1 rounded-lg text-sm border border-[#C7D2FE] dark:border-[#3730A3]">
                          {lead.ProductName || lead.Product_Name || "General Inquiry"}
                        </span>
                      </td>

                      {/* OTP Status */}
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        {isOtpVerified ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC]">
                            <ShieldCheck size={13} /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]">
                            <ShieldAlert size={13} /> Unverified
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-lg border ${statusInfo.className}`}>
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Temperature */}
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        {(() => {
                          const tempInfo = getTemperatureDetails(lead.Temperature);
                          return (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-lg font-semibold border ${tempInfo.className}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${tempInfo.dotColor}`} />
                              {tempInfo.label}
                            </span>
                          );
                        })()}
                      </td>

                      {/* Received At */}
                      <td className="py-2.5 px-4 text-[#64748B] dark:text-[#94A3B8] font-medium whitespace-nowrap text-lg">
                        {formatDateForDisplay(lead.CreatedAt || lead.Created_At || null)}
                      </td>

                      {/* Action */}
                      <td className="py-2.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            onClick={() => handleOpenDetailView(lead)}
                            variant="outline"
                            size="sm"
                          >
                            View
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-t border-[#F1F5F9] dark:border-[#1E293B] text-lg text-[#64748B] dark:text-[#94A3B8]">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              Showing <span className="font-bold text-[#1E293B] dark:text-[#E2E8F0]">{rows.length}</span> of{" "}
              <span className="font-bold text-[#1E293B] dark:text-[#E2E8F0]">{pagination.totalRecords}</span> leads
            </div>

            <div className="flex items-center gap-2 font-medium">
              <span>Rows per page:</span>
              <select
                value={pagination.pageSize}
                onChange={(e) => {
                  const newSize = Number(e.target.value);
                  setPagination((prev) => ({ ...prev, pageSize: newSize }));
                  fetchWebsiteLeads(1, newSize);
                }}
                className="h-8 px-2.5 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl text-lg font-bold text-[#1E293B] dark:text-[#F1F5F9] focus:outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={500}>500</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPrevPage || isLoading}
              onClick={() => fetchWebsiteLeads(pagination.currentPage - 1)}
              className="h-8 text-lg font-bold cursor-pointer"
            >
              Previous
            </Button>

            <span className="font-bold text-[#1E293B] dark:text-[#E2E8F0] px-2 text-lg">
              Page {pagination.currentPage} of {pagination.totalPages || 1}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNextPage || isLoading}
              onClick={() => fetchWebsiteLeads(pagination.currentPage + 1)}
              className="h-8 text-lg font-bold cursor-pointer"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {renderCallModals()}

      {/* ══ ADD MANUAL LEAD MODAL ══ */}
      {addLeadModalOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col font-sans">
            <div className="flex items-center bg-header text-white justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center font-bold shadow-xs">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 className="text-2xl font-medium leading-tight">Add Direct / Manual Lead</h3>
                  <p className="text-lg mt-0.5">Create a website/dealer lead & link with Campaign</p>
                </div>
              </div>
              <button
                onClick={() => setAddLeadModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-lg font-medium text-[#334155] dark:text-[#CBD5E1] mb-1">
                    Customer / Contact Person <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newLeadForm.dealerName}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, dealerName: e.target.value })}
                    placeholder="e.g. Ramesh Sharma"
                    className="w-full h-10 px-3.5 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-xl text-lg font-medium text-[#0F172A] dark:text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
                  />
                </div>

                <div>
                  <label className="block text-lg font-medium text-[#334155] dark:text-[#CBD5E1] mb-1">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newLeadForm.phoneNumber}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, phoneNumber: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="w-full h-10 px-3.5 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-xl text-lg font-medium text-[#0F172A] dark:text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
                  />
                </div>

                <div>
                  <label className="block text-lg font-medium text-[#334155] dark:text-[#CBD5E1] mb-1">
                    Designation / Role
                  </label>
                  <input
                    type="text"
                    value={newLeadForm.designation}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, designation: e.target.value })}
                    placeholder="e.g. Managing Director / GM"
                    className="w-full h-10 px-3.5 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-xl text-lg font-medium text-[#0F172A] dark:text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
                  />
                </div>

                <div>
                  <label className="block text-lg font-medium text-[#334155] dark:text-[#CBD5E1] mb-1">
                    Company / Dealership Name
                  </label>
                  <input
                    type="text"
                    value={newLeadForm.companyName}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, companyName: e.target.value })}
                    placeholder="e.g. ABC Motors Pvt Ltd"
                    className="w-full h-10 px-3.5 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-xl text-lg font-medium text-[#0F172A] dark:text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
                  />
                </div>

                <div>
                  <label className="block text-lg font-medium text-[#334155] dark:text-[#CBD5E1] mb-1">
                    Number of Employees
                  </label>
                  <select
                    value={newLeadForm.noOfEmployees}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, noOfEmployees: e.target.value })}
                    className="w-full h-10 px-3 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-xl text-lg font-medium text-[#0F172A] dark:text-[#F1F5F9] focus:outline-none cursor-pointer"
                  >
                    <option value="">Select Employee Range</option>
                    <option value="1-10 Employees">1-10 Employees</option>
                    <option value="11-50 Employees">11-50 Employees</option>
                    <option value="51-200 Employees">51-200 Employees</option>
                    <option value="201-500 Employees">201-500 Employees</option>
                    <option value="500+ Employees">500+ Employees</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-lg font-medium text-[#334155] dark:text-[#CBD5E1] mb-1">
                    Product / Module Interest
                  </label>
                  <select
                    value={newLeadForm.module}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, module: e.target.value })}
                    className="w-full h-10 px-3 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-xl text-lg font-medium text-[#0F172A] dark:text-[#F1F5F9] focus:outline-none cursor-pointer"
                  >
                    <option value="Payroll & HRMS">Payroll & HRMS (HR Setu)</option>
                    <option value="Demo Car GatePass">Demo Car GatePass</option>
                    <option value="Incentive Calculator">Incentive Calculator</option>
                    <option value="Customer Payment Tracker">Customer Payment Tracker</option>
                    <option value="Expense Control">Expense Control</option>
                    <option value="Sales CRM">Sales CRM</option>
                    <option value="DMS Workshop">DMS Workshop & Service</option>
                    <option value="Full ERP Suite">Full ERP Suite</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="bg-[#EEF2FF] dark:bg-[#1E1B4B]/30 border border-[#C7D2FE] dark:border-[#3730A3] p-4 rounded-2xl">
                <label className="block text-lg font-medium text-[#4338CA] dark:text-[#A5B4FC] mb-1">
                  🎯 Link Campaign (For AI Calling & WhatsApp)
                </label>
                <select
                  value={newLeadForm.campaignId}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, campaignId: e.target.value })}
                  className="w-full h-10 px-3 bg-white dark:bg-[#0F172A] border border-[#A5B4FC] dark:border-[#4338CA] rounded-xl text-lg font-medium text-[#1E1B4B] dark:text-[#E0E7FF] focus:outline-none cursor-pointer"
                >
                  <option value="">Default / General Campaign</option>
                  {campaignsList.map((camp: any) => (
                    <option key={camp.UTD || camp.Campaign_Id} value={camp.Campaign_Id || camp.Meta_Form_Id}>
                      {camp.Campaign_Name || camp.Campaign_Id}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Custom Questions */}
              <div className="pt-2 border-t border-[#E2E8F0] dark:border-[#1E293B]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-medium text-[#334155] dark:text-[#CBD5E1]">
                    Custom Questions / Additional Fields
                  </span>
                  <button
                    type="button"
                    onClick={handleAddCustomQuestion}
                    className="text-lg font-bold text-[#4F46E5] hover:text-[#4338CA] bg-[#EEF2FF] hover:bg-[#E0E7FF] dark:bg-[#312E81]/40 dark:text-[#A5B4FC] px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus size={14} /> Add Custom Question
                  </button>
                </div>

                {newLeadForm.customQuestions.length === 0 ? (
                  <p className="text-lg text-[#94A3B8] italic">
                    No custom questions added yet.
                  </p>
                ) : (
                  <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                    {newLeadForm.customQuestions.map((q, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={q.question}
                          onChange={(e) => handleCustomQuestionChange(idx, "question", e.target.value)}
                          placeholder="e.g. Current Software / Budget"
                          className="flex-1 h-9 px-3 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-xl text-lg font-medium text-[#0F172A] dark:text-[#F1F5F9] focus:outline-none"
                        />
                        <input
                          type="text"
                          value={q.answer}
                          onChange={(e) => handleCustomQuestionChange(idx, "answer", e.target.value)}
                          placeholder="e.g. Tally / 50k"
                          className="flex-1 h-9 px-3 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-xl text-lg font-medium text-[#0F172A] dark:text-[#F1F5F9] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomQuestion(idx)}
                          className="p-2 text-[#EF4444] hover:bg-[#FEE2E2] dark:hover:bg-[#7F1D1D]/40 rounded-xl transition-all cursor-pointer"
                          title="Remove Field"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-[#F8FAFC] dark:bg-[#090D16] border-t border-[#E2E8F0] dark:border-[#1E293B]">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setAddLeadModalOpen(false)}
                className="text-lg font-bold rounded-xl border-[#CBD5E1] px-5 py-2 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateManualLead}
                disabled={isSubmittingLead}
                size="lg"
                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-lg font-bold rounded-xl px-6 py-2 cursor-pointer shadow-md shadow-[#4F46E5]/20 flex items-center gap-2"
              >
                {isSubmittingLead ? "Saving..." : "Create Lead"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}