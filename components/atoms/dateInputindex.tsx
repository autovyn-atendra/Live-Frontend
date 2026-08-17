import React, { ChangeEvent, FC, InputHTMLAttributes } from "react";
import { Input } from "../ui/input";
import DatePicker from "react-datepicker";
import { useEffect, useState,useRef } from 'react';
import "react-datepicker/dist/react-datepicker.css";

interface AinputProps extends InputHTMLAttributes<HTMLInputElement> {
  title: string;
  type: string;
  name: string;
  redlabel: string;
  onInput: (name: string, value: string) => void;
  handleInputChange: (name: string, value: string) => void;
  required?: boolean;
  value: string | number | null;
  readOnly?: string; // Should be readOnly, not readonly
  errorMessage?: string;
  max?: number | string;
  isHighlight: number | string;

}
const AinputDateIndex: FC<AinputProps> = ({
  title,
  name,
  handleInputChange,
  required,
  value,
  readOnly,
  redlabel,
  errorMessage,
  disabled,
  className,
  index,
  idx
}) => {

  const inputRef = useRef<HTMLInputElement>(null);

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
    return "";
  };

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

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Tab") {
      const inputValue = event.currentTarget.value.trim();

      if (!inputValue) return;

      const formatted = formatDateInput(inputValue);

      if (isValidDate(formatted)) {
        const parsedDate = new Date(formatted.replace(/\//g, "-"));
        handleInputChange(index, idx, name, parsedDate);
      } else {
        handleInputChange(index, idx, name, null);
      }
    }
  };

  return (
    <div className="w-full">
      <label className="flex text-xs mt-1 mb-1" htmlFor={name}>
        {title}
        {redlabel && <p className="text-exit text-xs -mt-[3px] ml-2">{redlabel}</p>}
        {errorMessage && <p className="text-exit text-xs ml-2">{errorMessage}</p>}
      </label>
      <DatePicker
        ref={inputRef}
        selected={value ? new Date(value) : null}
        onChange={(date) => handleInputChange(index, idx, name, date)}
        onKeyDown={handleKeyDown}
        dateFormat="dd/MM/yyyy"
        placeholderText="DD/MM/YYYY"
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        className={`flex h-8 w-28 rounded-md dark:bg-input bg-white px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      />
    </div>
  );
};

export default AinputDateIndex;
