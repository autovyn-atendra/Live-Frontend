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
  ChevronDown,
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
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#193A69] dark:text-white">
                  AI Query Logs, Audit & Model Training
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[13px] font-bold bg-[#ecfdf5] dark:bg-[#022c22]/50 text-[#047857] dark:text-[#34d399] border border-[#a7f3d0] dark:border-[#065f46] flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#10b981] animate-pulse"></span>
                  Live RLHF Training
                </span>
              </div>
              <p className="text-[14px] sm:text-[15px] text-[#64748b] dark:text-[#94a3b8] mt-0.5">
                Double-click any query row or click &quot;Train AI&quot; to teach golden SQL rules, fix queries & fine-tune the AI Copilot.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap">
            <Button
              onClick={() => handleOpenTrainModal(null)}
              variant="input"
              size="sm"
              className="h-10 px-4 gap-2 text-[15px] font-bold bg-gradient-to-r from-[#d97706] via-primary to-[#4f46e5] hover:from-[#b45309] hover:to-[#4338ca] text-white shadow-md shadow-primary/20"
            >
              <Zap className="h-4 w-4 text-[#fcd34d] fill-[#fcd34d]" />
              + Train New AI Rule
            </Button>

            <Link href="/autovyn/ai/ai-assistant">
              <Button
                variant="outline"
                size="sm"
                className="h-10 px-3.5 gap-2 text-[15px] font-bold border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] text-[#193A69] dark:text-white hover:bg-[#f1f5f9] dark:hover:bg-[#334155]"
              >
                {/* <MessageSquare className="h-4 w-4 text-primary" /> */}
                AI Assistant
              </Button>
            </Link>

            <Link href="/autovyn/ai/knowledge">
              <Button
                variant="outline"
                size="sm"
                className="h-10 px-3.5 gap-2 text-[15px] font-bold border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] text-[#193A69] dark:text-white hover:bg-[#f1f5f9] dark:hover:bg-[#334155]"
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
              className="h-10 px-3.5 gap-2 text-[15px] border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] text-[#193A69] dark:text-white font-bold"
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

        {/* ── TABS BAR (AUDIT LOGS vs TRAINED RULES) ── */}
        <div className="flex items-center gap-3 border-b border-[#e2e8f0] dark:border-[#334155] pb-3 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab("audit")}
            className={`px-4 py-2.5 rounded-xl font-bold text-[15px] flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "audit"
                ? "bg-[#193A69] text-white shadow-md shadow-[#193A69]/20 ring-2 ring-[#193A69]/40"
                : "bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] text-[#64748b] dark:text-[#94a3b8] hover:bg-[#f1f5f9] dark:hover:bg-[#334155]"
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>📊 AI Query Audit Logs</span>
            <span className={`px-2 py-0.5 text-[12px] rounded-full font-extrabold ${activeTab === "audit" ? "bg-white/20 text-white" : "bg-[#f1f5f9] dark:bg-[#0f172a] text-[#193A69] dark:text-white"}`}>
              {pagination.totalRecords || logs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("rules");
              fetchTrainedRules();
            }}
            className={`px-4 py-2.5 rounded-xl font-bold text-[15px] flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "rules"
                ? "bg-gradient-to-r from-[#d97706] via-[#f59e0b] to-[#b45309] text-white shadow-md shadow-[#d97706]/20 ring-2 ring-[#f59e0b]/40"
                : "bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] text-[#64748b] dark:text-[#94a3b8] hover:bg-[#f1f5f9] dark:hover:bg-[#334155]"
            }`}
          >
            <Zap className="h-4 w-4 fill-current text-[#fef08a]" />
            <span>🧠 Trained AI Rules & Golden Queries</span>
            <span className={`px-2 py-0.5 text-[12px] rounded-full font-extrabold ${activeTab === "rules" ? "bg-white/20 text-white" : "bg-[#fef3c7] dark:bg-[#451a03]/60 text-[#b45309] dark:text-[#fde68a]"}`}>
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
                  className="pl-11 pr-9 h-11 text-[15px] bg-[#f8fafc] dark:bg-[#0f172a] border-[#e2e8f0] dark:border-[#334155] text-[#1e293b] dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 self-end md:self-auto">
                <Button
                  onClick={() => handleOpenTrainModal(null)}
                  variant="input"
                  size="sm"
                  className="h-11 px-5 gap-2 text-[15px] font-bold bg-[#d97706] hover:bg-[#b45309] text-white shadow-xs"
                >
                  {/* <Plus className="h-4 w-4" /> */}
                  Add New Golden Rule
                </Button>
                <Button
                  onClick={fetchTrainedRules}
                  variant="outline"
                  size="sm"
                  disabled={isRulesLoading}
                  className="h-11 px-4 gap-2 text-[15px] border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] text-[#193A69] dark:text-white font-bold"
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
                    <tr className="border-b border-[#e2e8f0] dark:border-[#334155] bg-[#f8fafc] dark:bg-[#0f172a]/70 text-[13px] font-extrabold uppercase tracking-wider text-[#64748b] dark:text-[#94a3b8]">
                      <th className="py-3.5 px-4"># UTD</th>
                      <th className="py-3.5 px-4 min-w-[220px]">Trigger Question / Phrase</th>
                      <th className="py-3.5 px-4">Target Table</th>
                      <th className="py-3.5 px-4">Intent</th>
                      <th className="py-3.5 px-4 min-w-[280px]">Trained Microsoft SQL Query</th>
                      <th className="py-3.5 px-4 text-center">Hits</th>
                      <th className="py-3.5 px-4">Last Verified</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e8f0] dark:divide-[#334155] text-[14px]">
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
                          <p className="text-[14px] text-[#94a3b8] mt-1 max-w-md mx-auto">
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
                            <td className="py-3.5 px-4 font-mono font-bold text-[#64748b] text-[13px]">
                              #{r.UTD}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-[#193A69] dark:text-white">
                              {r.Normalized_Question}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2.5 py-1 rounded-md text-[12px] font-bold bg-[#eff6ff] dark:bg-[#1e3a8a]/40 text-[#2563eb] dark:text-[#93c5fd] border border-[#bfdbfe] dark:border-[#1e3a8a]">
                                {r.Tables_Used || "ERP_MASTER"}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-[#64748b] dark:text-[#94a3b8] font-medium text-[13px]">
                              {r.Intent || "DYNAMIC_CUSTOM"}
                            </td>
                            <td className="py-3.5 px-4">
                              <pre className="p-2 rounded-lg bg-[#0f172a] text-[#93c5fd] font-mono text-[12px] max-w-md overflow-x-auto truncate">
                                <code>{r.SQL_Query}</code>
                              </pre>
                            </td>
                            <td className="py-3.5 px-4 text-center font-bold text-[#059669]">
                              {r.Success_Count || 1}
                            </td>
                            <td className="py-3.5 px-4 text-[13px] text-[#64748b] whitespace-nowrap">
                              {r.Last_Verified_At ? new Date(r.Last_Verified_At).toLocaleDateString("en-IN") : "-"}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  onClick={() => handleOpenTrainModal(null, r)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2.5 text-[13px] font-bold text-[#2563eb] hover:bg-[#eff6ff] dark:hover:bg-[#1e3a8a]/40"
                                >
                                  <Edit3 className="h-3.5 w-3.5 mr-1" />
                                  Edit / Test
                                </Button>
                                <Button
                                  onClick={() => handleDeleteRule(r.UTD, r.Normalized_Question)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2 text-[13px] font-bold text-[#e11d48] hover:bg-[#fff1f2] dark:hover:bg-[#450a0a]/40"
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
              </form>

              <div className="flex items-center gap-2.5 flex-wrap self-end md:self-auto">
                <div className="flex items-center bg-[#f1f5f9] dark:bg-[#0f172a] p-1 rounded-lg border border-[#e2e8f0] dark:border-[#334155]">
                  <button
                    onClick={() => handleStatusChange("ALL")}
                    className={`px-3 py-1.5 text-[13px] font-bold rounded-md transition-colors ${
                      statusFilter === "ALL"
                        ? "bg-white dark:bg-[#1e293b] text-[#193A69] dark:text-white shadow-xs"
                        : "text-[#64748b] dark:text-[#94a3b8] hover:text-[#1e293b]"
                    }`}
                  >
                    All ({stats.totalQueries})
                  </button>
                  <button
                    onClick={() => handleStatusChange("SUCCESS")}
                    className={`px-3 py-1.5 text-[13px] font-bold rounded-md transition-colors ${
                      statusFilter === "SUCCESS"
                        ? "bg-white dark:bg-[#1e293b] text-[#059669] dark:text-[#34d399] shadow-xs"
                        : "text-[#64748b] dark:text-[#94a3b8] hover:text-[#059669]"
                    }`}
                  >
                    Success ({stats.successQueries})
                  </button>
                  <button
                    onClick={() => handleStatusChange("FAILED")}
                    className={`px-3 py-1.5 text-[13px] font-bold rounded-md transition-colors ${
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
                  className="h-11 px-3.5 gap-2 text-[14px] font-bold border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] text-[#193A69] dark:text-white"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </div>

            {/* ── AUDIT LOGS TABLE ── */}
            <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#e2e8f0] dark:border-[#334155] bg-[#f8fafc] dark:bg-[#0f172a]/70 text-[13px] font-extrabold uppercase tracking-wider text-[#64748b] dark:text-[#94a3b8]">
                      <th className="py-3.5 px-4"># UTD</th>
                      <th className="py-3.5 px-4 min-w-[130px]">Time</th>
                      <th className="py-3.5 px-4 min-w-[260px]">User Prompt / Question</th>
                      <th className="py-3.5 px-4">Intent</th>
                      <th className="py-3.5 px-4">Target Table</th>
                      <th className="py-3.5 px-4 min-w-[220px]">Executed SQL</th>
                      <th className="py-3.5 px-4 text-center">Rows</th>
                      <th className="py-3.5 px-4 text-center">Latency</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e8f0] dark:divide-[#334155] text-[14px]">
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
                          <p className="text-[14px] text-[#94a3b8] mt-1">Try changing filters or ask questions in AI Assistant.</p>
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
                            <td className="py-3.5 px-4 font-mono font-bold text-[#64748b] text-[13px]">
                              #{log.UTD}
                            </td>
                            <td className="py-3.5 px-4 text-[#64748b] dark:text-[#94a3b8] text-[13px] whitespace-nowrap">
                              {new Date(log.createdAt).toLocaleString("en-IN", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-[#193A69] dark:text-white max-w-sm">
                              <div className="truncate group-hover:text-primary transition-colors">
                                {log.userQuery}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded text-[12px] font-bold bg-[#f1f5f9] dark:bg-[#334155] text-[#475569] dark:text-[#cbd5e1]">
                                {log.intent || "GENERAL"}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-[#64748b] dark:text-[#94a3b8] font-mono text-[12px] truncate max-w-[130px]">
                              {log.tablesUsed || "EMPLOYEEMASTER"}
                            </td>
                            <td className="py-3.5 px-4 max-w-xs">
                              {log.generatedSql ? (
                                <pre className="p-1.5 rounded bg-[#0f172a] text-[#93c5fd] font-mono text-[11px] truncate">
                                  <code>{log.generatedSql}</code>
                                </pre>
                              ) : (
                                <span className="text-[#94a3b8] text-[12px] italic">No SQL generated</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-center font-bold text-[#193A69] dark:text-white">
                              {log.rowsReturned || 0}
                            </td>
                            <td className="py-3.5 px-4 text-center text-[#64748b] dark:text-[#94a3b8] text-[13px]">
                              {log.executionTimeMs}ms
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-bold ${
                                  isSuccess
                                    ? "bg-[#ecfdf5] dark:bg-[#022c22]/50 text-[#059669] dark:text-[#34d399] border border-[#a7f3d0]"
                                    : "bg-[#fff1f2] dark:bg-[#450a0a]/50 text-[#e11d48] dark:text-[#fda4af] border border-[#fecaca]"
                                }`}
                              >
                                {isSuccess ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                {log.statusCode}
                              </span>
                              {/* 0-rows warning sub-badge */}
                              {isSuccess && (log.rowsReturned === 0 || log.rowsReturned === null) && (
                                <span className="mt-0.5 flex items-center gap-0.5 text-[10px] font-bold text-[#d97706] dark:text-[#fde68a]">
                                  ⚠ 0 rows
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Quick Fix button — extra prominent for failed or 0-row queries */}
                                {!isSuccess || (log.rowsReturned === 0 || log.rowsReturned === null) ? (
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenTrainModal(log);
                                    }}
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-2.5 text-[12px] font-bold bg-[#fff1f2] dark:bg-[#450a0a]/40 text-[#e11d48] dark:text-[#fda4af] border border-[#fecdd3] dark:border-[#881337] hover:bg-[#fecdd3] gap-1 animate-pulse"
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
                                    className="h-8 px-2.5 text-[13px] font-bold text-[#d97706] hover:bg-[#fffbeb] dark:hover:bg-[#451a03]/40 gap-1"
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

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-[#e2e8f0] dark:border-[#334155] bg-[#f8fafc] dark:bg-[#0f172a]/40 flex items-center justify-between">
                  <span className="text-[14px] text-[#64748b] dark:text-[#94a3b8]">
                    Showing page <span className="font-bold">{pagination.page}</span> of{" "}
                    <span className="font-bold">{pagination.totalPages}</span> ({pagination.totalRecords} records)
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => fetchAuditLogs(pagination.page - 1, statusFilter, searchTerm)}
                      disabled={pagination.page <= 1}
                      variant="outline"
                      size="sm"
                      className="h-9 px-3 gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" /> Prev
                    </Button>
                    <Button
                      onClick={() => fetchAuditLogs(pagination.page + 1, statusFilter, searchTerm)}
                      disabled={pagination.page >= pagination.totalPages}
                      variant="outline"
                      size="sm"
                      className="h-9 px-3 gap-1"
                    >
                      Next <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* ── AI TRAINING / FINE-TUNING MODAL (WITH LIVE SQL TEST RUN) ── */}
      {trainModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-[#e2e8f0] dark:border-[#334155] shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
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
                  <p className="text-[13px] text-[#64748b] dark:text-[#94a3b8]">
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
            <div className="p-6 overflow-y-auto space-y-5 text-[15px]">
              {/* 1. Training Action Type */}
              <div className="space-y-2">
                <label className="text-[14px] font-bold text-[#193A69] dark:text-white flex items-center gap-2">
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
                      <span className="font-bold text-[14px]">🏆 Golden Query</span>
                      {trainActionType === "GOLDEN" && <Check className="h-4 w-4 text-primary" />}
                    </div>
                    <span className="text-[12px] opacity-80 mt-1">Verified standard answer for this question</span>
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
                      <span className="font-bold text-[14px]">🎯 Bug Correction</span>
                      {trainActionType === "CORRECTION" && <Check className="h-4 w-4 text-[#d97706]" />}
                    </div>
                    <span className="text-[12px] opacity-80 mt-1">Fix a failed or inaccurate response</span>
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
                      <span className="font-bold text-[14px]">📜 Business Rule</span>
                      {trainActionType === "RULE" && <Check className="h-4 w-4 text-[#2563eb]" />}
                    </div>
                    <span className="text-[12px] opacity-80 mt-1">Leave types, status mapping, formulas</span>
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
                      <span className="font-bold text-[14px]">👍 Upvote & Boost</span>
                      {trainActionType === "HELPFUL" && <Check className="h-4 w-4 text-[#059669]" />}
                    </div>
                    <span className="text-[12px] opacity-80 mt-1">Reinforce successful query hit</span>
                  </button>
                </div>
              </div>

              {/* 2. User Question / Prompt */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[14px] font-bold text-[#193A69] dark:text-white flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    Target User Question / Trigger Prompt:
                  </label>
                  <span className="text-[12px] text-[#64748b] dark:text-[#94a3b8]">Will trigger this trained rule</span>
                </div>
                <Input
                  value={trainQuery}
                  onChange={(e) => setTrainQuery(e.target.value)}
                  placeholder="e.g. Today's service reminders due list or Emp 1004 salary..."
                  className="h-11 text-[15px] font-medium bg-[#f8fafc] dark:bg-[#0f172a] border-[#cbd5e1] dark:border-[#334155] text-[#1e293b] dark:text-white"
                />
              </div>

              {/* 3. Question Variations / Synonyms */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-[#64748b] dark:text-[#94a3b8] flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[#f59e0b]" />
                  Alternative Question Phrases / Synonyms (Optional, Comma separated):
                </label>
                <Input
                  value={trainSynonyms}
                  onChange={(e) => setTrainSynonyms(e.target.value)}
                  placeholder="e.g. service due list, service reminder today, aaj ke service reminder"
                  className="h-10 text-[14px] bg-[#f8fafc] dark:bg-[#0f172a] border-[#e2e8f0] dark:border-[#334155] text-[#1e293b] dark:text-white"
                />
              </div>

              {/* 4. Target ERP Table & Intent Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Table Selector & Custom Table Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[14px] font-bold text-[#193A69] dark:text-white flex items-center gap-2">
                      <Database className="h-4 w-4 text-[#6366f1]" />
                      Primary ERP Target Table:
                    </label>
                    {trainTableSelect === "OTHER" && (
                      <span className="text-[12px] font-bold text-[#d97706] bg-[#fef3c7] dark:bg-[#451a03]/50 px-2 py-0.5 rounded">
                        Custom Active
                      </span>
                    )}
                  </div>
                  <select
                    value={trainTableSelect}
                    onChange={(e) => setTrainTableSelect(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-[#f8fafc] dark:bg-[#0f172a] border border-[#cbd5e1] dark:border-[#334155] text-[14px] font-bold text-[#1e293b] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-primary"
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
                          className="pl-9 h-10 text-[14px] font-bold bg-[#eff6ff] dark:bg-[#172554]/40 border-[#60a5fa] text-[#1e293b] dark:text-white shadow-inner"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Intent Selector & Custom Intent Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[14px] font-bold text-[#193A69] dark:text-white flex items-center gap-2">
                      <Layers className="h-4 w-4 text-[#10b981]" />
                      Intent Category:
                    </label>
                    {trainIntentSelect === "OTHER" && (
                      <span className="text-[12px] font-bold text-[#059669] bg-[#d1fae5] dark:bg-[#022c22]/50 px-2 py-0.5 rounded">
                        Custom Active
                      </span>
                    )}
                  </div>
                  <select
                    value={trainIntentSelect}
                    onChange={(e) => setTrainIntentSelect(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-[#f8fafc] dark:bg-[#0f172a] border border-[#cbd5e1] dark:border-[#334155] text-[14px] font-bold text-[#1e293b] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-primary"
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
                          className="pl-9 h-10 text-[14px] font-bold bg-[#ecfdf5] dark:bg-[#022c22]/40 border-[#34d399] text-[#064e3b] dark:text-white shadow-inner"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 5. SQL Query Editor + Live Test Run Button */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-[14px] font-bold text-[#193A69] dark:text-white flex items-center gap-2">
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
                      className="h-8 px-3 text-[13px] font-bold bg-[#059669] hover:bg-[#047857] text-white gap-1.5 shadow-xs"
                    >
                      <Zap className={`h-3.5 w-3.5 ${isTestingSql ? "animate-spin" : "fill-current"}`} />
                      {isTestingSql ? "Testing Live..." : "⚡ Test Run SQL Now"}
                    </Button>

                    <button
                      type="button"
                      onClick={() => {
                        if (!trainSql.includes("WITH (NOLOCK)")) {
                          setTrainSql((prev) => prev.replace(/(FROM\s+\[?dbo\]?\.?\[?[a-zA-Z0-9_]+\]?)/i, "$1 WITH (NOLOCK)"));
                        }
                      }}
                      className="px-2.5 py-1 rounded text-[12px] font-bold bg-[#eff6ff] dark:bg-[#1e3a8a]/40 text-[#2563eb] hover:bg-[#dbeafe]"
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
                      className="px-2.5 py-1 rounded text-[12px] font-bold bg-[#eff6ff] dark:bg-[#1e3a8a]/40 text-[#2563eb] hover:bg-[#dbeafe]"
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
                  className="w-full p-4 rounded-xl font-mono text-[13px] bg-[#0f172a] text-[#93c5fd] border border-[#334155] focus:outline-hidden focus:ring-2 focus:ring-primary leading-relaxed shadow-inner"
                />

                {/* Live SQL Test Results Preview Box */}
                {testResult && (
                  <div
                    className={`p-3.5 rounded-xl border text-[13px] space-y-2 animate-in fade-in duration-150 ${
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
                        <span className="text-[12px] font-mono opacity-80">
                          Columns: {testResult.columns?.slice(0, 6).join(", ")} {testResult.columns && testResult.columns.length > 6 ? `+${testResult.columns.length - 6} more` : ""}
                        </span>
                      )}
                    </div>

                    {/* Preview Rows Table if available */}
                    {testResult.success && testResult.rows && testResult.rows.length > 0 && (
                      <div className="max-h-40 overflow-auto rounded-lg border border-[#a7f3d0] dark:border-[#065f46] bg-white dark:bg-[#0f172a]">
                        <table className="w-full text-[12px] text-left border-collapse">
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
                <label className="text-[14px] font-bold text-[#193A69] dark:text-white flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  Business Reasoning / Training Note:
                </label>
                <textarea
                  value={trainComment}
                  onChange={(e) => setTrainComment(e.target.value)}
                  rows={2}
                  placeholder="Explain why this SQL is correct..."
                  className="w-full p-3 rounded-lg text-[14px] bg-[#f8fafc] dark:bg-[#0f172a] border border-[#cbd5e1] dark:border-[#334155] text-[#1e293b] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[#e2e8f0] dark:border-[#334155] bg-[#f8fafc] dark:bg-[#0f172a] flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[13px] text-[#64748b] dark:text-[#94a3b8] text-center sm:text-left">
                ⚡ Training permanently updates AI memory in MSSQL & purges stale caches.
              </span>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <Button
                  onClick={() => setTrainModalOpen(false)}
                  variant="outline"
                  size="sm"
                  className="h-10 px-4 text-[14px] font-bold border-[#cbd5e1] dark:border-[#334155] text-[#64748b]"
                >
                  Cancel
                </Button>

                <Button
                  onClick={handleSaveAndTrainAI}
                  disabled={isTraining}
                  variant="input"
                  size="sm"
                  className="h-10 px-6 gap-2 text-[15px] font-bold bg-gradient-to-r from-[#d97706] via-primary to-[#4f46e5] hover:from-[#b45309] hover:to-[#4338ca] text-white shadow-md shadow-primary/20"
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
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    const rec = selectedRecord;
                    setSelectedRecord(null);
                    handleOpenTrainModal(rec);
                  }}
                  variant="input"
                  size="sm"
                  className="h-9 px-3 gap-1.5 text-[13px] font-bold bg-[#f59e0b] hover:bg-[#d97706] text-white"
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
                    className="h-7 px-2.5 text-[13px] font-bold gap-1 text-[#64748b]"
                  >
                    {copiedField === "answer" ? <Check className="h-3.5 w-3.5 text-[#10b981]" /> : <Copy className="h-3.5 w-3.5" />}
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
                      {copiedField === "sql" ? <Check className="h-3.5 w-3.5 text-[#10b981]" /> : <Copy className="h-3.5 w-3.5" />}
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
            <div className="px-6 py-4 border-t border-[#e2e8f0] dark:border-[#334155] bg-[#f8fafc] dark:bg-[#0f172a] flex items-center justify-between">
              <Button
                onClick={() => {
                  const rec = selectedRecord;
                  setSelectedRecord(null);
                  handleOpenTrainModal(rec);
                }}
                variant="input"
                size="sm"
                className="h-9 px-4 gap-2 text-[14px] font-bold bg-[#f59e0b] hover:bg-[#d97706] text-white shadow-xs"
              >
                <Zap className="h-4 w-4 fill-current" />
                Train / Fine-Tune Model
              </Button>

              <Button
                onClick={() => setSelectedRecord(null)}
                variant="outline"
                size="sm"
                className="h-9 px-5 text-[15px] font-bold border-[#cbd5e1] dark:border-[#334155] text-[#193A69] dark:text-white"
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
