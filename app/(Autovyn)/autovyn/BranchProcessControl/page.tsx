"use client";

import { useCurrentUser } from "@/app/hooks/use-current-user";
import HashloaderComponent from "@/components/Templates/hashloader";
import { Button } from "@/components/ui/button";
import CustomSelectSearch from "@/components/atoms/Select";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import Image from "next/image";
import {
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Filter,
  Lock,
  PlayCircle,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
  X,
  Calculator,
  Coins,
  ArrowRight,
  ArrowLeft,
  FileCheck2,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  CalendarDays,
} from "lucide-react";

type ProcessDetails = {
  isCompleted?: boolean;
  lockDate?: string | null;
  completionDate?: string | null;
  completedBy?: string | null;
};

type LocStatus = {
  attendanceCalculated?: boolean;
  attendanceLocked?: boolean;
  salaryRunDone?: boolean;
  salaryLocked?: boolean;

  atnPendingCount?: number;
  slryPendingCount?: number;
  hasAtnData?: boolean;
  hasSlryData?: boolean;
  canShowAttendanceReport?: boolean;
  canShowSalaryReport?: boolean;

  attendanceCalcDetails?: ProcessDetails;
  attendanceLockDetails?: ProcessDetails;
  salaryRunDetails?: ProcessDetails;
  salaryLockDetails?: ProcessDetails;
};

type StageKey = "attendanceCalc" | "attendanceLock" | "salaryRun" | "salaryLock";
type RowLoading = Partial<Record<StageKey, boolean>>;
type StatusFilter = "all" | "complete" | "progress" | "notstarted";

