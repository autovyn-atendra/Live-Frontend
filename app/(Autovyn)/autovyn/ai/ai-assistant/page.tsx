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

const listConversations = async (
  user?: any
): Promise<ConversationListResponse> => {
  const response = await axios.get<ConversationListResponse>(
    `${BASE_URL}/ai/conversations`,
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
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/50",
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
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50",
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
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50",
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
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900/50",
    prompts: [
      "Today's service reminders due list",
      "Pending vehicle delivery status",
      "Upcoming customer follow-ups",
    ],
  },
];

// Quick follow-up contextual suggestion chips
const QUICK_SUGGESTION_CHIPS = [
  "Iska permanent address nikalo",
  "Iska birthday kab aata hai?",
  "April 2026 ki salary slip",
  "21/10/2025 absent count",
  "Kaun kaun aaj present hai?",
  "Top 10 highest employee salary",
];

// ============================================================
// COPY BUTTON WITH TOAST FEEDBACK
// ============================================================
const CopyButton = ({ text, label }: { text: string; label?: string }) => {
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
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all
        text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-white bg-slate-100 dark:bg-[#1e293b] hover:bg-slate-200 dark:hover:bg-[#334155] border border-slate-200 dark:border-[#334155]"
    >
      {copied ? (
        <>
          <Check size={13} className="text-emerald-600 dark:text-emerald-400" />
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied!</span>
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
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all border ${
        isSpeaking
          ? "bg-primary text-white border-primary animate-pulse"
          : "text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-white bg-slate-100 dark:bg-[#1e293b] hover:bg-slate-200 dark:hover:bg-[#334155] border-slate-200 dark:border-[#334155]"
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
    <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#193A69] via-primary to-blue-500 text-white shadow-md ring-2 ring-primary/20">
      <Bot size={18} className="animate-spin" style={{ animationDuration: "8s" }} />
      <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-white dark:ring-[#0f172a]" />
      </span>
    </div>

    <div className="flex flex-col gap-1 max-w-[85%]">
      <div className="flex items-center gap-2 px-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
        <span className="text-[#193A69] dark:text-white font-bold">AutoVyn Copilot</span>
        <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-mono text-primary font-bold">
          QUERYING MSSQL
        </span>
      </div>

      <div className="flex items-center gap-3 rounded-2xl rounded-tl-sm border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#1e293b] px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: `${i * 0.18}s` }}
            />
          ))}
        </div>
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 animate-pulse">
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
          className="rounded-md bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-[#334155] px-1.5 py-0.5 font-mono text-[11px] font-bold text-primary dark:text-[#60A5FA]"
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
    <div className="space-y-2 text-xs sm:text-[13px] leading-relaxed text-slate-700 dark:text-slate-200">
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
              className="my-3 overflow-hidden rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#0f172a] shadow-sm"
            >
              {/* Table header bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-[#1e293b] px-3.5 py-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#193A69] dark:text-white">
                  <FileSpreadsheet size={15} className="text-emerald-600 dark:text-emerald-400" />
                  <span>ERP Results ({dataRows.length} records)</span>
                </div>

                <div className="flex items-center gap-2">
                  {dataRows.length > 4 && (
                    <input
                      type="text"
                      placeholder="Filter table..."
                      value={tableFilter}
                      onChange={(e) => setTableFilter(e.target.value)}
                      className="h-7 w-28 sm:w-36 rounded-md border border-slate-300 dark:border-[#334155] bg-white dark:bg-[#0f172a] px-2 text-[11px] text-slate-800 dark:text-white placeholder-slate-400 focus:border-primary focus:outline-none"
                    />
                  )}
                  <CopyButton text={csvContent} label="Copy CSV" />
                </div>
              </div>

              {/* Table Scroll View */}
              <div className="max-h-80 overflow-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-[#1e293b] text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-[#334155] font-bold shadow-xs">
                    <tr>
                      {headerCells.map((cell: string, cIdx: number) => (
                        <th
                          key={cIdx}
                          className="px-3.5 py-2.5 border-r last:border-r-0 border-slate-200 dark:border-[#334155] whitespace-nowrap text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300"
                        >
                          {renderInlineFormatting(cell)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-[#334155]">
                    {filteredDataRows.map((rStr: string, rIdx: number) => {
                      const cells = rStr
                        .split("|")
                        .slice(1, -1)
                        .map((c: string) => c.trim());
                      return (
                        <tr
                          key={rIdx}
                          className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/60 transition-colors even:bg-slate-50/50 dark:even:bg-[#1e293b]/30"
                        >
                          {cells.map((cell: string, cIdx: number) => (
                            <td
                              key={cIdx}
                              className="px-3.5 py-2 border-r last:border-r-0 border-slate-200/60 dark:border-[#334155]/60 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium"
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
              className="text-sm font-bold text-primary dark:text-[#60A5FA] mt-3.5 mb-1 flex items-center gap-2"
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
              className="text-xs font-bold text-[#193A69] dark:text-slate-100 mt-2.5 mb-0.5"
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
              <div className="flex-1 leading-normal text-slate-700 dark:text-slate-200">
                {renderInlineFormatting(cleanText)}
              </div>
            </div>
          );
        }

        if (/^\d+\.\s+/.test(text)) {
          const match = text.match(/^(\d+)\.\s+(.*)/);
          return (
            <div key={bIdx} className="flex items-start gap-2.5 pl-1 py-0.5">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary mt-0.5">
                {match?.[1]}
              </span>
              <div className="flex-1 leading-normal text-slate-700 dark:text-slate-200">
                {renderInlineFormatting(match?.[2] || "")}
              </div>
            </div>
          );
        }

        return (
          <div
            key={bIdx}
            className="break-words leading-relaxed py-0.5 text-slate-700 dark:text-slate-200"
          >
            {renderInlineFormatting(text)}
          </div>
        );
      })}
    </div>
  );
};

// ============================================================
// MESSAGE BUBBLE COMPONENT
// ============================================================
const MessageBubble = ({
  msg,
  onFeedback,
}: {
  msg: ChatMessage;
  onFeedback?: (id: string, liked: boolean) => void;
}) => {
  const isUser = msg.role === "user";

  return (
    <div
      className={`group flex gap-2.5 sm:gap-3.5 transition-all my-1.5 animate-in fade-in-50 duration-300 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {/* Assistant Bot Avatar */}
      {!isUser && (
        <div className="relative flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#193A69] via-primary to-blue-500 text-white shadow-sm ring-2 ring-primary/20 mt-0.5">
          <Bot size={18} />
          <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0f172a]" />
        </div>
      )}

      {/* Bubble Container */}
      <div
        className={`relative max-w-[94%] sm:max-w-[85%] md:max-w-[80%] ${
          isUser ? "items-end" : "items-start"
        } flex flex-col gap-1`}
      >
        {/* Assistant Header Tag */}
        {!isUser && (
          <div className="flex items-center gap-2 px-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            <span className="text-[#193A69] dark:text-white font-bold">
              AutoVyn AI
            </span>

            {msg.mode && (
              <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-mono text-primary font-bold">
                {msg.mode === "DATABASE" ? "⚡ DATABASE (LIVE ERP)" : msg.mode}
              </span>
            )}

            {msg.responseTimeMs && (
              <span className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                <Clock size={11} />
                {msg.responseTimeMs}ms
              </span>
            )}
          </div>
        )}

        {/* Bubble Card */}
        <div
          className={`rounded-2xl px-4 py-3.5 shadow-sm transition-all ${
            isUser
              ? "rounded-tr-xs bg-gradient-to-r from-[#193A69] via-primary to-blue-600 text-white shadow-md shadow-primary/10"
              : msg.isError
              ? "rounded-tl-xs border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300"
              : "rounded-tl-xs border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#1e293b] text-slate-800 dark:text-slate-100 shadow-sm"
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words text-xs sm:text-[13px] font-medium leading-relaxed">
              {msg.content}
            </p>
          ) : (
            <FormattedMarkdown content={msg.content} />
          )}

          {/* Action Toolbar on Bottom */}
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-[#334155]/60 pt-2 text-[11px]">
            <div className="flex items-center gap-1.5">
              {!isUser && !msg.isError && (
                <>
                  <CopyButton text={msg.content} label="Copy" />
                  <SpeechButton text={msg.content} />

                  {/* Feedback Buttons */}
                  <button
                    type="button"
                    onClick={() => onFeedback && onFeedback(msg.id, true)}
                    className={`rounded-lg p-1 transition ${
                      msg.liked === true
                        ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
                        : "text-slate-400 hover:text-slate-600 dark:hover:text-white"
                    }`}
                    title="Helpful response"
                  >
                    <ThumbsUp size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onFeedback && onFeedback(msg.id, false)}
                    className={`rounded-lg p-1 transition ${
                      msg.liked === false
                        ? "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40"
                        : "text-slate-400 hover:text-slate-600 dark:hover:text-white"
                    }`}
                    title="Not helpful"
                  >
                    <ThumbsDown size={13} />
                  </button>
                </>
              )}
            </div>

            <span
              className={`text-[10px] font-medium ${
                isUser ? "text-white/80" : "text-slate-400"
              }`}
            >
              {formatMessageTime(msg.createdAt)}
            </span>
          </div>
        </div>
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
        <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-[#193A69] via-primary to-blue-500 text-white shadow-lg ring-4 ring-primary/10">
          <Bot size={36} className="animate-in zoom-in-50 duration-500" />
        </div>
      </div>

      {/* Headline & Personalized Greeting */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-xs font-bold text-primary shadow-xs">
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

        <p className="mx-auto max-w-2xl text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
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
              className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#1e293b] p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/50"
            >
              <div className="relative z-10 flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-xl border ${cat.bg} ${cat.color}`}
                  >
                    <Icon size={16} />
                  </div>
                  <h3 className="text-xs font-bold text-[#193A69] dark:text-white tracking-wide">
                    {cat.title}
                  </h3>
                </div>

                <span className="rounded-full bg-slate-100 dark:bg-[#0f172a] px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-[#334155]">
                  {cat.badge}
                </span>
              </div>

              <div className="relative z-10 space-y-1">
                {cat.prompts.map((p, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => onPromptClick(p)}
                    className="flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 transition-all hover:bg-slate-100 dark:hover:bg-[#334155] hover:text-primary dark:hover:text-white text-left group/item"
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
      <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2 text-[11px] text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-[#1e293b] border border-slate-200 dark:border-[#334155] px-3 py-1 font-medium">
          <Zap size={13} className="text-amber-500" />
          Sub-second Execution
        </span>
        <span className="flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-[#1e293b] border border-slate-200 dark:border-[#334155] px-3 py-1 font-medium">
          <ShieldCheck size={13} className="text-emerald-500" />
          Enterprise SQL Guard
        </span>
        <span className="flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-[#1e293b] border border-slate-200 dark:border-[#334155] px-3 py-1 font-medium">
          <Database size={13} className="text-blue-500" />
          Live MSSQL Sync
        </span>
        <span className="flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-[#1e293b] border border-slate-200 dark:border-[#334155] px-3 py-1 font-medium">
          <BookOpen size={13} className="text-purple-500" />
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

  // ── Load conversation list ──
  const loadConversations = useCallback(
    async (quiet = false) => {
      if (!user?.Comp_Code && !user?.compcode) return;
      if (!quiet) setIsRefreshingConversations(true);
      try {
        const res = await listConversations(user);
        if (res.success && Array.isArray(res.data)) {
          setConversations(res.data);
        }
      } catch {
        // silent
      } finally {
        if (!quiet) setIsRefreshingConversations(false);
      }
    },
    [user]
  );

  // Initial load
  useEffect(() => {
    loadConversations(true);
  }, [loadConversations]);

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

  // ── Feedback Handler ──
  const handleFeedback = (id: string, liked: boolean) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, liked: m.liked === liked ? null : liked } : m
      )
    );
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

      if (
        returnedConvId &&
        returnedConvId !== activeConversationIdRef.current
      ) {
        updateActiveConversationId(returnedConvId);
        listConversations(user)
          .then((res) => {
            if (res.success && Array.isArray(res.data)) {
              setConversations(res.data);
            }
          })
          .catch(() => {});
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
    <div className="relative flex h-[calc(100vh-75px)] sm:h-[calc(100vh-90px)] w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#0f172a] shadow-md">

      {/* ── MOBILE BACKDROP OVERLAY ── */}
      {showHistorySidebar && (
        <div
          onClick={() => setShowHistorySidebar(false)}
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-xs md:hidden"
        />
      )}

      {/* ── HISTORY SIDEBAR ── */}
      <div
        className={`fixed inset-y-0 left-0 z-30 flex flex-col border-r border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-[#0f172a] transition-all duration-300 md:relative md:z-auto ${
          showHistorySidebar
            ? "w-72 max-w-[85vw] md:w-64 shrink-0 translate-x-0"
            : "-translate-x-full md:translate-x-0 md:w-0 md:overflow-hidden md:border-none"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 dark:border-[#334155] px-3.5 bg-white dark:bg-[#1e293b]">
          <div className="flex items-center gap-2 text-xs font-bold text-[#193A69] dark:text-white tracking-wide">
            <History size={16} className="text-primary" />
            <span>Chat Sessions</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => loadConversations(false)}
              disabled={isRefreshingConversations}
              title="Refresh sessions"
              className="rounded-lg p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#334155] transition disabled:opacity-50"
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
              className="rounded-lg p-1.5 text-primary hover:bg-primary/10 transition font-bold"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* New Chat Button & Search */}
        <div className="p-2.5 space-y-2 border-b border-slate-200 dark:border-[#334155]">
          <button
            type="button"
            onClick={handleNewChat}
            className={`flex w-full items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all shadow-xs ${
              !activeConversationId
                ? "bg-primary text-white shadow-sm"
                : "bg-white dark:bg-[#1e293b] hover:bg-slate-100 dark:hover:bg-[#334155] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#334155]"
            }`}
          >
            <Plus size={15} />
            <span>New Chat</span>
          </button>

          {conversations.length > 3 && (
            <div className="relative">
              <Search
                size={13}
                className="absolute left-2.5 top-2.5 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search chats..."
                className="w-full rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#1e293b] pl-8 pr-2.5 py-1.5 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:border-primary focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isRefreshingConversations ? (
            <div className="flex items-center justify-center py-8 gap-2 text-xs text-slate-500">
              <Loader2 size={15} className="animate-spin text-primary" />
              <span>Loading sessions...</span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-3 py-10 text-center">
              <MessageSquare size={24} className="text-slate-400 opacity-40" />
              <p className="text-xs font-medium text-slate-500">
                {searchFilter ? "No matching chats" : "No past sessions yet"}
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
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
                  className={`group relative flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-all cursor-pointer border ${
                    active
                      ? "bg-primary/10 dark:bg-primary/20 text-primary font-bold border-primary/30 shadow-xs"
                      : "border-transparent text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-[#1e293b] hover:text-[#193A69] dark:hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-1">
                    <MessageSquare
                      size={13}
                      className={`shrink-0 ${
                        active ? "text-primary" : "text-slate-400 group-hover:text-slate-600"
                      }`}
                    />
                    <span className="truncate text-xs font-medium">
                      {conv.title || "ERP Query Session"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteConversation(cid, e)}
                    title="Delete session"
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-200 dark:hover:bg-[#334155]"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="shrink-0 border-t border-slate-200 dark:border-[#334155] p-2.5 bg-white dark:bg-[#1e293b] space-y-1.5">
          <Link
            href="/autovyn/ai/knowledge"
            className="flex items-center justify-between rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#334155] hover:text-primary transition"
          >
            <div className="flex items-center gap-2">
              <Database size={13} className="text-primary" />
              <span>Knowledge Base</span>
            </div>
            <ChevronRight size={13} className="text-slate-400" />
          </Link>

          <div className="flex items-center justify-between px-2.5 text-[10px] text-slate-500">
            <span>{conversations.length} sessions</span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Live ERP
            </span>
          </div>
        </div>
      </div>

      {/* ── MAIN CHAT AREA ── */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0 bg-[#f8fafc] dark:bg-[#0f172a]">

        {/* ── Top Header Bar ── */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 dark:border-[#334155] px-4 sm:px-6 py-3 bg-white dark:bg-[#1e293b]">
          <div className="flex items-center gap-3 min-w-0">
            {/* Sidebar toggle */}
            <button
              type="button"
              onClick={() => setShowHistorySidebar(!showHistorySidebar)}
              className="rounded-xl border border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-[#0f172a] p-2 text-slate-600 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-[#334155] shrink-0 shadow-xs"
              title={showHistorySidebar ? "Collapse Sidebar" : "Expand Sidebar"}
            >
              {showHistorySidebar ? (
                <ChevronLeft size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>

            {/* AI Status Avatar */}
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#193A69] via-primary to-blue-500 text-white shadow-sm ring-2 ring-primary/20">
              <Bot size={18} />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#1e293b] animate-pulse" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-[#193A69] dark:text-white text-xs sm:text-sm leading-tight truncate tracking-wide">
                  AutoVyn Copilot Pro
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  ERP DB Connected
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-tight truncate">
                {activeConversationId
                  ? `Active Session • ID: ${activeConversationId.slice(0, 14)}...`
                  : "Attendance, Salary Slip, Employee Bio, and Vouchers"}
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {hasMessages && (
              <button
                type="button"
                onClick={handleClearMessages}
                title="Clear current messages"
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#0f172a] px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 shadow-xs"
              >
                <Trash2 size={13} />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleNewChat}
              className="rounded-xl border-slate-200 dark:border-[#334155] bg-white dark:bg-[#0f172a] text-[#193A69] dark:text-white hover:bg-slate-50 dark:hover:bg-[#334155] font-bold shadow-xs"
            >
              <Plus size={14} className="sm:mr-1 text-primary" />
              <span className="hidden sm:inline">New Chat</span>
            </Button>
          </div>
        </div>

        {/* ── Chat Messages Feed ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {isLoadingHistory ? (
            <div className="flex h-full items-center justify-center gap-3 text-xs sm:text-sm text-slate-500">
              <Loader2 size={22} className="animate-spin text-primary" />
              <span>Loading conversation history...</span>
            </div>
          ) : !hasMessages ? (
            <EmptyState
              userName={user?.name || user?.userName}
              onPromptClick={handlePromptClick}
            />
          ) : (
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
              {/* Date Separator */}
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 border-t border-slate-200 dark:border-[#334155]" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 py-0.5 rounded-full bg-slate-100 dark:bg-[#1e293b] border border-slate-200 dark:border-[#334155]">
                  {messages[0]?.createdAt.toLocaleDateString([], {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </span>
                <div className="flex-1 border-t border-slate-200 dark:border-[#334155]" />
              </div>

              {/* Message List */}
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  onFeedback={handleFeedback}
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
          <div className="shrink-0 flex items-center justify-between gap-3 border-t border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 px-4 py-2 text-xs text-rose-700 dark:text-rose-300">
            <div className="flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-rose-600" />
              <span className="font-semibold">{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-rose-700 hover:text-rose-900 font-bold text-sm"
            >
              ×
            </button>
          </div>
        )}

        {/* ── Suggestion Chips Bar ── */}
        {hasMessages && (
          <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto scrollbar-none border-t border-slate-200 dark:border-[#334155] bg-white/70 dark:bg-[#1e293b]/70 backdrop-blur-xs">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase shrink-0">
              Suggestions:
            </span>
            {QUICK_SUGGESTION_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handlePromptClick(chip)}
                className="shrink-0 rounded-full bg-slate-100 dark:bg-[#0f172a] hover:bg-primary/10 dark:hover:bg-primary/20 border border-slate-200 dark:border-[#334155] hover:border-primary/40 px-3 py-1 text-[11px] text-slate-700 dark:text-slate-300 hover:text-primary transition font-medium shadow-xs"
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {/* ── Chat Input Dock ── */}
        <form
          onSubmit={handleFormSubmit}
          className="shrink-0 border-t border-slate-200 dark:border-[#334155] bg-white dark:bg-[#1e293b] p-3 sm:p-4 shadow-md"
        >
          <div className="mx-auto flex w-full max-w-4xl items-end gap-2 sm:gap-3">
            {/* Input Capsule */}
            <div className="relative flex-1 rounded-2xl border border-slate-300 dark:border-[#334155] bg-slate-50 dark:bg-[#0f172a] focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-xs">
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
                className="w-full resize-none bg-transparent px-4 py-3 text-xs sm:text-[13px] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none scrollbar-none max-h-36 min-h-[44px]"
              />

              {/* Character count */}
              {message.length > 150 && (
                <span className="absolute right-3.5 bottom-2 text-[10px] text-slate-400 pointer-events-none font-mono">
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
                  ? "bg-rose-600 text-white border-rose-500 animate-pulse ring-4 ring-rose-500/20"
                  : "bg-slate-100 dark:bg-[#0f172a] hover:bg-slate-200 dark:hover:bg-[#334155] text-slate-600 dark:text-slate-300 hover:text-[#193A69] dark:hover:text-white border-slate-200 dark:border-[#334155]"
              }`}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            {/* Send Button */}
            <button
              type="submit"
              disabled={isInputDisabled || !message.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-[#193A69] via-primary to-blue-600 text-white shadow-md shadow-primary/20 transition-all hover:shadow-lg active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>

          {/* Footer Shortcuts & Attribution */}
          <div className="mx-auto mt-2 flex w-full max-w-4xl items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 px-1">
            <span>
              Press <kbd className="rounded border border-slate-200 dark:border-[#334155] bg-slate-100 dark:bg-[#0f172a] px-1 py-0.5 font-mono text-slate-600 dark:text-slate-300">Enter ↵</kbd> to send • <kbd className="rounded border border-slate-200 dark:border-[#334155] bg-slate-100 dark:bg-[#0f172a] px-1 py-0.5 font-mono text-slate-600 dark:text-slate-300">Shift + Enter</kbd> for new line
            </span>
            <span className="hidden sm:inline font-semibold">
              AutoVyn AI Copilot • Enterprise Live Data
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}