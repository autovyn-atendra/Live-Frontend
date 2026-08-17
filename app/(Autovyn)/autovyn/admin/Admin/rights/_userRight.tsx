"use client";
import Swal from "sweetalert2";
import React, { useState, useEffect, useRef } from "react";
import Ainput from "@/components/atoms/Input";
import axios from "axios";
import BranchRightsSection from "@/components/Templates/branchrightssection";
import ModulesRightsSection from "@/components/Templates/ModulesRightsSection";
import SelectSearch from "@/components/atoms/Select";
import { treeData } from "@/constant/modules";
import { UbR } from "@/constant/userbasedRights";
import SmallTitle from "@/components/atoms/smallTitle";
import MediumTitle from "@/components/atoms/MediumTitle";
import { Button } from "@/components/ui/button";
import { onlybranch } from "@/action/branch";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import Fselect from "@/components/atoms/Fselectuser";
import { Checkmark } from "react-checkmark";
import RejectIcon from "@/components/atoms/RejectIcon";
import HashloaderComponent from "@/components/Templates/hashloader";
import { GrUserAdmin } from "react-icons/gr";
import Eselect from "@/components/atoms/Eselect";
import { ChevronDown, ChevronRight } from "lucide-react"

interface UserTbl {
  User_Code: number;
  User_Name: string;
  User_Pwd: string;
  Module_Code: number;
  User_Color: string | null;
  Edit_Days: number | null;
  DOC_PRINT: boolean | null;
  LOCK_DATE: string | null;
  Exp_Date: string | null;
  ServerId: string | null;
  Export_Type: number;
  HOD_Code: number | null;
  Emp_Pos: string | null;
  Multi_loc: string;
  phy_loc: string;
  User_mob: string;
  Approver_Mob: string | null;
  Maker: string | null;
  Checker: string | null;
  Maker_Checker: string | null;
  POSTED_EDIT: boolean | null;
  POSTED_DELETE: boolean | null;
  Reverse_Entry: boolean | null;
  Reverse_View: boolean | null;
  Cash_Sale: boolean | null;
  Multi_Cash: boolean | null;
  Post_Ac: boolean | null;
  UnPost_Ac: boolean | null;
  Cash_Book: boolean | null;
  Back_days: number | null;
  Inter_Branch: boolean | null;
  MultiLoc_Login: boolean | null;
  Alter_Ledger: boolean | null;
  Alter_Group: boolean | null;
  Group_Change: boolean | null;
  Group_Hierarchy: boolean | null;
  Cashsheet_OTP: boolean | null;
  Rndoff_Limit: number | null;
  Cash_Allow: boolean | null;
  Disc_Aprl: boolean | null;
  Post_Days: number | null;
  PL_Ledger: boolean | null;
  HD_SrnNo: number | null;
  HD_Enabled: boolean | null;
  Bank_OTP: boolean | null;
  DMS_UNPOST: boolean | null;
  GST_EDIT: boolean | null;
  BS_Ledger: boolean | null;
  HSBC_AC: boolean | null;
  Super_User: boolean | null;
  IB_UNPOST: boolean | null;
  Reco_Unpost: boolean | null;
  IB_CANCEL: boolean | null;
  Allow_QR: boolean | null;
  DMS_Vch_Enable: boolean | null;
  Wks_Bill_Cancel: boolean | null;
  DMS_EINV: boolean | null;
  GST_Lock_Date: string | null;
  Rcpt_Cancel: boolean | null;
  INPUT_GST_LOCK_DATE: string | null;
  RCPT_2LAKH: boolean | null;
  ICM_POST: boolean | null;
  VCH_RECO: boolean | null;
  ICM_DELV: boolean | null;
  ICM_VCH_CNCL: boolean | null;
  ICM_Lock_Date: string | null;
  Last_PWD_Changed: string | null;
  Last_PWD: string | null;
  DOC_DOWNLOAD: boolean | null;
  IsDirectPrint: boolean | null;
  RightPnl_Hide: boolean | null;
  F1_Hide: boolean | null;
  Department: string | null;
  Designation: string | null;
  User_Full_Name: string | null;
  User_Email: string;
  Created_By: string | null;
  Created_On: string | null;
  Allow_Generic: boolean | null;
  Lock_Mnth: number | null;
  Lock_Time: string | null;
  CASH_RCPT: boolean | null;
  BANK_RCPT: boolean | null;
  CASH_PYMT: boolean | null;
  BANK_PYMT: boolean | null;
  CASH_RCPT_DAY: number | null;
  BANK_RCPT_DAY: number | null;
  CASH_PYMT_DAY: number | null;
  BANK_PYMT_DAY: number | null;
  AllowGSTLocked: boolean | null;
  emp_dms_code: string | null;
  MODIFIED_DATE: string | null;
  modified_by: string | null;
  MODIFIED_TIME: string | null;
  EMPCODE: string | null;
  fin_rights: string | null;
  seva_item_type: string | null;
  VAS_bookCode: string | null;
  ERP_User_Code: number | null;
  PHY_LOC_CODE: string | null;
  UTD: number;
}
interface userRights {
  rights: object[];
  Module_Code: number;
}
interface userBasedRights {
  UbR: object[];
  Module_Code: number;
}
interface User {
  UTD: number;
  isActive: number;
  UserTbl: UserTbl;
  userRights: userRights;
  userBasedRights: userBasedRights;
}


