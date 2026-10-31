"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cardCls, inputCls, labelCls, noteCls, toast } from "./utils";
import { CO_KEYS, DEF_CO, Settings } from "./Invoice";

const LABELS: Record<string, string> = {
  name: "Company name", tag: "Tagline", cin: "CIN", tax: "GSTIN", pan: "PAN", tan: "TAN", gst: "Default GST %", acno: "Bank A/C No.",
  ifsc: "IFSC", bank: "Bank & branch", for: "“For” name (signature)", brand: "Logo text", pfx: "Doc. No. prefix", next: "Next Doc. No.",
  phone: "Phone", email: "Email", addr: "Address", pay: "Payment note (footer)", note: "Extra note (footer)",
};

const SettingsPanel = ({ settings, saveSettings }: { settings: Settings; saveSettings: (s: Settings) => Promise<void> }) => {
  const [co, setCo] = useState<Record<string, string>>(settings.co);
  useEffect(() => setCo(settings.co), [settings.co]);

  const readImg = (k: "logo" | "sign", file?: File) => {
    if (!file) return;
    if (file.size > 300 * 1024) return toast("Image must be under 300 KB.", "info");
    const fr = new FileReader();
    fr.onload = () => setCo((p) => ({ ...p, [k]: String(fr.result) }));
    fr.readAsDataURL(file);
  };

  return (
    <div className={`${cardCls} space-y-3`}>
  <h3 className="font-bold text-[#1E293B] dark:text-[#FFFFFF]">Company &amp; invoice settings</h3>

  <div className="grid grid-cols-12 gap-3">
    {CO_KEYS.map((k) => (
      <div key={k} className={["addr", "pay", "note", "bank", "name"].includes(k) ? "col-span-12 md:col-span-6" : "col-span-12 md:col-span-3"}>
        <label className={labelCls}>{LABELS[k]}</label>
        <input className={inputCls} value={co[k] || ""} onChange={(e) => setCo({ ...co, [k]: e.target.value })} />
      </div>
    ))}

    {/* ═══════════════════════════════════════════
        IMAGE UPLOADS (Logo + Signature)
    ═══════════════════════════════════════════ */}
    {(["logo", "sign"] as const).map((k) => (
      <div key={k} className="col-span-12 md:col-span-6">
        <label className={labelCls}>
          {k === "logo" ? "Logo image" : "Signature image"}
          <span className="text-[#94A3B8] font-normal ml-1">(max 300 KB)</span>
        </label>

        {!co[k] ? (
          /* Empty state — dashed dropzone */
          <label className="flex items-center gap-3 h-14 px-4 rounded-xl border-2 border-dashed border-[#CBD5E1] dark:border-[#475569] bg-[#FFFFFF] dark:bg-[#1E293B] cursor-pointer hover:border-[#6366F1] hover:bg-[#EEF2FF] dark:hover:bg-[#6366F1]/10 transition-all">
            <span className="text-xl shrink-0">{k === "logo" ? "🖼️" : "✍️"}</span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#334155] dark:text-[#FFFFFF]">
                Click to upload {k === "logo" ? "logo" : "signature"}
              </p>
              <p className="text-xs text-[#94A3B8]">PNG, JPG up to 300 KB</p>
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => readImg(k, e.target.files?.[0])}
            />
          </label>
        ) : (
          /* Filled state — preview card */
          <div className="flex items-center gap-3 p-3 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#FFFFFF] dark:bg-[#1E293B]">
            <div className="w-14 h-14 rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] flex items-center justify-center overflow-hidden shrink-0">
              <img src={co[k]} alt={k} className="max-w-full max-h-full object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#334155] dark:text-[#FFFFFF]">
                {k === "logo" ? "Logo" : "Signature"} uploaded
              </p>
              <p className="text-[11px] text-[#94A3B8]">Ready to use on invoices</p>
            </div>
            <button
              type="button"
              onClick={() => setCo({ ...co, [k]: "" })}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#FEE2E2] text-[#B91C1C] hover:bg-[#FECACA] transition-colors shrink-0"
            >
              Remove
            </button>
          </div>
        )}
      </div>
    ))}
  </div>

  {/* ═══════════════════════════════════════════
      ACTION BUTTONS
  ═══════════════════════════════════════════ */}
  <div className="flex flex-wrap items-center gap-3 pt-1">
    <Button
      variant="save"
      onClick={() => saveSettings({ ...settings, co })}
      className="px-6 min-w-[140px]"
    >
      💾 Save Settings
    </Button>
    <Button
      variant="print"
      onClick={() => setCo(DEF_CO)}
      className="px-6"
    >
      ↺ Reset to Default
    </Button>
    <p className="text-xs text-[#94A3B8] dark:text-[#64748B] ml-auto hidden sm:block">
      Changes apply to newly generated invoices
    </p>
  </div>

  {/* <p className={noteCls}>Alert recipients (emails and WhatsApp numbers) are fixed in the backend and are not editable here.</p> */}
</div>
  );
};

export default SettingsPanel;