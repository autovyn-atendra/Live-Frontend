"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";

const WEEKDAYS = [
  { value: "0", label: "SUN" },
  { value: "1", label: "MON" },
  { value: "2", label: "TUE" },
  { value: "3", label: "WED" },
  { value: "4", label: "THU" },
  { value: "5", label: "FRI" },
  { value: "6", label: "SAT" },
];

export default function WeeklyOffDialog({
  open,
  onClose,
  empcode,
  month,
  year,
  user
}) {
  const [rows, setRows] = useState([]);
  const [applyToMaster, setApplyToMaster] = useState(false);
  const [monthStartDate, setMonthStartDate] = useState(null);
  const [monthEndDate, setMonthEndDate] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [selectedGlobalDay, setSelectedGlobalDay] = useState("");
  const [disabledDates, setDisabledDates] = useState([]);

  // ================= GET DATA =================
  useEffect(() => {
    if (!open) return;

    const fetchData = async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_URL}/ars/getWeeklyOffData`,
          {
            params: { EMPCODE: empcode, month, year },
            headers: {
              compcode: user?.Comp_Code,
              name: user?.name,
            },
          }
        );

        // Default: current → next copy
        const defaultRows = res.data.data.map(r => {
          const dateObj = new Date(r.current.date);
          const correctDayNo = dateObj.getDay().toString(); // always 0–6 correct

          return {
            ...r,
            next: {
              ...r.current,
              day_no: correctDayNo
            }
          };
        });

        setRows(defaultRows);

        // set global dropdown default
        // if (defaultRows.length > 0) {
        //   setSelectedGlobalDay(defaultRows[0].current.day_no?.toString() || "");
        // }
        // Global dropdown should remain blank initially
        setSelectedGlobalDay("");
        setDisabledDates(res.data.disabledDates || []);
        setMonthStartDate(res.data.monthStartDate);
        setMonthEndDate(res.data.monthEndDate);

      } catch {
        Swal.fire("Error", "Unable to fetch weekly off", "error");
      }
    };

    fetchData();
  }, [open]);

  const formatDateDDMMYYYY = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };
  const formatDateYYYYMMDD = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");

    return `${y}-${m}-${d}`;
  };

  // ================= RANGE BASED DATE CALCULATION =================
  const generateDatesForDay = (weekdayValue) => {
    if (!monthStartDate || !monthEndDate) return [];

    let start = new Date(monthStartDate);
    let end = new Date(monthEndDate);

    let result = [];

    while (start <= end) {
      if (start.getDay().toString() === weekdayValue) {
        result.push(new Date(start));
      }
      start.setDate(start.getDate() + 1);
    }

    return result;
  };

  const handleUpdateWeeklyOff = async () => {
    try {

      const payload = {
        EMPCODE: empcode,
        month,
        year,
        monthStartDate,
        monthEndDate,
        applyToMaster: applyToMaster ? 1 : 0,
        loginEmpcode: user?.EMPCODE,
        loginBranch: user?.branch,
        rows
      };

      console.log("WeeklyOff Update Payload:", payload);

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/ars/changeweeklyoff`,
        payload,
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
          },
        }
      );

      Swal.fire("Success", res.data.message, "success");
      onClose();

    } catch (error) {
      console.error(error);

      const errorMessage =
        error?.response?.data?.message ||
        "Error updating weekly off";

      Swal.fire("Error", errorMessage, "error");
    }
  };

  // const applyDayToRows = (weekdayValue) => {
  //   const validDates = generateDatesForDay(weekdayValue);

  //   const updated = rows.map((r, index) => {

  //     // 🔒 Skip disabled rows
  //     if (disabledDates.includes(r.current.date)) {
  //       return r;
  //     }

  //     if (validDates[index]) {
  //       return {
  //         ...r,
  //         next: {
  //           ...r.next,
  //           day_no: weekdayValue,
  //           date: validDates[index].toISOString().split("T")[0],
  //         },
  //       };
  //     } else {
  //       return {
  //         ...r,
  //         next: {
  //           ...r.next,
  //           day_no: weekdayValue,
  //           date: "",
  //         },
  //       };
  //     }
  //   });

  //   setRows(updated);
  //   setSelectedGlobalDay(weekdayValue);
  // };

  // ================= DAY CHANGE =================

  const applyDayToRows = (weekdayValue) => {

    const validDates = generateDatesForDay(weekdayValue);

    let updatedRows = [];

    const maxLength = Math.max(rows.length, validDates.length);
  

    for (let i = 0; i < maxLength; i++) {

      const existingRow = rows[i];
      const newDateObj = validDates[i];

      if (existingRow && 
    disabledDates.includes(formatDateYYYYMMDD(existingRow.current.date))) {
  updatedRows.push(existingRow);
  continue;
}

      // CASE 1: both exist
      if (existingRow && newDateObj) {
        updatedRows.push({
          ...existingRow,
          next: {
            day_no: weekdayValue,
            date: newDateObj.toISOString().split("T")[0],
          }
        });
      }

      // CASE 2: New date extra (INSERT case)
      else if (!existingRow && newDateObj) {
        updatedRows.push({
          UTD: null,
          current: {
            day_name: "--",
            day_no: "",
            date: null
          },
          next: {
            day_no: weekdayValue,
            date: newDateObj.toISOString().split("T")[0],
          }
        });
      }

      // CASE 3: Existing row extra (DISABLE case)
      else if (existingRow && !newDateObj) {
        updatedRows.push({
          ...existingRow,
          next: {
            day_no: "",
            date: null
          }
        });
      }
    }

    setRows(updatedRows);
    setSelectedGlobalDay(weekdayValue);
  };
  const handleDayChangeAll = (value) => {
    applyDayToRows(value);
  };

  const handleSingleDayChange = (value) => {
    applyDayToRows(value);
  };

  // ================= SINGLE DATE CHANGE =================
  const handleSingleDateChange = (index, date) => {
    const newRows = [...rows];
    const dayIndex = new Date(date).getDay();

    newRows[index].next.date = date;
    newRows[index].next.day_no = dayIndex.toString();

    setRows(newRows);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white w-[1000px] p-6 rounded shadow-lg relative">

        {/* CENTRAL HELP ICON */}
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setShowHelp(true)}
            className="text-blue-600 font-bold text-xl"
          >
            ?
          </button>
        </div>

        <h2 className="text-lg font-bold mb-4">
          Weekly Off Change - {month}/{year}
        </h2>

        {/* GLOBAL CHANGE */}
        <div className="mb-4 flex items-center gap-3">
          <label className="font-semibold">
            Change All Next Day
          </label>

          <select
            value={selectedGlobalDay}
            onChange={(e) => handleDayChangeAll(e.target.value)}
            className="border p-1"
          >
            <option value="">Select</option>
            {WEEKDAYS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        {/* EMP MASTER CHECK */}
        <div className="mb-4 flex items-center gap-2">
          <input
            type="checkbox"
            checked={applyToMaster}
            onChange={(e) => setApplyToMaster(e.target.checked)}
          />
          <label>
            Also set this Weekly Off in Employee Master
          </label>
        </div>

        <table className="w-full border border-collapse-separate border-spacing-0">
          <thead>
            <tr className="bg-gray-200">
              <th>Current Day</th>
              <th>Current Date</th>
              <th>Next Day</th>
              <th>Next Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.UTD}
                style={
                  disabledDates.includes(formatDateYYYYMMDD(row.current.date))
                    ? { backgroundColor: "#FFEDD5" }  // light orange
                    : {}
                }
                className="text-center border-t"
              >
                <td >
                  {row.current.day_name}
                </td>
                <td className={
                  disabledDates.includes(formatDateYYYYMMDD(row.current.date))
                    ? "bg-orange-100"
                    : ""
                }>{formatDateDDMMYYYY(row.current.date)}</td>

                <td className={
                  disabledDates.includes(formatDateYYYYMMDD(row.current.date))
                    ? "bg-[#FFEDD5]"
                    : ""
                }>
                  <select
                    value={row.next.day_no}
                    onChange={(e) =>
                      handleSingleDayChange(e.target.value)
                    }
                    disabled={disabledDates.includes(formatDateYYYYMMDD(row.current.date))}
                    style={
                      disabledDates.includes(formatDateYYYYMMDD(row.current.date))
                        ? { backgroundColor: "#FFEDD5" }
                        : {}
                    }
                  >
                    {WEEKDAYS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </td>

                <td className={
                  disabledDates.includes(formatDateYYYYMMDD(row.current.date))
                    ? "bg-orange-100"
                    : ""
                }>
                  <input
                    type="date"
                    value={row.next.date || ""}
                    min={monthStartDate}
                    max={monthEndDate}
                    disabled={disabledDates.includes(row.current.date)}
                    onChange={(e) =>
                      handleSingleDateChange(index, e.target.value)
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="save" onClick={handleUpdateWeeklyOff}>
            Update
          </Button>
        </div>

        {/* HELP MODAL */}
        {showHelp && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
            <div className="bg-white p-6 w-[600px] rounded shadow">
              <h3 className="font-bold text-lg mb-3">
                Weekly Off Change Instructions
              </h3>

              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>
                  Selecting a weekday from "Change All Next Day" will automatically
                  generate all weekly off dates within the month date range.
                </li>
                <li>
                  Only dates falling between the provided month start and end date range will be generated.
                </li>
                <li>
                  Manually changing a specific date will update only that particular weekly off entry.
                </li>
                <li>
                  Checking "Also set this Weekly Off in Employee Master" will update the selected weekday in the Employee Master.
                </li>
                <li>
                  Rows highlighted in light orange indicate that Comp Off has already been generated
                  or partially/fully availed for that date. These entries cannot be modified.
                </li>
              </ul>

              <div className="flex justify-end mt-4">
                <Button onClick={() => setShowHelp(false)}>Close</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}