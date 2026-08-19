"use client";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import Ainput from "@/components/atoms/Input";
import Fselect from "@/components/atoms/Fselect";
import MediumTitle from "@/components/atoms/MediumTitle";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { useToast } from "@/components/ui/use-toast";
import React, { useEffect, useRef, useState, useMemo } from "react";
import Swal from "sweetalert2";
import SelectSearch from "@/components/atoms/Select";
import { useSearchParams } from "next/navigation";
import DataTable from "@/components/Templates/servicetable";
import { FaTools } from "react-icons/fa";
import { GrUserAdmin } from "react-icons/gr";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import SmallTitle from "@/components/atoms/smallTitle";

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

interface PurchaseReq {
  Basic: string | null;
  HRA: string | null;
  Conveyance: string | null;
  Medical: string | null;
  DA: string | null;
  Washing: string | null;
  Uniform: string | null;
  Created_By: string | null;
}
type CardProps = React.ComponentProps<typeof Card>;
const PurchaseOrder = ({ className, ...props }: CardProps) => {
  const user = useCurrentUser();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const Tran_id1 = searchParams.get("Tran_id1");
  const [tabledata1, setTabledata1] = useState([]);

  function getCurrentDate(monthsBack = 0) {
    const today = new Date();
    today.setMonth(today.getMonth() - monthsBack);
    const year = today.getFullYear();
    let month = today.getMonth() + 1;
    let day = today.getDate();
    if (month < 10) {
      month = "0" + month;
    }
    if (day < 10) {
      day = "0" + day;
    }
    return `${year}-${month}-${day}`;
  }

  const initialPurchaseReq: PurchaseReq = {
    Basic: null,
    HRA: null,
    Conveyance: null,
    Medical: null,
    DA: null,
    Washing: null,
    Uniform: null,
    Created_By: user?.EMPCODE,
  };
  const [formData, setFormData] = useState<PurchaseReq>(initialPurchaseReq);

  const validateMobile = (value) => {
    const regex = /^[0-9]{10}$/;
    return regex.test(value);
  };

  const handleInputChange = (name, value) => {
    const regex = /^\d*\.?\d{0,2}$/;

    if (value === "" || regex.test(value)) {
      // convert to number for comparison
      const numericValue = parseFloat(value || "0");

      // ✅ Check if entered value exceeds 100
      if (numericValue > 100) {
        showSideAlert(`${name} ratio cannot be more than 100`, "error");
        return; // stop updating
      }

      const newFormData = { ...formData, [name]: value };

      // ✅ Calculate total after updating
      const total =
        parseFloat(newFormData.Basic || "0") +
        parseFloat(newFormData.HRA || "0") +
        parseFloat(newFormData.Conveyance || "0") +
        parseFloat(newFormData.Medical || "0") +
        parseFloat(newFormData.DA || "0") +
        parseFloat(newFormData.Washing || "0") +
        parseFloat(newFormData.Uniform || "0")

      // ✅ Prevent total > 100 while typing
      if (total > 100) {
        showSideAlert("Total ratio cannot exceed 100", "error");
        return;
      }

      setFormData(newFormData);
    }
  };

  const columns1 = [
    {
      Header: "Created Date",
      accessor: "Created_At",
      Cell: ({ value }) => {
        if (!value) return "";
        const date = new Date(value);
        return date.toLocaleDateString("en-GB"); // formats as DD/MM/YYYY
      },
    },
    {
      Header: "Basic",
      accessor: "Basic",
    },
    {
      Header: "HRA",
      accessor: "HRA", // accessor matches the key in your data
    },
    {
      Header: "Conveyance",
      accessor: "Conveyance",
    },
    {
      Header: "Medical",
      accessor: "Medical",
    },
    {
      Header: "DA",
      accessor: "DA",
    },
    {
      Header: "Washing",
      accessor: "Washing",
    },
    {
      Header: "Uniform Amt",
      accessor: "Uniform",
    },
    {
      Header: "Created By",
      accessor: "Created_By",
    },
  ];
  const handleTableClick = (row) => { };

  const SaveData = async () => {
    const HRA = parseFloat(formData?.HRA || "0");
    const Conveyance = parseFloat(formData?.Conveyance || "0");
    const Medical = parseFloat(formData?.Medical || "0");
    const DA = parseFloat(formData?.DA || "0");
    const Washing = parseFloat(formData?.Washing || "0");
    const Uniform = parseFloat(formData?.Uniform || "0");
    const Basic = parseFloat(formData?.Basic || "0");

    // Check if any individual value exceeds 100
    if ([HRA, Conveyance, Medical, DA, Washing].some((val) => val > 100)) {
      showSideAlert("Each ratio must not exceed 100", "error");
      return;
    }

    // Check for missing fields
    if ([HRA, Conveyance, Medical, Basic].some((val) => val === 0)) {
      showSideAlert("Kindly fill Basic, HRA, Conveyance, Medical fields", "info");
      return;
    }

    // Calculate total
    const total = HRA + Conveyance + Medical + DA + Washing + Basic + Uniform;

    // Check total sum equals 100
    if (total !== 100) {
      showSideAlert(
        `Total ratio must be exactly 100 (Current total: ${total})`,
        "error"
      );
      return;
    }

    try {
      const result = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/employee/SaveBreakUpRatio`,
        { Formdata: formData },
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
          },
        }
      );

      Swal.fire({
        icon: "success",
        title: `Data Saved Successfully`,
        text: " ...",
      });

      await fetchData()
      setFormData(initialPurchaseReq);
    } catch (err) {
      toast({
        title: `${err.response?.data.message}`,
        variant: "destructive",
      });
      console.log(err);
    }
  };

  const fetchData = async () => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/employee/ViewBreakUpRatio`,
        {},
        {
          headers: {
            compcode: user?.Comp_Code,
          },
        }
      );
      setTabledata1(response.data.Result);
    } catch (error) {
      // Handle the error here
      console.error("An error occurred while fetching data:", error);
      // Optionally, show an error message to the user
    }
  };
  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      <div className="grid grid-cols-12 gap-2 p-2">
        <div className="lg:col-span-6 shadow rounded-lg  dark:bg-primary dark:bg-opacity-10 md:col-span-12 col-span-12">
          <div className="rounded-t bg-white dark:bg-dark mb-0 px-6 py-1">
            <div className="flex flex-col sm:flex-row items-center justify-between py-1">
              <h3 className="flex items-center gap-2 font-bold text-pretty sm:text-xs md:text-base lg:text-base">
                <GrUserAdmin
                  size={34}
                  className="text-gray-700 dark:text-white"
                />
                EMPLOYEEMASTER SALARY BREAK-UP RIGHTS
              </h3>

              {/* Buttons */}
              <div className="flex flex-wrap gap-x-2">
                <Button variant={"print"} onClick={() => window.history.back()}>
                  Back
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-2 p-2">
            <div className="col-span-12  lg:col-span-4  md:col-span-12">
              <Ainput
                handleInputChange={handleInputChange}
                value={formData.Basic}
                type={"number"}
                title="Basic"
                name={"Basic"}
              />
            </div>
            <div className="col-span-12  lg:col-span-4  md:col-span-12">
              <Ainput
                handleInputChange={handleInputChange}
                value={formData.HRA}
                type={"number"}
                title="HRA"
                name={"HRA"}
              />
            </div>
            <div className="col-span-12  lg:col-span-4  md:col-span-12">
              <Ainput
                handleInputChange={handleInputChange}
                value={formData.Conveyance}
                type={"number"}
                title="Conveyance"
                name={"Conveyance"}
              />
            </div>
            <div className="col-span-12  lg:col-span-4  md:col-span-12">
              <Ainput
                handleInputChange={handleInputChange}
                value={formData.Medical}
                type={"number"}
                title="Medical"
                name={"Medical"}
              />
            </div>
            <div className="col-span-12  lg:col-span-4  md:col-span-12">
              <Ainput
                handleInputChange={handleInputChange}
                value={formData.DA}
                type={"number"}
                title="Da"
                name={"DA"}
              />
            </div>
            <div className="col-span-12  lg:col-span-4  md:col-span-12">
              <Ainput
                handleInputChange={handleInputChange}
                value={formData.Washing}
                type={"number"}
                title="Washing"
                name={"Washing"}
              />
            </div>
            <div className="col-span-12  lg:col-span-4  md:col-span-12">
              <Ainput
                handleInputChange={handleInputChange}
                value={formData.Uniform}
                type={"number"}
                title="Uniform Amt"
                name={"Uniform"}
              />
            </div>
          </div>

          <div className=" flex justify-center">
            <Button variant={"save"} className="w-28 my-2" onClick={SaveData}>
              SAVE
            </Button>
          </div>
        </div>

        <div className="col-span-12 xl:col-span-6 h-full">
          <div className="justify-center ">
            <Card className={cn("w-full", className)} {...props}>
              <div className="rounded-t bg-white dark:bg-dark mb-0 px-6 ">
                <div className="grid grid-cols-12 gap-0 p-1 rounded-md">
                  <div className="col-span-12 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="p-1 flex gap-x-2">
                      <GrUserAdmin size={34} className="" title="admin" />
                      <SmallTitle text={"View"} />
                    </div>
                    <Button
                      variant={"print"}
                      onClick={() => window.history.back()}
                    >
                      back
                    </Button>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 md:gap-2 flex"></div>
                </div>
              </div>
              <CardContent className="grid grid-cols-12 gap-0 p-4 rounded-md pb-2 w-full ">
                <div className="col-span-12 xl:col-span-12">
                  <DataTable
                    columns={columns1}
                    data={tabledata1}
                    onRowDoubleClick={handleTableClick}
                    filterPosition="FilterData"
                    numericFilterColumns={[]}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrder;
