"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Database,
  FileCheck,
  PlusCircle,
  RefreshCw,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  BookOpen,
  Cpu,
  Hash,
  Tag,
  Link2,
  FileText,
  Server,
  Zap,
  Info,
  ArrowLeft,
  Code,
  Search,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Layers,
  Activity,
  MessageSquare,
  Clock,
  BarChart3,
  Flame,
  CornerDownRight,
  Eye,
  X,
  SlidersHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import axios, { AxiosError } from "axios";

// ============================================================
// CONSTANTS & TYPES
// ============================================================
const BASE_URL = process.env.NEXT_PUBLIC_URL;

export interface ManualKnowledgePayload {
  moduleName: string;
  documentType: string;
  title: string;
  sourceName: string;
  sourceReference: string;
  replaceExisting?: boolean;
  branchCode?: string;
  allowedRoleFlags?: number[];
  content?: string;
  metadata?: {
    primaryKey?: string;
    joinKey?: string;
    category?: string;
    [key: string]: unknown;
  };
}

export interface QueryPatternItem {
  id: string | number;
  intent: string;
  exampleQuestion: string;
  normalizedQuestion?: string;
  keywordsJson?: string;
  synonymsJson?: string;
  tablesJson?: string;
  columnsJson?: string;
  sqlTemplate: string;
  answerPattern?: string;
  confidence?: number;
  successCount?: number;
  isActive?: boolean;
  createdAt?: string;
}

export interface QueryAuditItem {
  UTD: number;
  conversationId: string;
  conversationTitle?: string;
  userId: string;
  empCode?: string;
  role?: string;
  compCode?: string;
  userQuery: string;
  normalizedQuery?: string;
  intent: string;
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

export interface SessionAuditItem {
  conversationId: string;
  conversationTitle?: string;
  title: string;
  userId: string;
  empCode?: string;
  role?: string;
  compCode?: string;
  totalQueries: number;
  successCount: number;
  failedCount: number;
  avgExecutionTimeMs: number;
  totalRows: number;
  latestCreatedAt: string;
  earliestCreatedAt: string;
  firstQuery: string;
  latestQuery: string;
}

export interface AuditStats {
  totalQueries: number;
  successQueries: number;
  failedQueries: number;
  successRate: string;
  avgExecutionTimeMs: number;
  activeUsersCount: number;
  todayQueriesCount: number;
}

interface APIResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  count?: number;
}

interface APIErrorResponse {
  success?: boolean;
  message?: string;
  error?: string;
}

// ============================================================
// UTILS
// ============================================================
const buildAIHeaders = (user?: any) => {
  const compcode =
    user?.Comp_Code || user?.compcode || user?.CompCode || user?.branch || "";
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
};

const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<APIErrorResponse>;
    if (axiosError.response?.data?.message)
      return axiosError.response.data.message;
    if (axiosError.response?.data?.error)
      return axiosError.response.data.error;
    if (axiosError.response?.status === 401)
      return "Your session has expired. Please log in again.";
    if (axiosError.response?.status === 403)
      return "You are not authorized to perform this operation.";
    if (axiosError.response?.status === 404)
      return "Endpoint not found.";
    if (axiosError.code === "ERR_NETWORK")
      return "Unable to connect to the AI server.";
    return axiosError.message || "Request failed.";
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong while processing your request.";
};

// ============================================================
// SUB COMPONENTS
// ============================================================
interface FormFieldProps {
  label: string;
  required?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  hint?: string;
}

function FormField({ label, required, icon, children, hint }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-lg font-semibold uppercase tracking-wider text-[#6B7280]">
        {icon && <span className="text-[#6366F1]">{icon}</span>}
        {label}
        {required && <span className="ml-0.5 text-[#EF4444]">*</span>}
      </label>
      {children}
      {hint && (
        <p className="flex items-center gap-1 text-lg text-[#9CA3AF]">
          <Info size={11} />
          {hint}
        </p>
      )}
    </div>
  );
}

type BadgeVariant = "blue" | "green" | "purple" | "orange" | "indigo" | "rose";

interface StatusBadgeProps {
  label: string;
  color: BadgeVariant;
  dot?: boolean;
}

