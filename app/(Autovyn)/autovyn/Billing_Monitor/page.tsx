"use client";
import React, { useEffect, useMemo, useState } from "react";
import { FaTasks } from "react-icons/fa";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { makeApi, todayYMD, dmy } from "./utils";
import { useBillingData } from "./hooks";
import { pendingAlerts } from "./Invoice";
import OtpGate from "./Otpgate";
import MonitorTab from "./MonitorTab";
import InvoicesTab from "./InvoicesTab";
import MastersTab from "./Masterstab";

type Tab = "monitor" | "invoices" | "masters";

const ClientBillingMonitorPage = () => {
  const user = useCurrentUser();
  const headers = useMemo(() => ({ compcode: user?.Comp_Code, name: user?.name, token: user?.email }), [user?.Comp_Code, user?.name, user?.email]);
  const api = useMemo(() => makeApi(headers), [headers]);

  const [verified, setVerified] = useState(false);
  const [tab, setTab] = useState<Tab>("monitor");
  const d = useBillingData(api, verified && !!user?.Comp_Code);
  const [addMode, setAddMode] = useState<null | "new" | "old">(null);
  const [scrollToAlerts, setScrollToAlerts] = useState(false);
  const [selectedClientCode, setSelectedClientCode] = useState<string | null>(null);
  const [selectedClientName, setSelectedClientName] = useState<string | null>(null);
  const handleCompanySelect = (code: string | null, name: string | null) => {
    setSelectedClientCode(code);
    setSelectedClientName(name);
  };
  // Tab badalte hi us tab ka data fresh load karo
  useEffect(() => {
    if (!verified) return;
    if (tab === "masters") { d.loadMasters(); d.loadModels(); }
    if (tab === "monitor") { d.loadRows(); d.loadMasters(); d.loadModels(); }
    if (tab === "invoices") { d.loadRows(); d.loadMasters(); d.loadLogs(); d.loadSettings(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    console.log("loadMasters called");
  }, [tab, verified]);

  useEffect(() => {
    if (!scrollToAlerts) return;
    if (tab !== "invoices") return;
    const el = document.getElementById("billing-alerts");
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setScrollToAlerts(false);
  }, [tab, scrollToAlerts]);

  if (!verified) return <OtpGate api={api} enabled={!!user?.Comp_Code} onVerified={() => setVerified(true)} />;

  // Auto-detect mode me tab par red count
  const pending = d.settings.auto.mode === "auto" ? pendingAlerts(d.rows, d.settings, d.logs).length : 0;

  const tabs: { k: Tab; label: string; badge?: number }[] = [
    { k: "monitor", label: "📊 Billing Monitor" },
    { k: "invoices", label: "✉ Invoices", },
    { k: "masters", label: "🧩 Masters" },
  ];

  return (
    <div className="grid grid-cols-12 gap-4 w-full pb-2">
      {/* ===== Header ===== */}
      <div className="col-span-12 bg-header px-6 py-2 shadow-lg dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]">
        <div className="md:flex md:justify-between items-center space-y-2 md:space-y-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><FaTasks size={22} className="text-save" /></div>
            <div>
              <h1 className="font-bold text-lg text-white uppercase tracking-wide">Billing Monitor</h1>
              <p className="text-xs text-white/60">Track clients, invoices and billing cycles in one place · Today: {dmy(todayYMD())}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => { setTab("monitor"); setAddMode("new"); }} className="px-5">＋ Add Company</Button>
            <Button variant="print" onClick={() => window.history.back()} className="px-7">Back</Button>
          </div>
        </div>
      </div>

      {/* ===== Tabs (segmented pill style) ===== */}
      <div className="col-span-12 flex justify-between">
        <div className="inline-flex max-w-full flex-wrap items-center gap-1 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-1.5 shadow-sm dark:border-[#334155] dark:bg-[#0F172A]">
          {tabs.map((t) => {
            const active = tab === t.k;
            return (
              <button
                key={t.k}
                onClick={() => setTab(t.k)}
                aria-selected={active}
                className={`relative flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold tracking-wide transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]/50 ${active
                  ? "bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white shadow-lg shadow-indigo-500/30 scale-[1.02]"
                  : "text-[#64748B] hover:bg-white hover:text-[#1E293B] hover:shadow-sm dark:text-[#94A3B8] dark:hover:bg-[#1E293B] dark:hover:text-white"
                  }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full transition-colors ${active ? "bg-emerald-400" : "bg-[#CBD5E1] dark:bg-[#475569]"}`} />
                {t.label}
                {!!t.badge && (
                  <span className="relative inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#DC2626] px-1.5 text-[11px] font-bold text-white">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#DC2626] opacity-50" />
                    <span className="relative">{t.badge}</span>
                  </span>
                )}
              </button>
            );
          })}


        </div>
        <div className="flex justify-end gap-3">
          {/* <button
            onClick={() => {
              setTab("invoices");
              setScrollToAlerts(true);
            }}
            className="relative flex items-center gap-2 rounded-xl bg-[#EEF2FF] px-5 py-2.5 text-sm font-semibold tracking-wide text-[#4338CA] shadow-sm transition-all duration-200 hover:bg-[#E0E7FF] hover:shadow-md dark:bg-[#312E81] dark:text-[#C7D2FE] dark:hover:bg-[#3730A3]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#6366F1]" />
            🔔 Reminders {pending}
          </button> */}

          <button
            onClick={() => {
              setTab("invoices");
              setScrollToAlerts(true);
            }}
            className="relative flex items-center gap-2 rounded-xl bg-[#EEF2FF] px-5 py-2.5 text-sm font-semibold tracking-wide text-[#4338CA] shadow-sm transition-all duration-200 hover:bg-[#E0E7FF] hover:shadow-md dark:bg-[#312E81] dark:text-[#C7D2FE] dark:hover:bg-[#3730A3]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#6366F1]" />

            {/* Yahan Text hai */}
            🔔 Reminders

            {/* Yahan Blinking Badge lagaya gaya hai */}
            {pending > 0 && (
              <span className="relative inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#DC2626] px-1.5 text-[11px] font-bold text-white ml-1">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#DC2626] opacity-50" />
                <span className="relative">{pending}</span>
              </span>
            )}
          </button>

          {tab === "invoices" && (
            <button
              onClick={() => {
                // Ye line button ko dhundhegi aur click karegi
                const btn = document.getElementById("save-invoice-btn");
                if (btn) btn.click();
                else alert("Please select a company first to update.");
              }}
              className="relative flex items-center gap-2 rounded-xl bg-[#F0FDF4] px-5 py-2.5 text-sm font-semibold tracking-wide text-[#15803D] shadow-sm transition-all duration-200 hover:bg-[#DCFCE7] hover:shadow-md dark:bg-[#166534] dark:text-[#4ADE80] dark:hover:bg-[#14532D]"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" />
              💾 Update
            </button>
          )}
        </div>
      </div>

      {/* ===== Tab content ===== */}
      {tab === "monitor" && (
        <MonitorTab api={api} user={user} rows={d.rows} loading={d.loading} masters={d.masters} models={d.models}
          reload={d.loadRows} reloadModels={d.loadModels} addMode={addMode} onAddDone={() => setAddMode(null)} onSwitchAdd={(m) => setAddMode(m)} />
      )}
      {tab === "invoices" && (
        <InvoicesTab api={api} rows={d.rows} logs={d.logs} settings={d.settings} masters={d.masters} saveSettings={d.saveSettings}
          reloadAll={d.reloadAll} reloadLogs={d.loadLogs} reloadSettings={d.loadSettings}
          selectedClientCode={selectedClientCode}             // 👈 Ye add karein
          onCompanySelect={handleCompanySelect}
        />
      )}
      {tab === "masters" && (
        <MastersTab api={api} rows={d.rows} masters={d.masters} models={d.models}
          reloadMasters={d.loadMasters} reloadModels={d.loadModels} />
      )}
    </div>
  );
};

export default ClientBillingMonitorPage;