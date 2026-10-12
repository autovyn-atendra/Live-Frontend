"use client";
import React, { useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import ExcelJS from "exceljs";
import { saveAs } from 'file-saver';

export interface MonthSalaryItem {
    month: string;
    gross: number;
    deductions: number;
    netPay: number;
}

interface MonthWiseSalaryChartProps {
    data?: MonthSalaryItem[];
    currentSummary?: {
        label?: string;
        gross: number;
        deductions: number;
        netPay: number;
        diffText?: string;
    };
    viewMode?: "chart" | "table";
    rangeMonths?: number;
}

export default function MonthWiseSalaryChart({
    data,
    currentSummary,
    viewMode: controlledViewMode,
    rangeMonths
}: MonthWiseSalaryChartProps) {
    const [viewMode, setViewMode] = useState<"chart" | "table">(controlledViewMode || "chart");

    React.useEffect(() => {
        if (controlledViewMode) {
            setViewMode(controlledViewMode);
        }
    }, [controlledViewMode]);

    const chartData = data && data.length > 0 ? data : [];
    const latest = chartData.length > 0 ? chartData[chartData.length - 1] : null;

    const curGross = currentSummary?.gross ?? latest?.gross ?? 0;
    const curDed = currentSummary?.deductions ?? latest?.deductions ?? 0;
    const curNet = currentSummary?.netPay ?? latest?.netPay ?? 0;
    const diffText = currentSummary?.diffText ?? "";

    const exportToExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Month-wise Salary");
        worksheet.addRow(["Month", "Gross Salary (₹)", "Deductions (₹)", "Net Pay (₹)"]);
        chartData.forEach(d => {
            worksheet.addRow([d.month, d.gross, d.deductions, d.netPay]);
        });
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        saveAs(blob, `Month_Wise_Salary_${new Date().toISOString().split("T")[0]}.xlsx`);
    };

    const options: Highcharts.Options = {
        chart: {
            type: 'column',
            backgroundColor: 'transparent',
            height: 320,
            spacingTop: 10,
            spacingBottom: 10,
        },
        title: { text: undefined },
        credits: { enabled: false },
        legend: { enabled: false },
        xAxis: {
            categories: chartData.map(d => d.month),
            lineColor: '#E2E8F0',
            tickColor: '#E2E8F0',
            labels: {
                style: {
                    color: '#64748B',
                    fontSize: '14px',
                    fontWeight: '600'
                }
            },
            plotBands: chartData.length > 0 ? [
                {
                    from: chartData.length - 1.5,
                    to: chartData.length - 0.5,
                    color: '#F8FAFC',
                    zIndex: 0
                }
            ] : []
        },
        yAxis: {
            min: 0,
            title: { text: undefined },
            gridLineColor: '#F1F5F9',
            gridLineDashStyle: 'Dash',
            labels: {
                formatter: function () {
                    const val = Number(this.value);
                    return `₹${Math.round(val / 100000)} L`;
                },
                style: {
                    color: '#94A3B8',
                    fontSize: '13px'
                }
            }
        },
        tooltip: {
            shared: true,
            useHTML: true,
            backgroundColor: '#0F172A',
            borderRadius: 8,
            borderWidth: 0,
            shadow: true,
            style: { color: '#FFFFFF', fontSize: '14px' },
            formatter: function () {
                let html = `<div style="padding:8px; font-size:14px;">
                    <div style="font-weight:700; margin-bottom:6px; border-bottom:1px solid #334155; padding-bottom:4px;">${this.x}</div>`;
                this.points?.forEach(p => {
                    const val = Number(p.y || 0).toLocaleString('en-IN');
                    html += `<div style="display:flex; justify-content:space-between; gap:16px; margin-bottom:4px;">
                        <span style="color:${p.color}; font-weight:500;">● ${p.series.name}:</span>
                        <span style="font-weight:700;">₹${val}</span>
                    </div>`;
                });
                html += `</div>`;
                return html;
            }
        },
        plotOptions: {
            column: {
                borderWidth: 0,
                borderRadius: 4,
                groupPadding: 0.15,
                pointPadding: 0.05
            }
        },
        series: [
            {
                type: 'column',
                name: 'Gross',
                data: chartData.map(d => d.gross),
                color: '#4F46E5',
                pointWidth: 16
            },
            {
                type: 'column',
                name: 'Deductions',
                data: chartData.map(d => d.deductions),
                color: '#F43F5E',
                pointWidth: 16
            },
            {
                type: 'column',
                name: 'Net pay',
                data: chartData.map(d => d.netPay),
                color: '#10B981',
                pointWidth: 16
            }
        ]
    };

    return (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0]/80 dark:border-[#1E293B] p-5 shadow-xs">
            {/* Header */}
            <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-bold text-[#0F172A] dark:text-white">
                            Month-wise salary
                        </h2>
                        <p className="text-[15px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                            Gross, deductions and net pay · {rangeMonths === 1 ? "last 1 month" : `last ${rangeMonths || chartData.length || 6} months`}
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

                {/* Legend */}
                {viewMode === "chart" && (
                    <div className="flex items-center gap-5 mt-3 text-[15px] font-medium text-[#475569] dark:text-[#94A3B8]">
                        <span className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-[#4F46E5]"></span>
                            Gross
                        </span>
                        <span className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-[#F43F5E]"></span>
                            Deductions
                        </span>
                        <span className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-[#10B981]"></span>
                            Net pay
                        </span>
                    </div>
                )}
            </div>

            {/* Body */}
            <div className="mt-3">
                {chartData.length === 0 ? (
                    <div className="py-16 text-center text-[#94A3B8] text-[15px] font-medium">
                        No salary trend data available for the selected period.
                    </div>
                ) : viewMode === "chart" ? (
                    <div className="w-full">
                        <HighchartsReact highcharts={Highcharts} options={options} />
                    </div>
                ) : (
                    <div className="overflow-x-auto max-h-[320px] custom-scrollbar border border-[#F1F5F9] dark:border-[#1E293B] rounded-lg">
                        <table className="w-full text-[15px] text-left">
                            <thead className="bg-[#F8FAFC] dark:bg-[#1E293B]/80 text-[#334155] dark:text-[#CBD5E1] font-semibold sticky top-0">
                                <tr>
                                    <th className="px-3.5 py-2.5">Month</th>
                                    <th className="px-3.5 py-2.5 text-[#4F46E5]">Gross (₹)</th>
                                    <th className="px-3.5 py-2.5 text-[#F43F5E]">Deductions (₹)</th>
                                    <th className="px-3.5 py-2.5 text-[#10B981]">Net Pay (₹)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F1F5F9] dark:divide-[#1E293B]">
                                {chartData.map((row, i) => (
                                    <tr key={i} className="hover:bg-[#F8FAFC]/50 dark:hover:bg-[#1E293B]/40">
                                        <td className="px-3.5 py-2.5 font-medium">{row.month}</td>
                                        <td className="px-3.5 py-2.5 text-[#4F46E5] font-semibold">₹{row.gross.toLocaleString('en-IN')}</td>
                                        <td className="px-3.5 py-2.5 text-[#F43F5E]">₹{row.deductions.toLocaleString('en-IN')}</td>
                                        <td className="px-3.5 py-2.5 text-[#10B981] font-bold">₹{row.netPay.toLocaleString('en-IN')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Bottom Summary Strip */}
            <div className="mt-4 pt-3 border-t border-[#F1F5F9] dark:border-[#1E293B] flex flex-wrap items-center justify-between gap-3 text-[15px] font-medium">
                <div className="flex items-center gap-3.5 text-[#475569] dark:text-[#94A3B8] flex-wrap">
                    <span className="font-semibold text-[#1E293B] dark:text-[#E2E8F0]">
                        {currentSummary?.label || (latest?.month ? `${latest.month} 2026` : "Salary Overview")}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#4F46E5]"></span>
                        Gross <strong className="text-[#1E293B] dark:text-white ml-0.5">₹{curGross.toLocaleString('en-IN')}</strong>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#F43F5E]"></span>
                        Deductions <strong className="text-[#1E293B] dark:text-white ml-0.5">₹{curDed.toLocaleString('en-IN')}</strong>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                        Net pay <strong className="text-[#1E293B] dark:text-white ml-0.5">₹{curNet.toLocaleString('en-IN')}</strong>
                    </span>
                </div>

                <div className="text-[#64748B] font-medium">
                    {diffText}
                </div>
            </div>
        </div>
    );
}
