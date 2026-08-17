// "use client"
// import React, { useEffect, useState } from "react";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";

// const SelectSearch = ({
//   title,
//   options,
//   name,
//   selectedValue,
//   handleInputChange,
//   isSelectAll,
//   readOnly,
//   redlabel,
//   disabled,
//   className,
//   uppertitle,
//   labelClass,
//   ShortName,
//   ...props
// }) => {
//   const [selected, setSelected] = useState(selectedValue);

//   useEffect(() => {
//     setSelected(selectedValue);
//   }, [selectedValue]);

//   const handleSelectionChange = (newValue) => {
//     setSelected(newValue);
//     handleInputChange(name, newValue);
//   };

//   const toTitleCase = (str) => {
//     if (!str) return '';
//     return str
//       .toLowerCase()
//       .split(' ')
//       .map(word => word.charAt(0).toUpperCase() + word.slice(1))
//       .join(' ');
//   };

//   return (
//     <div className="relative w-full ">
//       <label
//         className={`flex font-bold mt-1 mb-1 text-[#193A69] dark:text-[#E2E8F0] ${labelClass || 'text-xs'}`}
//         htmlFor={name}
//       >
//         {ShortName ? title : toTitleCase(title)}
//         {uppertitle && (
//           <span className="ml-1">{uppertitle}</span>
//         )}
//         {redlabel && <p className="text-exit text-xs -mt-1 ml-2">{redlabel}</p>}
//       </label>
//       <Select value={selected} onValueChange={handleSelectionChange} {...props}>
//         <SelectTrigger className={`w-full ${className} text-[15px]`} disabled={disabled} >
//           <SelectValue></SelectValue>
//         </SelectTrigger>
//         <SelectContent>
//           {Array.isArray(options) && (
//             <>
//               {isSelectAll && options.length > 1 && <SelectItem value={options.length > 1 ? options?.map((option) => option.value)?.join(',') : 'ALL'} >All {title?.toUpperCase()}</SelectItem>}
//               {/* {isSelectAll && <SelectItem value="all">Select All</SelectItem>} */}
//               {options.map(({ value, label }, index) => (
//                 <SelectItem key={index} value={value?.toString()}>
//                   {label}
//                 </SelectItem>
//               ))}
//             </>
//           )}
//         </SelectContent>
//       </Select>
//     </div>
//   );
// };

// export default SelectSearch;






"use client"

import React, { useEffect, useState, useRef, useMemo, forwardRef } from "react";
const Input = forwardRef(({ placeholder, value, onChange, onClick, className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onClick={onClick}
      className={`px-3 py-1 bg-white dark:bg-input border border-borderColor dark:border-borderColor-dark rounded-md focus:outline-none ${className}`}
      {...props}
    />
  );
});

Input.displayName = "Input";

