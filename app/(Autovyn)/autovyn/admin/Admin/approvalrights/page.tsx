"use client";
import React, { useEffect } from "react";
import UserRightsPage from "./_userRight";
import { useFormData } from "../Context/FormDataContext";

const UserRights = () => {
  const { formData, setFormData } = useFormData();

  return (
    <>
      <div>
        <UserRightsPage Emp_code={formData.Emp_code} />
      </div>
    </>
  );
};

export default UserRights;
