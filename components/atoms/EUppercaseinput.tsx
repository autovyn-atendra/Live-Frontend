import React, { ChangeEvent, FC, InputHTMLAttributes } from "react";
import { Input } from "../ui/input";

interface UpperscseinputProps extends InputHTMLAttributes<HTMLInputElement> {
  title: string;
  type: string;
  name: string;
  disabled: string;
  onInput: (name: string, value: string) => void;
  handleInputChange: (name: string, value: string) => void;
  required?: boolean;
  value: string | number | null;
  readOnly?: string; // Should be readOnly, not readonly
  errorMessage?: string;
  redlabel: string

}

const EUppercaseinput: FC<AinputProps> = ({
  title,
  type,
  name,
  disabled,
  handleInputChange,
  required,
  value,
  readOnly,
  errorMessage,
  onInput,
  redlabel,
  maxLength
}) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.toUpperCase();
    handleInputChange(name, value);
  };

  return (
    <div className="relative w-full">
      <label className="flex   text-xs font-bold mt-1 mb-1 text-[#193A69] dark:text-[#E2E8F0]" htmlFor={name}>
        {title}{redlabel && <p className="text-exit text-xs -mt-[3px] ml-2 ">{redlabel}</p>}{errorMessage && <p className="text-exit text-xs ml-2 ">{errorMessage}</p>}
      </label>


      <Input
        type={type}
        disabled={disabled}
        name={name}
        onChange={handleChange}
        value={value || ""}
        readOnly={readOnly}
        required={required}
        onInput={onInput}
        className={`h-[30px]`}
        maxLength={maxLength}
        autoComplete="new-password"
        autoCorrect="off"
        spellCheck={false}
      />

    </div>
  );
};

export default EUppercaseinput;
