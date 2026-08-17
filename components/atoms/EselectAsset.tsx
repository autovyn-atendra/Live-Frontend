import React, { useState, useEffect, useRef } from "react";
import { BiChevronDown } from "react-icons/bi";
import { AiOutlineSearch } from "react-icons/ai";
import { cn } from "@/lib/utils";

const Eselect = ({
  title,
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
  h,
  onKeyDown,
  width,
  index
}) => {
  const [inputValue, setInputValue] = useState("");
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [dropup, setDropup] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const focusedItemRef = useRef(null);

  const filteredOptions = option?.filter((opt) =>
    opt?.label?.toLowerCase().includes(inputValue)
  );

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
      handleInputChange(name, selectedOption?.value, index);
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

  useEffect(() => {
    if (listRef.current && containerRef.current) {
      const listRect = listRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();

      const spaceBelow = window.innerHeight - containerRect.bottom;
      const spaceAbove = containerRect.top;

      if (spaceBelow < listRect.height && spaceAbove > listRect.height) {
        setDropup(true);
      } else {
        setDropup(false);
      }
    }
  }, [open]);

  const handleMouseDown = (event) => {
    if (disabled) return;
    event.preventDefault();
    setOpen((prevOpen) => !prevOpen);
  };

  const toTitleCase = (str) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div
      className={`w-full mb-4 font-medium h-8  relative ${disabled ? "opacity-50" : ""
        }`}
      ref={containerRef}
      style={{ width: width || "100%" }} // Add width style here
    >
      <label className="flex text-xs font-bold mt-1 mb-1 text-header dark:text-white" htmlFor={name}>
        {toTitleCase(title)}
        {redlabel && <p className="text-exit text-sm -mt-1 ml-2">{redlabel}</p>}
      </label>
      <div
        onMouseDown={handleMouseDown}
        className={`w-full border border-borderColor dark:border-borderColor-dark flex items-center h-${h ? h : 7
          } px-4 text-sm justify-between rounded dark:bg-input bg-white cursor-pointer ${disabled ? "hover:cursor-not-allowed" : ""
          } ${!selectedOptions?.length ? "text-gray-700" : ""}`}
        onFocus={handleFocus}
        onBlur={handleBlur}
        tabIndex={disabled ? -1 : 0}
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
          className={`
            ${dropup ? "bottom-full -mt-6 " : "top-full"}
            bg-white dark:bg-input mt-4  overflow-y-auto absolute w-full z-10 max-h-60 rounded-lg  shadow-inner
          `}
          tabIndex={-1}
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
          {filteredOptions?.map((opt, index) => (
            <li
              key={opt.value}
              className={`p-2 text-sm hover:bg-grey hover:text-black dark:text-white cursor-pointer ${focusedIndex === index ? "bg-grey text-black" : ""
                }`}
              data-value={opt.value}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(opt)}
              ref={focusedIndex === index ? focusedItemRef : null}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Eselect;
