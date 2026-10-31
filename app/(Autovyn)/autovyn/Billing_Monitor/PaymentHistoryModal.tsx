"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Api, FILE_URL, FQ, dmy, fmtDT, money, thCls, tdCls } from "./utils";
import { Entry } from "./Invoice";
import RecordPaymentModal from "./RecordPaymentModal";

interface Props { api: Api; user: any; rows: Entry[]; clientCode: string; onClose: () => void; onSaved: () => void; }

const PaymentHistoryModal = ({ api, user, rows, clientCode, onClose, onSaved }: Props) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPay, setShowPay] = useState(false);

  const list = useMemo(() => rows.filter((r) => r.Client_Code === clientCode), [rows, clientCode]);
  const first = list[0];

  const load = async () => {
    try {
      setLoading(true);
      const r = await api("getBillingPaymentHistory", { Client_Code: clientCode });
      setLogs(r?.Result || []);
    } catch (e) { setLogs([]); } finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [clientCode]);

  // Module wise paid chips banane ke liye
  const byModule: Record<string, any[]> = {};
  logs.forEach((l) => {
    (byModule[l.Module_Name] = byModule[l.Module_Name] || []).push(l);
  });

  const total = logs.reduce((a, l) => a + (Number(l.Amount) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-xl bg-white dark:bg-[#1E293B] shadow-xl border border-[#E2E8F0] dark:border-[#334155]">
        <div className="px-6 py-4 flex justify-between items-center border-b">
          <h2 className="text-lg font-bold text-[#1E293B] dark:text-white">
            {first?.Client_Name} · Payment History
          </h2>
          <Button variant="print" onClick={onClose} className="px-5">Close</Button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {loading ? <p className="text-sm text-[#94A3B8]">Loading...</p> : list.map((r) => {
            const paid = (byModule[r.Module_Name] || []).filter((x) => x.Period_Label);
            return (
              <div key={r.BE_ID} className="rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-[#1E293B] dark:text-white">{r.Module_Name}</p>
                    <p className="text-xs text-[#64748B]">
                      {FQ[r.Frequency || "monthly"]} · Next billing date: {dmy(r.Next_Billing_Date)}
                    </p>
                  </div>
                  {/* <button onClick={() => setShowPay(true)}
                    className="h-8 px-3 rounded-md bg-[#16A34A] text-white text-xs font-semibold">
                    Record Payment
                  </button> */}
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  {paid.length === 0 && <span className="text-xs text-[#94A3B8] italic">No payments yet</span>}
                  {paid.map((p) => (
                    <span key={p.BP_ID} className="text-[11px] px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D]">
                      {p.Period_Label} ✓ Paid
                    </span>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="rounded-xl border border-[#E2E8F0] dark:border-[#334155] overflow-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead className="bg-[#F8FAFC] dark:bg-[#0F172A]">
                <tr>{["Module", "Billing Period", "Amount", "Paid On", "Reference", "Receipt", "Recorded By"].map((h) => (
                  <th key={h} className={thCls}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-6 text-[#94A3B8] italic">No payment records</td></tr>
                ) : logs.map((l) => (
                  <tr key={l.BP_ID} className="border-t border-[#F1F5F9] dark:border-[#334155]">
                    <td className={tdCls}>{l.Module_Name}</td>
                    <td className={tdCls}>{l.Period_Label || "—"}</td>
                    <td className={tdCls}>{money(l.Amount)}</td>
                    <td className={tdCls}>{l.Payment_Date ? fmtDT(l.Payment_Date) : "—"}</td>
                    <td className={tdCls}>{l.Reference_No || "—"}</td>
                    <td className={tdCls}>
                      {l.Receipt_Image
                        ? <img src={FILE_URL + l.Receipt_Image} className="w-8 h-8 rounded cursor-pointer" onClick={() => window.open(FILE_URL + l.Receipt_Image, "_blank")} />
                        : "—"}
                    </td>
                    <td className={tdCls}>{l.Create_by || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {logs.length > 0 && (
            <p className="text-xs text-[#64748B]">Total received: <b>{money(total)}</b></p>
          )}
        </div>

        {showPay && (
          <RecordPaymentModal api={api} user={user} rows={rows} clientCode={clientCode}
            onClose={() => setShowPay(false)}
            onSaved={() => { setShowPay(false); onSaved(); load(); }} />
        )}
      </div>
    </div>
  );
};

export default PaymentHistoryModal;