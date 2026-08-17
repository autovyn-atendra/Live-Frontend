"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Swal from "sweetalert2";
import axios from "axios";

import DataTable from "@/components/Templates/ServiceTable";
import HashloaderComponent from "@/components/Templates/hashloader";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import Ainput from "@/components/atoms/Input";
import {
  BarChart3,
  Clock,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Layers,
  Car,
  CalendarClock,
} from "lucide-react";
import { useRouter } from "next/navigation";

// ============================================================
// CONSTANTS
// ============================================================
const BASE_URL = process.env.NEXT_PUBLIC_URL;

// ============================================================
// TYPES
// ============================================================
type DueStatus = "DUE_TODAY" | "OVERDUE" | "UPCOMING" | "COMPLETED" | "UNKNOWN";
type DateFilterType = "due_date" | "reminder_date";
type ShowClosedType = "active" | "closed" | "all";

type ReminderRow = {
  UTD: number;
  Cust_Vehi_UTD: number;
  Service_Rule_UTD: number;
  Loc_Code: string;
  Loc_Name?: string;
  Cust_UTD: number;
  Tran_id: number | null;
  Veh_Reg_No: string | null;
  Cust_Name: string;
  Cust_Mob: string;
  Model_Name: string;
  Last_Service_Date: string | null;
  Last_Service_KM: number | null;
  Avg_Daily_KM: number | null;
  Next_Service_KM: number | null;
  Current_KM: number | null;
  Date_Based_Due_Date: string | null;
  KM_Based_Due_Date: string | null;
  Final_Due_Date: string | null;
  Reminder_Date: string | null;
  Reminder_Type: string | null;
  Reminder_Channel: string | null;
  Reminder_Status: string | null;
  Reminder_Count: number;
  Last_Reminder_At: string | null;
  Call_Status: string | null;
  Customer_Response: string | null;
  Followup_Date: string | null;
  Followup_Remark: string | null;
  Current_KM_Verified: number | null;
  Contacted_By: string | null;
  Appointment_Date: string | null;
  Appointment_Time: string | null;
  Appointment_Status: string | null;
  Appointment_Remark: string | null;
  Service_Status: string | null;
  Service_Completed_Date: string | null;
  Service_Completed_KM: number | null;
  Service_Remark: string | null;
  status: number;
  Created_By: string | null;
  Created_At: string | null;
  Updated_By: string | null;
  Updated_At: string | null;
  Due_Status: DueStatus | null;
  KM_Due_At: number | null;
  KM_Last: number | null;
  KM_Interval: number | null;
  Days_Until_Reminder: number | null;
  Days_Until_Due: number | null;
};

type Totals = {
  totalReminders: number;
  dueToday: number;
  overdue: number;
  upcoming: number;
  completed: number;
  unknown: number;
  totalMasterVehiclesActive: number;
  totalActiveCustomerVehicles: number;
};

type SummaryResponse = {
  success: boolean;
  metrics: {
    totals: Totals;
    breakdowns: {
      reminderStatus: { Reminder_Status: string; cnt: number }[];
      serviceStatus: { Service_Status: string; cnt: number }[];
      appointmentStatus: { Appointment_Status: string; cnt: number }[];
      channels: { Reminder_Channel: string; cnt: number }[];
      branches: { Loc_Code: string; Loc_Name: string; cnt: number }[];
      topModels: { Model_Name: string; cnt: number }[];
    };
  };
};

type TableResponse = {
  success: boolean;
  list: {
    data: ReminderRow[];
    pagination: {
      currentPage: number;
      pageSize: number;
      totalRecords: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
};

// ============================================================
// UTILS
// ============================================================
const fmtDate = (v: string | null | undefined) => {
  if (!v) return "—";
  const [y, m, d] = v.split("-");
  return y && m && d ? `${d}-${m}-${y}` : v;
};

const fmtNum = (v: number | null | undefined) =>
  v == null ? "—" : v.toLocaleString("en-IN");

const trimOrUndef = (v: unknown): string | undefined => {
  const s = v == null ? "" : String(v).trim();
  return s || undefined;
};

const showToast = (
  msg: string,
  type: "success" | "error" | "warning" | "info"
) =>
  Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3500,
    timerProgressBar: true,
  }).fire({ icon: type, title: msg });

// ============================================================
// STATUS BADGES
// ============================================================
const ReminderStatusBadge = ({ status }: { status: string | null }) => {
  if (!status) return <span className="text-[#9CA3AF] text-[16px]">—</span>;
  const map: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    PENDING: { bg: "bg-[#FFF7ED]", text: "text-[#C2410C]", border: "border-[#FED7AA]", dot: "bg-[#EA580C]" },
    SENT: { bg: "bg-[#EFF6FF]", text: "text-[#1D4ED8]", border: "border-[#BFDBFE]", dot: "bg-[#2563EB]" },
    FOLLOWUP: { bg: "bg-[#F5F3FF]", text: "text-[#6D28D9]", border: "border-[#DDD6FE]", dot: "bg-[#7C3AED]" },
    APPOINTMENT_BOOKED: { bg: "bg-[#ECFEFF]", text: "text-[#0E7490]", border: "border-[#A5F3FC]", dot: "bg-[#0891B2]" },
    CLOSED: { bg: "bg-[#F3F4F6]", text: "text-[#4B5563]", border: "border-[#D1D5DB]", dot: "bg-[#6B7280]" },
    FAILED: { bg: "bg-[#FEF2F2]", text: "text-[#B91C1C]", border: "border-[#FECACA]", dot: "bg-[#DC2626]" },
    UNKNOWN: { bg: "bg-[#F9FAFB]", text: "text-[#374151]", border: "border-[#E5E7EB]", dot: "bg-[#9CA3AF]" },
  };
  const s = map[status] ?? map.UNKNOWN;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[16px] font-semibold whitespace-nowrap ${s.bg} ${s.text} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
      {status}
    </span>
  );
};

const ServiceStatusBadge = ({ status }: { status: string | null }) => {
  if (!status) return <span className="text-[#9CA3AF] text-[16px]">—</span>;
  const map: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    PENDING: { bg: "bg-[#FFFBEB]", text: "text-[#B45309]", border: "border-[#FDE68A]", dot: "bg-[#D97706]" },
    COMPLETED: { bg: "bg-[#F0FDF4]", text: "text-[#15803D]", border: "border-[#BBF7D0]", dot: "bg-[#16A34A]" },
    CANCELLED: { bg: "bg-[#FEF2F2]", text: "text-[#B91C1C]", border: "border-[#FECACA]", dot: "bg-[#DC2626]" },
    IN_PROGRESS: { bg: "bg-[#EFF6FF]", text: "text-[#1D4ED8]", border: "border-[#BFDBFE]", dot: "bg-[#2563EB]" },
  };
  const s = map[status] ?? { bg: "bg-[#F9FAFB]", text: "text-[#374151]", border: "border-[#E5E7EB]", dot: "bg-[#9CA3AF]" };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[16px] font-semibold whitespace-nowrap ${s.bg} ${s.text} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
      {status}
    </span>
  );
};

