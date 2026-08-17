'use client'
import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import clsx from 'clsx';

const customClassNames = {
  control: (state) =>
    clsx(
      'flex h-4 w-full px-3 text-sm shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50',
      'bg-white dark:bg-input dark:border-slate-800 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300 p-0'
    ),
  menu: (state) =>
    clsx(
      'rounded-md mt-2 shadow-lg',
      'bg-white text-black dark:bg-input dark:text-white'
    ),
  singleValue: (state) =>
    clsx(
      'transition-colors py-0',
      'text-black dark:text-white'
    ),
  placeholder: (state) =>
    clsx(
      'placeholder:text-slate-500 dark:placeholder:text-slate-400'
    ),
  input: (state) =>
    clsx(
      'text-black dark:text-white',
      'placeholder:text-slate-500 dark:placeholder:text-slate-400 m-0'
    ),
  option: (state) =>
    clsx(
      'cursor-pointer transition-colors',
      {
        'bg-white text-black': state.isSelected && !state.isFocused,
        'bg-white text-black hover:bg-gray-200 hover:text-black dark:text-black dark:bg-input dark:text-white dark:hover:bg-gray-700': !state.isSelected && !state.isFocused,
        'bg-primary dark:bg-primary': state.isSelected,
        'hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-black dark:hover:text-black ': !state.isSelected,
      }
    ),
  menuList: (state) =>
    clsx(
      'bg-white text-black hover:bg-gray-200 hover:text-black dark:text-black dark:bg-input dark:text-white dark:hover:bg-gray-700'
    )
};

const customStyles = (menuListWidth) => ({
  menuList: (provided) => ({
    ...provided,
    width: '100%',
    '@media (min-width: 1024px)': {
      width: menuListWidth ? `${menuListWidth}px` : '100%',
    },
  }),
  input: (base) => ({
    ...base,
    margin: '0 !important',
    padding: '0 !important',
  }),
  IndicatorContainer: (base) => ({
    ...base,
    margin: '0 !important',
    padding: '0 !important',
  }),
  ValueContainer: (base) => ({
    ...base,
    padding: '0 !important',
  }),
});

const Pselect = ({
  title,
  name,
  option,
  handleInputChange = () => { },
  handleLabelChange = () => { },
  handleChangeData = () => { },
  isMulti,
  menuListWidth,
  initialValue,
  errorMsg,
  setFirst,
  isSelectAll,
  isDisabled,
}) => {
  const [selectedOption, setSelectedOption] = useState(null);

  useEffect(() => {
    if (initialValue) {
      const selected = option?.find(
        (opt) => opt.value?.toString()?.toUpperCase() === initialValue?.toString()?.toUpperCase()
      );
      setSelectedOption(selected || null);
    }

    if (setFirst && !initialValue) {
      // Automatically select the first option if `setFirst` is true and no `initialValue` is provided
      setSelectedOption(option[0]);
      handleSelect(option[0]);
    }
  }, [initialValue, option, setFirst]);

  function handleSelect(selectedOption) {
    setSelectedOption(selectedOption);
    handleInputChange(name, selectedOption?.value || option?.map((options) => options.value)?.join(','));
    handleLabelChange(name, selectedOption?.label);
    handleChangeData(name, selectedOption);
  }


  const toTitleCase = (str) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="w-full">
      {title && (
        <label className="flex capitalize font-bold text-xs mt-1 mb-1 text-[#193A69] dark:text-[#E2E8F0]" htmlFor={name}>
          {toTitleCase(title)}
        </label>
      )}

      <div>
        <Select
          classNames={customClassNames}
          options={
            isSelectAll && option.length > 1
              ? [{ value: option?.map((options) => options.value)?.join(','), label: `ALL ${title?.toUpperCase()}` }, ...option]
              : option
          }
          value={selectedOption}
          onChange={handleSelect}
          isSearchable={true}
          isMulti={isMulti}
          styles={customStyles(menuListWidth)}
          isDisabled={isDisabled}
        />
      </div>

      {errorMsg && (
        <p className="text-exit dark:text-exit text-sm italic mt-0 pl-2">
          {errorMsg}
        </p>
      )}
    </div>
  );
};

export default Pselect;