"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import Swal from "sweetalert2";
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
  Truck,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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

function PublicAppointmentContent() {
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get("token");
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
  const [pickupRequired, setPickupRequired] = useState(false);
  const [customerResponse, setCustomerResponse] = useState("");

  const fetchAppointmentDetails = async () => {
    try {
      setIsLoading(true);
      const res = await axios.post(
        `${BASE_URL}/Crm/get-appointment-details`,
        {
          token: tokenParam || null,
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
  }, [tokenParam, utdParam, vehicleNoParam]);

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
          token: tokenParam || null,
          utd: data?.utd || (utdParam ? Number(utdParam) : null),
          vehicleNo: data?.vehicleNo || vehicleNoParam || null,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          appointment_remark: appointmentRemark,
          customer_response: customerResponse || `Customer confirmed appointment for ${appointmentDate} at ${appointmentTime}`,
          pickup_required: pickupRequired,
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
        const isPickup = !!pickupRequired;

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
                    <p class="text-[10px] font-semibold text-slate-400">Workshop Location</p>
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
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] p-4 text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#1D4ED8] border-t-transparent"></div>
        <p className="mt-4 text-[18px] font-semibold text-[#1F2937]">
          Loading Your Service Appointment Details...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] pb-12 font-sans">
      {/* ── TOP NAV / BRANDING BANNER ── */}
      <header className="sticky top-0 z-30 border-b border-[#E2E8F0] bg-[#193A69] px-4 py-3.5 text-white shadow-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md">
              <Car size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-[20px] font-extrabold uppercase tracking-wide text-white">
                AUTO-VYN ERP
              </h1>
              <p className="text-[13px] text-white/80">Authorized Car Service Appointment Portal</p>
            </div>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-[#16A34A] px-3 py-1 text-[13px] font-bold text-white shadow-sm">
            <ShieldCheck size={16} /> Verified
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-6">
        {/* ── VEHICLE CARD ── */}
        <div className="overflow-hidden rounded-2xl border border-[#CBD5E1] bg-white shadow-lg">
          <div className="bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] p-5 text-white">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-white/20 px-3 py-1 text-[13px] font-bold uppercase tracking-wider text-white">
                {data?.modelName || "Car Service"} {data?.modelVariant ? `• ${data.modelVariant}` : ""}
              </span>
              <span className="text-[15px] font-semibold text-white/90">
                UTD #{data?.utd}
              </span>
            </div>
            <h2 className="mt-2 text-[26px] font-extrabold tracking-tight text-white md:text-[32px]">
              {data?.vehicleNo || vehicleNoParam || "Vehicle Registration"}
            </h2>
            <div className="mt-1 flex items-center gap-4 text-[16px] text-white/90">
              <span className="flex items-center gap-1">
                <User size={16} /> {data?.custName}
              </span>
              <span className="flex items-center gap-1">
                <Phone size={16} /> {data?.custMob}
              </span>
            </div>
          </div>

          {/* Service Center Info */}
          <div className="border-b border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <div className="flex items-start gap-3">
              <MapPin size={22} className="mt-0.5 shrink-0 text-[#1D4ED8]" />
              <div>
                <h4 className="text-[17px] font-bold text-[#1E293B]">
                  {data?.serviceCenter}
                </h4>
                <p className="text-[15px] text-[#64748B]">
                  {data?.serviceAddress}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── CONFIRMED SUCCESS SCREEN ── */}
        {isSaved ? (
          <div className="mt-6 rounded-2xl border border-[#86EFAC] bg-[#F0FDF4] p-8 text-center shadow-lg">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#16A34A] text-white shadow-md">
              <CheckCircle2 size={36} />
            </div>
            <h2 className="mt-4 text-[26px] font-bold text-[#15803D]">
              Appointment Confirmed!
            </h2>
            <p className="mt-1 text-[17px] text-[#475569]">
              Your service appointment has been successfully scheduled.
            </p>

            <div className="mx-auto mt-6 max-w-md rounded-xl border border-[#BBF7D0] bg-white p-5 text-left shadow-sm">
              <div className="space-y-3 text-[17px]">
                <div className="flex justify-between border-b border-[#E2E8F0] pb-2">
                  <span className="text-[#64748B]">Vehicle No:</span>
                  <span className="font-bold text-[#1D4ED8]">{data?.vehicleNo}</span>
                </div>
                <div className="flex justify-between border-b border-[#E2E8F0] pb-2">
                  <span className="text-[#64748B]">Scheduled Date:</span>
                  <span className="font-bold text-[#0F172A]">{appointmentDate}</span>
                </div>
                <div className="flex justify-between border-b border-[#E2E8F0] pb-2">
                  <span className="text-[#64748B]">Time Slot:</span>
                  <span className="font-bold text-[#0F172A]">{appointmentTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Workshop:</span>
                  <span className="font-bold text-[#0F172A]">{data?.serviceCenter}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsSaved(false)}
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[#16A34A] bg-white px-5 py-2.5 text-[16px] font-semibold text-[#16A34A] hover:bg-[#F0FDF4]"
            >
              <Wrench size={18} /> Modify / Change Appointment
            </button>
          </div>
        ) : (
          <form onSubmit={handleSaveAppointment} className="mt-6 space-y-6">
            {/* ── RECOMMENDED AI SLOTS ── */}
            {data?.extractedSlots && data.extractedSlots.length > 0 && (
              <div className="rounded-2xl border border-[#C4B5FD] bg-[#FAF5FF] p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <Sparkles size={20} className="text-[#7E22CE]" />
                  <h3 className="text-[18px] font-bold text-[#7E22CE]">
                    Recommended Slots from AI Call
                  </h3>
                </div>
                <p className="mt-1 text-[15px] text-[#64748B]">
                  Tap a slot to quickly select date and time:
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {data.extractedSlots.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSlotSelect(s.date, s.time)}
                      className="flex items-center gap-2 rounded-xl border border-[#D8B4FE] bg-white px-4 py-2.5 text-[16px] font-semibold text-[#7E22CE] shadow-sm transition-all hover:bg-[#F3E8FF] hover:scale-[1.02]"
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

            {/* ── BOOKING FORM ── */}
            <div className="rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-md">
              <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
                <Wrench size={22} className="text-[#1D4ED8]" />
                <h3 className="text-[19px] font-bold uppercase tracking-wide text-[#0F172A]">
                  Select Date & Time Slot
                </h3>
              </div>

              <div className="mt-5 space-y-5">
                {/* Date Selection */}
                <div>
                  <label className="block text-[17px] font-bold text-[#334155]">
                    Appointment Date <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="mt-1.5 h-12 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 text-[18px] font-medium text-[#0F172A] focus:border-[#1D4ED8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
                  />
                </div>

                {/* Time Slot Selection */}
                <div>
                  <label className="block text-[17px] font-bold text-[#334155]">
                    Preferred Time Slot <span className="text-[#EF4444]">*</span>
                  </label>
                  <select
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    className="mt-1.5 h-12 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 text-[18px] font-medium text-[#0F172A] focus:border-[#1D4ED8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
                  >
                    <option value="09:00:00">🌅 Morning Slot 1 (09:00 AM - 11:00 AM)</option>
                    <option value="11:00:00">☀️ Morning Slot 2 (11:00 AM - 01:00 PM)</option>
                    <option value="14:00:00">🌤️ Afternoon Slot (02:00 PM - 04:00 PM)</option>
                    <option value="16:00:00">🌆 Evening Slot (04:00 PM - 06:00 PM)</option>
                  </select>
                </div>

                {/* Service Remarks / Specific Requirements */}
                <div>
                  <label className="block text-[17px] font-bold text-[#334155]">
                    Service Remarks / Special Requests
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Engine oil change, AC checkup, wheel alignment, brake inspection..."
                    value={appointmentRemark}
                    onChange={(e) => setAppointmentRemark(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 text-[17px] text-[#0F172A] focus:border-[#1D4ED8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                variant="save"
                disabled={isSubmitting}
                
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={22} className="animate-spin" /> Saving Appointment...
                  </>
                ) : (
                  <>
                    <Send size={22} /> Confirm & Save Appointment
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

export default function PublicAppointmentBookingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#1D4ED8] border-t-transparent"></div>
        </div>
      }
    >
      <PublicAppointmentContent />
    </Suspense>
  );
}
