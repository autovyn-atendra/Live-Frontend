"use client";

import {
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import axios, { AxiosError } from "axios";

// ============================================================
// CONSTANTS
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
    request?: { message?: string };
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
}

// ============================================================
// UTILS
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
      return "You are not authorized to access this information.";
    if (axiosError.response?.status === 404)
      return "AI API endpoint was not found.";
    if (axiosError.response?.status === 429)
      return "Too many AI requests. Please try again shortly.";
    if (axiosError.code === "ERR_NETWORK")
      return "Unable to connect to the AI server.";
    return axiosError.message || "AI request failed.";
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong while processing your request.";
};

const formatMessageTime = (date: Date) =>
  date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const formatSessionDate = (dateStr?: string) => {
  if (!dateStr) return "Active Session";
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { day: "2-digit", month: "short" });
};

// ============================================================
// SUGGESTION CHIPS
// ============================================================
const SUGGESTIONS = [
  "1600161 ki July ki attendance nikalo",
  "Meri latest salary kya hai?",
  "Top 10 employee salary batao",
  "Service reminders due today",
  "Branch wise sales report",
];

// ============================================================
// COPY BUTTON COMPONENT
// ============================================================
const CopyButton = ({ text }: { text: string }) => {
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
      title="Copy message"
      className="rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity
        text-[#9CA3AF] hover:text-[#374151] dark:hover:text-[#E5E7EB]
        hover:bg-[#F3F4F6] dark:hover:bg-white/10"
    >
      {copied ? (
        <Check size={13} className="text-[#16A34A]" />
      ) : (
        <Copy size={13} />
      )}
    </button>
  );
};

// ============================================================
// TYPING INDICATOR DOTS
// ============================================================
const TypingDots = () => (
  <div className="flex items-center gap-1 px-1 py-0.5">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="h-2 w-2 rounded-full bg-primary animate-bounce"
        style={{ animationDelay: `${i * 0.18}s` }}
      />
    ))}
  </div>
);

// ============================================================
// EMPTY STATE COMPONENT
// ============================================================
const EmptyState = ({
  onSuggestionClick,
}: {
  onSuggestionClick: (s: string) => void;
}) => (
  <div className="flex min-h-full items-center justify-center">
    <div className="max-w-lg text-center px-4">
      {/* Icon */}
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-light text-primary shadow-sm">
        <Bot size={32} />
      </div>

      <h2 className="mt-4 text-xl font-bold text-text-primary">
        How can I help you?
      </h2>

      <p className="mt-2 text-sm leading-6 text-text-secondary">
        Ask a question about ERP data, employees, attendance, salary, or
        service reminders. I can run queries and explain results in plain
        language.
      </p>

      {/* Feature pills */}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {[
          { icon: "📊", label: "Reports" },
          { icon: "👤", label: "Employees" },
          { icon: "💰", label: "Salary" },
          { icon: "🔔", label: "Reminders" },
          { icon: "📅", label: "Attendance" },
        ].map((f) => (
          <span
            key={f.label}
            className="inline-flex items-center gap-1.5 rounded-full border border-border
              bg-surface-secondary px-3 py-1 text-[11px] font-semibold text-text-secondary"
          >
            <span>{f.icon}</span>
            {f.label}
          </span>
        ))}
      </div>

      {/* Suggestions */}
      <div className="mt-5 flex flex-col items-center gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
          <Sparkles size={12} />
          Try asking
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSuggestionClick(s)}
              className="rounded-full border border-border bg-background px-3.5 py-1.5
                text-xs text-text-secondary transition-all
                hover:border-primary hover:bg-primary-light hover:text-primary"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ============================================================
// FORMATTED MARKDOWN RENDERER
// ============================================================
const renderInlineFormatting = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);

  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className="font-bold text-text-primary">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      const val = part.slice(1, -1);
      // Clean inline styling: if numeric or status, accent subtle badge; otherwise plain text font
      return (
        <span
          key={idx}
          className="rounded bg-surface-secondary px-1.5 py-0.5 font-mono text-[11px] font-semibold text-text-primary border border-border/60"
        >
          {val}
        </span>
      );
    }
    return part;
  });
};

