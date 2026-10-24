import React, { useEffect, useRef, useState } from "react";
import { useTable, useGlobalFilter, usePagination, useSortBy } from "react-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "antd";
import { FaCheck } from "react-icons/fa";
import { DownloadTableExcel } from "react-export-table-to-excel";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSort, faSortUp, faSortDown } from "@fortawesome/free-solid-svg-icons";
import Ainput from "@/components/atoms/Input";

const MAX_CONTENT_LENGTH = 50; // Set your desired maximum content length

const truncateText = (text) => {
  return text.length > MAX_CONTENT_LENGTH
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
  status,
  handleRemark,
  remark,
}) => {
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    state,
    setGlobalFilter,
  } = useTable(
    { columns, data, initialState: { pageSize: data?.length || 50 } },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  useEffect(() => {
    if (!check) {
      setSelectedRows([]);
    }
  }, [check]);

  const toggleRowSelection = (rowId, rowData) => {
    if (selectedRows.some((row) => row.id === rowId)) {
      setSelectedRows(selectedRows.filter((row) => row.id !== rowId));
      setsellectedrowdata(selectedRows.filter((row) => row.id !== rowId));
    } else {
      setSelectedRows([...selectedRows, { id: rowId, rowData }]);
      setsellectedrowdata([...selectedRows, { id: rowId, rowData }]);
    }
  };

  const toggleSelectAll = () => {
    const newSelectedRows = selectAll
      ? []
      : data.map((row) => ({ id: row[selectValue], rowData: row }));
    setSelectedRows(newSelectedRows);
    setsellectedrowdata(newSelectedRows);
    setSelectAll(!selectAll);
  };

  const handleRowClick = (rowId, rowData) => {
    toggleRowSelection(rowId, rowData);
  };

  const getDotColors = (row) => {
    const stat = row.stat || row.status;
    const apprStat = row.APPR_STAT;
    const rejStat = row.REJ_STAT;

    // default colors
    let dot1 = "#ccc";
    let dot2 = "#ccc";
    let dot3 = "#ccc";

    if (stat == 1) {
      dot1 = "#f59e0b"; // pending
    }
    else if (stat == 2) {
      dot1 = "#22c55e"; // green
      dot2 = "#f59e0b";
    }
    else if (stat == 3) {
      dot1 = "#22c55e";
      dot2 = "#22c55e";
      dot3 = "#f59e0b";
    }
    else if (stat == 4) {
      if (apprStat == "1") {
        dot1 = dot2 = dot3 = "#22c55e";
      } else if (rejStat == "1") {
        dot1 = dot2 = dot3 = "#ef4444";
      }
    }

    return { dot1, dot2, dot3 };
  };

  const { globalFilter } = state;
  const tableRef = useRef(null);
  return (
    <div className="p-1">
      <div className="flex justify-end">
        <div className="flex gap-2 mb-2">
          <DownloadTableExcel
            filename="data_export"
            sheet="Sheet1"
            currentTableRef={tableRef.current}
          >
            <Button className="hidden md:block" variant={"print"}>
              Export to Excel
            </Button>
          </DownloadTableExcel>
          <input
            className="border border-borderColor dark:border-borderColor-dark px-1.5 w-52 dark:text-white py-1.5 dark:bg-input w-1/4 rounded text-sm shadow focus:outline-none focus:ring ease-linear transition-all duration-150"
            type="text"
            value={globalFilter || ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search..."
          />
        </div>
      </div>

      <div
        className="overflow-y-scroll no-visible-scrollbar"
        style={{ height: height }}
      >
        <table
          {...getTableProps()}
          ref={tableRef}
          className="table-auto w-full uppercase text-xs font-bold shadow rounded-lg p-2"
        >
          <thead
            className="sticky top-0 z-1 border-b border-body-color h-6 bg-header dark:bg-input text-white dark:text-white"
            style={{ borderRadius: "5px" }}
          >
            <tr>
              <th className="border w-10 px-2">
                <FaCheck />
              </th>
              {/* Dot indicator column */}
              <th className="border w-14 px-2 text-center">
                
              </th>
              {headerGroups.map((headerGroup, headerIndex) => (
                <React.Fragment key={headerIndex}>
                  {headerGroup.headers.map((column) => (
                    <th
                      key={column.id}
                      {...column.getHeaderProps(column.getSortByToggleProps())}
                      className="border text-xs text-left px-2 py-3 text-ellipsis whitespace-nowrap font-semibold"
                    >
                      <span>{column.render("Header")}</span>
                      <span className="ml-1">
                        {column.isSorted ? (
                          column.isSortedDesc ? (
                            <FontAwesomeIcon icon={faSortDown} size="10px" />
                          ) : (
                            <FontAwesomeIcon icon={faSortUp} size="10px" />
                          )
                        ) : (
                          <FontAwesomeIcon icon={faSort} />
                        )}
                      </span>
                    </th>
                  ))}
                </React.Fragment>
              ))}
            </tr>
          </thead>

          <tbody
            {...getTableBodyProps()}
            className="rounded-lg"
          >
            {page.map((row) => {
              prepareRow(row);
              const utd = row.values[selectValue];
              const hasReappRemark = row.original.reapp_remark !== null;
              return (
                <tr
                  key={row.id}
                  {...row.getRowProps()}
                  className={`hover:bg-grey cursor-pointer ${selectedRows.some((row) => row.id === utd)
                    ? "bg-gray-200"
                    : ""
                    }`}
                  onClick={() => handleRowClick(utd, row.original)}
                  onDoubleClick={() => onRowDoubleClick(row.original)}
                >
                  <td className="border text-left px-2 border-body-color">
                    {row?.original?.status == 0 ? (
                      <Checkbox
                        checked={selectedRows.some((row) => row.id === utd)}
                        onChange={() => toggleRowSelection(utd, row.original)}
                      />
                    ) : (
                      row?.status
                    )}
                  </td>
                  {(() => {
                    const { dot1, dot2, dot3 } = getDotColors(row.original);
                    return (
                      <td className="border px-2 py-1">
                        <div className="flex gap-1">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dot1 }}></div>
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dot2 }}></div>
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dot3 }}></div>
                        </div>
                      </td>
                    );
                  })()}
                  {row.cells.map((cell) => (
                    <td
                      key={cell.column.id}
                      {...cell.getCellProps()}
                      className={`border text-left border-body-color px-2 py-1 text-ellipsis whitespace-nowrap ${cell.column.align === "right"
                        ? "text-right"
                        : cell.column.align === "center"
                          ? "text-center"
                          : "text-left"
                        }`}
                    >
                      <div
                        // title={cell.render("Cell")}
                         title={typeof cell.value === "string" ? cell.value : ""}
                        className="text-xs font-semibold"
                      >
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
      {status == 0 && (
        <div className="p-2 flex gap-2">
          <Checkbox
            checked={selectAll}
            onChange={toggleSelectAll}
            className="mt-5"
          ></Checkbox>
          <Button variant={"update"} onClick={handleapprove} className="mt-5">
            {texta}
          </Button>

          <Button variant={"print"} onClick={handlereject} className="mt-5">
            Reject
          </Button>
          <Ainput
            title="Remark"
            type="text"
            name="remark"
            value={remark}
            handleInputChange={handleRemark}
          />
        </div>
      )}
    </div>
  );
};

export default DataTable;
