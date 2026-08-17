import React, { useEffect, useRef, useState } from "react";
import { useTable, useGlobalFilter, usePagination } from "react-table";
import { Button } from "../ui/button";
import { Checkbox } from "antd";
import { FaCheck } from "react-icons/fa";
import { DownloadTableExcel } from "react-export-table-to-excel";

const MAX_CONTENT_LENGTH = 50;

const truncateText = (text) => {
  return text.length > MAX_CONTENT_LENGTH
    ? text.substring(0, MAX_CONTENT_LENGTH) + "..."
    : text;
};

const DataTable = ({
  onRowDoubleClick,
  check,
  columns,
  data,
  onRowClick,
  setsellectedrowdata,
  handleapprove,
  handlereject,
  selectValue,
  height,
  texta,
  textr,
  showRejectButton,
  onlyOnecheck,
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
    usePagination
  );

  useEffect(() => {
    if (!check) {
      setSelectedRows([]);
    }
  }, [check]);

  const toggleRowSelection = (rowId, rowData) => {
    if (onlyOnecheck) {
      setSelectedRows([{ id: rowId, rowData }]);
      setsellectedrowdata([{ id: rowId, rowData }]);
    } else {
      if (selectedRows.some((row) => row.id === rowId)) {
        const updatedRows = selectedRows.filter((row) => row.id !== rowId);
        setSelectedRows(updatedRows);
        setsellectedrowdata(updatedRows);
      } else {
        const updatedRows = [...selectedRows, { id: rowId, rowData }];
        setSelectedRows(updatedRows);
        setsellectedrowdata(updatedRows);
      }
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

  const { globalFilter } = state;
  const tableRef = useRef(null);

  return (
    <div className="p-1">
      <style>
        {`
          .overflow-y-scroll, .overflow-x-scroll {
            overflow-y: scroll;
            overflow-x: scroll;
          }

          .overflow-y-scroll::-webkit-scrollbar, .overflow-x-scroll::-webkit-scrollbar {
            width: 6px; 
            height: 6px; 
          }
          
          .overflow-y-scroll::-webkit-scrollbar-thumb, .overflow-x-scroll::-webkit-scrollbar-thumb {
            background: #888; 
            border-radius: 10px; 
          }
          
          .overflow-y-scroll::-webkit-scrollbar-thumb:hover, .overflow-x-scroll::-webkit-scrollbar-thumb:hover {
            background: #555; 
          }
          
          .overflow-y-scroll::-webkit-scrollbar-track, .overflow-x-scroll::-webkit-scrollbar-track {
            background: #f1f1f1; 
            border-radius: 10px; 
          }
        `}
      </style>

      <div
        className="overflow-y-scroll"
        style={{ height: height }}
      >
        <table
          {...getTableProps()}
          ref={tableRef}
          className="table-auto w-full uppercase text-xs font-bold shadow rounded-lg p-2"
        >
          <thead className="sticky top-0 z-100 bg-white dark:bg-input border-b border-body-color">
            <tr className="h-6 bg-white dark:bg-input text-black dark:text-white">
              {headerGroups.map((headerGroup, headerIndex) => (
                <React.Fragment key={headerIndex}>
                  {headerGroup.headers.map((column) => (
                    <th
                      key={column.id}
                      {...column.getHeaderProps()}
                      className="border text-xs text-center px-2 py-3 mt-0 text-ellipsis whitespace-nowrap"
                    >
                      <span>{column.render("Header")}</span>
                    </th>
                  ))}
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
                  className={`hover:bg-grey cursor-pointer ${
                    selectedRows.some((row) => row.id === utd)
                      ? "bg-gray-200"
                      : ""
                  }`}
                >
                  {row.cells.map((cell) => (
                    <td
                      key={cell.column.id}
                      {...cell.getCellProps()}
                      className={`border text-left border-body-color px-2 py-2 text-ellipsis whitespace-nowrap ${
                        cell.column.align === "right"
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
    </div>
  );
};

export default DataTable;
