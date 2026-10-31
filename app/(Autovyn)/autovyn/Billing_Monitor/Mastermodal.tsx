"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { API_NAMES, Api, FQ, MOS, inputCls, labelCls, money, noteCls, toast } from "./utils";
import { Master, PModel } from "./Invoice";

const FIXED_MODELS: PModel[] = [
  { Model_Key: "employee", Model_Name: "Per Employee", Unit_Label: "Employee" },
  { Model_Key: "car", Model_Name: "Per Demo Car", Unit_Label: "Demo Car" },
  { Model_Key: "user", Model_Name: "Per User", Unit_Label: "User" },
  { Model_Key: "unit", Model_Name: "Per Unit", Unit_Label: "Unit" },
  { Model_Key: "Call", Model_Name: "Per Api Call", Unit_Label: "Call" },
];

// fixed 5 + API se aaye baaki (duplicate hata kar)
const mergeModels = (apiModels: PModel[]) => {
  const fixedKeys = new Set(FIXED_MODELS.map((m) => m.Model_Key));
  const extras = (apiModels || []).filter((m) => !fixedKeys.has(m.Model_Key));
  return [...FIXED_MODELS, ...extras];
};

interface Props {
  api: Api; kind: "module" | "api"; row?: Master; models: PModel[]; masters: Master[];
  onClose: () => void; onSaved: () => void; reloadModels: () => void;
}

