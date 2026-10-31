
"use client";
import React, { useState, useRef, useEffect } from "react";
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

const MAX_CONTENT_LENGTH = 50
const truncateText = (text) => {
  return text?.length > MAX_CONTENT_LENGTH
    ? text.substring(0, MAX_CONTENT_LENGTH) + "..."
    : text;
};

const globalFilterFunction = (rows, columnIds, filterValue) => {
  return rows.filter((row) =>
    columnIds.some((id) => {
      const value = row.values[id];
      return String(value).toLowerCase().includes(filterValue.toLowerCase());
    })
  );
};


const DataTable = ({
  columns,
  data,
  onRowDoubleClick,
  title,
  height,
  size,
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
}) => {
  const tableRef = useRef(null);
  const [columnFilters, setColumnFilters] = useState({});
  const [activeFilter, setActiveFilter] = useState(null);
  const [selectAll, setSelectAll] = useState(false);
  const [isSelectedselect, setisSelectedselect] = useState([]);
  const { handleExcelDownload, isLoading } = useExcelDownload();

  const [filterSearchTerms, setFilterSearchTerms] = useState({}); //added



  const filteredData = React.useMemo(() => {
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

  const tableInstance = useTable(
    {
      columns,
      data: filterPosition === "FilterData" ? filteredData : data, // ✅ use filteredData
      initialState: { pageSize: 20},
      globalFilter: globalFilterFunction,
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
    page,
    state,
    setGlobalFilter,
    rows, 
    nextPage,
    previousPage,
    canNextPage,
    canPreviousPage,
    pageOptions,

  } = tableInstance;

  const { globalFilter } = state;
  const { pageIndex } = state;

  useEffect(() => {
    if (onRowCountChange) {
      onRowCountChange(page.length);
    }
  }, [page, onRowCountChange]);

  useEffect(() => {
    if (!check && setSelectedRows) {
      setSelectedRows([]);
    }
  }, [check]);

  //Added
  const getUniqueValues = (accessor) => {
    const sourceData = data.filter((row) =>
      Object.entries(columnFilters).every(([key, value]) => {
        if (!value || key === accessor || key.endsWith("_operator"))
          return true;

        return String(row[key])
          .toLowerCase()
          .includes(String(value).toLowerCase());
      })
    );

    const uniqueValues = new Set();

    sourceData.forEach((row) => {
      const value = row[accessor];
      if (value) uniqueValues.add(value);
    });

    return Array.from(uniqueValues).sort();
  };
 
  const onclickExceldownload = () => {
    const exportData = rows.map((row) => row.original);
    handleExcelDownload(columnsDownload || columns, exportData);
  };

  const handleFilterChange = (accessor, value) => {
    setColumnFilters((prev) => ({
      ...prev,
      [accessor]: value === "ALL" ? null : value,
    }));
  };

  const clearFilter = (accessor) => {
    setColumnFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[accessor];
      delete newFilters[`${accessor}_operator`];
      return newFilters;
    });
    setActiveFilter(null);
  };

  const toggleFilterDropdown = (accessor) => {
    setActiveFilter(activeFilter === accessor ? null : accessor);
  };

  const toggleRowSelection = (rowId, rowData) => {
    if (!setSelectedRows) return;

    if (onlyOnecheck) {
      setSelectedRows([{ id: rowId, rowData }]);
    } else {
      const isSelected = selectedRows.some((row) => (row.id === rowId));
      if (isSelected) {
        setSelectedRows(selectedRows.filter((row) => row.id !== rowId));
      } else {
        const isSelected1 = rowData.status_appr == null ? 1 : 0;
        if (isSelected1) {
          setSelectedRows([...selectedRows, { id: rowId, rowData }]);
        }
      }
    }
  };

  const toggleSelectAll = () => {
    if (!setSelectedRows) return;
    const newSelectedRows = selectAll ? [] : filteredData.filter((row) => row.status_appr === null).map((row) => ({ id: row[selectValue], rowData: row }));
    setSelectedRows(newSelectedRows);
    setSelectAll(!selectAll);
  };

  const handleRowClickInternal = (rowId, rowData) => {
    toggleRowSelection(rowId, rowData);
    setisSelectedselect([{ id: rowId, rowData }]);
    onRowClick?.(rowId, rowData);
  };

  const onRowDblClick = (rowData) => {
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

  return (
    <div className="p-0">
      <div className="h-10">
        <div className="flex items-center ">
          <SmallTitle text={title} />
          <div className="flex gap-3 mt-0">
            <Button className="hidden md:block w-[126px] font-bold bg-[#ecfdf3] text-[#28a745] border-2 border-[#28a745] text-[14px]"
              onClick={onclickExceldownload}
              size={'sm'}
              disabled={isLoading}
            >
              {isLoading ? (
                <CgSpinner className="animate-spin text-xl mx-auto" />
              ) : (
                'Export to Excel'
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

      <div className={`overflow-y-scroll ${height ? `h-[${height}]` : 'h-[400px]'} no-visible-scrollbar`}>
        <table
          {...getTableProps()}
          ref={tableRef}
          className="table-auto w-full uppercase text-xs font-bold shadow rounded-lg p-2"
        >
          {/* Filter row - only shown when filterPosition="FilterData" */}
          {filterPosition === "FilterData" && enableColumnFilters && (
            <thead className="sticky top-0 border border-borderColor dark:border-borderColor-dark bg-white dark:bg-aaa shadow-md rounded-md">
              <tr>
                {ischeckbox && <th className="border border-borderColor dark:border-borderColor-dark px-2 py-2"></th>}
                {headerGroups[0]?.headers.map((column) => {
                  const accessor = column.id;
                  const isNumericFilter = numericFilterColumns.includes(accessor);
                  const uniqueValues = getUniqueValues(accessor);

                  return (
                    <th key={accessor} className={`border border-borderColor dark:border-borderColor-dark px-2 py-2  ${size || "text-xs"}`}>
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
                            className="w-full text-sm font-semibold text-[#1f2125] dark:text-white border border-borderColor dark:border-borderColor-dark rounded bg-white dark:bg-input px-1 py-2"
                            style={{ lineHeight: '20px' }}
                          >
                            <option value="ALL">{` ${column.render("Header")}`}</option>
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
            className={`sticky ${filterPosition === "FilterData" && enableColumnFilters ? "top-[38px]" : "top-0"} z-1  border border-borderColor dark:border-borderColor-dark h-6 bg-off dark:bg-input text-header dark:text-white `}
            style={{ borderRadius: "5px" }}
          >
            {headerGroups.map((headerGroup, headerIndex) => (
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
                      disabled={ischeckbox === 1}
                    />
                  </th>
                )}
                {headerGroup.headers.map((column) => {
                  const accessor = column.id;
                  const hasFilter = columnFilters[accessor];
                  const isNumericFilter = numericFilterColumns.includes(accessor);

                  return (
                    <th
                      key={accessor}
                      {...column.getHeaderProps(column.getSortByToggleProps())}
                      className={`border border-borderColor dark:border-borderColor-dark ${size || 'text-sm'} ${column.align === "center"
                        ? "text-center"
                        : "text-left"}border border-borderColor dark:border-borderColor-dark text-left px-2 py-3 text-sm whitespace-nowrap`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={
                          column.HeaderAlign === "center" ? "text-center w-full" :
                            column.HeaderAlign === "right" ? "text-right w-full" :
                              "text-left"
                        }>
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
                                  <Fselect
                                    title={`Filter by ${column.render("Header")}`}
                                    name={accessor}
                                    option={getUniqueValues(accessor).map((v) => ({ value: v, label: String(v) }))}
                                    handleInputChange={(name, value) => handleFilterChange(name, value)}
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
            className="font-semibold  bg-white  dark:bg-primary dark:bg-opacity-10 rounded-lg text-black dark:text-white"
          >
            {page.map((row) => {
              prepareRow(row);
              const utd = row.values[selectValue];
              return (
                <tr
                  key={row.id}
                  {...row.getRowProps()}
                  className={`cursor-pointer hover:bg-[#8190a8] dark:hover:bg-[#9CA3AF] dark:text-black 
                    ${isSelectedselect.some((row) => row.id === utd)
                      ? "bg-[#bfdbfe] dark:bg-[#5f679f] hover:bg-[#bfdbfe] dark:hover:bg-[#5f679f]"
                      : "bg-white dark:bg-primary dark:bg-opacity-10 hover:bg-gray-100 dark:hover:bg-dark-200"
                    }`}
                  onClick={() => {
                    if (row?.original?.status_khud_ka == null) {
                      handleRowClickInternal(utd, row.original);
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
                          checked={selectedRows?.some((row) => row.id === utd)}
                          onChange={() => toggleRowSelection(utd, row.original)}
                        />
                      ) : (
                        row?.status_appr
                      )}
                    </td>
                  )}
                  {row.cells.map((cell) => (
                    <td
                      key={cell.column.id}
                      {...cell.getCellProps()}        //color
                      className={`border border-borderColor dark:border-borderColor-dark
                       px-2 py-[12px] whitespace-nowrap dark:text-white dark:bg-[#15203F] bg-white  ${cell.column.cellAlign === "right" ? "text-right" :
                          cell.column.cellAlign === "center" ? "text-center" :
                            "text-left"
                        }`}
                    >
                      <div title={cell.value} className={`${size || "text-[13px]"}`}>
                        {typeof cell.value === "string" && cell.value.length > 40
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


      <div className="flex justify-between items-center mt-4 px-3">
        <button
          onClick={() => previousPage()}
          disabled={!canPreviousPage}
          className="px-4 py-2 bg-[#3b82f6] text-white rounded disabled:opacity-50"
        >
          Previous
        </button>

        <span className="text-sm font-semibold">
          Page{" "}
          <strong>
            {pageIndex + 1} of {pageOptions.length}
          </strong>{" "}
          ({rows.length} items)
        </span>

        <button
          onClick={() => nextPage()}
          disabled={!canNextPage}
          className="px-4 py-2 bg-[#3b82f6] text-white rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default DataTable;


