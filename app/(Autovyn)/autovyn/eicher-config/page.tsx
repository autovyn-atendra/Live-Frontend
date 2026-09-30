"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Settings, PlusCircle, RefreshCw, CheckCircle, AlertCircle,
  Loader2, ArrowLeft, Database, User, Lock, Hash, Eye, EyeOff,
  Search, X, ShieldCheck, Building2, Info, Pencil, Power, PowerOff,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import axios, { AxiosError } from "axios";

// ============================================================
// CONSTANTS & TYPES
// ============================================================
const BASE_URL = process.env.NEXT_PUBLIC_URL;

interface EicherConfig {
  UTD: number;
  DBM_Code: string | null;
  User_Name: string;
  Godw_Name: string | null;
  User_Pass: string | null;
  Godw_Code: number | null;
  Export_Type: number | null;
  Created_By: number | null;
  Created_At: string;
}

interface GodownOption {
  Godw_Code: number;
  Godw_Name: string;
}

interface CreateEicherPayload {
  DBM_Code?: string;
  User_Name: string;
  User_Pass?: string;
  Godw_Code?: number | null;
  Created_By?: number | null;
}

interface UpdateEicherPayload {
  DBM_Code?: string;
  User_Name?: string;
  User_Pass?: string;
  Godw_Code?: number | null;
  Export_Type?: number | null;
}

interface APIResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  total?: number;
}

interface APIErrorResponse {
  success?: boolean;
  message?: string;
  error?: string;
  Message?: string;
}

// ============================================================
// UTILS
// ============================================================
const buildHeaders = (user?: any) => {
  const compcode = user?.Comp_Code || user?.compcode || user?.CompCode || user?.branch || "";
  const token = user?.token || user?.email || "";
  const authHeader = token
    ? String(token).startsWith("Bearer ") ? String(token) : `Bearer ${token}`
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
    const data = axiosError.response?.data as any;
    if (data?.Message) return data.Message;
    if (data?.message) return data.message;
    if (data?.error) return data.error;
    if (axiosError.response?.status === 401) return "Session expired. Please log in again.";
    if (axiosError.response?.status === 403) return "You are not authorized.";
    if (axiosError.response?.status === 404) return "Endpoint not found.";
    if (axiosError.response?.status === 409) return "Config already exists.";
    if (axiosError.code === "ERR_NETWORK") return "Unable to connect to server.";
    return axiosError.message || "Request failed.";
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
};

const isActive = (cfg: EicherConfig) =>
  cfg.Export_Type === null || cfg.Export_Type < 33;

// ============================================================
// API SERVICES
// ============================================================
const apiCreateEicherConfig = async (
  payload: CreateEicherPayload, user?: any
): Promise<APIResponse<{ UTD: number }>> => {
  const res = await axios.post<APIResponse>(
    `${BASE_URL}/eicher/eicher-config/create`, payload,
    { headers: buildHeaders(user), timeout: 30000 }
  );
  return res.data;
};

const apiGetEicherConfigs = async (
  filters: { DBM_Code?: string; User_Name?: string; Godw_Code?: string },
  user?: any
): Promise<APIResponse<EicherConfig[]>> => {
  const params = new URLSearchParams();
  if (filters.DBM_Code) params.append("DBM_Code", filters.DBM_Code);
  if (filters.User_Name) params.append("User_Name", filters.User_Name);
  if (filters.Godw_Code) params.append("Godw_Code", filters.Godw_Code);
  const res = await axios.get<APIResponse>(
    `${BASE_URL}/eicher/eicher-config/list?${params.toString()}`,
    { headers: buildHeaders(user), timeout: 30000 }
  );
  return res.data;
};

const apiUpdateEicherConfig = async (
  UTD: number, payload: UpdateEicherPayload, user?: any
): Promise<APIResponse<EicherConfig>> => {
  const res = await axios.put<APIResponse>(
    `${BASE_URL}/eicher/config/${UTD}`, payload,
    { headers: buildHeaders(user), timeout: 30000 }
  );
  return res.data;
};

const apiToggleEicherConfig = async (
  UTD: number, status: "active" | "inactive", user?: any
): Promise<APIResponse> => {
  const res = await axios.patch<APIResponse>(
    `${BASE_URL}/eicher/config/status/${UTD}`,
    { status },
    { headers: buildHeaders(user), timeout: 30000 }
  );
  return res.data;
};

const apiGetGodowns = async (user?: any): Promise<GodownOption[]> => {
  const res = await axios.get<APIResponse<GodownOption[]>>(
    `${BASE_URL}/eicher/godown`,
    { headers: buildHeaders(user), timeout: 30000 }
  );
  return res.data?.data || [];
};

