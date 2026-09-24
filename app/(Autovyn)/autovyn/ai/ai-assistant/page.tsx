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
  Layers,
  Database,
  Calendar,
  Users,
  DollarSign,
  Car,
  BarChart3,
  AlertCircle,
  FileSpreadsheet,
  CornerDownLeft,
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
  Sparkle,
  X,
  CheckCircle2,
  Activity,
  Wand2,
  FlaskConical,
  GraduationCap,
  Table2,
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
    confidence?: {
      level?: string;
      score?: number;
    };
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
  data: {
    conversationId: string;
    messages: ConversationMessage[];
  };
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
// UTILITIES & HELPERS
// ============================================================
const buildAIHeaders = (user?: any) => {
  const compcode =
    user?.Comp_Code ||
    user?.compcode ||
    user?.CompCode ||
    user?.branch ||
    "";
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
    {
      headers: buildAIHeaders(user),
      timeout: 60000,
    }
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
  const response = await axios.post(
    `${BASE_URL}/ai/feedback`,
    payload,
    { headers: buildAIHeaders(user) }
  );
  return response.data;
};

// Direct rule save → /ai/rules/save (trains AI immediately)
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
  const response = await axios.post(
    `${BASE_URL}/ai/rules/save`,
    payload,
    { headers: buildAIHeaders(user) }
  );
  return response.data;
};

// Test SQL before saving
const testSQLQueryAPI = async (
  payload: { sql: string },
  user?: any
): Promise<{ success: boolean; rowCount?: number; columns?: string[]; rows?: any[]; error?: string; latencyMs?: number }> => {
  const response = await axios.post(
    `${BASE_URL}/ai/test-sql`,
    payload,
    { headers: buildAIHeaders(user) }
  );
  return response.data;
};

