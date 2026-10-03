"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  ChevronDown,
  ChevronUp,
  Table as TableIcon,
  Zap,
  GraduationCap,
  BookOpen,
  Send,
  AlertCircle,
  Plus,
  HelpCircle,
  Cpu,
  Edit3,
  Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_URL;

interface AuditLogRecord {
  UTD: number;
  conversationId?: string;
  conversationTitle?: string;
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

interface ConversationGroup {
  conversationId: string;
  title: string;
  userId?: string;
  empCode?: string;
  role?: string;
  queries: AuditLogRecord[];
  totalQueries: number;
  successCount: number;
  failedCount: number;
  avgExecutionTimeMs: number;
  totalRows: number;
  latestCreatedAt: string;
  earliestCreatedAt: string;
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

const DEFAULT_TABLE_OPTIONS = [
  { value: "EMPLOYEEMASTER", label: "EMPLOYEEMASTER (Profile, 257 Cols, KYC, Branch)" },
  { value: "SALARYFILE", label: "SALARYFILE (Salary, Gross, Net, Basic, Deductions)" },
  { value: "attendancetable", label: "attendancetable (Haziri, Punch, Biometric, In/Out)" },
  { value: "Misc_Mst", label: "Misc_Mst (Leave Mst [92], Branch [85], Dept [11], Desg [95])" },
  { value: "Account_No_Api", label: "Account_No_Api (Penny Drop Bank Verification)" },
  { value: "emp_varify", label: "emp_varify (Aadhaar & PAN Verification Log)" },
  { value: "Asset_Issue", label: "Asset_Issue (IT Laptop, SIM, Hardware Assets)" },
  { value: "Approval_Matrix", label: "Approval_Matrix (Manager / HOD Approval Hierarchy)" },
  { value: "AI_SQL_Learning_Tbl", label: "AI_SQL_Learning_Tbl (Direct Knowledge)" },
  { value: "OTHER", label: "➕ OTHER (Type Custom ERP Table Name...)" },
];

const DEFAULT_INTENT_OPTIONS = [
  { value: "SALARY_QUERY", label: "SALARY_QUERY (Payroll / Earnings / Deductions)" },
  { value: "ATTENDANCE_QUERY", label: "ATTENDANCE_QUERY (Present / Absent / Mis-punch)" },
  { value: "LEAVE_POLICY", label: "LEAVE_POLICY (Casual / Sick / Privilege Leave)" },
  { value: "EMPLOYEE_PROFILE", label: "EMPLOYEE_PROFILE (Personal, Contact, Family, DOJ)" },
  { value: "BANK_VERIFICATION", label: "BANK_VERIFICATION (Penny Drop / Account Status)" },
  { value: "KYC_VERIFICATION", label: "KYC_VERIFICATION (PAN / Aadhaar Match)" },
  { value: "ASSET_MANAGEMENT", label: "ASSET_MANAGEMENT (Hardware / Devices)" },
  { value: "FINANCIAL_YEAR", label: "FINANCIAL_YEAR (FY / Quarter Analytics)" },
  { value: "CUSTOM_SQL", label: "CUSTOM_SQL (Advanced Custom Reporting)" },
  { value: "OTHER", label: "➕ OTHER (Type Custom Intent Category...)" },
];

// Helper to accurately format audit timestamps in Indian Standard Time (IST)
// without unwanted UTC forward skew (+5:30) caused by MSSQL datetime serialization
const formatAuditDateTime = (dateStr?: string | Date | null) => {
  if (!dateStr) return { date: "-", time: "-", full: "-" };
  try {
    let cleanStr = typeof dateStr === "string" ? dateStr.trim() : String(dateStr);
    if (typeof cleanStr === "string") {
      if (cleanStr.endsWith("Z") && !cleanStr.includes("+")) {
        cleanStr = cleanStr.slice(0, -1);
      }
      cleanStr = cleanStr.replace(" ", "T");
    }
    const d = new Date(cleanStr);
    if (isNaN(d.getTime())) return { date: String(dateStr), time: "", full: String(dateStr) };

    const time = d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
    const date = d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    return { date, time, full: `${date}, ${time}` };
  } catch (_) {
    return { date: String(dateStr), time: "", full: String(dateStr) };
  }
};

export default function AIQueryAuditPage() {
  const user = useCurrentUser();
  const { toast } = useToast();

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
    limit: 50,
    totalRecords: 0,
    totalPages: 1,
    hasMore: false,
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedRecord, setSelectedRecord] = useState<AuditLogRecord | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // ── VIEW MODE: "CONVERSATION" (DEFAULT) vs "TABLE" ──
  const [viewMode, setViewMode] = useState<"conversation" | "table">("conversation");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionSearch, setSessionSearch] = useState<string>("");
  const [sidebarFilter, setSidebarFilter] = useState<"ALL" | "SUCCESS" | "FAILED">("ALL");
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // ── TABS: "AUDIT" vs "RULES" ──
  const [activeTab, setActiveTab] = useState<"audit" | "rules">("audit");
  const [trainedRules, setTrainedRules] = useState<any[]>([]);
  const [isRulesLoading, setIsRulesLoading] = useState<boolean>(false);
  const [rulesSearch, setRulesSearch] = useState<string>("");

  // ── AI TRAINING / FINE-TUNING MODAL STATE ──
  const [trainModalOpen, setTrainModalOpen] = useState<boolean>(false);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [trainRecord, setTrainRecord] = useState<AuditLogRecord | null>(null);
  const [editingRuleUtd, setEditingRuleUtd] = useState<number | null>(null);
  const [trainActionType, setTrainActionType] = useState<"GOLDEN" | "CORRECTION" | "RULE" | "HELPFUL">("GOLDEN");
  const [trainQuery, setTrainQuery] = useState<string>("");
  const [trainSql, setTrainSql] = useState<string>("");
  const [trainTableSelect, setTrainTableSelect] = useState<string>("EMPLOYEEMASTER");
  const [customTrainTable, setCustomTrainTable] = useState<string>("");
  const [trainIntentSelect, setTrainIntentSelect] = useState<string>("SALARY_QUERY");
  const [customTrainIntent, setCustomTrainIntent] = useState<string>("");
  const [trainComment, setTrainComment] = useState<string>("");
  const [trainSynonyms, setTrainSynonyms] = useState<string>("");
  const [sqlSyntaxStatus, setSqlSyntaxStatus] = useState<{ valid: boolean; message: string } | null>(null);

