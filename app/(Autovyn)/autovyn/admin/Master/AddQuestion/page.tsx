"use client";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import React, { useEffect, useRef, useState } from "react";
import Ainput from "@/components/atoms/Input";
import { Button } from "@/components/ui/button";
import axios from "axios";
import Swal from "sweetalert2";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { FaUsers } from "react-icons/fa";
import SmallTitle from "@/components/atoms/smallTitle";
import SelectSearch from "@/components/atoms/Select";
import DataTable from "@/components/Templates/ServiceTable";
import MediumTitle from "@/components/atoms/MediumTitle";
import { MdCameraAlt, MdFlipCameraIos } from "react-icons/md";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog2";
import Image from "next/image";
import { useToast } from "@/components/ui/use-toast";
import { Router } from "next/router";
import HashloaderComponent from "@/components/Templates/hashloader";
import AinputDate from "@/components/atoms/dateInput";
type MisspunchData = {
  MP_Date: string;
  Type: number | null;
  In_Time: string | null;
  Out_Time: number | null;
  MP_Reason: number | null;
  MP_Remark: number | null;
  Spl_Remark: string | null;
};

type FormData = {
  Comp_Code: string;
  Created_by: string;
  misspunchData: MisspunchData | null;
};



const columns = [
  { Header: "ID", accessor: "id", width: 10 },
  { Header: "QUESTION", accessor: "Q" },
  { Header: "ANSWER", accessor: "A" },
  {
    Header: "STATUS",
    accessor: "IS_ACTIVE",
    Cell: ({ value }) => (
      <span
        className={`px-2 py-1 rounded text-xs font-bold
        ${value ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
      >
        {value ? "Active" : "Inactive"}
      </span>
    ),
  },
];


//add code ..

const allTypeOptions = [
  { value: "1", label: "Active" },
  { value: "0", label: "Inactive" },
];




const Gatepass = () => {
  const user = useCurrentUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [updateButton, setUpdateButton] = useState(false);
  const [formdata, setFormData] = useState<FormData>({
    user_name: user?.name || "",
    EMPCODE: user?.EMPCODE || "",
    branch: user?.branch || "",
    user_id: user?.id || "",
    Answer: "",
    question: "",
    IsActive: null,
    id: null,
  });


  const [tabledata, setTabledata] = useState([]);

  const [typeOptions, setTypeOptions] = useState(allTypeOptions);
  const handleTableClick = (row: any) => {
    console.log(row, "row");
    setUpdateButton(true)
    setFormData(prev => ({
      ...prev,
      question: row.Q,
      Answer: row.A,
      IsActive: row.IS_ACTIVE ? "1" : "0",  // convert boolean → dropdown value
      id: row.id,
    }));
  };



  const [FROMDATE, setCirrentdate] = useState(
    new Date(new Date().setMonth(new Date().getMonth() - 1))
      .toISOString()
      .substring(0, 10)
  );

  const [TODATE, setOneMonthAgo] = useState(
    new Date().toISOString().substring(0, 10)
  );



  const handleInputChange = (name: string, value: any) => {
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,

    }));
  };


  const handlecurrentdate = (name: string, value: string) => {
    setCirrentdate(value);
  };
  const OneMonthagodate = (name: string, value: string) => {
    setOneMonthAgo(value);
  };

  const submitbtn = async () => {
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/HelpCenter/addFaq`,
        {
          Question: formdata.question,
          Answer: formdata.Answer,
          IsActive: formdata.IsActive === "1" ? true : false // convert string to boolean
        },
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
          },
        }
      );

      Swal.fire("Success", "FAQ saved successfully", "success");
      setFormData({})
      handlefetchData(); // refresh table
    } catch (error) {
      Swal.fire("Error", "Failed to save FAQ", "error");
    }
  };
  const updatebtn = async () => {
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/HelpCenter/updateSupportFaq`,
        {
          Question: formdata.question,
          Answer: formdata.Answer,
          IsActive: formdata.IsActive === "1" ? true : false, // convert string to boolean
          id: formdata.id,
        },
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
          },
        }
      );

      Swal.fire("Success", "FAQ Updated successfully", "success");
      setFormData({})
      handlefetchData(); // refresh table
    } catch (error) {
      Swal.fire("Error", "Failed to update FAQ", "error");
    }
  };


  const handlefetchData = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_URL}/HelpCenter/getFaqList`,
        {
          headers: {
            compcode: user?.Comp_Code,
          },
        }
      );
      if (res.data.Status) {
        setTabledata(res.data.Data);
      }
    } catch (error) {
      Swal.fire("Error", "Failed to load FAQ list", "error");
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <main className="grid grid-cols-12 gap-2">

      <div className="col-span-12 rounded-t bg-header dark:bg-black px-2 md:px-6 py-2 border dark:border-borderColor-dark">
        <div className="flex    justify-between ">
          <h1 className="font-bold sm:text-sm md:text-lg lg:text-xl text-white dark:text-[#37a9dd] flex items-center gap-x-3 uppercase">
            <Image src="/Payrollicon/mispunch_request.png" alt="Autovyn" width={25} height={25} />
            FAQ
          </h1>
          <div className="flex gap-2">

            <Button variant="print" onClick={() => window.history.back()}>
              Back
            </Button>
          </div>
        </div>
      </div>


      <div className="col-span-12 lg:col-span-4 gap-2 md:gap-3  rounded-b p-2 md:p-4 bg-white dark:bg-black border border-borderColor dark:border-borderColor-dark shadow">
        <div className="">
          <Card className={cn("w-full")}>
            <div className=" flex gap-2 mb-4 py-1 px-1 items-center justify-end">
              {!updateButton && (<div className="flex items-center justify-end">
                {/* <SmallTitle text={` REQUEST`} /> */}
                <Button
                  variant={"save"}
                  className="cursor-pointer"
                  onClick={submitbtn}
                >
                  SAVE{" "}
                </Button>
              </div>)}

              {updateButton && (<div className="flex items-center justify-end">
                {/* <SmallTitle text={` REQUEST`} /> */}
                <Button
                  variant={"save"}
                  className="cursor-pointer"
                  onClick={updatebtn}
                >
                  Update{" "}
                </Button>
              </div>)}


              <div className="flex items-center justify-end">
                {/* <SmallTitle text={` REQUEST`} /> */}
                <Button
                  variant={"print"}
                  className="cursor-pointer"
                  onClick={() => window.location.reload()}
                >
                  Reset
                </Button>
              </div>

            </div>
            <CardContent className="grid grid-cols-12  ">


              <div className="col-span-12 xl:col-span-12 md:col-span-12 md:gap-2">
                <div className="p-1">
                  <Ainput
                    type={"text"}
                    title={"Add Question"}
                    name={"question"}
                    handleInputChange={handleInputChange}
                    value={formdata?.question}
                    ShortName={true}

                  />
                </div>
              </div>
              <div className="col-span-12 xl:col-span-12 md:col-span-12 md:gap-2">
                <div className="p-1">
                  <Ainput
                    type={"text"}
                    title={"Add Answer"}
                    name={"Answer"}
                    handleInputChange={handleInputChange}
                    value={formdata?.Answer}
                    ShortName={true}

                  />
                </div>
              </div>

              <div className="col-span-12 xl:col-span-12 md:col-span-12 md:gap-2">
                <div className="p-1">
                  <SelectSearch
                    title="IsActive"
                    options={typeOptions}
                    name="IsActive"
                    selectedValue={formdata.IsActive?.toString()}
                    handleInputChange={handleInputChange}
                  />
                </div>
              </div>


            </CardContent>
          </Card>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-8">
        <div className="justify-center ">
          <Card className={cn("w-full")}>

            <CardContent className="grid grid-cols-12 w-full gap-2 md:gap-3 p-2 md:p-4 rounded-b bg-white dark:bg-black border border-borderColor dark:border-borderColor-dark shadow">
              <div className="col-span-6 lg:col-span-3 md:col-span-3 sm:col-span-6">
                <Ainput
                  value={FROMDATE}
                  name="FROMDATE"
                  type={"date"}
                  title={"Date From"}
                  handleInputChange={handlecurrentdate}
                />
              </div>
              <div className="col-span-6 lg:col-span-3 md:col-span-3 sm:col-span-6 ">
                <Ainput
                  value={TODATE}
                  name="TODATE"
                  type={"date"}
                  title={"Date To "}
                  handleInputChange={OneMonthagodate}
                />
              </div>
              <div className="col-span-12  lg:col-span-2 md:col-span-3 sm:col-span-6">
                <Button
                  variant={"save"}
                  className="mt-6 "
                  onClick={handlefetchData}
                >
                  Show Data
                </Button>
              </div>

            </CardContent>
            <div className="col-span-12 xl:col-span-12 mt-2 gap-2 md:gap-3 p-2 md:p-4  rounded-b   bg-white dark:bg-black border border-borderColor dark:border-borderColor-dark shadow">
              <DataTable
                columns={columns}
                data={tabledata}
                onRowDoubleClick={handleTableClick}
                filterPosition="FilterData"
                numericFilterColumns={[]}
                height={"450px"}
              />
            </div>

          </Card>
        </div>
        <HashloaderComponent isLoading={isLoading} />

      </div>
    </main>
  );
};

export default Gatepass;
