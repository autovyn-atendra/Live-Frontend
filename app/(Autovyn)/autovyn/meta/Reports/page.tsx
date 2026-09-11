"use client";

import React, { useState, useEffect } from "react";

const KEY = "hrsetu_demo_v3";

export default function OnboardingReportsPage() {
  const [period, setPeriod] = useState("Last 8 weeks");
  const [avgDays, setAvgDays] = useState("2.2");
  const [goneLiveCount, setGoneLiveCount] = useState(3);
  const [onTimeCount, setOnTimeCount] = useState(3);

  const owners = [
    { name: "Bhoomika", color: "#4F46E5", handled: 5, avgGoLive: "1.8d", sla: "100%" },
    { name: "Prachi", color: "#6366F1", handled: 4, avgGoLive: "2.1d", sla: "100%" },
    { name: "Chirag", color: "#4338CA", handled: 4, avgGoLive: "2.6d", sla: "100%" },
  ];

  const [stuckSteps, setStuckSteps] = useState([
    { name: "Policy Setup", count: 2, status: "critical" as const },
    { name: "Company / Godown Master", count: 1, status: "warning" as const },
    { name: "Shift Master", count: 1, status: "success" as const },
    { name: "Employee Import", count: 1, status: "success" as const },
    { name: "Salary Structure", count: 1, status: "success" as const },
    { name: "Machine Integration", count: 1, status: "success" as const },
    { name: "Misspunch / Leave", count: 1, status: "success" as const },
    { name: "User Rights", count: 1, status: "success" as const },
    { name: "Attendance & Salary Re-run", count: 1, status: "success" as const },
    { name: "Requirements", count: 0, status: "none" as const },
    { name: "Data Restore", count: 0, status: "none" as const },
  ]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.clients && Array.isArray(parsed.clients) && parsed.clients.length > 0) {
          const clients = parsed.clients;
          const liveClients = clients.filter((c: any) => c.live || c.complete);
          if (liveClients.length > 0) {
            const sumGoLive = liveClients.reduce((acc: number, c: any) => acc + (c.goLive || 2.2), 0);
            const avg = (sumGoLive / liveClients.length).toFixed(1);
            setAvgDays(avg);
            setGoneLiveCount(liveClients.length);
            const onTime = liveClients.filter((c: any) => (c.goLive || 2.2) <= 3.0).length;
            setOnTimeCount(onTime);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  return (
    <div className="p-6 sm:p-7 min-h-full bg-[#F8FAFC] text-[#1F2937] font-sans">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
        <div>
          <div className="text-lg font-semibold tracking-wider uppercase text-[#9CA3AF] mb-1">
            WEEKLY REVIEW 
          </div>
          <h1 className="m-0 text-2xl font-bold text-[#1F2937] tracking-tight">
            Implementation Performance
          </h1>
          <p className="mt-1.5 text-lg text-[#9CA3AF]">
            Live figures · recomputed from current data.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="h-10 border border-[#CBD5E1] rounded-lg bg-white px-3 text-lg text-[#1F2937] cursor-pointer focus:outline-none focus:border-[#4F46E5]"
          >
            <option value="Last 8 weeks">Last 8 weeks</option>
            <option value="This quarter">This quarter</option>
            <option value="Year to date">Year to date</option>
          </select>

          <button
            onClick={() => alert("Performance report exported successfully (CSV/PDF)!")}
            className="h-10 px-4 rounded-lg border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#1F2937] text-lg font-semibold cursor-pointer flex items-center gap-2 shadow-2xs transition-all active:scale-95"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export
          </button>
        </div>
      </div>

      {/* ROW 1: AVG GO LIVE CARD & SLA RING */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5">
        {/* CARD 1: AVG GO-LIVE TIME */}
        <section className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs p-6 flex flex-col justify-between">
          <div>
            <div className="text-lg font-medium text-[#475569] mb-3">Avg. go-live time</div>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-5xl font-bold text-[#0F172A] tracking-tight">{avgDays}</span>
              <span className="text-2xl font-medium text-[#475569]">days</span>
              <span className="px-3.5 py-1 rounded-full bg-[#DCFCE7] text-[#16A34A] text-sm font-semibold ml-2">
                within target
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-[#F1F5F9] grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm font-medium text-[#94A3B8] mb-1">Target</div>
              <div className="text-xl font-bold text-[#16A34A]">3.0 days</div>
            </div>
            <div>
              <div className="text-sm font-medium text-[#94A3B8] mb-1">Clients gone live</div>
              <div className="text-xl font-bold text-[#0F172A]">{goneLiveCount}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-[#94A3B8] mb-1">On-time</div>
              <div className="text-xl font-bold text-[#16A34A]">{onTimeCount}</div>
            </div>
          </div>
        </section>

        {/* SLA Ring */}
        <section className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs p-6 flex flex-col">
          <div className="text-lg font-semibold text-[#64748B] mb-3">SLA Hit-Rate</div>
          <div className="flex-1 flex items-center justify-center gap-6">
            {/* SVG Ring */}
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg width="160" height="160" viewBox="0 0 38 38" className="-rotate-90">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#FEE2E2"
                  strokeWidth="3.8"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#16A34A"
                  strokeWidth="3.8"
                  strokeDasharray="78, 100"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-[#1F2937]">78%</span>
                <span className="text-lg font-semibold text-[#16A34A]">Target 85%</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-xs bg-[#16A34A]"></span>
                <div>
                  <div className="text-lg font-bold text-[#1F2937]">39 on time</div>
                  <div className="text-lg text-[#94A3B8]">Within 3 days</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-xs bg-[#DC2626]"></span>
                <div>
                  <div className="text-lg font-bold text-[#1F2937]">11 missed</div>
                  <div className="text-lg text-[#94A3B8]">Breached SLA</div>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center text-lg text-[#94A3B8] mt-3 pt-3 border-t border-[#F1F5F9]">
            50 total dealerships onboarded in last 8 weeks
          </div>
        </section>
      </div>
      {/* OWNER SCORECARDS */}
      <div className="text-lg font-bold tracking-wider uppercase text-[#94A3B8] mb-3">
        OWNER SCORECARDS
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {owners.map((ow) => (
          <div key={ow.name} className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-12 h-12 rounded-full text-white flex items-center justify-center text-xl font-bold shrink-0"
                  style={{ backgroundColor: ow.color }}
                >
                  {ow.name.slice(0, 1)}
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#1F2937] leading-tight">{ow.name}</div>
                  <div className="text-lg text-[#94A3B8] mt-0.5">Implementation owner</div>
                </div>
              </div>
              <span className="text-xl font-bold text-[#16A34A] bg-[#DCFCE7] px-2.5 py-0.5 rounded-full">
                {ow.sla}
              </span>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <div className="text-2xl font-bold text-[#0F172A] leading-tight">{ow.handled}</div>
                <div className="text-xl text-[#94A3B8] mt-0.5">clients handled</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-[#16A34A] leading-tight">{ow.avgGoLive}</div>
                <div className="text-xl text-[#94A3B8] mt-0.5">avg. go-live</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ROW 2: WHERE CLIENTS GET STUCK */}
      <section className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs p-6 mb-5">
        <div className="mb-6">
          <h2 className="m-0 text-xl font-bold text-[#1F2937]">Where clients get stuck</h2>
          <p className="mt-1 text-sm text-[#64748B]">
            Active clients currently sitting at each step — longest bar is the live bottleneck.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {stuckSteps.map((step) => {
            const isCritical = step.status === "critical";
            const isWarning = step.status === "warning";
            const isSuccess = step.status === "success";

            return (
              <div key={step.name} className="flex items-center gap-3.5">
                <div className="w-56 text-right text-sm font-medium text-[#334155] shrink-0">
                  {step.name}
                </div>
                <div className="flex-1 h-8 bg-[#F8FAFC] rounded-lg overflow-hidden flex items-center px-0.5">
                  {step.count > 0 ? (
                    <div
                      className={`h-full rounded-md flex items-center justify-end pr-2.5 text-lg font-bold text-white transition-all duration-300 ${
                        isCritical
                          ? "bg-[#DC2626]"
                          : isWarning
                          ? "bg-[#F59E0B]"
                          : "bg-[#16A34A]"
                      }`}
                      style={{
                        width: step.count === 2 ? "100%" : "45%",
                      }}
                    >
                      {step.count}
                    </div>
                  ) : (
                    <div className="w-1.5 h-6 bg-[#E2E8F0] rounded-full ml-1" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

     
    </div>
  );
}
