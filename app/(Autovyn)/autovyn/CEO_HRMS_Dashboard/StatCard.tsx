"use client";
import React from "react";

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: React.ReactNode;
    icon: React.ReactNode;
    iconBg?: string;
    iconColor?: string;
    onClick?: () => void;
    trend?: {
        text: string;
        isPositive?: boolean;
        colorClass?: string;
    };
}

export default function StatCard({
    title,
    value,
    subtitle,
    icon,
    iconBg = "bg-[#EFF6FF] dark:bg-[#1E293B]/40",
    iconColor = "text-[#2563EB] dark:text-[#60A5FA]",
    onClick,
    trend
}: StatCardProps) {
    return (
        <div
            onClick={onClick}
            className={`group relative bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0]/80 dark:border-[#1E293B] p-5 shadow-xs transition-all duration-200 hover:shadow-md hover:border-[#CBD5E1] dark:hover:border-[#334155] ${onClick ? "cursor-pointer" : ""}`}
        >
            <div className="flex items-start justify-between">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${iconBg} ${iconColor} transition-transform group-hover:scale-105`}>
                    {icon}
                </div>
            </div>

            <div className="mt-4">
                <p className="text-[15px] font-semibold text-[#64748B] dark:text-[#94A3B8]">
                    {title}
                </p>
                <p className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] dark:text-white mt-1 tracking-tight">
                    {typeof value === "number" ? value.toLocaleString("en-IN") : value}
                </p>
            </div>

            {(subtitle || trend) && (
                <div className="mt-3 pt-2.5 border-t border-[#F1F5F9] dark:border-[#1E293B]/80 flex items-center gap-1.5 text-[15px] font-medium text-[#64748B] dark:text-[#94A3B8]">
                    {trend ? (
                        <span className={trend.colorClass || (trend.isPositive ? "text-[#10B981] font-semibold" : "text-[#EF4444] font-semibold")}>
                            {trend.text}
                        </span>
                    ) : (
                        subtitle
                    )}
                </div>
            )}
        </div>
    );
}