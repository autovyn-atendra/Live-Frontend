import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const CustomDatePicker = ({
  label,
  value,
  onChange,
  name,
  redlabel,
  errorMessage,
  required,
  readOnly,
  disabled,
  className,
  max,
  isHighlight,
}) => {
  const handleDateChange = (selectedDate) => {
    if (selectedDate) {
      // Format as dd/MM/yyyy
      const pad = (n) => (n < 10 ? "0" + n : n);
      // const formatted = `${pad(selectedDate.getDate())}/${pad(
      //   selectedDate.getMonth() + 1
      // )}/${selectedDate.getFullYear()}`;
      const formatted = `${selectedDate.getFullYear()}-${pad(selectedDate.getMonth() + 1)}-${pad(selectedDate.getDate())}`;


      onChange(name, formatted); // Call parent handler with formatted date
    } else {
      onChange(name, "");
    }
  };

  // const parseDate = (value) => {
  //   if (!value) return null;

  //   const parts = value.split("/");
  //   if (parts.length === 3) {
  //     const [dd, mm, yyyy] = parts.map(Number);
  //     return new Date(yyyy, mm - 1, dd);
  //   }

  //   return new Date(value);
  // };


  const parseDate = (value) => {
    if (!value) return null;
  
    // If value is yyyy-MM-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [yyyy, mm, dd] = value.split("-").map(Number);
      return new Date(yyyy, mm - 1, dd);
    }
  
    // If value is dd/MM/yyyy
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      const [dd, mm, yyyy] = value.split("/").map(Number);
      return new Date(yyyy, mm - 1, dd);
    }
  
    // Last fallback
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  };
  

  return (
    <div className="w-full">
      {label && (
        <label className="flex text-xs font-semibold mt-1 mb-b  text-[#193A69] dark:text-[#E2E8F0]" htmlFor={name}>
          {label}
          {redlabel && <p className="text-exit text-xs -mt-[3px] ml-2 ">{redlabel}</p>}
          {errorMessage && <p className="text-exit text-xs ml-2 ">{errorMessage}</p>}
        </label>
      )}
      <DatePicker
        selected={parseDate(value)}
        onChange={handleDateChange}
        dateFormat="dd/MM/yyyy"
        isClearable = {true}
        placeholderText="DD/MM/YYYY"
        wrapperClassName="w-full"
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        className={`border border-[#b5bfcb] dark:border-[#D0D5DD] h-9 w-full rounded-md dark:bg-input bg-white dark:text-white px-3 py-1 text-sm text-black shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300
        ${isHighlight ? "bg-[#FFFFC5] dark:bg-[#FFFFC5] dark:text-black" : ""} ${className}`}
        maxDate={max ? new Date(max) : undefined}
      />
    </div>
  );
};

export default CustomDatePicker;
