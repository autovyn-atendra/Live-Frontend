"use client";

import { useEffect, useState } from "react";
import { UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import Ainput from "@/components/atoms/Input";
import CustomSelectSearch from "@/components/atoms/Select";
import DataTable from "@/components/Templates/servicetable";
import HashloaderComponent from "@/components/Templates/hashloader";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import {
  getMasters,
  getModelDetails,
  getDemoCarMasters,
  createAppointment,
  getAllAppointments,
  updateAppointment,
} from "@/services/demoCarAppointment";

// ============================================================
// Types
// ============================================================
interface FormState {
  UTD?: number | null;
  CustomerName: string;
  Mob_Number: string;
  Model_Name: string;
  Model_Group: string;
  Enq_No: string;
  Date: string;
  Time: string;
  status: string;
  Created_By: string;
  DSE: string;
}

interface FilterState {
  fromDate: string;
  toDate: string;
  status: string;
  search: string;
  page: number;
  pageSize: number;
}

const INITIAL_FORM: FormState = {
  UTD: null,
  CustomerName: "",
  Mob_Number: "",
  Model_Name: "",
  Model_Group: "",
  Enq_No: "",
  Date: "",
  Time: "",
  status: "0",
  Created_By: "admin",
  DSE: "",
};

const INITIAL_FILTERS: FilterState = {
  fromDate: "",
  toDate: "",
  status: "",
  search: "",
  page: 1,
  pageSize: 10,
};

const STATUS_OPTIONS = [
  { value: "0", label: "False" },
  { value: "1", label: "True" },
];

const formatDate = (date: string | null | undefined) => {
  if (!date) return "";

  const [year, month, day] = date.split("-");

  return `${day}-${month}-${year}`;
};

// ============================================================
// Main Component
// ============================================================
export default function DemoCarAppointmentPage() {
  const router = useRouter();

  // Form
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Table
  const [tableData, setTableData] = useState<any[]>([]);
  const [tableLoading, setTableLoading] = useState(false);

  // Filters - Individual states rakho
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  // Dropdown Options
  const [modelGroupOptions, setModelGroupOptions] = useState<any[]>([]);
  const [modelOptions, setModelOptions] = useState<any[]>([]);
  const [driverOptions, setDriverOptions] = useState<any[]>([]);

  // ============================================================
  // Mount
  // ============================================================
  useEffect(() => {
    loadMasters();
    loadDrivers();
    fetchTableData({
      fromDate: "",
      toDate: "",
      status: "",
      search: "",
      page: 1,
      pageSize: 10,
    });
  }, []);

  // Model_Group change → Models fetch
  useEffect(() => {
    if (form.Model_Group) {
      fetchModelDetails(parseInt(form.Model_Group));
    } else {
      setModelOptions([]);
      setForm((prev) => ({ ...prev, Model_Name: "" }));
    }
  }, [form.Model_Group]);

  // ============================================================
  // API Calls
  // ============================================================
  const loadMasters = async () => {
    try {
      const data = await getMasters();
      if (data?.success) {
        setModelGroupOptions(data.ModelGroup || []);
      }
    } catch (err) {
      console.error("Masters Error:", err);
    }
  };

  const loadDrivers = async () => {
    try {
      const data = await getDemoCarMasters("1");
      if (data?.Status || data?.success) {
        setDriverOptions(data.Driver || []);
      }
    } catch (err) {
      console.error("Driver Error:", err);
    }
  };

  const fetchModelDetails = async (groupId: number) => {
    try {
      const data = await getModelDetails(groupId);
      if (data?.success) {
        setModelOptions(data.Models || []);
      }
    } catch (err) {
      console.error("Model Details Error:", err);
    }
  };

  // ✅ Direct payload accept karta hai - No stale state
  const fetchTableData = async (payload: FilterState) => {
    try {
      setTableLoading(true);

      // ✅ Sirf non-empty values bhejo
      const body: any = {
        page: payload.page || 1,
        pageSize: payload.pageSize || 10,
      };

      if (payload.fromDate && payload.fromDate !== "") {
        body.fromDate = payload.fromDate;
      }
      if (payload.toDate && payload.toDate !== "") {
        body.toDate = payload.toDate;
      }
      if (payload.status && payload.status !== "") {
        body.status = payload.status;
      }
      if (payload.search && payload.search !== "") {
        body.search = payload.search;
      }

      console.log("Fetching with payload:", body); // Debug

      const data = await getAllAppointments(body);

      if (data?.success) {
        setTableData(data.data || []);
      }
    } catch (err) {
      console.error("Table Data Error:", err);
    } finally {
      setTableLoading(false);
    }
  };

  // ============================================================
  // Form Handler
  // ============================================================
  const handleInputChange = (name: string, value: any) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ============================================================
  // Save / Update
  // ============================================================
  const handleSave = async () => {
    if (!form.CustomerName.trim()) {
      return toast({
        title: "Error",
        description: "Customer Name required",
        variant: "destructive",
      });
    }
    if (!form.Mob_Number) {
      return toast({
        title: "Error",
        description: "Mobile Number required",
        variant: "destructive",
      });
    }
    if (form.Mob_Number.length !== 10) {
      return toast({
        title: "Error",
        description: "Mobile must be 10 digits",
        variant: "destructive",
      });
    }
    if (!form.Date) {
      return toast({
        title: "Error",
        description: "Date required",
        variant: "destructive",
      });
    }
    if (!form.Time) {
      return toast({
        title: "Error",
        description: "Time required",
        variant: "destructive",
      });
    }

    try {
      setLoading(true);

      if (isEditMode && form.UTD) {
        // UPDATE
        const res = await updateAppointment({
          UTD: form.UTD,
          CustomerName: form.CustomerName,
          Mob_Number: form.Mob_Number,
          Model_Name: form.Model_Name || null,
          Model_Group: form.Model_Group || null,
          Enq_No: form.Enq_No || null,
          Date: form.Date,
          Time: form.Time,
          DSE: form.DSE || null,
        });

        if (res?.success) {
          toast({ title: "Success", description: "Appointment updated!" });
          resetForm();
          fetchTableData(INITIAL_FILTERS);
        } else {
          toast({
            title: "Error",
            description: res?.message || "Update failed",
            variant: "destructive",
          });
        }

      } else {
        // CREATE
        const res = await createAppointment({
          CustomerName: form.CustomerName,
          Mob_Number: form.Mob_Number,
          Model_Name: form.Model_Name || null,
          Model_Group: form.Model_Group || null,
          Enq_No: form.Enq_No || null,
          Date: form.Date,
          Time: form.Time,
          Created_By: form.Created_By || "admin",
          DSE: form.DSE || null,
        });

        if (res?.success) {
          toast({ title: "Success", description: "Appointment created!" });
          resetForm();
          fetchTableData(INITIAL_FILTERS);
        } else {
          toast({
            title: "Error",
            description: res?.message || "Create failed",
            variant: "destructive",
          });
        }
      }
    } catch (err) {
      console.error("Save Error:", err);
      toast({
        title: "Error",
        description: "Server Error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // Reset Form
  // ============================================================
  const resetForm = () => {
    setForm(INITIAL_FORM);
    setIsEditMode(false);
    setModelOptions([]);
  };

  // ============================================================
  // Row Double Click → Edit
  // ============================================================
  const handleRowDoubleClick = (row: any) => {
    setForm({
      UTD: row.UTD,
      CustomerName: row.CustomerName || "",
      Mob_Number: row.Mob_Number || "",
      Model_Name: row.Model_Name?.toString() || "",
      Model_Group: row.Model_Group?.toString() || "",
      Enq_No: row.Enq_No || "",
      Date: row.Date || "",
      Time: row.Time || "",
      status: row.status?.toString() || "0",
      Created_By: row.Created_By || "admin",
      DSE: row.DSE?.toString() || "",
    });
    setIsEditMode(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ============================================================
  // ✅ Filter Apply - Direct values pass karo
  // ============================================================
  const handleFilterApply = () => {
    // ✅ Current input values se directly payload banao
    const payload: FilterState = {
      fromDate: fromDate,
      toDate: toDate,
      status: status,
      search: search,
      page: 1,
      pageSize: 10,
    };

    console.log("Filter Apply Payload:", payload); // Debug
    fetchTableData(payload);
  };

  // ============================================================
  // ✅ Filter Reset - Sab clear karo
  // ============================================================
  const handleFilterReset = () => {
    // ✅ Individual states reset karo
    setFromDate("");
    setToDate("");
    setStatus("");
    setSearch("");

    // ✅ Empty payload se fetch karo
    fetchTableData(INITIAL_FILTERS);
  };

  // ============================================================
  // Table Columns
  // ============================================================
  const columns = [
    {
      Header: "Customer Name",
      accessor: "CustomerName",
    },
    {
      Header: "Mobile",
      accessor: "Mob_Number",
    },
    {
      Header: "Enq No",
      accessor: "Enq_No",
    },
    {
      Header: "Date",
      accessor: "Date",
      cellAlign: "center",
      Cell: ({ value }: any) => formatDate(value),
    },
    {
      Header: "Time",
      accessor: "Time",
      cellAlign: "center",
    },
    {
      Header: "Status",
      accessor: "status",
      cellAlign: "center",
      Cell: ({ value }: any) => {
        const map: any = {
          0: { label: "Pending", color: "bg-red-100 text-red-700" },
          1: { label: "Getpass Genrated", color: "bg-green-100 text-green-700" },
        };
        const s = map[value] || {
          label: String(value),
          color: "bg-gray-100 text-gray-700",
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-bold ${s.color}`}>
            {s.label}
          </span>
        );
      },
    },
    {
      Header: "DSE",
      accessor: "DSE_Name",
      cellAlign: "center",
      Cell: ({ row }: any) => {
        const dse = row.original.DSE;
        const dseName = row.original.DSE_Name;

        if (!dse) return <span className="text-gray-400">-</span>;

        return (
          <span className="font-semibold">
            {dse} | {dseName || "-"}
          </span>
        );
      },
    },
    // {
    //   Header:   "Created By",
    //   accessor: "Created_By",
    // },
    {
      Header: "Action",
      accessor: "Action",
      cellAlign: "center",
      Cell: ({ row }: any) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            console.log("Apply Demo Car Appointment", row.original);
          }}
          className="px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-[#193A69] hover:bg-[#142f55] transition-colors"
        >
          Apply
        </button>
      ),
    },
  ];

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="p-4 grid gap-4">

      {/* HEADER */}
      <div className="bg-header flex items-center justify-between rounded-sm px-4 py-2">
        <div className="flex items-center gap-2 text-white font-bold">
          <UserCog className="h-5 w-5" />
          <h1 className="text-xl">Demo Car Appointment</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            loading={loading}
            disabled={loading}
          >
            {isEditMode ? "Update" : "Save"}
          </Button>

          {isEditMode && (
            <Button
              variant="print"
              size="sm"
              onClick={resetForm}
              disabled={loading}
            >
              Cancel
            </Button>
          )}

          <Button variant="print" size="sm" onClick={() => router.back()}>
            Back
          </Button>
        </div>
      </div>

      {/* FORM */}
      <div className="border rounded-md p-4">
        <h2 className="text-sm font-bold text-[#193A69] dark:text-white mb-3 uppercase">
          {isEditMode
            ? `Edit Appointment (UTD: ${form.UTD})`
            : "New Appointment"}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-2">

          <Ainput
            title="Customer Name"
            type="text"
            name="CustomerName"
            value={form.CustomerName}
            handleInputChange={handleInputChange}
            onInput={() => { }}
            redlabel="*"
            required
          />

          <Ainput
            title="Mobile Number"
            type="text"
            name="Mob_Number"
            value={form.Mob_Number}
            handleInputChange={(name, value) => {
              const onlyNums = value.replace(/\D/g, "").slice(0, 10);
              handleInputChange(name, onlyNums);
            }}
            onInput={() => { }}
            redlabel="*"
            required
          />

          <Ainput
            title="Enquiry No"
            type="text"
            name="Enq_No"
            value={form.Enq_No}
            handleInputChange={handleInputChange}
            onInput={() => { }}
            redlabel=""
          />

          <CustomSelectSearch
            title="Model Group"
            name="Model_Group"
            options={modelGroupOptions}
            selectedValue={form.Model_Group}
            handleInputChange={handleInputChange}
            placeholder="Select Model Group"
            redlabel=""
            uppertitle=""
            labelClass=""
          />

          <CustomSelectSearch
            title="Model Name"
            name="Model_Name"
            options={modelOptions}
            selectedValue={form.Model_Name}
            handleInputChange={handleInputChange}
            placeholder={
              form.Model_Group ? "Select Model" : "Select Group First"
            }
            redlabel=""
            uppertitle=""
            labelClass=""
          />

          <CustomSelectSearch
            title="DSE (Driver)"
            name="DSE"
            options={driverOptions}
            selectedValue={form.DSE}
            handleInputChange={handleInputChange}
            placeholder="Select DSE"
            redlabel=""
            uppertitle=""
            labelClass=""
          />

          <Ainput
            title="Appointment Date"
            type="date"
            name="Date"
            value={form.Date}
            handleInputChange={handleInputChange}
            onInput={() => { }}
            redlabel="*"
            required
          />

          <Ainput
            title="Appointment Time"
            type="time"
            name="Time"
            value={form.Time}
            handleInputChange={handleInputChange}
            onInput={() => { }}
            redlabel="*"
            required
          />

        </div>
      </div>

      {/* FILTERS */}
      <div className="border rounded-md p-4">
        <h2 className="text-sm font-bold text-[#193A69] dark:text-white mb-3 uppercase">
          Search & Filters
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-x-4 gap-y-2 items-end">

          {/* ✅ Individual states use karo */}
          <Ainput
            title="From Date"
            type="date"
            name="fromDate"
            value={fromDate}
            handleInputChange={(_, value) => setFromDate(value)}
            onInput={() => { }}
            redlabel=""
          />

          <Ainput
            title="To Date"
            type="date"
            name="toDate"
            value={toDate}
            handleInputChange={(_, value) => setToDate(value)}
            onInput={() => { }}
            redlabel=""
          />

          <CustomSelectSearch
            title="Status Filter"
            name="statusFilter"
            options={[
              { value: "", label: "All Status" },
              ...STATUS_OPTIONS,
            ]}
            selectedValue={status}
            handleInputChange={(_, value) => setStatus(value)}
            placeholder="All Status"
            redlabel=""
            uppertitle=""
            labelClass=""
          />

          <Ainput
            title="Search"
            type="text"
            name="search"
            value={search}
            handleInputChange={(_, value) => setSearch(value)}
            onInput={() => { }}
            redlabel=""
          />

          <div className="flex gap-2 mt-5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleFilterApply}
              className="flex-1"
            >
              Apply
            </Button>
            <Button
              variant="print"
              size="sm"
              onClick={handleFilterReset}
              className="flex-1"
            >
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <DataTable
        title={tableLoading ? "Loading..." : "Appointments List"}
        columns={columns}
        data={tableData}
        selectValue="UTD"
        height="350px"
        onRowClick={() => { }}
        onRowDoubleClick={handleRowDoubleClick}
        filterPosition="FilterData"
        enableColumnFilters={true}
      />

      <HashloaderComponent isLoading={loading || tableLoading} />
    </div>
  );
}