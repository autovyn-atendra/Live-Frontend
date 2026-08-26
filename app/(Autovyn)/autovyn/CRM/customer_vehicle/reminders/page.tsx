"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import DataTable from "@/components/Templates/servicetable";
import HashloaderComponent from "@/components/Templates/hashloader";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import axios from "axios";
import { useRouter } from "next/navigation";
import Ainput from "@/components/atoms/Input";
import CustomSelectSearch from "@/components/atoms/Select";
import {
  MessageSquareText,
  BarChart3,
  PlayCircle,
  Download,
  X,
  FileText,
  PhoneCall,
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";


// ============================================================
// CONSTANTS
// ============================================================
const BASE_URL = process.env.NEXT_PUBLIC_URL;

const API = {
  getAll: `${BASE_URL}/Crm/reminder/getAll`,
  getOne: `${BASE_URL}/Crm/reminder/getOne`,
  update: `${BASE_URL}/Crm/reminder/update`,
  complete: `${BASE_URL}/Crm/reminder/complete-service`,
  generate: `${BASE_URL}/Crm/reminder/generate`,
  aiCall: `${BASE_URL}/Crm/makeServiceReminderCall`,   // ✅ AI Call
  callHist: `${BASE_URL}/Crm/callWebhook`,               // ✅ Call History
};

// ============================================================
// DATE HELPERS
// ============================================================
const pad = (n: number) => String(n).padStart(2, "0");
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const tomorrowStr = () => { const d = new Date(); d.setDate(d.getDate() + 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const sevenDaysAgoStr = () => { const d = new Date(); d.setDate(d.getDate() - 7); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const sevenDaysLaterStr = () => { const d = new Date(); d.setDate(d.getDate() + 7); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

// ============================================================
// TYPES
// ============================================================
type DueStatus = "DUE_TODAY" | "OVERDUE" | "UPCOMING" | "COMPLETED" | "UNKNOWN";
type TabType = "info" | "call" | "appointment" | "service" | "aicall";
type ActionType = "NONE" | "NO_ANSWER" | "CALL_LATER" | "APPOINTMENT" | "CLOSE" | "COMPLETE";
// ✅ NEW — Date filter type
type DateFilterType = "reminder" | "due";

type ReminderRow = {
  UTD: number; Cust_Vehi_UTD: number; Service_Rule_UTD: number; Loc_Code: string;
  Cust_UTD: number; Tran_id: number | null; Veh_Reg_No: string | null; Cust_Name: string;
  Cust_Mob: string; Model_Name: string; Last_Service_Date: string | null;
  Last_Service_KM: number | null; Avg_Daily_KM: number | null; Next_Service_KM: number | null;
  Current_KM: number | null; Date_Based_Due_Date: string | null; KM_Based_Due_Date: string | null;
  Final_Due_Date: string | null; Reminder_Date: string | null; Reminder_Type: string | null;
  Reminder_Channel: string | null; Reminder_Status: string | null; Reminder_Count: number;
  Last_Reminder_At: string | null; Call_Status: string | null; Customer_Response: string | null;
  Followup_Date: string | null; Followup_Remark: string | null; Current_KM_Verified: number | null;
  Contacted_By: string | null; Appointment_Date: string | null; Appointment_Time: string | null;
  Appointment_Status: string | null; Appointment_Remark: string | null; Service_Status: string | null;
  Service_Completed_Date: string | null; Service_Completed_KM: number | null; Service_Remark: string | null;
  status: number; Created_By: string | null; Created_At: string | null; Updated_By: string | null;
  Updated_At: string | null; Due_Status: DueStatus | null; KM_Due_At: number | null; KM_Last: number | null;
  KM_Interval: number | null; Days_Until_Reminder: number | null; Days_Until_Due: number | null;
  Final_Due_Based_On: string | null; Loc_Name: string | null; AI_Call_ID: string | null;
};

// ✅ Transcript turn (bot/human message)
type TranscriptTurn = {
  sender: "bot" | "human" | string;
  timestamp: number;
  text: string;
};

// ✅ Call History Type (normalized from webhook response)
type CallHistory = {
  callId: string;
  campaignId?: string | null;
  phoneNumber: string;
  direction?: string | null;
  status: string;
  duration: number | null;
  startTime: string | null;
  endTime: string | null;
  triggerTime?: string | null;
  transcript: TranscriptTurn[] | null;
  recordingUrl: string | null;
  variables: Record<string, string> | null;
  summary: string | null;
  category?: string | null;
};

type ChatMessage = {
  side: "left" | "right";
  message: string;
  time: string;
};

type CallRecord = {
  callId: string;
  triggeredAt: string;
  phoneNumber: string;
  status: string;
  duration: string;
  durationSec: number;
  callChannel?: string;
  chat?: {
    messages: ChatMessage[];
  };
  summary?: string;
  category?: string;
  customerResponse?: string | null;
  appointmentStatus?: string | null;
  appointmentRemark?: string | null;
  appointmentSet?: boolean;
  appointmentDate?: string;
  appointmentTime?: string;
  appointmentSlot?: string;
  formResponse?: {
    hasSubmittedForm: boolean;
    scheduledDate: string | null;
    scheduledTime: string | null;
    serviceType: string | null;
    customerResponse: string | null;
    appointmentStatus: string | null;
    submittedAt: string | null;
  };
  transferInfo?: {
    transferredTo: string;
    transferStatus: string;
    transferTime: string;
  };
};

type CallHistoryStats = {
  totalCalls: number;
  completedCalls: number;
  busyCalls: number;
  noAnswerCalls: number;
  failedCalls: number;
  appointmentsSet: number;
  totalDurationSec: number;
};

type FullCallHistoryResponse = {
  Status: boolean;
  Message: string;
  vehicleInfo: {
    Veh_Reg_No: string;
    Cust_Name: string;
    Cust_Mob: string;
    Model_Name: string;
  };
  stats: CallHistoryStats;
  calls: CallRecord[];
};

// ============================================================
// UTILS
// ============================================================
const fmtDate = (v: string | null | undefined) => { if (!v) return "—"; const [y, m, d] = v.split("-"); return y && m && d ? `${d}-${m}-${y}` : v; };
const fmtNum = (v: number | null | undefined) => v == null ? "—" : v.toLocaleString("en-IN");
const trimOrUndef = (v: unknown) => { const s = v == null ? "" : String(v).trim(); return s || undefined; };

const showToast = (msg: string, type: "success" | "error" | "warning" | "info") =>
  Swal.mixin({ toast: true, position: "top-end", showConfirmButton: false, timer: 4000, timerProgressBar: true })
    .fire({ icon: type, title: msg });

const Modal = ({
  isOpen,
  onClose,
  children,
  widthClass = "max-w-4xl",
  zIndexClass = " z-50",
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  widthClass?: string;
  zIndexClass?: string;
}) => {
  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 ${zIndexClass} flex items-center justify-center bg-black/60 p-4`}
      onClick={onClose}
    >
      <div
        className={`relative max-h-[92vh] w-full ${widthClass} overflow-hidden rounded-lg bg-white shadow-2xl dark:bg-[#111827]`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

const CallStatCard = ({
  label,
  value,
  color = "text-[#1F2937] dark:text-white",
}: {
  label: string;
  value: string | number;
  color?: string;
}) => (
  <div className="rounded-md border border-[#E5E7EB] bg-[#F9FAFB] p-2.5 text-center dark:border-[#374151] dark:bg-[#1F2937]">
    <p className={`text-[22px] font-bold ${color}`}>{value}</p>
    <p className="text-[14px] font-medium text-[#6B7280] dark:text-[#9CA3AF]">{label}</p>
  </div>
);

const InsightRow = ({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) => (
  <div className="flex flex-col gap-1 border-b border-[#E5E7EB]/40 pb-2.5 dark:border-[#374151]/40">
    <span className="text-[15px] font-semibold text-[#6B7280] dark:text-[#9CA3AF]">
      {label}
    </span>
    <span className="text-[18px] font-medium text-[#1F2937] dark:text-[#F3F4F6]">{value ?? "-"}</span>
  </div>
);

const getCallStatusColor = (status: string | undefined) => {
  switch (status?.toUpperCase()) {
    case "COMPLETED": return "text-[#16A34A]";
    case "BUSY": return "text-[#CA8A04]";
    case "NO_ANSWER": return "text-[#6B7280]";
    case "FAILED": return "text-[#DC2626]";
    default: return "text-[#4B5563]";
  }
};

// ============================================================
// ✅ CALL HISTORY NORMALIZATION HELPERS
// ============================================================
const extractInsight = (insights: any[] | undefined, matcher: (actionType: string) => boolean): any => {
  if (!Array.isArray(insights)) return null;
  return insights.find((i) => matcher(String(i?.actionType ?? ""))) ?? null;
};

const extractSummary = (insights: any[] | undefined): string | null => {
  const s = extractInsight(insights, (a) => a === "SUMMARIZE");
  return s?.output?.summary ?? null;
};

const extractCategory = (insights: any[] | undefined): string | null => {
  const c = extractInsight(insights, (a) => a.includes("CATEGORIZATION"));
  return c?.output?.category ?? null;
};

// Normalize ONE raw call object (as sent in webhook `Data.data`) into CallHistory
const normalizeCall = (raw: any): CallHistory => ({
  callId: raw?.callId ?? raw?.call_id ?? "—",
  campaignId: raw?.campaignId ?? null,
  phoneNumber: raw?.phoneNumber ?? raw?.phone_number ?? "—",
  direction: raw?.direction ?? null,
  status: String(raw?.status ?? "unknown").toUpperCase(),
  duration: typeof raw?.duration === "number" ? raw.duration : null,
  startTime: raw?.startTime ?? null,
  endTime: raw?.endTime ?? null,
  triggerTime: raw?.triggerTime ?? raw?.triggeredAt ?? raw?.uploadTime ?? null,
  transcript: Array.isArray(raw?.transcript) ? raw.transcript : null,
  recordingUrl: raw?.recordingUrl ?? raw?.recording_url ?? null,
  variables: raw?.variables ?? null,
  summary: raw?.summary ?? extractSummary(raw?.insights),
  category: raw?.category ?? extractCategory(raw?.insights),
});

// Pull the actual call record(s) out of whatever shape the API returns
const extractCallRecords = (body: any): any[] => {
  // Expected real shape: { Status, Result, Data: { success, data: {...} | [...] }, DBUpdate }
  const candidates = [
    body?.Data?.data,
    body?.data?.data,
    body?.data,
    body?.Data,
    body,
  ];

  for (const c of candidates) {
    if (Array.isArray(c) && c.length > 0) return c;
    if (c && typeof c === "object" && (c.callId || c.call_id)) return [c];
  }

  // Other possible list wrappers
  if (Array.isArray(body?.calls)) return body.calls;
  if (Array.isArray(body?.history)) return body.history;

  return [];
};

// ============================================================
// BADGE COMPONENTS
// ============================================================
const DueBadge = ({ status }: { status: DueStatus | null }) => {
  const map: Record<string, { label: string; cls: string }> = {
    DUE_TODAY: { label: "Due Today", cls: "text-[#CA8A04] border border-[#EAB308] dark:bg-[#713F12]/30 dark:text-[#FDE047] dark:border-[#A16207]" },
    OVERDUE: { label: "Overdue", cls: "bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5] dark:bg-[#7F1D1D]/30 dark:text-[#FCA5A5] dark:border-[#B91C1C]" },
    COMPLETED: { label: "Completed", cls: "bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC] dark:bg-[#14532D]/30 dark:text-[#86EFAC] dark:border-[#15803D]" },
    UPCOMING: { label: "Upcoming", cls: "bg-[#DBEAFE] text-[#1D4ED8] border border-[#93C5FD] dark:bg-[#14532D]/30 dark:text-[#93C5FD] dark:border-[#1D4ED8]" },
    UNKNOWN: { label: "Unknown", cls: "bg-gray-100 text-gray border border-gray-300 dark:bg-[#1F2937] dark:text-[#9CA3AF] dark:border-gray-600" },
  };
  const s = status ? (map[status] ?? map.UNKNOWN) : map.UNKNOWN;
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[18px] font-semibold whitespace-nowrap ${s.cls}`}>{s.label}</span>;
};

const ReminderStatusBadge = ({ status }: { status: string | null }) => {
  const map: Record<string, string> = {
    PENDING: "bg-[#FFEDD5] text-[#CA8A04] border border-[#FDBA74] dark:bg-[#7C2D12]/30 dark:text-[#FDBA74] dark:border-[#C2410C]",
    SENT: "bg-[#DBEAFE] text-[#1D4ED8] border border-[#93C5FD] dark:bg-[#14532D]/30 dark:text-[#93C5FD] dark:border-[#1D4ED8]",
    FOLLOWUP: "bg-[#F3E8FF] text-[#7E22CE] border border-[#D8B4FE] dark:bg-[#581C87]/30 dark:text-[#D8B4FE] dark:border-[#7E22CE]",
    APPOINTMENT_BOOKED: "bg-[#CFFAFE] text-[#0E7490] border border-[#67E8F9] dark:bg-[#164E63]/30 dark:text-[#67E8F9] dark:border-[#0E7490]",
    CLOSED: "bg-gray-100 text-gray border border-gray-300 dark:bg-[#1F2937] dark:text-[#9CA3AF] dark:border-gray-600",
    FAILED: "bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5] dark:bg-[#7F1D1D]/30 dark:text-[#FCA5A5] dark:border-[#B91C1C]",
  };
  const cls = status ? (map[status] ?? "bg-gray-100 text-gray border border-gray-300") : "bg-gray-100 text-[#9CA3AF] border border-gray-200";
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-semibold whitespace-nowrap ${cls}`}>{status ?? "—"}</span>;
};

// ✅ Call Status Badge
const CallStatusBadge = ({ status }: { status: string | null | undefined }) => {
  const map: Record<string, string> = {
    COMPLETED: "bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC] dark:bg-[#14532D]/30 dark:text-[#86EFAC]",
    INITIATED: "bg-[#DBEAFE] text-[#1D4ED8] border border-[#93C5FD] dark:bg-[#1E3A8A]/30 dark:text-[#93C5FD]",
    FAILED: "bg-[#FEE2E2] text-[#B91C1C] border border-[#FCA5A5] dark:bg-[#7F1D1D]/30 dark:text-[#FCA5A5]",
    NO_ANSWER: "bg-gray-100 text-gray-600 border border-gray-300 dark:bg-[#1F2937] dark:text-gray-300",
    IN_PROGRESS: "bg-[#FEF3C7] text-[#B45309] border border-[#FCD34D] dark:bg-[#78350F]/30 dark:text-[#FDE68A]",
  };
  const cls = status ? (map[status] ?? "bg-gray-100 text-gray-600 border border-gray-300") : "bg-gray-100 text-[#9CA3AF] border border-gray-200";
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-semibold whitespace-nowrap ${cls}`}>{status ?? "—"}</span>;
};

// ============================================================
// UI HELPERS
// ============================================================
const InfoRow = ({ label, value, highlight, valueClass }: { label: string; value: React.ReactNode; highlight?: boolean; valueClass?: string }) => (
  <div className="flex justify-between items-center py-2.5 border-b last:border-0 border-[#E5E7EB] dark:border-[#1E293B]">
    <span className="text-[18px] text-[#6B7280] dark:text-[#9CA3AF] min-w-[140px] shrink-0 font-medium">{label}</span>
    <span className={`text-[18px] text-center font-semibold break-all ml-2 ${highlight ? "text-[#1D4ED8] dark:text-[#60A5FA]" : "text-[#111827] dark:text-white"} ${valueClass ?? ""}`}>{value ?? "—"}</span>
  </div>
);

const SectionTitle = ({ title, icon }: { title: string; icon?: string }) => (
  <div className="flex items-center gap-2 mb-3">
    {icon && <span className="text-base opacity-70">{icon}</span>}
    <h3 className="text-[18px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] dark:text-[#4B5563] whitespace-nowrap">{title}</h3>
    <div className="flex-1 h-px bg-[#E5E7EB] dark:bg-[#1E293B]" />
  </div>
);

const ActionBtn = ({ label, active, color, onClick, disabled }: { label: string; active: boolean; color: string; onClick: () => void; disabled: boolean }) => {
  const cfg: Record<string, { base: string; act: string }> = {
    gray: {
      base: "bg-white text-[#6B7280] border border-[#D1D5DB] hover:border-[#374151] hover:text-[#374151] dark:bg-transparent dark:text-[#9CA3AF] dark:border-borderColor-dark",
      act: "bg-[#F9FAFB] text-[#374151] text-[20px] border-2 border-[#374151] dark:bg-[#1F2937]/40 dark:text-white dark:border-[#4B5563]",
    },
    blue: {
      base: "bg-white text-[#2563EB] border border-[#93C5FD] hover:border-[#2563EB] dark:bg-transparent dark:text-[#60A5FA] dark:border-[#1E40AF]",
      act: "bg-[#EFF6FF] text-[#1D4ED8] text-[20px] border-2 border-[#2563EB] dark:bg-[#1E3A8A]/20 dark:text-[#60A5FA] dark:border-[#3B82F6]",
    },
    amber: {
      base: "bg-white text-[#D97706] border border-[#FCD34D] hover:border-[#D97706] dark:bg-transparent dark:text-[#FBBF24] dark:border-[#92400E]",
      act: "bg-[#FFFBEB] text-[#B45309] text-[20px] border-2 border-[#D97706] dark:bg-[#78350F]/20 dark:border-[#F59E0B]",
    },
    red: {
      base: "bg-white text-[#DC2626] border border-[#FCA5A5] hover:border-[#DC2626] dark:bg-transparent dark:text-[#F87171] dark:border-[#991B1B]",
      act: "bg-[#FEF2F2] text-[#DC2626] text-[20px] border-2 border-[#DC2626] dark:bg-[#7F1D1D]/20 dark:border-[#EF4444]",
    },
    green: {
      base: "bg-white text-[#16A34A] border border-[#86EFAC] hover:border-[#16A34A] dark:bg-transparent dark:text-[#4ADE80] dark:border-[#166534]",
      act: "bg-[#F0FDF4] text-[#15803D] text-[20px] border-2 border-[#16A34A] dark:bg-[#14532D]/20 dark:border-[#22C55E]",
    },
    purple: {
      base: "bg-white text-[#7C3AED] border border-[#C4B5FD] hover:border-[#7C3AED] dark:bg-transparent dark:text-[#A78BFA] dark:border-[#6B21A8]",
      act: "bg-[#FAF5FF] text-[#7C3AED] text-[20px] border-2 border-[#7C3AED] dark:bg-[#581C87]/20 dark:border-[#A855F7]",
    },
  };
  const c = cfg[color] ?? cfg.gray;
  return (
    <button
      className={`flex items-center gap-1.5 px-4 py-2.5 text-[14px] font-semibold rounded-lg transition-all duration-150 ${active ? c.act : c.base
        } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:scale-[1.02] active:scale-[0.98]"}`}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
};

const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1">
    <label className="text-lg font-semibold text-[#374151] dark:text-[#D1D5DB]">
      {label}{required && <span className="text-[#EF4444] ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const inputCls =
  "h-10 w-full rounded-lg border border-[#D1D5DB] dark:border-borderColor-dark " +
  "bg-white dark:bg-input px-3 text-[16px] text-[#111827] dark:text-white " +
  "focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent " +
  "placeholder:text-[#9CA3AF] dark:placeholder:text-gray-600 transition-shadow";

const selectCls =
  "h-10 w-full rounded-lg border border-[#D1D5DB] dark:border-borderColor-dark " +
  "bg-white dark:bg-input px-2 text-[16px] text-[#111827] dark:text-white " +
  "focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-shadow";

// ============================================================
// TAB COMPONENT
// ============================================================
const TabButton = ({ label, icon, active, onClick, badge }: { id: TabType; label: string; icon: string; active: boolean; onClick: () => void; badge?: string | number }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-3.5 py-2 text-[18px] font-semibold transition-all duration-150 whitespace-nowrap rounded-lg
      ${active
        ? "bg-[#EFF6FF] dark:bg-[#1E3A8A]/20 text-[#1D4ED8] dark:text-[#60A5FA] border border-[#BFDBFE] dark:border-[#1E3A8A]/40"
        : "text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#374151] dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5"
      }`}
  >
    <span className="text-[19px]">{icon}</span>
    <span>{label}</span>
    {badge != null && <span className="ml-1 rounded-full bg-[#3B82F6] text-white px-2 py-0.5 text-[14px] font-bold leading-none min-w-[18px] text-center">{badge}</span>}
  </button>
);

// ============================================================
// STAT CARD
// ============================================================
const StatCard = ({ label, children, color }: { label: string; children: React.ReactNode; color: string }) => {
  const colors: Record<string, string> = {
    orange: "bg-[#FFFBEB] dark:bg-[#7C2D12]/10 border-[#FDE68A] dark:border-[#7C2D12]/30",
    blue: "bg-[#EFF6FF] dark:bg-[#1E3A8A]/10 border-[#BFDBFE] dark:border-[#1E3A8A]/30",
    purple: "bg-[#F5F3FF] dark:bg-[#581C87]/10 border-[#DDD6FE] dark:border-[#581C87]/30",
    gray: "bg-white dark:bg-[#FFFFFF]/5 border-[#E5E7EB] dark:border-borderColor-dark",
  };
  return (
    <div className={`rounded-xl border p-4 text-center ${colors[color] ?? colors.gray}`}>
      <div className="text-xl font-semibold text-[#9CA3AF] dark:text-[#6B7280] mb-2  tracking-[0.1em]">{label}</div>
      {children}
    </div>
  );
};

// ============================================================
// ACTION FORMS
// ============================================================
const NoAnswerForm = ({ onSubmit, loading }: { onSubmit: (d: string, t: string, r: string) => void; loading: boolean }) => {
  const [date, setDate] = useState(tomorrowStr());
  const [time, setTime] = useState("");
  const [remark, setRemark] = useState("No answer – auto follow-up scheduled");
  return (
    <div className="rounded-xl border border-[#E5E7EB] dark:border-[#374151] bg-white dark:bg-[#111827]/60 overflow-visible relative z-30">
      <div className="flex items-center gap-3 px-4 py-3 bg-[#F9FAFB] dark:bg-[#1F2937]/60 border-b border-[#E5E7EB] dark:border-[#374151] rounded-t-xl">
        <div className="w-9 h-9 rounded-full bg-[#F3F4F6] dark:bg-[#374151] flex items-center justify-center text-base">📵</div>
        <div>
          <p className="text-[18px] font-bold text-[#111827] dark:text-white">No Answer</p>
          <p className="text-[16px] text-[#6B7280] dark:text-[#9CA3AF]">Schedule next follow-up automatically.</p>
        </div>
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-40">
        <div className="relative z-50">
          <Ainput title="Next Follow-up Date" type="date" name="date" redlabel="*" required labelClass="text-[18px]" className="!h-10 !text-[18px]"
            value={date} handleInputChange={(_, v) => setDate(v)} onInput={() => { }} />
        </div>
        <div className="relative z-40">
          <Ainput title="Preferred Time" type="time" name="time" labelClass="text-[18px]" className="!h-10 !text-[18px]"
            value={time} handleInputChange={(_, v) => setTime(v)} onInput={() => { }} redlabel="" />
        </div>
        <div className="relative z-30">
          <Ainput title="Remark" type="text" name="remark" labelClass="text-[18px]" className="!h-10 !text-[18px]"
            value={remark} handleInputChange={(_, v) => setRemark(v)} onInput={() => { }} redlabel="" />
        </div>
      </div>
      <div className="px-4 pb-4">
        <Button variant="save" onClick={() => onSubmit(date, time, remark)} disabled={loading}>
          {loading ? "Scheduling…" : "💾 Schedule Follow-up"}
        </Button>
      </div>
    </div>
  );
};

const CallLaterForm = ({ onSubmit, loading }: { onSubmit: (d: string, t: string, r: string) => void; loading: boolean }) => {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("16:00");
  const [remark, setRemark] = useState("Customer asked to call back");
  return (
    <div className="rounded-xl border border-[#BFDBFE] dark:border-[#1E40AF]/50 bg-white dark:bg-[#111827]/60 overflow-visible relative z-30">
      <div className="flex items-center gap-3 px-4 py-3 bg-[#EFF6FF] dark:bg-[#1E3A8A]/20 border-b border-[#BFDBFE] dark:border-[#1E40AF]/50 rounded-t-xl">
        <div className="w-9 h-9 rounded-full bg-[#BFDBFE] dark:bg-[#1E3A8A]/50 flex items-center justify-center text-base">📞</div>
        <div>
          <p className="text-[18px] font-bold text-[#1D4ED8] dark:text-[#60A5FA]">Call Later</p>
          <p className="text-[14px] text-[#3B82F6] dark:text-[#93C5FD]">Customer requested callback — set date & time.</p>
        </div>
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-40">
        <div className="relative z-50">
          <Ainput title="Call Back Date" type="date" name="date" redlabel="*" required labelClass="text-[18px]" className="!h-10 !text-[18px]"
            value={date} handleInputChange={(_, v) => setDate(v)} onInput={() => { }} />
        </div>
        <div className="relative z-40">
          <Ainput title="Call Back Time" type="time" name="time" labelClass="text-[18px]" className="!h-10 !text-[18px]"
            value={time} handleInputChange={(_, v) => setTime(v)} onInput={() => { }} redlabel="" />
        </div>
        <div className="relative z-30">
          <Ainput title="Remark" type="text" name="remark" labelClass="text-[18px]" className="!h-10 !text-[18px]"
            value={remark} handleInputChange={(_, v) => setRemark(v)} onInput={() => { }} redlabel="" />
        </div>
      </div>
      <div className="px-4 pb-4">
        <Button variant="save" onClick={() => onSubmit(date, time, remark)} disabled={loading}>
          {loading ? "Saving…" : "💾 Save & Set Reminder"}
        </Button>
      </div>
    </div>
  );
};

const AppointmentForm = ({ onSubmit, loading }: { onSubmit: (d: string, t: string, s: string, r: string) => void; loading: boolean }) => {
  const [date, setDate] = useState(todayStr());
  const [time, setTime] = useState("10:00");
  const [status, setStatus] = useState("CONFIRMED");
  const [remark, setRemark] = useState("");
  return (
    <div className="rounded-xl border border-[#FDE68A] dark:border-[#92400E]/50 bg-white dark:bg-[#111827]/60 overflow-visible relative z-30">
      <div className="flex items-center gap-3 px-4 py-3 bg-[#FFFBEB] dark:bg-[#78350F]/20 border-b border-[#FDE68A] dark:border-[#92400E]/50 rounded-t-xl">
        <div className="w-9 h-9 rounded-full bg-[#FDE68A] dark:bg-[#78350F]/50 flex items-center justify-center text-base">📅</div>
        <div>
          <p className="text-[18px] font-bold text-[#D97706] dark:text-[#FBBF24]">Book Appointment</p>
          <p className="text-[14px] text-[#B45309] dark:text-amber-400/70">Set date, time and confirm the appointment.</p>
        </div>
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative z-40">
        <div className="relative z-50">
          <Ainput title="Appointment Date" type="date" name="date" redlabel="*" required labelClass="text-[18px]" className="!h-10 !text-[18px]"
            value={date} handleInputChange={(_, v) => setDate(v)} onInput={() => { }} />
        </div>
        <div className="relative z-40">
          <Ainput title="Appointment Time" type="time" name="time" redlabel="*" required labelClass="text-[18px]" className="!h-10 !text-[18px]"
            value={time} handleInputChange={(_, v) => setTime(v)} onInput={() => { }} />
        </div>
        <div className="relative z-30">
          <CustomSelectSearch
            title="Status"
            name="status"
            selectedValue={status}
            handleInputChange={(_, val) => setStatus(val)}
            options={[
              { label: "CONFIRMED", value: "CONFIRMED" },
              { label: "PENDING", value: "PENDING" },
              { label: "CANCELLED", value: "CANCELLED" },
            ]}
            labelClass="text-[18px]"
          />
        </div>
        <div className="relative z-20">
          <Ainput title="Remark" type="text" name="remark" labelClass="text-[18px]" className="!h-10 !text-[18px]"
            value={remark} handleInputChange={(_, v) => setRemark(v)} onInput={() => { }} redlabel="" />
        </div>
      </div>
      <div className="px-4 pb-4">
        <Button variant="save" onClick={() => onSubmit(date, time, status, remark)} disabled={loading}>
          {loading ? "Saving…" : "📅 Book Appointment"}
        </Button>
      </div>
    </div>
  );
};

const CloseForm = ({ onSubmit, loading }: { onSubmit: (cs: string, cr: string, r: string) => void; loading: boolean }) => {
  const [callStatus, setCallStatus] = useState("CONNECTED");
  const [resp, setResp] = useState("NOT_INTERESTED");
  const [remark, setRemark] = useState("");
  return (
    <div className="rounded-xl border border-[#FECACA] dark:border-[#991B1B]/50 bg-white dark:bg-[#111827]/60 overflow-visible relative z-30">
      <div className="flex items-center gap-3 px-4 py-3 bg-[#FEF2F2] dark:bg-[#7F1D1D]/20 border-b border-[#FECACA] dark:border-[#991B1B]/50 rounded-t-xl">
        <div className="w-9 h-9 rounded-full bg-[#FECACA] dark:bg-[#7F1D1D]/50 flex items-center justify-center text-base">❌</div>
        <div>
          <p className="text-[18px] font-bold text-[#DC2626] dark:text-[#F87171]">Close Reminder</p>
          <p className="text-[14px] text-[#EF4444] dark:text-red-400/70">Permanently close this reminder — reason required.</p>
        </div>
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-40">
        <div className="relative z-50">
          <CustomSelectSearch
            title="Call Status"
            name="callStatus"
            selectedValue={callStatus}
            handleInputChange={(_, val) => setCallStatus(val)}
            options={[
              { label: "CONNECTED", value: "CONNECTED" },
              { label: "NO ANSWER", value: "NO_ANSWER" },
              { label: "WRONG NUMBER", value: "WRONG_NUMBER" },
              { label: "DND", value: "DND" },
              { label: "NOT REACHABLE", value: "NOT_REACHABLE" },
            ]}
            redlabel="*"
            labelClass="text-[18px]"
          />
        </div>
        <div className="relative z-40">
          <CustomSelectSearch
            title="Customer Response"
            name="resp"
            selectedValue={resp}
            handleInputChange={(_, val) => setResp(val)}
            options={[
              { label: "NOT INTERESTED", value: "NOT_INTERESTED" },
              { label: "ALREADY DONE OUTSIDE", value: "ALREADY_DONE_OUTSIDE" },
              { label: "AGREED", value: "AGREED" },
              { label: "CALL LATER", value: "CALL_LATER" },
            ]}
            redlabel="*"
            labelClass="text-[18px]"
          />
        </div>
        <div className="relative z-30">
          <Ainput title="Remark" type="text" name="remark" labelClass="text-[18px]" className="!h-10 !text-[18px]"
            value={remark} handleInputChange={(_, v) => setRemark(v)} onInput={() => { }} redlabel="" />
        </div>
      </div>
      <div className="px-4 pb-4">
        <Button variant="print" onClick={() => onSubmit(callStatus, resp, remark)} disabled={loading}>
          {loading ? "Closing…" : "❌ Close Reminder"}
        </Button>
      </div>
    </div>
  );
};

const CompleteForm = ({ onSubmit, loading, lastKM }: { onSubmit: (d: string, km: number, r: string) => void; loading: boolean; lastKM: number | null }) => {
  const [date, setDate] = useState(todayStr());
  const [km, setKm] = useState("");
  const [remark, setRemark] = useState("");
  return (
    <div className="rounded-xl border border-[#86EFAC] dark:border-[#14532D]/50 bg-white dark:bg-[#111827]/60 overflow-visible relative z-30">
      <div className="flex items-center gap-3 px-4 py-3 bg-[#F0FDF4] dark:bg-[#14532D]/20 border-b border-[#86EFAC] dark:border-[#14532D]/50 rounded-t-xl">
        <div className="w-9 h-9 rounded-full bg-[#86EFAC] dark:bg-[#14532D]/50 flex items-center justify-center text-base">✅</div>
        <div>
          <p className="text-[18px] font-bold text-[#15803D] dark:text-[#4ADE80]">Complete Service</p>
          {lastKM != null && <p className="text-[14px] text-[#16A34A] dark:text-green-400/70">Last KM: {fmtNum(lastKM)} — enter current KM.</p>}
        </div>
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-40">
        <div className="relative z-50">
          <Ainput title="Service Completed Date" type="date" name="date" redlabel="*" required labelClass="text-[18px]" className="!h-10 !text-[18px]"
            value={date} handleInputChange={(_, v) => setDate(v)} onInput={() => { }} />
        </div>
        <div className="relative z-40">
          <Ainput title="Completed KM" type="number" name="km" redlabel="*" required labelClass="text-[18px]" className="!h-10 !text-[18px]"
            value={km} handleInputChange={(_, v) => setKm(v)} onInput={() => { }} />
        </div>
        <div className="relative z-30">
          <Ainput title="Service Remark" type="text" name="remark" labelClass="text-[18px]" className="!h-10 !text-[18px]"
            value={remark} handleInputChange={(_, v) => setRemark(v)} onInput={() => { }} redlabel="" />
        </div>
      </div>
      <div className="px-4 pb-4">
        <Button variant="save" onClick={() => onSubmit(date, Number(km), remark)} disabled={loading}>
          {loading ? "Completing…" : "✅ Mark Service Complete"}
        </Button>
      </div>
    </div>
  );
};

// ============================================================
// ✅ TRANSCRIPT VIEWER (chat-bubble style, handles array of turns)
// ============================================================
const TranscriptViewer = ({ turns }: { turns: TranscriptTurn[] }) => {
  const fmtTime = (ts: number) => {
    try {
      if (!ts) return "";
      // timestamps are unix seconds (may have decimals)
      const d = new Date(ts * 1000);
      if (isNaN(d.getTime())) return "";
      return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
      return "";
    }
  };

  const cleanText = (t: string) => (t ?? "").replace(/`/g, "");

  if (!turns || turns.length === 0) {
    return <p className="text-[16px] text-[#9CA3AF] text-center py-4">No transcript turns available.</p>;
  }

  return (
    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
      {turns.map((t, i) => {
        const isBot = t.sender === "bot";
        return (
          <div key={i} className={`flex ${isBot ? "justify-start" : "justify-end"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-[18px] leading-relaxed shadow-sm
                ${isBot
                  ? "bg-[#DBEAFE] dark:bg-[#1E3A8A]/30 text-[#1E3A8A] dark:text-[#DBEAFE] rounded-tl-sm"
                  : "bg-[#DCFCE7] dark:bg-[#14532D]/30 text-[#14532D] dark:text-[#DCFCE7] rounded-tr-sm"
                }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[9px] font-bold uppercase opacity-70">
                  {isBot ? "🤖 Bot" : "🧑 Customer"}
                </span>
                {t.timestamp ? <span className="text-[9px] opacity-50">{fmtTime(t.timestamp)}</span> : null}
              </div>
              <p className="whitespace-pre-wrap">{cleanText(t.text)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const transcriptToPlainText = (turns: TranscriptTurn[] | null): string => {
  if (!turns || turns.length === 0) return "";
  return turns
    .map((t) => `${t.sender === "bot" ? "Bot" : "Customer"}: ${(t.text ?? "").replace(/`/g, "")}`)
    .join("\n");
};

// ============================================================
// ✅ AI CALL TAB COMPONENT
// ============================================================
const AICallTab = ({
  detail,
  headers,
}: {
  detail: ReminderRow;
  headers: Record<string, string>;
}) => {
  const [callLoading, setCallLoading] = useState(false);
  const [histLoading, setHistLoading] = useState(false);
  const [callHistory, setCallHistory] = useState<CallHistory[]>([]);
  const [histFetched, setHistFetched] = useState(false);
  const [scriptOpen, setScriptOpen] = useState<string | null>(null); // callId of open transcript
  const [lastCallResp, setLastCallResp] = useState<any>(null);

  // ── Fetch call history ──────────────────────────────────
  const fetchHistory = async () => {
    try {
      setHistLoading(true);
      const res = await axios.post(
        API.callHist,
        {
          reminder_utd: detail.UTD,
          mobile_number: detail.Cust_Mob,
          vehicle_number: detail.Veh_Reg_No,
        },
        { headers }
      );

      const body = res.data;
      const rawRecords = extractCallRecords(body);
      const list: CallHistory[] = rawRecords.map(normalizeCall);

      // latest call first
      list.sort((a, b) => {
        const ta = a.startTime ? new Date(a.startTime).getTime() : 0;
        const tb = b.startTime ? new Date(b.startTime).getTime() : 0;
        return tb - ta;
      });

      setCallHistory(list);
      setHistFetched(true);

      if (list.length === 0) {
        showToast("No call history found for this reminder", "info");
      }
    } catch (e: any) {
      showToast(e?.response?.data?.message ?? "No call recording available for this reminder", "error");
      setHistFetched(true);
    } finally {
      setHistLoading(false);
    }
  };

  // ── Trigger AI call ─────────────────────────────────────
  // ── Theme Detection Helper ────────────────────────────────
  const isDarkMode = (): boolean => {
    if (document.documentElement.classList.contains("dark")) return true;
    if (document.documentElement.getAttribute("data-theme") === "dark") return true;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  };

  // ── Theme Tokens ───────────────────────────────────────────
  const getTheme = (dark: boolean) => ({
    popupBg: dark ? "#1e2432" : "#ffffff",
    popupText: dark ? "#e2e8f0" : "#1e293b",
    cardBg: dark ? "#141824" : "#f8fafc",
    cardBorder: dark ? "#2d3548" : "#e2e8f0",
    rowAltBg: dark ? "#1a2030" : "#f1f5f9",
    labelColor: dark ? "#94a3b8" : "#64748b",
    valueColor: dark ? "#f1f5f9" : "#1e293b",
    badgeBg: dark ? "#1e3a8a33" : "#dbeafe",
    badgeText: dark ? "#93c5fd" : "#1d4ed8",
    infoBoxBg: dark ? "#1e3a5f33" : "#eff6ff",
    infoBoxText: dark ? "#93c5fd" : "#1e40af",
    infoBoxBorder: dark ? "#3b82f6" : "#3b82f6",
    spinnerTrack: dark ? "#2d3548" : "#dbeafe",
    spinnerHead: "#3b82f6",
    successBg: dark ? "#14532d33" : "#dcfce7",
    successBoxBg: dark ? "#14532d26" : "#f0fdf4",
    successBoxBorder: dark ? "#166534" : "#bbf7d0",
    successBoxText: dark ? "#86efac" : "#166534",
    errorBg: dark ? "#7f1d1d33" : "#fee2e2",
    mutedText: dark ? "#94a3b8" : "#64748b",
    cancelBg: dark ? "#2d3548" : "#f1f5f9",
    cancelText: dark ? "#cbd5e1" : "#475569",
    shadow: dark
      ? "0 20px 60px rgba(0,0,0,0.5)"
      : "0 20px 60px rgba(0,0,0,0.15)",
  });

  const triggerCall = async () => {
    const dark = isDarkMode();
    const t = getTheme(dark);

    const confirm = await Swal.fire({
      title: "Trigger AI Call?",
      html: `
      <div style="
        background: ${t.cardBg};
        border: 1px solid ${t.cardBorder};
        border-radius: 12px;
        padding: 16px;
        text-align: left;
        font-family: inherit;
        margin-top: 8px;
      ">
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <tr>
            <td style="padding:8px 12px;color:${t.labelColor};font-weight:600;width:38%;white-space:nowrap;">👤 Customer</td>
            <td style="padding:8px 12px;color:${t.valueColor};font-weight:500;">${detail.Cust_Name || "—"}</td>
          </tr>
          <tr style="background:${t.rowAltBg};border-radius:8px;">
            <td style="padding:8px 12px;color:${t.labelColor};font-weight:600;">📱 Mobile</td>
            <td style="padding:8px 12px;color:${t.valueColor};font-weight:500;letter-spacing:0.5px;">${detail.Cust_Mob || "—"}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;color:${t.labelColor};font-weight:600;">🚗 Vehicle</td>
            <td style="padding:8px 12px;color:${t.valueColor};font-weight:500;">${detail.Veh_Reg_No || "—"}</td>
          </tr>
          <tr style="background:${t.rowAltBg};">
            <td style="padding:8px 12px;color:${t.labelColor};font-weight:600;">🏷️ Model</td>
            <td style="padding:8px 12px;color:${t.valueColor};font-weight:500;">${detail.Model_Name || "—"}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;color:${t.labelColor};font-weight:600;">🔖 Reminder</td>
            <td style="padding:8px 12px;">
              <span style="
                background: ${t.badgeBg};
                color: ${t.badgeText};
                font-size: 12px;
                font-weight: 700;
                padding: 2px 10px;
                border-radius: 20px;
                letter-spacing: 0.3px;
              ">#${detail.UTD}</span>
            </td>
          </tr>
        </table>

        <div style="
          margin-top: 14px;
          padding: 10px 14px;
          background: ${t.infoBoxBg};
          border-left: 3px solid ${t.infoBoxBorder};
          border-radius: 6px;
          font-size: 12px;
          color: ${t.infoBoxText};
          display: flex;
          align-items: center;
          gap: 6px;
        ">
          🤖 An AI agent will call this customer center now.
        </div>
      </div>
    `,
      icon: undefined,
      width: 420,
      padding: "20px",
      background: t.popupBg,
      color: t.popupText,
      showCancelButton: true,
      confirmButtonText: "📞 Call Now",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#2563EB",
      cancelButtonColor: t.cancelBg,
      reverseButtons: false,
      customClass: {
        popup: "swal-ai-call-popup",
        title: "swal-ai-call-title",
        actions: "swal-ai-call-actions",
        confirmButton: "swal-ai-call-confirm",
        cancelButton: "swal-ai-call-cancel",
      },
      didOpen: (popup) => {
        const title = popup.querySelector(".swal-ai-call-title") as HTMLElement;
        if (title) {
          title.style.cssText = `
          font-size: 18px;
          font-weight: 700;
          color: ${t.popupText};
          padding-bottom: 0;
        `;
        }

        const popupEl = popup.querySelector(".swal-ai-call-popup") as HTMLElement;
        if (popupEl) {
          popupEl.style.cssText += `
          border-radius: 16px;
          box-shadow: ${t.shadow};
        `;
        }

        const actions = popup.querySelector(".swal-ai-call-actions") as HTMLElement;
        if (actions) {
          actions.style.cssText = `gap: 10px; margin-top: 4px;`;
        }

        const confirmBtn = popup.querySelector(".swal-ai-call-confirm") as HTMLElement;
        if (confirmBtn) {
          confirmBtn.style.cssText = `
          background: #2563eb;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          padding: 10px 22px;
          box-shadow: 0 2px 8px rgba(37,99,235,0.35);
          transition: transform 0.15s ease;
        `;
          confirmBtn.onmouseenter = () => (confirmBtn.style.transform = "translateY(-1px)");
          confirmBtn.onmouseleave = () => (confirmBtn.style.transform = "translateY(0)");
        }

        const cancelBtn = popup.querySelector(".swal-ai-call-cancel") as HTMLElement;
        if (cancelBtn) {
          cancelBtn.style.cssText = `
          background: ${t.cancelBg};
          color: ${t.cancelText};
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          padding: 10px 22px;
          box-shadow: none;
          transition: transform 0.15s ease;
        `;
          cancelBtn.onmouseenter = () => (cancelBtn.style.transform = "translateY(-1px)");
          cancelBtn.onmouseleave = () => (cancelBtn.style.transform = "translateY(0)");
        }
      },
    });

    if (!confirm.isConfirmed) return;

    // ── Loading Alert ──────────────────────────────────────────
    Swal.fire({
      title: "Connecting...",
      html: `
      <div style="display:flex;flex-direction:column;align-items:center;gap:12px;padding:10px 0;">
        <div style="
          width: 52px;
          height: 52px;
          border: 4px solid ${t.spinnerTrack};
          border-top: 4px solid ${t.spinnerHead};
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        "></div>
        <p style="margin:0;font-size:13px;color:${t.mutedText};">
          Triggering AI call for
          <b style="color:${t.valueColor}">${detail.Cust_Name}</b>
        </p>
      </div>
      <style>
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      </style>
    `,
      width: 340,
      padding: "24px",
      background: t.popupBg,
      color: t.popupText,
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      customClass: { popup: "swal-loading-popup" },
      didOpen: (popup) => {
        const popupEl = popup.querySelector(".swal-loading-popup") as HTMLElement;
        if (popupEl) popupEl.style.cssText += `border-radius:16px; box-shadow:${t.shadow};`;
      },
    });

    try {
      setCallLoading(true);

      const res = await axios.post(
        API.aiCall,
        { reminder_utd: detail.UTD },
        { headers }
      );

      setLastCallResp(res.data);

      // ── Success Alert ───────────────────────────────────────
      await Swal.fire({
        title: "Call Triggered!",
        html: `
        <div style="display:flex;flex-direction:column;align-items:center;gap:10px;padding:6px 0;">
          <div style="
            width: 56px;
            height: 56px;
            background: ${t.successBg};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 26px;
          ">📞</div>
          <p style="margin:0;font-size:14px;color:${t.mutedText};text-align:center;">
            AI call successfully triggered to<br/>
            <b style="color:${t.valueColor};font-size:15px">${detail.Cust_Mob}</b>
          </p>
          <div style="
            background: ${t.successBoxBg};
            border: 1px solid ${t.successBoxBorder};
            border-radius: 8px;
            padding: 8px 16px;
            font-size: 12px;
            color: ${t.successBoxText};
          ">
            Call ID: ${res.data?.reminder?.callId || res.data?.reminder?.AI_Call_ID || "—"}
          </div>
        </div>
      `,
        icon: undefined,
        width: 360,
        padding: "24px",
        background: t.popupBg,
        color: t.popupText,
        confirmButtonText: "OK",
        confirmButtonColor: "#16a34a",
        customClass: {
          popup: "swal-success-popup",
          title: "swal-success-title",
          confirmButton: "swal-success-confirm",
        },
        didOpen: (popup) => {
          const title = popup.querySelector(".swal-success-title") as HTMLElement;
          if (title) title.style.cssText = `font-size:18px;font-weight:700;color:${t.popupText};`;

          const popupEl = popup.querySelector(".swal-success-popup") as HTMLElement;
          if (popupEl) popupEl.style.cssText += `border-radius:16px; box-shadow:${t.shadow};`;

          const confirmBtn = popup.querySelector(".swal-success-confirm") as HTMLElement;
          if (confirmBtn) {
            confirmBtn.style.cssText = `
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            padding: 10px 28px;
            box-shadow: 0 2px 8px rgba(22,163,74,0.35);
          `;
          }
        },
      });

      setTimeout(() => fetchHistory(), 3000);

    } catch (e: any) {
      const msg = e?.response?.data?.message ?? "AI call could not be triggered";
      setLastCallResp(e?.response?.data ?? null);

      // ── Error Alert ─────────────────────────────────────────
      await Swal.fire({
        title: "Call Failed",
        html: `
        <div style="display:flex;flex-direction:column;align-items:center;gap:10px;padding:6px 0;">
          <div style="
            width: 56px;
            height: 56px;
            background: ${t.errorBg};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 26px;
          ">❌</div>
          <p style="margin:0;font-size:13px;color:${t.mutedText};text-align:center;">
            ${msg}
          </p>
        </div>
      `,
        icon: undefined,
        width: 360,
        padding: "24px",
        background: t.popupBg,
        color: t.popupText,
        confirmButtonText: "Close",
        confirmButtonColor: "#dc2626",
        customClass: {
          popup: "swal-error-popup",
          title: "swal-error-title",
          confirmButton: "swal-error-confirm",
        },
        didOpen: (popup) => {
          const title = popup.querySelector(".swal-error-title") as HTMLElement;
          if (title) title.style.cssText = `font-size:18px;font-weight:700;color:${t.popupText};`;

          const popupEl = popup.querySelector(".swal-error-popup") as HTMLElement;
          if (popupEl) popupEl.style.cssText += `border-radius:16px; box-shadow:${t.shadow};`;

          const confirmBtn = popup.querySelector(".swal-error-confirm") as HTMLElement;
          if (confirmBtn) {
            confirmBtn.style.cssText = `
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            padding: 10px 28px;
            box-shadow: 0 2px 8px rgba(220,38,38,0.35);
          `;
          }
        },
      });

    } finally {
      setCallLoading(false);
    }
  };

  // ── Format seconds ──────────────────────────────────────
  const fmtDuration = (sec: number | null) => {
    if (sec == null) return "—";
    const m = Math.floor(sec / 60), s = sec % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  return (
    <div className="space-y-5">

      {/* ── Customer Info Card ── */}
      <div className="rounded-xl border border-[#DBEAFE] dark:border-[#1E3A8A]/30 bg-[#EFF6FF] dark:bg-[#1E3A8A]/10 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <SectionTitle title="AI Call Details" icon="🤖" />
            <div className="grid grid-cols-2 gap-x-8 gap-y-1">
              <div className="text-[18px] text-[#6B7280] dark:text-[#9CA3AF]">Customer <span className="font-semibold text-[#1F2937] dark:text-white ml-1">{detail.Cust_Name}</span></div>
              <div className="text-[18px] text-[#6B7280] dark:text-[#9CA3AF]">Mobile <span className="font-semibold text-[#1F2937] dark:text-white ml-1">{detail.Cust_Mob}</span></div>
              <div className="text-[18px] text-[#6B7280] dark:text-[#9CA3AF]">Vehicle <span className="font-semibold text-blue-600 dark:text-blue-400 ml-1 font-mono">{detail.Veh_Reg_No}</span></div>
              <div className="text-[18px] text-[#6B7280] dark:text-[#9CA3AF]">Model <span className="font-semibold text-[#1F2937] dark:text-white ml-1">{detail.Model_Name}</span></div>
              {detail.AI_Call_ID && (
                <div className="text-[18px] text-[#6B7280] dark:text-[#9CA3AF] col-span-2">
                  Last Call ID <span className="font-mono text-[18px] bg-gray-100 dark:bg-[#1F2937] px-1.5 py-0.5 rounded ml-1 text-gray-700 dark:text-gray-300">{detail.AI_Call_ID}</span>
                </div>
              )}
            </div>
          </div>

          {/* ── CALL BUTTON ── */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <button
              onClick={triggerCall}
              disabled={callLoading || detail.Service_Status === "COMPLETED"}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-[16px] shadow-lg transition-all duration-200
    ${detail.Service_Status === "COMPLETED"
                  ? "bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed dark:bg-[#1F2937]"
                  : callLoading
                    ? "bg-[#60A5FA] text-white cursor-wait animate-pulse"
                    : "bg-[#2563EB] hover:bg-[#1D4ED8] text-white hover:shadow-lg hover:scale-105 active:scale-95"
                }`}
            >
              {callLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Calling...
                </>
              ) : (
                <>📞 Trigger AI Call</>
              )}
            </button>
            {detail.Service_Status === "COMPLETED" && (
              <p className="text-[16px] text-[#9CA3AF]">Service completed — call disabled</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Last Call Response ── */}
      {lastCallResp && (
        <div className={`rounded-xl border p-4 ${lastCallResp?.success === false ? "border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10" : "border-green-200 dark:border-[#14532D]/40 bg-green-50 dark:bg-[#14532D]/10"}`}>
          <SectionTitle title="Last Call Response" icon={lastCallResp?.success === false ? "❌" : "✅"} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            {lastCallResp?.reminder?.callId && (
              <InfoRow label="Call ID" value={<span className="font-mono text-[16px] bg-white dark:bg-[#1F2937] px-1.5 py-0.5 rounded">{lastCallResp.reminder.callId}</span>} />
            )}
            {lastCallResp?.reminder?.AI_Call_ID && (
              <InfoRow label="AI Call ID" value={<span className="font-mono text-[16px] bg-white dark:bg-[#1F2937] px-1.5 py-0.5 rounded">{lastCallResp.reminder.AI_Call_ID}</span>} />
            )}
            {lastCallResp?.reminder?.Call_Triggered_To && (
              <InfoRow label="Called To" value={lastCallResp.reminder.Call_Triggered_To} />
            )}
            {lastCallResp?.message && (
              <InfoRow label="Message" value={lastCallResp.message} />
            )}
          </div>
        </div>
      )}

      {/* ── Call History Section ── */}
      <div className="rounded-xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-white/5 p-4">
        <div className="flex items-center justify-between mb-3">
          <SectionTitle title="Call History" icon="📋" />
          <button
            onClick={fetchHistory}
            disabled={histLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[20px] font-semibold rounded-lg bg-gray-100 dark:bg-[#1F2937] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {histLoading ? (
              <><div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />Loading…</>
            ) : (
              <>🔄 {histFetched ? "Refresh" : "Load History"}</>
            )}
          </button>
        </div>

        {!histFetched ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 rounded-xl border border-dashed border-[#E5E7EB] dark:border-[#374151]">
            <span className="text-3xl">📞</span>
            <p className="text-[16px] text-[#9CA3AF]">Click &quot;Load History&quot; to fetch call records</p>
          </div>
        ) : histLoading ? (
          <div className="flex items-center justify-center py-10 gap-3">
            <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-[16px] text-[#9CA3AF]">Loading call history…</span>
          </div>
        ) : callHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 rounded-xl border border-dashed border-[#E5E7EB] dark:border-[#374151]">
            <span className="text-3xl">🔍</span>
            <p className="text-[16px] text-[#9CA3AF]">No call history found for this reminder</p>
          </div>
        ) : (
          <div className="space-y-3">
            {callHistory.map((call, idx) => {
              const key = call.callId ?? `idx-${idx}`;
              const hasTranscript = Array.isArray(call.transcript) && call.transcript.length > 0;
              return (
                <div
                  key={key}
                  className="rounded-xl border border-[#E5E7EB] dark:border-[#1E293B] bg-[#F9FAFB] dark:bg-black/20 overflow-hidden"
                >
                  {/* Call Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 border-b border-[#E5E7EB] dark:border-[#1E293B]">
                    <div className="flex flex-wrap items-center gap-2">
                      <CallStatusBadge status={call.status} />
                      {/* <span className="font-mono text-[16px] text-[#6B7280] dark:text-[#9CA3AF] bg-white dark:bg-[#1F2937] px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700">
                        {call.callId ?? "—"}
                      </span> */}
                      <span className="text-[18px] text-[#6B7280] dark:text-[#9CA3AF]">📱 {call.phoneNumber}</span>
                      {/* {call.category && (
                        <span className="text-[16px] font-semibold px-2 py-0.5 rounded-full bg-[#FAF5FF] dark:bg-[#581C87]/20 text-[#9333EA] dark:text-[#D8B4FE] border border-[#E9D5FF] dark:border-[#6B21A8]">
                          🏷️ {call.category}
                        </span>
                      )} */}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[18px] text-[#6B7280] dark:text-[#9CA3AF]">
                      {call.duration != null && <span>⏱️ {fmtDuration(call.duration)}</span>}
                      {call.startTime && <span>🕐 {new Date(call.startTime).toLocaleString("en-IN")}</span>}
                      {/* View Transcript Button */}
                      {hasTranscript && (
                        <Button
                          onClick={() => setScriptOpen(scriptOpen === key ? null : key)}
                          variant="outline"
                        // className="flex items-center gap-1 px-2.5 py-1 text-[16px] font-semibold rounded-lg bg-[#F3E8FF] dark:bg-[#581C87]/30 text-[#7E22CE] dark:text-[#D8B4FE] border border-[#E9D5FF] dark:border-[#6B21A8] hover:bg-[#E9D5FF] dark:hover:bg-[#581C87]/50 transition-colors"
                        >
                          📜 {scriptOpen === key ? "Hide" : "View"} Script
                        </Button>
                      )}
                      {call.recordingUrl && (
                        <a href={call.recordingUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1 text-[16px] font-semibold rounded-lg bg-[#DCFCE7] dark:bg-[#14532D]/30 text-[#15803D] dark:text-[#86EFAC] border border-[#BBF7D0] dark:border-[#166534] hover:bg-[#BBF7D0] transition-colors">
                          🎙️ Recording
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Call Details Grid */}
                  <div className="px-4 py-3 grid ">
                    {call.summary && <InfoRow label="Summary" value={call.summary} />}
                    {call.endTime && <InfoRow label="End Time" value={new Date(call.endTime).toLocaleString("en-IN")} />}
                  </div>

                  {/* ✅ Transcript / Script Viewer */}
                  {scriptOpen === key && hasTranscript && (
                    <div className="border-t border-[#F3E8FF] dark:border-[#581C87]/40 bg-[#FAF5FF] dark:bg-[#581C87]/10 px-4 py-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[16px]">📜</span>
                          <h4 className="text-[18px] font-bold uppercase tracking-widest text-[#7E22CE] dark:text-[#D8B4FE]">Call Transcript / Script</h4>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(transcriptToPlainText(call.transcript));
                            showToast("Transcript copied!", "success");
                          }}
                          className="text-[16px] px-2 py-1 rounded bg-white dark:bg-[#1F2937] border border-gray-200 dark:border-gray-700 text-[#6B7280] dark:text-gray-300 hover:bg-gray-100 transition-colors"
                        >
                          📋 Copy
                        </button>
                      </div>
                      <div className="rounded-lg bg-white dark:bg-[#111827] border border-[#E9D5FF] dark:border-[#6B21A8] p-3">
                        <TranscriptViewer turns={call.transcript as TranscriptTurn[]} />
                      </div>
                    </div>
                  )}


                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// DETAIL MODAL
// ============================================================
const DetailModal = ({
  detail, detailLoading, activeAction, actionLoading,
  onClose, onSetAction, onNoAnswer, onCallLater,
  onAppointment, onClose2, onComplete, headers,
  onOpenCallHistory,
}: {
  detail: ReminderRow | null;
  detailLoading: boolean;
  activeAction: ActionType;
  actionLoading: boolean;
  onClose: () => void;
  onSetAction: (a: ActionType) => void;
  onNoAnswer: (d: string, t: string, r: string) => void;
  onCallLater: (d: string, t: string, r: string) => void;
  onAppointment: (d: string, t: string, s: string, r: string) => void;
  onClose2: (cs: string, cr: string, r: string) => void;
  onComplete: (d: string, km: number, r: string) => void;
  headers: Record<string, string>;
  onOpenCallHistory?: (vehNo: string) => void;
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("info");
  const isCompleted = detail?.Service_Status === "COMPLETED";

  useEffect(() => {
    setActiveTab("info");
    onSetAction("NONE");
  }, [detail?.UTD]); // eslint-disable-line

  const handleTabChange = (id: TabType) => {
    setActiveTab(id);
    if (id === "call") onSetAction("NO_ANSWER");
    else if (id === "appointment") onSetAction("APPOINTMENT");
    else if (id === "service") onSetAction(isCompleted ? "NONE" : "COMPLETE");
    else onSetAction("NONE");
  };

  const handleAllHistoryClick = () => {
    if (!detail?.Veh_Reg_No) return;
    onOpenCallHistory?.(detail.Veh_Reg_No);
  };

  const barColor = isCompleted
    ? "bg-green-500"
    : detail?.Due_Status === "OVERDUE"
      ? "bg-[#EF4444]"
      : detail?.Due_Status === "DUE_TODAY"
        ? "bg-yellow-500"
        : "bg-[#EFF6FF]0";

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-2 md:p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog" aria-modal="true"
    >
      <div className="w-full h-[100dvh] sm:h-auto sm:max-h-[99vh] md:max-h-[96vh] md:max-w-7xl flex flex-col overflow-hidden rounded-none sm:rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] shadow-2xl animate-in fade-in zoom-in-95 duration-200">

        {/* HEADER — always dark navy (matches screenshots) */}
        <div className="flex items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4 bg-[#0F172A] shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[20px] sm:text-base font-bold text-white truncate max-w-[58vw] sm:max-w-none tracking-wide">{detail?.Veh_Reg_No ?? "—"}</h2>
                <span className="text-[18px] sm:text-[16px] text-[#94A3B8] font-normal truncate">{detail?.Model_Name}</span>
                {detail?.Due_Status && <DueBadge status={detail.Due_Status} />}
                {detail?.Reminder_Status && <ReminderStatusBadge status={detail.Reminder_Status} />}
              </div>
              <p className="text-[16px] sm:text-[18px] text-[#94A3B8] mt-1 truncate flex items-center gap-2">
                <span>👤 {detail?.Cust_Name}</span>
                <span>📞 {detail?.Cust_Mob}</span>
                <span>📍 {detail?.Loc_Name}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="ml-3 w-8 h-8 shrink-0 flex items-center justify-center rounded-full bg-white/10 hover:bg-red-500/20 text-white hover:text-red-400 text-[16px] font-bold transition-all duration-150"
            aria-label="Close"
          >✕</button>
        </div>

        {/* TABS */}
        <div className="flex justify-between gap-1 border-b border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] overflow-x-auto shrink-0 px-2 py-1.5 sm:px-3 sm:py-2 sticky top-[60px] sm:top-[unset] z-10">
          <div className="flex gap-1 overflow-x-auto">
            {(
              [
                { id: "info", label: "Overview", icon: "📋" },
                { id: "aicall", label: "AI Call", icon: "🤖", badge: detail?.AI_Call_ID ? "✓" : undefined },
                { id: "call", label: "Call/Followup", icon: "📞", badge: detail?.Reminder_Count || undefined },
                { id: "appointment", label: "Appointment", icon: "🗓️" },
                { id: "service", label: "Service", icon: "🔧" },

              ] as { id: TabType; label: string; icon: string; badge?: string | number }[]
            ).map(t => (
              <TabButton key={t.id} id={t.id} label={t.label} icon={t.icon} active={activeTab === t.id} onClick={() => handleTabChange(t.id)} badge={t.badge} />
            ))}
          </div>
          <div>
            <Button
              variant="outline"
              onClick={handleAllHistoryClick}
              disabled={!detail?.Veh_Reg_No}
              className="text-[18px] font-semibold h-auto py-1.5 px-4"
            >
              All Call History
            </Button>
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 sm:py-5 pb-[max(1rem,env(safe-area-inset-bottom))] bg-[#F8FAFC] dark:bg-[#0F172A]">
          {detailLoading ? (
            <div className="flex items-center justify-center h-52 gap-3">
              <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-[16px] text-[#9CA3AF]">Loading details…</span>
            </div>
          ) : !detail ? (
            <div className="flex items-center justify-center h-52"><div className="text-center"><div className="text-4xl mb-2">🔍</div><p className="text-[16px] text-[#9CA3AF]">No data found.</p></div></div>
          ) : (
            <div className="space-y-4 sm:space-y-5">

              {/* ── INFO TAB ── */}
              {activeTab === "info" && (
                <div className="space-y-4">
                  {/* Stat Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard label="Reminder Status" color="orange">
                      <ReminderStatusBadge status={detail.Reminder_Status} />
                    </StatCard>
                    <StatCard label="Reminder Count" color="blue">
                      <span className="text-2xl sm:text-3xl font-bold text-[#2563EB] dark:text-[#60A5FA]">{detail.Reminder_Count ?? 0}</span>
                    </StatCard>
                    <StatCard label="Days Until Due" color="purple">
                      {detail.Days_Until_Due == null
                        ? <span className="text-lg font-bold text-[#9CA3AF]">—</span>
                        : detail.Days_Until_Due < 0
                          ? <span className="text-[18px] font-bold text-[#EF4444]">{Math.abs(detail.Days_Until_Due)}d overdue</span>
                          : detail.Days_Until_Due === 0
                            ? <span className="text-[18px] font-bold text-[#EAB308]">Today!</span>
                            : <span className="text-[18px] font-bold text-[#16A34A] dark:text-[#4ADE80]">{detail.Days_Until_Due}d</span>}
                    </StatCard>
                    <StatCard label="Last Reminded" color="gray">
                      <span className="text-[18px] font-bold text-[#374151] dark:text-white">
                        {detail.Last_Reminder_At ? new Date(detail.Last_Reminder_At).toLocaleDateString("en-IN") : "Never"}
                      </span>
                    </StatCard>
                  </div>

                  {/* Info Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="rounded-xl border border-[#E5E7EB] dark:border-[#1E293B] p-4 bg-white dark:bg-[#111827]/60">
                      <SectionTitle title="Vehicle & Customer" icon="🚗" />
                      <InfoRow label="Reg No" value={<span className="text-[#2563EB] dark:text-[#60A5FA] font-mono font-bold">{detail.Veh_Reg_No}</span>} highlight />
                      <InfoRow label="Customer" value={detail.Cust_Name} />
                      <InfoRow label="Mobile" value={detail.Cust_Mob} />
                      <InfoRow label="Model" value={detail.Model_Name} />
                      <InfoRow label="Location" value={detail.Loc_Name} />
                    </div>
                    <div className="rounded-xl border border-[#E5E7EB] dark:border-[#1E293B] p-4 bg-white dark:bg-[#111827]/60">
                      <SectionTitle title="Service Info" icon="🔧" />
                      <InfoRow label="Last Svc Date" value={fmtDate(detail.Last_Service_Date)} />
                      <InfoRow label="Last Svc KM" value={fmtNum(detail.Last_Service_KM)} />
                      <InfoRow label="Next Svc KM" value={<span className="text-[#2563EB] dark:text-[#60A5FA] font-bold">{fmtNum(detail.Next_Service_KM)}</span>} highlight />
                      <InfoRow label="Avg Daily KM" value={fmtNum(detail.Avg_Daily_KM)} />
                      <InfoRow label="KM Interval" value={fmtNum(detail.KM_Interval)} />
                    </div>
                    <div className="rounded-xl border border-[#E5E7EB] dark:border-[#1E293B] p-4 bg-white dark:bg-[#111827]/60">
                      <SectionTitle title="Due Dates" icon="📅" />
                      <InfoRow label="KM-Based Due" value={fmtDate(detail.KM_Based_Due_Date)} />
                      <InfoRow label="Final Due Date" value={<span className="text-[#2563EB] dark:text-[#60A5FA] font-bold">{fmtDate(detail.Final_Due_Date)}</span>} highlight />
                      <InfoRow label="Reminder Date" value={fmtDate(detail.Reminder_Date)} />
                      <InfoRow label="Based On" value={detail.Final_Due_Based_On ?? "—"} />
                      {detail.AI_Call_ID && <InfoRow label="Last AI Call ID" value={<span className="font-mono text-[16px] bg-[#EFF6FF] dark:bg-[#1E3A8A]/20 px-1.5 py-0.5 rounded text-[#2563EB] dark:text-blue-300">{detail.AI_Call_ID}</span>} />}
                    </div>
                  </div>

                  {/* Footer timestamps */}
                  <div className="flex flex-wrap gap-x-6 gap-y-1 pt-2 border-t border-[#E5E7EB] dark:border-[#1E293B]">
                    <span className="text-[18px] text-[#9CA3AF]">Created by <b className="text-[#6B7280] dark:text-gray-300">{detail.Created_By ?? "—"}</b>{detail.Created_At && <> · {detail.Created_At}</>}</span>
                    {detail.Updated_At && <span className="text-[18px] text-[#9CA3AF]">Updated by <b className="text-[#6B7280] dark:text-gray-300">{detail.Updated_By ?? "—"}</b> · {detail.Updated_At}</span>}
                  </div>
                </div>
              )}


              {/* ── CALL TAB ── */}
              {activeTab === "call" && (
                <div className="space-y-4">
                  {/* Last Call Info */}
                  <div className="rounded-xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827]/60 overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 bg-[#F9FAFB] dark:bg-[#1F2937]/50 border-b border-[#E5E7EB] dark:border-[#1E293B]">
                      <span className="text-[16px]">📞</span>
                      <h3 className="text-[18px] font-bold uppercase tracking-widest text-[#6B7280] dark:text-[#9CA3AF]">Last Call Info</h3>
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-8">
                      <InfoRow label="Call Status" value={detail.Call_Status} />
                      <InfoRow label="Customer Response" value={detail.Customer_Response} />
                      <InfoRow label="Contacted By" value={detail.Contacted_By} />
                      <InfoRow label="KM Verified" value={fmtNum(detail.Current_KM_Verified)} />
                      <InfoRow label="Followup Date" value={fmtDate(detail.Followup_Date)} highlight />
                      <InfoRow label="Followup Remark" value={detail.Followup_Remark} />
                    </div>
                  </div>

                  {/* Actions */}
                  {!isCompleted ? (
                    <div className="space-y-3">
                      <SectionTitle title="Actions" icon="⚡" />
                      <div className="flex flex-wrap gap-2">
                        <ActionBtn label="📵 No Answer" color="gray" active={activeAction === "NO_ANSWER"} onClick={() => onSetAction(activeAction === "NO_ANSWER" ? "NONE" : "NO_ANSWER")} disabled={actionLoading} />
                        <ActionBtn label="📞 Call Later" color="blue" active={activeAction === "CALL_LATER"} onClick={() => onSetAction(activeAction === "CALL_LATER" ? "NONE" : "CALL_LATER")} disabled={actionLoading} />
                        <ActionBtn label="❌ Close" color="red" active={activeAction === "CLOSE"} onClick={() => onSetAction(activeAction === "CLOSE" ? "NONE" : "CLOSE")} disabled={actionLoading} />
                      </div>
                      {activeAction === "NO_ANSWER" && <NoAnswerForm onSubmit={onNoAnswer} loading={actionLoading} />}
                      {activeAction === "CALL_LATER" && <CallLaterForm onSubmit={onCallLater} loading={actionLoading} />}
                      {activeAction === "CLOSE" && <CloseForm onSubmit={onClose2} loading={actionLoading} />}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3 py-8 rounded-xl bg-[#F0FDF4] dark:bg-[#14532D]/10 border border-[#86EFAC] dark:border-[#14532D]/30">
                      <span className="text-2xl">✅</span>
                      <p className="text-[16px] font-semibold text-[#16A34A] dark:text-green-400">Service already completed — no further actions needed.</p>
                    </div>
                  )}
                </div>
              )}


              {/* ── APPOINTMENT TAB ── */}
              {activeTab === "appointment" && (
                <div className="space-y-4">
                  {/* Current Appointment Info */}
                  {detail.Appointment_Date ? (
                    <div className="rounded-xl border border-[#FDE68A] dark:border-amber-900/40 bg-white dark:bg-[#111827]/60 overflow-hidden">
                      <div className="flex items-center gap-2 px-4 py-3 bg-[#FFFBEB] dark:bg-[#78350F]/20 border-b border-[#FDE68A] dark:border-amber-900/40">
                        <span className="text-[16px]">🗓️</span>
                        <h3 className="text-[16px] font-bold uppercase tracking-widest text-[#D97706] dark:text-[#FBBF24]">Current Appointment</h3>
                      </div>
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-8">
                        <InfoRow label="Date" value={fmtDate(detail.Appointment_Date)} highlight />
                        <InfoRow label="Time" value={detail.Appointment_Time} />
                        <InfoRow label="Status" value={detail.Appointment_Status} />
                        <InfoRow label="Remark" value={detail.Appointment_Remark} />
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-[#E5E7EB] dark:border-[#374151] p-6 text-center">
                      <div className="text-3xl mb-2">🗓️</div>
                      <p className="text-[16px] font-medium text-[#9CA3AF]">No appointment booked yet.</p>
                    </div>
                  )}

                  {/* Book/Update Form */}
                  {!isCompleted && (
                    <div className="space-y-3">
                      <SectionTitle title="Book / Update Appointment" icon="⚡" />
                      <div className="flex flex-wrap gap-2">
                        <ActionBtn label="🗓️ Book Appointment" color="amber" active={activeAction === "APPOINTMENT"} onClick={() => onSetAction(activeAction === "APPOINTMENT" ? "NONE" : "APPOINTMENT")} disabled={actionLoading} />
                      </div>
                      {activeAction === "APPOINTMENT" && <AppointmentForm onSubmit={onAppointment} loading={actionLoading} />}
                    </div>
                  )}
                </div>
              )}


              {/* ── SERVICE TAB ── */}
              {activeTab === "service" && (
                <div className="space-y-4">
                  {detail.Service_Status === "COMPLETED" ? (
                    <>
                      <div className="rounded-xl border border-[#86EFAC] dark:border-[#166534] bg-white dark:bg-[#111827]/60 overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-3 bg-[#F0FDF4] dark:bg-[#14532D]/20 border-b border-[#86EFAC] dark:border-[#166534]">
                          <span className="text-[16px]">✅</span>
                          <h3 className="text-[16px] font-bold uppercase tracking-widest text-[#16A34A] dark:text-[#4ADE80]">Service Completed</h3>
                        </div>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-x-8">
                          <InfoRow label="Completed Date" value={fmtDate(detail.Service_Completed_Date)} highlight />
                          <InfoRow label="Completed KM" value={fmtNum(detail.Service_Completed_KM)} highlight />
                          <InfoRow label="Remark" value={detail.Service_Remark} />
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-[#F0FDF4] dark:bg-[#14532D]/20 border border-[#86EFAC] dark:border-[#14532D]/40">
                        <span className="text-xl">🎉</span>
                        <p className="text-[16px] font-medium text-[#15803D] dark:text-[#86EFAC]">Service complete! Next reminder has been auto-generated.</p>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Current Status */}
                      <div className="rounded-xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827]/60 overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-3 bg-[#F9FAFB] dark:bg-[#1F2937]/50 border-b border-[#E5E7EB] dark:border-[#1E293B]">
                          <span className="text-[16px]">🔧</span>
                          <h3 className="text-[16px] font-bold uppercase tracking-widest text-[#6B7280] dark:text-[#9CA3AF]">Current Service Status</h3>
                        </div>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-8">
                          <InfoRow label="Service Status" value={detail.Service_Status ?? "PENDING"} />
                          <InfoRow label="Next Service KM" value={<span className="font-bold">{fmtNum(detail.Next_Service_KM)}</span>} highlight />
                          <InfoRow label="Final Due Date" value={fmtDate(detail.Final_Due_Date)} />
                          <InfoRow label="Reminder Channel" value={detail.Reminder_Channel} />
                        </div>
                      </div>

                      {/* Complete Service Action */}
                      <div className="space-y-3">
                        <SectionTitle title="Complete Service" icon="⚡" />
                        <div className="flex flex-wrap gap-2">
                          <ActionBtn label="✅ Complete Service" color="green" active={activeAction === "COMPLETE"} onClick={() => onSetAction(activeAction === "COMPLETE" ? "NONE" : "COMPLETE")} disabled={actionLoading} />
                        </div>
                        {activeAction === "COMPLETE" && <CompleteForm onSubmit={onComplete} loading={actionLoading} lastKM={detail.Last_Service_KM} />}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── ✅ AI CALL TAB ── */}
              {activeTab === "aicall" && (
                <AICallTab detail={detail} headers={headers} />
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// MAIN PAGE
// ============================================================
const ServiceRemindersPage = () => {
  const user = useCurrentUser();

  const HEADERS = useCallback(() => ({
    accept: "application/json",
    compcode: user?.Comp_Code ?? "",
    name: user?.name ?? "",
    "Content-Type": "application/json",
  }), [user]);

  const [rows, setRows] = useState<ReminderRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [search, setSearch] = useState("");
  const [dueToday, setDueToday] = useState(false);
  const [overdue, setOverdue] = useState(false);
  const [fromDate, setFromDate] = useState(sevenDaysAgoStr);
  const [toDate, setToDate] = useState(sevenDaysLaterStr);

  // ✅ NEW — Date filter type (draft state, "reminder" default)
  const [dateFilterType, setDateFilterType] = useState<DateFilterType>("reminder");

  const [aSearch, setASearch] = useState("");
  const [aDueToday, setADueToday] = useState(false);
  const [aOverdue, setAOverdue] = useState(false);
  const [aFromDate, setAFromDate] = useState(sevenDaysAgoStr);
  const [aToDate, setAToDate] = useState(sevenDaysLaterStr);
  const [aLocCode, setALocCode] = useState("");

  // ✅ NEW — Applied date filter type (sent to API)
  const [aDateFilterType, setADateFilterType] = useState<DateFilterType>("reminder");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<ReminderRow | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<ActionType>("NONE");

  // ---------------- Call History Modal States ----------------
  const [isCallHistoryOpen, setIsCallHistoryOpen] = useState(false);
  const [isLoadingCallHistory, setIsLoadingCallHistory] = useState(false);
  const [callHistoryData, setCallHistoryData] = useState<FullCallHistoryResponse | null>(null);
  const [callHistoryPage, setCallHistoryPage] = useState(1);
  const callHistoryPageSize = 10;

  // ---------------- Transcript Modal States ----------------
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);

  // ---------------- Insights Modal States ----------------
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);

  // ---------------- Recording Modal States ----------------
  const [playingCallId, setPlayingCallId] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);
  const [isLoadingRecording, setIsLoadingRecording] = useState(false);

  const fetchCallHistoryByVehicle = async (vehicleNumber: string) => {
    if (!vehicleNumber) return;
    try {
      setIsLoadingCallHistory(true);
      setIsCallHistoryOpen(true);
      setCallHistoryPage(1);

      const response = await axios.post(
        `${BASE_URL}/Crm/call-history`,
        { vehicle_number: vehicleNumber },
        {
          headers: {
            accept: "application/json",
            compcode: user?.Comp_Code,
            name: user?.name,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data?.Status) {
        setCallHistoryData(response.data);
      } else {
        showToast("Failed to fetch call history", "error");
        setCallHistoryData(null);
      }
    } catch (err: any) {
      console.error("Call history error:", err);
      showToast(err?.response?.data?.message || err?.message || "Error fetching call history", "error");
      setCallHistoryData(null);
    } finally {
      setIsLoadingCallHistory(false);
    }
  };

  const closeCallHistoryModal = () => {
    setIsCallHistoryOpen(false);
    setCallHistoryData(null);
    setCallHistoryPage(1);
  };

  const handlePlayRecording = async (callId: string) => {
    if (!callId) return;
    try {
      setPlayingCallId(callId);
      setIsRecordingModalOpen(true);
      setIsLoadingRecording(true);
      setAudioUrl(null);

      const response = await axios.get(
        `${BASE_URL}/Crm/GetCallRecordings/${callId}`,
        {
          headers: {
            accept: "*/*",
            compcode: user?.Comp_Code,
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
      showToast(err?.response?.data?.message || err?.message || "Unable to fetch recording", "error");
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

  const [isFormResponseOpen, setIsFormResponseOpen] = useState(false);

  const openTranscriptModal = (call: CallRecord) => {
    setSelectedCall(call);
    setIsTranscriptOpen(true);
  };

  const closeTranscriptModal = () => {
    setIsTranscriptOpen(false);
    setSelectedCall(null);
  };

  const openInsightsModal = (call: CallRecord) => {
    setSelectedCall(call);
    setIsInsightsOpen(true);
  };

  const closeInsightsModal = () => {
    setIsInsightsOpen(false);
    setSelectedCall(null);
  };

  const openFormResponseModal = (call: CallRecord) => {
    setSelectedCall(call);
    setIsFormResponseOpen(true);
  };

  const closeFormResponseModal = () => {
    setIsFormResponseOpen(false);
    setSelectedCall(null);
  };

  const handleDownloadTranscript = () => {
    if (!selectedCall?.chat?.messages?.length) return;

    const formattedTranscript = selectedCall.chat.messages
      .map(
        (msg) =>
          `[${msg.time}] ${msg.side === "right" ? "Agent/AI" : "Customer"}: ${msg.message}`
      )
      .join("\n");

    const blob = new Blob([formattedTranscript], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `transcript_${selectedCall.callId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const totalCallPages = Math.ceil(
    (callHistoryData?.calls?.length || 0) / callHistoryPageSize
  );

  const paginatedCalls = useMemo(() => {
    if (!callHistoryData?.calls) return [];
    const start = (callHistoryPage - 1) * callHistoryPageSize;
    return callHistoryData.calls.slice(start, start + callHistoryPageSize);
  }, [callHistoryData, callHistoryPage]);

  const callsShowingFrom =
    callHistoryData?.calls?.length === 0
      ? 0
      : (callHistoryPage - 1) * callHistoryPageSize + 1;

  const callsShowingTo = Math.min(
    callHistoryPage * callHistoryPageSize,
    callHistoryData?.calls?.length || 0
  );

  useEffect(() => {
    const lc = (user as any)?.Loc_Code ?? (user as any)?.branch ?? "";
    setALocCode(String(lc));
  }, [(user as any)?.Loc_Code, (user as any)?.branch]);

  const payload = useMemo(() => ({
    page, pageSize,
    search: trimOrUndef(aSearch),
    Loc_Code: (user as any)?.branch ?? (user as any)?.Loc_Code ?? aLocCode,
    dueToday: aDueToday ? 1 : undefined,
    overdue: aOverdue ? 1 : undefined,
    fromDate: trimOrUndef(aFromDate),
    toDate: trimOrUndef(aToDate),
    filterDateType: aDateFilterType, // ✅ NEW — "reminder" | "due"
    emp_code: (user as any)?.EMPCODE || (user as any)?.emp_code || (user as any)?.user_code || (user as any)?.id || undefined,
    emp_dms_code: (user as any)?.emp_dms_code || undefined,
    user_code: (user as any)?.id || (user as any)?.user_code || (user as any)?.EMPCODE || undefined,
  }), [page, pageSize, aSearch, aLocCode, aDueToday, aOverdue, aFromDate, aToDate, aDateFilterType, user]);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await axios.post(API.getAll, payload, {
        headers: {
          accept: "application/json",
          compcode: user?.Comp_Code,
          name: user?.name,
          user_code: (user as any)?.id || (user as any)?.user_code,
          emp_code: (user as any)?.EMPCODE || (user as any)?.emp_code,
          emp_dms_code: (user as any)?.emp_dms_code,
          "Content-Type": "application/json",
        }
      });
      const d = res.data;
      if (!d?.success) { showToast("Failed to fetch", "error"); return; }
      setRows(Array.isArray(d.data) ? d.data : []);
      setTotalPages(d.pagination?.totalPages ?? 1);
      setTotalRecords(d.pagination?.totalRecords ?? 0);
    } catch (e: any) {
      showToast(e?.response?.data?.message ?? "Error fetching data", "error");
      setRows([]);
    } finally { setIsLoading(false); }
  }, [payload]);

  useEffect(() => {
    if (!user?.Comp_Code) return;
    fetchData();
  }, [fetchData]);

  const applyFilters = () => {
    setASearch(search);
    setADueToday(dueToday);
    setAOverdue(overdue);
    setAFromDate(fromDate);
    setAToDate(toDate);
    setADateFilterType(dateFilterType); // ✅ NEW
    setPage(1);
  };
  const handleDateChange = (name: string, value: string) => {
    if (name === "fromDate") setFromDate(value);
    if (name === "toDate") setToDate(value);
  };
  const resetFilters = () => {
    const f = sevenDaysAgoStr(), t = sevenDaysLaterStr();
    setSearch(""); setASearch(""); setDueToday(false); setADueToday(false);
    setOverdue(false); setAOverdue(false); setFromDate(""); setAFromDate("");
    setToDate(""); setAToDate(""); setPage(1); setPageSize(10);
    setDateFilterType("reminder"); setADateFilterType("reminder"); // ✅ NEW — reset to default
  };

  const openDetail = async (UTD: number) => {
    try {
      setDetailLoading(true); setDetailOpen(true); setDetail(null); setActiveAction("NONE");
      const res = await axios.post(API.getOne, { UTD }, {
        headers: {
          accept: "application/json",
          compcode: user?.Comp_Code,
          name: user?.name,
          "Content-Type": "application/json",
        }
      });
      if (!res.data?.success || !res.data?.data) { showToast("Failed to load details", "error"); setDetailOpen(false); return; }
      setDetail(res.data.data);
    } catch (e: any) {
      showToast(e?.response?.data?.message ?? "Error loading details", "error"); setDetailOpen(false);
    } finally { setDetailLoading(false); }
  };

  const closeDetail = () => { setDetailOpen(false); setDetail(null); setActiveAction("NONE"); };
  const refreshDetail = async () => { if (detail?.UTD) await openDetail(detail.UTD); };

  // ── ACTION HANDLERS ──────────────────────────────────────
  const submitNoAnswer = async (date: string, time: string, remark: string) => {
    if (!detail?.UTD) return;
    try {
      setActionLoading(true);
      const followRemark = [remark, time ? `(Call @ ${time})` : "", "— Auto scheduled"].filter(Boolean).join(" ");
      await axios.put(API.update, { UTD: detail.UTD, Reminder_Channel: "MANUAL_CALL", Reminder_Status: "FOLLOWUP", Call_Status: "NO_ANSWER", Customer_Response: null, Followup_Date: date, Followup_Remark: followRemark, Reminder_Date: date, incrementReminderCount: true }, {
        headers: {
          accept: "application/json",
          compcode: user?.Comp_Code,
          name: user?.name,
          "Content-Type": "application/json",
        }
      });
      showToast("Follow-up scheduled — " + fmtDate(date), "success");
      await fetchData(); await refreshDetail(); setActiveAction("NONE");
    } catch (e: any) { showToast(e?.response?.data?.message ?? "Failed", "error"); }
    finally { setActionLoading(false); }
  };

  const submitCallLater = async (date: string, time: string, remark: string) => {
    if (!detail?.UTD) return;
    if (!date) { showToast("Please select call back date", "warning"); return; }
    try {
      setActionLoading(true);
      const followRemark = [remark, time ? `(Call @ ${time})` : "", `— Next: ${fmtDate(date)}`].filter(Boolean).join(" ");
      await axios.put(API.update, { UTD: detail.UTD, Reminder_Channel: "MANUAL_CALL", Reminder_Status: "FOLLOWUP", Call_Status: "CONNECTED", Customer_Response: "CALL_LATER", Followup_Date: date, Followup_Remark: followRemark, Reminder_Date: date, incrementReminderCount: true }, {
        headers: {
          accept: "application/json",
          compcode: user?.Comp_Code,
          name: user?.name,
          "Content-Type": "application/json",
        }
      });
      showToast(`Callback set for ${fmtDate(date)}`, "success");
      await fetchData(); await refreshDetail(); setActiveAction("NONE");
    } catch (e: any) { showToast(e?.response?.data?.message ?? "Failed", "error"); }
    finally { setActionLoading(false); }
  };

  const submitAppointment = async (apptDate: string, apptTime: string, status: string, remark: string) => {
    if (!detail?.UTD) return;
    if (!apptDate || !apptTime) { showToast("Date & time required", "warning"); return; }
    try {
      setActionLoading(true);
      await axios.put(API.update, { UTD: detail.UTD, Reminder_Channel: "MANUAL_CALL", Reminder_Status: "APPOINTMENT_BOOKED", Call_Status: "CONNECTED", Customer_Response: "AGREED", Appointment_Date: apptDate, Appointment_Time: apptTime, Appointment_Status: status || "CONFIRMED", Appointment_Remark: remark || null, Reminder_Date: apptDate, Followup_Date: apptDate, Followup_Remark: `Appt confirmed for ${fmtDate(apptDate)} @ ${apptTime}`, incrementReminderCount: true }, {
        headers: {
          accept: "application/json",
          compcode: user?.Comp_Code,
          name: user?.name,
          "Content-Type": "application/json",
        }
      });
      showToast(`Appointment booked! ${fmtDate(apptDate)}`, "success");
      await fetchData(); await refreshDetail(); setActiveAction("NONE");
    } catch (e: any) { showToast(e?.response?.data?.message ?? "Failed", "error"); }
    finally { setActionLoading(false); }
  };

  const submitClose = async (callStatus: string, resp: string, remark: string) => {
    if (!detail?.UTD) return;
    try {
      setActionLoading(true);
      await axios.put(API.update, { UTD: detail.UTD, Reminder_Status: "CLOSED", Call_Status: callStatus || null, Customer_Response: resp || null, Followup_Remark: remark || "Closed", incrementReminderCount: true }, {
        headers: {
          accept: "application/json",
          compcode: user?.Comp_Code,
          name: user?.name,
          "Content-Type": "application/json",
        }
      });
      showToast("Reminder closed", "success");
      await fetchData(); await refreshDetail(); setActiveAction("NONE");
    } catch (e: any) { showToast(e?.response?.data?.message ?? "Failed", "error"); }
    finally { setActionLoading(false); }
  };

  const submitComplete = async (date: string, km: number, remark: string) => {
    if (!detail?.Cust_Vehi_UTD) { showToast("Cust_Vehi_UTD not found", "error"); return; }
    if (!date || isNaN(km) || km < 0) { showToast("Valid date & KM required", "warning"); return; }
    try {
      setActionLoading(true);
      await axios.put(API.complete, { Cust_Vehi_UTD: detail.Cust_Vehi_UTD, Service_Completed_Date: date, Service_Completed_KM: Math.trunc(km), Service_Remark: remark || null }, {
        headers: {
          accept: "application/json",
          compcode: user?.Comp_Code,
          name: user?.name,
          "Content-Type": "application/json",
        }
      });
      showToast("Service completed! ✅", "success");
      try {
        await axios.post(API.generate, { Cust_Vehi_UTD: detail.Cust_Vehi_UTD, Reminder_Channel: detail.Reminder_Channel ?? "AI_CALL" }, {
          headers: {
            accept: "application/json",
            compcode: user?.Comp_Code,
            name: user?.name,
            "Content-Type": "application/json",
          }
        });
        showToast("Next reminder generated! 🔔", "success");
      } catch (genErr: any) { showToast("Service done but next reminder failed: " + (genErr?.response?.data?.message ?? "Unknown"), "warning"); }
      await fetchData(); await refreshDetail(); setActiveAction("NONE");
    } catch (e: any) { showToast(e?.response?.data?.message ?? "Failed", "error"); }
    finally { setActionLoading(false); }
  };

  // ── COLUMNS ──────────────────────────────────────────────
  const columns = useMemo(() => [
    { Header: "Reg No", accessor: "Veh_Reg_No", Cell: ({ value }: any) => <b className="text-[#1D4ED8] dark:text-[#60A5FA] font-mono tracking-wide">{value ?? "—"}</b> },
    { Header: "Customer", accessor: "Cust_Name" },
    { Header: "Mobile", accessor: "Cust_Mob" },
    { Header: "Model", accessor: "Model_Name" },
    { Header: "Last Svc", accessor: "Last_Service_Date", cellAlign: "center", Cell: ({ value }: any) => <span className=" ">{fmtDate(value)}</span> },
    { Header: "Last KM", accessor: "Last_Service_KM", cellAlign: "center", Cell: ({ value }: any) => <span className=" font-mono">{fmtNum(value)}</span> },
    { Header: "Rem Date", accessor: "Reminder_Date", cellAlign: "center", Cell: ({ value }: any) => <span className="">{fmtDate(value)}</span> },
    { Header: "Due Date", accessor: "Final_Due_Date", cellAlign: "center", Cell: ({ value }: any) => <span className=" font-semibold">{fmtDate(value)}</span> },
    {
      Header: "Days Left", accessor: "Days_Until_Due", cellAlign: "center",
      Cell: ({ value }: any) => value == null ? <span className="text-[#9CA3AF] ">—</span>
        : value < 0 ? <span className="text-[#EF4444] font-bold">{Math.abs(value)}d late</span>
          : value === 0 ? <span className="text-[#CA8A04]  font-bold">Today</span>
            : <span className="text-[#16A34A] font-semibold">{value}d</span>
    },
    { Header: "Due Status", accessor: "Due_Status", cellAlign: "center", Cell: ({ value }: any) => <DueBadge status={value} /> },
    { Header: "Status", accessor: "Reminder_Status", cellAlign: "center", Cell: ({ value }: any) => <ReminderStatusBadge status={value} /> },
    // {
    //   Header: "AI Call", accessor: "AI_Call_ID", cellAlign: "center",
    //   Cell: ({ value }: any) => value
    //     ? <span className="inline-flex items-center gap-1 text-[16px] font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-[#14532D]/20 border border-green-200 dark:border-green-800 px-2 py-0.5 rounded-full">🤖 Done</span>
    //     : <span className="text-[16px] text-[#9CA3AF]">—</span>
    // },
    {
      Header: "Action", accessor: "action", cellAlign: "center",
      Cell: ({ row }: any) => (
        <button className="px-2 py-0.5 font-semibold rounded-lg bg-[#EFF6FF] text-[#1D4ED8] hover:bg-[#DBEAFE] border border-blue-200 dark:bg-[#14532D]/20 dark:text-[#60A5FA] dark:border-blue-800 transition-colors" onClick={() => openDetail(row.original.UTD)}>View →</button>
      )
    },
  ], []); // eslint-disable-line

  const overdueCount = rows.filter(r => r.Due_Status === "OVERDUE").length;
  const dueTodayCount = rows.filter(r => r.Due_Status === "DUE_TODAY").length;

  return (
    <div className="grid grid-cols-12 gap-4">

      {/* HEADER */}
      <div className="col-span-12">
        <div className="rounded-t border border-borderColor bg-header px-4 py-3 dark:border-borderColor-dark dark:bg-black">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Image src="/Payrollicon/Excel_Import.png" alt="" width={25} height={25} />
              <div>
                <h1 className="text-[24px] md:text-[22px] font-bold uppercase text-white dark:text-[#37a9dd] tracking-wide">Service Reminder View</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  {totalRecords > 0 && <span className="text-[18px] text-white/60">{totalRecords.toLocaleString("en-IN")} records</span>}
                  {overdueCount > 0 && <span className="text-[16px] font-bold bg-[#EF4444] text-white rounded-full px-2 py-0.5">{overdueCount} overdue</span>}
                  {dueTodayCount > 0 && <span className="text-[16px] font-bold bg-yellow-500 text-white rounded-full px-2 py-0.5">{dueTodayCount} due today</span>}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchData} disabled={isLoading}>Refresh</Button>
              <Button variant="print" onClick={() => window.history.back()}>Back</Button>
            </div>
          </div>
        </div>

        {/* FILTERS */}
        <div className="border border-t-0 border-borderColor dark:border-borderColor-dark bg-white dark:bg-black p-3 md:p-4">
          <div className="flex flex-wrap items-end gap-3">



            <div className="flex gap-3">
              <div className="w-36">
                <Ainput
                  title="From Date"
                  type="date"
                  name="fromDate"
                  value={fromDate}
                  handleInputChange={handleDateChange}
                  onInput={() => { }}
                  redlabel=""
                  disabled={isLoading}
                  labelClass="text-[18px]"
                  className="w-36 !h-10 !text-[18px]"
                />
              </div>

              <div className="w-36">
                <Ainput
                  title="To Date"
                  type="date"
                  name="toDate"
                  value={toDate}
                  handleInputChange={handleDateChange}
                  onInput={() => { }}
                  redlabel=""
                  disabled={isLoading}
                  labelClass="text-[18px]"
                  className="w-36 !h-10 !text-[18px]"
                />
              </div>
            </div>

            {/* ✅ NEW — Date Filter Type Selector */}
            <div className="flex flex-col gap-1">
              <label className="text-[18px] font-bold text-[#193A69] dark:text-[#E2E8F0]">Filter By</label>
              <select
                value={dateFilterType}
                onChange={e => setDateFilterType(e.target.value as DateFilterType)}
                disabled={isLoading}
                className="h-9 w-36 rounded-lg border border-gray-300 dark:border-borderColor-dark bg-white dark:bg-input px-2 text-[16px] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
              >
                <option value="reminder">Reminder Date</option>
                <option value="due">Due Date</option>
              </select>
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
              <label className="text-[18px] font-bold text-[#193A69] dark:text-[#E2E8F0]">Search</label>
              <input type="text" className={inputCls} value={search} placeholder="Name, reg no, model…" onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && applyFilters()} disabled={isLoading} />
            </div>
            <div className="flex items-center gap-4 pb-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={dueToday} onChange={e => setDueToday(e.target.checked)} disabled={isLoading} className="w-4 h-4 rounded accent-yellow-500" />
                <span className="text-[#CA8A04] dark:text-yellow-400 font-semibold text-[16px]">Due Today</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={overdue} onChange={e => setOverdue(e.target.checked)} disabled={isLoading} className="w-4 h-4 rounded accent-red-500" />
                <span className="text-red-600 dark:text-red-400 font-semibold text-[16px]">Overdue</span>
              </label>
            </div>
            <div className="flex gap-2 pb-1">
              <Button variant="save" onClick={applyFilters} disabled={isLoading}>Apply</Button>
              <Button variant="print" onClick={resetFilters} disabled={isLoading}>Reset</Button>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="col-span-12 rounded border border-borderColor dark:border-borderColor-dark bg-white dark:bg-black p-2 md:p-4">
        <DataTable
          title="" columns={columns} selectValue="UTD" data={rows} height={470}
          filterPosition="FilterData" enableColumnFilters={true}
          numericFilterColumns={["UTD", "Last_Service_KM", "Days_Until_Due"]}
          serverMode={true}
          serverPagination={{ currentPage: page, pageSize, totalPages, totalRecords }}
          onServerPageChange={(p: number) => setPage(p)}
          onServerPageSizeChange={(s: number) => { setPageSize(s); setPage(1); }}
          onRowDoubleClick={(r: ReminderRow) => openDetail(r.UTD)}
          size='text-lg'

        />
      </div>

      {/* DETAIL MODAL */}
      {detailOpen && (
        <DetailModal
          detail={detail} detailLoading={detailLoading}
          activeAction={activeAction} actionLoading={actionLoading}
          onClose={closeDetail} onSetAction={setActiveAction}
          onNoAnswer={submitNoAnswer} onCallLater={submitCallLater}
          onAppointment={submitAppointment} onClose2={submitClose}
          onComplete={submitComplete}
          onOpenCallHistory={(vehNo) => fetchCallHistoryByVehicle(vehNo)}

          headers={{
            accept: "application/json",
            compcode: user?.Comp_Code,
            name: user?.name,
            "Content-Type": "application/json",
          }}
        />
      )}

      {/* ============================================================
          CALL HISTORY MODAL (In-modal for All Call History)
      ============================================================ */}
      <Modal
        isOpen={isCallHistoryOpen}
        onClose={closeCallHistoryModal}
        widthClass="max-w-7xl"
        zIndexClass="z-[9999]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E7EB] bg-[#193A69] px-4 py-3 dark:bg-black">
          <div>
            <h2 className="text-[20px] font-bold text-white dark:text-[#37a9dd]">
              {callHistoryData?.vehicleInfo?.Veh_Reg_No || "Call History"}
            </h2>
            <p className="text-[16px] text-[#E5E7EB] dark:text-[#9CA3AF]">
              {callHistoryData?.vehicleInfo?.Cust_Name} •{" "}
              {callHistoryData?.vehicleInfo?.Cust_Mob} •{" "}
              {callHistoryData?.vehicleInfo?.Model_Name}
            </p>
          </div>
          <button
            onClick={closeCallHistoryModal}
            className="rounded-full p-1 text-white hover:bg-white/20"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[80vh] overflow-y-auto">
          {isLoadingCallHistory ? (
            <div className="flex items-center justify-center p-10">
              <HashloaderComponent isLoading={true} />
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 border-b border-[#E5E7EB] p-4 dark:border-[#374151] sm:grid-cols-3 md:grid-cols-7">
                <CallStatCard
                  label="Total Calls"
                  value={callHistoryData?.stats?.totalCalls ?? 0}
                />
                <CallStatCard
                  label="Completed"
                  value={callHistoryData?.stats?.completedCalls ?? 0}
                  color="text-[#16A34A]"
                />
                <CallStatCard
                  label="Busy"
                  value={callHistoryData?.stats?.busyCalls ?? 0}
                  color="text-[#CA8A04]"
                />
                <CallStatCard
                  label="No Answer"
                  value={callHistoryData?.stats?.noAnswerCalls ?? 0}
                  color="text-[#6B7280]"
                />
                <CallStatCard
                  label="Failed"
                  value={callHistoryData?.stats?.failedCalls ?? 0}
                  color="text-[#DC2626]"
                />
                <CallStatCard
                  label="Appointments"
                  value={callHistoryData?.stats?.appointmentsSet ?? 0}
                  color="text-[#2563EB]"
                />
                <CallStatCard
                  label="Total Duration"
                  value={`${Math.round(
                    (callHistoryData?.stats?.totalDurationSec ?? 0) / 60
                  )} min`}
                />
              </div>

              {/* Calls Table */}
              <div className="overflow-x-auto p-4">
                <table className="w-full min-w-[900px] text-left text-[17px]">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] text-[17px] font-bold uppercase text-[#6B7280] dark:border-[#374151] dark:text-[#9CA3AF]">
                      <th className="px-2 py-2">Time</th>
                      <th className="px-2 py-2">To Phone Number</th>
                      <th className="px-2 py-2">Status</th>
                      <th className="px-2 py-2">Duration</th>
                      <th className="px-2 py-2">Channel</th>
                      <th className="px-2 py-2 text-center">Recording</th>
                      <th className="px-2 py-2 text-center">Transcript</th>
                      <th className="px-2 py-2 text-center">Summary</th>
                      <th className="px-2 py-2 text-center">Form Response</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCalls.length === 0 ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-2 py-6 text-center text-[#9CA3AF] text-[17px]"
                        >
                          No calls found
                        </td>
                      </tr>
                    ) : (
                      paginatedCalls.map((call) => (
                        <tr
                          key={call.callId}
                          className="border-b border-[#E5E7EB]/50 hover:bg-[#F9FAFB] dark:border-[#374151]/50 dark:hover:bg-[#1F2937]"
                        >
                          <td className="px-2 py-3 text-[17px]">{call.triggeredAt || "-"}</td>
                          <td className="px-2 py-3 text-[17px]">{call.phoneNumber || "-"}</td>
                          <td className="px-2 py-3 text-[17px]">
                            <span
                              className={`flex items-center gap-1 font-semibold ${getCallStatusColor(
                                call.status
                              )}`}
                            >
                              <span className="h-2 w-2 rounded-full bg-current" />
                              {call.status?.toLowerCase()}
                            </span>
                          </td>
                          <td className="px-2 py-3 text-[17px]">
                            {call.duration ||
                              (call.durationSec
                                ? `${call.durationSec} sec`
                                : "-")}
                          </td>
                          <td className="px-2 py-3 text-center">
                            <span
                              className={`rounded-full px-2.5 py-1 text-[13px] font-bold ${call.callChannel === "MANUAL_CALL"
                                ? "bg-[#FFEDD5] text-[#C2410C]"
                                : "bg-[#F3E8FF] text-[#7E22CE]"
                                }`}
                            >
                              {call.callChannel === "MANUAL_CALL" ? "Manual" : "AI Call"}
                            </span>
                          </td>
                          <td className="px-2 py-3 text-center">
                            <button
                              title="Play Recording"
                              onClick={() => handlePlayRecording(call.callId)}
                              className="text-[#2563EB] hover:text-[#1E40AF]"
                            >
                              <PlayCircle size={18} />
                            </button>
                          </td>
                          <td className="px-2 py-3 text-center">
                            <button
                              title="View Transcript"
                              onClick={() => openTranscriptModal(call)}
                              disabled={!call.chat?.messages?.length}
                              className={
                                call.chat?.messages?.length
                                  ? "text-[#4F46E5] hover:text-[#3730A3]"
                                  : "cursor-not-allowed text-[#D1D5DB] dark:text-[#4B5563]"
                              }
                            >
                              <MessageSquareText size={18} />
                            </button>
                          </td>
                          <td className="px-2 py-3 text-center">
                            <button
                              title="View Insights"
                              onClick={() => openInsightsModal(call)}
                              className="text-[#9333EA] hover:text-[#6B21A8]"
                            >
                              <BarChart3 size={18} />
                            </button>
                          </td>
                          <td className="px-2 py-3 text-center">
                            <button
                              title="View Form Booking Response"
                              onClick={() => openFormResponseModal(call)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[14px] font-bold transition-all shadow-xs cursor-pointer ${
                                call.formResponse?.hasSubmittedForm
                                  ? "bg-[#DCFCE7] hover:bg-[#BBF7D0] text-[#15803D] dark:bg-[#14532D]/40 dark:text-[#4ADE80] border border-[#86EFAC] dark:border-[#166534]"
                                  : "bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#64748B] dark:bg-[#1E293B] dark:text-[#94A3B8] border border-[#CBD5E1] dark:border-[#334155]"
                              }`}
                            >
                              <CalendarCheck size={16} />
                              {call.formResponse?.hasSubmittedForm ? "Form Booked" : "Form Response"}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Pagination */}
                {callHistoryData?.calls?.length ? (
                  <div className="mt-4 flex items-center justify-between text-[16px] text-[#6B7280] dark:text-[#9CA3AF]">
                    <span>
                      Showing {callsShowingFrom} to {callsShowingTo} of{" "}
                      {callHistoryData.calls.length} results
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={callHistoryPage <= 1}
                        onClick={() =>
                          setCallHistoryPage((p) => Math.max(1, p - 1))
                        }
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={callHistoryPage >= totalCallPages}
                        onClick={() =>
                          setCallHistoryPage((p) =>
                            Math.min(totalCallPages, p + 1)
                          )
                        }
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* TRANSCRIPT MODAL */}
      <Modal
        isOpen={isTranscriptOpen}
        onClose={closeTranscriptModal}
        widthClass="max-w-md"
        zIndexClass="z-[999999999]"
      >
        <div className="flex items-center justify-between bg-[#4F46E5] px-4 py-3 text-white">
          <h3 className="flex items-center gap-2 text-[18px] font-semibold">
            <MessageSquareText size={20} />
            Call Transcript
          </h3>
          <div className="flex items-center gap-3">
            <button
              title="Download Transcript"
              onClick={handleDownloadTranscript}
              className="hover:opacity-80"
            >
              <Download size={20} />
            </button>
            <button
              title="Close"
              onClick={closeTranscriptModal}
              className="hover:opacity-80"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="max-h-[70vh] space-y-3 overflow-y-auto bg-[#F3F4F6] p-3 dark:bg-[#1F2937]">
          {selectedCall?.chat?.messages?.length ? (
            selectedCall.chat.messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.side === "right" ? "justify-end" : "justify-start"
                  }`}
              >
                <div
                  className={`max-w-[82%] rounded-lg px-3.5 py-2.5 text-[17px] shadow ${msg.side === "right"
                    ? "bg-[#DCFCE7] text-[#1F2937] dark:bg-[#BBF7D0]"
                    : "bg-white text-[#1F2937] dark:bg-[#374151] dark:text-[#F3F4F6]"
                    }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {msg.message}
                  </p>
                  <span className="mt-1 block text-right text-[13px] text-[#9CA3AF]">
                    {msg.time}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="py-10 text-center text-[17px] text-[#9CA3AF]">
              No transcript available
            </p>
          )}
        </div>
      </Modal>

      {/* INSIGHTS MODAL */}
      <Modal
        isOpen={isInsightsOpen}
        onClose={closeInsightsModal}
        widthClass="max-w-lg"
        zIndexClass="z-[999999999]"
      >
        <div className="flex items-center justify-between border-b bg-[#4F46E5] text-white border-[#E5E7EB] px-4 py-3 dark:border-[#374151]">
          <h3 className="flex items-center gap-2 text-[18px] font-bold">
            <BarChart3 size={20} className="text-white" />
            Call Insights
          </h3>
          <button onClick={closeInsightsModal} className="hover:opacity-80">
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-3 overflow-y-auto p-4 text-[17px]">
          <InsightRow label="Category" value={selectedCall?.category || "-"} />
          <InsightRow label="Summary" value={selectedCall?.summary || "-"} />
          <InsightRow
            label="Customer Response"
            value={
              selectedCall?.customerResponse ||
              selectedCall?.appointmentRemark ||
              (selectedCall?.appointmentSet ? "Appointment Confirmed" : "-")
            }
          />
          {selectedCall?.appointmentRemark && (
            <InsightRow label="Appointment Remark" value={selectedCall.appointmentRemark} />
          )}
          {selectedCall?.appointmentStatus && (
            <InsightRow label="Appointment Status" value={selectedCall.appointmentStatus} />
          )}
          <InsightRow
            label="Appointment Set"
            value={selectedCall?.appointmentSet ? "Yes" : "No"}
          />
          {selectedCall?.appointmentSet && (
            <>
              <InsightRow
                label="Appointment Date"
                value={fmtDate(selectedCall?.appointmentDate)}
              />
              <InsightRow
                label="Appointment Time"
                value={selectedCall?.appointmentTime || "-"}
              />
              <InsightRow
                label="Slot"
                value={selectedCall?.appointmentSlot || "-"}
              />
            </>
          )}
          {selectedCall?.transferInfo && (
            <>
              <InsightRow
                label="Transferred To"
                value={selectedCall.transferInfo.transferredTo}
              />
              <InsightRow
                label="Transfer Status"
                value={selectedCall.transferInfo.transferStatus}
              />
              <InsightRow
                label="Transfer Time"
                value={selectedCall.transferInfo.transferTime}
              />
            </>
          )}
        </div>
      </Modal>

      {/* ============================================================
          FORM RESPONSE MODAL (WHATSAPP APPOINTMENT FORM SUBMISSION)
      ============================================================ */}
      <Modal
        isOpen={isFormResponseOpen}
        onClose={closeFormResponseModal}
        widthClass="max-w-lg"
        zIndexClass="z-[999999999]"
      >
        <div className="flex items-center justify-between border-b bg-[#0D9488] text-white border-[#E5E7EB] px-4 py-3 dark:border-[#374151]">
          <h3 className="flex items-center gap-2 text-[18px] font-bold">
            <CalendarCheck size={20} className="text-white" />
            WhatsApp Form Booking Response
          </h3>
          <button onClick={closeFormResponseModal} className="hover:opacity-80">
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-3 overflow-y-auto p-4 text-[17px]">
          {selectedCall?.formResponse?.hasSubmittedForm ? (
            <>
              <div className="p-3 bg-[#ECFDF5] dark:bg-[#064E3B]/40 border border-[#A7F3D0] dark:border-[#047857] rounded-xl text-[#065F46] dark:text-[#6EE7B7] font-semibold text-[15px] flex items-center gap-2">
                <CheckCircle2 size={18} className="text-[#059669] dark:text-[#34D399] shrink-0" />
                Customer has confirmed appointment via WhatsApp link form.
              </div>

              <InsightRow
                label="Scheduled Date (From Form)"
                value={fmtDate(selectedCall.formResponse.scheduledDate)}
              />
            =
              <InsightRow
                label="Service Type / Remark"
                value={selectedCall.formResponse.serviceType || "-"}
              />
              
              <InsightRow
                label="Appointment Status"
                value={selectedCall.formResponse.appointmentStatus || "SCHEDULED"}
              />
              {selectedCall.formResponse.submittedAt && (
                <InsightRow
                  label="Form Submitted On"
                  value={selectedCall.formResponse.submittedAt}
                />
              )}
            </>
          ) : (
            <div className="text-center py-8 space-y-2">
              <AlertCircle size={36} className="mx-auto text-[#F59E0B]" />
              <p className="font-bold text-[17px] text-[#1F2937] dark:text-white">
                No Form Submitted Yet
              </p>
              <p className="text-[15px] text-[#6B7280] dark:text-[#9CA3AF]">
                The customer has received the WhatsApp link but has not confirmed the appointment on the form yet.
              </p>
            </div>
          )}
        </div>
      </Modal>

      {/* RECORDING MODAL */}
      <Modal
        isOpen={isRecordingModalOpen}
        onClose={closeRecordingModal}
        widthClass="max-w-md"
        zIndexClass="z-[999999999]"
      >
        <div className="flex items-center justify-between bg-[#2563EB] px-4 py-3 text-white">
          <h3 className="flex items-center gap-2 text-[18px] font-semibold">
            <PlayCircle size={20} />
            Call Recording
          </h3>
          <button onClick={closeRecordingModal} className="hover:opacity-80">
            <X size={20} />
          </button>
        </div>

        <div className="flex min-h-[150px] flex-col items-center justify-center gap-4 p-6">
          {isLoadingRecording ? (
            <div className="flex flex-col items-center gap-2">
              <HashloaderComponent isLoading={true} />
              <p className="text-[17px] text-[#9CA3AF]">Loading recording...</p>
            </div>
          ) : audioUrl ? (
            <>
              <audio controls autoPlay className="w-full">
                <source src={audioUrl} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>

              <a
                href={audioUrl}
                download={`recording_${playingCallId}.mp3`}
                className="flex items-center gap-1 text-[17px] text-[#2563EB] font-medium hover:underline"
              >
                <Download size={18} />
                Download Recording
              </a>
            </>
          ) : (
            <p className="text-[17px] text-[#9CA3AF]">No recording available</p>
          )}
        </div>
      </Modal>

      <HashloaderComponent isLoading={isLoading} />

      {/* ── Global CSS override for DatePicker z-index inside Modal & Forms ── */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .react-datepicker-popper {
            z-index: 99999 !important;
          }
          .react-datepicker-wrapper {
            width: 100%;
          }
          .react-datepicker {
            z-index: 99999 !important;
          }
        `
      }} />
    </div>
  );
};

export default ServiceRemindersPage;