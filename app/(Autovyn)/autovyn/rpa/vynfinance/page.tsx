"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import axios from "axios";
import Swal from "sweetalert2";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import {
  Monitor,
  Server,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Laptop,
  Maximize2,
  Minimize2,
  X,
  Lock,
  User,
  ShieldCheck,
  Terminal,
  Activity,
  ArrowRight,
  Copy,
  Check,
  Sparkles,
  Zap,
  FolderSearch,
  Eye,
  EyeOff,
  Calendar,
  Settings2,
  Key
} from "lucide-react";

interface StreamStepData {
  step: number;
  title: string;
  detail: string;
  timestamp?: string;
  raw?: boolean;
}

interface CompleteData {
  success: boolean;
  message: string;
  log?: string;
}

export default function RpaVynfinancePage() {
  const user = useCurrentUser();
  const userId = user?.name || user?.EMPCODE || "admin";
  const defaultCompCode = user?.Comp_Code || "devteam";
  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:5000";

  // Configuration States
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("$ecure@0273");
  const [rdpUsername, setRdpUsername] = useState("atendra");
  const [rdpPassword, setRdpPassword] = useState("user@123");
  const [showPassword, setShowPassword] = useState(false);
  const [showRdpPassword, setShowRdpPassword] = useState(false);
  const [targetShortcut, setTargetShortcut] = useState("Suwalka Motors Start-up");
  const [targetModule, setTargetModule] = useState("Right Sidebar -> Cost-Sheet (ICM) -> Outstanding (Dr.) -> PrintView (OK)");
  const [dateFrom, setDateFrom] = useState("01/10/26");
  const [dateUpto, setDateUpto] = useState("30/10/26");

  const isSuwalkaOutstanding =
    targetShortcut === "Suwalka Motors Start-up" ||
    targetShortcut === "AUTOVYN-STARTUP1" ||
    targetShortcut.toLowerCase().includes("suwalka");

  // Live Stream / Execution States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepTitle, setStepTitle] = useState("Ready to start");
  const [stepDetail, setStepDetail] = useState("Click 'Launch 1-Click RPA Login' to begin.");
  const [logs, setLogs] = useState<string[]>([]);
  const [streamSteps, setStreamSteps] = useState<StreamStepData[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completeData, setCompleteData] = useState<CompleteData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedLog, setCopiedLog] = useState(false);

  // Live clock & stopwatch
  const [currentClockTime, setCurrentClockTime] = useState("");
  const [currentClockDate, setCurrentClockDate] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const terminalBottomRef = useRef<HTMLDivElement | null>(null);

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
          year: "numeric"
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectShortcut = (shortcut: string) => {
    setTargetShortcut(shortcut);
    const sc = shortcut.toLowerCase();
    if (sc.includes("suwalka") || shortcut === "AUTOVYN-STARTUP1") {
      setTargetModule("Right Sidebar -> Cost-Sheet (ICM) -> Outstanding (Dr.) -> PrintView (OK)");
    } else if (sc.includes("rana") || shortcut === "AUTOVYN-STARTUP") {
      setTargetModule("Module Integration -> Pre-Sales -> ICM Register -> E-Mail (Yes)");
    } else {
      setTargetModule("Rana: ICM Register (E-Mail) | Suwalka: Outstanding Dr. (OK)");
    }
  };

  // Elapsed Timer when running
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning) {
      setElapsedSeconds(0);
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning]);

  // Auto-scroll terminal log
  useEffect(() => {
    if (terminalBottomRef.current) {
      terminalBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const formatElapsed = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const cleanupStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  };

  // 1-Click Launch Automation
  const handleLaunchAutomation = (action: string = "full", submitBtn: string = "email") => {
    setIsModalOpen(true);
    setIsRunning(true);
    setIsCompleted(false);
    setErrorMessage(null);
    setCompleteData(null);
    setCurrentStep(1);
    const initialTitle =
      action === "login"
        ? "Launching Shortcut & Accounts Module Login..."
        : action === "outstanding"
        ? "Secondary Server: Outstanding (Dr.) -> OK..."
        : action === "filter"
        ? "Filling PrintView Filter & E-Mail..."
        : action === "multibranch"
        ? "Activating Multi Branch Environment..."
        : isSuwalkaOutstanding
        ? "Launching Suwalka Motors: Outstanding (Dr.)..."
        : "Launching Rana Motors: ICM Register (E-Mail)...";

    const initialDetail =
      action === "login"
        ? `Target: ${targetShortcut} | Opening RemoteApp -> [F1] Accounts Module -> Logging in as ${username}...`
        : action === "outstanding"
        ? `Right Sidebar -> Cost-Sheet (ICM) -> Outstanding (Dr.) -> Date Range -> OK...`
        : action === "filter"
        ? `Entering Date: ${dateFrom} to ${dateUpto} & clicking E-Mail (Yes)...`
        : action === "multibranch"
        ? "Clicking Windows menu -> Set Multi Branch Environment (Ctrl+M)..."
        : isSuwalkaOutstanding
        ? `Target: ${targetShortcut} | Right Sidebar -> Cost-Sheet (ICM) -> Outstanding (Dr.) -> Date Range: ${dateFrom} to ${dateUpto} -> OK...`
        : `Target: ${targetShortcut} | Windows [Ctrl+M] -> Pre-Sales -> ICM Register -> Date Range: ${dateFrom} to ${dateUpto} -> E-Mail (Yes)...`;

    setStepTitle(initialTitle);
    setStepDetail(initialDetail);
    setLogs([
      `[${new Date().toLocaleTimeString()}] [INFO] Starting AUTOVYN-STARTUP RPA (Target: ${targetShortcut}, Mode: ${action}, Submit: ${submitBtn})...`
    ]);
    setStreamSteps([]);

    cleanupStream();

    const streamUrl = `${baseUrl}/api/rpa/vynfinance/live-stream?username=${encodeURIComponent(
      username
    )}&password=${encodeURIComponent(password)}&rdpUsername=${encodeURIComponent(
      rdpUsername
    )}&rdpPassword=${encodeURIComponent(
      rdpPassword
    )}&dateFrom=${encodeURIComponent(
      dateFrom
    )}&dateUpto=${encodeURIComponent(dateUpto)}&submitButton=${encodeURIComponent(
      submitBtn
    )}&action=${encodeURIComponent(action)}&shortcut=${encodeURIComponent(
      targetShortcut
    )}&compcode=${encodeURIComponent(defaultCompCode)}`;

    const sse = new EventSource(streamUrl);
    eventSourceRef.current = sse;

    sse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Completion event
        if (data.completed) {
          setIsRunning(false);
          setIsCompleted(true);
          setCompleteData(data);
          if (data.success) {
            if (action === "login") {
              setCurrentStep(3);
              setStepTitle("Accounts Module Login Successful!");
              setStepDetail(`Target '${targetShortcut}' successfully opened and logged in as '${username}'.`);
            } else if (action === "outstanding" || targetShortcut === "AUTOVYN-STARTUP1") {
              setCurrentStep(6);
              setStepTitle("Outstanding (Dr.) Report Generated Successfully!");
              setStepDetail(`PrintView Date Range: ${dateFrom} to ${dateUpto} submitted with OK.`);
            } else {
              setCurrentStep(6);
              setStepTitle("ICM Register E-Mail Dispatched Successfully!");
              setStepDetail(`PrintView Date Range: ${dateFrom} to ${dateUpto} submitted via E-Mail.`);
            }
            setLogs((prev) => [
              ...prev,
              `[${new Date().toLocaleTimeString()}] [SUCCESS] Automation finished with 100% success.`
            ]);
          } else {
            setErrorMessage(data.error || data.message || "Automation failed");
            setLogs((prev) => [
              ...prev,
              `[${new Date().toLocaleTimeString()}] [ERROR] ${data.error || data.message || "Automation failed"}`
            ]);
          }
          cleanupStream();
          return;
        }

        // Live step progress
        if (data.step) {
          setCurrentStep(data.step);
          setStepTitle(data.title || "In Progress");
          setStepDetail(data.detail || "");
          setStreamSteps((prev) => [...prev, data]);
          setLogs((prev) => [
            ...prev,
            `[${new Date().toLocaleTimeString()}] [STEP ${data.step}] ${data.title}: ${data.detail}`
          ]);
        }
      } catch (parseErr) {
        setLogs((prev) => [...prev, `[RAW] ${event.data}`]);
      }
    };

    sse.onerror = (err) => {
      console.warn("VYNFINANCE SSE disconnected or completed");
      setIsRunning(false);
      cleanupStream();
    };
  };

  // Quick Direct Trigger (REST POST)
  const handleQuickTrigger = async () => {
    try {
      const confirm = await Swal.fire({
        title: "Launch AUTOVYN-STARTUP Automation?",
        html: `
          <div style="text-align: left; font-size: 13px; color: #64748B;">
            <p><strong>Shortcut:</strong> ${targetShortcut}</p>
            <p><strong>Module:</strong> ${targetModule}</p>
            <p><strong>User:</strong> ${username}</p>
            <p><strong>Date Range:</strong> ${dateFrom} to ${dateUpto}</p>
          </div>
        `,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#2563EB",
        confirmButtonText: "Yes, Run Automation",
        cancelButtonText: "Cancel"
      });

      if (confirm.isConfirmed) {
        handleLaunchAutomation();
      }
    } catch (err: any) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const copyFullLog = () => {
    navigator.clipboard.writeText(logs.join("\n"));
    setCopiedLog(true);
    setTimeout(() => setCopiedLog(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header & Navigation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E2E8F0] dark:border-[#1E293B]">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#2563EB]/10 dark:bg-[#3B82F6]/20 rounded-2xl text-[#2563EB] dark:text-[#60A5FA]">
              <Monitor className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#0F172A] dark:text-[#FFFFFF] flex items-center gap-2">
                AUTOVYN-STARTUP Desktop RPA
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#D1FAE5] text-[#065F46] dark:bg-[#064E3B] dark:text-[#A7F3D0] font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                  Direct Desktop Native
                </span>
              </h1>
              <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                Automated 1-Click Desktop Login &amp; Accounts Module Navigator for AUTOVYN-STARTUP
              </p>
            </div>
          </div>

          {/* Navigation Pill Links */}
          <div className="flex flex-wrap items-center gap-2 bg-[#E2E8F0]/60 dark:bg-[#0F172A] p-1.5 rounded-xl border border-[#CBD5E1]/60 dark:border-[#1E293B]">
            <Link
              href="/autovyn/rpa/attendance"
              className="px-3.5 py-1.5 text-xs font-medium rounded-lg text-[#475569] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#FFFFFF] transition"
            >
              Attendance RPA
            </Link>
            <Link
              href="/autovyn/rpa/whatsapp"
              className="px-3.5 py-1.5 text-xs font-medium rounded-lg text-[#475569] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#FFFFFF] transition"
            >
              WhatsApp Hub
            </Link>
            <Link
              href="/autovyn/rpa/outlook"
              className="px-3.5 py-1.5 text-xs font-medium rounded-lg text-[#475569] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#FFFFFF] transition"
            >
              Email OTP RPA
            </Link>
            <Link
              href="/autovyn/rpa/vynfinance"
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#FFFFFF] dark:bg-[#1E293B] text-[#2563EB] dark:text-[#60A5FA] shadow-sm transition"
            >
              AUTOVYN RPA
            </Link>
            <Link
              href="/autovyn/rpa/vynfinance/servers"
              className="px-3.5 py-1.5 text-xs font-medium rounded-lg text-[#475569] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#FFFFFF] transition flex items-center gap-1.5"
            >
              <Key className="w-3.5 h-3.5 text-[#2563EB]" />
              Credentials Vault
            </Link>
            <Link
              href="/autovyn/rpa/ai-vision"
              className="px-3.5 py-1.5 text-xs font-medium rounded-lg text-[#475569] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#FFFFFF] transition"
            >
              AI Vision Odometer
            </Link>
          </div>
        </div>

        {/* Real-time Status Card & Live Clock */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#FFFFFF] dark:bg-[#0F172A] rounded-2xl border border-[#E2E8F0] dark:border-[#1E293B] p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#EFF6FF] dark:bg-[#1E3A8A]/40 text-[#2563EB] dark:text-[#93C5FD]">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                Execution Mode
              </p>
              <p className="text-sm font-bold text-[#0F172A] dark:text-[#FFFFFF]">
                Direct Desktop
              </p>
            </div>
          </div>

          <div className="bg-[#FFFFFF] dark:bg-[#0F172A] rounded-2xl border border-[#E2E8F0] dark:border-[#1E293B] p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B]/40 text-[#10B981] dark:text-[#6EE7B7]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                Default Auth User
              </p>
              <p className="text-sm font-bold text-[#0F172A] dark:text-[#FFFFFF]">
                {username} <span className="text-xs text-[#94A3B8] font-normal">({password})</span>
              </p>
            </div>
          </div>

          <div className="bg-[#FFFFFF] dark:bg-[#0F172A] rounded-2xl border border-[#E2E8F0] dark:border-[#1E293B] p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#F5F3FF] dark:bg-[#4C1D95]/40 text-[#8B5CF6] dark:text-[#C4B5FD]">
              <FolderSearch className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                Application Target
              </p>
              <p className="text-sm font-bold text-[#0F172A] dark:text-[#FFFFFF]">
                {targetShortcut === "both"
                  ? "⚡ Both (Sequential Queue)"
                  : targetShortcut === "AUTOVYN-STARTUP1"
                  ? "AUTOVYN-STARTUP1 (.30)"
                  : "AUTOVYN-STARTUP (.35)"}
              </p>
            </div>
          </div>

          <div className="bg-[#FFFFFF] dark:bg-[#0F172A] rounded-2xl border border-[#E2E8F0] dark:border-[#1E293B] p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#FFFBEB] dark:bg-[#78350F]/40 text-[#F59E0B] dark:text-[#FCD34D]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                Live System Clock
              </p>
              <p className="text-sm font-bold text-[#0F172A] dark:text-[#FFFFFF] font-mono">
                {currentClockTime || "Loading..."}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Grid: Config + 4-Step Pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 1 Col: Configuration Form */}
          <div className="bg-[#FFFFFF] dark:bg-[#0F172A] rounded-3xl border border-[#E2E8F0] dark:border-[#1E293B] p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#1E293B] pb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#2563EB]" />
                <h2 className="text-base font-bold text-[#0F172A] dark:text-[#FFFFFF]">
                  Automation Parameters
                </h2>
              </div>
              <Link
                href="/autovyn/rpa/vynfinance/servers"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#EFF6FF] dark:bg-[#1E3A8A]/40 text-[#2563EB] dark:text-[#93C5FD] hover:bg-[#DBEAFE] transition"
              >
                <Settings2 className="w-3.5 h-3.5" />
                Manage Passwords
              </Link>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#475569] dark:text-[#94A3B8] block mb-1.5">
                  Target Desktop Shortcut / Server
                </label>
                <div className="relative mb-2">
                  <FolderSearch className="w-4 h-4 text-[#94A3B8] absolute left-3 top-3 pointer-events-none" />
                  <select
                    value={targetShortcut}
                    onChange={(e) => handleSelectShortcut(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-[#CBD5E1] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#020617] text-[#0F172A] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  >
                    <option value="Suwalka Motors Start-up">Suwalka Motors Start-up (Right Sidebar -&gt; Outstanding Dr. -&gt; OK)</option>
                    <option value="Rana motors Startup">Rana motors Startup (Pre-Sales -&gt; ICM Register -&gt; E-Mail)</option>
                    <option value="both">⚡ Run Both Sequentially (Rana then Suwalka)</option>
                  </select>
                </div>

                {/* Quick Selection Pills */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSelectShortcut("Suwalka Motors Start-up")}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition ${
                      isSuwalkaOutstanding && targetShortcut !== "both"
                        ? "bg-[#2563EB] text-white shadow-sm"
                        : "bg-[#F1F5F9] dark:bg-[#1E293B] text-[#64748B] hover:text-[#0F172A] dark:hover:text-white"
                    }`}
                  >
                    Suwalka Motors (Outstanding)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectShortcut("Rana motors Startup")}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition ${
                      !isSuwalkaOutstanding && targetShortcut !== "both"
                        ? "bg-[#2563EB] text-white shadow-sm"
                        : "bg-[#F1F5F9] dark:bg-[#1E293B] text-[#64748B] hover:text-[#0F172A] dark:hover:text-white"
                    }`}
                  >
                    Rana Motors (Mail)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectShortcut("both")}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition ${
                      targetShortcut === "both"
                        ? "bg-[#8B5CF6] text-white shadow-sm"
                        : "bg-[#F1F5F9] dark:bg-[#1E293B] text-[#64748B] hover:text-[#0F172A] dark:hover:text-white"
                    }`}
                  >
                    ⚡ Run Both
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#475569] dark:text-[#94A3B8] block mb-1.5">
                  Target Module Navigation
                </label>
                <input
                  type="text"
                  value={targetModule}
                  onChange={(e) => setTargetModule(e.target.value)}
                  placeholder="Module Integration -> Pre-Sales -> ICM Register"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[#CBD5E1] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#020617] text-[#0F172A] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              {/* RemoteApp & ERP Credentials Block */}
              <div className="p-3.5 rounded-2xl bg-[#F8FAFC] dark:bg-[#020617] border border-[#CBD5E1] dark:border-[#334155] space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#2563EB] block">
                  Authentication Credentials
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#475569] dark:text-[#94A3B8] block mb-1">
                      RemoteApp User
                    </label>
                    <input
                      type="text"
                      value={rdpUsername}
                      onChange={(e) => setRdpUsername(e.target.value)}
                      placeholder="atendra"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#475569] dark:text-[#94A3B8] block mb-1">
                      RemoteApp Pass
                    </label>
                    <div className="relative">
                      <input
                        type={showRdpPassword ? "text" : "password"}
                        value={rdpPassword}
                        onChange={(e) => setRdpPassword(e.target.value)}
                        placeholder="user@123"
                        className="w-full pr-8 px-3 py-1.5 text-xs rounded-lg border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRdpPassword(!showRdpPassword)}
                        className="absolute right-2 top-2 text-[#94A3B8] hover:text-[#0F172A]"
                      >
                        {showRdpPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[#E2E8F0] dark:border-[#1E293B]">
                  <div>
                    <label className="text-xs font-semibold text-[#475569] dark:text-[#94A3B8] block mb-1">
                      ERP Login Username
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="admin"
                        className="w-full pl-8 pr-2 py-1.5 text-xs rounded-lg border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#475569] dark:text-[#94A3B8] block mb-1">
                      ERP Login Password
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-2.5" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-2 text-[#94A3B8] hover:text-[#0F172A]"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#475569] dark:text-[#94A3B8] block mb-1.5">
                    Date From
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-[#94A3B8] absolute left-3 top-3" />
                    <input
                      type="text"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      placeholder="01/10/26"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-[#CBD5E1] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#020617] text-[#0F172A] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#475569] dark:text-[#94A3B8] block mb-1.5">
                    Date Upto
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-[#94A3B8] absolute left-3 top-3" />
                    <input
                      type="text"
                      value={dateUpto}
                      onChange={(e) => setDateUpto(e.target.value)}
                      placeholder="30/10/26"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-[#CBD5E1] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#020617] text-[#0F172A] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 space-y-2.5">
                {/* 1. Dedicated Login Only Test Button */}
                <Button
                  onClick={() => handleLaunchAutomation("login")}
                  variant="outline"
                  className="w-full border-2 border-[#2563EB] text-[#2563EB] hover:bg-[#EFF6FF] dark:hover:bg-[#1E3A8A]/30 dark:text-[#60A5FA] rounded-xl py-2.5 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
                >
                  <Key className="w-4 h-4" />
                  {targetShortcut === "both"
                    ? "Launch & Login BOTH Servers (Server 1 + Server 2)"
                    : `Launch & Login: ${targetShortcut} (Test Login)`}
                </Button>

                {/* 2. Full 6-Step Automation Button */}
                <Button
                  onClick={handleQuickTrigger}
                  className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-[#FFFFFF] rounded-xl py-3 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#2563EB]/25"
                >
                  <Play className="w-4 h-4 fill-current" />
                  {targetShortcut === "both"
                    ? "Launch Full Automation for BOTH Servers (Queue)"
                    : `Launch Full Automation: ${targetShortcut}`}
                </Button>

                {/* 3. Sub-step buttons */}
                <div className="grid grid-cols-2 gap-2">
                  {isSuwalkaOutstanding ? (
                    <Button
                      onClick={() => handleLaunchAutomation("outstanding", "ok")}
                      variant="outline"
                      className="border-2 border-[#059669] text-[#059669] hover:bg-[#D1FAE5] dark:hover:bg-[#064E3B] dark:text-[#34D399] rounded-xl py-2 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Outstanding (Dr.) &gt; OK
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleLaunchAutomation("filter", "email")}
                      variant="outline"
                      className="border-2 border-[#059669] text-[#059669] hover:bg-[#D1FAE5] dark:hover:bg-[#064E3B] dark:text-[#34D399] rounded-xl py-2 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Fill &amp; E-Mail (Yes)
                    </Button>
                  )}
                  <Button
                    onClick={() => handleLaunchAutomation("multibranch")}
                    variant="outline"
                    className="border-2 border-[#7C3AED] text-[#7C3AED] hover:bg-[#EDE9FE] dark:hover:bg-[#4C1D95]/30 dark:text-[#A78BFA] rounded-xl py-2 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    Set Multi-Branch
                  </Button>
                </div>

                <p className="text-[11px] text-center text-[#94A3B8]">
                  Target: <strong>{targetShortcut}</strong> | User: <strong>{username}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Right 2 Cols: 6-Step Automated Workflow Architecture */}
          <div className="lg:col-span-2 bg-[#FFFFFF] dark:bg-[#0F172A] rounded-3xl border border-[#E2E8F0] dark:border-[#1E293B] p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#1E293B] pb-4">
              <div>
                <h2 className="text-base font-bold text-[#0F172A] dark:text-[#FFFFFF] flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-[#10B981]" />
                  Direct Desktop RPA Execution Pipeline
                </h2>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                  Direct hardware-level execution: Login -&gt; Module Integration -&gt; ICM Register -&gt; PrintView
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#EFF6FF] text-[#2563EB] dark:bg-[#1E3A8A]/40 dark:text-[#93C5FD]">
                Native Win32 Engine (Zero Python)
              </span>
            </div>

            {/* Pipeline Step Cards matching direct flow */}
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl border border-[#E2E8F0] dark:border-[#1E293B] bg-[#F8FAFC]/80 dark:bg-[#020617]/50 flex items-start gap-4">
                <div className="w-8 h-8 rounded-xl bg-[#2563EB] text-[#FFFFFF] flex items-center justify-center font-bold text-sm shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#FFFFFF]">
                      Direct Desktop Launch &amp; Double-Click Shortcut
                    </h3>
                    <span className="text-[11px] font-mono text-[#2563EB] bg-[#EFF6FF] dark:bg-[#1E3A8A]/40 px-2 py-0.5 rounded-md font-semibold">
                      {targetShortcut}
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                    Minimizes open windows to reveal Desktop, targets the desktop icon <strong>{targetShortcut}</strong>, and executes a double-click to launch directly.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-[#E2E8F0] dark:border-[#1E293B] bg-[#F8FAFC]/80 dark:bg-[#020617]/50 flex items-start gap-4">
                <div className="w-8 h-8 rounded-xl bg-[#2563EB] text-[#FFFFFF] flex items-center justify-center font-bold text-sm shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#FFFFFF]">
                      Gateway Screen &amp; Trigger '[F1] ACCOUNTS MODULE'
                    </h3>
                    <span className="text-[11px] font-semibold text-[#10B981] bg-[#ECFDF5] dark:bg-[#064E3B]/40 px-2 py-0.5 rounded-md">
                      F1 Key / Double Click
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                    Detects the <strong>Home Screen (Gateway of Software)</strong> window, clicks the bottom toolbar button <strong>[F1] ACCOUNTS MODULE</strong> at (200, 585) &amp; sends F1 keystroke.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-[#E2E8F0] dark:border-[#1E293B] bg-[#F8FAFC]/80 dark:bg-[#020617]/50 flex items-start gap-4">
                <div className="w-8 h-8 rounded-xl bg-[#2563EB] text-[#FFFFFF] flex items-center justify-center font-bold text-sm shrink-0">
                  3
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#FFFFFF]">
                      Enter Credentials &amp; Click 'Login' Button
                    </h3>
                    <span className="text-[11px] font-mono text-[#8B5CF6] bg-[#F5F3FF] dark:bg-[#4C1D95]/40 px-2 py-0.5 rounded-md font-semibold">
                      {username} / {password}
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                    On the <strong>Welcome to Accounts Module</strong> dialog, clicks Username (853, 409), Password (853, 469), and clicks <strong>Login</strong> (784, 572).
                  </p>
                </div>
              </div>

              {isSuwalkaOutstanding ? (
                <>
                  <div className="p-3.5 rounded-2xl border border-[#E2E8F0] dark:border-[#1E293B] bg-[#F8FAFC]/80 dark:bg-[#020617]/50 flex items-start gap-4">
                    <div className="w-8 h-8 rounded-xl bg-[#2563EB] text-[#FFFFFF] flex items-center justify-center font-bold text-sm shrink-0">
                      4
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#FFFFFF]">
                          Click 'Cost-Sheet (ICM)' in Right Sidebar
                        </h3>
                        <span className="text-[11px] font-semibold text-[#10B981] bg-[#ECFDF5] dark:bg-[#064E3B]/40 px-2 py-0.5 rounded-md">
                          Sidebar Bottom
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                        Clicks the right bottom button <strong>Cost-Sheet (ICM)</strong> under Financial View at calibrated coordinate (1290, 616).
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl border border-[#E2E8F0] dark:border-[#1E293B] bg-[#F8FAFC]/80 dark:bg-[#020617]/50 flex items-start gap-4">
                    <div className="w-8 h-8 rounded-xl bg-[#2563EB] text-[#FFFFFF] flex items-center justify-center font-bold text-sm shrink-0">
                      5
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#FFFFFF]">
                          Click 'Outstanding (Dr.)' Button
                        </h3>
                        <span className="text-[11px] font-semibold text-[#8B5CF6] bg-[#F5F3FF] dark:bg-[#4C1D95]/40 px-2 py-0.5 rounded-md font-mono">
                          Above Financial View
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                        Clicks <strong>Outstanding (Dr.)</strong> directly above Financial View at (1290, 538) to trigger the PrintView (IOS-DR) dialog.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl border border-[#E2E8F0] dark:border-[#1E293B] bg-[#F8FAFC]/80 dark:bg-[#020617]/50 flex items-start gap-4">
                    <div className="w-8 h-8 rounded-xl bg-[#10B981] text-[#FFFFFF] flex items-center justify-center font-bold text-sm shrink-0">
                      6
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#FFFFFF]">
                          PrintView (IOS-DR): Date Range &amp; Click 'Ok'
                        </h3>
                        <span className="text-[11px] font-semibold text-[#10B981] bg-[#ECFDF5] dark:bg-[#064E3B]/40 px-2 py-0.5 rounded-md">
                          Generate Report
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                        Detects <strong>PrintView</strong> popup, fills Date From (<code>{dateFrom}</code>), Date Upto (<code>{dateUpto}</code>), and clicks <strong>Ok</strong> at (511, 455) to generate the Outstanding report.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-3.5 rounded-2xl border border-[#E2E8F0] dark:border-[#1E293B] bg-[#F8FAFC]/80 dark:bg-[#020617]/50 flex items-start gap-4">
                    <div className="w-8 h-8 rounded-xl bg-[#2563EB] text-[#FFFFFF] flex items-center justify-center font-bold text-sm shrink-0">
                      4
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#FFFFFF]">
                          Windows Menu -&gt; Set Multi Branch Environment
                        </h3>
                        <span className="text-[11px] font-semibold text-[#10B981] bg-[#ECFDF5] dark:bg-[#064E3B]/40 px-2 py-0.5 rounded-md">
                          Windows &rarr; Ctrl+M
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                        Immediately after login, clicks <strong>Windows</strong> menu at (870, 53) and selects <strong>Set Multi Branch Environment (Ctrl+M)</strong> at (1003, 102).
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl border border-[#E2E8F0] dark:border-[#1E293B] bg-[#F8FAFC]/80 dark:bg-[#020617]/50 flex items-start gap-4">
                    <div className="w-8 h-8 rounded-xl bg-[#2563EB] text-[#FFFFFF] flex items-center justify-center font-bold text-sm shrink-0">
                      5
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#FFFFFF]">
                          Module Integration -&gt; Pre-Sales -&gt; ICM Register
                        </h3>
                        <span className="text-[11px] font-semibold text-[#8B5CF6] bg-[#F5F3FF] dark:bg-[#4C1D95]/40 px-2 py-0.5 rounded-md font-mono">
                          Menu Navigator
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                        Clicks <strong>Module Integration</strong> at (485, 53), targets <strong>Pre-Sales</strong> at (578, 224), and clicks <strong>ICM Register</strong> at (877, 512).
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl border border-[#E2E8F0] dark:border-[#1E293B] bg-[#F8FAFC]/80 dark:bg-[#020617]/50 flex items-start gap-4">
                    <div className="w-8 h-8 rounded-xl bg-[#10B981] text-[#FFFFFF] flex items-center justify-center font-bold text-sm shrink-0">
                      6
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#FFFFFF]">
                          PrintView Dialog: Date Range &amp; Click 'E-Mail'
                        </h3>
                        <span className="text-[11px] font-semibold text-[#10B981] bg-[#ECFDF5] dark:bg-[#064E3B]/40 px-2 py-0.5 rounded-md">
                          E-Mail Dispatch
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                        Detects <strong>PrintView</strong> popup, fills Date From (<code>{dateFrom}</code>), Date Upto (<code>{dateUpto}</code>), and clicks <strong>E-Mail</strong> at (611, 459) to dispatch report.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Live Stream Terminal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000]/70 backdrop-blur-sm p-4">
          <div
            className={`w-full max-w-4xl bg-[#0F172A] rounded-3xl border border-[#334155] shadow-2xl flex flex-col overflow-hidden transition-all ${
              isFullscreen ? "h-[94vh] max-w-[96vw]" : "max-h-[85vh] h-[650px]"
            }`}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#1E293B] bg-[#020617] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#EF4444]" />
                <div className="w-3 h-3 rounded-full bg-[#F59E0B]" />
                <div className="w-3 h-3 rounded-full bg-[#10B981]" />
                <div className="h-4 w-[1px] bg-[#334155] mx-1" />
                <h3 className="text-sm font-bold text-[#FFFFFF] flex items-center gap-2 font-mono">
                  <Terminal className="w-4 h-4 text-[#38BDF8]" />
                  AUTOVYN RPA Execution Console
                </h3>
              </div>

              <div className="flex items-center gap-3">
                {/* Elapsed Timer */}
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1E293B] text-xs font-mono text-[#38BDF8]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatElapsed(elapsedSeconds)}</span>
                </div>

                {/* Status Badge */}
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                    isRunning
                      ? "bg-[#1E3A8A] text-[#93C5FD] animate-pulse"
                      : isCompleted && !errorMessage
                      ? "bg-[#064E3B] text-[#A7F3D0]"
                      : "bg-[#7F1D1D] text-[#FCA5A5]"
                  }`}
                >
                  {isRunning ? "AUTOMATING" : isCompleted && !errorMessage ? "COMPLETED" : "FAILED"}
                </span>

                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="text-[#94A3B8] hover:text-[#FFFFFF] transition p-1"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => {
                    cleanupStream();
                    setIsModalOpen(false);
                  }}
                  className="text-[#94A3B8] hover:text-[#EF4444] transition p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Current Step Banner */}
            <div className="px-6 py-3 bg-[#1E293B]/70 border-b border-[#334155] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                    isCompleted && !errorMessage
                      ? "bg-[#10B981] text-[#FFFFFF]"
                      : isRunning
                      ? "bg-[#2563EB] text-[#FFFFFF] animate-bounce"
                      : "bg-[#EF4444] text-[#FFFFFF]"
                  }`}
                >
                  {currentStep || "!"}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#FFFFFF]">{stepTitle}</h4>
                  <p className="text-xs text-[#94A3B8]">{stepDetail}</p>
                </div>
              </div>

              {isCompleted && !errorMessage && (
                <div className="flex items-center gap-2 text-xs font-bold text-[#10B981]">
                  <CheckCircle2 className="w-4 h-4" />
                  Account Module Ready
                </div>
              )}
            </div>

            {/* Live Terminal Log View */}
            <div className="flex-1 bg-[#020617] p-4 overflow-y-auto font-mono text-xs text-[#E2E8F0] space-y-1.5 select-text">
              {logs.map((log, index) => {
                let colorClass = "text-[#94A3B8]";
                if (log.includes("[SUCCESS]")) colorClass = "text-[#34D399] font-bold";
                else if (log.includes("[ERROR]")) colorClass = "text-[#F87171] font-bold";
                else if (log.includes("[STEP")) colorClass = "text-[#38BDF8] font-semibold";
                else if (log.includes("[INFO]")) colorClass = "text-[#A78BFA]";

                return (
                  <div key={index} className={`leading-relaxed ${colorClass}`}>
                    {log}
                  </div>
                );
              })}
              <div ref={terminalBottomRef} />
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-[#0F172A] border-t border-[#1E293B] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  onClick={copyFullLog}
                  variant="outline"
                  size="sm"
                  className="border-[#334155] text-[#94A3B8] hover:text-[#FFFFFF] hover:bg-[#1E293B] text-xs flex items-center gap-1.5"
                >
                  {copiedLog ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedLog ? "Copied Log" : "Copy Output"}
                </Button>
              </div>

              <div className="flex items-center gap-3">
                {isCompleted && (
                  <Button
                    onClick={handleLaunchAutomation}
                    size="sm"
                    className="bg-[#2563EB] hover:bg-[#1D4ED8] text-[#FFFFFF] text-xs font-bold flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Re-Run Automation
                  </Button>
                )}

                <Button
                  onClick={() => {
                    cleanupStream();
                    setIsModalOpen(false);
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-[#94A3B8] hover:text-[#FFFFFF] text-xs"
                >
                  Close Console
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
