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
  const [loading, setLoading] = useState(false);
  const user = useCurrentUser();
  const [FindRights, setFindRights] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isToggled, setIsToggled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
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

  const setResetFn = async (reload = true) => {
    if (reload) {
      setisResetLoading(true);
    }
    setRightsTemplateSelect("");
    setEmpCodes([]);
    setempCodeList([]);
    setFile(null); // Reset file state
    setCheckedKeys([]);
    setExpandedKeys([]);
    setTemplateName("");
    setDisabled({
      ChangeRights: false,
      RemoveRights: false,
      AddRights: false,
      NewTemplate: false,
      UpdateTemplate: false,
      selectTemplate: false,
    });
    if (reload) {
      setTimeout(() => {
        setisResetLoading(false);
      }, 300);
    }

    // Clear the file input field value using ref
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Clear the file input's value
    }
  };
  // window.location.href = `${process.env.NEXT_PUBLIC_URL
  // }/insurance/ManagerReport?dateFrom=${TODATE}&dateto=${FROMDATE}&compcode=${user?.Comp_Code}&PolicyRenType=${PolicyRenType}&cre=${cre}&branch=${user?.branch}`;

  const handleSearchEmployee = async (name, value) => {
    setCheckedKeys([]);
    if (name == "TemplateName") {
      setTemplateName(value);
      return;
    } else if (name == "RightsTemplate") {
      setTemplateName("");
      setRightsTemplateSelect(value);
    } else {
      setRightsTemplateSelect("");
      setEmpCodes(value);
      setTemplateName("");
      setempCodeList([value]);
    }
    setFile(null); // Reset file state

    // Clear the file input field value using ref
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Clear the file input's value
    }
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/users/MobileRightsGet`,
      { Emp_Code: value, isTemplate: true },
      {
        headers: {
          compcode: user?.Comp_Code,
          name: user?.name,
        },
      }
    );
    console.log(response.data.Result);
    if (response.data.Result.length) {
      // setCheckedKeys(response.data.Result);
      onCheck(response.data.Result);
    } else {
      setCheckedKeys([]);
    }
  };
  const handleSearch = (name, value) => {
    if (name == "empCodes") {
      setEmpCodes(value);
    } else {
      setIsToggled(true);
      setSearchTerm(value);
    }
  };
  const filteredFields = fields.filter((field) =>
    field.Field_Name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  useEffect(() => {
    api();
    tabledataapi();
  }, []);
  useEffect(() => {
    if (RightsTemplateSelect) {
      setDisabled((prev) => ({
        ...prev,
        NewTemplate: true,
      }));
    } else {
      setDisabled((prev) => ({
        ...prev,
        NewTemplate: false,
      }));
    }
  }, [RightsTemplateSelect]);

  useEffect(() => {
    if (empCodeList.length > 1) {
      setDisabled((prev) => ({
        ...prev,
        RemoveRights: false,
        AddRights: false,
        ChangeRights: true,
        NewTemplate: true,
        UpdateTemplate: true,
        selectTemplate: true,
      }));
    } else {
      setDisabled((prev) => ({
        ...prev,
        RemoveRights: true,
        AddRights: true,
        ChangeRights: false,
        selectTemplate: false,
        NewTemplate: true,
        UpdateTemplate: true,
      }));
    }
  }, [empCodeList]);
  useEffect(() => {
    if (checkedKeys.length == 0 && empCodeList.length == 1) {
      setDisabled((prev) => ({
        ...prev,
        NewTemplate: true,
        UpdateTemplate: true,
        selectTemplate: false,
      }));
    } else if (checkedKeys.length != 0 && empCodeList.length == 1) {
      setDisabled((prev) => ({
        ...prev,
        NewTemplate: true,
        UpdateTemplate: true,
        selectTemplate: true,
      }));
    } else if (empCodeList.length == 0) {
      setDisabled((prev) => ({
        ...prev,
        NewTemplate: false,
        UpdateTemplate: false,
        selectTemplate: false,
      }));
    }
  }, [checkedKeys]);

  const api = async () => {
    try {
      const result = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/users/MandatoryFields`,
        {},
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
          },
        }
      );

      setFields(result.data.data || []);
      setRightsTemplate(result.data.RightsTemplate);
      setLoading(false);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      // Handle errors, e.g., display an error message to the user
    }
  };
  const handleCheckboxChange = (id) => {
    setFields(
      fields.map((field) =>
        field.Utd === id
          ? { ...field, Is_Mandatory: !field.Is_Mandatory }
          : field
      )
    );
  };
  const updateUserData = async () => {
    console.log(fields, "userdata");
    setLoading(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/users/MandatoryFieldsUpdate`,
        { fields },
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
  const toggleSection = () => {
    setIsToggled(!isToggled);
  };
  const isKeyInFilteredTreeData = (data: TreeNode[], key: string): boolean => {
    for (const node of data) {
      if (node.key === key) {
        return true;
      }
      if (node.children && isKeyInFilteredTreeData(node.children, key)) {
        return true;
      }
    }
    return false;
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
  const areAllChildrenChecked = (
    node: TreeNode,
    checkedKeys: string[]
  ): boolean => {
    if (!node.children || node.children.length === 0) return false;
    const leafKeys = getLeafKeys(node.children);
    return leafKeys.every((leafKey) => checkedKeys.includes(leafKey));
  };
  const onExpand = (expandedKeys) => {
    setExpandedKeys(expandedKeys);
  };
  const handleClick = `${process.env.NEXT_PUBLIC_URL}/users/MobileRightsDownload?compcode=${user?.Comp_Code}&Rights=${checkedKeys}`;

  const handleProfileDownload = async () => {
    window.location.href = `${process.env.NEXT_PUBLIC_URL}/mobile/EmployeeImagesRar?compcode=${user?.Comp_Code}`;
  };
  const handleSearch2 = (name, value) => {
    setFindRights(value);
    const [filteredData, keys] = filterTreeNodes(treeData, value);
    setExpandedKeys(keys);
    if (!value) setExpandedKeys([]);
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
  // const filterTreeNodes = (
  //   data: TreeNode[],
  //   searchText: string
  // ): [TreeNode[], string[]] => {
  //   let uniqueKeySet = new Set<string>(); // Use a Set to store unique keys

  //   const filteredData = data.reduce((acc: TreeNode[], node: TreeNode) => {
  //     const { title, key, children = [] } = node;
  //     const lowerSearchText = searchText.toLowerCase();
  //     const lowerTitle = title.toLowerCase();

  //     // Check if current node matches
  //     const matches = lowerTitle.includes(lowerSearchText);

  //     // Recursively check children if they match
  //     const [filteredChildren, childKeys] = filterTreeNodes(
  //       children,
  //       searchText
  //     );

  //     // If current node matches or any child matches, include this node
  //     if (matches || filteredChildren.length > 0) {
  //       acc.push({
  //         title: <HighlightText text={title} highlight={searchText} />,
  //         key,
  //         children: filteredChildren,
  //       });

  //       uniqueKeySet.add(key); // Add current key to the set
  //       if (matches) {
  //         setTimeout(() => {
  //           document
  //             .querySelector(`[data-key="${key}"]`)
  //             ?.scrollIntoView({ behavior: "smooth" });
  //         }, 0);
  //       }
  //     }

  //     // Also include all child keys that matched
  //     childKeys.forEach((childKey) => uniqueKeySet.add(childKey));

  //     return acc;
  //   }, []);

  //   return [filteredData, Array.from(uniqueKeySet)]; // Convert Set to array and return
  // };

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

  const handleChange = (event) => {
    setEmpCodes([]);
    setempCodeList([]);
    setCheckedKeys([]);
    setExpandedKeys([]);
    const file = event.target.files[0];
    if (file) {
      const extension = file.name.split(".").pop().toLowerCase();
      if (extension === "xlsx" || extension === "xls") {
        setFile(file);
      } else {
        setFile(null);
        fileInputRef.current.value = "";
        alert("Please select a valid Excel file.");
      }
    }
    const reader = new FileReader();

    reader.onload = (evt) => {
      const data = evt.target?.result;

      // Parse the data using XLSX library
      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0]; // Get the first sheet
      const worksheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      // Extract EMPCODE values from the sheet
      const empCodeList1: string[] = (worksheet as any[]).map((row) =>
        row.EMPCODE?.trim()
      );

      // Join the EMPCODEs as a comma-separated string and set in textarea
      setEmpCodes(empCodeList1.join(", "));
      setempCodeList(empCodeList1);
    };

    reader.onerror = () => {
      alert("There was an error reading the file.");
    };

    reader.readAsBinaryString(file);
  };
  const handleSlectAll = async () => {
    setisSelectALl(true);
    setResetFn(false);
    const empCodeList1: string[] = (EMPLOYEE as any[]).map((row) =>
      row.value?.trim()
    );
    setEmpCodes(empCodeList1.join(", "));
    setempCodeList(empCodeList1);
    setTimeout(() => {
      setisSelectALl(false);
    }, 300);
  };
  const handleButtonClick = async () => {
    const employee = EMPLOYEE.find((item) => item.value == empCodes.toString());

    if (!empCodes) {
      showSideAlert("Please select employee", "error");
      return;
    }
    if (!checkedKeys.length) {
      showSideAlert("Please select rights", "error");
      return;
    }
    setLoading(true);

    const confirmed = await Swal.fire({
      icon: "warning",
      title: "Are you sure?",
      html: `<strong><u>${employee.label}</u></strong><br/>This action will remove all previous rights and give these new rights. Do you want to proceed?`,
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
        `${process.env.NEXT_PUBLIC_URL}/users/MobileRightsUpdate`,
        {
          empCodeList,
          checkedKeys,
          USER_CODE: user?.id,
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
  const ChangeRightsTemplate = async () => {
    // const employee = EMPLOYEE.find(item => item.value == empCodes.toString());

    if (RightsTemplateSelect) {
    } else if (!TemplateName) {
      showSideAlert(
        "Please type in Template Name to save new template",
        "error"
      );
      return;
    }
    if (!checkedKeys.length) {
      showSideAlert("Please select rights", "error");
      return;
    }
    setLoading(true);
    const html = !RightsTemplateSelect
      ? `<strong><u>New ${TemplateName}</u></strong><br/>This action will remove all previous rights and give these new rights. Do you want to proceed?`
      : `Want to update this Template`;

    const confirmed = await Swal.fire({
      icon: "warning",
      title: "Are you sure?",
      html: html,
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
        `${process.env.NEXT_PUBLIC_URL}/users/SaveTemplateMobileRights`,
        {
          empCodeList: [TemplateName],
          checkedKeys,
          USER_CODE: user?.id,
        },
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
          },
        }
      );
      if (response.status === 200) {
        setRightsTemplate(response.data.templates);
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "User updated successfully.",
        }).then(function () {});
      }
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

  const handleAddRights = async () => {
    if (!empCodes) {
      showSideAlert(
        "Please select employee by cliking the select All button or Import excel",
        "error"
      );
      return;
    }
    if (!checkedKeys.length) {
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
        `${process.env.NEXT_PUBLIC_URL}/users/MobileRightsAddExtra`,
        {
          empCodeList,
          checkedKeys,
          USER_CODE: user?.id,
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
  const handleRemoveRights = async () => {
    if (!empCodes) {
      showSideAlert(
        "Please select employee by cliking the select All button or Import excel",
        "error"
      );
      return;
    }
    if (!checkedKeys.length) {
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
      console.log(checkedKeys);
      console.log(empCodeList);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/users/MobileRightsRemoveExtra`,
        {
          empCodeList,
          checkedKeys,
          USER_CODE: user?.id,
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
  const tabledataapi = async () => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/employee/all`,
        {
          branch: user?.branch
        },
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
  const filteredTreeData = filterTreeNodes(treeData, FindRights)[0];
  return (
    <main className="grid grid-cols-12 w-full gap-4">
      <section className="py-1 bg-blueGray-50  col-span-12 lg:col-span-6 ">
        <div className={` col-span-12 lg:col-span-4`}>
          <div className="relative flex  flex-col dark:bg-primary dark:bg-opacity-10 min-w-0 break-words w-full pb-2  shadow-lg rounded-lg bg-blueGray-100 border-0">
            <div className="rounded-t bg-white dark:bg-dark mb-0 px-6 py-1 md:flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GrUserAdmin size={26} className="text-blue-600" />
                <MediumTitle text={"Mobile App Rights"} />
              </div>
              <Button
                variant="print"
                className="flex items-center gap-1"
                onClick={() => window.history.back()}
              >
                Back
              </Button>
            </div>
            <div className="flex flex-col gap-4  h-[540px] py-3 px-3">
              <div className="w-full flex flex-wrap md:flex-nowrap gap-2">
                <div className="flex gap-2 md:w-1/2">
                  <input
                    type="file"
                    className="flex pt-[7px] h-9 w-full  rounded-md dark:bg-input bg-white px-3 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
                    accept=".xlsx, .xls"
                    onChange={handleChange}
                    ref={fileInputRef}
                  />
                  <Button
                    variant={"save"}
                    onClick={setResetFn}
                    loading={isResetLoading}
                  >
                    Reset
                  </Button>
                </div>
                <div className="md:w-1/2 w-full">
                  <FileDownloader
                    text="Download list with Given rights"
                    fileName="Attendance"
                    url={handleClick}
                    className="w-full"
                  />
                </div>
              </div>

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
                <Button
                  variant={"save"}
                  disabled={Disabled.RemoveRights}
                  onClick={handleRemoveRights}
                >
                  Remove Rights
                </Button>
                <Button
                  variant={"save"}
                  disabled={Disabled.ChangeRights}
                  onClick={handleButtonClick}
                >
                  Change Rights
                </Button>
              </div>
              <div className="w-full flex gap-4">
                <Eselect
                  initialValue={RightsTemplateSelect?.toString()}
                  name="RightsTemplate"
                  option={RightsTemplate}
                  handleInputChange={handleSearchEmployee}
                  title={"Select Template"}
                  disabled={Disabled.selectTemplate}
                  h={"9"}
                />
                {/* <Button variant={"save"}
                  disabled={Disabled.ChangeRights}
                  onClick={ChangeRightsTemplate} className="mt-7">
                  Change Rights
                </Button> */}
              </div>
              <div className="w-full flex gap-4 items-end">
                <Ainput
                  type={"text"}
                  title={"Template Name"}
                  name={"TemplateName"}
                  handleInputChange={handleSearchEmployee}
                  value={TemplateName}
                  disabled={Disabled.NewTemplate}
                />
                <Button
                  variant={"save"}
                  onClick={ChangeRightsTemplate}
                  disabled={Disabled.UpdateTemplate}
                >
                  {RightsTemplateSelect ? "Update Tempalte" : "Save Tempalte"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-1 bg-blueGray-50  col-span-12 lg:col-span-6 ">
        <div className={` col-span-12 lg:col-span-4`}>
          <div className="relative flex  flex-col dark:bg-primary dark:bg-opacity-10 min-w-0 break-words w-full  shadow-lg rounded-lg bg-blueGray-100 border-0">
            <div className="rounded-t bg-white dark:bg-dark mb-0 px-6 py-1 md:flex items-center justify-between">
              <div className="flex items-center gap-x-2">
                <GrUserAdmin
                  size={22}
                  className="text-gray-600 dark:text-gray-300"
                />
                <MediumTitle text={"Mobile App Rights"} />
              </div>

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
            </div>
          </div>
        </div>
      </section>
      <section className="py-1 bg-blueGray-50  col-span-12 ">
        <div className="w-full px-1 mt-1">
          <div className="relative flex dark:bg-primary dark:bg-opacity-10 flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded-lg bg-blueGray-100 border-0">
            <div className="rounded-t bg-white dark:bg-dark mb-0 px-6 ">
              <div className="md:flex items-center justify-between py-1">
                <div className="flex">
                  <Button
                    type="button"
                    variant={"outline"}
                    onClick={toggleSection}
                    className="mr-4"
                  >
                    {isToggled ? "-" : "+"}
                  </Button>{" "}
                  <MediumTitle text={"Profile mandatory fields"} />
                </div>
                <div className="flex gap-1 flex-wrap items-center">
                  <div className="flex gap-x-2 items-end mb-2">
                    <Ainput
                      type={"text"}
                      title={""}
                      name={"MP_Remark"}
                      handleInputChange={handleSearch}
                      value={searchTerm}
                      className="ring-1 focus-visible:ring-2"
                    />
                    <Button
                      type="button"
                      variant={"update"}
                      onClick={updateUserData}
                    >
                      Update
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant={"update"}
                    onClick={handleProfileDownload}
                  >
                    Download Profile Images
                  </Button>
                </div>
              </div>
            </div>
            <div
              className={`${
                isToggled ? "max-h-full opacity-100" : "max-h-0 opacity-0"
              } transition-all duration-500 ease-in-out overflow-hidden`}
            >
              <div
                className="flex flex-wrap col-span-12 rounded-lg mb-4 px-6 py-2 overflow-y-scroll"
                style={{
                  maxHeight: "calc(100vh - 150px)",
                }}
              >
                {isLoading ? (
                  <div className="w-full text-center py-4">
                    <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-10 w-10 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading fields...</p>
                  </div>
                ) : (
                  // Display checkboxes when data is loaded
                  filteredFields.map((field) => (
                    <label
                      key={field.Utd}
                      className="w-full sm:w-1/2 lg:w-4/12 xl:w-1/4 cursor-pointer"
                      htmlFor={field.Utd}
                    >
                      <div className="flex items-center h-9 px-5">
                        <div className="dark:bg-input bg-white w-full h-7 px-4 rounded flex items-center">
                          <Checkbox
                            id={field.Utd}
                            name={field.Utd}
                            checked={field.Is_Mandatory}
                            onChange={() => handleCheckboxChange(field.Utd)}
                            className="dark:text-white font-semibold uppercase whitespace-nowrap"
                          />
                          <span className="ml-2 text-gray-700">
                            {field.Field_Name}
                          </span>
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <HashloaderComponent isLoading={loading} />
    </main>
  );
}
