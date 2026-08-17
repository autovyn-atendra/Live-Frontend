import { Checkbox } from "antd";

const Echeckbox = ({ name, handleInputChange, label, value }) => {
  const handleCheckboxChange = (checked) => {
    handleInputChange(name, checked);
  };

  return (
    <div className="">
      <Checkbox
        onChange={(e) => handleCheckboxChange(e.target.checked)}
        checked={value}
      >
        <label
          className="block uppercase  text-xs font-bold mb-1  text-[#193A69] dark:text-[#E2E8F0]"
          // style={{ fontSize: "15px" }}
        >
          {label}
        </label>
      </Checkbox>
    </div>
  );
};

export default Echeckbox;
