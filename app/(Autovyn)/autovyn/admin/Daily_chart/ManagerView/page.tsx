"use client";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import DataTable from "@/components/Templates/ServiceTable";
import { Button } from "@/components/ui/button";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormData } from "../Context/FormDataContext";
import Ainput from "@/components/atoms/Input";
import HashloaderComponent from "@/components/Templates/hashloader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog2";
import Swal from "sweetalert2";
import { GrUserAdmin } from "react-icons/gr";

const App = () => {
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

  const user = useCurrentUser();
  const [isLoading, setIsLoading] = useState(false);
  const [fatchdata, setFatchdata] = useState([]);
  const { formData, setFormData } = useFormData();
  const todayOneMonthBackDate = getCurrentDate(1);
  const [currentDate, setCurrentDate] = useState(getCurrentDate());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [row, setRowdata] = useState({});

  const coloum = [
    {
      Header: "SRNO",
      accessor: "SRNO",
      Cell: (row: any) => row.row.index + 1,
    },
    { Header: "Employee name", accessor: "Emp_Name" },
    {
      Header: "Date",
      accessor: (row) => {
        const date = row.Emp_date;
        if (date) {
          const [year, month, day] = date.split("-");
          return `${day}-${month}-${year}`;
        }
        return "";
      },
    },
    { Header: "10 Am Task", accessor: "MorningTask" },
    { Header: "1 pm Status", accessor: "Status1" },
    { Header: "Remark", accessor: "Remark1" },
    { Header: "2 PM Task", accessor: "AfternooTask" },
    { Header: "6 pm Status", accessor: "Status2" },
    { Header: "Remark", accessor: "Remark2" },
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
    DATE_FROM: currentDate,
    DATE_TO: currentDate,
  });

  const handleDateChange = (name: any, value: any) => {
    setDates((prevData: any) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleInputChange = (name: any, value: any) => {
    setFormData((prevData: any) => ({
      ...prevData,
      [name]: value,
    }));
  };
  useEffect(() => {
    fetchLedgerData();
  }, []);

  const fetchLedgerData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/Daily_Task/managerView`,
        {
          loc_code: user?.branch,
          dateFrom: dates?.DATE_FROM,
          dateTo: dates?.DATE_TO,
          Emp_Code: user?.EMPCODE,
        },
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
          },
        }
      );

      const todayDate = getCurrentDate(0);
      const sortedData = response.data.Result.sort((a, b) => {
        const dateA = new Date(a.Emp_date);
        const dateB = new Date(b.Emp_date);

        if (a.Emp_date === todayDate) return -1;
        if (b.Emp_date === todayDate) return 1;

        return dateB - dateA;
      });

      setFatchdata(sortedData);
    } catch (error) {
      console.log(
        "Error fetching ledger data:",
        error.response?.data || error.message
      );
    } finally {
      setIsLoading(false);
    }
  };

  const updateRemarks = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/Daily_Task/updateRemarks`,
        {
          Tran_id: row?.Tran_id,
          Remark1: formData?.Remark1,
          Remark2: formData?.Remark2,
        },
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
          },
        }
      );

      if (response.data.Status) {
        showSideAlert("Remarks updated successfully!", "success");
        fetchLedgerData();
      } else {
        showSideAlert(
          response.data.Message || "Failed to update remarks",
          "error"
        );
      }
    } catch (error) {
      showSideAlert("Error updating remarks", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const router = useRouter();
  const onRowDoubleClick = (row: any) => {
    console.log(row, "row");
    setFormData({});
    setRowdata(row);
    setIsDialogOpen(true);
    setFormData((prevData: any) => ({
      ...prevData,
      Remark1: row.Remark1,
      Remark2: row.Remark2,
    }));
  };

  useEffect(() => {
    if (formData) {
      console.log(formData, "Updated formData");
    }
  }, [formData]);

  return (
    <>
      <div className="rounded-t bg-white dark:bg-dark px-6 py-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="px-1 flex items-center gap-2 font-semibold text-base lg:text-xl text-pretty uppercase">
            <GrUserAdmin size={28} />
            Manager View
          </div>
          <div>
            <Button
              variant="print"
              className="flex items-center gap-1"
              onClick={() => window.history.back()}
            >
              {" "}
              Back
            </Button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-1 shadow-signUp dark:bg-primary dark:bg-opacity-10 pb-4 rounded-lg p-2">
        <div className="lg:col-span-2 md:col-span-6 col-span-12 ">
          <Ainput
            title="DATE FROM"
            type="date"
            name="DATE_FROM"
            value={dates.DATE_FROM}
            handleInputChange={handleDateChange}
          />
        </div>
        <div className="lg:col-span-2 md:col-span-6 col-span-12">
          <Ainput
            title="DATE TO"
            type="date"
            name="DATE_TO"
            value={dates.DATE_TO}
            handleInputChange={handleDateChange}
          />
        </div>

        <div className="md:col-span-2 lg:mt-5 mt-2 md:mt-5">
          <Button
            variant={"save"}
            className="mt-1"
            color="primary"
            onClick={fetchLedgerData}
          >
            show
          </Button>
        </div>
        <div className="col-span-12 -mt-6">
          <DataTable
            columns={coloum}
            data={fatchdata}
            onRowDoubleClick={onRowDoubleClick}
            filterPosition="FilterData"
            numericFilterColumns={[]}
          />
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-full max-w-screen-xl h-auto -mt-8">
          <DialogHeader>
            <DialogTitle className="mt-3 ml-3 flex">
              <DialogTitle className="text-[15px] md:text-[15px] lg:text-[15px] sm:text-[15px]">
                Employee's Daily Task Data
              </DialogTitle>
              <p className="ml-6  text-[15px] md:text-[15px] lg:text-[15px] sm:text-[15px] ">
                Date:{" "}
                {row.Emp_date
                  ? row.Emp_date.split("-").reverse().join("-")
                  : ""}
              </p>
            </DialogTitle>
            <hr className="bg-body-color mx-2" />
            <DialogDescription className="lg:h-[460px] md:h-[460px] h-[460px] overflow-y-scroll">
              <div className="grid grid-cols-12 gap-4 p-4">
                <div className="col-span-12 md:col-span-6">
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12 flex text-start">
                      <p className="font-bold text-ellipsis whitespace-nowrap">
                        Employee Name:-
                      </p>
                      <p className="text-b600 ml-1">{row?.Emp_Name}</p>
                    </div>
                    <div className="col-span-12 flex text-start">
                      <p className="font-bold text-ellipsis whitespace-nowrap">
                        10 AM Task: -{" "}
                      </p>{" "}
                      {row?.MorningTask}
                    </div>

                    <div className="col-span-12 flex text-start">
                      <p className="font-bold text-ellipsis whitespace-nowrap ">
                        1 PM Status: -
                      </p>
                      {row?.Status1}
                    </div>

                    <div className="col-span-12 flex">
                      <p className="font-bold text-ellipsis whitespace-nowrap">
                        Remark: -{" "}
                      </p>{" "}
                      {row?.Remark1}
                    </div>
                  </div>
                </div>

                <div className="col-span-12 md:col-span-6">
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12 flex">
                      <p className="font-bold text-ellipsis whitespace-nowrap">
                        Employee Code: -
                      </p>
                      <p className="text-exit ml-1">{row?.Emp_Code}</p>
                    </div>

                    <div className="col-span-12 flex text-start">
                      <p className="font-bold text-ellipsis whitespace-nowrap">
                        2 PM Task: -
                      </p>{" "}
                      {row?.AfternooTask}
                    </div>

                    <div className="col-span-12 flex text-start">
                      <p className="font-bold text-ellipsis whitespace-nowrap">
                        {" "}
                        6 PM Status: -{" "}
                      </p>
                      {row?.Status2}
                    </div>

                    <div className="col-span-12 flex text-start">
                      <p className="font-bold text-ellipsis whitespace-nowrap">
                        {" "}
                        Remark: -{" "}
                      </p>
                      {row?.Remark2}
                    </div>
                  </div>
                </div>
                <div className="col-span-12 md:col-span-6 mt-3">
                  <div className=" ">
                    <Ainput
                      title="10 AM Remark (Project Manager)"
                      type="text"
                      name="Remark1"
                      value={formData?.Remark1}
                      handleInputChange={handleInputChange}
                    />
                  </div>

                  {/* <div className="">
                                        <Button variant={"update"} className="mt-1" color="primary" onClick={updateRemarks}>Update</Button>
                                    </div> */}
                </div>

                <div className="col-span-12 md:col-span-6 mt-3">
                  <div className=" ">
                    <Ainput
                      title="6 PM Remark (Project Manager)"
                      type="text"
                      name="Remark2"
                      value={formData?.Remark2}
                      handleInputChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="col-span-12 flex justify-center">
                  <Button
                    variant={"save"}
                    className="mt-1"
                    color="primary"
                    onClick={updateRemarks}
                  >
                    Update
                  </Button>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
      <HashloaderComponent isLoading={isLoading} />
    </>
  );
};

export default App;
