"use client";

import DataTable from "@/components/Templates/ServiceTable";
import { Button } from "@/components/ui/button";
import { UserCog } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import axios from "axios";
import HashloaderComponent from "@/components/Templates/hashloader";


type Employee = {
    id: number;
    name: string;
    email: string;
    department: string;
};

export default function EmployeeView() {
    const router = useRouter();

    const [data, setData] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);

    // 📊 Columns (same UI)
    const columns = [
        { Header: "ID", accessor: "id" },
        { Header: "Name", accessor: "name" },
        { Header: "Email", accessor: "email" },
        { Header: "Department", accessor: "department" },
    ];

    // ================= FETCH API =================
    const getEmployees = async () => {
        try {
            setLoading(true);

            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_URL}/employee/SmEmplData`,
                {
                    multi_loc12: "1,2,3",
                    Created_by: "ma0019",
                },
                {
                    headers: {
                        accept: "application/json",
                        compcode: "autovyn",
                        name: "admin",
                        "Content-Type": "application/json",
                    },
                }
            );

            if (res.data?.success) {
                const apiData = res.data.data || [];

                // 🔥 mapping API → table format
                const formatted = apiData.map((item: any, index: number) => ({
                    id: item.SRNO || index + 1,
                    name: item.EMPFIRSTNAME + " " + item.EMPLASTNAME,
                    email: item.MOBILE_NO || "-",
                    department: item.EMPLOYEEDESIGNATION || "-",
                }));

                setData(formatted);
            }
        } catch (error) {
            console.error("Employee Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getEmployees();
    }, []);

    return (
        <div className="p-4 grid gap-4">

            {/* HEADER */}
            <div className="bg-header flex items-center justify-between rounded-sm px-4 py-2">
                <div className="flex items-center gap-2 text-white font-bold">
                    <UserCog className="h-5 w-5" />
                    <h1 className="text-xl">Employee Master View</h1>
                </div>

                <div className="flex gap-2">
                    <Button variant="print" size="sm">
                        Back
                    </Button>
                </div>
            </div>

            {/* TABLE */}
            <DataTable
                title={loading ? "Loading..." : "Employee List"}
                columns={columns}
                data={data}
                selectValue="id"
                // ischeckbox={true}
                height={300}
                onRowClick={(id: number, row: Employee) => {
                    console.log("Row clicked:", id, row);
                }}
                onRowDoubleClick={(row: Employee) => {
                    router.replace(
                        `/autovyn/employee-master/employee_update?id=${row.id}`
                    );
                }}
                filterPosition="FilterData"
                enableColumnFilters={true}
            />
            <HashloaderComponent isLoading={loading} />
        </div>
    );
}