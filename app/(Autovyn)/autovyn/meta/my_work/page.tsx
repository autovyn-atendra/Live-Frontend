"use client";

import React, { useState, useEffect } from "react";

// ============================================================
// CONSTANTS & SEED DATA
// ============================================================
const KEY = "hrsetu_demo_v3";

const STEP_NAMES = [
  "Requirements",
  "Data Restore",
  "Company / Godown Master",
  "Shift Master",
  "Employee Import",
  "Salary Structure",
  "Machine Integration",
  "Misspunch / Leave",
  "Policy Setup",
  "User Rights",
  "Attendance & Salary Re-run",
];

const REQ_TEMPLATE: [string, string[]][] = [
  ["Company", ["GST & PAN documents", "Company registration certificate", "Godown / branch list"]],
  ["Employee", ["Employee master sheet", "Bank & UAN details"]],
  ["Salary", ["Salary structure template", "CTC breakup rules"]],
  ["Attendance", ["Shift definitions", "Machine device IDs"]],
  ["Policy", ["Leave policy document", "Misspunch rules"]],
  ["Access", ["Admin user list", "Role & rights matrix"]],
];

const OWNER_COLOR: Record<string, string> = {
  Bhoomika: "#4F46E5",
  Prachi: "#6366F1",
  Chirag: "#4338CA",
};

interface ClientItem {
  id: string;
  name: string;
  city: string;
  type: "4W" | "2W";
  owner: string;
  contact: string;
  phone: string;
  onboard: string;
  day: number;
  idx: number;
  blocked: boolean;
  complete: boolean;
  live: boolean;
  goLive?: number;
  steps: Array<{ name: string; state: "done" | "active" | "pending"; by?: string; when?: string }>;
  req: Array<{ cat: string; items: Array<{ name: string; status: "Pending" | "Partial" | "Received" }> }>;
  activity: Array<{ type: string; text: string; who: string; ts: number }>;
}

const seedData = (): ClientItem[] => {
  const mkSteps = (idx: number, isLive: boolean, owner: string) => {
    return STEP_NAMES.map((name, i) => {
      if (isLive || i < idx) {
        return { name, state: "done" as const, by: owner, when: `${idx - i + 1}d ago` };
      }
      if (i === idx) {
        return { name, state: "active" as const, by: owner, when: "In progress" };
      }
      return { name, state: "pending" as const };
    });
  };

  const mkReq = (complete = false) => {
    return REQ_TEMPLATE.map(([cat, items]) => ({
      cat: cat as string,
      items: (items as string[]).map((name) => ({
        name,
        status: complete ? ("Received" as const) : ("Pending" as const),
      })),
    }));
  };

  return [
    {
      id: "C-114",
      name: "Sri Balaji Motors",
      city: "Nagpur",
      type: "4W",
      owner: "Bhoomika",
      contact: "Mr. Iyer",
      phone: "+91 90000 55221",
      onboard: "04 Aug 2026",
      day: 3,
      idx: 8,
      blocked: false,
      complete: false,
      live: false,
      steps: mkSteps(8, false, "Bhoomika"),
      req: mkReq(true),
      activity: [
        { type: "call", text: "Logged a call — discussed salary template with HR", who: "Bhoomika", ts: Date.now() - 7200000 },
        { type: "whatsapp", text: "Sent WhatsApp reminder for machine integration IDs", who: "Bhoomika", ts: Date.now() - 18000000 },
        { type: "done", text: "Step 8 · Misspunch / Leave completed", who: "Bhoomika", ts: Date.now() - 86400000 },
      ],
    },
    {
      id: "C-101",
      name: "Rana Motors",
      city: "Jaipur",
      type: "4W",
      owner: "Bhoomika",
      contact: "Vikram Rana",
      phone: "+91 98290 12345",
      onboard: "07 Aug 2026",
      day: 5,
      idx: 5,
      blocked: false,
      complete: false,
      live: false,
      steps: mkSteps(5, false, "Bhoomika"),
      req: mkReq(false),
      activity: [
        { type: "call", text: "Logged a call — no answer, will retry evening", who: "Bhoomika", ts: Date.now() - 7200000 },
        { type: "block", text: "Salary Structure pending verification from GM", who: "Bhoomika", ts: Date.now() - 14400000 },
        { type: "done", text: "Step 5 · Employee Import completed", who: "Bhoomika", ts: Date.now() - 86400000 * 2 },
      ],
    },
    {
      id: "C-102",
      name: "Tayal Motors",
      city: "Delhi",
      type: "4W",
      owner: "Prachi",
      contact: "Ankit Tayal",
      phone: "+91 98111 22334",
      onboard: "08 Aug 2026",
      day: 4,
      idx: 6,
      blocked: true,
      complete: false,
      live: false,
      steps: mkSteps(6, false, "Prachi"),
      req: mkReq(false),
      activity: [{ type: "block", text: "Biometric machine API unreachable", who: "Prachi", ts: Date.now() - 14400000 }],
    },
    {
      id: "C-105",
      name: "Ocean Motors",
      city: "Surat",
      type: "2W",
      owner: "Bhoomika",
      contact: "Rajiv Mehta",
      phone: "+91 98251 33445",
      onboard: "11 Aug 2026",
      day: 1,
      idx: 2,
      blocked: false,
      complete: false,
      live: false,
      steps: mkSteps(2, false, "Bhoomika"),
      req: mkReq(false),
      activity: [{ type: "note", text: "Import employee master sheet", who: "Bhoomika", ts: Date.now() - 3600000 }],
    },
    {
      id: "C-109",
      name: "Apex Suzuki",
      city: "Chandigarh",
      type: "4W",
      owner: "Bhoomika",
      contact: "Deepak Gill",
      phone: "+91 98140 66778",
      onboard: "09 Aug 2026",
      day: 3,
      idx: 7,
      blocked: false,
      complete: false,
      live: false,
      steps: mkSteps(7, false, "Bhoomika"),
      req: mkReq(false),
      activity: [{ type: "note", text: "Confirm leave rules, then advance step", who: "Bhoomika", ts: Date.now() - 14400000 }],
    },
  ];
};

