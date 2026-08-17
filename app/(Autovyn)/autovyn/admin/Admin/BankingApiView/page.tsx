"use client";

import React, { useState, useEffect } from "react";
import PaginatedTable from "@/components/Templates/PaginatedTable";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import axios from "axios";
import { FaUsers } from "react-icons/fa";
import MediumTitle from "@/components/atoms/MediumTitle";
import Ainput from "@/components/atoms/Input";
import { CgSpinner } from "react-icons/cg";
import { Button } from "@/components/ui/button";
import { GrUserAdmin } from "react-icons/gr";
import { Card, CardContent } from "@/components/ui/card";

// Define your columns
const columns = [
  { Header: "API Type", accessor: "ApiType" },
  { Header: "UTD", accessor: "UTD" },
  { Header: "IFSC Code", accessor: "Ifsc" },
  { Header: "Account Number", accessor: "account_number" },
  { Header: "Status Code", accessor: "code" },
  { Header: "Message", accessor: "message" },
  { Header: "Name at Bank", accessor: "name_at_bank" },
  { Header: "Transaction ID", accessor: "transaction_id" },

  {
    Header: "Created At",
    accessor: "Created_At",
    Cell: ({ value }) => formatDate(value),
  },

  { Header: "Bank", accessor: "BANK" },
  { Header: "Branch", accessor: "BRANCH" },
  { Header: "City", accessor: "CITY" },
  { Header: "State", accessor: "STATE" },
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

const DEFAULT_RATE = {
  ACCOUNT_API: 1,
  IFSC_API: 1,
};



const EmployeePage = () => {

  const [usedBalance, setUsedBalance] = useState(0);

  const [selectedType, setSelectedType] = useState("TOTAL");
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [countSummary, setCountSummary] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentRate, setPaymentRate] = useState(null);
  const [DATE_FROM, setDATE_FROM] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [DATE_TO, setDATE_TO] = useState(new Date().toISOString().slice(0, 10));
  const user = useCurrentUser();

  const summaryCardConfig = {
    ACCOUNT_API: {
      type: "ACCOUNT_API",
      bg: "from-orange-100 to-orange-200",
      border: "border-orange-400",
      icon: "/ApiLogsPics/Account_Api11.png",
      illustration: "/ApiLogsPics/Account_Api22.png",
      textColor: "text-orange-600",
      svg: "/Frame33.png",
    },
    IFSC_API: {
      type: "IFSC_API",
      bg: "from-blue-100 to-blue-200",
      border: "border-blue-400",
      icon: "/ApiLogsPics/Ifsc_api11.png",
      illustration: "/ApiLogsPics/Ifsc_api22.png",
      textColor: "text-blue-600",
      svg: "/Ragular33.png",
    },
    TOTAL: {
      type: "TOTAL",
      bg: "from-green-100 to-green-200",
      border: "border-green-400",
      icon: "/TOTALPANADHAR.png",
      illustration: "/Total22.png",
      textColor: "text-green-600",
      svg: "/Total33.png",
    },
  };

  const showapi = async () => {
    setIsLoading(true);
    try {
      const result = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/users/AccountApiLogs`,
        {
          DATE_FROM,
          DATE_TO,
        },
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
            token: user?.email,
          },
        }
      );

      setData(result.data.data);
      setFilteredData(result.data.data); // 👈 default TOTAL
      setCountSummary(result.data.countSummary);
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


  const getRate = (type) => {
    if (!paymentRate) return DEFAULT_RATE[type] || 0;
    console.log(paymentRate, "paymentRate")
    const apiRate = Number(paymentRate[type]);

    if (!apiRate || isNaN(apiRate)) {
      return DEFAULT_RATE[type] || 0;
    }

    return apiRate;
  };

  const totalUsedAmount = countSummary.reduce((sum, item) => {
    if (item.TYPE === "TOTAL") return sum;

    const rate = getRate(item.TYPE);
    return sum + item.TotalCount * rate;
  }, 0);




  const summaryCards = countSummary.map(item => {
    const type = item.TYPE;

    return {
      ...summaryCardConfig[type],
      type,
      count: item.TotalCount,
      rate: type !== "TOTAL" ? getRate(type) : null,
      usedAmount:
        type !== "TOTAL"
          ? item.TotalCount * getRate(type)
          : totalUsedAmount,
    };
  });


  const handleCardClick = (type) => {
    setSelectedType(type);

    if (type === "TOTAL") {
      setFilteredData(data);
      setUsedBalance(totalUsedAmount);
      return;
    }

    setFilteredData(data.filter(row => row.ApiType === type));

    const card = summaryCards.find(c => c.type === type);
    setUsedBalance(card?.usedAmount || 0);
  };


  return (
    <div className="grid grid-cols-12">
      <div className="col-span-12 gap-2 shadow-lg rounded-xl">
        <div className="rounded-t bg-white dark:bg-dark px-6 py-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <GrUserAdmin size={34} className="mt-1" title="Payroll" />
              <MediumTitle text="Banking Messages Log View" />
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {summaryCards.map((card, index) => (
            <div
              key={index}
              onClick={() => handleCardClick(card.type)}
              className={`
        relative rounded-lg border
        ${card.border}
        bg-gradient-to-r ${card.bg}
        shadow-md overflow-hidden h-32 cursor-pointer
        transition-all duration-200

        ${selectedType === card.type
                  ? "ring-4 ring-blue-500 scale-[1.03] shadow-xl"
                  : "hover:scale-[1.02] hover:shadow-lg"}
      `}
            >

              {/* Left Icon */}
              <div className="absolute left-3 top-2">
                <img
                  src={card.icon}
                  alt={card.type}
                  className="h-20"
                />
              </div>

              {/* Center Content */}
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

                {card.rate && (
                  <span className="text-xs text-gray-600">
                    (₹ {card.rate})
                  </span>
                )}
              </div>

              {/* Right Illustration */}
              <div className="absolute right-6 top-2 z-[10]">
                <img
                  src={card.illustration}
                  alt="illustration"
                  className="h-20"
                />
              </div>

              {/* Bottom SVG */}
              <div className="absolute bottom-0 left-0 w-full">
                <img
                  src={card.svg}
                  alt={card.type}
                  className="w-full"
                />
              </div>

            </div>
          ))}

        </div>
      </div>
      <div className="col-span-12 mt-2 p-2 rounded bg-white items-center shadow dark:bg-primary dark:bg-opacity-10">

        {selectedType && (
          <Card className="mb-3 bg-green-100 border border-green-300">
            <CardContent className="p-3 text-lg font-semibold">
              Used Amount ({selectedType}) :
              <span className="ml-2 text-green-700 font-bold">
                ₹ {usedBalance.toFixed(2)}
              </span>
            </CardContent>
          </Card>

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
