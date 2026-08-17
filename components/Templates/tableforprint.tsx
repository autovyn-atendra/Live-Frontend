"use client";
import React, { useRef } from "react";
import { useTable, useGlobalFilter, usePagination } from "react-table";
import { DownloadTableExcel } from "react-export-table-to-excel";
import SmallTitle from "../atoms/smallTitle";
import { Button } from "../ui/button";

const MAX_CONTENT_LENGTH = 50; // Set your desired maximum content length

const truncateText = (text) => {
  return text.length > MAX_CONTENT_LENGTH
    ? text.substring(0, MAX_CONTENT_LENGTH) + "..."
    : text;
};
const Tableforprint = ({ columns, data, onRowDoubleClick, title,height }) => {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    state,
    setGlobalFilter,
  } = useTable(
    { columns, data, initialState: { pageSize: data?.length || 100000 } },
    useGlobalFilter,
    usePagination
  );
  const tableRef = useRef(null);
  const { globalFilter } = state;

  return (
    <div className="">
 

      <div className="">
        <table
          {...getTableProps()}
          ref={tableRef}
          className="table-auto  w-full uppercase text-xs font-bold shadow rounded-lg p-2 "
        >
          <thead
            className="border-b border-body-color h-6 bg-white dark:bg-input text-black dark:text-white"
            style={{ borderRadius: "5px" }}
          >
            {headerGroups.map((headerGroup, headerIndex) => (
              <tr key={headerIndex} {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map((column) => (
                  <th
                    key={column}
                    {...column.getHeaderProps()}
                    className=" border text-xs text-left px-2 py-1.5 text-ellipsis whitespace-nowrap "
                  >
                    <span>{column.render("Header")}</span>
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody
            {...getTableBodyProps()}
            className=" bg-white bg-opacity-60 dark:bg-primary dark:bg-opacity-10  rounded-lg"
          >
            {page.map((row) => {
              prepareRow(row);
              return (
                <tr
                  key={row.id}
                  {...row.getRowProps()}
                  className="hover:bg-grey cursor-pointer"
                  onDoubleClick={() => onRowDoubleClick(row.original)}
                >
                  {row.cells.map((cell) => (
                    <td
                      key={cell.column.id}
                      {...cell.getCellProps()}
                      className={`border  text-left px-2 border-body-color  py-1 text-ellipsis whitespace-nowrap  ${
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

export default Tableforprint;