const CustomSelectSearch = ({
  title,
  options,
  name,
  selectedValue,
  handleInputChange,
  isSelectAll = false,
  readOnly,
  redlabel,
  disabled = false,
  className = "",
  uppertitle,
  labelClass,
  ShortName = false,
  placeholder,
  ...props
}) => {
  const [selected, setSelected] = useState(selectedValue || "");
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState('bottom');

  const searchInputRef = useRef(null);
  const containerRef = useRef(null);
  const optionsRef = useRef([]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setSelected(selectedValue || "");
  }, [selectedValue]);

  // ड्रॉपडाउन की पोजीशन चेक करें
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = 300; // approximate height

      if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
        setDropdownPosition('top');
      } else {
        setDropdownPosition('bottom');
      }
    }
  }, [isOpen]);

  // बाहर क्लिक करने पर ड्रॉपडाउन बंद करें
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ड्रॉपडाउन खुलने पर सर्च इनपुट पर फोकस करें
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(0);

      requestAnimationFrame(() => {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      });

    } else {
      setSearchTerm("");
      setHighlightedIndex(-1);
    }
  }, [isOpen]);

  const handleSelectionChange = (newValue) => {
    const stringValue = newValue?.toString() || "";
    setSelected(stringValue);
    if (handleInputChange) {
      handleInputChange(name, stringValue);
    }
    setIsOpen(false);
    setSearchTerm("");
  };

  const toTitleCase = (str) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const filteredOptions = useMemo(() => {
    if (!Array.isArray(options)) return [];
    const search = (searchTerm || "").toLowerCase();
    return options.filter(option => {
      const label =
        typeof option?.label == "string"
          ? option.label.toLowerCase()
          : String(option?.label || "").toLowerCase();
      return label.includes(search);
    });
  }, [options, searchTerm]);


  const handleSearchClick = (e) => {
    e.stopPropagation();
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleSearchChange = (e) => {
    e.stopPropagation();
    setSearchTerm(e.target.value);
    setHighlightedIndex(0);
  };

  const ALL_VALUE = Array.isArray(options)
    ? options.map(o => o.value).join(",")
    : "";

  const getAllValue = () => {
    return ALL_VALUE;
  };

  const isAllSelected = () => {
    const allValues = options?.map(o => o.value).join(",");
    return selected === allValues;
  };

  const handleSearchKeyDown = (e) => {
    e.stopPropagation();

    switch (e.key) {

      case "ArrowDown":
        e.preventDefault();
        const totalOptions = isSelectAll ? filteredOptions.length + 1 : filteredOptions.length;
        setHighlightedIndex(prev => (prev < totalOptions - 1 ? prev + 1 : prev));
        break;

      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
        break;

      case "Enter":
        e.preventDefault();

        if (highlightedIndex >= 0) {
          if (isSelectAll && highlightedIndex === 0) {
            handleSelectionChange(ALL_VALUE);
          } else {
            const optionIndex = isSelectAll ? highlightedIndex - 1 : highlightedIndex;
            if (filteredOptions[optionIndex]) {
              handleSelectionChange(filteredOptions[optionIndex].value);
            }
          }
        }
        break;

      case "Tab":
        setIsOpen(false);   // 👈 dropdown close
        setSearchTerm("");
        break;

      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setSearchTerm("");
        break;
    }
  };



  useEffect(() => {
    if (highlightedIndex >= 0 && optionsRef.current[highlightedIndex]) {
      optionsRef.current[highlightedIndex].scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [highlightedIndex]);

  const getDisplayValue = () => {
    if (!selected) return placeholder;

    const hasMultipleOptions = Array.isArray(options) && options.length > 1;

    if (selected === ALL_VALUE && hasMultipleOptions) {
      return `All ${title || 'options'}`;
    }

    const selectedOption = options?.find(
      (opt) => opt.value?.toString() === selected?.toString()
    );

    return selectedOption ? selectedOption.label : placeholder;
  };

  const handleOptionClick = (e, value) => {
    e.preventDefault();
    e.stopPropagation();
    handleSelectionChange(value);
  };

  const isOptionSelected = (optionValue) => {
    if (optionValue === ALL_VALUE) {
      return selected === ALL_VALUE;
    }
    return selected?.toString() === optionValue?.toString();
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* लेबल */}
      {(title || uppertitle || redlabel) && (
        <label
          className={`flex font-bold mt-1 mb-1 text-[#193A69] dark:text-[#E2E8F0] ${labelClass || 'text-xs'}`}
          htmlFor={name}
        >
          {ShortName ? title : toTitleCase(title)}
          {uppertitle && (
            <span className="ml-1">{uppertitle}</span>
          )}
          {redlabel && <p className="text-exit text-xs -mt-1 ml-2">{redlabel}</p>}
        </label>
      )}

      {/* ट्रिगर बटन */}
      <div
        tabIndex={disabled ? -1 : 0}

        className={`
    w-full ${className} text-[15px] h-9
    border border-borderColor dark:border-borderColor-dark 
    rounded-md px-3 py-1.5 bg-white dark:bg-input
    flex items-center justify-between cursor-pointer
    ${disabled || readOnly ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-500'}
    ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
  `}

        onFocus={() => {
          if (!disabled && !readOnly) {
            setIsOpen(true);
          }
        }}

        onKeyDown={(e) => {
          if (disabled || readOnly) return;

          const totalOptions = isSelectAll
            ? filteredOptions.length + 1
            : filteredOptions.length;

          if (e.key === "ArrowDown") {
            e.preventDefault();

            if (!isOpen) {
              setIsOpen(true);
              setHighlightedIndex(0);
            } else {
              setHighlightedIndex((prev) =>
                prev < totalOptions - 1 ? prev + 1 : prev
              );
            }
          }

          if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          }

          if (e.key === "Enter") {
            e.preventDefault();

            if (highlightedIndex >= 0) {
              if (isSelectAll && highlightedIndex === 0) {
                handleSelectionChange(ALL_VALUE);
              } else {
                const optionIndex = isSelectAll
                  ? highlightedIndex - 1
                  : highlightedIndex;

                if (filteredOptions[optionIndex]) {
                  handleSelectionChange(filteredOptions[optionIndex].value);
                }
              }
            }
          }
        }}

        onMouseDown={(e) => {
          e.preventDefault();
          if (!disabled && !readOnly) {
            setIsOpen((prev) => !prev);
          }
        }}
      >
        <span className={`truncate ${!selected ? 'text-gray-400' : ''}`}>
          {getDisplayValue()}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>

      {/* ड्रॉपडाउन मेनू - पोजीशन के साथ */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className={`
            absolute z-[9999] w-full min-w-[200px] 
            bg-white dark:bg-black 
            border border-borderColor dark:border-borderColor-dark 
            rounded-md shadow-lg
            ${dropdownPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'}
          `}
          style={{
            maxHeight: '300px',
            overflow: 'hidden'
          }}
        >
          {/* सर्च इनपुट */}
          <div className="p-2 border-b border-borderColor dark:border-borderColor-dark bg-inherit">
            <Input
              ref={searchInputRef}
              placeholder="Search..."
              value={searchTerm}
              onChange={handleSearchChange}
              onClick={handleSearchClick}
              onKeyDown={handleSearchKeyDown}
              className="w-full"
            />
          </div>

          {/* ऑप्शन्स लिस्ट */}
          <div className="max-h-60 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {Array.isArray(options) && options.length > 0 ? (
              <>
                {/* Select All ऑप्शन */}
                {isSelectAll && Array.isArray(options) && options.length > 1 && (
                  <div
                    ref={el => optionsRef.current[0] = el}
                    className={`
      px-3 py-2 cursor-pointer transition-colors hover:bg-body-color
      border-b border-borderColor dark:border-borderColor-dark
      font-semibold hover:bg-gray-100 dark:hover:bg-gray-800
      ${highlightedIndex === 0 ? 'bg-body-color dark:bg-body-color' : ''}
      ${isAllSelected() ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
    `}
                    onClick={(e) => handleOptionClick(e, ALL_VALUE)}
                    onMouseEnter={() => setHighlightedIndex(0)}
                  >
                    <div className="flex items-center justify-between">
                      <span>
                        {Array.isArray(options) && options.length > 1
                          ? `All ${title || 'options'}`
                          : ""}
                      </span>
                      {isAllSelected() && (
                        <svg className="text-blue-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </div>
                  </div>
                )}

                {/* फिल्टर्ड ऑप्शन्स */}
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option, index) => {
                    const actualIndex = isSelectAll ? index + 1 : index;
                    return (
                      <div
                        key={`${option.value}-${index}`}
                        ref={el => optionsRef.current[actualIndex] = el}
                        className={`
                          px-3 py-2 text-sm cursor-pointer transition-colors hover:bg-body-color
                          hover:bg-gray-100 dark:hover:bg-gray-800
                          ${highlightedIndex === actualIndex ? 'bg-body-color dark:bg-body-color' : ''}
                          ${isOptionSelected(option.value) ? '' : ''}
                        `}
                        onClick={(e) => handleOptionClick(e, option.value)}
                        onMouseEnter={() => setHighlightedIndex(actualIndex)}
                      >
                        <div className="flex items-center justify-between">
                          <span>{option.label}</span>
                          {isOptionSelected(option.value) && (
                            <svg className="text-blue-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="px-3 py-4 text-center text-gray-500">
                    No options found
                  </div>
                )}
              </>
            ) : (
              <div className="px-3 py-4 text-center text-gray-500">
                No options available
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomSelectSearch;