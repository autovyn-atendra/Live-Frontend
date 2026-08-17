"use client";
import React, { useEffect, useState } from "react";
import DataTable from "@/components/Templates/ServiceTable";
import SmallTitle from "@/components/atoms/smallTitle";
import Ainput from "@/components/atoms/Input";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import Swal from "sweetalert2";
import { AddMaster1, FindMaster, UpdateMaster } from "@/action/masters";
import { useRouter, useSearchParams } from "next/navigation";
import HashloaderComponent from "@/components/Templates/hashloader";
import Fselect from "@/components/atoms/Fselect";
import Eselect from "@/components/atoms/Eselect";
import axios from "axios";
import { list } from "../MasterList";
import ATextArea from "@/components/atoms/textArea";
import { GrUserAdmin } from "react-icons/gr";

const monthsArray = [
  { label: "Apr", value: "4" },
  { label: "May", value: "5" },
  { label: "Jun", value: "6" },
  { label: "Jul", value: "7" },
  { label: "Aug", value: "8" },
  { label: "Sep", value: "9" },
  { label: "Oct", value: "10" },
  { label: "Nov", value: "11" },
  { label: "Dec", value: "12" },
  { label: "Jan", value: "1" },
  { label: "Feb", value: "2" },
  { label: "Mar", value: "3" },
];

type formData = {
  UTD: number | null;
  Misc_Code: number | null;
  Misc_Name: string | null;
  MISC_NUM2: string | null;
  Misc_Abbr: string | null;
  Misc_Dtl1: string | null;
  Misc_Dtl2: string | null;
  Misc_Dtl3: string | null;
  Misc_Add1: string | null;
  Misc_Add2: string | null;
  Misc_Add3: string | null;
  Exp_Date: string | null;
  Join_Date: number | null;
  Birth_Date: number | null;
  Misc_Type: number | null;
  Misc_HOD: number | null;
  Tally_Vch: number | null;
  SPL_REM: number | null;
  Server_Id: number | null;
};

const Bookingdata = () => {
  const columns1 = [
    { Header: "UTD", accessor: "UTD", align: "center" },
    { Header: "SR. No.", accessor: "Misc_Code", align: "center" },
    { Header: "Name", accessor: "Misc_Name", align: "center" },
    { Header: "Abbr", accessor: "Misc_Abbr", align: "center" },
    // { Header: "Parent", accessor: "Misc_Dtl1", align: "center" },
    // {
    //   Header: "DOJ",
    //   accessor: "Join_Date",
    //   align: "center",
    //   Cell: ({ value }) => {
    //     const date = new Date(value);
    //     const formattedDate = date.toLocaleDateString("en-GB");
    //     return <span>{formattedDate == '01/01/1970' ? null : formattedDate}</span>;
    //   },
    // },

    // {
    //   Header: "Exp. Date",
    //   accessor: "Exp_Date",
    //   align: "center",
    //   Cell: ({ value }) => {
    //     const date = new Date(value);
    //     const formattedDate = date.toLocaleDateString("en-GB");
    //     return <span>{formattedDate}</span>;
    //   },
    // },
  ];
  const [columns, setcolumns] = useState(columns1);
  const searchParams = useSearchParams();
  const uomFlag = searchParams.get("uomFlag");
  const OfferFlag = searchParams.get("OfferFlag");
  const router = useRouter();

  const user = useCurrentUser();
  const [Subpayment, setSubpayment] = useState([]);
  const [data, setData] = useState([]);
  const [Gh, setGh] = useState([]);
  const [Tl, setTl] = useState([]);
  const [Dse, setDse] = useState([]);
  const [AddOnOption, setAddOnOption] = useState([]);
  const [accName, setAccName] = useState([]);
  const [regionName, setRegionName] = useState([]);
  const [misctype, setMisctype] = useState({
    id: "",
    name: "",
  });

  function getCurrentDate(monthsBack = 0) {
    const today = new Date();
    today.setMonth(today.getMonth() - monthsBack);
    const year = today.getFullYear();
    let month: string | number = today.getMonth() + 1;
    let day: string | number = today.getDate();

    if (month < 10) month = "0" + month;
    if (day < 10) day = "0" + day;

    return `${year}-${month}-${day}`; // ✅ format: YYYY-MM-DD
  }

  const initialFormData: formData = {
    UTD: null,
    Misc_Code: null,
    Misc_Name: null,
    MISC_NUM2: null,
    Misc_Abbr: null,
    Misc_Dtl1: null,
    Misc_Dtl2: null,
    Misc_Dtl3: null,
    Misc_Add1: null,
    Misc_Add2: null,
    Misc_Add3: null,
    Exp_Date: null,
    Join_Date: null,
    Birth_Date: null,
    Misc_Type: null,
    Misc_HOD: null,
    Tally_Vch: null,
    SPL_REM: null,
    Server_Id: null,
  };

  const [formData, setFormData] = useState<formData>(initialFormData);
  const [name, setName] = useState("");
  const [saveDisabled, setSaveDisabled] = useState(false);
  const [updateDisabled, setUpdateDisabled] = useState(true);
  const [isLoading, setisLoading] = useState(false);
  const [rowClicked, setRowClicked] = useState(false);

  const handleRowDoubleClick = (row: any) => {
    console.log(lastSelectedItem, "lastSelectedItemlastSelectedItem");
    setFormData({
      ...row,
      Join_Date: row.Join_Date ? new Date(row.Join_Date).toISOString() : null, // Ensure ISO format or null
      Birth_Date: row.Birth_Date
        ? new Date(row.Birth_Date).toISOString()
        : null, // Ensure ISO format or null
    });
    setRowClicked(true);
    setUpdateDisabled(false);
    setSaveDisabled(true);
  };

  const fetchDataPayMent = async (item: any) => {
    console.log(item);
    const data = {
      Misc_Type: item.id,
    };
    if (item.id == 636) {
    }
    const responce = await FindMaster(data, user);
    console.log(responce, "hghgfhgfhgfgh");
    const extractedData = responce.data.MiscMst.map((item: any) => ({
      value: item.Misc_Code?.toString(),
      label: item.Misc_Name?.toString(),
    }));
    setSubpayment(extractedData);
    return;
  };

  const fetchtabledata = async (item: any) => {
    console.log(item);
    const data = {
      Misc_Type: item.id,
    };
    if (item.id == 636) {
      fetchDataPayMent({ id: 635 });
    }
    const responce = await FindMaster(data, user);
    console.log(responce);

    setData(responce.data.MiscMst);
    setName(item.name);

    return;
  };


  const formatDateForInput = (date: any) => {
    if (!date) return ""; // Ensure empty string for null or undefined
    return new Date(date).toISOString().split("T")[0];
  };

  useEffect(() => {
    if (uomFlag == "1") {
      setisLoading(true);
      const a = { item: { id: 72 } };
      setMisctype(a.item);
      fetchtabledata(a.item);
      setisLoading(false);
    } else if (OfferFlag == "1") {
      setisLoading(true);
      const b = { item: { id: 622 } };
      setMisctype(b.item);
      fetchtabledata(b.item);
      setisLoading(false);
    }
  }, []);

  const [lastSelectedItem, setLastSelectedItem] = useState(null);
  const [selectedName, setSelectedName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [Location, setLocation] = useState(false);
  const handleClick = (item: any) => {
    console.log(item);
    setShowForm(true);
    setRowClicked(false);
    setSelectedName(item.name);
    setLastSelectedItem(item);
    if (item.id == 621 || item.id == 620 || item.id == 619) {
      setcolumns([
        { Header: "UTD", accessor: "UTD", align: "center" },
        { Header: "SR. No.", accessor: "Misc_Code", align: "center" },
        { Header: "Name", accessor: "Misc_Name", align: "center" },
        { Header: "Abbr", accessor: "Misc_Abbr", align: "center" },
        { Header: "Parent", accessor: "Misc_Dtl1", align: "center" },
        {
          Header: "DOJ",
          accessor: "Join_Date",
          align: "center",
          Cell: ({ value }: any) => {
            const date = new Date(value);
            const formattedDate = date.toLocaleDateString("en-GB");
            return (
              <span>
                {formattedDate == "01/01/1970" ? null : formattedDate}
              </span>
            );
          },
        },
      ]);
    } else if (item.id == 623) {
      setcolumns([
        { Header: "UTD", accessor: "UTD", align: "center" },
        { Header: "SR. No.", accessor: "Misc_Code", align: "center" },
        { Header: "Name", accessor: "Misc_Name", align: "center" },
        { Header: "Lower Limit", accessor: "Misc_Add1", align: "center" },
        {
          Header: "Mnth",
          accessor: (row) => {
            const monthObject = monthsArray.find(
              (month) => month.value === row.Misc_Add2
            );
            return monthObject ? monthObject.label : "";
          },
          align: "center",
        },
        { Header: "Year", accessor: "Misc_Dtl1", align: "center" },
      ]);
    } else if (item.id == 629) {
      // Doc Management specific columns
      setcolumns([
        { Header: "UTD", accessor: "UTD", align: "center" },
        { Header: "SR. No.", accessor: "Misc_Code", align: "center" },
        { Header: "Name", accessor: "Misc_Name", align: "center" },
        { Header: "Abbr", accessor: "Misc_Abbr", align: "center" },
        { Header: "Table", accessor: "Misc_Add1", align: "center" },
      ]);
    } else if (item.id == 647) {
      setcolumns([
        { Header: "UTD", accessor: "UTD", cellAlign: "center" },
        { Header: "SR. No.", accessor: "Misc_Code", cellAlign: "center" },
        { Header: "Module Code", accessor: "Misc_Abbr", cellAlign: "center" },
        { Header: "Doc Name", accessor: "Misc_Name", cellAlign: "center" },
        {
          Header: "Sequence Number",
          accessor: "Misc_Dtl1",
          cellAlign: "center",
        },
      ]);
    } else if (item.id == 648) {
      setcolumns([
        { Header: "UTD", accessor: "UTD", align: "center" },
        { Header: "SR. No.", accessor: "Misc_Code", align: "center" },
        {
          Header: "Reason",
          accessor: "Misc_HOD",
          align: "center",
          Cell: ({ value }) => {
            const reason = ReasonType.find(
              (item) => item.value === String(value)
            );
            return reason ? reason.label : value;
          },
        },
        { Header: "Name", accessor: "Misc_Name", align: "center" },
      ]);
    } else if (item.id == 650) {
      setcolumns([
        { Header: "UTD", accessor: "UTD", align: "center" },
        { Header: "SR. No.", accessor: "Misc_Code", align: "center" },
        { Header: "Name", accessor: "Misc_Name", align: "center" },
        {
          Header: "Main",
          accessor: "Misc_HOD",
          align: "center",
          Cell: ({ value }) => {
            const reason = AddOnOption.find(
              (item) => item.value === String(value)
            );
            return reason ? reason.label : value;
          },
        },
      ]);
    } else if (item.id == 85) {
      setcolumns([
        { Header: "UTD", accessor: "UTD", align: "center" },
        { Header: "SR. No.", accessor: "Misc_Code", align: "center" },
        { Header: "Name", accessor: "Misc_Name", align: "center" },
        {
          Header: "A/C Location",
          accessor: "Misc_HOD",
          align: "center",
          Cell: ({ value }) => {
            const reason = accName.find(
              (item) => item.value === String(value)
            );
            return reason ? reason.label : value;
          },
        },
        {
          Header: "Region",
          accessor: "Server_Id",
          align: "center",
          Cell: ({ value }) => {
            const reason = regionName.find(
              (item) => item.value === String(value)
            );
            return reason ? reason.label : value;
          },
        },
      ]);
    }
    else if (item.id == 651) {
      setcolumns([
        { Header: "UTD", accessor: "UTD", align: "center" },
        { Header: "SR. No.", accessor: "Misc_Code", align: "center" },
        { Header: "Name", accessor: "Misc_Name", align: "center" },
        {
          Header: "Message",
          accessor: "SPL_REM",
          align: "center",
        },
      ]);
    } else if (item.id == 656) {
      setcolumns([
        { Header: "UTD", accessor: "UTD", align: "center" },
        { Header: "SR. No.", accessor: "Misc_Code", align: "center" },
        { Header: "EmpMst Fields Name", accessor: "Misc_Name", align: "center" },
        { Header: "EMP Misc Type", accessor: "Misc_HOD", align: "center" },
      ]);
    } else if (item.id == 660) {
      setcolumns([
        { Header: "UTD", accessor: "UTD", align: "center" },
        { Header: "SR. No.", accessor: "Misc_Code", align: "center" },
        { Header: "Name", accessor: "Misc_Name", align: "center" },
        { Header: "Linking With Insurance Master", accessor: "Misc_HOD", align: "center" },
      ]);
    } else if (item.id == 664) {
      setcolumns([
        { Header: "UTD", accessor: "UTD", cellAlign: "center" },
        { Header: "SR. No.", accessor: "Misc_Code", cellAlign: "center" },
        { Header: "Doc Name", accessor: "Misc_Name", cellAlign: "center" },
        { Header: "Module Code", accessor: "Misc_Abbr", cellAlign: "center" },
        {
          Header: "Sequence Number",
          accessor: "Misc_Dtl1",
          cellAlign: "center",
        },
      ]);
    }
    // Add this in the handleClick function, where other item.id conditions are
else if (item.id == 665) {
  setcolumns([
    { Header: "UTD", accessor: "UTD", align: "center" },
    { Header: "SR. No.", accessor: "Misc_Code", align: "center" },
    { Header: "Name", accessor: "Misc_Name", align: "center" },
    { Header: "Abbreviation Name", accessor: "Misc_Abbr", align: "center" },
    { 
      Header: "Can Delete", 
      accessor: "SPL_REM", 
      align: "center",
      Cell: ({ value }) => {
        return <span>{value === "1" ? "No" : "Yes"}</span>;
      }
    },
  ]);
}
    else {
      setcolumns(columns1);
    }
    setMisctype(item);
    fetchtabledata(item);
    setFormData({
      UTD: null,
      Misc_Code: null,
      Misc_Name: null,
      MISC_NUM2: null,
      Misc_Abbr: null,
      Misc_Dtl1: null,
      Misc_Dtl2: null,
      Misc_Dtl3: null,
      Misc_Add1: null,
      Misc_Add2: null,
      Misc_Add3: null,
      Join_Date: null,
      Exp_Date: null,
      Birth_Date: null,
      Misc_Type: null,
      Misc_HOD: null,
      Tally_Vch: null,
      SPL_REM: null,
      Server_Id: null,
    });
  };

  const handleInputChange = (name: any, value: any) => {
    console.log(name, value, "Server_Id")
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleupdate = async () => {
    const data = {
      Created_by: user?.name,
      MiscMst: formData,
    };
    setisLoading(true);
    let response;
    try {
      response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/master/updateMaster1/${formData?.UTD}`,
        data,
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
          },
        }
      );
      setisLoading(false);
    } catch (e) {
      setisLoading(false);
      console.log(e.response);
      Swal.fire({
        icon: "warning",
        title: "Wait!",
        text:
          e?.response?.data?.message ||
          "There is something Wrong please check data",
      });
    }
    if (response?.status == 200) {
      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Master update successfully.",
      });
      await fetchtabledata(misctype);
      setFormData({
        UTD: null,
        Misc_Code: null,
        Misc_Name: null,
        MISC_NUM2: null,
        Misc_Abbr: null,
        Misc_Dtl1: null,
        Misc_Dtl2: null,
        Misc_Dtl3: null,
        Misc_Add1: null,
        Misc_Add2: null,
        Misc_Add3: null,
        Join_Date: null,
        Birth_Date: null,
        Exp_Date: null,
        Misc_Type: null,
        Misc_HOD: null,
        Tally_Vch: null,
        SPL_REM: null,
        Server_Id: null,
      });
      setSaveDisabled(false);
      setUpdateDisabled(true);
    }
  };

  const handlesave = async () => {
    console.log(formData, "formDataformDataformData");

    if (!lastSelectedItem) {
      Swal.fire({
        icon: "warning",
        title: "Please Ensure",
        text: "Please select an Master Type before saving.",
      });
      return;
    }
    if (formData.Misc_Name == null || formData.Misc_Name == "") {
      Swal.fire({
        icon: "warning",
        title: "Please Ensure",
        text: "Name can not be Empty ",
      });
    } else {
      if (name.toUpperCase() === "DOCUMENT MAPPING") {
        const selectedModule = ModuleOptions.find(
          (opt) => opt.value === formData.Misc_HOD?.toString()
        );
        if (selectedModule) {
          formData.Misc_Abbr = selectedModule.label;
        }
      }

      const data = {
        Created_by: user?.name,
        MiscMst: {
          UTD: formData.UTD,
          Misc_Code: formData.Misc_Code,
          Misc_Name: formData.Misc_Name,
          MISC_NUM2: formData.MISC_NUM2,
          Misc_Abbr: formData.Misc_Abbr,
          Misc_Dtl1: formData.Misc_Dtl1,
          Misc_Dtl2: formData.Misc_Dtl2,
          Misc_Dtl3: formData.Misc_Dtl3,
          Misc_Add1: formData.Misc_Add1,
          Misc_Add2: formData.Misc_Add2,
          Misc_Add3: formData.Misc_Add3,
          Join_Date: formData.Join_Date,
          Exp_Date: formData.Exp_Date,
          Misc_HOD: formData.Misc_HOD,
          Tally_Vch: formData.Tally_Vch,
          SPL_REM: formData.SPL_REM,
          Misc_Type: misctype.id,
          Loc_Code: user?.branch,
          Server_Id: formData?.Server_Id,
        },
      };
      console.log(data, "data");

      // setisLoading(true);
      const response = await AddMaster1(data, user);
      setisLoading(false);
      if (response == 200) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Master saved successfully.",
        });
        if (uomFlag == "1") {
          const url = `/autovyn/inventory/itemMaster`;
          router.push(url);
        }
        await fetchtabledata(misctype);
        MastersApi();
        setFormData({
          UTD: null,
          Misc_Code: null,
          Misc_Name: null,
          MISC_NUM2: null,
          Misc_Abbr: null,
          Misc_Dtl1: null,
          Misc_Dtl2: null,
          Misc_Dtl3: null,
          Misc_Add1: null,
          Misc_Add2: null,
          Misc_Add3: null,
          Birth_Date: null,
          Exp_Date: null,
          Join_Date: null,
          Misc_Type: null,
          Misc_HOD: null,
          Tally_Vch: null,
          SPL_REM: null,
          Server_Id: null,

        });
      } else if (response == 201) {
        Swal.fire({
          icon: "warning",
          title: "Invalid Master Creation!",
          text: "Master Already Created...!",
        });
      } else {
        Swal.fire({
          icon: "warning",
          title: "Invalid Master Creation!",
          text: "Employee Not Created Please Create the Employee Master First...!",
        });
      }
      setSaveDisabled(false);
      setUpdateDisabled(true);
    }
  };

  // const refresh = () => {
  //   setFormData({
  //     UTD: null,
  //     Misc_Code: null,
  //     Misc_Name: null,
  //     Misc_Abbr: null,
  //     Exp_Date: null,
  //     Misc_Type: null,
  //   })
  //   setSaveDisabled(false);
  //   setUpdateDisabled(true);
  // }
  useEffect(() => {
    MastersApi();
  }, []);

  const MastersApi = async () => {
    try {
      const result = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/Incentive/findMasters`,
        {},
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
          },
        }
      );
      console.log(result.data, "result.dataresult.dataresult.dataresult.data");
      setGh(result.data.data.GroupHead[0]);
      setTl(result.data.data.TeamLeader[0]);
      setDse(result.data.data.Dse[0]);
      setLocation(result.data.data.Location[0]);
      setAddOnOption(result.data.data.AddOnOption[0]);
      console.log(result.data.data, "result.data.data")
      setAccName(result.data.data.Branchdata);
      setRegionName(result.data.data.Region);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  const FindEmployeeApi = async () => {
    try {
      const result = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/Incentive/findEmployeeName`,
        {
          Misc_Name: formData.Misc_Name,
        },
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
          },
        }
      );
      setFormData({
        ...formData,
        Misc_Abbr: result.data.data[0][0].Misc_Abbr,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  const handleKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      FindEmployeeApi();
    }
  };
  const handleBack = () => {
    history.back();
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [filteredList, setFilteredList] = useState(list);

  const handleSearchChange = (e: any) => {
    const query = e.target.value.toLowerCase();
    setSearchTerm(query);
    const filtered = list.filter((item) =>
      item.name.toLowerCase().includes(query)
    );
    setFilteredList(filtered);
  };

  const DoctypeOpstion = [
    { label: "Voucher", value: "1" },
    { label: "Purchase", value: "2" },
    { label: "Sale", value: "3" },
    { label: "ICM", value: "4" },
    { label: "Ledger", value: "5" },
    { label: "Cheque", value: "6" },
    { label: "EMPLOYEE", value: "8" },
  ];

  const ModuleOptions = [
    { label: "Attendance", value: "1" },
    { label: "Discount", value: "2" },
    { label: "Gatepass", value: "3" },
    { label: "Booking Refund", value: "4" },
    { label: "Expense Management", value: "5" },
    { label: "Fuel", value: "6" },
    { label: "Asset Issue", value: "7" },
    { label: "Asset Service", value: "8" },
    { label: "Asset", value: "9" },
    { label: "Payment Tracker", value: "10" },
    { label: "Deal Sheet", value: "11" },
    { label: "DemoCar Gatepass", value: "12" },
    { label: "ICM", value: "13" },
    { label: "MGA", value: "14" },
    { label: "EmpSalary", value: "15" },
    { label: "Lead Management", value: "16" },
  ];

  const NumberOpstion = [
    { label: "1", value: "1" },
    { label: "2", value: "2" },
    { label: "3", value: "3" },
    { label: "4", value: "4" },
    { label: "5", value: "5" },
    { label: "6", value: "6" },
    { label: "7", value: "7" },
    { label: "8", value: "8" },
    { label: "9", value: "9" },
    { label: "10", value: "10" },
    { label: "11", value: "11" },
    { label: "12", value: "12" },
    { label: "13", value: "13" },
    { label: "14", value: "14" },
    { label: "15", value: "15" },
    { label: "16", value: "16" },
    { label: "17", value: "17" },
    { label: "18", value: "18" },
    { label: "19", value: "19" },
    { label: "20", value: "20" },
  ];

  const Mandatory = [
    { label: "Yes", value: "1" },
    { label: "No", value: "0" },
  ];

  const ReasonType = [
    { label: "Lost Sale", value: "1" },
    { label: "Cancellation", value: "2" },
  ];
  const TypeOption = [
    { label: "Attachment", value: "1" },
    { label: "Link", value: "2" },
  ];

  const [amountAddOnOptions] = useState([
    { value: "0", label: "Not Impact" },
    { value: "1", label: "Add Amount" },
    { value: "2", label: "Subtract Amount" },
  ]);


  const [CustomerDealOption] = useState([
    { value: "srno", label: "Sr No" },
    { value: "Trans_NewDate", label: "Booking Date" },
    { value: "CUST_NAME", label: "Customer Name" },
    { value: "CUST_MOB", label: "Mobile No." },
    { value: "Modl_Name", label: "Model Name" },
    { value: "Color", label: "Model Color" },
    { value: "Ledg_bal", label: "Ledg Bal" },
    { value: "booking_stage", label: "Booking Stage" },
    { value: "BOOKING_ID", label: "Booking Id" },
    { value: "CUST_ID", label: "Customer Id" },
    { value: "godw_name", label: "Branch" },
    { value: "Deal_Amount", label: "Deal Amount" },
    { value: "Received_Amount", label: "Received Amount" },
    { value: "EXECUTIVE", label: "RM Name" },
    { value: "Team_Head", label: "SRM Name" },
    // { value: "status1", label: "Approver 1" },
    // { value: "Appr_1_Rem", label: "Approver 1 Remark" },
    // { value: "status2", label: "Approver 2" },
    // { value: "Appr_2_Rem", label: "Approver 2 Remark" },
  ]);

  const getAvailableSequenceNumbers = () => {
    // Get all used sequence numbers for the current module from the table
    console.log(data, 'data')
    const usedSequenceNumbers = data
      .filter(
        (item) => item.Misc_HOD?.toString() === formData.Misc_HOD?.toString()
      )
      .map((item) => item.Misc_Dtl1?.toString());

    // Filter out used numbers for this module, but keep the current selection (for editing)
    return NumberOpstion.filter(
      (option) =>
        !usedSequenceNumbers.includes(option.value) ||
        option.value === formData.Misc_Dtl1?.toString()
    );
  };

  const getAvailableAbbreviations = () => {
    // Get all used abbreviations for the current module from the table
    const usedAbbreviations = data
      .filter(
        (item) => item.Misc_HOD?.toString() === formData.Misc_HOD?.toString()
      )
      .map((item) => item.Misc_Abbr?.toString());

    // Filter out used abbreviations for this module, but keep the current selection (for editing)
    return CustomerDealOption.filter(
      (option) =>
        !usedAbbreviations.includes(option.value) ||
        option.value === formData.Misc_Abbr?.toString()
    );
  };

  const handleRefresh = () => {
    setFormData(initialFormData);
    setSaveDisabled(false);
    setUpdateDisabled(true);
    setRowClicked(false);
  };

  return (
    <div className="grid grid-cols-12 gap-2 w-full">
      <div className="col-span-12 md:col-span-2 rounded-lg shadow p-2 dark:bg-primary dark:bg-opacity-10">
        <div>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search..."
            className="lex h-8 w-full rounded-md dark:bg-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
          />
        </div>
        <ul className="overflow-y-scroll h-[600px]  capitalize  font-semibold mt-3">
          {filteredList.map((item) => (
            <>
              {user?.role1.includes(`9.1.${item?.id}`) && (
                <li
                  key={item.id}
                  onClick={() => handleClick(item)}
                  className="hover:bg-grey cursor-pointer mt-0  border-b"
                >
                  {item.name?.toLowerCase()}
                </li>
              )}

              {/* <hr className="border-body-color" /> */}
            </>
          ))}
        </ul>
      </div>

      <div className="col-span-12 md:col-span-5 p-2 shadow-signUp rounded-lg dark:bg-primary dark:bg-opacity-10">
        <div className="rounded-t bg-white dark:bg-dark px-6 py-1">
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2">
              <GrUserAdmin size={34} />
              <SmallTitle text={name} />
            </div>
            <div className="flex gap-x-2">
              <Button variant={"print"} onClick={handleBack}>
                Back
              </Button>
            </div>
          </div>
        </div>

        <div className="w-full text-center  ">
          <DataTable
            columns={columns}
            data={data}
            onRowDoubleClick={handleRowDoubleClick}
            filterPosition="FilterData"
            numericFilterColumns={[]}
          // title={name}
          />
        </div>
      </div>

      {showForm && selectedName && (
        <div className="col-span-12 md:col-span-5 p-2 shadow-signUp  rounded-lg dark:bg-primary dark:bg-opacity-10">
          <div className="rounded-t bg-white dark:bg-dark px-6 py-1">
            <div className="flex items-center justify-between py-1 ">
              <div className="flex items-center gap-2">
                <GrUserAdmin size={34} />
                <SmallTitle text={name} />
              </div>
              <div className="flex gap-x-2">
                <Button
                  variant={"print"}
                  onClick={handleRefresh}
                  className="text-sm"
                >
                  Refresh
                </Button>
                <Button
                  variant={"save"}
                  onClick={handlesave}
                  disabled={saveDisabled}
                  className="text-sm"
                >
                  Save
                </Button>
                <Button
                  variant={"update"}
                  onClick={handleupdate}
                  disabled={updateDisabled}
                  className="text-sm"
                >
                  Update
                </Button>
              </div>
            </div>
          </div>

          {name?.toUpperCase() == "GROUP HEAD MASTER" ||
            name?.toUpperCase() == "TEAM LEADER MASTER" ||
            name?.toUpperCase() == "PURCHASE PAYOUT" ||
            name?.toUpperCase() == "BANK SUBPAYMENT" ||
            name?.toUpperCase() == "DOC MANAGEMENT" ||
            name?.toUpperCase() == "DOCUMENT MAPPING" ||
            name?.toUpperCase() == "PHYSICAL LOCATION MASTER" ||
            name?.toUpperCase() == "ENQUIRY LOST/CANCELLATION REASON" ||
            name?.toUpperCase() == "DSE MASTER" ||
            name?.toUpperCase() == "PRICE SUB ADD-ON MASTER" ||
            name?.toUpperCase() == "BRANCH MASTER" ||
            name?.toUpperCase() == "PRICE ADD-ON MASTER" ||
            name?.toUpperCase() == "CUSTOMER DOCUMENT" ||
            name?.toUpperCase() == "EMP DROPDOWN CONFIGURATION FIELDS" ||
            name?.toUpperCase() == "CUSTOMER DEAL SHEET MASTER" ||
            name?.toUpperCase() == "RTO INSURANCE MASTER" ||
  name?.toUpperCase() == "EXPENSE TEMPLATES" ? ( 
            <>
              {name?.toUpperCase() == "PURCHASE PAYOUT" ? (
                <>
                  {/* Purchase Payout form fields */}
                  <div className="p-1 mt-2">
                    <Ainput
                      type={"text"}
                      title={"Name:"}
                      name={"Misc_Name"}
                      handleInputChange={handleInputChange}
                      value={formData.Misc_Name}
                    />
                  </div>
                  <div className="p-1">
                    <Ainput
                      value={formData.Misc_Add1}
                      handleInputChange={handleInputChange}
                      type={"text"}
                      title={"From % (Lower Limit >=)"}
                      name={"Misc_Add1"}
                    />
                  </div>
                  <div className="p-1">
                    <Eselect
                      mb={5}
                      initialValue={formData.Misc_Add2?.toString()}
                      option={monthsArray}
                      title={"Month"}
                      name={"Misc_Add2"}
                      handleInputChange={handleInputChange}
                      h={9}
                    />
                  </div>
                  <div className="p-1">
                    <Ainput
                      value={formData.Misc_Dtl1}
                      handleInputChange={handleInputChange}
                      type={"text"}
                      title={"Year"}
                      name={"Misc_Dtl1"}
                    />
                  </div>
                  <div className="p-1 flex flex-wrap items-end gap-x-2">
                    <div className="w-full sm:w-auto">
                      <Ainput
                        value={formData.Exp_Date}
                        handleInputChange={handleInputChange}
                        type="date"
                        title="Expiry Date:"
                        name="Exp_Date"
                        disabled
                      />
                    </div>

                    <Button
                      variant="print"
                      className="text-sm"
                      onClick={() => {
                        const currentDate = getCurrentDate(); // get today's date in YYYY-MM-DD
                        setFormData((prev) => ({
                          ...prev,
                          Exp_Date: currentDate,
                        }));
                      }}
                    >
                      DEACTIVATE
                    </Button>
                  </div>
                </>
              ) : name?.toUpperCase() == "DOC MANAGEMENT" ? (
                <>
                  {/* Doc Management specific fields */}

                  <Eselect
                    name={"Misc_HOD"}
                    initialValue={formData?.Misc_HOD}
                    option={DoctypeOpstion}
                    handleInputChange={handleInputChange}
                    title={"Doc Type"}
                    h={"9"}
                  />
                  <div className="p-1 mt-2">
                    <Ainput
                      type={"text"}
                      title={"Name:"}
                      name={"Misc_Name"}
                      handleInputChange={handleInputChange}
                      value={formData.Misc_Name}
                    />
                  </div>

                  <div className="p-1">
                    <Ainput
                      value={formData.Misc_Abbr}
                      handleInputChange={handleInputChange}
                      type={"text"}
                      title={"Abbreviation Name:"}
                      name={"Misc_Abbr"}
                    />
                  </div>

                  <div className="p-1">
                    <Ainput
                      value={formData.Misc_Add1}
                      handleInputChange={handleInputChange}
                      type={"text"}
                      title={"Table"}
                      name={"Misc_Add1"}
                    />
                  </div>

                  <div className="p-1">
                    <Ainput
                      value={formData.Misc_Add2}
                      handleInputChange={handleInputChange}
                      type={"text"}
                      title={"Primary Key"}
                      name={"Misc_Add2"}
                    />
                  </div>

                  <div className="p-1">
                    <Ainput
                      value={formData.Misc_Add3}
                      handleInputChange={handleInputChange}
                      type={"text"}
                      title={"Where Comand field"}
                      name={"Misc_Add3"}
                    />
                  </div>

                  <div className="p-1">
                    <Ainput
                      value={formData.Misc_Dtl1}
                      handleInputChange={handleInputChange}
                      type={"text"}
                      title={"Field Name"}
                      name={"Misc_Dtl1"}
                    />
                  </div>
                  <div className="p-1 flex flex-wrap items-end gap-x-2">
                    <div className="w-full sm:w-auto">
                      <Ainput
                        value={formData.Exp_Date}
                        handleInputChange={handleInputChange}
                        type="date"
                        title="Expiry Date:"
                        name="Exp_Date"
                        disabled
                      />
                    </div>

                    <Button
                      variant="print"
                      className="text-sm"
                      onClick={() => {
                        const currentDate = getCurrentDate(); // get today's date in YYYY-MM-DD
                        setFormData((prev) => ({
                          ...prev,
                          Exp_Date: currentDate,
                        }));
                      }}
                    >
                      DEACTIVATE
                    </Button>
                  </div>
                </>
              ) : name?.toUpperCase() == "DOCUMENT MAPPING" ? (
                <>
                  <div className="p-1 mt-2">
                    <Eselect
                      name={"Misc_HOD"}
                      initialValue={formData?.Misc_HOD?.toString()}
                      option={ModuleOptions}
                      handleInputChange={handleInputChange}
                      title={"Module Code"}
                      h={"9"}
                      disabled={lastSelectedItem?.id === 647 && rowClicked}
                    />
                  </div>
                  <div className="p-1 mt-2">
                    <Ainput
                      type={"text"}
                      title={"Doc Name"}
                      name={"Misc_Name"}
                      handleInputChange={handleInputChange}
                      value={formData.Misc_Name}
                    />
                  </div>
                  <div className="p-1 mt-2">
                    <Eselect
                      name={"Misc_Dtl1"}
                      initialValue={formData?.Misc_Dtl1?.toString()}
                      option={getAvailableSequenceNumbers()}
                      handleInputChange={handleInputChange}
                      title={"Sequence Number"}
                      h={"9"}
                    />
                  </div>
                  <div className="p-1 mt-2">
                    <Eselect
                      name={"Misc_Dtl2"}
                      initialValue={formData?.Misc_Dtl2?.toString()}
                      option={Mandatory}
                      handleInputChange={handleInputChange}
                      title={"Is Mandatory"}
                      h={"9"}
                    />
                  </div>

                  <div className="p-1 mt-2">
                    <Eselect
                      name={"Misc_Dtl3"}
                      initialValue={formData?.Misc_Dtl3?.toString()}
                      option={Mandatory}
                      handleInputChange={handleInputChange}
                      title={"Requestor"}
                      h={"9"}
                    />
                  </div>

                  <div className="p-1 mt-2">
                    <Eselect
                      name={"MISC_NUM2"}
                      initialValue={formData?.MISC_NUM2?.toString()}
                      option={Mandatory}
                      handleInputChange={handleInputChange}
                      title={"Approver1"}
                      h={"9"}
                    />
                  </div>

                  <div className="p-1 mt-2">
                    <Eselect
                      name={"Tally_Vch"}
                      initialValue={formData?.Tally_Vch?.toString()}
                      option={Mandatory}
                      handleInputChange={handleInputChange}
                      title={"Approver2"}
                      h={"9"}
                    />
                  </div>

                  <div className="p-1 mt-2">
                    <Eselect
                      name={"SPL_REM"}
                      initialValue={formData?.SPL_REM?.toString()}
                      option={Mandatory}
                      handleInputChange={handleInputChange}
                      title={"Approver3"}
                      h={"9"}
                    />
                  </div>
                  <div className="p-1 flex flex-wrap items-end gap-x-2">
                    <div className="w-full sm:w-auto">
                      <Ainput
                        value={formData.Exp_Date}
                        handleInputChange={handleInputChange}
                        type="date"
                        title="Expiry Date:"
                        name="Exp_Date"
                        disabled
                      />
                    </div>

                    <Button
                      variant="print"
                      className="text-sm"
                      onClick={() => {
                        const currentDate = getCurrentDate(); // get today's date in YYYY-MM-DD
                        setFormData((prev) => ({
                          ...prev,
                          Exp_Date: currentDate,
                        }));
                      }}
                    >
                      DEACTIVATE
                    </Button>
                  </div>
                </>
              ) : name?.toUpperCase() == "CUSTOMER DEAL SHEET MASTER" ? (
                <>
                  <div className="p-1">
                    <Eselect
                      name={"Misc_Abbr"}
                      initialValue={formData?.Misc_Abbr?.toString()}
                      option={getAvailableAbbreviations()}
                      handleInputChange={handleInputChange}
                      title={"Abbreviation Name:"}
                      h={"9"}
                    />
                  </div>
                  <div className="p-1 mt-2">
                    <Ainput
                      type={"text"}
                      title={"Column Name"}
                      name={"Misc_Name"}
                      handleInputChange={handleInputChange}
                      value={formData.Misc_Name}
                    />
                  </div>
                  <div className="p-1 mt-2">
                    <Eselect
                      name={"Misc_Dtl1"}
                      initialValue={formData?.Misc_Dtl1?.toString()}
                      option={getAvailableSequenceNumbers()}
                      handleInputChange={handleInputChange}
                      title={"Sequence Number"}
                      h={"9"}
                    />
                  </div>
                  <div className="p-1 flex flex-wrap items-end gap-x-2">
                    <div className="w-full sm:w-auto">
                      <Ainput
                        value={formData.Exp_Date}
                        handleInputChange={handleInputChange}
                        type="date"
                        title="Expiry Date:"
                        name="Exp_Date"
                        disabled
                      />
                    </div>

                    <Button
                      variant="print"
                      className="text-sm"
                      onClick={() => {
                        const currentDate = getCurrentDate(); // get today's date in YYYY-MM-DD
                        setFormData((prev) => ({
                          ...prev,
                          Exp_Date: currentDate,
                        }));
                      }}
                    >
                      DEACTIVATE
                    </Button>
                  </div>
                </>
              ) : name?.toUpperCase() == "ENQUIRY LOST/CANCELLATION REASON" ? (
                <>
                  <div className="p-1">
                    <Eselect
                      initialValue={formData.Misc_HOD?.toString()}
                      option={ReasonType}
                      title={"Reason"}
                      name={"Misc_HOD"}
                      handleInputChange={handleInputChange}
                      h={9}
                    />
                  </div>
                  <div className="p-1 mt-2">
                    <Ainput
                      type={"text"}
                      title={"Name:"}
                      name={"Misc_Name"}
                      handleInputChange={handleInputChange}
                      value={formData.Misc_Name}
                    />
                  </div>
                  {/* <div className="p-1">
                  <Ainput
                    value={formData.Misc_Abbr}
                    handleInputChange={handleInputChange}
                    type={"text"}
                    title={"Abbreviation Name:"}
                    name={"Misc_Abbr"}
                  />
                </div> */}
                  <div className="p-1 flex flex-wrap items-end gap-x-2">
                    <div className="w-full sm:w-auto">
                      <Ainput
                        value={formData.Exp_Date}
                        handleInputChange={handleInputChange}
                        type="date"
                        title="Expiry Date:"
                        name="Exp_Date"
                        disabled
                      />
                    </div>

                    <Button
                      variant="print"
                      className="text-sm"
                      onClick={() => {
                        const currentDate = getCurrentDate(); // get today's date in YYYY-MM-DD
                        setFormData((prev) => ({
                          ...prev,
                          Exp_Date: currentDate,
                        }));
                      }}
                    >
                      DEACTIVATE
                    </Button>
                  </div>
                </>
              ) : name?.toUpperCase() == "PHYSICAL LOCATION MASTER" ? (
                <>
                  <div className="p-1">
                    <Eselect
                      initialValue={formData.Misc_HOD?.toString()}
                      option={Location}
                      title={"BRANCH"}
                      name={"Misc_HOD"}
                      handleInputChange={handleInputChange}
                      h={9}
                    />
                  </div>
                  <div className="p-1 mt-2">
                    <Ainput
                      type={"text"}
                      title={"Name:"}
                      name={"Misc_Name"}
                      handleInputChange={handleInputChange}
                      value={formData.Misc_Name}
                    />
                  </div>
                  <div className="p-1">
                    <Ainput
                      value={formData.Misc_Abbr}
                      handleInputChange={handleInputChange}
                      type={"text"}
                      title={"Abbreviation Name:"}
                      name={"Misc_Abbr"}
                    />
                  </div>
                </>
              ) : name?.toUpperCase() == "PRICE ADD-ON MASTER" ? (
                <>
                  <div className="p-1 mt-2">
                    <Ainput
                      type={"text"}
                      title={"Name:"}
                      name={"Misc_Name"}
                      handleInputChange={handleInputChange}
                      value={formData.Misc_Name}
                    />
                  </div>
                  <div className="p-1">
                    <Ainput
                      value={formData.Misc_Abbr}
                      handleInputChange={handleInputChange}
                      type={"text"}
                      title={"Abbreviation Name:"}
                      name={"Misc_Abbr"}
                    />
                  </div>

                  <div className="p-1">
                    <Eselect
                      name={"Misc_Dtl1"}
                      initialValue={formData?.Misc_Dtl1?.toString()}
                      option={amountAddOnOptions}
                      handleInputChange={handleInputChange}
                      title={"Amount Add-On Type:"}
                      h={"9"}
                    />
                  </div>
                  <div className="p-1">
                    <Eselect
                      name={"Misc_Dtl2"}
                      initialValue={formData?.Misc_Dtl2?.toString()}
                      option={Mandatory}
                      handleInputChange={handleInputChange}
                      title={"Is Mandatory"}
                      h={"9"}
                    />
                  </div>
                  <div className="p-1 flex flex-wrap items-end gap-x-2">
                    <div className="w-full sm:w-auto">
                      <Ainput
                        value={formData.Exp_Date}
                        handleInputChange={handleInputChange}
                        type="date"
                        title="Expiry Date:"
                        name="Exp_Date"
                        disabled
                      />
                    </div>

                    <Button
                      variant="print"
                      className="text-sm"
                      onClick={() => {
                        const currentDate = getCurrentDate(); // get today's date in YYYY-MM-DD
                        setFormData((prev) => ({
                          ...prev,
                          Exp_Date: currentDate,
                        }));
                      }}
                    >
                      DEACTIVATE
                    </Button>
                  </div>
                </>
              ) : name?.toUpperCase() == "PRICE SUB ADD-ON MASTER" ? (
                <>
                  <div className="p-1">
                    <Eselect
                      initialValue={formData.Misc_HOD?.toString()}
                      option={AddOnOption}
                      title={"Select Add-On"}
                      name={"Misc_HOD"}
                      handleInputChange={handleInputChange}
                      h={9}
                      disabled={lastSelectedItem?.id === 650 && rowClicked}
                    />
                  </div>
                  <div className="p-1 mt-2">
                    <Ainput
                      type={"text"}
                      title={"Name:"}
                      name={"Misc_Name"}
                      handleInputChange={handleInputChange}
                      value={formData.Misc_Name}
                      onKeyDown={(e) => {
                        if (e.key === "Tab") {
                          e.preventDefault(); // Prevent focus change until update happens
                          handleInputChange("Misc_Abbr", formData.Misc_Name); // Copy value
                          // Then move focus manually to the Abbr input
                          const abbrInput = document.querySelector(
                            'input[name="Misc_Abbr"]'
                          );
                          abbrInput?.focus();
                        }
                      }}
                    />
                  </div>
                  <div className="p-1">
                    <Ainput
                      value={formData.Misc_Abbr}
                      handleInputChange={handleInputChange}
                      type={"text"}
                      title={"Abbreviation Name:"}
                      name={"Misc_Abbr"}
                    />
                  </div>
                  <div className="p-1 flex flex-wrap items-end gap-x-2">
                    <div className="w-full sm:w-auto">
                      <Ainput
                        value={formData.Exp_Date}
                        handleInputChange={handleInputChange}
                        type="date"
                        title="Expiry Date:"
                        name="Exp_Date"
                        disabled
                      />
                    </div>

                    <Button
                      variant="print"
                      className="text-sm"
                      onClick={() => {
                        const currentDate = getCurrentDate(); // get today's date in YYYY-MM-DD
                        setFormData((prev) => ({
                          ...prev,
                          Exp_Date: currentDate,
                        }));
                      }}
                    >
                      DEACTIVATE
                    </Button>
                  </div>
                </>
              ) : name?.toUpperCase() == "BRANCH MASTER" ? (
                <>

                  <div className="p-1 mt-2">
                    <Ainput
                      type={"text"}
                      title={"Location Name:"}
                      name={"Misc_Name"}
                      handleInputChange={handleInputChange}
                      value={formData.Misc_Name}
                      onKeyDown={(e) => {
                        if (e.key === "Tab") {
                          e.preventDefault(); // Prevent focus change until update happens
                          handleInputChange("Misc_Abbr", formData.Misc_Name); // Copy value
                          // Then move focus manually to the Abbr input
                          const abbrInput = document.querySelector(
                            'input[name="Misc_Abbr"]'
                          );
                          abbrInput?.focus();
                        }
                      }}
                    />
                  </div>
                  <div className="p-1">
                    <Ainput
                      value={formData.Misc_Abbr}
                      handleInputChange={handleInputChange}
                      type={"text"}
                      title={"Abbreviation Name:"}
                      name={"Misc_Abbr"}
                    />
                  </div>
                  <div className="p-1">
                    <Eselect
                      initialValue={formData.Misc_HOD?.toString()}
                      option={accName}
                      title={"Select Location"}
                      name={"Misc_HOD"}
                      handleInputChange={handleInputChange}
                      h={9}
                    // disabled={lastSelectedItem?.id === 85 && rowClicked}
                    />
                  </div>
                  <div className="p-1">
                    <Eselect
                      initialValue={formData.Server_Id?.toString()}
                      option={regionName}
                      title={"Select Region"}
                      name={"Server_Id"}
                      handleInputChange={handleInputChange}
                      h={9}
                    // disabled={lastSelectedItem?.id === 85 && rowClicked}
                    />
                  </div>
                  <div className="p-1 flex flex-wrap items-end gap-x-2">
                    <div className="w-full sm:w-auto">
                      <Ainput
                        value={formData.Exp_Date}
                        handleInputChange={handleInputChange}
                        type="date"
                        title="Expiry Date:"
                        name="Exp_Date"
                        disabled
                      />
                    </div>

                    <Button
                      variant="print"
                      className="text-sm"
                      onClick={() => {
                        const currentDate = getCurrentDate(); // get today's date in YYYY-MM-DD
                        setFormData((prev) => ({
                          ...prev,
                          Exp_Date: currentDate,
                        }));
                      }}
                    >
                      DEACTIVATE
                    </Button>
                  </div>
                </>
              ) : name?.toUpperCase() == "CUSTOMER DOCUMENT" ? (
                <>
                  <div className="p-1 mt-2">
                    <Ainput
                      type={"text"}
                      title={"Name:"}
                      name={"Misc_Name"}
                      handleInputChange={handleInputChange}
                      value={formData.Misc_Name}
                      onKeyDown={(e) => {
                        if (e.key === "Tab") {
                          e.preventDefault(); // Prevent focus change until update happens
                          handleInputChange("Misc_Abbr", formData.Misc_Name); // Copy value
                          // Then move focus manually to the Abbr input
                          const abbrInput = document.querySelector(
                            'input[name="Misc_Abbr"]'
                          );
                          abbrInput?.focus();
                        }
                      }}
                    />
                  </div>
                  <div className="p-1">
                    <Ainput
                      value={formData.Misc_Abbr}
                      handleInputChange={handleInputChange}
                      type={"text"}
                      title={"Abbreviation Name:"}
                      name={"Misc_Abbr"}
                    />
                  </div>
                  <div className="p-1">
                    <ATextArea
                      title={"Add A Message"}
                      name={"SPL_REM"}
                      value={formData.SPL_REM}
                      rows={3}
                      className={"shadow-md ring-1"}
                      handleInputChange={handleInputChange}
                      onKeyDown={""}
                    />
                  </div>
                  <div className="p-1 mt-2">
                    <Eselect
                      name={"Misc_Add1"}
                      initialValue={formData?.Misc_Add1?.toString()}
                      option={TypeOption}
                      handleInputChange={handleInputChange}
                      title={"Select type"}
                      h={"9"}
                    />
                  </div>
                  <div className="p-1 flex flex-wrap items-end gap-x-2">
                    <div className="w-full sm:w-auto">
                      <Ainput
                        value={formData.Exp_Date}
                        handleInputChange={handleInputChange}
                        type="date"
                        title="Expiry Date:"
                        name="Exp_Date"
                        disabled
                      />
                    </div>

                    <Button
                      variant="print"
                      className="text-sm"
                      onClick={() => {
                        const currentDate = getCurrentDate(); // get today's date in YYYY-MM-DD
                        setFormData((prev) => ({
                          ...prev,
                          Exp_Date: currentDate,
                        }));
                      }}
                    >
                      DEACTIVATE
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* Other master type forms */}
                  {name?.toUpperCase() == "GROUP HEAD MASTER" ? (
                    <>
                      <div className="p-1 mt-2">
                        <Ainput
                          type={"text"}
                          title={"EMPCODE:"}
                          name={"Misc_Name"}
                          handleInputChange={handleInputChange}
                          value={formData.Misc_Name}
                          onKeyDown={handleKeyDown}
                        />
                      </div>
                      <div className="p-1">
                        <Ainput
                          value={formData.Misc_Abbr}
                          handleInputChange={handleInputChange}
                          type={"text"}
                          title={"Employee Name:"}
                          name={"Misc_Abbr"}
                        />
                      </div>
                    </>
                  ) : name?.toUpperCase() == "TEAM LEADER MASTER" ? (
                    <>
                      <div className="p-1 mt-2">
                        <Eselect
                          name={"Misc_Dtl1"}
                          initialValue={formData?.Misc_Dtl1}
                          option={Gh}
                          handleInputChange={handleInputChange}
                          title={"Group Head"}
                          errorMsg={!Gh.length ? "No options Found" : ""}
                          h={"9"}
                        />
                      </div>
                      <div className="p-1 mt-2">
                        <Ainput
                          type={"text"}
                          title={"EMPCODE:"}
                          name={"Misc_Name"}
                          handleInputChange={handleInputChange}
                          value={formData.Misc_Name}
                          onKeyDown={handleKeyDown}
                        />
                      </div>
                      <div className="p-1">
                        <Ainput
                          value={formData.Misc_Abbr}
                          handleInputChange={handleInputChange}
                          type={"text"}
                          title={"Employee Name:"}
                          name={"Misc_Abbr"}
                        />
                      </div>
                    </>
                  )
                    : name?.toUpperCase() == "EMP DROPDOWN CONFIGURATION FIELDS" ? (
                      <>
                        <div className="p-1 mt-2">
                          <Ainput
                            type={"text"}
                            title={"EmpMst Fields Name"}
                            name={"Misc_Name"}
                            handleInputChange={handleInputChange}
                            value={formData.Misc_Name}
                            onKeyDown={(e) => {
                              if (e.key === "Tab") {
                                e.preventDefault(); // Prevent focus change until update happens
                                handleInputChange("Misc_Abbr", formData.Misc_Name); // Copy value
                                // Then move focus manually to the Abbr input
                                const abbrInput = document.querySelector(
                                  'input[name="Misc_Abbr"]'
                                );
                                abbrInput?.focus();
                              }
                            }}
                          />
                        </div>
                        <div className="p-1">
                          <Ainput
                            value={formData.Misc_Abbr}
                            handleInputChange={handleInputChange}
                            type={"text"}
                            title={"Abbreviation Name:"}
                            name={"Misc_Abbr"}
                          />
                        </div>

                        <div className="p-1">
                          <Ainput
                            value={formData.Misc_HOD}
                            handleInputChange={handleInputChange}
                            type={"NUMBER"}
                            title={"MISC TYPE OF DROPDOWN:"}
                            name={"Misc_HOD"}
                          />
                        </div>
                        <div className="p-1 flex flex-wrap items-end gap-x-2">
                          <div className="w-full sm:w-auto">
                            <Ainput
                              value={formData.Exp_Date}
                              handleInputChange={handleInputChange}
                              type="date"
                              title="Expiry Date:"
                              name="Exp_Date"
                              disabled
                            />
                          </div>

                          <Button
                            variant="print"
                            className="text-sm"
                            onClick={() => {
                              const currentDate = getCurrentDate(); // get today's date in YYYY-MM-DD
                              setFormData((prev) => ({
                                ...prev,
                                Exp_Date: currentDate,
                              }));
                            }}
                          >
                            DEACTIVATE
                          </Button>
                        </div>

                      </>
                    ) : name?.toUpperCase() == "BANK SUBPAYMENT" ? (
                      <>
                        <div className="p-1 mt-2">
                          <Ainput
                            type={"text"}
                            title={"Name:"}
                            name={"Misc_Name"}
                            handleInputChange={handleInputChange}
                            value={formData.Misc_Name}
                          />
                        </div>
                        <div className="p-1">
                          <Ainput
                            value={formData.Misc_Abbr}
                            handleInputChange={handleInputChange}
                            type={"text"}
                            title={"Abbreviation Name:"}
                            name={"Misc_Abbr"}
                          />
                        </div>
                        <div className="p-1">
                          <Eselect
                            name={"Misc_HOD"}
                            initialValue={formData?.Misc_HOD?.toString()}
                            option={Subpayment}
                            handleInputChange={handleInputChange}
                            title={"Payment Type"}
                            h={"9"}
                          />
                        </div>
                        <div className="p-1 flex flex-wrap items-end gap-x-2">
                          <div className="w-full sm:w-auto">
                            <Ainput
                              value={formData.Exp_Date}
                              handleInputChange={handleInputChange}
                              type="date"
                              title="Expiry Date:"
                              name="Exp_Date"
                              disabled
                            />
                          </div>

                          <Button
                            variant="print"
                            className="text-sm"
                            onClick={() => {
                              const currentDate = getCurrentDate(); // get today's date in YYYY-MM-DD
                              setFormData((prev) => ({
                                ...prev,
                                Exp_Date: currentDate,
                              }));
                            }}
                          >
                            DEACTIVATE
                          </Button>
                        </div>
                      </>
                    ) : name?.toUpperCase() == "RTO INSURANCE MASTER" ? (
                      <>
                        <div className="p-1 mt-2">
                          <Ainput
                            type={"text"}
                            title={"Name"}
                            name={"Misc_Name"}
                            handleInputChange={handleInputChange}
                            value={formData.Misc_Name}
                            onKeyDown={(e) => {
                              if (e.key === "Tab") {
                                e.preventDefault(); // Prevent focus change until update happens
                                handleInputChange("Misc_Abbr", formData.Misc_Name); // Copy value
                                // Then move focus manually to the Abbr input
                                const abbrInput = document.querySelector(
                                  'input[name="Misc_Abbr"]'
                                );
                                abbrInput?.focus();
                              }
                            }}
                          />
                        </div>
                        <div className="p-1">
                          <Ainput
                            value={formData.Misc_Abbr}
                            handleInputChange={handleInputChange}
                            type={"text"}
                            title={"Abbreviation Name:"}
                            name={"Misc_Abbr"}
                          />
                        </div>

                        <div className="p-1">
                          <Ainput
                            value={formData.Misc_HOD}
                            handleInputChange={handleInputChange}
                            type={"text"}
                            title={"Linking With Insurance Master:"}
                            name={"Misc_HOD"}
                          />
                        </div>
                        <div className="p-1 flex flex-wrap items-end gap-x-2">
                          <div className="w-full sm:w-auto">
                            <Ainput
                              value={formData.Exp_Date}
                              handleInputChange={handleInputChange}
                              type="date"
                              title="Expiry Date:"
                              name="Exp_Date"
                              disabled
                            />
                          </div>

                          <Button
                            variant="print"
                            className="text-sm"
                            onClick={() => {
                              const currentDate = getCurrentDate(); // get today's date in YYYY-MM-DD
                              setFormData((prev) => ({
                                ...prev,
                                Exp_Date: currentDate,
                              }));
                            }}
                          >
                            DEACTIVATE
                          </Button>
                        </div>

                      </>
                      ) : name?.toUpperCase() == "EXPENSE TEMPLATES" ? (
  <>
    <div className="p-1 mt-2">
      <Ainput
        type={"text"}
        title={"Name:"}
        name={"Misc_Name"}
        handleInputChange={handleInputChange}
        value={formData.Misc_Name}
        onKeyDown={(e) => {
          if (e.key === "Tab") {
            e.preventDefault();
            handleInputChange("Misc_Abbr", formData.Misc_Name);
            const abbrInput = document.querySelector('input[name="Misc_Abbr"]');
            abbrInput?.focus();
          }
        }}
      />
    </div>
    <div className="p-1">
      <Ainput
        value={formData.Misc_Abbr}
        handleInputChange={handleInputChange}
        type={"text"}
        title={"Abbreviation Name:"}
        name={"Misc_Abbr"}
      />
    </div>
    <div className="p-1">
      <Eselect
        initialValue={formData.SPL_REM?.toString()}
        option={[
          { label: "Yes (Cannot Delete/Edit)", value: "1" },
          { label: "No (Can Delete/Edit)", value: "0" }
        ]}
        title={"Can Delete/Edit?"}
        name={"SPL_REM"}
        handleInputChange={handleInputChange}
        h={9}
      />
    </div>
    <div className="p-1 flex flex-wrap items-end gap-x-2">
      <div className="w-full sm:w-auto">
        <Ainput
          value={formData.Exp_Date}
          handleInputChange={handleInputChange}
          type="date"
          title="Expiry Date:"
          name="Exp_Date"
          disabled
        />
      </div>
      <Button
        variant="print"
        className="text-sm"
        onClick={() => {
          const currentDate = getCurrentDate();
          setFormData((prev) => ({
            ...prev,
            Exp_Date: currentDate,
          }));
        }}
      >
        DEACTIVATE
      </Button>
    </div>
  </>
) : (
                 
                      
                      <>
                        <div className="p-1 mt-2">
                          <Eselect
                            name="Misc_Dtl1"
                            option={Tl}
                            initialValue={formData?.Misc_Dtl1}
                            handleInputChange={handleInputChange}
                            title={"Team Leader"}
                            h={"9"}
                            errorMsg={!Tl.length ? "No options Found" : ""}
                          />
                        </div>
                        <div className="p-1 mt-2">
                          <Ainput
                            type={"text"}
                            title={"EMPCODE:"}
                            name={"Misc_Name"}
                            handleInputChange={handleInputChange}
                            value={formData.Misc_Name}
                            onKeyDown={handleKeyDown}
                          />
                        </div>
                        <div className="p-1">
                          <Ainput
                            value={formData.Misc_Abbr}
                            handleInputChange={handleInputChange}
                            type={"text"}
                            title={"Employee Name:"}
                            name={"Misc_Abbr"}
                          />
                        </div>
                        <div className="p-1">
                          <Ainput
                            value={formatDateForInput(formData.Birth_Date)}
                            handleInputChange={handleInputChange}
                            type={"date"}
                            title={"Team Shifting Date:"}
                            name={"Birth_Date"}
                          />
                        </div>
                      </>
                    )}

                  {/* Only show these date fields for specific masters */}
                  {/* {name?.toUpperCase() !== "BANK SUBPAYMENT" &&
                  name?.toUpperCase() !== "DOC MANAGEMENT" &&
                  name?.toUpperCase() !== "ENQ REASON" &&
                  name?.toUpperCase() !== "DOCUMENT MAPPING" && (
                    <>
                      <div className="p-1">
                        <Ainput
                          value={formatDateForInput(formData.Join_Date)}
                          handleInputChange={handleInputChange}
                          type={"date"}
                          title={"DOj:"}
                          name={"Join_Date"}
                        />
                      </div>
                      <div className="p-1">
                        <Ainput
                          value={formatDateForInput(formData.Exp_Date)}
                          handleInputChange={handleInputChange}
                          type={"date"}
                          title={"Expiry Date:"}
                          name={"Exp_Date"}
                          disabled={updateDisabled}
                        />
                      </div>
                    </>
                  )} */}
                </>
              )}
            </>
          ) : (
            <>
              {/* Default form fields */}
              <Ainput
                type="text"
                title="Name:"
                name="Misc_Name"
                handleInputChange={handleInputChange}
                value={formData.Misc_Name}
                onKeyDown={(e) => {
                  if (e.key === "Tab") {
                    e.preventDefault(); // Prevent immediate focus shift

                    setFormData((prev) => {
                      const updated = {
                        ...prev,
                        Misc_Abbr: prev.Misc_Name,
                      };

                      // Move focus manually to the Abbreviation field after state update
                      setTimeout(() => {
                        const nextInput = document.querySelector(
                          'input[name="Misc_Abbr"]'
                        );
                        if (nextInput) nextInput.focus();
                      }, 0);

                      return updated;
                    });
                  }
                }}
              />

              <div className="p-1">
                <Ainput
                  value={formData.Misc_Abbr}
                  handleInputChange={handleInputChange}
                  type={"text"}
                  title={"Abbreviation Name:"}
                  name={"Misc_Abbr"}
                />
              </div>
              <div className="p-1 flex flex-wrap items-end gap-x-2">
                <div className="w-full sm:w-auto">
                  <Ainput
                    value={formData.Exp_Date}
                    handleInputChange={handleInputChange}
                    type="date"
                    title="Expiry Date:"
                    name="Exp_Date"
                    disabled
                  />
                </div>

                <Button
                  variant="print"
                  className="text-sm"
                  onClick={() => {
                    const currentDate = getCurrentDate(); // get today's date in YYYY-MM-DD
                    setFormData((prev) => ({
                      ...prev,
                      Exp_Date: currentDate,
                    }));
                  }}
                >
                  DEACTIVATE
                </Button>
              </div>
            </>
          )}
        </div>
      )}
      <HashloaderComponent isLoading={isLoading} />
    </div>
  );
};

export default Bookingdata;
