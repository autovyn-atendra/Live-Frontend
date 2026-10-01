"use client";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import DataTable from "@/components/Templates/servicetable";
import axios from "axios";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import { FaUsers } from "react-icons/fa";
import Swal from "sweetalert2";
import MediumTitle from "@/components/atoms/MediumTitle";
import SmallTitle from "@/components/atoms/smallTitle";
import HashloaderComponent from "@/components/Templates/hashloader";
import Image from 'next/image';

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

interface Approver2Props {
  isDialogMode?: boolean;  // 👈 Yeh add karo
}

const formatDisplayDate = (value: any) => {
  if (value === null || value === undefined || value === "") return "";
  const str = String(value).trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str) || /^\d{2}\/\d{2}\/\d{2}$/.test(str)) return str;

  // Match YYYY-MM-DD or YYYY/MM/DD
  const m = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) {
    const yyyy = m[1];
    const mm = m[2].padStart(2, "0");
    const dd = m[3].padStart(2, "0");
    return `${dd}/${mm}/${yyyy}`;
  }

  // Match DD-MM-YYYY or DD.MM.YYYY
  const m2 = str.match(/^(\d{1,2})[-.](\d{1,2})[-.](\d{4})/);
  if (m2) {
    const dd = m2[1].padStart(2, "0");
    const mm = m2[2].padStart(2, "0");
    const yyyy = m2[3];
    return `${dd}/${mm}/${yyyy}`;
  }

  // Match DD-MM-YY or DD/MM/YY
  const m3 = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2})$/);
  if (m3) {
    const dd = m3[1].padStart(2, "0");
    const mm = m3[2].padStart(2, "0");
    const yy = m3[3];
    return `${dd}/${mm}/${yy}`;
  }

  const d = new Date(value);
  if (!isNaN(d.getTime())) {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  }
  return str;
};

