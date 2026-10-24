"use client";
import React, { useEffect, useState } from "react";
import Ainput from "@/components/atoms/Input";
import SelectSearch from "@/components/atoms/Select";
import { Button } from "@/components/ui/button";
import DataTable from "./_approverTable";
import axios from "axios";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import Swal from "sweetalert2";
import { FaUsers } from "react-icons/fa";

import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import HashloaderComponent from "@/components/Templates/hashloader";
import AinputDate from "@/components/atoms/dateInput";
import Image from 'next/image';
import { useDateRange } from "@/app/hooks/use-date-range";
import { ListChecks } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
 

const Approver2 = ({ back }) => {
  const [filtereddata, setFiltereddata] = useState([]);
  const [remark, setRemark] = useState(null);
  const [globalDateRange] = useDateRange();



  const [isClicked, setIsClicked] = useState(false);
  const user = useCurrentUser();
  const { toast } = useToast();
  const Router = useRouter();

  const Status = [
    {
      value: 3,
      label: "Rejected",
    },
    {
      value: 2,
      label: "Approved",
    },
    {
      value: 1,
      label: "Pending",
    },
    {
      value: 0,
      label: "Not Raise",
    },
  ];
  const [tabledata, setTabledata] = useState([]);

  const formatDate = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    if (isNaN(date)) return dateString; // fallback to original if invalid

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  };

  const statusOptions = {
    0: "Not Raise",
    1: "Pending",
    2: "Approved",
    3: "Rejected",
  };

  const columns1 = [
    {
      Header: "SRNO",
      accessor: "srno", // auto-generate serial number
    },

    { Header: "EMPLOYEE CODE", accessor: "Emp_Code" },
    { Header: "Employee Name", accessor: "empName" },
    { Header: "Employee Designation", accessor: "empDesignation" },

    {
      Header: "office Date",
      accessor: "DateOffice",
      Cell: ({ value }) => {
        if (!value) return "waiting";

        const dateObj = new Date(value);
        if (isNaN(dateObj)) return "";

        const currentDate = new Date();
        const futureDate = new Date(currentDate);
        futureDate.setDate(currentDate.getDate() + 10);

        // Format to dd Mon yyyy (e.g., 11 Sep 2025)
        const day = String(dateObj.getDate()).padStart(2, "0");
        const month = dateObj.toLocaleString("en-US", { month: "short" });
        const year = dateObj.getFullYear();
        const formattedDate = `${day} ${month} ${year}`;

        const isFutureDate = dateObj >= futureDate;
        const cellStyle = isFutureDate
          ? { border: "2px solid red", padding: "3px" }
          : {};

        return <div style={cellStyle}>{formattedDate}</div>;
      },
    },

    // { Header: "Approved Salary", accessor: "Approver_Salary" },
    { Header: "Hours Worked", accessor: "HoursWorked" },
    { Header: "Remark", accessor: "Remark" },
    { Header: "Approve By", accessor: "txtApprBy" },
    { Header: "Shift Start Time", accessor: "ShiftStartTime" },
    { Header: "Shift End Time", accessor: "ShiftEndTime" },
    { Header: "Hours Worked Min", accessor: "HoursWorkedMin" },
    { Header: "Shift Minutes", accessor: "ShiftMinutes" },
    { Header: "coType", accessor: "coType" },
    { Header: "coValue", accessor: "coValue" },
    {
      Header: "Laps Date", accessor: "laps_date",
      Cell: ({ value }) => {
        if (!value) return "waiting";

        const dateObj = new Date(value);
        if (isNaN(dateObj)) return "";

        const currentDate = new Date();
        const futureDate = new Date(currentDate);
        futureDate.setDate(currentDate.getDate() + 10);

        // Format to dd Mon yyyy (e.g., 11 Sep 2025)
        const day = String(dateObj.getDate()).padStart(2, "0");
        const month = dateObj.toLocaleString("en-US", { month: "short" });
        const year = dateObj.getFullYear();
        const formattedDate = `${day} ${month} ${year}`;

        const isFutureDate = dateObj >= futureDate;
        const cellStyle = isFutureDate
          ? { border: "2px solid red", padding: "3px" }
          : {};

        return <div style={cellStyle}>{formattedDate}</div>;
      },
    },
    {
      Header: "Status",
      accessor: "status",
      Cell: ({ value }) => statusOptions[value] || "Unknown",
    },

  ];



  function getCurrentDate(monthsBack = 0) {
    const today = new Date();
    today.setMonth(today.getMonth() - monthsBack);
    const year = today.getFullYear();
    let month = today.getMonth() + 1;
    let day = today.getDate();
    if (month < 10) {
      month = "0" + month;
    }
    if (day < 10) {
      day = "0" + day;
    }
    return `${year}-${month}-${day}`;
  }

  const [dates, setDates] = useState({
    DATE_FROM: globalDateRange?.from || getCurrentDate(),
    DATE_TO: globalDateRange?.to || getCurrentDate(-1),
    branch: user?.branch,
    status: 0,
  });
  const [selectedrowdata, setsellectedrowdata] = useState([]);
  const [options, setOptions] = useState(null);
  const [criteria, setCriteria] = useState([]);

  const [check, setCheck] = useState(true);
  const [isModalVisible1, setIsModalVisible1] = useState(false);
  const [apprData, setApprData] = useState([]);


  useEffect(() => {
    showDataOFAPPRVL()
  }, [])


  // ADD FOR VIEW APPROVEL
  const showDataOFAPPRVL = async () => {

    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_URL}/mobile/GetApprList`,
        {
          params: {
            Empcode: user?.EMPCODE,
            module: 'compoff'
          },
          headers: {
            compcode: user?.Comp_Code,
          },
        }
      );
      console.log(response, 'getPendingAppList');
      console.log(response.data.Result, "response js")
      setApprData(response.data.Result)
    } catch (error) {
      console.error("Error fetching travel expenses:", error);
    }
  };




  const approver = async () => {
    const confirmed = await Swal.fire({
      icon: "warning",
      title: "Are you sure?",
      text: "This action is irreversible and cannot be undone. Do you want to proceed?",
      confirmButtonText: "OK",
      cancelButtonText: "Cancel",
      showCancelButton: true,
    });

    if (confirmed.isConfirmed) {
      setCheck(true);
      //approve button
      const tran_id = selectedrowdata;
      console.log(tran_id[0].rowData, "tranid");
      const selectedRowData = tran_id[0]?.rowData
      setIsClicked(true);
      try {
        const result = await axios.post(
          `${process.env.NEXT_PUBLIC_URL}/mobile/insertCompOffReqData`,
          {
            EMPCODE: selectedRowData.Emp_Code,
            date: selectedRowData.DateOffice,
            type: selectedRowData.coType,
            value: selectedRowData?.coValue,
            Remark: remark,
          },
          {
            headers: {
              compcode: user?.Comp_Code,
              name: user?.name,
            },
          }
        );
        if ((result.data.status = true)) {
          toast({
            title: "Approve Successfully",
            variant: "default",
          });
        }
        setsellectedrowdata([]);
        setCheck(false);
        setRemark(null);
        setIsClicked(true);
        await showdata();
      } catch (err) {
        toast({
          title: `${err.response.data.Message}`,
          variant: "destructive",
        });
        setsellectedrowdata([]);
        setCheck(false);
        setRemark(null);
      }
      setIsClicked(false);
    }
  };

  const reject = async () => {
    const confirmed = await Swal.fire({
      icon: "warning",
      title: "Are you sure?",
      text: "This action is irreversible and cannot be undone. Do you want to proceed?",
      confirmButtonText: "OK",
      cancelButtonText: "Cancel",
      showCancelButton: true,
    });

    if (confirmed.isConfirmed) {
      setIsClicked(true);
      //reject button 
      const tran_id = selectedrowdata;
      console.log(tran_id[0].rowData, "tranid");
      const selectedRowData = tran_id[0]?.rowData
      try {
        const result = await axios.post(
          `${process.env.NEXT_PUBLIC_URL}/mobile/RejectCompOffReqByEmpcode`,
          {
            EMPCODE: selectedRowData.Emp_Code,
            date: selectedRowData.DateOffice,
            type: selectedRowData.coType,
            value: selectedRowData?.coValue,
            rem: remark,
          },
          {
            headers: {
              compcode: user?.Comp_Code,
              name: user?.name,
            },
          }
        );
        if ((result.data.status = true)) {
          toast({
            title: "Rejected Successfully",
            variant: "default",
          });
        }
        setsellectedrowdata([]);
        setCheck(false);
        setRemark(null);
        await showdata();
      } catch (err) {
        console.log(err);
        toast({
          title: `${err.response.data.Message}`,
          variant: "destructive",
        });
        setCheck(false);
        setRemark(null);
      }
      setIsClicked(false);
    }
  };

  const handleDateChange = (name: any, value: any) => {
    if (name == "status") {
      setIsClicked(true);
      setFiltereddata([]);
      setFiltereddata(filterByStatus(tabledata, value));
      setIsClicked(false);
    }
    setDates((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const doubleclicked = (row) => {
    console.log(row, "komalll");
  };


  useEffect(() => {
    showdata();

  }, [dates.status]);

  useEffect(() => {
    const fetchData1 = async () => {
      if (options) return;
      setIsClicked(true);
      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_URL}/users/findAllEmployee`,
          {
            branch: user?.branch,
          },
          {
            headers: {
              compcode: user?.Comp_Code,
              name: user?.name,
            },
          }
        );
        setOptions(response.data.data);
        setIsClicked(false);
      } catch (e) {
        setIsClicked(false);
        console.log(e);
      }
    };
    fetchData1();
  }, []);

  function filterByStatus(data, status) {
    return data.filter((item) => item.status == status);
  }
  const showdata = async () => {
    setFiltereddata([]);
    setTabledata([]);
    setCriteria([]);
    setsellectedrowdata([]);

    if (dates.branch == "") {
      toast({
        title: `Please Select Branch`,
        variant: "destructive",
      });
    }
    else {
      setIsClicked(true);

      try {
        const result = await axios.get(
          `${process.env.NEXT_PUBLIC_URL}/mobile/getCompOffReqData`,
          {
            params: {
              username: user?.name,
              loc_code: dates?.branch,
              EMPCODE: user?.EMPCODE,
              dateFrom: dates?.DATE_FROM,
              dateTo: dates?.DATE_TO,
            },
            headers: {
              compcode: user?.Comp_Code,
              name: user?.name,
            },
          }
        );
        console.log(result.data, "result.data");

        // setTabledata(result.data.Result);
        let status;
        status = dates.status


        const dataWithSrNo = result.data.Result.map((row, i) => ({
          ...row,
          srno: i + 1,
        }));

        setTabledata(dataWithSrNo);

        setFiltereddata(filterByStatus(dataWithSrNo, status));
      } catch (err) {
        console.log(err);
      }
      setIsClicked(false);
    }
  };
  const handleRemark = (name, value) => {
    setRemark(value);
  };











  return (
    <div>
      <div>



        <div className="col-span-12 rounded-t bg-header dark:bg-black px-2 md:px-6 py-2 border dark:border-borderColor-dark">
          <div className="flex    justify-between ">
            <h1 className="font-bold sm:text-sm md:text-lg lg:text-xl text-white dark:text-[#37a9dd] flex items-center gap-x-3 uppercase">
              <Image src="/Payrollicon/Add_Attendance.png" alt="Autovyn" width={25} height={25} />
              Comp Off Request Page
            </h1>
            <div className="flex gap-2">
              <Button variant="update" onClick={() => setIsModalVisible1(true)}>
                <ListChecks size={18} />
              </Button>
              <Button variant="print" onClick={() => window.history.back()}>
                Back
              </Button>
            </div>
          </div>
        </div>
        <div
          className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3 mt-2 rounded-b p-2 md:p-4 bg-white dark:bg-black border border-borderColor dark:border-borderColor-dark shadow"
          id="pdfContent"
        >
          <div className="md:col-span-2 col-span-12">
            <Ainput
              title="DATE FROM"
              type="date"
              name="DATE_FROM"
              value={dates.DATE_FROM}
              handleInputChange={handleDateChange}
            />
          </div>

          <div className="md:col-span-2 col-span-12">
            <Ainput
              title="DATE TO"
              type="date"
              name="DATE_TO"
              value={dates.DATE_TO}
              handleInputChange={handleDateChange}
            />
          </div>
          {/* <div className="md:col-span-2">
            <SelectSearch
              title="branch"
              options={branch}
              name={"branch"}
              handleInputChange={handleDateChange}
              selectedValue={dates.branch?.toString()}
              isSelectAll={true}
            />
          </div> */}
          <div className="md:col-span-2 col-span-12">
            <SelectSearch
              title="Status"
              options={Status}
              name="status"
              handleInputChange={handleDateChange}
              selectedValue={dates.status?.toString()}
            />
          </div>
          <div className="md:col-span-2 mt-6  col-span-12">
            <Button onClick={showdata} variant={"save"}>
              Show
            </Button>
          </div>
        </div>
        <div className="md:col-span-3"></div>
        <div className="md:col-span-12  gap-2 md:gap-3 mt-2 rounded-b p-2 md:p-4 bg-white dark:bg-black border border-borderColor dark:border-borderColor-dark shadow">
          <DataTable
            status={dates.status}
            columns={columns1}
            check={check}
            selectValue="srno"
            data={filtereddata}
            setsellectedrowdata={setsellectedrowdata}
            height="370px"
            texta="Raise CO Req."
            textr="Reject"
            onRowDoubleClick={doubleclicked}
            handlereject={reject}
            handleapprove={approver}
            remark={remark}
            handleRemark={handleRemark}
          />
        </div>



        <HashloaderComponent isLoading={isClicked} />
        {/* ADD CODE  */}

        <Dialog open={isModalVisible1} onOpenChange={setIsModalVisible1}>
          <DialogContent className="w-full max-w-2xl lg:h-[450px] md:h-[450px] -mt-9">
            <DialogHeader>
              <DialogTitle>Approver List</DialogTitle>
              <DialogDescription>
                <div className="mt-3 max-h-[350px] overflow-y-auto">

                  {apprData.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">
                      No Approver Found
                    </div>
                  ) : (
                    <>
                      {/* Desktop Table */}
                      <div className="hidden md:block">
                        <table className="w-full border">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="p-2 border">Approver 1A</th>
                              <th className="p-2 border">Approver 1B</th>
                              <th className="p-2 border">Approver 2A</th>
                              <th className="p-2 border">Approver 2B</th>
                              <th className="p-2 border">Approver 3A</th>
                              <th className="p-2 border">Approver 3B</th>
                            </tr>
                          </thead>

                          <tbody>
                            {apprData.map((item, index) => (
                              <tr
                                key={index}
                                className="hover:bg-blue-50 cursor-pointer"
                                onClick={() => handleSelectApprover(item)}
                              >
                                <td className="border p-2 capitalize">{item.approver1_A || "-"}</td>
                                <td className="border p-2 capitalize">{item.approver1_B || "-"}</td>
                                <td className="border p-2 capitalize">{item.approver2_A || "-"}</td>
                                <td className="border p-2 capitalize">{item.approver2_B || "-"}</td>
                                <td className="border p-2 capitalize">{item.approver3_A || "-"}</td>
                                <td className="border p-2 capitalize">{item.approver3_B || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Cards */}
                      <div className="md:hidden space-y-3">
                        {apprData.map((item, index) => (
                          <div
                            key={index}
                            className="border p-3 rounded-lg shadow-sm bg-white cursor-pointer"
                            onClick={() => handleSelectApprover(item)}
                          >
                            <div className="grid grid-cols-2 gap-y-2 text-sm">
                              <span className="font-semibold text-gray-600">Approver 1A:</span>
                              <span>{item.approver1_A || "-"}</span>

                              <span className="font-semibold text-gray-600">Approver 1B:</span>
                              <span>{item.approver1_B || "-"}</span>

                              <span className="font-semibold text-gray-600">Approver 2A:</span>
                              <span>{item.approver2_A || "-"}</span>

                              <span className="font-semibold text-gray-600">Approver 2B:</span>
                              <span>{item.approver2_B || "-"}</span>

                              <span className="font-semibold text-gray-600">Approver 3A:</span>
                              <span>{item.approver3_A || "-"}</span>

                              <span className="font-semibold text-gray-600">Approver 3B:</span>
                              <span>{item.approver3_B || "-"}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                </div>

              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Approver2;
