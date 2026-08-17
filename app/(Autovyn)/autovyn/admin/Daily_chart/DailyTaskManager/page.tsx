"use client";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import Ainput from "@/components/atoms/Input";
import axios from "axios";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Swal from "sweetalert2";
import HashloaderComponent from "@/components/Templates/hashloader";
import ATextArea from "@/components/atoms/textArea";
import { useFormData } from "../Context/FormDataContext";
import { GrUserAdmin } from "react-icons/gr";

export default function Page() {
  const [flag, setFlag] = useState(false);
  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      if (currentHour === 13 && currentMinute >= 30) {
        setFlag(true);
      } else if (currentHour > 13 && currentHour < 24) {
        setFlag(true);
      } else {
        setFlag(false);
      }
    };

    const intervalId = setInterval(checkTime, 6000);
    checkTime();
    return () => clearInterval(intervalId);
  }, []);

  const [flag1, setFlag1] = useState(false);
  useEffect(() => {
    const checkTime1 = () => {
      const now = new Date();
      const currentHour = now.getHours();
      if (currentHour >= 13 && currentHour < 24) {
        setFlag1(true);
      } else {
        setFlag1(false);
      }
    };

    const intervalId = setInterval(checkTime1, 6000);
    checkTime1();

    return () => clearInterval(intervalId);
  }, []);

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

  useEffect(() => {
    const currentDate = getCurrentDate();
    setFormData((prevRow) => ({
      ...prevRow,
      Emp_date: currentDate,
    }));
  }, []);

  function getCurrentDate(monthsBack = 0) {
    const today = new Date();
    today.setMonth(today.getMonth() - monthsBack);
    const year = today.getFullYear();
    let month: any = today.getMonth() + 1;
    let day: any = today.getDate();
    if (month < 10) {
      month = "0" + month;
    }
    if (day < 10) {
      day = "0" + day;
    }
    return `${year}-${month}-${day}`;
  }

  const user = useCurrentUser();
  const [isLoading, setIsLoading] = useState(false);
  const { formData, setFormData } = useFormData();

  const handleInputChange = (name: any, value: any) => {
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  useEffect(() => {
    getData();
  }, []);

  const getData = async () => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/Daily_Task/gatEmpData`,
        {
          Emp_code: user?.EMPCODE,
          Emp_Name: user?.name,
        },
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
          },
        }
      );

      const locCodeValue = user?.branch;
      const result = { ...response.data.Result, Loc_Code: locCodeValue };
      setFormData((prevData) => ({
        ...prevData,
        ...result,
      }));
      fetchLatestDataByDate();
    } catch (error) {
      console.log("Error saving data:", error.response?.data || error.message);
    }
  };

  const handleDayTaskClose = async () => {
    if (!formData?.MorningTask && !formData?.AfternooTask) {
      showSideAlert("Please enter a task for Either 10 AM or 2 PM", "warning");
      return;
    }
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/Daily_Task/dailytaskbutton`,
        { formData },
        {
          headers: {
            compcode: user?.Comp_Code,
          },
        }
      );
      if (response.data.Status === true) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: `${response.data.Message}`,
        });
        fetchLatestDataByDate();
      } else {
        Swal.fire({
          icon: "info",
          title: "info!",
          text: `${response.data.Message}`,
        });
      }
    } catch (error) {
      console.log("Error saving data:", error.response?.data || error.message);
    }
  };

  const SaveData1 = async () => {
    if (!formData?.Emp_date) {
      showSideAlert("Please fill it out the Date", "warning");
      return;
    }
    if (!formData?.MorningTask) {
      showSideAlert("Please fill it out the 10.00 AM Task.", "warning");
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/Daily_Task/saveTask1`,
        { formData },
        {
          headers: {
            compcode: user?.Comp_Code,
          },
        }
      );
      console.log(response, "saveTask1");

      if (response.data.Status === false) {
        Swal.fire({
          icon: "info",
          title: "info!",
          text: `${response.data.Message}`,
        });
      } else {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: `${response.data.Message}`,
        });
      }

      setFormData({});
      fetchLatestDataByDate();
      const currentDate = new Date().toISOString().split("T")[0];
      setFormData({
        ...formData,
        Emp_date: currentDate,
      });
    } catch (error) {
      console.log("Error saving data:", error.response?.data || error.message);
    } finally {
      setIsLoading(false);
    }
  };
  const SaveData2 = async () => {
    if (!formData?.Emp_date) {
      showSideAlert("Please fill it out the Date", "warning");
      return;
    }

    if (!formData?.AfternooTask) {
      showSideAlert("Please fill it out the 02.00 PM Task.", "warning");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/Daily_Task/saveTask2`,
        { formData },
        {
          headers: {
            compcode: user?.Comp_Code,
          },
        }
      );
      console.log(response, "saveTask2");
      if (response.data.Status === false) {
        Swal.fire({
          icon: "info",
          title: "info!",
          text: `${response.data.Message}`,
        });
      } else {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: `${response.data.Message}`,
        });
      }

      setFormData({});
      fetchLatestDataByDate();
      const currentDate = new Date().toISOString().split("T")[0];
      setFormData({
        ...formData,
        Emp_date: currentDate,
      });
    } catch (error) {
      console.log("Error saving data:", error.response?.data || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestDataByDate();
  }, []);

  const fetchLatestDataByDate = async () => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/Daily_Task/getLastRecordByDate`,
        { Create_at: formData.Emp_date, Emp_Code: user?.EMPCODE },
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
          },
        }
      );
      console.log(response, "data");
      if (response.data && response.data.Result) {
        setFormData((prevData) => ({
          ...prevData,
          ...response.data.Result,
        }));
      } else {
      }
    } catch (error) {
      console.error(
        "Error fetching latest data:",
        error.response?.data || error.message
      );
    }
  };

  return (
    <div>
      <div className="animate-pulse-1s w-full mt-0 p-0  ">
        <div className="rounded-t bg-white dark:bg-dark px-6 py-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="px-1 flex items-center font-semibold text-base lg:text-xl text-pretty uppercase gap-2">
              <GrUserAdmin size={28} className="text-blue-600" />
              Employee's daily tasks
            </div>

            {/* Buttons aligned right */}
            <div className="flex items-center gap-2">
              <Button
                className="mr-1"
                variant={"update"}
                onClick={handleDayTaskClose}
                disabled={!flag1 || (formData.FINAL_STATUS == 1 ? true : false)}
              >
                Day Task Close
              </Button>

              <Button
                variant="print"
                onClick={() => window.history.back()}
                className="flex items-center gap-1"
              >
                {" "}
                Back
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12">
          <div className="col-span-1 md:col-span-1"></div>
          <div className="col-span-1 md:col-span-10">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-1 p-3  shadow-md rounded-b  dark:bg-primary dark:bg-opacity-10">
              <div className="col-span-12 md:col-span-5">
                <Ainput
                  title={"Employee Name"}
                  type={"text"}
                  handleInputChange={handleInputChange}
                  name={"Emp_Name"}
                  value={formData?.Emp_Name}
                  disabled
                />
              </div>
              <div className="col-span-4">
                <Ainput
                  title={"Employee Code"}
                  type="text"
                  handleInputChange={handleInputChange}
                  name={"Emp_Code"}
                  value={formData?.Emp_Code}
                  disabled
                />
              </div>

              <div className="col-span-12 md:col-span-3">
                <Ainput
                  title={"Date"}
                  type="date"
                  handleInputChange={handleInputChange}
                  name={"Emp_date"}
                  value={formData.Emp_date}
                  disabled
                />
              </div>
              {/* <div className="col-span-12 md:col-span-1">
                                <Button className="w-full mt-1 md:mt-6" variant={"outline"} onClick={fetchLatestDataByDate} disabled={inputsDisabled}>
                                    ZOOM
                                </Button>
                            </div> */}
              <div className="col-span-12">
                <ATextArea
                  rows={3}
                  className="w-full dark:bg-primary dark:bg-opacity-10"
                  title="10.00 AM Task"
                  name="MorningTask"
                  value={formData?.MorningTask}
                  handleInputChange={handleInputChange}
                  disabled={flag}
                />
              </div>
              <div className="col-span-12 md:col-span-5 sm:col-sp">
                <Ainput
                  title={"Status (1 PM)"}
                  type={"text"}
                  handleInputChange={handleInputChange}
                  name={"Status1"}
                  value={formData?.Status1}
                  disabled={flag}
                />
              </div>
              <div className="col-span-12 md:col-span-6">
                <Ainput
                  title={"Remark"}
                  type={"text"}
                  handleInputChange={handleInputChange}
                  name={"Remark1"}
                  value={formData?.Remark1}
                  disabled
                />
              </div>
              <div className="col-span-12 md:col-span-1">
                <Button
                  className="w-full mt-1 md:mt-6"
                  variant={"save"}
                  onClick={SaveData1}
                  disabled={flag}
                >
                  Save
                </Button>
              </div>
              <div className="col-span-12 mt-6">
                <hr className="w-full" />
              </div>
              <div className="col-span-12">
                <ATextArea
                  rows={3}
                  className="w-full dark:bg-primary dark:bg-opacity-10"
                  title="02.00 PM Task"
                  name="AfternooTask"
                  value={formData?.AfternooTask}
                  handleInputChange={handleInputChange}
                  disabled={
                    !flag || (formData.FINAL_STATUS == 1 ? true : false)
                  }
                />
              </div>
              <div className="col-span-12 md:col-span-5">
                <Ainput
                  title={"Status (6 PM)"}
                  type={"text"}
                  handleInputChange={handleInputChange}
                  name={"Status2"}
                  value={formData?.Status2}
                  disabled={
                    !flag || (formData.FINAL_STATUS == 1 ? true : false)
                  }
                />
              </div>
              <div className="col-span-12 md:col-span-6">
                <Ainput
                  title={"Remark"}
                  type={"text"}
                  handleInputChange={handleInputChange}
                  name={"Remark2"}
                  value={formData?.Remark2}
                  disabled
                />
              </div>
              <div className="col-span-12 md:col-span-1 ">
                <Button
                  className="mt-6 w-full"
                  variant={"save"}
                  onClick={SaveData2}
                  disabled={
                    !flag || (formData.FINAL_STATUS == 1 ? true : false)
                  }
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
          <div className="col-span-1 md:col-span-1"></div>
        </div>
      </div>
      <HashloaderComponent isLoading={isLoading} />
    </div>
  );
}
