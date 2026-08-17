import React, { useEffect, useRef, useState } from "react";
import { useTable, useGlobalFilter, usePagination } from "react-table";
import { Button } from "../ui/button";
import { Checkbox } from "antd";
import { FaCheck } from "react-icons/fa";
import { DownloadTableExcel } from "react-export-table-to-excel";
import useExcelDownload from "@/app/hooks/excel-download";
import { CgSpinner } from "react-icons/cg";

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
  textr,
  showRejectButton,
  // sendDataToParent,
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

  // const sendData = () => {
  //   const totalNetAmount = selectedRows.reduce((total, { id, rowData }) => {
  //     return total + (rowData ? rowData["Payout_Amt"] : 0);
  //   }, 0);
  //   sendDataToParent(totalNetAmount);
  // };

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

  const { globalFilter } = state;
  const tableRef = useRef(null);


  const { handleExcelDownload, isLoading } = useExcelDownload();
  const onclickExceldownload = () => {
    const filteredData = page.map((row) => {
      return row.original
    })
    handleExcelDownload(columns, filteredData);
  }
  return (
    <div className="p-1">
      <div className="flex  justify-end ">
        <div className="flex gap-2 mb-2">
        <Button className="hidden md:block w-[126px]" onClick={onclickExceldownload} size={'sm'} variant={"print"}
              disabled={isLoading}
            >
              {isLoading ? (
                <CgSpinner className="animate-spin text-xl mx-auto text-white" /> // Spinner icon
              ) : (
                'Export to Excel'
              )}
            </Button>
          <input
            className="border-0 px-1.5 w-52 dark:text-white py-1.5 dark:bg-input w-1/4 rounded text-sm shadow focus:outline-none focus:ring ease-linear transition-all duration-150"
            type="text"
            value={globalFilter || ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search..."
          />
        </div>
      </div>

      <div className="overflow-y-scroll " style={{ height: height }}>
        <table
          {...getTableProps()}
          ref={tableRef}
          className="table-auto  w-full uppercase text-xs font-bold shadow rounded-lg p-2 "
        >
          <thead
            className="sticky top-0 z-1 border-b border-body-color h-6 bg-white dark:bg-input text-black dark:text-white"
            style={{ borderRadius: "5px" }}
          >
            <tr>
              <th className="border w-10 px-2">
                {" "}
                <FaCheck />
              </th>
              {headerGroups.map((headerGroup, headerIndex) => (
                <React.Fragment key={headerIndex}>
                  {headerGroup.headers.map((column) => (
                    <th
                      key={column}
                      {...column.getHeaderProps()}
                      className=" border text-xs text-left px-2 py-3 text-ellipsis whitespace-nowrap "
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
            className=" bg-white bg-opacity-60 dark:bg-primary dark:bg-opacity-10  rounded-lg"
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
                  onClick={() => handleRowClick(utd, row.original)}
                  onDoubleClick={() => onRowDoubleClick(row.original)}
                >
                  <td className="border text-left px-2 border-body-color">
                    <Checkbox
                      checked={selectedRows.some((row) => row.id === utd)}
                      onChange={() => toggleRowSelection(utd, row.original)}
                    ></Checkbox>
                  </td>
                  {row.cells.map((cell) => (
                    <td
                      key={cell.column.id}
                      {...cell.getCellProps()}
                      className={`border  text-left   border-body-color px-2 py-2   text-ellipsis whitespace-nowrap  ${cell.column.align === "right"
                        ? "text-right"
                        : cell.column.align === "center"
                          ? "text-center"
                          : "text-left"
                        }`}
                    >
                      <div title={cell.render("Cell")} className="text-xs ">
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
        <Checkbox checked={selectAll} onChange={toggleSelectAll} />
        <span className="font-bold text-2xl"></span> 
        {texta &&
          <Button variant={"update"} onClick={handleapprove}>
            {texta}
          </Button>
        }

        {showRejectButton && ( // Conditionally render the reject button based on the prop
          <Button variant={"print"} onClick={handlereject}>
            Reject
          </Button>
        )}
      </div>
    </div>
  );
};

export default DataTable;