// Fetch available ERP table names for dropdown
const fetchERPTablesAPI = async (user?: any): Promise<string[]> => {
  try {
    const response = await axios.get(`${BASE_URL}/ai/schema/tables`, {
      headers: buildAIHeaders(user),
      params: { limit: 500 },
    });
    const data = response.data?.data || response.data?.tables || [];
    if (Array.isArray(data)) {
      return data.map((t: any) => (typeof t === "string" ? t : t.Table_Name || t.tableName || t.TABLE_NAME || t.name || "")).filter(Boolean).sort();
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
// STARTER PROMPT CATEGORIES
// ============================================================
const STARTER_CATEGORIES = [
  {
    icon: Users,
    title: "HR & Attendance",
    badge: "Attendance Master",
    color: "text-[#2563eb] dark:text-[#60a5fa]",
    bg: "bg-[#eff6ff] dark:bg-[#172554]/40 border-[#bfdbfe] dark:border-[#1e3a8a]/50",
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
    color: "text-[#059669] dark:text-[#34d399]",
    bg: "bg-[#ecfdf5] dark:bg-[#022c22]/40 border-[#a7f3d0] dark:border-[#064e3b]/50",
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
    color: "text-[#d97706] dark:text-[#fbbf24]",
    bg: "bg-[#fffbeb] dark:bg-[#451a03]/40 border-[#fde68a] dark:border-[#78350f]/50",
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
    color: "text-[#9333ea] dark:text-[#c084fc]",
    bg: "bg-[#faf5ff] dark:bg-[#3b0764]/40 border-[#e9d5ff] dark:border-[#581c87]/50",
    prompts: [
      "Today's service reminders due list",
      "Pending vehicle delivery status",
      "Upcoming customer follow-ups",
    ],
  },
];

// Quick follow-up contextual suggestion chips
const QUICK_SUGGESTION_CHIPS = [
  "April 2026 me kitne employee ka pf deduction hua hai",
  "April 2026 me kon kon employee ka pf deduction hua hai",
  "Basic salary 20000 se 50000 ke beech wale kitne employee hain",
  "Aaj kitne employee present hain?",
  "Is mahine kiski salary sabse jyada hai?",
  "Kaun kaun aaj leave par hai?",
  "Iska birthday kab aata hai?",
  "Iska permanent address aur contact",
  "Today's service reminders due list",
  "Duplicate bank account wale employees",
];

// ============================================================
// COPY BUTTON WITH TOAST FEEDBACK
// ============================================================
const CopyButton = ({ text, label, className }: { text: string; label?: string; className?: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={label || "Copy to clipboard"}
      className={
        className ||
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[16px] font-semibold transition-all text-[#475569] dark:text-[#cbd5e1] hover:text-primary dark:hover:text-white bg-[#f1f5f9] dark:bg-[#1e293b] hover:bg-[#e2e8f0] dark:hover:bg-[#334155] border border-[#e2e8f0] dark:border-[#334155]"
      }
    >
      {copied ? (
        <>
          <Check size={13} className="text-[#059669] dark:text-[#34d399]" />
          <span className="text-[#059669] dark:text-[#34d399] font-bold">Copied!</span>
        </>
      ) : (
        <>
          <Copy size={13} />
          {label && <span>{label}</span>}
        </>
      )}
    </button>
  );
};

// ============================================================
// TEXT-TO-SPEECH (TTS) BUTTON
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

    const cleanText = text
      .replace(/[*#`_~|]/g, " ")
      .replace(/\n+/g, ". ")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  return (
    <button
      type="button"
      onClick={handleSpeech}
      title={isSpeaking ? "Stop voice reading" : "Read response out loud"}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[16px] font-semibold transition-all border ${
        isSpeaking
          ? "bg-primary text-white border-primary animate-pulse"
          : "text-[#475569] dark:text-[#cbd5e1] hover:text-primary dark:hover:text-white bg-[#f1f5f9] dark:bg-[#1e293b] hover:bg-[#e2e8f0] dark:hover:bg-[#334155] border-[#e2e8f0] dark:border-[#334155]"
      }`}
    >
      {isSpeaking ? <VolumeX size={13} /> : <Volume2 size={13} />}
      <span>{isSpeaking ? "Speaking..." : "Listen"}</span>
    </button>
  );
};

// ============================================================
// TYPING INDICATOR WITH PULSE
// ============================================================
const TypingIndicator = () => (
  <div className="flex items-start gap-3 my-3 animate-in fade-in-50 duration-300">
    <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#193A69] via-primary to-[#3b82f6] text-white shadow-md ring-2 ring-primary/20">
      <Bot size={18} className="animate-spin" style={{ animationDuration: "8s" }} />
      <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34d399] opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10b981] ring-2 ring-white dark:ring-[#0f172a]" />
      </span>
    </div>

    <div className="flex flex-col gap-1 max-w-[85%]">
      <div className="flex items-center gap-2 px-1 text-[16px] font-semibold text-[#64748b] dark:text-[#94a3b8]">
        <span className="text-[#193A69] dark:text-white font-bold">AutoVyn Copilot</span>
        <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-lg font-mono text-primary font-bold">
          QUERYING MSSQL
        </span>
      </div>

      <div className="flex items-center gap-3 rounded-2xl rounded-tl-sm border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: `${i * 0.18}s` }}
            />
          ))}
        </div>
        <span className="text-lg font-semibold text-[#475569] dark:text-[#cbd5e1] animate-pulse">
          Analyzing database records & schema...
        </span>
      </div>
    </div>
  </div>
);

// ============================================================
// FORMATTED MARKDOWN & INTERACTIVE DATA TABLE
// ============================================================
const renderInlineFormatting = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);

  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className="font-bold text-[#193A69] dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      const val = part.slice(1, -1);
      return (
        <code
          key={idx}
          className="rounded-md bg-[#f1f5f9] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] px-1.5 py-0.5 font-mono text-[16px] font-bold text-primary dark:text-[#60A5FA]"
        >
          {val}
        </code>
      );
    }
    return part;
  });
};

const FormattedMarkdown = ({ content }: { content: string }) => {
  const [tableFilter, setTableFilter] = useState("");
  if (!content) return null;

  const lines = content.split("\n");
  const blocks: any[] = [];
  let currentTableRows: string[] = [];
  let inTable = false;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      inTable = true;
      currentTableRows.push(trimmed);
    } else {
      if (inTable && currentTableRows.length > 0) {
        blocks.push({ type: "table", rows: [...currentTableRows] });
        currentTableRows = [];
        inTable = false;
      }
      if (trimmed && trimmed !== "•") {
        blocks.push({ type: "text", content: trimmed });
      } else if (!trimmed) {
        blocks.push({ type: "empty" });
      }
    }
  });

  if (inTable && currentTableRows.length > 0) {
    blocks.push({ type: "table", rows: [...currentTableRows] });
  }

  return (
    <div className="space-y-2 text-base sm:text-[16px] leading-relaxed text-[#334155] dark:text-[#e2e8f0] w-full min-w-0 max-w-full overflow-hidden">
      {blocks.map((block, bIdx) => {
        if (block.type === "empty") {
          return <div key={bIdx} className="h-1.5" />;
        }

        if (block.type === "table") {
          const rows = block.rows;
          const cleanRows = rows.filter(
            (r: string) => !/^\|[\s\-:]*\|[\s\-:|]*$/.test(r)
          );

          if (cleanRows.length === 0) return null;
          const headerCells = cleanRows[0]
            .split("|")
            .slice(1, -1)
            .map((c: string) => c.trim());
          const dataRows = cleanRows.slice(1);

          const filteredDataRows = tableFilter
            ? dataRows.filter((r: string) =>
                r.toLowerCase().includes(tableFilter.toLowerCase())
              )
            : dataRows;

          // Build CSV string
          const csvContent = [
            headerCells.join(","),
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
              className="my-3 w-full max-w-full min-w-0 rounded-xl border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#0f172a] shadow-sm overflow-hidden"
              style={{ maxWidth: "100%" }}
            >
              {/* Table header bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e2e8f0] dark:border-[#334155] bg-[#f8fafc] dark:bg-[#1e293b] px-3.5 py-2">
                <div className="flex items-center gap-2 text-lg font-bold text-[#193A69] dark:text-white">
                  <FileSpreadsheet size={15} className="text-[#059669] dark:text-[#34d399]" />
                  <span>ERP Results ({dataRows.length} records)</span>
                </div>

                <div className="flex items-center gap-2">
                  {dataRows.length > 4 && (
                    <input
                      type="text"
                      placeholder="Filter table..."
                      value={tableFilter}
                      onChange={(e) => setTableFilter(e.target.value)}
                      className="h-7 w-28 sm:w-36 rounded-md border border-[#cbd5e1] dark:border-[#334155] bg-white dark:bg-[#0f172a] px-2 text-lg text-[#1e293b] dark:text-white placeholder-[#94a3b8] focus:border-primary focus:outline-none"
                    />
                  )}
                  <CopyButton text={csvContent} label="Copy CSV" />
                </div>
              </div>

              {/* Table Horizontal Scroll View - ONLY THIS TABLE SCROLLS */}
              <div
                className="w-full max-w-full overflow-x-auto overflow-y-auto max-h-96 scrollbar-thin scrollbar-thumb-[#cbd5e1] dark:scrollbar-thumb-[#334155]"
                style={{ width: "100%", maxWidth: "100%" }}
              >
                <table
                  className="text-left text-lg sm:text-lg border-collapse table-auto"
                  style={{ minWidth: "100%", width: "max-content" }}
                >
                  <thead className="sticky top-0 z-10 bg-[#f1f5f9] dark:bg-[#1e293b] text-[#334155] dark:text-[#e2e8f0] border-b border-[#e2e8f0] dark:border-[#334155] font-bold shadow-xs">
                    <tr>
                      {headerCells.map((cell: string, cIdx: number) => (
                        <th
                          key={cIdx}
                          className="px-3 py-2 border-r last:border-r-0 border-[#e2e8f0] dark:border-[#334155] whitespace-nowrap text-lg font-bold uppercase tracking-wider text-[#475569] dark:text-[#cbd5e1]"
                        >
                          {renderInlineFormatting(cell)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e8f0] dark:divide-[#334155]">
                    {filteredDataRows.map((rStr: string, rIdx: number) => {
                      const cells = rStr
                        .split("|")
                        .slice(1, -1)
                        .map((c: string) => c.trim());
                      return (
                        <tr
                          key={rIdx}
                          className="hover:bg-[#f8fafc] dark:hover:bg-[#1e293b]/60 transition-colors even:bg-[#f8fafc]/50 dark:even:bg-[#1e293b]/30"
                        >
                          {cells.map((cell: string, cIdx: number) => (
                            <td
                              key={cIdx}
                              className="px-3 py-1.5 border-r last:border-r-0 border-[#e2e8f0]/60 dark:border-[#334155]/60 whitespace-nowrap text-[#334155] dark:text-[#cbd5e1] font-medium"
                            >
                              {renderInlineFormatting(cell)}
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

        if (text.startsWith("### ")) {
          return (
            <h3
              key={bIdx}
              className="text-lg font-bold text-primary dark:text-[#60A5FA] mt-3.5 mb-1 flex items-center gap-2"
            >
              <span className="h-2 w-2 rounded-full bg-primary" />
              {renderInlineFormatting(text.replace(/^###\s+/, ""))}
            </h3>
          );
        }
        if (text.startsWith("#### ")) {
          return (
            <h4
              key={bIdx}
              className="text-lg font-bold text-[#193A69] dark:text-[#f1f5f9] mt-2.5 mb-0.5"
            >
              {renderInlineFormatting(text.replace(/^####\s+/, ""))}
            </h4>
          );
        }

        if (text.startsWith("- ") || text.startsWith("* ") || text.startsWith("• ")) {
          const cleanText = text.replace(/^([-*•])\s+/, "");
          return (
            <div key={bIdx} className="flex items-start gap-2.5 pl-1 py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-2" />
              <div className="flex-1 leading-normal text-[#334155] dark:text-[#e2e8f0]">
                {renderInlineFormatting(cleanText)}
              </div>
            </div>
          );
        }

        if (/^\d+\.\s+/.test(text)) {
          const match = text.match(/^(\d+)\.\s+(.*)/);
          return (
            <div key={bIdx} className="flex items-start gap-2.5 pl-1 py-0.5">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-lg font-bold text-primary mt-0.5">
                {match?.[1]}
              </span>
              <div className="flex-1 leading-normal text-[#334155] dark:text-[#e2e8f0]">
                {renderInlineFormatting(match?.[2] || "")}
              </div>
            </div>
          );
        }

        return (
          <div
            key={bIdx}
            className="break-words leading-relaxed py-0.5 text-[#334155] dark:text-[#e2e8f0]"
          >
            {renderInlineFormatting(text)}
          </div>
        );
      })}
    </div>
  );
};

// ============================================================
// MESSAGE BUBBLE COMPONENT — UPGRADED WITH SELF-TRAINING
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
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState("INCORRECT_DATA");
  const [commentText, setCommentText] = useState("");
  const [targetTable, setTargetTable] = useState("");
  const [tableSearch, setTableSearch] = useState("");
  const [correctSQL, setCorrectSQL] = useState("");
  const [synonyms, setSynonyms] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingRule, setIsSavingRule] = useState(false);
  const [isTestingSQL, setIsTestingSQL] = useState(false);
  const [sqlTestResult, setSqlTestResult] = useState<{ success: boolean; rowCount?: number; error?: string; latencyMs?: number } | null>(null);
  const [feedbackSaved, setFeedbackSaved] = useState(msg.feedbackSubmitted || false);
  const [ruleSaved, setRuleSaved] = useState(false);
  const [erpTables, setErpTables] = useState<string[]>([]);
  const [tablesLoaded, setTablesLoaded] = useState(false);

  const COMMON_ERP_TABLES = [
    "EMPLOYEEMASTER", "SALARYFILE", "attendancetable", "Misc_Mst",
    "Srv_Reminder_Tbl", "Account_No_Api", "emp_varify", "Asset_Issue",
    "Approval_Matrix", "AI_SQL_Learning_Tbl",
  ];

  const displayTables = erpTables.length > 0 ? erpTables : COMMON_ERP_TABLES;
  const filteredTables = tableSearch
    ? displayTables.filter((t) => t.toLowerCase().includes(tableSearch.toLowerCase()))
    : displayTables.slice(0, 20);

  const feedbackOptions = [
    { id: "INCORRECT_DATA", label: "Galat Data (Wrong Info)", icon: "❌" },
    { id: "WRONG_CALCULATION", label: "Calculation Error", icon: "📊" },
    { id: "INCOMPLETE_DATA", label: "Incomplete Data", icon: "⚠️" },
    { id: "WRONG_TABLE", label: "Wrong Table/Schema", icon: "🔍" },
    { id: "CUSTOM_RULE", label: "Custom Rule", icon: "✏️" },
  ];

  // Load ERP tables when panel opens
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
      setShowFeedbackModal(false);
    }
  };

  const handleThumbsDown = async () => {
    if (onFeedback) {
      await onFeedback(msg.id, "UNHELPFUL", "Marked as FAILED by user via Dislike");
      setFeedbackSaved(true);
    }
    // Also open training panel so user can fix and train SQL if desired
    setShowFeedbackModal(true);
    loadTables();
  };

  const handleTestSQL = async () => {
    if (!correctSQL.trim()) return;
    setIsTestingSQL(true);
    setSqlTestResult(null);
    try {
      const result = await testSQLQueryAPI({ sql: correctSQL.trim() }, user);
      setSqlTestResult(result);
    } catch (err: any) {
      setSqlTestResult({ success: false, error: err?.response?.data?.message || err?.message || "Test failed" });
    } finally {
      setIsTestingSQL(false);
    }
  };

  // Save directly as trained rule (strongest action — AI learns immediately)
  const handleSaveAndTrain = async () => {
    if (!correctSQL.trim()) {
      alert("Pehle sahi SQL likhiye jo AI ko sikhana hai.");
      return;
    }
    const question = msg.userQuery || commentText || "";
    if (!question.trim()) {
      alert("Question required — original query batayein.");
      return;
    }
    setIsSavingRule(true);
    try {
      const result = await saveTrainedRuleAPI({
        question,
        sql: correctSQL.trim(),
        intent: msg.intent || "DYNAMIC_CUSTOM",
        targetTable: targetTable || undefined,
        synonyms: synonyms || undefined,
      }, user);
      if (result.success) {
        setRuleSaved(true);
        setShowFeedbackModal(false);
        // Also log golden feedback
        if (onFeedback) {
          await onFeedback(msg.id, "GOLDEN", commentText || "Trained golden rule", targetTable, correctSQL.trim()).catch(() => {});
        }
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
      await onFeedback(msg.id, selectedReason, commentText, targetTable, correctSQL || undefined);
      setFeedbackSaved(true);
      setShowFeedbackModal(false);
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`group flex gap-2.5 sm:gap-3.5 transition-all my-1.5 animate-in fade-in-50 duration-300 w-full min-w-0 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {/* Assistant Bot Avatar */}
      {!isUser && (
        <div className="relative flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#193A69] via-primary to-[#3b82f6] text-white shadow-sm ring-2 ring-primary/20 mt-0.5">
          <Bot size={18} />
          <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#10b981] ring-2 ring-white dark:ring-[#0f172a]" />
        </div>
      )}

      {/* Bubble Container */}
      <div
        className={`relative ${
          isUser
            ? "max-w-[88%] sm:max-w-[80%] md:max-w-[75%] items-end"
            : "w-full max-w-full sm:max-w-[95%] md:max-w-[92%] items-start"
        } min-w-0 flex flex-col gap-1`}
      >
        {/* Assistant Header Tag */}
        {!isUser && (
          <div className="flex items-center gap-2 px-1 text-[16px] font-semibold text-[#64748b] dark:text-[#94a3b8]">
            <span className="text-[#193A69] dark:text-white font-bold">AutoVyn AI</span>
            {msg.mode && (
              <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-lg font-mono text-primary font-bold">
                {msg.mode === "DATABASE" ? "⚡ DATABASE (LIVE ERP)" : msg.mode}
              </span>
            )}
            {msg.responseTimeMs && (
              <span className="flex items-center gap-1 text-lg text-[#94a3b8] font-mono">
                <Clock size={11} />{msg.responseTimeMs}ms
              </span>
            )}
          </div>
        )}

        {/* Bubble Card */}
        <div
          className={`rounded-2xl px-4 py-3.5 shadow-sm transition-all w-full min-w-0 max-w-full overflow-hidden ${
            isUser
              ? "rounded-tr-xs bg-gradient-to-r from-[#193A69] via-primary to-[#2563eb] text-white shadow-md shadow-primary/10"
              : msg.isError
              ? "rounded-tl-xs border border-[#fecaca] dark:border-[#7f1d1d]/50 bg-[#fef2f2] dark:bg-[#450a0a]/30 text-[#b91c1c] dark:text-[#fca5a5]"
              : "rounded-tl-xs border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] text-[#1e293b] dark:text-[#f1f5f9] shadow-sm"
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words text-lg sm:text-[17px] font-medium leading-relaxed">{msg.content}</p>
          ) : (
            <FormattedMarkdown content={msg.content} />
          )}
        </div>

        {/* Footer actions for user prompt */}
        {isUser && (
          <div className="flex items-center justify-end gap-2 px-1 mt-0.5">
            <CopyButton
              text={msg.content}
              label="Copy"
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-lg font-semibold text-[#64748b] dark:text-[#94a3b8] hover:text-[#193A69] dark:hover:text-white bg-[#f8fafc] dark:bg-[#0f172a] hover:bg-[#e2e8f0] dark:hover:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] transition shadow-xs cursor-pointer"
            />
            {msg.createdAt && (
              <span className="text-lg text-[#94a3b8] font-mono">
                {formatMessageTime(msg.createdAt)}
              </span>
            )}
          </div>
        )}

        {/* Footer actions for assistant */}
        {!isUser && !msg.isError && (
          <div className="flex flex-col gap-1 w-full mt-1">
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <CopyButton text={msg.content} label="Copy" />
                <SpeechButton text={msg.content} />

                <button
                  type="button"
                  onClick={handleThumbsUp}
                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-lg font-semibold transition ${
                    msg.liked === true
                      ? "text-[#059669] dark:text-[#34d399] bg-[#ecfdf5] dark:bg-[#022c22]/40 border border-[#a7f3d0] dark:border-[#065f46]"
                      : "text-[#94a3b8] hover:text-[#475569] dark:hover:text-white bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155]"
                  }`}
                  title="Helpful response (Mark as Success)"
                >
                  <ThumbsUp size={13} /><span>Like</span>
                </button>

                <button
                  type="button"
                  onClick={handleThumbsDown}
                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-lg font-semibold transition ${
                    msg.liked === false
                      ? "text-[#e11d48] dark:text-[#fb7185] bg-[#fff1f2] dark:bg-[#4c0519]/40 border border-[#fecdd3] dark:border-[#881337]"
                      : "text-[#94a3b8] hover:text-[#e11d48] dark:hover:text-[#fb7185] bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155]"
                  }`}
                  title="Dislike response — Move to Failed in History"
                >
                  <ThumbsDown size={13} /><span>Dislike</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const next = !showFeedbackModal;
                    setShowFeedbackModal(next);
                    if (next) loadTables();
                  }}
                  className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-lg font-semibold transition ${
                    showFeedbackModal
                      ? "text-[#4f46e5] bg-[#eef2ff] dark:bg-[#312e81]/40 border border-[#c7d2fe] dark:border-[#4338ca]"
                      : "text-[#6366f1] hover:text-[#4f46e5] bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155]"
                  }`}
                  title="Open Training & SQL Fix Panel"
                >
                  <Wand2 size={13} /><span>Fix / Train AI</span>
                </button>

                {msg.liked === false && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#fff1f2] dark:bg-[#4c0519]/40 text-[#e11d48] dark:text-[#fb7185] border border-[#fecdd3] dark:border-[#881337] px-2 py-0.5 text-lg font-bold animate-in fade-in-50">
                    <XCircle size={11} />
                    Moved to Failed in History
                  </span>
                )}

                {msg.liked === true && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfdf5] dark:bg-[#022c22]/40 text-[#059669] dark:text-[#34d399] border border-[#a7f3d0] dark:border-[#065f46] px-2 py-0.5 text-lg font-bold animate-in fade-in-50">
                    <CheckCircle2 size={11} />
                    Marked as Success
                  </span>
                )}

                {ruleSaved && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfdf5] dark:bg-[#022c22]/40 text-[#059669] dark:text-[#34d399] border border-[#a7f3d0] dark:border-[#065f46] px-2 py-0.5 text-lg font-bold animate-in fade-in-50">
                    <CheckCircle2 size={11} />
                    AI Trained! ✓
                  </span>
                )}
              </div>
              <span className={`text-lg font-medium shrink-0 ${isUser ? "text-white/80" : "text-[#94a3b8]"}`}>
                {formatMessageTime(msg.createdAt)}
              </span>
            </div>

            {/* ── UPGRADED TRAINING PANEL ── */}
            {!isUser && showFeedbackModal && (
              <div className="mt-2 rounded-xl border border-[#6366f1]/30 bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] dark:from-[#0f172a] dark:to-[#1e293b] p-4 text-left shadow-md animate-in fade-in-50 zoom-in-95 duration-200 space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-[#e2e8f0] dark:border-[#334155]">
                  <div className="flex items-center gap-2 text-lg font-bold text-[#193A69] dark:text-white">
                    <GraduationCap size={15} className="text-[#6366f1]" />
                    <span>AI Training Panel</span>
                    <span className="text-lg font-normal bg-[#6366f1]/10 text-[#6366f1] border border-[#6366f1]/20 rounded-full px-2 py-0.5">Instant Learning</span>
                  </div>
                  <button type="button" onClick={() => setShowFeedbackModal(false)} className="text-[#94a3b8] hover:text-[#1e293b] dark:hover:text-white">
                    <X size={14} />
                  </button>
                </div>

                {/* Dislike Status Alert */}
                {msg.liked === false && (
                  <div className="rounded-lg bg-[#fff1f2] dark:bg-[#4c0519]/30 border border-[#fecdd3] dark:border-[#881337] p-2.5 text-lg text-[#9f1239] dark:text-[#fecdd3] flex items-center gap-2">
                    <XCircle size={15} className="text-[#e11d48] shrink-0" />
                    <span>Ye query <strong>History ke FAILED</strong> section me move ho chuki hai. Aage se sahi response aane ke liye niche correct SQL likh kar <strong>"Save & Train AI Now"</strong> karein:</span>
                  </div>
                )}

                {/* Original Question display */}
                {msg.userQuery && (
                  <div className="rounded-lg bg-[#f1f5f9] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] px-3 py-2 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-lg font-bold uppercase tracking-wider text-[#64748b] dark:text-[#94a3b8] mb-0.5">Original Question:</p>
                      <p className="text-lg font-medium text-[#334155] dark:text-[#e2e8f0] break-words">{msg.userQuery}</p>
                    </div>
                    <CopyButton
                      text={msg.userQuery}
                      label="Copy"
                      className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-lg font-medium text-[#64748b] dark:text-[#94a3b8] hover:text-[#193A69] dark:hover:text-white bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] transition shadow-xs cursor-pointer"
                    />
                  </div>
                )}

                {/* Issue Type */}
                <div>
                  <label className="block text-lg font-bold uppercase tracking-wider text-[#64748b] dark:text-[#94a3b8] mb-1.5">Issue Type</label>
                  <div className="flex flex-wrap gap-1.5">
                    {feedbackOptions.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedReason(opt.id)}
                        className={`flex items-center gap-1 rounded-lg px-2 py-1 text-lg font-medium transition ${
                          selectedReason === opt.id
                            ? "bg-[#6366f1] text-white font-bold shadow-sm"
                            : "bg-white dark:bg-[#1e293b] text-[#475569] dark:text-[#cbd5e1] border border-[#e2e8f0] dark:border-[#334155] hover:border-[#6366f1]/40"
                        }`}
                      >
                        <span>{opt.icon}</span><span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Correct SQL — THE KEY FIELD */}
                <div>
                  <label className="block text-lg font-bold uppercase tracking-wider text-[#64748b] dark:text-[#94a3b8] mb-1.5">
                    ⚡ Sahi SQL Query (AI isse seekhega)
                  </label>
                  <textarea
                    value={correctSQL}
                    onChange={(e) => { setCorrectSQL(e.target.value); setSqlTestResult(null); }}
                    rows={4}
                    placeholder={`SELECT TOP 100 *\nFROM [dbo].[Srv_Reminder_Tbl] WITH (NOLOCK)\nWHERE CAST(Final_Due_Date AS DATE) = CAST(GETDATE() AS DATE)\nORDER BY Final_Due_Date ASC;`}
                    className="w-full rounded-lg border border-[#cbd5e1] dark:border-[#334155] bg-[#0f172a] text-[#a5f3fc] p-2.5 text-lg font-mono placeholder-[#475569] focus:border-[#6366f1] focus:outline-none focus:ring-1 focus:ring-[#6366f1]/30 resize-y"
                    spellCheck={false}
                  />
                  {/* Test SQL Button */}
                  <div className="mt-1.5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTestSQL}
                      disabled={isTestingSQL || !correctSQL.trim()}
                      className="flex items-center gap-1.5 rounded-lg bg-[#0f172a] dark:bg-[#1e293b] border border-[#334155] hover:border-[#6366f1]/50 text-[#a5f3fc] px-2.5 py-1 text-lg font-bold transition disabled:opacity-40"
                    >
                      {isTestingSQL ? <Loader2 size={11} className="animate-spin" /> : <FlaskConical size={11} />}
                      {isTestingSQL ? "Testing..." : "Test SQL Live"}
                    </button>
                    {sqlTestResult && (
                      <span className={`text-lg font-bold flex items-center gap-1 ${
                        sqlTestResult.success ? "text-[#059669]" : "text-[#e11d48]"
                      }`}>
                        {sqlTestResult.success
                          ? <><CheckCircle2 size={11} /> {sqlTestResult.rowCount ?? 0} rows · {sqlTestResult.latencyMs}ms</>
                          : <><AlertCircle size={11} /> {sqlTestResult.error?.slice(0, 60)}</>}
                      </span>
                    )}
                  </div>
                </div>

                {/* Target Table — with search */}
                <div>
                  <label className="block text-lg font-bold uppercase tracking-wider text-[#64748b] dark:text-[#94a3b8] mb-1.5">Target ERP Table</label>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="relative flex-1">
                      <Search size={11} className="absolute left-2 top-2 text-[#94a3b8] pointer-events-none" />
                      <input
                        type="text"
                        value={tableSearch}
                        onChange={(e) => setTableSearch(e.target.value)}
                        placeholder="Search ERP tables..."
                        className="w-full pl-6 pr-2 py-1.5 text-lg rounded-lg border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#0f172a] text-[#334155] dark:text-white placeholder-[#94a3b8] focus:border-[#6366f1] focus:outline-none"
                      />
                    </div>
                    {targetTable && (
                      <span className="text-lg font-mono font-bold text-[#6366f1] bg-[#6366f1]/10 border border-[#6366f1]/20 rounded px-1.5 py-0.5">{targetTable}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                    {filteredTables.map((tbl) => (
                      <button
                        key={tbl}
                        type="button"
                        onClick={() => setTargetTable(tbl)}
                        className={`rounded-md px-1.5 py-0.5 text-lg font-mono transition ${
                          targetTable === tbl
                            ? "bg-[#6366f1]/20 text-[#6366f1] font-bold border border-[#6366f1]/40"
                            : "bg-white dark:bg-[#1e293b] text-[#64748b] dark:text-[#94a3b8] border border-[#e2e8f0] dark:border-[#334155] hover:bg-[#f1f5f9]"
                        }`}
                      >
                        {tbl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Synonyms / alternate phrasings */}
                <div>
                  <label className="block text-lg font-bold uppercase tracking-wider text-[#64748b] dark:text-[#94a3b8] mb-1">Alternate Phrasings (Optional, comma separated)</label>
                  <input
                    type="text"
                    value={synonyms}
                    onChange={(e) => setSynonyms(e.target.value)}
                    placeholder="e.g. aaj ki service list, today service due, service reminder today"
                    className="w-full rounded-lg border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#0f172a] px-2.5 py-1.5 text-lg text-[#334155] dark:text-white placeholder-[#94a3b8] focus:border-[#6366f1] focus:outline-none"
                  />
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-lg font-bold uppercase tracking-wider text-[#64748b] dark:text-[#94a3b8] mb-1">Comment (Optional)</label>
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    rows={2}
                    placeholder="Kya galat tha aur kyun ye sahi hai..."
                    className="w-full rounded-lg border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#0f172a] p-2 text-lg text-[#334155] dark:text-white placeholder-[#94a3b8] focus:border-[#6366f1] focus:outline-none resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#e2e8f0] dark:border-[#334155]">
                  <button
                    type="button"
                    onClick={() => setShowFeedbackModal(false)}
                    className="rounded-lg px-2.5 py-1.5 text-lg font-semibold text-[#64748b] dark:text-[#94a3b8] hover:bg-[#e2e8f0] dark:hover:bg-[#334155] transition"
                  >
                    Cancel
                  </button>

                  <div className="flex items-center gap-2">
                    {/* Light feedback — just log */}
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleFormSubmit as any}
                      className="flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] hover:bg-[#f8fafc] text-[#475569] dark:text-[#cbd5e1] px-2.5 py-1.5 text-lg font-semibold transition disabled:opacity-50"
                    >
                      {isSubmitting ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
                      Log Feedback
                    </button>

                    {/* Strong action — train AI immediately */}
                    <button
                      type="button"
                      onClick={handleSaveAndTrain}
                      disabled={isSavingRule || !correctSQL.trim()}
                      className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#6366f1] to-[#4f46e5] hover:from-[#4f46e5] hover:to-[#4338ca] text-white px-3 py-1.5 text-lg font-bold shadow-sm transition disabled:opacity-40 disabled:pointer-events-none"
                      title={!correctSQL.trim() ? "Pehle Sahi SQL likhiye" : "AI ko train karo with this SQL"}
                    >
                      {isSavingRule ? (
                        <><Loader2 size={11} className="animate-spin" /><span>Training...</span></>
                      ) : (
                        <>
                        <Wand2 size={11} />
                        <span>Save & Train AI Now</span></>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#193A69] to-primary text-white shadow-sm mt-0.5">
          <User size={17} />
        </div>
      )}
    </div>
  );
};

// ============================================================
// EMPTY STATE (HERO VIEW)
// ============================================================
const EmptyState = ({
  userName,
  onPromptClick,
}: {
  userName?: string;
  onPromptClick: (prompt: string) => void;
}) => (
  <div className="relative flex min-h-full flex-col items-center justify-center py-6 px-4">
    <div className="relative z-10 w-full max-w-4xl text-center space-y-6">
      {/* Bot Icon with Glowing Ring */}
      <div className="relative mx-auto flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center">
        <div className="absolute inset-0 rounded-3xl bg-primary/20 blur-xl animate-pulse" />
        <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-[#193A69] via-primary to-[#3b82f6] text-white shadow-lg ring-4 ring-primary/10">
          <Bot size={36} className="animate-in zoom-in-50 duration-500" />
        </div>
      </div>

      {/* Headline & Personalized Greeting */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-lg font-bold text-primary shadow-xs">
          <Sparkles
            size={14}
            className="text-primary animate-spin"
            style={{ animationDuration: "6s" }}
          />
          <span>AutoVyn AI Copilot • Live ERP Intelligence</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#193A69] dark:text-white">
          {userName
            ? `${getTimeGreeting()}, ${userName}!`
            : "How can I help you today?"}
        </h2>

        <p className="mx-auto max-w-2xl text-lg sm:text-lg text-[#475569] dark:text-[#cbd5e1] leading-relaxed">
          Ask questions in <span className="text-primary font-bold">Hindi, English, or Hinglish</span>. 
          I query live MSSQL tables for attendance, employee master, salary registers, vouchers, and service alerts.
        </p>
      </div>

      {/* 4 Interactive Category Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-left pt-2">
        {STARTER_CATEGORIES.map((cat, idx) => {
          const Icon = cat.icon;
          return (
            <div
              key={idx}
              className="group relative overflow-hidden rounded-2xl border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/50"
            >
              <div className="relative z-10 flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-xl border ${cat.bg} ${cat.color}`}
                  >
                    <Icon size={16} />
                  </div>
                  <h3 className="text-lg font-bold text-[#193A69] dark:text-white tracking-wide">
                    {cat.title}
                  </h3>
                </div>

                <span className="rounded-full bg-[#f1f5f9] dark:bg-[#0f172a] px-2 py-0.5 text-lg font-bold text-[#64748b] dark:text-[#94a3b8] border border-[#e2e8f0] dark:border-[#334155]">
                  {cat.badge}
                </span>
              </div>

              <div className="relative z-10 space-y-1">
                {cat.prompts.map((p, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => onPromptClick(p)}
                    className="flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-lg text-[#475569] dark:text-[#cbd5e1] transition-all hover:bg-[#f1f5f9] dark:hover:bg-[#334155] hover:text-primary dark:hover:text-white text-left group/item"
                  >
                    <span className="truncate">{p}</span>
                    <ArrowRight
                      size={12}
                      className="opacity-0 group-hover/item:opacity-100 transition-opacity text-primary shrink-0 group-hover/item:translate-x-0.5"
                    />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Capability Badges */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2 text-[16px] text-[#64748b] dark:text-[#94a3b8]">
        <span className="flex items-center gap-1.5 rounded-full bg-[#f1f5f9] dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] px-3 py-1 font-medium">
          <Zap size={13} className="text-[#f59e0b]" />
          Sub-second Execution
        </span>
        <span className="flex items-center gap-1.5 rounded-full bg-[#f1f5f9] dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] px-3 py-1 font-medium">
          <ShieldCheck size={13} className="text-[#10b981]" />
          Enterprise SQL Guard
        </span>
        <span className="flex items-center gap-1.5 rounded-full bg-[#f1f5f9] dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] px-3 py-1 font-medium">
          <Database size={13} className="text-[#3b82f6]" />
          Live MSSQL Sync
        </span>
        <span className="flex items-center gap-1.5 rounded-full bg-[#f1f5f9] dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] px-3 py-1 font-medium">
          <BookOpen size={13} className="text-[#a855f7]" />
          Multi-turn Memory
        </span>
      </div>
    </div>
  </div>
);

// ============================================================
// MAIN PAGE COMPONENT
// ============================================================
export default function AIAssistantPage() {
  const user = useCurrentUser() as any;

  // State
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [convPage, setConvPage] = useState(1);
  const [hasMoreConversations, setHasMoreConversations] = useState(true);
  const [isLoadingMoreConversations, setIsLoadingMoreConversations] = useState(false);
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

  // Refs
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // ── Helpers ──
  const updateActiveConversationId = (id: string | null) => {
    activeConversationIdRef.current = id;
    setActiveConversationId(id);
  };

  const focusInput = () =>
    window.setTimeout(() => textareaRef.current?.focus(), 50);

  // ── Auto-adjust Textarea Height ──
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

  // ── Load conversation list (supports reset & infinite lazy loading) ──
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
        } catch {
          // silent
        } finally {
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
                const existingIds = new Set(prev.map((c) => c.conversationId));
                const newItems = res.data.filter(
                  (c) => !existingIds.has(c.conversationId)
                );
                return [...prev, ...newItems];
              });
              setConvPage(nextPage);
              if (res.data.length < PAGE_SIZE) {
                setHasMoreConversations(false);
              }
            }
          }
        } catch {
          // silent
        } finally {
          setIsLoadingMoreConversations(false);
        }
      }
    },
    [user, convPage, hasMoreConversations, isLoadingMoreConversations]
  );

  // Initial load
  useEffect(() => {
    loadConversations(true, true);
  }, [user?.Comp_Code, user?.compcode]);

  // ── Infinite scroll handler for sessions list ──
  const handleSessionsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 60) {
      if (
        !isLoadingMoreConversations &&
        hasMoreConversations &&
        !isRefreshingConversations &&
        !searchFilter
      ) {
        loadConversations(false, true);
      }
    }
  };

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, isLoading]);

  // ── Select conversation ──
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
          .map((m, idx) => ({
            id: `${conversationId}-${idx}-${m.id ?? idx}`,
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

  // ── Delete conversation ──
  const handleDeleteConversation = async (
    conversationId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    try {
      await deleteConversationAPI(conversationId, user);
      setConversations((prev) =>
        prev.filter((c) => c.conversationId !== conversationId)
      );
      if (activeConversationId === conversationId) {
        handleNewChat();
      }
    } catch {
      setConversations((prev) =>
        prev.filter((c) => c.conversationId !== conversationId)
      );
    }
  };

  // ── New chat ──
  const handleNewChat = () => {
    updateActiveConversationId(null);
    setMessages([]);
    setError(null);
    focusInput();
  };

  // ── Clear messages ──
  const handleClearMessages = () => {
    setMessages([]);
    setError(null);
  };

  // ── Suggestion / Prompt click ──
  const handlePromptClick = (promptText: string) => {
    setMessage(promptText);
    focusInput();
  };

  // ── Speech to Text (Voice Input) ──
  const toggleSpeechRecognition = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "hi-IN";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0]?.transcript || "";
        if (transcript) {
          setMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // ── Feedback Handler (also auto-trains if correctSQL provided) ──
  const handleFeedback = async (
    id: string,
    feedbackType: string,
    userComment?: string,
    targetTable?: string,
    correctSQL?: string
  ) => {
    const isHelpful = feedbackType === "HELPFUL";
    const targetMsg = messages.find((m) => m.id === id);

    setMessages((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              liked: isHelpful ? true : false,
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
          correctSQL: correctSQL ? correctSQL.trim() : undefined,
          intent: targetMsg?.intent,
        },
        user
      );
    } catch {
      // silent
    }
  };

  // ── Send message ──
  const executeSend = async (rawMessage?: string) => {
    const textToSend = (rawMessage !== undefined ? rawMessage : message).trim();
    if (!textToSend || isLoading) return;

    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: "user",
      content: textToSend,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setError(null);
    setIsLoading(true);

    try {
      const response = await queryAI(
        {
          message: textToSend,
          conversationId: activeConversationIdRef.current || undefined,
        },
        user
      );

      const answer = String(response.data?.answer || "").trim();
      const returnedConvId = response.data?.conversationId;

      const targetConvId = returnedConvId || activeConversationIdRef.current;
      if (targetConvId) {
        if (returnedConvId && returnedConvId !== activeConversationIdRef.current) {
          updateActiveConversationId(returnedConvId);
        }

        // Dynamically bring the active session to the very TOP of the list
        setConversations((prev) => {
          const existing = prev.find((c) => c.conversationId === targetConvId);
          const updatedItem: ConversationSummary = existing
            ? {
                ...existing,
                lastMessageAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }
            : {
                conversationId: targetConvId,
                title:
                  textToSend.slice(0, 50) +
                  (textToSend.length > 50 ? "..." : ""),
                conversationType: "GENERAL",
                status: "ACTIVE",
                lastMessageAt: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
          const rest = prev.filter((c) => c.conversationId !== targetConvId);
          return [updatedItem, ...rest];
        });
      }

      if (!answer) throw new Error("AI returned an empty response.");

      const assistantMessage: ChatMessage = {
        id: generateMessageId(),
        role: "assistant",
        content: answer,
        createdAt: new Date(),
        mode: response.data?.mode,
        responseTimeMs: response.data?.responseTimeMs,
        confidence: response.data?.confidence?.level,
        sql: response.data?.query?.sql,
        intent: response.data?.intent,
        userQuery: textToSend,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errMsg = getErrorMessage(err);
      setError(errMsg);

      const errorMessage: ChatMessage = {
        id: generateMessageId(),
        role: "assistant",
        content: `Kshama kijiye, an error occurred while processing your request: ${errMsg}`,
        createdAt: new Date(),
        isError: true,
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      focusInput();
    }
  };

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    executeSend();
  };

  // Filtered sessions
  const filteredConversations = conversations.filter((c) =>
    (c.title || "").toLowerCase().includes(searchFilter.toLowerCase().trim())
  );

  const hasMessages = messages.length > 0;
  const isInputDisabled = isLoading || isLoadingHistory;

  return (
    <div className="relative flex h-[calc(100vh-75px)] sm:h-[calc(100vh-160px)] w-full overflow-hidden rounded-2xl border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#0f172a] shadow-md">

      {/* ── MOBILE BACKDROP OVERLAY ── */}
      {showHistorySidebar && (
        <div
          onClick={() => setShowHistorySidebar(false)}
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-xs md:hidden"
        />
      )}

      {/* ── HISTORY SIDEBAR ── */}
      <div
        className={`fixed inset-y-0 left-0 z-30 flex flex-col border-r border-[#e2e8f0] dark:border-[#334155] bg-[#f8fafc] dark:bg-[#0f172a] transition-all duration-300 md:relative md:z-auto ${
          showHistorySidebar
            ? "w-72 max-w-7xl md:w-64 shrink-0 translate-x-0"
            : "-translate-x-full md:translate-x-0 md:w-0 md:overflow-hidden md:border-none"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#e2e8f0] dark:border-[#334155] px-3.5 bg-white dark:bg-[#1e293b]">
          <div className="flex items-center gap-2 text-lg font-bold text-[#193A69] dark:text-white tracking-wide">
            <History size={16} className="text-primary" />
            <span>Chat Sessions</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => loadConversations(true, false)}
              disabled={isRefreshingConversations}
              title="Refresh sessions"
              className="rounded-lg p-1.5 text-[#64748b] hover:text-[#1e293b] dark:text-[#94a3b8] dark:hover:text-white hover:bg-[#f1f5f9] dark:hover:bg-[#334155] transition disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={isRefreshingConversations ? "animate-spin text-primary" : ""}
              />
            </button>

            <button
              type="button"
              onClick={handleNewChat}
              title="New Chat"
              className="rounded-lg p-1.5 text-primary hover:bg-primary/10 transition font-bold text-lg"
            >
              <Plus size={22} />
            </button>
          </div>
        </div>

        {/* New Chat Button & Search */}
        <div className="p-2.5 space-y-2 border-b border-[#e2e8f0] dark:border-[#334155]">
          <button
            type="button"
            onClick={handleNewChat}
            className={`flex w-full items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-lg font-bold transition-all shadow-xs ${
              !activeConversationId
                ? "bg-primary text-white shadow-sm"
                : "bg-white dark:bg-[#1e293b] hover:bg-[#f1f5f9] dark:hover:bg-[#334155] text-[#334155] dark:text-[#e2e8f0] border border-[#e2e8f0] dark:border-[#334155]"
            }`}
          >
            <Plus size={15} />
            <span>New Chat</span>
          </button>

          {conversations.length > 3 && (
            <div className="relative">
              <Search
                size={13}
                className="absolute left-2.5 top-2.5 text-[#94a3b8] pointer-events-none"
              />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search chats..."
                className="w-full rounded-xl border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] pl-8 pr-2.5 py-1.5 text-lg text-[#1e293b] dark:text-white placeholder-[#94a3b8] focus:border-primary focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Sessions List */}
        <div
          className="flex-1 overflow-y-auto p-2 space-y-1"
          onScroll={handleSessionsScroll}
        >
          {isRefreshingConversations && conversations.length === 0 ? (
            <div className="flex items-center justify-center py-8 gap-2 text-lg text-[#64748b]">
              <Loader2 size={15} className="animate-spin text-primary" />
              <span>Loading sessions...</span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-3 py-10 text-center">
              <MessageSquare size={24} className="text-[#94a3b8] opacity-40" />
              <p className="text-lg font-medium text-[#64748b]">
                {searchFilter ? "No matching chats" : "No past sessions yet"}
              </p>
            </div>
          ) : (
            <>
              {filteredConversations.map((conv) => {
                const cid = conv.conversationId;
                const active = cid === activeConversationId;
                return (
                  <div
                    key={cid}
                    onClick={() => {
                      handleSelectConversation(cid);
                      if (typeof window !== "undefined" && window.innerWidth < 768) {
                        setShowHistorySidebar(false);
                      }
                    }}
                    className={`group relative flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-all cursor-pointer ${
                      active
                        ? "bg-primary/10 dark:bg-primary/30 text-primary font-bold shadow-xs"
                        : "text-[#475569] dark:text-[#cbd5e1] hover:bg-white dark:hover:bg-[#1e293b] hover:text-[#193A69] dark:hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-1">
                      <MessageSquare
                        size={13}
                        className={`shrink-0 ${
                          active
                            ? "text-primary"
                            : "text-[#94a3b8] group-hover:text-[#475569]"
                        }`}
                      />
                      <span className="truncate text-lg font-medium">
                        {conv.title || "ERP Query Session"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteConversation(cid, e)}
                      title="Delete session"
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[#94a3b8] hover:text-[#e11d48] rounded-lg hover:bg-[#e2e8f0] dark:hover:bg-[#334155]"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })}

              {/* Lazy Loading Indicator */}
              {isLoadingMoreConversations && (
                <div className="flex items-center justify-center py-2.5 gap-2 text-lg text-[#64748b] dark:text-[#94a3b8]">
                  <Loader2 size={13} className="animate-spin text-primary" />
                  <span>Loading older chats...</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="shrink-0 border-t border-[#e2e8f0] dark:border-[#334155] p-2.5 bg-white dark:bg-[#1e293b] space-y-1">
          <Link
            href="/autovyn/ai/history"
            className="flex items-center justify-between rounded-xl px-2.5 py-1.5 text-lg font-bold text-[#475569] dark:text-[#cbd5e1] hover:bg-[#f1f5f9] dark:hover:bg-[#334155] hover:text-primary transition"
          >
            <div className="flex items-center gap-2">
              <Activity size={13} className="text-emerald-500" />
              <span>Query Logs & Audit</span>
            </div>
            <ChevronRight size={13} className="text-[#94a3b8]" />
          </Link>

          <Link
            href="/autovyn/ai/knowledge"
            className="flex items-center justify-between rounded-xl px-2.5 py-1.5 text-lg font-bold text-[#475569] dark:text-[#cbd5e1] hover:bg-[#f1f5f9] dark:hover:bg-[#334155] hover:text-primary transition"
          >
            <div className="flex items-center gap-2">
              <Database size={13} className="text-primary" />
              <span>Knowledge Base</span>
            </div>
            <ChevronRight size={13} className="text-[#94a3b8]" />
          </Link>

          <div className="flex items-center justify-between px-2.5 pt-1 text-lg text-[#64748b]">
            <span>{conversations.length} sessions</span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
              Live ERP
            </span>
          </div>
        </div>
      </div>

      {/* ── MAIN CHAT AREA ── */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0 max-w-full bg-[#f8fafc] dark:bg-[#0f172a]">

        {/* ── Top Header Bar ── */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#e2e8f0] dark:border-[#334155] px-4 sm:px-6 py-3 bg-white dark:bg-[#1e293b]">
          <div className="flex items-center gap-3 min-w-0">
            {/* Sidebar toggle */}
            <button
              type="button"
              onClick={() => setShowHistorySidebar(!showHistorySidebar)}
              className="rounded-xl border border-[#e2e8f0] dark:border-[#334155] bg-[#f8fafc] dark:bg-[#0f172a] p-2 text-[#475569] dark:text-[#cbd5e1] transition hover:bg-[#f1f5f9] dark:hover:bg-[#334155] shrink-0 shadow-xs"
              title={showHistorySidebar ? "Collapse Sidebar" : "Expand Sidebar"}
            >
              {showHistorySidebar ? (
                <ChevronLeft size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>

            {/* AI Status Avatar */}
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#193A69] via-primary to-[#3b82f6] text-white shadow-sm ring-2 ring-primary/20">
              <Bot size={18} />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#10b981] ring-2 ring-white dark:ring-[#1e293b] animate-pulse" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-[#193A69] dark:text-white text-lg sm:text-lg leading-tight truncate tracking-wide">
                  AutoVyn Copilot Pro
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[#ecfdf5] dark:bg-[#022c22]/40 border border-[#a7f3d0] dark:border-[#065f46] px-2 py-0.5 text-lg font-bold text-[#047857] dark:text-[#34d399]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-pulse" />
                  ERP DB Connected
                </span>
              </div>
              <p className="text-lg sm:text-[16px] text-[#64748b] dark:text-[#94a3b8] leading-tight truncate">
                {activeConversationId
                  ? `Active Session • ID: ${activeConversationId.slice(0, 14)}...`
                  : "Attendance, Salary Slip, Employee Bio, and Vouchers"}
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/autovyn/ai/history">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="rounded-xl border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#0f172a] text-[#475569] dark:text-[#cbd5e1] hover:bg-[#f8fafc] dark:hover:bg-[#334155] font-semibold text-lg gap-1.5 shadow-xs"
                title="View all user queries, responses & SQL logs"
              >
                <span className="hidden sm:inline">Query Logs</span>
              </Button>
            </Link>

            {hasMessages && (
              <button
                type="button"
                onClick={handleClearMessages}
                title="Clear current messages"
                className="flex items-center gap-1.5 rounded-xl border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#0f172a] px-3 py-1.5 text-lg font-bold text-[#475569] dark:text-[#cbd5e1] transition hover:border-[#fda4af] hover:bg-[#fff1f2] hover:text-[#e11d48] shadow-xs"
              >
                {/* <Trash2 size={13} /> */}
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}

            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleNewChat}
              className="rounded-xl border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#0f172a] text-[#193A69] dark:text-white hover:bg-[#f8fafc] dark:hover:bg-[#334155] font-bold shadow-xs"
            >
              {/* <Plus size={14} className="sm:mr-1 text-primary" /> */}
              <span className="hidden sm:inline">New Chat</span>
            </Button>
          </div>
        </div>

        {/* ── Chat Messages Feed ── */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-6 min-w-0">
          {isLoadingHistory ? (
            <div className="flex h-full items-center justify-center gap-3 text-lg sm:text-lg text-[#64748b]">
              <Loader2 size={22} className="animate-spin text-primary" />
              <span>Loading conversation history...</span>
            </div>
          ) : !hasMessages ? (
            <EmptyState
              userName={user?.name || user?.userName}
              onPromptClick={handlePromptClick}
            />
          ) : (
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 min-w-0">
              {/* Date Separator */}
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 border-t border-[#e2e8f0] dark:border-[#334155]" />
                <span className="text-lg font-bold uppercase tracking-wider text-[#64748b] px-3 py-0.5 rounded-full bg-[#f1f5f9] dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155]">
                  {messages[0]?.createdAt.toLocaleDateString([], {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </span>
                <div className="flex-1 border-t border-[#e2e8f0] dark:border-[#334155]" />
              </div>

              {/* Message List */}
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  conversationId={activeConversationId}
                  onFeedback={handleFeedback}
                  user={user}
                />
              ))}

              {/* Typing Shimmer Indicator */}
              {isLoading && <TypingIndicator />}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div className="shrink-0 flex items-center justify-between gap-3 border-t border-[#fecdd3] dark:border-[#881337]/50 bg-[#fff1f2] dark:bg-[#4c0519]/30 px-4 py-2 text-lg text-[#be123c] dark:text-[#fda4af]">
            <div className="flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-[#e11d48]" />
              <span className="font-semibold">{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-[#be123c] hover:text-[#881337] font-bold text-lg"
            >
              ×
            </button>
          </div>
        )}
        {/* ── Suggestion Chips Bar ── */}
        {/* {hasMessages && (
          <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto scrollbar-none border-t border-[#e2e8f0] dark:border-[#334155] bg-white/70 dark:bg-[#1e293b]/70 backdrop-blur-xs">
            <span className="text-lg font-bold text-[#64748b] dark:text-[#94a3b8] uppercase shrink-0">
              Suggestions:
            </span>
            {QUICK_SUGGESTION_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handlePromptClick(chip)}
                className="shrink-0 rounded-full bg-[#f1f5f9] dark:bg-[#0f172a] hover:bg-primary/10 dark:hover:bg-primary/20 border border-[#e2e8f0] dark:border-[#334155] hover:border-primary/40 px-3 py-1 text-[16px] text-[#334155] dark:text-[#cbd5e1] hover:text-primary transition font-medium shadow-xs"
              >
                {chip}
              </button>
            ))}
          </div>
        )} */}

       

        {/* ── Chat Input Dock ── */}
        <form
          onSubmit={handleFormSubmit}
          className="shrink-0 border-t border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] p-3 sm:p-4 shadow-md"
        >
          <div className="mx-auto flex w-full  items-end gap-2 sm:gap-3">
            {/* Input Capsule */}
            <div className="relative flex-1 rounded-2xl border border-[#cbd5e1] dark:border-[#334155] bg-[#f8fafc] dark:bg-[#0f172a] focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-xs">
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
                className="w-full resize-none bg-transparent px-4 py-3 text-lg sm:text-[17px] text-[#0f172a] dark:text-white placeholder-[#94a3b8] focus:outline-none scrollbar-none max-h-36 min-h-[44px]"
              />

              {/* Character count */}
              {message.length > 150 && (
                <span className="absolute right-3.5 bottom-2 text-lg text-[#94a3b8] pointer-events-none font-mono">
                  {message.length}
                </span>
              )}
            </div>

            {/* Voice Input Button */}
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              title={isListening ? "Stop voice input" : "Speak voice query (Hindi/English)"}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-all shadow-xs ${
                isListening
                  ? "bg-[#e11d48] text-white border-[#f43f5e] animate-pulse ring-4 ring-[#f43f5e]/20"
                  : "bg-[#f1f5f9] dark:bg-[#0f172a] hover:bg-[#e2e8f0] dark:hover:bg-[#334155] text-[#475569] dark:text-[#cbd5e1] hover:text-[#193A69] dark:hover:text-white border-[#e2e8f0] dark:border-[#334155]"
              }`}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            {/* Send Button */}
            <button
              type="submit"
              disabled={isInputDisabled || !message.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-[#193A69] via-primary to-[#2563eb] text-white shadow-md shadow-primary/20 transition-all hover:shadow-lg active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}