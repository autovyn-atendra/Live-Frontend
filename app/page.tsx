"use client";
import React, { use, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { loginAction } from "../action/loginAction";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { useDebounce } from "use-debounce";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog2";
import Swal from "sweetalert2";

export default function Index() {

  function showSideAlert(message: any, type: any) {
    const Toast = Swal.mixin({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      customClass: {
        container: "side-alert-container",
        popup: `side-alert-${type}`,
        title: "side-alert-title",
        icon: "side-alert-icon",
      },
    });

    Toast.fire({
      icon: type,
      title: message,
    });
  }

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [compCode, setCompCode] = useState("");
  const [debouncedCompCode] = useDebounce(compCode, 500);
  const [isModalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('')
  const [releaseNotes, setReleaseNotes] = useState({
    web: [],
    mobile: [],
  });
  const toggleModal = () => setModalOpen(!isModalOpen);
  const [activeTab, setActiveTab] = useState("web");
  const { toast } = useToast();

  // ── NEW: loading + error states ──────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [errormsg, setErrorMsg] = useState<string | null>(null);

  // Auto-clear the error message after 4 seconds whenever it is set
  useEffect(() => {
    if (!errormsg) return;
    const timer = setTimeout(() => setErrorMsg(null), 4000);
    return () => clearTimeout(timer);
  }, [errormsg]);
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    localStorage.removeItem("activeFirstLevel");
    localStorage.removeItem("activeFirstSecond");
    localStorage.removeItem("activeFirstThird");
    localStorage.removeItem("submodule");
    localStorage.removeItem("submenu");
    localStorage.removeItem('dateRange')
    localStorage.removeItem('secure_user_data')
    localStorage.removeItem('logout')
  }, []);

  React.useEffect(() => {
    if (debouncedCompCode.length >= 4) {
      fetchYear(debouncedCompCode);
    }
  }, [debouncedCompCode]);

  const {
    handleSubmit,
    register,
    reset,
    setValue,
    formState: { errors },
  } = useForm();

  const [yeardata, setYearData] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");

  // ── UPDATED: onSubmit wraps the call with loading state ──────────────────
  const onSubmit = async (data) => {
    setIsLoading(true);
    setErrorMsg(null); // clear any previous error before a new attempt

    const { username, password, comp_code } = data;
    localStorage.setItem("username", username);

    try {
      if (username === 'autovyndevelopement' && password === 'autovyndevelopement') {
        await handleVersion(comp_code);
      } else {
        const res = await loginAction(data);
        if (res?.error) {
          setErrorMsg(res.error);
        }
      }
    } catch (err) {
      setErrorMsg("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const storedCompCode = localStorage.getItem("compCode");
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setValue("username", storedUsername); // Set the username in the form
    }
    if (storedCompCode) {
      setCompCode(storedCompCode);
      setValue("comp_code", storedCompCode);
    }
  }, []);

  const handleVersion = async (comp_code) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/users/dbauthenticate`,
        {},
        {
          headers: {
            compcode: comp_code,
          },
        }
      );
      if (response.status == 200) {
        toast({
          title: "Db Authentication Successfull",
          variant: "default",
        });
      }
    } catch (err) {
      toast({
        title: "Error In Db Authentication",
        variant: "destructive",
      });

      console.log(err);
    }
  };

  const handleComp_Code = (e) => setCompCode(e.target.value);

  const fetchYear = async (year) => {
    setYearData([]);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/users/getyear`,
        year,
        {
          headers: {
            compcode: year,
          },
        }
      );
      if (response.status == 200) {
        const yeararray = [];
        response.data?.year?.forEach(function (item) {
          let yeardata: any = {};
          yeardata.value = item.year;
          yeardata.label = "FINANCIAL YEAR 20" + item.year + " - " + (parseInt(item.year) + 1);
          yeararray.push(yeardata);
        });
        setYearData(yeararray);
        setValue("year", yeararray[0].value);
        localStorage.setItem('compCode', year);
      }
    } catch (err) {
      setYearData([]);
      console.log(err);
    }
  };

  const handleYearChange = (e) => {
    setSelectedYear(e.target.value);
    setValue("year", e.target.value); // Update the form value
  };

  useEffect(() => {
    findall();
  }, [isModalOpen]);

  const findall = async () => {
    try {
      const result = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/users/findreleaseforlogin`,
        {},
        {
          headers: {
            compcode: 'some',
          },
        }
      );
      console.log(result, "findreleaseforlogin")
      setReleaseNotes({
        web: result.data.web, // Assuming response contains 'web' and 'mobile' arrays
        mobile: result.data.mobile,
      });
    } catch (err) {
      console.log(err)
    }
  };

  const filterNotes = (platform) => {
    return releaseNotes[platform].filter(note => {
      const searchQuery = searchTerm.toLowerCase();
      return (
        note.module_name?.toLowerCase().includes(searchQuery) ||
        note.description?.toLowerCase().includes(searchQuery) ||
        note.solution?.toLowerCase().includes(searchQuery) ||
        note.benefit?.toLowerCase().includes(searchQuery) ||
        note.release_date?.toLowerCase().includes(searchQuery)
      );
    });
  };

  const ModelOpenImage = () => setIsModalVisible(true);
  const handleModalOk = () => setIsModalVisible(false);

  const [selectedNote, setSelectedNote] = useState(null);
  const [ShowGIF, setShowGIF] = useState("");
  const [isActive, setIsActive] = useState(false);

  useEffect(() => { ShowFestivalGIF(); }, []);

  const ShowFestivalGIF = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_URL}/users/getLoginFiles`,
        { params: { DocType: "WEB" }, headers: { compcode: "DBCON" } }
      );
      const file = response?.data?.files?.[0];
      if (file?.RefId == "1") { setShowGIF(file?.SMBPath); setIsActive(true); }
      else { setIsActive(false); setShowGIF(""); }
    } catch (error) { setIsActive(false); setShowGIF(""); }
  };

  return (
    <div className="h-screen py-4 flex flex-col justify-center sm:py-12 bg-[#193A69] md:bg-[#F3F8FC] overflow-hidden">

      {isModalOpen && <div className="fixed inset-0 bg-[#000000]/30 z-40"></div>}

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[#193A69] clip-diagonal"></div>
      </div>

      <div className="relative md:w-full max-w-[1263px] w-[325px] mx-auto bg-tansparent shadow-[0_0_50px_0_rgba(0,0,0,0.3)] rounded-2xl overflow-hidden min-h-[650px] md:min-h-[700px] border border-white md:border-hidden">
        <div className="absolute inset-0 bg-tansparent overflow-hidden">
          <div className="relative z-10 h-full flex flex-col md:flex-row">

            {/* Left Side */}
            {!isActive && (
              <div className="w-full md:w-1/2 flex flex-col justify-center items-center py-8 px-4 sm:px-8 md:p-12 text-center md:text-left">
                <div className="flex flex-col justify-center items-center">
                  <Image src="/logo.png" alt="Autovyn" width={136} height={136} className="mb-4 sm:mb-8" />
                  <div className="space-y-2 md:space-y-3 flex flex-col justify-center items-center">
                    <h1 className="text-2xl sm:text-3xl md:text-5xl font-serif font-bold text-[#F3F8FC] md:text-[#193A69] uppercase">AUTO-VYN</h1>
                    <p className="text-sm sm:text-lg md:text-2xl text-[#F3F8FC] md:text-[#193A69] font-bold mt-2">Automation Through Technologies</p>
                  </div>
                </div>
                <div className="md:h-1/4 h-0"></div>
              </div>
            )}

            {isActive && (
              <div className="w-full md:w-1/2 flex flex-col justify-center items-center py-8 px-4 sm:px-8 md:p-12 text-center md:text-left">
                <div className="flex flex-col justify-center items-center border-8 border-header">
                  <Image
                    src={`https://erp.autovyn.com/backend/fetch?filePath=${ShowGIF}`}
                    alt="Autovyn" width={532} height={600}
                    className="w-auto h-[150px] sm:h-[220px] md:h-[320px] lg:h-[600px]"
                  />
                </div>
                <div className="md:h-1/4 h-0"></div>
              </div>
            )}

            {/* Right Side - Login Form */}
            <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-1 md:p-12">
              <form autoComplete="off" onSubmit={handleSubmit(onSubmit)} className="sm:max-w-sm md:max-w-md mx-auto max-w-[95%]">

                <div className="flex items-center">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold uppercase text-center md:text-left text-white mb-0 md:mb-4">
                    Welcome To Auto-vyn
                  </h1>
                </div>

                <div className="divide-y divide-gray-200">
                  <div className="md:py-8 py-4 pb-0 text-base leading-6 space-y-1 md:space-y-4 text-gray-700 sm:text-lg sm:leading-7">

                    {/* Company Code */}
                    <div className="w-full px-1">
                      <fieldset>
                        <label className="block uppercase text-sm sm:text-lg font-semibold mb-1 text-[#F3F8FC]" htmlFor="comp_code">
                          Company Code
                        </label>
                        <Input
                          type="text"
                          className="border-0 px-1.5 py-1.5 text-[#686262] dark:bg-white bg rounded text-base font-semibold shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                          {...register("comp_code", { required: true })}
                          onChange={handleComp_Code}
                        />
                        {errors.comp_code?.type == "required" && (
                          <p className="text-xs uppercase font-bold mb-1 text-exit">Company Code Required</p>
                        )}
                      </fieldset>
                    </div>

                    {/* Financial Year */}
                    <div className="relative w-full px-1">
                      <label className="block uppercase text-sm sm:text-lg font-semibold mb-1 text-[#F3F8FC]" htmlFor="name">
                        Select Financial Year
                      </label>
                      <select
                        className="border-0 py-2 pl-1 text-[#686262] dark:bg-white rounded text-base font-semibold shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                        {...register("year", { required: true })}
                        value={selectedYear}
                        onChange={handleYearChange}
                      >
                        {yeardata.map((item: any, index) => (
                          <option key={index} value={item.value}>{item.label}</option>
                        ))}
                      </select>
                      {errors.year?.type == "required" && (
                        <p className="text-xs uppercase font-bold mb-1 text-exit">Select Financial Year</p>
                      )}
                    </div>

                    {/* Username */}
                    <div className="w-full px-1">
                      <fieldset>
                        <label className="block uppercase text-sm sm:text-lg font-semibold mb-1 text-[#F3F8FC]" htmlFor="Username">
                          UserName
                        </label>
                        <Input
                          type="text"
                          className="border-0 px-1.5 py-1.5 text-[#686262] dark:bg-white rounded text-base font-semibold shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                          {...register("username", { required: true })}
                        />
                        {errors.username?.type == "required" && (
                          <p className="text-xs uppercase font-bold mb-1 text-exit">UserName Required</p>
                        )}
                      </fieldset>
                    </div>

                    {/* Password */}
                    <div className="w-full px-1">
                      <fieldset>
                        <label className="block uppercase text-sm sm:text-lg font-semibold mb-1 text-[#F3F8FC]" htmlFor="Password">
                          Password
                        </label>
                        <Input
                          className="border-0 px-1.5 py-1.5 text-[#686262] dark:bg-white rounded text-base font-semibold shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                          type="password"
                          {...register("password", { required: true })}
                        />
                        {errors.password?.type == "required" && (
                          <p className="text-xs uppercase font-bold mb-1 text-exit">Password Required</p>
                        )}
                      </fieldset>
                    </div>

                    {/* ── Error Message with fade-in/out animation ── */}
                    {errormsg && (
                      <div className="login-error-msg text-sm uppercase text-center font-bold px-3 py-2 rounded-md border border-red text-exit">
                        {errormsg}
                      </div>
                    )}

                    {/* ── Login Button with Loader ── */}
                    <div className="relative text-center">
                      <fieldset>
                        <button
                          className="w-full mt-4 text-white hover:bg-white/10 border border-[#F3F8FC] font-bold py-1 px-2 rounded transition-colors duration-200 transform hover:scale-105 shadow disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2"
                          type="submit"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              {/* Spinner SVG */}
                              <svg
                                className="animate-spin h-4 w-4 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12" cy="12" r="10"
                                  stroke="currentColor" strokeWidth="4"
                                />
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                />
                              </svg>
                              Signing In...
                            </>
                          ) : (
                            "LOGIN"
                          )}
                        </button>
                      </fieldset>
                    </div>

                    <div className="mt-4 text-center">
                      <button type="button" onClick={toggleModal} className="text-white underline">
                        Release Notes
                      </button>
                    </div>
                  </div>
                </div>

              </form>
            </div>
          </div>
        </div>

        {!isActive && (
          <div className="w-full bottom-0 absolute text-center py-2">
            <p className="text-sm md:text-base font-semibold text-white opacity-80">ERP Version 2.0</p>
          </div>
        )}
      </div>

      {/* Release Notes Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center items-center z-50">
          <div className="bg-[#193A69] dark:bg-bg-[#193A69] rounded-lg shadow w-full max-w-screen-2xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-center text-[#F3F8FC]">Release Notes</h2>
            <div className="flex justify-center space-x-4 mb-6 border-b border-b-[#959CB1] pb-2">
              <button className={`px-4 py-2 ${activeTab === 'web' ? 'text-[#F3F8FC] border-b-2 border-primary font-bold' : 'text-body-color'}`} onClick={() => setActiveTab('web')}>Web</button>
              <button className={`px-4 py-2 ${activeTab === 'mobile' ? 'text-[#F3F8FC] border-b-2 border-primary font-bold' : 'text-body-color'}`} onClick={() => setActiveTab('mobile')}>Mobile</button>
            </div>
            <div className="mb-4 flex justify-end">
              <input type="text" placeholder="Search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="border rounded-lg p-2 w-56 max-w-xs bg-[#325583] border-[#F3F8FC] text-[#F3F8FC]" />
            </div>
            <div className="overflow-scroll h-[405px]">
              <table className="min-w-full table-auto text-left">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 w-1/6 text-[#F3F8FC]">Module Name</th>
                    <th className="px-4 py-2 w-1/6 text-[#F3F8FC]">Date</th>
                    <th className="px-4 py-2 w-1/6 text-[#F3F8FC]">Problem</th>
                    <th className="px-4 py-2 w-1/6 text-[#F3F8FC]">Solution</th>
                    <th className="px-4 py-2 w-1/6 text-[#F3F8FC]">Benefit</th>
                  </tr>
                </thead>
                <tbody>
                  {filterNotes(activeTab).map((note: any, index) => (
                    <tr key={index} className="border-t border-t-[#959CB1] hover:cursor-pointer" onClick={() => {
                      if (note.images && note.images.length > 0) { setSelectedNote(note); ModelOpenImage(); }
                      else { showSideAlert("No images found for this release note.", "info"); }
                    }}>
                      <td className="px-4 py-2 font-semibold text-[#F3F8FC]">{note.module_name}</td>
                      <td className="px-4 py-2 text-[#F3F8FC]">
                        {note.release_date ? (() => {
                          const dateObj = new Date(note.release_date);
                          if (isNaN(dateObj.getTime())) return "";
                          return `${dateObj.getDate()} ${dateObj.toLocaleString("default", { month: "long" })} ${dateObj.getFullYear()}`;
                        })() : ""}
                      </td>
                      <td className="px-4 py-2 text-[#F3F8FC]">{note.description}</td>
                      <td className="px-4 py-2 text-[#F3F8FC]">{note.solution}</td>
                      <td className="px-4 py-2 text-[#F3F8FC]">{note.benefit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-center mt-6">
              <button onClick={toggleModal} className="bg-exit text-white px-4 py-2 rounded-lg">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Images Dialog */}
      <Dialog open={isModalVisible} onOpenChange={handleModalOk}>
        <DialogContent className="w-full max-w-screen-2xl lg:h-[640px] md:h-[700px] z-50">
          <DialogHeader>
            <DialogTitle className="mt-2 ml-3 flex"><div>Release Images</div></DialogTitle>
            <hr className="bg-body-color mx-2" />
            <DialogDescription>
              <div className="p-2" style={{ maxHeight: "600px", overflowY: "scroll" }}>
                {selectedNote?.images?.length > 0 ? (
                  <div className="grid grid-cols-12 pt-4 gap-x-5 gap-y-6">
                    {selectedNote.images.map((img: any, index: any) => (
                      <div key={index} className="col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-3 xl:col-span-4">
                        <div className="dark:bg-primary dark:bg-opacity-10 bg-white rounded-lg shadow flex">
                          <label className="flex w-full h-32 sm:h-40 md:h-44 lg:h-56 xl:h-60 items-center justify-center rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
                            <Image width={80} height={80} src={`https://erp.autovyn.com/backend/fetch?filePath=${img}`} alt={`Uploaded ${index + 1}`} className="w-full h-full object-contain rounded-lg" />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-sm text-gray-500 pt-6">No images found.</p>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <style jsx>{`
        .clip-diagonal {
          clip-path: ${isActive
          ? "polygon(50% 0, 100% 0, 100% 100%, 50% 100%)"
          : "polygon(55% 0, 100% 0, 100% 100%, 45% 100%)"};
        }
        .login-error-msg {
          animation: slideIn 0.25s ease-out;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}