const UserRightsPage = ({ userlevel }) => {
  //States
  const user = useCurrentUser();
  const initialUser: User = {
    UTD: 0,
    isActive: 1,
    UserTbl: {
      UTD: 0,
      User_Code: 0,
      User_Name: "",
      User_Pwd: "",
      Module_Code: 0,
      User_Color: null,
      Edit_Days: null,
      DOC_PRINT: null,
      LOCK_DATE: null,
      Exp_Date: null,
      ServerId: null,
      Export_Type: 0,
      HOD_Code: null,
      Emp_Pos: null,
      Multi_loc: "",
      phy_loc: "",
      User_mob: "",
      Approver_Mob: null,
      Maker: null,
      Checker: null,
      Maker_Checker: null,
      POSTED_EDIT: null,
      POSTED_DELETE: null,
      Reverse_Entry: null,
      Reverse_View: null,
      Cash_Sale: null,
      Multi_Cash: null,
      Post_Ac: null,
      UnPost_Ac: null,
      Cash_Book: null,
      Back_days: null,
      Inter_Branch: null,
      MultiLoc_Login: null,
      Alter_Ledger: null,
      Alter_Group: null,
      Group_Change: null,
      Group_Hierarchy: null,
      Cashsheet_OTP: null,
      Rndoff_Limit: null,
      Cash_Allow: null,
      Disc_Aprl: null,
      Post_Days: null,
      PL_Ledger: null,
      HD_SrnNo: null,
      HD_Enabled: null,
      Bank_OTP: null,
      DMS_UNPOST: null,
      GST_EDIT: null,
      BS_Ledger: null,
      HSBC_AC: null,
      Super_User: null,
      IB_UNPOST: null,
      Reco_Unpost: null,
      IB_CANCEL: null,
      Allow_QR: null,
      DMS_Vch_Enable: null,
      Wks_Bill_Cancel: null,
      DMS_EINV: null,
      GST_Lock_Date: null,
      Rcpt_Cancel: null,
      INPUT_GST_LOCK_DATE: null,
      RCPT_2LAKH: null,
      ICM_POST: null,
      VCH_RECO: null,
      ICM_DELV: null,
      ICM_VCH_CNCL: null,
      ICM_Lock_Date: null,
      Last_PWD_Changed: null,
      Last_PWD: null,
      DOC_DOWNLOAD: null,
      IsDirectPrint: null,
      RightPnl_Hide: null,
      F1_Hide: null,
      Department: null,
      Designation: null,
      User_Full_Name: null,
      User_Email: "",
      Created_By: user?.name,
      Created_On: (() => {
        const now = new Date();

        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");

        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const seconds = String(now.getSeconds()).padStart(2, "0");
        const milliseconds = String(now.getMilliseconds()).padStart(3, "0");

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
      })(),
      Allow_Generic: null,
      Lock_Mnth: null,
      Lock_Time: null,
      CASH_RCPT: null,
      BANK_RCPT: null,
      CASH_PYMT: null,
      BANK_PYMT: null,
      CASH_RCPT_DAY: null,
      BANK_RCPT_DAY: null,
      CASH_PYMT_DAY: null,
      BANK_PYMT_DAY: null,
      AllowGSTLocked: null,
      emp_dms_code: null,
      MODIFIED_DATE: null,
      modified_by: null,
      MODIFIED_TIME: null,
      EMPCODE: null,
      fin_rights: null,
      seva_item_type: null,
      VAS_bookCode: null,
      ERP_User_Code: null,
      PHY_LOC_CODE: null,
    },
    userRights: {
      rights: [],
      Module_Code: 10,
    },
    userBasedRights: {
      UbR: [],
      Module_Code: 99,
    },
  };
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const [checkedKeys, setCheckedKeys] = useState([]);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [checkedKeys1, setCheckedKeys1] = useState([]);
  const [expandedKeys1, setExpandedKeys1] = useState([]);
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [selectedExpense, setSelectedExpense] = useState([]);
  const [selectedPers, setSelectedPers] = useState([]);
  const [options, setOptions] = useState<any>(null);
  const [options1, setOptions1] = useState(null);
  const [User, setUser] = useState<User>(initialUser);
  const [branches, setBranches] = useState([]);
  const [Expense, setExpense] = useState([]);
  const { UTD, UserTbl, isActive, userRights } = User || initialUser;
  const [UserCode, setUserCode] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [physicalLocations, setPhysicalLocations] = useState([]);
  const [selectedPhysicalLoc, setSelectedPhysicalLoc] = useState([]);
  const [expandedSections, setExpandedSections] = useState({
    expense: true,
    physical: false
  });




  const toggleSection = (section: 'expense' | 'physical') => {
    setExpandedSections({
      expense: section == 'expense',
      physical: section == 'physical'
    });
  };
  useEffect(() => {
    fetchbranch();
    fetchData();
  }, []); // Empty dependency array ensures this effect runs only once after the initial render

  const fetchbranch = async () => {
    if (branches.length > 0) return;
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

      console.log(response1, 'response1')
      setBranches(response.data);
      setExpense(response1.data.data);
      setPhysicalLocations(response1.data.PhysicalLoc);
    } catch (err) {
      console.log(err);
    }
  };
  const fetchUserData = async (value: string) => {
    try {
      console.log(value, "valuevalue");
      if (value == "-3") {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_URL}/users/findCompanyRights`,
          {},
          {
            headers: {
              compcode: user?.Comp_Code,
              name: user?.name,
              token: user?.email,
            },
          }
        );
        return response.data;
      } else {
         if (value?.toString().trim() == undefined && !value && value.toString().trim() == 'undefined') {
          return
        };
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_URL}/users/${value}`,
          {},
          {
            headers: {
              compcode: user?.Comp_Code,
              name: user?.name,
              token: user?.email,
            },
          }
        );
        return response.data.data;
      }
    } catch (error) {
      // Handle the error here
      console.error("An error occurred while fetching data:", error);
      // You can return null or throw the error depending on your requirements
      throw error; // Throwing the error to propagate it to the caller
    }
  };

  const fetchData = async () => {
    if (options) return; // Return if options are already fetched
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/users/all`,
        {},
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
            token: user?.email,
          },
        }
      );

      setOptions([...response.data.data, { value: "-3", label: "COMPANY" }]);
      setOptions1(response.data.data1);
    } catch (error) {
      // Handle the error here
      console.error("An error occurred while fetching data:", error);
    }
  };

  // React Query hooks for save and update mutations
  const saveUserData = async () => {
    if (messageType == "error") {
      console.log(messageType, "messageType");
      return;
    }


    if (!User?.UserTbl.User_Name) {
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Please Enter User Name. Please try again.",
      });
      return
    }
    if (!User?.UserTbl.User_Pwd) {
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Please Enter Password. Please try again.",
      });
      return
    }
    if (!User?.UserTbl.User_Pwd) {
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Please Enter Password. Please try again.",
      });
      return
    }
    if (!User?.UserTbl.EMPCODE) {
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Please Enter EMPCODE. Please try again.",
      });
      return
    }
    if (!User?.UserTbl.Multi_loc) {
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Please Select Branch Rights. Please try again.",
      });
      return
    }


    // setIsLoading(true)
    console.log(User, 'User')
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/users`,
        User,
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
            token: user?.email,
          },
        }
      );
      setIsLoading(false);
      if (response.status === 200) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "User saved successfully.",
        }).then(function () {
          setCheckedKeys([]);
          setCheckedKeys1([]);
          setSelectedBranches([]);
          setSelectedPhysicalLoc([]);
          setSelectedExpense([]);
          setUser(initialUser);
          setMessage("");
          setMessageType("");
        });
      }
    } catch (error) {
      setIsLoading(false);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: error.response.data.message
          ? error.response.data.message
          : "Failed to update user. Please try again.",
      });
      console.error("Error saving user data:", error);
      throw error; // Re-throw the error to be caught by the calling function if needed
    }
  };

  // Utility function to update user data

  // Function to handle user selection change
  const handleSelectChange = async (name, value) => {
    try {
      console.log(value, "valuevalue");
      setUserCode(value);
      setCheckedKeys([]);
      setCheckedKeys1([]);
      setSelectedBranches([]);
      setSelectedPhysicalLoc([]);
      setSelectedExpense([]);
      setUser(initialUser);
      const data = await fetchUserData(value);
      setMessage("");
      setMessageType("");
      if (value == "-3") {
        setCheckedKeys(data.rights || []);
      } else {
        setUser(data);
        setCheckedKeys(data.userRights.rights || []);
        setCheckedKeys1(data.userBasedRights.rights1 || []);
        const parsedSelectedPerv =
          data.UserTbl.Multi_loc.split(",").map(Number);
        setSelectedBranches(parsedSelectedPerv || []);
        const parsedSelectedPhyLoc =
          data.UserTbl.phy_loc?.split(",").map(Number) || [];
        setSelectedPhysicalLoc(parsedSelectedPhyLoc);
        const parsedSelectedexpense =
          data.UserTbl.Multi_Cash.split(",").map(Number);
        setSelectedExpense(parsedSelectedexpense || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // Function to handle userCreds input change
  const handleInputChange = (
    name: string,
    value: any,
    fieldName?: string
  ): void => {
    setUser((prev: User = initialUser) => ({
      ...prev,
      UserTbl: {
        ...prev.UserTbl,
        [name]: value,
      },
    }));
    if (name === "User_Name") {
      console.log("aasas");
      // Clear the previous debounce timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // Set a new debounce timer for the specific input
      debounceTimer.current = setTimeout(() => {
        FindEmpData(UserCode, value);
      }, 500);
    }
  };

  const FindEmpData = async (UserCode, value) => {
    console.log(UserCode, "aasas");
    setMessage("");
    setMessageType("");
    if (!value) {
      setMessage(""); // Clear message
      setMessageType(""); // Clear messageType
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/users/ViewEmpData`,
        {
          EMPCODE: value,
          UserCode: UserCode,
        },
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
            token: user?.email,
          },
        }
      );

      // If there is a message from the backend, show it with RejectIcon
      if (response.data.Status == true) {
        setMessage(response.data.Message);
        setMessageType("error"); // Set to 'error' since you're showing RejectIcon
      } else {
        setMessage("");
        setMessageType("");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const onCheck = (checkedKeys) => {
    setCheckedKeys(checkedKeys);
  };
  const onExpand = (expandedKeys) => {
    setExpandedKeys(expandedKeys);
  };
  const onCheck1 = (checkedKeys1) => {
    setCheckedKeys1(checkedKeys1);
  };
  const onExpand1 = (expandedKeys1) => {
    setExpandedKeys1(expandedKeys1);
  };
  // Function to handle checkbox change for branch rights
  const handleCheckboxChange = (Code) => {
    const updatedSelection = selectedBranches.includes(Code)
      ? selectedBranches.filter((code) => code !== Code)
      : [...selectedBranches, Code];
    setSelectedBranches(updatedSelection);
  };
  const handleCheckboxChangeExpense = (Code) => {
    const updatedSelection = selectedExpense.includes(Code)
      ? selectedExpense.filter((code) => code !== Code)
      : [...selectedExpense, Code];
    setSelectedExpense(updatedSelection);
  };
  const handleCheckboxChangePhysical = (Code) => {
    const updatedSelection = selectedPhysicalLoc.includes(Code)
      ? selectedPhysicalLoc.filter((code) => code !== Code)
      : [...selectedPhysicalLoc, Code];
    setSelectedPhysicalLoc(updatedSelection);
  };
  // Function to handle checkbox change for user level rights
  // const handleCheckboxChangePerv = (Code) => {
  //   const updatedPervs = selectedPers.includes(Code)
  //     ? selectedPers.filter((code) => code !== Code)
  //     : [...selectedPers, Code];
  //   setSelectedPers(updatedPervs);
  // };

  // Function to handle Select All change for branch rights
  const handleSelectAllChange = () => {
    const allGodwCodes = branches.map((branch) => branch.Code);
    setSelectedBranches(
      selectedBranches.length === allGodwCodes.length ? [] : allGodwCodes
    );
  };
  const handleSelectAllChangeExpense = () => {
    const allGodwCodes = Expense.map((branch) => branch.Code);
    setSelectedExpense(
      selectedExpense.length === allGodwCodes.length ? [] : allGodwCodes
    );
  };

  const handleSelectAllChangePhysical = () => {
    const allGodwCodes = physicalLocations.map((branch) => branch.Code);
    setSelectedPhysicalLoc(
      selectedPhysicalLoc.length === allGodwCodes.length ? [] : allGodwCodes
    );
  };
  // Function to handle Select All change for user level rights
  // const handleSelectAllChangePers = () => {
  //   const allPervbodes = userlevel.map((branch) => branch.Code);
  //   setSelectedPers(
  //     selectedPers.length === allPervbodes.length ? [] : allPervbodes
  //   );
  // };

  useEffect(() => {
    const selectedPevString = selectedExpense.join(",");
    const selectedBranchesString = selectedBranches.join(",");
    const selectedPhysicalString = selectedPhysicalLoc.join(",");

    setUser((prev) => ({
      ...prev,
      isActive: 1,
      UserTbl: {
        ...prev?.UserTbl, // Use optional chaining to avoid undefined errors
        Multi_loc: selectedBranchesString,
        phy_loc: selectedPhysicalString,
        Multi_Cash: selectedPevString,
        Module_Code: 10,
      },
      userRights: {
        ...prev?.userRights,
        Module_Code: 10,
        rights: checkedKeys,
      },
      userBasedRights: {
        ...prev?.userBasedRights,
        Module_Code: 99,
        UbR: checkedKeys1,
      },
    }));
  }, [selectedBranches, selectedExpense, checkedKeys, checkedKeys1, selectedPhysicalLoc]);

  const SAVECOMPRIGHTS = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/users/saveCompanyRights`,
        User,
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
            token: user?.email,
          },
        }
      );
      setIsLoading(false);
      if (response.status === 200) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "User updated successfully.",
        }).then(function () {
          setCheckedKeys([]);
          setCheckedKeys1([]);
          setSelectedBranches([]);
          setSelectedPhysicalLoc([]);
          setSelectedExpense([]);
          setUser(initialUser);
          setUserCode(null);
        });
      }
    } catch (error) {
      setIsLoading(false);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: error.response.data.message
          ? error.response.data.message
          : "Failed to update user. Please try again.",
      });
      console.error("Error updating user data:", error);
      throw error; // Re-throw the error to be caught by the calling function if needed
    }
  };

  const updateUserData = async () => {
    if (messageType == "error") {
      console.log(messageType, "messageType");
      return;
    }


    if (!User?.UserTbl.User_Name) {
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Please Enter User Name. Please try again.",
      });
      return
    }
    if (!User?.UserTbl.User_Pwd) {
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Please Enter Password. Please try again.",
      });
      return
    }
    if (!User?.UserTbl.User_Pwd) {
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Please Enter Password. Please try again.",
      });
      return
    }
    if (!User?.UserTbl.EMPCODE) {
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Please Enter EMPCODE. Please try again.",
      });
      return
    }
    if (!User?.UserTbl.Multi_loc) {
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Please Select Branch Rights. Please try again.",
      });
      return
    }


    setIsLoading(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/users/update`,
        User,
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
            token: user?.email,
          },
        }
      );
      setIsLoading(false);
      if (response.status === 200) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "User updated successfully.",
        }).then(function () {
          setCheckedKeys([]);
          setCheckedKeys1([]);
          setSelectedBranches([]);
          setSelectedPhysicalLoc([]);
          setSelectedExpense([]);
          setUser(initialUser);
          setUserCode(null);
          setMessage("");
          setMessageType("");
        });
      }
    } catch (error) {
      setIsLoading(false);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: error.response.data.message
          ? error.response.data.message
          : "Failed to update user. Please try again.",
      });
      console.error("Error updating user data:", error);
      throw error; // Re-throw the error to be caught by the calling function if needed
    }
  };


  // add code 
  const [phyLocOption, SetPhyLocOption] = useState([])
  const fetchGetPhyLoction = async () => {

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/users/GetPhyLocation`,
        {},
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
            token: user?.email,
          },
        }
      );
      console.log(response.data.Result, "response")
      SetPhyLocOption(response.data.Result)

    } catch (error) {
      console.error("Error updating user data:", error);
      throw error; // Re-throw the error to be caught by the calling function if needed
    }
  };

  useEffect(() => {
    fetchGetPhyLoction()
  }, [])

  return (
    <main className="grid grid-cols-12 w-full">
      <section className="lg:col-span-8 col-span-12 px-1 py-1 h-auto overflow-y-auto">
        <div className="bg-white rounded shadow border border-borderColor dark:border-borderColor-dark text-black dark:text-white dark:bg-input " >
          {/* Header */}
          <div className="px-4 py-3 border-b border-borderColor dark:border-borderColor-dark flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <GrUserAdmin size={24} className="text-blue-600 flex-shrink-0" />
              <h3 className="text-lg font-medium">User Rights</h3>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <Button
                type="submit"
                disabled={UserCode ? true : false}
                variant={"save"}
                onClick={saveUserData}
                className="h-9 flex-1 sm:flex-none"
              >
                Save
              </Button>
              <Button
                disabled={UserCode ? false : true}
                type="button"
                variant={"update"}
                onClick={updateUserData}
                className="h-9 flex-1 sm:flex-none"
              >
                Update
              </Button>
              <Button
                disabled={UserCode ? false : true}
                type="button"
                variant={"update"}
                onClick={SAVECOMPRIGHTS}
                className="h-9 flex-1 sm:flex-none"
              >
                Save Comp Rights
              </Button>
              <Button
                variant="print"
                onClick={() => window.history.back()}
                className="flex items-center justify-center gap-1 h-9 flex-1 sm:flex-none"
              >
                Back
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 overflow-y-auto h-[318px]" >
              {/* First Row */}
              <div className="lg:col-span-3">
                <Fselect
                  name="UserCode"
                  option={options}
                  handleInputChange={handleSelectChange}
                  title={"Find User"}
                />
              </div>
              <div className="lg:col-span-4">
                <Ainput
                  title={"User Name"}
                  type={"text"}
                  name={"User_Name"}
                  value={UserTbl.User_Name}
                  handleInputChange={handleInputChange}
                  required={true}
                />
                {message && (
                  <div
                    className={`flex items-center mt-1 text-sm font-bold ${messageType === "error" ? "text-exit" : ""
                      }`}
                  >
                    <RejectIcon />
                    <span className="ml-1">{message}</span>
                  </div>
                )}
              </div>
              <div className="lg:col-span-5">
                <Ainput
                  type={"password"}
                  title={"Password"}
                  name={"User_Pwd"}
                  value={UserTbl.User_Pwd}
                  handleInputChange={handleInputChange}
                  required={true}
                />
              </div>

              {/* Second Row */}
              <div className="lg:col-span-3">
                <Ainput
                  value={UserTbl.User_mob}
                  title={"Mobile No."}
                  type={"number"}
                  name={"User_mob"}
                  handleInputChange={handleInputChange}
                  required={true}
                />
              </div>
              <div className="lg:col-span-5">
                <Ainput
                  value={UserTbl.User_Email}
                  title={"User Email"}
                  type={"email"}
                  name={"User_Email"}
                  handleInputChange={handleInputChange}
                  required={true}
                />
              </div>
              <div className="lg:col-span-4">
                <Ainput
                  value={UserTbl.Exp_Date ? UserTbl.Exp_Date.slice(0, 10) : ""}
                  type={"date"}
                  title={"Expiry Date"}
                  name={"Exp_Date"}
                  handleInputChange={handleInputChange}
                  required={true}
                />
              </div>

              {/* Divider */}
              <div className="lg:col-span-12">
                <hr className="border-b border-borderColor dark:border-borderColor-dark" />
              </div>

              {/* Third Row */}
              <div className="lg:col-span-4">
                <Fselect
                  name="ERP_User_Code"
                  option={options1}
                  handleInputChange={handleInputChange}
                  initialValue={UserTbl.ERP_User_Code}
                  title={"AutoVYN ERP User"}
                />
              </div>
              <div className="lg:col-span-4">
                <Ainput
                  value={UserTbl.EMPCODE}
                  title={"EMPCODE"}
                  type={"text"}
                  name={"EMPCODE"}
                  handleInputChange={handleInputChange}
                  required={false}
                />
              </div>
              <div className="lg:col-span-4">
                <Ainput
                  value={UserTbl.emp_dms_code}
                  type={"text"}
                  title={"DMS Code"}
                  name={"emp_dms_code"}
                  handleInputChange={handleInputChange}
                  required={false}
                />
              </div>

              {/* Fourth Row */}
              <div className="lg:col-span-6">
                <Ainput
                  value={UserTbl.User_Full_Name}
                  type={"text"}
                  title={"User Full Name"}
                  name={"User_Full_Name"}
                  handleInputChange={handleInputChange}
                  required={false}
                />
              </div>
              <div className="lg:col-span-6">
                <Eselect
                  title={
                    <>
                      Physical Location{" "}
                      <span className="text-red-500">(*If Applicable For Stock MNG'T*)</span>
                    </>
                  }
                  name={"PHY_LOC_CODE"}
                  initialValue={UserTbl.PHY_LOC_CODE?.toString()}
                  option={phyLocOption}
                  handleInputChange={handleInputChange}
                  h={9}
                  ShortName
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="lg:col-span-4 md:col-span-12 sm:col-span-12 col-span-12 px-1 py-1">
        <div className="bg-white rounded shadow overflow-hidden border border-borderColor dark:border-borderColor-dark text-black dark:text-white dark:bg-input flex flex-col" style={{ height: '412px' }}>
          <div className="px-4 py-2 border-b border-borderColor dark:border-borderColor-dark flex-shrink-0">
            <h3 className="text-lg font-medium">Module Rights</h3>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            <ModulesRightsSection
              treeData={treeData}
              onCheck={onCheck}
              onExpand={onExpand}
              checkedKeys={checkedKeys}
              expandedKeys={expandedKeys}
              Title=""
            />
          </div>
        </div>
      </div>

      <div className="lg:col-span-4 col-span-12 px-1 py-1">
        <div className="bg-white rounded shadow overflow-hidden border border-borderColor dark:border-borderColor-dark text-black dark:text-white dark:bg-input flex flex-col" style={{ height: '420px' }}>
          <div className="px-4 py-2 border-b border-borderColor dark:border-borderColor-dark flex-shrink-0">
            <h3 className="text-lg font-medium">User Wise Rights</h3>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            <ModulesRightsSection
              treeData={UbR}
              onCheck={onCheck1}
              onExpand={onExpand1}
              checkedKeys={checkedKeys1}
              expandedKeys={expandedKeys1}
              Title=""
            />
          </div>
        </div>
      </div>
      <div className="lg:col-span-4 col-span-12 px-1 py-1">
        <div className="flex flex-col h-full gap-2" style={{ height: '420px' }}>
          {/* Expense Templates Section */}
          <div
            className={`bg-white rounded shadow overflow-hidden border border-borderColor dark:border-borderColor-dark text-black dark:text-white dark:bg-input flex flex-col transition-all duration-300 ${expandedSections.expense ? 'flex-[4]' : 'flex-[1]'
              }`}
          >
            <div
              className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-gray-50 border-b border-borderColor dark:border-borderColor-dark flex-shrink-0"
              onClick={() => toggleSection('expense')}
            >
              <h3 className="text-lg font-medium">Expense Templates</h3>
              {expandedSections.expense ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>

            {/* Content - shown only when expanded */}
            {expandedSections.expense && (
              <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto p-3">
                  <BranchRightsSection
                    data={Expense}
                    selected={selectedExpense}
                    handleCheckbox={handleCheckboxChangeExpense}
                    SelectAllChange={handleSelectAllChangeExpense}
                    Title=""
                  />
                </div>
              </div>
            )}
          </div>

          {/* Physical Location Section */}
          <div
            className={`bg-white rounded shadow overflow-hidden border border-borderColor dark:border-borderColor-dark text-black dark:text-white dark:bg-input flex flex-col transition-all duration-300 ${expandedSections.physical ? 'flex-[4]' : 'flex-[1]'
              }`}
          >
            <div
              className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-gray-50 border-b border-borderColor dark:border-borderColor-dark flex-shrink-0"
              onClick={() => toggleSection('physical')}
            >
              <h3 className="text-lg font-medium">Physical Location Rights</h3>
              {expandedSections.physical ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>

            {/* Content - shown only when expanded */}
            {expandedSections.physical && (
              <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto p-3">
                  <BranchRightsSection
                    data={physicalLocations}
                    selected={selectedPhysicalLoc}
                    handleCheckbox={handleCheckboxChangePhysical}
                    SelectAllChange={handleSelectAllChangePhysical}
                    Title=""
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>


      <div className="lg:col-span-4 col-span-12 px-1 py-1">
        <div className="bg-white rounded shadow overflow-hidden border border-borderColor dark:border-borderColor-dark text-black dark:text-white dark:bg-input flex flex-col" style={{ height: '420px' }}>
          <div className="px-4 py-2 border-b border-borderColor dark:border-borderColor-dark flex-shrink-0">
            <h3 className="text-lg font-medium">Branch Rights</h3>
          </div>
          <div className="flex-1 p-3 overflow-hidden">
            <BranchRightsSection
              data={branches}
              selected={selectedBranches}
              handleCheckbox={handleCheckboxChange}
              SelectAllChange={handleSelectAllChange}
              Title=""
            />
          </div>
        </div>
      </div>

      <HashloaderComponent isLoading={isLoading} />
    </main>
  );
};

export default UserRightsPage;
