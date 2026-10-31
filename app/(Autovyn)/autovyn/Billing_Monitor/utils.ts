import axios from "axios";
import Swal from "sweetalert2";

/* ---------------- constants ---------------- */
export const MOS: Record<string, number> = { monthly: 1, quarterly: 3, half: 6, yearly: 12 };
export const FQ: Record<string, string> = { monthly: "Monthly", quarterly: "Quarterly", half: "Half-yearly", yearly: "Yearly" };
export const CT: Record<string, string> = { user: "User", amc: "AMC" };
export const EMAIL_RE = /^\S+@\S+\.\S+$/;
export const FILE_URL = "https://erp.autovyn.com/backend/fetch?filePath=";
export const API_NAMES = [
  "Aadhaar Verification", "PAN Verification", "WhatsApp - Marketing Message",
  "WhatsApp - Utility Message", "Bank Account Verification", "IFSC Verification",
];

/* ---------------- tailwind class helpers ---------------- */
export const inputCls =
  "h-10 w-full rounded-lg border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-[#334155] dark:text-white px-3 text-sm focus:outline-none focus:border-[#3B82F6] disabled:opacity-70 disabled:bg-[#F1F5F9] dark:disabled:bg-[#0F172A]";
export const labelCls = "block text-xs font-medium text-[#64748B] dark:text-[#94A3B8] mb-1";
export const thCls = "text-left px-4 py-3 text-xs uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] font-semibold whitespace-nowrap";
export const tdCls = "px-4 py-3 whitespace-nowrap text-[#64748B] dark:text-[#CBD5E1]";
export const cardCls = "rounded-xl bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] shadow-sm p-4";
export const noteCls = "text-xs text-[#64748B] dark:text-[#94A3B8] mt-2 leading-relaxed";
export const statusClass = (s: string) =>
  s === "Paid"
    ? "bg-[#DCFCE7] text-[#15803D] dark:bg-[#14532D] dark:text-[#86EFAC]"
    : "bg-[#FEE2E2] text-[#B91C1C] dark:bg-[#7F1D1D] dark:text-[#FCA5A5]";

/* ---------------- toast ---------------- */
export function toast(message: string, type: "success" | "error" | "info" | "warning" = "success") {
  Swal.mixin({ toast: true, position: "top-end", showConfirmButton: false, timer: 2800, timerProgressBar: true }).fire({
    icon: type,
    title: message,
  });
}

/* ---------------- api ---------------- */
export type Api = (path: string, body?: any) => Promise<any>;
export const makeApi =
  (headers: any): Api =>
  async (path, body = {}) =>
    (await axios.post(`${process.env.NEXT_PUBLIC_URL}/Pms/${path}`, body, { headers })).data;

/* ---------------- numbers ---------------- */
export const r2 = (x: any) => Math.round((+x || 0) * 100) / 100;
export const money = (n: any) => "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
export const n2 = (x: any) =>
  Number(x || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function words(n: number) {
  n = Math.round(n);
  if (!n) return "Rupees Zero Only";
  const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const w = (x: number): string => (x < 20 ? a[x] : b[Math.floor(x / 10)] + (x % 10 ? " " + a[x % 10] : ""));
  const cr = Math.floor(n / 1e7), lk = Math.floor((n % 1e7) / 1e5), th = Math.floor((n % 1e5) / 1e3), rs = n % 1e3;
  const o: string[] = [];
  if (cr) o.push(w(cr) + " Crore");
  if (lk) o.push(w(lk) + " Lakh");
  if (th) o.push(w(th) + " Thousand");
  if (rs > 99) o.push(a[Math.floor(rs / 100)] + " Hundred" + (rs % 100 ? " and " + w(rs % 100) : ""));
  else if (rs) o.push((o.length ? "and " : "") + w(rs));
  return "Rupees " + o.join(" ") + " Only";
}

/* ---------------- dates ---------------- */
const MN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const pad = (n: number) => String(n).padStart(2, "0");
export const toYMD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayYMD = () => toYMD(new Date());
export const nowLocal = () => {
  const d = new Date();
  return `${toYMD(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
// yyyy-mm-dd -> dd-mm-yyyy
export const dmy = (s?: string | null) => {
  if (!s) return "—";
  const [y, m, d] = String(s).slice(0, 10).split("-");
  return `${d}-${m}-${y}`;
};
export const fmtDT = (s?: string | null) => {
  if (!s) return "—";
  const [hh, mm] = String(s).slice(11, 16).split(":");
  if (!hh) return dmy(s);
  const h = +hh;
  return `${dmy(s)}, ${h % 12 || 12}:${mm} ${h >= 12 ? "PM" : "AM"}`;
};
export const dmyLong = (d?: string) => {
  if (!d) return "";
  const [y, m, x] = d.split("-");
  return `${+x}-${MN[+m - 1]}-${y}`;
};
export const dmyShort = (d?: string) => {
  if (!d) return "";
  const [y, m, x] = d.split("-");
  return `${+x}/${m}/${y.slice(2)}`;
};
export function addMonths(d: string, n: number) {
  const x = new Date(d + "T00:00:00");
  const day = x.getDate();
  x.setMonth(x.getMonth() + n);
  if (x.getDate() !== day) x.setDate(0);
  return toYMD(x);
}
export function minus1(d: string) {
  const x = new Date(d + "T00:00:00");
  x.setDate(x.getDate() - 1);
  return toYMD(x);
}
export const dayDiff = (d: string) => (Date.parse(d) - Date.parse(todayYMD())) / 864e5;
export const fyOf = (d: string) => {
  const y = +d.slice(0, 4), m = +d.slice(5, 7), a = m >= 4 ? y : y - 1;
  return String(a).slice(2) + "-" + String(a + 1).slice(2);
};

/* ---------------- misc ---------------- */
export const esc = (s: any) =>
  String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" } as any)[c]);

export const STATES: Record<string, string> = {
  "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab", "04": "Chandigarh", "05": "Uttarakhand",
  "06": "Haryana", "07": "Delhi", "08": "Rajasthan", "09": "Uttar Pradesh", "10": "Bihar", "11": "Sikkim",
  "12": "Arunachal Pradesh", "13": "Nagaland", "14": "Manipur", "15": "Mizoram", "16": "Tripura", "17": "Meghalaya",
  "18": "Assam", "19": "West Bengal", "20": "Jharkhand", "21": "Odisha", "22": "Chhattisgarh", "23": "Madhya Pradesh",
  "24": "Gujarat", "26": "Dadra & Nagar Haveli and Daman & Diu", "27": "Maharashtra", "29": "Karnataka", "30": "Goa",
  "31": "Lakshadweep", "32": "Kerala", "33": "Tamil Nadu", "34": "Puducherry", "35": "Andaman & Nicobar",
  "36": "Telangana", "37": "Andhra Pradesh", "38": "Ladakh",
};
export const stateLine = (g: string) => {
  const c = String(g || "").slice(0, 2);
  return STATES[c] ? `State Name-${STATES[c]} & State Code-${c}` : "";
};

// Receipt / image upload (Manager Task Entry wala endpoint)
export async function uploadReceipt(file: File, user: any): Promise<string | null> {
  if (file.size > 5 * 1024 * 1024) {
    toast("The image must be smaller than 5 MB.", "info");
    return null;
  }
  const fd = new FormData();
  fd.append("name", user?.name || "");
  fd.append("Image", file);
  try {
    const result = await axios.post(`${process.env.NEXT_PUBLIC_URL}/Asset/uploadedImage`, fd, {
      headers: { compcode: user?.Comp_Code, name: user?.name, token: user?.email },
    });
    if (result.data) return result.data;
    toast("Upload failed", "error");
  } catch (e: any) {
    toast(e?.response?.data?.Message || "Upload failed", "error");
  }
  return null;
}

// auto-generated Doc. No. pattern (e.g. PRE/26-27/OE/227 ya 26-27/OE/227)
export const docNoPattern = /^(PRE\/)?\d\d-\d\d\//;