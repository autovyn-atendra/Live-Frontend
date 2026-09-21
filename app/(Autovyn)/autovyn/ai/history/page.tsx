"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  History,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Database,
  User,
  Bot,
  Code2,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Eye,
  X,
  Sparkles,
  Layers,
  ArrowUpDown,
  FileText,
  Activity,
  Calendar,
  ShieldCheck,
  MessageSquare,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_URL;

interface AuditLogRecord {
  UTD: number;
  conversationId?: string;
  userId?: string;
  empCode?: string;
  role?: string;
  compCode?: string;
  userQuery: string;
  normalizedQuery?: string;
  intent?: string;
  tablesUsed?: string;
  generatedSql?: string;
  aiResponse?: string;
  rowsReturned: number;
  executionTimeMs: number;
  confidenceScore: number;
  statusCode: string;
  errorMessage?: string;
  createdAt: string;
}

interface AuditStats {
  totalQueries: number;
  successQueries: number;
  failedQueries: number;
  successRate: string;
  avgExecutionTimeMs: number;
  activeUsersCount: number;
  todayQueriesCount: number;
}

interface PaginationMeta {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
  hasMore: boolean;
}

export default function AIQueryAuditPage() {
  const user = useCurrentUser();

  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [stats, setStats] = useState<AuditStats>({
    totalQueries: 0,
    successQueries: 0,
    failedQueries: 0,
    successRate: "100%",
    avgExecutionTimeMs: 0,
    activeUsersCount: 0,
    todayQueriesCount: 0,
  });
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    totalRecords: 0,
    totalPages: 1,
    hasMore: false,
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedRecord, setSelectedRecord] = useState<AuditLogRecord | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const buildAIHeaders = useCallback(() => {
    const compcode = user?.Comp_Code || user?.compcode || user?.CompCode || user?.branch || "";
    const token = user?.token || user?.email || "";
    const authHeader = token
      ? String(token).startsWith("Bearer ")
        ? String(token)
        : `Bearer ${token}`
      : "";
    return {
      accept: "application/json",
      compcode: String(compcode || ""),
      name: user?.name || user?.userName || "",
      authorization: authHeader,
      "Content-Type": "application/json",
    };
  }, [user]);

  const fetchAuditLogs = useCallback(
    async (pageNumber = 1, currentStatus = statusFilter, currentSearch = searchTerm) => {
      setIsLoading(true);
      try {
        const res = await axios.get(`${BASE_URL}/ai/audit`, {
          headers: buildAIHeaders(),
          params: {
            page: pageNumber,
            limit: pagination.limit,
            search: currentSearch.trim() || undefined,
            status: currentStatus !== "ALL" ? currentStatus : undefined,
          },
        });

        if (res.data?.success) {
          setLogs(res.data.data || []);
          if (res.data.stats) setStats(res.data.stats);
          if (res.data.pagination) setPagination(res.data.pagination);
        }
      } catch (err) {
        console.error("Failed to load AI audit logs:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [buildAIHeaders, pagination.limit, searchTerm, statusFilter]
  );

  // Initial load
  useEffect(() => {
    fetchAuditLogs(1, "ALL", "");
  }, []);

  const handleStatusChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    fetchAuditLogs(1, newStatus, searchTerm);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    fetchAuditLogs(1, statusFilter, searchTerm);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    fetchAuditLogs(1, "ALL", "");
  };

  const handleCopy = (text: string, fieldId: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleExportCSV = () => {
    if (!logs.length) return;
    const headers = [
      "UTD",
      "Date Time",
      "User ID",
      "Emp Code",
      "Role",
      "User Question",
      "Intent",
      "Tables Used",
      "Generated SQL",
      "AI Response",
      "Rows",
      "Latency (ms)",
      "Status",
    ];

    const rows = logs.map((l) => [
      l.UTD,
      `"${new Date(l.createdAt).toLocaleString("en-IN")}"`,
      `"${l.userId || ""}"`,
      `"${l.empCode || ""}"`,
      `"${l.role || ""}"`,
      `"${(l.userQuery || "").replace(/"/g, '""')}"`,
      `"${l.intent || ""}"`,
      `"${l.tablesUsed || ""}"`,
      `"${(l.generatedSql || "").replace(/"/g, '""')}"`,
      `"${(l.aiResponse || "").replace(/"/g, '""')}"`,
      l.rowsReturned || 0,
      l.executionTimeMs || 0,
      l.statusCode,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `autovyn_ai_query_audit_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] text-[#1e293b] dark:text-[#f1f5f9] flex flex-col font-sans">
      {/* ── TOP NAV / HEADER ── */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#1e293b]/95 backdrop-blur border-b border-[#e2e8f0] dark:border-[#334155] px-4 lg:px-8 py-4 shadow-xs">
        <div className="max-w-8xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-[#193A69] via-primary to-[#3b82f6] flex items-center justify-center shadow-md shadow-primary/20 text-white font-bold shrink-0">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#193A69] dark:text-white">
                  AI Query Logs & Audit Dashboard
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[13px] font-bold bg-[#ecfdf5] dark:bg-[#022c22]/50 text-[#047857] dark:text-[#34d399] border border-[#a7f3d0] dark:border-[#065f46] flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#10b981] animate-pulse"></span>
                  Live Monitor
                </span>
              </div>
              <p className="text-[15px] sm:text-[16px] text-[#64748b] dark:text-[#94a3b8] mt-0.5">
                Real-time tracking of all user questions, AI responses, generated SQL queries & latency metrics.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <Link href="/autovyn/ai/ai-assistant">
              <Button
                variant="outline"
                size="sm"
                className="h-10 px-3.5 gap-2 text-[15px] font-bold border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] text-[#193A69] dark:text-white hover:bg-[#f1f5f9] dark:hover:bg-[#334155]"
              >
                <MessageSquare className="h-4 w-4 text-primary" />
                AI Assistant (Chat)
              </Button>
            </Link>
            <Link href="/autovyn/ai/knowledge">
              <Button
                variant="outline"
                size="sm"
                className="h-10 px-3.5 gap-2 text-[15px] font-bold border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] text-[#193A69] dark:text-white hover:bg-[#f1f5f9] dark:hover:bg-[#334155]"
              >
                <Layers className="h-4 w-4 text-indigo-500" />
                Knowledge Base
              </Button>
            </Link>
            <Button
              onClick={() => fetchAuditLogs(pagination.page, statusFilter, searchTerm)}
              variant="input"
              size="sm"
              disabled={isLoading}
              className="h-10 px-4 gap-2 text-[15px] bg-[#193A69] hover:bg-[#152e53] text-white font-bold shadow"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT AREA ── */}
      <main className="flex-1 max-w-8xl w-full mx-auto p-4 lg:p-8 space-y-6">
        {/* ── METRICS / KPI CARDS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-4 sm:p-5 shadow-xs hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-bold text-[#64748b] dark:text-[#94a3b8]">Total Queries</span>
              <div className="h-9 w-9 rounded-lg bg-[#eff6ff] dark:bg-[#1e3a8a]/40 text-[#2563eb] dark:text-[#60a5fa] flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-[#193A69] dark:text-white">
                {stats.totalQueries.toLocaleString()}
              </span>
              <span className="text-[13px] text-[#94a3b8]">lifetime</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-4 sm:p-5 shadow-xs hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-bold text-[#64748b] dark:text-[#94a3b8]">Today&apos;s Queries</span>
              <div className="h-9 w-9 rounded-lg bg-[#eef2ff] dark:bg-[#312e81]/40 text-[#4f46e5] dark:text-[#818cf8] flex items-center justify-center">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-[#193A69] dark:text-white">
                {stats.todayQueriesCount.toLocaleString()}
              </span>
              <span className="text-[13px] text-primary font-bold">today</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-4 sm:p-5 shadow-xs hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-bold text-[#64748b] dark:text-[#94a3b8]">Success Rate</span>
              <div className="h-9 w-9 rounded-lg bg-[#ecfdf5] dark:bg-[#064e3b]/40 text-[#059669] dark:text-[#34d399] flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-[#059669] dark:text-[#34d399]">
                {stats.successRate}
              </span>
              <span className="text-[13px] text-[#94a3b8]">accuracy</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-4 sm:p-5 shadow-xs hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-bold text-[#64748b] dark:text-[#94a3b8]">Avg Latency</span>
              <div className="h-9 w-9 rounded-lg bg-[#fffbeb] dark:bg-[#78350f]/40 text-[#d97706] dark:text-[#fbbf24] flex items-center justify-center">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-[#193A69] dark:text-white">
                {stats.avgExecutionTimeMs} <span className="text-base font-normal text-[#64748b]">ms</span>
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-4 sm:p-5 shadow-xs hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-bold text-[#64748b] dark:text-[#94a3b8]">Active Users</span>
              <div className="h-9 w-9 rounded-lg bg-[#faf5ff] dark:bg-[#581c87]/40 text-[#9333ea] dark:text-[#c084fc] flex items-center justify-center">
                <User className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-[#193A69] dark:text-white">
                {stats.activeUsersCount}
              </span>
              <span className="text-[13px] text-[#94a3b8]">emp / users</span>
            </div>
          </div>
        </div>

        {/* ── CONTROLS & FILTER BAR ── */}
        <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2.5">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#94a3b8]" />
              <Input
                placeholder="Search by question, SQL, employee code, user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 pr-9 h-11 text-[15px] sm:text-[16px] bg-[#f8fafc] dark:bg-[#0f172a] border-[#e2e8f0] dark:border-[#334155] text-[#1e293b] dark:text-white"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    fetchAuditLogs(1, statusFilter, "");
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#1e293b] dark:hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="h-11 px-4 text-[15px] font-bold bg-[#f1f5f9] dark:bg-[#334155] text-[#193A69] dark:text-white hover:bg-[#e2e8f0]"
            >
              Search
            </Button>
            {(searchTerm || statusFilter !== "ALL") && (
              <Button
                type="button"
                onClick={handleResetFilters}
                variant="ghost"
                size="sm"
                className="h-11 px-3 text-[14px] font-bold text-[#64748b] hover:text-rose-600 dark:hover:text-rose-400"
              >
                Reset
              </Button>
            )}
          </form>

          <div className="flex items-center gap-2.5 self-end md:self-auto">
            <div className="flex items-center gap-1 bg-[#f1f5f9] dark:bg-[#0f172a] p-1.5 rounded-lg border border-[#e2e8f0] dark:border-[#334155]">
              <button
                type="button"
                onClick={() => handleStatusChange("ALL")}
                className={`px-3.5 py-1.5 text-[14px] sm:text-[15px] font-bold rounded-md transition-colors ${
                  statusFilter === "ALL"
                    ? "bg-white dark:bg-[#1e293b] text-[#193A69] dark:text-white shadow-xs"
                    : "text-[#64748b] dark:text-[#94a3b8] hover:text-[#1e293b]"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange("SUCCESS")}
                className={`px-3.5 py-1.5 text-[14px] sm:text-[15px] font-bold rounded-md transition-colors ${
                  statusFilter === "SUCCESS"
                    ? "bg-white dark:bg-[#1e293b] text-[#059669] dark:text-[#34d399] shadow-xs"
                    : "text-[#64748b] dark:text-[#94a3b8] hover:text-[#1e293b]"
                }`}
              >
                Success
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange("FAILED")}
                className={`px-3.5 py-1.5 text-[14px] sm:text-[15px] font-bold rounded-md transition-colors ${
                  statusFilter === "FAILED"
                    ? "bg-white dark:bg-[#1e293b] text-[#e11d48] dark:text-[#fda4af] shadow-xs"
                    : "text-[#64748b] dark:text-[#94a3b8] hover:text-[#1e293b]"
                }`}
              >
                Failed
              </button>
            </div>

            <Button
              onClick={handleExportCSV}
              variant="outline"
              size="sm"
              disabled={!logs.length}
              className="h-11 px-4 gap-2 text-[15px] font-bold border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] text-[#475569] dark:text-[#cbd5e1]"
            >
              <Download className="h-4 w-4 text-[#64748b]" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* ── TABLE VIEW ── */}
        <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8fafc] dark:bg-[#0f172a] border-b border-[#e2e8f0] dark:border-[#334155] text-[#64748b] dark:text-[#94a3b8] font-bold text-[15px] uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-14 text-center">#</th>
                  <th className="py-3.5 px-4 min-w-[280px]">User Question / Prompt</th>
                  <th className="py-3.5 px-4 min-w-[240px]">AI Response Preview</th>
                  <th className="py-3.5 px-4 min-w-[150px]">Intent / Module</th>
                  <th className="py-3.5 px-4 min-w-[130px]">User / Emp</th>
                  <th className="py-3.5 px-4 w-24 text-center">Rows</th>
                  <th className="py-3.5 px-4 w-28 text-center">Latency</th>
                  <th className="py-3.5 px-4 w-28 text-center">Status</th>
                  <th className="py-3.5 px-4 min-w-[150px]">Timestamp</th>
                  <th className="py-3.5 px-4 w-24 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9] dark:divide-[#334155]/60 text-[15px] sm:text-base">
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="py-20 text-center text-[#94a3b8] text-lg">
                      <RefreshCw className="h-7 w-7 animate-spin mx-auto mb-3 text-primary" />
                      Loading AI audit logs & history...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-16 text-center text-[#64748b] dark:text-[#94a3b8]">
                      <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-3">
                        <History className="h-12 w-12 text-[#cbd5e1] dark:text-[#475569]" />
                        <div className="font-bold text-lg text-[#1e293b] dark:text-white">
                          No {statusFilter !== "ALL" ? statusFilter.toLowerCase() : ""} query records found
                        </div>
                        <p className="text-[15px] text-[#64748b] dark:text-[#94a3b8]">
                          {statusFilter === "FAILED"
                            ? "Great news! No failed queries are recorded in the system."
                            : searchTerm
                            ? `No records found matching "${searchTerm}". Try a different keyword.`
                            : "No AI queries have been logged yet."}
                        </p>
                        {(searchTerm || statusFilter !== "ALL") && (
                          <Button
                            onClick={handleResetFilters}
                            variant="outline"
                            size="sm"
                            className="mt-2 h-9 px-4 text-[14px] font-bold border-[#e2e8f0] dark:border-[#334155] text-[#193A69] dark:text-white"
                          >
                            Reset All Filters
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs.map((row, idx) => {
                    const isSuccess = row.statusCode === "SUCCESS";
                    const formattedDate = new Date(row.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    });
                    const formattedTime = new Date(row.createdAt).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    });

                    return (
                      <tr
                        key={row.UTD || idx}
                        className="hover:bg-[#f8fafc] dark:hover:bg-[#0f172a]/40 transition-colors"
                      >
                        <td className="py-3.5 px-4 text-center font-mono text-[15px] text-[#94a3b8]">
                          {(pagination.page - 1) * pagination.limit + idx + 1}
                        </td>

                        {/* User Question */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-lg text-[#1e293b] dark:text-white line-clamp-2" title={row.userQuery}>
                            {row.userQuery}
                          </div>
                          {row.generatedSql && (
                            <div className="mt-1 font-mono text-[13px] text-[#64748b] dark:text-[#94a3b8] truncate max-w-[320px]">
                              <code>{row.generatedSql}</code>
                            </div>
                          )}
                        </td>

                        {/* AI Response Preview */}
                        <td className="py-3.5 px-4 text-[#475569] dark:text-[#cbd5e1]">
                          <div className="line-clamp-2 text-[15px] leading-relaxed" title={row.aiResponse || ""}>
                            {row.aiResponse ? (
                              row.aiResponse.slice(0, 150) + (row.aiResponse.length > 150 ? "..." : "")
                            ) : (
                              <span className="text-[#94a3b8] italic">No response preview</span>
                            )}
                          </div>
                        </td>

                        {/* Intent */}
                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2.5 py-1 rounded-md text-[13px] font-bold bg-[#eff6ff] dark:bg-[#1e3a8a]/40 text-[#2563eb] dark:text-[#93c5fd] border border-[#bfdbfe] dark:border-[#1e3a8a]">
                            {row.intent || "GENERAL"}
                          </span>
                          {row.tablesUsed && (
                            <div className="mt-1 text-[13px] text-[#94a3b8] truncate max-w-[150px]" title={row.tablesUsed}>
                              {row.tablesUsed}
                            </div>
                          )}
                        </td>

                        {/* User / Emp Code */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[15px] text-[#1e293b] dark:text-white">
                            {row.empCode || row.userId || "System"}
                          </div>
                          <div className="text-[13px] text-[#64748b] dark:text-[#94a3b8] capitalize">
                            {row.role || "User"}
                          </div>
                        </td>

                        {/* Rows */}
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-[16px] text-[#1e293b] dark:text-white">
                          {row.rowsReturned || 0}
                        </td>

                        {/* Latency */}
                        <td className="py-3.5 px-4 text-center font-mono">
                          <span
                            className={`px-2 py-1 rounded text-[14px] font-bold ${
                              row.executionTimeMs < 200
                                ? "bg-[#ecfdf5] dark:bg-[#064e3b]/40 text-[#059669] dark:text-[#34d399]"
                                : row.executionTimeMs < 1000
                                ? "bg-[#fffbeb] dark:bg-[#78350f]/40 text-[#d97706] dark:text-[#fbbf24]"
                                : "bg-[#fff1f2] dark:bg-[#450a0a]/40 text-[#e11d48] dark:text-[#fda4af]"
                            }`}
                          >
                            {row.executionTimeMs || 0}ms
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          {isSuccess ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[13px] font-bold bg-[#ecfdf5] dark:bg-[#022c22]/50 text-[#047857] dark:text-[#34d399] border border-[#a7f3d0] dark:border-[#065f46]">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Success
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[13px] font-bold bg-[#fff1f2] dark:bg-[#450a0a]/50 text-[#e11d48] dark:text-[#fda4af] border border-[#fecaca] dark:border-[#991b1b]">
                              <XCircle className="h-3.5 w-3.5" />
                              Failed
                            </span>
                          )}
                        </td>

                        {/* Timestamp */}
                        <td className="py-3.5 px-4 text-[#64748b] dark:text-[#94a3b8]">
                          <div className="font-medium text-[15px] text-[#1e293b] dark:text-white">{formattedDate}</div>
                          <div className="text-[13px] font-mono">{formattedTime}</div>
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4 text-center">
                          <Button
                            onClick={() => setSelectedRecord(row)}
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 p-0 text-[#64748b] hover:text-primary hover:bg-[#f1f5f9] dark:hover:bg-[#0f172a]"
                            title="View Full Q&A & SQL Details"
                          >
                            <Eye className="h-5 w-5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── PAGINATION BAR ── */}
          <div className="bg-[#f8fafc] dark:bg-[#0f172a] border-t border-[#e2e8f0] dark:border-[#334155] px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3.5 text-[15px] text-[#64748b] dark:text-[#94a3b8]">
            <div>
              Showing <span className="font-bold text-[#1e293b] dark:text-white">{logs.length}</span> of{" "}
              <span className="font-bold text-[#1e293b] dark:text-white">{pagination.totalRecords}</span> total records (Page{" "}
              {pagination.page} of {pagination.totalPages})
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                onClick={() => fetchAuditLogs(pagination.page - 1, statusFilter, searchTerm)}
                disabled={pagination.page <= 1 || isLoading}
                variant="outline"
                size="sm"
                className="h-9 px-3 text-[15px] font-bold gap-1 border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b]"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="px-3 font-mono font-bold text-[#193A69] dark:text-white text-[15px]">
                {pagination.page} / {pagination.totalPages || 1}
              </span>
              <Button
                onClick={() => fetchAuditLogs(pagination.page + 1, statusFilter, searchTerm)}
                disabled={pagination.page >= pagination.totalPages || isLoading}
                variant="outline"
                size="sm"
                className="h-9 px-3 text-[15px] font-bold gap-1 border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b]"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* ── DETAIL MODAL ── */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-[#e2e8f0] dark:border-[#334155] flex items-center justify-between bg-[#f8fafc] dark:bg-[#0f172a]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#193A69] text-white flex items-center justify-center font-bold shrink-0">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-[#193A69] dark:text-white flex items-center gap-2.5">
                    Query Audit Record #{selectedRecord.UTD}
                    {selectedRecord.statusCode === "SUCCESS" ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[13px] font-bold bg-[#ecfdf5] dark:bg-[#022c22]/50 text-[#047857] dark:text-[#34d399] border border-[#a7f3d0] dark:border-[#065f46]">
                        SUCCESS
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[13px] font-bold bg-[#fff1f2] dark:bg-[#450a0a]/50 text-[#e11d48] dark:text-[#fda4af] border border-[#fecaca] dark:border-[#991b1b]">
                        FAILED
                      </span>
                    )}
                  </h3>
                  <p className="text-[14px] text-[#64748b] dark:text-[#94a3b8] mt-0.5">
                    Logged at {new Date(selectedRecord.createdAt).toLocaleString("en-IN")} • Latency: {selectedRecord.executionTimeMs}ms
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setSelectedRecord(null)}
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 rounded-full text-[#64748b] hover:text-[#1e293b] dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-[15px] sm:text-base">
              {/* 1. User Question */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#193A69] dark:text-white text-[16px] sm:text-lg flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    User Question / Prompt:
                  </span>
                  <Button
                    onClick={() => handleCopy(selectedRecord.userQuery, "question")}
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2.5 text-[13px] font-bold gap-1 text-[#64748b]"
                  >
                    {copiedField === "question" ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedField === "question" ? "Copied" : "Copy"}
                  </Button>
                </div>
                <div className="p-4 rounded-xl bg-[#f1f5f9] dark:bg-[#0f172a] font-medium text-lg text-[#1e293b] dark:text-white border border-[#e2e8f0] dark:border-[#334155] leading-relaxed">
                  {selectedRecord.userQuery}
                </div>
              </div>

              {/* 2. AI Response */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#193A69] dark:text-white text-[16px] sm:text-lg flex items-center gap-2">
                    <Bot className="h-4 w-4 text-emerald-500" />
                    AI Formatted Answer / Response:
                  </span>
                  <Button
                    onClick={() => handleCopy(selectedRecord.aiResponse || "", "answer")}
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2.5 text-[13px] font-bold gap-1 text-[#64748b]"
                  >
                    {copiedField === "answer" ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedField === "answer" ? "Copied" : "Copy"}
                  </Button>
                </div>
                <div className="p-4.5 rounded-xl bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] text-[#1e293b] dark:text-white whitespace-pre-wrap font-sans text-[15px] sm:text-base leading-relaxed">
                  {selectedRecord.aiResponse || "No response recorded."}
                </div>
              </div>

              {/* 3. Executed SQL Query */}
              {selectedRecord.generatedSql && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#193A69] dark:text-white text-[16px] sm:text-lg flex items-center gap-2">
                      <Code2 className="h-4 w-4 text-primary" />
                      Executed Microsoft SQL Query:
                    </span>
                    <Button
                      onClick={() => handleCopy(selectedRecord.generatedSql || "", "sql")}
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2.5 text-[13px] font-bold gap-1 text-[#64748b]"
                    >
                      {copiedField === "sql" ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedField === "sql" ? "Copied SQL" : "Copy SQL"}
                    </Button>
                  </div>
                  <pre className="p-4 rounded-xl bg-[#0f172a] text-[#93c5fd] font-mono text-[14px] overflow-x-auto border border-[#334155] leading-relaxed">
                    <code>{selectedRecord.generatedSql}</code>
                  </pre>
                </div>
              )}

              {/* 4. Execution Telemetry Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-2">
                <div className="p-3 rounded-lg bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155]">
                  <div className="text-[12px] font-bold text-[#64748b] dark:text-[#94a3b8] uppercase">Intent</div>
                  <div className="font-bold text-[15px] text-[#193A69] dark:text-white mt-0.5 truncate">{selectedRecord.intent || "GENERAL"}</div>
                </div>
                <div className="p-3 rounded-lg bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155]">
                  <div className="text-[12px] font-bold text-[#64748b] dark:text-[#94a3b8] uppercase">Tables Used</div>
                  <div className="font-bold text-[15px] text-[#193A69] dark:text-white mt-0.5 truncate">{selectedRecord.tablesUsed || "EMPLOYEEMASTER"}</div>
                </div>
                <div className="p-3 rounded-lg bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155]">
                  <div className="text-[12px] font-bold text-[#64748b] dark:text-[#94a3b8] uppercase">Rows Returned</div>
                  <div className="font-bold text-[15px] text-[#193A69] dark:text-white mt-0.5">{selectedRecord.rowsReturned || 0}</div>
                </div>
                <div className="p-3 rounded-lg bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155]">
                  <div className="text-[12px] font-bold text-[#64748b] dark:text-[#94a3b8] uppercase">User / Emp Code</div>
                  <div className="font-bold text-[15px] text-[#193A69] dark:text-white mt-0.5 truncate">{selectedRecord.empCode || selectedRecord.userId || "-"}</div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[#e2e8f0] dark:border-[#334155] bg-[#f8fafc] dark:bg-[#0f172a] flex justify-end">
              <Button
                onClick={() => setSelectedRecord(null)}
                variant="print"
                size="sm"
                className="h-9 px-5 text-[15px] font-bold bg-[#193A69] hover:bg-[#152e53] text-white"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
