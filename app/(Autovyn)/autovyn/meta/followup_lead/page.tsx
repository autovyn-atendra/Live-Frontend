"use client";

import React, { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import { Button } from "@/components/ui/button";
import HashloaderComponent from "@/components/Templates/hashloader";
import Ainput from "@/components/atoms/Input";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  Phone,
  RefreshCw,
  Search,
  User,
  PhoneCall,
  X,
} from "lucide-react";
import { useCurrentUser } from "@/app/hooks/use-current-user";

// ============================================================
// CONSTANTS & TYPES
// ============================================================
const BASE_URL = process.env.NEXT_PUBLIC_URL;

type FollowupRecord = {
  UTD: number;
  Meta_Lead_UTD: number;
  Followup_Date: string;
  Followup_Time: string | null;
  Followup_Type: string;
  Followup_Status: string;
  Purpose: string | null;
  Remark: string | null;
  Assigned_To: string | null;
  Assigned_Name: string | null;
  Completed_At: string | null;
  Completed_By: string | null;
  Rescheduled_From_UTD: number | null;
  Created_By: string | null;
  Created_At: string;
  customerName: string | null;
  phone: string | null;
  email: string | null;
  companyName: string | null;
  city: string | null;
  category: "OVERDUE" | "TODAY" | "UPCOMING" | string;
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

const formatDateStr = (dateStr: string | null): string => {
  if (!dateStr) return "—";
  try {
    const str = String(dateStr).trim();
    if (!str) return "—";

    // Date-only format (e.g., "2026-08-19")
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [year, month, day] = str.split("-").map(Number);
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }

    const match = str.match(/^(\d{4})[-/](\d{2})[-/](\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/);
    if (match) {
      const [, y, m, d, h, min] = match;
      const year = Number(y);
      const month = Number(m) - 1;
      const day = Number(d);
      const hour = Number(h);
      const minute = Number(min);

      const localDate = new Date(year, month, day, hour, minute);
      return localDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }

    const cleanStr = str.endsWith("Z") ? str.slice(0, -1) : str;
    const d = new Date(cleanStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

const formatTimeStr = (timeStr: string | null): string => {
  if (!timeStr) return "11:00 AM";
  try {
    const str = String(timeStr).trim();
    if (!str) return "11:00 AM";

    if (str.includes("T")) {
      const timePart = str.split("T")[1];
      const parts = timePart.split(":");
      let h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) || 0;
      if (isNaN(h)) return "11:00 AM";
      const ampm = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
    }

    if (str.includes(":")) {
      const parts = str.split(":");
      let h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) || 0;
      if (isNaN(h)) return str;
      const ampm = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
    }

    return str;
  } catch {
    return timeStr || "11:00 AM";
  }
};

const get24HourTimeStr = (timeStr: string | null): string => {
  if (!timeStr) return "11:00";
  try {
    const str = String(timeStr).trim();
    if (str.includes("T")) {
      return str.split("T")[1].slice(0, 5);
    }
    if (str.includes(":")) {
      return str.slice(0, 5);
    }
    return "11:00";
  } catch {
    return "11:00";
  }
};

const DAYS_OF_WEEK = ["S", "M", "T", "W", "T", "F", "S"];

// ============================================================
// MAIN FOLLOWUP PAGE COMPONENT
// ============================================================
export default function FollowupLeadPage() {
  const user: any = useCurrentUser();

  // ── Dynamic Calendar State ──────────────────────────────
  const today = new Date();
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [activeDateFilter, setActiveDateFilter] = useState<string | null>(null);

  // ── Followup State ────────────────────────────────────────
  const [followups, setFollowups] = useState<FollowupRecord[]>([]);
  const [counts, setCounts] = useState<{ overdueCount: number; todayCount: number; upcomingCount: number }>({
    overdueCount: 0,
    todayCount: 0,
    upcomingCount: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Mark Done Modal State ────────────────────────────────
  const [markDoneItem, setMarkDoneItem] = useState<FollowupRecord | null>(null);
  const [markDoneResult, setMarkDoneResult] = useState<string>("CONNECTED");
  const [markDoneRemark, setMarkDoneRemark] = useState<string>("");

  // ── Reschedule Modal State ──────────────────────────────
  const [rescheduleItem, setRescheduleItem] = useState<FollowupRecord | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>("");
  const [rescheduleTime, setRescheduleTime] = useState<string>("11:00");
  const [rescheduleReason, setRescheduleReason] = useState<string>("");

  // ── Dynamic Calendar Calculations ────────────────────────
  const currentYear = currentMonthDate.getFullYear();
  const currentMonth = currentMonthDate.getMonth();
  const monthNameYear = currentMonthDate.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const monthDaysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blankOffsetSlots = Array.from({ length: firstDayOfWeek }, (_, i) => i);

  // ============================================================
  // FETCH FOLLOW-UPS FROM REAL BACKEND API
  // ============================================================
  const fetchFollowups = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.post(
        `${BASE_URL}/meta/getFollowups`,
        { limit: 500, status: "PENDING" },
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
        setFollowups(Array.isArray(res.data.data) ? res.data.data : []);
        if (res.data.counts) {
          setCounts({
            overdueCount: res.data.counts.overdueCount || 0,
            todayCount: res.data.counts.todayCount || 0,
            upcomingCount: res.data.counts.upcomingCount || 0,
          });
        }
      } else {
        setFollowups([]);
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message ?? "Error fetching follow-ups", "error");
      setFollowups([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.Comp_Code, user?.name]);

  useEffect(() => {
    fetchFollowups();
  }, [fetchFollowups]);

  const handlePrevMonth = () => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleSelectDay = (dayNum: number) => {
    const clickedDate = new Date(currentYear, currentMonth, dayNum);
    setSelectedDate(clickedDate);
    const yyyy = currentYear;
    const mm = String(currentMonth + 1).padStart(2, "0");
    const dd = String(dayNum).padStart(2, "0");
    const dateKey = `${yyyy}-${mm}-${dd}`;
    setActiveDateFilter(dateKey);
  };

  // Visible follow-ups filtering
  const visibleFollowups = activeDateFilter
    ? followups.filter((f) => String(f.Followup_Date).startsWith(activeDateFilter))
    : followups;

  const overdueItems = visibleFollowups.filter((f) => f.category === "OVERDUE");
  const todayItems = visibleFollowups.filter((f) => f.category === "TODAY");
  const upcomingItems = visibleFollowups.filter((f) => f.category === "UPCOMING");

  // ============================================================
  // MARK DONE MODAL HANDLER
  // ============================================================
  const openMarkDoneModal = (item: FollowupRecord) => {
    setMarkDoneItem(item);
    setMarkDoneResult("CONNECTED");
    setMarkDoneRemark("");
  };

  const confirmMarkDone = async () => {
    if (!markDoneItem || isSubmitting) return;
    try {
      setIsSubmitting(true);
      const res = await axios.post(
        `${BASE_URL}/meta/completeFollowup`,
        {
          followupUtd: markDoneItem.UTD,
          metaLeadUtd: markDoneItem.Meta_Lead_UTD,
          result: markDoneResult,
          remark: markDoneRemark.trim() || `Follow-up completed with result: ${markDoneResult}`,
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
        showToast(`Followup for ${markDoneItem.customerName || "Customer"} completed! 🎉`, "success");
        setMarkDoneItem(null);
        fetchFollowups();
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message ?? "Failed to complete follow-up", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================
  // RESCHEDULE MODAL HANDLER
  // ============================================================
  const openRescheduleModal = (item: FollowupRecord) => {
    setRescheduleItem(item);
    // Default tomorrow
    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    const yyyy = tom.getFullYear();
    const mm = String(tom.getMonth() + 1).padStart(2, "0");
    const dd = String(tom.getDate()).padStart(2, "0");
    setRescheduleDate(`${yyyy}-${mm}-${dd}`);
    setRescheduleTime(get24HourTimeStr(item.Followup_Time));
    setRescheduleReason("");
  };

  const confirmReschedule = async () => {
    if (!rescheduleItem || !rescheduleDate || isSubmitting) {
      showToast("Please enter a new date for rescheduling", "warning");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await axios.post(
        `${BASE_URL}/meta/rescheduleFollowup`,
        {
          followupUtd: rescheduleItem.UTD,
          metaLeadUtd: rescheduleItem.Meta_Lead_UTD,
          newDate: rescheduleDate,
          newTime: rescheduleTime,
          reason: rescheduleReason.trim() || "Rescheduled follow-up",
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
        showToast(`Follow-up rescheduled for ${rescheduleItem.customerName || "Customer"}!`, "success");
        setRescheduleItem(null);
        fetchFollowups();
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message ?? "Failed to reschedule follow-up", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Call & WhatsApp Actions
  const handleWhatsApp = async (phone: string, name: string, leadUtd: number) => {
    const cleanPhone = phone.replace(/\D/g, "");
    window.open(`https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(name || "")},%20following%20up%20on%20our%20discussion.`, "_blank");
    try {
      await axios.post(
        `${BASE_URL}/meta/addActivity`,
        {
          metaLeadUtd: leadUtd,
          activityType: "WHATSAPP",
          activityStatus: "OPENED",
          remark: "Opened WhatsApp chat from Followups Action Center",
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
    } catch (e) {}
  };

  const handleCall = async (phone: string, leadUtd: number) => {
    window.open(`tel:${phone}`);
    try {
      await axios.post(
        `${BASE_URL}/meta/addActivity`,
        {
          metaLeadUtd: leadUtd,
          activityType: "CALL",
          activityStatus: "INITIATED",
          remark: "Call initiated from Followups Action Center",
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
    } catch (e) {}
  };

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] dark:bg-[#090D16] p-4 sm:p-6 flex flex-col gap-6 font-sans text-[#334155] dark:text-[#F1F5F9]">
      
      {/* ══ PAGE HEADER ══ */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] dark:text-white tracking-tight">
            Followups
          </h1>
          <p className="text-lg font-medium text-[#64748B] dark:text-[#94A3B8] mt-0.5">
            Stay on top of every conversation · Real-time status sync & activity logs
          </p>
        </div>

        <Button
          onClick={fetchFollowups}
          disabled={isLoading}
          size="lg"
          variant="outline"
        >
          Refresh Queues
        </Button>
      </div>

      {/* ══ 2-COLUMN MAIN CONTENT GRID ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ── LEFT COLUMN (4 COLS): DYNAMIC CALENDAR SIDEBAR CARD ── */}
        <div className="lg:col-span-4 bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-2xl p-5 shadow-xs space-y-5">
          
          {/* Calendar Header Month & Controls */}
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[#0F172A] dark:text-white text-lg">
              {monthNameYear}
            </h3>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevMonth}
                className="w-7 h-7 p-0 rounded-lg border-[#E2E8F0] dark:border-[#334155] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC] cursor-pointer"
              >
                <ChevronLeft size={16} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextMonth}
                className="w-7 h-7 p-0 rounded-lg border-[#E2E8F0] dark:border-[#334155] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC] cursor-pointer"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center text-lg font-bold text-[#94A3B8]">
            {DAYS_OF_WEEK.map((d, i) => (
              <div key={i} className="py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Days Number Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-lg font-bold">
            {blankOffsetSlots.map((_, i) => (
              <div key={`blank-${i}`} className="p-2 text-transparent select-none">
                0
              </div>
            ))}

            {monthDaysArray.map((dayNum) => {
              const isSelected =
                selectedDate.getFullYear() === currentYear &&
                selectedDate.getMonth() === currentMonth &&
                selectedDate.getDate() === dayNum;

              let styleCls = "text-[#334155] dark:text-[#E2E8F0] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B]";

              if (isSelected) {
                styleCls = "bg-[#4F46E5] text-white shadow-md font-bold rounded-xl";
              }

              return (
                <button
                  key={dayNum}
                  onClick={() => handleSelectDay(dayNum)}
                  className={`h-8 flex items-center justify-center rounded-xl cursor-pointer transition-all ${styleCls}`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          {/* Category Summary Legend */}
          <div className="pt-4 border-t border-[#F1F5F9] dark:border-[#1E293B] space-y-2.5 text-lg font-bold">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E11D48]" />
                <span className="text-[#64748B]">Overdue</span>
              </div>
              <span className="text-[#E11D48]">{counts.overdueCount || overdueItems.length}</span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
                <span className="text-[#64748B]">Today</span>
              </div>
              <span className="text-[#D97706]">{counts.todayCount || todayItems.length}</span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#64748B]" />
                <span className="text-[#64748B]">Upcoming</span>
              </div>
              <span className="text-[#64748B]">{counts.upcomingCount || upcomingItems.length}</span>
            </div>
          </div>

        </div>

        {/* ── RIGHT COLUMN (8 COLS): FOLLOWUP CARDS GROUPED BY STATUS ── */}
        <div className="lg:col-span-8 flex flex-col gap-6">

          {/* Active Date Filter Banner */}
          {activeDateFilter && (
            <div className="flex items-center justify-between bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-2xl p-3 px-4 shadow-2xs">
              <span className="text-lg font-bold text-[#4F46E5] dark:text-[#818CF8] flex items-center gap-2">
                <CalendarIcon size={16} />
                Showing followups for {selectedDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} ({visibleFollowups.length} found)
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setActiveDateFilter(null)}
                className="font-bold rounded-xl border-[#E2E8F0] px-3 py-1 cursor-pointer"
              >
                Show All Dates
              </Button>
            </div>
          )}

          {/* Empty State when no followups */}
          {visibleFollowups.length === 0 && !isLoading && (
            <div className="bg-white dark:bg-[#0F172A] border-2 border-dashed border-[#E2E8F0] dark:border-[#1E293B] rounded-2xl p-10 text-center space-y-3">
              <CalendarIcon size={36} className="mx-auto text-[#94A3B8]" />
              <h3 className="text-lg font-bold text-[#334155] dark:text-[#E2E8F0]">
                No pending follow-ups found
              </h3>
              <p className="text-lg text-[#94A3B8]">
                All clear! No pending follow-ups match your selected date.
              </p>
              <Button
                size="lg"
                onClick={() => setActiveDateFilter(null)}
                className="bg-[#4F46E5] max-w-xl text-white font-bold rounded-xl h-11 px-4 py-2 mt-2 cursor-pointer"
              >
                View All Dates
              </Button>
            </div>
          )}

          {/* GROUP 1: 🔴 OVERDUE */}
          {overdueItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E11D48]" />
                <h3 className="text-lg font-bold uppercase tracking-wider text-[#E11D48]">
                  Overdue
                </h3>
                <span className="bg-[#FFE4E6] text-[#E11D48] text-lg font-bold px-2 py-0.5 rounded-full">
                  {overdueItems.length}
                </span>
              </div>

              <div className="space-y-3">
                {overdueItems.map((item) => (
                  <div
                    key={item.UTD}
                    className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] border-l-4 border-l-[#E11D48] rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-wrap items-center justify-between gap-4"
                  >
                    <div className="space-y-1 max-w-md">
                      <h4 className="font-bold text-[#0F172A] dark:text-white text-lg">
                        {item.customerName || "Customer"}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 text-lg">
                        <span className="font-bold text-[#4F46E5] dark:text-[#818CF8]">
                          {item.phone || "—"}
                        </span>
                        <span className="text-[#94A3B8] font-medium">•</span>
                        <span className="text-[#64748B] dark:text-[#CBD5E1] font-medium">
                          Due: {formatDateStr(item.Followup_Date)}, {formatTimeStr(item.Followup_Time)}
                        </span>
                      </div>
                      <p className="text-lg italic text-[#64748B] dark:text-[#94A3B8] pt-1">
                        "{item.Purpose || item.Remark || "Follow-up required"}"
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleCall(item.phone || "", item.Meta_Lead_UTD)}
                        className="bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE] px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                      >
                        <PhoneCall size={14} /> Call
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => handleWhatsApp(item.phone || "", item.customerName || "", item.Meta_Lead_UTD)}
                        className="bg-[#DCFCE7] hover:bg-[#BBF7D0] text-[#15803D] border border-[#86EFAC] px-3.5 py-1.5 rounded-xl text-lg font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                      >
                        WhatsApp
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openMarkDoneModal(item)}
                        className="bg-white dark:bg-[#1E293B] hover:bg-[#F8FAFC] text-[#334155] dark:text-[#E2E8F0] border border-[#E2E8F0] dark:border-[#334155] px-3.5 py-1.5 rounded-xl text-lg font-bold shadow-2xs transition-all cursor-pointer"
                      >
                        Mark Done
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openRescheduleModal(item)}
                        className="bg-white dark:bg-[#1E293B] hover:bg-[#F8FAFC] text-[#334155] dark:text-[#E2E8F0] border border-[#E2E8F0] dark:border-[#334155] px-3.5 py-1.5 rounded-xl text-lg font-bold shadow-2xs transition-all cursor-pointer"
                      >
                        Reschedule
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GROUP 2: 🟠 TODAY */}
          {todayItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
                <h3 className="text-lg font-bold uppercase tracking-wider text-[#D97706]">
                  Today
                </h3>
                <span className="bg-[#FEF3C7] text-[#B45309] text-lg font-bold px-2 py-0.5 rounded-full">
                  {todayItems.length}
                </span>
              </div>

              <div className="space-y-3">
                {todayItems.map((item) => (
                  <div
                    key={item.UTD}
                    className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] border-l-4 border-l-[#D97706] rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-wrap items-center justify-between gap-4"
                  >
                    <div className="space-y-1 max-w-md">
                      <h4 className="font-bold text-[#0F172A] dark:text-white text-lg">
                        {item.customerName || "Customer"}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 text-lg">
                        <span className="font-bold text-[#4F46E5] dark:text-[#818CF8]">
                          {item.phone || "—"}
                        </span>
                        <span className="text-[#94A3B8] font-medium">•</span>
                        <span className="text-[#64748B] dark:text-[#CBD5E1] font-medium">
                          Today, {formatTimeStr(item.Followup_Time)}
                        </span>
                      </div>
                      <p className="text-lg italic text-[#64748B] dark:text-[#94A3B8] pt-1">
                        "{item.Purpose || item.Remark || "Follow-up scheduled for today"}"
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleCall(item.phone || "", item.Meta_Lead_UTD)}
                        className="bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE] px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                      >
                        <PhoneCall size={14} /> Call
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => handleWhatsApp(item.phone || "", item.customerName || "", item.Meta_Lead_UTD)}
                        className="bg-[#DCFCE7] hover:bg-[#BBF7D0] text-[#15803D] border border-[#86EFAC] px-3.5 py-1.5 rounded-xl text-lg font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                      >
                        WhatsApp
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openMarkDoneModal(item)}
                        className="bg-white dark:bg-[#1E293B] hover:bg-[#F8FAFC] text-[#334155] dark:text-[#E2E8F0] border border-[#E2E8F0] dark:border-[#334155] px-3.5 py-1.5 rounded-xl text-lg font-bold shadow-2xs transition-all cursor-pointer"
                      >
                        Mark Done
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openRescheduleModal(item)}
                        className="bg-white dark:bg-[#1E293B] hover:bg-[#F8FAFC] text-[#334155] dark:text-[#E2E8F0] border border-[#E2E8F0] dark:border-[#334155] px-3.5 py-1.5 rounded-xl text-lg font-bold shadow-2xs transition-all cursor-pointer"
                      >
                        Reschedule
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GROUP 3: ⚪ UPCOMING */}
          {upcomingItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#64748B]" />
                <h3 className="text-lg font-bold uppercase tracking-wider text-[#64748B]">
                  Upcoming
                </h3>
                <span className="bg-[#F1F5F9] text-[#64748B] text-lg font-bold px-2 py-0.5 rounded-full">
                  {upcomingItems.length}
                </span>
              </div>

              <div className="space-y-3">
                {upcomingItems.map((item) => (
                  <div
                    key={item.UTD}
                    className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] border-l-4 border-l-[#4F46E5] rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-wrap items-center justify-between gap-4"
                  >
                    <div className="space-y-1 max-w-md">
                      <h4 className="font-bold text-[#0F172A] dark:text-white text-lg">
                        {item.customerName || "Customer"}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 text-lg">
                        <span className="font-bold text-[#4F46E5] dark:text-[#818CF8]">
                          {item.phone || "—"}
                        </span>
                        <span className="text-[#94A3B8] font-medium">•</span>
                        <span className="text-[#64748B] dark:text-[#CBD5E1] font-medium">
                          {formatDateStr(item.Followup_Date)}, {formatTimeStr(item.Followup_Time)}
                        </span>
                      </div>
                      <p className="text-lg italic text-[#64748B] dark:text-[#94A3B8] pt-1">
                        "{item.Purpose || item.Remark || "Upcoming scheduled follow-up"}"
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleCall(item.phone || "", item.Meta_Lead_UTD)}
                        className="bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE] px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                      >
                        <PhoneCall size={14} /> Call
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => handleWhatsApp(item.phone || "", item.customerName || "", item.Meta_Lead_UTD)}
                        className="bg-[#DCFCE7] hover:bg-[#BBF7D0] text-[#15803D] border border-[#86EFAC] px-3.5 py-1.5 rounded-xl text-lg font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                      >
                        WhatsApp
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openMarkDoneModal(item)}
                        className="bg-white dark:bg-[#1E293B] hover:bg-[#F8FAFC] text-[#334155] dark:text-[#E2E8F0] border border-[#E2E8F0] dark:border-[#334155] px-3.5 py-1.5 rounded-xl text-lg font-bold shadow-2xs transition-all cursor-pointer"
                      >
                        Mark Done
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openRescheduleModal(item)}
                        className="bg-white dark:bg-[#1E293B] hover:bg-[#F8FAFC] text-[#334155] dark:text-[#E2E8F0] border border-[#E2E8F0] dark:border-[#334155] px-3.5 py-1.5 rounded-xl text-lg font-bold shadow-2xs transition-all cursor-pointer"
                      >
                        Reschedule
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* ══ MARK DONE RESULT MODAL ══ */}
      {markDoneItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-3xl p-6 shadow-2xl w-full max-w-md space-y-4">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] dark:border-[#1E293B] pb-3">
              <h3 className="text-2xl text-[#0F172A] dark:text-white font-bold flex items-center gap-2">
                <CheckCircle2 size={20} className="text-[#16A34A]" />
                Complete Followup
              </h3>
              <button
                onClick={() => setMarkDoneItem(null)}
                className="text-[#94A3B8] hover:text-[#475569] cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-lg font-semibold text-[#64748B] dark:text-[#94A3B8]">
              Completing follow-up for <span className=" font-medium  text-[#0F172A] dark:text-white">{markDoneItem.customerName || "Customer"}</span>
            </p>

            <div>
              <label className="block text-lg font-medium text-[#334155] dark:text-[#CBD5E1] mb-1">
                Follow-up Outcome / Result
              </label>
              <select
                value={markDoneResult}
                onChange={(e) => setMarkDoneResult(e.target.value)}
                className="w-full h-10 px-3 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl text-lg text-[#1E293B] dark:text-[#F1F5F9] focus:outline-none"
              >
                <option value="CONNECTED">CONNECTED (Call / Meeting Completed)</option>
                <option value="NO_ANSWER">NO_ANSWER (No Answer / Unreachable)</option>
                <option value="BUSY">BUSY (Line Busy)</option>
                <option value="INTERESTED">INTERESTED (Customer Interested)</option>
                <option value="NOT_INTERESTED">NOT_INTERESTED (Not Interested)</option>
                <option value="DEMO_REQUESTED">DEMO_REQUESTED (Demo Scheduled)</option>
                <option value="QUOTATION_REQUESTED">QUOTATION_REQUESTED (Quote Sent)</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>

            <div>
              <label className="block text-lg font-medium text-[#334155] dark:text-[#CBD5E1] mb-1">
                Completion Notes / Remark
              </label>
              <textarea
                rows={3}
                value={markDoneRemark}
                onChange={(e) => setMarkDoneRemark(e.target.value)}
                placeholder="Enter details of conversation..."
                className="w-full p-3 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl text-lg font-medium text-[#1E293B] dark:text-[#F1F5F9] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setMarkDoneItem(null)}
                className="text-lg font-bold rounded-xl border-[#E2E8F0] px-4 py-2 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmMarkDone}
                disabled={isSubmitting}
                className="bg-[#16A34A] hover:bg-[#15803D] text-white text-lg font-bold rounded-xl px-5 py-2 cursor-pointer"
              >
                Mark Completed 🎉
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ══ RESCHEDULE MODAL ══ */}
      {rescheduleItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-3xl p-6 shadow-2xl w-full max-w-md space-y-4">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] dark:border-[#1E293B] pb-3">
              <h3 className="text-xl text-[#0F172A] dark:text-white font-bold">
                Reschedule Followup
              </h3>
              <button
                onClick={() => setRescheduleItem(null)}
                className="text-[#94A3B8] hover:text-[#475569] cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-lg font-semibold text-[#64748B] dark:text-[#94A3B8]">
              Rescheduling for <strong className="text-[#0F172A] dark:text-white">{rescheduleItem.customerName || "Customer"}</strong>
            </p>

            <div className="grid grid-cols-2 gap-3">
              <Ainput
                type="date"
                name="rescheduleDate"
                title="New Date"
                value={rescheduleDate}
                handleInputChange={(_, value) => setRescheduleDate(value)}
                onInput={() => {}}
                redlabel=""
                labelClass="text-lg font-bold"
                className="!h-10 !text-lg"
              />

              <Ainput
                type="time"
                name="rescheduleTime"
                title="New Time"
                value={rescheduleTime}
                handleInputChange={(_, value) => setRescheduleTime(value)}
                onInput={() => {}}
                redlabel=""
                labelClass="text-lg font-bold"
                className="!h-10 !text-lg"
              />
            </div>

            <div>
              <label className="block text-lg font-bold text-[#334155] dark:text-[#CBD5E1] mb-1">
                Reschedule Reason / Remark
              </label>
              <textarea
                rows={2}
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                placeholder="Reason for rescheduling (e.g., Requested callback next week)"
                className="w-full p-2.5 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl text-lg font-medium text-[#1E293B] dark:text-[#F1F5F9] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setRescheduleItem(null)}
                className="text-lg font-bold rounded-xl border-[#E2E8F0] px-4 py-2 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmReschedule}
                disabled={isSubmitting}
                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-lg font-bold rounded-xl px-5 py-2 cursor-pointer"
              >
                Update Reschedule ➔
              </Button>
            </div>
          </div>
        </div>
      )}

      <HashloaderComponent isLoading={isLoading} />
    </div>
  );
}