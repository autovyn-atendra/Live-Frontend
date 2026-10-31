"use client";
import React, { useEffect, useRef, useState } from "react";
import { saveAs } from "file-saver";
import { Api, docNoPattern, toast } from "./utils";
import { Entry, Inv, LogRow, QGroup, Settings, Master, billHTML, docNo, emptyInv, invFromEntries } from "./Invoice";
import InvoiceForm from "./InvoiceForm";
import ComposeEmail from "./Composeemail";
import AlertsPanel from "./Alertspanel";
import SettingsPanel from "./Settingspanel";
import HistoryPanel from "./Historypanel";

interface Props {
  api: Api; rows: Entry[]; logs: LogRow[]; settings: Settings; masters: Master[];
  saveSettings: (s: Settings, silent?: boolean) => Promise<void>;
  reloadAll: () => Promise<any>; reloadLogs: () => void; reloadSettings: () => void;
  selectedClientCode: string | null;
  onCompanySelect: (code: string | null, name: string | null) => void;
}

const InvoicesTab = ({
  api, rows, logs, settings, masters, saveSettings, reloadAll, reloadLogs, reloadSettings,
  selectedClientCode, onCompanySelect
}: Props) => {
  const co = settings.co;
  const [inv, setInv] = useState<Inv>(() => emptyInv(co));
  const top = useRef<HTMLDivElement>(null);

  // Doc. No. (auto wala) tab update ho jab settings se next number badle
  useEffect(() => {
    setInv((p) => (docNoPattern.test(p.inv) ? { ...p, inv: docNo(p.type, co) } : p));
  }, [co.next, co.pfx]); // eslint-disable-line react-hooks/exhaustive-deps

  // queue se "Prepare invoice"
  const prepare = (g: QGroup) => {
    const next = invFromEntries(g.es, co);
    next.items = next.items.map((i) => ({ ...i, on: true }));
    setInv(next);
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const download = async () => {
    if (!inv.items.some((i) => i.on) && !(+inv.amount > 0))
      return toast("Add a module or taxable amount first.", "info");

    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>${inv.inv}</title>
    <style>
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; background: #fff; }
      body { display: flex; justify-content: center; align-items: flex-start; padding: 24px; }
      @page { size: A4; margin: 8mm; }
      @media print {
        body { padding: 0; display: block; }
      }
    </style>
  </head>
  <body>${billHTML(inv, co)}</body>
</html>`;

    saveAs(
      new Blob([html], { type: "text/html;charset=utf-8" }),
      `Invoice_${String(inv.inv).replace(/[\\/]/g, "-")}.html`
    );

    try {
      await api("bumpBillingDocNo", { Doc_No: inv.inv });
      reloadSettings();
    } catch (e) {
      /* ignore */
    }
  };

  // InvoicesTab.tsx ke andar
  const handleHistoryClick = (log: LogRow) => {
    if (!log.Client_Code) return;
    const c = rows.find(r => r.Client_Code === log.Client_Code);
    if (!c) return;
    const es = rows.filter(r => r.Client_Code === log.Client_Code);
    const next = invFromEntries(es, co);
    next.inv = log.Doc_No || next.inv;
    setInv(next);
    onCompanySelect(c.Client_Code, c.Client_Name);
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const saveInvoice = async () => {
    if (!inv.cid) return toast("Please select a company first.", "info");

    try {
      // hum items ke andar se BE_ID nikaal rahe hain
      const itemsToUpdate = inv.items.filter(i => i.on).map(i => ({
        BE_ID: i.eid || null, // Agar nayi row hai to null jayega
        Module_Name: i.title,
        Qty: i.qty,
        Rate: i.rate,
        Start_Date: i.pf,
        Next_Billing_Date: i.pt || i.nx,
        GST_Percent: i.gst,
        SAC_HSN: i.sac
      }));

      const res = await api("saveBillingInvoiceData", {
        Client_Code: inv.cid,
        Doc_No: inv.inv,
        Company: {
          Client_Name: inv.name,
          Email: inv.email,
          CC_Email: inv.cc,
          Billing_Address: inv.addr,
          GSTIN: inv.gstin,
          Contact_Person: inv.person,
          Mobile_No: inv.mobile
        },
        Items: itemsToUpdate, // 👈 Ye array backend jayega
        Invoice_Data: inv
      });

      if (res?.Status) {
        toast("Invoice & Company details updated successfully!");
        reloadAll(); // 👈 Ye main data ko refresh karega (Zaroori hai!)
      } else {
        toast(res?.Message || "Failed to update", "error");
      }
    } catch (e: any) {
      toast("Error updating invoice", "error");
    }
  };

  return (
    <div className="col-span-12 space-y-4" ref={top}>
      <InvoiceForm inv={inv} setInv={setInv} rows={rows} settings={settings} masters={masters} onDownload={download} onCompanySelect={onCompanySelect} onSave={saveInvoice} />
      <ComposeEmail api={api} inv={inv} rows={rows} settings={settings} saveSettings={saveSettings} onSent={() => reloadAll()} />
      <AlertsPanel api={api} rows={rows} logs={logs} settings={settings} saveSettings={saveSettings} reloadLogs={reloadLogs} onPrepare={prepare} selectedCode={selectedClientCode} />

      <details className="group rounded-2xl border border-[#E2E8F0] dark:border-[#334155] bg-[#FFFFFF] dark:bg-[#1E293B] shadow-sm hover:shadow-md hover:border-[#C7D2FE] dark:hover:border-[#4338CA] transition-all duration-200 overflow-hidden">
        <summary className="cursor-pointer list-none flex items-center gap-3 px-5 py-4 select-none hover:bg-[#F8FAFC] dark:hover:bg-[#0F172A] transition-colors">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center shadow-md shadow-[#6366F1]/30 shrink-0">
            <span className="text-[#FFFFFF] text-base">⚙</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#1E293B] dark:text-[#FFFFFF] leading-tight">
              Company &amp; Invoice Settings
            </p>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
              Configure defaults and preferences
            </p>
          </div>
          <span className="text-[#94A3B8] dark:text-[#64748B] text-lg transition-transform duration-200 group-open:rotate-180 shrink-0">
            ▾
          </span>
        </summary>
        <div className="px-5 pb-5 pt-2 border-t border-[#E2E8F0] dark:border-[#334155]">
          <SettingsPanel settings={settings} saveSettings={saveSettings} />
        </div>
      </details>

      <details className="group rounded-2xl border border-[#E2E8F0] dark:border-[#334155] bg-[#FFFFFF] dark:bg-[#1E293B] shadow-sm hover:shadow-md hover:border-[#C7D2FE] dark:hover:border-[#4338CA] transition-all duration-200 overflow-hidden">
        <summary className="cursor-pointer list-none flex items-center gap-3 px-5 py-4 select-none hover:bg-[#F8FAFC] dark:hover:bg-[#0F172A] transition-colors">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center shadow-md shadow-[#0EA5E9]/30 shrink-0">
            <span className="text-[#FFFFFF] text-base">🕘</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#1E293B] dark:text-[#FFFFFF] leading-tight">
              Send History
            </p>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
              View past invoice and reminder logs (Tab to View History)
            </p>
          </div>
          <span className="text-[#94A3B8] dark:text-[#64748B] text-lg transition-transform duration-200 group-open:rotate-180 shrink-0">
            ▾
          </span>
        </summary>
        <div className="px-5 pb-5 pt-2 border-t border-[#E2E8F0] dark:border-[#334155]">
          <HistoryPanel logs={logs} selectedCode={selectedClientCode} onRowClick={handleHistoryClick} />
        </div>
      </details>
    </div>
  );
};

export default InvoicesTab;