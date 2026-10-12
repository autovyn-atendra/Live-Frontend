"use client";
import React, { useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import ExcelJS from "exceljs";
import { saveAs } from 'file-saver';

export interface DepartmentSalaryItem {
    Department?: string;
    department?: string;
    Amount?: number | string;
    amount?: number | string;
    percentage?: number | string;
    color?: string;
}

interface DepartmentSalaryChartProps {
    data?: DepartmentSalaryItem[];
    selectedMonth?: string | number;
    monthLabel?: string;
    onDepartmentClick?: (dept: string) => void;
    viewMode?: "chart" | "table";
}

export default function DepartmentSalaryChart({
    data,
    monthLabel = "September 2026",
    onDepartmentClick,
    viewMode: controlledViewMode
}: DepartmentSalaryChartProps) {
    const [viewMode, setViewMode] = useState<"chart" | "table">(controlledViewMode || "chart");

    React.useEffect(() => {
        if (controlledViewMode) {
            setViewMode(controlledViewMode);
        }
    }, [controlledViewMode]);

    // Default department colors matching image 2
    const palette = [
        '#3B82F6', // Service (Blue)
        '#10B981', // Sales (Green)
        '#F59E0B', // Body Shop (Orange)
        '#EF4444', // Admin (Red)
        '#8B5CF6', // Corporate (Purple)
        '#06B6D4', // Workshop (Cyan)
        '#EC4899', // Stores (Pink)
        '#14B8A6', // Accounts (Teal)
        '#6366F1', // IT (Indigo)
        '#84CC16', // Security (Lime)
    ];

    let items: any[] = [];
    if (data && data.length > 0) {
        const total = data.reduce((sum, d) => sum + Number(d.Amount || d.amount || 0), 0);
        items = data.map((d, idx) => {
            const amt = Number(d.Amount || d.amount || 0);
            const pct = total > 0 ? ((amt / total) * 100).toFixed(1) + '%' : '0%';
            return {
                department: d.Department || d.department || `Department ${idx + 1}`,
                amount: amt,
                percentage: pct,
                color: d.color || palette[idx % palette.length]
            };
        });
    }

    const totalGross = items.reduce((sum, d) => sum + d.amount, 0);
    const totalGrossLakhs = `₹${(totalGross / 100000).toFixed(0)} L`;

    const exportToExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Department-wise Salary");
        worksheet.addRow(["Department", "Gross Salary (₹)", "Share %"]);
        items.forEach(d => {
            worksheet.addRow([d.department, d.amount, d.percentage]);
        });
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        saveAs(blob, `Department_Wise_Salary_${new Date().toISOString().split("T")[0]}.xlsx`);
    };

    const options: Highcharts.Options = {
        chart: {
            type: 'pie',
            backgroundColor: 'transparent',
            height: 250,
            spacing: [0, 0, 0, 0]
        },
        title: {
            useHTML: true,
            text: `<div style="text-align:center;">
                <div style="font-size:14px; color:#64748B; font-weight:600;">Total gross</div>
                <div style="font-size:22px; font-weight:800; color:#0F172A; margin:3px 0;">${totalGrossLakhs}</div>
                <div style="font-size:13px; color:#94A3B8;">${items.length} departments</div>
            </div>`,
            align: 'center',
            verticalAlign: 'middle',
            y: 5
        },
        credits: { enabled: false },
        plotOptions: {
            pie: {
                innerSize: '72%',
                borderWidth: 2,
                borderColor: '#FFFFFF',
                dataLabels: { enabled: false },
                showInLegend: false
            }
        },
        tooltip: {
            useHTML: true,
            backgroundColor: '#0F172A',
            borderRadius: 8,
            borderWidth: 0,
            style: { color: '#FFFFFF', fontSize: '14px' },
            formatter: function () {
                const val = Number(this.y || 0).toLocaleString('en-IN');
                const pct = Number(this.percentage || 0).toFixed(1);
                return `<div style="padding:6px; font-size:14px;">
                    <div style="font-weight:700; color:${this.color};">${this.key}</div>
                    <div style="margin-top:3px;">₹${val} (${pct}%)</div>
                </div>`;
            }
        },
        series: [
            {
                type: 'pie',
                name: 'Salary',
                data: items.map(d => ({
                    name: d.department,
                    y: d.amount,
                    color: d.color
                }))
            }
        ]
    };

    return (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0]/80 dark:border-[#1E293B] p-5 shadow-xs flex flex-col justify-between h-full">
            {/* Header */}
            <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-bold text-[#0F172A] dark:text-white">
                            Department - wise salary
                        </h2>
                        <p className="text-[15px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                            {monthLabel} gross by department
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

            {/* Body */}
            <div className="mt-4 flex-1">
                {items.length === 0 ? (
                    <div className="py-14 text-center text-[#94A3B8] text-[15px] font-medium">
                        No department salary records found for this period.
                    </div>
                ) : viewMode === "chart" ? (
                    <div className="grid grid-cols-12 gap-3 items-center">
                        {/* Donut Chart (Left) */}
                        <div className="col-span-12 sm:col-span-5 flex items-center justify-center">
                            <div className="w-full max-w-[240px]">
                                <HighchartsReact highcharts={Highcharts} options={options} />
                            </div>
                        </div>

                        {/* Ranked Department List (Right) */}
                        <div className="col-span-12 sm:col-span-7 space-y-3 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                            {items.map((item, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => onDepartmentClick && onDepartmentClick(item.department)}
                                    className={`group flex items-center justify-between gap-2.5 text-[15px] transition-colors rounded-lg p-1.5 -mx-1.5 ${
                                        onDepartmentClick ? "cursor-pointer hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]/40" : ""
                                    }`}
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span
                                            className="w-2.5 h-2.5 rounded-full shrink-0"
                                            style={{ backgroundColor: item.color }}
                                        />
                                        <span className="font-semibold text-[#1E293B] dark:text-[#E2E8F0] truncate">
                                            {item.department}
                                        </span>
                                    </div>

                                    {/* Progress line connector */}
                                    <div className="flex-1 mx-2 hidden sm:block">
                                        <div
                                            className="h-1 rounded-full"
                                            style={{
                                                backgroundColor: item.color,
                                                opacity: 0.6
                                            }}
                                        />
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className="font-bold text-[#0F172A] dark:text-white">
                                            ₹{item.amount.toLocaleString('en-IN')}
                                        </span>
                                        <span className="text-[14px] text-[#94A3B8] font-medium w-12 text-right">
                                            {item.percentage}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto max-h-[280px] custom-scrollbar border border-[#F1F5F9] dark:border-[#1E293B] rounded-lg">
                        <table className="w-full text-[15px] text-left">
                            <thead className="bg-[#F8FAFC] dark:bg-[#1E293B]/80 text-[#334155] dark:text-[#CBD5E1] font-semibold sticky top-0">
                                <tr>
                                    <th className="px-3.5 py-2.5">Department</th>
                                    <th className="px-3.5 py-2.5">Gross Amount (₹)</th>
                                    <th className="px-3.5 py-2.5 text-right">Share %</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F1F5F9] dark:divide-[#1E293B]">
                                {items.map((row, i) => (
                                    <tr key={i} className="hover:bg-[#F8FAFC]/50 dark:hover:bg-[#1E293B]/40">
                                        <td className="px-3.5 py-2.5 font-medium flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: row.color }}></span>
                                            {row.department}
                                        </td>
                                        <td className="px-3.5 py-2.5 font-bold text-[#0F172A] dark:text-white">₹{row.amount.toLocaleString('en-IN')}</td>
                                        <td className="px-3.5 py-2.5 text-right font-semibold text-[#475569] dark:text-[#94A3B8]">{row.percentage}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}