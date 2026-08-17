import React from "react";
import MultipleSelector, { Option } from "@/components/ui/multiple-selector";

interface MultipleSelectorComponentProps {
  options: Option[];
  placeholder?: string;
  onSelectionChange: (selectedOptions: Option[]) => void;
}

const MultipleSelectorComponent: React.FC<MultipleSelectorComponentProps> = ({
  options,
  placeholder = "Select options...",
  onSelectionChange,
}) => {
  return (
    <MultipleSelector
      defaultOptions={options}
      hidePlaceholderWhenSelected
      placeholder={placeholder}
      emptyIndicator={
        <p className="text-center text-lg leading-10 h-9">no results found.</p>
      }
      onChange={onSelectionChange}
    />
  );
};

export default MultipleSelectorComponent;