export default function OnboardingMyWorkPage() {
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [currentOwner, setCurrentOwner] = useState("Bhoomika");
  const [activeTab, setActiveTab] = useState<"Today" | "Overdue" | "Blocked" | "All">("Today");

  // Selected client for detail view
  const [selectedClient, setSelectedClient] = useState<ClientItem | null>(null);
  const [openReqCats, setOpenReqCats] = useState<Record<string, boolean>>({ Company: true, Employee: true, Salary: true });
  const [newNoteText, setNewNoteText] = useState("");

  // Load / Save Data
  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.clients && Array.isArray(parsed.clients) && parsed.clients.length > 0) {
          setClients(parsed.clients);
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }
    const init = seedData();
    setClients(init);
    localStorage.setItem(KEY, JSON.stringify({ clients: init }));
  }, []);

  const saveClients = (nextClients: ClientItem[]) => {
    setClients(nextClients);
    try {
      localStorage.setItem(KEY, JSON.stringify({ clients: nextClients }));
    } catch (e) {
      console.error(e);
    }
  };

  const getSlaStatus = (c: ClientItem) => {
    if (c.live) return "live";
    if (c.blocked) return "blocked";
    if (c.day > 3) return "overdue";
    if (c.day === 3) return "due";
    return "ontrack";
  };

  const getNextAction = (c: ClientItem) => {
    if (c.activity && c.activity.length > 0) {
      return c.activity[0].text;
    }
    const stepName = STEP_NAMES[c.idx] || "Implementation";
    return `Complete ${stepName} configuration and verify with client`;
  };

  // Filter clients for selected owner
  const myClients = clients.filter((c) => currentOwner === "All" || c.owner === currentOwner);

  // Tab counts
  const overdueCount = myClients.filter((c) => !c.live && getSlaStatus(c) === "overdue").length;
  const blockedCount = myClients.filter((c) => !c.live && getSlaStatus(c) === "blocked").length;
  const todayCount = myClients.filter((c) => !c.live && (getSlaStatus(c) === "overdue" || getSlaStatus(c) === "blocked" || getSlaStatus(c) === "due")).length;
  const allCount = myClients.length;

  const displayClients = myClients.filter((c) => {
    const sla = getSlaStatus(c);
    if (activeTab === "Today") return !c.live && (sla === "overdue" || sla === "blocked" || sla === "due");
    if (activeTab === "Overdue") return !c.live && sla === "overdue";
    if (activeTab === "Blocked") return !c.live && sla === "blocked";
    return true;
  });

  // Actions
  const handleAdvanceStep = (client: ClientItem) => {
    const nextIdx = client.idx + 1;
    const isNowLive = nextIdx >= STEP_NAMES.length;
    const updated = clients.map((c) => {
      if (c.id !== client.id) return c;
      const newSteps = [...c.steps];
      if (c.idx < STEP_NAMES.length) {
        newSteps[c.idx] = { ...newSteps[c.idx], state: "done" as const, when: "Just now" };
      }
      if (nextIdx < STEP_NAMES.length) {
        newSteps[nextIdx] = { ...newSteps[nextIdx], state: "active" as const, when: "In progress" };
      }
      return {
        ...c,
        idx: isNowLive ? STEP_NAMES.length - 1 : nextIdx,
        complete: isNowLive,
        live: isNowLive,
        goLive: isNowLive ? Number((c.day + 0.2).toFixed(1)) : undefined,
        steps: newSteps,
        activity: [
          {
            type: "done",
            text: isNowLive ? "Completed all steps and went LIVE!" : `Advanced to Step ${nextIdx + 1}: ${STEP_NAMES[nextIdx]}`,
            who: currentOwner,
            ts: Date.now(),
          },
          ...c.activity,
        ],
      };
    });
    saveClients(updated);
    const refreshed = updated.find((c) => c.id === client.id) || null;
    setSelectedClient(refreshed);
  };

  const handleToggleBlocked = (client: ClientItem) => {
    const updated = clients.map((c) => {
      if (c.id !== client.id) return c;
      return {
        ...c,
        blocked: !c.blocked,
        activity: [
          {
            type: "block",
            text: !c.blocked ? "Marked as Blocked on client response" : "Unblocked client",
            who: currentOwner,
            ts: Date.now(),
          },
          ...c.activity,
        ],
      };
    });
    saveClients(updated);
    const refreshed = updated.find((c) => c.id === client.id) || null;
    setSelectedClient(refreshed);
  };

  const handleToggleReqStatus = (catName: string, itemName: string) => {
    if (!selectedClient) return;
    const nextStatuses: Record<string, "Pending" | "Partial" | "Received"> = {
      Pending: "Received",
      Received: "Partial",
      Partial: "Pending",
    };

    const updated = clients.map((c) => {
      if (c.id !== selectedClient.id) return c;
      const newReq = c.req.map((cat) => {
        if (cat.cat !== catName) return cat;
        return {
          ...cat,
          items: cat.items.map((itm) => {
            if (itm.name !== itemName) return itm;
            const nextSt = nextStatuses[itm.status] || "Received";
            return { ...itm, status: nextSt };
          }),
        };
      });
      return { ...c, req: newReq };
    });

    saveClients(updated);
    const refreshed = updated.find((c) => c.id === selectedClient.id) || null;
    setSelectedClient(refreshed);
  };

  const handleAddLog = (type: "call" | "whatsapp" | "note", customText?: string) => {
    if (!selectedClient) return;
    let logText = customText || newNoteText.trim();
    if (type === "call" && !customText) logText = "Logged phone call with client HR";
    if (type === "whatsapp" && !customText) logText = "Sent WhatsApp follow-up reminder";
    if (!logText) return;

    const updated = clients.map((c) => {
      if (c.id !== selectedClient.id) return c;
      return {
        ...c,
        activity: [
          {
            type,
            text: logText,
            who: currentOwner,
            ts: Date.now(),
          },
          ...c.activity,
        ],
      };
    });
    saveClients(updated);
    const refreshed = updated.find((c) => c.id === selectedClient.id) || null;
    setSelectedClient(refreshed);
    setNewNoteText("");
  };

  // ============================================================
  // RENDER: CLIENT DETAIL VIEW
  // ============================================================
  if (selectedClient) {
    const c = selectedClient;
    const sla = getSlaStatus(c);
    const isOverdue = sla === "overdue";
    const isBlocked = sla === "blocked";
    const isDue = sla === "due";
    const isLive = sla === "live";

    let doneSteps = 0;
    c.steps.forEach((st) => {
      if (st.state === "done" || c.live) doneSteps++;
    });

    const allReqsComplete = c.req.every((cat) => cat.items.every((itm) => itm.status === "Received"));
    const pendingReqsCount = c.req.reduce((acc, cat) => acc + cat.items.filter((itm) => itm.status === "Pending").length, 0);

    return (
      <div className="flex flex-col h-[calc(100vh-150px)] min-h-[500px] overflow-hidden bg-[#F8FAFC] text-[#1F2937] font-sans">
        {/* SCROLLABLE INNER CONTENT */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 pb-6">
          {/* BREADCRUMB HEADER */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setSelectedClient(null)}
            className="flex items-center gap-1.5 bg-transparent border-0 text-[#475569] hover:text-[#1F2937] text-lg font-semibold cursor-pointer p-0 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
            My Work
          </button>
          <span className="text-[#CBD5E1] text-lg">/</span>
          <span className="text-lg font-bold text-[#1F2937]">{c.name}</span>
        </div>

        {/* MAIN CLIENT HEADER CARD */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] border-l-4 border-l-[#4F46E5] p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-3 mb-3.5">
              <h1 className="m-0 text-2xl font-extrabold text-[#1F2937] tracking-tight">
                {c.name}
              </h1>
              <span className="text-lg font-bold px-2.5 py-1 rounded-md bg-[#F1F5F9] text-[#64748B]">
                {c.type} Dealership
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-6 sm:gap-7">
              <div>
                <div className="text-lg font-semibold text-[#94A3B8] mb-1">Owner</div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full text-white flex items-center justify-center text-lg font-bold"
                    style={{ backgroundColor: OWNER_COLOR[c.owner] || "#4F46E5" }}
                  >
                    {c.owner.slice(0, 1)}
                  </div>
                  <span className="text-lg font-bold text-[#1F2937]">{c.owner}</span>
                </div>
              </div>

              <div>
                <div className="text-lg font-semibold text-[#94A3B8] mb-1">Onboarded</div>
                <div className="text-lg font-bold text-[#1F2937]">{c.onboard}</div>
              </div>

              <div className="hidden sm:block w-px h-8 bg-[#E2E8F0]"></div>

              <div>
                <div className="text-lg font-semibold text-[#94A3B8] mb-1">Client contact</div>
                <div className="flex items-center gap-2.5">
                  <span className="text-lg font-bold text-[#1F2937]">{c.contact}</span>
                  <span className="inline-flex items-center gap-1 text-lg text-[#6366F1] font-semibold">
                    📞 {c.phone}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div>
            {isDue && (
              <div className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-[#FEF9C3] border border-[#FDE047]">
                <span className="text-xl">🕒</span>
                <div>
                  <div className="text-lg font-extrabold text-[#854D0E]">Due Today</div>
                  <div className="text-lg font-semibold text-[#A16207]">Day {c.day}</div>
                </div>
              </div>
            )}
            {isOverdue && (
              <div className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5]">
                <span className="text-xl">⚠️</span>
                <div>
                  <div className="text-lg font-extrabold text-[#DC2626]">Overdue</div>
                  <div className="text-lg font-semibold text-[#B91C1C]">Day {c.day} · 2d over SLA</div>
                </div>
              </div>
            )}
            {isBlocked && (
              <div className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5]">
                <span className="text-xl">🚫</span>
                <div>
                  <div className="text-lg font-extrabold text-[#DC2626]">Blocked</div>
                  <div className="text-lg font-semibold text-[#B91C1C]">Day {c.day} · Action needed</div>
                </div>
              </div>
            )}
            {isLive && (
              <div className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-[#DCFCE7] border border-[#86EFAC]">
                <span className="text-xl">✓</span>
                <div>
                  <div className="text-lg font-extrabold text-[#16A34A]">Live</div>
                  <div className="text-lg font-semibold text-[#15803D]">{c.goLive}d Go-Live</div>
                </div>
              </div>
            )}
            {!isDue && !isOverdue && !isBlocked && !isLive && (
              <div className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-[#EEF2FF] border border-[#C7D2FE]">
                <span className="text-xl">⚡</span>
                <div>
                  <div className="text-lg font-extrabold text-[#4F46E5]">On Track</div>
                  <div className="text-lg font-semibold text-[#4338CA]">Day {c.day} · Within SLA</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2-COLUMN SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* LEFT: SETUP STEPS */}
          <section className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs p-5 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="m-0 text-lg font-bold text-[#1F2937]">Setup steps</h2>
              <span className="text-lg font-bold text-[#4F46E5]">
                {doneSteps} / 11 done
              </span>
            </div>

            <div className="flex gap-1 my-3 mb-6">
              <div style={{ flex: doneSteps }} className="h-1.5 rounded-full bg-[#16A34A]"></div>
              {!c.live && <div className="flex-1 h-1.5 rounded-full bg-[#4F46E5]"></div>}
              <div style={{ flex: Math.max(0, 11 - doneSteps - (c.live ? 0 : 1)) }} className="h-1.5 rounded-full bg-[#E2E8F0]"></div>
            </div>

            <div className="flex flex-col">
              {STEP_NAMES.map((name, i) => {
                const isLast = i === STEP_NAMES.length - 1;
                const isDone = c.live || i < c.idx;
                const isActive = !c.live && i === c.idx;

                return (
                  <div key={name} className={`relative flex gap-3.5 ${isLast ? "pb-0" : "pb-4"}`}>
                    {!isLast && (
                      <div
                        className={`absolute left-3.5 top-7 bottom-0 w-0.5 ${
                          isDone ? "bg-[#16A34A]" : "bg-[#E2E8F0]"
                        }`}
                      />
                    )}

                    {isDone ? (
                      <div className="w-7 h-7 rounded-full bg-[#16A34A] flex items-center justify-center shrink-0 text-white text-lg font-bold z-10">
                        ✓
                      </div>
                    ) : isActive ? (
                      <div className="w-7 h-7 rounded-full bg-[#EEF2FF] border-2 border-[#4F46E5] flex items-center justify-center shrink-0 text-[#4F46E5] text-lg font-bold z-10">
                        {i + 1}
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center shrink-0 text-[#94A3B8] text-lg font-semibold z-10">
                        {i + 1}
                      </div>
                    )}

                    <div className="pt-0.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-lg ${
                            isActive
                              ? "font-bold text-[#4F46E5]"
                              : isDone
                              ? "font-semibold text-[#1F2937]"
                              : "font-medium text-[#94A3B8]"
                          }`}
                        >
                          {name}
                        </span>
                        {isActive && (
                          <span className="px-1.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-lg font-bold">
                            In progress
                          </span>
                        )}
                      </div>
                      <div
                        className={`text-lg mt-0.5 ${
                          isDone ? "text-[#64748B]" : isActive ? "text-[#6366F1]" : "text-[#CBD5E1]"
                        }`}
                      >
                        {isDone
                          ? `Completed by ${c.owner} · ${c.steps[i]?.when || "2d ago"}`
                          : isActive
                          ? `Assigned to ${c.owner} · started today`
                          : "Pending"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* RIGHT: REQUIREMENTS & ACTIVITY */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            <section className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-hidden">
              <div className="p-5 pb-3.5">
                <div className="flex items-center justify-between">
                  <h2 className="m-0 text-lg font-bold text-[#1F2937]">Requirements</h2>
                  <span className="text-lg text-[#94A3B8]">click a slot to change status</span>
                </div>

                {allReqsComplete ? (
                  <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-[#DCFCE7] border border-[#86EFAC]">
                    <span className="text-[#16A34A] font-bold">✓</span>
                    <span className="text-lg font-bold text-[#16A34A]">
                      All requirements received — ready to advance
                    </span>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5]">
                    <span className="text-[#DC2626] font-bold">⚠️</span>
                    <span className="text-lg font-bold text-[#B91C1C]">
                      Handover blocked — {pendingReqsCount} requirements pending
                    </span>
                  </div>
                )}
              </div>

              <div>
                {c.req.map((category) => {
                  const isOpen = !!openReqCats[category.cat];
                  const allReceived = category.items.every((itm) => itm.status === "Received");
                  const pendingCount = category.items.filter((itm) => itm.status === "Pending").length;

                  return (
                    <div key={category.cat} className="border-t border-[#F1F5F9]">
                      <div
                        onClick={() => setOpenReqCats({ ...openReqCats, [category.cat]: !isOpen })}
                        className={`flex items-center justify-between px-5 py-3 cursor-pointer select-none transition-colors ${
                          isOpen ? "bg-[#F8FAFC]" : "bg-white hover:bg-[#F8FAFC]/60"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`text-xl text-[#64748B] transition-transform duration-150 inline-block ${
                              isOpen ? "rotate-90" : "rotate-0"
                            }`}
                          >
                            →
                          </span>
                          <span className="text-lg font-semibold text-[#1F2937]">{category.cat}</span>
                        </div>

                        <div>
                          {allReceived ? (
                            <span className="text-lg font-bold text-[#16A34A]">All received</span>
                          ) : (
                            <span className="text-lg font-bold text-[#DC2626]">{pendingCount} pending</span>
                          )}
                        </div>
                      </div>

                      {isOpen && (
                        <div className="px-5 pl-10 pb-3 bg-[#F8FAFC]">
                          {category.items.map((itm) => {
                            const isRec = itm.status === "Received";
                            const isPend = itm.status === "Pending";

                            return (
                              <div
                                key={itm.name}
                                className="flex items-center justify-between py-2 border-t border-[#F1F5F9]"
                              >
                                <span className="text-lg font-medium text-[#334155]">{itm.name}</span>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleToggleReqStatus(category.cat, itm.name)}
                                    className={`px-2.5 py-0.5 rounded-full text-lg font-bold cursor-pointer transition-all active:scale-95 ${
                                      isRec
                                        ? "bg-[#DCFCE7] text-[#16A34A]"
                                        : isPend
                                        ? "bg-[#FEE2E2] text-[#DC2626]"
                                        : "bg-[#FEF3C7] text-[#B45309]"
                                    }`}
                                  >
                                    {itm.status}
                                  </button>
                                  <button
                                    onClick={() => handleToggleReqStatus(category.cat, itm.name)}
                                    className={`px-2 py-0.5 rounded-md text-lg font-semibold cursor-pointer transition-all active:scale-95 ${
                                      isPend
                                        ? "border border-dashed border-[#CBD5E1] bg-white text-[#64748B] hover:bg-[#F1F5F9]"
                                        : "border border-[#E2E8F0] bg-white text-[#4F46E5] hover:bg-[#EEF2FF]"
                                    }`}
                                  >
                                    {isPend ? "Upload" : "View"}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs p-5">
              <div className="flex items-center justify-between mb-3.5">
                <h2 className="m-0 text-lg font-bold text-[#1F2937]">Activity &amp; follow-up</h2>
              </div>

              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Type a note or follow-up update..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  className="flex-1 h-9 border border-[#CBD5E1] rounded-lg px-3 text-lg text-[#1F2937] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#4F46E5]"
                />
                <button
                  onClick={() => handleAddLog("note")}
                  className="px-3.5 h-9 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white text-lg font-semibold cursor-pointer transition-all shadow-2xs active:scale-95"
                >
                  Add note
                </button>
              </div>

              <div className="flex flex-col gap-2.5">
                {c.activity.map((act, i) => (
                  <div
                    key={i}
                    className="flex gap-2.5 items-start p-2.5 bg-[#F8FAFC] rounded-xl border border-[#F1F5F9]"
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-lg shrink-0 ${
                        act.type === "call"
                          ? "bg-[#EEF2FF] text-[#4F46E5]"
                          : act.type === "whatsapp"
                          ? "bg-[#DCFCE7] text-[#16A34A]"
                          : act.type === "block"
                          ? "bg-[#FEE2E2] text-[#DC2626]"
                          : "bg-[#F1F5F9] text-[#475569]"
                      }`}
                    >
                      {act.type === "call" ? "📞" : act.type === "whatsapp" ? "💬" : act.type === "block" ? "⚠️" : "✓"}
                    </div>
                    <div className="flex-1">
                      <div className="text-lg text-[#1F2937] font-medium">{act.text}</div>
                      <div className="text-lg text-[#94A3B8] mt-0.5">
                        {act.who} · {new Date(act.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
        </div>

        {/* FIXED / DOCKED BOTTOM ACTION BAR */}
        <div className="shrink-0 bg-white border-t border-[#E2E8F0] px-8 py-3 flex items-center gap-3 z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
          <span className="text-lg font-medium text-[#64748B] mr-auto">
            {c.name} · currently on <strong className="text-[#4F46E5] font-bold">Step {c.idx + 1} · {STEP_NAMES[c.idx] || "Done"}</strong>
          </span>

          <button
            onClick={() => handleAddLog("call")}
            className="h-9 px-3.5 rounded-lg border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#1F2937] text-lg font-semibold cursor-pointer flex items-center gap-1.5 transition-all shadow-2xs active:scale-95"
          >
            📞 Log a call
          </button>

          <button
            onClick={() => handleAddLog("whatsapp")}
            className="h-9 px-3.5 rounded-lg border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#1F2937] text-lg font-semibold cursor-pointer flex items-center gap-1.5 transition-all shadow-2xs active:scale-95"
          >
            💬 Send WhatsApp follow-up
          </button>

          <button
            onClick={() => handleToggleBlocked(c)}
            className={`h-9 px-3.5 rounded-lg text-lg font-semibold cursor-pointer flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 border ${
              c.blocked
                ? "border-[#16A34A] bg-[#DCFCE7] text-[#16A34A] hover:bg-[#BBF7D0]"
                : "border-[#FCA5A5] bg-white text-[#DC2626] hover:bg-[#FEF2F2]"
            }`}
          >
            {c.blocked ? "✓ Unblock" : "⚠️ Mark blocked"}
          </button>

          {!c.live && (
            <button
              onClick={() => handleAdvanceStep(c)}
              className="h-9 px-4 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white text-lg font-bold cursor-pointer flex items-center gap-1.5 transition-all shadow-sm shadow-[#4F46E5]/30 active:scale-95"
            >
              Advance to next step →
            </button>
          )}
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER: MY WORK LIST VIEW
  // ============================================================
  return (
    <div className="p-6 sm:p-7 min-h-full bg-[#F8FAFC] text-[#1F2937] font-sans">
      {/* GREETING & SWITCHER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="m-0 text-2xl font-bold text-[#1F2937] tracking-tight">
            Good morning, {currentOwner === "All" ? "Team" : currentOwner}
          </h1>
          <p className="mt-1.5 text-lg text-[#475569]">
            {todayCount} of your {allCount} clients need action today · HR Setu Implementation
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-lg font-semibold text-[#64748B]">Switch Owner:</span>
          <select
            value={currentOwner}
            onChange={(e) => setCurrentOwner(e.target.value)}
            className="h-9 border border-[#CBD5E1] rounded-lg bg-white px-3 text-lg font-semibold text-[#1F2937] cursor-pointer focus:outline-none focus:border-[#4F46E5]"
          >
            <option value="Bhoomika">Bhoomika</option>
            <option value="Prachi">Prachi</option>
            <option value="Chirag">Chirag</option>
            <option value="All">All Owners</option>
          </select>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 border-b border-[#E2E8F0] mb-4">
        {[
          { key: "Today" as const, label: "Today", count: todayCount, badgeBg: todayCount > 0 ? "bg-[#FEE2E2]" : "bg-[#F1F5F9]", badgeFg: todayCount > 0 ? "text-[#DC2626]" : "text-[#475569]" },
          { key: "Overdue" as const, label: "Overdue", count: overdueCount, badgeBg: overdueCount > 0 ? "bg-[#FEE2E2]" : "bg-[#F1F5F9]", badgeFg: overdueCount > 0 ? "text-[#DC2626]" : "text-[#475569]" },
          { key: "Blocked" as const, label: "Blocked", count: blockedCount, badgeBg: blockedCount > 0 ? "bg-[#FEE2E2]" : "bg-[#F1F5F9]", badgeFg: blockedCount > 0 ? "text-[#DC2626]" : "text-[#475569]" },
          { key: "All" as const, label: "All my clients", count: allCount, badgeBg: "bg-[#F1F5F9]", badgeFg: "text-[#475569]" },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex items-center gap-2 px-4 py-3 bg-transparent border-0 text-lg cursor-pointer mb-[-1px] font-sans transition-colors ${
                isActive
                  ? "text-[#4F46E5] font-bold border-b-2 border-b-[#4F46E5]"
                  : "text-[#475569] font-medium border-b-2 border-b-transparent hover:text-[#1F2937]"
              }`}
            >
              {tab.label}{" "}
              <span className={`text-lg font-bold px-2 py-0.5 rounded-full ${tab.badgeBg} ${tab.badgeFg}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* TABLE LIST */}
      <section className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-hidden">
        <div className="flex items-center gap-4 px-5 py-3 bg-[#F8FAFC] border-b border-[#F1F5F9] text-lg font-bold tracking-wider uppercase text-[#94A3B8]">
          <span className="w-56">Client</span>
          <span className="w-48">Current step</span>
          <span className="w-28">SLA</span>
          <span className="flex-1">Next action</span>
          <span className="w-28">Updated</span>
          <span className="w-28 text-right"></span>
        </div>

        {displayClients.length === 0 ? (
          <div className="text-center py-10 px-5 text-[#94A3B8] text-lg">
            No clients found for this filter tab.
          </div>
        ) : (
          displayClients.map((c) => {
            const sla = getSlaStatus(c);
            const isOverdue = sla === "overdue";
            const isBlocked = sla === "blocked";
            const isDue = sla === "due";
            const isLive = sla === "live";

            let slaBg = "bg-[#EEF2FF]";
            let slaFg = "text-[#4F46E5]";
            let slaLabel = "On track";

            if (isLive) {
              slaBg = "bg-[#DCFCE7]";
              slaFg = "text-[#16A34A]";
              slaLabel = "Live";
            } else if (isOverdue) {
              slaBg = "bg-[#FEE2E2]";
              slaFg = "text-[#DC2626]";
              slaLabel = "Overdue";
            } else if (isBlocked) {
              slaBg = "bg-[#FEE2E2]";
              slaFg = "text-[#DC2626]";
              slaLabel = "Blocked";
            } else if (isDue) {
              slaBg = "bg-[#FEF3C7]";
              slaFg = "text-[#B45309]";
              slaLabel = "Due today";
            }

            return (
              <div
                key={c.id}
                className="flex items-center gap-4 px-5 py-3.5 border-b border-[#F1F5F9] text-lg transition-colors hover:bg-[#F8FAFC]"
              >
                <div className="w-56">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#1F2937] text-lg">{c.name}</span>
                    <span
                      className={`text-lg font-bold px-1.5 py-0.5 rounded-md ${
                        c.type === "2W" ? "bg-[#EEF2FF] text-[#4F46E5]" : "bg-[#F1F5F9] text-[#475569]"
                      }`}
                    >
                      {c.type}
                    </span>
                  </div>
                  <div className="text-lg text-[#64748B] mt-0.5">
                    {c.city} · {c.owner}
                  </div>
                </div>

                <div className="w-48 text-lg text-[#334155] font-medium">
                  Step {c.idx + 1} · {STEP_NAMES[c.idx] || "Completed"}
                </div>

                <div className="w-28">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-lg font-bold ${slaBg} ${slaFg}`}
                  >
                    {slaLabel} {isOverdue && "+2d"}
                  </span>
                </div>

                <div className="flex-1 text-[#475569] text-lg">
                  {getNextAction(c)}
                </div>

                <div className="w-28 text-[#94A3B8] text-lg">
                  {c.activity && c.activity.length > 0 ? "2h ago" : "Yesterday"}
                </div>

                <div className="w-28 text-right">
                  <button
                    onClick={() => setSelectedClient(c)}
                    className="px-3.5 py-1.5 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white text-lg font-semibold cursor-pointer shadow-2xs transition-all active:scale-95"
                  >
                    Open &amp; log
                  </button>
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
