import React, { useState, useEffect, useRef } from "react";
import { MdDelete, MdNoteAdd } from "react-icons/md";
import "tailwindcss/tailwind.css";
import Swal from "sweetalert2";
import Eselect from "./Eselect";
import Fselect from "./Fselect";

const TableComponent = ({
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
    const constraint = constraints[field].type;
    const maxLength = constraints[field].max;

    if (constraint === "NUMBER") {
      if (isNaN(value)) {
        return;
      }
    }
    if (maxLength !== undefined && value.length > maxLength) {
      value = value.substring(0, maxLength);
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
    if (e.key === "Tab") {
      if (e.shiftKey) {
        // If Shift + Tab is pressed, do the default behavior
        return;
      } else {
        const lastRow = tableData[tableData.length - 1];
        if (
          rowIndex === tableData.length - 1 &&
          columnIndex === columns.length - 1
        ) {
          e.preventDefault();
          addNewRow();
        }
      }
    }
  };

  const addNewRow = async () => {
    const lastRow = tableData[tableData.length - 1];

    if (lastRow) {
      const issueDate = lastRow.Issue_Date ? new Date(lastRow.Issue_Date) : null;
      const revokeDate = lastRow.Revoke_Date ? new Date(lastRow.Revoke_Date) : null;

      if (issueDate && revokeDate && issueDate > revokeDate) {
        lastRow.Issue_Date = "";
        lastRow.Revoke_Date = "";
        showSideAlert(
          "Issue Date cannot be later than Revoke Date. Dates cleared.",
          "warning"
        );
        setTableData([...tableData]);
        return;
      }

      // Check if all required fields are filled
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

      // If any required fields are missing, do not add a new row
      if (!allRequiredFieldsFilled) {
        return;
      }
    }

    const newRow = {};
    setTableData([...tableData, newRow]);
  };

  useEffect(() => {
    console.log(tableData);
    if (tableData.length === 0) {
      addNewRow(); // Add a new row if tableData is empty
    } else {
      // Create a copy of tableData excluding the last row
      const rowsBeforeLast = tableData.slice(0, -1);
      const lastRow = tableData[tableData.length - 1];

      // Check each row before the last row to see if it's empty
      const newData = rowsBeforeLast.filter((row) => {
        // Keeps rows that have at least one non-empty value
        return Object.values(row).some((value) => value !== "");
      });

      // Append the last row back into the data
      newData.push(lastRow);

      // Update the state if there are any changes
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
        <thead className="sticky top-0  bg-white border dark:bg-primary dark dark:bg-opacity-10 z-1">
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
                          onKeyDown={(e) =>
                            handleKeyDown(e, rowIndex, columnIndex)
                          }
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
                          className={`flex ${Height ? "h-full py-1" : "h-9 py-1"
                            } w-full dark:bg-input bg-white px-3 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300`}
                          disabled={
                            constraints[column].disabled && disabled
                              ? true
                              : false
                          }
                        />
                      )}
                    </td>
                  );
                })}
                <td className="border px-4 h-4 text-center">
                  <MdDelete
                    className={`h-4 w-5 mx-auto text-red-500 hover:cursor-pointer text-exit ${disabled ? "opacity-50" : ""
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

export default TableComponent;
