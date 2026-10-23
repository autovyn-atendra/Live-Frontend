"use client";
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import HashloaderComponent from "@/components/Templates/hashloader";
import Swal from "sweetalert2";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// Child Components matching Images 1 & 2
import StatCard from "./StatCard";
import DashboardCard from "./DashboardCard";
import AttendanceChart from "./AttendanceChart";
import DepartmentsTodayCard from "./DepartmentsTodayCard";
import MonthWiseSalaryChart from "./MonthWiseSalaryChart";
import DepartmentSalaryChart from "./DepartmentSalaryChart";
import LocationSalaryChart from "./LocationSalaryChart";
import EmployeeListModal from "./EmployeeListModal";
import EmployeeProfileModal from "./EmployeeProfileModal";
import EmployeeDetailDialog from "./EmployeeDetailDialog";
import Ainput from "@/components/atoms/Input";

// ============ UTILS ============
const showSideAlert = (message: string, type: "success" | "error" | "warning" | "info" = "info") => {
    Swal.mixin({ toast: true, position: "top-end", showConfirmButton: false, timer: 4000, timerProgressBar: true })
        .fire({ icon: type, title: message });
};

const getCurrentDate = (monthsBack = 0) => {
    const d = new Date();
    if (monthsBack > 0) d.setMonth(d.getMonth() - monthsBack);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const getDefaultPreviousMonthRange = () => {
    const now = new Date();
    const currYear = now.getFullYear();
    const currMonth = now.getMonth(); // 0-indexed: in October (month 9), currMonth = 9 (September)
    let prevYear = currYear;
    let prevMonth = currMonth; // in Oct (9), prevMonth = 9 (September)
    if (prevMonth === 0) {
        prevMonth = 12;
        prevYear -= 1;
    }
    const pad = (n: number) => String(n).padStart(2, "0");
    const startDate = `${prevYear}-${pad(prevMonth)}-01`;
    const lastDay = new Date(prevYear, prevMonth, 0).getDate();
    const endDate = `${prevYear}-${pad(prevMonth)}-${pad(lastDay)}`;
    return { startDate, endDate };
};

const getDefaultSalaryMonthYear = () => {
    const now = new Date();
    let m = now.getMonth(); // 0-indexed: in October (month 10), getMonth() returns 9 (September)
    let y = now.getFullYear();
    if (m === 0) {
        m = 12;
        y -= 1;
    }
    return { month: m, year: y };
};

const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

const MONTH_OPTIONS = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
];

const YEAR_OPTIONS = [2027, 2026, 2025, 2024, 2023];

const formatDateToDDMMYYYY = (isoDate: string) => {
    if (!isoDate) return "";
    const parts = isoDate.split("-");
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoDate;
};

const parseDDMMYYYYToISO = (val: string) => {
    if (!val) return "";
    const parts = val.split(/[/.-]/);
    if (parts.length === 3) {
        const d = parts[0].padStart(2, "0");
        const m = parts[1].padStart(2, "0");
        let y = parts[2];
        if (y.length === 2) y = `20${y}`;
        if (d.length === 2 && m.length === 2 && y.length === 4) {
            const numD = Number(d);
            const numM = Number(m);
            const numY = Number(y);
            if (numD >= 1 && numD <= 31 && numM >= 1 && numM <= 12 && numY >= 1900 && numY <= 2100) {
                return `${y}-${m}-${d}`;
            }
        }
    }
    return "";
};

const formatMonthYear = (dateStr: string) => {
    if (!dateStr) return "SEPTEMBER 2026";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "SEPTEMBER 2026";
    const months = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
};

const convertTo12HourFormat = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const h = Math.floor(hour % 12) || 12;
    const m = Math.round((hour % 1) * 60);
    return m > 0 ? `${h}:${String(m).padStart(2, '0')} ${period}` : `${h}:00 ${period}`;
};