  // ── LIVE SQL TESTING STATE ──
  const [isTestingSql, setIsTestingSql] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    success: boolean;
    rowCount?: number;
    latencyMs?: number;
    columns?: string[];
    rows?: any[];
    error?: string;
  } | null>(null);

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
    async (pageNumber = 1, currentStatus = statusFilter, currentSearch = searchTerm, isAppend = false) => {
      if (isAppend) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
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
          const incoming: AuditLogRecord[] = res.data.data || [];
          if (isAppend) {
            setLogs((prev) => {
              const existingUtds = new Set(prev.map((l) => l.UTD));
              const newUnique = incoming.filter((l) => !existingUtds.has(l.UTD));
              return [...prev, ...newUnique];
            });
          } else {
            setLogs(incoming);
          }
          if (res.data.stats) setStats(res.data.stats);
          if (res.data.pagination) setPagination(res.data.pagination);
        }
      } catch (err) {
        console.error("Failed to load AI audit logs:", err);
      } finally {
        if (isAppend) {
          setIsLoadingMore(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [buildAIHeaders, pagination.limit, searchTerm, statusFilter]
  );

  const fetchTrainedRules = useCallback(async () => {
    setIsRulesLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/ai/rules`, {
        headers: buildAIHeaders(),
      });
      if (res.data?.success) {
        setTrainedRules(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch trained AI rules:", err);
    } finally {
      setIsRulesLoading(false);
    }
  }, [buildAIHeaders]);

  // Initial load
  useEffect(() => {
    fetchAuditLogs(1, "ALL", "");
    fetchTrainedRules();
  }, []);

  // Group logs by Conversation ID
  const conversationGroups = useMemo<ConversationGroup[]>(() => {
    const map = new Map<string, ConversationGroup>();

    logs.forEach((log) => {
      const rawCid = log.conversationId ? String(log.conversationId).trim() : "";
      const cid = rawCid && rawCid !== "null" && rawCid !== "undefined" ? rawCid : `direct_${log.UTD}`;

      if (!map.has(cid)) {
        map.set(cid, {
          conversationId: cid,
          title: log.conversationTitle || (rawCid ? `Session • ${rawCid.slice(0, 8)}...` : log.userQuery || "Direct Query"),
          userId: log.userId,
          empCode: log.empCode,
          role: log.role,
          queries: [],
          totalQueries: 0,
          successCount: 0,
          failedCount: 0,
          avgExecutionTimeMs: 0,
          totalRows: 0,
          latestCreatedAt: log.createdAt,
          earliestCreatedAt: log.createdAt,
        });
      }

      const group = map.get(cid)!;
      group.queries.push(log);
      group.totalQueries++;
      if (log.statusCode === "SUCCESS") group.successCount++;
      else group.failedCount++;
      group.totalRows += (log.rowsReturned || 0);

      if (log.conversationTitle && (!group.title || group.title.startsWith("Session • ") || group.title === "Direct Query")) {
        group.title = log.conversationTitle;
      }
      if (new Date(log.createdAt).getTime() > new Date(group.latestCreatedAt).getTime()) {
        group.latestCreatedAt = log.createdAt;
      }
      if (new Date(log.createdAt).getTime() < new Date(group.earliestCreatedAt).getTime()) {
        group.earliestCreatedAt = log.createdAt;
      }
    });

    const result = Array.from(map.values()).map((g) => {
      const sumLatency = g.queries.reduce((acc, q) => acc + (q.executionTimeMs || 0), 0);
      g.avgExecutionTimeMs = g.queries.length > 0 ? Math.round(sumLatency / g.queries.length) : 0;
      // Sort queries within the conversation chronologically (turn 1, turn 2, ...)
      g.queries.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      // If title is just Session ID fallback, pick the first user query as conversation title
      if (!g.title || g.title.startsWith("Session • ") || g.title === "Direct Query") {
        g.title = g.queries[0]?.userQuery || g.title;
      }
      return g;
    });

    // Sort conversations so the newest active conversation is on top
    result.sort((a, b) => new Date(b.latestCreatedAt).getTime() - new Date(a.latestCreatedAt).getTime());
    return result;
  }, [logs]);

  // Auto-select the first conversation when loaded or updated
  useEffect(() => {
    if (conversationGroups.length > 0) {
      setSelectedSessionId((prev) => {
        if (prev && conversationGroups.some((g) => g.conversationId === prev)) {
          return prev;
        }
        return conversationGroups[0].conversationId;
      });
    } else {
      setSelectedSessionId(null);
    }
  }, [conversationGroups]);

  const filteredSidebarSessions = useMemo(() => {
    let list = conversationGroups;
    if (sidebarFilter === "SUCCESS") {
      list = list.filter((g) => g.failedCount === 0);
    } else if (sidebarFilter === "FAILED") {
      list = list.filter((g) => g.failedCount > 0);
    }
    if (!sessionSearch.trim()) return list;
    const q = sessionSearch.toLowerCase().trim();
    return list.filter(
      (g) =>
        g.title?.toLowerCase().includes(q) ||
        g.conversationId?.toLowerCase().includes(q) ||
        g.userId?.toLowerCase().includes(q) ||
        g.empCode?.toLowerCase().includes(q) ||
        g.queries?.some((item) => item.userQuery?.toLowerCase().includes(q))
    );
  }, [conversationGroups, sessionSearch, sidebarFilter]);

  const activeSession = useMemo(() => {
    if (!selectedSessionId) return conversationGroups[0] || null;
    return (
      conversationGroups.find((g) => g.conversationId === selectedSessionId) ||
      conversationGroups[0] ||
      null
    );
  }, [conversationGroups, selectedSessionId]);

  const handleLoadMore = useCallback(async () => {
    if (isLoading || isLoadingMore) return;
    if (pagination.page >= pagination.totalPages) return;
    await fetchAuditLogs(pagination.page + 1, statusFilter, searchTerm, true);
  }, [fetchAuditLogs, isLoading, isLoadingMore, pagination.page, pagination.totalPages, statusFilter, searchTerm]);

  const handleSidebarScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 100) {
      if (!isLoading && !isLoadingMore && pagination.page < pagination.totalPages) {
        handleLoadMore();
      }
    }
  }, [isLoading, isLoadingMore, pagination.page, pagination.totalPages, handleLoadMore]);

  // Infinite scroll listener via IntersectionObserver for sentinel element
  useEffect(() => {
    if (viewMode !== "conversation") return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0]?.isIntersecting &&
          !isLoading &&
          !isLoadingMore &&
          pagination.page < pagination.totalPages
        ) {
          handleLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: "150px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [viewMode, isLoading, isLoadingMore, pagination.page, pagination.totalPages, handleLoadMore]);

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

  // ── OPEN TRAINING MODAL (FROM DOUBLE CLICK OR TRAIN BUTTON) ──
  const handleOpenTrainModal = (record?: AuditLogRecord | null, existingRule?: any) => {
    setTestResult(null);
    if (existingRule) {
      setTrainRecord(null);
      setEditingRuleUtd(existingRule.UTD || null);
      setTrainQuery(existingRule.Normalized_Question || "");
      setTrainSql(existingRule.SQL_Query || "");

      const rawTable = existingRule.Tables_Used ? existingRule.Tables_Used.split(",")[0].trim() : "EMPLOYEEMASTER";
      const matchedTable = DEFAULT_TABLE_OPTIONS.find((t) => t.value.toLowerCase() === rawTable.toLowerCase());
      if (matchedTable && matchedTable.value !== "OTHER") {
        setTrainTableSelect(matchedTable.value);
        setCustomTrainTable("");
      } else {
        setTrainTableSelect("OTHER");
        setCustomTrainTable(rawTable || "");
      }

      const rawIntent = existingRule.Intent || "CUSTOM_SQL";
      const matchedIntent = DEFAULT_INTENT_OPTIONS.find((i) => i.value.toLowerCase() === rawIntent.toLowerCase());
      if (matchedIntent && matchedIntent.value !== "OTHER") {
        setTrainIntentSelect(matchedIntent.value);
        setCustomTrainIntent("");
      } else {
        setTrainIntentSelect("OTHER");
        setCustomTrainIntent(rawIntent || "");
      }

      setTrainComment(`Custom AI Golden Query Rule`);
      setTrainActionType("GOLDEN");
    } else if (record) {
      setEditingRuleUtd(null);
      setTrainRecord(record);
      setTrainQuery(record.userQuery || "");
      setTrainSql(record.generatedSql || "");

      const rawTable = record.tablesUsed ? record.tablesUsed.split(",")[0].trim() : "EMPLOYEEMASTER";
      const matchedTable = DEFAULT_TABLE_OPTIONS.find((t) => t.value.toLowerCase() === rawTable.toLowerCase());
      if (matchedTable && matchedTable.value !== "OTHER") {
        setTrainTableSelect(matchedTable.value);
        setCustomTrainTable("");
      } else {
        setTrainTableSelect("OTHER");
        setCustomTrainTable(rawTable || "");
      }

      const rawIntent = record.intent || "SALARY_QUERY";
      const matchedIntent = DEFAULT_INTENT_OPTIONS.find((i) => i.value.toLowerCase() === rawIntent.toLowerCase());
      if (matchedIntent && matchedIntent.value !== "OTHER") {
        setTrainIntentSelect(matchedIntent.value);
        setCustomTrainIntent("");
      } else {
        setTrainIntentSelect("OTHER");
        setCustomTrainIntent(rawIntent || "");
      }

      setTrainComment(
        record.statusCode === "FAILED"
          ? `Correcting failed query execution. Error was: ${record.errorMessage || "Unknown error"}`
          : `Verified golden rule for: ${record.userQuery}`
      );
      setTrainActionType(record.statusCode === "FAILED" ? "CORRECTION" : "GOLDEN");
    } else {
      setEditingRuleUtd(null);
      setTrainRecord(null);
      setTrainQuery("");
      setTrainSql("SELECT TOP 50 EMPCODE, EMPFIRSTNAME, EMPLASTNAME, MOBILENO FROM [dbo].[EMPLOYEEMASTER] WITH (NOLOCK)");
      setTrainTableSelect("EMPLOYEEMASTER");
      setCustomTrainTable("");
      setTrainIntentSelect("CUSTOM_SQL");
      setCustomTrainIntent("");
      setTrainComment("Custom training rule added by administrator");
      setTrainActionType("GOLDEN");
    }
    setTrainSynonyms("");
    setSqlSyntaxStatus(null);
    setTrainModalOpen(true);
  };

  // ── VALIDATE SQL SYNTAX HELPER ──
  const validateSqlSyntax = () => {
    const raw = trainSql.trim();
    if (!raw) {
      setSqlSyntaxStatus({ valid: false, message: "SQL statement cannot be empty." });
      return false;
    }
    if (!/^\s*(SELECT|WITH)\b/i.test(raw)) {
      setSqlSyntaxStatus({ valid: false, message: "Only SELECT or WITH queries are permitted for safety." });
      return false;
    }
    if (/\b(DROP|DELETE|UPDATE|INSERT|ALTER|TRUNCATE|EXEC|EXECUTE|CREATE)\b/i.test(raw)) {
      setSqlSyntaxStatus({ valid: false, message: "Modifying statements (DROP, DELETE, UPDATE, INSERT) are blocked." });
      return false;
    }
    setSqlSyntaxStatus({ valid: true, message: "✅ SQL query syntax passes safety & read-only validation." });
    return true;
  };

  // ── TEST RUN SQL LIVE AGAINST MSSQL ──
  const handleTestLiveSQL = async () => {
    if (!validateSqlSyntax()) {
      toast({
        title: "Validation Error",
        description: "Please write a valid SELECT query before testing.",
        variant: "destructive",
      });
      return;
    }

    setIsTestingSql(true);
    setTestResult(null);
    try {
      const res = await axios.post(
        `${BASE_URL}/ai/test-sql`,
        { sql: trainSql.trim() },
        { headers: buildAIHeaders() }
      );

      if (res.data?.success) {
        setTestResult({
          tested: true,
          success: true,
          rowCount: res.data.rowCount,
          latencyMs: res.data.latencyMs,
          columns: res.data.columns || [],
          rows: res.data.rows || [],
        });
        toast({
          title: "✅ SQL Test Succeeded!",
          description: `Query executed in ${res.data.latencyMs}ms. Returned ${res.data.rowCount} row(s).`,
        });
      } else {
        setTestResult({
          tested: true,
          success: false,
          error: res.data?.error || "SQL execution failed",
        });
        toast({
          title: "❌ SQL Execution Error",
          description: res.data?.error || "Please check column/table names in your query.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      setTestResult({
        tested: true,
        success: false,
        error: err?.response?.data?.message || err?.message || "Execution failed",
      });
      toast({
        title: "Test Error",
        description: err?.response?.data?.message || err?.message || "Execution failed",
        variant: "destructive",
      });
    } finally {
      setIsTestingSql(false);
    }
  };

  // ── DELETE A TRAINED RULE ──
  const handleDeleteRule = async (utd: number, question: string) => {
    if (!confirm(`Are you sure you want to delete the rule for: "${question}"?`)) {
      return;
    }

    try {
      const res = await axios.post(
        `${BASE_URL}/ai/rules/delete`,
        { utd, question },
        { headers: buildAIHeaders() }
      );
      if (res.data?.success) {
        toast({
          title: "Rule Deleted",
          description: `Trained rule removed from AI memory.`,
        });
        fetchTrainedRules();
      }
    } catch (err: any) {
      toast({
        title: "Delete Failed",
        description: err?.response?.data?.message || err?.message,
        variant: "destructive",
      });
    }
  };

  // ── SUBMIT AI TRAINING (RLHF FEEDBACK / RULES SAVE) ──
  const handleSaveAndTrainAI = async () => {
    if (!trainQuery.trim()) {
      toast({
        title: "Validation Error",
        description: "Question / Prompt is required to train the AI.",
        variant: "destructive",
      });
      return;
    }

    if (!validateSqlSyntax()) {
      toast({
        title: "SQL Validation Error",
        description: sqlSyntaxStatus?.message || "Please check your SQL syntax.",
        variant: "destructive",
      });
      return;
    }

    const effectiveTable =
      trainTableSelect === "OTHER"
        ? customTrainTable.trim() || "EMPLOYEEMASTER"
        : trainTableSelect;

    const effectiveIntent =
      trainIntentSelect === "OTHER"
        ? customTrainIntent.trim() || "CUSTOM_SQL"
        : trainIntentSelect;

    setIsTraining(true);
    try {
      const payload = {
        utd: editingRuleUtd || trainRecord?.UTD || null,
        auditUtd: trainRecord?.UTD || null,
        conversationId: trainRecord?.conversationId || null,
        userQuery: trainQuery.trim(),
        question: trainQuery.trim(),
        correctSQL: trainSql.trim(),
        sql: trainSql.trim(),
        intent: effectiveIntent,
        targetTable: effectiveTable,
        feedbackType: trainActionType,
        userComment: trainComment.trim(),
        synonyms: trainSynonyms.trim() || undefined,
      };

      const res = await axios.post(`${BASE_URL}/ai/rules/save`, payload, {
        headers: buildAIHeaders(),
      });

      if (res.data?.success) {
        toast({
          title: "🎉 AI Model Trained Successfully!",
          description: "Golden query and correction rules saved. In-memory caches purged for instant learning.",
        });
        setTrainModalOpen(false);
        fetchAuditLogs(pagination.page, statusFilter, searchTerm);
        fetchTrainedRules();
      } else {
        toast({
          title: "Training Warning",
          description: res.data?.message || "Training received with warning.",
        });
      }
    } catch (err: any) {
      console.error("AI Training failed:", err);
      toast({
        title: "Training Failed",
        description: err?.response?.data?.message || err?.message || "Failed to train AI model.",
        variant: "destructive",
      });
    } finally {
      setIsTraining(false);
    }
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
      `"${formatAuditDateTime(l.createdAt).full}"`,
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
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#193A69] dark:text-white">
                  AI Query Logs, Audit & Model Training
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-lg font-bold bg-[#ecfdf5] dark:bg-[#022c22]/50 text-[#047857] dark:text-[#34d399] border border-[#a7f3d0] dark:border-[#065f46] flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#10b981] animate-pulse"></span>
                  Live RLHF Training
                </span>
              </div>
              <p className="text-lg sm:text-lg text-[#64748b] dark:text-[#94a3b8] mt-0.5">
                Double-click any query row or click &quot;Train AI&quot; to teach golden SQL rules, fix queries & fine-tune the AI Copilot.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap">
            <Button
              onClick={() => handleOpenTrainModal(null)}
              variant="input"
              size="sm"
              className="h-10 px-4 gap-2 text-lg font-bold bg-gradient-to-r from-[#d97706] via-primary to-[#4f46e5] hover:from-[#b45309] hover:to-[#4338ca] text-white shadow-md shadow-primary/20"
            >
              {/* <Zap className="h-4 w-4 text-[#fcd34d] fill-[#fcd34d]" /> */}
              + Train New AI Rule
            </Button>

            <Link href="/autovyn/admin/Ai_Assistance/Ai_Assistant_Page">
              <Button
                variant="outline"
                size="sm"
                className="h-10 px-3.5 gap-2 text-lg font-bold border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] text-[#193A69] dark:text-white hover:bg-[#f1f5f9] dark:hover:bg-[#334155]"
              >
                {/* <MessageSquare className="h-4 w-4 text-primary" /> */}
                AI Assistant
              </Button>
            </Link>

            <Link href="/autovyn/admin/Ai_Assistance/Ai_Assistant_Descr">
              <Button
                variant="outline"
                size="sm"
                className="h-10 px-3.5 gap-2 text-lg font-bold border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] text-[#193A69] dark:text-white hover:bg-[#f1f5f9] dark:hover:bg-[#334155]"
              >
                {/* <Layers className="h-4 w-4 text-[#6366f1]" /> */}
                Knowledge Base
              </Button>
            </Link>

            <Button
              onClick={() => fetchAuditLogs(pagination.page, statusFilter, searchTerm)}
              variant="outline"
              size="sm"
              disabled={isLoading}
              className="h-10 px-3.5 gap-2 text-lg border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] text-[#193A69] dark:text-white font-bold"
            >
              {/* <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} /> */}
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
              <span className="text-lg font-bold text-[#64748b] dark:text-[#94a3b8]">Total Queries</span>
              <div className="h-9 w-9 rounded-lg bg-[#eff6ff] dark:bg-[#1e3a8a]/40 text-[#2563eb] dark:text-[#60a5fa] flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-[#193A69] dark:text-white">
                {stats.totalQueries.toLocaleString()}
              </span>
              <span className="text-lg text-[#94a3b8]">lifetime</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-4 sm:p-5 shadow-xs hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-[#64748b] dark:text-[#94a3b8]">Today&apos;s Queries</span>
              <div className="h-9 w-9 rounded-lg bg-[#eef2ff] dark:bg-[#312e81]/40 text-[#4f46e5] dark:text-[#818cf8] flex items-center justify-center">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-[#193A69] dark:text-white">
                {stats.todayQueriesCount.toLocaleString()}
              </span>
              <span className="text-lg text-primary font-bold">today</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-4 sm:p-5 shadow-xs hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-[#64748b] dark:text-[#94a3b8]">Success Rate</span>
              <div className="h-9 w-9 rounded-lg bg-[#ecfdf5] dark:bg-[#064e3b]/40 text-[#059669] dark:text-[#34d399] flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-[#059669] dark:text-[#34d399]">
                {stats.successRate}
              </span>
              <span className="text-lg text-[#94a3b8]">accuracy</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-4 sm:p-5 shadow-xs hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-[#64748b] dark:text-[#94a3b8]">Avg Latency</span>
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
              <span className="text-lg font-bold text-[#64748b] dark:text-[#94a3b8]">Active Users</span>
              <div className="h-9 w-9 rounded-lg bg-[#faf5ff] dark:bg-[#581c87]/40 text-[#9333ea] dark:text-[#c084fc] flex items-center justify-center">
                <User className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-[#193A69] dark:text-white">
                {stats.activeUsersCount}
              </span>
              <span className="text-lg text-[#94a3b8]">emp / users</span>
            </div>
          </div>
        </div>

        {/* ── TABS BAR (AUDIT LOGS vs TRAINED RULES) ── */}
        <div className="flex items-center gap-3 border-b border-[#e2e8f0] dark:border-[#334155] pb-3 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab("audit")}
            className={`px-4 py-2.5 rounded-xl font-bold text-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "audit"
                ? "bg-[#193A69] text-white shadow-md shadow-[#193A69]/20 ring-2 ring-[#193A69]/40"
                : "bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] text-[#64748b] dark:text-[#94a3b8] hover:bg-[#f1f5f9] dark:hover:bg-[#334155]"
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>📊 AI Query Audit Logs</span>
            <span className={`px-2 py-0.5 text-lg rounded-full font-extrabold ${activeTab === "audit" ? "bg-white/20 text-white" : "bg-[#f1f5f9] dark:bg-[#0f172a] text-[#193A69] dark:text-white"}`}>
              {pagination.totalRecords || logs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("rules");
              fetchTrainedRules();
            }}
            className={`px-4 py-2.5 rounded-xl font-bold text-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "rules"
                ? "bg-gradient-to-r from-[#d97706] via-[#f59e0b] to-[#b45309] text-white shadow-md shadow-[#d97706]/20 ring-2 ring-[#f59e0b]/40"
                : "bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] text-[#64748b] dark:text-[#94a3b8] hover:bg-[#f1f5f9] dark:hover:bg-[#334155]"
            }`}
          >
            <Zap className="h-4 w-4 fill-current text-[#fef08a]" />
            <span>🧠 Trained AI Rules & Golden Queries</span>
            <span className={`px-2 py-0.5 text-lg rounded-full font-extrabold ${activeTab === "rules" ? "bg-white/20 text-white" : "bg-[#fef3c7] dark:bg-[#451a03]/60 text-[#b45309] dark:text-[#fde68a]"}`}>
              {trainedRules.length}
            </span>
          </button>
        </div>

        {activeTab === "rules" ? (
          /* ── TAB 2: TRAINED RULES & GOLDEN QUERIES MANAGEMENT ── */
          <div className="space-y-4">
            <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#94a3b8]" />
                <Input
                  placeholder="Filter trained rules by question, table, or intent..."
                  value={rulesSearch}
                  onChange={(e) => setRulesSearch(e.target.value)}
                  className="pl-11 pr-9 h-11 text-lg bg-[#f8fafc] dark:bg-[#0f172a] border-[#e2e8f0] dark:border-[#334155] text-[#1e293b] dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 self-end md:self-auto">
                <Button
                  onClick={() => handleOpenTrainModal(null)}
                  variant="input"
                  size="sm"
                  className="h-11 px-5 gap-2 text-lg font-bold bg-[#d97706] hover:bg-[#b45309] text-white shadow-xs"
                >
                  {/* <Plus className="h-4 w-4" /> */}
                  Add New Golden Rule
                </Button>
                <Button
                  onClick={fetchTrainedRules}
                  variant="outline"
                  size="sm"
                  disabled={isRulesLoading}
                  className="h-11 px-4 gap-2 text-lg border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] text-[#193A69] dark:text-white font-bold"
                >
                  {/* <RefreshCw className={`h-4 w-4 ${isRulesLoading ? "animate-spin" : ""}`} /> */}
                  Refresh
                </Button>
              </div>
            </div>

            {/* Rules Table */}
            <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#e2e8f0] dark:border-[#334155] bg-[#f8fafc] dark:bg-[#0f172a]/70 text-lg font-extrabold uppercase tracking-wider text-[#64748b] dark:text-[#94a3b8]">
                      {/* <th className="py-3.5 px-4"># UTD</th> */}
                      <th className="py-3.5 px-4 min-w-[220px]">Trigger Question / Phrase</th>
                      <th className="py-3.5 px-4">Target Table</th>
                      <th className="py-3.5 px-4">Intent</th>
                      <th className="py-3.5 px-4 min-w-[280px]">Trained Microsoft SQL Query</th>
                      <th className="py-3.5 px-4 text-center">Hits</th>
                      <th className="py-3.5 px-4">Last Verified</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e8f0] dark:divide-[#334155] text-lg">
                    {isRulesLoading ? (
                      <tr>
                        <td colSpan={8} className="py-16 text-center text-[#64748b]">
                          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                          Loading trained golden rules...
                        </td>
                      </tr>
                    ) : trainedRules.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-16 text-center text-[#64748b]">
                          <Zap className="h-10 w-10 text-[#d97706] opacity-40 mx-auto mb-3" />
                          <div className="text-lg font-bold text-[#193A69] dark:text-white">No Trained Rules Found</div>
                          <p className="text-lg text-[#94a3b8] mt-1 max-w-md mx-auto">
                            Train your first query by clicking &quot;+ Add New Golden Rule&quot; or double-clicking any query from the Audit tab.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      trainedRules
                        .filter((r) => {
                          if (!rulesSearch.trim()) return true;
                          const s = rulesSearch.toLowerCase();
                          return (
                            (r.Normalized_Question && r.Normalized_Question.toLowerCase().includes(s)) ||
                            (r.Tables_Used && r.Tables_Used.toLowerCase().includes(s)) ||
                            (r.Intent && r.Intent.toLowerCase().includes(s)) ||
                            (r.SQL_Query && r.SQL_Query.toLowerCase().includes(s))
                          );
                        })
                        .map((r, idx) => (
                          <tr
                            key={r.UTD || idx}
                            className="hover:bg-[#f8fafc] dark:hover:bg-[#0f172a]/40 transition-colors"
                          >
                            {/* <td className="py-3.5 px-4 font-mono font-bold text-[#64748b] text-lg">
                              #{r.UTD}
                            </td> */}
                            <td className="py-3.5 px-4 font-bold text-[#193A69] dark:text-white">
                              {r.Normalized_Question}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2.5 py-1 rounded-md text-lg font-bold bg-[#eff6ff] dark:bg-[#1e3a8a]/40 text-[#2563eb] dark:text-[#93c5fd] border border-[#bfdbfe] dark:border-[#1e3a8a]">
                                {r.Tables_Used || "ERP_MASTER"}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-[#64748b] dark:text-[#94a3b8] font-medium text-lg">
                              {r.Intent || "DYNAMIC_CUSTOM"}
                            </td>
                            <td className="py-3.5 px-4">
                              <pre className="p-2 rounded-lg bg-[#0f172a] text-[#93c5fd] font-mono text-lg max-w-md overflow-x-auto truncate">
                                <code>{r.SQL_Query}</code>
                              </pre>
                            </td>
                            <td className="py-3.5 px-4 text-center font-bold text-[#059669]">
                              {r.Success_Count || 1}
                            </td>
                            <td className="py-3.5 px-4 text-lg text-[#64748b] whitespace-nowrap">
                              {r.Last_Verified_At ? new Date(r.Last_Verified_At).toLocaleDateString("en-IN") : "-"}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  onClick={() => handleOpenTrainModal(null, r)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2.5 text-lg font-bold text-[#2563eb] hover:bg-[#eff6ff] dark:hover:bg-[#1e3a8a]/40"
                                >
                                  <Edit3 className="h-3.5 w-3.5 mr-1" />
                                  Edit / Test
                                </Button>
                                <Button
                                  onClick={() => handleDeleteRule(r.UTD, r.Normalized_Question)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2 text-lg font-bold text-[#e11d48] hover:bg-[#fff1f2] dark:hover:bg-[#450a0a]/40"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* ── TAB 1: AUDIT & TELEMETRY CONTROLS & TABLE ── */
          <>
            {/* ── CONTROLS & FILTER BAR ── */}
            <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
              <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2.5">
                <div className="relative flex-1 max-w-lg">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#94a3b8]" />
                  <Input
                    placeholder="Search by question, SQL, employee code, user..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-11 pr-9 h-11 text-lg sm:text-[16px] bg-[#f8fafc] dark:bg-[#0f172a] border-[#e2e8f0] dark:border-[#334155] text-[#1e293b] dark:text-white"
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
                  className="h-11 px-4 text-lg font-bold bg-[#f1f5f9] dark:bg-[#334155] text-[#193A69] dark:text-white hover:bg-[#e2e8f0]"
                >
                  Search
                </Button>
              </form>

              <div className="flex items-center gap-2.5 flex-wrap self-end md:self-auto">
                {/* View Mode Toggle: Conversation vs Flat Table */}
                <div className="flex items-center bg-[#f1f5f9] dark:bg-[#0f172a] p-1 rounded-lg border border-[#e2e8f0] dark:border-[#334155]">
                  <button
                    type="button"
                    onClick={() => setViewMode("conversation")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-bold rounded-md transition-colors ${
                      viewMode === "conversation"
                        ? "bg-white dark:bg-[#1e293b] text-[#193A69] dark:text-white shadow-xs"
                        : "text-[#64748b] dark:text-[#94a3b8] hover:text-[#193A69] dark:hover:text-white"
                    }`}
                    title="Group questions by conversation session"
                  >
                    <MessageSquare className="h-4 w-4 text-blue-500" />
                    <span>Conversation Wise</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("table")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-bold rounded-md transition-colors ${
                      viewMode === "table"
                        ? "bg-white dark:bg-[#1e293b] text-[#193A69] dark:text-white shadow-xs"
                        : "text-[#64748b] dark:text-[#94a3b8] hover:text-[#193A69] dark:hover:text-white"
                    }`}
                    title="View individual queries in flat table"
                  >
                    <TableIcon className="h-4 w-4" />
                    <span>Flat Queries</span>
                  </button>
                </div>

                {/* Status Filter */}
                <div className="flex items-center bg-[#f1f5f9] dark:bg-[#0f172a] p-1 rounded-lg border border-[#e2e8f0] dark:border-[#334155]">
                  <button
                    onClick={() => handleStatusChange("ALL")}
                    className={`px-3 py-1.5 text-lg font-bold rounded-md transition-colors ${
                      statusFilter === "ALL"
                        ? "bg-white dark:bg-[#1e293b] text-[#193A69] dark:text-white shadow-xs"
                        : "text-[#64748b] dark:text-[#94a3b8] hover:text-[#1e293b]"
                    }`}
                  >
                    All ({stats.totalQueries})
                  </button>
                  <button
                    onClick={() => handleStatusChange("SUCCESS")}
                    className={`px-3 py-1.5 text-lg font-bold rounded-md transition-colors ${
                      statusFilter === "SUCCESS"
                        ? "bg-white dark:bg-[#1e293b] text-[#059669] dark:text-[#34d399] shadow-xs"
                        : "text-[#64748b] dark:text-[#94a3b8] hover:text-[#059669]"
                    }`}
                  >
                    Success ({stats.successQueries})
                  </button>
                  <button
                    onClick={() => handleStatusChange("FAILED")}
                    className={`px-3 py-1.5 text-lg font-bold rounded-md transition-colors ${
                      statusFilter === "FAILED"
                        ? "bg-white dark:bg-[#1e293b] text-[#e11d48] dark:text-[#fda4af] shadow-xs"
                        : "text-[#64748b] dark:text-[#94a3b8] hover:text-[#e11d48]"
                    }`}
                  >
                    Failed ({stats.failedQueries})
                  </button>
                </div>

                <Button
                  onClick={handleExportCSV}
                  variant="outline"
                  size="sm"
                  className="h-11 px-3.5 gap-2 text-lg font-bold border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] text-[#193A69] dark:text-white"
                >
                  Export CSV
                </Button>
              </div>
            </div>

            {/* ── CONVERSATION WISE VIEW: SIDEBAR + DETAIL THREAD ── */}
            {viewMode === "conversation" ? (
              isLoading ? (
                <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-16 text-center text-[#64748b] dark:text-[#94a3b8] shadow-xs">
                  <RefreshCw className="h-8 w-8 animate-spin text-[#193A69] dark:text-blue-400 mx-auto mb-3" />
                  <div className="text-base font-bold text-[#1e293b] dark:text-white">Loading conversations...</div>
                  <p className="text-sm text-[#94a3b8] mt-1">Grouping telemetry queries by conversation sessions</p>
                </div>
              ) : conversationGroups.length === 0 ? (
                <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-16 text-center text-[#64748b] dark:text-[#94a3b8] shadow-xs">
                  <MessageSquare className="h-10 w-10 text-[#94a3b8] mx-auto mb-3 opacity-60" />
                  <div className="text-base font-bold text-[#193A69] dark:text-white">No Conversations Found</div>
                  <p className="text-sm text-[#94a3b8] mt-1">Try changing filters or search terms.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  {/* ── LEFT SIDEBAR: CONVERSATION SESSIONS ── */}
                  <div className="lg:col-span-4 xl:col-span-4 bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl shadow-xs overflow-hidden flex flex-col">
                    {/* Sidebar Header */}
                    <div className="p-3.5 sm:p-4 border-b border-[#e2e8f0] dark:border-[#334155] bg-[#f8fafc] dark:bg-[#0f172a]/60 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                            <MessageSquare className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-[#193A69] dark:text-white">
                                Sessions
                              </h3>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                                {conversationGroups.length}
                              </span>
                            </div>
                            <span className="text-[11px] text-[#64748b] dark:text-[#94a3b8]">
                              {logs.length} / {pagination.totalRecords || logs.length} turns loaded
                            </span>
                          </div>
                        </div>

                        {/* Quick reload button */}
                        <button
                          type="button"
                          onClick={() => fetchAuditLogs(1, statusFilter, searchTerm, false)}
                          title="Reload latest sessions"
                          disabled={isLoading || isLoadingMore}
                          className="p-1.5 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-300 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 disabled:opacity-50"
                        >
                          <RefreshCw className={`h-3.5 w-3.5 ${isLoading && !isLoadingMore ? "animate-spin" : ""}`} />
                        </button>
                      </div>

                      {/* Local Search inside sessions */}
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#94a3b8]" />
                        <Input
                          placeholder="Search title, query, user..."
                          value={sessionSearch}
                          onChange={(e) => setSessionSearch(e.target.value)}
                          className="pl-8 pr-7 h-8 text-xs bg-white dark:bg-[#1e293b] border-[#e2e8f0] dark:border-[#334155] text-[#1e293b] dark:text-white placeholder:text-[#94a3b8] focus-visible:ring-1 focus-visible:ring-blue-500"
                        />
                        {sessionSearch && (
                          <button
                            type="button"
                            onClick={() => setSessionSearch("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#1e293b] dark:hover:text-white p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>

                      {/* Quick Filter Pills */}
                      <div className="grid grid-cols-3 gap-1 p-0.5 bg-slate-200/60 dark:bg-slate-800/60 rounded-lg text-[11px] font-semibold">
                        <button
                          type="button"
                          onClick={() => setSidebarFilter("ALL")}
                          className={`py-1 px-1.5 rounded-md transition-all text-center truncate ${
                            sidebarFilter === "ALL"
                              ? "bg-white dark:bg-[#1e293b] text-blue-600 dark:text-blue-400 shadow-xs font-bold"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                          }`}
                        >
                          All ({conversationGroups.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setSidebarFilter("SUCCESS")}
                          className={`py-1 px-1.5 rounded-md transition-all text-center truncate ${
                            sidebarFilter === "SUCCESS"
                              ? "bg-white dark:bg-[#1e293b] text-emerald-600 dark:text-emerald-400 shadow-xs font-bold"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                          }`}
                        >
                          ✓ OK ({conversationGroups.filter((g) => g.failedCount === 0).length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setSidebarFilter("FAILED")}
                          className={`py-1 px-1.5 rounded-md transition-all text-center truncate ${
                            sidebarFilter === "FAILED"
                              ? "bg-white dark:bg-[#1e293b] text-rose-600 dark:text-rose-400 shadow-xs font-bold"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                          }`}
                        >
                          ⚠ Issues ({conversationGroups.filter((g) => g.failedCount > 0).length})
                        </button>
                      </div>
                    </div>

                    {/* Scrollable Sessions List with Infinite Scroll & Lazy Loading */}
                    <div
                      onScroll={handleSidebarScroll}
                      className="p-2 sm:p-2.5 space-y-2 overflow-y-auto max-h-[720px] divide-y divide-transparent"
                    >
                      {filteredSidebarSessions.length === 0 ? (
                        <div className="py-12 text-center text-xs text-[#94a3b8] space-y-2">
                          <MessageSquare className="h-7 w-7 text-slate-300 dark:text-slate-600 mx-auto" />
                          <div>No sessions match your filter</div>
                          {sessionSearch && (
                            <button
                              type="button"
                              onClick={() => setSessionSearch("")}
                              className="text-blue-500 hover:underline text-[11px]"
                            >
                              Clear search query
                            </button>
                          )}
                        </div>
                      ) : (
                        filteredSidebarSessions.map((group) => {
                          const isSelected = activeSession?.conversationId === group.conversationId;
                          const dt = formatAuditDateTime(group.latestCreatedAt);
                          const allOk = group.failedCount === 0;
                          const isDirect = group.conversationId.startsWith("direct_");
                          const firstQueryText = group.queries[0]?.userQuery || "";

                          return (
                            <button
                              key={group.conversationId}
                              type="button"
                              onClick={() => setSelectedSessionId(group.conversationId)}
                              className={`w-full text-left p-3 rounded-xl border transition-all duration-150 flex flex-col gap-2 relative ${
                                isSelected
                                  ? "bg-blue-50/90 dark:bg-blue-950/40 border-blue-500 dark:border-blue-400 border-l-[4px] border-l-blue-600 dark:border-l-blue-400 shadow-xs"
                                  : "bg-white dark:bg-[#1e293b] border-[#e2e8f0] dark:border-[#334155] border-l-[4px] border-l-transparent hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                              }`}
                            >
                              {/* Top Row: Title + Status Indicator */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <span
                                    className={`text-xs sm:text-sm font-bold line-clamp-2 leading-snug ${
                                      isSelected
                                        ? "text-blue-950 dark:text-blue-100"
                                        : "text-[#1e293b] dark:text-[#f1f5f9]"
                                    }`}
                                    title={group.title}
                                  >
                                    {group.title}
                                  </span>
                                </div>
                                <span className="shrink-0 mt-0.5">
                                  {allOk ? (
                                    <span
                                      className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block shadow-xs ring-2 ring-emerald-500/20"
                                      title="All queries succeeded"
                                    />
                                  ) : group.successCount === 0 ? (
                                    <span
                                      className="h-2.5 w-2.5 rounded-full bg-rose-500 inline-block shadow-xs ring-2 ring-rose-500/20"
                                      title="All queries failed"
                                    />
                                  ) : (
                                    <span
                                      className="h-2.5 w-2.5 rounded-full bg-amber-500 inline-block shadow-xs ring-2 ring-amber-500/20"
                                      title={`${group.failedCount} query failed`}
                                    />
                                  )}
                                </span>
                              </div>

                              {/* Question preview snippet if different from title */}
                              {firstQueryText && firstQueryText !== group.title && (
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 italic">
                                  &ldquo;{firstQueryText}&rdquo;
                                </p>
                              )}

                              {/* Middle Row: Turn Count & Metric Badges */}
                              <div className="flex items-center justify-between gap-2 text-xs">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                                      isSelected
                                        ? "bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300"
                                        : "bg-[#f1f5f9] dark:bg-[#0f172a] text-[#475569] dark:text-[#cbd5e1]"
                                    }`}
                                  >
                                    {group.totalQueries}{" "}
                                    {group.totalQueries === 1 ? "Turn" : "Turns"}
                                  </span>
                                  {group.avgExecutionTimeMs > 0 && (
                                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800">
                                      {group.avgExecutionTimeMs}ms
                                    </span>
                                  )}
                                  {!allOk && (
                                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40">
                                      {group.failedCount} err
                                    </span>
                                  )}
                                </div>

                                <span className="font-mono text-[10px] text-[#94a3b8] truncate max-w-[110px]">
                                  {!isDirect
                                    ? `#${group.conversationId.slice(0, 8)}`
                                    : "Direct"}
                                </span>
                              </div>

                              {/* Bottom Row: User & Time */}
                              <div className="flex items-center justify-between gap-2 text-[11px] text-[#94a3b8] pt-1.5 border-t border-slate-100 dark:border-slate-800">
                                <span className="truncate flex items-center gap-1 font-medium text-[#64748b] dark:text-[#cbd5e1]">
                                  <User className="h-3 w-3 shrink-0 text-[#94a3b8]" />
                                  <span className="truncate">
                                    {group.userId || group.empCode || "Web User"}
                                  </span>
                                </span>
                                <span className="shrink-0 flex items-center gap-1">
                                  <Clock className="h-2.5 w-2.5 opacity-70" />
                                  <span>{dt.time}</span>
                                </span>
                              </div>
                            </button>
                          );
                        })
                      )}

                      {/* ── LAZY LOADING INFINITE SCROLL SENTINEL & FEEDBACK ── */}
                      {isLoadingMore && (
                        <div className="p-3 text-center flex items-center justify-center gap-2 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold animate-pulse">
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Loading older sessions...</span>
                        </div>
                      )}

                      {/* Sentinel trigger element for IntersectionObserver */}
                      <div ref={sentinelRef} className="h-2 w-full" />

                      {/* Manual fallback button if user reaches bottom */}
                      {!isLoadingMore && pagination.page < pagination.totalPages && (
                        <button
                          type="button"
                          onClick={() => handleLoadMore()}
                          disabled={isLoading || isLoadingMore}
                          className="w-full py-2 px-3 text-xs font-semibold text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-300 hover:bg-blue-50/50 dark:hover:bg-slate-800 rounded-xl transition-all border border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                          <span>Load More Sessions ({logs.length} of {pagination.totalRecords})</span>
                        </button>
                      )}

                      {/* End of results message */}
                      {!isLoadingMore && pagination.page >= pagination.totalPages && logs.length > 0 && (
                        <div className="py-2.5 text-center text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                          ✓ All {conversationGroups.length} sessions loaded ({pagination.totalRecords} queries)
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── RIGHT MAIN PANEL: SELECTED CONVERSATION DETAIL ── */}
                  <div className="lg:col-span-8 xl:col-span-8 flex flex-col space-y-4">
                    {activeSession ? (
                      <>
                        {/* Session Header Card */}
                        {(() => {
                          const dt = formatAuditDateTime(activeSession.latestCreatedAt);
                          const allSuccess = activeSession.failedCount === 0;
                          const isDirect = activeSession.conversationId.startsWith("direct_");

                          return (
                            <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5">
                              {/* Title & Status */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="space-y-1 flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h2 className="text-base sm:text-lg font-bold text-[#193A69] dark:text-white break-words">
                                      {activeSession.title}
                                    </h2>
                                    {!isDirect && (
                                      <button
                                        type="button"
                                        onClick={() => handleCopy(activeSession.conversationId, "active_session_id")}
                                        className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-[#f1f5f9] dark:bg-[#0f172a] text-[#64748b] dark:text-[#94a3b8] border border-[#e2e8f0] dark:border-[#334155] hover:text-[#193A69] dark:hover:text-white transition-colors flex items-center gap-1"
                                        title="Click to copy full Session ID"
                                      >
                                        <span>Session: {activeSession.conversationId.slice(0, 8)}...</span>
                                        {copiedField === "active_session_id" ? (
                                          <Check className="h-3 w-3 text-emerald-500" />
                                        ) : (
                                          <Copy className="h-3 w-3" />
                                        )}
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Status & Turn Badge */}
                                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#f1f5f9] dark:bg-[#0f172a] text-[#1e293b] dark:text-[#e2e8f0] border border-[#e2e8f0] dark:border-[#334155]">
                                    <span className="h-2 w-2 rounded-full bg-[#193A69] dark:bg-[#60a5fa]" />
                                    {activeSession.totalQueries} {activeSession.totalQueries === 1 ? "Query" : "Questions"}
                                  </span>

                                  {allSuccess ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#ecfdf5] dark:bg-[#022c22]/50 text-[#059669] dark:text-[#34d399] border border-[#a7f3d0] dark:border-[#065f46]">
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                      All Successful
                                    </span>
                                  ) : activeSession.successCount === 0 ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#fff1f2] dark:bg-[#450a0a]/50 text-[#e11d48] dark:text-[#fda4af] border border-[#fecaca] dark:border-[#881337]">
                                      <XCircle className="h-3.5 w-3.5" />
                                      {activeSession.failedCount} Failed
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#fffbeb] dark:bg-[#451a03]/50 text-[#d97706] dark:text-[#fde68a] border border-[#fde68a] dark:border-[#78350f]">
                                      <AlertCircle className="h-3.5 w-3.5" />
                                      {activeSession.successCount} OK, {activeSession.failedCount} Err
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Session Metadata Chips */}
                              <div className="pt-2 border-t border-[#f1f5f9] dark:border-[#334155]/60 flex items-center gap-2.5 text-xs text-[#64748b] dark:text-[#94a3b8] flex-wrap">
                                <span className="inline-flex items-center gap-1 font-medium">
                                  <User className="h-3.5 w-3.5 text-[#94a3b8]" />
                                  <span className="text-[#334155] dark:text-[#cbd5e1] font-semibold">
                                    {activeSession.userId || activeSession.empCode || "Web User"}
                                  </span>
                                  {activeSession.empCode && activeSession.userId !== activeSession.empCode && (
                                    <span className="font-mono text-[#64748b]">({activeSession.empCode})</span>
                                  )}
                                </span>

                                {activeSession.role && (
                                  <>
                                    <span className="text-[#cbd5e1] dark:text-[#475569]">•</span>
                                    <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-[#f1f5f9] dark:bg-[#334155] text-[#475569] dark:text-[#cbd5e1]">
                                      {activeSession.role}
                                    </span>
                                  </>
                                )}

                                <span className="text-[#cbd5e1] dark:text-[#475569]">•</span>
                                <span className="inline-flex items-center gap-1 font-medium text-[#64748b] dark:text-[#94a3b8]">
                                  <Clock className="h-3.5 w-3.5 text-[#94a3b8]" />
                                  <span>{dt.time} ({dt.date})</span>
                                </span>

                                <span className="text-[#cbd5e1] dark:text-[#475569]">•</span>
                                <span className="text-[#64748b] dark:text-[#94a3b8]">
                                  Avg {activeSession.avgExecutionTimeMs}ms
                                </span>

                                <span className="text-[#cbd5e1] dark:text-[#475569]">•</span>
                                <span className="text-[#64748b] dark:text-[#94a3b8]">
                                  {activeSession.totalRows} rows returned
                                </span>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Questions / Turns Sequence */}
                        <div className="space-y-4">
                          <div className="text-xs font-bold uppercase tracking-wider text-[#64748b] dark:text-[#94a3b8] flex items-center justify-between px-1">
                            <span>Questions Flow ({activeSession.queries.length} turns)</span>
                            <span className="font-normal text-[11px] text-[#94a3b8]">Chronological Sequence</span>
                          </div>

                          {activeSession.queries.map((q, turnIdx) => {
                            const qSuccess = q.statusCode === "SUCCESS";
                            const qDt = formatAuditDateTime(q.createdAt);
                            return (
                              <div
                                key={q.UTD}
                                className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow space-y-3"
                              >
                                {/* Turn Header */}
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-[#f1f5f9] dark:border-[#334155]/60">
                                  <div className="flex items-start gap-3 flex-1 min-w-0">
                                    {/* Question Badge e.g. Q1, Q2 */}
                                    <span className="px-2.5 py-1 rounded-lg bg-[#193A69] dark:bg-blue-600 text-white font-mono font-bold text-xs shrink-0 shadow-2xs">
                                      Q{turnIdx + 1}
                                    </span>

                                    <div className="flex-1 min-w-0">
                                      <p className="font-bold text-sm sm:text-base text-[#193A69] dark:text-white break-words">
                                        {q.userQuery}
                                      </p>
                                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                        {/* Intent */}
                                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#f1f5f9] dark:bg-[#334155] text-[#475569] dark:text-[#cbd5e1]">
                                          {q.intent || "GENERAL"}
                                        </span>
                                        {/* Table */}
                                        <span className="font-mono text-[11px] text-[#64748b] dark:text-[#94a3b8] bg-[#f8fafc] dark:bg-[#0f172a] px-2 py-0.5 rounded border border-[#e2e8f0] dark:border-[#334155]">
                                          Table: {q.tablesUsed || "EMPLOYEEMASTER"}
                                        </span>
                                        {/* Time */}
                                        <span className="text-[11px] text-[#94a3b8]">
                                          {qDt.time}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Action Buttons for this question */}
                                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                                    {!qSuccess || (q.rowsReturned === 0 || q.rowsReturned === null) ? (
                                      <Button
                                        onClick={() => handleOpenTrainModal(q)}
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 px-2.5 text-xs font-bold bg-[#fff1f2] dark:bg-[#450a0a]/40 text-[#e11d48] dark:text-[#fda4af] border border-[#fecdd3] dark:border-[#881337] hover:bg-[#fecdd3] gap-1"
                                        title="Fix this failed query — train AI with correct SQL"
                                      >
                                        <Zap className="h-3 w-3 fill-current" />
                                        Fix & Train
                                      </Button>
                                    ) : (
                                      <Button
                                        onClick={() => handleOpenTrainModal(q)}
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 px-2.5 text-xs font-bold text-[#d97706] hover:bg-[#fffbeb] dark:hover:bg-[#451a03]/40 border border-[#fde68a] dark:border-[#78350f] gap-1"
                                        title="Train Golden Rule from this query"
                                      >
                                        <Zap className="h-3 w-3 fill-current" />
                                        Train Rule
                                      </Button>
                                    )}

                                    <Button
                                      onClick={() => setSelectedRecord(q)}
                                      variant="outline"
                                      size="sm"
                                      className="h-8 px-2.5 text-xs font-medium text-[#64748b] dark:text-[#cbd5e1] gap-1 border-[#e2e8f0] dark:border-[#334155]"
                                      title="View full audit telemetry details"
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                      <span>Details</span>
                                    </Button>
                                  </div>
                                </div>

                                {/* Turn Details: Executed SQL & Response Preview */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                  {/* Executed SQL Box */}
                                  <div className="bg-[#0f172a] rounded-lg p-3 text-white flex flex-col justify-between border border-[#1e293b]">
                                    <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#334155]">
                                      <span className="text-[11px] font-mono font-bold text-[#94a3b8] flex items-center gap-1.5">
                                        <Code2 className="h-3.5 w-3.5 text-[#38bdf8]" />
                                        EXECUTED SQL
                                      </span>
                                      {q.generatedSql && (
                                        <button
                                          type="button"
                                          onClick={() => handleCopy(q.generatedSql || "", `sql_${q.UTD}`)}
                                          className="text-[11px] text-[#94a3b8] hover:text-white flex items-center gap-1 transition-colors"
                                          title="Copy SQL to clipboard"
                                        >
                                          {copiedField === `sql_${q.UTD}` ? (
                                            <>
                                              <Check className="h-3 w-3 text-emerald-400" />
                                              <span className="text-emerald-400">Copied</span>
                                            </>
                                          ) : (
                                            <>
                                              <Copy className="h-3 w-3" />
                                              <span>Copy</span>
                                            </>
                                          )}
                                        </button>
                                      )}
                                    </div>
                                    <div className="overflow-x-auto max-h-36 text-xs font-mono text-[#93c5fd] leading-relaxed whitespace-pre-wrap">
                                      {q.generatedSql || <span className="italic text-[#64748b]">No SQL query generated</span>}
                                    </div>
                                  </div>

                                  {/* AI Response Preview Box */}
                                  <div className="bg-[#f8fafc] dark:bg-[#0f172a] rounded-lg p-3 border border-[#e2e8f0] dark:border-[#334155] flex flex-col justify-between">
                                    <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#e2e8f0] dark:border-[#334155]">
                                      <span className="text-[11px] font-bold text-[#64748b] dark:text-[#94a3b8] flex items-center gap-1.5">
                                        <Bot className="h-3.5 w-3.5 text-[#193A69] dark:text-blue-400" />
                                        AI RESPONSE PREVIEW
                                      </span>
                                    </div>
                                    <div className="overflow-y-auto max-h-36 text-xs text-[#334155] dark:text-[#cbd5e1] leading-relaxed whitespace-pre-wrap">
                                      {q.aiResponse || (
                                        <span className="italic text-[#94a3b8]">
                                          {q.errorMessage ? `Error: ${q.errorMessage}` : "No response preview available"}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Turn Footer: Metrics & Chips */}
                                <div className="pt-2 border-t border-[#f1f5f9] dark:border-[#334155]/60 flex items-center justify-between text-xs flex-wrap gap-2">
                                  <div className="flex items-center gap-3 flex-wrap">
                                    {/* Status pill */}
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[11px] ${
                                        qSuccess
                                          ? "bg-[#ecfdf5] dark:bg-[#022c22]/50 text-[#059669] dark:text-[#34d399] border border-[#a7f3d0]"
                                          : "bg-[#fff1f2] dark:bg-[#450a0a]/50 text-[#e11d48] dark:text-[#fda4af] border border-[#fecaca]"
                                      }`}
                                    >
                                      {qSuccess ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                      {q.statusCode}
                                    </span>

                                    {/* Rows */}
                                    <span className="font-medium text-[#475569] dark:text-[#cbd5e1] flex items-center gap-1">
                                      <Database className="h-3 w-3 text-[#94a3b8]" />
                                      <strong className="text-[#1e293b] dark:text-white">{q.rowsReturned || 0}</strong> rows
                                      {qSuccess && (q.rowsReturned === 0 || q.rowsReturned === null) && (
                                        <span className="ml-1 text-[10px] font-bold text-[#d97706] dark:text-[#fde68a]">
                                          (0 rows returned)
                                        </span>
                                      )}
                                    </span>

                                    {/* Latency */}
                                    <span className="font-medium text-[#475569] dark:text-[#cbd5e1] flex items-center gap-1">
                                      <Clock className="h-3 w-3 text-[#94a3b8]" />
                                      <span>{q.executionTimeMs}ms</span>
                                    </span>

                                    {q.compCode && (
                                      <span className="font-mono text-[11px] text-[#64748b] dark:text-[#94a3b8]">
                                        Comp: {q.compCode}
                                      </span>
                                    )}
                                  </div>

                                  {/* UTD tag */}
                                  <span className="font-mono text-[11px] text-[#94a3b8]">
                                    Log #{q.UTD}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-16 text-center text-[#64748b] dark:text-[#94a3b8] shadow-xs">
                        <MessageSquare className="h-10 w-10 text-[#94a3b8] mx-auto mb-3 opacity-60" />
                        <div className="text-base font-bold text-[#193A69] dark:text-white">Select a session from the sidebar</div>
                        <p className="text-sm text-[#94a3b8] mt-1">Choose any conversation session on the left to view its question thread.</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            ) : (
              /* ── FLAT AUDIT LOGS TABLE ── */
              <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#e2e8f0] dark:border-[#334155] bg-[#f8fafc] dark:bg-[#0f172a]/70 text-lg font-extrabold uppercase tracking-wider text-[#64748b] dark:text-[#94a3b8]">
                        <th className="py-3.5 px-4 min-w-[260px]">User Prompt / Question</th>
                        <th className="py-3.5 px-4">Intent</th>
                        <th className="py-3.5 px-4">Target Table</th>
                        <th className="py-3.5 px-4 min-w-[220px]">Executed SQL</th>
                        <th className="py-3.5 px-4 text-center">Rows</th>
                        <th className="py-3.5 px-4 text-center">Latency</th>
                        <th className="py-3.5 px-4 text-center">Status</th>
                        <th className="py-3.5 px-4 min-w-[130px]">Time</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e2e8f0] dark:divide-[#334155] text-lg">
                      {isLoading ? (
                        <tr>
                          <td colSpan={10} className="py-16 text-center text-[#64748b]">
                            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                            Loading telemetry logs...
                          </td>
                        </tr>
                      ) : logs.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-16 text-center text-[#64748b]">
                            <Database className="h-10 w-10 text-[#94a3b8] mx-auto mb-3" />
                            <div className="text-lg font-bold text-[#193A69] dark:text-white">No Logs Found</div>
                            <p className="text-lg text-[#94a3b8] mt-1">Try changing filters or ask questions in AI Assistant.</p>
                          </td>
                        </tr>
                      ) : (
                        logs.map((log) => {
                          const isSuccess = log.statusCode === "SUCCESS";
                          return (
                            <tr
                              key={log.UTD}
                              onDoubleClick={() => handleOpenTrainModal(log)}
                              className="hover:bg-[#f8fafc] dark:hover:bg-[#0f172a]/40 transition-colors cursor-pointer group"
                              title="Double-click to Train AI with this Query"
                            >
                              <td className="py-3.5 px-4 font-bold text-[#193A69] dark:text-white max-w-sm">
                                <div className="truncate group-hover:text-primary transition-colors">
                                  {log.userQuery}
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="px-2 py-0.5 rounded text-lg font-bold bg-[#f1f5f9] dark:bg-[#334155] text-[#475569] dark:text-[#cbd5e1]">
                                  {log.intent || "GENERAL"}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-[#64748b] dark:text-[#94a3b8] font-mono text-lg truncate max-w-[130px]">
                                {log.tablesUsed || "EMPLOYEEMASTER"}
                              </td>
                              <td className="py-3.5 px-4 max-w-xs">
                                {log.generatedSql ? (
                                  <pre className="p-1.5 rounded bg-[#0f172a] text-[#93c5fd] font-mono text-[11px] truncate">
                                    <code>{log.generatedSql}</code>
                                  </pre>
                                ) : (
                                  <span className="text-[#94a3b8] text-lg italic">No SQL generated</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-center font-bold text-[#193A69] dark:text-white">
                                {log.rowsReturned || 0}
                              </td>
                              <td className="py-3.5 px-4 text-center text-[#64748b] dark:text-[#94a3b8] text-lg">
                                {log.executionTimeMs}ms
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-lg font-bold ${
                                    isSuccess
                                      ? "bg-[#ecfdf5] dark:bg-[#022c22]/50 text-[#059669] dark:text-[#34d399] border border-[#a7f3d0]"
                                      : "bg-[#fff1f2] dark:bg-[#450a0a]/50 text-[#e11d48] dark:text-[#fda4af] border border-[#fecaca]"
                                  }`}
                                >
                                  {isSuccess ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                  {log.statusCode}
                                </span>
                                {isSuccess && (log.rowsReturned === 0 || log.rowsReturned === null) && (
                                  <span className="mt-0.5 flex items-center gap-0.5 text-[10px] font-bold text-[#d97706] dark:text-[#fde68a]">
                                    ⚠ 0 rows
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                {(() => {
                                  const dt = formatAuditDateTime(log.createdAt);
                                  return (
                                    <div className="flex flex-col">
                                      <span className="font-semibold text-[#1e293b] dark:text-[#f1f5f9] text-lg tracking-tight">
                                        {dt.time}
                                      </span>
                                      <span className="text-[11px] font-medium text-[#94a3b8]">
                                        {dt.date}
                                      </span>
                                    </div>
                                  );
                                })()}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {!isSuccess || (log.rowsReturned === 0 || log.rowsReturned === null) ? (
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenTrainModal(log);
                                      }}
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 px-2.5 text-lg font-bold bg-[#fff1f2] dark:bg-[#450a0a]/40 text-[#e11d48] dark:text-[#fda4af] border border-[#fecdd3] dark:border-[#881337] hover:bg-[#fecdd3] gap-1 animate-pulse"
                                      title="Fix this failed query — train AI with correct SQL"
                                    >
                                      <Zap className="h-3.5 w-3.5 fill-current" />
                                      Fix & Train
                                    </Button>
                                  ) : (
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenTrainModal(log);
                                      }}
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 px-2.5 text-lg font-bold text-[#d97706] hover:bg-[#fffbeb] dark:hover:bg-[#451a03]/40 gap-1"
                                    >
                                      <Zap className="h-3.5 w-3.5 fill-current" />
                                      Train
                                    </Button>
                                  )}
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedRecord(log);
                                    }}
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-[#64748b] hover:text-[#193A69]"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pagination Controls - only for table view (conversation view uses sidebar lazy loading) */}
            {viewMode === "table" && pagination.totalPages > 1 && (
              <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl px-6 py-4 shadow-xs flex items-center justify-between">
                <span className="text-sm sm:text-base text-[#64748b] dark:text-[#94a3b8]">
                  Showing page <span className="font-bold text-[#1e293b] dark:text-white">{pagination.page}</span> of{" "}
                  <span className="font-bold text-[#1e293b] dark:text-white">{pagination.totalPages}</span> ({pagination.totalRecords} records)
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => fetchAuditLogs(pagination.page - 1, statusFilter, searchTerm)}
                    disabled={pagination.page <= 1}
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 gap-1 text-xs sm:text-sm font-semibold"
                  >
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </Button>
                  <Button
                    onClick={() => fetchAuditLogs(pagination.page + 1, statusFilter, searchTerm)}
                    disabled={pagination.page >= pagination.totalPages}
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 gap-1 text-xs sm:text-sm font-semibold"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ── AI TRAINING / FINE-TUNING MODAL (WITH LIVE SQL TEST RUN) ── */}
      {trainModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-[#e2e8f0] dark:border-[#334155] shadow-2xl max-w-6xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#e2e8f0] dark:border-[#334155] flex items-center justify-between bg-[#f8fafc] dark:bg-[#0f172a]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#d97706] to-[#f59e0b] flex items-center justify-center text-white shadow-md shadow-[#d97706]/20">
                  <Zap className="h-5 w-5 fill-current" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-[#193A69] dark:text-white">
                    {editingRuleUtd ? `Edit Trained AI Golden Rule (#${editingRuleUtd})` : "Train & Fine-Tune AutoVyn AI Copilot"}
                  </h2>
                  <p className="text-lg text-[#64748b] dark:text-[#94a3b8]">
                    Teach golden SQL patterns and test live on database without touching code.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setTrainModalOpen(false)}
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 rounded-full text-[#64748b] hover:text-[#1e293b] dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-lg">
              {/* 1. Training Action Type */}
              <div className="space-y-2">
                <label className="text-lg font-bold text-[#193A69] dark:text-white flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-primary" />
                  RLHF Training Purpose / Category:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setTrainActionType("GOLDEN")}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      trainActionType === "GOLDEN"
                        ? "bg-[#eff6ff] dark:bg-[#1e3a8a]/40 border-[#3b82f6] dark:border-[#60a5fa] text-[#1e3a8a] dark:text-[#93c5fd] ring-2 ring-[#3b82f6]/30 shadow-xs"
                        : "bg-[#f8fafc] dark:bg-[#0f172a] border-[#e2e8f0] dark:border-[#334155] text-[#64748b] dark:text-[#94a3b8] hover:border-[#93c5fd]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-lg">🏆 Golden Query</span>
                      {trainActionType === "GOLDEN" && <Check className="h-4 w-4 text-primary" />}
                    </div>
                    <span className="text-lg opacity-80 mt-1">Verified standard answer for this question</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTrainActionType("CORRECTION")}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      trainActionType === "CORRECTION"
                        ? "bg-[#fffbeb] dark:bg-[#78350f]/40 border-[#f59e0b] dark:border-[#fbbf24] text-[#92400e] dark:text-[#fde68a] ring-2 ring-[#f59e0b]/30 shadow-xs"
                        : "bg-[#f8fafc] dark:bg-[#0f172a] border-[#e2e8f0] dark:border-[#334155] text-[#64748b] dark:text-[#94a3b8] hover:border-[#fcd34d]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-lg">🎯 Bug Correction</span>
                      {trainActionType === "CORRECTION" && <Check className="h-4 w-4 text-[#d97706]" />}
                    </div>
                    <span className="text-lg opacity-80 mt-1">Fix a failed or inaccurate response</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTrainActionType("RULE")}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      trainActionType === "RULE"
                        ? "bg-[#faf5ff] dark:bg-[#581c87]/40 border-[#a855f7] dark:border-[#c084fc] text-[#6b21a8] dark:text-[#e9d5ff] ring-2 ring-[#a855f7]/30 shadow-xs"
                        : "bg-[#f8fafc] dark:bg-[#0f172a] border-[#e2e8f0] dark:border-[#334155] text-[#64748b] dark:text-[#94a3b8] hover:border-[#d8b4fe]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-lg">📜 Business Rule</span>
                      {trainActionType === "RULE" && <Check className="h-4 w-4 text-[#2563eb]" />}
                    </div>
                    <span className="text-lg opacity-80 mt-1">Leave types, status mapping, formulas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTrainActionType("HELPFUL")}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      trainActionType === "HELPFUL"
                        ? "bg-[#ecfdf5] dark:bg-[#022c22]/40 border-[#34d399] dark:border-[#10b981] text-[#064e3b] dark:text-[#a7f3d0] ring-2 ring-[#34d399]/30 shadow-xs"
                        : "bg-[#f8fafc] dark:bg-[#0f172a] border-[#e2e8f0] dark:border-[#334155] text-[#64748b] dark:text-[#94a3b8] hover:border-[#6ee7b7]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-lg">👍 Upvote & Boost</span>
                      {trainActionType === "HELPFUL" && <Check className="h-4 w-4 text-[#059669]" />}
                    </div>
                    <span className="text-lg opacity-80 mt-1">Reinforce successful query hit</span>
                  </button>
                </div>
              </div>

              {/* 2. User Question / Prompt */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-lg font-bold text-[#193A69] dark:text-white flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    Target User Question / Trigger Prompt:
                  </label>
                  <span className="text-lg text-[#64748b] dark:text-[#94a3b8]">Will trigger this trained rule</span>
                </div>
                <Input
                  value={trainQuery}
                  readOnly
                  onChange={(e) => setTrainQuery(e.target.value)}
                  placeholder="e.g. Today's service reminders due list or Emp 1004 salary..."
                  className="h-11 text-lg font-medium bg-[#f8fafc] dark:bg-[#0f172a] border-[#cbd5e1] dark:border-[#334155] text-[#1e293b] dark:text-white"
                />
              </div>

              {/* 3. Question Variations / Synonyms */}
              <div className="space-y-1.5">
                <label className="text-lg font-bold text-[#64748b] dark:text-[#94a3b8] flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[#f59e0b]" />
                  Alternative Question Phrases / Synonyms (Optional, Comma separated):
                </label>
                <Input
                  value={trainSynonyms}
                  onChange={(e) => setTrainSynonyms(e.target.value)}
                  placeholder="e.g. service due list, service reminder today, aaj ke service reminder"
                  className="h-10 text-lg bg-[#f8fafc] dark:bg-[#0f172a] border-[#e2e8f0] dark:border-[#334155] text-[#1e293b] dark:text-white"
                />
              </div>

              {/* 4. Target ERP Table & Intent Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Table Selector & Custom Table Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-lg font-bold text-[#193A69] dark:text-white flex items-center gap-2">
                      <Database className="h-4 w-4 text-[#6366f1]" />
                      Primary ERP Target Table:
                    </label>
                    {trainTableSelect === "OTHER" && (
                      <span className="text-lg font-bold text-[#d97706] bg-[#fef3c7] dark:bg-[#451a03]/50 px-2 py-0.5 rounded">
                        Custom Active
                      </span>
                    )}
                  </div>
                  <select
                    value={trainTableSelect}
                    onChange={(e) => setTrainTableSelect(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-[#f8fafc] dark:bg-[#0f172a] border border-[#cbd5e1] dark:border-[#334155] text-lg font-bold text-[#1e293b] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-primary"
                  >
                    {DEFAULT_TABLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  {trainTableSelect === "OTHER" && (
                    <div className="pt-1 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="relative">
                        <Edit3 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6366f1]" />
                        <Input
                          value={customTrainTable}
                          onChange={(e) => setCustomTrainTable(e.target.value)}
                          placeholder="Type custom table (e.g. Srv_Reminder_Tbl, Item_Master)..."
                          className="pl-9 h-10 text-lg font-bold bg-[#eff6ff] dark:bg-[#172554]/40 border-[#60a5fa] text-[#1e293b] dark:text-white shadow-inner"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Intent Selector & Custom Intent Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-lg font-bold text-[#193A69] dark:text-white flex items-center gap-2">
                      <Layers className="h-4 w-4 text-[#10b981]" />
                      Intent Category:
                    </label>
                    {trainIntentSelect === "OTHER" && (
                      <span className="text-lg font-bold text-[#059669] bg-[#d1fae5] dark:bg-[#022c22]/50 px-2 py-0.5 rounded">
                        Custom Active
                      </span>
                    )}
                  </div>
                  <select
                    value={trainIntentSelect}
                    onChange={(e) => setTrainIntentSelect(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-[#f8fafc] dark:bg-[#0f172a] border border-[#cbd5e1] dark:border-[#334155] text-lg font-bold text-[#1e293b] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-primary"
                  >
                    {DEFAULT_INTENT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  {trainIntentSelect === "OTHER" && (
                    <div className="pt-1 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="relative">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#10b981]" />
                        <Input
                          value={customTrainIntent}
                          onChange={(e) => setCustomTrainIntent(e.target.value)}
                          placeholder="Type custom intent (e.g. SERVICE_REMINDER_LIST)..."
                          className="pl-9 h-10 text-lg font-bold bg-[#ecfdf5] dark:bg-[#022c22]/40 border-[#34d399] text-[#064e3b] dark:text-white shadow-inner"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 5. SQL Query Editor + Live Test Run Button */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-lg font-bold text-[#193A69] dark:text-white flex items-center gap-2">
                    <Code2 className="h-4 w-4 text-primary" />
                    Verified Microsoft SQL Statement (Golden Query):
                  </label>

                  {/* Test Run & Syntax Helpers */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      type="button"
                      onClick={handleTestLiveSQL}
                      disabled={isTestingSql}
                      variant="input"
                      size="sm"
                      className="h-8 px-3 text-lg font-bold bg-[#059669] hover:bg-[#047857] text-white gap-1.5 shadow-xs"
                    >
                      {/* <Zap className={`h-3.5 w-3.5 ${isTestingSql ? "animate-spin" : "fill-current"}`} /> */}
                      {isTestingSql ? "Testing Live..." : "⚡ Test Run SQL Now"}
                    </Button>

                    <button
                      type="button"
                      onClick={() => {
                        if (!trainSql.includes("WITH (NOLOCK)")) {
                          setTrainSql((prev) => prev.replace(/(FROM\s+\[?dbo\]?\.?\[?[a-zA-Z0-9_]+\]?)/i, "$1 WITH (NOLOCK)"));
                        }
                      }}
                      className="px-2.5 py-1 rounded text-lg font-bold bg-[#eff6ff] dark:bg-[#1e3a8a]/40 text-[#2563eb] hover:bg-[#dbeafe]"
                    >
                      + NOLOCK
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!trainSql.includes("TOP")) {
                          setTrainSql((prev) => prev.replace(/SELECT\s+/i, "SELECT TOP 50 "));
                        }
                      }}
                      className="px-2.5 py-1 rounded text-lg font-bold bg-[#eff6ff] dark:bg-[#1e3a8a]/40 text-[#2563eb] hover:bg-[#dbeafe]"
                    >
                      + TOP 50
                    </button>
                  </div>
                </div>

                <textarea
                  value={trainSql}
                  onChange={(e) => {
                    setTrainSql(e.target.value);
                    setSqlSyntaxStatus(null);
                    setTestResult(null);
                  }}
                  rows={5}
                  placeholder="SELECT TOP 50 Final_Due_Date, * FROM [dbo].[Srv_Reminder_Tbl] WITH (NOLOCK) WHERE ..."
                  className="w-full p-4 rounded-xl font-mono text-lg bg-[#0f172a] text-[#93c5fd] border border-[#334155] focus:outline-hidden focus:ring-2 focus:ring-primary leading-relaxed shadow-inner"
                />

                {/* Live SQL Test Results Preview Box */}
                {testResult && (
                  <div
                    className={`p-3.5 rounded-xl border text-lg space-y-2 animate-in fade-in duration-150 ${
                      testResult.success
                        ? "bg-[#ecfdf5] dark:bg-[#022c22]/40 border-[#34d399] dark:border-[#10b981] text-[#064e3b] dark:text-[#a7f3d0]"
                        : "bg-[#fff1f2] dark:bg-[#450a0a]/40 border-[#fecaca] dark:border-[#f43f5e] text-[#9f1239] dark:text-[#fca5a5]"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5">
                        {testResult.success ? <CheckCircle2 className="h-4 w-4 text-[#059669]" /> : <AlertCircle className="h-4 w-4 text-[#e11d48]" />}
                        {testResult.success ? `SQL Tested Live: ${testResult.rowCount} Rows Returned in ${testResult.latencyMs}ms` : `SQL Error: ${testResult.error}`}
                      </span>
                      {testResult.success && (
                        <span className="text-lg font-mono opacity-80">
                          Columns: {testResult.columns?.slice(0, 6).join(", ")} {testResult.columns && testResult.columns.length > 6 ? `+${testResult.columns.length - 6} more` : ""}
                        </span>
                      )}
                    </div>

                    {/* Preview Rows Table if available */}
                    {testResult.success && testResult.rows && testResult.rows.length > 0 && (
                      <div className="max-h-40 overflow-auto rounded-lg border border-[#a7f3d0] dark:border-[#065f46] bg-white dark:bg-[#0f172a]">
                        <table className="w-full text-lg text-left border-collapse">
                          <thead className="bg-[#f8fafc] dark:bg-[#1e293b] text-[#64748b] dark:text-[#94a3b8] sticky top-0 border-b border-[#e2e8f0]">
                            <tr>
                              {testResult.columns?.slice(0, 7).map((col) => (
                                <th key={col} className="p-2 font-bold whitespace-nowrap">{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#e2e8f0] dark:divide-[#334155]">
                            {testResult.rows.slice(0, 5).map((row, rIdx) => (
                              <tr key={rIdx}>
                                {testResult.columns?.slice(0, 7).map((col) => (
                                  <td key={col} className="p-2 font-mono whitespace-nowrap text-[#1e293b] dark:text-white truncate max-w-[150px]">
                                    {String(row[col] ?? "-")}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 6. Training Comment */}
              <div className="space-y-1.5">
                <label className="text-lg font-bold text-[#193A69] dark:text-white flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  Business Reasoning / Training Note:
                </label>
                <textarea
                  value={trainComment}
                  onChange={(e) => setTrainComment(e.target.value)}
                  rows={2}
                  placeholder="Explain why this SQL is correct..."
                  className="w-full p-3 rounded-lg text-lg bg-[#f8fafc] dark:bg-[#0f172a] border border-[#cbd5e1] dark:border-[#334155] text-[#1e293b] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[#e2e8f0] dark:border-[#334155] bg-[#f8fafc] dark:bg-[#0f172a] flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-lg text-[#64748b] dark:text-[#94a3b8] text-center sm:text-left">
                ⚡ Training permanently updates AI memory in MSSQL & purges stale caches.
              </span>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <Button
                  onClick={() => setTrainModalOpen(false)}
                  variant="outline"
                  size="sm"
                  className="h-10 px-4 text-lg font-bold border-[#cbd5e1] dark:border-[#334155] text-[#64748b]"
                >
                  Cancel
                </Button>

                <Button
                  onClick={handleSaveAndTrainAI}
                  disabled={isTraining}
                  variant="input"
                  size="sm"
                  className="h-10 px-6 gap-2 text-lg font-bold bg-gradient-to-r from-[#d97706] via-primary to-[#4f46e5] hover:from-[#b45309] hover:to-[#4338ca] text-white shadow-md shadow-primary/20"
                >
                  {isTraining ? (
                    <>
                      {/* <RefreshCw className="h-4 w-4 animate-spin" /> */}
                      Training AI Model...
                    </>
                  ) : (
                    <>
                      {/* <Zap className="h-4 w-4 text-[#fcd34d] fill-[#fcd34d]" /> */}
                      Save & Train AI Model
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                      <span className="px-2.5 py-0.5 rounded-full text-lg font-bold bg-[#ecfdf5] dark:bg-[#022c22]/50 text-[#047857] dark:text-[#34d399] border border-[#a7f3d0] dark:border-[#065f46]">
                        SUCCESS
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-lg font-bold bg-[#fff1f2] dark:bg-[#450a0a]/50 text-[#e11d48] dark:text-[#fda4af] border border-[#fecaca] dark:border-[#991b1b]">
                        FAILED
                      </span>
                    )}
                  </h3>
                  <p className="text-lg text-[#64748b] dark:text-[#94a3b8] mt-0.5">
                    Logged at {formatAuditDateTime(selectedRecord.createdAt).full} • Latency: {selectedRecord.executionTimeMs}ms
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    const rec = selectedRecord;
                    setSelectedRecord(null);
                    handleOpenTrainModal(rec);
                  }}
                  variant="input"
                  size="sm"
                  className="h-9 px-3 gap-1.5 text-lg font-bold bg-[#f59e0b] hover:bg-[#d97706] text-white"
                >
                  <Zap className="h-3.5 w-3.5 fill-current" />
                  Train this Query
                </Button>
                <Button
                  onClick={() => setSelectedRecord(null)}
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 rounded-full text-[#64748b] hover:text-[#1e293b] dark:hover:text-white"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-lg sm:text-base">
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
                    className="h-7 px-2.5 text-lg font-bold gap-1 text-[#64748b]"
                  >
                    {copiedField === "question" ? <Check className="h-3.5 w-3.5 text-[#10b981]" /> : <Copy className="h-3.5 w-3.5" />}
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
                    <Bot className="h-4 w-4 text-[#10b981]" />
                    AI Formatted Answer / Response:
                  </span>
                  <Button
                    onClick={() => handleCopy(selectedRecord.aiResponse || "", "answer")}
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2.5 text-lg font-bold gap-1 text-[#64748b]"
                  >
                    {copiedField === "answer" ? <Check className="h-3.5 w-3.5 text-[#10b981]" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedField === "answer" ? "Copied" : "Copy"}
                  </Button>
                </div>
                <div className="p-4.5 rounded-xl bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] text-[#1e293b] dark:text-white whitespace-pre-wrap font-sans text-lg sm:text-base leading-relaxed">
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
                      className="h-7 px-2.5 text-lg font-bold gap-1 text-[#64748b]"
                    >
                      {copiedField === "sql" ? <Check className="h-3.5 w-3.5 text-[#10b981]" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedField === "sql" ? "Copied SQL" : "Copy SQL"}
                    </Button>
                  </div>
                  <pre className="p-4 rounded-xl bg-[#0f172a] text-[#93c5fd] font-mono text-lg overflow-x-auto border border-[#334155] leading-relaxed">
                    <code>{selectedRecord.generatedSql}</code>
                  </pre>
                </div>
              )}

              {/* 4. Execution Telemetry Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-2">
                <div className="p-3 rounded-lg bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155]">
                  <div className="text-lg font-bold text-[#64748b] dark:text-[#94a3b8] uppercase">Intent</div>
                  <div className="font-bold text-lg text-[#193A69] dark:text-white mt-0.5 truncate">{selectedRecord.intent || "GENERAL"}</div>
                </div>
                <div className="p-3 rounded-lg bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155]">
                  <div className="text-lg font-bold text-[#64748b] dark:text-[#94a3b8] uppercase">Tables Used</div>
                  <div className="font-bold text-lg text-[#193A69] dark:text-white mt-0.5 truncate">{selectedRecord.tablesUsed || "EMPLOYEEMASTER"}</div>
                </div>
                <div className="p-3 rounded-lg bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155]">
                  <div className="text-lg font-bold text-[#64748b] dark:text-[#94a3b8] uppercase">Rows Returned</div>
                  <div className="font-bold text-lg text-[#193A69] dark:text-white mt-0.5">{selectedRecord.rowsReturned || 0}</div>
                </div>
                <div className="p-3 rounded-lg bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155]">
                  <div className="text-lg font-bold text-[#64748b] dark:text-[#94a3b8] uppercase">User / Emp Code</div>
                  <div className="font-bold text-lg text-[#193A69] dark:text-white mt-0.5 truncate">{selectedRecord.empCode || selectedRecord.userId || "-"}</div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[#e2e8f0] dark:border-[#334155] bg-[#f8fafc] dark:bg-[#0f172a] flex items-center justify-between">
              <Button
                onClick={() => {
                  const rec = selectedRecord;
                  setSelectedRecord(null);
                  handleOpenTrainModal(rec);
                }}
                variant="input"
                size="sm"
                className="h-9 px-4 gap-2 text-lg font-bold bg-[#f59e0b] hover:bg-[#d97706] text-white shadow-xs"
              >
                <Zap className="h-4 w-4 fill-current" />
                Train / Fine-Tune Model
              </Button>

              <Button
                onClick={() => setSelectedRecord(null)}
                variant="outline"
                size="sm"
                className="h-9 px-5 text-lg font-bold border-[#cbd5e1] dark:border-[#334155] text-[#193A69] dark:text-white"
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