// ============================================================
// UI COMPONENTS
// ============================================================
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={"rounded-xl border border-borderColor dark:border-borderColor-dark bg-white dark:bg-black p-3 sm:p-4 " + className}>
    {children}
  </div>
);

type MetricCardColor = "blue" | "yellow" | "red" | "green" | "gray" | "purple" | "cyan";

const MetricCard = ({
  label, value, sub, color = "blue", onClick, active = false, disabled = false, iconType = "barchart",
}: {
  label: string; value: string | number; sub?: string; color?: MetricCardColor;
  onClick?: () => void; active?: boolean; disabled?: boolean;
  iconType?: "barchart" | "help" | "box" | "circle" | "calendar";
}) => {
  const cardStyles: Record<MetricCardColor, { bg: string; border: string; label: string; value: string; iconBg: string; sub: string }> = {
    blue: { bg: "bg-[#F0F6FF] dark:bg-[#1E3A8A]/25", border: "border-[#BFDBFE] border-l-[#2563EB] dark:border-[#1E3A8A] dark:border-l-[#3B82F6]", label: "text-[#1D4ED8] dark:text-[#93C5FD]", value: "text-[#1E40AF] dark:text-white", iconBg: "bg-[#DBEAFE] text-[#1D4ED8] dark:bg-[#1E3A8A]/60 dark:text-[#93C5FD]", sub: "text-[#3B82F6] dark:text-[#93C5FD]/80" },
    yellow: { bg: "bg-[#FEFCE8] dark:bg-[#78350F]/25", border: "border-[#FDE68A] border-l-[#D97706] dark:border-[#78350F] dark:border-l-[#F59E0B]", label: "text-[#B45309] dark:text-[#FDE047]", value: "text-[#92400E] dark:text-white", iconBg: "bg-[#FEF08A] text-[#B45309] dark:bg-[#78350F]/60 dark:text-[#FDE047]", sub: "text-[#D97706] dark:text-[#FDE047]/80" },
    red: { bg: "bg-[#FEF2F2] dark:bg-[#7F1D1D]/25", border: "border-[#FECACA] border-l-[#DC2626] dark:border-[#7F1D1D] dark:border-l-[#EF4444]", label: "text-[#B91C1C] dark:text-[#FCA5A5]", value: "text-[#991B1B] dark:text-white", iconBg: "bg-[#FEE2E2] text-[#B91C1C] dark:bg-[#7F1D1D]/60 dark:text-[#FCA5A5]", sub: "text-[#EF4444] dark:text-[#FCA5A5]/80" },
    green: { bg: "bg-[#F0FDF4] dark:bg-[#064E3B]/25", border: "border-[#BBF7D0] border-l-[#16A34A] dark:border-[#064E3B] dark:border-l-[#10B981]", label: "text-[#15803D] dark:text-[#86EFAC]", value: "text-[#166534] dark:text-white", iconBg: "bg-[#DCFCE7] text-[#15803D] dark:bg-[#064E3B]/60 dark:text-[#86EFAC]", sub: "text-[#10B981] dark:text-[#86EFAC]/80" },
    gray: { bg: "bg-[#F9FAFB] dark:bg-[#1F2937]/30", border: "border-[#E5E7EB] border-l-[#6B7280] dark:border-[#374151] dark:border-l-[#9CA3AF]", label: "text-[#4B5563] dark:text-[#9CA3AF]", value: "text-[#1F2937] dark:text-white", iconBg: "bg-[#E5E7EB] text-[#4B5563] dark:bg-[#374151] dark:text-[#9CA3AF]", sub: "text-[#6B7280] dark:text-[#9CA3AF]/80" },
    purple: { bg: "bg-[#F5F3FF] dark:bg-[#4C1D95]/25", border: "border-[#DDD6FE] border-l-[#7C3AED] dark:border-[#4C1D95] dark:border-l-[#8B5CF6]", label: "text-[#6D28D9] dark:text-[#C4B5FD]", value: "text-[#5B21B6] dark:text-white", iconBg: "bg-[#EDE9FE] text-[#6D28D9] dark:bg-[#4C1D95]/60 dark:text-[#C4B5FD]", sub: "text-[#8B5CF6] dark:text-[#C4B5FD]/80" },
    cyan: { bg: "bg-[#ECFEFF] dark:bg-[#164E63]/25", border: "border-[#A5F3FC] border-l-[#0891B2] dark:border-[#164E63] dark:border-l-[#06B6D4]", label: "text-[#0E7490] dark:text-[#67E8F9]", value: "text-[#155E75] dark:text-white", iconBg: "bg-[#CFFAFE] text-[#0E7490] dark:bg-[#164E63]/60 dark:text-[#67E8F9]", sub: "text-[#06B6D4] dark:text-[#67E8F9]/80" },
  };
  const style = cardStyles[color] ?? cardStyles.blue;

  const renderIcon = () => {
    if (iconType === "help") return <HelpCircle className="w-4 h-4 shrink-0" />;
    if (iconType === "box") return <Layers className="w-4 h-4 shrink-0" />;
    if (iconType === "circle") return <Car className="w-4 h-4 shrink-0" />;
    if (iconType === "calendar") return <CalendarClock className="w-4 h-4 shrink-0" />;
    if (color === "red") return <AlertTriangle className="w-4 h-4 shrink-0" />;
    if (color === "yellow") return <Clock className="w-4 h-4 shrink-0" />;
    if (color === "green") return <CheckCircle2 className="w-4 h-4 shrink-0" />;
    return <BarChart3 className="w-4 h-4 shrink-0" />;
  };

  return (
    <div
      onClick={disabled || !onClick ? undefined : onClick}
      className={`rounded-xl border border-l-4 p-3.5 shadow-sm hover:shadow-md transition-all 
        ${style.bg} ${style.border}
        ${active ? "ring-2 ring-[#2563EB] ring-offset-1 scale-[1.01]" : ""}
        ${onClick && !disabled ? "cursor-pointer hover:scale-[1.02] active:scale-[0.98]" : ""}`}
    >
      <div className="flex items-center justify-between gap-1">
        <span className={`text-[17px] sm:text-[18px] font-extrabold uppercase tracking-wider truncate ${style.label}`}>
          {label}
        </span>
        <span className={`p-1.5 rounded-lg flex items-center justify-center shrink-0 ${style.iconBg}`}>
          {renderIcon()}
        </span>
      </div>
      <div className={`mt-2 text-2xl sm:text-3xl font-black tracking-tight ${style.value}`}>
        {typeof value === "number" ? value.toLocaleString("en-IN") : value}
      </div>
      {sub && (
        <div className={`mt-1 text-[16px] sm:text-[17px] font-semibold truncate ${style.sub}`}>
          {sub}
        </div>
      )}
    </div>
  );
};

