"use client";
import Swal from "sweetalert2";
import React, { useState, useEffect } from "react";
import axios from "axios";
import MediumTitle from "@/components/atoms/MediumTitle";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import CustomInputWithDatalist from "@/components/atoms/selectsearch";
import DataTable from "@/components/Templates/servicetable";
import { LuRefreshCcwDot } from "react-icons/lu";
import { useRouter } from "next/navigation";
import HashloaderComponent from "@/components/Templates/hashloader";
import { Checkbox } from "antd";
import Fselect from "@/components/atoms/Fselectuser";
import { GrUserAdmin } from "react-icons/gr";

interface User {
  module_code: string | null;
  approver1_A: string | null;
  approver1_B: string | null;
  approver2_A: string | null;
  approver2_B: string | null;
  approver3_A: string | null;
  approver3_B: string | null;
  Location: string | null;
  Created_by: string | null;
  Check: boolean;
}

interface TransFer {
  module_code: string | null;
  EMPCODE: string | null;
  Appr_Code: string | null;
  Created_by: string | null;
}

const UserRightsPage = () => {
  //States
  const user = useCurrentUser();
  const initialUser: User = {
    module_code: null,
    approver1_A: null,
    approver1_B: null,
    approver2_A: null,
    approver2_B: null,
    approver3_A: null,
    approver3_B: null,
    Location: null,
    Created_by: user?.id || null,
    Check: true,
  };
  const initialTransfer: TransFer = {
    module_code: null,
    EMPCODE: null,
    Appr_Code: null,
    Created_by: user?.id || null,
  };

  const [options, setOptions] = useState(null);
  const [User, setUser] = useState<User>(initialUser);
  const [tranfer, setTranfer] = useState<TransFer>(initialTransfer);
  const [tabledata, settabledata] = useState([]);
  const [isClicked, setisClicked] = useState(false);
  const [modules, setModules] = useState([]);
  const [branch, setBranch] = useState([]);
  const [EmployeeData, setEmployeeData] = useState([]);

  useEffect(() => {
    setisClicked(true);
    fetchData();
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [User.module_code, User.Location]);

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
    console.log(User, "user");

    try {
      if (
        User.module_code == "" ||
        User.module_code == null ||
        User.Location == "" ||
        User.Location == null
      ) {
        return;
      }
      setisClicked(true);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/users/approvalmatrixfindOneByLocation`,
        {
          module_code: User.module_code,
          branch: User.Location,
        },
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
          },
        }
      );
      settabledata(response.data?.data);
      setEmployeeData(response.data?.data2?.EmployeeCount);
      setisClicked(false);
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
      setModules(response.data.module);
      setBranch(response.data.branch);
      setOptions(response.data.data);
      setisClicked(false);
    } catch (e) {
      setisClicked(false);
      console.log(e);
    }
  };

  const handleInputChange = (name, value): void => {
    setUser((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleInputChangeTransfer = (name, value): void => {
    setTranfer((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const saveUserData1 = async () => {
    fetchUserData();
  };

  const doubleclicked = (row) => {
    setUser((prev: User) => ({
      ...prev,
      ...row,
    }));
  };

  const updateUserData = async () => {
    console.log(User, "sj");

    if (!User.module_code) {
      showSideAlert("Please select a Module", "warning");
      setisClicked(false);
      return;
    }
    if (
      !User.approver1_A &&
      !User.approver1_B &&
      !User.approver2_A &&
      !User.approver2_B &&
      !User.approver3_A &&
      !User.approver3_B
    ) {
      showSideAlert("Please select An Approval", "warning");
      setisClicked(false);
      return;
    }
    try {
      const confirmed = await Swal.fire({
        icon: "warning",
        title: "Are you sure?",
        text: "This action is irreversible and cannot be undone. Do you want to proceed?",
        confirmButtonText: "OK",
        cancelButtonText: "Cancel",
        showCancelButton: true,
      });

      if (confirmed.isConfirmed) {
        setisClicked(true);

        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_URL}/users/approvalmatrixByLocation`,
          { User },
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
          setUser((prev) => ({
            ...prev,
            approver1_A: null,
            approver1_B: null,
            approver2_A: null,
            approver2_B: null,
            approver3_A: null,
            approver3_B: null,
          }));
        }
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
  const updateUserDataTranfer = async () => {
    try {
      if (!tranfer.module_code) {
        showSideAlert("Please select a Module", "warning");
        setisClicked(false);
        return;
      }
      if (!tranfer.EMPCODE && !tranfer.Appr_Code) {
        showSideAlert("Please select Employee and Approver code", "warning");
        setisClicked(false);
        return;
      }
      const confirmed = await Swal.fire({
        icon: "warning",
        title: "Are you sure?",
        text: "This action is irreversible and cannot be undone. Do you want to proceed?",
        confirmButtonText: "OK",
        cancelButtonText: "Cancel",
        showCancelButton: true,
      });
      if (confirmed.isConfirmed) {
        setisClicked(true);

        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_URL}/users/approvalmatrixTransfer`,
          { tranfer },
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
          setTranfer(initialTransfer);
        }
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
  const importEmployees = async () => {
    try {
      if (!User.module_code) {
        showSideAlert("Please select a Module", "warning");
        setisClicked(false);
        return;
      }
      if (!User.Location) {
        showSideAlert("Please select a Location", "warning");
        setisClicked(false);
        return;
      }

      const confirmed = await Swal.fire({
        icon: "warning",
        title: "Are you sure?",
        text: "Employees will get imported for approval hierarchy",
        confirmButtonText: "OK",
        cancelButtonText: "Cancel",
        showCancelButton: true,
      });
      if (confirmed.isConfirmed) {
        setisClicked(true);

        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_URL}/users/ApprovalMatrixImport`,
          { ...User },
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
          showSideAlert(response.data?.Message, "success");
          setTranfer(initialTransfer);
        }
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
    { Header: "Module", accessor: "module_code" },
    { Header: "Appr 1 A", accessor: "approver1_A" },
    { Header: "Appr 1 B", accessor: "approver1_B" },
    { Header: "Appr 2 A", accessor: "approver2_A" },
    { Header: "Appr 2 B", accessor: "approver2_B" },
    { Header: "Appr 3 A", accessor: "approver3_A" },
    { Header: "Appr 3 B", accessor: "approver3_B" },
    { Header: "Count", accessor: "count_" },
  ];

  const router = useRouter();

  const back = () => {
    history.back();
  };
  const handleCheckboxChange = (e) => {
    handleInputChange("Check", e.target.checked); // Update the state with the new checkbox value
  };
  const checkboxStyle = {
    transform: "scale(1.5)", // Adjust the scale to make the checkbox larger
    marginRight: "10px",
    // Add some margin to the right of the checkbox
  };
  return (
    <main className="grid grid-cols-12 w-full gap-2">
      <div className=" lg:col-span-6  shadow-xl dark:bg-primary rounded-xl dark:bg-opacity-10  col-span-12 flex-auto px-1 abcdklalks  pt-0">
        <section className="py-1 bg-blueGray-50 col-span-12 ">
          <div className="w-full  px-1 mt-1 ">
            <div className="relative flex dark:bg-primary dark:bg-opacity-10 flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded-lg bg-blueGray-100 border-0">
              <div className="rounded-t bg-white dark:bg-dark mb-0 px-6">
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <GrUserAdmin
                      size={22}
                      className="text-gray-700 dark:text-gray-300"
                    />
                    <MediumTitle text="User Rights" />
                  </div>
                  <div className="flex gap-x-2">
                    <Button
                      type="button"
                      variant="save"
                      onClick={updateUserData}
                    >
                      Save
                    </Button>

                    <Button
                      type="button"
                      variant="print"
                      onClick={() => window.history.back()}
                      className="flex items-center gap-1"
                    >
                      Back
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap py-3">
          <div className="w-full lg:w-1/2 px-1">
            <Fselect
              name={"Location"}
              title={"branch"}
              initialValue={User.Location}
              option={branch}
              handleInputChange={handleInputChange}
            />
          </div>

          <div className="w-full lg:w-1/2 px-1 flex gap-x-2">
            <Fselect
              name={"module_code"}
              title={"Module"}
              initialValue={User.module_code}
              option={modules}
              handleInputChange={handleInputChange}
            />
            <div
              onClick={saveUserData1}
              className="bg-primary cursor-pointer text-center font-bold text-white h-9 w-20 flex justify-center mt-5  rounded-md relative bg-sky-500"
            >
              <LuRefreshCcwDot
                className={`absolute right-4 h-5 w-8 mt-2   ${isClicked ? "animate-spin" : ""
                  }`}
              ></LuRefreshCcwDot>
            </div>
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
          <div className="w-full  px-1 mt-4">
            <Checkbox
              checked={User.Check}
              onChange={handleCheckboxChange}
              className="font-semibold dark:text-exit capitalize px-4 text-exit"
            >
              By unChecking This CheckBox Empty Values Will Be Updated At The
              Place of Approval Levels Make Sure to Fill The Complete Values.
            </Checkbox>
          </div>
          <p className="px-4 mt-2 mb-0 w-full">
            Total employees on the Location which have no Approvers defined :-{" "}
            {EmployeeData}
          </p>
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
      <div className="shadow-xl dark:bg-primary rounded-xl dark:bg-opacity-10 col-span-12  lg:col-span-6 flex-auto px-1 abcdklalks  pt-0 h-[500px]">
        <section className="py-1 bg-blueGray-50 col-span-12 ">
          <div className="w-full  px-1 mt-1 ">
            <div className="relative flex dark:bg-primary dark:bg-opacity-10 flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded-lg bg-blueGray-100 border-0">
              <div className="rounded-t bg-white dark:bg-dark mb-0 px-6 ">
                <div className="flex items-center justify-between py-1">
                  <MediumTitle text={"Approval TransFer Rights"} />
                  <div className="flex gap-x-2">
                    <Button
                      type="button"
                      variant={"save"}
                      onClick={updateUserDataTranfer}
                      className=""
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <div className="flex flex-wrap py-3">
          <div className="w-full lg:w-1/2 px-1 flex gap-x-2">
            <Fselect
              name={"module_code"}
              title={"Module"}
              initialValue={tranfer.module_code}
              option={modules}
              handleInputChange={handleInputChangeTransfer}
            />
          </div>
          <div className="w-full lg:w-1/2 px-1"></div>
          <div className="w-full lg:w-1/2 px-1">
            <CustomInputWithDatalist
              className={""}
              idPrefix="approver1_A"
              name="EMPCODE"
              title="Empcode"
              options={options}
              selectedValue={tranfer.EMPCODE}
              handleInputChange={handleInputChangeTransfer}
            />
          </div>
          <div className="w-full lg:w-1/2 px-1">
            <CustomInputWithDatalist
              className={""}
              idPrefix="approver1_B"
              name="Appr_Code"
              title={"Approver Code"}
              options={options}
              selectedValue={tranfer.Appr_Code}
              handleInputChange={handleInputChangeTransfer}
            />
          </div>
        </div>
      </div>
      <div className="shadow-xl dark:bg-primary rounded-xl dark:bg-opacity-10 col-span-12  lg:col-span-6 flex-auto px-1 abcdklalks  pt-0 h-[500px]">
        <section className="py-1 bg-blueGray-50 col-span-12 ">
          <div className="w-full  px-1 mt-1 ">
            <div className="relative flex dark:bg-primary dark:bg-opacity-10 flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded-lg bg-blueGray-100 border-0">
              <div className="rounded-t bg-white dark:bg-dark mb-0 px-6 ">
                <div className="flex items-center justify-between py-1">
                  <MediumTitle text={"Import New Employees"} />
                  <div className="flex gap-x-2">
                    <Button
                      type="button"
                      variant={"save"}
                      onClick={importEmployees}
                      className=""
                    >
                      Import
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <div className="flex flex-wrap py-3">
          <div className="w-full lg:w-1/2 px-1 flex gap-x-2">
            <Fselect
              name={"Location"}
              title={"branch"}
              initialValue={User.Location}
              option={branch}
              handleInputChange={handleInputChange}
              isSelectAll={false}
            />
          </div>

          <div className="w-full lg:w-1/2 px-1 flex gap-x-2">
            <Fselect
              name={"module_code"}
              title={"Module"}
              initialValue={User.module_code}
              option={modules}
              handleInputChange={handleInputChange}
              isSelectAll={false}
            />
          </div>
          <div className="flex flex-wrap">
            <p className="px-4 mt-2 mb-0 w-full">
              Total employees on the Location which have no Approvers defined :-{" "}
              {EmployeeData}
            </p>
            <p className="px-4 mt-2 mb-0 w-full">
              With this option you can import the new Employees from the master
              for any module
            </p>
            <p className="px-4 mb-0 w-full">Select module and press import</p>
            <p className="px-4 mb-0 w-full">
              Then update the approvals manually one by one or by location
            </p>
          </div>
        </div>
      </div>
      <HashloaderComponent isLoading={isClicked} />
    </main>
  );
};

export default UserRightsPage;
