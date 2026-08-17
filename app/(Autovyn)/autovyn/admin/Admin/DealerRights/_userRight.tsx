"use client";
import React, { useState, useEffect } from "react";
import ModulesRightsSection from "@/components/Templates/DealerRightsSection";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import { Dealer } from "@/constant/DealerbasedRights";
import { Button } from "@/components/ui/button";
import MediumTitle from "@/components/atoms/MediumTitle";
import axios from "axios";
import Swal from "sweetalert2";
import { GrUserAdmin } from "react-icons/gr";

const UserRightsPage = () => {
  //States
  const user = useCurrentUser();
  const [checkedKeys2, setCheckedKeys2] = useState([]);
  const [expandedKeys2, setExpandedKeys2] = useState([]);
  const onCheck2 = (checkedKeys2) => {
    setCheckedKeys2(checkedKeys2);
  };
  const onExpand2 = (expandedKeys2) => {
    setExpandedKeys2(expandedKeys2);
  };
  useEffect(() => {
    fetchData();
  }, []);
  const fetchData = async () => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/users/findDealerRights`,
        {
          checkedKeys2: checkedKeys2,
          user: user,
        },
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
            token: user?.email,
          },
        }
      );
      setCheckedKeys2(response.data.rights || []);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: error.response.data.message
          ? error.response.data.message
          : "Failed to update Rights. Please try again.",
      });
      console.error("Error saving user data:", error);
      throw error; // Re-throw the error to be caught by the calling function if needed
    }
  };
  const saveUserData = async () => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/users/savedealerrights`,
        {
          checkedKeys2: checkedKeys2,
          user: user,
        },
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
            token: user?.email,
          },
        }
      );
      if (response.status === 200) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "saved successfully.",
        }).then(function () {
          setCheckedKeys2([]);
        });
      }
      await fetchData();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: error.response.data.message
          ? error.response.data.message
          : "Failed to update Rights. Please try again.",
      });
      console.error("Error saving user data:", error);
      throw error; // Re-throw the error to be caught by the calling function if needed
    }
  };

  return (
    <main className="grid grid-cols-12 w-full">
      <div className={`col-span-12 lg:col-span-12`}>
        <div className="w-full px-1">
          <div className="relative flex dark:bg-primary dark:bg-opacity-10 flex-col min-w-0 break-words w-full  shadow-lg rounded-lg bg-blueGray-100 border-0">
            <div className="rounded-t bg-white dark:bg-dark mb-0 px-6">
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <GrUserAdmin size={28} className="text-blue-600" />
                  <MediumTitle text={"Dealer Rights"} />
                </div>

                {/* Right side: Buttons */}
                <div className="flex items-center gap-2">
                  <Button type="submit" onClick={saveUserData} variant={"save"}>
                    Save
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
          </div>
          <ModulesRightsSection
            treeData={Dealer}
            onCheck={onCheck2}
            onExpand={onExpand2}
            checkedKeys={checkedKeys2}
            expandedKeys={expandedKeys2}
            Title={"Dealer Wise Rights"}
          />
        </div>
      </div>
    </main>
  );
};

export default UserRightsPage;
