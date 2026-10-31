"use client";
import React, { useMemo, useState } from "react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import Swal from "sweetalert2";
import { FaTasks } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import Ainput from "@/components/atoms/Input";
import CustomSelectSearch from "@/components/atoms/Select";
import { Api, CT, FILE_URL, FQ, dayDiff, dmy, fmtDT, inputCls, money, statusClass, tdCls, thCls, toast, todayYMD } from "./utils";
import { Entry, Master, PModel, billAmt } from "./Invoice";
import EntryModal from "./EntryModal";
import BulkModal from "./BulkModal";
import { downloadBillingSample, parseBillingExcel } from "./billingExcel";
import RecordPaymentModal from "./RecordPaymentModal";
import PaymentHistoryModal from "./PaymentHistoryModal";
import CompaniesModal from "./CompaniesModal";

// Indian financial year start (1 April)
const fyStart = () => {
  const n = new Date();
  const y = n.getMonth() >= 3 ? n.getFullYear() : n.getFullYear() - 1;
  return `${y}-04-01`;
};
const defFilters = () => ({
  mods: [] as string[],
  ctype: "",
  billingMode: "new" as "new" | "last",
  from: fyStart(),
  to: todayYMD(),
});
interface Props {
  api: Api; user: any; rows: Entry[]; loading: boolean; masters: Master[]; models: PModel[];
  reload: () => void; reloadModels: () => void;
  addMode: null | "new" | "old"; onAddDone: () => void; onSwitchAdd: (m: "new" | "old") => void;
}

const MonitorTab = ({ api, user, rows, loading, masters, models, reload, reloadModels, addMode, onAddDone, onSwitchAdd }: Props) => {
  const [card, setCard] = useState<"all" | "paid" | "due">("all");
  const [f, setF] = useState<{
    mods: string[];
    ctype: string;
    billingMode: "new" | "last";
    from: string;
    to: string;
  }>(defFilters());
  const [resetKey, setResetKey] = useState(0);
  const [search, setSearch] = useState("");
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [bulkRemark, setBulkRemark] = useState("");
  const [entryModal, setEntryModal] = useState<null | { mode: "new" | "old" | "edit"; row?: Entry }>(null);
  const [bulk, setBulk] = useState<null | "paid" | "due">(null);
  const [af, setAf] = useState(defFilters());
  const [file, setFile] = useState<File | null>(null);
  const [showImpResult, setShowImpResult] = useState(false);
  const [impResults, setImpResults] = useState<any[]>([]);
  const [impFilter, setImpFilter] = useState<"all" | "imported" | "failed">("all");
  const [savingImp, setSavingImp] = useState(false);

  const [payFor, setPayFor] = useState<string | null>(null);
  const [histFor, setHistFor] = useState<string | null>(null);
  const [showCompanies, setShowCompanies] = useState(false);

  const importedCount = impResults.filter((r) => r.Imported).length;
  const failedCount = impResults.length - importedCount;
  const visibleImp = useMemo(
    () => impResults.filter((r) => (impFilter === "all" ? true : impFilter === "imported" ? r.Imported : !r.Imported)),
    [impResults, impFilter]
  );


  const moduleOptions = useMemo(() => {
    const names = new Set<string>();
    masters.forEach((m) => names.add(m.Name));
    rows.forEach((r) => names.add(r.Module_Name));
    return [...names].sort().map((n) => ({ value: n, label: n }));
  }, [masters, rows]);

  /* ---- base rows (filters apply, KPIs follow filters) ---- */
  const base = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (af.mods.length && !af.mods.includes(r.Module_Name)) return false;
      if (af.ctype && (r.Company_Type || "user") !== af.ctype) return false;
      const billingDate =
        af.billingMode === "last" ? r.Last_Billing_Date : r.Next_Billing_Date;
      if (af.from && (billingDate || "") < af.from) return false;
      if (af.to && (billingDate || "") > af.to) return false;
      if (!q) return true;
      return [r.Client_Name, r.Client_Code, r.Contact_Person, r.Mobile_No, r.Module_Name].some((x) => String(x || "").toLowerCase().includes(q));
    });
  }, [rows, af, search]);

  // company paid = uske saare module Paid
  // const stats = useMemo(() => {
  //   const by: Record<string, { paid: number; due: number }> = {};
  //   base.forEach((r) => {
  //     const c = (by[r.Client_Code] = by[r.Client_Code] || { paid: 0, due: 0 });
  //     r.Status === "Paid" ? c.paid++ : c.due++;
  //   });
  //   const status: Record<string, "Paid" | "Due"> = {};
  //   let paid = 0, due = 0;
  //   Object.entries(by).forEach(([k, c]) => {
  //     status[k] = c.due === 0 ? "Paid" : "Due";
  //     status[k] === "Paid" ? paid++ : due++;
  //   });
  //   const total = Object.keys(by).length;
  //   return { total, paid, due, status, services: base.length, pct: total ? Math.round((paid / total) * 100) : 0 };
  // }, [base]);

  // Naya stats logic: Jitni rows (services) table me dikhengi, utna hi card me dikhega
  const stats = useMemo(() => {
    let paidCount = 0;
    let dueCount = 0;

    // Har ek row (service) ko check karo, company ko nahi
    base.forEach((r) => {
      if (r.Status === "Paid") {
        paidCount++;
      } else {
        dueCount++;
      }
    });
    const totalServices = base.length;
    return {
      total: new Set(base.map(r => r.Client_Code)).size,
      paid: paidCount,       // Card me ab Paid Services dikhengi
      due: dueCount,         // Card me ab Due Services dikhengi
      services: totalServices,
      pct: totalServices ? Math.round((paidCount / totalServices) * 100) : 0
    };
  }, [base]);

  // const visible = useMemo(() => 
  //   (card === "all" ? base : base.filter((r) => 
  //     stats.status[r.Client_Code] === (card === "paid" ? "Paid" : "Due"))), 
  // [base, card, stats.status]);
  // Table data filter
  const visible = useMemo(() => {
    if (card === "all") return base;
    if (card === "paid") return base.filter((r) => r.Status === "Paid");
    if (card === "due") return base.filter((r) => r.Status === "Due");
    return base;
  }, [base, card]);

  const nextCode = useMemo(() => {
    let mx = 0;
    rows.forEach((r) => { const m = /^CL-(\d+)$/i.exec(r.Client_Code || ""); if (m) mx = Math.max(mx, +m[1]); });
    return `CL-${String(mx + 1).padStart(3, "0")}`;
  }, [rows]);

  /* ---- selection ---- */
  const ids = visible.map((r) => r.BE_ID);
  const allSel = ids.length > 0 && ids.every((i) => sel.has(i));
  const toggle = (id: number) => setSel((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSel((p) => { const n = new Set(p); ids.forEach((i) => (allSel ? n.delete(i) : n.add(i))); return n; });
  const selectedRows = rows.filter((r) => sel.has(r.BE_ID));

  const doImport = async () => {
    if (!file) return toast("Please choose an Excel file.", "info");
    if (!masters.length) return toast("Modules list is empty. Add a Modules in Masters first.", "info");
    try {
      setSavingImp(true);
      const { payloadRows, failedRows, error } = await parseBillingExcel(file, masters);
      if (error) return toast(error, "error");

      let backendResults: any[] = [];
      if (payloadRows.length) {
        const res = await api("importBillingExcel", { rows: payloadRows });
        if (!res?.Status) return toast(res?.Message || "Import failed", "error");
        backendResults = res.Results || [];
      }
      const all = [...failedRows, ...backendResults].sort((a, b) => a.Row_No - b.Row_No);
      if (!all.length) return toast("No data rows found.", "info");

      setImpResults(all);
      setImpFilter("all");
      setShowImpResult(true);
      setFile(null);
      if (backendResults.some((r) => r.Imported)) reload();
    } catch (e: any) {
      toast(e?.response?.data?.Message || "Import failed", "error");
    } finally {
      setSavingImp(false);
    }
  };

  const doSample = async () => {
    try {
      await downloadBillingSample(masters, rows);
      toast("Sample file downloaded");
    } catch (e: any) {
      toast("Sample could not be created", "error");
    }
  };
  const reset = () => {
    const defaults = defFilters();
    setF(defaults);
    setAf(defaults);
    setSearch(""); setCard("all"); setResetKey((k) => k + 1);
  };



  const remove = async (r: Entry) => {
    const c = await Swal.fire({
      icon: "warning", title: "Remove this entry?", showCancelButton: true,
      html: `<b>${r.Client_Name}</b> (${r.Module_Name}) will be removed.`,
      confirmButtonText: "Yes, remove", confirmButtonColor: "#DC2626", cancelButtonColor: "#64748B",
    });
    if (!c.isConfirmed) return;
    try {
      const res = await api("removeBillingEntry", { BE_ID: r.BE_ID });
      if (res?.Status) { toast("Removed successfully"); reload(); } else toast(res?.Message || "Remove failed", "error");
    } catch (e: any) { toast(e?.response?.data?.Message || "Remove failed", "error"); }
  };

  /* ---- export (Excel) ---- */
  const exportExcel = async () => {
    if (!visible.length) return toast("No data to export.", "info");
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Billing Monitor");
    const cols = [
      ["Company ID", "Client_Code", 14], ["Company Name", "Client_Name", 30], ["Contact Person", "Contact_Person", 24],
      ["Mobile No.", "Mobile_No", 14], ["Email", "Email", 28], ["Type", "Company_Type", 8], ["Service", "Module_Name", 30],
      ["Frequency", "Frequency", 14], ["Qty", "Qty", 8], ["Rate", "Rate", 10], ["Start Date", "Start_Date", 13],
      ["Last Billing", "Last_Billing_Date", 13], ["Next Billing", "Next_Billing_Date", 13], ["Amount Paid", "Amount_Paid", 13],
      ["Amount Due", "Amount_Due", 13], ["Payment Date & Time", "Payment_Date", 20], ["Reference No.", "Reference_No", 18],
      ["Status", "Status", 9], ["Remark", "Remarks", 24], ["Ownership", "Create_by", 16],
    ] as const;
    ws.columns = cols.map(([header, key, width]) => ({ header, key, width }));
    ws.getRow(1).eachCell((c) => {
      c.font = { bold: true, color: { argb: "FFFFFFFF" } };
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF3B82F6" } };
    });
    visible.forEach((r: any) =>
      ws.addRow({
        ...r, Company_Type: CT[r.Company_Type || "user"], Frequency: FQ[r.Frequency] || "",
        Start_Date: dmy(r.Start_Date), Last_Billing_Date: dmy(r.Last_Billing_Date), Next_Billing_Date: dmy(r.Next_Billing_Date),
        Payment_Date: r.Payment_Date ? fmtDT(r.Payment_Date) : "",
      })
    );
    ws.views = [{ state: "frozen", ySplit: 1 }];
    saveAs(new Blob([await wb.xlsx.writeBuffer()]), "Billing_Monitor.xlsx");
  };

  const KPI = ({ k, icon, title, value, sub, color, bar }: any) => {
    const active = card === k;
    return (
      <div
        onClick={() => setCard((p) => (p === k ? "all" : k))}
        className={`md:col-span-4 col-span-12 group relative overflow-hidden rounded-2xl bg-white dark:bg-[#1E293B] px-5 pt-5 pb-4 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${active ? "ring-2 shadow-xl" : "border border-[#E2E8F0] dark:border-[#334155] shadow-sm hover:shadow-lg"
          }`}
        style={active ? ({ "--tw-ring-color": color, boxShadow: `0 12px 30px -8px ${color}55` } as any) : undefined}
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, ${color}, ${color}66)` }} />
        {/* Soft glow blob */}
        <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-[0.12] blur-2xl transition-opacity duration-300 group-hover:opacity-25 pointer-events-none" style={{ background: color }} />

        <div className="relative flex items-start justify-between gap-2">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 transition-transform duration-300 group-hover:scale-110"
              style={{ background: `${color}1A`, boxShadow: `inset 0 0 0 1px ${color}33` }}
            >
              {icon}
            </div>
            <div>
              <p className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">{title}</p>
              <p className="text-[32px] leading-9 font-extrabold mt-0.5" style={{ color }}>{value}</p>
            </div>
          </div>

          {/* Right-side badge */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {k !== "all" && (
              <span className="text-[11px] font-bold px-2 py-1 rounded-full" style={{ background: `${color}1A`, color }}>
                {bar}%
              </span>
            )}
            {active && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: color }}>
                ✓ Filtering
              </span>
            )}
          </div>
        </div>

        <p className="relative text-xs text-[#64748B] dark:text-[#94A3B8] mt-2.5">{sub}</p>

        {/* Progress bar */}
        <div className="relative w-full h-2 bg-[#E2E8F0] dark:bg-[#334155] rounded-full overflow-hidden mt-3">
          <div
            className="h-2 rounded-full transition-all duration-700"
            style={{ width: `${bar}%`, background: `linear-gradient(90deg, ${color}CC, ${color})` }}
          />
        </div>
      </div>
    );
  };

  const show = () => {
    if (f.from && f.to && f.from > f.to) return toast("From date cannot be greater than To date.", "info");
    setAf(f);
    setSel(new Set());
    reload();                       // getBillingEntries API call
  };

  return (
    <>
      {/* ===== KPI cards ===== */}
      <div className="col-span-12 grid grid-cols-12 gap-4">
        {/* <KPI
          k="all"
          icon="👥" title="Total Company"
          value={stats.total}
          color="#4F46E5" bar={100}
          sub={`${stats.services} services active (a company can use many)`}
        /> */}
        <div
          onClick={() => setShowCompanies(true)}
          className="md:col-span-4 col-span-12 group relative overflow-hidden rounded-2xl bg-white dark:bg-[#1E293B] px-5 pt-5 pb-4 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border border-[#E2E8F0] dark:border-[#334155] shadow-sm hover:shadow-lg"
        >
          <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, #4F46E5, #4F46E566)` }} />
          <div className="relative flex items-start justify-between gap-2">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 transition-transform duration-300 group-hover:scale-110" style={{ background: `#4F46E51A`, boxShadow: `inset 0 0 0 1px #4F46E533` }}>
                👥
              </div>
              <div>
                <p className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">Total Company</p>

                <p className="text-[32px] leading-9 font-extrabold mt-0.5" style={{ color: "#4F46E5" }}>
                  {/* 👈 Yahan unique companies count ho rahi hain */}
                  {new Set(rows.map(r => r.Client_Code)).size}
                </p>
              </div>
            </div>
          </div>
          <p className="relative text-xs text-[#64748B] dark:text-[#94A3B8] mt-2.5">
            {/* 👈 Yahan 'rows' ki jagah 'base' kiya aur 'length' nikaal diya */}
            {rows.length} Modules active (a company can use many)
          </p>
          <div className="relative w-full h-2 bg-[#E2E8F0] dark:bg-[#334155] rounded-full overflow-hidden mt-3">
            <div className="h-2 rounded-full" style={{ width: `100%`, background: `#4F46E5` }} />
          </div>
        </div>
        <KPI
          k="paid"
          icon="✅"
          title="Bill paid"
          value={stats.paid}
          color="#16A34A" bar={stats.pct}
          // sub="All their services have been paid" 
          sub="Total Modules paid"
        />
        <KPI
          k="due"
          icon="⏳"
          title="Bill due"
          value={stats.due}
          color="#DC2626"
          bar={stats.total ? 100 - stats.pct : 0}
          // sub="At least one service has a pending bill" 
          sub="Total Modules pending"
        />
      </div>

      {/* ===== Filters ===== */}
      <div className="col-span-12 grid grid-cols-12 gap-3 items-end" key={resetKey}>
        {/* <div className="lg:col-span-3 md:col-span-6 col-span-12">
          <CustomSelectSearch title="Module" name="Module" options={moduleOptions} selectedValue={f.mods} redlabel=""  isMulti={true} isSelectAll={true}
            handleInputChange={(_n: any, v: any) => setF((p) => ({ ...p, mods: Array.isArray(v) ? v.map((x: any) => String(x?.value ?? x)) : String(v || "").split(",").filter(Boolean) }))} />
        </div> */}

        <div className="lg:col-span-2 md:col-span-6 col-span-12">
          <label className="block text-xs font-medium text-[#64748B] mb-1">Module</label>
          <select
            className={inputCls}
            value={f.mods[0] ?? ""}
            onChange={(e) => setF((p) => ({ ...p, mods: e.target.value ? [e.target.value] : [] }))}
          >
            <option value="">All</option>
            {moduleOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="lg:col-span-2 md:col-span-6 col-span-12">
          <label className="block text-xs font-medium text-[#64748B] mb-1">Company type</label>
          <select className={inputCls} value={f.ctype} onChange={(e) => setF((p) => ({ ...p, ctype: e.target.value }))}>
            <option value="">All</option><option value="user">User</option><option value="amc">AMC</option>
          </select>
        </div>
        <div className="lg:col-span-2 md:col-span-6 col-span-12">
          <label className="block text-xs font-medium text-[#64748B] mb-1">Billing type</label>
          <select
            className={inputCls}
            value={f.billingMode}
            onChange={(e) =>
              setF((p) => ({
                ...p,
                billingMode: e.target.value as "new" | "last",
                from: fyStart(),
                to: todayYMD(),
              }))
            }
          >
            <option value="new">Next</option>
            <option value="last">Last</option>
          </select>
        </div>
        <div className="lg:col-span-2 md:col-span-6 col-span-12">
          <Ainput
            title={f.billingMode === "last" ? "Last Billing: From" : "Next billing: From"}
            type="date"
            name="from"
            value={f.from}
            handleInputChange={(_n: any, v: any) => setF((p) => ({ ...p, from: v }))}
          />
        </div>
        <div className="lg:col-span-2 md:col-span-6 col-span-12">
          <Ainput
            title={f.billingMode === "last" ? "Last Billing: To" : "Next billing: To"}
            type="date"
            name="to"
            value={f.to}
            handleInputChange={(_n: any, v: any) => setF((p) => ({ ...p, to: v }))}
          />
        </div>
        <div className="lg:col-span-2 col-span-12 flex gap-2 flex-wrap">
          <Button variant="save" onClick={show} className="px-6">Show</Button>
          <Button variant="print" onClick={reset} className="px-6">Reset</Button>

        </div>
      </div>

      {/* ===== Search + add buttons ===== */}
      <div className="col-span-12 md:col-span-4">
        <input value={search} onChange={(e) => setSearch(e.target.value)} className={inputCls}
          placeholder="Search company, ID, contact, mobile or Modules" />
      </div>
      <div className="col-span-12 md:col-span-7 flex flex-wrap items-center gap-2 ">
        <label className="flex items-center gap-2 h-10 px-4 rounded-lg border border-dashed border-[#CBD5E1] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] cursor-pointer hover:border-[#3B82F6]">
          <span className="text-lg">📄</span>
          <span className="text-sm text-[#334155] dark:text-white max-w-[220px] truncate">
            {file ? file.name : "Choose Excel file"}
          </span>
          <input type="file" accept=".xlsx" className="hidden"
            onChange={(e) => { setFile(e.target.files?.[0] || null); e.target.value = ""; }} />
        </label>
        {file && (
          <button type="button" onClick={() => setFile(null)}
            className="h-10 px-3 rounded-lg border border-[#FECACA] bg-[#FEF2F2] text-xs font-semibold text-[#B91C1C]">
            Clear
          </button>
        )}
        <Button variant="update" onClick={doImport} disabled={savingImp} className="px-5">
          {savingImp ? "Importing..." : "⬆ Import"}
        </Button>
        <Button variant="outline" onClick={doSample}>⬇ Download Sample</Button>
      </div>


      {/* ===== Table ===== */}
      <div className="col-span-12 bg-white dark:bg-[#1E293B] rounded-xl shadow border border-[#E2E8F0] dark:border-[#334155] overflow-hidden">
        <div className="px-6 py-3 border-b border-[#E2E8F0] dark:border-[#334155] flex justify-between items-center">
          <p className="text-base text-[#64748B] dark:text-[#CBD5E1]">
            Total records: <span className="font-semibold text-[#334155] dark:text-white">{visible.length}</span>
            {card !== "all" && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#4338CA]">
                {card === "paid" ? "Bill paid only" : "Bill due only"}
                <button className="ml-1 font-bold" onClick={() => setCard("all")}>✕</button>
              </span>
            )}
          </p>
          <Button variant="outline" onClick={exportExcel} className="h-8"> ↑ Export To Excel</Button>
        </div>

        <div className="w-full overflow-auto max-h-[420px]">
          <table className="w-full text-sm min-w-[2600px]">
            <thead className="sticky top-0  bg-[#F8FAFC] dark:bg-[#0F172A]">
              <tr className="border-b border-[#E2E8F0] dark:border-[#334155]">
                <th className="px-4 py-3 w-12 text-center">
                  <input type="checkbox" checked={allSel} onChange={toggleAll} className="w-4 h-4 cursor-pointer accent-[#4F46E5]" title="Select all visible" />
                </th>
                {["Company ID", "Company Name", "Contact Person", "Mobile No.", "Modules", "Start Date", "Last Billing", "Next Billing",
                  "Amount Paid", "Amount Due", "Payment Date & Time", "Reference No.", "Receipt", "Status", "Remark", "Ownership"].map((h) => (
                    <th key={h} className={thCls}>{h}</th>
                  ))}
                <th className={thCls + " text-center"}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={18} className="text-center py-8 text-[#94A3B8]">Loading...</td></tr>
              ) : visible.length === 0 ? (
                <tr><td colSpan={18} className="text-center py-8 text-[#94A3B8] italic">No records found</td></tr>
              ) : (
                visible.map((r) => {
                  const d = r.Next_Billing_Date ? dayDiff(r.Next_Billing_Date) : null;
                  return (
                    <tr key={r.BE_ID} className={`border-b border-[#F1F5F9] dark:border-[#334155] ${sel.has(r.BE_ID) ? "bg-[#EEF2FF] dark:bg-[#1E1B4B]" : "hover:bg-[#F8FAFC] dark:hover:bg-[#0F172A]"}`}>
                      <td className="px-4 py-3 text-center">
                        <input type="checkbox" checked={sel.has(r.BE_ID)} onChange={() => toggle(r.BE_ID)} className="w-4 h-4 cursor-pointer accent-[#4F46E5]" />
                      </td>
                      <td className={tdCls}>{r.Client_Code}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-[#DBEAFE] dark:bg-[#1E3A8A] flex items-center justify-center shrink-0">
                            <FaTasks size={16} className="text-[#1D4ED8] dark:text-[#93C5FD]" />
                          </div>
                          <div>
                            <p className="font-medium text-[#334155] dark:text-white">{r.Client_Name}</p>
                            <p className="text-xs text-[#94A3B8]">{CT[r.Company_Type || "user"]}{r.Frequency ? ` · ${FQ[r.Frequency]}` : ""}</p>
                          </div>
                        </div>
                      </td>
                      <td className={tdCls}>{r.Contact_Person}</td>
                      <td className={tdCls}>{r.Mobile_No}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md text-xs bg-[#EEF2FF] text-[#4338CA] dark:bg-[#312E81] dark:text-[#C7D2FE]">{r.Module_Name}</span>
                      </td>
                      <td className={tdCls}>{dmy(r.Start_Date)}</td>
                      <td className={tdCls}>{dmy(r.Last_Billing_Date)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-[#334155] dark:text-white">
                        {dmy(r.Next_Billing_Date)}
                        {r.Status === "Due" && d !== null && d < 0 && <span className="ml-2 text-xs text-[#DC2626]">{Math.abs(d)}d overdue</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-[#334155] dark:text-white">{r.Amount_Paid ? money(r.Amount_Paid) : ""}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-[#334155] dark:text-white">{r.Status === "Due" && billAmt(r) ? money(billAmt(r)) : ""}</td>
                      <td className={tdCls}>{r.Payment_Date ? fmtDT(r.Payment_Date) : ""}</td>
                      <td className={tdCls}>{r.Reference_No || ""}</td>
                      <td className="px-4 py-3">
                        {r.Receipt_Image && (
                          <img src={FILE_URL + r.Receipt_Image} alt="Receipt" onClick={() => window.open(FILE_URL + r.Receipt_Image, "_blank")}
                            className="w-10 h-10 object-cover rounded-md border border-[#E2E8F0] cursor-pointer hover:opacity-80" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusClass(r.Status)}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />{r.Status}
                        </span>
                      </td>
                      <td className={tdCls}>{r.Remarks || ""}</td>
                      <td className={tdCls}>{r.Create_by || ""}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => setPayFor(r.Client_Code)}
                            className="px-3 py-1 rounded-md text-[11px] font-semibold bg-[#16A34A] text-white hover:bg-[#15803D]">
                            Record Payment
                          </button>
                          <button onClick={() => setHistFor(r.Client_Code)}
                            className="px-3 py-1 rounded-md text-[11px] font-semibold bg-[#F1F5F9] text-[#334155] hover:bg-[#E2E8F0] dark:bg-[#1E293B] dark:text-[#E2E8F0]">
                            History
                          </button>
                          <button onClick={() => setEntryModal({ mode: "edit", row: r })}
                            className="px-3 py-1 rounded-md text-sm font-medium bg-[#DBEAFE] text-[#1D4ED8] hover:bg-[#BFDBFE] dark:bg-[#1E3A8A] dark:text-[#93C5FD]">Edit</button>
                          <button onClick={() => remove(r)}
                            className="px-3 py-1 rounded-md text-sm font-medium bg-[#FEE2E2] text-[#B91C1C] hover:bg-[#FECACA] dark:bg-[#7F1D1D] dark:text-[#FCA5A5]">Remove</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ===== Bulk bar ===== */}
        <div className="px-6 py-3 border-t border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-[#334155] dark:text-white cursor-pointer">
            <input type="checkbox" checked={allSel} onChange={toggleAll} className="w-4 h-4 cursor-pointer accent-[#4F46E5]" />Select all
          </label>
          <span className="text-sm text-[#64748B] dark:text-[#94A3B8]">{sel.size} selected</span>
          <input value={bulkRemark} onChange={(e) => setBulkRemark(e.target.value)} placeholder="Remark for the selected entries"
            className="flex-1 min-w-[200px] h-9 px-3 rounded-md border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-sm text-[#334155] dark:text-white focus:outline-none focus:border-[#3B82F6]" />
          <button onClick={() => setBulk("paid")} disabled={!sel.size}
            className="px-4 h-9 rounded-md text-sm font-semibold bg-[#16A34A] text-white hover:bg-[#15803D] disabled:opacity-50 disabled:cursor-not-allowed">✅ Mark Paid</button>
          <button onClick={() => setBulk("due")} disabled={!sel.size}
            className="px-4 h-9 rounded-md text-sm font-semibold bg-[#DC2626] text-white hover:bg-[#B91C1C] disabled:opacity-50 disabled:cursor-not-allowed">⏳ Mark Due</button>
        </div>
      </div>

      {(entryModal || addMode) && (
        <EntryModal key={entryModal ? "edit" : `add-${addMode}`}
          api={api} user={user} rows={rows} masters={masters} models={models} nextCode={nextCode}
          mode={entryModal ? entryModal.mode : (addMode as "new" | "old")} row={entryModal?.row}
          onSwitch={entryModal ? undefined : onSwitchAdd}
          onClose={() => { setEntryModal(null); onAddDone(); }}
          onSaved={() => { setEntryModal(null); onAddDone(); reload(); }} reloadModels={reloadModels} />
      )}
      {bulk && (
        <BulkModal api={api} user={user} kind={bulk} rows={selectedRows} remark={bulkRemark}
          onClose={() => setBulk(null)} onSaved={() => { setBulk(null); setSel(new Set()); setBulkRemark(""); reload(); }} />
      )}

      {payFor && (
        <RecordPaymentModal api={api} user={user} rows={rows} clientCode={payFor}
          onClose={() => setPayFor(null)}
          onSaved={() => { setPayFor(null); reload(); }} />
      )}
      {histFor && (
        <PaymentHistoryModal api={api} user={user} rows={rows} clientCode={histFor}
          onClose={() => setHistFor(null)}
          onSaved={() => reload()} />
      )}
      {showCompanies && <CompaniesModal rows={rows} onClose={() => setShowCompanies(false)} />}

      {showImpResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#0F172A]/70 via-[#000000]/60 to-[#0F172A]/70 backdrop-blur-md p-4">
          <div className="w-full max-w-6xl max-h-[92vh] flex flex-col rounded-2xl bg-[#FFFFFF] dark:bg-[#1E293B] shadow-2xl ring-1 ring-[#000000]/10 dark:ring-[#FFFFFF]/10 overflow-hidden">

            {/* ═══════════════════════════════════════════
          HEADER
      ═══════════════════════════════════════════ */}
            <div className="px-6 py-4 flex justify-between items-start border-b border-[#E2E8F0] dark:border-[#334155] bg-gradient-to-r from-[#FFFFFF] to-[#F8FAFC] dark:from-[#1E293B] dark:to-[#0F172A]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center shadow-md shadow-[#6366F1]/30 shrink-0">
                  <span className="text-[#FFFFFF] text-base">📥</span>
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-[#1E293B] dark:text-[#FFFFFF] leading-tight">
                    Import Result
                  </h2>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                    {impResults.length} {impResults.length === 1 ? "row" : "rows"} processed
                    {failedCount > 0 && ` · ${failedCount} failed`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowImpResult(false)}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9] dark:text-[#94A3B8] dark:hover:text-[#FFFFFF] dark:hover:bg-[#334155] transition-all text-lg shrink-0"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* ═══════════════════════════════════════════
             SUMMARY CARDS
             ═══════════════════════════════════════════ */}
            <div className="px-6 pt-4 grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] p-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#EEF2FF] dark:bg-[#6366F1]/20 flex items-center justify-center text-sm shrink-0">
                    📊
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] dark:text-[#64748B]">
                    Total
                  </p>
                </div>
                <p className="text-2xl font-bold text-[#4F46E5] dark:text-[#818CF8] mt-1.5">
                  {impResults.length}
                </p>
              </div>

              <div className="rounded-xl border border-[#BBF7D0] dark:border-[#166534] bg-[#F0FDF4] dark:bg-[#16A34A]/10 p-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#DCFCE7] dark:bg-[#16A34A]/20 flex items-center justify-center text-sm shrink-0">
                    ✅
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#15803D] dark:text-[#4ADE80]">
                    Imported
                  </p>
                </div>
                <p className="text-2xl font-bold text-[#16A34A] dark:text-[#4ADE80] mt-1.5">
                  {importedCount}
                </p>
              </div>

              <div className="rounded-xl border border-[#FECACA] dark:border-[#7F1D1D] bg-[#FEF2F2] dark:bg-[#DC2626]/10 p-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#FEE2E2] dark:bg-[#DC2626]/20 flex items-center justify-center text-sm shrink-0">
                    ⚠️
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#B91C1C] dark:text-[#F87171]">
                    Failed
                  </p>
                </div>
                <p className="text-2xl font-bold text-[#DC2626] dark:text-[#F87171] mt-1.5">
                  {failedCount}
                </p>
              </div>
            </div>

            {/* ═══════════════════════════════════════════
          FILTER TABS
      ═══════════════════════════════════════════ */}
            <div className="px-6 py-4 flex flex-wrap gap-2">
              {[
                { k: "all", label: `All (${impResults.length})`, icon: "📊", on: "bg-[#4F46E5] text-[#FFFFFF] border-[#4F46E5] shadow-sm shadow-[#4F46E5]/30" },
                { k: "imported", label: `Imported (${importedCount})`, icon: "✅", on: "bg-[#16A34A] text-[#FFFFFF] border-[#16A34A] shadow-sm shadow-[#16A34A]/30" },
                { k: "failed", label: `Not Imported (${failedCount})`, icon: "⚠️", on: "bg-[#DC2626] text-[#FFFFFF] border-[#DC2626] shadow-sm shadow-[#DC2626]/30" },
              ].map((b) => {
                const active = impFilter === b.k;
                return (
                  <button
                    key={b.k}
                    onClick={() => setImpFilter(b.k as any)}
                    className={`h-9 px-4 rounded-lg text-sm font-semibold border transition-all duration-200 flex items-center gap-1.5 ${active
                      ? b.on
                      : "bg-[#FFFFFF] dark:bg-[#1E293B] text-[#64748B] dark:text-[#94A3B8] border-[#E2E8F0] dark:border-[#334155] hover:border-[#C7D2FE] dark:hover:border-[#4338CA] hover:text-[#334155] dark:hover:text-[#FFFFFF]"
                      }`}
                  >
                    <span className="text-xs">{b.icon}</span>
                    {b.label}
                  </button>
                );
              })}
            </div>

            {/* ═══════════════════════════════════════════
          TABLE
      ═══════════════════════════════════════════ */}
            <div className="px-6 pb-4 flex-1 overflow-hidden flex flex-col min-h-0">
              <div className="flex-1 overflow-auto rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#FFFFFF] dark:bg-[#1E293B]">
                <table className="w-full text-sm min-w-[1400px] border-collapse">
                  <thead className="sticky top-0 z-10 bg-gradient-to-b from-[#F8FAFC] to-[#F1F5F9] dark:from-[#0F172A] dark:to-[#1E293B] shadow-sm">
                    <tr>
                      {["Client ID", "Company Name", "Contact Person", "Mobile No.", "Modules", "Joining Date", "Last Billing Date", "Next Billing Date", "Status", "Import Result", "Reason"].map((h) => (
                        <th
                          key={h}
                          className="text-left px-3 py-2.5 text-[11px] uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] font-bold whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleImp.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-12 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-14 h-14 rounded-2xl bg-[#F1F5F9] dark:bg-[#0F172A] flex items-center justify-center text-2xl opacity-60">
                              📭
                            </div>
                            <p className="text-sm font-semibold text-[#64748B] dark:text-[#94A3B8]">
                              No records
                            </p>
                            <p className="text-xs text-[#94A3B8] dark:text-[#64748B]">
                              Try switching the filter above
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      visibleImp.map((r, i) => (
                        <tr
                          key={`${r.Row_No}-${i}`}
                          className="border-t border-[#F1F5F9] dark:border-[#334155] hover:bg-[#F8FAFC] dark:hover:bg-[#0F172A] transition-colors"
                        >
                          <td className="px-3 py-2.5 text-[#334155] dark:text-[#FFFFFF] font-mono text-xs whitespace-nowrap">
                            {r.Client_Code || <span className="text-[#94A3B8] italic">—</span>}
                          </td>
                          <td className="px-3 py-2.5 text-[#334155] dark:text-[#FFFFFF] font-medium">
                            {r.Client_Name || <span className="text-[#94A3B8] italic">—</span>}
                          </td>
                          <td className="px-3 py-2.5 text-[#64748B] dark:text-[#CBD5E1]">
                            {r.Contact_Person || <span className="text-[#94A3B8] italic">—</span>}
                          </td>
                          <td className="px-3 py-2.5 text-[#64748B] dark:text-[#CBD5E1] whitespace-nowrap font-mono text-xs">
                            {r.Mobile_No || <span className="text-[#94A3B8] italic">—</span>}
                          </td>
                          <td className="px-3 py-2.5 text-[#64748B] dark:text-[#CBD5E1]">
                            {r.Module_Name ? (
                              <span className="inline-flex px-2 py-0.5 rounded-md text-xs bg-[#EEF2FF] text-[#4338CA] dark:bg-[#6366F1]/20 dark:text-[#C7D2FE]">
                                {r.Module_Name}
                              </span>
                            ) : <span className="text-[#94A3B8] italic">—</span>}
                          </td>
                          <td className="px-3 py-2.5 text-[#64748B] dark:text-[#CBD5E1] whitespace-nowrap">
                            {dmy(r.Start_Date)}
                          </td>
                          <td className="px-3 py-2.5 text-[#64748B] dark:text-[#CBD5E1] whitespace-nowrap">
                            {dmy(r.Last_Billing_Date)}
                          </td>
                          <td className="px-3 py-2.5 text-[#64748B] dark:text-[#CBD5E1] whitespace-nowrap">
                            {dmy(r.Next_Billing_Date)}
                          </td>
                          <td className="px-3 py-2.5">
                            {r.Status ? (
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusClass(r.Status)}`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                {r.Status}
                              </span>
                            ) : <span className="text-[#94A3B8] italic">—</span>}
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${r.Imported
                                ? "bg-[#DCFCE7] text-[#15803D] dark:bg-[#16A34A]/20 dark:text-[#4ADE80]"
                                : "bg-[#FEE2E2] text-[#B91C1C] dark:bg-[#DC2626]/20 dark:text-[#F87171]"
                                }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${r.Imported ? "bg-[#16A34A]" : "bg-[#DC2626]"
                                }`} />
                              {r.Imported ? "Imported" : "Not Imported"}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-[#B91C1C] dark:text-[#F87171] min-w-[260px] text-xs">
                            {r.Reason || <span className="text-[#94A3B8] italic">—</span>}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ═══════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════ */}
            <div className="px-6 py-4 flex items-center justify-between gap-3 border-t border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A]">
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Showing <b className="text-[#1E293B] dark:text-[#FFFFFF]">{visibleImp.length}</b> of <b className="text-[#1E293B] dark:text-[#FFFFFF]">{impResults.length}</b>
              </p>
              <Button variant="print" onClick={() => setShowImpResult(false)} className="px-6">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MonitorTab;