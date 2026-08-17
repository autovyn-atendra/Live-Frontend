"use client";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import DataTable from "@/components/Templates/ServiceTable";
const XLSX = require('xlsx');
import axios from "axios";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import { FaUsers } from "react-icons/fa";
import Swal from "sweetalert2";
import MediumTitle from "@/components/atoms/MediumTitle";
import SmallTitle from "@/components/atoms/smallTitle";
import HashloaderComponent from "@/components/Templates/hashloader";
import { GrUserAdmin } from "react-icons/gr";

function showSideAlert(message, type) {
  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 5000,
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

const Approver2 = () => {
  const user = useCurrentUser();

  const getRowCount = (file, callback) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: 'array' });

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      callback(json.length);
    };

    reader.readAsArrayBuffer(file);
  };


  const showdata = async () => {
    try {
      window.location.href = `${process.env.NEXT_PUBLIC_URL}/users/importformatuserrights?compcode=${user?.Comp_Code}`;
    } catch (error) {
      console.error("Error occurred while making the get request:", error);
    }
  };


  const [excelfile, setFile] = useState();
  const [getcount, setGetcount] = useState(0);
  const [isLoadingonpage, setisLoadingonpage] = useState(false);
  const [tabledata, setTabledata] = useState([]);
  const [erroredData, setErroredData] = useState([]);
  const [correctData, setCorrectData] = useState([]);
  let fileInputRef = useRef(null);
  const columns1 = [
    {
      Header: "Import Status",
      accessor: "rejectionReasons",
      Cell: ({ value }) => {
        return <span className="text-exit">{value}</span>;
      },
    },

    { Header: "User Code", accessor: "User_Code" },
    { Header: "Optn Name", accessor: "Optn_Name" },
    { Header: "Module Code", accessor: "Module_Code" },
  ];
  const handleButtonClick = async () => {

    if (typeof user?.branch === "string") {
      showSideAlert("Cannot Import Data in MultiLocation", "info");
      return;
    }
    try {
      setTabledata([]);
      setisLoadingonpage(true);
      const formData = new FormData();
      formData.append("excel", excelfile, excelfile.name);
      formData.append("user", user?.name);
      formData.append("branch", user?.branch);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/users/excelimportuserrights`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data", // Set the content type for Excel files
            compcode: user?.Comp_Code,name:user?.name,
          },
        }
      );
      if (response.status == 200) {
        setTabledata(response.data.ErroredData);
        setErroredData(response.data.ErroredData);
        setCorrectData(response.data.CorrectData);
        showSideAlert(response?.data?.Message, "success");
        setisLoadingonpage(false);
      }

      console.log("File uploaded successfully:", response.data);
    } catch (error) {
      showSideAlert(
        error?.response?.data?.Message || "Error! Invalid Format",
        "error"
      );
      setisLoadingonpage(false);

      console.error("Error uploading file:", error);
    }
  };

  const handleErrorDataClick = () => {
    setTabledata(erroredData);
  };

  const handleCorrectDataClick = () => {
    setTabledata(correctData);
  };

  const handleChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const extension = file.name.split(".").pop().toLowerCase();
      if (extension === "xlsx" || extension === "xls") {
        setFile(file);
        getRowCount(file, setGetcount);
      } else {
        setFile(null);
        fileInputRef.current.value = "";
        alert("Please select a valid Excel file.");
      }
    }
  };

  const abcd = () => { };
  return (
    <div>
      <div className="col-span-12 gap-2 rounded-xl">
      <div className="rounded-t bg-white dark:bg-dark px-6 py-2">
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div className="flex items-center gap-2">
      <GrUserAdmin size={34} className="mt-1" title="Payroll" />
      <MediumTitle text="User Rights Excel Import" />
    </div>
    <div className="flex gap-x-2">
      <Button variant="save" onClick={showdata}>
        Download Sample
      </Button>
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
        <div className="p-3 dark:bg-primary dark:bg-opacity-10 rounded-xl">
          <div className="flex gap-4">
            <input
              type="file"
              className="lg:w-1/4 md:w-1/2 flex h-9 w-full  rounded-md dark:bg-input bg-white px-3 py-1 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
              accept=".xlsx, .xls"
              onChange={handleChange}
              ref={fileInputRef}
            />
            <Button variant={"save"} onClick={handleButtonClick}>
              Import
            </Button>
          </div>
        </div>
      </div>
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="col-span-12 lg:col-span-2 md:col-span-3 sm:col-span-6 font-bold px-4">
          Total Rows :- {getcount}
        </div>

        <div className="col-span-12 lg:col-span-2 md:col-span-3 sm:col-span-6 font-bold px-4 text-save">
          Imported Rows :- {correctData.length}
        </div>


        <div className="col-span-12 lg:col-span-2 md:col-span-3 sm:col-span-6 font-bold px-4 text-exit">
          Non-Imported Rows :- {erroredData.length}
        </div>


      </div>
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="col-span-12 lg:col-span-2 md:col-span-3 sm:col-span-6">
          <Button
            variant={"outline"}
            className="mt-5 ml-3"
            onClick={handleCorrectDataClick}
          >
            Imported Data
          </Button>
        </div>

        <div className="col-span-12 lg:col-span-2 md:col-span-3 sm:col-span-6">
          <Button
            variant={"outline"}
            className="mt-5 ml-3"
            onClick={handleErrorDataClick}
          >
            Non-Imported Data
          </Button>
        </div>
      </div>
      <div className="col-span-12 mt-2 items-center shadow dark:bg-primary dark:bg-opacity-10">
        <div className="">
          <DataTable
            onRowDoubleClick={abcd}
            columns={columns1}
            selectValue="UTD"
            data={tabledata}
            height="350px"
            excelname={"Insurance Data"}
            filterPosition="FilterData"
            numericFilterColumns={[]}
          />
        </div>
      </div>
      <HashloaderComponent isLoading={isLoadingonpage} />
    </div>
  );
};

export default Approver2;
