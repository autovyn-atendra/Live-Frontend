"use client";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import Eselect from "@/components/atoms/Eselect";
import Ainput from "@/components/atoms/Input";
import SelectSearch from "@/components/atoms/Select";
import HashloaderComponent from "@/components/Templates/hashloader";
import DataTable from "@/components/Templates/ServiceTable";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import moment from "moment";
import { MdAccountCircle } from "react-icons/md";
import { GrUserAdmin } from "react-icons/gr";

export default function InsuranceMaster() {
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

  const user = useCurrentUser();
  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString("en-GB").replace(/\//g, "-") : "";
  const columns = [
    { Header: "SRNO", accessor: "SRNO", Cell: (row: any) => row.row.index + 1 },
    { Header: "Company Name", accessor: "Insu_Co_Name" },
    { Header: "1st Year Payout %", accessor: "FirstYear_PayoutPer" },
    { Header: "Renewal %", accessor: "Renewal_PayoutPer" },
    {
      Header: "Date From",
      accessor: "DATE_FROM",
      Cell: ({ value }) => formatDate(value),
    },
    {
      Header: "Date To",
      accessor: "DATE_TO",
      Cell: ({ value }) => formatDate(value),
    },
  ];

  const [saveDisabled, setSaveDisabled] = useState(false);
  const [UpDateDisabled, setUpDateDisabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [table, setTable] = useState([]);
  const [Utd, setUtd] = useState();
  const [CompName, setCompName] = useState([]);

  const todayOneMonthBackDate = getCurrentDate(1);
  const [currentDate, setCurrentDate] = useState(getCurrentDate());
  const [Formdata, setFormData] = useState({
    DATE_FROM: todayOneMonthBackDate,
    DATE_TO: currentDate,
    Insu_Co_Code: "",
    Insu_Co_Name: "",
    FirstYear_PayoutPer: "",
    Renewal_PayoutPer: "",
    Created_By: user?.name,
    EmpCode: user?.EMPCODE,
  });

  useEffect(() => {
    ViewData();
    ShowData();
  }, []);

  const ShowData = async () => {
    setIsLoading(true);
    try {
      const result = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/InsuPayoutTracker/InsuMasterView`,
        {},
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
          },
        }
      );
      console.log(result, "CompanyName");

      if (result.data?.data) {
        setCompName(
          result.data.data.map((item) => ({
            label: item.label,
            value: item.value,
          }))
        );
      }
    } catch (error) {
      console.error("Error", error);
    } finally {
      setIsLoading(false);
    }
  };

  const ViewData = async () => {
    setIsLoading(true);
    try {
      const result = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/InsuPayoutTracker/InsuPayoutView`,
        {
          EmpCode: user?.EMPCODE,
        },
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
          },
        }
      );
      console.log(result, "ViewData");
      setTable(result.data.data);
    } catch (error) {
      console.error("Error", error);
    } finally {
      setIsLoading(false);
    }
  };

  const SaveData = async () => {
    console.log(Formdata, "kjjhghj");
    // return

    if (!Formdata?.Insu_Co_Name) {
      showSideAlert("Please Select Insurance Company Name", "warning");
      return;
    }

    if (!Formdata?.FirstYear_PayoutPer) {
      showSideAlert("Please Enter 1st Year Payout %", "warning");
      return;
    }

    if (!Formdata?.Renewal_PayoutPer) {
      showSideAlert("Please Enter Renewal Payout %", "warning");
      return;
    }
    setIsLoading(true);
    try {
      const result = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/InsuPayoutTracker/InsuPayoutSave`,
        {
          Formdata,
        },
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
          },
        }
      );
      Swal.fire({
        icon: "success",
        title: "",
        text: "Data Save Succesfully.",
      });
      setFormData({
        DATE_FROM: todayOneMonthBackDate,
        DATE_TO: currentDate,
        Insu_Co_Code: "",
        Insu_Co_Name: "",
        FirstYear_PayoutPer: "",
        Renewal_PayoutPer: "",
        Created_By: user?.name,
        EmpCode: user?.EMPCODE,
      });
      await ViewData();
    } catch (error) {
      console.error("Error", error);
    } finally {
      setIsLoading(false);
    }
  };

  const UpdateData = async () => {
    if (!Formdata?.Insu_Co_Name) {
      showSideAlert("Please Select Insurance Company Name", "warning");
      return;
    }

    if (!Formdata?.FirstYear_PayoutPer) {
      showSideAlert("Please Enter 1st Year Payout %", "warning");
      return;
    }

    if (!Formdata?.Renewal_PayoutPer) {
      showSideAlert("Please Enter Renewal Payout %", "warning");
      return;
    }
    setIsLoading(true);
    try {
      const result = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/InsuPayoutTracker/InsuPayoutUpdate`,
        {
          Formdata,
          UTD: Utd,
        },
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
          },
        }
      );
      console.log(result, "SaveData");
      Swal.fire({
        icon: "success",
        title: "",
        text: "Data Update Succesfully.",
      });
      setSaveDisabled(false);
      setUpDateDisabled(true);
      setFormData({
        DATE_FROM: todayOneMonthBackDate,
        DATE_TO: currentDate,
        Insu_Co_Code: "",
        Insu_Co_Name: "",
        FirstYear_PayoutPer: "",
        Renewal_PayoutPer: "",
        Created_By: user?.name,
        EmpCode: user?.EMPCODE,
      });
      await ViewData();
    } catch (error) {
      console.error("Error", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRowDoubleClick = (rowData: any) => {
    console.log(rowData, "rowData");
    setFormData((prevState) => ({
      ...prevState,
      Insu_Co_Name: rowData?.Insu_Co_Code || "",
      FirstYear_PayoutPer: rowData?.FirstYear_PayoutPer || "",
      Renewal_PayoutPer: rowData?.Renewal_PayoutPer || "",
      DATE_FROM: rowData?.DATE_FROM || "",
      DATE_TO: rowData?.DATE_TO || "",
    }));
    setUtd(rowData?.UTD);
    setSaveDisabled(true);
    setUpDateDisabled(false);
  };

  const handleInputChange = (name: any, value: any) => {
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  return (
    <div className="p-1">
      <div className=" w-full mt-2 p-1 ">
        <div className="grid grid-cols-1 md:grid-cols-12 mt-2 gap-3">
          <div className="col-span-12 lg:col-span-5">
            <div className="rounded-t bg-white dark:bg-dark px-6 py-2">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-x-2 px-1 font-semibold text-base lg:text-xl text-pretty uppercase">
                  <GrUserAdmin size={28} />
                  Insurance Payout Policy Setup
                </div>
                <Button variant="print" className="flex items-center gap-x-1" onClick= {()=>history.back()}>
                  Back
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 p-3   shadow-signUp  rounded-b  dark:bg-primary dark:bg-opacity-10">
              <div className="col-span-12 md:col-span-12">
                <SelectSearch
                  title={"Insurance Company Name"}
                  handleInputChange={handleInputChange}
                  name={"Insu_Co_Name"}
                  options={CompName}
                  selectedValue={Formdata?.Insu_Co_Name}
                />
              </div>

              <div className="col-span-12 md:col-span-6">
                <Ainput
                  title={"1st Year Payout %"}
                  type={"text"}
                  handleInputChange={handleInputChange}
                  name={"FirstYear_PayoutPer"}
                  value={Formdata?.FirstYear_PayoutPer}
                />
              </div>

              <div className="col-span-12 md:col-span-6">
                <Ainput
                  title={"Renewal Payout %"}
                  type={"text"}
                  handleInputChange={handleInputChange}
                  name={"Renewal_PayoutPer"}
                  value={Formdata?.Renewal_PayoutPer}
                />
              </div>

              <div className="col-span-12 md:col-span-6">
                <Ainput
                  title="DATE FROM"
                  type="date"
                  name="DATE_FROM"
                  value={Formdata.DATE_FROM}
                  handleInputChange={handleInputChange}
                />
              </div>

              <div className="col-span-12 md:col-span-6">
                <Ainput
                  title="DATE TO"
                  type="date"
                  name="DATE_TO"
                  value={Formdata.DATE_TO}
                  handleInputChange={handleInputChange}
                />
              </div>

              <div className="col-span-12 md:col-span-12 gap-x-2 flex justify-center pb-2">
                <Button
                  className="mr-1"
                  variant={"save"}
                  onClick={SaveData}
                  disabled={saveDisabled}
                >
                  Save
                </Button>
                <Button
                  className="mr-1"
                  variant={"update"}
                  onClick={UpdateData}
                  disabled={UpDateDisabled}
                >
                  Update
                </Button>
              </div>
            </div>
          </div>
          <div className="col-span-12 lg:col-span-7 shadow-signUp pb-5 px-1   rounded-lg  dark:bg-primary dark:bg-opacity-10 ">
            <div className="w-full text-center">
              <DataTable
                columns={columns}
                data={table}
                onRowDoubleClick={handleRowDoubleClick}
                filterPosition="FilterData"
                numericFilterColumns={[]}
              />
            </div>
          </div>
        </div>
      </div>
      <HashloaderComponent isLoading={isLoading} />
    </div>
  );
}
