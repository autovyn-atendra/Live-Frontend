import { useState, useMemo } from "react";
import { Checkbox, Input } from "antd";
import MediumTitle from "../atoms/MediumTitle";

const BranchRightsSection = ({
  data = [],
  selected = [],
  handleCheckbox,
  SelectAllChange,
  Title,
}) => {
  const [search, setSearch] = useState("");

  const filteredData = useMemo(() => {
    if (!search) return data;

    const searchText = search.toLowerCase();

    return data.filter((branch) =>
      String(branch.Code).includes(searchText) ||
      branch.Name.toLowerCase().includes(searchText)
    );
  }, [search, data]);

  // ✅ Select all for filtered items
  const handleSelectAllFiltered = (e) => {
    const filteredCodes = filteredData.map((b) => b.Code);

    if (e.target.checked) {
      SelectAllChange(filteredCodes);
    } else {
      SelectAllChange([]);
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Search Input - Matching the style */}
      <div className="px-2 pb-2">
        <Input
          placeholder="Search ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          className="w-full border border-borderColor dark:border-borderColor-dark rounded px-3 py-1 text-sm"
        />
      </div>

      {/* Select All Checkbox */}
      <div className="px-2 pb-2 border-b border-borderColor dark:border-borderColor-dark">
        <Checkbox
          indeterminate={
            selected.length > 0 &&
            selected.length < filteredData.length
          }
          checked={
            filteredData.length > 0 &&
            filteredData.every((b) => selected.includes(b.Code))
          }
          onChange={handleSelectAllFiltered}
          className="dark:text-white font-medium"
        >
          Select All
        </Checkbox>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto px-2">
        {filteredData.length ? (
          filteredData.map((branch) => (
            <div key={branch.Code} className="py-1">
              <Checkbox
                checked={selected.includes(branch.Code)}
                onChange={() => handleCheckbox(branch.Code)}
                className="dark:text-white w-full font-semibold"
              >
                {branch.Code} - {branch.Name}
              </Checkbox>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500 mt-2 text-center">No Data found</p>
        )}
      </div>
    </div>
  );
};

export default BranchRightsSection;