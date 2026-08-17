import React, { useEffect, useState } from "react";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";

const CustomInputWithDatalist = ({
  idPrefix,
  className,
  name,
  selectedValue,
  title,
  options,
  handleInputChange,
  redlabel
}) => {
  const inputId = `${idPrefix}-input`;
  const [selected, setSelected] = useState(selectedValue);
  const [debouncedValue, setDebouncedValue] = useState(selectedValue);
  const [selectedLabel, setSelectedLabel] = useState("");

  useEffect(() => {
    setSelected(selectedValue);
  }, [selectedValue]);

  const [optionValues, setOptionValues] = useState([]);
  useEffect(() => {
    // Extract values from options array
    const values = options?.map((option) => option?.value?.toString());
    setOptionValues(values);
    console.log("option changes ");
  }, [options]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedValue(selected);
    }, 200); // Adjust the delay as needed (500 milliseconds in this case)

    return () => clearTimeout(timeout);
  }, [selected]);

  const handleSelectionChange = (e) => {
    const newValue = e.target.value;
    setSelected(newValue);
    const selectedOption = options.find((option) => option.value == newValue);
    setSelectedLabel(selectedOption ? selectedOption.label : "");
  };

  useEffect(() => {
    if (!optionValues?.includes(debouncedValue?.toString())) {
      if (debouncedValue == null || debouncedValue == "") {
        setSelectedLabel("");
      } else {
        return;
      }
    }
    handleInputChange(name, debouncedValue ? debouncedValue : "");
  }, [debouncedValue, optionValues]);


  const toTitleCase = (str) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };


  return (
    <>
      <label className="flex capitalize text-base mt-1 font-semibold mb-1 text-[#193a69] dark:text-[#38bdf8]" htmlFor={name}>
        {toTitleCase(title)}
        {redlabel && <p className="text-exit text-xs -mt-1 ml-2">{redlabel}</p>}
      </label>
      <input
        autoComplete="off"
        className={cn(
          "border border-borderColor dark:border-borderColor-dark text-[#193a69] dark:text-[#e2e8f0]  flex h-9 w-full rounded-md dark:bg-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300",
          className
        )}
        type="text"
        id={inputId}
        list={`${idPrefix}-datalist`}
        value={selected}
        onChange={handleSelectionChange}
      />
      {/* {selectedLabel && (
        <p className="text-xs text-gray-500 mt-1">{selectedLabel}</p>
      )} */}
      <datalist id={`${idPrefix}-datalist`} className="w-full">
        {options?.map((option, index) => (
          <option key={index} value={option.value}>
            {option.label}
          </option>
        ))}
      </datalist>
    </>
  );
};

export default CustomInputWithDatalist;
