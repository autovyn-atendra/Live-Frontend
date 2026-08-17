import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { TfiControlBackward, TfiControlForward } from "react-icons/tfi";
import axios from "axios";
import { useCurrentUser } from "@/app/hooks/use-current-user";

const CustomCalendar = ({
  startDate,
  endDate,
  setstartDate,
  setendDate,
  color,
  setColor,
}) => {
  const [formattedStartDate, setFormattedStartDate] = useState(startDate);
  const [formattedEndDate, setFormattedEndDate] = useState(endDate);
  const user = useCurrentUser();
  useEffect(() => {
    setFormattedStartDate(startDate);
    setFormattedEndDate(endDate);
  }, [startDate, endDate]);

  const getDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dateRange = [];
    while (start <= end) {
      dateRange.push(new Date(start));
      start.setDate(start.getDate() + 1);
    }
    return dateRange;
  };

  const dateRange = getDateRange(formattedStartDate, formattedEndDate);
  const startDayOfWeek = new Date(formattedStartDate).getDay();

  const goToPreviousMonth = () => {
    // const a = new Date(endDate);
    // const month = a.getMonth();

    const current = new Date(endDate);
    current.setDate(1);
    current.setMonth(current.getMonth() - 1);
    const month = current.getMonth() + 1;
    const year = current.getFullYear();

    const MonthMaster = async () => {
      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_URL}/mobile/MonthMasterRange`,
          {
            month: month,
            year: year,
          },
          {
            headers: {
              compcode: user?.Comp_Code, name: user?.name,
            },
          }
        );

        const newStartDate = response.data?.Result[0].Misc_Dtl1_Date;
        const newEndDate = response.data?.Result[0].Misc_Dtl2_Date;

        setstartDate(newStartDate);
        setendDate(newEndDate);

        const response1 = await axios.get(
          `${process.env.NEXT_PUBLIC_URL}/mobile/getAttendance1`,
          {
            params: {
              empCode: user?.EMPCODE,
              startDate: newStartDate,
              endDate: newEndDate,
            },
            headers: {
              compcode: user?.Comp_Code, name: user?.name,
            },
          }
        );
        const colorData = response.data?.Result;
        const array = [];
        colorData.forEach((row) => {
          // Extracting only the day from the date
          const day = row.DateDisplay.split("/")[0];
          array.push({ day, colorCode: row.colorCode });
        });
        setColor(array);

        console.log(response1.data.Result.colorCode, "n1");
      } catch (error) {
        console.error("Error fetching MP remarks list:", error);
      }
    };
    MonthMaster();
  };

  const goToNextMonth = () => {
    const MonthMaster = async () => {
      try {
        // const a = new Date(endDate);
        // const month = a.getMonth() + 2;
        const current = new Date(endDate);
        current.setDate(1);
        current.setMonth(current.getMonth() + 1);

        const month = current.getMonth() + 1;
        const year = current.getFullYear();

        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_URL}/mobile/MonthMasterRange`,
          {
            Comp_Code: "seva",
            month: month,
            year: year,
          },
          {
            headers: {
              compcode: user?.Comp_Code, name: user?.name,
            },
          }
        );

        const newStartDate = response.data?.Result[0].Misc_Dtl1_Date;
        const newEndDate = response.data?.Result[0].Misc_Dtl2_Date;

        setstartDate(newStartDate);
        setendDate(newEndDate);

        // setstartDate(response.data?.Result[0].Misc_Dtl1_Date);
        // setendDate(response.data?.Result[0].Misc_Dtl2_Date);
        const response1 = await axios.get(
          `${process.env.NEXT_PUBLIC_URL}/mobile/getAttendance1`,
          {
            params: {
              empCode: user?.EMPCODE,
              startDate: newStartDate,
              endDate: newEndDate,
            },
            headers: {
              compcode: user?.Comp_Code, name: user?.name,
            },
          }
        );
        const colorData = response1.data?.Result;
        const array = [];
        colorData.forEach((row) => {
          // Extracting only the day from the date
          const day = row.DateDisplay.split("/")[0];
          array.push({ day, colorCode: row.colorCode });
        });
        setColor(array);
      } catch (error) {
        console.error("Error fetching MP remarks list:", error);
      }
    };
    MonthMaster();
  };

  const startMonth = formattedStartDate
    ? new Date(formattedStartDate).toLocaleString("default", { month: "long" })
    : "";
  const endMonth = formattedEndDate
    ? new Date(formattedEndDate).toLocaleString("default", {
      month: "long",
      year: "numeric",
    })
    : "";

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getCalendarGrid = (dateRange, startDayOfWeek) => {
    const calendar = [];
    let row = [];
    let index = 0;

    for (let i = 0; i < startDayOfWeek; i++) {
      row.push(null);
      index++;
    }

    dateRange.forEach((date, dateIndex) => {
      if (index % 7 === 0 && dateIndex !== 0) {
        calendar.push(row);
        row = [];
      }
      const day = date.getDate(); // Get the day as a string
      const colorObj = color.find((c) => c.day == day); // Find color object matching the day
      const colorCode = colorObj ? colorObj.colorCode : null; // Retrieve color code if found, otherwise null

      row.push({
        date: date.getDate(),
        colorCode: colorCode ? colorCode : "#ffffff",
      });
      index++;
    });

    while (row.length < 7) {
      row.push(null);
    }
    calendar.push(row);
    return calendar;
  };
  return (
    <div className="overflow-x-auto p-2 rounded-xl ">
      <div className="rounded-t bg-header dark:bg-black mb-0 px-6 py-2 items-center flex justify-between border dark:border-borderColor-dark ">
        <Button className="text-lg font-semibold text-white dark:text-[#37a9dd]" onClick={goToPreviousMonth}>
          <TfiControlBackward size={32} />
        </Button>
        <h2 className="text-lg font-semibold uppercase text-white dark:text-[#37a9dd]">{endMonth}</h2>
        <button className="text-lg font-semibold text-white dark:text-[#37a9dd]" onClick={goToNextMonth}>
          <TfiControlForward size={32} />
        </button>
      </div>

      <table className="table-fixed mx-auto w-full mt-2">
        <thead>
          <tr className="text-center mt-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
              (day, index) => (
                <th key={index} className="items-center justify-center">
                  <div
                    className={` py-2 sm:px-2 md:py-4 xl:px-0 lg:py-6 rounded-lg xl:rounded-2xl text-xs   xl:text-lg m-1 shadow-xl bg-white dark:bg-primary dark:bg-opacity-10 text-header dark:text-white  border border-borderColor dark:border-borderColor-dark`}
                  >
                    {day}
                  </div>
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {getCalendarGrid(dateRange, startDayOfWeek).map((row, rowIndex) => (
            <tr key={rowIndex} className="text-center">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>
                  <div
                    key={cellIndex}
                    className={`py-2 md:py-4 sm:px-2 lg:py-6 rounded-lg xl:rounded-2xl text-xs   xl:text-lg m-1 ${cell && cell.colorCode ? "shadow-xl" : ""
                      }`}
                    style={
                      cell
                        ? {
                          backgroundColor: `${cell.colorCode}99`,
                        }
                        : {}
                    }
                  >
                    {cell ? cell.date : ""}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CustomCalendar;
