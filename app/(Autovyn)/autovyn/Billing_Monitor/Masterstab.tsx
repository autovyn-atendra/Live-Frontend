"use client";
import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Api, FQ, money, tdCls, thCls } from "./utils";
import { Entry, Master, PModel } from "./Invoice";
import MasterModal from "./Mastermodal";

interface Props {
  api: Api; rows: Entry[]; masters: Master[]; models: PModel[]; reloadMasters: () => void; reloadModels: () => void;
}

const MastersTab = ({ api, rows, masters, models, reloadMasters, reloadModels }: Props) => {
  const [kind, setKind] = useState<"module" | "api">("module");
  const [modal, setModal] = useState<null | { row?: Master }>(null);

  const list = useMemo(() => masters.filter((m) => m.Kind === kind), [masters, kind]);
  const used = (m: Master) => new Set(rows.filter((r) => r.BMM_ID === m.BMM_ID || r.Module_Name === m.Name).map((r) => r.Client_Code)).size;
  const pmName = (k: string) => models.find((m) => m.Model_Key === k)?.Model_Name || k;
  const live = list.filter((m) => m.Is_Live).length;

  const seg = (on: boolean) => `px-5 h-10 text-sm font-semibold transition-colors ${on ? "bg-[#4F46E5] text-white" : "text-[#64748B] dark:text-[#94A3B8]"}`;

  return (
    <>
      <div className="col-span-12 flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-xl overflow-hidden border border-[#E2E8F0] dark:border-[#334155] bg-[#F4F5FB] dark:bg-[#0F172A]">
          <button className={seg(kind === "module")} onClick={() => setKind("module")}>Module Master</button>
          <button className={seg(kind === "api")} onClick={() => setKind("api")}>Third-Party API Master</button>
        </div>
        <Button variant="save" onClick={() => setModal({})} className="px-5">{kind === "module" ? "＋ New Module" : "＋ New Third-Party API"}</Button>
      </div>

      <div className="col-span-12 bg-white dark:bg-[#1E293B] rounded-xl shadow border border-[#E2E8F0] dark:border-[#334155] overflow-hidden">
        <div className="px-6 py-3 border-b border-[#E2E8F0] dark:border-[#334155]">
          <p className="text-base text-[#64748B] dark:text-[#CBD5E1]">
            Total: <span className="font-semibold text-[#334155] dark:text-white">{list.length}</span>
            <span className="mx-2">·</span>Live: <span className="font-semibold text-[#16A34A]">{live}</span>
            <span className="mx-2">·</span>Not Live: <span className="font-semibold text-[#DC2626]">{list.length - live}</span>
          </p>
        </div>
        <div className="overflow-auto max-h-[480px]">
          <table className="w-full text-sm min-w-[1100px]">
            <thead className="sticky top-0 bg-[#F8FAFC] dark:bg-[#0F172A]">
              <tr className="border-b border-[#E2E8F0] dark:border-[#334155]">
                {[kind === "module" ? "Module" : "Third-Party API",
                 "Pricing model", 
                 "Unit",
                  ...(kind === "module" ? ["Min units"] : []), "Rate", "Frequency", "GST %", "SAC / HSN", "Companies using", "Status"].map((h) => (
                  <th key={h} className={thCls}>{h}</th>
                ))}
                <th className={thCls + " text-center"}>Action</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-8 text-[#94A3B8] italic">No {kind === "module" ? "modules" : "APIs"} added yet</td></tr>
              ) : (
                list.map((m) => (
                  <tr key={m.BMM_ID} className="border-b border-[#F1F5F9] dark:border-[#334155] hover:bg-[#F8FAFC] dark:hover:bg-[#0F172A]">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="font-medium text-[#334155] dark:text-white">{m.Name}</p>
                      {m.Description && <p className="text-xs text-[#94A3B8] max-w-[260px] truncate">{m.Description}</p>}
                    </td>
                    <td className={tdCls}>{pmName(m.Pricing_Model)}</td>
                    <td className={tdCls}>{m.Unit_Label}</td>
                    {kind === "module" && <td className={tdCls}>{m.Min_Qty}</td>}
                    <td className="px-4 py-3 whitespace-nowrap text-[#334155] dark:text-white">{money(m.Rate)}</td>
                    <td className={tdCls}>{FQ[m.Frequency]}</td>
                    <td className={tdCls}>{m.GST_Percent}%</td>
                    <td className={tdCls}>{m.SAC_HSN || ""}</td>
                    <td className={tdCls}>{used(m)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${m.Is_Live ? "bg-[#DCFCE7] text-[#15803D]" : "bg-[#FEE2E2] text-[#B91C1C]"}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />{m.Is_Live ? "Live" : "Not Live"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => setModal({ row: m })} className="px-3 py-1 rounded-md text-sm font-medium bg-[#DBEAFE] text-[#1D4ED8] hover:bg-[#BFDBFE] dark:bg-[#1E3A8A] dark:text-[#93C5FD]">Edit</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <MasterModal api={api} kind={kind} row={modal.row} models={models} masters={masters}
          onClose={() => setModal(null)} onSaved={() => { setModal(null); reloadMasters(); }} reloadModels={reloadModels} />
      )}
    </>
  );
};

export default MastersTab;