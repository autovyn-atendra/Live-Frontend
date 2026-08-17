import React, { useState, useEffect, useRef } from "react";
import { BiChevronDown } from "react-icons/bi";
import { AiOutlineSearch } from "react-icons/ai";
import { cn } from "@/lib/utils";

const InventorySelect = ({
  title,
  widthdiv,
  name,
  option,
  handleInputChange,
  className,
  isMulti,
  initialValue,
  readOnly,
  disabled,
  autoFocus,
  redlabel,
  onKeyDown
}) => {
  const [inputValue, setInputValue] = useState("");
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [dropdownMinWidth, setDropdownMinWidth] = useState("100%");
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const focusedItemRef = useRef(null);
  const filteredOptions = option?.filter((opt) =>
    opt?.label?.toLowerCase().includes(inputValue)
  );

  useEffect(() => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return;
  
    context.font = "14px sans-serif"; // Match your dropdown font
  
    let maxWidth = 0;
    option?.forEach((opt) => {
      const width = context.measureText(opt.label).width;
      if (width > maxWidth) maxWidth = width;
    });
  
    // Add padding to match styling
    const finalWidth = Math.ceil(maxWidth + 40); // +40 for padding/icon
    setDropdownMinWidth(`${finalWidth}px`);
  }, [option]);

  
  useEffect(() => {
    if (initialValue) {
      let selectedValues = [];
      if (typeof initialValue === "string") {
        selectedValues = [initialValue];
      } else if (Array.isArray(initialValue)) {
        selectedValues = initialValue;
      } else if (typeof initialValue === "object") {
        selectedValues = Object.values(initialValue);
      }
      const initialSelected = option?.filter((opt) =>
        selectedValues.includes(opt.value)
      );
      setSelectedOptions(initialSelected);
    } else {
      setSelectedOptions([]);
    }
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [initialValue, option, autoFocus]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!open || disabled) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setFocusedIndex((prevIndex) =>
          prevIndex < filteredOptions.length - 1 ? prevIndex + 1 : 0
        );
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setFocusedIndex((prevIndex) =>
          prevIndex > 0 ? prevIndex - 1 : filteredOptions.length - 1
        );
      } else if (
        event.key === "Tab" ||
        (event.key === "Enter" && focusedIndex >= 0)
      ) {
        event.preventDefault();
        handleSelect(filteredOptions[focusedIndex]);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, focusedIndex, filteredOptions, disabled]);

  const handleSelect = (selectedOption) => {
    if (disabled) return;
    if (isMulti) {
      const newSelectedOptions = selectedOptions.includes(selectedOption)
        ? selectedOptions.filter((opt) => opt.value !== selectedOption.value)
        : [...selectedOptions, selectedOption];
      setSelectedOptions(newSelectedOptions);
      handleInputChange(
        name,
        newSelectedOptions.map((opt) => opt.value)
      );
    } else {
      setSelectedOptions([selectedOption]);
      handleInputChange(name, selectedOption?.value);
      setOpen(false);
    }
    setInputValue("");
  };

  const handleFocus = () => {
    if (disabled) return;
    if (selectedOptions.length > 0) {
      const initialSelectedIndex = option.findIndex(
        (opt) => opt.value === selectedOptions[0].value
      );
      setFocusedIndex(initialSelectedIndex);
    }
    setOpen(true);
  };

  const handleBlur = (event) => {
    if (
      event.relatedTarget &&
      (containerRef.current.contains(event.relatedTarget) ||
        listRef.current.contains(event.relatedTarget))
    ) {
      return;
    }
    setOpen(false);
  };

  useEffect(() => {
    if (focusedItemRef.current) {
      focusedItemRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [focusedIndex]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const handleMouseDown = (event) => {
    if (disabled) return;
    event.preventDefault();
    setOpen((prevOpen) => !prevOpen);
  };

  return (
    <div
      className={`w-full mb-[10px] font-medium h-8 relative ${
        disabled ? "opacity-50" : ""
      } ${className}`}
      ref={containerRef}
    >
      <label className="flex uppercase text-xs font-bold mt-1 text-header dark:text-white" htmlFor={name}>
        {title}
        {redlabel && <p className="text-exit text-sm -mt-1 ml-2">{redlabel}</p>}
      </label>
      <div
        onMouseDown={handleMouseDown}
        className={` w-${
          widthdiv ? widthdiv : "full"
        } border border-borderColor dark:border-borderColor-dark flex items-center h-7 px-4 text-sm justify-between rounded dark:bg-input bg-white cursor-pointer ${
          disabled ? "hover:cursor-not-allowed" : ""
        } ${!selectedOptions?.length && "text-gray-700"}`}
        onFocus={handleFocus}
        onBlur={handleBlur}
        tabIndex={disabled ? -1 : 0} // Make the div non-focusable if disabled
      >
        <div className="truncate">
          {selectedOptions?.length
            ? selectedOptions.map((opt) => opt?.label).join(", ")
            : title}
        </div>
        {!disabled && (
          <BiChevronDown size={20} className={`${open && "rotate-180"}`} />
        )}
      </div>
      {open && !disabled && (
        <ul
          ref={listRef}
          style={{ minWidth: dropdownMinWidth }}
          className={`
          
            bg-white dark:bg-input mt-1 overflow-y-auto absolute w-full z-10 max-h-60 rounded-lg
          `}
          tabIndex={-1} // Prevent focus from going to the list
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="flex items-center px-2 sticky top-0 bg-white dark:bg-input rounded-md">
            <AiOutlineSearch size={16} className="text-gray-700 mt-3" />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value?.toLowerCase())}
              placeholder="Search..."
              className={cn(
                "flex h-7 mt-2 ml-1 w-full rounded-md dark:bg-input bg-white px-3 py-1 text-sm transition-colors file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300",
                className
              )}
              disabled={disabled}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={onKeyDown}
            />
          </div>
          {filteredOptions.map((opt, index) => (
            <li
              key={opt.value}
              className={`p-2 text-sm hover:bg-grey hover:text-black dark:text-white cursor-pointer ${
                focusedIndex === index ? "bg-grey text-black" : ""
              }`}
              data-value={opt.value}
              onMouseDown={(e) => e.preventDefault()} // Prevent blur event
              onClick={() => handleSelect(opt)}
              ref={focusedIndex === index ? focusedItemRef : null}
            >
              {opt?.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default InventorySelect;
