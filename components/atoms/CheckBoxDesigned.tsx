import React, { useEffect, useState } from "react";
import { Checkbox } from "antd";

interface CheckBoxDesignProps {
  firstvalue: boolean;
  className?: string;
  name: string;
  title: string;
  handleInputChange: (name: string, value: boolean) => void;
  disabled?: boolean;
}

const CheckBoxDesign: React.FC<CheckBoxDesignProps> = ({
  name,
  title,
  handleInputChange,
  className = "",
  firstvalue,
  disabled = false,
}) => {
  const [value, setValue] = useState(false);

  useEffect(() => {
    setValue(firstvalue);
  }, [firstvalue]);

  const handleClick = () => {
    if (disabled) return; // prevent click when disabled
    const newValue = !value;
    setValue(newValue);
    handleInputChange(name, newValue);
  };

  return (
    <label
      htmlFor={title}
      onClick={handleClick}
      className={`
        cursor-pointer text-center flex justify-between px-2
        ${value ? "bg-[#bfdbfe] dark:bg-[#5f679f]" : "text-[#7c7f85] dark:text-white dark:bg-input ring-1"}
        ${disabled ? "opacity-60 cursor-not-allowed" : ""}
        rounded h-8 flex items-center hover:shadow-sm hover:shadow-dark font-medium ${className}
      `}
    >
      <Checkbox
        checked={value}
        disabled={disabled}
        className="mr-2"
        name={name}
      />
      {title}
    </label>
  );
};

export default CheckBoxDesign;
