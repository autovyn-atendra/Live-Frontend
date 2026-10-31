import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { EMAIL_RE, MOS, addMonths, pad } from "./utils";
import { Entry, Master } from "./Invoice";

/* ---------------- helpers ---------------- */
const text = (v: any) => {
  if (v === null || v === undefined) return "";
  if (typeof v === "object" && !(v instanceof Date)) {
    if ("text" in v) return String((v as any).text).trim();
    if ("result" in v) return String((v as any).result).trim();
  }
  return String(v).trim();
};

// Excel cell -> { ymd, hm }.  blank = khaali, bad = galat format
const parseDT = (v: any) => {
  const out = { blank: false, bad: false, ymd: "", hm: "00:00" };
  if (v === null || v === undefined || String(v).trim() === "") { out.blank = true; return out; }

  const fromDate = (d: Date) => {
    if (isNaN(d.getTime())) { out.bad = true; return; }
    out.ymd = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
    out.hm = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
  };
  if (v instanceof Date) { fromDate(v); return out; }
  if (typeof v === "number" && isFinite(v)) { fromDate(new Date(Math.round((v - 25569) * 864e5))); return out; }

  const s = text(v).replace(/\//g, "-");
  let y = 0, mo = 0, d = 0, hh = 0, mm = 0;
  const a = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})(?:[ T]+(\d{1,2}):(\d{2}))?/);   // dd-mm-yyyy [hh:mm]
  const b = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T]+(\d{1,2}):(\d{2}))?/);   // yyyy-mm-dd [hh:mm]
  if (a) { d = +a[1]; mo = +a[2]; y = +a[3]; hh = +(a[4] || 0); mm = +(a[5] || 0); }
  else if (b) { y = +b[1]; mo = +b[2]; d = +b[3]; hh = +(b[4] || 0); mm = +(b[5] || 0); }
  else { out.bad = true; return out; }

  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d || hh > 23 || mm > 59) { out.bad = true; return out; }
  out.ymd = `${y}-${pad(mo)}-${pad(d)}`;
  out.hm = `${pad(hh)}:${pad(mm)}`;
  return out;
};

/* ---------------- sample file ---------------- */
const COLS = [
  { h: "Client ID", w: 14, req: false },           // A
  { h: "Company Name", w: 30, req: true },         // B
  { h: "Contact Person Name", w: 26, req: true },  // C
  { h: "Mobile No.", w: 15, req: true },           // D
  { h: "Email (To)", w: 28, req: false },               // E
  { h: "Email (CC)", w: 28, req: false },            // F
  { h: "Billing Address", w: 32, req: false },     // G
  { h: "GSTIN", w: 18, req: false },               // H
  { h: "Company Type", w: 14, req: false },        // I
  { h: "Invoice Type", w: 14, req: false },        // J
  { h: "Module", w: 30, req: true },              // K
  { h: "Qty", w: 10, req: false },                 // L
  { h: "Rate", w: 12, req: false },                // M
  { h: "Joining Date", w: 15, req: true },           // N
  { h: "Last Billing Date", w: 17, req: false },   // O
  { h: "Next Billing Date", w: 15, req: false },        // P
  { h: "Status", w: 11, req: true },               // Q
  { h: "Amount Paid", w: 14, req: false },         // R
  { h: "Payment Date", w: 18, req: false },        // S
  { h: "Reference No.", w: 18, req: false },       // T
  { h: "Remark", w: 24, req: false },              // U
];

