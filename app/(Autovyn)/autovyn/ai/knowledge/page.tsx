"use client";

import { useState } from "react";
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

interface APIResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
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
      return "Document endpoint not found.";
    if (axiosError.code === "ERR_NETWORK")
      return "Unable to connect to the AI server.";
    return axiosError.message || "Request failed.";
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong while processing your request.";
};

// ============================================================
// API SERVICES
// ============================================================
const createManualKnowledge = async (
  payload: ManualKnowledgePayload,
  user?: any
): Promise<
  APIResponse<{ documentId: number; status: string; replaced?: boolean }>
> => {
  const response = await axios.post<APIResponse>(
    `${BASE_URL}/ai/knowledge/manual`,
    payload,
    { headers: buildAIHeaders(user), timeout: 60000 }
  );
  return response.data;
};

const processKnowledgeDocument = async (
  documentId: number,
  user?: any
): Promise<
  APIResponse<{ documentId: number; status: string; chunkCount?: number }>
> => {
  const response = await axios.post<APIResponse>(
    `${BASE_URL}/ai/knowledge/documents/${documentId}/process`,
    { force: true },
    { headers: buildAIHeaders(user), timeout: 60000 }
  );
  return response.data;
};

const getKnowledgeStatus = async (
  documentId: number,
  user?: any
): Promise<
  APIResponse<{
    documentId: number;
    status: string;
    processedAt?: string | null;
    chunkCount?: number;
  }>
> => {
  const response = await axios.get<APIResponse>(
    `${BASE_URL}/ai/knowledge/documents/${documentId}/status`,
    { headers: buildAIHeaders(user) }
  );
  return response.data;
};

const deactivateKnowledge = async (
  documentId: number,
  user?: any
): Promise<APIResponse> => {
  const response = await axios.patch<APIResponse>(
    `${BASE_URL}/ai/knowledge/documents/${documentId}/deactivate`,
    { hardDelete: false },
    { headers: buildAIHeaders(user) }
  );
  return response.data;
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
      <label className="flex items-center gap-1.5 text-lg font-semibold uppercase tracking-widest text-[#6B7280]">
        {icon && <span className="text-[#6366F1]">{icon}</span>}
        {label}
        {required && (
          <span className="ml-0.5 text-[#EF4444]">*</span>
        )}
      </label>
      {children}
      {hint && (
        <p className="flex items-center gap-1 text-lg text-[#9CA3AF]">
          <Info size={10} />
          {hint}
        </p>
      )}
    </div>
  );
}

