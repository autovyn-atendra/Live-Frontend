"use client";
import React, { useMemo, useState } from "react";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { Api, CT, EMAIL_RE, FILE_URL, FQ, MOS, addMonths, dmy, inputCls, labelCls, money, nowLocal, r2, toast, uploadReceipt } from "./utils";
import { Entry, Master, PModel, billAmt } from "./Invoice";

const FIXED_MODELS: PModel[] = [
  { Model_Key: "employee", Model_Name: "Per Employee", Unit_Label: "Employee" },
  { Model_Key: "car", Model_Name: "Per Demo Car", Unit_Label: "Demo Car" },
  { Model_Key: "user", Model_Name: "Per User", Unit_Label: "User" },
  { Model_Key: "unit", Model_Name: "Per Unit", Unit_Label: "Unit" },
  { Model_Key: "Call", Model_Name: "Per Api Call", Unit_Label: "Call" },
];

const mergeModels = (apiModels: PModel[]) => {
  const fixedKeys = new Set(FIXED_MODELS.map((m) => m.Model_Key));
  const extras = (apiModels || []).filter((m) => !fixedKeys.has(m.Model_Key));
  return [...FIXED_MODELS, ...extras];
};

interface Props {
  api: Api; user: any; rows: Entry[]; masters: Master[]; models: PModel[]; nextCode: string;
  mode: "new" | "old" | "edit"; row?: Entry; onClose: () => void; onSaved: () => void; reloadModels: () => void;
}

const blankSvc = () => ({
  k: Math.random().toString(36).slice(2), BMM_ID: "" as any, Module_Name: "", Kind: "module", Pricing_Model: "", Unit_Label: "",
  Qty: "" as any, Rate: "" as any, Frequency: "monthly", GST_Percent: "18", SAC_HSN: "", Start_Date: "", Last_Billing_Date: "",
  Next_Billing_Date: "", nextManual: false, newPM: { name: "", unit: "" },
});

// naya Next Billing Date: (Last Billing ya Start) + frequency
const autoNext = (s: any) => {
  const b = s.Last_Billing_Date || s.Start_Date;
  return b ? addMonths(b, MOS[s.Frequency] || 1) : "";
};
const svcAmount = (s: any) => {
  const quantity = Number(s.Qty) || 0;
  const rate = Number(s.Rate) || 0;
  const cycles = s.Kind === "api" ? 1 : MOS[s.Frequency] || 1;
  return r2(quantity * rate * cycles * (1 + (Number(s.GST_Percent) || 0) / 100));
};

