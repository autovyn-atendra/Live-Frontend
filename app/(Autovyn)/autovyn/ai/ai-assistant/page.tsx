"use client";

import {
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  Bot,
  Loader2,
  MessageSquare,
  Plus,
  Send,
  User,
  History,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Search,
  Zap,
  Database,
  Calendar,
  Users,
  DollarSign,
  Car,
  AlertCircle,
  FileSpreadsheet,
  BookOpen,
  Volume2,
  VolumeX,
  ThumbsUp,
  ThumbsDown,
  Mic,
  MicOff,
  Clock,
  ArrowRight,
  ShieldCheck,
  X,
  CheckCircle2,
  Activity,
  Wand2,
  FlaskConical,
  GraduationCap,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import axios, { AxiosError } from "axios";

// ============================================================
// CONSTANTS & BASE URL
// ============================================================
const BASE_URL = process.env.NEXT_PUBLIC_URL;

// ============================================================
// TYPES
// ============================================================
interface AIQueryPayload {
  message: string;
  conversationId?: string;
}

interface AIQueryResponse {
  success: boolean;
  message: string;
  data?: {
    answer?: string;
    conversationId?: string;
    mode?: string;
    intent?: string;
    responseTimeMs?: number;
    confidence?: { level?: string; score?: number };
    query?: {
      sql?: string;
      tablesUsed?: string[];
      intent?: string;
      sensitivity?: string;
      generated?: boolean;
      mode?: string;
      explanation?: string;
      reason?: string;
      rowCount?: number;
      totalRowsReturned?: number;
      truncated?: boolean;
      executionTimeMs?: number;
    };
  };
}

interface ConversationSummary {
  conversationId: string;
  title: string;
  conversationType?: string;
  status?: string;
  lastMessageAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ConversationMessage {
  id?: number | string;
  messageId?: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: string;
  routeType?: string;
  responseTimeMs?: number;
  metadata?: any;
}

interface ConversationDetailResponse {
  success: boolean;
  message: string;
  data: { conversationId: string; messages: ConversationMessage[] };
}

interface ConversationListResponse {
  success: boolean;
  message: string;
  data: ConversationSummary[];
}

interface APIErrorResponse {
  success?: boolean;
  message?: string;
  details?: unknown;
}

type MessageRole = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: Date;
  isError?: boolean;
  mode?: string;
  responseTimeMs?: number;
  confidence?: string;
  liked?: boolean | null;
  feedbackSubmitted?: boolean;
  feedbackType?: string;
  feedbackComment?: string;
  sql?: string;
  intent?: string;
  userQuery?: string;
}

// ============================================================
// UTILITIES
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

const queryAI = async (
  payload: AIQueryPayload,
  user?: any
): Promise<AIQueryResponse> => {
  const response = await axios.post<AIQueryResponse>(
    `${BASE_URL}/ai/query`,
    payload,
    { headers: buildAIHeaders(user), timeout: 60000 }
  );
  return response.data;
};

const submitFeedbackAPI = async (
  payload: {
    conversationId?: string;
    feedbackType: string;
    userComment?: string;
    targetTable?: string;
    correctSQL?: string;
    userQuery?: string;
    intent?: string;
    synonyms?: string;
  },
  user?: any
): Promise<{ success: boolean; message?: string }> => {
  const response = await axios.post(`${BASE_URL}/ai/feedback`, payload, {
    headers: buildAIHeaders(user),
  });
  return response.data;
};

const saveTrainedRuleAPI = async (
  payload: {
    question: string;
    sql: string;
    intent?: string;
    targetTable?: string;
    synonyms?: string;
  },
  user?: any
): Promise<{ success: boolean; message?: string }> => {
  const response = await axios.post(`${BASE_URL}/ai/rules/save`, payload, {
    headers: buildAIHeaders(user),
  });
  return response.data;
};

const testSQLQueryAPI = async (
  payload: { sql: string },
  user?: any
): Promise<{
  success: boolean;
  rowCount?: number;
  columns?: string[];
  rows?: any[];
  error?: string;
  latencyMs?: number;
}> => {
  const response = await axios.post(`${BASE_URL}/ai/test-sql`, payload, {
    headers: buildAIHeaders(user),
  });
  return response.data;
};

const fetchERPTablesAPI = async (user?: any): Promise<string[]> => {
  try {
    const response = await axios.get(`${BASE_URL}/ai/schema/tables`, {
      headers: buildAIHeaders(user),
      params: { limit: 500 },
    });
    const data = response.data?.data || response.data?.tables || [];
    if (Array.isArray(data)) {
      return data
        .map((t: any) =>
          typeof t === "string"
            ? t
            : t.Table_Name || t.tableName || t.TABLE_NAME || t.name || ""
        )
        .filter(Boolean)
        .sort();
    }
    return [];
  } catch {
    return [];
  }
};

const listConversations = async (
  user?: any,
  page: number = 1,
  limit: number = 20
): Promise<ConversationListResponse> => {
  const response = await axios.get<ConversationListResponse>(
    `${BASE_URL}/ai/conversations?page=${page}&limit=${limit}`,
    { headers: buildAIHeaders(user) }
  );
  return response.data;
};

const getConversation = async (
  conversationId: string,
  user?: any
): Promise<ConversationDetailResponse> => {
  const response = await axios.get<ConversationDetailResponse>(
    `${BASE_URL}/ai/conversations/${encodeURIComponent(conversationId)}`,
    { headers: buildAIHeaders(user) }
  );
  return response.data;
};

const deleteConversationAPI = async (
  conversationId: string,
  user?: any
): Promise<{ success: boolean }> => {
  const response = await axios.delete(
    `${BASE_URL}/ai/conversations/${encodeURIComponent(conversationId)}`,
    { headers: buildAIHeaders(user) }
  );
  return response.data;
};

const generateMessageId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<APIErrorResponse>;
    if (axiosError.response?.data?.message)
      return axiosError.response.data.message;
    if (axiosError.response?.status === 401)
      return "Your session has expired. Please log in again.";
    if (axiosError.response?.status === 403)
      return "You are not authorized to access this ERP data.";
    if (axiosError.response?.status === 404)
      return "AI API endpoint was not found.";
    if (axiosError.response?.status === 429)
      return "Too many AI requests. Please wait a few moments.";
    if (axiosError.code === "ERR_NETWORK")
      return "Unable to connect to the AI backend server.";
    return axiosError.message || "AI request failed.";
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong while processing your request.";
};

const formatMessageTime = (date: Date) =>
  date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

// ============================================================
// STARTER CATEGORIES
// ============================================================
const STARTER_CATEGORIES = [
  {
    icon: Users,
    title: "HR & Attendance",
    badge: "Attendance Master",
    iconColor: "#2563EB",
    iconBg: "#EFF6FF",
    iconBorder: "#BFDBFE",
    prompts: [
      "21/10/2025 ko kitne log absent the?",
      "19001162 ki attendance details dikhao",
      "Kaun kaun aaj leave par hai?",
    ],
  },
  {
    icon: DollarSign,
    title: "Salary & Payroll",
    badge: "Salary Register",
    iconColor: "#059669",
    iconBg: "#ECFDF5",
    iconBorder: "#A7F3D0",
    prompts: [
      "19001162 ki April 2026 ki salary nikalo",
      "Pramod Arun Palve ki designation aur CTC",
      "Top 5 highest employee salaries",
    ],
  },
  {
    icon: Calendar,
    title: "Employee Master & Bio",
    badge: "Master DB",
    iconColor: "#D97706",
    iconBg: "#FFFBEB",
    iconBorder: "#FDE68A",
    prompts: [
      "19001162 ka birthday kab aata hai?",
      "Iska permanent address kya hai?",
      "Employee 1600161 ka mobile aur email",
    ],
  },
  {
    icon: Car,
    title: "Vehicles & Reminders",
    badge: "Operations",
    iconColor: "#9333EA",
    iconBg: "#FAF5FF",
    iconBorder: "#E9D5FF",
    prompts: [
      "Today's service reminders due list",
      "Pending vehicle delivery status",
      "Upcoming customer follow-ups",
    ],
  },
];

