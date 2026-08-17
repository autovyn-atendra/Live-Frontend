"use client";

import Ainput from "@/components/atoms/Input";
import CustomSelectSearch from "@/components/atoms/Select";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { UserCog } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation";

export default function EmployeeMini() {
   const [employeeCode, setEmployeeCode] = useState("");
   const [loading, setLoading] = useState(false);


   const [employeeOptions, setEmployeeOptions] = useState<any[]>([]);
   const [locationOptions, setLocationOptions] = useState<any[]>([]);
   const [designationOptions, setDesignationOptions] = useState<any[]>([]);
   const router = useRouter();

   const [form, setForm] = useState({
      EMPCODE: "",
      MSPIN: "",
      EMPFIRSTNAME: "",
      EMPLASTNAME: "",
      CORPORATEMAILID: "",
      LOCATION: "",
      EMPLOYEEDESIGNATION: "",
      MOBILE_NO: "",
      Reporting_1: "",
      Reporting_2: "",
      Reporting_3: "",
   });

   // ================= FORM HANDLER =================
   const handleInputChange = (name: string, value: any) => {
      setForm((prev) => ({
         ...prev,
         [name]: value,
      }));
      
   };

   // ================= GENERATE CODE =================
   const generateCode = async () => {
      try {
         setLoading(true);

         const res = await axios.post(
            `${process.env.NEXT_PUBLIC_URL}/employee/generateCode`,
            { branch: "1" },
            {
               headers: {
                  accept: "application/json",
                  compcode: "autovyn",
                  "Content-Type": "application/json",
               },
            }
         );

         if (res.data?.code) {
            setEmployeeCode(res.data.code);
            setForm((prev) => ({
               ...prev,
               EMPCODE: res.data.code,
            }));
         }
      } catch (error) {
         console.error("Generate Code Error:", error);
      } finally {
         setLoading(false);
      }
   };

   // ================= GET MASTERS =================
   const getMasters = async () => {
      try {
         const res = await axios.post(
            `${process.env.NEXT_PUBLIC_URL}/employee/SmEmplMasters`,
            { multi_loc12: "1,2,3" },
            {
               headers: {
                  accept: "application/json",
                  compcode: "autovyn",
                  name: "admin",
                  "Content-Type": "application/json",
               },
            }
         );

         const data = res.data?.data;

         setEmployeeOptions(data?.EMPL || []);
         setLocationOptions(data?.LOCATION || []);
         setDesignationOptions(data?.EMPLOYEEDESIGNATION || []);
      } catch (error) {
         console.error("Masters Error:", error);
      }
   };

   useEffect(() => {
      generateCode();
      getMasters();
   }, []);


   const resetForm = () => {
      setForm({
         EMPCODE: "",
         MSPIN: "",
         EMPFIRSTNAME: "",
         EMPLASTNAME: "",
         CORPORATEMAILID: "",
         LOCATION: "",
         EMPLOYEEDESIGNATION: "",
         MOBILE_NO: "",
         Reporting_1: "",
         Reporting_2: "",
         Reporting_3: "",
      });

      setEmployeeCode(""); // also reset generated code
   };


   const saveEmployee = async () => {
      try {
         const payload = {
            EmpMst: {
               EMPCODE: employeeCode || "",
               MSPIN: form.MSPIN || "",
               EMPFIRSTNAME: form.EMPFIRSTNAME || "",
               EMPLASTNAME: form.EMPLASTNAME || "",
               CORPORATEMAILID: form.CORPORATEMAILID || "",
               LOCATION: form.LOCATION || "",
               EMPLOYEEDESIGNATION: form.EMPLOYEEDESIGNATION || "",
               MOBILE_NO: form.MOBILE_NO || "",
               Reporting_1: form.Reporting_1 || "",
               Reporting_2: form.Reporting_2 || "",
               Reporting_3: form.Reporting_3 || "",
               Export_Type: 1,
               ServerId: 1,
            },
         };

         const res = await axios.post(
            `${process.env.NEXT_PUBLIC_URL}/employee/savemini`,
            payload,
            {
               headers: {
                  accept: "application/json",
                  compcode: "autovyn",
                  name: "admin",
                  "Content-Type": "application/json",
               },
            }
         );

         if (res.data?.success) {
            toast({
               title: "Success",
               description: "Employee saved successfully",
            })

            resetForm();
            generateCode();
         } else {
            toast({
               title: "Error",
               description: "Failed to save employee",
               variant: "destructive",
            })
         }

      } catch (error) {
         toast({
            title: "Error",
            description: "Server Error",
            variant: "destructive",
         })

      }
   };


   return (
      <div className="grid gap-2 p-4 mr-8">


         {/* HEADER */}
         <div className="bg-header flex items-center justify-between rounded-sm px-4 py-2">
            <div className="flex items-center gap-2 text-white font-bold">
               <UserCog className="h-5 w-5" />
               <h1 className="text-xl">Employee Master</h1>
            </div>

            <div className="flex gap-2">
               <Button variant="outline" size="sm" onClick={saveEmployee}>
                  Save
               </Button>

               <Button variant="print" size="sm"  onClick={() => router.back()}>
                  Back
               </Button>
            </div>
         </div>

         {/* FORM GRID */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 p-4 border">

            {/* EMP CODE */}
            <div className="flex gap-4">
               <Ainput
                  title="Emp. Code"
                  type="text"
                  name="EMPCODE"
                  redlabel="*"
                  value={employeeCode}
                  handleInputChange={() => { }}
                  onInput={() => { }}
                  required
                  disabled={true}
               />

               <Button
                  type="button"
                  variant="outline"
                  onClick={generateCode}
                  disabled={loading}
                  className="mt-6"
               >
                  {loading ? "Generating..." : "Generate"}
               </Button>
            </div>

            {/* FIRST NAME */}
            <Ainput
               title="First Name"
               type="text"
               name="EMPFIRSTNAME"
               value={form.EMPFIRSTNAME}
               handleInputChange={handleInputChange}
               redlabel="*"
               onInput={() => { }}
            />

            {/* LAST NAME */}
            <Ainput
               title="Last Name"
               type="text"
               name="EMPLASTNAME"
               value={form.EMPLASTNAME}
               handleInputChange={handleInputChange}
               redlabel="*"
               onInput={() => { }}
            />

            {/* DESIGNATION */}
            <CustomSelectSearch
               title="Designation"
               name="EMPLOYEEDESIGNATION"
               options={designationOptions}
               selectedValue={form.EMPLOYEEDESIGNATION}
               handleInputChange={handleInputChange}
               placeholder="Select Designation"
               readOnly={false}
               redlabel=""
               uppertitle=""
               labelClass=""
            />

            {/* LOCATION */}
            <CustomSelectSearch
               title="Location"
               name="LOCATION"
               options={locationOptions}
               selectedValue={form.LOCATION}
               handleInputChange={handleInputChange}
               placeholder="Select Location"
               readOnly={false}
               redlabel=""
               uppertitle=""
               labelClass=""
            />

            {/* EMAIL */}
            <Ainput
               title="Email"
               type="text"
               name="CORPORATEMAILID"
               value={form.CORPORATEMAILID}
               handleInputChange={handleInputChange}
               onInput={() => { }}
               redlabel="*"
            />


            {/* MOBILE */}
            <Ainput
               title="Mobile Number"
               type="text"
               name="MOBILE_NO"
               value={form.MOBILE_NO}
               handleInputChange={(name, value) => {
                  const onlyNumbers = value.replace(/\D/g, "").slice(0, 10);
                  handleInputChange(name, onlyNumbers);
               }}
               redlabel="*"
               onInput={() => { }}
            />



            {/* MSPIN */}
            <Ainput
               title="MSPIN"
               type="text"
               name="MSPIN"
               value={form.MSPIN}
               handleInputChange={handleInputChange}
               onInput={() => { }}
               // readOnly={false}
               redlabel=""
               // uppertitle=""
               labelClass=""
            />

            {/* REPORTING 1 */}
            <CustomSelectSearch
               title="Reporting 1"
               name="Reporting_1"
               options={employeeOptions}
               selectedValue={form.Reporting_1}
               handleInputChange={handleInputChange}
               placeholder="Select Reporting 1"
               readOnly={false}
               redlabel=""
               uppertitle=""
               labelClass=""
            />

            {/* REPORTING 2 */}
            <CustomSelectSearch
               title="Reporting 2"
               name="Reporting_2"
               options={employeeOptions}
               selectedValue={form.Reporting_2}
               handleInputChange={handleInputChange}
               placeholder="Select Reporting 2"
               readOnly={false}
               redlabel=""
               uppertitle=""
               labelClass=""
            />

            {/* REPORTING 3 */}
            <CustomSelectSearch
               title="Reporting 3"
               name="Reporting_3"
               options={employeeOptions}
               selectedValue={form.Reporting_3}
               handleInputChange={handleInputChange}
               placeholder="Select Reporting 3"
               readOnly={false}
               redlabel=""
               uppertitle=""
               labelClass=""
            />
         </div>
      </div>
   );
}