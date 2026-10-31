"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
// import { billPdfBase64 } from "./billPdf";
import { Api, EMAIL_RE, cardCls, inputCls, labelCls, noteCls, r2, toast } from "./utils";
import { Entry, Inv, Settings, TEMPLATES, VARS, amt, billHTML, calcInv, fillT, h2t, mailVars } from "./Invoice";

interface Props {
  api: Api; inv: Inv; rows: Entry[]; settings: Settings;
  saveSettings: (s: Settings, silent?: boolean) => Promise<void>; onSent: () => void;
}

const ComposeEmail = ({ api, inv, rows, settings, saveSettings, onSent }: Props) => {
  const co = settings.co;
  const edRef = useRef<HTMLDivElement>(null);
  const sjRef = useRef<HTMLInputElement>(null);
  const focus = useRef<"sj" | "ed">("ed");
  const [tpl, setTpl] = useState("bill");
  const [subject, setSubject] = useState("");
  const [sending, setSending] = useState(false);

  const list = useMemo(
    () => [...TEMPLATES, ...(settings.mine ? [{ k: "mine", n: "My Template", s: settings.mine.s, h: settings.mine.h }] : [])],
    [settings.mine]
  );

  const loadTpl = (k: string) => {
    const t = list.find((x) => x.k === k) || list[0];
    setSubject(t.s);
    if (edRef.current) edRef.current.innerHTML = t.h;
  };
  useEffect(() => { loadTpl(tpl); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [tpl, settings.mine]);

  const insertVar = (v: string) => {
    const tag = `{${v}}`;
    if (focus.current === "sj" && sjRef.current) {
      const el = sjRef.current, a = el.selectionStart ?? subject.length, b = el.selectionEnd ?? a;
      setSubject(subject.slice(0, a) + tag + subject.slice(b));
      requestAnimationFrame(() => { el.focus(); el.setSelectionRange(a + tag.length, a + tag.length); });
    } else {
      edRef.current?.focus();
      document.execCommand("insertText", false, tag);
    }
  };
  const fmt = (cmd: string, val?: string) => { edRef.current?.focus(); document.execCommand(cmd, false, val); };

  const bodyHtml = () => fillT(edRef.current?.innerHTML || "", mailVars(inv, co), true);

  const send = async () => {
    const { rows: invRows, T } = calcInv(inv, co);
    if (!inv.email.trim() || !inv.email.split(",").every((x) => EMAIL_RE.test(x.trim()))) return toast("Please enter a valid Email (To) in the invoice details.", "info");
    if (!invRows.length) return toast("Add at least one Module or usage line to the invoice.", "info");
    if (!subject.trim()) return toast("Subject is required.", "info");

    // Paid entries jinka naya bill ban gaya -> Due mark honge
    const markDue = inv.items
      .filter((i) => i.on && i.eid && i.kind === "module" && rows.find((r) => r.BE_ID === i.eid)?.Status === "Paid")
      .map((i) => ({ BE_ID: i.eid, Amount_Due: r2(amt(i) * (1 + (+(i.gst ?? inv.gst) || 0) / 100)) }));

    const body = bodyHtml();
    const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#111">${body}</div>`;
    const text = h2t(body);
    try {
      setSending(true);
      const res = await api("sendBillingInvoiceEmail", {
        To: inv.email,
        Cc: inv.cc,
        Subject: fillT(subject, mailVars(inv, co)),
        Html: html,
        Text: text,
        Client_Code: inv.cid,
        Client_Name: inv.name,
        Doc_No: inv.inv,
        Mark_Due: markDue,
        Next_Billing_Date: inv.due || null, Total: T.total,
        Bill_Html: billHTML(inv, co),
        Pdf_Name: `Invoice_${String(inv.inv).replace(/[\\/]/g, "-")}.pdf`,
      });
      if (res?.Status) { toast(res.Message || "Email sent"); onSent(); } else toast(res?.Message || "Email could not be sent", "error");
    } catch (e: any) {
      toast(e?.response?.data?.Message || "Email could not be sent", "error");
    } finally {
      setSending(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${fillT(subject, mailVars(inv, co))}\n\n${h2t(bodyHtml())}`);
      toast("Message copied");
    } catch (e) { toast("Copy failed", "error"); }
  };
  const saveMine = () => saveSettings({ ...settings, mine: { s: subject, h: edRef.current?.innerHTML || "" } });

  const tb = "h-8 min-w-8 px-2 rounded-md border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-sm text-[#334155] dark:text-white hover:border-[#3B82F6]";

  return (
    <div className={`${cardCls} space-y-3`}>
      <h3 className="font-bold text-[#1E293B] dark:text-white">2. Compose and send</h3>

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 md:col-span-4">
          <label className={labelCls}>Template</label>
          <select className={inputCls} value={tpl} onChange={(e) => setTpl(e.target.value)}>
            {list.map((t) => <option key={t.k} value={t.k}>{t.n}</option>)}
          </select>
        </div>
        <div className="col-span-12 md:col-span-8">
          <label className={labelCls}>Subject</label>
          <input ref={sjRef} className={inputCls} value={subject} onFocus={() => (focus.current = "sj")} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div className="col-span-12 md:col-span-6">
          <label className={labelCls}>Email (TO)</label>
          <input className={inputCls} disabled value={inv.email} placeholder="Enter the email in the invoice details above" />
        </div>
        <div className="col-span-12 md:col-span-6">
          <label className={labelCls}>Email (CC)</label>
          <input className={inputCls} disabled value={inv.cc} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Insert details (click)</label>
        <div className="flex flex-wrap gap-1.5">
          {VARS.map((v) => (
            <button key={v} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertVar(v)}
              className="px-2 py-1 rounded-md text-xs bg-[#EEF2FF] text-[#4338CA] dark:bg-[#312E81] dark:text-[#C7D2FE] hover:opacity-80">{`{${v}}`}</button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          <button type="button" className={tb} onMouseDown={(e) => e.preventDefault()} onClick={() => fmt("bold")}><b>B</b></button>
          <button type="button" className={tb} onMouseDown={(e) => e.preventDefault()} onClick={() => fmt("italic")}><i>I</i></button>
          <button type="button" className={tb} onMouseDown={(e) => e.preventDefault()} onClick={() => fmt("underline")}><u>U</u></button>
          <button type="button" className={tb} onMouseDown={(e) => e.preventDefault()} onClick={() => fmt("insertUnorderedList")}>• List</button>
          <button type="button" className={tb} onMouseDown={(e) => e.preventDefault()} onClick={() => fmt("insertOrderedList")}>1. List</button>
          <button type="button" className={tb} onMouseDown={(e) => e.preventDefault()} onClick={() => fmt("justifyLeft")}>⇤</button>
          <button type="button" className={tb} onMouseDown={(e) => e.preventDefault()} onClick={() => fmt("justifyCenter")}>↔</button>
          <button type="button" className={tb} onMouseDown={(e) => e.preventDefault()} onClick={() => fmt("undo")}>↶</button>
          <button type="button" className={tb} onMouseDown={(e) => e.preventDefault()} onClick={() => fmt("redo")}>↷</button>
        </div>
        <div ref={edRef} contentEditable suppressContentEditableWarning onFocus={() => (focus.current = "ed")}
          className="min-h-[170px] rounded-lg border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-[#334155] dark:text-white p-3 text-sm focus:outline-none focus:border-[#3B82F6]" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="save" onClick={send} disabled={sending}>{sending ? "Sending..." : "✉ Send Email"}</Button>
        <Button variant="outline" onClick={copy}>Copy message</Button>
        <Button variant="outline" onClick={saveMine}>Save as my template</Button>
      </div>
      <p className={noteCls}>The email is sent to the address entered in the invoice details. Module that were Paid are marked Due once the new bill is sent.</p>
    </div>
  );
};

export default ComposeEmail;