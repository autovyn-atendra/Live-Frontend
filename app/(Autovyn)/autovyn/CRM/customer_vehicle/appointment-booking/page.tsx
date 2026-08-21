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

const formatTimeDisplay = (timeStr?: string) => {
  if (!timeStr) return "10:00 AM";
  if (timeStr.includes("T")) {
    const timePart = timeStr.split("T")[1]?.split(".")[0];
    if (timePart) timeStr = timePart;
  }
  const parts = timeStr.split(":");
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    if (isNaN(hours)) return timeStr;
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;
    return `${formattedHours}:${minutes} ${ampm}`;
  }
  return timeStr;
};

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
        const formattedTime = formatTimeDisplay(appointmentTime);
        const formattedLocation = data?.serviceCenter || "AutoVyn Service Center";
        const isPickup = pickupOption === "PICKUP_REQUIRED";

        Swal.fire({
          title: "",
          width: "560px",
          html: `
            <div class="p-1 text-left font-sans relative overflow-hidden">
              <!-- Background Ambient Glow Effects -->
              <div class="absolute -top-12 -right-12 w-48 h-48 bg-[#10B981]/10 rounded-full blur-3xl pointer-events-none"></div>
              <div class="absolute -bottom-12 -left-12 w-48 h-48 bg-[#6366F1]/10 rounded-full blur-3xl pointer-events-none"></div>

              <!-- Top Success Glowing Icon -->
              <div class="flex justify-center mb-3">
                <div class="relative">
                  <div class="absolute inset-0 rounded-2xl bg-[#10B981]/20 dark:bg-[#10B981]/30 blur-lg animate-pulse"></div>
                  <div class="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[#10B981] to-[#0D9488] text-[#FFFFFF] flex items-center justify-center shadow-lg shadow-[#10B981]/30 transform hover:scale-105 transition-all duration-300">
                    <svg class="w-9 h-9 text-[#FFFFFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                </div>
              </div>

              <!-- Header Text -->
              <h2 class="text-center text-2xl font-black tracking-tight text-[#1E293B] dark:text-[#FFFFFF] mb-1">
                Appointment Confirmed! 🎉
              </h2>
              <p class="text-center text-sm font-medium text-[#64748B] dark:text-[#94A3B8] mb-4">
                Your service booking has been successfully registered.
              </p>

              <!-- Main Detail Card with Glassmorphism -->
              <div class="bg-gradient-to-b from-[#F8FAFC] to-[#F1F5F9]/80 dark:from-[#0F172A]/90 dark:to-[#0F172A]/50 border border-[#E2E8F0]/80 dark:border-[#1E293B]/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5 mb-3.5 relative z-10">
                
                <!-- Customer & Vehicle Header -->
                <div class="flex items-center justify-between pb-3 border-b border-[#E2E8F0]/70 dark:border-[#1E293B]/70">
                  <div class="space-y-0.5">
                    <p class="text-xs font-bold uppercase tracking-wider text-[#94A3B8] dark:text-[#64748B]">Customer</p>
                    <p class="text-base font-black text-[#1E293B] dark:text-[#F1F5F9]">${formattedCustName}</p>
                  </div>
                  <div class="text-right space-y-0.5">
                    <p class="text-xs font-bold uppercase tracking-wider text-[#94A3B8] dark:text-[#64748B]">Vehicle No</p>
                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs sm:text-sm font-bold shadow-xs" style="background: linear-gradient(to right, #2563eb, #4f46e5) !important; color: #ffffff !important;">
                      🚗 ${formattedVehicle}
                    </span>
                  </div>
                </div>

                <!-- Grid Details: Date & Time -->
                <div class="grid grid-cols-2 gap-3 pt-0.5">
                  <div class="bg-[#FFFFFF]/80 dark:bg-[#1E293B]/80 p-3 rounded-xl border border-[#E2E8F0]/50 dark:border-[#334155]/50 shadow-2xs backdrop-blur-xs">
                    <div class="flex items-center gap-1.5 text-[#94A3B8] dark:text-[#94A3B8] mb-1">
                      <span class="text-sm">📅</span>
                      <p class="text-xs font-bold uppercase tracking-wider">Date</p>
                    </div>
                    <p class="text-sm sm:text-base font-black text-[#1E293B] dark:text-[#F1F5F9]">${formattedDate}</p>
                  </div>

                  <div class="bg-[#FFFFFF]/80 dark:bg-[#1E293B]/80 p-3 rounded-xl border border-[#E2E8F0]/50 dark:border-[#334155]/50 shadow-2xs backdrop-blur-xs">
                    <div class="flex items-center gap-1.5 text-[#94A3B8] dark:text-[#94A3B8] mb-1">
                      <span class="text-sm">⏰</span>
                      <p class="text-xs font-bold uppercase tracking-wider">Time Slot</p>
                    </div>
                    <p class="text-sm sm:text-base font-black text-[#1E293B] dark:text-[#F1F5F9]">${formattedTime}</p>
                  </div>
                </div>

                <!-- Location Card -->
                <div class="bg-[#FFFFFF]/80 dark:bg-[#1E293B]/80 p-3 rounded-xl border border-[#E2E8F0]/50 dark:border-[#334155]/50 shadow-2xs backdrop-blur-xs flex items-start gap-3">
                  <span class="text-lg mt-0.5 p-1 rounded-lg bg-[#EEF2FF] dark:bg-[#1E1B4B]/60 text-[#4F46E5] dark:text-[#818CF8] shrink-0">📍</span>
                  <div>
                    <p class="text-xs font-bold uppercase tracking-wider text-[#94A3B8] dark:text-[#64748B]">Service Center</p>
                    <p class="text-sm font-black text-[#1E293B] dark:text-[#F1F5F9] mt-0.5 leading-snug">${formattedLocation}</p>
                  </div>
                </div>

                <!-- Service Type Badge -->
                <div class="bg-[#FFFFFF]/80 dark:bg-[#1E293B]/80 p-3 rounded-xl border border-[#E2E8F0]/50 dark:border-[#334155]/50 shadow-2xs backdrop-blur-xs flex items-center justify-between">
                  <span class="text-xs font-bold uppercase tracking-wider text-[#94A3B8] dark:text-[#64748B]">Service Type</span>
                  <span class="text-xs sm:text-sm font-extrabold px-3 py-1 rounded-lg ${isPickup ? "bg-[#F59E0B]/10 text-[#B45309] dark:text-[#FCD34D] border border-[#F59E0B]/20" : "bg-[#10B981]/10 text-[#047857] dark:text-[#6EE7B7] border border-[#10B981]/20"}">
                    ${isPickup ? "🚚 Home Pickup Requested" : "🚗 Self Drive Workshop Visit"}
                  </span>
                </div>

              </div>

              <!-- WhatsApp Confirmation Alert Banner -->
              <div class="flex items-center gap-3 bg-gradient-to-r from-[#10B981]/10 via-[#14B8A6]/10 to-[#10B981]/10 border border-[#10B981]/20 p-3.5 rounded-2xl text-[#065F46] dark:text-[#6EE7B7] text-sm font-semibold shadow-xs">
                <span class="text-xl shrink-0">💬</span>
                <span class="leading-tight">Confirmation details & service ticket sent to your WhatsApp!</span>
              </div>
            </div>
          `,
          confirmButtonText: "Great, Thank You! ✨",
          buttonsStyling: false,
          customClass: {
            popup: "rounded-3xl shadow-2xl border border-[#E2E8F0]/80 dark:border-[#1E293B] dark:bg-[#020617] max-w-xl w-full p-6 text-sans overflow-hidden",
            confirmButton: "w-full mt-4 py-3.5 px-6 bg-gradient-to-r from-[#4F46E5] via-[#2563EB] to-[#4338CA] hover:from-[#4338CA] hover:to-[#1D4ED8] text-[#FFFFFF] font-black text-base rounded-xl shadow-lg shadow-[#6366F1]/25 hover:shadow-[#6366F1]/40 transition-all duration-200 cursor-pointer transform hover:scale-[1.01] active:scale-[0.99]"
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
        <div className="mt-6 overflow-hidden rounded-3xl border border-[#CBD5E1] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] p-6 shadow-xl relative text-left">
          {/* Background Ambient Glow Effects */}
          <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-[#10B981]/10 blur-2xl pointer-events-none"></div>
          <div className="absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-[#3B82F6]/10 blur-2xl pointer-events-none"></div>

          {/* Top Success Badge */}
          <div className="flex justify-center mb-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-[#10B981]/20 blur-lg animate-pulse"></div>
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#10B981] to-[#059669] text-white shadow-lg shadow-[#10B981]/30">
                <CheckCircle2 size={36} />
              </div>
            </div>
          </div>

          <h2 className="text-center text-[26px] font-black tracking-tight text-[#1E293B] dark:text-[#F1F5F9]">
            Appointment Confirmed! 🎉
          </h2>
          <p className="mt-1 text-center text-[15px] font-medium text-[#64748B] dark:text-[#94A3B8]">
            Your service appointment details have been updated and confirmed in our system.
          </p>

          {/* Main Detail Card */}
          <div className="mx-auto mt-6 max-w-md space-y-3 rounded-2xl border border-[#E2E8F0] dark:border-[#1E293B] bg-gradient-to-b from-[#F8FAFC] to-[#F1F5F9]/80 dark:from-[#1E293B]/80 dark:to-[#0F172A]/80 p-4 shadow-xs">
            
            {/* Customer & Vehicle Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-[#1E293B]">
              <div className="space-y-0.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] dark:text-[#64748B]">Customer</p>
                <p className="text-[16px] font-black text-[#1E293B] dark:text-[#F1F5F9]">{data?.custName || "Valued Customer"}</p>
              </div>
              <div className="text-right space-y-0.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] dark:text-[#64748B]">Vehicle No</p>
                <span className="mt-0.5 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold shadow-xs" style={{ background: "linear-gradient(to right, #2563eb, #4f46e5)", color: "#ffffff" }}>
                  🚗 {data?.vehicleNo || vehicleNoParam || "N/A"}
                </span>
              </div>
            </div>

            {/* Grid Details: Date & Time */}
            <div className="grid grid-cols-2 gap-2.5 pt-0.5">
              <div className="rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] p-3 shadow-2xs">
                <div className="flex items-center gap-1.5 text-[#94A3B8] mb-0.5">
                  <Calendar size={14} />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Date</span>
                </div>
                <p className="text-[15px] font-black text-[#1E293B] dark:text-[#F1F5F9]">{appointmentDate}</p>
              </div>

              <div className="rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] p-3 shadow-2xs">
                <div className="flex items-center gap-1.5 text-[#94A3B8] mb-0.5">
                  <Clock size={14} />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Time Slot</span>
                </div>
                <p className="text-[15px] font-black text-[#1E293B] dark:text-[#F1F5F9]">{formatTimeDisplay(appointmentTime)}</p>
              </div>
            </div>

            {/* Workshop Location Card */}
            <div className="rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] p-3 shadow-2xs flex items-start gap-2.5">
              <MapPin size={18} className="mt-0.5 shrink-0 text-[#2563EB] dark:text-[#60A5FA]" />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] dark:text-[#64748B]">Workshop Location</p>
                <p className="text-[14px] font-black text-[#1E293B] dark:text-[#F1F5F9] mt-0.5 leading-snug">{data?.serviceCenter || "AutoVyn Service Center"}</p>
              </div>
            </div>

            {/* Service Type Badge */}
            <div className="rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] p-3 shadow-2xs flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] dark:text-[#64748B]">Service Type</span>
              <span className={`text-[12px] font-extrabold px-2.5 py-1 rounded-lg ${pickupOption === "PICKUP_REQUIRED" ? "bg-[#F59E0B]/10 text-[#B45309] dark:text-[#FCD34D] border border-[#F59E0B]/20" : "bg-[#10B981]/10 text-[#047857] dark:text-[#6EE7B7] border border-[#10B981]/20"}`}>
                {pickupOption === "PICKUP_REQUIRED" ? "🚚 Home Pickup Requested" : "🚗 Self Drive Workshop Visit"}
              </span>
            </div>

          </div>

          {/* WhatsApp Alert Banner */}
          <div className="mx-auto mt-4 max-w-md flex items-center gap-3 rounded-2xl border border-[#10B981]/30 bg-gradient-to-r from-[#10B981]/10 via-[#14B8A6]/10 to-[#10B981]/10 p-3.5 text-[14px] font-semibold text-[#047857] dark:text-[#6EE7B7]">
            <span className="text-xl shrink-0">💬</span>
            <span className="leading-tight">Confirmation details & service ticket sent to your WhatsApp!</span>
          </div>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsSaved(false)}
              className="inline-flex items-center gap-2 rounded-xl border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#1E293B] px-6 py-3 text-[15px] font-bold text-[#334155] dark:text-[#F1F5F9] shadow-sm transition-all hover:bg-[#F8FAFC] dark:hover:bg-[#0F172A] hover:border-[#94A3B8] cursor-pointer"
            >
              <Wrench size={18} className="text-[#2563EB] dark:text-[#60A5FA]" /> Modify / Reschedule Appointment
            </button>
          </div>
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
