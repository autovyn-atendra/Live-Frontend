"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import DataTable from "@/components/Templates/ServiceTable";
import HashloaderComponent from "@/components/Templates/hashloader";
import axios from "axios";
import Ainput from "@/components/atoms/Input";
import {
  Share2,
  RefreshCw,
  Search,
  Eye,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  Tag,
  FileText,
  CheckCircle2,
  Clock,
  RotateCcw,
  Download,
  Filter,
} from "lucide-react";
import { useCurrentUser } from "@/app/hooks/use-current-user";

// ============================================================
// CONSTANTS
// ============================================================
const BASE_URL = process.env.NEXT_PUBLIC_URL;

// ============================================================
// TYPES
// ============================================================
type MetaLead = {
  UTD: number;
  Meta_Lead_Id: string;
  Page_Id: string | null;
  Form_Id: string | null;
  Ad_Id: string | null;
  Ad_Group_Id: string | null;
  Full_Name: string | null;
  Phone_Number: string | null;
  Email: string | null;
  City: string | null;
  Company_Name: string | null;
  Meta_Created_At: string | null;
  Webhook_Created_At: string | null;
  All_Fields: Record<string, any> | string | null;
  Raw_Meta_Response: Record<string, any> | string | null;
  Raw_Webhook_Value: Record<string, any> | string | null;
  Source: string | null;
  status: number | null;
  Created_By: string | null;
  Created_At: string | null;
};

type PaginationState = {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

// ============================================================
// UTILS
// ============================================================
const showToast = (
  msg: string,
  type: "success" | "error" | "warning" | "info"
) =>
  Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 4000,
    timerProgressBar: true,
  }).fire({ icon: type, title: msg });

const formatDateForDisplay = (dateStr: string | null): string => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateStr;
  }
};

