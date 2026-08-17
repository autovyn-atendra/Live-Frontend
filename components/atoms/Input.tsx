import React, { ChangeEvent, FC, InputHTMLAttributes, useState } from "react";
import { Input } from "../ui/input";
import CustomDatePicker from "../Templates/CustomDatePicker";

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
  labelClass?: string;
  highlightLabel?: boolean;
  labelHighlightColor?: string; // Optional custom color
  labelHighlightClass?: string;
  autoComplete?: string;
  isUpperCase?: boolean;
  isBlackLabel?: boolean;

}

const Ainput: FC<AinputProps> = ({
  title,
  type,
  name,
  handleInputChange,
  required,
  value,
  readOnly,
  redlabel,
  errorMessage,
  onInput,
  onKeyDown,
  onBlur,
  disabled,
  isHighlight,
  className,
  max,
  ShortName,
  labelClass,
  highlightLabel = false,
  labelHighlightColor,
  labelHighlightClass,
  autoComplete,
  isUpperCase = false,
  isBlackLabel = false,
}) => {

  const [maxError, setMaxError] = useState("");
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const year = value.split('-')[0];
    if (type === "date") {
      if (year.length <= 4) {
        handleInputChange(name, value);
      }
    } else {
      if (max !== undefined) {
        if (value.length <= max) {
          handleInputChange(name, value);
          setMaxError("");
        } else {
          setMaxError(`Max ${max} characters allowed`);
        }
      } else {
        handleInputChange(name, value);
      }
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

  const getAutoComplete = () => {
    if (autoComplete !== undefined) return autoComplete;
    return "new-password";
  };

  return (
    <div className="relative w-full">
      <label
        className={`flex font-bold mt-1  mb-1 ${isUpperCase ? "uppercase" : ""} ${highlightLabel
          ? labelHighlightClass || "text-[#FF0000] dark:text-[#FF0000] font-bold"
          : isBlackLabel
            ? "text-black dark:text-white"
            : "text-[#193A69] dark:text-[#E2E8F0]"
          } ${labelClass || "text-xs"}`}
        htmlFor={name}
        style={labelHighlightColor && highlightLabel ? { color: labelHighlightColor } : {}}
      >
        {ShortName ? title : toTitleCase(title)}

        {redlabel && (
          <p className="text-exit text-xs -mt-[3px] ml-2 ">{redlabel}</p>
        )}
        {errorMessage && (
          <p className="text-exit text-xs ml-2 ">{errorMessage}</p>
        )}
      </label>


      {type === "date" ? (
        <CustomDatePicker
          name={name}
          onChange={handleInputChange}
          required={required}
          value={value}
          readOnly={readOnly}
          errorMessage={errorMessage}
          disabled={disabled}
          className={`h-9 ${isHighlight ? "bg-[#FFFFC5] dark:bg-[#FFFFC5] dark:text-black" : ""} ${className}`}
          max={max}
          isHighlight={isHighlight}
        />
      ) : (
        <>
          {maxError && (
            <p className="absolute right-1 top-[57px] text-[10px] text-exit font-semibold">
              {maxError}
            </p>
          )}


          <Input
            type={type}
            name={name}
            redlabel={redlabel}
            onChange={handleChange}
            value={value || ""}
            readOnly={readOnly}
            required={required}
            onInput={onInput}
            onKeyDown={onKeyDown}
            onBlur={onBlur}
            disabled={disabled}
            autoComplete={getAutoComplete()}
            autoCorrect="off"
            spellCheck={false}
            max={max}
            className={`h-9 ${isHighlight ? "bg-[#FFFFC5] dark:bg-[#FFFFC5] dark:text-black" : ""
              }  ${className}`}
          />

        </>
      )}


    </div>
  );
};

export default Ainput;