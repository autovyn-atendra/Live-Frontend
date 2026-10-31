"use client";
import React, { useMemo, useState } from "react";
import { Api, cardCls, dayDiff, dmy, inputCls, labelCls, money, noteCls, toast } from "./utils";
import { Entry, LogRow, QGroup, Settings, alertSent, groupTotal, queueGroups } from "./Invoice";

interface Props {
  api: Api; rows: Entry[]; logs: LogRow[]; settings: Settings;
  saveSettings: (s: Settings, silent?: boolean) => Promise<void>; reloadLogs: () => void; onPrepare: (g: QGroup) => void;
  selectedCode?: string | null;
}

const AlertsPanel = ({ api, rows, logs, settings, saveSettings, reloadLogs, onPrepare,selectedCode  }: Props) => {
  const co = settings.co;
  const [busy, setBusy] = useState<string>("");
  const days = +settings.auto.days;
  // const groups = useMemo(() => queueGroups(rows, days), [rows, days]);
  const allGroups = useMemo(() => queueGroups(rows, days), [rows, days]);
  
  // 👈 Yahan filter karein
  const groups = useMemo(() => {
    if (!selectedCode) return allGroups;
    return allGroups.filter(g => g.cid === selectedCode);
  }, [allGroups, selectedCode]);

  const setAuto = (p: Partial<Settings["auto"]>) => saveSettings({ ...settings, auto: { ...settings.auto, ...p } }, true);

  const send = async (channel: "email" | "whatsapp", g?: QGroup) => {
    const key = `${channel}-${g?.cid || "all"}`;
    try {
      setBusy(key);
      const res = await api("sendBillingAlert", { Channel: channel, Days: days, Client_Code: g?.cid });
      toast(res?.Message || (res?.Status ? "Alert sent" : "Alert failed"), res?.Status ? "success" : "error");
      reloadLogs();
    } catch (e: any) {
      toast(e?.response?.data?.Message || "Alert failed", "error");
    } finally {
      setBusy("");
    }
  };

  const badge = (d: number) =>
    d < 0 ? { t: `${Math.abs(d)}d overdue`, c: "bg-[#FEE2E2] text-[#B91C1C] dark:bg-[#DC2626]/20 dark:text-[#F87171]" }
      : d === 0 ? { t: "Due today", c: "bg-[#FFEDD5] text-[#C2410C] dark:bg-[#F97316]/20 dark:text-[#FDBA74]" }
        : { t: `in ${d} days`, c: d <= 3 ? "bg-[#FEF3C7] text-[#B45309] dark:bg-[#F59E0B]/20 dark:text-[#FCD34D]" : "bg-[#EEF2FF] text-[#4338CA] dark:bg-[#6366F1]/20 dark:text-[#818CF8]" };

  const seg = (on: boolean) =>
    `flex-1 h-10 text-sm font-semibold transition-all rounded-lg ${on
      ? "bg-[#FFFFFF] dark:bg-[#1E293B] text-[#4F46E5] dark:text-[#818CF8] shadow-sm ring-1 ring-[#4F46E5]/20"
      : "text-[#64748B] dark:text-[#94A3B8] hover:text-[#334155] dark:hover:text-[#FFFFFF]"
    }`;

  const btn = "h-8 px-3 rounded-lg text-xs font-semibold border disabled:opacity-60 disabled:cursor-not-allowed transition-all";

  return (
    <div id="billing-alerts" className={`${cardCls} space-y-5`}>

      {/* ═══════════════════════════════════════════
          HEADER
      ═══════════════════════════════════════════ */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#F97316] flex items-center justify-center shadow-md shadow-[#F59E0B]/30 shrink-0">
          <span className="text-[#FFFFFF] text-base">🔔</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-[#1E293B] dark:text-[#FFFFFF] leading-tight">
            3. Billing Alerts &amp; Invoice Reminders
          </h3>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
            Notify admins about upcoming and overdue billing
          </p>
        </div>
        {groups.length > 0 && (
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#DC2626] dark:text-[#F87171] bg-[#FEE2E2] dark:bg-[#DC2626]/20 px-2.5 py-1 rounded-full shrink-0">
            {groups.length} pending
          </span>
        )}
      </div>

      {/* ═══════════════════════════════════════════
          SETTINGS ROW
      ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-12 gap-3 items-end">
        <div className="col-span-12 md:col-span-4">
          <label className={labelCls}>Alert mode</label>
          <div className="flex rounded-xl overflow-hidden border border-[#E2E8F0] dark:border-[#334155] bg-[#F4F5FB] dark:bg-[#0F172A] p-1 gap-1">
            <button type="button" className={seg(settings.auto.mode === "manual")} onClick={() => setAuto({ mode: "manual" })}>
              Manual
            </button>
            <button type="button" className={seg(settings.auto.mode === "auto")} onClick={() => setAuto({ mode: "auto" })}>
              Auto-detect
            </button>
          </div>
        </div>
        <div className="col-span-12 md:col-span-3">
          <label className={labelCls}>Alert before (days)</label>
          <select className={inputCls} value={settings.auto.days} onChange={(e) => setAuto({ days: +e.target.value })}>
            {[3, 7, 15, 30, 45].map((d) => <option key={d} value={d}>{d} days</option>)}
          </select>
        </div>
         

        <div className="col-span-12 md:col-span-5">
          <label className={labelCls}>Channels</label>
          <div className="flex items-center gap-2 h-10">

            {/* ═══════════ EMAIL TOGGLE CARD ═══════════ */}
            <label
              className={`group relative flex items-center gap-2 px-3 h-9 rounded-lg border-2 cursor-pointer transition-all duration-200 flex-1 ${settings.auto.e
                  ? "bg-[#EEF2FF] dark:bg-[#6366F1]/20 border-[#6366F1] dark:border-[#818CF8] shadow-sm shadow-[#6366F1]/20"
                  : "bg-[#FFFFFF] dark:bg-[#1E293B] border-[#E2E8F0] dark:border-[#334155] hover:border-[#C7D2FE] dark:hover:border-[#4338CA]"
                }`}
            >
              <input
                type="checkbox"
                checked={settings.auto.e}
                onChange={(e) => setAuto({ e: e.target.checked })}
                className="sr-only"
              />
              {/* Custom check indicator */}
              <span
                className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 transition-all duration-200 ${settings.auto.e
                    ? "bg-[#6366F1] text-[#FFFFFF]"
                    : "bg-[#FFFFFF] dark:bg-[#0F172A] border-2 border-[#CBD5E1] dark:border-[#475569]"
                  }`}
              >
                {settings.auto.e && (
                  <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3">
                    <path d="M3 8L7 12L13 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className={`text-sm font-semibold transition-colors ${settings.auto.e
                  ? "text-[#4F46E5] dark:text-[#818CF8]"
                  : "text-[#64748B] dark:text-[#94A3B8] group-hover:text-[#334155] dark:group-hover:text-[#E2E8F0]"
                }`}>
                ✉ Email
              </span>
            </label>

            {/* ═══════════ WHATSAPP TOGGLE CARD ═══════════ */}
            <label
              className={`group relative flex items-center gap-2 px-3 h-9 rounded-lg border-2 cursor-pointer transition-all duration-200 flex-1 ${settings.auto.w
                  ? "bg-[#DCFCE7] dark:bg-[#16A34A]/20 border-[#16A34A] dark:border-[#4ADE80] shadow-sm shadow-[#16A34A]/20"
                  : "bg-[#FFFFFF] dark:bg-[#1E293B] border-[#E2E8F0] dark:border-[#334155] hover:border-[#BBF7D0] dark:hover:border-[#166534]"
                }`}
            >
              <input
                type="checkbox"
                checked={settings.auto.w}
                onChange={(e) => setAuto({ w: e.target.checked })}
                className="sr-only"
              />
              {/* Custom check indicator */}
              <span
                className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 transition-all duration-200 ${settings.auto.w
                    ? "bg-[#16A34A] text-[#FFFFFF]"
                    : "bg-[#FFFFFF] dark:bg-[#0F172A] border-2 border-[#CBD5E1] dark:border-[#475569]"
                  }`}
              >
                {settings.auto.w && (
                  <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3">
                    <path d="M3 8L7 12L13 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className={`text-sm font-semibold transition-colors ${settings.auto.w
                  ? "text-[#15803D] dark:text-[#4ADE80]"
                  : "text-[#64748B] dark:text-[#94A3B8] group-hover:text-[#334155] dark:group-hover:text-[#E2E8F0]"
                }`}>
                💬 WhatsApp
              </span>
            </label>

          </div>
        </div>
      </div>

      <p className={noteCls}>
        Auto-detect shows a red count on the tab for companies whose alert is still pending.
      </p>

      {/* ═══════════════════════════════════════════
          SUMMARY BULK ACTIONS
      ═══════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-gradient-to-br from-[#EEF2FF] to-[#F8FAFC] dark:from-[#6366F1]/10 dark:to-[#0F172A] border border-[#C7D2FE] dark:border-[#4338CA] p-4">
        <div className="flex items-center gap-3 mr-auto min-w-0">
          <div className="w-9 h-9 rounded-lg bg-[#FFFFFF] dark:bg-[#1E293B] flex items-center justify-center text-base shadow-sm shrink-0">
            📢
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#1E293B] dark:text-[#FFFFFF]">
              Bulk alert for {groups.length} {groups.length === 1 ? "company" : "companies"}
            </p>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
              Due in the next {days} days
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            disabled={!groups.length || !!busy}
            onClick={() => send("email")}
            className={`${btn} border-[#C7D2FE] dark:border-[#4338CA] bg-[#FFFFFF] dark:bg-[#1E293B] text-[#4338CA] dark:text-[#818CF8] hover:bg-[#EEF2FF] dark:hover:bg-[#6366F1]/10`}
          >
            {busy === "email-all" ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-[#4338CA]/30 border-t-[#4338CA] rounded-full animate-spin" />
                Sending...
              </span>
            ) : "✉ Email all"}
          </button>
          <button
            disabled={!groups.length || !!busy}
            onClick={() => send("whatsapp")}
            className={`${btn} border-[#BBF7D0] dark:border-[#166534] bg-[#FFFFFF] dark:bg-[#1E293B] text-[#15803D] dark:text-[#4ADE80] hover:bg-[#F0FDF4] dark:hover:bg-[#16A34A]/10`}
          >
            {busy === "whatsapp-all" ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-[#15803D]/30 border-t-[#15803D] rounded-full animate-spin" />
                Sending...
              </span>
            ) : "💬 WhatsApp all"}
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          COMPANY LIST
      ═══════════════════════════════════════════ */}
      {groups.length === 0 ? (
        <div className="py-10 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F1F5F9] dark:bg-[#0F172A] flex items-center justify-center text-2xl opacity-60 mb-2">
            ✅
          </div>
          <p className="text-sm font-semibold text-[#64748B] dark:text-[#94A3B8]">
            All caught up
          </p>
          <p className="text-xs text-[#94A3B8] dark:text-[#64748B] mt-1">
            No billing dates approaching in the next {days} days
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {groups.map((g) => {
            const d = dayDiff(g.earliest), b = badge(d), tot = groupTotal(g, co);
            const eDone = alertSent(logs, g, "email"), wDone = alertSent(logs, g, "whatsapp");
            return (
              <div
                key={g.cid}
                className="rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#FFFFFF] dark:bg-[#1E293B] p-4 hover:shadow-md hover:border-[#C7D2FE] dark:hover:border-[#4338CA] transition-all"
              >
                <div className="flex flex-wrap items-center gap-3">
                  {/* Company info */}
                  <div className="min-w-[220px] flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-[#1E293B] dark:text-[#FFFFFF] truncate">
                        {g.name}
                      </p>
                      <span className="text-xs text-[#94A3B8] font-mono shrink-0">
                        ({g.cid})
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 truncate">
                      {g.es.map((e) => e.Module_Name).join(", ")}
                    </p>
                  </div>

                  {/* Due + amount */}
                  <div className="text-right shrink-0">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${b.c}`}>
                      {b.t}
                    </span>
                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1.5 font-medium">
                      {dmy(g.earliest)}
                      {tot ? <span className="text-[#1E293B] dark:text-[#FFFFFF] font-semibold"> · {money(tot)}</span> : ""}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <button
                      className={`${btn} border-[#CBD5E1] dark:border-[#475569] bg-[#FFFFFF] dark:bg-[#1E293B] text-[#334155] dark:text-[#E2E8F0] hover:bg-[#F8FAFC] dark:hover:bg-[#0F172A]`}
                      onClick={() => onPrepare(g)}
                    >
                      📄 Prepare Invoice
                    </button>

                    <button
                      disabled={!!busy}
                      onClick={() => send("email", g)}
                      className={`${btn} ${eDone
                          ? "border-[#BBF7D0] dark:border-[#166534] bg-[#DCFCE7] dark:bg-[#16A34A]/20 text-[#15803D] dark:text-[#4ADE80]"
                          : "border-[#C7D2FE] dark:border-[#4338CA] bg-[#EEF2FF] dark:bg-[#6366F1]/20 text-[#4338CA] dark:text-[#818CF8] hover:bg-[#E0E7FF] dark:hover:bg-[#6366F1]/30"
                        }`}
                    >
                      {busy === `email-${g.cid}` ? (
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                          Sending...
                        </span>
                      ) : eDone ? "✓ Email sent" : "✉ Email"}
                    </button>

                    <button
                      disabled={!!busy}
                      onClick={() => send("whatsapp", g)}
                      className={`${btn} ${wDone
                          ? "border-[#BBF7D0] dark:border-[#166534] bg-[#DCFCE7] dark:bg-[#16A34A]/20 text-[#15803D] dark:text-[#4ADE80]"
                          : "border-[#BBF7D0] dark:border-[#166534] bg-[#F0FDF4] dark:bg-[#16A34A]/10 text-[#15803D] dark:text-[#4ADE80] hover:bg-[#DCFCE7] dark:hover:bg-[#16A34A]/20"
                        }`}
                    >
                      {busy === `whatsapp-${g.cid}` ? (
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                          Sending...
                        </span>
                      ) : wDone ? "✓ WhatsApp sent" : "💬 WhatsApp"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AlertsPanel;