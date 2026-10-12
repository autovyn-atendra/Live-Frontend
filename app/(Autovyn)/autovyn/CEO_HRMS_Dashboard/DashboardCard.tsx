"use client";
import React from "react";

interface DashboardCardProps {
    title: string;
    value: number | string;
    trend?: {
        text: string;
        isPositive?: boolean;
        colorClass?: string;
    };
    subtitle?: string;
    type?: "gross" | "deduction" | "net" | "avg";
    onClick?: () => void;
}

export default function DashboardCard({
    title,
    value,
    trend,
    subtitle,
    type,
    onClick
}: DashboardCardProps) {
    const formattedValue = typeof value === "number" 
        ? `₹${value.toLocaleString("en-IN")}`
        : (String(value).startsWith("₹") ? value : `₹${Number(value || 0).toLocaleString("en-IN")}`);

    const getIconConfig = () => {
        const lower = title.toLowerCase();
        if (type === "gross" || lower.includes("gross")) {
            return {
                icon: <span className="font-bold text-lg">₹</span>,
                bg: "bg-[#EFF6FF] dark:bg-[#1E293B]/40",
                color: "text-[#2563EB] dark:text-[#60A5FA]"
            };
        }
        if (type === "deduction" || lower.includes("deduct")) {
            return {
                icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                    </svg>
                ),
                bg: "bg-[#FEF2F2] dark:bg-[#1E293B]/40",
                color: "text-[#EF4444] dark:text-[#F87171]"
            };
        }
        if (type === "net" || lower.includes("net")) {
            return {
                icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                ),
                bg: "bg-[#ECFDF5] dark:bg-[#1E293B]/40",
                color: "text-[#10B981] dark:text-[#34D399]"
            };
        }
        return {
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7 7z" />
                </svg>
            ),
            bg: "bg-[#FAF5FF] dark:bg-[#1E293B]/40",
            color: "text-[#9333EA] dark:text-[#C084FC]"
        };
    };

    const iconCfg = getIconConfig();

    return (
        <div
            onClick={onClick}
            className={`group bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0]/80 dark:border-[#1E293B] p-5 shadow-xs transition-all duration-200 hover:shadow-md hover:border-[#CBD5E1] dark:hover:border-[#334155] ${onClick ? "cursor-pointer" : ""}`}
        >
            <div className="flex items-start justify-between">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${iconCfg.bg} ${iconCfg.color} transition-transform group-hover:scale-105`}>
                    {iconCfg.icon}
                </div>
            </div>

            <div className="mt-4">
                <p className="text-[15px] font-semibold text-[#64748B] dark:text-[#94A3B8]">
                    {title}
                </p>
                <p className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] dark:text-white mt-1 tracking-tight">
                    {formattedValue}
                </p>
            </div>

            {(trend || subtitle) && (
                <div className="mt-3 pt-2.5 border-t border-[#F1F5F9] dark:border-[#1E293B]/80 flex items-center gap-1.5 text-[15px] font-medium text-[#64748B] dark:text-[#94A3B8]">
                    {trend ? (
                        <span className={trend.colorClass || (trend.isPositive ? "text-[#10B981] font-semibold" : "text-[#EF4444] font-semibold")}>
                            {trend.text}
                        </span>
                    ) : (
                        <span>{subtitle}</span>
                    )}
                </div>
            )}
        </div>
    );
}