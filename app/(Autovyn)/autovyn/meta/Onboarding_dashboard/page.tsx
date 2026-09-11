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
      cat,
      items: items.map((name) => ({
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
      id: "C-103",
      name: "Sunrise Auto",
      city: "Pune",
      type: "2W",
      owner: "Chirag",
      contact: "Kunal Shah",
      phone: "+91 98220 99887",
      onboard: "11 Aug 2026",
      day: 1,
      idx: 0,
      blocked: false,
      complete: false,
      live: false,
      steps: mkSteps(0, false, "Chirag"),
      req: mkReq(false),
      activity: [],
    },
    {
      id: "C-104",
      name: "Krishna Motors",
      city: "Ahmedabad",
      type: "4W",
      owner: "Prachi",
      contact: "Haresh Patel",
      phone: "+91 98980 44556",
      onboard: "11 Aug 2026",
      day: 1,
      idx: 1,
      blocked: false,
      complete: false,
      live: false,
      steps: mkSteps(1, false, "Prachi"),
      req: mkReq(false),
      activity: [],
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
      activity: [],
    },
    {
      id: "C-106",
      name: "Highway Motors",
      city: "Gurugram",
      type: "4W",
      owner: "Chirag",
      contact: "Sanjay Gupta",
      phone: "+91 98100 77665",
      onboard: "10 Aug 2026",
      day: 2,
      idx: 2,
      blocked: false,
      complete: false,
      live: false,
      steps: mkSteps(2, false, "Chirag"),
      req: mkReq(false),
      activity: [],
    },
    {
      id: "C-107",
      name: "Nova Wheels",
      city: "Indore",
      type: "2W",
      owner: "Prachi",
      contact: "Amit Verma",
      phone: "+91 98260 11223",
      onboard: "10 Aug 2026",
      day: 2,
      idx: 3,
      blocked: false,
      complete: false,
      live: false,
      steps: mkSteps(3, false, "Prachi"),
      req: mkReq(false),
      activity: [],
    },
    {
      id: "C-108",
      name: "Goyal Motors",
      city: "Agra",
      type: "4W",
      owner: "Chirag",
      contact: "Nitin Goyal",
      phone: "+91 98370 55443",
      onboard: "10 Aug 2026",
      day: 2,
      idx: 4,
      blocked: false,
      complete: false,
      live: false,
      steps: mkSteps(4, false, "Chirag"),
      req: mkReq(false),
      activity: [],
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
      activity: [],
    },
    {
      id: "C-110",
      name: "Vipul Motors",
      city: "Noida",
      type: "4W",
      owner: "Prachi",
      contact: "Vipul Sharma",
      phone: "+91 98180 88990",
      onboard: "09 Aug 2026",
      day: 3,
      idx: 8,
      blocked: false,
      complete: false,
      live: false,
      steps: mkSteps(8, false, "Prachi"),
      req: mkReq(false),
      activity: [],
    },
    {
      id: "C-111",
      name: "Metro Kia",
      city: "Bengaluru",
      type: "4W",
      owner: "Prachi",
      contact: "Suresh Gowda",
      phone: "+91 98450 12399",
      onboard: "01 Aug 2026",
      day: 2,
      idx: 10,
      blocked: false,
      complete: true,
      live: true,
      goLive: 2.1,
      steps: mkSteps(10, true, "Prachi"),
      req: mkReq(true),
      activity: [],
    },
    {
      id: "C-112",
      name: "City Wheels",
      city: "Lucknow",
      type: "2W",
      owner: "Bhoomika",
      contact: "Arun Awasthi",
      phone: "+91 98390 44332",
      onboard: "02 Aug 2026",
      day: 2,
      idx: 10,
      blocked: false,
      complete: true,
      live: true,
      goLive: 1.8,
      steps: mkSteps(10, true, "Bhoomika"),
      req: mkReq(true),
      activity: [],
    },
    {
      id: "C-113",
      name: "Star Motors",
      city: "Mumbai",
      type: "4W",
      owner: "Chirag",
      contact: "Ketan Parekh",
      phone: "+91 98200 99001",
      onboard: "03 Aug 2026",
      day: 3,
      idx: 10,
      blocked: false,
      complete: true,
      live: true,
      goLive: 2.6,
      steps: mkSteps(10, true, "Chirag"),
      req: mkReq(true),
      activity: [],
    },
  ];
};

export default function OnboardingDashboardPage() {
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [openReqCats, setOpenReqCats] = useState<Record<string, boolean>>({ Company: true, Employee: true, Salary: true });
  const [newNoteText, setNewNoteText] = useState("");

  // Add Form State
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    type: "4W" as "4W" | "2W",
    owner: "Bhoomika",
    contact: "",
    phone: "",
    onboard: "12 Aug 2026",
  });

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

  // KPIs
  const activeClients = clients.filter((c) => !c.live);
  const totalActive = activeClients.length;
  const onTrackCount = activeClients.filter((c) => getSlaStatus(c) === "ontrack").length;
  const dueTodayCount = activeClients.filter((c) => getSlaStatus(c) === "due").length;
  const overdueCount = activeClients.filter((c) => getSlaStatus(c) === "overdue").length;
  const blockedCount = activeClients.filter((c) => getSlaStatus(c) === "blocked").length;
  const liveCount = clients.filter((c) => c.live).length;

  const attentionClients = activeClients
    .filter((c) => getSlaStatus(c) === "overdue" || getSlaStatus(c) === "blocked")
    .sort((a, b) => b.day - a.day);

  // Workload
  const ownersList = ["Bhoomika", "Prachi", "Chirag"];
  const workload = ownersList.map((o) => ({
    owner: o,
    count: activeClients.filter((c) => c.owner === o).length,
  }));
  const maxWorkload = Math.max(1, ...workload.map((w) => w.count));

  // Stage funnel
  const stageCounts = STEP_NAMES.map((name, i) => ({
    name,
    count: activeClients.filter((c) => c.idx === i).length,
  }));
  const maxStageCount = Math.max(1, ...stageCounts.map((s) => s.count));

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
            who: c.owner,
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
            text: !c.blocked ? "Marked as Blocked" : "Unblocked client",
            who: c.owner,
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
            who: c.owner,
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

  const handleCreateClient = () => {
    if (!formData.name.trim()) return;
    const newId = `C-${100 + clients.length + 1}`;
    const newClient: ClientItem = {
      id: newId,
      name: formData.name.trim(),
      city: formData.city.trim() || "Jaipur",
      type: formData.type,
      owner: formData.owner,
      contact: formData.contact.trim() || "Mr. Sharma (HR)",
      phone: formData.phone.trim() || "+91 98290 12345",
      onboard: formData.onboard.trim() || "12 Aug 2026",
      day: 1,
      idx: 0,
      blocked: false,
      complete: false,
      live: false,
      steps: STEP_NAMES.map((name, i) => ({
        name,
        state: i === 0 ? ("active" as const) : ("pending" as const),
        by: i === 0 ? formData.owner : undefined,
        when: i === 0 ? "In progress" : undefined,
      })),
      req: REQ_TEMPLATE.map(([cat, items]) => ({
        cat: cat as string,
        items: items.map((name) => ({
          name,
          status: "Pending" as const,
        })),
      })),
      activity: [{ type: "note", text: "Client created and onboarded into pipeline", who: "You", ts: Date.now() }],
    };

    saveClients([newClient, ...clients]);
    setShowAddModal(false);
    setFormData({
      name: "",
      city: "",
      type: "4W",
      owner: "Bhoomika",
      contact: "",
      phone: "",
      onboard: "12 Aug 2026",
    });
  };

  // ============================================================
  // RENDER: CLIENT DETAIL VIEW (MATCHING SCREENSHOT)
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
            Overview
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
                          <span className="px-1.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-[10px] font-bold">
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
                            className={`text-lg text-[#64748B] transition-transform duration-150 inline-block ${
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
  // RENDER: DASHBOARD VIEW (MATCHING SCREENSHOT 2)
  // ============================================================
  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] text-[#1F2937] font-sans antialiased p-6 sm:p-7">
      {/* HEADER SECTION (MATCHING SCREENSHOT 2) */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-lg font-bold tracking-wider uppercase text-[#94A3B8] mb-1">
            OVERVIEW
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1F2937]">Onboarding dashboard</h1>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="h-10 px-5 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold text-lg flex items-center gap-1.5 shadow-sm shadow-[#4F46E5]/30 cursor-pointer transition-all active:scale-95"
        >
          <span className="text-lg font-bold">+</span> Add new client
        </button>
      </div>

      {/* TOP KPI METRICS ROW (6 METRIC CARDS) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-6">
        {[
          { label: "Total Active", val: totalActive, sub: "in implementation", subClass: "text-[#16A34A]", ic: "👥", icbg: "bg-[#EEF2FF]", icfg: "text-[#4F46E5]", tint: "bg-white", border: "border-[#E2E8F0]" },
          { label: "On Track", val: onTrackCount, sub: "within SLA", subClass: "text-[#16A34A]", ic: "●", icbg: "bg-[#EEF2FF]", icfg: "text-[#4F46E5]", tint: "bg-white", border: "border-[#E2E8F0]" },
          { label: "Due Today", val: dueTodayCount, sub: "close the loop", subClass: "text-[#B45309]", ic: "🕒", icbg: "bg-[#FEF3C7]", icfg: "text-[#B45309]", tint: "bg-white", border: "border-[#E2E8F0]" },
          { label: "Overdue", val: overdueCount, sub: "needs attention", subClass: "text-[#DC2626]", ic: "⚠️", icbg: "bg-[#FEE2E2]", icfg: "text-[#DC2626]", tint: "bg-[#FEF2F2]", border: "border-[#FCA5A5]" },
          { label: "Blocked", val: blockedCount, sub: "escalate now", subClass: "text-[#DC2626]", ic: "⚠️", icbg: "bg-[#FEE2E2]", icfg: "text-[#DC2626]", tint: "bg-[#FEF2F2]", border: "border-[#FCA5A5]" },
          { label: "Live This Month", val: liveCount, sub: "handed over", subClass: "text-[#16A34A]", ic: "✓", icbg: "bg-[#DCFCE7]", icfg: "text-[#16A34A]", tint: "bg-[#F0FDF4]", border: "border-[#86EFAC]" },
        ].map((k) => (
          <div
            key={k.label}
            className={`p-4 rounded-xl border transition-all duration-200 shadow-2xs hover:shadow-xs ${k.tint} ${k.border}`}
          >
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xl font-medium text-[#475569]">{k.label}</span>
              <span
                className={`w-6 h-6 rounded-md flex items-center justify-center text-2xl font-bold ${k.icbg} ${k.icfg}`}
              >
                {k.ic}
              </span>
            </div>
            <div className="font-mono text-2xl font-bold text-[#1F2937] leading-none">{k.val}</div>
            <div className={`mt-2 text-lg font-medium ${k.subClass}`}>
              {k.sub}
            </div>
          </div>
        ))}
      </div>

      {/* 2-COLUMN SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: NEEDS ATTENTION */}
        <section className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-xl shadow-2xs overflow-hidden">
          <div className="p-4 px-5 flex items-center justify-between border-b border-[#F1F5F9]">
            <div className="flex items-center gap-2">
              <span className="text-[#DC2626] text-lg">⚠️</span>
              <h2 className="text-xl font-bold text-[#1F2937]">Needs attention</h2>
            </div>
            <span className="font-mono text-xl text-[#94A3B8]">{attentionClients.length} clients</span>
          </div>

          <div className="divide-y divide-[#F1F5F9]">
            {attentionClients.length ? (
              attentionClients.map((c) => {
                const isBlocked = c.blocked;
                return (
                  <div
                    key={c.id}
                    className="flex items-center gap-3.5 p-3.5 px-5 border-l-4 border-l-[#DC2626] hover:bg-[#F8FAFC] transition-colors"
                  >
                    <div
                      className="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-2xs"
                      style={{ backgroundColor: OWNER_COLOR[c.owner] || "#4F46E5" }}
                    >
                      {c.owner.charAt(0)}
                    </div>

                    <div className="w-36 flex-shrink-0">
                      <div className="text-lg font-semibold text-[#1F2937] truncate">{c.name}</div>
                      <div className="text-lg text-[#94A3B8] truncate">
                        {c.owner} · {c.city}
                      </div>
                    </div>

                    <div className="flex-1 text-lg text-[#475569] truncate">
                      Step {c.idx + 1} · {STEP_NAMES[Math.min(c.idx, 10)]}
                    </div>

                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-lg font-semibold bg-[#FEE2E2] text-[#DC2626]">
                      <span>⚠️</span>
                      {isBlocked ? "Blocked" : "Overdue"}
                    </span>

                    <span className="font-mono px-2 py-0.5 rounded-md bg-[#FEE2E2] text-[#DC2626] text-lg font-bold">
                      Day {c.day}
                    </span>

                    <button
                      onClick={() => setSelectedClient(c)}
                      className="h-8 px-3.5 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white text-lg font-semibold cursor-pointer shadow-2xs transition-all active:scale-95"
                    >
                      Open
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-[#94A3B8] text-lg font-medium">
                Nothing overdue or blocked — all clear. 🎉
              </div>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: WORKLOAD & STAGE FUNNEL */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* OWNER WORKLOAD */}
          <section className="bg-white border border-[#E2E8F0] rounded-xl shadow-2xs p-5">
            <h2 className="text-lg font-bold text-[#1F2937]  mb-4">Owner workload</h2>
            <div className="space-y-3.5">
              {workload.map((l) => (
                <div key={l.owner} className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-full text-white flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-2xs"
                    style={{ backgroundColor: OWNER_COLOR[l.owner] || "#4F46E5" }}
                  >
                    {l.owner.charAt(0)}
                  </div>
                  <span className="w-16 text-lg font-medium text-[#1F2937]">{l.owner}</span>
                  <div className="flex-1 h-5 bg-[#F1F5F9] ml-9 rounded-md overflow-hidden">
                    <div
                      className="h-full rounded-md transition-all duration-300"
                      style={{
                        width: `${Math.round((l.count / maxWorkload) * 100)}%`,
                        backgroundColor: OWNER_COLOR[l.owner] || "#4F46E5",
                      }}
                    />
                  </div>
                  <span className="font-mono text-lg font-bold text-[#1F2937] w-5 text-right">{l.count}</span>
                </div>
              ))}
            </div>
          </section>

          {/* CLIENTS PER STAGE */}
          <section className="bg-white border border-[#E2E8F0] rounded-xl shadow-2xs p-5">
            <h2 className="text-lg font-bold text-[#1F2937]  mb-3.5">Clients per stage</h2>
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {stageCounts.map((s) => (
                <div key={s.name} className="flex items-center gap-2.5">
                  <span className="w-36 text-lg text-[#475569] text-right truncate">{s.name}</span>
                  <div className="flex-1 h-4 bg-[#F8FAFC] border border-[#F1F5F9] rounded-sm overflow-hidden">
                    <div
                      className="h-full rounded-sm transition-all duration-300"
                      style={{
                        width: `${s.count ? Math.max(12, Math.round((s.count / maxStageCount) * 100)) : 0}%`,
                        backgroundColor: s.count ? "#4F46E5" : "transparent",
                      }}
                    />
                  </div>
                  <span
                    className={`font-mono w-5 text-lg font-semibold text-right ${
                      s.count ? "text-[#1F2937]" : "text-[#CBD5E1]"
                    }`}
                  >
                    {s.count}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* ADD NEW CLIENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col shadow-2xl border border-[#E2E8F0] animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 space-y-5 overflow-y-auto max-h-[90vh]">
              {/* Header */}
              <div>
                <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight">
                  Add a new client
                </h2>
                <p className="text-lg text-[#64748B] mt-1">
                  Register a dealership to begin the HR Setu implementation.
                </p>
              </div>

              {/* Form Content */}
              <div className="space-y-4">
                {/* Dealership name */}
                <div>
                  <label className="block text-lg font-semibold text-[#0F172A] mb-1.5">
                    Dealership name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sharma Motors"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-11 px-3.5 rounded-xl border border-[#E2E8F0] bg-white text-lg text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA] transition-all"
                  />
                </div>

                {/* City & Dealership type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-lg font-semibold text-[#0F172A] mb-1.5">
                      City
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Jaipur"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full h-11 px-3.5 rounded-xl border border-[#E2E8F0] bg-white text-lg text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-lg font-semibold text-[#0F172A] mb-1.5">
                      Dealership type
                    </label>
                    <div className="h-11 bg-[#F1F5F9] p-1 rounded-xl flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: "4W" })}
                        className={`flex-1 h-full rounded-lg text-lg font-semibold flex items-center justify-center transition-all cursor-pointer ${
                          formData.type === "4W"
                            ? "bg-white text-[#4338CA] shadow-xs border border-[#E2E8F0]/80"
                            : "text-[#64748B] hover:text-[#0F172A]"
                        }`}
                      >
                        4W — Car
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: "2W" })}
                        className={`flex-1 h-full rounded-lg text-lg font-semibold flex items-center justify-center transition-all cursor-pointer ${
                          formData.type === "2W"
                            ? "bg-white text-[#4338CA] shadow-xs border border-[#E2E8F0]/80"
                            : "text-[#64748B] hover:text-[#0F172A]"
                        }`}
                      >
                        2W — Bike
                      </button>
                    </div>
                  </div>
                </div>

                {/* Primary contact & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-lg font-semibold text-[#0F172A] mb-1.5">
                      Primary contact
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mr. Sharma (HR)"
                      value={formData.contact}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                      className="w-full h-11 px-3.5 rounded-xl border border-[#E2E8F0] bg-white text-lg text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-lg font-semibold text-[#0F172A] mb-1.5">
                      Phone
                    </label>
                    <input
                      type="text"
                      placeholder="+91"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full h-11 px-3.5 rounded-xl border border-[#E2E8F0] bg-white text-lg text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA] transition-all"
                    />
                  </div>
                </div>

                {/* Onboard date & Assign owner */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-lg font-semibold text-[#0F172A] mb-1.5">
                      Onboard date
                    </label>
                    <input
                      type="text"
                      placeholder="12 Aug 2026"
                      value={formData.onboard}
                      onChange={(e) => setFormData({ ...formData, onboard: e.target.value })}
                      className="w-full h-11 px-3.5 rounded-xl border border-[#E2E8F0] bg-white text-lg text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-lg font-semibold text-[#0F172A] mb-1.5">
                      Assign owner
                    </label>
                    <div className="relative">
                      <select
                        value={formData.owner}
                        onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                        className="w-full h-11 px-3.5 pr-10 rounded-xl border border-[#E2E8F0] bg-white text-lg font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA] transition-all cursor-pointer appearance-none"
                      >
                        <option value="Bhoomika">Bhoomika</option>
                        <option value="Prachi">Prachi</option>
                        <option value="Chirag">Chirag</option>
                      </select>
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#64748B]">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Note Box */}
                <div className="bg-[#EEF2FF] border border-[#C7D2FE]/70 rounded-xl p-3.5 flex items-start gap-3">
                  <div className="text-[#4338CA] flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <p className="text-lg text-[#3730A3] leading-relaxed">
                    On save, this auto-creates the <strong className="font-bold text-[#1E1B4B]">11 setup steps</strong> and the full <strong className="font-bold text-[#1E1B4B]">requirement checklist</strong>, and adds the client to the <strong className="font-bold text-[#1E1B4B]">Requirements</strong> column of the board.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-2.5 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#334155] text-lg font-semibold transition-all cursor-pointer shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateClient}
                  className="px-6 py-2.5 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white text-lg font-semibold transition-all cursor-pointer shadow-sm shadow-[#4338CA]/30 active:scale-95"
                >
                  Create client
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
