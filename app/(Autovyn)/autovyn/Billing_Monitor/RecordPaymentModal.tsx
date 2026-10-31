"use client";
import React, { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Api, FILE_URL, FQ, MOS, addMonths, inputCls, labelCls, nowLocal, toast, uploadReceipt } from "./utils";
import { Entry, billAmt } from "./Invoice";
import { periodLabel } from "./period";

interface Props {
    api: Api; user: any; rows: Entry[]; clientCode: string; onClose: () => void; onSaved: () => void;
}

const RecordPaymentModal = ({ api, user, rows, clientCode, onClose, onSaved }: Props) => {
    const list = useMemo(() => rows.filter((r) => r.Client_Code === clientCode), [rows, clientCode]);
    const first = list[0];

    const totalDue = list.reduce((a, r) => a + (+billAmt(r) || 0), 0);
    const [baseAmount] = useState<number>(totalDue);
    
    // States (amount and cycles initialized properly)
    const [amount, setAmount] = useState<string>(String(totalDue || ""));
    const [payDate, setPayDate] = useState<string>(nowLocal());
    const [ref, setRef] = useState("");
    const [remark, setRemark] = useState("");
    const [receipt, setReceipt] = useState("");
    
    // Default "Billing period paid: starts on" is Last Billing or Start Date
    const [from, setFrom] = useState<string>(first?.Last_Billing_Date || first?.Start_Date || "");
    
    // Dropdowns & Calculation states
    const [freq, setFreq] = useState<string>(first?.Frequency || "monthly");
    const [cycles, setCycles] = useState<string>("1"); 
    const [nextDate, setNextDate] = useState<string>("");
    
    // Flag to track if Next Billing Date is manually edited
    const [nextManual, setNextManual] = useState<boolean>(false);
    
    const [saving, setSaving] = useState(false);

    const mo = MOS[freq] || 1;

    // 1. Auto-calculate Amount based on cycles
    useEffect(() => {
        const c = parseInt(cycles, 10);
        if (!isNaN(c) && c > 0) {
            setAmount(String(baseAmount * c));
        } else {
            setAmount("");
        }
    }, [cycles, baseAmount]);

    // 2. Auto-calculate Next Billing Date
    useEffect(() => {
        if (!nextManual && from) {
            const cycNum = Math.max(1, parseInt(cycles || "1", 10) || 1);
            // Next Date = "Starts on" + (Total Cycles * Months in 1 cycle)
            const d = addMonths(from, cycNum * mo);
            if (d) setNextDate(d);
        }
    }, [from, cycles, mo, nextManual]);

    // 3. For Display/Payload
    const cycNum = Math.max(1, parseInt(cycles || "1", 10) || 1);
    const to = useMemo(() => (from ? addMonths(from, cycNum * mo) : ""), [from, cycNum, mo]);
    const label = periodLabel(from, cycNum, freq);

    const upload = async (file?: File) => {
        if (!file) return;
        setSaving(true);
        const p = await uploadReceipt(file, user);
        setSaving(false);
        if (p) setReceipt(p);
    };

    const save = async () => {
        if (!(Number(amount) > 0)) return toast("Amount received is required.", "info");
        if (!payDate) return toast("Payment Date & Time is required.", "info");
        if (!nextDate) return toast("Next Billing Date could not be calculated.", "info");
        try {
            setSaving(true);
            const res = await api("recordBillingPayment", {
                Client_Code: clientCode,
                Rows: list.map((r) => ({ BE_ID: r.BE_ID, Next_Billing_Date: nextDate })),
                Period_From: from || null,
                Period_To: to || null,
                Period_Label: label,
                Amount: Number(amount),
                Payment_Date: payDate,
                Reference_No: ref,
                Receipt_Image: receipt,
                Remarks: remark,
            });
            if (res?.Status) { toast(res.Message || "Payment recorded"); onSaved(); }
            else toast(res?.Message || "Failed", "error");
        } catch (e: any) {
            toast(e?.response?.data?.Message || "Failed", "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-xl bg-white dark:bg-[#1E293B] shadow-xl border border-[#E2E8F0] dark:border-[#334155]">
                <div className="px-6 pt-5 pb-3 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-[#1E293B] dark:text-white">Record Payment</h2>
                    <button onClick={onClose} className="text-[#64748B] text-xl">✕</button>
                </div>
                <div className="px-6 pb-6 space-y-4">
                    <div className="rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] p-3">
                        <p className="font-bold text-[#1E293B] dark:text-white">{first?.Client_Name}</p>
                        <p className="text-xs text-[#64748B]">
                            {list.map((r) => r.Module_Name).join(", ")}
                        </p>
                        <p className="text-xs text-[#94A3B8]">{clientCode}</p>
                    </div>

                    <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-12 md:col-span-6">
                            <label className={labelCls}>Amount Received (₹) <span className="text-[#EF4444]">*</span></label>
                            <input type="number" min="0" step="0.01" className={inputCls} value={amount} onChange={(e) => setAmount(e.target.value)} />
                        </div>
                        <div className="col-span-12 md:col-span-6">
                            <label className={labelCls}>Payment Date & Time <span className="text-[#EF4444]">*</span></label>
                            <input type="datetime-local" className={inputCls} value={payDate} onChange={(e) => setPayDate(e.target.value)} />
                        </div>
                        
                        <div className="col-span-12 md:col-span-6">
                            <label className={labelCls}>Billing Frequency</label>
                            <select className={inputCls} value={freq} onChange={(e) => { setFreq(e.target.value); setNextManual(false); }}>
                                {Object.entries(FQ).map(([k, v]) => (
                                    <option key={k} value={k}>{v}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-span-12 md:col-span-6">
                            <label className={labelCls}>Billing period paid: starts on</label>
                            <input type="date" className={inputCls} value={from} onChange={(e) => { setFrom(e.target.value); setNextManual(false); }} />
                        </div>
                        
                        <div className="col-span-12 md:col-span-6">
                            <label className={labelCls}>Billing cycles covered</label>
                            <input type="number" min="1" className={inputCls} value={cycles} onChange={(e) => { setCycles(e.target.value); setNextManual(false); }} placeholder="Enter cycles" />
                        </div>
                        <div className="col-span-12 md:col-span-6">
                            <label className={labelCls}>Next Billing Date <span className="text-[#EF4444]">*</span></label>
                            <input 
                                type="date" 
                                className={inputCls} 
                                value={nextDate} 
                                onChange={(e) => {
                                    setNextDate(e.target.value);
                                    setNextManual(true); 
                                }} 
                            />
                        </div>
                        <div className="col-span-12">
                            <label className={labelCls}>Reference No. (leave blank for cash)</label>
                            <input className={inputCls} value={ref} onChange={(e) => setRef(e.target.value)} />
                        </div>
                        <div className="col-span-12">
                            <label className={labelCls}>Remark</label>
                            <input className={inputCls} value={remark} onChange={(e) => setRemark(e.target.value)} />
                        </div>
                        <div className="col-span-12">
                            <label className={labelCls}>Receipt (image)</label>
                            {receipt ? (
                                <div className="flex items-center gap-2">
                                    <img src={FILE_URL + receipt} alt="receipt" className="h-12 rounded border" />
                                    <button onClick={() => setReceipt("")} className="text-xs text-[#B91C1C] font-semibold">Remove</button>
                                </div>
                            ) : (
                                <label className="flex items-center gap-2 h-11 px-3 rounded-lg border border-dashed cursor-pointer">
                                    <span>📷</span><span className="text-sm">Click to upload receipt</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
                                </label>
                            )}
                        </div>
                    </div>

                    <p className="text-yellow  text-[14px]">⚠ Note: If you change any value manually, please also calculate the amount and set the next billing date manually.</p>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="print" onClick={onClose} className="px-6">Cancel</Button>
                        <Button variant="save" onClick={save} className="px-6" disabled={saving}>{saving ? "Saving..." : "Save Payment"}</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecordPaymentModal;