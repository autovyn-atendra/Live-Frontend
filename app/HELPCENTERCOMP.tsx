"use client";
import axios from "axios";
import { useEffect, useRef,useMemo, useState } from "react";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import Swal from "sweetalert2";
import { RiRobot2Line } from "react-icons/ri";

type MessageRole = "user" | "bot";
interface ChatMessage {
  id: number;
  role: MessageRole;
  text: string;
  time: string;
}

function showSideAlert(message: string, type: "success" | "error") {
  Swal.mixin({
    toast: true, position: "top-end",
    showConfirmButton: false, timer: 3000, timerProgressBar: true,
  }).fire({ icon: type, title: message });
}

const SYNONYMS = [
  { keywords: ["phone", "mobile", "cell", "number"],      field: "MOBILENO" },
  { keywords: ["employee code", "empcode", "emp code"],    field: "EMPCODE" },
  { keywords: ["email", "mail"],                           field: "CORPORATEMAILID" },
  { keywords: ["name", "full name"],                       field: "EMPFIRSTNAME" },
  { keywords: ["father", "dad"],                           field: "FATHERNAME" },
  { keywords: ["mother", "mom"],                           field: "MOTHERNAME" },
  { keywords: ["spouse", "husband", "wife"],               field: "SPOUSENAME" },
  { keywords: ["dob", "birthdate", "birthday"],            field: "DOB" },
  { keywords: ["designation", "job", "role", "position"], field: "EMPLOYEEDESIGNATION" },
];

const QUICK_CHIPS = [
  { label: "🪪", text: "Emp Code",    query: "What is my emp code?" },
  { label: "📞", text: "Mobile",      query: "What is my mobile number?" },
  { label: "📧", text: "Email",       query: "What is my email?" },
  { label: "🎂", text: "Date of Birth", query: "What is my dob?" },
  { label: "💼", text: "Designation", query: "What is my designation?" },
];

const nowStr = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

let msgId = 0;
const mkMsg = (role: MessageRole, text: string): ChatMessage => ({
  id: ++msgId, role, text, time: nowStr(),
});

const WELCOME = "👋 Hi there! I'm your AUTOVYN Assistant. Ask me anything about your profile or use the shortcuts below.";

export default function HelpIcon() {
  const user = useCurrentUser();
  const [open, setOpen]               = useState(false);
  const [unread, setUnread]           = useState(0);
  const [messages, setMessages]       = useState<ChatMessage[]>([mkMsg("bot", WELCOME)]);
  const [input, setInput]             = useState("");
  const [typing, setTyping]           = useState(false);
  const [faq, setFaq]                 = useState<{ id: number; q: string; a: string }[]>([]);
  const [search, setSearch]           = useState("");
  const [showModal, setShowModal]     = useState(false);
  const [message, setMessage]         = useState("");
  const [sending, setSending]         = useState(false);
  const [userDetails, setUserDetails] = useState<Record<string, any>>({});
  const [showChips, setShowChips]     = useState(true);
  const [focused, setFocused]         = useState(false);

  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);
  const dragRef    = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart  = useRef({ x: 0, y: 0 });
  const [btnPos, setBtnPos] = useState<{ right: number; bottom: number } | null>(null);

useEffect(() => {
  setTimeout(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end"
    });
  }, 50);
}, [messages, typing, faq]);

  useEffect(() => { fetchFaqs(""); }, []);

useEffect(() => {
  if (!search.trim()) {
    setFaq([]);
    return;
  }

  const t = setTimeout(() => {
    fetchFaqs(search);
  }, 100); // reduced from 400 → 100

  return () => clearTimeout(t);

}, [search]);

  useEffect(() => {
    if (open && user && Object.keys(userDetails).length === 0) fetchEmployeeDetails();
    if (open) { setUnread(0); setTimeout(() => inputRef.current?.focus(), 300); }
  }, [open]);

const fetchFaqs = async (q: string) => {
  if (!q.trim()) return;

  try {
    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/HelpCenter/getSupportFaq`,
      {
        search: q
      },
      {
        headers: {
          compcode: user?.Comp_Code,
          name: user?.name
        }
      }
    );

    setFaq(res.data.data || []);

  } catch (err) {
    console.log(err);
    setFaq([]);
  }
};

  const fetchEmployeeDetails = async () => {
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_URL}/HelpCenter/getEmployeeInfo`,
        { headers: { compcode: user?.Comp_Code, empcode: user?.EMPCODE } }
      );
      setUserDetails(res.data?.Data || {});
    } catch {}
  };

  const pushBot  = (text: string) => setMessages(p => [...p, mkMsg("bot", text)]);
  const pushUser = (text: string) => setMessages(p => [...p, mkMsg("user", text)]);

const handleQuestion = async (question: string) => {
  const q = question.trim();

  if (!q) return;

  pushUser(q);

  setInput("");
  setSearch("");
  setTyping(true);

 if (!user) {
  setTyping(false);

  pushBot(
    "⚠️ Please log in first to use the assistant."
  );

  pushBot(
    "💡Please enter Company Code, Username and Password, then click Login."
  );

  return;
}

  try {
    const lq = q.toLowerCase();

    // ==============================
    // STEP 1 : Shortcut fields
    // ==============================

    const match = SYNONYMS.find(e =>
      e.keywords.some(k =>
        lq.includes(k)
      )
    );

    if (match) {

      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_URL}/HelpCenter/getEmployeeInfo`,
        {
          headers: {
            compcode: user?.Comp_Code,
            empcode: user?.EMPCODE,
            requestedField: match.field
          }
        }
      );

      if (res.data.Status) {

        const d = res.data.Data;

        let answer =
          d[match.field] || "Not available";

        if (
          match.field === "EMPFIRSTNAME"
        ) {
          answer =
            `${d.EMPFIRSTNAME || ""} ${d.EMPLASTNAME || ""}`.trim();
        }

        if (
          ["DOB", "CURRENTJOINDATE"]
          .includes(match.field) &&
          answer !== "Not available"
        ) {
          answer =
            new Date(answer)
            .toLocaleDateString("en-IN");
        }

        setTyping(false);

        pushBot(`💡 ${answer}`);

        return;
      }
    }

    // ==============================
    // STEP 2 : FAQ SEARCH FIRST
    // ==============================

    const faqRes = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/HelpCenter/getSupportFaq`,
      {
        search: q
      },
      {
        headers: {
          compcode: user?.Comp_Code
        }
      }
    );

    if (
      faqRes.data.status &&
      faqRes.data.data &&
      faqRes.data.data.length > 0
    ) {

      setTyping(false);

      pushBot(
        `💡 ${faqRes.data.data[0].a}`
      );

      return;
    }

    // ==============================
    // STEP 3 : Dynamic Employee API
    // ==============================

    const dynamicRes = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/HelpCenter/getDynamicEmployeeInfo`,
      {
        question: q,
        empcode: user?.EMPCODE,
        compcode: user?.Comp_Code
      },
      {
        headers: {
          compcode: user?.Comp_Code
        }
      }
    );

    if (
      dynamicRes.data.Status &&
      dynamicRes.data.Answer &&
      dynamicRes.data.Answer !== "Not available"
    ) {

      setTyping(false);

      pushBot(
        `💡 ${dynamicRes.data.Answer}`
      );

      return;
    }

    // ==============================
    // STEP 4 : No result
    // ==============================

    setTyping(false);

    pushBot(
      "🤔 I couldn't find an answer. Try rephrasing or use ✉️ Drop Message."
    );

  }
  catch (error) {

    console.error(error);

    setTyping(false);

    pushBot(
      "❌ Something went wrong. Please try again."
    );
  }
};

  const handleMailSubmit = async () => {
    if (!user) { pushBot("⚠️ Please log in first."); return; }
    try {
      setSending(true);
      await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/HelpCenter/sendmailViaCusSupport`,
        { subject: "New Message from Website", message, userDetails },
        { headers: { compcode: user?.Comp_Code, name: user?.name } }
      );
      showSideAlert("Message sent successfully!", "success");
      setShowModal(false); setMessage("");
    } catch {
      showSideAlert("Failed to send message!", "error");
    } finally { setSending(false); }
  };

  const resetPanel = () => {
    setOpen(false); setInput(""); setSearch("");
    setShowModal(false); setMessage(""); setUnread(0);
    setShowChips(true); setTyping(false);
    setMessages([mkMsg("bot", WELCOME)]);
  };

  // ── Drag logic ──────────────────────────────────────────────────────────────
  const onDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isDragging.current = false;
    const el = dragRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    dragStart.current = {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };

    const onMove = (ev: MouseEvent | TouchEvent) => {
      isDragging.current = true;
      const cx = "touches" in ev ? ev.touches[0].clientX : (ev as MouseEvent).clientX;
      const cy = "touches" in ev ? ev.touches[0].clientY : (ev as MouseEvent).clientY;
      const newRight  = Math.max(8, window.innerWidth  - cx - (56 - dragStart.current.x));
      const newBottom = Math.max(8, window.innerHeight - cy - (56 - dragStart.current.y));
      setBtnPos({ right: newRight, bottom: newBottom });
    };

    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup",   onUp);
      document.removeEventListener("touchmove", onMove as any);
      document.removeEventListener("touchend",  onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup",   onUp);
    document.addEventListener("touchmove", onMove as any, { passive: false });
    document.addEventListener("touchend",  onUp);
  };

  const onBtnClick = () => {
    if (!isDragging.current) setOpen(o => !o);
  };
const CHAT_HEIGHT = 580;
const CHAT_WIDTH = 360;
const BUTTON_SIZE = 56;
const GAP = 12;

const panelPosition = useMemo(() => {
  if (!btnPos) {
    return {
      right: 24,
      bottom: 96
    };
  }

  // -------------------------
  // Vertical adjustment
  // -------------------------

  let bottom =
    btnPos.bottom + BUTTON_SIZE + GAP;

  const topSpace =
    window.innerHeight - bottom;

  if (topSpace < CHAT_HEIGHT) {
    bottom = Math.max(
      8,
      btnPos.bottom - CHAT_HEIGHT - GAP
    );
  }

  // -------------------------
  // Horizontal adjustment
  // -------------------------

  let right =
    btnPos.right - 4;

  const leftSpace =
    window.innerWidth - right;

  if (leftSpace < CHAT_WIDTH) {
    right = Math.max(
      8,
      btnPos.right - CHAT_WIDTH + BUTTON_SIZE
    );
  }

  return {
    right,
    bottom
  };

}, [btnPos]);

  return (
    <>
     <style suppressHydrationWarning>{`
  @keyframes popIn {
    0%   { opacity: 0; transform: scale(0.88) translateY(12px); }
    100% { opacity: 1; transform: scale(1)    translateY(0); }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes blink {
    0%,80%,100% { opacity: 0.2; transform: scale(0.8); }
    40%          { opacity: 1;   transform: scale(1); }
  }
  @keyframes pulse-ring {
    0%   { transform: scale(1);   opacity: 0.6; }
    100% { transform: scale(1.6); opacity: 0; }
  }
  .erp-chat-panel { animation: popIn 0.28s cubic-bezier(.34,1.56,.64,1) both; }
  .erp-msg        { animation: slideUp 0.22s ease both; }
  .erp-dot        { animation: blink 1.2s infinite; display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #4A6CF7; margin: 0 2px; }
  .erp-dot:nth-child(2) { animation-delay: 0.2s; }
  .erp-dot:nth-child(3) { animation-delay: 0.4s; }
  .erp-chip:hover { border-color: #4A6CF7 !important; color: #4A6CF7 !important; background: #eef2ff !important; }
  .dark .erp-chip:hover { background: #1e2d52 !important; }
  .erp-faq-btn:hover { background: #eef2ff !important; }
  .dark .erp-faq-btn:hover { background: #1e2d52 !important; }
  .erp-scroll::-webkit-scrollbar { width: 4px; }
  .erp-scroll::-webkit-scrollbar-track { background: transparent; }
  .erp-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
  .dark .erp-scroll::-webkit-scrollbar-thumb { background: #334155; }
  .erp-action:hover { background: #f1f5f9 !important; }
  .dark .erp-action:hover { background: #1e293b !important; }
  .erp-send:not(:disabled):hover { opacity: 0.88; transform: scale(1.05); }
  .erp-textarea:focus { outline: none; border-color: #4A6CF7 !important; box-shadow: 0 0 0 3px rgba(74,108,247,0.12); }
  .erp-input:focus  { outline: none; border-color: #4A6CF7 !important; box-shadow: 0 0 0 3px rgba(74,108,247,0.12); }
  div:has(> .erp-drag-tip):hover .erp-drag-tip { opacity: 1 !important; }
`}</style>

      {/* ── Floating trigger (draggable) ── */}
      <div
        ref={dragRef}
        style={{
          position:  "fixed",
          right:     btnPos ? btnPos.right  : 24,
          bottom:    btnPos ? btnPos.bottom : 24,
          zIndex:    50,
          isolation: "isolate",
          touchAction: "none",
          userSelect: "none",
        }}
        onMouseDown={onDragStart}
        onTouchStart={onDragStart}
      >
        {/* Drag hint tooltip */}
        <div style={{
          position:     "absolute",
          bottom:       "calc(100% + 6px)",
          left:         "50%",
          transform:    "translateX(-50%)",
          background:   "rgba(15,23,42,0.75)",
          color:        "#fff",
          fontSize:     "10px",
          padding:      "3px 8px",
          borderRadius: "6px",
          whiteSpace:   "nowrap",
          pointerEvents: "none",
          opacity:      0,
          transition:   "opacity 0.2s",
        }} className="erp-drag-tip">
          Drag to move
        </div>

        {!open && (
          <span style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            background: "rgba(74,108,247,0.35)",
            animation: "pulse-ring 2s ease-out infinite",
            pointerEvents: "none",
          }} />
        )}
        <button
          onClick={onBtnClick}
          title="ERP Assistant — drag to reposition"
         style={{
  position: "relative",
  width: "56px",
  height: "56px",
  borderRadius: "50%",
background: "linear-gradient(135deg,#3B82F6,#1E40AF)",
border: "1px solid rgba(255,255,255,0.15)",
color: "#fff",
  cursor: isDragging.current ? "grabbing" : "grab",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "22px",
  boxShadow: "0 4px 20px rgba(74,108,247,0.25)",
  transition: "all 0.2s ease",
}}

        >
          {open
            ? <span style={{ color: "#000000", fontSize: "18px", fontWeight: 700, lineHeight: 1 }}>✕</span>
            : <span><RiRobot2Line size={22} /></span>
          }
          {!open && unread > 0 && (
            <span style={{
              position: "absolute", top: "-2px", right: "-2px",
              background: "#ef4444", color: "#fff",
              fontSize: "10px", fontWeight: 700,
              width: "18px", height: "18px", borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "2px solid #fff",
            }}>
              {unread}
            </span>
          )}
        </button>
      </div>

      {/* ── Backdrop ── */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: "rgba(15,23,42,0.35)", backdropFilter: "blur(2px)" }}
          onClick={resetPanel}
        />
      )}

      {/* ── Chat Panel ── */}
      {open && (
        <div
          className="erp-chat-panel fixed z-50 flex flex-col
            bg-white dark:bg-dark
            border border-borderColor dark:border-input"
          style={{
             bottom: `${panelPosition.bottom}px`,
  right: `${panelPosition.right}px`,
            width:        "360px",
            height:       "580px",
            borderRadius: "20px",
            boxShadow:    "0 24px 60px rgba(15,23,42,0.18), 0 8px 24px rgba(74,108,247,0.12)",
            overflow:     "hidden",
          }}
        >
          {/* ── Header ── */}
          <div style={{
            background: "linear-gradient(135deg, #193A69 0%, #162458 100%)",
            padding:    "14px 16px",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {/* Avatar with online ring */}
                <div style={{ position: "relative" }}>
                  <div style={{
                    width:          "40px",
                    height:         "40px",
                    borderRadius:   "50%",
                    background: "#F1F5F9",
                    border:         "2px solid rgba(74,108,247,0.5)",
                    display:        "flex",
                    alignItems:     "center",
                    justifyContent: "center",
                    fontSize:       "18px",
                    
                  }}>
  <img
    src="/logo.png"
    alt="Autovyn"
    style={{
      width: "100%",
      height: "100%",
      objectFit: "contain",
      borderRadius: "50%",
      padding: "4px"
    }}
  />
</div>
                  <span style={{
                    position:     "absolute",
                    bottom:       "1px",
                    right:        "1px",
                    width:        "10px",
                    height:       "10px",
                    borderRadius: "50%",
                    background:   "#4ade80",
                    border:       "2px solid #162458",
                  }} />
                </div>
                <div>
                  <p style={{ color: "#fff", fontWeight: 600, fontSize: "16px", margin: 0, letterSpacing: "0.3px" }}>
                    AUTOVYN Assistant
                  </p>
                  <p style={{ color: "#93c5fd", fontSize: "11px", margin: 0, display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
                    Ask. Get. Done.
                  </p>
                </div>
              </div>

              {/* Header actions */}
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <a
                  href="tel:9079782505"
                  title="Call support"
                  style={{
                    width:          "30px",
                    height:         "30px",
                    borderRadius:   "50%",
                    background:     "rgba(255,255,255,0.1)",
                    border:         "none",
                    display:        "flex",
                    alignItems:     "center",
                    justifyContent: "center",
                    cursor:         "pointer",
                    fontSize:       "14px",
                    textDecoration: "none",
                    transition:     "background 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                >📞</a>
                <a
                  href="https://www.youtube.com/@AUTOVYN-ERP"
                  target="_blank" rel="noopener noreferrer"
                  title="Demo videos"
                  style={{
                    width:          "30px",
                    height:         "30px",
                    borderRadius:   "50%",
                    background:     "rgba(255,255,255,0.1)",
                    border:         "none",
                    display:        "flex",
                    alignItems:     "center",
                    justifyContent: "center",
                    cursor:         "pointer",
                    fontSize:       "14px",
                    textDecoration: "none",
                    transition:     "background 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                >▶️</a>
                <button
                  onClick={resetPanel}
                  style={{
                    width:          "30px",
                    height:         "30px",
                    borderRadius:   "50%",
                    background:     "rgba(255,255,255,0.1)",
                    border:         "none",
                    display:        "flex",
                    alignItems:     "center",
                    justifyContent: "center",
                    cursor:         "pointer",
                    color:          "rgba(255,255,255,0.7)",
                    fontSize:       "14px",
                    transition:     "background 0.15s",
                  }}
                  onMouseEnter={e => { (e.currentTarget.style.background = "rgba(255,255,255,0.2)"); (e.currentTarget.style.color = "#fff"); }}
                  onMouseLeave={e => { (e.currentTarget.style.background = "rgba(255,255,255,0.1)"); (e.currentTarget.style.color = "rgba(255,255,255,0.7)"); }}
                >✕</button>
              </div>
            </div>
          </div>

          {/* ── Messages ── */}
          <div
            className="erp-scroll flex-1 overflow-y-auto"
            style={{ padding: "16px 14px", display: "flex", flexDirection: "column", gap: "12px", background: "inherit" }}
          >
            {messages.map((msg, i) => (
              <div
                key={msg.id}
                className="erp-msg"
                style={{
                  display:        "flex",
                  flexDirection:  msg.role === "user" ? "row-reverse" : "row",
                  alignItems:     "flex-end",
                  gap:            "8px",
                  animationDelay: `${i * 0.03}s`,
                }}
              >
                {/* Bot avatar */}
                {msg.role === "bot" && (
                  <div style={{
                    width:          "28px",
                    height:         "28px",
                    borderRadius:   "50%",
                    background: "#F1F5F9",
                    border:         "1px solid rgba(74,108,247,0.25)",
                    display:        "flex",
                    alignItems:     "center",
                    justifyContent: "center",
                    fontSize:       "13px",
                    flexShrink:     0,
                 }}>
  <img
    src="/logo.png"
    alt="Autovyn"
    style={{
      width: "100%",
      height: "100%",
      objectFit: "contain",
      borderRadius: "50%",
      padding: "4px"
    }}
  />
</div>
                )}

                <div style={{
                  display:       "flex",
                  flexDirection: "column",
                  alignItems:    msg.role === "user" ? "flex-end" : "flex-start",
                  maxWidth:      "76%",
                  gap:           "3px",
                }}>
                  <div style={{
                    padding:      "10px 14px",
                    borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    fontSize:     "13px",
                    lineHeight:   "1.5",
                    ...(msg.role === "user"
                      ? {
                          background: "linear-gradient(135deg, #4A6CF7 0%, #193A69 100%)",
                          color:      "#fff",
                          boxShadow:  "0 2px 8px rgba(74,108,247,0.3)",
                        }
                      : {
                          background: "var(--bot-bg, #ffffff)",
                          color:      "var(--bot-text, #1e293b)",
                          border:     "1px solid rgba(0,0,0,0.07)",
                          boxShadow:  "0 1px 4px rgba(0,0,0,0.06)",
                        }
                    ),
                  }}
                  className={msg.role === "bot" ? "dark:bg-input dark:text-white dark:border-input" : ""}
                  >
                    {msg.text}
                  </div>
                  <span style={{ fontSize: "10px", color: "#94a3b8", padding: "0 4px" }}>
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {typing && (
              <div className="erp-msg" style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
                <div style={{
                  width: "28px", height: "28px", borderRadius: "50%",
                  background: "#F1F5F9", border: "1px solid rgba(74,108,247,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", flexShrink: 0,
              }}>
  <img
    src="/logo.png"
    alt="Autovyn"
    style={{
      width: "100%",
      height: "100%",
      objectFit: "contain",
      borderRadius: "50%",
      padding: "4px"
    }}
  />
</div>
                <div style={{
                  padding: "12px 16px", borderRadius: "18px 18px 18px 4px",
                  background: "#fff", border: "1px solid rgba(0,0,0,0.07)",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  display: "flex", alignItems: "center", gap: "3px",
                }} className="dark:bg-input dark:border-input">
                  <span className="erp-dot" />
                  <span className="erp-dot" />
                  <span className="erp-dot" />
                </div>
              </div>
            )}

            {/* Live FAQ suggestions */}
            {search.length > 0 && faq.length > 0 && (
              <div style={{ marginTop: "4px" }}>
                <p style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 600, letterSpacing: "0.8px", textTransform: "uppercase", margin: "0 0 6px 0" }}>
                  Suggestions
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {faq.slice(0, 3).map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleQuestion(item.q)}
                      className="erp-faq-btn dark:bg-input dark:text-white dark:border-input"
                      style={{
                        textAlign:    "left",
                        padding:      "8px 12px",
                        borderRadius: "10px",
                        border:       "1px solid #e2e8f0",
                        background:   "#fff",
                        color:        "#1e293b",
                        fontSize:     "12px",
                        cursor:       "pointer",
                        transition:   "background 0.15s",
                      }}
                    >
                      ❓ {item.q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* ── Quick Chips ── */}
          
            <div
              className="shrink-0 border-t border-borderColor dark:border-input bg-white dark:bg-dark"
              style={{ padding: "10px 14px 8px" }}
            >
              <p style={{ fontSize: "10px", color: "#030b17", fontWeight: 600, letterSpacing: "0.8px", textTransform: "uppercase", margin: "0 0 8px 0" }}>
                Quick info
              </p>
              <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "2px", scrollbarWidth: "none" }}>
                {QUICK_CHIPS.map(chip => (
                  <button
                    key={chip.text}
                    onClick={() => handleQuestion(chip.query)}
                    className="erp-chip dark:border-input dark:text-white dark:bg-input"
                    style={{
                      flexShrink:   0,
                      display:      "flex",
                      alignItems:   "center",
                      gap:          "5px",
                      padding:      "6px 11px",
                      borderRadius: "20px",
                      border:       "1px solid #e2e8f0",
                      background:   "#f8fafc",
                      color:        "#334155",
                      fontSize:     "11px",
                      fontWeight:   500,
                      cursor:       "pointer",
                      whiteSpace:   "nowrap",
                      transition:   "all 0.15s",
                    }}
                  >
                    <span style={{ fontSize: "13px" }}>{chip.label}</span>
                    {chip.text}
                  </button>
                ))}
              </div>
            </div>
          

          {/* ── Input bar ── */}
          <div
            className="shrink-0 bg-white dark:bg-dark"
            style={{
              padding:    "10px 14px 14px",
              borderTop:  focused ? "1px solid #4A6CF7" : "1px solid transparent",
              transition: "border-color 0.2s ease",
            }}
          >
            {/* Drop message link */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px" }}>
              <button
                onClick={() => setShowModal(true)}
                className="dark:text-b300"
                style={{
                  background:    "none",
                  border:        "none",
                  fontSize:      "14px",
                  color:         "#4A6CF7",
                  cursor:        "pointer",
                  display:       "flex",
                  alignItems:    "center",
                  gap:           "4px",
                  padding:       "2px 8px",
                  borderRadius:  "20px",
                  opacity:       0.75,
                  transition:    "opacity 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "0.75")}
              >
                ✉️ <span>Can't find what you need? Drop us a message</span>
              </button>
            </div>

            <div style={{
              display:      "flex",
              gap:          "8px",
              alignItems:   "center",
              background:   focused ? "#fff" : "#f8fafc",
              border:       `1.5px solid ${focused ? "#4A6CF7" : "#e2e8f0"}`,
              borderRadius: "14px",
              padding:      "4px 4px 4px 14px",
              transition:   "all 0.2s ease",
              boxShadow:    focused ? "0 0 0 3px rgba(74,108,247,0.1)" : "none",
            }} className="dark:bg-input dark:border-input">
              <input
                ref={inputRef}
                value={input}
                onChange={e => { setInput(e.target.value); setSearch(e.target.value); }}
                onKeyDown={e => { if (e.key === "Enter") handleQuestion(input); }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Ask anything…"
                className="dark:text-white dark:placeholder:text-grey"
                style={{
                  flex:        1,
                  border:      "none",
                  background:  "transparent",
                  fontSize:    "13px",
                  color:       "#1e293b",
                  outline:     "none",
                  padding:     "6px 0",
                  lineHeight:  1.4,
                }}
              />
              <button
                onClick={() => handleQuestion(input)}
                disabled={!input.trim() || typing}
                className="erp-send"
                style={{
                  width:          "36px",
                  height:         "36px",
                  borderRadius:   "10px",
                  background:     !input.trim() || typing
                    ? "#e2e8f0"
                    : "linear-gradient(135deg, #4A6CF7 0%, #193A69 100%)",
                  border:         "none",
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "center",
                  cursor:         !input.trim() || typing ? "not-allowed" : "pointer",
                  color:          !input.trim() || typing ? "#94a3b8" : "#fff",
                  fontSize:       "16px",
                  flexShrink:     0,
                  transition:     "all 0.2s ease",
                }}
              >➤</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Drop Message Modal ── */}
      {showModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="erp-chat-panel w-full bg-white dark:bg-dark border border-borderColor dark:border-input"
            style={{ maxWidth: "380px", borderRadius: "20px", overflow: "hidden", boxShadow: "0 24px 60px rgba(15,23,42,0.25)" }}
          >
            {/* Modal header */}
            <div style={{
              background: "linear-gradient(135deg, #193A69 0%, #162458 100%)",
              padding:    "14px 16px",
              display:    "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  width: "34px", height: "34px", borderRadius: "50%",
                  background: "rgba(255,255,255,0.12)", display: "flex",
                  alignItems: "center", justifyContent: "center", fontSize: "16px",
                }}>✉️</div>
                <div>
                  <p style={{ color: "#fff", fontWeight: 600, fontSize: "14px", margin: 0 }}>Drop a message</p>
                  <p style={{ color: "#93c5fd", fontSize: "11px", margin: 0, marginTop: "1px" }}>We'll reply to your registered email</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  width: "30px", height: "30px", borderRadius: "50%",
                  background: "rgba(255,255,255,0.1)", border: "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "rgba(255,255,255,0.7)", fontSize: "14px", cursor: "pointer",
                }}
              >✕</button>
            </div>

            <div style={{ padding: "16px" }}>
              <textarea
                className="erp-textarea dark:bg-input dark:border-input dark:text-white dark:placeholder:text-grey"
                rows={5}
                placeholder="Describe your issue in detail — the more specific, the faster we can help…"
                value={message}
                onChange={e => setMessage(e.target.value)}
                style={{
                  width:        "100%",
                  borderRadius: "12px",
                  padding:      "12px 14px",
                  fontSize:     "13px",
                  lineHeight:   1.6,
                  border:       "1.5px solid #e2e8f0",
                  background:   "#f8fafc",
                  color:        "#1e293b",
                  resize:       "none",
                  boxSizing:    "border-box",
                  transition:   "border-color 0.2s, box-shadow 0.2s",
                  fontFamily:   "inherit",
                }}
              />

              {/* Character count */}
              <p style={{ fontSize: "11px", color: "#94a3b8", textAlign: "right", margin: "4px 0 12px" }}>
                {message.length} characters
              </p>

              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <button
                  onClick={() => setShowModal(false)}
                  className="dark:border-input dark:text-grey"
                  style={{
                    padding:      "9px 18px",
                    borderRadius: "10px",
                    border:       "1.5px solid #e2e8f0",
                    background:   "transparent",
                    color:        "#64748b",
                    fontSize:     "13px",
                    fontWeight:   500,
                    cursor:       "pointer",
                    transition:   "background 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f1f5f9")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >Cancel</button>
                <button
                  onClick={handleMailSubmit}
                  disabled={sending || !message.trim()}
                  style={{
                    padding:      "9px 22px",
                    borderRadius: "10px",
                    border:       "none",
                    background:   sending || !message.trim()
                      ? "#e2e8f0"
                      : "linear-gradient(135deg, #4A6CF7 0%, #193A69 100%)",
                    color:        sending || !message.trim() ? "#94a3b8" : "#fff",
                    fontSize:     "13px",
                    fontWeight:   600,
                    cursor:       sending || !message.trim() ? "not-allowed" : "pointer",
                    display:      "flex",
                    alignItems:   "center",
                    gap:          "6px",
                    boxShadow:    sending || !message.trim() ? "none" : "0 2px 8px rgba(74,108,247,0.35)",
                    transition:   "all 0.2s ease",
                  }}
                >
                  {sending ? (
                    <>
                      <span className="erp-dot" style={{ background: "#94a3b8" }} />
                      <span className="erp-dot" style={{ background: "#94a3b8", animationDelay: "0.2s" }} />
                      <span className="erp-dot" style={{ background: "#94a3b8", animationDelay: "0.4s" }} />
                    </>
                  ) : (
                    <> ✉️ Send message</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