const FormattedMarkdown = ({ content }: { content: string }) => {
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
    <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed">
      {blocks.map((block, bIdx) => {
        if (block.type === "empty") {
          return <div key={bIdx} className="h-1" />;
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

          return (
            <div
              key={bIdx}
              className="my-3 overflow-x-auto rounded-xl border border-border shadow-xs bg-surface"
            >
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-surface-secondary text-text-primary border-b border-border font-bold">
                  <tr>
                    {headerCells.map((cell: string, cIdx: number) => (
                      <th
                        key={cIdx}
                        className="px-3.5 py-2.5 border-r last:border-r-0 border-border whitespace-nowrap font-bold text-xs uppercase tracking-wider text-text-secondary"
                      >
                        {renderInlineFormatting(cell)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {dataRows.map((rStr: string, rIdx: number) => {
                    const cells = rStr
                      .split("|")
                      .slice(1, -1)
                      .map((c: string) => c.trim());
                    return (
                      <tr
                        key={rIdx}
                        className="hover:bg-surface-secondary/60 transition-colors"
                      >
                        {cells.map((cell: string, cIdx: number) => (
                          <td
                            key={cIdx}
                            className="px-3.5 py-2 border-r last:border-r-0 border-border/60 whitespace-nowrap text-text-secondary font-medium"
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
          );
        }

        const text = block.content;

        if (text.startsWith("### ")) {
          return (
            <h3 key={bIdx} className="text-sm font-bold text-primary mt-2 mb-1">
              {renderInlineFormatting(text.replace(/^###\s+/, ""))}
            </h3>
          );
        }
        if (text.startsWith("#### ")) {
          return (
            <h4 key={bIdx} className="text-xs font-bold text-text-primary mt-2 mb-0.5">
              {renderInlineFormatting(text.replace(/^####\s+/, ""))}
            </h4>
          );
        }

        if (text.startsWith("- ") || text.startsWith("* ") || text.startsWith("• ")) {
          const cleanText = text.replace(/^([-*•])\s+/, "");
          return (
            <div key={bIdx} className="flex items-start gap-2 pl-1 py-0.5">
              <span className="text-primary font-bold shrink-0 text-sm">•</span>
              <div className="flex-1 leading-normal text-text-secondary">
                {renderInlineFormatting(cleanText)}
              </div>
            </div>
          );
        }

        if (/^\d+\.\s+/.test(text)) {
          const match = text.match(/^(\d+)\.\s+(.*)/);
          return (
            <div key={bIdx} className="flex items-start gap-2 pl-1 py-0.5">
              <span className="text-primary font-bold shrink-0 text-xs">
                {match?.[1]}.
              </span>
              <div className="flex-1 leading-normal text-text-secondary">
                {renderInlineFormatting(match?.[2] || "")}
              </div>
            </div>
          );
        }

        return (
          <div key={bIdx} className="break-words leading-normal py-0.5">
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
const MessageBubble = ({ msg }: { msg: ChatMessage }) => {
  const isUser = msg.role === "user";

  return (
    <div
      className={`group flex gap-2.5 sm:gap-3 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {/* Bot Avatar */}
      {!isUser && (
        <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary shadow-sm">
          <Bot size={17} />
        </div>
      )}

      {/* Bubble */}
      <div
        className={`relative max-w-[88%] sm:max-w-[80%] md:max-w-[75%] ${
          isUser ? "items-end" : "items-start"
        } flex flex-col gap-1`}
      >
        <div
          className={`rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 shadow-sm ${
            isUser
              ? "rounded-br-md bg-primary text-white"
              : msg.isError
              ? "rounded-bl-md border border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C] dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400"
              : "rounded-bl-md border border-border bg-background text-text-primary"
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words text-xs sm:text-sm leading-6">
              {msg.content}
            </p>
          ) : (
            <FormattedMarkdown content={msg.content} />
          )}

          <div className="mt-1 flex items-center justify-end gap-1">
            {!isUser && !msg.isError && <CopyButton text={msg.content} />}
            <p
              className={`text-[10px] ${
                isUser
                  ? "text-white/70"
                  : msg.isError
                  ? "text-[#EF4444]/60"
                  : "text-text-muted"
              }`}
            >
              {formatMessageTime(msg.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white shadow-sm">
          <User size={17} />
        </div>
      )}
    </div>
  );
};

// ============================================================
// MAIN PAGE
// ============================================================
export default function AIAssistantPage() {
  const user = useCurrentUser() as any;

  // State
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
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

  // Refs
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // ── Helpers ──
  const updateActiveConversationId = (id: string | null) => {
    activeConversationIdRef.current = id;
    setActiveConversationId(id);
  };

  const focusInput = () =>
    window.setTimeout(() => inputRef.current?.focus(), 0);

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

  // ── New chat ──
  const handleNewChat = () => {
    updateActiveConversationId(null);
    setMessages([]);
    setError(null);
    focusInput();
  };

  // ── Clear messages (current session) ──
  const handleClearMessages = () => {
    setMessages([]);
    setError(null);
  };

  // ── Suggestion click ──
  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
    focusInput();
  };

  // ── Send message ──
  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedMessage = message.trim();
    if (!normalizedMessage || isLoading) return;

    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: "user",
      content: normalizedMessage,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setError(null);
    setIsLoading(true);

    try {
      const response = await queryAI(
        {
          message: normalizedMessage,
          conversationId: activeConversationIdRef.current || undefined,
        },
        user
      );

      const answer = String(response.data?.answer || "").trim();
      const returnedConvId = response.data?.conversationId;

      // Update conversationId if new
      if (
        returnedConvId &&
        returnedConvId !== activeConversationIdRef.current
      ) {
        updateActiveConversationId(returnedConvId);
        // Refresh sidebar list silently
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
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errMsg = getErrorMessage(err);
      setError(errMsg);

      const errorMessage: ChatMessage = {
        id: generateMessageId(),
        role: "assistant",
        content: `Sorry, I could not process that request. ${errMsg}`,
        createdAt: new Date(),
        isError: true,
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      focusInput();
    }
  };

  // ── Derived ──
  const hasMessages = messages.length > 0;
  const isInputDisabled = isLoading || isLoadingHistory;

  // Auto-close sidebar on mobile after session select
  const handleSelectConversationMobile = (conversationId: string) => {
    handleSelectConversation(conversationId);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setShowHistorySidebar(false);
    }
  };

  const handleNewChatMobile = () => {
    handleNewChat();
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setShowHistorySidebar(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="relative flex h-[calc(100vh-80px)] sm:h-[calc(100vh-112px)] w-full overflow-hidden rounded-xl border border-border bg-surface shadow-sm">

      {/* ── MOBILE BACKDROP OVERLAY ── */}
      {showHistorySidebar && (
        <div
          onClick={() => setShowHistorySidebar(false)}
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-xs md:hidden"
        />
      )}

      {/* ── HISTORY SIDEBAR (Responsive Mobile Drawer / Desktop Inline) ── */}
      <div
        className={`fixed inset-y-0 left-0 z-30 flex flex-col border-r border-border bg-white dark:bg-[#0F172A] transition-all duration-300 md:relative md:z-auto ${
          showHistorySidebar
            ? "w-72 max-w-[80vw] md:w-64 shrink-0 translate-x-0"
            : "-translate-x-full md:translate-x-0 md:w-0 md:overflow-hidden md:border-none"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex h-12 sm:h-14 shrink-0 items-center justify-between border-b border-border px-3.5 sm:px-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-text-primary">
            <History size={16} className="text-primary" />
            <span>Chat Sessions</span>
          </div>

          <div className="flex items-center gap-1">
            {/* Refresh button */}
            <button
              type="button"
              onClick={() => loadConversations(false)}
              disabled={isRefreshingConversations}
              title="Refresh sessions"
              className="rounded-lg p-1.5 text-text-secondary transition
                hover:bg-surface hover:text-text-primary disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={isRefreshingConversations ? "animate-spin" : ""}
              />
            </button>

            {/* New chat button */}
            <button
              type="button"
              onClick={handleNewChatMobile}
              title="Start New Chat"
              className="rounded-lg p-1.5 text-primary transition hover:bg-primary-light"
            >
              <Plus size={17} />
            </button>
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">

          {/* New Conversation button */}
          <button
            type="button"
            onClick={handleNewChatMobile}
            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold transition ${
              !activeConversationId
                ? "bg-primary text-white shadow-sm"
                : "text-text-secondary hover:bg-surface hover:text-text-primary"
            }`}
          >
            <Plus size={15} />
            <span>New Conversation</span>
          </button>

          <div className="my-2 border-t border-border/60" />

          {/* Conversation list */}
          {isRefreshingConversations ? (
            <div className="flex items-center justify-center py-6 gap-2 text-xs text-text-muted">
              <Loader2 size={14} className="animate-spin text-primary" />
              <span>Loading...</span>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
              <MessageSquare size={28} className="text-text-muted opacity-40" />
              <p className="text-xs text-text-muted">No past sessions found.</p>
              <p className="text-[11px] text-text-muted opacity-70">
                Start a new conversation!
              </p>
            </div>
          ) : (
            conversations.map((conv) => {
              const cid = conv.conversationId;
              const active = cid === activeConversationId;
              return (
                <button
                  key={cid}
                  type="button"
                  onClick={() => handleSelectConversationMobile(cid)}
                  className={`flex w-full flex-col gap-0.5 rounded-lg px-3 py-2.5 text-left transition ${
                    active
                      ? "bg-primary-light text-primary font-semibold shadow-sm border border-primary/20"
                      : "text-text-secondary hover:bg-surface hover:text-text-primary"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare
                      size={13}
                      className={`shrink-0 ${active ? "text-primary" : "text-text-muted"}`}
                    />
                    <span className="truncate text-xs">
                      {conv.title || "Untitled Session"}
                    </span>
                  </div>
                  <span className="pl-5 text-[10px] text-text-muted">
                    {formatSessionDate(conv.lastMessageAt)}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="shrink-0 border-t border-border px-4 py-2.5">
          <p className="text-[10px] text-text-muted text-center">
            {conversations.length} session
            {conversations.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* ── MAIN CHAT AREA ── */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">

        {/* ── Top Header ── */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-3 sm:px-4 py-2.5 sm:py-3 bg-surface">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">

            {/* Sidebar toggle */}
            <button
              type="button"
              onClick={() => setShowHistorySidebar(!showHistorySidebar)}
              className="rounded-lg border border-border p-1.5 text-text-secondary transition
                hover:bg-surface-secondary hover:text-text-primary shrink-0"
              title={showHistorySidebar ? "Hide Sessions" : "Show Sessions"}
            >
              {showHistorySidebar ? (
                <ChevronLeft size={17} />
              ) : (
                <ChevronRight size={17} />
              )}
            </button>

            {/* Bot icon + title */}
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary shadow-sm">
              <Bot size={18} className="sm:hidden" />
              <Bot size={20} className="hidden sm:block" />
            </div>

            <div className="min-w-0">
              <h1 className="font-bold text-text-primary text-xs sm:text-base leading-tight truncate">
                ERP AI Assistant
              </h1>
              <p className="text-[10px] sm:text-[11px] text-text-muted leading-tight truncate">
                {activeConversationId
                  ? `Session: ${activeConversationId.slice(0, 12)}...`
                  : "Ask questions about ERP data & reports."}
              </p>
            </div>
          </div>

          {/* Header actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {hasMessages && (
              <button
                type="button"
                onClick={handleClearMessages}
                title="Clear current messages"
                className="flex items-center gap-1.5 rounded-lg border border-border px-2 sm:px-2.5 py-1.5
                  text-[11px] font-semibold text-text-secondary transition
                  hover:border-[#FECACA] hover:bg-[#FEF2F2] hover:text-[#B91C1C]
                  dark:hover:border-red-900/40 dark:hover:bg-red-950/20 dark:hover:text-red-400"
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
             
            >
              <Plus size={14} className="sm:mr-1" />
              <span className="hidden sm:inline">New Chat</span>
            </Button>
          </div>
        </div>

        {/* ── Messages Feed ── */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5">
          {isLoadingHistory ? (
            <div className="flex h-full items-center justify-center gap-3 text-xs sm:text-sm text-text-muted">
              <Loader2 size={20} className="animate-spin text-primary" />
              <span>Loading conversation history...</span>
            </div>
          ) : !hasMessages ? (
            <EmptyState onSuggestionClick={handleSuggestionClick} />
          ) : (
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 sm:gap-4">

              {/* Date separator for first message */}
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 border-t border-border" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted px-2">
                  {messages[0]?.createdAt.toLocaleDateString([], {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </span>
                <div className="flex-1 border-t border-border" />
              </div>

              {/* Messages */}
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex justify-start gap-2.5 sm:gap-3">
                  <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary shadow-sm">
                    <Bot size={16} />
                  </div>
                  <div className="flex items-center rounded-2xl rounded-bl-md border border-border bg-background px-3.5 py-2.5 sm:px-4 sm:py-3">
                    <TypingDots />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div className="shrink-0 flex items-center justify-between gap-3
            border-t border-[#FECACA] bg-[#FEF2F2] px-3 sm:px-4 py-2
            dark:border-red-900/50 dark:bg-red-950/20">
            <p className="text-[11px] sm:text-xs text-[#B91C1C] dark:text-red-400 flex-1 min-w-0 truncate">
              ⚠️ {error}
            </p>
            <button
              type="button"
              onClick={() => setError(null)}
              className="shrink-0 text-[#B91C1C] dark:text-red-400 hover:opacity-70 text-sm font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* ── Input Form ── */}
        <form
          onSubmit={sendMessage}
          className="shrink-0 border-t border-border bg-surface p-2.5 sm:p-4"
        >
          <div className="mx-auto flex w-full max-w-4xl items-end gap-2 sm:gap-3">

            {/* Input wrapper */}
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (error) setError(null);
                }}
                onKeyDown={(e) => {
                  // Ctrl+Enter or Cmd+Enter to send
                  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                    e.preventDefault();
                    const form = e.currentTarget.closest("form");
                    if (form)
                      form.dispatchEvent(
                        new Event("submit", {
                          cancelable: true,
                          bubbles: true,
                        })
                      );
                  }
                }}
                placeholder="Ask your ERP question..."
                disabled={isInputDisabled}
                autoComplete="off"
                className="pr-10 text-xs sm:text-sm"
              />
              {/* Character count hint */}
              {message.length > 200 && (
                <span className="absolute right-3 bottom-2 text-[10px] text-text-muted pointer-events-none">
                  {message.length}
                </span>
              )}
            </div>

            {/* Send button */}
            <Button
              type="submit"
              size="icon"
              variant="save"
              aria-label="Send message"
              disabled={isInputDisabled || !message.trim()}
              className="shrink-0 h-9 w-9 sm:h-10 sm:w-10"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </Button>
          </div>

          {/* Footer hint */}
          <p className="mx-auto mt-1.5 sm:mt-2 w-full max-w-4xl text-center text-[10px] sm:text-[11px] text-text-muted">
            AI can make mistakes. Verify important ERP and financial info.{" "}
           
          </p>
        </form>
      </div>
    </div>
  );
}