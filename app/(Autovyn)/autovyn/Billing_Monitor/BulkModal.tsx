"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Api, FILE_URL, FQ, inputCls, labelCls, money, nowLocal, toast, uploadReceipt } from "./utils";
import { Entry, billAmt } from "./Invoice";

interface Props {
  api: Api; user: any; kind: "paid" | "due"; rows: Entry[]; remark: string; onClose: () => void; onSaved: () => void;
}

const BulkModal = ({ api, user, kind, rows, remark, onClose, onSaved }: Props) => {
  const isPaid = kind === "paid";
  const [saving, setSaving] = useState(false);
  const [common, setCommon] = useState(remark);
  const [roll, setRoll] = useState(true);
  const [list, setList] = useState<any[]>(
    rows.map((r) => ({
      BE_ID: r.BE_ID, name: r.Client_Name, code: r.Client_Code, module: r.Module_Name, freq: r.Frequency, status: r.Status,
      Amount_Paid: isPaid ? billAmt(r) || "" : "", Payment_Date: nowLocal(), Reference_No: "", Receipt_Image: "",
      Amount_Due: !isPaid ? billAmt(r) || "" : "",
    }))
  );
  const upd = (id: number, p: any) => setList((x) => x.map((r) => (r.BE_ID === id ? { ...r, ...p } : r)));

  const upload = async (id: number, file?: File) => {
    if (!file) return;
    setSaving(true);
    const p = await uploadReceipt(file, user);
    setSaving(false);
    if (p) upd(id, { Receipt_Image: p });
  };

  const save = async () => {
    for (const r of list) {
      if (isPaid) {
        if (!(+r.Amount_Paid > 0)) return toast(`Amount required for ${r.name} (${r.module})`, "info");
        if (!r.Payment_Date) return toast(`Payment date & time required for ${r.name}`, "info");
      } else if (!(+r.Amount_Due > 0)) return toast(`Amount due required for ${r.name} (${r.module})`, "info");
    }
    try {
      setSaving(true);
      const res = isPaid
        ? await api("billingBulkPaid", { rows: list, Remarks: common, Roll: roll })
        : await api("billingBulkDue", { rows: list, Remarks: common });
      if (res?.Status) { toast(res.Message); onSaved(); } else toast(res?.Message || "Update failed", "error");
    } catch (e: any) {
      toast(e?.response?.data?.Message || "Update failed", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#0F172A]/70 via-[#000000]/60 to-[#0F172A]/70 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-2xl bg-[#FFFFFF] dark:bg-[#1E293B] shadow-2xl ring-1 ring-[#000000]/10 dark:ring-[#FFFFFF]/10 flex flex-col">

        {/* ===== Header ===== */}
        <div className="px-6 py-4 flex justify-between items-start border-b border-[#E2E8F0] dark:border-[#334155] bg-gradient-to-r from-[#FFFFFF] to-[#F8FAFC] dark:from-[#1E293B] dark:to-[#0F172A]">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shrink-0 ${isPaid
                ? "bg-gradient-to-br from-[#16A34A] to-[#22C55E] shadow-[#16A34A]/30"
                : "bg-gradient-to-br from-[#DC2626] to-[#EF4444] shadow-[#DC2626]/30"
              }`}>
              <span className="text-[#FFFFFF] text-base font-bold">{isPaid ? "✓" : "⏱"}</span>
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-[#1E293B] dark:text-[#FFFFFF] leading-tight truncate">
                Mark {list.length} {list.length === 1 ? "Entry" : "Entries"} as {isPaid ? "Paid" : "Due"}
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                {isPaid
                  ? "Fill in the amount, date & time, reference number and receipt for each entry."
                  : "Confirm the amount due for each entry."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9] dark:text-[#94A3B8] dark:hover:text-[#FFFFFF] dark:hover:bg-[#334155] transition-all text-lg shrink-0"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* ===== Body ===== */}
        <div className="px-6 py-5 overflow-y-auto flex-1 space-y-3">
          {list.map((r, idx) => (
            <div
              key={r.BE_ID}
              className="rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] overflow-hidden"
            >
              {/* Entry Header */}
              <div className="px-4 py-3 flex items-center gap-2 flex-wrap border-b border-[#E2E8F0] dark:border-[#334155] bg-gradient-to-r from-[#FFFFFF] to-[#F8FAFC] dark:from-[#1E293B] dark:to-[#0F172A]">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-[#EEF2FF] dark:bg-[#6366F1]/20 text-[#4F46E5] dark:text-[#818CF8] text-[11px] font-bold shrink-0">
                  {idx + 1}
                </span>
                <p className="text-sm font-bold text-[#1E293B] dark:text-[#FFFFFF]">{r.code}</p>
                <span className="text-[#CBD5E1] dark:text-[#475569]">·</span>
                <p className="text-sm font-semibold text-[#334155] dark:text-[#E2E8F0] truncate">{r.name}</p>
                <span className="ml-auto text-[11px] font-semibold uppercase tracking-wider text-[#4F46E5] dark:text-[#818CF8] bg-[#EEF2FF] dark:bg-[#6366F1]/20 px-2 py-0.5 rounded-full whitespace-nowrap">
                  {r.module}
                </span>
              </div>

              {/* Entry Fields */}
              <div className="p-4 grid grid-cols-12 gap-x-3 gap-y-3">
                {isPaid ? (
                  <>
                    <div className="col-span-12 md:col-span-6">
                      <label className={labelCls}>Amount Paid (₹) <span className="text-[#EF4444]">*</span></label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className={inputCls}
                        value={r.Amount_Paid}
                        onChange={(e) => upd(r.BE_ID, { Amount_Paid: e.target.value })}
                      />
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <label className={labelCls}>Payment Date &amp; Time <span className="text-[#EF4444]">*</span></label>
                      <input
                        type="datetime-local"
                        className={inputCls}
                        value={r.Payment_Date}
                        onChange={(e) => upd(r.BE_ID, { Payment_Date: e.target.value })}
                      />
                    </div>
                    <div className="col-span-12">
                      <label className={labelCls}>Reference No.</label>
                      <input
                        className={inputCls}
                        placeholder="Leave empty for cash"
                        value={r.Reference_No}
                        onChange={(e) => upd(r.BE_ID, { Reference_No: e.target.value })}
                      />
                    </div>
                    <div className="col-span-12">
                      <label className={labelCls}>Receipt (image)</label>
                      {!r.Receipt_Image ? (
                        <label className="flex items-center gap-3 h-14 px-4 rounded-xl border-2 border-dashed border-[#CBD5E1] dark:border-[#475569] bg-[#FFFFFF] dark:bg-[#1E293B] cursor-pointer hover:border-[#6366F1] hover:bg-[#EEF2FF] dark:hover:bg-[#6366F1]/10 transition-all">
                          <span className="text-xl">📷</span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#334155] dark:text-[#FFFFFF]">Click to upload receipt</p>
                            <p className="text-xs text-[#94A3B8]">PNG, JPG up to 5MB</p>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              upload(r.BE_ID, e.target.files?.[0]);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      ) : (
                        <div className="flex items-center gap-3 p-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#FFFFFF] dark:bg-[#1E293B]">
                          <img
                            src={FILE_URL + r.Receipt_Image}
                            alt="Receipt"
                            className="w-14 h-14 object-cover rounded-lg border border-[#E2E8F0] dark:border-[#334155] cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => window.open(FILE_URL + r.Receipt_Image, "_blank")}
                          />
                          <span className="text-xs text-[#64748B] dark:text-[#94A3B8] truncate flex-1">{r.Receipt_Image}</span>
                          <button
                            type="button"
                            onClick={() => upd(r.BE_ID, { Receipt_Image: "" })}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#FEE2E2] text-[#B91C1C] hover:bg-[#FECACA] transition-colors shrink-0"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="col-span-12 md:col-span-6">
                    <label className={labelCls}>Amount Due (₹, incl. GST) <span className="text-[#EF4444]">*</span></label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={inputCls}
                      value={r.Amount_Due}
                      onChange={(e) => upd(r.BE_ID, { Amount_Due: e.target.value })}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* ===== Common Remark ===== */}
          <div className="rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#FFFFFF] dark:bg-[#1E293B] p-4">
            <label className={labelCls}>
              Remark <span className="text-[#94A3B8] font-normal">(for all selected entries)</span>
            </label>
            <input
              className={inputCls}
              value={common}
              placeholder="Optional"
              onChange={(e) => setCommon(e.target.value)}
            />
          </div>

          {/* {isPaid && (
            <label className="flex items-start gap-2 text-sm text-[#334155] dark:text-white cursor-pointer">
              <input type="checkbox" checked={roll} onChange={(e) => setRoll(e.target.checked)} className="w-4 h-4 mt-0.5 accent-[#4F46E5]" />
              <span>Move due entries to the next billing cycle (Last Billing = old Next Billing, Next Billing + {[...new Set(list.map((r) => FQ[r.freq]).filter(Boolean))].join(" / ") || "frequency"}). Total: {money(list.reduce((a, r) => a + (+r.Amount_Paid || 0), 0))}</span>
            </label>
          )} */}
        </div>

        {/* ===== Footer ===== */}
        <div className="px-6 py-4 flex justify-between items-center gap-3 border-t border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A]">
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
            {list.length} {list.length === 1 ? "entry" : "entries"} selected
          </p>
          <div className="flex gap-3">
            <Button variant="print" onClick={onClose} className="px-6">Cancel</Button>
            <Button
              variant="save"
              onClick={save}
              className="px-6 min-w-[110px]"
              disabled={saving}
            >
              {saving ? (
                <span className="flex items-center gap-2 justify-center">
                  <span className="w-3.5 h-3.5 border-2 border-[#FFFFFF]/30 border-t-[#FFFFFF] rounded-full animate-spin" />
                  Saving...
                </span>
              ) : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkModal;