"use client";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import MediumTitle from "@/components/atoms/MediumTitle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card1";
import axios from "axios";
import { useEffect, useState } from "react";
import { treeData } from "@/constant/modules";
import { OldtreeData } from "@/constant/Oldmodules";
import * as XLSX from "xlsx";
import { GrUserAdmin } from "react-icons/gr";
import Eselect from "@/components/atoms/Eselect";
import HashloaderComponent from "@/components/Templates/hashloader";

export default function App() {
  const user = useCurrentUser();
  const [table, setTable] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    Module: "ALL"
  });
  const getAllTitlesAndKeys = (data) => {
    let results = [];

    for (const node of data) {
      results.push({ title: node.title, key: node.key });

      if (node.children) {
        results = results.concat(getAllTitlesAndKeys(node.children));
      }
    }

    return results;
  };

  const getModuleRights = (data, selectedKey) => {
    let collected = [];

    for (const node of data) {
      if (node.key === selectedKey) {
        collected.push({ title: node.title, key: node.key });

        const traverse = (children) => {
          children?.forEach((child) => {
            collected.push({ title: child.title, key: child.key });
            if (child.children) traverse(child.children);
          });
        };

        if (node.children) traverse(node.children);
      } else if (node.children) {
        collected = collected.concat(getModuleRights(node.children, selectedKey));
      }
    }
    return collected;
  };


  const handleReport = async () => {
    setIsLoading(true)
    try {
      const NewRights = getAllTitlesAndKeys(treeData);
      const OldRights = getAllTitlesAndKeys(OldtreeData);

      const result = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/users/getemployees`,
        {},
        { headers: { compcode: user?.Comp_Code, name: user?.name } }
      );

      const userNames = result.data.map((emp) => emp.User_Name);

      const userRightsResponse = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/users/getuserrights`,
        {},
        { headers: { compcode: user?.Comp_Code, name: user?.name } }
      );

      const userRightsData = userRightsResponse.data.data;

      // ⬇ FILTER LOGIC HERE
      let filteredRights = NewRights;

      if (formData.Module && formData.Module !== "ALL") {
        filteredRights = getModuleRights(treeData, formData.Module);
      }
      const headers = ["Title", ...userNames];

      const dataRows = filteredRights.map((row) => {
        const rowData = user?.id == '1'? [row.title, row.key] : [row.title];

        userNames.forEach((userName) => {
          const userRights = userRightsData.find(
            (user) => user.UserTbl.User_Name === userName
          );

          if (userRights && userRights.userRights.rights.includes(row.key)) {
            rowData.push(row.title);
          } else {
            rowData.push("");
          }
        });

        return rowData;
      });
      setIsLoading(false)

      dataRows.unshift(headers);

      const ws = XLSX.utils.aoa_to_sheet(dataRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "User Rights");

      XLSX.writeFile(wb, "UserRightsReport.xlsx");
    } catch (error) {
      setIsLoading(false)
      console.error("Error generating report:", error);
    } finally {
      setIsLoading(false)
    }
  };


  const fetchEmployees = async () => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/users/getemployees`,
        {},
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
          },
        }
      );
      console.log(response.data);

      // Set employees list (only extracting User_Name)
      if (Array.isArray(response.data)) {
        setEmployees(response.data.map((emp) => emp.User_Name));
      } else {
        setEmployees([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);



  const handleInputChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const sectionOptions = [
    { label: "All", value: "ALL" }, // <-- Add this
    ...treeData.map((item) => ({
      label: item.title,
      value: item.key,
    })),
  ];


  return (
    <div className="grid grid-cols-12 p-2 rounded-md  gap-4">
      <div className="col-span-12 xl:col-span-4  dark:bg-opacity-10 dark:bg-primary shadow rounded-lg">
        <div className="rounded-t bg-white dark:bg-dark mb-0 px-6 py-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GrUserAdmin
              size={28}
              className="text-gray-700 dark:text-white"
            />
            <MediumTitle text={"User Rights Reports"} />
          </div>
          <Button
            variant="print"
            className="flex items-center gap-2"
            onClick={() => window.history.back()}
          >Back
          </Button>
        </div>
        <Card>
          <CardContent>
            <div className="grid grid-cols-12 gap-2 my-2  p-2 items-center">
              <div className="col-span-12 flex justify-center">
                <Eselect
                  title={"Section Name:"}
                  name={"Module"}
                  initialValue={formData.Module?.toString()}
                  option={sectionOptions}
                  handleInputChange={handleInputChange}
                  h={9}
                />
              </div>
              <div className="col-span-12 flex justify-center mt-3">
                <Button
                  onClick={handleReport}
                  variant={"save"}
                  className="w-full"
                >
                  Download
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <HashloaderComponent isLoading={isLoading} />
    </div>
  );
}
