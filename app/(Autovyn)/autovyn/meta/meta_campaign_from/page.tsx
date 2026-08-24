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
  Video,
  Upload,
  ExternalLink,
  MessageSquare,
  FileCode,
} from "lucide-react";

// ============================================================
// CONSTANTS & TYPES
// ============================================================
const BASE_URL = process.env.NEXT_PUBLIC_URL;
const IMAGE_FETCH_URL = process.env.NEXT_PUBLIC_imagepath || process.env.NEXT_PUBLIC_IMAGEPATH || "https://erp.autovyn.com/backend/fetch?filePath=";

const getFetchUrl = (pathStr: string | null | undefined): string => {
  if (!pathStr) return "";
  if (pathStr.startsWith("http://") || pathStr.startsWith("https://")) return pathStr;
  const cleanPath = String(pathStr).replace(/\\/g, "/").replace(/^\/+/, "");
  return `${IMAGE_FETCH_URL}${encodeURIComponent(cleanPath)}`;
};

type CampaignRecord = {
  UTD: number;
  Campaign_Id: string;
  Campaign_Name: string | null;
  Campaign_Type: string | null;
  Meta_Form_Id: string | null;
  Meta_Form_Name: string | null;
  Sales_Executive_Number?: string | null;
  Transfer_Number?: string | null;
  Document_URL?: string | null;
  Document_Url?: string | null;
  Video_URL?: string | null;
  Video_Url?: string | null;
  Message_Text?: string | null;
  message_text?: string | null;
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
  Sales_Executive_Number: string;
  Document_URL: string;
  Video_URL: string;
  Message_Text: string;
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
  Sales_Executive_Number: "",
  Document_URL: "",
  Video_URL: "",
  Message_Text: "",
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

  const handleRefreshPage = () => {
    handleResetForm();
    setSearchQuery("");
    fetchCampaigns();
    showToast("Form and records refreshed! 🔄", "info");
  };

  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  const handleMediaFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "Document_URL" | "Video_URL") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileSizeMB = file.size / (1024 * 1024);

    // ── 1. WhatsApp Document Limit Check (Max 100 MB) ────────
    if (field === "Document_URL" && file.size > 100 * 1024 * 1024) {
      Swal.fire({
        icon: "warning",
        title: "<span style='font-size:20px;font-weight:800;color:#0F172A;'>PDF Size Limit Exceeded</span>",
        html: `
          <div style="font-family:inherit;text-align:left;margin-top:12px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">
              <div style="background:#FFF1F2;border:1px solid #FECDD3;border-radius:12px;padding:12px;text-align:center;">
                <span style="font-size:11px;font-weight:700;color:#E11D48;text-transform:uppercase;letter-spacing:0.5px;display:block;">Selected File</span>
                <span style="font-size:18px;font-weight:800;color:#9F1239;margin-top:2px;display:block;">${fileSizeMB.toFixed(2)} MB</span>
              </div>
              <div style="background:#ECFDF5;border:1px solid #A7F3D0;border-radius:12px;padding:12px;text-align:center;">
                <span style="font-size:11px;font-weight:700;color:#059669;text-transform:uppercase;letter-spacing:0.5px;display:block;">Max WhatsApp Limit</span>
                <span style="font-size:18px;font-weight:800;color:#065F46;margin-top:2px;display:block;">100 MB</span>
              </div>
            </div>
            <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:12px;padding:12px;display:flex;gap:10px;align-items:flex-start;">
              <span style="font-size:18px;line-height:1;">⚠️</span>
              <p style="font-size:13px;color:#92400E;margin:0;line-height:1.45;font-weight:500;">
                WhatsApp allows documents up to <b>100 MB</b>. Please select a smaller PDF to ensure seamless customer delivery.
              </p>
            </div>
          </div>
        `,
        showConfirmButton: true,
        confirmButtonText: "Choose Another File",
        confirmButtonColor: "#4F46E5",
        customClass: {
          popup: "rounded-2xl shadow-2xl border border-[#E2E8F0] p-6",
          confirmButton: "rounded-xl font-bold text-sm px-6 py-2.5 shadow-md cursor-pointer",
        },
      });
      e.target.value = "";
      return;
    }

    // ── 2. WhatsApp Video Limit Check (Max 16 MB) ───────────
    if (field === "Video_URL" && file.size > 16 * 1024 * 1024) {
      Swal.fire({
        icon: "warning",
        title: "<span style='font-size:20px;font-weight:800;color:#0F172A;'>Video Size Limit Exceeded</span>",
        html: `
          <div style="font-family:inherit;text-align:left;margin-top:12px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">
              <div style="background:#FFF1F2;border:1px solid #FECDD3;border-radius:12px;padding:12px;text-align:center;">
                <span style="font-size:11px;font-weight:700;color:#E11D48;text-transform:uppercase;letter-spacing:0.5px;display:block;">Selected Video</span>
                <span style="font-size:18px;font-weight:800;color:#9F1239;margin-top:2px;display:block;">${fileSizeMB.toFixed(2)} MB</span>
              </div>
              <div style="background:#FAF5FF;border:1px solid #E9D5FF;border-radius:12px;padding:12px;text-align:center;">
                <span style="font-size:11px;font-weight:700;color:#9333EA;text-transform:uppercase;letter-spacing:0.5px;display:block;">Max WhatsApp Limit</span>
                <span style="font-size:18px;font-weight:800;color:#6B21A8;margin-top:2px;display:block;">16.00 MB</span>
              </div>
            </div>
            <div style="background:#F3E8FF;border:1px solid #D8B4FE;border-radius:12px;padding:12px;display:flex;gap:10px;align-items:flex-start;">
              <span style="font-size:18px;line-height:1;">🎬</span>
              <p style="font-size:13px;color:#581C87;margin:0;line-height:1.45;font-weight:500;">
                Meta WhatsApp Cloud API <b>strictly rejects videos larger than 16 MB</b>. Please compress or select a video under <b>16 MB</b>.
              </p>
            </div>
          </div>
        `,
        showConfirmButton: true,
        confirmButtonText: "Select Smaller Video",
        confirmButtonColor: "#9333EA",
        customClass: {
          popup: "rounded-2xl shadow-2xl border border-[#E2E8F0] p-6",
          confirmButton: "rounded-xl font-bold text-sm px-6 py-2.5 shadow-md cursor-pointer",
        },
      });
      e.target.value = "";
      return;
    }

    const formDataUpload = new FormData();
    formDataUpload.append("file", file);
    formDataUpload.append("customPath", "meta_campaigns");
    formDataUpload.append("name", user?.name || "ADMIN");

    try {
      if (field === "Document_URL") setIsUploadingDoc(true);
      else setIsUploadingVideo(true);

      let uploadedPath = "";

      // 1. Direct upload to central server https://erp.autovyn.com/backend/upload-photo
      try {
        const uploadPhotoUrl = "https://erp.autovyn.com/backend/upload-photo";
        const uploadRes = await axios.post(uploadPhotoUrl, formDataUpload, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 30000,
        });

        if (uploadRes.data) {
          if (typeof uploadRes.data === "string") {
            uploadedPath = uploadRes.data;
          } else if (uploadRes.data.path || uploadRes.data.filePath) {
            uploadedPath = uploadRes.data.path || uploadRes.data.filePath;
          } else if (Array.isArray(uploadRes.data) && uploadRes.data[0]?.path) {
            uploadedPath = uploadRes.data[0].path;
          }
        }
      } catch (photoErr) {
        console.warn("Direct upload-photo fallback to local backend route:", photoErr);
      }

      // 2. Fallback: Backend API route /meta/uploadCampaignMedia
      if (!uploadedPath) {
        const res = await axios.post(`${BASE_URL}/meta/uploadCampaignMedia`, formDataUpload, {
          headers: {
            compcode: user?.Comp_Code || process.env.NEXT_PUBLIC_COMP_CODE || "1",
            name: user?.name,
            "Content-Type": "multipart/form-data",
          },
        });

        if (res.data?.success) {
          uploadedPath = res.data?.filePath || res.data?.path || res.data?.fileUrl;
        }
      }

      if (uploadedPath) {
        const cleanPath = String(uploadedPath).replace(/\\/g, "/").replace(/^\/+/, "");
        showToast(`${field === "Document_URL" ? "Document / PDF" : "Video"} uploaded successfully! 📁`, "success");
        handleInputChange(field, cleanPath);
      } else {
        showToast("Media upload failed", "error");
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message ?? "Failed to upload file", "error");
    } finally {
      if (field === "Document_URL") setIsUploadingDoc(false);
      else setIsUploadingVideo(false);
      e.target.value = "";
    }
  };

  const handleSelectForEdit = (item: CampaignRecord) => {
    setFormData({
      UTD: item.UTD,
      Campaign_Id: item.Campaign_Id || "",
      Campaign_Name: item.Campaign_Name || "",
      Campaign_Type: item.Campaign_Type || "CALLMATIC",
      Meta_Form_Id: item.Meta_Form_Id || "",
      Meta_Form_Name: item.Meta_Form_Name || "",
      Sales_Executive_Number: item.Sales_Executive_Number || item.Transfer_Number || "",
      Document_URL: item.Document_URL || item.Document_Url || "",
      Video_URL: item.Video_URL || item.Video_Url || "",
      Message_Text: item.Message_Text || item.message_text || "",
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
        salesExecutiveNumber: formData.Sales_Executive_Number.trim(),
        transferNumber: formData.Sales_Executive_Number.trim(),
        documentUrl: formData.Document_URL.trim(),
        videoUrl: formData.Video_URL.trim(),
        messageText: formData.Message_Text.trim(),
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
      // {
      //   Header: "#",
      //   accessor: "UTD",
      //   Cell: ({ value }: { value: number }) => (
      //     <span className="font-mono font-bold text-[#64748B] text-lg">#{value}</span>
      //   ),
      // },
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
        Header: "Sales Exec Number",
        accessor: "Sales_Executive_Number",
        Cell: ({ value, row }: any) => (
          <span className="font-mono font-bold text-[#2563EB] dark:text-[#60A5FA] text-lg">
            {value || row.original.Transfer_Number || "—"}
          </span>
        ),
      },
      {
        Header: "PDF Document",
        accessor: "Document_URL",
        Cell: ({ value, row }: any) => {
          const docPath = value || row.original.Document_Url || row.original.document_url || row.original.documentUrl;
          if (!docPath) return <span className="text-[#94A3B8] text-lg">—</span>;
          const fullUrl = getFetchUrl(docPath);
          return (
            <a
              href={fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] hover:bg-[#FEF3C7] dark:bg-[#451A03]/30 dark:text-[#FCD34D] dark:border-[#92400E] transition-colors shadow-xs"
            >
              <FileCode size={16} />
              View PDF
              <ExternalLink size={12} />
            </a>
          );
        },
      },
      {
        Header: "Campaign Video",
        accessor: "Video_URL",
        Cell: ({ value, row }: any) => {
          const vidPath = value || row.original.Video_Url || row.original.video_url || row.original.videoUrl;
          if (!vidPath) return <span className="text-[#94A3B8] text-lg">—</span>;
          const fullUrl = getFetchUrl(vidPath);
          return (
            <a
              href={fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold bg-[#FAF5FF] text-[#7E22CE] border border-[#E9D5FF] hover:bg-[#F3E8FF] dark:bg-[#3B0764]/30 dark:text-[#D8B4FE] dark:border-[#6B21A8] transition-colors shadow-xs"
            >
              <Video size={16} />
              Watch Video
              <ExternalLink size={12} />
            </a>
          );
        },
      },
      {
        Header: "Message Text",
        accessor: "Message_Text",
        Cell: ({ value, row }: any) => {
          const textVal = value || row.original.message_text || row.original.messageText;
          if (!textVal) return <span className="text-[#94A3B8] text-lg">—</span>;
          return (
            <div className="max-w-xs" title={textVal}>
              <span className="text-base text-[#1E293B] dark:text-[#E2E8F0] font-medium line-clamp-2 block bg-[#F8FAFC] dark:bg-[#1E293B]/60 p-2 rounded-lg border border-[#E2E8F0] dark:border-[#334155]/60">
                {textVal}
              </span>
            </div>
          );
        },
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
          onClick={handleRefreshPage}
          disabled={isLoading}
          size="lg"
          variant="outline"
          className="flex items-center gap-2 font-bold cursor-pointer"
        >
          {/* <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} /> */}
          Refresh Page
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

            {/* Sales Executive Number (Transfer Call) */}
            <Ainput
              type="text"
              name="Sales_Executive_Number"
              title="Sales Executive Number (Call Transfer)"
              placeholder="e.g. 9876543210"
              value={formData.Sales_Executive_Number}
              handleInputChange={(_, value) => handleInputChange("Sales_Executive_Number", value)}
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
                <option value={1}>ACTIVE </option>
                <option value={0}>INACTIVE </option>
              </select>
            </div>
          </div>

          {/* ══ MEDIA & MESSAGING SECTION ══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 border-t border-[#F1F5F9] dark:border-[#1E293B] pt-5">
            
            {/* System PDF / Document Uploader Card */}
            <div className="bg-[#F8FAFC] dark:bg-[#1E293B]/60 border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-lg font-bold text-[#334155] dark:text-[#CBD5E1] flex items-center gap-2">
                    <FileCode size={20} className="text-[#D97706]" />
                    PDF Document
                  </label>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#FEF3C7] dark:bg-[#78350F]/60 text-[#92400E] dark:text-[#FDE68A] border border-[#FCD34D] dark:border-[#B45309]">
                    Max: 100 MB
                  </span>
                </div>
                {formData.Document_URL && (
                  <button
                    type="button"
                    onClick={() => handleInputChange("Document_URL", "")}
                    className="text-xs font-bold text-[#EF4444] hover:text-[#B91C1C] underline cursor-pointer"
                  >
                    Remove File
                  </button>
                )}
              </div>

              {!formData.Document_URL ? (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#FCD34D] dark:border-[#B45309]/50 hover:border-[#F59E0B] rounded-xl p-5 bg-[#FFFBEB]/50 dark:bg-[#451A03]/20 cursor-pointer transition-colors group">
                  <Upload size={28} className="text-[#F59E0B] group-hover:scale-110 transition-transform mb-2" />
                  <span className="text-base font-bold text-[#1E293B] dark:text-[#F1F5F9]">
                    {isUploadingDoc ? "Uploading PDF to Cloud..." : "Click to Upload PDF from System"}
                  </span>
                  <span className="text-xs font-medium text-[#B45309] dark:text-[#FBBF24] mt-1">
                    Accepts PDF, DOC, DOCX · Max Limit 100 MB
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => handleMediaFileUpload(e, "Document_URL")}
                    disabled={isUploadingDoc}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-white dark:bg-[#0F172A] border border-[#FDE68A] dark:border-[#92400E] rounded-xl p-3 shadow-xs">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="p-2 bg-[#FEF3C7] dark:bg-[#451A03]/50 text-[#D97706] rounded-lg">
                        <FileCode size={22} />
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-bold text-[#0F172A] dark:text-white truncate">
                          {formData.Document_URL.split("/").pop()}
                        </p>
                        <p className="text-xs font-mono text-[#64748B] dark:text-[#94A3B8] truncate">
                          {formData.Document_URL}
                        </p>
                      </div>
                    </div>

                    <a
                      href={getFetchUrl(formData.Document_URL)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#F59E0B] hover:bg-[#D97706] text-white rounded-lg text-xs font-bold transition-colors whitespace-nowrap"
                    >
                      View PDF
                      <ExternalLink size={14} />
                    </a>
                  </div>

                  <label className="inline-flex items-center gap-1.5 text-xs font-bold text-[#B45309] dark:text-[#FBBF24] hover:underline cursor-pointer">
                    <Upload size={14} />
                    {isUploadingDoc ? "Uploading..." : "Replace PDF (Max 100 MB)"}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleMediaFileUpload(e, "Document_URL")}
                      disabled={isUploadingDoc}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* System Video Uploader Card */}
            <div className="bg-[#F8FAFC] dark:bg-[#1E293B]/60 border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-lg font-bold text-[#334155] dark:text-[#CBD5E1] flex items-center gap-2">
                    <Video size={20} className="text-[#9333EA]" />
                    Campaign Video
                  </label>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#F3E8FF] dark:bg-[#581C87]/60 text-[#6B21A8] dark:text-[#E9D5FF] border border-[#D8B4FE] dark:border-[#7E22CE]">
                    Max: 16 MB (WhatsApp Limit)
                  </span>
                </div>
                {formData.Video_URL && (
                  <button
                    type="button"
                    onClick={() => handleInputChange("Video_URL", "")}
                    className="text-xs font-bold text-[#EF4444] hover:text-[#B91C1C] underline cursor-pointer"
                  >
                    Remove Video
                  </button>
                )}
              </div>

              {!formData.Video_URL ? (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#D8B4FE] dark:border-[#7E22CE]/50 hover:border-[#A855F7] rounded-xl p-5 bg-[#FAF5FF]/50 dark:bg-[#3B0764]/20 cursor-pointer transition-colors group">
                  <Video size={28} className="text-[#9333EA] group-hover:scale-110 transition-transform mb-2" />
                  <span className="text-base font-bold text-[#1E293B] dark:text-[#F1F5F9]">
                    {isUploadingVideo ? "Uploading Video to Cloud..." : "Click to Upload Video from System"}
                  </span>
                  <span className="text-xs font-medium text-[#7E22CE] dark:text-[#C084FC] mt-1">
                    Accepts MP4, WEBM · Strictly Max 16 MB for WhatsApp
                  </span>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/*"
                    onChange={(e) => handleMediaFileUpload(e, "Video_URL")}
                    disabled={isUploadingVideo}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="space-y-2">
                  <div className="bg-white dark:bg-[#0F172A] border border-[#E9D5FF] dark:border-[#6B21A8] rounded-xl p-3 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="p-2 bg-[#F3E8FF] dark:bg-[#3B0764]/50 text-[#9333EA] rounded-lg">
                          <Video size={20} />
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-bold text-[#0F172A] dark:text-white truncate">
                            {formData.Video_URL.split("/").pop()}
                          </p>
                          <p className="text-xs font-mono text-[#64748B] dark:text-[#94A3B8] truncate">
                            {formData.Video_URL}
                          </p>
                        </div>
                      </div>

                      <a
                        href={getFetchUrl(formData.Video_URL)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#9333EA] hover:bg-[#7E22CE] text-white rounded-lg text-xs font-bold transition-colors whitespace-nowrap"
                      >
                        Open Video
                        <ExternalLink size={14} />
                      </a>
                    </div>

                    {/* Embedded Video Player Preview */}
                    <div className="rounded-xl overflow-hidden bg-black border border-[#F3E8FF] dark:border-[#581C87]/50">
                      <video
                        src={getFetchUrl(formData.Video_URL)}
                        controls
                        className="w-full max-h-44 object-contain"
                      />
                    </div>
                  </div>

                  <label className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7E22CE] dark:text-[#C084FC] hover:underline cursor-pointer">
                    <Upload size={14} />
                    {isUploadingVideo ? "Uploading..." : "Replace Video (Max 16 MB)"}
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/*"
                      onChange={(e) => handleMediaFileUpload(e, "Video_URL")}
                      disabled={isUploadingVideo}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* WhatsApp Message Text */}
          <div className="space-y-1.5">
            <label className="block text-lg font-bold text-[#334155] dark:text-[#CBD5E1] flex items-center gap-1.5">
              <MessageSquare size={18} className="text-[#10B981]" />
              WhatsApp Message Text (Template / Offer Body)
            </label>
            <textarea
              rows={3}
              placeholder="Enter WhatsApp message text template to be sent to customers..."
              value={formData.Message_Text}
              onChange={(e) => handleInputChange("Message_Text", e.target.value)}
              className="w-full p-3 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl text-lg font-medium text-[#1E293B] dark:text-[#F1F5F9] focus:outline-none"
            />
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