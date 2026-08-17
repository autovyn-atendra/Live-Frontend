// import { Checkbox } from "antd";
// import MediumTitle from "../atoms/MediumTitle";
// import { useEffect, useState } from "react";
// import Ainput from "@/components/atoms/Input";

// const ReportsRights = ({
//   data,
//   selected,
//   handleCheckbox,
//   SelectAllChange,
//   Title,
// }) => {
//   const [searchTerm, setSearchTerm] = useState(""); // State to hold the search input
//   const [filteredData, setFilteredData] = useState(data); // Initialize with full data

//   const handleData = (name, value) => {
//     setSearchTerm(value);
//   };

//   useEffect(() => {
//     if (searchTerm.trim() === "") {
//       // Show the full list when search term is empty
//       setFilteredData(data);
//     } else {
//       // Filter the data based on the search term
//       setFilteredData(
//         data.filter(entry =>
//           `${entry.value} - ${entry.label}`.toLowerCase().includes(searchTerm.toLowerCase())
//         )
//       );
//     }
//   }, [searchTerm, data]); // Include `data` in the dependency array to handle updates to `data`

//   return (
//     <div className="relative flex flex-col bg-[#F5F7FA] border-1 border-[#D1D9E6] dark:bg-primary dark:bg-opacity-10 break-words w-full shadow-lg rounded-lg bg-blueGray-100 border-0">
//       <div className="rounded-t bg-[#F0F1F2] shadow-lg dark:bg-dark mb-0 pl-3 pr-2 py-1 uppercase">
//         <div className="text-center flex justify-between items-center">
//           <div>
//             <Checkbox
//               className="text-xl font-bold dark:text-white"
//               indeterminate={selected.length > 0 && selected.length < data.length}
//               checked={selected.length === data.length}
//               onChange={SelectAllChange}
//             >
//               <p className="text-blueGray-700 text-base font-medium cursor-pointer py-1">
//                 {Title}
//               </p>
//             </Checkbox>
//           </div>
//           <div className="-mt-2 p-0">
//             <Ainput
//               value={searchTerm}
//               name="searchTerm"
//               type={"text"}
//               handleInputChange={handleData}
//             />
//           </div>
//         </div>
//       </div>

//       <div className="flex-auto px-8 lg:px-10 mt-1 py-0.5 h-56 overflow-y-scroll">
//         {filteredData.map(branch => (
//           <div key={branch.value}>
//             <Checkbox
//               key={branch.value}
//               checked={selected.includes(branch.value)}
//               onChange={() => handleCheckbox(branch.value)}
//               className="dark:text-white w-1/2 font-semibold uppercase whitespace-nowrap"
//             >
//               {branch.value} - {branch.label}
//             </Checkbox>
//             <br />
//           </div>
//         ))}
//       </div>

//       <div className="py-1.5"> </div>
//     </div>
//   );

// };

// export default ReportsRights;



import { Checkbox } from "antd";
import MediumTitle from "../atoms/MediumTitle";
import { useEffect, useState } from "react";
import Ainput from "@/components/atoms/Input";
import { FaSearch } from "react-icons/fa";

const ReportsRights = ({
  data,
  selected,
  handleCheckbox,
  SelectAllChange,
  Title,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState(data);

  const handleData = (name, value) => {
    setSearchTerm(value);
  };

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredData(data);
    } else {
      setFilteredData(
        data.filter(entry =>
          `${entry.value} - ${entry.label}`.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [searchTerm, data]);

  return (
    <div className="relative flex flex-col bg-white dark:bg-black  rounded-md border border-borderColor dark:border-borderColor-dark  bg-gray-100">
      {/* Header */}
      <div className="flex justify-between items-center p-2 px-3 border-b border-borderColor dark:border-borderColor-dark   bg-header dark:bg-black rounded-t">
        <Checkbox
          indeterminate={selected.length > 0 && selected.length < data.length}
          checked={selected.length === data.length}
          onChange={SelectAllChange}
          className="text-sm font-semibold dark:text-white"
        >
          <span className="uppercase text-white">{Title}</span>
        </Checkbox>
        <div className="relative w-40">
          <FaSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
          <input
            value={searchTerm}
            onChange={(e) => handleData("searchTerm", e.target.value)}
            placeholder="Search..."
            className="pl-7 pr-2 py-1 rounded-md text-sm border border-borderColor dark:border-borderColor-dark  bg-gray-100 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* List */}
      <div className="p-3 grid grid-cols-2 gap-y-2 h-56 overflow-y-auto custom-scrollbar">
        {filteredData.length > 0 ? (
          filteredData.map((branch) => (
            <div key={branch.value}  className="whitespace-normal break-words leading-relaxed">
              <Checkbox
                checked={selected.includes(branch.value)}
                onChange={() => handleCheckbox(branch.value)}
                className="text-sm font-medium uppercase dark:text-white whitespace-normal break-words leading-relaxed"
              >
                {branch.value} - {branch.label}
              </Checkbox>
            </div>
          ))
        ) : (
          <p className="col-span-2 text-gray-400 text-sm italic">No results found</p>
        )}
      </div>
    </div>
  );
};

export default ReportsRights;