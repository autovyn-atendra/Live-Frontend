"use client";
import React, { useEffect, useState } from "react";
import MediumTitle from "@/components/atoms/MediumTitle";
import { Button } from "@/components/ui/button";
import Eselect from "@/components/atoms/Eselect";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import axios from "axios";
import Swal from "sweetalert2";
import HashloaderComponent from "@/components/Templates/hashloader";
import { GrUserAdmin } from "react-icons/gr";

const UserRightsPage = () => {
  const user = useCurrentUser();
  const [UserList, setUserList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    UTD: "",
    Branch_Code: user?.branch,
    Approver_1A: "",
    Approver_1B: "",
    Approver_1C: "",
    Approver_2A: "",
    Approver_2B: "",
    Approver_2C: "",
    Approver_3A: "",
    Approver_3B: "",
    Approver_3C: "",
    Created_By: user?.id,
    module: "tv",
  });
  const [formData1, setFormData1] = useState({
    UTD: "",
    Branch_Code: user?.branch,
    Approver_1A: "",
    Approver_1B: "",
    Approver_1C: "",
    Approver_2A: "",
    Approver_2B: "",
    Approver_2C: "",
    Approver_3A: "",
    Approver_3B: "",
    Approver_3C: "",
    module: "tvp",
    Created_By: user?.id,
  });

  const dropdowndata = async () => {
    try {
      setIsLoading(true);
      const result = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/Tvicm/findMasters`,
        {
          multi_loc: user?.branch,
          DMSMode: user?.Deal.includes("2.1.2") ? true : false,
        },
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
          },
        }
      );
      setUserList(result.data.data.UsersList[0]);
      setFormData((prevData) => ({
        ...prevData,
        ...result?.data?.data?.ApproverlistSale[0][0],
      }));
      setFormData1((prevData) => ({
        ...prevData,
        ...result?.data?.data?.ApproverlistPurchase[0][0],
      }));
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    dropdowndata();
  }, []);

  const handleinput = (name, value) => {
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };
  const handleinput1 = (name, value) => {
    setFormData1((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (Type: number) => {
    try {
      setIsLoading(true);

      const result = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/Tvicm/insertDataApproval`,
        {
          formData: Type == 1 ? formData : formData1,
        },
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
          },
        }
      );
      setIsLoading(false);
      dropdowndata();

      if (result.status === 200) {
        Swal.fire({
          icon: "success",
          title: "Data Save Successfully",
          text: "",
        });
      } else if (result.status === 201) {
        setIsLoading(false);
        Swal.fire({
          icon: "warning",
          title: result.data.message,
          text: "",
        });
      }
    } catch (error) {
      console.error("Error in savepurchase:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  const Refresh = () => {
    setFormData(() => ({
      UTD: "",
      Branch_Code: user?.branch,
      Approver_1A: "",
      Approver_1B: "",
      Approver_1C: "",
      Approver_2A: "",
      Approver_2B: "",
      Approver_2C: "",
      Approver_3A: "",
      Approver_3B: "",
      Approver_3C: "",
      module: "tv",
      Created_By: user?.id,
    }));
    setFormData1(() => ({
      UTD: "",
      Branch_Code: user?.branch,
      Approver_1A: "",
      Approver_1B: "",
      Approver_1C: "",
      Approver_2A: "",
      Approver_2B: "",
      Approver_2C: "",
      Approver_3A: "",
      Approver_3B: "",
      Approver_3C: "",
      module: "tvp",
      Created_By: user?.id,
    }));
    dropdowndata();
  };

  const Back = () => {
    history.back();
  };
  return (
    <main className="grid grid-cols-12 w-full">
      <div className={`col-span-12 lg:col-span-12`}>
        <div className="w-full px-1">
          <div className="relative flex dark:bg-primary dark:bg-opacity-10 flex-col min-w-0 break-words w-full shadow-lg rounded-lg bg-blueGray-100 border-0">
            <div className="rounded-t bg-white dark:bg-dark mb-0 px-6">
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <GrUserAdmin
                    size={22}
                    className="text-gray-600 dark:text-gray-300"
                  />
                  <MediumTitle text={"True Value Approval Hierarchy"} />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    variant={"print"}
                    onClick={() => {
                      Refresh();
                    }}
                  >
                    {" "}
                    Reset
                  </Button>
                  <Button
                    type="submit"
                    variant={"print"}
                    onClick={() => {
                      Back();
                    }}
                  >
                    Back
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-12 mt-2 gap-2">
              <div className="flex flex-col p-4 col-span-6 border-2 shadow-2xl">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex">
                    <MediumTitle text={"Sale Approval"} />
                  </div>
                  <div>
                    <Button
                      type="submit"
                      variant={"save"}
                      onClick={() => {
                        handleSubmit(1);
                      }}
                    >
                      Save
                    </Button>
                  </div>
                </div>

                <hr className="mb-4" />
                <div className="grid grid-cols-12 gap-x-2">
                  <div className="lg:col-span-4 md:col-span-6 col-span-12">
                    <Eselect
                      title="Approver 1-A"
                      name="Approver_1A"
                      option={UserList}
                      initialValue={formData?.Approver_1A?.toString()}
                      handleInputChange={handleinput}
                    />
                  </div>
                  <div className="lg:col-span-4 md:col-span-6 col-span-12">
                    <Eselect
                      title="Approver 1-B"
                      name="Approver_1B"
                      option={UserList}
                      initialValue={formData?.Approver_1B?.toString()}
                      handleInputChange={handleinput}
                    />
                  </div>
                  <div className="lg:col-span-4 md:col-span-6 col-span-12">
                    <Eselect
                      title="Approver 1-C"
                      name="Approver_1C"
                      option={UserList}
                      initialValue={formData?.Approver_1C?.toString()}
                      handleInputChange={handleinput}
                    />
                  </div>
                  <div className="lg:col-span-4 md:col-span-6 col-span-12">
                    <Eselect
                      title="Approver 2-A"
                      name="Approver_2A"
                      option={UserList}
                      initialValue={formData?.Approver_2A?.toString()}
                      handleInputChange={handleinput}
                    />
                  </div>
                  <div className="lg:col-span-4 md:col-span-6 col-span-12">
                    <Eselect
                      title="Approver 2-B"
                      name="Approver_2B"
                      option={UserList}
                      initialValue={formData?.Approver_2B?.toString()}
                      handleInputChange={handleinput}
                    />
                  </div>
                  <div className="lg:col-span-4 md:col-span-6 col-span-12">
                    <Eselect
                      title="Approver 2-C"
                      name="Approver_2C"
                      option={UserList}
                      initialValue={formData?.Approver_2C?.toString()}
                      handleInputChange={handleinput}
                    />
                  </div>
                  <div className="lg:col-span-4 md:col-span-6 col-span-12">
                    <Eselect
                      title="Approver 3-A"
                      name="Approver_3A"
                      option={UserList}
                      initialValue={formData?.Approver_3A?.toString()}
                      handleInputChange={handleinput}
                    />
                  </div>
                  <div className="lg:col-span-4 md:col-span-6 col-span-12">
                    <Eselect
                      title="Approver 3-B"
                      name="Approver_3B"
                      option={UserList}
                      initialValue={formData?.Approver_3B?.toString()}
                      handleInputChange={handleinput}
                    />
                  </div>
                  <div className="lg:col-span-4 md:col-span-6 col-span-12">
                    <Eselect
                      title="Approver 3-C"
                      name="Approver_3C"
                      option={UserList}
                      initialValue={formData?.Approver_3C?.toString()}
                      handleInputChange={handleinput}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col p-4 col-span-6 border-2 shadow-2xl">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex">
                    <MediumTitle text={"Purchase DO Approval"} />
                  </div>
                  <div>
                    <Button
                      type="submit"
                      variant={"save"}
                      onClick={() => {
                        handleSubmit(2);
                      }}
                    >
                      Save
                    </Button>
                  </div>
                </div>
                <hr className="mb-4" />

                <div className="grid grid-cols-12  gap-x-2 ">
                  <div className="lg:col-span-4 md:col-span-6 col-span-12">
                    <Eselect
                      title="Approver 1-A"
                      name="Approver_1A"
                      option={UserList}
                      initialValue={formData1?.Approver_1A?.toString()}
                      handleInputChange={handleinput1}
                    />
                  </div>
                  <div className="lg:col-span-4 md:col-span-6 col-span-12">
                    <Eselect
                      title="Approver 1-B"
                      name="Approver_1B"
                      option={UserList}
                      initialValue={formData1?.Approver_1B?.toString()}
                      handleInputChange={handleinput1}
                    />
                  </div>
                  <div className="lg:col-span-4 md:col-span-6 col-span-12">
                    <Eselect
                      title="Approver 1-C"
                      name="Approver_1C"
                      option={UserList}
                      initialValue={formData1?.Approver_1C?.toString()}
                      handleInputChange={handleinput1}
                    />
                  </div>
                  <div className="lg:col-span-4 md:col-span-6 col-span-12">
                    <Eselect
                      title="Approver 2-A"
                      name="Approver_2A"
                      option={UserList}
                      initialValue={formData1?.Approver_2A?.toString()}
                      handleInputChange={handleinput1}
                    />
                  </div>
                  <div className="lg:col-span-4 md:col-span-6 col-span-12">
                    <Eselect
                      title="Approver 2-B"
                      name="Approver_2B"
                      option={UserList}
                      initialValue={formData1?.Approver_2B?.toString()}
                      handleInputChange={handleinput1}
                    />
                  </div>
                  <div className="lg:col-span-4 md:col-span-6 col-span-12">
                    <Eselect
                      title="Approver 2-C"
                      name="Approver_2C"
                      option={UserList}
                      initialValue={formData1?.Approver_2C?.toString()}
                      handleInputChange={handleinput1}
                    />
                  </div>
                  <div className="lg:col-span-4 md:col-span-6 col-span-12">
                    <Eselect
                      title="Approver 3-A"
                      name="Approver_3A"
                      option={UserList}
                      initialValue={formData1?.Approver_3A?.toString()}
                      handleInputChange={handleinput1}
                    />
                  </div>
                  <div className="lg:col-span-4 md:col-span-6 col-span-12">
                    <Eselect
                      title="Approver 3-B"
                      name="Approver_3B"
                      option={UserList}
                      initialValue={formData1?.Approver_3B?.toString()}
                      handleInputChange={handleinput1}
                    />
                  </div>
                  <div className="lg:col-span-4 md:col-span-6 col-span-12">
                    <Eselect
                      title="Approver 3-C"
                      name="Approver_3C"
                      option={UserList}
                      initialValue={formData1?.Approver_3C?.toString()}
                      handleInputChange={handleinput1}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <HashloaderComponent isLoading={isLoading} />
    </main>
  );
};

export default UserRightsPage;
