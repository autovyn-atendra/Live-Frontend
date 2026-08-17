"use client";
import React, { useState } from "react";
import { useTable, useGlobalFilter, usePagination } from "react-table";
import { Button } from "../ui/button";
import { Checkbox } from "antd";
const MAX_CONTENT_LENGTH = 50; // Set your desired maximum content length

const truncateText = (text) => {
  return text.length > MAX_CONTENT_LENGTH
    ? text.substring(0, MAX_CONTENT_LENGTH) + "..."
    : text;
};

const DataTable = ({
  columns,
  data,
  onRowDoubleClick,
  setsellectedrowdata,
  handleapprove,
  handlereject,
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

  const toggleRowSelection = (utd) => {
    if (selectedRows.includes(utd)) {
      setSelectedRows(selectedRows.filter((id) => id !== utd));
      setsellectedrowdata(selectedRows.filter((id) => id !== utd));
    } else {
      setSelectedRows([...selectedRows, utd]);
      setsellectedrowdata([...selectedRows, utd]);
    }
  };

  const toggleSelectAll = () => {
    const newSelectedRows = selectAll ? [] : data.map((row) => row["UTD"]);
    setSelectedRows(newSelectedRows);
    setsellectedrowdata(newSelectedRows);
    setSelectAll(!selectAll);
  };

  const handleRowClick = (utd) => {
    toggleRowSelection(utd);
  };

  const { globalFilter } = state;

  return (
    <div className="p-1">
      <div className="flex mt-1 mb-1 rounded-xl justify-end ">
        <input
          className="border-0 px-1.5 dark:text-white py-1.5 dark:bg-input w-1/4 rounded text-sm shadow focus:outline-none focus:ring ease-linear transition-all duration-150"
          type="text"
          value={globalFilter || ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search..."
        />
      </div>

      <div className="overflow-y-scroll h-[350px]">
        <table
          {...getTableProps()}
          className="table-auto  w-full uppercase text-xs font-bold shadow rounded-lg p-2 "
        >
          <thead
            className="border-b border-body-color h-6 bg-white dark:bg-input text-black dark:text-white"
            style={{ borderRadius: "5px" }}
          >
            <tr>
              <th></th>
              {headerGroups.map((headerGroup, headerIndex) => (
                <React.Fragment key={headerIndex}>
                  {headerGroup.headers.map((column) => (
                    <th
                      key={column}
                      {...column.getHeaderProps()}
                      className="  text-xs px-2 py-3"
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
              const utd = row.values["UTD"];
              return (
                <tr
                  key={row.id}
                  {...row.getRowProps()}
                  className={`hover:bg-grey cursor-pointer ${
                    selectedRows.includes(utd) ? "bg-gray-200" : ""
                  }`}
                  onClick={() => handleRowClick(utd)}
                  onDoubleClick={() => onRowDoubleClick(row.original)}
                >
                  <td className="border-b border-body-color">
                    <Checkbox
                      checked={selectedRows.includes(utd)}
                      onChange={() => toggleRowSelection(utd)}
                    ></Checkbox>
                  </td>
                  {row.cells.map((cell) => (
                    <td
                      key={cell.column.id}
                      {...cell.getCellProps()}
                      className={`border-b border-body-color px-2 py-2 text-ellipsis whitespace-nowrap  ${
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
      <div className="p-2 flex gap-2">
        <Checkbox checked={selectAll} onChange={toggleSelectAll}></Checkbox>
        {/* <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} /> */}
        <Button variant={"update"} onClick={handleapprove}>
          Approve
        </Button>
        <Button variant={"print"} onClick={handlereject}>
          Reject
        </Button>
      </div>
    </div>
  );
};

export default DataTable;

// "use client";
// import { useState } from "react";
// import { useTable, useGlobalFilter, usePagination } from "react-table";

// const MAX_CONTENT_LENGTH = 50; // Set your desired maximum content length

// const truncateText = (text) => {
//   return text.length > MAX_CONTENT_LENGTH
//     ? text.substring(0, MAX_CONTENT_LENGTH) + "..."
//     : text;
// };
// const DataTable = ({
//   columns,
//   data,
//   onRowDoubleClick,
//   setsellectedrowdata,
// }) => {
//   const [selectedRows, setSelectedRows] = useState([]);
//   const {
//     getTableProps,
//     getTableBodyProps,
//     headerGroups,
//     prepareRow,
//     page,
//     state,
//     setGlobalFilter,
//   } = useTable(
//     { columns, data, initialState: { pageSize: data?.length || 50 } },
//     useGlobalFilter,
//     usePagination
//   );
//   const toggleRowSelection = (utd) => {
//     if (selectedRows.includes(utd)) {
//       setSelectedRows(selectedRows.filter((id) => id !== utd));
//       setsellectedrowdata(selectedRows.filter((id) => id !== utd));
//     } else {
//       setSelectedRows([...selectedRows, utd]);
//       setsellectedrowdata([...selectedRows, utd]);
//     }
//   };

//   const handleRowClick = (utd) => {
//     toggleRowSelection(utd);
//   };

//   const { globalFilter } = state;

//   return (
//     <div className="p-1">
//       <div className="flex mt-1 mb-1 rounded-xl justify-end ">
//         <input
//           className="border-0 px-1.5 dark:text-white py-1.5 dark:bg-input w-1/4 rounded text-sm shadow focus:outline-none focus:ring ease-linear transition-all duration-150"
//           type="text"
//           value={globalFilter || ""}
//           onChange={(e) => setGlobalFilter(e.target.value)}
//           placeholder="Search..."
//         />
//       </div>

//       <div className="overflow-y-scroll h-[350px]">
//         <table
//           {...getTableProps()}
//           className="table-auto  w-full uppercase text-xs font-bold shadow rounded-lg p-2 "
//         >
//           <thead
//             className="border-b border-body-color h-6 bg-white dark:bg-input text-black dark:text-white"
//             style={{ borderRadius: "5px" }}
//           >
//             {headerGroups.map((headerGroup, headerIndex) => (
//               <tr key={headerIndex} {...headerGroup.getHeaderGroupProps()}>
//                 <th>.</th>
//                 {headerGroup.headers.map((column) => (
//                   <th
//                     key={column}
//                     {...column.getHeaderProps()}
//                     className="  text-xs px-2 py-3"
//                   >
//                     <span>{column.render("Header")}</span>
//                   </th>
//                 ))}
//               </tr>
//             ))}
//           </thead>

//           <tbody
//             {...getTableBodyProps()}
//             className=" bg-white bg-opacity-60 dark:bg-primary dark:bg-opacity-10  rounded-lg"
//           >
//             {page.map((row) => {
//               prepareRow(row);
//               const utd = row.values["UTD"];
//               return (
//                 <tr
//                   key={row.id}
//                   {...row.getRowProps()}
//                   className={`hover:bg-grey cursor-pointer ${
//                     selectedRows.includes(utd) ? "bg-gray-200" : ""
//                   }`}
//                   onClick={() => handleRowClick(utd)}
//                   onDoubleClick={() => onRowDoubleClick(row.original)}
//                 >
//                   <td className="border-b border-body-color">
//                     <input
//                       type="checkbox"
//                       onChange={() => toggleRowSelection(utd)}
//                       checked={selectedRows.includes(utd)}
//                     />
//                   </td>
//                   {row.cells.map((cell) => (
//                     <td
//                       key={cell.column.id}
//                       {...cell.getCellProps()}
//                       className={`border-b border-body-color px-2 py-2 text-ellipsis whitespace-nowrap  ${
//                         cell.column.align === "right"
//                           ? "text-right"
//                           : cell.column.align === "center"
//                           ? "text-center"
//                           : "text-left"
//                       }`}
//                     >
//                       <div title={cell.render("Cell")} className="text-xs">
//                         {truncateText(cell.render("Cell"))}
//                       </div>
//                     </td>
//                   ))}
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// export default DataTable;
