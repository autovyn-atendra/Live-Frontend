"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import DataTable from "@/components/Templates/servicetable";
import HashloaderComponent from "@/components/Templates/hashloader";
import axios from "axios";
import {
  X,
  RefreshCw,
  FileText,
  Car,
  User,
  CreditCard,
  Shield,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Calendar,
  Eye,
} from "lucide-react";

// ============================================================
// CONSTANTS
// ============================================================
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
const HEADERS = () => ({
  accept: "application/json",
  compcode: "autovyn",
  "Content-Type": "application/json",
});

const API = {
  getAll: `${BASE_URL}/excel/getAll`,
  getOne: `${BASE_URL}/excel/getOne`,
};

// ============================================================
// TYPES
// ============================================================
type ExpiryStatus = "EXPIRED" | "EXPIRING_TODAY" | "EXPIRING_SOON" | "ACTIVE";

type InsuranceRow = {
  UTD: number;
  TRAN_ID: number | null;
  EXPORT_TYPE: number;
  CUST_NAME: string | null;
  CUST_MOB_NO: string | null;
  VEHICAL_REG_NO: string | null;
  MODEL_NAME: string | null;
  POLICY_NAME: string | null;
  POLICY_NUMBER: string | null;
  POLICY_START_DATE: string | null;
  POLICY_END_DATE: string | null;
  INSU_TYPE: string | null;
  PREMIUM_AMOUNT: number | null;
  PAYMENT_MODE: string | null;
  PAYMENT_DATE: string | null;
  PAYMENT_AMOUNT: number | null;
  UTR: string | null;
  CHEQUE_NO: string | null;
  BANK_NAME: string | null;
  REMARKS: string | null;
  DOC_PATH: string | null;
  CREATED_AT: string | null;
  DAYS_TO_EXPIRY: number | null;
  EXPIRY_STATUS: ExpiryStatus | null;
  MST_UTD: number | null;
  MST_REG_NO: string | null;
};

type HistoryRow = {
  UTD: number;
  POLICY_NAME: string | null;
  POLICY_NUMBER: string | null;
  POLICY_START_DATE: string | null;
  POLICY_END_DATE: string | null;
  INSU_TYPE: string | null;
  PREMIUM_AMOUNT: number | null;
  PAYMENT_MODE: string | null;
  PAYMENT_AMOUNT: number | null;
  PAYMENT_DATE: string | null;
  DOC_PATH: string | null;
  EXPORT_TYPE: number;
  CREATED_AT: string | null;
  IS_ACTIVE: boolean;
};

type InsuranceDetail = InsuranceRow & {
  IS_ACTIVE: boolean;
  VALIDFROM: string | null;
  VALIDTO: string | null;
  master: {
    MST_UTD: number | null;
    MST_REG_NO: string | null;
    MST_CREATED_AT: string | null;
    MST_EXPORT_TYPE: number | null;
  };
  history: HistoryRow[];
  historyCount: number;
};

type Summary = {
  total: number;
  expired: number;
  expiring_today: number;
  expiring_soon: number;
  active: number;
  total_premium: number;
  total_payment: number;
};

// ============================================================
// UTILS
// ============================================================
const showToast = (msg: string, type: "success" | "error" | "warning" | "info") =>
  Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3500,
    timerProgressBar: true,
  }).fire({ icon: type, title: msg });

const trimOrUndef = (v: unknown) => {
  const s = v == null ? "" : String(v).trim();
  return s || undefined;
};

