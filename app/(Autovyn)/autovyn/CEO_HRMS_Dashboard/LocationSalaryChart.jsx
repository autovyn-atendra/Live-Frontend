"use client";
import React, { useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import ExcelJS from "exceljs";
import { saveAs } from 'file-saver';

export default function LocationSalaryChart({
    data = [],
    locations = [],
    selectedLocation,
    onFilterChange,
    monthLabel = "September 2026",
    viewMode: controlledViewMode
}) {
    const [viewMode, setViewMode] = useState(controlledViewMode || "chart");

    React.useEffect(() => {
        if (controlledViewMode) {
            setViewMode(controlledViewMode);
        }
    }, [controlledViewMode]);

    let chartItems = [];
    let totalAllLocations = 0;
    if (data && data.length > 0) {
        chartItems = data.map((d, idx) => {
            const amt = Number(d.TotalSalary || d.amount || d.Amount || 0);
            totalAllLocations += amt;
            const lakhs = (amt / 100000).toFixed(1);
            return {
                rank: idx + 1,
                location: d.Location || d.location || `Location ${idx + 1}`,
                amount: amt,
                label: `₹${lakhs} L`
            };
        });
    }

    const isScrollable = chartItems.length > 8;
    // Calculate dynamic container width so each location bar gets at least 55-60px
    const computedPlotMinWidth = isScrollable ? Math.max(700, chartItems.length * 56) : undefined;

    const exportToExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Location-wise Salary");
        worksheet.addRow(["Rank", "Location", "Gross Salary (₹)", "In Lakhs (₹ L)", "% of Total"]);
        chartItems.forEach(d => {
            const pct = totalAllLocations > 0 ? ((d.amount / totalAllLocations) * 100).toFixed(1) + "%" : "0%";
            worksheet.addRow([d.rank, d.location, d.amount, (d.amount / 100000).toFixed(2), pct]);
        });
        worksheet.addRow(["", "Total", totalAllLocations, (totalAllLocations / 100000).toFixed(2), "100%"]);
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        saveAs(blob, `Location_Wise_Salary_${new Date().toISOString().split("T")[0]}.xlsx`);
    };

    const options = {
        chart: {
            type: 'column',
            backgroundColor: 'transparent',
            height: 290,
            spacingTop: 10,
            spacingBottom: 25,
            spacingLeft: 10,
            spacingRight: 15,
            scrollablePlotArea: isScrollable ? {
                minWidth: computedPlotMinWidth,
                scrollPositionX: 0
            } : undefined
        },
        title: { text: undefined },
        credits: { enabled: false },
        legend: { enabled: false },
        xAxis: {
            categories: chartItems.map(d => d.location),
            lineColor: '#E2E8F0',
            tickColor: '#E2E8F0',
            labels: {
                rotation: chartItems.length > 5 ? -40 : 0,
                align: chartItems.length > 5 ? 'right' : 'center',
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
            labels: {
                formatter: function () {
                    const val = Number(this.value);
                    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)} Cr`;
                    return `₹${Math.round(val / 100000)} L`;
                },
                style: {
                    color: '#94A3B8',
                    fontSize: '13px'
                }
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
                const lakhs = (Number(this.y || 0) / 100000).toFixed(2);
                const pct = totalAllLocations > 0 ? ((Number(this.y || 0) / totalAllLocations) * 100).toFixed(1) : "0";
                return `<div style="padding:6px; font-size:14px;">
                    <div style="font-weight:700; margin-bottom:4px; border-bottom:1px solid #334155; padding-bottom:3px;">${this.x}</div>
                    <div style="color:#818CF8; font-weight:600;">Gross: ₹${val} <span style="color:#94A3B8;">(₹${lakhs} L)</span></div>
                    <div style="color:#94A3B8; font-size:12px; margin-top:2px;">${pct}% of total gross</div>
                </div>`;
            }
        },
        plotOptions: {
            column: {
                borderWidth: 0,
                borderRadius: 4,
                pointWidth: chartItems.length > 25 ? 26 : (chartItems.length > 10 ? 32 : 40),
                dataLabels: {
                    enabled: true,
                    rotation: chartItems.length > 10 ? -90 : 0,
                    y: chartItems.length > 10 ? -12 : -5,
                    formatter: function () {
                        const val = Number(this.y || 0);
                        if (val <= 0) return '';
                        if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
                        return `₹${(val / 100000).toFixed(1)}L`;
                    },
                    style: {
                        color: '#475569',
                        fontSize: '12px',
                        fontWeight: '700',
                        textOutline: 'none'
                    }
                }
            }
        },
        series: [
            {
                name: 'Gross',
                data: chartItems.map((d, i) => ({
                    y: d.amount,
                    color: i === 0 ? '#4338CA' : (i < 3 ? '#4F46E5' : '#6366F1')
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
                        <div className="flex items-center gap-2.5">
                            <h2 className="text-lg font-bold text-[#0F172A] dark:text-white">
                                Location - wise salary
                            </h2>
                            {chartItems.length > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-[13px] font-bold bg-[#EEF2FF] text-[#4338CA] dark:bg-[#4338CA]/20 dark:text-[#A5B4FC]">
                                    {chartItems.length} Locations
                                </span>
                            )}
                        </div>
                        <p className="text-[15px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                            {monthLabel} gross by all locations
                            {isScrollable && viewMode === "chart" && (
                                <span className="ml-2 text-[#4338CA] dark:text-[#818CF8] font-semibold text-xs">
                                    ↔ Scroll horizontally to view all
                                </span>
                            )}
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

                {/* Legend & Stats Strip */}
                {viewMode === "chart" && (
                    <div className="flex items-center justify-between gap-5 mt-3 text-[15px] font-medium text-[#475569] dark:text-[#94A3B8]">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-[#4F46E5]"></span>
                                Gross Salary
                            </span>
                            {totalAllLocations > 0 && (
                                <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                                    Total: <strong className="text-[#0F172A] dark:text-white">₹{(totalAllLocations / 10000000).toFixed(2)} Cr</strong>
                                </span>
                            )}
                        </div>

                        {isScrollable && (
                            <span className="hidden sm:inline-block text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] bg-[#F1F5F9] dark:bg-[#0F172A] px-2.5 py-1 rounded-md border border-[#E2E8F0] dark:border-[#334155]">
                                ⇄ Scrollable ({chartItems.length} locations)
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Body */}
            <div className="mt-4 flex-1">
                {chartItems.length === 0 ? (
                    <div className="py-14 text-center text-[#94A3B8] text-[15px] font-medium">
                        No location-wise salary records found for this period.
                    </div>
                ) : viewMode === "chart" ? (
                    /* Scrollable Chart Container */
                    <div className="w-full overflow-x-auto custom-scrollbar pb-1">
                        <div style={{ minWidth: isScrollable ? `${computedPlotMinWidth}px` : '100%' }}>
                            <HighchartsReact highcharts={Highcharts} options={options} />
                        </div>
                    </div>
                ) : (
                    /* Full Table with Rank, Location, Gross Salary, and Percentage */
                    <div className="overflow-x-auto max-h-[290px] custom-scrollbar border border-[#F1F5F9] dark:border-[#1E293B] rounded-lg">
                        <table className="w-full text-[15px] text-left">
                            <thead className="bg-[#F8FAFC] dark:bg-[#1E293B]/80 text-[#334155] dark:text-[#CBD5E1] font-semibold sticky top-0 z-10">
                                <tr>
                                    <th className="px-3 py-2.5 w-12 text-center">#</th>
                                    <th className="px-3.5 py-2.5">Location</th>
                                    <th className="px-3.5 py-2.5 text-right">Gross Salary (₹)</th>
                                    <th className="px-3.5 py-2.5 text-right">In Lakhs</th>
                                    <th className="px-3.5 py-2.5 text-right w-24">% of Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F1F5F9] dark:divide-[#1E293B]">
                                {chartItems.map((row, i) => {
                                    const pct = totalAllLocations > 0 ? ((row.amount / totalAllLocations) * 100).toFixed(1) : "0";
                                    return (
                                        <tr key={i} className="hover:bg-[#F8FAFC]/50 dark:hover:bg-[#1E293B]/40">
                                            <td className="px-3 py-2.5 text-center text-xs text-[#94A3B8] font-bold">{row.rank}</td>
                                            <td className="px-3.5 py-2.5 font-medium text-[#1E293B] dark:text-[#E2E8F0]">{row.location}</td>
                                            <td className="px-3.5 py-2.5 text-right font-bold text-[#0F172A] dark:text-white">
                                                ₹{row.amount.toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-3.5 py-2.5 text-right text-[#4338CA] dark:text-[#818CF8] font-semibold">
                                                ₹{(row.amount / 100000).toFixed(1)} L
                                            </td>
                                            <td className="px-3.5 py-2.5 text-right font-semibold text-[#64748B] dark:text-[#94A3B8]">
                                                {pct}%
                                            </td>
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