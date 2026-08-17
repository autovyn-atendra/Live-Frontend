import React, {
  ChangeEvent,
  FunctionComponent,
  TextareaHTMLAttributes,
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
  onKeyDown: string;
  redlabel?: string;
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

}) => {
  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const inputValue = event.target.value;
    handleInputChange(name, inputValue);
  };

  return (
    <div className="relative w-full ">
      <div className='flex'>
        <label className="flex text-xs font-bold mt-1 mb-1 text-[#193A69] dark:text-[#E2E8F0]" htmlFor={name}>
          {title}{redlabel && <p className="text-exit text-xs -mt-[3px] ml-2 ">{redlabel}</p>}
        </label>
        <label className="block uppercase text-exit text-xs font-bold ml-2 mt-1" htmlFor={name}>
          {error}
        </label>
      </div>
      <textarea
        rows={rows}
        className="border border-body-color dark:border-borderColor-dark px-1.5 py-1.5 dark:bg-input rounded text-base shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
        name={name}
        onChange={handleChange}
        required={required}
        value={value || ''}
        onKeyDown={onKeyDown}
        disabled={disabled}
      />
    </div>
  );
};

export default ATextArea;
