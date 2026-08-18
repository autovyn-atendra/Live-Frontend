"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import Swal from "sweetalert2";

import { Button } from "@/components/ui/button";
import DataTable from "@/components/Templates/ServiceTable";
import HashloaderComponent from "@/components/Templates/hashloader";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_URL



export type ImportCustomerVehicleParams = {
  file: File;
  user?: string | number;
  Loc_Code?: string;
  compcode?: string;
  name?: string;
};



// ============================================================
// TYPES
// ============================================================

type ImportRow = {
  UTD?: number | string;
  Excel_Row?: number | string;

  Loc_Code?: string;
  Veh_Reg_No?: string;
  Cust_Name?: string;
  Cust_Mob?: string;
  Model_Name?: string;

  Last_Service_Date?: string;
  Last_Service_KM?: number | string;
  Avg_Daily_KM?: number | string;
  Current_KM?: number | string;

  Service_Interval_KM?: number | string;
  Service_Interval_Days?: number | string;

  Import_Status?: string; // "Imported" | "Updated" | "Not Imported"
  rejectionReasons?: string;
  Rejection_Reason?: string;
  srv_exec_name?: string;
  srv_exec_Emp_Code?: string;
  srv_exec_mobile?: string;

};

type ImportResponse = {
  success?: boolean;
  Type?: string;

  Inserted?: number;
  Updated?: number;
  NonInserted?: number;
  Total?: number;

  Message?: string;
  message?: string;

  InsertedData?: ImportRow[];
  UpdatedData?: ImportRow[];
  CorrectData?: ImportRow[]; // fallback support (older payloads)
  ErroredData?: ImportRow[];

  File?: string;
  FileName?: string;
};

// ============================================================
// ALERT
// ============================================================

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
// PAGE
// ============================================================

