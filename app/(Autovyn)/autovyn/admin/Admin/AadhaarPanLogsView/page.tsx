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
    { Header: "Value", accessor: "Value" },
    { Header: "User Name", accessor: "LoginUser" },
    { Header: "TYPE", accessor: "MappedType" },
    { Header: "DATE", accessor: "Date" },
];


const EmployeePage = () => {
    const [selectedType, setSelectedType] = useState(null);
    const [filteredData, setFilteredData] = useState([]);
    const [usedAmount, setUsedAmount] = useState(0);
    const [paymentRate, setPaymentRate] = useState(null);
    const [data, setData] = useState([]);
    const [countSummary, setCountSummary] = useState([]); // <-- Add state for count
    const [isLoading, setIsLoading] = useState(false);
    const [DATE_FROM, setDATE_FROM] = useState(
        new Date().toISOString().slice(0, 10)
    );
    const [DATE_TO, setDATE_TO] = useState(new Date().toISOString().slice(0, 10));
    const user = useCurrentUser();
    const showapi = async () => {
        setIsLoading(true);
        try {
            if (DATE_FROM && DATE_TO) {
            } else {
                return;
            }
            setData([]);
            const result = await axios.post(
                `${process.env.NEXT_PUBLIC_URL}/users/AadhaarPanMessageHistory`,
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
            setData(result.data.data);
            // setCountSummary(result.data.countSummary); // <-- set count summary
            // setData(result.data.data);
            setFilteredData(result.data.data);
            setCountSummary(result.data.countSummary);
            console.log(result.data.paymentData, "result.data.paymentData")
            setPaymentRate(result.data.paymentData?.[0] || null);
            setSelectedType(null);
            setUsedAmount(0);

        } catch (error) {
            console.error("Error", error);
        } finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        showapi();
    }, []);
    // Total count



    const getRate = (type) => {
        const defaultRate = {
            AADHAAR: 1.18,
            PAN: 0.86,
        };

        // ✅ TOTAL ka rate nahi hota
        if (type === "TOTAL") return 0;
        if (!paymentRate) return defaultRate[type] || 0;
        const apiRate = Number(paymentRate[type]);
        if (!apiRate || isNaN(apiRate)) {
            return defaultRate[type];
        }

        return apiRate;
    };

    const totalUsedAmount = countSummary.reduce((total, item) => {
        const rate = getRate(item.Type);
        return total + (item.Count || 0) * rate;
    }, 0);






    const summaryCardConfig = {
        AADHAAR: {
            type: "AADHAAR",
            bg: "from-orange-100 to-orange-200",
            border: "border-orange-400",
            icon: "/AADHAAR11.png",
            illustration: "/AADHAAR22.png",
            textColor: "text-orange-600",
            svg: "/Frame33.png",
        },
        PAN: {
            type: "PAN",
            bg: "from-blue-100 to-blue-200",
            border: "border-blue-400",
            icon: "/PAN11.png",
            illustration: "/PAN22.png",
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

    const summaryCards = [
        ...countSummary.map((item) => ({
            ...summaryCardConfig[item.Type],
            count: item.Count,
            rate: getRate(item.Type),
        })),

    ];





    const handleCardClick = (type) => {
        setSelectedType(type);

        if (type === "TOTAL") {
            setFilteredData(data);
            setUsedAmount(totalUsedAmount);
            return;
        }

        const filtered = data.filter(row => row.MappedType === type);
        setFilteredData(filtered);

        const summary = countSummary.find(item => item.Type === type);
        const count = summary?.Count || 0;
        const rate = getRate(type);

        setUsedAmount(count * rate);
    };






    return (
        <div className="grid grid-cols-12">
            <div className="col-span-12 gap-2 shadow-lg rounded-xl">
                <div className="rounded-t bg-white dark:bg-dark px-6 py-2">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <GrUserAdmin size={34} className="mt-1" title="Payroll" />
                            <MediumTitle text="Aadhaar & Pan Api Fetch View" />
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
                                ₹ {usedAmount.toFixed(2)}
                            </span>
                        </CardContent>
                    </Card>
                )}
                <div>
                    <PaginatedTable
                        columns={columns}
                        data={filteredData}
                    />

                </div>
            </div>
        </div>

    );
};

export default EmployeePage;
