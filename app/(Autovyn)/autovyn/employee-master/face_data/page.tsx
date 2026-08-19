"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import DataTable from "@/components/Templates/servicetable";
import HashloaderComponent from "@/components/Templates/hashloader";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import axios from "axios";

// ============================================================
// CONFIG
// ============================================================
const BASE_URL = "http://localhost:5000";
const IMAGE_FETCH_URL = "https://erp.autovyn.com/backend/fetch?filePath=";

// ============================================================
// TYPES
// ============================================================
type FaceEmbeddingType = any[] | string | null;

type EmployeeRow = {
  SRNO: number;
  EMPCODE: string;
  EMPFIRSTNAME: string;
  EMPLASTNAME: string;
  FULL_NAME: string;
  MOBILENO: string | null;
  FACE_EMBEDDING: FaceEmbeddingType;
  DOC_PATH: string | null;
  HAS_DOC: boolean;
};

type SummaryType = {
  totalWithFace: number;
  totalWithDoc: number;
  totalWithoutDoc: number;
};

type ApiResponse = {
  success: boolean;
  message?: string;
  data: EmployeeRow[];
  total: number;
  summary: SummaryType;
};

// ============================================================
// ALERT
// ============================================================
const showAlert = (
  message: string,
  type: "success" | "error" | "warning" | "info"
) => {
  Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 4000,
    timerProgressBar: true,
  }).fire({ icon: type, title: message });
};

