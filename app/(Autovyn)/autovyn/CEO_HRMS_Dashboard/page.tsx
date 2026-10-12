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

const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

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

    // Branch Filter (Handles comma-separated string e.g. "1,2,3,4", array, or single branch)
    const userBranches = useMemo(() => {
        if (!user?.branch) return [];
        if (Array.isArray(user.branch)) return user.branch.map(String).map(s => s.trim()).filter(Boolean);
        return String(user.branch).split(",").map(s => s.trim()).filter(Boolean);
    }, [user?.branch]);

    const [selectedBranch, setSelectedBranch] = useState<string>("");

    const activeBranchParam = useMemo(() => {
        if (selectedBranch) return selectedBranch;
        if (userBranches.length > 0) return userBranches.join(",");
        return "";
    }, [selectedBranch, userBranches]);

    const activeBranchArray = useMemo(() => {
        if (selectedBranch) return [selectedBranch];
        if (userBranches.length > 0) return userBranches;
        return [];
    }, [selectedBranch, userBranches]);

    const [selectedShift, setSelectedShift] = useState<string>("");
    const [rangeMonths, setRangeMonths] = useState<number>(6);
    const [globalView, setGlobalView] = useState<"charts" | "tables">("charts");
    const [formattedShifts, setFormattedShifts] = useState<{ value: string; label: string }[]>([]);

    // Top Headcount & Attendance Data
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [attendanceStatus, setAttendanceStatus] = useState<any>(null);
    const [deptStats, setDeptStats] = useState<any[]>([]);
    const [graphData, setGraphData] = useState<any[]>([]);
    const [overallEmployees, setOverallEmployees] = useState<{ all: any[]; present: any[]; absent: any[] }>({
        all: [],
        present: [],
        absent: []
    });

    // Attendance Date Range Filter (Default: Current Month - 1st to Current Day)
    const [attendanceStartDate, setAttendanceStartDate] = useState<string>(() => {
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, "0");
        return `${y}-${m}-01`;
    });
    const [attendanceEndDate, setAttendanceEndDate] = useState<string>(() => {
        const today = new Date();
        return today.toISOString().split("T")[0];
    });
    const [attendancePreset, setAttendancePreset] = useState<"today" | "thisMonth" | "last7Days" | "custom">("thisMonth");

    // Salary Data & Date Range Filter (Default: 1 month prior to current month, e.g. Sep 1 to Sep 30)
    const defaultSalaryRange = useMemo(() => getDefaultPreviousMonthRange(), []);
    const [salaryStartDate, setSalaryStartDate] = useState<string>(defaultSalaryRange.startDate);
    const [salaryEndDate, setSalaryEndDate] = useState<string>(defaultSalaryRange.endDate);
    const [salaryData, setSalaryData] = useState<any>(null);
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
                `${process.env.NEXT_PUBLIC_URL}/employee/getDashboardData`,
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
                `${process.env.NEXT_PUBLIC_URL}/hrmsreport/getDashboardData`,
                {
                    selectedDate: toDate || selectedDate,
                    from_date: fromDate,
                    to_date: toDate,
                    Loc_code: activeBranchArray,
                    login_loc: activeBranchParam,
                    dept_code: deptCode,
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
                        value: String(s.SHIFTSTARTTIME),
                        label: `${convertTo12HourFormat(s.SHIFTSTARTTIME)} - ${convertTo12HourFormat(s.SHIFTENDTIME)}`
                    })));
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
        const todayStr = today.toISOString().split("T")[0];
        let start = todayStr;
        let end = todayStr;

        if (preset === "today") {
            start = todayStr;
            end = todayStr;
        } else if (preset === "thisMonth") {
            const y = today.getFullYear();
            const m = String(today.getMonth() + 1).padStart(2, "0");
            start = `${y}-${m}-01`;
            end = todayStr;
        } else if (preset === "last7Days") {
            const d7 = new Date();
            d7.setDate(today.getDate() - 6);
            start = d7.toISOString().split("T")[0];
            end = todayStr;
        }

        setAttendancePreset(preset);
        setAttendanceStartDate(start);
        setAttendanceEndDate(end);
        setSelectedDate(end);
        fetchAttendanceData(selectedDept?.DEPT_CODE || "", start, end);
    };

    const handleAttendanceDateChange = (start: string, end: string) => {
        setAttendanceStartDate(start);
        setAttendanceEndDate(end);
        setAttendancePreset("custom");
        if (start && end) {
            setSelectedDate(end);
            fetchAttendanceData(selectedDept?.DEPT_CODE || "", start, end);
        }
    };

    // 3. Fetch Attendance Status Summary & Location Data
    const fetchAttendanceStatus = async () => {
        try {
            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_URL}/hrmsreport/getAttendanceStatusDashboard`,
                {
                    selectedDate: selectedDate,
                    Loc_code: activeBranchArray,
                    login_loc: activeBranchParam,
                    dept_code: selectedDept?.DEPT_CODE || "",
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
            const currYear = isNaN(dateObj.getFullYear()) ? new Date().getFullYear() : dateObj.getFullYear();
            const currMonth = isNaN(dateObj.getMonth()) ? new Date().getMonth() + 1 : dateObj.getMonth() + 1;

            let targetYear = currYear;
            let targetMonth = currMonth - 1;
            if (targetMonth < 1) {
                targetMonth = 12;
                targetYear = currYear - 1;
            }

            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_URL}/employee/getCeoSalaryDashboard`,
                {
                    loc_code: activeBranchParam,
                    login_loc: activeBranchParam,
                    range: rangeMonths,
                    month: targetMonth,
                    year: targetYear,
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
                `${process.env.NEXT_PUBLIC_URL}/employee/getEmployeesByType`,
                {
                    type,
                    value,
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
                `${process.env.NEXT_PUBLIC_URL}/employee/getEmployeeDetails`,
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

    // Master Refresh
    const loadAllData = () => {
        fetchDashboardData();
        fetchAttendanceData();
        fetchAttendanceStatus();
        fetchSalaryData();
    };

    useEffect(() => {
        loadAllData();
    }, [selectedDate, selectedShift, rangeMonths, selectedBranch, selectedDept, salaryStartDate, salaryEndDate, attendanceStartDate, attendanceEndDate]);

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

    // Salary Metrics (Real Backend Data)
    const grossSalary = Number(salaryData?.SalaryCards?.GrossSalary || 0);
    const deductions = Number(salaryData?.SalaryCards?.DeductionAmount || 0);
    const netPay = Number(salaryData?.SalaryCards?.NetPay || 0);
    const salaryEmpCount = Number(salaryData?.SalaryCards?.EmpCount || 0);
    const avgGross = Number(salaryData?.SalaryCards?.AvgGross || (salaryEmpCount > 0 ? Math.round(grossSalary / salaryEmpCount) : 0));
    const deductionPct = grossSalary > 0 ? ((deductions / grossSalary) * 100).toFixed(1) : "0.0";


    // Active salary display period based on date range
    const salaryDisplayPeriod = useMemo(() => {
        const monthsFull = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
        const monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        if (salaryStartDate && salaryEndDate) {
            const [sY, sM] = salaryStartDate.split("-").map(Number);
            const [eY, eM] = salaryEndDate.split("-").map(Number);
            if (sY && sM && eY && eM) {
                if (sY === eY && sM === eM) {
                    return {
                        full: `${monthsFull[sM - 1]} ${sY}`,
                        short: `${monthsShort[sM - 1]} ${sY}`,
                        month: sM,
                        year: sY
                    };
                }
                return {
                    full: `${monthsShort[sM - 1].toUpperCase()} ${sY} - ${monthsShort[eM - 1].toUpperCase()} ${eY}`,
                    short: `${monthsShort[sM - 1]} - ${monthsShort[eM - 1]} '${String(eY).slice(2)}`,
                    month: eM,
                    year: eY
                };
            }
        }

        if (salaryData?.period?.month && salaryData?.period?.year) {
            const m = Number(salaryData.period.month) - 1;
            const y = Number(salaryData.period.year);
            return {
                full: `${monthsFull[m]} ${y}`,
                short: `${monthsShort[m]} ${y}`,
                month: m + 1,
                year: y
            };
        }

        return {
            full: "SEPTEMBER 2026",
            short: "Sep 2026",
            month: 9,
            year: 2026
        };
    }, [salaryStartDate, salaryEndDate, salaryData?.period]);

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
        const mapped = (overallEmployees.present || []).map(e => ({
            name: e.EMP_NAME,
            EMPCODE: e.EMP_CODE,
            designation: e.DESIGNATION,
            department: e.DEPARTMENT,
            status: e.PUNCH_SUBSTATUS || e.PUNCH_STATUS || "PRESENT",
            _raw: e
        }));
        setListModal({
            open: true,
            title: "Present Employees",
            subtitle: `Present: ${mapped.length || presentCount} employees`,
            data: mapped,
            loading: false
        });
    };
    const handleAbsentClick = () => {
        const mapped = (overallEmployees.absent || []).map(e => ({
            name: e.EMP_NAME,
            EMPCODE: e.EMP_CODE,
            designation: e.DESIGNATION,
            department: e.DEPARTMENT,
            status: "ABSENT",
            _raw: e
        }));
        setListModal({
            open: true,
            title: "Absent Employees",
            subtitle: `Absent: ${mapped.length || absentCount} employees`,
            data: mapped,
            loading: false
        });
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

                {/* Right: Branch Info + Profile Pill */}
                <div className="flex items-center gap-3 self-end sm:self-auto">
                    <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-[15px] font-medium text-[#334155] dark:text-[#CBD5E1] shadow-2xs">
                        <span className="text-[#10B981]">📍</span>
                        <span>Branch: {selectedBranch ? `Branch ${selectedBranch}` : (userBranches.length > 0 ? userBranches.join(", ") : "All")}</span>
                    </div>

                    <div className="w-9 h-9 rounded-full bg-[#4F46E5] text-white font-bold text-[15px] flex items-center justify-center shadow-xs">
                        {user?.name ? user.name.slice(0, 2).toUpperCase() : "AK"}
                    </div>
                </div>
            </div>

            {/* Dashboard Title & Filter Controls Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mt-3 mb-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] dark:text-white tracking-tight">
                        CEO HRMS Dashboard
                    </h1>
                    <p className="text-[15px] sm:text-[16px] text-[#64748B] dark:text-[#94A3B8] mt-1">
                        As of {formatDateDisplay(selectedDate)} · {activeEmployeesCount} employees across {dashboardData?.stats?.locations || 4} locations
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
                                <option value="">All Branches</option>
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

                    {/* 1 to 12 Months Range Dropdown */}
                    <div className="relative flex items-center">
                        <select
                            value={rangeMonths}
                            onChange={(e) => setRangeMonths(Number(e.target.value))}
                            className="h-10 pl-3.5 pr-8 py-2 text-[15px] font-semibold rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-[#1E293B] dark:text-[#E2E8F0] outline-none focus:ring-2 focus:ring-[#4F46E5] shadow-2xs cursor-pointer appearance-none"
                        >
                            <option value={1}>Current month (Week-wise)</option>
                            {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                                <option key={num} value={num}>
                                    {num} months previous
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-[#94A3B8] text-xs">
                            ▼
                        </div>
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
                        Today
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

                {/* 3. Present today */}
                <StatCard
                    title="Present today"
                    value={presentCount}
                    icon={<span className="text-xl">👤</span>}
                    iconBg="bg-[#ECFDF5] dark:bg-[#1E293B]/40"
                    iconColor="text-[#10B981] dark:text-[#34D399]"
                    trend={{
                        text: `${attendancePct}% attendance`,
                        isPositive: true,
                        colorClass: "text-[#10B981] font-bold"
                    }}
                    onClick={handlePresentClick}
                />

                {/* 4. Absent today */}
                <StatCard
                    title="Absent today"
                    value={absentCount}
                    icon={<span className="text-xl">📋</span>}
                    iconBg="bg-[#FEF2F2] dark:bg-[#1E293B]/40"
                    iconColor="text-[#EF4444] dark:text-[#F87171]"
                    subtitle={<span>{onLeaveCount} on leave · {weeklyOffCount} weekly off</span>}
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
            {/* Payroll Date Range Selector */}
            <div className="flex flex-wrap items-end gap-3 my-4 bg-white dark:bg-[#1E293B] p-3 rounded-xl border border-[#E2E8F0]/80 dark:border-[#334155]/80 shadow-xs max-w-2xl">
                <div className="w-48">
                    <Ainput 
                        title="From Date"
                        type="date"
                        name="salary_from_date"
                        value={salaryStartDate}
                        handleInputChange={(_name: string, val: string) => setSalaryStartDate(val)}
                        redlabel=""
                    />
                </div>
                <div className="w-48">
                    <Ainput 
                        title="To Date"
                        type="date"
                        name="salary_to_date"
                        value={salaryEndDate}
                        handleInputChange={(_name: string, val: string) => setSalaryEndDate(val)}
                        redlabel=""
                    />
                </div>
                {(salaryStartDate !== defaultSalaryRange.startDate || salaryEndDate !== defaultSalaryRange.endDate) && (
                    <button
                        onClick={() => {
                            setSalaryStartDate(defaultSalaryRange.startDate);
                            setSalaryEndDate(defaultSalaryRange.endDate);
                        }}
                        className="mb-1 px-3 py-1.5 text-[14px] text-[#4338CA] hover:text-[#3730A3] dark:text-[#818CF8] font-semibold underline transition-all"
                    >
                        Reset to Last Month
                    </button>
                )}
            </div>

            {/* Row 3: 4 Payroll Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
                {/* 1. Gross Salary */}
                <DashboardCard
                    title="Gross salary"
                    value={grossSalary}
                    type="gross"
                    trend={salaryData?.SalaryCards?.grossDiffText ? {
                        text: `↗ ${salaryData.SalaryCards.grossDiffText}`,
                        isPositive: true,
                        colorClass: "text-emerald-600 font-semibold"
                    } : undefined}
                />

                {/* 2. Deductions */}
                <DashboardCard
                    title="Deductions"
                    value={deductions}
                    type="deduction"
                    subtitle={`${deductionPct}% of gross`}
                />

                {/* 3. Net Pay */}
                <DashboardCard
                    title="Net pay"
                    value={netPay}
                    type="net"
                    trend={salaryData?.SalaryCards?.netDiffText ? {
                        text: `↗ ${salaryData.SalaryCards.netDiffText}`,
                        isPositive: true,
                        colorClass: "text-emerald-600 font-semibold"
                    } : undefined}
                />

                {/* 4. Avg Gross per Employee */}
                <DashboardCard
                    title="Avg gross per employee"
                    value={avgGross}
                    type="avg"
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