// ============================================================
// COPY BUTTON
// ============================================================
const CopyButton = ({
  text,
  label,
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      title={label || "Copy"}
      className={
        className ||
        "inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1 text-lg font-semibold text-[#475569] transition-all hover:border-[#CBD5E1] hover:bg-[#F1F5F9] hover:text-[#1E293B] dark:border-[#334155] dark:bg-[#1E293B] dark:text-[#94A3B8] dark:hover:bg-[#334155] dark:hover:text-[#F1F5F9]"
      }
    >
      {copied ? (
        <>
          <Check size={12} className="text-[#059669]" />
          <span className="text-[#059669]">Copied!</span>
        </>
      ) : (
        <>
          <Copy size={12} />
          {label && <span>{label}</span>}
        </>
      )}
    </button>
  );
};

// ============================================================
// TTS BUTTON
// ============================================================
const SpeechButton = ({ text }: { text: string }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const handleSpeech = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const clean = text.replace(/[*#`_~|]/g, " ").replace(/\n+/g, ". ").trim();
    const utt = new SpeechSynthesisUtterance(clean);
    utt.rate = 1.0;
    utt.pitch = 1.0;
    utt.onend = () => setIsSpeaking(false);
    utt.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utt);
    setIsSpeaking(true);
  };
  return (
    <button
      type="button"
      onClick={handleSpeech}
      title={isSpeaking ? "Stop" : "Listen"}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-lg font-semibold transition-all ${
        isSpeaking
          ? "animate-pulse border-[#6366F1] bg-[#6366F1] text-[#FFFFFF]"
          : "border-[#E2E8F0] bg-[#F8FAFC] text-[#475569] hover:border-[#CBD5E1] hover:bg-[#F1F5F9] hover:text-[#1E293B] dark:border-[#334155] dark:bg-[#1E293B] dark:text-[#94A3B8] dark:hover:bg-[#334155] dark:hover:text-[#F1F5F9]"
      }`}
    >
      {isSpeaking ? <VolumeX size={12} /> : <Volume2 size={12} />}
      <span>{isSpeaking ? "Stop" : "Listen"}</span>
    </button>
  );
};

// ============================================================
// TYPING INDICATOR
// ============================================================
const TypingIndicator = () => (
  <div className="flex items-start gap-3 animate-in fade-in-50 duration-300">
    <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#193A69] to-[#2563EB] text-[#FFFFFF] shadow-md ring-2 ring-[#2563EB]/20">
      <Bot size={17} />
      <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10B981] opacity-75" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-[#10B981] ring-2 ring-[#FFFFFF] dark:ring-[#0F172A]" />
      </span>
    </div>
    <div className="flex flex-col gap-1.5 max-w-sm">
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-[#193A69] dark:text-[#F1F5F9]">
          AutoVyn Copilot
        </span>
        <span className="rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-2 py-0.5 text-lg font-bold tracking-wider text-[#2563EB] dark:border-[#1E3A8A] dark:bg-[#172554]/60 dark:text-[#60A5FA]">
          QUERYING MSSQL
        </span>
      </div>
      <div className="flex items-center gap-3 rounded-2xl rounded-tl-sm border border-[#E2E8F0] bg-[#FFFFFF] px-4 py-3 shadow-sm dark:border-[#334155] dark:bg-[#1E293B]">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full bg-[#2563EB] animate-bounce"
              style={{ animationDelay: `${i * 0.18}s` }}
            />
          ))}
        </div>
        <span className="animate-pulse text-lg font-medium text-[#64748B] dark:text-[#94A3B8]">
          Analyzing database records & schema...
        </span>
      </div>
    </div>
  </div>
);

// ============================================================
// INLINE FORMATTING
// ============================================================
const renderInline = (text: string) => {
  if (!text) return null;
  return text.split(/(\*\*.*?\*\*|`.*?`)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return (
        <strong key={i} className="font-bold text-[#0F172A] dark:text-[#F1F5F9]">
          {part.slice(2, -2)}
        </strong>
      );
    if (part.startsWith("`") && part.endsWith("`"))
      return (
        <code
          key={i}
          className="rounded-md border border-[#E2E8F0] bg-[#F1F5F9] px-1.5 py-0.5 font-mono text-lg font-bold text-[#2563EB] dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#60A5FA]"
        >
          {part.slice(1, -1)}
        </code>
      );
    return part;
  });
};

// ============================================================
// FORMATTED MARKDOWN
// ============================================================
const FormattedMarkdown = ({ content }: { content: string }) => {
  const [tableFilter, setTableFilter] = useState("");
  if (!content) return null;

  const lines = content.split("\n");
  const blocks: any[] = [];
  let tableRows: string[] = [];
  let inTable = false;

  lines.forEach((line) => {
    const t = line.trim();
    if (t.startsWith("|") && t.endsWith("|")) {
      inTable = true;
      tableRows.push(t);
    } else {
      if (inTable && tableRows.length > 0) {
        blocks.push({ type: "table", rows: [...tableRows] });
        tableRows = [];
        inTable = false;
      }
      if (t && t !== "•") blocks.push({ type: "text", content: t });
      else if (!t) blocks.push({ type: "empty" });
    }
  });
  if (inTable && tableRows.length > 0)
    blocks.push({ type: "table", rows: [...tableRows] });

  return (
    <div className="w-full min-w-0 max-w-full space-y-2 overflow-hidden text-lg leading-relaxed text-[#334155] dark:text-[#E2E8F0]">
      {blocks.map((block, bIdx) => {
        if (block.type === "empty") return <div key={bIdx} className="h-1.5" />;

        if (block.type === "table") {
          const clean = block.rows.filter(
            (r: string) => !/^\|[\s\-:]*\|[\s\-:|]*$/.test(r)
          );
          if (!clean.length) return null;
          const headers = clean[0]
            .split("|")
            .slice(1, -1)
            .map((c: string) => c.trim());
          const dataRows = clean.slice(1);
          const filtered = tableFilter
            ? dataRows.filter((r: string) =>
                r.toLowerCase().includes(tableFilter.toLowerCase())
              )
            : dataRows;
          const csv = [
            headers.join(","),
            ...dataRows.map((r: string) =>
              r
                .split("|")
                .slice(1, -1)
                .map((c: string) => `"${c.trim().replace(/"/g, '""')}"`)
                .join(",")
            ),
          ].join("\n");

          return (
            <div
              key={bIdx}
              className="my-3 w-full overflow-hidden rounded-xl border border-[#E2E8F0] bg-[#FFFFFF] shadow-sm dark:border-[#334155] dark:bg-[#0F172A]"
            >
              {/* Table toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F1F5F9] bg-[#F8FAFC] px-4 py-2.5 dark:border-[#334155] dark:bg-[#1E293B]">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet
                    size={14}
                    className="text-[#059669]"
                  />
                  <span className="text-lg font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                    ERP Results
                  </span>
                  <span className="rounded-full border border-[#E2E8F0] bg-[#FFFFFF] px-2 py-0.5 text-lg font-bold text-[#64748B] dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#94A3B8]">
                    {dataRows.length} records
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {dataRows.length > 4 && (
                    <input
                      type="text"
                      placeholder="Filter..."
                      value={tableFilter}
                      onChange={(e) => setTableFilter(e.target.value)}
                      className="h-7 w-28 rounded-lg border border-[#CBD5E1] bg-[#FFFFFF] px-2 text-lg text-[#0F172A] placeholder-[#94A3B8] focus:border-[#2563EB] focus:outline-none dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#F1F5F9]"
                    />
                  )}
                  <CopyButton text={csv} label="Copy CSV" />
                </div>
              </div>
              {/* Table scroll */}
              <div className="max-h-80 w-full overflow-auto">
                <table className="w-full border-collapse text-lg">
                  <thead className="sticky top-0 z-10 border-b border-[#E2E8F0] bg-[#F1F5F9] dark:border-[#334155] dark:bg-[#1E293B]">
                    <tr>
                      {headers.map((h: string, i: number) => (
                        <th
                          key={i}
                          className="whitespace-nowrap border-r border-[#E2E8F0] px-3 py-2 text-left text-lg font-bold uppercase tracking-wider text-[#475569] last:border-r-0 dark:border-[#334155] dark:text-[#94A3B8]"
                        >
                          {renderInline(h)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9] dark:divide-[#334155]">
                    {filtered.map((rStr: string, rIdx: number) => {
                      const cells = rStr
                        .split("|")
                        .slice(1, -1)
                        .map((c: string) => c.trim());
                      return (
                        <tr
                          key={rIdx}
                          className="transition-colors even:bg-[#F8FAFC] hover:bg-[#F1F5F9] dark:even:bg-[#1E293B]/40 dark:hover:bg-[#1E293B]"
                        >
                          {cells.map((cell: string, cIdx: number) => (
                            <td
                              key={cIdx}
                              className="whitespace-nowrap border-r border-[#E2E8F0]/60 px-3 py-1.5 font-medium text-[#334155] last:border-r-0 dark:border-[#334155]/60 dark:text-[#CBD5E1]"
                            >
                              {renderInline(cell)}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        }

        const text = block.content;
        if (text.startsWith("### "))
          return (
            <h3
              key={bIdx}
              className="mb-1 mt-4 flex items-center gap-2 text-lg font-bold text-[#2563EB] dark:text-[#60A5FA]"
            >
              <span className="h-2 w-2 rounded-full bg-[#2563EB] dark:bg-[#60A5FA]" />
              {renderInline(text.replace(/^###\s+/, ""))}
            </h3>
          );
        if (text.startsWith("#### "))
          return (
            <h4
              key={bIdx}
              className="mb-0.5 mt-3 text-lg font-bold text-[#0F172A] dark:text-[#F1F5F9]"
            >
              {renderInline(text.replace(/^####\s+/, ""))}
            </h4>
          );
        if (text.startsWith("- ") || text.startsWith("* ") || text.startsWith("• "))
          return (
            <div key={bIdx} className="flex items-start gap-2.5 py-0.5 pl-1">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2563EB]" />
              <div className="flex-1 leading-relaxed">
                {renderInline(text.replace(/^([-*•])\s+/, ""))}
              </div>
            </div>
          );
        if (/^\d+\.\s+/.test(text)) {
          const m = text.match(/^(\d+)\.\s+(.*)/);
          return (
            <div key={bIdx} className="flex items-start gap-2.5 py-0.5 pl-1">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[#BFDBFE] bg-[#EFF6FF] text-lg font-bold text-[#2563EB] dark:border-[#1E3A8A] dark:bg-[#172554]/60 dark:text-[#60A5FA]">
                {m?.[1]}
              </span>
              <div className="flex-1 leading-relaxed">
                {renderInline(m?.[2] || "")}
              </div>
            </div>
          );
        }
        return (
          <div key={bIdx} className="break-words py-0.5 leading-relaxed">
            {renderInline(text)}
          </div>
        );
      })}
    </div>
  );
};

// ============================================================
// MESSAGE BUBBLE
// ============================================================
const MessageBubble = ({
  msg,
  conversationId,
  onFeedback,
  user,
}: {
  msg: ChatMessage;
  conversationId?: string | null;
  onFeedback?: (
    id: string,
    feedbackType: string,
    userComment?: string,
    targetTable?: string,
    correctSQL?: string
  ) => Promise<void>;
  user?: any;
}) => {
  const isUser = msg.role === "user";
  const [showPanel, setShowPanel] = useState(false);
  const [selectedReason, setSelectedReason] = useState("INCORRECT_DATA");
  const [commentText, setCommentText] = useState("");
  const [targetTable, setTargetTable] = useState("");
  const [tableSearch, setTableSearch] = useState("");
  const [correctSQL, setCorrectSQL] = useState("");
  const [synonyms, setSynonyms] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingRule, setIsSavingRule] = useState(false);
  const [isTestingSQL, setIsTestingSQL] = useState(false);
  const [sqlTestResult, setSqlTestResult] = useState<{
    success: boolean;
    rowCount?: number;
    error?: string;
    latencyMs?: number;
  } | null>(null);
  const [feedbackSaved, setFeedbackSaved] = useState(
    msg.feedbackSubmitted || false
  );
  const [ruleSaved, setRuleSaved] = useState(false);
  const [erpTables, setErpTables] = useState<string[]>([]);
  const [tablesLoaded, setTablesLoaded] = useState(false);

  const COMMON_TABLES = [
    "EMPLOYEEMASTER",
    "SALARYFILE",
    "attendancetable",
    "Misc_Mst",
    "Srv_Reminder_Tbl",
    "Account_No_Api",
    "emp_varify",
    "Asset_Issue",
    "Approval_Matrix",
    "AI_SQL_Learning_Tbl",
  ];

  const displayTables = erpTables.length > 0 ? erpTables : COMMON_TABLES;
  const filteredTables = tableSearch
    ? displayTables.filter((t) =>
        t.toLowerCase().includes(tableSearch.toLowerCase())
      )
    : displayTables.slice(0, 20);

  const feedbackOptions = [
    { id: "INCORRECT_DATA", label: "Galat Data", icon: "❌" },
    { id: "WRONG_CALCULATION", label: "Calculation Error", icon: "📊" },
    { id: "INCOMPLETE_DATA", label: "Incomplete Data", icon: "⚠️" },
    { id: "WRONG_TABLE", label: "Wrong Table", icon: "🔍" },
    { id: "CUSTOM_RULE", label: "Custom Rule", icon: "✏️" },
  ];

  const loadTables = async () => {
    if (tablesLoaded || !user) return;
    setTablesLoaded(true);
    const tables = await fetchERPTablesAPI(user);
    if (tables.length > 0) setErpTables(tables);
  };

  const handleThumbsUp = async () => {
    if (onFeedback) {
      await onFeedback(msg.id, "HELPFUL");
      setFeedbackSaved(true);
      setShowPanel(false);
    }
  };

  const handleThumbsDown = async () => {
    if (onFeedback) {
      await onFeedback(msg.id, "UNHELPFUL", "Marked as FAILED");
      setFeedbackSaved(true);
    }
    setShowPanel(true);
    loadTables();
  };

  const handleTestSQL = async () => {
    if (!correctSQL.trim()) return;
    setIsTestingSQL(true);
    setSqlTestResult(null);
    try {
      const r = await testSQLQueryAPI({ sql: correctSQL.trim() }, user);
      setSqlTestResult(r);
    } catch (err: any) {
      setSqlTestResult({
        success: false,
        error:
          err?.response?.data?.message || err?.message || "Test failed",
      });
    } finally {
      setIsTestingSQL(false);
    }
  };

  const handleSaveAndTrain = async () => {
    if (!correctSQL.trim()) return alert("Pehle sahi SQL likhiye.");
    const question = msg.userQuery || commentText || "";
    if (!question.trim()) return alert("Original question required.");
    setIsSavingRule(true);
    try {
      const r = await saveTrainedRuleAPI(
        {
          question,
          sql: correctSQL.trim(),
          intent: msg.intent || "DYNAMIC_CUSTOM",
          targetTable: targetTable || undefined,
          synonyms: synonyms || undefined,
        },
        user
      );
      if (r.success) {
        setRuleSaved(true);
        setShowPanel(false);
        if (onFeedback)
          await onFeedback(
            msg.id,
            "GOLDEN",
            commentText || "Trained golden rule",
            targetTable,
            correctSQL.trim()
          ).catch(() => {});
      }
    } catch (err: any) {
      alert("Save failed: " + (err?.response?.data?.message || err?.message));
    } finally {
      setIsSavingRule(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onFeedback) return;
    setIsSubmitting(true);
    try {
      await onFeedback(
        msg.id,
        selectedReason,
        commentText,
        targetTable,
        correctSQL || undefined
      );
      setFeedbackSaved(true);
      setShowPanel(false);
    } catch {}
    finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`group my-1.5 flex w-full min-w-0 gap-3 transition-all animate-in fade-in-50 duration-300 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {/* Bot Avatar */}
      {!isUser && (
        <div className="relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#193A69] to-[#2563EB] text-[#FFFFFF] shadow-md ring-2 ring-[#2563EB]/20">
          <Bot size={17} />
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#10B981] ring-2 ring-[#FFFFFF] dark:ring-[#0F172A]" />
        </div>
      )}

      {/* Bubble */}
      <div
        className={`flex min-w-0 flex-col gap-1.5 ${
          isUser
            ? "max-w-[82%] items-end"
            : "w-full max-w-full items-start sm:max-w-[94%]"
        }`}
      >
        {/* Assistant name tag */}
        {!isUser && (
          <div className="flex items-center gap-2 px-1">
            <span className="text-lg font-bold text-[#193A69] dark:text-[#F1F5F9]">
              AutoVyn AI
            </span>
            {msg.mode && (
              <span className="rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-2 py-0.5 text-lg font-bold text-[#2563EB] dark:border-[#1E3A8A] dark:bg-[#172554]/60 dark:text-[#60A5FA]">
                {msg.mode === "DATABASE"
                  ? "⚡ LIVE ERP"
                  : msg.mode}
              </span>
            )}
            {msg.responseTimeMs && (
              <span className="flex items-center gap-1 text-lg font-mono text-[#94A3B8]">
                <Clock size={10} />
                {msg.responseTimeMs}ms
              </span>
            )}
          </div>
        )}

        {/* Bubble card */}
        <div
          className={`w-full min-w-0 max-w-full overflow-hidden rounded-2xl px-4 py-3.5 shadow-sm transition-all ${
            isUser
              ? "rounded-tr-sm bg-gradient-to-br from-[#193A69] via-[#1D4ED8] to-[#2563EB] text-[#FFFFFF] shadow-[#2563EB]/15"
              : msg.isError
              ? "rounded-tl-sm border border-[#FECDD3] bg-[#FFF1F2] text-[#BE123C] dark:border-[#881337]/50 dark:bg-[#4C0519]/30 dark:text-[#FDA4AF]"
              : "rounded-tl-sm border border-[#E2E8F0] bg-[#FFFFFF] text-[#1E293B] shadow-sm dark:border-[#334155] dark:bg-[#1E293B] dark:text-[#F1F5F9]"
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words text-lg font-medium leading-relaxed">
              {msg.content}
            </p>
          ) : (
            <FormattedMarkdown content={msg.content} />
          )}
        </div>

        {/* User footer */}
        {isUser && (
          <div className="flex items-center justify-end gap-2 px-1">
            <CopyButton
              text={msg.content}
              label="Copy"
              className="inline-flex items-center gap-1 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-1 text-lg font-semibold text-[#64748B] transition hover:bg-[#F1F5F9] hover:text-[#1E293B] dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#94A3B8] dark:hover:bg-[#1E293B] dark:hover:text-[#F1F5F9]"
            />
            <span className="font-mono text-lg text-[#94A3B8]">
              {formatMessageTime(msg.createdAt)}
            </span>
          </div>
        )}

        {/* Assistant footer */}
        {!isUser && !msg.isError && (
          <div className="flex w-full flex-col gap-2 mt-0.5">
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              {/* Action pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <CopyButton text={msg.content} label="Copy" />
                <SpeechButton text={msg.content} />

                {/* Thumbs up */}
                <button
                  type="button"
                  onClick={handleThumbsUp}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-lg font-semibold transition ${
                    msg.liked === true
                      ? "border-[#A7F3D0] bg-[#ECFDF5] text-[#059669] dark:border-[#065F46] dark:bg-[#022C22]/40 dark:text-[#34D399]"
                      : "border-[#E2E8F0] bg-[#F8FAFC] text-[#94A3B8] hover:border-[#A7F3D0] hover:bg-[#ECFDF5] hover:text-[#059669] dark:border-[#334155] dark:bg-[#1E293B] dark:text-[#475569] dark:hover:text-[#34D399]"
                  }`}
                >
                  <ThumbsUp size={12} />
                  <span>Helpful</span>
                </button>

                {/* Thumbs down */}
                <button
                  type="button"
                  onClick={handleThumbsDown}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-lg font-semibold transition ${
                    msg.liked === false
                      ? "border-[#FECDD3] bg-[#FFF1F2] text-[#E11D48] dark:border-[#881337] dark:bg-[#4C0519]/40 dark:text-[#FB7185]"
                      : "border-[#E2E8F0] bg-[#F8FAFC] text-[#94A3B8] hover:border-[#FECDD3] hover:bg-[#FFF1F2] hover:text-[#E11D48] dark:border-[#334155] dark:bg-[#1E293B] dark:text-[#475569] dark:hover:text-[#FB7185]"
                  }`}
                >
                  <ThumbsDown size={12} />
                  <span>Wrong</span>
                </button>

                {/* Fix / Train */}
                <button
                  type="button"
                  onClick={() => {
                    setShowPanel(!showPanel);
                    if (!showPanel) loadTables();
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-lg font-semibold transition ${
                    showPanel
                      ? "border-[#C7D2FE] bg-[#EEF2FF] text-[#4F46E5] dark:border-[#4338CA] dark:bg-[#312E81]/40 dark:text-[#818CF8]"
                      : "border-[#E2E8F0] bg-[#F8FAFC] text-[#6366F1] hover:border-[#C7D2FE] hover:bg-[#EEF2FF] dark:border-[#334155] dark:bg-[#1E293B] dark:text-[#818CF8]"
                  }`}
                >
                  <Wand2 size={12} />
                  <span>Fix / Train AI</span>
                </button>

                {/* Status pills */}
                {msg.liked === false && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#FECDD3] bg-[#FFF1F2] px-2 py-0.5 text-lg font-bold text-[#E11D48] animate-in fade-in-50 dark:border-[#881337] dark:bg-[#4C0519]/40 dark:text-[#FB7185]">
                    <XCircle size={10} />
                    Moved to Failed
                  </span>
                )}
                {msg.liked === true && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#A7F3D0] bg-[#ECFDF5] px-2 py-0.5 text-lg font-bold text-[#059669] animate-in fade-in-50 dark:border-[#065F46] dark:bg-[#022C22]/40 dark:text-[#34D399]">
                    <CheckCircle2 size={10} />
                    Marked Success
                  </span>
                )}
                {ruleSaved && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#A7F3D0] bg-[#ECFDF5] px-2 py-0.5 text-lg font-bold text-[#059669] animate-in fade-in-50 dark:border-[#065F46] dark:bg-[#022C22]/40 dark:text-[#34D399]">
                    <CheckCircle2 size={10} />
                    AI Trained ✓
                  </span>
                )}
              </div>

              <span className="shrink-0 font-mono text-lg text-[#94A3B8]">
                {formatMessageTime(msg.createdAt)}
              </span>
            </div>

            {/* ── Training Panel ── */}
            {showPanel && (
              <div className="mt-1 w-full animate-in fade-in-50 zoom-in-95 duration-200">
                <div className="rounded-xl border border-[#C7D2FE] bg-[#FAFAFA] p-4 shadow-sm dark:border-[#4338CA]/40 dark:bg-[#0F172A]">
                  {/* Panel header */}
                  <div className="mb-3 flex items-center justify-between border-b border-[#E2E8F0] pb-3 dark:border-[#334155]">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EEF2FF] dark:bg-[#312E81]/40">
                        <GraduationCap size={14} className="text-[#6366F1]" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                          AI Training Panel
                        </p>
                        <p className="text-lg text-[#64748B] dark:text-[#94A3B8]">
                          Instant Learning from correct SQL
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPanel(false)}
                      className="rounded-lg p-1 text-[#94A3B8] transition hover:bg-[#E2E8F0] hover:text-[#1E293B] dark:hover:bg-[#334155] dark:hover:text-[#F1F5F9]"
                    >
                      <X size={13} />
                    </button>
                  </div>

                  {/* Wrong alert */}
                  {msg.liked === false && (
                    <div className="mb-3 flex items-start gap-2 rounded-lg border border-[#FECDD3] bg-[#FFF1F2] p-2.5 dark:border-[#881337]/50 dark:bg-[#4C0519]/30">
                      <XCircle
                        size={14}
                        className="mt-0.5 shrink-0 text-[#E11D48]"
                      />
                      <p className="text-lg text-[#9F1239] dark:text-[#FECDD3]">
                        Query moved to{" "}
                        <strong>FAILED history</strong>. Write correct SQL
                        below to train AI instantly.
                      </p>
                    </div>
                  )}

                  {/* Original Question */}
                  {msg.userQuery && (
                    <div className="mb-3 rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-2.5 dark:border-[#334155] dark:bg-[#1E293B]">
                      <p className="mb-1 text-lg font-bold uppercase tracking-wider text-[#94A3B8]">
                        Original Question
                      </p>
                      <p className="text-lg font-medium text-[#334155] dark:text-[#E2E8F0]">
                        {msg.userQuery}
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    {/* Issue type */}
                    <div>
                      <p className="mb-1.5 text-lg font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                        Issue Type
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {feedbackOptions.map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setSelectedReason(opt.id)}
                            className={`flex items-center gap-1 rounded-lg px-2 py-1 text-lg font-semibold transition ${
                              selectedReason === opt.id
                                ? "bg-[#6366F1] text-[#FFFFFF] shadow-sm"
                                : "border border-[#E2E8F0] bg-[#FFFFFF] text-[#475569] hover:border-[#6366F1]/40 hover:text-[#6366F1] dark:border-[#334155] dark:bg-[#1E293B] dark:text-[#94A3B8]"
                            }`}
                          >
                            <span>{opt.icon}</span>
                            <span>{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Correct SQL */}
                    <div>
                      <p className="mb-1.5 text-lg font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                        ⚡ Correct SQL (AI will learn this)
                      </p>
                      <textarea
                        value={correctSQL}
                        onChange={(e) => {
                          setCorrectSQL(e.target.value);
                          setSqlTestResult(null);
                        }}
                        rows={4}
                        placeholder={`SELECT TOP 100 *\nFROM [dbo].[Srv_Reminder_Tbl] WITH (NOLOCK)\nWHERE CAST(Final_Due_Date AS DATE) = CAST(GETDATE() AS DATE)\nORDER BY Final_Due_Date ASC;`}
                        className="w-full resize-y rounded-lg border border-[#334155] bg-[#0F172A] p-2.5 font-mono text-lg text-[#A5F3FC] placeholder-[#475569] focus:border-[#6366F1] focus:outline-none focus:ring-1 focus:ring-[#6366F1]/30"
                        spellCheck={false}
                      />
                      {/* Test button */}
                      <div className="mt-1.5 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleTestSQL}
                          disabled={isTestingSQL || !correctSQL.trim()}
                          className="flex items-center gap-1.5 rounded-lg border border-[#334155] bg-[#1E293B] px-2.5 py-1 text-lg font-bold text-[#A5F3FC] transition hover:border-[#6366F1]/50 disabled:opacity-40"
                        >
                          {isTestingSQL ? (
                            <Loader2 size={11} className="animate-spin" />
                          ) : (
                            <FlaskConical size={11} />
                          )}
                          {isTestingSQL ? "Testing..." : "Test SQL Live"}
                        </button>
                        {sqlTestResult && (
                          <span
                            className={`flex items-center gap-1 text-lg font-bold ${
                              sqlTestResult.success
                                ? "text-[#059669]"
                                : "text-[#E11D48]"
                            }`}
                          >
                            {sqlTestResult.success ? (
                              <>
                                <CheckCircle2 size={11} />
                                {sqlTestResult.rowCount ?? 0} rows ·{" "}
                                {sqlTestResult.latencyMs}ms
                              </>
                            ) : (
                              <>
                                <AlertCircle size={11} />
                                {sqlTestResult.error?.slice(0, 55)}
                              </>
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Target Table */}
                    <div>
                      <p className="mb-1.5 text-lg font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                        Target ERP Table
                      </p>
                      <div className="mb-1.5 flex items-center gap-2">
                        <div className="relative flex-1">
                          <Search
                            size={11}
                            className="absolute left-2 top-2 text-[#94A3B8]"
                          />
                          <input
                            type="text"
                            value={tableSearch}
                            onChange={(e) => setTableSearch(e.target.value)}
                            placeholder="Search ERP tables..."
                            className="w-full rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] py-1.5 pl-6 pr-2 text-lg text-[#334155] placeholder-[#94A3B8] focus:border-[#6366F1] focus:outline-none dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#F1F5F9]"
                          />
                        </div>
                        {targetTable && (
                          <span className="rounded-md border border-[#C7D2FE] bg-[#EEF2FF] px-2 py-0.5 font-mono text-lg font-bold text-[#6366F1] dark:border-[#4338CA] dark:bg-[#312E81]/40 dark:text-[#818CF8]">
                            {targetTable}
                          </span>
                        )}
                      </div>
                      <div className="flex max-h-14 flex-wrap gap-1 overflow-y-auto">
                        {filteredTables.map((tbl) => (
                          <button
                            key={tbl}
                            type="button"
                            onClick={() => setTargetTable(tbl)}
                            className={`rounded-md px-1.5 py-0.5 font-mono text-lg transition ${
                              targetTable === tbl
                                ? "border border-[#C7D2FE] bg-[#EEF2FF] font-bold text-[#6366F1] dark:border-[#4338CA] dark:bg-[#312E81]/40 dark:text-[#818CF8]"
                                : "border border-[#E2E8F0] bg-[#FFFFFF] text-[#64748B] hover:bg-[#F1F5F9] dark:border-[#334155] dark:bg-[#1E293B] dark:text-[#94A3B8]"
                            }`}
                          >
                            {tbl}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Synonyms */}
                    <div>
                      <p className="mb-1 text-lg font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                        Alternate Phrasings (Optional)
                      </p>
                      <input
                        type="text"
                        value={synonyms}
                        onChange={(e) => setSynonyms(e.target.value)}
                        placeholder="aaj ki service list, today service due, service reminder today"
                        className="w-full rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] px-2.5 py-1.5 text-lg text-[#334155] placeholder-[#94A3B8] focus:border-[#6366F1] focus:outline-none dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#F1F5F9]"
                      />
                    </div>

                    {/* Comment */}
                    <div>
                      <p className="mb-1 text-lg font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                        Comment (Optional)
                      </p>
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        rows={2}
                        placeholder="Kya galat tha aur kyun ye sahi hai..."
                        className="w-full resize-none rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-2 text-lg text-[#334155] placeholder-[#94A3B8] focus:border-[#6366F1] focus:outline-none dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#F1F5F9]"
                      />
                    </div>
                  </div>

                  {/* Panel footer */}
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#E2E8F0] pt-3 dark:border-[#334155]">
                    <button
                      type="button"
                      onClick={() => setShowPanel(false)}
                      className="rounded-lg px-3 py-1.5 text-lg font-semibold text-[#64748B] transition hover:bg-[#E2E8F0] hover:text-[#1E293B] dark:text-[#94A3B8] dark:hover:bg-[#334155] dark:hover:text-[#F1F5F9]"
                    >
                      Cancel
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={handleFormSubmit as any}
                        className="flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] px-3 py-1.5 text-lg font-semibold text-[#475569] transition hover:bg-[#F8FAFC] disabled:opacity-50 dark:border-[#334155] dark:bg-[#1E293B] dark:text-[#94A3B8]"
                      >
                        {isSubmitting ? (
                          <Loader2 size={11} className="animate-spin" />
                        ) : null}
                        Log Feedback
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveAndTrain}
                        disabled={isSavingRule || !correctSQL.trim()}
                        className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#6366F1] to-[#4F46E5] px-3 py-1.5 text-lg font-bold text-[#FFFFFF] shadow-sm transition hover:from-[#4F46E5] hover:to-[#4338CA] disabled:pointer-events-none disabled:opacity-40"
                        title={!correctSQL.trim() ? "Pehle SQL likhiye" : ""}
                      >
                        {isSavingRule ? (
                          <Loader2 size={11} className="animate-spin" />
                        ) : (
                          <Wand2 size={11} />
                        )}
                        {isSavingRule ? "Training..." : "Save & Train AI"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#193A69] to-[#2563EB] text-[#FFFFFF] shadow-md">
          <User size={17} />
        </div>
      )}
    </div>
  );
};

// ============================================================
// EMPTY STATE
// ============================================================
const EmptyState = ({
  userName,
  onPromptClick,
}: {
  userName?: string;
  onPromptClick: (p: string) => void;
}) => (
  <div className="flex min-h-full flex-col items-center justify-center py-8 px-4">
    <div className="w-full max-w-6xl space-y-7 text-center">
      {/* Bot icon */}
      <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
        <div className="absolute inset-0 animate-pulse rounded-3xl bg-[#2563EB]/15 blur-xl" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#193A69] via-[#1D4ED8] to-[#2563EB] text-[#FFFFFF] shadow-xl ring-4 ring-[#2563EB]/15">
          <Bot size={38} />
        </div>
      </div>

      {/* Headline */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-1.5 dark:border-[#1E3A8A] dark:bg-[#172554]/60">
          <Sparkles size={13} className="text-[#2563EB]" />
          <span className="text-lg font-bold text-[#2563EB] dark:text-[#60A5FA]">
            AutoVyn AI Copilot • Live ERP Intelligence
          </span>
        </div>

        <h2 className="text-2xl font-extrabold tracking-tight text-[#0F172A] dark:text-[#F8FAFC] sm:text-3xl">
          {userName
            ? `${getTimeGreeting()}, ${userName}! 👋`
            : "How can I help you today?"}
        </h2>

        <p className="mx-auto max-w-xl text-lg text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
          Ask in{" "}
          <span className="font-bold text-[#2563EB] dark:text-[#60A5FA]">
            Hindi, English, or Hinglish
          </span>
          . I query live MSSQL tables for attendance, salary, employee
          records, and service alerts.
        </p>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-1 gap-3 text-left sm:grid-cols-2">
        {STARTER_CATEGORIES.map((cat, idx) => {
          const Icon = cat.icon;
          return (
            <div
              key={idx}
              className="group overflow-hidden rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF] p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#BFDBFE] hover:shadow-md dark:border-[#334155] dark:bg-[#1E293B] dark:hover:border-[#1E3A8A]"
            >
              {/* Card header */}
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-xl border"
                    style={{
                      background: cat.iconBg,
                      borderColor: cat.iconBorder,
                    }}
                  >
                    <Icon size={16} style={{ color: cat.iconColor }} />
                  </div>
                  <h3 className="text-lg font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                    {cat.title}
                  </h3>
                </div>
                <span className="rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-0.5 text-lg font-bold text-[#64748B] dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#94A3B8]">
                  {cat.badge}
                </span>
              </div>

              {/* Prompts */}
              <div className="space-y-1">
                {cat.prompts.map((p, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => onPromptClick(p)}
                    className="group/item flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-left text-lg text-[#475569] transition-all hover:bg-[#F1F5F9] hover:text-[#1E293B] dark:text-[#94A3B8] dark:hover:bg-[#334155] dark:hover:text-[#F1F5F9]"
                  >
                    <span className="truncate">{p}</span>
                    <ArrowRight
                      size={11}
                      className="shrink-0 opacity-0 transition-all group-hover/item:translate-x-0.5 group-hover/item:opacity-100"
                      style={{ color: cat.iconColor }}
                    />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature badges */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {[
          {
            icon: <Zap size={12} className="text-[#F59E0B]" />,
            label: "Sub-second Execution",
          },
          {
            icon: <ShieldCheck size={12} className="text-[#10B981]" />,
            label: "Enterprise SQL Guard",
          },
          {
            icon: <Database size={12} className="text-[#3B82F6]" />,
            label: "Live MSSQL Sync",
          },
          {
            icon: <BookOpen size={12} className="text-[#A855F7]" />,
            label: "Multi-turn Memory",
          },
        ].map((b) => (
          <span
            key={b.label}
            className="flex items-center gap-1.5 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1 text-lg font-semibold text-[#475569] dark:border-[#334155] dark:bg-[#1E293B] dark:text-[#94A3B8]"
          >
            {b.icon}
            {b.label}
          </span>
        ))}
      </div>
    </div>
  </div>
);

// ============================================================
// MAIN PAGE
// ============================================================
export default function AIAssistantPage() {
  const user = useCurrentUser() as any;

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [convPage, setConvPage] = useState(1);
  const [hasMoreConversations, setHasMoreConversations] = useState(true);
  const [isLoadingMoreConversations, setIsLoadingMoreConversations] =
    useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const activeConversationIdRef = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isRefreshingConversations, setIsRefreshingConversations] =
    useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistorySidebar, setShowHistorySidebar] = useState(true);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const recognitionRef = useRef<any>(null);

  const updateActiveConversationId = (id: string | null) => {
    activeConversationIdRef.current = id;
    setActiveConversationId(id);
  };

  const focusInput = () =>
    window.setTimeout(() => textareaRef.current?.focus(), 50);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        140
      )}px`;
    }
  }, [message]);

  const PAGE_SIZE = 20;

  const loadConversations = useCallback(
    async (isReset = false, quiet = false) => {
      if (!user?.Comp_Code && !user?.compcode) return;
      if (isReset) {
        if (!quiet) setIsRefreshingConversations(true);
        try {
          const res = await listConversations(user, 1, PAGE_SIZE);
          if (res.success && Array.isArray(res.data)) {
            setConversations(res.data);
            setConvPage(1);
            setHasMoreConversations(res.data.length >= PAGE_SIZE);
          }
        } catch {}
        finally {
          if (!quiet) setIsRefreshingConversations(false);
        }
      } else {
        if (isLoadingMoreConversations || !hasMoreConversations) return;
        setIsLoadingMoreConversations(true);
        try {
          const nextPage = convPage + 1;
          const res = await listConversations(user, nextPage, PAGE_SIZE);
          if (res.success && Array.isArray(res.data)) {
            if (res.data.length === 0) {
              setHasMoreConversations(false);
            } else {
              setConversations((prev) => {
                const ids = new Set(prev.map((c) => c.conversationId));
                return [
                  ...prev,
                  ...res.data.filter((c) => !ids.has(c.conversationId)),
                ];
              });
              setConvPage(nextPage);
              if (res.data.length < PAGE_SIZE) setHasMoreConversations(false);
            }
          }
        } catch {}
        finally {
          setIsLoadingMoreConversations(false);
        }
      }
    },
    [user, convPage, hasMoreConversations, isLoadingMoreConversations]
  );

  useEffect(() => {
    loadConversations(true, true);
  }, [user?.Comp_Code, user?.compcode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, isLoading]);

  const handleSessionsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 60) {
      if (
        !isLoadingMoreConversations &&
        hasMoreConversations &&
        !isRefreshingConversations &&
        !searchFilter
      )
        loadConversations(false, true);
    }
  };

  const handleSelectConversation = async (conversationId: string) => {
    if (
      !conversationId ||
      conversationId === "undefined" ||
      conversationId === activeConversationIdRef.current ||
      isLoadingHistory
    )
      return;
    setIsLoadingHistory(true);
    setError(null);
    updateActiveConversationId(conversationId);
    try {
      const res = await getConversation(conversationId, user);
      if (res.success && res.data?.messages) {
        const loaded: ChatMessage[] = res.data.messages
          .filter((m) => m.role !== "system")
          .map((m, i) => ({
            id: `${conversationId}-${i}-${m.id ?? i}`,
            role: m.role === "user" ? "user" : "assistant",
            content: m.content || "",
            createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
            mode: m.routeType || undefined,
            responseTimeMs: m.responseTimeMs || undefined,
          }));
        setMessages(loaded);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoadingHistory(false);
      focusInput();
    }
  };

  const handleDeleteConversation = async (
    conversationId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    try {
      await deleteConversationAPI(conversationId, user);
    } catch {}
    setConversations((prev) =>
      prev.filter((c) => c.conversationId !== conversationId)
    );
    if (activeConversationId === conversationId) handleNewChat();
  };

  const handleNewChat = () => {
    updateActiveConversationId(null);
    setMessages([]);
    setError(null);
    focusInput();
  };

  const handleClearMessages = () => {
    setMessages([]);
    setError(null);
  };

  const handlePromptClick = (promptText: string) => {
    setMessage(promptText);
    focusInput();
  };

  const toggleSpeechRecognition = () => {
    if (typeof window === "undefined") return;
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR)
      return alert(
        "Voice input not supported. Please use Chrome or Edge."
      );
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    try {
      const r = new SR();
      r.lang = "hi-IN";
      r.continuous = false;
      r.interimResults = false;
      r.onstart = () => setIsListening(true);
      r.onend = () => setIsListening(false);
      r.onerror = () => setIsListening(false);
      r.onresult = (event: any) => {
        const t = event.results[0][0]?.transcript || "";
        if (t) setMessage((prev) => (prev ? `${prev} ${t}` : t));
      };
      recognitionRef.current = r;
      r.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleFeedback = async (
    id: string,
    feedbackType: string,
    userComment?: string,
    targetTable?: string,
    correctSQL?: string
  ) => {
    const targetMsg = messages.find((m) => m.id === id);
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              liked: feedbackType === "HELPFUL" ? true : false,
              feedbackSubmitted: true,
              feedbackType,
              feedbackComment: userComment,
            }
          : m
      )
    );
    try {
      await submitFeedbackAPI(
        {
          conversationId: activeConversationIdRef.current || undefined,
          feedbackType,
          userComment,
          targetTable,
          userQuery: targetMsg?.userQuery,
          correctSQL: correctSQL?.trim(),
          intent: targetMsg?.intent,
        },
        user
      );
    } catch {}
  };

  const executeSend = async (rawMessage?: string) => {
    const text = (rawMessage !== undefined ? rawMessage : message).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: generateMessageId(),
      role: "user",
      content: text,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setMessage("");
    setError(null);
    setIsLoading(true);

    try {
      const res = await queryAI(
        {
          message: text,
          conversationId: activeConversationIdRef.current || undefined,
        },
        user
      );

      const answer = String(res.data?.answer || "").trim();
      const returnedCid = res.data?.conversationId;
      const targetCid = returnedCid || activeConversationIdRef.current;

      if (targetCid) {
        if (returnedCid && returnedCid !== activeConversationIdRef.current)
          updateActiveConversationId(returnedCid);
        setConversations((prev) => {
          const existing = prev.find((c) => c.conversationId === targetCid);
          const updated: ConversationSummary = existing
            ? {
                ...existing,
                lastMessageAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }
            : {
                conversationId: targetCid,
                title: text.slice(0, 50) + (text.length > 50 ? "..." : ""),
                conversationType: "GENERAL",
                status: "ACTIVE",
                lastMessageAt: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
          return [updated, ...prev.filter((c) => c.conversationId !== targetCid)];
        });
      }

      if (!answer) throw new Error("AI returned an empty response.");

      const assistantMsg: ChatMessage = {
        id: generateMessageId(),
        role: "assistant",
        content: answer,
        createdAt: new Date(),
        mode: res.data?.mode,
        responseTimeMs: res.data?.responseTimeMs,
        confidence: res.data?.confidence?.level,
        sql: res.data?.query?.sql,
        intent: res.data?.intent,
        userQuery: text,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      setMessages((prev) => [
        ...prev,
        {
          id: generateMessageId(),
          role: "assistant",
          content: `Kshama kijiye, an error occurred: ${msg}`,
          createdAt: new Date(),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
      focusInput();
    }
  };

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    executeSend();
  };

  const filteredConversations = conversations.filter((c) =>
    (c.title || "")
      .toLowerCase()
      .includes(searchFilter.toLowerCase().trim())
  );

  const hasMessages = messages.length > 0;
  const isInputDisabled = isLoading || isLoadingHistory;

  return (
    <div className="relative flex h-[calc(100vh-75px)] w-full overflow-hidden rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF] shadow-lg dark:border-[#334155] dark:bg-[#0F172A] sm:h-[calc(100vh-160px)]">

      {/* Mobile backdrop */}
      {showHistorySidebar && (
        <div
          onClick={() => setShowHistorySidebar(false)}
          className="fixed inset-0 z-20 bg-[#000000]/40 backdrop-blur-sm md:hidden"
        />
      )}

      {/* ══════════════════════════════════════════
          SIDEBAR
      ══════════════════════════════════════════ */}
      <div
        className={`fixed inset-y-0 left-0 z-30 flex flex-col border-r border-[#E2E8F0] bg-[#F8FAFC] transition-all duration-300 dark:border-[#334155] dark:bg-[#0F172A] md:relative md:z-auto ${
          showHistorySidebar
            ? "w-64 translate-x-0"
            : "-translate-x-full md:w-0 md:translate-x-0 md:overflow-hidden md:border-none"
        }`}
      >
        {/* Sidebar header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#E2E8F0] bg-[#FFFFFF] px-4 dark:border-[#334155] dark:bg-[#1E293B]">
          <div className="flex items-center gap-2">
            <History size={15} className="text-[#2563EB]" />
            <span className="text-lg font-bold text-[#0F172A] dark:text-[#F1F5F9]">
              Chat Sessions
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => loadConversations(true, false)}
              disabled={isRefreshingConversations}
              className="rounded-lg p-1.5 text-[#94A3B8] transition hover:bg-[#F1F5F9] hover:text-[#1E293B] disabled:opacity-40 dark:hover:bg-[#334155] dark:hover:text-[#F1F5F9]"
            >
              <RefreshCw
                size={13}
                className={isRefreshingConversations ? "animate-spin text-[#2563EB]" : ""}
              />
            </button>
            <button
              type="button"
              onClick={handleNewChat}
              className="rounded-lg p-1.5 text-[#2563EB] transition hover:bg-[#EFF6FF] dark:hover:bg-[#172554]/40"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* New + Search */}
        <div className="space-y-2 border-b border-[#E2E8F0] p-3 dark:border-[#334155]">
          <button
            type="button"
            onClick={handleNewChat}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-2 text-lg font-bold transition-all ${
              !activeConversationId
                ? "bg-[#2563EB] text-[#FFFFFF] shadow-sm shadow-[#2563EB]/30"
                : "border border-[#E2E8F0] bg-[#FFFFFF] text-[#475569] hover:bg-[#F8FAFC] dark:border-[#334155] dark:bg-[#1E293B] dark:text-[#CBD5E1] dark:hover:bg-[#334155]"
            }`}
          >
            <Plus size={14} />
            New Chat
          </button>

          {conversations.length > 3 && (
            <div className="relative">
              <Search
                size={12}
                className="absolute left-2.5 top-2 text-[#94A3B8]"
              />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search chats..."
                className="w-full rounded-xl border border-[#E2E8F0] bg-[#FFFFFF] py-1.5 pl-7 pr-2 text-lg text-[#0F172A] placeholder-[#94A3B8] focus:border-[#2563EB] focus:outline-none dark:border-[#334155] dark:bg-[#1E293B] dark:text-[#F1F5F9]"
              />
            </div>
          )}
        </div>

        {/* Sessions list */}
        <div
          className="flex-1 space-y-0.5 overflow-y-auto p-2"
          onScroll={handleSessionsScroll}
        >
          {isRefreshingConversations && conversations.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-8 text-lg text-[#64748B]">
              <Loader2 size={14} className="animate-spin text-[#2563EB]" />
              Loading sessions...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <MessageSquare
                size={22}
                className="text-[#CBD5E1] dark:text-[#475569]"
              />
              <p className="text-lg font-medium text-[#94A3B8]">
                {searchFilter ? "No matching chats" : "No sessions yet"}
              </p>
            </div>
          ) : (
            <>
              {filteredConversations.map((conv) => {
                const active = conv.conversationId === activeConversationId;
                return (
                  <div
                    key={conv.conversationId}
                    onClick={() => {
                      handleSelectConversation(conv.conversationId);
                      if (window.innerWidth < 768)
                        setShowHistorySidebar(false);
                    }}
                    className={`group relative flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 transition-all ${
                      active
                        ? "bg-[#EFF6FF] text-[#2563EB] dark:bg-[#172554]/50 dark:text-[#60A5FA]"
                        : "text-[#475569] hover:bg-[#FFFFFF] hover:text-[#0F172A] dark:text-[#94A3B8] dark:hover:bg-[#1E293B] dark:hover:text-[#F1F5F9]"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <MessageSquare
                        size={12}
                        className={
                          active
                            ? "shrink-0 text-[#2563EB] dark:text-[#60A5FA]"
                            : "shrink-0 text-[#CBD5E1] dark:text-[#475569]"
                        }
                      />
                      <span className="truncate text-lg font-medium">
                        {conv.title || "ERP Query Session"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) =>
                        handleDeleteConversation(conv.conversationId, e)
                      }
                      className="shrink-0 rounded-lg p-1 opacity-0 transition group-hover:opacity-100 hover:bg-[#E2E8F0] hover:text-[#E11D48] dark:hover:bg-[#334155]"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                );
              })}

              {isLoadingMoreConversations && (
                <div className="flex items-center justify-center gap-2 py-2 text-lg text-[#64748B]">
                  <Loader2 size={12} className="animate-spin text-[#2563EB]" />
                  Loading older chats...
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar footer */}
        <div className="shrink-0 space-y-1 border-t border-[#E2E8F0] bg-[#FFFFFF] p-2.5 dark:border-[#334155] dark:bg-[#1E293B]">
          <Link
            href="/autovyn/admin/Ai_Assistance/history"
            className="flex items-center justify-between rounded-xl px-2.5 py-1.5 text-lg font-semibold text-[#475569] transition hover:bg-[#F8FAFC] hover:text-[#2563EB] dark:text-[#94A3B8] dark:hover:bg-[#334155] dark:hover:text-[#60A5FA]"
          >
            <div className="flex items-center gap-2">
              <Activity size={12} className="text-[#10B981]" />
              Query Logs & Audit
            </div>
            <ChevronRight size={12} className="text-[#CBD5E1]" />
          </Link>
          <Link
            href="/autovyn/admin/Ai_Assistance/Ai_Assistant_Descr"
            className="flex items-center justify-between rounded-xl px-2.5 py-1.5 text-lg font-semibold text-[#475569] transition hover:bg-[#F8FAFC] hover:text-[#2563EB] dark:text-[#94A3B8] dark:hover:bg-[#334155] dark:hover:text-[#60A5FA]"
          >
            <div className="flex items-center gap-2">
              <Database size={12} className="text-[#2563EB]" />
              Knowledge Base
            </div>
            <ChevronRight size={12} className="text-[#CBD5E1]" />
          </Link>

          <div className="flex items-center justify-between px-2.5 pt-1 text-lg text-[#94A3B8]">
            <span>{conversations.length} sessions</span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
              Live ERP
            </span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          MAIN CHAT AREA
      ══════════════════════════════════════════ */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#F8FAFC] dark:bg-[#0F172A]">

        {/* Top header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#E2E8F0] bg-[#FFFFFF] px-4 py-3 dark:border-[#334155] dark:bg-[#1E293B]">
          <div className="flex min-w-0 items-center gap-3">
            {/* Sidebar toggle */}
            <button
              type="button"
              onClick={() => setShowHistorySidebar(!showHistorySidebar)}
              className="shrink-0 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2 text-[#64748B] shadow-xs transition hover:bg-[#F1F5F9] hover:text-[#1E293B] dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#94A3B8] dark:hover:bg-[#334155] dark:hover:text-[#F1F5F9]"
            >
              {showHistorySidebar ? (
                <ChevronLeft size={15} />
              ) : (
                <ChevronRight size={15} />
              )}
            </button>

            {/* AI avatar */}
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#193A69] to-[#2563EB] text-[#FFFFFF] shadow-md ring-2 ring-[#2563EB]/20">
              <Bot size={17} />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 animate-pulse rounded-full bg-[#10B981] ring-2 ring-[#FFFFFF] dark:ring-[#1E293B]" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-lg font-extrabold tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">
                  AutoVyn Copilot Pro
                </h1>
                <span className="hidden shrink-0 items-center gap-1 rounded-full border border-[#A7F3D0] bg-[#ECFDF5] px-2 py-0.5 text-lg font-bold text-[#059669] sm:inline-flex dark:border-[#065F46] dark:bg-[#022C22]/40 dark:text-[#34D399]">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#10B981]" />
                  ERP Connected
                </span>
              </div>
              <p className="truncate text-lg text-[#64748B] dark:text-[#94A3B8]">
                {activeConversationId
                  ? `Session • ${activeConversationId.slice(0, 12)}...`
                  : "Attendance · Salary · Employee · Service Alerts"}
              </p>
            </div>
          </div>

          {/* Header actions */}
          <div className="flex shrink-0 items-center gap-2">
            <Link href="/autovyn/admin/Ai_Assistance/history">
              <button
                type="button"
                className="hidden items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1.5 text-lg font-semibold text-[#475569] shadow-xs transition hover:bg-[#F1F5F9] hover:text-[#1E293B] sm:flex dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#94A3B8] dark:hover:bg-[#1E293B] dark:hover:text-[#F1F5F9]"
              >
                <Activity size={12} className="text-[#10B981]" />
                Query Logs
              </button>
            </Link>

            {hasMessages && (
              <button
                type="button"
                onClick={handleClearMessages}
                className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1.5 text-lg font-semibold text-[#64748B] shadow-xs transition hover:border-[#FECDD3] hover:bg-[#FFF1F2] hover:text-[#E11D48] dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#94A3B8]"
              >
                Clear
              </button>
            )}

            <button
              type="button"
              onClick={handleNewChat}
              className="flex items-center gap-1.5 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1.5 text-lg font-bold text-[#2563EB] shadow-xs transition hover:bg-[#DBEAFE] dark:border-[#1E3A8A] dark:bg-[#172554]/60 dark:text-[#60A5FA] dark:hover:bg-[#172554]"
            >
              <Plus size={13} />
              New Chat
            </button>
          </div>
        </div>

        {/* Messages feed */}
        <div className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6">
          {isLoadingHistory ? (
            <div className="flex h-full items-center justify-center gap-3 text-lg text-[#64748B]">
              <Loader2 size={20} className="animate-spin text-[#2563EB]" />
              Loading conversation...
            </div>
          ) : !hasMessages ? (
            <EmptyState
              userName={user?.name || user?.userName}
              onPromptClick={handlePromptClick}
            />
          ) : (
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
              {/* Date separator */}
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-[#E2E8F0] dark:bg-[#334155]" />
                <span className="rounded-full border border-[#E2E8F0] bg-[#F1F5F9] px-3 py-0.5 text-lg font-bold uppercase tracking-wider text-[#64748B] dark:border-[#334155] dark:bg-[#1E293B] dark:text-[#94A3B8]">
                  {messages[0]?.createdAt.toLocaleDateString([], {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </span>
                <div className="h-px flex-1 bg-[#E2E8F0] dark:bg-[#334155]" />
              </div>

              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  conversationId={activeConversationId}
                  onFeedback={handleFeedback}
                  user={user}
                />
              ))}

              {isLoading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[#FECDD3] bg-[#FFF1F2] px-4 py-2 dark:border-[#881337]/50 dark:bg-[#4C0519]/30">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0 text-[#E11D48]" />
              <span className="text-lg font-semibold text-[#BE123C] dark:text-[#FDA4AF]">
                {error}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="font-bold text-[#BE123C] hover:text-[#881337] dark:text-[#FDA4AF]"
            >
              ×
            </button>
          </div>
        )}

        {/* Input dock */}
        <form
          onSubmit={handleFormSubmit}
          className="shrink-0 border-t border-[#E2E8F0] bg-[#FFFFFF] p-3 sm:p-4 dark:border-[#334155] dark:bg-[#1E293B]"
        >
          <div className="mx-auto flex w-full max-w-6xl items-end gap-2 sm:gap-3">
            {/* Textarea capsule */}
            <div className="relative flex-1 rounded-2xl border border-[#CBD5E1] bg-[#F8FAFC] shadow-xs transition-all focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#2563EB]/15 dark:border-[#334155] dark:bg-[#0F172A]">
              <textarea
                ref={textareaRef}
                rows={1}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (error) setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    executeSend();
                  }
                }}
                placeholder="Ask about attendance, salaries, employee biodata or service reminders..."
                disabled={isInputDisabled}
                className="max-h-36 min-h-[44px] w-full resize-none bg-transparent px-4 py-3 text-lg text-[#0F172A] placeholder-[#94A3B8] focus:outline-none dark:text-[#F1F5F9]"
              />
              {message.length > 150 && (
                <span className="pointer-events-none absolute bottom-2 right-3.5 font-mono text-lg text-[#94A3B8]">
                  {message.length}
                </span>
              )}
            </div>

            {/* Voice button */}
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border shadow-xs transition-all ${
                isListening
                  ? "animate-pulse border-[#F43F5E] bg-[#E11D48] text-[#FFFFFF] ring-4 ring-[#F43F5E]/20"
                  : "border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] hover:border-[#CBD5E1] hover:bg-[#F1F5F9] hover:text-[#1E293B] dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#94A3B8] dark:hover:bg-[#1E293B] dark:hover:text-[#F1F5F9]"
              }`}
              title={isListening ? "Stop voice" : "Voice input"}
            >
              {isListening ? <MicOff size={17} /> : <Mic size={17} />}
            </button>

            {/* Send button */}
            <button
              type="submit"
              disabled={isInputDisabled || !message.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#193A69] via-[#1D4ED8] to-[#2563EB] text-[#FFFFFF] shadow-md shadow-[#2563EB]/25 transition-all hover:shadow-lg hover:shadow-[#2563EB]/30 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
            >
              {isLoading ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Send size={17} />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}