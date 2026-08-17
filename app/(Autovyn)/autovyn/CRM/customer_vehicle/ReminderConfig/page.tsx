"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import DataTable from "@/components/Templates/ServiceTable";
import HashloaderComponent from "@/components/Templates/hashloader";
import axios from "axios";
import { Edit, Settings2, Lock, Unlock, Clock } from "lucide-react";
import { useCurrentUser } from "@/app/hooks/use-current-user";

// ============================================================
// CONSTANTS
// ============================================================
const BASE_URL = process.env.NEXT_PUBLIC_URL;


// ============================================================
// TYPES
// ============================================================
type ReminderConfig = {
  UTD: number;
  Loc_Code: string | null;
  Loc_Name: string | null;
  Service_Center_Name: string;
  Service_Center_Address: string | null;
  Working_Hours: string | null;
  Sales_Exec_Number: string | null;
  Slot1_Time: string | null;
  Slot2_Time: string | null;
  Slot3_Time: string | null;
  Callback_Time: string | null;
  Campaign_Id: string | null;
  Max_Attempts_Per_Day: number | null;
  Call_Delay_Ms: number | null;
  status: number;
  Created_By: string | null;
  Created_At: string | null;
  Updated_By: string | null;
  Updated_At: string | null;
};

type FormMode = "create" | "edit";

type ConfigFormData = {
  Loc_Code: string;
  Service_Center_Name: string;
  Service_Center_Address: string;
  Working_Hours: string;
  Sales_Exec_Number: string;
  Slot1_Time: string;
  Slot2_Time: string;
  Slot3_Time: string;
  Callback_Time: string;
  Campaign_Id: string;
  Max_Attempts_Per_Day: string;
  Call_Delay_Ms: string;
  status: number;
};

type LocOption = { label: string; value: string };

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

// ── Strong modal alert (not toast) — used for critical validation ──
const showAlertModal = (
  title: string,
  html: string,
  icon: "warning" | "error" | "info" = "warning"
) =>
  Swal.fire({
    icon,
    title,
    html,
    confirmButtonText: "OK, Got it",
    confirmButtonColor: "#193A69",
  });

// ── Convert "HH:MM" (24hr, from <input type="time">) to readable format ──
// e.g. "14:30" -> "02:30 PM"
const formatTimeForDisplay = (time24: string | null): string => {
  if (!time24) return "—";
  // Already in "HH:MM" 24hr format expected from <input type="time">
  const parts = time24.split(":");
  if (parts.length < 2) return time24; // fallback — old text data
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  if (isNaN(hours)) return time24;
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours === 0 ? 12 : hours;
  return `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
};

// ── Try to normalize old text-based time values back into "HH:MM"
//    for the <input type="time"> value prop. If it doesn't match a
//    known pattern, just return empty so the picker starts blank. ──
const normalizeTimeForInput = (value: string | null): string => {
  if (!value) return "";

  // Already "HH:MM" 24hr → use as is
  if (/^\d{2}:\d{2}$/.test(value)) return value;

  // Try to parse "hh:mm AM/PM" style old text values
  const match = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return "";

  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = match[3]?.toUpperCase();

  if (ampm === "PM" && hours < 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;

  return `${String(hours).padStart(2, "0")}:${minutes}`;
};

// ============================================================
// BADGE COMPONENTS
// ============================================================
const StatusBadge = ({ status }: { status: number | null }) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold border
    ${status === 1
        ? "bg-[#DCFCE7] text-green-700 border-green-300 dark:bg-[#14532D]/30 dark:text-green-300 dark:border-green-700"
        : "bg-gray-100 text-[#6B7280] border-[#D1D5DB] dark:bg-[#1F2937] dark:text-[#9CA3AF]dark:border-[#4B5563]"
      }`}
  >
    {status === 1 ? "● Active" : "● Inactive"}
  </span>
);

// ============================================================
// SHARED INPUT / SELECT STYLES
// ============================================================
const inputCls =
  "h-9 w-full rounded border border-[#D1D5DB] dark:border-[#4B5563] " +
  "bg-white dark:bg-[#0d1117] px-3 text-sm text-[#1F2937] dark:text-white " +
  "focus:outline-none focus:ring-2 focus:ring-[#EFF6FF]0 focus:border-transparent " +
  "placeholder:text-[#9CA3AF]dark:placeholder:text-[#4B5563] transition-shadow disabled:opacity-60";

