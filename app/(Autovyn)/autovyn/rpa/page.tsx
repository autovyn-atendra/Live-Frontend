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
  });

  // Password visibility states
  const [showRdpPass, setShowRdpPass] = useState(false);
  const [showAppPass, setShowAppPass] = useState(false);

  // Schedulers Active / Inactive states (persisted in dbo.RPA_Config)
  const [schedulersConfig, setSchedulersConfig] = useState({
    dmsActive: true,
    emailActive: true,
    attendanceActive: true,
  });
  const [isTogglingScheduler, setIsTogglingScheduler] = useState<string | null>(null);

  // Scheduler execution parameters state (starts empty)
  const [schedulerParams, setSchedulerParams] = useState({
    dmsShortcut: "",
    emailShortcut: "",
    emailDateFrom: "",
    emailDateUpto: "",
    attDateFrom: "",
    attDateTo: "",
  });

  // Last execution output / feedback
  const [lastResult, setLastResult] = useState<any>(null);

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
      });
      if (res.data?.success) {
        setServers(res.data.servers || []);
      }
    } catch (err: any) {
      console.warn("Error fetching servers:", err.message);
    }
  };

  // Fetch Schedulers Active/Inactive configuration from dbo.RPA_Config
  const fetchSchedulersConfig = async () => {
    try {
      const res = await axios.get(`${baseUrl}/api/rpa/config`, {
        headers: { compcode: compCode },
        params: { compcode: compCode },
      });
      if (res.data?.success && res.data.configs) {
        const configs = res.data.configs;
        const configMap: Record<string, string> = {};
        if (Array.isArray(configs)) {
          configs.forEach((item: any) => {
            if (item.Config_Key) {
              configMap[item.Config_Key] = String(item.Config_Value);
            }
          });
        } else if (typeof configs === "object") {
          Object.assign(configMap, configs);
        }
        setSchedulersConfig({
          dmsActive: configMap.RPA_DMS_ACTIVE !== "false",
          emailActive: configMap.RPA_EMAIL_ACTIVE !== "false",
          attendanceActive: configMap.RPA_ATTENDANCE_ACTIVE !== "false",
        });
      }
    } catch (err: any) {
      console.warn("Error fetching RPA schedulers config:", err.message);
    }
  };

  useEffect(() => {
    fetchServers();
    fetchSchedulersConfig();
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

  // Toggle Scheduler Active/Inactive state (persists into dbo.RPA_Config)
  const handleToggleSchedulerActive = async (type: "dms" | "email" | "attendance") => {
    const keyMap = {
      dms: "RPA_DMS_ACTIVE",
      email: "RPA_EMAIL_ACTIVE",
      attendance: "RPA_ATTENDANCE_ACTIVE",
    };
    const titleMap = {
      dms: "DMS Sync Schedular",
      email: "VYNFINANCE Email Schedular",
      attendance: "Attendance Download Schedular",
    };
    const key = keyMap[type];
    const currentVal =
      type === "dms"
        ? schedulersConfig.dmsActive
        : type === "email"
        ? schedulersConfig.emailActive
        : schedulersConfig.attendanceActive;
    const newVal = !currentVal;

    setIsTogglingScheduler(type);
    try {
      // Optimistic update
      setSchedulersConfig((prev) => ({
        ...prev,
        [`${type}Active`]: newVal,
      }));

      const res = await axios.post(
        `${baseUrl}/api/rpa/config`,
        {
          key,
          value: newVal ? "true" : "false",
          description: `${titleMap[type]} automation status`,
        },
        {
          headers: { compcode: compCode },
        }
      );

      if (res.data?.success) {
        showSideAlert(
          `${titleMap[type]} is now ${newVal ? "ACTIVE (Will Run on Schedule)" : "INACTIVE (Paused / Won't Run)"}`,
          newVal ? "success" : "warning"
        );
      } else {
        // Revert on failure
        setSchedulersConfig((prev) => ({
          ...prev,
          [`${type}Active`]: currentVal,
        }));
        showSideAlert("Failed to update scheduler status", "error");
      }
    } catch (err: any) {
      // Revert on failure
      setSchedulersConfig((prev) => ({
        ...prev,
        [`${type}Active`]: currentVal,
      }));
      showSideAlert(err.response?.data?.error || err.message || "Failed to update scheduler", "error");
    } finally {
      setIsTogglingScheduler(null);
    }
  };

  // Execution Handlers
  const handleRunDms = async (overrideShortcut?: string) => {
    const targetShortcut = overrideShortcut || schedulerParams.dmsShortcut;
    setIsLoading(true);
    showSideAlert(
      `Starting DMS Sync Automation ${targetShortcut ? `(${targetShortcut})` : "(All Active DMS Servers)"}...`,
      "info"
    );
    try {
      const res = await axios.get(`${baseUrl}/api/rpa/scheduler/run-dms`, {
        params: {
          compcode: compCode,
          shortcut: targetShortcut || undefined,
          force: true, // Manual run is forced
        },
      });
      setLastResult(res.data);
      if (res.data?.success) {
        showSideAlert("DMS Sync Automation Executed Successfully!", "success");
      } else {
        showSideAlert(res.data?.message || "DMS execution finished with notice", "warning");
      }
      fetchServers();
    } catch (err: any) {
      showSideAlert(err.response?.data?.error || err.message, "error");
      setLastResult({ success: false, error: err.message });
    } finally {
      setIsLoading(false);
    }
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

  // DataTable columns for servers
  const serverColumns = [
    {
      Header: "Server Name",
      accessor: "server_name",
      Cell: ({ value }: any) => <span className="text-lg font-semibold">{value || "-"}</span>,
    },
    {
      Header: "Shortcut / RDP",
      accessor: "shortcut_name",
      Cell: ({ value }: any) => <span className="text-lg">{value || "-"}</span>,
    },
    {
      Header: "Server IP",
      accessor: "server_ip",
      Cell: ({ value }: any) => <span className="text-lg font-mono font-semibold">{value || "-"}</span>,
    },
    {
      Header: "RDP User",
      accessor: "rdp_username",
      Cell: ({ value }: any) => <span className="text-lg font-semibold">{value || "-"}</span>,
    },
    {
      Header: "App User",
      accessor: "app_username",
      Cell: ({ value }: any) => <span className="text-lg font-semibold">{value || "-"}</span>,
    },
    {
      Header: "Action",
      accessor: "submit_action",
      Cell: ({ value }: any) => {
        const val = String(value || "email").toLowerCase();
        if (val === "dms") {
          return (
            <span className="inline-block uppercase text-sm font-bold px-3 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
              DMS SYNC
            </span>
          );
        }
        if (val === "ok") {
          return (
            <span className="inline-block uppercase text-sm font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              OK VIEW
            </span>
          );
        }
        return (
          <span className="inline-block uppercase text-sm font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
            EMAIL
          </span>
        );
      },
    },
    {
      Header: "Status",
      accessor: "is_active",
      Cell: ({ row }: any) => {
        const active = Boolean(row.original.is_active);
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleToggle(row.original.id)}
            className={`h-9 px-4 text-lg font-bold rounded-full flex items-center gap-1.5 transition-all ${
              active
                ? "bg-[#DCFCE7] text-[#166534] dark:bg-[#052E16]/60 dark:text-[#86EFAC] border-[#86EFAC] dark:border-[#166534] hover:bg-[#BBF7D0]"
                : "bg-[#F3F4F6] text-[#4B5563] dark:bg-[#1F2937] dark:text-[#9CA3AF] border-[#D1D5DB] dark:border-[#374151] hover:bg-[#E5E7EB]"
            }`}
            title="Click to toggle status"
          >
            {active ? "Active" : "Inactive"}
          </Button>
        );
      },
    },
    {
      Header: "Last Run",
      accessor: "last_run_at",
      Cell: ({ row }: any) => {
        const at = row.original.last_run_at;
        const status = row.original.last_run_status;
        if (!at) return <span className="text-[#94A3B8] text-xl font-semibold">Never</span>;
        return (
          <div className="flex flex-col">
            <span className={status === "SUCCESS" ? "text-[#059669] text-xl font-bold" : "text-[#DC2626] text-xl font-bold"}>
              {status || "RUN"}
            </span>
            <span className="text-[#94A3B8] text-base font-medium">
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
        const action = String(row.original.submit_action || "email").toLowerCase();
        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className={`h-9 px-3.5 text-lg font-bold ${
                action === "dms"
                  ? "text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                  : "text-[#2563EB] hover:text-[#1D4ED8] hover:bg-[#EFF6FF] dark:hover:bg-[#172554]"
              }`}
              onClick={() => {
                if (action === "dms") {
                  handleRunDms(row.original.shortcut_name);
                } else {
                  handleRunEmail(row.original.shortcut_name);
                }
              }}
              title={action === "dms" ? "Trigger DMS Sync now" : "Trigger Email Automation now"}
            >
              <Play className="w-4 h-4 mr-1.5 fill-current" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-9 px-3.5 text-lg font-bold"
              onClick={() => handleEdit(row.original)}
              title="Edit configuration"
            >
              <Edit2 className="w-4 h-4 mr-1.5" /> 
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-9 px-3.5 text-lg font-bold text-[#DC2626] hover:text-[#B91C1C] hover:bg-[#FEF2F2] dark:hover:bg-[#450A0A]"
              onClick={() => handleDelete(row.original.id)}
              title="Delete configuration"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="grid grid-cols-12 gap-4 pb-12">
      {/* ── 1. HEADER (Employee_Master_Data_Import Reference Style) ── */}
      <div className="col-span-12">
        <div className="rounded-t bg-header dark:bg-black px-2 md:px-6 py-2.5 border dark:border-borderColor-dark">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-7 h-7 text-white dark:text-[#37a9dd]" />
              <div>
                <h1 className="font-bold sm:text-sm md:text-lg lg:text-xl text-white dark:text-[#37a9dd] flex items-center gap-x-2 uppercase tracking-wide">
                  Autovyn RPA Master Hub & Schedulers
                </h1>
                <p className="text-lg text-[#E2E8F0] dark:text-[#94A3B8]">
                  VYNFINANCE Remote Desktop Credential Vault & Automated Schedulers
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* CREATE BUTTON OPENS MODAL */}
              <Button
                variant="save"
                className="font-semibold text-md h-10 flex items-center gap-1.5 shadow"
                onClick={openCreateModal}
              >
                Create
              </Button>

              <Button
                variant="save"
                className="font-semibold text-lg h-10 flex items-center gap-1.5 shadow bg-[#059669] hover:bg-[#047857]"
                onClick={handleRunAll}
              >
                Run Master Schedulers
              </Button>

              <Button
                variant="print"
                className="text-md h-10"
                onClick={() => window.history.back()}
              >
                Back
              </Button>
            </div>
          </div>
        </div>

        {/* Status Count Ribbon */}
        <div className="mt-0 rounded-b p-2 md:p-4 bg-white dark:bg-black border border-borderColor dark:border-borderColor-dark shadow flex flex-wrap items-center justify-between gap-4 font-bold text-lg">
          <div className="flex flex-wrap items-center gap-4">
            <div className="text-save flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#059669]" />
              <span>Active Servers :- {servers.filter((s) => s.is_active).length}</span>
            </div>
            <div className="text-exit flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-[#DC2626]" />
              <span>Inactive Servers :- {servers.filter((s) => !s.is_active).length}</span>
            </div>
            <div className="text-primary flex items-center gap-1.5">
              <Server className="w-4 h-4 text-[#2563EB]" />
              <span>Total Servers :- {servers.length}</span>
            </div>

            {/* Schedulers Live Status Badges */}
            <div className="hidden xl:flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-800 text-sm font-semibold">
              <span className="text-xs uppercase text-gray-500 tracking-wider">Cron Jobs:</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border transition ${
                  schedulersConfig.dmsActive
                    ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800"
                    : "bg-gray-100 text-gray-400 border-gray-200 dark:bg-gray-900 dark:text-gray-500"
                }`}
              >
                DMS: {schedulersConfig.dmsActive ? "ACTIVE (ON)" : "PAUSED (OFF)"}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border transition ${
                  schedulersConfig.emailActive
                    ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800"
                    : "bg-gray-100 text-gray-400 border-gray-200 dark:bg-gray-900 dark:text-gray-500"
                }`}
              >
                Email: {schedulersConfig.emailActive ? "ACTIVE (ON)" : "PAUSED (OFF)"}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border transition ${
                  schedulersConfig.attendanceActive
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                    : "bg-gray-100 text-gray-400 border-gray-200 dark:bg-gray-900 dark:text-gray-500"
                }`}
              >
                Attendance: {schedulersConfig.attendanceActive ? "ACTIVE (ON)" : "PAUSED (OFF)"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="lg"
              variant="outline"
              className="h-10 flex items-center gap-1"
              onClick={() => {
                fetchServers();
                fetchSchedulersConfig();
              }}
            >
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh Table
            </Button>
          </div>
        </div>
      </div>

      {/* ── 2. AUTOMATION SCHEDULERS MASTER TABLE (Row-level Active/Inactive Provisions) ── */}
      <div className="col-span-12">
        <div className="rounded-t p-3 bg-white dark:bg-black border border-b-0 border-borderColor dark:border-borderColor-dark flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <MediumTitle text="RPA Automated Schedulers Master Registry" />
            <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-0.5 rounded font-bold">
              Total 3 Schedulers
            </span>
          </div>

          {/* Quick Date Range Filter for On-Demand Runs */}
          <div className="flex items-center gap-2 flex-wrap text-sm">
            <span className="text-xs text-gray-500 font-semibold">Test Run Date Range:</span>
            <input
              type="date"
              value={schedulerParams.emailDateFrom}
              onChange={(e) => handleSchedulerChange("emailDateFrom", e.target.value)}
              className="h-8 text-xs px-2 border rounded bg-white dark:bg-black border-borderColor dark:border-borderColor-dark"
              title="Date From for manual runs"
            />
            <span className="text-xs text-gray-400">to</span>
            <input
              type="date"
              value={schedulerParams.emailDateUpto}
              onChange={(e) => handleSchedulerChange("emailDateUpto", e.target.value)}
              className="h-8 text-xs px-2 border rounded bg-white dark:bg-black border-borderColor dark:border-borderColor-dark"
              title="Date Upto for manual runs"
            />
          </div>
        </div>

        <div className="rounded-b overflow-hidden bg-white dark:bg-black border border-borderColor dark:border-borderColor-dark shadow">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-header dark:bg-black text-white dark:text-[#37a9dd] text-sm md:text-base font-bold border-b border-borderColor dark:border-borderColor-dark">
                  <th className="p-3 text-center w-12">#</th>
                  <th className="p-3">Scheduler / Task Name</th>
                  <th className="p-3">Automation Flow Details</th>
                  <th className="p-3">Daily Cron Schedule</th>
                  <th className="p-3">Target Scope</th>
                  <th className="p-3 text-center">Scheduler Status</th>
                  <th className="p-3 text-center">Active / Inactive Control</th>
                  <th className="p-3 text-center">Manual Trigger</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderColor dark:divide-borderColor-dark text-sm md:text-base">
                {/* ROW 1: DMS Sync Schedular */}
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition">
                  <td className="p-3 text-center font-bold text-gray-500">1</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                        <Database className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-base text-gray-900 dark:text-white">
                          DMS Sync Schedular
                        </div>
                        <div className="text-xs text-purple-600 dark:text-purple-400 font-semibold uppercase">
                          Action: DMS (Batch + Chrome + DMSYNC)
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-xs md:text-sm text-gray-600 dark:text-gray-300 max-w-xs">
                    Full Desktop &rarr; Launch DMS cmd &rarr; Wait 120s &rarr; Open Chrome getMasterData &rarr; Click Fin Data Scheduler &rarr; Run DMSYNC
                  </td>
                  <td className="p-3 font-mono text-sm">
                    <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300 font-semibold">
                      <Clock className="w-4 h-4" />
                      <span>12:05 PM, 08:30 AM</span>
                    </div>
                    <span className="text-[11px] text-gray-400 block">Runs daily automatically</span>
                  </td>
                  <td className="p-3">
                    <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      Active DMS Servers ({servers.filter(s => (s.submit_action || '').toLowerCase() === 'dms' && s.is_active).length})
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        schedulersConfig.dmsActive
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300"
                          : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${schedulersConfig.dmsActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                      {schedulersConfig.dmsActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isTogglingScheduler === "dms"}
                      onClick={() => handleToggleSchedulerActive("dms")}
                      className={`h-9 px-4 text-sm font-bold rounded-full flex items-center justify-center gap-2 mx-auto transition shadow-sm ${
                        schedulersConfig.dmsActive
                          ? "bg-[#DCFCE7] text-[#166534] dark:bg-[#052E16]/80 dark:text-[#86EFAC] border-[#86EFAC] hover:bg-[#BBF7D0]"
                          : "bg-[#FEE2E2] text-[#991B1B] dark:bg-[#450A0A]/80 dark:text-[#FCA5A5] border-[#FCA5A5] hover:bg-[#FECACA]"
                      }`}
                      title={schedulersConfig.dmsActive ? "Click to Deactivate DMS Schedular" : "Click to Activate DMS Schedular"}
                    >
                      <Power className={`w-4 h-4 ${schedulersConfig.dmsActive ? "text-emerald-600" : "text-rose-600"}`} />
                      <span>{schedulersConfig.dmsActive ? "Active (ON)" : "Inactive (OFF)"}</span>
                    </Button>
                  </td>
                  <td className="p-3 text-center">
                    <Button
                      size="sm"
                      variant="save"
                      onClick={() => handleRunDms()}
                      className="h-9 px-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm flex items-center gap-1.5 mx-auto shadow"
                      title="Run DMS Schedular right now"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> Run Now
                    </Button>
                  </td>
                </tr>

                {/* ROW 2: VYNFINANCE Email Schedular */}
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition">
                  <td className="p-3 text-center font-bold text-gray-500">2</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-base text-gray-900 dark:text-white">
                          VYNFINANCE Email Schedular
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase">
                          Action: Email (RemoteApp + Reports)
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-xs md:text-sm text-gray-600 dark:text-gray-300 max-w-xs">
                    RemoteApp &rarr; Login PC &rarr; Export 5 Vehicle Reports &rarr; Merge into Master Workbook &rarr; Dispatch Email
                  </td>
                  <td className="p-3 font-mono text-sm">
                    <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300 font-semibold">
                      <Clock className="w-4 h-4" />
                      <span>12:15 PM, 08:00 AM</span>
                    </div>
                    <span className="text-[11px] text-gray-400 block">Runs daily automatically</span>
                  </td>
                  <td className="p-3">
                    <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      Active Email Servers ({servers.filter(s => (s.submit_action || '').toLowerCase() === 'email' && s.is_active).length})
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        schedulersConfig.emailActive
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300"
                          : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${schedulersConfig.emailActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                      {schedulersConfig.emailActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isTogglingScheduler === "email"}
                      onClick={() => handleToggleSchedulerActive("email")}
                      className={`h-9 px-4 text-sm font-bold rounded-full flex items-center justify-center gap-2 mx-auto transition shadow-sm ${
                        schedulersConfig.emailActive
                          ? "bg-[#DCFCE7] text-[#166534] dark:bg-[#052E16]/80 dark:text-[#86EFAC] border-[#86EFAC] hover:bg-[#BBF7D0]"
                          : "bg-[#FEE2E2] text-[#991B1B] dark:bg-[#450A0A]/80 dark:text-[#FCA5A5] border-[#FCA5A5] hover:bg-[#FECACA]"
                      }`}
                      title={schedulersConfig.emailActive ? "Click to Deactivate Email Schedular" : "Click to Activate Email Schedular"}
                    >
                      <Power className={`w-4 h-4 ${schedulersConfig.emailActive ? "text-emerald-600" : "text-rose-600"}`} />
                      <span>{schedulersConfig.emailActive ? "Active (ON)" : "Inactive (OFF)"}</span>
                    </Button>
                  </td>
                  <td className="p-3 text-center">
                    <Button
                      size="sm"
                      variant="save"
                      onClick={() => handleRunEmail()}
                      className="h-9 px-3.5 font-bold text-sm flex items-center gap-1.5 mx-auto shadow"
                      title="Run Email Schedular right now"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> Run Now
                    </Button>
                  </td>
                </tr>

                {/* ROW 3: Attendance Report Download */}
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition">
                  <td className="p-3 text-center font-bold text-gray-500">3</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                        <Download className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-base text-gray-900 dark:text-white">
                          Attendance Report Download
                        </div>
                        <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase">
                          Action: Attendance (ERP Payroll)
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-xs md:text-sm text-gray-600 dark:text-gray-300 max-w-xs">
                    Automated ERP Payroll login &rarr; Fetch biometrics & daily attendance logs &rarr; Save to server archive
                  </td>
                  <td className="p-3 font-mono text-sm">
                    <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-semibold">
                      <Clock className="w-4 h-4" />
                      <span>12:15 PM, 08:00 AM</span>
                    </div>
                    <span className="text-[11px] text-gray-400 block">Runs daily automatically</span>
                  </td>
                  <td className="p-3">
                    <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      All Connected Dealerships
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        schedulersConfig.attendanceActive
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300"
                          : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${schedulersConfig.attendanceActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                      {schedulersConfig.attendanceActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isTogglingScheduler === "attendance"}
                      onClick={() => handleToggleSchedulerActive("attendance")}
                      className={`h-9 px-4 text-sm font-bold rounded-full flex items-center justify-center gap-2 mx-auto transition shadow-sm ${
                        schedulersConfig.attendanceActive
                          ? "bg-[#DCFCE7] text-[#166534] dark:bg-[#052E16]/80 dark:text-[#86EFAC] border-[#86EFAC] hover:bg-[#BBF7D0]"
                          : "bg-[#FEE2E2] text-[#991B1B] dark:bg-[#450A0A]/80 dark:text-[#FCA5A5] border-[#FCA5A5] hover:bg-[#FECACA]"
                      }`}
                      title={schedulersConfig.attendanceActive ? "Click to Deactivate Attendance Schedular" : "Click to Activate Attendance Schedular"}
                    >
                      <Power className={`w-4 h-4 ${schedulersConfig.attendanceActive ? "text-emerald-600" : "text-rose-600"}`} />
                      <span>{schedulersConfig.attendanceActive ? "Active (ON)" : "Inactive (OFF)"}</span>
                    </Button>
                  </td>
                  <td className="p-3 text-center">
                    <Button
                      size="sm"
                      variant="save"
                      onClick={handleRunAttendance}
                      className="h-9 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center gap-1.5 mx-auto shadow"
                      title="Download Attendance Report right now"
                    >
                      <Download className="w-3.5 h-3.5" /> Run Now
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── 3. CONFIGURED SERVERS VAULT TABLE (Using DataTable Component) ── */}
      <div className="col-span-12">
        <div className="rounded-t p-3 bg-white dark:bg-black border border-b-0 border-borderColor dark:border-borderColor-dark flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA]" />
            <MediumTitle text={`Saved Server Vault Registry (${servers.length})`} />
          </div>
          <Button
            variant="save"
            size="sm"
            className="text-xs h-7 flex items-center gap-1"
            onClick={openCreateModal}
          >
            <Plus className="w-3.5 h-3.5" /> Add New Server
          </Button>
        </div>

        <div className="rounded-b p-2 md:p-4 bg-white dark:bg-black border border-borderColor dark:border-borderColor-dark shadow">
          <DataTable
            columns={serverColumns}
            selectValue="id"
            data={servers}
            height="320px"
            size="text-lg"
            headerClassName="text-lg font-bold"
            labelClassName="text-lg font-semibold"
            filterPosition="FilterData"
            numericFilterColumns={[]}
          />
        </div>
      </div>

  

      {/* ── 5. CREATE / EDIT SERVER VAULT MODAL (Dialog) ── */}
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
                  placeholder="e.g. Suwalka Motors (ICM Register)"
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
                  placeholder="e.g. Suwalka Motors Start-up.rdp"
                />
                {/* <span className="text-[15px] text-[#94A3B8] -mt-1 block">Present in D:\ERP\shortcuts\ or Desktop</span> */}
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
                  placeholder="e.g. 103.74.65.35:4638"
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

              {/* Submit Action */}
              <div className="w-full">
                <SelectSearch
                  title="RemoteApp Submit Action"
                  className="text-lg px-2 h-10 "
                  labelClass="text-lg"
                  name="submit_action"
                  selectedValue={formData.submit_action}
                  handleInputChange={handleInputChange}
                  options={[
                    { value: "dms", label: "DMS Sync (Batch + Chrome getMasterData + DMSYNC)" },
                    { value: "email", label: "Click 'Email' Button (VYNFINANCE Auto Dispatch)" },
                    { value: "ok", label: "Click 'OK' Button (PrintView / Export)" },
                  ]}
                />
              </div>

              {/* Date Filter Mode */}
              <div className="w-full">
                <SelectSearch
                  title="Date Filter Mode"
                  className="text-lg px-2 h-10 "
                  labelClass="text-lg"
                  name="date_range_mode"
                  selectedValue={formData.date_range_mode}
                  handleInputChange={handleInputChange}
                  options={[
                    { value: "month_till_date", label: "Month Till Date (01/MM/YY to Today)" },
                    { value: "today", label: "Today Only (Current Date)" },
                    { value: "custom", label: "Custom Specified Date Range" },
                  ]}
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

            <div className="mt-4 pt-3 border-t border-borderColor dark:border-borderColor-dark flex items-center justify-between flex-wrap gap-3">
              <Acheckbox
                name="is_active"
                label="Enable Server for Schedulers (Active)"
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

      {/* HashloaderComponent from Templates */}
      <HashloaderComponent isLoading={isLoading} />
    </div>
  );
}
