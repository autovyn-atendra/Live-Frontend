"use client";
import { useTable, useGlobalFilter, usePagination } from "react-table";
import SmallTitle from "../atoms/smallTitle";

const MAX_CONTENT_LENGTH = 50; // Set your desired maximum content length

const truncateText = (text) => {
  return text.length > MAX_CONTENT_LENGTH
    ? text.substring(0, MAX_CONTENT_LENGTH) + "..."
    : text;
};
const LeaveTable = ({ columns, data, onRowDoubleClick, title }) => {
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

  const { globalFilter } = state;

  return (
    <div className="p-1">
      <div className="flex mt-1 mb-1 rounded-xl justify-end "></div>

      <div>
        <table
          {...getTableProps()}
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
                    className=" text-xs px-2 py-3 text-left"
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
                      className={`border-b border-body-color px-2  py-2 text-ellipsis whitespace-nowrap text-left`}
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

export default LeaveTable;