export async function downloadBillingSample(masters: Master[], rows: Entry[]) {
  const live = masters.filter((m) => m.Is_Live);
  let maxNo = 0;
  rows.forEach((r) => { const m = /^CL-(\d+)$/i.exec(r.Client_Code || ""); if (m) maxNo = Math.max(maxNo, +m[1]); });
  const nextId = `CL-${String(maxNo + 1).padStart(3, "0")}`;

  const wb = new ExcelJS.Workbook();
  const border: any = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
  const head = (ws: ExcelJS.Worksheet, n: number, color: (c: number) => string) => {
    for (let c = 1; c <= n; c++) {
      const cell = ws.getRow(1).getCell(c);
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: color(c) } };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = border;
    }
  };

  /* ---- Sheet 1: BillingEntries ---- */
  const ws = wb.addWorksheet("BillingEntries");
  ws.columns = COLS.map((c) => ({ header: c.h, width: c.w }));
  head(ws, COLS.length, (c) => (COLS[c - 1].req ? "FF3B82F6" : "FF94A3B8"));

  // Mobile, GSTIN aur date columns text format (Excel auto-convert na kare)
  ["D", "H", "N", "O", "P", "S"].forEach((L) => { for (let r = 2; r <= 500; r++) ws.getCell(`${L}${r}`).numFmt = "@"; });

  for (let r = 2; r <= 500; r++) {
    ws.getCell(`I${r}`).dataValidation = { type: "list", allowBlank: true, formulae: ['"User,AMC"'], showErrorMessage: true, errorTitle: "Company Type", error: "Select User or AMC." };
    ws.getCell(`J${r}`).dataValidation = { type: "list", allowBlank: true, formulae: ['"Pre,Tax"'], showErrorMessage: true, errorTitle: "Invoice Type", error: "Select Pre or Tax." };
    ws.getCell(`Q${r}`).dataValidation = { type: "list", allowBlank: false, formulae: ['"Paid,Due"'], showErrorMessage: true, errorTitle: "Status", error: "Status must be Paid or Due." };
    if (live.length)
      ws.getCell(`K${r}`).dataValidation = { type: "list", allowBlank: false, formulae: [`'Module List'!$A$2:$A$${live.length + 1}`], showErrorMessage: true, errorTitle: "Module", error: "Choose a Live Module from the Module List sheet." };
  }

  const note = (cell: string, t: string) => { ws.getCell(cell).note = t; };
  note("A1", "Optional. Leave blank: the next ID is assigned automatically (or the existing ID if Company Name + Mobile No. already exist).");
  note("K1", "Choose a Live Module from the Module List sheet.");
  note("L1", "Optional for modules (blank = Minimum units from the Master). Not used for APIs.");
  note("M1", "Optional (blank = Rate from the Master).");
  note("N1", "Date format: dd-mm-yyyy (e.g. 01-04-2026)");
  note("O1", "Optional. Blank = Start Date. Format dd-mm-yyyy");
  note("P1", "Optional. Blank = calculated from Last Billing / Start Date + frequency. Format dd-mm-yyyy");
  note("Q1", "Status must be Paid or Due.");
  note("R1", "Required when Status is Paid.");
  note("S1", "Required when Status is Paid. Format dd-mm-yyyy or dd-mm-yyyy hh:mm");
  ws.views = [{ state: "frozen", ySplit: 1 }];

  /* ---- Sheet 2: Existing Data ---- */
  const ex = wb.addWorksheet("Existing Data");
  ex.columns = [
    { header: "Client ID", width: 14 }, { header: "Company Name", width: 32 },
    { header: "Mobile No.", width: 16 }, { header: "Module", width: 32 }, { header: "Next Billing", width: 14 },
  ];
  rows.forEach((r) => ex.addRow([r.Client_Code, r.Client_Name, r.Mobile_No, r.Module_Name, r.Next_Billing_Date || ""]));
  head(ex, 5, () => "FF16A34A");
  ex.getColumn(7).width = 90;
  ex.getCell("G1").value = "Create a new Excel file in the BillingEntries sheet format and import that file. Do not import this sheet.";
  ex.getCell("G1").font = { bold: true, color: { argb: "FFB91C1C" } };
  ex.getCell("G1").alignment = { wrapText: true, vertical: "middle" };
  ex.getCell("G3").value = "Next Client ID (for a new company)";
  ex.getCell("G3").font = { bold: true };
  ex.getCell("G4").value = nextId;
  ex.getCell("G5").value = "Client ID is optional. Blank: the next ID is assigned (or the existing company is used if Company Name + Mobile No. already exist). For an existing company the saved company details are kept.";
  ex.getCell("G5").alignment = { wrapText: true, vertical: "top" };
  ex.getCell("G6").value = "A Module already added to a company cannot be imported again for the same company.";
  ex.getCell("G7").value = "Date format: dd-mm-yyyy (e.g. 01-04-2026). Status: Paid or Due only.";
  ex.getCell("G7").font = { bold: true };
  ex.views = [{ state: "frozen", ySplit: 1 }];

  /* ---- Sheet 3: Service List (sirf Live) ---- */
  const sl = wb.addWorksheet("Module List");
  sl.columns = [
    { header: "Module", width: 34 }, { header: "Type", width: 12 }, { header: "Unit", width: 14 },
    { header: "Min Qty", width: 10 }, { header: "Rate", width: 12 }, { header: "Frequency", width: 14 },
    { header: "GST %", width: 9 }, { header: "SAC / HSN", width: 12 },
  ];
  live.forEach((m) => sl.addRow([m.Name, m.Kind === "api" ? "API" : "Module", m.Unit_Label, m.Kind === "api" ? "" : m.Min_Qty, m.Rate, m.Frequency, m.GST_Percent, m.SAC_HSN || ""]));
  head(sl, 8, () => "FF4F46E5");
  sl.views = [{ state: "frozen", ySplit: 1 }];

  saveAs(new Blob([await wb.xlsx.writeBuffer()]), "Billing_Monitor_Sample.xlsx");
}

