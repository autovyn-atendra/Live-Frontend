import { MOS, r2, n2, money, esc, addMonths, minus1, todayYMD, fyOf, dayDiff, dmy, dmyLong, dmyShort, words, stateLine, dmy as fmtDmy } from "./utils";

/* ---------------- types ---------------- */
export interface Entry {
  BE_ID: number; Client_Code: string; Client_Name: string; Contact_Person: string; Mobile_No: string;
  Email?: string; CC_Email?: string; Billing_Address?: string; GSTIN?: string; Company_Type?: string; Invoice_Type?: string;
  BMM_ID?: number | null; Module_Name: string; Kind: string; Pricing_Model?: string; Unit_Label?: string;
  Qty?: number | null; Rate?: number | null; Frequency?: string; GST_Percent?: number | null; SAC_HSN?: string;
  Start_Date?: string; Last_Billing_Date?: string; Next_Billing_Date?: string; Status: "Paid" | "Due";
  Amount_Paid?: number | null; Amount_Due?: number | null; Payment_Date?: string | null; Reference_No?: string;
  Receipt_Image?: string; Remarks?: string; Create_by?: string; Updated_By?: string; Created_At?: string;
}
export interface Master {
  BMM_ID: number; Kind: "module" | "api"; Name: string; Pricing_Model: string; Unit_Label: string; Min_Qty: number;
  Rate: number; Frequency: string; GST_Percent: number; SAC_HSN?: string; Description?: string; Is_Live: boolean | number;
}
export interface PModel { Model_Key: string; Model_Name: string; Unit_Label: string }
export interface LogRow {
  Log_ID: number; Client_Code?: string; Client_Name?: string; Channel: string; Mode: string; Doc_No?: string;
  Result: string; Sent_By?: string; Next_Billing_Date?: string; Sent_At: string;
}
export interface Settings {
  co: Record<string, string>;
  mine: { s: string; h: string } | null;
  auto: { mode: "manual" | "auto"; days: number; e: boolean; w: boolean; repeat: number };
}

/* ---------------- defaults ---------------- */
export const DEF_CO: Record<string, string> = {
  name: "VYN Automation Private Limited", tag: "ERP Consultant", cin: "U74999RJ2018PTC082466", tax: "08AAGCV6609K1ZV",
  pan: "AAGCV6609K", tan: "BPLV04120E", gst: "18", acno: "019705009882", ifsc: "ICIC0006759",
  bank: "ICICI Bank, JHOTWARA, JAIPUR (RAJ.)", for: "VYN Automation Pvt Ltd", brand: "AUTO-VYN", pfx: "OE", next: "227",
  phone: "(O) +91- 9799318629, Mob., +91-9079782505", email: "Director@autovyn.com, Yuvraj@autovyn.com",
  addr: "Plot No. B-14, Block B Scheme, 4F New Colony, Path No.7, Pratap Nagar Chouraha, Murilipura, Jaipur (Raj) PIN - 302039",
  pay: "", note: "", sign: "", logo: "",
};
export const DEF_SETTINGS: Settings = { co: DEF_CO, mine: null, auto: { mode: "manual", days: 15, e: true, w: true, repeat: 0 } };
export const CO_KEYS = ["name", "tag", "cin", "tax", "pan", "tan", "gst", "acno", "ifsc", "bank", "for", "brand", "pfx", "next", "phone", "email", "addr", "pay", "note"];

export const TEMPLATES = [
  { k: "bill", n: "Invoice", s: "{invoice_type} {invoice_no} - {module} | {company}",
    h: "<p>Dear {contact_person},</p><p>Please find below the {invoice_type} (No. {invoice_no}) for {module}, amounting to <b>{amount}</b> and due on <b>{due_date}</b>.</p><p>Kindly share the payment reference number once the payment has been made.</p><p>Regards,<br>{company}</p>" },
  { k: "rem", n: "Friendly Reminder", s: "Payment Reminder: {module} due on {due_date}",
    h: "<p>Dear {contact_person},</p><p>This is a gentle reminder that the payment of <b>{amount}</b> for {module} is due on <b>{due_date}</b>.</p><p>If the payment has already been made, please ignore this message.</p><p>Regards,<br>{company}</p>" },
  { k: "ovd", n: "Overdue Notice", s: "Overdue Payment: {module}",
    h: "<p>Dear {contact_person},</p><p>The payment of <b>{amount}</b> for {module} was due on <b>{due_date}</b> and is still pending. Kindly make the payment at the earliest and share the reference number.</p><p>Regards,<br>{company}</p>" },
];
export const VARS = ["company_name", "contact_person", "module", "amount", "due_date", "invoice_no", "invoice_type", "company", "bill_date"];
export const fillT = (t: string, v: Record<string, string>, html?: boolean) =>
  String(t).replace(/\{(\w+)\}/g, (m, k) => (k in v ? (html ? esc(v[k]) : v[k]) : m));