type BadgeVariant = "blue" | "green" | "purple" | "orange" | "indigo";

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
  };
  const dotColors: Record<BadgeVariant, string> = {
    blue:   "bg-[#3B82F6]",
    green:  "bg-[#22C55E]",
    purple: "bg-[#A855F7]",
    orange: "bg-[#F97316]",
    indigo: "bg-[#6366F1]",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-lg font-semibold ${variants[color]}`}
    >
      {dot && (
        <span className={`h-1.5 w-1.5 rounded-full ${dotColors[color]}`} />
      )}
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
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // ── Handlers ──
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.sourceName.trim() ||
      !form.sourceReference.trim() ||
      !form.title.trim()
    ) {
      setStatusMessage({
        type: "error",
        text: "Please fill in all required fields (Title, Source Name, Source Reference).",
      });
      return;
    }
    setLoadingAction("submit");
    setStatusMessage(null);
    try {
      const res = await createManualKnowledge(form, user);
      const docId = res.data?.documentId;
      setStatusMessage({
        type: "success",
        text: `Knowledge document registered successfully! ${
          docId ? `Document ID: ${docId}` : ""
        } — ${res.message || "Live columns auto-enriched."}`,
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
      setStatusMessage({
        type: "error",
        text: "Please enter a valid numeric document ID.",
      });
      return;
    }
    setLoadingAction("process");
    setStatusMessage(null);
    try {
      const res = await processKnowledgeDocument(id, user);
      setStatusMessage({
        type: "success",
        text: `Document #${id} indexed successfully! Status: ${
          res.data?.status || "SUCCESS"
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
      setStatusMessage({
        type: "error",
        text: "Please enter a valid numeric document ID.",
      });
      return;
    }
    setLoadingAction("status");
    setStatusMessage(null);
    try {
      const res = await getKnowledgeStatus(id, user);
      const st = res.data;
      setStatusMessage({
        type: "success",
        text: `Document #${id} — Status: ${st?.status || "UNKNOWN"} | Chunks: ${
          st?.chunkCount ?? 0
        } | Processed: ${
          st?.processedAt
            ? new Date(st.processedAt).toLocaleString()
            : "Not yet processed"
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
      setStatusMessage({
        type: "error",
        text: "Please enter a valid numeric document ID.",
      });
      return;
    }
    setLoadingAction("deactivate");
    setStatusMessage(null);
    try {
      const res = await deactivateKnowledge(id, user);
      setStatusMessage({
        type: "success",
        text: `Document #${id} deactivated successfully. ${res.message || ""}`,
      });
    } catch (err) {
      setStatusMessage({ type: "error", text: getErrorMessage(err) });
    } finally {
      setLoadingAction(null);
    }
  };

  const isLoading = loadingAction !== null;

  return (
    <div className="mx-auto max-w-8xl space-y-5 p-3 sm:p-5">

      {/* ══════════════════════════════════════════
          PAGE HEADER
      ══════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-2xl border border-[#334155] bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#1E3A5F] shadow-md">
        {/* Decorative orbs */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#6366F1]/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 left-1/4 h-40 w-40 rounded-full bg-[#8B5CF6]/10 blur-2xl" />
        <div className="pointer-events-none absolute bottom-0 right-1/3 h-32 w-32 rounded-full bg-[#3B82F6]/10 blur-2xl" />

        <div className="relative flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          {/* Left */}
          <div className="flex items-center gap-3.5">
           

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] shadow-[0_4px_20px_rgba(99,102,241,0.4)]">
              <Database size={22} className="text-[#FFFFFF]" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-[#F8FAFC] sm:text-xl">
                AI Knowledge Base
              </h1>
              <p className="mt-0.5 text-lg text-[#94A3B8]">
                Register ERP schemas, configure RAG indexing &amp; manage
                vector knowledge
              </p>
            </div>
          </div>

          {/* Right: Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FFFFFF]/10 bg-[#FFFFFF]/5 px-3 py-1 text-lg font-semibold text-[#CBD5E1] shadow-[0_0_12px_rgba(99,102,241,0.3)] backdrop-blur-sm">
              <Sparkles size={12} className="text-[#A5B4FC]" />
              Auto-Enrich
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FFFFFF]/10 bg-[#FFFFFF]/5 px-3 py-1 text-lg font-semibold text-[#CBD5E1] shadow-[0_0_12px_rgba(139,92,246,0.3)] backdrop-blur-sm">
              <Cpu size={12} className="text-[#C4B5FD]" />
              Qdrant Vector
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FFFFFF]/10 bg-[#FFFFFF]/5 px-3 py-1 text-lg font-semibold text-[#CBD5E1] shadow-[0_0_12px_rgba(245,158,11,0.2)] backdrop-blur-sm">
              <Zap size={12} className="text-[#FCD34D]" />
              Semantic RAG
            </span>
             <button
              type="button"
              onClick={() => router.back()}
              className="flex h-10 items-center gap-2 rounded-xl border border-[#FFFFFF]/15 bg-[#FFFFFF]/10 px-3.5 text-lg font-bold text-[#F8FAFC] shadow-sm backdrop-blur-sm transition-all hover:bg-[#FFFFFF]/20 hover:border-[#FFFFFF]/30 active:scale-95 cursor-pointer"
              title="Go Back"
              aria-label="Go Back"
            >
              <ArrowLeft size={18} className="text-[#FFFFFF]" />
              <span>Back</span>
            </button>
          </div>
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
          <p className="flex-1 text-lg font-medium leading-5">
            {statusMessage.text}
          </p>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="shrink-0 rounded p-0.5 text-base font-bold leading-none opacity-60 transition-opacity hover:opacity-100"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════
          MAIN GRID
      ══════════════════════════════════════════ */}
      <div className="grid gap-5 lg:grid-cols-5">

        {/* ─────────────────────────────────────────
            CARD 1: REGISTER SCHEMA  (3/5 width)
        ───────────────────────────────────────── */}
        <div className="flex flex-col rounded-2xl border border-[#E5E7EB] bg-[#FFFFFF] shadow-sm lg:col-span-3">

          {/* Card Header */}
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

          {/* Form Body */}
          <form
            onSubmit={handleManualSubmit}
            className="flex flex-1 flex-col space-y-4 px-6 py-5"
          >
            {/* Row 1: Module + Doc Type */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Module Name"
                icon={<Server size={11} />}
                hint="ERP module this table belongs to"
              >
                <Input
                  value={form.moduleName}
                  onChange={(e) =>
                    setForm({ ...form, moduleName: e.target.value })
                  }
                  placeholder="HR, SALES, INVENTORY…"
                  className="h-10 w-full rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] px-3 text-lg text-[#111827] placeholder:text-[#9CA3AF] outline-none transition-all focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20"
                />
              </FormField>

              <FormField
                label="Document Type"
                icon={<FileText size={11} />}
              >
                <select
                  value={form.documentType}
                  onChange={(e) =>
                    setForm({ ...form, documentType: e.target.value })
                  }
                  className="h-10 w-full rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] px-3 text-lg text-[#111827] outline-none transition-all focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20"
                >
                  <option value="TABLE_SCHEMA">TABLE_SCHEMA</option>
                  <option value="VIEW">VIEW</option>
                  <option value="BUSINESS_RULE">BUSINESS_RULE</option>
                  <option value="STATUS_MAPPING">STATUS_MAPPING</option>
                  <option value="POLICY">POLICY</option>
                </select>
              </FormField>
            </div>

            {/* Row 2: Title */}
            <FormField
              label="Title"
              required
              icon={<Tag size={11} />}
              hint="Human-readable name shown in AI responses"
            >
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Employee Attendance Details"
                required
                className="h-10 w-full rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] px-3 text-lg text-[#111827] placeholder:text-[#9CA3AF] outline-none transition-all focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20"
              />
            </FormField>

            {/* Row 3: Source Name + Source Ref */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Source Name"
                required
                icon={<Database size={11} />}
                hint="Physical table name"
              >
                <Input
                  value={form.sourceName}
                  onChange={(e) =>
                    setForm({ ...form, sourceName: e.target.value })
                  }
                  placeholder="attendancetable"
                  required
                  className="h-10 w-full rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] px-3 text-lg text-[#111827] placeholder:text-[#9CA3AF] outline-none transition-all focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20"
                />
              </FormField>

              <FormField
                label="Source Reference"
                required
                icon={<Link2 size={11} />}
                hint="Fully qualified name"
              >
                <Input
                  value={form.sourceReference}
                  onChange={(e) =>
                    setForm({ ...form, sourceReference: e.target.value })
                  }
                  placeholder="dbo.attendancetable"
                  required
                  className="h-10 w-full rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] px-3 text-lg text-[#111827] placeholder:text-[#9CA3AF] outline-none transition-all focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20"
                />
              </FormField>
            </div>

            {/* Row 4: Join Key + Category */}
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
                  className="h-10 w-full rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] px-3 text-lg text-[#111827] placeholder:text-[#9CA3AF] outline-none transition-all focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20"
                />
              </FormField>

              <FormField label="Category" icon={<Tag size={11} />}>
                <Input
                  value={form.metadata?.category || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      metadata: {
                        ...form.metadata,
                        category: e.target.value,
                      },
                    })
                  }
                  placeholder="Employee_master"
                  className="h-10 w-full rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] px-3 text-lg text-[#111827] placeholder:text-[#9CA3AF] outline-none transition-all focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20"
                />
              </FormField>
            </div>

            {/* Row 5: Description */}
            <FormField
              label="Purpose / Description"
              icon={<FileText size={11} />}
              hint="AI uses this context to understand what data lives in this table"
            >
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={4}
                className="w-full resize-none rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] p-3 text-lg text-[#111827] placeholder:text-[#9CA3AF] outline-none transition-all focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20"
                placeholder={`Table: dbo.attendancetable\nPurpose: Stores daily employee attendance check-in/out records, linked to payroll.\nKey Columns: Emp_Code, Date, In_Time, Out_Time, Status`}
              />
            </FormField>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loadingAction === "submit"}
              className={`mt-auto flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-lg font-semibold text-[#FFFFFF] shadow-[0_4px_14px_rgba(99,102,241,0.4)] transition-all disabled:cursor-not-allowed disabled:opacity-70 ${
                loadingAction === "submit"
                  ? "bg-[#A5B4FC]"
                  : "bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:shadow-[0_6px_20px_rgba(99,102,241,0.5)] hover:opacity-95 active:scale-[0.99]"
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

        {/* ─────────────────────────────────────────
            CARD 2: PROCESS & MANAGE  (2/5 width)
        ───────────────────────────────────────── */}
        <div className="flex flex-col gap-5 lg:col-span-2">

          {/* ── Document Actions Card ── */}
          <div className="flex flex-col rounded-2xl border border-[#E5E7EB] bg-[#FFFFFF] shadow-sm">

            {/* Card Header */}
            <div className="flex items-center gap-3 border-b border-[#F3F4F6] px-5 py-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF2FF]">
                <FileCheck size={16} className="text-[#6366F1]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#111827]">
                  RAG Document Manager
                </h2>
                <p className="text-lg text-[#6B7280]">
                  Index, inspect &amp; deactivate vectors
                </p>
              </div>
            </div>

            <div className="space-y-4 px-5 py-5">
              {/* Document ID Input */}
              <FormField
                label="Document ID"
                icon={<Hash size={11} />}
                hint="Numeric ID returned after registration"
              >
                <Input
                  value={documentIdInput}
                  onChange={(e) => setDocumentIdInput(e.target.value)}
                  placeholder="e.g. 101"
                  type="number"
                  min={1}
                  className="h-10 w-full rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] px-3 text-lg text-[#111827] placeholder:text-[#9CA3AF] outline-none transition-all focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20"
                />
              </FormField>

              {/* Divider */}
              <div className="flex items-center gap-2 py-1">
                <div className="h-px flex-1 bg-[#F3F4F6]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#D1D5DB]">
                  Actions
                </span>
                <div className="h-px flex-1 bg-[#F3F4F6]" />
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5">

                {/* Index / Process */}
                <button
                  type="button"
                  onClick={handleProcessDocument}
                  disabled={isLoading || !documentIdInput}
                  className="group flex w-full items-center gap-3 rounded-xl border border-transparent bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-4 py-3 text-left shadow-[0_2px_10px_rgba(99,102,241,0.3)] transition-all disabled:cursor-not-allowed disabled:opacity-50 hover:shadow-[0_4px_16px_rgba(99,102,241,0.4)] hover:opacity-95 active:scale-[0.99]"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FFFFFF]/20">
                    {loadingAction === "process" ? (
                      <Loader2 size={14} className="animate-spin text-[#FFFFFF]" />
                    ) : (
                      <RefreshCw size={14} className="text-[#FFFFFF]" />
                    )}
                  </span>
                  <span className="flex flex-col">
                    <span className="text-lg font-bold text-[#FFFFFF]">
                      {loadingAction === "process" ? "Indexing…" : "Index / Process"}
                    </span>
                    <span className="text-[10px] text-[#FFFFFF]/70">
                      Embed into Qdrant vector store
                    </span>
                  </span>
                </button>

                {/* Check Status */}
                <button
                  type="button"
                  onClick={handleCheckStatus}
                  disabled={isLoading || !documentIdInput}
                  className="group flex w-full items-center gap-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50 hover:border-[#6366F1]/30 hover:bg-[#F5F3FF] hover:shadow-sm active:scale-[0.99]"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#EEF2FF]">
                    {loadingAction === "status" ? (
                      <Loader2 size={14} className="animate-spin text-[#6366F1]" />
                    ) : (
                      <FileCheck size={14} className="text-[#6366F1]" />
                    )}
                  </span>
                  <span className="flex flex-col">
                    <span className="text-lg font-bold text-[#111827]">
                      {loadingAction === "status" ? "Checking…" : "Check Status"}
                    </span>
                    <span className="text-[10px] text-[#6B7280]">
                      View chunk count &amp; process time
                    </span>
                  </span>
                </button>

                {/* Deactivate */}
                <button
                  type="button"
                  onClick={handleDeactivate}
                  disabled={isLoading || !documentIdInput}
                  className="group flex w-full items-center gap-3 rounded-xl border border-[#FECACA] bg-[#FFF5F5] px-4 py-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50 hover:border-[#FCA5A5] hover:bg-[#FEE2E2] hover:shadow-sm active:scale-[0.99]"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FEE2E2]">
                    {loadingAction === "deactivate" ? (
                      <Loader2 size={14} className="animate-spin text-[#EF4444]" />
                    ) : (
                      <Trash2 size={14} className="text-[#EF4444]" />
                    )}
                  </span>
                  <span className="flex flex-col">
                    <span className="text-lg font-bold text-[#991B1B]">
                      {loadingAction === "deactivate"
                        ? "Deactivating…"
                        : "Deactivate Document"}
                    </span>
                    <span className="text-[10px] text-[#EF4444]">
                      Soft-delete from vector store
                    </span>
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* ── How It Works Card ── */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-[#FFFFFF] shadow-sm">

            {/* Header */}
            <div className="flex items-center gap-2.5 border-b border-[#F3F4F6] px-5 py-3.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#EEF2FF]">
                <BookOpen size={13} className="text-[#6366F1]" />
              </div>
              <h3 className="text-lg font-bold text-[#111827]">
                How It Works
              </h3>
            </div>

            {/* Steps */}
            <div className="px-5 py-4">
              {[
                {
                  iconClass: "text-[#3B82F6]",
                  iconBg: "bg-[#EFF6FF] border-[#BFDBFE]",
                  Icon: PlusCircle,
                  badge: "Register" as BadgeVariant,
                  color: "blue" as BadgeVariant,
                  text: "Auto-inspects live MSSQL columns and enriches table metadata instantly.",
                  connector: true,
                },
                {
                  iconClass: "text-[#A855F7]",
                  iconBg: "bg-[#FAF5FF] border-[#E9D5FF]",
                  Icon: RefreshCw,
                  badge: "Index" as BadgeVariant,
                  color: "purple" as BadgeVariant,
                  text: "Embeds schema descriptions into Qdrant for semantic RAG retrieval.",
                  connector: true,
                },
                {
                  iconClass: "text-[#22C55E]",
                  iconBg: "bg-[#F0FDF4] border-[#BBF7D0]",
                  Icon: FileCheck,
                  badge: "Status" as BadgeVariant,
                  color: "green" as BadgeVariant,
                  text: "Shows real-time chunk count and last processed timestamp.",
                  connector: true,
                },
                {
                  iconClass: "text-[#F97316]",
                  iconBg: "bg-[#FFF7ED] border-[#FED7AA]",
                  Icon: Trash2,
                  badge: "Deactivate" as BadgeVariant,
                  color: "orange" as BadgeVariant,
                  text: "Soft-deletes vectors so AI stops querying deprecated tables.",
                  connector: false,
                },
              ].map((item) => (
                <div key={item.badge} className="relative flex gap-3">
                  {/* Timeline connector */}
                  {item.connector && (
                    <div className="absolute left-[13px] top-7 h-full w-px bg-[#F3F4F6]" />
                  )}
                  {/* Icon */}
                  <span
                    className={`relative z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${item.iconBg}`}
                  >
                    <item.Icon size={13} className={item.iconClass} />
                  </span>
                  {/* Content */}
                  <div className="min-w-0 pb-4">
                    <div className="mb-1">
                      <StatusBadge label={item.badge} color={item.color} />
                    </div>
                    <p className="text-lg leading-[1.5] text-[#6B7280]">
                      {item.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}