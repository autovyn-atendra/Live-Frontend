 import React, { useEffect, useRef, useState, useMemo } from "react";
import { useTable, useGlobalFilter, usePagination, useSortBy } from "react-table";
import { Button } from "../ui/button";
import { Checkbox } from "antd";
import { FaCheck } from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSort, faSortUp, faSortDown, faFilter, faTimes } from "@fortawesome/free-solid-svg-icons";
import useExcelDownload from "@/app/hooks/excel-download";
import { CgSpinner } from "react-icons/cg";

const MAX_CONTENT_LENGTH = 50; // Set your desired maximum content length

const truncateText = (text) => {
  return text?.length > MAX_CONTENT_LENGTH
    ? text.substring(0, MAX_CONTENT_LENGTH) + "..."
    : text;
};

const DataTable = ({
  check,
  columns,
  data,
  onRowDoubleClick,
  setsellectedrowdata,
  handleapprove,
  handlereject,
  selectValue,
  height,
  texta,
  textr,
  showRejectButton,
  onlyOnecheck,
  // New props for FilterData functionality
  filterPosition = "header", // "header" or "FilterData"
  enableColumnFilters = true,
  numericFilterColumns = [],
  columnsDownload,
  onRowCountChange
}) => {
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [columnFilters, setColumnFilters] = useState({});
  const [activeFilter, setActiveFilter] = useState(null);
  const [filterSearchTerms, setFilterSearchTerms] = useState({});

  // Filter data based on column filters
  const filteredData = useMemo(() => {
    if (!data) return [];
    if (Object.keys(columnFilters).length === 0) return data;

    return data.filter((row) =>
      Object.entries(columnFilters).every(([key, value]) => {
        if (!value || value === "ALL") return true;
        if (key.endsWith('_operator')) return true;

        const operator = columnFilters[`${key}_operator`] || "=";
        const rowValue = row[key];
        const filterValue = value;

        if (numericFilterColumns.includes(key) && !isNaN(filterValue)) {
          const numRowValue = parseFloat(rowValue);
          const numFilterValue = parseFloat(filterValue);

          if (isNaN(numRowValue)) return false;

          switch (operator) {
            case ">": return numRowValue > numFilterValue;
            case "<": return numRowValue < numFilterValue;
            case ">=": return numRowValue >= numFilterValue;
            case "<=": return numRowValue <= numFilterValue;
            default: return numRowValue === numFilterValue;
          }
        }

        return String(rowValue).toLowerCase().includes(String(value).toLowerCase());
      })
    );
  }, [data, columnFilters, numericFilterColumns]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    state,
    setGlobalFilter,
  } = useTable(
    {
      columns,
      data: filterPosition === "FilterData" ? filteredData : data,
      initialState: { pageSize: data?.length || 50 },
    },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  useEffect(() => {
    if (!check) {
      setSelectedRows([]);
    }
  }, [check]);

  useEffect(() => {
    if (onRowCountChange) {
      onRowCountChange(page.length);
    }
  }, [page, onRowCountChange]);

  const toggleRowSelection = (rowId, rowData) => {
    if (onlyOnecheck) {
      setSelectedRows([{ id: rowId, rowData }]);
      setsellectedrowdata([{ id: rowId, rowData }]);
      if (selectedRows.some((row) => row.id === rowId)) {
        setSelectedRows([]);
        setsellectedrowdata([]);
      } else {
        setSelectedRows([{ id: rowId, rowData }]);
        setsellectedrowdata([{ id: rowId, rowData }]);
      }
    } else {
      if (selectedRows.some((row) => row.id === rowId)) {
        setSelectedRows(selectedRows.filter((row) => row.id !== rowId));
        setsellectedrowdata(selectedRows.filter((row) => row.id !== rowId));
      } else {
        setSelectedRows([...selectedRows, { id: rowId, rowData }]);
        setsellectedrowdata([...selectedRows, { id: rowId, rowData }]);
      }
    }
  };

  const toggleSelectAll = () => {
    if (!onlyOnecheck) {
      const newSelectedRows = selectAll
        ? []
        : data.map((row) => ({ id: row[selectValue], rowData: row }));
      setSelectedRows(newSelectedRows);
      setsellectedrowdata(newSelectedRows);
      setSelectAll(!selectAll);
    }
  };

  const handleRowClick = (rowId, rowData) => {
    toggleRowSelection(rowId, rowData);
  };

  const { globalFilter } = state;
  const tableRef = useRef(null);
  const { handleExcelDownload, isLoading } = useExcelDownload();

  // Get unique values for filter dropdowns
  const getUniqueValues = (accessor) => {
    const uniqueValues = new Set();
    data?.forEach((row) => {
      const value = row[accessor];
      if (
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ""
      ) {
        uniqueValues.add(value);
      }
    });
    return Array.from(uniqueValues).sort();
  };

  // Handle filter changes
  const handleFilterChange = (accessor, value) => {
    setColumnFilters((prev) => ({
      ...prev,
      [accessor]: value === "ALL" ? null : value,
    }));
  };

  // Clear specific filter
  const clearFilter = (accessor) => {
    setColumnFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[accessor];
      delete newFilters[`${accessor}_operator`];
      return newFilters;
    });
    setActiveFilter(null);
  };

  // Toggle filter dropdown
  const toggleFilterDropdown = (accessor) => {
    setActiveFilter(activeFilter === accessor ? null : accessor);
  };

  // Reset all filters
  const resetAllFilters = () => {
    setGlobalFilter("");
    setColumnFilters({});
    setActiveFilter(null);
    setFilterSearchTerms({});
  };

  const onclickExceldownload = () => {
    const filteredData = page.map((row) => row.original);
    handleExcelDownload(columnsDownload || columns, filteredData);
  };

  return (
    <div className="p-1">
      <div className="flex justify-end">
        <div className="flex gap-2 mb-2">
          {filterPosition === "FilterData" && (
            <Button
              onClick={resetAllFilters}
              className="hidden md:block w-[126px]"
              size={"sm"}
              variant={"save"}
            >
              Reset Filters
            </Button>
          )}
          
          <Button className="hidden md:block w-[126px]" onClick={onclickExceldownload} size={'sm'} variant={"print"}
            disabled={isLoading}
          >
            {isLoading ? (
              <CgSpinner className="animate-spin text-xl mx-auto text-white" />
            ) : (
              'Export to Excel'
            )}
          </Button>
          <input
            className="border border-borderColor dark:border-borderColor-dark px-1.5 w-52 dark:text-white py-1.5 dark:bg-input w-1/4 rounded text-sm shadow focus:outline-none focus:ring ease-linear transition-all duration-150"
            type="text"
            value={globalFilter || ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search..."
          />
        </div>
      </div>

      <div className="overflow-y-scroll" style={{ height: height }}>
        <table
          {...getTableProps()}
          ref={tableRef}
          className="table-auto w-full uppercase text-xs font-bold shadow rounded-lg p-2"
        >
          {/* Filter row - only shown when filterPosition="FilterData" */}
          {filterPosition === "FilterData" && enableColumnFilters && (
            <thead className="sticky top-0 z-[10px] bg-gray-100 dark:bg-dark-200 bg-[#e3f2fd] dark:bg-aaa">
              <tr>
                <th className="border w-10 px-2"></th>
                {headerGroups[0]?.headers.map((column) => {
                  const accessor = column.id;
                  const isNumericFilter = numericFilterColumns.includes(accessor);
                  const uniqueValues = getUniqueValues(accessor);

                  return (
                    <th key={accessor} className="border px-2 py-2 text-xs">
                      <div className="relative">
                        {isNumericFilter ? (
                          <div className="flex gap-1">
                            <select
                              className="w-[50px] text-xs border rounded bg-white dark:bg-input px-1 py-1"
                              value={columnFilters[`${accessor}_operator`] || "="}
                              onChange={(e) => handleFilterChange(`${accessor}_operator`, e.target.value)}
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
                            className="w-full text-xs border rounded bg-white dark:bg-input px-1.5 py-1"
                            style={{ lineHeight: '20px' }}
                          >
                            <option value="ALL">{`Filter by ${column.render("Header")}`}</option>
                            {uniqueValues.map((value, i) => (
                              <option key={i} value={value} style={{ height: '20px', lineHeight: '20px' }}>
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
            className={`sticky ${filterPosition === "FilterData" && enableColumnFilters ? "top-[38px]" : "top-0"} z-1 border-b border-body-color h-6 bg-header dark:bg-input text-white dark:text-white`}
            style={{ borderRadius: "5px" }}
          >
            <tr>
              <th className="border w-10 px-2">
                {" "}
                <FaCheck />
              </th>
              {headerGroups.map((headerGroup, headerIndex) => (
                <React.Fragment key={headerIndex}>
                  {headerGroup.headers.map((column) => {
                    const accessor = column.id;
                    const hasFilter = columnFilters[accessor];
                    const isNumericFilter = numericFilterColumns.includes(accessor);

                    return (
                      <th
                        key={column.id}
                        {...column.getHeaderProps(column.getSortByToggleProps())}
                        className="border text-xs text-left px-2 py-3 text-ellipsis whitespace-nowrap"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <span>{column.render("Header")}</span>
                            {column.canSort && (
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
                            )}
                          </div>
                          
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
                                      onChange={(e) => handleFilterChange(`${accessor}_operator`, e.target.value)}
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
                                    <select
                                      onChange={(e) => handleFilterChange(accessor, e.target.value)}
                                      value={columnFilters[accessor] || "ALL"}
                                      className="w-full text-xs border rounded bg-white dark:bg-dark-300 px-1 py-1"
                                    >
                                      <option value="ALL">All</option>
                                      {getUniqueValues(accessor).map((value, i) => (
                                        <option key={i} value={value}>
                                          {String(value)}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                      </th>
                    );
                  })}
                </React.Fragment>
              ))}
            </tr>
          </thead>

          <tbody
            {...getTableBodyProps()}
            className="bg-white bg-opacity-60 dark:bg-primary dark:bg-opacity-10 rounded-lg"
          >
            {page.map((row) => {
              prepareRow(row);
              const utd = row.values[selectValue];
              return (
                <tr
                  key={row.id}
                  {...row.getRowProps()}
                  className={`hover:bg-grey cursor-pointer ${selectedRows.some((row) => row.id === utd)
                    ? "bg-gray-200"
                    : ""
                    }`}
                  onClick={() => {
                    if (row?.original?.status_khud_ka == null) {
                      handleRowClick(utd, row.original)
                    }
                  }}
                >
                  <td className="border text-left px-2 border-body-color">
                    {row?.original?.status_khud_ka == null ? (
                      <Checkbox
                        checked={selectedRows.some((row) => row.id === utd)}
                        onChange={() => toggleRowSelection(utd, row.original)}
                      />
                    ) : row?.status_khud_ka}
                  </td>
                  {row.cells.map((cell) => (
                    <td
                      key={cell.column.id}
                      {...cell.getCellProps()}
                      className={`border text-left border-body-color px-2 py-2 text-ellipsis whitespace-nowrap ${cell.column.align === "right"
                        ? "text-right"
                        : cell.column.align === "center"
                          ? "text-center"
                          : "text-left"
                        }`}
                    >
                      <div title={cell.render("Cell")} className="text-xs">
                        {truncateText(cell.render("Cell"))}
                      </div>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="p-2 flex gap-2">
        {!onlyOnecheck && (
          <Checkbox checked={selectAll} onChange={toggleSelectAll}></Checkbox>
        )}
        <Button variant={"update"} onClick={handleapprove}>
          {texta}
        </Button>
        {showRejectButton && (
          <Button variant={"print"} onClick={handlereject}>
            Reject
          </Button>
        )}
      </div>
    </div>
  );
};

export default DataTable;
