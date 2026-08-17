"use client"
import { useState } from "react";
import ExcelJS from "exceljs";
import saveAs from "file-saver";

function extractTextFromHtml(json) {
  if (typeof json === 'string') {
    return json; // Base case: if json is a string, return it
  }

  if (typeof json === 'object' && json !== null) {
    // Check if json has a "children" property
    if (json.props && json.props.children) {
      if (typeof json.props.children === 'string') {
        return json.props.children; // If children is a string, return it
      }

      // If children is an array, recursively extract text from each item
      if (Array.isArray(json.props.children)) {
        return json.props.children.map(child => extractTextFromHtml(child)).join(' ');
      }

      // If children is a nested object, recursively call extractTextFromHtml
      return extractTextFromHtml(json.props.children);
    }
  }

  return ''; // Return an empty string if no text is found
}
const useExcelDownload = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleExcelDownload = async (columns, filteredData) => {
    try {
      setIsLoading(true);

      const pathName = window.location.pathname.split("/").filter(Boolean).pop();
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Sheet 1");

      // Define headers for the worksheet based on the columns
      const headers = columns.map(col => ({ header: col.Header, key: col.accessor }));
      worksheet.columns = headers;

      // Loop through the filtered data and add rows to the worksheet
      filteredData.forEach(item => {
        const rowData = {};
        columns.forEach(col => {
          const { accessor, Cell } = col;
          let value1;
        
          if (accessor === "acnt_id") {
            // Directly take value from original object
            value1 = item[accessor];
          } else {
            try {
              if (typeof accessor === "function") {
                value1 = Cell({ value: accessor(item), row: { original: item } });
              } else {
                value1 = Cell({ value: item[accessor], row: { original: item } });
              }
            } catch (e) {
              if (typeof accessor === "function") {
                value1 = accessor(item);
              } else {
                value1 = item[accessor];
              }
            }
          }
        
          if (typeof value1 === "string") {
            rowData[accessor] = value1;
          } else if (typeof value1 === "object" && value1 !== null) {
            rowData[accessor] = extractTextFromHtml(value1);
          } else {
            rowData[accessor] = item[accessor];
          }
        });
        worksheet.addRow(rowData);
      });
      // setIsLoading(false);

      // return;
      // Style header row
      worksheet.getRow(1).eachCell(cell => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF00FF00" } // Green background for the headers
        };
        cell.font = { bold: true };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = {
          top: { style: "thin", color: { argb: "FF000000" } },
          left: { style: "thin", color: { argb: "FF000000" } },
          bottom: { style: "thin", color: { argb: "FF000000" } },
          right: { style: "thin", color: { argb: "FF000000" } }
        };
      });
      worksheet.columns.forEach(column => {
        let maxWidth = column.header.length + 5; // Initial width based on header length
        column.eachCell({ includeEmpty: true }, cell => {
          const cellLength = cell.value ? cell.value.toString().length : 0;
          if (cellLength > maxWidth) {
            maxWidth = cellLength;
          }
        });
        column.width = maxWidth + 2; // Add some padding to the max width
      });
      // Style data rows with borders
      worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
        if (rowNumber !== 1) { // Skip header row
          row.eachCell({ includeEmpty: true }, cell => {
            cell.border = {
              top: { style: "thin", color: { argb: "FF000000" } },
              left: { style: "thin", color: { argb: "FF000000" } },
              bottom: { style: "thin", color: { argb: "FF000000" } },
              right: { style: "thin", color: { argb: "FF000000" } }
            };
          });
        }
      });

      // Create the Excel file and trigger download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const fileName = pathName ? `${pathName} ${new Date().toDateString()}.xlsx` : `Excel_${new Date().toDateString()}.xlsx`;

      setTimeout(() => {
        saveAs(blob, fileName);
        setIsLoading(false);
      }, 750);

    } catch (e) {
      setIsLoading(false);
      console.error("Excel download error:", e);
    }
  };

  return { handleExcelDownload, isLoading };
};

export default useExcelDownload;
