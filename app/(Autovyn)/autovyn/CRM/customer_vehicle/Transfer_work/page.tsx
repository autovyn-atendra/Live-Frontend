"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import HashloaderComponent from "@/components/Templates/hashloader";
import DataTable from "@/components/Templates/ServiceTable";
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

        const confirmResult = await Swal.fire({
            title: "Confirm Transfer",
            html: `
        Transfer <b>${selectedTasks.length}</b> selected task(s) from<br/>
        <b style="color:#e74c3c">
          ${fromEmployee?.FULL_NAME?.trim() || fromEmpCode}
        </b>
        <br/>to<br/>
        <b style="color:#27ae60">
          ${toEmployee?.FULL_NAME?.trim() || toEmpCode}
        </b>
        <br/><br/>
        <small style="color:#666">
          Cust_Vehi UTDs: ${selectedCustVehiUTDs.slice(0, 5).join(", ")}
          ${selectedCustVehiUTDs.length > 5
                    ? ` ... +${selectedCustVehiUTDs.length - 5} more`
                    : ""}
        </small>
        <br/>Do you want to continue?
      `,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, Transfer",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
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
                <span className="rounded-full px-2 py-1 text-xs font-bold bg-yellow-100 text-yellow-700">
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
                            Transfer Service Executive Tasks
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
                                ?`Clear All  (${pendingTasks.length})`
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
                        disabled={
                            isTransferring ||
                            !fromEmpCode ||
                            !toEmpCode ||
                            selectedTasks.length === 0
                        }
                    >
                        {isTransferring
                            ? "Transferring..."
                            : `Transfer ${selectedTasks.length} Task(s)`}
                    </Button>

                    {/* RESET BUTTON */}
                    <Button
                        variant="print"
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