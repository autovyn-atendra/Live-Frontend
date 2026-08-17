"use client";
import { useTable, useGlobalFilter, usePagination } from "react-table";

const MAX_CONTENT_LENGTH = 50; // Set your desired maximum content length

const truncateText = (text) => {
  return text.length > MAX_CONTENT_LENGTH
    ? text.substring(0, MAX_CONTENT_LENGTH) + "..."
    : text;
};
const DataTable = ({ columns, data, onRowDoubleClick }) => {
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

  const { globalFilter } = state;

  return (
    <div className="p-2">
      <div className="flex mt-1 mb-1 rounded-xl justify-end ">
        <input
          className="border-0 px-1.5 dark:text-white py-1.5 dark:bg-input w-1/2 rounded text-sm shadow focus:outline-none focus:ring ease-linear transition-all duration-150"
          type="text"
          value={globalFilter || ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search..."
        />
      </div>

      <div className="overflow-x-scroll h-screen">
        <table
          {...getTableProps()}
          className="table-auto  w-full uppercase text-xs font-bold shadow-signUp rounded-lg"
        >
          <thead className="h-6   bg-white dark:bg-input rounded-lg  text-black dark:text-white">
            {headerGroups.map((headerGroup, headerIndex) => (
              <tr key={headerIndex} {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map((column) => (
                  <th
                    key={column}
                    {...column.getHeaderProps()}
                    className="border  text-xs px-2"
                  >
                    <span>{column.render("Header")}</span>
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody
            {...getTableBodyProps()}
            className="bg-white dark:bg-primary dark:bg-opacity-10"
          >
            {page.map((row) => {
              prepareRow(row);
              return (
                <tr
                  key={row.id}
                  {...row.getRowProps()}
                  className="hover:bg-grey  cursor-pointer"
                  onDoubleClick={() => onRowDoubleClick(row.original)}
                >
                  {row.cells.map((cell) => (
                    <td
                      key={cell.column.id}
                      {...cell.getCellProps()}
                      className="border text-start pl-1 text-ellipsis whitespace-nowrap"
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