const BreakdownRow = ({
  label, count, total, color = "blue", onClick, active = false, rank,
}: {
  label: string; count: number; total: number; color?: string;
  onClick?: () => void; active?: boolean; rank?: number;
}) => {
  const pct = total > 0 ? Math.min(Math.round((count / total) * 100), 100) : 0;
  const barColors: Record<string, string> = {
    blue: "bg-[#3B82F6]", amber: "bg-[#F59E0B]", yellow: "bg-[#F59E0B]",
    red: "bg-[#EF4444]", green: "bg-[#10B981]", purple: "bg-[#8B5CF6]",
    gray: "bg-[#6B7280]", cyan: "bg-[#06B6D4]", indigo: "bg-[#6366F1]", emerald: "bg-[#059669]",
  };
  const dotColors: Record<string, string> = {
    blue: "bg-[#3B82F6]", amber: "bg-[#F59E0B]", yellow: "bg-[#F59E0B]",
    red: "bg-[#EF4444]", green: "bg-[#10B981]", purple: "bg-[#8B5CF6]",
    gray: "bg-[#9CA3AF]", cyan: "bg-[#06B6D4]", indigo: "bg-[#6366F1]", emerald: "bg-[#059669]",
  };

  return (
    <div
      onClick={onClick}
      className={`group flex items-center justify-between py-1.5 px-2 rounded-lg transition-colors text-lg
        ${onClick ? "cursor-pointer hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]/60" : ""}
        ${active ? "bg-[#EFF6FF] dark:bg-[#1E3A8A]/30 font-semibold" : ""}`}
    >
      <div className="flex items-center gap-2 min-w-0 w-32 sm:w-40 shrink-0">
        {rank !== undefined ? (
          <span className="w-3.5 text-[14px] font-bold text-[#9CA3AF] text-right">{rank}</span>
        ) : (
          <span className={`w-2 h-2 rounded-full shrink-0 ${dotColors[color] || "bg-[#3B82F6]"}`} />
        )}
        <span className="truncate text-[#374151] dark:text-[#CBD5E1] font-semibold text-lg">
          {label}
        </span>
      </div>
      <div className="flex-1 mx-3 hidden sm:block">
        <div className="w-full bg-[#F1F5F9] dark:bg-[#1E293B] h-2 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColors[color] || "bg-[#3B82F6]"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <span className="text-lg font-mono font-bold text-[#0F172A] dark:text-white shrink-0 ml-1">
        {count.toLocaleString("en-IN")}
      </span>
    </div>
  );
};

// ============================================================
// DATE FILTER TYPE TOGGLE
// ============================================================
const DateFilterTypeToggle = ({ value, onChange }: { value: DateFilterType; onChange: (v: DateFilterType) => void }) => {
  const options: { label: string; value: DateFilterType; icon: string }[] = [
    { label: "Due Date", value: "due_date", icon: "📅" },
    { label: "Reminder Date", value: "reminder_date", icon: "🔔" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-lg border border-[#E5E7EB] dark:border-white/10 bg-[#F9FAFB] dark:bg-white/5 p-0.5 h-10">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-[16px] font-semibold transition-all whitespace-nowrap h-full
            ${value === opt.value
              ? "bg-white dark:bg-[#1E3A8A]/40 text-[#1D4ED8] dark:text-[#93C5FD] shadow-sm border border-[#BFDBFE] dark:border-[#1E3A8A]/60"
              : "text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#374151] dark:hover:text-[#E5E7EB]"
            }`}
        >
          <span>{opt.icon}</span>
          {opt.label}
        </button>
      ))}
    </div>
  );
};

// ============================================================
// SHOW CLOSED TOGGLE
// ============================================================
const ShowClosedToggle = ({ value, onChange }: { value: ShowClosedType; onChange: (v: ShowClosedType) => void }) => {
  const options: { label: string; value: ShowClosedType; icon: string; activeClass: string }[] = [
    { label: "Active", value: "active", icon: "🟢", activeClass: "bg-white dark:bg-[#14532D]/40 text-[#15803D] dark:text-[#86EFAC] shadow-sm border border-[#BBF7D0] dark:border-[#14532D]/60" },
    { label: "Closed", value: "closed", icon: "🔴", activeClass: "bg-white dark:bg-[#7F1D1D]/40 text-[#B91C1C] dark:text-[#FCA5A5] shadow-sm border border-[#FECACA] dark:border-[#450A0A]/60" },
    { label: "All", value: "all", icon: "📋", activeClass: "bg-white dark:bg-[#1E3A8A]/40 text-[#1D4ED8] dark:text-[#93C5FD] shadow-sm border border-[#BFDBFE] dark:border-[#1E3A8A]/60" },
  ];
  return (
    <div className="flex items-center gap-1 rounded-lg border border-[#E5E7EB] dark:border-white/10 bg-[#F9FAFB] dark:bg-white/5 p-0.5 h-10">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-[16px] font-semibold transition-all whitespace-nowrap h-full
            ${value === opt.value ? opt.activeClass : "text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#374151] dark:hover:text-[#E5E7EB]"}`}
        >
          <span>{opt.icon}</span>
          {opt.label}
        </button>
      ))}
    </div>
  );
};

