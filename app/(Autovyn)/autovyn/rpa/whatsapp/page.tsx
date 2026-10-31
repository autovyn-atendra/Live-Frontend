"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import axios from "axios";
import Swal from "sweetalert2";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import {
  Smartphone,
  QrCode,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  KeyRound,
  ShieldCheck,
  Play,
  Copy,
  Check,
  ExternalLink,
  Laptop,
  Clock,
  Sparkles,
  Server,
  Zap,
  Calendar,
  Maximize2,
  Minimize2,
  X,
  Globe,
  Lock,
  User,
  ArrowRight
} from "lucide-react";

interface ProgressEventData {
  step: number;
  title: string;
  detail: string;
  currentUrl?: string;
  screenshot?: string;
  timestamp?: string;
}

interface CompleteEventData {
  success: boolean;
  title: string;
  otp?: string;
  storeLink?: string;
  message: string;
}

export default function RpaWhatsAppHubPage() {
  const user = useCurrentUser();
  const userId = user?.name || user?.EMPCODE || "admin";
  const defaultCompCode = user?.Comp_Code || "devteam";
  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:5000";

  // Target Portal & Credentials Configuration Form
  const [targetUrl, setTargetUrl] = useState("http://localhost:3000/autovyn/Billing_Monitor");
  const [compCode, setCompCode] = useState(defaultCompCode);
  const [portalUsername, setPortalUsername] = useState("admin");
  const [portalPassword, setPortalPassword] = useState("11111");

  // WhatsApp connection state
  const [statusLoading, setStatusLoading] = useState(true);
  const [isWaConnected, setIsWaConnected] = useState(false);
  const [waStatus, setWaStatus] = useState("checking");

  // Live Screen Stream Modal States (like Attendance RPA!)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepTitle, setStepTitle] = useState("Ready to start");
  const [stepDetail, setStepDetail] = useState("Click 'Launch Live RPA Automation' to begin.");
  const [currentUrl, setCurrentUrl] = useState("https://web.whatsapp.com");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [progressLog, setProgressLog] = useState<ProgressEventData[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completeData, setCompleteData] = useState<CompleteEventData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(true);

  // Live real-time date, ticking clock counter & elapsed stopwatch
  const [currentClockTime, setCurrentClockTime] = useState("");
  const [currentClockDate, setCurrentClockDate] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Ticking Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentClockTime(now.toLocaleTimeString("en-IN", { hour12: true }));
      setCurrentClockDate(
        now.toLocaleDateString("en-IN", {
          weekday: "short",
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Elapsed Stopwatch
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const formatElapsed = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Fetch WhatsApp status
  const checkStatus = async () => {
    try {
      const res = await axios.get(`${baseUrl}/api/rpa/whatsapp/status`, {
        params: { userId },
        headers: { compcode: compCode },
      });
      if (res.data?.success) {
        setIsWaConnected(Boolean(res.data.connected));
        setWaStatus(res.data.status);
      }
    } catch (e: any) {
      console.warn("Status check note:", e?.message);
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, compCode]);

  // Clean up SSE stream
  const cleanupStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  };

  useEffect(() => {
    return () => cleanupStream();
  }, []);

  // Launch Full-Screen Live Video Screencast Automation
  const startLiveAutomation = () => {
    if (!targetUrl) {
      return Swal.fire({ icon: "warning", title: "Target URL Required", text: "Please provide a target portal URL." });
    }

    setIsModalOpen(true);
    setIsRunning(true);
    setIsCompleted(false);
    setErrorMessage(null);
    setCompleteData(null);
    setCurrentStep(1);
    setStepTitle("Starting RPA Session...");
    setStepDetail("Launching isolated browser engine and attaching video screencast...");
    setProgressLog([]);
    setScreenshot(null);

    cleanupStream();

    const streamUrl = `${baseUrl}/api/rpa/whatsapp/live-stream?userId=${encodeURIComponent(
      userId
    )}&targetUrl=${encodeURIComponent(targetUrl)}&compCode=${encodeURIComponent(
      compCode
    )}&username=${encodeURIComponent(portalUsername)}&password=${encodeURIComponent(portalPassword)}`;

    const sse = new EventSource(streamUrl);
    eventSourceRef.current = sse;

    // Continuous Live Video Stream Frames (CDP Screencast at ~15 FPS!)
    sse.addEventListener("frame", (e: MessageEvent) => {
      if (e.data) {
        setScreenshot(`data:image/jpeg;base64,${e.data}`);
      }
    });

    // Stepper Progress Updates
    sse.addEventListener("progress", (e: MessageEvent) => {
      try {
        const data: ProgressEventData = JSON.parse(e.data);
        setCurrentStep(data.step);
        setStepTitle(data.title);
        setStepDetail(data.detail);
        if (data.currentUrl) setCurrentUrl(data.currentUrl);
        if (data.screenshot && !screenshot) setScreenshot(data.screenshot);
        setProgressLog((prev) => [...prev, data]);
      } catch (err) {
        console.warn("Parse error:", err);
      }
    });

    // Task Completed Event
    sse.addEventListener("complete", (e: MessageEvent) => {
      try {
        const data: CompleteEventData = JSON.parse(e.data);
        setIsRunning(false);
        setIsCompleted(true);
        setCompleteData(data);
        setCurrentStep(7);
        setStepTitle(data.title || "Automation Succeeded!");
        setStepDetail(data.message || "Target Portal unlocked and verified via WhatsApp OTP.");
        cleanupStream();
      } catch (err) {
        console.warn("Parse error:", err);
      }
    });

    // Error Event
    sse.addEventListener("error", (e: MessageEvent) => {
      try {
        if (e.data) {
          const errData = JSON.parse(e.data);
          setErrorMessage(errData.message || "An unexpected automation error occurred.");
          setStepTitle("Automation Interrupted");
          setStepDetail(errData.message || "Error occurred.");
        } else {
          setErrorMessage("Connection to live stream was closed or timed out.");
        }
      } catch (_) {
        setErrorMessage("Connection to live stream was interrupted.");
      }
      setIsRunning(false);
      cleanupStream();
    });

    sse.onerror = () => {
      if (isRunning) {
        setIsRunning(false);
        cleanupStream();
      }
    };
  };

  const handleCloseModal = () => {
    cleanupStream();
    setIsModalOpen(false);
    setIsRunning(false);
  };

  const progressPercent = Math.min(100, Math.round((currentStep / 7) * 100));

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] p-4 md:p-8 space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-[#064E3B] via-[#065F46] to-[#0F172A] text-white rounded-2xl p-6 md:p-8 shadow-xl border border-[#047857]/40">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-[#10B981]/20 text-[#6EE7B7] px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase border border-[#34D399]/30">
              <Smartphone className="w-3.5 h-3.5" /> Autovyn RPA Live Screencast Engine
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Portal 2FA Automation & WhatsApp Interceptor
            </h1>
            <p className="text-[#A7F3D0]/80 text-sm max-w-2xl">
              Watch live video screen stream as the bot navigates to your chosen website, submits credentials,
              intercepts incoming 2FA OTP from <strong>real WhatsApp Web</strong>, and automatically verifies login!
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15 text-center min-w-[210px]">
            <span className="text-xs text-[#A7F3D0] block uppercase tracking-wider font-medium">WhatsApp Status</span>
            <span className="text-sm font-bold text-white flex items-center justify-center gap-1.5 mt-1">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isWaConnected ? "bg-[#10B981] animate-ping" : "bg-[#EF4444]"
                }`}
              />
              {isWaConnected ? "Session Linked & Active" : "Not Linked / Disconnected"}
            </span>
            <span className="text-xs text-[#6EE7B7] block mt-1 font-mono">User: {userId}</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-white/15">
          <Link
            href="/autovyn/rpa/attendance"
            className="px-4 py-2 text-xs font-semibold rounded-xl text-[#A7F3D0] hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5"
          >
            📊 Attendance Report RPA
          </Link>
          <div className="px-4 py-2 text-xs font-bold rounded-xl bg-white text-[#065F46] shadow-sm flex items-center gap-1.5">
            <Smartphone size={14} /> 📱 WhatsApp &amp; Portal 2FA Hub
          </div>
          <Link
            href="/autovyn/rpa/outlook"
            className="px-4 py-2 text-xs font-semibold rounded-xl text-[#A7F3D0] hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5"
          >
            📧 Email OTP RPA
          </Link>
          <Link
            href="/autovyn/rpa/vynfinance"
            className="px-4 py-2 text-xs font-semibold rounded-xl text-[#A7F3D0] hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5"
          >
            🖥️ VYNFINANCE RPA
          </Link>
          <Link
            href="/autovyn/rpa/ai-vision"
            className="px-4 py-2 text-xs font-semibold rounded-xl text-[#A7F3D0] hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5"
          >
            ✨ AI Vision Odometer
          </Link>
        </div>
      </div>

      {/* Main Control Panel & Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Target Website & Credentials Configuration */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1E293B] rounded-2xl p-6 shadow-md border border-[#E2E8F0] dark:border-[#334155] space-y-6">
          <div className="flex items-center justify-between border-b pb-4 border-[#F1F5F9] dark:border-[#334155]">
            <h2 className="text-lg font-bold text-[#1E293B] dark:text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#10B981]" /> Target Website & Portal Credentials
            </h2>
            <span className="text-xs bg-[#ECFDF5] text-[#065F46] dark:bg-[#064E3B]/40 dark:text-[#6EE7B7] px-2.5 py-1 rounded-full font-semibold">
              ● Configurable Automation
            </span>
          </div>

          <div className="space-y-4">
            {/* Target Portal Selection & Custom URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#475569] dark:text-[#CBD5E1] uppercase flex items-center justify-between">
                <span>Target Portal Website URL</span>
                <span className="text-[11px] text-[#10B981] font-normal">Enter any custom portal URL below</span>
              </label>
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="http://localhost:3000/autovyn/Billing_Monitor"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white text-sm font-mono focus:ring-2 focus:ring-[#10B981] focus:outline-none"
              />

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-2 pt-1 text-xs">
                <span className="text-[#64748B] text-[11px] self-center">Presets:</span>
                <button
                  type="button"
                  onClick={() => {
                    setTargetUrl("https://www.teachoo.com/login-mobile/1/");
                    setPortalUsername("6266899053");
                    setCompCode("");
                    setPortalPassword("");
                  }}
                  className="px-2.5 py-1 rounded-md bg-[#3B82F6]/10 border border-[#3B82F6]/30 text-[#3B82F6] font-bold hover:bg-[#3B82F6]/20 flex items-center gap-1"
                >
                  📚 Teachoo (teachoo.com)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTargetUrl("https://web.shoopy.in/login");
                    setPortalUsername("6266899053");
                    setCompCode("");
                    setPortalPassword("");
                  }}
                  className="px-2.5 py-1 rounded-md bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] font-bold hover:bg-[#10B981]/20 flex items-center gap-1"
                >
                  🛍️ Shoopy (web.shoopy.in)
                </button>
                <button
                  type="button"
                  onClick={() => setTargetUrl("http://localhost:3000/autovyn/Billing_Monitor")}
                  className="px-2.5 py-1 rounded-md bg-[#F1F5F9] dark:bg-[#334155] text-[#334155] dark:text-[#E2E8F0] hover:bg-[#E2E8F0]"
                >
                  Billing Monitor (Local)
                </button>
                <button
                  type="button"
                  onClick={() => setTargetUrl("https://devs.autovyn.com/autovyn/Billing_Monitor")}
                  className="px-2.5 py-1 rounded-md bg-[#F1F5F9] dark:bg-[#334155] text-[#334155] dark:text-[#E2E8F0] hover:bg-[#E2E8F0]"
                >
                  Autovyn Live
                </button>
                <button
                  type="button"
                  onClick={() => setTargetUrl("https://dealers.marutisuzuki.com")}
                  className="px-2.5 py-1 rounded-md bg-[#F1F5F9] dark:bg-[#334155] text-[#334155] dark:text-[#E2E8F0] hover:bg-[#E2E8F0]"
                >
                  Maruti DMS
                </button>
              </div>
            </div>

            {/* Credentials Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#475569] dark:text-[#CBD5E1] uppercase">
                  Company / Dealer Code
                </label>
                <input
                  type="text"
                  value={compCode}
                  onChange={(e) => setCompCode(e.target.value)}
                  placeholder="devteam"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white text-sm font-medium focus:ring-2 focus:ring-[#10B981] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#475569] dark:text-[#CBD5E1] uppercase flex items-center gap-1">
                  <User size={13} /> Username / Phone
                </label>
                <input
                  type="text"
                  value={portalUsername}
                  onChange={(e) => setPortalUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white text-sm font-medium focus:ring-2 focus:ring-[#10B981] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#475569] dark:text-[#CBD5E1] uppercase flex items-center gap-1">
                  <Lock size={13} /> Password
                </label>
                <input
                  type="password"
                  value={portalPassword}
                  onChange={(e) => setPortalPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white text-sm font-medium focus:ring-2 focus:ring-[#10B981] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Workflow Steps Explanation Card */}
          <div className="bg-[#F8FAFC] dark:bg-[#1E293B]/60 rounded-xl p-4 border border-[#E2E8F0] dark:border-[#334155] space-y-2">
            <h3 className="text-xs font-bold text-[#334155] dark:text-[#CBD5E1] uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#10B981]" /> Complete Real Automation Workflow:
            </h3>
            <ul className="text-xs text-[#475569] dark:text-[#94A3B8] space-y-1.5 list-disc pl-5">
              <li>Opens high-speed browser with full <strong>real-time video screencast stream</strong> in the modal.</li>
              <li>Navigates to your configured portal and enters Dealer Code, Username, and Password.</li>
              <li>Portal triggers 2FA verification to your registered WhatsApp number.</li>
              <li>Bot automatically switches to <strong>WhatsApp Web</strong>, intercepts the incoming message, and extracts the 4-digit OTP!</li>
              <li>Switches back to portal, enters the OTP into the verification field, and unlocks the page live!</li>
            </ul>
          </div>
        </div>

        {/* Right 1 Col: Execution Trigger & WhatsApp Status */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 shadow-md border border-[#E2E8F0] dark:border-[#334155] flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="border-b pb-4 border-[#F1F5F9] dark:border-[#334155]">
              <h2 className="text-lg font-bold text-[#1E293B] dark:text-white flex items-center gap-2">
                <Laptop className="w-5 h-5 text-[#10B981]" /> Live Execution
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                Launches full-screen live video stream modal with real-time browser preview.
              </p>
            </div>

            {/* Launch Big Action Button */}
            <div className="space-y-3 pt-2">
              <Button
                onClick={startLiveAutomation}
                className="w-full py-6 text-sm font-bold bg-[#10B981] hover:bg-[#059669] text-white shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 rounded-xl"
              >
                <Play className="w-5 h-5 fill-current" /> Launch Live RPA Stream (Watch Live)
              </Button>
            </div>
          </div>

          {/* User & Info Badges */}
          <div className="pt-4 border-t border-[#F1F5F9] dark:border-[#334155] text-xs text-[#94A3B8] space-y-2">
            <div className="flex justify-between items-center">
              <span>Active User:</span>
              <span className="font-semibold text-[#475569] dark:text-[#CBD5E1] font-mono">{userId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Company Code:</span>
              <span className="font-semibold text-[#475569] dark:text-[#CBD5E1] font-mono">{compCode}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* FULL SCREEN LIVE VIDEO SCREENCAST MODAL (SAME AS ATTENDANCE) */}
      {/* ======================================================== */}
      {isModalOpen && (
        <div
          className={`fixed inset-0 z-50 bg-black flex items-center justify-center animate-in fade-in duration-200 ${
            isFullscreen ? "p-0" : "p-2 sm:p-4 bg-black/85 backdrop-blur-md"
          }`}
        >
          <div
            className={`bg-[#0F172A] text-white shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
              isFullscreen
                ? "w-screen h-screen rounded-none border-none fixed inset-0"
                : "w-full max-w-7xl max-h-[92vh] h-[820px] rounded-2xl border border-[#334155]"
            }`}
          >
            {/* Modal Header */}
            <div className="bg-[#1E293B] px-4 py-3 border-b border-[#334155] flex items-center justify-between shrink-0">
              {/* Left: Status Dot & Title */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    {isRunning && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34D399] opacity-75"></span>
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-3 w-3 ${
                        isRunning ? "bg-[#10B981]" : isCompleted ? "bg-[#3B82F6]" : "bg-[#F59E0B]"
                      }`}
                    ></span>
                  </span>
                  <span className="font-bold text-sm tracking-wide">
                    {isRunning ? "LIVE RPA AUTOMATION STREAM" : isCompleted ? "TASK FINISHED" : "RPA BOT"}
                  </span>
                </div>
                <span className="text-xs bg-[#334155] px-2.5 py-0.5 rounded-full text-[#CBD5E1] font-mono hidden sm:inline">
                  Step {currentStep} of 7
                </span>
              </div>

              {/* Center: Live Date & Ticking Time Counter + Stopwatch */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2 bg-[#0F172A] border border-[#334155] px-3 py-1 rounded-xl text-xs font-mono shadow-inner">
                  <Calendar className="w-3.5 h-3.5 text-[#60A5FA]" />
                  <span className="text-[#CBD5E1] font-semibold hidden md:inline">{currentClockDate}</span>
                  <span className="text-[#475569] hidden md:inline">|</span>
                  <Clock className="w-3.5 h-3.5 text-[#34D399] animate-pulse" />
                  <span className="text-[#34D399] font-bold tracking-wider">{currentClockTime}</span>
                </div>

                {isRunning && (
                  <div className="hidden lg:flex items-center gap-1.5 bg-[#064E3B]/60 border border-[#059669]/60 px-2.5 py-1 rounded-xl text-xs font-mono text-[#A7F3D0]">
                    <span className="text-[11px] uppercase tracking-wider text-[#A7F3D0]/70 font-sans">Run Time:</span>
                    <span className="font-bold text-white">{formatElapsed(elapsedSeconds)}</span>
                  </div>
                )}
              </div>

              {/* Right: Fullscreen Toggle and Close */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-1.5 hover:bg-[#334155] rounded-lg text-[#94A3B8] hover:text-white transition-colors"
                  title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleCloseModal}
                  className="p-1.5 hover:bg-[#334155] rounded-lg text-[#94A3B8] hover:text-white transition-colors"
                  title="Close Modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Stepper Progress Bar */}
            <div className="bg-[#162032] px-4 py-2 border-b border-[#1E293B] shrink-0">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-[#60A5FA]">{stepTitle}</span>
                <span className="font-mono text-[#94A3B8]">{progressPercent}%</span>
              </div>
              <div className="w-full bg-[#1E293B] rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#10B981] to-[#3B82F6] h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>

            {/* Modal Body: Two columns (Live Viewport + Step Timeline) */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
              {/* Left: Live Video Screencast Viewport (8 cols) */}
              <div className="lg:col-span-8 bg-black flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#1E293B] overflow-hidden">
                {/* Mock Browser URL Bar */}
                <div className="bg-[#0F172A] px-3 py-1.5 border-b border-[#1E293B] flex items-center gap-2 text-xs font-mono text-[#94A3B8] shrink-0">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F43F5E]/80 inline-block"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]/80 inline-block"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]/80 inline-block"></span>
                  </div>
                  <div className="flex-1 bg-[#1E293B]/80 rounded px-2.5 py-1 text-[11px] truncate text-[#CBD5E1] flex items-center gap-1.5">
                    <span className="text-[#34D399]">🔒</span>
                    <span className="truncate">{currentUrl}</span>
                  </div>
                  <span className="flex items-center gap-1.5 text-[11px] text-[#F43F5E] font-bold tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-[#F43F5E] animate-ping inline-block"></span>
                    LIVE STREAM
                  </span>
                </div>

                {/* Video Screencast Canvas */}
                <div className="flex-1 bg-black flex items-center justify-center overflow-hidden p-2 relative">
                  {screenshot ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={screenshot}
                      alt="Live RPA Automation Viewport"
                      className="w-full h-full object-contain max-h-[75vh] select-none rounded shadow-md border border-[#334155]/50"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-8 space-y-4">
                      <div className="w-16 h-16 rounded-full border-4 border-[#334155] border-t-[#10B981] animate-spin"></div>
                      <div className="space-y-1">
                        <h4 className="text-base font-semibold text-white">Starting Live Video Stream...</h4>
                        <p className="text-xs text-[#94A3B8] max-w-sm">
                          Connecting to browser automation engine. Real-time screen feed will appear in a moment.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Bar inside Screen Area */}
                <div className="bg-[#0F172A] px-4 py-2 border-t border-[#1E293B] text-xs text-[#94A3B8] flex items-center justify-between shrink-0">
                  <span className="flex items-center gap-1.5">
                    <Laptop className="w-3.5 h-3.5 text-[#34D399]" />
                    <span>Display Mode: 1280x800 Video Screencast</span>
                  </span>
                  <span className="font-mono text-[#CBD5E1]">{stepDetail}</span>
                </div>
              </div>

              {/* Right: Steps Timeline & Captured OTP Display (4 cols) */}
              <div className="lg:col-span-4 bg-[#0F172A] flex flex-col justify-between overflow-hidden">
                <div className="p-4 border-b border-[#1E293B] bg-[#1E293B]/40 shrink-0">
                  <h3 className="font-bold text-sm text-white flex items-center justify-between">
                    <span>Automation Timeline</span>
                    <span className="text-[11px] text-[#94A3B8] font-mono">Real-Time Sync</span>
                  </h3>
                </div>

                {/* Progress Log Stepper */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                  {/* Step 1 */}
                  <div className="flex gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ${
                        currentStep > 1
                          ? "bg-[#10B981] text-white"
                          : currentStep === 1
                          ? "bg-[#3B82F6] text-white animate-pulse"
                          : "bg-[#334155] text-[#94A3B8]"
                      }`}
                    >
                      {currentStep > 1 ? "✓" : "1"}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Launch Browser Engine</h4>
                      <p className="text-[#94A3B8] text-[11px]">Start isolated Playwright browser context.</p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ${
                        currentStep > 2
                          ? "bg-[#10B981] text-white"
                          : currentStep === 2
                          ? "bg-[#3B82F6] text-white animate-pulse"
                          : "bg-[#334155] text-[#94A3B8]"
                      }`}
                    >
                      {currentStep > 2 ? "✓" : "2"}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Open WhatsApp Web</h4>
                      <p className="text-[#94A3B8] text-[11px]">Load WhatsApp session and verify chat list.</p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ${
                        currentStep > 4
                          ? "bg-[#10B981] text-white"
                          : currentStep === 4
                          ? "bg-[#3B82F6] text-white animate-pulse"
                          : "bg-[#334155] text-[#94A3B8]"
                      }`}
                    >
                      {currentStep > 4 ? "✓" : "3"}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Navigate to Portal</h4>
                      <p className="text-[#94A3B8] text-[11px]">Submit credentials and trigger 2FA OTP gate.</p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ${
                        currentStep > 6
                          ? "bg-[#10B981] text-white"
                          : currentStep === 6
                          ? "bg-[#3B82F6] text-white animate-pulse"
                          : "bg-[#334155] text-[#94A3B8]"
                      }`}
                    >
                      {currentStep > 6 ? "✓" : "4"}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Intercept Real WhatsApp Message</h4>
                      <p className="text-[#94A3B8] text-[11px]">Extract 4-digit OTP directly from WhatsApp Web.</p>
                    </div>
                  </div>

                  {/* Step 5 */}
                  <div className="flex gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ${
                        currentStep >= 7
                          ? "bg-[#10B981] text-white"
                          : currentStep === 7
                          ? "bg-[#3B82F6] text-white animate-pulse"
                          : "bg-[#334155] text-[#94A3B8]"
                      }`}
                    >
                      {currentStep >= 7 ? "✓" : "5"}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Verify OTP & Unlock Portal</h4>
                      <p className="text-[#94A3B8] text-[11px]">Fill OTP into portal and gain full dashboard access.</p>
                    </div>
                  </div>

                  {/* Completed / Success Box */}
                  {isCompleted && completeData && (
                    <div className="mt-4 p-4 rounded-xl bg-[#064E3B]/40 border border-[#059669] space-y-2.5 animate-in fade-in">
                      <div className="flex items-center gap-2 text-[#34D399] font-bold">
                        <CheckCircle2 size={18} />
                        <span>{completeData.title}</span>
                      </div>
                      <p className="text-white text-xs leading-relaxed">{completeData.message}</p>
                      
                      {completeData.otp && (
                        <div className="bg-[#0F172A] p-2.5 rounded-lg border border-[#059669]/60 text-center">
                          <span className="text-[11px] text-[#A7F3D0] uppercase block">Captured WhatsApp OTP</span>
                          <span className="text-2xl font-mono font-bold tracking-widest text-[#34D399]">
                            {completeData.otp}
                          </span>
                        </div>
                      )}

                      {completeData.storeLink && (
                        <div className="bg-[#0F172A] p-3 rounded-lg border border-[#10B981] space-y-1.5 mt-2">
                          <span className="text-[11px] text-[#A7F3D0] uppercase font-bold flex items-center gap-1">
                            <Sparkles size={12} className="text-[#34D399]" /> Copied Store Link:
                          </span>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              readOnly
                              value={completeData.storeLink}
                              className="w-full bg-[#1E293B] px-2.5 py-1.5 rounded text-xs text-[#38BDF8] font-mono border border-[#334155] select-all focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(completeData.storeLink || "");
                                Swal.fire({
                                  icon: "success",
                                  title: "Copied!",
                                  text: "Store link copied to clipboard",
                                  timer: 1500,
                                  showConfirmButton: false,
                                });
                              }}
                              className="px-3 py-1.5 rounded bg-[#10B981] text-white text-xs font-bold hover:bg-[#059669] shrink-0 flex items-center gap-1 shadow"
                            >
                              <Copy size={12} /> Copy
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Error Box */}
                  {errorMessage && (
                    <div className="mt-4 p-4 rounded-xl bg-[#7F1D1D]/40 border border-[#DC2626] space-y-2 animate-in fade-in">
                      <div className="flex items-center gap-2 text-[#F87171] font-bold">
                        <AlertCircle size={18} />
                        <span>Execution Error</span>
                      </div>
                      <p className="text-white text-xs">{errorMessage}</p>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="p-4 border-t border-[#1E293B] bg-[#1E293B]/40 flex gap-2 shrink-0">
                  <Button
                    onClick={handleCloseModal}
                    className="w-full text-xs bg-[#334155] hover:bg-[#475569] text-white"
                  >
                    Close Modal
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
