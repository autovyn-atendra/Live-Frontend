"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation"; // 👈 NEW IMPORT
import Swal from "sweetalert2";
import {
    X,
    PlayCircle,
    FileText,
    MessageSquareText,
    BarChart3,
    PhoneCall,
    Download,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import DataTable from "@/components/Templates/ServiceTable";
import HashloaderComponent from "@/components/Templates/hashloader";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import axios from "axios";
import Ainput from "@/components/atoms/Input";

const BASE_URL = process.env.NEXT_PUBLIC_URL;

// ============================================================
// TYPES
// ============================================================

type VehicleRow = {
    Veh_Reg_No: string;
    Cust_Name: string;
    Cust_Mob: string;
    Model_Name: string;

    Cust_Vehi_UTD: number | string;
    Loc_Code: string;
    Loc_Name: string;

    Last_Service_Date: string | null;
    Last_Service_KM: number | string | null;

    Next_Service_Due_Date: string | null;
    Next_Service_KM: number | string | null;

    Last_Reminder_At: string | null;
    Reminder_Channel: string | null;
    Total_Reminders: number | string | null;

    Service_Status: string | null;
    Service_Completed_Date: string | null;

    Due_Status: string | null;
    Days_Until_Due: number | string | null;
};

type Pagination = {
    page: number;
    pageSize: number;
    totalPages: number;
    totalRecords: number;
};

type GetAllResponse = {
    success: boolean;
    message?: string;
    data: VehicleRow[];
    pagination: Pagination;
};

// -------- Call History Types --------

type ChatMessage = {
    sender: string;
    side: "left" | "right";
    message: string;
    time: string;
    raw_sender: string;
};

type CallChat = {
    totalMessages: number;
    botMessages: number;
    humanMessages: number;
    messages: ChatMessage[];
};

type TransferInfo = {
    transferredTo: string;
    transferStatus: string;
    transferTime: string;
} | null;

type SlotsOffered = {
    slot1?: string;
    slot2?: string;
    slot3?: string;
};

type CallRecord = {
    Reminder: number;
    callId: string;
    status: string;
    rawStatus: string;
    direction: string;
    phoneNumber: string;
    duration: string | null;
    durationSec: number | null;
    triggeredAt: string | null;
    startTime: string | null;
    endTime: string | null;
    uploadTime: string | null;
    appointmentSet: boolean;
    appointmentDate: string | null;
    appointmentTime: string | null;
    appointmentSlot: string | null;
    summary: string | null;
    category: string | null;
    transferInfo: TransferInfo;
    chat: CallChat;
    slotsOffered: SlotsOffered;
    callChannel: "AI_CALL" | "MANUAL_CALL";   // 👈 NEW
    isManualCall: boolean;
};

type CallHistoryStats = {
    totalCalls: number;
    completedCalls: number;
    busyCalls: number;
    noAnswerCalls: number;
    failedCalls: number;
    appointmentsSet: number;
    totalDurationSec: number;
};

type CallHistoryVehicleInfo = {
    Veh_Reg_No: string;
    Cust_Name: string;
    Cust_Mob: string;
    Model_Name: string;
};

type CallHistoryResponse = {
    Status: boolean;
    vehicleInfo: CallHistoryVehicleInfo;
    stats: CallHistoryStats;
    calls: CallRecord[];
};

// ============================================================
// UTILS / ALERT
// ============================================================

const trimToUndef = (v: unknown): string | undefined => {
    const s = v == null ? "" : String(v).trim();
    return s ? s : undefined;
};

function showSideAlert(
    message: string,
    type: "success" | "error" | "warning" | "info"
) {
    const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 5000,
        timerProgressBar: true,
        customClass: {
            container: "side-alert-container",
            popup: `side-alert-${type}`,
            title: "side-alert-title",
            icon: "side-alert-icon",
        },
    });

    Toast.fire({
        icon: type,
        title: message,
    });
}

// ============================================================
// SIMPLE MODAL COMPONENT
// ============================================================

