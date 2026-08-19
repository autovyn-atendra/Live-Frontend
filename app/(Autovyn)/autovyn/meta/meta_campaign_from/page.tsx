"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import DataTable from "@/components/Templates/servicetable";
import HashloaderComponent from "@/components/Templates/hashloader";
import Ainput from "@/components/atoms/Input";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import {
  Layers,
  Plus,
  Edit,
  RefreshCw,
  Power,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Tag,
  FileText,
} from "lucide-react";

// ============================================================
// CONSTANTS & TYPES
// ============================================================
const BASE_URL = process.env.NEXT_PUBLIC_URL;

type CampaignRecord = {
  UTD: number;
  Campaign_Id: string;
  Campaign_Name: string | null;
  Campaign_Type: string | null;
  Meta_Form_Id: string | null;
  Meta_Form_Name: string | null;
  Is_Active: number;
  Remark: string | null;
  Created_By: string | null;
  Created_At: string;
  Updated_By?: string | null;
  Updated_At?: string | null;
};

type FormDataState = {
  UTD: number | null;
  Campaign_Id: string;
  Campaign_Name: string;
  Campaign_Type: string;
  Meta_Form_Id: string;
  Meta_Form_Name: string;
  Is_Active: number;
  Remark: string;
};

const INITIAL_FORM: FormDataState = {
  UTD: null,
  Campaign_Id: "",
  Campaign_Name: "",
  Campaign_Type: "CALLMATIC",
  Meta_Form_Id: "",
  Meta_Form_Name: "",
  Is_Active: 1,
  Remark: "",
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
    const str = String(dateStr).trim();
    if (!str) return "—";

    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [year, month, day] = str.split("-").map(Number);
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }

    const match = str.match(/^(\d{4})[-/](\d{2})[-/](\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/);
    if (match) {
      const [, y, m, d, h, min] = match;
      const year = Number(y);
      const month = Number(m) - 1;
      const day = Number(d);
      const hour = Number(h);
      const minute = Number(min);

      const localDate = new Date(year, month, day, hour, minute);
      return localDate.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }

    const cleanStr = str.endsWith("Z") ? str.slice(0, -1) : str;
    const d = new Date(cleanStr);
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
// MAIN PAGE COMPONENT
// ============================================================
export default function MetaCampaignFormPage() {
  const user: any = useCurrentUser();

  // ── State ─────────────────────────────────────────────────
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormDataState>(INITIAL_FORM);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // ============================================================
  // FETCH CAMPAIGNS FROM BACKEND API
  // ============================================================
  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.post(
        `${BASE_URL}/meta/getCampaigns`,
        { search: searchQuery },
        {
          headers: {
            accept: "application/json",
            compcode: user?.Comp_Code || process.env.NEXT_PUBLIC_COMP_CODE || "1",
            name: user?.name,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.data?.success) {
        setCampaigns(Array.isArray(res.data.data) ? res.data.data : []);
      } else {
        setCampaigns([]);
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message ?? "Failed to fetch campaigns", "error");
      setCampaigns([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.Comp_Code, user?.name, searchQuery]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // ============================================================
  // FORM HANDLERS (CREATE & UPDATE)
  // ============================================================
  const handleInputChange = (field: keyof FormDataState, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleResetForm = () => {
    setFormData(INITIAL_FORM);
  };

  const handleSelectForEdit = (item: CampaignRecord) => {
    setFormData({
      UTD: item.UTD,
      Campaign_Id: item.Campaign_Id || "",
      Campaign_Name: item.Campaign_Name || "",
      Campaign_Type: item.Campaign_Type || "CALLMATIC",
      Meta_Form_Id: item.Meta_Form_Id || "",
      Meta_Form_Name: item.Meta_Form_Name || "",
      Is_Active: Number(item.Is_Active) ? 1 : 0,
      Remark: item.Remark || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.Campaign_Id.trim()) {
      showToast("Please enter a Campaign ID", "warning");
      return;
    }

    const isEditMode = formData.UTD !== null;
    const endpoint = isEditMode ? "/meta/updateCampaign" : "/meta/createCampaign";

    try {
      setIsSubmitting(true);
      const payload: Record<string, any> = {
        campaignId: formData.Campaign_Id.trim(),
        campaignName: formData.Campaign_Name.trim(),
        campaignType: formData.Campaign_Type.trim(),
        metaFormId: formData.Meta_Form_Id.trim(),
        metaFormName: formData.Meta_Form_Name.trim(),
        isActive: formData.Is_Active,
        remark: formData.Remark.trim(),
      };

      if (isEditMode) {
        payload.utd = formData.UTD;
      }

      const res = await axios.post(`${BASE_URL}${endpoint}`, payload, {
        headers: {
          accept: "application/json",
          compcode: user?.Comp_Code || process.env.NEXT_PUBLIC_COMP_CODE || "1",
          name: user?.name,
          "Content-Type": "application/json",
        },
      });

      if (res.data?.success) {
        showToast(
          isEditMode ? "Campaign updated successfully! 🎉" : "Campaign created successfully! 🎉",
          "success"
        );
        handleResetForm();
        fetchCampaigns();
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message ?? "Operation failed", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (utd: number) => {
    try {
      setIsLoading(true);
      const res = await axios.post(
        `${BASE_URL}/meta/toggleCampaignStatus`,
        { utd },
        {
          headers: {
            accept: "application/json",
            compcode: user?.Comp_Code || process.env.NEXT_PUBLIC_COMP_CODE || "1",
            name: user?.name,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.data?.success) {
        showToast("Campaign status updated!", "success");
        fetchCampaigns();
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message ?? "Failed to toggle status", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // DATATABLE COLUMN DEFINITIONS
  // ============================================================
  const columns = useMemo(
    () => [
      {
        Header: "#",
        accessor: "UTD",
        Cell: ({ value }: { value: number }) => (
          <span className="font-mono font-bold text-[#64748B] text-lg">#{value}</span>
        ),
      },
      {
        Header: "Campaign ID",
        accessor: "Campaign_Id",
        Cell: ({ value }: { value: string }) => (
          <span className="font-mono font-bold text-[#818CF8] dark:text-[#818CF8] text-lg">
            {value}
          </span>
        ),
      },
      {
        Header: "Campaign Name",
        accessor: "Campaign_Name",
        Cell: ({ value }: { value: string | null }) => (
          <span className="font-bold text-[#0F172A] dark:text-white text-lg">
            {value || "—"}
          </span>
        ),
      },
      {
        Header: "Type",
        accessor: "Campaign_Type",
        Cell: ({ value }: { value: string | null }) => (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-lg font-bold bg-[#EEF2FF] text-[#818CF8] border border-[#C7D2FE] font-mono uppercase tracking-wider">
            {value || "CALLMATIC"}
          </span>
        ),
      },
      {
        Header: "Meta Form ID",
        accessor: "Meta_Form_Id",
        Cell: ({ value }: { value: string | null }) => (
          <span className="font-mono font-bold text-[#64748B] text-lg">
            {value || "—"}
          </span>
        ),
      },
      {
        Header: "Meta Form Name",
        accessor: "Meta_Form_Name",
        Cell: ({ value }: { value: string | null }) => (
          <span className="font-medium text-[#334155] dark:text-[#CBD5E1] text-lg">
            {value || "—"}
          </span>
        ),
      },
      {
        Header: "Status",
        accessor: "Is_Active",
        Cell: ({ row }: any) => {
          const isActive = Boolean(row.original.Is_Active);
          return (
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-lg font-bold border ${
                isActive
                  ? "bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]"
                  : "bg-[#FFE4E6] text-[#E11D48] border-[#FDA4AF]"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isActive ? "bg-[#16A34A]" : "bg-[#E11D48]"}`} />
              {isActive ? "ACTIVE" : "INACTIVE"}
            </span>
          );
        },
      },
      {
        Header: "Remark",
        accessor: "Remark",
        Cell: ({ value }: { value: string | null }) => (
          <span className="text-lg text-[#64748B] dark:text-[#94A3B8] italic">
            {value || "—"}
          </span>
        ),
      },
      {
        Header: "Created By",
        accessor: "Created_By",
        Cell: ({ value, row }: any) => (
          <div className="text-lg">
            <div className="font-bold text-[#334155] dark:text-[#CBD5E1]">{value || "SYSTEM"}</div>
            <div className="text-xs text-[#94A3B8]">{formatDateForDisplay(row.original.Created_At)}</div>
          </div>
        ),
      },
      {
        Header: "Actions",
        accessor: "actions",
        disableSortBy: true,
        Cell: ({ row }: any) => {
          const item = row.original;
          const isActive = Boolean(item.Is_Active);
          return (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSelectForEdit(item)}
                className="bg-white dark:bg-[#1E293B] hover:bg-[#F8FAFC] text-[#4F46E5] dark:text-[#818CF8] border border-[#C7D2FE] dark:border-[#3730A3] px-3 py-1 rounded-xl text-lg font-bold shadow-2xs flex items-center gap-1 cursor-pointer"
              >
                 Edit
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => handleToggleStatus(item.UTD)}
                className={`px-3 py-1 rounded-xl text-lg font-bold shadow-2xs flex items-center gap-1 cursor-pointer border ${
                  isActive
                    ? "bg-[#FFE4E6] text-[#E11D48] border-[#FDA4AF] hover:bg-[#FECDD3]"
                    : "bg-[#DCFCE7] text-[#15803D] border-[#86EFAC] hover:bg-[#BBF7D0]"
                }`}
              >
               {isActive ? "Deactivate" : "Activate"}
              </Button>
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] dark:bg-[#090D16] p-4 sm:p-6 flex flex-col gap-6 font-sans text-[#334155] dark:text-[#F1F5F9]">
      
      {/* ══ PAGE HEADER ══ */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] dark:text-white tracking-tight flex items-center gap-2.5">
            <Layers className="text-[#818CF8]" size={28} />
            Meta Callmatic Campaigns
          </h1>
          <p className="text-lg font-medium text-[#64748B] dark:text-[#94A3B8] mt-0.5">
            Create, manage & configure Callmatic marketing campaign rules
          </p>
        </div>

        <Button
          onClick={fetchCampaigns}
          disabled={isLoading}
          size="lg"
          variant="outline"
          className="flex items-center gap-2 font-bold cursor-pointer"
        >
          {/* <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} /> */}
          Refresh Records
        </Button>
      </div>

      {/* ══ CAMPAIGN FORM CARD (CREATE / UPDATE) ══ */}
      <div className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-[#F1F5F9] dark:border-[#1E293B] pb-3">
          <h3 className="text-xl font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
            <Sparkles size={20} className="text-[#818CF8]" />
            {formData.UTD ? `Update Campaign (#${formData.UTD})` : "Create New Campaign"}
          </h3>
          {formData.UTD && (
            <Button
              size="lg"
              variant="outline"
              onClick={handleResetForm}
              className="text-sm font-bold text-[#E11D48] border-[#FDA4AF] hover:bg-[#FFE4E6] cursor-pointer"
            >
              {/* <RotateCcw size={14} className="mr-1" />  */}
              Cancel Edit
            </Button>
          )}
        </div>

        <form onSubmit={handleSubmitForm} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Campaign ID */}
            <Ainput
              type="text"
              name="Campaign_Id"
              title="Campaign ID "
              placeholder="e.g. CMP_META_2026_01"
              value={formData.Campaign_Id}
              handleInputChange={(_, value) => handleInputChange("Campaign_Id", value)}
              onInput={() => {}}
              redlabel="*"
              labelClass="text-lg font-bold"
              className="!h-10 !text-lg"
            />

            {/* Campaign Name */}
            <Ainput
              type="text"
              name="Campaign_Name"
              title="Campaign Name"
              placeholder="e.g. Festive Auto Offer 2026"
              value={formData.Campaign_Name}
              handleInputChange={(_, value) => handleInputChange("Campaign_Name", value)}
              onInput={() => {}}
              redlabel=""
              labelClass="text-lg font-bold"
              className="!h-10 !text-lg"
            />

            {/* Campaign Type */}
            <Ainput
              type="text"
              name="Campaign_Type"
              title="Campaign Type"
              placeholder="e.g. CALLMATIC, OUTBOUND, WHATSAPP"
              value={formData.Campaign_Type}
              handleInputChange={(_, value) => handleInputChange("Campaign_Type", value)}
              onInput={() => {}}
              redlabel=""
              labelClass="text-lg font-bold"
              className="!h-10 !text-lg"
            />

            {/* Meta Form ID */}
            <Ainput
              type="text"
              name="Meta_Form_Id"
              title="Meta Form ID"
              placeholder="e.g. FORM_1092837465"
              value={formData.Meta_Form_Id}
              handleInputChange={(_, value) => handleInputChange("Meta_Form_Id", value)}
              onInput={() => {}}
              redlabel="*"
              labelClass="text-lg font-bold"
              className="!h-10 !text-lg"
            />

            {/* Meta Form Name */}
            <Ainput
              type="text"
              name="Meta_Form_Name"
              title="Meta Form Name"
              placeholder="e.g. Festive Auto Lead Form 2026"
              value={formData.Meta_Form_Name}
              handleInputChange={(_, value) => handleInputChange("Meta_Form_Name", value)}
              onInput={() => {}}
              redlabel=""
              labelClass="text-lg font-bold"
              className="!h-10 !text-lg"
            />

            {/* Status Selector */}
            <div>
              <label className="block text-lg font-bold text-[#334155] dark:text-[#CBD5E1] mb-1">
                Active Status
              </label>
              <select
                value={formData.Is_Active}
                onChange={(e) => handleInputChange("Is_Active", Number(e.target.value))}
                className="w-full h-10 px-3 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl text-lg font-bold text-[#1E293B] dark:text-[#F1F5F9] focus:outline-none"
              >
                <option value={1}>ACTIVE (1)</option>
                <option value={0}>INACTIVE (0)</option>
              </select>
            </div>
          </div>

          {/* Remark Input */}
          <div>
            <Ainput
              type="text"
              name="Remark"
              title="Remark / Notes"
              placeholder="Enter optional description or campaign notes..."
              value={formData.Remark}
              handleInputChange={(_, value) => handleInputChange("Remark", value)}
              onInput={() => {}}
              redlabel=""
              labelClass="text-lg font-bold"
              className="!h-10 !text-lg"
            />
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleResetForm}
              className="text-lg font-bold rounded-xl border-[#E2E8F0] px-4 py-2 cursor-pointer"
            >
              Reset Form
            </Button>
            <Button
              type="submit"
              size="lg"
              variant="save"
              disabled={isSubmitting}
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-lg font-bold rounded-xl px-6 py-2 cursor-pointer"
            >
              {formData.UTD ? "Update Campaign ➔" : "Save Campaign ➔"}
            </Button>
          </div>
        </form>
      </div>

      {/* ══ CAMPAIGNS DATATABLE CARD ══ */}
      <div className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-xl font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
            <FileText size={20} className="text-[#818CF8]" />
            Campaigns Registry ({campaigns.length})
          </h3>

          <div className="w-full sm:w-72">
            <Ainput
              type="text"
              name="searchQuery"
              title=""
              placeholder="Search by ID, Name, Type..."
              value={searchQuery}
              handleInputChange={(_, value) => setSearchQuery(value)}
              onInput={() => {}}
              redlabel=""
              labelClass=""
              className="!h-10 !text-lg"
            />
          </div>
        </div>

        {/* DATATABLE COMPONENT */}
        <DataTable
          title=""
          columns={columns as any}
          selectValue="UTD"
          data={campaigns}
          height={480}
          size="text-lg"
          filterPosition="FilterData"
          enableColumnFilters={true}
        />
      </div>

      <HashloaderComponent isLoading={isLoading || isSubmitting} />
    </div>
  );
}