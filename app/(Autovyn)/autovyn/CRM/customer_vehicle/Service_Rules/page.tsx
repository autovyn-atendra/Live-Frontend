"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import DataTable from "@/components/Templates/ServiceTable";
import HashloaderComponent from "@/components/Templates/hashloader";
import axios from "axios";
import { Edit, Settings2 } from "lucide-react";
import Ainput from "@/components/atoms/Input";
import CustomSelectSearch from "@/components/atoms/Select";
import { useCurrentUser } from "@/app/hooks/use-current-user";

// ============================================================
// CONSTANTS
// ============================================================
const BASE_URL = process.env.NEXT_PUBLIC_URL;


const API = {
  getAll: `${BASE_URL}/Crm/service-rule/getAll`,
  getOne: `${BASE_URL}/Crm/service-rule/getOne`,
  create: `${BASE_URL}/Crm/service-rule/create`,
  update: `${BASE_URL}/Crm/service-rule/update`,
};

// ============================================================
// TYPES
// ============================================================

// ── Rule_Type is always WHICHEVER_FIRST — kept for API response ──
type RuleType = "WHICHEVER_FIRST" | "KM_ONLY" | "DAYS_ONLY";

type ServiceRule = {
  UTD: number;
  Loc_Code: string | null;
  Service_Interval_KM: number | null;
  Service_Interval_Days: number | null;
  Rule_Type: RuleType;
  Reminder_Before_Days_1: number | null;
  Reminder_Before_Days_2: number | null;
  Reminder_On_Due_Date: number;
  Overdue_Reminder_Days: number | null;
  status: number;
  Created_By: string | null;
  Created_At: string | null;
  Updated_By: string | null;
  Updated_At: string | null;
};

type FormMode = "create" | "edit";

type RuleFormData = {
  Loc_Code: string;
  Service_Interval_KM: string;
  Service_Interval_Days: string;
  Reminder_Before_Days_1: string;
  Reminder_Before_Days_2: string;
  Reminder_On_Due_Date: string;
  Overdue_Reminder_Days: string;
  status: number;
};

// ============================================================
// UTILS
// ============================================================
const showToast = (
  msg: string,
  type: "success" | "error" | "warning" | "info"
) =>
  Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 4000,
    timerProgressBar: true,
  }).fire({ icon: type, title: msg });

const trimOrUndef = (v: unknown) => {
  const s = v == null ? "" : String(v).trim();
  return s || undefined;
};

// ============================================================
// BADGE COMPONENTS
// ============================================================
const StatusBadge = ({ status }: { status: number | null }) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold border
    ${status === 1
        ? "bg-[#DCFCE7] text-[#15803D] border-[#86EFAC] dark:bg-[#14532D]/30 dark:text-[#86EFAC] dark:border-[#15803D]"
        : "bg-[#F3F4F6] text-[#6B7280] border-[#D1D5DB] dark:bg-[#1F2937] dark:text-[#9CA3AF] dark:border-[#4B5563]"
      }`}
  >
    {status === 1 ? "● Active" : "● Inactive"}
  </span>
);

// ── Rule_Type badge — kept for table display ──
const RuleTypeBadge = ({ type }: { type: string | null }) => {
  const map: Record<string, string> = {
    WHICHEVER_FIRST:
      "bg-[#DBEAFE] text-[#1D4ED8] border-[#93C5FD] dark:bg-[#1E3A8A]/30 dark:text-[#93C5FD] dark:border-[#1D4ED8]",
    KM_ONLY:
      "bg-[#F3E8FF] text-[#7E22CE] border-[#C084FC] dark:bg-[#581C87]/30 dark:text-[#D8B4FE] dark:border-[#7E22CE]",
    DAYS_ONLY:
      "bg-[#FEF3C7] text-[#B45309] border-[#FCD34D] dark:bg-[#78350F]/30 dark:text-[#FDE68A] dark:border-[#B45309]",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-lg font-semibold border
      ${type
          ? (map[type] ?? "bg-[#F3F4F6] text-[#4B5563] border-[#D1D5DB]")
          : "bg-[#F3F4F6] text-[#9CA3AF] border-[#E5E7EB]"
        }`}
    >
      {type ?? "—"}
    </span>
  );
};

