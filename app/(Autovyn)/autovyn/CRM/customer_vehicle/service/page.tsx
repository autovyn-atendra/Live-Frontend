"use client";

import Ainput from "@/components/atoms/Input";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import Swal from "sweetalert2";
import HashloaderComponent from "@/components/Templates/hashloader";
import { FaClipboardCheck } from "react-icons/fa";

type FormDataType = {
  Tran_id: string;
  Cust_Name: string;
  Cust_Mob: string;
  Model_Name: string;
  Last_Service_Date: string;
  Last_Service_KM: string;
  Avg_Daily_KM: string;
  Current_KM: string;
  ServiceType: string;

  Current_Service_Date: string;
  Current_Service_KM: string;
  Remark: string;
};

export default function Page() {
  const user = useCurrentUser();
  const [isLoading, setIsLoading] = useState(false);

  const [hasCheckedVehicle, setHasCheckedVehicle] = useState(false);
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [didAttemptUpdate, setDidAttemptUpdate] = useState(false);

  const todayDate = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const initialdata: FormDataType = {
    Tran_id: "",
    Cust_Name: "",
    Cust_Mob: "",
    Model_Name: "",
    Last_Service_Date: "",
    Last_Service_KM: "",
    Avg_Daily_KM: "",
    Current_KM: "",
    ServiceType: "",

    Current_Service_Date: todayDate,
    Current_Service_KM: "",
    Remark: "",
  };

  const [formData, setFormData] = useState<FormDataType>(initialdata);
  const [currentServiceKmError, setCurrentServiceKmError] = useState<string>("");

  const topFormDisabled = isDataFetched;
  const showCompletionForm = isDataFetched;

  // ---------- helpers ----------
  const onlyDigits = (val: any, maxLen?: number) => {
    let s = String(val ?? "").replace(/\D/g, "");
    if (typeof maxLen === "number") s = s.slice(0, maxLen);
    return s;
  };

  const normalizeDateForInput = (val: any) => {
    const s = String(val ?? "").trim();
    if (!s) return "";
    if (s.includes("T")) return s.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    return s;
  };

  const parseKm = (v: any) => {
    const s = onlyDigits(v);
    if (!s) return NaN;
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
  };

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
    Toast.fire({ icon: type, title: message });
  }

  useEffect(() => {
    setFormData((p) => ({
      ...p,
      Current_Service_Date: p.Current_Service_Date || todayDate,
    }));
  }, [todayDate]);

  const handleRefresh = () => window.location.reload();

  const handleInputChange = (name: string, value: boolean | string) => {
    // ✅ Vehicle Reg No: always uppercase while typing (only in NEW mode)
    if (name === "Tran_id" && !topFormDisabled) {
      const upper = String(value ?? "").toUpperCase();

      setHasCheckedVehicle(false);
      setIsDataFetched(false);
      setDidAttemptUpdate(false);
      setCurrentServiceKmError("");

      setFormData({
        ...initialdata,
        Tran_id: upper,
        Current_Service_Date: todayDate,
      });
      return;
    }

    // Customer mobile: only 10 digits
    if (name === "Cust_Mob") {
      const mob = onlyDigits(value, 10);
      setFormData((prev) => ({ ...prev, Cust_Mob: mob }));
      return;
    }

    // Numeric fields: only digits
    const numericFields: Array<keyof FormDataType> = [
      "Last_Service_KM",
      "Avg_Daily_KM",
      "Current_KM",
      "Current_Service_KM",
    ];

    if (numericFields.includes(name as any)) {
      const digits = onlyDigits(value);

      // typing current service km => no validation shown
      if (name === "Current_Service_KM") {
        setDidAttemptUpdate(false);
        setCurrentServiceKmError("");
      }

      setFormData((prev) => ({ ...prev, [name]: digits } as any));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: String(value ?? "") }));
  };

  const findByCustId = async () => {
    if (!formData.Tran_id) {
      showSideAlert("Please enter Vehicle Reg No", "warning");
      return;
    }

    try {
      setIsLoading(true);
      setHasCheckedVehicle(true);
      setDidAttemptUpdate(false);
      setCurrentServiceKmError("");

      const result = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/Crm/getServiceDataByVehiNo`,
        { Veh_Reg_No: formData.Tran_id },
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
            loc_code: user?.branch,
          },
        }
      );

      if (result?.data) {
        setFormData((prev) => ({
          ...prev,
          Cust_Name: String(result.data.Cust_Name ?? ""),
          Cust_Mob: onlyDigits(result.data.Cust_Mob, 10),
          Model_Name: String(result.data.Model_Name ?? ""),
          Last_Service_Date: normalizeDateForInput(result.data.Last_Service_Date),
          Last_Service_KM: onlyDigits(result.data.Last_Service_KM),
          Avg_Daily_KM: onlyDigits(result.data.Avg_Daily_KM),
          Current_KM: onlyDigits(result.data.Current_KM),
          ServiceType: String(result.data.Service_Type ?? ""),

          Current_Service_Date: prev.Current_Service_Date || todayDate,
          Current_Service_KM: "",
          Remark: "",
        }));

        setIsDataFetched(true);
      } else {
        showSideAlert("No record found. Please enter details manually & Save.", "warning");

        setIsDataFetched(false);
        setFormData((prev) => ({
          ...initialdata,
          Tran_id: prev.Tran_id.toUpperCase(),
          Current_Service_Date: todayDate,
        }));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      showSideAlert("Something went wrong", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const saveNewVehicle = async () => {
    if (!hasCheckedVehicle) {
      showSideAlert('Please click "Click To Get Details" first', "warning");
      return;
    }
    if (!formData.Tran_id) {
      showSideAlert("Please enter Vehicle Reg No", "warning");
      return;
    }

    try {
      setIsLoading(true);

      const result = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/Crm/saveNewVehicleServiceData`,
        {
          Veh_Reg_No: formData.Tran_id,
          Cust_Name: formData.Cust_Name,
          Cust_Mob: formData.Cust_Mob,
          Model_Name: formData.Model_Name,
          Last_Service_Date: formData.Last_Service_Date,
          Last_Service_KM: formData.Last_Service_KM,
          Avg_Daily_KM: formData.Avg_Daily_KM,
          Current_KM: formData.Current_KM,
          ServiceType: formData.ServiceType,
        },
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
            loc_code: user?.branch,
          },
        }
      );

      showSideAlert(result?.data?.message || "Saved successfully", "success");
      handleRefresh();
    } catch (error: any) {
      console.error("Error saving new vehicle:", error);
      const backendMsg = error?.response?.data?.message;
      if (backendMsg) showSideAlert(backendMsg, "warning");
      else showSideAlert("Something went wrong", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const updateServiceCompletion = async () => {
    setDidAttemptUpdate(true);
    setCurrentServiceKmError("");

    if (!hasCheckedVehicle) {
      showSideAlert('Please click "Click To Get Details" first', "warning");
      return;
    }
    if (!formData.Tran_id) {
      showSideAlert("Please enter Vehicle Reg No", "warning");
      return;
    }
    if (!formData.Current_Service_Date) {
      showSideAlert("Please select Current Service Date", "warning");
      return;
    }
    if (!formData.Current_Service_KM) {
      showSideAlert("Please enter Current Service KM", "warning");
      return;
    }

    const lastKm = parseKm(formData.Last_Service_KM);
    const currKm = parseKm(formData.Current_Service_KM);

    if (Number.isNaN(currKm)) {
      const msg = "Current Service KM must be numeric";
      setCurrentServiceKmError(msg);
      showSideAlert(msg, "warning");
      return;
    }

    // if (!Number.isNaN(lastKm) && currKm <= lastKm) {
    //   const msg = `Aap Last Service KM (${lastKm}) se kam ya barabar Current Service KM nahi daal sakte`;
    //   setCurrentServiceKmError(msg);
    //   showSideAlert(msg, "warning");
    //   return;
    // }

    try {
      setIsLoading(true);

      const result = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/Crm/saveOrUpdateServiceData`,
        {
          Veh_Reg_No: formData.Tran_id,
          Cust_Name: formData.Cust_Name,
          Cust_Mob: formData.Cust_Mob,
          Model_Name: formData.Model_Name,
          Avg_Daily_KM: formData.Avg_Daily_KM,
          Current_KM: formData.Current_KM,
          ServiceType: formData.ServiceType,

          Current_Service_Date: formData.Current_Service_Date,
          Current_Service_KM: formData.Current_Service_KM,
          Remark: formData.Remark,
        },
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
            loc_code: user?.branch,
          },
        }
      );

      setCurrentServiceKmError("");
      setDidAttemptUpdate(false);
      showSideAlert(result?.data?.message || "Updated successfully", "success");

      setFormData((prev) => ({
        ...prev,
        Current_Service_Date: todayDate,
        Current_Service_KM: "",
        Remark: "",
      }));
    } catch (error: any) {
      console.error("Error updating data:", error);
      const backendMsg = error?.response?.data?.message;
      if (backendMsg) {
        setCurrentServiceKmError(backendMsg);
        showSideAlert(backendMsg, "warning");
      } else {
        showSideAlert("Something went wrong", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-12 w-full pb-1">
      <div className="col-span-12 w-full">
        {/* MAIN HEADER */}
        <div className="col-span-12 rounded-t bg-header dark:bg-black px-2 md:px-6 py-2 border dark:border-borderColor-dark">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <h1 className="font-bold sm:text-sm md:text-lg lg:text-xl text-white dark:text-[#37a9dd] flex items-center gap-x-3 uppercase">
              <FaClipboardCheck size={30} title="Presale" />
              Update Service completed info
            </h1>

            <div className="flex gap-2">
              {!isDataFetched ? (
                <Button className="ml-1" variant={"update"} onClick={saveNewVehicle}>
                  Save
                </Button>
              ) : null}

              {isDataFetched ? (
                <Button className="ml-1" variant={"update"} onClick={updateServiceCompletion}>
                  Update
                </Button>
              ) : null}

              <Button className="ml-1" variant={"update"} onClick={handleRefresh}>
                Refresh
              </Button>

              <Button className="ml-1" variant={"print"} onClick={() => window.history.back()}>
                Back
              </Button>
            </div>
          </div>
        </div>

        {/* TOP FORM */}
        <div className="grid grid-cols-12 mt-2 gap-2 md:gap-3 rounded-b p-2 md:p-4 bg-white dark:bg-black border border-borderColor dark:border-borderColor-dark shadow">
          <div className="col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-4 xl:col-span-3">
            <Ainput
              height={"7"}
              title="Vehi Reg No"
              type="text"
              name="Tran_id"
              value={formData.Tran_id}
              handleInputChange={handleInputChange}
              disabled={topFormDisabled}
            />
          </div>

          <div className="col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-9">
            <Button className="ml-1 md:mt-6 mt-0" variant={"update"} onClick={findByCustId}>
              Click To Get Details
            </Button>
          </div>

          <div className="col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-4 xl:col-span-3">
            <Ainput height={"7"} title="Customer Name" type="text" name="Cust_Name" value={formData.Cust_Name} handleInputChange={handleInputChange} disabled={topFormDisabled} />
          </div>

          <div className="col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-4 xl:col-span-3">
            <Ainput height={"7"} title="Customer Mobile" type="text" name="Cust_Mob" value={formData.Cust_Mob} handleInputChange={handleInputChange} disabled={topFormDisabled} />
          </div>

          <div className="col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-4 xl:col-span-3">
            <Ainput height={"7"} title="Model Name" type="text" name="Model_Name" value={formData.Model_Name} handleInputChange={handleInputChange} disabled={topFormDisabled} />
          </div>

          <div className="col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-4 xl:col-span-3">
            <Ainput height={"7"} title="Last Service Date" type="date" name="Last_Service_Date" value={formData.Last_Service_Date} handleInputChange={handleInputChange} disabled={topFormDisabled} />
          </div>

          <div className="col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-4 xl:col-span-3">
            <Ainput height={"7"} title="Last Service KM" type="text" name="Last_Service_KM" value={formData.Last_Service_KM} handleInputChange={handleInputChange} disabled={topFormDisabled} />
          </div>

          <div className="col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-4 xl:col-span-3">
            <Ainput height={"7"} title="Average Daily KM" type="text" name="Avg_Daily_KM" value={formData.Avg_Daily_KM} handleInputChange={handleInputChange} disabled={topFormDisabled} />
          </div>

          <div className="col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-4 xl:col-span-3">
            <Ainput height={"7"} title="Current KM" type="text" name="Current_KM" value={formData.Current_KM} handleInputChange={handleInputChange} disabled={topFormDisabled} />
          </div>
        </div>

        {/* Completion form ONLY for existing vehicle */}
        {showCompletionForm ? (
          <>
            <div className="col-span-12 rounded-t bg-header dark:bg-black px-2 md:px-6 py-2 border dark:border-borderColor-dark mt-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold sm:text-sm md:text-base lg:text-lg text-white dark:text-[#37a9dd] uppercase">
                  Service Completion Details (Current Visit)
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-2 md:gap-3 rounded-b p-2 md:p-4 bg-white dark:bg-black border border-borderColor dark:border-borderColor-dark shadow">
              <div className="col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-4 xl:col-span-3">
                <Ainput height={"7"} title="Current Service Date" type="date" name="Current_Service_Date" value={formData.Current_Service_Date} handleInputChange={handleInputChange} />
              </div>

              <div className="col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-4 xl:col-span-3">
                <Ainput height={"7"} title="Current Service KM" type="text" name="Current_Service_KM" value={formData.Current_Service_KM} handleInputChange={handleInputChange} />
                {didAttemptUpdate && currentServiceKmError ? <p className="text-xs mt-1 text-red-600">{currentServiceKmError}</p> : null}
              </div>

              <div className="col-span-12 sm:col-span-12 md:col-span-12 lg:col-span-8 xl:col-span-6">
                <Ainput height={"7"} title="Service Remark" type="text" name="Remark" value={formData.Remark} handleInputChange={handleInputChange} />
              </div>
            </div>
          </>
        ) : null}
      </div>

      <HashloaderComponent isLoading={isLoading} />
    </div>
  );
}