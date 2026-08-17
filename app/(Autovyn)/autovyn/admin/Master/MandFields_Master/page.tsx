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
import AinputDate from "@/components/atoms/dateInput";
import ATextArea from "@/components/atoms/textArea";
import { GrUserAdmin } from "react-icons/gr";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function showSideAlert(message: any, type: any) {
  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
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
  misc_code: number | null;
  misc_name: string | null;
  field_name: string | null;
  field_Abbr: string | null;

};

const Bookingdata = () => {
  const columns1 = [
    { Header: "UTD", accessor: "UTD", align: "center" },
    { Header: "Module Id", accessor: "misc_code", align: "center" },
    { Header: "Module Name", accessor: "misc_name", align: "center" },
    { Header: "Field Name", accessor: "field_name", align: "center" },
    { Header: "Field Abbr", accessor: "field_Abbr", align: "center" },
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
    misc_code: null,
    misc_name: null,
    field_name: null,
    field_Abbr: null,

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



  const fetchtabledata = async (item: any) => {
    console.log(item);
    const data = {
      misc_code: item.id,
    };

    const responce = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/master/findMandModuleData`,
      data,
      {
        headers: {
          compcode: user?.Comp_Code,
          name: user?.name,
        },
      }
    );
    console.log(responce);
    setData(responce.data.Result);
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

    setMisctype(item);
    console.log(item, "item")
    fetchtabledata(item);
    setFormData({
      UTD: null,
      misc_code: null,
      misc_name: null,
      field_name: null,
      field_Abbr: null,

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
    if (!formData.field_name) {
      Swal.fire({
        icon: "warning",
        title: "Please Ensure",
        text: "Please Fill Field Name.",
      });
      return;
    }
    if (!formData.field_Abbr) {
      Swal.fire({
        icon: "warning",
        title: "Please Ensure",
        text: "Please Fill Field Abbr.",
      });
      return;
    }
    const data = {
      Created_by: user?.name,
      MiscMst: formData,
      misctype
    };
    setisLoading(true);
    let response;
    try {
      response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/master/UpdateMandFields`,
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
      showSideAlert(
        e?.response?.data?.Message || "Something went wrong",
        "error"
      );
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
        misc_code: null,
        misc_name: null,
        field_name: null,
        field_Abbr: null,

      });
      setSaveDisabled(false);
      setUpdateDisabled(true);
    }
  };

  const handlesave = async () => {
    if (!lastSelectedItem) {
      Swal.fire({
        icon: "warning",
        title: "Please Ensure",
        text: "Please select a Master Type before saving.",
      });
      return;
    }
    if (!formData.field_name) {
      Swal.fire({
        icon: "warning",
        title: "Please Ensure",
        text: "Please Fill Field Name.",
      });
      return;
    }
    if (!formData.field_Abbr) {
      Swal.fire({
        icon: "warning",
        title: "Please Ensure",
        text: "Please Fill Field Abbr.",
      });
      return;
    }

    try {
      setisLoading(true);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/master/AddMandField`,
        {
          Created_by: user?.name,
          MiscMst: {
            misc_code: Number(misctype.id),
            misc_name: misctype.name.trim(),
            field_name: formData.field_name.trim(),
            field_Abbr: formData.field_Abbr.trim(),
          }
        },
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
          },
        }
      );

      if (response.status === 200 && response.data.Status) {
        Swal.fire("Success!", "Master saved successfully.", "success");
        await fetchtabledata(misctype);
      } else {
        Swal.fire("Warning!", "Something went wrong.", "warning");
      }

    } catch (error) {
      showSideAlert(
        error?.response?.data?.Message || "Something went wrong",
        "error"
      );
    } finally {
      setisLoading(false);
    }
  };



  const FindEmployeeApi = async () => {
    try {
      const result = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/Incentive/findEmployeeName`,
        {
          misc_name: formData.misc_name,
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
        field_Abbr: result.data.data[0][0].field_Abbr,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const [list, setList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredList, setFilteredList] = useState([]);

  const FetchListData = async () => {
    try {
      const result = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/Master/fetchModuleList`,
        {},
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
          },
        }
      );

      setList(result?.data?.Result || []);
      setFilteredList(result?.data?.Result || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };



  useEffect(() => {
    FetchListData();
  }, []);




  const handleKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      FindEmployeeApi();
    }
  };
  const handleBack = () => {
    history.back();
  };



  const handleSearchChange = (e: any) => {
    const query = e.target.value.toLowerCase();
    setSearchTerm(query);
    const filtered = list.filter((item) =>
      item.name.toLowerCase().includes(query)
    );
    setFilteredList(filtered);
  };



  const handleRefresh = () => {
    setFormData(initialFormData);
    setSaveDisabled(false);
    setUpdateDisabled(true);
    setRowClicked(false);
  };

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [newEntry, setNewEntry] = useState({
    misc_code: null,
    misc_name: "",
    misc_type: null,
    Loc_code: "",
  });

  // const openModel = async (type: any) => {
  //   setIsDialogOpen(true);
  // }




  const openModel = async (type: any) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/master/maxModulcodeforadd`,
        {

        },
        {
          headers: { compcode: user?.Comp_Code, name: user?.name },
        }
      );
      console.log(response, "maxcodeforadd");
      setNewEntry((newEntry) => ({
        ...newEntry,
        misc_code: response.data.Result || null,
      }));
      setIsDialogOpen(true);
    } catch (error) {
      console.error("Error fetching generated code:", error);
      const errorMessage =
        error.response?.data?.message || "Error fetching generated code:";
      showSideAlert(errorMessage, "warning");
    }
  };




  const handleModalInputChange = (name: any, value: any) => {
    setNewEntry((newEntry) => ({
      ...newEntry,
      [name]: value,
    }));
  };

  const updatamodel = async () => {
    if (!newEntry.misc_name) {
      showSideAlert("Please Enter The Name.", "warning");
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/Master/addModelName`,
        {
          newEntry,
        },
        {
          headers: { compcode: user?.Comp_Code, name: user?.name },
        }
      );
      console.log(response, "adddropdata");
      setIsDialogOpen(false);
      await FetchListData()
    } catch (error) {
      showSideAlert(
        error?.response?.data?.Message || "Something went wrong",
        "error"
      );
    }

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
            <li
              key={item.id}
              onClick={() => handleClick(item)}
              className="hover:bg-grey cursor-pointer border-b"
            >
              {item.name?.toLowerCase()}
            </li>
          ))}
        </ul>
        <Button
          className="mt-7 py-2 px-2 w-full"
          variant={"save"}
          onClick={() => openModel(39)}
        >
          +  ADD NEW MODULE NAME
        </Button>
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


          <>
            {/* Default form fields */}
            {/* <Ainput
              type="text"
              title="Name:"
              name="misc_name"
              handleInputChange={handleInputChange}
              value={formData.misc_name}
              onKeyDown={(e) => {
                if (e.key === "Tab") {
                  e.preventDefault(); // Prevent immediate focus shift

                  setFormData((prev) => {
                    const updated = {
                      ...prev,
                      field_Abbr: prev.misc_name,
                    };

                    // Move focus manually to the Abbreviation field after state update
                    setTimeout(() => {
                      const nextInput = document.querySelector(
                        'input[name="field_Abbr"]'
                      );
                      if (nextInput) nextInput.focus();
                    }, 0);

                    return updated;
                  });
                }
              }}
              disabled
            /> */}

            <div className="p-1">
              <Ainput
                value={formData.field_name}
                handleInputChange={handleInputChange}
                type={"text"}
                title={"Field Name:"}
                name={"field_name"}
              />
            </div>
            <div className="p-1">
              <Ainput
                value={formData.field_Abbr}
                handleInputChange={handleInputChange}
                type={"text"}
                title={"Field Abbreviation:"}
                name={"field_Abbr"}
              />
            </div>
            <div className="p-1 flex flex-wrap items-end gap-x-2">
              <div className="w-full sm:w-auto">
                <AinputDate
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

        </div>
      )}


      <HashloaderComponent isLoading={isLoading} />


      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-full dark:bg-primaryop bg-off max-w-screen-md ">
          <DialogHeader>
            <DialogTitle className="">ADD NEW MODULE NAME </DialogTitle>
            <hr className="ml-2 bg-body-color" />
          </DialogHeader>
          <DialogDescription className=" animate-pulse-2s lg:h-[200px] md:h-[150px] h-[150px] overflow-y-scroll">
            <div className="grid grid-cols-12 gap-2 p-1">
              <div className="col-span-6">
                <Ainput
                  height={"7"}
                  title={"Code"}
                  type={"text"}
                  name={"misc_code"}
                  value={newEntry.misc_code}
                  handleInputChange={handleModalInputChange}
                  disabled
                />
              </div>
              <div className="col-span-6">
                <Ainput
                  height={"7"}
                  title={"Name"}
                  type={"text"}
                  name={"misc_name"}
                  value={newEntry.misc_name}
                  handleInputChange={handleModalInputChange}
                />
              </div>
              <div className="col-span-12 md:mt-1 mt-1">
                <Button
                  className="ml-1 mt-6"
                  variant={"update"}
                  onClick={updatamodel}
                >
                  ADD NAME
                </Button>
              </div>
            </div>
          </DialogDescription>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Bookingdata;
