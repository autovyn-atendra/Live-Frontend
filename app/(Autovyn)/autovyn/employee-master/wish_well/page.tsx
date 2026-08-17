"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { MessageSquareHeart } from "lucide-react";
import DataTable from "@/components/Templates/interviewtable";
import Ainput from "@/components/atoms/Input";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import { toast } from "@/components/ui/use-toast"
import HashloaderComponent from "@/components/Templates/hashloader";


export default function WishWell() {
    const router = useRouter();
    const user: any = useCurrentUser();

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [occasion, setOccasion] = useState("1");
    const [selectedRows, setSelectedRows] = useState<any[]>([]);
    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split("T")[0]
    );

    // ================= TABLE COLUMNS =================

    const columns = [
        { Header: "Employee Code", accessor: "empcode" },
        { Header: "Employee Name", accessor: "empname" },
        { Header: "Location", accessor: "branch" },
        { Header: "Designation", accessor: "employeedesignation" },
        { Header: "Department", accessor: "labeldivision" },
        { Header: "DOB", accessor: "dob" },
        { Header: "DOJ", accessor: "currentjoindate" },
        { Header: "DOM", accessor: "dom" },
        { Header: "Mobile Number", accessor: "mobileno" },
    ];

    // ================= GET EMPLOYEE LIST =================

    const getWishEmployees = async (type: string) => {
        try {
            setLoading(true);
            setOccasion(type);

            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_URL}/pot_cust/getsendwishemp`,
                {
                    date: selectedDate,
                    occasion: type,
                    loc_code: user?.branch,
                },
                {
                    headers: {
                        compcode: user?.Comp_Code,
                        name: user?.name,
                    },
                }
            );

            console.log("Wish Employee API", res.data);

            if (res.data?.Status === "true") {
                setData(res.data.Result || []);
            } else {
                setData([]);
            }

            setSelectedRows([]);
        } catch (error) {
            console.error(error);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getWishEmployees("1");
    }, []);

    // ================= SEND WHATSAPP WISH =================

    const sendWish = async () => {
        try {
            if (selectedRows.length === 0) {
                toast({
                    title: "Warning",
                    description: "Please select the candidate to send Message",
                    variant: "destructive",
                });
                return;
            }

            const empcodes = selectedRows
                .map((item) => item.rowData.empcode)
                .join(",");

            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_URL}/pot_cust/sendwishonwhatsapp`,
                {
                    empcodes,
                    date: selectedDate,
                    occasion,
                },
                {
                    headers: {
                        compcode: user?.Comp_Code,
                        name: user?.name,
                    },
                }
            );

            if (res?.data) {
                toast({
                    title: "Success",
                    description: "Message sent successfully",
                })
                setSelectedRows([""]);

            }
        } catch (error) {
            console.error("Send Wish Error:", error);
            toast({
                title: "Error",
                description: "Send Wish Error",
                variant: "destructive",
            })
        }
    };

    return (
        <div className="p-2 grid gap-4 ">
            {/* ================= HEADER ================= */}
            <div className="bg-header flex items-center justify-between rounded-sm px-4 py-2">
                <div className="flex items-center gap-2 text-white font-bold">
                    <MessageSquareHeart className="h-5 w-5" />
                    <h1 className="text-xl">Wishwell</h1>
                </div>

                <Button
                    variant="print"
                    size="sm"
                    onClick={() => router.back()}
                >
                    Back
                </Button>
            </div>

            {/* ================= FILTER SECTION ================= */}

            <div className="bg-white rounded-md border border-borderColor-dark p-4">
                <div className="flex flex-wrap  gap-3 items-end">
                    <div className="w-[220px]">
                        <Ainput
                            title="Date"
                            type="date"
                            name="wishDate"
                            value={selectedDate}
                            handleInputChange={(name: string, value: string) => {
                                setSelectedDate(value);
                            }}
                            redlabel=""
                        />
                    </div>

                    <Button
                        variant="save"
                        onClick={() => getWishEmployees("1")}
                        size='sm'
                    >
                        Birthday
                    </Button>

                    <Button
                        variant="save"
                        onClick={() => getWishEmployees("2")}
                        size='sm'
                    >
                        Work Anniversary
                    </Button>

                    <Button
                        variant="save"
                        onClick={() => getWishEmployees("3")}
                        size='sm'
                    >
                        Marriage Anniversary
                    </Button>
                </div>
            </div>

            {/* ================= TABLE ================= */}

            <div className="p-4  border border-borderColor-dark bg-white rounded-md ">
                <DataTable
                columns={columns}
                data={data}
                selectValue="empcode"
                ischeckbox={true}
                selectedRows={selectedRows}
                setSelectedRows={setSelectedRows}
                height={400}
                onRowClick={(id :number, row :any) => {
                    console.log("Selected Row:", id, row);
                }}
                onRowDoubleClick={(id :number, row :any) => {
                    console.log("Double Click:", id, row);
                }}
            />
            <div className="w-sm">
                <Button
                    variant="update"
                    onClick={sendWish}
                    disabled={selectedRows.length === 0}
                    size='sm'
                >
                    Send WhatsApp Wish
                </Button>
            </div>
            </div>
            <HashloaderComponent isLoading={loading} />
        </div>
    );
}