// ============================================================
// ACTIVE FILTER PILLS
// ============================================================
const ActiveFilterPills = ({
  aLocCode, aModelName, aReminderStatus, aServiceStatus, aAppointmentStatus,
  aFromDate, aToDate, aDueToday, aOverdue, aUpcoming, aUnknown, aSearch, aShowClosed,
  defaultLocCode,
  onClear,
}: {
  aLocCode: string; aModelName: string; aReminderStatus: string; aServiceStatus: string;
  aAppointmentStatus: string; aFromDate: string; aToDate: string;
  aDueToday: boolean; aOverdue: boolean; aUpcoming: boolean; aUnknown: boolean;
  aSearch: string; aShowClosed: ShowClosedType; defaultLocCode: string;
  onClear: (key: string) => void;
}) => {
  const pills: { key: string; label: string }[] = [];

  if (aLocCode && aLocCode !== defaultLocCode) pills.push({ key: "loc", label: `Branch: ${aLocCode}` });
  if (aModelName) pills.push({ key: "model", label: `Model: ${aModelName}` });
  if (aReminderStatus) pills.push({ key: "reminderStatus", label: `R.Status: ${aReminderStatus}` });
  if (aServiceStatus) pills.push({ key: "serviceStatus", label: `S.Status: ${aServiceStatus}` });
  if (aAppointmentStatus) pills.push({ key: "appointmentStatus", label: `Appt: ${aAppointmentStatus}` });
  if (aFromDate) pills.push({ key: "fromDate", label: `From: ${aFromDate}` });
  if (aToDate) pills.push({ key: "toDate", label: `To: ${aToDate}` });
  if (aDueToday) pills.push({ key: "dueToday", label: "Due Today" });
  if (aOverdue) pills.push({ key: "overdue", label: "Overdue" });
  if (aUpcoming) pills.push({ key: "upcoming", label: "Upcoming" });
  if (aUnknown) pills.push({ key: "unknown", label: "Unknown Due" });
  if (aSearch) pills.push({ key: "search", label: `Search: ${aSearch}` });

  if (pills.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mb-3 items-center">
      <span className="text-[13px] font-bold text-[#6B7280] dark:text-[#9CA3AF] self-center">Active Filters:</span>
      {pills.map((p) => (
        <span
          key={p.key}
          className="inline-flex items-center gap-1 rounded-full bg-[#EFF6FF] dark:bg-[#1E3A8A]/30 text-[#1D4ED8] dark:text-[#93C5FD] border border-[#BFDBFE] dark:border-[#1E3A8A]/60 px-2.5 py-0.5 text-[13px] font-semibold"
        >
          {p.label}
          <button
            onClick={() => onClear(p.key)}
            className="ml-1 text-[15px] text-[#6B7280] hover:text-[#DC2626] leading-none"
          >
            ×
          </button>
        </span>
      ))}
      <button
        onClick={() => onClear("all")}
        className="ml-2 text-[13px] font-bold text-[#DC2626] hover:underline cursor-pointer"
      >
        Clear All
      </button>
    </div>
  );
};

