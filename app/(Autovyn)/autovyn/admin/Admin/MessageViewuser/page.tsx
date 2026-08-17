"use client";

import React, { useState, useEffect } from "react";
import PaginatedTable from "./PaginatedTable";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import axios from "axios";
import MediumTitle from "@/components/atoms/MediumTitle";
import Ainput from "@/components/atoms/Input";
import { CgSpinner } from "react-icons/cg";
import { Button } from "@/components/ui/button";
import { GrUserAdmin } from "react-icons/gr";

// Define your columns
const columns = [
  { Header: "Mobile No", accessor: "ToFromPhoneNo" },
  { 
    Header: "Message", 
    accessor: "MsgText",
    Cell: ({ value }) => (
      <div 
        className="whitespace-normal break-words max-w-[500px] cursor-help"
        title={value} // Shows full message on hover
      >
        {value}
      </div>
    )
  },
  {
    Header: "Sent Time",
    accessor: "SentOrFailTime",
    Cell: ({ value }) => formatDate(value),
  },


  {
    Header: "Delivered Time",
    accessor: "DeliveredTime",
    Cell: ({ value }) => formatDate(value),
  },
  {
    Header: "Read Time",
    accessor: "ReadTime",
    Cell: ({ value }) => formatDate(value),
  },
];

// Sample data format function
const formatDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");

  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12; // Convert to 12-hour format and handle midnight (0 -> 12)
  const formattedHours = String(hours).padStart(2, "0");

  return `${day}/${month}/${year} ${formattedHours}:${minutes} ${ampm}`;
};