const fmtCurrency = (v: number | null | undefined) =>
  v != null ? `₹ ${v.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "—";

// ============================================================
// BADGE — Expiry Status
// ============================================================
const ExpiryBadge = ({
  status,
  days,
}: {
  status: ExpiryStatus | null;
  days: number | null;
}) => {
  const soonLabel = `Expiring in ${days ?? "?"}d`;
  const map: Record<
    Exclude<ExpiryStatus, never>,
    { label: string; cls: string; icon: React.ReactNode }
  > = {
    EXPIRED: {
      label: "Expired",
      cls: "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700",
      icon: <AlertTriangle size={10} />,
    },
    EXPIRING_TODAY: {
      label: "Expiring Today",
      cls: "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300",
      icon: <AlertCircle size={10} />,
    },
    EXPIRING_SOON: {
      label: soonLabel,
      cls: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300",
      icon: <Clock size={10} />,
    },
    ACTIVE: {
      label: "Active",
      cls: "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
      icon: <CheckCircle size={10} />,
    },
  };

  if (!status) return <span className="text-gray-400 text-xs">—</span>;
  const s = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5
        text-[10px] font-semibold border ${s.cls}`}
    >
      {s.icon}
      {s.label}
    </span>
  );
};

// ============================================================
// SUMMARY CARDS
// ============================================================
const SummaryCards = ({ summary }: { summary: Summary | null }) => {
  if (!summary) return null;

  const cards = [
    {
      label: "Total",
      value: summary.total,
      cls: "border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800",
      text: "text-blue-700 dark:text-blue-300",
    },
    {
      label: "Active",
      value: summary.active,
      cls: "border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800",
      text: "text-green-700 dark:text-green-300",
    },
    {
      label: "Expiring Soon",
      value: summary.expiring_soon,
      cls: "border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800",
      text: "text-amber-700 dark:text-amber-300",
    },
    {
      label: "Expiring Today",
      value: summary.expiring_today,
      cls: "border-orange-200 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-800",
      text: "text-orange-700 dark:text-orange-300",
    },
    {
      label: "Expired",
      value: summary.expired,
      cls: "border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800",
      text: "text-red-700 dark:text-red-300",
    },
    {
      label: "Total Premium",
      value: fmtCurrency(summary.total_premium),
      cls: "border-purple-200 bg-purple-50 dark:bg-purple-900/10 dark:border-purple-800",
      text: "text-purple-700 dark:text-purple-300",
      small: true,
    },
    {
      label: "Total Payment",
      value: fmtCurrency(summary.total_payment),
      cls: "border-teal-200 bg-teal-50 dark:bg-teal-900/10 dark:border-teal-800",
      text: "text-teal-700 dark:text-teal-300",
      small: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`rounded-lg border p-2.5 flex flex-col gap-0.5 ${c.cls}`}
        >
          <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {c.label}
          </span>
          <span
            className={`font-bold ${c.small ? "text-xs" : "text-lg leading-tight"} ${c.text}`}
          >
            {c.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// ============================================================
// PORTAL HELPER (fixes stacking/z-index issues)
// ============================================================
const ModalPortal = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  if (!mounted) return null;
  return createPortal(children, document.body);
};

// ============================================================
// DETAIL MODAL
// ============================================================
const DetailModal = ({
  UTD,
  onClose,
}: {
  UTD: number;
  onClose: () => void;
}) => {
  const [data, setData] = useState<InsuranceDetail | null>();
  const [loading, setLoading] = useState(true);
  const [showHist, setShowHist] = useState(false);
  console.log("data", data)
  // fetch detail
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await axios.post(API.getOne, { UTD }, { headers: HEADERS() });
        if (!cancelled && res.data?.success) {
          setData(res.data.data);
        } else {
          showToast(res.data?.Message || "Failed to load record", "error");
          onClose();
        }
      } catch (err: any) {
        showToast(err?.response?.data?.Message || "Error loading record", "error");
        onClose();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = false;
    };
  }, [UTD, onClose]);

  // close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const Section = ({
    icon,
    title,
    children,
    color = "blue",
  }: {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
    color?: string;
  }) => {
    const colors: Record<string, string> = {
      blue: "text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10",
      green:
        "text-green-600 dark:text-green-400 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10",
      purple:
        "text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/10",
      amber:
        "text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10",
      teal: "text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/10",
    };
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className={`flex items-center gap-2 px-3 py-2 border-b ${colors[color]}`}>
          {icon}
          <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
        </div>
        <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2.5 bg-white dark:bg-[#0d1117]">
          {children}
        </div>
      </div>
    );
  };

  const Item = ({
    label,
    value,
    full,
    link,
  }: {
    label: string;
    value: React.ReactNode;
    full?: boolean;
    link?: boolean;
  }) => (
    <div className={full ? "col-span-2 sm:col-span-3" : ""}>
      <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">
        {label}
      </p>
      {link && typeof value === "string" && value ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline
            flex items-center gap-1 truncate"
        >
          <ExternalLink size={11} />
          View Document
        </a>
      ) : (
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 break-words">
          {value ?? <span className="text-gray-400 font-normal">—</span>}
        </p>
      )}
    </div>
  );

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6
        bg-black/60 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="relative w-full max-w-3xl max-h-[92vh] flex flex-col
            rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700
            bg-white dark:bg-[#0d1117] overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 bg-[#193A69] dark:bg-[#0a1628] shrink-0">
            <div className="flex items-center gap-2.5">
              <Shield className="h-5 w-5 text-white/80" />
              <div>
                <h2 className="text-sm font-bold text-white leading-tight">Insurance Renewal Detail</h2>
                {data && (
                  <p className="text-[10px] text-white/60 mt-0.5">
                    UTD #{data.UTD}
                    {data.VEHICAL_REG_NO && <> · {data.VEHICAL_REG_NO}</>}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center
              bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading && (
              <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
                  <p className="text-sm text-gray-500">Loading details…</p>
                </div>
              </div>
            )}

            {!loading && data && (
              <>
                <div
                  className={`flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2 border
                    ${data.EXPIRY_STATUS === "EXPIRED"
                      ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800"
                      : data.EXPIRY_STATUS === "EXPIRING_TODAY"
                        ? "bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800"
                        : data.EXPIRY_STATUS === "EXPIRING_SOON"
                          ? "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800"
                          : "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800"
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <ExpiryBadge status={data.EXPIRY_STATUS} days={data.DAYS_TO_EXPIRY} />
                    {data.DAYS_TO_EXPIRY != null && (
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {data.DAYS_TO_EXPIRY >= 0
                          ? `${data.DAYS_TO_EXPIRY} days remaining`
                          : `${Math.abs(data.DAYS_TO_EXPIRY)} days overdue`}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${data.IS_ACTIVE ? "bg-green-500 text-white" : "bg-gray-400 text-white"
                      }`}
                  >
                    {data.IS_ACTIVE ? "ACTIVE" : "ARCHIVED"}
                  </span>
                </div>

                <Section icon={<User size={13} />} title="Customer & Vehicle" color="blue">
                  <Item label="Customer Name" value={data.CUST_NAME} />
                  <Item label="Mobile No" value={data.CUST_MOB_NO} />
                  <Item label="Reg No" value={data.VEHICAL_REG_NO} />
                  <Item label="Model" value={data.MODEL_NAME} />
                  <Item label="Created At" value={data.CREATED_AT} />
                  {/* <Item label="Record UTD" value={`#${data.UTD}`} /> */}
                </Section>

                <Section icon={<FileText size={13} />} title="Policy Details" color="purple">
                  <Item label="Policy Name" value={data.POLICY_NAME} />
                  <Item label="Policy Number" value={data.POLICY_NUMBER} />
                  <Item label="Insurance Type" value={data.INSU_TYPE} />
                  <Item label="Start Date" value={data.POLICY_START_DATE} />
                  <Item label="End Date" value={data.POLICY_END_DATE} />
                  <Item label="Premium" value={fmtCurrency(data.PREMIUM_AMOUNT)} />
                </Section>

                <Section icon={<CreditCard size={13} />} title="Payment Details" color="green">
                  <Item label="Payment Mode" value={data.PAYMENT_MODE} />
                  <Item label="Payment Date" value={data.PAYMENT_DATE} />
                  <Item label="Amount Paid" value={fmtCurrency(data.PAYMENT_AMOUNT)} />
                  <Item label="UTR / Ref No" value={data.UTR} />
                  <Item label="Cheque No" value={data.CHEQUE_NO} />
                  <Item label="Bank Name" value={data.BANK_NAME} />
                </Section>

                <Section icon={<FileText size={13} />} title="Document & Remarks" color="teal">
                  <Item label="Payment Proof" value={data.DOC_PATH} link full />
                  <Item label="Remarks" value={data.REMARKS} full />
                </Section>

                {data.master?.MST_UTD && (
                  <Section icon={<Car size={13} />} title="Vehicle Master" color="amber">
                    {/* <Item label="Master UTD" value={`#${data.master.MST_UTD}`} /> */}
                    <Item label="Master Reg No" value={data.master.MST_REG_NO} />
                    <Item label="Master Created" value={data.master.MST_CREATED_AT} />
                  </Section>
                )}

                {data.historyCount > 0 && (
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <button
                      onClick={() => setShowHist((p) => !p)}
                      className="w-full flex items-center justify-between px-3 py-2
                        bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200
                        dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800
                        transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Clock size={13} className="text-gray-500" />
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                          Renewal History
                        </span>
                        <span
                          className="text-[10px] font-bold bg-gray-200 dark:bg-gray-700
                          text-gray-600 dark:text-gray-400 rounded-full px-1.5 py-0.5"
                        >
                          {data.historyCount}
                        </span>
                      </div>
                      {showHist ? (
                        <ChevronUp size={14} className="text-gray-500" />
                      ) : (
                        <ChevronDown size={14} className="text-gray-500" />
                      )}
                    </button>

                    {showHist && (
                      <div className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-[#0d1117]">
                        {data.history.map((h) => (
                          <div
                            key={h.UTD}
                            className="px-3 py-2.5 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5"
                          >
                            <div>
                              <p className="text-[9px] text-gray-400 uppercase font-semibold">UTD</p>
                              <p className="text-xs font-mono text-gray-600 dark:text-gray-400">#{h.UTD}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-gray-400 uppercase font-semibold">Policy No</p>
                              <p className="text-xs text-gray-700 dark:text-gray-300 truncate">
                                {h.POLICY_NUMBER ?? "—"}
                              </p>
                            </div>
                            <div>
                              <p className="text-[9px] text-gray-400 uppercase font-semibold">Expiry</p>
                              <p className="text-xs text-gray-700 dark:text-gray-300">{h.POLICY_END_DATE ?? "—"}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-gray-400 uppercase font-semibold">Premium</p>
                              <p className="text-xs text-gray-700 dark:text-gray-300">{fmtCurrency(h.PREMIUM_AMOUNT)}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-gray-400 uppercase font-semibold">Payment Mode</p>
                              <p className="text-xs text-gray-700 dark:text-gray-300">{h.PAYMENT_MODE ?? "—"}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-gray-400 uppercase font-semibold">Amount Paid</p>
                              <p className="text-xs text-gray-700 dark:text-gray-300">
                                {fmtCurrency(h.PAYMENT_AMOUNT)}
                              </p>
                            </div>
                            <div>
                              <p className="text-[9px] text-gray-400 uppercase font-semibold">Insurance Type</p>
                              <p className="text-xs text-gray-700 dark:text-gray-300 truncate">{h.INSU_TYPE ?? "—"}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-gray-400 uppercase font-semibold">Status</p>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${h.IS_ACTIVE ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                                  }`}
                              >
                                {h.IS_ACTIVE ? "ACTIVE" : "ARCHIVED"}
                              </span>
                            </div>
                            {h.DOC_PATH && (
                              <div className="col-span-2 sm:col-span-4">
                                <a
                                  href={h.DOC_PATH}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                >
                                  <ExternalLink size={10} />
                                  View Document
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="shrink-0 px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/20 flex items-center justify-end gap-2">
            {/* <p className="text-[10px] text-gray-400">Double-click any row to view details</p> */}
            <Button variant="print" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

// ============================================================
// MAIN PAGE
// ============================================================
export default function InsuranceRenewalPage() {
  // Table state
  const [rows, setRows] = useState<InsuranceRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filter states
  const [search, setSearch] = useState("");
  const [aSearch, setASearch] = useState("");
  const [regNo, setRegNo] = useState("");
  const [aRegNo, setARegNo] = useState("");
  const [statusFilter, setStatusFilter] = useState<ExpiryStatus | "">("");
  const [aStatus, setAStatus] = useState<ExpiryStatus | "">("");
  const [exportType, setExportType] = useState("1");
  const [policyFrom, setPolicyFrom] = useState("");
  const [policyTo, setPolicyTo] = useState("");
  const [aPolicyFrom, setAPolicyFrom] = useState("");
  const [aPolicyTo, setAPolicyTo] = useState("");

  // Modal state
  const [selectedUTD, setSelectedUTD] = useState<number | null>(null);
  //   console.log("selectedUTD",selectedUTD)
  // Inputs CSS
  const inputCls =
    "h-9 w-full rounded border border-gray-300 dark:border-gray-600 " +
    "bg-white dark:bg-[#0d1117] px-3 text-sm text-gray-800 dark:text-white " +
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent " +
    "placeholder:text-gray-400 dark:placeholder:text-gray-600 transition-shadow";

  const selectCls =
    "h-9 w-full rounded border border-gray-300 dark:border-gray-600 " +
    "bg-white dark:bg-[#0d1117] px-3 text-sm text-gray-800 dark:text-white " +
    "focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow cursor-pointer";

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex flex-col gap-1 min-w-0">
      <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">{label}</label>
      {children}
    </div>
  );

  // Fetch payload
  const fetchPayload = useMemo(
    () => ({
      page,
      pageSize,
      search: trimOrUndef(aSearch) ?? "",
      regNo: trimOrUndef(aRegNo) ?? "",
      exportType,
      policyFrom: aPolicyFrom,
      policyTo: aPolicyTo,
    }),
    [page, pageSize, aSearch, aRegNo, exportType, aPolicyFrom, aPolicyTo]
  );

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await axios.post(API.getAll, fetchPayload, { headers: HEADERS() });
      const d = res.data;
      if (!d?.success) {
        showToast(d?.Message || "Failed to fetch data", "error");
        setRows([]);
        setSummary(null);
        setTotalPages(1);
        setTotalRecords(0);
        return;
      }
      setRows(Array.isArray(d.data) ? d.data : []);
      setSummary(d.summary ?? null);
      setTotalPages(d.pagination?.totalPages ?? 1);
      setTotalRecords(d.pagination?.totalRecords ?? 0);
    } catch (e: any) {
      showToast(e?.response?.data?.Message ?? "Error fetching data", "error");
      setRows([]);
      setSummary(null);
      setTotalPages(1);
      setTotalRecords(0);
    } finally {
      setIsLoading(false);
    }
  }, [fetchPayload]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter handlers
  const applyFilters = () => {
    setASearch(search);
    setARegNo(regNo);
    setAStatus(statusFilter);
    setAPolicyFrom(policyFrom);
    setAPolicyTo(policyTo);
    setPage(1);
  };

  const resetFilters = () => {
    setSearch("");
    setASearch("");
    setRegNo("");
    setARegNo("");
    setStatusFilter("");
    setAStatus("");
    setExportType("1");
    setPolicyFrom("");
    setAPolicyFrom("");
    setPolicyTo("");
    setAPolicyTo("");
    setPage(1);
  };

  // Row open normalizer (fixes onRowDoubleClick shape issues)
  const openDetail = useCallback((row: any) => {
    const utd =
      row?.UTD ??
      row?.original?.UTD ??
      row?.values?.UTD ??
      (typeof row === "number" ? row : null);

    if (typeof utd === "number" && !Number.isNaN(utd)) {
      setSelectedUTD(utd);
    } else {
      console.warn("Could not resolve UTD from row:", row);
      showToast("Could not open detail for this row", "error");
    }
  }, []);

  // Columns
  const columns = useMemo(
    () => [
      //   {
      //     Header: "#",
      //     accessor: "UTD",
      //     cellAlign: "center" as const,
      //     Cell: ({ value }: any) => (
      //       <span className="text-[11px] text-gray-400 font-mono">#{value}</span>
      //     ),
      //   },
      {
        Header: "Customer",
        accessor: "CUST_NAME",
        Cell: ({ row }: any) => (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
              {row.original.CUST_NAME ?? "—"}
            </p>
            <p className="text-[10px] text-gray-500 font-mono truncate">
              {row.original.CUST_MOB_NO ?? ""}
            </p>
          </div>
        ),
      },
      {
        Header: "Reg No",
        accessor: "VEHICAL_REG_NO",
        cellAlign: "center" as const,
        Cell: ({ value }: any) => (
          <span
            className="text-[11px] font-mono font-bold bg-gray-100
          dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded"
          >
            {value ?? "—"}
          </span>
        ),
      },
      {
        Header: "Model",
        accessor: "MODEL_NAME",
        Cell: ({ value }: any) => (
          <span className="text-xs text-gray-700 dark:text-gray-300">{value ?? "—"}</span>
        ),
      },
      {
        Header: "Policy",
        accessor: "POLICY_NAME",
        Cell: ({ row }: any) => (
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">
              {row.original.POLICY_NAME ?? "—"}
            </p>
            <p className="text-[10px] text-gray-500 font-mono truncate">
              {row.original.POLICY_NUMBER ?? ""}
            </p>
          </div>
        ),
      },
      {
        Header: "Start Date",
        accessor: "POLICY_START_DATE",
        cellAlign: "center" as const,
        Cell: ({ value }: any) => (
          <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
            {value ?? "—"}
          </span>
        ),
      },
      {
        Header: "End Date",
        accessor: "POLICY_END_DATE",
        cellAlign: "center" as const,
        Cell: ({ value }: any) => (
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">
            {value ?? "—"}
          </span>
        ),
      },
      {
        Header: "Status",
        accessor: "EXPIRY_STATUS",
        cellAlign: "center" as const,
        Cell: ({ row }: any) => (
          <ExpiryBadge status={row.original.EXPIRY_STATUS} days={row.original.DAYS_TO_EXPIRY} />
        ),
      },
      {
        Header: "Premium",
        accessor: "PREMIUM_AMOUNT",
        cellAlign: "right" as const,
        Cell: ({ value }: any) => (
          <span className="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-nowrap">
            {fmtCurrency(value)}
          </span>
        ),
      },
      {
        Header: "Payment",
        accessor: "PAYMENT_MODE",
        cellAlign: "center" as const,
        Cell: ({ row }: any) => (
          <div className="text-center">
            <p className="text-[10px] font-semibold text-gray-600 dark:text-gray-400">
              {row.original.PAYMENT_MODE ?? "—"}
            </p>
            <p className="text-[10px] font-mono text-gray-500">
              {fmtCurrency(row.original.PAYMENT_AMOUNT)}
            </p>
          </div>
        ),
      },
      {
        Header: "Insurance Co",
        accessor: "INSU_TYPE",
        cellAlign: "center" as const,
        Cell: ({ value }: any) => (
          <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
            {value ?? "—"}
          </span>
        ),
      },
      //   {
      //     Header: "Doc",
      //     accessor: "DOC_PATH",
      //     cellAlign: "center" as const,
      //     Cell: ({ value }: any) =>
      //       value ? (
      //         <a
      //           href={value}
      //           target="_blank"
      //           rel="noopener noreferrer"
      //           onClick={(e) => e.stopPropagation()}
      //           className="inline-flex items-center gap-1 text-[10px] text-blue-600
      //           dark:text-blue-400 hover:underline"
      //         >
      //           <ExternalLink size={11} />
      //           View
      //         </a>
      //       ) : (
      //         <span className="text-gray-400 text-xs">—</span>
      //       ),
      //   },
      {
        Header: "Created",
        accessor: "CREATED_AT",
        cellAlign: "center" as const,
        Cell: ({ value }: any) => (
          <span className="text-[10px] text-gray-500 whitespace-nowrap">{value ?? "—"}</span>
        ),
      },
      // Action column to force-open the modal even if double-click isn’t firing
      {
        Header: "Actions",
        id: "actions",
        cellAlign: "center" as const,
        Cell: ({ row }: any) => (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openDetail(row); // row has .original.UTD
            }}
            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border
              border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100
              dark:border-blue-800 dark:text-blue-300 dark:bg-blue-900/20"
          >
            <Eye size={12} />
            View
          </button>
        ),
      },
    ],
    [openDetail]
  );

  return (
    <div className="w-full max-w-full overflow-x-hidden p-3 sm:p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="bg-header flex flex-wrap items-center justify-between gap-2 rounded-sm px-4 py-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <Shield className="h-5 w-5 text-white shrink-0" />
          <div className="min-w-0">
            <h1 className="text-base font-bold text-white truncate">Insurance Renewal</h1>
            {totalRecords > 0 && (
              <p className="text-[10px] text-white/50 mt-0.5">
                {totalRecords.toLocaleString("en-IN")} records
              </p>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
          <RefreshCw size={13} className="mr-1" />
          Refresh
        </Button>
      </div>

      {/* Summary cards */}
      <SummaryCards summary={summary} />

      {/* Filters */}
      <div className="border rounded-md p-3 sm:p-4 bg-white dark:bg-[#0d1117]">
        <h2 className="text-xs font-bold text-[#193A69] dark:text-white mb-3 uppercase">
          Search & Filters
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3 items-end">
          <Field label="Search">
            <input
              type="text"
              className={inputCls}
              value={search}
              placeholder="Name, Reg No, Policy…"
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            />
          </Field>

          <Field label="Reg No">
            <input
              type="text"
              className={inputCls}
              value={regNo}
              placeholder="MH12AB1234"
              onChange={(e) => setRegNo(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            />
          </Field>

          <Field label="Export Type">
            <select className={selectCls} value={exportType} onChange={(e) => setExportType(e.target.value)}>
              <option value="1">Active (1)</option>
              <option value="33">Archived (33)</option>
            </select>
          </Field>

          <Field label="Expiry Status">
            <select
              className={selectCls}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ExpiryStatus | "")}
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="EXPIRING_SOON">Expiring Soon</option>
              <option value="EXPIRING_TODAY">Expiring Today</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </Field>

          <Field label="Policy Expiry From">
            <input type="date" className={inputCls} value={policyFrom} onChange={(e) => setPolicyFrom(e.target.value)} />
          </Field>

          <Field label="Policy Expiry To">
            <input type="date" className={inputCls} value={policyTo} onChange={(e) => setPolicyTo(e.target.value)} />
          </Field>

          <div className="flex gap-2 sm:col-span-2 items-end">
            <Button variant="outline" size="sm" onClick={applyFilters} disabled={isLoading} className="flex-1">
              🔍 Apply
            </Button>
            <Button variant="print" size="sm" onClick={resetFilters} disabled={isLoading} className="flex-1">
              ↺ Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="border p-2 rounded-md bg-white dark:bg-[#0d1117] overflow-hidden">
        <div className="w-full overflow-x-auto">
          <DataTable
            title={isLoading ? "Loading…" : "Insurance Renewals"}
            columns={columns}
            selectValue="UTD"
            data={rows}
            height={460}
            filterPosition="FilterData"
            enableColumnFilters={true}
            numericFilterColumns={["UTD", "PREMIUM_AMOUNT", "PAYMENT_AMOUNT", "DAYS_TO_EXPIRY"]}
            serverMode={true}
            serverPagination={{
              currentPage: page,
              pageSize,
              totalPages,
              totalRecords,
            }}
            onServerPageChange={(p: number) => setPage(p)}
            onServerPageSizeChange={(s: number) => {
              setPageSize(s);
              setPage(1);
            }}
            // Normalize the row shape coming from your DataTable
            onRowDoubleClick={(row: any) => openDetail(row)}
          />
        </div>

        <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-black/10">
          <p className="text-[10px] text-gray-400 flex items-center gap-1">
            <Calendar size={10} />
            Double-click any row or use the View button to open full details
          </p>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedUTD != null && <DetailModal UTD={selectedUTD} onClose={() => setSelectedUTD(null)} />}

      <HashloaderComponent isLoading={isLoading} />
    </div>
  );
}