// ============================================================
// COLOR TOKENS
// ============================================================
// Light Mode
const C = {
  // Text
  textPrimary: "text-[#111827]",   // gray-900
  textSecondary: "text-[#6B7280]",   // gray-500
  textMuted: "text-[#9CA3AF]",   // gray-400
  textDisabled: "text-[#D1D5DB]",   // gray-300
  textWhite: "text-[#FFFFFF]",

  // Border
  border: "border-[#E5E7EB]", // gray-200
  borderLight: "border-[#F3F4F6]", // gray-100

  // Background
  bgWhite: "bg-[#FFFFFF]",
  bgLight: "bg-[#F9FAFB]",     // gray-50
  bgMuted: "bg-[#F3F4F6]",     // gray-100

  // Dark Mode Text
  dTextPrimary: "dark:text-[#F9FAFB]",  // gray-50
  dTextSecondary: "dark:text-[#9CA3AF]",  // gray-400
  dTextMuted: "dark:text-[#6B7280]",  // gray-500
  dTextDisabled: "dark:text-[#374151]",  // gray-700

  // Dark Mode Border
  dBorder: "dark:border-[#334155]",
  dBorderLight: "dark:border-[#1E293B]",

  // Dark Mode Background
  dBgWhite: "dark:bg-[#1E293B]",
  dBgLight: "dark:bg-[#0F172A]",
  dBgMuted: "dark:bg-[#1E293B]/50",
};

// ============================================================
// SUB COMPONENTS
// ============================================================

// ── FormField ──────────────────────────────────────────────
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
      <label className="flex items-center gap-1.5 text-lg font-semibold uppercase tracking-widest text-[#6B7280] dark:text-[#9CA3AF]">
        {icon && <span className="text-primary">{icon}</span>}
        {label}
        {required && <span className="ml-0.5 text-exit">*</span>}
      </label>
      {children}
      {hint && (
        <p className="flex items-center gap-1 text-lg text-[#9CA3AF] dark:text-[#6B7280]">
          <Info size={10} />
          {hint}
        </p>
      )}
    </div>
  );
}

// ── Status Alert ───────────────────────────────────────────
interface StatusAlertProps {
  type: "success" | "error";
  text: string;
  onDismiss: () => void;
}

