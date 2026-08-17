"use client";

import DataTable from "@/components/Templates/ServiceTable";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { useEffect, useState } from "react";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import HashloaderComponent from "@/components/Templates/hashloader";
import { useRouter } from "next/navigation";
import SelectSearch from "@/components/atoms/Select";
import MediumTitle from "@/components/atoms/MediumTitle";
import { useFormData } from "../Context/FormDataContext";
import Fselect from "@/components/atoms/Fselect";
import { GrUserAdmin } from "react-icons/gr";
import PaginatedTable from "@/components/Templates/PaginatedTable";
import Eselect from "@/components/atoms/Eselect";

const columns = [
    { Header: "Channel", accessor: "Channel" },
  { Header: "Cluster", accessor: "Cluster" },
  { Header: "Branch", accessor: "Branch" },
  { Header: "Employee Code", accessor: "EMPCODE" },
  { Header: "Employee Name", accessor: "emp_name" },
  { Header: "Approver1 A", accessor: "approver1_A" },
  { Header: "Approver1 Name", accessor: "approver1_Aname" },
  { Header: "Approver1B", accessor: "approver1_B" },
  { Header: "Approver1B Name", accessor: "approver1_Bname" },
  { Header: "Approver2A", accessor: "approver2_A" },
  { Header: "Approver2A Name", accessor: "approver2_Aname" },
  { Header: "Approver2B", accessor: "approver2_B" },
  { Header: "Approver2B Name", accessor: "approver2_Bname" },
  { Header: "Approver3A", accessor: "approver3_A", align: "right" },
  { Header: "Approver3A Name", accessor: "approver3_Aname", align: "right" },
  { Header: "Approver3B", accessor: "approver3_B", align: "right" },
  { Header: "Approver3B Name", accessor: "approver3_Bname", align: "right" },
];

const Table1 = () => {
  const user = useCurrentUser();
  const [branch, setBranch] = useState([]);
  const [tabledata, setTabledata] = useState([]);
  const [Options, setOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { formData, setFormData } = useFormData();
  const [form, setForm] = useState({
    Module_Code: "",
    branch: "",
     includeLeft: "0",
  });

  useEffect(() => {
    if (user?.branch) {
      api();
    }
    console.log(user, "auasdiuasd");
  }, [user?.branch]);

  const api = async () => {
    try {
      const result = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/users/BranchApi`,
        {
          multi_loc: user?.branch,
        },
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
          },
        }
      );
      console.log("API Response:", result.data);
      setBranch(result.data.branchMisc);
      setOptions(result.data.Options);
      setForm((prevData) => ({
        ...prevData,
        branch: result.data?.branchMisc[0]?.value,
        Module_Code: result.data.Options[0]?.value,
      }));
    } catch (error) {
      console.error("Error fetching data:", error);
      // Handle errors, e.g., display an error message to the user
    }
  };

  const handleChange = (name, value) => {
  if (Array.isArray(value)) {
    value = value[0]; // 👈 take only first value
  }

  setForm((prev) => ({
    ...prev,
    [name]: value,
  }));
};

  const data = async () => {
    setIsLoading(true);
    console.log({
      branch: form.branch,
      Module_Code: form.Module_Code,
    });
    try {
      const result = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/users/findMatrixEmployees`,
        {
          branch: form.branch,
          Module_Code: form.Module_Code,
          includeLeft: form.includeLeft,
        },
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
          },
        }
      );
      console.log(result.data);
      setTabledata(result.data.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };
  const router = useRouter();

  const onDoubleClick = async (row) => {
    setFormData({ Emp_code: row.EMPCODE });
    router.push("/autovyn/admin/Admin/approvalrights");
    console.log(row.EMPCODE);
    // console.log(formData)
  };

  return (
    <div className="grid grid-cols-12">
      <div className="col-span-12 gap-2">
        <div className="rounded-t w-full bg-white dark:bg-dark mb-0 py-1 px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1">
            <GrUserAdmin
                size={22}
                className="text-gray-700 dark:text-gray-300"
              />
              <MediumTitle text="Hierarchy Window" />
            </div>
            <Button
              variant="print"
              onClick={() => window.history.back()}
              className="flex items-center gap-1"
            >
              Back
            </Button>
          </div>
        </div>
       <div className="flex gap-2 p-3 dark:bg-primary dark:bg-opacity-10 items-end">
          <div className="w-1/4">
            <Fselect
              title="Module"
              name={"Module_Code"}
              initialValue={form.Module_Code}
              option={Options}
              handleInputChange={handleChange}
              isSelectAll={false}
            />
          </div>
          <div className="w-1/4">
            <Fselect
              title="branch"
              option={branch}
              handleInputChange={handleChange}
              initialValue={form.branch}
              name={"branch"}
              isSelectAll={true}
            />
          </div>
          <div className="w-1/4 mb-2">
  <Eselect
    title="Left Employees"
    name={"includeLeft"}
    initialValue={form.includeLeft}
    option={[
       { label: "Exclude Left Employees", value: "0" },
      { label: "Include Left Employees", value: "1" },
     
    ]}
    handleInputChange={handleChange}
  h={9}
  />
</div>

          <div className="w-1/4">
            <Button size={"default"} variant={"update"} onClick={data}>
              show
            </Button>
          </div>
        </div>
      </div>
      <div className="col-span-12 gap-2 p-3 dark:bg-primary dark:bg-opacity-10 ">
        <PaginatedTable
          columns={columns}
          data={tabledata}
          onRowDoubleClick={onDoubleClick}
          filterPosition="FilterData"
          numericFilterColumns={[]}
        />
      </div>
      <HashloaderComponent isLoading={isLoading} />
    </div>
  );
};

export default Table1;
