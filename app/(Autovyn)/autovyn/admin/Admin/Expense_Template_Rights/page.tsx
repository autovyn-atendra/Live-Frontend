"use client";
import { useEffect, useRef, useState } from "react";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import axios from "axios";
import { Checkbox } from "antd";
import MediumTitle from "@/components/atoms/MediumTitle";
import { Button } from "@/components/ui/button";
import HashloaderComponent from "@/components/Templates/hashloader";
import Swal from "sweetalert2";
import Ainput from "@/components/atoms/Input";
import { treeData } from "@/constant/MobileAppRights";
import { Tree } from "antd";
import * as XLSX from "xlsx";
import ATextArea from "@/components/atoms/textArea";
import Eselect from "@/components/atoms/Eselect";
import FileDownloader from "@/components/atoms/FileDownloader";
import BranchRightsSection from "@/components/Templates/branchrightssection";
import { onlybranch } from "@/action/branch";
import { GrUserAdmin } from "react-icons/gr";

type TreeNode = {
  title: string;
  key: string;
  children?: TreeNode[];
};
function showSideAlert(message, type) {
  const Toast = Swal.mixin({
    toast: true,
    position: "bottom-end",
    showConfirmButton: false,
    timer: 4000,
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

export default function MandatoryFields() {
  const [fields, setFields] = useState([]);
  const [Expense, setExpense] = useState([]);
  const [selectedExpense, setSelectedExpense] = useState([]);
  const [loading, setLoading] = useState(false);
  const user = useCurrentUser();
  const [FindRights, setFindRights] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isToggled, setIsToggled] = useState(true);
  const [isResetLoading, setisResetLoading] = useState(false);
  const [isSelectALl, setisSelectALl] = useState(false);
  const [excelfile, setFile] = useState();
  let fileInputRef = useRef(null);

  const [checkedKeys, setCheckedKeys] = useState([]);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [empCodes, setEmpCodes] = useState<string>("");
  const [empCodeList, setempCodeList] = useState([]);
  const [RightsTemplate, setRightsTemplate] = useState([]);
  const [RightsTemplateSelect, setRightsTemplateSelect] = useState("");
  const [TemplateName, setTemplateName] = useState("");
  const [EMPLOYEE, setEMPLOYEE] = useState([]);
  const [Disabled, setDisabled] = useState({
    ChangeRights: false,
    RemoveRights: false,
    AddRights: false,
    selectTemplate: false,
    NewTemplate: false,
    UpdateTemplate: false,
  });

  useEffect(() => {
    fetchbranch();
    tabledataapi();
  }, []); // Empty dependency array ensures this effect runs only once after the initial render

  const tabledataapi = async () => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/employee/all`,
        {},
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
          },
        }
      );
      setEMPLOYEE(response.data?.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const fetchbranch = async () => {
    try {
      const response = await onlybranch(user);
      const response1 = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/ExpenseAprvl/Alltemplates`,
        { EMPCODE: "" },
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
            token: user?.email,
          },
        }
      );
      setExpense(response1.data.data);
    } catch (err) {
      console.log(err);
    }
  };

  const areAllChildrenChecked = (
    node: TreeNode,
    checkedKeys: string[]
  ): boolean => {
    if (!node.children || node.children.length === 0) return false;
    const leafKeys = getLeafKeys(node.children);
    return leafKeys.every((leafKey) => checkedKeys.includes(leafKey));
  };

  const getLeafKeys = (data: TreeNode[]): string[] => {
    let leafKeys: string[] = [];
    data.forEach((node) => {
      if (node.children && node.children.length > 0) {
        leafKeys = [...leafKeys, ...getLeafKeys(node.children)];
      } else {
        leafKeys.push(node.key);
      }
    });
    return leafKeys;
  };

  const handleCheckboxChangeExpense = (Code) => {
    const updatedSelection = selectedExpense.includes(Code)
      ? selectedExpense.filter((code) => code !== Code)
      : [...selectedExpense, Code];
    setSelectedExpense(updatedSelection);
  };

  const handleSelectAllChangeExpense = () => {
    const allGodwCodes = Expense.map((branch) => branch.Code);
    setSelectedExpense(
      selectedExpense.length === allGodwCodes.length ? [] : allGodwCodes
    );
  };

  const onCheck = (newCheckedKeys: any) => {
    console.log(newCheckedKeys);
    // const prevCheckedKeysNotInFilter = checkedKeys.filter(
    //   (key) => !newCheckedKeys.includes(key)
    // );
    const prevCheckedKeysNotInFilter = checkedKeys?.filter(
      (key) =>
        !newCheckedKeys.includes(key) &&
        !isKeyInFilteredTreeData(filteredTreeData, key)
    );
    const mergedKeys = [
      ...new Set([...newCheckedKeys, ...prevCheckedKeysNotInFilter]),
    ];
    console.log(mergedKeys);
    const finalCheckedKeys: string[] = [];

    const recursiveCheck = (nodes: TreeNode[]) => {
      nodes.forEach((node) => {
        if (node.children && node.children.length > 0) {
          if (areAllChildrenChecked(node, mergedKeys)) {
            finalCheckedKeys.push(node.key);
            const leafKeys = getLeafKeys(node.children || []);
            finalCheckedKeys.push(...leafKeys);
          } else {
            recursiveCheck(node.children);
          }
        } else {
          if (mergedKeys.includes(node.key)) {
            finalCheckedKeys.push(node.key);
          }
        }
      });
    };

    recursiveCheck(treeData);

    setCheckedKeys(finalCheckedKeys);
  };

  const fetchUserDataForExpense = async (value: string) => {
    try {
      console.log(value, "valuevalue");
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/users/expense/${value}`,
        {},
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
            token: user?.email,
          },
        }
      );

      console.log(response.data, "response.data");
      return response.data.data;
    } catch (error) {
      // Handle the error here
      console.error("An error occurred while fetching data:", error);
      // You can return null or throw the error depending on your requirements
      throw error; // Throwing the error to propagate it to the caller
    }
  };

  const handleSearchEmployee = async (name, value) => {
    setSelectedExpense([]);
    setRightsTemplateSelect("");
    setEmpCodes(value);
    setTemplateName("");
    setempCodeList([value]);

    setFile(null); // Reset file state

    // Clear the file input field value using ref
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Clear the file input's value
    }
    console.log(value, "value");
    const data = await fetchUserDataForExpense(value);

    const parsedSelectedexpense = data.Multi_Cash.split(",").map(Number);
    setSelectedExpense(parsedSelectedexpense || []);
  };
  const handleSearch = (name, value) => {
    if (name == "empCodes") {
      setEmpCodes(value);
    } else {
      setIsToggled(true);
      setSearchTerm(value);
    }
  };

  const handleSlectAll = async () => {
    setSelectedExpense([]);
    setisSelectALl(true);
    const empCodeList1: string[] = (EMPLOYEE as any[]).map((row) =>
      row.value?.trim()
    );
    setEmpCodes(empCodeList1.join(", "));
    setempCodeList(empCodeList1);
    setTimeout(() => {
      setisSelectALl(false);
    }, 300);
  };

  const handleAddRights = async () => {
    if (!empCodes) {
      showSideAlert(
        "Please select employee by cliking the select All button or Import excel",
        "error"
      );
      return;
    }
    if (!selectedExpense.length) {
      showSideAlert("Please select rights to Add", "error");
      return;
    }
    setLoading(true);
    const confirmed = await Swal.fire({
      icon: "warning",
      title: "Add Rights?",
      html: `<strong><u>${empCodeList.length} Employees for Rights Addition </u></strong><br/>This action will Add new rights and it will not affect any previous given rights. Do you want to proceed?`,
      confirmButtonText: "OK",
      cancelButtonText: "Cancel",
      showCancelButton: true,
    });
    if (!confirmed.isConfirmed) {
      setLoading(false);
      return;
    }
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/users/ExpenseRightsAddExtra`,
        {
          empCodeList,
          selectedExpense,
        },
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
          },
        }
      );
      if (response.status === 200) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "User updated successfully.",
        }).then(function () {});
      }

      setSelectedExpense([]);
    } catch (error) {
      setLoading(false);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Failed to update user. Please try again.",
      });
      console.error("Error updating user data:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  const handleRemoveRights = async () => {
    if (!empCodes) {
      showSideAlert(
        "Please select employee by cliking the select All button or Import excel",
        "error"
      );
      return;
    }
    if (!selectedExpense.length) {
      showSideAlert("Please select rights to Remove", "error");
      return;
    }
    setLoading(true);
    const confirmed = await Swal.fire({
      icon: "warning",
      title: "Remove rights?",
      html: `<strong><u>${empCodeList.length} Employees for Rights Addition </u></strong><br/>This action will remove new rights. Do you want to proceed?`,
      confirmButtonText: "OK",
      cancelButtonText: "Cancel",
      showCancelButton: true,
    });
    if (!confirmed.isConfirmed) {
      setLoading(false);
      return;
    }
    try {
      console.log(selectedExpense);
      console.log(empCodeList);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/users/ExpenseRightsRemoveExtra`,
        {
          empCodeList,
          selectedExpense,
        },
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
          },
        }
      );
      if (response.status === 200) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "User updated successfully.",
        }).then(function () {});
      }
      setSelectedExpense([]);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Failed to update user. Please try again.",
      });
      console.error("Error updating user data:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const HighlightText: React.FC<HighlightProps> = ({ text, highlight }) => {
    const regex = new RegExp(`(${highlight})`, "gi");
    const parts = text.split(regex);

    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={i} style={{ backgroundColor: "yellow" }}>
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };
  const filterTreeNodes = (
    data: TreeNode[],
    searchText: string
  ): [TreeNode[], string[]] => {
    let uniqueKeySet = new Set<string>(); // Use a Set to store unique keys

    const filteredData = data.reduce((acc: TreeNode[], node: TreeNode) => {
      const { title, key, children = [] } = node;
      const lowerSearchText = searchText.toLowerCase();
      const lowerTitle = title.toLowerCase();

      // Check if current node matches
      const matches = lowerTitle.includes(lowerSearchText);

      // Recursively check children if they match
      const [filteredChildren, childKeys] = filterTreeNodes(
        children,
        searchText
      );

      // If current node matches or any child matches, include this node
      if (matches || filteredChildren.length > 0) {
        acc.push({
          title: <HighlightText text={title} highlight={searchText} />,
          key,
          children: filteredChildren,
        });

        uniqueKeySet.add(key); // Add current key to the set

        // Only execute on the client side
        if (typeof document !== "undefined" && matches) {
          setTimeout(() => {
            document
              .querySelector(`[data-key="${key}"]`)
              ?.scrollIntoView({ behavior: "smooth" });
          }, 0);
        }
      }

      // Also include all child keys that matched
      childKeys.forEach((childKey) => uniqueKeySet.add(childKey));

      return acc;
    }, []);

    return [filteredData, Array.from(uniqueKeySet)]; // Convert Set to array and return
  };

  const handleSearch2 = (name, value) => {
    setFindRights(value);
    const [filteredData, keys] = filterTreeNodes(treeData, value);
    setExpandedKeys(keys);
    if (!value) setExpandedKeys([]);
  };

  const onExpand = (expandedKeys) => {
    setExpandedKeys(expandedKeys);
  };

  const filteredTreeData = filterTreeNodes(treeData, FindRights)[0];

  return (
    <main className="grid grid-cols-12 w-full gap-4">
      <section className="py-1 bg-blueGray-50  col-span-12 lg:col-span-6 ">
        <div className={` col-span-12 lg:col-span-4`}>
          <div className="relative flex  flex-col dark:bg-primary dark:bg-opacity-10 min-w-0 break-words w-full pb-2  shadow-lg rounded-lg bg-blueGray-100 border-0">
            <div className="rounded-t bg-white dark:bg-dark mb-0 px-6 py-1 md:flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GrUserAdmin size={28} className="text-blue-600" />
                <MediumTitle text={"Expense Management Template Rights"} />
              </div>
              <div>
                <Button
                  variant="print"
                  onClick={() => window.history.back()}
                  className="flex items-center gap-1"
                >
                  Back
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-4  h-[390px] py-3 px-3">
              <div className="w-full">
                <ATextArea
                  rows={3}
                  className="w-full dark:bg-primary dark:bg-opacity-10"
                  title="Emp Codes"
                  name="empCodes"
                  value={empCodes}
                  handleInputChange={handleSearch}
                  disabled={true}
                />
                {empCodeList.length} - Employees
              </div>
              <div className="w-full flex gap-4">
                <Eselect
                  initialValue={empCodes?.toString()}
                  name="employee"
                  option={EMPLOYEE}
                  handleInputChange={handleSearchEmployee}
                  title={"Select employee"}
                  h={"9"}
                />
                <Button
                  variant={"save"}
                  className="mt-7"
                  onClick={handleSlectAll}
                  loading={isSelectALl}
                  disabled={isSelectALl}
                >
                  Select All
                </Button>
              </div>

              <div className="w-full flex flex-wrap gap-2">
                <Button
                  variant={"save"}
                  disabled={Disabled.AddRights}
                  onClick={handleAddRights}
                >
                  Add Rights
                </Button>
                {/* <Button
                  variant={"save"}
                  disabled={Disabled.RemoveRights}
                  onClick={handleRemoveRights}
                >
                  Remove Rights
                </Button> */}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-1 bg-blueGray-50  col-span-12 lg:col-span-6 ">
        {/* <div className="rounded-t bg-white dark:bg-dark mb-0 px-6 py-1 md:flex items-center justify-between">
              <MediumTitle text={"Expense Management Template Rights"} />
              <div className="flex items-center">
                <div className="flex gap-x-2 items-end px-4 md:px-1 mb-2">
                  <Ainput
                    className="ring-1 focus-visible:ring-2"
                    type={"text"}
                    title={""}
                    name={"MobileApprights"}
                    handleInputChange={handleSearch2}
                    value={FindRights}
                  />
                </div>
              </div>
            </div>
            <div className="flex-auto px-8 lg:px-10 py-14 pt-0  h-[540px] overflow-y-scroll">
              <Tree
                showLine
                checkable
                onCheck={onCheck}
                onExpand={onExpand}
                checkedKeys={checkedKeys}
                expandedKeys={expandedKeys}
                treeData={filteredTreeData}
                className="bg-off bg-opacity-0 dark:text-white text-center items-center py-8 gap-4 font-semibold text-md uppercase"
              /> 
  </div> */}

        <BranchRightsSection
          data={Expense}
          selected={selectedExpense}
          handleCheckbox={handleCheckboxChangeExpense}
          SelectAllChange={handleSelectAllChangeExpense}
          Title={"Expense Templates"}
        />
      </section>
      <HashloaderComponent isLoading={loading} />
    </main>
  );
}
