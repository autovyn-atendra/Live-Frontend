"use client";
import React, { useEffect, useState } from "react";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import CustomInputWithDatalist from "@/components/atoms/selectsearch";
import axios from "axios";

const AdminSection = () => {
  const user = useCurrentUser();
  const { data: session, update } = useSession();
  const [options, setOptions] = useState(null);
  const [UserCode, setUserCode] = useState(user?.EMPCODE);
  const [isloading, setisloading] = useState(false);
  const [data, setData] = useState(null);



  useEffect(() => {
    const fetchData = async () => {
      if (options) return;
      // setisClicked(true);

      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_URL}/users/findAllEmployee`,
          {
            branch: typeof user.branch === "string" ? user?.branch : user?.multi,
          },
          {
            headers: {
              compcode: user?.Comp_Code, name: user?.name,
            },
          }
        );
        setOptions(response.data.data);
        // setModuleOptions(response.data.module);
        // setisClicked(false);
      } catch (e) {
        // setisClicked(false);
        console.log(e);
      }
    };
    fetchData()
  }, [])
  const handleSelectChange = async (name, value) => {
    try {
      setUserCode(value);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  const SessionUpdate = async () => {
    console.log(user)
    try {

      setisloading(true);
      await update({
        ...session,
        user: {
          ...session?.user,
          EMPCODE: UserCode,
          emp_dms_code: data?.data?.emp_dms_code ? data?.data?.emp_dms_code : ""
        },
      });
    } catch (error) {
      console.log(error);
    } finally {
      setisloading(false)
    }
  }
  useEffect(() => { fetchUserData() }, [UserCode])
  const fetchUserData = async () => {
    try {
      if (UserCode == '' || UserCode == null) {
        return;
      }
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/users/approvalmatrixfindone`,
        { empcode: UserCode },
        {
          headers: {
            compcode: user?.Comp_Code, name: user?.name,
          },
        }
      );
      const data = response.data;
      setData(data)
    } catch (error) {
      console.error("An error occurred while fetching data:", error);
      throw error; // Throwing the error to propagate it to the caller
    }
  };

  return (

    <>
      <div className="space-y-2">
        <div className="flex gap-2 w-full ">
          <div className="w-full">

            <CustomInputWithDatalist
              className={"  border border-[#d0d5dd] dark:border-[#d0d5dd]"}
              idPrefix="empcode"
              name="empcode"
              title="find Employee"
              options={options}
              selectedValue={UserCode}
              handleInputChange={handleSelectChange}
            />
          </div>
          <div className="flex items-end">
            <div>
              <Button onClick={SessionUpdate} disabled={isloading} loading={isloading} variant={"save"}>
                Update
              </Button>
            </div>
          </div>
        </div>
        <div className="rounded-lg p-3 overflow-y-scroll max-h-[240px] bg-white dark:bg-[#1e293b]  border border-[#d0d5dd] dark:border-[#d0d5dd] ">
          {/* Employee Details */}
          <div className="mb-4 space-y-0.8">
            <h3 className="text-lg font-bold text-gray-800 text text-[#193a69] dark:text-[#38bdf8]">{data?.data?.EMPNAME}</h3>
            <p className="text-base  text-[#193a69] dark:text-[#e2e8f0]">
              <span className="font-semibold ">Designation:</span> {data?.data?.EMPLOYEEDESIGNATION}
            </p>
            <p className="text-base text-gray-600 text-[#193a69] dark:text-[#e2e8f0]">
              <span className="font-semibold ">Dms Code:</span> {data?.data?.emp_dms_code}
            </p>
            <p className="text-base text-gray-600 text-[#193a69] dark:text-[#e2e8f0]">
              <span className="font-semibold ">Location:</span> {data?.data?.Location}
            </p>
            <p className="text-base text-gray-600 text-[#193a69] dark:text-[#e2e8f0] break-words">
              <span className="font-semibold ">Multi_Loc:</span> {data?.data?.Multi_Loc}
            </p>
            <p className="text-base text-gray-600 text-[#193a69] dark:text-[#e2e8f0]">
              <span className="font-semibold ">Mobile:</span> {data?.data?.MOBILE_NO}
            </p>
          </div>

          {/* Approval Data */}
        </div>

        <div className="rounded-lg p-4 overflow-y-scroll max-h-[190px] bg-white dark:bg-[#1e293b]  border border-[#d0d5dd] dark:border-[#d0d5dd] ">
          <h4 className="text-lg font-bold mb-2 text-[#193a69] dark:text-[#38bdf8]">Approval Data:</h4>
          <div className="space-y-4">
            {data?.approval_data?.map((approval, index) => (
              <div
                key={index}
                className="bg-gray-100 p-3 rounded-md border border-[#d0d5dd] dark:border-[#d0d5dd] "
              >

                <p className="text-base text-gray-700 text-[#193a69] dark:text-[#e2e8f0]">
                  <span className="font-semibold">Module Code:</span>{" "}
                  {approval.module_code}
                </p>
                <div className="flex justify-between">

                  <div className="w-1/2">
                    <p className="text-base text-gray-700 text-[#193a69] dark:text-[#e2e8f0]">
                      <span className="font-semibold">1A:</span>{" "}
                      {approval.approver1_A || "N/A"}
                    </p>
                    <p className="text-base text-gray-700 text-[#193a69] dark:text-[#e2e8f0]">
                      <span className="font-semibold">2A:</span>{" "}
                      {approval.approver1_A || "N/A"}
                    </p>
                    <p className="text-base text-gray-700 text-[#193a69] dark:text-[#e2e8f0]">
                      <span className="font-semibold">3A:</span>{" "}
                      {approval.approver1_A || "N/A"}
                    </p>
                  </div>
                  <div className="w-1/2">
                    <p className="text-base text-gray-700 text-[#193a69] dark:text-[#e2e8f0]">
                      <span className="font-semibold">1B:</span>{" "}
                      {approval.approver2_A || "N/A"}
                    </p>
                    <p className="text-base text-gray-700 text-[#193a69] dark:text-[#e2e8f0]">
                      <span className="font-semibold">2B:</span>{" "}
                      {approval.approver2_A || "N/A"}
                    </p>
                    <p className="text-base text-gray-700 text-[#193a69] dark:text-[#e2e8f0]">
                      <span className="font-semibold">3B:</span>{" "}
                      {approval.approver2_A || "N/A"}
                    </p>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminSection;
