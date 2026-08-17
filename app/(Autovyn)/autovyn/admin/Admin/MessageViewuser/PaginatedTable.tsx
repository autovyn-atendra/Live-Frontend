
import { faSort, faSortDown, faSortUp, faFilter, faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useMemo, useRef, useState } from "react";
import {
  useTable, usePagination,
  useGlobalFilter,
  useSortBy,
} from "react-table";
import 'tailwindcss/tailwind.css';
import SmallTitle from "@/components/atoms/smallTitle";
import { Button } from "@/components/ui/button";
const MAX_CONTENT_LENGTH = 40; // Set your desired maximum content length
import useExcelDownload from "@/app/hooks/excel-download";

const truncateText = (text) => {
  return text?.length > MAX_CONTENT_LENGTH
    ? text.substring(0, MAX_CONTENT_LENGTH) + "..."
    : text;
};

const PaginatedTable = ({
  columns,
  data,
  onRowDoubleClick,
  title,
  // New props for FilterData functionality
  filterPosition = "header", // "header" or "FilterData"
  enableColumnFilters = true,
  numericFilterColumns = [],
  columnsDownload,
  onRowCountChange
}) => {
  const [columnFilters, setColumnFilters] = useState({});
  const [activeFilter, setActiveFilter] = useState(null);
  const [filterSearchTerms, setFilterSearchTerms] = useState({});
  const [higlightIndex, sethiglightIndex] = useState(-1);
  const tableRef = useRef(null);

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
    nextPage,
    previousPage,
    state,
    canNextPage,
    canPreviousPage,
    pageOptions,
    setGlobalFilter,
    state: { pageIndex },
  } = useTable(
    {
      columns,
      data: filterPosition === "FilterData" ? filteredData : data,
      initialState: { pageIndex: 0, pageSize: 30 }, // Adjust page size as needed
    },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  // Call onRowCountChange when page length changes
  React.useEffect(() => {
    if (onRowCountChange) {
      onRowCountChange(page.length);
    }
  }, [page, onRowCountChange]);

  const { globalFilter } = state;
  const isFilterApplied = !!globalFilter;
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
    const exportData = page.map((row) => row.original);
    handleExcelDownload(columnsDownload || columns, exportData);
  }

  const onclickExceldownload2 = () => {
    handleExcelDownload(columnsDownload || columns, data);
  }

  return (
    <div className="p-0">
      <div className=" h-12 px-4 mt-2">
        <div className="flex items-center gap-x-3">
          <SmallTitle text={title} />
          <div className="flex gap-2 mt-0">
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

            {!isFilterApplied ? (
              <Button className="hidden md:block w-[126px]" onClick={onclickExceldownload2} size={'sm'} variant={"print"}
                disabled={isLoading} loading={isLoading}
              >
                Export to Excel
              </Button>
            ) : (
              <Button className="hidden md:block w-[126px]" onClick={onclickExceldownload} size={'sm'} variant={"print"}
                disabled={isLoading} loading={isLoading}
              >
                Export to Excel
              </Button>
            )}

            <input
              className="border border-borderColor dark:border-borderColor-dark px-1.5 w-52 text-black dark:text-white py-1.5 dark:bg-input rounded text-sm shadow focus:outline-none focus:ring ease-linear transition-all duration-150"
              type="text"
              value={globalFilter || ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search..."
            />
          </div>
        </div>
      </div>

      <div className={`overflow-y-scroll h-[425px] no-visible-scrollbar`}>
        <table
          {...getTableProps()}
          ref={tableRef}
          className="table-auto  w-full uppercase text-xs font-bold shadow rounded-lg p-2 "
        >
          {/* Filter row - only shown when filterPosition="FilterData" */}
          {filterPosition === "FilterData" && enableColumnFilters && (
            <thead className="sticky top-0 z-[10px] bg-gray-100 dark:bg-dark-200 bg-[#e3f2fd] dark:bg-aaa">
              <tr>
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
            {headerGroups.map((headerGroup, headerIndex) => (
              <tr
                key={headerIndex}
                className="border-b border-body-color"
                {...headerGroup.getHeaderGroupProps()}
              >
                {headerGroup.headers.map((column) => {
                  const accessor = column.id;
                  const hasFilter = columnFilters[accessor];
                  const isNumericFilter = numericFilterColumns.includes(accessor);

                  return (
                    <th
                      key={column}
                      {...column?.getHeaderProps(column.getSortByToggleProps())}
                      className="border text-xs text-left px-2 py-3 text-ellipsis whitespace-nowrap"
                    >
                      <div className="flex items-center justify-between">
                        <span>{column.render("Header")}</span>
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
              </tr>
            ))}
          </thead>

          <tbody
            {...getTableBodyProps()}
            className=" bg-white bg-opacity-60 dark:bg-primary dark:bg-opacity-10  rounded-lg text-black dark:text-white"
          >
            {page.map((row) => {
              prepareRow(row);
              return (
                <tr
                  key={row.id}
                  {...row.getRowProps()}
                  className="hover:bg-grey cursor-pointer"
                  onDoubleClick={() => onRowDoubleClick(row.original)}
                  onClick={() => {
                    if (higlightIndex == row.index) {
                      sethiglightIndex(-1)
                    } else {
                      sethiglightIndex(row.index)
                    }
                  }}
                >
                  {row.cells.map((cell) => (
                  <td
  key={cell.column.id}
  {...cell.getCellProps()}
  className={`border text-left px-2 border-body-color py-2 ${
    cell.column.id === "MsgText" 
      ? "whitespace-normal break-words min-w-[300px]" 
      : "text-ellipsis whitespace-nowrap"
  } ${
    cell.column.align === "right"
      ? "text-right"
      : cell.column.align === "center"
      ? "text-center"
      : "text-left"
  }
  ${row.index == higlightIndex
    ? "bg-[#bfdbfe] dark:bg-[#5f679f]"
    : "hover:bg-grey"
  }`}
>
  <div title={cell.value} className="text-xs">
    {cell.column.id === "MsgText" 
      ? cell.value  // Show full message without truncation
      : (cell.value?.length > 40 ? truncateText(cell.value) : cell.render("Cell"))
    }
  </div>
</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => previousPage()}
          disabled={!canPreviousPage}
          className="px-4 py-2 bg-[#3b82f6] text-white rounded disabled:opacity-50"
        >
          Previous
        </button>

        <span>
          Page{" "}
          <strong>
            {pageIndex + 1} of {pageOptions.length}
          </strong>
          {" "}({data.length} items)
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

export default PaginatedTable;