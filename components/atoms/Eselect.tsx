// import React, { useState, useEffect, useRef } from "react";
// import { BiChevronDown } from "react-icons/bi";
// import { AiOutlineSearch } from "react-icons/ai";
// import { cn } from "@/lib/utils";

// const Eselect = ({
//   title,
//   name,
//   option,
//   handleInputChange,
//   className,
//   isMulti,
//   initialValue,
//   readOnly,
//   disabled,
//   autoFocus,
//   redlabel,
//   h,
//   mb,
//   onKeyDown,
//   required,
//   style,
// }) => {
//   const [inputValue, setInputValue] = useState("");
//   const [selectedOptions, setSelectedOptions] = useState([]);
//   const [open, setOpen] = useState(false);
//   const [focusedIndex, setFocusedIndex] = useState(-1);
//   const [dropup, setDropup] = useState(false);
//   const [isTouched, setIsTouched] = useState(false);
//   const containerRef = useRef(null);
//   const inputRef = useRef(null);
//   const listRef = useRef(null);
//   const focusedItemRef = useRef(null);

//   const filteredOptions = option?.filter((opt) =>
//     opt?.label?.toLowerCase().includes(inputValue)
//   );


//   useEffect(() => {
//     if (initialValue) {
//       let selectedValues = [];
//       if (typeof initialValue === "string") {
//         selectedValues = [initialValue];
//       } else if (Array.isArray(initialValue)) {
//         selectedValues = initialValue;
//       } else if (typeof initialValue === "object") {
//         selectedValues = Object.values(initialValue);
//       }
//       const initialSelected = option?.filter((opt) =>
//         selectedValues.includes(opt.value)
//       );
//       setSelectedOptions(initialSelected);
//     } else {
//       setSelectedOptions([]);
//     }
//     if (autoFocus && inputRef.current) {
//       inputRef.current.focus();
//     }
//     const handleClickOutside = (event) => {
//       if (
//         containerRef.current &&
//         !containerRef.current.contains(event.target)
//       ) {
//         setOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, [initialValue, option, autoFocus]);


//   useEffect(() => {
//     const handleKeyDown = (event) => {
//       if (!open || disabled) return;

//       if (event.key === "ArrowDown") {
//         event.preventDefault();
//         setFocusedIndex((prevIndex) =>
//           prevIndex < filteredOptions.length - 1 ? prevIndex + 1 : 0
//         );
//       } else if (event.key === "ArrowUp") {
//         event.preventDefault();
//         setFocusedIndex((prevIndex) =>
//           prevIndex > 0 ? prevIndex - 1 : filteredOptions.length - 1
//         );
//       } else if (
//         event.key === "Tab" ||
//         (event.key === "Enter" && focusedIndex >= 0)
//       ) {
//         event.preventDefault();
//         handleSelect(filteredOptions[focusedIndex]);
//       }
//     };

//     document.addEventListener("keydown", handleKeyDown);

//     return () => {
//       document.removeEventListener("keydown", handleKeyDown);
//     };
//   }, [open, focusedIndex, filteredOptions, disabled]);

//   const handleSelect = (selectedOption) => {
//     if (disabled) return;
//     setIsTouched(true);
//     if (isMulti) {
//       const newSelectedOptions = selectedOptions.includes(selectedOption)
//         ? selectedOptions.filter((opt) => opt.value !== selectedOption.value)
//         : [...selectedOptions, selectedOption];
//       setSelectedOptions(newSelectedOptions);
//       handleInputChange(
//         name,
//         newSelectedOptions.map((opt) => opt.value)
//       );
//     } else {
//       setSelectedOptions([selectedOption]);
//       handleInputChange(name, selectedOption?.value);
//       setOpen(false);
//     }
//     setInputValue("");
//   };

//   const handleFocus = () => {
//     if (disabled) return;
//     setIsTouched(true);
//     if (selectedOptions.length > 0) {
//       const initialSelectedIndex = option.findIndex(
//         (opt) => opt.value === selectedOptions[0].value
//       );
//       setFocusedIndex(initialSelectedIndex);
//     }
//     setOpen(true);
//   };

//   const handleBlur = (event) => {
//     if (
//       event.relatedTarget &&
//       (containerRef.current.contains(event.relatedTarget) ||
//         listRef.current.contains(event.relatedTarget))
//     ) {
//       return;
//     }
//     setOpen(false);
//   };

