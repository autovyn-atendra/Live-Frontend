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

export default function page() {
  const user = useCurrentUser();
  const [tabledata, setTabledata] = useState([]);

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

    for (let i = -2; i < 4; i++) {
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
      `${process.env.NEXT_PUBLIC_URL}/employee/masters`,
      {},
      {
        headers: {
          compcode: user?.Comp_Code,
          name: user?.name,
        },
      }
    );

    setLeaveTypeOption(response.data.data?.LEAVETYPE || []);
  };


  const yearoptions = generateFinancialYearsArray();

  const columns = [
    {
      Header: "EMPLOYEE CODE",
      accessor: "Emp_Code",
      Cell: ({ value }) => (value ? String(value).toUpperCase() : ""),
    },
    {
      Header: "Attendance Count",
      accessor: "attendance_count",
      Cell: ({ value }) => (value ? String(value).toUpperCase() : ""),
    },
    {
      Header: "Leave Availed Count",
      accessor: "leave_availed_count",
      Cell: ({ value }) => (value ? String(value).toUpperCase() : ""),
    },
    {
      Header: "Leave Closing Count",
      accessor: "leave_closing_count",
      Cell: ({ value }) => (value ? String(value).toUpperCase() : ""),
    },
    {
      Header: "Compoff Aailed Count",
      accessor: "compoff_availed_count",
      Cell: ({ value }) => (value ? String(value).toUpperCase() : ""),
    },
    {
      Header: "Compoff Remain Count",
      accessor: "compoff_remain_count",
      Cell: ({ value }) => (value ? String(value).toUpperCase() : ""),
    },

  ];



  const [isLoading, setIsLoading] = useState(false);

  const [dates, setDates] = useState({
    DATE_FROM: "",
    DATE_TO: "",
    EMPCODE: "",
    LeaveType: "",
  });
  const [empcode, setEmpcode] = useState([]);

  const handleDateChange = (name: any, value: any) => {
    setDates((prevData) => ({
      ...prevData,
      [name]: value,
    }));
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


  const ShowData = async () => {
    if (!dates?.DATE_FROM) {
      showSideAlert("Please select month.", "warning");
      return;
    }

    if (!dates?.DATE_TO) {
      showSideAlert("Please select year.", "warning");
      return;
    }
    if (!dates?.LeaveType) {
      showSideAlert("Please select Leave Type.", "warning");
      return;
    }


    try {
      setIsLoading(true);
      const result = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/admin/getLeaveCount`,
        {
          Loc_code: user?.branch,
          DateFrom: dates?.DATE_FROM,
          DateTo: dates?.DATE_TO,
          LeaveType: dates?.LeaveType,
          EMPCODE: dates?.EMPCODE,
        },
        {
          headers: { compcode: user?.Comp_Code },
        }
      );
      console.log(result, "ViewData");
      setTabledata(result?.data?.Result);
    } catch (error) {
      console.error("Error", error);
    } finally {
      setIsLoading(false);
    }
  };

  const [count, setCount] = useState<number>(0);

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
        Subject: "View Leave Page OTP Verification",
        Maincontain: "Your OTP for accessing the View Leave page is:"
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

  return (
    <div>
      <div>
        <div className="md:col-span-12 gap-2">
          <div className="rounded-t bg-white dark:bg-dark   px-6 py-2">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="px-1 flex font-semibold text-base lg:text-xl text-pretty uppercase justify-between flex gap-x-2">
                <FaUsers size={30} className="" title="Payroll" /> View Leave Balance Report
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
              selectedValue={dates.DATE_FROM}
              options={months}
              title={"month"}
              name={"DATE_FROM"}
              handleInputChange={handleDateChange}
              redlabel="*"
            />
          </div>
          <div className="lg:col-span-2 md:col-span-6 col-span-12">
            <SelectSearch
              selectedValue={dates.DATE_TO?.toString()}
              options={yearoptions}
              title={"year"}
              name={"DATE_TO"}
              handleInputChange={handleDateChange}
              redlabel="*"
            />
          </div>
          <div className="lg:col-span-2 md:col-span-6 col-span-12">
            <SelectSearch
              options={LeaveTypeOption}
              name={"LeaveType"}
              title={"Leave Type"}
              selectedValue={dates.LeaveType.toString()}
              handleInputChange={handleDateChange}
              className="!h-[38px]"
              redlabel="*"
            />
          </div>

          <div className="lg:col-span-2 md:col-span-6 col-span-12">
            <Eselect
              option={empcode}
              name="EMPCODE"
              title="EMPCODE"
              initialValue={dates.EMPCODE}
              handleInputChange={handleDateChange}
              className="!h-[38px]"

            />
          </div>


          <div className="lg:col-span-1 md:col-span-2 lg:mt-5 mt-2 md:mt-5">
            <Button
              variant={"save"}
              className="mt-1 w-full"
              color="primary"
              onClick={ShowData}
            >
              show
            </Button>
          </div>
          <div className="col-span-12 lg:col-span-7 md:col-span-6 sm:col-span-6 font-bold px-4"></div>
          <div className="col-span-12 lg:col-span-2 md:col-span-6 sm:col-span-6 font-bold px-4">
            Total Rows :- {count}
          </div>
          <div className="col-span-12 -mt-0 md:-mt-11">
            <PaginatedTable
              onRowDoubleClick={() => {
                console.log("hello");
              }}
              columns={columns}
              data={tabledata}
              filterPosition="FilterData"
              numericFilterColumns={[]}
            />
          </div>
        </div>
      </div>
      <HashloaderComponent isLoading={isLoading} />
    </div>
  );
}