// ============================================================
// MAIN PAGE
// ============================================================
const DashboardPage = () => {
  const user = useCurrentUser() as any;
  const router = useRouter()

  // ── Shared filter ──
  const [aShowClosed, setAShowClosed] = useState<ShowClosedType>("active");

  // ── Table filters ──
  const [aLocCode, setALocCode] = useState<string>("");
  const [aModelName, setAModelName] = useState<string>("");
  const [aSearch, setASearch] = useState<string>("");
  const [aReminderStatus, setAReminderStatus] = useState<string>("");
  const [aServiceStatus, setAServiceStatus] = useState<string>("");
  const [aAppointmentStatus, setAAppointmentStatus] = useState<string>("");
  const [aFromDate, setAFromDate] = useState<string>("");
  const [aToDate, setAToDate] = useState<string>("");
  const [aDueToday, setADueToday] = useState<boolean>(false);
  const [aOverdue, setAOverdue] = useState<boolean>(false);
  const [aUpcoming, setAUpcoming] = useState<boolean>(false); // ✅ NEW dedicated state
  const [aUnknown, setAUnknown] = useState<boolean>(false);
  const [aDateFilterType, setADateFilterType] = useState<DateFilterType>("due_date");

  // ── Data state ──
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);
  const [isLoadingTable, setIsLoadingTable] = useState<boolean>(false);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [reminderStatusBrk, setReminderStatusBrk] = useState<{ Reminder_Status: string; cnt: number }[]>([]);
  const [serviceStatusBrk, setServiceStatusBrk] = useState<{ Service_Status: string; cnt: number }[]>([]);
  const [appointmentStatusBrk, setAppointmentStatusBrk] = useState<{ Appointment_Status: string; cnt: number }[]>([]);
  const [channels, setChannels] = useState<{ Reminder_Channel: string; cnt: number }[]>([]);
  const [branches, setBranches] = useState<{ Loc_Code: string; Loc_Name: string; cnt: number }[]>([]);
  const [topModels, setTopModels] = useState<{ Model_Name: string; cnt: number }[]>([]);

  const [rows, setRows] = useState<ReminderRow[]>([]);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  // ── Default loc from user ──
  const defaultLocCode = useMemo(() => {
    const lc = user?.Loc_Code ?? user?.branch ?? "";
    return String(lc || "");
  }, [user?.Loc_Code, user?.branch]);

  useEffect(() => {
    if (defaultLocCode) {
      setALocCode(defaultLocCode);
    }
  }, [defaultLocCode]);

  // ── Auto scroll ref ──
  const tableRef = useRef<HTMLDivElement>(null);
  const scrollToTable = useCallback(() => {
    setTimeout(() => {
      tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  }, []);

  // ============================================================
  // PAYLOADS
  // ============================================================
  const summaryPayload = useMemo(
    () => ({
      Loc_Code: trimOrUndef(aLocCode) || trimOrUndef(defaultLocCode),
      Model_Name: trimOrUndef(aModelName),
      showClosed: aShowClosed,
    }),
    [aLocCode, defaultLocCode, aModelName, aShowClosed]
  );

  const tablePayload = useMemo(
    () => ({
      page,
      pageSize,
      search: trimOrUndef(aSearch),
      Loc_Code: trimOrUndef(aLocCode) || trimOrUndef(defaultLocCode),
      Model_Name: trimOrUndef(aModelName),
      Reminder_Status: trimOrUndef(aReminderStatus),
      Service_Status: trimOrUndef(aServiceStatus),
      Appointment_Status: trimOrUndef(aAppointmentStatus),
      fromDate: trimOrUndef(aFromDate),
      toDate: trimOrUndef(aToDate),
      dateFilterType: aDateFilterType,
      dueToday: aDueToday ? 1 : 0,
      overdue: aOverdue ? 1 : 0,
      upcoming: aUpcoming ? 1 : 0,  // ✅ NEW
      unknown: aUnknown ? 1 : 0,
      showClosed: aShowClosed,
    }),
    [
      page, pageSize, aSearch, aLocCode, defaultLocCode, aModelName,
      aReminderStatus, aServiceStatus, aAppointmentStatus,
      aFromDate, aToDate, aDateFilterType,
      aDueToday, aOverdue, aUpcoming, aUnknown, aShowClosed,
    ]
  );

  // ============================================================
  // FETCH
  // ============================================================
  const fetchSummary = useCallback(async () => {
    if (!user?.Comp_Code) return;
    setIsLoadingSummary(true);
    try {
      const res = await axios.post(
        `${BASE_URL}/Crm/getDashboardSummary`,
        summaryPayload,
        {
          headers: {
            accept: "application/json",
            compcode: user.Comp_Code,
            name: user.name,
            "Content-Type": "application/json",
          },
        }
      );
      const d: SummaryResponse = res.data;
      if (!d?.success) { showToast("Failed to fetch summary", "error"); return; }
      setTotals(d.metrics?.totals || null);
      setReminderStatusBrk(d.metrics?.breakdowns?.reminderStatus || []);
      setServiceStatusBrk(d.metrics?.breakdowns?.serviceStatus || []);
      setAppointmentStatusBrk(d.metrics?.breakdowns?.appointmentStatus || []);
      setChannels(d.metrics?.breakdowns?.channels || []);
      setBranches(d.metrics?.breakdowns?.branches || []);
      setTopModels(d.metrics?.breakdowns?.topModels || []);
    } catch (e: any) {
      console.error(e);
      showToast(e?.response?.data?.message ?? "Error fetching summary", "error");
    } finally {
      setIsLoadingSummary(false);
    }
  }, [user?.Comp_Code, user?.name, summaryPayload]);

  const fetchTable = useCallback(async () => {
    if (!user?.Comp_Code) return;
    setIsLoadingTable(true);
    try {
      const res = await axios.post(
        `${BASE_URL}/Crm/getDashboardTable`,
        tablePayload,
        {
          headers: {
            accept: "application/json",
            compcode: user.Comp_Code,
            name: user.name,
            "Content-Type": "application/json",
          },
        }
      );
      const d: TableResponse = res.data;
      if (!d?.success) { showToast("Failed to fetch table", "error"); return; }
      setRows(d.list?.data || []);
      setTotalPages(d.list?.pagination?.totalPages || 1);
      setTotalRecords(d.list?.pagination?.totalRecords || 0);
    } catch (e: any) {
      console.error(e);
      showToast(e?.response?.data?.message ?? "Error fetching table", "error");
      setRows([]);
    } finally {
      setIsLoadingTable(false);
    }
  }, [user?.Comp_Code, user?.name, tablePayload]);

  // ── Auto-fetch on payload change ──
  useEffect(() => { if (user?.Comp_Code) fetchTable(); }, [user?.Comp_Code, fetchTable]);
  useEffect(() => { if (user?.Comp_Code) fetchSummary(); }, [user?.Comp_Code, fetchSummary]);

  // ============================================================
  // RESET HELPER & HANDLERS
  // ============================================================
  const resetQuickFilters = () => {
    setADueToday(false);
    setAOverdue(false);
    setAUpcoming(false);
    setAUnknown(false);
    setAFromDate("");
    setAToDate("");
  };

  const clearAll = useCallback(() => {
    setALocCode(defaultLocCode);
    setAModelName("");
    setASearch("");
    setAReminderStatus("");
    setAServiceStatus("");
    setAAppointmentStatus("");
    setAFromDate("");
    setAToDate("");
    setADueToday(false);
    setAOverdue(false);
    setAUpcoming(false);
    setAUnknown(false);
    setADateFilterType("due_date");
    setAShowClosed("active");
    setPage(1);
    // scrollToTable();
  }, [defaultLocCode, scrollToTable]);

  // ── Refresh ──
  const refreshBoth = useCallback(async () => {
    if (!user?.Comp_Code) return;
    try {
      await Promise.all([fetchSummary(), fetchTable()]);
      showToast("Dashboard refreshed successfully", "success");
    } catch (e) {
      console.error(e);
    }
  }, [fetchSummary, fetchTable, user?.Comp_Code]);

  // ✅ Individual pill clear
  const clearPill = useCallback((key: string) => {
    if (key === "all") {
      clearAll();
      return;
    }
    switch (key) {
      case "loc": setALocCode(defaultLocCode); break;
      case "model": setAModelName(""); break;
      case "reminderStatus": setAReminderStatus(""); break;
      case "serviceStatus": setAServiceStatus(""); break;
      case "appointmentStatus": setAAppointmentStatus(""); break;
      case "fromDate": setAFromDate(""); break;
      case "toDate": setAToDate(""); break;
      case "dueToday": setADueToday(false); break;
      case "overdue": setAOverdue(false); break;
      case "upcoming": setAUpcoming(false); break;
      case "unknown": setAUnknown(false); break;
      case "search": setASearch(""); break;
    }
    setPage(1);
  }, [defaultLocCode, clearAll]);

  // ✅ DueToday toggle
  const toggleDueToday = useCallback(() => {
    const next = !aDueToday;
    setADueToday(next);
    if (next) {
      setAOverdue(false);
      setAUpcoming(false);
      setAUnknown(false);
      setAFromDate("");
      setAToDate("");
      setAServiceStatus("");
    }
    setPage(1);
    scrollToTable();
  }, [aDueToday, scrollToTable]);

  // ✅ Overdue toggle
  const toggleOverdue = useCallback(() => {
    const next = !aOverdue;
    setAOverdue(next);
    if (next) {
      setADueToday(false);
      setAUpcoming(false);
      setAUnknown(false);
      setAFromDate("");
      setAToDate("");
      setAServiceStatus("");
    }
    setPage(1);
    scrollToTable();
  }, [aOverdue, scrollToTable]);

  // ✅ Upcoming toggle — now uses dedicated `aUpcoming` state
  const toggleUpcoming = useCallback(() => {
    const next = !aUpcoming;
    setAUpcoming(next);
    if (next) {
      setADueToday(false);
      setAOverdue(false);
      setAUnknown(false);
      setAFromDate("");
      setAToDate("");
      setAServiceStatus("");
    }
    setPage(1);
    scrollToTable();
  }, [aUpcoming, scrollToTable]);

  // ✅ Completed toggle
  const toggleCompleted = useCallback(() => {
    const next = aServiceStatus !== "COMPLETED";
    setAServiceStatus(next ? "COMPLETED" : "");
    if (next) {
      setADueToday(false);
      setAOverdue(false);
      setAUpcoming(false);
      setAUnknown(false);
      setAFromDate("");
      setAToDate("");
    }
    setPage(1);
    scrollToTable();
  }, [aServiceStatus, scrollToTable]);

  // ✅ Unknown toggle
  const toggleUnknown = useCallback(() => {
    const next = !aUnknown;
    setAUnknown(next);
    if (next) {
      setADueToday(false);
      setAOverdue(false);
      setAUpcoming(false);
      setAFromDate("");
      setAToDate("");
      setAServiceStatus("");
    }
    setPage(1);
    scrollToTable();
  }, [aUnknown, scrollToTable]);

  // ✅ Breakdown clicks
  const clickReminderStatus = useCallback((s: string) => {
    setAReminderStatus((prev) => (prev === s ? "" : s));
    setPage(1);
    scrollToTable();
  }, [scrollToTable]);

  const clickServiceStatus = useCallback((s: string) => {
    setAServiceStatus((prev) => (prev === s ? "" : s));
    // Clear quick filters when clicking from breakdown
    setADueToday(false);
    setAOverdue(false);
    setAUpcoming(false);
    setAUnknown(false);
    setPage(1);
    scrollToTable();
  }, [scrollToTable]);

  const clickAppointmentStatus = useCallback((s: string) => {
    setAAppointmentStatus((prev) => (prev === s ? "" : s));
    setPage(1);
    scrollToTable();
  }, [scrollToTable]);

  const clickBranch = useCallback((code: string) => {
    setALocCode((prev) => (prev === code ? defaultLocCode : code));
    setPage(1);
    scrollToTable();
  }, [defaultLocCode, scrollToTable]);

  const clickModel = useCallback((model: string) => {
    setAModelName((prev) => (prev === model ? "" : model));
    setPage(1);
    scrollToTable();
  }, [scrollToTable]);

  const handleDateFilterTypeChange = useCallback((type: DateFilterType) => {
    setADateFilterType(type);
    setAFromDate("");
    setAToDate("");
    if (type === "reminder_date") {
      setADueToday(false);
      setAOverdue(false);
      setAUpcoming(false);
      setAUnknown(false);
    }
    setPage(1);
    scrollToTable();
  }, [scrollToTable]);

  const handleShowClosedChange = useCallback((val: ShowClosedType) => {
    setAShowClosed(val);
    setPage(1);
    scrollToTable();
  }, [scrollToTable]);

  // ============================================================
  // COLUMNS
  // ============================================================
  const columns = useMemo(
    () => [
      {
        Header: "Reg No",
        accessor: "Veh_Reg_No",
        Cell: ({ value }: any) => (
          <b className="text-[#1D4ED8] dark:text-[#60A5FA] font-mono tracking-wide">
            {value ?? "—"}
          </b>
        ),
      },
      { Header: "Customer", accessor: "Cust_Name" },
      { Header: "Mobile", accessor: "Cust_Mob" },
      { Header: "Model", accessor: "Model_Name" },
      {
        Header: "Branch",
        accessor: "Loc_Name",
        Cell: ({ row }: any) => row?.original?.Loc_Name || row?.original?.Loc_Code || "—",
      },
      {
        Header: "Last Svc Date",
        accessor: "Last_Service_Date",
        cellAlign: "center",
        Cell: ({ value }: any) => <span className="text-lg">{fmtDate(value)}</span>,
      },
      {
        Header: "Last KM",
        accessor: "Last_Service_KM",
        cellAlign: "right",
        Cell: ({ value }: any) => <span className="text-lg font-mono">{fmtNum(value)}</span>,
      },
      {
        Header: "Reminder Date",
        accessor: "Reminder_Date",
        cellAlign: "center",
        Cell: ({ value }: any) => <span className="text-lg">{fmtDate(value)}</span>,
      },
      {
        Header: "Final Due",
        accessor: "Final_Due_Date",
        cellAlign: "center",
        Cell: ({ value }: any) => <span className="text-lg font-semibold">{fmtDate(value)}</span>,
      },
      {
        Header: "Days Left",
        accessor: "Days_Until_Due",
        cellAlign: "center",
        Cell: ({ value }: any) =>
          value == null ? (
            <span className="text-[#9CA3AF] text-lg">—</span>
          ) : value < 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] px-2 py-0.5 text-[16px] font-bold whitespace-nowrap">
              {Math.abs(value)}d late
            </span>
          ) : value === 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#FEFCE8] border border-[#FDE68A] text-[#B45309] px-2 py-0.5 text-[16px] font-bold whitespace-nowrap">
              Today
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] px-2 py-0.5 text-[16px] font-semibold whitespace-nowrap">
              {value}d
            </span>
          ),
      },
      {
        Header: "Due Status",
        accessor: "Due_Status",
        cellAlign: "center",
        Cell: ({ value }: any) => {
          const map: Record<string, { bg: string; text: string; border: string }> = {
            DUE_TODAY: { bg: "bg-[#FEFCE8]", text: "text-[#B45309]", border: "border-[#FDE68A]" },
            OVERDUE: { bg: "bg-[#FEF2F2]", text: "text-[#B91C1C]", border: "border-[#FECACA]" },
            UPCOMING: { bg: "bg-[#F0FDF4]", text: "text-[#15803D]", border: "border-[#BBF7D0]" },
            COMPLETED: { bg: "bg-[#EFF6FF]", text: "text-[#1D4ED8]", border: "border-[#BFDBFE]" },
            UNKNOWN: { bg: "bg-[#F9FAFB]", text: "text-[#4B5563]", border: "border-[#E5E7EB]" },
          };
          const s = map[value] ?? map.UNKNOWN;
          return value ? (
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[15px] font-bold whitespace-nowrap ${s.bg} ${s.text} ${s.border}`}>
              {value}
            </span>
          ) : <span className="text-[#9CA3AF]">—</span>;
        },
      },
      {
        Header: "Reminder Status",
        accessor: "Reminder_Status",
        cellAlign: "center",
        Cell: ({ value }: any) => <ReminderStatusBadge status={value} />,
      },
      {
        Header: "Service Status",
        accessor: "Service_Status",
        cellAlign: "center",
        Cell: ({ value }: any) => <ServiceStatusBadge status={value} />,
      },
    ],
    []
  );

  const isLoadingAny = isLoadingSummary || isLoadingTable;

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="grid grid-cols-12 gap-3 sm:gap-4">

      {/* ── HEADER ── */}
      <div className="col-span-12">
        <div className="rounded-xl border border-[#1E293B] bg-header px-4 py-3 sm:px-5 sm:py-4 shadow-lg text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-white shrink-0">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-base sm:text-2xl uppercase tracking-wider text-white">
                  SERVICE REMINDER DASHBOARD
                </h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-[14px] font-medium bg-white/10 border border-white/10 text-white/80 rounded-full px-2.5 py-0.5">
                    {(totals?.totalReminders ?? totalRecords).toLocaleString("en-IN")} reminders
                  </span>
                  {(totals?.overdue ?? 0) > 0 && (
                    <span className="text-[14px] font-bold bg-[#DC2626]/20 border border-[#DC2626]/40 text-[#FCA5A5] rounded-full px-2.5 py-0.5">
                      ● {totals?.overdue} overdue
                    </span>
                  )}
                  <span className={`text-[14px] font-bold border rounded-full px-2.5 py-0.5 ${aShowClosed === "active" ? "bg-[#16A34A]/20 border-[#16A34A]/40 text-[#86EFAC]" : aShowClosed === "closed" ? "bg-[#DC2626]/20 border-[#DC2626]/40 text-[#FCA5A5]" : "bg-[#2563EB]/20 border-[#2563EB]/40 text-[#93C5FD]"}`}>
                    ● {aShowClosed === "active" ? "Active" : aShowClosed === "closed" ? "Closed" : "All"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <button
                onClick={clearAll}
                disabled={isLoadingAny}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-lg font-semibold text-white transition-all disabled:opacity-50"
              >
                 Reset
              </button>
              <button
                onClick={() => window.history.back()}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-lg font-semibold text-white transition-all"
              >
                 Back
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── METRIC CARDS ── */}
      <div className="col-span-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3">
          <MetricCard
            label="TOTAL"
            value={totals?.totalReminders ?? 0}
            color="blue"
            sub="All reminders"
            onClick={clearAll}
            iconType="barchart"
          />
          <MetricCard
            label="DUE TODAY"
            value={totals?.dueToday ?? 0}
            color="yellow"
            sub="Due today"
            onClick={toggleDueToday}
            active={aDueToday}
            iconType="barchart"
          />
          <MetricCard
            label="OVERDUE"
            value={totals?.overdue ?? 0}
            color="red"
            sub="Past final due"
            onClick={toggleOverdue}
            active={aOverdue}
            iconType="barchart"
          />
          <MetricCard
            label="UPCOMING"
            value={totals?.upcoming ?? 0}
            color="blue"
            sub="Scheduled ahead"
            onClick={toggleUpcoming}
            active={aUpcoming}  // ✅ uses dedicated state
            iconType="calendar"
          />
          <MetricCard
            label="COMPLETED"
            value={totals?.completed ?? 0}
            color="green"
            sub="Service done"
            onClick={toggleCompleted}
            active={aServiceStatus === "COMPLETED" && !aDueToday && !aOverdue && !aUpcoming && !aUnknown}
            iconType="barchart"
          />
          <MetricCard
            label="UNKNOWN"
            value={totals?.unknown ?? 0}
            color="gray"
            sub="No due date"
            onClick={toggleUnknown}
            active={aUnknown}
            iconType="help"
          />
          <MetricCard
            label="MASTER VEH."
            value={totals?.totalMasterVehiclesActive ?? 0}
            onClick={()=>(router.push("/autovyn/CRM/customer_vehicle/view"))}
            color="purple"
            sub="Total vehicles"
            iconType="box"
          />
        </div>
      </div>

      {/* ── BREAKDOWN ROW 1 ── */}
      <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">

        {/* Reminder Status */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-extrabold uppercase tracking-wider text-[#1E293B] dark:text-[#E2E8F0]">
              REMINDER STATUS
            </h3>
            <span className="bg-[#F1F5F9] dark:bg-[#1E293B] text-[#64748B] dark:text-[#9CA3AF] text-[16px] font-bold px-2.5 py-0.5 rounded-full">
              {reminderStatusBrk.reduce((s, x) => s + (x?.cnt || 0), 0)} total
            </span>
          </div>
          <div className="space-y-1">
            {reminderStatusBrk.length === 0 && <div className="text-lg text-[#9CA3AF] py-2">No data</div>}
            {reminderStatusBrk.map((r) => {
              const colorMap: Record<string, string> = {
                CLOSED: "gray", PENDING: "amber", SENT: "blue",
                FOLLOWUP: "purple", APPOINTMENT_BOOKED: "cyan", FAILED: "red", UNKNOWN: "gray",
              };
              return (
                <BreakdownRow
                  key={r.Reminder_Status}
                  label={r.Reminder_Status}
                  count={r.cnt}
                  total={reminderStatusBrk.reduce((s, x) => s + (x?.cnt || 0), 0)}
                  color={colorMap[r.Reminder_Status] || "blue"}
                  onClick={() => clickReminderStatus(r.Reminder_Status)}
                  active={aReminderStatus === r.Reminder_Status}
                />
              );
            })}
          </div>
        </Card>

        {/* Service Status */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-extrabold uppercase tracking-wider text-[#1E293B] dark:text-[#E2E8F0]">
              SERVICE STATUS
            </h3>
            <span className="bg-[#F1F5F9] dark:bg-[#1E293B] text-[#64748B] dark:text-[#9CA3AF] text-[16px] font-bold px-2.5 py-0.5 rounded-full">
              {serviceStatusBrk.reduce((s, x) => s + (x?.cnt || 0), 0)} total
            </span>
          </div>
          <div className="space-y-1">
            {serviceStatusBrk.length === 0 && <div className="text-lg text-[#9CA3AF] py-2">No data</div>}
            {serviceStatusBrk.map((r) => {
              const colorMap: Record<string, string> = {
                PENDING: "amber", COMPLETED: "green", CANCELLED: "red", IN_PROGRESS: "blue",
              };
              return (
                <BreakdownRow
                  key={r.Service_Status}
                  label={r.Service_Status}
                  count={r.cnt}
                  total={serviceStatusBrk.reduce((s, x) => s + (x?.cnt || 0), 0)}
                  color={colorMap[r.Service_Status] || "blue"}
                  // onClick={() => clickServiceStatus(r.Service_Status)}
                  active={aServiceStatus === r.Service_Status}
                />
              );
            })}
          </div>
        </Card>

        {/* Appointment Status */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-extrabold uppercase tracking-wider text-[#1E293B] dark:text-[#E2E8F0]">
              APPOINTMENT STATUS
            </h3>
            <span className="bg-[#F1F5F9] dark:bg-[#1E293B] text-[#64748B] dark:text-[#9CA3AF] text-[16px] font-bold px-2.5 py-0.5 rounded-full">
              {appointmentStatusBrk.reduce((s, x) => s + (x?.cnt || 0), 0)} total
            </span>
          </div>
          <div className="space-y-1">
            {appointmentStatusBrk.length === 0 && <div className="text-lg text-[#9CA3AF] py-2">No data</div>}
            {appointmentStatusBrk.map((r) => {
              const colorMap: Record<string, string> = {
                NONE: "gray", COMPLETED: "green", CONFIRMED: "blue",
                SCHEDULED: "amber", PENDING: "yellow", CANCELLED: "red",
              };
              return (
                <BreakdownRow
                  key={r.Appointment_Status}
                  label={r.Appointment_Status}
                  count={r.cnt}
                  total={appointmentStatusBrk.reduce((s, x) => s + (x?.cnt || 0), 0)}
                  color={colorMap[r.Appointment_Status] || "blue"}
                  onClick={() => clickAppointmentStatus(r.Appointment_Status)}
                  active={aAppointmentStatus === r.Appointment_Status}
                />
              );
            })}
          </div>
        </Card>
      </div>

      {/* ── BREAKDOWN ROW 2 ── */}
      <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">

        {/* Channels */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-extrabold uppercase tracking-wider text-[#1E293B] dark:text-[#E2E8F0]">
              CHANNELS
            </h3>
            <span className="bg-[#F1F5F9] dark:bg-[#1E293B] text-[#64748B] dark:text-[#9CA3AF] text-[16px] font-bold px-2.5 py-0.5 rounded-full">
              {channels.reduce((s, x) => s + (x?.cnt || 0), 0)} total
            </span>
          </div>
          <div className="space-y-1">
            {channels.length === 0 && <div className="text-lg text-[#9CA3AF] py-2">No data</div>}
            {channels.map((r) => {
              const colorMap: Record<string, string> = {
                MANUAL_CALL: "blue", AI_CALL: "purple", MANUAL_AI_CALL: "indigo",
                SMS: "green", WHATSAPP: "emerald", EMAIL: "amber", UNKNOWN: "gray",
              };
              return (
                <BreakdownRow
                  key={r.Reminder_Channel}
                  label={r.Reminder_Channel}
                  count={r.cnt}
                  total={channels.reduce((s, x) => s + (x?.cnt || 0), 0)}
                  color={colorMap[r.Reminder_Channel] || "blue"}
                />
              );
            })}
          </div>
        </Card>

       

        {/* Top Models */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-extrabold uppercase tracking-wider text-[#1E293B] dark:text-[#E2E8F0]">
              TOP MODELS
            </h3>
            <span className="bg-[#F1F5F9] dark:bg-[#1E293B] text-[#64748B] dark:text-[#9CA3AF] text-[16px] font-bold px-2.5 py-0.5 rounded-full">
              {topModels.reduce((s, x) => s + (x?.cnt || 0), 0)} total
            </span>
          </div>
          <div className="space-y-1">
            {topModels.length === 0 && <div className="text-lg text-[#9CA3AF] py-2">No data</div>}
            {topModels.map((m, idx) => (
              <BreakdownRow
                key={m.Model_Name}
                rank={idx + 1}
                label={m.Model_Name}
                count={m.cnt}
                total={topModels.reduce((s, x) => s + (x?.cnt || 0), 0)}
                color="blue"
                onClick={() => clickModel(m.Model_Name)}
                active={aModelName === m.Model_Name}
              />
            ))}
          </div>
        </Card>
      </div>

      {/* ── TABLE ── */}
      <div className="col-span-12" ref={tableRef}>
        <Card>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 className="text-[14px] font-bold uppercase tracking-wider text-gray">
              Reminders — {totalRecords.toLocaleString("en-IN")} records
            </h3>
          </div>

          {/* ── ACTIVE FILTER PILLS ── */}
          <ActiveFilterPills
            aLocCode={aLocCode}
            aModelName={aModelName}
            aReminderStatus={aReminderStatus}
            aServiceStatus={aServiceStatus}
            aAppointmentStatus={aAppointmentStatus}
            aFromDate={aFromDate}
            aToDate={aToDate}
            aDueToday={aDueToday}
            aOverdue={aOverdue}
            aUpcoming={aUpcoming}
            aUnknown={aUnknown}
            aSearch={aSearch}
            aShowClosed={aShowClosed}
            defaultLocCode={defaultLocCode}
            onClear={clearPill}
          />

          {/* ── FILTER SECTION ── */}
          <div className="mb-3 p-3 rounded-xl border border-[#E5E7EB] dark:border-white/10 bg-[#F9FAFB] dark:bg-white/5">
            <div className="flex flex-col lg:flex-row lg:items-end lg:flex-wrap gap-2 sm:gap-3">

              {/* Records Status */}
              <div className="flex flex-col gap-1">
                <span className="text-[17px] font-bold tracking-wider text-[#193A69] dark:text-[#E2E8F0]">
                  Records
                </span>
                <ShowClosedToggle value={aShowClosed} onChange={handleShowClosedChange} />
              </div>

              <div className="hidden lg:block w-px h-8 bg-[#E5E7EB] dark:bg-white/10 shrink-0 self-end mb-1" />

              {/* Date Filter Type */}
              <div className="flex flex-col gap-1">
                <span className="text-[17px] font-bold tracking-wider text-[#193A69] dark:text-[#E2E8F0]">
                  Date Filter By
                </span>
                <DateFilterTypeToggle value={aDateFilterType} onChange={handleDateFilterTypeChange} />
              </div>

              <div className="hidden lg:block w-px h-8 bg-[#E5E7EB] dark:bg-white/10 shrink-0 self-end mb-1" />

              {/* Date Range */}
              <div className="flex items-end gap-2 flex-wrap">
                <div className="w-36">
                  <Ainput
                    title="From Date"
                    type="date"
                    name="fromDate"
                    value={aFromDate}
                    handleInputChange={(_, value) => {
                      setAFromDate(value);
                      setADueToday(false);
                      setAOverdue(false);
                      setAUpcoming(false);
                      setAUnknown(false);
                      setPage(1);
                      scrollToTable();
                    }}
                    onInput={() => {}}
                    redlabel=""
                    labelClass="text-[17px]"
                    className="!h-10 !text-[17px]"
                  />
                </div>
                <div className="w-36">
                  <Ainput
                    title="To Date"
                    type="date"
                    name="toDate"
                    value={aToDate}
                    handleInputChange={(_, value) => {
                      setAToDate(value);
                      setADueToday(false);
                      setAOverdue(false);
                      setAUpcoming(false);
                      setAUnknown(false);
                      setPage(1);
                      scrollToTable();
                    }}
                    onInput={() => {}}
                    redlabel=""
                    labelClass="text-[17px]"
                    className="!h-10 !text-[17px]"
                  />
                </div>
                {(aFromDate || aToDate) && (
                  <button
                    onClick={() => { setAFromDate(""); setAToDate(""); setPage(1); }}
                    className="text-[14px] font-semibold text-[#EF4444] hover:text-[#B91C1C] border border-[#FECACA] rounded-lg px-2.5 py-2 bg-[#FEF2F2] hover:bg-[#FEE2E2] transition-colors shrink-0 whitespace-nowrap mb-0.5 h-10"
                  >
                    ✕ Clear
                  </button>
                )}
              </div>

              <div className="hidden lg:block w-px h-8 bg-[#E5E7EB] dark:bg-white/10 shrink-0 self-end mb-1" />

              {/* Search */}
              <div className="w-full lg:flex-1 lg:min-w-[200px]">
                <Ainput
                  title="Search"
                  type="text"
                  name="search"
                  value={aSearch}
                  handleInputChange={(_, value) => {
                    setASearch(value);
                    setPage(1);
                    scrollToTable();
                  }}
                  onInput={() => {}}
                  redlabel=""
                  placeholder="Reg No, Customer, Mobile, Model..."
                  labelClass="text-[17px]"
                  className="!h-10 !text-[17px]"
                />
              </div>
            </div>
          </div>

          <DataTable
            title=""
            columns={columns as any}
            selectValue="UTD"
            data={rows}
            height={470}
            size="text-[17px]"
            filterPosition="FilterData"
            enableColumnFilters={true}
            numericFilterColumns={["UTD", "Last_Service_KM", "Next_Service_KM", "Days_Until_Due"]}
            serverMode={true}
            serverPagination={{
              currentPage: page,
              pageSize,
              totalPages,
              totalRecords,
            }}
            onServerPageChange={(p: number) => setPage(p)}
            onServerPageSizeChange={(s: number) => { setPageSize(s); setPage(1); }}
            
          />
        </Card>
      </div>

      <HashloaderComponent isLoading={isLoadingAny} />
    </div>
  );
};

export default DashboardPage;