"use client";
import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  useTable,
  useGlobalFilter,
  usePagination,
  useSortBy,
} from "react-table";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSort,
  faSortUp,
  faSortDown,
  faFilter,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { CgSpinner } from "react-icons/cg";
import SmallTitle from "@/components/atoms/smallTitle";
import { Button } from "@/components/ui/button";
import { Checkbox } from "antd";
import useExcelDownload from "@/app/hooks/excel-download";
import Fselect from "../atoms/Fselect";

// ============================================================
// TYPES
// ============================================================

interface ServerPagination {
  currentPage: number; // 1-based
  pageSize: number;
  totalPages: number;
  totalRecords?: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

interface DataTableProps {
  columns: any;
  data: any[];
  onRowDoubleClick?: (row: any) => void;
  title?: string;
  height?: number | string;
  size?: string;
  headerClassName?: string;
  labelClassName?: string;
  onRowCountChange?: (count: number) => void;

  enableColumnFilters?: boolean;
  filterPosition?: "header" | "FilterData";

  selectValue: string;
  onRowClick?: (rowId: any, rowData: any) => void;
  setSelectedRows?: (rows: { id: any; rowData: any }[]) => void;
  selectedRows?: { id: any; rowData: any }[];
  check?: any;
  onlyOnecheck?: boolean;
  ischeckbox?: boolean;
  handleapprove?: (selected: { id: any; rowData: any }[]) => void;
  handlereject?: (selected: { id: any; rowData: any }[]) => void;
  texta?: string;
  textr?: string;
  showRejectButton?: boolean;
  columnsDownload?: any;
  numericFilterColumns?: string[];

