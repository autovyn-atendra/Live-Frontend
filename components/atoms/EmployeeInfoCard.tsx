import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import Eselect from "@/components/atoms/Eselect";
import Image from "next/image";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import axios from "axios";
import { GrView } from "react-icons/gr";

interface EmployeeInfoCardProps {
    onEmpCodeSelect: (empcode: string) => void; // Callback to send selected empcode to the parent
}

const EmployeeInfoCard: React.FC<EmployeeInfoCardProps> = ({ onEmpCodeSelect }) => {
    const user = useCurrentUser();
    const [empcode, setEmpcode] = useState([]);
    const [formData, setFormData] = useState({
        EmpCode: "",
        EmpName: "",
        EMPLASTNAME: "",
        Sal_Region: "",
        Location: "",
        EMPLOYEEDESIGNATION: "",
        DIVISION: "",
        Department: "",
        GENDER: "",
        DATE_OF_JOINING: "",
        Absent_Days: "",
        Reporting_1: "",
        DOB: "",
        Present: "",
        Appraisal_Cycle: "",
        HOD: "",
        Promotion_Date: "",
        DOC_PATH: "",
        HR_Manager: "",

    });


    useEffect(() => {
        AllEmployee()
    }, [])


    const AllEmployee = async () => {
        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_URL}/employee/all`,
                {

                },
                {
                    headers: {
                        compcode: user?.Comp_Code,name:user?.name,
                    },
                }
            );

            console.log(response, "hgghf");
            setEmpcode(response.data?.data);


        } catch (error) {
            console.log("Response Data:", error.response);
        }
    };

    const handleEmpChange = async (name: string, value: string | number) => {
        const response = await axios.post(
            `${process.env.NEXT_PUBLIC_URL}/employee/BasicEmpdetails/${value}`,
            {},
            {
                headers: {
                    compcode: user?.Comp_Code,name:user?.name,
                },
            }
        );
        console.log(response, "response.data.data");
        setFormData(response.data.Result)
        onEmpCodeSelect(value.toString());

    };



    return (
        <div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-2">

                {/* Card 1: Basic Details */}
                <div className="col-span-12 lg:col-span-10 md:col-span-12 sm:col-span-12   rounded-b p-4 bg-white dark:bg-black border border-borderColor dark:border-borderColor-dark shadow">
                    <Card className=" ">
                        <div className="grid grid-cols-12 gap-1">
                            <div className="col-span-12 lg:col-span-1 md:col-span-12  ">
                                <label htmlFor="" className="mt-2 uppercase text-[13px] font-bold text-[#193A69] dark:text-[#E2E8F0]">Emp. Code</label>
                            </div>
                            <div className="col-span-12 md:col-span-5 -mt-1">
                                <Eselect
                                    title=""
                                    name="SrNo"
                                    handleInputChange={handleEmpChange}
                                    option={empcode}
                                    initialValue={""}
                                    className="border border-black"
                                />
                            </div>
                            <div className="col-span-12 md:col-span-6"></div>

                            <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                                <span className="w-1/3 text-left font-semibold text-[#193A69] dark:text-[#E2E8F0]">Employee Name</span>
                                <span className="w-1/12 text-center">:</span>
                                <span className="w-2/3 text-left">{formData?.EmpName}</span>
                            </div>

                            <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                                <span className="w-1/3 text-left font-semibold text-[#193A69] dark:text-[#E2E8F0]">Region</span>
                                <span className="w-1/12 text-center">:</span>
                                <span className="w-2/3 text-left">{formData?.Sal_Region}</span>
                            </div>

                            <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                                <span className="w-1/3 text-left font-semibold text-[#193A69] dark:text-[#E2E8F0]">Location</span>
                                <span className="w-1/12 text-center">:</span>
                                <span className="w-2/3 text-left">{formData?.Location}</span>
                            </div>

                            <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                                <span className="w-1/3 text-left font-semibold text-[#193A69] dark:text-[#E2E8F0]">Department</span>
                                <span className="w-1/12 text-center">:</span>
                                <span className="w-2/3 text-left">{formData?.Department}</span>
                            </div>

                            <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                                <span className="w-1/3 text-left font-semibold text-[#193A69] dark:text-[#E2E8F0]">Designation</span>
                                <span className="w-1/12 text-center">:</span>
                                <span className="w-2/3 text-left">{formData?.EMPLOYEEDESIGNATION}</span>
                            </div>

                            <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                                <span className="w-1/3 text-left font-semibold text-[#193A69] dark:text-[#E2E8F0]">Gender</span>
                                <span className="w-1/12 text-center">:</span>
                                <span className="w-2/3 text-left">{formData?.GENDER}</span>
                            </div>

                            <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                                <span className="w-1/3 text-left font-semibold text-[#193A69] dark:text-[#E2E8F0]">Date Of Joining</span>
                                <span className="w-1/12 text-center">:</span>
                                <span className="w-2/3 text-left">{formData?.DATE_OF_JOINING?.split("T")[0].split("-").reverse().join("-")}</span>
                            </div>

                            <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                                <span className="w-1/3 text-left font-semibold text-[#193A69] dark:text-[#E2E8F0]">Date Of Birth</span>
                                <span className="w-1/12 text-center">:</span>
                                <span className="w-2/3 text-left">{formData?.DOB?.split("T")[0].split("-").reverse().join("-")}</span>
                            </div>

                            <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                                <span className="w-1/3 text-left font-semibold text-[#193A69] dark:text-[#E2E8F0]">Reporting1</span>
                                <span className="w-1/12 text-center">:</span>
                                <span className="w-2/3 text-left">{formData?.Reporting_1}</span>
                            </div>

                            <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                                <span className="w-1/3 text-left font-semibold text-[#193A69] dark:text-[#E2E8F0]">HOD</span>
                                <span className="w-1/12 text-center">:</span>
                                <span className="w-2/3 text-left">{formData?.HOD}</span>
                            </div>

                            <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                                <span className="w-1/3 text-left font-semibold text-[#193A69] dark:text-[#E2E8F0]">HR Manager</span>
                                <span className="w-1/12 text-center">:</span>
                                <span className="w-2/3 text-left">{formData?.HR_Manager}</span>
                            </div>

                        </div>
                    </Card>
                </div>

                <div className="col-span-12 lg:col-span-2 md:col-span-12 sm:col-span-12   rounded-b p-4 bg-white dark:bg-black border border-borderColor dark:border-borderColor-dark shadow">
                    <Card className="">
                        <label className="flex h-[203px] items-center justify-center ">
                            {formData?.DOC_PATH ? (
                                <Image
                                    width={80}
                                    height={80}
                                    src={formData?.DOC_PATH}
                                    alt="Uploaded"
                                    className="w-full h-full object-fill rounded-lg"
                                />
                            ) : (
                                <span className="text-gray-500 dark:text-gray-400 flex flex-col items-center">
                                    <GrView size={50} className="text-yellow" />
                                    <span className="text-sm mt-2">No Image Available</span>
                                </span>
                            )}
                        </label>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default EmployeeInfoCard;
