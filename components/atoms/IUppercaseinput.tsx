import React, { ChangeEvent, FC, InputHTMLAttributes } from "react";
import { Input } from "../ui/input";


const IUppercaseinput: FC<AinputProps> = ({
  title,
  type,
  name,
  handleInputChange,
  required,
  value,
  readOnly,
  errorMessage,
  onInput,
}) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.toUpperCase();
    handleInputChange(name, value);
  };

  return (
    <div className="relative w-full">
      <label className="flex text-xs font-bold" htmlFor={name}>
        {title}{errorMessage && <p className="text-exit text-xs ml-2 ">{errorMessage}</p>}
      </label>

      <Input
        type={type}
        name={name}
        onChange={handleChange}
        value={value || ""}
        readOnly={readOnly}
        required={required}
        onInput={onInput}
        className={`h-[25px]`}
        autoComplete="new-password"
        autoCorrect="off"
        spellCheck={false}
      />

    </div>
  );
};

export default IUppercaseinput;
