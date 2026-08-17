"use client";
import React, { useEffect, useState } from "react";
import { BsPeopleFill } from "react-icons/bs";
import { FaGlobe } from "react-icons/fa";
import ChartCard from "./chartcard";
import { LuRefreshCcwDot } from "react-icons/lu";
import MediumTitle from "@/components/atoms/MediumTitle";
import SelectSearch from "@/components/atoms/Select";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import axios from "axios";
import SmallTitle from "@/components/atoms/smallTitle";
import CompairChart from "./compairchart";
import HashloaderComponent from "@/components/Templates/hashloader";
import Ainput from "@/components/atoms/Einput";
import { Result } from "antd";

const monthsArray = [
  { label: "Apr", value: 4 },
  { label: "May", value: 5 },
  { label: "Jun", value: 6 },
  { label: "Jul", value: 7 },
  { label: "Aug", value: 8 },
  { label: "Sep", value: 9 },
  { label: "Oct", value: 10 },
  { label: "Nov", value: 11 },
  { label: "Dec", value: 12 },
  { label: "Jan", value: 1 },
  { label: "Feb", value: 2 },
  { label: "Mar", value: 3 },
];
const page = () => {
  const [isClicked, setIsClicked] = useState(false);
  const user = useCurrentUser();
  const [dashbord, setDashboard] = useState({
    branch: user?.branch,
    monthFrom: '01/01/2024',
    monthTo: '01/01/2025',
  });

  const handleInputchange = (name, value) => {
    setDashboard((prev) => ({
      ...prev,
      [name]: value,
      branch: user?.branch,
    }));
  };

  const handleDashboard = async () => {
    // setIsClicked(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/dashboards/sDashboard`,
        {
          start: dashbord.monthFrom,
          end: dashbord.monthTo
        },
        {
          headers: {
            compcode: "NA",
          },
        }
      );
      console.log(response)
      // setIsClicked(false);
    } catch (err) {
      // setIsClicked(false);
    }
  };
  return (
    <main className="grid grid-cols-12 w-full shadow dark:bg-primary dark:bg-opacity-10 rounded-lg gap-2 p-2 bg-off">
      <div className="col-span-12 lg:col-span-2 ">
        <Ainput
          value={dashbord.monthFrom?.toString()}
          title={"Date From"}
          name={"monthFrom"}
          handleInputChange={handleInputchange}
          type="text"
          autoComplete="off"

        />
      </div>
      <div className="col-span-12 lg:col-span-2 ">
        <Ainput
          value={dashbord.monthTo?.toString()}
          title={"Date To"}
          name={"monthTo"}
          handleInputChange={handleInputchange}
          type="text"
          autoComplete="off"
        />
      </div>
      <div className="col-span-12 lg:col-span-1" onClick={handleDashboard}>
        <div className="bg-primary  text-center font-bold text-white h-10 w-20 flex justify-center mt-6  rounded-md relative bg-sky-500">
          <LuRefreshCcwDot
            className={`absolute  h-10 w-10 mt-4   ${
              isClicked ? "animate-spin" : ""
            }`}
          />
        </div>
      </div>
      <HashloaderComponent isLoading={isClicked} />
    </main>
  );
};

export default page;