export default function BranchProcessControl() {
  const user = useCurrentUser();

  const [isBootLoading, setIsBootLoading] = useState(false);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [rowLoading, setRowLoading] = useState<Record<number, RowLoading>>({});

  const [formData, setFormData] = useState<{ Month: string | null; Year: string | null }>({
    Month: null,
    Year: null,
  });

  const [locationData, setLocationData] = useState<any[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<number[]>([]);
  const [statusMap, setStatusMap] = useState<Record<number, LocStatus>>({});
  const [downloadingReport, setDownloadingReport] = useState<Record<string, boolean>>({});

  const [showLockModal, setShowLockModal] = useState(false);
  const [lockDate, setLockDate] = useState("");
  const [currentProcessType, setCurrentProcessType] = useState<"" | "all" | "lock" | "salaryLock">("");
  const [pendingLocationId, setPendingLocationId] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    label: new Date(2000, i, 1).toLocaleString("en-US", { month: "long" }),
    value: (i + 1).toString(),
  }));

  const getYearOptions = [
    { label: "2027", value: "2027" },
    { label: "2026", value: "2026" },
    { label: "2025", value: "2025" },
    { label: "2024", value: "2024" },
  ];

  const STAGES: {
    key: StageKey;
    label: string;
    short: string;
    stepNum: number;
    icon: any;
    accent: string;
    bgTint: string;
    borderTint: string;
  }[] = [
    {
      key: "attendanceCalc",
      label: "Attendance Calculation",
      short: "Calculate Attendance",
      stepNum: 1,
      icon: Calculator,
      accent: "#f97316",
      bgTint: "bg-[#fff7ed] dark:bg-[#431407]/20",
      borderTint: "border-[#fed7aa] dark:border-[#7c2d12]/40",
    },
    {
      key: "attendanceLock",
      label: "Attendance Lock",
      short: "Lock Attendance",
      stepNum: 2,
      icon: Lock,
      accent: "#3b82f6",
      bgTint: "bg-[#eff6ff] dark:bg-[#172554]/20",
      borderTint: "border-[#bfdbfe] dark:border-[#1e3a8a]/40",
    },
    {
      key: "salaryRun",
      label: "Salary Run",
      short: "Execute Salary",
      stepNum: 3,
      icon: Coins,
      accent: "#10b981",
      bgTint: "bg-[#ecfdf5] dark:bg-[#022c22]/20",
      borderTint: "border-[#a7f3d0] dark:border-[#064e3b]/40",
    },
    {
      key: "salaryLock",
      label: "Salary Lock",
      short: "Lock Salary",
      stepNum: 4,
      icon: ShieldCheck,
      accent: "#ef4444",
      bgTint: "bg-[#fff1f2] dark:bg-[#4c0519]/20",
      borderTint: "border-[#fecdd3] dark:border-[#881337]/40",
    },
  ];

  function showToast(message: string, type: "success" | "error" | "warning" | "info") {
    Swal.mixin({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 4000,
      timerProgressBar: true,
    }).fire({ icon: type, title: message });
  }

  const setRowStage = (locId: number, stage: StageKey, value: boolean) => {
    setRowLoading((prev) => ({ ...prev, [locId]: { ...prev[locId], [stage]: value } }));
  };

  const isAnyRowBusy = (locId: number) => Object.values(rowLoading[locId] || {}).some(Boolean);

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ==================== UPDATE PROCESS COMPLETION ====================
  const updateProcessCompletion = async (
    locations: number[],
    processType: string,
    isCompleted: boolean,
    lockDateVal?: string | null,
    remarks?: string
  ) => {
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/admin/updateProcessCompletion`,
        {
          locations,
          Month: formData.Month,
          Year: formData.Year,
          Process_Type: processType,
          Is_Completed: isCompleted,
          Lock_Date: lockDateVal || null,
          Remarks: remarks || `${processType} completed successfully`,
          EMPCODE: user?.EMPCODE,
        },
        { headers: { compcode: user?.Comp_Code, name: user?.name } }
      );
    } catch (error) {
      console.error("Error updating process completion:", error);
    }
  };

  const fetchLocations = async () => {
    if (!formData.Month || !formData.Year) {
      return;
    }

    setIsBootLoading(true);
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/admin/getLocationsWithProcessStatus`,
        {
          Month: formData.Month,
          Year: formData.Year,
          EMPCODE: user?.EMPCODE,
        },
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
          },
        }
      );

      if (!res.data?.success || !Array.isArray(res.data?.data)) {
        throw new Error(res.data?.message || "Invalid locations API response");
      }

      const locations = res.data.data;

      const formattedLocations = locations.map((loc: any) => ({
        value: Number(loc.id),
        label: loc.name || `Branch - ${loc.id}`,
        Join_Date: loc.joinDate ?? null,
        processes: loc.processes ?? {},
      }));

      const newStatusMap: Record<number, LocStatus> = {};

      locations.forEach((loc: any) => {
        const id = Number(loc.id);
        const processes = loc.processes ?? {};
        const atnPending = loc.atnPendingCount ?? processes.attendanceCalc?.pendingCount ?? 0;
        const slryPending = loc.slryPendingCount ?? processes.salaryRun?.pendingCount ?? 0;
        const isAtnDone = processes.attendanceCalc?.isCompleted === true || Boolean(processes.attendanceCalc?.completionDate);
        const isSlryDone = processes.salaryRun?.isCompleted === true || Boolean(processes.salaryRun?.completionDate);

        newStatusMap[id] = {
          attendanceCalculated: processes.attendanceCalc?.isCompleted === true,
          attendanceLocked: processes.attendanceLock?.isCompleted === true,
          salaryRunDone: processes.salaryRun?.isCompleted === true,
          salaryLocked: processes.salaryLock?.isCompleted === true,

          atnPendingCount: atnPending,
          slryPendingCount: slryPending,
          hasAtnData: atnPending > 0,
          hasSlryData: slryPending > 0,
          canShowAttendanceReport: isAtnDone && atnPending === 0,
          canShowSalaryReport: isSlryDone && slryPending === 0,

          attendanceCalcDetails: processes.attendanceCalc ?? {},
          attendanceLockDetails: processes.attendanceLock ?? {},
          salaryRunDetails: processes.salaryRun ?? {},
          salaryLockDetails: processes.salaryLock ?? {},
        };
      });

      setLocationData(formattedLocations);
      setStatusMap(newStatusMap);
      setSelectedLocations([]);
    } catch (error: any) {
      console.error("Error fetching locations:", error.response?.data || error.message || error);
      showToast("Couldn't load branches. Please try again.", "error");
    } finally {
      setIsBootLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.branch, formData.Month, formData.Year]);

  const handleCheckboxChange = (value: number) => {
    setSelectedLocations((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  };

  const completedStageCount = (st: LocStatus) =>
    [st.attendanceCalculated, st.attendanceLocked, st.salaryRunDone, st.salaryLocked].filter(Boolean).length;

  // ==================== DERIVED STATS ====================
  const stats = useMemo(() => {
    let complete = 0;
    let inProgress = 0;
    let notStarted = 0;
    let totalStepsDone = 0;

    locationData.forEach((loc) => {
      const c = completedStageCount(statusMap[loc.value] || {});
      totalStepsDone += c;
      if (c === 4) complete++;
      else if (c === 0) notStarted++;
      else inProgress++;
    });

    const totalStepsPossible = locationData.length * 4;
    const overallProgressPercent =
      totalStepsPossible > 0 ? Math.round((totalStepsDone / totalStepsPossible) * 100) : 0;

    return {
      total: locationData.length,
      complete,
      inProgress,
      notStarted,
      totalStepsDone,
      totalStepsPossible,
      overallProgressPercent,
    };
  }, [locationData, statusMap]);

  const filteredLocations = useMemo(() => {
    return locationData.filter((loc) => {
      if (searchQuery.trim() && !loc.label.toLowerCase().includes(searchQuery.trim().toLowerCase())) {
        return false;
      }
      const c = completedStageCount(statusMap[loc.value] || {});
      if (statusFilter === "complete" && c !== 4) return false;
      if (statusFilter === "notstarted" && c !== 0) return false;
      if (statusFilter === "progress" && (c === 0 || c === 4)) return false;
      return true;
    });
  }, [locationData, statusMap, searchQuery, statusFilter]);

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredLocations.map((l) => l.value);
    const allSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedLocations.includes(id));
    if (allSelected) {
      setSelectedLocations((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedLocations((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  // ==================== PROCESS ALL SELECTED ====================
  const processAllSelected = async () => {
    if (selectedLocations.length === 0) {
      showToast("Select at least one branch first", "warning");
      return;
    }
    if (!formData.Month || !formData.Year) {
      showToast("Select a month and year first", "warning");
      return;
    }

    let needsLockDate = false;
    for (const locId of selectedLocations) {
      const st = statusMap[locId] || {};
      if ((st.attendanceCalculated && !st.attendanceLocked) || (st.salaryRunDone && !st.salaryLocked)) {
        needsLockDate = true;
        break;
      }
    }

    if (needsLockDate) {
      setCurrentProcessType("all");
      setShowLockModal(true);
      return;
    }

    await executeAllProcesses(null);
  };

  const executeAllProcesses = async (lockDateArg: string | null) => {
    setIsBulkLoading(true);
    const results = {
      attendanceCalc: { success: [] as string[], failed: [] as string[] },
      attendanceLock: { success: [] as string[], failed: [] as string[] },
      salaryRun: { success: [] as string[], failed: [] as string[] },
      salaryLock: { success: [] as string[], failed: [] as string[] },
    };

    try {
      for (const locId of selectedLocations) {
        const st = statusMap[locId] || {};
        const locName = locationData.find((l) => l.value === locId)?.label || locId;

        if (!st.attendanceCalculated) {
          try {
            const response = await axios.post(
              `${process.env.NEXT_PUBLIC_URL}/ars/Emp_AtnrunByLocation`,
              {
                MONTH: formData.Month,
                YEAR: formData.Year,
                locations: [locId],
              },
              {
                headers: {
                  compcode: user?.Comp_Code,
                  name: user?.name,
                },
              }
            );

            if (!response.data?.success) {
              throw new Error(response.data?.message || "Attendance calculation failed");
            }

            const atnWarning = response.data?.warning;
            const hasLockedAtn = (response.data?.lockedLocations?.length ?? 0) > 0;

            if (hasLockedAtn || atnWarning) {
              results.attendanceCalc.failed.push(`${locName} (${atnWarning || "Locked due to recent join date"})`);
            } else {
              results.attendanceCalc.success.push(locName);

              await updateProcessCompletion(
                [locId],
                "ATTENDANCE_CALC",
                true,
                null,
                "Attendance calculation completed"
              );
            }
          } catch (error: any) {
            console.error(`Attendance calculation failed for ${locName}:`, error);
            results.attendanceCalc.failed.push(locName);
          }
        }

        if (st.attendanceCalculated && !st.attendanceLocked) {
          try {
            const dateToUse = lockDateArg || new Date().toISOString().slice(0, 10);
            await axios.post(
              `${process.env.NEXT_PUBLIC_URL}/ars/UpdateAttendanseByLocation`,
              {
                regionCode: locId,
                joinDate: dateToUse,
                selectedLocations: [locId],
                Month: formData.Month,
                Year: formData.Year,
              },
              { headers: { compcode: user?.Comp_Code, name: user?.name } }
            );
            results.attendanceLock.success.push(locName);
            await updateProcessCompletion(
              [locId],
              "ATTENDANCE_LOCK",
              true,
              dateToUse,
              "Attendance lock completed"
            );
          } catch {
            results.attendanceLock.failed.push(locName);
          }
        }

        if (st.attendanceLocked && !st.salaryRunDone) {
          try {
            const response = await axios.post(
              `${process.env.NEXT_PUBLIC_URL}/SalaryLock/emp_slryrun_byLoction`,
              {
                MONTH: formData.Month,
                YEAR: formData.Year,
                locations: [locId],
              },
              {
                headers: {
                  compcode: user?.Comp_Code,
                  name: user?.name,
                },
              }
            );

            if (!response.data?.success) {
              throw new Error(response.data?.message || "Salary run failed");
            }

            const slryWarning = response.data?.warning;
            const hasLockedSlry = (response.data?.lockedLocations?.length ?? 0) > 0;

            if (hasLockedSlry || slryWarning) {
              results.salaryRun.failed.push(`${locName} (${slryWarning || "Salary month locked"})`);
            } else {
              results.salaryRun.success.push(locName);

              await updateProcessCompletion([locId], "SALARY_RUN", true, null, "Salary run completed");
            }
          } catch (error: any) {
            console.error(`Salary run failed for ${locName}:`, error);
            results.salaryRun.failed.push(locName);
          }
        }

        if (st.salaryRunDone && !st.salaryLocked) {
          try {
            const dateToUse = lockDateArg || new Date().toISOString().slice(0, 10);
            await axios.post(
              `${process.env.NEXT_PUBLIC_URL}/SalaryLock/updateLocationDate`,
              {
                regionCode: locId,
                joinDate: dateToUse,
                selectedLocations: [locId],
                Month: formData.Month,
                Year: formData.Year,
              },
              { headers: { compcode: user?.Comp_Code, name: user?.name } }
            );
            results.salaryLock.success.push(locName);
            await updateProcessCompletion([locId], "SALARY_LOCK", true, dateToUse, "Salary lock completed");
          } catch {
            results.salaryLock.failed.push(locName);
          }
        }
      }

      showProcessSummary(results);
      setSelectedLocations([]);
      await fetchLocations();
    } catch (error) {
      console.error(error);
      showToast("Something went wrong while processing branches", "error");
    } finally {
      setIsBulkLoading(false);
    }
  };

  const showProcessSummary = (results: any) => {
    const stageLabels: Record<string, string> = {
      attendanceCalc: "Attendance Calculation",
      attendanceLock: "Attendance Lock",
      salaryRun: "Salary Run",
      salaryLock: "Salary Lock",
    };

    let html = "";
    (Object.keys(results) as Array<keyof typeof results>).forEach((key) => {
      const { success, failed } = results[key];
      if (success.length === 0 && failed.length === 0) return;
      html += `<div style="text-align:left;margin-bottom:14px;background:#f8fafc;padding:12px 16px;border-radius:12px;border-left:5px solid #1f3b73;">
        <div style="font-weight:800;font-size:16px;margin-bottom:6px;color:#1e293b;">${stageLabels[key]}</div>`;
      if (success.length > 0) {
        html += `<div style="color:#16a34a;font-size:14px;font-weight:600;line-height:1.6;">✓ Successful: ${success.join(", ")}</div>`;
      }
      if (failed.length > 0) {
        html += `<div style="color:#dc2626;font-size:14px;font-weight:600;line-height:1.6;">✕ Failed: ${failed.join(", ")}</div>`;
      }
      html += `</div>`;
    });

    if (!html) {
      html = `<div style="font-size:15px;color:#64748b;padding:14px;">All selected branches are already up to date.</div>`;
    }

    Swal.fire({
      title: "Batch Execution Summary",
      html,
      icon: "info",
      confirmButtonText: "Done",
      confirmButtonColor: "#f97316",
      customClass: {
        popup: "rounded-3xl",
      },
    });
  };

  // ==================== SINGLE ACTIONS ====================
  const handleAttendanceReRun = async (locId: number) => {
    if (!formData.Month || !formData.Year) {
      showToast("Select a month and year first", "warning");
      return;
    }
    setRowStage(locId, "attendanceCalc", true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/ars/Emp_AtnrunByLocation`,
        {
          MONTH: formData.Month,
          YEAR: formData.Year,
          locations: [locId],
        },
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
          },
        }
      );

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Attendance calculation failed");
      }

      const warningMsg = response.data?.warning;
      const responseMsg = response.data?.message;
      const lockedList = response.data?.lockedLocations || [];
      const hasLocked = lockedList.length > 0;

      if (hasLocked || warningMsg) {
        const fullMsg = [warningMsg, responseMsg].filter(Boolean).join(" — ");
        showToast(fullMsg || "Location has been locked due to recent join date.", "warning");
      } else {
        await updateProcessCompletion(
          [locId],
          "ATTENDANCE_CALC",
          true,
          null,
          "Attendance calculation completed"
        );
        showToast(responseMsg || "Attendance calculated successfully", "success");
      }
      await fetchLocations();
    } catch (error: any) {
      console.error(error);
      showToast(error?.response?.data?.message || "Attendance calculation failed", "error");
    } finally {
      setRowStage(locId, "attendanceCalc", false);
    }
  };

  const handleAttendanceLock = (locId: number) => {
    if (!formData.Month || !formData.Year) {
      showToast("Select a month and year first", "warning");
      return;
    }
    setPendingLocationId(locId);
    setCurrentProcessType("lock");
    setShowLockModal(true);
  };

  const handleLockConfirmForSingle = async () => {
    if (!lockDate) {
      showToast("Pick a lock date first", "warning");
      return;
    }
    const locId = pendingLocationId;
    if (locId == null) return;

    setShowLockModal(false);
    setRowStage(locId, "attendanceLock", true);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/ars/UpdateAttendanseByLocation`,
        {
          regionCode: locId,
          joinDate: lockDate,
          selectedLocations: [locId],
          Month: formData.Month,
          Year: formData.Year,
        },
        { headers: { compcode: user?.Comp_Code, name: user?.name } }
      );
      await updateProcessCompletion([locId], "ATTENDANCE_LOCK", true, lockDate, "Attendance lock completed");
      showToast("Attendance locked successfully", "success");
      await fetchLocations();
    } catch (error: any) {
      console.error(error);
      showToast(error?.response?.data?.message || "Couldn't lock attendance", "error");
    } finally {
      setRowStage(locId, "attendanceLock", false);
      setPendingLocationId(null);
      setLockDate("");
    }
  };

  const handleSalaryRun = async (locId: number) => {
    if (!formData.Month || !formData.Year) {
      showToast("Select a month and year first", "warning");
      return;
    }

    setRowStage(locId, "salaryRun", true);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/SalaryLock/emp_slryrun_byLoction`,
        {
          MONTH: formData.Month,
          YEAR: formData.Year,
          locations: [locId],
        },
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
          },
        }
      );

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Salary run failed");
      }

      const warningMsg = response.data?.warning;
      const responseMsg = response.data?.message;
      const lockedList = response.data?.lockedLocations || [];
      const hasLocked = lockedList.length > 0;

      if (hasLocked || warningMsg) {
        const fullMsg = [warningMsg, responseMsg].filter(Boolean).join(" — ");
        showToast(fullMsg || "Salary is locked for this location.", "warning");
      } else {
        await updateProcessCompletion([locId], "SALARY_RUN", true, null, "Salary run completed");
        showToast(responseMsg || "Salary run completed successfully", "success");
      }
      await fetchLocations();
    } catch (error: any) {
      console.error("Salary run failed:", error);
      showToast(error?.response?.data?.message || error?.message || "Salary run failed", "error");
    } finally {
      setRowStage(locId, "salaryRun", false);
    }
  };

  const handleSalaryLock = (locId: number) => {
    if (!formData.Month || !formData.Year) {
      showToast("Select a month and year first", "warning");
      return;
    }
    setPendingLocationId(locId);
    setCurrentProcessType("salaryLock");
    setShowLockModal(true);
  };

  const handleSalaryLockConfirm = async () => {
    if (!lockDate) {
      showToast("Pick a lock date first", "warning");
      return;
    }
    const locId = pendingLocationId;
    if (locId == null) return;

    setShowLockModal(false);
    setRowStage(locId, "salaryLock", true);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/SalaryLock/updateLocationDate`,
        {
          regionCode: locId,
          joinDate: lockDate,
          selectedLocations: [locId],
          Month: formData.Month,
          Year: formData.Year,
        },
        { headers: { compcode: user?.Comp_Code, name: user?.name } }
      );
      await updateProcessCompletion([locId], "SALARY_LOCK", true, lockDate, "Salary lock completed");
      showToast("Salary locked successfully", "success");
      await fetchLocations();
    } catch (error: any) {
      console.error(error);
      showToast(error?.response?.data?.message || "Couldn't lock salary", "error");
    } finally {
      setRowStage(locId, "salaryLock", false);
      setPendingLocationId(null);
      setLockDate("");
    }
  };

  // ==================== REPORT DOWNLOAD HANDLERS ====================
  const getMonthDateRange = (monthStr: string, yearStr: string) => {
    const m = parseInt(monthStr, 10);
    const y = parseInt(yearStr, 10);
    const start = `${y}-${String(m).padStart(2, "0")}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const end = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    return { dateFrom: start, dateto: end };
  };

  const downloadAttendanceReport = async (locId: number, locName: string) => {
    if (!formData.Month || !formData.Year) {
      showToast("Select a month and year first", "warning");
      return;
    }
    const key = `atn-${locId}`;
    setDownloadingReport((prev) => ({ ...prev, [key]: true }));
    try {
      const { dateFrom, dateto } = getMonthDateRange(formData.Month, formData.Year);
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/hrmsreport/attendanceReport?compcode=${user?.Comp_Code}`,
        {
          dateFrom,
          dateto,
          location: locId,
          user_location: 1,
          reporttype: 1,
        },
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
          },
          responseType: "blob",
        }
      );

      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `Attendance_Report_${locName.replace(/\s+/g, "_")}_${formData.Month}_${formData.Year}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      showToast(`Attendance report downloaded for ${locName}`, "success");
    } catch (error: any) {
      console.error("Error downloading attendance report:", error);
      showToast("Failed to download attendance report.", "error");
    } finally {
      setDownloadingReport((prev) => ({ ...prev, [key]: false }));
    }
  };

  const downloadSalaryReport = async (locId: number, locName: string) => {
    if (!formData.Month || !formData.Year) {
      showToast("Select a month and year first", "warning");
      return;
    }
    const key = `slry-${locId}`;
    setDownloadingReport((prev) => ({ ...prev, [key]: true }));
    try {
      const { dateFrom, dateto } = getMonthDateRange(formData.Month, formData.Year);
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/hrmsreport/SalaryReport?compcode=${user?.Comp_Code}`,
        {
          dateFrom,
          dateto,
          location: locId,
          user_location: 1,
        },
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
          },
          responseType: "blob",
        }
      );

      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `Salary_Report_${locName.replace(/\s+/g, "_")}_${formData.Month}_${formData.Year}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      showToast(`Salary report downloaded for ${locName}`, "success");
    } catch (error: any) {
      console.error("Error downloading salary report:", error);
      showToast("Failed to download salary report.", "error");
    } finally {
      setDownloadingReport((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleLockDateConfirm = () => {
    if (!lockDate) {
      showToast("Pick a lock date first", "warning");
      return;
    }
    setShowLockModal(false);
    executeAllProcesses(lockDate);
  };

  const closeLockModal = () => {
    setShowLockModal(false);
    setLockDate("");
    setPendingLocationId(null);
    setCurrentProcessType("");
  };

  const filterChips: { key: StatusFilter; label: string; count: number; activeClass: string }[] = [
    {
      key: "all",
      label: "All Branches",
      count: stats.total,
      activeClass: "bg-[#0f172a] text-white dark:bg-white dark:text-[#020617] border-transparent shadow-md",
    },
    {
      key: "complete",
      label: "Fully Completed",
      count: stats.complete,
      activeClass: "bg-[#059669] text-white border-transparent shadow-md shadow-[#10b981]/25",
    },
    {
      key: "progress",
      label: "In Progress",
      count: stats.inProgress,
      activeClass: "bg-[#d97706] text-white border-transparent shadow-md shadow-[#f59e0b]/25",
    },
    {
      key: "notstarted",
      label: "Pending",
      count: stats.notStarted,
      activeClass: "bg-[#e11d48] text-white border-transparent shadow-md shadow-[#f43f5e]/25",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc]/90 dark:bg-[#090d16] text-[#1e293b] dark:text-[#f1f5f9] font-sans antialiased pb-24 text-base">
      {/* ============================================================== */}
      {/* 1. HERO & EXECUTIVE HEADER (Enhanced Size for Zoom)           */}
      {/* ============================================================== */}
      <div className="relative overflow-hidden bg-header text-white border-b border-[#1e293b]/80 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#6366f1]/15 via-transparent to-transparent pointer-events-none" />

        <div className=" mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-7 relative z-10">
          <div className="flex flex-wrap justify-between items-center gap-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#f97316] to-[#fb923c] p-3 flex items-center justify-center shadow-xl shadow-[#f97316]/30 ring-2 ring-white/15 shrink-0">
                <Image
                  src="/Payrollicon/attendence_calculation.png"
                  alt="Autovyn Engine"
                  width={34}
                  height={34}
                  className="brightness-0 invert object-contain"
                />
              </div>

              <div>
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-0.5 text-xs sm:text-sm font-extrabold uppercase tracking-wider rounded-md bg-white/15 text-[#fdba74] border border-white/10">
                    HRMS Pipeline
                  </span>
                  <span className="text-sm font-semibold text-[#cbd5e1]">Autovyn ERP</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2 mt-1">
                  Branch Process Control
                </h1>
                <p className="text-sm sm:text-base text-[#cbd5e1] mt-1 font-medium">
                  End-to-end 4-step monthly attendance, calculation & payroll closing engine
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => window.history.back()}
                className="px-5 py-2.5 rounded-xl text-sm sm:text-base font-bold bg-white/10 hover:bg-white/15 text-white border border-white/15 backdrop-blur-sm transition-all duration-200 flex items-center gap-2.5 active:scale-95 shadow-md"
              >
                <ArrowLeft className="w-5 h-5" />
                Back 
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. DASHBOARD CONTROL BAR (Period, Search & Filter Chips)       */}
      {/* ============================================================== */}
      <div className=" mx-auto px-4 sm:px-6 lg:px-8 -mt-4 relative z-20">
        <div className="bg-white dark:bg-[#0f172a] rounded-2xl shadow-xl shadow-[#e2e8f0]/60 dark:shadow-black/60 border border-[#e2e8f0] dark:border-[#1e293b] p-5 sm:p-6 backdrop-blur-md">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            {/* Period selector */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="w-52">
                <CustomSelectSearch
                  title={"Month"}
                  name={"Month"}
                  selectedValue={formData.Month ?? ""}
                  options={monthOptions}
                  handleInputChange={handleInputChange}
                  placeholder="Select Month"
                  className="!h-11 !text-base !rounded-xl !border-[#cbd5e1] dark:!border-[#334155] font-bold"
                  labelClass="!text-sm !font-black !text-[#1e293b] dark:!text-white mb-1"
                />
              </div>
              <div className="w-44">
                <CustomSelectSearch
                  title={"Year"}
                  name={"Year"}
                  selectedValue={formData.Year ?? ""}
                  options={getYearOptions}
                  handleInputChange={handleInputChange}
                  placeholder="Select Year"
                  className="!h-11 !text-base !rounded-xl !border-[#cbd5e1] dark:!border-[#334155] font-bold"
                  labelClass="!text-sm !font-black !text-[#1e293b] dark:!text-white mb-1"
                />
              </div>
            </div>

            {/* Search and Filters */}
            {locationData.length > 0 && (
              <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="w-5 h-5 text-[#94a3b8] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search branch name or ID…"
                    className="w-full pl-11 pr-10 py-3 text-base sm:text-lg rounded-xl border border-[#e2e8f0] dark:border-[#1e293b] bg-[#f8fafc] dark:bg-[#020617] focus:bg-white dark:focus:bg-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#f97316]/30 focus:border-[#f97316] transition-all text-[#1e293b] dark:text-white font-medium"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#475569] dark:hover:text-[#f1f5f9] p-1"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Filter chips */}
                <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#f1f5f9] dark:bg-[#020617]/80 rounded-xl border border-[#e2e8f0] dark:border-[#1e293b]">
                  {filterChips.map((chip) => {
                    const isActive = statusFilter === chip.key;
                    return (
                      <button
                        key={chip.key}
                        onClick={() => setStatusFilter(chip.key)}
                        className={`text-sm sm:text-base font-bold px-4 py-2 rounded-lg transition-all duration-150 flex items-center gap-2 ${
                          isActive
                            ? chip.activeClass
                            : "text-[#475569] dark:text-[#cbd5e1] hover:text-[#0f172a] dark:hover:text-white"
                        }`}
                      >
                        {chip.label}
                        <span
                          className={`text-xs sm:text-sm font-black px-2 py-0.5 rounded-full ${
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-[#e2e8f0] dark:bg-[#1e293b] text-[#334155] dark:text-[#f1f5f9]"
                          }`}
                        >
                          {chip.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. MAIN DASHBOARD CONTENT AREA                                 */}
      {/* ============================================================== */}
      <div className=" mx-auto px-4 sm:px-6 lg:px-8 mt-7">
        {!formData.Month || !formData.Year ? (
          <EmptyState
            icon={CalendarDays}
            title="Select Month & Year"
            subtitle="Please select a billing period from the top selector to display active branch pipelines."
          />
        ) : isBootLoading ? (
          <div className="mt-8 text-center py-28 bg-white dark:bg-[#0f172a] rounded-3xl border border-[#e2e8f0] dark:border-[#1e293b] shadow-sm">
            <div className="inline-flex p-5 rounded-full bg-[#fff7ed] dark:bg-[#431407]/30 text-[#f97316] mb-4 animate-bounce">
              <RefreshCw className="w-10 h-10 animate-spin" />
            </div>
            <h3 className="text-xl font-extrabold text-[#1e293b] dark:text-white">Synchronizing Branch Data</h3>
            <p className="text-base text-[#64748b] dark:text-[#cbd5e1] mt-1.5 font-medium">
              Fetching stage completion logs, lock dates and employee counts…
            </p>
          </div>
        ) : locationData.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No Branches Available"
            subtitle="No branch records were found for your user profile in this period."
          />
        ) : (
          <div className="space-y-6">
            {/* KPI STAT CARDS + GLOBAL PROGRESS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              <KpiCard
                title="Total Branches"
                value={stats.total}
                sublabel="Configured in System"
                icon={Building2}
                colorClass="text-[#1e293b] dark:text-white"
                bgGradient="from-[#64748b]/15 to-[#6366f1]/15"
                borderColor="border-[#e2e8f0] dark:border-[#1e293b]"
              />
              <KpiCard
                title="Fully Completed"
                value={stats.complete}
                sublabel={`${
                  stats.total ? Math.round((stats.complete / stats.total) * 100) : 0
                }% of Total Branches`}
                icon={CheckCircle2}
                colorClass="text-[#059669] dark:text-[#34d399]"
                bgGradient="from-[#10b981]/15 to-[#14b8a6]/15"
                borderColor="border-[#a7f3d0] dark:border-[#064e3b]/40"
              />
              <KpiCard
                title="In Progress"
                value={stats.inProgress}
                sublabel="Pipeline Running"
                icon={Clock}
                colorClass="text-[#d97706] dark:text-[#fbbf24]"
                bgGradient="from-[#f59e0b]/15 to-[#f97316]/15"
                borderColor="border-[#fde68a] dark:border-[#78350f]/40"
              />
              <KpiCard
                title="Not Started"
                value={stats.notStarted}
                sublabel="Pending Stage 1"
                icon={AlertTriangle}
                colorClass="text-[#e11d48] dark:text-[#fb7185]"
                bgGradient="from-[#f43f5e]/15 to-[#ef4444]/15"
                borderColor="border-[#fecdd3] dark:border-[#881337]/40"
              />
            </div>

            {/* GLOBAL PIPELINE PROGRESS STRIP */}
            <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-5 sm:p-6 border border-[#e2e8f0] dark:border-[#1e293b] shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-[#f97316] animate-pulse" />
                  <span className="text-base sm:text-lg font-extrabold text-[#1e293b] dark:text-white">
                    Overall Monthly Closing Progress
                  </span>
                  <span className="text-sm text-[#64748b] dark:text-[#cbd5e1] font-semibold">
                    ({stats.totalStepsDone} of {stats.totalStepsPossible} Stage Executions Completed)
                  </span>
                </div>
                <span className="text-lg sm:text-xl font-black text-[#ea580c] dark:text-[#fb923c]">
                  {stats.overallProgressPercent}% Complete
                </span>
              </div>

              {/* Progress track */}
              <div className="w-full h-4 rounded-full bg-[#f1f5f9] dark:bg-[#1e293b] overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#f97316] via-[#f59e0b] to-[#10b981] transition-all duration-500 shadow-sm"
                  style={{ width: `${stats.overallProgressPercent}%` }}
                />
              </div>

              {/* 4 Steps Legend Banner */}
              <div className="mt-5 pt-4 border-t border-[#f1f5f9] dark:border-[#1e293b]/80 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                {STAGES.map((s, idx) => {
                  const Icon = s.icon;
                  return (
                    <div
                      key={s.key}
                      className="flex items-center gap-3 p-3 rounded-xl bg-[#f8fafc] dark:bg-[#020617]/50 border border-[#e2e8f0] dark:border-[#1e293b]/60"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 text-sm font-black shadow-sm"
                        style={{ backgroundColor: s.accent }}
                      >
                        {idx + 1}
                      </div>
                      <div className="truncate">
                        <span className="font-bold text-[#1e293b] dark:text-[#f1f5f9] block truncate text-sm sm:text-base">
                          {s.label}
                        </span>
                        <span className="text-xs font-semibold text-[#64748b] dark:text-[#94a3b8]">
                          Stage {idx + 1}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* BATCH ACTION & SELECTION BAR */}
            <div className="flex flex-wrap items-center justify-between gap-5 bg-gradient-to-r from-[#0f172a] to-[#1e293b] text-white rounded-2xl p-5 shadow-lg">
              <label className="flex items-center gap-3.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={
                    filteredLocations.length > 0 &&
                    filteredLocations.every((l) => selectedLocations.includes(l.value))
                  }
                  onChange={handleSelectAllFiltered}
                  className="w-6 h-6 rounded cursor-pointer accent-[#f97316] ring-2 ring-white/20"
                />
                <div>
                  <span className="font-extrabold text-base sm:text-lg text-white block">
                    Select All Visible Branches
                  </span>
                  <span className="text-sm font-medium text-[#cbd5e1]">
                    {selectedLocations.length} branch(es) currently selected
                  </span>
                </div>
              </label>

              <button
                onClick={processAllSelected}
                disabled={isBulkLoading || selectedLocations.length === 0}
                className="px-8 py-3.5 rounded-xl font-black text-base sm:text-lg bg-gradient-to-r from-[#f97316] to-[#f59e0b] hover:from-[#ea580c] hover:to-[#d97706] text-white shadow-xl shadow-[#f97316]/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-2.5"
              >
                {isBulkLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Executing Batch Pipeline…
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-6 h-6" />
                    Process {selectedLocations.length > 0 ? `${selectedLocations.length} Selected` : "Pipeline"}
                  </>
                )}
              </button>
            </div>

            {/* ============================================================== */}
            {/* 4. BRANCH PIPELINE CARDS (The Core Experience)                */}
            {/* ============================================================== */}
            <div className="space-y-5">
              {filteredLocations.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-[#0f172a] rounded-2xl border border-[#e2e8f0] dark:border-[#1e293b]">
                  <Search className="w-12 h-12 text-[#cbd5e1] mx-auto mb-3" />
                  <p className="text-lg font-bold text-[#1e293b] dark:text-[#f1f5f9]">
                    No branches match your current filter & search
                  </p>
                  <p className="text-sm text-[#94a3b8] mt-1 font-medium">
                    Try resetting the search bar or changing status filter.
                  </p>
                </div>
              ) : (
                filteredLocations.map((location) => {
                  const st: LocStatus = statusMap[location.value] || {};
                  const doneCount = completedStageCount(st);
                  const allCompleted = doneCount === 4;
                  const notStarted = doneCount === 0;
                  const busy = isAnyRowBusy(location.value);
                  const rl = rowLoading[location.value] || {};
                  const isChecked = selectedLocations.includes(location.value);

                  const stageDone = (key: StageKey) =>
                    key === "attendanceCalc"
                      ? st.attendanceCalculated
                      : key === "attendanceLock"
                      ? st.attendanceLocked
                      : key === "salaryRun"
                      ? st.salaryRunDone
                      : st.salaryLocked;

                  const stageUnlocked = (key: StageKey) => {
                    if (key === "attendanceCalc") return true;
                    if (key === "attendanceLock") return Boolean(st.attendanceCalculated);
                    if (key === "salaryRun") return Boolean(st.attendanceLocked);
                    return Boolean(st.salaryRunDone);
                  };

                  const stageAction = (key: StageKey) => {
                    if (key === "attendanceCalc") handleAttendanceReRun(location.value);
                    if (key === "attendanceLock") handleAttendanceLock(location.value);
                    if (key === "salaryRun") handleSalaryRun(location.value);
                    if (key === "salaryLock") handleSalaryLock(location.value);
                  };

                  // Status badge helper
                  const statusConfig = allCompleted
                    ? {
                        label: "Fully Closed",
                        badgeClass: "bg-[#ecfdf5] text-[#047857] dark:bg-[#022c22]/40 dark:text-[#6ee7b7] border-[#a7f3d0] dark:border-[#065f46]",
                        dotClass: "bg-[#10b981]",
                      }
                    : notStarted
                    ? {
                        label: "Not Started",
                        badgeClass: "bg-[#f1f5f9] text-[#475569] dark:bg-[#1e293b] dark:text-[#cbd5e1] border-[#e2e8f0] dark:border-[#334155]",
                        dotClass: "bg-[#94a3b8]",
                      }
                    : {
                        label: `In Progress (${doneCount}/4)`,
                        badgeClass: "bg-[#fffbeb] text-[#b45309] dark:bg-[#451a03]/40 dark:text-[#fcd34d] border-[#fde68a] dark:border-[#92400e]",
                        dotClass: "bg-[#f59e0b]",
                      };

                  const initials = location.label.slice(0, 2).toUpperCase();

                  return (
                    <div
                      key={location.value}
                      className={`rounded-2xl bg-white dark:bg-[#0f172a] border transition-all duration-200 overflow-hidden shadow-sm hover:shadow-lg ${
                        isChecked
                          ? "border-[#fb923c] dark:border-[#f97316] ring-2 ring-[#fb923c]/25"
                          : allCompleted
                          ? "border-[#a7f3d0] dark:border-[#064e3b]/50"
                          : "border-[#e2e8f0] dark:border-[#1e293b]"
                      }`}
                    >
                      {/* CARD HEADER */}
                      <div className="p-5 sm:p-6 border-b border-[#f1f5f9] dark:border-[#1e293b]/80 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-[#f8fafc] to-transparent dark:from-[#020617]/50">
                        <div className="flex items-center gap-4">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleCheckboxChange(location.value)}
                            className="w-6 h-6 rounded cursor-pointer accent-[#f97316]"
                          />

                          {/* Branch Avatar */}
                          <div
                            className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-base sm:text-lg text-white shrink-0 shadow-md ${
                              allCompleted
                                ? "bg-gradient-to-tr from-[#059669] to-[#14b8a6]"
                                : notStarted
                                ? "bg-gradient-to-tr from-[#475569] to-[#334155]"
                                : "bg-gradient-to-tr from-[#f97316] to-[#f59e0b]"
                            }`}
                          >
                            {initials}
                          </div>

                          <div>
                            <div className="flex items-center gap-2.5">
                              <h3 className="font-black text-xl sm:text-2xl text-[#1e293b] dark:text-white leading-tight">
                                {location.label}
                              </h3>
                              <span className="text-xs sm:text-sm font-mono px-2.5 py-0.5 rounded-md bg-[#f1f5f9] dark:bg-[#1e293b] text-[#334155] dark:text-[#f1f5f9] font-bold">
                                #{location.value}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 mt-1.5">
                              <span
                                className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold px-3 py-1 rounded-full border ${statusConfig.badgeClass}`}
                              >
                                <span className={`w-2 h-2 rounded-full ${statusConfig.dotClass}`} />
                                {statusConfig.label}
                              </span>

                              {location.Join_Date && (
                                <span className="text-xs sm:text-sm text-[#64748b] dark:text-[#cbd5e1] font-medium flex items-center gap-1.5">
                                  <Calendar className="w-4 h-4 text-[#94a3b8]" />
                                  Lock Ref: {location.Join_Date}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Progress meter */}
                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                          <div className="text-right">
                            <span className="text-sm sm:text-base font-extrabold text-[#1e293b] dark:text-white">
                              {doneCount} of 4 Completed
                            </span>
                            <div className="w-40 h-3 rounded-full bg-[#f1f5f9] dark:bg-[#1e293b] mt-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  allCompleted
                                    ? "bg-[#10b981]"
                                    : notStarted
                                    ? "bg-[#cbd5e1] dark:bg-[#334155]"
                                    : "bg-[#f97316]"
                                }`}
                                style={{ width: `${(doneCount / 4) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 4 INTERACTIVE STAGES ROW */}
                      <div className="p-5 sm:p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                          {STAGES.map((stage, idx) => {
                            const isDone = Boolean(stageDone(stage.key));
                            const isUnlocked = stageUnlocked(stage.key);
                            const isLoading = Boolean(rl[stage.key]);
                            const Icon = stage.icon;

                            // Details
                            let metaDetails: ProcessDetails | undefined;
                            let showLockDateChip = false;

                            if (stage.key === "attendanceCalc") {
                              metaDetails = st.attendanceCalcDetails;
                            } else if (stage.key === "attendanceLock") {
                              metaDetails = st.attendanceLockDetails;
                              showLockDateChip = true;
                            } else if (stage.key === "salaryRun") {
                              metaDetails = st.salaryRunDetails;
                            } else if (stage.key === "salaryLock") {
                              metaDetails = st.salaryLockDetails;
                              showLockDateChip = true;
                            }

                            return (
                              <div
                                key={stage.key}
                                className={`relative rounded-2xl border p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 ${
                                  isDone
                                    ? "bg-[#ecfdf5]/60 dark:bg-[#022c22]/20 border-[#a7f3d0] dark:border-[#064e3b]/50"
                                    : !isUnlocked
                                    ? "bg-[#f8fafc]/70 dark:bg-[#020617]/40 border-[#e2e8f0]/80 dark:border-[#1e293b]/80 opacity-80"
                                    : "bg-white dark:bg-[#0f172a] border-[#e2e8f0] dark:border-[#1e293b] hover:border-[#cbd5e1] shadow-sm"
                                }`}
                              >
                                <div>
                                  {/* Step badge & Title */}
                                  <div className="flex items-center justify-between gap-2.5 mb-3">
                                    <div className="flex items-center gap-2.5">
                                      <div
                                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-sm ${
                                          isDone
                                            ? "bg-[#059669] text-white"
                                            : isUnlocked
                                            ? "bg-[#f97316] text-white"
                                            : "bg-[#e2e8f0] dark:bg-[#1e293b] text-[#64748b]"
                                        }`}
                                      >
                                        {isDone ? <Check className="w-5 h-5" /> : idx + 1}
                                      </div>
                                      <span className="font-extrabold text-base sm:text-lg text-[#1e293b] dark:text-white">
                                        {stage.short}
                                      </span>
                                    </div>

                                    {isDone ? (
                                      <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-extrabold text-[#059669] dark:text-[#34d399] bg-[#d1fae5]/70 dark:bg-[#064e3b]/50 px-2.5 py-1 rounded-full">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Done
                                      </span>
                                    ) : !isUnlocked ? (
                                      <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#94a3b8] bg-[#f1f5f9] dark:bg-[#1e293b] px-2.5 py-1 rounded-full">
                                        <Lock className="w-3.5 h-3.5" />
                                        Locked
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#ea580c] dark:text-[#fb923c] bg-[#ffedd5]/70 dark:bg-[#431407]/50 px-2.5 py-1 rounded-full">
                                        Ready
                                      </span>
                                    )}
                                  </div>

                                  {/* Sub-meta details (Dates, Lock Dates, User) */}
                                  <div className="space-y-2 my-3 text-sm">
                                    {showLockDateChip && (
                                      <div className="flex items-center justify-between text-[#64748b] dark:text-[#cbd5e1] bg-[#f1f5f9] dark:bg-[#1e293b]/70 px-3 py-2 rounded-xl border border-[#e2e8f0]/60 dark:border-[#334155]/40">
                                        <span className="font-semibold flex items-center gap-1.5">
                                          <Calendar className="w-4 h-4 text-[#94a3b8]" />
                                          Lock Date:
                                        </span>
                                        <span className="font-black text-[#1e293b] dark:text-white">
                                          {metaDetails?.lockDate
                                            ? (() => {
                                                const rawDate = String(metaDetails.lockDate).slice(0, 10);
                                                const [year, month, day] = rawDate.split("-");
                                                return year && month && day ? `${day}-${month}-${year}` : rawDate;
                                              })()
                                            : "Not Locked"}
                                        </span>
                                      </div>
                                    )}

                                    {metaDetails?.completionDate ? (
                                      <div className="text-xs sm:text-sm text-[#64748b] dark:text-[#cbd5e1] font-medium space-y-1">
                                        <div className="flex items-center gap-1.5">
                                          <Clock className="w-4 h-4 text-[#94a3b8]" />
                                          <span>
                                            {new Date(metaDetails.completionDate).toLocaleString("en-IN", {
                                              day: "2-digit",
                                              month: "short",
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            })}
                                          </span>
                                        </div>
                                        {metaDetails?.completedBy && (
                                          <div className="flex items-center gap-1.5 text-[#94a3b8]">
                                            <User className="w-4 h-4" />
                                            <span>By: {metaDetails.completedBy}</span>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      !isDone && (
                                        <div className="text-xs sm:text-sm text-[#94a3b8] italic font-medium">
                                          {isUnlocked ? "Awaiting execution" : `Requires Step ${idx} completion`}
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>

                                {/* ACTION BUTTON & CONDITIONAL REPORT DOWNLOAD */}
                                <div className="mt-3 flex flex-col gap-2">
                                  <button
                                    onClick={() => stageAction(stage.key)}
                                    disabled={busy || isLoading || (!isUnlocked && !isDone)}
                                    className={`w-full py-3 px-4 rounded-xl text-sm sm:text-base font-black transition-all duration-150 flex items-center justify-center gap-2 active:scale-95 shadow-sm ${
                                      isLoading
                                        ? "bg-[#e2e8f0] dark:bg-[#1e293b] text-[#94a3b8] cursor-not-allowed"
                                        : isDone
                                        ? stage.key === "attendanceCalc"
                                          ? "bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] hover:bg-[#f8fafc] text-[#1e293b] dark:text-[#f1f5f9]"
                                          : "bg-[#d1fae5] dark:bg-[#022c22]/60 text-[#065f46] dark:text-[#6ee7b7] cursor-default"
                                        : !isUnlocked
                                        ? "bg-[#f1f5f9] dark:bg-[#1e293b] text-[#94a3b8] cursor-not-allowed border border-transparent"
                                        : "bg-[#f97316] hover:bg-[#ea580c] text-white shadow-md shadow-[#f97316]/25"
                                    }`}
                                  >
                                    {isLoading ? (
                                      <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        Processing…
                                      </>
                                    ) : isDone ? (
                                      stage.key === "attendanceCalc" ? (
                                        <>
                                          <RefreshCw className="w-4 h-4" />
                                          Re-run Calculation
                                        </>
                                      ) : (
                                        <>
                                          <Check className="w-4 h-4" />
                                          Completed
                                        </>
                                      )
                                    ) : !isUnlocked ? (
                                      <>
                                        <Lock className="w-4 h-4" />
                                        Locked
                                      </>
                                    ) : (
                                      <>
                                        <PlayCircle className="w-4 h-4" />
                                        {stage.short}
                                      </>
                                    )}
                                  </button>

                                  

                                  {/* ATTENDANCE REPORT BUTTON (Shown when Attendance Calc is completed AND no pending rows in Emp_Atnrun) */}
                                  {stage.key === "attendanceCalc" && (isDone || metaDetails?.completionDate) && (
                                    st.hasAtnData ? (
                                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#fff7ed] dark:bg-[#431407]/40 border border-[#fed7aa] dark:border-[#7c2d12]/50 text-xs sm:text-sm font-bold text-[#c2410c] dark:text-[#fdba74]">
                                        <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-[#ea580c]" />
                                        <span>Attendance rerun in progress ({st.atnPendingCount} queued)</span>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => downloadAttendanceReport(location.value, location.label)}
                                        disabled={downloadingReport[`atn-${location.value}`]}
                                        className="w-full py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition-all duration-150 flex items-center justify-center gap-2 bg-[#059669] hover:bg-[#047857] text-white shadow-sm active:scale-95"
                                        title="Download Excel Attendance Report"
                                      >
                                        {downloadingReport[`atn-${location.value}`] ? (
                                          <>
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            Downloading Attendance Report…
                                          </>
                                        ) : (
                                          <>
                                            <FileSpreadsheet className="w-4 h-4" />
                                            Attendance Report
                                          </>
                                        )}
                                      </button>
                                    )
                                  )}

                                  {/* SALARY REPORT BUTTON (Shown when Salary Run is completed AND no pending rows in Emp_Slryrun) */}
                                  {stage.key === "salaryRun" && (isDone || metaDetails?.completionDate) && (
                                    st.hasSlryData ? (
                                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#fff7ed] dark:bg-[#431407]/40 border border-[#fed7aa] dark:border-[#7c2d12]/50 text-xs sm:text-sm font-bold text-[#c2410c] dark:text-[#fdba74]">
                                        <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-[#ea580c]" />
                                        <span>Salary rerun in progress ({st.slryPendingCount} queued)</span>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => downloadSalaryReport(location.value, location.label)}
                                        disabled={downloadingReport[`slry-${location.value}`]}
                                        className="w-full py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition-all duration-150 flex items-center justify-center gap-2 bg-[#0284c7] hover:bg-[#0369a1] text-white shadow-sm active:scale-95"
                                        title="Download Excel Salary Report"
                                      >
                                        {downloadingReport[`slry-${location.value}`] ? (
                                          <>
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            Downloading Salary Report…
                                          </>
                                        ) : (
                                          <>
                                            <FileSpreadsheet className="w-4 h-4" />
                                            Salary Report
                                          </>
                                        )}
                                      </button>
                                    )
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      <HashloaderComponent isLoading={isBootLoading} />

      {/* ============================================================== */}
      {/* 5. MODERN LOCK DATE SELECTION MODAL                            */}
      {/* ============================================================== */}
      {showLockModal && (
        <div className="fixed inset-0 bg-[#020617]/65 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0f172a] rounded-3xl p-7 sm:p-8 max-w-lg w-full shadow-2xl border border-[#e2e8f0] dark:border-[#1e293b] relative">
            <button
              onClick={closeLockModal}
              className="absolute right-5 top-5 text-[#94a3b8] hover:text-[#475569] dark:hover:text-white p-1 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-[#ffedd5] dark:bg-[#431407]/40 text-[#ea580c] dark:text-[#fb923c] flex items-center justify-center mb-4">
              <CalendarDays className="w-7 h-7" />
            </div>

            <h2 className="text-2xl font-black text-[#0f172a] dark:text-white">
              {currentProcessType === "all" ? "Batch Lock Date Required" : "Set Branch Lock Date"}
            </h2>

            <p className="text-sm sm:text-base text-[#64748b] dark:text-[#cbd5e1] mt-2 mb-6 leading-relaxed font-medium">
              {currentProcessType === "all"
                ? "One or more selected branches require a cutoff date to be recorded for Attendance and/or Salary Lock."
                : "Select the closing cutoff date to be written into the branch lock records."}
            </p>

            <div className="space-y-1.5 mb-7">
              <label className="text-xs sm:text-sm font-extrabold text-[#334155] dark:text-[#cbd5e1] uppercase tracking-wider block">
                Closing Cutoff Date
              </label>
              <input
                type="date"
                value={lockDate}
                onChange={(e) => setLockDate(e.target.value)}
                className="w-full px-4 py-3.5 text-base sm:text-lg font-bold border border-[#e2e8f0] dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f97316]/30 focus:border-[#f97316] bg-[#f8fafc] dark:bg-[#020617] dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-3.5 pt-3 border-t border-[#f1f5f9] dark:border-[#1e293b]">
              <button
                onClick={closeLockModal}
                className="px-5 py-3 rounded-xl text-base font-bold text-[#475569] dark:text-[#cbd5e1] hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b] transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  if (currentProcessType === "all") handleLockDateConfirm();
                  else if (currentProcessType === "lock") handleLockConfirmForSingle();
                  else if (currentProcessType === "salaryLock") handleSalaryLockConfirm();
                }}
                className="px-7 py-3 rounded-xl text-base font-black bg-[#f97316] hover:bg-[#ea580c] text-white shadow-lg shadow-[#f97316]/30 active:scale-95 transition-all flex items-center gap-2"
              >
                <Check className="w-5 h-5" />
                Confirm & Lock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== REUSABLE KPI CARD ====================
function KpiCard({
  title,
  value,
  sublabel,
  icon: Icon,
  colorClass,
  bgGradient,
  borderColor,
}: {
  title: string;
  value: number;
  sublabel: string;
  icon: any;
  colorClass: string;
  bgGradient: string;
  borderColor: string;
}) {
  return (
    <div
      className={`rounded-2xl p-5 sm:p-6 bg-white dark:bg-[#0f172a] border ${borderColor} shadow-sm relative overflow-hidden transition-all duration-200 hover:shadow-lg`}
    >
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-gradient-to-br ${bgGradient} blur-xl pointer-events-none`} />

      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-sm sm:text-base font-bold text-[#64748b] dark:text-[#cbd5e1] block mb-1">
            {title}
          </span>
          <span className={`text-4xl sm:text-5xl font-black tracking-tight ${colorClass} block`}>
            {value}
          </span>
          <span className="text-xs sm:text-sm text-[#94a3b8] dark:text-[#64748b] mt-1.5 block font-semibold">
            {sublabel}
          </span>
        </div>

        <div className="p-3 sm:p-3.5 rounded-2xl bg-[#f8fafc] dark:bg-[#1e293b] text-[#475569] dark:text-[#cbd5e1] border border-[#f1f5f9] dark:border-[#334155]/60 shrink-0 shadow-sm">
          <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
        </div>
      </div>
    </div>
  );
}

// ==================== REUSABLE EMPTY STATE ====================
function EmptyState({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: any;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mt-8 text-center py-24 px-6 rounded-3xl border-2 border-dashed border-[#e2e8f0] dark:border-[#1e293b] bg-white dark:bg-[#0f172a]/50 shadow-sm max-w-xl mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-[#fff7ed] dark:bg-[#431407]/40 text-[#f97316] flex items-center justify-center mx-auto mb-4 shadow-sm">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-black text-[#1e293b] dark:text-white">{title}</h3>
      <p className="text-sm sm:text-base text-[#64748b] dark:text-[#cbd5e1] mt-2 max-w-md mx-auto leading-relaxed font-medium">
        {subtitle}
      </p>
    </div>
  );
}