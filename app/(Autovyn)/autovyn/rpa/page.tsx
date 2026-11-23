"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import DataTable from "@/components/Templates/servicetable";
import HashloaderComponent from "@/components/Templates/hashloader";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import Ainput from "@/components/atoms/Input";
import SelectSearch from "@/components/atoms/Select";
import Acheckbox from "@/components/atoms/Checkbox";
import MediumTitle from "@/components/atoms/MediumTitle";
import SmallTitle from "@/components/atoms/smallTitle";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Server,
  Key,
  Play,
  Mail,
  Download,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Zap,
  ShieldCheck,
  Eye,
  EyeOff,
  Plus,
  Database,
  Power,
  RefreshCw,
  Clock,
  Monitor,
  Maximize2,
  Minimize2,
  X,
  Terminal,
  Copy,
  Check,
  RotateCcw,
  AlertCircle,
  Radio,
} from "lucide-react";

function showSideAlert(message: string, type: "success" | "error" | "warning" | "info") {
  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 4500,
    timerProgressBar: true,
    customClass: {
      container: "side-alert-container",
      popup: `side-alert-${type}`,
      title: "side-alert-title",
      icon: "side-alert-icon",
    },
  });

  Toast.fire({
    icon: type,
    title: message,
  });
}

interface ServerRecord {
  id: number;
  server_name: string;
  shortcut_name: string;
  server_ip?: string;
  rdp_username?: string;
  rdp_password?: string;
  app_username?: string;
  app_password?: string;
  submit_action?: string;
  date_range_mode?: string;
  execution_order?: number;
  is_active?: boolean | number;
  is_dms_active?: boolean | number;
  is_email_active?: boolean | number;
  last_run_at?: string;
  last_run_status?: string;
  last_error_log?: string;
}

