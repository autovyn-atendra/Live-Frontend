"use client";
import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Entry } from "./Invoice";
import { inputCls, thCls, tdCls } from "./utils";

const CompaniesModal = ({ rows, onClose }: { rows: Entry[]; onClose: () => void }) => {
  const [q, setQ] = useState("");
  
  const companies = useMemo(() => {
    const by: Record<string, { code: string; name: string; modules: Set<string> }> = {};
    rows.forEach((r) => {
      const k = r.Client_Code;
      if (!by[k]) by[k] = { code: k, name: r.Client_Name, modules: new Set() };
      by[k].modules.add(r.Module_Name);
    });
    
    // Array me convert karo aur Code ke hisaab se sort karo
    return Object.values(by).sort((a, b) => {
      return a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [rows]);

  const visible = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return companies;
    return companies.filter((c) => [c.code, c.name, ...c.modules].some((x) => String(x).toLowerCase().includes(t)));
  }, [companies, q]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-xl bg-white dark:bg-[#1E293B] shadow-xl border border-[#E2E8F0] dark:border-[#334155]">
        <div className="px-6 py-4 flex justify-between items-center border-b">
          <h2 className="text-lg font-bold text-[#1E293B] dark:text-white">All Companies ({companies.length})</h2>
          <button onClick={onClose} className="text-[#64748B] text-xl">✕</button>
        </div>
        <div className="px-6 py-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} className={inputCls} placeholder="Search company or module" />
        </div>
        <div className="px-6 pb-4 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F8FAFC] dark:bg-[#0F172A]">
              <tr>{["Company ID", "Company Name", "Modules"].map((h) => <th key={h} className={thCls}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {visible.map((c) => (
                <tr key={c.code} className="border-t border-[#F1F5F9] dark:border-[#334155]">
                  <td className={tdCls}>{c.code}</td>
                  <td className={tdCls}>{c.name}</td>
                  <td className={tdCls}>{[...c.modules].join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 flex justify-end border-t">
          <Button variant="print" onClick={onClose} className="px-6">Close</Button>
        </div>
      </div>
    </div>
  );
};

export default CompaniesModal;