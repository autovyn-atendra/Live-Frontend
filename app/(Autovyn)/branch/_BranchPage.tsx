"use client";

import React, { useEffect, useState, useRef } from "react";
import SelectSearch from "@/components/atoms/Select";
import Ainput from "@/components/atoms/Input";
import AButton from "@/components/atoms/Buttton";
import { useCurrentUser } from "../../hooks/use-current-user";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { fetchBranch } from "@/action/branch";
import Swal from "sweetalert2";
import Image from "next/image";
import { useFormData } from "../branchconntext";
import { useToast } from "@/components/ui/use-toast";
import { AddUserActionHst } from "@/action/masters";
import axios from "axios";
import { useSecureStorage } from "@/app/hooks/comp-key-data";

const BranchCom = () => {
  const { setcompdata } = useSecureStorage()
  const router = useRouter();
  const { toast } = useToast();
  const { formData, setFormData } = useFormData();
  const [CompanyName, setCompanyName] = useState("");
  const [comp_Code, setComp_Code] = useState("");
  const user = useCurrentUser();

  // ── NEW: loading states ───────────────────────────────────────────────────
  const [isNavigating, setIsNavigating] = useState(false);
  const [isFetchingBranches, setIsFetchingBranches] = useState(true);
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!comp_Code) {
      fetchData();
    }
  }, [formData.companies]);

  const { data: session, update } = useSession();

  const [searchTerm, setSearchTerm] = useState("");
  const [branches, setBranches] = useState([]);
  const [filteredBranches, setfilteredBranches] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchTerm(value);
    const filteredBranches = branches?.filter((branch) =>
      `${branch.value} - ${branch.label}`.toLowerCase().includes(value?.toLowerCase())
    );
    setfilteredBranches(filteredBranches);
  };

  const inputRef = useRef(null);

  const handleSelectChange = async (name, value) => {
    const selectedCompany = formData.companies?.find(
      (company) => company.Comp_Code == value
    );
    if (formData.companies.length > 0) {
      setComp_Code(selectedCompany?.Comp_Code);
      setCompanyName(selectedCompany?.Comp_Name);
      setBranches(selectedCompany?.branch);
      setfilteredBranches(selectedCompany?.branch);
    }
  };

  useEffect(() => {
    handleSelectChange("comp", comp_Code);
  }, [comp_Code]);

  const fetchData = async () => {
    setIsFetchingBranches(true);
    try {
      const response = await fetchBranch(user);
      setFormData((prevData) => ({
        ...prevData,
        companies: response?.data,
      }));
      if (response?.data) setComp_Code(response.data[0]?.Comp_Code);
      if (response?.compKeyData) setcompdata(response.compKeyData[0]);
    } catch (error) {
      console.error("An error occurred while fetching branch data:", error);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Something went wrong! Please try again later.",
      });
    } finally {
      setIsFetchingBranches(false);
    }
  };

  const selectedRef = useRef(null);

  // ── UPDATED: handleBranchClick with loading state ─────────────────────────
  const handleBranchClick = async (branch) => {
    if (!branch || isNavigating) return;
    setIsNavigating(true);
    try {
      if (typeof user?.branch === "string") {
        await update({
          ...session,
          user: {
            ...session?.user,
            branch: branch.value,
            branchName: branch.label,
            multi: user.branch,
          },
        });
      } else {
        await update({
          ...session,
          user: {
            ...session?.user,
            branch: branch.value,
            branchName: branch.label,
          },
        });
      }

      const data = {
        USER_Code: user?.id,
        Action_Taken: "LOGIN SUCCESS",
        Loc_Code: user?.branch,
        Src_Portal: "1",
        Emp_Code: user?.EMPCODE,
      };
      await AddUserActionHst(data, user);

      if (user.shortcuts.login) {
        router.push(user.shortcuts.login);
      } else {
        router.push("/autovyn");
      }
    } catch (err) {
      console.log(err);
      setIsNavigating(false);
    }
  };
  // ─────────────────────────────────────────────────────────────────────────

  // ── UPDATED: handleMultiLogin with loading state ──────────────────────────
  const handleMultiLogin = async () => {
    if (isNavigating) return;
    setIsNavigating(true);
    try {
      const multi = user?.multi;
      if (typeof user.branch !== "string") {
        await update({
          ...session,
          user: {
            ...session?.user,
            branch: multi,
            multi: filteredBranches[0]?.value,
            branchName: filteredBranches[0]?.label,
          },
        });
      }

      const data = {
        USER_Code: user?.id,
        Action_Taken: "LOGIN SUCCESS",
        Loc_Code: user?.branch,
        Src_Portal: "1",
        Emp_Code: user?.EMPCODE,
      };
      await AddUserActionHst(data, user);

      if (user.shortcuts.login) {
        router.push(user.shortcuts.login);
      } else {
        router.push("/autovyn");
      }
    } catch (err) {
      console.log(err);
      setIsNavigating(false);
    }
  };
  // ─────────────────────────────────────────────────────────────────────────

  const handleEnter = () => {
    // ── Guard: do nothing if no branches or already navigating ──────────────
    if (!filteredBranches?.length || isNavigating) return;
    handleBranchClick(filteredBranches[selectedIndex]);
  };

  useEffect(() => {
    if (filteredBranches?.length > 0 && filteredBranches?.length != branches?.length) {
      setSelectedIndex(0);
    } else if (filteredBranches?.length > 0 && filteredBranches?.length == branches?.length) {
      const idx = filteredBranches?.findIndex(obj => obj.value == user?.branch);
      setSelectedIndex(idx !== -1 ? idx : 0);
    }
  }, [filteredBranches]);

  const handleKeyDown = (event) => {
    if (isNavigating) return; // block keyboard navigation while loading
    if (event.key === "ArrowDown") {
      setSelectedIndex((prevIndex) =>
        prevIndex < filteredBranches.length - 1 ? prevIndex + 1 : prevIndex
      );
    } else if (event.key === "ArrowUp") {
      setSelectedIndex((prevIndex) =>
        prevIndex > 0 ? prevIndex - 1 : prevIndex
      );
    } else if (event.key === "Enter" && selectedIndex >= 0) {
      handleBranchClick(filteredBranches[selectedIndex]);
    } else if (event.key === "/") {
      event.preventDefault();
      inputRef.current.focus();
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, filteredBranches, isNavigating]);

  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedIndex]);

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
    } catch (error) {
      setIsActive(false); setShowGIF("");
    }
  };

  // ── Derived: whether the Enter button should be disabled ─────────────────
  const noBranches = !isFetchingBranches && !filteredBranches?.length;
  const enterDisabled = isFetchingBranches || noBranches || isNavigating;
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="h-screen py-4 flex flex-col justify-center sm:py-12 bg-[#193A69] md:bg-[#F3F8FC] overflow-hidden">

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[#193A69] clip-diagonal"></div>
      </div>

      <div className="relative md:w-full max-w-[1263px] w-[330px] mx-auto bg-transparent shadow-[0_0_50px_0_rgba(0,0,0,0.3)] rounded-2xl overflow-hidden min-h-[610px] md:min-h-[710px] border border-white md:border-hidden">
        <div className="absolute inset-0 bg-tansparent overflow-hidden">
          <div className="relative z-10 h-full flex flex-col md:flex-row">

            {/* Left Side — static logo */}
            {!isActive && (
              <div className="w-full md:w-1/2 flex flex-col justify-center items-center py-4 md:py-8 px-4 md:p-12 text-center md:text-left">
                <div className="flex flex-col justify-center items-center">
                  <Image src="/logo.png" alt="Autovyn" width={136} height={136} className="mb-4 sm:mb-6 md:mb-6 w-24 sm:w-32 md:w-40 lg:w-44 h-auto" />
                  <div className="space-y-1 md:space-y-3 flex flex-col justify-center items-center">
                    <h1 className="text-2xl sm:text-3xl md:text-5xl font-serif font-bold text-[#F3F8FC] md:text-[#193A69] uppercase">AUTO-VYN</h1>
                    <p className="text-sm sm:text-lg md:text-2xl text-[#F3F8FC] md:text-[#193A69] font-bold mt-2">Automation Through Technologies</p>
                  </div>
                </div>
                <div className="md:h-1/4 h-0"></div>
              </div>
            )}

            {/* Left Side — festival GIF */}
            {isActive && (
              <div className="w-full md:w-1/2 flex flex-col justify-center items-center py-8 px-4 sm:px-8 md:p-12 text-center md:text-left">
                <div className="flex flex-col justify-center items-center border-8 border-header">
                  <Image src={`https://erp.autovyn.com/backend/fetch?filePath=${ShowGIF}`} alt="Autovyn" width={532} height={600}
                    className="w-auto h-[90px] sm:h-[220px] md:h-[320px] lg:h-[600px]" />
                </div>
                <div className="md:h-1/4 h-0"></div>
              </div>
            )}

            {/* Right Side — Branch Selection */}
            <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-1 md:p-12">
              <div className="md:ml-8 md:w-[390px] w-[300px]">
                <h1 className="text-sm md:text-2xl font-semibold uppercase text-left text-white mb-0 md:mb-2">
                  Welcome, {user?.name}
                </h1>
                <div className="md:mt-0 flex items-center">
                  <h2 className="text-base md:text-3xl font-semibold text-[#F3F8FC]">{CompanyName}</h2>
                </div>

                <div className="divide-y divide-gray-200">
                  <div className="md:py-4 py-2 pb-0 text-base leading-6 md:space-y-3 space-y-2 text-gray-700 sm:text-lg sm:leading-7">

                    {/* Company dropdown */}
                    <div className="w-full px-1 -space-y-1">
                      <label className="block uppercase text-sm sm:text-lg font-semibold text-[#F3F8FC]">Company Name</label>
                      <SelectSearch
                        name={"Comp_Code"}
                        title={""}
                        selectedValue={comp_Code?.toString()}
                        options={formData.companies?.map((company) => ({
                          label: company.Comp_Name,
                          value: company.Comp_Code,
                        }))}
                        handleInputChange={handleSelectChange}
                        className={"text-[#686262] text-base md:font-medium border-[#f3fafc] !bg-white mt-1"}
                      />
                    </div>

                    {/* Search */}
                    <div className="w-full px-1 space-y-3 rounded-md shadow-sm">
                      <div className="relative text-[#F3F8FC]">
                        <input
                          type="text"
                          name="branchSelection"
                          title="search Branch"
                          value={searchTerm}
                          ref={inputRef}
                          autoComplete="new-password"
                          className="flex text-black rounded h-9 w-full bg-white px-3 py-1 text-sm shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                          onInput={handleSearchChange}
                        />
                        <div className="absolute text-[#F3F8FC] inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="20" aria-hidden="true">
                            <path fill="none" stroke="#979A9C" opacity=".4" d="M3.5.5h12c1.7 0 3 1.3 3 13c0 1.7-1.3 3-3 3h-12c-1.7 0-3-1.3-3-3v-13c0-1.7 1.3-3 3-3z"></path>
                            <path fill="#979A9C" d="M11.8 6L8 15.1h-.9L10.8 6h1z"></path>
                          </svg>
                        </div>
                      </div>

                      {/* Branch List */}
                      <div className="w-full text-[#F3F8FC] bg-[#193A69] px-2 pt-2 md:h-64 h-48 overflow-y-scroll text-sm rounded border border-[#f3fafc] mt-2">

                        {/* Multi-location row */}
                        {filteredBranches?.length > 1 && (
                          <div
                            className={`hover:bg-primary hover:bg-opacity-50 text-[#F3F8FC] justify-between items-center gap-x-4 border-b border-body-color p-2 ${isNavigating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            onClick={handleMultiLogin}
                          >
                            <span className="font-semibold text-sm md:text-lg text-[#F3F8FC]">Multi Location</span>
                          </div>
                        )}

                        {/* Loading state while branch API is in flight */}
                        {isFetchingBranches && (
                          <div className="flex flex-col items-center justify-center h-full py-6 gap-2 text-[#F3F8FC]/60">
                            <svg
                              className="animate-spin h-6 w-6 text-[#F3F8FC]/60"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            <span className="text-xs font-medium">Loading branches...</span>
                          </div>
                        )}

                        {/* Empty state — only shown after fetch is done */}
                        {!isFetchingBranches && filteredBranches?.length === 0 && (
                          <div className="flex flex-col items-center justify-center h-full py-6 gap-2 text-[#F3F8FC]/50">
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24">
                              <path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                                d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                            </svg>
                            <span className="text-xs font-medium">No branches found</span>
                          </div>
                        )}

                        {/* Branch items */}
                        {filteredBranches?.map((branch, index) => (
                          <div
                            key={branch.value}
                            className={`justify-between items-center gap-x-4 border-b border-body-color p-2 ${isNavigating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${index === selectedIndex ? "bg-[#325583] text-white" : "hover:bg-primary hover:bg-opacity-50 text-[#F3F8FC]"}`}
                            onClick={() => {
                              if (isNavigating) return;
                              setSelectedIndex(index);
                              handleBranchClick(branch);
                            }}
                            onDoubleClick={() => { if (!isNavigating) handleBranchClick(branch); }}
                            ref={index === selectedIndex ? selectedRef : null}
                          >
                            <span className="font-semibold text-sm md:text-base">{branch.value}.</span>
                            <span className="font-semibold text-center capitalize text-sm md:text-base"> {branch.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ── ENTER button with loader + disabled state ── */}
                    <div className="relative text-center mt-6">
                      <button
                        className="w-full mt-1 text-white border border-[#F3F8FC] font-semibold md:font-bold py-1 px-2 rounded transition-colors duration-200 shadow flex items-center justify-center gap-2
                          disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100
                          enabled:hover:bg-gray-100 enabled:transform enabled:hover:scale-105"
                        type="button"
                        onClick={handleEnter}
                        disabled={enterDisabled}
                        title={noBranches ? "No branch available to select" : undefined}
                      >
                        {isNavigating ? (
                          <>
                            <svg
                              className="animate-spin h-4 w-4 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Entering...
                          </>
                        ) : noBranches ? (
                          "NO BRANCH AVAILABLE"
                        ) : (
                          "ENTER"
                        )}
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {!isActive && (
          <div className="w-full bottom-0 absolute text-center py-2">
            <p className="text-sm md:text-base font-semibold text-white opacity-80">ERP Version 2.0</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .clip-diagonal {
          clip-path: ${isActive
          ? "polygon(50% 0, 100% 0, 100% 100%, 50% 100%)"
          : "polygon(55% 0, 100% 0, 100% 100%, 45% 100%)"};
        }
      `}</style>

    </div>
  );
};

export default BranchCom;
