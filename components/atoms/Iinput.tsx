import React, { ChangeEvent, FC, InputHTMLAttributes } from "react";
import { Input } from "../ui/input";

interface IinputProps extends InputHTMLAttributes<HTMLInputElement> {
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

const Iinput: FC<IinputProps> = ({
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


  return (
    <div className="relative w-full">
      <label className="flex   text-xs font-bold" htmlFor={name}>
        {title}{redlabel && <p className="text-exit text-xs -mt-[3px] ml-2 ">{redlabel}</p>}{errorMessage && <p className="text-exit text-xs ml-2 ">{errorMessage}</p>}
      </label>

      <Input
        className={`h-[25px] ${className}`}
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

export default Iinput;



