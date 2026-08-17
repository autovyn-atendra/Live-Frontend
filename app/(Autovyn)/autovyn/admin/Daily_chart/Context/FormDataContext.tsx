import { useCurrentUser } from "@/app/hooks/use-current-user";
import React, { createContext, useState, useContext, useEffect } from "react";

interface FormData {
  TRAN_ID: number | null;
  Emp_Name: string | null;
  Emp_Code: string | null;
  Emp_date: string | null;
  MorningTask: string | null;
  Status1: string | null;
  Remark1: string | null;
  AfternooTask: string | null;
  Status2: string | null;
  Remark2: string | null;
  Created_by?: string | null;
  Id?: string | null;
  LOC_CODE?: string | null;
}

const FormDataContext = createContext<{
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}>({
  formData: {
    TRAN_ID: null,
    Emp_Name: null,
    Emp_Code: null,
    Emp_date: null,
    MorningTask: null,
    Status1: null,
    Remark1: null,
    AfternooTask: null,
    Status2: null,
    Remark2: null,
    Created_by: null,
    Id: null,
    LOC_CODE: null,
  },
  setFormData: () => {
    console.warn("setFormData was called without a proper provider");
  },
});

export const useFormData = () => {
  return useContext(FormDataContext);
};

interface FormDataProviderProps {
  children: React.ReactNode;
}

export const FormDataProvider: React.FC<FormDataProviderProps> = ({ children }) => {
  const [formData, setFormData] = useState<FormData>({
    TRAN_ID: null,
    Emp_Name: null,
    Emp_Code: null,
    Emp_date: null,
    MorningTask: null,
    Status1: null,
    Remark1: null,
    AfternooTask: null,
    Status2: null,
    Remark2: null,
    Created_by: null,
    Id: null,
    LOC_CODE: null,
  });

  const { user } = useCurrentUser();

  useEffect(() => {
    if (user) {
      setFormData(prevFormData => ({
        ...prevFormData,
        Created_by: user?.name,
        Id: user.id,
        LOC_CODE: user.branch,
      }));
    }
  }, [user]);

  return (
    <FormDataContext.Provider value={{ formData, setFormData }}>
      {children}
    </FormDataContext.Provider>
  );
};

export default FormDataContext;