//   useEffect(() => {
//     if (focusedItemRef.current) {
//       focusedItemRef.current.scrollIntoView({
//         behavior: "smooth",
//         block: "nearest",
//       });
//     }
//   }, [focusedIndex]);

//   useEffect(() => {
//     if (open && inputRef.current) {
//       inputRef.current.focus();
//     }
//   }, [open]);

//   useEffect(() => {
//     if (listRef.current && containerRef.current) {
//       const listRect = listRef.current.getBoundingClientRect();
//       const containerRect = containerRef.current.getBoundingClientRect();

//       const spaceBelow = window.innerHeight - containerRect.bottom;
//       const spaceAbove = containerRect.top;

//       if (spaceBelow < listRect.height && spaceAbove > listRect.height) {
//         setDropup(true);
//       } else {
//         setDropup(false);
//       }
//     }
//   }, [open]);

//   const handleMouseDown = (event) => {
//     if (disabled) return;
//     event.preventDefault();
//     setOpen((prevOpen) => !prevOpen);
//   };

//   return (
//     <div
//       className={`w-full mb-${mb ? mb : 4} font-medium h-8 mt-1 relative ${disabled ? "opacity-50" : ""
//         }`}
//       ref={containerRef}
//     >
//       <label
//         className="flex capitalize font-bold text-xs mt-1 mb-1"
//         htmlFor={name}
//       >
//         {title}
//         {redlabel && <p className="text-exit text-xs -mt-1 ml-2">{redlabel}</p>}
//       </label>

//       <input
//         type="hidden"
//         name={name}
//         value={
//           selectedOptions?.length
//             ? selectedOptions.map((opt) => opt?.value).join(",")
//             : ""
//         }
//         required={required}
//       />
//       <div
//         onMouseDown={handleMouseDown}
//         className={`${className || "w-full"}  flex items-center h-${h ? h : 7
//           } px-4 text-sm justify-between rounded dark:bg-input bg-white cursor-pointer ${disabled ? "hover:cursor-not-allowed" : ""
//           } ${!selectedOptions?.length ? "text-gray-700" : ""}`}
//         onFocus={handleFocus}
//         onBlur={handleBlur}
//         tabIndex={disabled ? -1 : 0}
//         style={style}
//       >
//         <div className={`truncate ${selectedOptions?.length
//           ? "" : "opacity-30"}`}>
//           {selectedOptions?.length
//             ? selectedOptions.map((opt) => opt?.label).join(", ")
//             : title}
//         </div>
//         {!disabled && (
//           <BiChevronDown size={20} className={`${open && "rotate-180"}`} />
//         )}
//       </div>
//       {open && !disabled && (
//         <div className="z-20 absolute w-full mt-1 shadow-darkshadow">
//           <div className="flex items-center px-2  bg-white dark:bg-input rounded-md ">
//             <AiOutlineSearch size={16} className="text-gray-700 mt-3" />
//             <input
//               ref={inputRef}
//               type="text"
//               value={inputValue}
//               onChange={(e) => setInputValue(e.target.value?.toLowerCase())}
//               placeholder="Search..."
//               className={cn(
//                 "flex h-7 mt-2 ml-1 w-full rounded-md dark:bg-input bg-white px-3 py-1 text-sm transition-colors file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300",
//                 className
//               )}
//               disabled={disabled}
//               onFocus={handleFocus}
//               onBlur={handleBlur}
//               onKeyDown={onKeyDown}
//             />
//           </div>
//           <div className="w-full py-2 bg-white dark:bg-input ">
//             <ul
//               ref={listRef}
//               className={`
//             ${dropup ? "bottom-full -mt-6 " : "top-full"}
//             bg-white dark:bg-input overflow-y-auto  w-full  max-h-60  border-t-2 border-y-grey
//           `}
//               tabIndex={-1}
//               onMouseDown={(e) => e.preventDefault()}
//             >
//               {filteredOptions.map((opt, index) => (
//                 <li
//                   key={opt.value}
//                   className={`p-2 text-sm hover:bg-grey hover:text-black dark:text-white cursor-pointer ${focusedIndex === index ? "bg-grey text-black" : ""
//                     }`}
//                   data-value={opt.value}
//                   onMouseDown={(e) => e.preventDefault()}
//                   onClick={() => handleSelect(opt)}
//                   ref={focusedIndex === index ? focusedItemRef : null}
//                 >
//                   {opt.label}
//                 </li>
//               ))}
//             </ul>
//           </div>
//         </div>
//       )}
//       {/* {required && isTouched && selectedOptions.length === 0 && (
//         <p className="text-red-500 text-xs mt-1">field is required</p>
//       )} */}
//     </div>
//   );
// };

