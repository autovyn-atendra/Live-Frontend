"use client";

import React, { useState, useEffect, useRef } from "react";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import Swal from "sweetalert2";
import {
  Download,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  ExternalLink,
  Laptop,
  Maximize2,
  Minimize2,
  X,
  FileSpreadsheet,
  Calendar,
  AlertCircle
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
  fileName: string;
  fileSizeBytes: number;
  downloadUrl: string;
  message: string;
}

export default function RpaAttendancePage() {
  const user = useCurrentUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepTitle, setStepTitle] = useState("Ready to start");
  const [stepDetail, setStepDetail] = useState("Click 'Start RPA Download' to begin.");
  const [currentUrl, setCurrentUrl] = useState("https://devs.autovyn.com");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [progressLog, setProgressLog] = useState<ProgressEventData[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completeData, setCompleteData] = useState<CompleteEventData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(true);

  // Live real-time date and ticking clock counter
  const [currentClockTime, setCurrentClockTime] = useState("");
  const [currentClockDate, setCurrentClockDate] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentClockTime(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
      setCurrentClockDate(
        now.toLocaleDateString("en-IN", {
          weekday: "short",
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      );
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Track elapsed duration while automation is running
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isRunning) {
      setElapsedSeconds(0);
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timer) clearInterval(timer);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning]);

  const formatElapsed = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Filter state
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const formatInputDate = (d: Date) => {
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return `${day}/${month}/${d.getFullYear()}`;
  };

  const [dateFrom, setDateFrom] = useState(formatInputDate(firstDay));
  const [dateTo, setDateTo] = useState(formatInputDate(today));

  const eventSourceRef = useRef<EventSource | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const stepsList = [
    { num: 1, label: "Session Init", desc: "Chromium automation engine launch" },
    { num: 2, label: "ERP Login", desc: "Navigating & entering devteam/admin" },
    { num: 3, label: "Authentication", desc: "Verifying session on /branch" },
    { num: 4, label: "Attendance Report", desc: "Opening Attendance Reports dashboard" },
    { num: 5, label: "Filters Setup", desc: "Validating Date From & Date To" },
    { num: 6, label: "Clicking Download", desc: "Targeting 'Download Attendance (Single Line)'" },
    { num: 7, label: "File Intercepted", desc: "Streaming file to your local PC" },
  ];

  const handleStartRpa = () => {
    setIsFullscreen(true);
    setIsModalOpen(true);
    setIsRunning(true);
    setIsCompleted(false);
    setErrorMessage(null);
    setCompleteData(null);
    setCurrentStep(1);
    setStepTitle("Starting RPA Session...");
    setStepDetail("Connecting to Autovyn ERP server automation engine...");
    setProgressLog([]);
    setScreenshot(null);

    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:5000";
    const compCode = user?.Comp_Code || "devteam";

    const streamUrl = `${baseUrl}/rpa/attendance/stream?compcode=${encodeURIComponent(
      compCode
    )}&dateFrom=${encodeURIComponent(dateFrom)}&dateTo=${encodeURIComponent(dateTo)}`;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const sse = new EventSource(streamUrl);
    eventSourceRef.current = sse;

    // Continuous Live Video Stream Frames (from Chrome DevTools screencast)
    sse.addEventListener("frame", (e: MessageEvent) => {
      if (e.data) {
        setScreenshot(`data:image/jpeg;base64,${e.data}`);
      }
    });

    sse.addEventListener("status", (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        setStepTitle(data.title || "Processing");
        setStepDetail(data.detail || "");
      } catch (_) {}
    });

    sse.addEventListener("progress", (e: MessageEvent) => {
      try {
        const data: ProgressEventData = JSON.parse(e.data);
        setCurrentStep(data.step);
        setStepTitle(data.title);
        setStepDetail(data.detail);
        if (data.currentUrl) setCurrentUrl(data.currentUrl);
        if (data.screenshot) setScreenshot(data.screenshot);

        setProgressLog((prev) => [
          ...prev,
          {
            ...data,
            timestamp: new Date().toLocaleTimeString("en-IN", { hour12: false }),
          },
        ]);
      } catch (err) {
        console.error("SSE progress parse error:", err);
      }
    });

    sse.addEventListener("complete", (e: MessageEvent) => {
      try {
        const data: CompleteEventData = JSON.parse(e.data);
        setIsRunning(false);
        setIsCompleted(true);
        setCurrentStep(7);
        setStepTitle("Report Downloaded Successfully!");
        setStepDetail(`Saved file: ${data.fileName} (${(data.fileSizeBytes / 1024).toFixed(1)} KB) - Closing modal...`);
        setCompleteData(data);
        sse.close();

        // Trigger secure in-browser blob download to client's computer (eliminates Chrome's "insecure download" warning)
        triggerLocalBrowserDownload(`${baseUrl}${data.downloadUrl}`, data.fileName);

        Swal.fire({
          icon: "success",
          title: "Download Complete!",
          text: `Attendance report saved: ${data.fileName}`,
          timer: 3500,
          timerProgressBar: true,
          toast: true,
          position: "top-end",
          showConfirmButton: false,
        });

        // Jaise hi complete ho modal off ho jaye
        setTimeout(() => {
          handleCloseModal();
        }, 1200);
      } catch (err) {
        console.error("SSE complete parse error:", err);
      }
    });

    sse.addEventListener("error", (e: any) => {
      try {
        if (e.data) {
          const errData = JSON.parse(e.data);
          setErrorMessage(errData.message || "RPA task encountered an error.");
        } else {
          setErrorMessage("Connection to RPA stream closed or server error.");
        }
      } catch (_) {
        setErrorMessage("RPA task finished or stream connection closed.");
      }
      setIsRunning(false);
      sse.close();
    });
  };

  const triggerLocalBrowserDownload = async (downloadUrl: string, fileName: string) => {
    try {
      const suggestedName = fileName.startsWith("RPA_") ? fileName : `RPA_${fileName}`;
      // Use fetch + blob to prevent Chrome's "Insecure download blocked" warning on HTTP IP connections
      const res = await fetch(downloadUrl);
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", suggestedName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 1000);
    } catch (err) {
      console.error("Auto blob download failed, trying direct link:", err);
      try {
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (fallbackErr) {
        console.error("Fallback download failed:", fallbackErr);
      }
    }
  };

  const [isDirectDownloading, setIsDirectDownloading] = useState(false);

  const handleDirectDownload = async () => {
    try {
      setIsDirectDownloading(true);
      const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:5000";
      const compCode = user?.Comp_Code || "devteam";
      const downloadUrl = `${baseUrl}/rpa/attendance/download?compcode=${encodeURIComponent(
        compCode
      )}&stream=true&dateFrom=${encodeURIComponent(dateFrom)}&dateTo=${encodeURIComponent(dateTo)}`;

      Swal.fire({
        title: "Starting RPA Automation...",
        text: "Please wait while the server logs in and downloads the attendance report...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      await triggerLocalBrowserDownload(downloadUrl, `Attendance_${dateFrom.replace(/\//g, "-")}_to_${dateTo.replace(/\//g, "-")}.xlsx`);

      Swal.fire({
        icon: "success",
        title: "Download Complete!",
        text: "Attendance report downloaded securely to your computer.",
        timer: 3500,
        showConfirmButton: false,
      });
    } catch (err: any) {
      console.error("Direct download failed:", err);
      Swal.fire({
        icon: "error",
        title: "Download Failed",
        text: err?.message || "Could not complete background download.",
      });
    } finally {
      setIsDirectDownloading(false);
    }
  };

  const handleCloseModal = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsRunning(false);
    setIsModalOpen(false);
  };

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const progressPercent = Math.min(100, Math.round((currentStep / 7) * 100));

  return (
    <div className="p-4 md:p-8  mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#1e3a8a] via-[#312e81] to-[#0f172a] text-[#ffffff] rounded-2xl p-6 md:p-8 shadow-xl border border-[#1d4ed8]/40">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-[#3b82f6]/20 text-[#93c5fd] px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase border border-[#60a5fa]/30">
              <Laptop className="w-3.5 h-3.5" /> Autovyn Robotic Process Automation (RPA)
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Attendance Report Auto-Downloader
            </h1>
            <p className="text-[#bfdbfe]/80 text-sm max-w-2xl">
              Execute live browser automation to login to Autovyn ERP, navigate to Attendance Reports,
              and download the <strong>Single Line Attendance Report</strong> directly onto this computer with a live visual screen stream.
            </p>
          </div>
          <div className="bg-[#ffffff]/10 backdrop-blur-md rounded-xl p-4 border border-[#ffffff]/15 text-center min-w-[200px]">
            <span className="text-xs text-[#bfdbfe] block uppercase tracking-wider font-medium">Target Service</span>
            <span className="text-sm font-bold text-[#ffffff] flex items-center justify-center gap-1.5 mt-1">
              <FileSpreadsheet className="w-4 h-4 text-[#34d399]" /> Single Line Report
            </span>
            <span className="text-xm text-[#6ee7b7] block mt-1 font-mono">devs.autovyn.com</span>
          </div>
        </div>
      </div>

      {/* Main Execution Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Control Panel */}
        <div className="lg:col-span-2 bg-[#ffffff] dark:bg-[#0f172a] rounded-2xl p-6 shadow-md border border-[#e2e8f0] dark:border-[#1e293b] space-y-6">
          <div className="flex items-center justify-between border-b pb-4 border-[#f1f5f9] dark:border-[#1e293b]">
            <h2 className="text-lg font-bold text-[#1e293b] dark:text-[#ffffff] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#2563eb]" /> Report Date Range Settings
            </h2>
            <span className="text-xs bg-[#d1fae5] text-[#065f46] dark:bg-[#064e3b]/40 dark:text-[#6ee7b7] px-2.5 py-1 rounded-full font-semibold">
              ● Server Connected
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#475569] dark:text-[#cbd5e1] uppercase">
                Date From (DD/MM/YYYY)
              </label>
              <input
                type="text"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                placeholder="01/10/2026"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#cbd5e1] dark:border-[#334155] bg-[#ffffff] dark:bg-[#1e293b] text-[#0f172a] dark:text-[#ffffff] text-sm font-medium focus:ring-2 focus:ring-[#3b82f6] focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#475569] dark:text-[#cbd5e1] uppercase">
                Date To (DD/MM/YYYY)
              </label>
              <input
                type="text"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                placeholder="31/10/2026"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#cbd5e1] dark:border-[#334155] bg-[#ffffff] dark:bg-[#1e293b] text-[#0f172a] dark:text-[#ffffff] text-sm font-medium focus:ring-2 focus:ring-[#3b82f6] focus:outline-none"
              />
            </div>
          </div>

          <div className="bg-[#f8fafc] dark:bg-[#1e293b]/60 rounded-xl p-4 border border-[#e2e8f0] dark:border-[#334155] space-y-2">
            <h3 className="text-md font-bold text-[#334155] dark:text-[#cbd5e1] uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#3b82f6]" /> What this automation does:
            </h3>
            <ul className="text-sm text-[#475569] dark:text-[#94a3b8] space-y-1.5 list-disc pl-5">
              <li>Opens high-speed browser automation directly on your Autovyn backend.</li>
              <li>Logs into ERP using company code <code className="text-[#2563eb] dark:text-[#93c5fd]">devteam</code> and user <code className="text-[#2563eb] dark:text-[#93c5fd]">admin</code>.</li>
              <li>Navigates to <code className="text-[#2563eb] dark:text-[#93c5fd]">/autovyn/payroll/reports/Attendance_Report</code>.</li>
              <li>Clicks <strong>Download Attendance (Single Line)</strong> button.</li>
              <li>Streams live screenshots of each action in a live modal on your screen.</li>
              <li>Automatically triggers the Excel file download into your system's Downloads folder!</li>
            </ul>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleStartRpa}
              disabled={isRunning}
              className="bg-[#2563eb] hover:bg-[#1d4ed8] text-[#ffffff] font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#3b82f6]/25 transition-all text-sm w-full sm:w-auto"
            >
              {/* <Play className="w-4 h-4 fill-current" /> */}
              {isRunning ? "Automation Running..." : "Start RPA & Live Stream"}
            </Button>

            {/* <Button
              onClick={handleDirectDownload}
              disabled={isDirectDownloading || isRunning}
              className="inline-flex items-center justify-center gap-2 border border-[#cbd5e1] dark:border-[#334155] bg-[#f8fafc] dark:bg-[#1e293b] hover:bg-[#f1f5f9] dark:hover:bg-[#334155] text-[#334155] dark:text-[#e2e8f0] font-semibold py-3 px-5 rounded-xl text-sm transition-all w-full sm:w-auto"
            >
              <Download className="w-4 h-4 text-[#64748b]" />
              {isDirectDownloading ? "Downloading to PC..." : "Direct Download (Background)"}
            </Button> */}
          </div>
        </div>

        {/* Right 1 Col: Quick Info */}
        <div className="bg-[#ffffff] dark:bg-[#0f172a] rounded-2xl p-6 shadow-md border border-[#e2e8f0] dark:border-[#1e293b] space-y-5">
          <h3 className="text-sm font-bold text-[#1e293b] dark:text-[#ffffff] uppercase tracking-wider">
            Live Stream Features
          </h3>

          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#dbeafe] dark:bg-[#1e3a8a]/50 flex items-center justify-center text-[#2563eb] dark:text-[#60a5fa] shrink-0">
                <Laptop className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#1e293b] dark:text-[#ffffff]">Watch Every Action</h4>
                <p className="text-xm text-[#64748b] dark:text-[#94a3b8]">
                  Screenshots are streamed in real time as Playwright navigates and clicks in the browser.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#d1fae5] dark:bg-[#064e3b]/50 flex items-center justify-center text-[#059669] dark:text-[#34d399] shrink-0">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#1e293b] dark:text-[#ffffff]">Client-Side File Delivery</h4>
                <p className="text-xm text-[#64748b] dark:text-[#94a3b8]">
                  The generated Excel sheet is pushed directly to the browser on whatever computer you are using.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#e0e7ff] dark:bg-[#312e81]/50 flex items-center justify-center text-[#4f46e5] dark:text-[#818cf8] shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#1e293b] dark:text-[#ffffff]">Single Backend Process</h4>
                <p className="text-xm text-[#64748b] dark:text-[#94a3b8]">
                  Runs directly inside your standard <code>npm run dev</code> backend without needing secondary worker terminals.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#f1f5f9] dark:border-[#1e293b] text-xm text-[#94a3b8]">
            Company Code: <span className="font-semibold text-[#475569] dark:text-[#cbd5e1]">{user?.Comp_Code || "devteam"}</span>
          </div>
        </div>
      </div>

      {/* LIVE SCREEN STREAM MODAL */}
      {isModalOpen && (
        <div
          className={`fixed inset-0 z-50 bg-[#000000] flex items-center justify-center animate-in fade-in duration-200 ${
            isFullscreen ? "p-0" : "p-2 sm:p-4 bg-[#000000]/85 backdrop-blur-md"
          }`}
        >
          <div
            className={`bg-[#0f172a] text-[#ffffff] shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
              isFullscreen
                ? "w-screen h-screen rounded-none border-none fixed inset-0"
                : "w-full max-w-7xl max-h-[92vh] h-[820px] rounded-2xl border border-[#334155]"
            }`}
          >
            {/* Modal Header */}
            <div className="bg-[#1e293b] px-4 py-3 border-b border-[#334155] flex items-center justify-between shrink-0">
              {/* Left: Live status and Step indicator */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    {isRunning && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34d399] opacity-75"></span>
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-3 w-3 ${
                        isRunning
                          ? "bg-[#10b981]"
                          : isCompleted
                          ? "bg-[#3b82f6]"
                          : "bg-[#f59e0b]"
                      }`}
                    ></span>
                  </span>
                  <span className="font-bold text-sm tracking-wide">
                    {isRunning ? "LIVE RPA AUTOMATION STREAM" : isCompleted ? "TASK FINISHED" : "RPA BOT"}
                  </span>
                </div>
                <span className="text-xs bg-[#334155] px-2.5 py-0.5 rounded-full text-[#cbd5e1] font-mono hidden sm:inline">
                  Step {currentStep} of 7
                </span>
              </div>

              {/* Center: Live Date & Ticking Time Counter + Execution Duration */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2 bg-[#0f172a] border border-[#334155] px-3 py-1 rounded-xl text-xs font-mono shadow-inner">
                  <Calendar className="w-3.5 h-3.5 text-[#60a5fa]" />
                  <span className="text-[#cbd5e1] font-semibold hidden md:inline">{currentClockDate}</span>
                  <span className="text-[#475569] hidden md:inline">|</span>
                  <Clock className="w-3.5 h-3.5 text-[#34d399] animate-pulse" />
                  <span className="text-[#34d399] font-bold tracking-wider">{currentClockTime}</span>
                </div>

                {isRunning && (
                  <div className="hidden lg:flex items-center gap-1.5 bg-[#1e3a8a]/50 border border-[#2563eb]/60 px-2.5 py-1 rounded-xl text-xs font-mono text-[#93c5fd]">
                    <span className="text-xm uppercase tracking-wider text-[#bfdbfe]/70 font-sans">Run Time:</span>
                    <span className="font-bold text-[#ffffff]">{formatElapsed(elapsedSeconds)}</span>
                  </div>
                )}
              </div>

              {/* Right: Fullscreen Toggle and Close */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-1.5 hover:bg-[#334155] rounded-lg text-[#94a3b8] hover:text-[#ffffff] transition-colors"
                  title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleCloseModal}
                  className="p-1.5 hover:bg-[#334155] rounded-lg text-[#94a3b8] hover:text-[#ffffff] transition-colors"
                  title="Close Modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Stepper Progress Bar */}
            <div className="bg-[#162032] px-4 py-2 border-b border-[#1e293b] shrink-0">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-[#60a5fa]">{stepTitle}</span>
                <span className="font-mono text-[#94a3b8]">{progressPercent}%</span>
              </div>
              <div className="w-full bg-[#1e293b] rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#3b82f6] to-[#34d399] h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>

            {/* Modal Body: Two columns (Live Viewport + Step Timeline) */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
              {/* Left / Top: Live Browser Screen */}
              <div className="lg:col-span-8 bg-[#000000] flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#1e293b] overflow-hidden">
                {/* Browser Top URL Bar Mockup */}
                <div className="bg-[#0f172a] px-3 py-1.5 border-b border-[#1e293b] flex items-center gap-2 text-xs font-mono text-[#94a3b8] shrink-0">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]/80 inline-block"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]/80 inline-block"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]/80 inline-block"></span>
                  </div>
                  <div className="flex-1 bg-[#1e293b]/80 rounded px-2.5 py-1 text-xm truncate text-[#cbd5e1] flex items-center gap-1.5">
                    <span className="text-[#34d399]">🔒</span>
                    <span className="truncate">{currentUrl}</span>
                  </div>
                  <span className="flex items-center gap-1.5 text-xm text-[#f43f5e] font-bold tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-[#f43f5e] animate-ping inline-block"></span>
                    LIVE STREAM
                  </span>
                </div>

                {/* Screenshot Frame */}
                <div
                  ref={previewRef}
                  className="flex-1 flex items-center justify-center p-3 relative bg-[#020617] overflow-auto"
                >
                  {screenshot ? (
                    <img
                      src={screenshot}
                      alt="Live Browser Automation Frame"
                      className="max-h-full max-w-full rounded-lg shadow-2xl object-contain border border-[#1e293b]"
                    />
                  ) : (
                    <div className="text-center space-y-3 p-8">
                      <div className="w-12 h-12 border-4 border-[#3b82f6]/30 border-t-[#3b82f6] rounded-full animate-spin mx-auto"></div>
                      <p className="text-sm font-medium text-[#94a3b8]">
                        {stepTitle || "Connecting to browser engine..."}
                      </p>
                      <p className="text-xs text-[#64748b] max-w-sm">{stepDetail}</p>
                    </div>
                  )}

                  {/* Overlay Step Pill */}
                  <div className="absolute bottom-4 left-4 bg-[#000000]/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#ffffff]/10 text-xs font-mono text-[#cbd5e1] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#60a5fa] animate-pulse"></span>
                    <span>{stepDetail}</span>
                  </div>
                </div>
              </div>

              {/* Right: Steps Timeline & Final Download */}
              <div className="lg:col-span-4 bg-[#0f172a] flex flex-col justify-between overflow-hidden">
                <div className="p-4 border-b border-[#1e293b]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">
                    Automation Steps
                  </h3>
                </div>

                {/* Stepper list */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {stepsList.map((s) => {
                    const isDone = currentStep > s.num || isCompleted;
                    const isCurrent = currentStep === s.num && !isCompleted;

                    return (
                      <div
                        key={s.num}
                        className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all ${
                          isCurrent
                            ? "bg-[#1e3a8a]/30 border-[#3b82f6]/60 shadow-md shadow-[#3b82f6]/10"
                            : isDone
                            ? "bg-[#1e293b]/40 border-[#10b981]/30 opacity-90"
                            : "bg-[#1e293b]/20 border-[#1e293b] opacity-40"
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                            isDone
                              ? "bg-[#10b981] text-[#ffffff]"
                              : isCurrent
                              ? "bg-[#2563eb] text-[#ffffff] animate-pulse"
                              : "bg-[#334155] text-[#94a3b8]"
                          }`}
                        >
                          {isDone ? "✓" : s.num}
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <h4
                            className={`text-xs font-bold leading-tight ${
                              isCurrent ? "text-[#93c5fd]" : isDone ? "text-[#6ee7b7]" : "text-[#cbd5e1]"
                            }`}
                          >
                            {s.label}
                          </h4>
                          <p className="text-xm text-[#94a3b8] leading-snug truncate">
                            {s.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {errorMessage && (
                    <div className="p-3 bg-[#881337]/40 border border-[#f43f5e]/50 rounded-xl text-[#fecdd3] text-xs space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-[#fb7185]" /> Task Interrupted
                      </div>
                      <p className="text-xm leading-relaxed">{errorMessage}</p>
                    </div>
                  )}
                </div>

                {/* Bottom Card in Right Pane */}
                <div className="p-4 bg-[#162032] border-t border-[#1e293b] space-y-2">
                  {isCompleted && completeData ? (
                    <div className="space-y-2">
                      <div className="bg-[#022c22]/60 border border-[#10b981]/40 p-2.5 rounded-xl text-xs space-y-1">
                        <span className="font-bold text-[#6ee7b7] block flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Download Complete
                        </span>
                        <span className="text-[#cbd5e1] text-xm block truncate font-mono">
                          {completeData.fileName}
                        </span>
                      </div>
                      <Button
                        onClick={() =>
                          triggerLocalBrowserDownload(
                            `${process.env.NEXT_PUBLIC_URL || "http://localhost:5000"}${
                              completeData.downloadUrl
                            }`,
                            completeData.fileName
                          )
                        }
                        className="w-full bg-[#059669] hover:bg-[#047857] text-[#ffffff] font-bold py-2 text-xs rounded-xl flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" /> Re-Download File to PC
                      </Button>
                    </div>
                  ) : isRunning ? (
                    <div className="flex items-center justify-between text-xs text-[#94a3b8] py-1">
                      <span className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 animate-spin text-[#60a5fa]" /> Running on server...
                      </span>
                      <span className="text-xm font-mono">Please wait</span>
                    </div>
                  ) : (
                    <Button
                      onClick={handleStartRpa}
                      className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-[#ffffff] font-bold py-2 text-xs rounded-xl flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Restart Task
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
