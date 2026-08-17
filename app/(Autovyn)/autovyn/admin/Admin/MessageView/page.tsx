"use client";

import React, { useState, useEffect } from "react";
import PaginatedTable from "../MessageViewuser/PaginatedTable";
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
  { Header: "Message", accessor: "MsgText" },
  {
    Header: "Sent Time",
    accessor: "SentOrFailTime",
    Cell: ({ value }) => formatDate(value),
  },
  { Header: "MsgCategory", accessor: "MsgCategory" },
  { Header: "TemplateName", accessor: "TemplateName" },

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
    console.log(paymentRate, "paymentRate")
    const safeNumber = (val, fallback) =>
      val === null || val === '' || Number(val) === 0
        ? fallback
        : Number(val);

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
  setSelectedType(type);

  if (type === "TOTALCOUNT") {
    setFilteredData(data);
    setUsedBalance(calculateTotalBalance());
    return;
  }

  let filtered = [];

  if (type === "MARKETTING") {
    // ✅ Match backend logic: msgcategory = 'marketing'
    filtered = data.filter(
      (item) => item.MsgCategory?.toLowerCase() === "marketing"
    );
  }

  if (type === "REGULAR") {
    // ✅ Match backend logic: everything else
    filtered = data.filter(
      (item) => item.MsgCategory?.toLowerCase() !== "marketing"
    );
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
      console.log(result.data, 'result.data')
      setData(result.data.data);
      setCountSummary(result.data.countSummary);
      console.log(result.data.paymentData?.[0], "result.data.paymentData?.[0]")
      setPaymentRate(result.data.paymentData?.[0] || null);

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
    if (!paymentRate) return '';

    const val = Number(paymentRate[type]);

    // if null, '', NaN or 0 → fallback
    if (!val || isNaN(val)) {
      return type === 'MARKETTING' ? '0.86' : '0.15';
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
        count: item.TotalCount ?? 0   // safe default
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
              <MediumTitle text="WhatsApp Messages View" />
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


        <div className="mb-6">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {summaryCards.map((card, index) => (
              <div
                key={index}
                className={`
    relative rounded-lg border
    ${card.border}
    bg-gradient-to-r ${card.bg}
    shadow-md overflow-hidden h-32 cursor-pointer
    transition-all duration-200

    ${selectedType === card.type
                    ? 'ring-4 ring-blue-500 scale-[1.03] shadow-xl'
                    : 'hover:scale-[1.02] hover:shadow-lg'
                  }
  `}
                onClick={() => handleTypeClick(card.type)}
              >

                {/* Left Icon */}
                <div className="absolute left-3 top-2">
                  <img
                    src={card.icon}
                    alt={card.type}
                    className=" h-20"
                  />
                </div>

                <div
                  className="
    absolute left-24 top-1/2 -translate-y-1/2
    md:left-1/2 md:-translate-x-1/2
    md:text-center
  "
                >
                  <h4 className="text-sm font-semibold text-gray-700">
                    {card.type}
                  </h4>

                  <p className={`text-3xl font-bold ${card.textColor}`}>
                    {card.count}
                  </p>

                  {card.percent && (
                    <span className="text-xs text-gray-600">
                      ({card.percent})
                    </span>
                  )}
                </div>


                {/* Right Illustration */}
                <div className="absolute right-6 top-2 z-[9999]">
                  <img
                    src={card.illustration}
                    alt="illustration"
                    className="h-20"
                  />
                </div>

                <div className="absolute bottom-0 left-0 w-full">
                  <img
                    src={card.svg}
                    alt={card.type}
                    className="w-full h-100"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="col-span-12 mt-2 p-2 rounded bg-white items-center shadow dark:bg-primary dark:bg-opacity-10">
        {selectedType && (
          <div className="mb-3 p-3 rounded bg-green-100 dark:bg-green-900 text-green-800 dark:text-white">
            <span className="font-semibold text-2xl">
              Used Balance {selectedType === "TOTALCOUNT" ? "(TOTAL)" : `(${selectedType})`}
            </span>
            <span className="ml-2 font-bold text-2xl">
              ₹ {usedBalance.toFixed(2)}
            </span>
          </div>
        )}

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