// export default Eselect;




import React, { useState, useEffect, useRef, useMemo } from "react";
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
  mb,
  onKeyDown,
  required,
  ShortName,
  style,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [dropup, setDropup] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const [maxOptionWidth, setMaxOptionWidth] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const focusedItemRef = useRef(null);

  const filteredOptions = option?.filter((opt) =>
    opt?.label?.toLowerCase().includes(inputValue.toLowerCase())
  );

  // Calculate maximum width needed for options
  const calculateMaxWidth = useMemo(() => {
    if (typeof document === 'undefined' || !option) return 0;
    
    const tempSpan = document.createElement('span');
    document.body.appendChild(tempSpan);
    tempSpan.style.visibility = 'hidden';
    tempSpan.style.whiteSpace = 'nowrap';
    tempSpan.style.fontSize = '14px';
    tempSpan.style.padding = '0 8px';
    
    let maxWidth = 0;
    option.forEach(opt => {
      tempSpan.textContent = opt.label;
      const width = tempSpan.offsetWidth + 32; // Adding padding and margin
      if (width > maxWidth) maxWidth = width;
    });
    
    document.body.removeChild(tempSpan);
    return maxWidth;
  }, [option]);

  useEffect(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      setMaxOptionWidth(Math.max(containerWidth, calculateMaxWidth));
    }
  }, [calculateMaxWidth]);

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
      if (containerRef.current && !containerRef.current.contains(event.target)) {
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
    setIsTouched(true);
    if (isMulti) {
      const newSelectedOptions = selectedOptions.some(opt => opt.value === selectedOption.value)
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
    setIsTouched(true);
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
      className={`w-full mb-${mb ? mb : 4} font-medium h-8 mt-1 relative ${disabled ? "opacity-50" : ""
        }`}
      ref={containerRef}
    >
      <label
        className="flex capitalize font-bold text-xs mt-1 mb-1 text-[#193A69] dark:text-[#E2E8F0]"
        htmlFor={name}
      >
        {ShortName ? title : toTitleCase(title)} {redlabel && <p className="text-exit text-xs -mt-1 ml-2">{redlabel}</p>}
      </label>

      <input
        type="hidden"
        name={name}
        value={
          selectedOptions?.length
            ? selectedOptions.map((opt) => opt?.value).join(",")
            : ""
        }
        required={required}
      />
      <div
        onMouseDown={handleMouseDown}
        className={`${className || "w-full"} flex items-center h-${h ? h : 7
          } border border-[#b5bfcb] dark:border-[#D0D5DD] px-4 text-sm justify-between rounded dark:bg-input bg-white cursor-pointer ${disabled ? "hover:cursor-not-allowed" : ""
          } ${!selectedOptions?.length ? "text-gray-700" : ""}`}
        onFocus={handleFocus}
        onBlur={handleBlur}
        tabIndex={disabled ? -1 : 0}
        style={style}
      >
        <div className={`truncate ${selectedOptions?.length ? "" : "opacity-30"}`}>
          {selectedOptions?.length
            ? selectedOptions.map((opt) => opt?.label).join(", ")
            : title}
        </div>
        {!disabled && (
          <BiChevronDown size={20} className={`${open && "rotate-180"}`} />
        )}
      </div>
      {open && !disabled && (
        <div 
          className="z-20 absolute shadow-darkshadow"
          style={{ width: `${maxOptionWidth}px`, minWidth: '100%' }}
        >
          <div className="flex items-center px-2 bg-white dark:bg-input rounded-md">
            <AiOutlineSearch size={16} className="text-gray-700 mt-3" />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value.toLowerCase())}
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
          <div className="w-full py-2 bg-white dark:bg-input">
            <ul
              ref={listRef}
              className={`
                ${dropup ? "bottom-full -mt-6" : "top-full"}
                bg-white dark:bg-input overflow-y-auto w-full max-h-60 border-t-2 border-y-grey
              `}
              tabIndex={-1}
              onMouseDown={(e) => e.preventDefault()}
              style={{ minWidth: '100%' }}
            >
              {filteredOptions.map((opt, index) => (
                <li
                  key={opt.value}
                  className={`p-2 text-sm hover:bg-grey hover:text-black dark:text-white cursor-pointer ${
                    focusedIndex === index ? "bg-grey text-black" : ""
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
          </div>
        </div>
      )}
    </div>
  );
};

export default Eselect;
