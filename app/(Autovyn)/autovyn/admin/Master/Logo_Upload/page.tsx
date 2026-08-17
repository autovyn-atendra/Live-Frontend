"use client";
import { useEffect, useState, useCallback } from "react";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import SelectSearch from "@/components/atoms/Select";
import Acheckbox from "@/components/atoms/Checkbox";
import Ainput from "@/components/atoms/Input";
import ReportsRights from "@/components/Templates/ReportsRights";
import Swal from "sweetalert2";
import axios from "axios";
import Eselect from "@/components/atoms/Eselect";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { FaUsers } from "react-icons/fa";
import FileViewer from "@/components/atoms/FileviewerBank";
import { GrUserAdmin } from "react-icons/gr";
import MediumTitle from "@/components/atoms/MediumTitle";

interface PurchaseReq {
  Maruti_Logo: string | null;
  Comp_Logo: string | null;
  DEFAULT_ASSET_CATEGORY_IMAGE: string | null;
  DEFAULT_ASSET_SUBCATEGORY_IMAGE: string | null;
  DEFAULT_ASSET_IMAGE: string | null;
  Created_By: string | null;
  Location: string | null;
}

const Page = () => {
  const user = useCurrentUser();
  const [generatedOtp, setGeneratedOtp] = useState(false);

  // Using filters for all inputs
  const [filters, setFilters] = useState({
    inputText: "",
    otp: "",
    encryptedText: "",
  });

  const initialPurchaseReq: PurchaseReq = {
    Comp_Logo: null,
    Maruti_Logo: null,
    DEFAULT_ASSET_CATEGORY_IMAGE: null,
    DEFAULT_ASSET_SUBCATEGORY_IMAGE: null,
    DEFAULT_ASSET_IMAGE: null,
    Created_By: user?.name,
    Location: user?.branch,
  };

  const [formData, setFormData] = useState<PurchaseReq>(initialPurchaseReq);

  // Separate state for each file input
  const [selectedFiles, setSelectedFiles] = useState({
    companyImage: null,
    marutiImage: null,
    assetCategoryImage: null,
    assetSubCategoryImage: null,
    assetImage: null,
  });

  // Handler for Company Logo
  const handleCompanyFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFiles((prevData) => ({
      ...prevData,
      companyImage: file,
    }));
  };

  // Handler for Maruti Logo
  const handleMarutiFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFiles((prevData) => ({
      ...prevData,
      marutiImage: file,
    }));
  };

  // Handler for Asset Category Image
  const handleAssetCategoryFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFiles((prevData) => ({
      ...prevData,
      assetCategoryImage: file,
    }));
  };

  // Handler for Asset SubCategory Image
  const handleAssetSubCategoryFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFiles((prevData) => ({
      ...prevData,
      assetSubCategoryImage: file,
    }));
  };

  // Handler for Asset Image
  const handleAssetFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFiles((prevData) => ({
      ...prevData,
      assetImage: file,
    }));
  };

  // Upload function for Company Logo
  const uploadCompanyLogo = async () => {
    if (!selectedFiles.companyImage) {
      toast({
        title: "Select Image To Upload",
        variant: "destructive",
      });
      return;
    }

    try {
      const formdata1 = new FormData();
      formdata1.append("name", user?.name);
      formdata1.append("Image", selectedFiles.companyImage);
      const result = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/quotation/uploadedImageforlogo`,
        formdata1,
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
            token: user?.email
          },
        }
      );
      setFormData((prev) => ({
        ...prev,
        Comp_Logo: result.data,
      }));
      toast({
        title: `Document Uploaded Successfully`,
        variant: "default",
      });
      // Clear the selected file after successful upload
      setSelectedFiles((prev) => ({ ...prev, companyImage: null }));
      // Reset the file input
      const fileInput = document.getElementById('companyFileInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      toast({
        title: `${error.response?.data.Message || "Upload failed"}`,
        variant: "destructive",
      });
      console.error("Error fetching data:", error);
    }
  };

  // Upload function for Maruti Logo
  const uploadMarutiLogo = async () => {
    if (!selectedFiles.marutiImage) {
      toast({
        title: "Select Image To Upload",
        variant: "destructive",
      });
      return;
    }

    try {
      const formdata1 = new FormData();
      formdata1.append("name", user?.name);
      formdata1.append("Image", selectedFiles.marutiImage);
      const result = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/quotation/uploadedImageforMaruti_Logo`,
        formdata1,
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
            token: user?.email
          },
        }
      );
      setFormData((prev) => ({
        ...prev,
        Maruti_Logo: result.data,
      }));
      toast({
        title: `Document Uploaded Successfully`,
        variant: "default",
      });
      // Clear the selected file after successful upload
      setSelectedFiles((prev) => ({ ...prev, marutiImage: null }));
      const fileInput = document.getElementById('marutiFileInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      toast({
        title: `${error.response?.data.Message || "Upload failed"}`,
        variant: "destructive",
      });
      console.error("Error fetching data:", error);
    }
  };

  // Upload function for Asset Category Image
  const uploadAssetCategoryImage = async () => {
    if (!selectedFiles.assetCategoryImage) {
      toast({
        title: "Select Image To Upload",
        variant: "destructive",
      });
      return;
    }

    try {
      const formdata1 = new FormData();
      formdata1.append("name", user?.name);
      formdata1.append("Image", selectedFiles.assetCategoryImage);
      const result = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/quotation/uploadedImageforAssetCategory`,
        formdata1,
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
            token: user?.email
          },
        }
      );
      setFormData((prev) => ({
        ...prev,
        DEFAULT_ASSET_CATEGORY_IMAGE: result.data,
      }));
      toast({
        title: `Document Uploaded Successfully`,
        variant: "default",
      });
      setSelectedFiles((prev) => ({ ...prev, assetCategoryImage: null }));
      const fileInput = document.getElementById('assetCategoryFileInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      toast({
        title: `${error.response?.data.Message || "Upload failed"}`,
        variant: "destructive",
      });
      console.error("Error fetching data:", error);
    }
  };

  // Upload function for Asset SubCategory Image
  const uploadAssetSubCategoryImage = async () => {
    if (!selectedFiles.assetSubCategoryImage) {
      toast({
        title: "Select Image To Upload",
        variant: "destructive",
      });
      return;
    }

    try {
      const formdata1 = new FormData();
      formdata1.append("name", user?.name);
      formdata1.append("Image", selectedFiles.assetSubCategoryImage);
      const result = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/quotation/uploadedImageforAssetSubCategory`,
        formdata1,
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
            token: user?.email
          },
        }
      );
      setFormData((prev) => ({
        ...prev,
        DEFAULT_ASSET_SUBCATEGORY_IMAGE: result.data,
      }));
      toast({
        title: `Document Uploaded Successfully`,
        variant: "default",
      });
      setSelectedFiles((prev) => ({ ...prev, assetSubCategoryImage: null }));
      const fileInput = document.getElementById('assetSubCategoryFileInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      toast({
        title: `${error.response?.data.Message || "Upload failed"}`,
        variant: "destructive",
      });
      console.error("Error fetching data:", error);
    }
  };

  // Upload function for Asset Image
  const uploadAssetImage = async () => {
    if (!selectedFiles.assetImage) {
      toast({
        title: "Select Image To Upload",
        variant: "destructive",
      });
      return;
    }

    try {
      const formdata1 = new FormData();
      formdata1.append("name", user?.name);
      formdata1.append("Image", selectedFiles.assetImage);
      const result = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/quotation/uploadedImageforAsset`,
        formdata1,
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
            token: user?.email
          },
        }
      );
      setFormData((prev) => ({
        ...prev,
        DEFAULT_ASSET_IMAGE: result.data,
      }));
      toast({
        title: `Document Uploaded Successfully`,
        variant: "default",
      });
      setSelectedFiles((prev) => ({ ...prev, assetImage: null }));
      const fileInput = document.getElementById('assetFileInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      toast({
        title: `${error.response?.data.Message || "Upload failed"}`,
        variant: "destructive",
      });
      console.error("Error fetching data:", error);
    }
  };

  return (
    <main className="grid grid-cols-12 w-full gap-2">
      <div className="col-span-12 xl:col-span-5 md:col-span-12">
        <div className="justify-center p-1 shadow dark:bg-primary dark:bg-opacity-10 rounded-lg">
          <div className="rounded-t bg-white dark:bg-dark px-6 py-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex">
                <GrUserAdmin size={30} className="mt-2" title="Admin" />
                <MediumTitle text={"PDF LOGO UPLOAD"} />
              </div>
              <div className="flex justify-between gap-x-2">
                <Button variant={"print"} onClick={() => window.history.back()}>
                  Back
                </Button>
              </div>
            </div>
          </div>

          {/* Company Logo Upload */}
          <div className="grid grid-cols-12 gap-2 mt-2">
            <div className="lg:col-span-6 md:col-span-6 col-span-12">
              <label className="flex text-xs font-bold">
                Company Upload Document
              </label>
              <input
                id="companyFileInput"
                type="file"
                title="upload Document"
                name="uploadDoc"
                onChange={handleCompanyFileChange}
                className="flex h-9 w-full rounded-md dark:bg-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
              />
            </div>
            <div className="lg:col-span-3 md:col-span-6 col-span-12">
              <Button
                variant={"outline"}
                onClick={uploadCompanyLogo}
                className="text-xs mt-4 w-full"
              >
                Upload
              </Button>
            </div>
            {formData?.Comp_Logo && (
              <div className="lg:col-span-2 md:col-span-6 col-span-12 mt-6">
                <FileViewer
                  fileLink={`https://erp.autovyn.com/backend/fetch?filePath=${formData?.Comp_Logo}`}
                />
              </div>
            )}
          </div>

          {/* Maruti Logo Upload */}
          <div className="grid grid-cols-12 gap-2 mt-2">
            <div className="lg:col-span-6 md:col-span-6 col-span-12">
              <label className="flex text-xs font-bold">
                Maruti Upload Document
              </label>
              <input
                id="marutiFileInput"
                type="file"
                title="upload Document"
                name="uploadDoc"
                onChange={handleMarutiFileChange}
                className="flex h-9 w-full rounded-md dark:bg-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
              />
            </div>
            <div className="lg:col-span-3 md:col-span-6 col-span-12">
              <Button
                variant={"outline"}
                onClick={uploadMarutiLogo}
                className="text-xs mt-4 w-full"
              >
                Upload
              </Button>
            </div>
            {formData?.Maruti_Logo && (
              <div className="lg:col-span-2 md:col-span-6 col-span-12 mt-6">
                <FileViewer
                  fileLink={`https://erp.autovyn.com/backend/fetch?filePath=${formData?.Maruti_Logo}`}
                />
              </div>
            )}
          </div>

          {/* Asset Category Upload */}
          <div className="grid grid-cols-12 gap-2 mt-2">
            <div className="lg:col-span-6 md:col-span-6 col-span-12">
              <label className="flex text-xs font-bold">
                Asset Category Upload Document
              </label>
              <input
                id="assetCategoryFileInput"
                type="file"
                title="upload Document"
                name="uploadDoc"
                onChange={handleAssetCategoryFileChange}
                className="flex h-9 w-full rounded-md dark:bg-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
              />
            </div>
            <div className="lg:col-span-3 md:col-span-6 col-span-12">
              <Button
                variant={"outline"}
                onClick={uploadAssetCategoryImage}
                className="text-xs mt-4 w-full"
              >
                Upload
              </Button>
            </div>
            {formData?.DEFAULT_ASSET_CATEGORY_IMAGE && (
              <div className="lg:col-span-2 md:col-span-6 col-span-12 mt-6">
                <FileViewer
                  fileLink={`https://erp.autovyn.com/backend/fetch?filePath=${formData?.DEFAULT_ASSET_CATEGORY_IMAGE}`}
                />
              </div>
            )}
          </div>

          {/* Asset SubCategory Upload */}
          <div className="grid grid-cols-12 gap-2 mt-2">
            <div className="lg:col-span-6 md:col-span-6 col-span-12">
              <label className="flex text-xs font-bold">
                Asset SubCategory Upload Document
              </label>
              <input
                id="assetSubCategoryFileInput"
                type="file"
                title="upload Document"
                name="uploadDoc"
                onChange={handleAssetSubCategoryFileChange}
                className="flex h-9 w-full rounded-md dark:bg-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
              />
            </div>
            <div className="lg:col-span-3 md:col-span-6 col-span-12">
              <Button
                variant={"outline"}
                onClick={uploadAssetSubCategoryImage}
                className="text-xs mt-4 w-full"
              >
                Upload
              </Button>
            </div>
            {formData?.DEFAULT_ASSET_SUBCATEGORY_IMAGE && (
              <div className="lg:col-span-2 md:col-span-6 col-span-12 mt-6">
                <FileViewer
                  fileLink={`https://erp.autovyn.com/backend/fetch?filePath=${formData?.DEFAULT_ASSET_SUBCATEGORY_IMAGE}`}
                />
              </div>
            )}
          </div>

          {/* Asset Upload */}
          <div className="grid grid-cols-12 gap-2 mt-2">
            <div className="lg:col-span-6 md:col-span-6 col-span-12">
              <label className="flex text-xs font-bold">
                Asset Upload Document
              </label>
              <input
                id="assetFileInput"
                type="file"
                title="upload Document"
                name="uploadDoc"
                onChange={handleAssetFileChange}
                className="flex h-9 w-full rounded-md dark:bg-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
              />
            </div>
            <div className="lg:col-span-3 md:col-span-6 col-span-12">
              <Button
                variant={"outline"}
                onClick={uploadAssetImage}
                className="text-xs mt-4 w-full"
              >
                Upload
              </Button>
            </div>
            {formData?.DEFAULT_ASSET_IMAGE && (
              <div className="lg:col-span-2 md:col-span-6 col-span-12 mt-6">
                <FileViewer
                  fileLink={`https://erp.autovyn.com/backend/fetch?filePath=${formData?.DEFAULT_ASSET_IMAGE}`}
                />
              </div>
            )}
          </div>

          <div className="py-8"></div>
        </div>
      </div>
    </main>
  );
};

export default Page;