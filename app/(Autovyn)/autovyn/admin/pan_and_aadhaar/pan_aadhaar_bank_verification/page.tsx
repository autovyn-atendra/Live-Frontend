"use client"; // ← ADD THIS AT THE VERY TOP

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import Einput from "@/components/atoms/Einput";
import { Button } from "@/components/ui/button";
import HashloaderComponent from "@/components/Templates/hashloader";
import Image from "next/image";
import Swal from "sweetalert2";
import { AiOutlineQuestionCircle } from "react-icons/ai";

// Assuming you have a form data hook - if not, you'll need to create it
// Let me create a simple version for now
const useFormData = () => {
  const [formData, setFormData] = useState({
    EmpMst: {
      PANNO: "",
      EMPFIRSTNAME: "",
      DOB: "",
      UID_NO: "",
      MOBILENO: "",
      OTP_With_Aadhaar: "",
      PAN_CARD_VER: false,
      PAN_NAME_MATCH_VER: false,
      AADHAAR_LINKED_VER: false,
      AADHAR_CARD_VER: false,
      photo: null,
      full_addressAadhaar: "",
      PERMANENTADDRESS1: "",
      profile: null,
      BANKACCOUNTNO: "",
      Cnf_BANKACCOUNTNO: "",
      ifsc_code: "",
      account_verified: false,
      BANKNAME: "",
      ACCOUNT_TYPE: "",
      BRANCH: "",
      PAYMENTMODE: "",
      Emp_Ac_Name: ""
    }
  });

  return { formData, setFormData };
};