const Modal = ({
    isOpen,
    onClose,
    children,
    widthClass = "max-w-4xl",
    zIndexClass = "z-50",
}: {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    widthClass?: string;
    zIndexClass?: string;
}) => {
    if (!isOpen) return null;

    return (
        <div
            className={`fixed inset-0 ${zIndexClass} flex items-center justify-center bg-black/60 p-4`}
            onClick={onClose}
        >
            <div
                className={`relative max-h-[92vh] w-full ${widthClass} overflow-hidden rounded-lg bg-white shadow-2xl dark:bg-[#111827]`}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
};

// ============================================================
// PAGE
// ============================================================

const Page = () => {
    const user = useCurrentUser();
    const searchParams = useSearchParams(); // 👈 NEW
    const router = useRouter(); // 👈 NEW


    const getAllCustomerVehicles = async (payload: {
        page?: number;
        pageSize?: number;
        search?: string;
        Loc_Code?: string;
        fromDate?: string;
        toDate?: string;
    }) => {
        const response = await axios.post(
            `${BASE_URL}/Crm/reminder/getCalledReminders`,
            payload,
            {
                headers: {
                    accept: "application/json",
                    compcode: user?.Comp_Code,
                    name: user?.name,
                    "Content-Type": "application/json",
                },
            }
        );

        return response.data;
    };

    const getCallHistory = async (
        vehicleNumber: string
    ): Promise<CallHistoryResponse> => {
        const response = await axios.post(
            `${BASE_URL}/Crm/call-history`,
            { vehicle_number: vehicleNumber },
            {
                headers: {
                    accept: "application/json",
                    compcode: user?.Comp_Code,
                    name: user?.name,
                    "Content-Type": "application/json",
                }
            }
        );
        return response.data;
    };

    // table + data states
    const [rows, setRows] = useState<VehicleRow[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // pagination (server-side)
    const [page, setPage] = useState<number>(1); // 1-based
    const [pageSize, setPageSize] = useState<number>(10);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalRecords, setTotalRecords] = useState<number>(0);

    // single search bar (draft + applied)
    const [search, setSearch] = useState<string>("");
    const [appliedSearch, setAppliedSearch] = useState<string>("");

    // date filters (draft + applied)
    const [fromDate, setFromDate] = useState<string>("");
    const [toDate, setToDate] = useState<string>("");
    const [appliedFromDate, setAppliedFromDate] = useState<string>("");
    const [appliedToDate, setAppliedToDate] = useState<string>("");

    // Loc_Code from user (applied silently; no input shown)
    const [appliedLocCode, setAppliedLocCode] = useState<string>("");

    // ---------------- Call History Modal States ----------------
    const [isCallHistoryOpen, setIsCallHistoryOpen] = useState(false);
    const [isLoadingCallHistory, setIsLoadingCallHistory] = useState(false);
    const [callHistoryData, setCallHistoryData] =
        useState<CallHistoryResponse | null>(null);
    const [callHistoryPage, setCallHistoryPage] = useState(1);
    const callHistoryPageSize = 10;

    // ---------------- Transcript Modal States ----------------
    const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
    const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);

    // ---------------- Insights Modal States ----------------
    const [isInsightsOpen, setIsInsightsOpen] = useState(false);


    // ---------------- Recording Modal States ----------------
    const [playingCallId, setPlayingCallId] = useState<string | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);
    const [isLoadingRecording, setIsLoadingRecording] = useState(false);

    // Header without Content-Type (GET request ke liye zaroori nahi)
    const getAudioHeaders = () => ({
        accept: "*/*",
        compcode: user?.Comp_Code,
        name: user?.name,
    });

    const handlePlayRecording = async (callId: string) => {
        if (!callId) return;

        try {
            setPlayingCallId(callId);
            setIsRecordingModalOpen(true);
            setIsLoadingRecording(true);
            setAudioUrl(null);

            const response = await axios.get(
                `${BASE_URL}/Crm/GetCallRecordings/${callId}`,
                {
                    headers: {
                        accept: "*/*",
                        compcode: user?.Comp_Code,
                        name: user?.name,
                    },
                    responseType: "blob", // 👈 IMPORTANT: audio ko blob ke form me lena hai
                }
            );

            const contentType = response.headers["content-type"] || "audio/mpeg";
            const blob = new Blob([response.data], { type: contentType });
            const url = URL.createObjectURL(blob);

            setAudioUrl(url);
        } catch (err: any) {
            console.error("Recording fetch error:", err);
            showSideAlert(
                err?.response?.data?.message ||
                err?.message ||
                "Unable to fetch recording",
                "error"
            );
            setIsRecordingModalOpen(false);
        } finally {
            setIsLoadingRecording(false);
        }
    };

    const closeRecordingModal = () => {
        // Memory leak avoid karne ke liye blob URL revoke karo
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
        }
        setIsRecordingModalOpen(false);
        setAudioUrl(null);
        setPlayingCallId(null);
    };

    // initialize Loc_Code once
    useEffect(() => {
        const defaultLoc =
            (user?.branch as unknown) ?? (user?.branch as unknown) ?? "";
        const asString = String(defaultLoc ?? "");
        setAppliedLocCode(asString);
    }, [user?.branch]);

    // payload uses APPLIED filters only
    const payload = useMemo(
        () => ({
            page,
            pageSize,
            search: trimToUndef(appliedSearch),
            Loc_Code: user?.branch, // silently applied
            fromDate: trimToUndef(appliedFromDate),
            toDate: trimToUndef(appliedToDate),
        }),
        [page, pageSize, appliedSearch, appliedLocCode, appliedFromDate, appliedToDate]
    );

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);

            const res: GetAllResponse = await getAllCustomerVehicles(payload);

            if (!res?.success) {
                showSideAlert("Failed to fetch data", "error");
                setRows([]);
                setTotalPages(1);
                setTotalRecords(0);
                return;
            }

            setRows(Array.isArray(res.data) ? res.data : []);
            setTotalPages(res?.pagination?.totalPages || 1);
            setTotalRecords(res?.pagination?.totalRecords || 0);
        } catch (err: any) {
            console.error("getAll error:", err);
            showSideAlert(
                err?.response?.data?.Message ||
                err?.response?.data?.message ||
                err?.message ||
                "Error fetching data",
                "error"
            );
            setRows([]);
            setTotalPages(1);
            setTotalRecords(0);
        } finally {
            setIsLoading(false);
        }
    }, [payload]);

    // fetch only when payload (applied search or paging) changes
    useEffect(() => {
        if (!user?.Comp_Code) return;
        fetchData();
    }, [fetchData]);

    // Apply: copy draft -> applied, reset to page 1
    const handleApplyClick = () => {
        setAppliedSearch(search);
        setAppliedFromDate(fromDate);
        setAppliedToDate(toDate);
        setPage(1);
    };

    // Reset all: clear drafts + applied, reset page & pageSize
    const handleResetFilters = () => {
        setSearch("");
        setAppliedSearch("");
        setFromDate("");
        setToDate("");
        setAppliedFromDate("");
        setAppliedToDate("");
        setPage(1);
        setPageSize(10);
    };

    // Enter key applies (no API calls on each keystroke)
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleApplyClick();
        }
    };

    const formatDate = (date: string | null | undefined) => {
        if (!date) return "";
        const [year, month, day] = date.split("-");
        if (!year || !month || !day) return date;
        return `${day}-${month}-${year}`;
    };

    const formatDateTime = (dateTime: string | null | undefined) => {
        if (!dateTime) return "";
        const [datePart, timePart] = dateTime.split(" ");
        const formattedDate = formatDate(datePart);
        return timePart ? `${formattedDate} ${timePart}` : formattedDate;
    };

    // ============================================================
    // CALL HISTORY HANDLERS
    // ============================================================

    // 👇 UPDATED: ab yeh reusable function hai (row click + URL param dono ke liye)
    const fetchCallHistoryByVehicle = useCallback(
        async (vehicleNumber: string) => {
            if (!vehicleNumber) return;
            try {
                setIsLoadingCallHistory(true);
                setIsCallHistoryOpen(true);
                setCallHistoryPage(1);

                const res = await getCallHistory(vehicleNumber);

                if (!res?.Status) {
                    showSideAlert("Failed to fetch call history", "error");
                    setCallHistoryData(null);
                    return;
                }

                setCallHistoryData(res);
            } catch (err: any) {
                console.error("call history error:", err);
                showSideAlert(
                    err?.response?.data?.message ||
                    err?.message ||
                    "Error fetching call history",
                    "error"
                );
                setCallHistoryData(null);
            } finally {
                setIsLoadingCallHistory(false);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    const handleVehicleClick = async (row: VehicleRow) => {
        if (!row?.Veh_Reg_No) return;
        await fetchCallHistoryByVehicle(row.Veh_Reg_No);
    };

    // ============================================================
    // 👇 NEW: URL me vehicleNo query param aane par auto-open modal
    // Example: /autovyn/service_reminder/reminder_history?vehicleNo=RJ14AB1432
    // ============================================================
    useEffect(() => {
        const vehicleNoFromUrl = searchParams?.get("vehicleNo");
        if (vehicleNoFromUrl) {
            fetchCallHistoryByVehicle(vehicleNoFromUrl);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    // 👇 UPDATED: modal close hote hi URL se vehicleNo param bhi clean kar do
    const closeCallHistoryModal = () => {
        setIsCallHistoryOpen(false);
        setCallHistoryData(null);
        setCallHistoryPage(1);

        if (searchParams?.get("vehicleNo")) {
            router.replace("/autovyn/CRM/customer_vehicle/reminders");
        }
    };

    const openTranscriptModal = (call: CallRecord) => {
        setSelectedCall(call);
        setIsTranscriptOpen(true);
    };

    const closeTranscriptModal = () => {
        setIsTranscriptOpen(false);
        setSelectedCall(null);
    };

    const openInsightsModal = (call: CallRecord) => {
        setSelectedCall(call);
        setIsInsightsOpen(true);
    };

    const closeInsightsModal = () => {
        setIsInsightsOpen(false);
        setSelectedCall(null);
    };

    const handleCallNow = (phoneNumber: string) => {
        if (!phoneNumber) return;
        window.open(`tel:${phoneNumber}`, "_self");
    };

    //   const handleShowPlaceholders = (call: CallRecord) => {
    //     const slots = call.slotsOffered || {};
    //     const entries = Object.entries(slots).filter(([, v]) => !!v);

    //     const html = entries.length
    //       ? entries
    //           .map(
    //             ([key, val]) =>
    //               `<div style="text-align:left;padding:4px 0;"><strong style="text-transform:capitalize">${key}:</strong> ${val}</div>`
    //           )
    //           .join("")
    //       : `<div>No placeholder data available</div>`;

    //     // Swal.fire({
    //     //   title: "Slots Offered",
    //     //   html,
    //     // });
    //   };

    const handleDownloadTranscript = () => {
        if (!selectedCall?.chat?.messages?.length) {
            showSideAlert("No transcript available to download", "warning");
            return;
        }
        const text = selectedCall.chat.messages
            .map((m) => `[${m.time}] ${m.sender}: ${m.message}`)
            .join("\n");

        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `transcript_${selectedCall.callId}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const getCallStatusColor = (status: string | null | undefined) => {
        const s = String(status).toUpperCase();
        if (s === "COMPLETED") return "text-[#16A34A]";
        if (s === "BUSY") return "text-[#CA8A04]";
        if (s === "FAILED") return "text-[#DC2626]";
        if (s === "INITIATED" || s === "NO_ANSWER") return "text-[#6B7280]";
        return "text-[#6B7280]";
    };

    // client-side pagination for calls inside modal
    const paginatedCalls = useMemo(() => {
        if (!callHistoryData?.calls) return [];
        const start = (callHistoryPage - 1) * callHistoryPageSize;
        return callHistoryData.calls.slice(start, start + callHistoryPageSize);
    }, [callHistoryData, callHistoryPage]);

    const totalCallPages = useMemo(() => {
        if (!callHistoryData?.calls) return 1;
        return Math.max(
            1,
            Math.ceil(callHistoryData.calls.length / callHistoryPageSize)
        );
    }, [callHistoryData]);

    const callsShowingFrom = callHistoryData?.calls?.length
        ? (callHistoryPage - 1) * callHistoryPageSize + 1
        : 0;
    const callsShowingTo = callHistoryData?.calls?.length
        ? Math.min(callHistoryPage * callHistoryPageSize, callHistoryData.calls.length)
        : 0;

    // DATATABLE COLUMNS
    const columns = [
        {
            Header: "Vehicle Registration No",
            accessor: "Veh_Reg_No",
        },
        {
            Header: "Customer Name",
            accessor: "Cust_Name",
        },
        {
            Header: "Customer Mobile",
            accessor: "Cust_Mob",
        },
        {
            Header: "Model Name",
            accessor: "Model_Name",
        },
        {
            Header: "Location",
            accessor: "Loc_Name",
        },
        {
            Header: "Last Service Date",
            accessor: "Last_Service_Date",
            cellAlign: "center",
            Cell: ({ value }: any) => formatDate(value),
        },
        {
            Header: "Last Service KM",
            accessor: "Last_Service_KM",
            cellAlign: "center",
        },
        {
            Header: "Next Service Due Date",
            accessor: "Next_Service_Due_Date",
            cellAlign: "center",
            Cell: ({ value }: any) => formatDate(value),
        },
        {
            Header: "Next Service KM",
            accessor: "Next_Service_KM",
            cellAlign: "center",
        },
        {
            Header: "Last Reminder At",
            accessor: "Last_Reminder_At",
            cellAlign: "center",
            Cell: ({ value }: any) => formatDateTime(value),
        },
        {
            Header: "Total Reminders",
            accessor: "Total_Reminders",
            cellAlign: "center",
        },
        {
            Header: "Service Status",
            accessor: "Service_Status",
            cellAlign: "center",
            Cell: ({ value }: any) => {
                const isCompleted = String(value).toUpperCase() === "COMPLETED";
                return (
                    <span
                        className={`rounded-full px-2 py-1 text-xs font-bold ${isCompleted
                            ? "bg-[#DCFCE7] text-[#15803D]"
                            : "bg-yellow-100 text-[#A16207]"
                            }`}
                    >
                        {value || "-"}
                    </span>
                );
            },
        },
        {
            Header: "Service Completed Date",
            accessor: "Service_Completed_Date",
            cellAlign: "center",
            Cell: ({ value }: any) => formatDate(value),
        },

    ];

    return (
        <div className="grid grid-cols-12 gap-4">
            {/* HEADER */}
            <div className="col-span-12">
                <div className="rounded-t border border-borderColor bg-header px-2 py-2 dark:border-borderColor-dark dark:bg-black md:px-6">
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                        <div className="flex">
                            <h1 className="flex items-center gap-x-3 text-sm font-bold uppercase text-white dark:text-[#37a9dd] md:text-lg lg:text-xl">
                                <Image
                                    src="/Payrollicon/Excel_Import.png"
                                    alt="Customer Vehicle List"
                                    width={25}
                                    height={25}
                                />
                                Vehicles SERVICE REMINDER HISTORY
                            </h1>
                        </div>

                        <div className="flex flex-wrap justify-between gap-x-2 gap-y-2">
                            <Button
                                variant="outline"
                                onClick={() => fetchData()}
                                disabled={isLoading}
                            >
                                Refresh
                            </Button>

                            <Button
                                variant="print"
                                onClick={() => window.history.back()}
                                disabled={isLoading}
                            >
                                Back
                            </Button>
                        </div>
                    </div>
                </div>

                {/* FILTERS */}
                <div className="mt-3 rounded-b border border-borderColor bg-white p-2 shadow dark:border-borderColor-dark dark:bg-black md:p-4">
                    <div className="flex flex-wrap items-end gap-3 justify-end">
                        <div className="w-full md:w-1/4">
                            <Ainput
                                title="Search"
                                type="text"
                                name="search"
                                value={search}
                                handleInputChange={(_, value) => setSearch(value)}
                                onInput={() => {}}
                                onKeyDown={handleKeyDown}
                                redlabel=""
                                disabled={isLoading}
                                placeholder="Search (name, mobile, reg no, model)"
                            />
                        </div>

                        <div className="w-full md:w-1/6">
                            <Ainput
                                title="From Date"
                                type="date"
                                name="fromDate"
                                value={fromDate}
                                handleInputChange={(_, value) => setFromDate(value)}
                                onInput={() => {}}
                                redlabel=""
                                disabled={isLoading}
                            />
                        </div>

                        <div className="w-full md:w-1/6">
                            <Ainput
                                title="To Date"
                                type="date"
                                name="toDate"
                                value={toDate}
                                handleInputChange={(_, value) => setToDate(value)}
                                onInput={() => {}}
                                redlabel=""
                                disabled={isLoading}
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="save"
                                onClick={handleApplyClick}
                                disabled={isLoading}
                            >
                                Apply
                            </Button>

                            <Button
                                variant="print"
                                onClick={handleResetFilters}
                                disabled={isLoading}
                            >
                                Reset
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* DATA TABLE */}
            <div className="col-span-12 mt-0 rounded-b border border-borderColor bg-white p-2 shadow dark:border-borderColor-dark dark:bg-black md:p-4">
                <DataTable
                    title="Customer Vehicles"
                    columns={columns}
                    selectValue="Cust_Vehi_UTD"
                    data={rows}
                    height={450}
                    filterPosition="FilterData"
                    enableColumnFilters={true}
                    numericFilterColumns={[
                        "Cust_Vehi_UTD",
                        "Last_Service_KM",
                        "Next_Service_KM",
                        "Total_Reminders",
                        "Days_Until_Due",
                    ]}
                    // 👉 Row click opens Call History Modal
                    //   onRowClick={}
                    onRowDoubleClick={(row: VehicleRow) => handleVehicleClick(row)}
                    // server-side pagination hookup
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
                />
            </div>

            <HashloaderComponent isLoading={isLoading} />

            {/* ============================================================
          CALL HISTORY MODAL
      ============================================================ */}
            <Modal
                isOpen={isCallHistoryOpen}
                onClose={closeCallHistoryModal}
                widthClass="max-w-7xl"
                zIndexClass="z-40"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-borderColor bg-header px-4 py-3 dark:bg-black">
                    <div>
                        <h2 className="text-[20px] font-bold text-white dark:text-[#37a9dd]">
                            {callHistoryData?.vehicleInfo?.Veh_Reg_No || "Call History"}
                        </h2>
                        <p className="text-[16px] text-[#E5E7EB] dark:text-[#9CA3AF]">
                            {callHistoryData?.vehicleInfo?.Cust_Name} •{" "}
                            {callHistoryData?.vehicleInfo?.Cust_Mob} •{" "}
                            {callHistoryData?.vehicleInfo?.Model_Name}
                        </p>
                    </div>
                    <button
                        onClick={closeCallHistoryModal}
                        className="rounded-full p-1 text-white hover:bg-white/20"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="max-h-[80vh] overflow-y-auto">
                    {isLoadingCallHistory ? (
                        <div className="flex items-center justify-center p-10">
                            <HashloaderComponent isLoading={true} />
                        </div>
                    ) : (
                        <>
                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-3 border-b border-borderColor p-4 dark:border-borderColor-dark sm:grid-cols-3 md:grid-cols-7">
                                <StatCard
                                    label="Total Calls"
                                    value={callHistoryData?.stats?.totalCalls ?? 0}
                                />
                                <StatCard
                                    label="Completed"
                                    value={callHistoryData?.stats?.completedCalls ?? 0}
                                    color="text-[#16A34A]"
                                />
                                <StatCard
                                    label="Busy"
                                    value={callHistoryData?.stats?.busyCalls ?? 0}
                                    color="text-[#CA8A04]"
                                />
                                <StatCard
                                    label="No Answer"
                                    value={callHistoryData?.stats?.noAnswerCalls ?? 0}
                                    color="text-[#6B7280]"
                                />
                                <StatCard
                                    label="Failed"
                                    value={callHistoryData?.stats?.failedCalls ?? 0}
                                    color="text-[#DC2626]"
                                />
                                <StatCard
                                    label="Appointments"
                                    value={callHistoryData?.stats?.appointmentsSet ?? 0}
                                    color="text-[#2563EB]"
                                />
                                <StatCard
                                    label="Total Duration"
                                    value={`${Math.round(
                                        (callHistoryData?.stats?.totalDurationSec ?? 0) / 60
                                    )} min`}
                                />
                            </div>

                            {/* Calls Table */}
                            <div className="overflow-x-auto p-4">
                                <table className="w-full min-w-[900px] text-left text-[17px]">
                                    <thead>
                                        <tr className="border-b border-borderColor text-[17px] font-bold uppercase text-[#6B7280] dark:border-borderColor-dark dark:text-[#9CA3AF]">
                                            <th className="px-2 py-2">Time</th>
                                            <th className="px-2 py-2">To Phone Number</th>
                                            <th className="px-2 py-2">Status</th>
                                            <th className="px-2 py-2">Duration</th>
                                            <th className="px-2 py-2">Channel</th>
                                            <th className="px-2 py-2 text-center">Recording</th>
                                            {/* <th className="px-2 py-2 text-center">Placeholders</th> */}
                                            <th className="px-2 py-2 text-center">Transcript</th>
                                            <th className="px-2 py-2 text-center">Summary</th>
                                            {/* <th className="px-2 py-2 text-center">Call</th> */}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedCalls.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={9}
                                                    className="px-2 py-6 text-center text-[#9CA3AF] text-[17px]"
                                                >
                                                    No calls found
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedCalls.map((call) => (
                                                <tr
                                                    key={call.callId}
                                                    className="border-b border-borderColor/50 hover:bg-[#F9FAFB] dark:border-borderColor-dark/50 dark:hover:bg-[#1F2937]"
                                                >
                                                    <td className="px-2 py-3 text-[17px]">{call.triggeredAt || "-"}</td>
                                                    <td className="px-2 py-3 text-[17px]">{call.phoneNumber || "-"}</td>
                                                    <td className="px-2 py-3 text-[17px]">
                                                        <span
                                                            className={`flex items-center gap-1 font-semibold ${getCallStatusColor(
                                                                call.status
                                                            )}`}
                                                        >
                                                            <span className="h-2 w-2 rounded-full bg-current" />
                                                            {call.status?.toLowerCase()}
                                                        </span>
                                                    </td>
                                                    <td className="px-2 py-3 text-[17px]">
                                                        {call.duration ||
                                                            (call.durationSec
                                                                ? `${call.durationSec} sec`
                                                                : "-")}
                                                    </td>
                                                    <td className="px-2 py-3 text-center">
                                                        <span
                                                            className={`rounded-full px-2.5 py-1 text-[13px] font-bold ${call.callChannel === "MANUAL_CALL"
                                                                ? "bg-[#FFEDD5] text-[#C2410C]"
                                                                : "bg-[#F3E8FF] text-[#7E22CE]"
                                                                }`}
                                                        >
                                                            {call.callChannel === "MANUAL_CALL" ? "Manual" : "AI Call"}
                                                        </span>
                                                    </td>
                                                    <td className="px-2 py-3 text-center">
                                                        <button
                                                            title="Play Recording"
                                                            onClick={() => handlePlayRecording(call.callId)}
                                                            className="text-[#2563EB] hover:text-[#1E40AF]"
                                                        >
                                                            <PlayCircle size={18} />
                                                        </button>
                                                    </td>
                                                    {/* <td className="px-2 py-3 text-center">
                            <button
                              title="View Placeholders"
                              onClick={() => handleShowPlaceholders(call)}
                              className="text-blue-500 hover:text-[#1D4ED8]"
                            >
                              <FileText size={18} />
                            </button>
                          </td> */}
                                                    <td className="px-2 py-3 text-center">
                                                        <button
                                                            title="View Transcript"
                                                            onClick={() => openTranscriptModal(call)}
                                                            disabled={!call.chat?.messages?.length}
                                                            className={
                                                                call.chat?.messages?.length
                                                                    ? "text-[#4F46E5] hover:text-[#3730A3]"
                                                                    : "cursor-not-allowed text-[#D1D5DB] dark:text-[#4B5563]"
                                                            }
                                                        >
                                                            <MessageSquareText size={18} />
                                                        </button>
                                                    </td>
                                                    <td className="px-2 py-3 text-center">
                                                        <button
                                                            title="View Insights"
                                                            onClick={() => openInsightsModal(call)}
                                                            className="text-[#9333EA] hover:text-[#6B21A8]"
                                                        >
                                                            <BarChart3 size={18} />
                                                        </button>
                                                    </td>
                                                    {/* <td className="px-2 py-3 text-center">
                            <button
                              title="Call Now"
                              onClick={() => handleCallNow(call.phoneNumber)}
                              className="text-green-600 hover:text-green-800"
                            >
                              <PhoneCall size={18} />
                            </button>
                          </td> */}
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>

                                {/* Pagination */}
                                {callHistoryData?.calls?.length ? (
                                    <div className="mt-4 flex items-center justify-between text-[16px] text-[#6B7280] dark:text-[#9CA3AF]">
                                        <span>
                                            Showing {callsShowingFrom} to {callsShowingTo} of{" "}
                                            {callHistoryData.calls.length} results
                                        </span>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={callHistoryPage <= 1}
                                                onClick={() =>
                                                    setCallHistoryPage((p) => Math.max(1, p - 1))
                                                }
                                            >
                                                Previous
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={callHistoryPage >= totalCallPages}
                                                onClick={() =>
                                                    setCallHistoryPage((p) =>
                                                        Math.min(totalCallPages, p + 1)
                                                    )
                                                }
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </>
                    )}
                </div>
            </Modal>

            {/* ============================================================
          TRANSCRIPT MODAL (WHATSAPP STYLE) - stacked above Call History
      ============================================================ */}
            <Modal
                isOpen={isTranscriptOpen}
                onClose={closeTranscriptModal}
                widthClass="max-w-md"
                zIndexClass="z-50"
            >
                {/* Header */}
                <div className="flex items-center justify-between bg-[#4F46E5] px-4 py-3 text-white">
                    <h3 className="flex items-center gap-2 text-[18px] font-semibold">
                        <MessageSquareText size={20} />
                        Call Transcript
                    </h3>
                    <div className="flex items-center gap-3">
                        <button
                            title="Download Transcript"
                            onClick={handleDownloadTranscript}
                            className="hover:opacity-80"
                        >
                            <Download size={20} />
                        </button>
                        <button
                            title="Close"
                            onClick={closeTranscriptModal}
                            className="hover:opacity-80"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Chat Body */}
                <div className="max-h-[70vh] space-y-3 overflow-y-auto bg-[#F3F4F6] p-3 dark:bg-[#1F2937]">
                    {selectedCall?.chat?.messages?.length ? (
                        selectedCall.chat.messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex ${msg.side === "right" ? "justify-end" : "justify-start"
                                    }`}
                            >
                                <div
                                    className={`max-w-[82%] rounded-lg px-3.5 py-2.5 text-[17px] shadow ${msg.side === "right"
                                        ? "bg-[#DCFCE7] text-[#1F2937] dark:bg-[#BBF7D0]"
                                        : "bg-white text-[#1F2937] dark:bg-gray-700 dark:text-[#F3F4F6]"
                                        }`}
                                >
                                    <p className="whitespace-pre-wrap leading-relaxed">
                                        {msg.message}
                                    </p>
                                    <span className="mt-1 block text-right text-[13px] text-[#9CA3AF]">
                                        {msg.time}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="py-10 text-center text-[17px] text-[#9CA3AF]">
                            No transcript available
                        </p>
                    )}
                </div>
            </Modal>

            {/* ============================================================
          INSIGHTS MODAL - stacked above Call History
      ============================================================ */}
            {/* Insights Modal */}
            <Modal
                isOpen={isInsightsOpen}
                onClose={closeInsightsModal}
                widthClass="max-w-lg"
                zIndexClass="z-50"
            >
                <div className="flex items-center justify-between border-b bg-[#4F46E5] text-white border-borderColor px-4 py-3 dark:border-borderColor-dark">
                    <h3 className="flex items-center gap-2 text-[18px] font-bold">
                        <BarChart3 size={20} className="text-white" />
                        Call Insights
                    </h3>
                    <button onClick={closeInsightsModal} className="hover:opacity-80">
                        <X size={20} />
                    </button>
                </div>

                <div className="max-h-[70vh] space-y-3 overflow-y-auto p-4 text-[17px]">
                    <InsightRow label="Category" value={selectedCall?.category || "-"} />
                    <InsightRow label="Summary" value={selectedCall?.summary || "-"} />
                    <InsightRow
                        label="Appointment Set"
                        value={selectedCall?.appointmentSet ? "Yes" : "No"}
                    />
                    {selectedCall?.appointmentSet && (
                        <>
                            <InsightRow
                                label="Appointment Date"
                                value={formatDate(selectedCall?.appointmentDate)}
                            />
                            <InsightRow
                                label="Appointment Time"
                                value={selectedCall?.appointmentTime || "-"}
                            />
                            <InsightRow
                                label="Slot"
                                value={selectedCall?.appointmentSlot || "-"}
                            />
                        </>
                    )}
                    {selectedCall?.transferInfo && (
                        <>
                            <InsightRow
                                label="Transferred To"
                                value={selectedCall.transferInfo.transferredTo}
                            />
                            <InsightRow
                                label="Transfer Status"
                                value={selectedCall.transferInfo.transferStatus}
                            />
                            <InsightRow
                                label="Transfer Time"
                                value={selectedCall.transferInfo.transferTime}
                            />
                        </>
                    )}
                </div>
            </Modal>

            {/* Recording Modal */}
            <Modal
                isOpen={isRecordingModalOpen}
                onClose={closeRecordingModal}
                widthClass="max-w-md"
                zIndexClass="z-50"
            >
                <div className="flex items-center justify-between bg-[#2563EB] px-4 py-3 text-white">
                    <h3 className="flex items-center gap-2 text-[18px] font-semibold">
                        <PlayCircle size={20} />
                        Call Recording
                    </h3>
                    <button onClick={closeRecordingModal} className="hover:opacity-80">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex min-h-[150px] flex-col items-center justify-center gap-4 p-6">
                    {isLoadingRecording ? (
                        <div className="flex flex-col items-center gap-2">
                            <HashloaderComponent isLoading={true} />
                            <p className="text-[17px] text-[#9CA3AF]">Loading recording...</p>
                        </div>
                    ) : audioUrl ? (
                        <>
                            <audio controls autoPlay className="w-full">
                                <source src={audioUrl} type="audio/mpeg" />
                                Your browser does not support the audio element.
                            </audio>

                            <a
                                href={audioUrl}
                                download={`recording_${playingCallId}.mp3`}
                                className="flex items-center gap-1 text-[17px] text-[#2563EB] font-medium hover:underline"
                            >
                                <Download size={18} />
                                Download Recording
                            </a>
                        </>
                    ) : (
                        <p className="text-[17px] text-[#9CA3AF]">No recording available</p>
                    )}
                </div>
            </Modal>
        </div>
    );
};

// ============================================================
// SMALL SUB-COMPONENTS
// ============================================================

const StatCard = ({
    label,
    value,
    color = "text-[#1F2937] dark:text-white",
}: {
    label: string;
    value: string | number;
    color?: string;
}) => (
    <div className="rounded-md border border-borderColor bg-[#F9FAFB] p-2.5 text-center dark:border-borderColor-dark dark:bg-[#1F2937]">
        <p className={`text-[22px] font-bold ${color}`}>{value}</p>
        <p className="text-[14px] font-medium text-[#6B7280] dark:text-[#9CA3AF]">{label}</p>
    </div>
);

const InsightRow = ({
    label,
    value,
}: {
    label: string;
    value: string | number | null | undefined;
}) => (
    <div className="flex flex-col gap-1 border-b border-borderColor/40 pb-2.5 dark:border-borderColor-dark/40">
        <span className="text-[15px] font-semibold text-[#6B7280] dark:text-[#9CA3AF]">
            {label}
        </span>
        <span className="text-[18px] font-medium text-[#1F2937] dark:text-[#F3F4F6]">{value ?? "-"}</span>
    </div>
);

export default Page;