"use client";
import Swal from "sweetalert2";
import React, { useState, useEffect } from "react";
import Ainput from "@/components/atoms/Input";
import axios from "axios";
import SelectSearch from "@/components/atoms/Select";
import SmallTitle from "@/components/atoms/smallTitle";
import MediumTitle from "@/components/atoms/MediumTitle";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import CustomInputWithDatalist from "@/components/atoms/selectsearch";
import DataTable from "@/components/Templates/ServiceTable";
import { LuRefreshCcwDot } from "react-icons/lu";
import { useRouter } from "next/navigation";
import HashloaderComponent from "@/components/Templates/hashloader";
import { GrUserAdmin } from "react-icons/gr";

interface User {
  empcode: string | null;
  UTD: number;
  EMPNAME: string | null;
  module_code: string | null;
  approver1_A: string | null;
  approver1_B: string | null;
  approver2_A: string | null;
  approver2_B: string | null;
  approver3_A: string | null;
  approver3_B: string | null;
  Location: string | null;
  CORPORATEMAILID: string | null;
  MOBILE_NO: string | null;
  EMPLOYEEDESIGNATION: string | null;
  Created_by: string | null;
}

const UserRightsPage = ({ Emp_code }) => {
  //States
  const user = useCurrentUser();
  const initialUser: User = {
    empcode: null,
    UTD: 0,
    EMPNAME: null,
    module_code: null,
    approver1_A: null,
    approver1_B: null,
    approver2_A: null,
    approver2_B: null,
    approver3_A: null,
    approver3_B: null,
    Location: null,
    CORPORATEMAILID: null,
    MOBILE_NO: null,
    EMPLOYEEDESIGNATION: null,
    Created_by: user?.id,
  };
  const [options, setOptions] = useState(null);
  const [ModuleOptions, setModuleOptions] = useState([]);
  const [User, setUser] = useState<User>(initialUser);
  const [UserCode, setUserCode] = useState(null);
  const [tabledata, settabledata] = useState([]);
  const [isClicked, setisClicked] = useState(false);
  const [Location, setLocation] = useState([]);

  useEffect(() => {
    setisClicked(true);
    fetchData();
  }, []);

  useEffect(() => {}, [isClicked]);
  useEffect(() => {
    fetchUserData();
  }, [UserCode]);

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
  const fetchUserData = async () => {
    try {
      if (UserCode == "" || UserCode == null) {
        return;
      }
      setisClicked(true);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/users/approvalmatrixfindone`,
        { empcode: UserCode },
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
          },
        }
      );
      console.log(response);
      setisClicked(false);
      const data = response.data;
      settabledata(data.approval_data);
      setUser((prev: User) => ({
        ...prev,
        ...data?.data,
        UTD: 0,
        approver1_A: null,
        approver1_B: null,
        approver2_A: null,
        approver2_B: null,
        approver3_A: null,
        approver3_B: null,
        module_code: null,
        Created_by: user?.id,
      }));
    } catch (error) {
      setisClicked(false);
      console.error("An error occurred while fetching data:", error);
      throw error; // Throwing the error to propagate it to the caller
    }
  };

  const fetchData = async () => {
    if (options) return;
    setisClicked(true);
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
      setModuleOptions(response.data.module);
      setLocation(response.data.location);
      setisClicked(false);
    } catch (e) {
      setisClicked(false);
      console.log(e);
    }
  };

  const handleSelectChange = async (name, value) => {
    try {
      setUserCode(value);
      setUser(initialUser);
      setUser((prev: User) => ({
        ...prev,
        [name]: value,
      }));
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleInputChange = (name: string, value: any): void => {
    setUser((prev: User) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleModuleInputChange = (name: string, value: any): void => {
    console.log(name, value, "inside select change ");
    console.log(tabledata);
    const foundItem = tabledata?.find((item) => item.module_code === value);
    console.log(foundItem);
    if (foundItem) {
      setUser((prev: User) => ({
        ...prev,
        ...foundItem,
      }));
    } else {
      setUser((prev: User) => ({
        ...prev,
        [name]: value,
        UTD: 0,
        approver1_A: null,
        approver1_B: null,
        approver2_A: null,
        approver2_B: null,
        approver3_A: null,
        approver3_B: null,
      }));
    }
  };

  const saveUserData1 = async () => {
    const selectedCode = Emp_code || "";
    const userCode = UserCode || "";

    // if (selectedCode !== userCode) {
    //   Swal.fire({
    //     icon: "error",
    //     title: "Error!",
    //     text: `Employee code mismatch! Selected: ${selectedCode}, Expected: ${userCode}`,
    //   });
    //   return;
    // }
    fetchUserData();
  };

  const doubleclicked = (row) => {
    setUser((prev: User) => ({
      ...prev,
      ...row,
    }));
  };

  const updateUserData = async () => {
    try {
      setisClicked(true);

      if (!User.module_code) {
        showSideAlert("Please select a Module", "warning");
        setisClicked(false);
        return;
      }
      const {
        approver1_A,
        approver2_A,
        approver3_A,
        approver1_B,
        approver2_B,
        approver3_B,
      } = User;

      // 👉 Combine all approvers
      const allApprovers = [
        approver1_A,
        approver2_A,
        approver3_A,
        approver1_B,
        approver2_B,
        approver3_B,
      ].filter(v => v !== null && v !== "");

      // 👉 Find duplicates
      const duplicates = allApprovers.filter(
        (item, index) => allApprovers.indexOf(item) !== index
      );

      if (duplicates.length > 0) {
        showSideAlert(
          `Duplicate approver not allowed: ${duplicates[0]}`,
          "warning"
        );
        setisClicked(false);
        return; // ❌ STOP API CALL
      }

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/users/approvalmatrix`,
        { ...User, Created_by: user?.id },
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
          },
        }
      );
      if (response.status === 200) {
        setisClicked(false);
        fetchUserData();
        showSideAlert("User updated successfully.", "success");
      }
    } catch (error) {
      setisClicked(false);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Failed to update user. Please try again.",
      });
      showSideAlert("Failed to update Approvals. Please try again.", "error");
      throw error; // Re-throw the error to be caught by the calling function if needed
    }
  };


  const columns1 = [
    { Header: "UTD", accessor: "UTD" },
    { Header: "Module", accessor: "module_code" },
    { Header: "Appr 1 A", accessor: "approver1_A" },
    { Header: "Appr 1 B", accessor: "approver1_B" },
    { Header: "Appr 2 A", accessor: "approver2_A" },
    { Header: "Appr 2 B", accessor: "approver2_B" },
    { Header: "Appr 3 A", accessor: "approver3_A" },
    { Header: "Appr 3 B", accessor: "approver3_B" },
  ];

  const router = useRouter();

  // const back = () => {
  //   router.push("/autovyn/admin/HierarchyWindow");
  // };

  return (
    <main className="grid grid-cols-12 w-full gap-2">
      <section className="py-1 bg-blueGray-50 col-span-12 ">
        <div className="w-full  px-1 mt-1 ">
          <div className="relative flex dark:bg-primary dark:bg-opacity-10 flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded-lg bg-blueGray-100 border-0">
            <div className="rounded-t bg-white dark:bg-dark mb-0 px-6 ">
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <GrUserAdmin
                    size={22}
                    className="text-gray-700 dark:text-gray-300"
                  />
                  <MediumTitle text={"User Rights"} />
                </div>
                <div className="flex gap-x-2">
                  <Button
                    disabled={UserCode ? false : true}
                    type="button"
                    variant={"save"}
                    onClick={updateUserData}
                  >
                    Save
                  </Button>
                  <Button type="button" variant={"print"} onClick={()=>history.back()}>
                    Back
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className=" lg:col-span-6 shadow-xl dark:bg-primary rounded-xl dark:bg-opacity-10  col-span-12 flex-auto px-1 py-6  pt-0">
        <div className="flex flex-wrap py-3">
          <div className="flex w-full lg:w-1/2 -mt-2">
            <div className="w-full lg:w-1/2 px-1">
              <CustomInputWithDatalist
                className={""}
                idPrefix="empcode"
                name="empcode"
                title="find Employee"
                options={options}
                selectedValue={Emp_code ? Emp_code : UserCode}
                handleInputChange={handleSelectChange}
              />
            </div>
            <div
              onClick={saveUserData1}
              className="bg-primary cursor-pointer text-center font-bold text-white h-9 w-20 flex justify-center mt-7 ml-4 rounded-md relative bg-sky-500"
            >
              <LuRefreshCcwDot
                className={`absolute right-4 h-5 w-8 mt-2 mr-2  ${
                  isClicked ? "animate-spin" : ""
                }`}
              ></LuRefreshCcwDot>
            </div>
          </div>
          <div className="w-full lg:w-1/2 px-1">
            <Ainput
              title={"EMPNAME"}
              type={"text"}
              name={"EMPNAME"}
              value={User.EMPNAME}
            />
          </div>
          <div className="w-full lg:w-1/2 px-1">
            <Ainput
              title={"Location"}
              type={"text"}
              name={"Location"}
              value={User.Location}
            />
          </div>
          <div className="w-full lg:w-1/2 px-1">
            <Ainput
              title={"Email"}
              type={"text"}
              name={"CORPORATEMAILID"}
              value={User.CORPORATEMAILID}
            />
          </div>
          <div className="w-full lg:w-1/2 px-1">
            <Ainput
              title={"Mobile No"}
              type={"text"}
              name={"User_Name"}
              value={User.MOBILE_NO}
            />
          </div>
          <div className="w-full lg:w-1/2 px-1">
            <Ainput
              title={"Designation"}
              type={"text"}
              name={"EMPLOYEEDESIGNATION"}
              value={User.EMPLOYEEDESIGNATION}
            />
          </div>
        </div>
        <hr className="mt-3 border-b-1 border-blueGray-300 py-1.5" />
        <SmallTitle text={" Other Information"} />

        <div className="flex flex-wrap py-3">
          <div className="w-full lg:w-1/2 px-1">
            <SelectSearch
              name={"module_code"}
              title={"Module"}
              selectedValue={User.module_code}
              options={ModuleOptions}
              handleInputChange={handleModuleInputChange}
            />
          </div>
          <div className="w-full lg:w-1/2 px-1">
            <SelectSearch
              name={"Branch"}
              title={"Branch"}
              selectedValue={User.Branch}
              options={Location}
              handleInputChange={handleModuleInputChange}
            />
          </div>
          <div className="w-full lg:w-1/2 px-1">
            <CustomInputWithDatalist
              className={""}
              idPrefix="approver1_A"
              name="approver1_A"
              title="Approver 1 (A)"
              options={options}
              selectedValue={User.approver1_A}
              handleInputChange={handleInputChange}
            />
          </div>
          <div className="w-full lg:w-1/2 px-1">
            <CustomInputWithDatalist
              className={""}
              idPrefix="approver1_B"
              name="approver1_B"
              title={"Approver 1 (B)"}
              options={options}
              selectedValue={User.approver1_B}
              handleInputChange={handleInputChange}
            />
          </div>
          <div className="w-full lg:w-1/2 px-1">
            <CustomInputWithDatalist
              className={""}
              idPrefix="approver2_A"
              name="approver2_A"
              title={"Approver 2 (A)"}
              options={options}
              selectedValue={User.approver2_A}
              handleInputChange={handleInputChange}
            />
          </div>
          <div className="w-full lg:w-1/2 px-1">
            <CustomInputWithDatalist
              className={""}
              idPrefix="approver2_B"
              name="approver2_B"
              title={"Approver 2 (B)"}
              options={options}
              selectedValue={User.approver2_B}
              handleInputChange={handleInputChange}
            />
          </div>
          <div className="w-full lg:w-1/2 px-1">
            <CustomInputWithDatalist
              className={""}
              idPrefix="approver3_A"
              name="approver3_A"
              title={"Approver 3 (A)"}
              options={options}
              selectedValue={User.approver3_A}
              handleInputChange={handleInputChange}
            />
          </div>
          <div className="w-full lg:w-1/2 px-1">
            <CustomInputWithDatalist
              className={""}
              idPrefix="approver3_B"
              name="approver3_B"
              title={"Approver 3 (B)"}
              options={options}
              selectedValue={User.approver3_B}
              handleInputChange={handleInputChange}
            />
          </div>
        </div>
      </div>
      <div className="lg:col-span-6 shadow-xl dark:bg-primary rounded-xl dark:bg-opacity-10  col-span-12">
        <DataTable
          columns={columns1}
          selectValue="UTD"
          data={tabledata}
          height="350px"
          onRowDoubleClick={doubleclicked}
          filterPosition="FilterData"
          numericFilterColumns={[]}
        />
      </div>
      <HashloaderComponent isLoading={isClicked} />
    </main>
  );
};

export default UserRightsPage;