// Code aur Payment Terms (days) input hata diye gaye hain. Active -> Live / Not Live.
const MasterModal = ({ api, kind, row, models, onClose, onSaved, reloadModels }: Props) => {
  const modelOptions = mergeModels(models);
  const isApi = kind === "api";
  const isOther = isApi && !!row && !API_NAMES.includes(row.Name);
  const [apiPick, setApiPick] = useState<string>(row ? (isOther ? "__other" : row.Name) : "");
  const [f, setF] = useState({
    Name: row?.Name || "", Pricing_Model: row?.Pricing_Model || (isApi ? "call" : ""), Unit_Label: row?.Unit_Label || (isApi ? "Call" : ""),
    Min_Qty: row?.Min_Qty ?? 1, Rate: row?.Rate ?? "", Frequency: row?.Frequency || "monthly", GST_Percent: row?.GST_Percent ?? 18,
    SAC_HSN: row?.SAC_HSN || "998314", Description: row?.Description || "", Is_Live: row ? !!row.Is_Live : true,
  } as any);
  const [newPM, setNewPM] = useState({ name: "", unit: "" });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));

  const onModel = (key: string) => {
    if (key === "__new") {
      // naya model add karne par purani Unit_Label hata do
      setF((p: any) => ({ ...p, Pricing_Model: "__new", Unit_Label: "" }));
      return;
    }
    const m = modelOptions.find((x) => x.Model_Key === key);
    setF((p: any) => ({ ...p, Pricing_Model: key, ...(m ? { Unit_Label: m.Unit_Label } : {}) }));
  };

  const save = async () => {
    const name = isApi && apiPick !== "__other" ? apiPick : f.Name.trim();
    if (!name) return toast(`${isApi ? "API" : "Module"} name is required.`, "info");
    if (!f.Pricing_Model) return toast("Please select a pricing model.", "info");
    if (f.Rate === "" || +f.Rate < 0) return toast("Rate is required.", "info");
    const gstPercent = Number(f.GST_Percent);
    if (String(f.GST_Percent).trim() === "" || !Number.isFinite(gstPercent) || gstPercent < 0 || gstPercent > 100)
      return toast("GST % must be a number between 0 and 100.", "info");
    try {
      setSaving(true);
      let pm = f.Pricing_Model, unit = f.Unit_Label;
      if (pm === "__new") {
        if (!newPM.name.trim()) { toast("Enter the new pricing model name.", "info"); return; }
        const r = await api("saveBillingPricingModel", { Model_Name: newPM.name, Unit_Label: newPM.unit });
        if (!r?.Status) { toast(r?.Message || "Could not save pricing model", "error"); return; }
        pm = r.Model_Key; unit = newPM.unit || unit;
        reloadModels();
      }
      const res = await api("saveBillingMaster", {
        formData: { ...f, BMM_ID: row?.BMM_ID, Kind: kind, Name: name, Pricing_Model: pm, Unit_Label: unit || "Unit" },
      });
      if (res?.Status) { toast(res.Message || "Saved"); onSaved(); } else toast(res?.Message || "Save failed", "error");
    } catch (e: any) {
      toast(e?.response?.data?.Message || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const mo = MOS[f.Frequency] || 1;
  const eg = isApi ? `1,000 calls × ${money(f.Rate || 0)} = ${money(1000 * (+f.Rate || 0))} (+ GST ${f.GST_Percent}%)`
    : `${f.Min_Qty || 1} ${f.Unit_Label || "unit"} × ${money(f.Rate || 0)} × ${mo} month(s) = ${money((+f.Min_Qty || 1) * (+f.Rate || 0) * mo)} (+ GST ${f.GST_Percent}%)`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#0F172A]/70 via-[#000000]/60 to-[#0F172A]/70 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-2xl bg-[#FFFFFF] dark:bg-[#1E293B] shadow-2xl ring-1 ring-[#000000]/10 dark:ring-[#FFFFFF]/10 flex flex-col">

        {/* ===== Header ===== */}
        <div className="px-6 py-4 flex justify-between items-start border-b border-[#E2E8F0] dark:border-[#334155] bg-gradient-to-r from-[#FFFFFF] to-[#F8FAFC] dark:from-[#1E293B] dark:to-[#0F172A]">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shrink-0 ${isApi
              ? "bg-gradient-to-br from-[#06B6D4] to-[#3B82F6] shadow-[#06B6D4]/30"
              : "bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] shadow-[#6366F1]/30"
              }`}>
              <span className="text-[#FFFFFF] text-base font-bold">{isApi ? "⚡" : "🧩"}</span>
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-[#1E293B] dark:text-[#FFFFFF] leading-tight truncate">
                {row ? "Edit" : "New"} {isApi ? "Third-Party API" : "Module"}
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                {isApi ? "Configure an API service and its pricing" : "Configure a module and its pricing"}
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
        <div className="px-6 py-5 overflow-y-auto flex-1">

          {/* ═══════════════════════════════════════════
              SECTION: IDENTITY
          ═══════════════════════════════════════════ */}
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#E2E8F0] to-[#E2E8F0] dark:via-[#334155] dark:to-[#334155]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] dark:text-[#64748B]">
              {isApi ? "API Details" : "Module Details"}
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[#E2E8F0] to-[#E2E8F0] dark:via-[#334155] dark:to-[#334155]" />
          </div>

          <div className="grid grid-cols-12 gap-x-4 gap-y-4">
            {isApi ? (
              <>
                <div className="col-span-12 md:col-span-6">
                  <label className={labelCls}>API name <span className="text-[#EF4444]">*</span></label>
                  <select
                    className={inputCls}
                    value={apiPick}
                    onChange={(e) => {
                      setApiPick(e.target.value);
                      if (e.target.value !== "__other") set("Name", e.target.value);
                    }}
                  >
                    <option value="">Select API…</option>
                    {API_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
                    <option value="__other">Other…</option>
                  </select>
                </div>
                {apiPick === "__other" && (
                  <div className="col-span-12 md:col-span-6">
                    <label className={labelCls}>Custom API name <span className="text-[#EF4444]">*</span></label>
                    <input className={inputCls} placeholder="Enter API name" value={f.Name} onChange={(e) => set("Name", e.target.value)} />
                  </div>
                )}
              </>
            ) : (
              <div className="col-span-12">
                <label className={labelCls}>Module name <span className="text-[#EF4444]">*</span></label>
                <input className={inputCls} placeholder="e.g. Attendance Tracking" value={f.Name} onChange={(e) => set("Name", e.target.value)} />
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════
              SECTION: PRICING
          ═══════════════════════════════════════════ */}
          <div className="mt-6 mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#E2E8F0] to-[#E2E8F0] dark:via-[#334155] dark:to-[#334155]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] dark:text-[#64748B]">
              Pricing
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[#E2E8F0] to-[#E2E8F0] dark:via-[#334155] dark:to-[#334155]" />
          </div>

          <div className="grid grid-cols-12 gap-x-4 gap-y-4">
            {/* <div className="col-span-12 md:col-span-6">
              <label className={labelCls}>Pricing model <span className="text-[#EF4444]">*</span></label>
              <select className={inputCls} value={f.Pricing_Model} onChange={(e) => onModel(e.target.value)}>
                <option value="">Select…</option>
                {models.map((m) => <option key={m.Model_Key} value={m.Model_Key}>{m.Model_Name}</option>)}
                <option value="__new">＋ Add new pricing model…</option>
              </select>
            </div> */}

            <div className="col-span-12 md:col-span-6">
              <label className={labelCls}>Pricing model <span className="text-[#EF4444]">*</span></label>
              <select className={inputCls} value={f.Pricing_Model} onChange={(e) => onModel(e.target.value)}>
                <option value="">Select…</option>
                {modelOptions.map((m) => (
                  <option key={m.Model_Key} value={m.Model_Key}>{m.Model_Name}</option>
                ))}
                <option value="__new">＋ Add new pricing model…</option>
              </select>
            </div>

            {f.Pricing_Model === "__new" ? (
              <>
                <div className="col-span-12 md:col-span-3">
                  <label className={labelCls}>New model name <span className="text-[#EF4444]">*</span></label>
                  <input className={inputCls} placeholder="e.g. Per Branch" value={newPM.name} onChange={(e) => setNewPM({ ...newPM, name: e.target.value })} />
                </div>
                <div className="col-span-12 md:col-span-3">
                  <label className={labelCls}>Unit label</label>
                  <input className={inputCls} placeholder="e.g. Branch" value={newPM.unit} onChange={(e) => setNewPM({ ...newPM, unit: e.target.value })} />
                </div>
              </>
            ) : (
              <div className="col-span-12 md:col-span-6">
                <label className={labelCls}>Unit label</label>
                <input className={inputCls} placeholder="e.g. Call, User, Branch" value={f.Unit_Label} onChange={(e) => set("Unit_Label", e.target.value)} />
              </div>
            )}

            {/* {!isApi && (
              <div className="col-span-12 md:col-span-4">
                <label className={labelCls}>Minimum units</label>
                <input type="number" min="1" className={inputCls} value={f.Min_Qty} onChange={(e) => set("Min_Qty", e.target.value)} />
                 <p className="text-[10px] text-[#B45309] mt-1">Enter the minimum number of units required for a dealer to be eligible for this module.</p>
              </div>
            )} */}

            
              <div className="col-span-12 md:col-span-6">
                <label className={labelCls}>Minimum units</label>
                <input type="number" min="1" className={inputCls} value={f.Min_Qty} onChange={(e) => set("Min_Qty", e.target.value)} />
                 <p className="text-[10px] text-[#B45309] mt-1">Enter the minimum number of units required for a dealer to be eligible for this module.</p>
              </div>
            
            <div className={`col-span-12 ${isApi ? "md:col-span-6" : "md:col-span-6"}`}>
              <label className={labelCls}>Rate per unit per month (₹) <span className="text-[#EF4444]">*</span></label>
              <input type="number" min="0" step="0.0001" className={inputCls} placeholder="0.00" value={f.Rate} onChange={(e) => set("Rate", e.target.value)} />
            </div>
            {/* <div className={`col-span-12 ${isApi ? "md:col-span-6" : "md:col-span-4"}`}>
              <label className={labelCls}>Billing frequency</label>
              <select className={inputCls} value={f.Frequency} onChange={(e) => set("Frequency", e.target.value)}>
                {Object.entries(FQ).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div> */}
          </div>

          {/* ═══════════════════════════════════════════
              SECTION: TAX & COMPLIANCE
          ═══════════════════════════════════════════ */}
          <div className="mt-6 mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#E2E8F0] to-[#E2E8F0] dark:via-[#334155] dark:to-[#334155]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] dark:text-[#64748B]">
              Tax &amp; Compliance
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[#E2E8F0] to-[#E2E8F0] dark:via-[#334155] dark:to-[#334155]" />
          </div>

          <div className="grid grid-cols-12 gap-x-4 gap-y-4">
            <div className="col-span-6 md:col-span-3">
              <label className={labelCls}>GST % <span className="text-[#EF4444]">*</span></label>
              <input type="number" min="0" max="100" className={inputCls} value={f.GST_Percent} onChange={(e) => set("GST_Percent", e.target.value)} />
            </div>
            <div className="col-span-6 md:col-span-3">
              <label className={labelCls}>SAC / HSN</label>
              <input className={inputCls} value={f.SAC_HSN} onChange={(e) => set("SAC_HSN", e.target.value)} />
            </div>
            <div className="col-span-12 md:col-span-6">
              <label className={labelCls}>Status</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => set("Is_Live", true)}
                  className={`h-10 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${f.Is_Live
                    ? "bg-[#16A34A] text-[#FFFFFF] shadow-md shadow-[#16A34A]/30"
                    : "bg-[#F1F5F9] dark:bg-[#0F172A] text-[#64748B] dark:text-[#94A3B8] hover:bg-[#E2E8F0] dark:hover:bg-[#334155]"
                    }`}
                >
                  ● Live
                </button>
                <button
                  type="button"
                  onClick={() => set("Is_Live", false)}
                  className={`h-10 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${!f.Is_Live
                    ? "bg-[#DC2626] text-[#FFFFFF] shadow-md shadow-[#DC2626]/30"
                    : "bg-[#F1F5F9] dark:bg-[#0F172A] text-[#64748B] dark:text-[#94A3B8] hover:bg-[#E2E8F0] dark:hover:bg-[#334155]"
                    }`}
                >
                  ○ Not Live
                </button>
              </div>
            </div>
            <div className="col-span-12">
              <label className={labelCls}>Description</label>
              <input className={inputCls} placeholder="Optional notes about this item" value={f.Description} onChange={(e) => set("Description", e.target.value)} />
            </div>
          </div>

          {/* {<p className={`${noteCls} mt-3`}>Example: {eg}. Only <b>Live</b> items can be chosen when adding a service to a company.</p>} */}
        </div>

        {/* ===== Footer ===== */}
        <div className="px-6 py-4 flex justify-end gap-3 border-t border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A]">
          <Button variant="print" onClick={onClose} className="px-6">Cancel</Button>
          <Button variant="save" onClick={save} className="px-6 min-w-[110px]" disabled={saving}>
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
  );
};

export default MasterModal;