// import React, { ChangeEvent, FC, InputHTMLAttributes, useState } from "react";
// import { Input } from "../ui/input";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";

// interface AinputProps extends InputHTMLAttributes<HTMLInputElement> {
//   title: string;
//   type: string;
//   name: string;
//   redlabel: string;
//   onInput: (name: string, value: string) => void;
//   handleInputChange: (name: string, value: string) => void;
//   required?: boolean;
//   value: string | number | null;
//   readOnly?: string; // Should be readOnly, not readonly
//   errorMessage?: string;
//   max?: number | string;
//   isHighlight: number | string;

// }

// const AinputDate: FC<AinputProps> = ({
//   title,
//   name,
//   handleInputChange,
//   required,
//   value,
//   readOnly,
//   redlabel,
//   errorMessage,
//   disabled,
//   isHighlight,
//   className,
//   max
// }) => {
//   const handleChange = (name, value) => {
//     // Parse the input date
//     const dateObject = new Date(value);

//     // Convert the date into a proper format (e.g., YYYY-MM-DD)
//     const formattedDate = dateObject.toISOString().split('T')[0]; // Extract only the date part
//     // Pass the formatted date to the handler
//     handleInputChange(name, formattedDate);
//   };

//   const formatDateInput = (input: string): string => {
//     if (input.length === 6) {
//       const day = input.slice(0, 2);
//       const month = input.slice(2, 4);
//       const year = `20${input.slice(4, 6)}`;
//       return `${year}/${month}/${day}`
//     } else if (input.length === 8) {
//       const day = input.slice(0, 2);
//       const month = input.slice(2, 4);
//       const year = input.slice(4);
//       return `${year}/${month}/${day}`;
//     } else if (input.length === 4) {
//       const day = input.slice(0, 2);
//       const month = input.slice(2, 4);
//       const year = new Date().getFullYear()
//       return `${year}/${month}/${day}`;
//     }
//     return input;
//   };
//   const isValidDate = (dateString: string): boolean => {
//     const regex = /^\d{4}\/\d{2}\/\d{2}$/; // Regular expression to match YYYY/MM/DD format
//     if (!regex.test(dateString)) return false; // Check format
//     const [year, month, day] = dateString.split("/").map(Number); // Split and parse the components
//     const date = new Date(year, month - 1, day); // Create a Date object

//     // Check if the components match the actual date
//     return (
//       date.getFullYear() === year &&
//       date.getMonth() === month - 1 &&
//       date.getDate() === day
//     );
//   };
//   const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
//     if (event.key === "Tab") {
//       const inputValue = event.currentTarget.value; // Capture the input value as typed
//       const date = formatDateInput(inputValue); // Format the date
//       if (isValidDate(date)) {
//         const [year, month, day] = date.split('/').map(Number);
//         const dateObject = new Date(year, month - 1, day + 1); // Month is 0-indexed in JavaScript
//         // Convert to desired format
//         const formattedDate = dateObject.toString();
//         handleChange(name, formattedDate); // If valid, update the value
//       } else {
//         console.error("Invalid date format or value.");
//         handleChange(name, ""); // Optionally clear or show an error
//       }
//     }
//   };
//   // const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
//   //   const inputValue = event.target.value; // Capture the input value as typed
//   //   const date = formatDateInput(inputValue)
//   //   if (isValidDate(date)) {
//   //     handleInputChange(name, date);
//   //   } else {
//   //     console.error("Invalid date format or value.");
//   //     handleInputChange(name, "");
//   //   }
//   // };
//   return (
//     <div className="relative w-full">
//       <label className="flex  text-xs font-bold mt-1 mb-1" htmlFor={name}>
//         {title}
//         {redlabel && (
//           <p className="text-exit text-xs -mt-[3px] ml-2 ">{redlabel}</p>
//         )}
//         {errorMessage && (
//           <p className="text-exit text-xs ml-2 ">{errorMessage}</p>
//         )}
//       </label>
//       <DatePicker
//         selected={value}
//         onChange={(date: string) => handleChange(name, date)}
//         dateFormat="dd/MM/yyyy"
//         onKeyDown={handleKeyDown}
//         className={`flex h-9 w-full  rounded-md dark:bg-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300}  ${className}`}
//         disabled={disabled}
//         placeholderText={"DD/MM/YYYY"}
//         readOnly={readOnly}
//         required={required}
//       />
//     </div>
//   );
// };

// export default AinputDate;



// import React, { FC, KeyboardEvent } from "react";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";

// // Add this CSS directly in your component file
// const datePickerStyles = `
//   .react-datepicker-wrapper {
//     width: 100% !important;
//   }
//   .react-datepicker__input-container {
//     width: 100% !important;
//   }
//   .react-datepicker__input-container input {
//     width: 100% !important;
//   }
// `;

