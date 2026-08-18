"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import axios from "axios";
import Swal from "sweetalert2";
import Ainput from "@/components/atoms/Input";
import CustomSelectSearch from "@/components/atoms/Select";
import { Button } from "@/components/ui/button";
import HashloaderComponent from "@/components/Templates/hashloader";
import {
  Calendar,
  Clock,
  Car,
  User,
  Phone,
  MapPin,
  CheckCircle2,
  Sparkles,
  Wrench,
  ShieldCheck,
  Send,
  RefreshCw,
  Check,
} from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_URL;

type AppointmentData = {
  utd: number | null;
  custName: string;
  custMob: string;
  vehicleNo: string;
  modelName: string;
  modelVariant: string;
  serviceCenter: string;
  serviceAddress: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentStatus: string;
  appointmentRemark: string;
  customerResponse: string;
  extractedSlots?: Array<{ slot: string; date: string; time: string }>;
};

const showToast = (msg: string, type: "success" | "error" | "warning" | "info") =>
  Swal.mixin({ toast: true, position: "top-end", showConfirmButton: false, timer: 4000, timerProgressBar: true })
    .fire({ icon: type, title: msg });

function AppointmentBookingContent() {
  const searchParams = useSearchParams();
  const utdParam = searchParams.get("utd");
  const vehicleNoParam = searchParams.get("vehicleNo");
  const compcodeParam = searchParams.get("compcode") || "1";

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [data, setData] = useState<AppointmentData | null>(null);

  // Form States
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("10:00:00");
  const [appointmentRemark, setAppointmentRemark] = useState("");
  const [pickupOption, setPickupOption] = useState("SELF_DRIVE");
  const [customerResponse, setCustomerResponse] = useState("");

  const fetchAppointmentDetails = async () => {
    try {
      setIsLoading(true);
      const res = await axios.post(
        `${BASE_URL}/Crm/get-appointment-details`,
        {
          utd: utdParam ? Number(utdParam) : null,
          vehicleNo: vehicleNoParam || null,
        },
        {
          headers: {
            accept: "application/json",
            compcode: compcodeParam,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.data?.Status && res.data?.data) {
        const item: AppointmentData = res.data.data;
        setData(item);
        setAppointmentDate(item.appointmentDate || new Date().toISOString().split("T")[0]);
        setAppointmentTime(item.appointmentTime || "10:00:00");
        setAppointmentRemark(item.appointmentRemark || "");
        setCustomerResponse(item.customerResponse || "");
      } else {
        showToast(res.data?.Message || "Failed to load appointment details", "error");
      }
    } catch (err: any) {
      console.error("Fetch appointment details error:", err);
      showToast(err?.response?.data?.Message || "Error connecting to server", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointmentDetails();
  }, [utdParam, vehicleNoParam]);

  const handleSaveAppointment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!appointmentDate) {
      showToast("Please select an appointment date", "warning");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await axios.post(
        `${BASE_URL}/Crm/save-appointment-details`,
        {
          utd: data?.utd || (utdParam ? Number(utdParam) : null),
          vehicleNo: data?.vehicleNo || vehicleNoParam || null,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          appointment_remark: appointmentRemark,
          customer_response: customerResponse || `Appointment confirmed for ${appointmentDate} at ${appointmentTime}`,
          pickup_required: pickupOption === "PICKUP_REQUIRED",
        },
        {
          headers: {
            accept: "application/json",
            compcode: compcodeParam,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.data?.Status) {
        setIsSaved(true);

        const formattedVehicle = data?.vehicleNo || vehicleNoParam || "N/A";
        const formattedCustName = data?.custName || "Valued Customer";
        const formattedDate = appointmentDate;
        const formattedTime = appointmentTime;
        const formattedLocation = data?.serviceCenter || "AutoVyn Service Center";
        const isPickup = pickupOption === "PICKUP_REQUIRED";

        Swal.fire({
          title: "",
          html: `
            <div class="p-2 text-left font-sans">
              <!-- Top Success Header Badge -->
              <div class="flex items-center justify-center mb-4">
                <div class="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-inner">
                  <svg class="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              </div>

              <h2 class="text-center text-2xl font-extrabold text-slate-800 dark:text-white mb-1">
                Appointment Confirmed! 🎉
              </h2>
              <p class="text-center text-xs text-slate-500 dark:text-slate-400 mb-5">
                Your service booking has been successfully registered.
              </p>

              <!-- Main Detail Card -->
              <div class="bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3 mb-4">
                
                <!-- Vehicle & Customer Header -->
                <div class="flex items-center justify-between pb-3 border-b border-slate-200/70 dark:border-slate-800">
                  <div>
                    <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Customer</p>
                    <p class="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">${formattedCustName}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Vehicle No</p>
                    <span class="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-lg text-xs font-bold border border-blue-200 dark:border-blue-800 mt-0.5">
                      🚗 ${formattedVehicle}
                    </span>
                  </div>
                </div>

                <!-- Grid Details -->
                <div class="grid grid-cols-2 gap-2.5 pt-1">
                  <div class="bg-white dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60">
                    <p class="text-[10px] font-semibold text-slate-400">📅 Date</p>
                    <p class="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">${formattedDate}</p>
                  </div>

                  <div class="bg-white dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60">
                    <p class="text-[10px] font-semibold text-slate-400">⏰ Time Slot</p>
                    <p class="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">${formattedTime}</p>
                  </div>
                </div>

                <!-- Location -->
                <div class="bg-white dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60 flex items-start gap-2">
                  <span class="text-base mt-0.5">📍</span>
                  <div>
                    <p class="text-[10px] font-semibold text-slate-400">Service Center</p>
                    <p class="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">${formattedLocation}</p>
                  </div>
                </div>

                <!-- Service Mode -->
                <div class="bg-white dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                  <span class="text-[10px] font-semibold text-slate-400">Service Type</span>
                  <span class="text-[11px] font-bold px-2 py-0.5 rounded-md ${isPickup ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800" : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"}">
                    ${isPickup ? "🚚 Home Pickup Requested" : "🚗 Self Drive Workshop Visit"}
                  </span>
                </div>

              </div>

              <!-- WhatsApp Confirmation Alert -->
              <div class="flex items-center gap-2.5 bg-emerald-50/90 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/80 p-3 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-medium">
                <span class="text-base">💬</span>
                <span>Confirmation details & service ticket sent to your WhatsApp!</span>
              </div>
            </div>
          `,
          confirmButtonText: "Great, Thank You! ✨",
          buttonsStyling: false,
          customClass: {
            popup: "rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 dark:bg-slate-950 max-w-md w-full",
            confirmButton: "w-full mt-4 py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-200 cursor-pointer transform hover:scale-[1.01]"
          }
        });
      } else {
        showToast(res.data?.Message || "Failed to update appointment", "error");
      }
    } catch (err: any) {
      console.error("Save appointment error:", err);
      showToast(err?.response?.data?.Message || "Error saving appointment", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSlotSelect = (slotDate: string, slotTime: string) => {
    if (slotDate) setAppointmentDate(slotDate);
    if (slotTime) setAppointmentTime(slotTime);
    showToast(`Selected slot: ${slotDate} at ${slotTime}`, "info");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-4">
        <HashloaderComponent isLoading={true} />
        <p className="text-[18px] font-semibold text-[#1F2937] dark:text-white">
          Fetching Vehicle & Appointment Details...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* ── HEADER CARD ── */}
      <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-gradient-to-r from-[#193A69] via-[#1D4ED8] to-[#2563EB] p-6 text-white shadow-xl dark:border-[#374151] dark:from-[#0F172A] dark:to-[#1E293B]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md">
              <Car size={32} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-white/20 px-3 py-0.5 text-[14px] font-bold uppercase tracking-wider text-white">
                  {data?.modelName || "Car Service"}
                </span>
                <span className="flex items-center gap-1 rounded-full bg-[#16A34A] px-2.5 py-0.5 text-[13px] font-bold text-white">
                  <ShieldCheck size={14} /> Official Workshop
                </span>
              </div>
              <h1 className="mt-1 text-[26px] font-bold tracking-tight text-white md:text-[30px]">
                {data?.vehicleNo || vehicleNoParam || "Vehicle Appointment"}
              </h1>
              <p className="text-[16px] text-white/80">
                {data?.custName} • {data?.custMob}
              </p>
            </div>
          </div>

          <button
            onClick={fetchAppointmentDetails}
            className="flex items-center gap-1.5 self-start rounded-xl bg-white/10 px-3.5 py-2 text-[15px] font-semibold text-white backdrop-blur-md transition-all hover:bg-white/20"
          >
            <RefreshCw size={16} /> Refresh Info
          </button>
        </div>
      </div>

      {/* ── CONFIRMED SUCCESS SCREEN ── */}
      {isSaved ? (
        <div className="mt-6 rounded-2xl border border-[#86EFAC] bg-[#F0FDF4] p-8 text-center shadow-lg dark:border-[#166534] dark:bg-[#14532D]/20">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#16A34A] text-white shadow-md">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="mt-4 text-[26px] font-bold text-[#15803D] dark:text-[#86EFAC]">
            Appointment Confirmed!
          </h2>
          <p className="mt-1 text-[18px] text-[#4B5563] dark:text-[#D1D5DB]">
            Your service appointment details have been updated and confirmed in our system.
          </p>

          <div className="mx-auto mt-6 max-w-lg rounded-xl border border-[#BBF7D0] bg-white p-5 text-left dark:border-[#166534] dark:bg-[#111827]">
            <div className="grid grid-cols-2 gap-4 text-[17px]">
              <div>
                <span className="text-[14px] font-medium text-[#6B7280]">Scheduled Date:</span>
                <p className="font-bold text-[#1F2937] dark:text-white">{appointmentDate}</p>
              </div>
              <div>
                <span className="text-[14px] font-medium text-[#6B7280]">Time Slot:</span>
                <p className="font-bold text-[#1F2937] dark:text-white">{appointmentTime}</p>
              </div>
              <div>
                <span className="text-[14px] font-medium text-[#6B7280]">Service Workshop:</span>
                <p className="font-bold text-[#1F2937] dark:text-white">{data?.serviceCenter}</p>
              </div>
              <div>
                <span className="text-[14px] font-medium text-[#6B7280]">Vehicle No:</span>
                <p className="font-bold text-[#1D4ED8] dark:text-[#60A5FA]">{data?.vehicleNo}</p>
              </div>
            </div>
          </div>

          <Button
            onClick={() => setIsSaved(false)}
            variant="outline"
            className="mt-6 border-[#16A34A] text-[#16A34A] hover:bg-[#F0FDF4]"
          >
            Modify / Reschedule Appointment
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSaveAppointment} className="mt-6 space-y-6">
          {/* ── WORKSHOP LOCATION CARD ── */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm dark:border-[#374151] dark:bg-[#111827]">
            <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3 dark:border-[#374151]">
              <MapPin size={22} className="text-[#1D4ED8] dark:text-[#60A5FA]" />
              <h3 className="text-[18px] font-bold uppercase tracking-wide text-[#1F2937] dark:text-white">
                Assigned Service Workshop
              </h3>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <span className="text-[14px] font-medium text-[#6B7280] dark:text-[#9CA3AF]">
                  Workshop Center
                </span>
                <p className="text-[18px] font-bold text-[#1F2937] dark:text-white">
                  {data?.serviceCenter}
                </p>
              </div>
              <div>
                <span className="text-[14px] font-medium text-[#6B7280] dark:text-[#9CA3AF]">
                  Address
                </span>
                <p className="text-[17px] text-[#4B5563] dark:text-[#D1D5DB]">
                  {data?.serviceAddress}
                </p>
              </div>
            </div>
          </div>

          {/* ── RECOMMENDED AI SLOTS ── */}
          {data?.extractedSlots && data.extractedSlots.length > 0 && (
            <div className="rounded-2xl border border-[#C4B5FD] bg-[#FAF5FF] p-5 dark:border-[#581C87] dark:bg-[#581C87]/10">
              <div className="flex items-center gap-2">
                <Sparkles size={20} className="text-[#7E22CE] dark:text-[#D8B4FE]" />
                <h3 className="text-[18px] font-bold text-[#7E22CE] dark:text-[#D8B4FE]">
                  Recommended Slots from AI Call
                </h3>
              </div>
              <p className="mt-1 text-[15px] text-[#6B7280] dark:text-[#9CA3AF]">
                Click any slot to auto-fill your appointment schedule:
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                {data.extractedSlots.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSlotSelect(s.date, s.time)}
                    className="flex items-center gap-2 rounded-xl border border-[#D8B4FE] bg-white px-4 py-2.5 text-[16px] font-semibold text-[#7E22CE] shadow-sm transition-all hover:bg-[#F3E8FF] hover:scale-[1.02] dark:border-[#6B21A8] dark:bg-[#111827] dark:text-[#D8B4FE]"
                  >
                    <Calendar size={18} />
                    <span>{s.date}</span>
                    <Clock size={18} className="ml-1" />
                    <span>{s.time}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── BOOKING FORM FIELDS ── */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm dark:border-[#374151] dark:bg-[#111827]">
            <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3 dark:border-[#374151]">
              <Wrench size={22} className="text-[#1D4ED8] dark:text-[#60A5FA]" />
              <h3 className="text-[18px] font-bold uppercase tracking-wide text-[#1F2937] dark:text-white">
                Select Date & Time Slot
              </h3>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Date Input */}
              <div className="flex flex-col gap-1">
                <label className="text-[18px] font-semibold text-[#374151] dark:text-[#D1D5DB]">
                  Appointment Date <span className="text-[#EF4444]">*</span>
                </label>
                <Ainput
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="!h-11 !text-[18px]"
                />
              </div>

              {/* Time Slot Select */}
              <div className="flex flex-col gap-1">
                <label className="text-[18px] font-semibold text-[#374151] dark:text-[#D1D5DB]">
                  Preferred Time Slot <span className="text-[#EF4444]">*</span>
                </label>
                <CustomSelectSearch
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  className="!h-11 !text-[18px]"
                  options={[
                    { value: "09:00:00", label: "🌅 Morning Slot 1 (09:00 AM - 11:00 AM)" },
                    { value: "11:00:00", label: "☀️ Morning Slot 2 (11:00 AM - 01:00 PM)" },
                    { value: "14:00:00", label: "🌤️ Afternoon Slot (02:00 PM - 04:00 PM)" },
                    { value: "16:00:00", label: "🌆 Evening Slot (04:00 PM - 06:00 PM)" },
                  ]}
                />
              </div>

              {/* Vehicle Pickup Preference */}
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-[18px] font-semibold text-[#374151] dark:text-[#D1D5DB]">
                  Vehicle Drop/Pickup Option
                </label>
                <CustomSelectSearch
                  value={pickupOption}
                  onChange={(e) => setPickupOption(e.target.value)}
                  className="!h-11 !text-[18px]"
                  options={[
                    { value: "SELF_DRIVE", label: "🚗 Self Drive — I will drop vehicle at workshop" },
                    { value: "PICKUP_REQUIRED", label: "🚚 Request Doorstep Vehicle Pickup & Drop" },
                  ]}
                />
              </div>

              {/* Special Remarks */}
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-[18px] font-semibold text-[#374151] dark:text-[#D1D5DB]">
                  Special Requests / Service Remarks
                </label>
                <Ainput
                  type="text"
                  placeholder="e.g. Engine Oil Change, AC Checkup, Brake Inspection..."
                  value={appointmentRemark}
                  onChange={(e) => setAppointmentRemark(e.target.value)}
                  className="!h-11 !text-[18px]"
                />
              </div>
            </div>

            {/* Submit Action */}
            <div className="mt-8 flex justify-end">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 w-full md:w-auto bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-[18px] font-bold px-8 rounded-xl shadow-lg transition-all"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw size={20} className="animate-spin" /> Saving...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send size={20} /> Confirm & Save Appointment
                  </span>
                )}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

export default function AppointmentBookingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[80vh] items-center justify-center">
          <HashloaderComponent isLoading={true} />
        </div>
      }
    >
      <AppointmentBookingContent />
    </Suspense>
  );
}