  // NEW: server-side pagination support
  serverMode?: boolean;
  serverPagination?: ServerPagination;
  onServerPageChange?: (page: number) => void; // 1-based
  onServerPageSizeChange?: (size: number) => void;
}

// ============================================================
// HELPERS
// ============================================================

const MAX_CONTENT_LENGTH = 50;
const truncateText = (text: string) => {
  return text?.length > MAX_CONTENT_LENGTH
    ? text.substring(0, MAX_CONTENT_LENGTH) + "..."
    : text;
};

const globalFilterFunction = (rows: any[], columnIds: string[], filterValue: string) => {
  const fv = String(filterValue || "").toLowerCase();
  if (!fv) return rows;
  return rows.filter((row) =>
    columnIds.some((id) => {
      const value = row.values[id];
      return String(value ?? "").toLowerCase().includes(fv);
    })
  );
};

// ============================================================
// COMPONENT
// ============================================================

const DataTable = ({
  columns,
  data = [],
  onRowDoubleClick,
  title,
  height,
  size,
  headerClassName,
  labelClassName,
  onRowCountChange,
  enableColumnFilters = true,
  filterPosition = "header",
  selectValue,
  onRowClick,
  setSelectedRows,
  selectedRows = [],
  check,
  onlyOnecheck = false,
  ischeckbox = false,
  handleapprove,
  handlereject,
  texta,
  textr,
  showRejectButton,
  columnsDownload,
  numericFilterColumns = [],
  // server-side pagination props
  serverMode = false,
  serverPagination,
  onServerPageChange,
  onServerPageSizeChange,
}: DataTableProps) => {
  const tableRef = useRef<HTMLTableElement | null>(null);
  const [columnFilters, setColumnFilters] = useState<any>({});
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [selectAll, setSelectAll] = useState(false);
  const [isSelectedselect, setisSelectedselect] = useState<{ id: any; rowData: any }[]>([]);
  const { handleExcelDownload, isLoading } = useExcelDownload();
  const [filterSearchTerms, setFilterSearchTerms] = useState<Record<string, string>>({}); // for dropdown search

  // apply per-column filters when filterPosition === "FilterData"
  const filteredData = useMemo(() => {
    if (!data) return [];
    if (filterPosition !== "FilterData") return data;
    if (Object.keys(columnFilters).length === 0) return data;

    return data.filter((row: any) =>
      Object.entries(columnFilters).every(([key, value]) => {
        if (!value || value === "ALL") return true;
        if (key.endsWith("_operator")) return true;

        const operator = columnFilters[`${key}_operator`] || "=";
        const rowValue = row[key];
        const filterValue = value;

        if (numericFilterColumns.includes(key) && !isNaN(Number(filterValue))) {
          const numRowValue = parseFloat(rowValue);
          const numFilterValue = parseFloat(filterValue as any);

          if (isNaN(numRowValue)) return false;

          switch (operator) {
            case ">":
              return numRowValue > numFilterValue;
            case "<":
              return numRowValue < numFilterValue;
            case ">=":
              return numRowValue >= numFilterValue;
            case "<=":
              return numRowValue <= numFilterValue;
            default:
              return numRowValue === numFilterValue;
          }
        }

        return String(rowValue ?? "")
          .toLowerCase()
          .includes(String(filterValue ?? "").toLowerCase());
      })
    );
  }, [data, columnFilters, numericFilterColumns, filterPosition]);

  // react-table instance
  const tableInstance = useTable(
    {
      columns,
      data: filterPosition === "FilterData" ? filteredData : data,
      initialState: {
        pageSize: serverMode
          ? serverPagination?.pageSize || 10
          : 10,
        pageIndex: serverMode
          ? Math.max(0, (serverPagination?.currentPage || 1) - 1)
          : 0,
      },
      globalFilter: globalFilterFunction,
      manualPagination: serverMode, // server pagination mode
      pageCount: serverMode ? serverPagination?.totalPages || 0 : undefined,
      autoResetPage: !serverMode, // avoid auto reset when server-controlled
    },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,          // current page rows
    rows: allRows, // all (pre-pagination) rows in the table instance
    state,
    setGlobalFilter,
    nextPage,
    previousPage,
    canNextPage,
    canPreviousPage,
    pageOptions,
    gotoPage,
    setPageSize,
  } = tableInstance;

  const { globalFilter } = state as any;
  const { pageIndex, pageSize } = state as any;

  // keep external consumers updated with row count of current page
  useEffect(() => {
    if (onRowCountChange) onRowCountChange(page.length);
  }, [page, onRowCountChange]);

  // clear selection if "check" prop toggles off
  useEffect(() => {
    if (!check && setSelectedRows) setSelectedRows([]);
  }, [check, setSelectedRows]);

  // sync react-table with server pagination updates
  useEffect(() => {
    if (!serverMode || !serverPagination) return;
    const targetIndex = Math.max(0, serverPagination.currentPage - 1);
    if (pageIndex !== targetIndex) gotoPage(targetIndex);
    if (pageSize !== serverPagination.pageSize) setPageSize(serverPagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverMode, serverPagination?.currentPage, serverPagination?.pageSize, gotoPage, setPageSize]);

  // unique options for column filters (with header dropdown search term applied)
  const getUniqueValues = (accessor: string) => {
    const src = data.filter((row: any) =>
      Object.entries(columnFilters).every(([key, value]) => {
        if (!value || key === accessor || key.endsWith("_operator")) return true;
        return String(row[key] ?? "")
          .toLowerCase()
          .includes(String(value ?? "").toLowerCase());
      })
    );

    const uniqueValues = new Set<any>();
    src.forEach((row: any) => {
      const value = row[accessor];
      if (value !== undefined && value !== null) uniqueValues.add(value);
    });

    let options = Array.from(uniqueValues).sort((a: any, b: any) =>
      String(a).localeCompare(String(b))
    );
    const term = (filterSearchTerms[accessor] || "").toLowerCase();
    if (term) {
      options = options.filter((v) => String(v).toLowerCase().includes(term));
    }
    return options;
  };

  // Excel export: export current filtered dataset (pre-pagination in client mode; in server mode, it's the current page data passed in)
  const onclickExceldownload = () => {
    const exportData = allRows.map((r: any) => r.original);
    handleExcelDownload(columnsDownload || columns, exportData);
  };

  const handleFilterChange = (accessor: string, value: any) => {
    setColumnFilters((prev: any) => ({
      ...prev,
      [accessor]: value === "ALL" ? null : value,
    }));
  };

  const clearFilter = (accessor: string) => {
    setColumnFilters((prev: any) => {
      const next = { ...prev };
      delete next[accessor];
      delete next[`${accessor}_operator`];
      return next;
    });
    setActiveFilter(null);
  };

  const toggleFilterDropdown = (accessor: string) => {
    setActiveFilter(activeFilter === accessor ? null : accessor);
  };

  const toggleRowSelection = (rowId: any, rowData: any) => {
    if (!setSelectedRows) return;

    if (onlyOnecheck) {
      setSelectedRows([{ id: rowId, rowData }]);
    } else {
      const isSelected = selectedRows.some((row) => row.id === rowId);
      if (isSelected) {
        setSelectedRows(selectedRows.filter((row) => row.id !== rowId));
      } else {
        const canSelect = rowData?.status_appr == null;
        if (canSelect) {
          setSelectedRows([...selectedRows, { id: rowId, rowData }]);
        }
      }
    }
  };

  const toggleSelectAll = () => {
    if (!setSelectedRows) return;

    // base rows for select-all (respect FilterData mode; else use whole current table data)
    const base =
      filterPosition === "FilterData" ? filteredData : (allRows.map((r: any) => r.original) as any[]);

    const newSelectedRows = selectAll
      ? []
      : base
          .filter((row: any) => row?.status_appr == null)
          .map((row: any) => ({ id: row[selectValue], rowData: row }));

    setSelectedRows(newSelectedRows);
    setSelectAll(!selectAll);
  };

  const handleRowClickInternal = (rowId: any, rowData: any) => {
    toggleRowSelection(rowId, rowData);
    setisSelectedselect([{ id: rowId, rowData }]);
    onRowClick?.(rowId, rowData);
  };

  const onRowDblClick = (rowData: any) => {
    if (setSelectedRows && selectValue) {
      setSelectedRows([{ id: rowData[selectValue], rowData }]);
    }
    onRowDoubleClick?.(rowData);
  };

  const resetAllFilters = () => {
    setGlobalFilter("");
    setColumnFilters({});
    setActiveFilter(null);
    setFilterSearchTerms({});
  };

  // Pagination controls (adaptive)
  const handlePrev = () => {
    if (serverMode) {
      const curr = serverPagination?.currentPage || 1;
      if (curr > 1) onServerPageChange?.(curr - 1);
    } else {
      if (canPreviousPage) previousPage();
    }
  };

  const handleNext = () => {
    if (serverMode) {
      const curr = serverPagination?.currentPage || 1;
      const tp = serverPagination?.totalPages || 1;
      if (curr < tp) onServerPageChange?.(curr + 1);
    } else {
      if (canNextPage) nextPage();
    }
  };

  const handlePageSizeChange = (next: number) => {
    if (serverMode) {
      onServerPageSizeChange?.(next);
      onServerPageChange?.(1);
    } else {
      setPageSize(next);
      gotoPage(0);
    }
  };

  const uiHeight =
    typeof height === "number" ? `${height}px` : height || "400px";

  const currentPage = serverMode
    ? (serverPagination?.currentPage || 1)
    : pageIndex + 1;

  const totalPages = serverMode
    ? (serverPagination?.totalPages || 1)
    : pageOptions.length || 1;

  const totalItemsLabel = serverMode
    ? (typeof serverPagination?.totalRecords === "number"
        ? serverPagination.totalRecords
        : allRows.length)
    : allRows.length;

  return (
    <div className="p-0">
      <div className="h-10">
        <div className="flex items-center">
          <SmallTitle text={title} />
          <div className="flex gap-3 mt-0 ml-auto">
            <Button
              className="hidden md:block w-[126px] font-bold bg-[#ecfdf3] text-[#28a745] border-2 border-[#28a745] text-[14px]"
              onClick={onclickExceldownload}
              size={"sm"}
              disabled={isLoading}
            >
              {isLoading ? (
                <CgSpinner className="animate-spin text-xl mx-auto" />
              ) : (
                "Export to Excel"
              )}
            </Button>

            {filterPosition === "FilterData" && (
              <Button
                onClick={resetAllFilters}
                className="hidden md:block w-[126px] font-bold border-2 border-header text-header dark:text-white text-[14px]"
                size={"sm"}
              >
                Reset Filters
              </Button>
            )}

            <input
              className="border border-borderColor dark:border-borderColor-dark h-[30px] px-1.5 w-52 text-black dark:text-white py-1.5 dark:bg-input rounded text-sm shadow focus:outline-none focus:ring ease-linear transition-all duration-150"
              type="text"
              value={globalFilter || ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search..."
            />
          </div>
        </div>
      </div>

      <div
        className="overflow-y-scroll no-visible-scrollbar"
        style={{ height: uiHeight }}
      >
        <table
          {...getTableProps()}
          ref={tableRef}
          className="table-auto w-full uppercase text-xs font-bold shadow rounded-lg p-2"
        >
          {/* Filter row - only shown when filterPosition="FilterData" */}
          {filterPosition === "FilterData" && enableColumnFilters && (
            <thead className="sticky top-0 border border-borderColor dark:border-borderColor-dark bg-white dark:bg-aaa shadow-md rounded-md">
              <tr>
                {ischeckbox && (
                  <th className="border border-borderColor dark:border-borderColor-dark px-2 py-2"></th>
                )}
                {headerGroups[0]?.headers.map((column: any) => {
                  const accessor = column.id;
                  const isNumericFilter = numericFilterColumns.includes(accessor);
                  const uniqueValues = getUniqueValues(accessor);

                  return (
                    <th
                      key={accessor}
                      className={`border border-borderColor dark:border-borderColor-dark px-2 py-2 ${size || "text-xs"}`}
                    >
                      <div className="relative">
                        {isNumericFilter ? (
                          <div className="flex gap-1">
                            <select
                              className="w-[50px] text-xs border rounded bg-white dark:bg-input px-1 py-1"
                              value={columnFilters[`${accessor}_operator`] || "="}
                              onChange={(e) =>
                                handleFilterChange(`${accessor}_operator`, e.target.value)
                              }
                            >
                              <option value="=">=</option>
                              <option value=">">{">"}</option>
                              <option value="<">{"<"}</option>
                              <option value=">=">{">="}</option>
                              <option value="<=">{"<="}</option>
                            </select>
                            <input
                              type="number"
                              className="w-[100px] text-xs border rounded bg-white dark:bg-input px-1 py-1"
                              value={columnFilters[accessor] || ""}
                              onChange={(e) => handleFilterChange(accessor, e.target.value)}
                              placeholder="Value"
                            />
                          </div>
                        ) : (
                          <select
                            onChange={(e) => handleFilterChange(accessor, e.target.value)}
                            value={columnFilters[accessor] || "ALL"}
                            className={`w-full font-semibold text-[#1f2125] dark:text-white border border-borderColor dark:border-borderColor-dark rounded bg-white dark:bg-input px-1 py-2 ${labelClassName || size || "text-sm"}`}
                            style={{ lineHeight: "20px" }}
                          >
                            <option value="ALL">{` ${column.render("Header")}`}</option>
                            {uniqueValues.map((value: any, i: number) => (
                              <option key={i} value={value} style={{ height: "20px", lineHeight: "20px" }}>
                                {String(value)}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
          )}

          {/* Main table header */}
          <thead
            className={`sticky ${
              filterPosition === "FilterData" && enableColumnFilters ? "top-[50px]" : "top-0"
            }  border border-borderColor dark:border-borderColor-dark h-6 bg-off dark:bg-input text-header dark:text-white `}
            style={{ borderRadius: "5px" }}
          >
            {headerGroups.map((headerGroup: any, headerIndex: number) => (
              <tr
                key={headerIndex}
                className="border-b border-body-color"
                {...headerGroup.getHeaderGroupProps()}
              >
                {ischeckbox && (
                  <th className="border w-10 px-2">
                    <Checkbox
                      checked={selectAll}
                      onChange={toggleSelectAll}
                      disabled={ischeckbox === true && false}
                    />
                  </th>
                )}
                {headerGroup.headers.map((column: any) => {
                  const accessor = column.id;
                  const hasFilter = columnFilters[accessor];
                  const isNumericFilter = numericFilterColumns.includes(accessor);

                  return (
                    <th
                      key={accessor}
                      {...column.getHeaderProps(column.getSortByToggleProps())}
                      className={`border border-borderColor dark:border-borderColor-dark ${headerClassName || size || "text-sm"} ${
                        column.align === "center" ? "text-center" : "text-left"
                      } text-left px-2 py-3 whitespace-nowrap`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={
                            column.HeaderAlign === "center"
                              ? "text-center w-full"
                              : column.HeaderAlign === "right"
                              ? "text-right w-full"
                              : "text-left"
                          }
                        >
                          {String(column.render("Header")).toUpperCase()}
                        </span>

                        <div className="flex items-center ml-2">
                          {enableColumnFilters && filterPosition === "header" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFilterDropdown(accessor);
                              }}
                              className={`ml-1 ${hasFilter ? "text-blue-500" : "text-gray-400"}`}
                            >
                              <FontAwesomeIcon icon={faFilter} size="xs" />
                            </button>
                          )}
                          <span className="ml-1">
                            {column.isSorted ? (
                              column.isSortedDesc ? (
                                <FontAwesomeIcon icon={faSortDown} />
                              ) : (
                                <FontAwesomeIcon icon={faSortUp} />
                              )
                            ) : (
                              <FontAwesomeIcon icon={faSort} />
                            )}
                          </span>
                        </div>
                      </div>

                      {enableColumnFilters &&
                        filterPosition === "header" &&
                        activeFilter === accessor && (
                          <div className="relative mt-1">
                            <div className="absolute z-20 w-full bg-white dark:bg-dark-200 shadow-lg rounded border border-gray-200 p-2">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-semibold">
                                  Filter by {column.render("Header")}
                                </span>
                                <button
                                  onClick={() => clearFilter(accessor)}
                                  className="text-xs text-red-500"
                                >
                                  <FontAwesomeIcon icon={faTimes} />
                                </button>
                              </div>
                              {isNumericFilter ? (
                                <div className="flex gap-1">
                                  <select
                                    className="w-[50px] text-xs border rounded bg-white dark:bg-dark-300 px-1 py-1"
                                    value={columnFilters[`${accessor}_operator`] || "="}
                                    onChange={(e) =>
                                      handleFilterChange(`${accessor}_operator`, e.target.value)
                                    }
                                  >
                                    <option value="=">=</option>
                                    <option value=">">{">"}</option>
                                    <option value="<">{"<"}</option>
                                    <option value=">=">{">="}</option>
                                    <option value="<=">{"<="}</option>
                                  </select>
                                  <input
                                    type="number"
                                    className="w-[100px] text-xs border rounded bg-white dark:bg-dark-300 px-1 py-1"
                                    value={columnFilters[accessor] || ""}
                                    onChange={(e) => handleFilterChange(accessor, e.target.value)}
                                    placeholder="Value"
                                  />
                                </div>
                              ) : (
                                <div className="flex flex-col gap-1">
                                  <input
                                    type="text"
                                    placeholder="Search options..."
                                    value={filterSearchTerms[accessor] || ""}
                                    onChange={(e) =>
                                      setFilterSearchTerms((prev) => ({
                                        ...prev,
                                        [accessor]: e.target.value,
                                      }))
                                    }
                                    className="w-full text-xs border rounded bg-white dark:bg-dark-300 px-1 py-0.5"
                                  />
                                  <Fselect
                                    title={`Filter by ${column.render("Header")}`}
                                    name={accessor}
                                    option={getUniqueValues(accessor).map((v) => ({
                                      value: v,
                                      label: String(v),
                                    }))}
                                    handleInputChange={(name: string, value: any) =>
                                      handleFilterChange(name, value)
                                    }
                                    initialValue={columnFilters[accessor] || null}
                                    isSelectAll={true}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          {/* Table body */}
          <tbody
            {...getTableBodyProps()}
            className="font-semibold bg-white dark:bg-primary dark:bg-opacity-10 rounded-lg text-black dark:text-white"
          >
            {page.map((row: any) => {
              prepareRow(row);
              const rowId = row.original?.[selectValue] ?? row.values[selectValue];
              return (
                <tr
                  key={row.id}
                  {...row.getRowProps()}
                  className={`cursor-pointer hover:bg-[#8190a8] dark:hover:bg-[#9CA3AF] dark:text-black 
                    ${
                      isSelectedselect.some((r) => r.id === rowId)
                        ? "bg-[#bfdbfe] dark:bg-[#5f679f] hover:bg-[#bfdbfe] dark:hover:bg-[#5f679f]"
                        : "bg-white dark:bg-primary dark:bg-opacity-10 hover:bg-gray-100 dark:hover:bg-dark-200"
                    }`}
                  onClick={() => {
                    if (row?.original?.status_khud_ka == null) {
                      handleRowClickInternal(rowId, row.original);
                    }
                  }}
                  onDoubleClick={() => {
                    if (row?.original?.status_khud_ka == null) {
                      onRowDblClick(row.original);
                    }
                  }}
                >
                  {ischeckbox && (
                    <td className="border px-2 text-center">
                      {row?.original?.status_appr == null ? (
                        <Checkbox
                          checked={selectedRows?.some((r) => r.id === rowId)}
                          onChange={() => toggleRowSelection(rowId, row.original)}
                        />
                      ) : (
                        row?.status_appr
                      )}
                    </td>
                  )}
                  {row.cells.map((cell: any) => (
                    <td
                      key={cell.column.id}
                      {...cell.getCellProps()}
                      className={`border border-borderColor dark:border-borderColor-dark px-2 py-[12px] whitespace-nowrap dark:text-white dark:bg-[#15203F] bg-white ${
                        cell.column.cellAlign === "right"
                          ? "text-right"
                          : cell.column.cellAlign === "center"
                          ? "text-center"
                          : "text-left"
                      }`}
                    >
                      <div title={cell.value} className={`${size || "text-[13px]"}`}>
                        {typeof cell.value === "string" &&
                        cell.value.length > MAX_CONTENT_LENGTH
                          ? truncateText(cell.value)
                          : cell.render("Cell")}
                      </div>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>

        {page.length === 0 && (
          <div className="w-full text-center py-4 text-gray-500 dark:text-gray-400">
            No data available
          </div>
        )}
      </div>

      {(handleapprove || handlereject) && (
        <div className="flex justify-end gap-4 p-4">
          {handleapprove && (
            <Button
              onClick={() => handleapprove(selectedRows)}
              variant="save"
              disabled={selectedRows.length === 0}
            >
              {texta || "Approve"}
            </Button>
          )}
          {handlereject && showRejectButton && (
            <Button
              onClick={() => handlereject(selectedRows)}
              variant="delete"
              disabled={selectedRows.length === 0}
            >
              {textr || "Reject"}
            </Button>
          )}
        </div>
      )}

      {/* Pagination Controls (adaptive) */}
      <div className="flex flex-wrap justify-between items-center mt-4 px-3 gap-2">
       

        <button
          onClick={handlePrev}
          disabled={
            serverMode
              ? (serverPagination?.currentPage || 1) <= 1
              : !canPreviousPage
          }
          className="px-4 py-2 bg-[#3b82f6] text-white rounded disabled:opacity-50"
        >
          Previous
        </button>
 <div className="flex items-center gap-2">
          <span className={labelClassName || size || "text-sm"}>Page Size:</span>
          <select
            className={`h-8 rounded border border-borderColor bg-white px-2 dark:border-borderColor-dark dark:bg-input dark:text-white ${labelClassName || size || "text-sm"}`}
            value={serverMode ? serverPagination?.pageSize || pageSize : pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
          >
            {[10, 20, 50, 100].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <span className={`font-semibold ${labelClassName || size || "text-sm"}`}>
          Page{" "}
          <strong>
            {currentPage} of {totalPages}
          </strong>{" "}
          ({totalItemsLabel} items)
        </span>
        </div>
        

        <button
          onClick={handleNext}
          disabled={
            serverMode
              ? (serverPagination?.currentPage || 1) >= (serverPagination?.totalPages || 1)
              : !canNextPage
          }
          className="px-4 py-2 bg-[#3b82f6] text-white rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default DataTable;