// interface AinputProps {
//   title: string;
//   name: string;
//   redlabel?: string;
//   handleInputChange: (name: string, value: string) => void;
//   required?: boolean;
//   value?: string | number | null;
//   readOnly?: boolean;
//   errorMessage?: string;
//   disabled?: boolean;
//   className?: string;
//   max?: number | string;
//   isHighlight?: number | string;
// }

// const AinputDate: FC<AinputProps> = ({
//   title,
//   name,
//   handleInputChange,
//   required = false,
//   value = null,
//   readOnly = false,
//   redlabel = "",
//   errorMessage = "",
//   disabled = false,
//   className = "",
//   max,
//   isHighlight
// }) => {
//   const handleChange = (name: string, date: Date | null) => {
//     if (!date) {
//       handleInputChange(name, "");
//       return;
//     }
   
//     const formattedDate = date.toISOString().split('T')[0];
//     handleInputChange(name, formattedDate);
//   };

//   const formatDateInput = (input: string): string => {
//     if (input.length === 6) {
//       const day = input.slice(0, 2);
//       const month = input.slice(2, 4);
//       const year = `20${input.slice(4, 6)}`;
//       return `${year}/${month}/${day}`;
//     } else if (input.length === 8) {
//       const day = input.slice(0, 2);
//       const month = input.slice(2, 4);
//       const year = input.slice(4);
//       return `${year}/${month}/${day}`;
//     } else if (input.length === 4) {
//       const day = input.slice(0, 2);
//       const month = input.slice(2, 4);
//       const year = new Date().getFullYear();
//       return `${year}/${month}/${day}`;
//     }
//     return input;
//   };

//   const isValidDate = (dateString: string): boolean => {
//     const regex = /^\d{4}\/\d{2}\/\d{2}$/;
//     if (!regex.test(dateString)) return false;
//     const [year, month, day] = dateString.split("/").map(Number);
//     const date = new Date(year, month - 1, day);
//     return (
//       date.getFullYear() === year &&
//       date.getMonth() === month - 1 &&
//       date.getDate() === day
//     );
//   };

//   const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
//     if (event.key === "Tab") {
//       const inputValue = event.currentTarget.value;
//       const date = formatDateInput(inputValue);
//       if (isValidDate(date)) {
//         const [year, month, day] = date.split('/').map(Number);
//         const dateObject = new Date(year, month - 1, day);
//         handleChange(name, dateObject);
//       } else {
//         handleChange(name, null);
//       }
//     }
//   };

//   const parseDateValue = (value: string | number | null): Date | null => {
//     if (!value) return null;
//     return new Date(String(value));
//   };

//   return (
//     <div className="relative w-full">
//       {/* Inject the CSS styles */}
//       <style>{datePickerStyles}</style>
     
//       <label className="flex items-center text-xs font-bold mt-1 mb-1" htmlFor={name}>
//         {title}
//         {redlabel && (
//           <span className="text-red-500 text-xs ml-2">{redlabel}</span>
//         )}
//         {errorMessage && (
//           <span className="text-red-500 text-xs ml-2">{errorMessage}</span>
//         )}
//       </label>
     
//       <div className="w-full">
//         <DatePicker
//           selected={parseDateValue(value)}
//           onChange={(date: Date | null) => handleChange(name, date)}
//           dateFormat="dd/MM/yyyy"
//           onKeyDown={handleKeyDown}
//           className={`z-20
//             flex h-9 w-full  rounded-md dark:bg-input bg-white px-3 py-1 text-sm
//             shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm
//             file:font-medium placeholder:text-slate-500 focus-visible:outline-none
//             focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed
//             disabled:opacity-50 dark:border-slate-800 dark:placeholder:text-slate-400
//             dark:focus-visible:ring-slate-300}  ${className}
//             ${isHighlight ? "ring-2 ring-yellow-400" : ""}
//           `}
//           wrapperClassName="w-full"
//           disabled={disabled}
//           placeholderText="DD/MM/YYYY"
//           readOnly={readOnly}
//           required={required}
//           maxDate={max ? new Date(max) : undefined}
//         />
//       </div>
//     </div>
//   );
// };

// export default AinputDate;




import React, { FC, KeyboardEvent } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Add this CSS directly in your component file
const datePickerStyles = `
  .react-datepicker-wrapper {
    width: 100% !important;
  }
  .react-datepicker__input-container {
    width: 100% !important;
  }
  .react-datepicker__input-container input {
    width: 100% !important;
  }
`;

