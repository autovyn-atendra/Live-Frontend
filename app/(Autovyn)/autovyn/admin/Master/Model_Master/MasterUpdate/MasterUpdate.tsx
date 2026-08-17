"use client";
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import Ainput from "@/components/atoms/Input";
import { Button } from "@/components/ui/button";
import MediumTitle from "@/components/atoms/MediumTitle";
import { GrUserAdmin } from "react-icons/gr";

interface FormData {
  SrNo: string | null;
  Modl_Grp: string | null;
  Modl_Code: string | null;
  Modl_Name: string | null; // Misc_Code equivalent
  Misc_Name: string | null; // Human-readable name
}

interface Props {
  update: FormData | null;
  setShowTable: (val: boolean) => void;
  setShowForm: (val: boolean) => void;
  refetch?: () => void;
}

const ModelMasterUpdate: React.FC<Props> = ({
  update,
  setShowTable,
  setShowForm,
  refetch,
}) => {
  const user = useCurrentUser();

  const [formData, setFormData] = useState<FormData>({
    SrNo: null,
    Modl_Grp: null,
    Modl_Code: null,
    Modl_Name: null,
    Misc_Name: null,
  });

  const [isUpdateMode, setIsUpdateMode] = useState<boolean>(false);

  useEffect(() => {
    if (update) {
      setFormData(update);
      setIsUpdateMode(true);
    } else {
      setFormData({
        SrNo: null,
        Modl_Grp: null,
        Modl_Code: null,
        Modl_Name: null,
        Misc_Name: null,
      });
      setIsUpdateMode(false);
    }
  }, [update]);

  const showAlert = (message: string, type: "success" | "error") => {
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: type,
      title: message,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
  };

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validate = () => {
    if (!formData.Modl_Grp) return "Model Group is required";
    if (!formData.Modl_Code) return "Variant Code is required";
    if (!formData.Modl_Name) return "Variant Name is required";
    if (!formData.Misc_Name) return "Model Name is required";
    return null;
  };

  // const handleSave = async () => {
  //   const error = validate();
  //   if (error) return showAlert(error, "error");

  //   try {
  //     await axios.post(
  //       `${process.env.NEXT_PUBLIC_URL}/quotation/InsertmodelData`,
  //       {
  //         formData,
  //         loc_code: user?.branch
  //       },
  //       {
  //         headers: {
  //           compcode: user?.Comp_Code,
  //           name: user?.name,
  //         },
  //       }
  //     );
  //     showAlert("Model Saved Successfully", "success");
  //     setFormData({
  //       SrNo: null,
  //       Modl_Grp: null,
  //       Modl_Code: null,
  //       Modl_Name: null,
  //       Misc_Name: null,
  //     });
  //   } catch (err: any) {
  //     console.error("Insert Error:", err);
  //     showAlert(err?.response?.data?.error || "Insert failed", "error");
  //   }
  // };

  const handleSave = async () => {
    const error = validate();
    if (error) return showAlert(error, "error");

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/quotation/InsertmodelData`,
        {
          formData,
          loc_code: user?.branch,
        },
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
          },
        }
      );

      showAlert("Model Saved Successfully", "success");

      if (refetch) refetch(); // <-- refetch data after save

      setFormData({
        SrNo: null,
        Modl_Grp: null,
        Modl_Code: null,
        Modl_Name: null,
        Misc_Name: null,
      });
    } catch (err: any) {
      console.error("Insert Error:", err);
      showAlert(err?.response?.data?.error || "Insert failed", "error");
    }
  };

  const handleUpdate = async () => {
    const error = validate();
    if (error) return showAlert(error, "error");

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/quotation/UpdatemodelData`,
        {
          formData,
          loc_code: user?.branch,
        },

        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
          },
        }
      );
      showAlert("Model Updated Successfully", "success");
      if (refetch) refetch();
      setShowForm(false);
      setShowTable(true);
    } catch (err: any) {
      console.error("Update Error:", err);
      showAlert(err?.response?.data?.message || "Update failed", "error");
    }
  };


  return (
    <div className="grid grid-cols-12 p-4 gap-2">
      <div className="col-span-3"></div>
      <div className="col-span-12 md:col-span-6 lg:col-span-5 shadow-lg rounded-2xl bg-gray-100 dark:bg-primary dark:bg-opacity-10">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4 bg-white dark:bg-dark rounded px-6 py-2">
            <div className="flex items-center gap-2">
              <GrUserAdmin size={28} />
              <MediumTitle text={isUpdateMode ? "Update Model" : "Add Model"} />
            </div>
            <div className="flex gap-2">
              <Button
                variant={isUpdateMode ? "update" : "save"}
                onClick={isUpdateMode ? handleUpdate : handleSave}
              >
                {isUpdateMode ? "Update" : "Save"}
              </Button>
              <Button variant="print" onClick={()=>history.back()}>
                Back
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4 mt-4">
            <div className="col-span-12">
              <Ainput
                type="text"
                title="Model Group"
                name="Modl_Grp"
                value={formData.Modl_Grp || ""}
                handleInputChange={handleInputChange}
              />
            </div>

            <div className="col-span-12 md:col-span-6">
              <Ainput
                type="text"
                title="Variant Code"
                name="Modl_Code"
                value={formData.Modl_Code || ""}
                handleInputChange={handleInputChange}
              />
            </div>

            <div className="col-span-12 md:col-span-6">
              <Ainput
                type="text"
                title="Variant Name (Misc_Code)"
                name="Modl_Name"
                value={formData.Modl_Name || ""}
                handleInputChange={handleInputChange}
              />
            </div>

            <div className="col-span-12">
              <Ainput
                type="text"
                title="Model Name"
                name="Misc_Name"
                value={formData.Misc_Name || ""}
                handleInputChange={handleInputChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelMasterUpdate;