function showSideAlert(message, type) {
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

const PageSimpleVerification = () => {
  // State variables
  const [panInfo, setPanInfo] = useState(null);
  const [aadhaarInfo, setAadhaarInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [reference_id, setreference_id] = useState(null);
  const [disabledOtp, setdisabledOtp] = useState(true);
  const { toast } = useToast();
  const [showPanTooltip, setShowPanTooltip] = useState(false);
  const [showAadhaarTooltip, setShowAadhaarTooltip] = useState(false);
  const [showAccountTooltip, setShowAccountTooltip] = useState(false);

  const { formData, setFormData } = useFormData();
  const user = useCurrentUser();
  // Add these state variables at the top with other states
  const [IsVerifyAccountApi, setIsVerifyAccountApi] = useState(false);

  const [AccountData, setAccountData] = useState(null);
  const [IsVerifyIFSCApi, setIsVerifyIFSCApi] = useState(false);
  const [showIFSCTooltip, setShowIFSCTooltip] = useState(false);
  const [IFSCData, setIFSCData] = useState(null);

  // Validation functions
  const validatePAN = (value: string) => {
    const regex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return regex.test(value);
  };

  // Handle input changes for essential fields only
  const handleInputChange = (name: string, value: string) => {
    if (name === "MOBILENO") {
      value = value.replace(/\D/g, "");
      if (value.length > 10) return;
    }

    if (name == "PANNO") {
      value = value.toUpperCase();
      if (value.length > 10) return;
    }

    if (name == "UID_NO") {
      if (!/^\d{0,12}$/.test(value)) return;
      value = value.replace(/\D/g, "");
    }

    if (name === "BANKACCOUNTNO" || name === "Cnf_BANKACCOUNTNO") {
      value = value.replace(/\D/g, ""); // Remove non-digits
    }


    setFormData((prevData) => ({
      ...prevData,
      EmpMst: {
        ...prevData.EmpMst,
        [name]: value,
      },
    }));
  };

  const VerifyAccountNo = async (option) => {
    // Account verification (option 13)
    if (option === 13) {
      if (!formData?.EmpMst?.ifsc_code) {
        showSideAlert("Please Enter IFSC Code", "warning");
        return;
      }
      if (!formData?.EmpMst?.BANKACCOUNTNO) {
        showSideAlert("Please Fill Bank Account No.", "warning");
        return;
      }

      try {
        setIsVerifyAccountApi(true);
        const result = await axios.post(
          `${process.env.NEXT_PUBLIC_URL}/panandadharapi/validate`,
          {
            option: option,
            Ifsc: formData?.EmpMst?.ifsc_code,
            account_number: formData?.EmpMst?.BANKACCOUNTNO,
          },
          {
            headers: { compcode: user?.Comp_Code },
          }
        );

        console.log("Account Verification Response:", result?.data?.data);

        if (result?.status === 200) {
          const message = result?.data?.data?.message;
          if (message === "Bank Account details verified successfully.") {
            setAccountData(result?.data?.data);
            setFormData(prev => ({
              ...prev,
              EmpMst: { ...prev.EmpMst, account_verified: true }
            }));
            showSideAlert("Account verified successfully", "success");
          } else {
            showSideAlert(message || "Verification failed", "warning");
          }
        }
      } catch (error) {
        console.error("Error", error);
        showSideAlert("Account verification failed", "error");
      } finally {
        setIsVerifyAccountApi(false);
      }
    }


    if (option === 12) {
      console.log("Starting IFSC verification...");
      console.log("IFSC Code from form:", formData?.EmpMst?.ifsc_code);

      if (!formData?.EmpMst?.ifsc_code) {
        showSideAlert("Please Enter IFSC Code", "warning");
        return;
      }

      try {
        setIsVerifyIFSCApi(true);
        console.log("Making API call for IFSC verification...");

        const result = await axios.post(
          `${process.env.NEXT_PUBLIC_URL}/panandadharapi/validate`,
          {
            option: option,
            Ifsc: formData?.EmpMst?.ifsc_code,
          },
          {
            headers: { compcode: user?.Comp_Code },
          }
        );

        console.log("Full API Response:", result);
        console.log("Response status:", result?.status);
        console.log("Response data:", result?.data);

        // FIX: The data is in result.data, not result.data.data
        console.log("IFSC Verification Response Data (fixed):", result?.data);

        if (result?.status === 200) {
          // FIX: Set IFSCData to result.data instead of result.data.data
          setIFSCData(result?.data);
          console.log("IFSC Data set to state:", result?.data);
          showSideAlert("IFSC verified successfully", "success");
        } else {
          console.log("Unexpected status:", result?.status);
          showSideAlert("IFSC verification failed", "error");
        }
      } catch (error) {
        console.error("Error in IFSC verification:", error);
        console.error("Error response:", error.response);
        showSideAlert("IFSC verification failed", "error");
      } finally {
        setIsVerifyIFSCApi(false);
      }
    }
  };



  // Simplified PAN verification for Digilocker_Linked=0
  const verifiyPan = async () => {
    const panNo = formData?.EmpMst?.PANNO;

    if (!panNo) {
      toast({ title: "Please Enter Pan Number", variant: "destructive" });
      return;
    }

    const panTrimmed = panNo.toString().trim().toUpperCase();
    const isValidPAN = /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panTrimmed);

    if (!isValidPAN) {
      toast({ title: "Invalid PAN Format: ABCDE1234F", variant: "destructive" });
      return;
    }

    // if (!formData.EmpMst?.EMPFIRSTNAME) {
    //   toast({ title: "Please Enter First Name", variant: "destructive" });
    //   return;
    // }

    // if (!formData.EmpMst?.DOB) {
    //   toast({ title: "Please Enter Date Of Birth", variant: "destructive" });
    //   return;
    // }

    try {
      setIsLoading(true);
      const result = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/panAndAdharApi/validate`,
        {
          value: formData.EmpMst?.PANNO,
          name_as_per_pan: formData.EmpMst?.EMPFIRSTNAME,
          date_of_birth: formData.EmpMst?.DOB,
          option: "10",
        },
        {
          headers: { compcode: user?.Comp_Code, name: user?.name },
        }
      );

      const res = result?.data?.data;
      setPanInfo(res);

      if (res?.status == "valid") {
        setFormData((prev) => ({
          ...prev,
          EmpMst: {
            ...prev.EmpMst,
            PAN_CARD_VER: true,
            PAN_NAME_MATCH_VER: res.name_as_per_pan_match,
            AADHAAR_LINKED_VER: res.aadhaar_seeding_status === "y",
          },
        }));
        toast({ title: "PAN Card Verified successfully", variant: "default" });
      } else {
        setFormData((prev) => ({
          ...prev,
          EmpMst: {
            ...prev.EmpMst,
            PAN_CARD_VER: false,
            PAN_NAME_MATCH_VER: false,
            AADHAAR_LINKED_VER: false,
          },
        }));
        toast({ title: "Invalid PAN Card Number", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error", error);
      toast({ title: "Verification failed", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // Update the Aadhaar verification function
  const verifiyAadhaar = async () => {
    if (!formData.EmpMst?.UID_NO) {
      toast({ title: "Please enter Aadhaar number", variant: "destructive" });
      return;
    }

    if (!/^\d{12}$/.test(formData.EmpMst?.UID_NO)) {
      toast({ title: "Aadhaar must be 12 digits", variant: "destructive" });
      return;
    }

    try {
      setIsLoading(true);
      const result = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/panAndAdharApi/validate`,
        {
          value: formData.EmpMst?.UID_NO,
          option: "8",
        },
        {
          headers: { compcode: user?.Comp_Code, name: user?.name },
        }
      );

      const responseData = result?.data?.data;
      console.log("Aadhaar OTP Response:", responseData); // Debug log

      setAadhaarInfo(responseData);

      if (responseData?.reference_id) {
        // OTP sent successfully
        toast({ title: "OTP sent successfully", variant: "default" });
        setreference_id(responseData.reference_id?.toString());
        setdisabledOtp(false);
      } else if (responseData?.photo || responseData?.full_address) {
        // Direct verification (without OTP)
        toast({ title: "Aadhaar Verified", variant: "default" });

        // Update form data with Aadhaar details
        setFormData((prev) => ({
          ...prev,
          EmpMst: {
            ...prev.EmpMst,
            AADHAR_CARD_VER: true,
            photo: formData.EmpMst.profile == null ? responseData.photo : prev.EmpMst.photo,
            full_addressAadhaar: responseData.full_address,
            PERMANENTADDRESS1: responseData.full_address,
            // Auto-fill name and DOB if fields are empty
            EMPFIRSTNAME: responseData.name || prev.EmpMst.EMPFIRSTNAME,
            DOB: responseData.date_of_birth || prev.EmpMst.DOB,
          },
        }));
      } else {
        toast({
          title: responseData?.message || "Invalid Aadhaar",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error in Aadhaar verification:", error);
      toast({ title: "Verification failed", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // Update the OTP verification function
  const OTPVerififyed = async () => {
    if (!reference_id || !formData.EmpMst?.OTP_With_Aadhaar) return;

    try {
      setIsLoading(true);
      const result = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/panAndAdharApi/validate`,
        {
          value: formData.EmpMst?.UID_NO,
          ref_id: reference_id,
          otp: formData.EmpMst?.OTP_With_Aadhaar,
          option: "9",
        },
        {
          headers: { compcode: user?.Comp_Code, name: user?.name },
        }
      );

      const responseData = result?.data?.data;
      console.log("Aadhaar OTP Verification Response:", responseData); // Debug log

      // Update AadhaarInfo with all the details
      setAadhaarInfo(responseData);

      if (responseData?.status?.toLowerCase() === "valid") {
        setFormData((prev) => ({
          ...prev,
          EmpMst: {
            ...prev.EmpMst,
            AADHAR_CARD_VER: true,
            photo: responseData.photo || prev.EmpMst.photo,
            full_addressAadhaar: responseData.full_address || prev.EmpMst.full_addressAadhaar,
            PERMANENTADDRESS1: responseData.full_address || prev.EmpMst.PERMANENTADDRESS1,
            // Auto-fill name and DOB if fields are empty
            EMPFIRSTNAME: responseData.name || prev.EmpMst.EMPFIRSTNAME,
            DOB: responseData.date_of_birth || prev.EmpMst.DOB,
          },
        }));
        setdisabledOtp(true);
        toast({ title: "Aadhaar Verified with OTP", variant: "default" });
      } else {
        toast({
          title: responseData?.message || "Invalid OTP",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error in OTP verification:", error);
      toast({ title: "OTP Verification failed", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };



  const handleBack = () => {
    history.back();
  };


  return (
    <div className="w-full">

      <div className="col-span-12 rounded-t bg-header dark:bg-black px-2 md:px-6 py-2 border dark:border-borderColor-dark">
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
          <h1 className="font-bold sm:text-sm md:text-lg lg:text-xl text-white dark:text-[#37a9dd] flex items-center gap-x-3 uppercase">
            <Image src="/Payrollicon/EmployeeMaster.png" alt="Autovyn" width={25} height={25} />
            PAN , AADHAAR AND ACCOUNT VERIFICATION
          </h1>
          <div className="flex gap-2">
            <Button variant="print" onClick={handleBack}>
              Back
            </Button>
          </div>
        </div>
      </div>


      <div className="">

        <div className="grid grid-cols-12 gap-3">

          {/* PAN Verification Content */}
          <div className="col-span-12 md:col-span-12 lg:col-span-4 mt-2">
            <div className="grid grid-cols-12">
              <div className="col-span-12 rounded-t bg-header dark:bg-black px-3 py-2 border border-borderColor dark:border-borderColor-dark flex gap-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h1 className="text-white dark:text-[#37a9dd] uppercase font-semibold text-sm">
                  PAN Verification
                </h1>
              </div>

              <div className="col-span-12">
                <div className="grid grid-cols-12 mt-2 gap-2 md:gap-3  rounded-b p-2 md:p-4 bg-white dark:bg-black border border-borderColor dark:border-borderColor-dark shadow">
                  <div className="col-span-12">

                    <Einput
                      title=" PAN Card No."
                      type="text"
                      name="PANNO"
                      value={formData.EmpMst?.PANNO}
                      handleInputChange={handleInputChange}
                      className="w-full"
                      placeholder="ABCDE1234F"
                      redlabel="*"
                      ShortName
                    />
                  </div>
                  <div className="col-span-12">

                    <Einput
                      title="First Name"
                      type="text"
                      name="EMPFIRSTNAME"
                      value={formData.EmpMst?.EMPFIRSTNAME}
                      handleInputChange={handleInputChange}
                      className="w-full"
                      placeholder="Enter first name"
                    />
                  </div>
                  <div className="col-span-12">

                    <Einput
                      title="Date of Birth"
                      type="date"
                      name="DOB"
                      value={formData.EmpMst?.DOB}
                      handleInputChange={handleInputChange}
                      className="w-full"
                    />
                  </div>
                  <div className="col-span-12 flex justify-center">
                    <Button
                      variant="save"
                      onClick={verifiyPan}
                      disabled={isLoading}
                      className="px-4 py-2 h-auto text-base font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Verifying...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Verify PAN Card
                        </span>
                      )}
                    </Button>
                  </div>

                  <div className="col-span-12">
                    {/* Verification Status - ALWAYS SHOWN WHEN VERIFIED */}
                    {formData.EmpMst?.PAN_CARD_VER && panInfo && (
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                          PAN Verification Details
                          <span className="ml-2 inline-flex items-center justify-center w-5 h-5 bg-green-100 text-green-600 rounded-full text-xs font-bold">
                            ✓
                          </span>
                        </h3>

                        {/* Always show details when verified */}
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">PAN Number</p>
                              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                {panInfo.pan || formData.EmpMst?.PANNO}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Status</p>
                              <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                                {panInfo.status === 'valid' ? 'Valid' : panInfo.status}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Name Match</p>
                              <p className={`text-sm font-semibold ${panInfo.name_as_per_pan_match ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {panInfo.name_as_per_pan_match ? '✓ Matched' : '✗ Not Matched'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">DOB Match</p>
                              <p className={`text-sm font-semibold ${panInfo.date_of_birth_match ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {panInfo.date_of_birth_match ? '✓ Matched' : '✗ Not Matched'}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Aadhaar Linked</p>
                              <p className={`text-sm font-semibold ${panInfo.aadhaar_seeding_status === "y" ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                {panInfo.aadhaar_seeding_status === "y" ? '✓ Linked' : 'Not Linked'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Category</p>
                              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                {panInfo.category || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="col-span-12">
                    {/* Show error status if verification failed */}
                    {formData.EmpMst?.PAN_CARD_VER === false && panInfo && (
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-3">
                          PAN Verification Failed
                          <span className="ml-2 inline-flex items-center justify-center w-5 h-5 bg-red-100 text-red-600 rounded-full text-xs font-bold">
                            ✗
                          </span>
                        </h3>

                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                          <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                            Invalid PAN Card Number
                          </p>
                          {panInfo.message && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                              {panInfo.message}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>


            </div>
          </div>

          {/* Aadhaar Verification Content */}
          <div className="col-span-12 md:col-span-12 lg:col-span-4 mt-2">
            <div className="grid grid-cols-12">
              <div className="col-span-12 rounded-t bg-header dark:bg-black px-3 py-2 border border-borderColor dark:border-borderColor-dark flex gap-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h1 className="text-white dark:text-[#37a9dd] uppercase font-semibold text-sm">
                  Aadhaar Verification
                </h1>
              </div>


              <div className="col-span-12">
                <div className="grid grid-cols-12 mt-2 gap-2 md:gap-3  rounded-b p-2 md:p-4 bg-white dark:bg-black border border-borderColor dark:border-borderColor-dark shadow">

                  <div className="col-span-12">
                    <Einput
                      title="Aadhaar No."
                      type="text"
                      name="UID_NO"
                      value={formData.EmpMst?.UID_NO}
                      handleInputChange={handleInputChange}
                      maxLength={12}
                      className="w-full"
                      placeholder="12-digit Aadhaar"
                      redlabel="*"
                    />
                  </div>
                  <div className="col-span-12 flex justify-center">
                    <Button
                      variant="save"
                      onClick={verifiyAadhaar}
                      disabled={isLoading}
                      className="px-6 py-2 h-auto text-base font-semibold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Sending OTP...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Send OTP to Verify
                        </span>
                      )}
                    </Button>
                  </div>

                  <div className="col-span-12 border-t border-gray-200 dark:border-gray-700"></div>
                  <div className="col-span-12 text-sm font-semibold dark:text-[#37a9dd]">OTP Verification</div>
                  <div className="col-span-12 md:col-span-12 lg:col-span-6">
                    <Einput
                      title="Enter OTP"
                      type="number"
                      name="OTP_With_Aadhaar"
                      value={formData.EmpMst?.OTP_With_Aadhaar}
                      handleInputChange={handleInputChange}
                      maxLength={6}
                      disabled={disabledOtp}
                      className="w-full text-center text-lg tracking-widest"
                      placeholder="000000"
                      ShortName
                      redlabel="*"
                    />
                  </div>

                  <div className="col-span-12 md:col-span-12 lg:col-span-6 flex items-end">
                    <Button
                      variant="save"
                      onClick={OTPVerififyed}
                      disabled={disabledOtp || isLoading}
                      className="w-full !h-[30px]"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Verifying...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Verify OTP
                        </span>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400  col-span-12 -mt-1">
                    Enter 6-digit OTP sent to registered mobile
                  </p>

                  <div className="col-span-12">
                    {/* AADHAAR VERIFICATION DETAILS - SHOWN WHEN VERIFIED */}
                    {formData.EmpMst?.AADHAR_CARD_VER && aadhaarInfo && (
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                            Aadhaar Verification Details
                          </h3>
                          <div className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 whitespace-nowrap">
                            Verified ✓
                          </div>
                        </div>

                        {/* HORIZONTAL LAYOUT - Details on Left, Photo on Right */}
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-5">
                          <div className="flex flex-col lg:flex-row gap-6">
                            {/* Left Side - Aadhaar Details */}
                            <div className="lg:w-2/3 space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Aadhaar Number</p>
                                  <p className="text-base font-bold text-gray-800 dark:text-white font-mono tracking-wider">
                                    {formData.EmpMst?.UID_NO}
                                  </p>
                                </div>


                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Full Name</p>
                                  <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                                    {aadhaarInfo.name || "N/A"}
                                  </p>
                                </div>

                                <div className="space-y-1">
                                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Date of Birth</p>
                                  <p className="text-sm font-semibold text-gray-800 dark:text-white">
                                    {aadhaarInfo.date_of_birth || "N/A"}
                                  </p>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">

                                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Care Of</p>
                                  <p className="text-sm font-semibold text-gray-800 dark:text-white whitespace-nowrap">
                                    {aadhaarInfo.care_of || "N/A"}
                                  </p>
                                </div>


                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                <div className="space-y-1">
                                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Gender</p>
                                  <p className="text-sm font-semibold text-gray-800 dark:text-white">
                                    {aadhaarInfo.gender || "N/A"}
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Full Address</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300 bg-white p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                  {aadhaarInfo.full_address || "N/A"}
                                </p>
                              </div>
                            </div>

                            {/* Right Side - Photo */}
                            <div className="lg:w-1/3 flex flex-col items-center justify-center">
                              <div className="text-center mb-3">
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Aadhaar Photo</p>
                              </div>

                              <div className="relative w-full max-w-xs">
                                <div className="relative w-full h-48 bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-800 dark:to-gray-900 rounded-xl border-4 border-white dark:border-gray-700 shadow-lg overflow-hidden">
                                  {aadhaarInfo.photo ? (
                                    <img
                                      src={`data:image/jpeg;base64,${aadhaarInfo.photo}`}
                                      alt="Aadhaar Photo"
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                                      <svg className="w-12 h-12 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      <span className="text-sm text-center">Photo not available</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="col-span-12">
                    {/* SHOW ALL AADHAAR DETAILS WHEN AADHAAR EXISTS BUT VERIFICATION FAILED */}
                    {formData.EmpMst?.AADHAR_CARD_VER === false && aadhaarInfo && (aadhaarInfo.message?.includes("exists") || aadhaarInfo.message?.includes("Exists")) && (
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        {/* Show the error message */}
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-4">
                          <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.346 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                              {aadhaarInfo.message}
                            </p>
                          </div>
                        </div>

                        {/* SHOW ALL AADHAAR DETAILS IN HORIZONTAL LAYOUT (SAME AS VERIFIED STATE) */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
                          <div className="flex flex-col lg:flex-row gap-6">
                            {/* Left Side - Aadhaar Details */}
                            <div className="lg:w-2/3 space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Aadhaar Number</p>
                                  <p className="text-base font-bold text-gray-800 dark:text-white font-mono tracking-wider">
                                    {formData.EmpMst?.UID_NO}
                                  </p>
                                </div>


                              </div>

                              {/* Show Name and Date of Birth in same row */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Full Name</p>
                                  <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                                    {aadhaarInfo.name || "N/A"}
                                  </p>
                                </div>

                                <div className="space-y-1">
                                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Date of Birth</p>
                                  <p className="text-sm font-semibold text-gray-800 dark:text-white">
                                    {aadhaarInfo.date_of_birth || "N/A"}
                                  </p>
                                </div>
                              </div>

                              {/* Show Gender and Care Of in same row */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">

                                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Care Of</p>
                                  <p className="text-sm font-semibold text-gray-800 dark:text-white whitespace-nowrap">
                                    {aadhaarInfo.care_of || "N/A"}
                                  </p>
                                </div>


                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                <div className="space-y-1">
                                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Gender</p>
                                  <p className="text-sm font-semibold text-gray-800 dark:text-white">
                                    {aadhaarInfo.gender || "N/A"}
                                  </p>
                                </div>
                              </div>

                              {/* Full Address - Full width */}
                              <div className="space-y-1">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Full Address</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300  dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                  {aadhaarInfo.full_address || "N/A"}
                                </p>
                              </div>

                              {/* District and State in same row */}
                              {aadhaarInfo.district && aadhaarInfo.state && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">District</p>
                                    <p className="text-sm font-semibold text-gray-800 dark:text-white">
                                      {aadhaarInfo.district}
                                    </p>
                                  </div>

                                  <div className="space-y-1">
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">State</p>
                                    <p className="text-sm font-semibold text-gray-800 dark:text-white">
                                      {aadhaarInfo.state}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* PIN Code - Can be in same row if you have another field, otherwise adjust */}
                              {aadhaarInfo.pincode && (
                                <div className="space-y-1">
                                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">PIN Code</p>
                                  <p className="text-sm font-semibold text-gray-800 dark:text-white">
                                    {aadhaarInfo.pincode}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Right Side - Photo if available */}
                            <div className="lg:w-1/3 flex flex-col items-center justify-center">
                              <div className="text-center mb-3">
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Aadhaar Photo</p>
                              </div>

                              <div className="relative w-full max-w-xs">
                                <div className="relative w-full h-48 bg-gradient-to-br from-blue-50 to-amber-50 dark:from-gray-800 dark:to-gray-900 rounded-xl border-4 border-white dark:border-gray-700 shadow-lg overflow-hidden">
                                  {aadhaarInfo.photo ? (
                                    <img
                                      src={`data:image/jpeg;base64,${aadhaarInfo.photo}`}
                                      alt="Aadhaar Photo"
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                                      <svg className="w-12 h-12 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      <span className="text-sm text-center">Photo not available</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="col-span-12">
                    {/* SHOW ONLY ERROR MESSAGE WHEN AADHAAR IS INVALID (DOESN'T EXIST) */}
                    {formData.EmpMst?.AADHAR_CARD_VER === false && aadhaarInfo && !aadhaarInfo.message?.includes("exists") && !aadhaarInfo.message?.includes("Exists") && (
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
                            Invalid Aadhaar Number
                          </h3>
                        </div>

                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-5">
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p className="text-lg font-bold text-red-700 dark:text-red-300">
                                Invalid Aadhaar Number
                              </p>
                            </div>

                            {aadhaarInfo.message && (
                              <p className="text-sm text-red-600 dark:text-red-400 pl-8">
                                {aadhaarInfo.message}
                              </p>
                            )}

                            <p className="text-sm text-gray-600 dark:text-gray-400 pl-8">
                              Please check the Aadhaar number and try again. Ensure you've entered exactly 12 digits.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
          {/* Bank Account Verification Content */}
          <div className="col-span-12 md:col-span-12 lg:col-span-4 mt-2">
            <div className="grid grid-cols-12">
              <div className="col-span-12 rounded-t bg-header dark:bg-black px-3 py-2 border border-borderColor dark:border-borderColor-dark flex gap-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <h1 className="text-white dark:text-[#37a9dd] uppercase font-semibold text-sm">
                  Bank Account Verification
                </h1>
              </div>

              <div className="col-span-12">
                <div className="grid grid-cols-12 mt-2 gap-2 md:gap-3  rounded-b p-2 md:p-4 bg-white dark:bg-black border border-borderColor dark:border-borderColor-dark shadow">
                  <div className="col-span-12">
                    <Einput
                      title="Account No."
                      type="text"
                      name="BANKACCOUNTNO"
                      value={formData.EmpMst?.BANKACCOUNTNO}
                      handleInputChange={handleInputChange}
                      className="w-full"
                      placeholder="Bank account number"
                      redlabel="*"
                    />
                  </div>

                  <div className="col-span-12">
                    <Einput
                      title="IFSC Code"
                      type="text"
                      name="ifsc_code"
                      value={formData.EmpMst?.ifsc_code}
                      handleInputChange={handleInputChange}
                      className="w-full"
                      placeholder="Bank IFSC code"
                      redlabel="*"
                      ShortName
                    />
                  </div>

                  <div className="col-span-6">
                    <Button
                      variant="save"
                      onClick={() => VerifyAccountNo(13)}
                      disabled={IsVerifyAccountApi || !formData.EmpMst?.BANKACCOUNTNO || !formData.EmpMst?.ifsc_code}
                      className="w-full px-4 py-2 h-auto text-base font-semibold bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      {IsVerifyAccountApi ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Verifying Account...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Verify Account
                        </span>
                      )}
                    </Button>
                  </div>
                  <div className="col-span-6">
                    <Button
                      variant="save"
                      onClick={() => VerifyAccountNo(12)}
                      disabled={IsVerifyIFSCApi || !formData.EmpMst?.ifsc_code}
                      className="w-full px-4 py-2 h-auto text-base font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      {IsVerifyIFSCApi ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Verifying IFSC...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Verify IFSC
                        </span>
                      )}
                    </Button>
                  </div>
                  <div className="col-span-12">
                    {/* ACCOUNT VERIFICATION DETAILS - SHOWN WHEN VERIFIED */}
                    {formData.EmpMst?.account_verified && AccountData && (
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                            Account Verification Details
                            <span className="ml-2 inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-600 rounded-full text-sm font-bold">
                              ✓
                            </span>
                          </h3>
                          <div className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            Verified
                          </div>
                        </div>

                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-5">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Account Number</p>
                              <p className="text-base font-bold text-gray-800 dark:text-white font-mono">
                                {formData.EmpMst?.BANKACCOUNTNO || "N/A"}
                              </p>
                            </div>

                            <div className="space-y-1">
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Account Holder Name</p>
                              <p className="text-sm font-semibold text-gray-800 dark:text-white">
                                {AccountData.name_at_bank || "N/A"}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-sm font-medium text-green-700 dark:text-green-400">
                              ✓ Bank account successfully verified
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="col-span-12">
                    {/* SHOW ERROR IF ACCOUNT VERIFICATION FAILED */}
                    {formData.EmpMst?.account_verified === false && AccountData && (
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
                            Account Verification Failed
                            <span className="ml-2 inline-flex items-center justify-center w-6 h-6 bg-red-100 text-red-600 rounded-full text-sm font-bold">
                              ✗
                            </span>
                          </h3>
                        </div>

                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-5">
                          <div className="space-y-3">
                            <p className="text-lg font-bold text-red-700 dark:text-red-300">
                              Invalid Bank Account
                            </p>
                            <p className="text-sm text-red-600 dark:text-red-400">
                              {AccountData.message || "The bank account number and IFSC code combination is invalid."}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Please check the account number and IFSC code and try again.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="col-span-12">
                    {/* IFSC VERIFICATION DETAILS - SHOWN WHEN VERIFIED */}
                    {IFSCData && (
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                            IFSC Verification Details
                            <span className="ml-2 inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-sm font-bold">
                              ✓
                            </span>
                          </h3>
                          <div className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                            Verified
                          </div>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">IFSC Code</p>
                              <p className="text-base font-bold text-gray-800 dark:text-white font-mono">
                                {IFSCData.IFSC || formData.EmpMst?.ifsc_code || "N/A"}
                              </p>
                            </div>

                            <div className="space-y-1">
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Bank</p>
                              <p className="text-sm font-semibold text-gray-800 dark:text-white">
                                {IFSCData.BANK || "N/A"}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Branch</p>
                              <p className="text-sm font-semibold text-gray-800 dark:text-white">
                                {IFSCData.BRANCH || "N/A"}
                              </p>
                            </div>

                            <div className="space-y-1">
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">City</p>
                              <p className="text-sm font-semibold text-gray-800 dark:text-white">
                                {IFSCData.CITY || "N/A"}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">District</p>
                              <p className="text-sm font-semibold text-gray-800 dark:text-white">
                                {IFSCData.DISTRICT || "N/A"}
                              </p>
                            </div>

                            <div className="space-y-1">
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">State</p>
                              <p className="text-sm font-semibold text-gray-800 dark:text-white">
                                {IFSCData.STATE || "N/A"}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              <div className={`px-3 py-2 rounded-lg text-center ${IFSCData.NEFT ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                                <p className="text-xs font-medium">NEFT</p>
                                <p className="text-sm font-bold">{IFSCData.NEFT ? 'Yes' : 'No'}</p>
                              </div>
                              <div className={`px-3 py-2 rounded-lg text-center ${IFSCData.RTGS ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                                <p className="text-xs font-medium">RTGS</p>
                                <p className="text-sm font-bold">{IFSCData.RTGS ? 'Yes' : 'No'}</p>
                              </div>
                              <div className={`px-3 py-2 rounded-lg text-center ${IFSCData.IMPS ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                                <p className="text-xs font-medium">IMPS</p>
                                <p className="text-sm font-bold">{IFSCData.IMPS ? 'Yes' : 'No'}</p>
                              </div>
                              <div className={`px-3 py-2 rounded-lg text-center ${IFSCData.UPI ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                                <p className="text-xs font-medium">UPI</p>
                                <p className="text-sm font-bold">{IFSCData.UPI ? 'Yes' : 'No'}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="col-span-12">
                    {/* SHOW ERROR IF IFSC VERIFICATION FAILED */}
                    {formData.EmpMst?.ifsc_verified === false && IFSCData && (
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
                            IFSC Verification Failed
                            <span className="ml-2 inline-flex items-center justify-center w-6 h-6 bg-red-100 text-red-600 rounded-full text-sm font-bold">
                              ✗
                            </span>
                          </h3>
                        </div>

                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-5">
                          <div className="space-y-3">
                            <p className="text-lg font-bold text-red-700 dark:text-red-300">
                              Invalid IFSC Code
                            </p>
                            <p className="text-sm text-red-600 dark:text-red-400">
                              {IFSCData.message || "The IFSC code is invalid or not found."}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Please check the IFSC code and try again.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>


            </div>
          </div>

        </div>
      </div>


      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl max-w-md w-full mx-4">
            <div className="flex flex-col items-center gap-4">
              <svg className="animate-spin h-12 w-12 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-lg font-semibold text-gray-800 dark:text-white">Processing Verification...</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Please wait while we verify your documents. This may take a few moments.
              </p>
            </div>
          </div>
        </div>
      )}

      <HashloaderComponent isLoading={isLoading} />
    </div>
  );
};

export default PageSimpleVerification;