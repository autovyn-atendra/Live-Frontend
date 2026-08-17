"use client";
import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  User,
  CreditCard,
  Car,
  X,
  RefreshCw,
  Phone,
  Ghost,
} from "lucide-react";
import axios from "axios";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import { Button } from "../ui/button";

const DigiLockerVerification = ({
  onVerificationComplete,
  onAadharVerified,
  onVerificationError,
  mobileNumber,
  Name,
  adhar,
  pan,
  DrivingLicense,
  onClose,
  isOpen = false,
  allowedDocTypes = ["pan", "aadhaar", "driving_license"],
}: any) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [verificationUrl, setVerificationUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loader, setLoader] = useState({
    consentLoader: false,
  });
  const [error, setError] = useState("");
  const [documentData, setDocumentData] = useState({});
  const [selectedDocType, setSelectedDocType] = useState("");
  //   const [mobileNumber, setMobileNumber] = useState("");
  const [documentTypes, setDocumentTypes] = useState({
    pan: {
      label: "PAN Card",
      icon: CreditCard,
      color: "bg-primary",
      disabled: true,
    },
    aadhaar: {
      label: "Aadhaar Card",
      icon: User,
      color: "bg-green",
      disabled: true,
    },
    driving_license: {
      label: "Driving License",
      icon: Car,
      color: "bg-yellow",
      disabled: true,
    },
  });
  const user = useCurrentUser();

  // Step 1: Initialize Session (ORIGINAL API CALL - UNCHANGED)
  const initializeSession = async () => {
    if (!mobileNumber || mobileNumber.length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/panAndAdharApi/validateDigiLocker`,
        {
          option: 1,
          mobile: mobileNumber,
          Name: Name,
        },
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
          },
        }
      );

      const data = response.data;
      console.log(data, "data");
      if (
        response.status == 200 &&
        data.code == 200 &&
        data.data &&
        data.data.session_id &&
        data.data.authorization_url
      ) {
        setVerificationUrl(data.data.authorization_url);
        setCurrentStep(2);
        if (!data.fromDb) {
          const baseUrl = data.data.authorization_url;
          window.open(
            baseUrl,
            "_blank",
            "width=1200,height=600,toolbar=no,location=no,status=no,menubar=no,scrollbars=no,resizable=no"
          );
        } else {
          startStatusPolling();
        }
      } else {
        throw new Error(data.message || "Failed to initialize session");
      }
    } catch (err: any) {
      setError(err.message);
      onVerificationError?.(err);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Poll Status (ORIGINAL API CALL - UNCHANGED)
  const checkStatus = async () => {
    try {
      setLoader((prev) => ({
        ...prev,
        consentLoader: true,
      }));
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/panAndAdharApi/validateDigiLocker`,
        {
          option: 2,
          mobile: mobileNumber,
        },
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
          },
        }
      );

      const data = response.data;
      console.log(data, "dddddddd");
      if (response.status == 200) {
        if (data.data.status === "succeeded") {
          setCurrentStep(3);
          data.data.documents_consented?.forEach((i: string) => {
            setDocumentTypes((prev: any) => ({
              ...prev,
              [i]: {
                ...prev[i],
                disabled: false,
              },
            }));
          });
        } else if (data.data.status === "failed") {
        }
      } else {
        throw new Error(data.message || "Failed to check status");
      }
    } catch (err: any) {
      setError(err.message);
      onVerificationError?.(err);
    } finally {
      setLoader((prev) => ({
        ...prev,
        consentLoader: false,
      }));
    }
  };

  // Step 3: Get Document Data (ORIGINAL API CALL - UNCHANGED)
  const fetchDocumentData = async (docType: any) => {
    setLoading(true);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/panAndAdharApi/validateDigiLocker`,
        {
          option: 3,
          mobile: mobileNumber,
          docType: docType,
        },
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
          },
        }
      );
      const data = response.data; // Fixed: removed await response.json() for axios
      console.log(data, "datadatadatadata");
      if (response.status == 200) {
        if (docType === "aadhaar") {
            const digiAadharLast4 = data?.aadhaar_uid_last4?.slice(-4);
            const formAadharLast4 = String(adhar).slice(-4);
    
            if (digiAadharLast4 !== formAadharLast4) {
              setError(
                `Aadhaar mismatch! Entered: ${formAadharLast4}, DigiLocker: ${digiAadharLast4}`
              );
              return; // stop here, don’t setDocumentData
            }
          }

          if (docType === "pan") {
            const digipanLast4 = data?.pan_number;
            const formpanLast4 = String(pan);
    
            if (digipanLast4 !== formpanLast4) {
              setError(
                `PAN mismatch! Entered: ${formpanLast4}, DigiLocker: ${digipanLast4}`
              );
              return; // stop here, don’t setDocumentData
            }
          }

          if (docType === "driving_license") {
            const digiDrivingLicenseLast4 = data?.certificate_number?.replace(/\s+/g, ''); // remove all spaces
            const formDrivingLicenseLast4 = String(DrivingLicense);
          
            if (digiDrivingLicenseLast4 !== formDrivingLicenseLast4) {
              setError(
                `Driving License mismatch! Entered: ${formDrivingLicenseLast4}, DigiLocker: ${digiDrivingLicenseLast4}`
              );
              return; // stop here, don’t setDocumentData
            }
          }          
        const wrapped = { type: docType, data: data }; // <-- add docType and wrap actual response
        setDocumentData(wrapped);
        onVerificationComplete?.(wrapped);
        if (docType === "aadhaar") {
          const photoBase64 = data.aadhaar_photo_base64;
          onAadharVerified?.("aadhaar", photoBase64);  // call with type
          } else if (docType === "pan") {
            onAadharVerified?.("pan"); 
          } else if (docType === "driving_license") {
            onAadharVerified?.("driving_license");
          }
      } else {
        throw new Error(data.message || "Failed to fetch document data");
      }
    } catch (err: any) {
      setError(err.message);
      onVerificationError?.(err);
    } finally {
      setLoading(false);
    }
  };

  const startStatusPolling = () => {
    checkStatus();
  };

  const resetVerification = () => {
    setCurrentStep(1);
    setVerificationUrl(null);
    setDocumentData(null);
    setError(null);
    setSelectedDocType("");
    // setMobileNumber("");
  };

  const handleClose = () => {
    resetVerification();
    if (currentStep == 1) {
      onClose?.();
    }
  };

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      resetVerification();
    }
  }, [isOpen]);

  const getStepIcon = (step: number) => {
    if (currentStep > step)
      return <CheckCircle className="w-5 h-5 text-green" />;
    if (currentStep === step && loading)
      return <RefreshCw className="w-5 h-5 text-primary animate-spin" />;
    if (currentStep === step) return <Clock className="w-5 h-5 text-primary" />;
    return <div className="w-5 h-5 bg-grey rounded-full" />;
  };

  //   const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //     const value = e.target.value.replace(/\D/g, ""); // Only allow digits
  //     if (value.length <= 10) {
  //       setMobileNumber(value);
  //     }
  //   };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={handleClose}
      />

      {/* Floating Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-darkshadow transform transition-all animate-pulse-1s">
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 p-2 bg-off hover:bg-grey rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-body-color hover:text-black" />
            </button>

            {/* Modal Content */}
            <div className="p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-black mb-2">
                  DigiLocker Verification
                </h2>
                <p className="text-body-color">
                  Verify your documents securely
                </p>
              </div>

              {/* Progress Steps */}
              <div className="flex items-center justify-between mb-8 max-w-2xl mx-auto">
                <div className="flex items-center gap-3">
                  {getStepIcon(1)}
                  <span
                    className={`font-medium text-sm ${
                      currentStep >= 1 ? "text-black" : "text-body-color"
                    }`}
                  >
                    Mobile
                  </span>
                </div>
                <div
                  className={`flex-1 h-1 mx-3 rounded ${
                    currentStep > 1 ? "bg-green" : "bg-grey"
                  }`}
                />

                <div className="flex items-center gap-3">
                  {getStepIcon(2)}
                  <span
                    className={`font-medium text-sm ${
                      currentStep >= 2 ? "text-black" : "text-body-color"
                    }`}
                  >
                    Verify
                  </span>
                </div>
                <div
                  className={`flex-1 h-1 mx-3 rounded ${
                    currentStep > 2 ? "bg-green" : "bg-grey"
                  }`}
                />

                <div className="flex items-center gap-3">
                  {getStepIcon(3)}
                  <span
                    className={`font-medium text-sm ${
                      currentStep >= 3 ? "text-black" : "text-body-color"
                    }`}
                  >
                    Complete
                  </span>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mb-6 p-4 bg-off border border-exit rounded-lg flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-exit flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-exit">Error</h4>
                    <p className="text-exit text-sm">{error}</p>
                  </div>
                </div>
              )}

              {/* Step 1: Mobile Number Input */}
              {currentStep === 1 && (
                <div className="space-y-6 max-w-md mx-auto">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-black mb-2">
                      Enter Mobile Number
                    </h3>
                    <p className="text-body-color text-sm">
                      We'll send you a verification link
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-body-color" />
                      </div>
                      <input
                        type="tel"
                        value={mobileNumber}
                        placeholder="Enter 10-digit mobile number"
                        className="w-full pl-12 pr-4 py-4 border-2 border-off rounded-xl 
             bg-gray-100 text-gray-500 placeholder-gray-400 
             disabled:cursor-not-allowed"
                        maxLength={10}
                        disabled={true}
                      />
                    </div>
                    {mobileNumber && mobileNumber.length !== 10 && (
                      <p className="text-sm text-exit">
                        Please enter a valid 10-digit mobile number
                      </p>
                    )}
                  </div>

                  <button
                    onClick={initializeSession}
                    disabled={mobileNumber.length !== 10 || loading}
                    className="w-full py-4 px-6 bg-primary text-white font-semibold rounded-xl hover:bg-b600 disabled:bg-grey disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3 text-lg"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Generating Session...
                      </>
                    ) : (
                      <>
                        <FileText className="w-5 h-5" />
                        Generate Session
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Step 2: Document Selection + DigiLocker Interface */}
              {currentStep === 2 && verificationUrl && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-black mb-2">
                      Check status of consent to get documents
                    </h3>
                    {/* Status Indicator */}
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <Button
                      variant={"save"}
                      loading={loader.consentLoader}
                      onClick={checkStatus}
                    >
                      check consent status
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Verification Complete */}
              {currentStep === 3 && (
                <div className="space-y-6 text-center">
                  <div>
                    <CheckCircle className="w-10 h-10 text-green mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-black mb-2">
                      Status check successful{" "}
                    </h3>
                    <p className="text-body-color">Get your documents here</p>
                  </div>
                  {/* Document Selection */}
                  <div className="mb-6">
                    <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
                      {allowedDocTypes.map((docType: any) => {
                        const config = documentTypes[docType];
                        const IconComponent = config.icon;

                        return (
                          <button
                            disabled={config.disabled}
                            key={docType}
                            onClick={() => fetchDocumentData(docType)}
                            className={`p-3 rounded-lg border-2 transition-all hover:shadow-one ${
                              selectedDocType === docType
                                ? "border-primary bg-front"
                                : "border-off hover:border-grey"
                            }`}
                          >
                            <div
                              className={`w-8 h-8 ${config.color} rounded-lg flex items-center justify-center mx-auto mb-2`}
                            >
                              <IconComponent className="w-4 h-4 text-white" />
                            </div>
                            <h5 className="font-medium text-black text-xs">
                              {config.label}
                            </h5>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="text-center text-sm text-body-color">
                    <p>
                      Select a document type above and complete verification in
                      the frame.
                    </p>
                  </div>
                  <div className="flex gap-4 justify-end">
                    <Button variant={"outline"} onClick={handleClose}>
                      Reset
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DigiLockerVerification;