function StatusBadge({ label, color, dot = false }: StatusBadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    blue:   "bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]",
    green:  "bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]",
    purple: "bg-[#FAF5FF] text-[#7E22CE] border border-[#E9D5FF]",
    orange: "bg-[#FFF7ED] text-[#C2410C] border border-[#FED7AA]",
    indigo: "bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE]",
    rose:   "bg-[#FFF1F2] text-[#BE123C] border border-[#FECDD3]",
  };
  const dotColors: Record<BadgeVariant, string> = {
    blue:   "bg-[#3B82F6]",
    green:  "bg-[#22C55E]",
    purple: "bg-[#A855F7]",
    orange: "bg-[#F97316]",
    indigo: "bg-[#6366F1]",
    rose:   "bg-[#F43F5E]",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-lg font-semibold ${variants[color]}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotColors[color]}`} />}
      {label}
    </span>
  );
}

// ============================================================
// MAIN PAGE COMPONENT
// ============================================================
export default function KnowledgePage() {
  const router = useRouter();
  const user = useCurrentUser() as any;

  // Active top tab: "patterns" (Semantic Hybrid RAG) | "threads" (Observability) | "schemas" (Tables & Documents)
  const [activeTab, setActiveTab] = useState<"patterns" | "threads" | "schemas">("patterns");

  // ── Feedback Banner ──
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // ══════════════════════════════════════════════════════════
  // TAB 1: SEMANTIC QUERY PATTERNS (HYBRID RAG) STATE
  // ══════════════════════════════════════════════════════════
  const [patterns, setPatterns] = useState<QueryPatternItem[]>([]);
  const [loadingPatterns, setLoadingPatterns] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [showCreatePattern, setShowCreatePattern] = useState(false);
  const [expandedSqlId, setExpandedSqlId] = useState<string | number | null>(null);
  const [copiedId, setCopiedId] = useState<string | number | null>(null);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);

  const [patternForm, setPatternForm] = useState({
    question: "",
    intent: "EMPLOYEE_SALARY",
    keywords: "",
    synonyms: "",
    sqlTemplate: "",
    answerPattern: "",
  });
  const [trainingLoading, setTrainingLoading] = useState(false);

  // ══════════════════════════════════════════════════════════
  // TAB 2: THREAD & QUERY TRACE INSPECTOR (RAG OBSERVABILITY) STATE
  // ══════════════════════════════════════════════════════════
  const [auditMode, setAuditMode] = useState<"queries" | "sessions">("queries");
  const [auditLogs, setAuditLogs] = useState<QueryAuditItem[]>([]);
  const [auditSessions, setAuditSessions] = useState<SessionAuditItem[]>([]);
  const [auditStats, setAuditStats] = useState<AuditStats | null>(null);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditSearch, setAuditSearch] = useState("");
  const [auditStatusFilter, setAuditStatusFilter] = useState<string>("ALL");
  const [expandedTraceId, setExpandedTraceId] = useState<number | null>(null);

  // Conversation Drill-down Modal State
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [sessionDetailLogs, setSessionDetailLogs] = useState<QueryAuditItem[]>([]);
  const [loadingSessionDetail, setLoadingSessionDetail] = useState(false);

  // Fetch Query Patterns from API
  const fetchQueryPatterns = async () => {
    setLoadingPatterns(true);
    try {
      const res = await axios.get<APIResponse<QueryPatternItem[]>>(
        `${BASE_URL}/ai/knowledge/query-patterns`,
        { headers: buildAIHeaders(user) }
      );
      if (res.data?.success && Array.isArray(res.data.data)) {
        setPatterns(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load query patterns:", err);
      setStatusMessage({ type: "error", text: getErrorMessage(err) });
    } finally {
      setLoadingPatterns(false);
    }
  };

  // Fetch Audit Logs & Telemetry
  const fetchAuditData = async () => {
    setLoadingAudit(true);
    try {
      const modeParam = auditMode === "sessions" ? "&mode=sessions" : "";
      const statusParam = auditStatusFilter !== "ALL" ? `&status=${auditStatusFilter}` : "";
      const searchParam = auditSearch.trim() ? `&search=${encodeURIComponent(auditSearch.trim())}` : "";
      const res = await axios.get<any>(
        `${BASE_URL}/ai/audit?limit=60${modeParam}${statusParam}${searchParam}`,
        { headers: buildAIHeaders(user) }
      );
      if (res.data?.success) {
        if (auditMode === "sessions") {
          setAuditSessions(res.data.data || []);
        } else {
          setAuditLogs(res.data.data || []);
        }
        if (res.data.stats) {
          setAuditStats(res.data.stats);
        }
      }
    } catch (err) {
      console.error("Failed to load audit traces:", err);
    } finally {
      setLoadingAudit(false);
    }
  };

  // Fetch Conversation Drill-down
  const fetchSessionDrilldown = async (convId: string) => {
    setSelectedConversationId(convId);
    setLoadingSessionDetail(true);
    try {
      const res = await axios.get<any>(
        `${BASE_URL}/ai/audit?conversationId=${encodeURIComponent(convId)}`,
        { headers: buildAIHeaders(user) }
      );
      if (res.data?.success) {
        setSessionDetailLogs(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load session drilldown:", err);
    } finally {
      setLoadingSessionDetail(false);
    }
  };

  // 1-Click Promote Trace Query into Golden Query Pattern
  const handlePromoteToGoldenPattern = (item: QueryAuditItem) => {
    setActiveTab("patterns");
    setShowCreatePattern(true);
    setPatternForm({
      question: item.userQuery,
      intent: item.intent || "EMPLOYEE_SALARY",
      keywords: item.normalizedQuery ? item.normalizedQuery.split(/\s+/).slice(0, 5).join(", ") : "",
      synonyms: "",
      sqlTemplate: item.generatedSql || "",
      answerPattern: item.aiResponse ? item.aiResponse.slice(0, 120) : "",
    });
    setStatusMessage({
      type: "success",
      text: `Pre-filled Golden Pattern Form from Query #${item.UTD}. Review SQL & click "Train New Pattern" to save permanently.`
    });
  };

  useEffect(() => {
    if (activeTab === "patterns") {
      fetchQueryPatterns();
    } else if (activeTab === "threads") {
      fetchAuditData();
    }
  }, [activeTab, auditMode, auditStatusFilter]);

  // Train new pattern handler
  const handleTrainPatternSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patternForm.question.trim() || !patternForm.sqlTemplate.trim()) {
      setStatusMessage({
        type: "error",
        text: "Please provide both an Example Question and SQL Template.",
      });
      return;
    }

    setTrainingLoading(true);
    setStatusMessage(null);
    try {
      const kwArray = patternForm.keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);

      let synonymsObj = {};
      if (patternForm.synonyms.trim()) {
        try {
          synonymsObj = JSON.parse(patternForm.synonyms);
        } catch (_) {
          // Parse "k1:v1, k2:v2" format
          patternForm.synonyms.split(",").forEach((pair) => {
            const [k, v] = pair.split(":").map((s) => s.trim());
            if (k && v) (synonymsObj as any)[k] = v;
          });
        }
      }

      const payload = {
        question: patternForm.question.trim(),
        intent: patternForm.intent.trim() || "ERP_GENERAL_QUERY",
        sqlTemplate: patternForm.sqlTemplate.trim(),
        keywords: kwArray,
        synonyms: synonymsObj,
        answerPattern: patternForm.answerPattern.trim() || undefined,
      };

      const res = await axios.post<APIResponse>(
        `${BASE_URL}/ai/knowledge/query-patterns`,
        payload,
        { headers: buildAIHeaders(user) }
      );

      setStatusMessage({
        type: "success",
        text: `Query Pattern trained & indexed into Hybrid RAG memory successfully! (${patternForm.intent})`,
      });

      setPatternForm({
        question: "",
        intent: "EMPLOYEE_SALARY",
        keywords: "",
        synonyms: "",
        sqlTemplate: "",
        answerPattern: "",
      });
      setShowCreatePattern(false);
      fetchQueryPatterns();
    } catch (err) {
      setStatusMessage({ type: "error", text: getErrorMessage(err) });
    } finally {
      setTrainingLoading(false);
    }
  };

  // Delete pattern handler
  const handleDeletePattern = async (id: string | number) => {
    if (!confirm("Are you sure you want to deactivate this query pattern?")) return;
    setDeletingId(id);
    setStatusMessage(null);
    try {
      await axios.delete(`${BASE_URL}/ai/knowledge/query-patterns/${id}`, {
        headers: buildAIHeaders(user),
      });
      setStatusMessage({
        type: "success",
        text: `Query pattern #${id} deactivated successfully.`,
      });
      fetchQueryPatterns();
    } catch (err) {
      setStatusMessage({ type: "error", text: getErrorMessage(err) });
    } finally {
      setDeletingId(null);
    }
  };

  const copyToClipboard = (text: string, id: string | number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered patterns by search query
  const filteredPatterns = useMemo(() => {
    if (!searchFilter.trim()) return patterns;
    const q = searchFilter.toLowerCase();
    return patterns.filter(
      (p) =>
        p.intent?.toLowerCase().includes(q) ||
        p.exampleQuestion?.toLowerCase().includes(q) ||
        p.keywordsJson?.toLowerCase().includes(q) ||
        p.sqlTemplate?.toLowerCase().includes(q)
    );
  }, [patterns, searchFilter]);

  // ══════════════════════════════════════════════════════════
  // TAB 2: TABLE SCHEMAS & DOCUMENTS STATE
  // ══════════════════════════════════════════════════════════
  const [form, setForm] = useState<ManualKnowledgePayload>({
    moduleName: "HR",
    documentType: "TABLE_SCHEMA",
    title: "",
    sourceName: "",
    sourceReference: "",
    content: "",
    metadata: {
      primaryKey: "UTD",
      joinKey: "Emp_Code",
      category: "",
    },
  });

  const [documentIdInput, setDocumentIdInput] = useState("");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sourceName.trim() || !form.sourceReference.trim() || !form.title.trim()) {
      setStatusMessage({
        type: "error",
        text: "Please fill in all required fields (Title, Source Name, Source Reference).",
      });
      return;
    }
    setLoadingAction("submit");
    setStatusMessage(null);
    try {
      const res = await axios.post<APIResponse>(
        `${BASE_URL}/ai/knowledge/manual`,
        form,
        { headers: buildAIHeaders(user), timeout: 60000 }
      );
      const docId = res.data?.data?.documentId;
      setStatusMessage({
        type: "success",
        text: `Knowledge document registered successfully! ${
          docId ? `Document ID: ${docId}` : ""
        } — ${res.data?.message || "Live columns auto-enriched."}`,
      });
      setForm((prev) => ({
        ...prev,
        title: "",
        sourceName: "",
        sourceReference: "",
        content: "",
      }));
    } catch (err) {
      setStatusMessage({ type: "error", text: getErrorMessage(err) });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleProcessDocument = async () => {
    const id = Number(documentIdInput);
    if (!id || id <= 0) {
      setStatusMessage({ type: "error", text: "Please enter a valid numeric document ID." });
      return;
    }
    setLoadingAction("process");
    setStatusMessage(null);
    try {
      const res = await axios.post<APIResponse>(
        `${BASE_URL}/ai/knowledge/documents/${id}/process`,
        { force: true },
        { headers: buildAIHeaders(user), timeout: 60000 }
      );
      setStatusMessage({
        type: "success",
        text: `Document #${id} indexed successfully! Status: ${
          res.data?.data?.status || "SUCCESS"
        }`,
      });
    } catch (err) {
      setStatusMessage({ type: "error", text: getErrorMessage(err) });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCheckStatus = async () => {
    const id = Number(documentIdInput);
    if (!id || id <= 0) {
      setStatusMessage({ type: "error", text: "Please enter a valid numeric document ID." });
      return;
    }
    setLoadingAction("status");
    setStatusMessage(null);
    try {
      const res = await axios.get<APIResponse>(
        `${BASE_URL}/ai/knowledge/documents/${id}/status`,
        { headers: buildAIHeaders(user) }
      );
      const st = res.data?.data;
      setStatusMessage({
        type: "success",
        text: `Document #${id} — Status: ${st?.status || "UNKNOWN"} | Chunks: ${
          st?.chunkCount ?? 0
        } | Processed: ${
          st?.processedAt ? new Date(st.processedAt).toLocaleString() : "Not yet processed"
        }`,
      });
    } catch (err) {
      setStatusMessage({ type: "error", text: getErrorMessage(err) });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDeactivate = async () => {
    const id = Number(documentIdInput);
    if (!id || id <= 0) {
      setStatusMessage({ type: "error", text: "Please enter a valid numeric document ID." });
      return;
    }
    setLoadingAction("deactivate");
    setStatusMessage(null);
    try {
      const res = await axios.patch<APIResponse>(
        `${BASE_URL}/ai/knowledge/documents/${id}/deactivate`,
        { hardDelete: false },
        { headers: buildAIHeaders(user) }
      );
      setStatusMessage({
        type: "success",
        text: `Document #${id} deactivated successfully. ${res.data?.message || ""}`,
      });
    } catch (err) {
      setStatusMessage({ type: "error", text: getErrorMessage(err) });
    } finally {
      setLoadingAction(null);
    }
  };

  const isSchemaLoading = loadingAction !== null;

  return (
    <div className="mx-auto  space-y-6 p-4 sm:p-6">

      {/* ══════════════════════════════════════════
          PAGE HEADER
      ══════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-2xl border border-[#334155] bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#1E3A5F] shadow-lg">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#6366F1]/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 left-1/4 h-40 w-40 rounded-full bg-[#8B5CF6]/10 blur-2xl" />

        <div className="relative flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] shadow-[0_4px_20px_rgba(99,102,241,0.4)]">
              <Database size={22} className="text-[#FFFFFF]" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#F8FAFC]">
                AutoVyn AI Knowledge Base
              </h1>
              <p className="mt-0.5 text-lg text-[#94A3B8]">
                Hybrid RAG Semantic Chunks, ERP Table Schemas &amp; Query Pattern Management
              </p>
            </div>
          </div>

          {/* Badges & Back Button */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FFFFFF]/10 bg-[#FFFFFF]/5 px-3 py-1 text-lg font-semibold text-[#CBD5E1] shadow-[0_0_12px_rgba(99,102,241,0.3)] backdrop-blur-sm">
              <Sparkles size={12} className="text-[#A5B4FC]" />
              Hybrid RAG
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FFFFFF]/10 bg-[#FFFFFF]/5 px-3 py-1 text-lg font-semibold text-[#CBD5E1] shadow-[0_0_12px_rgba(139,92,246,0.3)] backdrop-blur-sm">
              <Zap size={12} className="text-[#FCD34D]" />
              MSSQL Live
            </span>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex h-9 items-center gap-2 rounded-xl border border-[#FFFFFF]/15 bg-[#FFFFFF]/10 px-3.5 text-lg font-bold text-[#F8FAFC] shadow-sm backdrop-blur-sm transition-all hover:bg-[#FFFFFF]/20 hover:border-[#FFFFFF]/30 active:scale-95 cursor-pointer"
            >
              <ArrowLeft size={16} className="text-[#FFFFFF]" />
              <span>Back</span>
            </button>
          </div>
        </div>

        {/* ── TOP NAVIGATION TABS ── */}
        <div className="relative flex flex-wrap border-t border-[#334155]/60 px-6 bg-[#0B1120]/40">
          <button
            onClick={() => setActiveTab("patterns")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-lg font-bold transition-all ${
              activeTab === "patterns"
                ? "border-[#6366F1] text-[#FFFFFF]"
                : "border-transparent text-[#94A3B8] hover:text-[#E2E8F0]"
            }`}
          >
            <Cpu size={15} className={activeTab === "patterns" ? "text-[#818CF8]" : ""} />
            Semantic Query Patterns (Hybrid RAG)
            <span className="ml-1.5 rounded-full bg-[#6366F1]/30 px-2 py-0.5 text-sm text-[#C7D2FE]">
              {patterns.length} Active
            </span>
          </button>

          <button
            onClick={() => setActiveTab("threads")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-lg font-bold transition-all ${
              activeTab === "threads"
                ? "border-[#6366F1] text-[#FFFFFF]"
                : "border-transparent text-[#94A3B8] hover:text-[#E2E8F0]"
            }`}
          >
            <Activity size={15} className={activeTab === "threads" ? "text-[#818CF8]" : ""} />
            Thread &amp; Query Trace (RAG Observability)
            <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-[#10B981]/20 px-2 py-0.5 text-sm font-semibold text-[#6EE7B7]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#10B981]" />
              Live
            </span>
          </button>

          <button
            onClick={() => setActiveTab("schemas")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-lg font-bold transition-all ${
              activeTab === "schemas"
                ? "border-[#6366F1] text-[#FFFFFF]"
                : "border-transparent text-[#94A3B8] hover:text-[#E2E8F0]"
            }`}
          >
            <Layers size={15} className={activeTab === "schemas" ? "text-[#818CF8]" : ""} />
            Table Schemas &amp; Documents
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          STATUS ALERT BANNER
      ══════════════════════════════════════════ */}
      {statusMessage && (
        <div
          className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-sm ${
            statusMessage.type === "success"
              ? "border-[#BBF7D0] bg-[#F0FDF4] text-[#14532D]"
              : "border-[#FECACA] bg-[#FEF2F2] text-[#7F1D1D]"
          }`}
        >
          <div className="mt-0.5 shrink-0">
            {statusMessage.type === "success" ? (
              <CheckCircle size={16} className="text-[#16A34A]" />
            ) : (
              <AlertCircle size={16} className="text-[#DC2626]" />
            )}
          </div>
          <p className="flex-1 text-lg font-medium leading-5">{statusMessage.text}</p>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="shrink-0 text-base font-bold opacity-60 hover:opacity-100"
          >
            ×
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          VIEW 1: SEMANTIC QUERY PATTERNS (HYBRID RAG CHUNKS)
      ══════════════════════════════════════════════════════════ */}
      {activeTab === "patterns" && (
        <div className="space-y-6">

          {/* Controls Bar: Stats, Search, Train Button */}
          <div className="flex flex-col gap-3 rounded-2xl border border-[#E5E7EB] bg-[#FFFFFF] p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-80">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                <Input
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filter by question, intent or SQL…"
                  className="h-9 w-full rounded-lg border border-[#E5E7EB] pl-9 pr-3 text-lg outline-none focus:border-[#6366F1]"
                />
              </div>
              <button
                type="button"
                onClick={fetchQueryPatterns}
                disabled={loadingPatterns}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-lg font-semibold text-[#4B5563] hover:bg-[#F3F4F6]"
                title="Refresh patterns"
              >
                <RefreshCw size={13} className={loadingPatterns ? "animate-spin text-[#6366F1]" : ""} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold text-[#6B7280]">
                Showing {filteredPatterns.length} of {patterns.length} pattern(s)
              </span>
              <button
                type="button"
                onClick={() => setShowCreatePattern(!showCreatePattern)}
                className="flex h-9 items-center gap-2 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-4 text-lg font-bold text-[#FFFFFF] shadow-md transition-all hover:opacity-95 active:scale-95"
              >
                <PlusCircle size={15} />
                <span>{showCreatePattern ? "Close Form" : "Train New Pattern"}</span>
              </button>
            </div>
          </div>

          {/* ── CREATE / TRAIN PATTERN FORM (Collapsible) ── */}
          {showCreatePattern && (
            <div className="rounded-2xl border border-[#C7D2FE] bg-gradient-to-br from-[#FFFFFF] to-[#F5F3FF] p-6 shadow-md">
              <div className="mb-4 flex items-center justify-between border-b border-[#E0E7FF] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#6366F1]">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#1E1B4B]">
                      Train New Semantic Query Pattern
                    </h2>
                    <p className="text-lg text-[#6B7280]">
                      The AI will map similar user questions to this verified SQL template automatically.
                    </p>
                  </div>
                </div>
                <StatusBadge label="RAG Knowledge Chunk" color="purple" dot />
              </div>

              <form onSubmit={handleTrainPatternSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    label="Example Question"
                    required
                    icon={<FileText size={11} />}
                    hint="Natural question asked by users (Hindi, English or Hinglish)"
                  >
                    <Input
                      value={patternForm.question}
                      onChange={(e) => setPatternForm({ ...patternForm, question: e.target.value })}
                      placeholder="e.g. Atendra ki leave balance kitni hai?"
                      required
                      className="h-10 text-lg"
                    />
                  </FormField>

                  <FormField
                    label="Intent Category"
                    required
                    icon={<Tag size={11} />}
                    hint="Standard ERP Intent identifier"
                  >
                    <select
                      value={patternForm.intent}
                      onChange={(e) => setPatternForm({ ...patternForm, intent: e.target.value })}
                      className="h-10 w-full rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] px-3 text-lg outline-none focus:border-[#6366F1]"
                    >
                      <option value="EMPLOYEE_SALARY">EMPLOYEE_SALARY (Salary &amp; Earnings)</option>
                      <option value="ATTENDANCE_REPORT">ATTENDANCE_REPORT (Attendance &amp; Hours)</option>
                      <option value="EMPLOYEE_LEAVE_LOOKUP">EMPLOYEE_LEAVE_LOOKUP (Leaves &amp; Chhutti)</option>
                      <option value="SERVICE_REMINDERS_DUE">SERVICE_REMINDERS_DUE (Vehicle Due Service)</option>
                      <option value="AADHAAR_VERIFY_LOOKUP">AADHAAR_VERIFY_LOOKUP (Aadhaar KYC Verification)</option>
                      <option value="PF_LOOKUP_BY_EMP">PF_LOOKUP_BY_EMP (PF / UAN Lookup)</option>
                      <option value="MISPUNCH_LOOKUP_BY_EMP">MISPUNCH_LOOKUP_BY_EMP (Mispunch Records)</option>
                      <option value="ERP_GENERAL_QUERY">ERP_GENERAL_QUERY (Custom ERP Query)</option>
                    </select>
                  </FormField>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    label="Keywords (Comma separated)"
                    icon={<Hash size={11} />}
                    hint="Keywords that trigger this pattern (e.g. leave, chhutti, balance, pl, cl)"
                  >
                    <Input
                      value={patternForm.keywords}
                      onChange={(e) => setPatternForm({ ...patternForm, keywords: e.target.value })}
                      placeholder="leave, chhutti, balance, pl, cl, sl"
                      className="h-10 text-lg"
                    />
                  </FormField>

                  <FormField
                    label="Synonyms (Key:Value or JSON)"
                    icon={<Tag size={11} />}
                    hint="Optional synonym mapping (e.g. chhutti:leave, pagar:salary)"
                  >
                    <Input
                      value={patternForm.synonyms}
                      onChange={(e) => setPatternForm({ ...patternForm, synonyms: e.target.value })}
                      placeholder="chhutti:leave, baki:balance"
                      className="h-10 text-lg"
                    />
                  </FormField>
                </div>

                <FormField
                  label="Parameterized SQL Template"
                  required
                  icon={<Code size={11} />}
                  hint="Safe SELECT query. Use :empCode placeholder for employee parameter substitution."
                >
                  <textarea
                    value={patternForm.sqlTemplate}
                    onChange={(e) => setPatternForm({ ...patternForm, sqlTemplate: e.target.value })}
                    rows={4}
                    required
                    placeholder="SELECT TOP 1 [Emp_Code], [Date], [In_Time], [Out_Time] FROM [dbo].[attendancetable] WITH (NOLOCK) WHERE Emp_Code = :empCode ORDER BY Date DESC;"
                    className="w-full resize-none rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] p-3 font-mono text-lg text-[#111827] outline-none focus:border-[#6366F1]"
                  />
                </FormField>

                <FormField
                  label="Answer Pattern Template (Optional)"
                  icon={<FileText size={11} />}
                  hint="Optional template for human answer (e.g. '{employee_name} ki Net Salary ₹{net_salary} hai.')"
                >
                  <Input
                    value={patternForm.answerPattern}
                    onChange={(e) => setPatternForm({ ...patternForm, answerPattern: e.target.value })}
                    placeholder="{employee_name} ({emp_code}) ka status: {status}"
                    className="h-10 text-lg"
                  />
                </FormField>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreatePattern(false)}
                    className="rounded-xl border border-[#D1D5DB] bg-[#FFFFFF] px-4 py-2 text-lg font-semibold text-[#4B5563] hover:bg-[#F3F4F6]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={trainingLoading}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-5 py-2 text-lg font-bold text-[#FFFFFF] shadow-md hover:opacity-95 disabled:opacity-50"
                  >
                    {trainingLoading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Training &amp; Indexing Pattern…
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        Save &amp; Train Pattern
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── PATTERNS GRID LIST ── */}
          {loadingPatterns ? (
            <div className="flex h-48 items-center justify-center rounded-2xl border border-[#E5E7EB] bg-[#FFFFFF]">
              <div className="flex flex-col items-center gap-2">
                <Loader2 size={24} className="animate-spin text-[#6366F1]" />
                <span className="text-lg font-medium text-[#6B7280]">Loading RAG Query Patterns…</span>
              </div>
            </div>
          ) : filteredPatterns.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-6 text-center">
              <Cpu size={32} className="text-[#94A3B8]" />
              <p className="mt-2 text-lg font-bold text-[#475569]">No Query Patterns Found</p>
              <p className="mt-0.5 text-lg text-[#94A3B8]">
                {searchFilter ? "Try adjusting your search filter." : "Click 'Train New Pattern' to add one."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {filteredPatterns.map((pat) => {
                let parsedKw: string[] = [];
                try {
                  parsedKw = JSON.parse(pat.keywordsJson || "[]");
                } catch (_) {}

                let parsedTables: string[] = [];
                try {
                  parsedTables = JSON.parse(pat.tablesJson || "[]");
                } catch (_) {}

                const isExpanded = expandedSqlId === pat.id;

                return (
                  <div
                    key={pat.id}
                    className="flex flex-col justify-between rounded-2xl border border-[#E5E7EB] bg-[#FFFFFF] p-5 shadow-sm transition-all hover:border-[#6366F1]/30 hover:shadow-md"
                  >
                    <div>
                      {/* Card Header: Intent & Actions */}
                      <div className="flex items-center justify-between border-b border-[#F3F4F6] pb-3">
                        <div className="flex items-center gap-2">
                          <StatusBadge label={pat.intent} color="indigo" dot />
                          <span className="text-lg font-mono text-[#9CA3AF]">#{pat.id}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-lg font-bold text-[#4B5563]">
                            Success: {pat.successCount ?? 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeletePattern(pat.id)}
                            disabled={deletingId === pat.id}
                            className="rounded p-1 text-[#9CA3AF] transition-colors hover:bg-[#FEE2E2] hover:text-[#DC2626]"
                            title="Deactivate Pattern"
                          >
                            {deletingId === pat.id ? (
                              <Loader2 size={14} className="animate-spin text-[#DC2626]" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Question */}
                      <div className="mt-3">
                        <h3 className="text-lg font-bold text-[#111827]">
                          "{pat.exampleQuestion}"
                        </h3>
                        {pat.answerPattern && (
                          <p className="mt-1 text-lg text-[#6B7280]">
                            <span className="font-semibold text-[#4B5563]">Format: </span>
                            {pat.answerPattern}
                          </p>
                        )}
                      </div>

                      {/* Keywords Pills */}
                      {parsedKw.length > 0 && (
                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                          <span className="text-lg font-bold uppercase tracking-wider text-[#9CA3AF]">
                            Keywords:
                          </span>
                          {parsedKw.slice(0, 7).map((kw, idx) => (
                            <span
                              key={idx}
                              className="rounded-md border border-[#E5E7EB] bg-[#F9FAFB] px-2 py-0.5 text-lg font-medium text-[#4B5563]"
                            >
                              {kw}
                            </span>
                          ))}
                          {parsedKw.length > 7 && (
                            <span className="text-lg text-[#9CA3AF]">+{parsedKw.length - 7} more</span>
                          )}
                        </div>
                      )}

                      {/* Tables Used */}
                      {parsedTables.length > 0 && (
                        <div className="mt-2.5 flex items-center gap-1.5 text-lg text-[#6B7280]">
                          <Database size={12} className="text-[#6366F1]" />
                          <span className="font-semibold text-[#374151]">Tables:</span>
                          <span className="font-mono text-lg text-[#4B5563]">
                            {parsedTables.join(", ")}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* SQL Template Section */}
                    <div className="mt-4 border-t border-[#F3F4F6] pt-3">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setExpandedSqlId(isExpanded ? null : pat.id)}
                          className="flex items-center gap-1 text-lg font-semibold text-[#6366F1] hover:text-[#4F46E5]"
                        >
                          <Code size={13} />
                          <span>{isExpanded ? "Hide SQL" : "View SQL Template"}</span>
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(pat.sqlTemplate, pat.id)}
                          className="flex items-center gap-1 text-lg text-[#6B7280] hover:text-[#111827]"
                        >
                          {copiedId === pat.id ? (
                            <>
                              <Check size={12} className="text-[#16A34A]" />
                              <span className="text-[#16A34A]">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              <span>Copy SQL</span>
                            </>
                          )}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="mt-2 max-h-48 overflow-y-auto rounded-lg bg-[#0F172A] p-3 text-lg font-mono text-[#E2E8F0]">
                          <pre className="whitespace-pre-wrap">{pat.sqlTemplate}</pre>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          VIEW 2: THREAD & QUERY TRACE INSPECTOR (RAG OBSERVABILITY)
      ══════════════════════════════════════════════════════════ */}
      {activeTab === "threads" && (
        <div className="space-y-6">

          {/* ── KPI TELEMETRY STATS BAR ── */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-[#E5E7EB] bg-[#FFFFFF] p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold uppercase tracking-wider text-[#6B7280]">
                  Total Queries
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#6366F1]">
                  <Activity size={18} />
                </div>
              </div>
              <div className="mt-2 text-3xl font-extrabold text-[#111827]">
                {auditStats?.totalQueries ?? auditLogs.length}
              </div>
              <p className="mt-1 text-xs text-[#9CA3AF]">
                Enterprise AI Copilot Queries
              </p>
            </div>

            <div className="rounded-2xl border border-[#E5E7EB] bg-[#FFFFFF] p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold uppercase tracking-wider text-[#6B7280]">
                  Success Rate
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F0FDF4] text-[#16A34A]">
                  <CheckCircle size={18} />
                </div>
              </div>
              <div className="mt-2 text-3xl font-extrabold text-[#16A34A]">
                {auditStats?.successRate ?? "100%"}
              </div>
              <p className="mt-1 text-xs text-[#9CA3AF]">
                {auditStats?.failedQueries ?? 0} Failed queries detected
              </p>
            </div>

            <div className="rounded-2xl border border-[#E5E7EB] bg-[#FFFFFF] p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold uppercase tracking-wider text-[#6B7280]">
                  Average Latency
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FAF5FF] text-[#7E22CE]">
                  <Clock size={18} />
                </div>
              </div>
              <div className="mt-2 text-3xl font-extrabold text-[#7E22CE]">
                {auditStats?.avgExecutionTimeMs ?? 18} <span className="text-base font-semibold">ms</span>
              </div>
              <p className="mt-1 text-xs text-[#9CA3AF]">
                End-to-end execution speed
              </p>
            </div>

            <div className="rounded-2xl border border-[#E5E7EB] bg-[#FFFFFF] p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold uppercase tracking-wider text-[#6B7280]">
                  Today's Traffic
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF7ED] text-[#C2410C]">
                  <Flame size={18} />
                </div>
              </div>
              <div className="mt-2 text-3xl font-extrabold text-[#C2410C]">
                {auditStats?.todayQueriesCount ?? 0}
              </div>
              <p className="mt-1 text-xs text-[#9CA3AF]">
                Active ERP Copilot queries today
              </p>
            </div>
          </div>

          {/* ── CONTROLS, SEARCH & FILTERS ── */}
          <div className="flex flex-col gap-4 rounded-2xl border border-[#E5E7EB] bg-[#FFFFFF] p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              {/* Mode Toggle */}
              <div className="flex rounded-xl bg-[#F3F4F6] p-1">
                <button
                  type="button"
                  onClick={() => setAuditMode("queries")}
                  className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                    auditMode === "queries"
                      ? "bg-[#FFFFFF] text-[#111827] shadow-sm"
                      : "text-[#6B7280] hover:text-[#111827]"
                  }`}
                >
                  <Activity size={14} className={auditMode === "queries" ? "text-[#6366F1]" : ""} />
                  All Query Traces
                </button>
                <button
                  type="button"
                  onClick={() => setAuditMode("sessions")}
                  className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                    auditMode === "sessions"
                      ? "bg-[#FFFFFF] text-[#111827] shadow-sm"
                      : "text-[#6B7280] hover:text-[#111827]"
                  }`}
                >
                  <MessageSquare size={14} className={auditMode === "sessions" ? "text-[#6366F1]" : ""} />
                  Conversation Threads
                </button>
              </div>

              {/* Status Filter */}
              <select
                value={auditStatusFilter}
                onChange={(e) => setAuditStatusFilter(e.target.value)}
                className="h-9 rounded-xl border border-[#E5E7EB] bg-[#FFFFFF] px-3 text-xs font-semibold text-[#374151] outline-none focus:border-[#6366F1]"
              >
                <option value="ALL">All Statuses</option>
                <option value="SUCCESS">Only Successful</option>
                <option value="FAILED">Only Failed</option>
              </select>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="relative flex-1 sm:w-80">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  type="text"
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchAuditData()}
                  placeholder="Search question, intent, SQL, error…"
                  className="h-9 w-full rounded-xl border border-[#E5E7EB] pl-9 pr-3 text-xs outline-none focus:border-[#6366F1]"
                />
              </div>

              <button
                type="button"
                onClick={fetchAuditData}
                disabled={loadingAudit}
                className="flex h-9 items-center gap-1.5 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3.5 text-xs font-semibold text-[#4B5563] hover:bg-[#F3F4F6] cursor-pointer"
                title="Refresh live traces"
              >
                <RefreshCw size={13} className={loadingAudit ? "animate-spin text-[#6366F1]" : ""} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* ── TRACE / SESSION CONTENT ── */}
          {loadingAudit ? (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-[#E5E7EB] bg-[#FFFFFF]">
              <div className="flex flex-col items-center gap-3">
                <Loader2 size={28} className="animate-spin text-[#6366F1]" />
                <span className="text-sm font-semibold text-[#6B7280]">
                  Loading AI Query Traces &amp; Telemetry…
                </span>
              </div>
            </div>
          ) : auditMode === "queries" ? (
            /* ── VIEW 2A: INDIVIDUAL QUERY TRACES ── */
            auditLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-[#E5E7EB] bg-[#FFFFFF] py-16 text-center">
                <Activity size={36} className="text-[#94A3B8]" />
                <h3 className="mt-3 text-base font-bold text-[#374151]">No Query Traces Found</h3>
                <p className="mt-1 text-xs text-[#9CA3AF]">
                  {auditSearch ? "Try clearing your search query." : "User questions asked in AI Copilot will appear here live."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {auditLogs.map((item) => {
                  const isSuccess = item.statusCode === "SUCCESS";
                  const isExpanded = expandedTraceId === item.UTD;
                  const isFastPattern = (item.executionTimeMs || 0) < 150;

                  return (
                    <div
                      key={item.UTD}
                      className="group rounded-2xl border border-[#E5E7EB] bg-[#FFFFFF] p-5 shadow-sm transition-all hover:border-[#CBD5E1] hover:shadow-md"
                    >
                      {/* Trace Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F3F4F6] pb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge
                            label={item.statusCode || "SUCCESS"}
                            color={isSuccess ? "green" : "rose"}
                            dot
                          />
                          <StatusBadge
                            label={item.intent || "GENERAL"}
                            color="indigo"
                          />
                          {isFastPattern ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#EEF2FF] px-2.5 py-0.5 text-xs font-semibold text-[#4F46E5]">
                              <Zap size={11} className="text-[#6366F1]" />
                              Hybrid RAG Pattern
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#F3F4F6] px-2.5 py-0.5 text-xs font-medium text-[#4B5563]">
                              <Search size={11} className="text-[#6B7280]" />
                              Schema RAG
                            </span>
                          )}
                          <span className="font-mono text-xs text-[#9CA3AF]">
                            #{item.UTD}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-xs text-[#9CA3AF]">
                            <Clock size={12} />
                            {item.createdAt}
                          </span>

                          {/* 1-Click Promote to Golden Pattern Button */}
                          <button
                            type="button"
                            onClick={() => handlePromoteToGoldenPattern(item)}
                            className="flex items-center gap-1.5 rounded-lg border border-[#FDE68A] bg-[#FEF3C7] px-2.5 py-1 text-xs font-bold text-[#92400E] shadow-sm transition-all hover:bg-[#FCD34D] cursor-pointer"
                            title="Train this question and SQL into Knowledge Base"
                          >
                            <Sparkles size={12} className="text-[#D97706]" />
                            <span>Save as Pattern</span>
                          </button>
                        </div>
                      </div>

                      {/* Question */}
                      <div className="mt-3">
                        <h3 className="text-base font-bold text-[#111827]">
                          "{item.userQuery}"
                        </h3>
                      </div>

                      {/* Diagnostic Badges */}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-md bg-[#F3F4F6] px-2.5 py-1 font-mono text-xs font-medium text-[#374151]">
                          <Clock size={11} className="text-[#6B7280]" />
                          {item.executionTimeMs} ms
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md bg-[#F3F4F6] px-2.5 py-1 font-mono text-xs font-medium text-[#374151]">
                          <Database size={11} className="text-[#6B7280]" />
                          {item.rowsReturned} rows
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md bg-[#F3F4F6] px-2.5 py-1 font-mono text-xs font-medium text-[#374151]">
                          Score: {(Number(item.confidenceScore || 0.95) * 100).toFixed(0)}%
                        </span>
                        {item.tablesUsed && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-[#EEF2FF] px-2.5 py-1 font-mono text-xs font-medium text-[#4338CA]">
                            Tables: {item.tablesUsed}
                          </span>
                        )}
                        <span className="text-xs text-[#9CA3AF]">
                          User: <strong className="text-[#4B5563]">{item.userId || "USER"}</strong>
                          {item.empCode ? ` • Emp: ${item.empCode}` : ""}
                        </span>
                      </div>

                      {/* Error Banner if Failed */}
                      {item.errorMessage && (
                        <div className="mt-3 rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-3 text-xs font-medium text-[#991B1B]">
                          <strong className="font-bold">Error: </strong>
                          {item.errorMessage}
                        </div>
                      )}

                      {/* SQL & Response Accordion Bar */}
                      <div className="mt-4 flex items-center justify-between border-t border-[#F3F4F6] pt-3">
                        <button
                          type="button"
                          onClick={() => setExpandedTraceId(isExpanded ? null : item.UTD)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-[#6366F1] hover:text-[#4F46E5] cursor-pointer"
                        >
                          <Code size={13} />
                          <span>{isExpanded ? "Hide Execution SQL" : "View Executed SQL & Response"}</span>
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>

                        {item.generatedSql && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(item.generatedSql!, item.UTD)}
                            className="flex items-center gap-1 text-xs text-[#6B7280] hover:text-[#111827] cursor-pointer"
                          >
                            {copiedId === item.UTD ? (
                              <>
                                <Check size={12} className="text-[#16A34A]" />
                                <span className="font-semibold text-[#16A34A]">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={12} />
                                <span>Copy SQL</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Expanded SQL & Answer */}
                      {isExpanded && (
                        <div className="mt-3 space-y-3">
                          {item.generatedSql && (
                            <div className="max-h-56 overflow-y-auto rounded-xl bg-[#0F172A] p-3.5 font-mono text-xs text-[#E2E8F0]">
                              <pre className="whitespace-pre-wrap">{item.generatedSql}</pre>
                            </div>
                          )}

                          {item.aiResponse && (
                            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5 text-xs text-[#334155]">
                              <div className="mb-1 font-semibold text-[#475569]">AI Formatted Response:</div>
                              <p className="whitespace-pre-wrap leading-relaxed">{item.aiResponse}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* ── VIEW 2B: CONVERSATION THREADS (SESSIONS) ── */
            auditSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-[#E5E7EB] bg-[#FFFFFF] py-16 text-center">
                <MessageSquare size={36} className="text-[#94A3B8]" />
                <h3 className="mt-3 text-base font-bold text-[#374151]">No Conversation Sessions Found</h3>
                <p className="mt-1 text-xs text-[#9CA3AF]">
                  Full multi-turn chat threads will appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {auditSessions.map((s) => (
                  <div
                    key={s.conversationId}
                    className="flex flex-col justify-between rounded-2xl border border-[#E5E7EB] bg-[#FFFFFF] p-5 shadow-sm transition-all hover:border-[#CBD5E1] hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between border-b border-[#F3F4F6] pb-3">
                        <span className="font-mono text-xs font-semibold text-[#6366F1]">
                          Thread: {String(s.conversationId).slice(0, 16)}…
                        </span>
                        <span className="rounded-full bg-[#EEF2FF] px-2.5 py-0.5 text-xs font-bold text-[#4F46E5]">
                          {s.totalQueries} Queries
                        </span>
                      </div>

                      <h3 className="mt-3 text-sm font-bold text-[#111827]">
                        "{s.title || s.firstQuery || "Conversation Thread"}"
                      </h3>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-md bg-[#F0FDF4] px-2 py-0.5 text-xs font-semibold text-[#15803D]">
                          ✓ {s.successCount} Success
                        </span>
                        {s.failedCount > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-[#FEF2F2] px-2 py-0.5 text-xs font-semibold text-[#B91C1C]">
                            ✕ {s.failedCount} Failed
                          </span>
                        )}
                        <span className="rounded-md bg-[#F3F4F6] px-2 py-0.5 font-mono text-xs text-[#4B5563]">
                          ~{s.avgExecutionTimeMs} ms
                        </span>
                        <span className="text-xs text-[#9CA3AF]">
                          Last: {s.latestCreatedAt}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => fetchSessionDrilldown(s.conversationId)}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] py-2 text-xs font-bold text-[#374151] transition-all hover:bg-[#EEF2FF] hover:border-[#C7D2FE] hover:text-[#4338CA] cursor-pointer"
                    >
                      <Eye size={13} />
                      <span>Inspect Conversation Trace</span>
                    </button>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}

      {/* ── CONVERSATION DRILL-DOWN MODAL ── */}
      {selectedConversationId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-[#334155] bg-[#FFFFFF] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-4 bg-[#F8FAFC]">
              <div>
                <h3 className="text-base font-bold text-[#111827]">
                  Conversation Thread Inspector
                </h3>
                <p className="font-mono text-xs text-[#6B7280]">
                  Session ID: {selectedConversationId}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedConversationId(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0F172A]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loadingSessionDetail ? (
                <div className="flex h-40 items-center justify-center">
                  <Loader2 size={24} className="animate-spin text-[#6366F1]" />
                </div>
              ) : sessionDetailLogs.length === 0 ? (
                <p className="text-center text-sm text-[#64748B]">No query traces found in this thread.</p>
              ) : (
                sessionDetailLogs.map((q, idx) => (
                  <div key={q.UTD} className="rounded-xl border border-[#E2E8F0] p-4 bg-[#FFFFFF] shadow-sm">
                    <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-[#EEF2FF] px-2 py-0.5 text-xs font-bold text-[#4338CA]">
                          Turn #{idx + 1}
                        </span>
                        <StatusBadge label={q.statusCode} color={q.statusCode === "SUCCESS" ? "green" : "rose"} />
                        <span className="text-xs font-semibold text-[#475569]">{q.intent}</span>
                      </div>
                      <span className="font-mono text-xs text-[#94A3B8]">{q.executionTimeMs}ms • {q.createdAt}</span>
                    </div>

                    <div className="mt-2.5">
                      <p className="font-bold text-sm text-[#0F172A]">"{q.userQuery}"</p>
                    </div>

                    {q.generatedSql && (
                      <div className="mt-2.5 rounded-lg bg-[#0F172A] p-3 font-mono text-xs text-[#E2E8F0]">
                        <pre className="whitespace-pre-wrap">{q.generatedSql}</pre>
                      </div>
                    )}

                    {q.aiResponse && (
                      <div className="mt-2 rounded-lg bg-[#F8FAFC] p-3 text-xs text-[#334155]">
                        <p className="whitespace-pre-wrap">{q.aiResponse}</p>
                      </div>
                    )}

                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedConversationId(null);
                          handlePromoteToGoldenPattern(q);
                        }}
                        className="flex items-center gap-1.5 rounded-lg bg-[#FEF3C7] px-3 py-1.5 text-xs font-bold text-[#92400E] hover:bg-[#FDE68A]"
                      >
                        <Sparkles size={12} className="text-[#D97706]" />
                        <span>Promote to Golden Pattern</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-[#E5E7EB] bg-[#F8FAFC] px-6 py-3 text-right">
              <button
                type="button"
                onClick={() => setSelectedConversationId(null)}
                className="rounded-xl border border-[#D1D5DB] bg-[#FFFFFF] px-4 py-2 text-xs font-semibold text-[#374151] hover:bg-[#F3F4F6]"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          VIEW 3: TABLE SCHEMAS & RAG DOCUMENTS (EXISTING VIEW)
      ══════════════════════════════════════════════════════════ */}
      {activeTab === "schemas" && (
        <div className="grid gap-6 lg:grid-cols-5">

          {/* CARD 1: REGISTER SCHEMA (3/5 width) */}
          <div className="flex flex-col rounded-2xl border border-[#E5E7EB] bg-[#FFFFFF] shadow-sm lg:col-span-3">
            <div className="flex items-center justify-between border-b border-[#F3F4F6] px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF2FF]">
                  <PlusCircle size={16} className="text-[#6366F1]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#111827]">
                    Register Table Schema / Business Rule
                  </h2>
                  <p className="text-lg text-[#6B7280]">
                    Add ERP table descriptions for AI query discovery
                  </p>
                </div>
              </div>
              <StatusBadge label="MSSQL Live" color="blue" dot />
            </div>

            <form onSubmit={handleManualSubmit} className="flex flex-1 flex-col space-y-4 px-6 py-5">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Module Name" icon={<Server size={11} />} hint="ERP module">
                  <Input
                    value={form.moduleName}
                    onChange={(e) => setForm({ ...form, moduleName: e.target.value })}
                    placeholder="HR, SALES, INVENTORY…"
                    className="h-10 text-lg"
                  />
                </FormField>

                <FormField label="Document Type" icon={<FileText size={11} />}>
                  <select
                    value={form.documentType}
                    onChange={(e) => setForm({ ...form, documentType: e.target.value })}
                    className="h-10 w-full rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] px-3 text-lg outline-none focus:border-[#6366F1]"
                  >
                    <option value="TABLE_SCHEMA">TABLE_SCHEMA</option>
                    <option value="VIEW">VIEW</option>
                    <option value="BUSINESS_RULE">BUSINESS_RULE</option>
                    <option value="STATUS_MAPPING">STATUS_MAPPING</option>
                    <option value="POLICY">POLICY</option>
                  </select>
                </FormField>
              </div>

              <FormField label="Title" required icon={<Tag size={11} />} hint="Human-readable title">
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Employee Attendance Details"
                  required
                  className="h-10 text-lg"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Source Name" required icon={<Database size={11} />} hint="Physical table name">
                  <Input
                    value={form.sourceName}
                    onChange={(e) => setForm({ ...form, sourceName: e.target.value })}
                    placeholder="attendancetable"
                    required
                    className="h-10 text-lg"
                  />
                </FormField>

                <FormField label="Source Reference" required icon={<Link2 size={11} />} hint="Schema qualification">
                  <Input
                    value={form.sourceReference}
                    onChange={(e) => setForm({ ...form, sourceReference: e.target.value })}
                    placeholder="dbo.attendancetable"
                    required
                    className="h-10 text-lg"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Join Key" icon={<Hash size={11} />}>
                  <Input
                    value={form.metadata?.joinKey || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        metadata: { ...form.metadata, joinKey: e.target.value },
                      })
                    }
                    placeholder="Emp_Code"
                    className="h-10 text-lg"
                  />
                </FormField>

                <FormField label="Category" icon={<Tag size={11} />}>
                  <Input
                    value={form.metadata?.category || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        metadata: { ...form.metadata, category: e.target.value },
                      })
                    }
                    placeholder="Employee_master"
                    className="h-10 text-lg"
                  />
                </FormField>
              </div>

              <FormField label="Purpose / Description" icon={<FileText size={11} />} hint="Context for AI schema planner">
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={4}
                  className="w-full resize-none rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] p-3 text-lg outline-none focus:border-[#6366F1]"
                  placeholder={`Table: dbo.attendancetable\nPurpose: Daily employee attendance check-in/out records linked to payroll.\nKey Columns: Emp_Code, dateoffice, in1, out1, status, flag`}
                />
              </FormField>

              <button
                type="submit"
                disabled={loadingAction === "submit"}
                className={`mt-auto flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-lg font-semibold text-[#FFFFFF] shadow-md transition-all disabled:opacity-70 ${
                  loadingAction === "submit"
                    ? "bg-[#A5B4FC]"
                    : "bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:opacity-95 active:scale-[0.99]"
                }`}
              >
                {loadingAction === "submit" ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Registering &amp; Enriching Schema…
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    Register &amp; Auto-Enrich Schema
                  </>
                )}
              </button>
            </form>
          </div>

          {/* CARD 2: PROCESS & MANAGE (2/5 width) */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            <div className="rounded-2xl border border-[#E5E7EB] bg-[#FFFFFF] shadow-sm">
              <div className="flex items-center gap-3 border-b border-[#F3F4F6] px-5 py-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF2FF]">
                  <FileCheck size={16} className="text-[#6366F1]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#111827]">RAG Document Manager</h2>
                  <p className="text-lg text-[#6B7280]">Index, inspect &amp; deactivate schema vectors</p>
                </div>
              </div>

              <div className="space-y-4 px-5 py-5">
                <FormField label="Document ID" icon={<Hash size={11} />} hint="Numeric ID returned after registration">
                  <Input
                    value={documentIdInput}
                    onChange={(e) => setDocumentIdInput(e.target.value)}
                    placeholder="e.g. 101"
                    type="number"
                    min={1}
                    className="h-10 text-lg"
                  />
                </FormField>

                <div className="space-y-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleProcessDocument}
                    disabled={isSchemaLoading || !documentIdInput}
                    className="flex w-full items-center gap-3 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-4 py-2.5 text-left text-lg font-bold text-[#FFFFFF] shadow-sm transition-all hover:opacity-95 disabled:opacity-50"
                  >
                    <RefreshCw size={14} className={loadingAction === "process" ? "animate-spin" : ""} />
                    <span>{loadingAction === "process" ? "Indexing…" : "Index / Process Document"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCheckStatus}
                    disabled={isSchemaLoading || !documentIdInput}
                    className="flex w-full items-center gap-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-2.5 text-left text-lg font-semibold text-[#111827] hover:bg-[#F3F4F6] disabled:opacity-50"
                  >
                    <FileCheck size={14} className="text-[#6366F1]" />
                    <span>{loadingAction === "status" ? "Checking…" : "Check Document Status"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDeactivate}
                    disabled={isSchemaLoading || !documentIdInput}
                    className="flex w-full items-center gap-3 rounded-xl border border-[#FECACA] bg-[#FFF5F5] px-4 py-2.5 text-left text-lg font-semibold text-[#991B1B] hover:bg-[#FEE2E2] disabled:opacity-50"
                  >
                    <Trash2 size={14} className="text-[#EF4444]" />
                    <span>{loadingAction === "deactivate" ? "Deactivating…" : "Deactivate Document"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* How It Works Card */}
            <div className="rounded-2xl border border-[#E5E7EB] bg-[#FFFFFF] shadow-sm">
              <div className="flex items-center gap-2.5 border-b border-[#F3F4F6] px-5 py-3.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#EEF2FF]">
                  <BookOpen size={13} className="text-[#6366F1]" />
                </div>
                <h3 className="text-lg font-bold text-[#111827]">How Hybrid RAG Works</h3>
              </div>

              <div className="space-y-3.5 p-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-[#EFF6FF] p-1 text-[#2563EB]">
                    <Zap size={13} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-[#1E293B]">1. Semantic Chunk Matching</h4>
                    <p className="text-lg text-[#64748B]">
                      User questions are tokenized and scored against trained pattern clusters in 5ms.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-[#F0FDF4] p-1 text-[#16A34A]">
                    <Cpu size={13} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-[#1E293B]">2. Dynamic Parameter Adaptation</h4>
                    <p className="text-lg text-[#64748B]">
                      Placeholders like :empCode are automatically resolved from conversation memory.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-[#FAF5FF] p-1 text-[#9333EA]">
                    <CheckCircle size={13} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-[#1E293B]">3. Deterministic Safety Guard</h4>
                    <p className="text-lg text-[#64748B]">
                      SQL AST validation and entity-mismatch guards prevent execution errors or data leaks.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}