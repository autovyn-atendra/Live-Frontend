"use client";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import Ainput from "@/components/atoms/Input";
import SelectSearch from "@/components/atoms/Select";
import SmallTitle from "@/components/atoms/smallTitle";
import { Button } from "@/components/ui/button";
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useRouter } from "next/router";

type EmployeeData = {
  Ded_Type: number | null;
  Emp_Id: number | null;
  Emp_Name: string | null;
  Mnth: number | null;
  Rec_Date: string;
  Ded_Amt: number | null;
  Basic_Arr: number | null;
  HRA_ARR: number | null;
  Conv_Arr: number | null;
  Medical_Arr: number | null;
  Washing_Arr: number | null;
  Yr: number | null;
  Ded_Rem: string;
  Created_By: string | null;
};

type FormData = {
  Created_by: string;
  employeeData: EmployeeData | null; // Nullable employeeData
};

export default function page({}) {
  const user = useCurrentUser();

  const [empcode, setEmpCode] = useState([]);

  const [formdata, setFormData] = useState<FormData>({
    Created_by: user?.name || "",
    employeeData: {
      Ded_Type: null,
      Emp_Id: null,
      Emp_Name: null,
      Mnth: null,
      Rec_Date: "",
      Ded_Amt: null,
      Basic_Arr: null,
      HRA_ARR: null,
      Conv_Arr: null,
      Medical_Arr: null,
      Washing_Arr: null,
      Yr: null,
      Ded_Rem: "",
      Created_By: user?.name || null,
    },
  });

  const months = [
    { value: 1, label: "1" },
    { value: 2, label: "2" },
    { value: 3, label: "3" },
    { value: 4, label: "4" },
    { value: 5, label: "5" },
    { value: 6, label: "6" },
    { value: 7, label: "7" },
    { value: 8, label: "8" },
    { value: 9, label: "9" },
    { value: 10, label: "10" },
    { value: 11, label: "11" },
    { value: 12, label: "12" },
  ];

  const year = [
    { value: 2021, label: "2021" },
    { value: 2022, label: "2022" },
    { value: 2023, label: "2023" },
    { value: 2024, label: "2024" },
    { value: 2025, label: "2025" },
    { value: 2026, label: "2026" },
  ];

  const DeductionType = [
    { value: 1, label: "Advance" },
    { value: 2, label: "MobDed" },
    { value: 3, label: "Uniform Ded" },
    { value: 4, label: "New Uniform" },
    { value: 5, label: "IPad Ded" },
    { value: 6, label: "TDS" },
    { value: 7, label: "Loan" },
    { value: 8, label: "Mediclaim Ded" },
    { value: 9, label: "Other Ded" },
    { value: 10, label: "Arear" },
    { value: 11, label: "Penality" },
    { value: 12, label: "Outstanding" },
  ];

  useEffect(() => {
    const fetchdata = async () => {
      const response = await apiRequest.post("/ars/all", {});
      setEmpCode(response.data?.data);
    };
    fetchdata();
  }, []);

  const [isUpdateDisabled, setIsUpdateDisabled] = useState(true);
  const [isSaveDisabled, setIsSaveDisabled] = useState(false);

  const [imageSrc, setImageSrc] = useState(null);
  const handleFileChange = (event: any) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();

      reader.onload = (e) => {
        setImageSrc(e.target.result);
      };

      reader.readAsDataURL(file);
    } else {
      setImageSrc(null);
    }
    console.log(file);
  };

  const handleInputChange = (name: any, value: any) => {
    setFormData((prevData) => ({
      ...prevData,
      employeeData: {
        ...prevData.employeeData,
        [name]: value,
      },
    }));
  };

  const handledata = async () => {
    if (formdata.employeeData?.Emp_Id == null) {
      Swal.fire({
        icon: "warning",
        title: "",
        text: "Name Cannot be empty successfully.",
      });
    } else {
      const response = await apiRequest.post("/empded", formdata);
      console.log(response);
      if (response.status == 200) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "User saved successfully.",
        });
      }
    }
  };

  return (
    <div className="grid grid-cols-12 md:col-span-12 lg:col-span-5 p-4 ">
      <div className="col-span-12 md:col-span-3"></div>
      <div className="col-span-12 md:col-span-6 shadow-signUp rounded-2xl bg-gray dark:bg-dark">
        <div className="p-2">
          <div className="rounded-t bg-white dark:bg-dark mb-0 px-6 py-1 ">
            <div className="flex items-center justify-between py-1 gap-1">
              <SmallTitle text={"Employee Deduction"} />
              <div className="flex ">
                <Button
                  variant={"save"}
                  onClick={handledata}
                  disabled={isSaveDisabled}
                >
                  Save
                </Button>
              </div>
              <Button variant={"update"} disabled={isUpdateDisabled}>
                Update
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-12 mt-2 gap-2 px-2 ">
            <div className="col-span-12">
              <SelectSearch
                title={"select Employee"}
                name={"Emp_Id"}
                selectedValue={formdata.employeeData?.Emp_Id}
                options={empcode}
                handleInputChange={handleInputChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-12 mt-2 gap-2 px-2">
            <div className="col-span-12 sm:col-span-4">
              <SelectSearch
                title={"Select a Month:"}
                name={"Mnth"}
                options={months}
                selectedValue={formdata.employeeData?.Mnth}
                handleInputChange={handleInputChange}
              />
            </div>
            <div className="col-span-12 sm:col-span-4">
              <SelectSearch
                title={"Year"}
                name={"Yr"}
                options={year}
                selectedValue={formdata.employeeData?.Yr}
                handleInputChange={handleInputChange}
              />
            </div>
            <div className="col-span-12 sm:col-span-4">
              <Ainput
                type={"date"}
                title={"Deduction Date"}
                name={"Rec_Date"}
                handleInputChange={handleInputChange}
                value={formdata.employeeData?.Rec_Date}
              />
            </div>
          </div>

          <div className="grid grid-cols-12 gap-2 mt-1 px-2">
            <div className="col-span-12 sm:col-span-4">
              <Ainput
                type={"text"}
                title={"Deduction Amount"}
                handleInputChange={handleInputChange}
                value={formdata.employeeData?.Ded_Amt}
                name={"Ded_Amt"}
              />
            </div>
            <div className="col-span-12 sm:col-span-4">
              <Ainput
                type={"date"}
                title={"A/C Expiry Date"}
                name={"A/C_Expiry_Date"}
                handleInputChange={handleInputChange}
                value={formdata}
              />
            </div>
            <div className="col-span-12 sm:col-span-4">
              <SelectSearch
                title={"Deduction Type"}
                name={"Ded_Type"}
                selectedValue={formdata.employeeData?.Ded_Type}
                options={DeductionType}
                handleInputChange={handleInputChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-12 gap-2 mt-2 px-2">
            <div className="col-span-12">
              <Ainput
                type={"text"}
                title={"Deduction Remark"}
                name={"Ded_Rem"}
                handleInputChange={handleInputChange}
                value={formdata.employeeData?.Ded_Rem}
              />
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4 mt-2 px-2 ">
            <div className="col-span-12 sm:col-span-3"></div>
            <div className="col-span-12 sm:col-span-6 ">
              <label className=" bg-gray dark:bg-dark flex h-36 items-center bg-white justify-center border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
                {!imageSrc ? (
                  <span className="text-gray-500 dark:text-gray-400">
                    <svg
                      className="w-6 h-6 text-gray-800 dark:text-white"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12 3c.3 0 .6.1.8.4l4 5a1 1 0 1 1-1.6 1.2L13 7v7a1 1 0 1 1-2 0V6.9L8.8 9.6a1 1 0 1 1-1.6-1.2l4-5c.2-.3.5-.4.8-.4ZM9 14v-1H5a2 2 0 0 0-2 2v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-4v1a3 3 0 1 1-6 0Zm8 2a1 1 0 1 0 0 2 1 1 0 1 0 0-2Z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="ml-[-30px] bottom-1 bg-gray dark:bg-dark">
                      Upload Image
                    </span>
                  </span>
                ) : (
                  <img
                    src={imageSrc}
                    alt="Uploaded"
                    className="h-full w-full rounded-lg"
                  />
                )}
                <input
                  type="file"
                  className="hidden"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={handleFileChange}
                />
              </label>
            </div>
            <div className="col-span-12 sm:col-span-3"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
