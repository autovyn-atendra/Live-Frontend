"use client";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Search } from "lucide-react";
export default function EmployeeListModal({
    isOpen,
    onClose,
    title,
    subtitle,
    data,
    isLoading,
    onEmployeeClick,
    onDepartmentClick,
    onExport   // 🔴 naya prop
}) {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredList = data.filter(emp => {
        const s = searchTerm.toLowerCase();
        if (emp.isDepartment) return emp.name?.toLowerCase().includes(s);
        return (
            emp.name?.toLowerCase().includes(s) ||
            emp.EMPCODE?.toLowerCase().includes(s) ||
            emp.designation?.toLowerCase().includes(s) ||
            emp.department?.toLowerCase().includes(s)
        );
    });

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="w-full max-w-screen-lg p-0 max-h-[90vh] overflow-hidden bg-white dark:bg-black border dark:border-borderColor-dark">
                <div className="bg-gradient-to-r from-[#1f3b73] to-[#2a5298] px-6 py-4 pr-12 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                      
                        <div className="min-w-0">
                            <h2 className="text-2xl font-bold text-white">{title}</h2>
                            <p className="text-[15px] text-[#DBEAFE] mt-0.5">{subtitle}</p>
                
                        </div>
                        {onExport && (
                            <button
                                onClick={onExport}
                                className="flex-shrink-0 flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-[15px] px-3.5 py-2 rounded-lg transition-all border border-white/20 mt-0.5"
                            >
                                📥 Export
                            </button>
                        )}
                    </div>
                </div>

                <div className="p-5">
                    <div className="relative mb-4">
                        {/* <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#94A3B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg> */}
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#94A3B8]" />  
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                            className="w-full pl-10 pr-4 py-2.5 text-[15px] border rounded-lg dark:bg-[#0F172A] dark:text-white focus:ring-2 focus:ring-[#1f3b73] outline-none"
                        />
                    </div>

                    <div className="space-y-2.5 max-h-[50vh] overflow-y-auto custom-scrollbar">
                        {isLoading ? (
                            <div className="flex flex-col items-center py-12">
                                <div className="w-10 h-10 border-4 border-[#1f3b73] border-t-transparent rounded-full animate-spin" />
                                <p className="mt-3 text-[15px] opacity-70">Loading...</p>
                            </div>
                        ) : filteredList.length === 0 ? (
                            <div className="text-center py-12 opacity-50 text-[15px]">
                                <p>No results found</p>
                            </div>
                        ) : (
                            filteredList.map((emp, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => emp.isDepartment ? onDepartmentClick(emp.department) : onEmployeeClick(emp.EMPCODE)}
                                    className="group p-4 border rounded-lg cursor-pointer hover:border-[#1f3b73] hover:shadow-md transition-all bg-white dark:bg-[#0F172A]"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-full bg-gradient-to-r from-[#1f3b73] to-[#37a9dd] flex items-center justify-center text-white font-bold text-[16px] shrink-0">
                                                {emp.name?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                            <div>
                                                <h4 className="text-[16px] font-semibold group-hover:text-[#1f3b73] transition-colors">{emp.name}</h4>
                                                <div className="flex gap-2.5 text-[15px] opacity-75 flex-wrap mt-0.5">
                                                    <span>📁 {emp.employeeCode || emp.EMPCODE || 'N/A'}</span>
                                                    <span>💼 {emp.designation || 'N/A'}</span>
                                                    {emp.department && <span>🏢 {emp.department}</span>}
                                                    {emp.absent_days !== undefined && <span className="text-red-500 font-semibold">🚨 {emp.absent_days} Days Absent</span>}
                                                    {emp.status && <span>🏷️ {emp.status}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-lg opacity-40 group-hover:opacity-100 transition-all">→</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}