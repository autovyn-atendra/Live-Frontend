// import React, { useState, useEffect, useRef } from "react";
// import { MdDelete, MdNoteAdd } from "react-icons/md";
// import "tailwindcss/tailwind.css";
// import Swal from "sweetalert2";
// import Eselect from "./Eselect";
// import Fselect from "./Fselect";

// const YNDynamicTable = ({
//   columns,
//   columnsShow,
//   tableData,
//   setTableData,
//   constraints,
//   disabledProp,
//   DropDownOp = [],
//   Height = 0,
//   AddBtn = false,
// }) => {
//   const inputRefs = useRef({});

//   function showSideAlert(message, type) {
//     const Toast = Swal.mixin({
//       toast: true,
//       position: "top-end",
//       showConfirmButton: false,
//       timer: 5000,
//       timerProgressBar: true,
//       customClass: {
//         container: "side-alert-container",
//         popup: `side-alert-${type}`,
//         title: "side-alert-title",
//         icon: "side-alert-icon",
//       },
//     });

//     Toast.fire({
//       icon: type,
//       title: message,
//     });
//   }

//   const handleInputChange = (rowIndex, field, value, inputIndex) => {
//     const constraint = constraints[field]?.type;
//     const maxLength = constraints[field]?.max;

//     if (typeof value === "string") {
//       value = value.toUpperCase();
//     }

//     if (maxLength !== undefined && value.length > maxLength) {
//       value = value.substring(0, maxLength);
//     }

//     const newData = tableData.map((item, index) => {
//       if (index === rowIndex) {
//         return { ...item, [field]: value || "" };
//       }
//       return item;
//     });

//     setTableData(newData);
//   };

//   const handleDeleteRow = (rowIndex) => {
//     const newData = tableData.filter((_, index) => index !== rowIndex);
//     setTableData(newData);
//   };

//   const handleKeyDown = (e, rowIndex, columnIndex) => {
//     if (e.key === "Tab" && !e.shiftKey) {
//       const lastRow = tableData[tableData.length - 1];
//       if (
//         rowIndex === tableData.length - 1 &&
//         columnIndex === columns.length - 1
//       ) {
//         e.preventDefault();
//         addNewRow();
//       }
//     }
//   };

//   const addNewRow = async () => {
//     const lastRow = tableData[tableData.length - 1];

//     if (lastRow) {
//       const issueDate = new Date(lastRow.Issue_Date);
//       const revokeDate = new Date(lastRow.Revoke_Date);

//       if (issueDate > revokeDate) {
//         lastRow.Issue_Date = "";
//         lastRow.Revoke_Date = "";
//         showSideAlert(
//           "Issue Date cannot be earlier than Revoke Date. Both dates have been cleared.",
//           "warning"
//         );
//         setTableData([...tableData]);
//         return;
//       }

//       let allRequiredFieldsFilled = true;

//       for (const [field, constraint] of Object.entries(constraints)) {
//         const value = lastRow[field];
//         if (
//           constraint.required &&
//           (value === null ||
//             value === undefined ||
//             value?.toString()?.trim() === "")
//         ) {
//           allRequiredFieldsFilled = false;
//           showSideAlert(
//             `Please fill in the ${field} before adding a new one.`,
//             "warning"
//           );
//           break;
//         }
//       }

//       if (!allRequiredFieldsFilled) {
//         return;
//       }
//     }

//     const newRow = {};
//     setTableData([...tableData, newRow]);
//   };

//   useEffect(() => {
//     if (tableData.length === 0) {
//       addNewRow();
//     } else {
//       const rowsBeforeLast = tableData.slice(0, -1);
//       const lastRow = tableData[tableData.length - 1];

//       const newData = rowsBeforeLast.filter((row) =>
//         Object.values(row).some((value) => value !== "")
//       );

//       newData.push(lastRow);

//       if (newData.length !== tableData.length) {
//         setTableData(newData);
//       }
//     }
//   }, [tableData]);

//   const isRowDisabled = (row) => {
//     if ((row.UTD && row.UTD != null && row.UTD != undefined) || disabledProp) {
//       return true;
//     } else {
//       return false;
//     }
//   };

//   return (
//     <>
//       <table className="border table-auto w-full text-sm shadow-md">
//         <thead className="sticky top-0 bg-white border dark:bg-primary dark dark:bg-opacity-10 z-1">
//           <tr className="sticky top-0 z-10">
//             <th className="border py-2 px-4 text-center uppercase">Sr.</th>
//             {columnsShow?.map((column, index) => (
//               <th
//                 key={index}
//                 className="border py-2 px-4 text-center uppercase"
//               >
//                 {column}
//               </th>
//             ))}
//             <th className="border py-2 px-4 text-center uppercase">Actions</th>
//           </tr>
//         </thead>
//         <tbody>
//           {tableData?.map((item, rowIndex) => {
//             const disabled = isRowDisabled(item);

