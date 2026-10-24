

"use client";

import { useCurrentUser } from "@/app/hooks/use-current-user";
import HashloaderComponent from "@/components/Templates/hashloader";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { motion } from "framer-motion";
import { FaUsers } from "react-icons/fa";
import Image from "next/image";
import Eselect from "@/components/atoms/Eselect";
import FselectMulti from "@/components/atoms/Fselectmulti";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog2";


export default function SalaryLock() {
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [locationData, setLocationData] = useState<any[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [warning, setWarning] = useState("");
  const [lockLocations, setLockLocations] = useState([]);
  const [showWarning, setShowWarning] = useState(false);
  const [showLockLocations, setShowLockLocations] = useState(false);
  const [CHANEELOPTION, setChannelOption] = useState([]);
  const [CLUSTEROPTION, setClusterOption] = useState([]);
  const [SalRegionoption, setSalRegionoption] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [processData, setProcessData] = useState(null);
  const [LocationSearch, setLocationSearch] = useState('');
  const [formData, setFormData] = useState({
    Channel: null,
    Cluster: null,
    Region: null,
    Month: null,
  });

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    label: (i + 1).toString(),
    value: (i + 1).toString()
  }));

  const user = useCurrentUser();

  function showSideAlert(message: string, type: string) {
    const Toast = Swal.mixin({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 15000,
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
  const handleUpdateLocation = async () => {
    setWarning("");
    setLockLocations([]);
    if (selectedLocations.length == 0) {
      showSideAlert("Please select a Location", "warning")
      return;
    }
    if (!formData?.Month) {
      showSideAlert("Please select a month", "warning")
      return;
    }
    setIsLoading(true)
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/SalaryLock/emp_slryrun_byLoction`,
        {
          MONTH: formData?.Month,
          locations: selectedLocations,
        },
        {
          headers: {
            compcode: user.Comp_Code,
            name: user.name,
          },
        }
      );

      if (response.data.success) {
        showSideAlert(response?.data?.message, "success");
      }
      console.log("API Response:sfafesrer", response.data);
      if (response.data.lockedLocations) {
        console.log(response?.data?.lockedLocations, "lokedresponse")
        const lockedLocation = response.data.lockedLocations
          || [];
        setLockLocations(lockedLocation);
        console.log("lockedlocations", lockedLocation);
      }
      if (response.data.warning) {
        const warningMessage = `${response?.data?.warning || ""}`;
        setWarning(warningMessage);
      }
      setFormData({
        Channel: null,
        Cluster: null,
        Region: null,
        Month: null,
      });
      setSelectedLocations([])
    } catch (error) {
      // Log the error and show an alert
      console.error("Error occurred while updating location:", error);
      showSideAlert("Error occurred while updating location. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };


  const fetchLocationData = async () => {
    if (user?.EMPCODE && user?.Comp_Code) {
      setIsLoading(true);
      try {
        const locationsArray = user?.branch
          ? String(user.branch).split(",").map(Number)
          : [];

        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_URL}/ars/Emp_AtnrunGetLocation_1`,
          {
            locations: locationsArray,
            Channel: formData.Channel,
            Cluster: formData.Cluster,
            Region: formData.Region,
          },
          {
            headers: {
              compcode: user.Comp_Code,
              name: user.name,
            }
          }
        );

        setLocationData(response?.data?.results || []);
      } catch (error) {
        console.error("Error fetching locations:", error);
        showSideAlert("Error fetching data", "error");
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (user?.branch) {
      fetchLocationData();
    }
  }, [user?.branch, formData.Channel, formData.Cluster, formData.Region]);



  const handleCheckboxChange = (value: number) => {
    setSelectedLocations((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
    setWarning("");
    setLockLocations([]);
  };

  const handleSelectAll = () => {
    if (selectedLocations.length === filteredLocations.length) {
      setSelectedLocations([]);
    } else {
      setSelectedLocations(
        filteredLocations.map((loc) => loc.value)
      );
    }
    setWarning("");
    setLockLocations([]);
  };

  useEffect(() => {
    if (warning) {
      const timer = setTimeout(() => {
        setShowWarning(true);
      }, 1500); // Delay for warning
      return () => clearTimeout(timer);
    }
  }, [warning]);

  useEffect(() => {
    if (lockLocations.length > 0) {
      const timer = setTimeout(() => {
        setShowLockLocations(true);
      }, 2000); // Delay for locked locations after warning
      return () => clearTimeout(timer);
    }
  }, [lockLocations]);


  const handleInputChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  useEffect(() => {
    const fetchData = async () => {
      const data = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/employee/masters`,
        {},
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
          },
        }
      )
      const convertValuesToString = (array) => {
        return array.map((obj) => {
          return {
            label: obj.label,
            value: String(obj.value),
          };
        });
      };
      const masters = data.data.data;
      setChannelOption(convertValuesToString(masters.CHANNEL1));
      setClusterOption(convertValuesToString(masters.CLUSTER1));
      setSalRegionoption(convertValuesToString(masters.Sal_Region));

    };
    fetchData();
  }, []);

  useEffect(() => {
    fetchAlredyProcData();
  }, []);

  const fetchAlredyProcData = async () => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/SalaryLock/AlredyProcess_Slry_cal`,
        { locations: user?.branch },
        {
          headers: {
            compcode: user.Comp_Code,
            name: user.name,
          },
        }
      );

      const data = response.data;
      console.log(data, "Already Process Response");

      if (data.Status && data.modelVisible) {
        setProcessData(data);
        setIsModalVisible(true);
      } else {
        setIsModalVisible(false);
      }
    } catch (error) {
      console.error("Error fetching Already Process Data:", error);
      showSideAlert("Error fetching Already Process Data", "error");
    } finally {
      setIsLoading(false);
    }
  };


  const filteredLocations = locationData.filter((location) =>
    location.label
      ?.toLowerCase()
      .includes(LocationSearch.toLowerCase())
  );


  return (
    <div className="grid grid-cols-12">
      <div className="col-span-12 rounded-t bg-header dark:bg-black px-2 md:px-6 py-2 border dark:border-borderColor-dark">

        <div className="flex    justify-between ">
          <h1 className="font-bold sm:text-sm md:text-lg lg:text-xl text-white dark:text-[#37a9dd] flex items-center gap-x-3 uppercase">
            <Image src="/Payrollicon/attendence_calculation.png" alt="Autovyn" width={25} height={25} />
            Salary Calculation (All Locations)
          </h1>
          <div className="flex gap-2 ">
            <Button variant="print" onClick={() => { window.history.back() }}>Back</Button>
          </div>
        </div>
      </div>
      <div className="col-span-12 md:col-span-3"></div>
      <div className="col-span-12 md:col-span-6">
        <div className="col-span-12 rounded-t bg-header dark:bg-black px-6 py-2 border dark:border-borderColor-dark mt-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between items-center">
            <h1 className="font-bold sm:text-sm md:text-lg lg:text-xl text-white dark:text-[#37a9dd] flex items-center gap-x-3 uppercase">
              Choose Your Locations
            </h1>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="print"
                type="submit"
                onClick={() => window.location.reload()}
              >
                Reset
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-2 md:gap-3 rounded-b p-2 md:p-4 bg-white dark:bg-black border border-borderColor dark:border-borderColor-dark shadow">

          {/* <div className="col-span-12 md:col-span-3 flex justify-between items-center">
            <Eselect
              title={"Channel"}
              name={"Channel"}
              initialValue={formData.Channel?.toString()}
              option={CHANEELOPTION}
              handleInputChange={handleInputChange}
              h={9}
            />
          </div> */}

          <div className="col-span-12 md:col-span-3 flex justify-between items-center">
            <FselectMulti
              initialValue={formData.Channel?.toString()}
              name="Channel"
              option={CHANEELOPTION}
              handleInputChange={handleInputChange}
              title="Channel"
              isMulti={true}
              h={9}
            />
          </div>

          <div className="col-span-12 md:col-span-3 flex justify-between items-center">
            <FselectMulti
              initialValue={formData.Cluster?.toString()}
              name="Cluster"
              option={CLUSTEROPTION}
              handleInputChange={handleInputChange}
              title="Cluster"
              isMulti={true}
              h={9}
            />
          </div>


          <div className="col-span-12 md:col-span-3 ">
            <Eselect
              title={"Region"}
              name={"Region"}
              initialValue={formData.Region?.toString()}
              option={SalRegionoption}
              handleInputChange={handleInputChange}
              h={9}
            />
          </div>
          <div className="col-span-12 md:col-span-3  ">
            <Eselect
              title={"Month"}
              name={"Month"}
              initialValue={formData.Month?.toString()}
              option={monthOptions}
              handleInputChange={handleInputChange}
              h={9}
            />
          </div>

          <div className="col-span-12 md:col-span-6 mt-3">
            <input
              placeholder="search"
              value={LocationSearch}
              onChange={(e) => setLocationSearch(e.target.value)}
              type="search"
              className="h-9 px-3  border border-borderColor dark:border-borderColor-dark rounded w-full text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
            />
          </div>

          <div className="col-span-12 p-1">
            <div className="border rounded p-2">
              {/* <h2 className="font-bold mb-2">Locations</h2> */}
              <div className="max-h-64 overflow-y-auto">
                {isLoading ? (
                  <HashloaderComponent isLoading={isLoading} />
                ) : (
                  filteredLocations.map((location) => (
                    <div
                      key={location.value}
                      className="flex items-center justify-between border-b p-1"
                    >
                      <label className="flex items-center space-x-2 text-header dark:text-white">
                        <input
                          type="checkbox"
                          checked={selectedLocations.includes(location.value)}
                          onChange={() => handleCheckboxChange(location.value)}
                          className="size-3.5 hover:cursor-pointer"
                          aria-label={`Select ${location.label}`}
                        />
                        <span className="hover:cursor-pointer">
                          {location.label}
                        </span>
                      </label>
                      {/* <span className="text-gray-500">
                        {location.Join_Date
                          ? location.Join_Date.split('T')[0].split('-').reverse().join('-')
                          : 'N/A'}
                      </span> */}
                    </div>
                  ))
                )}
              </div>
              <button
                className="mt-2 bg-blue-500 px-3 py-1 rounded text-header dark:text-white"
                onClick={handleSelectAll}
              >
                {selectedLocations.length === filteredLocations.length ? (
                  <b>Deselect All</b>
                ) : (
                  <b>Select All Regions</b>
                )}
              </button>
            </div>
          </div>

          <div className="col-span-12 mt-4 flex justify-center gap-x-2">
            <Button
              variant="update"
              type="submit"
              onClick={handleUpdateLocation}
            >
              Update
            </Button>
            <Button
              size="default"
              variant="print"
              onClick={() => history.back()}
              className="mr-3"
            >
              Back
            </Button>
          </div>
          <HashloaderComponent isLoading={isLoading} />

        </div>


        <div className="col-span-12">
          {showWarning && warning && (
            <motion.div
              initial={{ x: -100, opacity: 0 }}    // LEFT se aane wala
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.7, type: "spring", bounce: 0.3 }}
              className="backdrop-blur-md border-4 border-yellow rounded-xl p-6 shadow-2xl mb-6 mt-5"
            >
              <motion.p
                animate={{ opacity: [1, 0, 1] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "loop",
                  ease: "easeInOut",
                }}
                className="text-yellow text-2xl font-bold font-sans flex items-center gap-2"
              >
                ⚠️ Warning
              </motion.p>

              <p className="mt-2 text-header dark:text-white text-lg font-medium font-sans">
                {warning}
              </p>
            </motion.div>
          )}

        </div>
        {/* Locked Locations Section */}
        <div className="col-span-12">
          {showLockLocations && lockLocations.length > 0 && (
            <motion.div
              initial={{ x: -100, opacity: 0 }}    // LEFT se aane wala
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.7, type: "spring", bounce: 0.4 }}
              className="backdrop-blur-md border-4 border-exit rounded-xl p-6 shadow-2xl mt-4"
            >
              <motion.h2
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "loop",
                  ease: "easeInOut",
                }}
                className="text-exit text-2xl font-bold font-sans flex items-center gap-2"
              >
                🔒 Already Updated Salary Locations
              </motion.h2>

              <ul className="mt-2 list-disc pl-6 text-header dark:text-white text-lg font-medium font-sans">
                {lockLocations.map((loc, index) => (
                  <motion.li
                    key={index}
                    className="transition-all duration-300"
                  >
                    {loc.label}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>
      </div>



      {/* // add for procees data  */}
      <Dialog
        open={isModalVisible}
        onOpenChange={(open) => {
          setIsModalVisible(open);
        }}
      >
        <DialogContent className="w-full max-w-screen-xl lg:h-[640px]">
          <DialogHeader>

            <DialogTitle className="mt-2 ml-3 flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                Salary Calculation Process is Already In Progress
              </h1>
            </DialogTitle>
            <hr className="bg-body-color mx-2" />
            {/* SHOW DATA HERE */}
            {processData && (
              <div className="p-4">
                <div className="text-base flex items-center gap-4">
                  <p><b>Total Pending Employees :</b> {processData?.total_emp || 0}</p>
                  <p><b>Estimated Waiting Time :</b> {processData?.estimated_time || "0 minutes"}</p>
                </div>
                <div className="mt-4 border-t pt-3 max-h-[400px] overflow-y-scroll">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="font-semibold">
                        <td>Emp Code</td>
                        <td>Month</td>
                        <td>Location</td>
                        <td>Imported By</td>
                        <td>Imported On</td>
                      </tr>
                    </thead>

                    <tbody>
                      {processData?.result?.map((row, idx) => (
                        <tr key={idx} className="border-t">
                          <td>{row.Emp_Code}</td>
                          <td>{row.Rerun}</td>
                          <td>{row.loc_name}</td>
                          <td>{row.Created_by}</td>
                          <td>
                            {new Date(row.Created_At).toISOString().replace('T', ' ').slice(0, 19)}
                          </td>
                        </tr>
                      ))}
                    </tbody>

                  </table>
                </div>

              </div>
            )}
          </DialogHeader>
        </DialogContent>
      </Dialog>


    </div >
  );
}
