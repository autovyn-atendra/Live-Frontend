"use client";

import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import Ainput from "@/components/atoms/Input";
import DataTable from "@/components/Templates/servicetable";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import {
  Building2,
  Clock8,
  RefreshCw,
  X,
  Edit,
  Trash2
} from "lucide-react";
import CustomSelectSearch from "@/components/atoms/Select";

type ScheduleItem = {
  UTD?: number;
  Sch_Name?: string;
  Sch_Type?: string;
  Sch_Time?: string;
  Description?: string;
  Timing_Mode?: string;
  Rolling_Interval?: number | null;
  Export_Type?: number;
  Created_By?: string;
  Created_At?: string;
};

type DlrSchItem = {
  UTD: number;
  Dlr_Id: string;
  Sch_Type: string;
  Forw_Mnth: number | null;
  sch_leave_type?: string | null;
  Export_Type: number;
  Status_Label?: string;
};

export default function DealerSchedulePage() {
  const user = useCurrentUser();

  // Active Tab: "dlr_sch" (DLR_SCH Table & Create Form) OR "sch_config" (DLR_SCH_CONFIG Table & Modal)
  const [activeTab, setActiveTab] = useState<"dlr_sch" | "sch_config">("dlr_sch");

  // DLR_SCH (3-Input Form) states
  const [dlrCodeInput, setDlrCodeInput] = useState<string>("");
  const [dlrSchTypeInput, setDlrSchTypeInput] = useState<string>("");
  const [forwMnthInput, setForwMnthInput] = useState<string>("");
  const [editingDlrSchUtd, setEditingDlrSchUtd] = useState<number | null>(null);
  const [savingDlrSch, setSavingDlrSch] = useState(false);

  // DLR_SCH Table state
  const [dlrSchTableData, setDlrSchTableData] = useState<DlrSchItem[]>([]);
  const [loadingDlrSch, setLoadingDlrSch] = useState(false);

  // Available Schedule Types for Datalist
  const [scheduleTypeList, setScheduleTypeList] = useState<string[]>([]);

  // DLR_SCH_CONFIG Table & Modal states
  const [tableData, setTableData] = useState<ScheduleItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modal states (DLR_SCH_CONFIG)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUtd, setEditingUtd] = useState<number | null>(null);

  // Form Fields (DLR_SCH_CONFIG)
  const [schName, setSchName] = useState<string>("");
  const [schType, setSchType] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  // Timing Mode & Interval (DLR_SCH_CONFIG)
  const [scheduleMode, setScheduleMode] = useState<"fixed" | "rolling">("fixed");
  const [schTime, setSchTime] = useState<string>("");
  const [rollingInterval, setRollingInterval] = useState<string>("10");
  const [customInterval, setCustomInterval] = useState<string>("");

  // Helper: export_type = 33 is inactive, < 3 (or null or 0) is active
  const isActive = (exportType?: number | null) => {
    if (exportType === null || exportType === undefined) return true;
    const val = Number(exportType);
    if (val === 33) return false;
    return val < 3;
  };

  // Fetch all saved schedule configs from DLR_SCH_CONFIG (API)
  const fetchScheduleConfigs = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_URL}/dealer/getScheduleConfigs`,
        {
          headers: {
            compcode: user?.Comp_Code || "DBCON",
            name: user?.name || "schedualer"
          }
        }
      );
      if (response.data && response.data.success) {
        setTableData(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching schedule configs:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all dealer schedules from DLR_SCH (API)
  const fetchDlrSchList = async () => {
    setLoadingDlrSch(true);
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_URL}/dealer/getDlrSchList`,
        {
          headers: {
            compcode: user?.Comp_Code || "DBCON",
            name: user?.name || "schedualer"
          }
        }
      );
      if (response.data && response.data.success) {
        const mapped = (response.data.data || []).map((item: DlrSchItem) => ({
          ...item,
          Status_Label: item.Status_Label || (isActive(item.Export_Type) ? "Active" : "Inactive"),
        }));
        setDlrSchTableData(mapped);
      }
    } catch (error) {
      console.error("Error fetching DLR_SCH list:", error);
    } finally {
      setLoadingDlrSch(false);
    }
  };

  // Fetch distinct schedule types for autocomplete/datalist
  const fetchScheduleTypes = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_URL}/dealer/getScheduleTypes`,
        {
          headers: {
            compcode: user?.Comp_Code || "DBCON",
            name: user?.name || "schedualer"
          }
        }
      );
      if (response.data && response.data.success) {
        setScheduleTypeList(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching schedule types:", error);
    }
  };

  useEffect(() => {
    fetchDlrSchList();
    fetchScheduleConfigs();
    fetchScheduleTypes();
  }, [user?.Comp_Code]);

  // Open modal for Create
  const handleOpenModal = () => {
    setEditingUtd(null);
    setSchName("");
    setSchType("");
    setSchTime("");
    setDescription("");
    setScheduleMode("fixed");
    setRollingInterval("10");
    setCustomInterval("");
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleEdit = (item: ScheduleItem) => {
    setEditingUtd(item.UTD ?? null);
    setSchName(item.Sch_Name || "");
    setSchType(item.Sch_Type || "");
    setDescription(item.Description || "");
    const mode = item.Timing_Mode === "rolling" ? "rolling" : "fixed";
    setScheduleMode(mode);

    if (mode === "fixed") {
      setSchTime(item.Sch_Time ? item.Sch_Time.slice(0, 5) : "");
      setRollingInterval("10");
      setCustomInterval("");
    } else {
      setSchTime("");
      const intervalStr = String(item.Rolling_Interval || "10");
      const standardIntervals = ["5", "10", "15", "30", "45", "60", "120", "180", "240", "300"];
      if (standardIntervals.includes(intervalStr)) {
        setRollingInterval(intervalStr);
        setCustomInterval("");
      } else {
        setRollingInterval("OTHER");
        setCustomInterval(intervalStr);
      }
    }

    setIsModalOpen(true);
  };

  // Delete Schedule Configuration handler (Soft delete: Export_Type = 33)
  const handleDeleteScheduleConfig = async (item: ScheduleItem) => {
    const result = await Swal.fire({
      title: "Delete Schedule?",
      text: `Are you sure you want to delete "${item.Sch_Name || item.Sch_Type}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Delete!"
    });

    if (!result.isConfirmed) return;

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/dealer/deleteScheduleConfig`,
        {
          UTD: item.UTD
        },
        {
          headers: {
            compcode: user?.Comp_Code || "DBCON",
            name: user?.name || "schedualer"
          }
        }
      );

      if (response.data && response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: response.data.message || "Schedule configuration deleted successfully.",
          timer: 1500,
          showConfirmButton: false
        });
        fetchScheduleConfigs();
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: response.data?.message || "Failed to delete schedule configuration."
        });
      }
    } catch (error: any) {
      console.error("Error deleting schedule config:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error?.response?.data?.message || error?.message || "Internal server error"
      });
    }
  };

  // Close & reset form
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUtd(null);
    setSchName("");
    setSchType("");
    setSchTime("");
    setDescription("");
    setScheduleMode("fixed");
    setRollingInterval("10");
    setCustomInterval("");
  };

  // Save / Update handler (Calls backend API /dealer/saveScheduleConfig)
  const handleSave = async () => {
    const finalSchName = schName.trim();
    const finalSchType = schType.trim();

    if (!finalSchName) {
      Swal.fire({
        icon: "warning",
        title: "Missing Field",
        text: "Please enter Schedular Name."
      });
      return;
    }

    if (!finalSchType) {
      Swal.fire({
        icon: "warning",
        title: "Missing Field",
        text: "Please enter Schedular Type."
      });
      return;
    }

    // Check duplicate in active configs (ISNULL(Export_Type, 0) < 3)
    const duplicateItem = tableData.find((item) => {
      if (editingUtd && item.UTD === editingUtd) return false;
      const notDeleted =
        item.Export_Type === null ||
        item.Export_Type === undefined ||
        Number(item.Export_Type) < 3;
      if (!notDeleted) return false;

      const sameName =
        (item.Sch_Name || "").trim().toLowerCase() === finalSchName.toLowerCase();
      const sameType =
        (item.Sch_Type || "").trim().toLowerCase() === finalSchType.toLowerCase();

      return sameName || sameType;
    });

    if (duplicateItem) {
      const sameName =
        (duplicateItem.Sch_Name || "").trim().toLowerCase() === finalSchName.toLowerCase();
      const sameType =
        (duplicateItem.Sch_Type || "").trim().toLowerCase() === finalSchType.toLowerCase();

      let errorMsg = "A schedule configuration already exists.";
      if (sameName && sameType) {
        errorMsg = `A schedule with Name "${finalSchName}" and Type "${finalSchType}" already exists.`;
      } else if (sameType) {
        errorMsg = `A schedule with Schedular Type "${finalSchType}" already exists.`;
      } else if (sameName) {
        errorMsg = `A schedule with Schedular Name "${finalSchName}" already exists.`;
      }

      Swal.fire({
        icon: "warning",
        title: "Duplicate Schedule",
        text: errorMsg
      });
      return;
    }

    let finalTime = "00:00:00";
    let intervalVal: number | null = null;

    if (scheduleMode === "fixed") {
      if (!schTime) {
        Swal.fire({
          icon: "warning",
          title: "Missing Field",
          text: "Please enter Schedule Time (Sch_Time)."
        });
        return;
      }
      finalTime = schTime;
    } else {
      const finalInterval =
        rollingInterval === "OTHER" ? customInterval.trim() : rollingInterval;
      if (!finalInterval || Number(finalInterval) <= 0) {
        Swal.fire({
          icon: "warning",
          title: "Missing Field",
          text: "Please select or enter a valid Rolling Interval in minutes."
        });
        return;
      }
      intervalVal = parseInt(finalInterval, 10);
      finalTime = "00:00:00";
    }

    setSaving(true);
    try {
      const payload: any = {
        Sch_Name: schName.trim() || null,
        Sch_Type: finalSchType,
        Sch_Time: finalTime,
        Description: description.trim() || null,
        Timing_Mode: scheduleMode,
        Rolling_Interval: intervalVal,
        Export_Type: editingUtd ? 2 : 1,
        Created_By: user?.name || "Admin"
      };

      if (editingUtd) {
        payload.UTD = editingUtd;
      }

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/dealer/saveScheduleConfig`,
        payload,
        {
          headers: {
            compcode: user?.Comp_Code || "DBCON",
            name: user?.name || "schedualer"
          }
        }
      );

      if (response.data && response.data.success) {
        Swal.fire({
          icon: "success",
          title: editingUtd ? "Schedule Updated!" : "Schedule Saved!",
          text: response.data.message || "Schedule configuration saved successfully.",
          timer: 2000,
          showConfirmButton: false
        });
        handleCloseModal();
        fetchScheduleConfigs();
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed to Save",
          text: response.data?.message || "Something went wrong while saving."
        });
      }
    } catch (error: any) {
      console.error("Error saving schedule config:", error);
      Swal.fire({
        icon: "error",
        title: "Save Failed",
        text: error?.response?.data?.message || error?.message || "Internal server error"
      });
    } finally {
      setSaving(false);
    }
  };

  // Save / Update handler for DLR_SCH (Top Card: Dealer Code, Schedular Type, Forward Month)
  const handleSaveDlrSch = async () => {
    const rawDlr = dlrCodeInput.trim();
    const sType = dlrSchTypeInput.trim();

    if (!rawDlr) {
      Swal.fire({
        icon: "warning",
        title: "Missing Field",
        text: "Please enter Dealer Code (comma separated for multiple)."
      });
      return;
    }

    if (!sType) {
      Swal.fire({
        icon: "warning",
        title: "Missing Field",
        text: "Please select or enter Schedular Type."
      });
      return;
    }

    const trimmedForw = forwMnthInput.trim();
    let parsedForw: number | null = null;
    if (trimmedForw) {
      parsedForw = parseInt(trimmedForw, 10);
      if (isNaN(parsedForw) || parsedForw < 0) {
        Swal.fire({
          icon: "warning",
          title: "Invalid Field",
          text: "Forward Month must be a valid non-negative number."
        });
        return;
      }
    }

    setSavingDlrSch(true);
    try {
      const payload: any = {
        Dlr_Id: rawDlr,
        Sch_Type: sType,
        Forw_Mnth: parsedForw
      };

      if (editingDlrSchUtd) {
        payload.UTD = editingDlrSchUtd;
      }

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/dealer/saveDlrSch`,
        payload,
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name
          }
        }
      );

      if (response.data && response.data.success) {
        Swal.fire({
          icon: "success",
          title: editingDlrSchUtd ? "Dealer Schedule Updated!" : "Dealer Schedule Saved!",
          text: response.data.message || "Saved successfully.",
          timer: 2000,
          showConfirmButton: false
        });
        setDlrCodeInput("");
        setDlrSchTypeInput("");
        setForwMnthInput("");
        setEditingDlrSchUtd(null);
        fetchDlrSchList();
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed to Save",
          text: response.data?.message || "Something went wrong while saving."
        });
      }
    } catch (error: any) {
      console.error("Error saving DLR_SCH:", error);
      Swal.fire({
        icon: "error",
        title: "Save Failed",
        text: error?.response?.data?.message || error?.message || "Internal server error"
      });
    } finally {
      setSavingDlrSch(false);
    }
  };

  // Toggle Active / Inactive for DLR_SCH
  const handleToggleDlrSchStatus = async (item: DlrSchItem) => {
    const currentlyActive = isActive(item.Export_Type);
    const actionLabel = currentlyActive ? "Deactivate" : "Activate";

    const result = await Swal.fire({
      title: `${actionLabel} Dealer Schedule?`,
      text: `Do you want to mark Dealer (${item.Sch_Type}) as ${currentlyActive ? "Inactive" : "Active"}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: currentlyActive ? "#ef4444" : "#4A6CF7",
      cancelButtonColor: "#6b7280",
      confirmButtonText: `Yes, ${actionLabel}!`
    });

    if (!result.isConfirmed) return;

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/dealer/toggleDlrSchStatus`,
        {
          UTD: item.UTD,
          Export_Type: item.Export_Type
        },
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name
          }
        }
      );

      if (response.data && response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Status Updated!",
          text: response.data.message,
          timer: 1500,
          showConfirmButton: false
        });
        fetchDlrSchList();
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: response.data?.message || "Failed to update status."
        });
      }
    } catch (error: any) {
      console.error("Error toggling DLR_SCH status:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error?.response?.data?.message || error?.message || "Internal server error"
      });
    }
  };

  // Edit DLR_SCH row (prefill top 3-input form)
  const handleEditDlrSch = (item: DlrSchItem) => {
    setEditingDlrSchUtd(item.UTD);
    setDlrCodeInput(item.Dlr_Id || "");
    setDlrSchTypeInput(item.Sch_Type || "");
    setForwMnthInput(item.Forw_Mnth !== null && item.Forw_Mnth !== undefined ? String(item.Forw_Mnth) : "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Cancel edit DLR_SCH
  const handleCancelEditDlrSch = () => {
    setEditingDlrSchUtd(null);
    setDlrCodeInput("");
    setDlrSchTypeInput("");
    setForwMnthInput("");
  };

  // Schedular Type options derived directly from DLR_SCH_CONFIG records
  const schTypeOptions = useMemo(() => {
    if (!Array.isArray(tableData)) return [];
    return tableData
      .filter((item) => item.Sch_Type && item.Sch_Type.trim())
      .map((item) => {
        const sType = item.Sch_Type!.trim();
        const sName = item.Sch_Name ? item.Sch_Name.trim() : "";
        const timeInfo =
          item.Timing_Mode === "rolling"
            ? `Every ${item.Rolling_Interval || "10"}m`
            : item.Sch_Time
            ? item.Sch_Time.slice(0, 5)
            : "";
        const labelParts = [sType];
        if (sName) labelParts.push(`(${sName})`);
        if (timeInfo) labelParts.push(`[${timeInfo}]`);

        return {
          value: sType,
          label: labelParts.join(" "),
        };
      });
  }, [tableData]);

  // Columns for DLR_SCH DataTable
  const dlrSchColumns = useMemo(
    () => [
      {
        Header: "Dealer Code",
        accessor: "Dlr_Id",
        Cell: ({ value }: any) => (
          <span className="font-bold font-mono text-black dark:text-white">
            {value || "—"}
          </span>
        ),
      },
      {
        Header: "Schedular Type",
        accessor: "Sch_Type",
        Cell: ({ value }: any) => (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
            {value || "—"}
          </span>
        ),
      },
      {
        Header: "Forward Month",
        accessor: "Forw_Mnth",
        cellAlign: "center",
        Cell: ({ value }: any) => (
          <span className="font-semibold text-black dark:text-white">
            {value !== null && value !== undefined ? value : "—"}
          </span>
        ),
      },
      {
        Header: "Status",
        accessor: "Status_Label",
        cellAlign: "center",
        Cell: ({ row }: any) => {
          const item = row.original;
          const active = isActive(item.Export_Type);
          return (
            <div className="flex items-center justify-center">
              <button
                type="button"
                role="switch"
                aria-checked={active}
                onClick={() => handleToggleDlrSchStatus(item)}
                title={active ? "Active (Click to Deactivate)" : "Inactive (Click to Activate)"}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-sm ${
                  active ? "bg-[#16a34a]" : "bg-[#cbd5e1] dark:bg-gray-600"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    active ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          );
        },
      },
      {
        Header: "Actions",
        accessor: "actions",
        cellAlign: "center",
        Cell: ({ row }: any) => {
          const item = row.original;
          return (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditDlrSch(item)}
              className="px-3 py-1 text-xs font-bold flex items-center gap-1"
              title="Edit Dealer Schedule"
            >
              <Edit className="w-3.5 h-3.5" />
              Edit
            </Button>
          );
        },
      },
    ],
    [dlrSchTableData]
  );

  // Columns for DLR_SCH_CONFIG DataTable
  const schConfigColumns = useMemo(
    () => [
      {
        Header: "Schedule Name",
        accessor: "Sch_Name",
        Cell: ({ value }: any) => (
          <span className="font-semibold text-black dark:text-white">
            {value || "—"}
          </span>
        ),
      },
      {
        Header: "Schedule Type",
        accessor: "Sch_Type",
        Cell: ({ value }: any) => (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
            {value || "—"}
          </span>
        ),
      },
      {
        Header: "Timing Mode",
        accessor: "Timing_Mode",
        Cell: ({ value }: any) => (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-md font-bold text-xs uppercase ${value === "rolling"
              ? "bg-[#f3e8ff] text-[#7e22ce] dark:bg-[#581c87]/30 dark:text-[#d8b4fe]"
              : "bg-[#dbeafe] text-[#1d4ed8] dark:bg-[#1e3a8a]/30 dark:text-[#93c5fd]"
              }`}
          >
            {value || "fixed"}
          </span>
        ),
      },
      {
        Header: "Schedule Time / Interval",
        accessor: "Sch_Time",
        Cell: ({ row }: any) => {
          const item = row.original;
          return (
            <span className="font-semibold dark:text-white">
              {item.Timing_Mode === "rolling"
                ? `Every ${item.Rolling_Interval ?? "—"} Min`
                : item.Sch_Time || "—"}
            </span>
          );
        },
      },
      {
        Header: "Description",
        accessor: "Description",
        Cell: ({ value }: any) => (
          <span className="text-black dark:text-white max-w-xs truncate block">
            {value || "—"}
          </span>
        ),
      },
      {
        Header: "Actions",
        accessor: "actions",
        cellAlign: "center",
        Cell: ({ row }: any) => {
          const item = row.original;
          return (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDeleteScheduleConfig(item)}
              className="px-3 py-1 text-xs font-bold flex items-center gap-1 text-[#ef4444] border-[#ef4444] hover:bg-[#ef4444] hover:text-white transition-all cursor-pointer"
              title="Delete Schedule Configuration"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </Button>
          );
        },
      },
    ],
    [tableData]
  );

  const inputClass =
    "w-full border border-borderColor dark:border-borderColor-dark rounded-lg px-3.5 py-2 sm:py-2.5 bg-white dark:bg-dark text-black dark:text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary transition-all";

  return (
    <div className="w-full min-h-screen bg-white dark:bg-black">
      {/* 1. Header Banner */}
      <div className="w-full bg-gradient-to-r from-header to-header/80 dark:from-dark dark:to-dark/60 border-b border-borderColor dark:border-borderColor-dark px-4 sm:px-6 md:px-8 py-3.5 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2.5 sm:p-3 bg-white rounded-lg shadow-sm shrink-0">
              <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white uppercase tracking-wide sm:tracking-wider leading-tight">
                Dealer Schedule Management
              </h1>
              <p className="text-white/80 text-xs sm:text-sm md:text-base mt-0.5 sm:mt-1 font-medium">
                Create and manage dealer schedules & execution times
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
            {/* Create Button only for Schedule Config modal */}
            {activeTab === "sch_config" && (
              <Button
                onClick={handleOpenModal}
                variant="update"
                className="text-white flex items-center justify-center gap-1.5 sm:gap-2 font-bold uppercase text-xs sm:text-sm md:text-base py-2 sm:py-2.5 px-4 sm:px-6 shadow-md hover:scale-105 transition-all"
              >
                CREATE
              </Button>
            )}

            {/* Refresh Button */}
            <Button
              variant="print"
              onClick={() => {
                if (activeTab === "dlr_sch") {
                  fetchDlrSchList();
                } else {
                  fetchScheduleConfigs();
                }
                Swal.fire({
                  icon: "info",
                  title: "Refreshed",
                  timer: 1000,
                  showConfirmButton: false
                });
              }}
              className="flex items-center justify-center gap-1.5 sm:gap-2 font-bold text-xs sm:text-sm md:text-base py-2 sm:py-2.5 px-3 sm:px-4"
            >
              REFRESH
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Main Page Content */}
      <div className="w-full px-3 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8">
        {/* Modern Segmented Tab Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex flex-col xs:flex-row w-full sm:w-auto p-1 sm:p-1.5 bg-[#f1f5f9] dark:bg-[#1E293B]/80 rounded-xl sm:rounded-2xl border border-[#e2e8f0] dark:border-[#334155] shadow-inner gap-1 sm:gap-1.5 self-start overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => {
                setActiveTab("dlr_sch");
                setSearchTerm("");
              }}
              className={`relative px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm md:text-base flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer flex-1 sm:flex-initial whitespace-nowrap ${
                activeTab === "dlr_sch"
                  ? "bg-white dark:bg-[#0f172a] text-[#4A6CF7] shadow-md shadow-black/5 dark:shadow-black/20"
                  : "text-[#64748b] dark:text-[#94a3b8] hover:text-[#0f172a] dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/5"
              }`}
            >
              <Building2 className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors shrink-0 ${activeTab === "dlr_sch" ? "text-[#4A6CF7]" : "text-[#94a3b8]"}`} />
              <span>Dealer Schedules (DLR_SCH)</span>
              <span
                className={`ml-1 px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-bold transition-all ${
                  activeTab === "dlr_sch"
                    ? "bg-[#4A6CF7]/10 text-[#4A6CF7]"
                    : "bg-[#e2e8f0] dark:bg-[#334155] text-[#64748b] dark:text-[#94a3b8]"
                }`}
              >
                {dlrSchTableData.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("sch_config");
                setSearchTerm("");
              }}
              className={`relative px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm md:text-base flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer flex-1 sm:flex-initial whitespace-nowrap ${
                activeTab === "sch_config"
                  ? "bg-white dark:bg-[#0f172a] text-[#4A6CF7] shadow-md shadow-black/5 dark:shadow-black/20"
                  : "text-[#64748b] dark:text-[#94a3b8] hover:text-[#0f172a] dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/5"
              }`}
            >
              <Clock8 className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors shrink-0 ${activeTab === "sch_config" ? "text-[#4A6CF7]" : "text-[#94a3b8]"}`} />
              <span>Schedule Configs (DLR_SCH_CONFIG)</span>
              <span
                className={`ml-1 px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-bold transition-all ${
                  activeTab === "sch_config"
                    ? "bg-[#4A6CF7]/10 text-[#4A6CF7]"
                    : "bg-[#e2e8f0] dark:bg-[#334155] text-[#64748b] dark:text-[#94a3b8]"
                }`}
              >
                {tableData.length}
              </span>
            </button>
          </div>
        </div>

        {/* =================== TAB 1: DLR_SCH (DEALER SCHEDULE MAPPING) =================== */}
        {activeTab === "dlr_sch" && (
          <div className="space-y-4 sm:space-y-6">
            {/* Top Form: Ainput, CustomSelectSearch, and Button */}
            <div className="bg-white dark:bg-dark rounded-xl border border-borderColor dark:border-borderColor-dark shadow-sm sm:shadow-lg p-4 sm:p-6 relative z-30 overflow-visible">
              <div className="flex flex-wrap items-center justify-between pb-3 mb-4 border-b border-borderColor dark:border-borderColor-dark gap-2">
                <h3 className="text-sm sm:text-base font-bold text-header dark:text-white flex items-center gap-2 uppercase tracking-wider">
                  <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                  <span>
                    {editingDlrSchUtd
                      ? `Update Dealer Schedule (UTD: ${editingDlrSchUtd})`
                      : "Create Dealer Schedule (DLR_SCH)"}
                  </span>
                </h3>
                {editingDlrSchUtd && (
                  <span className="text-[11px] sm:text-xs px-2.5 py-1 rounded bg-[#fef3c7] text-[#b45309] font-bold">
                    Editing UTD: {editingDlrSchUtd}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                {/* Input 1: Dealer Code using Ainput */}
                <div>
                  <Ainput
                    title="Dealer Code"
                    type="text"
                    name="Dlr_Id"
                    value={dlrCodeInput}
                    handleInputChange={(_, value) => setDlrCodeInput(value)}
                    onInput={() => { }}
                    redlabel="*"
                    required
                    placeholder="e.g. 101, 102, 103"
                  />
                  <p className="text-[11px] text-[#9ca3af] mt-1">
                    Comma-separated dealer IDs (e.g. 101, 102)
                  </p>
                </div>

                {/* Input 2: Schedular Type using CustomSelectSearch populated from DLR_SCH_CONFIG */}
                <div>
                  <CustomSelectSearch
                    title="Schedular Type"
                    name="Sch_Type"
                    options={schTypeOptions}
                    selectedValue={dlrSchTypeInput}
                    handleInputChange={(_, value) => setDlrSchTypeInput(value)}
                    placeholder="Select Schedular Type"
                    redlabel="*"
                  />
                  <p className="text-[11px] text-[#9ca3af] mt-1">
                    Fetched from DLR_SCH_CONFIG
                  </p>
                </div>

                {/* Input 3: Forward Month using Ainput */}
                <div>
                  <Ainput
                    title="Forward Month"
                    type="number"
                    name="Forw_Mnth"
                    value={forwMnthInput}
                    handleInputChange={(_, value) => setForwMnthInput(value)}
                    onInput={() => { }}
                    redlabel=""
                    placeholder="e.g. 1, 2, 3 (Optional)"
                  />
                  <p className="text-[11px] text-[#9ca3af] mt-1">
                    Month number count (optional)
                  </p>
                </div>

                {/* Buttons using Button component */}
                <div className="w-full">
                  <span className="hidden lg:flex font-bold mt-1 mb-1 text-xs invisible select-none">Action</span>
                  <div className="flex items-center gap-2 h-9 w-full">
                    <Button
                      variant={editingDlrSchUtd ? "update" : "save"}
                      onClick={handleSaveDlrSch}
                      disabled={savingDlrSch}
                      className="flex-1 font-bold text-xs sm:text-sm h-9"
                    >
                      {savingDlrSch
                        ? "SAVING..."
                        : editingDlrSchUtd
                          ? "UPDATE"
                          : "CREATE"}
                    </Button>
                    {editingDlrSchUtd && (
                      <Button
                        variant="print"
                        onClick={handleCancelEditDlrSch}
                        className="font-bold text-xs sm:text-sm h-9 px-3 sm:px-4"
                      >
                        CANCEL
                      </Button>
                    )}
                  </div>
                  <p className="text-[11px] text-transparent mt-1 select-none hidden lg:block">
                    &nbsp;
                  </p>
                </div>
              </div>
            </div>

            {/* DLR_SCH Table using servicetable DataTable */}
            <div className="w-full overflow-x-auto rounded-xl border border-borderColor dark:border-borderColor-dark bg-white dark:bg-dark shadow-sm">
              <DataTable
                title={loadingDlrSch ? "Loading..." : "Dealer Schedules List (DLR_SCH)"}
                columns={dlrSchColumns}
                data={dlrSchTableData}
                selectValue="UTD"
                height="450px"
                enableColumnFilters={true}
                filterPosition="FilterData"
              />
            </div>
          </div>
        )}

        {/* =================== TAB 2: DLR_SCH_CONFIG (SCHEDULE CONFIGS) =================== */}
        {activeTab === "sch_config" && (
          <div className="w-full overflow-x-auto rounded-xl border border-borderColor dark:border-borderColor-dark bg-white dark:bg-dark shadow-sm">
            <DataTable
              title={loading ? "Loading..." : "Schedule Configurations (DLR_SCH_CONFIG)"}
              columns={schConfigColumns}
              data={tableData}
              selectValue="UTD"
              height="450px"
              enableColumnFilters={true}
              filterPosition="FilterData"
            />
          </div>
        )}
      </div>

      {/* 3. MODAL: CREATE / UPDATE SCHEDULE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 md:p-6 animate-fadeIn">
          <div className="bg-white dark:bg-dark rounded-xl sm:rounded-2xl w-full max-w-5xl max-h-[96vh] sm:max-h-[90vh] overflow-hidden shadow-2xl border border-primary/20 flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-header to-header/80 dark:from-dark dark:to-dark/60 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center border-b border-borderColor dark:border-borderColor-dark shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-white/10 rounded-lg text-white shrink-0">
                  <Clock8 className="w-5 h-5 sm:w-6 sm:h-6 text-yellow" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white uppercase tracking-wide sm:tracking-wider leading-tight">
                    {editingUtd ? "Update Dealer Schedule" : "Create Dealer Schedule"}
                  </h2>
                  <p className="text-white/70 text-[11px] sm:text-xs">
                    {editingUtd
                      ? "Modify schedule type, execution time, and description"
                      : "Configure schedule type, execution time, and description"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg text-white transition-colors shrink-0"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 md:p-8 overflow-y-auto flex-1 space-y-4 sm:space-y-6">
              {/* Row 1: Schedule Type & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Input 1: Schedular Name */}
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="block text-xs sm:text-sm font-bold text-header dark:text-white uppercase tracking-wider">
                    Schedular Name <span className="text-[#ef4444]">*</span>
                  </label>
                  <input
                    type="text"
                    value={schName}
                    onChange={(e) => setSchName(e.target.value)}
                    placeholder="Enter scheduler Name..."
                    className={inputClass}
                  />
                </div>

                {/* Input 2: Schedular Type */}
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="block text-xs sm:text-sm font-bold text-header dark:text-white uppercase tracking-wider">
                    Schedular Type <span className="text-[#ef4444]">*</span>
                  </label>
                  <input
                    type="text"
                    value={schType}
                    onChange={(e) => setSchType(e.target.value)}
                    placeholder="Enter scheduler type..."
                    className={inputClass}
                  />
                </div>

                {/* Input 3: Description */}
                <div className="space-y-1.5 sm:space-y-2 sm:col-span-2 lg:col-span-1">
                  <label className="block text-xs sm:text-sm font-bold text-header dark:text-white uppercase tracking-wider">
                    Description
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter schedule description / remark"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Row 2: Timing Mode & Settings (Fixed vs Rolling) */}
              <div className="bg-off/50 dark:bg-dark/60 border border-borderColor dark:border-borderColor-dark rounded-xl sm:rounded-2xl p-4 sm:p-5 space-y-4 sm:space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-borderColor/60 dark:border-borderColor-dark/60">
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-header dark:text-white uppercase tracking-wider">
                      Execution Timing Mode <span className="text-[#ef4444]">*</span>
                    </label>
                    <p className="text-[11px] sm:text-xs text-[#6b7280] dark:text-[#9ca3af] mt-0.5">
                      Choose whether the schedule executes at a fixed daily time or repeats periodically.
                    </p>
                  </div>

                  {/* Modern Segmented Toggle Tabs */}
                  <div className="inline-flex w-full sm:w-auto p-1 bg-[#e5e7eb]/80 dark:bg-black/50 rounded-xl border border-borderColor dark:border-borderColor-dark self-start sm:self-auto shadow-inner">
                    <button
                      type="button"
                      onClick={() => setScheduleMode("fixed")}
                      className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 ${
                        scheduleMode === "fixed"
                          ? "bg-primary text-white shadow-md shadow-primary/30"
                          : "text-[#4b5563] dark:text-[#d1d5db] hover:text-black dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10"
                      }`}
                    >
                      <Clock8 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                      <span>Fixed Time</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setScheduleMode("rolling")}
                      className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 ${
                        scheduleMode === "rolling"
                          ? "bg-primary text-white shadow-md shadow-primary/30"
                          : "text-[#4b5563] dark:text-[#d1d5db] hover:text-black dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10"
                      }`}
                    >
                      <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                      <span>Rolling Interval</span>
                    </button>
                  </div>
                </div>

                {/* Conditional View: Fixed Time Mode */}
                {scheduleMode === "fixed" && (
                  <div className="max-w-md space-y-1.5 sm:space-y-2 animate-fadeIn">
                    <label className="block text-xs font-bold text-header dark:text-white uppercase tracking-wider">
                      Daily Schedule Time (Sch_Time) <span className="text-[#ef4444]">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="time"
                        value={schTime}
                        onChange={(e) => setSchTime(e.target.value)}
                        className={inputClass}
                        step="60"
                        required
                      />
                    </div>
                    <p className="text-[11px] sm:text-xs text-[#6b7280] dark:text-[#9ca3af]">
                      Set the exact daily execution time (e.g. 10:30 AM).
                    </p>
                  </div>
                )}

                {/* Conditional View: Rolling Interval Mode */}
                {scheduleMode === "rolling" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                    <div className="space-y-1.5 sm:space-y-2">
                      <label className="block text-xs font-bold text-header dark:text-white uppercase tracking-wider">
                        Rolling Interval <span className="text-[#ef4444]">*</span>
                      </label>
                      <select
                        value={rollingInterval}
                        onChange={(e) => setRollingInterval(e.target.value)}
                        className={inputClass}
                      >
                        <option value="5">Every 5 Minutes</option>
                        <option value="10">Every 10 Minutes</option>
                        <option value="15">Every 15 Minutes</option>
                        <option value="30">Every 30 Minutes</option>
                        <option value="45">Every 45 Minutes</option>
                        <option value="60">Every 1 Hour (60 Min)</option>
                        <option value="120">Every 2 Hours (120 Min)</option>
                        <option value="180">Every 3 Hours (180 Min)</option>
                        <option value="240">Every 4 Hours (240 Min)</option>
                        <option value="300">Every 5 Hours (300 Min)</option>
                        <option value="OTHER">➕ Other (Custom Minutes)</option>
                      </select>
                      <p className="text-[11px] sm:text-xs text-[#6b7280] dark:text-[#9ca3af]">
                        Select how frequently the task should trigger.
                      </p>
                    </div>

                    {/* Custom Interval input when "OTHER" is picked */}
                    {rollingInterval === "OTHER" && (
                      <div className="space-y-1.5 sm:space-y-2 animate-fadeIn">
                        <label className="block text-xs font-bold text-header dark:text-white uppercase tracking-wider">
                          Custom Interval (in Minutes) <span className="text-[#ef4444]">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            value={customInterval}
                            onChange={(e) => setCustomInterval(e.target.value)}
                            placeholder="Enter interval in minutes (e.g. 25, 90)"
                            className={inputClass}
                            autoFocus
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#9ca3af] pointer-events-none">
                            Minutes
                          </span>
                        </div>
                        <p className="text-[11px] sm:text-xs text-[#6b7280] dark:text-[#9ca3af]">
                          Execution will repeat after this many minutes.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-borderColor dark:border-borderColor-dark bg-off/50 dark:bg-dark/30 flex flex-col-reverse xs:flex-row justify-end items-stretch xs:items-center gap-2 sm:gap-3 shrink-0">
              <Button
                variant="print"
                onClick={handleCloseModal}
                className="w-full xs:w-auto font-bold text-xs sm:text-sm md:text-base px-5 py-2 sm:py-2.5"
              >
                Cancel
              </Button>

              <Button
                variant="update"
                onClick={handleSave}
                disabled={saving}
                className="w-full xs:w-auto font-bold text-xs sm:text-sm md:text-base px-6 py-2 sm:py-2.5 shadow-md disabled:opacity-50"
              >
                {saving ? "SAVING..." : editingUtd ? "UPDATE" : "SAVE"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}