const Approver2 = ({ isDialogMode = false }: Approver2Props) => {
  const user = useCurrentUser();

  const showdata = async () => {
    try {
      window.location.href = `${process.env.NEXT_PUBLIC_URL}/employeeImport/importformat?compcode=${user?.Comp_Code}&flag=${1}`;
    }
    catch (error) {
      console.error("Error occurred while making the get request:", error);
    }
  }

  const [excelfile, setFile] = useState();
  const [isLoadingonpage, setisLoadingonpage] = useState(false);
  const [tabledata, setTabledata] = useState([]);
  const [erroredData, setErroredData] = useState([]);
  const [correctData, setCorrectData] = useState([]);
  const [updatedData, setUpdatedData] = useState([]); // NEW: rows returned in response.data.UpdatedData
  let fileInputRef = useRef(null);

  const columns1 = [
    {
      Header: "rejectionReasons", accessor: "rejectionReasons",
      Cell: ({ value }) => <span className="text-exit">{value}</span>
    },

    // NEW: system-generated EMPCODE (always max+1, ignores what user typed)
    { Header: "Employee Code", accessor: "EMPCODE" },
    // NEW: what the user actually typed in Excel, kept only for reference.
    // Remove this column if you didn't add ENTERED_EMPCODE on the backend/DB.
    { Header: "Entered Code (ignored)", accessor: "ENTERED_EMPCODE" },

    { Header: "EmpName", accessor: "EMPFIRSTNAME" },
    { Header: "Gender", accessor: "GENDER" },
    { Header: "Employee Type", accessor: "EMPTYPE" },

    { Header: "CHANNEL", accessor: "CHANNEL_NAME" },
    { Header: "CLUSTER", accessor: "CLUSTER_NAME" },
    { Header: "LOCATION", accessor: "LOCATION_NAME" },
    { Header: "SECTION", accessor: "SECTION_NAME" },
    { Header: "DEPARTMENT", accessor: "DIVISION_NAME" },

    { Header: "Designation", accessor: "EMPLOYEEDESIGNATION" },
    { Header: "Punch Code", accessor: "PAY_CODE" },
    { Header: "MSPIN", accessor: "MSPIN" },
    { Header: "Mobile", accessor: "MOBILE_NO" },
    { 
      Header: "DOB", 
      accessor: "DOB",
      Cell: ({ value }: any) => formatDisplayDate(value)
    },
    { 
      Header: "Joining Date", 
      accessor: "CURRENTJOINDATE",
      Cell: ({ value }: any) => formatDisplayDate(value)
    },
    { Header: "Aadhar", accessor: "UID_NO" },
    { Header: "PAN", accessor: "PANNO" },
    { Header: "Address", accessor: "PERMANENTADDRESS1" },
    { Header: "Religion", accessor: "RELCODE" },

    { Header: "PF %", accessor: "pfper" },
    { Header: "PF Y/N", accessor: "PFNO" },
    { Header: "PF Number", accessor: "pfnumber" },
    { Header: "ESI Y/N", accessor: "ESINO" },
    { Header: "LWF Y/N", accessor: "LWFNO" },
    { Header: "Professional Tax", accessor: "pro_tax" },

    { Header: "Payment Mode", accessor: "PAYMENTMODE" },
    { Header: "BANK NAME", accessor: "BANKNAME" },
    { Header: "BANK ACCOUNT NO", accessor: "BANKACCOUNTNO" },
    { Header: "IFSC", accessor: "ifsc_code" },
    { Header: "WEEKLYOFF", accessor: "WEEKLYOFF" },
    { Header: "SHIFT", accessor: "EMP_SHIFT_NAME" },
    { Header: "Permanent City", accessor: "PCITY_NAME", Cell: ({ row }: any) => row.original.PCITY_NAME || row.original.PCITY || "" },
    { Header: "Permanent District", accessor: "PDIST_NAME", Cell: ({ row }: any) => row.original.PDIST_NAME || row.original.PDIST || "" },
    { Header: "Current City", accessor: "CCITY_NAME", Cell: ({ row }: any) => row.original.CCITY_NAME || row.original.CCITY || "" },
    { Header: "Current District", accessor: "CDIST_NAME", Cell: ({ row }: any) => row.original.CDIST_NAME || row.original.CDIST || "" },
    { Header: "Grade", accessor: "GRADE_NAME", Cell: ({ row }: any) => row.original.GRADE_NAME || row.original.GRADE || "" },
    { Header: "Marital Status", accessor: "Marital_Status_NAME", Cell: ({ row }: any) => row.original.Marital_Status_NAME || row.original.MARITALSTATUS || row.original.Marital_Status || "" },
    { Header: "Punch Type", accessor: "Punch_Type_NAME", Cell: ({ row }: any) => row.original.Punch_Type_NAME || row.original.Punch_Type || "" },
  ];

  const handleButtonClick = async () => {
    if (!excelfile) {
      showSideAlert("Please select an Excel file first", "warning");
      return;
    }
    try {
      setTabledata([])
      setisLoadingonpage(true);
      const formData = new FormData();
      formData.append("excel", excelfile, excelfile.name);
      formData.append("branch", user?.branch);
      const userCodeVal = user?.user_code || user?.User_Code || user?.id || "";
      formData.append("user_code", userCodeVal);
      // Points to the employeeImport endpoint
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/employeeImport/excelimportFinal`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            compcode: user?.Comp_Code,
            name: user?.name,
            user_code: userCodeVal,
          },
        }
      );

      console.log(response);

      if (response.status == 200) {

        const convertYN = (value) => {
          if (value === 1) return "YES";
          if (value === 0) return "NO";
          return value;
        };

        const WeeklyOff = [
          "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"
        ];

        const convertWeeklyOff = (value) => {
          if (value === null || value === undefined || value === "") return value;
          return WeeklyOff[value] || value;
        };

        const Religion = [
          "", "HINDU", "MUSLIMS", "SIKH", "CHRISTIAN", "JAIN", "BUDDHA", "PERSIANS"
        ];

        const convertReligion = (value) => {
          if (!value) return value;
          return Religion[value] || value;
        };

        const convertEmpType = (value) => {
          if (value == 1 || value == "1") return "REGULAR";
          if (value == 2 || value == "2") return "CASUAL";
          if (value == 3 || value == "3") return "APPRENTICE";
          return value;
        };

        const mapDisplayFields = (item) => ({
          ...item,
          DOB: formatDisplayDate(item.DOB),
          CURRENTJOINDATE: formatDisplayDate(item.CURRENTJOINDATE),
          PFNO: convertYN(item.PFNO),
          ESINO: convertYN(item.ESINO),
          LWFNO: convertYN(item.LWFNO),
          pro_tax: convertYN(item.pro_tax),
          WEEKLYOFF: convertWeeklyOff(item.WEEKLYOFF),
          RELCODE: convertReligion(item.RELCODE),
          EMPTYPE: convertEmpType(item.EMPTYPE),
        });

        const ErroredMapped = response.data.ErroredData.map(mapDisplayFields);
        const CorrectMapped = response.data.CorrectData.map(mapDisplayFields);
        // NEW: UpdatedData mapped the same way as the other two buckets
        const UpdatedMapped = (response.data.UpdatedData || []).map(mapDisplayFields);

        setErroredData(ErroredMapped);
        setCorrectData(CorrectMapped);
        setUpdatedData(UpdatedMapped);
        setTabledata(ErroredMapped);

        showSideAlert(response?.data?.Message, 'success');
        setisLoadingonpage(false);
      }

      console.log("File uploaded successfully:", response.data);
    } catch (error) {
      showSideAlert(error?.response?.data?.Message || "Error! Invalid Format", "error");
      setisLoadingonpage(false);
      console.error("Error uploading file:", error);
    }
  };

  const handleChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const extension = file.name.split('.').pop().toLowerCase();
      if (extension === 'xlsx' || extension === 'xls') {
        setFile(file);
      } else {
        setFile(null);
        fileInputRef.current.value = '';
        alert('Please select a valid Excel file.');
      }
    }
  };

  const abcd = () => { }

  const handleErrorDataClick = () => {
    setTabledata(erroredData);
  };

  const handleCorrectDataClick = () => {
    setTabledata(correctData);
  };

  // NEW: switch the table to show only the rows that went through the update path
  const handleUpdatedDataClick = () => {
    setTabledata(updatedData);
  };

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12 ">
        <div className="rounded-t bg-header dark:bg-black px-2 md:px-6 py-2 border dark:border-borderColor-dark  px-6 py-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex">
              <h1 className="font-bold sm:text-sm md:text-lg lg:text-xl text-white dark:text-[#37a9dd] flex items-center gap-x-3 uppercase">
                <Image
                  src="/Payrollicon/Excel_Import.png"
                  alt="Autovyn"
                  width={25}
                  height={25}
                />
                Employee Master Excel Import
              </h1>
            </div>
            <div className="flex justify-between gap-x-2">
              <Button variant={"save"} onClick={showdata}>
                Download Sample
              </Button>
              {!isDialogMode && (
                <Button variant={"print"} onClick={() => window.history.back()}>
                  Back
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3 gap-2 md:gap-3  rounded-b p-2 md:p-4 bg-white dark:bg-black border border-borderColor dark:border-borderColor-dark shadow ">
          <div className="flex gap-4">
            <input
              type="file"
              className="pt-1.5 border border-borderColor dark:border-borderColor-dark lg:w-1/4 md:w-1/2 flex h-9 w-full  rounded-md dark:bg-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300" accept=".xlsx, .xls"
              onChange={handleChange}
              ref={fileInputRef}
            />
            <Button variant={"save"} onClick={handleButtonClick}>
              Import
            </Button>
          </div>
        </div>
      </div>

      <div className="col-span-12">
        <div className="mt-0  md:gap-3 rounded-b p-2 md:p-4 bg-white dark:bg-black 
      border border-borderColor dark:border-borderColor-dark shadow flex flex-wrap 
      items-center gap-4 font-bold">
          <div className="text-save">
            Imported Rows :- {correctData?.length}
          </div>
          {/* NEW: Updated Rows count */}
          <div className="text-save">
            Updated Rows :- {updatedData?.length}
          </div>
          <div className="text-exit">
            Non-Imported Rows :- {erroredData?.length}
          </div>

          <Button
            variant="outline"
            className="ml-4"
            onClick={handleCorrectDataClick}
          >
            Imported Data
          </Button>
          {/* NEW: Updated Data button */}
          <Button
            variant="outline"
            onClick={handleUpdatedDataClick}
          >
            Updated Data
          </Button>
          <Button
            variant="outline"
            onClick={handleErrorDataClick}
          >
            Non-Imported Data
          </Button>
        </div>
      </div>

      <div className="col-span-12 mt-0 items-center gap-0 md:gap-3  rounded-b p-2 md:p-4 bg-white dark:bg-black border border-borderColor dark:border-borderColor-dark shadow ">
        <DataTable
          onRowDoubleClick={abcd}
          columns={columns1}
          selectValue="UTD"
          data={tabledata}
          height="350px"
          filterPosition="FilterData"
          numericFilterColumns={[]}
        />
      </div>

      <HashloaderComponent isLoading={isLoadingonpage} />
    </div>
  );
};

export default Approver2;