import React, { ChangeEvent, FC, InputHTMLAttributes } from "react";
import { Input } from "../ui/input";

interface AinputProps extends InputHTMLAttributes<HTMLInputElement> {
  title: string;
  type: string;
  name: string;
  disabled: boolean;
  onInput: (name: string, value: string) => void;
  handleInputChange: (name: string, value: string) => void;
  required?: boolean;
  value: string | number | null;
  readOnly?: boolean; // Should be readOnly, not readonly
  errorMessage?: string;
  redlabel?: string;
}

const Ainput: FC<AinputProps> = ({
  title,
  type,
  name,
  handleInputChange,
  required,
  value,
  readOnly,
  disabled,
  errorMessage,
  className,
  maxLength,
  onKeyDown,
  redlabel,
  onInput,
  height,
  ShortName
}) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const year = value.split('-')[0];
    if (type == "date") {
      if (year.length <= 4) {
        handleInputChange(name, value);
      };
    } else {
      handleInputChange(name, value);
    }
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
      <label className="flex  capitalize  text-xs font-bold mt-1 mb-1 text-header dark:text-white" htmlFor={name}>
        {ShortName ? title : toTitleCase(title)}{redlabel && <p className="text-exit text-xs -mt-[3px] ml-2 ">{redlabel}</p>}{errorMessage && <p className="text-exit text-xs ml-2 ">{errorMessage}</p>}
      </label>

      <Input
        className={`h-[35px] ${className}`}
        type={type}
        name={name}
        onChange={handleChange}
        value={value || ""}
        required={required}
        onInput={onInput}
        disabled={disabled}
        onKeyDown={onKeyDown}
        readOnly={readOnly}
        maxLength={maxLength}
        autoComplete="new-password"
        autoCorrect="off"
        spellCheck={false}
      />

    </div>
  );
};

export default Ainput;
