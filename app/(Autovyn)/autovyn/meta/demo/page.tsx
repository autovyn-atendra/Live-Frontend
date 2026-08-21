"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Swal from "sweetalert2";
import {
  List,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Video,
  FileText,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  X,
  User,
  Building2,
  Phone,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/app/hooks/use-current-user";

const BASE_URL = process.env.NEXT_PUBLIC_URL || "";

// ============================================================
// TYPES & INTERFACES
// ============================================================
export type DemoRecord = {
  id: string | number;
  UTD?: number;
  Meta_Lead_UTD?: number;
  customerName: string;
  companyName: string;
  phone?: string;
  email?: string;
  demoDate: string; // e.g. "18 Aug 2026"
  demoTime: string; // e.g. "02:00 PM"
  mode: "Onsite" | "Online";
  status: "Scheduled" | "Completed" | "No-show" | "Cancelled";
  quotationSent?: boolean;
  rawDate?: string;
};

// Default Demo Records (Matching exact design screenshot)
const DEFAULT_DEMOS: DemoRecord[] = [
  {
    id: 1,
    UTD: 101,
    Meta_Lead_UTD: 150,
    customerName: "Ramesh Yadav",
    companyName: "SHREE MOTORS",
    phone: "+91 98765 43210",
    demoDate: "18 Aug 2026",
    demoTime: "02:00 PM",
    mode: "Onsite",
    status: "Scheduled",
    quotationSent: false,
    rawDate: "2026-08-18",
  },
  {
    id: 2,
    UTD: 102,
    Meta_Lead_UTD: 151,
    customerName: "Vicky",
    companyName: "DEVASVI AUTO SALES",
    phone: "+91 91234 56789",
    demoDate: "20 Aug 2026",
    demoTime: "04:00 PM",
    mode: "Online",
    status: "Scheduled",
    quotationSent: false,
    rawDate: "2026-08-20",
  },
  {
    id: 3,
    UTD: 103,
    Meta_Lead_UTD: 152,
    customerName: "Suresh Nair",
    companyName: "KERALA AUTO WORLD",
    phone: "+91 94530 71550",
    demoDate: "16 Aug 2026",
    demoTime: "02:00 PM",
    mode: "Online",
    status: "Completed",
    quotationSent: false,
    rawDate: "2026-08-16",
  },
  {
    id: 4,
    UTD: 104,
    Meta_Lead_UTD: 153,
    customerName: "Deepak Sharma",
    companyName: "SHARMA MOTORS",
    phone: "+91 99887 76655",
    demoDate: "13 Aug 2026",
    demoTime: "11:00 AM",
    mode: "Onsite",
    status: "Completed",
    quotationSent: false,
    rawDate: "2026-08-13",
  },
  {
    id: 5,
    UTD: 105,
    Meta_Lead_UTD: 154,
    customerName: "Amit Kulkarni",
    companyName: "KULKARNI AUTO",
    phone: "+91 97654 32109",
    demoDate: "14 Aug 2026",
    demoTime: "03:30 PM",
    mode: "Online",
    status: "No-show",
    quotationSent: false,
    rawDate: "2026-08-14",
  },
];

export default function DemoPage() {
  const router = useRouter();
  const user = useCurrentUser();

  // State Management
  const [demos, setDemos] = useState<DemoRecord[]>(DEFAULT_DEMOS);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Send Quotation Modal State
  const [selectedDemoForQuotation, setSelectedDemoForQuotation] = useState<DemoRecord | null>(null);
  const [quotationAmount, setQuotationAmount] = useState("");
  const [quotationRemarks, setQuotationRemarks] = useState("");
  const [isSendingQuotation, setIsSendingQuotation] = useState(false);

  // New Demo Modal State
  const [isAddDemoOpen, setIsAddDemoOpen] = useState(false);
  const [newDemoForm, setNewDemoForm] = useState({
    customerName: "",
    companyName: "",
    phone: "",
    demoDate: new Date().toISOString().split("T")[0],
    demoTime: "02:00 PM",
    mode: "Online" as "Onsite" | "Online",
  });

  // ============================================================
  // FETCH DEMO RECORDS FROM BACKEND (OR MERGE WITH DEFAULT)
  // ============================================================
  useEffect(() => {
    const fetchDemos = async () => {
      setIsLoading(true);
      try {
        const res = await axios.post(
          `${BASE_URL}/meta/getFollowups`,
          { limit: 500 },
          {
            headers: {
              compcode: user?.Comp_Code || process.env.NEXT_PUBLIC_COMP_CODE || "autovyn",
              name: user?.name,
              "Content-Type": "application/json",
            },
          }
        );

        if (res.data?.success && Array.isArray(res.data.data)) {
          // Filter followups that are DEMO or walkthroughs
          const apiDemos = res.data.data
            .filter((item: any) =>
              String(item.Followup_Type).toUpperCase() === "DEMO" ||
              String(item.Purpose).toLowerCase().includes("demo")
            )
            .map((item: any) => {
              const dObj = new Date(item.Followup_Date);
              const formattedDate = !isNaN(dObj.getTime())
                ? dObj.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                : item.Followup_Date;

              return {
                id: item.UTD,
                UTD: item.UTD,
                Meta_Lead_UTD: item.Meta_Lead_UTD,
                customerName: item.customerName || "Customer",
                companyName: item.companyName || "Company",
                phone: item.phone || "",
                email: item.email || "",
                demoDate: formattedDate,
                demoTime: item.Followup_Time || "02:00 PM",
                mode: item.Purpose?.toLowerCase().includes("onsite") ? "Onsite" : "Online",
                status:
                  item.Followup_Status === "COMPLETED"
                    ? "Completed"
                    : item.Followup_Status === "CANCELLED"
                    ? "Cancelled"
                    : "Scheduled",
                quotationSent: false,
                rawDate: item.Followup_Date,
              } as DemoRecord;
            });

          if (apiDemos.length > 0) {
            // Merge with default demos without duplicates
            setDemos((prev) => [...apiDemos, ...DEFAULT_DEMOS]);
          }
        }
      } catch (err) {
        console.warn("Could not load backend demos, using default demonstration dataset.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDemos();
  }, [user?.Comp_Code, user?.name]);

  // ============================================================
  // FILTERED DEMOS
  // ============================================================
  const filteredDemos = useMemo(() => {
    return demos.filter((demo) => {
      const matchesSearch =
        demo.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        demo.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        demo.phone?.includes(searchQuery);

      const matchesStatus =
        statusFilter === "ALL" || demo.status.toUpperCase() === statusFilter.toUpperCase();

      return matchesSearch && matchesStatus;
    });
  }, [demos, searchQuery, statusFilter]);

  // Toast alert
  const showToast = (message: string, icon: "success" | "error" | "info" = "success") => {
    Swal.fire({
      toast: true,
      position: "top-end",
      icon,
      title: message,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
  };

  // ============================================================
  // SEND QUOTATION HANDLER
  // ============================================================
  const handleSendQuotationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDemoForQuotation) return;

    setIsSendingQuotation(true);
    try {
      // Simulate or call backend API
      await new Promise((r) => setTimeout(r, 1000));

      setDemos((prev) =>
        prev.map((d) =>
          d.id === selectedDemoForQuotation.id ? { ...d, quotationSent: true } : d
        )
      );

      showToast(`Quotation sent successfully to ${selectedDemoForQuotation.customerName}!`, "success");
      setSelectedDemoForQuotation(null);
      setQuotationAmount("");
      setQuotationRemarks("");
    } catch (err) {
      showToast("Failed to send quotation. Please try again.", "error");
    } finally {
      setIsSendingQuotation(false);
    }
  };

  // ============================================================
  // CREATE DEMO HANDLER
  // ============================================================
  const handleCreateDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDemoForm.customerName || !newDemoForm.companyName) {
      showToast("Please fill in Customer Name and Company Name", "error");
      return;
    }

    const dObj = new Date(newDemoForm.demoDate);
    const formattedDate = !isNaN(dObj.getTime())
      ? dObj.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
      : newDemoForm.demoDate;

    const newRecord: DemoRecord = {
      id: Date.now(),
      customerName: newDemoForm.customerName,
      companyName: newDemoForm.companyName,
      phone: newDemoForm.phone,
      demoDate: formattedDate,
      demoTime: newDemoForm.demoTime,
      mode: newDemoForm.mode,
      status: "Scheduled",
      quotationSent: false,
      rawDate: newDemoForm.demoDate,
    };

    setDemos((prev) => [newRecord, ...prev]);
    showToast("New Product Demo scheduled successfully!", "success");
    setIsAddDemoOpen(false);
    setNewDemoForm({
      customerName: "",
      companyName: "",
      phone: "",
      demoDate: new Date().toISOString().split("T")[0],
      demoTime: "02:00 PM",
      mode: "Online",
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-[#0F172A] dark:text-[#E2E8F0] p-4 md:p-8 space-y-6 font-sans">
      
      {/* ══ HEADER SECTION ══ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0F172A] dark:text-white tracking-tight">
           Meta lead Demos
          </h1>
          <p className="text-lg font-medium text-[#64748B] dark:text-[#94A3B8] mt-1">
            Scheduled product walkthroughs of HR Setu
          </p>
        </div>

        {/* Top Right Controls */}
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsAddDemoOpen(true)}
            className="bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold rounded-xl h-10 px-4 flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Plus size={18} />
            Schedule Demo
          </Button>
        </div>
      </div>

      {/* ══ FILTERS & SEARCH BAR ══ */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-[#0F172A] p-4 rounded-2xl border border-[#E2E8F0] dark:border-[#1E293B] shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search by customer or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl text-lg font-medium focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {["ALL", "Scheduled", "Completed", "No-show"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === st
                  ? "bg-[#0F172A] text-white dark:bg-white dark:text-[#0F172A]"
                  : "bg-[#F1F5F9] dark:bg-[#1E293B] text-[#64748B] hover:bg-[#E2E8F0]"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════ */}
      {/* ══ DEMO CARDS LIST ══ */}
      {/* ════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDemos.map((demo) => {
          // Accent colors according to status
          let accentBorderClass = "border-l-4 border-l-[#818CF8]"; // Scheduled: Purple
          let statusBadgeClass = "bg-[#F3E8FF] text-[#7E22CE] border-[#E9D5FF]";

          if (demo.status === "Completed") {
            accentBorderClass = "border-l-4 border-l-[#16A34A]"; // Completed: Green
            statusBadgeClass = "bg-[#DCFCE7] text-[#166534] border-[#BEE3F8]";
          } else if (demo.status === "No-show") {
            accentBorderClass = "border-l-4 border-l-[#EF4444]"; // No-show: Red
            statusBadgeClass = "bg-[#FFE4E6] text-[#991B1B] border-[#FFDBDC]";
          } else if (demo.status === "Cancelled") {
            accentBorderClass = "border-l-4 border-l-[#94A3B8]";
            statusBadgeClass = "bg-[#F1F5F9] text-[#64748B] border-[#CBD5E1]";
          }

          return (
            <div
              key={demo.id}
              className={`bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] ${accentBorderClass} rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4`}
            >
              {/* Top Section: Customer Name, Company, & Status */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-white leading-tight">
                    {demo.customerName}
                  </h3>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] mt-1">
                    {demo.companyName}
                  </p>
                </div>

                {/* Status Badge */}
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${statusBadgeClass}`}
                >
                  {demo.status}
                </span>
              </div>

              {/* Middle Info Row: Date, Time, Mode Badge */}
              <div className="flex items-center gap-3 text-lg font-semibold text-[#475569] dark:text-[#CBD5E1]">
                <div className="flex items-center gap-1.5">
                  <CalendarIcon size={16} className="text-[#94A3B8]" />
                  <span>{demo.demoDate}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Clock size={16} className="text-[#94A3B8]" />
                  <span>{demo.demoTime}</span>
                </div>

                {/* Mode Badge (Onsite vs Online) */}
                {demo.mode === "Onsite" ? (
                  <span className="bg-[#FEF3C7] text-[#D97706] px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                    <MapPin size={12} />
                    Onsite
                  </span>
                ) : (
                  <span className="bg-[#E0F2FE] text-[#0284C7] px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                    <Video size={12} />
                    Online
                  </span>
                )}
              </div>

              {/* Bottom Action Area */}
              {demo.status === "Completed" && (
                <div className="pt-2 border-t border-[#F1F5F9] dark:border-[#1E293B]">
                  {demo.quotationSent ? (
                    <div className="w-full bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] rounded-xl py-2 px-3 text-lg font-bold flex items-center justify-center gap-2">
                      <CheckCircle2 size={16} />
                      Quotation Sent
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => setSelectedDemoForQuotation(demo)}
                      className="w-full bg-white dark:bg-[#1E293B] hover:bg-[#F8FAFC] text-[#334155] dark:text-[#E2E8F0] border border-[#E2E8F0] dark:border-[#334155] rounded-xl h-10 font-bold text-lg flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs"
                    >
                      {/* <FileText size={16} className="text-[#475569]" /> */}
                      Send Quotation
                    </Button>
                  )}
                </div>
              )}

              {demo.status === "Scheduled" && (
                <div className="pt-2 border-t border-[#F1F5F9] dark:border-[#1E293B]">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (demo.Meta_Lead_UTD) {
                        router.push(`/autovyn/meta/dashboard?leadUtd=${demo.Meta_Lead_UTD}&from=demo`);
                      } else {
                        showToast(`Viewing Lead details for ${demo.customerName}`, "info");
                      }
                    }}
                    className="w-full bg-white dark:bg-[#1E293B] hover:bg-[#F8FAFC] text-[#4F46E5] border border-[#E2E8F0] dark:border-[#334155] rounded-xl h-10 font-bold text-lg flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs"
                  >
                    View Lead Details ➔
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ════════════════════════════════════════════════════════ */}
      {/* ══ SEND QUOTATION MODAL ══ */}
      {/* ════════════════════════════════════════════════════════ */}
      {selectedDemoForQuotation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-3xl p-6 shadow-2xl w-full max-w-md space-y-4">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] dark:border-[#1E293B] pb-3">
              <h3 className="text-xl font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                <FileText size={20} className="text-[#4F46E5]" />
                Send Quotation
              </h3>
              <button
                onClick={() => setSelectedDemoForQuotation(null)}
                className="text-[#94A3B8] hover:text-[#475569] cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-[#F8FAFC] dark:bg-[#1E293B] p-3.5 rounded-xl space-y-1">
              <p className="text-lg font-bold text-[#0F172A] dark:text-white">
                {selectedDemoForQuotation.customerName}
              </p>
              <p className="text-xs font-semibold text-[#64748B]">
                {selectedDemoForQuotation.companyName} • {selectedDemoForQuotation.phone}
              </p>
            </div>

            <form onSubmit={handleSendQuotationSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1">
                  Quotation Amount (₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 45000"
                  required
                  value={quotationAmount}
                  onChange={(e) => setQuotationAmount(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl text-lg font-bold focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1">
                  Remarks / Package Details
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter proposal note or package details..."
                  value={quotationRemarks}
                  onChange={(e) => setQuotationRemarks(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl text-lg font-medium focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedDemoForQuotation(null)}
                  className="rounded-xl border-[#E2E8F0] font-bold cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSendingQuotation}
                  className="bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold rounded-xl px-5 flex items-center gap-2 cursor-pointer"
                >
                  <Send size={16} />
                  {isSendingQuotation ? "Sending..." : "Send Quotation"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* ══ SCHEDULE NEW DEMO MODAL ══ */}
      {/* ════════════════════════════════════════════════════════ */}
      {isAddDemoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-3xl p-6 shadow-2xl w-full max-w-md space-y-4">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] dark:border-[#1E293B] pb-3">
              <h3 className="text-xl font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                <Plus size={20} className="text-[#4F46E5]" />
                Schedule Product Demo
              </h3>
              <button
                onClick={() => setIsAddDemoOpen(false)}
                className="text-[#94A3B8] hover:text-[#475569] cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateDemoSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#64748B] mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={newDemoForm.customerName}
                  onChange={(e) => setNewDemoForm({ ...newDemoForm, customerName: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl text-lg font-medium focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#64748B] mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sharma Motors"
                  value={newDemoForm.companyName}
                  onChange={(e) => setNewDemoForm({ ...newDemoForm, companyName: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl text-lg font-medium focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#64748B] mb-1">Contact Phone</label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={newDemoForm.phone}
                  onChange={(e) => setNewDemoForm({ ...newDemoForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl text-lg font-medium focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#64748B] mb-1">Demo Date</label>
                  <input
                    type="date"
                    value={newDemoForm.demoDate}
                    onChange={(e) => setNewDemoForm({ ...newDemoForm, demoDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl text-lg font-medium focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#64748B] mb-1">Demo Time</label>
                  <input
                    type="text"
                    placeholder="02:00 PM"
                    value={newDemoForm.demoTime}
                    onChange={(e) => setNewDemoForm({ ...newDemoForm, demoTime: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl text-lg font-medium focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#64748B] mb-1">Demo Mode</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setNewDemoForm({ ...newDemoForm, mode: "Online" })}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                      newDemoForm.mode === "Online"
                        ? "bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD]"
                        : "bg-[#F1F5F9] text-[#64748B]"
                    }`}
                  >
                    <Video size={14} />
                    Online
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewDemoForm({ ...newDemoForm, mode: "Onsite" })}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                      newDemoForm.mode === "Onsite"
                        ? "bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]"
                        : "bg-[#F1F5F9] text-[#64748B]"
                    }`}
                  >
                    <MapPin size={14} />
                    Onsite
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDemoOpen(false)}
                  className="rounded-xl border-[#E2E8F0] font-bold cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold rounded-xl px-5 cursor-pointer"
                >
                  Save Demo
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