export default function RpaMasterHubPage() {
  const user = useCurrentUser();
  const compCode = user?.Comp_Code || "devteam";
  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:5000";

  const [isLoading, setIsLoading] = useState(false);
  const [servers, setServers] = useState<ServerRecord[]>([]);

  // Modal & Editing state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form State initialized blank so user can enter fresh data
  const [formData, setFormData] = useState({
    server_name: "",
    shortcut_name: "",
    server_ip: "",
    rdp_username: "",
    rdp_password: "",
    app_username: "",
    app_password: "",
    submit_action: "email",
    date_range_mode: "month_till_date",
    execution_order: 1,
    is_active: true,
    is_dms_active: false,
    is_email_active: true,
  });

  // Password visibility states
  const [showRdpPass, setShowRdpPass] = useState(false);
  const [showAppPass, setShowAppPass] = useState(false);

  // Scheduler execution parameters state (starts empty)
  const [schedulerParams, setSchedulerParams] = useState({
    dmsShortcut: "",
    emailShortcut: "",
    emailDateFrom: "",
    emailDateUpto: "",
    attDateFrom: "",
    attDateTo: "",
  });

  // Loading indicator for row-level process toggle
  const [togglingServerProcess, setTogglingServerProcess] = useState<{ id: number; process: "dms" | "email" } | null>(null);

  // Last execution output / feedback
  const [lastResult, setLastResult] = useState<any>(null);

  // DMS Live Stream Modal State
  const [isDmsModalOpen, setIsDmsModalOpen] = useState(false);
  const [isDmsRunning, setIsDmsRunning] = useState(false);
  const [dmsStep, setDmsStep] = useState<number>(0);
  const [dmsStepTitle, setDmsStepTitle] = useState<string>("");
  const [dmsStepDetail, setDmsStepDetail] = useState<string>("");
  const [dmsLogs, setDmsLogs] = useState<string[]>([]);
  const [dmsCompleted, setDmsCompleted] = useState<boolean>(false);
  const [dmsError, setDmsError] = useState<string | null>(null);
  const [dmsElapsed, setDmsElapsed] = useState<number>(0);
  const [dmsFullscreen, setDmsFullscreen] = useState<boolean>(false);
  const [dmsActiveServer, setDmsActiveServer] = useState<string>("");
  const [dmsScreenTimestamp, setDmsScreenTimestamp] = useState<number>(Date.now());
  const [isCopiedLog, setIsCopiedLog] = useState<boolean>(false);
  const [showScreenView, setShowScreenView] = useState<boolean>(true);
  const dmsEventSourceRef = React.useRef<EventSource | null>(null);
  const dmsTimerRef = React.useRef<any>(null);
  const dmsScreenPollRef = React.useRef<any>(null);
  const logTerminalRef = React.useRef<HTMLDivElement | null>(null);

  const cleanupDmsStream = () => {
    if (dmsEventSourceRef.current) {
      dmsEventSourceRef.current.close();
      dmsEventSourceRef.current = null;
    }
    if (dmsTimerRef.current) {
      clearInterval(dmsTimerRef.current);
      dmsTimerRef.current = null;
    }
    if (dmsScreenPollRef.current) {
      clearInterval(dmsScreenPollRef.current);
      dmsScreenPollRef.current = null;
    }
    setIsDmsRunning(false);
  };

  const handleLaunchDmsStream = (overrideShortcut?: string) => {
    const targetShortcut = overrideShortcut || schedulerParams.dmsShortcut || (servers.find((s) => s.is_dms_active)?.shortcut_name || "Rana motors Startup.rdp");
    setDmsActiveServer(targetShortcut);
    setIsDmsModalOpen(true);
    setIsDmsRunning(true);
    setDmsCompleted(false);
    setDmsError(null);
    setDmsStep(1);
    setDmsStepTitle("Remote Automation Initialization");
    setDmsStepDetail("Connecting to FreeRDP session & preparing Xvfb display...");
    setDmsLogs([`⚡ [LIVE STREAM] Initializing live DMS pipeline for server: ${targetShortcut}`]);
    setDmsElapsed(0);
    setDmsScreenTimestamp(Date.now());

    cleanupDmsStream();
    setIsDmsRunning(true);

    dmsTimerRef.current = setInterval(() => {
      setDmsElapsed((prev) => prev + 1);
    }, 1000);

    dmsScreenPollRef.current = setInterval(() => {
      setDmsScreenTimestamp(Date.now());
    }, 2000);

    const streamUrl = `${baseUrl}/api/rpa/dms/live-stream?shortcut=${encodeURIComponent(targetShortcut)}&compcode=${encodeURIComponent(compCode)}`;
    const es = new EventSource(streamUrl);
    dmsEventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "log" && data.message) {
          setDmsLogs((prev) => [...prev, data.message]);
        } else if (data.type === "step") {
          setDmsStep(data.step || 1);
          setDmsStepTitle(data.title || "");
          setDmsStepDetail(data.detail || "");
          setDmsScreenTimestamp(Date.now());
        } else if (data.type === "complete") {
          setDmsCompleted(true);
          setDmsStep(4);
          setDmsStepTitle("DMS Sync Automation Completed Successfully!");
          setDmsStepDetail(data.message || "All master databases synced.");
          cleanupDmsStream();
          fetchServers();
        } else if (data.type === "error") {
          setDmsError(data.message || "An error occurred during DMS stream.");
          cleanupDmsStream();
        }
      } catch (e) {
        setDmsLogs((prev) => [...prev, event.data]);
      }
    };

    es.onerror = () => {
      if (!dmsCompleted && !dmsError) {
        setDmsLogs((prev) => [...prev, "[STREAM] Connection ended or closed."]);
      }
      cleanupDmsStream();
    };
  };

  useEffect(() => {
    if (logTerminalRef.current) {
      logTerminalRef.current.scrollTop = logTerminalRef.current.scrollHeight;
    }
  }, [dmsLogs]);

  useEffect(() => {
    return () => {
      cleanupDmsStream();
    };
  }, []);

  const handleCopyLogs = () => {
    navigator.clipboard.writeText(dmsLogs.join("\n"));
    setIsCopiedLog(true);
    setTimeout(() => setIsCopiedLog(false), 2000);
  };

  const formatElapsed = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleInputChange = (name: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSchedulerChange = (name: string, value: any) => {
    setSchedulerParams((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Fetch servers from database
  const fetchServers = async () => {
    try {
      const res = await axios.get(`${baseUrl}/api/rpa/vynfinance/servers`, {
        headers: { compcode: compCode },
        params: { compcode: compCode },
      });
      if (res.data?.success) {
        setServers(res.data.servers || []);
      }
    } catch (err: any) {
      console.warn("Error fetching servers:", err.message);
    }
  };

  useEffect(() => {
    fetchServers();
  }, [compCode]);

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      server_name: "",
      shortcut_name: "",
      server_ip: "",
      rdp_username: "",
      rdp_password: "",
      app_username: "",
      app_password: "",
      submit_action: "email",
      date_range_mode: "month_till_date",
      execution_order: 1,
      is_active: true,
      is_dms_active: false,
      is_email_active: true,
    });
    setShowRdpPass(false);
    setShowAppPass(false);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (srv: ServerRecord) => {
    setIsEditing(true);
    setEditingId(srv.id);
    setFormData({
      server_name: srv.server_name || "",
      shortcut_name: srv.shortcut_name || "",
      server_ip: srv.server_ip || "",
      rdp_username: srv.rdp_username || "",
      rdp_password: srv.rdp_password || "",
      app_username: srv.app_username || "",
      app_password: srv.app_password || "",
      submit_action: srv.submit_action || "email",
      date_range_mode: srv.date_range_mode || "month_till_date",
      execution_order: srv.execution_order || 1,
      is_active: Boolean(srv.is_active),
      is_dms_active: Boolean(srv.is_dms_active),
      is_email_active: Boolean(srv.is_email_active),
    });
    setShowRdpPass(false);
    setShowAppPass(false);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.server_name.trim() || !formData.shortcut_name.trim()) {
      showSideAlert("Server Name and Shortcut File Name are required.", "warning");
      return;
    }

    // Check duplicate IP validation
    const trimmedIp = formData.server_ip?.trim();
    if (trimmedIp) {
      const isDuplicate = servers.some(
        (s) => s.server_ip?.trim().toLowerCase() === trimmedIp.toLowerCase() && s.id !== editingId
      );
      if (isDuplicate) {
        showSideAlert(`Server with IP '${trimmedIp}' already exists. Same IP cannot be created!`, "warning");
        return;
      }
    }

    setIsLoading(true);
    try {
      const payload = {
        server_name: formData.server_name.trim(),
        shortcut_name: formData.shortcut_name.trim(),
        server_ip: formData.server_ip.trim(),
        rdp_username: formData.rdp_username.trim(),
        rdp_password: formData.rdp_password.trim(),
        app_username: formData.app_username.trim(),
        app_password: formData.app_password.trim(),
        submit_action: formData.submit_action,
        date_range_mode: formData.date_range_mode,
        execution_order: formData.execution_order,
        is_active: formData.is_active ? 1 : 0,
        is_dms_active: formData.is_dms_active ? 1 : 0,
        is_email_active: formData.is_email_active ? 1 : 0,
      };

      if (isEditing && editingId) {
        await axios.put(`${baseUrl}/api/rpa/vynfinance/servers/${editingId}`, payload, {
          headers: { compcode: compCode },
        });
        showSideAlert("Server credentials updated successfully!", "success");
      } else {
        await axios.post(`${baseUrl}/api/rpa/vynfinance/servers`, payload, {
          headers: { compcode: compCode },
        });
        showSideAlert("Server credentials saved to Vault successfully!", "success");
      }

      await fetchServers();
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      showSideAlert(err.response?.data?.error || err.message || "Failed to save server", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirm = await Swal.fire({
      title: "Delete Server?",
      text: `Are you sure you want to remove Server #${id}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
    });

    if (confirm.isConfirmed) {
      setIsLoading(true);
      try {
        await axios.delete(`${baseUrl}/api/rpa/vynfinance/servers/${id}`, {
          headers: { compcode: compCode },
        });
        showSideAlert("Server configuration removed.", "success");
        await fetchServers();
        if (editingId === id) resetForm();
      } catch (err: any) {
        showSideAlert(err.message, "error");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Toggle overall Server Active / Inactive
  const handleToggle = async (id: number) => {
    setIsLoading(true);
    try {
      await axios.post(`${baseUrl}/api/rpa/vynfinance/servers/${id}/toggle`, {}, {
        headers: { compcode: compCode },
      });
      showSideAlert("Server status toggled.", "success");
      await fetchServers();
    } catch (err: any) {
      showSideAlert(err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle individual process (DMS Sync or Email Dispatch) for a specific server row
  const handleToggleServerProcess = async (id: number, process: "dms" | "email") => {
    setTogglingServerProcess({ id, process });
    try {
      // Optimistic update
      setServers((prev) =>
        prev.map((s) => {
          if (s.id === id) {
            const flagKey = process === "dms" ? "is_dms_active" : "is_email_active";
            return {
              ...s,
              [flagKey]: !Boolean(s[flagKey]),
            };
          }
          return s;
        })
      );

      await axios.post(
        `${baseUrl}/api/rpa/vynfinance/servers/${id}/toggle-process`,
        { process },
        { headers: { compcode: compCode } }
      );
      showSideAlert(`${process.toUpperCase()} process toggled successfully.`, "success");
      await fetchServers();
    } catch (err: any) {
      showSideAlert(err.response?.data?.error || err.message || "Failed to toggle process", "error");
      await fetchServers();
    } finally {
      setTogglingServerProcess(null);
    }
  };

  // Execution Handlers
  const handleRunDms = async (overrideShortcut?: string) => {
    handleLaunchDmsStream(overrideShortcut);
  };

  const handleRunEmail = async (overrideShortcut?: string) => {
    const targetShortcut = overrideShortcut || schedulerParams.emailShortcut || "";
    setIsLoading(true);
    showSideAlert(
      `Starting VYNFINANCE Email Automation ${targetShortcut ? `for: ${targetShortcut}` : "(All Active Email Servers)"}...`,
      "info"
    );
    try {
      const res = await axios.get(`${baseUrl}/api/rpa/scheduler/run-email`, {
        params: {
          compcode: compCode,
          shortcut: targetShortcut || undefined,
          dateFrom: schedulerParams.emailDateFrom || undefined,
          dateUpto: schedulerParams.emailDateUpto || undefined,
          force: true,
        },
      });
      setLastResult(res.data);
      if (res.data?.success) {
        showSideAlert("VYNFINANCE Email Automation Executed Successfully!", "success");
      } else {
        showSideAlert(res.data?.message || "Execution finished with notice", "warning");
      }
      fetchServers();
    } catch (err: any) {
      showSideAlert(err.response?.data?.error || err.message, "error");
      setLastResult({ success: false, error: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunAttendance = async () => {
    setIsLoading(true);
    showSideAlert("Starting ERP Attendance Report Download...", "info");
    try {
      const res = await axios.get(`${baseUrl}/api/rpa/scheduler/run-attendance`, {
        params: {
          compcode: compCode,
          dateFrom: schedulerParams.attDateFrom,
          dateTo: schedulerParams.attDateTo,
        },
      });
      setLastResult(res.data);
      if (res.data?.success) {
        showSideAlert(`Report Downloaded: ${res.data?.summary?.fileName}`, "success");
      } else {
        showSideAlert(res.data?.message || "Download failed", "error");
      }
    } catch (err: any) {
      showSideAlert(err.response?.data?.error || err.message, "error");
      setLastResult({ success: false, error: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunAll = async () => {
    setIsLoading(true);
    showSideAlert("Executing Master Scheduler (Email + Attendance Report Download)...", "info");
    try {
      const res = await axios.get(`${baseUrl}/api/rpa/scheduler/run-all`, {
        params: { compcode: compCode },
      });
      setLastResult(res.data);
      showSideAlert(res.data?.message || "Master scheduler finished.", res.data?.success ? "success" : "warning");
      fetchServers();
    } catch (err: any) {
      showSideAlert(err.response?.data?.error || err.message, "error");
      setLastResult({ success: false, error: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  // DataTable columns for servers with individual process toggles (Rana, Suwalka, Unicorn, etc.)
  const serverColumns = [
    {
      Header: "Server Name",
      accessor: "server_name",
      Cell: ({ row, value }: any) => (
        <div className="flex flex-col">
          <span className="text-base font-bold text-[#111827] dark:text-white">{value || "-"}</span>
          <span className="text-xs text-[#9CA3AF] font-mono">{row.original.shortcut_name}</span>
        </div>
      ),
    },
    {
      Header: "Server IP",
      accessor: "server_ip",
      Cell: ({ value }: any) => (
        <span className="text-sm font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[#2563EB] dark:text-[#60A5FA]">
          {value || "-"}
        </span>
      ),
    },
    {
      Header: "RDP User",
      accessor: "rdp_username",
      Cell: ({ value }: any) => <span className="text-sm font-semibold">{value || "-"}</span>,
    },
    {
      Header: "DMS Sync",
      accessor: "is_dms_active",
      Cell: ({ row }: any) => {
        const dmsActive = Boolean(row.original.is_dms_active);
        const isToggling = togglingServerProcess?.id === row.original.id && togglingServerProcess?.process === "dms";
        return (
          <div
            className={`flex items-center gap-2 cursor-pointer select-none py-1 ${
              isToggling ? "opacity-50 pointer-events-none" : ""
            }`}
            onClick={() => !isToggling && handleToggleServerProcess(row.original.id, "dms")}
            title={dmsActive ? "DMS is ON (Click to turn OFF)" : "DMS is OFF (Click to turn ON)"}
          >
            <div
              className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${
                dmsActive ? "bg-[#9333EA] shadow-sm shadow-[#D8B4FE] dark:shadow-none" : "bg-[#D1D5DB] dark:bg-[#374151]"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                  dmsActive ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </div>
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                dmsActive ? "text-[#9333EA] dark:text-[#C084FC]" : "text-[#9CA3AF] dark:text-[#6B7280]"
              }`}
            >
              {dmsActive ? "ON" : "OFF"}
            </span>
          </div>
        );
      },
    },
    {
      Header: "Email Dispatch",
      accessor: "is_email_active",
      Cell: ({ row }: any) => {
        const emailActive = Boolean(row.original.is_email_active);
        const isToggling = togglingServerProcess?.id === row.original.id && togglingServerProcess?.process === "email";
        return (
          <div
            className={`flex items-center gap-2 cursor-pointer select-none py-1 ${
              isToggling ? "opacity-50 pointer-events-none" : ""
            }`}
            onClick={() => !isToggling && handleToggleServerProcess(row.original.id, "email")}
            title={emailActive ? "Email is ON (Click to turn OFF)" : "Email is OFF (Click to turn ON)"}
          >
            <div
              className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${
                emailActive ? "bg-[#2563EB] shadow-sm shadow-[#93C5FD] dark:shadow-none" : "bg-[#D1D5DB] dark:bg-[#374151]"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                  emailActive ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </div>
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                emailActive ? "text-[#2563EB] dark:text-[#60A5FA]" : "text-[#9CA3AF] dark:text-[#6B7280]"
              }`}
            >
              {emailActive ? "ON" : "OFF"}
            </span>
          </div>
        );
      },
    },
    {
      Header: "Server Status",
      accessor: "is_active",
      Cell: ({ row }: any) => {
        const active = Boolean(row.original.is_active);
        return (
          <div
            className="flex items-center gap-2 cursor-pointer select-none py-1"
            onClick={() => handleToggle(row.original.id)}
            title={active ? "Server is Active (Click to Deactivate)" : "Server is Inactive (Click to Activate)"}
          >
            <div
              className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${
                active ? "bg-[#059669] shadow-sm shadow-[#6EE7B7] dark:shadow-none" : "bg-[#D1D5DB] dark:bg-[#374151]"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                  active ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </div>
            <span
              className={`text-xs font-bold ${
                active ? "text-[#059669] dark:text-[#34D399]" : "text-[#9CA3AF] dark:text-[#6B7280]"
              }`}
            >
              {active ? "Active" : "Inactive"}
            </span>
          </div>
        );
      },
    },
    {
      Header: "Last Run",
      accessor: "last_run_at",
      Cell: ({ row }: any) => {
        const at = row.original.last_run_at;
        const status = row.original.last_run_status;
        if (!at) return <span className="text-[#94A3B8] text-xs font-semibold">Never</span>;
        return (
          <div className="flex flex-col">
            <span className={status === "SUCCESS" ? "text-[#059669] text-xs font-bold" : "text-[#DC2626] text-xs font-bold"}>
              {status || "RUN"}
            </span>
            <span className="text-[#94A3B8] text-[11px] font-medium">
              {new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        );
      },
    },
    {
      Header: "Controls",
      accessor: "id",
      Cell: ({ row }: any) => {
        return (
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2.5 text-xs font-bold text-[#9333EA] hover:text-[#7E22CE] hover:bg-[#FAF5FF] dark:hover:bg-[#3B0764]/40 border-[#E9D5FF]"
              onClick={() => handleRunDms(row.original.shortcut_name)}
              title="Run DMS for this server now"
            >
              <Play className="w-3 h-3 mr-1 fill-current" /> DMS
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2.5 text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:bg-[#EFF6FF] dark:hover:bg-[#1E3A8A]/40 border-[#BFDBFE]"
              onClick={() => handleRunEmail(row.original.shortcut_name)}
              title="Run Email for this server now"
            >
              <Mail className="w-3 h-3 mr-1" /> Email
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2 text-xs font-bold"
              onClick={() => handleEdit(row.original)}
              title="Edit configuration"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2 text-xs font-bold text-[#DC2626] hover:text-[#B91C1C] hover:bg-[#FEF2F2] dark:hover:bg-[#450A0A]"
              onClick={() => handleDelete(row.original.id)}
              title="Delete configuration"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="grid grid-cols-12 gap-4 pb-12">
      {/* ── 1. HEADER ── */}
      <div className="col-span-12">
        <div className="rounded-t bg-header dark:bg-black px-2 md:px-6 py-2.5 border dark:border-borderColor-dark">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-7 h-7 text-white dark:text-[#37a9dd]" />
              <div>
                <h1 className="font-bold sm:text-sm md:text-lg lg:text-xl text-white dark:text-[#37a9dd] flex items-center gap-x-2 uppercase tracking-wide">
                  Autovyn RPA Master Hub
                </h1>
                <p className="text-sm text-[#E2E8F0] dark:text-[#94A3B8]">
                  VYNFINANCE Remote Desktop Credential Vault & Per-Server Process Controls
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="save"
                className="font-semibold text-xs h-9 flex items-center gap-1.5 shadow"
                onClick={openCreateModal}
              >
                <Plus className="w-3.5 h-3.5" /> Create
              </Button>

              <Button
                variant="save"
                className="font-semibold text-xs h-9 flex items-center gap-1.5 shadow bg-[#059669] hover:bg-[#047857]"
                onClick={handleRunAll}
                title="Run all active remote app servers in sequence"
              >
                Run Master Schedulers
              </Button>

              <Button
                variant="print"
                className="text-xs h-9"
                onClick={() => window.history.back()}
              >
                Back
              </Button>
            </div>
          </div>
        </div>

        {/* Status Count Ribbon with Process Counts */}
        <div className="mt-0 rounded-b p-2 md:p-3 bg-white dark:bg-black border border-borderColor dark:border-borderColor-dark shadow flex flex-wrap items-center justify-between gap-4 font-bold text-sm md:text-base">
          <div className="flex flex-wrap items-center gap-4">
            <div className="text-save flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#059669]" />
              <span>Active Servers :- {servers.filter((s) => s.is_active).length}</span>
            </div>
            <div className="text-[#9333EA] dark:text-[#C084FC] flex items-center gap-1.5">
              <Database className="w-4 h-4 text-[#9333EA]" />
              <span>DMS Active :- {servers.filter((s) => s.is_active && s.is_dms_active).length}</span>
            </div>
            <div className="text-[#2563EB] dark:text-[#60A5FA] flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-[#2563EB]" />
              <span>Email Active :- {servers.filter((s) => s.is_active && s.is_email_active).length}</span>
            </div>
            <div className="text-exit flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-[#DC2626]" />
              <span>Inactive Servers :- {servers.filter((s) => !s.is_active).length}</span>
            </div>
            <div className="text-primary flex items-center gap-1.5">
              <Server className="w-4 h-4 text-[#2563EB]" />
              <span>Total :- {servers.length}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 flex items-center gap-1 text-xs"
              onClick={fetchServers}
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh Table
            </Button>
          </div>
        </div>
      </div>

      {/* ── 2. ON-DEMAND SCHEDULER EXECUTION CARDS (Task 1, Task 2 & Task 3) ── */}
      {/* Task 1: DMS Sync Schedular Box */}
      <div className="col-span-12 lg:col-span-4">
        <div className="rounded p-4 bg-white dark:bg-black border border-borderColor dark:border-borderColor-dark shadow h-full flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-2 mb-3 border-b border-borderColor dark:border-borderColor-dark text-[#9333EA] dark:text-[#C084FC] text-lg font-bold">
              <Database className="w-5 h-5" />
              <SmallTitle text="Task 1: DMS Sync Schedular" />
            </div>

            <div className="p-2.5 mb-3 rounded border text-xs flex items-center justify-between bg-[#FAF5FF]/60 dark:bg-[#3B0764]/30 border-[#E9D5FF] dark:border-[#581C87]/50 text-[#581C87] dark:text-[#E9D5FF]">
              <div className="flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5" />
                <span>Cron: 12:05 PM, 08:30 AM</span>
              </div>
              <span className="font-semibold">Runs on servers where DMS is ON</span>
            </div>

            <div className="space-y-2 text-lg">
              <SelectSearch
                title="Target DMS Server"
                name="dmsShortcut"
                labelClass="text-lg"
                placeholder="-- All Active DMS Servers --"
                selectedValue={schedulerParams.dmsShortcut}
                handleInputChange={handleSchedulerChange}
                options={[
                  { value: "", label: "-- Run All Active DMS Servers --" },
                  ...servers.map((s) => ({
                    value: s.shortcut_name,
                    label: `${s.shortcut_name} (${s.server_name})`,
                  })),
                ]}
              />
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] italic pt-1">
                Launches DMS shortcut, starts server cmd, downloads Master Data via Chrome, and processes DMSYNC.
              </p>
            </div>
          </div>

          <Button
            variant="save"
            className="w-full bg-[#9333EA] hover:bg-[#7E22CE] text-white font-bold mt-4"
            size="lg"
            onClick={() => handleRunDms()}
          >
            <Play className="w-4 h-4 mr-1.5 fill-current" /> Run DMS Schedular Now
          </Button>
        </div>
      </div>

      {/* Task 2: Email Dispatch Box */}
      <div className="col-span-12 lg:col-span-4">
        <div className="rounded p-4 bg-white dark:bg-black border border-borderColor dark:border-borderColor-dark shadow h-full flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-2 mb-3 border-b border-borderColor dark:border-borderColor-dark text-[#2563EB] dark:text-[#60A5FA] text-lg font-bold">
              <Mail className="w-5 h-5" />
              <SmallTitle text="Task 2: VYNFINANCE Email Schedular" />
            </div>

            <div className="p-2.5 mb-3 rounded border text-xs flex items-center justify-between bg-[#EFF6FF]/60 dark:bg-[#1E3A8A]/30 border-[#BFDBFE] dark:border-[#1E40AF]/50 text-[#1E3A8A] dark:text-[#BFDBFE]">
              <div className="flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5" />
                <span>Cron: 12:15 PM, 08:00 AM</span>
              </div>
              <span className="font-semibold">Runs on servers where Email is ON</span>
            </div>

            <div className="space-y-2 text-lg">
              <SelectSearch
                title="Target Shortcut"
                name="emailShortcut"
                labelClass="text-lg"
                placeholder="-- All Active Email Servers --"
                selectedValue={schedulerParams.emailShortcut}
                handleInputChange={handleSchedulerChange}
                options={[
                  { value: "", label: "-- All Active Email Servers --" },
                  ...servers.map((s) => ({
                    value: s.shortcut_name,
                    label: `${s.shortcut_name} (${s.server_name})`,
                  })),
                ]}
              />

              <div className="grid grid-cols-2 gap-2">
                <Ainput
                  title="Date From"
                  type="date"
                  name="emailDateFrom"
                  labelClass="text-lg"
                  value={schedulerParams.emailDateFrom}
                  handleInputChange={handleSchedulerChange}
                  placeholder="01/MM/YY"
                />
                <Ainput
                  title="Date Upto"
                  type="date"
                  labelClass="text-lg"
                  name="emailDateUpto"
                  value={schedulerParams.emailDateUpto}
                  handleInputChange={handleSchedulerChange}
                  placeholder="DD/MM/YY"
                />
              </div>
            </div>
          </div>

          <Button
            variant="save"
            className="w-full font-bold mt-4"
            size="lg"
            onClick={() => handleRunEmail()}
          >
            <Play className="w-4 h-4 mr-1.5 fill-current" /> Run Email Schedular Now
          </Button>
        </div>
      </div>

      {/* Task 3: Attendance Report Download Box */}
      <div className="col-span-12 lg:col-span-4">
        <div className="rounded p-4 bg-white dark:bg-black border border-borderColor dark:border-borderColor-dark shadow h-full flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-2 mb-3 border-b border-borderColor dark:border-borderColor-dark text-[#059669] dark:text-[#34D399] text-lg font-bold">
              <Download className="w-5 h-5" />
              <SmallTitle text="Task 3: Attendance Report Download" />
            </div>

            <div className="p-2.5 mb-3 rounded border text-xs flex items-center justify-between bg-[#ECFDF5]/60 dark:bg-[#064E3B]/30 border-[#A7F3D0] dark:border-[#065F46]/50 text-[#064E3B] dark:text-[#A7F3D0]">
              <div className="flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5" />
                <span>Cron: 12:15 PM, 08:00 AM</span>
              </div>
              <span className="font-semibold">All Connected Branches</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <Ainput
                  title="Date From"
                  labelClass="text-lg"
                  type="date"
                  name="attDateFrom"
                  value={schedulerParams.attDateFrom}
                  handleInputChange={handleSchedulerChange}
                />
                <Ainput
                  title="Date To"
                  labelClass="text-lg"
                  type="date"
                  name="attDateTo"
                  value={schedulerParams.attDateTo}
                  handleInputChange={handleSchedulerChange}
                />
              </div>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] italic pt-1">
                Downloads monthly attendance logs and biometric records for ERP payroll processing.
              </p>
            </div>
          </div>

          <Button
            variant="save"
            size="lg"
            className="w-full bg-[#059669] hover:bg-[#047857] text-white font-bold mt-4"
            onClick={handleRunAttendance}
          >
            <Download className="w-4 h-4 mr-1.5" /> Download Report Now
          </Button>
        </div>
      </div>

      {/* ── 3. CONFIGURED SERVERS TABLE (Per-Server Row Controls for Rana, Suwalka, Unicorn) ── */}
      <div className="col-span-12">
        <div className="rounded-t p-3 bg-white dark:bg-black border border-b-0 border-borderColor dark:border-borderColor-dark flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA]" />
            <MediumTitle text={`Configured Remote Desktop Servers (${servers.length})`} />
          </div>
          <Button
            variant="save"
            size="sm"
            className="text-xs h-7 flex items-center gap-1"
            onClick={openCreateModal}
          >
            <Plus className="w-3.5 h-3.5" /> Add Server
          </Button>
        </div>

        <div className="rounded-b p-2 md:p-4 bg-white dark:bg-black border border-borderColor dark:border-borderColor-dark shadow">
          <DataTable
            columns={serverColumns}
            selectValue="id"
            data={servers}
            height="380px"
            size="text-lg"
            headerClassName="text-lg font-bold"
            labelClassName="text-lg font-semibold"
            filterPosition="FilterData"
            numericFilterColumns={[]}
          />
        </div>
      </div>

      {/* ── 4. CREATE / EDIT SERVER VAULT MODAL (Dialog) ── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto p-4 md:p-6 bg-white dark:bg-black border border-borderColor dark:border-borderColor-dark">
          <DialogHeader className="pb-2 border-b border-borderColor dark:border-borderColor-dark">
            <DialogTitle className="text-base font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-[#2563EB] dark:text-[#60A5FA]" />
              <span>{isEditing ? `Edit Server Configuration (#${editingId})` : "Create New Server Credentials Vault"}</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
              {/* Server Name */}
              <div className="w-full">
                <Ainput
                  title="Server / Dealership Name"
                  type="text"
                  name="server_name"
                  labelClass="text-lg"
                  className="text-lg px-2 h-10"
                  value={formData.server_name}
                  handleInputChange={handleInputChange}
                  required={true}
                  placeholder="e.g. Rana motors Startup (Email Dispatch)"
                />
              </div>

              {/* Shortcut File Name */}
              <div className="w-full">
                <Ainput
                  title="Shortcut File (.rdp)"
                  labelClass="text-lg"
                  className="text-lg px-2 h-10 "
                  type="text"
                  name="shortcut_name"
                  value={formData.shortcut_name}
                  handleInputChange={handleInputChange}
                  required={true}
                  placeholder="e.g. Rana motors Startup.rdp"
                />
              </div>

              {/* Server IP & Port */}
              <div className="w-full">
                <Ainput
                  title="Server IP & Port"
                  labelClass="text-lg"
                  className="text-lg px-2 h-10 "
                  type="text"
                  name="server_ip"
                  value={formData.server_ip}
                  handleInputChange={handleInputChange}
                  placeholder="e.g. 103.74.65.30:4638"
                />
              </div>

              {/* Execution Priority Order */}
              <div className="w-full">
                <Ainput
                  title="Execution Priority Order"
                  className="text-lg px-2 h-10 "
                  labelClass="text-lg"
                  type="number"
                  name="execution_order"
                  value={formData.execution_order}
                  handleInputChange={handleInputChange}
                  placeholder="1"
                />
              </div>

              {/* Windows RDP Username */}
              <div className="w-full">
                <Ainput
                  title="Windows RDP Username"
                  labelClass="text-lg"
                  className="text-lg px-2 h-10 "
                  type="text"
                  name="rdp_username"
                  value={formData.rdp_username}
                  handleInputChange={handleInputChange}
                  placeholder="e.g. atendra"
                />
              </div>

              {/* Windows RDP Password */}
              <div className="w-full relative">
                <Ainput
                  title="Windows RDP Password"
                  className="text-lg px-2 h-10 "
                  labelClass="text-lg"
                  type={showRdpPass ? "text" : "password"}
                  name="rdp_password"
                  value={formData.rdp_password}
                  handleInputChange={handleInputChange}
                  placeholder="e.g. user@123"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-10 h-7 w-7 text-[#94A3B8] hover:text-[#475569] p-0"
                  onClick={() => setShowRdpPass(!showRdpPass)}
                  title={showRdpPass ? "Hide password" : "Show password"}
                >
                  {showRdpPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>

              {/* VYNFINANCE App User */}
              <div className="w-full">
                <Ainput
                  title="VYNFINANCE Software User"
                  labelClass="text-lg"
                  className="text-lg px-2 h-10 "
                  type="text"
                  name="app_username"
                  value={formData.app_username}
                  handleInputChange={handleInputChange}
                  placeholder="e.g. admin"
                />
              </div>

              {/* VYNFINANCE App Password */}
              <div className="w-full relative">
                <Ainput
                  title="VYNFINANCE Software Password"
                  labelClass="text-lg"
                  className="text-lg px-2 h-10 "
                  type={showAppPass ? "text" : "password"}
                  name="app_password"
                  value={formData.app_password}
                  handleInputChange={handleInputChange}
                  placeholder="e.g. $ecure@0273"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-10 h-7 w-7 text-[#94A3B8] hover:text-[#475569] p-0"
                  onClick={() => setShowAppPass(!showAppPass)}
                  title={showAppPass ? "Hide password" : "Show password"}
                >
                  {showAppPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Process Active / Inactive Checkboxes */}
            <div className="p-3 rounded-lg border border-borderColor dark:border-borderColor-dark bg-[#F8FAFC] dark:bg-[#0F172A]/40 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280] block mb-1">
                Automation Process Authorizations
              </span>
              <div className="flex flex-wrap items-center gap-6">
                <Acheckbox
                  name="is_dms_active"
                  label="Enable DMS Sync for this Server"
                  value={formData.is_dms_active}
                  handleInputChange={handleInputChange}
                />
                <Acheckbox
                  name="is_email_active"
                  label="Enable Email Dispatch for this Server"
                  value={formData.is_email_active}
                  handleInputChange={handleInputChange}
                />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-borderColor dark:border-borderColor-dark flex items-center justify-between flex-wrap gap-3">
              <Acheckbox
                name="is_active"
                label="Enable Server (Overall Active)"
                value={formData.is_active}
                handleInputChange={handleInputChange}
              />

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="text-xs h-8"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="save" className="text-xs h-8 px-4 font-bold">
                  {isEditing ? "Update Server Credentials" : "Save to Vault"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DMS Live Stream & Screencast Modal */}
      <Dialog
        open={isDmsModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            cleanupDmsStream();
            setIsDmsModalOpen(false);
          }
        }}
      >
        <DialogContent
          className={`overflow-hidden p-0 bg-[#0B0F19] text-white border border-[#1E293B] shadow-2xl transition-all duration-300 ${
            dmsFullscreen
              ? "max-w-[98vw] w-[98vw] h-[96vh] max-h-[96vh] rounded-xl flex flex-col"
              : "max-w-6xl w-[94vw] h-[88vh] max-h-[88vh] rounded-2xl flex flex-col"
          }`}
        >
          {/* Top Bar */}
          <div className="px-5 py-3.5 bg-[#111827] border-b border-[#1F2937] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  {isDmsRunning ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </>
                  ) : dmsCompleted ? (
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  ) : (
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  )}
                </span>
                <span className="font-extrabold text-sm tracking-wide text-white uppercase flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-purple-400" />
                  DMS Live Screencast
                </span>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-xs bg-[#1F2937] px-2.5 py-1 rounded-md border border-[#374151]">
                <Server className="w-3.5 h-3.5 text-purple-400" />
                <span className="font-mono text-purple-200">{dmsActiveServer || "Active Server"}</span>
              </div>

              {isDmsRunning && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 animate-pulse">
                  SYNCING LIVE
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-mono bg-black/50 px-2.5 py-1 rounded-md border border-gray-800 text-gray-300">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{formatElapsed(dmsElapsed)}</span>
              </div>

              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2.5 text-xs bg-[#1E293B] hover:bg-[#334155] border-[#334155] text-gray-200"
                onClick={() => setShowScreenView(!showScreenView)}
                title={showScreenView ? "Focus on Logs Only" : "Show Remote Screencast"}
              >
                <Monitor className="w-3.5 h-3.5 mr-1 text-cyan-400" />
                {showScreenView ? "Hide Screen" : "Show Screen"}
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0 bg-[#1E293B] hover:bg-[#334155] border-[#334155] text-gray-200"
                onClick={() => setDmsFullscreen(!dmsFullscreen)}
                title={dmsFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {dmsFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0 bg-[#1E293B] hover:bg-red-900/40 border-[#334155] text-gray-200 hover:text-red-300"
                onClick={() => {
                  cleanupDmsStream();
                  setIsDmsModalOpen(false);
                }}
                title="Close"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div className="px-5 py-3 bg-[#0F172A] border-b border-[#1E293B] shrink-0">
            <div className="grid grid-cols-4 gap-2 mb-2">
              {[
                { no: 1, label: "RDP & Session Init" },
                { no: 2, label: "CMD & App Startup" },
                { no: 3, label: "Chrome Master Sync" },
                { no: 4, label: "DMSync DB Process" },
              ].map((s) => {
                const isPassed = dmsStep > s.no || dmsCompleted;
                const isCurrent = dmsStep === s.no && !dmsCompleted;
                return (
                  <div
                    key={s.no}
                    className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                      isPassed
                        ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300"
                        : isCurrent
                        ? "bg-purple-950/50 border-purple-600/80 text-purple-200 ring-1 ring-purple-500/50"
                        : "bg-[#1E293B]/40 border-gray-800 text-gray-500"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isPassed
                          ? "bg-emerald-500 text-black"
                          : isCurrent
                          ? "bg-purple-500 text-white animate-pulse"
                          : "bg-gray-800 text-gray-400"
                      }`}
                    >
                      {isPassed ? <Check className="w-3 h-3 stroke-[3]" /> : s.no}
                    </div>
                    <span className="text-xs font-semibold truncate">{s.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Current Step Status Line */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-[#1E293B]">
              <div className="flex items-center gap-2 truncate">
                <span className="text-purple-400 font-bold uppercase tracking-wider text-[11px]">
                  {dmsCompleted ? "COMPLETED" : `STEP ${dmsStep || 1} IN PROGRESS:`}
                </span>
                <span className="text-gray-200 font-medium truncate">{dmsStepTitle || "Waiting for stream..."}</span>
                {dmsStepDetail && (
                  <span className="hidden md:inline text-gray-400 text-[11px] truncate">({dmsStepDetail})</span>
                )}
              </div>

              {dmsError ? (
                <span className="text-red-400 font-bold flex items-center gap-1 text-[11px]">
                  <AlertCircle className="w-3.5 h-3.5" /> ERROR DETECTED
                </span>
              ) : isDmsRunning ? (
                <span className="text-cyan-400 font-mono text-[11px] flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" /> RUNNING
                </span>
              ) : (
                <span className="text-emerald-400 font-semibold text-[11px]">READY</span>
              )}
            </div>
          </div>

          {/* Main Visual Workspace: Remote Screencast (Left) + Terminal Console (Right) */}
          <div className="flex-1 min-h-0 p-4 grid grid-cols-12 gap-4 bg-[#090D16] overflow-hidden">
            {/* Screencast Screen */}
            {showScreenView && (
              <div
                className={`flex flex-col rounded-xl border border-[#1E293B] bg-black/60 overflow-hidden shadow-inner ${
                  showScreenView ? "col-span-12 lg:col-span-7" : "hidden"
                }`}
              >
                <div className="px-3.5 py-2 bg-[#111827] border-b border-[#1F2937] flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-300">
                    <Monitor className="w-4 h-4 text-cyan-400" />
                    <span>Remote Display Screencast</span>
                    <span className="text-[10px] text-gray-500 font-mono">1360x768 Xvfb</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[11px] text-gray-400 font-mono">Refreshed 2s</span>
                  </div>
                </div>

                <div className="flex-1 bg-black flex items-center justify-center p-2 relative overflow-hidden group">
                  <img
                    key={dmsScreenTimestamp}
                    src={`${baseUrl}/api/rpa/dms/latest-screen?t=${dmsScreenTimestamp}`}
                    alt="DMS Remote Screen"
                    className="max-w-full max-h-full object-contain rounded border border-gray-900 shadow-md"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                  <div className="absolute bottom-3 left-4 px-2 py-1 bg-black/80 rounded text-[10px] font-mono text-gray-400 border border-gray-800">
                    Host: {dmsActiveServer} • Screen Sync Active
                  </div>
                </div>
              </div>
            )}

            {/* Terminal Console */}
            <div
              className={`flex flex-col rounded-xl border border-[#1E293B] bg-[#0A0E17] overflow-hidden shadow-inner ${
                showScreenView ? "col-span-12 lg:col-span-5" : "col-span-12"
              }`}
            >
              <div className="px-3.5 py-2 bg-[#111827] border-b border-[#1F2937] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-300">
                  <Terminal className="w-4 h-4 text-purple-400" />
                  <span>Real-Time Logs (SSE)</span>
                  <span className="text-[10px] text-purple-400 bg-purple-950/60 px-1.5 py-0.5 rounded font-mono">
                    {dmsLogs.length} events
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-[11px] text-gray-400 hover:text-white hover:bg-gray-800"
                  onClick={handleCopyLogs}
                >
                  {isCopiedLog ? (
                    <>
                      <Check className="w-3 h-3 mr-1 text-emerald-400" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1" /> Copy Log
                    </>
                  )}
                </Button>
              </div>

              {/* Log Messages Box with Auto-scroll */}
              <div
                ref={logTerminalRef}
                className="flex-1 p-3 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1 bg-[#050811] text-gray-300 select-text"
              >
                {dmsLogs.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-600">
                    Connecting to live stream event source...
                  </div>
                ) : (
                  dmsLogs.map((logLine, idx) => {
                    const isError = /error|fail|reject|invalid/i.test(logLine);
                    const isSuccess = /success|completed|verified|🎉|✅/i.test(logLine);
                    const isStep = /\[STEP|\[RANA|\[DMS|\[INIT/i.test(logLine);
                    const isWarn = /warn|notice|retry/i.test(logLine);

                    return (
                      <div
                        key={idx}
                        className={`break-all ${
                          isError
                            ? "text-red-400 font-semibold"
                            : isSuccess
                            ? "text-emerald-300 font-semibold"
                            : isStep
                            ? "text-cyan-300 font-medium"
                            : isWarn
                            ? "text-amber-300"
                            : "text-slate-300"
                        }`}
                      >
                        {logLine}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="px-5 py-3 bg-[#111827] border-t border-[#1F2937] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              {dmsCompleted ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>DMS Sync Process Completed Successfully</span>
                </div>
              ) : dmsError ? (
                <div className="flex items-center gap-1.5 text-xs text-red-400 font-semibold">
                  <AlertCircle className="w-4 h-4" />
                  <span>Stream Error: {dmsError}</span>
                </div>
              ) : isDmsRunning ? (
                <div className="flex items-center gap-1.5 text-xs text-purple-300 font-medium">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
                  <span>Executing Automation Pipeline in background...</span>
                </div>
              ) : (
                <div className="text-xs text-gray-400">Stream idle or closed.</div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs bg-[#1F2937] hover:bg-[#374151] border-[#374151] text-gray-200"
                onClick={() => handleLaunchDmsStream(dmsActiveServer)}
                disabled={isDmsRunning}
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Re-Run Stream
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs bg-[#1F2937] hover:bg-[#374151] border-[#374151] text-gray-200"
                onClick={handleCopyLogs}
              >
                <Copy className="w-3.5 h-3.5 mr-1" />
                Copy Full Log
              </Button>

              <Button
                size="sm"
                className="h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white font-bold px-4"
                onClick={() => {
                  cleanupDmsStream();
                  setIsDmsModalOpen(false);
                }}
              >
                Close Stream
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* HashloaderComponent from Templates */}
      <HashloaderComponent isLoading={isLoading} />
    </div>
  );
}