/* ---------- ek service ke fields ---------- */
const ServiceFields = ({ s, set, masters, models, canRemove, onRemove, editing }: any) => {
  const live = masters.filter((m: Master) => m.Is_Live || m.BMM_ID === +s.BMM_ID);
  const modelOptions = mergeModels(models);
  // const upd = (p: any) =>
  //   set((cur: any) => {
  //     const n = { ...cur, ...p };
  //     if (!n.nextManual && ("Start_Date" in p || "Last_Billing_Date" in p || "Frequency" in p)) n.Next_Billing_Date = autoNext(n);
  //     return n;
  //   });
  const upd = (p: any) => set((cur: any) => ({ ...cur, ...p }));
  const pick = (id: string) => {
    const m = masters.find((x: Master) => String(x.BMM_ID) === id);
    if (!m) return upd({ BMM_ID: "", Module_Name: "" });
    upd({
      BMM_ID: m.BMM_ID, Module_Name: m.Name, Kind: m.Kind, Pricing_Model: m.Pricing_Model, Unit_Label: m.Unit_Label,
      Qty: m.Min_Qty || 1, Rate: m.Rate, Frequency: m.Frequency, GST_Percent: String(m.GST_Percent), SAC_HSN: m.SAC_HSN || "",
    });
  };
  const api = s.Kind === "api";
  return (
    <div className="rounded-lg border border-[#E2E8F0] dark:border-[#334155] p-4 bg-[#F8FAFC] dark:bg-[#0F172A] grid grid-cols-12 gap-3">
      <div className="col-span-12 flex items-center justify-between">
        <p className="text-sm font-semibold text-[#334155] dark:text-white">{editing ? "Module" : "Module details"}</p>
        {canRemove && <button type="button" onClick={onRemove} className="text-xs font-semibold text-[#B91C1C]">✕ Remove</button>}
      </div>
      <div className="col-span-12">
        <label className={labelCls}>Module / Third-Party API <span className="text-[#EF4444]">*</span></label>
        <select className={inputCls} value={s.BMM_ID || ""} onChange={(e) => pick(e.target.value)}>
          <option value="">{editing && s.Module_Name && !s.BMM_ID ? s.Module_Name : "Select module…"}</option>
          <optgroup label="Modules">
            {live.filter((m: Master) => m.Kind === "module").map((m: Master) => <option key={m.BMM_ID} value={m.BMM_ID}>{m.Name}</option>)}
          </optgroup>
          <optgroup label="Third-Party APIs">
            {live.filter((m: Master) => m.Kind === "api").map((m: Master) => <option key={m.BMM_ID} value={m.BMM_ID}>{m.Name}</option>)}
          </optgroup>
        </select>
        {!masters.length && <p className="text-xs text-[#B45309] mt-1">No module found. Add a Module / API in the Masters tab first.</p>}
      </div>

      {/* <div className="col-span-12 md:col-span-6">
        <label className={labelCls}>Pricing model <span className="text-[#EF4444]">*</span></label>
        <select className={inputCls} value={s.Pricing_Model} onChange={(e) => {
          const m = models.find((x: PModel) => x.Model_Key === e.target.value);
          upd({ Pricing_Model: e.target.value, ...(m ? { Unit_Label: m.Unit_Label } : {}) });
        }}>
          <option value="">Select…</option>
          {models.map((m: PModel) => <option key={m.Model_Key} value={m.Model_Key}>{m.Model_Name}</option>)}
          <option value="__new">＋ Add new pricing model…</option>
        </select>
      </div> */}
      <div className="col-span-12 md:col-span-6">
        <label className={labelCls}>Pricing model</label>
        <select
          className={inputCls}
          value={s.Pricing_Model}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "__new") {
              // naya model add karne par purani Unit_Label hata do
              upd({ Pricing_Model: "__new", Unit_Label: "" });
              return;
            }
            const m = modelOptions.find((x: PModel) => x.Model_Key === v);
            upd({ Pricing_Model: v, ...(m ? { Unit_Label: m.Unit_Label } : {}) });
          }}
        >
          <option value="">Select…</option>
          {modelOptions.map((m: PModel) => (
            <option key={m.Model_Key} value={m.Model_Key}>{m.Model_Name}</option>
          ))}
          <option value="__new">＋ Add new pricing model…</option>
        </select>
      </div>
      {s.Pricing_Model === "__new" && (
        <>
          <div className="col-span-12 md:col-span-6">
            <label className={labelCls}>New model name <span className="text-[#EF4444]">*</span></label>
            <input className={inputCls} placeholder="e.g. Per Branch" value={s.newPM.name} onChange={(e) => upd({ newPM: { ...s.newPM, name: e.target.value } })} />
          </div>
          <div className="col-span-12 md:col-span-6">
            <label className={labelCls}>Unit label</label>
            <input className={inputCls} placeholder="e.g. Branch" value={s.newPM.unit} onChange={(e) => upd({ newPM: { ...s.newPM, unit: e.target.value } })} />
          </div>
        </>
      )}
      {/* <div className="col-span-6 md:col-span-6">
        <label className={labelCls}>{api ? "Usage (billed on invoice)" : `${s.Unit_Label || "Minimum"} (qty) `}</label>
        <input type="number" min="0" className={inputCls} disabled={api} value={s.Qty} onChange={(e) => upd({ Qty: e.target.value })} />
        <p className="text-[10px] text-[#B45309] mt-1">Enter the minimum number of units required for a dealer to be eligible for this module.</p>
      </div> */}
      {/* ===== Unit Label + Minimum (qty) ===== */}
      {s.Pricing_Model !== "__new" && (
        <div className="col-span-6 md:col-span-3">
          <label className={labelCls}>Unit Label</label>
          <input
            type="text"
            className={inputCls}
            // disabled={api}
            value={s.Unit_Label || ""}
            placeholder="e.g. Employee"
            onChange={(e) => upd({ Unit_Label: e.target.value })}
          />
        </div>)}
      <div className="col-span-6 md:col-span-3">
        <label className={labelCls}>{api ? "Minimum (qty)" : "Minimum (qty)"}{!api && <> <span className="text-[#EF4444]">*</span></>}</label>
        <input
          type="number"
          min="0"
          className={inputCls}
          // disabled={api}
          value={s.Qty}
          placeholder="0"
          onChange={(e) => upd({ Qty: e.target.value })}
        />
        <p className="text-[10px] text-[#B45309] mt-1">Enter the minimum number of units required for a dealer to be eligible for this module.</p>
      </div>
      <div className="col-span-6 md:col-span-3">
        <label className={labelCls}>Rate (₹) <span className="text-[#EF4444]">*</span></label>
        <input placeholder="0.00" type="number" min="0" step="0.0001" className={inputCls} value={s.Rate} onChange={(e) => upd({ Rate: e.target.value })} />
      </div>
      <div className="col-span-6 md:col-span-3">
        <label className={labelCls}>Billing frequency</label>
        <select className={inputCls} value={s.Frequency} onChange={(e) => upd({ Frequency: e.target.value })}>
          {Object.entries(FQ).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div className="col-span-6 md:col-span-3">
        <label className={labelCls}>GST % <span className="text-[#EF4444]">*</span></label>
        <input type="number" min="0" max="100" className={inputCls} value={s.GST_Percent} onChange={(e) => upd({ GST_Percent: e.target.value })} />
      </div>
      <div className="col-span-12 md:col-span-3">
        <label className={labelCls}>SAC / HSN</label>
        <input className={inputCls} value={s.SAC_HSN} onChange={(e) => upd({ SAC_HSN: e.target.value })} />
      </div>
      <div className="col-span-12 md:col-span-4">
        <label className={labelCls}>Joining Date <span className="text-[#EF4444]">*</span></label>
        <input type="date" className={inputCls} value={s.Start_Date} onChange={(e) => upd({ Start_Date: e.target.value })} />
      </div>
      <div className="col-span-12 md:col-span-4">
        <label className={labelCls}>Last Billing Date</label>
        <input type="date" className={inputCls} value={s.Last_Billing_Date} onChange={(e) => upd({ Last_Billing_Date: e.target.value })} />
      </div>
      <div className="col-span-12 md:col-span-4">
        <label className={labelCls}>Next Billing Date <span className="text-[#EF4444]">*</span></label>
        <input type="date" className={inputCls} value={s.Next_Billing_Date} onChange={(e) => upd({ Next_Billing_Date: e.target.value, nextManual: true })} />
      </div>
      {/* <p className="col-span-12 text-xs text-[#64748B] dark:text-[#94A3B8]">
        {api ? "API usage is entered on the invoice (usage lines). Next billing date follows the frequency."
          : `Bill per cycle (incl. GST): ${money(svcAmount(s))}. Next Billing Date is filled automatically from Last Billing / Start Date; you can still change it.`}
      </p> */}
    </div>
  );
};