function StatusAlert({ type, text, onDismiss }: StatusAlertProps) {
  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-sm ${type === "success"
        ? "border-[#BBF7D0] bg-[#F0FDF4] text-[#14532D] dark:border-[#166534] dark:bg-[#052E16] dark:text-[#86EFAC]"
        : "border-[#FECACA] bg-[#FEF2F2] text-[#7F1D1D] dark:border-[#991B1B] dark:bg-[#450A0A] dark:text-[#FCA5A5]"
      }`}>
      <div className="mt-0.5 shrink-0">
        {type === "success"
          ? <CheckCircle size={16} className="text-[#16A34A]" />
          : <AlertCircle size={16} className="text-exit" />
        }
      </div>
      <p className="flex-1 text-lg font-medium leading-5">{text}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded p-0.5 text-base font-bold leading-none opacity-60 transition-opacity hover:opacity-100"
      >
        ×
      </button>
    </div>
  );
}

// ── Godown Dropdown ────────────────────────────────────────
interface GodownSelectProps {
  value: number | null;
  onChange: (val: number | null) => void;
  godowns: GodownOption[];
  loading: boolean;
}

function GodownSelect({ value, onChange, godowns, loading }: GodownSelectProps) {
  return (
    <div className="relative">
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : null)}
        disabled={loading}
        className="h-10 w-full appearance-none rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] px-3 pr-8 text-lg text-[#111827] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-[#F9FAFB] disabled:text-[#9CA3AF] dark:border-[#334155] dark:bg-[#1E293B] dark:text-[#F9FAFB] dark:focus:border-primary dark:disabled:bg-[#0F172A] dark:disabled:text-[#6B7280]"
      >
        <option value="">
          {loading ? "Loading godowns…" : "-- Select Godown --"}
        </option>
        {godowns.map((g) => (
          <option key={g.Godw_Code} value={g.Godw_Code}>
            {g.Godw_Code} - {g.Godw_Name}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
        {loading
          ? <Loader2 size={14} className="animate-spin text-primary" />
          : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )
        }
      </div>
    </div>
  );
}

// ── Config Form ────────────────────────────────────────────
interface ConfigFormProps {
  form: { DBM_Code: string; User_Name: string; User_Pass: string; Godw_Code: number | null };
  onChange: (form: any) => void;
  showPass: boolean;
  onTogglePass: () => void;
  error: string | null;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  submitLabel: string;
  submitIcon: React.ReactNode;
  godowns: GodownOption[];
  godownLoading: boolean;
}

function ConfigForm({
  form, onChange, showPass, onTogglePass,
  error, loading, onSubmit, onClose,
  submitLabel, submitIcon, godowns, godownLoading,
}: ConfigFormProps) {

  const inputCls = [
    "h-10 w-full rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] px-3",
    "text-lg text-[#111827] placeholder:text-[#9CA3AF]",
    "outline-none transition-all",
    "focus:border-primary focus:ring-2 focus:ring-primary/20",
    "dark:border-[#334155] dark:bg-[#1E293B] dark:text-[#F9FAFB]",
    "dark:placeholder:text-[#6B7280] dark:focus:border-primary",
  ].join(" ");

  return (
    <form onSubmit={onSubmit} className="space-y-4 px-6 py-5">

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2.5 dark:border-[#991B1B] dark:bg-[#450A0A]">
          <AlertCircle size={14} className="mt-0.5 shrink-0 text-exit" />
          <p className="text-lg font-medium text-[#7F1D1D] dark:text-[#FCA5A5]">{error}</p>
        </div>
      )}

      {/* DBM Code */}
      <FormField label="DBM Code" icon={<Building2 size={11} />} hint="Dealer / Branch Management Code">
        <Input
          value={form.DBM_Code}
          onChange={(e) => onChange({ ...form, DBM_Code: e.target.value })}
          placeholder="e.g. 5040"
          maxLength={20}
          className={inputCls}
        />
      </FormField>

      {/* User Name */}
      <FormField label="User Name" required icon={<User size={11} />} hint="Eicher API login username">
        <Input
          value={form.User_Name}
          onChange={(e) => onChange({ ...form, User_Name: e.target.value })}
          placeholder="e.g. XIP_AVYN_API"
          maxLength={100}
          required
          className={inputCls}
        />
      </FormField>

      {/* Password */}
      <FormField label="Password" icon={<Lock size={11} />} hint="Eicher API login password">
        <div className="relative">
          <Input
            value={form.User_Pass}
            onChange={(e) => onChange({ ...form, User_Pass: e.target.value })}
            type={showPass ? "text" : "password"}
            placeholder="••••••••"
            maxLength={255}
            className={`${inputCls} pr-10`}
          />
          <button
            type="button"
            onClick={onTogglePass}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] transition-colors hover:text-[#6B7280] dark:hover:text-[#D1D5DB]"
            tabIndex={-1}
          >
            {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </FormField>

      {/* Godown Dropdown */}
      <FormField label="Godown (Branch)" required icon={<Hash size={11} />} hint="Select godown / warehouse">
        <GodownSelect
          value={form.Godw_Code}
          onChange={(val) => onChange({ ...form, Godw_Code: val })}
          godowns={godowns}
          loading={godownLoading}
        />
      </FormField>

      {/* Buttons */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="flex-1 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-2.5 text-lg font-semibold text-[#374151] transition-all hover:bg-[#F3F4F6] disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.99] dark:border-[#334155] dark:bg-[#1E293B] dark:text-[#F9FAFB] dark:hover:bg-[#0F172A]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || godownLoading}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-lg font-bold text-[#FFFFFF] shadow-md transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70 active:scale-[0.99]"
        >
          {loading
            ? <><Loader2 size={14} className="animate-spin" /> Processing…</>
            : <>{submitIcon} {submitLabel}</>
          }
        </button>
      </div>
    </form>
  );
}

// ── Modal Wrapper ──────────────────────────────────────────
interface ModalWrapperProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}

function ModalWrapper({ title, subtitle, icon, onClose, children }: ModalWrapperProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#000000]/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl rounded-2xl border border-[#E5E7EB] bg-[#FFFFFF] shadow-2xl dark:border-[#334155] dark:bg-[#1E293B]">
        {/* Header */}
        <div className="flex items-center justify-between rounded-t-2xl border-b border-[#F3F4F6] bg-header px-6 py-4 dark:border-[#1E293B]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-md">
              {icon}
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#FFFFFF]">{title}</h2>
              <p className="text-lg text-[#9CA3AF]">{subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#FFFFFF] transition-all hover:text-exit active:scale-95"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── useGodowns Hook ────────────────────────────────────────
function useGodowns(user: any) {
  const [godowns, setGodowns] = useState<GodownOption[]>([]);
  const [godownLoading, setGodownLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setGodownLoading(true);
      try {
        const data = await apiGetGodowns(user);
        setGodowns(data);
      } catch {
        // silent
      } finally {
        setGodownLoading(false);
      }
    };
    fetchData();
  }, [user]);

  return { godowns, godownLoading };
}

// ── Create Modal ───────────────────────────────────────────
interface CreateModalProps {
  onClose: () => void;
  onSuccess: (utd: number) => void;
  user: any;
}

function CreateModal({ onClose, onSuccess, user }: CreateModalProps) {
  const [form, setForm] = useState({ DBM_Code: "", User_Name: "", User_Pass: "", Godw_Code: null as number | null });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { godowns, godownLoading } = useGodowns(user);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.User_Name.trim()) { setError("User_Name is required."); return; }
    setLoading(true); setError(null);
    try {
      const payload: CreateEicherPayload = {
        User_Name: form.User_Name.trim(),
        DBM_Code: form.DBM_Code?.trim() || undefined,
        User_Pass: form.User_Pass?.trim() || undefined,
        Godw_Code: form.Godw_Code ?? null,
        Created_By: user?.id || user?.UTD || null,
      };
      const res = await apiCreateEicherConfig(payload, user);
      onSuccess(res.data.UTD);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper title="Create Eicher Config" subtitle="Add a new Eicher API configuration" icon={<PlusCircle size={18} className="text-[#FFFFFF]" />} onClose={onClose}>
      <ConfigForm form={form} onChange={setForm} showPass={showPass} onTogglePass={() => setShowPass(!showPass)} error={error} loading={loading} onSubmit={handleSubmit} onClose={onClose} submitLabel="Create Config" submitIcon={<PlusCircle size={14} />} godowns={godowns} godownLoading={godownLoading} />
    </ModalWrapper>
  );
}

// ── Update Modal ───────────────────────────────────────────
interface UpdateModalProps {
  config: EicherConfig;
  onClose: () => void;
  onSuccess: () => void;
  user: any;
}

function UpdateModal({ config, onClose, onSuccess, user }: UpdateModalProps) {
  const [form, setForm] = useState({
    DBM_Code: config.DBM_Code || "",
    User_Name: config.User_Name || "",
    User_Pass: config.User_Pass || "",
    Godw_Code: config.Godw_Code ?? null,
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { godowns, godownLoading } = useGodowns(user);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.User_Name.trim()) { setError("User_Name is required."); return; }
    setLoading(true); setError(null);
    try {
      const payload: UpdateEicherPayload = {
        DBM_Code: form.DBM_Code?.trim() || undefined,
        User_Name: form.User_Name.trim(),
        User_Pass: form.User_Pass?.trim() || undefined,
        Godw_Code: form.Godw_Code ?? null,
      };
      await apiUpdateEicherConfig(config.UTD, payload, user);
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper title="Update Eicher Config" subtitle={`Editing Config #${config.UTD}`} icon={<Pencil size={16} className="text-[#FFFFFF]" />} onClose={onClose}>
      <ConfigForm form={form} onChange={setForm} showPass={showPass} onTogglePass={() => setShowPass(!showPass)} error={error} loading={loading} onSubmit={handleSubmit} onClose={onClose} submitLabel="Update Config" submitIcon={<Pencil size={14} />} godowns={godowns} godownLoading={godownLoading} />
    </ModalWrapper>
  );
}

