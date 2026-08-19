"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import DataTable from "@/components/Templates/servicetable";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import ModelMasterUpdate from "./MasterUpdate/MasterUpdate";

const EmpTabs = () => {
    const user = useCurrentUser();

    const [activeTab, setActiveTab] = useState<number>(1);
    const [tableData, setTableData] = useState([]);
    const [modelToUpdate, setModelToUpdate] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [showTable, setShowTable] = useState(true);

    const fetchModelData = async () => {
        const payload = {
            multi_loc12: user?.branch,
            Created_by: user?.name,
        };

        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_URL}/quotation/getmodelData`,
                payload,
                {
                    headers: {
                        compcode: user?.Comp_Code,
                        name: user?.name,
                    },
                }
            );
            setTableData(response.data.data);
        } catch (error) {
            console.error("Error fetching model data:", error);
        }
    };

    useEffect(() => {
        fetchModelData();
    }, []);

    const handleTabClick = (tab: number) => {
        setActiveTab(tab);
        setShowForm(false);
        setShowTable(true);
        setModelToUpdate(null);
    };

    const handleRowDoubleClick = (rowData: any) => {
        setModelToUpdate(rowData);
        setShowForm(true);
        setShowTable(false);
    };

    const columns = [
        { Header: "SR. No.", accessor: "SRNO", align: "left" },
        { Header: "MODEL Name", accessor: "Misc_Name", align: "left" },
        { Header: "MODEL GROUP", accessor: "Modl_Grp", align: "left" },
        { Header: "VARIANT NAME", accessor: "Modl_Name", align: "left" },
        { Header: "VARIANT CODE", accessor: "Modl_Code", align: "left" },
    ];

    return (
        <div className="p-4">
            <div className="mb-4">
                <div className="flex w-fit bg-white rounded-lg dark:bg-primary px-1 py-0.5">
                    <button
                        className={`px-4 py-2 text-sm font-bold rounded uppercase ${activeTab === 1 ? "bg-primary text-white" : "bg-off dark:bg-dark"}`}
                        onClick={() => handleTabClick(1)}
                    >
                        Save Model
                    </button>
                    <button
                        className={`px-4 py-2 text-sm font-bold rounded uppercase ml-2 ${activeTab === 2 ? "bg-primary text-white" : "bg-off dark:bg-dark"}`}
                        onClick={() => handleTabClick(2)}
                    >
                        Update Model
                    </button>
                </div>
            </div>

            {activeTab === 1 && (
                <ModelMasterUpdate
                    update={null}
                    setShowForm={() => { }}
                    setShowTable={() => { }}
                    refetch={fetchModelData} // Pass this for Update
                />
            )}

            {activeTab === 2 && showTable && (
                <DataTable
                    title="Model List"
                    columns={columns}
                    data={tableData}
                    onRowDoubleClick={handleRowDoubleClick}
                    filterPosition="FilterData"
                    numericFilterColumns={[]}
                />
            )}

            {activeTab === 2 && showForm && (
                <ModelMasterUpdate
                    update={modelToUpdate}
                    setShowForm={setShowForm}
                    setShowTable={setShowTable}
                    refetch={fetchModelData} // Pass this for Update
                />
            )}
        </div>
    );
};

export default EmpTabs;
