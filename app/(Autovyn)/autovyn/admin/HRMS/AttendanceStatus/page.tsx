"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { Checkbox } from "antd";
import Ainput from "@/components/atoms/Input";
import { FaUsers } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import CheckBoxDesign from "@/components/atoms/CheckBoxDesigned";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import Swal from "sweetalert2";
import { MdDelete, MdEditDocument, MdNoteAdd } from "react-icons/md";
import { GrUserAdmin } from "react-icons/gr";

export default function StatusForm() {
  const [statuses, setStatuses] = useState([]);
  const [editingStatus, setEditingStatus] = useState(false);
  const user = useCurrentUser();

  const [formData, setFormData] = useState({
    Utd: null,
    valueStatus: "",
    Status: "",
    Present: false,
    Absent: false,
    HalfDay: false,
    WeekOff: false,
    Relaxation: false,
    Holiday: false,
    Leave: false,
    colorCode: "#000000",
    Value: 0,
  });

  // Fetch distinct statuses from the backend
  const fetchStatuses = async () => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/Mobile/AtnStatus`,
        {},
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
            // compcode: user?.Comp_Code,name:user?.name,
          },
        }
      );
      setStatuses(response.data.Result); // Assuming the API returns an array of statuses
    } catch (error) {
      console.error("Error fetching statuses:", error);
    }
  };
  useEffect(() => {
    fetchStatuses();
  }, []);

  // Handle form input change
  useEffect(() => {
    console.log(formData);
  }, [formData]);
  function showSideAlert(message, type) {
    const Toast = Swal.mixin({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 5000,
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
  const handleDateChange = (name: any, value: any) => {
    if (
      [
        "Present",
        "Absent",
        "HalfDay",
        "WeekOff",
        "Relaxation",
        "Holiday",
        "Leave",
      ].includes(name)
    ) {
      setFormData((prevData) => ({
        ...prevData,
        Present: name == "Present" ? true : false,
        Absent: name == "Absent" ? true : false,
        HalfDay: name == "HalfDay" ? true : false,
        WeekOff: name == "WeekOff" ? true : false,
        Relaxation: name == "Relaxation" ? true : false,
        Holiday: name == "Holiday" ? true : false,
        Leave: name == "Leave" ? true : false,
        valueStatus: displayRelevantFieldsValue({
          ...prevData,
          Present: name == "Present" ? true : false,
          Absent: name == "Absent" ? true : false,
          HalfDay: name == "HalfDay" ? true : false,
          WeekOff: name == "WeekOff" ? true : false,
          Relaxation: name == "Relaxation" ? true : false,
          Holiday: name == "Holiday" ? true : false,
          Leave: name == "Leave" ? true : false,
        }),
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value?.toString(),
      }));
    }
  };

  const fieldLabels = {
    Present: "Present",
    Absent: "Absent",
    HalfDay: "Half Day",
    WeekOff: "Week Off",
    Relaxation: "Relaxation",
    Holiday: "Holiday",
    Leave: "Leave",
  };
  const displayRelevantFields = (status) => {
    return Object.keys(fieldLabels)
      .filter((field) => status[field] === 1) // Only show fields with a value of 1
      .map((field) => (
        <p key={field}>
          <strong>{fieldLabels[field]}</strong>
        </p>
      ));
  };
  const displayRelevantFieldsValue = (status) => {
    return Object.keys(fieldLabels).filter((field) => status[field] == true)[0];
  };
  const changeStatus = () => {
    const abcd = statuses.find(
      (item) => item.Status?.toUpperCase() === formData.Status?.toUpperCase()
    );
    console.log(abcd);
    if (abcd) {
      setEditingStatus(true);
      setFormData((prev) => ({
        ...prev,
        ...abcd,
        valueStatus: displayRelevantFieldsValue(abcd),
      }));
    } else {
      setEditingStatus(false);
      setFormData((prev) => ({
        ...prev,
        Utd: null,
        valueStatus: "",
        Present: false,
        Absent: false,
        HalfDay: false,
        WeekOff: false,
        Relaxation: false,
        Holiday: false,
        Leave: false,
        colorCode: "#000000",
        Value: 0,
      }));
    }
  };
  const handleDoubleClick = (status) => {
    setFormData((prev) => ({
      ...prev,
      ...status,
      Value: status.Value?.toString(),
      valueStatus: displayRelevantFieldsValue(status),
    }));
    setEditingStatus(true); // Open edit mode
    // changeStatus();
    // alert(`You double-clicked on status: ${status.Status}`);
  };
  // Handle form submit (via onClick)
  const handleSubmit = async () => {
    try {
      if (!formData.Status) {
        showSideAlert(`Please enter status`, "error");
        return;
      }
      if (!formData.Value) {
        showSideAlert(`Please enter paid day value`, "error");
        return;
      }
      if (!formData.valueStatus) {
        showSideAlert(`Please select one of the types`, "error");
        return;
      }
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/Mobile/UpdateAtnStatus`,
        {
          ...formData,
          Created_By: user?.name,
          Present: formData.Present ? 1 : 0,
          Absent: formData.Absent ? 1 : 0,
          HalfDay: formData.HalfDay ? 1 : 0,
          WeekOff: formData.WeekOff ? 1 : 0,
          Relaxation: formData.Relaxation ? 1 : 0,
          Holiday: formData.Holiday ? 1 : 0,
          Leave: formData.Leave ? 1 : 0,
        },
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
            // compcode: user?.Comp_Code,name:user?.name,
          },
        }
      );
      setFormData({
        Utd: null,
        valueStatus: "",
        Status: "",
        Present: false,
        Absent: false,
        HalfDay: false,
        WeekOff: false,
        Relaxation: false,
        Holiday: false,
        Leave: false,
        colorCode: "#000000",
        Value: 0,
      });
      fetchStatuses();
      setEditingStatus(false);
      showSideAlert(`records updated successfully`, "success");
    } catch (error) {
      showSideAlert(
        `${
          error.response.data.Message
            ? error.response.data.Message
            : "error in please check the data"
        }`,
        "error"
      );
      // setFormData({
      //   Utd: null,
      //   valueStatus: '',
      //   Status: '',
      //   Present: 0,
      //   Absent: 0,
      //   HalfDay: 0,
      //   WeekOff: 0,
      //   Relaxation: 0,
      //   Holiday: 0,
      //   colorCode: '#000000',
      //   Value: 0
      // });
      // fetchStatuses();
      console.error("Error adding status:", error);
    }
  };
  const deleteTemplate = async (status) => {
    try {
      const confirmed = await Swal.fire({
        icon: "warning",
        title: "Are you sure?",
        text: "Do you want to Delete the status",
        confirmButtonText: "OK",
        cancelButtonText: "Cancel",
        showCancelButton: true,
      });
      if (confirmed.isConfirmed) {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_URL}/Mobile/DeleteAtnStatus`,
          { ...status, Created_By: user?.name },
          {
            headers: {
              compcode: user?.Comp_Code,
              name: user?.name,
              // compcode: user?.Comp_Code,name:user?.name,
            },
          }
        );
        setFormData({
          Utd: null,
          valueStatus: "",
          Status: "",
          Present: false,
          Absent: false,
          HalfDay: false,
          WeekOff: false,
          Relaxation: false,
          Holiday: false,
          Leave: false,
          colorCode: "#000000",
          Value: 0,
        });
        fetchStatuses();
        setEditingStatus(false);
        showSideAlert(`records updated successfully`, "success");
      }
    } catch (error) {
      showSideAlert(
        `${
          error.response.data.Message
            ? error.response.data.Message
            : "error in please check the data"
        }`,
        "error"
      );
      setFormData({
        Utd: null,
        valueStatus: "",
        Status: "",
        Present: false,
        Absent: false,
        HalfDay: false,
        WeekOff: false,
        Relaxation: false,
        Holiday: false,
        Leave: false,
        colorCode: "#000000",
        Value: 0,
      });
      fetchStatuses();
      console.error("Error adding status:", error);
    }
  };

  return (
    <div className="">
      <div className="relative">
        <div>
          <div className="md:col-span-12 gap-2">
            <div className="rounded-t bg-white dark:bg-dark px-6 py-2">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="px-1 flex font-semibold text-base lg:text-xl text-pretty uppercase">
                  <GrUserAdmin size={34} title="Payroll" />
                  <div className="ml-4">Add New Attendance Status</div>
                </div>
                <Button
                variant="print"
                className="flex items-center gap-1"
                onClick={() => window.history.back()}
              >
                Back
              </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 bg-[#f4f4f4c8] md:grid-cols-12 gap-2 shadow-signUp dark:bg-primary dark:bg-opacity-10 pb-4 rounded-lg p-2">
          <div className="col-span-12">
            <div className="w-full lg:w-1/4 md:w-1/2">
              <Ainput
                title="Status"
                type="text"
                name="Status"
                onKeyDown={(e) => {
                  if (e.key === "Tab") {
                    changeStatus();
                  }
                }}
                onBlur={changeStatus}
                value={formData.Status}
                handleInputChange={handleDateChange}
                className={`ring-1 focus-visible:ring-2`}
              />
            </div>
          </div>
          <div className="col-span-12  flex justify-start  items-start">
            <div className="flex flex-wrap justify-start  gap-6 mt-2">
              <div className="flex items-center justify-center">
                <CheckBoxDesign
                  className={"h-6 w-full"}
                  handleInputChange={handleDateChange}
                  name="Present"
                  firstvalue={formData.Present}
                  title="Present"
                />
              </div>
              <div className="flex items-center justify-center">
                <CheckBoxDesign
                  className={"h-6 w-full"}
                  handleInputChange={handleDateChange}
                  name="Absent"
                  firstvalue={formData.Absent}
                  title="Absent"
                />
              </div>
              <div className="flex items-center justify-center">
                <CheckBoxDesign
                  className={"h-6 w-full"}
                  handleInputChange={handleDateChange}
                  name="HalfDay"
                  firstvalue={formData.HalfDay}
                  title="HalfDay"
                />
              </div>
              <div className="flex items-center justify-center">
                <CheckBoxDesign
                  className={"h-6 w-full"}
                  handleInputChange={handleDateChange}
                  name="WeekOff"
                  firstvalue={formData.WeekOff}
                  title="WeekOff"
                />
              </div>
              <div className="flex items-center justify-center">
                <CheckBoxDesign
                  className={"h-6 w-full"}
                  handleInputChange={handleDateChange}
                  name="Relaxation"
                  firstvalue={formData.Relaxation}
                  title="Relaxation"
                />
              </div>
              <div className="flex items-center justify-center">
                <CheckBoxDesign
                  className={"h-6 w-full"}
                  handleInputChange={handleDateChange}
                  name="Holiday"
                  firstvalue={formData.Holiday}
                  title="Holiday"
                />
              </div>
              <div className="flex items-center justify-center">
                <CheckBoxDesign
                  className={"h-6 w-full"}
                  handleInputChange={handleDateChange}
                  name="Leave"
                  firstvalue={formData.Leave}
                  title="Leave"
                />
              </div>
            </div>
          </div>
          <div className="col-span-12 md:col-span-3">
            <Ainput
              title="Color Code"
              type="color"
              name="colorCode"
              value={formData.colorCode}
              handleInputChange={handleDateChange}
              className="ring-1 focus-visible:ring-2"
            />
          </div>

          <div className="col-span-12 md:col-span-3">
            <Ainput
              title="Paid Value (per day)"
              type="text"
              name="Value"
              value={formData.Value}
              handleInputChange={handleDateChange}
            />
          </div>
          <div className="col-span-12 md:col-span-3 flex items-end">
            <Button
              variant={editingStatus ? `update` : `save`}
              onClick={handleSubmit}
            >
              {editingStatus ? `Update` : `Add New`}
            </Button>
          </div>
        </div>

        <div>
          <div className="md:col-span-12 gap-2 mt-4">
            <div className="rounded-t bg-white dark:bg-dark   px-6 py-2">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="px-1 flex font-semibold text-base lg:text-xl text-pretty uppercase">
                  <FaUsers size={34} className="" title="Payroll" />
                  <div className="ml-4">Status Overview</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="shadow-signUp dark:bg-primary dark:bg-opacity-10 pb-4 rounded-lg p-2">
          <div className="grid grid-cols-12 gap-6 max-h-[300px] overflow-y-scroll">
            {statuses.map((status) => (
              <div className="lg:col-span-4 md:col-span-6 sm:col-span-12 col-span-12">
                <div
                  className={`grid grid-cols-12 gap-2  ${
                    status.Status == formData.Status
                      ? "bg-yellow bg-opacity-10 dark:bg-white dark:bg-opacity-50"
                      : "bg-white dark:bg-primary dark:bg-opacity-10"
                  }   p-3 rounded-lg shadow-md  justify-center items-center`}
                >
                  {/* <div className="col-span-12"> */}
                  <div className="col-span-9">
                    <div className="grid grid-cols-10">
                      <div className="col-span-3 lg:col-span-2 border-l-2	pl-2">
                        <h2 className="text-xl font-semibold">
                          {status.Status}
                        </h2>
                      </div>
                      <div className="col-span-7 lg:col-span-8">
                        <div className="text-sm">
                          {displayRelevantFields(status)}
                        </div>
                        <div className="text-sm">
                          Paid Value :- {status.Value}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-3 h-full w-full">
                    <div
                      className="w-full min-h-full rounded-lg flex justify-center items-center"
                      style={{ backgroundColor: status.colorCode }}
                    >
                      {status.colorCode}
                    </div>
                  </div>
                  <p className="col-span-9 text-xs text-gray-700">
                    Created At:{" "}
                    {new Date(status.Created_At).toLocaleDateString()}
                  </p>

                  <div className="col-span-3 flex justify-end">
                    <MdEditDocument
                      onClick={() => handleDoubleClick(status)}
                      className="cursor-pointer h-6 w-1/2 text-primary"
                    />
                    <MdDelete
                      type="button"
                      className="cursor-pointer h-6 w-1/2 text-exit"
                      onClick={() => deleteTemplate(status)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