// ============================================================
// SHARED INPUT STYLES
// ============================================================
const inputCls =
  "h-9 w-full rounded border border-[#D1D5DB] dark:border-[#4B5563] " +
  "bg-white dark:bg-[#0d1117] px-3 text-lg text-[#1F2937] dark:text-white " +
  "focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent " +
  "placeholder:text-[#9CA3AF] dark:placeholder:text-[#4B5563] transition-shadow disabled:opacity-60";

const selectCls =
  "h-9 w-full rounded border border-[#D1D5DB] dark:border-[#4B5563] " +
  "bg-white dark:bg-[#0d1117] px-3 text-lg text-[#1F2937] dark:text-white " +
  "focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-shadow " +
  "cursor-pointer disabled:opacity-60";

// ── Field wrapper ──────────────────────────────────────────
const Field = ({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1 min-w-0">
    <label className="text-lg font-semibold text-[#4B5563] dark:text-[#9CA3AF] truncate">
      {label}
      {required && <span className="text-exit ml-0.5">*</span>}
    </label>
    {children}
    {error && (
      <p className="text-lg text-exit leading-tight">{error}</p>
    )}
  </div>
);

// ============================================================
// MAIN PAGE
// ============================================================
export default function Page() {

  // ── Login user ───────────────────────────────────────────
  const user = useCurrentUser();

  const userLocCode: string = (user as any)?.Loc_Code ?? "";
  const userName: string = (user as any)?.name ?? "admin";

  // ── Table state ──────────────────────────────────────────
  const [rows, setRows] = useState<ServiceRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // ── Filter states ────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [aSearch, setASearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [aStatus, setAStatus] = useState<number | undefined>(undefined);

  // ── Form state ───────────────────────────────────────────
  const EMPTY_FORM = useMemo<RuleFormData>(
    () => ({
      Loc_Code: userLocCode,
      Service_Interval_KM: "",
      Service_Interval_Days: "",
      Reminder_Before_Days_1: "",
      Reminder_Before_Days_2: "",
      Reminder_On_Due_Date: "",
      Overdue_Reminder_Days: "",
      status: 1,
    }),
    [userLocCode]
  );

  const [formMode, setFormMode] = useState<FormMode>("create");
  const [form, setForm] = useState<RuleFormData>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formLoading, setFormLoading] = useState(false);
  const [editUTD, setEditUTD] = useState<number | null>(null);

  // Sync Loc_Code when user loads
  useEffect(() => {
    if (userLocCode) {
      setForm(prev => ({ ...prev, Loc_Code: userLocCode }));
    }
  }, [userLocCode]);

  // ── Fetch ────────────────────────────────────────────────
  const fetchPayload = useMemo(
    () => ({
      page: page,
      pageSize: pageSize,
      Loc_Code: user?.branch,
      search: trimOrUndef(aSearch),
      status: aStatus,
    }),
    [page, pageSize, aSearch, aStatus]
  );

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await axios.post(API.getAll, fetchPayload,
        {
          headers:
          {
            accept: "application/json",
            compcode: user?.Comp_Code,
            name: user?.name,
            "Content-Type": "application/json",
          }
        });
      const d = res.data;
      if (!d?.success) { showToast("Failed to fetch data", "error"); return; }
      setRows(Array.isArray(d.data) ? d.data : []);
      setTotalPages(d.pagination?.totalPages ?? 1);
      setTotalRecords(d.pagination?.totalRecords ?? 0);
    } catch (e: any) {
      showToast(e?.response?.data?.message ?? "Error fetching data", "error");
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, [fetchPayload]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Filter handlers ──────────────────────────────────────
  const applyFilters = () => {
    setASearch(search);
    setAStatus(filterStatus === "" ? undefined : Number(filterStatus));
    setPage(1);
  };

  const resetFilters = () => {
    setSearch(""); setASearch("");
    setFilterStatus(""); setAStatus(undefined);
    setPage(1);
  };

  const handleRefresh = async () => {
    resetToCreate();
    resetFilters();
    await fetchData();
  };

  // ── Form handlers ────────────────────────────────────────
  const resetToCreate = () => {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setEditUTD(null);
    setFormMode("create");
  };

  const openEdit = async (UTD: number) => {
    try {
      setFormLoading(true);
      const res = await axios.post(API.getOne, { UTD }, {
        headers: {
          accept: "application/json",
          compcode: user?.Comp_Code,
          name: user?.name,
          "Content-Type": "application/json",
        }
      });
      if (!res.data?.success || !res.data?.data) {
        showToast("Failed to load rule", "error");
        return;
      }
      const d: ServiceRule = res.data.data;
      setForm({
        Loc_Code: d.Loc_Code ?? userLocCode,
        Service_Interval_KM: d.Service_Interval_KM?.toString() ?? "",
        Service_Interval_Days: d.Service_Interval_Days?.toString() ?? "",
        Reminder_Before_Days_1: d.Reminder_Before_Days_1?.toString() ?? "",
        Reminder_Before_Days_2: d.Reminder_Before_Days_2?.toString() ?? "",
        Reminder_On_Due_Date: d.Reminder_On_Due_Date?.toString() ?? "",
        Overdue_Reminder_Days: d.Overdue_Reminder_Days?.toString() ?? "",
        status: d.status ?? 1,
      });
      setFormErrors({});
      setEditUTD(UTD);
      setFormMode("edit");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      showToast(e?.response?.data?.message ?? "Error loading rule", "error");
    } finally {
      setFormLoading(false);
    }
  };

  const handleFieldChange = (
    field: keyof RuleFormData,
    value: string | number
  ) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setFormErrors(prev => ({ ...prev, [field]: "" }));
  };

  // ── Validation — Model_Name & Rule_Type removed ──────────
  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    const km = parseInt(form.Service_Interval_KM) || null;
    const days = parseInt(form.Service_Interval_Days) || null;

    if (km === null && days === null) {
      errs.Service_Interval_KM = "KM or Days is required";
      errs.Service_Interval_Days = "KM or Days is required";
    }
    if (km !== null && km <= 0) errs.Service_Interval_KM = "Must be > 0";
    if (days !== null && days <= 0) errs.Service_Interval_Days = "Must be > 0";

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    // Enforce single branch location code from logged-in user (prevent multiple locations)
    let singleLocCode = String(
      (user as any)?.branch ?? (user as any)?.Loc_Code ?? userLocCode ?? form.Loc_Code ?? ""
    ).trim();

    if (singleLocCode.includes(",")) {
      singleLocCode = singleLocCode.split(",")[0].trim();
    }

    if (!singleLocCode) {
      showToast("Branch location code is missing. Please log in with a valid branch.", "error");
      return;
    }

    // Rule_Type is always WHICHEVER_FIRST — hardcoded
    const body = {
      Loc_Code: singleLocCode,
      Service_Interval_KM: form.Service_Interval_KM ? parseInt(form.Service_Interval_KM) : null,
      Service_Interval_Days: form.Service_Interval_Days ? parseInt(form.Service_Interval_Days) : null,
      Rule_Type: "WHICHEVER_FIRST" as RuleType,
      Reminder_Before_Days_1: form.Reminder_Before_Days_1 ? parseInt(form.Reminder_Before_Days_1) : null,
      Reminder_Before_Days_2: form.Reminder_Before_Days_2 ? parseInt(form.Reminder_Before_Days_2) : null,
      Reminder_On_Due_Date: Number(form.Reminder_On_Due_Date),
      Overdue_Reminder_Days: form.Overdue_Reminder_Days ? parseInt(form.Overdue_Reminder_Days) : null,
      status: form.status,
      Created_By: userName,
    };

    try {
      setFormLoading(true);
      const isEdit = formMode === "edit";
      const url = isEdit ? API.update : API.create;
      const payload = isEdit ? { ...body, UTD: editUTD } : body;

      const res = await axios.post(url, payload, {
        headers: {
          accept: "application/json",
          compcode: user?.Comp_Code,
          name: user?.name,
          "Content-Type": "application/json",
        }
      });
      if (!res.data?.success) {
        showToast(res.data?.message ?? "Failed", "error");
        return;
      }
      showToast(
        res.data?.message ?? (isEdit ? "Updated!" : "Created!"),
        "success"
      );
      resetToCreate();
      await fetchData();
    } catch (e: any) {
      showToast(e?.response?.data?.message ?? "Error", "error");
    } finally {
      setFormLoading(false);
    }
  };

  // ── Stats ────────────────────────────────────────────────
  const activeCount = rows.filter(r => r.status === 1).length;
  const inactiveCount = rows.filter(r => r.status === 0).length;

  // ── Columns — Model_Name column removed ─────────────────
  const columns = useMemo(
    () => [
      // {
      //   Header: "Location",
      //   accessor: "Loc_Code",
      //   Cell: ({ value }: any) => (
      //     <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
      //       {value ?? "—"}
      //     </span>
      //   ),
      // },
      {
        Header: "Interval KM",
        accessor: "Service_Interval_KM",
        cellAlign: "right" as const,
        Cell: ({ value }: any) => (
          <span className=" font-mono text-[#374151] dark:text-[#D1D5DB] whitespace-nowrap">
            {value != null ? `${value.toLocaleString("en-IN")} km` : "—"}
          </span>
        ),
      },
      {
        Header: "Interval Days",
        accessor: "Service_Interval_Days",
        cellAlign: "right" as const,
        Cell: ({ value }: any) => (
          <span className=" font-mono text-[#374151] dark:text-[#D1D5DB] whitespace-nowrap">
            {value != null ? `${value} days` : "—"}
          </span>
        ),
      },
      {
        Header: "Rule Type",
        accessor: "Rule_Type",
        cellAlign: "center" as const,
        Cell: ({ value }: any) => <RuleTypeBadge type={value} />,
      },
      {
        Header: "Reminder 1",
        accessor: "Reminder_Before_Days_1",
        cellAlign: "center" as const,
        Cell: ({ value }: any) => (
          <span className=" text-[#4B5563] dark:text-[#9CA3AF]">
            {value != null ? `${value} day` : "—"}
          </span>
        ),
      },
      {
        Header: "Reminder 2",
        accessor: "Reminder_Before_Days_2",
        cellAlign: "center" as const,
        Cell: ({ value }: any) => (
          <span className=" text-[#4B5563] dark:text-[#9CA3AF]">
            {value != null ? `${value} day` : "—"}
          </span>
        ),
      },
      {
        Header: "Due Date",
        accessor: "Reminder_On_Due_Date",
        cellAlign: "center" as const,
        Cell: ({ value }: any) => (
          <span
            className={` font-semibold ${value
              ? "text-[#16A34A] dark:text-[#4ADE80]"
              : "text-[#9CA3AF]"
              }`}
          >
            {value ? "✓" : "✗"}
          </span>
        ),
      },
      {
        Header: "Overdue",
        accessor: "Overdue_Reminder_Days",
        cellAlign: "center" as const,
        Cell: ({ value }: any) => (
          <span className=" text-[#4B5563] dark:text-[#9CA3AF]">
            {value != null ? `${value} day` : "—"}
          </span>
        ),
      },
      {
        Header: "Status",
        accessor: "status",
        cellAlign: "center" as const,
        Cell: ({ value }: any) => <StatusBadge status={value} />,
      },
      {
        Header: "Created",
        accessor: "Created_At",
        cellAlign: "center" as const,
        Cell: ({ value }: any) => (
          <span className=" text-[#6B7280] whitespace-nowrap">
            {value
              ? new Date(value).toLocaleDateString("en-IN")
              : "—"}
          </span>
        ),
      },
      {
        Header: "Actions",
        accessor: "action",
        cellAlign: "center" as const,
        Cell: ({ row }: any) => (
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={() => openEdit(row.original.UTD)}
              className="p-1.5 rounded bg-[#EFF6FF] hover:bg-[#DBEAFE]
                dark:bg-[#1E3A8A]/30 dark:hover:bg-[#1E3A8A]/50
                text-[#2563EB] dark:text-[#60A5FA] transition-colors"
              title="Edit"
            >
              <Edit size={13} />
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="w-full max-w-full overflow-x-hidden p-3 sm:p-4 flex flex-col gap-4">

      {/* ══ HEADER ══ */}
      <div className="bg-header flex flex-wrap items-center justify-between gap-2 rounded-sm px-4 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <Settings2 className="h-5 w-5 text-white shrink-0" />
          <div className="min-w-0">
            <h1 className="text-[24px] font-bold text-white uppercase leading-tight truncate">
              Service Reminder Rules
            </h1>
            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
              {totalRecords > 0 && (
                <span className="text-lg text-white/50">
                  {totalRecords.toLocaleString("en-IN")} total
                </span>
              )}
              <span className="text-lg font-bold bg-[#22C55E]/90 text-white rounded-full px-1.5 py-0.5">
                {activeCount} active
              </span>
              {inactiveCount > 0 && (
                <span className="text-lg font-bold bg-[#6B7280]/80 text-white rounded-full px-1.5 py-0.5">
                  {inactiveCount} inactive
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="lg"
            onClick={handleRefresh}
            disabled={isLoading || formLoading}
          >
            Refresh
          </Button>

          {formMode === "edit" && (
            <Button
              variant="print"
              size="lg"
              onClick={resetToCreate}
              disabled={formLoading}
            >
              New Rule
            </Button>
          )}

          <Button
            variant="outline"
            size="lg"
            onClick={handleSubmit}
            loading={formLoading}
            disabled={formLoading || isLoading}
          >
            {formLoading
              ? "Saving…"
              : formMode === "edit"
                ? "Update Rule"
                : "Save Rule"}
          </Button>
        </div>
      </div>

      {/* ══ FORM SECTION ══ */}
      <div className="border rounded-md p-3 sm:p-4 bg-white dark:bg-[#0d1117]">

        <h2 className="text-[22px] font-bold text-[#193A69] dark:text-white mb-3 uppercase">
          {formMode === "edit"
            ? `Edit Service Rule (UTD: ${editUTD})`
            : "New Service Rule"}
        </h2>

        {/* ── Row 1 : Status & Rule Type (edit) ── */}
        {formMode === "edit" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3 mb-4">

            {/* Rule Type — display only (always WHICHEVER_FIRST) */}
            <Field label="Rule Type">
              <div className="py-1 h-[30px]  flex items-center px-3 rounded border border-[#D1D5DB] dark:border-[#4B5563] bg-[#F9FAFB] dark:bg-[#1a1f2e]">
                <RuleTypeBadge type="WHICHEVER_FIRST" />
              </div>
            </Field>

            {/* Status */}
            <Field label="Status">
              <div className="flex items-center gap-4 h-9 px-3 rounded border border-[#D1D5DB] dark:border-[#4B5563] bg-white dark:bg-[#0d1117]">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="rule-status"
                    checked={form.status === 1}
                    onChange={() => handleFieldChange("status", 1)}
                    disabled={formLoading}
                    className="accent-[#22C55E]"
                  />
                  <span className="text-xs font-medium text-[#16A34A] dark:text-[#4ADE80]">
                    Active
                  </span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="rule-status"
                    checked={form.status === 0}
                    onChange={() => handleFieldChange("status", 0)}
                    disabled={formLoading}
                    className="accent-[#6B7280]"
                  />
                  <span className="text-xs font-medium text-[#6B7280]">
                    Inactive
                  </span>
                </label>
              </div>
            </Field>
          </div>
        )}

        {/* ── Create mode — Rule Type ── */}
        {formMode === "create" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3 mb-4">
            {/* Rule Type — display only */}
            <Field label="Rule Type">
              <div className="h-9 flex items-center px-3 rounded border border-[#D1D5DB] dark:border-[#4B5563] bg-[#F9FAFB] dark:bg-[#1a1f2e]">
                <RuleTypeBadge type="WHICHEVER_FIRST" />
              </div>
            </Field>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-dashed border-[#E5E7EB] dark:border-[#374151] mb-4" />

        {/* ── Row 2 : Intervals & Reminders ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
          <div>
            <Ainput
              title="Service Interval (KM)"
              type="number"
              name="Service_Interval_KM"
              value={form.Service_Interval_KM}
              handleInputChange={(_, val) => handleFieldChange("Service_Interval_KM", val)}
              onInput={() => {}}
              disabled={formLoading}
              redlabel="*"
              labelClass="text-[18px]"
              className="!h-10 !text-[18px]"
            />
            {formErrors.Service_Interval_KM && (
              <p className="text-lg text-exit leading-tight mt-1">{formErrors.Service_Interval_KM}</p>
            )}
          </div>

          <div>
            <Ainput
              title="Service Interval (Days)"
              type="number"
              name="Service_Interval_Days"
              value={form.Service_Interval_Days}
              handleInputChange={(_, val) => handleFieldChange("Service_Interval_Days", val)}
              onInput={() => {}}
              disabled={formLoading}
              redlabel="*"
              labelClass="text-[18px]"
              className="!h-10 !text-[18px]"
            />
            {formErrors.Service_Interval_Days && (
              <p className="text-lg text-exit leading-tight mt-1">{formErrors.Service_Interval_Days}</p>
            )}
          </div>

          <div>
            <Ainput
              title="Reminder 1 (Days Before)"
              type="number"
              name="Reminder_Before_Days_1"
              value={form.Reminder_Before_Days_1}
              handleInputChange={(_, val) => handleFieldChange("Reminder_Before_Days_1", val)}
              onInput={() => {}}
              disabled={formLoading}
              labelClass="text-[18px]"
              className="!h-10 !text-[18px]"
            />
          </div>

          <div>
            <Ainput
              title="Reminder 2 (Days Before)"
              type="number"
              name="Reminder_Before_Days_2"
              value={form.Reminder_Before_Days_2}
              handleInputChange={(_, val) => handleFieldChange("Reminder_Before_Days_2", val)}
              onInput={() => {}}
              disabled={formLoading}
              labelClass="text-[18px]"
              className="!h-10 !text-[18px]"
            />
          </div>

          <div>
            <Ainput
              title="Overdue Reminder (Days After)"
              type="number"
              name="Overdue_Reminder_Days"
              value={form.Overdue_Reminder_Days}
              handleInputChange={(_, val) => handleFieldChange("Overdue_Reminder_Days", val)}
              onInput={() => {}}
              disabled={formLoading}
              labelClass="text-[18px]"
              className="!h-10 !text-[18px]"
            />
          </div>

          <div>
            <CustomSelectSearch
              title="Remind On Due Date"
              name="Reminder_On_Due_Date"
              selectedValue={String(form.Reminder_On_Due_Date)}
              handleInputChange={(_, val) => handleFieldChange("Reminder_On_Due_Date", val)}
              options={[
                { label: "Yes", value: "1" },
                { label: "No", value: "0" },
              ]}
              disabled={formLoading}
              labelClass="text-[18px]"
            />
          </div>
        </div>
      </div>

      {/* ══ FILTER SECTION ══ */}
      {/* <div className="border rounded-md p-3 sm:p-4 bg-white dark:bg-[#0d1117]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3 items-end">

          <Field label="Search">
            <input
              type="text"
              className={inputCls}
              value={search}
              placeholder="Loc code"
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && applyFilters()}
              disabled={isLoading}
            />
          </Field>

          <Field label="Status">
            <select
              className={selectCls}
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              disabled={isLoading}
            >
              <option value="">All Status</option>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
          </Field>

          <div className="flex gap-2 sm:col-span-2 lg:col-span-2 items-end">
            <Button
              variant="outline"
              size="sm"
              onClick={applyFilters}
              disabled={isLoading}
              className="flex-1"
            >
              🔍 Apply
            </Button>
            <Button
              variant="print"
              size="sm"
              onClick={resetFilters}
              disabled={isLoading}
              className="flex-1"
            >
              ↺ Reset
            </Button>
          </div>
        </div>
      </div> */}

      {/* ══ TABLE ══ */}
      <div className="border p-2 rounded-md bg-white dark:bg-[#0d1117] overflow-hidden">
        <div className="w-full overflow-x-auto">
          <DataTable
            // title={isLoading ? "Loading…" : "Service Rules List"}
            columns={columns}
            selectValue="UTD"
            data={rows}
            height={440}
            filterPosition="FilterData"
            size="text-lg"
            // labelClassName="text-lg"

            enableColumnFilters={true}
            numericFilterColumns={[
              "UTD",
              "Service_Interval_KM",
              "Service_Interval_Days",
              "Reminder_Before_Days_1",
              "Reminder_Before_Days_2",
              "Overdue_Reminder_Days",
            ]}
            serverMode={true}
            serverPagination={{
              currentPage: page,
              pageSize,
              totalPages,
              totalRecords,
            }}
            onServerPageChange={(p: number) => setPage(p)}
            onServerPageSizeChange={(s: number) => {
              setPageSize(s);
              setPage(1);
            }}
            onRowDoubleClick={(r: ServiceRule) => openEdit(r.UTD)}
          />
        </div>
      </div>

      <HashloaderComponent isLoading={isLoading || formLoading} />
    </div>
  );
}