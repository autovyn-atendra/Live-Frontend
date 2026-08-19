"use client";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import DataTable from "@/components/Templates/servicetable";
import {
  FetchGroupName,
  FetchGroupTable,
  InsertNewGroup,
  UpdateNewGroup,
} from "@/action/Groupmaster";
import Acheckbox from "@/components/atoms/Checkbox";
import Ainput from "@/components/atoms/Input";
import SelectSearch from "@/components/atoms/Select";
import SmallTitle from "@/components/atoms/smallTitle";
import { Button } from "@/components/ui/button";
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { MdAccountCircle, MdDashboard } from "react-icons/md";
import HashloaderComponent from "@/components/Templates/hashloader";
import { GrUserAdmin } from "react-icons/gr";

const columns = [
  { Header: "SR No", accessor: "Group_Code", width: 25 },
  { Header: "Group Name ", accessor: "Group_Name", width: 200 },
];
interface GroupData {
  Sub_Group: number;
  Group_Code: number;
  Group_Name: string;
  CompAct_Head: null | string;
  CompAct_Head2: null | string;
  TAN_YN: null | number;
  IsGeneric: null | number;
  Exp_Date: null | string;
  IsPost_Br: null | number;
  Server_Id: number;
  USER_BY: string;
}
const Bookingdata = () => {
  const user = useCurrentUser();
  const [GrupData, setGrupData] = useState<GroupData>({
    Sub_Group: 0,
    Group_Code: 0,
    Group_Name: "",
    CompAct_Head: null,
    CompAct_Head2: null,
    TAN_YN: null,
    IsGeneric: null,
    Exp_Date: null,
    IsPost_Br: null,
    Server_Id: 0,
    USER_BY: user?.name,
  });

  const [table, setTable] = useState([]);
  const [parent, setParent] = useState([]);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [isloading, setisloading] = useState(false);

  const fetchData = async () => {
    const data = {
      USER_BY: user?.name,
    };
    const response = await FetchGroupTable(data, user);
    if (!response.error) {
      setTable(response);
      const PARENT_GROUP = await FetchGroupName(data, user);
      if (!PARENT_GROUP.error) setParent(PARENT_GROUP);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);

  const handledata = (name, value) => {
    setGrupData((prevGrupData) => ({
      ...prevGrupData,
      [name]: value,
    }));
  };
  const handleCheckbox = (name, value) => {
    const newValue = value === true ? 1 : 0;
    setGrupData((prevGrupData) => ({
      ...prevGrupData,
      [name]: newValue,
    }));
  };


  const resetForm = () => {
    setGrupData({
      Sub_Group: 0,
      Group_Code: 0,
      Group_Name: "",
      CompAct_Head: null,
      CompAct_Head2: null,
      TAN_YN: null,
      IsGeneric: null,
      Exp_Date: null,
      IsPost_Br: null,
      Server_Id: 0,
      USER_BY: user?.name,
    });
    setIsUpdateMode(false);
  };

  const save = async () => {

    if (!GrupData.TAN_YN) {
      Swal.fire({
        icon: "info",
        title: "",
        text: "Please Fill Tan No Checkbox",
      });
      return
    }
    const data = {
      GrupData,
    };

    setisloading(true)
    const response = await InsertNewGroup(data, user);
    setisloading(false)
    console.log(response, "res");
    if (response == 200) {
      Swal.fire({
        icon: "success",
        title: "",
        text: "Group Added Succesfully.",
      });
      resetForm();
      await fetchData();
    }
  };

  const update = async () => {
    const data = {
      Group_Code: GrupData.Group_Code,
      GrupData,
    };
    setisloading(true)
    const response = await UpdateNewGroup(data, user);
    setisloading(false)
    console.log(response, "response");
    if (response == 200) {
      Swal.fire({
        icon: "success",
        title: "",
        text: "Group Updated Succesfully.",
      });
      resetForm();
      await fetchData();
    }
  };

  const handleRowDoubleClick = (rowData) => {
    setGrupData((prev) => ({
      ...prev,
      ...rowData,
    }));

    setIsUpdateMode(true);
  };

  return (
    <div className="grid grid-cols-12 gap-3 w-full mt-2">
      <div className="md:col-span-12 sm:col-span-12 lg:col-span-7 p-2 shadow-signUp rounded-2xl">
        <div className="w-full text-center  ">
          <DataTable
            title={""}
            columns={columns}
            data={table}
            onRowDoubleClick={handleRowDoubleClick}
            filterPosition="FilterData"
            numericFilterColumns={[]}
          />
        </div>
      </div>

      <div className="md:col-span-12 sm:col-span-12 lg:col-span-5 shadow-signUp p-2 rounded-2xl">
        <div className="rounded-t bg-white mb-0 px-6 py-2 dark:bg-primary dark:bg-opacity-10">
          <div className="flex items-center justify-between">
            {/* Left side with icon + title */}
            <div className="flex items-center gap-x-2">
              <GrUserAdmin
                size={26}
                className="text-gray-700 dark:text-white"
              />
              <SmallTitle text={"Group Master"} />
            </div>

            {/* Right side with buttons */}
            <div className="flex items-center gap-x-2">
              <Button onClick={save} variant={"save"} disabled={isUpdateMode}>
                Save
              </Button>
              <Button onClick={update} variant={"update"} disabled={!isUpdateMode}>
                Update
              </Button>
              <Button
                variant="print"
                onClick={() => window.history.back()}
                className="flex items-center gap-2"
              >
                Back
              </Button>
            </div>
          </div>
        </div>

        <Ainput
          title="Group Name"
          type="text"
          name="Group_Name"
          handleInputChange={handledata} // Make sure handledata is the correct function
          value={GrupData.Group_Name}
        />
        <SelectSearch
          title={"Parent Group"}
          handleInputChange={handledata}
          name={"Sub_Group"}
          options={parent}
          selectedValue={GrupData.Sub_Group?.toString()}
        />
        <div className="mt-2 mb-2">
          <Acheckbox
            handleInputChange={handleCheckbox}
            label={"Under Primary (Used For P/L and B/S)"}
            name={"Server_Id"}
            value={GrupData.Server_Id == 1 ? true : false}
          />
          <Acheckbox
            handleInputChange={handleCheckbox}
            label={"Posting Branch Is Compulsory"}
            name={"IsPost_Br"}
            value={GrupData.IsPost_Br == 1 ? true : false}
          />
          <Acheckbox
            handleInputChange={handleCheckbox}
            label={"TAN No Is Applicable"}
            name={"TAN_YN"}
            value={GrupData.TAN_YN == 1 ? true : false}
          />
          <Acheckbox
            handleInputChange={handleCheckbox}
            label={"Make Ledger Generic Under This Group"}
            name={"IsGeneric"}
            value={GrupData.IsGeneric == 1 ? true : false}
          />
        </div>
        <Ainput
          type={"text"}
          title={"Co. Act Group (Dr)"}
          name={"CompAct_Head"}
          handleInputChange={handledata}
          value={GrupData.CompAct_Head}
        />
        <Ainput
          type={"text"}
          title={"Co. Act Group (Crl)"}
          name={"CompAct_Head2"}
          value={GrupData.CompAct_Head2}
          handleInputChange={handledata}
        />
        <Ainput
          type={"date"}
          title={"Expiry Date"}
          name={"Exp_Date"}
          value={GrupData.Exp_Date}
          handleInputChange={handledata}
        />
      </div>
      <HashloaderComponent isLoading={isloading} />
    </div>
  );
};

export default Bookingdata;
