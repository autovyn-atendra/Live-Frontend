import { Checkbox } from "antd";

const Acheckbox = ({ name, handleInputChange, label, value, disabled,ShortName }) => {
  const handleCheckboxChange = (checked) => {
    handleInputChange(name, checked);
  };

  return (
    <div className="">
      <Checkbox
        onChange={(e) => handleCheckboxChange(e.target.checked)}
        checked={value}
        disabled={disabled}
      >
        <label className="flex capitalize font-bold text-xs text-[#193A69] dark:text-[#E2E8F0]" htmlFor={name}>
          {/* {label?.toLowerCase()} */}

          {ShortName ? label : label ?.toLowerCase()}
           
        </label>
      </Checkbox>
    </div>
  );
};

export default Acheckbox;
