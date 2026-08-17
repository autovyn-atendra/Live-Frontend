import React, { createContext, useState, useContext } from "react";

interface FormData {
  Emp_code: string|null;
}




const FormDataContext = createContext<{
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}>({
    formData: {
      Emp_code: null,
    },
  setFormData: () => {},
});

export const useFormData = () => {
  return useContext(FormDataContext);
};

interface FormDataProviderProps {
  children: React.ReactNode;
}


export const FormDataProvider: React.FC<FormDataProviderProps> = ({
  children,
}) => {
  const [formData, setFormData] = useState<FormData>(
    {
      Emp_code: null,
  });
  

  return (
    <FormDataContext.Provider value={{ formData, setFormData }}>
      {children}
    </FormDataContext.Provider>
  );
};
