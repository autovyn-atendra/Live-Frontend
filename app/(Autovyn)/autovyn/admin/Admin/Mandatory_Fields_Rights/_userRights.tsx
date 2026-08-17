"use client";
import React, { useState, useEffect } from "react";
import ModulesRightsSection from "@/components/Templates/WhatsappRights";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import MediumTitle from "@/components/atoms/MediumTitle";
import axios from "axios";
import Swal from "sweetalert2";
import { GrUserAdmin } from "react-icons/gr";


const UserRightsPage = () => {
  //States

  const [selectedModule, setSelectedModule] = useState(null);

const buildTreeData = (rows) => {
  const grouped = {};

  rows.forEach((row) => {
    if (!grouped[row.misc_code]) {
      grouped[row.misc_code] = {
        title: row.misc_name,
        key: row.misc_code.toString(),
        children: []
      };
    }

    grouped[row.misc_code].children.push({
      title: row.field_Abbr,
      key: `${row.misc_code}|${row.field_name}`
    });
  });

  const modules = Object.values(grouped);

  if (selectedModule) {
    return modules.filter(m => m.key === selectedModule);
  }

  return modules;
};




  const [treeData, setTreeData] = useState([]);

  const user = useCurrentUser();
  const [checkedKeys2, setCheckedKeys2] = useState([]);
  const [expandedKeys2, setExpandedKeys2] = useState([]);
  const onCheck2 = (checkedKeys2) => {
    setCheckedKeys2(checkedKeys2);
  };
  const onExpand2 = (expandedKeys2) => {
    setExpandedKeys2(expandedKeys2);
  };
  useEffect(() => {
    fetchMandFldRgt();
  }, []);

  const fetchMandFldRgt = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_URL}/Master/GetMandFieldsRghts`,
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
            token: user?.email,
          },
        }
      );

      if (response.data.Status === "true") {
        const rows = response.data.Result;

        // build tree
        setTreeData(buildTreeData(rows));

        // ✅ composite checked keys
        const mandatoryKeys = rows
          .filter(
            r =>
              Number(r.IsMandtory) === 1 &&
              r.field_name !== null
          )
          .map(r => `${r.misc_code}|${r.field_name}`);

        setCheckedKeys2(mandatoryKeys);

        // optional: auto-expand all parents
        setExpandedKeys2([...new Set(rows.map(r => r.misc_code))]);
      }
    } catch (error) {
      console.error("Error fetching Mand Fields:", error);
    }
  };



  const SetsaveMandFldRgt = async () => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/master/saveMandFldRgt`,
        {
          checkedKeys2: checkedKeys2, // selected modules/submodules
          compcode: user?.Comp_Code,
        },
        {
          headers: {
            compcode: user?.Comp_Code, // company code
            name: user?.name,          // username
            token: user?.email,        // auth token (email used here)
          },
        }
      );

      if (response.status === 200) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "WhatsApp Rights saved successfully.",
        }).then(() => {
          setCheckedKeys2([]); // clear selections after save
        });

      }

      await fetchMandFldRgt();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error!",
        text:
          error?.response?.data?.message ||
          "Failed to save WhatsApp Rights. Please try again.",
      });
      console.error("Error saving WhatsApp rights:", error);
      throw error;
    } finally {
      await fetchMandFldRgt();
    }
  };


  const handleRefresh = async () => {
    await fetchMandFldRgt()
  }

  

  return (
    <main className="grid grid-cols-12 w-full">
      <div className={`col-span-12 lg:col-span-12`}>
        <div className="w-full px-1">
          <div className="relative flex dark:bg-primary dark:bg-opacity-10 flex-col min-w-0 break-words w-full  shadow-lg rounded-lg bg-blueGray-100 border-0">
            <div className="rounded-t bg-white dark:bg-dark mb-0 px-6">
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <GrUserAdmin size={28} className="text-blue-600" />
                  <MediumTitle text={"Mandatory Fields Rights"} />
                </div>

                {/* Right side: Buttons */}
                <div className="flex items-center gap-2">
                  <Button type="submit" onClick={SetsaveMandFldRgt} variant={"save"}>
                    Save
                  </Button>
                  <Button onClick={handleRefresh} variant={"update"}>
                    Refresh
                  </Button>
                  <Button
                    variant="print"
                    onClick={() => window.history.back()}
                    className="flex items-center gap-1"
                  >
                    Back
                  </Button>
                </div>
              </div>
            </div>
          </div>
          {/* <ModulesRightsSection
            treeData={treeData}
            onCheck={onCheck2}
            onExpand={onExpand2}
            checkedKeys={checkedKeys2}
            expandedKeys={expandedKeys2}
            Title={"Mandtory Fields Rights"}
          /> */}

          <div className="mt-4 space-y-4">
  {treeData.map((module) => (
    <div
      key={module.key}
      className="rounded-t shadow-sm bg-white"
    >
      {/* Module Header */}
      <div
        className="flex justify-between items-center px-4 py-3 cursor-pointer bg-gray-100 rounded-t-xl"
        onClick={() =>
          setExpandedKeys2((prev) =>
            prev.includes(module.key)
              ? prev.filter((k) => k !== module.key)
              : [...prev, module.key]
          )
        }
      >
        <span className="font-semibold text-gray-700">
          {module.title}
        </span>
        <span className="text-sm text-blue-600">
          {expandedKeys2.includes(module.key) ? "-" : "+"}
        </span>
      </div>

      {/* Fields */}
      {expandedKeys2.includes(module.key) && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {module.children.map((field) => (
            <label
              key={field.key}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={checkedKeys2.includes(field.key)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setCheckedKeys2((prev) => [
                      ...prev,
                      field.key,
                    ]);
                  } else {
                    setCheckedKeys2((prev) =>
                      prev.filter((k) => k !== field.key)
                    );
                  }
                }}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">
                {field.title}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  ))}
</div>

        </div>
      </div>
    </main>
  );
};

export default UserRightsPage;