export const h2t = (h: string) => {
  const d = document.createElement("div");
  d.innerHTML = h.replace(/<\/p>|<br\s*\/?>/gi, "\n");
  return (d.textContent || "").trim();
};

/* ---------------- invoice model ---------------- */
export interface UsageLine { d: string; q: string | number; r: string | number }
export interface Inv {
  cid: string; name: string; person: string; mobile: string; email: string; cc: string; addr: string; gstin: string;
  type: "pre" | "tax"; inv: string; date: string; due: string; gst: string | number; sac: string; amount: string;
  items: any[]; lines: UsageLine[];
}
export const emptyInv = (co: Record<string, string>): Inv => ({
  cid: "", name: "", person: "", mobile: "", email: "", cc: "", addr: "", gstin: "", type: "pre",
  inv: docNo("pre", co), date: todayYMD(), due: "", gst: co.gst || "18", sac: "", amount: "", items: [], lines: [],
});

export const docNo = (t: string, co: Record<string, string>) =>
  (t === "tax" ? "" : "PRE/") + fyOf(todayYMD()) + "/" + (co.pfx || "OE") + "/" + (co.next || 1);

export const billAmt = (r: Entry) => (r.Status === "Due" && r.Amount_Due ? r.Amount_Due : r.Amount_Paid || r.Amount_Due || 0);
export const amt = (i: any) => (i.kind === "module" ? r2((+i.qty || 0) * (+i.rate || 0) * (+i.mo || 1)) : r2((+i.qty || 0) * (+i.rate || 0)));

export function itemFromEntry(e: Entry, on = true) {
  const api = e.Kind === "api", mo = MOS[e.Frequency || "monthly"] || 1;
  let qty: any = e.Qty ?? "", rate: any = e.Rate || 0, m2 = mo, legacy = false;
  if (!api && (!e.Qty || !e.Rate)) { qty = 1; rate = billAmt(e) || 0; m2 = 1; legacy = true; }
  const nx = e.Next_Billing_Date || todayYMD();
  return {
    eid: e.BE_ID, kind: api ? "api" : "module", title: e.Module_Name, unit: e.Unit_Label || "unit", qty, rate, mo: m2, legacy,
    pf: api ? addMonths(nx, -mo) : nx, pt: api ? minus1(nx) : minus1(addMonths(nx, mo)),
    sac: e.SAC_HSN || "998314", gst: e.GST_Percent, nx, on,
  };
}

export function invFromEntries(es: Entry[], co: Record<string, string>): Inv {
  const f = es[0];
  const t = (f.Invoice_Type === "tax" ? "tax" : "pre") as "pre" | "tax";
  return {
    cid: f.Client_Code, name: f.Client_Name, person: f.Contact_Person, mobile: f.Mobile_No, email: f.Email || "", cc: f.CC_Email || "",
    addr: f.Billing_Address || "", gstin: f.GSTIN || "", type: t, inv: docNo(t, co), date: todayYMD(),
    due: es.map((e) => e.Next_Billing_Date || "").filter(Boolean).sort()[0] || "",
    gst: f.GST_Percent != null ? f.GST_Percent : co.gst || "18", sac: "", amount: "",
    items: es.map((e) => itemFromEntry(e)), lines: [],
  };
}

// invoice rows (description table)
export function buildRows(c: Inv) {
  const inc = c.items.filter((i) => i.on);
  const sac = (x?: string) => c.sac || x || "998314";
  const rows: any[] = [];
  inc.filter((i) => i.kind !== "api").forEach((i) =>
    rows.push({
      title: i.title, pf: i.pf, pt: i.pt, sac: sac(i.sac), lines: [], amount: amt(i),
      note: i.kind === "module" && !i.legacy ? `(${Number(r2(i.qty * i.rate)).toLocaleString("en-IN")} Monthly)` : "",
    })
  );
  const ap = inc.filter((i) => i.kind === "api");
  const manual = c.lines.filter((l) => l.d || +l.q || +l.r).map((l) => ({ d: l.d || "Usage", q: +l.q || 0, r: +l.r || 0 }));
  const lines = [...ap.map((i) => ({ d: i.title, q: +i.qty || 0, r: +i.rate || 0 })), ...manual];
  if (lines.length)
    rows.push({
      title: "Third-Party API Consumption",
      pf: ap.length ? ap.map((i) => i.pf).sort()[0] : "", pt: ap.length ? ap.map((i) => i.pt).sort().pop() : "",
      note: "", sac: sac(ap[0]?.sac), lines, amount: r2(lines.reduce((a, l) => a + l.q * l.r, 0)),
    });
  // Lines / Modules khaali ho to Taxable Amount wali value
  if (!rows.length && +c.amount > 0)
    rows.push({ title: "Modules Charges", pf: "", pt: "", note: "", sac: sac(), lines: [], amount: r2(+c.amount) });
  return rows;
}