/* ---------- main modal ---------- */
const EntryModal = ({ api, user, rows, masters, models, nextCode, mode, row, onClose, onSaved, reloadModels, onSwitch }: Props) => {
  const isEdit = mode === "edit";
  const [saving, setSaving] = useState(false);
  const [co, setCo] = useState<any>({
    Client_Name: row?.Client_Name || "", Contact_Person: row?.Contact_Person || "", Mobile_No: row?.Mobile_No || "",
    Email: row?.Email || "", CC_Email: row?.CC_Email || "", Billing_Address: row?.Billing_Address || "", GSTIN: row?.GSTIN || "",
    Company_Type: row?.Company_Type || "user", Invoice_Type: row?.Invoice_Type || "pre",
  });
  const [code, setCode] = useState(row?.Client_Code || "");
  const [remarks, setRemarks] = useState(row?.Remarks || "");
  const [svcs, setSvcs] = useState<any[]>(
    isEdit && row
      ? [{
        ...blankSvc(), BMM_ID: row.BMM_ID || "", Module_Name: row.Module_Name, Kind: row.Kind, Pricing_Model: row.Pricing_Model || "", Unit_Label: row.Unit_Label || "",
        Qty: row.Qty ?? "", Rate: row.Rate ?? "", Frequency: row.Frequency || "monthly", GST_Percent: String(row.GST_Percent ?? 18), SAC_HSN: row.SAC_HSN || "",
        Start_Date: row.Start_Date || "", Last_Billing_Date: row.Last_Billing_Date || "", Next_Billing_Date: row.Next_Billing_Date || "", nextManual: true
      }]
      : [blankSvc()]
  );
  // edit: status / payment
  const [status, setStatus] = useState<"Paid" | "Due">(row?.Status || "Due");
  const [pay, setPay] = useState({
    Amount_Paid: row?.Amount_Paid ?? "", Payment_Date: row?.Payment_Date || nowLocal(), Reference_No: row?.Reference_No || "", Receipt_Image: row?.Receipt_Image || "",
  });
  const [due, setDue] = useState<any>(row ? billAmt(row) || "" : "");
  const [roll, setRoll] = useState(true);

  // existing company search (mode old)
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState(false);
  const companies = useMemo(() => {
    const m = new Map<string, Entry>();
    rows.forEach((r) => { if (!m.has(r.Client_Code)) m.set(r.Client_Code, r); });
    return [...m.values()];
  }, [rows]);
  const suggestions = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t || picked) return [];
    return companies.filter((c) => [c.Client_Name, c.Client_Code, c.Mobile_No].some((x) => String(x || "").toLowerCase().includes(t))).slice(0, 8);
  }, [q, picked, companies]);
  const pickCompany = (c: Entry) => {
    setPicked(true); setQ(c.Client_Name); setCode(c.Client_Code);
    setCo({ Client_Name: c.Client_Name, Contact_Person: c.Contact_Person, Mobile_No: c.Mobile_No, Email: c.Email || "", CC_Email: c.CC_Email || "", Billing_Address: c.Billing_Address || "", GSTIN: c.GSTIN || "", Company_Type: c.Company_Type || "user", Invoice_Type: c.Invoice_Type || "pre" });
  };

  const setSvc = (i: number) => (fn: any) => setSvcs((p) => p.map((x, j) => (j === i ? (typeof fn === "function" ? fn(x) : { ...x, ...fn }) : x)));
  const cset = (k: string, v: any) => setCo((p: any) => ({ ...p, [k]: v }));

  // naye pricing model (agar user ne add kiya) -> pehle save karo
  const resolveModels = async (list: any[]) => {
    const out: any[] = [];
    let created = false;
    for (const s of list) {
      if (s.Pricing_Model === "__new") {
        if (!s.newPM.name.trim()) throw new Error("Enter the new pricing model name.");
        const r = await api("saveBillingPricingModel", { Model_Name: s.newPM.name, Unit_Label: s.newPM.unit });
        if (!r?.Status) throw new Error(r?.Message || "Could not save pricing model");
        out.push({ ...s, Pricing_Model: r.Model_Key, Unit_Label: s.newPM.unit || s.Unit_Label });
        created = true;
      } else out.push(s);
    }
    if (created) reloadModels();
    return out;
  };

  const validate = () => {
    if (mode === "old" && !code) return "Please search and select an existing company.";
    if (!co.Client_Name.trim()) return "Company Name is mandatory.";
    if (!co.Contact_Person.trim()) return "Contact Person Name is mandatory.";
    if (!/^\d{10}$/.test(co.Mobile_No)) return "Mobile No. must be 10 digits.";
    if (co.Email && !EMAIL_RE.test(co.Email.trim())) return "Email is not valid.";
    if (!co.GSTIN.trim()) return "GSTIN is mandatory.";
    if (!/^[0-9A-Z]{15}$/i.test(co.GSTIN.trim())) return "GSTIN must be 15 characters.";
    for (let i = 0; i < svcs.length; i++) {
      const s = svcs[i], p = svcs.length > 1 ? `Service ${i + 1}: ` : "";
      if (!s.Module_Name) return p + "please select a Module";
      if (!s.Pricing_Model) return p + "please select a pricing model.";
      if (!s.Start_Date) return p + "Start Date is mandatory.";
      if (!s.Next_Billing_Date) return p + "Next Billing Date is mandatory.";
      if (s.Kind !== "api" && !(+s.Qty > 0)) return p + "quantity is required.";
      if (!(+s.Rate >= 0) || s.Rate === "") return p + "rate is required.";
      const gstPercent = Number(s.GST_Percent);
      if (String(s.GST_Percent).trim() === "" || !Number.isFinite(gstPercent) || gstPercent < 0 || gstPercent > 100)
        return p + "GST % must be a number between 0 and 100.";
    }
    if (isEdit && status === "Paid") {
      if (!(+pay.Amount_Paid > 0)) return "Amount Paid is mandatory when Status is Paid.";
      if (!pay.Payment_Date) return "Payment Date & Time is mandatory when Status is Paid.";
    }
    return "";
  };

  const save = async () => {
    const bad = validate();
    if (bad) return toast(bad, "info");
    try {
      setSaving(true);
      const list = await resolveModels(svcs);
      if (isEdit && row) {
        const s = list[0];
        const res = await api("updateBillingEntry", {
          Roll: roll && status === "Paid" && row.Status !== "Paid",
          formData: { ...co, BE_ID: row.BE_ID, ...s, Status: status, Remarks: remarks, ...pay, Amount_Due: status === "Due" ? +due || svcAmount(s) || null : null },
        });
        res?.Status ? (toast(res.Message), onSaved()) : toast(res?.Message || "Save failed", "error");
        return;
      }
      let useMode: "new" | "old" = mode as any, useCode = code;
      if (mode === "new") {
        const dup = companies.find((c) => c.Client_Name.trim().toLowerCase() === co.Client_Name.trim().toLowerCase() && c.Mobile_No === co.Mobile_No.trim());
        if (dup) {
          setSaving(false);
          const c = await Swal.fire({
            icon: "question", title: "Company already exists!", showCancelButton: true, reverseButtons: true, allowOutsideClick: false,
            html: `<div style="text-align:left;font-size:14px"><p>A company with the same <b>Name</b> and <b>Mobile No.</b> exists:</p><p style="margin-top:8px"><b>${dup.Client_Name}</b><br/><span style="color:#64748B">ID: ${dup.Client_Code}</span></p><p style="margin-top:8px">Add these Module to the existing company?</p></div>`,
            confirmButtonText: "Yes, add to existing", cancelButtonText: "Cancel", confirmButtonColor: "#16A34A", cancelButtonColor: "#64748B",
          });
          if (!c.isConfirmed) return;
          useMode = "old"; useCode = dup.Client_Code;
          setSaving(true);
        }
      }
      const res = await api("saveBillingEntries", {
        Mode: useMode, Client_Code: useCode, Company: co, Remarks: remarks,
        Services: list.map((s) => ({ ...s, Amount_Due: svcAmount(s) || null })),
      });
      res?.Status ? (toast(res.Message), onSaved()) : toast(res?.Message || "Save failed", "error");
    } catch (e: any) {
      toast(e?.message || e?.response?.data?.Message || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const onReceipt = async (file?: File) => {
    if (!file) return;
    setSaving(true);
    const p = await uploadReceipt(file, user);
    setSaving(false);
    if (p) { setPay((x) => ({ ...x, Receipt_Image: p })); toast("Receipt uploaded"); }
  };

  // const title = isEdit ? "Edit Entry" : mode === "old" ? "Existing Company, New Service" : "New Company";
  const title = isEdit ? "Edit Entry" : "Add Company";
  const lock = mode === "old" && !picked;

  // ✅ Duplicate company check on blur (mode = "new" only)
  const checkDuplicateCompany = async () => {
    if (mode !== "new") return;
    const name = co.Client_Name.trim();
    if (!name) return;

    // Same name + same mobile wali company dhundo
    const dup = companies.find(
      (c) =>
        c.Client_Name.trim().toLowerCase() === name.toLowerCase()
        // String(c.Mobile_No || "").trim() === String(co.Mobile_No || "").trim()
    );

    if (!dup) return;

    const result = await Swal.fire({
      icon: "warning",
      title: "Company Already Exists!",
      html: `
      <div style="text-align:left;font-size:14px;line-height:1.6">
        <p>A company with the same <b>Name</b> and <b>Mobile No.</b> already exists in the system:</p>
        <div style="margin-top:10px;padding:10px;background:#F8FAFC;border-left:3px solid #6366F1;border-radius:6px">
          <p style="margin:0;font-weight:700;color:#1E293B">${dup.Client_Name}</p>
          <p style="margin:4px 0 0;color:#64748B;font-size:13px">ID: <b>${dup.Client_Code}</b> · Mobile: ${dup.Mobile_No}</p>
        </div>
        <p style="margin-top:12px">Please use the <b>Existing Company</b> form to add a new module to this company.</p>
      </div>
    `,
      showCancelButton: true,
      confirmButtonText: "Go to Existing Company",
      cancelButtonText: "Stay here",
      confirmButtonColor: "#6366F1",
      cancelButtonColor: "#64748B",
      reverseButtons: true,
      allowOutsideClick: false,
    });

    if (result.isConfirmed && onSwitch) {
      // Existing Company mode pe switch karo aur company auto-select karo
      onSwitch("old");
      // Thoda delay taaki mode switch ho jaye, phir company pick karo
      setTimeout(() => {
        pickCompany(dup);
        setQ(dup.Client_Name);
      }, 100);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#0F172A]/70 via-[#000000]/60 to-[#0F172A]/70 backdrop-blur-md p-4">
      <div className="w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-2xl bg-[#FFFFFF] dark:bg-[#1E293B] shadow-2xl ring-1 ring-[#000000]/10 dark:ring-[#FFFFFF]/10 flex flex-col">

        {/* ===== Header ===== */}
        <div className="px-6 py-4 flex justify-between items-center border-b border-[#E2E8F0] dark:border-[#334155] bg-gradient-to-r from-[#FFFFFF] to-[#F8FAFC] dark:from-[#1E293B] dark:to-[#0F172A]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#6366F1]/30">
              <span className="text-[#FFFFFF] text-lg font-bold">{isEdit ? "✎" : "＋"}</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1E293B] dark:text-[#FFFFFF] leading-tight">{title}</h2>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                {isEdit ? "Update company & Module details" : "Fill in the details below"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9] dark:text-[#94A3B8] dark:hover:text-[#FFFFFF] dark:hover:bg-[#334155] transition-all text-lg"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* ===== Body ===== */}
        <div className="px-6 py-5 overflow-y-auto flex-1">

          {/* ═══════════════════════════════════════════
          MODE SWITCH — CLEARLY VISIBLE BUTTONS
      ═══════════════════════════════════════════ */}
          {!isEdit && onSwitch && (
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] dark:text-[#64748B] mb-2">
                Choose mode
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* NEW COMPANY BUTTON */}
                <button
                  type="button"
                  onClick={() => onSwitch("new")}
                  className={`group relative flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all duration-200 text-left ${mode === "new"
                    ? "bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] border-[#6366F1] text-[#FFFFFF] shadow-lg shadow-[#6366F1]/30 scale-[1.02]"
                    : "bg-[#FFFFFF] dark:bg-[#1E293B] border-[#E2E8F0] dark:border-[#334155] text-[#334155] dark:text-[#E2E8F0] hover:border-[#818CF8] hover:shadow-md"
                    }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg font-bold shrink-0 ${mode === "new"
                    ? "bg-[#FFFFFF]/20 text-[#FFFFFF]"
                    : "bg-[#EEF2FF] dark:bg-[#6366F1]/20 text-[#6366F1] dark:text-[#818CF8]"
                    }`}>
                    ＋
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold leading-tight">New Company</p>
                    <p className={`text-xs mt-0.5 truncate ${mode === "new" ? "text-[#FFFFFF]/80" : "text-[#64748B] dark:text-[#94A3B8]"
                      }`}>
                      Register a fresh client
                    </p>
                  </div>
                  {mode === "new" && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#FFFFFF] animate-pulse" />
                  )}
                </button>

                {/* EXISTING COMPANY BUTTON */}
                <button
                  type="button"
                  onClick={() => onSwitch("old")}
                  className={`group relative flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all duration-200 text-left ${mode === "old"
                    ? "bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] border-[#6366F1] text-[#FFFFFF] shadow-lg shadow-[#6366F1]/30 scale-[1.02]"
                    : "bg-[#FFFFFF] dark:bg-[#1E293B] border-[#E2E8F0] dark:border-[#334155] text-[#334155] dark:text-[#E2E8F0] hover:border-[#818CF8] hover:shadow-md"
                    }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg font-bold shrink-0 ${mode === "old"
                    ? "bg-[#FFFFFF]/20 text-[#FFFFFF]"
                    : "bg-[#EEF2FF] dark:bg-[#6366F1]/20 text-[#6366F1] dark:text-[#818CF8]"
                    }`}>
                    🔗
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold leading-tight">Existing Company</p>
                    <p className={`text-xs mt-0.5 truncate ${mode === "old" ? "text-[#FFFFFF]/80" : "text-[#64748B] dark:text-[#94A3B8]"
                      }`}>
                      Add a new module
                    </p>
                  </div>
                  {mode === "old" && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#FFFFFF] animate-pulse" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════
          SEARCH EXISTING COMPANY
      ═══════════════════════════════════════════ */}
          {mode === "old" && (
            <div className="mb-5 relative">
              <label className={labelCls}>Search company <span className="text-[#EF4444]">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] text-sm">🔍</span>
                <input
                  className={`${inputCls} pl-9`}
                  placeholder="Type company name, ID or mobile"
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    if (picked) { setPicked(false); setCode(""); }
                  }}
                />
              </div>
              {suggestions.length > 0 && (
                <ul className="absolute z-20 mt-1.5 w-full max-h-56 overflow-y-auto rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#FFFFFF] dark:bg-[#1E293B] shadow-xl py-1">
                  {suggestions.map((c) => (
                    <li
                      key={c.Client_Code}
                      onClick={() => pickCompany(c)}
                      className="px-3 py-2.5 text-sm cursor-pointer hover:bg-[#F8FAFC] dark:hover:bg-[#334155] text-[#334155] dark:text-[#FFFFFF] flex items-center justify-between gap-2"
                    >
                      <span className="font-medium truncate">{c.Client_Name}</span>
                      <span className="text-xs text-[#94A3B8] whitespace-nowrap">
                        ({c.Client_Code}) · {c.Mobile_No}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {picked && (
                <div className="mt-2 flex items-center gap-2 text-sm text-[#15803D] dark:text-[#4ADE80] bg-[#F0FDF4] dark:bg-[#16A34A]/20 border border-[#BBF7D0] dark:border-[#166534] rounded-lg px-3 py-2">
                  <span>✓</span>
                  <span>Selected: <b>{co.Client_Name}</b> ({code}). Now enter the new Module details.</span>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════
          SECTION: COMPANY INFO
      ═══════════════════════════════════════════ */}
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#E2E8F0] to-[#E2E8F0] dark:via-[#334155] dark:to-[#334155]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] dark:text-[#64748B]">
              Company Info
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[#E2E8F0] to-[#E2E8F0] dark:via-[#334155] dark:to-[#334155]" />
          </div>

          {/* ═══════════════════════════════════════════
          FORM GRID — PERFECTLY ALIGNED INLINE INPUTS
      ═══════════════════════════════════════════ */}
          <div className="grid grid-cols-12 gap-x-4 gap-y-4">

            {/* Company Name + ID */}
            <div className={`${mode === "old" ? "col-span-12" : "col-span-12 md:col-span-8"}`}>
              <label className={labelCls}>Company Name <span className="text-[#EF4444]">*</span></label>
              <input
                placeholder="Enter company name"
                className={inputCls}
                value={co.Client_Name}
                onChange={(e) => cset("Client_Name", e.target.value)}
                onBlur={checkDuplicateCompany}   // ✅ ADD THIS
              />
            </div>
            {mode !== "old" && (
              <div className="col-span-12 md:col-span-4">
                <label className={labelCls}>{isEdit ? "Company ID" : "Next Company ID"}</label>
                <input
                  className={`${inputCls} bg-[#F8FAFC] dark:bg-[#0F172A] text-[#64748B] cursor-not-allowed`}
                  disabled
                  value={isEdit ? code : nextCode}
                  readOnly
                />
              </div>
            )}

            {/* Contact + Mobile */}
            <div className="col-span-12 md:col-span-6">
              <label className={labelCls}>Contact Person Name <span className="text-[#EF4444]">*</span></label>
              <input placeholder="Enter contact person name" className={inputCls} value={co.Contact_Person} onChange={(e) => cset("Contact_Person", e.target.value)} />
            </div>
            <div className="col-span-12 md:col-span-6">
              <label className={labelCls}>Mobile No. <span className="text-[#EF4444]">*</span></label>
              <input
                className={inputCls}
                inputMode="numeric"
                maxLength={10}
                placeholder="10 digit"
                value={co.Mobile_No}
                onChange={(e) => cset("Mobile_No", e.target.value.replace(/\D/g, ""))}
              />
            </div>

            {/* Emails */}
            <div className="col-span-12 md:col-span-6">
              <label className={labelCls}>Email (To)</label>
              <input
                type="email"
                className={inputCls}
                placeholder="name@company.com"
                value={co.Email}
                onChange={(e) => cset("Email", e.target.value)}
              />
            </div>
            <div className="col-span-12 md:col-span-6">
              <label className={labelCls}>Email (CC)</label>
              <input
                className={inputCls}
                placeholder="name@company.com"
                value={co.CC_Email}
                onChange={(e) => cset("CC_Email", e.target.value)}
              />
            </div>

            {/* Billing Address */}
            <div className="col-span-12">
              <label className={labelCls}>Billing Address</label>
              <input
                className={inputCls}
                placeholder="Street, City, State, Pincode"
                value={co.Billing_Address}
                onChange={(e) => cset("Billing_Address", e.target.value)}
              />
            </div>

            {/* GSTIN + Company Type + Invoice Type — 3 INLINE */}
            <div className="col-span-12 md:col-span-4">
              <label className={labelCls}>GSTIN <span className="text-[#EF4444]">*</span></label>
              <input
                className={`${inputCls} uppercase`}
                maxLength={15}
                placeholder="22AAAAA0000A1Z5"
                value={co.GSTIN}
                onChange={(e) => cset("GSTIN", e.target.value.toUpperCase())}
              />
            </div>
            <div className="col-span-6 md:col-span-4">
              <label className={labelCls}>Company Type</label>
              <select className={inputCls} value={co.Company_Type} onChange={(e) => cset("Company_Type", e.target.value)}>
                {Object.entries(CT).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="col-span-6 md:col-span-4">
              <label className={labelCls}>Invoice Type</label>
              <select className={inputCls} value={co.Invoice_Type} onChange={(e) => cset("Invoice_Type", e.target.value)}>
                <option value="pre">Pre Invoice</option>
                <option value="tax">Tax Invoice</option>
              </select>
            </div>
          </div>

          {/* ═══════════════════════════════════════════
          SECTION: Module
      ═══════════════════════════════════════════ */}
          <div className="mt-6 mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#E2E8F0] to-[#E2E8F0] dark:via-[#334155] dark:to-[#334155]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] dark:text-[#64748B]">
              Module {svcs.length > 1 && <span className="text-[#6366F1]">({svcs.length})</span>}
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[#E2E8F0] to-[#E2E8F0] dark:via-[#334155] dark:to-[#334155]" />
          </div>

          <div className="space-y-3">
            {svcs.map((s, i) => (
              <div
                key={s.k}
                className="rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC]/60 dark:bg-[#0F172A]/40 p-4 relative"
              >
                {svcs.length > 1 && (
                  <span className="absolute -top-2.5 left-3 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#4F46E5] bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#C7D2FE] dark:border-[#4338CA] rounded-full">
                    Module {i + 1}
                  </span>
                )}
                <ServiceFields
                  s={s}
                  set={setSvc(i)}
                  masters={masters}
                  models={models}
                  editing={isEdit}
                  canRemove={!isEdit && svcs.length > 1}
                  onRemove={() => setSvcs((p) => p.filter((_, j) => j !== i))}
                />
              </div>
            ))}


            <button
              type="button"
              onClick={() => setSvcs((p) => [...p, blankSvc()])}
              className="w-full h-11 rounded-xl border-2 border-dashed border-[#CBD5E1] dark:border-[#475569] text-sm font-semibold text-[#4F46E5] dark:text-[#818CF8] hover:border-[#6366F1] hover:bg-[#EEF2FF] dark:hover:bg-[#6366F1]/10 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <span className="text-lg">＋</span> Add another Module
            </button>

          </div>

          <>
            <div className="mt-6 mb-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#E2E8F0] to-[#E2E8F0] dark:via-[#334155] dark:to-[#334155]" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] dark:text-[#64748B]">
                Payment Status
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[#E2E8F0] to-[#E2E8F0] dark:via-[#334155] dark:to-[#334155]" />
            </div>

            <div className="grid grid-cols-12 gap-x-4 gap-y-4">
              <div className="col-span-12 md:col-span-6">
                <label className={labelCls}>Status</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus("Paid")}
                    className={`h-10 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${status === "Paid"
                      ? "bg-[#16A34A] text-[#FFFFFF] shadow-md shadow-[#16A34A]/30"
                      : "bg-[#F1F5F9] dark:bg-[#1E293B] text-[#64748B] dark:text-[#94A3B8] hover:bg-[#E2E8F0] dark:hover:bg-[#334155]"
                      }`}
                  >
                    ✓ Paid
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus("Due")}
                    className={`h-10 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${status === "Due"
                      ? "bg-[#DC2626] text-[#FFFFFF] shadow-md shadow-[#DC2626]/30"
                      : "bg-[#F1F5F9] dark:bg-[#1E293B] text-[#64748B] dark:text-[#94A3B8] hover:bg-[#E2E8F0] dark:hover:bg-[#334155]"
                      }`}
                  >
                    ⏱ Due
                  </button>
                </div>
              </div>

              {status === "Due" && (
                <div className="col-span-12 md:col-span-6">
                  <label className={labelCls}>Amount Due (₹, incl. GST)</label>
                  <input
                    type="number"
                    min="0"
                    className={inputCls}
                    value={due}
                    placeholder={String(svcAmount(svcs[0]) || "")}
                    onChange={(e) => setDue(e.target.value)}
                  />
                </div>
              )}

              {status === "Paid" && (
                <div className="col-span-12 rounded-xl border border-[#E2E8F0] dark:border-[#334155] p-4 bg-gradient-to-br from-[#F8FAFC] to-[#FFFFFF] dark:from-[#0F172A] dark:to-[#1E293B]">
                  <p className="text-sm font-bold text-[#334155] dark:text-[#FFFFFF] flex items-center gap-2 mb-3">
                    <span className="w-1 h-4 rounded-full bg-[#16A34A]" /> Payment Details
                  </p>
                  <div className="grid grid-cols-12 gap-x-4 gap-y-4">
                    <div className="col-span-12 md:col-span-6">
                      <label className={labelCls}>Amount Paid (₹) <span className="text-[#EF4444]">*</span></label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className={inputCls}
                        value={pay.Amount_Paid}
                        onChange={(e) => setPay({ ...pay, Amount_Paid: e.target.value })}
                      />
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <label className={labelCls}>Payment Date &amp; Time <span className="text-[#EF4444]">*</span></label>
                      <input
                        type="datetime-local"
                        className={inputCls}
                        value={pay.Payment_Date}
                        onChange={(e) => setPay({ ...pay, Payment_Date: e.target.value })}
                      />
                    </div>
                    <div className="col-span-12">
                      <label className={labelCls}>
                        Reference No. <span className="text-[#94A3B8] font-normal">(leave empty for cash)</span>
                      </label>
                      <input
                        className={inputCls}
                        value={pay.Reference_No}
                        onChange={(e) => setPay({ ...pay, Reference_No: e.target.value })}
                      />
                    </div>
                    <div className="col-span-12">
                      <label className={labelCls}>Receipt (image)</label>
                      {!pay.Receipt_Image ? (
                        <label className="flex items-center gap-3 h-14 px-4 rounded-xl border-2 border-dashed border-[#CBD5E1] dark:border-[#475569] bg-[#FFFFFF] dark:bg-[#1E293B] cursor-pointer hover:border-[#6366F1] hover:bg-[#EEF2FF] dark:hover:bg-[#6366F1]/10 transition-all">
                          <span className="text-xl">📷</span>
                          <div>
                            <p className="text-sm font-medium text-[#334155] dark:text-[#FFFFFF]">Click to upload receipt</p>
                            <p className="text-xs text-[#94A3B8]">PNG, JPG up to 5MB</p>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              onReceipt(e.target.files?.[0]);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      ) : (
                        <div className="flex items-center gap-3 p-3 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#FFFFFF] dark:bg-[#1E293B]">
                          <img
                            src={FILE_URL + pay.Receipt_Image}
                            alt="Receipt"
                            className="w-16 h-16 object-cover rounded-lg border border-[#E2E8F0] dark:border-[#334155] cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => window.open(FILE_URL + pay.Receipt_Image, "_blank")}
                          />
                          <p className="flex-1 text-xs text-[#64748B] truncate">{pay.Receipt_Image}</p>
                          <button
                            type="button"
                            onClick={() => setPay({ ...pay, Receipt_Image: "" })}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#FEE2E2] text-[#B91C1C] hover:bg-[#FECACA] transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>

          <div className="mt-5">
            <label className={labelCls}>Remarks</label>
            <input
              className={inputCls}
              placeholder="Optional notes..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
        </div>

        {/* ===== Footer ===== */}
        <div className="px-6 py-4 flex justify-end gap-3 border-t border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A]">
          <Button variant="print" onClick={onClose} className="px-6">Cancel</Button>
          <Button variant="save" onClick={save} className="px-6 min-w-[110px]" disabled={saving} >
            {saving ? (
              <span className="flex items-center gap-2 justify-center">
                <span className="w-3.5 h-3.5 border-2 border-[#FFFFFF]/30 border-t-[#FFFFFF] rounded-full animate-spin" />
                Saving...
              </span>
            ) : isEdit ? "Update" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EntryModal;