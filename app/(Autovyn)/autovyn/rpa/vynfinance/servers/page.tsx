"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import Swal from "sweetalert2";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import {
  Server,
  Shield,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Key,
  FolderSearch,
  Lock,
  User,
  Settings,
  Sparkles,
  RefreshCw,
  Zap,
  Activity,
  Layers,
  Copy,
  Check,
  Play,
  Monitor,
  ExternalLink,
  ChevronRight,
  ShieldCheck
} from "lucide-react";

interface ServerConfig {
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

export default function VynfinanceServersVaultPage() {
  const user = useCurrentUser();
  const defaultCompCode = user?.Comp_Code || "devteam";
  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:5000";

  const [servers, setServers] = useState<ServerConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form State
  const [serverName, setServerName] = useState("");
  const [shortcutName, setShortcutName] = useState("AUTOVYN-STARTUP.rdp");
  const [serverIp, setServerIp] = useState("103.74.65.35");
  const [rdpUsername, setRdpUsername] = useState("atendra");
  const [rdpPassword, setRdpPassword] = useState("");
  const [appUsername, setAppUsername] = useState("admin");
  const [appPassword, setAppPassword] = useState("");
  const [submitAction, setSubmitAction] = useState("email");
  const [dateRangeMode, setDateRangeMode] = useState("month_till_date");
  const [executionOrder, setExecutionOrder] = useState<number>(1);
  const [isActive, setIsActive] = useState<boolean>(true);

  // Password visibility & UI helpers
  const [showRdpPass, setShowRdpPass] = useState(false);
  const [showAppPass, setShowAppPass] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState<{ [id: number]: boolean }>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchServers = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${baseUrl}/api/rpa/vynfinance/servers`, {
        headers: { compcode: defaultCompCode },
      });
      if (res.data?.success) {
        setServers(res.data.servers || []);
      }
    } catch (err: any) {
      console.warn("Error fetching servers:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
  }, [defaultCompCode]);

  const resetForm = () => {
    setServerName("");
    setShortcutName("AUTOVYN-STARTUP.rdp");
    setServerIp("103.74.65.35");
    setRdpUsername("atendra");
    setRdpPassword("");
    setAppUsername("admin");
    setAppPassword("");
    setSubmitAction("email");
    setDateRangeMode("month_till_date");
    setExecutionOrder(servers.length + 1);
    setIsActive(true);
    setIsEditing(false);
    setEditingId(null);
    setShowRdpPass(false);
    setShowAppPass(false);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const applyPreset = (presetNumber: 1 | 2) => {
    if (presetNumber === 1) {
      setServerName("Rana motors Startup (Mail)");
      setShortcutName("Rana motors Startup.rdp");
      setServerIp("103.74.65.30");
      setRdpUsername("atendra");
      setAppUsername("admin");
      setSubmitAction("email");
      setExecutionOrder(1);
    } else {
      setServerName("Suwalka Motors Start-up (Outstanding Dr.)");
      setShortcutName("Suwalka Motors Start-up.rdp");
      setServerIp("103.74.65.35");
      setRdpUsername("atendra");
      setAppUsername("admin");
      setSubmitAction("ok");
      setExecutionOrder(2);
    }
  };

  const handleOpenEdit = (srv: ServerConfig) => {
    setEditingId(srv.id);
    setIsEditing(true);
    setServerName(srv.server_name || "");
    setShortcutName(srv.shortcut_name || "");
    setServerIp(srv.server_ip || "");
    setRdpUsername(srv.rdp_username || "");
    setRdpPassword(srv.rdp_password || "");
    setAppUsername(srv.app_username || "");
    setAppPassword(srv.app_password || "");
    setSubmitAction(srv.submit_action || "email");
    setDateRangeMode(srv.date_range_mode || "month_till_date");
    setExecutionOrder(srv.execution_order || 1);
    setIsActive(Boolean(srv.is_active));
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverName.trim() || !shortcutName.trim()) {
      Swal.fire("Missing Information", "Server Name and Shortcut File Name are required.", "warning");
      return;
    }

    try {
      const payload = {
        server_name: serverName.trim(),
        shortcut_name: shortcutName.trim(),
        server_ip: serverIp.trim(),
        rdp_username: rdpUsername.trim(),
        rdp_password: rdpPassword,
        app_username: appUsername.trim(),
        app_password: appPassword,
        submit_action: submitAction,
        date_range_mode: dateRangeMode,
        execution_order: executionOrder,
        is_active: isActive,
      };

      if (isEditing && editingId) {
        await axios.put(`${baseUrl}/api/rpa/vynfinance/servers/${editingId}`, payload, {
          headers: { compcode: defaultCompCode },
        });
        Swal.fire("Updated", "Server credentials updated successfully.", "success");
      } else {
        await axios.post(`${baseUrl}/api/rpa/vynfinance/servers`, payload, {
          headers: { compcode: defaultCompCode },
        });
        Swal.fire("Saved", "New Server configuration added to vault.", "success");
      }

      setShowModal(false);
      resetForm();
      fetchServers();
    } catch (err: any) {
      Swal.fire("Error", err.response?.data?.error || err.message, "error");
    }
  };

  const handleDelete = async (id: number, name: string) => {
    const confirm = await Swal.fire({
      title: "Delete Server?",
      text: `Are you sure you want to remove '${name}' from credentials vault?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#64748B",
      confirmButtonText: "Yes, Delete",
    });

    if (confirm.isConfirmed) {
      try {
        await axios.delete(`${baseUrl}/api/rpa/vynfinance/servers/${id}`, {
          headers: { compcode: defaultCompCode },
        });
        Swal.fire("Deleted", "Server removed successfully.", "success");
        fetchServers();
      } catch (err: any) {
        Swal.fire("Error", err.response?.data?.error || err.message, "error");
      }
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await axios.post(`${baseUrl}/api/rpa/vynfinance/servers/${id}/toggle`, {}, {
        headers: { compcode: defaultCompCode },
      });
      fetchServers();
    } catch (err: any) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const togglePasswordVisibility = (id: number) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activeCount = servers.filter((s) => s.is_active).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] p-4 md:p-8 text-[#0F172A] dark:text-[#FFFFFF]">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header & Navigation Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E2E8F0] dark:border-[#1E293B]">
          <div className="flex items-center gap-3">
            <Link
              href="/autovyn/rpa/vynfinance"
              className="p-3 bg-[#FFFFFF] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] rounded-2xl text-[#2563EB] dark:text-[#60A5FA] shadow-sm transition"
              title="Back to Automation Hub"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#0F172A] dark:text-[#FFFFFF] flex items-center gap-2">
                Server Credentials Vault
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] dark:bg-[#1E3A8A]/40 dark:text-[#93C5FD] font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
                  Multi-Server Hub
                </span>
              </h1>
              <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                Configure distinct RemoteApp shortcuts, distinct passwords & sequential execution order for Daily Schedular
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
              className="px-3.5 py-1.5 text-xs font-medium rounded-lg text-[#475569] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#FFFFFF] transition"
            >
              AUTOVYN RPA
            </Link>
            <Link
              href="/autovyn/rpa/vynfinance/servers"
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#FFFFFF] dark:bg-[#1E293B] text-[#2563EB] dark:text-[#60A5FA] shadow-sm transition flex items-center gap-1.5"
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

        {/* 4-Column Quick Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#FFFFFF] dark:bg-[#0F172A] rounded-2xl border border-[#E2E8F0] dark:border-[#1E293B] p-4 flex items-center gap-3 shadow-sm">
            <div className="p-2.5 rounded-xl bg-[#EFF6FF] dark:bg-[#1E3A8A]/40 text-[#2563EB] dark:text-[#93C5FD]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                Configured Servers
              </p>
              <p className="text-base font-bold text-[#0F172A] dark:text-[#FFFFFF]">
                {servers.length} <span className="text-xs text-[#94A3B8] font-normal">RemoteApp Targets</span>
              </p>
            </div>
          </div>

          <div className="bg-[#FFFFFF] dark:bg-[#0F172A] rounded-2xl border border-[#E2E8F0] dark:border-[#1E293B] p-4 flex items-center gap-3 shadow-sm">
            <div className="p-2.5 rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B]/40 text-[#10B981] dark:text-[#6EE7B7]">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                Daily 8 AM Schedular
              </p>
              <p className="text-base font-bold text-[#0F172A] dark:text-[#FFFFFF]">
                {activeCount} <span className="text-xs text-[#10B981] font-semibold">Active in Queue</span>
              </p>
            </div>
          </div>

          <div className="bg-[#FFFFFF] dark:bg-[#0F172A] rounded-2xl border border-[#E2E8F0] dark:border-[#1E293B] p-4 flex items-center gap-3 shadow-sm">
            <div className="p-2.5 rounded-xl bg-[#F5F3FF] dark:bg-[#4C1D95]/40 text-[#8B5CF6] dark:text-[#C4B5FD]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                Execution Flow
              </p>
              <p className="text-base font-bold text-[#0F172A] dark:text-[#FFFFFF]">
                Sequential Queue <span className="text-xs text-[#8B5CF6] font-normal">(1 &rarr; 2)</span>
              </p>
            </div>
          </div>

          <div className="bg-[#FFFFFF] dark:bg-[#0F172A] rounded-2xl border border-[#E2E8F0] dark:border-[#1E293B] p-4 flex items-center gap-3 shadow-sm">
            <div className="p-2.5 rounded-xl bg-[#FFFBEB] dark:bg-[#78350F]/40 text-[#F59E0B] dark:text-[#FCD34D]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                Vault Protection
              </p>
              <p className="text-base font-bold text-[#0F172A] dark:text-[#FFFFFF]">
                Dedicated DB Storage
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-[#FFFFFF] dark:bg-[#0F172A] rounded-3xl border border-[#E2E8F0] dark:border-[#1E293B] p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2E8F0] dark:border-[#1E293B]">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-[#2563EB]" />
              <div>
                <h2 className="text-base font-bold text-[#0F172A] dark:text-[#FFFFFF]">
                  Configured Desktop Shortcuts & Passwords
                </h2>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                  Automated sequence executes sequentially in order of Priority (#1 then #2)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={fetchServers}
                variant="outline"
                size="sm"
                className="rounded-xl border-[#CBD5E1] dark:border-[#334155] text-xs gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </Button>
              <Button
                onClick={handleOpenAdd}
                size="sm"
                className="rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add New Server
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="py-16 text-center space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin text-[#2563EB] mx-auto" />
              <p className="text-sm text-[#64748B]">Loading server credentials from database...</p>
            </div>
          ) : servers.length === 0 ? (
            <div className="py-16 text-center space-y-4 max-w-md mx-auto">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#EFF6FF] dark:bg-[#1E3A8A]/30 text-[#2563EB] flex items-center justify-center shadow-inner">
                <Server className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#0F172A] dark:text-[#FFFFFF]">
                  No Server Configurations Found
                </h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                  Click below to add your 2 desktop shortcuts (<code>AUTOVYN-STARTUP.rdp</code> and <code>AUTOVYN-STARTUP1.rdp</code>) and configure their respective passwords.
                </p>
              </div>
              <div className="pt-2 flex justify-center gap-2">
                <Button
                  onClick={handleOpenAdd}
                  className="rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Add First Server
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {servers.map((srv) => {
                const isRevealed = Boolean(revealedPasswords[srv.id]);
                const isItemActive = Boolean(srv.is_active);

                return (
                  <div
                    key={srv.id}
                    className={`rounded-2xl border transition-all duration-200 relative p-5 space-y-4 shadow-sm hover:shadow-md ${
                      isItemActive
                        ? "border-[#E2E8F0] dark:border-[#1E293B] bg-[#FAFAFA] dark:bg-[#0B1120] hover:border-[#2563EB]/40"
                        : "border-[#E2E8F0] dark:border-[#1E293B]/60 bg-[#F1F5F9]/50 dark:bg-[#020617] opacity-80"
                    }`}
                  >
                    {/* Top Bar of Card */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-[#2563EB] text-white font-bold text-xs flex items-center justify-center shadow-sm">
                          #{srv.execution_order || srv.id}
                        </span>
                        <div>
                          <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#FFFFFF]">
                            {srv.server_name}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-[#64748B] dark:text-[#94A3B8] font-mono">
                              {srv.shortcut_name}
                            </span>
                            {srv.server_ip && (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#EFF6FF] dark:bg-[#1E3A8A]/30 text-[#2563EB] dark:text-[#93C5FD] font-mono font-medium">
                                {srv.server_ip}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggle(srv.id)}
                          className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg transition ${
                            isItemActive
                              ? "bg-[#ECFDF5] text-[#10B981] dark:bg-[#064E3B]/40 dark:text-[#6EE7B7]"
                              : "bg-[#F1F5F9] text-[#64748B] dark:bg-[#1E293B] dark:text-[#94A3B8]"
                          }`}
                        >
                          {isItemActive ? "Active" : "Paused"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(srv)}
                          className="p-1.5 rounded-lg hover:bg-[#E2E8F0] dark:hover:bg-[#1E293B] text-[#64748B] transition"
                          title="Edit Configuration"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(srv.id, srv.server_name)}
                          className="p-1.5 rounded-lg hover:bg-[#FEE2E2] dark:hover:bg-[#7F1D1D]/30 text-[#EF4444] transition"
                          title="Delete Configuration"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Dual Credential Pods */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {/* Pod 1: RemoteApp / Windows Security */}
                      <div className="bg-[#FFFFFF] dark:bg-[#0F172A] rounded-xl p-3 border border-[#E2E8F0] dark:border-[#1E293B] space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-[#2563EB] flex items-center gap-1">
                            <Monitor className="w-3 h-3" />
                            Windows RemoteApp
                          </span>
                          <span className="text-[10px] text-[#94A3B8]">user@123 prompt</span>
                        </div>
                        <div className="space-y-0.5 font-mono text-[11px]">
                          <div className="flex justify-between text-[#64748B]">
                            <span>User:</span>
                            <span className="font-semibold text-[#0F172A] dark:text-white">
                              {srv.rdp_username || "—"}
                            </span>
                          </div>
                          <div className="flex justify-between text-[#64748B]">
                            <span>Pass:</span>
                            <span className="font-semibold text-[#2563EB]">
                              {isRevealed ? srv.rdp_password || "None" : "••••••••"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Pod 2: ERP Accounts Module Login */}
                      <div className="bg-[#FFFFFF] dark:bg-[#0F172A] rounded-xl p-3 border border-[#E2E8F0] dark:border-[#1E293B] space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-[#10B981] flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            ERP Accounts Login
                          </span>
                          <span className="text-[10px] text-[#94A3B8]">admin screen</span>
                        </div>
                        <div className="space-y-0.5 font-mono text-[11px]">
                          <div className="flex justify-between text-[#64748B]">
                            <span>User:</span>
                            <span className="font-semibold text-[#0F172A] dark:text-white">
                              {srv.app_username || "—"}
                            </span>
                          </div>
                          <div className="flex justify-between text-[#64748B]">
                            <span>Pass:</span>
                            <span className="font-semibold text-[#10B981]">
                              {isRevealed ? srv.app_password || "None" : "••••••••"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Info & Quick Actions */}
                    <div className="flex items-center justify-between pt-1 border-t border-[#E2E8F0]/60 dark:border-[#1E293B]/60 text-xs">
                      <div className="flex items-center gap-1.5 text-[11px] text-[#64748B]">
                        <Clock className="w-3.5 h-3.5 text-[#94A3B8]" />
                        <span>
                          Last Run: {srv.last_run_at ? new Date(srv.last_run_at).toLocaleString("en-IN") : "Never run yet"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(srv.id)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-[#2563EB] hover:underline"
                        >
                          {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          {isRevealed ? "Hide" : "Reveal Passwords"}
                        </button>
                        <Link
                          href={`/autovyn/rpa/vynfinance`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-[#EFF6FF] dark:bg-[#1E3A8A]/30 text-[#2563EB] dark:text-[#93C5FD] hover:bg-[#DBEAFE] transition"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          Launch
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal Dialog: Add / Edit Server */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#FFFFFF] dark:bg-[#0F172A] w-full max-w-lg rounded-3xl border border-[#E2E8F0] dark:border-[#1E293B] shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-[#1E293B]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#EFF6FF] dark:bg-[#1E3A8A]/40 text-[#2563EB]">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0F172A] dark:text-white">
                    {isEditing ? "Edit Server Credentials" : "Add Desktop Server Configuration"}
                  </h3>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                    Save distinct connection host, RemoteApp &amp; ERP passwords
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] text-[#64748B]"
              >
                ✕
              </button>
            </div>

            {/* Quick Presets (Only when adding new) */}
            {!isEditing && (
              <div className="p-3 rounded-2xl bg-[#F8FAFC] dark:bg-[#020617] border border-[#E2E8F0] dark:border-[#1E293B] space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                  ⚡ Quick Auto-Fill Presets:
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => applyPreset(1)}
                    className="flex-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#334155] hover:border-[#2563EB] text-[#2563EB] transition text-center"
                  >
                    Server 1 (103.74.65.35)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset(2)}
                    className="flex-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#334155] hover:border-[#8B5CF6] text-[#8B5CF6] transition text-center"
                  >
                    Server 2 (103.74.65.30)
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-[#475569] dark:text-[#94A3B8] block mb-1">
                    Server Name / Label *
                  </label>
                  <input
                    type="text"
                    required
                    value={serverName}
                    onChange={(e) => setServerName(e.target.value)}
                    placeholder="e.g. Server 1 - Main Branch"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-[#CBD5E1] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#020617] text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#475569] dark:text-[#94A3B8] block mb-1">
                      Shortcut File Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={shortcutName}
                      onChange={(e) => setShortcutName(e.target.value)}
                      placeholder="AUTOVYN-STARTUP.rdp"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-[#CBD5E1] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#020617] text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#475569] dark:text-[#94A3B8] block mb-1">
                      Server Host / IP
                    </label>
                    <input
                      type="text"
                      value={serverIp}
                      onChange={(e) => setServerIp(e.target.value)}
                      placeholder="103.74.65.35"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-[#CBD5E1] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#020617] text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>
                </div>
              </div>

              {/* RDP Windows Security Credentials */}
              <div className="p-3.5 rounded-2xl bg-[#F8FAFC] dark:bg-[#020617] border border-[#E2E8F0] dark:border-[#1E293B] space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#2563EB] block">
                  1. Windows Security / RemoteApp Credentials
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-[#64748B] block mb-1">
                      RemoteApp User
                    </label>
                    <input
                      type="text"
                      value={rdpUsername}
                      onChange={(e) => setRdpUsername(e.target.value)}
                      placeholder="atendra"
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#64748B] block mb-1">
                      RemoteApp Password
                    </label>
                    <div className="relative">
                      <input
                        type={showRdpPass ? "text" : "password"}
                        value={rdpPassword}
                        onChange={(e) => setRdpPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pr-8 px-3 py-1.5 text-sm rounded-lg border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRdpPass(!showRdpPass)}
                        className="absolute right-2 top-2 text-[#94A3B8] hover:text-[#0F172A]"
                      >
                        {showRdpPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ERP Application Credentials */}
              <div className="p-3.5 rounded-2xl bg-[#F8FAFC] dark:bg-[#020617] border border-[#E2E8F0] dark:border-[#1E293B] space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#10B981] block">
                  2. ERP Accounts Module Login Credentials
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-[#64748B] block mb-1">
                      ERP Login Username
                    </label>
                    <input
                      type="text"
                      value={appUsername}
                      onChange={(e) => setAppUsername(e.target.value)}
                      placeholder="admin"
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#64748B] block mb-1">
                      ERP Login Password
                    </label>
                    <div className="relative">
                      <input
                        type={showAppPass ? "text" : "password"}
                        value={appPassword}
                        onChange={(e) => setAppPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pr-8 px-3 py-1.5 text-sm rounded-lg border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAppPass(!showAppPass)}
                        className="absolute right-2 top-2 text-[#94A3B8] hover:text-[#0F172A]"
                      >
                        {showAppPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Execution Order & Active Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#475569] dark:text-[#94A3B8] block mb-1">
                    Execution Priority (Order)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={executionOrder}
                    onChange={(e) => setExecutionOrder(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-[#CBD5E1] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#020617] text-[#0F172A] dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#475569] dark:text-[#94A3B8] block mb-1">
                    Daily Schedular Status
                  </label>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="isActiveToggle"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 text-[#2563EB] rounded cursor-pointer"
                    />
                    <label htmlFor="isActiveToggle" className="text-xs font-medium cursor-pointer">
                      {isActive ? "Active (Included in 8 AM Queue)" : "Paused (Skip)"}
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#E2E8F0] dark:border-[#1E293B]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border-[#CBD5E1] dark:border-[#334155]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-sm"
                >
                  {isEditing ? "Update Credentials" : "Save to Vault"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
