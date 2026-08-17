"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import HashloaderComponent from "@/components/Templates/hashloader";
import { Button } from "@/components/ui/button";
import SelectSearch from "@/components/atoms/Select";
import Swal from "sweetalert2";

import { FaUsers } from "react-icons/fa";
import Eselect from "@/components/atoms/Eselect";
import PaginatedTable from "@/components/Templates/PaginatedTable2";
import { toast } from "@/components/ui/use-toast";
import Ainput from "@/components/atoms/Input";
import ReportsRights from "@/components/Templates/ReportsRights";

export default function page() {
  const user = useCurrentUser();


  const months = [
    { value: "01", label: "01" },
    { value: "02", label: "02" },
    { value: "03", label: "03" },
    { value: "04", label: "04" },
    { value: "05", label: "05" },
    { value: "06", label: "06" },
    { value: "07", label: "07" },
    { value: "08", label: "08" },
    { value: "09", label: "09" },
    { value: "10", label: "10" },
    { value: "11", label: "11" },
    { value: "12", label: "12" },
  ];

  const getCurrentAndNextMonthYear = () => {
    const now = new Date();

    const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
    const currentYear = String(now.getFullYear());

    const nextDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonth = String(nextDate.getMonth() + 1).padStart(2, "0");
    const nextYear = String(nextDate.getFullYear());

    return {
      fromMonth: currentMonth,
      fromYear: currentYear,
      toMonth: nextMonth,
      toYear: nextYear,
    };
  };
  const defaultDates = getCurrentAndNextMonthYear();


  const [dates, setDates] = useState({
    FROM_MONTH: defaultDates.fromMonth,
    FROM_YEAR: defaultDates.fromYear,
    TO_MONTH: defaultDates.toMonth,
    TO_YEAR: defaultDates.toYear,
    EMPCODE: "",
    LeaveType: "",
  });



  const getCurrentFinancialYear = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const financialYearStartMonth = 3;
    if (currentDate.getMonth() < financialYearStartMonth) {
      return currentYear - 1;
    }
    return currentYear;
  };

  const generateFinancialYearsArray = () => {
    const currentYear = getCurrentFinancialYear() + 1;
    const financialYears = [];

    for (let i = -1; i < 3; i++) {
      const startYear = currentYear - i;
      const endYear = startYear + 1;
      financialYears.push({
        value: `${startYear}`,
        label: `${startYear}`,
      });
    }
    return financialYears;
  };


  const [LeaveTypeOption, setLeaveTypeOption] = useState([]);
  const LeaveMaster = async () => {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/admin/getLeaveType`,
      {},
      {
        headers: {
          compcode: user?.Comp_Code,
          name: user?.name,
        },
      }
    );

    setLeaveTypeOption(response.data?.LEAVETYPE || []);
  };


  const yearoptions = generateFinancialYearsArray();

  const handleSelectAllChangeChannel = () => {
    const allGodwCodes = LeaveTypeOption.map((branch) => branch.value);
    handleDateChange("LeaveType",
      dates.LeaveType.length === allGodwCodes.length ? [] : allGodwCodes
    );
  };

  const handleCheckboxChangeChannel = (Code) => {
    const updatedSelection = dates.LeaveType.includes(Code)
      ? dates.LeaveType.filter((code) => code !== Code)
      : [...dates.LeaveType, Code];
    handleDateChange("LeaveType", updatedSelection);
  };

  const [isLoading, setIsLoading] = useState(false);

  const [empcode, setEmpcode] = useState([]);

  const handleDateChange = (name: any, value: any) => {
    setDates((prev) => {
      const updated = { ...prev, [name]: value };

      const fromMonth =
        name === "FROM_MONTH" ? value : updated.FROM_MONTH;
      const fromYear =
        name === "FROM_YEAR" ? value : updated.FROM_YEAR;

      // Auto-calc TO month/year only when both FROM values exist
      if (fromMonth && fromYear) {
        let month = parseInt(fromMonth, 10);
        let year = parseInt(fromYear, 10);

        if (month === 12) {
          month = 1;
          year += 1;
        } else {
          month += 1;
        }

        updated.TO_MONTH = String(month).padStart(2, "0");
        updated.TO_YEAR = String(year);
      }

      return updated;
    });
  };


  useEffect(() => {
    const fetchData = async () => {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/employee/all`,
        { branch: user?.branch },
        {
          headers: {
            compcode: user?.Comp_Code, name: user?.name,
          },
        }
      );
      setEmpcode(response.data?.data);
    };
    fetchData();
    LeaveMaster()
  }, []);



  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [otp, setOtp] = useState("");
  const [isLoadingOtp, setIsLoadingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [serverOtp, setServerOtp] = useState("");


  // Send OTP on page load
  const otpCalled = useRef(false);
  const decodeOtp = (encoded) => {
    return atob(encoded); // Base64 decode
  };


  useEffect(() => {
    if (!otpCalled.current) {
      otpCalled.current = true;
      sendOtp();
    }
  }, []);

  const sendOtp = async () => {
    setIsLoadingOtp(true);
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_URL}/admin/sendOTPForLeave`, {
        userEmail: "ayushi@autovyn.com",
        Subject: "View Carry Forword Page OTP Verification",
        Maincontain: "Your OTP for accessing the View Carry Forword is:"
      }, {
        headers: {
          compcode: user?.Comp_Code,
          name: user?.name,
          token: user?.email,
        },
      });
      if (response.data.success) {
        setOtpSent(true);
        setServerOtp(response.data.encodedOtp); // ✅ IMPORTANT

        toast({
          title: "OTP sent to your email",
          variant: "default",
        });
      }
      else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      toast({
        title: error.response?.data?.message || "Failed to send OTP",
        variant: "destructive",
      });
    } finally {
      setIsLoadingOtp(false);
    }
  };


  const verifyOtp = () => {
    if (!otp) {
      toast({
        title: "Please enter OTP",
        variant: "destructive",
      });
      return;
    }

    const decodedOtp = decodeOtp(serverOtp);
    if (otp === decodedOtp) {
      setIsOtpVerified(true);

      toast({
        title: "OTP verified successfully",
        variant: "default",
      });

    } else {
      toast({
        title: "Invalid OTP",
        variant: "destructive",
      });
    }
  };

  // Preloader/OTP Screen
  if (isLoadingOtp || !otpSent || !isOtpVerified) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          {isLoadingOtp ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4">Sending OTP...</p>
            </>
          ) : !otpSent ? (
            <p>Preparing OTP...</p>
          ) : (
            <>
              <p className="mb-4">Enter the OTP sent to your email</p>
              <Ainput
                title="OTP"
                type="text"
                name="otp"
                redlabel="*"
                handleInputChange={(name, value) => setOtp(value)}
                value={otp}
                placeholder="Enter OTP"
              />
              <Button variant={"save"} onClick={verifyOtp} disabled={!otpSent} className="mt-2">
                Verify OTP
              </Button>
            </>
          )}
        </div>
      </main>
    );
  }


  const HandleSave = async () => {
    if (!dates.LeaveType?.length) {
      toast({
        title: "Please select at least one Leave Type",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_URL}/admin/CarryForwordSave`, {
        Loc_code: user?.branch,
        FROM_MONTH: dates?.FROM_MONTH,
        FROM_YEAR: dates?.FROM_YEAR,
        TO_MONTH: dates?.TO_MONTH,
        TO_YEAR: dates?.TO_YEAR,
        LeaveType: dates?.LeaveType,
      }, {
        headers: {
          compcode: user?.Comp_Code,
          name: user?.name,
          token: user?.email,
        },
      });
      if (response.data.success) {
        setOtpSent(true);
        setServerOtp(response.data.encodedOtp); // ✅ IMPORTANT

        toast({
          title: "Carry forward completed successfully",
          variant: "default",
        });
      }
      else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      toast({
        title:
          error.response?.data?.message ||
          "Failed to carry forward leave balance",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div>
        <div className="md:col-span-12 gap-2">
          <div className="rounded-t bg-white dark:bg-dark   px-6 py-2">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="px-1 flex font-semibold text-base lg:text-xl text-pretty uppercase justify-between flex gap-x-2">
                <FaUsers size={30} className="" title="Payroll" /> Carry Forword Page
              </div>

              <Button variant={"print"} onClick={() => window.history.back()}>
                Back
              </Button>
            </div>
          </div>

        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-1 shadow-signUp dark:bg-primary dark:bg-opacity-10 pb-4 rounded-lg p-2">
          <div className="lg:col-span-2 md:col-span-6 col-span-12 ">
            <SelectSearch
              selectedValue={dates.FROM_MONTH}
              options={months}
              title={"FROM MONTH"}
              name={"FROM_MONTH"}
              handleInputChange={handleDateChange}
              redlabel="*"

            />
          </div>
          <div className="lg:col-span-2 md:col-span-6 col-span-12">
            <SelectSearch
              selectedValue={dates.FROM_YEAR?.toString()}
              options={yearoptions}
              title={"FROM YEAR"}
              name={"FROM_YEAR"}
              handleInputChange={handleDateChange}
              redlabel="*"

            />
          </div>

          <div className="lg:col-span-2 md:col-span-6 col-span-12 ">
            <SelectSearch
              selectedValue={dates.TO_MONTH}
              options={months}
              title={"TO MONTH"}
              name={"TO_MONTH"}
              handleInputChange={handleDateChange}
              redlabel="*"
              disabled
            />
          </div>
          <div className="lg:col-span-2 md:col-span-6 col-span-12">
            <SelectSearch
              selectedValue={dates.TO_YEAR?.toString()}
              options={yearoptions}
              title={"TO YEAR"}
              name={"TO_YEAR"}
              handleInputChange={handleDateChange}
              redlabel="*"
              disabled
            />
          </div>
          <div className="lg:col-span-2 md:col-span-6 col-span-12 mt-2 ml-2">
            <Button variant={"save"} onClick={HandleSave} className="mt-4">
              Submit
            </Button>
          </div>
        </div>


        <div className="col-span-12 md:col-span-4 bg-white dark:bg-input  dark:border-gray-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 min-h-[230px] mt-5">
          <ReportsRights
            data={LeaveTypeOption}
            selected={dates?.LeaveType}
            handleCheckbox={handleCheckboxChangeChannel}
            SelectAllChange={handleSelectAllChangeChannel}
            Title={"Leave Type"}
          />
        </div>

      </div>
      <HashloaderComponent isLoading={isLoading} />
    </div>
  );
}
