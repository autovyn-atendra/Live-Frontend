"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import HashloaderComponent from "@/components/Templates/hashloader";
import axios from "axios";
import Ainput from "@/components/atoms/Input";
import {
  Share2,
  RefreshCw,
  Search,
  Eye,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  Tag,
  Clock,
  TrendingUp,
  Tv,
  Users,
  Kanban,
  Table as TableIcon,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  Filter,
  X,
  ArrowLeft,
  MessageSquare,
  Send,
  Flame,
  FileText,
  Monitor,
  Check,
  PhoneCall,
  ExternalLink,
  Bot,
  PlayCircle,
  Download,
  History,
  Volume2,
  BarChart2,
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

type MetaLead = {
  UTD: number;
  Meta_Lead_Id: string;
  Page_Id: string | null;
  Form_Id: string | null;
  Ad_Id: string | null;
  Ad_Group_Id: string | null;
  Full_Name: string | null;
  Phone_Number: string | null;
  Email: string | null;
  City: string | null;
  Company_Name: string | null;
  Meta_Created_At: string | null;
  Webhook_Created_At: string | null;
  All_Fields: Record<string, any> | string | null;
  Raw_Meta_Response: Record<string, any> | string | null;
  Raw_Webhook_Value: Record<string, any> | string | null;
  Source: string | null;
  status: number | string | null;
  Created_By: string | null;
  Created_At: string | null;
};

type PaginationState = {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

type TimelineRemark = {
  id: number;
  text: string;
  time: string;
  author: string;
  iconType?: "comment" | "webhook";
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

const formatDateForDisplay = (dateStr: string | null): string => {
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

    // 2. Parse Datetime components directly to avoid +5:30 double UTC timezone conversion
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
    return dateStr;
  }
};

const getInitials = (name: string | null) => {
  if (!name) return "VG";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const STAGES = [
  "New",
  "Contacted",
  "Interested",
  "Demo Scheduled",
  "Quotation Sent",
  "Won",
  "Lost",
];

// Map status to badge style & text using explicit hex colors
const getStatusDetails = (statusVal: number | string | null) => {
  if (statusVal === 1 || statusVal === "Processed" || statusVal === "Won") {
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
  return {
    label: "New",
    className: "bg-[#F1F5F9] text-[#334155] border-[#E2E8F0] dark:bg-[#1E293B] dark:text-[#CBD5E1] dark:border-[#334155]",
  };
};

// ============================================================
// MAIN PAGE COMPONENT
// ============================================================
export default function MetaPage() {
  const user: any = useCurrentUser();

  // ── Selected Lead State for Detail Workspace View ────────
  const [selectedLead, setSelectedLead] = useState<MetaLead | null>(null);

  // ── Table State ──────────────────────────────────────────
  const [rows, setRows] = useState<MetaLead[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ── Filter State ─────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterFormId, setFilterFormId] = useState("");
  const [filterCallSource, setFilterCallSource] = useState("");

  // ── Detail Workspace State ────────────────────────────────
  const [activeStage, setActiveStage] = useState<string>("New");
  const [leadTemperature, setLeadTemperature] = useState<"Cold" | "Warm" | "Hot">("Hot");
  const [followupDate, setFollowupDate] = useState<string>("");
  const [followupTime, setFollowupTime] = useState<string>("11:00");
  const [followupType, setFollowupType] = useState<string>("CALL");
  const [followupPurpose, setFollowupPurpose] = useState<string>("");
  const [whatsappReminder, setWhatsappReminder] = useState<boolean>(true);
  const [newRemarkText, setNewRemarkText] = useState<string>("");
  const [activities, setActivities] = useState<any[]>([]);
  const [isSubmittingActivity, setIsSubmittingActivity] = useState<boolean>(false);

  // ── Call Modal State ──────────────────────────────────────
  const [callModalOpen, setCallModalOpen] = useState<boolean>(false);
  const [callResult, setCallResult] = useState<string>("CONNECTED");
  const [callRemark, setCallRemark] = useState<string>("");

  // ── Schedule Demo Modal State ─────────────────────────────
  const [scheduleDemoModalOpen, setScheduleDemoModalOpen] = useState<boolean>(false);
  const [demoDate, setDemoDate] = useState<string>("");
  const [demoTime, setDemoTime] = useState<string>("11:00");
  const [demoType, setDemoType] = useState<string>("ONLINE");
  const [demoRemark, setDemoRemark] = useState<string>("");

  const openScheduleDemoModal = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const dd = String(tomorrow.getDate()).padStart(2, "0");
    setDemoDate(`${yyyy}-${mm}-${dd}`);
    setDemoTime("11:00");
    setDemoType("ONLINE");
    setDemoRemark("");
    setScheduleDemoModalOpen(true);
  };

  // ── Pagination State ─────────────────────────────────────
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    pageSize: 10,
    totalPages: 1,
    totalRecords: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // ============================================================
  // FETCH META LEADS
  // ============================================================
  const fetchMetaLeads = useCallback(
    async (pageToFetch = 1, customLimit?: number) => {
      setIsLoading(true);
      try {
        const payload: Record<string, any> = {
          page: pageToFetch,
          limit: customLimit || pagination.pageSize,
          sortBy: "UTD",
          sortOrder: "DESC",
        };

        if (searchQuery.trim()) payload.search = searchQuery.trim();
        if (fromDate) payload.fromDate = fromDate;
        if (toDate) payload.toDate = toDate;
        if (filterStatus !== "") payload.status = Number(filterStatus);
        if (filterFormId.trim()) payload.formId = filterFormId.trim();
        if (filterCallSource !== "") payload.filterCallSource = filterCallSource;

        const res = await axios.post(`${BASE_URL}/meta/getMetaLeads`, payload, {
          headers: {
            accept: "application/json",
            compcode: user?.Comp_Code || process.env.NEXT_PUBLIC_COMP_CODE || "1",
            name: user?.name,
            "Content-Type": "application/json",
          },
        });

        if (res.data?.success) {
          setRows(Array.isArray(res.data.data) ? res.data.data : []);
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
          err?.response?.data?.message ?? "Error fetching Meta leads",
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
      filterFormId,
      filterCallSource,
      pagination.pageSize,
      user?.Comp_Code,
      user?.name,
    ]
  );

  // ============================================================
  // FETCH LEAD ACTIVITIES (TIMELINE)
  // ============================================================
  const fetchLeadActivities = useCallback(
    async (leadUtd: number) => {
      try {
        const res = await axios.get(`${BASE_URL}/meta/getActivities/${leadUtd}`, {
          headers: {
            accept: "application/json",
            compcode: user?.Comp_Code || process.env.NEXT_PUBLIC_COMP_CODE || "1",
            name: user?.name,
          },
        });

        if (res.data?.success) {
          setActivities(Array.isArray(res.data.data) ? res.data.data : []);
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

  const router = useRouter();
  const searchParams = useSearchParams();
  const leadUtdParam = searchParams.get("leadUtd");
  const fromParam = searchParams.get("from");

  useEffect(() => {
    fetchMetaLeads(1);
    if (leadUtdParam) {
      const leadUtd = Number(leadUtdParam);
      if (leadUtd && !isNaN(leadUtd)) {
        axios.post(`${BASE_URL}/meta/getMetaLeads`, { leadUtd }, {
          headers: {
            accept: "application/json",
            compcode: user?.Comp_Code || process.env.NEXT_PUBLIC_COMP_CODE || "1",
            name: user?.name,
            "Content-Type": "application/json",
          },
        }).then((res) => {
          const list = res.data?.data || [];
          if (Array.isArray(list) && list.length > 0) {
            handleOpenDetailView(list[0]);
          }
        }).catch((err) => {
          console.error("Fetch single lead detail error:", err);
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadUtdParam]);

  const handleApplyFilter = () => {
    fetchMetaLeads(1);
  };

  const handleResetFilter = () => {
    setSearchQuery("");
    setFromDate("");
    setToDate("");
    setFilterStatus("");
    setFilterFormId("");
    setFilterCallSource("");
    setTimeout(() => {
      fetchMetaLeads(1);
    }, 50);
  };

  // Open Detailed CRM Workspace View when clicking View / row
  const handleOpenDetailView = (lead: MetaLead) => {
    setSelectedLead(lead);
    const info = getStatusDetails(lead.status);
    setActiveStage(info.label || "New");

    // Set default datetime to tomorrow at 11:00 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const dd = String(tomorrow.getDate()).padStart(2, "0");
    setFollowupDate(`${yyyy}-${mm}-${dd}`);
    setFollowupTime("11:00");

    fetchLeadActivities(lead.UTD);
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
      "Contacted": 2,
      "Interested": 3,
      "Demo Scheduled": 4,
      "Quotation Sent": 1,
      "Won": 5,
      "Lost": 6,
    };
    const newStatusVal = stageMap[targetStage] !== undefined ? stageMap[targetStage] : 0;
    let customRemark = `Stage changed to ${targetStage}`;

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
              Are you sure you want to mark <b>${selectedLead.Full_Name || "this customer"}</b> as 
              <span style="color: #DC2626; font-weight: 700;">Lost</span>? All future automated calling will be stopped.
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
          confirmButton: "px-5 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-sm rounded-xl cursor-pointer shadow-md transition-all",
          cancelButton: "px-4 py-2.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] font-bold text-sm rounded-xl cursor-pointer transition-all mr-3",
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
          metaLeadUtd: selectedLead.UTD,
          status: newStatusVal,
          remark: customRemark,
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

      const isSuccess = res.data?.success || res.data?.Status || res.data?.status;
      if (isSuccess) {
        showToast(res.data?.message || `Stage updated to ${targetStage}`, "success");
        if (targetStage === "Lost" || targetStage === "Won") {
          setSelectedLead(null);
        } else {
          setActiveStage(targetStage);
          setSelectedLead({ ...selectedLead, status: newStatusVal });
          fetchLeadActivities(selectedLead.UTD);
        }
        fetchMetaLeads(1);
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

  // Add Remark Handler
  const handleAddRemark = async () => {
    if (!newRemarkText.trim() || !selectedLead || isSubmittingActivity) return;
    try {
      setIsSubmittingActivity(true);
      const res = await axios.post(
        `${BASE_URL}/meta/addActivity`,
        {
          metaLeadUtd: selectedLead.UTD,
          activityType: "REMARK",
          activityStatus: "ADDED",
          remark: newRemarkText.trim(),
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

      if (res.data?.success) {
        setNewRemarkText("");
        showToast("Remark added successfully", "success");
        fetchLeadActivities(selectedLead.UTD);
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

    const fDate = followupDate;
    const fTime = followupTime || "11:00";

    try {
      setIsSubmittingActivity(true);
      const res = await axios.post(
        `${BASE_URL}/meta/createFollowup`,
        {
          metaLeadUtd: selectedLead.UTD,
          followupDate: fDate,
          followupTime: fTime,
          followupType: followupType || "CALL",
          purpose: followupPurpose.trim() || "Customer Follow-up Scheduled",
          remark: `WhatsApp reminder: ${whatsappReminder ? "Yes" : "No"}`,
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

      if (res.data?.success) {
        showToast("Follow-up scheduled successfully!", "success");
        setFollowupPurpose("");
        fetchLeadActivities(selectedLead.UTD);
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
    try {
      setIsSubmittingActivity(true);
      const res = await axios.post(
        `${BASE_URL}/meta/addActivity`,
        {
          metaLeadUtd: selectedLead.UTD,
          activityType: "CALL",
          activityStatus: "COMPLETED",
          callResult: callResult,
          remark: callRemark.trim() || `Call outcome: ${callResult}`,
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

      if (res.data?.success) {
        showToast("Call result logged successfully!", "success");
        setCallModalOpen(false);
        setCallRemark("");
        fetchLeadActivities(selectedLead.UTD);
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message ?? "Error logging call", "error");
    } finally {
      setIsSubmittingActivity(false);
    }
  };

  // Trigger Callmatic AI Call Handler
  const [triggeringAiCall, setTriggeringAiCall] = useState<boolean>(false);
  const handleTriggerAiCall = async (metaLeadUtd: number) => {
    if (!metaLeadUtd || triggeringAiCall) return;
    try {
      setTriggeringAiCall(true);
      const res = await axios.post(
        `${BASE_URL}/meta/makeMetaCall`,
        { meta_lead_utd: metaLeadUtd },
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
        fetchLeadActivities(metaLeadUtd);
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
  const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState<boolean>(false);

  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState<boolean>(false);
  const [isLoadingRecording, setIsLoadingRecording] = useState<boolean>(false);
  const [playingCallId, setPlayingCallId] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState<boolean>(false);
  const [selectedSummaryText, setSelectedSummaryText] = useState<string>("");

  // Fetch Enriched AI Call History for Lead
  const handleOpenCallHistory = async (lead: any) => {
    if (!lead || !lead.UTD) return;
    setCallHistoryLead(lead);
    setIsCallHistoryModalOpen(true);
    setIsLoadingCallHistory(true);
    setCallHistoryData([]);

    try {
      const res = await axios.post(
        `${BASE_URL}/meta/getMetaCallHistory`,
        { meta_lead_utd: lead.UTD },
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
      fetchLeadActivities(lead.UTD);
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
    if (!selectedLead || !demoDate || isSubmittingActivity) {
      showToast("Please enter a demo date", "warning");
      return;
    }

    try {
      setIsSubmittingActivity(true);

      // 1. Update Lead Status to "Demo Scheduled" (Status code 4)
      await axios.post(
        `${BASE_URL}/meta/updateLeadStatus`,
        {
          metaLeadUtd: selectedLead.UTD,
          status: 4,
          remark: demoRemark.trim() || `Demo Scheduled for ${demoDate} at ${demoTime}`,
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

      // 2. Create Demo Followup in Meta_Lead_Followup_Tbl
      await axios.post(
        `${BASE_URL}/meta/createFollowup`,
        {
          metaLeadUtd: selectedLead.UTD,
          followupDate: demoDate,
          followupTime: demoTime,
          followupType: "DEMO",
          purpose: `Demo Scheduled (${demoType})`,
          remark: demoRemark.trim() || `Product demo scheduled via ${demoType}`,
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

      showToast(`Demo scheduled for ${demoDate} at ${demoTime}! Stage updated to Demo Scheduled 🎉`, "success");
      setScheduleDemoModalOpen(false);
      setActiveStage("Demo Scheduled");
      setSelectedLead({ ...selectedLead, status: 4 });
      fetchLeadActivities(selectedLead.UTD);
      fetchMetaLeads(pagination.currentPage);
    } catch (err: any) {
      showToast(err?.response?.data?.message ?? "Error scheduling demo", "error");
    } finally {
      setIsSubmittingActivity(false);
    }
  };

  // WhatsApp Action Handler
  const handleWhatsAppAction = async (phone: string, leadUtd: number) => {
    const cleanPhone = phone.replace(/\D/g, "");
    window.open(`https://wa.me/${cleanPhone}`, "_blank");

    try {
      await axios.post(
        `${BASE_URL}/meta/addActivity`,
        {
          metaLeadUtd: leadUtd,
          activityType: "WHATSAPP",
          activityStatus: "OPENED",
          remark: "Opened WhatsApp chat",
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

      if (selectedLead && selectedLead.UTD === leadUtd) {
        fetchLeadActivities(leadUtd);
      }
    } catch (err) { }
  };

  const handleQuickAction = async (actionName: string) => {
    if (!selectedLead) return;

    if (actionName.toLowerCase().includes("demo")) {
      openScheduleDemoModal();
      return;
    }
    try {
      await axios.post(
        `${BASE_URL}/meta/addActivity`,
        {
          metaLeadUtd: selectedLead.UTD,
          activityType: actionName.toUpperCase().includes("DEMO") ? "DEMO" : "QUOTATION",
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
      showToast(`${actionName} triggered for ${selectedLead.Full_Name || "Customer"}`, "info");
      fetchLeadActivities(selectedLead.UTD);
    } catch (err) {
      showToast(`Action ${actionName} completed`, "info");
    }
  };

  // Helper for WhatsApp Chat Speaker Detection
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

    // Fallback: Alternate turns (Index 0 = Agent, Index 1 = Customer)
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
        {/* ══ AI CALL HISTORY MODAL (EXACT MATCHING UI) ══ */}
        <Modal
          isOpen={isCallHistoryModalOpen}
          onClose={() => setIsCallHistoryModalOpen(false)}
          widthClass="max-w-7xl"
          zIndexClass="z-[99990]"
        >
          {/* Navy Dark Blue Header */}
          <div className="flex items-center justify-between bg-[#1B2A4A] dark:bg-[#0F172A] px-6 py-4 text-white">
            <div>
              <h3 className="text-xl font-bold tracking-tight">
                {callHistoryLead?.Meta_Lead_Id || callHistoryLead?.Full_Name || "Callmatic AI Call History"}
              </h3>
              <p className="text-lg text-[#94A3B8] mt-0.5 font-medium">
                {callHistoryLead?.Full_Name || "Customer"} • {callHistoryLead?.Phone_Number || "N/A"} {callHistoryLead?.City ? `• ${callHistoryLead.City}` : ""}
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
                {/* ══ 7 KPI STATS CARDS BAR ══ */}
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

                {/* ══ CALL LOGS TABLE ══ */}
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
                              {/* TIME */}
                              <td className="px-4 py-3.5 text-[#334155] dark:text-[#E2E8F0] whitespace-nowrap">
                                {formatDateForDisplay(call.Created_At)}
                              </td>

                              {/* TO PHONE NUMBER */}
                              <td className="px-4 py-3.5 text-[#334155] dark:text-[#E2E8F0] whitespace-nowrap font-medium">
                                {call.Phone_Number || callHistoryLead?.Phone_Number || "N/A"}
                              </td>

                              {/* STATUS */}
                              <td className="px-4 py-3.5 whitespace-nowrap font-bold text-lg uppercase">
                                <span className={`inline-flex items-center gap-1.5 ${isCompleted ? "text-[#16A34A]" : isFailed ? "text-[#DC2626]" : "text-[#D97706]"
                                  }`}>
                                  <span className="w-2 h-2 rounded-full bg-current" />
                                  {call.status || "completed"}
                                </span>
                              </td>

                              {/* DURATION */}
                              <td className="px-4 py-3.5 text-[#334155] dark:text-[#E2E8F0] whitespace-nowrap">
                                {call.duration ? `${call.duration} sec` : "0 sec"}
                              </td>

                              {/* CHANNEL */}
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                {String(call.Call_Type || "").toUpperCase() === "AUTO_AI_CALL" ||
                                  String(call.Call_Source || "").toUpperCase().includes("CRON") ||
                                  String(call.Created_By || "").toUpperCase().includes("CRON") ||
                                  String(call.Created_By || "").toUpperCase().includes("AUTO") ? (
                                  <span className="px-2.5 py-1 rounded-full text-lg font-bold bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC]">
                                    🤖 Auto AI Call (Cron)
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-full text-lg font-bold bg-[#FFEDD5] text-[#C2410C] border border-[#FED7AA]">
                                    👤 Manual AI Call
                                  </span>
                                )}
                              </td>

                              {/* RECORDING */}
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

                              {/* TRANSCRIPT */}
                              <td className="px-4 py-3.5 text-center whitespace-nowrap">
                                {call.transcript && (Array.isArray(call.transcript) ? call.transcript.length > 0 : String(call.transcript).trim()) ? (
                                  <button
                                    onClick={() => {
                                      setSelectedCallTranscript(call.transcript);
                                      setIsTranscriptModalOpen(true);
                                    }}
                                    className="p-1.5 text-[#7C3AED] hover:bg-[#F5F3FF] dark:hover:bg-[#1E293B] rounded-full transition-all cursor-pointer inline-flex items-center justify-center"
                                    title="View Call Voice Transcript"
                                  >
                                    <MessageSquare size={20} />
                                  </button>
                                ) : (
                                  <span className="text-[#94A3B8]">—</span>
                                )}
                              </td>

                              {/* SUMMARY */}
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

                  {/* Footer Pagination */}
                  <div className="flex items-center justify-between px-4 py-3 bg-[#F8FAFC] dark:bg-[#1E293B]/80 border-t border-[#E2E8F0] dark:border-[#334155] text-lg font-medium text-[#64748B] dark:text-[#94A3B8]">
                    <div>
                      Showing 1 to {callHistoryData.length} of {callHistoryData.length} results
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="lg" disabled className="h-8 px-3 text-lg font-semibold cursor-not-allowed">
                        Previous
                      </Button>
                      <Button variant="outline" size="lg" disabled className="h-8 px-3 text-lg font-semibold cursor-not-allowed">
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-16 space-y-2 bg-white dark:bg-[#0F172A] rounded-xl border border-[#E2E8F0] dark:border-[#334155]">
                <Bot size={44} className="mx-auto text-[#94A3B8] opacity-50" />
                <p className="text-lg font-bold text-[#64748B] dark:text-[#94A3B8]">No AI Call Records Found</p>
                <p className="text-lg text-[#94A3B8]">Trigger a Callmatic AI Call to view real-time call status and recordings here.</p>
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
          {/* WhatsApp Header */}
          <div className="flex items-center justify-between bg-header dark:bg-[#111B21] px-5 py-3 text-white shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#128C7E] flex items-center justify-center font-bold text-white shadow-xs">
                <Bot size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold leading-tight">
                  Callmatic AI Voice Call Transcript
                </h3>
                <p className="text-lg text-[#E0F2F1] dark:text-[#8696A0]">
                  Customer: <span className="font-semibold">{callHistoryLead?.Full_Name || "Customer"}</span>
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

          {/* WhatsApp Chat Wallpaper Background */}
          <div className="p-4 max-h-[70vh] overflow-y-auto space-y-3 bg-[#E5DDD5] dark:bg-[#0B141A] min-h-[350px]">
            {Array.isArray(selectedCallTranscript) && selectedCallTranscript.length > 0 ? (
              selectedCallTranscript.map((tItem: any, idx: number) => {
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
                      {isUser ? (callHistoryLead?.Full_Name || "Customer") : "Callmatic AI Agent"}
                    </span>

                    <div
                      className={`relative max-w-[82%] p-3 rounded-2xl text-lg leading-relaxed shadow-xs ${isUser
                          ? "bg-[#DCF8C6] dark:bg-[#005C4B] text-[#111B21] dark:text-[#E9EDEF] rounded-tr-none border border-[#B9E69B]/50 dark:border-[#005C4B]"
                          : "bg-white dark:bg-[#202C33] text-[#111B21] dark:text-[#E9EDEF] rounded-tl-none border border-[#E2E8F0] dark:border-[#2A3942]"
                        }`}
                    >
                      <p className="whitespace-pre-wrap font-sans text-lg">{messageText}</p>

                      {/* Time & Read Ticks */}
                      <div className={`flex items-center justify-end gap-1 text-[14px] mt-1 ${isUser ? "text-[#54656F] dark:text-[#8696A0]" : "text-[#8696A0]"}`}>

                        {isUser && <span className="text-[#53BDEB]  font-bold">✓✓</span>}
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
            )}
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
            <button onClick={closeRecordingModal} className="hover:opacity-80 cursor-pointer">
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
      </>
    );
  };

  // ============================================================
  // RENDER WORKSPACE DETAIL VIEW (IF LEAD SELECTED)
  // ============================================================
  if (selectedLead) {
    const initials = getInitials(selectedLead.Full_Name);
    const formattedPhone = selectedLead.Phone_Number || "+91 94530 71550";
    // const formattedCity = selectedLead.City;
    const formattedLeadId = selectedLead.Meta_Lead_Id || "—";
    const formattedFormId = selectedLead.Form_Id || "—";
    const formattedSource = selectedLead.Source || "META_LEAD_ADS";
    const formattedReceived = formatDateForDisplay(selectedLead.Created_At || selectedLead.Meta_Created_At);

    return (
      <div className="w-full min-h-screen bg-[#F8FAFC] dark:bg-[#090D16] p-4 sm:p-6 flex flex-col gap-6 font-sans text-[#334155] dark:text-[#F1F5F9]">

        {/* Top Header Navigation */}
        <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0] dark:border-[#1E293B]">
          <button
            onClick={() => {
              if (fromParam === "followup") {
                router.push("/autovyn/meta/followup_lead");
              } else {
                setSelectedLead(null);
              }
            }}
            className="inline-flex items-center gap-2 text-lg font-bold text-[#818CF8] hover:text-[#4338CA] bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] px-3.5 py-2 rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <ArrowLeft size={16} />
            {fromParam === "followup" ? "Back to Follow-ups" : "Back to Dashboard"}
          </button>
        </div>

        {/* ══ 3-COLUMN CRM WORKSPACE GRID ══ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ── LEFT COLUMN (4 COLS) ── */}
          <div className="lg:col-span-4 flex flex-col gap-6">

            {/* Card 1A: Customer Profile Summary */}
            <div className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-2xl p-5 shadow-xs space-y-4">

              {/* Profile Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] dark:bg-[#1E1B4B] text-[#818CF8] dark:text-[#818CF8] font-bold text-lg flex items-center justify-center shadow-inner">
                    {initials}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0F172A] dark:text-white text-lg leading-tight">
                      {selectedLead.Full_Name || "Vinod Gupta"}
                    </h3>
                    <p className="text-lg font-bold uppercase tracking-wider text-[#94A3B8] mt-0.5">
                      {selectedLead.Company_Name || "SELF-EMPLOYED"}
                    </p>
                  </div>
                </div>

                {/* Hot Badge */}
                <span className="inline-flex items-center gap-1 bg-[#FFE4E6] text-[#E11D48] border border-[#FECDD3] text-lg font-bold px-2.5 py-0.5 rounded-full shadow-2xs">
                  <Flame size={13} fill="currentColor" />
                  {leadTemperature}
                </span>
              </div>

              {/* Action Buttons (WhatsApp & Call) */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  onClick={() => handleWhatsAppAction(formattedPhone, selectedLead.UTD)}
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
                  {/* <PhoneCall size={15} /> */}
                  Call & Log
                </Button>
              </div>

              {/* Callmatic AI Call & History Buttons */}
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button
                  disabled={triggeringAiCall}
                  size="lg"
                  onClick={() => handleTriggerAiCall(selectedLead.UTD)}
                  className="w-full flex items-center justify-center gap-1.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold py-2 px-3 rounded-xl text-lg transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  {/* <Bot size={16} className={triggeringAiCall ? "animate-spin" : ""} /> */}
                  {triggeringAiCall ? "Triggering..." : "AI Call"}
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleOpenCallHistory(selectedLead)}
                  className="w-full flex items-center justify-center gap-1.5 bg-white dark:bg-[#1E293B] hover:bg-[#F8FAFC] dark:hover:bg-[#334155] text-[#334155] dark:text-[#E2E8F0] border border-[#E2E8F0] dark:border-[#334155] py-2 px-3 rounded-xl text-lg font-bold transition-all shadow-2xs cursor-pointer"
                >
                  {/* <History size={16} className="text-[#4F46E5] dark:text-[#818CF8]" /> */}
                  AI History
                </Button>
              </div>

              {/* Customer Details Table/List */}
              <div className="pt-2 border-t border-[#F1F5F9] dark:border-[#1E293B] space-y-2.5 text-lg">
                <div className="flex justify-between items-center">
                  <span className="text-[#64748B] font-bold">Phone</span>
                  <span className="font-bold text-[#0F172A] dark:text-white">{formattedPhone}</span>
                </div>

                {/* <div className="flex justify-between items-center">
                  <span className="text-[#64748B] font-bold">City</span>
                  <span className="font-bold text-[#334155] dark:text-[#E2E8F0]">{formattedCity}</span>
                </div> */}

                <div className="flex justify-between items-center">
                  <span className="text-[#64748B] font-bold">Meta Lead ID</span>
                  <span className="font-mono font-bold text-[#818CF8] dark:text-[#818CF8] text-lg">{formattedLeadId}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#64748B] font-bold">Form ID</span>
                  <span className="font-mono text-[#334155] dark:text-[#E2E8F0] text-lg">{formattedFormId}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#64748B] font-bold">Source</span>
                  <span className="font-mono font-bold text-[#334155] dark:text-[#E2E8F0] text-lg">{formattedSource}</span>
                </div>

                <div className="flex justify-between items-center pt-1 border-t border-[#F1F5F9] dark:border-[#1E293B]">
                  <span className="text-[#64748B] font-bold">Received</span>
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
                onClick={() => fetchLeadActivities(selectedLead.UTD)}
                size='lg'
                variant='outline'
                className="flex  items-center gap-4 justify-between"
              >
                {/* <RefreshCw size={12} /> */}
                Reload
              </Button>
            </div>

            {/* Add Remark Input Box */}
            <div className="bg-[#F8FAFC] dark:bg-[#1E293B]/60 border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-2.5 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#4F46E5] text-white font-bold text-lg flex items-center justify-center shrink-0">
                {getInitials(user?.name)}
              </div>
              <input
                type="text"
                value={newRemarkText}
                onChange={(e) => setNewRemarkText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddRemark()}
                placeholder="What was discussed? Add a remark..."
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

                      {/* Icon Badge */}
                      <div className="w-8 h-8 rounded-xl bg-[#EEF2FF] dark:bg-[#1E1B4B] text-[#818CF8] dark:text-[#818CF8] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs border border-[#C7D2FE]/60 dark:border-[#3730A3]/60">
                        {type === "CALL" || type === "AI_CALL" || type === "AI_CALL_SUMMARY" || type === "CALL_INITIATED" ? (
                          <Phone size={15} />
                        ) : type === "WHATSAPP" ? (
                          <MessageSquare size={15} />
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

                      {/* Content */}
                      <div className="flex-1 bg-[#F8FAFC]/80 dark:bg-[#1E293B]/40 p-3 rounded-xl border border-[#F1F5F9] dark:border-[#334155]/60 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold uppercase tracking-wider text-[#818CF8] dark:text-[#818CF8]">
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

                        <p className="text-lg  text-[#94A3B8] pt-0.5">
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
                  placeholder="Purpose / Note (e.g. Price discussion)"
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

              {/* Change Status (Won / Lost) */}
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
                <span className="text-lg font-bold text-[#E11D48]">
                  {leadTemperature}
                </span>
              </div>

              {/* 3 Color Bars */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <button
                  onClick={() => setLeadTemperature("Cold")}
                  className={`h-2 rounded-full transition-all cursor-pointer ${leadTemperature === "Cold" ? "bg-[#0284C7] ring-2 ring-[#0284C7]/30" : "bg-[#0284C7]/30"
                    }`}
                />
                <button
                  onClick={() => setLeadTemperature("Warm")}
                  className={`h-2 rounded-full transition-all cursor-pointer ${leadTemperature === "Warm" ? "bg-[#D97706] ring-2 ring-[#D97706]/30" : "bg-[#D97706]/30"
                    }`}
                />
                <button
                  onClick={() => setLeadTemperature("Hot")}
                  className={`h-2 rounded-full transition-all cursor-pointer ${leadTemperature === "Hot" ? "bg-[#E11D48] ring-2 ring-[#E11D48]/30" : "bg-[#E11D48]/30"
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
                <label className="block text-lg  text-[#334155] dark:text-[#CBD5E1] mb-1">
                  Call Outcome / Result
                </label>
                <select
                  value={callResult}
                  onChange={(e) => setCallResult(e.target.value)}
                  className="w-full h-10 px-3 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl text-lg  text-[#1E293B] dark:text-[#F1F5F9] focus:outline-none"
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
                <label className="block text-lg  text-[#334155] dark:text-[#CBD5E1] mb-1">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-3xl p-6 shadow-2xl w-full max-w-lg space-y-4">
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

              <p className="text-lg font-bold text-[#64748B] dark:text-[#94A3B8]">
                Scheduling demo for <span className="font-medium text-[#0F172A] dark:text-white">{selectedLead?.Full_Name || "Customer"}</span>
              </p>

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
                  className="w-full h-10 px-3 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl text-lg  text-[#1E293B] dark:text-[#F1F5F9] focus:outline-none"
                >
                  <option value="ONLINE">ONLINE (Google Meet / Zoom / Screen Share)</option>
                  <option value="IN_PERSON">IN_PERSON (Company Office Visit)</option>
                  <option value="CLIENT_LOCATION">CLIENT_LOCATION (Client Site Visit)</option>
                </select>
              </div>

              <div>
                <label className="block text-lg font-bold text-[#334155] dark:text-[#CBD5E1] mb-1">
                  Demo Agenda / Remark
                </label>
                <textarea
                  rows={3}
                  value={demoRemark}
                  onChange={(e) => setDemoRemark(e.target.value)}
                  placeholder="Enter demo agenda, client requirements, or special notes..."
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
  // RENDER PIPELINE TABLE & KANBAN LIST
  // ============================================================
  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] dark:bg-[#090D16] p-4 sm:p-6 flex flex-col gap-6 font-sans text-[#334155] dark:text-[#F1F5F9]">

      {/* ══ TOP PIPELINE HEADER ══ */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] dark:text-white tracking-tight">
            Pipeline
          </h1>
          <p className="text-lg font-medium text-[#64748B] dark:text-[#94A3B8] mt-0.5">
            {pagination.totalRecords} leads across {STAGES.length} stages · Meta Ad Leads
          </p>
        </div>
      </div>

      {/* ══ METRIC SUMMARY CARDS GRID (4 CARDS) ══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">

        {/* Card 1: TOTAL LEADS */}
        <div className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold uppercase tracking-wider text-[#94A3B8]">
              Total Leads
            </span>
            <div className="w-9 h-9 rounded-full bg-[#F0F9FF] dark:bg-[#082F49]/70 text-[#0284C7] dark:text-[#38BDF8] flex items-center justify-center">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-bold text-[#0F172A] dark:text-white tracking-tight">
              {pagination.totalRecords || rows.length}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1 text-lg font-bold text-[#059669] dark:text-[#34D399]">
            <ArrowUpRight size={15} />
            <span>+12 this week</span>
          </div>
        </div>

        {/* Card 2: TODAY'S FOLLOWUPS */}
        <div className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold uppercase tracking-wider text-[#94A3B8]">
              Today's Followups
            </span>
            <div className="w-9 h-9 rounded-full bg-[#FFFBEB] dark:bg-[#451A03]/70 text-[#D97706] dark:text-[#FBBF24] flex items-center justify-center">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-bold text-[#0F172A] dark:text-white tracking-tight">
              6
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-lg font-bold text-[#E11D48] dark:text-[#FB7185]">
            <AlertCircle size={15} />
            <span>3 overdue · act now</span>
          </div>
        </div>

        {/* Card 3: DEMOS THIS WEEK */}
        <div className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold uppercase tracking-wider text-[#94A3B8]">
              Demos This Week
            </span>
            <div className="w-9 h-9 rounded-full bg-[#FAF5FF] dark:bg-[#3B0764]/70 text-[#9333EA] dark:text-[#C084FC] flex items-center justify-center">
              <Tv size={18} />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-bold text-[#0F172A] dark:text-white tracking-tight">
              4
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1 text-lg font-bold text-[#059669] dark:text-[#34D399]">
            <ArrowUpRight size={15} />
            <span>2 completed</span>
          </div>
        </div>

        {/* Card 4: CONVERSION RATE */}
        <div className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold uppercase tracking-wider text-[#94A3B8]">
              Conversion Rate
            </span>
            <div className="w-9 h-9 rounded-full bg-[#ECFDF5] dark:bg-[#064E3B]/70 text-[#059669] dark:text-[#34D399] flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-bold text-[#0F172A] dark:text-white tracking-tight">
              18.4%
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1 text-lg font-bold text-[#059669] dark:text-[#34D399]">
            <ArrowUpRight size={15} />
            <span>+2.1% vs last mo</span>
          </div>
        </div>

      </div>

      {/* ══ ALWAYS-VISIBLE ADVANCED FILTER PANEL ══ */}
      <div className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">

        {/* Card Title & Header Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3  pb-3 dark:border-[#1E293B]">
          <h3 className="text-lg font-bold uppercase tracking-wider text-[#334155] dark:text-[#CBD5E1] flex items-center gap-2">
            <Filter size={16} className="text-[#4F46E5]" />
            ADVANCED FILTER PARAMETERS
          </h3>
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilter}
              disabled={isLoading}
              className="text-lg font-bold h-9 px-3 cursor-pointer"
            >
              Reset Filters
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleApplyFilter}
              disabled={isLoading}
              className="text-lg font-bold h-9 px-4 bg-[#4F46E5] hover:bg-[#4338CA] text-white border-transparent cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              {/* <Filter size={14} /> */}
              Apply Parameters
            </Button>

          </div>

        </div>

        {/* 6-Column Responsive Filter Grid (Including Search Input) */}
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
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleApplyFilter()}
                placeholder="Name, Phone, City, ID..."
                className="w-full pl-9 pr-3 h-9 bg-[#F8FAFC] dark:bg-[#1E293B]/80 border border-[#E2E8F0] dark:border-[#334155] rounded-xl text-lg font-medium text-[#1E293B] dark:text-[#F1F5F9] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
              />
            </div>
          </div>

          {/* 2. From Date */}
          <Ainput
            title="From Date"
            type="date"
            name="fromDate"
            value={fromDate}
            handleInputChange={(_, value) => setFromDate(value)}
            onInput={() => { }}
            redlabel=""
            labelClass="text-lg font-bold"
            className="!h-9 !text-lg"
          />

          {/* 3. To Date */}
          <Ainput
            title="To Date"
            type="date"
            name="toDate"
            value={toDate}
            handleInputChange={(_, value) => setToDate(value)}
            onInput={() => { }}
            redlabel=""
            labelClass="text-lg font-bold"
            className="!h-9 !text-lg"
          />

          {/* 4. Status Filter */}
          <div>
            <label className="block text-lg font-bold text-[#334155] dark:text-[#CBD5E1] mb-1">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full h-9 px-3 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl text-lg font-medium text-[#1E293B] dark:text-[#F1F5F9] focus:outline-none cursor-pointer"
            >
              <option value="">All Active Statuses</option>
              <option value="0">New / Received</option>
              <option value="1">Processed / Quotation Sent</option>
              <option value="2">Contacted</option>
              <option value="3">3-Day Exhausted (Stopped)</option>
              <option value="4">Demo Scheduled</option>
              <option value="5">Won (Converted)</option>
              <option value="6">Lost (Dropped Deals)</option>
            </select>
          </div>

          {/* 5. Call / Cron Source */}
          <div>
            <label className="block text-lg font-bold text-[#334155] dark:text-[#CBD5E1] mb-1">
              Call / Cron Source
            </label>
            <select
              value={filterCallSource}
              onChange={(e) => setFilterCallSource(e.target.value)}
              className="w-full h-9 px-3 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl text-lg font-medium text-[#1E293B] dark:text-[#F1F5F9] focus:outline-none cursor-pointer"
            >
              <option value="">All Call Sources</option>
              <option value="AUTO_AI_CALL">🤖 Auto Cron AI Calls</option>
              <option value="MANUAL_AI_CALL">👤 Manual AI Calls</option>
              <option value="SCHEDULED">📅 Scheduled Callbacks</option>
            </select>
          </div>

          {/* 6. Form ID */}
          <Ainput
            title="Form ID"
            type="text"
            name="filterFormId"
            value={filterFormId}
            handleInputChange={(_, value) => setFilterFormId(value)}
            onInput={() => { }}
            redlabel=""
            placeholder="Filter by Form ID"
            labelClass="text-lg font-bold"
            className="!h-9 !text-lg"
          />
        </div>

      </div>


      {/* ══ MAIN TABLE VIEW ══ */}
      <div className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-2xl shadow-xs overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">

            {/* Table Header */}
            <thead>
              <tr className="border-b border-[#E2E8F0] dark:border-[#1E293B] bg-[#F8FAFC]/50 dark:bg-[#1E293B]/30 text-lg font-bold text-[#94A3B8] dark:text-[#64748B] uppercase tracking-wider">
                <th className="py-3.5 px-4">Customer Name</th>
                <th className="py-3.5 px-4">Contact</th>
                {/* <th className="py-3.5 px-4">City</th> */}
                <th className="py-3.5 px-4">Meta Lead ID</th>
                <th className="py-3.5 px-4">Source</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Received At</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-[#F1F5F9] dark:divide-[#1E293B]/70 text-lg">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#94A3B8]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={24} className="animate-spin text-[#818CF8]" />
                      <span className="font-bold text-lg text-[#475569] dark:text-[#CBD5E1]">Fetching Meta ad leads...</span>
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#94A3B8]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Tag size={32} className="text-[#CBD5E1] dark:text-[#334155]" />
                      <span className="font-bold text-lg text-[#475569] dark:text-[#94A3B8]">No Meta leads found</span>
                      <span className="text-lg text-[#94A3B8]">Try adjusting your search or date filters.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((lead) => {
                  const statusInfo = getStatusDetails(lead.status);

                  return (
                    <tr
                      key={lead.UTD}
                      onDoubleClick={() => handleOpenDetailView(lead)}
                      className="hover:bg-[#F8FAFC]/80 dark:hover:bg-[#1E293B]/50 transition-colors group cursor-pointer"
                    >
                      {/* Customer Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#64748B] dark:text-[#94A3B8] text-lg">
                          {lead.Full_Name || "—"}
                        </div>
                        <div className="text-lg font-bold text-[#94A3B8] dark:text-[#64748B] uppercase tracking-wider mt-0.5">
                          {lead.Company_Name || "SELF-EMPLOYED"}
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-[#818CF8] dark:text-[#818CF8] text-lg">
                          {lead.Phone_Number || "—"}
                        </span>
                      </td>

                      {/* City */}
                      {/* <td className="py-3.5 px-4 text-[#475569] dark:text-[#CBD5E1] font-medium text-lg">
                        {lead.City || "—"}
                      </td> */}

                      {/* Meta Lead ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-[#818CF8] dark:text-[#818CF8] text-lg">
                        {lead.Meta_Lead_Id || "—"}
                      </td>

                      {/* Source */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-lg font-bold bg-[#EEF2FF] text-[#818CF8] border border-[#C7D2FE] dark:bg-[#1E1B4B]/60 dark:text-[#A5B4FC] dark:border-[#3730A3] font-mono tracking-wider">
                          {lead.Source || "META_LEAD_ADS"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-lg border ${statusInfo.className}`}>
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Received At */}
                      <td className="py-3.5 px-4 text-[#64748B] dark:text-[#94A3B8] font-medium whitespace-nowrap text-lg">
                        {formatDateForDisplay(lead.Created_At || lead.Meta_Created_At || null)}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            onClick={() => handleOpenDetailView(lead)}
                            variant="outline"
                            size="sm"

                          // className="px-2.5 py-1 rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-[#334155] dark:text-[#E2E8F0] hover:bg-[#F8FAFC] dark:hover:bg-[#334155] text-lg font-bold transition-all shadow-2xs cursor-pointer"
                          >
                            View
                          </Button>
                          {/* <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTriggerAiCall(lead.UTD);
                            }}
                            disabled={triggeringAiCall}
                            variant="outline"
                            size="sm"
                          >
                            <Bot size={14} className={triggeringAiCall ? "animate-spin" : ""} />
                            AI Call
                          </Button> */}
                          {/* <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenCallHistory(lead);
                            }}
                            variant="outline"
                            size="sm"
                          >
                            <History size={14} className="text-purple-600 dark:text-purple-400" />
                            History
                          </Button> */}
                         
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

            {/* Page Size Selector */}
            <div className="flex items-center gap-2 font-medium">
              <span>Rows per page:</span>
              <select
                value={pagination.pageSize}
                onChange={(e) => {
                  const newSize = Number(e.target.value);
                  setPagination((prev) => ({ ...prev, pageSize: newSize }));
                  fetchMetaLeads(1, newSize);
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
              onClick={() => fetchMetaLeads(pagination.currentPage - 1)}
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
              onClick={() => fetchMetaLeads(pagination.currentPage + 1)}
              className="h-8 text-lg font-bold cursor-pointer"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {renderCallModals()}
    </div>
  );
}