

// "use client"
// import { useState } from "react";
// import ExcelJS from "exceljs";
// import saveAs from "file-saver";

// function extractTextFromHtml(json) {
//   if (typeof json === 'string') {
//     return json;
//   }

//   if (typeof json === 'object' && json !== null) {
//     if (json.props && json.props.children) {
//       if (typeof json.props.children === 'string') {
//         return json.props.children;
//       }

//       if (Array.isArray(json.props.children)) {
//         return json.props.children.map(child => extractTextFromHtml(child)).join(' ');
//       }

//       return extractTextFromHtml(json.props.children);
//     }
//   }

//   return '';
// }

// const useExcelDownload = () => {
//   const [isLoading, setIsLoading] = useState(false);

//   const handleExcelDownload = async (columns, filteredData) => {
//     try {
//       setIsLoading(true);

//       const pathName = window.location.pathname.split("/").filter(Boolean).pop();
//       const workbook = new ExcelJS.Workbook();
//       const worksheet = workbook.addWorksheet("Sheet 1");

//       // Define headers for the worksheet based on the columns
//       const headers = columns.map(col => ({ header: col.Header, key: col.accessor }));
//       worksheet.columns = headers;

//       // Process data and identify date columns
//       const dateColumns = new Set();

//       filteredData.forEach(item => {
//         const rowData = {};
//         columns.forEach(col => {
//           const { accessor, Cell } = col;
//           let value1;

//           if (accessor === "acnt_id") {
//             value1 = item[accessor];
//           } else {
//             try {
//               if (typeof accessor === "function") {
//                 value1 = Cell({ value: accessor(item), row: { original: item } });
//               } else {
//                 value1 = Cell({ value: item[accessor], row: { original: item } });
//               }
//             } catch (e) {
//               if (typeof accessor === "function") {
//                 value1 = accessor(item);
//               } else {
//                 value1 = item[accessor];
//               }
//             }
//           } 
//           if (typeof value1 === "string" && isDateString(value1)) {
//             dateColumns.add(accessor);
//           }
//           if (typeof value1 === "string") {
//             rowData[accessor] = value1;
//           } else if (typeof value1 === "object" && value1 !== null) {
//             rowData[accessor] = extractTextFromHtml(value1);
//           } else {
//             rowData[accessor] = item[accessor];
//           }
//         });
//         worksheet.addRow(rowData);
//       });

//       // Style header row - GREEN COLOR MAINTAINED
//       worksheet.getRow(1).eachCell(cell => {
//         cell.fill = {
//           type: "pattern",
//           pattern: "solid",
//           fgColor: { argb: "FF00FF00" } // Green background for the headers
//         };
//         cell.font = { bold: true };
//         cell.alignment = { vertical: "middle", horizontal: "center" };
//         cell.border = {
//           top: { style: "thin", color: { argb: "FF000000" } },
//           left: { style: "thin", color: { argb: "FF000000" } },
//           bottom: { style: "thin", color: { argb: "FF000000" } },
//           right: { style: "thin", color: { argb: "FF000000" } }
//         };
//       });

//       // Auto-width for columns
//       worksheet.columns.forEach(column => {
//         let maxWidth = column.header ? column.header.length + 5 : 10;
//         column.eachCell({ includeEmpty: true }, cell => {
//           const cellLength = cell.value ? cell.value.toString().length : 0;
//           if (cellLength > maxWidth) {
//             maxWidth = cellLength;
//           }
//         });
//         column.width = maxWidth + 2;
//       });

//       // Style data rows with borders
//       worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
//         if (rowNumber !== 1) {
//           row.eachCell({ includeEmpty: true }, cell => {
//             cell.border = {
//               top: { style: "thin", color: { argb: "FF000000" } },
//               left: { style: "thin", color: { argb: "FF000000" } },
//               bottom: { style: "thin", color: { argb: "FF000000" } },
//               right: { style: "thin", color: { argb: "FF000000" } }
//             };
//           });
//         }
//       });

//       // Format date columns to show full date but allow year filtering
//       worksheet.columns.forEach((column, colIndex) => {
//         const header = headers[colIndex];
//         if (dateColumns.has(header.key)) {
//           column.eachCell((cell) => {
//             if (cell.row.number !== 1 && cell.value) { // Skip header row
//               // Convert to proper Excel date if it's a date string
//               if (typeof cell.value === 'string' && isDateString(cell.value)) {
//                 const date = parseDateString(cell.value);
//                 if (date) {
//                   cell.value = date;
//                   cell.numFmt = 'dd mmm yyyy'; // Format: 06 Dec 2008
//                 }
//               }
//             }
//           });
//         }
//       });

//       // Add filters to all columns (this will enable year filtering for date columns)
//       worksheet.autoFilter = {
//         from: 'A1',
//         to: `${String.fromCharCode(65 + headers.length - 1)}1`,
//       };

//       const buffer = await workbook.xlsx.writeBuffer();
//       const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
//       const fileName = pathName ? `${pathName} ${new Date().toDateString()}.xlsx` : `Excel_${new Date().toDateString()}.xlsx`;

//       setTimeout(() => {
//         saveAs(blob, fileName);
//         setIsLoading(false);
//       }, 750);

//     } catch (e) {
//       setIsLoading(false);
//       console.error("Excel download error:", e);
//     }
//   };

