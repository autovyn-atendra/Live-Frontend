"use client";
import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const getStatusStyle = (status) => {
    const styles = {
        LATE: { bg: "#F59E0B20", color: "#F59E0B", border: "#F59E0B", label: "⏰ Late" },
        ONTIME: { bg: "#22C55E20", color: "#22C55E", border: "#22C55E", label: "✅ On Time" },
        ABSENT: { bg: "#EF444420", color: "#EF4444", border: "#EF4444", label: "❌ Absent" },
        EARLYGO: { bg: "#EC489920", color: "#EC4899", border: "#EC4899", label: "🚶 Early Go" }
    };
    return styles[status] || styles.ABSENT;
};

const InfoRow = ({ label, value, icon }) => (
    <div className="flex items-center gap-3 py-3 border-b border-borderColor dark:border-borderColor-dark last:border-0">
        <span className="text-xl">{icon}</span>
        <div className="flex-1">
            <p className="text-[15px] text-[#64748B] dark:text-[#94A3B8] uppercase font-medium">{label}</p>
            <p className="text-[16px] font-semibold text-[#0F172A] dark:text-white">{value || "N/A"}</p>
        </div>
    </div>
);

export default function EmployeeDetailDialog({ isOpen, onClose, employee }) {
    if (!employee) return null;

    const status = getStatusStyle(employee.PUNCH_STATUS);
    const initials = employee.EMP_NAME?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || "?";

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="w-full max-w-lg p-0 overflow-hidden bg-white dark:bg-black max-h-[90vh] border border-borderColor dark:border-borderColor-dark">
                {/* Header with Gradient */}
                <div className="bg-gradient-to-r from-[#1f3b73] to-[#2a5298] px-6 py-6 relative">
                    <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="relative">
                            {employee.PHOTO_URL ? (
                                <img 
                                    src={`${process.env.NEXT_PUBLIC_imagepath}${employee.PHOTO_URL}`}
                                    alt={employee.EMP_NAME}
                                    className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                            ) : null}
                            <div 
                                className="w-20 h-20 rounded-full bg-gradient-to-r from-[#37a9dd] to-[#1f3b73] flex items-center justify-center text-white font-bold text-2xl border-4 border-white shadow-lg"
                                style={{ display: employee.PHOTO_URL ? 'none' : 'flex' }}
                            >
                                {initials}
                            </div>
                            {/* Status Indicator */}
                            <div 
                                className="absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-white"
                                style={{ backgroundColor: status.color }}
                            />
                        </div>
                        
                        {/* Name & Basic Info */}
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-white">{employee.EMP_NAME}</h2>
                            <p className="text-[#DBEAFE] text-[15px] mt-0.5">{employee.DESIGNATION}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-[15px] text-[#DBEAFE] bg-white/20 px-3 py-1 rounded-full">
                                    📁 {employee.EMP_CODE}
                                </span>
                                <span className="text-[15px] text-[#DBEAFE] bg-white/20 px-3 py-1 rounded-full">
                                    🏢 {employee.DEPARTMENT}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status Banner */}
                <div className="px-6 py-3" style={{ backgroundColor: status.bg }}>
                    <div className="flex items-center justify-between">
                        <span className="text-[16px] font-semibold" style={{ color: status.color }}>
                            {status.label}
                        </span>
                        <span className="text-[15px] text-[#64748B] font-medium">
                            {employee.ATTENDANCE_STATUS?.trim() || "N/A"}
                        </span>
                    </div>
                </div>

                {/* Details */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-250px)]">
                    <div className="bg-[#F9FAFB] dark:bg-[#111827]/50 rounded-xl p-4 border border-borderColor dark:border-borderColor-dark">
                        <h3 className="text-[16px] font-bold text-[#1E293B] dark:text-white mb-3 uppercase tracking-wide">
                            📋 Attendance Details
                        </h3>
                        <InfoRow label="Login Time" value={employee.LOGIN_TIME || "--:--"} icon="🕐" />
                        <InfoRow label="Logout Time" value={employee.LOGOUT_TIME || "--:--"} icon="🕓" />
                        <InfoRow label="Punch Status" value={employee.PUNCH_STATUS} icon="📍" />
                        <InfoRow label="Attendance Status" value={employee.ATTENDANCE_STATUS?.trim() || "N/A"} icon="📊" />
                    </div>

                    <div className="bg-[#F9FAFB] dark:bg-[#111827]/50 rounded-xl p-4 border border-borderColor dark:border-borderColor-dark mt-4">
                        <h3 className="text-[16px] font-bold text-[#1E293B] dark:text-white mb-3 uppercase tracking-wide">
                            👤 Employee Info
                        </h3>
                        <InfoRow label="Employee Code" value={employee.EMP_CODE} icon="🆔" />
                        <InfoRow label="Full Name" value={employee.EMP_NAME} icon="👤" />
                        <InfoRow label="Designation" value={employee.DESIGNATION} icon="💼" />
                        <InfoRow label="Department" value={employee.DEPARTMENT} icon="🏢" />
                        <InfoRow label="Employee Type" value={employee.EMPLOYEE_TYPE || "N/A"} icon="📋" />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}