export function totals(base: number, gstPct: any, coTax: string, clientGstin: string) {
  const g = +gstPct || 0, a = String(coTax || "").slice(0, 2), b = String(clientGstin || "").slice(0, 2);
  const intra = !(/^\d\d$/.test(a) && /^\d\d$/.test(b) && a !== b), h = g / 2;
  const cg = intra ? r2((base * h) / 100) : 0, sg = cg, ig = intra ? 0 : r2((base * g) / 100);
  const tax = r2(cg + sg + ig), raw = base + tax, total = Math.round(raw);
  return { base: r2(base), g, intra, cgR: intra ? h : 0, sgR: intra ? h : 0, igR: intra ? 0 : g, cg, sg, ig, tax, ro: r2(total - raw), total };
}

export function calcInv(c: Inv, co: Record<string, string>) {
  const rows = buildRows(c);
  const base = r2(rows.reduce((a, r) => a + r.amount, 0));
  const T = totals(base, c.gst, co.tax, c.gstin);
  const names = c.items.filter((i) => i.on).map((i) => i.title);
  if (c.lines.some((l) => l.d || +l.q || +l.r)) names.push("Usage / Consumption");
  return { rows, T, module: names.join(", ") || "Modules" };
}

export const mailVars = (c: Inv, co: Record<string, string>) => {
  const { T, module } = calcInv(c, co);
  return {
    company_name: c.name, client_name: c.name, contact_person: c.person || c.name, module, amount: money(T.total),
    invoice_type: c.type === "tax" ? "Tax Invoice" : "Pre Invoice", due_date: dmy(c.due), invoice_no: c.inv,
    company: co.name, bill_date: dmy(todayYMD()),
  } as Record<string, string>;
};

