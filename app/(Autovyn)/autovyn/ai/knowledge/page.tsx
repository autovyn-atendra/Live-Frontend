"use client";

import { useState } from "react";
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
  Layers,
  BookOpen,
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
): Promise<APIResponse<{ documentId: number; status: string; replaced?: boolean }>> => {
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
): Promise<APIResponse<{ documentId: number; status: string; chunkCount?: number }>> => {
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
): Promise<APIResponse<{ documentId: number; status: string; processedAt?: string | null; chunkCount?: number }>> => {
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
// MAIN PAGE COMPONENT
// ============================================================
export default function KnowledgePage() {
  const user = useCurrentUser() as any;

  // Form State
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
      setStatusMessage({ type: "error", text: "Please enter a valid numeric document ID." });
      return;
    }

    setLoadingAction("process");
    setStatusMessage(null);

    try {
      const res = await processKnowledgeDocument(id, user);
      setStatusMessage({
        type: "success",
        text: `Document #${id} indexed successfully into vector store! Status: ${res.data?.status || "SUCCESS"}`,
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
      const res = await getKnowledgeStatus(id, user);
      const st = res.data;
      setStatusMessage({
        type: "success",
        text: `Document #${id} Status: ${st?.status || "UNKNOWN"} | Chunks: ${st?.chunkCount ?? 0} | Processed: ${
          st?.processedAt ? new Date(st.processedAt).toLocaleString() : "N/A"
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
      const res = await deactivateKnowledge(id, user);
      setStatusMessage({
        type: "success",
        text: `Document #${id} deactivated successfully! ${res.message || ""}`,
      });
    } catch (err) {
      setStatusMessage({ type: "error", text: getErrorMessage(err) });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-2 sm:p-4">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light text-primary shadow-sm">
            <Database size={22} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary sm:text-xl">
              AI Knowledge Base Management
            </h1>
            <p className="text-xs text-text-muted">
              Register ERP table schemas, configure RAG indexing, and manage vector knowledge.
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-secondary px-3 py-1 text-xs font-semibold text-text-secondary">
            <Sparkles size={14} className="text-primary" />
            Auto-Enrich Enabled
          </span>
        </div>
      </div>

      {/* ── Status Alert Banner ── */}
      {statusMessage && (
        <div
          className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-xs font-medium shadow-sm transition-all ${
            statusMessage.type === "success"
              ? "border-[#BBF7D0] bg-[#F0FDF4] text-[#166534] dark:border-green-900/40 dark:bg-green-950/20 dark:text-green-400"
              : "border-[#FECACA] bg-[#FEF2F2] text-[#991B1B] dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusMessage.type === "success" ? (
              <CheckCircle size={17} className="shrink-0 text-[#16A34A]" />
            ) : (
              <AlertCircle size={17} className="shrink-0 text-[#DC2626]" />
            )}
            <span className="leading-5">{statusMessage.text}</span>
          </div>

          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="shrink-0 font-bold hover:opacity-75 text-sm"
          >
            ×
          </button>
        </div>
      )}

      {/* ── Main Grid Layout ── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* ── CARD 1: Register Schema & Rules ── */}
        <div className="flex flex-col rounded-xl border border-border bg-surface shadow-sm">
          {/* Card Header */}
          <div className="flex items-center gap-2.5 border-b border-border px-6 py-4">
            <PlusCircle size={19} className="text-primary" />
            <div>
              <h2 className="text-base font-bold text-text-primary">
                Register Table Schema / Business Rule
              </h2>
              <p className="text-[11px] text-text-muted">
                Add ERP table descriptions for AI query discovery.
              </p>
            </div>
          </div>

          {/* Form Body */}
          <form onSubmit={handleManualSubmit} className="flex-1 space-y-4 px-6 py-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-text-secondary">
                  Module Name
                </label>
                <Input
                  value={form.moduleName}
                  onChange={(e) => setForm({ ...form, moduleName: e.target.value })}
                  placeholder="e.g. HR, SALES, INVENTORY"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-text-secondary">
                  Document Type
                </label>
                <select
                  value={form.documentType}
                  onChange={(e) => setForm({ ...form, documentType: e.target.value })}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-xs text-text-primary focus:border-primary focus:outline-none"
                >
                  <option value="TABLE_SCHEMA">TABLE_SCHEMA</option>
                  <option value="VIEW">VIEW</option>
                  <option value="BUSINESS_RULE">BUSINESS_RULE</option>
                  <option value="STATUS_MAPPING">STATUS_MAPPING</option>
                  <option value="POLICY">POLICY</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-text-secondary">
                Title <span className="text-red-500">*</span>
              </label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Employee Attendance Details"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-text-secondary">
                  Source Name (Table) <span className="text-red-500">*</span>
                </label>
                <Input
                  value={form.sourceName}
                  onChange={(e) => setForm({ ...form, sourceName: e.target.value })}
                  placeholder="e.g. attendancetable"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-text-secondary">
                  Source Reference <span className="text-red-500">*</span>
                </label>
                <Input
                  value={form.sourceReference}
                  onChange={(e) => setForm({ ...form, sourceReference: e.target.value })}
                  placeholder="e.g. dbo.attendancetable"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-text-secondary">
                  Join Key
                </label>
                <Input
                  value={form.metadata?.joinKey || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      metadata: { ...form.metadata, joinKey: e.target.value },
                    })
                  }
                  placeholder="e.g. Emp_Code"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-text-secondary">
                  Category
                </label>
                <Input
                  value={form.metadata?.category || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      metadata: { ...form.metadata, category: e.target.value },
                    })
                  }
                  placeholder="e.g. Employee_master"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-text-secondary">
                Purpose / Description
              </label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-border bg-background p-3 text-xs text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
                placeholder="Table: dbo.attendancetable&#10;Purpose: Manage employee attendance details..."
              />
            </div>

            <Button
              type="submit"
              variant="save"
              disabled={loadingAction === "submit"}
              className="w-full"
            >
              {loadingAction === "submit" ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Registering Schema...
                </>
              ) : (
                <>
                  <PlusCircle size={16} className="mr-2" />
                  Register & Auto-Enrich Schema
                </>
              )}
            </Button>
          </form>
        </div>

        {/* ── CARD 2: Process & Manage RAG Documents ── */}
        <div className="flex flex-col rounded-xl border border-border bg-surface shadow-sm">
          {/* Card Header */}
          <div className="flex items-center gap-2.5 border-b border-border px-6 py-4">
            <FileCheck size={19} className="text-primary" />
            <div>
              <h2 className="text-base font-bold text-text-primary">
                Process & Manage RAG Documents
              </h2>
              <p className="text-[11px] text-text-muted">
                Trigger vector indexing, check status, or deactivate points in Qdrant.
              </p>
            </div>
          </div>

          <div className="flex-1 space-y-6 px-6 py-5">
            <div>
              <label className="mb-1 block text-xs font-semibold text-text-secondary">
                Document ID
              </label>
              <Input
                value={documentIdInput}
                onChange={(e) => setDocumentIdInput(e.target.value)}
                placeholder="Enter Document ID (e.g. 101)"
                type="number"
              />
              <p className="mt-1 text-[11px] text-text-muted">
                Enter the numeric ID returned during knowledge registration.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {/* Index / Process */}
              <Button
                type="button"
                onClick={handleProcessDocument}
                disabled={loadingAction !== null || !documentIdInput}
                className="w-full"
              >
                {loadingAction === "process" ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <RefreshCw size={15} className="mr-1.5" />
                )}
                Index/Process
              </Button>

              {/* Check Status */}
              <Button
                type="button"
                variant="outline"
                onClick={handleCheckStatus}
                disabled={loadingAction !== null || !documentIdInput}
                className="w-full"
              >
                {loadingAction === "status" ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <FileCheck size={15} className="mr-1.5" />
                )}
                Check Status
              </Button>

              {/* Deactivate */}
              <Button
                type="button"
                variant="ghost"
                onClick={handleDeactivate}
                disabled={loadingAction !== null || !documentIdInput}
                className="w-full border border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-950/20"
              >
                {loadingAction === "deactivate" ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Trash2 size={15} className="mr-1.5" />
                )}
                Deactivate
              </Button>
            </div>

            {/* Info Box */}
            <div className="rounded-xl border border-border bg-surface-secondary p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
                <BookOpen size={15} className="text-primary" />
                <span>Knowledge Management Guidance</span>
              </div>
              <ul className="space-y-1 text-[11px] leading-5 text-text-muted list-disc pl-4">
                <li>
                  <strong className="text-text-secondary">Registering Schema:</strong> Enriches table metadata by auto-inspecting live columns in MSSQL.
                </li>
                <li>
                  <strong className="text-text-secondary">Indexing Document:</strong> Embeds table descriptions into vector storage for semantic retrieval.
                </li>
                <li>
                  <strong className="text-text-secondary">Deactivating:</strong> Deactivates points so the AI no longer queries deprecated tables.
                </li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}