const selectCls =
  "h-9 w-full rounded border border-[#D1D5DB] dark:border-[#4B5563] " +
  "bg-white dark:bg-[#0d1117] px-3 text-sm text-[#1F2937] dark:text-white " +
  "focus:outline-none focus:ring-2 focus:ring-[#EFF6FF]0 transition-shadow " +
  "cursor-pointer disabled:opacity-60";

// ── Time input style — same base + relative for clock icon spacing ──
const timeInputCls =
  "h-9 w-full rounded border border-[#D1D5DB] dark:border-[#4B5563] " +
  "bg-white dark:bg-[#0d1117] px-3 text-sm text-[#1F2937] dark:text-white " +
  "focus:outline-none focus:ring-2 focus:ring-[#EFF6FF]0 focus:border-transparent " +
  "transition-shadow disabled:opacity-60 cursor-pointer " +
  "[&::-webkit-calendar-picker-indicator]:cursor-pointer " +
  "[&::-webkit-calendar-picker-indicator]:dark:invert";

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
    <label className="text-xs font-semibold text-[#4B5563] dark:text-[#9CA3AF]truncate">
      {label}
      {required && <span className="text-[#EF4444] ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="text-[10px] text-[#EF4444] leading-tight">{error}</p>}
  </div>
);

// ── Time Field — <input type="time"> with clock icon label ─────
const TimeField = ({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) => (
  <div className="flex flex-col gap-1 min-w-0">
    <label className="flex items-center gap-1 text-xs font-semibold text-[#4B5563] dark:text-[#9CA3AF]truncate">
      <Clock size={12} className="shrink-0" />
      {label}
    </label>
    <input
      type="time"
      className={timeInputCls}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    />
  </div>
);

// ============================================================
// MAIN PAGE
// ============================================================
export default function ReminderConfigPage() {
  // ── Current User ─────────────────────────────────────────
  const user = useCurrentUser();

  const HEADERS = () => ({
    accept: "application/json",
    compcode: user?.Comp_Code,
    name: user?.name,
    "Content-Type": "application/json",
  });

  const userName: string = (user as any)?.name ?? "SYSTEM";

  // ✅ userBranchRaw ko hamesha STRING mein convert karo
  // Kyunki user?.branch API se kabhi NUMBER (1) aata hai, kabhi STRING ("1,2,3")
  const userBranchRaw: string =
    user?.branch !== undefined && user?.branch !== null
      ? String(user.branch)
      : "";

  const userBranchArray = userBranchRaw
    ? userBranchRaw
      .split(",")
      .map((l: string) => l.trim())
      .filter(Boolean)
    : [];

  const isMultiLocationUser = userBranchArray.length > 1;
  const userSingleLocation = userBranchArray.length === 1 ? userBranchArray[0] : "";

  // ── Location Options ─────────────────────────────────────
  const [locOptions, setLocOptions] = useState<LocOption[]>([]);

  // ── Table State ──────────────────────────────────────────
  const [rows, setRows] = useState<ReminderConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ── Filter State ─────────────────────────────────────────
  const [filterStatus, setFilterStatus] = useState("");

  // ── Form State ───────────────────────────────────────────
  const [formMode, setFormMode] = useState<FormMode>("create");

  const EMPTY_FORM: ConfigFormData = {
    Loc_Code: userSingleLocation || "",
    Service_Center_Name: "",
    Service_Center_Address: "",
    Working_Hours: "09:00 AM - 06:00 PM",
    Sales_Exec_Number: "",
    Slot1_Time: "",
    Slot2_Time: "",
    Slot3_Time: "",
    Callback_Time: "",
    Campaign_Id: "",
    Max_Attempts_Per_Day: "3",
    Call_Delay_Ms: "2000",
    status: 1,
  };

  const [form, setForm] = useState<ConfigFormData>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formLoading, setFormLoading] = useState(false);
  const [editUTD, setEditUTD] = useState<number | null>(null);

  // ✅ Auto-set Loc_Code when user changes
  useEffect(() => {
    if (userSingleLocation) {
      setForm((prev) => ({
        ...prev,
        Loc_Code: userSingleLocation,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userSingleLocation]);

  // ============================================================
  // FETCH ALL CONFIGS
  // ============================================================
  const fetchConfigs = useCallback(async () => {
    if (isMultiLocationUser) {
      // Multi-branch users cannot view configs — silently skip
      return;
    }

    if (!userSingleLocation) {
      // User ki location abhi load nahi hui — silently wait karo
      return;
    }

    setIsLoading(true);
    try {
      const params: Record<string, any> = {
        Loc_Code: user?.branch,
      };

      if (filterStatus !== "") params.status = filterStatus;

      const res = await axios.get(`${BASE_URL}/Crm/getAllReminderConfigs`, {
        headers: {
          accept: "application/json",
          compcode: user?.Comp_Code,
          name: user?.name,
          "Content-Type": "application/json",
        },
        params,
      });

      setRows(Array.isArray(res?.data?.data) ? res.data.data : []);
    } catch (err: any) {
      showToast(
        err?.response?.data?.message ?? "Error fetching configs",
        "error"
      );
      setRows([]);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, userSingleLocation, isMultiLocationUser]);

  useEffect(() => {
     if (!user?.Comp_Code) return;
    if (!isMultiLocationUser && userSingleLocation) {
      fetchConfigs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchConfigs, userSingleLocation]);

  // ============================================================
  // FORM HELPERS
  // ============================================================
  const resetToCreate = () => {
    setForm({
      ...EMPTY_FORM,
      Loc_Code: userSingleLocation || "",
    });
    setFormErrors({});
    setEditUTD(null);
    setFormMode("create");
  };

  const handleFieldChange = (
    field: keyof ConfigFormData,
    value: string | number
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // ✅ POPULATE FORM FOR EDITING (DOUBLE CLICK)
  const openEdit = (row: ReminderConfig) => {
    setForm({
      Loc_Code: userSingleLocation, // ✅ Always from current user branch
      Service_Center_Name: row.Service_Center_Name ?? "",
      Service_Center_Address: row.Service_Center_Address ?? "",
      Working_Hours: row.Working_Hours ?? "09:00 AM - 06:00 PM",
      Sales_Exec_Number: row.Sales_Exec_Number ?? "",
      // ✅ Normalize old text values ("10:00 AM") → "HH:MM" for <input type="time">
      Slot1_Time: normalizeTimeForInput(row.Slot1_Time),
      Slot2_Time: normalizeTimeForInput(row.Slot2_Time),
      Slot3_Time: normalizeTimeForInput(row.Slot3_Time),
      Callback_Time: normalizeTimeForInput(row.Callback_Time),
      Campaign_Id: row.Campaign_Id ?? "",
      Max_Attempts_Per_Day: String(row.Max_Attempts_Per_Day ?? 3),
      Call_Delay_Ms: String(row.Call_Delay_Ms ?? 2000),
      status: row.status ?? 1,
    });
    setFormErrors({});
    setEditUTD(row.UTD);
    setFormMode("edit");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ============================================================
  // VALIDATION
  // ============================================================
  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!form.Service_Center_Name.trim()) {
      errs.Service_Center_Name = "Service Center Name is required";
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ============================================================
  // SUBMIT — Create or Update
  // ============================================================
  const handleSubmit = async () => {
    // ✅ MULTI-BRANCH CHECK — Clear message with branch list
    if (isMultiLocationUser) {
      showAlertModal(
        "Multiple Branches Detected",
        `You are currently logged in with access to <b>${userBranchArray.length} branches</b>:
         <br/><br/>
         <span style="font-weight:600;color:#193A69;">
           ${userBranchArray.join(", ")}
         </span>
         <br/><br/>
         Please select <b>only one branch</b> to save the Reminder Config.
         Multi-branch users cannot create or update configs from here.`,
        "warning"
      );
      return;
    }

    if (!userSingleLocation) {
      showToast("User location not found. Cannot save config.", "error");
      return;
    }

    if (!validate()) return;

    setFormLoading(true);

    try {
      const payload = {
        ...form,
        Loc_Code: userSingleLocation, // ✅ Always from user.branch
        Max_Attempts_Per_Day: Number(form.Max_Attempts_Per_Day),
        Call_Delay_Ms: Number(form.Call_Delay_Ms),
        Created_By: userName,
      };

      const isEdit = formMode === "edit";

      if (isEdit) {
        await axios.put(
          `${BASE_URL}/Crm/updateReminderConfig`,
          { ...payload, UTD: editUTD },
          {
            headers: {
              accept: "application/json",
              compcode: user?.Comp_Code,
              name: user?.name,
              "Content-Type": "application/json",
            }
          }
        );
        showToast("Config updated successfully", "success");
      } else {
        await axios.post(`${BASE_URL}/Crm/createReminderConfig`, payload, {
          headers: {
            accept: "application/json",
            compcode: user?.Comp_Code,
            name: user?.name,
            "Content-Type": "application/json",
          }
        });
        showToast("Config created successfully", "success");
      }

      resetToCreate();
      await fetchConfigs();
    } catch (err: any) {
      showToast(
        err?.response?.data?.message ?? "Something went wrong",
        "error"
      );
    } finally {
      setFormLoading(false);
    }
  };

  // ============================================================
  // TOGGLE STATUS
  // ============================================================
  const handleToggle = async (row: ReminderConfig) => {
    if (isMultiLocationUser) {
      showAlertModal(
        "Multiple Branches Detected",
        `Please select <b>only one branch</b> to change config status.
         <br/><br/>
         Your branches: <b>${userBranchArray.join(", ")}</b>`,
        "warning"
      );
      return;
    }

    const newStatus = row.status === 1 ? 0 : 1;
    try {
      await axios.patch(
        `${BASE_URL}/Crm/toggleReminderConfigStatus`,
        { UTD: row.UTD, status: newStatus },
        {
          headers: {
            accept: "application/json",
            compcode: user?.Comp_Code,
            name: user?.name,
            "Content-Type": "application/json",
          }
        }
      );
      showToast(
        `Config ${newStatus === 1 ? "activated" : "deactivated"} successfully`,
        "success"
      );
      await fetchConfigs();
    } catch (err: any) {
      showToast(err?.response?.data?.message ?? "Toggle failed", "error");
    }
  };

  // ============================================================
  // STATS
  // ============================================================
  const activeCount = rows.filter((r) => r.status === 1).length;
  const inactiveCount = rows.filter((r) => r.status === 0).length;

  // ============================================================
  // TABLE COLUMNS
  // ============================================================
  const columns = useMemo(
    () => [

      {
        Header: "Location",
        accessor: "Loc_Name",
        Cell: ({ row }: any) => (
          <div className="min-w-[100px]">
            <div className="text-xs font-semibold text-[#193A69] dark:text-[#93C5FD] whitespace-nowrap">
              {row.original.Loc_Name || "—"}
            </div>
            {/* <div className="text-[10px] text-[#9CA3AF]">
              Code: {row.original.Loc_Code || "—"}
            </div> */}
          </div>
        ),
      },
      {
        Header: "Service Center",
        accessor: "Service_Center_Name",
        Cell: ({ row }: any) => (
          <div className="min-w-[130px]">
            <div className="text-xs font-medium text-[#1F2937] dark:text-[#E5E7EB]">
              {row.original.Service_Center_Name || "—"}
            </div>
            {row.original.Service_Center_Address && (
              <div className="text-[10px] text-[#9CA3AF]truncate max-w-[160px]">
                {row.original.Service_Center_Address}
              </div>
            )}
          </div>
        ),
      },
      {
        Header: "Working Hours",
        accessor: "Working_Hours",
        Cell: ({ value }: any) => (
          <span className="text-xs text-[#4B5563] dark:text-[#9CA3AF]whitespace-nowrap">
            {value || "—"}
          </span>
        ),
      },
      {
        Header: "Sales Exec",
        accessor: "Sales_Exec_Number",
        Cell: ({ value }: any) => (
          <span className="text-xs text-[#4B5563] dark:text-[#9CA3AF]whitespace-nowrap">
            {value || "—"}
          </span>
        ),
      },
      {
        Header: "Slot 1",
        accessor: "Slot1_Time",
        cellAlign: "center" as const,
        // ✅ Display formatted time (e.g. "10:00 AM") even though DB may store "HH:MM"
        Cell: ({ value }: any) => (
          <span className="text-xs text-[#4B5563] dark:text-[#9CA3AF]whitespace-nowrap">
            {formatTimeForDisplay(value)}
          </span>
        ),
      },
      {
        Header: "Slot 2",
        accessor: "Slot2_Time",
        cellAlign: "center" as const,
        Cell: ({ value }: any) => (
          <span className="text-xs text-[#4B5563] dark:text-[#9CA3AF]whitespace-nowrap">
            {formatTimeForDisplay(value)}
          </span>
        ),
      },
      {
        Header: "Slot 3",
        accessor: "Slot3_Time",
        cellAlign: "center" as const,
        Cell: ({ value }: any) => (
          <span className="text-xs text-[#4B5563] dark:text-[#9CA3AF]whitespace-nowrap">
            {formatTimeForDisplay(value)}
          </span>
        ),
      },
      {
        Header: "Callback",
        accessor: "Callback_Time",
        cellAlign: "center" as const,
        Cell: ({ value }: any) => (
          <span className="text-xs text-[#4B5563] dark:text-[#9CA3AF]whitespace-nowrap">
            {formatTimeForDisplay(value)}
          </span>
        ),
      },
      {
        Header: "Campaign ID",
        accessor: "Campaign_Id",
        Cell: ({ value }: any) => (
          <span className="text-xs font-mono text-[#4B5563] dark:text-[#9CA3AF]">
            {value || "—"}
          </span>
        ),
      },
      {
        Header: "Max Attempts",
        accessor: "Max_Attempts_Per_Day",
        cellAlign: "center" as const,
        Cell: ({ value }: any) => (
          <span className="text-xs text-[#4B5563] dark:text-[#9CA3AF]">
            {value ?? "—"}
          </span>
        ),
      },
      {
        Header: "Delay (ms)",
        accessor: "Call_Delay_Ms",
        cellAlign: "center" as const,
        Cell: ({ value }: any) => (
          <span className="text-xs font-mono text-[#4B5563] dark:text-[#9CA3AF]">
            {value ?? "—"}
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
        Header: "Created At",
        accessor: "Created_At",
        cellAlign: "center" as const,
        Cell: ({ row }: any) => (
          <div className="text-[11px] text-[#6B7280] whitespace-nowrap">
            <div>{row.original.Created_At || "—"}</div>
            {row.original.Created_By && (
              <div className="text-[10px] text-[#9CA3AF]">
                {row.original.Created_By}
              </div>
            )}
          </div>
        ),
      },
      {
        Header: "Actions",
        accessor: "action",
        cellAlign: "center" as const,
        Cell: ({ row }: any) => (
          <div className="flex items-center justify-center gap-1.5">
            <button
              onClick={() => openEdit(row.original)}
              title="Edit"
              className="p-1.5 rounded bg-[#EFF6FF] hover:bg-[#DBEAFE]
                dark:bg-[#1E3A8A]/30 dark:hover:bg-[#1E3A8A]/50
                text-[#2563EB] dark:text-[#60A5FA] transition-colors"
            >
              <Edit size={13} />
            </button>

            <button
              onClick={() => handleToggle(row.original)}
              title={row.original.status === 1 ? "Deactivate" : "Activate"}
              className={`p-1.5 rounded transition-colors ${row.original.status === 1
                  ? "[#FEF2F2] hover:bg-[#FEE2E2] dark:bg-[#7F1D1D]/30 dark:hover:bg-[#7F1D1D]/50 text-[#EF4444] dark:text-[#F87171]"
                  : "bg-[#F0FDF4] hover:bg-[#DCFCE7] dark:bg-[#14532D]/30 dark:hover:bg-[#14532D]/50 text-[#16A34A] dark:text-[#4ADE80]"
                }`}
            >
              {row.original.status === 1 ? <Lock size={13} /> : <Unlock size={13} />}
            </button>
          </div>
        ),
      },
    ],
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
            <h1 className="text-base font-bold text-white leading-tight truncate">
              Reminder Config
            </h1>
            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
              {rows.length > 0 && (
                <span className="text-[10px] text-white/50">
                  {rows.length} total
                </span>
              )}
              <span className="text-[10px] font-bold bg-[#F0FDF4]0/90 text-white rounded-full px-1.5 py-0.5">
                {activeCount} active
              </span>
              {inactiveCount > 0 && (
                <span className="text-[10px] font-bold bg-[#6B7280]/80 text-white rounded-full px-1.5 py-0.5">
                  {inactiveCount} inactive
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Header Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchConfigs}
            disabled={isLoading || formLoading}
          >
            Refresh
          </Button>

          {formMode === "edit" && (
            <Button variant="print" size="sm" onClick={resetToCreate} disabled={formLoading}>
              + New Config
            </Button>
          )}

          <Button
            variant="save"
            size="sm"
            onClick={handleSubmit}
            loading={formLoading}
            disabled={formLoading || isLoading}
          >
            {formLoading ? "Saving…" : formMode === "edit" ? "Update Config" : "Save Config"}
          </Button>
        </div>
      </div>

      {/* ══ MULTI-LOCATION WARNING ══ */}
      {isMultiLocationUser && (
        <div className="border border-[#FDE047] bg-[#FEFCE8] dark:bg-[#713F12]/20 dark:border-[#A16207] rounded-md p-3 text-sm text-[#A16207]dark:text-[#FDE047] flex items-start gap-2">
          <span className="text-lg leading-none">⚠️</span>
          <div>
            <p className="font-semibold">Multiple branches detected</p>
            <p className="text-xs mt-0.5">
              You have access to <b>{userBranchArray.length} branches</b>:{" "}
              <span className="font-mono">{userBranchArray.join(", ")}</span>.
              Please switch to a <b>single branch</b> account to view or save
              Reminder Config.
            </p>
          </div>
        </div>
      )}

      {/* ══ FORM SECTION ══ */}
      <div className="border rounded-md p-3 sm:p-4 bg-white dark:bg-[#0d1117]">
        <h2 className="text-sm font-bold text-[#193A69] dark:text-white mb-3 uppercase tracking-wide">
          {formMode === "edit" ? `Edit Config (UTD: ${editUTD})` : "New Reminder Config"}
          {userSingleLocation && (
            <span className="ml-2 text-[10px] font-normal text-[#9CA3AF]normal-case">
              (Branch Code: {userSingleLocation})
            </span>
          )}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3 mb-4">
          <Field label="Service Center Name" required error={formErrors.Service_Center_Name}>
            <input
              type="text"
              className={
                inputCls +
                (formErrors.Service_Center_Name ? " !border-[#F87171] focus:!ring-[#F87171]" : "")
              }
              value={form.Service_Center_Name}
              onChange={(e) => handleFieldChange("Service_Center_Name", e.target.value)}
              placeholder="e.g. Main Service Center"
              disabled={formLoading}
            />
          </Field>

          <Field label="Service Center Address">
            <input
              type="text"
              className={inputCls}
              value={form.Service_Center_Address}
              onChange={(e) => handleFieldChange("Service_Center_Address", e.target.value)}
              placeholder="e.g. 123, Main Road"
              disabled={formLoading}
            />
          </Field>

          <Field label="Campaign ID">
            <input
              type="text"
              className={inputCls}
              value={form.Campaign_Id}
              onChange={(e) => handleFieldChange("Campaign_Id", e.target.value)}
              placeholder="Campaign ID"
              disabled={formLoading}
            />
          </Field>

          <Field label="Working Hours">
            <input
              type="text"
              className={inputCls}
              value={form.Working_Hours}
              onChange={(e) => handleFieldChange("Working_Hours", e.target.value)}
              placeholder="09:00 AM - 06:00 PM"
              disabled={formLoading}
            />
          </Field>
        </div>

        <div className="border-t border-dashed border-[#E5E7EB] dark:border-[#374151] mb-4" />

        {/* ── Slot Times — Clock Picker ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3 mb-4">
          <Field label="Sales Exec Number">
            <input
              type="text"
              className={inputCls}
              value={form.Sales_Exec_Number}
              onChange={(e) => handleFieldChange("Sales_Exec_Number", e.target.value)}
              placeholder="Mobile number"
              maxLength={15}
              disabled={formLoading}
            />
          </Field>

          {/* ✅ Slot 1 — Clock Picker */}
          <TimeField
            label="Slot 1 Time"
            value={form.Slot1_Time}
            onChange={(v) => handleFieldChange("Slot1_Time", v)}
            disabled={formLoading}
          />

          {/* ✅ Slot 2 — Clock Picker */}
          <TimeField
            label="Slot 2 Time"
            value={form.Slot2_Time}
            onChange={(v) => handleFieldChange("Slot2_Time", v)}
            disabled={formLoading}
          />

          {/* ✅ Slot 3 — Clock Picker */}
          <TimeField
            label="Slot 3 Time"
            value={form.Slot3_Time}
            onChange={(v) => handleFieldChange("Slot3_Time", v)}
            disabled={formLoading}
          />

          {/* ✅ Callback Time — Clock Picker */}
          <TimeField
            label="Callback Time"
            value={form.Callback_Time}
            onChange={(v) => handleFieldChange("Callback_Time", v)}
            disabled={formLoading}
          />

          <Field label="Max Attempts Per Day">
            <input
              type="number"
              className={inputCls}
              value={form.Max_Attempts_Per_Day}
              onChange={(e) => handleFieldChange("Max_Attempts_Per_Day", e.target.value)}
              placeholder="e.g. 3"
              min={1}
              max={10}
              disabled={formLoading}
            />
          </Field>

          <Field label="Call Delay (ms)">
            <input
              type="number"
              className={inputCls}
              value={form.Call_Delay_Ms}
              onChange={(e) => handleFieldChange("Call_Delay_Ms", e.target.value)}
              placeholder="e.g. 2000"
              min={500}
              disabled={formLoading}
            />
          </Field>
        </div>

        {formMode === "edit" && (
          <>
            <div className="border-t border-dashed border-[#E5E7EB] dark:border-[#374151] mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3">
              <Field label="Status">
                <div className="flex items-center gap-4 h-9 px-3 rounded border border-[#D1D5DB] dark:border-[#4B5563] bg-white dark:bg-[#0d1117]">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="config-status"
                      checked={form.status === 1}
                      onChange={() => handleFieldChange("status", 1)}
                      disabled={formLoading}
                      className="accent-[#F0FDF4]0"
                    />
                    <span className="text-xs font-medium text-[#16A34A] dark:text-[#4ADE80]">
                      Active
                    </span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="config-status"
                      checked={form.status === 0}
                      onChange={() => handleFieldChange("status", 0)}
                      disabled={formLoading}
                      className="accent-[#6B7280]"
                    />
                    <span className="text-xs font-medium text-[#6B7280]">Inactive</span>
                  </label>
                </div>
              </Field>
            </div>
          </>
        )}
      </div>

      {/* ══ FILTER SECTION ══ */}
      <div className="border rounded-md p-3 sm:p-4 bg-white dark:bg-[#0d1117]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3 items-end">
          <Field label="Filter by Status">
            <select
              className={selectCls}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              disabled={isLoading}
            >
              <option value="">All Status</option>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
          </Field>

          <div className="flex gap-2 sm:col-span-2 items-end">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchConfigs}
              disabled={isLoading}
              className="flex-1"
            >
              🔍 Apply
            </Button>
            <Button
              variant="print"
              size="sm"
              onClick={() => setFilterStatus("")}
              disabled={isLoading}
              className="flex-1"
            >
              ↺ Reset
            </Button>
          </div>
        </div>
      </div>

      {/* ══ TABLE ══ */}
      <div className="border p-2 rounded-md bg-white dark:bg-[#0d1117] overflow-hidden">
        <div className="w-full overflow-x-auto">
          <DataTable
            title={isLoading ? "Loading…" : "Reminder Config List"}
            columns={columns}
            selectValue="UTD"
            data={rows}
            height={440}
            filterPosition="FilterData"
            enableColumnFilters={true}
            numericFilterColumns={["UTD", "Max_Attempts_Per_Day", "Call_Delay_Ms"]}
            onRowDoubleClick={(r: ReminderConfig) => openEdit(r)}
          />
        </div>
      </div>

      <HashloaderComponent isLoading={isLoading || formLoading} />
    </div>
  );
}