// ============================================================
// IMAGE URL BUILDER (exact working style)
// ============================================================
const buildImageUrl = (docPath: string | null | undefined): string | null => {
  if (!docPath) return null;

  const raw = String(docPath).trim();
  if (!raw) return null;

  const lower = raw.toLowerCase();
  if (lower === "null" || lower === "undefined") return null;

  const clean = raw.replace(/\\/g, "/").replace(/^\/+/, "");

  if (/^https?:\/\//i.test(clean)) return clean;

  return `${IMAGE_FETCH_URL}${clean}`;
};

// ============================================================
// HELPERS to read row payload from DataTable callbacks
// ============================================================
const isEventLike = (x: any) =>
  !!x &&
  typeof x === "object" &&
  // mouse / react event common props
  ("nativeEvent" in x || "target" in x || "currentTarget" in x);

const getEmpCodeFromUnknown = (x: any): string | null => {
  if (!x) return null;

  // if string/number is directly EMPCODE
  if (typeof x === "string" || typeof x === "number") return String(x);

  // common places in react-table row objects
  const code =
    x?.EMPCODE ??
    x?.original?.EMPCODE ??
    x?.row?.original?.EMPCODE ??
    x?.values?.EMPCODE ??
    x?.row?.values?.EMPCODE;

  if (code === undefined || code === null) return null;
  const s = String(code).trim();
  return s ? s : null;
};

const normalizeEmployee = (input: any): EmployeeRow | null => {
  if (!input || typeof input !== "object") return null;

  // React-table shapes
  const emp = input?.original ?? input?.row?.original ?? input;

  const empCode = getEmpCodeFromUnknown(emp);
  if (!empCode) return null;

  const fullName =
    emp?.FULL_NAME ||
    `${emp?.EMPFIRSTNAME ?? ""} ${emp?.EMPLASTNAME ?? ""}`.trim();

  return {
    SRNO: Number(emp?.SRNO ?? 0),
    EMPCODE: empCode,
    EMPFIRSTNAME: String(emp?.EMPFIRSTNAME ?? ""),
    EMPLASTNAME: String(emp?.EMPLASTNAME ?? ""),
    FULL_NAME: String(fullName ?? ""),
    MOBILENO: emp?.MOBILENO ?? null,
    FACE_EMBEDDING: emp?.FACE_EMBEDDING ?? null,
    DOC_PATH: emp?.DOC_PATH ?? null,
    HAS_DOC: Boolean(emp?.HAS_DOC),
  };
};

// ============================================================
// EMBEDDING FORMAT
// ============================================================
const formatEmbedding = (embedding: FaceEmbeddingType): string => {
  if (!embedding) return "—";
  if (Array.isArray(embedding)) return `[${embedding.length} items]`;
  if (typeof embedding === "string")
    return embedding.length > 30 ? embedding.slice(0, 30) + "..." : embedding;
  return "—";
};

// ============================================================
// EMP PHOTO
// ============================================================
type EmpPhotoProps = {
  docPath: string | null;
  fullName: string;
  size: "sm" | "lg";
};

const EmpPhoto: React.FC<EmpPhotoProps> = ({ docPath, fullName, size }) => {
  const [imgError, setImgError] = useState(false);
  const imgSrc = useMemo(() => buildImageUrl(docPath), [docPath]);

  useEffect(() => setImgError(false), [docPath]);

  const dimension = size === "lg" ? "h-28 w-28" : "h-10 w-10";
  const rounded = size === "lg" ? "rounded-xl" : "rounded-full";
  const border = size === "lg" ? "border-2 border-blue-200" : "border-2 border-blue-300";

  if (!imgSrc || imgError) {
    return (
      <div className={`flex ${dimension} items-center justify-center ${rounded} ${border} bg-gray-100 dark:bg-gray-800`}>
        <span className={size === "lg" ? "text-4xl" : "text-xl"}>👤</span>
      </div>
    );
  }

  return (
    <div className={`${dimension} overflow-hidden ${rounded} ${border} shadow flex-shrink-0 bg-gray-100 dark:bg-gray-800`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imgSrc}
        alt={fullName || "Employee"}
        className="h-full w-full object-cover"
        onError={() => setImgError(true)}
        // ✅ table scroll container me lazy issue hota hai -> eager
        loading={size === "sm" ? "eager" : "lazy"}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
      />
    </div>
  );
};

// ============================================================
// DETAIL MODAL
// ============================================================
type DetailModalProps = {
  employee: EmployeeRow | null;
  onClose: () => void;
};

const EmployeeDetailModal: React.FC<DetailModalProps> = ({ employee, onClose }) => {
  if (!employee) return null;

  const imgUrl = buildImageUrl(employee.DOC_PATH);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative mx-4 w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
          <h2 className="text-lg font-bold text-white">Employee Face Detail</h2>
          <button onClick={onClose} className="rounded-full p-1 text-white/80 hover:bg-white/20 hover:text-white">
            ✕
          </button>
        </div>

        <div className="p-6">
          <div className="flex gap-5">
            <div className="flex-shrink-0">
              <EmpPhoto docPath={employee.DOC_PATH} fullName={employee.FULL_NAME} size="lg" />
              <div className="mt-2 flex justify-center">
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  ✅ Face Registered
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Full Name</p>
                <p className="font-semibold text-gray-800 dark:text-white">{employee.FULL_NAME || "—"}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Emp Code</p>
                  <p className="font-mono font-semibold text-blue-600 dark:text-blue-400">{employee.EMPCODE}</p>
                </div>
                {/*  */}
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Mobile</p>
                  <p className="font-semibold text-gray-700 dark:text-gray-300">{employee.MOBILENO || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Photo</p>
                  <p className="font-semibold">
                    {imgUrl ? <span className="text-green-600">✅ Available</span> : <span className="text-red-500">❌ Missing</span>}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {imgUrl && (
            <div className="mt-4 rounded-lg bg-blue-50 px-3 py-2 dark:bg-blue-900/10">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-blue-500">Image URL</p>
              <a href={imgUrl} target="_blank" rel="noopener noreferrer" className="break-all font-mono text-xs text-blue-600 underline">
                {imgUrl}
              </a>
            </div>
          )}

          {/* <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Face Embedding</p>
            <div className="rounded-lg bg-gray-50 p-3 font-mono text-xs dark:bg-gray-800">
              {formatEmbedding(employee.FACE_EMBEDDING)}
            </div>
          </div> */}

          {/* {employee.DOC_PATH && (
            <div className="mt-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Photo Path (stored)</p>
              <p className="break-all rounded-lg bg-gray-50 px-3 py-2 font-mono text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                {employee.DOC_PATH}
              </p>
            </div>
          )} */}
        </div>

        <div className="flex justify-end gap-2 rounded-b-2xl border-t border-gray-100 px-6 py-4 dark:border-gray-700">
          <Button variant="print" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// SEARCH MODAL
// ============================================================
type SearchModalProps = {
  onClose: () => void;
  onSuccess: (emp: EmployeeRow) => void;
};

const SearchByCodeModal: React.FC<SearchModalProps> = ({ onClose, onSuccess }) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const user = useCurrentUser();

  const getJsonHeaders = useCallback(
    () => ({
      accept: "application/json",
      compcode: user?.Comp_Code,
      name: user?.name,
      "Content-Type": "application/json",
    }),
    [user?.Comp_Code, user?.name]
  );

  const handleSearch = async () => {
    if (!code.trim()) {
      setError("Please enter employee code");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const res = await axios.post(
        `${BASE_URL}/employee/face-data/by-code`,
        { EMPCODE: code.trim() },
        { headers: getJsonHeaders() }
      );
      const data = res.data;
      if (data.success && data.data) {
        const emp = normalizeEmployee(data.data);
        if (emp) {
          onSuccess(emp);
          onClose();
        } else {
          setError("Employee data invalid");
        }
      } else {
        setError(data.message || "Employee not found");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Error fetching");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
        <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
          <h2 className="text-lg font-bold text-white">Search by EmpCode</h2>
          <button onClick={onClose} className="rounded-full p-1 text-white/80 hover:bg-white/20">
            ✕
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Employee Code</label>
            <input
              type="text"
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              placeholder="e.g. 1027"
              value={code}
              onChange={(e) => { setCode(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              autoFocus
            />
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
          </div>

          <div className="flex gap-2">
            <Button variant="save" className="flex-1" onClick={handleSearch} disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </Button>
            <Button variant="print" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// MAIN PAGE
// ============================================================
const EmployeeFaceDataPage = () => {
  const user = useCurrentUser();

  const getJsonHeaders = useCallback(
    () => ({
      accept: "application/json",
      compcode: user?.Comp_Code,
      name: user?.name,
      "Content-Type": "application/json",
    }),
    [user?.Comp_Code, user?.name]
  );

  const getAllEmployeeFaceData = useCallback(async () => {
    const res = await axios.post(`${BASE_URL}/employee/face-data/all`, {}, { headers: getJsonHeaders() });
    return res.data;
  }, [getJsonHeaders]);

  const [rows, setRows] = useState<EmployeeRow[]>([]);
  const [filtered, setFiltered] = useState<EmployeeRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [summary, setSummary] = useState<SummaryType>({
    totalWithFace: 0,
    totalWithDoc: 0,
    totalWithoutDoc: 0,
  });

  const [search, setSearch] = useState("");
  const [detailEmp, setDetailEmp] = useState<EmployeeRow | null>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      setIsLoading(true);
      const res: ApiResponse = await getAllEmployeeFaceData();
      if (!res?.success) {
        showAlert("Failed to fetch employee face data", "error");
        return;
      }

      const data = Array.isArray(res.data) ? res.data : [];
      setRows(data);
      setFiltered(data);

      setSummary(
        res.summary || {
          totalWithFace: data.length,
          totalWithDoc: data.filter((e) => !!buildImageUrl(e.DOC_PATH)).length,
          totalWithoutDoc: data.filter((e) => !buildImageUrl(e.DOC_PATH)).length,
        }
      );
    } catch (err: any) {
      showAlert(err?.response?.data?.message || err?.message || "Error fetching data", "error");
    } finally {
      setIsLoading(false);
    }
  }, [getAllEmployeeFaceData]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(rows);
      return;
    }
    const q = search.trim().toLowerCase();
    setFiltered(
      rows.filter((e) =>
        (e.EMPCODE || "").toLowerCase().includes(q) ||
        (e.FULL_NAME || "").toLowerCase().includes(q) ||
        (e.EMPFIRSTNAME || "").toLowerCase().includes(q) ||
        (e.EMPLASTNAME || "").toLowerCase().includes(q) ||
        (e.MOBILENO || "").toLowerCase().includes(q)
      )
    );
  }, [search, rows]);

  // ✅ SUPER ROBUST row click handler (handles event,row or row,event or empcode)
  const handleRowClick = useCallback(
    (...args: any[]) => {
      // pick the best candidate from args (ignore events)
      const candidate =
        args.find((a) => a && !isEventLike(a) && (getEmpCodeFromUnknown(a) || getEmpCodeFromUnknown(a?.original) || getEmpCodeFromUnknown(a?.row))) ||
        args.find((a) => a && !isEventLike(a)) ||
        null;

      // try normalize directly
      let emp = normalizeEmployee(candidate);

      // if still not found, try by empcode and find from rows
      if (!emp) {
        const code = getEmpCodeFromUnknown(candidate) || getEmpCodeFromUnknown(args[0]) || getEmpCodeFromUnknown(args[1]);
        if (code) {
          const found = rows.find((r) => String(r.EMPCODE) === String(code));
          if (found) emp = found;
        }
      }

      if (!emp) {
        showAlert("Could not read employee data", "error");
        // uncomment for debugging:
        // console.log("RowClick args:", args);
        return;
      }

      setDetailEmp(emp);
    },
    [rows]
  );

  const columns = useMemo(
    () => [
      {
        Header: "#",
        id: "rowIndex",
        cellAlign: "center",
        Cell: ({ row }: any) => row.index + 1,
      },
      //   {
      //     Header: "Photo",
      //     accessor: "DOC_PATH",
      //     cellAlign: "center",
      //     // ✅ Use row.original for fullName, value for DOC_PATH
      //     Cell: ({ value, row }: any) => (
      //       <div className="flex justify-center">
      //         <EmpPhoto
      //           docPath={value ?? null}
      //           fullName={row?.original?.FULL_NAME ?? ""}
      //           size="sm"
      //         />
      //       </div>
      //     ),
      //   },
      {
        Header: "Emp Code",
        accessor: "EMPCODE",
        Cell: ({ value }: any) => (
          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
            {value || "—"}
          </span>
        ),
      },
      { Header: "First Name", accessor: "EMPFIRSTNAME", Cell: ({ value }: any) => value || "—" },
      { Header: "Last Name", accessor: "EMPLASTNAME", Cell: ({ value }: any) => value || "—" },
      { Header: "Mobile", accessor: "MOBILENO", Cell: ({ value }: any) => value || "—" },

      {
        Header: "Photo Status",
        accessor: "HAS_DOC",
        cellAlign: "center",
        Cell: ({ row }: any) => {
          const ok = !!buildImageUrl(row?.original?.DOC_PATH ?? null);
          return ok ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
              ✅ Yes
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-600 dark:bg-red-900/30 dark:text-red-400">
              ❌ No
            </span>
          );
        },
      },
      {
        Header: "Action",
        id: "action",
        cellAlign: "center",
        Cell: ({ row }: any) => (
          <Button
            variant="outline"
            className="h-7 px-3 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              handleRowClick(row); // ✅ pass row object
            }}
          >
            View
          </Button>
        ),
      },
    ],
    [handleRowClick]
  );

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12">
        <div className="rounded-t border border-borderColor bg-header px-2 py-2 dark:border-borderColor-dark dark:bg-black md:px-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <h1 className="flex items-center gap-x-3 text-sm font-bold uppercase text-white dark:text-[#37a9dd] md:text-lg lg:text-xl">
              <span className="text-2xl">🧠</span>
              Employee Face Data
            </h1>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={fetchAll} disabled={isLoading}>Refresh</Button>
              <Button variant="outline" onClick={() => setShowSearchModal(true)} disabled={isLoading}>
                Search EmpCode
              </Button>
              <Button variant="print" onClick={() => window.history.back()} disabled={isLoading}>
                Back
              </Button>
            </div>
          </div>
        </div>

        <div className="border border-t-0 border-borderColor bg-white p-3 dark:border-borderColor-dark dark:bg-black md:p-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/30 dark:bg-blue-900/10">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Employees</p>
              <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.totalWithFace}</p>
              <p className="text-xs text-gray-400">with face data</p>
            </div>

            <div className="rounded-xl border border-green-100 bg-green-50 p-4 dark:border-green-900/30 dark:bg-green-900/10">
              <p className="text-xs text-gray-500 dark:text-gray-400">With Photo</p>
              <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">{summary.totalWithDoc}</p>
              <p className="text-xs text-gray-400">photo available</p>
            </div>

            <div className="rounded-xl border border-red-100 bg-red-50 p-4 dark:border-red-900/30 dark:bg-red-900/10">
              <p className="text-xs text-gray-500 dark:text-gray-400">Without Photo</p>
              <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">{summary.totalWithoutDoc}</p>
              <p className="text-xs text-gray-400">photo missing</p>
            </div>

            <div className="rounded-xl border border-purple-100 bg-purple-50 p-4 dark:border-purple-900/30 dark:bg-purple-900/10">
              <p className="text-xs text-gray-500 dark:text-gray-400">Showing</p>
              <p className="mt-1 text-2xl font-bold text-purple-600 dark:text-purple-400">{filtered.length}</p>
              <p className="text-xs text-gray-400">{search ? "filtered" : "all records"}</p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-end gap-3">
            <div className="w-full md:w-80">
              <input
                type="text"
                className="h-9 w-full rounded-md border border-borderColor bg-white px-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-borderColor-dark dark:bg-input dark:text-white"
                placeholder="Search by name, code, mobile..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                disabled={isLoading}
              />
            </div>
            {search && (
              <Button variant="print" className="h-9" onClick={() => setSearch("")}>
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="col-span-12 rounded-b border border-borderColor bg-white p-2 shadow dark:border-borderColor-dark dark:bg-black md:p-4">
        <DataTable
          title="Employee Face Data"
          columns={columns}
          selectValue="EMPCODE"
          data={filtered}
          height={450}
          filterPosition="FilterData"
          enableColumnFilters={true}
          numericFilterColumns={["SRNO"]}
          // ✅ IMPORTANT: accept any args from DataTable
          onRowClick={(...args: any[]) => handleRowClick(...args)}
        />
      </div>

      {detailEmp && (
        <EmployeeDetailModal employee={detailEmp} onClose={() => setDetailEmp(null)} />
      )}

      {showSearchModal && (
        <SearchByCodeModal
          onClose={() => setShowSearchModal(false)}
          onSuccess={(emp) => {
            setDetailEmp(emp);
            showAlert(`Found: ${emp.FULL_NAME} (${emp.EMPCODE})`, "success");
          }}
        />
      )}

      <HashloaderComponent isLoading={isLoading} />
    </div>
  );
};

export default EmployeeFaceDataPage;