// ============================================================
// BADGE COMPONENTS
// ============================================================
const StatusBadge = ({ status }: { status: number | null }) => {
  const isProcessed = status === 1;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[18px] font-semibold border ${
        isProcessed
          ? "bg-[#DCFCE7] text-green-700 border-green-300 dark:bg-[#14532D]/30 dark:text-green-300 dark:border-green-700"
          : "bg-[#FEF3C7] text-amber-700 border-amber-300 dark:bg-[#78350F]/30 dark:text-amber-300 dark:border-amber-700"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          isProcessed ? "bg-green-500" : "bg-amber-500"
        }`}
      />
      {isProcessed ? "Processed" : "New / Received"}
    </span>
  );
};

const SourceBadge = ({ source }: { source: string | null }) => (
  <span className="inline-flex items-center gap-1 rounded bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] dark:bg-[#1E3A8A]/30 dark:text-[#93C5FD] dark:border-[#1E40AF] px-2.5 py-1 text-[18px] font-medium font-mono">
    <Tag size={14} />
    {source || "META_LEAD_ADS"}
  </span>
);

// ============================================================
// SHARED STYLES
// ============================================================
const selectCls =
  "h-10 w-full rounded border border-[#D1D5DB] dark:border-[#4B5563] " +
  "bg-white dark:bg-[#0d1117] px-3 text-[17px] text-[#1F2937] dark:text-white " +
  "focus:outline-none focus:ring-2 focus:ring-[#EFF6FF]0 transition-shadow " +
  "cursor-pointer disabled:opacity-60";

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1 min-w-0">
    <label className="text-[17px] font-semibold text-[#4B5563] dark:text-[#9CA3AF] truncate">
      {label}
    </label>
    {children}
  </div>
);

// ============================================================
// MAIN PAGE COMPONENT
// ============================================================
export default function MetaPage() {
  const user = useCurrentUser();

  // ── Table State ──────────────────────────────────────────
  const [rows, setRows] = useState<MetaLead[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ── Filter State ─────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterFormId, setFilterFormId] = useState("");

  // ── Pagination State ─────────────────────────────────────
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    pageSize: 20,
    totalPages: 1,
    totalRecords: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // ============================================================
  // FETCH META LEADS
  // ============================================================
  const fetchMetaLeads = useCallback(
    async (pageToFetch = 1) => {
      setIsLoading(true);
      try {
        const payload: Record<string, any> = {
          page: pageToFetch,
          limit: pagination.pageSize,
          sortBy: "UTD",
          sortOrder: "DESC",
        };

        if (searchQuery.trim()) payload.search = searchQuery.trim();
        if (fromDate) payload.fromDate = fromDate;
        if (toDate) payload.toDate = toDate;
        if (filterStatus !== "") payload.status = Number(filterStatus);
        if (filterFormId.trim()) payload.formId = filterFormId.trim();

        const res = await axios.post(`${BASE_URL}/meta/getMetaLeads`, payload, {
          headers: {
            accept: "application/json",
            compcode: user?.Comp_Code || process.env.NEXT_PUBLIC_COMP_CODE || "1",
            name: user?.name,
            "Content-Type": "application/json",
          },
        });

        if (res.data?.success) {
          setRows(Array.isArray(res.data.data) ? res.data.data : []);
          if (res.data.pagination) {
            setPagination({
              currentPage: res.data.pagination.currentPage || pageToFetch,
              pageSize: res.data.pagination.pageSize || pagination.pageSize,
              totalPages: res.data.pagination.totalPages || 1,
              totalRecords: res.data.pagination.totalRecords || 0,
              hasNextPage: !!res.data.pagination.hasNextPage,
              hasPrevPage: !!res.data.pagination.hasPrevPage,
            });
          }
        } else {
          setRows([]);
        }
      } catch (err: any) {
        showToast(
          err?.response?.data?.message ?? "Error fetching Meta leads",
          "error"
        );
        setRows([]);
      } finally {
        setIsLoading(false);
      }
    },
    [
      searchQuery,
      fromDate,
      toDate,
      filterStatus,
      filterFormId,
      pagination.pageSize,
      user?.Comp_Code,
      user?.name,
    ]
  );

  useEffect(() => {
    fetchMetaLeads(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApplyFilter = () => {
    fetchMetaLeads(1);
  };

  const handleResetFilter = () => {
    setSearchQuery("");
    setFromDate("");
    setToDate("");
    setFilterStatus("");
    setFilterFormId("");
    setTimeout(() => {
      fetchMetaLeads(1);
    }, 50);
  };

  // ============================================================
  // LEAD DETAILS MODAL (SWEETALERT2)
  // ============================================================
  const openLeadModal = (lead: MetaLead) => {
    let allFieldsObj: Record<string, any> = {};
    if (typeof lead.All_Fields === "object" && lead.All_Fields !== null) {
      allFieldsObj = lead.All_Fields;
    } else if (typeof lead.All_Fields === "string") {
      try {
        allFieldsObj = JSON.parse(lead.All_Fields);
      } catch {
        allFieldsObj = { raw: lead.All_Fields };
      }
    }

    const fieldRowsHtml = Object.entries(allFieldsObj)
      .map(
        ([key, val]) => `
        <tr style="border-bottom: 1px solid #E5E7EB;">
          <td style="padding: 8px 12px; font-weight: 600; color: #4B5563; text-transform: capitalize; text-align: left; font-size: 16px; width: 40%;">
            ${key.replace(/_/g, " ")}
          </td>
          <td style="padding: 8px 12px; color: #1F2937; text-align: left; font-size: 16px;">
            ${Array.isArray(val) ? val.join(", ") : String(val ?? "—")}
          </td>
        </tr>`
      )
      .join("");

    const modalHtml = `
      <div style="text-align: left; font-family: sans-serif; max-height: 70vh; overflow-y: auto; padding-right: 4px;">
        
        <!-- Customer Info Card -->
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px; margin-bottom: 14px;">
          <h4 style="margin: 0 0 10px 0; font-size: 17px; font-weight: 700; color: #1E293B; border-bottom: 1px solid #CBD5E1; padding-bottom: 6px;">
            👤 Customer Information
          </h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 16px;">
            <div><strong>Full Name:</strong> ${lead.Full_Name || "—"}</div>
            <div><strong>Phone:</strong> ${lead.Phone_Number || "—"}</div>
            <div><strong>Email:</strong> ${lead.Email || "—"}</div>
            <div><strong>City:</strong> ${lead.City || "—"}</div>
            <div style="grid-column: span 2;"><strong>Company:</strong> ${lead.Company_Name || "—"}</div>
          </div>
        </div>

        <!-- Meta Identifiers Card -->
        <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 8px; padding: 14px; margin-bottom: 14px;">
          <h4 style="margin: 0 0 10px 0; font-size: 17px; font-weight: 700; color: #1D4ED8; border-bottom: 1px solid #93C5FD; padding-bottom: 6px;">
            🏷️ Meta Ads Metadata
          </h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 15px; font-family: monospace;">
            <div><strong>Meta Lead ID:</strong> ${lead.Meta_Lead_Id || "—"}</div>
            <div><strong>Form ID:</strong> ${lead.Form_Id || "—"}</div>
            <div><strong>Page ID:</strong> ${lead.Page_Id || "—"}</div>
            <div><strong>Ad ID:</strong> ${lead.Ad_Id || "—"}</div>
            <div><strong>Ad Group ID:</strong> ${lead.Ad_Group_Id || "—"}</div>
            <div><strong>Source:</strong> ${lead.Source || "META_LEAD_ADS"}</div>
          </div>
        </div>

        <!-- Dynamic Form Submissions -->
        <div style="margin-bottom: 14px;">
          <h4 style="margin: 0 0 10px 0; font-size: 17px; font-weight: 700; color: #0F172A;">
            📝 Form Answers / Fields
          </h4>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #E5E7EB; border-radius: 6px; overflow: hidden;">
            <tbody>
              ${fieldRowsHtml || '<tr><td colspan="2" style="padding: 10px; text-align: center; color: #9CA3AF;">No field details available</td></tr>'}
            </tbody>
          </table>
        </div>

        <!-- Timestamps -->
        <div style="font-size: 14px; color: #64748B; background: #F1F5F9; padding: 10px; border-radius: 6px; display: flex; justify-content: space-between;">
          <span><strong>Meta Event Time:</strong> ${formatDateForDisplay(lead.Meta_Created_At)}</span>
          <span><strong>DB Saved At:</strong> ${formatDateForDisplay(lead.Created_At)}</span>
        </div>
      </div>
    `;

    Swal.fire({
      title: `<span style="font-size: 20px; font-weight: 700; color: #1E3A8A;">Meta Lead Details (UTD: ${lead.UTD})</span>`,
      html: modalHtml,
      width: "650px",
      confirmButtonText: "Close",
      confirmButtonColor: "#193A69",
      showCloseButton: true,
    });
  };

  // ============================================================
  // TABLE COLUMNS DEFINITION (Font Size: 18px)
  // ============================================================
  const columns = useMemo(
    () => [
    //   {
    //     Header: "# UTD",
    //     accessor: "UTD",
    //     cellAlign: "center" as const,
    //     Cell: ({ value }: any) => (
    //       <span className="font-mono text-[18px] font-bold text-[#193A69] dark:text-[#93C5FD]">
    //         #{value}
    //       </span>
    //     ),
    //   },
      {
        Header: "Customer Name",
        accessor: "Full_Name",
        Cell: ({ row }: any) => (
          <div className="min-w-[150px]">
            <div className="text-[18px] font-bold text-[#1F2937] dark:text-white flex items-center gap-1.5">
              <User size={16} className="text-[#2563EB] shrink-0" />
              {row.original.Full_Name || "—"}
            </div>
            {row.original.Company_Name && (
              <div className="text-[18px] text-[#6B7280] dark:text-[#9CA3AF] flex items-center gap-1 mt-0.5">
                <Building2 size={14} className="shrink-0" />
                {row.original.Company_Name}
              </div>
            )}
          </div>
        ),
      },
      {
        Header: "Contact Info",
        accessor: "Phone_Number",
        Cell: ({ row }: any) => (
          <div className="min-w-[140px] flex flex-col gap-0.5">
            <div className="text-[18px] font-semibold text-[#059669] dark:text-[#34D399] flex items-center gap-1">
              <Phone size={15} className="shrink-0" />
              {row.original.Phone_Number || "—"}
            </div>
            {row.original.Email && (
              <div className="text-[18px] text-[#4B5563] dark:text-[#9CA3AF] flex items-center gap-1 truncate max-w-[200px]">
                <Mail size={14} className="shrink-0" />
                {row.original.Email}
              </div>
            )}
          </div>
        ),
      },
      {
        Header: "City",
        accessor: "City",
        Cell: ({ value }: any) => (
          <div className="text-[18px] text-[#374151] dark:text-[#D1D5DB] flex items-center gap-1 whitespace-nowrap">
            {value ? (
              <>
                <MapPin size={15} className="text-red-500 shrink-0" />
                {value}
              </>
            ) : (
              "—"
            )}
          </div>
        ),
      },
      {
        Header: "Meta Lead ID",
        accessor: "Meta_Lead_Id",
        Cell: ({ value }: any) => (
          <span className="font-mono text-[18px] text-[#2563EB] dark:text-[#60A5FA] bg-[#EFF6FF] dark:bg-[#1E3A8A]/30 px-2 py-0.5 rounded border border-[#BFDBFE] dark:border-[#1E40AF]">
            {value || "—"}
          </span>
        ),
      },
      {
        Header: "Form ID",
        accessor: "Form_Id",
        Cell: ({ value }: any) => (
          <span className="font-mono text-[18px] text-[#4B5563] dark:text-[#9CA3AF]">
            {value || "—"}
          </span>
        ),
      },
      {
        Header: "Source",
        accessor: "Source",
        cellAlign: "center" as const,
        Cell: ({ value }: any) => <SourceBadge source={value} />,
      },
      {
        Header: "Status",
        accessor: "status",
        cellAlign: "center" as const,
        Cell: ({ value }: any) => <StatusBadge status={value} />,
      },
      {
        Header: "Received At",
        accessor: "Created_At",
        cellAlign: "center" as const,
        Cell: ({ value }: any) => (
          <div className="text-[18px] text-[#6B7280] dark:text-[#9CA3AF] whitespace-nowrap flex items-center justify-center gap-1">
            <Clock size={15} className="shrink-0" />
            {formatDateForDisplay(value)}
          </div>
        ),
      },
      {
        Header: "Action",
        accessor: "action",
        cellAlign: "center" as const,
        Cell: ({ row }: any) => (
          <div className="flex items-center justify-center gap-1.5">
            <button
              onClick={() => openLeadModal(row.original)}
              title="View Full Lead Details"
              className="p-1.5 rounded bg-[#EFF6FF] hover:bg-[#DBEAFE]
                dark:bg-[#1E3A8A]/30 dark:hover:bg-[#1E3A8A]/50
                text-[#2563EB] dark:text-[#60A5FA] transition-colors flex items-center gap-1.5 text-[18px] font-semibold px-3 py-1"
            >
              <Eye size={16} />
              View
            </button>
          </div>
        ),
      },
    ],
    []
  );

  // ============================================================
  // RENDER UI
  // ============================================================
  return (
    <div className="w-full max-w-full overflow-x-hidden p-3 sm:p-4 flex flex-col gap-4">
      {/* ══ HEADER ══ */}
      <div className="bg-header flex flex-wrap items-center justify-between gap-2 rounded-sm px-4 py-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <Share2 className="h-8 w-8 text-white shrink-0" />
          <div className="min-w-0">
            <h1 className="text-[24px] text-white font-bold leading-tight truncate">
              Meta Ads Leads Dashboard
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <span className="text-[17px] text-white/80 font-medium">
                {pagination.totalRecords} Total Leads Found
              </span>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchMetaLeads(pagination.currentPage)}
            disabled={isLoading}
            className="flex items-center gap-1 text-xl"
          >
            Refresh
          </Button>

          <Button
            variant="print"
            size="sm"
            onClick={handleResetFilter}
            disabled={isLoading}
            className="flex items-center gap-1 text-xl"
          >
            Reset Filters
          </Button>
        </div>
      </div>

      {/* ══ FILTER SECTION ══ */}
      <div className="border rounded-md p-3 sm:p-4 bg-white dark:bg-[#0d1117] shadow-sm">
        <div className="flex items-center gap-1.5 text-xl font-bold text-[#193A69] dark:text-white mb-3 uppercase tracking-wide border-b pb-2 dark:border-[#374151]">
          Filter Meta Leads
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-x-3 gap-y-3 items-end">
          {/* Search Query using Ainput */}
          <Ainput
            title="Search Query"
            type="text"
            name="searchQuery"
            value={searchQuery}
            handleInputChange={(_, value) => setSearchQuery(value)}
            onInput={() => {}}
            redlabel=""
            placeholder="Name, Phone, City, ID..."
            labelClass="text-[17px]"
            className="!h-10 !text-[17px]"
          />

          {/* From Date using Ainput */}
          <Ainput
            title="From Date"
            type="date"
            name="fromDate"
            value={fromDate}
            handleInputChange={(_, value) => setFromDate(value)}
            onInput={() => {}}
            redlabel=""
            labelClass="text-[17px]"
            className="!h-10 !text-[17px]"
          />

          {/* To Date using Ainput */}
          <Ainput
            title="To Date"
            type="date"
            name="toDate"
            value={toDate}
            handleInputChange={(_, value) => setToDate(value)}
            onInput={() => {}}
            redlabel=""
            labelClass="text-[17px]"
            className="!h-10 !text-[17px]"
          />

          {/* Status Filter */}
          <Field label="Status">
            <select
              className={selectCls}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="0">New / Received (0)</option>
              <option value="1">Processed (1)</option>
            </select>
          </Field>

          {/* Form ID using Ainput */}
          <Ainput
            title="Form ID"
            type="text"
            name="filterFormId"
            value={filterFormId}
            handleInputChange={(_, value) => setFilterFormId(value)}
            onInput={() => {}}
            redlabel=""
            placeholder="Filter by Form ID"
            labelClass="text-[17px]"
            className="!h-10 !text-[17px]"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex justify-end gap-2 mt-3 pt-2 border-dashed dark:border-[#374151]">
          <Button
            variant="print"
            size="sm"
            onClick={handleResetFilter}
            disabled={isLoading}
            className="text-base"
          >
            Clear
          </Button>

          <Button
            variant="save"
            size="sm"
            onClick={handleApplyFilter}
            disabled={isLoading}
            className="flex items-center gap-1 text-base"
          >
            <Search size={15} />
            Apply Filters
          </Button>
        </div>
      </div>

      {/* ══ DATA TABLE (Font Size: 18px) ══ */}
      <div className="border p-2 rounded-md bg-white dark:bg-[#0d1117] overflow-hidden shadow-sm">
        <div className="w-full overflow-x-auto">
          <DataTable
            title={isLoading ? "Loading Meta Leads..." : "Meta Leads List"}
            columns={columns}
            selectValue="UTD"
            data={rows}
            height={460}
            size="text-[18px]"
            filterPosition="FilterData"
            enableColumnFilters={true}
            numericFilterColumns={["UTD", "status"]}
            onRowDoubleClick={(r: MetaLead) => openLeadModal(r)}
          />
        </div>

        {/* Pagination Footer Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2 mt-1 border-t dark:border-[#374151] text-[17px] text-[#6B7280] dark:text-[#9CA3AF]">
          <div>
            Showing <b>{rows.length}</b> of <b>{pagination.totalRecords}</b> leads
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPrevPage || isLoading}
              onClick={() => fetchMetaLeads(pagination.currentPage - 1)}
              className="h-9 text-[17px]"
            >
              Previous
            </Button>

            <span className="font-semibold text-[#1F2937] dark:text-white px-2 text-[17px]">
              {pagination.currentPage} / {pagination.totalPages || 1}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNextPage || isLoading}
              onClick={() => fetchMetaLeads(pagination.currentPage + 1)}
              className="h-9 text-[17px]"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <HashloaderComponent isLoading={isLoading} />
    </div>
  );
}