const CustomerVehicleImportPage = () => {
  const user = useCurrentUser();
  const getMultipartHeaders = (compcode?: string, name?: string) => ({
    accept: "application/json",
    compcode: user?.Comp_Code,
    name: user?.name,
  });

  const importCustomerVehicles = async ({
    file,
    user,
    Loc_Code,
    compcode,
    name,
  }: ImportCustomerVehicleParams) => {
    const formData = new FormData();

    formData.append("excel", file, file.name);

    if (user !== undefined && user !== null && user !== "") {
      formData.append("user", String(user));
    }

    if (Loc_Code) {
      formData.append("Loc_Code", String(Loc_Code));
    }

    const response = await axios.post(
      `${BASE_URL}/Crm/customer-vehicle/import`,
      formData,
      {
        headers: getMultipartHeaders(compcode, name),
      }
    );

    return response.data;
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [isLoadingOnPage, setIsLoadingOnPage] = useState(false);

  const [tableData, setTableData] = useState<ImportRow[]>([]);
  const [erroredData, setErroredData] = useState<ImportRow[]>([]);
  const [correctData, setCorrectData] = useState<ImportRow[]>([]);

  const [resultFile, setResultFile] = useState("");
  const [resultFileName, setResultFileName] = useState(
    "customer_vehicle_import_result.xlsx"
  );

  // ============================================================
  // SAMPLE DOWNLOAD
  // ============================================================

  // creates an Excel with 5 valid sample rows and downloads it
  const handleSampleDownload = async () => {
    try {
      const mod = await import("xlsx");
      const XLSX = (mod as any).default || mod;

      // ✅ 3 new columns added
      const headers = [
        "Vehicle Registration No",
        "Customer Name",
        "Customer Mobile",
        "Model Name",
        "Last Service Date",
        "Last Service KM",
        "Average Daily KM",
        "Current KM",
        "Service Interval KM",
        "Service Interval Days",
        "Service Executive Name",      // ✅ NEW
        "Service Executive Emp Code",  // ✅ NEW
        "Service Executive Mobile",    // ✅ NEW
      ];

      // ✅ 3 new columns added in sample rows
      const rows = [
        {
          "Vehicle Registration No": "RJ14AB1212",
          "Customer Name": "Rahul Sharma",
          "Customer Mobile": "9876543211",
          "Model Name": "Baleno",
          "Last Service Date": "2026-05-14",
          "Last Service KM": 20000,
          "Average Daily KM": 50,
          "Current KM": 21500,
          "Service Interval KM": 10000,
          "Service Interval Days": 180,
          "Service Executive Name": "Amit Kumar",      // ✅ NEW
          "Service Executive Emp Code": "EMP001",      // ✅ NEW
          "Service Executive Mobile": "9988776655",    // ✅ NEW
        },
        {
          "Vehicle Registration No": "MH12CD3456",
          "Customer Name": "Priya Singh",
          "Customer Mobile": "9811112233",
          "Model Name": "Swift",
          "Last Service Date": "2026-04-28",
          "Last Service KM": 12000,
          "Average Daily KM": 30,
          "Current KM": 12800,
          "Service Interval KM": 10000,
          "Service Interval Days": 180,
          "Service Executive Name": "Rohit Verma",    // ✅ NEW
          "Service Executive Emp Code": "EMP002",     // ✅ NEW
          "Service Executive Mobile": "9977665544",   // ✅ NEW
        },
        {
          "Vehicle Registration No": "DL3CAB7890",
          "Customer Name": "Aman Verma",
          "Customer Mobile": "9898765432",
          "Model Name": "Creta",
          "Last Service Date": "2026-03-10",
          "Last Service KM": 18000,
          "Average Daily KM": 45,
          "Current KM": 19500,
          "Service Interval KM": 15000,
          "Service Interval Days": 365,
          "Service Executive Name": "",               // ✅ Empty - mobile + name required
          "Service Executive Emp Code": "EMP003",    // ✅ Emp Code hai to name/mobile optional
          "Service Executive Mobile": "",             // ✅ NEW
        },
        {
          "Vehicle Registration No": "GJ01EF2345",
          "Customer Name": "Neha Gupta",
          "Customer Mobile": "9823456789",
          "Model Name": "i20",
          "Last Service Date": "2026-06-02",
          "Last Service KM": 15000,
          "Average Daily KM": 25,
          "Current KM": 15625,
          "Service Interval KM": 10000,
          "Service Interval Days": 365,
          "Service Executive Name": "Suresh Yadav",  // ✅ NEW
          "Service Executive Emp Code": "",           // ✅ Emp Code nahi - name+mobile required
          "Service Executive Mobile": "9845678901",  // ✅ NEW
        },
        {
          "Vehicle Registration No": "KA05GH6789",
          "Customer Name": "Vikram Rao",
          "Customer Mobile": "9900123456",
          "Model Name": "City",
          "Last Service Date": "2026-05-01",
          "Last Service KM": 22000,
          "Average Daily KM": 40,
          "Current KM": 23000,
          "Service Interval KM": 10000,
          "Service Interval Days": 180,
          "Service Executive Name": "Deepak Joshi",  // ✅ NEW
          "Service Executive Emp Code": "EMP005",    // ✅ NEW
          "Service Executive Mobile": "9812345678",  // ✅ NEW
        },
      ];

      const ws = XLSX.utils.json_to_sheet(rows, {
        header: headers,
        skipHeader: false,
      });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Template");

      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([wbout], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "customer_vehicle_import_template_5.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Sample download error:", err);
      showSideAlert("Unable to download sample", "error");
    }
  };

  // ============================================================
  // RESULT FILE DOWNLOAD
  // ============================================================

  const handleResultDownload = () => {
    if (!resultFile) {
      showSideAlert("No import result file available", "warning");
      return;
    }

    try {
      const binaryString = window.atob(resultFile);
      const bytes = new Uint8Array(binaryString.length);

      for (let index = 0; index < binaryString.length; index += 1) {
        bytes[index] = binaryString.charCodeAt(index);
      }

      const blob = new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = resultFileName || "customer_vehicle_import_result.xlsx";

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Result file download error:", error);
      showSideAlert("Unable to download result file", "error");
    }
  };

  // ============================================================
  // FILE CHANGE
  // ============================================================

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      setExcelFile(null);
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (extension === "xlsx" || extension === "xls") {
      setExcelFile(file);
      return;
    }

    setExcelFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    showSideAlert("Please select a valid Excel file", "error");
  };

  // ============================================================
  // NORMALIZE IMPORTED ROW (success rows)
  // ============================================================

  const mapCorrectRow = (item: any, index: number): ImportRow => {
    return {
      ...item,

      UTD: item?.UTD ?? "",
      Excel_Row: item?.Excel_Row ?? item?.["Excel Row"] ?? index + 2,

      Loc_Code: item?.Loc_Code ?? item?.["Loc Code"] ?? "",

      Veh_Reg_No: item?.Veh_Reg_No ?? item?.["Vehicle Registration No"] ?? "",

      Cust_Name: item?.Cust_Name ?? item?.["Customer Name"] ?? "",
      Cust_Mob: item?.Cust_Mob ?? item?.["Customer Mobile"] ?? "",
      Model_Name: item?.Model_Name ?? item?.["Model Name"] ?? "",

      Last_Service_Date:
        item?.Last_Service_Date ?? item?.["Last Service Date"] ?? "",

      Last_Service_KM:
        item?.Last_Service_KM ?? item?.["Last Service KM"] ?? "",

      Avg_Daily_KM: item?.Avg_Daily_KM ?? item?.["Average Daily KM"] ?? "",

      Current_KM: item?.Current_KM ?? item?.["Current KM"] ?? "",

      Service_Interval_KM:
        item?.Service_Interval_KM ?? item?.["Service Interval KM"] ?? "",

      Service_Interval_Days:
        item?.Service_Interval_Days ?? item?.["Service Interval Days"] ?? "",

      // Keep server-provided status (Imported/Updated). Default to Imported.
      Import_Status: item?.Import_Status ?? item?.Status ?? "Imported",
      srv_exec_name: item?.srv_exec_name ?? item?.["Service Executive Name"] ?? "",
      srv_exec_Emp_Code: item?.srv_exec_Emp_Code ?? item?.["Service Executive Emp Code"] ?? "",
      srv_exec_mobile: item?.srv_exec_mobile ?? item?.["Service Executive Mobile"] ?? "",

      rejectionReasons: "",
    };
  };

  // ============================================================
  // NORMALIZE ERROR ROW
  // ============================================================

  const mapErrorRow = (item: any, index: number): ImportRow => {
    return {
      ...item,

      UTD: item?.UTD ?? "",

      Excel_Row: item?.Excel_Row ?? item?.["Excel Row"] ?? index + 2,

      Loc_Code: item?.Loc_Code ?? item?.["Loc Code"] ?? "",

      Veh_Reg_No: item?.Veh_Reg_No ?? item?.["Vehicle Registration No"] ?? "",

      Cust_Name: item?.Cust_Name ?? item?.["Customer Name"] ?? "",
      Cust_Mob: item?.Cust_Mob ?? item?.["Customer Mobile"] ?? "",
      Model_Name: item?.Model_Name ?? item?.["Model Name"] ?? "",

      Last_Service_Date:
        item?.Last_Service_Date ?? item?.["Last Service Date"] ?? "",

      Last_Service_KM:
        item?.Last_Service_KM ?? item?.["Last Service KM"] ?? "",

      Avg_Daily_KM: item?.Avg_Daily_KM ?? item?.["Average Daily KM"] ?? "",

      Current_KM: item?.Current_KM ?? item?.["Current KM"] ?? "",

      Service_Interval_KM:
        item?.Service_Interval_KM ?? item?.["Service Interval KM"] ?? "",

      Service_Interval_Days:
        item?.Service_Interval_Days ?? item?.["Service Interval Days"] ?? "",

      Import_Status: "Not Imported",
      srv_exec_name: item?.srv_exec_name ?? item?.["Service Executive Name"] ?? "",
      srv_exec_Emp_Code: item?.srv_exec_Emp_Code ?? item?.["Service Executive Emp Code"] ?? "",
      srv_exec_mobile: item?.srv_exec_mobile ?? item?.["Service Executive Mobile"] ?? "",

      rejectionReasons:
        item?.rejectionReasons ??
        item?.Rejection_Reason ??
        item?.["Rejection Reason"] ??
        "",
    };
  };

  // ============================================================
  // IMPORT
  // ============================================================

  // Helper: normalize branch/Loc_Code to array of string codes
  const toLocCodeArray = (val: unknown): string[] => {
    if (val == null) return [];
    if (Array.isArray(val)) {
      return val
        .flat()
        .map((v) => String(v).trim())
        .filter(Boolean);
    }
    const s = String(val).trim();
    if (!s) return [];
    // supports "1,7,8" or "1 7 8" etc.
    return s.split(/[,\s]+/).map((x) => x.trim()).filter(Boolean);
  };

  const handleButtonClick = async () => {
    if (!excelFile) {
      showSideAlert("Please select an Excel file", "warning");
      return;
    }

    try {
      setTableData([]);
      setCorrectData([]);
      setErroredData([]);
      setResultFile("");

      // --------------------------------------------
      // BRANCH / LOC_CODE VALIDATION (before import)
      // --------------------------------------------
      const rawLoc = user?.Loc_Code ?? user?.branch ?? "";
      const selectedLocCodes = toLocCodeArray(rawLoc);
      console.log("selectedLocCodes", selectedLocCodes);

      // must be exactly one branch
      if (selectedLocCodes.length !== 1) {
        showSideAlert("Please select only one branch", "error");
        return;
      }

      const locCode = selectedLocCodes[0];

      setIsLoadingOnPage(true);

      const response: ImportResponse = await importCustomerVehicles({
        file: excelFile,
        user: user?.name || user?.UTD || "admin",
        Loc_Code: locCode, // send the validated single code
        // compcode: user?.compcode || user?.CompCode, // optionally send from user
        // name: user?.name,
      });

      console.log("response", response);

      if (response?.success === false) {
        showSideAlert(
          response?.Message || response?.message || "Import failed",
          "error"
        );
        return;
      }

      // Merge Inserted + Updated (fallback to CorrectData if provided)
      const successRaw: any[] = [
        ...(Array.isArray((response as any)?.InsertedData)
          ? (response as any).InsertedData
          : []),
        ...(Array.isArray((response as any)?.UpdatedData)
          ? (response as any).UpdatedData
          : []),
        ...(Array.isArray(response?.CorrectData) ? response!.CorrectData! : []),
      ];

      const correctMapped = successRaw.map(mapCorrectRow);

      const errorMapped = Array.isArray(response?.ErroredData)
        ? response!.ErroredData!.map(mapErrorRow)
        : [];

      setCorrectData(correctMapped);
      setErroredData(errorMapped);

      // By default, show non-imported if any, else show imported
      if (errorMapped.length > 0) {
        setTableData(errorMapped);
      } else {
        setTableData(correctMapped);
      }

      setResultFile(response?.File || "");
      setResultFileName(
        response?.FileName || "customer_vehicle_import_result.xlsx"
      );

      const insertedCount =
        typeof response?.Inserted === "number"
          ? response!.Inserted!
          : correctMapped.length;

      const rejectedCount =
        typeof response?.NonInserted === "number"
          ? response!.NonInserted!
          : errorMapped.length;

      const message =
        response?.Message ||
        `${insertedCount} records imported, ${rejectedCount} records rejected`;

      showSideAlert(message, insertedCount > 0 ? "success" : "warning");
    } catch (error: any) {
      console.error("Customer vehicle import error:", error);

      showSideAlert(
        error?.response?.data?.Message ||
        error?.response?.data?.message ||
        error?.message ||
        "Error! Invalid Excel format",
        "error"
      );
    } finally {
      setIsLoadingOnPage(false);
    }
  };

  // ============================================================
  // FILTER BUTTONS
  // ============================================================

  const handleErrorDataClick = () => {
    setTableData(erroredData);
  };

  const handleCorrectDataClick = () => {
    setTableData(correctData);
  };

  const handleAllDataClick = () => {
    setTableData([...correctData, ...erroredData]);
  };

  // ============================================================
  // RESET
  // ============================================================

  const handleReset = () => {
    setExcelFile(null);
    setTableData([]);
    setCorrectData([]);
    setErroredData([]);
    setResultFile("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "";
    const [year, month, day] = date.split("-");
    if (!year || !month || !day) return String(date);
    return `${day}-${month}-${year}`;
  };

  // ============================================================
  // TABLE COLUMNS
  // ============================================================

  const columns = [
    {
      Header: "Status",
      accessor: "Import_Status",
      Cell: ({ value }: any) => {
        const imported = value === "Imported" || value === "Updated";
        return (
          <span
            className={`rounded-full px-2 py-1 text-xs font-bold ${imported
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
              }`}
          >
            {value || "-"}
          </span>
        );
      },
    },
    {
      Header: "Rejection Reason",
      accessor: "rejectionReasons",
      Cell: ({ value }: any) => (
        <span className="font-semibold text-exit">{value || "-"}</span>
      ),
    },
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
      Header: "Last Service Date",
      accessor: "Last_Service_Date",
      cellAlign: "center",
      Cell: ({ value }: any) => formatDate(value),
    },
    {
      Header: "Last Service KM",
      accessor: "Last_Service_KM",
      cellAlign: "right",
    },
    {
      Header: "Average Daily KM",
      accessor: "Avg_Daily_KM",
      cellAlign: "right",
    },
    {
      Header: "Current KM",
      accessor: "Current_KM",
      cellAlign: "right",
    },
    {
      Header: "Service Interval KM",
      accessor: "Service_Interval_KM",
      cellAlign: "right",
    },
    {
      Header: "Service Interval Days",
      accessor: "Service_Interval_Days",
      cellAlign: "right",
    },
    // ✅ 3 NEW COLUMNS
    {
      Header: "Service Executive Name",
      accessor: "srv_exec_name",
    },
    {
      Header: "Service Executive Emp Code",
      accessor: "srv_exec_Emp_Code",
    },
    {
      Header: "Service Executive Mobile",
      accessor: "srv_exec_mobile",
    },
  ];

  // ============================================================
  // RENDER
  // ============================================================

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
                  alt="Service Reminder Import"
                  width={25}
                  height={25}
                />
                Service Data Import
              </h1>
            </div>

            <div className="flex flex-wrap justify-between gap-x-2 gap-y-2">
              <Button
                variant="save"
                onClick={handleSampleDownload}
                disabled={isLoadingOnPage}
              >
                Download Sample
              </Button>

              {resultFile && (
                <Button
                  variant="outline"
                  onClick={handleResultDownload}
                  disabled={isLoadingOnPage}
                >
                  Download Result
                </Button>
              )}

              <Button
                variant="print"
                onClick={() => window.history.back()}
                disabled={isLoadingOnPage}
              >
                Back
              </Button>
            </div>
          </div>
        </div>

        {/* FILE IMPORT SECTION */}
        <div className="mt-3 rounded-b border border-borderColor bg-white p-2 shadow dark:border-borderColor-dark dark:bg-black md:p-4">
          <div className="flex flex-col gap-4 md:flex-row">
            <input
              type="file"
              className="flex h-9 w-full rounded-md border border-borderColor bg-white px-3 py-1 pt-1.5 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-borderColor-dark dark:bg-input dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300 md:w-1/2 lg:w-1/4"
              accept=".xlsx,.xls"
              onChange={handleChange}
              ref={fileInputRef}
              disabled={isLoadingOnPage}
            />

            <Button
              variant="save"
              onClick={handleButtonClick}
              loading={isLoadingOnPage}
              disabled={isLoadingOnPage || !excelFile}
            >
              Import
            </Button>

            <Button variant="print" onClick={handleReset} disabled={isLoadingOnPage}>
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* COUNTS + FILTER BUTTONS */}
      <div className="col-span-12">
        <div className="mt-0 flex flex-wrap items-center gap-4 rounded-b border border-borderColor bg-white p-2  shadow dark:border-borderColor-dark dark:bg-black md:p-4">
          <div className="text-green">Imported Rows  {correctData.length}</div>

          <div className="text-exit">Non-Imported Rows  {erroredData.length}</div>

          <div className="text-[#193A69] dark:text-white">
            Total Rows  {correctData.length + erroredData.length}
          </div>

          <Button variant="outline" className="ml-0 md:ml-4" onClick={handleAllDataClick}>
            All Data
          </Button>

          <Button variant="outline" onClick={handleCorrectDataClick}>
            Imported Data
          </Button>

          <Button variant="outline" onClick={handleErrorDataClick}>
            Non-Imported Data
          </Button>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="col-span-12 mt-0 rounded-b border border-borderColor bg-white p-2 shadow dark:border-borderColor-dark dark:bg-black md:p-4">
        <DataTable
          title="Customer Vehicle Import Result"
          onRowDoubleClick={() => { }}
          columns={columns}
          selectValue="UTD"
          data={tableData}
          height="350px"
          filterPosition="FilterData"
          enableColumnFilters={true}
          numericFilterColumns={[
            "Excel_Row",
            "UTD",
            "Last_Service_KM",
            "Avg_Daily_KM",
            "Current_KM",
            "Service_Interval_KM",
            "Service_Interval_Days",
          ]}
        />
      </div>

      <HashloaderComponent isLoading={isLoadingOnPage} />
    </div>
  );
};

export default CustomerVehicleImportPage;