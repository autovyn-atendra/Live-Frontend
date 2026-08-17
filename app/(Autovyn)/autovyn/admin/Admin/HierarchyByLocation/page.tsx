"use client";
import React, { useEffect } from "react";
import UserRightsPage from "./_userRight";
import { useFormData } from "../Context/FormDataContext";
import AButton from "@/components/atoms/Buttton";
const userlevel = [
  { Code: "1", Name: "Permission 1" },
  { Code: "2", Name: "Permission 2" },
  { Code: "3", Name: "Permission 3" },
  { Code: "4", Name: "Permission 4" },
  { Code: "5", Name: "Permission 5" },
  { Code: "6", Name: "Permission 6" },
  { Code: "7", Name: "Permission 7" },
  { Code: "8", Name: "Permission 8" },
  { Code: "9", Name: "Permission 9" },
  { Code: "10", Name: "Permission 10" },
  { Code: "11", Name: "Permission 11" },
  { Code: "12", Name: "Permission 12" },
  { Code: "13", Name: "Permission 13" },
  { Code: "14", Name: "Permission 14" },
];
const UserRights = () => {
  const { formData, setFormData } = useFormData();

  return (
    <>
      <div>
        <UserRightsPage userlevel={userlevel} Emp_code={formData.Emp_code} />
      </div>
    </>
  );
};

export default UserRights;
