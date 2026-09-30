"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
    Database, ChevronRight, Search, RefreshCw,
    AlertCircle, Hash, CheckCircle2, XCircle,
    ArrowLeft, Info, PlusCircle, X, Loader2, Save,
    Plus, ArrowRightLeft, Pencil,
} from "lucide-react";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import {
    getFormConfig,
    FieldConfig,
    MiscFormConfig,
} from "../../../../utils/misc_form_config";
import { Tree } from "antd";
import { treeData } from "@/constant/MobileAppRights";
import { GrUserAdmin } from "react-icons/gr";

// ============================================================
// CONSTANTS
// ============================================================
const BASE_URL = process.env.NEXT_PUBLIC_URL;

const MISC_TYPE_MAPPING: Record<string, string> = {
    // "11": "Department Master",
    // "17": "Enquiry Source Master",
    // "18": "Payment Mode Master",
    // "19": "Cancel Reason Master",
    // "31": "Product Group Master",
    // "32": "Mechanic Master",
    // "51": "Tyre Master",
    // "54": "Tyre Category Master",
    // "58": "Chapter Type Master",
    // "59": "Bank Name Master",
    // "60": "Customer Segment Master",
    // "61": "Customer Category Master",
    // "71": "Godown Master",
    // "72": "UOM Master",
    // "73": "Tariff Class Master",
    // "85": "Branch Master",
    // "92": "Leave Master & Policy",
    // "95": "Employee Designation",
    // "404": "Cost Center Master",
    // "610": "Deduction Master",
    // "620": "Team Leader Master",
    // "627": "Channel Master",
    // "637": "RTO Type",
    // "638": "Insurance Type",
    // "639": "Extended Warranty Type",
    // "641": "Vehicle Type",
    "654": "PF Percentage Master",
    "657": "Marital Status",
    // "660": "RTO Insurance Master",
    // "663": "Discount Master",
    // "666": "EMP Notice Period Master",
    // "676": "TaskManagement Module",
    "92": "Mis Punch Master",
    "91": "Region Master",
    "90": "Employee Shift Master",
    "1": "District Master",
    '3': "State Master",
    '1001': "Mobile Rights",
    "1002": "Default Shift Master"
};


const MISC_TYPE_DESC: Record<string, string> = {
    "11": "Department Master (Links with EMPLOYEEMASTER.DEPT, Expense.Dept)",
    "17": "Enquiry Source Master (Walk-in, Digital, Referral, Social Media)",
    "18": "Payment Mode Master (Cash, UPI, NEFT, Cheque, RTGS)",
    "19": "Cancel Reason Master (Booking / order cancellation reasons)",
    "31": "Product Group Master (Spares, accessories, lubes)",
    "32": "Mechanic Master (Workshop technician allocation)",
    "51": "Tyre Master",
    "54": "Tyre Category Master",
    "58": "Chapter Type Master (GST/HSN tariff codes)",
    "59": "Bank Name Master",
    "60": "Customer Segment Master",
    "61": "Customer Category Master",
    "71": "Godown Master (Spare parts & inventory stock warehouses)",
    "72": "UOM Master (Units of Measurement)",
    "73": "Tariff Class Master",
    "85": "Branch Master (Links with EMPLOYEEMASTER.LOCATION, Godown_Mst.Branch_Code)",
    "92": "Leave Master & Policy (Casual Leave, Half Day Leave, Sick Leave, Privilege Leave)",
    "95": "Employee Designation (Links with EMPLOYEEMASTER.DESG)",
    "404": "Cost Center Master (Accounting cost centres)",
    "610": "Deduction Master",
    "620": "Team Leader Master",
    "627": "Channel Master (Arena, Nexa, Commercial, TrueValue)",
    "637": "RTO Type",
    "638": "Insurance Type",
    "639": "Extended Warranty Type",
    "641": "Vehicle Type",
    "657": "Marital Status",
    "660": "RTO Insurance Master",
    "663": "Discount Master",
    "666": "EMP Notice Period Master",
    "676": "TaskManagement Module",
    "1001": "Mobile Rights (Transfers to Mobile_Rights table where Emp_Code = '0')",
    "1002": "Default Shift Master (Default shift for new employees - links to Default_Shift table)"
};

// ============================================================
// TYPES
// ============================================================
interface ColumnInfo {
    ColumnName: string;
    DataType: string;
    MaxLength: number | null;
}

interface APIResponse<T = any> {
    success: boolean;
    message: string;
    data: T;
    columns?: ColumnInfo[];
    total?: number;
    count?: number;
    total_transferred?: number;
    total_skipped?: number;
}

type MiscRecord = Record<string, any>;

interface MiscTypeItem {
    Misc_Type: number;
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
        user_code: String(user?.id || user?.user_code || user?.User_Code || user?.userCode || "1"),
        "Content-Type": "application/json",
    };
};

const getErrorMessage = (error: unknown): string => {
    if (axios.isAxiosError(error)) {
        const d = (error as AxiosError<any>).response?.data;
        if (d?.message) return d.message;
        if (d?.error) return d.error;
        return (error as AxiosError).message || "Request failed.";
    }
    if (error instanceof Error) return error.message;
    return "Something went wrong.";
};

// ── Columns to always skip ────────────────────────────────
const SKIP_COLUMNS = [
    "Misc_Type", "Export_Type", "ServerId",
    "Server_Id", "Loc_code", "UTD",
];