/* ---------------- invoice HTML (preview + email) ---------------- */
export function billHTML(c: Inv, co: Record<string, string>) {
  const { rows, T } = calcInv(c, co);
  const tax = c.type === "tax", B = "1.5px solid #000", hb = "background:#8EAADB";
  const cube = '<svg width="54" height="54" viewBox="0 0 54 54"><polygon points="27,3 50,15 27,27 4,15" fill="#f59e0b"/><polygon points="4,15 27,27 27,51 4,39" fill="#ef4444"/><polygon points="50,15 27,27 27,51 50,39" fill="#2563eb"/></svg>';
  const lg = `<div style="text-align:center">${co.logo ? `<img src="${co.logo}" style="height:54px">` : cube}<div style="font-size:12px;color:#c0392b">${esc(co.brand)}</div></div>`;
  const rowH = (r: any, i: number) => {
    const per = r.pf && r.pt ? "From " + dmyShort(r.pf) + " to " + dmyShort(r.pt) + (r.note ? " " + esc(r.note) : "") : esc(r.note || "");
    const lines = (r.lines || []).map((l: any) => `<div style="border-bottom:${B};padding:3px;font-size:11px;font-weight:400">${esc(l.d)} (${l.q}*${l.r})</div>`).join("");
    const cb = `border-left:${B};border-right:${B}`;
    return `<tr style="vertical-align:top"><td style="${cb};text-align:center;padding-top:20px">${i + 1}</td><td style="${cb};text-align:center;padding:16px 0 6px;font-weight:700"><div style="font-size:13px;padding-bottom:6px">${esc(r.title) || "—"}</div>${per ? `<div style="font-size:11px;border-top:${B};border-bottom:${B};padding:2px 6px">${per}</div>` : ""}${lines}</td><td style="${cb};text-align:center;padding-top:20px">${esc(r.sac)}</td><td style="${cb};text-align:right;padding:20px 8px 0 0;font-size:13px">${n2(r.amount)}</td></tr>`;
  };
  const fill = `<tr style="height:${Math.max(30, 230 - rows.length * 90)}px"><td style="border:${B};border-top:0"></td><td style="border:${B};border-top:0"></td><td style="border:${B};border-top:0"></td><td style="border:${B};border-top:0"></td></tr>`;
  const tr = (l: string, p: number, v: number) => `<tr><td style="padding:3px 6px;text-align:right">Add : ${l} @</td><td style="padding:3px 6px;text-align:center;border-bottom:1px dotted #000;width:60px">${p}%</td><td style="padding:3px 6px;text-align:right;width:110px">${v ? n2(v) : "-"}</td></tr>`;
  const kv = (a: string, b: string) => `<tr><td style="padding:1px 4px">${a}</td><td style="padding:1px 4px">${esc(b)}</td></tr>`;
  return `<div style="font-family:Cambria,Georgia,'Times New Roman',serif;color:#000;background:#fff;border:2px solid #000;font-size:12px;min-width:760px;max-width:900px">
<div style="${hb};text-align:center;padding:12px 8px 6px;position:relative"><div style="position:absolute;left:14px;top:40px">${lg}</div><div style="position:absolute;right:14px;top:40px">${lg}</div>
<div style="font-size:30px;font-weight:700">${esc(co.name)}</div><div style="font-size:21px;font-weight:700">${esc(co.tag)}</div>${co.cin ? `<div style="font-size:11px;font-weight:700">CIN - ${esc(co.cin)}</div>` : ""}<div style="font-size:11px;font-weight:700">GSTIN - ${esc(co.tax)}</div><div style="height:26px"></div></div>
<div style="${hb};border-top:${B};border-bottom:${B};text-align:center;font-weight:700;padding:2px 0">${tax ? "TAX - INVOICE" : "PRE - INVOICE"}</div>
<table style="width:100%;border-collapse:collapse"><tr><td style="width:60px;text-align:right;font-weight:700;vertical-align:top;padding:8px 6px">To,</td><td style="padding:8px 6px"><div style="font-size:17px;font-weight:700">${esc(c.name) || "—"}</div><div style="white-space:pre-line;font-size:11px;font-weight:700">${esc(c.addr)}</div><div style="margin-top:8px"><b>GSTIN No :</b> ${esc(c.gstin)}</div><div style="font-size:10px;font-weight:700;font-style:italic">${esc(stateLine(c.gstin))}</div></td>
<td style="width:215px;border-left:${B};vertical-align:top;padding:8px 6px"><div style="display:flex;justify-content:space-between;gap:8px"><b>Doc. No.</b><b>${esc(c.inv) || "—"}</b></div><div style="display:flex;justify-content:space-between;margin-top:26px"><b>Date :-</b><b>${dmyLong(c.date)}</b></div></td></tr></table>
<table style="width:100%;border-collapse:collapse"><tr style="${hb};font-weight:700;text-align:center"><td style="width:60px;border:${B};padding:3px">S. No.</td><td style="border:${B};padding:3px">Description of Modules</td><td style="width:90px;border:${B};padding:3px">SAC</td><td style="width:150px;border:${B};padding:3px">Taxable Amount (Rs.)</td></tr>${rows.map(rowH).join("")}${fill}</table>
<table style="width:100%;border-collapse:collapse"><tr style="vertical-align:top"><td style="width:42%;padding:8px 6px"><table style="width:100%;border:${B};font-size:11px;border-collapse:collapse">${kv("PAN No. :", co.pan)}${kv("TAN:", co.tan)}${kv("GSTIN :", co.tax)}${kv("A/C No.", co.acno)}${kv("IFSC Code", co.ifsc)}<tr><td colspan="2" style="padding:1px 4px">${esc(co.bank)}</td></tr></table></td>
<td style="padding:8px 0"><div style="text-align:right;font-weight:700;font-size:14px;padding-right:8px;border-bottom:${B};padding-bottom:3px">${n2(T.base)}</div>
<table style="width:100%;font-size:11px;border-collapse:collapse">${tr("CGST", T.cgR, T.cg)}${tr("SGST", T.sgR, T.sg)}${tr("IGST", T.igR, T.ig)}${tr("CESS", 0, 0)}<tr><td colspan="2" style="text-align:right;padding:3px 6px">Round Off</td><td style="text-align:right;padding:3px 6px">${T.ro ? n2(T.ro) : "0"}</td></tr></table>
<div style="display:flex;justify-content:space-between;border:${B};font-weight:700;margin:4px 0 0 70px"><span style="padding:2px 8px">Total (A)</span><span style="padding:2px 8px;font-size:14px">${n2(T.total)}</span></div></td></tr></table>
<table style="width:100%;border-collapse:collapse;border-top:${B}"><tr><td style="padding:12px 8px"><b>In Words:</b> <b style="margin-left:14px">${words(T.total)}</b></td><td style="width:215px;border-left:${B};text-align:center;padding:8px"><div style="font-size:11px;font-weight:700">Bill Total (A+B)</div><div style="font-size:21px;font-weight:700">${n2(T.total)}</div></td></tr></table>
<table style="width:100%;border-collapse:collapse;border-top:${B}"><tr style="vertical-align:top"><td style="font-size:10px;padding:8px">${esc(co.addr)}<br>Phone : ${esc(co.phone)}<br>E-mail : ${esc(co.email)}${co.pay ? "<br>" + esc(co.pay) : ""}${co.note ? "<br>" + esc(co.note) : ""}</td><td style="width:215px;text-align:center;padding:8px"><div style="font-weight:700;color:#444">For : ${esc(co.for)}</div><div style="font-weight:700;font-size:11px">${esc(co.tag)}'s</div>${co.sign ? `<img src="${co.sign}" style="height:62px;margin:4px 0">` : '<div style="height:62px"></div>'}<div style="font-weight:700;font-size:11px">Authorized Signatory</div></td></tr></table></div>`;
}