//   return { handleExcelDownload, isLoading };
// };

// // Helper function to check if string is a date
// function isDateString(str) {
//   if (typeof str !== 'string') return false;

//   // Common date patterns
//   const datePatterns = [
//     /\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{4}/i, // 06 Dec 2008
//     /\d{1,2}\/\d{1,2}\/\d{4}/, // MM/DD/YYYY
//     /\d{4}-\d{1,2}-\d{1,2}/, // YYYY-MM-DD
//   ];
//   return datePatterns.some(pattern => pattern.test(str));
// }

// // Helper function to parse date string
// function parseDateString(dateString) {
//   if (!dateString) return null;

//   // Parse "06 Dec 2008" format
//   const match = dateString.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/i);
//   if (match) {
//     const [, day, month, year] = match;
//     const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep','oct', 'nov', 'dec'];
//     const monthIndex = monthNames.findIndex(m => m === month.toLowerCase());
//     if (monthIndex !== -1) {
//       return new Date(year, monthIndex, parseInt(day));
//     }
//   }

//   // Try default date parsing
//   const date = new Date(dateString);
//   return isNaN(date.getTime()) ? null : date;
// }

// export default useExcelDownload;








"use client"
import { useState } from "react";
import ExcelJS from "exceljs";
import saveAs from "file-saver";

function extractTextFromHtml(json) {
  if (typeof json === 'string') {
    return json;
  }

  if (typeof json === 'object' && json !== null) {
    if (json.props && json.props.children) {
      if (typeof json.props.children === 'string') {
        return json.props.children;
      }

      if (Array.isArray(json.props.children)) {
        return json.props.children.map(child => extractTextFromHtml(child)).join(' ');
      }

      return extractTextFromHtml(json.props.children);
    }
  }

  return '';
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

      // Process data and identify date columns
      const dateColumns = new Set();

      filteredData.forEach(item => {
        const rowData = {};
        columns.forEach(col => {
          const { accessor, Cell } = col;
          let value1;

          if (accessor === "acnt_id") {
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
          if (typeof value1 === "string" && isDateString(value1)) {
            dateColumns.add(accessor);
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

      // Style header row - GREEN COLOR MAINTAINED
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

      // Auto-width for columns
      worksheet.columns.forEach(column => {
        let maxWidth = column.header ? column.header.length + 5 : 10;
        column.eachCell({ includeEmpty: true }, cell => {
          const cellLength = cell.value ? cell.value.toString().length : 0;
          if (cellLength > maxWidth) {
            maxWidth = cellLength;
          }
        });
        column.width = maxWidth + 2;
      });

      // Style data rows with borders
      worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
        if (rowNumber !== 1) {
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

      // FIXED DATE HANDLING - Timezone issue resolved
      worksheet.columns.forEach((column, colIndex) => {
        const header = headers[colIndex];
        if (dateColumns.has(header.key)) {
          column.eachCell((cell) => {
            if (cell.row.number !== 1 && cell.value) { // Skip header row
              // Convert to proper Excel date if it's a date string
              if (typeof cell.value === 'string' && isDateString(cell.value)) {
                const date = parseDateString(cell.value);
                if (date) {
                  // FIX: Use Excel serial number directly to avoid timezone issues
                  const excelSerialNumber = convertDateToExcelSerial(date);
                  cell.value = excelSerialNumber;
                  cell.numFmt = 'dd mmm yyyy'; // Format: 06 Dec 2008
                }
              }
            }
          });
        }
      });

      // Add filters to all columns (this will enable year filtering for date columns)
      worksheet.autoFilter = {
        from: 'A1',
        to: `${String.fromCharCode(65 + headers.length - 1)}1`,
      };

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

// Helper function to check if string is a date
function isDateString(str) {
  if (typeof str !== 'string') return false;

  // Common date patterns
  const datePatterns = [
    /\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{4}/i, // 06 Dec 2008
    /\d{1,2}\/\d{1,2}\/\d{4}/, // MM/DD/YYYY
    /\d{4}-\d{1,2}-\d{1,2}/, // YYYY-MM-DD
  ];
  return datePatterns.some(pattern => pattern.test(str));
}

// Helper function to parse date string
function parseDateString(dateString) {
  if (!dateString) return null;

  // Parse "06 Dec 2008" format
  const match = dateString.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/i);
  if (match) {
    const [, day, month, year] = match;
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const monthIndex = monthNames.findIndex(m => m === month.toLowerCase());
    if (monthIndex !== -1) {
      // FIX: Create date in local timezone without time component
      return new Date(parseInt(year), monthIndex, parseInt(day), 12, 0, 0); // Set to noon to avoid timezone issues
    }
  }

  // Try default date parsing
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

// NEW FUNCTION: Convert JavaScript Date to Excel serial number
function convertDateToExcelSerial(date) {
  // Excel uses January 1, 1900 as serial number 1
  // JavaScript uses January 1, 1970 as epoch
  const excelEpoch = new Date(1900, 0, 1);
  const msPerDay = 24 * 60 * 60 * 1000;

  // Calculate difference in days
  const diffInMs = date - excelEpoch;
  const diffInDays = diffInMs / msPerDay;

  // Excel considers 1900 as leap year (bug in Excel), so add 2 days
  return diffInDays + 2;
}

export default useExcelDownload;