const EmployeePage = () => {
  const [selectedType, setSelectedType] = useState(null);
  const [filteredData, setFilteredData] = useState([]);
  const [usedBalance, setUsedBalance] = useState(0);
  const [paymentRate, setPaymentRate] = useState(null);

  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [countSummary, setCountSummary] = useState([]); // <-- Add state for count
  const [DATE_FROM, setDATE_FROM] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [DATE_TO, setDATE_TO] = useState(new Date().toISOString().slice(0, 10));
  const user = useCurrentUser();

  const TYPE_RATE = React.useMemo(() => {
    console.log(paymentRate, "paymentRate");
    const safeNumber = (val, fallback) =>
      val === null || val === "" || Number(val) === 0 ? fallback : Number(val);

    return {
      REGULAR: safeNumber(paymentRate?.REGULAR, 0.15),
      MARKETTING: safeNumber(paymentRate?.MARKETTING, 0.86),
      TOTALCOUNT: 0,
    };
  }, [paymentRate]);

  const calculateTotalBalance = () => {
    let total = 0;

    countSummary.forEach((item) => {
      const rate = TYPE_RATE[item.TYPE] || 0;
      total += (item.TotalCount || 0) * rate;
    });

    return total;
  };

  const handleTypeClick = (type) => {
    if (user?.id !== 1) return; // Only allow for admin
    
    setSelectedType(type);
    console.log(type, "type");
    if (type === "TOTALCOUNT") {
      setFilteredData(data);

      const totalBalance = calculateTotalBalance();
      setUsedBalance(totalBalance);

      return;
    }

    let filtered = [];

    if (type === "REGULAR") {
      filtered = data.filter(
        (item) =>
          item.BalUsed === null ||
          item.BalUsed === 0 ||
          Number(item.BalUsed) === 0.15
      );
    }

    if (type === "MARKETTING") {
      filtered = data.filter((item) => Number(item.BalUsed) === 0.84);
    }

    setFilteredData(filtered);

    const summaryItem = countSummary.find((item) => item.TYPE === type);

    const rate = TYPE_RATE[type] || 0;
    const total = summaryItem?.TotalCount || 0;

    setUsedBalance(total * rate);
  };

  const showapi = async () => {
    setIsLoading(true);
    try {
      if (DATE_FROM && DATE_TO) {
      } else {
        return;
      }
      setData([]);
      const result = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/users/MessageHistory`,
        {
          Loc_code: user?.branch,
          DATE_FROM: DATE_FROM,
          DATE_TO: DATE_TO,
        },
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
            token: user?.email,
          },
        }
      );
      console.log(result.data, "result.data");
      setData(result.data.data);
      setCountSummary(result.data.countSummary);
      console.log(result.data.paymentData?.[0], "result.data.paymentData?.[0]");
      setPaymentRate(result.data.paymentData?.[0] || null);
      
      // Set filtered data to all data for all users
      setFilteredData(result.data.data);
      
      // Reset selected type for admin when new data loads
      if (user?.id == 1) {
        setSelectedType(null);
        setUsedBalance(0);
      }
    } catch (error) {
      console.error("Error", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    showapi();
  }, []);

  async function onRowDoubleClick(row, index) {
    console.log(row);
  }

  const getPercent = (type) => {
    if (!paymentRate) return "";

    const val = Number(paymentRate[type]);

    // if null, '', NaN or 0 → fallback
    if (!val || isNaN(val)) {
      return type === "MARKETTING" ? "0.86" : "0.15";
    }

    return val.toFixed(2);
  };

  // {TYPE: "MARKETTING", TotalCount: 71}
  // 1
  // :
  // {TYPE: "REGULAR", TotalCount: 13625}
  // 2
  // :
  // {TYPE: "TOTALCOUNT", TotalCount: 13696}

  const summaryCardConfig = {
    MARKETTING: {
      type: "MARKETTING",
      bg: "from-orange-100 to-orange-200",
      border: "border-orange-400",
      icon: "/Frame11.png",
      illustration: "/Frame22.png",
      textColor: "text-orange-500",
      svg: "/Frame33.png",
      percent: getPercent("MARKETTING"),
    },
    REGULAR: {
      type: "REGULAR",
      bg: "from-blue-100 to-blue-200",
      border: "border-blue-400",
      icon: "/Ragular11.png",
      illustration: "/Ragular22.png",
      textColor: "text-blue-500",
      svg: "/Ragular33.png",

      percent: getPercent("REGULAR"),
    },
    TOTALCOUNT: {
      type: "TOTALCOUNT",
      bg: "from-green-100 to-green-200",
      border: "border-green-400",
      icon: "/Total11.png",
      illustration: "/Total22.png",
      textColor: "text-green-500",
      svg: "/Total33.png",
      percent: "",
    },
  };

  const summaryCards = countSummary
    ?.map((item) => {
      const config = summaryCardConfig[item.TYPE];
      if (!config) return null;

      return {
        ...config,
        count: item.TotalCount ?? 0, // safe default
      };
    })
    .filter(Boolean);

  return (
    <div className="grid grid-cols-12">
      <div className="col-span-12 gap-2 shadow-lg rounded-xl">
        <div className="rounded-t bg-white dark:bg-dark px-6 py-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <GrUserAdmin size={34} className="mt-1" title="Payroll" />
              <MediumTitle text="WhatsApp Messages View For User" />
            </div>
            <div className="flex">
              <Button
                variant="print"
                onClick={() => window.history.back()}
                className="flex items-center gap-1"
              >
                Back
              </Button>
            </div>
          </div>
        </div>
        <div className="flex gap-2 p-2 flex-wrap">
          <div className="md:col-span-2">
            <Ainput
              title="DATE FROM"
              type="date"
              name="DATE_FROM"
              value={DATE_FROM}
              handleInputChange={(name, value) => {
                setDATE_FROM(value);
              }}
            />
          </div>

          <div className="md:col-span-2">
            <Ainput
              title="DATE TO"
              type="date"
              name="DATE_TO"
              value={DATE_TO}
              handleInputChange={(name, value) => {
                setDATE_TO(value);
              }}
            />
          </div>
          <div className="flex items-end">
            <Button
              className=" w-[126px] h-9"
              onClick={showapi}
              size={"sm"}
              variant={"save"}
              disabled={isLoading}
            >
              {isLoading ? (
                <CgSpinner className="animate-spin text-xl mx-auto text-white" /> // Spinner icon
              ) : (
                "Show"
              )}
            </Button>
          </div>
        </div>
      </div>
    
      <div className="col-span-12 mt-2 p-2 rounded bg-white items-center shadow dark:bg-primary dark:bg-opacity-10">
       

        <div>
          <PaginatedTable
            onRowDoubleClick={onRowDoubleClick}
            columns={columns}
            data={filteredData}
          />
        </div>
      </div>
    </div>
  );
};

export default EmployeePage;