// ============================================================
// CELL RENDERER
// ============================================================
function renderCell(col: ColumnInfo, val: any, formConfig?: MiscFormConfig | null) {

    // ── Null / Empty ──────────────────────────────────────
    if (val === null || val === undefined || val === "") {
        return <span className="text-[#D1D5DB] dark:text-[#374151]">—</span>;
    }

    // ── Misc_Code ─────────────────────────────────────────
    if (col.ColumnName === "Misc_Code") {
        return (
            <span className="inline-flex items-center gap-1 rounded-md bg-[#EFF6FF] px-2 py-0.5 text-lg font-bold text-[#1D4ED8] dark:bg-[#1E3A5F]/40 dark:text-[#93C5FD]">
                {val}
            </span>
        );
    }

    // ── Misc_Name ─────────────────────────────────────────
    if (col.ColumnName === "Misc_Name") {
        return (
            <span className="font-semibold text-[#111827] dark:text-[#F9FAFB]">
                {String(val)}
            </span>
        );
    }

    // ── Select field - show label from config ─────────────
    if (formConfig) {
        const fieldConf = formConfig.fields.find((f) => f.key === col.ColumnName);
        if (fieldConf?.type === "select" && fieldConf.options) {
            const opt = fieldConf.options.find((o) => String(o.value) === String(val));
            if (opt) {
                return (
                    <span className="rounded-full bg-[#EFF6FF] px-2 py-0.5 text-lg font-semibold text-[#1D4ED8] dark:bg-[#1E3A5F]/40 dark:text-[#93C5FD]">
                        {opt.label}
                    </span>
                );
            }
        }
    }

    // ── Active / Status ───────────────────────────────────
    if (col.ColumnName.toLowerCase() === "active" || col.ColumnName.toLowerCase().includes("status")) {
        const isAct = val === 1 || val === true || val === "1";
        return isAct
            ? <span className="inline-flex items-center gap-1 rounded-full bg-[#DCFCE7] px-2 py-0.5 text-lg font-bold text-[#15803D] dark:bg-[#14532D]/40 dark:text-[#86EFAC]"><CheckCircle2 size={9} /> Active</span>
            : <span className="inline-flex items-center gap-1 rounded-full bg-[#FEE2E2] px-2 py-0.5 text-lg font-bold text-[#DC2626] dark:bg-[#7F1D1D]/40 dark:text-[#FCA5A5]"><XCircle size={9} /> Inactive</span>;
    }

    // ── dis_back_date ─────────────────────────────────────
    if (col.ColumnName === "dis_back_date") {
        return val === 1
            ? <span className="rounded-full bg-[#FEE2E2] px-2 py-0.5 text-lg font-bold text-[#DC2626]">Disabled</span>
            : <span className="rounded-full bg-[#DCFCE7] px-2 py-0.5 text-lg font-bold text-[#15803D]">Allowed</span>;
    }

    // ── is_carry / year_laps ──────────────────────────────
    if (["is_carry", "year_laps"].includes(col.ColumnName)) {
        return val === 1 || val === true
            ? <span className="rounded-full bg-[#DCFCE7] px-2 py-0.5 text-lg font-bold text-[#15803D]">Yes</span>
            : <span className="rounded-full bg-[#FEE2E2] px-2 py-0.5 text-lg font-bold text-[#DC2626]">No</span>;
    }

    // ── bit type ──────────────────────────────────────────
    if (col.DataType === "bit") {
        return val === true || val === 1
            ? <span className="rounded-full bg-[#DCFCE7] px-2 py-0.5 text-lg font-bold text-[#15803D]">Yes</span>
            : <span className="rounded-full bg-[#FEE2E2] px-2 py-0.5 text-lg font-bold text-[#DC2626]">No</span>;
    }

    // ── Date type ─────────────────────────────────────────
    if (["datetime", "date", "datetime2", "smalldatetime"].includes(col.DataType)) {
        try {
            return (
                <span className="text-[#6B7280] dark:text-[#9CA3AF]">
                    {new Date(val).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
            );
        } catch { return <span className="text-[#6B7280]">{String(val)}</span>; }
    }

    // ── Numeric ───────────────────────────────────────────
    if (["int", "bigint", "smallint", "tinyint", "decimal", "numeric", "float", "real", "money"].includes(col.DataType)) {
        return (
            <span className="font-mono text-lg text-[#374151] dark:text-[#D1D5DB]">{String(val)}</span>
        );
    }

    // ── Default ───────────────────────────────────────────
    return (
        <span className="block max-w-2xl truncate text-[#6B7280] dark:text-[#9CA3AF]" title={String(val)}>
            {String(val)}
        </span>
    );
}

// ============================================================
// SKELETON ROW
// ============================================================
function SkeletonRow({ cols }: { cols: number }) {
    return (
        <tr className="border-b border-[#F3F4F6] dark:border-[#334155]">
            {Array.from({ length: cols }).map((_, i) => (
                <td key={i} className="px-3 py-2.5">
                    <div className="h-3.5 w-full animate-pulse rounded bg-[#F3F4F6] dark:bg-[#334155]" />
                </td>
            ))}
        </tr>
    );
}

// ============================================================
// CREATE MODAL (Header Dropdown)
// ============================================================
interface CreateModalHeaderProps {
    onClose: () => void;
    onSuccess: (name: string) => void;
    user: any;
    availableTypes: string[];
    initialMiscType?: string | null;
}

function CreateModalHeader({ onClose, onSuccess, user, availableTypes, initialMiscType }: CreateModalHeaderProps) {

    const [selectedMiscType, setSelectedMiscType] = useState<string>(
        initialMiscType && initialMiscType !== "1001" ? initialMiscType : ""
    );
    const [form, setForm] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setSelectedMiscType(initialMiscType && initialMiscType !== "1001" ? initialMiscType : "");
    }, [initialMiscType]);

    const formConfig = selectedMiscType ? getFormConfig(selectedMiscType) : null;

    useEffect(() => {
        if (formConfig) {
            const f: Record<string, any> = {};
            formConfig.fields.forEach((field) => { f[field.key] = ""; });
            setForm(f);
        }
    }, [formConfig, selectedMiscType]);

    const handleChange = (key: string, val: any) => {
        setForm((prev) => ({ ...prev, [key]: val }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedMiscType || selectedMiscType === "1001") {
            setError("Please select a valid Misc Type");
            return;
        }

        if (!formConfig) {
            setError("Form configuration not found");
            return;
        }

        // ── Validate ──────────────────────────────────────
        for (const field of formConfig.fields) {
            if (field.required && !String(form[field.key] ?? "").trim()) {
                setError(`"${field.label}" is required.`);
                return;
            }
        }

        setLoading(true);
        setError(null);

        try {
            const payload: Record<string, any> = { Misc_Type: selectedMiscType, ...form };

            // Clean empty values
            Object.keys(payload).forEach((k) => {
                if (payload[k] === "" || payload[k] === null || payload[k] === undefined) {
                    delete payload[k];
                }
            });

            const res = await axios.post<APIResponse>(
                `${BASE_URL}/misc/create`,
                payload,
                { headers: buildHeaders(user), timeout: 30000 }
            );

            if (res.data.success) {
                onSuccess(form.Misc_Name || "Record");
            } else {
                setError(res.data.message || "Something went wrong");
            }
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const inputCls = [
        "h-9 w-full rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] px-3 text-lg text-[#111827]",
        "placeholder:text-[#9CA3AF] outline-none transition-all",
        "focus:border-primary focus:ring-2 focus:ring-primary/20",
        "dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#F9FAFB] dark:placeholder:text-[#6B7280]",
    ].join(" ");

    const selectCls = [
        "h-9 w-full appearance-none rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] px-3 text-lg text-[#111827]",
        "outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20",
        "dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#F9FAFB]",
    ].join(" ");

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#000000]/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-xl rounded-2xl border border-[#E5E7EB] bg-[#FFFFFF] shadow-2xl dark:border-[#334155] dark:bg-[#1E293B]">

                {/* Header */}
                <div className="flex items-center justify-between rounded-t-2xl border-b border-[#F3F4F6] bg-header px-5 py-4 dark:border-[#334155]">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-md">
                            <PlusCircle size={16} className="text-[#FFFFFF]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[#FFFFFF]">Create New Record</h2>
                            <p className="text-lg text-[#94A3B8]">Select Misc Type to continue</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#FFFFFF] transition-all hover:text-[#EF4444] active:scale-95"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="max-h-[70vh] overflow-y-auto">
                    <form onSubmit={handleSubmit} className="space-y-3 px-5 py-5">

                        {/* Error */}
                        {error && (
                            <div className="flex items-start gap-2 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2.5 dark:border-[#7F1D1D] dark:bg-[#450A0A]/40">
                                <AlertCircle size={13} className="mt-0.5 shrink-0 text-[#DC2626]" />
                                <p className="text-lg font-medium text-[#7F1D1D] dark:text-[#FCA5A5]">{error}</p>
                            </div>
                        )}

                        {/* Misc Type Dropdown */}
                        <div className="space-y-1">
                            <label className="flex items-center gap-1 text-lg font-semibold uppercase tracking-wider text-[#6B7280] dark:text-[#9CA3AF]">
                                Select Misc Type
                                <span className="text-[#EF4444]">*</span>
                            </label>
                            <select
                                value={selectedMiscType}
                                onChange={(e) => {
                                    if (e.target.value === "1001") return;
                                    setSelectedMiscType(e.target.value);
                                    setError(null);
                                }}
                                className={selectCls}
                            >
                                <option value="">-- Select Misc Type --</option>
                                {Object.entries(MISC_TYPE_MAPPING)
                                    .filter(([code]) => code !== "1001")
                                    .sort(([a], [b]) => parseInt(a) - parseInt(b))
                                    .map(([code, name]) => (
                                        <option key={code} value={code}>
                                            {code} - {name}
                                        </option>
                                    ))
                                }
                            </select>
                        </div>

                        {/* Auto Code Info */}
                        {selectedMiscType && (
                            <div className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 dark:border-[#334155] dark:bg-[#0F172A]">
                                <Hash size={12} className="shrink-0 text-primary" />
                                <p className="text-lg text-[#6B7280] dark:text-[#9CA3AF]">
                                    <span className="font-semibold text-[#374151] dark:text-[#D1D5DB]">Misc Code</span>
                                    {" "}will be auto-generated for type{" "}
                                    <span className="font-bold text-primary">{selectedMiscType}</span>
                                </p>
                            </div>
                        )}

                        {/* Dynamic Fields */}
                        {formConfig && formConfig.fields.map((field: FieldConfig) => (
                            <div key={field.key} className="space-y-1">

                                {/* Label */}
                                <label className="flex items-center gap-1 text-lg font-semibold uppercase tracking-wider text-[#6B7280] dark:text-[#9CA3AF]">
                                    {field.label}
                                    {field.required && <span className="text-[#EF4444]">*</span>}
                                </label>

                                {/* Input */}
                                {field.type === "select" ? (
                                    <select
                                        value={form[field.key] ?? ""}
                                        onChange={(e) => handleChange(field.key, e.target.value)}
                                        className={selectCls}
                                    >
                                        <option value="">-- Select --</option>
                                        {field.options?.map((opt) => (
                                            <option key={String(opt.value)} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>

                                ) : field.type === "textarea" ? (
                                    <textarea
                                        value={form[field.key] ?? ""}
                                        onChange={(e) => handleChange(field.key, e.target.value)}
                                        placeholder={field.placeholder}
                                        rows={3}
                                        maxLength={field.maxLength}
                                        className={`${inputCls} h-auto py-2`}
                                    />

                                ) : field.type === "date" ? (
                                    <input
                                        type="date"
                                        value={form[field.key] ?? ""}
                                        onChange={(e) => handleChange(field.key, e.target.value)}
                                        className={inputCls}
                                    />

                                ) : (
                                    <input
                                        type={field.type}
                                        value={form[field.key] ?? ""}
                                        onChange={(e) => handleChange(field.key, e.target.value)}
                                        placeholder={field.placeholder}
                                        maxLength={field.maxLength}
                                        className={inputCls}
                                    />
                                )}

                                {/* Counter for text */}
                                {field.maxLength && (field.type === "text" || field.type === "textarea") && (
                                    <p className="text-right text-lg text-[#9CA3AF]">
                                        <span className={
                                            String(form[field.key] ?? "").length >= (field.maxLength - 5)
                                                ? "text-[#EF4444]"
                                                : ""
                                        }>
                                            {String(form[field.key] ?? "").length}
                                        </span>
                                        /{field.maxLength}
                                    </p>
                                )}

                                {/* Hint */}
                                {field.hint && (
                                    <p className="flex items-center gap-1 text-lg text-[#9CA3AF] dark:text-[#6B7280]">
                                        <Info size={9} />
                                        {field.hint}
                                    </p>
                                )}
                            </div>
                        ))}

                        {/* Buttons */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="flex-1 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-2.5 text-lg font-semibold text-[#374151] transition-all hover:bg-[#F3F4F6] disabled:opacity-60 active:scale-[0.99] dark:border-[#334155] dark:bg-[#1E293B] dark:text-[#F9FAFB] dark:hover:bg-[#0F172A]"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !selectedMiscType}
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-lg font-bold text-[#FFFFFF] shadow-md transition-all hover:opacity-90 disabled:opacity-70 active:scale-[0.99]"
                            >
                                {loading
                                    ? <><Loader2 size={13} className="animate-spin" /> Saving…</>
                                    : <><Save size={13} /> Save Record</>
                                }
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// EDIT MODAL (Update Record)
// ============================================================
interface EditModalProps {
    onClose: () => void;
    onSuccess: (name: string) => void;
    user: any;
    selectedMiscType: string;
    record: MiscRecord;
    visibleColumns?: ColumnInfo[];
}

function EditModal({ onClose, onSuccess, user, selectedMiscType, record, visibleColumns = [] }: EditModalProps) {
    const formConfig = getFormConfig(selectedMiscType);

    const editableFields: FieldConfig[] = useMemo(() => {
        const fields = [...(formConfig?.fields || [])];
        const existingKeys = new Set(fields.map((f) => f.key.toLowerCase()));

        visibleColumns.forEach((col) => {
            const colKey = col.ColumnName;
            const lower = colKey.toLowerCase();
            if (
                !existingKeys.has(lower) &&
                !SKIP_COLUMNS.map((s) => s.toLowerCase()).includes(lower) &&
                lower !== "misc_code"
            ) {
                fields.push({
                    key: colKey,
                    label: colKey,
                    type:
                        col.DataType === "date" || col.DataType.includes("datetime")
                            ? "date"
                            : col.DataType === "int"
                            ? "number"
                            : "text",
                    required: false,
                    maxLength: col.MaxLength || 100,
                });
                existingKeys.add(lower);
            }
        });
        return fields;
    }, [formConfig, visibleColumns]);

    const [form, setForm] = useState<Record<string, any>>(() => {
        const initial: Record<string, any> = {};
        editableFields.forEach((field) => {
            const matchedKey = Object.keys(record).find(
                (k) => k.toLowerCase() === field.key.toLowerCase()
            );
            let val = matchedKey !== undefined ? record[matchedKey] : "";
            if (field.type === "date" && val) {
                try {
                    const d = new Date(val);
                    if (!isNaN(d.getTime())) {
                        val = d.toISOString().split("T")[0];
                    }
                } catch (_) {}
            }
            initial[field.key] = val !== null && val !== undefined ? val : "";
        });
        if (selectedMiscType === "1001" && (!initial["Misc_HOD"] && initial["Misc_HOD"] !== 0)) {
            initial["Misc_HOD"] = "10";
        }
        return initial;
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (key: string, val: any) => {
        setForm((prev) => ({ ...prev, [key]: val }));
    };

    const miscCode = record.Misc_Code ?? record.misc_code;
    const utd = record.UTD ?? record.utd;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate required fields
        for (const field of editableFields) {
            if (field.required && !String(form[field.key] ?? "").trim()) {
                setError(`"${field.label}" is required.`);
                return;
            }
        }

        setLoading(true);
        setError(null);

        try {
            const payload: Record<string, any> = {
                Misc_Type: selectedMiscType,
                Misc_Code: miscCode,
                ...form,
            };

            if (utd !== undefined && utd !== null) {
                payload.UTD = utd;
            }

            const res = await axios.post<APIResponse>(
                `${BASE_URL}/misc/update`,
                payload,
                { headers: buildHeaders(user), timeout: 30000 }
            );

            if (res.data.success) {
                onSuccess(form.Misc_Name || `Record #${miscCode}`);
            } else {
                setError(res.data.message || "Failed to update record");
            }
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const inputCls = [
        "h-9 w-full rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] px-3 text-lg text-[#111827]",
        "placeholder:text-[#9CA3AF] outline-none transition-all",
        "focus:border-primary focus:ring-2 focus:ring-primary/20",
        "dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#F9FAFB] dark:placeholder:text-[#6B7280]",
    ].join(" ");

    const selectCls = [
        "h-9 w-full appearance-none rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] px-3 text-lg text-[#111827]",
        "outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20",
        "dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#F9FAFB]",
    ].join(" ");

    const typeTitle = MISC_TYPE_MAPPING[selectedMiscType] || `Type ${selectedMiscType}`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#000000]/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-xl rounded-2xl border border-[#E5E7EB] bg-[#FFFFFF] shadow-2xl dark:border-[#334155] dark:bg-[#1E293B]">

                {/* Header */}
                <div className="flex items-center justify-between rounded-t-2xl border-b border-[#F3F4F6] bg-header px-5 py-4 dark:border-[#334155]">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-md">
                            <Pencil size={16} className="text-[#FFFFFF]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[#FFFFFF]">Update Record</h2>
                            <p className="text-lg text-[#94A3B8]">
                                Type {selectedMiscType} · {typeTitle}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#FFFFFF] transition-all hover:text-[#EF4444] active:scale-95"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="max-h-[70vh] overflow-y-auto">
                    <form onSubmit={handleSubmit} className="space-y-3 px-5 py-5">

                        {/* Error */}
                        {error && (
                            <div className="flex items-start gap-2 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2.5 dark:border-[#7F1D1D] dark:bg-[#450A0A]/40">
                                <AlertCircle size={13} className="mt-0.5 shrink-0 text-[#DC2626]" />
                                <p className="text-lg font-medium text-[#7F1D1D] dark:text-[#FCA5A5]">{error}</p>
                            </div>
                        )}

                        {/* Misc Code Badge */}
                        <div className="flex items-center justify-between rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3.5 py-2.5 dark:border-[#334155] dark:bg-[#0F172A]">
                            <div className="flex items-center gap-2">
                                <Hash size={14} className="text-primary" />
                                <span className="text-lg font-semibold text-[#374151] dark:text-[#D1D5DB]">Misc Code</span>
                                <span className="rounded bg-[#E5E7EB] px-1.5 py-0.5 text-lg font-medium text-[#6B7280] dark:bg-[#334155] dark:text-[#9CA3AF]">
                                    Fixed
                                </span>
                            </div>
                            <span className="font-mono text-lg font-bold text-primary">#{miscCode}</span>
                        </div>

                        {/* Dynamic Fields */}
                        {editableFields.map((field: FieldConfig) => (
                            <div key={field.key} className="space-y-1">
                                <label className="flex items-center gap-1 text-lg font-semibold uppercase tracking-wider text-[#6B7280] dark:text-[#9CA3AF]">
                                    {field.label}
                                    {field.required && <span className="text-[#EF4444]">*</span>}
                                </label>

                                {field.type === "select" ? (
                                    <select
                                        value={form[field.key] ?? ""}
                                        onChange={(e) => handleChange(field.key, e.target.value)}
                                        className={selectCls}
                                    >
                                        <option value="">-- Select --</option>
                                        {field.options?.map((opt) => (
                                            <option key={String(opt.value)} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                ) : field.type === "textarea" ? (
                                    <textarea
                                        value={form[field.key] ?? ""}
                                        onChange={(e) => handleChange(field.key, e.target.value)}
                                        placeholder={field.placeholder}
                                        rows={3}
                                        maxLength={field.maxLength}
                                        className={`${inputCls} h-auto py-2`}
                                    />
                                ) : field.type === "date" ? (
                                    <input
                                        type="date"
                                        value={form[field.key] ?? ""}
                                        onChange={(e) => handleChange(field.key, e.target.value)}
                                        className={inputCls}
                                    />
                                ) : (
                                    <input
                                        type={field.type}
                                        value={form[field.key] ?? ""}
                                        onChange={(e) => handleChange(field.key, e.target.value)}
                                        placeholder={field.placeholder}
                                        maxLength={field.maxLength}
                                        className={inputCls}
                                    />
                                )}

                                {field.maxLength && (field.type === "text" || field.type === "textarea") && (
                                    <p className="text-right text-lg text-[#9CA3AF]">
                                        <span className={
                                            String(form[field.key] ?? "").length >= (field.maxLength - 5)
                                                ? "text-[#EF4444]"
                                                : ""
                                        }>
                                            {String(form[field.key] ?? "").length}
                                        </span>
                                        /{field.maxLength}
                                    </p>
                                )}

                                {field.hint && (
                                    <p className="flex items-center gap-1 text-lg text-[#9CA3AF] dark:text-[#6B7280]">
                                        <Info size={9} />
                                        {field.hint}
                                    </p>
                                )}
                            </div>
                        ))}

                        {/* Buttons */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="flex-1 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-2.5 text-lg font-semibold text-[#374151] transition-all hover:bg-[#F3F4F6] disabled:opacity-60 active:scale-[0.99] dark:border-[#334155] dark:bg-[#1E293B] dark:text-[#F9FAFB] dark:hover:bg-[#0F172A]"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-lg font-bold text-[#FFFFFF] shadow-md transition-all hover:opacity-90 disabled:opacity-70 active:scale-[0.99]"
                            >
                                {loading ? (
                                    <><Loader2 size={14} className="animate-spin" /> Updating…</>
                                ) : (
                                    <><Save size={14} /> Update Record</>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// TRANSFER MODAL (Default_Mst -> Misc_Mst with checkboxes)
// ============================================================
interface TransferModalProps {
    onClose: () => void;
    onSuccess: (summary: string) => void;
    user: any;
}

function TransferModal({ onClose, onSuccess, user }: TransferModalProps) {
    const [types, setTypes] = useState<number[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<number[]>([]);
    const [loadingTypes, setLoadingTypes] = useState(true);
    const [transferring, setTransferring] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [transferResult, setTransferResult] = useState<any | null>(null);

    // Fetch misc_types from /misc/misc_types
    useEffect(() => {
        const fetchTypes = async () => {
            setLoadingTypes(true);
            setError(null);
            try {
                const res = await axios.get<APIResponse<MiscTypeItem[]>>(
                    `${BASE_URL}/misc/misc_types`,
                    { headers: buildHeaders(user), timeout: 30000 }
                );

                if (res.data.success && Array.isArray(res.data.data)) {
                    const allTypes = res.data.data
                        .map((item) => Number(item.Misc_Type))
                        .filter((t) => !isNaN(t) && t > 0 && t !== 1002);
                    // Ensure 1001 (Mobile Rights) is present
                    if (!allTypes.includes(1001)) {
                        allTypes.push(1001);
                    }
                    allTypes.sort((a, b) => a - b);
                    setTypes(allTypes);
                } else {
                    setError("Failed to fetch Misc Types from server.");
                }
            } catch (err) {
                setError(getErrorMessage(err));
            } finally {
                setLoadingTypes(false);
            }
        };

        if (user) {
            fetchTypes();
        }
    }, [user]);

    const filteredTypes = types.filter((code) => {
        if (code === 1002) return false;
        const codeStr = String(code);
        const name = MISC_TYPE_MAPPING[codeStr] || `Misc Type ${codeStr}`;
        const query = searchQuery.toLowerCase();
        return codeStr.includes(query) || name.toLowerCase().includes(query);
    });

    const handleToggle = (code: number) => {
        setSelectedTypes((prev) =>
            prev.includes(code) ? prev.filter((t) => t !== code) : [...prev, code]
        );
    };

    const handleSelectAll = () => {
        if (selectedTypes.length === filteredTypes.length && filteredTypes.length > 0) {
            setSelectedTypes([]);
        } else {
            setSelectedTypes(filteredTypes);
        }
    };

    const handleTransfer = async () => {
        if (selectedTypes.length === 0) {
            setError("Please select at least one Misc Type to transfer.");
            return;
        }

        setTransferring(true);
        setError(null);
        setTransferResult(null);

        try {
            const loginUserCode = user?.id || user?.user_code || user?.User_Code || user?.userCode || 1;
            const res = await axios.post<APIResponse>(
                `${BASE_URL}/misc/transfer`,
                {
                    misc_types: selectedTypes,
                    user_code: loginUserCode,
                },
                { headers: buildHeaders(user), timeout: 60000 }
            );

            if (res.data.success) {
                setTransferResult(res.data);
                onSuccess(`Transferred ${res.data.total_transferred ?? 0} records (${res.data.total_skipped ?? 0} duplicates skipped)!`);
            } else {
                setError(res.data.message || "Failed to transfer data.");
            }
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setTransferring(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#000000]/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 flex w-full max-w-2xl flex-col max-h-[85vh] rounded-2xl border border-[#E5E7EB] bg-[#FFFFFF] shadow-2xl dark:border-[#334155] dark:bg-[#1E293B]">

                {/* Header */}
                <div className="flex items-center justify-between rounded-t-2xl border-b border-[#F3F4F6] bg-header px-5 py-4 dark:border-[#334155]">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-md">
                            <ArrowRightLeft size={16} className="text-[#FFFFFF]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[#FFFFFF]">Transfer Data to Misc Master</h2>
                            <p className="text-lg text-[#94A3B8]">Default_Mst se Misc_Mst me 0% duplicate data transfer karein</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#FFFFFF] transition-all hover:text-[#EF4444] active:scale-95"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="flex flex-1 flex-col overflow-hidden px-5 py-4 space-y-3">

                    {/* Error */}
                    {error && (
                        <div className="flex items-start gap-2 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2.5 dark:border-[#7F1D1D] dark:bg-[#450A0A]/40">
                            <AlertCircle size={14} className="mt-0.5 shrink-0 text-[#DC2626]" />
                            <p className="text-lg font-medium text-[#7F1D1D] dark:text-[#FCA5A5]">{error}</p>
                        </div>
                    )}

                    {/* Result Banner if already transferred */}
                    {transferResult && (
                        <div className="rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] p-3 dark:border-[#14532D] dark:bg-[#052E16]/40">
                            <div className="flex items-center gap-2 text-lg font-bold text-[#15803D] dark:text-[#86EFAC]">
                                <CheckCircle2 size={16} />
                                <span>{transferResult.message}</span>
                            </div>
                            <div className="mt-2 flex gap-4 text-lg font-semibold">
                                <span className="rounded-md bg-[#DCFCE7] px-2 py-1 text-[#15803D]">
                                    Inserted: {transferResult.total_transferred ?? 0}
                                </span>
                                <span className="rounded-md bg-[#FEF3C7] px-2 py-1 text-[#B45309]">
                                    Duplicates Skipped: {transferResult.total_skipped ?? 0}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Search & Select All Bar */}
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search Misc Type or Name..."
                                className="h-9 w-full rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] pl-8 pr-3 text-lg text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:border-primary dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#F9FAFB]"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleSelectAll}
                            disabled={loadingTypes || filteredTypes.length === 0}
                            className="h-9 shrink-0 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-lg font-semibold text-[#374151] hover:bg-[#F3F4F6] disabled:opacity-50 dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#D1D5DB]"
                        >
                            {selectedTypes.length === filteredTypes.length && filteredTypes.length > 0
                                ? "Deselect All"
                                : "Select All"}
                        </button>
                    </div>

                    {/* Types List with Checkboxes */}
                    <div className="flex-1 overflow-y-auto rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-2 dark:border-[#334155] dark:bg-[#0F172A]">
                        {loadingTypes ? (
                            <div className="py-12 text-center">
                                <Loader2 size={24} className="mx-auto animate-spin text-primary" />
                                <p className="mt-2 text-lg text-[#9CA3AF]">Loading Misc Types from Default_Mst...</p>
                            </div>
                        ) : filteredTypes.length === 0 ? (
                            <div className="py-12 text-center text-lg text-[#9CA3AF]">
                                {searchQuery ? "No matching Misc Types found." : "No Misc Types available."}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                                {filteredTypes.map((code) => {
                                    const codeStr = String(code);
                                    const name = MISC_TYPE_MAPPING[codeStr] || `Misc Type ${codeStr}`;
                                    const isChecked = selectedTypes.includes(code);

                                    return (
                                        <label
                                            key={code}
                                            className={`flex cursor-pointer items-center gap-2.5 rounded-lg border p-2 transition-all select-none ${
                                                isChecked
                                                    ? "border-primary bg-primary/10 shadow-xs dark:bg-primary/20"
                                                    : "border-[#E5E7EB] bg-[#FFFFFF] hover:bg-[#F3F4F6] dark:border-[#334155] dark:bg-[#1E293B] dark:hover:bg-[#334155]/50"
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => handleToggle(code)}
                                                className="h-4 w-4 rounded accent-primary cursor-pointer"
                                            />
                                            <span className={`inline-flex h-5 min-w-[28px] items-center justify-center rounded px-1 text-lg font-bold ${
                                                isChecked
                                                    ? "bg-primary text-[#FFFFFF]"
                                                    : "bg-[#E5E7EB] text-[#374151] dark:bg-[#334155] dark:text-[#D1D5DB]"
                                            }`}>
                                                {code}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <p className={`truncate text-lg font-semibold ${
                                                        isChecked ? "text-primary" : "text-[#111827] dark:text-[#F9FAFB]"
                                                    }`}>
                                                        {name}
                                                    </p>
                                                    {code === 1001 && (
                                                        <span className="shrink-0 rounded bg-[#EDE9FE] px-1.5 py-0.5 text-[10px] font-bold text-[#6D28D9] dark:bg-[#5B21B6]/30 dark:text-[#C4B5FD]">
                                                            Mobile Rights (Emp_Code=0)
                                                        </span>
                                                    )}
                                                </div>
                                                {MISC_TYPE_DESC[codeStr] && (
                                                    <p className="truncate text-lg text-[#9CA3AF] dark:text-[#6B7280]">
                                                        {MISC_TYPE_DESC[codeStr]}
                                                    </p>
                                                )}
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Selection Counter */}
                    <div className="flex items-center justify-between text-lg text-[#6B7280] dark:text-[#9CA3AF] px-1">
                        <span>
                            Selected: <strong className="text-primary">{selectedTypes.length}</strong> of {types.length} types
                        </span>
                        <span>Company: <strong>{user?.Comp_Code || user?.compcode || "Default"}</strong></span>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 border-t border-[#E5E7EB] px-5 py-3 dark:border-[#334155]">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={transferring}
                        className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-2 text-lg font-semibold text-[#374151] hover:bg-[#F3F4F6] disabled:opacity-60 dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#D1D5DB]"
                    >
                        {transferResult ? "Close" : "Cancel"}
                    </button>
                    <button
                        type="button"
                        onClick={handleTransfer}
                        disabled={transferring || selectedTypes.length === 0}
                        className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-lg font-bold text-[#FFFFFF] shadow-md transition-all hover:opacity-90 disabled:opacity-50 active:scale-95"
                    >
                        {transferring ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Transferring Data…
                            </>
                        ) : (
                            <>
                                <ArrowRightLeft size={16} />
                                Transfer Selected ({selectedTypes.length})
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
}

// ============================================================
// MOBILE RIGHTS TREE VIEW (for Misc_Type = 1001)
// ============================================================
type MobileTreeNode = {
    title: any;
    key: string;
    children?: MobileTreeNode[];
};

const HighlightText: React.FC<{ text: string; highlight: string }> = ({ text, highlight }) => {
    if (!highlight) return <span>{text}</span>;
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return (
        <span>
            {parts.map((part, i) =>
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <mark key={i} style={{ backgroundColor: "#FEF08A", color: "#854D0E", padding: "0 2px", borderRadius: "2px" }}>
                        {part}
                    </mark>
                ) : (
                    part
                )
            )}
        </span>
    );
};

const filterTreeNodes = (
    data: MobileTreeNode[],
    searchText: string
): [MobileTreeNode[], string[]] => {
    let uniqueKeySet = new Set<string>();
    const filteredData = (data || []).reduce((acc: MobileTreeNode[], node: MobileTreeNode) => {
        const titleStr = typeof node.title === "string" ? node.title : String(node.title || "");
        const lowerSearchText = searchText.toLowerCase();
        const matches = titleStr.toLowerCase().includes(lowerSearchText);

        const [filteredChildren, childKeys] = filterTreeNodes(node.children || [], searchText);

        if (matches || filteredChildren.length > 0) {
            acc.push({
                title: searchText ? <HighlightText text={titleStr} highlight={searchText} /> : titleStr,
                key: node.key,
                children: filteredChildren,
            });
            uniqueKeySet.add(node.key);
        }
        childKeys.forEach((childKey) => uniqueKeySet.add(childKey));
        return acc;
    }, []);
    return [filteredData, Array.from(uniqueKeySet)];
};

const getAllTreeKeys = (data: MobileTreeNode[]): string[] => {
    let keys: string[] = [];
    (data || []).forEach((node) => {
        keys.push(node.key);
        if (node.children && node.children.length > 0) {
            keys = [...keys, ...getAllTreeKeys(node.children)];
        }
    });
    return keys;
};

const isKeyInTree = (data: MobileTreeNode[], key: string): boolean => {
    for (const node of data) {
        if (node.key === key) return true;
        if (node.children && isKeyInTree(node.children, key)) return true;
    }
    return false;
};

const getLeafKeys = (data: MobileTreeNode[]): string[] => {
    let leafKeys: string[] = [];
    (data || []).forEach((node) => {
        if (node.children && node.children.length > 0) {
            leafKeys = [...leafKeys, ...getLeafKeys(node.children)];
        } else {
            leafKeys.push(node.key);
        }
    });
    return leafKeys;
};

const areAllChildrenChecked = (node: MobileTreeNode, keys: string[]): boolean => {
    if (!node.children || node.children.length === 0) return false;
    const leafKeys = getLeafKeys(node.children);
    return leafKeys.every((leafKey) => keys.includes(leafKey));
};

interface MobileRightsTreeViewProps {
    records: MiscRecord[];
    user: any;
    onSaveSuccess: (count: number) => void;
    loading: boolean;
    onRefresh: () => void;
    onToggleView: () => void;
}

function MobileRightsTreeView({
    records,
    user,
    onSaveSuccess,
    loading: parentLoading,
    onRefresh,
    onToggleView,
}: MobileRightsTreeViewProps) {
    const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
    const [expandedKeys, setExpandedKeys] = useState<string[]>(["1", "1.1"]);
    const [autoExpandParent, setAutoExpandParent] = useState(true);
    const [findRights, setFindRights] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Sync records from Default_Mst to checkedKeys on load
    useEffect(() => {
        const keysFromDb = records
            .map((r) => String(r.Misc_Name ?? r.misc_name ?? "").trim())
            .filter(Boolean);

        if (keysFromDb.length === 0) {
            setCheckedKeys([]);
            return;
        }

        const finalCheckedKeys: string[] = [];
        const recursiveCheck = (nodes: MobileTreeNode[]) => {
            nodes.forEach((node) => {
                if (node.children && node.children.length > 0) {
                    if (areAllChildrenChecked(node, keysFromDb)) {
                        finalCheckedKeys.push(node.key);
                        const leafKeys = getLeafKeys(node.children || []);
                        finalCheckedKeys.push(...leafKeys);
                    } else {
                        recursiveCheck(node.children);
                    }
                } else {
                    if (keysFromDb.includes(node.key)) {
                        finalCheckedKeys.push(node.key);
                    }
                }
            });
        };
        recursiveCheck(treeData as MobileTreeNode[]);
        setCheckedKeys(Array.from(new Set(finalCheckedKeys.length > 0 ? finalCheckedKeys : keysFromDb)));
    }, [records]);

    // Live search filter & highlighting
    const [filteredTreeData, searchMatchKeys] = useMemo(() => {
        if (!findRights.trim()) return [treeData as MobileTreeNode[], [] as string[]];
        return filterTreeNodes(treeData as MobileTreeNode[], findRights.trim());
    }, [findRights]);

    // Auto expand search results
    useEffect(() => {
        if (findRights.trim()) {
            setExpandedKeys(searchMatchKeys);
            setAutoExpandParent(true);
        }
    }, [findRights, searchMatchKeys]);

    const handleExpand = (newExpandedKeys: any) => {
        setExpandedKeys(newExpandedKeys);
        setAutoExpandParent(false);
    };

    const handleCheck = (newCheckedKeys: any) => {
        const rawKeys: string[] = Array.isArray(newCheckedKeys)
            ? (newCheckedKeys as string[])
            : (newCheckedKeys.checked as string[]) || [];

        const prevCheckedNotInFilter = checkedKeys.filter(
            (k) => !rawKeys.includes(k) && !isKeyInTree(filteredTreeData, k)
        );
        const mergedKeys = Array.from(new Set([...rawKeys, ...prevCheckedNotInFilter]));

        const finalCheckedKeys: string[] = [];
        const recursiveCheck = (nodes: MobileTreeNode[]) => {
            nodes.forEach((node) => {
                if (node.children && node.children.length > 0) {
                    if (areAllChildrenChecked(node, mergedKeys)) {
                        finalCheckedKeys.push(node.key);
                        const leafKeys = getLeafKeys(node.children || []);
                        finalCheckedKeys.push(...leafKeys);
                    } else {
                        recursiveCheck(node.children);
                    }
                } else {
                    if (mergedKeys.includes(node.key)) {
                        finalCheckedKeys.push(node.key);
                    }
                }
            });
        };
        recursiveCheck(treeData as MobileTreeNode[]);
        setCheckedKeys(Array.from(new Set(finalCheckedKeys)));
    };

    const handleSelectAll = () => {
        const allKeys = getAllTreeKeys(treeData as MobileTreeNode[]);
        setCheckedKeys(allKeys);
    };

    const handleDeselectAll = () => {
        setCheckedKeys([]);
    };

    const handleExpandAll = () => {
        const allKeys = getAllTreeKeys(treeData as MobileTreeNode[]);
        setExpandedKeys(allKeys);
    };

    const handleCollapseAll = () => {
        setExpandedKeys([]);
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const res = await axios.post<APIResponse>(
                `${BASE_URL}/misc/save_mobile_rights`,
                {
                    checkedKeys,
                    moduleCode: 10, // Module Code 10 by default for all Mobile Rights
                },
                { headers: buildHeaders(user), timeout: 30000 }
            );

            if (res.data.success) {
                onSaveSuccess(checkedKeys.length);
            } else {
                setError(res.data.message || "Failed to save Mobile Rights");
            }
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-1 flex-col overflow-hidden bg-[#FFFFFF] dark:bg-[#1E293B]">
            {/* Header */}
            <div className="shrink-0 border-b border-[#E5E7EB] bg-[#FFFFFF] px-5 py-3.5 dark:border-[#334155] dark:bg-[#1E293B]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* Left: Icon & Title */}
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-xs">
                            <GrUserAdmin size={20} className="text-primary" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-bold text-[#111827] dark:text-[#F9FAFB]">
                                    Mobile App Rights
                                </h1>
                                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-lg font-bold text-primary">
                                    Type 1001
                                </span>
                            </div>
                            <p className="text-lg text-[#6B7280] dark:text-[#9CA3AF]">
                                <span className="font-semibold text-primary">{checkedKeys.length}</span> rights selected · Module Code: <strong className="font-semibold text-[#111827] dark:text-[#F9FAFB]">10</strong> (Default)
                            </p>
                        </div>
                    </div>

                    {/* Right: Actions and Search */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Search Input */}
                        <div className="relative">
                            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                            <input
                                type="text"
                                value={findRights}
                                onChange={(e) => setFindRights(e.target.value)}
                                placeholder="Search Mobile Rights…"
                                className="h-10 w-56 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] pl-8 pr-7 text-lg text-[#111827] outline-none placeholder:text-[#9CA3AF] transition-all focus:border-primary focus:bg-[#FFFFFF] dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#F9FAFB] dark:focus:bg-[#1E293B]"
                            />
                            {findRights && (
                                <button
                                    type="button"
                                    onClick={() => setFindRights("")}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#FFFFFF]"
                                >
                                    <X size={13} />
                                </button>
                            )}
                        </div>

                        {/* Refresh */}
                        <button
                            type="button"
                            onClick={onRefresh}
                            disabled={parentLoading || saving}
                            className="flex h-10 items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-lg font-semibold text-[#374151] transition-all hover:bg-[#F3F4F6] disabled:opacity-60 active:scale-95 dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#D1D5DB]"
                        >
                            <RefreshCw size={13} className={parentLoading ? "animate-spin" : ""} />
                            Refresh
                        </button>

                        {/* Switch to Table View */}
                        <button
                            type="button"
                            onClick={onToggleView}
                            className="flex h-10 items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-lg font-semibold text-[#374151] transition-all hover:bg-[#F3F4F6] active:scale-95 dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#D1D5DB]"
                        >
                            Table View
                        </button>

                        {/* Save / Update Rights Button */}
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving || parentLoading}
                            className="flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-lg font-bold text-[#FFFFFF] shadow-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                        >
                            {saving ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" />
                                    Saving…
                                </>
                            ) : (
                                <>
                                    <Save size={14} />
                                    Save / Update Rights ({checkedKeys.length})
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Sub-bar: Quick toggles & Stats */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#E5E7EB] pt-2.5 text-lg text-[#6B7280] dark:border-[#334155] dark:text-[#9CA3AF]">
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={handleSelectAll}
                            className="rounded-md border border-[#E5E7EB] bg-[#F9FAFB] px-2.5 py-1 text-lg font-semibold text-[#374151] shadow-xs hover:bg-[#F3F4F6] hover:text-primary active:scale-95 transition-all dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#D1D5DB] dark:hover:text-primary"
                        >
                            Select All
                        </button>
                        <button
                            type="button"
                            onClick={handleDeselectAll}
                            className="rounded-md border border-[#E5E7EB] bg-[#F9FAFB] px-2.5 py-1 text-lg font-semibold text-[#374151] shadow-xs hover:bg-[#F3F4F6] hover:text-[#DC2626] active:scale-95 transition-all dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#D1D5DB]"
                        >
                            Deselect All
                        </button>
                        <span className="text-[#D1D5DB] dark:text-[#475569] mx-0.5">·</span>
                        <button
                            type="button"
                            onClick={handleExpandAll}
                            className="rounded-md border border-[#E5E7EB] bg-[#F9FAFB] px-2.5 py-1 text-lg font-semibold text-[#374151] shadow-xs hover:bg-[#F3F4F6] hover:text-primary active:scale-95 transition-all dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#D1D5DB] dark:hover:text-primary"
                        >
                            Expand All
                        </button>
                        <button
                            type="button"
                            onClick={handleCollapseAll}
                            className="rounded-md border border-[#E5E7EB] bg-[#F9FAFB] px-2.5 py-1 text-lg font-semibold text-[#374151] shadow-xs hover:bg-[#F3F4F6] hover:text-primary active:scale-95 transition-all dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#D1D5DB] dark:hover:text-primary"
                        >
                            Collapse All
                        </button>
                    </div>

                    <div className="flex items-center gap-2 text-lg font-medium">
                        <span className="rounded-md bg-[#F3F4F6] px-2.5 py-1 text-[#4B5563] dark:bg-[#0F172A] dark:text-[#9CA3AF]">
                            Database Saved: <strong className="font-bold text-[#111827] dark:text-[#F9FAFB]">{records.length}</strong>
                        </span>
                        <span className="rounded-md bg-primary/10 px-2.5 py-1 text-primary">
                            Selected: <strong className="font-bold">{checkedKeys.length}</strong>
                        </span>
                    </div>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="mx-5 mt-3 flex items-start gap-2 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-lg text-[#7F1D1D] dark:border-[#7F1D1D] dark:bg-[#450A0A]/40 dark:text-[#FCA5A5]">
                    <AlertCircle size={14} className="mt-0.5 shrink-0 text-[#DC2626]" />
                    <p>{error}</p>
                </div>
            )}

            {/* Tree Container matching the screenshot */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
                {parentLoading ? (
                    <div className="py-20 text-center">
                        <Loader2 size={24} className="mx-auto animate-spin text-primary" />
                        <p className="mt-2 text-lg text-[#9CA3AF]">Loading Mobile Rights from Default_Mst…</p>
                    </div>
                ) : (
                    <div className="rounded-xl border border-[#E5E7EB] bg-[#FFFFFF] p-6 shadow-xs dark:border-[#334155] dark:bg-[#0F172A]">
                        <Tree
                            showLine
                            checkable
                            checkedKeys={checkedKeys}
                            expandedKeys={expandedKeys}
                            autoExpandParent={autoExpandParent}
                            onCheck={handleCheck}
                            onExpand={handleExpand}
                            treeData={filteredTreeData}
                            className="bg-transparent dark:text-[#FFFFFF] py-2 font-semibold text-lg uppercase select-none"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function MiscMasterPage() {
    const router = useRouter();
    const user = useCurrentUser() as any;

    const [availableTypes, setAvailableTypes] = useState<string[]>(["1001"]);
    const [loadingTypes, setLoadingTypes] = useState(true);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [records, setRecords] = useState<MiscRecord[]>([]);
    const [columns, setColumns] = useState<ColumnInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchLeft, setSearchLeft] = useState("");
    const [searchTable, setSearchTable] = useState("");
    const [showDesc, setShowDesc] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [createInitialType, setCreateInitialType] = useState<string | null>(null);
    const [showEdit, setShowEdit] = useState(false);
    const [editingRecord, setEditingRecord] = useState<MiscRecord | null>(null);
    const [showTransfer, setShowTransfer] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [viewMode1001, setViewMode1001] = useState<"tree" | "table">("tree");

    // ── Fetch Available Misc Types ────────────────────────
    useEffect(() => {
        let isMounted = true;
        const fetchMiscTypes = async () => {
            setLoadingTypes(true);
            try {
                const res = await axios.get<APIResponse<MiscTypeItem[]>>(
                    `${BASE_URL}/misc/misc_types`,
                    { headers: buildHeaders(user), timeout: 30000 }
                );

                if (isMounted) {
                    if (res.data?.success && Array.isArray(res.data.data)) {
                        const types = res.data.data
                            .map((item) => String(item.Misc_Type))
                            .filter((type) => MISC_TYPE_MAPPING[type]); // Only show types in mapping

                        // 1001 must ALWAYS be present in sidebar whether returned from API or not
                        const combined = Array.from(new Set([...types, "1001"]));
                        setAvailableTypes(combined);
                    } else {
                        setAvailableTypes((prev) => Array.from(new Set([...prev, "1001"])));
                    }
                }
            } catch (err) {
                if (isMounted) {
                    setAvailableTypes((prev) => Array.from(new Set([...prev, "1001"])));
                    setError(getErrorMessage(err));
                }
            } finally {
                if (isMounted) {
                    setLoadingTypes(false);
                }
            }
        };

        if (user) {
            fetchMiscTypes();
        } else {
            setLoadingTypes(false);
        }

        return () => {
            isMounted = false;
        };
    }, [user]);

    // 1001 is GUARANTEED to ALWAYS be present in the sidebar, whether returned from API or not
    const allSidebarTypes = useMemo(() => {
        const types = new Set(availableTypes);
        types.add("1001");
        return Array.from(types);
    }, [availableTypes]);

    // Filter types based on available types (1001 is ALWAYS included)
    const filteredTypes = useMemo(() => {
        return allSidebarTypes
            .filter((code) => {
                const name = MISC_TYPE_MAPPING[code];
                return name && (
                    name.toLowerCase().includes(searchLeft.toLowerCase()) ||
                    code.includes(searchLeft)
                );
            })
            .sort((a, b) => parseInt(a) - parseInt(b));
    }, [allSidebarTypes, searchLeft]);

    // ── Fetch Data ─────────────────────────────────────────
    const fetchData = useCallback(async (type: string) => {
        setLoading(true);
        setError(null);
        setRecords([]);
        setColumns([]);
        try {
            const res = await axios.get<APIResponse<MiscRecord[]>>(
                `${BASE_URL}/misc/${type}`,
                { headers: buildHeaders(user), timeout: 30000 }
            );
            setRecords(res.data?.data || []);
            setColumns(res.data?.columns || []);
            setSearchTable("");
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, [user]);

    const hasInitialSelected = useRef(false);

    const handleToggleViewMode1001 = (mode: "tree" | "table") => {
        setViewMode1001(mode);
        if (typeof window !== "undefined") {
            localStorage.setItem("default_mst_view_mode_1001", mode);
        }
    };

    const handleSelect = (type: string) => {
        setSelectedType(type);
        setSearchTable("");
        setSuccessMsg(null);
        if (typeof window !== "undefined") {
            localStorage.setItem("default_mst_selected_type", type);
        }
        if (type === "1001") {
            const savedView = typeof window !== "undefined" ? localStorage.getItem("default_mst_view_mode_1001") : null;
            if (savedView === "table" || savedView === "tree") {
                setViewMode1001(savedView);
            } else {
                setViewMode1001("tree");
            }
        }
        fetchData(type);
    };

    // Auto-select on refresh: stay in previous tab, or open first tab by default
    useEffect(() => {
        if (!user) return;
        if (hasInitialSelected.current) return;
        if (typeof window === "undefined") return;

        const savedType = localStorage.getItem("default_mst_selected_type");
        const savedViewMode = localStorage.getItem("default_mst_view_mode_1001");
        if (savedViewMode === "table" || savedViewMode === "tree") {
            setViewMode1001(savedViewMode);
        }

        // 1. If previously selected type exists in MISC_TYPE_MAPPING, restore it on refresh
        if (savedType && MISC_TYPE_MAPPING[savedType]) {
            hasInitialSelected.current = true;
            setSelectedType(savedType);
            fetchData(savedType);
            return;
        }

        // 2. If no saved type (first time open), open by default the FIRST type in the sidebar once types are loaded
        if (!loadingTypes && filteredTypes.length > 0) {
            const firstType = filteredTypes[0];
            hasInitialSelected.current = true;
            setSelectedType(firstType);
            localStorage.setItem("default_mst_selected_type", firstType);
            fetchData(firstType);
        }
    }, [user, loadingTypes, filteredTypes, fetchData]);

    // ── Form Config for selected type ─────────────────────
    const formConfig = selectedType ? getFormConfig(selectedType) : null;

    // ── Config field keys ──────────────────────────────────
    const configFieldKeys = formConfig?.fields.map((f) => f.key) || [];

    // ── Table Columns - Based strictly on misc_form_config.ts ──
    const visibleColumns: ColumnInfo[] = useMemo(() => {
        const cols: ColumnInfo[] = [];

        // 1. Misc_Code (hamesha first column)
        const miscCodeCol = columns.find((c) => c.ColumnName.toLowerCase() === "misc_code");
        if (miscCodeCol) {
            cols.push(miscCodeCol);
        } else {
            cols.push({ ColumnName: "Misc_Code", DataType: "int", MaxLength: null });
        }

        // 2. Jitne bhi fields misc_form_config.ts me define hain, wo sab table columns me aayenge
        if (formConfig && formConfig.fields && formConfig.fields.length > 0 && formConfig.Misc_Type !== 0) {
            for (const field of formConfig.fields) {
                // Agar field Misc_Code ho to skip (already added at #1)
                if (field.key.toLowerCase() === "misc_code") continue;

                const matched = columns.find(
                    (c) => c.ColumnName.toLowerCase() === field.key.toLowerCase()
                );
                if (matched) {
                    cols.push(matched);
                } else {
                    cols.push({
                        ColumnName: field.key,
                        DataType: field.type === "number" ? "int" : "varchar",
                        MaxLength: field.maxLength || null,
                    });
                }
            }
        } else {
            // Fallback: agar type ka special config na ho to Misc_Name + other non-empty columns
            const miscNameCol = columns.find((c) => c.ColumnName.toLowerCase() === "misc_name");
            if (miscNameCol) cols.push(miscNameCol);

            columns.forEach((col) => {
                if (["misc_code", "misc_name"].includes(col.ColumnName.toLowerCase())) return;
                if (SKIP_COLUMNS.includes(col.ColumnName)) return;

                const hasData = records.some(
                    (r) => r[col.ColumnName] !== null &&
                        r[col.ColumnName] !== undefined &&
                        r[col.ColumnName] !== ""
                );
                if (hasData) cols.push(col);
            });
        }

        return cols;
    }, [columns, formConfig, records]);

    // ── Table column header label ──────────────────────────
    const getColLabel = (colName: string): string => {
        if (colName.toLowerCase() === "misc_code") return "Code";
        if (!formConfig) return colName;
        const f = formConfig.fields.find(
            (fc) => fc.key.toLowerCase() === colName.toLowerCase()
        );
        return f ? f.label : colName;
    };

    // ── Search filter ──────────────────────────────────────
    const filteredRecords = records.filter((r) =>
        Object.values(r).some((v) =>
            String(v ?? "").toLowerCase().includes(searchTable.toLowerCase())
        )
    );

    // ── Stats ──────────────────────────────────────────────
    const activeCol = columns.find((c) =>
        c.ColumnName.toLowerCase() === "active" ||
        c.ColumnName.toLowerCase().includes("status")
    );
    const activeCount = activeCol
        ? records.filter((r) => { const v = r[activeCol.ColumnName]; return v === 1 || v === true || v === null || v === undefined; }).length
        : records.length;
    const inactiveCount = activeCol
        ? records.filter((r) => { const v = r[activeCol.ColumnName]; return v === 0 || v === false; }).length
        : 0;

    const handleCreateSuccess = (name: string) => {
        setShowCreate(false);
        setSuccessMsg(`"${name}" created successfully!`);
        // Refresh both types list and current data
        if (selectedType) fetchData(selectedType);
        setTimeout(() => setSuccessMsg(null), 4000);
    };

    const handleOpenEdit = (record: MiscRecord) => {
        setEditingRecord(record);
        setShowEdit(true);
    };

    const handleEditSuccess = (name: string) => {
        setShowEdit(false);
        setEditingRecord(null);
        setSuccessMsg(`"${name}" updated successfully!`);
        if (selectedType) fetchData(selectedType);
        setTimeout(() => setSuccessMsg(null), 4000);
    };

    // ══════════════════════════════════════════════════════
    return (
        <>
            {/* Create Modal */}
            {showCreate && (
                <CreateModalHeader
                    onClose={() => {
                        setShowCreate(false);
                        setCreateInitialType(null);
                    }}
                    onSuccess={handleCreateSuccess}
                    user={user}
                    availableTypes={availableTypes}
                    initialMiscType={createInitialType}
                />
            )}

            {/* Edit Modal */}
            {showEdit && editingRecord && selectedType && (
                <EditModal
                    onClose={() => {
                        setShowEdit(false);
                        setEditingRecord(null);
                    }}
                    onSuccess={handleEditSuccess}
                    user={user}
                    selectedMiscType={selectedType}
                    record={editingRecord}
                    visibleColumns={visibleColumns}
                />
            )}

            {/* Transfer Modal */}
            {showTransfer && (
                <TransferModal
                    onClose={() => setShowTransfer(false)}
                    onSuccess={(msg) => {
                        setSuccessMsg(msg);
                        if (selectedType) fetchData(selectedType);
                        setTimeout(() => setSuccessMsg(null), 5000);
                    }}
                    user={user}
                />
            )}

            <div className="flex h-[calc(100vh-60px)] flex-col overflow-hidden">

                {/* ══ HEADER ══ */}
                <div className="relative shrink-0 overflow-hidden border-b border-[#334155] bg-header px-5 py-4">
                    <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-md">
                                <Database size={20} className="text-[#FFFFFF]" />
                            </div>
                            <div>
                                <h1 className="text-base font-bold text-[#FFFFFF]">Misc Master Viewer</h1>
                                <p className="text-lg text-[#94A3B8]">Browse all Misc_Type records from Misc_Mst table</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setShowTransfer(true)}
                                className="flex h-12 items-center gap-1.5 rounded-lg border border-[#FFFFFF]/15 bg-primary px-3 text-lg font-bold text-[#FFFFFF] backdrop-blur-sm transition-all hover:bg-[#FFFFFF]/20 active:scale-95"
                            >
                                <ArrowRightLeft size={18} />
                                Transfer Data
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setCreateInitialType(null);
                                    setShowCreate(true);
                                }}
                                className="flex h-12 items-center gap-1.5 rounded-lg border border-[#FFFFFF]/15 bg-primary px-3 text-lg font-bold text-[#FFFFFF] backdrop-blur-sm transition-all hover:bg-[#FFFFFF]/20 active:scale-95"
                            >
                                <Plus size={18} />
                                Create New
                            </button>
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="flex h-12 items-center gap-1.5 rounded-lg border border-[#FFFFFF]/15 bg-[#FFFFFF]/10 px-3 text-lg font-bold text-[#FFFFFF] backdrop-blur-sm transition-all hover:bg-[#FFFFFF]/20 active:scale-95"
                            >
                                <ArrowLeft size={18} />
                                Back
                            </button>
                        </div>
                    </div>
                </div>

                {/* ══ BODY ══ */}
                <div className="flex flex-1 overflow-hidden">

                    {/* ── LEFT SIDEBAR ── */}
                    <div className="flex w-70 shrink-0 flex-col border-r border-[#E5E7EB] bg-[#F9FAFB] dark:border-[#334155] dark:bg-[#0F172A]">
                        <div className="border-b border-[#E5E7EB] px-3 py-3 dark:border-[#334155]">
                            <div className="mb-2 flex items-center justify-between">
                                <p className="text-lg font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#9CA3AF]">
                                    Misc Types ({filteredTypes.length})
                                </p>
                                {loadingTypes && (
                                    <Loader2 size={14} className="animate-spin text-primary" />
                                )}
                            </div>
                            <div className="relative">
                                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                                <input
                                    value={searchLeft}
                                    onChange={(e) => setSearchLeft(e.target.value)}
                                    placeholder="Search type..."
                                    className="h-8 w-full rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] pl-7 pr-2 text-lg text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:border-primary dark:border-[#334155] dark:bg-[#1E293B] dark:text-[#F9FAFB] dark:placeholder:text-[#6B7280]"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto py-1">
                            {filteredTypes.length === 0 ? (
                                <div className="px-3 py-8 text-center text-lg text-[#9CA3AF]">
                                    {loadingTypes ? (
                                        <>
                                            <Loader2 size={20} className="mx-auto animate-spin text-primary" />
                                            <p className="mt-2 text-lg text-[#9CA3AF]">Loading types...</p>
                                        </>
                                    ) : searchLeft ? (
                                        "No types found"
                                    ) : (
                                        "No Misc Types available"
                                    )}
                                </div>
                            ) : (
                                filteredTypes.map((code) => {
                                    const name = MISC_TYPE_MAPPING[code];
                                    const isSelected = selectedType === code;
                                    return (
                                        <div key={code} className="relative">
                                            <button
                                                type="button"
                                                onClick={() => handleSelect(code)}
                                                onMouseEnter={() => setShowDesc(code)}
                                                onMouseLeave={() => setShowDesc(null)}
                                                className={`flex w-full items-center gap-2 px-3 py-2.5 text-left transition-all ${isSelected
                                                    ? "border-r-2 border-primary bg-primary/10"
                                                    : "hover:bg-[#F3F4F6] dark:hover:bg-[#1E293B]"
                                                    }`}
                                            >
                                                <span className={`inline-flex h-6 min-w-[32px] items-center justify-center rounded-md px-1 text-lg font-bold ${isSelected
                                                    ? "bg-primary text-[#FFFFFF]"
                                                    : "bg-[#E5E7EB] text-[#374151] dark:bg-[#334155] dark:text-[#D1D5DB]"
                                                    }`}>
                                                    {code}
                                                </span>
                                                <span className={`flex-1 truncate text-lg font-medium ${isSelected ? "text-primary" : "text-[#374151] dark:text-[#D1D5DB]"
                                                    }`}>
                                                    {name}
                                                </span>
                                                {isSelected && <ChevronRight size={13} className="shrink-0 text-primary" />}
                                            </button>

                                            {showDesc === code && MISC_TYPE_DESC[code] && (
                                                <div className="absolute left-full top-0 z-50 ml-2 w-64 rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] p-2.5 shadow-xl dark:border-[#334155] dark:bg-[#1E293B]">
                                                    <p className="text-lg leading-relaxed text-[#374151] dark:text-[#D1D5DB]">
                                                        <span className="font-bold text-primary">Type {code}: </span>
                                                        {MISC_TYPE_DESC[code]}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* ── RIGHT CONTENT ── */}
                    <div className="flex flex-1 flex-col overflow-hidden bg-[#FFFFFF] dark:bg-[#1E293B]">

                        {/* No Selection */}
                        {!selectedType && (
                            <div className="flex flex-1 items-center justify-center">
                                <div className="text-center">
                                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F9FAFB] dark:bg-[#0F172A]">
                                        <Database size={28} className="text-[#D1D5DB] dark:text-[#374151]" />
                                    </div>
                                    <p className="text-lg font-semibold text-[#374151] dark:text-[#9CA3AF]">Select a Misc Type</p>
                                    <p className="mt-1 text-lg text-[#9CA3AF] dark:text-[#6B7280]">
                                        Click any type from the left panel to view records
                                    </p>
                                </div>
                            </div>
                        )}

                        {selectedType && (
                            selectedType === "1001" && viewMode1001 === "tree" ? (
                                <MobileRightsTreeView
                                    records={records}
                                    user={user}
                                    onSaveSuccess={(count) => {
                                        setSuccessMsg(`Mobile Rights saved successfully (${count} rights saved with Module Code 10)!`);
                                        fetchData("1001");
                                        setTimeout(() => setSuccessMsg(null), 4500);
                                    }}
                                    loading={loading}
                                    onRefresh={() => fetchData("1001")}
                                    onToggleView={() => handleToggleViewMode1001("table")}
                                />
                            ) : (
                                <>
                                    {/* Content Header */}
                                    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#E5E7EB] px-5 py-3 dark:border-[#334155]">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 min-w-[36px] items-center justify-center rounded-xl bg-primary/10 px-2">
                                                <span className="text-lg font-bold text-primary">{selectedType}</span>
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-bold text-[#111827] dark:text-[#F9FAFB]">
                                                    {MISC_TYPE_MAPPING[selectedType]}
                                                </h2>
                                                <p className="text-lg text-[#6B7280] dark:text-[#9CA3AF]">
                                                    {loading
                                                        ? "Loading…"
                                                        : `${filteredRecords.length} of ${records.length} records · ${visibleColumns.length} columns`
                                                    }
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">

                                            {/* Info */}
                                            {MISC_TYPE_DESC[selectedType] && (
                                                <div className="group relative">
                                                    <button
                                                        type="button"
                                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] text-[#9CA3AF] hover:text-primary dark:border-[#334155] dark:bg-[#0F172A]"
                                                    >
                                                        <Info size={13} />
                                                    </button>
                                                    <div className="absolute right-0 top-full z-50 mt-1 hidden w-72 rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] p-3 shadow-xl group-hover:block dark:border-[#334155] dark:bg-[#1E293B]">
                                                        <p className="text-lg leading-relaxed text-[#374151] dark:text-[#D1D5DB]">
                                                            {MISC_TYPE_DESC[selectedType]}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Search */}
                                            <div className="relative">
                                                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                                                <input
                                                    value={searchTable}
                                                    onChange={(e) => setSearchTable(e.target.value)}
                                                    placeholder="Search records…"
                                                    className="h-12 w-56 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] pl-7 pr-2 text-lg text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:border-primary dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#F9FAFB]"
                                                />
                                            </div>

                                            {/* Refresh */}
                                            <button
                                                type="button"
                                                onClick={() => fetchData(selectedType)}
                                                disabled={loading}
                                                className="flex h-12 items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-lg font-semibold text-[#374151] transition-all hover:bg-[#F3F4F6] disabled:opacity-60 active:scale-95 dark:border-[#334155] dark:bg-[#0F172A] dark:text-[#D1D5DB]"
                                            >
                                                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                                                Refresh
                                            </button>

                                            {/* Switch to Tree View if 1001 */}
                                            {selectedType === "1001" && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleViewMode1001("tree")}
                                                    className="flex h-12 items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 text-lg font-bold text-primary transition-all hover:bg-primary/20 active:scale-95"
                                                >
                                                    <GrUserAdmin size={18} />
                                                    Tree View
                                                </button>
                                            )}

                                            {/* Create - Excluded for 1001 */}
                                            {selectedType !== "1001" && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setCreateInitialType(selectedType);
                                                        setShowCreate(true);
                                                    }}
                                                    className="flex h-12 items-center gap-1.5 rounded-lg bg-primary px-3 text-lg font-bold text-[#FFFFFF] shadow-sm transition-all hover:opacity-90 active:scale-95"
                                                >
                                                    <PlusCircle size={18} />
                                                    Create
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                {/* Success */}
                                {successMsg && (
                                    <div className="mx-4 mt-3 flex items-center gap-2 rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] px-3 py-2.5 dark:border-[#14532D] dark:bg-[#052E16]/40">
                                        <CheckCircle2 size={13} className="shrink-0 text-[#16A34A]" />
                                        <p className="flex-1 text-lg font-medium text-[#14532D] dark:text-[#86EFAC]">{successMsg}</p>
                                        <button type="button" onClick={() => setSuccessMsg(null)} className="text-[#9CA3AF] hover:text-[#6B7280]">
                                            <X size={12} />
                                        </button>
                                    </div>
                                )}

                                {/* Error */}
                                {error && (
                                    <div className="mx-4 mt-3 flex items-start gap-2 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2.5 dark:border-[#7F1D1D] dark:bg-[#450A0A]/40">
                                        <AlertCircle size={14} className="mt-0.5 shrink-0 text-[#DC2626]" />
                                        <p className="text-lg font-medium text-[#7F1D1D] dark:text-[#FCA5A5]">{error}</p>
                                    </div>
                                )}

                                {/* Table */}
                                <div className="flex-1 overflow-auto">
                                    <table className="w-full text-left text-lg">
                                        <thead className="sticky top-0 z-10">
                                            <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] dark:border-[#334155] dark:bg-[#0F172A]">
                                                {/* <th className="w-10 px-3 py-2.5 font-semibold uppercase tracking-wider text-[#6B7280] dark:text-[#9CA3AF]">
                                                    #
                                                </th> */}
                                               
                                                {loading
                                                    ? Array.from({ length: 5 }).map((_, i) => (
                                                        <th key={i} className="px-3 py-2.5">
                                                            <div className="h-3 w-16 animate-pulse rounded bg-[#E5E7EB] dark:bg-[#334155]" />
                                                        </th>
                                                    ))
                                                    : visibleColumns.map((col) => (
                                                        <th
                                                            key={col.ColumnName}
                                                            title={`${col.ColumnName} (${col.DataType})`}
                                                            className="whitespace-nowrap px-3 py-2.5 font-semibold uppercase tracking-wider text-[#6B7280] dark:text-[#9CA3AF]"
                                                        >
                                                            {getColLabel(col.ColumnName)}
                                                        </th>
                                                    ))
                                                }
                                                 <th className="w-16 px-3 py-2.5 text-center font-semibold uppercase tracking-wider text-[#6B7280] dark:text-[#9CA3AF]">
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loading ? (
                                                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={visibleColumns.length + 2} />)
                                            ) : filteredRecords.length === 0 ? (
                                                <tr>
                                                    <td colSpan={visibleColumns.length + 2} className="px-4 py-16 text-center">
                                                        <div className="flex flex-col items-center gap-3">
                                                            <Database size={24} className="text-[#D1D5DB] dark:text-[#374151]" />
                                                            <p className="text-lg font-semibold text-[#6B7280] dark:text-[#9CA3AF]">
                                                                {searchTable ? "No matching records found" : "No records found for this type"}
                                                            </p>
                                                            {!searchTable && selectedType !== "1001" && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setCreateInitialType(selectedType);
                                                                        setShowCreate(true);
                                                                    }}
                                                                    className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-lg font-bold text-[#FFFFFF] transition-all hover:opacity-90 active:scale-95"
                                                                >
                                                                    <PlusCircle size={12} />
                                                                    Add First Record
                                                                </button>
                                                            )}
                                                            {selectedType === "1001" && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleToggleViewMode1001("tree")}
                                                                    className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-lg font-bold text-[#FFFFFF] transition-all hover:opacity-90 active:scale-95"
                                                                >
                                                                    <GrUserAdmin size={16} />
                                                                    Open Tree View to Manage Rights
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredRecords.map((row, idx) => (
                                                    <tr
                                                        key={`${row.Misc_Code ?? idx}-${idx}`}
                                                        className="border-b border-[#F9FAFB] transition-colors hover:bg-primary/5 dark:border-[#334155] dark:hover:bg-primary/5"
                                                    >
                                                        {/* <td className="px-3 py-2.5">
                                                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#FFF7ED] text-lg font-bold text-primary dark:bg-[#431407]/30">
                                                                {idx + 1}
                                                            </span>
                                                        </td> */}
                                                        {visibleColumns.map((col) => {
                                                            const cellVal = row[col.ColumnName] !== undefined
                                                                ? row[col.ColumnName]
                                                                : row[col.ColumnName.toLowerCase()] !== undefined
                                                                ? row[col.ColumnName.toLowerCase()]
                                                                : row[Object.keys(row).find((k) => k.toLowerCase() === col.ColumnName.toLowerCase()) || ""];

                                                            return (
                                                                <td key={col.ColumnName} className="px-3 py-2.5">
                                                                    {renderCell(col, cellVal, formConfig)}
                                                                </td>
                                                            );
                                                        })}
                                                        <td className="px-3 py-2.5 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenEdit(row)}
                                                                title="Edit / Update Record"
                                                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] text-primary shadow-xs transition-all hover:bg-primary hover:text-[#FFFFFF] active:scale-95 dark:border-[#334155] dark:bg-[#0F172A] dark:hover:bg-primary dark:hover:text-[#FFFFFF]"
                                                            >
                                                                <Pencil size={14} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Footer */}
                                {!loading && records.length > 0 && (
                                    <div className="shrink-0 border-t border-[#E5E7EB] px-5 py-2.5 dark:border-[#334155]">
                                        <div className="flex items-center justify-between">
                                            <p className="text-lg text-[#9CA3AF] dark:text-[#6B7280]">
                                                Showing{" "}
                                                <span className="font-semibold text-[#374151] dark:text-[#D1D5DB]">{filteredRecords.length}</span>
                                                {" "}of{" "}
                                                <span className="font-semibold text-[#374151] dark:text-[#D1D5DB]">{records.length}</span>
                                                {" "}records ·{" "}
                                                <span className="font-semibold text-primary">Type {selectedType}</span>
                                                {" "}·{" "}
                                                <span className="font-semibold text-[#374151] dark:text-[#D1D5DB]">{visibleColumns.length} cols</span>
                                            </p>
                                            <p className="text-lg text-[#9CA3AF] dark:text-[#6B7280]">
                                                Active:{" "}
                                                <span className="font-semibold text-[#15803D] dark:text-[#86EFAC]">{activeCount}</span>
                                                {" · "}
                                                Inactive:{" "}
                                                <span className="font-semibold text-[#DC2626]">{inactiveCount}</span>
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </>
                            )
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}