// ── Confirm Toggle Modal ───────────────────────────────────
interface ConfirmToggleModalProps {
  config: EicherConfig;
  onClose: () => void;
  onSuccess: () => void;
  user: any;
}

function ConfirmToggleModal({ config, onClose, onSuccess, user }: ConfirmToggleModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const active = isActive(config);
  const newStatus = active ? "inactive" : "active";

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleConfirm = async () => {
    setLoading(true); setError(null);
    try {
      await apiToggleEicherConfig(config.UTD, newStatus, user);
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#000000]/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-[#E5E7EB] bg-[#FFFFFF] shadow-2xl dark:border-[#334155] dark:bg-[#1E293B]">

        {/* Header */}
        <div className={`flex items-center justify-between rounded-t-2xl border-b px-6 py-4 ${active
            ? "border-[#FECACA] bg-[#FEF2F2] dark:border-[#7F1D1D] dark:bg-[#450A0A]/40"
            : "border-[#BBF7D0] bg-[#F0FDF4] dark:border-[#14532D] dark:bg-[#052E16]/40"
          }`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${active ? "bg-exit" : "bg-save"
              }`}>
              {active
                ? <PowerOff size={16} className="text-[#FFFFFF]" />
                : <Power size={16} className="text-[#FFFFFF]" />
              }
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#111827] dark:text-[#F9FAFB]">
                {active ? "Deactivate Config" : "Activate Config"}
              </h2>
              <p className="text-lg text-[#6B7280] dark:text-[#9CA3AF]">Config #{config.UTD}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] text-[#6B7280] transition-all hover:bg-[#F9FAFB] dark:border-[#334155] dark:bg-[#1E293B] dark:text-[#F9FAFB] active:scale-95"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-5">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2.5 dark:border-[#991B1B] dark:bg-[#450A0A]">
              <AlertCircle size={14} className="mt-0.5 shrink-0 text-exit" />
              <p className="text-lg font-medium text-[#7F1D1D] dark:text-[#FCA5A5]">{error}</p>
            </div>
          )}

          {/* Info Box */}
          <div className={`rounded-xl border p-4 ${active
              ? "border-[#FECACA] bg-[#FEF2F2] dark:border-[#7F1D1D] dark:bg-[#450A0A]/30"
              : "border-[#BBF7D0] bg-[#F0FDF4] dark:border-[#14532D] dark:bg-[#052E16]/30"
            }`}>
            <p className={`text-lg font-medium ${active
                ? "text-[#7F1D1D] dark:text-[#FCA5A5]"
                : "text-[#14532D] dark:text-[#86EFAC]"
              }`}>
              {active
                ? "If you deactivate it, the scheduler will stop processing this dealer."
                : "If you activate it, the scheduler will start processing this dealer."
              }
            </p>

            {/* Config Info */}
            <div className="mt-3 space-y-1.5 rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] p-3 dark:border-[#334155] dark:bg-[#0F172A]/50">
              {[
                { label: "DBM Code", value: config.DBM_Code || "—" },
                { label: "User Name", value: config.User_Name },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-lg text-[#6B7280] dark:text-[#9CA3AF]">{row.label}</span>
                  <span className="text-lg font-semibold text-[#111827] dark:text-[#F9FAFB]">{row.value}</span>
                </div>
              ))}

              {/* Current Status */}
              <div className="flex items-center justify-between">
                <span className="text-lg text-[#6B7280] dark:text-[#9CA3AF]">Current Status</span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-lg font-bold ${active
                    ? "bg-[#DCFCE7] text-[#15803D] dark:bg-[#14532D]/40 dark:text-[#86EFAC]"
                    : "bg-[#FEE2E2] text-exit dark:bg-[#7F1D1D]/40 dark:text-[#FCA5A5]"
                  }`}>
                  {active ? <Power size={9} /> : <PowerOff size={9} />}
                  {active ? "Active" : "Inactive"}
                </span>
              </div>

              {/* New Status */}
              <div className="flex items-center justify-between">
                <span className="text-lg text-[#6B7280] dark:text-[#9CA3AF]">New Status</span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-lg font-bold ${!active
                    ? "bg-[#DCFCE7] text-[#15803D] dark:bg-[#14532D]/40 dark:text-[#86EFAC]"
                    : "bg-[#FEE2E2] text-exit dark:bg-[#7F1D1D]/40 dark:text-[#FCA5A5]"
                  }`}>
                  {!active ? <Power size={9} /> : <PowerOff size={9} />}
                  {!active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-2.5 text-lg font-semibold text-[#374151] transition-all hover:bg-[#F3F4F6] disabled:opacity-60 active:scale-[0.99] dark:border-[#334155] dark:bg-[#1E293B] dark:text-[#F9FAFB] dark:hover:bg-[#0F172A]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-lg font-bold text-[#FFFFFF] transition-all disabled:opacity-70 active:scale-[0.99] shadow-md ${active ? "bg-exit" : "bg-save"
                }`}
            >
              {loading
                ? <><Loader2 size={14} className="animate-spin" /> Processing…</>
                : active
                  ? <><PowerOff size={14} /> Deactivate</>
                  : <><Power size={14} /> Activate</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Skeleton Row ───────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="border-b border-[#F3F4F6] dark:border-[#334155]">
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 w-full animate-pulse rounded-md bg-[#F3F4F6] dark:bg-[#0F172A]/50" />
        </td>
      ))}
    </tr>
  );
}

