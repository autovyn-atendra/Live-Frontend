import React, { useState, useEffect, useRef, useCallback } from "react";
import { BiChevronDown } from "react-icons/bi";
import { AiOutlineSearch } from "react-icons/ai";
import { cn } from "@/lib/utils";

const InventorySelect1 = ({
  title,
  widthdiv,
  name,
  handleInputChange,
  className,
  isMulti,
  initialValue,
  readOnly,
  disabled,
  autoFocus,
  redlabel,
  onKeyDown,
  fetchOptions, // New prop to fetch options from API
  selectedItem,
  index,
  h,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [open, setOpen] = useState(false);
  const [dropup, setDropup] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [options, setOptions] = useState([]);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const focusedItemRef = useRef(null);

  // Debounced fetch function
  const debouncedFetchOptions = useCallback(
    (value) => {
      const delayDebounceFn = setTimeout(() => {
        fetchOptions(value).then((fetchedOptions) => {
          setOptions(fetchedOptions);
        });
      }, 500); // Adjust delay (300ms) as needed for debounce

      return () => clearTimeout(delayDebounceFn);
    },
    [fetchOptions]
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
      const initialSelected = options?.filter((opt) =>
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
  }, [initialValue, options, autoFocus]);

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
    if (selectedItem) {
      const selectedOption = options.find((opt) => opt.value === selectedItem);
      if (selectedOption) {
        setSelectedOptions([selectedOption]);
        // setInputValue(selectedOption.label);
      }
    }
  }, [selectedItem, options]);

  const handleSelect = (selectedOption) => {
    if (disabled) return;
    if (isMulti) {
      const newSelectedOptions = selectedOptions.includes(selectedOption)
        ? selectedOptions.filter((opt) => opt.value !== selectedOption.value)
        : [...selectedOptions, selectedOption];
      setSelectedOptions(newSelectedOptions);
      handleInputChange(
        name,
        newSelectedOptions.map((opt) => opt.value),
        index
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
      const initialSelectedIndex = options.findIndex(
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

  const handleMouseDown = (event) => {
    if (disabled) return;
    event.preventDefault();
    setOpen((prevOpen) => !prevOpen);
  };

  const handleInputChangeDebounced = (value) => {
    setInputValue(value);
    if (value) {
      debouncedFetchOptions(value);
    } else {
      setOptions([]);
    }
  };
  useEffect(() => {
    if (selectedItem) {
      fetchOptions(selectedItem).then((fetchedOptions) => {
        setOptions(fetchedOptions);
      });
    }
  }, [selectedItem]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!open || disabled) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setFocusedIndex((prevIndex) =>
          prevIndex < options.length - 1 ? prevIndex + 1 : 0
        );
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setFocusedIndex((prevIndex) =>
          prevIndex > 0 ? prevIndex - 1 : options.length - 1
        );
      } else if (
        event.key === "Tab" ||
        (event.key === "Enter" && focusedIndex >= 0)
      ) {
        event.preventDefault();
        handleSelect(options[focusedIndex]);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, focusedIndex, options, disabled]);

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

  return (
    <div
      className={`w-full font-medium h-5 relative ${
        disabled ? "opacity-50" : ""
      } ${className}`}
      ref={containerRef}
    >
      <label className="capitalize flex text-xs font-bold mt-1 mb-1 text-[#193A69] dark:text-[#E2E8F0]" htmlFor={name}>
        {title}
        {redlabel && <p className="text-exit text-xs -mt-1 ml-2">{redlabel}</p>}
      </label>
      <div
        onMouseDown={handleMouseDown}
        className={`w-full flex items-center  border border-borderColor dark:border-borderColor-dark h-${
          h || 6
        } px-4 text-sm justify-between rounded dark:bg-input bg-white cursor-pointer ${
          disabled ? "hover:cursor-not-allowed" : ""
        } ${!selectedOptions?.length ? "text-gray-700" : ""}`}
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
        <div className="z-10 absolute w-full mt-1 shadow-darkshadow">
          <div className="flex items-center px-2 sticky top-0 bg-white dark:bg-input rounded-md">
            <AiOutlineSearch size={16} className="text-gray-700 mt-3" />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => handleInputChangeDebounced(e.target.value)}
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
          <div className="w-full py-2 bg-white dark:bg-input ">
            <ul
              ref={listRef}
              className={`
                ${dropup ? "bottom-full -mt-6 " : "top-full"}
                bg-white dark:bg-input overflow-y-auto  w-full  max-h-60  border-t-2 border-y-grey
                `}
              tabIndex={-1} // Prevent focus from going to the list
              onMouseDown={(e) => e.preventDefault()}
            >
              {options.map((opt, index) => (
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
          </div>
        </div>
      )}
    </div>
  );
};

export default InventorySelect1;