export default function CEODashboard() {
    const user = useCurrentUser();
    const [isLoading, setIsLoading] = useState(false);

    // Filters
    const [selectedDate, setSelectedDate] = useState<string>(getCurrentDate());
    const dateInputRef = React.useRef<HTMLInputElement>(null);
    const [dateText, setDateText] = useState<string>(() => formatDateToDDMMYYYY(getCurrentDate()));

    useEffect(() => {
        if (selectedDate) {
            setDateText(formatDateToDDMMYYYY(selectedDate));
        }
    }, [selectedDate]);

    // Collect all authorized branches from both user.branch and user.multi
    const userBranches = useMemo(() => {
        const rawValues: any[] = [];
        if (user?.branch) rawValues.push(user.branch);
        if (user?.multi) rawValues.push(user.multi);

        const branchSet = new Set<string>();
        rawValues.forEach((val) => {
            if (Array.isArray(val)) {
                val.map(String).map(s => s.trim()).filter(Boolean).forEach(b => branchSet.add(b));
            } else if (typeof val === "string" || typeof val === "number") {
                String(val).split(",").map(s => s.trim()).filter(Boolean).forEach(b => branchSet.add(b));
            }
        });
        return Array.from(branchSet);
    }, [user?.branch, user?.multi]);

    const [selectedBranch, setSelectedBranch] = useState<string>("");

    const getDefaultBranch = () => {
        if (user?.branch) {
            const s = String(user.branch).trim();
            if (!s.includes(",") && !Array.isArray(user.branch) && s !== "" && s !== "0") {
                return s;
            }
        }
        return "";
    };

    // Initialize selectedBranch:
    // If logged in with a single branch (e.g. 1), default to that single branch;
    // If logged in with multi-branch, default to "" (All Branches)
    useEffect(() => {
        setSelectedBranch(getDefaultBranch());
    }, [user?.branch]);

    const activeBranchParam = useMemo(() => {
        if (selectedBranch) return selectedBranch;
        if (userBranches.length > 0) return userBranches.join(",");
        if (user?.branch) return String(user.branch);
        return "";
    }, [selectedBranch, userBranches, user?.branch]);

    const activeBranchArray = useMemo(() => {
        if (selectedBranch) return [selectedBranch];
        if (userBranches.length > 0) return userBranches;
        if (user?.branch) return String(user.branch).split(",").map(s => s.trim()).filter(Boolean);
        return [];
    }, [selectedBranch, userBranches, user?.branch]);

    const [selectedShift, setSelectedShift] = useState<string>("");
    const [rangeMonths, setRangeMonths] = useState<number>(6);
    const [globalView, setGlobalView] = useState<"charts" | "tables">("charts");
    const [formattedShifts, setFormattedShifts] = useState<{ value: string; label: string }[]>([]);

    // Top Headcount & Attendance Data
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [attendanceStatus, setAttendanceStatus] = useState<any>(null);
    const [deptStats, setDeptStats] = useState<any[]>([]);
    const [graphData, setGraphData] = useState<any[]>([]);
    const [rangeStats, setRangeStats] = useState<any>(null);
    const [overallEmployees, setOverallEmployees] = useState<{ all: any[]; present: any[]; absent: any[] }>({
        all: [],
        present: [],
        absent: []
    });
    const [todaySummary, setTodaySummary] = useState<{
        todayAbsent: number;
        todayPresent: number;
        todayWO: number;
    } | null>(null);

    // Attendance Date Range Filter (Default: Current Month 1st to Yesterday - 1 day before today)
    const [attendanceStartDate, setAttendanceStartDate] = useState<string>(() => {
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, "0");
        return `${y}-${m}-01`;
    });
    const [attendanceEndDate, setAttendanceEndDate] = useState<string>(() => {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return d.toISOString().split("T")[0];
    });
    const [attendancePreset, setAttendancePreset] = useState<"today" | "thisMonth" | "last7Days" | "custom">("thisMonth");

    // Salary Data & Month-wise Filter (Default: month prior to current month)
    const defSalaryMY = useMemo(() => getDefaultSalaryMonthYear(), []);
    const [salaryMonth, setSalaryMonth] = useState<number>(() => defSalaryMY.month);
    const [salaryYear, setSalaryYear] = useState<number>(() => defSalaryMY.year);

    const quickMonths = useMemo(() => {
        const list = [];
        let m = defSalaryMY.month;
        let y = defSalaryMY.year;
        for (let i = 0; i < 4; i++) {
            list.push({ month: m, year: y });
            m--;
            if (m === 0) {
                m = 12;
                y--;
            }
        }
        return list;
    }, [defSalaryMY]);

    const salaryStartDate = useMemo(() => {
        return `${salaryYear}-${String(salaryMonth).padStart(2, "0")}-01`;
    }, [salaryYear, salaryMonth]);

    const salaryEndDate = useMemo(() => {
        const lastDay = new Date(salaryYear, salaryMonth, 0).getDate();
        return `${salaryYear}-${String(salaryMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    }, [salaryYear, salaryMonth]);

    const [salaryData, setSalaryData] = useState<any>(null);
    const [salaryCardsData, setSalaryCardsData] = useState<any>(null);
    const [selectedDept, setSelectedDept] = useState<any>(null);

    // Modals
    const [listModal, setListModal] = useState<{
        open: boolean;
        title: string;
        subtitle: string;
        data: any[];
        loading: boolean;
    }>({ open: false, title: "", subtitle: "", data: [], loading: false });

    const [profileModal, setProfileModal] = useState<{
        open: boolean;
        data: any;
        loading: boolean;
    }>({ open: false, data: null, loading: false });

    const [detailDialog, setDetailDialog] = useState<{
        open: boolean;
        employee: any;
    }>({ open: false, employee: null });

    // ============ API CALLS ============

    // 1. Fetch Headcount Stats (Active, Depts, Designations, New Hires)
    const fetchDashboardData = async () => {
        try {
            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_URL}/dashboards/getDashboardData`,
                {
                    range: rangeMonths,
                    location: "",
                    month: "",
                    login_loc: activeBranchParam,
                    loc_code: activeBranchParam
                },
                {
                    headers: {
                        compcode: user?.Comp_Code,
                        name: user?.name
                    }
                }
            );
            if (res.data?.success) {
                setDashboardData(res.data.data);
            }
        } catch (err) {
            console.error("fetchDashboardData error:", err);
        }
    };

    // 2. Fetch Multi-day Attendance Data & Shifts
    const fetchAttendanceData = async (
        deptCode = selectedDept?.DEPT_CODE || "",
        fromDate = attendanceStartDate,
        toDate = attendanceEndDate
    ) => {
        setIsLoading(true);
        try {
            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_URL}/dashboards/getAttendanceDashboardData`,
                {
                    selectedDate: toDate || selectedDate,
                    from_date: fromDate,
                    to_date: toDate,
                    Loc_code: activeBranchArray,
                    login_loc: activeBranchParam,
                    dept_code: deptCode,
                    shift: selectedShift,
                    shiftstarttime: selectedShift,
                },
                {
                    headers: {
                        compcode: user?.Comp_Code,
                        name: user?.name
                    }
                }
            );

            if (res.data?.success && res.data?.result) {
                setGraphData(res.data.result.graphData || []);
                if (res.data.result.deptStats) setDeptStats(res.data.result.deptStats);
                if (res.data.result.shifts) {
                    setFormattedShifts(res.data.result.shifts.map((s: any) => ({
                        value: String(s.Misc_Code ?? s.SHIFTSTARTTIME ?? ""),
                        label: s.ShiftTitle || (s.Misc_Name ? `${s.Misc_Name} (${s.Misc_Add1 || ''} - ${s.Misc_Add2 || ''})` : `${convertTo12HourFormat(s.SHIFTSTARTTIME)} - ${convertTo12HourFormat(s.SHIFTENDTIME)}`)
                    })));
                }
                if (res.data.result.rangeStats) {
                    setRangeStats(res.data.result.rangeStats);
                }
                if (res.data.result.employees) {
                    setOverallEmployees(res.data.result.employees);
                }
            }
        } catch (err) {
            console.error("fetchAttendanceData error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const selectAttendancePreset = (preset: "today" | "thisMonth" | "last7Days") => {
        const today = new Date();
        const yday = new Date(today);
        yday.setDate(today.getDate() - 1);
        const ydayStr = yday.toISOString().split("T")[0];

        let start = ydayStr;
        let end = ydayStr;

        if (preset === "today") {
            start = ydayStr;
            end = ydayStr;
        } else if (preset === "thisMonth") {
            const y = today.getFullYear();
            const m = String(today.getMonth() + 1).padStart(2, "0");
            start = `${y}-${m}-01`;
            end = ydayStr;
        } else if (preset === "last7Days") {
            const d7 = new Date(yday);
            d7.setDate(yday.getDate() - 6);
            start = d7.toISOString().split("T")[0];
            end = ydayStr;
        }

        setAttendancePreset(preset);
        setAttendanceStartDate(start);
        setAttendanceEndDate(end);
        setSelectedDate(end);
    };

    const handleAttendanceDateChange = (start: string, end: string) => {
        setAttendanceStartDate(start);
        setAttendanceEndDate(end);
        setAttendancePreset("custom");
        if (end) {
            setSelectedDate(end);
        }
    };

    // 3. Fetch Attendance Status Summary & Location Data
    const fetchAttendanceStatus = async () => {
        try {
            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_URL}/dashboards/getAttendanceStatusDashboard`,
                {
                    selectedDate: selectedDate,
                    Loc_code: activeBranchArray,
                    login_loc: activeBranchParam,
                    dept_code: selectedDept?.DEPT_CODE || "",
                    shift: selectedShift || "",
                    shiftstarttime: selectedShift || ""
                },
                {
                    headers: {
                        compcode: user?.Comp_Code,
                        name: user?.name
                    }
                }
            );

            if (res.data?.success && res.data?.result) {
                setAttendanceStatus(res.data.result);
            }
        } catch (err) {
            console.error("fetchAttendanceStatus error:", err);
        }
    };

    // 4. Fetch Salary Dashboard Data (Live read-only from SALARYFILE)
    const fetchSalaryData = async () => {
        try {
            // Salary targets 1 month prior to selected date / current month
            const dateObj = selectedDate ? new Date(selectedDate) : new Date();
            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_URL}/dashboards/getCeoSalaryDashboard`,
                {
                    loc_code: activeBranchParam,
                    login_loc: activeBranchParam,
                    range: rangeMonths,
                    month: salaryMonth,
                    year: salaryYear,
                    from_date: salaryStartDate,
                    to_date: salaryEndDate,
                    dept_code: selectedDept?.DEPT_CODE || (typeof selectedDept === "string" ? selectedDept : "")
                },
                {
                    headers: {
                        compcode: user?.Comp_Code,
                        name: user?.name
                    }
                }
            );
            if (res.data?.success && res.data?.SalaryCards) {
                setSalaryData(res.data);
            } else if (res.data) {
                setSalaryData(res.data);
            }
        } catch (err) {
            console.error("fetchSalaryData error:", err);
            setSalaryData(null);
        }
    };

    // Employee Drill-down API calls
    const fetchEmployeesByType = async (type: string, value: any, title: string, subtitle: string) => {
        setListModal({ open: true, title, subtitle, loading: true, data: [] });
        try {
            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_URL}/dashboards/getEmployeesByType`,
                {
                    type,
                    value,
                    login_loc: activeBranchParam,
                    loc_code: activeBranchParam,
                    selectedDate: selectedDate || attendanceEndDate,
                    from_date: attendanceStartDate,
                    to_date: attendanceEndDate
                },
                {
                    headers: {
                        compcode: user?.Comp_Code,
                        name: user?.name
                    }
                }
            );
            if (res.data?.success) {
                setListModal(prev => ({
                    ...prev,
                    data: res.data.data,
                    subtitle: `Total: ${res.data.total || res.data.data.length} employees`,
                    loading: false
                }));
            }
        } catch {
            showSideAlert("Failed to load employees", "warning");
            setListModal(prev => ({ ...prev, loading: false }));
        }
    };

    const fetchEmployeeDetails = async (empcode: string) => {
        setProfileModal({ open: true, data: null, loading: true });
        try {
            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_URL}/dashboards/getEmployeeDetails`,
                {
                    empcode,
                    login_loc: activeBranchParam,
                    loc_code: activeBranchParam
                },
                {
                    headers: {
                        compcode: user?.Comp_Code,
                        name: user?.name
                    }
                }
            );
            if (res.data?.success) {
                setProfileModal({ open: true, data: res.data.data, loading: false });
            }
        } catch {
            showSideAlert("Failed to load employee details", "warning");
            setProfileModal(prev => ({ ...prev, loading: false }));
        }
    };

    // 5. Dedicated Single API: Today Attendance Summary (Absent, Present, WO)
    const fetchTodayAttendanceSummary = async () => {
        if (!user?.Comp_Code) return;
        try {
            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_URL}/dashboards/getTodayAttendanceSummary`,
                {
                    selectedDate: selectedDate || attendanceEndDate,
                    Loc_code: activeBranchArray,
                    login_loc: activeBranchParam,
                    loc_code: activeBranchParam,
                    shift: selectedShift || "",
                    shiftstarttime: selectedShift || ""
                },
                {
                    headers: {
                        compcode: user?.Comp_Code,
                        name: user?.name
                    }
                }
            );
            if (res.data?.success && res.data?.data) {
                setTodaySummary(res.data.data);
            }
        } catch (err) {
            console.error("fetchTodayAttendanceSummary error:", err);
        }
    };

    // 6. Dedicated Single API: Salary Cards Summary (Gross, EarnGross, Deductions, NetPay)
    const fetchSalaryCardsSummary = async () => {
        if (!user?.Comp_Code) return;
        try {
            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_URL}/dashboards/getSalaryCardsSummary`,
                {
                    month: salaryMonth,
                    year: salaryYear,
                    from_date: salaryStartDate,
                    to_date: salaryEndDate,
                    login_loc: activeBranchParam,
                    loc_code: activeBranchParam,
                    Loc_code: activeBranchArray
                },
                {
                    headers: {
                        compcode: user?.Comp_Code,
                        name: user?.name
                    }
                }
            );
            if (res.data?.success && res.data?.data) {
                setSalaryCardsData(res.data.data);
            }
        } catch (err) {
            console.error("fetchSalaryCardsSummary error:", err);
        }
    };

    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Master Refresh: Reset all filters to default and trigger live reload
    const loadAllData = () => {
        if (!user?.Comp_Code) return;

        const defBranch = getDefaultBranch();
        const todayDate = getCurrentDate();
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, "0");
        const defStart = `${y}-${m}-01`;
        const yday = new Date(today);
        yday.setDate(today.getDate() - 1);
        const defEnd = yday.toISOString().split("T")[0];
        const defSalary = getDefaultSalaryMonthYear();

        // Reset all filters to default values
        setSelectedBranch(defBranch);
        setSelectedDate(todayDate);
        setDateText(formatDateToDDMMYYYY(todayDate));
        setAttendanceStartDate(defStart);
        setAttendanceEndDate(defEnd);
        setAttendancePreset("thisMonth");
        setSelectedShift("");
        setSelectedDept(null);
        setRangeMonths(6);
        setSalaryMonth(defSalary.month);
        setSalaryYear(defSalary.year);
        setGlobalView("charts");

        // Bump refresh trigger to guarantee all API calls execute with fresh defaults
        setRefreshTrigger((prev) => prev + 1);
    };

    const userCompCode = user?.Comp_Code;

    // 1. Headcount & Overview Stats
    useEffect(() => {
        if (userCompCode) {
            fetchDashboardData();
        }
    }, [userCompCode, activeBranchParam, rangeMonths, refreshTrigger]);

    // 2. Today Attendance Summary (Dedicated Single API)
    useEffect(() => {
        if (userCompCode) {
            fetchTodayAttendanceSummary();
        }
    }, [userCompCode, activeBranchParam, selectedDate, attendanceEndDate, selectedShift, refreshTrigger]);

    // 3. Multi-day Attendance Graph & Shifts
    useEffect(() => {
        if (userCompCode) {
            fetchAttendanceData(selectedDept?.DEPT_CODE || "", attendanceStartDate, attendanceEndDate);
        }
    }, [userCompCode, activeBranchParam, attendanceStartDate, attendanceEndDate, selectedShift, selectedDept?.DEPT_CODE, refreshTrigger]);

    // 4. Attendance Status Breakdown & Location Stats
    useEffect(() => {
        if (userCompCode) {
            fetchAttendanceStatus();
        }
    }, [userCompCode, activeBranchParam, selectedDate, selectedShift, selectedDept?.DEPT_CODE, refreshTrigger]);

    // 5. Salary Cards Summary (Dedicated Single API)
    useEffect(() => {
        if (userCompCode) {
            fetchSalaryCardsSummary();
        }
    }, [userCompCode, activeBranchParam, salaryMonth, salaryYear, refreshTrigger]);

    // 6. Salary Dashboard (Charts & Details)
    useEffect(() => {
        if (userCompCode) {
            fetchSalaryData();
        }
    }, [userCompCode, activeBranchParam, salaryMonth, salaryYear, rangeMonths, selectedDept?.DEPT_CODE, refreshTrigger]);

    // ============ STAT METRICS CALCULATION (Real Backend Data) ============
    const activeEmployeesCount = dashboardData?.stats?.activeEmployees ?? 0;
    const departmentsCount = dashboardData?.stats?.departments ?? 0;
    const designationsCount = dashboardData?.stats?.designations ?? 0;
    const newHiresCount = dashboardData?.stats?.newHires ?? 0;

    const summary = attendanceStatus?.summary;
    const presentCount = summary ? (Number(summary.ontime || 0) + Number(summary.early || 0) + Number(summary.late || 0)) : (overallEmployees.present?.length || 0);
    const absentCount = summary?.absent ?? (overallEmployees.absent?.length || 0);
    const lateCount = summary?.late ?? 0;
    const onLeaveCount = summary?.onLeave ?? 0;
    const weeklyOffCount = summary?.weeklyOff ?? 0;
    const totalToday = presentCount + absentCount + onLeaveCount + weeklyOffCount || activeEmployeesCount || 0;
    const attendancePct = totalToday > 0 ? ((presentCount / totalToday) * 100).toFixed(1) : "0.0";
    const latePct = presentCount > 0 ? ((lateCount / presentCount) * 100).toFixed(1) : "0.0";

    // Salary Metrics (Real Backend Data from dedicated API)
    const grossSalary = Number(salaryCardsData?.GrossSalary ?? salaryData?.SalaryCards?.GrossSalary ?? 0);
    const grossEarn = Number(salaryCardsData?.GrossEarn ?? salaryData?.SalaryCards?.GrossEarn ?? 0);
    const deductions = Number(salaryCardsData?.DeductionAmount ?? salaryData?.SalaryCards?.DeductionAmount ?? 0);
    const netPay = Number(salaryCardsData?.NetPay ?? salaryData?.SalaryCards?.NetPay ?? 0);
    const salaryEmpCount = Number(salaryCardsData?.EmpCount ?? salaryData?.SalaryCards?.EmpCount ?? 0);
    const avgGross = Number(salaryCardsData?.AvgGross ?? salaryData?.SalaryCards?.AvgGross ?? (salaryEmpCount > 0 ? Math.round(grossSalary / salaryEmpCount) : 0));
    const grossDiffText = salaryCardsData?.grossDiffText ?? salaryData?.SalaryCards?.grossDiffText;
    const netDiffText = salaryCardsData?.netDiffText ?? salaryData?.SalaryCards?.netDiffText;
    const deductionPct = salaryCardsData?.deductionPct ?? (grossSalary > 0 ? `${((deductions / grossSalary) * 100).toFixed(1)}% of gross` : "0.0% of gross");


    // Active salary display period based on month & year
    const salaryDisplayPeriod = useMemo(() => {
        const monthsFull = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
        const monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        const m = salaryMonth - 1;
        const y = salaryYear;
        return {
            full: `${monthsFull[m] || ''} ${y}`,
            short: `${monthsShort[m] || ''} ${y}`,
            month: salaryMonth,
            year: salaryYear
        };
    }, [salaryMonth, salaryYear]);

    // Drilldown click handlers for Stat Cards
    const handleActiveClick = () => fetchEmployeesByType('active', null, 'Active Employees', `Active: ${activeEmployeesCount} employees`);
    const handleDepartmentsClick = () => {
        const depts = dashboardData?.employeesByDepartment || [];
        setListModal({
            open: true,
            title: "Departments",
            subtitle: `Total: ${departmentsCount} departments`,
            data: depts.map((d: any) => ({
                EMPCODE: d.department,
                name: d.department,
                designation: `${d.count} employees`,
                department: d.department,
                isDepartment: true,
                count: d.count
            })),
            loading: false
        });
    };
    const handlePresentClick = () => {
        fetchEmployeesByType(
            'present',
            null,
            'Present Employees Today',
            `Date: ${formatDateDisplay(selectedDate || attendanceEndDate)} · Total Present: ${todaySummary?.todayPresent ?? rangeStats?.todayPresent ?? presentCount} employees`
        );
    };

    const handleAbsentClick = () => {
        fetchEmployeesByType(
            'absent',
            null,
            'Absent Employees Today',
            `Date: ${formatDateDisplay(selectedDate || attendanceEndDate)} · Total Absent: ${todaySummary?.todayAbsent ?? rangeStats?.todayAbsent ?? absentCount} employees`
        );
    };
    const handleLateClick = () => {
        const lateList = (attendanceStatus?.employees || [])
            .filter((e: any) => e.AttendanceStatus === "LATE")
            .map((e: any) => ({
                name: e.EmployeeName,
                EMPCODE: e.EMPCODE,
                designation: e.EMPLOYEEDESIGNATION,
                department: e.DIVISION,
                status: "LATE",
                _raw: e
            }));
        setListModal({
            open: true,
            title: "Late Coming Employees",
            subtitle: `Late: ${lateList.length || lateCount} employees today`,
            data: lateList,
            loading: false
        });
    };

    const handleDepartmentClick = (dept: any) => {
        const deptName = typeof dept === "string" ? dept : (dept.department || dept.DEPT_NAME);
        fetchEmployeesByType('department', deptName, `Department: ${deptName}`, `Employees in ${deptName}`);
    };

    const exportEmployeesToExcel = async (mappedEmployees: any[], filenamePrefix = "Employees") => {
        if (!mappedEmployees || mappedEmployees.length === 0) {
            showSideAlert("No data to export", "warning");
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Report");
        const headerRow = worksheet.addRow(["Emp Code", "Name", "Designation", "Department", "Login Time", "Status"]);
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4338CA" } };
            cell.alignment = { horizontal: "center", vertical: "middle" };
        });

        mappedEmployees.forEach((item) => {
            const emp = item._raw || item;
            worksheet.addRow([
                emp.EMP_CODE ?? item.EMPCODE ?? "-",
                emp.EMP_NAME ?? item.name ?? "-",
                emp.DESIGNATION ?? item.designation ?? "-",
                emp.DEPARTMENT ?? item.department ?? "-",
                emp.LOGIN_TIME ?? "--:--",
                emp.PUNCH_SUBSTATUS ?? emp.PUNCH_STATUS ?? item.status ?? "-"
            ]);
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        saveAs(blob, `${filenamePrefix}_${new Date().toISOString().split("T")[0]}.xlsx`);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] p-3 sm:p-5 lg:p-6 text-[#1E293B] dark:text-[#F1F5F9] font-sans">

            {/* Top Navigation Bar: Breadcrumbs + User Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-2 border-b border-[#E2E8F0]/60 dark:border-[#1E293B]">
                {/* Left: Back Button + Breadcrumbs */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-[#334155] dark:text-[#E2E8F0] hover:bg-[#F8FAFC] dark:hover:bg-[#334155] transition-colors text-[15px] font-semibold shadow-2xs"
                    >
                        <span>←</span> Back
                    </button>


                </div>

              
            </div>

            {/* Dashboard Title & Filter Controls Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mt-3 mb-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] dark:text-white tracking-tight">
                        CEO HRMS Dashboard
                    </h1>
                    <p className="text-[15px] sm:text-[16px] text-[#64748B] dark:text-[#94A3B8] mt-1">
                        As of {formatDateDisplay(selectedDate)} · {activeEmployeesCount} employees across {dashboardData?.stats?.locations || userBranches.length || 4} locations
                    </p>
                </div>

                {/* Filter Controls Row */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Branch Filter Dropdown (Only show when multiple branches exist) */}
                    {userBranches.length > 1 && (
                        <div className="relative flex items-center">
                            <select
                                value={selectedBranch}
                                onChange={(e) => setSelectedBranch(e.target.value)}
                                className="h-10 pl-3.5 pr-8 py-2 text-[15px] font-semibold rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-[#1E293B] dark:text-[#E2E8F0] outline-none focus:ring-2 focus:ring-[#4F46E5] shadow-2xs cursor-pointer appearance-none"
                            >
                                <option value="">All Branches ({userBranches.length})</option>
                                {userBranches.map((b) => (
                                    <option key={b} value={b}>
                                        Branch {b}
                                    </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-[#94A3B8] text-xs">
                                ▼
                            </div>
                        </div>
                    )}
                    {/* Date Picker (DD/MM/YYYY Format) */}
                    <div className="relative flex items-center">
                        <input
                            type="text"
                            placeholder="DD/MM/YYYY"
                            readOnly
                            value={dateText}
                            onChange={(e) => {
                                const val = e.target.value;
                                setDateText(val);
                                const iso = parseDDMMYYYYToISO(val);
                                if (iso) {
                                    setSelectedDate(iso);
                                }
                            }}
                            onBlur={() => {
                                if (selectedDate) {
                                    setDateText(formatDateToDDMMYYYY(selectedDate));
                                }
                            }}
                            className="h-10 w-38 pl-3.5 pr-9 text-[15px] font-medium rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-[#1E293B] dark:text-[#E2E8F0] outline-none focus:ring-2 focus:ring-[#4F46E5] shadow-2xs"
                        />
                        <button
                            type="button"
                            onClick={() => {
                                if (dateInputRef.current) {
                                    if (typeof dateInputRef.current.showPicker === "function") {
                                        dateInputRef.current.showPicker();
                                    } else {
                                        dateInputRef.current.focus();
                                    }
                                }
                            }}
                            className="absolute right-2.5 text-[#64748B] hover:text-[#4F46E5] dark:text-[#94A3B8] dark:hover:text-white transition-colors cursor-pointer p-0.5 text-[15px]"
                            title="Select date"
                        >
                            📅
                        </button>
                        <input
                            ref={dateInputRef}
                            type="date"
                            value={selectedDate}
                            onChange={(e) => {
                                if (e.target.value) {
                                    setSelectedDate(e.target.value);
                                    setDateText(formatDateToDDMMYYYY(e.target.value));
                                }
                            }}
                            className="sr-only"
                            tabIndex={-1}
                            aria-hidden="true"
                        />
                    </div>

                    {/* Shift Dropdown */}
                    <div>
                        <select
                            value={selectedShift}
                            onChange={(e) => setSelectedShift(e.target.value)}
                            className="h-10 px-3.5 py-2 text-[15px] font-medium rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-[#1E293B] dark:text-[#E2E8F0] outline-none focus:ring-2 focus:ring-[#4F46E5] shadow-2xs cursor-pointer"
                        >
                            <option value="">All shifts</option>
                            {formattedShifts.map((s, idx) => (
                                <option key={idx} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                    </div>

                    
                    {/* Charts / Tables Global Toggle */}
                    <div className="flex bg-[#F1F5F9] dark:bg-[#1E293B] p-1 rounded-lg border border-[#E2E8F0]/80 dark:border-[#334155] text-[15px]">
                        <button
                            onClick={() => setGlobalView("charts")}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md font-medium transition-all ${globalView === "charts"
                                    ? "bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white shadow-2xs font-semibold"
                                    : "text-[#475569] dark:text-[#94A3B8] hover:text-[#0F172A]"
                                }`}
                        >
                            <span>📊</span> Charts
                        </button>
                        <button
                            onClick={() => setGlobalView("tables")}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md font-medium transition-all ${globalView === "tables"
                                    ? "bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white shadow-2xs font-semibold"
                                    : "text-[#475569] dark:text-[#94A3B8] hover:text-[#0F172A]"
                                }`}
                        >
                            <span>📑</span> Tables
                        </button>
                    </div>

                    {/* Refresh Button */}
                    <button
                        onClick={loadAllData}
                        className="h-10 flex items-center gap-2 px-4 rounded-lg bg-[#4338CA] hover:bg-[#3730A3] active:scale-95 text-white text-[15px] font-semibold shadow-xs transition-all"
                    >
                        <span>🔄</span> Refresh
                    </button>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* SECTION 1: HEADCOUNT & ATTENDANCE                                         */}
            {/* ========================================================================= */}
            <div className="flex items-center gap-3 my-5">
                <span className="text-[15px] font-bold tracking-wider uppercase text-[#64748B] dark:text-[#94A3B8] whitespace-nowrap">
                    HEADCOUNT & ATTENDANCE · {attendanceStartDate === attendanceEndDate ? formatDateDisplay(attendanceEndDate).toUpperCase() : `${formatDateDisplay(attendanceStartDate).toUpperCase()} TO ${formatDateDisplay(attendanceEndDate).toUpperCase()}`}
                </span>
                <div className="h-px bg-[#E2E8F0] dark:bg-[#1E293B] flex-1" />
            </div>

            {/* Attendance Date Range Selector & Quick Filter Presets */}
            <div className="flex flex-wrap items-end justify-between gap-3 my-4 bg-white dark:bg-[#1E293B] p-3 rounded-xl border border-[#E2E8F0]/80 dark:border-[#334155]/80 shadow-xs">
                <div className="flex flex-wrap items-end gap-3">
                    <div className="w-44">
                        <Ainput 
                            title="From Date"
                            type="date"
                            name="attendance_from_date"
                            value={attendanceStartDate}
                            handleInputChange={(_name: string, val: string) => handleAttendanceDateChange(val, attendanceEndDate)}
                            redlabel=""
                        />
                    </div>
                    <div className="w-44">
                        <Ainput 
                            title="To Date"
                            type="date"
                            name="attendance_to_date"
                            value={attendanceEndDate}
                            handleInputChange={(_name: string, val: string) => handleAttendanceDateChange(attendanceStartDate, val)}
                            redlabel=""
                        />
                    </div>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => selectAttendancePreset("today")}
                        className={`px-3.5 py-2 rounded-lg text-[14px] font-semibold transition-all ${
                            attendancePreset === "today"
                                ? "bg-[#4338CA] text-white shadow-xs"
                                : "bg-[#F1F5F9] dark:bg-[#0F172A] text-[#475569] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white"
                        }`}
                    >
                        Yesterday
                    </button>
                    <button
                        type="button"
                        onClick={() => selectAttendancePreset("thisMonth")}
                        className={`px-3.5 py-2 rounded-lg text-[14px] font-semibold transition-all ${
                            attendancePreset === "thisMonth"
                                ? "bg-[#4338CA] text-white shadow-xs"
                                : "bg-[#F1F5F9] dark:bg-[#0F172A] text-[#475569] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white"
                        }`}
                    >
                        This Month ({new Date().toLocaleString("en-US", { month: "short" })})
                    </button>
                    <button
                        type="button"
                        onClick={() => selectAttendancePreset("last7Days")}
                        className={`px-3.5 py-2 rounded-lg text-[14px] font-semibold transition-all ${
                            attendancePreset === "last7Days"
                                ? "bg-[#4338CA] text-white shadow-xs"
                                : "bg-[#F1F5F9] dark:bg-[#0F172A] text-[#475569] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white"
                        }`}
                    >
                        Last 7 Days
                    </button>
                </div>
            </div>

            {/* Row 1: 5 Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-5">
                {/* 1. Active Employees */}
                <StatCard
                    title="Active employees"
                    value={activeEmployeesCount}
                    icon={<span className="text-xl">👥</span>}
                    iconBg="bg-[#EFF6FF] dark:bg-[#1E293B]/40"
                    iconColor="text-[#2563EB] dark:text-[#60A5FA]"
                    subtitle={
                        <span>
                            <strong className="text-[#334155] dark:text-[#CBD5E1]">+{newHiresCount}</strong> joined this month
                        </span>
                    }
                    onClick={handleActiveClick}
                />

                {/* 2. Departments */}
                <StatCard
                    title="Departments"
                    value={departmentsCount}
                    icon={<span className="text-xl">🏢</span>}
                    iconBg="bg-[#FAF5FF] dark:bg-[#1E293B]/40"
                    iconColor="text-[#9333EA] dark:text-[#C084FC]"
                    subtitle={<span>{designationsCount} designations</span>}
                    onClick={handleDepartmentsClick}
                />

                {/* 3. Present */}
                <StatCard
                    title="Present (Today)"
                    value={todaySummary?.todayPresent ?? rangeStats?.todayPresent ?? presentCount}
                    icon={<span className="text-xl">👤</span>}
                    iconBg="bg-[#ECFDF5] dark:bg-[#1E293B]/40"
                    iconColor="text-[#10B981] dark:text-[#34D399]"
                    trend={{
                        text: attendanceStartDate !== attendanceEndDate && rangeStats?.uniqueRangePresent
                            ? `${rangeStats.uniqueRangePresent} unique in range`
                            : `${attendancePct}% attendance`,
                        isPositive: true,
                        colorClass: "text-[#10B981] font-bold"
                    }}
                    onClick={handlePresentClick}
                />

                {/* 4. Absent */}
                <StatCard
                    title="Absent (Today)"
                    value={todaySummary?.todayAbsent ?? rangeStats?.todayAbsent ?? absentCount}
                    icon={<span className="text-xl">📋</span>}
                    iconBg="bg-[#FEF2F2] dark:bg-[#1E293B]/40"
                    iconColor="text-[#EF4444] dark:text-[#F87171]"
                    subtitle={
                        <span>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    fetchEmployeesByType(
                                        'weekly_off',
                                        null,
                                        'Weekly Off Employees',
                                        `Date: ${formatDateDisplay(selectedDate || attendanceEndDate)} · Total Weekly Off: ${todaySummary?.todayWO ?? rangeStats?.todayWO ?? summary?.weeklyOff ?? 276} employees`
                                    );
                                }}
                                className="hover:underline font-semibold text-[#64748B] dark:text-[#CBD5E1]"
                            >
                                {todaySummary?.todayWO ?? rangeStats?.todayWO ?? summary?.weeklyOff ?? 276} weekly off
                            </button>
                            {attendanceStartDate !== attendanceEndDate && rangeStats?.uniqueRangeAbsent ? (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        fetchEmployeesByType(
                                            'range_absent_unique',
                                            null,
                                            'Unique Absent Employees (Date Range)',
                                            `Range: ${formatDateDisplay(attendanceStartDate)} to ${formatDateDisplay(attendanceEndDate)} · Unique Employees: ${rangeStats.uniqueRangeAbsent}`
                                        );
                                    }}
                                    className="hover:underline text-xs text-[#EF4444] dark:text-[#F87171] ml-1.5"
                                >
                                    · ({rangeStats.uniqueRangeAbsent} in range)
                                </button>
                            ) : null}
                        </span>
                    }
                    onClick={handleAbsentClick}
                />

                {/* 5. Late today */}
                <StatCard
                    title="Late today"
                    value={lateCount}
                    icon={<span className="text-xl">⏰</span>}
                    iconBg="bg-[#FFFBEB] dark:bg-[#1E293B]/40"
                    iconColor="text-[#D97706] dark:text-[#FBBF24]"
                    trend={{
                        text: `${latePct}% of present`,
                        colorClass: "text-[#D97706] font-bold"
                    }}
                    onClick={handleLateClick}
                />
            </div>

            {/* Row 2: Attendance Trend (Day-wise attendance) + Departments Today */}
            <div className="grid grid-cols-12 gap-4 mb-7">
                {/* Day-wise attendance Stacked Chart (~62% width) */}
                <div className="col-span-12 lg:col-span-7">
                    <AttendanceChart
                        graphData={graphData}
                        currentMonthSummary={{
                            label: attendanceStartDate === attendanceEndDate 
                                ? formatDateDisplay(attendanceEndDate) 
                                : `${formatDateDisplay(attendanceStartDate)} - ${formatDateDisplay(attendanceEndDate)}`,
                            present: presentCount,
                            onLeave: onLeaveCount,
                            absent: absentCount,
                            percentage: attendancePct
                        }}
                        viewMode={globalView === "tables" ? "table" : "chart"}
                        rangeMonths={rangeMonths}
                        title="Day-wise attendance"
                        subtitle={
                            attendanceStartDate === attendanceEndDate
                                ? `Attendance breakdown for ${formatDateDisplay(attendanceEndDate)}`
                                : `Daily attendance breakdown (${formatDateDisplay(attendanceStartDate)} to ${formatDateDisplay(attendanceEndDate)})`
                        }
                    />
                </div>

                {/* Departments today Dual-Progress Bar List (~38% width) */}
                <div className="col-span-12 lg:col-span-5">
                    <DepartmentsTodayCard
                        deptStats={deptStats && deptStats.length > 0 ? deptStats : (attendanceStatus?.departmentData || [])}
                        totalPresent={presentCount}
                        totalAbsent={absentCount}
                        totalEmployees={activeEmployeesCount}
                        onDepartmentClick={handleDepartmentClick}
                        selectedDeptCode={selectedDept?.DEPT_CODE}
                        viewMode={globalView === "tables" ? "table" : "chart"}
                    />
                </div>
            </div>

            {/* ========================================================================= */}
            {/* SECTION 2: PAYROLL                                                        */}
            {/* ========================================================================= */}
            <div className="flex items-center gap-3 my-5">
                <span className="text-[15px] font-bold tracking-wider uppercase text-[#64748B] dark:text-[#94A3B8] whitespace-nowrap">
                    PAYROLL · {salaryDisplayPeriod.full}
                </span>
                <div className="h-px bg-[#E2E8F0] dark:bg-[#1E293B] flex-1" />
            </div>
            {/* Payroll Month & Year Selector (Month-wise Filter) */}
            <div className="flex flex-wrap items-end justify-between gap-3 my-4 bg-white dark:bg-[#1E293B] p-3.5 rounded-xl border border-[#E2E8F0]/80 dark:border-[#334155]/80 shadow-xs">
                <div className="flex flex-wrap items-center gap-3">
                    {/* Month Dropdown */}
                    <div className="flex flex-col gap-1">
                        <label className="text-[12px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
                            Salary Month
                        </label>
                        <select
                            value={salaryMonth}
                            onChange={(e) => setSalaryMonth(Number(e.target.value))}
                            className="h-10 px-3.5 py-1.5 rounded-lg border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-[#1E293B] dark:text-[#F1F5F9] font-semibold text-[14px] focus:outline-none focus:ring-2 focus:ring-[#4338CA] transition-all shadow-2xs cursor-pointer min-w-[140px]"
                        >
                            {MONTH_OPTIONS.map((m) => (
                                <option key={m.value} value={m.value}>
                                    {m.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Year Dropdown */}
                    <div className="flex flex-col gap-1">
                        <label className="text-[12px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
                            Salary Year
                        </label>
                        <select
                            value={salaryYear}
                            onChange={(e) => setSalaryYear(Number(e.target.value))}
                            className="h-10 px-3.5 py-1.5 rounded-lg border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-[#1E293B] dark:text-[#F1F5F9] font-semibold text-[14px] focus:outline-none focus:ring-2 focus:ring-[#4338CA] transition-all shadow-2xs cursor-pointer min-w-[100px]"
                        >
                            {YEAR_OPTIONS.map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Prev / Next Month Steppers */}
                    <div className="flex items-center gap-1.5 pt-5">
                        <button
                            type="button"
                            onClick={() => {
                                if (salaryMonth === 1) {
                                    setSalaryMonth(12);
                                    setSalaryYear((prev) => prev - 1);
                                } else {
                                    setSalaryMonth((prev) => prev - 1);
                                }
                            }}
                            title="Previous Month"
                            className="h-10 px-3 flex items-center justify-center rounded-lg border border-[#CBD5E1] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] text-[#334155] dark:text-[#E2E8F0] hover:bg-[#E2E8F0] dark:hover:bg-[#1E293B] text-[13px] font-semibold transition-all shadow-2xs"
                        >
                            ← Prev
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                if (salaryMonth === 12) {
                                    setSalaryMonth(1);
                                    setSalaryYear((prev) => prev + 1);
                                } else {
                                    setSalaryMonth((prev) => prev + 1);
                                }
                            }}
                            title="Next Month"
                            className="h-10 px-3 flex items-center justify-center rounded-lg border border-[#CBD5E1] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] text-[#334155] dark:text-[#E2E8F0] hover:bg-[#E2E8F0] dark:hover:bg-[#1E293B] text-[13px] font-semibold transition-all shadow-2xs"
                        >
                            Next →
                        </button>
                    </div>
                </div>

                {/* Quick Selection Pills */}
                <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
                    <span className="text-[12px] font-medium text-[#94A3B8] mr-1 hidden md:inline">Quick:</span>
                    {quickMonths.map((q) => {
                        const mLabel = MONTH_OPTIONS.find((m) => m.value === q.month)?.label;
                        const isSelected = salaryMonth === q.month && salaryYear === q.year;
                        return (
                            <button
                                key={`${q.year}_${q.month}`}
                                type="button"
                                onClick={() => {
                                    setSalaryMonth(q.month);
                                    setSalaryYear(q.year);
                                }}
                                className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all ${
                                    isSelected
                                        ? "bg-[#4338CA] text-white shadow-xs"
                                        : "bg-[#F1F5F9] dark:bg-[#0F172A] text-[#475569] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white"
                                }`}
                            >
                                {mLabel} {q.year}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Row 3: 4 Payroll Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
                {/* 1. Gross Salary */}
                <DashboardCard
                    title="Gross salary"
                    value={grossSalary}
                    type="gross"
                    hoverItems={[
                        { label: "Gross", value: `₹${grossSalary.toLocaleString("en-IN")}` },
                        { label: "Earned", value: `₹${grossEarn.toLocaleString("en-IN")}` }
                    ]}
                    trend={grossDiffText ? {
                        text: `↗ ${grossDiffText}`,
                        isPositive: !grossDiffText.includes("-"),
                        colorClass: "text-[#059669] font-semibold"
                    } : undefined}
                />

                {/* 2. Deductions */}
                <DashboardCard
                    title="Deductions"
                    value={deductions}
                    type="deduction"
                    subtitle={deductionPct}
                />

                {/* 3. Net Pay */}
                <DashboardCard
                    title="Net pay"
                    value={netPay}
                    type="net"
                    trend={netDiffText ? {
                        text: `↗ ${netDiffText}`,
                        isPositive: !netDiffText.includes("-"),
                        colorClass: "text-[#059669] font-semibold"
                    } : undefined}
                />

                {/* 4. Avg Gross per Employee */}
                <DashboardCard
                    title="Avg gross per employee"
                    value={avgGross}
                    type="avg"
                    hoverItems={salaryCardsData?.AvgGrossEarn ? [
                        { label: "Avg Gross", value: `₹${avgGross.toLocaleString("en-IN")}` },
                        { label: "Avg Earned", value: `₹${Number(salaryCardsData.AvgGrossEarn).toLocaleString("en-IN")}` }
                    ] : undefined}
                    subtitle={`${salaryEmpCount > 0 ? salaryEmpCount.toLocaleString("en-IN") : 0} on payroll`}
                />
            </div>

            {/* Row 4: Month-wise Salary Grouped Column Chart */}
            <div className="mb-5">
                <MonthWiseSalaryChart
                    data={salaryData?.MonthWiseSalary}
                    currentSummary={{
                        label: salaryDisplayPeriod.short,
                        gross: grossSalary,
                        deductions: deductions,
                        netPay: netPay,
                        diffText: salaryData?.SalaryCards?.grossDiffText ? `${salaryData.SalaryCards.grossDiffText} gross` : ""
                    }}
                    viewMode={globalView === "tables" ? "table" : "chart"}
                    rangeMonths={rangeMonths}
                />
            </div>

            {/* Row 5: Department-wise Salary (Donut & Ranked List) + Location-wise Salary */}
            <div className="grid grid-cols-12 gap-4 mb-6">
                <div className="col-span-12 lg:col-span-6">
                    <DepartmentSalaryChart
                        data={salaryData?.DepartmentWiseSalary}
                        monthLabel={salaryDisplayPeriod.short}
                        onDepartmentClick={(d) => fetchEmployeesByType('department', d, `Department: ${d}`, `Employees in ${d}`)}
                        viewMode={globalView === "tables" ? "table" : "chart"}
                    />
                </div>

                <div className="col-span-12 lg:col-span-6">
                    <LocationSalaryChart
                        data={salaryData?.LocationWiseSalary}
                        monthLabel={salaryDisplayPeriod.short}
                        viewMode={globalView === "tables" ? "table" : "chart"}
                    />
                </div>
            </div>

            {/* Modals & Dialogs */}
            <EmployeeListModal
                isOpen={listModal.open}
                onClose={() => setListModal({ ...listModal, open: false })}
                title={listModal.title}
                subtitle={listModal.subtitle}
                data={listModal.data}
                isLoading={listModal.loading}
                onEmployeeClick={fetchEmployeeDetails}
                onDepartmentClick={handleDepartmentClick}
                onExport={() => exportEmployeesToExcel(listModal.data, listModal.title.replace(/\s+/g, "_"))}
            />

            <EmployeeProfileModal
                isOpen={profileModal.open}
                onClose={() => setProfileModal({ open: false, data: null, loading: false })}
                data={profileModal.data}
                isLoading={profileModal.loading}
            />

            <EmployeeDetailDialog
                isOpen={detailDialog.open}
                onClose={() => setDetailDialog({ open: false, employee: null })}
                employee={detailDialog.employee}
            />

            <HashloaderComponent isLoading={isLoading} />
        </div>
    );
}
