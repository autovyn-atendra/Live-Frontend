

"use client";
import { MouseEventHandler, useEffect, useState, useCallback, useRef } from "react";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import Ainput from "@/components/atoms/Input"; // Assuming this is the path
import Swal from "sweetalert2";
import axios from "axios";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { FaUsers } from "react-icons/fa";
import FileViewer from "@/components/atoms/FileviewerBank";
import { GrUserAdmin } from "react-icons/gr";
import MediumTitle from "@/components/atoms/MediumTitle";
import HashloaderComponent from "@/components/Templates/hashloader";

interface UploadedFile {
  Utd: number;
  DocType: string; // "MOBILE" or "WEB"
  RefId: number; // 1 for active, 0 for inactive
  Keywords: string; // Festival name
  OriginalName: string;
  SMBPath: string;
  UploadedBy: string;
  CreatedAt: string;
}

const Page = () => {
  const user = useCurrentUser();
  const [file, setFile] = useState<File | null>(null);
  const [festivalName, setFestivalName] = useState("");
  const [activeTab, setActiveTab] = useState<number>(1);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [otp, setOtp] = useState("");
  const [isLoadingOtp, setIsLoadingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [serverOtp, setServerOtp] = useState("");
  const [IsLoading, setIsLoading] = useState(false);

  // Send OTP on page load
  const otpCalled = useRef(false);
  const decodeOtp = (encoded) => {
    return atob(encoded); // Base64 decode
  };


  useEffect(() => {
    if (!otpCalled.current) {
      otpCalled.current = true;
      sendOtp();
    }
  }, []);

  const sendOtp = async () => {
    setIsLoadingOtp(true);
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_URL}/users/sendFestivalOtp`, {}, {
        headers: {
          compcode: user?.Comp_Code,
          name: user?.name,
          token: user?.email,
        },
      });
      if (response.data.success) {
        setOtpSent(true);
        setServerOtp(response.data.encodedOtp); // ✅ IMPORTANT

        toast({
          title: "OTP sent to your email",
          variant: "default",
        });
      }
      else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      toast({
        title: error.response?.data?.message || "Failed to send OTP",
        variant: "destructive",
      });
    } finally {
      setIsLoadingOtp(false);
    }
  };


  const verifyOtp = () => {
    if (!otp) {
      toast({
        title: "Please enter OTP",
        variant: "destructive",
      });
      return;
    }

    const decodedOtp = decodeOtp(serverOtp);
    if (otp === decodedOtp) {
      setIsOtpVerified(true);

      toast({
        title: "OTP verified successfully",
        variant: "default",
      });

      fetchUploadedFiles();
    } else {
      toast({
        title: "Invalid OTP",
        variant: "destructive",
      });
    }
  };

  // Fetch uploaded files on load
  useEffect(() => {
    fetchUploadedFiles();
  }, []);

  const fetchUploadedFiles = async () => {
    try {
      console.log("Fetching uploaded files...");  // Add
      const response = await axios.get(`${process.env.NEXT_PUBLIC_URL}/users/getUploadedFiles`, {
        headers: {
          compcode: user?.Comp_Code,
          name: user?.name,
          token: user?.email,
        },
      });
      console.log("Fetched files response:", response.data);  // Add
      setUploadedFiles(response.data.files || []);
    } catch (error) {
      console.error("Error fetching files:", error);  // Add
      toast({
        title: "Error fetching files",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const uploadFile = async (docType: "MOBILE" | "WEB" | "ERP") => {
    if (!file || !festivalName) {
      toast({
        title: "Select a file and enter festival name",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("Uploading file...");  // Add
      const formData = new FormData();
      formData.append("file", file);
      formData.append("festivalName", festivalName);
      formData.append("docType", docType);
      formData.append("uploadedBy", user?.name || "");
      setIsLoading(true)
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/users/uploadVideoImage`,
        formData,
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
            token: user?.email,
          },
        }
      );
      console.log("Upload response:", response.data);  // Add
      if (response.data.success) {
        toast({
          title: "File uploaded successfully",
          variant: "default",
        });
        setFile(null);
        setFestivalName("");
        fetchUploadedFiles();  // Refresh list
        setIsLoading(false)
      } else {
        throw new Error(response.data.message || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);  // Add
      toast({
        title: error.response?.data?.message || "Upload failed",
        variant: "destructive",
      });
      setIsLoading(false)
    }
    finally {
      setIsLoading(false)
    }
  };

  const toggleActive = async (utd: number, docType: string, currentRefId: number) => {
    try {
      setIsLoading(true)
      // Deactivate all others in the same DocType, then activate/deactivate this one
      await axios.post(`${process.env.NEXT_PUBLIC_URL}/users/toggleActive`, {  // Changed to PUT
        docType,
        newActiveUtd: currentRefId == 1 ? null : utd, // If active, deactivate; if inactive, activate (backend deactivates others)
      }, {
        headers: {
          compcode: user?.Comp_Code,
          name: user?.name,
          token: user?.email,
        },
      });
      setIsLoading(false)
      fetchUploadedFiles(); // Refresh to show updated active status
    } catch (error) {
      console.error("Error toggling active:", error);  // Add
      toast({
        title: "Error updating active status",
        variant: "destructive",
      });
      setIsLoading(false)
    } finally {
      setIsLoading(false)
    }
  };

  const deactivateAll = async (docType: string) => {
    try {
      setIsLoading(true)
      await axios.post(`${process.env.NEXT_PUBLIC_URL}/users/deactivateAll`, {
        docType,
      }, {
        headers: {
          compcode: user?.Comp_Code,
          name: user?.name,
          token: user?.email,
        },
      });

      toast({
        title: `All ${docType.toLowerCase()} items deactivated`,
        variant: "default",
      });
      setIsLoading(false)
      fetchUploadedFiles();
    } catch (error) {
      console.error("Error deactivating all:", error);
      toast({
        title: "Error deactivating items",
        variant: "destructive",
      });
      setIsLoading(false)
    } finally {
      setIsLoading(false)

    };
  };

  const mobileFiles = uploadedFiles.filter((f) => f.DocType == "MOBILE");
  const webFiles = uploadedFiles.filter((f) => f.DocType == "WEB");
  const erpFiles = uploadedFiles.filter((f) => f.DocType == "ERP");


  // Preloader/OTP Screen
  if (isLoadingOtp || !otpSent || !isOtpVerified) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          {isLoadingOtp ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4">Sending OTP...</p>
            </>
          ) : !otpSent ? (
            <p>Preparing OTP...</p>
          ) : (
            <>
              <p className="mb-4">Enter the OTP sent to your email</p>
              <Ainput
                title="OTP"
                type="text"
                name="otp"
                redlabel="*"
                handleInputChange={(name, value) => setOtp(value)}
                value={otp}
                placeholder="Enter OTP"
              />
              <Button variant={"save"} onClick={verifyOtp} disabled={!otpSent} className="mt-2">
                Verify OTP
              </Button>
            </>
          )}
        </div>
      </main>
    );
  }


  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleTabClick: MouseEventHandler<HTMLButtonElement> = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    // Extract the tab number from the dataset if available, otherwise default to  1
    const tabNumber = parseInt(event.currentTarget.dataset.tabNumber || "1");
    setActiveTab(tabNumber);
  };


  return (
    <main className="grid grid-cols-12 w-full gap-2">
      <div className="col-span-12 xl:col-span-6 md:col-span-12">
        <div className="justify-center p-1 shadow dark:bg-primary dark:bg-opacity-10 rounded-lg">
          <div className="rounded-t bg-white dark:bg-dark px-6 py-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex">
                <GrUserAdmin size={30} className="mt-2" title="Admin" />
                <MediumTitle text={"FESTIVAL MEDIA UPLOAD"} />
              </div>

              <div className="flex justify-between gap-x-2">
                <Button variant={"outline"} onClick={() => uploadFile("MOBILE")}>
                  Upload for Mobile
                </Button>

                <Button variant={"outline"} onClick={() => uploadFile("WEB")}>
                  Upload for Web
                </Button>
                <Button variant={"outline"} onClick={() => uploadFile("ERP")}>
                  Upload for Erp
                </Button>
                <Button variant={"print"} onClick={() => window.history.back()}>
                  Back
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-2 mt-2">
            <div className="col-span-12">
              <Ainput
                title="Festival Name"
                type="text"
                name="festivalName"
                redlabel="*" // Required indicator
                onInput={() => { }} // Placeholder
                handleInputChange={(name, value) => setFestivalName(value)}
                value={festivalName}
                placeholder="e.g., Diwali, Makar Sankranti"
              />
            </div>
            <div className="col-span-12">
              <label className="flex text-xs font-bold">Upload Video/Image</label>
              <input
                type="file"
                accept="video/*,image/*"
                onChange={handleFileChange}
                className="flex h-9 w-full rounded-md dark:bg-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
              />
            </div>
            {/* Preview Section */}
            {file && (
              <div className="col-span-12 mt-2">
                <label className="flex text-xs font-bold">Preview</label>
                <div className="border rounded p-2">
                  {file.type.startsWith('video/') ? (
                    <video controls className="w-full object-cover rounded">
                      <source src={URL.createObjectURL(file)} type={file.type} />
                      Your browser does not support the video tag.
                    </video>
                  ) : file.type.startsWith('image/') ? (
                    <img src={URL.createObjectURL(file)} alt="Preview" className="w-full  object-cover rounded" />
                  ) : (
                    <p className="text-xs">Unsupported file type for preview.</p>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* View Section */}

      <div className="col-span-12 xl:col-span-6 md:col-span-12">
        <div className="justify-center p-1 shadow dark:bg-primary dark:bg-opacity-10 rounded-lg">
          <div className="rounded-t bg-white dark:bg-dark px-6 py-2">
            <div className="flex items-center justify-between">
              <MediumTitle text={"VIEW & MANAGE"} />
              <div className="flex gap-2">
                {activeTab === 1 && <Button variant={"outline"} onClick={() => deactivateAll("MOBILE")} className="text-xs">
                  Deactivate All Mobile
                </Button>}
                {activeTab === 2 && <Button variant={"outline"} onClick={() => deactivateAll("WEB")} className="text-xs">
                  Deactivate All Web
                </Button>}
                {activeTab === 3 && <Button variant={"outline"} onClick={() => deactivateAll("ERP")} className="text-xs">
                  Deactivate All Erp
                </Button>}
              </div>
            </div>
          </div>
          {/* Mobile Section */}
          <div>
            <div className="w-full">
              <div className="my-3 rounded-lg  bg-[#193A69] dark:bg-black  dark:text-white border border-[#b5bfcb] dark:border-[#D0D5DD] p-1 px-3 space-x-4">
                <button
                  className={`px-2 py-1 text-base mt-1 mb-1 font-semibold capitalize rounded whitespace-nowrap transition duration-300 ease-in-out transform hover:-translate-y-0.2 shadow  hover:shadow-dark  ${activeTab === 1
                    ? "bg-white text-[#193A69]"
                    : "text-white dark:text-white"
                    }`}
                  data-tab-number="1"
                  onClick={handleTabClick}
                >
                  Mobile Uploads
                </button>
                <button
                  className={`px-2 py-1 text-base mt-1 mb-1 font-semibold capitalize rounded whitespace-nowrap transition duration-300 ease-in-out transform hover:-translate-y-0.2 shadow  hover:shadow-dark  ${activeTab === 2
                    ? "bg-white text-[#193A69]"
                    : "text-white dark:text-white"
                    }`}
                  data-tab-number="2"
                  onClick={handleTabClick}
                >
                  Web Uploads
                </button>
                <button
                  className={`px-2 py-1 text-base mt-1 mb-1 font-semibold capitalize rounded whitespace-nowrap transition duration-300 ease-in-out transform hover:-translate-y-0.2 shadow  hover:shadow-dark  ${activeTab === 3
                    ? "bg-white text-[#193A69]"
                    : "text-white dark:text-white"
                    }`}
                  data-tab-number="3"
                  onClick={handleTabClick}
                >
                  Erp Uploads
                </button>
              </div>
            </div>

          </div>

          <div className="flex-1 overflow-y-auto px-2">

            {activeTab === 1 &&
              <div className="mt-4">
                <h3 className="text-sm font-bold">Mobile Uploads</h3>
                {mobileFiles.map((item) => (
                  <div key={item.Utd} className="grid grid-cols-12 gap-2 mt-2 p-2 border rounded">
                    <div className="col-span-6">
                      <p className="text-xs">{item.Keywords}</p>
                      <FileViewer fileLink={`https://erp.autovyn.com/backend/fetch?filePath=${item.SMBPath}`} />
                    </div>
                    <div className="col-span-5 flex items-center">
                      <Button
                        variant={item.RefId == 1 ? "update" : "outline"}
                        onClick={() => toggleActive(item.Utd, item.DocType, item.RefId)}
                        className="text-xs"
                      >
                        {item.RefId == 1 ? "Active" : "Inactive"}
                      </Button>
                    </div>
                    <div className="col-span-1">
                      <p className="text-xs">{formatDate(item.CreatedAt)}</p>
                    </div>
                  </div>
                ))}
              </div>}

            {/* Web Section */}
            {activeTab === 2 &&
              <div className="mt-4">
                <h3 className="text-sm font-bold">Web Uploads</h3>
                {webFiles.map((item) => (
                  <div key={item.Utd} className="grid grid-cols-12 gap-2 mt-2 p-2 border rounded">
                    <div className="col-span-6">
                      <p className="text-xs">{item.Keywords}</p>
                      <FileViewer fileLink={`https://erp.autovyn.com/backend/fetch?filePath=${item.SMBPath}`} />
                    </div>
                    <div className="col-span-5 flex items-center">
                      <Button
                        variant={item.RefId == 1 ? "update" : "outline"}
                        onClick={() => toggleActive(item.Utd, item.DocType, item.RefId)}
                        className="text-xs"
                      >
                        {item.RefId == 1 ? "Active" : "Inactive"}
                      </Button>
                    </div>
                    <div className="col-span-1">
                      <p className="text-xs">{formatDate(item.CreatedAt)}</p>
                    </div>
                  </div>
                ))}
              </div>}

            {/* Erp Section */}
            {activeTab === 3 &&
              <div className="mt-4">
                <h3 className="text-sm font-bold">Erp Uploads</h3>
                {erpFiles.map((item) => (
                  <div key={item.Utd} className="grid grid-cols-12 gap-2 mt-2 p-2 border rounded">
                    <div className="col-span-6">
                      <p className="text-xs">{item.Keywords}</p>
                      <FileViewer fileLink={`https://erp.autovyn.com/backend/fetch?filePath=${item.SMBPath}`} />
                    </div>
                    <div className="col-span-5 flex items-center">
                      <Button
                        variant={item.RefId == 1 ? "update" : "outline"}
                        onClick={() => toggleActive(item.Utd, item.DocType, item.RefId)}
                        className="text-xs"
                      >
                        {item.RefId == 1 ? "Active" : "Inactive"}
                      </Button>
                    </div>
                    <div className="col-span-1">
                      <p className="text-xs">{formatDate(item.CreatedAt)}</p>
                    </div>
                  </div>
                ))}
              </div>}


          </div>
        </div>
      </div>
      <HashloaderComponent isLoading={IsLoading} />
    </main>
  );
};

export default Page;