// ── Empty State ────────────────────────────────────────────
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <tr>
      <td colSpan={7} className="px-4 py-16 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF7ED] dark:bg-[#431407]/30">
            <Database size={24} className="text-primary" />
          </div>
          <p className="text-lg font-semibold text-[#111827] dark:text-[#F9FAFB]">No configs found</p>
          <p className="text-lg text-[#6B7280] dark:text-[#9CA3AF]">Get started by creating your first Eicher config</p>
          <button
            type="button"
            onClick={onAdd}
            className="mt-1 flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-lg font-bold text-[#FFFFFF] shadow-sm transition-all hover:opacity-90 active:scale-95"
          >
            <PlusCircle size={13} />
            Add First Config
          </button>
        </div>
      </td>
    </tr>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function EicherConfigPage() {
  const router = useRouter();
  const user = useCurrentUser() as any;

  const [configs, setConfigs] = useState<EicherConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [updateConfig, setUpdateConfig] = useState<EicherConfig | null>(null);
  const [toggleConfig, setToggleConfig] = useState<EicherConfig | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [filterDBM, setFilterDBM] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [filterGodw, setFilterGodw] = useState("");

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGetEicherConfigs(
        {
          DBM_Code: filterDBM.trim() || undefined,
          User_Name: filterUser.trim() || undefined,
          Godw_Code: filterGodw.trim() || undefined,
        },
        user
      );
      setConfigs(res.data || []);
      setFilterDBM("");
      setFilterUser("");
      setFilterGodw("");
    } catch (err) {
      setStatusMessage({ type: "error", text: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }, [filterDBM, filterUser, filterGodw, user]);

  useEffect(() => { fetchConfigs(); }, []);

  const handleCreateSuccess = (utd: number) => {
    setShowCreateModal(false);
    setStatusMessage({ type: "success", text: `Config created successfully! ID: ${utd}` });
    fetchConfigs();
  };

  const handleUpdateSuccess = () => {
    setUpdateConfig(null);
    setStatusMessage({ type: "success", text: "Config updated successfully!" });
    fetchConfigs();
  };

  const handleToggleSuccess = () => {
    const cfg = toggleConfig!;
    const wasActive = isActive(cfg);
    setToggleConfig(null);
    setStatusMessage({ type: "success", text: `Config #${cfg.UTD} marked as ${wasActive ? "inactive" : "active"} successfully!` });
    fetchConfigs();
  };

  const clearFilters = () => { setFilterDBM(""); setFilterUser(""); setFilterGodw(""); };
  const hasFilters = filterDBM || filterUser || filterGodw;
  const activeCount = configs.filter((c) => isActive(c)).length;
  const inactiveCount = configs.filter((c) => !isActive(c)).length;

  return (
    <>
      {/* Modals */}
      {showCreateModal && <CreateModal onClose={() => setShowCreateModal(false)} onSuccess={handleCreateSuccess} user={user} />}
      {updateConfig && <UpdateModal config={updateConfig} onClose={() => setUpdateConfig(null)} onSuccess={handleUpdateSuccess} user={user} />}
      {toggleConfig && <ConfirmToggleModal config={toggleConfig} onClose={() => setToggleConfig(null)} onSuccess={handleToggleSuccess} user={user} />}

      <div className="mx-auto space-y-5 p-3 sm:p-5">

        {/* ══ PAGE HEADER ══ */}
        <div className="relative overflow-hidden rounded-2xl border border-[#334155] bg-header shadow-md">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 left-1/4 h-40 w-40 rounded-full bg-exit/10 blur-2xl" />
          <div className="relative flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

            {/* Left */}
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary shadow-md">
                <Settings size={22} className="text-[#FFFFFF]" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight text-[#FFFFFF] sm:text-lg">
                  Eicher Config Manager
                </h1>
                <p className="mt-0.5 text-lg text-[#94A3B8]">
                  Manage Eicher API credentials, DBM codes &amp; godown configurations
                </p>
              </div>
            </div>

            {/* Right */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FFFFFF]/10 bg-[#FFFFFF]/5 px-3 py-1 text-lg font-semibold text-[#CBD5E1] backdrop-blur-sm">
                <ShieldCheck size={12} className="text-yellow" />
                Secure Credentials
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FFFFFF]/10 bg-[#FFFFFF]/5 px-3 py-1 text-lg font-semibold text-[#CBD5E1] backdrop-blur-sm">
                <Database size={12} className="text-primary" />
                System Versioned
              </span>
              <button
                type="button"
                onClick={fetchConfigs}
                disabled={loading}
                className="flex h-9 items-center gap-2 rounded-xl border border-[#FFFFFF]/15 bg-[#FFFFFF]/10 px-3 text-lg font-bold text-[#FFFFFF] backdrop-blur-sm transition-all hover:bg-[#FFFFFF]/20 disabled:opacity-60 active:scale-95"
              >
                <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-lg font-bold text-[#FFFFFF] transition-all hover:opacity-90 active:scale-95"
              >
                <PlusCircle size={13} />
                Create Config
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="flex h-9 items-center gap-2 rounded-xl border border-[#FFFFFF]/15 bg-[#FFFFFF]/10 px-3 text-lg font-bold text-[#FFFFFF] backdrop-blur-sm transition-all hover:bg-[#FFFFFF]/20 active:scale-95"
              >
                <ArrowLeft size={13} />
                Back
              </button>
            </div>
          </div>
        </div>

        {/* ══ STATUS ALERT ══ */}
        {statusMessage && (
          <StatusAlert type={statusMessage.type} text={statusMessage.text} onDismiss={() => setStatusMessage(null)} />
        )}

        {/* ══ STATS CARDS ══ */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total Configs", value: configs.length, icon: Database, iconBg: "bg-[#FFF7ED] dark:bg-[#431407]/30", iconColor: "text-primary", valueColor: "text-primary" },
            { label: "Active", value: activeCount, icon: Power, iconBg: "bg-[#F0FDF4] dark:bg-[#052E16]/30", iconColor: "text-save", valueColor: "text-save" },
            { label: "Inactive", value: inactiveCount, icon: PowerOff, iconBg: "bg-[#FEF2F2] dark:bg-[#450A0A]/30", iconColor: "text-exit", valueColor: "text-exit" },
            { label: "Unique Users", value: new Set(configs.map((c) => c.User_Name)).size, icon: User, iconBg: "bg-[#FAF5FF] dark:bg-[#3B0764]/30", iconColor: "text-[#A855F7]", valueColor: "text-[#A855F7]" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-[#FFFFFF] px-4 py-3.5 shadow-sm dark:border-[#334155] dark:bg-[#1E293B]"
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.iconBg}`}>
                <stat.icon size={18} className={stat.iconColor} />
              </div>
              <div>
                <p className={`text-xl font-bold ${stat.valueColor}`}>{stat.value}</p>
                <p className="text-lg text-[#6B7280] dark:text-[#9CA3AF]">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ══ TABLE CARD ══ */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-[#FFFFFF] shadow-sm dark:border-[#334155] dark:bg-[#1E293B]">

          {/* Card Header + Filters */}
          <div className="flex flex-col gap-4 border-b border-[#F3F4F6] px-6 py-4 dark:border-[#334155] sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFF7ED] dark:bg-[#431407]/30">
                <Settings size={15} className="text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#111827] dark:text-[#F9FAFB]">Eicher Configurations</h2>
                <p className="text-lg text-[#6B7280] dark:text-[#9CA3AF]">
                  {loading ? "Loading…" : `${configs.length} record${configs.length !== 1 ? "s" : ""} found`}
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { value: filterDBM, onChange: setFilterDBM, placeholder: "DBM Code", icon: <Search size={12} />, type: "text", width: "w-32" },
                { value: filterUser, onChange: setFilterUser, placeholder: "User Name", icon: <Search size={12} />, type: "text", width: "w-32" },
                { value: filterGodw, onChange: setFilterGodw, placeholder: "Godw Code", icon: <Hash size={12} />, type: "number", width: "w-28" },
              ].map((f) => (
                <div key={f.placeholder} className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]">{f.icon}</span>
                  <input
                    value={f.value}
                    onChange={(e) => f.onChange(e.target.value)}
                    placeholder={f.placeholder}
                    type={f.type}
                    min={f.type === "number" ? 0 : undefined}
                    className={`h-8 ${f.width} rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] pl-7 pr-2 text-lg text-[#111827] outline-none transition-all placeholder:text-[#9CA3AF] focus:border-primary dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#F9FAFB] dark:placeholder:text-[#6B7280]`}
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={fetchConfigs}
                disabled={loading}
                className="flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-lg font-bold text-[#FFFFFF] shadow-sm transition-all hover:opacity-90 disabled:opacity-60 active:scale-95"
              >
                <Search size={12} />
                Search
              </button>
              {hasFilters && (
                <button
                  type="button"
                  onClick={() => { clearFilters(); fetchConfigs(); }}
                  className="flex h-8 items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-lg font-semibold text-[#6B7280] transition-all hover:bg-[#F3F4F6] active:scale-95 dark:border-[#334155] dark:bg-[#1E293B] dark:text-[#9CA3AF] dark:hover:bg-[#0F172A]"
                >
                  <X size={12} />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-lg">
              <thead>
                <tr className="border-b border-[#F3F4F6] bg-[#F9FAFB] dark:border-[#334155] dark:bg-[#0F172A]/50">
                  {["#", "DBM Code", "User Name", "Godw Name", "Status", "Created At", "Actions"].map((col) => (
                    <th key={col} className="px-4 py-3 font-semibold uppercase tracking-wider text-[#6B7280] dark:text-[#9CA3AF]">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <><SkeletonRow /><SkeletonRow /><SkeletonRow /></>
                ) : configs.length === 0 ? (
                  <EmptyState onAdd={() => setShowCreateModal(true)} />
                ) : (
                  configs.map((cfg, idx) => {
                    const active = isActive(cfg);
                    return (
                      <tr
                        key={cfg.UTD}
                        className="border-b border-[#F9FAFB] transition-colors hover:bg-[#FFF7ED]/50 dark:border-[#334155] dark:hover:bg-primary/5"
                      >
                        {/* # */}
                        <td className="px-4 py-3">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#FFF7ED] text-lg font-bold text-primary dark:bg-[#431407]/30">
                            {idx + 1}
                          </span>
                        </td>

                        {/* DBM Code */}
                        <td className="px-4 py-3">
                          {cfg.DBM_Code
                            ? <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EFF6FF] px-2.5 py-0.5 text-lg font-semibold text-[#1D4ED8] dark:bg-[#1E3A5F]/40 dark:text-[#93C5FD]">
                              <Building2 size={10} />{cfg.DBM_Code}
                            </span>
                            : <span className="text-[#D1D5DB] dark:text-[#374151]">—</span>
                          }
                        </td>

                        {/* User Name */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold uppercase text-[#FFFFFF]">
                              {cfg.User_Name.charAt(0)}
                            </div>
                            <span className="font-semibold text-[#111827] dark:text-[#F9FAFB]">{cfg.User_Name}</span>
                          </div>
                        </td>

                        {/* Godw Name */}
                        <td className="px-4 py-3">
                          {cfg.Godw_Code !== null
                            ? <span className="inline-flex items-center gap-1 rounded-full bg-[#F0FDF4] px-2.5 py-0.5 text-lg font-semibold text-[#15803D] dark:bg-[#052E16]/40 dark:text-[#86EFAC]">
                              <Hash size={9} />{cfg.Godw_Name}
                            </span>
                            : <span className="text-[#D1D5DB] dark:text-[#374151]">—</span>
                          }
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-lg font-bold ${active
                              ? "bg-[#DCFCE7] text-[#15803D] dark:bg-[#14532D]/40 dark:text-[#86EFAC]"
                              : "bg-[#FEE2E2] text-exit dark:bg-[#7F1D1D]/40 dark:text-[#FCA5A5]"
                            }`}>
                            {active ? <Power size={9} /> : <PowerOff size={9} />}
                            {active ? "Active" : "Inactive"}
                          </span>
                        </td>

                        {/* Created At */}
                        <td className="px-4 py-3 text-[#6B7280] dark:text-[#9CA3AF]">
                          {new Date(cfg.Created_At).toLocaleString("en-IN", {
                            day: "2-digit", month: "short", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => setUpdateConfig(cfg)}
                              title="Edit"
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280] transition-all hover:border-primary hover:bg-[#FFF7ED] hover:text-primary active:scale-95 dark:border-[#334155] dark:bg-[#1E293B] dark:text-[#9CA3AF] dark:hover:bg-primary/10 dark:hover:text-primary"
                            >
                              <Pencil size={12} />
                            </button>

                            {/* Toggle */}
                            <button
                              type="button"
                              onClick={() => setToggleConfig(cfg)}
                              title={active ? "Deactivate" : "Activate"}
                              className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-all active:scale-95 ${active
                                  ? "border-[#FECACA] bg-[#FEF2F2] text-exit hover:bg-[#FEE2E2] dark:border-[#7F1D1D] dark:bg-[#450A0A]/30 dark:hover:bg-[#450A0A]/50"
                                  : "border-[#BBF7D0] bg-[#F0FDF4] text-[#16A34A] hover:bg-[#DCFCE7] dark:border-[#14532D] dark:bg-[#052E16]/30 dark:hover:bg-[#052E16]/50"
                                }`}
                            >
                              {active ? <PowerOff size={12} /> : <Power size={12} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          {configs.length > 0 && (
            <div className="flex items-center justify-between border-t border-[#F3F4F6] px-6 py-3 dark:border-[#334155]">
              <p className="text-lg text-[#9CA3AF] dark:text-[#6B7280]">
                Showing{" "}
                <span className="font-semibold text-[#374151] dark:text-[#D1D5DB]">{configs.length}</span>
                {" "}record{configs.length !== 1 ? "s" : ""}
                {" · "}
                <span className="font-semibold text-save">{activeCount} active</span>
                {" · "}
                <span className="font-semibold text-exit">{inactiveCount} inactive</span>
              </p>
              <p className="text-lg text-[#9CA3AF] dark:text-[#6B7280]">
                Last updated:{" "}
                <span className="font-semibold text-[#374151] dark:text-[#D1D5DB]">
                  {new Date().toLocaleTimeString("en-IN")}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}