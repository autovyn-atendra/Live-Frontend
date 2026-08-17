import React, { createContext, useState, useContext } from "react";
interface FormData {
  companies: object[];
}

const FinancerDataContext = createContext<{
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}>({
  formData: {
    companies: [],
  },
  setFormData: () => {},
});

export const useFormData = () => {
  return useContext(FinancerDataContext);
};
interface FormDataProviderProps {
  children: React.ReactNode;
}

export const FormDataProvider: React.FC<FormDataProviderProps> = ({
  children,
}) => {
  const [formData, setFormData] = useState<FormData>({
    companies: [],
  });
  return (
    <FinancerDataContext.Provider value={{ formData, setFormData }}>
      {children}
    </FinancerDataContext.Provider>
  );
};

export default FinancerDataContext;
