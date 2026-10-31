"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import axios from "axios";
import Swal from "sweetalert2";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Server,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  KeyRound,
  Play,
  Copy,
  Check,
  ExternalLink,
  Laptop,
  Clock,
  Sparkles,
  Zap,
  Calendar,
  Maximize2,
  Minimize2,
  X,
  Globe,
  Lock,
  User,
  ArrowRight,
  PlusCircle,
  Trash2
} from "lucide-react";

interface ConnectedMailbox {
  Connection_Id: number;
  Comp_Code: string;
  User_Id: string;
  Provider: "GMAIL" | "OUTLOOK";
  Mailbox_Email: string;
  Status: string;
  Last_Sync_At?: string;
  Created_At?: string;
}

interface ProgressEventData {
  step: number;
  title: string;
  detail: string;
  currentUrl?: string;
  screenshot?: string;
  timestamp?: string;
  otp?: string;
}

interface CompleteEventData {
  success: boolean;
  title: string;
  otp?: string;
  finalUrl?: string;
  message: string;
}

export default function RpaEmailOtpHubPage() {
  const user = useCurrentUser();
  const userId = user?.name || user?.EMPCODE || "admin";
  const defaultCompCode = user?.Comp_Code || "devteam";
  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:5000";

  // Target Portal & Automation Configuration
  const [targetUrl, setTargetUrl] = useState("https://www.teachoo.com/login-email/1/");
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>("");
  const [customEmail, setCustomEmail] = useState("info@autovyn.com");

  // Connected Dealer Mailboxes State
  const [mailboxes, setMailboxes] = useState<ConnectedMailbox[]>([]);
  const [loadingMailboxes, setLoadingMailboxes] = useState(true);

  // Live Screen Stream Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepTitle, setStepTitle] = useState("Ready to start");
  const [stepDetail, setStepDetail] = useState("Click 'Launch 1-Click RPA Login' to begin.");
  const [currentUrl, setCurrentUrl] = useState("https://www.teachoo.com/login-email/1/");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [progressLog, setProgressLog] = useState<ProgressEventData[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completeData, setCompleteData] = useState<CompleteEventData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [copiedOtp, setCopiedOtp] = useState(false);
  const [interceptedOtp, setInterceptedOtp] = useState<string | null>(null);

  // Live real-time clock counter & elapsed stopwatch
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
          year: "numeric"
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

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

  const formatElapsed = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Fetch connected dealer mailboxes
  const fetchMailboxes = async () => {
    try {
      setLoadingMailboxes(true);
      const res = await axios.get(`${baseUrl}/api/rpa/email/connections`, {
        headers: { compcode: defaultCompCode },
      });
      if (res.data?.success) {
        setMailboxes(res.data.data || []);
        if (res.data.data?.length > 0 && !selectedConnectionId) {
          setSelectedConnectionId(String(res.data.data[0].Connection_Id));
        }
      }
    } catch (e: any) {
      console.warn("Error fetching dealer mailboxes:", e?.message);
    } finally {
      setLoadingMailboxes(false);
    }
  };

  useEffect(() => {
    fetchMailboxes();
  }, [defaultCompCode]);

  // Listen for OAuth Popup PostMessages
  useEffect(() => {
    const handleAuthMessage = (event: MessageEvent) => {
      if (event.data?.type === "RPA_EMAIL_AUTH_SUCCESS") {
        if (event.data?.warning) {
          Swal.fire({
            icon: "warning",
            title: "Provider Notice",
            text: event.data.warning,
            confirmButtonText: "Understood",
          });
        } else {
          Swal.fire({
            icon: "success",
            title: "Mailbox Connected!",
            text: `Successfully linked ${event.data.provider} account: ${event.data.mailboxEmail}`,
            timer: 3000,
            showConfirmButton: false,
          });
        }
        fetchMailboxes();
      } else if (event.data?.type === "RPA_EMAIL_AUTH_ERROR") {
        Swal.fire({
          icon: "error",
          title: "Authorization Failed",
          text: event.data.error || "User denied consent or an error occurred.",
        });
      }
    };

    window.addEventListener("message", handleAuthMessage);
    return () => window.removeEventListener("message", handleAuthMessage);
  }, [defaultCompCode]);

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

  // Initiate Dealer Self-Service OAuth
  const handleConnectProvider = async (provider: "GMAIL" | "OUTLOOK") => {
    try {
      const res = await axios.get(`${baseUrl}/api/rpa/email/oauth/url`, {
        params: { provider, userId },
        headers: { compcode: defaultCompCode },
      });

      if (res.data?.success && res.data.authUrl) {
        const width = 560;
        const height = 680;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        window.open(
          res.data.authUrl,
          `${provider}OAuthConsent`,
          `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes,status=yes`
        );
      }
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "OAuth Setup Notice",
        text: err.response?.data?.message || err.message,
      });
    }
  };

  // Test Mailbox Token Health
  const handleTestMailbox = async (connectionId: number, email: string) => {
    try {
      Swal.fire({
        title: "Testing Connection...",
        text: `Validating OAuth token freshness for ${email}`,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await axios.post(
        `${baseUrl}/api/rpa/email/test`,
        { connectionId },
        { headers: { compcode: defaultCompCode } }
      );

      if (res.data?.success) {
        Swal.fire({
          icon: "success",
          title: "Token Verified!",
          text: `Successfully authenticated with ${res.data.data?.provider || "provider"} API.`,
        });
        fetchMailboxes();
      }
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Token Validation Failed",
        text: err.response?.data?.error || err.message,
      });
      fetchMailboxes();
    }
  };

  // Check Latest Mailbox OTP without running full Playwright automation
  const handleReadLatestOtp = async (connectionId: number, email: string) => {
    try {
      Swal.fire({
        title: "Checking Mailbox for OTP...",
        text: `Querying ${email} via official API for OTP emails received in the last 10 minutes...`,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await axios.post(
        `${baseUrl}/api/rpa/email/read-otp`,
        { connectionId, sinceMinutes: 10 },
        { headers: { compcode: defaultCompCode } }
      );

      if (res.data?.success && res.data?.otp) {
        Swal.fire({
          icon: "success",
          title: "OTP Retrieved Successfully!",
          html: `
            <div style="text-align:center; padding:10px;">
              <div style="font-size:32px; font-weight:900; letter-spacing:6px; color:#10B981; font-family:monospace; margin-bottom:12px; background:#022C22; padding:12px; border-radius:12px; border:1px solid #065F46;">
                ${res.data.otp}
              </div>
              <p style="font-size:12px; color:#94A3B8; margin-bottom:4px;">
                <strong>From:</strong> ${res.data.from || "N/A"}
              </p>
              <p style="font-size:12px; color:#94A3B8;">
                <strong>Subject:</strong> ${res.data.subject || "N/A"}
              </p>
            </div>
          `,
          confirmButtonText: "Copy OTP",
          confirmButtonColor: "#10B981",
          showCancelButton: true,
          cancelButtonText: "Close",
        }).then((action) => {
          if (action.isConfirmed) {
            navigator.clipboard.writeText(res.data.otp);
            Swal.fire({ icon: "success", title: "Copied to clipboard!", timer: 1500, showConfirmButton: false });
          }
        });
      }
    } catch (err: any) {
      Swal.fire({
        icon: "info",
        title: "No Recent OTP Found",
        text: err.response?.data?.message || err.message,
      });
    }
  };

  // Disconnect Mailbox
  const handleDisconnectMailbox = async (connectionId: number, email: string) => {
    const result = await Swal.fire({
      title: "Disconnect Mailbox?",
      text: `Remove ${email} from dealer ${defaultCompCode}? You can reconnect anytime.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DC2626",
      confirmButtonText: "Yes, Disconnect",
    });

    if (result.isConfirmed) {
      try {
        await axios.post(
          `${baseUrl}/api/rpa/email/disconnect`,
          { connectionId },
          { headers: { compcode: defaultCompCode } }
        );
        Swal.fire("Disconnected", "Mailbox connection has been removed.", "success");
        fetchMailboxes();
      } catch (err: any) {
        Swal.fire("Error", err.response?.data?.message || err.message, "error");
      }
    }
  };

  // 1-Click Launch Automation
  const startLiveAutomation = () => {
    if (!targetUrl) {
      return Swal.fire({ icon: "warning", title: "Target URL Required", text: "Please provide a target portal URL." });
    }

    setIsModalOpen(true);
    setIsRunning(true);
    setIsCompleted(false);
    setErrorMessage(null);
    setCompleteData(null);
    setInterceptedOtp(null);
    setCurrentStep(1);
    setStepTitle("Starting Dealer RPA Session...");
    setStepDetail("Launching isolated browser engine and attaching live video screencast...");
    setProgressLog([]);
    setScreenshot(null);

    cleanupStream();

    const streamUrl = `${baseUrl}/api/rpa/email/live-stream?userId=${encodeURIComponent(
      userId
    )}&compcode=${encodeURIComponent(defaultCompCode)}&targetUrl=${encodeURIComponent(
      targetUrl
    )}&connectionId=${encodeURIComponent(selectedConnectionId)}`;

    const sse = new EventSource(streamUrl);
    eventSourceRef.current = sse;

    sse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Screenshot frame update
        if (data.screenshot) {
          setScreenshot(`data:image/jpeg;base64,${data.screenshot}`);
          return;
        }

        // Progress step event
        if (data.step) {
          setCurrentStep(data.step);
          setStepTitle(data.title);
          setStepDetail(data.detail);
          if (data.otp) setInterceptedOtp(data.otp);
          if (data.currentUrl) setCurrentUrl(data.currentUrl);
          setProgressLog((prev) => [...prev, data]);
        }

        // Completion event
        if (data.completed) {
          setIsRunning(false);
          setIsCompleted(true);
          setCompleteData(data);
          if (!data.success) {
            setErrorMessage(data.message || "Automation failed");
          }
          cleanupStream();
        }
      } catch (err) {
        console.error("SSE parse error:", err);
      }
    };

    sse.onerror = () => {
      console.warn("SSE stream closed or disconnected");
      setIsRunning(false);
      cleanupStream();
    };
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] p-4 md:p-8">
      {/* Top Header & Navigation Tabs */}
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E2E8F0] dark:border-[#1E293B]">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#2563EB]/10 dark:bg-[#3B82F6]/20 rounded-2xl text-[#2563EB] dark:text-[#60A5FA]">
                <Mail className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#0F172A] dark:text-[#FFFFFF] flex items-center gap-2">
                  Dealer Email OTP Automation
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#DBEAFE] text-[#1E40AF] dark:bg-[#1E3A8A]/60 dark:text-[#93C5FD] font-medium">
                    Gmail & Outlook OAuth
                  </span>
                </h1>
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                  Dealer self-service OAuth integration to read login OTPs securely via official Gmail & Microsoft APIs
                </p>
              </div>
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
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#FFFFFF] dark:bg-[#1E293B] text-[#2563EB] dark:text-[#60A5FA] shadow-sm transition"
            >
              Email OTP RPA
            </Link>
            <Link
              href="/autovyn/rpa/vynfinance"
              className="px-3.5 py-1.5 text-xs font-medium rounded-lg text-[#475569] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#FFFFFF] transition"
            >
              VYNFINANCE RPA
            </Link>
            <Link
              href="/autovyn/rpa/ai-vision"
              className="px-3.5 py-1.5 text-xs font-medium rounded-lg text-[#475569] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#FFFFFF] transition"
            >
              AI Vision Odometer
            </Link>
          </div>
        </div>

        {/* Section 1: Dealer Self-Service Connect Buttons */}
        <div className="bg-[#FFFFFF] dark:bg-[#0F172A] rounded-3xl border border-[#E2E8F0] dark:border-[#1E293B] p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] dark:border-[#1E293B] pb-4">
            <div>
              <h2 className="text-lg font-bold text-[#0F172A] dark:text-[#FFFFFF] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#10B981]" />
                Dealer Connected Mailboxes ({defaultCompCode})
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                Connect your dealer Google or Microsoft account to allow RPA to read OTPs without passwords
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Connect Gmail Button */}
              <Button
                onClick={() => handleConnectProvider("GMAIL")}
                variant="outline"
                size="sm"
                className="rounded-xl border-[#CBD5E1] dark:border-[#334155] text-xs font-bold flex items-center gap-2 hover:bg-[#FEF2F2] hover:text-[#DC2626] dark:hover:bg-[#450A0A]"
              >
                <span className="w-2 h-2 rounded-full bg-[#EA4335]" /> Connect Google Gmail
              </Button>

              {/* Connect Outlook Button */}
              <Button
                onClick={() => handleConnectProvider("OUTLOOK")}
                variant="outline"
                size="sm"
                className="rounded-xl border-[#CBD5E1] dark:border-[#334155] text-xs font-bold flex items-center gap-2 hover:bg-[#EFF6FF] hover:text-[#2563EB] dark:hover:bg-[#1E3A8A]/30"
              >
                <span className="w-2 h-2 rounded-full bg-[#0078D4]" /> Connect Outlook / Office 365
              </Button>

              <Button variant="ghost" size="sm" onClick={fetchMailboxes} disabled={loadingMailboxes}>
                <RefreshCw className={`w-4 h-4 ${loadingMailboxes ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>

          {/* Connected Mailboxes Grid */}
          <div className="pt-4">
            {mailboxes.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <Mail className="w-10 h-10 text-[#CBD5E1] dark:text-[#334155] mx-auto" />
                <p className="text-sm font-semibold text-[#64748B] dark:text-[#94A3B8]">
                  No dealer mailboxes connected yet.
                </p>
                <p className="text-xs text-[#94A3B8]">
                  Click one of the buttons above to grant permission via Google or Microsoft.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mailboxes.map((item) => (
                  <div
                    key={item.Connection_Id}
                    className={`p-4 rounded-2xl border transition-all ${
                      selectedConnectionId === String(item.Connection_Id)
                        ? "border-[#2563EB] bg-[#EFF6FF]/60 dark:bg-[#1E3A8A]/20"
                        : "border-[#E2E8F0] dark:border-[#1E293B] bg-[#FFFFFF] dark:bg-[#020617]"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            item.Provider === "GMAIL"
                              ? "bg-[#FEE2E2] text-[#991B1B] dark:bg-[#450A0A] dark:text-[#FCA5A5]"
                              : "bg-[#DBEAFE] text-[#1E40AF] dark:bg-[#1E3A8A] dark:text-[#93C5FD]"
                          }`}
                        >
                          {item.Provider}
                        </span>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            item.Status === "CONNECTED"
                              ? "bg-[#10B981] animate-pulse"
                              : item.Status === "NEEDS_OUTLOOK"
                              ? "bg-[#F59E0B]"
                              : "bg-[#EF4444]"
                          }`}
                        />
                      </div>
                      <button
                        onClick={() => handleDisconnectMailbox(item.Connection_Id, item.Mailbox_Email)}
                        className="text-[#94A3B8] hover:text-[#DC2626] transition p-1"
                        title="Disconnect"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="mt-3">
                      <p className="text-sm font-bold text-[#0F172A] dark:text-[#FFFFFF] truncate">
                        {item.Mailbox_Email}
                      </p>
                      <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                        Status:{" "}
                        <span
                          className={`font-semibold ${
                            item.Status === "CONNECTED"
                              ? "text-[#10B981]"
                              : item.Status === "NEEDS_OUTLOOK"
                              ? "text-[#D97706] dark:text-[#FBBF24]"
                              : "text-[#EF4444]"
                          }`}
                        >
                          {item.Status === "NEEDS_OUTLOOK" ? "NEEDS OUTLOOK (M365 Hosted)" : item.Status}
                        </span>
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#E2E8F0] dark:border-[#1E293B] flex items-center justify-between">
                      <button
                        onClick={() => setSelectedConnectionId(String(item.Connection_Id))}
                        className={`text-xs font-bold ${
                          selectedConnectionId === String(item.Connection_Id)
                            ? "text-[#2563EB] dark:text-[#60A5FA]"
                            : "text-[#64748B] hover:text-[#0F172A] dark:hover:text-[#FFFFFF]"
                        }`}
                      >
                        {selectedConnectionId === String(item.Connection_Id) ? "✓ Active for RPA" : "Select for RPA"}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReadLatestOtp(item.Connection_Id, item.Mailbox_Email)}
                          className="text-[11px] h-7 px-2 text-[#2563EB] dark:text-[#60A5FA] hover:bg-[#EFF6FF] dark:hover:bg-[#1E3A8A]/40 font-semibold"
                        >
                          View OTP
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTestMailbox(item.Connection_Id, item.Mailbox_Email)}
                          className="text-[11px] h-7 px-2 text-[#475569] dark:text-[#94A3B8] hover:bg-[#E2E8F0]/40"
                        >
                          Test Token
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Section 2: 1-Click Trigger Portal Card */}
        <div className="bg-[#FFFFFF] dark:bg-[#0F172A] rounded-3xl border border-[#E2E8F0] dark:border-[#1E293B] p-6 md:p-8 shadow-sm">
          <div className="max-w-3xl space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[#0F172A] dark:text-[#FFFFFF] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#2563EB] dark:text-[#60A5FA]" />
                Launch Automated Portal Login (Eicher DMS, Teachoo, etc.)
              </h2>
              <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-1">
                The bot opens the target website, triggers OTP to the selected dealer email, queries the official API, auto-fills the OTP, and completes authentication.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#334155] dark:text-[#CBD5E1] flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-[#94A3B8]" /> Target Portal Login URL
                </label>
                <input
                  type="text"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://www.teachoo.com/login-email/1/"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#334155] bg-[#FFFFFF] dark:bg-[#020617] text-[#0F172A] dark:text-[#FFFFFF] text-sm focus:ring-2 focus:ring-[#3B82F6] focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#334155] dark:text-[#CBD5E1] flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-[#94A3B8]" /> Listening Dealer Mailbox
                </label>
                {mailboxes.length > 0 ? (
                  <select
                    value={selectedConnectionId}
                    onChange={(e) => setSelectedConnectionId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#334155] bg-[#FFFFFF] dark:bg-[#020617] text-[#0F172A] dark:text-[#FFFFFF] text-sm focus:ring-2 focus:ring-[#3B82F6] focus:outline-none"
                  >
                    {mailboxes.map((m) => (
                      <option key={m.Connection_Id} value={m.Connection_Id}>
                        [{m.Provider}] {m.Mailbox_Email}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="info@autovyn.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#334155] bg-[#FFFFFF] dark:bg-[#020617] text-[#0F172A] dark:text-[#FFFFFF] text-sm focus:ring-2 focus:ring-[#3B82F6] focus:outline-none"
                  />
                )}
              </div>
            </div>

            {/* Big 1-Click Trigger Button */}
            <div className="pt-4">
              <Button
                onClick={startLiveAutomation}
                size="lg"
                className="w-full md:w-auto px-8 py-6 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#4F46E5] hover:from-[#1D4ED8] hover:to-[#4338CA] text-white font-bold text-base shadow-lg shadow-[#3B82F6]/25 flex items-center justify-center gap-3 transition-all hover:scale-[1.01]"
              >
                <Play className="w-5 h-5 fill-white" />
                Launch Automated Login via Dealer Mailbox
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Full Screen Live Screencast Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617]/80 backdrop-blur-md p-2 md:p-6">
          <div
            className={`bg-[#0F172A] text-white rounded-3xl border border-[#1E293B] shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
              isFullscreen ? "w-full h-full" : "w-11/12 max-w-6xl h-[85vh]"
            }`}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#0F172A]/90 border-b border-[#1E293B] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#3B82F6]/20 rounded-xl text-[#60A5FA]">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2">
                    Dealer RPA Live Automation Stream
                    {isRunning && (
                      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs bg-[#10B981]/20 text-[#34D399] font-normal animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-[#34D399]" /> Live Screencast
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-[#94A3B8] truncate max-w-md">{currentUrl}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-xs text-[#94A3B8] bg-[#1E293B]/80 px-3 py-1.5 rounded-xl border border-[#334155]/60">
                  <Clock className="w-3.5 h-3.5 text-[#60A5FA]" />
                  <span>Elapsed: {formatElapsed(elapsedSeconds)}</span>
                  <span className="text-[#475569]">|</span>
                  <span>{currentClockTime}</span>
                </div>

                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 text-[#94A3B8] hover:text-[#FFFFFF] hover:bg-[#1E293B] rounded-xl transition"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => {
                    cleanupStream();
                    setIsModalOpen(false);
                  }}
                  className="p-2 text-[#94A3B8] hover:text-[#FFFFFF] hover:bg-[#1E293B] rounded-xl transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Left Step Tracker + Right Screencast Frame */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
              {/* Left Step Log */}
              <div className="lg:col-span-4 bg-[#020617]/60 p-6 border-r border-[#1E293B] overflow-y-auto space-y-4">
                <div className="space-y-1">
                  <span className="text-xs uppercase font-bold text-[#64748B] tracking-wider">
                    Execution Status
                  </span>
                  <h4 className="font-bold text-lg text-white">{stepTitle}</h4>
                  <p className="text-xs text-[#94A3B8]">{stepDetail}</p>
                </div>

                {/* OTP Intercepted Card */}
                {(interceptedOtp || completeData?.otp) && (
                  <div className="p-4 bg-[#022C22]/40 border border-[#065F46]/60 rounded-2xl space-y-2">
                    <span className="text-xs font-semibold text-[#34D399] flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4" /> Intercepted OTP
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-mono font-black text-white tracking-widest">
                        {interceptedOtp || completeData?.otp}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          navigator.clipboard.writeText(interceptedOtp || completeData?.otp || "");
                          setCopiedOtp(true);
                          setTimeout(() => setCopiedOtp(false), 2000);
                        }}
                        className="text-xs text-[#34D399] hover:bg-[#064E3B]/40"
                      >
                        {copiedOtp ? <Check className="w-4 h-4 text-[#6EE7B7]" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Steps History */}
                <div className="pt-4 space-y-3">
                  <span className="text-xs uppercase font-bold text-[#64748B] tracking-wider">
                    Step Log
                  </span>
                  <div className="space-y-2.5">
                    {progressLog.map((log, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-[#0F172A] border border-[#1E293B]/80 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#60A5FA]">Step {log.step}: {log.title}</span>
                          <span className="text-[10px] text-[#64748B]">
                            {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ""}
                          </span>
                        </div>
                        <p className="text-[#94A3B8] text-[11px]">{log.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Live Screencast Frame */}
              <div className="lg:col-span-8 bg-[#020617] flex flex-col items-center justify-center p-4 overflow-hidden relative">
                {screenshot ? (
                  <img
                    src={screenshot}
                    alt="Live Browser Screencast"
                    className="w-full h-full object-contain rounded-2xl shadow-2xl border border-[#1E293B]"
                  />
                ) : (
                  <div className="text-center space-y-3 p-8">
                    <Laptop className="w-16 h-16 text-[#334155] mx-auto animate-pulse" />
                    <p className="text-sm font-medium text-[#94A3B8]">
                      Waiting for browser video frame stream...
                    </p>
                  </div>
                )}

                {/* Overlay Success Banner */}
                {isCompleted && completeData?.success && (
                  <div className="absolute bottom-6 left-6 right-6 p-4 bg-[#064E3B]/90 backdrop-blur-md rounded-2xl border border-[#047857]/80 text-white flex items-center justify-between shadow-2xl animate-in fade-in slide-in-from-bottom duration-300">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-[#34D399] shrink-0" />
                      <div>
                        <h5 className="font-bold text-sm">Login Completed Successfully!</h5>
                        <p className="text-xs text-[#A7F3D0]">
                          {completeData.finalUrl ? `Redirected to: ${completeData.finalUrl}` : completeData.message}
                        </p>
                      </div>
                    </div>
                    {completeData.finalUrl && (
                      <a
                        href={completeData.finalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 bg-[#FFFFFF] text-[#064E3B] rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-[#ECFDF5] transition"
                      >
                        Open Portal <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                )}

                {/* Overlay Error Banner */}
                {errorMessage && (
                  <div className="absolute bottom-6 left-6 right-6 p-4 bg-[#450A0A]/90 backdrop-blur-md rounded-2xl border border-[#991B1B]/80 text-white flex items-center gap-3 shadow-2xl">
                    <AlertCircle className="w-6 h-6 text-[#F87171] shrink-0" />
                    <div>
                      <h5 className="font-bold text-sm">Automation Notice</h5>
                      <p className="text-xs text-[#FECACA]">{errorMessage}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