interface AinputProps {
  title: string;
  name: string;
  redlabel?: string;
  handleInputChange: (name: string, value: string) => void;
  required?: boolean;
  value?: string | number | null;
  readOnly?: boolean;
  errorMessage?: string;
  disabled?: boolean;
  className?: string;
  max?: number | string;
  isHighlight?: number | string;
  index?: number;
idx?: number;
isCompact?: boolean;
isBlackLabel?: boolean;
isIndexedDate?: boolean;
 highZIndex?: boolean;
}

const AinputDate: FC<AinputProps> = ({
  title,
  name,
  handleInputChange,
  required = false,
  value = null,
  readOnly = false,
  redlabel = "",
  errorMessage = "",
  disabled = false,
  className = "",
  max,
  isHighlight,
  index,
  isBlackLabel = false,
idx,
isCompact = false,
isIndexedDate = false,
highZIndex = false,
  attenDtl
}) => {
  const handleChange = (name: string, date: Date | null) => {
    if (!date) {
      handleInputChange(name, "");
      return;
    }

    const now = new Date();
    date.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

    const pad = (n: number) => (n < 10 ? "0" + n : n);
    const formatted = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;

    handleInputChange(name, formatted);
  };

  const formatDateInput = (input: string): string => {
    const clean = input.replace(/[^\d]/g, "");
    if (clean.length === 6) {
      const day = clean.slice(0, 2);
      const month = clean.slice(2, 4);
      const year = `20${clean.slice(4, 6)}`;
      return `${year}/${month}/${day}`;
    } else if (clean.length === 8) {
      const day = clean.slice(0, 2);
      const month = clean.slice(2, 4);
      const year = clean.slice(4);
      return `${year}/${month}/${day}`;
    } else if (clean.length === 4) {
      const day = clean.slice(0, 2);
      const month = clean.slice(2, 4);
      const year = new Date().getFullYear();
      return `${year}/${month}/${day}`;
    }
    return clean;
  }

  const isValidDate = (dateString: string): boolean => {
    const regex = /^\d{4}\/\d{2}\/\d{2}$/;
    if (!regex.test(dateString)) return false;
    const [year, month, day] = dateString.split("/").map(Number);
    const date = new Date(year, month - 1, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Tab") {
      const inputValue = event.currentTarget.value;
      if (!inputValue.trim()) return;
      const date = formatDateInput(inputValue);
      if (isValidDate(date)) {
        const [year, month, day] = date.split('/').map(Number);
        const dateObject = new Date(year, month - 1, day);
       if (isIndexedDate) {
  handleInputChange(index, idx, name, dateObject);
} else {
  handleChange(name, dateObject);
}
      } else {
        handleChange(name, null);
      }
    }
  };

  const parseDateValue = (value: string | number | null): Date | null => {
    if (!value) return null;
    return new Date(String(value));
  };

  const toTitleCase = (str) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="relative w-full">
      {/* Inject the CSS styles */}
      <style>{datePickerStyles}</style>
      <label className={`flex items-center whitespace-nowrap ${isBlackLabel
  ? "text-black dark:text-white"
  : "text-[#193A69] dark:text-[#E2E8F0]"
} ${isCompact ? "text-xs" : attenDtl || "text-xs"}font-bold ${isCompact ? "" : "mt-1 mb-1"}`} htmlFor={name}>
        {toTitleCase(title)}
        {redlabel && (
          <span className="text-red-500 text-xs ml-2">{redlabel}</span>
        )}
        {errorMessage && (
          <span className="text-red-500 text-xs ml-2">{errorMessage}</span>
        )}
      </label>
     
      <div className="w-full">
        <DatePicker
          selected={parseDateValue(value)}
          onChange={(date: Date | null) => {
  if (isIndexedDate) {
    handleInputChange(index, idx, name, date);
  } else {
    handleChange(name, date);
  }
}}
          dateFormat="dd/MM/yyyy"
          onKeyDown={handleKeyDown}
       portalId={highZIndex ? "root-datepicker-portal" : undefined} 
          popperProps={highZIndex ? { style: { zIndex: 9999 } } : undefined} 
          className={`z-20 border border-[#b5bfcb] dark:border-[#D0D5DD]
            flex ${isCompact ? "h-8 w-28 text-xs" : "h-9 w-full text-sm"} rounded-md dark:bg-input bg-white px-3 py-1 text-sm
            shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm
            file:font-medium placeholder:text-slate-500 focus-visible:outline-none
            focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed
            disabled:opacity-50 dark:border-slate-800 dark:placeholder:text-slate-400
            dark:focus-visible:ring-slate-300}  ${className}
            ${isHighlight ? "ring-2 ring-yellow-400" : ""}
          `}
          wrapperClassName="w-full"
          disabled={disabled}
          placeholderText="DD/MM/YYYY"
          readOnly={readOnly}
          required={required}
          maxDate={max ? new Date(max) : undefined}
        />
      </div>
    </div>
  );
};

export default AinputDate;