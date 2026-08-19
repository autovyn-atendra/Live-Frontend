"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import HashloaderComponent from "@/components/Templates/hashloader";
import DataTable from "@/components/Templates/servicetable";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import CustomSelectSearch from "@/components/atoms/Select";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_URL;

// ============================================================
// TYPES
// ============================================================
type Employee = {
    EMPCODE: string;
    EMPFIRSTNAME: string;
    EMPLASTNAME: string;
    FULL_NAME: string;
    MOBILENO: string;
};

type PendingTask = {
    Cust_Vehi_UTD: number | string;
    Veh_Reg_No: string;
    Cust_Name: string;
    Cust_Mob: string;
    srv_exec_name: string | null;
    srv_exec_Emp_Code: string | null;
    srv_exec_mobile: string | null;
    Loc_Code: string;
    Reminder_Date: string | null;
    Reminder_Status: string;
    Reminder_UTD: number | string;
};

// ============================================================
// ALERT
// ============================================================
function showSideAlert(
    message: string,
    type: "success" | "error" | "warning" | "info"
) {
    Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 5000,
        timerProgressBar: true,
    }).fire({ icon: type, title: message });
}

// ============================================================
// PAGE
// ============================================================
const TransferExecutiveTasksPage = () => {
    const user = useCurrentUser();

    const getJsonHeaders = () => ({
        accept: "application/json",
        compcode: user?.Comp_Code,
        name: user?.name,
        "Content-Type": "application/json",
    });

    // ── States ───────────────────────────────────────────────────
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [fromEmpCode, setFromEmpCode] = useState<string>("");
    const [toEmpCode, setToEmpCode] = useState<string>("");
    const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);
    const [isTransferring, setIsTransferring] = useState(false);
    const [isFetching, setIsFetching] = useState(false);

    // ✅ Selected rows state
    const [selectedRows, setSelectedRows] = useState<{ id: any; rowData: any }[]>([]);

    // ── Fetch Employees ──────────────────────────────────────────
    const fetchEmployees = useCallback(async () => {
        try {
            const locCode = user?.branch || "1";
            const res = await axios.post(
                `${BASE_URL}/Crm/getEmployees`,
                { Loc_Code: String(locCode) },
                { headers: getJsonHeaders() }
            );
            setEmployees(
                res?.data?.success && Array.isArray(res.data.data)
                    ? res.data.data
                    : []
            );
        } catch (err) {
            console.error("getEmployees error:", err);
            setEmployees([]);
        }
    }, [user?.branch]);

    useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

    // ── Employee Dropdown Options ─────────────────────────────────
    const employeeOptions = useMemo(
        () =>
            employees.map((emp) => ({
                value: emp.EMPCODE,
                label: `${(emp.FULL_NAME || "").trim()} - ${emp.EMPCODE}${emp.MOBILENO ? ` (${emp.MOBILENO})` : ""
                    }`,
            })),
        [employees]
    );

    const toEmployeeOptions = useMemo(
        () => employeeOptions.filter((e) => e.value !== fromEmpCode),
        [employeeOptions, fromEmpCode]
    );

    const fromEmployeeOptions = useMemo(
        () => employeeOptions.filter((e) => e.value !== toEmpCode),
        [employeeOptions, toEmpCode]
    );

    // ── Fetch Pending Tasks ──────────────────────────────────────
    const fetchPendingTasks = useCallback(async () => {
        if (!fromEmpCode) {
            setPendingTasks([]);
            setSelectedRows([]); // ✅ clear selection
            return;
        }

        try {
            setIsFetching(true);
            const locCode = user?.branch || "1";

            const res = await axios.post(
                `${BASE_URL}/Crm/getPendingTasksByExecutive`,
                { from_Emp_Code: fromEmpCode, Loc_Code: locCode },
                { headers: getJsonHeaders() }
            );

            setPendingTasks(
                res?.data?.success && Array.isArray(res.data.data)
                    ? res.data.data
                    : []
            );
            setSelectedRows([]); // ✅ new executive select hone par selection clear
        } catch (err: any) {
            console.error("fetchPendingTasks error:", err);
            setPendingTasks([]);
            setSelectedRows([]);
            showSideAlert(
                err?.response?.data?.message || "Error fetching pending tasks",
                "error"
            );
        } finally {
            setIsFetching(false);
        }
    }, [fromEmpCode, user?.branch]);

    useEffect(() => {
        fetchPendingTasks();
        setToEmpCode("");
    }, [fromEmpCode]);

    // ── Employee info helpers ────────────────────────────────────
    const fromEmployee = useMemo(
        () => employees.find((e) => e.EMPCODE === fromEmpCode) || null,
        [employees, fromEmpCode]
    );

    const toEmployee = useMemo(
        () => employees.find((e) => e.EMPCODE === toEmpCode) || null,
        [employees, toEmpCode]
    );

    // ✅ Selected tasks derived from selectedRows
    const selectedTasks = useMemo(
        () => selectedRows.map((r) => r.rowData as PendingTask),
        [selectedRows]
    );

    // ✅ Selected UTDs — Cust_Vehi_UTD
    const selectedCustVehiUTDs = useMemo(
        () =>
            selectedTasks
                .map((t) => Number(t.Cust_Vehi_UTD))
                .filter((v) => !isNaN(v) && v > 0),
        [selectedTasks]
    );

    // ✅ Selected Reminder UTDs
    const selectedReminderUTDs = useMemo(
        () =>
            selectedTasks
                .map((t) => Number(t.Reminder_UTD))
                .filter((v) => !isNaN(v) && v > 0),
        [selectedTasks]
    );

    // ── Handle Transfer ──────────────────────────────────────────
    const handleTransfer = async () => {
        if (!fromEmpCode) {
            showSideAlert("Please select the source (From) executive", "warning");
            return;
        }

        if (!toEmpCode) {
            showSideAlert("Please select the destination (To) executive", "warning");
            return;
        }

        if (fromEmpCode === toEmpCode) {
            showSideAlert("From and To executive cannot be the same", "warning");
            return;
        }

        // ✅ Selected tasks check
        if (selectedTasks.length === 0) {
            showSideAlert(
                "Please select at least one task to transfer",
                "warning"
            );
            return;
        }

        const fromName = fromEmployee?.FULL_NAME?.trim() || fromEmpCode;
        const toName = toEmployee?.FULL_NAME?.trim() || toEmpCode;
        const taskCount = selectedTasks.length;
        const utdPreview = selectedCustVehiUTDs.slice(0, 5).join(", ");
        const remainingCount = selectedCustVehiUTDs.length > 5 ? selectedCustVehiUTDs.length - 5 : 0;

        const confirmResult = await Swal.fire({
            title: "",
            width: "540px",
            padding: "1.5rem",

            background: "#ffffff",
            showCancelButton: true,
            confirmButtonText: "Yes, Transfer Tasks ➔",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#f59e0b",
            cancelButtonColor: "#64748b",
            customClass: {
                popup: "rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 dark:bg-slate-950",
                confirmButton: "px-7 py-3 font-extrabold rounded-xl text-base shadow-lg cursor-pointer tracking-wide",
                cancelButton: "px-6 py-3 font-bold rounded-xl text-base cursor-pointer mr-3",
            },
            html: `
            <div style="text-align: left; font-family: inherit; width: 100%;">
              <!-- Header Icon & Title -->
              <div style="text-align: center; margin-bottom: 16px;">
                <div style="width: 56px; height: 56px; margin: 0 auto 10px; background: #fffbebf5; border: 1px solid #fef3c7; border-radius: 16px; display: flex; align-items: center; justify-content: center; color: #d97706;">
                  <svg style="width: 28px; height: 28px;" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                  </svg>
                </div>
                <h3 style="font-size: 26px; font-weight: 800; color: #1e293b; margin: 0 0 4px;">Confirm Task Transfer</h3>
                <p style="font-size: 18px; color: #64748b; margin: 0;">Are you sure you want to reassign the selected customer tasks?</p>
              </div>

              <!-- Main Detail Box -->
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 14px; margin-bottom: 8px;">
                
                <!-- Task Count Header -->
                <div style="display: flex; align-items: center; justify-content: space-between; padding-bottom: 10px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0;">
                  <span style="font-size: 17px; font-weight: 700; color: #64748b;">TOTAL SELECTION</span>
                  <span style="background: #fef3c7; color: #b45309; border: 1px solid #fde68a; font-size: 17px; font-weight: 800; padding: 3px 10px; border-radius: 20px;">
                    📦 ${taskCount} ${taskCount === 1 ? "Task" : "Tasks"}
                  </span>
                </div>

                <!-- From & To Transfer Section -->
                <div style="display: flex; align-items: center; gap: 8px; width: 100%;">
                  
                  <!-- From Executive -->
                  <div style="flex: 1; background: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; padding: 10px; text-align: center; min-width: 0; overflow: hidden;">
                    <span style="display: block; font-size: 10px; font-weight: 800; color: #e11d48; text-transform: uppercase; margin-bottom: 3px;">FROM EXECUTIVE</span>
                    <div style="font-size: 17px; font-weight: 800; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${fromName}">
                      ${fromName}
                    </div>
                    <div style="font-size: 10px; font-weight: 600; color: #64748b; font-family: monospace; margin-top: 2px;">
                      (${fromEmpCode})
                    </div>
                  </div>

                  <!-- Arrow Indicator -->
                  <div style="width: 32px; height: 32px; min-width: 32px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; color: #475569; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                    ➔
                  </div>

                  <!-- To Executive -->
                  <div style="flex: 1; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 10px; text-align: center; min-width: 0; overflow: hidden;">
                    <span style="display: block; font-size: 10px; font-weight: 800; color: #059669; text-transform: uppercase; margin-bottom: 3px;">TO EXECUTIVE</span>
                    <div style="font-size: 17px; font-weight: 800; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${toName}">
                      ${toName}
                    </div>
                    <div style="font-size: 10px; font-weight: 600; color: #64748b; font-family: monospace; margin-top: 2px;">
                      (${toEmpCode})
                    </div>
                  </div>

                </div>

                

              </div>
            </div>
          `,
        });

        if (!confirmResult.isConfirmed) return;

        try {
            setIsTransferring(true);

            const locCode = user?.branch || "1";

            // ✅ Sirf selected UTDs pass karo
            const payload = {
                from_Emp_Code: fromEmpCode,
                to_Emp_Code: toEmpCode,
                to_exec_name: toEmployee?.FULL_NAME?.trim() || null,
                to_exec_mobile: toEmployee?.MOBILENO || null,
                Loc_Code: locCode,
                // ✅ KEY CHANGE: selected UTDs
                selectedCustVehiUTDs,
                selectedReminderUTDs,
                Updated_By: user?.name || (user as any)?.UTD || null,
            };

            const res = await axios.post(
                `${BASE_URL}/Crm/transferServiceExecutiveTasks`,
                payload,
                { headers: getJsonHeaders() }
            );

            if (res?.data?.success) {
                showSideAlert(
                    res.data.message || "Tasks transferred successfully",
                    "success"
                );

                // ✅ Sirf transferred tasks ko list se hatao
                setPendingTasks((prev) =>
                    prev.filter(
                        (t) =>
                            !selectedCustVehiUTDs.includes(Number(t.Cust_Vehi_UTD))
                    )
                );
                setSelectedRows([]);
                setToEmpCode("");
            } else {
                showSideAlert(res?.data?.message || "Transfer failed", "error");
            }
        } catch (err: any) {
            console.error("transfer error:", err);
            showSideAlert(
                err?.response?.data?.message ||
                err?.response?.data?.Message ||
                err?.message ||
                "Error transferring tasks",
                "error"
            );
        } finally {
            setIsTransferring(false);
        }
    };

    // ── Table Columns ─────────────────────────────────────────────
    const columns = [
        { Header: "Vehicle Reg No", accessor: "Veh_Reg_No" },
        { Header: "Customer Name", accessor: "Cust_Name" },
        { Header: "Customer Mobile", accessor: "Cust_Mob" },
        // { Header: "Loc Code",        accessor: "Loc_Code"    },
        {
            Header: "Reminder Date",
            accessor: "Reminder_Date",
            cellAlign: "center",
            Cell: ({ value }: any) => {
                if (!value) return "";
                const [y, m, d] = String(value).split("-");
                return `${d}-${m}-${y}`;
            },
        },
        {
            Header: "Reminder Status",
            accessor: "Reminder_Status",
            cellAlign: "center",
            Cell: ({ value }: any) => (
                <span className="rounded-full px-2 py-1  font-bold bg-[#FEF3C7] text-[#B45309]">
                    {value || "-"}
                </span>
            ),
        },
        { Header: "Current Exec Name", accessor: "srv_exec_name" },
        { Header: "Current Exec Code", accessor: "srv_exec_Emp_Code" },
        { Header: "Current Exec Mobile", accessor: "srv_exec_mobile" },
    ];

    // ── Render ────────────────────────────────────────────────────
    return (
        <div className="grid grid-cols-12 gap-4">
            {/* HEADER */}
            <div className="col-span-12">
                <div className="rounded-t border border-borderColor bg-header px-2 py-2 dark:border-borderColor-dark dark:bg-black md:px-6">
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                        <h1 className="flex items-center gap-x-3 text-sm font-bold uppercase text-white dark:text-[#37a9dd] md:text-lg lg:text-xl">
                            <Image
                                src="/Payrollicon/Excel_Import.png"
                                alt="Transfer Tasks"
                                width={25}
                                height={25}
                            />
                            CRE Transfer Work
                        </h1>

                        <Button
                            variant="print"
                            onClick={() => window.history.back()}
                            disabled={isTransferring}
                        >
                            Back
                        </Button>
                    </div>
                </div>
            </div>

            {/* TRANSFER PANEL */}
            <div className="col-span-12 rounded border border-borderColor bg-white p-4 shadow dark:border-borderColor-dark dark:bg-black">
                <div className="flex flex-wrap items-end gap-3">

                    {/* FROM EXECUTIVE */}
                    <div className="w-full md:w-[22%]">
                        <CustomSelectSearch
                            title="Select From Executive"
                            name="fromExecutive"
                            className="text-lg"
                            labelClass="text-lg"
                            placeholder="Select source executive..."
                            options={fromEmployeeOptions}
                            selectedValue={fromEmpCode}
                            handleInputChange={(_name: string, value: string) =>
                                setFromEmpCode(value)
                            }
                            isSelectAll={false}
                            disabled={isTransferring}
                        />
                    </div>

                    {/* ARROW */}
                    <div className="flex items-center justify-center pb-1">
                        <span className="text-2xl font-bold text-blue-500">→</span>
                    </div>

                    {/* TO EXECUTIVE */}
                    <div className="w-full md:w-[22%]">
                        <CustomSelectSearch
                            title="Select To Executive"
                            name="toExecutive"
                            className="text-lg"
                            labelClass="text-lg"
                            placeholder="Select destination executive..."
                            options={toEmployeeOptions}
                            selectedValue={toEmpCode}
                            handleInputChange={(_name: string, value: string) =>
                                setToEmpCode(value)
                            }
                            isSelectAll={false}
                            disabled={isTransferring || !fromEmpCode}
                        />
                    </div>

                    {/* SELECT ALL */}
                    {/* SELECT ALL / CLEAR */}
                    {pendingTasks.length > 0 && (
                        <Button
                            variant="outline"
                            size='lg'
                            onClick={() => {
                                const allSelected =
                                    selectedTasks.length === pendingTasks.length;

                                if (allSelected) {
                                    // Clear Selection
                                    setSelectedRows([]);
                                } else {
                                    // Select All
                                    setSelectedRows(
                                        pendingTasks.map((t) => ({
                                            id: t.Cust_Vehi_UTD,
                                            rowData: t,
                                        }))
                                    );
                                }
                            }}
                            disabled={isTransferring}
                        >
                            {selectedTasks.length === pendingTasks.length
                                ? `Clear All  (${pendingTasks.length})`
                                : `Select All (${pendingTasks.length})`}
                        </Button>
                    )}

                    {/* CLEAR SELECTION */}
                    {/* {selectedTasks.length > 0 && (
                        <Button
                            variant="print"
                            onClick={() => setSelectedRows([])}
                            disabled={isTransferring}
                        >
                            Clear ({selectedTasks.length})
                        </Button>
                    )} */}

                    {/* TRANSFER BUTTON */}
                    <Button
                        variant="save"
                        onClick={handleTransfer}
                        size="lg"
                        disabled={
                            isTransferring ||
                            !fromEmpCode ||
                            !toEmpCode ||
                            selectedTasks.length === 0
                        }
                    >
                        {isTransferring
                            ? "Transferring..."
                            : `Transfer ${selectedTasks.length} Task`}
                    </Button>

                    {/* RESET BUTTON */}
                    <Button
                        variant="print"
                        size="lg"
                        onClick={() => {
                            setFromEmpCode("");
                            setToEmpCode("");
                            setPendingTasks([]);
                            setSelectedRows([]);

                        }}
                        disabled={isTransferring}
                    >
                        Reset
                    </Button>



                </div>
            </div>

            {/* PENDING TASKS TABLE */}
            <div className="col-span-12 rounded border border-borderColor bg-white p-2 shadow dark:border-borderColor-dark dark:bg-black md:p-4">
                <DataTable
                    title={
                        fromEmpCode
                            ? `Pending Tasks — ${fromEmployee?.FULL_NAME?.trim() || fromEmpCode} (${pendingTasks.length} total | ${selectedTasks.length} selected)`
                            : "Pending Tasks"
                    }
                    columns={columns}
                    selectValue="Cust_Vehi_UTD"
                    data={pendingTasks}
                    height={400}
                    size="text-lg"
                    filterPosition="FilterData"
                    enableColumnFilters={true}
                    numericFilterColumns={["Cust_Vehi_UTD", "Reminder_UTD"]}
                    onRowDoubleClick={() => { }}
                    // ✅ Checkbox selection
                    ischeckbox={true}
                    selectedRows={selectedRows}
                    setSelectedRows={setSelectedRows}
                />

                {fromEmpCode && !isFetching && pendingTasks.length === 0 && (
                    <div className="py-4 text-center text-sm text-gray-500">
                        ✅ No pending tasks found for{" "}
                        <strong>
                            {fromEmployee?.FULL_NAME?.trim() || fromEmpCode}
                        </strong>
                    </div>
                )}
            </div>

            <HashloaderComponent isLoading={isTransferring || isFetching} />
        </div>
    );
};

export default TransferExecutiveTasksPage;