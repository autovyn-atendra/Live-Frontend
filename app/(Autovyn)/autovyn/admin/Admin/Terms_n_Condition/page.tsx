"use client";
import React, { useEffect, useState } from "react";
import Ainput from "@/components/atoms/Input";
import { Button } from "@/components/ui/button";
import axios from "axios";
import Swal from "sweetalert2";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { FaUsers } from "react-icons/fa";
import SmallTitle from "@/components/atoms/smallTitle";
import SelectSearch from "@/components/atoms/Select";
import DataTable from "@/components/Templates/ServiceTable";
import MediumTitle from "@/components/atoms/MediumTitle";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import { useToast } from "@/components/ui/use-toast";
import Fselect from "@/components/atoms/Fselectuser";
import { IoCart } from "react-icons/io5";
import Image from "next/image";
import ATextArea from "@/components/atoms/textArea";
import HashloaderComponent from "@/components/Templates/hashloader";

const Gatepass = () => {
    const user = useCurrentUser();
    const { toast } = useToast();
    const [isClicked, setIsClicked] = useState(false);

    const getCurrentDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const initaldata = {
        TERMS: "",
        SEGMENT_CODE: "",
        SEGMENT_DTL_CODE: "",
        TERMS_DTL: "",
        SEQ_NO: "",
        SRNO: "",
        SUB_SEQ_NO: "",
        Created_by: user?.name,
    };

    const [formdata, setFormdata] = useState(initaldata);
    const [tabledata, setTabledata] = useState([]);
    const [tabledata2, setTabledata2] = useState([]);
    const [SegmentData, setSegmentData] = useState([]);
    const [SegmentDataDtl, setSegmentDataDtl] = useState([]);
    const [TermHeading, setTermHeading] = useState([]);
    const [IsUpateDisabled, setIsUpateDisabled] = useState(true);
    const [IsSaveDisabled, setIsSaveDisabled] = useState(false);

    const [IsdtlUpateDisabled, setIsdtlUpateDisabled] = useState(true);
    const [IsdtlSaveDisabled, setIsdtlSaveDisabled] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [Id, setId] = useState([]);

    const columns = [
        {
            Header: "TID",
            accessor: "TID",
            width: 10,
        },
        {
            Header: "TERMS",
            accessor: "TERMS",
            width: 10,
        },
        {
            Header: "SEGMENT",
            accessor: "SEGMENT_NAME",
            width: 10,
        },
        {
            Header: "Created By",
            accessor: "Created_By",
            width: 10,
        },
    ];


    const columns2 = [
        {
            Header: "TID",
            accessor: "TID",
            width: 10,
        },
        {
            Header: "SEGMENT",
            accessor: "SEGMENT_NAME",
            width: 10,
        },
        {
            Header: "TERMS HEADING",
            accessor: "TERMS_HEADING",
            width: 10,
        },
        {
            Header: "TERMS SUB HEADING",
            accessor: "TERMS_SUB_HEADING",
            width: 10,
        },
        {
            Header: "TERMS SUB-SUB HEADING",
            accessor: "TERMS_SUB_SUB_HEADING",
            width: 10,
        },
        {
            Header: "Created By",
            accessor: "Created_BY",
            width: 10,
        },
    ];

    const handleInputChange = (name, value) => {
        if (name == "TERMS_DTL") {

            const selected = TermHeading.find(item => item.value === value);
            setFormdata((prev) => ({
                ...prev,
                TERMS_DTL: value,        // MST_TID
                SRNO: selected?.SRNO || ""
            }));

        } else {
            setFormdata((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };


    const submitbtn = async () => {
        if (!formdata.SEGMENT_CODE) {
            toast({
                title: "Please Select Segment",
                variant: "destructive",
            });
            return;
        }
        if (!formdata.TERMS) {
            toast({
                title: "Please Enter Term Heading",
                variant: "destructive",
            });
            return;
        }
        try {
            setIsLoading(true)
            const result = await axios.post(`${process.env.NEXT_PUBLIC_URL}/users/SaveTermsnCondition`,
                { ...formdata }, // Ensure the icon is included
                {
                    headers: {
                        compcode: user?.Comp_Code, name: user?.name,
                    },
                }
            );
            setIsLoading(false)
            if (result.status === 200) {
                Swal.fire({
                    icon: "success",
                    title: "Success!",
                    text: "Terms Heading added successfully.",
                });

                await employeeview();
                window.location.reload();
                // Reset form data
                setFormdata({
                    TERMS: "",
                    SEGMENT_CODE: "",
                    SEGMENT_DTL_CODE: "",
                    TERMS_DTL: "",
                    SEQ_NO: "",
                    SRNO: "",
                    SUB_SEQ_NO: "",
                    Created_by: user?.name,
                });
            }
        } catch (error) {
            setIsLoading(false)
            Swal.fire({
                icon: "error",
                title: "Error",
                text: `${error.response?.data?.Message || "An error occurred"}`,
            });
        } finally {
            setIsLoading(false)
        }
    };

    const updatebtn = async () => {
        console.log(formdata, 'formdata')
        if (!formdata.SEGMENT_CODE) {
            toast({
                title: "Please Select Segment",
                variant: "destructive",
            });
            return;
        }
        if (!formdata.TERMS) {
            toast({
                title: "Please Enter Term Heading",
                variant: "destructive",
            });
            return;
        }

        try {
            setIsLoading(true)
            // Update the category with new data
            const result = await axios.post(
                `${process.env.NEXT_PUBLIC_URL}/users/UpdateTermsnCondition`,
                {
                    SEGMENT_CODE: formdata.SEGMENT_CODE,
                    TERMS: formdata?.TERMS,
                    TID: formdata?.TID,
                    Created_by: user?.name

                },
                {
                    headers: {
                        compcode: user?.Comp_Code, name: user?.name,
                    },
                }
            );
            setIsLoading(false)
            if (result.status === 200) {
                Swal.fire({
                    icon: "success",
                    title: "Success!",
                    text: "Terms Heading Updated successfully.",
                });

                await employeeview();
                window.location.reload();
                setFormdata({
                    TERMS: "",
                    SEGMENT_CODE: "",
                    SEGMENT_DTL_CODE: "",
                    TERMS_DTL: "",
                    SEQ_NO: "",
                    SRNO: "",
                    SUB_SEQ_NO: "",
                    Created_by: user?.name,
                });
                setIsUpateDisabled(true);
                setIsSaveDisabled(false);
            }
        } catch (error) {
            setIsLoading(false)
            Swal.fire({
                icon: "error",
                title: "Error",
                text: `${error.response?.data?.Message || "An error occurred"}`,
            });
        } finally {
            setIsLoading(false)
        }
    };

    const ondoubleclick = async (row) => {
        setFormdata((prev) => ({
            ...prev,
            TERMS: row.TERMS || "",
            SEGMENT_CODE: row.SEGMENT_CODE || "",
            Created_by: row.Created_By || user?.name,
            TID: row.TID
        }));
        setId(row.Id);
        setIsUpateDisabled(false);
        setIsSaveDisabled(true);
    };
    const employeeview = async () => {
        try {
            const result = await axios.post(
                `${process.env.NEXT_PUBLIC_URL}/users/ViewTIDMst`,
                {},
                {
                    headers: {
                        compcode: user?.Comp_Code, name: user?.name,
                    },
                }
            );
            console.log(result, "result.data?.Result");
            setTabledata(result.data?.results);
        } catch (error) {
            console.error("Error occurred while making the get request:", error);
        }
    };

    useEffect(() => {
        employeeview();
    }, []);

    const DepartmentMaster = async () => {
        try {
            const result = await axios.post(
                `${process.env.NEXT_PUBLIC_URL}/dashboards/Predata`,
                {
                    branch: user?.branch
                },
                {
                    headers: {
                        compcode: user?.Comp_Code, name: user?.name,
                    },
                }
            );
            setSegmentData(result.data.BR_SEGMENT_FORTID);
            setSegmentDataDtl(result.data.BR_SEGMENT_FORTIDDTL);
        } catch (error) {
            console.error("Error occurred while making the get request:", error);
        }
    };

    useEffect(() => {
        DepartmentMaster();
    }, []);

    const ShowTermHeadingData = async () => {
        console.log(formdata, 'formdata')
        if (!formdata?.SEGMENT_DTL_CODE) {
            setTermHeading([]); // Clear previous data
            return;
        }
        try {
            const result = await axios.post(
                `${process.env.NEXT_PUBLIC_URL}/users/ShowTermHeadingData`,
                {
                    branch: user?.branch,
                    SEGMENT_CODE: formdata?.SEGMENT_DTL_CODE
                },
                {
                    headers: {
                        compcode: user?.Comp_Code, name: user?.name,
                    },
                }
            );
            console.log(result.data, 'result.data')
            setTermHeading(result.data.results);
        } catch (error) {
            console.error("Error occurred while making the get request:", error);
        }
    }

    useEffect(() => {
        ShowTermHeadingData();
    }, [formdata?.SEGMENT_DTL_CODE]);


    const submitdtlbtn = async () => {
        console.log(formdata, 'formdata')
        if (!formdata.SEGMENT_DTL_CODE) {
            toast({
                title: "Please Select Segment",
                variant: "destructive",
            });
            return;
        }
        if (!formdata.TERMS_DTL) {
            toast({
                title: "Please Enter Term Heading",
                variant: "destructive",
            });
            return;
        }
        if (!formdata.SEQ_NO) {
            toast({
                title: "Please Enter Term Sub Heading",
                variant: "destructive",
            });
            return;
        }
        try {
            setIsLoading(true)
            const result = await axios.post(`${process.env.NEXT_PUBLIC_URL}/users/SaveDtlTermsnCondition`,
                { ...formdata }, // Ensure the icon is included
                {
                    headers: {
                        compcode: user?.Comp_Code, name: user?.name,
                    },
                }
            );
            setIsLoading(false)
            if (result.status === 200) {
                Swal.fire({
                    icon: "success",
                    title: "Success!",
                    text: "Terms Heading added successfully.",
                });
                // Reset form data
                setFormdata({
                    TERMS: "",
                    SEGMENT_CODE: "",
                    SEGMENT_DTL_CODE: "",
                    TERMS_DTL: "",
                    SEQ_NO: "",
                    SRNO: "",
                    SUB_SEQ_NO: "",
                    Created_by: user?.name,
                });
            }
            await DtlDataView()
            window.location.reload();
        } catch (error) {
            console.log(error,'error')
            setIsLoading(false)
            Swal.fire({
                icon: "error",
                title: "Error",
                text: `${error.response?.data?.Message || "An error occurred"}`,
            });
        } finally {
            setIsLoading(false)
        }
    };

    const updatedtlbtn = async () => {
        console.log(formdata, 'formdata')
        if (!formdata.SEGMENT_DTL_CODE) {
            toast({
                title: "Please Select Segment",
                variant: "destructive",
            });
            return;
        }
        if (!formdata.TERMS_DTL) {
            toast({
                title: "Please Enter Term Heading",
                variant: "destructive",
            });
            return;
        }
        if (!formdata.SEQ_NO) {
            toast({
                title: "Please Enter Term Sub Heading",
                variant: "destructive",
            });
            return;
        }

        try {
            setIsLoading(true)
            // Update the category with new data
            const result = await axios.post(
                `${process.env.NEXT_PUBLIC_URL}/users/UpdateDtlTermsnCondition`,
                {
                    SEGMENT_CODE: formdata.SEGMENT_DTL_CODE,
                    TERMS_DTL: formdata?.TERMS_DTL,
                    SEQ_NO: formdata?.SEQ_NO,
                    SUB_SEQ_NO: formdata?.SUB_SEQ_NO,
                    SRNO: formdata?.SRNO,
                    TID: formdata?.TID,
                    Created_by: user?.name

                },
                {
                    headers: {
                        compcode: user?.Comp_Code, name: user?.name,
                    },
                }
            );
            setIsLoading(false)
            if (result.status === 200) {
                Swal.fire({
                    icon: "success",
                    title: "Success!",
                    text: "Terms Heading Updated successfully.",
                });
                setFormdata({
                    TERMS: "",
                    SEGMENT_CODE: "",
                    SEGMENT_DTL_CODE: "",
                    TERMS_DTL: "",
                    SEQ_NO: "",
                    SRNO: "",
                    SUB_SEQ_NO: "",
                    Created_by: user?.name,
                });
                setIsdtlUpateDisabled(true);
                setIsdtlSaveDisabled(false);
            }
            await DtlDataView()
            window.location.reload();
        } catch (error) {
            setIsLoading(false)
            Swal.fire({
                icon: "error",
                title: "Error",
                text: `${error.response?.data?.Message || "An error occurred"}`,
            });
        } finally {
            setIsLoading(false)
        }
    };

    const DtlDataView = async () => {
        try {
            const result = await axios.post(
                `${process.env.NEXT_PUBLIC_URL}/users/ViewTIDDtl`,
                {},
                {
                    headers: {
                        compcode: user?.Comp_Code, name: user?.name,
                    },
                }
            );
            console.log(result, "result.data?.results");
            setTabledata2(result.data?.results);
        } catch (error) {
            console.error("Error occurred while making the get request:", error);
        }
    };

    useEffect(() => {
        DtlDataView();
    }, []);

    const ondoubleclick2 = async (row) => {
        console.log(row, 'row')
        setFormdata((prev) => ({
            ...prev,
            SEGMENT_DTL_CODE: row.SEGMENT_CODE || "",
            TERMS_DTL: row.MST_TID || "",
            SEQ_NO: row.TERMS_SUB_HEADING || "",
            SUB_SEQ_NO: row.TERMS_SUB_SUB_HEADING || "",
            Created_by: row.Created_By || user?.name,
            TID: row.TID
        }));
        setId(row.Id);
        setIsdtlUpateDisabled(false);
        setIsdtlSaveDisabled(true);
    };

    return (
        <main className="w-full">

            <div className="col-span-12 flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-1">
                {/* LEFT SIDE */}
                <div className="flex gap-3 items-center">
                    <Image src="/Adminicon/Terms_condition.svg" alt="Autovyn" width={50} height={50} className="text-white" />
                    <div className="flex flex-col">
                        <h1 className="font-bold text-lg sm:text-xl lg:text-2xl text-header dark:text-white uppercase">
                            TERMS AND CONDITION
                        </h1>
                        <h2 className="font-semibold text-sm sm:text-base lg:text-lg text-[#757575] dark:text-white">
                            The terms below outline your rights and responsibilities
                        </h2>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 md:gap-3 w-full md:w-auto">
                    <Button
                        variant={"print"}
                        onClick={() => window.history.back()}
                        className="flex-1 sm:flex-none px-0 sm:px-8 md:px-8"
                    >
                        Back
                    </Button>
                </div>
            </div>

            {/* First Section - Terms Mst Data */}
            <div className="col-span-12 mt-3 rounded-t bg-off dark:bg-black px-3 py-2 border border-b-0 border-body-color dark:border-[#D0D5DD] shadow-sm">
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-sm sm:text-base text-[#757575] dark:text-white">
                        Terms Mst Data
                    </h2>
                    <div className="flex gap-2 md:gap-3">
                        <Button
                            variant={"save"}
                            onClick={submitbtn}
                            disabled={IsSaveDisabled}
                            className="px-0 sm:px-8 md:px-8"
                        >
                            Save
                        </Button>
                        <Button
                            variant={"update"}
                            onClick={updatebtn}
                            disabled={IsUpateDisabled}
                            className="px-0 sm:px-6 md:px-6"
                        >
                            Update
                        </Button>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-12 gap-3 w-full">
                <div className="col-span-12 xl:col-span-4 gap-2 md:gap-3 rounded-b p-2 md:p-4 h-auto lg:h-auto sm:h-auto xl:h-[440px] bg-white dark:bg-black border border-borderColor dark:border-borderColor-dark shadow">
                    <div className="grid grid-cols-12">
                        <div className="col-span-12 md:col-span-12 items-center justify-center">
                            <Fselect
                                name="SEGMENT_CODE"
                                option={SegmentData}
                                handleInputChange={handleInputChange}
                                title={"Segment"}
                                initialValue={formdata.SEGMENT_CODE}
                            />
                        </div>
                        <div className="col-span-12 md:col-span-12 mt-2 items-center justify-center">
                            <Ainput
                                title="Term Heading"
                                type="text"
                                handleInputChange={handleInputChange}
                                name={"TERMS"}
                                value={formdata.TERMS}
                            />
                        </div>
                    </div>
                </div>

                <div className="col-span-12 xl:col-span-8">
                    <div className="grid grid-cols-12 gap-2 md:gap-3 rounded-b p-2 md:p-4 bg-white dark:bg-black border border-borderColor dark:border-borderColor-dark shadow">
                        <div className="col-span-12 xl:col-span-12">
                            <DataTable
                                columns={columns}
                                data={tabledata}
                                onRowDoubleClick={ondoubleclick}
                                filterPosition="FilterData"
                                numericFilterColumns={[]}
                                height="300px"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Second Section - Terms Dtl Data */}
            <div className="col-span-12 mt-3 rounded-t bg-off dark:bg-black px-3 py-2 border border-b-0 border-body-color dark:border-[#D0D5DD] shadow-sm">
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-sm sm:text-base text-[#757575] dark:text-white">
                        Terms Dtl Data
                    </h2>
                    <div className="flex gap-2 md:gap-3">
                        <Button
                            variant={"save"}
                            onClick={submitdtlbtn}
                            disabled={IsdtlSaveDisabled}
                            className="px-0 sm:px-8 md:px-8"
                        >
                            Save
                        </Button>
                        <Button
                            variant={"update"}
                            onClick={updatedtlbtn}
                            disabled={IsdtlUpateDisabled}
                            className="px-0 sm:px-6 md:px-6"
                        >
                            Update
                        </Button>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-12 gap-3 w-full">
                <div className="col-span-12 xl:col-span-4 gap-2 md:gap-3 rounded-b p-2 md:p-4 h-auto lg:h-auto sm:h-auto xl:h-[440px] bg-white dark:bg-black border border-borderColor dark:border-borderColor-dark shadow">
                    <div className="grid grid-cols-12">
                        <div className="col-span-12 md:col-span-12 items-center justify-center">
                            <Fselect
                                name="SEGMENT_DTL_CODE"
                                option={SegmentDataDtl}
                                handleInputChange={handleInputChange}
                                title={"Segment"}
                                initialValue={formdata.SEGMENT_DTL_CODE}
                            />
                        </div>
                        <div className="col-span-12 md:col-span-12 items-center justify-center mt-2">
                            <Fselect
                                name="TERMS_DTL"
                                option={TermHeading}
                                handleInputChange={handleInputChange}
                                title={"Term Heading"}
                                initialValue={formdata.TERMS_DTL}
                            />
                        </div>
                        <div className="col-span-12 md:col-span-12 mt-3 items-center justify-center">
                            <ATextArea
                                rows={3}
                                title="Term Sub Heading"
                                name="SEQ_NO"
                                value={formdata.SEQ_NO}
                                handleInputChange={handleInputChange}
                            />

                        </div>
                        <div className="col-span-12 md:col-span-12 mt-3 items-center justify-center">
                            <ATextArea
                                rows={3}
                                title="Term Sub-sub Heading"
                                name="SUB_SEQ_NO"
                                value={formdata.SUB_SEQ_NO}
                                handleInputChange={handleInputChange}
                            />
                        </div>
                    </div>
                </div>

                <div className="col-span-12 xl:col-span-8">
                    <div className="grid grid-cols-12 gap-2 md:gap-3 rounded-b p-2 md:p-4 bg-white dark:bg-black border border-borderColor dark:border-borderColor-dark shadow">
                        <div className="col-span-12 xl:col-span-12">
                            <DataTable
                                columns={columns2}
                                data={tabledata2}
                                onRowDoubleClick={ondoubleclick2}
                                filterPosition="FilterData"
                                numericFilterColumns={[]}
                                height="300px"
                            />
                        </div>
                    </div>
                </div>
            </div>
            <HashloaderComponent isLoading={isLoading} />
        </main>
    );
};

export default Gatepass;