//             return (
//               <tr key={rowIndex} className={`hover:bg-gray-100`}>
//                 <td className="border text-center h-4">{rowIndex + 1}</td>
//                 {columns?.map((column, columnIndex) => {
//                   const isSelect = constraints[column]?.type === "Select";
//                   return (
//                     <td key={columnIndex} className="border h-4">
//                       {isSelect ? (
//                         <Eselect
//                           option={DropDownOp[column]}
//                           name={item[column]}
//                           mb={"0"}
//                           initialValue={item[column]?.toString() || ""}
//                           handleInputChange={(label, value) =>
//                             handleInputChange(
//                               rowIndex,
//                               column,
//                               value,
//                               `${rowIndex}-${columnIndex}`
//                             )
//                           }
//                           disabled={
//                             constraints[column].disabled && disabled
//                               ? true
//                               : false
//                           }
//                         />
//                       ) : (
//                         <input
//                           type={
//                             constraints[column].type === "DOC"
//                               ? "file"
//                               : constraints[column].type === "DATE"
//                               ? "date"
//                               : "text"
//                           }
//                           value={
//                             constraints[column].type === "DOC"
//                               ? undefined
//                               : item[column]
//                               ? item[column]
//                               : ""
//                           }
//                           accept={
//                             constraints[column].type === "DOC"
//                               ? "image/*,application/pdf"
//                               : undefined
//                           }
//                           onKeyDown={(e) => {
//                             handleKeyDown(e, rowIndex, columnIndex);
//                             if (constraints[column]?.type === "Y/N") {
//                               const allowedKeys = [
//                                 "Y",
//                                 "N",
//                                 "Backspace",
//                                 "Tab",
//                                 "ArrowLeft",
//                                 "ArrowRight",
//                                 "Delete"
//                               ];
//                               const key = e.key.toUpperCase();
//                               if (
//                                 !allowedKeys.includes(key) &&
//                                 key.length === 1
//                               ) {
//                                 e.preventDefault();
//                                 showSideAlert("Only 'Y' or 'N' is allowed", "warning");
//                               }
//                             }
//                           }}
//                           onBlur={(e) => {
//                             const val = e.target.value?.toUpperCase().trim();
//                             if (
//                               constraints[column]?.type === "Y/N" &&
//                               val &&
//                               val !== "Y" &&
//                               val !== "N"
//                             ) {
//                               showSideAlert("Only 'Y' or 'N' is allowed", "warning");
//                               handleInputChange(rowIndex, column, "");
//                             } else {
//                               handleInputChange(rowIndex, column, val);
//                             }
//                           }}
//                           onChange={(e) =>
//                             handleInputChange(
//                               rowIndex,
//                               column,
//                               constraints[column].type === "DOC"
//                                 ? e.target.files[0]
//                                 : e.target.value,
//                               `${rowIndex}-${columnIndex}`
//                             )
//                           }
//                           className={`flex ${
//                             Height ? "h-full py-1" : "h-9 py-1"
//                           } w-full dark:bg-input bg-white px-3 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300`}
//                           disabled={
//                             constraints[column].disabled && disabled ? true : false
//                           }
//                         />
//                       )}
//                     </td>
//                   );
//                 })}
//                 <td className="border px-4 h-4 text-center">
//                   <MdDelete
//                     className={`h-4 w-5 mx-auto text-red-500 hover:cursor-pointer text-exit ${
//                       disabled ? "opacity-50" : ""
//                     }`}
//                     onClick={() => !disabled && handleDeleteRow(rowIndex)}
//                   />
//                 </td>
//               </tr>
//             );
//           })}
//         </tbody>
//       </table>
//       {AddBtn && (
//         <div className="w-full flex justify-end">
//           <MdNoteAdd
//             className="h-7 w-7 text-green-500 hover:cursor-pointer "
//             onClick={() => addNewRow()}
//           />
//         </div>
//       )}
//     </>
//   );
// };

// export default YNDynamicTable;



























import React, { useState, useEffect, useRef } from "react";
import { MdDelete, MdNoteAdd } from "react-icons/md";
import "tailwindcss/tailwind.css";
import Swal from "sweetalert2";
import Eselect from "./Eselect";
import Fselect from "./Fselect";

