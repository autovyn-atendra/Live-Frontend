"use client";
import React, { useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import ExcelJS from "exceljs";
import { saveAs } from 'file-saver';

interface MonthAttendanceData {
    month: string;
    dayName?: string;
    present: number;
    onLeave: number;
    absent: number;
    weeklyOff?: number;
    total: number;
}

interface AttendanceChartProps {
    data?: MonthAttendanceData[];
    graphData?: any[];
    currentMonthSummary?: {
        label?: string;
        present: number;
        onLeave: number;
        absent: number;
        percentage?: number | string;
    };
    onExport?: () => void;
    viewMode?: "chart" | "table";
    rangeMonths?: number;
    title?: string;
    subtitle?: string;
}

export default function AttendanceChart({
    data,
    graphData,
    currentMonthSummary,
    viewMode: controlledViewMode,
    rangeMonths,
    title,
    subtitle
}: AttendanceChartProps) {
    const [viewMode, setViewMode] = useState<"chart" | "table">(controlledViewMode || "chart");

    React.useEffect(() => {
        if (controlledViewMode) {
            setViewMode(controlledViewMode);
        }
    }, [controlledViewMode]);

    let chartData: MonthAttendanceData[] = [];
    if (graphData && graphData.length > 0) {
        chartData = graphData.map(item => {
            const pres = Number(item.PRESENT ?? item.present ?? 0);
            const abs = Number(item.ABSENT ?? item.absent ?? 0);
            const leave = Number(item.ON_LEAVE ?? item.ONLEAVE ?? item.onLeave ?? item.LEAVE ?? 0);
            const weeklyOff = Number(item.WEEKLY_OFF ?? item.weeklyOff ?? 0);
            const total = pres + leave + abs + weeklyOff;
            
            // Format date label (e.g. "2026-10-09" -> "09 Oct")
            let label = item.DATE_LABEL || item.date || item.month || 'Day';
            if (label && typeof label === 'string' && label.includes('-')) {
                const parts = label.split('-');
                if (parts.length === 3) {
                    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                    const mIdx = parseInt(parts[1], 10) - 1;
                    const mName = months[mIdx] || parts[1];
                    label = `${parts[2]} ${mName}`;
                }
            }
            return {
                month: label,
                dayName: item.DAY_NAME || '',
                present: pres,
                onLeave: leave,
                absent: abs,
                weeklyOff: weeklyOff,
                total: total || (pres + abs + leave)
            };
        });
    } else if (data && data.length > 0) {
        chartData = data;
    }

    const latest = chartData.length > 0 ? chartData[chartData.length - 1] : null;
    const latestPresent = currentMonthSummary?.present ?? latest?.present ?? 0;
    const latestOnLeave = currentMonthSummary?.onLeave ?? latest?.onLeave ?? 0;
    const latestAbsent = currentMonthSummary?.absent ?? latest?.absent ?? 0;
    const latestTotal = latestPresent + latestOnLeave + latestAbsent;
    const attendancePct = currentMonthSummary?.percentage
        ? String(currentMonthSummary.percentage)
        : (latestTotal > 0 ? ((latestPresent / latestTotal) * 100).toFixed(1) : "0.0");

    const isScrollable = chartData.length > 8;
    const computedPlotMinWidth = isScrollable ? Math.max(650, chartData.length * 56) : undefined;

    const chartTitle = title || "Day-wise attendance";
    const chartSubtitle = subtitle || (chartData.length === 1 ? `Attendance breakdown for ${chartData[0].month}` : `Daily attendance breakdown · ${chartData.length} days`);

    const exportToExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Day-wise Attendance");
        worksheet.addRow(["Date / Day", "Day of Week", "Present", "On Leave", "Weekly Off", "Absent", "Total Headcount", "Attendance %"]);
        chartData.forEach(d => {
            const activeHeadcount = d.present + d.onLeave + d.absent;
            const pct = activeHeadcount > 0 ? ((d.present / activeHeadcount) * 100).toFixed(1) + "%" : "0%";
            worksheet.addRow([d.month, d.dayName || "", d.present, d.onLeave, d.weeklyOff || 0, d.absent, d.total, pct]);
        });
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        saveAs(blob, `Day_Wise_Attendance_${new Date().toISOString().split("T")[0]}.xlsx`);
    };

    const options: Highcharts.Options = {
        chart: {
            type: 'column',
            backgroundColor: 'transparent',
            height: 310,
            spacingTop: 10,
            spacingBottom: 20,
            spacingLeft: 5,
            spacingRight: 10,
            scrollablePlotArea: isScrollable ? {
                minWidth: computedPlotMinWidth,
                scrollPositionX: 0
            } : undefined
        },
        title: { text: undefined },
        credits: { enabled: false },
        legend: { enabled: false },
        xAxis: {
            categories: chartData.map(d => d.month),
            lineColor: '#E2E8F0',
            tickColor: '#E2E8F0',
            labels: {
                rotation: chartData.length > 7 ? -35 : 0,
                align: chartData.length > 7 ? 'right' : 'center',
                style: {
                    color: '#64748B',
                    fontSize: '13px',
                    fontWeight: '600'
                }
            }
        },
        yAxis: {
            min: 0,
            title: { text: undefined },
            gridLineColor: '#F1F5F9',
            gridLineDashStyle: 'Dash',
            stackLabels: {
                enabled: true,
                style: {
                    fontWeight: '700',
                    color: '#475569',
                    fontSize: '13px',
                    textOutline: 'none'
                }
            },
            labels: {
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
                let total = 0;
                let html = `<div style="padding:8px; font-size:14px;">
                    <div style="font-weight:700; margin-bottom:6px; border-bottom:1px solid #334155; padding-bottom:4px;">${this.x}</div>`;
                this.points?.forEach(p => {
                    total += Number(p.y || 0);
                    html += `<div style="display:flex; justify-content:space-between; gap:16px; margin-bottom:4px;">
                        <span style="color:${p.color}; font-weight:500;">● ${p.series.name}:</span>
                        <span style="font-weight:700;">${p.y}</span>
                    </div>`;
                });
                html += `<div style="margin-top:6px; padding-top:6px; border-top:1px solid #334155; display:flex; justify-content:space-between;">
                    <span style="color:#94A3B8;">Total:</span>
                    <span style="font-weight:700; color:#38BDF8;">${total}</span>
                </div></div>`;
                return html;
            }
        },
        plotOptions: {
            column: {
                stacking: 'normal',
                borderWidth: 0,
                pointWidth: chartData.length > 25 ? 26 : (chartData.length > 12 ? 32 : 40),
                borderRadius: 4
            }
        },
        series: [
            {
                type: 'column',
                name: 'Absent',
                data: chartData.map(d => d.absent),
                color: '#EF4444'
            },
            {
                type: 'column',
                name: 'Weekly off',
                data: chartData.map(d => d.weeklyOff || 0),
                color: '#94A3B8'
            },
            {
                type: 'column',
                name: 'On leave',
                data: chartData.map(d => d.onLeave),
                color: '#8B5CF6'
            },
            {
                type: 'column',
                name: 'Present',
                data: chartData.map(d => d.present),
                color: '#10B981'
            }
        ]
    };

    return (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0]/80 dark:border-[#1E293B] p-5 shadow-xs flex flex-col justify-between h-full">
            {/* Header */}
            <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h2 className="text-lg font-bold text-[#0F172A] dark:text-white">
                                {chartTitle}
                            </h2>
                            {chartData.length > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-[13px] font-bold bg-[#ECFDF5] text-[#059669] dark:bg-[#059669]/20 dark:text-[#6EE7B7]">
                                    {chartData.length} Days
                                </span>
                            )}
                        </div>
                        <p className="text-[15px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                            {chartSubtitle}
                            {isScrollable && viewMode === "chart" && (
                                <span className="ml-2 text-[#4338CA] dark:text-[#818CF8] font-semibold text-xs">
                                    ↔ Scroll horizontally to view all
                                </span>
                            )}
                        </p>
                    </div>

                    {/* Chart / Table Toggle & Export */}
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
                    <div className="flex items-center justify-between gap-5 mt-3 text-[15px] font-medium text-[#475569] dark:text-[#94A3B8] flex-wrap">
                        <div className="flex items-center gap-5 flex-wrap">
                            <span className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-[#10B981]"></span>
                                Present
                            </span>
                            <span className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-[#8B5CF6]"></span>
                                On leave
                            </span>
                            <span className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-[#94A3B8]"></span>
                                Weekly off
                            </span>
                            <span className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-[#EF4444]"></span>
                                Absent
                            </span>
                        </div>

                        {isScrollable && (
                            <span className="hidden sm:inline-block text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] bg-[#F1F5F9] dark:bg-[#0F172A] px-2.5 py-1 rounded-md border border-[#E2E8F0] dark:border-[#334155]">
                                ⇄ Scrollable ({chartData.length} days)
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Body */}
            <div className="mt-3">
                {chartData.length === 0 ? (
                    <div className="py-16 text-center text-[#94A3B8] text-[15px] font-medium">
                        No attendance trend records found for this period.
                    </div>
                ) : viewMode === "chart" ? (
                    <div className="w-full overflow-x-auto custom-scrollbar pb-1">
                        <div style={{ minWidth: isScrollable ? `${computedPlotMinWidth}px` : '100%' }}>
                            <HighchartsReact highcharts={Highcharts} options={options} />
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto max-h-[310px] custom-scrollbar border border-[#F1F5F9] dark:border-[#1E293B] rounded-lg">
                        <table className="w-full text-[15px] text-left">
                            <thead className="bg-[#F8FAFC] dark:bg-[#1E293B]/80 text-[#334155] dark:text-[#CBD5E1] font-semibold sticky top-0">
                                <tr>
                                    <th className="px-3.5 py-2.5">Date / Day</th>
                                    <th className="px-3.5 py-2.5 text-[#10B981]">Present</th>
                                    <th className="px-3.5 py-2.5 text-[#8B5CF6]">On Leave</th>
                                    <th className="px-3.5 py-2.5 text-[#94A3B8]">Weekly Off</th>
                                    <th className="px-3.5 py-2.5 text-[#EF4444]">Absent</th>
                                    <th className="px-3.5 py-2.5">Total</th>
                                    <th className="px-3.5 py-2.5 text-right">Attendance %</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F1F5F9] dark:divide-[#1E293B]">
                                {chartData.map((row, i) => {
                                    const activeHeadcount = row.present + row.onLeave + row.absent;
                                    const pct = activeHeadcount > 0 ? ((row.present / activeHeadcount) * 100).toFixed(1) : "0";
                                    return (
                                        <tr key={i} className="hover:bg-[#F8FAFC]/50 dark:hover:bg-[#1E293B]/40">
                                            <td className="px-3.5 py-2.5 font-medium">
                                                {row.month} {row.dayName ? <span className="text-xs text-[#94A3B8] ml-1">({row.dayName.slice(0, 3)})</span> : null}
                                            </td>
                                            <td className="px-3.5 py-2.5 text-[#10B981] font-semibold">{row.present}</td>
                                            <td className="px-3.5 py-2.5 text-[#8B5CF6]">{row.onLeave}</td>
                                            <td className="px-3.5 py-2.5 text-[#94A3B8]">{row.weeklyOff || 0}</td>
                                            <td className="px-3.5 py-2.5 text-[#EF4444]">{row.absent}</td>
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

            {/* Bottom Summary Strip */}
            <div className="mt-4 pt-3 border-t border-[#F1F5F9] dark:border-[#1E293B] flex flex-wrap items-center justify-between gap-3 text-[15px] font-medium">
                <div className="flex items-center gap-3.5 text-[#475569] dark:text-[#94A3B8] flex-wrap">
                    <span className="font-semibold text-[#1E293B] dark:text-[#E2E8F0]">
                        {currentMonthSummary?.label || (latest?.month ? `${latest.month} 2026` : "Attendance Overview")}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                        Present <strong className="text-[#1E293B] dark:text-white ml-0.5">{latestPresent}</strong>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#8B5CF6]"></span>
                        On leave <strong className="text-[#1E293B] dark:text-white ml-0.5">{latestOnLeave}</strong>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#EF4444]"></span>
                        Absent <strong className="text-[#1E293B] dark:text-white ml-0.5">{latestAbsent}</strong>
                    </span>
                </div>

                <div className="text-[#10B981] font-bold">
                    {attendancePct}% attendance
                </div>
            </div>
        </div>
    );
}