export function billText(c: Inv, co: Record<string, string>) {
  const { rows, T } = calcInv(c, co);
  const out: string[] = [c.type === "tax" ? "TAX - INVOICE" : "PRE - INVOICE (Proforma)", co.name, co.tax ? "GSTIN: " + co.tax : "", "Doc No: " + c.inv, "Date: " + fmtDmy(c.date), "", "To: " + c.name, c.addr, c.gstin ? "GSTIN: " + c.gstin : "", ""];
  rows.forEach((r, i) => {
    out.push(i + 1 + ". " + r.title + (r.sac ? " (SAC " + r.sac + ")" : ""));
    if (r.pf && r.pt) out.push("   From " + dmyShort(r.pf) + " to " + dmyShort(r.pt) + (r.note ? " " + r.note : ""));
    (r.lines || []).forEach((l: any) => out.push("   - " + l.d + " (" + l.q + "*" + l.r + ")"));
    out.push("   Taxable Amount: Rs. " + n2(r.amount));
  });
  out.push("", T.cg ? "CGST " + T.cgR + "%: " + n2(T.cg) : "", T.sg ? "SGST " + T.sgR + "%: " + n2(T.sg) : "", T.ig ? "IGST " + T.igR + "%: " + n2(T.ig) : "", T.ro ? "Round Off: " + n2(T.ro) : "", "Bill Total: Rs. " + n2(T.total), "(" + words(T.total) + ")", "", "Bank: " + co.bank + " | A/C " + co.acno + " | IFSC " + co.ifsc);
  return out.filter((x, i) => x !== "" || (out[i - 1] !== "" && i > 0)).join("\n");
}

/* ---------------- reminders queue ---------------- */
export function queueGroups(rows: Entry[], days: number) {
  const by: Record<string, Entry[]> = {};
  rows.forEach((r) => {
    if (!r.Next_Billing_Date) return;
    const d = dayDiff(r.Next_Billing_Date);
    if (d <= days && d >= -30) (by[r.Client_Code] = by[r.Client_Code] || []).push(r);
  });
  return Object.values(by)
    .map((es) => ({
      cid: es[0].Client_Code, name: es[0].Client_Name, es,
      mods: es.filter((e) => e.Kind !== "api"), apis: es.filter((e) => e.Kind === "api"),
      earliest: es.map((e) => e.Next_Billing_Date as string).sort()[0],
    }))
    .sort((a, b) => (a.earliest > b.earliest ? 1 : -1));
}
export type QGroup = ReturnType<typeof queueGroups>[number];

export const alertSent = (logs: LogRow[], g: QGroup, channel: string) =>
  logs.some((l) => l.Mode === "alert" && l.Result === "sent" && l.Client_Code === g.cid && l.Next_Billing_Date === g.earliest && l.Channel === channel);

export function pendingAlerts(rows: Entry[], s: Settings, logs: LogRow[]) {
  return queueGroups(rows, +s.auto.days).filter(
    (g) => g.mods.length && ((s.auto.e && !alertSent(logs, g, "email")) || (s.auto.w && !alertSent(logs, g, "whatsapp")))
  );
}

export const groupTotal = (g: QGroup, co: Record<string, string>) =>
  g.mods.length ? calcInv(invFromEntries(g.mods, co), co).T.total : 0;