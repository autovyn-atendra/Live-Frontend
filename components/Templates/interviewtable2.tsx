import React, { useEffect, useRef, useState } from "react";
import { useTable, useGlobalFilter, usePagination } from "react-table";
import { Button } from "../ui/button";
import { Checkbox } from "antd";
import { FaCheck } from "react-icons/fa";
import { DownloadTableExcel } from "react-export-table-to-excel";
// import useExcelDownload from "@/app/hooks/excel-download";
import { CgSpinner } from "react-icons/cg";
import useExcelDownload from "@/app/hooks/excel-Download2";

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
  onRowClick,
  setSelectedRows,
  handleapprove,
  handlereject,
  selectValue,
  selectedRows,
  height,
  texta,
  textr,
  showRejectButton,
  onRowDoubleClick,
  onlyOnecheck,
  ischeckbox
}) => {
  const [selectedRows111, setSelectedRows111] = useState([]);
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
       // setsellectedrowdata([{ id: rowId, rowData }]);
    } else {
      const isSelected = selectedRows.some((row) => row.id === rowId);
      if (isSelected) {
        setSelectedRows(selectedRows.filter((row) => row.id !== rowId));
         // setsellectedrowdata(selectedRows.filter((row) => row.id !== rowId));
      } else {
        setSelectedRows([...selectedRows, { id: rowId, rowData }]);
         // setsellectedrowdata([...selectedRows, { id: rowId, rowData }]);
      }
    }
  };

  const toggleSelectAll = () => {
    const newSelectedRows = selectAll
      ? []
      : data.map((row) => ({ id: row[selectValue], rowData: row }));
    setSelectedRows(newSelectedRows);
     // setsellectedrowdata(newSelectedRows);
    setSelectAll(!selectAll);
  };

  const handleRowClick = (rowId, rowData) => {
    toggleRowSelection(rowId, rowData); // Toggle checkbox state when row is clicked
    // Call the function passed as a prop
    onRowClick(rowId, rowData);
  };

  const onRowDblClick = (rowId, rowData) => {
    // Set only the double-clicked row as selected
    setSelectedRows([{ id: rowId, rowData }]);
     // setsellectedrowdata([{ id: rowId, rowData }]);
    // Call the function passed as a prop
    onRowDoubleClick(rowId, rowData);
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
    <div className="space-y-2">
      <div className="flex justify-end ">
        <div className="flex gap-3 mb-2">
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
            className="border border-borderColor dark:border-borderColor-dark px-1.5 dark:text-white py-1.5 dark:bg-input md:w-4/4  w-auto rounded text-sm shadow focus:outline-none focus:ring ease-linear transition-all duration-150"
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
          className="table-auto w-full text-sm shadow rounded-lg p-2"
        >
          <thead
            className="border-b border-body-color h-6 bg-[#193A69] dark:bg-input text-white"
            style={{
              position: "sticky",
              top: 0,
              zIndex: 1,
            }}
          >
            <tr>
              {ischeckbox && (
                <th className="border w-10 px-2 ">
                  <Checkbox
                    checked={selectAll}
                    onChange={toggleSelectAll}
                    disabled={ischeckbox === 1}
                  />
                </th>
              )}
              {headerGroups.map((headerGroup, headerIndex) => (
                <React.Fragment key={headerIndex}>
                  {headerGroup.headers.map((column) => (
                    <th
                      key={column.id}
                      {...column.getHeaderProps()}
                      className="border text-md px-2 py-2 text-center text-ellipsis whitespace-nowrap bg-[#193A69] dark:bg-input text-white dark:text-white"
                    >
                    <span>{String(column.render("Header")).toUpperCase()}</span>
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
                  className={`hover:bg-grey cursor-pointer ${selectedRows.some((row) => row.id === utd)
                      ? "bg-gray-200"
                      : ""
                    }`}
                  onClick={() => {
                    if (row?.original?.status_khud_ka == null) {
                      handleRowClick(utd, row.original);
                    }
                  }}
                  onDoubleClick={() => onRowDblClick(utd, row.original)}
                >
                  {ischeckbox && (
                    <td className="border px-2 border-body-color text-center">
                      {row?.original?.status_khud_ka == null ? (
                        <Checkbox
                          checked={selectedRows.some((row) => row.id === utd)}
                          onChange={() => toggleRowSelection(utd, row.original)}
                        />
                      ) : row?.status_khud_ka}
                    </td>
                  )}
                  {row.cells.map((cell) => (
                    <td
                      key={cell.column.id}
                      {...cell.getCellProps()}
                      className={`border text-left border-body-color px-2 py-1  text-ellipsis whitespace-nowrap ${cell.column.align === "right"
                          ? "text-right"
                          : cell.column.align === "center"
                            ? "text-center"
                            : "text-left"
                        }`}
                    >
                      <div title={cell.render("Cell")} className="text-md">
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
