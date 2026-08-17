"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Swal from "sweetalert2";

import { Button } from "@/components/ui/button";
import DataTable from "@/components/Templates/ServiceTable";
import HashloaderComponent from "@/components/Templates/hashloader";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import axios from "axios";
import CustomSelectSearch from "@/components/atoms/Select";

const BASE_URL = process.env.NEXT_PUBLIC_URL;

// ============================================================
// TYPES
// ============================================================

type VehicleRow = {
  UTD: number | string;
  Loc_Code: string;
  Veh_Reg_No: string;
  Cust_Name: string;
  Cust_Mob: string;
  Model_Name: string;
  Last_Service_Date: string | null;
  Last_Service_KM: number | string | null;
  Avg_Daily_KM: number | string | null;
  Current_KM: number | string | null;
  Service_Interval_KM?: number | string | null;
  Service_Interval_Days?: number | string | null;
  srv_exec_name?: string | null;
  srv_exec_Emp_Code?: string | null;
  srv_exec_mobile?: string | null;
  status?: number | string;
  Created_By?: string;
  Created_At?: string | null;
  Updated_By?: string | null;
  Updated_At?: string | null;
};

type Pagination = {
  currentPage: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

type GetAllResponse = {
  success: boolean;
  data: VehicleRow[];
  pagination: Pagination;
};

type Employee = {
  EMPCODE: string;
  EMPFIRSTNAME: string;
  EMPLASTNAME: string;
  FULL_NAME: string;
  MOBILENO: string;
};

type GetEmployeesResponse = {
  success: boolean;
  totalRecords: number;
  data: Employee[];
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

  Toast.fire({ icon: type, title: message });
}

// ============================================================
// PAGE
// ============================================================

const CustomerVehicleListPage = () => {
  const user = useCurrentUser();



  // ── API calls ────────────────────────────────────────────────
  const getAllCustomerVehicles = async (payload: {
    page?: number;
    pageSize?: number;
    search?: string;
    Loc_Code?: string;
  }) => {
    const response = await axios.post(
      `${BASE_URL}/Crm/customer-vehicle/getAll`,
      payload,
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

  const getEmployees = async (payload: { Loc_Code: string }) => {
    const response = await axios.post(
      `${BASE_URL}/Crm/getEmployees`,
      payload,
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

  const bulkUpdateServiceExecutive = async (payload: {
    Loc_Code: string[] | string;
    selectedUTDs: number[];              // ✅ NEW
    srv_exec_name?: string | null;
    srv_exec_mobile?: string | null;
    srv_exec_Emp_Code?: string | null;
    Updated_By?: string | number | null;
  }) => {
    const response = await axios.put(
      `${BASE_URL}/Crm/bulkUpdateServiceExecutive`,
      payload,
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

  // ── States ───────────────────────────────────────────────────
  const [rows, setRows] = useState<VehicleRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [search, setSearch] = useState<string>("");
  const [appliedSearch, setAppliedSearch] = useState<string>("");
  const [selectedRows, setSelectedRows] = useState<{ id: any; rowData: any }[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmpCode, setSelectedEmpCode] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);

  // ── Payload ──────────────────────────────────────────────────
  const payload = useMemo(
    () => ({
      page,
      pageSize,
      search: trimToUndef(appliedSearch),
      Loc_Code: user?.branch,
    }),
    [page, pageSize, appliedSearch, user?.branch]
  );

  // ── Fetch vehicles ───────────────────────────────────────────
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

  useEffect(() => {
     if (!user?.Comp_Code) return;
     fetchData();
     }, [fetchData]);

  // ── Fetch employees ──────────────────────────────────────────
  const fetchEmployees = useCallback(async () => {
    try {
      const locCode = user?.branch || "1";
      const res: GetEmployeesResponse = await getEmployees({
        Loc_Code: String(locCode),
      });
      setEmployees(res?.success && Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("getEmployees error:", err);
      setEmployees([]);
    }
  }, [user?.branch]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  // ── Employee dropdown options ─────────────────────────────────
  const employeeOptions = useMemo(
    () =>
      employees.map((emp) => ({
        value: emp.EMPCODE,
        label: `${(emp.FULL_NAME || "").trim()} - ${emp.EMPCODE}${emp.MOBILENO ? ` (${emp.MOBILENO})` : ""
          }`,
      })),
    [employees]
  );

  // ── Filters ──────────────────────────────────────────────────
  const handleApplyClick = () => {
    setAppliedSearch(search);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch("");
    setAppliedSearch("");
    setPage(1);
    setPageSize(10);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleApplyClick();
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "";
    const [year, month, day] = date.split("-");
    return `${day}-${month}-${year}`;
  };

  // ════════════════════════════════════════════════════════
  // ✅ BULK UPDATE — Sirf selected rows ke UTD update honge
  // ════════════════════════════════════════════════════════
  const handleUpdateServiceExecutive = async () => {
    if (!selectedEmpCode) {
      showSideAlert("Please select a service executive", "warning");
      return;
    }

    if (!selectedRows || selectedRows.length === 0) {
      showSideAlert("Please select at least one vehicle row", "warning");
      return;
    }

    const selectedEmployee = employees.find(
      (emp) => emp.EMPCODE === selectedEmpCode
    );

    if (!selectedEmployee) {
      showSideAlert("Selected employee not found", "error");
      return;
    }

    // ✅ Selected rows ke UTDs nikalo
    const selectedUTDs = selectedRows
      .map((r) => Number(r.rowData?.UTD))
      .filter((v) => !isNaN(v) && v > 0);

    if (selectedUTDs.length === 0) {
      showSideAlert("No valid UTDs found in selected rows", "error");
      return;
    }

    // ✅ Selected rows ke Loc_Codes nikalo (safety)
    const uniqueLocCodes = Array.from(
      new Set(
        selectedRows
          .map((r) => r.rowData?.Loc_Code)
          .filter((v) => v !== undefined && v !== null && v !== "")
          .map((v) => String(v).trim())
      )
    );

    if (uniqueLocCodes.length === 0) {
      showSideAlert("No valid Loc_Code found in selected rows", "error");
      return;
    }

    const confirmResult = await Swal.fire({
      title: "Confirm Update",
      html: `
        This will update the Service Executive to
        <b>${selectedEmployee.FULL_NAME?.trim() || selectedEmployee.EMPFIRSTNAME}</b>
        for <b>${selectedUTDs.length}</b> selected vehicle(s).<br/>
        <small>UTDs: ${selectedUTDs.join(", ")}</small><br/>
        Do you want to continue?
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Update",
      cancelButtonText: "Cancel",
    });

    if (!confirmResult.isConfirmed) return;

    try {
      setIsUpdating(true);

      const updatePayload = {
        Loc_Code: uniqueLocCodes,
        selectedUTDs,                          // ✅ selected UTDs pass karo
        srv_exec_name: selectedEmployee.FULL_NAME?.trim() ||
          selectedEmployee.EMPFIRSTNAME || null,
        srv_exec_mobile: selectedEmployee.MOBILENO || null,
        srv_exec_Emp_Code: selectedEmployee.EMPCODE || null,
        Updated_By: user?.name || (user as any)?.UTD || null,
      };

      const res = await bulkUpdateServiceExecutive(updatePayload);

      if (res?.success) {
        showSideAlert(
          res?.message || "Service executive updated successfully",
          "success"
        );
        setSelectedRows([]);
        setSelectedEmpCode("");
        fetchData();
      } else {
        showSideAlert(
          res?.message || "Failed to update service executive",
          "error"
        );
      }
    } catch (err: any) {
      console.error("bulkUpdateServiceExecutive error:", err);
      showSideAlert(
        err?.response?.data?.message ||
        err?.response?.data?.Message ||
        err?.message ||
        "Error updating service executive",
        "error"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedRows([]);
    setSelectedEmpCode("");
  };

  // ── Columns ──────────────────────────────────────────────────
  const columns = [
    { Header: "Vehicle Registration No", accessor: "Veh_Reg_No" },
    { Header: "Customer Name", accessor: "Cust_Name" },
    { Header: "Customer Mobile", accessor: "Cust_Mob" },
    { Header: "Model Name", accessor: "Model_Name" },
    { Header: "Service Executive Name", accessor: "srv_exec_name" ,cellAlign: "center"},
    { Header: "Service Executive Emp Code", accessor: "srv_exec_Emp_Code",cellAlign: "center" },
    { Header: "Service Executive Mobile", accessor: "srv_exec_mobile",cellAlign: "center" },
    {
      Header: "Last Service Date",
      accessor: "Last_Service_Date",
      cellAlign: "center",
      Cell: ({ value }: any) => formatDate(value),
    },
    { Header: "Last Service KM", accessor: "Last_Service_KM", cellAlign: "center" },
    { Header: "Average Daily KM", accessor: "Avg_Daily_KM", cellAlign: "center" },
    { Header: "Current KM", accessor: "Current_KM", cellAlign: "center" },
    {
      Header: "Status",
      accessor: "status",
      cellAlign: "center",
      Cell: ({ value }: any) => {
        const active = Number(value) === 0;
        return (
          <span
            className={`rounded-full px-2 py-1 text-xs font-bold ${active
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
              }`}
          >
            {active ? "Active" : "Inactive"}
          </span>
        );
      },
    },
    { Header: "Service Interval KM", accessor: "Service_Interval_KM", cellAlign: "center" },
    { Header: "Service Interval Days", accessor: "Service_Interval_Days", cellAlign: "center" },
    
  ];

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="grid grid-cols-12 gap-4">
      {/* HEADER */}
      <div className="col-span-12">
        <div className="rounded-t border border-borderColor bg-header px-2 py-2 dark:border-borderColor-dark dark:bg-black md:px-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <h1 className="flex items-center gap-x-3 text-sm font-bold uppercase text-white dark:text-[#37a9dd] md:text-lg lg:text-xl">
              <Image
                src="/Payrollicon/Excel_Import.png"
                alt="Customer Vehicle List"
                width={25}
                height={25}
              />
              Customer Vehicles View
            </h1>

            <div className="flex flex-wrap gap-x-2 gap-y-2">
              <Button
                variant="outline"
                onClick={fetchData}
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

        {/* SEARCH FILTER */}
        <div className="mt-3 rounded-b border border-borderColor bg-white p-2 shadow dark:border-borderColor-dark dark:bg-black md:p-4">
          <div className="flex flex-wrap gap-3 justify-end">
            <div className="w-full md:w-1/3">
              <input
                type="text"
                className="h-9 w-full rounded-md border border-borderColor bg-white px-3 text-sm dark:border-borderColor-dark dark:bg-input dark:text-white"
                placeholder="Search (name, mobile, reg no, model)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="save" onClick={handleApplyClick} disabled={isLoading}>Apply</Button>
              <Button variant="print" onClick={handleResetFilters} disabled={isLoading}>Reset</Button>
            </div>
          </div>
        </div>
      </div>

      {/* BULK UPDATE SERVICE EXECUTIVE PANEL */}
      <div className="col-span-12 rounded border border-borderColor bg-white p-2 shadow dark:border-borderColor-dark dark:bg-black md:p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full md:w-1/3">
            <CustomSelectSearch
              title="Service Executive"
              name="serviceExecutive"
              placeholder="Select service executive"
              options={employeeOptions}
              selectedValue={selectedEmpCode}
              handleInputChange={(_name: string, value: string) =>
                setSelectedEmpCode(value)
              }
              isSelectAll={false}
              disabled={isLoading || isUpdating}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* ✅ Selected rows count dikhao */}
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
              Selected Vehicles:{" "}
              <strong className="text-blue-600">{selectedRows.length}</strong>
            </span>

            {/* ✅ Selected UTDs preview (max 5)
            {selectedRows.length > 0 && (
              <span className="text-xs text-gray-400">
                (UTDs:{" "}
                {selectedRows
                  .slice(0, 5)
                  .map((r) => r.rowData?.UTD)
                  .join(", ")}
                {selectedRows.length > 5
                  ? ` ... +${selectedRows.length - 5} more`
                  : ""}
                )
              </span>
            )} */}

            <Button
              variant="save"
              onClick={handleUpdateServiceExecutive}
              disabled={
                isUpdating ||
                isLoading ||
                selectedRows.length === 0 ||
                !selectedEmpCode
              }
            >
              {isUpdating ? "Updating..." : "Update Service Executive"}
            </Button>

            <Button
              variant="print"
              onClick={handleClearSelection}
              disabled={isUpdating}
            >
              Clear Selection
            </Button>
          </div>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="col-span-12 mt-0 rounded-b border border-borderColor bg-white p-2 shadow dark:border-borderColor-dark dark:bg-black md:p-4">
        <DataTable
          title="Customer Vehicles"
          columns={columns}
          selectValue="UTD"
          data={rows}
          height={450}
          filterPosition="FilterData"
          enableColumnFilters={true}
          ischeckbox={true}
          selectedRows={selectedRows}
          setSelectedRows={setSelectedRows}
          numericFilterColumns={[
            "UTD",
            "Last_Service_KM",
            "Avg_Daily_KM",
            "Current_KM",
            "Service_Interval_KM",
            "Service_Interval_Days",
          ]}
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
    </div>
  );
};

export default CustomerVehicleListPage;