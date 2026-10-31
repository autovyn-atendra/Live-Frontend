"use client";
import React, { useMemo } from "react";
import { cardCls, fmtDT, thCls, tdCls } from "./utils";
import { LogRow } from "./Invoice";

// 👈 Props mein selectedCode add kiya
interface Props {
  logs: LogRow[];
  selectedCode?: string | null; 
  onRowClick?: (log: LogRow) => void;
}

const HistoryPanel = ({ logs, selectedCode , onRowClick }: Props) => {
  
  // 👈 Filter logic: Agar selectedCode hai to sirf uski logs dikhao, warna saari
  const filteredLogs = useMemo(() => {
    if (!selectedCode) return logs;
    return logs.filter((l) => String(l.Client_Code) === String(selectedCode));
  }, [logs, selectedCode]);

  return (
    <div className={cardCls}>
      {/* Agar selected company hai, to ek chhota sa banner dikha dein (Optional but good UX) */}
      {selectedCode && (
        <div className="mb-3 px-4 py-2 bg-[#EEF2FF] dark:bg-[#6366F1]/20 border border-[#C7D2FE] dark:border-[#4338CA] rounded-lg flex items-center justify-between">
          <p className="text-sm text-[#4338CA] dark:text-[#818CF8] font-medium">
            Showing history for selected company only ({selectedCode})
          </p>
        </div>
      )}

      <div className="overflow-auto max-h-[420px] rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#FFFFFF] dark:bg-[#1E293B]">
        <table className="w-full text-sm min-w-[720px] border-collapse">
          <thead className="sticky top-0 z-10 bg-gradient-to-b from-[#F8FAFC] to-[#F1F5F9] dark:from-[#0F172A] dark:to-[#1E293B] shadow-sm">
            <tr>
              {["Sent at", "Company", "Type", "Channel", "Doc. No.", "Result", "By"].map((h) => (
                <th key={h} className={thCls}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* 👈 Yahan logs ki jagah filteredLogs use kiya */}
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-14 h-14 rounded-2xl bg-[#F1F5F9] dark:bg-[#0F172A] flex items-center justify-center text-2xl opacity-60">
                      📭
                    </div>
                    <p className="text-sm font-semibold text-[#64748B] dark:text-[#94A3B8]">
                      {selectedCode ? "No history found for this company" : "Nothing sent yet"}
                    </p>
                    <p className="text-xs text-[#94A3B8] dark:text-[#64748B]">
                      {selectedCode ? "Invoices and alerts sent to this company will appear here" : "Invoices and alerts will appear here once sent"}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredLogs.map((l) => (
                <tr
                  key={l.Log_ID}
                  onClick={() => onRowClick?.(l)}
                  className="hover:cursor-pointer border-t border-[#F1F5F9] dark:border-[#334155] hover:bg-[#F8FAFC] dark:hover:bg-[#0F172A] transition-colors"
                >
                  <td className={`${tdCls} whitespace-nowrap text-[#64748B] dark:text-[#94A3B8]`}>
                    {fmtDT(l.Sent_At)}
                  </td>
                  <td className={`${tdCls} font-medium text-[#1E293B] dark:text-[#FFFFFF]`}>
                    {l.Client_Name || <span className="text-[#94A3B8] italic">—</span>}
                  </td>
                  <td className={tdCls}>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${
                      l.Mode === "invoice"
                        ? "bg-[#EEF2FF] text-[#4F46E5] dark:bg-[#6366F1]/20 dark:text-[#818CF8]"
                        : "bg-[#FEF3C7] text-[#92400E] dark:bg-[#F59E0B]/20 dark:text-[#FCD34D]"
                    }`}>
                      {l.Mode === "invoice" ? "📄 Invoice" : "🔔 Alert"}
                    </span>
                  </td>
                  <td className={tdCls}>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                      l.Channel === "email"
                        ? "text-[#0284C7] dark:text-[#38BDF8]"
                        : "text-[#16A34A] dark:text-[#4ADE80]"
                    }`}>
                      {l.Channel === "email" ? "✉ Email" : "💬 WhatsApp"}
                    </span>
                  </td>
                  <td className={`${tdCls} font-mono text-xs text-[#334155] dark:text-[#E2E8F0]`}>
                    {l.Doc_No || <span className="text-[#94A3B8] italic"> </span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      l.Result === "sent"
                        ? "bg-[#DCFCE7] text-[#15803D] dark:bg-[#16A34A]/20 dark:text-[#4ADE80]"
                        : "bg-[#FEE2E2] text-[#B91C1C] dark:bg-[#DC2626]/20 dark:text-[#F87171]"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        l.Result === "sent" ? "bg-[#16A34A]" : "bg-[#DC2626]"
                      }`} />
                      {l.Result === "sent" ? "Sent" : "Failed"}
                    </span>
                  </td>
                  <td className={`${tdCls} text-[#64748B] dark:text-[#94A3B8]`}>
                    {l.Sent_By || <span className="text-[#94A3B8] italic"> </span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistoryPanel;