"use client";
import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cardCls, dayDiff, docNoPattern, inputCls, labelCls, money, noteCls, r2 } from "./utils";
import { Entry, Inv, Master, Settings, amt, billHTML, calcInv, docNo, invFromEntries, emptyInv } from "./Invoice";

interface Props {
  inv: Inv; setInv: React.Dispatch<React.SetStateAction<Inv>>; rows: Entry[]; settings: Settings;
  onDownload: () => void; masters: Master[];
  onCompanySelect: (code: string | null, name: string | null) => void;
  onSave?: () => void;
}

const InvoiceForm = ({ inv, setInv, rows, settings, onDownload, masters, onCompanySelect,onSave }: Props) => {
  const co = settings.co;
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState(false);

  const companies = useMemo(() => {
    const m = new Map<string, Entry>();
    rows.forEach((r) => { if (!m.has(r.Client_Code)) m.set(r.Client_Code, r); });
    return [...m.values()];
  }, [rows]);
  const sugg = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t || picked) return [];
    return companies.filter((c) => [c.Client_Name, c.Client_Code, c.Mobile_No].some((x) => String(x || "").toLowerCase().includes(t))).slice(0, 8);
  }, [q, picked, companies]);

  const pick = (c: Entry) => {
    const es = rows.filter((r) => r.Client_Code === c.Client_Code);
    const next = invFromEntries(es, co);
    next.items = next.items.map((item) => {
      if (item.kind !== "api" || String(item.qty ?? "").trim() !== "") return item;
      const entry = es.find((e) => e.BE_ID === item.eid);
      const master = masters.find((m) => String(m.BMM_ID) === String(entry?.BMM_ID));
      return master ? { ...item, qty: master.Min_Qty || 1 } : item;
    });
    // jin services ka bill ban chuka / ban-na wala hai unko hi tick karo
    const soon = (i: any) => es.find((e) => e.BE_ID === i.eid)?.Status === "Due" || dayDiff(i.nx) <= +settings.auto.days;
    const anyOn = next.items.some(soon);
    next.items = next.items.map((i) => ({ ...i, on: anyOn ? soon(i) : true }));
    setInv(next);
    setPicked(true);
    setQ(c.Client_Name);
    onCompanySelect(c.Client_Code, c.Client_Name);
  };
  const clear = () => {
    setInv(emptyInv(co));
    setQ(""); setPicked(false);
    onCompanySelect(null, null);
  };

  const set = (k: keyof Inv, v: any) => setInv((p) => ({ ...p, [k]: v }));
  const setType = (t: "pre" | "tax") =>
    setInv((p) => ({ ...p, type: t, inv: docNoPattern.test(p.inv) ? docNo(t, co) : p.inv }));
  const setItem = (idx: number, patch: any) => setInv((p) => ({ ...p, items: p.items.map((i, j) => (j === idx ? { ...i, ...patch } : i)) }));
  const pickModule = (idx: number, bmmId: string) => {
    if (!bmmId) return;
    const m = masters.find((x: Master) => String(x.BMM_ID) === bmmId);
    if (!m) return;
    setItem(idx, {
      eid: null,
      kind: m.Kind === "api" ? "api" : "module",
      title: m.Name,
      unit: m.Unit_Label || "unit",
      qty: m.Min_Qty || 1,
      rate: m.Rate,
      mo: 1,
      legacy: true,
      pf: "", pt: "",
      sac: m.SAC_HSN || "",
      gst: m.GST_Percent,
      nx: "",
      on: true,
    });
  };

  const addBlankModule = () =>
    setInv((p) => ({
      ...p,
      items: [...p.items, {
        eid: null, kind: "module", title: "", unit: "", qty: 1, rate: 0, mo: 1,
        legacy: true, pf: "", pt: "", sac: "", gst: null, nx: "", on: true,
      }],
    }));
  const addCustom = () =>
    setInv((p) => ({ ...p, items: [...p.items, { eid: null, kind: "custom", title: "", unit: "", qty: 1, rate: 0, mo: 1, legacy: true, pf: "", pt: "", sac: "", gst: null, nx: "", on: true }] }));
  const setLine = (i: number, patch: any) => setInv((p) => ({ ...p, lines: p.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) }));

  const { T } = calcInv(inv, co);
  const html = useMemo(() => billHTML(inv, co), [inv, co]);
  const hasRows = inv.items.some((i) => i.on) || inv.lines.some((l) => l.d || +l.q || +l.r);

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className={`${cardCls} col-span-12 xl:col-span-6 space-y-3`}>
        <h3 className="font-bold text-[#1E293B] dark:text-white">1. Select company or enter details</h3>
        <div className="relative">
          <label className={labelCls}>Search existing company</label>
          <div className="flex gap-2">
            <input className={inputCls} placeholder="Name, ID or mobile…" autoComplete="off" value={q}
              onChange={(e) => { setQ(e.target.value); setPicked(false); }} />
            <Button variant="print" onClick={clear} className="px-4">Clear</Button>
          </div>
          {sugg.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full max-h-52 overflow-y-auto rounded-lg border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#1E293B] shadow-lg">
              {sugg.map((c) => (
                <li key={c.Client_Code} onClick={() => pick(c)} className="px-3 py-2 text-sm cursor-pointer hover:bg-[#F1F5F9] dark:hover:bg-[#0F172A] text-[#334155] dark:text-white">
                  {c.Client_Name} <span className="text-xs text-[#94A3B8]">({c.Client_Code})</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 md:col-span-6"><label className={labelCls}>Company Name</label><input className={inputCls} value={inv.name} onChange={(e) => set("name", e.target.value)} /></div>
          <div className="col-span-12 md:col-span-6"><label className={labelCls}>Contact Person</label><input className={inputCls} value={inv.person} onChange={(e) => set("person", e.target.value)} /></div>
          <div className="col-span-12 md:col-span-6"><label className={labelCls}>Mobile</label><input className={inputCls} value={inv.mobile} onChange={(e) => set("mobile", e.target.value.replace(/\D/g, ""))} maxLength={10} /></div>
          <div className="col-span-12 md:col-span-6"><label className={labelCls}>Email (To)</label><input type="email" placeholder="name@example.com" className={inputCls} value={inv.email} onChange={(e) => set("email", e.target.value)} /></div>
          <div className="col-span-12"><label className={labelCls}>Email (CC)</label><input className={inputCls} placeholder="name@example.com" value={inv.cc} onChange={(e) => set("cc", e.target.value)} /></div>
          <div className="col-span-12"><label className={labelCls}>Company Address (shown on invoice)</label><input className={inputCls} value={inv.addr} onChange={(e) => set("addr", e.target.value)} /></div>
          <div className="col-span-12 md:col-span-6"><label className={labelCls}>Company GSTIN</label><input className={inputCls} maxLength={15} value={inv.gstin} onChange={(e) => set("gstin", e.target.value.toUpperCase())} /></div>
          <div className="col-span-12 md:col-span-6">
            <label className={labelCls}>Invoice Type</label>
            <select className={inputCls} value={inv.type} onChange={(e) => setType(e.target.value as any)}>
              <option value="pre">Pre Invoice</option>
              <option value="tax">Tax Invoice</option>
            </select>
          </div>
        </div>

        {/* ===== services on this invoice ===== */}
        <div>
          <label className={labelCls}>Modules on this invoice</label>
          {inv.items.length === 0 ? (
            <p className={noteCls}>Select a company to load its Modules, or add a custom line below.</p>
          ) : (
            <div className="overflow-x-scroll overflow-y-scroll rounded-lg border border-[#E2E8F0] dark:border-[#334155] max-h-[280px]">
              <table className="w-full text-xs min-w-[1000px]">
                <thead className="sticky top-0 z-10 bg-[#F8FAFC] dark:bg-[#0F172A] text-[#64748B]">
                  <tr>
                    <th className="p-2 w-8"></th>
                    <th className="p-2 text-left min-w-[260px]">Module</th>
                    <th className="p-2 w-24">Qty</th>
                    <th className="p-2 w-32">Rate</th>
                    {/* <th className="p-2 w-14">Months</th> */}
                    <th className="p-2 w-28">From</th>
                    <th className="p-2 w-28">To</th>
                    <th className="p-2 w-24 text-right">Amount</th>
                    <th className="p-2 w-24 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {inv.items.map((i, idx) => (
                    <tr key={idx} className="border-t border-[#F1F5F9] dark:border-[#334155]">
                      <td className="p-2 text-center">
                        <input type="checkbox" checked={i.on} onChange={(e) => setItem(idx, { on: e.target.checked })} className="accent-[#4F46E5]" />
                      </td>
                      
                      <td className="p-2 min-w-[260px]">
                        {i.kind === "custom" ? (
                          <input
                            className={inputCls + " h-8 w-full"}
                            placeholder="Description"
                            value={i.title}
                            onChange={(e) => setItem(idx, { title: e.target.value })}
                          />
                        ) : (
                          <select
                            className={inputCls + " h-8 w-full"}
                            value={masters.find((m: Master) => m.Name === i.title)?.BMM_ID ?? ""}
                            onChange={(e) => pickModule(idx, e.target.value)}
                          >
                            {i.title && !masters.some((m: Master) => m.Name === i.title) && (
                              <option value="">{i.title}</option>
                            )}
                            <option value="">Select module…</option>
                            <optgroup label="Modules">
                              {masters
                                .filter((m: Master) => m.Kind === "module" && m.Is_Live)
                                .map((m: Master) => (
                                  <option key={m.BMM_ID} value={m.BMM_ID}>{m.Name}</option>
                                ))}
                            </optgroup>
                            <optgroup label="Third-Party APIs">
                              {masters
                                .filter((m: Master) => m.Kind === "api" && m.Is_Live)
                                .map((m: Master) => (
                                  <option key={m.BMM_ID} value={m.BMM_ID}>{m.Name}</option>
                                ))}
                            </optgroup>
                          </select>
                        )}
                      </td>
                      <td className="p-2 w-24"><input type="number" min="0" className={inputCls + " h-8 px-2 w-full"} value={i.qty} onChange={(e) => setItem(idx, { qty: e.target.value })} /></td>
                      <td className="p-2 w-32"><input type="number" min="0" step="0.0001" className={inputCls + " h-8 px-2 w-full"} value={i.rate} onChange={(e) => setItem(idx, { rate: e.target.value })} /></td>
                      {/* <td className="p-2">{i.kind === "module" ? <input type="number" min="1" className={inputCls + " h-8 px-2"} value={i.mo} onChange={(e) => setItem(idx, { mo: e.target.value })} /> : <span className="block text-center text-[#94A3B8]">—</span>}</td> */}
                      <td className="p-2 w-28"><input type="date" className={inputCls + " h-8 px-1"} value={i.pf} onChange={(e) => setItem(idx, { pf: e.target.value })} /></td>
                      <td className="p-2 w-28"><input type="date" className={inputCls + " h-8 px-1"} value={i.pt} onChange={(e) => setItem(idx, { pt: e.target.value })} /></td>
                      <td className="p-2 text-right text-[#334155] dark:text-white">{i.kind === "api" ? money(r2((+i.qty || 0) * (+i.rate || 0))) : money(amt(i))}</td>
                      <td className="p-2 ">
                        <button
                          type="button"
                          onClick={() => setInv((p) => ({ ...p, items: p.items.filter((_, j) => j !== idx) }))}
                          className="px-2 py-1 rounded-md flex justify-between text-xs font-semibold bg-[#FEE2E2] text-[#B91C1C] hover:bg-[#FECACA] dark:bg-[#7F1D1D] dark:text-[#FCA5A5]"
                          title=""
                        >
                          ✕ Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={addBlankModule}
              className="mt-2 h-8 px-3 rounded-lg border border-[#CBD5E1] dark:border-[#334155] text-xs font-semibold text-[#334155] dark:text-white">
              ＋ Add Module
            </button>
            <button type="button" onClick={addCustom} className="mt-2 h-8 px-3 rounded-lg border border-[#CBD5E1] dark:border-[#334155] text-xs font-semibold text-[#334155] dark:text-white">＋ Custom line</button>
          </div>


        </div>

        {/* ===== usage lines ===== */}


        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 md:col-span-6"><label className={labelCls}>Taxable Amount (₹)</label><input type="number" min="0" step="0.01" className={inputCls} value={hasRows ? T.base : inv.amount} disabled={hasRows} onChange={(e) => set("amount", e.target.value)} /></div>
          <div className="col-span-12 md:col-span-6"><label className={labelCls}>GST %</label><input type="number" min="0" step="0.01" className={inputCls} value={inv.gst} onChange={(e) => set("gst", e.target.value)} /></div>
          <div className="col-span-12 md:col-span-6"><label className={labelCls}>SAC / HSN</label><input className={inputCls} placeholder="SAC / HSN" value={inv.sac} onChange={(e) => set("sac", e.target.value)} /></div>
          <div className="col-span-12 md:col-span-6"><label className={labelCls}>Doc. No.</label><input className={inputCls} placeholder="Document Number" value={inv.inv} onChange={(e) => set("inv", e.target.value)} /></div>
          <div className="col-span-12 md:col-span-6"><label className={labelCls}>Invoice Date</label><input type="date" className={inputCls} value={inv.date} onChange={(e) => set("date", e.target.value)} /></div>
          <div className="col-span-12 md:col-span-6"><label className={labelCls}>Due Date</label><input type="date" className={inputCls} value={inv.due} onChange={(e) => set("due", e.target.value)} /></div>
        </div>
      </div>

      <div className={`${cardCls} col-span-12 xl:col-span-6`}>
        <h3 className="font-bold text-[#1E293B] dark:text-white mb-3">Bill preview</h3>
        <div className="overflow-auto max-h-[760px] rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-white p-2" dangerouslySetInnerHTML={{ __html: html }} />
        <div className="mt-3 md:mt-3 md:flex gap-2 ">
          <Button variant="outline" onClick={onDownload}>⬇ Download bill</Button>
          {onSave && (
            <Button id="save-invoice-btn" variant="save" onClick={onSave} className="mt-3 md:mt-0">
              💾 Update Invoice Data
            </Button>
          )}
        </div>

        {/* <p className={noteCls}>Download the bill as an HTML file (open it → Print → Save as PDF). Total payable: <b>{money(T.total)}</b></p> */}
      </div>
    </div >
  );
};

export default InvoiceForm;