const YNDynamicTable = ({
  columns,
  columnsShow,
  tableData,
  setTableData,
  constraints,
  disabledProp,
  DropDownOp = [],
  Height = 0,
  AddBtn = false,
}) => {
  const inputRefs = useRef({});

  function showSideAlert(message, type) {
    const Toast = Swal.mixin({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 5000,
      timerProgressBar: true,
      customClass: {
        container: "side-alert-container",
        popup: `side-alert-${type}`,
        title: "side-alert-title",
        icon: "side-alert-icon",
      },
    });

    Toast.fire({
      icon: type,
      title: message,
    });
  }

  const handleInputChange = (rowIndex, field, value, inputIndex) => {
    const constraint = constraints[field]?.type;
    const maxLength = constraints[field]?.max;

    // NUMBER type के लिए validation
    if (constraint === "NUMBER") {
      // केवल numbers और decimal point allow करें
      if (typeof value === "string") {
        // Remove any non-numeric characters except decimal point
        const numericValue = value.replace(/[^\d.]/g, '');
        
        // Ensure only one decimal point
        const parts = numericValue.split('.');
        if (parts.length > 2) {
          value = parts[0] + '.' + parts.slice(1).join('');
        } else {
          value = numericValue;
        }
        
        // Check max length
        if (maxLength !== undefined && value.length > maxLength) {
          value = value.substring(0, maxLength);
        }
      }
    } else if (typeof value === "string") { 
      // अन्य TEXT fields के लिए uppercase करें
      value = value.toUpperCase();
      
      if (maxLength !== undefined && value.length > maxLength) {
        value = value.substring(0, maxLength);
      }
    }

    const newData = tableData.map((item, index) => {
      if (index === rowIndex) {
        return { ...item, [field]: value || "" };
      }
      return item;
    });

    setTableData(newData);
  };

  const handleDeleteRow = (rowIndex) => {
    const newData = tableData.filter((_, index) => index !== rowIndex);
    setTableData(newData);
  };

  const handleKeyDown = (e, rowIndex, columnIndex) => {
    if (e.key === "Tab" && !e.shiftKey) {
      const lastRow = tableData[tableData.length - 1];
      if (
        rowIndex === tableData.length - 1 &&
        columnIndex === columns.length - 1
      ) {
        e.preventDefault();
        addNewRow();
      }
    }
  };

  const addNewRow = async () => {
    const lastRow = tableData[tableData.length - 1];

    if (lastRow) {
      const issueDate = new Date(lastRow.Issue_Date);
      const revokeDate = new Date(lastRow.Revoke_Date);

      if (issueDate > revokeDate) {
        lastRow.Issue_Date = "";
        lastRow.Revoke_Date = "";
        showSideAlert(
          "Issue Date cannot be earlier than Revoke Date. Both dates have been cleared.",
          "warning"
        );
        setTableData([...tableData]);
        return;
      }

      let allRequiredFieldsFilled = true;

      for (const [field, constraint] of Object.entries(constraints)) {
        const value = lastRow[field];
        if (
          constraint.required &&
          (value === null ||
            value === undefined ||
            value?.toString()?.trim() === "")
        ) {
          allRequiredFieldsFilled = false;
          showSideAlert(
            `Please fill in the ${field} before adding a new one.`,
            "warning"
          );
          break;
        }
      }

      if (!allRequiredFieldsFilled) {
        return;
      }
    }

    const newRow = {};
    setTableData([...tableData, newRow]);
  };

  useEffect(() => {
    if (tableData.length === 0) {
      addNewRow();
    } else {
      const rowsBeforeLast = tableData.slice(0, -1);
      const lastRow = tableData[tableData.length - 1];

      const newData = rowsBeforeLast.filter((row) =>
        Object.values(row).some((value) => value !== "")
      );

      newData.push(lastRow);

      if (newData.length !== tableData.length) {
        setTableData(newData);
      }
    }
  }, [tableData]);

  const isRowDisabled = (row) => {
    if ((row.UTD && row.UTD != null && row.UTD != undefined) || disabledProp) {
      return true;
    } else {
      return false;
    }
  };

  return (
    <>
      <table className="border table-auto w-full text-sm shadow-md">
        <thead className="sticky top-0 bg-white border dark:bg-primary dark dark:bg-opacity-10 z-1">
          <tr className="sticky top-0 z-10">
            <th className="border py-2 px-4 text-center uppercase">Sr.</th>
            {columnsShow?.map((column, index) => (
              <th
                key={index}
                className="border py-2 px-4 text-center uppercase"
              >
                {column}
              </th>
            ))}
            <th className="border py-2 px-4 text-center uppercase">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tableData?.map((item, rowIndex) => {
            const disabled = isRowDisabled(item);

            return (
              <tr key={rowIndex} className={`hover:bg-gray-100`}>
                <td className="border text-center h-4">{rowIndex + 1}</td>
                {columns?.map((column, columnIndex) => {
                  const isSelect = constraints[column]?.type === "Select";
                  const isNumber = constraints[column]?.type === "NUMBER";
                  
                  return (
                    <td key={columnIndex} className="border h-4">
                      {isSelect ? (
                        <Eselect
                          option={DropDownOp[column]}
                          name={item[column]}
                          mb={"0"}
                          initialValue={item[column]?.toString() || ""}
                          handleInputChange={(label, value) =>
                            handleInputChange(
                              rowIndex,
                              column,
                              value,
                              `${rowIndex}-${columnIndex}`
                            )
                          }
                          disabled={
                            constraints[column].disabled && disabled
                              ? true
                              : false
                          }
                        />
                      ) : (
                        <input
                          type={
                            constraints[column].type === "DOC"
                              ? "file"
                              : constraints[column].type === "DATE"
                              ? "date"
                              : "text"
                          }
                          value={
                            constraints[column].type === "DOC"
                              ? undefined
                              : item[column]
                              ? item[column]
                              : ""
                          }
                          accept={
                            constraints[column].type === "DOC"
                              ? "image/*,application/pdf"
                              : undefined
                          }
                          onKeyDown={(e) => {
                            handleKeyDown(e, rowIndex, columnIndex);
                            
                            if (constraints[column]?.type === "Y/N") {
                              const allowedKeys = [
                                "Y",
                                "N",
                                "Backspace",
                                "Tab",
                                "ArrowLeft",
                                "ArrowRight",
                                "Delete"
                              ];
                              const key = e.key.toUpperCase();
                              if (
                                !allowedKeys.includes(key) &&
                                key.length === 1
                              ) {
                                e.preventDefault();
                                showSideAlert("Only 'Y' or 'N' is allowed", "warning");
                              }
                            }
                            
                            // NUMBER type के लिए key validation
                            if (isNumber) {
                              const allowedKeys = [
                                "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
                                ".",
                                "Backspace",
                                "Tab",
                                "ArrowLeft",
                                "ArrowRight",
                                "Delete",
                                "Home",
                                "End"
                              ];
                              
                              if (!allowedKeys.includes(e.key) && 
                                  !(e.ctrlKey && (e.key === 'a' || e.key === 'c' || e.key === 'v' || e.key === 'x'))) {
                                e.preventDefault();
                                showSideAlert("Only numbers are allowed", "warning");
                              }
                            }
                          }}
                          onBlur={(e) => {
                            let val = e.target.value?.trim();
                            
                            if (constraints[column]?.type === "Y/N") {
                              const upperVal = val.toUpperCase();
                              if (upperVal && upperVal !== "Y" && upperVal !== "N") {
                                showSideAlert("Only 'Y' or 'N' is allowed", "warning");
                                handleInputChange(rowIndex, column, "");
                              } else {
                                handleInputChange(rowIndex, column, upperVal);
                              }
                            } else if (isNumber) {
                              // NUMBER field के लिए uppercase नहीं करें
                              handleInputChange(rowIndex, column, val);
                            } else {
                              // अन्य TEXT fields के लिए uppercase करें
                              handleInputChange(rowIndex, column, val.toUpperCase());
                            }
                          }}
                          onChange={(e) =>
                            handleInputChange(
                              rowIndex,
                              column,
                              constraints[column].type === "DOC"
                                ? e.target.files[0]
                                : e.target.value,
                              `${rowIndex}-${columnIndex}`
                            )
                          }
                          className={`flex ${
                            Height ? "h-full py-1" : "h-9 py-1"
                          } w-full dark:bg-input bg-white px-3 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300`}
                          disabled={
                            constraints[column].disabled && disabled ? true : false
                          }
                        />
                      )}
                    </td>
                  );
                })}
                <td className="border px-4 h-4 text-center">
                  <MdDelete
                    className={`h-4 w-5 mx-auto text-red-500 hover:cursor-pointer text-exit ${
                      disabled ? "opacity-50" : ""
                    }`}
                    onClick={() => !disabled && handleDeleteRow(rowIndex)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {AddBtn && (
        <div className="w-full flex justify-end">
          <MdNoteAdd
            className="h-7 w-7 text-green-500 hover:cursor-pointer "
            onClick={() => addNewRow()}
          />
        </div>
      )}
    </>
  );
};

export default YNDynamicTable;