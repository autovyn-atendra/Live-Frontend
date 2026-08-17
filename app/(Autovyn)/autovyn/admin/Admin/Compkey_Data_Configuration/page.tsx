"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import Ainput from "@/components/atoms/Input";
import HashloaderComponent from "@/components/Templates/hashloader";
import { Button } from "@/components/ui/button";

import {
  FaCog,
  FaSearch,
  FaFilter,
  FaSync,
  FaEdit,
  FaTimes,
  FaSave,
  FaFileExcel,
} from "react-icons/fa";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function ConfigManagerPage() {

  const user = useCurrentUser();

    const showAlert = (message, type = "success") => {
      Swal.fire({
        icon: type,
        title: type === "success" ? "Success!" : "Error!",
        text: message,
        timer: 3000,
        showConfirmButton: false
      });
    };
  
      function showSideAlert(message: any, type: any) {
        const Toast = Swal.mixin({
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          customClass: {
            container: "side-alert-container",
            popup: `side-alert-${type}`,
            title: "side-alert-title",
            icon: "side-alert-icon",
          },
        });
    
        Toast.fire({
          icon: type,
          title: message,
        });
      }

  const [configs, setConfigs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [search, setSearch] = useState("");

  const [selectedCategory, setSelectedCategory] = useState("all");

  const [editingValue, setEditingValue] = useState(null);

  const [editingDesc, setEditingDesc] = useState(null);

  const [viewMode, setViewMode] = useState("card");

  // ================= FETCH CONFIGURATIONS =================

  const fetchConfigurations = async () => {

    setIsLoading(true);

    try {

      const result = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/admin/getConfigurations`,
        {},
        {
          headers: {
            compcode: user?.Comp_Code,
          },
        }
      );

      if (result.data.status) {
        setConfigs(result.data.data || []);
      }

    } catch (error) {

      console.error("Error fetching configurations:", error);

    } finally {

      setIsLoading(false);
    }
  };

  // ================= UPDATE CONFIG VALUE =================

  const updateConfigValue = async (columnName, value) => {

    try {

      const result = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/admin/updateConfigValue`,
        {
          column_name: columnName,
          value: value,
        },
        {
          headers: {
            compcode: user?.Comp_Code,
          },
        }
      );

      if (result.data.status) {

       
        showAlert("Value updated successfully!", "success");

        fetchConfigurations();

        setEditingValue(null);
      }

    } catch (error) {

      console.error("Error updating value:", error);

    
      showAlert("Failed to update value!", "error");
    }
  };

  // ================= UPDATE DESCRIPTION =================

  const updateDescription = async (data) => {

    try {

      const result = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/admin/updateDescription`,
        data,
        {
          headers: {
            compcode: user?.Comp_Code,
          },
        }
      );

      if (result.data.status) {

       
        showAlert("Details saved successfully!", "success");

        fetchConfigurations();

        setEditingDesc(null);
      }

    } catch (error) {

      console.error("Error saving description:", error);

      
      showAlert("Failed to save description!", "error");
    }
  };

  // ================= EXPORT TO EXCEL =================

  const exportToExcel = () => {

    const excelData = filteredConfigs.map((config) => ({
      Category: config.category,
      Display_Name: config.display_name,
      Column_Name: config.column_name,
      Current_Value: config.current_value,
      Description: config.description,
      Valid_Values: config.valid_values,
      Impact: config.impact,
      Data_Type: config.data_type,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Configurations"
    );

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const data = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });

    saveAs(data, "Configurations.xlsx");
  };

  // ================= INITIAL LOAD =================

  useEffect(() => {

    fetchConfigurations();

  }, []);

  // ================= ALL CATEGORIES =================

  const ALL_CATEGORIES = [
    "Uncategorized", 
    "LEAD MANAGEMENT",
    "DISCOUNT",
    "BOOKING REFUND",
    "VEHICLE PRE INVOICE",
    "CUSTOMER DEAL SHEET",
    "VEHICLE DELIVERY TRACKER",
    "STOCK MANAGEMENT",
    "MGA APPROVAL",
    "INVENTORY",
    "FINANCE PAYOUT",
    "EMPLOYEE MASTER",
    "RECRUITMENT",
    "LOAN AND ADVANCE",
    "EMPLOYEE GATEPASS",
    "INSURANCE",
    "SERVICE",
    "TRUE VALUE",
    "ASSET",
    "PURCHASE",
    "EXPENSE MANAGEMENT",
    "DEMO CAR GATEPASS",
  ];

  // ================= FILTER =================

  const filteredConfigs = useMemo(() => {

    return configs.filter((config) => {

      const matchesSearch =
        config.display_name
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||

        config.column_name
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||

        config.description
          ?.toLowerCase()
          .includes(search.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" ||
        config.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });

  }, [configs, search, selectedCategory]);

  // ================= GROUP CATEGORY =================

  const groupedConfigs = filteredConfigs.reduce(
    (groups, config) => {

      const category =
        config.category || "Uncategorized";

      if (!groups[category]) {
        groups[category] = [];
      }

      groups[category].push(config);

      return groups;
    },
    {}
  );

 const categories = useMemo(() => {
  const cats = configs
    .map((c) => c.category)
    .filter(Boolean);
  return ["all", ...new Set(cats)];
}, [configs]);

 return (

  <div className="grid grid-cols-12">

    {/* HEADER */}

    <div className="col-span-12 shadow-lg rounded-xl">

      <div className="rounded-t bg-header dark:bg-black px-6 py-3 border dark:border-[#D0D5DD] flex flex-col md:flex-row justify-between items-center">

        <h1 className="font-bold sm:text-sm md:text-lg lg:text-xl text-white dark:text-[#37a9dd] flex items-center gap-x-3 uppercase tracking-wide">

          <FaCog size={24} className="text-white" />

          CompKeyData Configuration
        </h1>

        <div className="flex flex-wrap gap-4">

          <Button
            variant="print"
            onClick={() => window.history.back()}
          >
            Back
          </Button>

        </div>
      </div>
    </div>

    {/* MAIN CONTAINER */}

    <div className="col-span-12 mt-2 p-4 rounded-b bg-white dark:bg-black border border-[#b5bfcb] dark:border-[#D0D5DD] shadow">

      {/* FILTERS */}

      <div className="grid grid-cols-12 gap-4 mb-4">

        {/* SEARCH */}

        <div className="col-span-12 md:col-span-4">

          <label className="block text-xs font-semibold text-black dark:text-gray-400 mb-2 uppercase tracking-wider">

            <FaSearch
              className="inline mr-1 mb-0.5"
              size={12}
            />

            Search Configuration
          </label>

          <Ainput
            type="text"
            name="search"
            value={search}
            handleInputChange={(name, value) =>
              setSearch(value)
            }
            placeholder="Search by name, column or description..."
            className="w-full px-4 py-2 border border-borderColor rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* CATEGORY */}

        <div className="col-span-12 md:col-span-3">

          <label className="block text-xs font-semibold text-black dark:text-gray-400 mb-2 uppercase tracking-wider">

            Category
          </label>

          <select
            value={selectedCategory}
            onChange={(e) =>
              setSelectedCategory(e.target.value)
            }
            className="w-full px-4 py-2 border border-borderColor rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-black text-gray-700 dark:text-gray-300"
          >

            {categories.map((cat) => (

              <option key={cat} value={cat}>

                {cat === "all"
                  ? "All Categories"
                  : cat}

              </option>
            ))}
          </select>
        </div>

        {/* VIEW TYPE */}

        <div className="col-span-12 md:col-span-2">

          <label className="block text-xs font-semibold text-black dark:text-gray-400 mb-2 uppercase tracking-wider">

            View Type
          </label>

          <select
            value={viewMode}
            onChange={(e) =>
              setViewMode(e.target.value)
            }
            className="w-full px-4 py-2 border border-borderColor rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-black text-gray-700 dark:text-gray-300"
          >

            <option value="card">
              Non Tabular Form
            </option>

            <option value="table">
              Tabular Form
            </option>

          </select>
        </div>

        {/* BUTTONS */}

        <div className="col-span-12 md:col-span-3 flex items-end gap-2">
            {/* REFRESH */}

          <Button
  variant={"save"}
  onClick={fetchConfigurations}
  disabled={isLoading}
  className="shadow-sm h-10 px-12 bg-[#eff6ff] text-[#2563eb] border-2 border-[#2563eb] hover:bg-[#dbeafe]"
>
  <FaSync
    className={`${isLoading ? "animate-spin" : ""}`}
    size={14}
  />
</Button>

          {/* EXPORT */}

          <Button
            variant={"print"}
            onClick={exportToExcel}
            className="shadow-sm h-10 px-12 hidden md:block w-[126px] font-bold bg-[#ecfdf3] text-[#28a745] border-2 border-[#28a745] text-[14px]"
          >

           Export To Excel

          </Button>

        
         
        </div>
      </div>

      {/* STATS */}

      <div className="bg-white dark:bg-black rounded shadow-md border border-borderColor dark:border-borderColor-dark p-4 mb-4">

        <div className="flex justify-between items-center">

          <div className="text-base text-gray-600 dark:text-gray-400">

            Showing{" "}

            <span className="font-bold text-primary">

              {filteredConfigs?.length || 0}

            </span>{" "}

            configurations
          </div>

          {search && (

            <button
              onClick={() => setSearch("")}
              className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
            >

              <FaTimes size={12} />

              Clear search
            </button>
          )}
        </div>
      </div>

      {/* CARD VIEW */}

      {viewMode === "card" ? (

        <div className="space-y-8">

          {Object.entries(groupedConfigs).map(
            ([category, items]) => (

              <div
                key={category}
                className="bg-white dark:bg-black rounded shadow-md border border-borderColor dark:border-borderColor-dark overflow-hidden"
              >

                {/* CATEGORY HEADER */}

                <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-black px-5 py-3 border-b border-borderColor dark:border-borderColor-dark">

                  <h2 className="text-lg font-bold text-header dark:text-primary uppercase tracking-wide">

                    {category}

                    <span className="ml-2 text-sm font-normal text-black dark:text-gray-400">

                      ({items.length})

                    </span>
                  </h2>
                </div>

                {/* CARDS */}

                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5 p-5">

                  {items.map((config) => (

                    <div
                      key={config.column_name}
                      className="bg-white dark:bg-black border border-borderColor shadow-md rounded p-5 transition-all duration-200 hover:border-primary/40 hover:shadow-lg"
                    >

                      {/* TOP */}

                      <div className="flex items-start justify-between mb-4">

                        <div className="flex items-start gap-3">

                          <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-lg">

                            {config.icon || "⚙️"}

                          </div>

                          <div>

                            <h3 className="text-[15px] font-semibold text-black dark:text-white">

                              {config.display_name}

                            </h3>

                            <p className="text-xs text-grey mt-1 font-mono">

                              {config.column_name}

                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            setEditingDesc(config)
                          }
                          className="text-primary mt-2"
                        >

                          <FaEdit size={24} />

                        </button>
                      </div>

                      {/* VALUE */}

                      <div className="mb-4">

                        <p className="text-[13px] uppercase tracking-wide text-header mb-2 font-bold">

                          Current Value :
                        </p>

                        {editingValue === config.column_name ? (

                          <div className="flex items-center gap-2">

                            <input
                              type="text"
                              value={
                                config.current_value !== null &&
                                config.current_value !== undefined
                                  ? config.current_value
                                  : ""
                              }
                              onChange={(e) => {

                                const updatedConfigs = [...configs];

                                const idx =
                                  updatedConfigs.findIndex(
                                    (c) =>
                                      c.column_name ===
                                      config.column_name
                                  );

                                updatedConfigs[
                                  idx
                                ].current_value =
                                  e.target.value;

                                setConfigs(updatedConfigs);
                              }}
                              className="flex-1 border border-borderColor rounded-lg px-3 py-2 text-sm dark:bg-black"
                            />

                            <button
                              onClick={() =>
                                updateConfigValue(
                                  config.column_name,
                                  config.current_value
                                )
                              }
                              className="bg-primary text-white p-2 rounded-lg"
                            >
                              <FaSave size={14} />
                            </button>

                            <button
                              onClick={() =>
                                setEditingValue(null)
                              }
                              className="bg-gray-200 text-black p-2 rounded-lg"
                            >
                              <FaTimes size={14} />
                            </button>

                          </div>

                        ) : (

                          <div className="flex items-center justify-between">

                            <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-sm">

                              {config.current_value !== null &&
                               config.current_value !== undefined &&
                               String(config.current_value).trim() !== ""
                                ? String(config.current_value)
                                : "Not Set"}

                            </span>

                            <button
                              onClick={() =>
                                setEditingValue(config.column_name)
                              }
                              className="text-primary underline text-base"
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </div>

                      {/* DESCRIPTION */}

                      <div className="mb-4">

                        <p className="text-[13px] uppercase tracking-wide text-header mb-2 font-bold">

                          Description :
                        </p>

                        <p className="text-sm text-slate-600 dark:text-slate-300">

                          {config.description || "No description"}

                        </p>
                      </div>

                      {/* VALID VALUES */}

                      {config.valid_values && (

                        <div className="mb-4">

                          <p className="text-[13px] uppercase tracking-wide text-header mb-2 font-bold">

                            Valid Values :
                          </p>

                          <p className="text-sm text-slate-600 dark:text-slate-300">

                            {config.valid_values}

                          </p>
                        </div>
                      )}

                      {/* IMPACT */}

                      {config.impact && (

                        <div className="border-l-2 border-yellow pl-3">

                          <p className="text-[13px] uppercase tracking-wide text-yellow font-bold mb-1">

                            Impact
                          </p>

                          <p className="text-sm text-slate-600 dark:text-slate-300">

                            {config.impact}

                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>

      ) : (

        /* TABLE VIEW */

        <div className="overflow-x-auto bg-white dark:bg-black rounded-lg shadow-md border border-borderColor dark:border-borderColor-dark">

          <table className="w-full text-sm">

            <thead className="bg-header text-white">

              <tr>

                <th className="px-4 py-3 text-left">
                  Category
                </th>

                <th className="px-4 py-3 text-left">
                  Display Name
                </th>

                <th className="px-4 py-3 text-left">
                  Column Name
                </th>

                <th className="px-4 py-3 text-left">
                  Value
                </th>

                <th className="px-4 py-3 text-left">
                  Description
                </th>

                <th className="px-4 py-3 text-left">
                  Valid Values
                </th>

                <th className="px-4 py-3 text-left">
                  Impact
                </th>

                <th className="px-4 py-3 text-center">
                  Action
                </th>

              </tr>
            </thead>

            <tbody>

              {filteredConfigs.map((config, index) => (

                <tr
                  key={index}
                  className="border-b border-borderColor hover:bg-primary/5"
                >

                  <td className="px-4 py-3">
                    {config.category}
                  </td>

                  <td className="px-4 py-3 font-semibold">
                    {config.display_name}
                  </td>

                  <td className="px-4 py-3 font-mono text-xs">
                    {config.column_name}
                  </td>

                  <td className="px-4 py-3">

                    <input
                      value={
                        config.current_value !== null &&
                        config.current_value !== undefined
                          ? config.current_value
                          : ""
                      }
                      onChange={(e) => {

                        const updatedConfigs = [...configs];

                        const idx =
                          updatedConfigs.findIndex(
                            (c) =>
                              c.column_name ===
                              config.column_name
                          );

                        updatedConfigs[idx].current_value =
                          e.target.value;

                        setConfigs(updatedConfigs);
                      }}
                      className="border border-borderColor rounded px-2 py-1 w-full dark:bg-black"
                    />
                  </td>

                  <td className="px-4 py-3">
                    {config.description}
                  </td>

                  <td className="px-4 py-3">
                    {config.valid_values}
                  </td>

                  <td className="px-4 py-3">
                    {config.impact}
                  </td>

                  <td className="px-4 py-3 text-center">

                    <Button
                      variant={"save"}
                      size={"sm"}
                      onClick={() =>
                        updateConfigValue(
                          config.column_name,
                          config.current_value
                        )
                      }
                    >
                      Save
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>

    {/* MODAL */}

    {editingDesc && (

      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-auto animate-fadeIn">

          <div className="bg-primary px-6 py-3 rounded-t-lg">

            <h3 className="text-lg font-semibold text-white">

              Edit Configuration
            </h3>
          </div>

          <div className="p-6 space-y-4">

            {/* DISPLAY NAME */}

            <div>

              <label className="block text-sm font-medium mb-1 text-header">

                Display Name
              </label>

              <input
                type="text"
                value={editingDesc.display_name || ""}
                onChange={(e) =>
                  setEditingDesc({
                    ...editingDesc,
                    display_name: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-body-color rounded"
              />
            </div>

            {/* CATEGORY */}

            <div>

              <label className="block text-sm font-medium mb-1 text-header">

                Category
              </label>

              <select
                value={editingDesc.category || ""}
                onChange={(e) =>
                  setEditingDesc({
                    ...editingDesc,
                    category: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-body-color rounded"
              >

                {ALL_CATEGORIES.map((cat) => (

                  <option key={cat} value={cat}>

                    {cat}

                  </option>
                ))}
              </select>
            </div>

            {/* DESCRIPTION */}

            <div>

              <label className="block text-sm font-medium mb-1 text-header">

                Description
              </label>

              <textarea
                rows="3"
                value={editingDesc.description || ""}
                onChange={(e) =>
                  setEditingDesc({
                    ...editingDesc,
                    description: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-body-color rounded"
              />
            </div>

            {/* VALID VALUES */}

            <div>

              <label className="block text-sm font-medium mb-1 text-header">

                Valid Values
              </label>

              <input
                type="text"
                value={editingDesc.valid_values || ""}
                onChange={(e) =>
                  setEditingDesc({
                    ...editingDesc,
                    valid_values: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-body-color rounded"
              />
            </div>

            {/* IMPACT */}

            <div>

              <label className="block text-sm font-medium mb-1 text-header">

                Impact
              </label>

              <textarea
                rows="2"
                value={editingDesc.impact || ""}
                onChange={(e) =>
                  setEditingDesc({
                    ...editingDesc,
                    impact: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-body-color rounded"
              />
            </div>

            {/* DATA TYPE */}

            <div>

              <label className="block text-sm font-medium mb-1 text-header">

                Data Type
              </label>

              <select
                value={editingDesc.data_type || "string"}
                onChange={(e) =>
                  setEditingDesc({
                    ...editingDesc,
                    data_type: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-body-color rounded"
              >

                <option value="string">
                  String
                </option>

                <option value="boolean">
                  Boolean
                </option>

                <option value="number">
                  Number
                </option>

                <option value="document">
                  Document
                </option>
                <option value="date">
                  Date
                </option>

              </select>
            </div>

          </div>

          {/* FOOTER */}

          <div className="flex gap-3 p-6 pt-0">

            <button
              onClick={() =>
                updateDescription(editingDesc)
              }
              className="flex-1 bg-primary text-white py-2 rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >

              <FaSave size={14} />

              Save Changes
            </button>

            <button
              onClick={() =>
                setEditingDesc(null)
              }
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-md"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}

    {/* LOADER */}

    <HashloaderComponent isLoading={isLoading} />

  </div>
);
}