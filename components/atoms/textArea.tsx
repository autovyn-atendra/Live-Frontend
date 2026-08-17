import React, {
  ChangeEvent,
  FunctionComponent,
  TextareaHTMLAttributes, useState,
} from 'react';

// Define the props for the ATextArea component
interface ATextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  title: string;
  name: string;
  handleInputChange: (name: string, value: string) => void;
  required?: boolean;
  disabled?: boolean;
  value: string | undefined;
  rows: number;
  onKeyDown?: React.KeyboardEventHandler<HTMLTextAreaElement>;
  redlabel?: string;
  placeholder?: string;
  className?: string;
  max?: string;
}

// Typing the component using FunctionComponent with the ATextAreaProps interface
const ATextArea: FunctionComponent<ATextAreaProps> = ({
  title,
  name,
  handleInputChange,
  required,
  disabled,
  value,
  rows,
  error,
  redlabel,
  onKeyDown,
  placeholder,
  className,
  max,
}) => {

  const [maxError, setMaxError] = useState("");
  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const inputValue = event.target.value;

    if (max !== undefined) {
      if (inputValue.length <= Number(max)) {
        handleInputChange(name, inputValue);
        setMaxError("");
      } else {
        setMaxError(`Max ${max} characters allowed`);
      }
    } else {
      handleInputChange(name, inputValue);
    }
  };

  return (
    <div className="relative w-full ">
      <div className='flex mb-1'>
        <label className="flex text-xs font-bold mt-1 text-[#193A69] dark:text-[#E2E8F0]" htmlFor={name}>
          {title}{redlabel && <p className="text-exit text-xs -mt-[3px] ml-2 ">{redlabel}</p>}
        </label>
        <label className="block text-exit text-xs font-bold ml-2 mt-1" htmlFor={name}>
          {error}
        </label>
      </div>

      {maxError && (
        <p className="absolute right-1 top-[11px] text-[9px] text-exit font-semibold">
          {maxError}
        </p>
      )}
      <textarea
        rows={rows}
        className={`border border-[#b5bfcb] dark:border-[#D0D5DD] px-1.5 py-1.5 dark:bg-input rounded text-base shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150 ${className}`}
        name={name}
        onChange={handleChange}
        required={required}
        value={value || ''}
        onKeyDown={onKeyDown}
        disabled={disabled}
        placeholder={placeholder}
      />
    </div>
  );
};

export default ATextArea;
