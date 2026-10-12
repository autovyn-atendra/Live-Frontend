"use client";
import React, { useState } from 'react';
import ExcelJS from "exceljs";
import { saveAs } from 'file-saver';

export interface DepartmentTodayItem {
    department: string;
    total: number;
    inCount: number;
    outCount: number;
    deptCode?: string | number;
}

interface DepartmentsTodayCardProps {
    data?: DepartmentTodayItem[];
    deptStats?: any[];
    totalPresent?: number;
    totalAbsent?: number;
    totalEmployees?: number;
    onDepartmentClick?: (dept: any) => void;
    selectedDeptCode?: string | number | null;
    viewMode?: "chart" | "table";
}

export default function DepartmentsTodayCard({
    data,
    deptStats,
    totalPresent = 0,
    totalAbsent = 0,
    totalEmployees = 0,
    onDepartmentClick,
    selectedDeptCode,
    viewMode: controlledViewMode
}: DepartmentsTodayCardProps) {
    const [viewMode, setViewMode] = useState<"chart" | "table">(controlledViewMode || "chart");

    React.useEffect(() => {
        if (controlledViewMode) {
            setViewMode(controlledViewMode);
        }
    }, [controlledViewMode]);

    let items: DepartmentTodayItem[] = [];

    if (data && data.length > 0) {
        items = data;
    } else if (deptStats && deptStats.length > 0) {
        items = deptStats.map(d => {
            const hasStatusCounts = d.ontime !== undefined || d.early !== undefined || d.late !== undefined;
            const pres = hasStatusCounts
                ? (Number(d.ontime || 0) + Number(d.early || 0) + Number(d.late || 0))
                : Number(d.PRESENT ?? d.present ?? d.inCount ?? 0);
            const abs = hasStatusCounts
                ? (Number(d.absent || 0) + Number(d.onLeave || 0) + Number(d.weeklyOff || 0))
                : Number(d.ABSENT ?? d.absent ?? d.outCount ?? 0);
            const tot = Number(d.TOTAL ?? d.total ?? (pres + abs));
            return {
                department: d.DEPT_NAME || d.department || d.DIVISION || 'Department',
                inCount: pres,
                outCount: abs,
                total: tot || (pres + abs),
                deptCode: d.DEPT_CODE || d.deptCode
            };
        });
    }

    const calcPresent = items.reduce((sum, i) => sum + i.inCount, 0) || totalPresent;
    const calcAbsent = items.reduce((sum, i) => sum + i.outCount, 0) || totalAbsent;
    const calcTotal = items.reduce((sum, i) => sum + i.total, 0) || totalEmployees;

    const exportToExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Departments Today");
        worksheet.addRow(["Department", "Present (In)", "Absent (Out)", "Total Employees", "Attendance %"]);
        items.forEach(d => {
            const pct = d.total > 0 ? ((d.inCount / d.total) * 100).toFixed(1) + "%" : "0%";
            worksheet.addRow([d.department, d.inCount, d.outCount, d.total, pct]);
        });
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        saveAs(blob, `Departments_Today_${new Date().toISOString().split("T")[0]}.xlsx`);
    };

    return (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0]/80 dark:border-[#1E293B] p-5 shadow-xs flex flex-col justify-between h-full">
            {/* Header */}
            <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-bold text-[#0F172A] dark:text-white">
                            Departments today
                        </h2>
                        <p className="text-[15px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                            {calcPresent} in · {calcAbsent} out of {calcTotal}
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 self-start sm:self-auto">
                        <div className="flex bg-[#F1F5F9] dark:bg-[#1E293B] p-1 rounded-lg border border-[#E2E8F0]/80 dark:border-[#334155]/80 text-[15px]">
                            <button
                                onClick={() => setViewMode("chart")}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                                    viewMode === "chart"
                                        ? "bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white shadow-xs font-semibold"
                                        : "text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A]"
                                }`}
                            >
                                <span>📊</span> Chart
                            </button>
                            <button
                                onClick={() => setViewMode("table")}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                                    viewMode === "table"
                                        ? "bg-white dark:bg-[#0F172A] text-[#0F172A] dark:text-white shadow-xs font-semibold"
                                        : "text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A]"
                                }`}
                            >
                                <span>📑</span> Table
                            </button>
                        </div>

                        <button
                            onClick={exportToExcel}
                            title="Export to Excel"
                            className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-[#475569] dark:text-[#CBD5E1] hover:bg-[#F8FAFC] transition-colors"
                        >
                            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* List / Table Content */}
            <div className="mt-4 flex-1">
                {items.length === 0 ? (
                    <div className="py-14 text-center text-[#94A3B8] text-[15px] font-medium">
                        No department attendance records found.
                    </div>
                ) : viewMode === "chart" ? (
                    <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1.5 custom-scrollbar">
                        {items.map((item, idx) => {
                            const inPct = item.total > 0 ? (item.inCount / item.total) * 100 : 0;
                            const outPct = item.total > 0 ? (item.outCount / item.total) * 100 : 0;
                            const isSelected = selectedDeptCode && String(selectedDeptCode) === String(item.deptCode);

                            return (
                                <div
                                    key={idx}
                                    onClick={() => onDepartmentClick && onDepartmentClick(item)}
                                    className={`group transition-all rounded-lg p-2 -mx-1.5 ${
                                        onDepartmentClick ? "cursor-pointer hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]/50" : ""
                                    } ${isSelected ? "ring-2 ring-[#4F46E5] bg-[#EEF2FF]" : ""}`}
                                >
                                    {/* Top labels */}
                                    <div className="flex items-center justify-between text-[15px] font-medium mb-1.5">
                                        <span className="text-[#1E293B] dark:text-[#E2E8F0] font-semibold group-hover:text-[#4F46E5] transition-colors">
                                            {item.department}
                                        </span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[#10B981] font-semibold">
                                                {item.inCount} in
                                            </span>
                                            <span className="text-[#EF4444] font-semibold">
                                                {item.outCount} out
                                            </span>
                                            <span className="text-[#94A3B8] font-medium w-6 text-right">
                                                {item.total}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Dual Progress Bar */}
                                    <div className="h-2 w-full bg-[#F1F5F9] dark:bg-[#1E293B] rounded-full flex overflow-hidden">
                                        <div
                                            className="bg-[#10B981] h-full rounded-l-full transition-all duration-500"
                                            style={{ width: `${inPct}%` }}
                                        />
                                        <div
                                            className="bg-[#EF4444] h-full rounded-r-full transition-all duration-500 ml-0.5"
                                            style={{ width: `${outPct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="overflow-x-auto max-h-[350px] custom-scrollbar border border-[#F1F5F9] dark:border-[#1E293B] rounded-lg">
                        <table className="w-full text-[15px] text-left">
                            <thead className="bg-[#F8FAFC] dark:bg-[#1E293B]/80 text-[#334155] dark:text-[#CBD5E1] font-semibold sticky top-0">
                                <tr>
                                    <th className="px-3.5 py-2.5">Department</th>
                                    <th className="px-3.5 py-2.5 text-[#10B981]">Present (In)</th>
                                    <th className="px-3.5 py-2.5 text-[#EF4444]">Absent (Out)</th>
                                    <th className="px-3.5 py-2.5">Total</th>
                                    <th className="px-3.5 py-2.5 text-right">Attendance %</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F1F5F9] dark:divide-[#1E293B]">
                                {items.map((row, i) => {
                                    const pct = row.total > 0 ? ((row.inCount / row.total) * 100).toFixed(1) : "0";
                                    return (
                                        <tr
                                            key={i}
                                            onClick={() => onDepartmentClick && onDepartmentClick(row)}
                                            className="hover:bg-[#F8FAFC]/50 dark:hover:bg-[#1E293B]/40 cursor-pointer"
                                        >
                                            <td className="px-3.5 py-2.5 font-medium">{row.department}</td>
                                            <td className="px-3.5 py-2.5 text-[#10B981] font-semibold">{row.inCount}</td>
                                            <td className="px-3.5 py-2.5 text-[#EF4444] font-semibold">{row.outCount}</td>
                                            <td className="px-3.5 py-2.5 font-bold">{row.total}</td>
                                            <td className="px-3.5 py-2.5 text-right font-semibold text-[#10B981]">{pct}%</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