/* ---------------- import: file padho + validate ---------------- */
export interface ParseResult { payloadRows: any[]; failedRows: any[]; error?: string }

export async function parseBillingExcel(file: File, masters: Master[]): Promise<ParseResult> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await file.arrayBuffer());
  const ws = wb.getWorksheet("BillingEntries") || wb.worksheets[0];
  if (!ws) return { payloadRows: [], failedRows: [], error: "Excel file is empty." };

  const idx: Record<string, number> = {};
  ws.getRow(1).eachCell((cell, col) => { idx[text(cell.value).toLowerCase()] = col; });
  const val = (row: ExcelJS.Row, names: string[]) => {
    for (const n of names) if (idx[n]) return row.getCell(idx[n]).value;
    return "";
  };
  if (!idx["company name"] || !idx["Module"])
    return { payloadRows: [], failedRows: [], error: 'Columns "Company Name" and "Module" not found. Please use the sample file.' };

  const liveByName = new Map<string, Master>();
  masters.filter((m) => m.Is_Live).sort((a, b) => (a.Kind === "module" ? -1 : 1) - (b.Kind === "module" ? -1 : 1))
    .forEach((m) => { const k = m.Name.toLowerCase(); if (!liveByName.has(k)) liveByName.set(k, m); });
  const anyByName = new Map<string, Master>();
  masters.forEach((m) => anyByName.set(m.Name.toLowerCase(), m));

  const payloadRows: any[] = [];
  const failedRows: any[] = [];

  ws.eachRow((row, rowNo) => {
    if (rowNo === 1) return;

    const code = text(val(row, ["client id", "company id", "id"])).toUpperCase();
    const name = text(val(row, ["company name", "client name"]));
    const contact = text(val(row, ["contact person name", "contact person"]));
    const mobile = text(val(row, ["mobile no.", "mobile no", "mobile"])).replace(/\D/g, "");
    const email = text(val(row, ["email", "email id"]));
    const cc = text(val(row, ["cc email", "cc"]));
    const addr = text(val(row, ["billing address", "address"]));
    const gstin = text(val(row, ["gstin", "company gstin"])).toUpperCase();
    const ctypeRaw = text(val(row, ["company type", "type"])).toLowerCase();
    const itypeRaw = text(val(row, ["invoice type"])).toLowerCase();
    const serviceRaw = text(val(row, ["Module", "module"]));
    const qtyRaw = text(val(row, ["qty", "quantity", "units"]));
    const rateRaw = text(val(row, ["rate"]));
    const start = parseDT(val(row, ["start date"]));
    const last = parseDT(val(row, ["last billing date", "last billing"]));
    const next = parseDT(val(row, ["next billing", "next billing date"]));
    const statusRaw = text(val(row, ["status"]));
    const paidRaw = text(val(row, ["amount paid"]));
    const pay = parseDT(val(row, ["payment date", "payment date & time"]));
    const ref = text(val(row, ["reference no.", "reference no"]));
    const remark = text(val(row, ["remark", "remarks"]));

    // poori khaali row skip
    if (!code && !name && !contact && !mobile && !serviceRaw) return;

    const info = {
      Row_No: rowNo, Client_Code: code, Client_Name: name, Contact_Person: contact, Mobile_No: mobile,
      Module_Name: serviceRaw, Start_Date: start.ymd, Last_Billing_Date: last.ymd, Next_Billing_Date: next.ymd, Status: statusRaw,
    };
    const problems: string[] = [];

    if (!name) problems.push("Company Name is mandatory");
    if (!contact) problems.push("Contact Person Name is mandatory");
    if (!mobile) problems.push("Mobile No. is mandatory");
    else if (!/^\d{10}$/.test(mobile)) problems.push("Mobile No. must be 10 digits");
    if (email && !EMAIL_RE.test(email)) problems.push("Email is not valid");
    if (cc && !cc.split(",").every((x) => EMAIL_RE.test(x.trim()))) problems.push("CC Email is not valid");
    if (gstin && !/^[0-9A-Z]{15}$/.test(gstin)) problems.push("GSTIN must be 15 characters");

    let ctype = "user";
    if (ctypeRaw) { if (ctypeRaw === "user" || ctypeRaw === "amc") ctype = ctypeRaw; else problems.push("Company Type must be User or AMC"); }
    let itype = "pre";
    if (itypeRaw) {
      if (itypeRaw.startsWith("pre")) itype = "pre";
      else if (itypeRaw.startsWith("tax")) itype = "tax";
      else problems.push("Invoice Type must be Pre or Tax");
    }

    // ---- service (Masters se) ----
    let m: Master | undefined;
    if (!serviceRaw) problems.push("Module is mandatory");
    else {
      m = liveByName.get(serviceRaw.toLowerCase());
      if (!m) problems.push(anyByName.has(serviceRaw.toLowerCase()) ? `Module "${serviceRaw}" is Not Live in Masters` : `Module "${serviceRaw}" not found in Masters`);
    }

    let qty: number | null = null, rate: number | null = null;
    if (m) {
      if (m.Kind !== "api") {
        if (qtyRaw === "") qty = m.Min_Qty || 1;
        else if (isNaN(Number(qtyRaw)) || Number(qtyRaw) <= 0) problems.push("Qty must be a number greater than 0");
        else qty = Number(qtyRaw);
      }
      if (rateRaw === "") rate = m.Rate;
      else if (isNaN(Number(rateRaw)) || Number(rateRaw) < 0) problems.push("Rate must be a number");
      else rate = Number(rateRaw);
    }

    // ---- dates ----
    if (start.blank) problems.push("Start Date is mandatory");
    else if (start.bad) problems.push("Start Date is invalid (use dd-mm-yyyy)");
    if (last.bad) problems.push("Last Billing Date is invalid (use dd-mm-yyyy)");
    if (next.bad) problems.push("Next Billing is invalid (use dd-mm-yyyy)");

    // ---- status / payment ----
    let status = "";
    if (!statusRaw) problems.push("Status is mandatory");
    else {
      status = statusRaw.charAt(0).toUpperCase() + statusRaw.slice(1).toLowerCase();
      if (!["Paid", "Due"].includes(status)) problems.push("Status must be Paid or Due");
    }
    if (paidRaw && (isNaN(Number(paidRaw)) || Number(paidRaw) < 0)) problems.push("Amount Paid must be a number");
    if (pay.bad) problems.push("Payment Date is invalid (use dd-mm-yyyy)");
    if (status === "Paid") {
      if (!(Number(paidRaw) > 0)) problems.push("Amount Paid is mandatory when Status is Paid");
      if (pay.blank) problems.push("Payment Date is mandatory when Status is Paid");
    }

    if (problems.length || !m) {
      failedRows.push({ ...info, Imported: false, Reason: problems.join("; ") + "." });
      return;
    }

    // Last / Next default
    const lastYmd = last.blank ? start.ymd : last.ymd;
    const mo = MOS[m.Frequency] || 1;
    const nextYmd = next.blank ? addMonths(lastYmd, mo) : next.ymd;

    payloadRows.push({
      ...info,
      Module_Name: m.Name,
      Client_Code: code, Client_Name: name, Contact_Person: contact, Mobile_No: mobile,
      Email: email, CC_Email: cc, Billing_Address: addr, GSTIN: gstin, Company_Type: ctype, Invoice_Type: itype,
      BMM_ID: m.BMM_ID, Kind: m.Kind, Pricing_Model: m.Pricing_Model, Unit_Label: m.Unit_Label,
      Qty: qty, Rate: rate, Frequency: m.Frequency, GST_Percent: m.GST_Percent, SAC_HSN: m.SAC_HSN || "",
      Start_Date: start.ymd, Last_Billing_Date: lastYmd, Next_Billing_Date: nextYmd,
      Status: status,
      Amount_Paid: status === "Paid" ? Number(paidRaw) : null,
      Payment_Date: status === "Paid" ? `${pay.ymd} ${pay.hm}` : null,
      Reference_No: status === "Paid" ? ref : "",
      Remarks: remark,
    });
  });

  return { payloadRows, failedRows };
}