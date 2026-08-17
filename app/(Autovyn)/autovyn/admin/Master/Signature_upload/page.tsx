"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import { toast } from "@/components/ui/use-toast";
import HashloaderComponent from "@/components/Templates/hashloader";
import MediumTitle from "@/components/atoms/MediumTitle";
import { GrUserAdmin } from "react-icons/gr";

const Page = () => {

  const user = useCurrentUser();
const [loader, setloader] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const [formData, setFormData] = useState({
    Sign_Name: "",
    Sign_Desig: "",
  });

  const [signatureList, setSignatureList] = useState([]);

  // =========================
  // FILE CHANGE
  // =========================

  const handleFileChange = (event) => {

    const file = event.target.files[0];

    setSelectedFile(file);

  };

  // =========================
  // UPLOAD SIGNATURE
  // =========================

  const uploadSignature = async () => {

    try {
setloader(true);
      if (!selectedFile) {

        toast({
          title: "Select Signature",
          variant: "destructive",
        });

        return;
      }

      if (!formData.Sign_Name) {

        toast({
          title: "Enter Signature Name",
          variant: "destructive",
        });

        return;
      }

      if (!formData.Sign_Desig) {

        toast({
          title: "Enter Designation",
          variant: "destructive",
        });

        return;
      }

      const formdata1 = new FormData();

      formdata1.append("Image", selectedFile);

      formdata1.append("Sign_Name", formData.Sign_Name);

      formdata1.append("Sign_Desig", formData.Sign_Desig);

      formdata1.append("User_Name", user?.name);

      const result = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/admin/uploadSignature`,
        formdata1,
        {
          headers: {
            compcode: user?.Comp_Code,
            token: user?.email,
          },
        }
      );

      toast({
        title: result.data.Message,
        variant: "default",
      });

      setFormData({
        Sign_Name: "",
        Sign_Desig: "",
      });

      setSelectedFile(null);

      const fileInput = document.getElementById(
        "signatureFileInput"
      ) as HTMLInputElement;

      if (fileInput) {
        fileInput.value = "";
      }

      getSignatureList();

    } catch (error) {

      console.log(error);

      toast({
        title: "Upload Failed",
        variant: "destructive",
      });

    } finally {

    setloader(false);

  }
  };

  // =========================
  // GET SIGNATURE LIST
  // =========================

  const getSignatureList = async () => {

    try {
 setloader(true);
      const result = await axios.get(
        `${process.env.NEXT_PUBLIC_URL}/admin/getSignatureList`,
        {
          headers: {
            compcode: user?.Comp_Code,
            token: user?.email,
          },
        }
      );

      setSignatureList(result.data);

    } catch (error) {

      console.log(error);

    } finally {

    setloader(false);

  }
  };

  // =========================
  // DEACTIVATE
  // =========================

  const deactivateSignature = async (UTD) => {

    try {
setloader(true);
      await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/admin/deactivateSignature`,
        {
          UTD,
        },
        {
          headers: {
            compcode: user?.Comp_Code,
            token: user?.email,
          },
        }
      );

      toast({
        title: "Signature Deactivated",
        variant: "default",
      });

      getSignatureList();

    } catch (error) {

      console.log(error);

    }  finally {

    setloader(false);

  }
  };

  // =========================
  // USE EFFECT
  // =========================

  useEffect(() => {

    if (user?.Comp_Code) {
      getSignatureList();
    }

  }, [user]);

 return (

  <div className="w-full overflow-x-hidden">

    {/* HEADER */}

    <div className="col-span-12 rounded-t bg-header dark:bg-black px-2 md:px-6 py-3 border dark:border-borderColor-dark">
      <div className="flex items-center justify-between">

        <div className="flex items-center gap-3">
          <GrUserAdmin
            size={30}
            className="text-white dark:text-[#37a9dd]"
          />

          <h1 className="font-bold text-lg md:text-xl text-white dark:text-[#37a9dd] uppercase">
            Signature Upload
          </h1>
        </div>

        <Button
          variant={"print"}
          onClick={() => window.history.back()}
        >
          Back
        </Button>

      </div>
    </div>

    {/* FORM SECTION */}

    <div className="grid grid-cols-12 gap-3 rounded-b p-4 bg-white dark:bg-black border border-borderColor dark:border-borderColor-dark shadow">

      {/* SIGN NAME */}

      <div className="col-span-12 md:col-span-3">

        <label className="text-sm font-semibold mb-1 block">
          Signature Name
        </label>

        <input
          type="text"
          value={formData.Sign_Name}
          onChange={(e) =>
            setFormData({
              ...formData,
              Sign_Name: e.target.value,
            })
          }
          className="flex h-10 w-full rounded border dark:bg-input bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1"
        />

      </div>

      {/* DESIGNATION */}

      <div className="col-span-12 md:col-span-3">

        <label className="text-sm font-semibold mb-1 block">
          Designation
        </label>

        <input
          type="text"
          value={formData.Sign_Desig}
          onChange={(e) =>
            setFormData({
              ...formData,
              Sign_Desig: e.target.value,
            })
          }
          className="flex h-10 w-full rounded-md border dark:bg-input bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1"
        />

      </div>

      {/* FILE */}

      <div className="col-span-12 md:col-span-3">

        <label className="text-sm font-semibold mb-1 block">
          Upload Signature
        </label>

        <input
          id="signatureFileInput"
          type="file"
          onChange={handleFileChange}
          className="flex h-10 w-full rounded-md border dark:bg-input bg-white px-3 py-2 text-sm shadow-sm file:border-0 file:bg-transparent"
        />

      </div>

      {/* BUTTON */}

      <div className="col-span-12 md:col-span-3 flex items-end">

        <Button
          variant={"save"}
          onClick={uploadSignature}
          className="w-full md:w-auto"
        >
          Upload Signature
        </Button>

      </div>

    </div>

    {/* TABLE HEADER */}

    <div className="grid grid-cols-12 relative mt-3">

      <div className="col-span-12 rounded-t bg-header dark:bg-black px-3 py-2 border border-borderColor dark:border-borderColor-dark">
        <h1 className="text-white dark:text-[#37a9dd] uppercase font-semibold text-sm">
          Signature List
        </h1>
      </div>

      {/* TABLE */}

      <div className="mt-2 col-span-12 w-full">

        <div className="overflow-x-auto w-full border border-borderColor dark:border-borderColor-dark bg-white shadow rounded-b dark:bg-black px-3 py-3">

          <table className="border-collapse table-auto w-full text-sm shadow-md">

            <thead className="bg-header dark:bg-input text-white">

              <tr>

                <th className="border py-2 px-4 text-center uppercase">
                  Name
                </th>

                <th className="border py-2 px-4 text-center uppercase">
                  Designation
                </th>

                <th className="border py-2 px-4 text-center uppercase">
                  Signature
                </th>

                <th className="border py-2 px-4 text-center uppercase">
                  Uploaded By
                </th>

                <th className="border py-2 px-4 text-center uppercase">
                  Upload Date
                </th>

                <th className="border py-2 px-4 text-center uppercase">
                  Action
                </th>

              </tr>

            </thead>

            <tbody>

              {signatureList?.map((item, index) => (

                <tr
                  key={index}
                  className="hover:bg-gray-100 dark:hover:bg-input"
                >

                  <td className="border py-2 px-4 text-center">
                    {item.Sign_Name}
                  </td>

                  <td className="border py-2 px-4 text-center">
                    {item.Sign_Desig}
                  </td>

                  <td className="border py-2 px-4 text-center">

                    <img
                      src={`https://erp.autovyn.com/backend/fetch?filePath=${item.File_Path}`}
                      className="h-16 mx-auto object-contain"
                    />

                  </td>

                  <td className="border py-2 px-4 text-center">
                    {item.User_Name}
                  </td>

                  <td className="border py-2 px-4 text-center">
                    {item.Upload_Date}
                  </td>

                  <td className="border py-2 px-4 text-center">

                    <Button
                      variant={"print"}
                      onClick={() =>
                        deactivateSignature(item.UTD)
                      }
                    >
                      Deactivate
                    </Button>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

    </div>
<HashloaderComponent isLoading={loader} />
  </div>

);
};

export default Page;