"use client";

import Ainput from "@/components/atoms/Input";
import CustomSelectSearch from "@/components/atoms/Select";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { UserCog } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import HashloaderComponent from "@/components/Templates/hashloader";


type FormType = {
  SRNO: string;
  EMPCODE: string;
  MSPIN: string;
  EMPFIRSTNAME: string;
  EMPLASTNAME: string;
  CORPORATEMAILID: string;
  LOCATION: string;
  EMPLOYEEDESIGNATION: string;
  MOBILE_NO: string;
  Reporting_1: string;
  Reporting_2: string;
  Reporting_3: string;
};

export default function EmployeeUpdate() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<FormType>({
    SRNO: "",
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

  const [employeeOptions, setEmployeeOptions] = useState<any[]>([]);
  const [locationOptions, setLocationOptions] = useState<any[]>([]);
  const [designationOptions, setDesignationOptions] = useState<any[]>([]);

  // ================= HANDLE INPUT =================
  const handleChange = (name: string, value: any) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ================= GET MASTER DATA =================
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
    } catch (err) {
      console.log(err);
    }
  };

  // ================= FETCH BY ID =================
  const fetchEmployee = async (empId: string) => {
    try {
      setLoading(true);

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/employee/mini/${empId}`,
        {},
        {
          headers: {
            accept: "application/json",
            compcode: "autovyn",
            name: "admin",
          },
        }
      );

      const data = res.data?.data?.EmpMst;

      if (res.data?.success && data) {
        setForm(data);

        toast({
          title: "Success",
          description: "Employee data loaded",
        });
      } else {
        toast({
          title: "Error",
          description: "No data found",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.log(err);
      toast({
        title: "Error",
        description: "Failed to fetch employee",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ================= UPDATE =================
  const handleUpdate = async () => {
    try {
      const payload = {
        Created_by: "ma0019",
        EmpMst: form,
      };

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/employee/updatemini/${id}`,
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
          description: "Employee updated successfully",
        });

        router.push("/autovyn/employee-master/employee_view");
      } else {
        toast({
          title: "Error",
          description: res.data?.Message || "Update failed",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Server error",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (id) fetchEmployee(id);
    getMasters();
  }, [id]);

  if (loading) return <HashloaderComponent isLoading={loading} /> ;

  return (
    <div className="grid gap-2 p-4 mr-8">

      {/* HEADER */}
      <div className="bg-header flex items-center justify-between rounded-sm px-4 py-2">
        <div className="flex items-center gap-2 text-white font-bold">
          <UserCog className="h-5 w-5" />
          <h1 className="text-xl">Update Employee</h1>
        </div>

        <div className="flex gap-2">
          <Button size="sm" onClick={handleUpdate} variant='outline'>
            Update
          </Button>

          <Button variant="print" size="sm" onClick={() => router.back()}>
            Back
          </Button>
        </div>
      </div>

      {/* FORM */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 border p-4">

        <Ainput
          title="Emp Code"
          name="EMPCODE"
          value={form.EMPCODE}
          handleInputChange={handleChange}
          redlabel="*"
          disabled
        />

        <Ainput
          title="First Name"
          name="EMPFIRSTNAME"
          value={form.EMPFIRSTNAME}
          handleInputChange={handleChange}
          redlabel="*"
        />

        <Ainput
          title="Last Name"
          name="EMPLASTNAME"
          value={form.EMPLASTNAME}
          handleInputChange={handleChange}
          redlabel="*"
        />

        <CustomSelectSearch
          title="Designation"
          name="EMPLOYEEDESIGNATION"
          options={designationOptions}
          selectedValue={form.EMPLOYEEDESIGNATION}
          handleInputChange={handleChange}
          placeholder="Select Designation"
        />

        <CustomSelectSearch
          title="Location"
          name="LOCATION"
          options={locationOptions}
          selectedValue={form.LOCATION}
          handleInputChange={handleChange}
          placeholder="Select Location"
          redlabel="*"
        />

        <Ainput
          title="Email"
          name="CORPORATEMAILID"
          value={form.CORPORATEMAILID}
          handleInputChange={handleChange}
        />

        <div className="flex gap-4">
          <Ainput
            title="Mobile"
            name="MOBILE_NO"
            value={form.MOBILE_NO}
            handleInputChange={(name, value) => {
              const onlyNumbers = value.replace(/\D/g, "").slice(0, 10);
              handleChange(name, onlyNumbers);
            }}
          />

          <Ainput
            title="MSPIN"
            name="MSPIN"
            value={form.MSPIN}
            handleInputChange={handleChange}
          />
        </div>

        <CustomSelectSearch
          title="Reporting 1"
          name="Reporting_1"
          options={employeeOptions}
          selectedValue={form.Reporting_1}
          handleInputChange={handleChange}
          placeholder="Select Reporting 1"
        />

        <CustomSelectSearch
          title="Reporting 2"
          name="Reporting_2"
          options={employeeOptions}
          selectedValue={form.Reporting_2}
          handleInputChange={handleChange}
          placeholder="Select Reporting 2"
        />

        <CustomSelectSearch
          title="Reporting 3"
          name="Reporting_3"
          options={employeeOptions}
          selectedValue={form.Reporting_3}
          handleInputChange={handleChange}
          placeholder="Select Reporting 3"
        />
      </div>
      <HashloaderComponent isLoading={loading} />

    </div>
  );
}