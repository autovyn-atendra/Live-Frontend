"use client";
import React, { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ESelectSearch = ({
  title,
  options,
  name,
  selectedValue,
  handleInputChange,
  redlabel,
  className,
  placeholder
}) => {
  const [selected, setSelected] = useState(selectedValue);

  useEffect(() => {
    setSelected(selectedValue);
  }, [selectedValue]);

  const handleSelectionChange = (newValue) => {
    // Convert the new value to a string before setting it
    setSelected(newValue);
    handleInputChange(name, newValue);
    console.log(selectedValue);
  };

  return (
    <div className="relative w-full ">
      <div className="flex">
        <label className="flex capitalize text-xs mt-1" htmlFor={name}>
          {title?.toLowerCase()}
          {redlabel && <p className="text-exit text-xs -mt-1 ml-2">{redlabel}</p>}
        </label>
      </div>
      <Select value={selected} onValueChange={handleSelectionChange}>
        <SelectTrigger className={className ? className : "w-full"}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {Array.isArray(options) &&
            options.map(({ value, label }, index) => (
              <SelectItem key={index} value={value?.toString()}>
                {label}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ESelectSearch;

// import React, { CSSProperties } from "react";
// import Select, { ValueType, ActionMeta, OptionsType } from "react-select";

// // Define the shape of the options for the Select component
// interface OptionType {
//   value: string;
//   label: string;
// }

// // Define the props for the SelectSearch component
// interface SelectSearchProps {
//   name: string;
//   title: string;
//   options: OptionsType<OptionType>;
//   onChange: (
//     option: ValueType<OptionType>,
//     actionMeta: ActionMeta<OptionType>
//   ) => void;
//   selectedOption?: ValueType<OptionType>;
// }

// // Custom styles for react-select
// const customStyles: Record<
//   string,
//   (provided: CSSProperties, state: any, dark?: boolean) => CSSProperties
// > = {
//   control: (provided, state, dark) => ({
//     ...provided,
//     borderRadius: "5px",
//     minHeight: "20px",
//     maxHeight: "33px",
//     dark: dark ? "bg-input" : "bg-white",
//     boxShadow: state.isFocused ? "0 0 0 2px rgba(0, 123, 255, 0.6)" : "none",
//     "&:hover": {
//       borderColor: "#aaa",
//     },
//   }),
//   option: (provided, state) => ({
//     ...provided,
//     backgroundColor: state.isSelected ? "#007bff" : "white",
//     color: state.isSelected ? "white" : "black",
//     "&:hover": {
//       backgroundColor: "#007bff",
//       color: "white",
//     },
//   }),
// };

// const SelectSearch: React.FC<SelectSearchProps> = ({
//   name,
//   title,
//   options,
//   onChange,
//   selectedOption,
// }) => {
//   return (
//     <div className="relative w-full mb-3 " key={name}>
//       <label
//         className="block uppercase  text-xs font-bold mb-1"
//         htmlFor={name}
//         key={name}
//       >
//         {title}
//       </label>
//       <Select
//         value={selectedOption}
//         key={`select-${name}`}
//         name={name}
//         options={options}
//         onChange={onChange}
//         isSearchable
//         placeholder="Search..."
//         styles={customStyles}
//       />
//     </div>
//   );
// };

// export default SelectSearch;
